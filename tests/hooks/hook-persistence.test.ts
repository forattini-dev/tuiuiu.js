/**
 * Hook Persistence Tests
 *
 * Tests that hooks properly persist state across re-renders
 * and don't create duplicate handlers/effects.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  beginRender,
  endRender,
  resetHookState,
  getInputHandlerCount,
  emitInput,
  clearInputHandlers,
} from '../../src/hooks/context.js';
import { useState } from '../../src/hooks/use-state.js';
import { useInput, parseKeypress } from '../../src/hooks/use-input.js';
import { useEffect } from '../../src/hooks/use-effect.js';
import { batch } from '../../src/primitives/signal.js';

describe('Hook Persistence', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  describe('useState', () => {
    it('persists state across re-renders', () => {
      let getter: () => number;
      let setter: (v: number | ((n: number) => number)) => void;

      // First render
      beginRender();
      [getter, setter] = useState(0);
      endRender();

      expect(getter()).toBe(0);
      setter(1);
      expect(getter()).toBe(1);

      // Second render - should return same signal
      beginRender();
      const [getter2, setter2] = useState(999); // Initial value should be ignored
      endRender();

      expect(getter2()).toBe(1); // Should be 1, not 999
      expect(getter2).toBe(getter); // Same getter function
      expect(setter2).toBe(setter); // Same setter function
    });

    it('supports multiple useState calls with independent state', () => {
      // First render
      beginRender();
      const [count, setCount] = useState(0);
      const [name, setName] = useState('');
      const [active, setActive] = useState(false);
      endRender();

      setCount(5);
      setName('test');
      setActive(true);

      // Second render
      beginRender();
      const [count2, setCount2] = useState(999);
      const [name2, setName2] = useState('ignored');
      const [active2, setActive2] = useState(false);
      endRender();

      expect(count2()).toBe(5);
      expect(name2()).toBe('test');
      expect(active2()).toBe(true);
    });

    it('works with functional updates', () => {
      beginRender();
      const [count, setCount] = useState(0);
      endRender();

      setCount((c) => c + 1);
      setCount((c) => c + 1);
      setCount((c) => c + 1);

      beginRender();
      const [count2] = useState(0);
      endRender();

      expect(count2()).toBe(3);
    });
  });

  describe('useInput', () => {
    it('registers handler only once across re-renders', () => {
      const handler = vi.fn();

      // First render
      beginRender();
      useInput(handler);
      endRender();

      expect(getInputHandlerCount()).toBe(1);

      // Second render
      beginRender();
      useInput(handler);
      endRender();

      expect(getInputHandlerCount()).toBe(1); // Still 1, not 2

      // Third render
      beginRender();
      useInput(handler);
      endRender();

      expect(getInputHandlerCount()).toBe(1); // Still 1
    });

    it('calls the latest handler version', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      // First render with handler1
      beginRender();
      useInput(handler1);
      endRender();

      // Simulate keypress via EventEmitter
      const { input, key } = parseKeypress(Buffer.from('a'));
      batch(() => {
        emitInput(input, key);
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(0);

      handler1.mockClear();

      // Second render with handler2
      beginRender();
      useInput(handler2);
      endRender();

      // Simulate another keypress - should call handler2 now
      batch(() => {
        emitInput(input, key);
      });

      expect(handler1).toHaveBeenCalledTimes(0); // Old handler not called
      expect(handler2).toHaveBeenCalledTimes(1); // New handler called
    });

    it('supports multiple useInput calls', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      // First render
      beginRender();
      useInput(handler1);
      useInput(handler2);
      endRender();

      expect(getInputHandlerCount()).toBe(2);

      // Second render
      beginRender();
      useInput(handler1);
      useInput(handler2);
      endRender();

      expect(getInputHandlerCount()).toBe(2); // Still 2

      // Simulate keypress via EventEmitter - both should be called
      const { input, key } = parseKeypress(Buffer.from('x'));
      batch(() => {
        emitInput(input, key);
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('handles isActive option correctly', () => {
      const handler = vi.fn();

      // First render - active
      beginRender();
      useInput(handler, { isActive: true });
      endRender();

      expect(getInputHandlerCount()).toBe(1);

      // Second render - inactive
      beginRender();
      useInput(handler, { isActive: false });
      endRender();

      expect(getInputHandlerCount()).toBe(0); // Handler removed

      // Third render - active again
      beginRender();
      useInput(handler, { isActive: true });
      endRender();

      expect(getInputHandlerCount()).toBe(1); // Handler re-added
    });
  });

  describe('useEffect', () => {
    it('runs effect only once on first render', () => {
      const effectFn = vi.fn();

      // First render
      beginRender();
      useEffect(effectFn);
      endRender();

      expect(effectFn).toHaveBeenCalledTimes(1);

      // Second render - effect should NOT run again
      // (unless dependencies changed)
      beginRender();
      useEffect(effectFn);
      endRender();

      expect(effectFn).toHaveBeenCalledTimes(1); // Still 1
    });

    it('calls cleanup on dispose', () => {
      const cleanup = vi.fn();
      const effectFn = vi.fn(() => cleanup);

      beginRender();
      const dispose = useEffect(effectFn);
      endRender();

      expect(effectFn).toHaveBeenCalledTimes(1);
      expect(cleanup).toHaveBeenCalledTimes(0);

      dispose();

      expect(cleanup).toHaveBeenCalledTimes(1);
    });

    it('supports multiple useEffect calls', () => {
      const effect1 = vi.fn();
      const effect2 = vi.fn();

      beginRender();
      useEffect(effect1);
      useEffect(effect2);
      endRender();

      expect(effect1).toHaveBeenCalledTimes(1);
      expect(effect2).toHaveBeenCalledTimes(1);

      // Second render
      beginRender();
      useEffect(effect1);
      useEffect(effect2);
      endRender();

      // Should still be 1 each (not called again)
      expect(effect1).toHaveBeenCalledTimes(1);
      expect(effect2).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hook order consistency', () => {
    it('maintains correct hook order with mixed hooks', () => {
      let count1Getter: () => number;
      let count2Getter: () => number;
      const handler = vi.fn();
      const effect = vi.fn();

      // First render - mixed hook order
      beginRender();
      [count1Getter] = useState(10);
      useInput(handler);
      [count2Getter] = useState(20);
      useEffect(effect);
      endRender();

      expect(count1Getter()).toBe(10);
      expect(count2Getter()).toBe(20);

      // Second render - same order
      beginRender();
      const [c1] = useState(999);
      useInput(handler);
      const [c2] = useState(888);
      useEffect(effect);
      endRender();

      expect(c1()).toBe(10); // Persisted, not 999
      expect(c2()).toBe(20); // Persisted, not 888
      expect(getInputHandlerCount()).toBe(1);
    });
  });

  describe('resetHookState', () => {
    it('clears all hook state', () => {
      beginRender();
      const [count, setCount] = useState(0);
      useInput(vi.fn());
      useEffect(vi.fn());
      endRender();

      setCount(100);

      // Reset
      resetHookState();

      // New render - should start fresh
      beginRender();
      const [count2] = useState(0);
      endRender();

      expect(count2()).toBe(0); // Fresh state, not 100
    });
  });
});
