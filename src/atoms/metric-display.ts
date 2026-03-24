/**
 * MetricDisplay - Dashboard metric component with auto-tracking
 *
 * @layer Atom
 * @description Displays metrics with value, trend sparkline, delta, and threshold colors
 *
 * Features:
 * - createMetric() state factory with auto-tracking
 * - Automatic history for trend sparklines
 * - Automatic delta calculation
 * - Threshold-based coloring
 * - Signal-transparent props
 * - Horizontal/vertical layouts
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { resolveColor } from '../core/theme.js';
import { createSignal, createMemo } from '../primitives/signal.js';
import { resolve, type MaybeReactive } from '../utils/resolve.js';
import { formatDelta } from '../utils/formatters.js';
import { Sparkline } from '../molecules/data-viz/sparkline.js';
import {
  useThresholdColor,
  getThresholdColor,
  type ExtendedThresholdConfig,
} from '../hooks/use-threshold-color.js';

// =============================================================================
// Types
// =============================================================================

export type MetricLayout = 'horizontal' | 'vertical';
export type MetricSize = 'compact' | 'normal' | 'large';

/** Metric state returned by createMetric */
export interface MetricState {
  /** Current value signal */
  value: () => number;
  /** Update value and track history */
  set: (n: number) => void;
  /** History array signal */
  history: () => number[];
  /** Delta percentage signal (change from previous) */
  delta: () => number;
  /** Threshold-resolved color signal */
  color: () => string;
  /** Metric label */
  label: string;
  /** Unit suffix */
  unit: string;
}

/** Options for createMetric */
export interface CreateMetricOptions {
  /** Metric label */
  label: string;
  /** Unit suffix (e.g., 'ms', '%', 'MB') */
  unit?: string;
  /** Initial value */
  initial?: number;
  /** History size for trend (default: 10) */
  historySize?: number;
  /** Threshold configuration for coloring */
  thresholds?: ExtendedThresholdConfig;
}

/** MetricDisplay props */
export interface MetricDisplayProps {
  /** Use metric state from createMetric() */
  metric?: MetricState;

  // OR individual props (for one-off usage)
  /** Metric label */
  label?: MaybeReactive<string>;
  /** Current value */
  value?: MaybeReactive<number>;
  /** Unit suffix */
  unit?: MaybeReactive<string>;
  /** Trend data for sparkline */
  trend?: MaybeReactive<number[]>;
  /** Width of sparkline in chars (default: 10) */
  trendWidth?: number;
  /** Delta percentage */
  delta?: MaybeReactive<number>;
  /** Threshold config for value coloring */
  thresholds?: ExtendedThresholdConfig;

