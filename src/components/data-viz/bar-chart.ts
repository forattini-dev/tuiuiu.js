/**
 * BarChart Component - Horizontal and Vertical Bar Charts
 *
 * Renders bar charts in the terminal using Unicode block characters.
 * Supports both horizontal (default) and vertical orientations.
 */

import type { VNode, ColorValue } from '../../utils/types.js';
import { Box, Text } from '../components.js';
import { getChars, getRenderMode } from '../../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export type BarOrientation = 'horizontal' | 'vertical';

export interface BarData {
  /** Label for the bar */
  label: string;
  /** Value (determines bar length) */
  value: number;
  /** Optional bar color (overrides default) */
  color?: ColorValue;
}

export interface BarChartOptions {
  /** Data to display */
  data: BarData[];
  /** Chart orientation (default: horizontal) */
  orientation?: BarOrientation;
  /** Maximum bar length in characters (default: 40) */
  maxBarLength?: number;
  /** Show value labels (default: true) */
  showValues?: boolean;
  /** Show percentage instead of raw values */
  showPercentage?: boolean;
  /** Default bar color */
  barColor?: ColorValue;
  /** Label color */
  labelColor?: ColorValue;
  /** Value color */
  valueColor?: ColorValue;
  /** Minimum value (auto-detected if not set) */
  min?: number;
  /** Maximum value (auto-detected if not set) */
  max?: number;
  /** Gap between bars (default: 0) */
  gap?: number;
  /** Label width for horizontal bars (auto-sized if not set) */
  labelWidth?: number;
  /** Character for filled portion */
  filledChar?: string;
  /** Character for empty portion */
  emptyChar?: string;
  /** Show bar background */
  showBackground?: boolean;
}

export interface VerticalBarChartOptions extends Omit<BarChartOptions, 'orientation'> {
  /** Chart height in rows (default: 10) */
  height?: number;
}

// =============================================================================
// Character Sets
// =============================================================================

/** Unicode horizontal bar characters */
const HORIZONTAL_BLOCKS = {
  full: '█',
  seven: '▉',
  six: '▊',
  five: '▋',
  four: '▌',
  three: '▍',
  two: '▎',
  one: '▏',
};

/** Unicode vertical bar characters (bottom to top) */
const VERTICAL_BLOCKS = '▁▂▃▄▅▆▇█';

/** ASCII fallback characters */
const ASCII_BAR = {
  filled: '#',
  empty: '-',
  partial: '>',
};

/**
 * Get bar characters based on render mode
 */
function getBarChars(): { filled: string; empty: string; partial: string[] } {
  if (getRenderMode() === 'ascii') {
    return {
      filled: ASCII_BAR.filled,
      empty: ASCII_BAR.empty,
      partial: [ASCII_BAR.partial],
    };
  }

  return {
    filled: HORIZONTAL_BLOCKS.full,
    empty: ' ',
    partial: [
      HORIZONTAL_BLOCKS.one,
      HORIZONTAL_BLOCKS.two,
      HORIZONTAL_BLOCKS.three,
      HORIZONTAL_BLOCKS.four,
      HORIZONTAL_BLOCKS.five,
      HORIZONTAL_BLOCKS.six,
      HORIZONTAL_BLOCKS.seven,
    ],
  };
}

// =============================================================================
// Core Rendering Functions
// =============================================================================

/**
 * Normalize values to 0-1 range
 */
function normalizeValues(
  data: BarData[],
  min?: number,
  max?: number
): { normalized: number[]; min: number; max: number } {
  const values = data.map((d) => d.value).filter((v) => isFinite(v));

  if (values.length === 0) {
    return { normalized: data.map(() => 0), min: 0, max: 0 };
  }

  const actualMin = min ?? Math.min(0, ...values); // Start from 0 unless explicitly set
  const actualMax = max ?? Math.max(...values);
  const range = actualMax - actualMin || 1;

  const normalized = data.map((d) => {
    if (!isFinite(d.value)) return 0;
    return Math.max(0, (d.value - actualMin) / range);
  });

  return { normalized, min: actualMin, max: actualMax };
}

