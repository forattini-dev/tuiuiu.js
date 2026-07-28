/**
 * useApp - Application context and lifecycle management
 */

import { StringDecoder } from 'node:string_decoder';
import { batch } from '../primitives/signal.js';
import { getCapabilities } from '../core/capabilities.js';
import {
  enableFocusEvents,
  disableFocusEvents,
  parseFocusEvent,
  enableBracketedPaste,
  disableBracketedPaste,
  PASTE_START,
  PASTE_END,
} from '../core/input.js';
import {
  getAppContext,
  setAppContext,
  emitInput,
  emitPaste,
  emitMouseEvent,
  clearInputHandlers,
  clearPasteHandlers,
  setFocusManager,
} from './context.js';
import { parseKeypress } from './use-input.js';
import { parseMouseEvent, isMouseEvent } from './use-mouse.js';
import { getHitTestRegistry } from '../core/hit-test.js';
import { readTerminalFocus, resetTerminalFocusState, setTerminalFocusState } from '../core/terminal-focus.js';
import { FocusZoneManagerAdapter } from './use-focus.js';
import type { AppContext } from './types.js';

export type { AppContext };

/**
 * useApp - Access app control
 *
 * @example
 * const { exit } = useApp();
 * if (done) exit();
 */
export function useApp(): AppContext {
  const appContext = getAppContext();
  if (!appContext) {
    throw new Error('useApp must be called within a Tuiuiu app');
  }
  return appContext;
}

/** App initialization options */
export interface InitAppOptions {
  /** Enable automatic Tab/Shift+Tab navigation (default: true) */
  autoTabNavigation?: boolean;
  /** Exit when Ctrl+C is received (default: true) */
  exitOnCtrlC?: boolean;
  /** Terminate the Node.js process from exit() (default: false) */
  exitProcess?: boolean;
  /** Maximum accepted paste size in UTF-8 bytes (default: 1 MiB) */
  maxPasteBytes?: number;
  /** Time to wait for the rest of a split escape sequence (default: 25ms) */
  escapeSequenceTimeoutMs?: number;
  /** Time to wait for a bracketed paste terminator (default: 30s) */
  pasteTimeoutMs?: number;
}

export interface ExternalUpdateIngress {
  enqueue: (update: () => void) => void;
  flush: () => void;
  isPending: () => boolean;
}

function incompleteEscapeStart(input: string): number {
  let cursor = 0;

  while (cursor < input.length) {
    const start = input.indexOf('\x1b', cursor);
    if (start === -1) return -1;
    if (start + 1 >= input.length) return start;

    const introducer = input[start + 1];
    if (introducer === '[') {
      let end = start + 2;
      while (end < input.length) {
        const code = input.charCodeAt(end);
        if (code >= 0x40 && code <= 0x7e) break;
        end++;
      }
      if (end >= input.length) return start;
      cursor = end + 1;
      continue;
    }

    if (introducer === ']' || introducer === 'P' || introducer === '^' || introducer === '_') {
      let end = start + 2;
      let complete = false;
      while (end < input.length) {
        if (introducer === ']' && input.charCodeAt(end) === 0x07) {
          end++;
          complete = true;
          break;
        }
        if (input[end] === '\x1b' && input[end + 1] === '\\') {
          end += 2;
          complete = true;
          break;
        }
        end++;
      }
      if (!complete) return start;
      cursor = end;
      continue;
    }

    if (introducer === 'O' && start + 2 >= input.length) return start;
    cursor = Math.min(input.length, start + (introducer === 'O' ? 3 : 2));
  }

  return -1;
}

function splitIncompleteInput(input: string): { complete: string; pending: string } {
  const start = incompleteEscapeStart(input);
  if (start === -1) return { complete: input, pending: '' };
  return {
    complete: input.slice(0, start),
    pending: input.slice(start),
  };
}

/**
 * Initialize app context and input handling
 */
