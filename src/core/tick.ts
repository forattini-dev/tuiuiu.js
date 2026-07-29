/**
 * Runtime-scoped Tick System
 *
 * A single timer that drives all animations in the application.
 * Components subscribe to this tick instead of creating their own timers.
 *
 * Benefits:
 * - Single setInterval for all animations (efficient)
 * - Synchronized animations across components
 * - Easy to pause/resume per app runtime
 * - Storybook can control the tick externally
 *
 * @example
 * // Start the runtime tick (usually done once at app level)
 * startTick();
 *
 * // In a component, use the tick value
 * function MySpinner() {
 *   const frame = getTick() % spinnerFrames.length;
 *   return Text({}, spinnerFrames[frame]);
 * }
 *
 * // Or subscribe to tick changes
 * onTick(() => {
 *   // Called every tick
 * });
 */

import { createSignal } from '../primitives/signal.js';
import { onTerminalFocusChange, readTerminalFocus } from './terminal-focus.js';
import { subscribeMotionInterval } from './motion-runtime.js';
import {
  bindRuntimeScope,
  getDefaultRuntimeResource,
  getDefaultRuntimeScope,
  getRuntimeResource,
  getRuntimeScope,
  RUNTIME_RESOURCE_DISPOSE,
  type RuntimeScope,
} from './runtime-scope.js';

interface TickRuntimeState {
  tick: () => number;
  setTick: (value: number | ((previous: number) => number)) => void;
  isRunning: () => boolean;
  setIsRunning: (value: boolean | ((previous: boolean) => boolean)) => void;
  tickRate: number;
  tickListeners: Set<(tick: number) => void>;
  tickRequested: boolean;
  tickPausedByFocus: boolean;
  cleanupFocusSubscription: (() => void) | null;
  unsubscribeTickInterval: (() => void) | null;
  scope: RuntimeScope;
  [RUNTIME_RESOURCE_DISPOSE](): void;
}

const TICK_RUNTIME_STATE = Symbol('tuiuiu.tick-runtime-state');

function createTickRuntimeState(scope: RuntimeScope): TickRuntimeState {
  const defaults = scope.id === 0
    ? null
    : getDefaultRuntimeResource(
        TICK_RUNTIME_STATE,
        () => createTickRuntimeState(getDefaultRuntimeScope()),
      );
  const [tick, setTick] = createSignal(defaults?.tick() ?? 0);
  const [isRunning, setIsRunning] = createSignal(false);
  const state: TickRuntimeState = {
    tick,
    setTick,
    isRunning,
    setIsRunning,
    tickRate: defaults?.tickRate ?? 100,
    tickListeners: new Set(),
    tickRequested: false,
    tickPausedByFocus: false,
    cleanupFocusSubscription: null,
    unsubscribeTickInterval: null,
    scope,
    [RUNTIME_RESOURCE_DISPOSE]() {
      state.unsubscribeTickInterval?.();
      state.unsubscribeTickInterval = null;
      state.cleanupFocusSubscription?.();
      state.cleanupFocusSubscription = null;
      state.tickListeners.clear();
      state.tickRequested = false;
      state.tickPausedByFocus = false;
      state.setIsRunning(false);
    },
  };
  return state;
}

function getTickRuntimeState(): TickRuntimeState {
  const scope = getRuntimeScope();
  return getRuntimeResource(
    TICK_RUNTIME_STATE,
    () => createTickRuntimeState(scope),
    scope,
  );
}

function createTickInterval(state: TickRuntimeState): void {
  if (state.unsubscribeTickInterval) {
    return;
  }

  state.setIsRunning(true);
  state.tickPausedByFocus = false;
  state.unsubscribeTickInterval = subscribeMotionInterval(state.tickRate, () => {
    const newTick = state.tick() + 1;
    state.setTick(newTick);

    // Notify listeners
    for (const listener of [...state.tickListeners]) listener(newTick);
  }, {
    pauseWhenUnfocused: true,
  });
}

function ensureFocusSubscription(state: TickRuntimeState): void {
  if (state.cleanupFocusSubscription) {
    return;
  }

  state.cleanupFocusSubscription = onTerminalFocusChange(bindRuntimeScope(state.scope, (focused) => {
    if (!focused) {
      if (state.unsubscribeTickInterval) {
        state.tickPausedByFocus = state.tickRequested;
        state.setIsRunning(false);
      }
      return;
    }

    if (state.tickRequested && state.tickPausedByFocus) {
      createTickInterval(state);
      state.tickPausedByFocus = false;
      state.setIsRunning(true);
    }
  }));
}

