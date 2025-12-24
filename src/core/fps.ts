/**
 * FPS Tracker
 *
 * Native FPS tracking for Tuiuiu applications.
 * Tracks render frame rate and provides performance metrics.
 *
 * @example
 * // In render loop or component
 * trackFrame();
 *
 * // Get current FPS
 * const fps = getFps();
 *
 * // Get detailed metrics
 * const metrics = getFpsMetrics();
 */

// =============================================================================
// Types
// =============================================================================

export interface FpsMetrics {
  /** Current frames per second */
  fps: number;
  /** Average FPS over the last 10 seconds */
  avgFps: number;
  /** Minimum FPS recorded */
  minFps: number;
  /** Maximum FPS recorded */
  maxFps: number;
  /** Total frames rendered */
  totalFrames: number;
  /** Time since tracking started (ms) */
  uptime: number;
  /** Frame time in ms (1000/fps) */
  frameTime: number;
}

// =============================================================================
// State
// =============================================================================

const state = {
  frameCount: 0,
  lastFpsTime: Date.now(),
  startTime: Date.now(),
  currentFps: 0,
  totalFrames: 0,
  // Rolling average
  fpsHistory: [] as number[],
  maxHistorySize: 10,
  minFps: Infinity,
  maxFps: 0,
};

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Track a frame render. Call this once per render cycle.
 */
export function trackFrame(): void {
  state.frameCount++;
  state.totalFrames++;

  const now = Date.now();
  const elapsed = now - state.lastFpsTime;

  // Update FPS every second
  if (elapsed >= 1000) {
    state.currentFps = Math.round((state.frameCount * 1000) / elapsed);
    state.frameCount = 0;
    state.lastFpsTime = now;

    // Update history for rolling average
    state.fpsHistory.push(state.currentFps);
    if (state.fpsHistory.length > state.maxHistorySize) {
      state.fpsHistory.shift();
    }

    // Update min/max (ignore 0 for min)
    if (state.currentFps > 0 && state.currentFps < state.minFps) {
      state.minFps = state.currentFps;
    }
    if (state.currentFps > state.maxFps) {
      state.maxFps = state.currentFps;
    }
  }
}

/**
 * Get current FPS value.
 */
export function getFps(): number {
  return state.currentFps;
}

/**
 * Get detailed FPS metrics.
 */
export function getFpsMetrics(): FpsMetrics {
  const avgFps =
    state.fpsHistory.length > 0
      ? Math.round(state.fpsHistory.reduce((a, b) => a + b, 0) / state.fpsHistory.length)
      : 0;

  return {
    fps: state.currentFps,
    avgFps,
    minFps: state.minFps === Infinity ? 0 : state.minFps,
    maxFps: state.maxFps,
    totalFrames: state.totalFrames,
    uptime: Date.now() - state.startTime,
    frameTime: state.currentFps > 0 ? Math.round(1000 / state.currentFps) : 0,
  };
}

/**
 * Reset FPS tracking state.
 */
export function resetFps(): void {
  state.frameCount = 0;
  state.lastFpsTime = Date.now();
  state.startTime = Date.now();
  state.currentFps = 0;
  state.totalFrames = 0;
  state.fpsHistory = [];
  state.minFps = Infinity;
  state.maxFps = 0;
}

/**
 * Get FPS color based on performance thresholds.
 * Green >= 30, Yellow >= 15, Red < 15
 */
export function getFpsColor(fps: number): 'green' | 'yellow' | 'red' {
  if (fps >= 30) return 'green';
  if (fps >= 15) return 'yellow';
  return 'red';
}
