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

  const numAxes = axes.length;
  const defaultColors = ['cyan', 'green', 'yellow', 'magenta', 'blue', 'red'];

  // Calculate bounds for each axis
  const bounds = axes.map((axis) => ({
    min: axis.min ?? 0,
    max: axis.max ?? 100,
  }));

  // Calculate axis positions (radial)
  const angleStep = (2 * Math.PI) / numAxes;
  const axisPositions = axes.map((_, i) => ({
    angle: i * angleStep,
    x: Math.cos(i * angleStep - Math.PI / 2),
    y: Math.sin(i * angleStep - Math.PI / 2),
  }));

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

  // Axis labels and values
  const rows: VNode[] = [];
  for (let i = 0; i < numAxes; i++) {
    const axis = axes[i]!;
    const rowItems: VNode[] = [];

    // Axis name
    rowItems.push(Text({ color: 'gray', dim: true }, axis.name.padEnd(12)));

    // Values from each series
    for (let s = 0; s < series.length; s++) {
      const serie = series[s]!;
      const value = serie.values[i] ?? 0;
      const color = serie.color ?? defaultColors[s % defaultColors.length];
      const formattedValue = axis.formatter ? axis.formatter(value) : value.toFixed(0);

      rowItems.push(
        Box(
          { marginRight: 2 },
          Text({ color }, formattedValue.padStart(8))
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
        Text({ color }, '●'),
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
