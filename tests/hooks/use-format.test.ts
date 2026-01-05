/**
 * Tests for reactive format hooks.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { createSignal } from '../../src/primitives/signal.js';
import {
  useFormatBytes,
  useFormatDuration,
  useFormatRelative,
  useFormatNumber,
  useFormatCompact,
  useFormatPercent,
  useFormatDelta,
} from '../../src/hooks/use-format.js';

describe('useFormat hooks', () => {
  afterEach(() => {
    resetHookState();
  });

  it('formats bytes reactively', () => {
    const [size, setSize] = createSignal(1024);
    const formatted = useFormatBytes(size, 'short');

    expect(formatted()).toBe('1.00K');
    setSize(1536);
    expect(formatted()).toBe('1.50K');
  });

  it('formats duration and numbers reactively', () => {
    const [seconds, setSeconds] = createSignal(90);
    const duration = useFormatDuration(seconds, 'short');

    expect(duration()).toBe('1:30');
    setSeconds(3661);
    expect(duration()).toBe('1:01:01');

    const [count, setCount] = createSignal(1234);
    const number = useFormatNumber(count, '.');
    expect(number()).toBe('1.234');
    setCount(999);
    expect(number()).toBe('999');
  });

  it('formats compact, percent, and delta values', () => {
    const compact = useFormatCompact(() => 1_200_000);
    const percent = useFormatPercent(() => 0.5);
    const delta = useFormatDelta(() => -3.2);

    expect(compact()).toBe('1.2M');
    expect(percent()).toBe('50%');
    expect(delta()).toBe('-3.2%');
  });

  describe('useFormatRelative', () => {
    beforeEach(() => {
      resetHookState();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      resetHookState();
    });

    it('updates relative time on interval', () => {
      const base = new Date('2020-01-01T00:00:00Z');
      vi.setSystemTime(base);

      beginRender();
      const relative = useFormatRelative(base.getTime(), 1000);
      endRender();

      expect(relative()).toBe('just now');

      vi.setSystemTime(new Date(base.getTime() + 61_000));
      vi.advanceTimersByTime(1000);

      expect(relative()).toBe('1 minute ago');
    });
  });
});
