/**
 * LineChart Component - Multi-series Line Charts with Axes
 *
 * Renders line charts in the terminal using braille characters for
 * high resolution or ASCII for compatibility. Supports multiple
 * data series, axes, and legends.
 */

import type { VNode, ColorValue } from '../../utils/types.js';
import { Box, Text } from '../../primitives/nodes.js';
import { getRenderMode } from '../../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export interface DataPoint {
  x: number;
  y: number;
}

export interface DataSeries {
  /** Series name (for legend) */
  name: string;
  /** Data points */
  data: DataPoint[] | number[];
  /** Line color */
  color?: ColorValue;
  /** Line style */
  style?: 'solid' | 'dotted' | 'dashed';
}

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

export interface LineChartOptions {
  /** Data series to display */
  series: DataSeries[];
  /** Chart width in characters (default: 60) */
  width?: number;
  /** Chart height in rows (default: 15) */
  height?: number;
  /** X-axis options */
  xAxis?: AxisOptions;
  /** Y-axis options */
  yAxis?: AxisOptions;
  /** Show legend (default: true if multiple series) */
  showLegend?: boolean;
  /** Legend position */
  legendPosition?: 'top' | 'bottom' | 'right';
  /** Show grid lines */
  showGrid?: boolean;
  /** Grid color */
  gridColor?: ColorValue;
  /** Title */
  title?: string;
  /** Title color */
  titleColor?: ColorValue;
  /** Border style */
  borderStyle?: 'none' | 'single' | 'double';
}

// =============================================================================
// Braille Character System
// =============================================================================

/**
 * Braille character is 2x4 dots (2 columns, 4 rows)
 * Dot positions:
 *   1  4
 *   2  5
 *   3  6
 *   7  8
 *
 * Unicode: 0x2800 + dot pattern (bit 0-7)
 */
const BRAILLE_BASE = 0x2800;

// Dot position to bit mapping
const BRAILLE_DOTS: [number, number][] = [
  [0, 0], // bit 0 -> (0, 0)
  [0, 1], // bit 1 -> (0, 1)
  [0, 2], // bit 2 -> (0, 2)
  [1, 0], // bit 3 -> (1, 0)
  [1, 1], // bit 4 -> (1, 1)
  [1, 2], // bit 5 -> (1, 2)
  [0, 3], // bit 6 -> (0, 3)
  [1, 3], // bit 7 -> (1, 3)
];

/**
 * Canvas for drawing with braille characters
 */
class BrailleCanvas {
  private pixels: boolean[][];
  private width: number;
  private height: number;

  constructor(charWidth: number, charHeight: number) {
    // Each braille char is 2x4 pixels
    this.width = charWidth * 2;
    this.height = charHeight * 4;
    this.pixels = Array(this.height)
      .fill(null)
      .map(() => Array(this.width).fill(false));
  }

  /**
   * Set a pixel at (x, y)
   */
  setPixel(x: number, y: number): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
      this.pixels[py]![px] = true;
    }
  }

  /**
   * Draw a line using Bresenham's algorithm
   */
  drawLine(x0: number, y0: number, x1: number, y1: number): void {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.setPixel(x0, y0);

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  /**
   * Convert canvas to braille string
   */
  render(): string[] {
    const charWidth = this.width / 2;
    const charHeight = this.height / 4;
    const lines: string[] = [];

    for (let cy = 0; cy < charHeight; cy++) {
      let line = '';
      for (let cx = 0; cx < charWidth; cx++) {
        let pattern = 0;

        for (let bit = 0; bit < 8; bit++) {
          const [dx, dy] = BRAILLE_DOTS[bit]!;
          const px = cx * 2 + dx;
          const py = cy * 4 + dy;

          if (this.pixels[py]?.[px]) {
            pattern |= 1 << bit;
          }
        }

        line += String.fromCharCode(BRAILLE_BASE + pattern);
      }
      lines.push(line);
    }

    return lines;
  }

  get pixelWidth(): number {
    return this.width;
  }

  get pixelHeight(): number {
    return this.height;
  }
}

/**
 * ASCII canvas for non-Unicode terminals
 */
class AsciiCanvas {
  private pixels: string[][];
  private width: number;
  private height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.pixels = Array(height)
      .fill(null)
      .map(() => Array(width).fill(' '));
  }

  setPixel(x: number, y: number, char = '*'): void {
    const px = Math.round(x);
    const py = Math.round(y);
    if (px >= 0 && px < this.width && py >= 0 && py < this.height) {
      this.pixels[py]![px] = char;
    }
  }

  drawLine(x0: number, y0: number, x1: number, y1: number, char = '*'): void {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      this.setPixel(x0, y0, char);

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x0 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  render(): string[] {
    return this.pixels.map((row) => row.join(''));
  }

  get pixelWidth(): number {
    return this.width;
  }

  get pixelHeight(): number {
    return this.height;
  }
}