/**
 * Render a horizontal bar string
 */
function renderHorizontalBar(
  normalizedValue: number,
  maxLength: number,
  chars: ReturnType<typeof getBarChars>
): string {
  const fullLength = normalizedValue * maxLength;
  const fullBlocks = Math.floor(fullLength);
  const partialFraction = fullLength - fullBlocks;

  let bar = chars.filled.repeat(fullBlocks);

  // Add partial block if needed (Unicode mode)
  if (partialFraction > 0 && chars.partial.length > 1) {
    const partialIndex = Math.min(
      Math.floor(partialFraction * chars.partial.length),
      chars.partial.length - 1
    );
    bar += chars.partial[partialIndex] || '';
  } else if (partialFraction > 0.5) {
    // ASCII mode - add partial if more than half
    bar += chars.partial[0] || '';
  }

  return bar;
}

/**
 * Render a horizontal bar chart as strings
 */
export function renderBarChartStrings(
  data: BarData[],
  options: Omit<BarChartOptions, 'data' | 'orientation'> = {}
): string[] {
  const {
    maxBarLength = 40,
    showValues = true,
    showPercentage = false,
    min,
    max,
    labelWidth,
  } = options;

  if (data.length === 0) return [];

  const chars = getBarChars();
  const { normalized, max: actualMax } = normalizeValues(data, min, max);

  // Calculate label width
  const maxLabelLen =
    labelWidth ?? Math.max(...data.map((d) => d.label.length));

  const lines: string[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i]!;
    const norm = normalized[i] ?? 0;

    // Pad label
    const label = item.label.padEnd(maxLabelLen);

    // Render bar
    const bar = renderHorizontalBar(norm, maxBarLength, chars);

    // Format value
    let valueStr = '';
    if (showValues) {
      if (showPercentage) {
        const pct = actualMax > 0 ? (item.value / actualMax) * 100 : 0;
        valueStr = ` ${pct.toFixed(1)}%`;
      } else {
        valueStr = ` ${item.value}`;
      }
    }

    lines.push(`${label} ${bar}${valueStr}`);
  }

  return lines;
}

// =============================================================================
// Horizontal Bar Chart Component
// =============================================================================

/**
 * BarChart - Horizontal bar chart component
 *
 * @example
 * // Basic usage
 * BarChart({
 *   data: [
 *     { label: 'React', value: 85 },
 *     { label: 'Vue', value: 72 },
 *     { label: 'Angular', value: 45 },
 *   ],
 * })
 *
 * @example
 * // With colors and percentages
 * BarChart({
 *   data: [
 *     { label: 'CPU', value: 75, color: 'green' },
 *     { label: 'Memory', value: 92, color: 'red' },
 *     { label: 'Disk', value: 45, color: 'blue' },
 *   ],
 *   showPercentage: true,
 *   barColor: 'cyan',
 * })
 */