export function initializeApp(
  stdin: NodeJS.ReadStream,
  stdout: NodeJS.WriteStream,
  options: InitAppOptions = {}
): AppContext {
  if (getAppContext()) {
    throw new Error(
      '[tuiuiu] Only one active app is supported per process. ' +
      'Unmount or dispose the current app before rendering another.',
    );
  }
  const {
    autoTabNavigation: initialAutoTab = true,
    exitOnCtrlC = true,
    exitProcess = false,
    maxPasteBytes = 1024 * 1024,
    escapeSequenceTimeoutMs = 25,
    pasteTimeoutMs = 30_000,
  } = options;
  if (!Number.isSafeInteger(maxPasteBytes) || maxPasteBytes < 1) {
    throw new Error('[tuiuiu] maxPasteBytes must be a positive safe integer');
  }
  if (!Number.isFinite(escapeSequenceTimeoutMs) || escapeSequenceTimeoutMs < 0) {
    throw new Error('[tuiuiu] escapeSequenceTimeoutMs must be a non-negative number');
  }
  if (!Number.isFinite(pasteTimeoutMs) || pasteTimeoutMs < 0) {
    throw new Error('[tuiuiu] pasteTimeoutMs must be a non-negative number');
  }
  const outputIsTTY = 'isTTY' in stdout ? !!(stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY : true;
  const initialRawMode = Boolean(stdin.isRaw);
  const inputWasPaused = typeof stdin.isPaused === 'function' && stdin.isPaused();

  const exitCallbacks = new Set<(error?: Error) => void>();
  let isExiting = false;
  let disposed = false;
  let autoTabNavigation = initialAutoTab;
  let appContext: AppContext;
  const focusTrackingEnabled = Boolean(stdin.isTTY && outputIsTTY && getCapabilities().focusEvents);

  // Raw mode reference counting
  let rawModeEnabledCount = 0;

  /**
   * Set raw mode with reference counting
   *
   * Multiple components can request raw mode. Raw mode is enabled when
   * count > 0 and disabled when count reaches 0.
   */
  const setRawMode = (enabled: boolean): void => {
    if (!stdin.isTTY || !stdin.setRawMode) return;

    if (enabled) {
      rawModeEnabledCount++;
      if (rawModeEnabledCount === 1) {
        // First request - enable raw mode
        if (!initialRawMode) stdin.setRawMode(true);
      }
    } else {
      rawModeEnabledCount = Math.max(0, rawModeEnabledCount - 1);
      if (rawModeEnabledCount === 0) {
        // Last release - restore the state owned by the host process.
        stdin.setRawMode(initialRawMode);
      }
    }
  };

  const isRawModeEnabled = (): boolean => {
    return rawModeEnabledCount > 0;
  };

  // Setup initial raw mode for input (count as 1 reference)
  setRawMode(true);
  stdin.resume();
  resetTerminalFocusState();

  if (focusTrackingEnabled && typeof stdout.write === 'function') {
    stdout.write(enableFocusEvents());
  }

  // Enable bracketed paste mode for paste detection
  if (typeof stdout.write === 'function') {
    stdout.write(enableBracketedPaste());
  }

  // Initialize focus manager (using modern FocusZoneManagerAdapter)
  const focusManager = new FocusZoneManagerAdapter();
  setFocusManager(focusManager);

  // Bracketed paste state machine
  let pasteBuffer: string | null = null;
  let pasteOverflowed = false;
  let pasteTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingInput = '';
  let pendingInputTimer: ReturnType<typeof setTimeout> | null = null;
  const decoder = new StringDecoder('utf8');

  // Heuristic paste detection: input longer than this with no escape
  // sequences is likely a paste in terminals without bracketed paste support
  const PASTE_HEURISTIC_THRESHOLD = 32;

  const clearPasteTimer = (): void => {
    if (pasteTimer) {
      clearTimeout(pasteTimer);
      pasteTimer = null;
    }
  };

  const armPasteTimer = (): void => {
    clearPasteTimer();
    pasteTimer = setTimeout(() => {
      pasteBuffer = null;
      pasteOverflowed = false;
      pasteTimer = null;
    }, Math.max(0, pasteTimeoutMs));
  };

  const appendPaste = (text: string): void => {
    if (pasteBuffer === null || pasteOverflowed) return;
    if (Buffer.byteLength(pasteBuffer, 'utf8') + Buffer.byteLength(text, 'utf8') > maxPasteBytes) {
      pasteBuffer = '';
      pasteOverflowed = true;
      return;
    }
    pasteBuffer += text;
  };

  const emitBoundedPaste = (text: string, bracketed: boolean): void => {
    if (Buffer.byteLength(text, 'utf8') > maxPasteBytes) return;
    batch(() => {
      emitPaste(text, bracketed);
    });
  };

  // Handle decoded, complete input.
  const processRawInput = (decodedInput: string): void => {
    let rawInput = decodedInput;

    // --- Bracketed paste accumulation ---
    // If we're in the middle of collecting a bracketed paste, keep buffering
    if (pasteBuffer !== null) {
      const endIdx = rawInput.indexOf(PASTE_END);
      if (endIdx === -1) {
        appendPaste(rawInput);
        armPasteTimer();
        return;
      }
      appendPaste(rawInput.slice(0, endIdx));
      if (!pasteOverflowed) {
        emitBoundedPaste(pasteBuffer, true);
      }
      pasteBuffer = null;
      pasteOverflowed = false;
      clearPasteTimer();
      rawInput = rawInput.slice(endIdx + PASTE_END.length);
      if (rawInput.length === 0) return;
    }

    // Loop through input to handle batched events (mouse + keys)
    while (rawInput.length > 0) {
      // Check for bracketed paste start
      const pasteStartIdx = rawInput.indexOf(PASTE_START);
      if (pasteStartIdx !== -1) {
        // Process any input before the paste marker
        const before = rawInput.slice(0, pasteStartIdx);
        if (before.length > 0) {
          processRawInput(before);
        }

        // Look for paste end in the same chunk
        const afterStart = rawInput.slice(pasteStartIdx + PASTE_START.length);
        const endIdx = afterStart.indexOf(PASTE_END);
        if (endIdx !== -1) {
          // Complete paste in one chunk
          const pasteText = afterStart.slice(0, endIdx);
          emitBoundedPaste(pasteText, true);
          rawInput = afterStart.slice(endIdx + PASTE_END.length);
          continue;
        } else {
          // Paste spans multiple data events - start bounded buffering.
          pasteBuffer = '';
          pasteOverflowed = false;
          appendPaste(afterStart);
          armPasteTimer();
          return;
        }
      }

      // Heuristic paste detection for terminals without bracketed paste
      // Large input without escape sequences is likely a paste
      if (rawInput.length > PASTE_HEURISTIC_THRESHOLD && !rawInput.includes('\x1b')) {
        emitBoundedPaste(rawInput, false);
        return;
      }

      const focusEvent = parseFocusEvent(rawInput.slice(0, 3));
      if (focusEvent) {
        batch(() => {
          setTerminalFocusState(focusEvent.focused);
        });
        rawInput = rawInput.slice(3);
        continue;
      }

      // Check for mouse events FIRST
      if (isMouseEvent(rawInput)) {
        const mouseResult = parseMouseEvent(rawInput);
        if (mouseResult) {
          batch(() => {
            // Dispatch to hit-test registry
            getHitTestRegistry().handleMouseEvent(mouseResult.event);
            // Emit to registered mouse handlers (useMouse consumers)
            emitMouseEvent(mouseResult.event);
          });

          // Consume and continue
          rawInput = rawInput.slice(mouseResult.length);
          continue;
        }
      }

      // Not a mouse event, parse as key
      const { input, key, length } = parseKeypress(rawInput);

      // Consume processed part
      const consumed = length > 0 ? length : 1; // Safety fallback
      rawInput = rawInput.slice(consumed);

      if (exitOnCtrlC && key.ctrl && input === 'c') {
        exit();
        return;
      }

      // Automatic Tab navigation
      if (autoTabNavigation) {
        if (key.tab && !key.shift) {
          // Tab - focus next
          batch(() => {
            focusManager.focusNext();
          });
          continue; // Don't propagate Tab to handlers
        }

        if (key.tab && key.shift) {
          // Shift+Tab - focus previous
          batch(() => {
            focusManager.focusPrevious();
          });
          continue; // Don't propagate Shift+Tab to handlers
        }

        if (key.escape) {
          // Escape - blur focus (only if something is focused)
          if (focusManager.getActiveId() !== undefined) {
            batch(() => {
              focusManager.blur();
            });
            continue; // Don't propagate Escape to handlers when blurring
          }
        }
      }

      // Emit input event to all handlers (wrapped in batch for single re-render)
      batch(() => {
        emitInput(input, key);
      });
    }
  };

  const flushPendingInput = (): void => {
    pendingInputTimer = null;
    if (!pendingInput || disposed) return;
    const input = pendingInput;
    pendingInput = '';
    processRawInput(input);
  };

  // Decode UTF-8 across chunks, and hold only an incomplete terminal sequence.
  const handleData = (data: Buffer | string): void => {
    if (disposed) return;
    const decoded = typeof data === 'string' ? data : decoder.write(data);
    const combined = pendingInput + decoded;
    pendingInput = '';
    if (pendingInputTimer) {
      clearTimeout(pendingInputTimer);
      pendingInputTimer = null;
    }

    const { complete, pending } = splitIncompleteInput(combined);
    if (complete) processRawInput(complete);
    if (pending) {
      pendingInput = pending;
      pendingInputTimer = setTimeout(flushPendingInput, Math.max(0, escapeSequenceTimeoutMs));
    }
  };

  stdin.on('data', handleData);

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;

    stdin.off('data', handleData);
    if (pendingInputTimer) {
      clearTimeout(pendingInputTimer);
      pendingInputTimer = null;
    }
    clearPasteTimer();
    pendingInput = '';
    pasteBuffer = null;
    pasteOverflowed = false;
    decoder.end();

    rawModeEnabledCount = 0;
    if (stdin.isTTY && stdin.setRawMode) {
      stdin.setRawMode(initialRawMode);
    }
    if (inputWasPaused && typeof stdin.pause === 'function') stdin.pause();
    if (focusTrackingEnabled && typeof stdout.write === 'function') {
      stdout.write(disableFocusEvents());
    }
    if (typeof stdout.write === 'function') {
      stdout.write(disableBracketedPaste());
    }
    resetTerminalFocusState();
    clearInputHandlers();
    clearPasteHandlers();
    setFocusManager(null);
    if (getAppContext() === appContext) {
      setAppContext(null);
    }
  };

  const exit = (error?: Error) => {
    if (isExiting) return;
    isExiting = true;

    dispose();

    for (const callback of [...exitCallbacks]) {
      callback(error);
    }
    exitCallbacks.clear();

    if (error) {
      console.error(error);
    }
    if (exitProcess) {
      process.exit(error ? 1 : 0);
    }
  };

  // Store context
  appContext = {
    exit,
    dispose,
    stdin,
    stdout,
    onExit: (callback) => {
      exitCallbacks.add(callback);
      return () => {
        exitCallbacks.delete(callback);
      };
    },
    autoTabNavigation,
    setAutoTabNavigation: (enabled: boolean) => {
      autoTabNavigation = enabled;
    },
    setRawMode,
    get rawModeEnabledCount() {
      return rawModeEnabledCount;
    },
    isRawModeEnabled,
    isTerminalFocused: () => readTerminalFocus(),
    enqueueExternalUpdate: (update) => {
      batch(() => {
        update();
      });
    },
    flushExternalUpdates: () => {},
    hasPendingExternalUpdates: () => false,
  };

  setAppContext(appContext);

  return appContext;
}

