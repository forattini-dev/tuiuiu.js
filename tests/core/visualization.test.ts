/**
 * Data Visualization Tests
 */

import { describe, it, expect } from 'vitest';
import {
  sparkline,
  sparklineGradient,
  barChart,
  verticalBarChart,
  horizontalBar,
  calculateBoxPlotStats,
  boxPlot,
  calculateHistogramBins,
  histogram,
  pieChart,
  lineChart,
  gauge,
  heatmap,
  calculateStats,
  normalizeData,
  scaleData,
} from '../../src/core/visualization.js';

// =============================================================================
// Sparkline
// =============================================================================

describe('sparkline', () => {
  it('should generate sparkline from data', () => {
    const result = sparkline({ data: [1, 2, 3, 4, 5] });
    expect(result.length).toBe(5);
    expect(result).not.toBe('     '); // Should not be empty
  });

  it('should handle empty data', () => {
    const result = sparkline({ data: [] });
    expect(result).toBe('');
  });

  it('should use custom width', () => {
    const result = sparkline({ data: [1, 2, 3, 4, 5], width: 10 });
    expect(result.length).toBe(10);
  });

  it('should use blocks charset', () => {
    const result = sparkline({ data: [0, 4, 8], charset: 'blocks' });
    expect(result).toMatch(/[▁▂▃▄▅▆▇█ ]/);
  });

  it('should use braille charset', () => {
    const result = sparkline({ data: [0, 5, 10], charset: 'braille' });
    expect(result).toMatch(/[⣀⣤⣶⣿ ]/);
  });

  it('should use ascii charset', () => {
    const result = sparkline({ data: [0, 5, 10], charset: 'ascii' });
    expect(result).toMatch(/[.:\-=+*#@ ]/);
  });

  it('should respect min/max options', () => {
    // With min=0, max=10, value 5 should be middle height
    const result = sparkline({ data: [5], min: 0, max: 10 });
    expect(result.length).toBe(1);
  });

  it('should handle single value', () => {
    const result = sparkline({ data: [42] });
    expect(result.length).toBe(1);
  });

  it('should handle all same values', () => {
    const result = sparkline({ data: [5, 5, 5, 5, 5] });
    expect(result.length).toBe(5);
    // All should be same character since values are equal
    expect(new Set(result.split('')).size).toBe(1);
  });
});

describe('sparklineGradient', () => {
  it('should generate sparkline with color info', () => {
    const { chars, colors } = sparklineGradient([1, 5, 10]);

    expect(chars.length).toBe(3);
    expect(colors.length).toBe(3);
  });

  it('should use low color for low values', () => {
    const { colors } = sparklineGradient([0, 0, 0], {
      lowColor: 'cyan',
      highColor: 'red',
    });

    expect(colors.every((c) => c === 'cyan')).toBe(true);
  });

  it('should use high color for high values', () => {
    const { colors } = sparklineGradient([10, 10, 10], {
      lowColor: 'cyan',
      highColor: 'red',
      min: 0,
      max: 10,
    });

    expect(colors.every((c) => c === 'red')).toBe(true);
  });

  it('should handle empty data', () => {
    const { chars, colors } = sparklineGradient([]);
    expect(chars).toEqual([]);
    expect(colors).toEqual([]);
  });
});

// =============================================================================
// Bar Chart
// =============================================================================

describe('barChart', () => {
  it('should generate horizontal bars', () => {
    const result = barChart({
      data: [
        { value: 10, label: 'A' },
        { value: 20, label: 'B' },
        { value: 15, label: 'C' },
      ],
      width: 20,
    });

    expect(result.length).toBe(3);
    expect(result[0]).toContain('A');
    expect(result[1]).toContain('B');
    expect(result[2]).toContain('C');
  });

  it('should handle empty data', () => {
    const result = barChart({ data: [] });
    expect(result).toEqual([]);
  });

  it('should show values', () => {
    const result = barChart({
      data: [{ value: 42, label: 'X' }],
      showValues: true,
    });

    expect(result[0]).toContain('42');
  });

  it('should hide labels when showLabels is false', () => {
    const result = barChart({
      data: [{ value: 10, label: 'Hidden' }],
      showLabels: false,
      width: 10,
    });

    expect(result[0]).not.toContain('Hidden');
  });

  it('should use custom fill character', () => {
    const result = barChart({
      data: [{ value: 10 }],
      fillChar: '#',
      emptyChar: '-',
      width: 10,
      showLabels: false,
      showValues: false,
    });

    expect(result[0]).toContain('#');
  });

  it('should handle zero values', () => {
    const result = barChart({
      data: [{ value: 0, label: 'Zero' }],
      width: 10,
    });

    expect(result.length).toBe(1);
  });
});

describe('verticalBarChart', () => {
  it('should generate vertical bars', () => {
    const result = verticalBarChart({
      data: [
        { value: 5, label: 'A' },
        { value: 10, label: 'B' },
      ],
      height: 10,
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('should include labels at bottom', () => {
    const result = verticalBarChart({
      data: [
        { value: 5, label: 'Aaa' },
        { value: 10, label: 'Bbb' },
      ],
      height: 5,
      showLabels: true,
    });

    const lastLine = result[result.length - 1];
    expect(lastLine).toContain('A');
    expect(lastLine).toContain('B');
  });

  it('should handle empty data', () => {
    const result = verticalBarChart({ data: [] });
    expect(result).toEqual([]);
  });
});

describe('horizontalBar', () => {
  it('should generate bar with correct width', () => {
    const result = horizontalBar(50, 100, 20);
    expect(result.length).toBe(20);
  });

  it('should handle zero max', () => {
    const result = horizontalBar(10, 0, 10);
    expect(result).toBe(' '.repeat(10));
  });

  it('should fill completely for value equal to max', () => {
    const result = horizontalBar(100, 100, 10);
    expect(result.includes('█')).toBe(true);
  });

  it('should handle fractional fill', () => {
    const result = horizontalBar(25, 100, 20);
    expect(result.length).toBe(20);
  });
});

// =============================================================================
// Box Plot
// =============================================================================

describe('calculateBoxPlotStats', () => {
  it('should calculate statistics correctly', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const stats = calculateBoxPlotStats(data);

    expect(stats.min).toBe(1);
    expect(stats.max).toBe(10);
    expect(stats.median).toBeCloseTo(5.5, 1);
    expect(stats.q1).toBeCloseTo(3.25, 1);
    expect(stats.q3).toBeCloseTo(7.75, 1);
  });

  it('should handle empty data', () => {
    const stats = calculateBoxPlotStats([]);

    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.outliers).toEqual([]);
  });

  it('should identify outliers', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 100]; // 100 is outlier
    const stats = calculateBoxPlotStats(data);

    expect(stats.outliers).toContain(100);
  });

  it('should handle single value', () => {
    const stats = calculateBoxPlotStats([42]);

    expect(stats.min).toBe(42);
    expect(stats.max).toBe(42);
    expect(stats.median).toBe(42);
  });
});

describe('boxPlot', () => {
  it('should generate box plot', () => {
    const result = boxPlot({
      data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      width: 40,
    });

    expect(result.length).toBe(40);
    expect(result).toContain('█'); // Box portion
    expect(result).toContain('─'); // Whisker
  });

  it('should handle empty data', () => {
    const result = boxPlot({ data: [] });
    expect(result).toBe('');
  });

  it('should respect width option', () => {
    const result = boxPlot({
      data: [1, 2, 3, 4, 5],
      width: 20,
    });

    expect(result.length).toBe(20);
  });
});

// =============================================================================
// Histogram
// =============================================================================

describe('calculateHistogramBins', () => {
  it('should calculate bins correctly', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const bins = calculateHistogramBins(data, 5);

    expect(bins.length).toBe(5);
    expect(bins[0].start).toBe(1);
    expect(bins[4].end).toBe(10);
  });

  it('should count values in bins', () => {
    const data = [1, 1, 1, 5, 5, 9, 9, 9, 9];
    const bins = calculateHistogramBins(data, 3);

    expect(bins[0].count).toBe(3); // 1, 1, 1
    expect(bins[1].count).toBe(2); // 5, 5
    expect(bins[2].count).toBe(4); // 9, 9, 9, 9
  });

  it('should handle empty data', () => {
    const bins = calculateHistogramBins([], 5);
    expect(bins).toEqual([]);
  });
});

describe('histogram', () => {
  it('should generate histogram', () => {
    const result = histogram({
      data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      bins: 5,
      height: 5,
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('should include axis', () => {
    const result = histogram({
      data: [1, 2, 3, 4, 5],
      bins: 5,
      height: 5,
    });

    // Should have a line with '─' for axis
    const hasAxis = result.some((line) => line.includes('─'));
    expect(hasAxis).toBe(true);
  });

  it('should handle empty data', () => {
    const result = histogram({ data: [] });
    expect(result).toEqual([]);
  });
});

// =============================================================================
// Pie Chart
// =============================================================================

describe('pieChart', () => {
  it('should generate pie chart', () => {
    const result = pieChart({
      data: [
        { value: 30, label: 'A' },
        { value: 70, label: 'B' },
      ],
      radius: 3,
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('should include legend when enabled', () => {
    const result = pieChart({
      data: [
        { value: 50, label: 'First' },
        { value: 50, label: 'Second' },
      ],
      radius: 3,
      showLegend: true,
    });

    const legendText = result.join('\n');
    expect(legendText).toContain('First');
    expect(legendText).toContain('Second');
  });

  it('should show percentages in legend', () => {
    const result = pieChart({
      data: [
        { value: 25, label: 'A' },
        { value: 75, label: 'B' },
      ],
      radius: 3,
      showLegend: true,
      showPercentages: true,
    });

    const legendText = result.join('\n');
    expect(legendText).toContain('%');
  });

  it('should handle empty data', () => {
    const result = pieChart({ data: [] });
    expect(result).toEqual([]);
  });

  it('should handle zero total', () => {
    const result = pieChart({
      data: [
        { value: 0, label: 'A' },
        { value: 0, label: 'B' },
      ],
    });

    expect(result).toEqual([]);
  });

  it('should support donut mode', () => {
    const result = pieChart({
      data: [
        { value: 50, label: 'A' },
        { value: 50, label: 'B' },
      ],
      radius: 5,
      donut: true,
      donutRatio: 0.5,
    });

    expect(result.length).toBeGreaterThan(0);
    // Center should be empty (spaces)
    const centerLine = result[5]; // Middle line
    // Has at least some spaces in the middle
    expect(centerLine).toContain(' ');
  });
});

// =============================================================================
// Line Chart
// =============================================================================

describe('lineChart', () => {
  it('should generate line chart', () => {
    const result = lineChart({
      data: [1, 3, 2, 5, 4, 6],
      width: 20,
      height: 5,
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle multiple series', () => {
    const result = lineChart({
      data: [
        [1, 2, 3, 4, 5],
        [5, 4, 3, 2, 1],
      ],
      width: 10,
      height: 5,
    });

    expect(result.length).toBeGreaterThan(0);
  });

  it('should show axes when enabled', () => {
    const result = lineChart({
      data: [1, 5, 3, 7, 2],
      width: 10,
      height: 5,
      showAxes: true,
    });

    const chartText = result.join('\n');
    expect(chartText).toContain('│');
    expect(chartText).toContain('└');
  });

  it('should use dots when showDots is true', () => {
    const result = lineChart({
      data: [1, 5, 3],
      width: 5,
      height: 5,
      showDots: true,
    });

    const chartText = result.join('');
    expect(chartText).toContain('●');
  });

  it('should handle empty data', () => {
    const result = lineChart({ data: [] });
    expect(result).toEqual([]);
  });
});

// =============================================================================
// Gauge
// =============================================================================

describe('gauge', () => {
  it('should generate bar gauge', () => {
    const result = gauge({
      value: 50,
      max: 100,
      width: 20,
      style: 'bar',
    });

    expect(result).toContain('█');
    expect(result).toContain('░');
  });

  it('should show percentage', () => {
    const result = gauge({
      value: 75,
      max: 100,
      showPercentage: true,
    });

    expect(result).toContain('75%');
  });

  it('should handle arc style', () => {
    const result = gauge({
      value: 50,
      max: 100,
      style: 'arc',
    });

    expect(result).toContain('%');
  });

  it('should handle circle style', () => {
    const result = gauge({
      value: 50,
      max: 100,
      style: 'circle',
    });

    // Should be one of the circle characters
    expect(result).toMatch(/[○●◐◑◒◓◔◕]/);
  });

  it('should clamp value to valid range', () => {
    const result1 = gauge({ value: -10, max: 100 });
    expect(result1).toContain('0%');

    const result2 = gauge({ value: 200, max: 100 });
    expect(result2).toContain('100%');
  });
});

// =============================================================================
// Heatmap
// =============================================================================

describe('heatmap', () => {
  it('should generate heatmap', () => {
    const data = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];

    const result = heatmap({ data });

    expect(result.length).toBe(3);
  });

  it('should use different charsets', () => {
    const data = [
      [0, 5, 10],
      [10, 5, 0],
    ];

    const blocksResult = heatmap({ data, charset: 'blocks' });
    const shadesResult = heatmap({ data, charset: 'shades' });
    const asciiResult = heatmap({ data, charset: 'ascii' });

    expect(blocksResult[0]).toMatch(/[░▒▓█ ]/);
    expect(shadesResult[0]).toMatch(/[·∘○● ]/);
    expect(asciiResult[0]).toMatch(/[.oO@ ]/);
  });

  it('should show values when enabled', () => {
    const data = [[42]];

    const result = heatmap({ data, showValues: true });

    expect(result[0]).toContain('42');
  });

  it('should handle empty data', () => {
    const result = heatmap({ data: [] });
    expect(result).toEqual([]);
  });

  it('should respect min/max options', () => {
    const data = [[5]];

    // With min=0, max=10, value 5 should be mid-intensity
    const result = heatmap({ data, min: 0, max: 10, charset: 'blocks' });
    expect(result.length).toBe(1);
  });
});

// =============================================================================
// Utility Functions
// =============================================================================

describe('calculateStats', () => {
  it('should calculate all statistics', () => {
    const data = [1, 2, 3, 4, 5];
    const stats = calculateStats(data);

    expect(stats.min).toBe(1);
    expect(stats.max).toBe(5);
    expect(stats.mean).toBe(3);
    expect(stats.median).toBe(3);
    expect(stats.sum).toBe(15);
    expect(stats.stdDev).toBeCloseTo(1.414, 2);
  });

  it('should handle empty data', () => {
    const stats = calculateStats([]);

    expect(stats.min).toBe(0);
    expect(stats.max).toBe(0);
    expect(stats.mean).toBe(0);
    expect(stats.median).toBe(0);
    expect(stats.sum).toBe(0);
    expect(stats.stdDev).toBe(0);
  });

  it('should handle single value', () => {
    const stats = calculateStats([42]);

    expect(stats.min).toBe(42);
    expect(stats.max).toBe(42);
    expect(stats.mean).toBe(42);
    expect(stats.median).toBe(42);
    expect(stats.stdDev).toBe(0);
  });
});

describe('normalizeData', () => {
  it('should normalize to 0-1 range', () => {
    const data = [0, 50, 100];
    const result = normalizeData(data);

    expect(result).toEqual([0, 0.5, 1]);
  });

  it('should handle single value', () => {
    const result = normalizeData([42]);
    expect(result).toEqual([0]); // Only one value normalizes to 0
  });

  it('should handle empty data', () => {
    const result = normalizeData([]);
    expect(result).toEqual([]);
  });

  it('should handle all same values', () => {
    const result = normalizeData([5, 5, 5]);
    expect(result).toEqual([0, 0, 0]); // All same = all at 0
  });
});

describe('scaleData', () => {
  it('should scale to new range', () => {
    const data = [0, 0.5, 1];
    const result = scaleData(data, 10, 20);

    expect(result).toEqual([10, 15, 20]);
  });

  it('should handle non-normalized input', () => {
    const data = [0, 50, 100];
    const result = scaleData(data, 0, 10);

    expect(result).toEqual([0, 5, 10]);
  });

  it('should handle empty data', () => {
    const result = scaleData([], 0, 100);
    expect(result).toEqual([]);
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle negative values in sparkline', () => {
    const result = sparkline({ data: [-5, 0, 5] });
    expect(result.length).toBe(3);
  });

  it('should handle very large values', () => {
    const result = barChart({
      data: [{ value: 1000000, label: 'Big' }],
      showValues: true,
    });

    expect(result[0]).toContain('M'); // Formatted as 1M
  });

  it('should handle floating point values', () => {
    const stats = calculateStats([1.5, 2.5, 3.5]);
    expect(stats.mean).toBeCloseTo(2.5, 5);
  });

  it('should handle very small ranges', () => {
    const result = sparkline({ data: [0.001, 0.002, 0.003] });
    expect(result.length).toBe(3);
  });
});
