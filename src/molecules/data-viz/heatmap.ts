/**
 * Heatmap - 2D color intensity visualization
 *
 * Features:
 * - 2D data grid
 * - Color intensity mapping
 * - Custom color scales
 * - Cell labels
 * - Row/column headers
 * - ASCII fallback
 */

import { Box, Text } from '../../primitives/nodes.js';
import type { VNode, ColorValue } from '../../utils/types.js';
import { createSignal } from '../../primitives/signal.js';
import { useInput } from '../../hooks/index.js';
import { useFactoryState } from '../../hooks/factory-state.js';
import { getRenderMode } from '../../core/capabilities.js';
import { padTextToWidth, stringWidth } from '../../utils/text-utils.js';

// =============================================================================
// Types
// =============================================================================

export interface HeatmapCell {
  /** Cell value (determines color intensity) */
  value: number;
  /** Optional label */
  label?: string;
  /** Optional tooltip */
  tooltip?: string;
}

export type HeatmapData = (number | HeatmapCell)[][];

export interface ColorScale {
  /** Name of the color scale */
  name: string;
  /** Color stops from low to high */
  colors: ColorValue[];
}

export interface HeatmapOptions {
  /** 2D data array */
  data: HeatmapData;
  /** Column headers */
  columnHeaders?: string[];
  /** Row headers */
  rowHeaders?: string[];
  /** Min value (auto-detected if not specified) */
  minValue?: number;
  /** Max value (auto-detected if not specified) */
  maxValue?: number;
  /** Color scale */
  colorScale?: ColorScale | 'heat' | 'cool' | 'viridis' | 'grayscale';
  /** Cell width */
  cellWidth?: number;
  /** Show values in cells */
  showValues?: boolean;
  /** Value format function */
  formatValue?: (value: number) => string;
  /** Border between cells */
  showBorder?: boolean;
  /** Border color */
  borderColor?: ColorValue;
  /** Interactive (keyboard navigation) */
  interactive?: boolean;
  /** Is active */
  isActive?: boolean;
  /** Callbacks */
  onSelect?: (row: number, col: number, value: number) => void;
  /** Normalization mode for value-to-color mapping */
  normalization?: NormalizationMode;
}

/** How values are mapped to color intensities */
export type NormalizationMode = 'linear' | 'percentile' | 'logarithmic';

// =============================================================================
// Color Scales
// =============================================================================

export const COLOR_SCALES: Record<string, ColorScale> = {
  heat: {
    name: 'heat',
    colors: ['blue', 'cyan', 'green', 'yellow', 'red'],
  },
  cool: {
    name: 'cool',
    colors: ['cyan', 'blue', 'magenta'],
  },
  viridis: {
    name: 'viridis',
    colors: ['#440154', '#414487', '#2a788e', '#22a884', '#7ad151', '#fde725'],
  },
  grayscale: {
    name: 'grayscale',
    colors: ['black', 'gray', 'white'],
  },
  redgreen: {
    name: 'redgreen',
    colors: ['red', 'yellow', 'green'],
  },
  temperature: {
    name: 'temperature',
    colors: ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'],
  },
};

// Block characters for intensity (dark to light)
const INTENSITY_BLOCKS = [' ', '░', '▒', '▓', '█'];
const ASCII_INTENSITY = [' ', '.', ':', '+', '#'];

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get cell value from data
 */
function getCellValue(cell: number | HeatmapCell): number {
  return typeof cell === 'number' ? cell : cell.value;
}

/**
 * Get cell label from data
 */
function getCellLabel(cell: number | HeatmapCell): string | undefined {
  return typeof cell === 'number' ? undefined : cell.label;
}

/**
 * Normalize value to 0-1 range (linear)
 */
function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

// =============================================================================
// Percentile-Based Normalization
// =============================================================================

export interface Percentiles {
  p25: number;
  p50: number;
  p75: number;
}

/**
 * Calculate percentiles from an array of values.
 * Filters out zeros to focus on active data points.
 */
export function calculatePercentiles(values: number[]): Percentiles | null {
  const nonZero = values.filter((v) => v > 0).sort((a, b) => a - b);
  if (nonZero.length === 0) return null;

  return {
    p25: nonZero[Math.floor(nonZero.length * 0.25)] ?? nonZero[0]!,
    p50: nonZero[Math.floor(nonZero.length * 0.5)] ?? nonZero[0]!,
    p75: nonZero[Math.floor(nonZero.length * 0.75)] ?? nonZero[0]!,
  };
}

