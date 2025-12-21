/**
 * Update Batcher - Throttle high-frequency updates
 *
 * When rendering rapidly changing content (like job outputs),
 * we need to throttle updates to prevent excessive re-renders
 * and flickering.
 *
 * This utility batches updates into intervals, only flushing
 * to the screen at fixed intervals (default: 200ms).
 *
 * @example
 * ```typescript
 * const batcher = createUpdateBatcher(() => {
 *   // This runs at most every 200ms
 *   renderOutput(currentOutput);
 * });
 *
 * // Called many times rapidly
 * onJobOutput((chunk) => {
 *   currentOutput += chunk;
 *   batcher.schedule(); // Batches updates
 * });
 *
 * // When job completes, flush immediately
 * onJobComplete(() => {
 *   batcher.flush();
 * });
 * ```
 */

export interface UpdateBatcher {
  /** Schedule a batched update */
  schedule: () => void;
  /** Flush immediately, canceling any pending update */
  flush: () => void;
  /** Cancel any pending update without flushing */
  cancel: () => void;
  /** Check if an update is pending */
  isPending: () => boolean;
}

/**
 * Create an update batcher for throttling high-frequency updates
 *
 * @param flushFn - Function to call when flushing updates
 * @param interval - Minimum time between updates (default: 200ms)
 */
export function createUpdateBatcher(
  flushFn: () => void,
  interval: number = 200
): UpdateBatcher {
  let scheduled = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return {
    schedule: () => {
      if (!scheduled) {
        scheduled = true;
        timeoutId = setTimeout(() => {
          scheduled = false;
          timeoutId = null;
          flushFn();
        }, interval);
      }
    },

    flush: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      scheduled = false;
      flushFn();
    },

    cancel: () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      scheduled = false;
    },

    isPending: () => scheduled,
  };
}

/**
 * Create a debounced function that delays execution
 * until after the specified wait time has passed since
 * the last call.
 *
 * Unlike batcher, this resets the timer on each call.
 *
 * @example
 * ```typescript
 * const debouncedSearch = createDebounced((query: string) => {
 *   performSearch(query);
 * }, 300);
 *
 * // Only the last call within 300ms window executes
 * input.onKeyPress((key) => {
 *   debouncedSearch(input.value);
 * });
 * ```
 */
export function createDebounced<T extends (...args: any[]) => void>(
  fn: T,
  wait: number
): T & { cancel: () => void; flush: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    lastArgs = args;
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
    }, wait);
  }) as T & { cancel: () => void; flush: () => void };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (lastArgs) {
      fn(...lastArgs);
      lastArgs = null;
    }
  };

  return debounced;
}

/**
 * Create a throttled function that executes at most once
 * per specified interval.
 *
 * @example
 * ```typescript
 * const throttledResize = createThrottled(() => {
 *   recalculateLayout();
 * }, 100);
 *
 * window.onResize(() => {
 *   throttledResize(); // Max 10 times per second
 * });
 * ```
 */
export function createThrottled<T extends (...args: any[]) => void>(
  fn: T,
  interval: number
): T & { cancel: () => void } {
  let lastExecution = 0;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const throttled = ((...args: Parameters<T>) => {
    const now = Date.now();
    const elapsed = now - lastExecution;

    if (elapsed >= interval) {
      lastExecution = now;
      fn(...args);
    } else {
      // Schedule trailing call
      lastArgs = args;
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          lastExecution = Date.now();
          timeoutId = null;
          if (lastArgs) {
            fn(...lastArgs);
            lastArgs = null;
          }
        }, interval - elapsed);
      }
    }
  }) as T & { cancel: () => void };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return throttled;
}
