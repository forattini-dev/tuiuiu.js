/**
 * useAsyncData - Async data fetching with lifecycle management
 *
 * Provides loading state, error handling, abort on refetch/unmount,
 * and optional auto-polling via refreshInterval.
 *
 * @example
 * const { data, loading, error, refetch } = useAsyncData(
 *   (signal) => fetch('/api/data', { signal }).then(r => r.json()),
 *   { refreshInterval: 5000 }
 * );
 *
 * // In render:
 * if (loading()) return Spinner({});
 * if (error()) return Text({}, `Error: ${error()!.message}`);
 * return Text({}, `Data: ${data()}`);
 */

import { createSignal, batch } from '../primitives/signal.js';
import { allowInternalSignalCreationDuringRender } from '../core/dev-warnings.js';
import {
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
  registerHookCleanup,
} from './context.js';

export interface UseAsyncDataOptions {
  /** Whether to fetch immediately (default: true) */
  enabled?: boolean;
  /** Auto-refresh interval in milliseconds */
  refreshInterval?: number;
}

export interface UseAsyncDataReturn<T> {
  /** The fetched data (undefined until loaded) */
  data: () => T | undefined;
  /** Whether a fetch is in progress */
  loading: () => boolean;
  /** Error from the last fetch attempt */
  error: () => Error | undefined;
  /** Trigger a manual refetch */
  refetch: () => void;
}

interface AsyncDataHookData<T> {
  data: () => T | undefined;
  setData: (value: T | undefined | ((prev: T | undefined) => T | undefined)) => void;
  loading: () => boolean;
  setLoading: (value: boolean | ((prev: boolean) => boolean)) => void;
  error: () => Error | undefined;
  setError: (value: Error | undefined | ((prev: Error | undefined) => Error | undefined)) => void;
  fetcher: (signal: AbortSignal) => Promise<T>;
  doFetch: () => void;
  abortController: AbortController | null;
  refreshTimer: ReturnType<typeof setInterval> | null;
  enabled: boolean;
  refreshInterval: number | undefined;
  hookIndex: import('./context.js').HookSlotToken;
}

/**
 * useAsyncData - Async data fetching with full lifecycle.
 *
 * @param fetcher - Async function that receives an AbortSignal and returns data
 * @param options - Configuration options
 * @returns Object with data, loading, error getters and refetch function
 */
export function useAsyncData<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  options: UseAsyncDataOptions = {}
): UseAsyncDataReturn<T> {
  const { enabled = true, refreshInterval } = options;

  const { value: hookData, isNew } = getHookState<AsyncDataHookData<T> | null>(null);

  if (isNew || hookData === null) {
    const hookIndex = getCurrentHookIndex();

    const [data, setData] = allowInternalSignalCreationDuringRender(
      () => createSignal<T | undefined>(undefined)
    );
    const [loading, setLoading] = allowInternalSignalCreationDuringRender(
      () => createSignal<boolean>(false)
    );
    const [error, setError] = allowInternalSignalCreationDuringRender(
      () => createSignal<Error | undefined>(undefined)
    );

    const doFetch = () => {
      const current = getHookStateByIndex(hookIndex) as AsyncDataHookData<T> | null;
      if (!current) return; // unmounted

      // Abort previous fetch
      if (current.abortController) {
        current.abortController.abort();
      }
      current.abortController = new AbortController();
      const signal = current.abortController.signal;

      batch(() => {
        current.setLoading(true);
        current.setError(undefined);
      });

      current.fetcher(signal)
        .then((result) => {
          const curr = getHookStateByIndex(hookIndex) as AsyncDataHookData<T> | null;
          if (!curr) return;
          batch(() => {
            curr.setData(result as any);
            curr.setLoading(false);
            curr.setError(undefined);
          });
        })
        .catch((err) => {
          if (err?.name === 'AbortError') return;
          const curr = getHookStateByIndex(hookIndex) as AsyncDataHookData<T> | null;
          if (!curr) return;
          batch(() => {
            curr.setLoading(false);
            curr.setError(err instanceof Error ? err : new Error(String(err)));
          });
        });
    };

    const hookDataNew: AsyncDataHookData<T> = {
      data,
      setData,
      loading,
      setLoading,
      error,
      setError,
      fetcher,
      doFetch,
      abortController: null,
      refreshTimer: null,
      enabled,
      refreshInterval,
      hookIndex,
    };

    setHookState(hookIndex, hookDataNew);
    registerHookCleanup(() => cleanupAsyncData(hookDataNew), hookIndex);

    if (enabled) {
      doFetch();
      if (refreshInterval && refreshInterval > 0) {
        hookDataNew.refreshTimer = setInterval(doFetch, refreshInterval);
      }
    }

    return { data, loading, error, refetch: doFetch };
  } else {
    // Subsequent render — update fetcher reference
    hookData.fetcher = fetcher;

    // Handle enabled state changes
    if (enabled !== hookData.enabled) {
      hookData.enabled = enabled;
      if (enabled) {
        hookData.doFetch();
        if (refreshInterval && refreshInterval > 0) {
          hookData.refreshTimer = setInterval(hookData.doFetch, refreshInterval);
        }
      } else {
        if (hookData.abortController) {
          hookData.abortController.abort();
          hookData.abortController = null;
        }
        if (hookData.refreshTimer) {
          clearInterval(hookData.refreshTimer);
          hookData.refreshTimer = null;
        }
      }
    }

    // Handle refreshInterval changes
    if (refreshInterval !== hookData.refreshInterval) {
      if (hookData.refreshTimer) {
        clearInterval(hookData.refreshTimer);
        hookData.refreshTimer = null;
      }
      hookData.refreshInterval = refreshInterval;
      if (enabled && refreshInterval && refreshInterval > 0) {
        hookData.refreshTimer = setInterval(hookData.doFetch, refreshInterval);
      }
    }

    return {
      data: hookData.data,
      loading: hookData.loading,
      error: hookData.error,
      refetch: hookData.doFetch,
    };
  }
}

/**
 * Cleanup function for unmount — aborts in-flight fetch and clears refresh timer.
 */
export function cleanupAsyncData<T>(hookData: AsyncDataHookData<T>): void {
  if (hookData.abortController) {
    hookData.abortController.abort();
    hookData.abortController = null;
  }
  if (hookData.refreshTimer) {
    clearInterval(hookData.refreshTimer);
    hookData.refreshTimer = null;
  }
}