export function BarChart(options: BarChartOptions): VNode {
  const {
    data,
    orientation = 'horizontal',
    maxBarLength = 40,
    showValues = true,
    showPercentage = false,
    barColor = 'cyan',
    labelColor = 'gray',
    valueColor = 'white',
    min,
    max,
    gap = 0,
    labelWidth,
    showBackground = false,
  } = options;

  if (orientation === 'vertical') {
    return VerticalBarChart({
      data,
      maxBarLength,
      showValues,
      showPercentage,
      barColor,
      labelColor,
      valueColor,
      min,
      max,
      gap,
      labelWidth,
      showBackground,
      height: 10,
    });
  }

  if (data.length === 0) {
    return Text({ color: 'gray', dim: true }, 'No data');
  }

  const chars = getBarChars();
  const { normalized, max: actualMax } = normalizeValues(data, min, max);

  // Calculate label width
  const maxLabelLen =
    labelWidth ?? Math.max(...data.map((d) => d.label.length));

  const bars = data.map((item, i) => {
    const norm = normalized[i] ?? 0;
    const bar = renderHorizontalBar(norm, maxBarLength, chars);
    const emptyLen = maxBarLength - bar.length;

    // Format value
    let valueStr = '';
    if (showValues) {
      if (showPercentage) {
        const pct = actualMax > 0 ? (item.value / actualMax) * 100 : 0;
        valueStr = `${pct.toFixed(1)}%`;
      } else {
        valueStr = `${item.value}`;
      }
    }

    const itemColor = item.color ?? barColor;

    return Box(
      { flexDirection: 'row', gap: 1, marginBottom: gap },
      Box({ width: maxLabelLen }, Text({ color: labelColor }, item.label)),
      Text({ color: itemColor }, bar),
      showBackground
        ? Text({ color: 'gray', dim: true }, chars.empty.repeat(emptyLen))
        : null,
      showValues ? Text({ color: valueColor, dim: true }, valueStr) : null
    );
  });

  return Box({ flexDirection: 'column' }, ...bars);
}

// =============================================================================
// Vertical Bar Chart Component
// =============================================================================

/**
 * VerticalBarChart - Vertical bar chart component
 *
 * @example
 * VerticalBarChart({
 *   data: [
 *     { label: 'Mon', value: 5 },
 *     { label: 'Tue', value: 8 },
 *     { label: 'Wed', value: 3 },
 *     { label: 'Thu', value: 10 },
 *     { label: 'Fri', value: 7 },
 *   ],
 *   height: 8,
 * })
 */
export function VerticalBarChart(options: VerticalBarChartOptions): VNode {
  const {
    data,
    height = 10,
    showValues = true,
    barColor = 'cyan',
    labelColor = 'gray',
    valueColor = 'white',
    min,
    max,
    gap = 1,
  } = options;

  if (data.length === 0) {
    return Text({ color: 'gray', dim: true }, 'No data');
  }

  const isAscii = getRenderMode() === 'ascii';
  const blockChars = isAscii ? '_.oO@' : VERTICAL_BLOCKS;
  const { normalized } = normalizeValues(data, min, max);

  // Build rows from top to bottom
  const rows: VNode[] = [];

  // Value row (top)
  if (showValues) {
    const values = data.map((item, i) => {
      const valueStr = String(item.value);
      const colWidth = Math.max(item.label.length, 3);
      return Box(
        { width: colWidth, justifyContent: 'center' },
        Text({ color: valueColor }, valueStr.slice(0, colWidth))
      );
    });
    rows.push(Box({ flexDirection: 'row', gap }, ...values));
  }

  // Bar rows (from top = height to bottom = 1)
  for (let row = height; row >= 1; row--) {
    const threshold = row / height;

    const barCells = data.map((item, i) => {
      const norm = normalized[i] ?? 0;
      const itemColor = item.color ?? barColor;
      const colWidth = Math.max(item.label.length, 3);

      if (norm >= threshold) {
        // Full block
        const char = blockChars[blockChars.length - 1]!;
        return Box(
          { width: colWidth, justifyContent: 'center' },
          Text({ color: itemColor }, char)
        );
      } else if (norm > threshold - 1 / height) {
        // Partial block
        const fraction = (norm - (threshold - 1 / height)) * height;
        const charIndex = Math.min(
          Math.floor(fraction * blockChars.length),
          blockChars.length - 1
        );
        const char = blockChars[charIndex] || ' ';
        return Box(
          { width: colWidth, justifyContent: 'center' },
          Text({ color: itemColor }, char)
        );
      } else {
        // Empty
        return Box({ width: colWidth, justifyContent: 'center' }, Text({}, ' '));
      }
    });

    rows.push(Box({ flexDirection: 'row', gap }, ...barCells));
  }

  // Label row (bottom)
  const labels = data.map((item) => {
    const colWidth = Math.max(item.label.length, 3);
    return Box(
      { width: colWidth, justifyContent: 'center' },
      Text({ color: labelColor }, item.label.slice(0, colWidth))
    );
  });
  rows.push(Box({ flexDirection: 'row', gap }, ...labels));

  return Box({ flexDirection: 'column' }, ...rows);
}

