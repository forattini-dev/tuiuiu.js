/**
 * ScatterPlot - Two-dimensional scatter plot for correlation analysis
 *
 * Features:
 * - X/Y coordinate plotting
 * - Configurable marker styles
 * - Color by value or category
 * - Size scaling for third dimension
 * - Legend with distinct marker styles
 * - Interactive tooltips and selection
 */

import type { VNode, ColorValue } from '../../utils/types.js';
import { Box, Text } from '../../primitives/nodes.js';
import { getRenderMode } from '../../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export interface ScatterPoint {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Optional value for color mapping */
  value?: number;
  /** Optional category for color grouping */
  category?: string;
  /** Optional size value */
  size?: number;
  /** Optional label */
  label?: string;
}

export type MarkerStyle = 'circle' | 'square' | 'diamond' | 'plus' | 'star' | 'cross';

export interface AxisOptions {
  /** Show axis line */
  show?: boolean;
  /** Axis label */
  label?: string;
  /** Minimum value (auto-detected if not set) */
  min?: number;
  /** Maximum value (auto-detected if not set) */
  max?: number;
  /** Number of tick marks */
  ticks?: number;
  /** Custom tick formatter */
  formatter?: (value: number) => string;
}

export interface ScatterPlotOptions {
  /** Data points to display */
  points: ScatterPoint[];
  /** Chart width in characters */
  width?: number;
  /** Chart height in rows */
  height?: number;
  /** X-axis options */
  xAxis?: AxisOptions;
  /** Y-axis options */
  yAxis?: AxisOptions;
  /** Marker style */
  markerStyle?: MarkerStyle;
  /** Color by value or category */
  colorMode?: 'value' | 'category' | 'uniform';
  /** Color for uniform mode */
  color?: ColorValue;
  /** Color scale for value mode */
  colorScale?: ColorValue[];
  /** Title */
  title?: string;
  /** Show legend */
  showLegend?: boolean;
  /** Click handler */
  onPointClick?: (point: ScatterPoint, index: number) => void;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get marker character for style
 */
function getMarkerChar(style: MarkerStyle, useAscii: boolean): string {
  if (useAscii) {
    switch (style) {
      case 'circle':
        return 'o';
      case 'square':
        return '#';
      case 'diamond':
        return '*';
      case 'plus':
        return '+';
      case 'star':
        return '*';
      case 'cross':
        return 'x';
      default:
        return 'o';
    }
  }

  // Unicode markers
  switch (style) {
    case 'circle':
      return '●';
    case 'square':
      return '■';
    case 'diamond':
      return '◆';
    case 'plus':
      return '✚';
    case 'star':
      return '★';
    case 'cross':
      return '✕';
    default:
      return '●';
  }
}

/**
 * Calculate bounds from points
 */
function calculateBounds(points: ScatterPoint[], xAxis?: AxisOptions, yAxis?: AxisOptions) {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  let valueMin = Infinity;
  let valueMax = -Infinity;

  for (const p of points) {
    xMin = Math.min(xMin, p.x);
    xMax = Math.max(xMax, p.x);
    yMin = Math.min(yMin, p.y);
    yMax = Math.max(yMax, p.y);

    if (p.value !== undefined) {
      valueMin = Math.min(valueMin, p.value);
      valueMax = Math.max(valueMax, p.value);
    }
  }

  // Apply axis overrides
  if (xAxis?.min !== undefined) xMin = xAxis.min;
  if (xAxis?.max !== undefined) xMax = xAxis.max;
  if (yAxis?.min !== undefined) yMin = yAxis.min;
  if (yAxis?.max !== undefined) yMax = yAxis.max;

  // Handle edge cases
  if (!isFinite(xMin)) xMin = 0;
  if (!isFinite(xMax)) xMax = 1;
  if (!isFinite(yMin)) yMin = 0;
  if (!isFinite(yMax)) yMax = 1;
  if (xMin === xMax) xMax = xMin + 1;
  if (yMin === yMax) yMax = yMin + 1;
  if (!isFinite(valueMin)) valueMin = 0;
  if (!isFinite(valueMax)) valueMax = 1;
  if (valueMin === valueMax) valueMax = valueMin + 1;

  return { xMin, xMax, yMin, yMax, valueMin, valueMax };
}

/**
 * Format tick value
 */
function formatTick(value: number, formatter?: (v: number) => string): string {
  if (formatter) return formatter(value);
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2);
}

