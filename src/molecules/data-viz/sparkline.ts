/**
 * Sparkline Component - Inline mini-charts
 *
 * Renders compact data visualizations using Unicode block characters.
 * Perfect for dashboards, status bars, and monitoring displays.
 */

import type { VNode, ColorValue } from '../../utils/types.js';
import { Box, Text } from '../../primitives/nodes.js';
import {
  normalizeSparklineData,
  renderSparklineText,
  SPARKLINE_ASCII_CHARS as ASCII_CHARS,
  SPARKLINE_BLOCK_CHARS as BLOCK_CHARS,
  SPARKLINE_BRAILLE_BASE as BRAILLE_BASE,
} from '../../utils/sparkline.js';

// =============================================================================
// Types
// =============================================================================

export type SparklineStyle = 'block' | 'braille' | 'ascii';

export interface SparklineOptions {
  /** Data points to visualize */
  data: number[];
  /** Width in characters (default: data.length, max: 80) */
  width?: number;
  /** Minimum value (auto-detected if not set) */
  min?: number;
  /** Maximum value (auto-detected if not set) */
  max?: number;
  /** Rendering style */
  style?: SparklineStyle;
  /** Sparkline color */
  color?: ColorValue;
  /** Label to display before the sparkline */
  label?: string;
  /** Show min/max value labels */
  showLabels?: boolean;
  /** Label color */
  labelColor?: ColorValue;
  /** Empty character when data is shorter than width */
  emptyChar?: string;
}

export interface SparklineBufferOptions {
  /** Maximum number of points to keep */
  maxPoints?: number;
  /** Auto-render width */
  width?: number;
}

/**
 * Render sparkline string from data
 */
export function renderSparklineString(
  data: number[],
  options: Omit<SparklineOptions, 'data' | 'color' | 'showLabels' | 'labelColor'> = {}
): string {
  return renderSparklineText(data, options);
}

// =============================================================================
// Sparkline Component
// =============================================================================

/**
 * Sparkline - Inline mini-chart component
 *
 * @example
 * // Basic sparkline
 * Sparkline({ data: [1, 5, 3, 8, 2, 7] })
 *
 * @example
 * // With color and labels
 * Sparkline({
 *   data: cpuHistory,
 *   width: 30,
 *   color: 'cyan',
 *   showLabels: true,
 * })
 *
 * @example
 * // Fixed scale
 * Sparkline({
 *   data: percentages,
 *   min: 0,
 *   max: 100,
 *   color: 'green',
 * })
 */
export function Sparkline(options: SparklineOptions): VNode {
  const {
    data,
    width = data.length,
    min,
    max,
    style = 'block',
    color,
    label,
    showLabels = false,
    labelColor = 'mutedForeground',
    emptyChar = ' ',
  } = options;

  const sparklineStr = renderSparklineString(data, {
    width,
    min,
    max,
    style,
    emptyChar,
  });

  // Calculate actual min/max for labels
  const {
    min: actualMin,
    max: actualMax,
  } = normalizeSparklineData(data, min, max);

  if (showLabels || label) {
    return Box(
      { flexDirection: 'row', gap: 1 },
      label ? Text({ color: labelColor }, label) : null as any,
      showLabels ? Text({ color: labelColor, dim: true }, actualMin.toFixed(1)) : null as any,
      Text({ color }, sparklineStr),
      showLabels ? Text({ color: labelColor, dim: true }, actualMax.toFixed(1)) : null as any
    );
  }

  return Text({ color }, sparklineStr);
}

// =============================================================================
// Sparkline Buffer (for streaming data)
// =============================================================================

/**
 * SparklineBuffer - Rolling buffer for streaming data
 *
 * Maintains a fixed-size buffer of data points, automatically
 * dropping oldest values when capacity is exceeded.
 *
 * @example
 * const buffer = createSparklineBuffer({ maxPoints: 60 });
 *
 * // Add data points over time
 * setInterval(() => {
 *   buffer.push(getCpuUsage());
 *   render(Sparkline({ data: buffer.data(), width: 30 }));
 * }, 1000);
 */
export class SparklineBuffer {
  private _data: number[] = [];
  private _maxPoints: number;
  private _width: number;