/**
 * Normalize a value using percentile quartiles.
 * Returns 0-1 mapped to 5 intensity levels:
 * 0 = no data, 0.25 = below p25, 0.5 = p25-p50, 0.75 = p50-p75, 1.0 = above p75
 */
function normalizePercentile(value: number, percentiles: Percentiles | null): number {
  if (value === 0 || !percentiles) return 0;
  if (value >= percentiles.p75) return 1.0;
  if (value >= percentiles.p50) return 0.75;
  if (value >= percentiles.p25) return 0.5;
  return 0.25;
}

/**
 * Normalize a value using logarithmic scale.
 * Better for data with large dynamic range (e.g., 1 to 10000).
 */
function normalizeLogarithmic(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  if (value <= min) return 0;
  return Math.max(0, Math.min(1,
    Math.log(value - min + 1) / Math.log(max - min + 1)
  ));
}

/**
 * Normalize a value using the specified mode
 */
function normalizeWithMode(
  value: number,
  min: number,
  max: number,
  mode: NormalizationMode,
  percentiles?: Percentiles | null,
): number {
  switch (mode) {
    case 'percentile':
      return normalizePercentile(value, percentiles ?? null);
    case 'logarithmic':
      return normalizeLogarithmic(value, min, max);
    case 'linear':
    default:
      return normalizeValue(value, min, max);
  }
}

/**
 * Get color for normalized value
 */
function getColorForValue(normalized: number, scale: ColorScale): ColorValue {
  const colors = scale.colors;
  if (colors.length === 0) return 'white';
  if (colors.length === 1) return colors[0]!;

  const segment = normalized * (colors.length - 1);
  const index = Math.floor(segment);

  if (index >= colors.length - 1) return colors[colors.length - 1]!;

  // Return the color at this index (no interpolation in terminal)
  return colors[index]!;
}

/**
 * Get intensity character for normalized value
 */
function getIntensityChar(normalized: number, useAscii: boolean): string {
  const chars = useAscii ? ASCII_INTENSITY : INTENSITY_BLOCKS;
  const index = Math.floor(normalized * (chars.length - 1));
  return chars[Math.min(index, chars.length - 1)]!;
}

/**
 * Auto-detect min/max from data
 */
function getDataRange(data: HeatmapData): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;

  for (const row of data) {
    for (const cell of row) {
      const value = getCellValue(cell);
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }

  return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 1 : max };
}

/**
 * Resolve color scale
 */
function resolveColorScale(
  scale: ColorScale | 'heat' | 'cool' | 'viridis' | 'grayscale' | undefined
): ColorScale {
  if (!scale) return COLOR_SCALES.heat!;
  if (typeof scale === 'string') return COLOR_SCALES[scale] || COLOR_SCALES.heat!;
  return scale;
}

// =============================================================================
// Component
// =============================================================================

export interface HeatmapState {
  selectedRow: () => number;
  selectedCol: () => number;
  moveUp: () => void;
  moveDown: () => void;
  moveLeft: () => void;
  moveRight: () => void;
  select: (row: number, col: number) => void;
  updateOptions: (options: HeatmapOptions) => void;
}

/**
 * Create Heatmap state
 */
export function createHeatmap(options: HeatmapOptions): HeatmapState {
  let runtimeOptions = options;

  const [selectedRow, setSelectedRow] = createSignal(0);
  const [selectedCol, setSelectedCol] = createSignal(0);

  const moveUp = () => {
    setSelectedRow((r) => Math.max(0, r - 1));
  };

  const moveDown = () => {
    setSelectedRow((r) => Math.min(runtimeOptions.data.length - 1, r + 1));
  };

  const moveLeft = () => {
    setSelectedCol((c) => Math.max(0, c - 1));
  };

  const moveRight = () => {
    setSelectedCol((c) => Math.min((runtimeOptions.data[0]?.length ?? 0) - 1, c + 1));
  };

  const select = (row: number, col: number) => {
    setSelectedRow(row);
    setSelectedCol(col);
    const value = getCellValue(runtimeOptions.data[row]?.[col] ?? 0);
    runtimeOptions.onSelect?.(row, col, value);
  };

  return {
    selectedRow,
    selectedCol,
    moveUp,
    moveDown,
    moveLeft,
    moveRight,
    select,
    updateOptions: (nextOptions: HeatmapOptions) => {
      runtimeOptions = nextOptions;
      setSelectedRow((row) => Math.max(0, Math.min(row, nextOptions.data.length - 1)));
      setSelectedCol((col) => Math.max(0, Math.min(col, (nextOptions.data[0]?.length ?? 1) - 1)));
    },
  };
}

