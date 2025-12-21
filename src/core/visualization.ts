/**
 * Data Visualization System
 *
 * Features:
 * - Sparklines (inline mini charts)
 * - Bar charts (horizontal/vertical)
 * - Box plots (statistical visualization)
 * - Histograms
 * - Pie/donut charts (ASCII art)
 * - Line charts (basic)
 *
 * Inspired by: Rich (panels), Textual (sparklines), CLI chart libraries
 */

// =============================================================================
// Types
// =============================================================================

/** Chart color */
export type ChartColor =
  | 'default'
  | 'red'
  | 'green'
  | 'blue'
  | 'yellow'
  | 'cyan'
  | 'magenta'
  | 'white'
  | 'gray'
  | string; // Hex colors

/** Data point for charts */
export interface DataPoint {
  value: number;
  label?: string;
  color?: ChartColor;
}

/** Sparkline options */
export interface SparklineOptions {
  /** Data values */
  data: number[];
  /** Width in characters (default: data.length) */
  width?: number;
  /** Minimum value for scale (default: auto) */
  min?: number;
  /** Maximum value for scale (default: auto) */
  max?: number;
  /** Character set to use */
  charset?: 'braille' | 'blocks' | 'ascii';
  /** Color for the line */
  color?: ChartColor;
}

/** Bar chart options */
export interface BarChartOptions {
  /** Data points */
  data: DataPoint[];
  /** Chart width (default: 40) */
  width?: number;
  /** Chart height for vertical charts (default: 10) */
  height?: number;
  /** Bar orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Show values on bars */
  showValues?: boolean;
  /** Show labels */
  showLabels?: boolean;
  /** Maximum value for scale (default: auto) */
  max?: number;
  /** Character for filled portion */
  fillChar?: string;
  /** Character for empty portion */
  emptyChar?: string;
  /** Default bar color */
  color?: ChartColor;
}

/** Box plot options */
export interface BoxPlotOptions {
  /** Data values */
  data: number[];
  /** Width in characters */
  width?: number;
  /** Show outliers */
  showOutliers?: boolean;
  /** Whisker style */
  whiskerStyle?: 'iqr' | 'minmax';
}

/** Box plot result (statistics) */
export interface BoxPlotStats {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  iqr: number;
  outliers: number[];
}

/** Histogram options */
export interface HistogramOptions {
  /** Data values */
  data: number[];
  /** Number of bins (default: 10) */
  bins?: number;
  /** Width in characters (default: 40) */
  width?: number;
  /** Height in rows (default: 10) */
  height?: number;
  /** Show bin labels */
  showLabels?: boolean;
  /** Color */
  color?: ChartColor;
}

/** Histogram bin */
export interface HistogramBin {
  start: number;
  end: number;
  count: number;
}

/** Pie chart options */
export interface PieChartOptions {
  /** Data points with values and optional labels */
  data: DataPoint[];
  /** Radius in characters (default: 5) */
  radius?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Show percentages in legend */
  showPercentages?: boolean;
  /** Donut mode (hollow center) */
  donut?: boolean;
  /** Donut inner radius ratio (0-1) */
  donutRatio?: number;
}

/** Line chart options */
export interface LineChartOptions {
  /** Data series */
  data: number[] | number[][];
  /** Chart width */
  width?: number;
  /** Chart height */
  height?: number;
  /** Minimum Y value */
  min?: number;
  /** Maximum Y value */
  max?: number;
  /** Series colors */
  colors?: ChartColor[];
  /** Show axes */
  showAxes?: boolean;
  /** Show dots at data points */
  showDots?: boolean;
}

// =============================================================================
// Character Sets
// =============================================================================

/** Braille sparkline characters (8 levels) */
const BRAILLE_CHARS = [' ', '⣀', '⣤', '⣶', '⣿'];

/** Block sparkline characters (8 levels) */
const BLOCK_CHARS = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/** ASCII sparkline characters */
const ASCII_CHARS = [' ', '.', ':', '-', '=', '+', '*', '#', '@'];

/** Horizontal bar characters */
const HBAR_CHARS = ['▏', '▎', '▍', '▌', '▋', '▊', '▉', '█'];

/** Vertical bar characters */
const VBAR_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

/** Box plot characters */
const BOX_CHARS = {
  horizontal: '─',
  vertical: '│',
  left: '├',
  right: '┤',
  box: '█',
  whisker: '┬',
  median: '┃',
};

