/**
 * Tests for useAsyncData hook
 *
 * Tests async data fetching with lifecycle management.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  beginRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import { useAsyncData } from '../../src/hooks/use-async-data.js';

describe('useAsyncData hook', () => {
  beforeEach(() => {
    resetHookState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetHookState();
  });

  describe('basic fetching', () => {
    it('should start loading immediately', () => {
      const fetcher = vi.fn((_signal: AbortSignal) => new Promise<string>(() => {}));

      beginRender();
      const { data, loading, error } = useAsyncData(fetcher);
      endRender();

      expect(loading()).toBe(true);
      expect(data()).toBeUndefined();
      expect(error()).toBeUndefined();
    });

    it('should set data after fetcher resolves', async () => {
      const fetcher = vi.fn(() => Promise.resolve('hello'));

      beginRender();
      const { data, loading, error } = useAsyncData(fetcher);
      endRender();

      // Flush the promise
      await vi.runAllTimersAsync();

      expect(data()).toBe('hello');
      expect(loading()).toBe(false);
      expect(error()).toBeUndefined();
    });

    it('should set error after fetcher rejects', async () => {
      const fetcher = vi.fn(() => Promise.reject(new Error('network error')));

      beginRender();
      const { data, loading, error } = useAsyncData(fetcher);
      endRender();

      await vi.runAllTimersAsync();

      expect(data()).toBeUndefined();
      expect(loading()).toBe(false);
      expect(error()).toBeInstanceOf(Error);
      expect(error()!.message).toBe('network error');
    });

    it('should wrap non-Error rejections', async () => {
      const fetcher = vi.fn(() => Promise.reject('string error'));

      beginRender();
      const { error } = useAsyncData(fetcher);
      endRender();

      await vi.runAllTimersAsync();

      expect(error()).toBeInstanceOf(Error);
      expect(error()!.message).toBe('string error');
    });

    it('should pass AbortSignal to fetcher', () => {
      const fetcher = vi.fn((_signal: AbortSignal) => new Promise<string>(() => {}));

      beginRender();
      useAsyncData(fetcher);
      endRender();

      expect(fetcher).toHaveBeenCalledTimes(1);
      const signal = fetcher.mock.calls[0][0];
      expect(signal).toBeInstanceOf(AbortSignal);
    });
  });

  describe('refetch', () => {
    it('should provide a refetch function', () => {
      beginRender();
      const { refetch } = useAsyncData(() => Promise.resolve('data'));
      endRender();

      expect(typeof refetch).toBe('function');
    });

    it('should abort previous fetch on refetch', async () => {
      let fetchCount = 0;
      const fetcher = vi.fn((signal: AbortSignal) => {
        fetchCount++;
        const current = fetchCount;
        return new Promise<string>((resolve, reject) => {
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
          setTimeout(() => resolve(`result-${current}`), 1000);
        });
      });

      beginRender();
      const { data, refetch } = useAsyncData(fetcher);
      endRender();

      // First fetch signal should be aborted on refetch
      const firstSignal = fetcher.mock.calls[0][0] as AbortSignal;

      refetch();
      expect(firstSignal.aborted).toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(2);

      // Let second fetch complete
      await vi.advanceTimersByTimeAsync(1000);

      expect(data()).toBe('result-2');
    });

    it('should silently ignore AbortError', async () => {
      const fetcher = vi.fn((signal: AbortSignal) => {
        return new Promise<string>((_, reject) => {
          // Immediately abort
          signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        });
      });

      beginRender();
      const { error, refetch } = useAsyncData(fetcher);
      endRender();

      // Trigger refetch (aborts first)
      refetch();
      await vi.runAllTimersAsync();

      // AbortError from first fetch should not set error state
      // (second fetch is still pending)
      expect(error()).toBeUndefined();
    });
  });

  describe('enabled option', () => {
    it('should not fetch when enabled is false', () => {
      const fetcher = vi.fn(() => Promise.resolve('data'));

      beginRender();
      const { loading } = useAsyncData(fetcher, { enabled: false });
      endRender();

      expect(fetcher).not.toHaveBeenCalled();
      expect(loading()).toBe(false);
    });

    it('should fetch when enabled changes to true', () => {
      const fetcher = vi.fn(() => Promise.resolve('data'));

      // First render — disabled
      beginRender();
      useAsyncData(fetcher, { enabled: false });
      endRender();
      expect(fetcher).not.toHaveBeenCalled();

      // Second render — enabled
      beginRender();
      useAsyncData(fetcher, { enabled: true });
      endRender();
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should abort when enabled changes to false', async () => {
      let signal: AbortSignal | null = null;
      const fetcher = vi.fn((s: AbortSignal) => {
        signal = s;
        return new Promise<string>(() => {}); // never resolves
      });

      // First render — enabled
      beginRender();
      useAsyncData(fetcher, { enabled: true });
      endRender();

      expect(signal).not.toBeNull();
      expect(signal!.aborted).toBe(false);

      // Second render — disabled
      beginRender();
      useAsyncData(fetcher, { enabled: false });
      endRender();

      expect(signal!.aborted).toBe(true);
    });
  });

  describe('refreshInterval', () => {
    it('should refetch at regular intervals', async () => {
      let count = 0;
      const fetcher = vi.fn(() => Promise.resolve(`data-${++count}`));

      beginRender();
      const { data } = useAsyncData(fetcher, { refreshInterval: 1000 });
      endRender();

      // Initial fetch resolves
      await vi.advanceTimersByTimeAsync(1);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(data()).toBe('data-1');

      // After 1 second — interval fires
      await vi.advanceTimersByTimeAsync(1000);
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(data()).toBe('data-2');

      // After another second
      await vi.advanceTimersByTimeAsync(1000);
      expect(fetcher).toHaveBeenCalledTimes(3);
      expect(data()).toBe('data-3');
    });

    it('should not set refreshInterval when enabled is false', () => {
      const fetcher = vi.fn(() => Promise.resolve('data'));

      beginRender();
      useAsyncData(fetcher, { enabled: false, refreshInterval: 1000 });
      endRender();

      vi.advanceTimersByTime(3000);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should update refreshInterval on re-render', async () => {
      const fetcher = vi.fn(() => Promise.resolve('data'));

      // First render — 1s interval
      beginRender();
      useAsyncData(fetcher, { refreshInterval: 1000 });
      endRender();

      await vi.advanceTimersByTimeAsync(1);
      expect(fetcher).toHaveBeenCalledTimes(1);

      // Second render — 500ms interval
      beginRender();
      useAsyncData(fetcher, { refreshInterval: 500 });
      endRender();

      // New interval should fire at 500ms
      await vi.advanceTimersByTimeAsync(500);
      expect(fetcher).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(500);
      expect(fetcher).toHaveBeenCalledTimes(3);
    });
  });

  describe('state persistence across renders', () => {
    it('should preserve data across re-renders', async () => {
      const fetcher = vi.fn(() => Promise.resolve('hello'));

      // First render
      beginRender();
      const result1 = useAsyncData(fetcher);
      endRender();

      await vi.runAllTimersAsync();
      expect(result1.data()).toBe('hello');

      // Second render
      beginRender();
      const result2 = useAsyncData(fetcher);
      endRender();

      expect(result2.data()).toBe('hello');
      // Fetcher should only have been called once
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should update fetcher reference on re-render', async () => {
      const fetcher1 = vi.fn(() => Promise.resolve('first'));
      const fetcher2 = vi.fn(() => Promise.resolve('second'));

      // First render
      beginRender();
      const { refetch } = useAsyncData(fetcher1);
      endRender();

      await vi.runAllTimersAsync();

      // Second render with different fetcher
      beginRender();
      useAsyncData(fetcher2);
      endRender();

      // Refetch should use the updated fetcher
      refetch();
      await vi.runAllTimersAsync();

      expect(fetcher2).toHaveBeenCalledTimes(1);
    });
  });
});