export interface HeatmapProps extends HeatmapOptions {
  state?: HeatmapState;
}

/**
 * Heatmap - 2D color intensity visualization
 *
 * @example
 * // Basic heatmap
 * Heatmap({
 *   data: [
 *     [1, 2, 3],
 *     [4, 5, 6],
 *     [7, 8, 9],
 *   ],
 *   colorScale: 'heat',
 * })
 *
 * @example
 * // With headers
 * Heatmap({
 *   data: weeklyData,
 *   columnHeaders: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
 *   rowHeaders: ['Week 1', 'Week 2', 'Week 3'],
 *   showValues: true,
 * })
 */
export function Heatmap(props: HeatmapProps): VNode {
  const {
    data,
    columnHeaders,
    rowHeaders,
    minValue,
    maxValue,
    colorScale = 'heat',
    cellWidth = 3,
    showValues = false,
    formatValue = (v) => v.toFixed(0),
    showBorder = false,
    borderColor = 'border',
    interactive = false,
    isActive = true,
    state: externalState,
  } = props;

  const normalization = props.normalization ?? 'linear';
  const isAscii = getRenderMode() === 'ascii';
  const scale = resolveColorScale(colorScale);
  const { min, max } = getDataRange(data);
  const effectiveMin = minValue ?? min;
  const effectiveMax = maxValue ?? max;

  // Pre-calculate percentiles if needed
  const percentiles = normalization === 'percentile'
    ? calculatePercentiles(data.flat().map(getCellValue))
    : null;

  const state = interactive
    ? useFactoryState(externalState, props, createHeatmap)
    : externalState;

  // Keyboard handling for interactive mode
  if (interactive && state) {
    useInput(
      (input, key) => {
        if (key.upArrow || input === 'k') state.moveUp();
        else if (key.downArrow || input === 'j') state.moveDown();
        else if (key.leftArrow || input === 'h') state.moveLeft();
        else if (key.rightArrow || input === 'l') state.moveRight();
        else if (key.return || input === ' ') {
          const row = state.selectedRow();
          const col = state.selectedCol();
          state.select(row, col);
        }
      },
      { isActive }
    );
  }

  const selectedRow = state?.selectedRow() ?? -1;
  const selectedCol = state?.selectedCol() ?? -1;
  const safeCellWidth = Number.isFinite(cellWidth)
    ? Math.max(1, Math.trunc(cellWidth))
    : 3;
  const rowHeaderWidth = Math.max(
    0,
    ...(rowHeaders ?? []).map(stringWidth),
  );

  // Build header row
  const headerRow: VNode[] = [];
  if (columnHeaders && columnHeaders.length > 0) {
    // Empty cell for row header column
    if (rowHeaders) {
      headerRow.push(Text({ dim: true }, ' '.repeat(rowHeaderWidth + 1)));
    }

    columnHeaders.forEach((header, i) => {
      const padded = padTextToWidth(header, safeCellWidth);
      headerRow.push(
        Box(
          { marginRight: showBorder ? 0 : 1 },
          Text({ color: 'mutedForeground', dim: true }, padded)
        )
      );
      if (showBorder && i < columnHeaders.length - 1) {
        headerRow.push(Text({ color: borderColor }, '│'));
      }
    });
  }

  // Build data rows
  const dataRows: VNode[] = [];

  data.forEach((row, rowIdx) => {
    const rowCells: VNode[] = [];

    // Row header
    if (rowHeaders && rowHeaders[rowIdx]) {
      rowCells.push(
        Box(
          { marginRight: 1 },
          Text(
            { color: 'mutedForeground', dim: true },
            padTextToWidth(rowHeaders[rowIdx]!, rowHeaderWidth),
          )
        )
      );
    }

    row.forEach((cell, colIdx) => {
      const value = getCellValue(cell);
      const label = getCellLabel(cell);
      const normalized = normalizeWithMode(value, effectiveMin, effectiveMax, normalization, percentiles);
      const color = getColorForValue(normalized, scale);

      const isSelected = interactive && rowIdx === selectedRow && colIdx === selectedCol;

      let cellContent: string;
      if (showValues) {
        cellContent = padTextToWidth(label ?? formatValue(value), safeCellWidth);
      } else {
        const char = getIntensityChar(normalized, isAscii);
        cellContent = char.repeat(safeCellWidth);
      }

      rowCells.push(
        Box(
          { marginRight: showBorder ? 0 : 1 },
          Text(
            {
              color: showValues ? color : undefined,
              backgroundColor: showValues ? undefined : color,
              inverse: isSelected,
            },
            cellContent
          )
        )
      );

      if (showBorder && colIdx < row.length - 1) {
        rowCells.push(Text({ color: borderColor }, '│'));
      }
    });

    // Horizontal border between rows
    if (showBorder && rowIdx < data.length - 1) {
      const borderLine = '─'.repeat(
        Math.max(0, (safeCellWidth + 1) * row.length - 1),
      );
      dataRows.push(
        Box({ flexDirection: 'row' }, ...rowCells),
        Box(
          { flexDirection: 'row' },
          rowHeaders
            ? Text({ dim: true }, ' '.repeat(rowHeaderWidth + 1))
            : null,
          Text({ color: borderColor }, borderLine)
        )
      );
    } else {
      dataRows.push(Box({ flexDirection: 'row' }, ...rowCells));
    }
  });

  return Box(
    { flexDirection: 'column' },
    headerRow.length > 0 ? Box({ flexDirection: 'row', marginBottom: 1 }, ...headerRow) : null,
    ...dataRows
  );
}

