/**
 * useInterval - Recurring timer with automatic cleanup
 *
 * Executes a callback at regular intervals and automatically
 * cleans up on component unmount.
 *
 * @example
 * // Basic usage
 * useInterval(() => {
 *   console.log('Tick!');
 * }, 1000);
 *
 * // With controls
 * const { stop, start, isRunning } = useInterval(
 *   () => drawNextPixel(),
 *   25,
 *   { enabled: hasPixels() }
 * );
 */

import {
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
} from './context.js';

export interface UseIntervalOptions {
  /** Whether the interval is active (default: true) */
  enabled?: boolean;
  /** Run callback immediately on mount (default: false) */
  immediate?: boolean;
}

export interface UseIntervalReturn {
  /** Start the interval */
  start: () => void;
  /** Stop the interval */
  stop: () => void;
  /** Check if interval is currently running */
  isRunning: () => boolean;
}

interface IntervalHookData {
  timerId: ReturnType<typeof setInterval> | null;
  callback: () => void;
  delay: number;
  enabled: boolean;
  running: boolean;
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
}

/**
 * useInterval - Recurring timer with automatic cleanup
 *
 * @param callback - Function to execute on each interval
 * @param delay - Interval delay in milliseconds
 * @param options - Configuration options
 * @returns Control functions for the interval
 */
export function useInterval(
  callback: () => void,
  delay: number,
  options: UseIntervalOptions = {}
): UseIntervalReturn {
  const { enabled = true, immediate = false } = options;

  const { value: hookData, isNew } = getHookState<IntervalHookData | null>(null);

  if (isNew || hookData === null) {
    // First render - create the interval state
    const hookIndex = getCurrentHookIndex();

    const data: IntervalHookData = {
      timerId: null,
      callback,
      delay,
      enabled,
      running: false,
      start: () => {
        const storedData = getHookStateByIndex(hookIndex) as IntervalHookData | null;
        if (storedData && !storedData.running) {
          storedData.running = true;
          storedData.timerId = setInterval(() => {
            const currentData = getHookStateByIndex(hookIndex) as IntervalHookData | null;
            if (currentData) {
              currentData.callback();
            }
          }, storedData.delay);
        }
      },
      stop: () => {
        const storedData = getHookStateByIndex(hookIndex) as IntervalHookData | null;
        if (storedData && storedData.running) {
          if (storedData.timerId !== null) {
            clearInterval(storedData.timerId);
            storedData.timerId = null;
          }
          storedData.running = false;
        }
      },
      isRunning: () => {
        const storedData = getHookStateByIndex(hookIndex) as IntervalHookData | null;
        return storedData?.running ?? false;
      },
    };

    setHookState(hookIndex, data);

    // Start if enabled
    if (enabled) {
      // Run immediately if requested
      if (immediate) {
        callback();
      }
      data.start();
    }

    return {
      start: data.start,
      stop: data.stop,
      isRunning: data.isRunning,
    };
  } else {
    // Subsequent render - update callback and check enabled state
    hookData.callback = callback;
    hookData.delay = delay;

    // Handle enabled state changes
    if (enabled !== hookData.enabled) {
      hookData.enabled = enabled;
      if (enabled) {
        hookData.start();
      } else {
        hookData.stop();
      }
    }

    return {
      start: hookData.start,
      stop: hookData.stop,
      isRunning: hookData.isRunning,
    };
  }
}

/**
 * Cleanup function to be called on unmount
 * This should be called by the render loop when a component unmounts
 */
export function cleanupInterval(hookData: IntervalHookData): void {
  if (hookData.timerId !== null) {
    clearInterval(hookData.timerId);
    hookData.timerId = null;
  }
  hookData.running = false;
}