  constructor(options: SparklineBufferOptions = {}) {
    this._maxPoints = options.maxPoints ?? 100;
    this._width = options.width ?? 30;
  }

  /**
   * Add a value to the buffer
   */
  push(value: number): void {
    this._data.push(value);
    if (this._data.length > this._maxPoints) {
      this._data.shift();
    }
  }

  /**
   * Add multiple values to the buffer
   */
  pushAll(values: number[]): void {
    for (const value of values) {
      this.push(value);
    }
  }

  /**
   * Get the current data array
   */
  data(): number[] {
    return [...this._data];
  }

  /**
   * Get the most recent value
   */
  latest(): number | undefined {
    return this._data[this._data.length - 1];
  }

  /**
   * Get the average of all values
   */
  average(): number {
    if (this._data.length === 0) return 0;
    const sum = this._data.reduce((a, b) => a + b, 0);
    return sum / this._data.length;
  }

  /**
   * Get the minimum value
   */
  min(): number {
    if (this._data.length === 0) return 0;
    return Math.min(...this._data);
  }

  /**
   * Get the maximum value
   */
  max(): number {
    if (this._data.length === 0) return 0;
    return Math.max(...this._data);
  }

  /**
   * Clear all data
   */
  clear(): void {
    this._data = [];
  }

  /**
   * Get the number of data points
   */
  get length(): number {
    return this._data.length;
  }

  /**
   * Check if buffer is full
   */
  get isFull(): boolean {
    return this._data.length >= this._maxPoints;
  }

  /**
   * Render the buffer as a sparkline string
   */
  render(options: Omit<SparklineOptions, 'data' | 'color' | 'showLabels' | 'labelColor'> = {}): string {
    return renderSparklineString(this._data, {
      width: options.width ?? this._width,
      min: options.min,
      max: options.max,
      style: options.style,
      emptyChar: options.emptyChar,
    });
  }

  /**
   * Create a Sparkline VNode from the buffer
   */
  toVNode(options: Omit<SparklineOptions, 'data'> = {}): VNode {
    return Sparkline({
      data: this._data,
      width: options.width ?? this._width,
      ...options,
    });
  }
}

/**
 * Factory function to create a SparklineBuffer
 */
export function createSparklineBuffer(
  options: SparklineBufferOptions = {}
): SparklineBuffer {
  return new SparklineBuffer(options);
}

// =============================================================================
// Braille Sparkline (High Resolution)
// =============================================================================

/**
 * Render a high-resolution sparkline using braille characters
 *
 * Each character is 2 columns × 4 rows of dots, allowing for
 * much higher resolution than block characters.
 */
export function renderBrailleSparkline(
  data: number[],
  options: { width?: number; min?: number; max?: number } = {}
): string {
  const { width = Math.ceil(data.length / 2), min, max } = options;

  if (data.length === 0) return '';

  // Normalize data to 0-7 range (4 rows × 2 for top/bottom)
  const { normalized } = normalizeSparklineData(data, min, max);
  const scaled = normalized.map((v) => Math.floor(v * 7));

  // Braille dot positions (column 1: bits 0,1,2,6; column 2: bits 3,4,5,7)
  // Rows from top: 0/3, 1/4, 2/5, 6/7
  const dotPositions = [
    [0, 3], // row 0
    [1, 4], // row 1
    [2, 5], // row 2
    [6, 7], // row 3
  ];

  const result: string[] = [];

  for (let i = 0; i < scaled.length; i += 2) {
    let pattern = 0;
    const v1 = scaled[i] ?? 0;
    const v2 = scaled[i + 1] ?? v1;

    // Fill dots from bottom up based on value
    for (let row = 3; row >= 0; row--) {
      const threshold = (3 - row) * 2; // 0, 2, 4, 6
      if (v1 >= threshold) pattern |= 1 << dotPositions[row]![0]!;
      if (v2 >= threshold) pattern |= 1 << dotPositions[row]![1]!;
    }

    result.push(String.fromCharCode(BRAILLE_BASE + pattern));
  }

  // Pad to width
  while (result.length < width) {
    result.unshift(String.fromCharCode(BRAILLE_BASE));
  }

  return result.slice(-width).join('');
}

// =============================================================================
// Exports
// =============================================================================

export { BLOCK_CHARS, ASCII_CHARS };