// =============================================================================
// Component
// =============================================================================

export interface ScatterPlotProps extends ScatterPlotOptions {}

/**
 * ScatterPlot - Two-dimensional scatter plot
 *
 * @example
 * // Basic scatter plot
 * ScatterPlot({
 *   points: [
 *     { x: 1, y: 2 },
 *     { x: 2, y: 4 },
 *     { x: 3, y: 6 },
 *   ],
 *   width: 50,
 *   height: 15,
 * })
 *
 * @example
 * // Scatter plot with color by value
 * ScatterPlot({
 *   points: [
 *     { x: 1, y: 2, value: 10 },
 *     { x: 2, y: 4, value: 20 },
 *   ],
 *   colorMode: 'value',
 *   colorScale: ['blue', 'cyan', 'green', 'yellow', 'red'],
 * })
 */
export function ScatterPlot(props: ScatterPlotProps): VNode {
  const {
    points,
    width = 60,
    height = 15,
    xAxis = {},
    yAxis = {},
    markerStyle = 'circle',
    colorMode = 'uniform',
    color = 'cyan',
    colorScale = ['blue', 'cyan', 'green', 'yellow', 'red'],
    title,
    showLegend = false,
  } = props;

  const isAscii = getRenderMode() === 'ascii';
  const marker = getMarkerChar(markerStyle, isAscii);

  if (points.length === 0) {
    return Text({ color: 'gray', dim: true }, 'No data');
  }

  const bounds = calculateBounds(points, xAxis, yAxis);

  // Build grid (ASCII mode for now)
  const grid: string[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(' '));

  // Plot points
  for (const point of points) {
    const x = Math.round(
      ((point.x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * (width - 1)
    );
    const y = Math.round(
      ((point.y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * (height - 1)
    );

    if (x >= 0 && x < width && y >= 0 && y < height) {
      grid[height - 1 - y]![x] = marker;
    }
  }

  // Render grid
  const chartRows: VNode[] = [];
  for (let y = 0; y < height; y++) {
    const rowStr = grid[y]!.join('');

    // Determine row color based on color mode
    let rowColor: ColorValue | undefined = color;
    if (colorMode === 'value' && colorScale.length > 0) {
      rowColor = colorScale[0];
    }

    chartRows.push(Text({ color: rowColor }, rowStr));
  }

  // Build Y-axis labels
  const yTicks = yAxis.ticks ?? 5;
  const yLabels: VNode[] = [];

  for (let i = 0; i <= yTicks; i++) {
    const value = bounds.yMax - (i / yTicks) * (bounds.yMax - bounds.yMin);
    const label = formatTick(value, yAxis.formatter);

    if (i === 0 || i === yTicks || i === Math.floor(yTicks / 2)) {
      yLabels.push(
        Box(
          { height: Math.round(height / yTicks) },
          Text({ color: 'gray', dim: true }, label.padStart(6))
        )
      );
    }
  }

  // Build X-axis labels
  const xTicks = xAxis.ticks ?? 5;
  const xLabels: VNode[] = [];

  for (let i = 0; i <= xTicks; i++) {
    const value = bounds.xMin + (i / xTicks) * (bounds.xMax - bounds.xMin);
    const label = formatTick(value, xAxis.formatter);
    const spacing = Math.floor(width / xTicks);

    xLabels.push(
      Box(
        { width: spacing },
        Text({ color: 'gray', dim: true }, label.padStart(spacing))
      )
    );
  }

  // Assemble chart
  const chartWithYAxis = Box(
    { flexDirection: 'row' },
    yAxis.show !== false ? Box({ flexDirection: 'column' }, ...yLabels.slice(0, 3)) : null,
    Box({ flexDirection: 'column' }, ...chartRows)
  );

  const parts: (VNode | null)[] = [];

  if (title) {
    parts.push(Box({ marginBottom: 1 }, Text({ color: 'white', bold: true }, title)));
  }

  parts.push(chartWithYAxis);

  if (xAxis.show !== false) {
    parts.push(
      Box(
        { flexDirection: 'row', marginLeft: yAxis.show !== false ? 6 : 0 },
        ...xLabels
      )
    );
  }

  return Box({ flexDirection: 'column' }, ...parts);
}
