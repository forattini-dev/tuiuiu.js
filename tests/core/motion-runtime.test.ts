import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  configureMotionRuntime,
  getMotionRuntimeState,
  reportMotionFrameCost,
  requestMotionFrame,
  resetMotionRuntime,
  subscribeMotionInterval,
} from '../../src/core/motion-runtime.js';
import { resetTerminalFocusState, setTerminalFocusState } from '../../src/core/terminal-focus.js';

describe('motion-runtime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetMotionRuntime();
    resetTerminalFocusState();
  });

  afterEach(() => {
    resetMotionRuntime();
    resetTerminalFocusState();
    vi.useRealTimers();
  });

  it('respects configured presentation fps for frame callbacks', () => {
    configureMotionRuntime({ targetFps: 20, reducedFps: 10 });
    const callback = vi.fn();

    requestMotionFrame(callback);
    vi.advanceTimersByTime(49);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('degrades and recovers quality tiers from committed frame cost', () => {
    expect(getMotionRuntimeState().qualityTier).toBe('full');

    reportMotionFrameCost(40);
    expect(getMotionRuntimeState().qualityTier).toBe('reduced');

    reportMotionFrameCost(40);
    expect(getMotionRuntimeState().qualityTier).toBe('skip');

    for (let index = 0; index < 5; index++) {
      reportMotionFrameCost(8);
    }
    expect(getMotionRuntimeState().qualityTier).toBe('reduced');

    for (let index = 0; index < 5; index++) {
      reportMotionFrameCost(8);
    }
    expect(getMotionRuntimeState().qualityTier).toBe('full');
  });

  it('pauses interval subscriptions that opt out while unfocused', () => {
    const callback = vi.fn();
    setTerminalFocusState(false);

    subscribeMotionInterval(100, callback, { pauseWhenUnfocused: true });
    vi.advanceTimersByTime(200);
    expect(callback).not.toHaveBeenCalled();

    setTerminalFocusState(true);
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