/** Pie chart characters (for different segments) */
const PIE_CHARS = ['█', '▓', '▒', '░', '○', '●', '◐', '◑', '◒', '◓'];

// =============================================================================
// Sparkline
// =============================================================================

/**
 * Generate sparkline string
 */
export function sparkline(options: SparklineOptions): string {
  const { data, width = data.length, charset = 'blocks', color } = options;

  if (data.length === 0) {
    return '';
  }

  const min = options.min ?? Math.min(...data);
  const max = options.max ?? Math.max(...data);
  const range = max - min || 1;

  // Choose character set
  let chars: string[];
  switch (charset) {
    case 'braille':
      chars = BRAILLE_CHARS;
      break;
    case 'ascii':
      chars = ASCII_CHARS;
      break;
    default:
      chars = BLOCK_CHARS;
  }

  const levels = chars.length - 1;

  // Resample if width differs from data length
  const values = resampleData(data, width);

  // Convert to characters
  const result = values
    .map((v) => {
      const normalized = (v - min) / range;
      const level = Math.round(normalized * levels);
      return chars[Math.max(0, Math.min(level, levels))];
    })
    .join('');

  return result;
}

/**
 * Generate sparkline with gradient colors
 */
export function sparklineGradient(
  data: number[],
  options: Omit<SparklineOptions, 'data' | 'color'> & {
    lowColor?: ChartColor;
    highColor?: ChartColor;
  } = {}
): { chars: string[]; colors: ChartColor[] } {
  const { lowColor = 'cyan', highColor = 'red' } = options;

  if (data.length === 0) {
    return { chars: [], colors: [] };
  }

  const min = options.min ?? Math.min(...data);
  const max = options.max ?? Math.max(...data);
  const range = max - min || 1;

  const chars =
    options.charset === 'braille'
      ? BRAILLE_CHARS
      : options.charset === 'ascii'
        ? ASCII_CHARS
        : BLOCK_CHARS;
  const levels = chars.length - 1;

  const width = options.width ?? data.length;
  const values = resampleData(data, width);

  const resultChars: string[] = [];
  const resultColors: ChartColor[] = [];

  for (const v of values) {
    const normalized = (v - min) / range;
    const level = Math.round(normalized * levels);
    resultChars.push(chars[Math.max(0, Math.min(level, levels))]);

    // Interpolate color based on value
    resultColors.push(normalized > 0.5 ? highColor : lowColor);
  }

  return { chars: resultChars, colors: resultColors };
}

// =============================================================================
// Bar Chart
// =============================================================================

/**
 * Generate horizontal bar chart
 */
export function barChart(options: BarChartOptions): string[] {
  const {
    data,
    width = 40,
    showValues = true,
    showLabels = true,
    fillChar = '█',
    emptyChar = '░',
    color,
  } = options;

  if (data.length === 0) {
    return [];
  }

  const maxValue = options.max ?? Math.max(...data.map((d) => d.value));
  const maxLabelLen = showLabels
    ? Math.max(...data.map((d) => (d.label ?? '').length))
    : 0;

  const lines: string[] = [];

  for (const point of data) {
    const ratio = maxValue > 0 ? point.value / maxValue : 0;
    const barWidth = Math.round(ratio * width);

    let line = '';

    // Label
    if (showLabels) {
      const label = (point.label ?? '').padEnd(maxLabelLen);
      line += label + ' ';
    }

    // Bar
    const filled = fillChar.repeat(barWidth);
    const empty = emptyChar.repeat(width - barWidth);
    line += filled + empty;

    // Value
    if (showValues) {
      line += ' ' + formatNumber(point.value);
    }

    lines.push(line);
  }

  return lines;
}

/**
 * Generate vertical bar chart
 */
