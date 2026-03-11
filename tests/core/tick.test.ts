import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTick,
  isTickRunning,
  resetTick,
  resumeTick,
  startTick,
  stopTick,
} from '../../src/core/tick.js';
import { resetMotionRuntime } from '../../src/core/motion-runtime.js';
import { resetTerminalFocusState, setTerminalFocusState } from '../../src/core/terminal-focus.js';

describe('tick focus behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetMotionRuntime();
    stopTick();
    resetTick();
    resetTerminalFocusState();
  });

  afterEach(() => {
    stopTick();
    resetTick();
    resetMotionRuntime();
    resetTerminalFocusState();
    vi.useRealTimers();
  });

  it('should pause a running tick when the terminal loses focus and resume on focus regain', () => {
    startTick(100);
    expect(isTickRunning()).toBe(true);

    vi.advanceTimersByTime(100);
    expect(getTick()).toBe(1);

    setTerminalFocusState(false);
    expect(isTickRunning()).toBe(false);
    vi.advanceTimersByTime(500);
    expect(getTick()).toBe(1);

    setTerminalFocusState(true);
    expect(isTickRunning()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(getTick()).toBe(2);
  });

  it('should wait to start until focus returns when resumed while unfocused', () => {
    setTerminalFocusState(false);

    resumeTick();
    expect(isTickRunning()).toBe(false);
    vi.advanceTimersByTime(200);
    expect(getTick()).toBe(0);

    setTerminalFocusState(true);
    expect(isTickRunning()).toBe(true);
    vi.advanceTimersByTime(100);
    expect(getTick()).toBe(1);
  });

  it('should not auto-resume after an explicit stop', () => {
    startTick(100);
    vi.advanceTimersByTime(100);
    expect(getTick()).toBe(1);

    setTerminalFocusState(false);
    stopTick();
    setTerminalFocusState(true);

    expect(isTickRunning()).toBe(false);
    vi.advanceTimersByTime(200);
    expect(getTick()).toBe(1);
  });
});