// =============================================================================
// Data Processing
// =============================================================================

/**
 * Normalize data points to array format
 */
function normalizeData(data: DataPoint[] | number[]): DataPoint[] {
  if (data.length === 0) return [];

  if (typeof data[0] === 'number') {
    return (data as number[]).map((y, x) => ({ x, y }));
  }

  return data as DataPoint[];
}

/**
 * Calculate bounds across all series
 */
function calculateBounds(
  series: DataSeries[],
  xAxis?: AxisOptions,
  yAxis?: AxisOptions
): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (const s of series) {
    const points = normalizeData(s.data);
    for (const p of points) {
      if (isFinite(p.x)) {
        xMin = Math.min(xMin, p.x);
        xMax = Math.max(xMax, p.x);
      }
      if (isFinite(p.y)) {
        yMin = Math.min(yMin, p.y);
        yMax = Math.max(yMax, p.y);
      }
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

  return { xMin, xMax, yMin, yMax };
}

/**
 * Format tick value
 */
function formatTick(value: number, formatter?: (v: number) => string): string {
  if (formatter) return formatter(value);
  if (Number.isInteger(value)) return String(value);
  if (Math.abs(value) < 0.01 || Math.abs(value) >= 1000) {
    return value.toExponential(1);
  }
  return value.toFixed(2);
}

// =============================================================================
// LineChart Rendering
// =============================================================================

/**
 * Render line chart as string array
 */
export function renderLineChartStrings(
  series: DataSeries[],
  options: Omit<LineChartOptions, 'series'> = {}
): string[] {
  const {
    width = 60,
    height = 15,
    xAxis = {},
    yAxis = {},
    showGrid = false,
  } = options;

  if (series.length === 0 || series.every((s) => s.data.length === 0)) {
    return ['No data'];
  }

  const isAscii = getRenderMode() === 'ascii';
  const bounds = calculateBounds(series, xAxis, yAxis);

  // Create canvas
  const canvas = isAscii
    ? new AsciiCanvas(width, height)
    : new BrailleCanvas(width, height);

  const pixelWidth = canvas.pixelWidth;
  const pixelHeight = canvas.pixelHeight;

  // Draw grid if enabled
  if (showGrid && !isAscii) {
    const gridChar = '·';
    const xTicks = xAxis.ticks ?? 5;
    const yTicks = yAxis.ticks ?? 5;

    for (let i = 0; i <= xTicks; i++) {
      const x = Math.round((i / xTicks) * (pixelWidth - 1));
      for (let j = 0; j <= yTicks; j++) {
        const y = Math.round((j / yTicks) * (pixelHeight - 1));
        canvas.setPixel(x, y);
      }
    }
  }

  // Draw each series
  for (const s of series) {
    const points = normalizeData(s.data);
    if (points.length < 2) continue;

    // Map data points to canvas coordinates
    const mapped = points.map((p) => ({
      x: ((p.x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * (pixelWidth - 1),
      y:
        pixelHeight -
        1 -
        ((p.y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * (pixelHeight - 1),
    }));

    // Draw lines between consecutive points
    for (let i = 0; i < mapped.length - 1; i++) {
      const p0 = mapped[i]!;
      const p1 = mapped[i + 1]!;
      canvas.drawLine(p0.x, p0.y, p1.x, p1.y);
    }
  }

  return canvas.render();
}

// =============================================================================
// LineChart Component
// =============================================================================

/**
 * LineChart - Multi-series line chart with axes
 *
 * @example
 * // Simple line chart
 * LineChart({
 *   series: [
 *     { name: 'Sales', data: [10, 25, 30, 45, 60, 55, 70], color: 'cyan' },
 *   ],
 *   width: 50,
 *   height: 10,
 * })
 *
 * @example
 * // Multi-series with custom axes
 * LineChart({
 *   series: [
 *     { name: 'CPU', data: cpuHistory, color: 'green' },
 *     { name: 'Memory', data: memHistory, color: 'yellow' },
 *   ],
 *   yAxis: { min: 0, max: 100, label: '%' },
 *   showLegend: true,
 * })
 */
export function LineChart(options: LineChartOptions): VNode {
  const {
    series,
    width = 60,
    height = 15,
    xAxis = {},
    yAxis = {},
    showLegend,
    legendPosition = 'bottom',
    showGrid = false,
    gridColor = 'gray',
    title,
    titleColor = 'white',
    borderStyle = 'none',
  } = options;

  const defaultColors: ColorValue[] = [
    'cyan',
    'green',
    'yellow',
    'magenta',
    'blue',
    'red',
  ];

  if (series.length === 0 || series.every((s) => s.data.length === 0)) {
    return Text({ color: 'gray', dim: true }, 'No data');
  }

  const bounds = calculateBounds(series, xAxis, yAxis);

  // Render chart canvas
  const chartLines = renderLineChartStrings(series, {
    width,
    height,
    xAxis,
    yAxis,
    showGrid,
  });

  // Build Y-axis labels
  const yTicks = yAxis.ticks ?? 5;
  const yLabelWidth = 6;
  const yLabels: VNode[] = [];

  for (let i = 0; i <= yTicks; i++) {
    const value =
      bounds.yMax - (i / yTicks) * (bounds.yMax - bounds.yMin);
    const label = formatTick(value, yAxis.formatter).padStart(yLabelWidth);
    const rowIndex = Math.round((i / yTicks) * (chartLines.length - 1));

    if (i === 0 || i === yTicks || i === Math.floor(yTicks / 2)) {
      yLabels.push(
        Box(
          { height: i === 0 ? 1 : Math.round(chartLines.length / yTicks) },
          Text({ color: 'gray', dim: true }, label)
        )
      );
    }
  }

  // Build X-axis labels
  const xTicks = xAxis.ticks ?? 5;
  const xLabels: VNode[] = [];

  for (let i = 0; i <= xTicks; i++) {
    const value =
      bounds.xMin + (i / xTicks) * (bounds.xMax - bounds.xMin);
    const label = formatTick(value, xAxis.formatter);
    const spacing = Math.floor(width / xTicks);

    xLabels.push(
      Box(
        { width: i === xTicks ? undefined : spacing },
        Text({ color: 'gray', dim: true }, i === 0 ? label : label.padStart(spacing))
      )
    );
  }

  // Render chart lines with colors
  const chartNodes = chartLines.map((line, lineIdx) => {
    // For braille mode, we need to color by series
    // For simplicity, use first series color for now
    const primaryColor = series[0]?.color ?? defaultColors[0];
    return Text({ color: primaryColor }, line);
  });

  // Build legend
  const shouldShowLegend = showLegend ?? series.length > 1;
  let legendNode: VNode | null = null;

  if (shouldShowLegend) {
    const legendItems = series.map((s, i) => {
      const color = s.color ?? defaultColors[i % defaultColors.length];
      return Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color }, '●'),
        Text({ color: 'gray' }, s.name)
      );
    });

    legendNode = Box(
      {
        flexDirection: legendPosition === 'right' ? 'column' : 'row',
        gap: legendPosition === 'right' ? 0 : 2,
        marginLeft: legendPosition === 'right' ? 2 : 0,
        marginTop: legendPosition === 'bottom' ? 1 : 0,
        marginBottom: legendPosition === 'top' ? 1 : 0,
      },
      ...legendItems
    );
  }

  // Assemble chart
  const chartArea = Box(
    { flexDirection: 'column' },
    ...chartNodes
  );

  const chartWithYAxis = Box(
    { flexDirection: 'row' },
    yAxis.show !== false
      ? Box({ flexDirection: 'column', marginRight: 1 }, ...yLabels.slice(0, 3))
      : null,
    chartArea,
    legendPosition === 'right' ? legendNode : null
  );

  const parts: (VNode | null)[] = [];

  // Title
  if (title) {
    parts.push(
      Box(
        { marginBottom: 1 },
        Text({ color: titleColor, bold: true }, title)
      )
    );
  }

  // Legend top
  if (legendPosition === 'top' && legendNode) {
    parts.push(legendNode);
  }

  // Chart with Y axis
  parts.push(chartWithYAxis);

  // X-axis labels
  if (xAxis.show !== false) {
    parts.push(
      Box(
        { flexDirection: 'row', marginLeft: yAxis.show !== false ? yLabelWidth + 1 : 0 },
        ...xLabels
      )
    );
  }

  // Legend bottom
  if (legendPosition === 'bottom' && legendNode) {
    parts.push(legendNode);
  }

  return Box({ flexDirection: 'column' }, ...parts);
}

// =============================================================================
// Area Chart Variant
// =============================================================================

export interface AreaChartOptions extends Omit<LineChartOptions, 'series'> {
  /** Single data series */
  data: DataPoint[] | number[];
  /** Area fill color */
  color?: ColorValue;
  /** Series name */
  name?: string;
}

/**
 * AreaChart - Filled area chart (single series)
 *
 * @example
 * AreaChart({
 *   data: [10, 25, 30, 45, 60, 55, 70],
 *   color: 'cyan',
 *   width: 50,
 *   height: 10,
 * })
 */
export function AreaChart(options: AreaChartOptions): VNode {
  const { data, color = 'cyan', name = 'Data', ...rest } = options;

  // Area chart is just a line chart with fill - for terminal, same visual
  return LineChart({
    ...rest,
    series: [{ name, data, color }],
    showLegend: false,
  });
}

// =============================================================================
// Multi-Line Renderer (with distinct colors per series)
// =============================================================================

/**
 * Render multi-series line chart with colored output
 */
export function renderMultiSeriesChart(
  series: DataSeries[],
  options: Omit<LineChartOptions, 'series'> = {}
): { lines: string[]; colors: (ColorValue | undefined)[][] } {
  const { width = 60, height = 15, xAxis = {}, yAxis = {} } = options;

  const defaultColors: ColorValue[] = [
    'cyan',
    'green',
    'yellow',
    'magenta',
    'blue',
    'red',
  ];

  const bounds = calculateBounds(series, xAxis, yAxis);
  const isAscii = getRenderMode() === 'ascii';

  // For colored multi-series, we track which series owns each pixel
  const pixelWidth = isAscii ? width : width * 2;
  const pixelHeight = isAscii ? height : height * 4;

  // Track series index for each pixel
  const pixelOwner: (number | null)[][] = Array(pixelHeight)
    .fill(null)
    .map(() => Array(pixelWidth).fill(null));

  // Draw each series
  series.forEach((s, seriesIdx) => {
    const points = normalizeData(s.data);
    if (points.length < 2) return;

    const mapped = points.map((p) => ({
      x: ((p.x - bounds.xMin) / (bounds.xMax - bounds.xMin)) * (pixelWidth - 1),
      y:
        pixelHeight -
        1 -
        ((p.y - bounds.yMin) / (bounds.yMax - bounds.yMin)) * (pixelHeight - 1),
    }));

    for (let i = 0; i < mapped.length - 1; i++) {
      const p0 = mapped[i]!;
      const p1 = mapped[i + 1]!;

      // Bresenham's line
      let x0 = Math.round(p0.x);
      let y0 = Math.round(p0.y);
      const x1 = Math.round(p1.x);
      const y1 = Math.round(p1.y);

      const dx = Math.abs(x1 - x0);
      const dy = Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx - dy;

      while (true) {
        if (x0 >= 0 && x0 < pixelWidth && y0 >= 0 && y0 < pixelHeight) {
          pixelOwner[y0]![x0] = seriesIdx;
        }

        if (x0 === x1 && y0 === y1) break;

        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x0 += sx;
        }
        if (e2 < dx) {
          err += dx;
          y0 += sy;
        }
      }
    }
  });

  // Render with color info
  if (isAscii) {
    const lines: string[] = [];
    const colors: (ColorValue | undefined)[][] = [];

    for (let y = 0; y < height; y++) {
      let line = '';
      const lineColors: (ColorValue | undefined)[] = [];

      for (let x = 0; x < width; x++) {
        const owner = pixelOwner[y]?.[x];
        if (owner !== null && owner !== undefined) {
          line += '*';
          lineColors.push(
            series[owner]?.color ?? defaultColors[owner % defaultColors.length]
          );
        } else {
          line += ' ';
          lineColors.push(undefined);
        }
      }

      lines.push(line);
      colors.push(lineColors);
    }

    return { lines, colors };
  }

  // Braille mode - colors per character
  const charWidth = width;
  const charHeight = height;
  const lines: string[] = [];
  const colors: (ColorValue | undefined)[][] = [];

  for (let cy = 0; cy < charHeight; cy++) {
    let line = '';
    const lineColors: (ColorValue | undefined)[] = [];

    for (let cx = 0; cx < charWidth; cx++) {
      let pattern = 0;
      let dominantSeries: number | null = null;
      const seriesCounts = new Map<number, number>();

      for (let bit = 0; bit < 8; bit++) {
        const [dx, dy] = BRAILLE_DOTS[bit]!;
        const px = cx * 2 + dx;
        const py = cy * 4 + dy;

        const owner = pixelOwner[py]?.[px];
        if (owner !== null && owner !== undefined) {
          pattern |= 1 << bit;
          seriesCounts.set(owner, (seriesCounts.get(owner) ?? 0) + 1);
        }
      }

      // Find dominant series for this character
      let maxCount = 0;
      for (const [seriesIdx, count] of seriesCounts) {
        if (count > maxCount) {
          maxCount = count;
          dominantSeries = seriesIdx;
        }
      }

      line += String.fromCharCode(BRAILLE_BASE + pattern);

      if (dominantSeries !== null) {
        lineColors.push(
          series[dominantSeries]?.color ??
            defaultColors[dominantSeries % defaultColors.length]
        );
      } else {
        lineColors.push(undefined);
      }
    }

    lines.push(line);
    colors.push(lineColors);
  }

  return { lines, colors };
}

// =============================================================================
// Exports
// =============================================================================

export { BrailleCanvas, AsciiCanvas };
