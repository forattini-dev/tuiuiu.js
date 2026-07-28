/**
 * Tests for terminal-panic module
 *
 * Tests centralized terminal restoration on crash.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  installPanicHooks,
  removePanicHooks,
  onTerminalPanic,
  restoreTerminal,
} from '../../src/core/terminal-panic.js';

describe('terminal-panic', () => {
  beforeEach(() => {
    removePanicHooks();
  });

  describe('onTerminalPanic', () => {
    it('should register a cleanup callback', () => {
      const cleanup = vi.fn();
      onTerminalPanic(cleanup);

      restoreTerminal();
      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('should execute callbacks in reverse order (LIFO)', () => {
      const order: number[] = [];

      onTerminalPanic(() => order.push(1));
      onTerminalPanic(() => order.push(2));
      onTerminalPanic(() => order.push(3));

      restoreTerminal();
      expect(order).toEqual([3, 2, 1]);
    });

    it('should return an unregister function', () => {
      const cleanup = vi.fn();
      const unregister = onTerminalPanic(cleanup);

      unregister();
      restoreTerminal();
      expect(cleanup).not.toHaveBeenCalled();
    });

    it('should support multiple cleanups', () => {
      const a = vi.fn();
      const b = vi.fn();

      onTerminalPanic(a);
      onTerminalPanic(b);

      restoreTerminal();
      expect(a).toHaveBeenCalledTimes(1);
      expect(b).toHaveBeenCalledTimes(1);
    });
  });

  describe('restoreTerminal', () => {
    it('should swallow errors from individual callbacks', () => {
      const before = vi.fn();
      const failing = () => { throw new Error('boom'); };
      const after = vi.fn();

      onTerminalPanic(after);  // registered second, runs first (LIFO)
      onTerminalPanic(failing);
      onTerminalPanic(before);

      // Should not throw
      restoreTerminal();
      expect(before).toHaveBeenCalledTimes(1);
      expect(after).toHaveBeenCalledTimes(1);
    });

    it('should be re-entrant safe', () => {
      const cleanup = vi.fn();
      onTerminalPanic(() => {
        // Try to call restoreTerminal recursively
        restoreTerminal();
      });
      onTerminalPanic(cleanup);

      restoreTerminal();
      // cleanup should only be called once despite re-entrancy
      expect(cleanup).toHaveBeenCalledTimes(1);
    });
  });

  describe('installPanicHooks', () => {
    it('should be idempotent', () => {
      const processOnSpy = vi.spyOn(process, 'on');

      installPanicHooks();
      const firstCallCount = processOnSpy.mock.calls.length;

      installPanicHooks();
      // Should not register more handlers
      expect(processOnSpy.mock.calls.length).toBe(firstCallCount);

      processOnSpy.mockRestore();
    });

    it('should observe exit and fatal errors without owning process semantics', () => {
      const processOnSpy = vi.spyOn(process, 'on');

      installPanicHooks();

      const events = processOnSpy.mock.calls.map(([event]) => event);
      expect(events).toContain('exit');
      expect(events).toContain('uncaughtExceptionMonitor');
      expect(events).not.toContain('SIGINT');
      expect(events).not.toContain('SIGTERM');
      expect(events).not.toContain('uncaughtException');

      processOnSpy.mockRestore();
    });

    it('should remove hooks after the last installation is released', () => {
      const processOffSpy = vi.spyOn(process, 'off');
      const releaseA = installPanicHooks();
      const releaseB = installPanicHooks();

      releaseA();
      expect(processOffSpy).not.toHaveBeenCalled();
      releaseB();

      const events = processOffSpy.mock.calls.map(([event]) => event);
      expect(events).toContain('exit');
      expect(events).toContain('uncaughtExceptionMonitor');
      processOffSpy.mockRestore();
    });
  });

  describe('removePanicHooks', () => {
    it('should remove all process handlers', () => {
      const processOffSpy = vi.spyOn(process, 'off');

      installPanicHooks();
      removePanicHooks();

      const events = processOffSpy.mock.calls.map(([event]) => event);
      expect(events).toContain('exit');
      expect(events).toContain('uncaughtExceptionMonitor');

      processOffSpy.mockRestore();
    });

    it('should clear all registered cleanups', () => {
      const cleanup = vi.fn();
      onTerminalPanic(cleanup);

      installPanicHooks();
      removePanicHooks();

      restoreTerminal();
      expect(cleanup).not.toHaveBeenCalled();
    });

    it('should be safe to call when not installed', () => {
      // Should not throw
      removePanicHooks();
    });
  });
});
