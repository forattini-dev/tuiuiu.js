/**
 * useApp - Application context and lifecycle management
 */

import { batch } from '../primitives/signal.js';
import { getCapabilities } from '../core/capabilities.js';
import { parseFocusEvent } from '../core/input.js';
import {
  createTerminalInputStream,
  type TerminalInputStreamEvent,
} from '../core/input-stream.js';
import { createTerminalSession } from '../core/terminal-session.js';
import {
  getAppContext,
  setAppContext,
  emitInput,
  emitPaste,
  emitMouseEvent,
  clearInputHandlers,
  clearPasteHandlers,
  clearMouseHandlers,
  setFocusManager,
  getRuntimeScopeForApp,
} from './context.js';
import { parseKeypress } from './use-input.js';
import {
  forceDisableMouseTracking,
  isMouseEvent,
  parseMouseEvent,
  removeMouseExitHandlers,
} from './use-mouse.js';
import { getHitTestRegistry } from '../core/hit-test.js';
import { readTerminalFocus, resetTerminalFocusState, setTerminalFocusState } from '../core/terminal-focus.js';
import { FocusZoneManagerAdapter } from './use-focus.js';
import type { AppContext } from './types.js';
import {
  bindRuntimeScope,
  createRuntimeScope,
  unregisterRuntimeScope,
} from '../core/runtime-scope.js';

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
  /** Maximum incomplete terminal sequence retained between chunks (default: 4 KiB) */
  maxPendingEscapeBytes?: number;
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
    maxPendingEscapeBytes = 4096,
    escapeSequenceTimeoutMs = 25,
    pasteTimeoutMs = 30_000,
  } = options;
  if (!Number.isSafeInteger(maxPasteBytes) || maxPasteBytes < 1) {
    throw new Error('[tuiuiu] maxPasteBytes must be a positive safe integer');
  }
  if (!Number.isSafeInteger(maxPendingEscapeBytes) || maxPendingEscapeBytes < 1) {
    throw new Error('[tuiuiu] maxPendingEscapeBytes must be a positive safe integer');
  }
  if (!Number.isFinite(escapeSequenceTimeoutMs) || escapeSequenceTimeoutMs < 0) {
    throw new Error('[tuiuiu] escapeSequenceTimeoutMs must be a non-negative number');
  }
  if (!Number.isFinite(pasteTimeoutMs) || pasteTimeoutMs < 0) {
    throw new Error('[tuiuiu] pasteTimeoutMs must be a non-negative number');
  }
  const runtimeScope = createRuntimeScope();
  const outputIsTTY = 'isTTY' in stdout ? !!(stdout as NodeJS.WriteStream & { isTTY?: boolean }).isTTY : true;

  const exitCallbacks = new Set<(error?: Error) => void>();
  let isExiting = false;
  let disposed = false;
  let autoTabNavigation = initialAutoTab;
  let appContext: AppContext;
  const focusTrackingEnabled = Boolean(stdin.isTTY && outputIsTTY && getCapabilities().focusEvents);
  const terminalSession = createTerminalSession({
    stdin,
    stdout,
    focusEvents: focusTrackingEnabled,
    bracketedPaste: true,
  });
  const setRawMode = terminalSession.setRawMode;
  const isRawModeEnabled = terminalSession.isRawModeEnabled;

  terminalSession.start();
  resetTerminalFocusState(runtimeScope);

  // Initialize focus manager (using modern FocusZoneManagerAdapter)
  const focusManager = new FocusZoneManagerAdapter();
  setFocusManager(focusManager, runtimeScope);

  const inputStream = createTerminalInputStream({
    maxPasteBytes,
    maxPendingEscapeBytes,
  });
  let pasteTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingInputTimer: ReturnType<typeof setTimeout> | null = null;

  const clearPasteTimer = (): void => {
    if (pasteTimer) {
      clearTimeout(pasteTimer);
      pasteTimer = null;
    }
  };

  const armPasteTimer = (): void => {
    clearPasteTimer();
    pasteTimer = setTimeout(() => {
      inputStream.abortPaste();
      pasteTimer = null;
    }, Math.max(0, pasteTimeoutMs));
  };

  // Handle decoded, complete input.
  const processRawInput = (decodedInput: string): void => {
    let rawInput = decodedInput;

    // Loop through input to handle batched events (mouse + keys)
    while (rawInput.length > 0) {
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

  const dispatchStreamEvents = (
    events: TerminalInputStreamEvent[],
  ): void => {
    for (const event of events) {
      if (disposed) return;
      if (event.type === 'paste') {
        batch(() => {
          emitPaste(event.text, event.bracketed);
        });
      } else {
        processRawInput(event.input);
      }
    }
  };

  const synchronizeStreamTimers = (): void => {
    if (disposed) return;
    if (pendingInputTimer) {
      clearTimeout(pendingInputTimer);
      pendingInputTimer = null;
    }
    if (inputStream.status.pendingEscapeBytes > 0) {
      pendingInputTimer = setTimeout(
        flushPendingInput,
        Math.max(0, escapeSequenceTimeoutMs),
      );
    }

    if (inputStream.status.pasteActive) {
      armPasteTimer();
    } else {
      clearPasteTimer();
    }
  };

  const flushPendingInput = (): void => {
    pendingInputTimer = null;
    if (disposed) return;
    dispatchStreamEvents(inputStream.flushPendingInput());
    synchronizeStreamTimers();
  };

  // Decode UTF-8 and frame terminal input independently of stream chunking.
  const handleData = bindRuntimeScope(runtimeScope, (data: Buffer | string): void => {
    if (disposed) return;
    dispatchStreamEvents(inputStream.push(data));
    synchronizeStreamTimers();
  });

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
    inputStream.dispose();

    terminalSession.dispose();
    resetTerminalFocusState(runtimeScope);
    clearInputHandlers(runtimeScope);
    clearPasteHandlers(runtimeScope);
    clearMouseHandlers(runtimeScope);
    forceDisableMouseTracking(runtimeScope);
    removeMouseExitHandlers(runtimeScope);
    setFocusManager(null, runtimeScope);
    if (getAppContext(runtimeScope) === appContext) {
      setAppContext(null, runtimeScope);
    }
    unregisterRuntimeScope(runtimeScope);
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
      return terminalSession.rawModeEnabledCount;
    },
    isRawModeEnabled,
    isTerminalFocused: () => readTerminalFocus(runtimeScope),
    enqueueExternalUpdate: (update) => {
      batch(() => {
        update();
      });
    },
    flushExternalUpdates: () => {},
    hasPendingExternalUpdates: () => false,
  };

  setAppContext(appContext, runtimeScope);

  return appContext;
}

/**
 * Cleanup app context
 */
export function cleanupApp(targetAppContext?: AppContext): void {
  const scope = targetAppContext
    ? getRuntimeScopeForApp(targetAppContext) ?? undefined
    : undefined;
  const appContext = targetAppContext ?? getAppContext(scope);
  if (typeof appContext?.dispose === 'function') {
    appContext.dispose();
  }
  clearInputHandlers(scope);
  clearPasteHandlers(scope);
  clearMouseHandlers(scope);
  setFocusManager(null, scope);
  setAppContext(null, scope);
  resetTerminalFocusState(scope);
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