/**
 * Get current tick value (reactive)
 */
export function getTick(): number {
  return getTickRuntimeState().tick();
}

/**
 * Get tick as a signal getter (for direct use in reactive contexts)
 */
export function tick(): number {
  return getTickRuntimeState().tick();
}

/**
 * Check if tick is running
 */
export function isTickRunning(): boolean {
  return getTickRuntimeState().isRunning();
}

/**
 * Start the current runtime tick
 * @param rate - Tick interval in ms (default: 100)
 */
export function startTick(rate: number = 100): void {
  const state = getTickRuntimeState();
  state.tickRate = Number.isFinite(rate) && rate > 0 ? rate : 100;
  state.tickRequested = true;
  ensureFocusSubscription(state);

  if (state.unsubscribeTickInterval) return; // Already running
  if (!readTerminalFocus(state.scope)) {
    createTickInterval(state);
    state.tickPausedByFocus = true;
    state.setIsRunning(false);
    return;
  }

  createTickInterval(state);
}

/**
 * Stop the current runtime tick
 */
export function stopTick(): void {
  const state = getTickRuntimeState();
  state.tickRequested = false;
  state.tickPausedByFocus = false;
  state.unsubscribeTickInterval?.();
  state.unsubscribeTickInterval = null;
  state.cleanupFocusSubscription?.();
  state.cleanupFocusSubscription = null;
  state.setIsRunning(false);
}

/**
 * Pause the tick (keeps current value)
 */
export function pauseTick(): void {
  stopTick();
}

/**
 * Resume the tick from current value
 */
export function resumeTick(): void {
  const state = getTickRuntimeState();
  state.tickRequested = true;
  ensureFocusSubscription(state);

  if (!state.isRunning()) {
    if (!readTerminalFocus(state.scope)) {
      state.tickPausedByFocus = true;
      return;
    }
    createTickInterval(state);
  }
}

/**
 * Reset tick to 0
 */
export function resetTick(): void {
  getTickRuntimeState().setTick(0);
}

/**
 * Set tick rate (restarts if running)
 */
export function setTickRate(rate: number): void {
  const state = getTickRuntimeState();
  const wasRequested = state.tickRequested;
  stopTick();
  state.tickRate = Number.isFinite(rate) && rate > 0 ? rate : 100;
  if (wasRequested) {
    startTick(rate);
  }
}

/**
 * Get current tick rate
 */
export function getTickRate(): number {
  return getTickRuntimeState().tickRate;
}

/**
 * Subscribe to tick changes
 * @returns Unsubscribe function
 */
export function onTick(callback: (tick: number) => void): () => void {
  const state = getTickRuntimeState();
  state.tickListeners.add(callback);
  return () => state.tickListeners.delete(callback);
}

/**
 * Manually advance tick by N steps (useful for testing/storybook)
 */
export function advanceTick(steps: number = 1): void {
  const state = getTickRuntimeState();
  state.setTick(state.tick() + steps);
}

/**
 * Set tick to specific value (useful for testing/storybook)
 */
export function setTickValue(value: number): void {
  getTickRuntimeState().setTick(value);
}

// ============================================================================
// Utility functions for common animation patterns
// ============================================================================

/**
 * Get a frame index for cycling through an array
 * @param frames - Number of frames or array
 * @param speed - How many ticks per frame change (default: 1)
 */
export function getFrame<T>(frames: T[] | number, speed: number = 1): number {
  const length = typeof frames === 'number' ? frames : frames.length;
  return Math.floor(getTickRuntimeState().tick() / speed) % length;
}

/**
 * Get current item from an array based on tick
 */
export function getFrameItem<T>(frames: T[], speed: number = 1): T {
  return frames[getFrame(frames, speed)];
}

/**
 * Get a value that oscillates between 0 and max
 * Useful for ping-pong animations
 */
export function oscillate(max: number, speed: number = 1): number {
  const period = max * 2;
  const pos = Math.floor(getTickRuntimeState().tick() / speed) % period;
  return pos < max ? pos : period - pos;
}

/**
 * Get elapsed time in seconds since tick started
 */
export function getElapsedSeconds(): number {
  const state = getTickRuntimeState();
  return (state.tick() * state.tickRate) / 1000;
}

/**
 * Check if we're on a specific tick interval
 * Useful for: "do something every 10 ticks"
 */
export function everyNTicks(n: number): boolean {
  return getTickRuntimeState().tick() % n === 0;
}
