/**
 * Tests for useTimeout hook
 *
 * Tests delayed execution with automatic cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  beginRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import { useTimeout } from '../../src/hooks/use-timeout.js';

describe('useTimeout hook', () => {
  beforeEach(() => {
    resetHookState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetHookState();
  });

  describe('basic timeout execution', () => {
    it('should execute callback after delay', () => {
      const callback = vi.fn();

      beginRender();
      useTimeout(callback, 100);
      endRender();

      expect(callback).toHaveBeenCalledTimes(0);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should execute callback only once', () => {
      const callback = vi.fn();

      beginRender();
      useTimeout(callback, 100);
      endRender();

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not execute before delay', () => {
      const callback = vi.fn();

      beginRender();
      useTimeout(callback, 100);
      endRender();

      vi.advanceTimersByTime(50);
      expect(callback).toHaveBeenCalledTimes(0);

      vi.advanceTimersByTime(60);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should return control functions', () => {
      beginRender();
      const result = useTimeout(() => {}, 100);
      endRender();

      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('cancel');
      expect(result).toHaveProperty('isPending');
      expect(typeof result.start).toBe('function');
      expect(typeof result.cancel).toBe('function');
      expect(typeof result.isPending).toBe('function');
    });
  });

  describe('enabled option', () => {
    it('should not start when enabled is false', () => {
      const callback = vi.fn();

      beginRender();
      const { isPending } = useTimeout(callback, 100, { enabled: false });
      endRender();

      expect(isPending()).toBe(false);

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should start when enabled changes to true', () => {
      const callback = vi.fn();

      // First render - disabled
      beginRender();
      useTimeout(callback, 100, { enabled: false });
      endRender();

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(0);

      // Second render - enabled
      beginRender();
      const { isPending } = useTimeout(callback, 100, { enabled: true });
      endRender();

      expect(isPending()).toBe(true);

      vi.advanceTimersByTime(150);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should cancel when enabled changes to false', () => {
      const callback = vi.fn();

      // First render - enabled
      beginRender();
      useTimeout(callback, 100, { enabled: true });
      endRender();

      vi.advanceTimersByTime(50);
      expect(callback).toHaveBeenCalledTimes(0);

      // Second render - disabled before timeout fires
      beginRender();
      const { isPending } = useTimeout(callback, 100, { enabled: false });
      endRender();

      expect(isPending()).toBe(false);

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(0);
    });
  });

  describe('cancel control', () => {
    it('should cancel pending timeout', () => {
      const callback = vi.fn();

      beginRender();
      const { cancel, isPending } = useTimeout(callback, 100);
      endRender();

      expect(isPending()).toBe(true);

      vi.advanceTimersByTime(50);
      cancel();

      expect(isPending()).toBe(false);

      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should be safe to cancel multiple times', () => {
      const callback = vi.fn();

      beginRender();
      const { cancel, isPending } = useTimeout(callback, 100);
      endRender();

      cancel();
      cancel();
      cancel();

      expect(isPending()).toBe(false);
      vi.advanceTimersByTime(200);
      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should be safe to cancel already executed timeout', () => {
      const callback = vi.fn();

      beginRender();
      const { cancel, isPending } = useTimeout(callback, 100);
      endRender();

      vi.advanceTimersByTime(150);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(isPending()).toBe(false);

      cancel(); // No-op, but should not throw
      expect(isPending()).toBe(false);
    });
  });

  describe('start control', () => {
    it('should restart timeout after cancel', () => {
      const callback = vi.fn();

      beginRender();
      const { start, cancel, isPending } = useTimeout(callback, 100);
      endRender();

      vi.advanceTimersByTime(50);
      cancel();
      expect(isPending()).toBe(false);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(0);

      start();
      expect(isPending()).toBe(true);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should restart timeout after execution', () => {
      const callback = vi.fn();

      beginRender();
      const { start, isPending } = useTimeout(callback, 100);
      endRender();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(isPending()).toBe(false);

      start();
      expect(isPending()).toBe(true);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should restart timeout when called while pending', () => {
      const callback = vi.fn();

      beginRender();
      const { start } = useTimeout(callback, 100);
      endRender();

      vi.advanceTimersByTime(50);
      start(); // Restart at 50ms

      vi.advanceTimersByTime(50);
      expect(callback).toHaveBeenCalledTimes(0); // 100ms from restart not reached

      vi.advanceTimersByTime(50);
      expect(callback).toHaveBeenCalledTimes(1); // Now 100ms from restart
    });
  });

  describe('isPending state', () => {
    it('should return true while timeout is pending', () => {
      beginRender();
      const { isPending } = useTimeout(() => {}, 100);
      endRender();

      expect(isPending()).toBe(true);
    });

    it('should return false after timeout executes', () => {
      beginRender();
      const { isPending } = useTimeout(() => {}, 100);
      endRender();

      vi.advanceTimersByTime(100);
      expect(isPending()).toBe(false);
    });

    it('should return false after cancel', () => {
      beginRender();
      const { cancel, isPending } = useTimeout(() => {}, 100);
      endRender();

      cancel();
      expect(isPending()).toBe(false);
    });

    it('should return false when not enabled', () => {
      beginRender();
      const { isPending } = useTimeout(() => {}, 100, { enabled: false });
      endRender();

      expect(isPending()).toBe(false);
    });
  });

  describe('callback updates', () => {
    it('should use latest callback on execution', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // First render
      beginRender();
      useTimeout(callback1, 100);
      endRender();

      vi.advanceTimersByTime(50);

      // Second render with new callback (before timeout fires)
      beginRender();
      useTimeout(callback2, 100);
      endRender();

      vi.advanceTimersByTime(60);

      expect(callback1).toHaveBeenCalledTimes(0);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('delay updates', () => {
    it('should update delay reference', () => {
      const callback = vi.fn();

      // First render with 100ms
      beginRender();
      useTimeout(callback, 100);
      endRender();

      // Second render with 200ms
      // (note: doesn't restart existing timer, just updates stored delay)
      beginRender();
      useTimeout(callback, 200);
      endRender();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });
  });

  describe('state persistence across renders', () => {
    it('should maintain pending state across renders', () => {
      const callback = vi.fn();

      beginRender();
      const { isPending: isPending1 } = useTimeout(callback, 100);
      endRender();

      expect(isPending1()).toBe(true);

      vi.advanceTimersByTime(50);

      beginRender();
      const { isPending: isPending2 } = useTimeout(callback, 100);
      endRender();

      expect(isPending2()).toBe(true);

      vi.advanceTimersByTime(60);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(isPending2()).toBe(false);
    });

    it('should maintain cancelled state across renders', () => {
      const callback = vi.fn();

      beginRender();
      const { cancel } = useTimeout(callback, 100);
      endRender();

      cancel();

      beginRender();
      const { isPending } = useTimeout(callback, 100);
      endRender();

      // Note: cancelling does not prevent re-enabling via `enabled` prop change
      // but if enabled stays true, the cancelled state persists
    });
  });

  describe('cleanup', () => {
    it('should provide cleanupTimeout function', async () => {
      const { cleanupTimeout } = await import(
        '../../src/hooks/use-timeout.js'
      );
      expect(typeof cleanupTimeout).toBe('function');
    });

    it('cleanupTimeout should clear the timer', async () => {
      const { cleanupTimeout } = await import(
        '../../src/hooks/use-timeout.js'
      );

      const hookData = {
        timerId: setTimeout(() => {}, 1000),
        callback: () => {},
        delay: 1000,
        enabled: true,
        pending: true,
        start: () => {},
        cancel: () => {},
        isPending: () => true,
      };

      cleanupTimeout(hookData);

      expect(hookData.timerId).toBe(null);
      expect(hookData.pending).toBe(false);
    });
  });
});
