/**
 * useFps Hook
 *
 * React-like hook for FPS tracking in Tuiuiu components.
 * Automatically tracks frames and provides reactive FPS value.
 *
 * @example
 * function MyApp() {
 *   const { fps, metrics } = useFps();
 *
 *   return Box({},
 *     Text({}, `FPS: ${fps}`),
 *     Text({}, `Avg: ${metrics.avgFps}`),
 *   );
 * }
 */

import { trackFrame, getFps, getFpsMetrics, type FpsMetrics } from '../core/fps.js';

// =============================================================================
// Types
// =============================================================================

export interface UseFpsResult {
  /** Current FPS */
  fps: number;
  /** Detailed metrics */
  metrics: FpsMetrics;
  /** FPS color indicator: 'green' | 'yellow' | 'red' */
  color: 'green' | 'yellow' | 'red';
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook for FPS tracking.
 *
 * Automatically calls trackFrame() on each render and returns current metrics.
 */
export function useFps(): UseFpsResult {
  // Track this render as a frame
  trackFrame();

  const fps = getFps();
  const metrics = getFpsMetrics();

  // Determine color based on performance
  let color: 'green' | 'yellow' | 'red' = 'green';
  if (fps < 30) color = 'yellow';
  if (fps < 15) color = 'red';

  return { fps, metrics, color };
}