export function verticalBarChart(options: BarChartOptions): string[] {
  const { data, height = 10, showLabels = true, color } = options;

  if (data.length === 0) {
    return [];
  }

  const maxValue = options.max ?? Math.max(...data.map((d) => d.value));
  const levels = VBAR_CHARS.length;

  const lines: string[] = [];

  // Build from top to bottom
  for (let row = height - 1; row >= 0; row--) {
    let line = '';

    for (let col = 0; col < data.length; col++) {
      const ratio = maxValue > 0 ? data[col].value / maxValue : 0;
      const barHeight = ratio * height;

      if (row < Math.floor(barHeight)) {
        // Full block
        line += VBAR_CHARS[levels - 1];
      } else if (row < barHeight) {
        // Partial block
        const partial = (barHeight - row) * (levels - 1);
        line += VBAR_CHARS[Math.round(partial)];
      } else {
        line += ' ';
      }

      // Add spacing between bars
      if (col < data.length - 1) {
        line += ' ';
      }
    }

    lines.push(line);
  }

  // Add labels at bottom
  if (showLabels) {
    const labelLine = data
      .map((d) => (d.label ?? '').charAt(0) || ' ')
      .join(' ');
    lines.push(labelLine);
  }

  return lines;
}

/**
 * Generate horizontal bar with fractional blocks
 */
export function horizontalBar(value: number, max: number, width: number): string {
  if (max === 0) return ' '.repeat(width);

  const ratio = Math.min(1, value / max);
  const fullBlocks = Math.floor(ratio * width);
  const remainder = (ratio * width) % 1;

  let bar = '█'.repeat(fullBlocks);

  if (fullBlocks < width && remainder > 0) {
    const partialIndex = Math.round(remainder * (HBAR_CHARS.length - 1));
    bar += HBAR_CHARS[partialIndex];
  }

  return bar.padEnd(width);
}

// =============================================================================
// Box Plot
// =============================================================================

/**
 * Calculate box plot statistics
 */