// =============================================================================
// GitHub-style Contribution Graph
// =============================================================================

export interface ContributionData {
  date: Date | string;
  count: number;
}

export interface ContributionGraphOptions {
  /** Contribution data */
  data: ContributionData[];
  /** Number of weeks to show (default: 52) */
  weeks?: number;
  /** Custom start date (overrides weeks calculation) */
  startDate?: Date | string;
  /** Custom end date (overrides weeks calculation) */
  endDate?: Date | string;
  /** Color scale */
  colorScale?: ColorScale | 'greens' | 'blues' | 'reds' | 'purples' | 'oranges';
  /** Show month labels */
  showMonths?: boolean;
  /** Show day labels (Mon, Wed, Fri) */
  showDays?: boolean;
  /** Format for cell values */
  formatValue?: (count: number) => string;
  /** Normalization mode (default: 'percentile' — better for activity data) */
  normalization?: NormalizationMode;
}

const GREENS_SCALE: ColorScale = {
  name: 'greens',
  colors: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
};

const BLUES_SCALE: ColorScale = {
  name: 'blues',
  colors: ['#161b22', '#0a3069', '#0969da', '#54aeff', '#79c0ff'],
};

const REDS_SCALE: ColorScale = {
  name: 'reds',
  colors: ['#161b22', '#67060c', '#a61e4d', '#da3633', '#f85149'],
};

const PURPLES_SCALE: ColorScale = {
  name: 'purples',
  colors: ['#161b22', '#3d0814', '#6e40aa', '#a371f7', '#d2a8ff'],
};

const ORANGES_SCALE: ColorScale = {
  name: 'oranges',
  colors: ['#161b22', '#7d2e0f', '#b35806', '#fb8500', '#ffb627'],
};

/**
 * ContributionGraph - GitHub-style contribution heatmap
 *
 * @example
 * ContributionGraph({
 *   data: contributions,
 *   weeks: 52,
 *   showMonths: true,
 * })
 */