// =============================================================================
// Stacked Bar Chart
// =============================================================================

export interface StackedBarData {
  /** Label for the bar */
  label: string;
  /** Segments that make up the bar */
  segments: {
    value: number;
    color?: ColorValue;
    label?: string;
  }[];
}

export interface StackedBarChartOptions {
  /** Data to display */
  data: StackedBarData[];
  /** Maximum bar length in characters (default: 40) */
  maxBarLength?: number;
  /** Default colors for segments (cycles through) */
  colors?: ColorValue[];
  /** Show total values (default: true) */
  showTotal?: boolean;
  /** Label color */
  labelColor?: ColorValue;
  /** Label width */
  labelWidth?: number;
}

/**
 * StackedBarChart - Horizontal stacked bar chart
 *
 * @example
 * StackedBarChart({
 *   data: [
 *     {
 *       label: 'Q1',
 *       segments: [
 *         { value: 30, color: 'blue' },
 *         { value: 45, color: 'green' },
 *         { value: 25, color: 'yellow' },
 *       ],
 *     },
 *     {
 *       label: 'Q2',
 *       segments: [
 *         { value: 40, color: 'blue' },
 *         { value: 35, color: 'green' },
 *         { value: 30, color: 'yellow' },
 *       ],
 *     },
 *   ],
 * })
 */
export function StackedBarChart(options: StackedBarChartOptions): VNode {
  const {
    data,
    maxBarLength = 40,
    colors = ['cyan', 'green', 'yellow', 'magenta', 'blue', 'red'],
    showTotal = true,
    labelColor = 'gray',
    labelWidth,
  } = options;

  if (data.length === 0) {
    return Text({ color: 'gray', dim: true }, 'No data');
  }

  const isAscii = getRenderMode() === 'ascii';
  const filledChar = isAscii ? '#' : '█';

  // Find max total for normalization
  const totals = data.map((d) =>
    d.segments.reduce((sum, s) => sum + s.value, 0)
  );
  const maxTotal = Math.max(...totals);

  // Calculate label width
  const maxLabelLen =
    labelWidth ?? Math.max(...data.map((d) => d.label.length));

  const bars = data.map((item, rowIndex) => {
    const total = totals[rowIndex] ?? 0;
    const normalizedTotal = maxTotal > 0 ? total / maxTotal : 0;
    const barLength = Math.round(normalizedTotal * maxBarLength);

    // Calculate segment lengths
    const segmentLengths: number[] = [];
    let remaining = barLength;

    for (let i = 0; i < item.segments.length; i++) {
      const segment = item.segments[i]!;
      const segmentRatio = total > 0 ? segment.value / total : 0;
      const len =
        i === item.segments.length - 1
          ? remaining
          : Math.round(segmentRatio * barLength);
      segmentLengths.push(Math.max(0, Math.min(len, remaining)));
      remaining -= segmentLengths[i]!;
    }

    // Render segments
    const segmentNodes = item.segments.map((segment, segIndex) => {
      const segColor = segment.color ?? colors[segIndex % colors.length];
      const len = segmentLengths[segIndex] ?? 0;
      return Text({ color: segColor }, filledChar.repeat(len));
    });

    return Box(
      { flexDirection: 'row', gap: 1 },
      Box({ width: maxLabelLen }, Text({ color: labelColor }, item.label)),
      ...segmentNodes,
      showTotal
        ? Text({ color: 'white', dim: true }, ` ${total}`)
        : null
    );
  });

  return Box({ flexDirection: 'column' }, ...bars);
}

// =============================================================================
// Exports
// =============================================================================

export { HORIZONTAL_BLOCKS, VERTICAL_BLOCKS };
