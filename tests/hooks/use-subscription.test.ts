/**
 * Tests for useSubscription hook
 *
 * Tests connecting external event sources to reactive signals.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  beginRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import { useSubscription } from '../../src/hooks/use-subscription.js';

describe('useSubscription hook', () => {
  beforeEach(() => {
    resetHookState();
  });

  afterEach(() => {
    resetHookState();
  });

  describe('basic subscription', () => {
    it('should return undefined initially when no initialValue', () => {
      const unsubscribe = vi.fn();
      const subscribe = vi.fn(() => unsubscribe);

      beginRender();
      const getter = useSubscription(subscribe);
      endRender();

      expect(getter()).toBeUndefined();
    });

    it('should return initialValue when provided', () => {
      const subscribe = vi.fn(() => vi.fn());

      beginRender();
      const getter = useSubscription<number>(subscribe, { initialValue: 42 });
      endRender();

      expect(getter()).toBe(42);
    });

    it('should call subscribe on first render', () => {
      const subscribe = vi.fn(() => vi.fn());

      beginRender();
      useSubscription(subscribe);
      endRender();

      expect(subscribe).toHaveBeenCalledTimes(1);
      expect(typeof subscribe.mock.calls[0][0]).toBe('function');
    });

    it('should update signal when callback fires', () => {
      let emitValue: ((value: string) => void) | null = null;
      const subscribe = vi.fn((cb: (v: string) => void) => {
        emitValue = cb;
        return vi.fn();
      });

      beginRender();
      const getter = useSubscription<string>(subscribe);
      endRender();

      expect(getter()).toBeUndefined();

      emitValue!('hello');
      expect(getter()).toBe('hello');

      emitValue!('world');
      expect(getter()).toBe('world');
    });

    it('should call unsubscribe when cleanup is triggered', () => {
      const unsubscribe = vi.fn();
      const subscribe = vi.fn(() => unsubscribe);

      beginRender();
      useSubscription(subscribe);
      endRender();

      expect(unsubscribe).not.toHaveBeenCalled();

      // Simulate cleanup by resetting hook state
      resetHookState();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('enabled option', () => {
    it('should not subscribe when enabled is false', () => {
      const subscribe = vi.fn(() => vi.fn());

      beginRender();
      useSubscription(subscribe, { enabled: false });
      endRender();

      expect(subscribe).not.toHaveBeenCalled();
    });

    it('should subscribe when enabled changes to true', () => {
      const unsubscribe = vi.fn();
      const subscribe = vi.fn(() => unsubscribe);

      // First render — disabled
      beginRender();
      useSubscription(subscribe, { enabled: false });
      endRender();
      expect(subscribe).not.toHaveBeenCalled();

      // Second render — enabled
      beginRender();
      useSubscription(subscribe, { enabled: true });
      endRender();
      expect(subscribe).toHaveBeenCalledTimes(1);
    });

    it('should unsubscribe when enabled changes to false', () => {
      const unsubscribe = vi.fn();
      const subscribe = vi.fn(() => unsubscribe);

      // First render — enabled
      beginRender();
      useSubscription(subscribe, { enabled: true });
      endRender();
      expect(subscribe).toHaveBeenCalledTimes(1);

      // Second render — disabled
      beginRender();
      useSubscription(subscribe, { enabled: false });
      endRender();
      expect(unsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('state persistence across renders', () => {
    it('should preserve signal value across re-renders', () => {
      let emitValue: ((value: number) => void) | null = null;
      const subscribe = vi.fn((cb: (v: number) => void) => {
        emitValue = cb;
        return vi.fn();
      });

      // First render
      beginRender();
      const getter1 = useSubscription<number>(subscribe, { initialValue: 0 });
      endRender();

      emitValue!(99);
      expect(getter1()).toBe(99);

      // Second render — should return same getter with same value
      beginRender();
      const getter2 = useSubscription<number>(subscribe, { initialValue: 0 });
      endRender();

      expect(getter2()).toBe(99);
      // Subscribe should only have been called once
      expect(subscribe).toHaveBeenCalledTimes(1);
    });

    it('should update subscribe function reference on re-render', () => {
      const unsubscribe = vi.fn();
      const subscribe1 = vi.fn(() => unsubscribe);
      const subscribe2 = vi.fn(() => unsubscribe);

      // First render
      beginRender();
      useSubscription(subscribe1);
      endRender();

      // Second render with different subscribe function
      beginRender();
      useSubscription(subscribe2);
      endRender();

      // Should not re-subscribe — only update the reference
      expect(subscribe1).toHaveBeenCalledTimes(1);
      expect(subscribe2).not.toHaveBeenCalled();
    });
  });

  describe('EventEmitter pattern', () => {
    it('should work with EventEmitter-like API', () => {
      const handlers = new Map<string, Set<(v: any) => void>>();

      const emitter = {
        on(event: string, handler: (v: any) => void) {
          if (!handlers.has(event)) handlers.set(event, new Set());
          handlers.get(event)!.add(handler);
        },
        off(event: string, handler: (v: any) => void) {
          handlers.get(event)?.delete(handler);
        },
        emit(event: string, value: any) {
          handlers.get(event)?.forEach(h => h(value));
        },
      };

      beginRender();
      const getter = useSubscription<number>((cb) => {
        emitter.on('data', cb);
        return () => emitter.off('data', cb);
      }, { initialValue: 0 });
      endRender();

      expect(getter()).toBe(0);

      emitter.emit('data', 42);
      expect(getter()).toBe(42);

      emitter.emit('data', 100);
      expect(getter()).toBe(100);
    });
  });
});