export function calculateBoxPlotStats(data: number[]): BoxPlotStats {
  if (data.length === 0) {
    return { min: 0, q1: 0, median: 0, q3: 0, max: 0, iqr: 0, outliers: [] };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const n = sorted.length;

  const min = sorted[0];
  const max = sorted[n - 1];
  const median = percentile(sorted, 50);
  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;

  // Find outliers (values beyond 1.5 * IQR)
  const lowerBound = q1 - 1.5 * iqr;
  const upperBound = q3 + 1.5 * iqr;
  const outliers = sorted.filter((v) => v < lowerBound || v > upperBound);

  return { min, q1, median, q3, max, iqr, outliers };
}

/**
 * Generate box plot ASCII representation
 */
export function boxPlot(options: BoxPlotOptions): string {
  const { data, width = 40, showOutliers = true, whiskerStyle = 'iqr' } = options;

  if (data.length === 0) {
    return '';
  }

  const stats = calculateBoxPlotStats(data);

  // Determine range
  let rangeMin: number;
  let rangeMax: number;

  if (whiskerStyle === 'iqr') {
    rangeMin = Math.max(stats.min, stats.q1 - 1.5 * stats.iqr);
    rangeMax = Math.min(stats.max, stats.q3 + 1.5 * stats.iqr);
  } else {
    rangeMin = stats.min;
    rangeMax = stats.max;
  }

  const range = rangeMax - rangeMin || 1;

  // Convert positions to character indices
  const scale = (v: number) => Math.round(((v - rangeMin) / range) * (width - 1));

  const leftWhisker = scale(rangeMin);
  const q1Pos = scale(stats.q1);
  const medianPos = scale(stats.median);
  const q3Pos = scale(stats.q3);
  const rightWhisker = scale(rangeMax);

  // Build the box plot
  let result = '';

  for (let i = 0; i < width; i++) {
    if (i === leftWhisker || i === rightWhisker) {
      result += '├';
    } else if (i === medianPos) {
      result += '┃';
    } else if (i > leftWhisker && i < q1Pos) {
      result += '─';
    } else if (i >= q1Pos && i <= q3Pos) {
      result += '█';
    } else if (i > q3Pos && i < rightWhisker) {
      result += '─';
    } else if (showOutliers && stats.outliers.some((o) => scale(o) === i)) {
      result += '○';
    } else {
      result += ' ';
    }
  }

  return result;
}

// =============================================================================
// Histogram
// =============================================================================

/**
 * Calculate histogram bins
 */
export function calculateHistogramBins(data: number[], numBins: number): HistogramBin[] {
  if (data.length === 0) {
    return [];
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / numBins || 1;

  const bins: HistogramBin[] = [];

  for (let i = 0; i < numBins; i++) {
    bins.push({
      start: min + i * binWidth,
      end: min + (i + 1) * binWidth,
      count: 0,
    });
  }

  // Count values in each bin
  for (const value of data) {
    const binIndex = Math.min(numBins - 1, Math.floor((value - min) / binWidth));
    bins[binIndex].count++;
  }

  return bins;
}

/**
 * Generate histogram
 */
export function histogram(options: HistogramOptions): string[] {
  const { data, bins: numBins = 10, width = 40, height = 10, showLabels = true } = options;

  if (data.length === 0) {
    return [];
  }

  const bins = calculateHistogramBins(data, numBins);
  const maxCount = Math.max(...bins.map((b) => b.count));

  const lines: string[] = [];

  // Build from top to bottom
  for (let row = height - 1; row >= 0; row--) {
    let line = '';

    for (let col = 0; col < bins.length; col++) {
      const ratio = maxCount > 0 ? bins[col].count / maxCount : 0;
      const barHeight = ratio * height;

      if (row < barHeight) {
        line += '█';
      } else {
        line += ' ';
      }
    }

    lines.push(line);
  }

  // Add axis
  lines.push('─'.repeat(bins.length));

  // Add labels
  if (showLabels) {
    const startLabel = formatNumber(bins[0].start, 1);
    const endLabel = formatNumber(bins[bins.length - 1].end, 1);
    const labelLine = startLabel.padEnd(bins.length - endLabel.length) + endLabel;
    lines.push(labelLine.slice(0, bins.length));
  }

  return lines;
}

// =============================================================================
// Pie Chart
// =============================================================================

/**
 * Generate ASCII pie chart
 */
export function pieChart(options: PieChartOptions): string[] {
  const {
    data,
    radius = 5,
    showLegend = true,
    showPercentages = true,
    donut = false,
    donutRatio = 0.5,
  } = options;

  if (data.length === 0) {
    return [];
  }

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) {
    return [];
  }

  const diameter = radius * 2 + 1;
  const centerX = radius;
  const centerY = radius;

  // Build character grid
  const grid: string[][] = [];
  for (let y = 0; y < diameter; y++) {
    grid.push(new Array(diameter * 2).fill(' ')); // *2 for aspect ratio
  }

  // Calculate segment angles
  const segments: { startAngle: number; endAngle: number; char: string }[] = [];
  let currentAngle = -Math.PI / 2; // Start at top

  for (let i = 0; i < data.length; i++) {
    const ratio = data[i].value / total;
    const endAngle = currentAngle + ratio * 2 * Math.PI;
    segments.push({
      startAngle: currentAngle,
      endAngle,
      char: PIE_CHARS[i % PIE_CHARS.length],
    });
    currentAngle = endAngle;
  }

  // Fill the circle
  for (let y = 0; y < diameter; y++) {
    for (let x = 0; x < diameter * 2; x++) {
      const dx = (x / 2 - centerX) / radius;
      const dy = (y - centerY) / radius;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Check if point is inside the circle
      if (distance <= 1) {
        // Check if point is inside donut hole
        if (donut && distance < donutRatio) {
          continue;
        }

        const angle = Math.atan2(dy, dx);

        // Find which segment this angle belongs to
        for (const segment of segments) {
          let start = segment.startAngle;
          let end = segment.endAngle;

          // Normalize angles
          while (start > Math.PI) start -= 2 * Math.PI;
          while (start < -Math.PI) start += 2 * Math.PI;
          while (end > Math.PI) end -= 2 * Math.PI;
          while (end < -Math.PI) end += 2 * Math.PI;

          // Check if angle is in this segment
          if (isAngleInRange(angle, segment.startAngle, segment.endAngle)) {
            grid[y][x] = segment.char;
            break;
          }
        }
      }
    }
  }

  // Convert grid to lines
  const lines = grid.map((row) => row.join(''));

  // Add legend
  if (showLegend) {
    lines.push('');

    for (let i = 0; i < data.length; i++) {
      const char = PIE_CHARS[i % PIE_CHARS.length];
      const label = data[i].label ?? `Item ${i + 1}`;
      const percentage = ((data[i].value / total) * 100).toFixed(1);

      let legendLine = `${char} ${label}`;
      if (showPercentages) {
        legendLine += ` (${percentage}%)`;
      }
      lines.push(legendLine);
    }
  }

  return lines;
}

// =============================================================================
// Line Chart
// =============================================================================

/**
 * Generate ASCII line chart
 */
export function lineChart(options: LineChartOptions): string[] {
  const {
    data,
    width = 40,
    height = 10,
    showAxes = true,
    showDots = false,
    colors = ['default'],
  } = options;

  // Handle both single and multiple series
  const series: number[][] = Array.isArray(data[0])
    ? (data as number[][])
    : [data as number[]];

  if (series.length === 0 || series[0].length === 0) {
    return [];
  }

  // Find range across all series
  const allValues = series.flat();
  const min = options.min ?? Math.min(...allValues);
  const max = options.max ?? Math.max(...allValues);
  const range = max - min || 1;

  // Create grid
  const grid: string[][] = [];
  for (let y = 0; y < height; y++) {
    grid.push(new Array(width).fill(' '));
  }

  // Plot each series
  for (let s = 0; s < series.length; s++) {
    const values = resampleData(series[s], width);
    const char = showDots ? '●' : getLineChar(s);

    for (let x = 0; x < values.length; x++) {
      const normalized = (values[x] - min) / range;
      const y = height - 1 - Math.round(normalized * (height - 1));

      if (y >= 0 && y < height) {
        grid[y][x] = char;
      }
    }

    // Connect points with lines (if not dots only)
    if (!showDots && values.length > 1) {
      for (let x = 0; x < values.length - 1; x++) {
        const y1 = height - 1 - Math.round(((values[x] - min) / range) * (height - 1));
        const y2 = height - 1 - Math.round(((values[x + 1] - min) / range) * (height - 1));

        // Draw vertical connection
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);

        for (let y = minY + 1; y < maxY; y++) {
          if (y >= 0 && y < height && grid[y][x] === ' ') {
            grid[y][x] = '│';
          }
        }
      }
    }
  }

  // Convert to lines
  let lines = grid.map((row) => row.join(''));

  // Add axes
  if (showAxes) {
    // Y-axis labels
    const maxLabel = formatNumber(max, 1);
    const minLabel = formatNumber(min, 1);
    const labelWidth = Math.max(maxLabel.length, minLabel.length);

    lines = lines.map((line, i) => {
      if (i === 0) {
        return maxLabel.padStart(labelWidth) + ' ┤' + line;
      } else if (i === height - 1) {
        return minLabel.padStart(labelWidth) + ' ┤' + line;
      } else {
        return ' '.repeat(labelWidth) + ' │' + line;
      }
    });

    // X-axis
    lines.push(' '.repeat(labelWidth) + ' └' + '─'.repeat(width));
  }

  return lines;
}