export function ContributionGraph(props: ContributionGraphOptions): VNode {
  const {
    data,
    weeks = 52,
    startDate: customStartDate,
    endDate: customEndDate,
    colorScale = 'greens',
    showMonths = true,
    showDays = true,
    formatValue = (count) => String(count),
  } = props;

  const isAscii = getRenderMode() === 'ascii';

  // Resolve scale
  let scale: ColorScale;
  if (colorScale === 'greens') scale = GREENS_SCALE;
  else if (colorScale === 'blues') scale = BLUES_SCALE;
  else if (colorScale === 'reds') scale = REDS_SCALE;
  else if (colorScale === 'purples') scale = PURPLES_SCALE;
  else if (colorScale === 'oranges') scale = ORANGES_SCALE;
  else if (typeof colorScale === 'string') scale = COLOR_SCALES[colorScale] || GREENS_SCALE;
  else scale = colorScale;

  // Build date map
  const dateMap = new Map<string, number>();
  for (const item of data) {
    const dateStr =
      typeof item.date === 'string'
        ? item.date
        : item.date.toISOString().slice(0, 10);
    dateMap.set(dateStr, (dateMap.get(dateStr) ?? 0) + item.count);
  }

  // Find max value and calculate percentiles for normalization
  const allCounts = Array.from(dateMap.values());
  const maxCount = Math.max(1, ...allCounts);
  const normMode = props.normalization ?? 'percentile';
  const percentiles = normMode === 'percentile' ? calculatePercentiles(allCounts) : null;

  // Generate weeks grid (7 rows x N columns)
  let startDateObj = new Date();
  let endDateObj = new Date();

  if (customStartDate && customEndDate) {
    // Use custom date range
    startDateObj = typeof customStartDate === 'string' ? new Date(customStartDate) : customStartDate;
    endDateObj = typeof customEndDate === 'string' ? new Date(customEndDate) : customEndDate;
  } else {
    // Use weeks parameter
    endDateObj = new Date();
    startDateObj = new Date(endDateObj);
    startDateObj.setDate(startDateObj.getDate() - weeks * 7 + 1);
  }

  // Align start to Sunday
  startDateObj.setDate(startDateObj.getDate() - startDateObj.getDay());

  // Calculate number of weeks from date range
  const weeksToShow = customStartDate && customEndDate
    ? Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (7 * 24 * 60 * 60 * 1000))
    : weeks;

  const grid: number[][] = [];
  for (let day = 0; day < 7; day++) {
    grid.push([]);
  }

  const months: { month: string; col: number }[] = [];
  let currentMonth = '';

  for (let week = 0; week < weeksToShow; week++) {
    for (let day = 0; day < 7; day++) {
      const d = new Date(startDateObj);
      d.setDate(d.getDate() + week * 7 + day);

      const dateStr = d.toISOString().slice(0, 10);
      const count = dateMap.get(dateStr) ?? 0;
      grid[day]!.push(count);

      // Track months
      if (day === 0) {
        const monthName = d.toLocaleString('en', { month: 'short' });
        if (monthName !== currentMonth) {
          months.push({ month: monthName, col: week });
          currentMonth = monthName;
        }
      }
    }
  }

  // Month labels row
  const monthLabels: VNode[] = [];
  if (showMonths) {
    if (showDays) {
      monthLabels.push(Text({ dim: true }, '    ')); // Space for day labels
    }
    let lastCol = 0;
    for (const { month, col } of months) {
      const spaces = col - lastCol;
      if (spaces > 0) {
        monthLabels.push(Text({}, ' '.repeat(spaces)));
      }
      monthLabels.push(Text({ color: 'mutedForeground', dim: true }, month.slice(0, 3)));
      lastCol = col + 3;
    }
  }

  // Day labels
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  // Build rows
  const rows: VNode[] = [];

  for (let day = 0; day < 7; day++) {
    const rowCells: VNode[] = [];

    if (showDays) {
      rowCells.push(Text({ color: 'mutedForeground', dim: true }, (dayLabels[day] ?? '').padEnd(4)));
    }

    for (let week = 0; week < weeksToShow; week++) {
      const count = grid[day]![week] ?? 0;
      const normalized = normalizeWithMode(count, 0, maxCount, normMode, percentiles);
      const color = getColorForValue(normalized, scale);
      const char = isAscii ? (count > 0 ? '█' : '·') : '█';

      rowCells.push(Text({ color: count > 0 ? color : 'mutedForeground' }, char));
    }

    rows.push(Box({ flexDirection: 'row' }, ...rowCells));
  }

  return Box(
    { flexDirection: 'column' },
    monthLabels.length > 0
      ? Box({ flexDirection: 'row', marginBottom: 1 }, ...monthLabels)
      : null,
    ...rows
  );
}

// =============================================================================
// CalendarHeatmap - Year calendar view heatmap
// =============================================================================

