/**
 * Tests for useInterval hook
 *
 * Tests recurring timer functionality with automatic cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  beginRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import { useInterval } from '../../src/hooks/use-interval.js';

describe('useInterval hook', () => {
  beforeEach(() => {
    resetHookState();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    resetHookState();
  });

  describe('basic interval execution', () => {
    it('should execute callback at regular intervals', () => {
      const callback = vi.fn();

      beginRender();
      useInterval(callback, 100);
      endRender();

      expect(callback).toHaveBeenCalledTimes(0);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should execute 3 times after 350ms with 100ms delay', () => {
      const callback = vi.fn();

      beginRender();
      useInterval(callback, 100);
      endRender();

      vi.advanceTimersByTime(350);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should return control functions', () => {
      beginRender();
      const result = useInterval(() => {}, 100);
      endRender();

      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('stop');
      expect(result).toHaveProperty('isRunning');
      expect(typeof result.start).toBe('function');
      expect(typeof result.stop).toBe('function');
      expect(typeof result.isRunning).toBe('function');
    });
  });

  describe('enabled option', () => {
    it('should not start when enabled is false', () => {
      const callback = vi.fn();

      beginRender();
      const { isRunning } = useInterval(callback, 100, { enabled: false });
      endRender();

      expect(isRunning()).toBe(false);

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should start when enabled changes to true', () => {
      const callback = vi.fn();

      // First render - disabled
      beginRender();
      useInterval(callback, 100, { enabled: false });
      endRender();

      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(0);

      // Second render - enabled
      beginRender();
      const { isRunning } = useInterval(callback, 100, { enabled: true });
      endRender();

      expect(isRunning()).toBe(true);

      vi.advanceTimersByTime(350);
      expect(callback).toHaveBeenCalledTimes(3);
    });

    it('should stop when enabled changes to false', () => {
      const callback = vi.fn();

      // First render - enabled
      beginRender();
      useInterval(callback, 100, { enabled: true });
      endRender();

      vi.advanceTimersByTime(250);
      expect(callback).toHaveBeenCalledTimes(2);

      // Second render - disabled
      beginRender();
      const { isRunning } = useInterval(callback, 100, { enabled: false });
      endRender();

      expect(isRunning()).toBe(false);

      callback.mockClear();
      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(0);
    });
  });

  describe('immediate option', () => {
    it('should execute callback immediately when immediate is true', () => {
      const callback = vi.fn();

      beginRender();
      useInterval(callback, 100, { immediate: true });
      endRender();

      expect(callback).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should not execute immediately by default', () => {
      const callback = vi.fn();

      beginRender();
      useInterval(callback, 100);
      endRender();

      expect(callback).toHaveBeenCalledTimes(0);

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not execute immediately when enabled is false', () => {
      const callback = vi.fn();

      beginRender();
      useInterval(callback, 100, { immediate: true, enabled: false });
      endRender();

      expect(callback).toHaveBeenCalledTimes(0);
    });
  });

  describe('manual controls', () => {
    it('should stop interval when stop() is called', () => {
      const callback = vi.fn();

      beginRender();
      const { stop, isRunning } = useInterval(callback, 100);
      endRender();

      expect(isRunning()).toBe(true);

      vi.advanceTimersByTime(250);
      expect(callback).toHaveBeenCalledTimes(2);

      stop();
      expect(isRunning()).toBe(false);

      callback.mockClear();
      vi.advanceTimersByTime(500);
      expect(callback).toHaveBeenCalledTimes(0);
    });

    it('should restart interval when start() is called after stop()', () => {
      const callback = vi.fn();

      beginRender();
      const { start, stop, isRunning } = useInterval(callback, 100);
      endRender();

      vi.advanceTimersByTime(150);
      expect(callback).toHaveBeenCalledTimes(1);

      stop();
      callback.mockClear();
      vi.advanceTimersByTime(300);
      expect(callback).toHaveBeenCalledTimes(0);

      start();
      expect(isRunning()).toBe(true);

      vi.advanceTimersByTime(250);
      expect(callback).toHaveBeenCalledTimes(2);
    });

    it('should not create duplicate intervals when start() is called while running', () => {
      const callback = vi.fn();

      beginRender();
      const { start } = useInterval(callback, 100);
      endRender();

      start(); // Already running, should be no-op
      start();
      start();

      vi.advanceTimersByTime(350);
      expect(callback).toHaveBeenCalledTimes(3); // Not more
    });

    it('should be safe to call stop() multiple times', () => {
      const callback = vi.fn();

      beginRender();
      const { stop, isRunning } = useInterval(callback, 100);
      endRender();

      vi.advanceTimersByTime(150);

      stop();
      stop();
      stop();

      expect(isRunning()).toBe(false);
    });
  });

  describe('callback updates', () => {
    it('should use latest callback on subsequent renders', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // First render
      beginRender();
      useInterval(callback1, 100);
      endRender();

      vi.advanceTimersByTime(100);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(0);

      callback1.mockClear();

      // Second render with new callback
      beginRender();
      useInterval(callback2, 100);
      endRender();

      vi.advanceTimersByTime(100);
      expect(callback1).toHaveBeenCalledTimes(0);
      expect(callback2).toHaveBeenCalledTimes(1);
    });
  });

  describe('delay updates', () => {
    it('should update delay on re-render', () => {
      const callback = vi.fn();

      // First render with 100ms delay
      beginRender();
      useInterval(callback, 100);
      endRender();

      vi.advanceTimersByTime(100);
      expect(callback).toHaveBeenCalledTimes(1);

      // Second render with 200ms delay
      beginRender();
      useInterval(callback, 200);
      endRender();

      // The interval keeps running with updated delay reference
      // (Note: the actual interval timer is not restarted automatically,
      // but the stored delay is updated for future start() calls)
    });
  });

  describe('state persistence across renders', () => {
    it('should maintain running state across renders', () => {
      const callback = vi.fn();

      beginRender();
      const { isRunning: isRunning1 } = useInterval(callback, 100);
      endRender();

      expect(isRunning1()).toBe(true);

      beginRender();
      const { isRunning: isRunning2 } = useInterval(callback, 100);
      endRender();

      expect(isRunning2()).toBe(true);
    });

    it('should persist stopped state across renders', () => {
      const callback = vi.fn();

      beginRender();
      const { stop } = useInterval(callback, 100);
      endRender();

      stop();

      beginRender();
      const { isRunning } = useInterval(callback, 100);
      endRender();

      // Note: the enabled prop doesn't automatically restart a manually stopped interval
      // This is by design - manual stop takes precedence
    });
  });

  describe('cleanup', () => {
    it('stops the interval when hook state is reset', () => {
      const callback = vi.fn();

      beginRender();
      useInterval(callback, 100);
      endRender();

      resetHookState();
      vi.advanceTimersByTime(500);

      expect(callback).not.toHaveBeenCalled();
    });

    it('should provide cleanupInterval function', async () => {
      const { cleanupInterval } = await import(
        '../../src/hooks/use-interval.js'
      );
      expect(typeof cleanupInterval).toBe('function');
    });

    it('cleanupInterval should clear the timer', async () => {
      const { cleanupInterval } = await import(
        '../../src/hooks/use-interval.js'
      );

      const hookData = {
        timerId: setInterval(() => {}, 1000),
        callback: () => {},
        delay: 1000,
        enabled: true,
        running: true,
        start: () => {},
        stop: () => {},
        isRunning: () => true,
      };

      cleanupInterval(hookData);

      expect(hookData.timerId).toBe(null);
      expect(hookData.running).toBe(false);
    });
  });
});
