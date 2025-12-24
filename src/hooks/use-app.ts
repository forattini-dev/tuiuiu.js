/**
 * useApp - Application context and lifecycle management
 */

import { batch } from '../primitives/signal.js';
import {
  getAppContext,
  setAppContext,
  emitInput,
  clearInputHandlers,
  setFocusManager,
} from './context.js';
import { parseKeypress } from './use-input.js';
import { parseMouseEvent, isMouseEvent, enableMouseTracking, disableMouseTracking } from './use-mouse.js';
import { getHitTestRegistry } from '../core/hit-test.js';
import { FocusManagerImpl } from './use-focus.js';
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
    throw new Error('useApp must be called within a Reck app');
  }
  return appContext;
}

/** App initialization options */
export interface InitAppOptions {
  /** Enable automatic Tab/Shift+Tab navigation (default: true) */
  autoTabNavigation?: boolean;
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

  const exitCallbacks: (() => void)[] = [];
  let isExiting = false;
  let autoTabNavigation = initialAutoTab;

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

  // Initialize focus manager
  const focusManager = new FocusManagerImpl();
  setFocusManager(focusManager);

  // Handle input
  const handleData = (data: Buffer) => {
    let rawInput = data.toString();

    // Loop through input to handle batched events (mouse + keys)
    while (rawInput.length > 0) {
      // Check for mouse events FIRST
      if (isMouseEvent(rawInput)) {
        const mouseResult = parseMouseEvent(rawInput);
        if (mouseResult) {
          // Dispatch to hit-test registry
          batch(() => {
            getHitTestRegistry().handleMouseEvent(mouseResult.event);
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
  };

  setAppContext(appContext);

  return appContext;
}

/**
 * Cleanup app context
 */
export function cleanupApp(): void {
  clearInputHandlers();
  setFocusManager(null);
  setAppContext(null);
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
