/**
 * RadarChart - Multi-dimensional radar (spider) chart
 *
 * Features:
 * - 3-8 dimensional comparison
 * - Multiple series overlay
 * - Customizable axis ranges
 * - Text-based area fill
 */

import type { VNode, ColorValue } from '../../utils/types.js';
import { Box, Text } from '../../primitives/nodes.js';
import { padTextToWidth } from '../../utils/text-utils.js';
import { getRenderMode } from '../../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export interface RadarAxis {
  /** Axis name/label */
  name: string;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Optional formatter */
  formatter?: (value: number) => string;
}

export interface RadarSeries {
  /** Series name (for legend) */
  name: string;
  /** Values (one per axis) */
  values: number[];
  /** Color */
  color?: ColorValue;
}

export interface RadarChartOptions {
  /** Axes definitions */
  axes: RadarAxis[];
  /** Data series */
  series: RadarSeries[];
  /** Chart size */
  size?: number;
  /** Show legend */
  showLegend?: boolean;
  /** Title */
  title?: string;
}

// =============================================================================
// Component
// =============================================================================

/**
 * RadarChart - Multi-dimensional comparison
 *
 * @example
 * RadarChart({
 *   axes: [
 *     { name: 'Speed', max: 100 },
 *     { name: 'Power', max: 100 },
 *     { name: 'Range', max: 100 },
 *     { name: 'Efficiency', max: 100 },
 *     { name: 'Durability', max: 100 },
 *   ],
 *   series: [
 *     { name: 'Model A', values: [80, 75, 70, 85, 80], color: 'cyan' },
 *     { name: 'Model B', values: [70, 85, 80, 75, 90], color: 'green' },
 *   ],
 *   size: 20,
 * })
 */
