/**
 * useThresholdColor - Reactive threshold-based color resolution
 *
 * @description Returns a reactive color based on value thresholds.
 * Automatically updates when the value crosses threshold boundaries.
 *
 * @example
 * ```typescript
 * // With static value
 * const color = useThresholdColor(50, {
 *   success: [0, 100],
 *   warning: [100, 500],
 *   error: [500, Infinity],
 * })
 *
 * // With reactive signal
 * const [latency, setLatency] = createSignal(50)
 * const color = useThresholdColor(latency, {
 *   success: [0, 100],
 *   error: [100, Infinity],
 * })
 *
 * // Use in component - automatically reactive
 * Text({ color: color() }, `Latency: ${latency()}ms`)
 * ```
 */

import { createMemo } from '../primitives/signal.js';
import { resolveColor } from '../core/theme.js';
import { resolve, type MaybeReactive } from '../utils/resolve.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Threshold range as [min, max] inclusive tuple
 */
export type ThresholdRange = [number, number];

/**
 * Threshold configuration
 * Each key maps to a color and a [min, max] range
 */
export interface ThresholdConfig {
  /** Range for success/green coloring */
  success?: ThresholdRange;
  /** Range for warning/yellow coloring */
  warning?: ThresholdRange;
  /** Range for error/red coloring */
  error?: ThresholdRange;
  /** Range for info/blue coloring */
  info?: ThresholdRange;
  /** Range for muted/gray coloring */
  muted?: ThresholdRange;
}

/**
 * Extended threshold config with custom color ranges
 */
export interface ExtendedThresholdConfig extends ThresholdConfig {
  /** Custom color ranges: { 'cyan': [0, 50], 'magenta': [50, 100] } */
  [key: string]: ThresholdRange | undefined;
}

// =============================================================================
// Threshold Color Mapping
// =============================================================================

const THRESHOLD_COLORS: Record<keyof ThresholdConfig, string> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  info: 'info',
  muted: 'muted',
};

/**
 * Check if value is within range (inclusive)
 */
function inRange(value: number, range: ThresholdRange): boolean {
  return value >= range[0] && value <= range[1];
}

/**
 * Resolve threshold to color
 */
function resolveThreshold(
  value: number,
  thresholds: ExtendedThresholdConfig,
  defaultColor: string
): string {
  // Check known thresholds first (for proper color mapping)
  for (const key of Object.keys(THRESHOLD_COLORS) as (keyof ThresholdConfig)[]) {
    const range = thresholds[key];
    if (range && inRange(value, range)) {
      return THRESHOLD_COLORS[key];
    }
  }

  // Check custom thresholds
  for (const [key, range] of Object.entries(thresholds)) {
    if (range && !(key in THRESHOLD_COLORS) && inRange(value, range)) {
      return key; // Use the key as color name
    }
  }

  return defaultColor;
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Returns a reactive color signal based on value thresholds
 *
 * @param value - Number or signal returning number
 * @param thresholds - Threshold configuration with ranges
 * @param defaultColor - Fallback color if no threshold matches (default: 'foreground')
 * @returns Signal that returns the resolved color
 *
 * @example
 * ```typescript
 * // CPU usage coloring
 * const cpuColor = useThresholdColor(cpuPercent, {
 *   success: [0, 50],
 *   warning: [50, 80],
 *   error: [80, 100],
 * })
 *
 * // Response time coloring (lower is better)
 * const latencyColor = useThresholdColor(() => latency(), {
 *   success: [0, 100],
 *   warning: [100, 500],
 *   error: [500, Infinity],
 * })
 *
 * // Custom colors
 * const scoreColor = useThresholdColor(score, {
 *   error: [0, 20],
 *   warning: [20, 60],
 *   success: [60, 100],
 * })
 * ```
 */
export function useThresholdColor(
  value: MaybeReactive<number>,
  thresholds: ExtendedThresholdConfig,
  defaultColor = 'foreground'
): () => string {
  return createMemo(() => {
    const v = resolve(value);
    const colorName = resolveThreshold(v, thresholds, defaultColor);
    return resolveColor(colorName);
  });
}

/**
 * Get threshold color without reactivity (for one-time resolution)
 *
 * @param value - Number value
 * @param thresholds - Threshold configuration
 * @param defaultColor - Fallback color
 * @returns Resolved color string
 */
export function getThresholdColor(
  value: number,
  thresholds: ExtendedThresholdConfig,
  defaultColor = 'foreground'
): string {
  const colorName = resolveThreshold(value, thresholds, defaultColor);
  return resolveColor(colorName);
}

/**
 * Get threshold color name without resolving to actual color
 * Useful when you need the semantic name, not the hex value
 */
export function getThresholdColorName(
  value: number,
  thresholds: ExtendedThresholdConfig,
  defaultColor = 'foreground'
): string {
  return resolveThreshold(value, thresholds, defaultColor);
}