// =============================================================================
// Gauge / Progress
// =============================================================================

/** Gauge options */
export interface GaugeOptions {
  /** Current value */
  value: number;
  /** Maximum value */
  max?: number;
  /** Width in characters */
  width?: number;
  /** Style */
  style?: 'bar' | 'arc' | 'circle';
  /** Show percentage */
  showPercentage?: boolean;
  /** Color for filled portion */
  color?: ChartColor;
  /** Colors for different ranges */
  rangeColors?: { threshold: number; color: ChartColor }[];
}

/**
 * Generate gauge/meter visualization
 */
export function gauge(options: GaugeOptions): string {
  const {
    value,
    max = 100,
    width = 20,
    style = 'bar',
    showPercentage = true,
    color,
    rangeColors,
  } = options;

  const ratio = Math.min(1, Math.max(0, value / max));
  const percentage = Math.round(ratio * 100);

  switch (style) {
    case 'arc': {
      // Half circle arc gauge
      const arcChars = ['◜', '◝', '◞', '◟'];
      const filled = Math.round(ratio * arcChars.length);
      return arcChars.slice(0, filled).join('') + ` ${percentage}%`;
    }

    case 'circle': {
      // Simple circle gauge
      if (ratio >= 0.875) return '●';
      if (ratio >= 0.625) return '◕';
      if (ratio >= 0.375) return '◑';
      if (ratio >= 0.125) return '◔';
      return '○';
    }

    default: {
      // Bar gauge
      const filled = Math.round(ratio * width);
      let bar = '█'.repeat(filled) + '░'.repeat(width - filled);

      if (showPercentage) {
        const percentStr = ` ${percentage}%`;
        bar += percentStr;
      }

      return bar;
    }
  }
}

// =============================================================================
// Heatmap
// =============================================================================