export function RadarChart(props: RadarChartOptions): VNode {
  const {
    axes,
    series,
    size = 20,
    showLegend = true,
    title,
  } = props;

  if (axes.length < 3 || axes.length > 8) {
    return Text({ color: 'red' }, 'Radar chart requires 3-8 axes');
  }
  if (!Number.isInteger(size) || size < 7) {
    throw new RangeError('RadarChart size must be an integer greater than or equal to 7');
  }

  const numAxes = axes.length;
  const defaultColors = ['cyan', 'green', 'yellow', 'magenta', 'blue', 'red'];
  const ascii = getRenderMode() === 'ascii';
  const axisChar = ascii ? '.' : '·';
  const centerChar = ascii ? '+' : '┼';
  const edgeChar = ascii ? '*' : '•';
  const pointChar = ascii ? 'o' : '●';

  // Calculate bounds for each axis
  const bounds = axes.map((axis) => {
    const min = axis.min ?? 0;
    const max = axis.max ?? 100;
    if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
      throw new RangeError(`RadarChart axis "${axis.name}" must have finite bounds with max > min`);
    }
    return { min, max };
  });
  for (const item of series) {
    if (item.values.length !== numAxes) {
      throw new RangeError(
        `RadarChart series "${item.name}" must provide exactly ${numAxes} values`
      );
    }
    if (item.values.some(value => !Number.isFinite(value))) {
      throw new TypeError(`RadarChart series "${item.name}" contains a non-finite value`);
    }
  }

  // Calculate axis positions (radial)
  const angleStep = (2 * Math.PI) / numAxes;
  const axisPositions = axes.map((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });

  // Build text-based display
  const displayLines: VNode[] = [];

  // Title
  if (title) {
    displayLines.push(
      Box(
        { marginBottom: 1 },
        Text({ color: 'white', bold: true }, title)
      )
    );
  }

  type RadarCell = { char: string; color: ColorValue };
  const chartWidth = size;
  const chartHeight = Math.max(5, Math.round(size / 2));
  const centerX = Math.floor(chartWidth / 2);
  const centerY = Math.floor(chartHeight / 2);
  const radiusX = Math.max(1, centerX - 1);
  const radiusY = Math.max(1, centerY - 1);
  const grid: RadarCell[][] = Array.from(
    { length: chartHeight },
    () => Array.from({ length: chartWidth }, () => ({ char: ' ', color: 'gray' }))
  );
  const setCell = (x: number, y: number, char: string, color: ColorValue, overwrite: boolean) => {
    if (x < 0 || x >= chartWidth || y < 0 || y >= chartHeight) return;
    if (!overwrite && grid[y]![x]!.char !== ' ') return;
    grid[y]![x] = { char, color };
  };
  const drawLine = (
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    char: string,
    color: ColorValue,
    overwrite: boolean,
  ) => {
    let x = fromX;
    let y = fromY;
    const dx = Math.abs(toX - fromX);
    const sx = fromX < toX ? 1 : -1;
    const dy = -Math.abs(toY - fromY);
    const sy = fromY < toY ? 1 : -1;
    let error = dx + dy;

    while (true) {
      setCell(x, y, char, color, overwrite);
      if (x === toX && y === toY) break;
      const doubled = error * 2;
      if (doubled >= dy) {
        error += dy;
        x += sx;
      }
      if (doubled <= dx) {
        error += dx;
        y += sy;
      }
    }
  };

  // Draw neutral axes first.
  for (const position of axisPositions) {
    drawLine(
      centerX,
      centerY,
      Math.round(centerX + position.x * radiusX),
      Math.round(centerY + position.y * radiusY),
      axisChar,
      'gray',
      false,
    );
  }
  setCell(centerX, centerY, centerChar, 'gray', true);

  // Draw each normalized series as a polygon. Later series intentionally win
  // at intersections, matching the legend order.
  series.forEach((item, seriesIndex) => {
    const color = item.color ?? defaultColors[seriesIndex % defaultColors.length]!;
    const points = item.values.map((value, axisIndex) => {
      const bound = bounds[axisIndex]!;
      const normalized = Math.max(0, Math.min(1, (value - bound.min) / (bound.max - bound.min)));
      const position = axisPositions[axisIndex]!;
      return {
        x: Math.round(centerX + position.x * radiusX * normalized),
        y: Math.round(centerY + position.y * radiusY * normalized),
      };
    });

    for (let index = 0; index < points.length; index++) {
      const from = points[index]!;
      const to = points[(index + 1) % points.length]!;
      drawLine(from.x, from.y, to.x, to.y, edgeChar, color, true);
      setCell(from.x, from.y, pointChar, color, true);
    }
  });

  const chartRows = grid.map(row => {
    const segments: VNode[] = [];
    let segment = '';
    let segmentColor: ColorValue | undefined;
    for (const cell of row) {
      if (segmentColor !== cell.color) {
        if (segment) segments.push(Text({ color: segmentColor }, segment));
        segment = cell.char;
        segmentColor = cell.color;
      } else {
        segment += cell.char;
      }
    }
    if (segment) segments.push(Text({ color: segmentColor }, segment));
    return Box({ flexDirection: 'row' }, ...segments);
  });
  displayLines.push(
    Box(
      {
        flexDirection: 'column',
        width: chartWidth,
        height: chartHeight,
        'aria-label': `Radar chart with ${numAxes} axes and ${series.length} series`,
      },
      ...chartRows,
    )
  );

  // Axis labels and values
  const rows: VNode[] = [];
  for (let i = 0; i < numAxes; i++) {
    const axis = axes[i]!;
    const rowItems: VNode[] = [];

    // Axis name
    rowItems.push(Text({ color: 'gray', dim: true }, padTextToWidth(axis.name, 12)));

    // Values from each series
    for (let s = 0; s < series.length; s++) {
      const serie = series[s]!;
      const value = serie.values[i] ?? 0;
      const color = serie.color ?? defaultColors[s % defaultColors.length];
      const formattedValue = axis.formatter ? axis.formatter(value) : value.toFixed(0);

      rowItems.push(
        Box(
          { marginRight: 2 },
          Text({ color }, padTextToWidth(formattedValue, 8, 'right'))
        )
      );
    }

    rows.push(Box({ flexDirection: 'row', marginBottom: 0 }, ...rowItems));
  }

  displayLines.push(Box({ flexDirection: 'column' }, ...rows));

  // Legend
  if (showLegend) {
    const legendItems = series.map((s, i) => {
      const color = s.color ?? defaultColors[i % defaultColors.length];
      return Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color }, pointChar),
        Text({ color: 'gray' }, s.name)
      );
    });

    displayLines.push(
      Box(
        { flexDirection: 'row', gap: 2, marginTop: 1 },
        ...legendItems
      )
    );
  }

  return Box({ flexDirection: 'column' }, ...displayLines);
}