/**
 * Cleanup app context
 */
export function cleanupApp(): void {
  const appContext = getAppContext();
  if (typeof appContext?.dispose === 'function') {
    appContext.dispose();
  }
  clearInputHandlers();
  clearPasteHandlers();
  setFocusManager(null);
  setAppContext(null);
  resetTerminalFocusState();
}

/**
 * Set the clearScreen method on the app context.
 * Called by render-loop after logUpdate is created.
 */
export function setClearScreen(clearScreen: () => void): void {
  const appContext = getAppContext();
  if (appContext) {
    appContext.clearScreen = clearScreen;
  }
}

/**
 * Set the external async update ingress on the app context.
 * Called by the render loop once it knows the frame budget.
 */
export function setExternalUpdateIngress(ingress: ExternalUpdateIngress | null): void {
  const appContext = getAppContext();
  if (!appContext) {
    return;
  }

  if (!ingress) {
    appContext.enqueueExternalUpdate = (update) => {
      batch(() => {
        update();
      });
    };
    appContext.flushExternalUpdates = () => {};
    appContext.hasPendingExternalUpdates = () => false;
    return;
  }

  appContext.enqueueExternalUpdate = ingress.enqueue;
  appContext.flushExternalUpdates = ingress.flush;
  appContext.hasPendingExternalUpdates = ingress.isPending;
}