/** Heatmap options */
export interface HeatmapOptions {
  /** 2D data grid (rows x cols) */
  data: number[][];
  /** Character set for intensity levels */
  charset?: 'blocks' | 'shades' | 'ascii';
  /** Minimum value (default: auto) */
  min?: number;
  /** Maximum value (default: auto) */
  max?: number;
  /** Show cell values */
  showValues?: boolean;
  /** Cell width for values */
  cellWidth?: number;
}

/** Block shades for heatmap */
const HEAT_BLOCKS = [' ', '░', '▒', '▓', '█'];
const HEAT_SHADES = [' ', '·', '∘', '○', '●'];
const HEAT_ASCII = [' ', '.', 'o', 'O', '@'];

/**
 * Generate heatmap
 */
export function heatmap(options: HeatmapOptions): string[] {
  const { data, charset = 'blocks', showValues = false, cellWidth = 3 } = options;

  if (data.length === 0) {
    return [];
  }

  // Find range
  const allValues = data.flat();
  const min = options.min ?? Math.min(...allValues);
  const max = options.max ?? Math.max(...allValues);
  const range = max - min || 1;

  const chars =
    charset === 'shades' ? HEAT_SHADES : charset === 'ascii' ? HEAT_ASCII : HEAT_BLOCKS;
  const levels = chars.length - 1;

  const lines: string[] = [];

  for (const row of data) {
    let line = '';

    for (const value of row) {
      const normalized = (value - min) / range;
      const level = Math.round(normalized * levels);
      const char = chars[Math.max(0, Math.min(level, levels))];

      if (showValues) {
        const valStr = formatNumber(value, 0).padStart(cellWidth);
        line += valStr;
      } else {
        line += char;
      }
    }

    lines.push(line);
  }

  return lines;
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Resample data to target length
 */
function resampleData(data: number[], targetLength: number): number[] {
  if (data.length === targetLength) {
    return data;
  }

  if (data.length === 0) {
    return new Array(targetLength).fill(0);
  }

  const result: number[] = [];
  const ratio = (data.length - 1) / (targetLength - 1 || 1);

  for (let i = 0; i < targetLength; i++) {
    const srcIndex = i * ratio;
    const lower = Math.floor(srcIndex);
    const upper = Math.min(lower + 1, data.length - 1);
    const fraction = srcIndex - lower;

    result.push(data[lower] * (1 - fraction) + data[upper] * fraction);
  }

  return result;
}

/**
 * Calculate percentile
 */
function percentile(sortedData: number[], p: number): number {
  if (sortedData.length === 0) return 0;
  if (sortedData.length === 1) return sortedData[0];

  const index = (p / 100) * (sortedData.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const fraction = index - lower;

  return sortedData[lower] * (1 - fraction) + sortedData[upper] * fraction;
}

/**
 * Format number for display
 */
function formatNumber(value: number, decimals = 2): string {
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(decimals);
}

/**
 * Check if angle is in range
 */
function isAngleInRange(angle: number, start: number, end: number): boolean {
  // Normalize angle to [-PI, PI]
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;

  if (start <= end) {
    return angle >= start && angle <= end;
  } else {
    // Range crosses -PI/PI boundary
    return angle >= start || angle <= end;
  }
}

/**
 * Get line character for series index
 */
function getLineChar(index: number): string {
  const chars = ['─', '═', '━', '╍', '┅', '┉'];
  return chars[index % chars.length];
}

/**
 * Calculate statistics for data array
 */
export function calculateStats(data: number[]): {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  sum: number;
} {
  if (data.length === 0) {
    return { min: 0, max: 0, mean: 0, median: 0, stdDev: 0, sum: 0 };
  }

  const sorted = [...data].sort((a, b) => a - b);
  const sum = data.reduce((a, b) => a + b, 0);
  const mean = sum / data.length;

  const variance =
    data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
  const stdDev = Math.sqrt(variance);

  const median = percentile(sorted, 50);

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median,
    stdDev,
    sum,
  };
}

/**
 * Normalize data to 0-1 range
 */
export function normalizeData(data: number[]): number[] {
  if (data.length === 0) return [];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  return data.map((v) => (v - min) / range);
}

/**
 * Scale data to new range
 */
export function scaleData(data: number[], newMin: number, newMax: number): number[] {
  const normalized = normalizeData(data);
  const range = newMax - newMin;
  return normalized.map((v) => v * range + newMin);
}