  // Layout options
  /** Layout direction (default: 'horizontal') */
  layout?: MetricLayout;
  /** Size variant (default: 'normal') */
  size?: MetricSize;
  /** Show sparkline trend (default: true if trend data available) */
  showTrend?: boolean;
  /** Show delta indicator (default: true if delta available) */
  showDelta?: boolean;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a metric state manager with auto-tracking
 *
 * Automatically tracks history for trend sparklines and calculates delta
 * percentage when values change.
 *
 * @example
 * ```typescript
 * const cpu = createMetric({
 *   label: 'CPU',
 *   unit: '%',
 *   historySize: 20,
 *   thresholds: {
 *     success: [0, 50],
 *     warning: [50, 80],
 *     error: [80, 100],
 *   },
 * })
 *
 * // Update value - history and delta auto-calculated
 * cpu.set(45)
 * cpu.set(52)
 *
 * // Use with component
 * MetricDisplay({ metric: cpu })
 * ```
 */
export function createMetric(options: CreateMetricOptions): MetricState {
  const {
    label,
    unit = '',
    initial = 0,
    historySize = 10,
    thresholds,
  } = options;

  // Internal signals
  const [value, setValue] = createSignal(initial);
  const [history, setHistory] = createSignal<number[]>([initial]);

  // Delta calculation (memoized)
  const delta = createMemo(() => {
    const h = history();
    if (h.length < 2) return 0;
    const prev = h[h.length - 2];
    const curr = h[h.length - 1];
    if (prev === 0) return curr === 0 ? 0 : 100;
    return ((curr - prev) / Math.abs(prev)) * 100;
  });

  // Threshold color (memoized)
  const color = thresholds
    ? useThresholdColor(value, thresholds)
    : () => resolveColor('foreground');

  // Update function
  const set = (n: number) => {
    setValue(n);
    setHistory((h) => {
      const newHistory = [...h, n];
      // Keep history within size limit
      if (newHistory.length > historySize) {
        return newHistory.slice(-historySize);
      }
      return newHistory;
    });
  };

  return {
    value,
    set,
    history,
    delta,
    color,
    label,
    unit,
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * MetricDisplay - Displays a metric with value, trend, and delta
 *
 * @example
 * // With createMetric state
 * const metric = createMetric({ label: 'CPU', unit: '%' })
 * metric.set(45)
 * MetricDisplay({ metric })
 *
 * @example
 * // With individual props
 * MetricDisplay({
 *   label: 'Response Time',
 *   value: 145,
 *   unit: 'ms',
 *   trend: [120, 130, 145, 142, 145],
 *   delta: 2.1,
 *   thresholds: { success: [0, 200], error: [200, Infinity] },
 * })
 *
 * @example
 * // Compact vertical layout
 * MetricDisplay({
 *   metric,
 *   layout: 'vertical',
 *   size: 'compact',
 * })
 */
export function MetricDisplay(props: MetricDisplayProps): VNode {
  const {
    metric,
    layout = 'horizontal',
    size = 'normal',
    trendWidth = 10,
    showTrend = true,
    showDelta = true,
    thresholds,
  } = props;

  // Resolve values from metric or individual props
  const label = metric?.label ?? (props.label ? resolve(props.label) : '');
  const value = metric?.value() ?? (props.value !== undefined ? resolve(props.value) : 0);
  const unit = metric?.unit ?? (props.unit ? resolve(props.unit) : '');
  const trend = metric?.history() ?? (props.trend ? resolve(props.trend) : undefined);
  const delta = metric?.delta() ?? (props.delta !== undefined ? resolve(props.delta) : undefined);

  // Resolve color
  const valueColor = metric?.color()
    ?? (thresholds ? getThresholdColor(value, thresholds) : undefined);

  // Delta color (positive = success, negative = error)
  const deltaColor = delta !== undefined
    ? delta > 0 ? resolveColor('success') : delta < 0 ? resolveColor('error') : resolveColor('muted')
    : undefined;

  // Format value
  const formattedValue = typeof value === 'number'
    ? Number.isInteger(value) ? value.toString() : value.toFixed(1)
    : String(value);

  // Size-based styling
  const labelStyle = size === 'compact' ? { color: 'muted' as const } : {};
  const valueStyle = size === 'large' ? { bold: true } : {};

  // Vertical layout
  if (layout === 'vertical') {
    return Box(
      { flexDirection: 'column', gap: 0 },
      // Label
      Text(labelStyle, label),
      // Value row
      Box(
        { flexDirection: 'row', alignItems: 'center', gap: 1 },
        Text({ color: valueColor, ...valueStyle }, `${formattedValue}${unit}`),
        showDelta && delta !== undefined && Text(
          { color: deltaColor },
          formatDelta(delta)
        )
      ),
      // Trend
      showTrend && trend && trend.length > 1 && Sparkline({
        data: trend,
        width: trendWidth,
      })
    );
  }

  // Horizontal layout (default)
  return Box(
    { flexDirection: 'row', alignItems: 'center', gap: 2 },
    // Label
    Text(labelStyle, `${label}:`),
    // Value
    Text({ color: valueColor, ...valueStyle }, `${formattedValue}${unit}`),
    // Delta
    showDelta && delta !== undefined && Text(
      { color: deltaColor },
      formatDelta(delta)
    ),
    // Trend sparkline
    showTrend && trend && trend.length > 1 && Sparkline({
      data: trend,
      width: trendWidth,
    })
  );
}

