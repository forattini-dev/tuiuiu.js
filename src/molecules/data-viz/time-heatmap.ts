/**
 * TimeHeatmap - Calendar-based heatmap for activity visualization
 *
 * Features:
 * - Day/week/month granularity
 * - Multiple color scales
 * - Date range support
 * - Activity level visualization
 */

import type { VNode, ColorValue } from '../../utils/types.js';
import { Box, Text } from '../../primitives/nodes.js';
import { getRenderMode } from '../../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export interface TimeHeatmapData {
  /** Date (ISO 8601 or Date) */
  date: Date | string;
  /** Value for color intensity */
  value: number;
}

export type TimeGranularity = 'day' | 'week' | 'month';

export interface TimeHeatmapOptions {
  /** Data points */
  data: TimeHeatmapData[];
  /** Granularity level */
  granularity?: TimeGranularity;
  /** Start date (default: 1 year ago) */
  startDate?: Date | string;
  /** End date (default: today) */
  endDate?: Date | string;
  /** Color scale */
  colorScale?: ColorValue[] | 'greens' | 'blues' | 'reds' | 'heat';
  /** Show legend */
  showLegend?: boolean;
  /** Title */
  title?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Parse date
 */
function parseDate(date: Date | string): Date {
  return typeof date === 'string' ? new Date(date) : date;
}

/**
 * Get date range start of period
 */
function getPeriodStart(date: Date, granularity: TimeGranularity): Date {
  const d = new Date(date);

  switch (granularity) {
    case 'day':
      return d;
    case 'week': {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      return d;
    }
    case 'month': {
      d.setDate(1);
      return d;
    }
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date, granularity: TimeGranularity): string {
  const options: Intl.DateTimeFormatOptions =
    granularity === 'day'
      ? { month: 'short', day: 'numeric' }
      : granularity === 'week'
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', year: '2-digit' };

  return new Intl.DateTimeFormat('en', options).format(date);
}

/**
 * Get color scales
 */
function getColorScale(scale: ColorValue[] | 'greens' | 'blues' | 'reds' | 'heat' | undefined): ColorValue[] {
  if (!scale) return ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353']; // greens

  if (typeof scale === 'string') {
    switch (scale) {
      case 'greens':
        return ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
      case 'blues':
        return ['#161b22', '#0a3069', '#0969da', '#54aeff', '#79c0ff'];
      case 'reds':
        return ['#161b22', '#67060c', '#a61e4d', '#da3633', '#f85149'];
      case 'heat':
        return ['blue', 'cyan', 'green', 'yellow', 'red'];
      default:
        return ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
    }
  }

  return scale;
}

// =============================================================================
// Component
// =============================================================================

/**
 * TimeHeatmap - Calendar-based activity heatmap
 *
 * @example
 * TimeHeatmap({
 *   data: [
 *     { date: '2024-01-01', value: 5 },
 *     { date: '2024-01-02', value: 10 },
 *   ],
 *   granularity: 'day',
 *   colorScale: 'greens',
 * })
 */
export function TimeHeatmap(props: TimeHeatmapOptions): VNode {
  const {
    data,
    granularity = 'day',
    startDate: customStart,
    endDate: customEnd,
    colorScale = 'greens',
    showLegend = true,
    title,
  } = props;

  const isAscii = getRenderMode() === 'ascii';
  const colors = getColorScale(colorScale);
  const INTENSITY_BLOCKS = [' ', '░', '▒', '▓', '█'];
  const ASCII_INTENSITY = [' ', '.', ':', '+', '#'];
  const intensityChars = isAscii ? ASCII_INTENSITY : INTENSITY_BLOCKS;

  if (data.length === 0) {
    return Text({ color: 'gray', dim: true }, 'No data');
  }

  // Build data map
  const dataMap = new Map<string, number>();
  let maxValue = 0;

  for (const item of data) {
    const d = parseDate(item.date);
    const periodStart = getPeriodStart(d, granularity);
    const key = periodStart.toISOString().split('T')[0]!;
    const existing = dataMap.get(key) ?? 0;
    const newValue = existing + item.value;
    dataMap.set(key, newValue);
    maxValue = Math.max(maxValue, newValue);
  }

  // Build display
  const displayLines: VNode[] = [];

  if (title) {
    displayLines.push(
      Box(
        { marginBottom: 1 },
        Text({ color: 'white', bold: true }, title)
      )
    );
  }

  // Date labels and values
  const rows: VNode[] = [];
  const sortedDates = Array.from(dataMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(0, 12); // Limit to 12 rows

  for (const [dateStr, value] of sortedDates) {
    const date = new Date(dateStr + 'T00:00:00');
    const label = formatDate(date, granularity);
    const normalized = maxValue > 0 ? value / maxValue : 0;
    const colorIdx = Math.floor(normalized * (colors.length - 1));
    const intensity = intensityChars[Math.floor(normalized * (intensityChars.length - 1))];
    const color = colors[colorIdx] ?? colors[colors.length - 1];

    const rowItems: VNode[] = [];
    rowItems.push(Text({ color: 'gray', dim: true }, label.padEnd(12)));
    rowItems.push(Text({ color }, intensity.repeat(5) + ` ${value}`));

    rows.push(Box({ flexDirection: 'row', gap: 1 }, ...rowItems));
  }

  displayLines.push(Box({ flexDirection: 'column' }, ...rows));

  // Legend
  if (showLegend) {
    const legendItems: VNode[] = [Text({ color: 'gray', dim: true }, 'Low ')];

    for (const color of colors) {
      legendItems.push(Text({ color }, '█'));
    }

    legendItems.push(Text({ color: 'gray', dim: true }, ' High'));

    displayLines.push(
      Box({ flexDirection: 'row', gap: 1, marginTop: 1 }, ...legendItems)
    );
  }

  return Box({ flexDirection: 'column' }, ...displayLines);
}