export interface CalendarHeatmapOptions {
  /** Data by date */
  data: ContributionData[];
  /** Year to display */
  year?: number;
  /** Color scale */
  colorScale?: ColorScale | 'heat' | 'greens';
  /** Show legend */
  showLegend?: boolean;
  /** Normalization mode (default: 'percentile') */
  normalization?: NormalizationMode;
}

/**
 * CalendarHeatmap - Full year calendar view
 */
export function CalendarHeatmap(props: CalendarHeatmapOptions): VNode {
  const {
    data,
    year = new Date().getFullYear(),
    colorScale = 'greens',
    showLegend = true,
  } = props;

  const isAscii = getRenderMode() === 'ascii';

  // Resolve scale
  let scale: ColorScale;
  if (colorScale === 'greens') scale = GREENS_SCALE;
  else if (typeof colorScale === 'string') scale = COLOR_SCALES[colorScale] || GREENS_SCALE;
  else scale = colorScale;

  // Build date map
  const dateMap = new Map<string, number>();
  for (const item of data) {
    const dateStr =
      typeof item.date === 'string'
        ? item.date
        : item.date.toISOString().slice(0, 10);
    dateMap.set(dateStr, (dateMap.get(dateStr) ?? 0) + item.count);
  }

  // Find max value and calculate percentiles
  const calAllCounts = Array.from(dateMap.values());
  const maxCount = Math.max(1, ...calAllCounts);
  const calNormMode = props.normalization ?? 'percentile';
  const calPercentiles = calNormMode === 'percentile' ? calculatePercentiles(calAllCounts) : null;

  // Build months
  const monthRows: VNode[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let month = 0; month < 12; month++) {
    const monthCells: VNode[] = [];
    monthCells.push(Text({ color: 'mutedForeground', dim: true }, monthNames[month]!.padEnd(4)));

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = dateMap.get(dateStr) ?? 0;
      const normalized = normalizeWithMode(count, 0, maxCount, calNormMode, calPercentiles);
      const color = getColorForValue(normalized, scale);

      // Use subtle character for empty days, solid block for days with data
      const char = count > 0 ? '█' : (isAscii ? '·' : '░');
      const cellColor = count > 0 ? color : 'muted';

      monthCells.push(Text({ color: cellColor }, char));
    }

    // Pad to 31 days
    for (let day = daysInMonth + 1; day <= 31; day++) {
      monthCells.push(Text({}, ' '));
    }

    monthRows.push(Box({ flexDirection: 'row' }, ...monthCells));
  }

  // Legend
  let legend: VNode | null = null;
  if (showLegend) {
    const legendItems: VNode[] = [
      Text({ color: 'mutedForeground', dim: true }, 'Less '),
    ];

    for (let i = 0; i < scale.colors.length; i++) {
      legendItems.push(Text({ color: scale.colors[i] }, '█'));
    }

    legendItems.push(Text({ color: 'mutedForeground', dim: true }, ' More'));

    legend = Box({ flexDirection: 'row', marginTop: 1 }, ...legendItems);
  }

  return Box(
    { flexDirection: 'column' },
    Box({ marginBottom: 1 }, Text({ color: 'foreground', bold: true }, String(year))),
    ...monthRows,
    legend
  );
}

// =============================================================================
// CorrelationMatrix - Statistical correlation heatmap
// =============================================================================

export interface CorrelationMatrixOptions {
  /** Labels for variables */
  labels: string[];
  /** Correlation matrix data */
  correlations: number[][];
  /** Show values */
  showValues?: boolean;
  /** Decimal places */
  decimals?: number;
}

/**
 * CorrelationMatrix - Display correlation coefficients
 */
export function CorrelationMatrix(props: CorrelationMatrixOptions): VNode {
  const { labels, correlations, showValues = true, decimals = 2 } = props;

  // Correlation color scale: -1 (blue) to 0 (white) to +1 (red)
  const corrScale: ColorScale = {
    name: 'correlation',
    colors: ['blue', 'cyan', 'white', 'yellow', 'red'],
  };

  return Heatmap({
    data: correlations,
    columnHeaders: labels,
    rowHeaders: labels,
    minValue: -1,
    maxValue: 1,
    colorScale: corrScale,
    showValues,
    formatValue: (v) => v.toFixed(decimals),
    cellWidth: Math.max(4, decimals + 3),
  });
}
