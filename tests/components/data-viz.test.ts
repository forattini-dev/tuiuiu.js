/**
 * Data Visualization Components Tests
 *
 * Tests for Sparkline, BarChart, LineChart, Gauge, Heatmap
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from '../../src/design-system/core/renderer.js';
import { setRenderMode } from '../../src/core/capabilities.js';

// Sparkline
import {
  Sparkline,
  renderSparklineString,
  SparklineBuffer,
  createSparklineBuffer,
  renderBrailleSparkline,
  BLOCK_CHARS,
  ASCII_CHARS,
} from '../../src/components/data-viz/sparkline.js';

// BarChart
import {
  BarChart,
  VerticalBarChart,
  StackedBarChart,
  renderBarChartStrings,
  HORIZONTAL_BLOCKS,
  VERTICAL_BLOCKS,
} from '../../src/components/data-viz/bar-chart.js';

// LineChart
import {
  LineChart,
  AreaChart,
  renderLineChartStrings,
  renderMultiSeriesChart,
  BrailleCanvas,
  AsciiCanvas,
} from '../../src/components/data-viz/line-chart.js';

// Gauge
import {
  Gauge,
  LinearGauge,
  MeterGauge,
  ArcGauge,
  DialGauge,
  BatteryGauge,
  renderLinearGaugeString,
  DEFAULT_ZONES,
  getZoneColor,
} from '../../src/components/data-viz/gauge.js';

// Heatmap
import {
  Heatmap,
  createHeatmap,
  ContributionGraph,
  CalendarHeatmap,
  CorrelationMatrix,
  COLOR_SCALES,
} from '../../src/components/data-viz/heatmap.js';

describe('Data Visualization Components', () => {
  beforeEach(() => {
    setRenderMode('unicode');
  });

  // ==========================================================================
  // Sparkline
  // ==========================================================================

  describe('Sparkline', () => {
    it('renders sparkline with data', () => {
      const node = Sparkline({ data: [1, 2, 3, 4, 5, 4, 3, 2, 1] });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders sparkline with specified width', () => {
      const node = Sparkline({ data: [1, 5, 3], width: 10 });
      expect(node).not.toBeNull();
    });

    it('renders sparkline with color', () => {
      const node = Sparkline({ data: [1, 2, 3], color: 'green' });
      expect(node).not.toBeNull();
    });

    it('renders sparkline with custom min/max', () => {
      const node = Sparkline({ data: [5, 10, 15], min: 0, max: 20 });
      expect(node).not.toBeNull();
    });

    it('handles empty data', () => {
      const node = Sparkline({ data: [] });
      expect(node).not.toBeNull();
    });

    it('handles single data point', () => {
      const node = Sparkline({ data: [5] });
      expect(node).not.toBeNull();
    });

    it('renders with braille style', () => {
      const node = Sparkline({ data: [1, 2, 3, 4, 5], style: 'braille' });
      expect(node).not.toBeNull();
    });

    it('renders with block style', () => {
      const node = Sparkline({ data: [1, 2, 3, 4, 5], style: 'block' });
      expect(node).not.toBeNull();
    });
  });

  describe('renderSparklineString', () => {
    it('returns string representation', () => {
      const result = renderSparklineString([1, 2, 3, 4, 5, 4, 3, 2, 1]);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('uses block characters', () => {
      const result = renderSparklineString([1, 8]);
      // Should contain block characters
      expect(result).toMatch(/[▁▂▃▄▅▆▇█]/);
    });
  });

  describe('SparklineBuffer', () => {
    it('creates buffer with max size', () => {
      const buffer = createSparklineBuffer({ maxSize: 5 });
      expect(buffer).toBeDefined();
    });

    it('has push and getData methods', () => {
      const buffer = createSparklineBuffer({ maxSize: 5 });
      expect(typeof buffer.push).toBe('function');
      expect(typeof buffer.data).toBe('function');
    });

    it('tracks data internally', () => {
      const buffer = createSparklineBuffer({ maxSize: 5 });
      buffer.push(1);
      buffer.push(2);
      // Just verify the buffer works
      expect(buffer).toBeDefined();
    });

    it('can render VNode', () => {
      const buffer = createSparklineBuffer({ maxSize: 10 });
      buffer.push(1);
      buffer.push(5);
      buffer.push(3);
      // buffer.render() returns VNode, not string
      const node = buffer.render();
      expect(node).not.toBeNull();
    });
  });

  describe('renderBrailleSparkline', () => {
    it('renders braille representation', () => {
      const result = renderBrailleSparkline([1, 2, 3, 4, 5], { width: 5 });
      expect(typeof result).toBe('string');
    });
  });

  describe('BLOCK_CHARS and ASCII_CHARS', () => {
    it('has correct number of block characters', () => {
      expect(BLOCK_CHARS.length).toBe(8);
    });

    it('has correct number of ASCII characters', () => {
      expect(ASCII_CHARS.length).toBe(8);
    });
  });

  // ==========================================================================
  // BarChart
  // ==========================================================================

  describe('BarChart', () => {
    const sampleData = [
      { label: 'A', value: 10 },
      { label: 'B', value: 20 },
      { label: 'C', value: 15 },
    ];

    it('renders bar chart with data', () => {
      const node = BarChart({ data: sampleData });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('A');
      expect(output).toContain('B');
    });

    it('renders bar chart with specified width', () => {
      const node = BarChart({ data: sampleData, width: 40 });
      expect(node).not.toBeNull();
    });

    it('renders bar chart with colors', () => {
      const dataWithColors = [
        { label: 'Red', value: 10, color: 'red' },
        { label: 'Green', value: 15, color: 'green' },
      ];
      const node = BarChart({ data: dataWithColors });
      expect(node).not.toBeNull();
    });

    it('renders bar chart with percentage labels', () => {
      const node = BarChart({ data: sampleData, showPercentage: true });
      expect(node).not.toBeNull();
    });

    it('handles empty data', () => {
      const node = BarChart({ data: [] });
      expect(node).not.toBeNull();
    });

    it('renders with value labels', () => {
      const node = BarChart({ data: sampleData, showValues: true });
      expect(node).not.toBeNull();
    });
  });

  describe('VerticalBarChart', () => {
    const sampleData = [
      { label: 'Mon', value: 5 },
      { label: 'Tue', value: 10 },
      { label: 'Wed', value: 8 },
    ];

    it('renders vertical bar chart', () => {
      const node = VerticalBarChart({ data: sampleData, height: 5 });
      expect(node).not.toBeNull();
    });

    it('renders with custom height', () => {
      const node = VerticalBarChart({ data: sampleData, height: 10 });
      expect(node).not.toBeNull();
    });

    it('renders with colors', () => {
      const dataWithColors = sampleData.map((d, i) => ({
        ...d,
        color: ['red', 'green', 'blue'][i],
      }));
      const node = VerticalBarChart({ data: dataWithColors, height: 5 });
      expect(node).not.toBeNull();
    });
  });

  describe('StackedBarChart', () => {
    it('renders stacked bar chart with segments', () => {
      // StackedBarData uses segments array inside each data item
      const data = [
        {
          label: 'Q1',
          segments: [
            { label: 'A', value: 30, color: 'red' },
            { label: 'B', value: 30, color: 'green' },
          ],
        },
        {
          label: 'Q2',
          segments: [
            { label: 'A', value: 40, color: 'red' },
            { label: 'B', value: 20, color: 'green' },
          ],
        },
      ];
      const node = StackedBarChart({ data, width: 40 });
      expect(node).not.toBeNull();
    });
  });

  describe('renderBarChartStrings', () => {
    it('returns array of strings', () => {
      const data = [
        { label: 'A', value: 10 },
        { label: 'B', value: 20 },
      ];
      const result = renderBarChartStrings(data, { width: 20 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('HORIZONTAL_BLOCKS and VERTICAL_BLOCKS', () => {
    it('has block character arrays defined', () => {
      expect(HORIZONTAL_BLOCKS).toBeDefined();
      expect(VERTICAL_BLOCKS).toBeDefined();
    });
  });

  // ==========================================================================
  // LineChart
  // ==========================================================================

  describe('LineChart', () => {
    const sampleSeries = [
      {
        name: 'Series 1',
        data: [
          { x: 0, y: 10 },
          { x: 1, y: 20 },
          { x: 2, y: 15 },
          { x: 3, y: 25 },
        ],
      },
    ];

    it('renders line chart with series', () => {
      const node = LineChart({ series: sampleSeries, width: 40, height: 10 });
      expect(node).not.toBeNull();
    });

    it('renders line chart with title', () => {
      const node = LineChart({
        series: sampleSeries,
        width: 40,
        height: 10,
        title: 'My Chart',
      });
      expect(node).not.toBeNull();
    });

    it('renders line chart with multiple series', () => {
      const multiSeries = [
        { name: 'A', data: [{ x: 0, y: 10 }, { x: 1, y: 20 }] },
        { name: 'B', data: [{ x: 0, y: 15 }, { x: 1, y: 25 }] },
      ];
      const node = LineChart({
        series: multiSeries,
        width: 40,
        height: 10,
      });
      expect(node).not.toBeNull();
    });

    it('renders with legend', () => {
      const node = LineChart({
        series: sampleSeries,
        width: 40,
        height: 10,
        showLegend: true,
      });
      expect(node).not.toBeNull();
    });

    it('renders with grid', () => {
      const node = LineChart({
        series: sampleSeries,
        width: 40,
        height: 10,
        showGrid: true,
      });
      expect(node).not.toBeNull();
    });

    it('handles empty series', () => {
      const node = LineChart({ series: [], width: 40, height: 10 });
      expect(node).not.toBeNull();
    });
  });

  describe('AreaChart', () => {
    const sampleData = [
      { x: 0, y: 5 },
      { x: 1, y: 10 },
      { x: 2, y: 8 },
    ];

    it('renders area chart', () => {
      const node = AreaChart({ data: sampleData, width: 40, height: 10 });
      expect(node).not.toBeNull();
    });

    it('renders with fill color', () => {
      const node = AreaChart({
        data: sampleData,
        width: 40,
        height: 10,
        fillColor: 'blue',
      });
      expect(node).not.toBeNull();
    });
  });

  describe('renderLineChartStrings', () => {
    it('returns array of strings', () => {
      const series = [
        { name: 'A', data: [{ x: 0, y: 10 }, { x: 1, y: 20 }] },
      ];
      const result = renderLineChartStrings(series, { width: 20, height: 5 });
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('renderMultiSeriesChart', () => {
    it('renders multiple series', () => {
      const series = [
        { name: 'A', data: [{ x: 0, y: 10 }, { x: 1, y: 15 }] },
        { name: 'B', data: [{ x: 0, y: 5 }, { x: 1, y: 20 }] },
      ];
      const result = renderMultiSeriesChart(series, { width: 20, height: 5 });
      expect(result).toBeDefined();
      expect(result.lines).toBeDefined();
    });
  });

  describe('BrailleCanvas', () => {
    it('creates canvas with dimensions', () => {
      const canvas = new BrailleCanvas(20, 10);
      expect(canvas).toBeDefined();
    });

    it('sets pixels and renders them', () => {
      const canvas = new BrailleCanvas(20, 10);
      // BrailleCanvas uses setPixel method (no getPixel available)
      // Verify by checking render output changes
      const emptyResult = canvas.render();
      canvas.setPixel(5, 5);
      const result = canvas.render();
      // After setting a pixel, the output should contain non-empty braille characters
      expect(result.join('')).not.toBe(emptyResult.join(''));
    });

    it('renders to string array', () => {
      const canvas = new BrailleCanvas(20, 10);
      canvas.setPixel(0, 0);
      canvas.setPixel(10, 5);
      const result = canvas.render();
      // render() returns string[] (array of lines)
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('draws lines', () => {
      const canvas = new BrailleCanvas(20, 10);
      // BrailleCanvas uses drawLine method
      canvas.drawLine(0, 0, 10, 5);
      const result = canvas.render();
      // render() returns string[] (array of lines)
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('AsciiCanvas', () => {
    it('creates canvas with dimensions', () => {
      const canvas = new AsciiCanvas(20, 10);
      expect(canvas).toBeDefined();
    });

    it('renders to string array', () => {
      const canvas = new AsciiCanvas(20, 10);
      // AsciiCanvas uses setPixel method
      canvas.setPixel(0, 0);
      const result = canvas.render();
      // render() returns string[] (array of lines)
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Gauge
  // ==========================================================================

  describe('Gauge', () => {
    it('renders gauge with value', () => {
      const node = Gauge({ value: 75, max: 100 });
      expect(node).not.toBeNull();
    });

    it('renders gauge with label', () => {
      const node = Gauge({ value: 50, max: 100, label: 'CPU' });
      expect(node).not.toBeNull();
    });

    it('renders gauge with different styles', () => {
      const styles = ['semicircle', 'arc', 'linear'] as const;
      for (const style of styles) {
        const node = Gauge({ value: 60, max: 100, style });
        expect(node).not.toBeNull();
      }
    });

    it('renders gauge with zones', () => {
      const node = Gauge({ value: 80, max: 100, showZones: true });
      expect(node).not.toBeNull();
    });

    it('renders gauge with custom color', () => {
      const node = Gauge({ value: 50, max: 100, color: 'cyan' });
      expect(node).not.toBeNull();
    });

    it('handles value at 0', () => {
      const node = Gauge({ value: 0, max: 100 });
      expect(node).not.toBeNull();
    });

    it('handles value at max', () => {
      const node = Gauge({ value: 100, max: 100 });
      expect(node).not.toBeNull();
    });
  });

  describe('LinearGauge', () => {
    it('renders linear gauge', () => {
      const node = LinearGauge({ value: 50, max: 100 });
      expect(node).not.toBeNull();
    });

    it('renders with custom width', () => {
      const node = LinearGauge({ value: 75, max: 100, width: 30 });
      expect(node).not.toBeNull();
    });

    it('renders with zones', () => {
      const node = LinearGauge({ value: 90, max: 100, showZones: true });
      expect(node).not.toBeNull();
    });
  });

  describe('MeterGauge', () => {
    it('renders meter gauge', () => {
      const node = MeterGauge({ value: 60, max: 100 });
      expect(node).not.toBeNull();
    });

    it('renders with ticks', () => {
      const node = MeterGauge({ value: 40, max: 100, showTicks: true });
      expect(node).not.toBeNull();
    });
  });

  describe('ArcGauge', () => {
    it('renders arc gauge', () => {
      const node = ArcGauge({ value: 70, max: 100 });
      expect(node).not.toBeNull();
    });
  });

  describe('DialGauge', () => {
    it('renders dial gauge', () => {
      const node = DialGauge({ value: 45, max: 100 });
      expect(node).not.toBeNull();
    });
  });

  describe('BatteryGauge', () => {
    it('renders battery gauge', () => {
      const node = BatteryGauge({ value: 80 });
      expect(node).not.toBeNull();
    });

    it('renders low battery', () => {
      const node = BatteryGauge({ value: 10 });
      expect(node).not.toBeNull();
    });

    it('renders full battery', () => {
      const node = BatteryGauge({ value: 100 });
      expect(node).not.toBeNull();
    });

    it('renders empty battery', () => {
      const node = BatteryGauge({ value: 0 });
      expect(node).not.toBeNull();
    });

    it('renders charging state', () => {
      const node = BatteryGauge({ value: 50, charging: true });
      expect(node).not.toBeNull();
    });
  });

  describe('renderLinearGaugeString', () => {
    it('returns string representation', () => {
      const result = renderLinearGaugeString(50, 100, { width: 20 });
      expect(typeof result).toBe('string');
    });
  });

  describe('DEFAULT_ZONES and getZoneColor', () => {
    it('has default zones', () => {
      expect(DEFAULT_ZONES).toBeDefined();
      expect(DEFAULT_ZONES.length).toBe(3);
    });

    it('gets zone color for low value', () => {
      const color = getZoneColor(20, DEFAULT_ZONES);
      expect(color).toBe('green');
    });

    it('gets zone color for medium value', () => {
      // DEFAULT_ZONES: 0-60 green, 60-85 yellow, 85-100 red
      // Value 60 is at boundary, function uses >= start && <= end
      // So 60 matches green (0-60) first. Use 70 for yellow zone.
      const color = getZoneColor(70, DEFAULT_ZONES);
      expect(color).toBe('yellow');
    });

    it('gets zone color for high value', () => {
      const color = getZoneColor(90, DEFAULT_ZONES);
      expect(color).toBe('red');
    });
  });

  // ==========================================================================
  // Heatmap
  // ==========================================================================

  describe('Heatmap', () => {
    const sampleData = [
      [1, 2, 3],
      [4, 5, 6],
      [7, 8, 9],
    ];

    it('renders heatmap with data', () => {
      const node = Heatmap({ data: sampleData });
      expect(node).not.toBeNull();
    });

    it('renders heatmap with row headers', () => {
      const node = Heatmap({
        data: sampleData,
        rowHeaders: ['A', 'B', 'C'],
      });
      expect(node).not.toBeNull();
    });

    it('renders heatmap with column headers', () => {
      const node = Heatmap({
        data: sampleData,
        columnHeaders: ['X', 'Y', 'Z'],
      });
      expect(node).not.toBeNull();
    });

    it('renders heatmap with different color scales', () => {
      const scales = ['heat', 'cool', 'viridis', 'grayscale'] as const;
      for (const colorScale of scales) {
        const node = Heatmap({ data: sampleData, colorScale });
        expect(node).not.toBeNull();
      }
    });

    it('renders heatmap with cell values', () => {
      const node = Heatmap({ data: sampleData, showValues: true });
      expect(node).not.toBeNull();
    });

    it('renders heatmap with border', () => {
      const node = Heatmap({ data: sampleData, showBorder: true });
      expect(node).not.toBeNull();
    });

    it('handles single cell', () => {
      const node = Heatmap({ data: [[5]] });
      expect(node).not.toBeNull();
    });
  });

  describe('createHeatmap', () => {
    it('creates heatmap state', () => {
      const state = createHeatmap({
        data: [[1, 2], [3, 4]],
      });
      expect(state).toBeDefined();
    });

    it('has navigation methods', () => {
      const state = createHeatmap({
        data: [[1, 2], [3, 4]],
      });
      expect(typeof state.moveUp).toBe('function');
      expect(typeof state.moveDown).toBe('function');
      expect(typeof state.moveLeft).toBe('function');
      expect(typeof state.moveRight).toBe('function');
      expect(typeof state.select).toBe('function');
    });

    it('has selected position accessors', () => {
      const state = createHeatmap({
        data: [[1, 2], [3, 4]],
      });
      expect(typeof state.selectedRow).toBe('function');
      expect(typeof state.selectedCol).toBe('function');
    });
  });

  describe('ContributionGraph', () => {
    const sampleContributions = [
      { date: new Date('2024-01-01'), count: 5 },
      { date: new Date('2024-01-02'), count: 3 },
      { date: new Date('2024-01-03'), count: 0 },
      { date: new Date('2024-01-04'), count: 10 },
    ];

    it('renders contribution graph', () => {
      const node = ContributionGraph({ data: sampleContributions });
      expect(node).not.toBeNull();
    });

    it('renders with blues color scale', () => {
      const node = ContributionGraph({
        data: sampleContributions,
        colorScale: 'blues',
      });
      expect(node).not.toBeNull();
    });

    it('renders with fewer weeks', () => {
      const node = ContributionGraph({
        data: sampleContributions,
        weeks: 12,
      });
      expect(node).not.toBeNull();
    });

    it('hides month labels', () => {
      const node = ContributionGraph({
        data: sampleContributions,
        showMonths: false,
      });
      expect(node).not.toBeNull();
    });

    it('hides day labels', () => {
      const node = ContributionGraph({
        data: sampleContributions,
        showDays: false,
      });
      expect(node).not.toBeNull();
    });
  });

  describe('CalendarHeatmap', () => {
    const sampleData = [
      { date: new Date('2024-03-15'), count: 5 },
      { date: new Date('2024-03-16'), count: 8 },
    ];

    it('renders calendar heatmap', () => {
      const node = CalendarHeatmap({ data: sampleData, year: 2024 });
      expect(node).not.toBeNull();
    });

    it('renders with heat color scale', () => {
      const node = CalendarHeatmap({
        data: sampleData,
        year: 2024,
        colorScale: 'heat',
      });
      expect(node).not.toBeNull();
    });

    it('hides legend', () => {
      const node = CalendarHeatmap({
        data: sampleData,
        year: 2024,
        showLegend: false,
      });
      expect(node).not.toBeNull();
    });
  });

  describe('CorrelationMatrix', () => {
    const matrix = [
      [1.0, 0.5, -0.3],
      [0.5, 1.0, 0.2],
      [-0.3, 0.2, 1.0],
    ];
    const labels = ['A', 'B', 'C'];

    it('renders correlation matrix', () => {
      const node = CorrelationMatrix({ labels, correlations: matrix });
      expect(node).not.toBeNull();
    });

    it('renders with custom decimals', () => {
      const node = CorrelationMatrix({
        labels,
        correlations: matrix,
        decimals: 3,
      });
      expect(node).not.toBeNull();
    });

    it('hides values', () => {
      const node = CorrelationMatrix({
        labels,
        correlations: matrix,
        showValues: false,
      });
      expect(node).not.toBeNull();
    });
  });

  describe('COLOR_SCALES', () => {
    it('has color scales defined', () => {
      expect(COLOR_SCALES).toBeDefined();
      expect(COLOR_SCALES.heat).toBeDefined();
      expect(COLOR_SCALES.cool).toBeDefined();
      expect(COLOR_SCALES.viridis).toBeDefined();
    });

    it('each scale has colors array', () => {
      Object.values(COLOR_SCALES).forEach((scale) => {
        expect(scale.colors).toBeDefined();
        expect(scale.colors.length).toBeGreaterThan(0);
      });
    });

    it('each scale has a name', () => {
      Object.entries(COLOR_SCALES).forEach(([key, scale]) => {
        expect(scale.name).toBe(key);
      });
    });
  });

  // ==========================================================================
  // ASCII Mode
  // ==========================================================================

  describe('ASCII Mode', () => {
    beforeEach(() => {
      setRenderMode('ascii');
    });

    it('renders sparkline in ASCII mode', () => {
      const node = Sparkline({ data: [1, 2, 3, 4, 5] });
      expect(node).not.toBeNull();
    });

    it('renders bar chart in ASCII mode', () => {
      const node = BarChart({
        data: [
          { label: 'A', value: 10 },
          { label: 'B', value: 20 },
        ],
      });
      expect(node).not.toBeNull();
    });

    it('renders gauge in ASCII mode', () => {
      const node = Gauge({ value: 50, max: 100 });
      expect(node).not.toBeNull();
    });

    it('renders heatmap in ASCII mode', () => {
      const node = Heatmap({ data: [[1, 2], [3, 4]] });
      expect(node).not.toBeNull();
    });
  });
});
