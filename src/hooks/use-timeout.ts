/**
 * useTimeout - Delayed execution with automatic cleanup
 *
 * Executes a callback once after a delay and automatically
 * cleans up on component unmount.
 *
 * @example
 * // Basic usage
 * useTimeout(() => {
 *   console.log('Done!');
 * }, 1000);
 *
 * // With controls
 * const { cancel, start, isPending } = useTimeout(
 *   () => hideNotification(),
 *   3000,
 *   { enabled: showNotification() }
 * );
 */

import {
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
} from './context.js';

export interface UseTimeoutOptions {
  /** Whether the timeout is active (default: true) */
  enabled?: boolean;
}

export interface UseTimeoutReturn {
  /** Start/restart the timeout */
  start: () => void;
  /** Cancel the pending timeout */
  cancel: () => void;
  /** Check if timeout is pending */
  isPending: () => boolean;
}

interface TimeoutHookData {
  timerId: ReturnType<typeof setTimeout> | null;
  callback: () => void;
  delay: number;
  enabled: boolean;
  pending: boolean;
  start: () => void;
  cancel: () => void;
  isPending: () => boolean;
}

/**
 * useTimeout - Delayed execution with automatic cleanup
 *
 * @param callback - Function to execute after delay
 * @param delay - Delay in milliseconds
 * @param options - Configuration options
 * @returns Control functions for the timeout
 */
export function useTimeout(
  callback: () => void,
  delay: number,
  options: UseTimeoutOptions = {}
): UseTimeoutReturn {
  const { enabled = true } = options;

  const { value: hookData, isNew } = getHookState<TimeoutHookData | null>(null);

  if (isNew || hookData === null) {
    // First render - create the timeout state
    const hookIndex = getCurrentHookIndex();

    const data: TimeoutHookData = {
      timerId: null,
      callback,
      delay,
      enabled,
      pending: false,
      start: () => {
        const storedData = getHookStateByIndex(hookIndex) as TimeoutHookData | null;
        if (storedData) {
          // Cancel any existing timeout
          if (storedData.timerId !== null) {
            clearTimeout(storedData.timerId);
          }
          storedData.pending = true;
          storedData.timerId = setTimeout(() => {
            const currentData = getHookStateByIndex(hookIndex) as TimeoutHookData | null;
            if (currentData) {
              currentData.pending = false;
              currentData.timerId = null;
              currentData.callback();
            }
          }, storedData.delay);
        }
      },
      cancel: () => {
        const storedData = getHookStateByIndex(hookIndex) as TimeoutHookData | null;
        if (storedData && storedData.pending) {
          if (storedData.timerId !== null) {
            clearTimeout(storedData.timerId);
            storedData.timerId = null;
          }
          storedData.pending = false;
        }
      },
      isPending: () => {
        const storedData = getHookStateByIndex(hookIndex) as TimeoutHookData | null;
        return storedData?.pending ?? false;
      },
    };

    setHookState(hookIndex, data);

    // Start if enabled
    if (enabled) {
      data.start();
    }

    return {
      start: data.start,
      cancel: data.cancel,
      isPending: data.isPending,
    };
  } else {
    // Subsequent render - update callback
    hookData.callback = callback;
    hookData.delay = delay;

    // Handle enabled state changes
    if (enabled !== hookData.enabled) {
      hookData.enabled = enabled;
      if (enabled) {
        hookData.start();
      } else {
        hookData.cancel();
      }
    }

    return {
      start: hookData.start,
      cancel: hookData.cancel,
      isPending: hookData.isPending,
    };
  }
}

/**
 * Cleanup function to be called on unmount
 */
export function cleanupTimeout(hookData: TimeoutHookData): void {
  if (hookData.timerId !== null) {
    clearTimeout(hookData.timerId);
    hookData.timerId = null;
  }
  hookData.pending = false;
}
