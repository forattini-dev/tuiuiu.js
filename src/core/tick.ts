/**
 * Global Tick System
 *
 * A single timer that drives all animations in the application.
 * Components subscribe to this tick instead of creating their own timers.
 *
 * Benefits:
 * - Single setInterval for all animations (efficient)
 * - Synchronized animations across components
 * - Easy to pause/resume globally
 * - Storybook can control the tick externally
 *
 * @example
 * // Start the global tick (usually done once at app level)
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

// Global tick state
const [tick, setTick] = createSignal(0);
const [isRunning, setIsRunning] = createSignal(false);

let tickInterval: ReturnType<typeof setInterval> | null = null;
let tickRate = 100; // ms between ticks
const tickListeners: Set<(tick: number) => void> = new Set();

/**
 * Get current tick value (reactive)
 */
export function getTick(): number {
  return tick();
}

/**
 * Get tick as a signal getter (for direct use in reactive contexts)
 */
export { tick };

/**
 * Check if tick is running
 */
export function isTickRunning(): boolean {
  return isRunning();
}

/**
 * Start the global tick
 * @param rate - Tick interval in ms (default: 100)
 */
export function startTick(rate: number = 100): void {
  if (tickInterval) return; // Already running

  tickRate = rate;
  setIsRunning(true);

  tickInterval = setInterval(() => {
    const newTick = tick() + 1;
    setTick(newTick);

    // Notify listeners
    tickListeners.forEach(fn => fn(newTick));
  }, tickRate);
}

/**
 * Stop the global tick
 */
export function stopTick(): void {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
  setIsRunning(false);
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
  if (!isRunning()) {
    startTick(tickRate);
  }
}

/**
 * Reset tick to 0
 */
export function resetTick(): void {
  setTick(0);
}

/**
 * Set tick rate (restarts if running)
 */
export function setTickRate(rate: number): void {
  const wasRunning = isRunning();
  stopTick();
  tickRate = rate;
  if (wasRunning) {
    startTick(rate);
  }
}

/**
 * Get current tick rate
 */
export function getTickRate(): number {
  return tickRate;
}

/**
 * Subscribe to tick changes
 * @returns Unsubscribe function
 */
export function onTick(callback: (tick: number) => void): () => void {
  tickListeners.add(callback);
  return () => tickListeners.delete(callback);
}

/**
 * Manually advance tick by N steps (useful for testing/storybook)
 */
export function advanceTick(steps: number = 1): void {
  setTick(tick() + steps);
}

/**
 * Set tick to specific value (useful for testing/storybook)
 */
export function setTickValue(value: number): void {
  setTick(value);
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
  return Math.floor(tick() / speed) % length;
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
  const pos = Math.floor(tick() / speed) % period;
  return pos < max ? pos : period - pos;
}

/**
 * Get elapsed time in seconds since tick started
 */
export function getElapsedSeconds(): number {
  return (tick() * tickRate) / 1000;
}

/**
 * Check if we're on a specific tick interval
 * Useful for: "do something every 10 ticks"
 */
export function everyNTicks(n: number): boolean {
  return tick() % n === 0;
}
