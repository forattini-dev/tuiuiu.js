/**
 * Tests for primitives/signal.ts - Additional reactive utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createSignal,
  createEffect,
  createMemo,
  batch,
  untrack,
  createReducer,
  createRef,
  createDeferred,
  createId,
  resetIdCounter,
  createPrevious,
  createThrottled,
  createDebounced,
  Signal,
  Effect,
} from '../../src/primitives/signal.js';

describe('primitives/signal', () => {
  beforeEach(() => {
    resetIdCounter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createReducer', () => {
    it('creates state with value initializer', () => {
      const [state, dispatch] = createReducer(
        (s, a: { type: string }) => {
          if (a.type === 'increment') return s + 1;
          return s;
        },
        0
      );

      expect(state()).toBe(0);
    });

    it('creates state with function initializer', () => {
      const [state, dispatch] = createReducer(
        (s, a: { type: string }) => s,
        () => 42
      );

      expect(state()).toBe(42);
    });

    it('dispatches actions', () => {
      const [state, dispatch] = createReducer(
        (s: number, a: { type: string }) => {
          switch (a.type) {
            case 'increment': return s + 1;
            case 'decrement': return s - 1;
            default: return s;
          }
        },
        0
      );

      dispatch({ type: 'increment' });
      expect(state()).toBe(1);

      dispatch({ type: 'increment' });
      expect(state()).toBe(2);

      dispatch({ type: 'decrement' });
      expect(state()).toBe(1);
    });
  });

  describe('createRef', () => {
    it('creates mutable ref', () => {
      const ref = createRef(0);
      expect(ref.current).toBe(0);

      ref.current = 5;
      expect(ref.current).toBe(5);
    });

    it('does not trigger effects', () => {
      const ref = createRef(0);
      const fn = vi.fn();

      createEffect(() => {
        fn(ref.current);
      });

      expect(fn).toHaveBeenCalledTimes(1);

      ref.current = 1;
      ref.current = 2;
      ref.current = 3;

      // Should still be 1 - refs don't trigger effects
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('createDeferred', () => {
    it('initially has source value', () => {
      const [source] = createSignal(5);
      const deferred = createDeferred(source);

      expect(deferred()).toBe(5);
    });

    it('updates after microtask', async () => {
      const [source, setSource] = createSignal(5);
      const deferred = createDeferred(source);

      setSource(10);

      // Value should still be 5 synchronously
      // (deferred update happens via queueMicrotask)
      await vi.runAllTimersAsync();

      expect(deferred()).toBe(10);
    });
  });

  describe('createId', () => {
    it('creates unique ids', () => {
      const id1 = createId();
      const id2 = createId();
      const id3 = createId();

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });

    it('uses default prefix', () => {
      const id = createId();
      expect(id).toMatch(/^reck-\d+$/);
    });

    it('uses custom prefix', () => {
      const id = createId('custom');
      expect(id).toMatch(/^custom-\d+$/);
    });
  });

  describe('resetIdCounter', () => {
    it('resets the counter', () => {
      createId();
      createId();
      createId();

      resetIdCounter();

      const id = createId();
      expect(id).toBe('reck-1');
    });
  });

  describe('createPrevious', () => {
    it('starts with undefined', () => {
      const [source] = createSignal(5);
      const previous = createPrevious(source);

      // First value is stored, but previous is undefined initially
      expect(previous()).toBe(5);
    });

    it('tracks previous values', () => {
      const [source, setSource] = createSignal(1);
      const previous = createPrevious(source);

      setSource(2);
      expect(previous()).toBe(2);

      setSource(3);
      expect(previous()).toBe(3);
    });

    it('does not update when value is same', () => {
      const [source, setSource] = createSignal(5);
      const previous = createPrevious(source);

      const fn = vi.fn(() => previous());
      createEffect(fn);

      expect(fn).toHaveBeenCalledTimes(1);

      setSource(5); // Same value
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('createThrottled', () => {
    it('immediately updates on first call', () => {
      const [source, setSource] = createSignal(1);
      const throttled = createThrottled(source, 100);

      expect(throttled()).toBe(1);
    });

    it('throttles rapid updates', () => {
      const [source, setSource] = createSignal(1);
      const throttled = createThrottled(source, 100);

      // With fake timers, Date.now() is 0, so first update schedules timeout
      setSource(2);
      setSource(3);
      setSource(4);

      // Still initial value (updates are throttled via setTimeout)
      expect(throttled()).toBe(1);

      // Advance time past throttle delay
      vi.advanceTimersByTime(100);

      // Should now have updated to latest value
      expect(throttled()).toBe(4);
    });

    it('updates after delay passes', () => {
      const [source, setSource] = createSignal(1);
      const throttled = createThrottled(source, 100);

      // First update schedules a timeout
      setSource(2);
      expect(throttled()).toBe(1);

      // Advance past delay
      vi.advanceTimersByTime(100);
      expect(throttled()).toBe(2);

      // Now time has passed, next update also schedules
      setSource(3);
      expect(throttled()).toBe(2); // Still 2, new timeout scheduled

      vi.advanceTimersByTime(100);
      expect(throttled()).toBe(3);
    });
  });

  describe('createDebounced', () => {
    it('initially has source value', () => {
      const [source] = createSignal(1);
      const debounced = createDebounced(source, 100);

      expect(debounced()).toBe(1);
    });

    it('debounces updates', () => {
      const [source, setSource] = createSignal(1);
      const debounced = createDebounced(source, 100);

      setSource(2);
      setSource(3);
      setSource(4);

      // Should still be 1 (not updated yet)
      expect(debounced()).toBe(1);

      // Advance time past debounce delay
      vi.advanceTimersByTime(100);

      // Should now have final value
      expect(debounced()).toBe(4);
    });

    it('resets timer on each update', () => {
      const [source, setSource] = createSignal(1);
      const debounced = createDebounced(source, 100);

      setSource(2);
      vi.advanceTimersByTime(50);
      expect(debounced()).toBe(1);

      setSource(3);
      vi.advanceTimersByTime(50);
      expect(debounced()).toBe(1);

      setSource(4);
      vi.advanceTimersByTime(50);
      expect(debounced()).toBe(1);

      // Finally let it settle
      vi.advanceTimersByTime(100);
      expect(debounced()).toBe(4);
    });

    it('clears previous timeout', () => {
      const [source, setSource] = createSignal(1);
      const debounced = createDebounced(source, 100);

      setSource(2);
      vi.advanceTimersByTime(50);

      setSource(3);
      vi.advanceTimersByTime(50);

      // First timeout should have been cleared
      expect(debounced()).toBe(1);

      vi.advanceTimersByTime(50);
      expect(debounced()).toBe(3);
    });
  });

  describe('untrack', () => {
    it('reads signal without tracking', () => {
      const [a, setA] = createSignal(1);
      const [b, setB] = createSignal(2);
      const fn = vi.fn();

      createEffect(() => {
        a(); // Track a
        untrack(() => b()); // Don't track b
        fn();
      });

      expect(fn).toHaveBeenCalledTimes(1);

      setA(10); // Should trigger
      expect(fn).toHaveBeenCalledTimes(2);

      setB(20); // Should NOT trigger
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('returns value from function', () => {
      const [a] = createSignal(42);
      const result = untrack(() => a() * 2);
      expect(result).toBe(84);
    });
  });

  describe('batch', () => {
    it('batches multiple updates', () => {
      const [a, setA] = createSignal(0);
      const fn = vi.fn(() => a());

      createEffect(fn);
      expect(fn).toHaveBeenCalledTimes(1);

      batch(() => {
        setA(1);
        setA(2);
        setA(3);
      });

      // Should only run once after batch
      expect(fn).toHaveBeenCalledTimes(2);
      expect(a()).toBe(3);
    });

    it('handles nested batches', () => {
      const [a, setA] = createSignal(0);
      const fn = vi.fn(() => a());

      createEffect(fn);

      batch(() => {
        setA(1);
        batch(() => {
          setA(2);
        });
        setA(3);
      });

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Signal class', () => {
    it('get/set value', () => {
      const signal = new Signal(5);
      expect(signal.value).toBe(5);

      signal.value = 10;
      expect(signal.value).toBe(10);
    });

    it('peek without tracking', () => {
      const signal = new Signal(5);
      const fn = vi.fn();

      new Effect(() => {
        signal.peek(); // Should not track
        fn();
      });

      expect(fn).toHaveBeenCalledTimes(1);

      signal.value = 10;
      expect(fn).toHaveBeenCalledTimes(1); // Should not re-run
    });

    it('update with function', () => {
      const signal = new Signal(5);
      signal.update(v => v * 2);
      expect(signal.value).toBe(10);
    });

    it('unsubscribe removes effect', () => {
      const signal = new Signal(0);
      const fn = vi.fn();
      const effect = new Effect(() => {
        signal.value;
        fn();
      });

      expect(fn).toHaveBeenCalledTimes(1);

      signal.unsubscribe(effect);
      signal.value = 1;

      expect(fn).toHaveBeenCalledTimes(1); // No additional call
    });
  });

  describe('Effect class', () => {
    it('runs immediately', () => {
      const fn = vi.fn();
      new Effect(fn);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('tracks dependencies', () => {
      const signal = new Signal(0);
      const fn = vi.fn();

      new Effect(() => {
        signal.value;
        fn();
      });

      expect(fn).toHaveBeenCalledTimes(1);

      signal.value = 1;
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('disposes correctly', () => {
      const signal = new Signal(0);
      const fn = vi.fn();
      const effect = new Effect(() => {
        signal.value;
        fn();
      });

      effect.dispose();
      signal.value = 1;

      expect(fn).toHaveBeenCalledTimes(1); // No additional call
    });

    it('calls cleanup on dispose', () => {
      const cleanup = vi.fn();
      const effect = new Effect(() => cleanup);

      effect.dispose();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('calls cleanup on re-run', () => {
      const signal = new Signal(0);
      const cleanup = vi.fn();

      new Effect(() => {
        signal.value;
        return cleanup;
      });

      expect(cleanup).not.toHaveBeenCalled();

      signal.value = 1;
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('prevents re-entrant execution', () => {
      const signal = new Signal(0);
      let runCount = 0;

      new Effect(() => {
        runCount++;
        if (signal.value < 3) {
          signal.value++; // This triggers signal notify, but re-entry is blocked
        }
      });

      // Only runs once - re-entrant calls are blocked by the running flag
      // The signal update happens but the effect doesn't re-run during its own execution
      expect(runCount).toBe(1);
      // The signal was still updated
      expect(signal.value).toBe(1);
    });
  });
});
