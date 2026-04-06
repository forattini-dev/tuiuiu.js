/**
 * useApp - Application context and lifecycle management
 */

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
}

export interface ExternalUpdateIngress {
  enqueue: (update: () => void) => void;
  flush: () => void;
  isPending: () => boolean;
}

/**
 * Initialize app context and input handling
 */
export function initializeApp(
  stdin: NodeJS.ReadStream,
  stdout: NodeJS.WriteStream,
  options: InitAppOptions = {}
): AppContext {
  const { autoTabNavigation: initialAutoTab = true } = options;
  const outputIsTTY = 'isTTY' in stdout ? !!(stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY : true;

  const exitCallbacks: (() => void)[] = [];
  let isExiting = false;
  let autoTabNavigation = initialAutoTab;
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
        stdin.setRawMode(true);
      }
    } else {
      rawModeEnabledCount = Math.max(0, rawModeEnabledCount - 1);
      if (rawModeEnabledCount === 0) {
        // Last release - disable raw mode
        stdin.setRawMode(false);
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

  // Heuristic paste detection: input longer than this with no escape
  // sequences is likely a paste in terminals without bracketed paste support
  const PASTE_HEURISTIC_THRESHOLD = 32;

  // Handle input
  const handleData = (data: Buffer) => {
    let rawInput = data.toString();

    // --- Bracketed paste accumulation ---
    // If we're in the middle of collecting a bracketed paste, keep buffering
    if (pasteBuffer !== null) {
      const endIdx = rawInput.indexOf(PASTE_END);
      if (endIdx === -1) {
        // No end marker yet — accumulate entire chunk
        pasteBuffer += rawInput;
        return;
      }
      // Found end marker — complete the paste
      pasteBuffer += rawInput.slice(0, endIdx);
      batch(() => {
        emitPaste(pasteBuffer!, true);
      });
      pasteBuffer = null;
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
          processNonPasteInput(before);
        }

        // Look for paste end in the same chunk
        const afterStart = rawInput.slice(pasteStartIdx + PASTE_START.length);
        const endIdx = afterStart.indexOf(PASTE_END);
        if (endIdx !== -1) {
          // Complete paste in one chunk
          const pasteText = afterStart.slice(0, endIdx);
          batch(() => {
            emitPaste(pasteText, true);
          });
          rawInput = afterStart.slice(endIdx + PASTE_END.length);
          continue;
        } else {
          // Paste spans multiple data events — start buffering
          pasteBuffer = afterStart;
          return;
        }
      }

      // Heuristic paste detection for terminals without bracketed paste
      // Large input without escape sequences is likely a paste
      if (rawInput.length > PASTE_HEURISTIC_THRESHOLD && !rawInput.includes('\x1b')) {
        batch(() => {
          emitPaste(rawInput, false);
        });
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

      // Ctrl+C always exits
      if (key.ctrl && input === 'c') {
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

  /** Process non-paste input (before a paste marker or standalone) */
  function processNonPasteInput(raw: string): void {
    let remaining = raw;
    while (remaining.length > 0) {
      const focusEvent = parseFocusEvent(remaining.slice(0, 3));
      if (focusEvent) {
        batch(() => { setTerminalFocusState(focusEvent.focused); });
        remaining = remaining.slice(3);
        continue;
      }
      if (isMouseEvent(remaining)) {
        const mouseResult = parseMouseEvent(remaining);
        if (mouseResult) {
          batch(() => {
            getHitTestRegistry().handleMouseEvent(mouseResult.event);
            emitMouseEvent(mouseResult.event);
          });
          remaining = remaining.slice(mouseResult.length);
          continue;
        }
      }
      const { input, key, length } = parseKeypress(remaining);
      const consumed = length > 0 ? length : 1;
      remaining = remaining.slice(consumed);
      if (key.ctrl && input === 'c') { exit(); return; }
      batch(() => { emitInput(input, key); });
    }
  }

  stdin.on('data', handleData);

  const exit = (error?: Error) => {
    if (isExiting) return;
    isExiting = true;

    // Cleanup
    stdin.off('data', handleData);

    // Force disable raw mode regardless of count
    rawModeEnabledCount = 0;
    if (stdin.isTTY && stdin.setRawMode) {
      stdin.setRawMode(false);
    }
    if (focusTrackingEnabled && typeof stdout.write === 'function') {
      stdout.write(disableFocusEvents());
    }
    // Disable bracketed paste mode
    if (typeof stdout.write === 'function') {
      stdout.write(disableBracketedPaste());
    }
    resetTerminalFocusState();

    // Call exit callbacks
    for (const callback of exitCallbacks) {
      callback();
    }

    // Exit process
    if (error) {
      console.error(error);
      process.exit(1);
    } else {
      process.exit(0);
    }
  };

  // Store context
  const appContext: AppContext = {
    exit,
    stdin,
    stdout,
    onExit: (callback) => exitCallbacks.push(callback),
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
