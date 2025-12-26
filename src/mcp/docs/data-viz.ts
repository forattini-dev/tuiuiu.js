/**
 * Data Visualization Documentation
 *
 * Terminal-based charts and graphs for dashboards and monitoring.
 */

import type { ComponentDoc } from '../types.js';

export const dataViz: ComponentDoc[] = [
  // =============================================================================
  // Line & Area Charts
  // =============================================================================
  {
    name: 'LineChart',
    category: 'molecules',
    description: 'Multi-series line chart with axes, legend, and grid support. Uses braille characters for high resolution or ASCII for compatibility.',
    props: [
      { name: 'series', type: 'DataSeries[]', required: true, description: 'Data series to display. Each series has name, data, color, and style' },
      { name: 'width', type: 'number', required: false, default: '60', description: 'Chart width in characters' },
      { name: 'height', type: 'number', required: false, default: '15', description: 'Chart height in rows' },
      { name: 'xAxis', type: 'AxisOptions', required: false, description: 'X-axis options: show, label, min, max, ticks, formatter' },
      { name: 'yAxis', type: 'AxisOptions', required: false, description: 'Y-axis options: show, label, min, max, ticks, formatter' },
      { name: 'showLegend', type: 'boolean', required: false, description: 'Show legend (default: true if multiple series)' },
      { name: 'legendPosition', type: "'top' | 'bottom' | 'right'", required: false, default: "'bottom'", description: 'Legend position' },
      { name: 'showGrid', type: 'boolean', required: false, default: 'false', description: 'Show grid lines' },
      { name: 'gridColor', type: 'ColorValue', required: false, description: 'Grid color' },
      { name: 'title', type: 'string', required: false, description: 'Chart title' },
      { name: 'titleColor', type: 'ColorValue', required: false, description: 'Title color' },
      { name: 'borderStyle', type: "'none' | 'single' | 'double'", required: false, default: "'none'", description: 'Border style' },
    ],
    examples: [
      `// Simple line chart
LineChart({
  series: [
    { name: 'Sales', data: [10, 25, 30, 45, 60, 55, 70], color: 'cyan' },
  ],
  width: 50,
  height: 10,
})`,
      `// Multi-series with custom axes
LineChart({
  series: [
    { name: 'CPU', data: cpuHistory, color: 'green' },
    { name: 'Memory', data: memHistory, color: 'yellow' },
  ],
  yAxis: { min: 0, max: 100, label: '%' },
  showLegend: true,
})`,
    ],
  },
  {
    name: 'AreaChart',
    category: 'molecules',
    description: 'Filled area chart for single data series. Wrapper around LineChart with simplified API.',
    props: [
      { name: 'data', type: 'DataPoint[] | number[]', required: true, description: 'Data points or array of y-values' },
      { name: 'color', type: 'ColorValue', required: false, default: "'cyan'", description: 'Area fill color' },
      { name: 'name', type: 'string', required: false, default: "'Data'", description: 'Series name' },
      { name: 'width', type: 'number', required: false, default: '60', description: 'Chart width in characters' },
      { name: 'height', type: 'number', required: false, default: '15', description: 'Chart height in rows' },
      { name: 'xAxis', type: 'AxisOptions', required: false, description: 'X-axis options' },
      { name: 'yAxis', type: 'AxisOptions', required: false, description: 'Y-axis options' },
      { name: 'title', type: 'string', required: false, description: 'Chart title' },
    ],
    examples: [
      `AreaChart({
  data: [10, 25, 30, 45, 60, 55, 70],
  color: 'cyan',
  width: 50,
  height: 10,
})`,
    ],
  },
  {
    name: 'Sparkline',
    category: 'molecules',
    description: 'Inline mini chart for data trends. Compact visualization for dashboards.',
    props: [
      { name: 'data', type: 'number[]', required: true, description: 'Data points' },
      { name: 'width', type: 'number', required: false, description: 'Chart width' },
      { name: 'height', type: 'number', required: false, default: '1', description: 'Chart height in rows' },
      { name: 'color', type: 'ColorValue', required: false, description: 'Line color' },
    ],
    examples: [
      `Sparkline({ data: [1, 5, 3, 9, 2, 7], width: 20 })`,
    ],
  },

  // =============================================================================
  // Bar Charts
  // =============================================================================
  {
    name: 'BarChart',
    category: 'molecules',
    description: 'Horizontal bar chart with partial block characters for precision. Supports colors per bar.',
    props: [
      { name: 'data', type: 'BarData[]', required: true, description: 'Array of { label, value, color? }' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Bar orientation (vertical dispatches to VerticalBarChart)' },
      { name: 'maxBarLength', type: 'number', required: false, default: '40', description: 'Maximum bar length in characters' },
      { name: 'width', type: 'number', required: false, description: 'Total chart width (overrides maxBarLength if set)' },
      { name: 'height', type: 'number', required: false, description: 'Chart height (for vertical orientation)' },
      { name: 'showValues', type: 'boolean', required: false, default: 'true', description: 'Show value labels' },
      { name: 'showPercentage', type: 'boolean', required: false, default: 'false', description: 'Show percentage instead of raw values' },
      { name: 'barColor', type: 'ColorValue', required: false, default: "'primary'", description: 'Default bar color' },
      { name: 'labelColor', type: 'ColorValue', required: false, description: 'Label color' },
      { name: 'valueColor', type: 'ColorValue', required: false, description: 'Value color' },
      { name: 'min', type: 'number', required: false, description: 'Minimum value (auto-detected if not set)' },
      { name: 'max', type: 'number', required: false, description: 'Maximum value (auto-detected if not set)' },
      { name: 'gap', type: 'number', required: false, default: '0', description: 'Gap between bars' },
      { name: 'labelWidth', type: 'number', required: false, description: 'Label width (auto-sized if not set)' },
      { name: 'showBackground', type: 'boolean', required: false, default: 'false', description: 'Show bar background' },
    ],
    examples: [
      `BarChart({
  data: [
    { label: 'React', value: 85 },
    { label: 'Vue', value: 72 },
    { label: 'Angular', value: 45 },
  ],
})`,
      `BarChart({
  data: [
    { label: 'CPU', value: 75, color: 'green' },
    { label: 'Memory', value: 92, color: 'red' },
    { label: 'Disk', value: 45, color: 'blue' },
  ],
  showPercentage: true,
})`,
    ],
  },
  {
    name: 'VerticalBarChart',
    category: 'molecules',
    description: 'Vertical bar chart with block characters. Great for time series like weekly data.',
    props: [
      { name: 'data', type: 'BarData[]', required: true, description: 'Array of { label, value, color? }' },
      { name: 'width', type: 'number', required: false, description: 'Total chart width' },
      { name: 'height', type: 'number', required: false, default: '10', description: 'Chart height in rows' },
      { name: 'showValues', type: 'boolean', required: false, default: 'true', description: 'Show values above bars' },
      { name: 'barColor', type: 'ColorValue', required: false, default: "'primary'", description: 'Default bar color' },
      { name: 'labelColor', type: 'ColorValue', required: false, description: 'Label color' },
      { name: 'valueColor', type: 'ColorValue', required: false, description: 'Value color' },
      { name: 'min', type: 'number', required: false, description: 'Minimum value' },
      { name: 'max', type: 'number', required: false, description: 'Maximum value' },
      { name: 'gap', type: 'number', required: false, default: '1', description: 'Gap between bars' },
    ],
    examples: [
      `VerticalBarChart({
  data: [
    { label: 'Mon', value: 5 },
    { label: 'Tue', value: 8 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 10 },
    { label: 'Fri', value: 7 },
  ],
  height: 8,
})`,
    ],
  },
  {
    name: 'StackedBarChart',
    category: 'molecules',
    description: 'Horizontal stacked bar chart for comparing composition across categories.',
    props: [
      { name: 'data', type: 'StackedBarData[]', required: true, description: 'Array of { label, segments: [{ value, color?, label? }] }' },
      { name: 'maxBarLength', type: 'number', required: false, default: '40', description: 'Maximum bar length in characters' },
      { name: 'colors', type: 'ColorValue[]', required: false, description: 'Default colors for segments (cycles through)' },
      { name: 'showTotal', type: 'boolean', required: false, default: 'true', description: 'Show total values' },
      { name: 'labelColor', type: 'ColorValue', required: false, description: 'Label color' },
      { name: 'labelWidth', type: 'number', required: false, description: 'Label width' },
    ],
    examples: [
      `StackedBarChart({
  data: [
    {
      label: 'Q1',
      segments: [
        { value: 30, color: 'blue' },
        { value: 45, color: 'green' },
        { value: 25, color: 'yellow' },
      ],
    },
    {
      label: 'Q2',
      segments: [
        { value: 40, color: 'blue' },
        { value: 35, color: 'green' },
        { value: 30, color: 'yellow' },
      ],
    },
  ],
})`,
    ],
  },

  // =============================================================================
  // Gauges
  // =============================================================================
  {
    name: 'Gauge',
    category: 'molecules',
    description: 'Gauge/meter display for single values. Dispatches to specific gauge styles: linear, meter, arc, or dial.',
    props: [
      { name: 'value', type: 'number', required: true, description: 'Current value' },
      { name: 'min', type: 'number', required: false, default: '0', description: 'Minimum value' },
      { name: 'max', type: 'number', required: false, default: '100', description: 'Maximum value' },
      { name: 'style', type: "'linear' | 'arc' | 'meter' | 'dial'", required: false, default: "'linear'", description: 'Gauge style' },
      { name: 'width', type: 'number', required: false, default: '30', description: 'Gauge width' },
      { name: 'height', type: 'number', required: false, description: 'Height (for vertical or arc gauges)' },
      { name: 'showValue', type: 'boolean', required: false, default: 'true', description: 'Show numeric value' },
      { name: 'formatValue', type: '(value: number) => string', required: false, description: 'Value formatter' },
      { name: 'valuePosition', type: "'left' | 'right' | 'center' | 'inside' | 'below'", required: false, default: "'right'", description: 'Value position' },
      { name: 'showMinMax', type: 'boolean', required: false, default: 'false', description: 'Show min/max labels' },
      { name: 'color', type: 'ColorValue', required: false, default: "'primary'", description: 'Filled color' },
      { name: 'backgroundColor', type: 'ColorValue', required: false, description: 'Background color' },
      { name: 'zones', type: 'GaugeZone[] | boolean', required: false, description: 'Color zones (pass true for defaults: 0-60 green, 60-85 yellow, 85-100 red)' },
      { name: 'label', type: 'string', required: false, description: 'Label' },
      { name: 'labelColor', type: 'ColorValue', required: false, description: 'Label color' },
    ],
    examples: [
      `// Linear gauge
Gauge({ value: 75, style: 'linear' })`,
      `// Meter gauge with zones
Gauge({
  value: 85,
  style: 'meter',
  zones: true,  // Uses default zones
})`,
      `// Arc gauge
Gauge({ value: 50, style: 'arc', label: 'Progress' })`,
    ],
  },
  {
    name: 'MeterGauge',
    category: 'molecules',
    description: 'Segmented gauge display with configurable segments. Great for discrete levels.',
    props: [
      { name: 'value', type: 'number', required: true, description: 'Current value' },
      { name: 'min', type: 'number', required: false, default: '0', description: 'Minimum value' },
      { name: 'max', type: 'number', required: false, default: '100', description: 'Maximum value' },
      { name: 'segments', type: 'number', required: false, default: '10', description: 'Number of segments' },
      { name: 'segmentChar', type: 'string', required: false, description: 'Character for filled segments (default: ●)' },
      { name: 'emptyChar', type: 'string', required: false, description: 'Character for empty segments (default: ○)' },
      { name: 'showValue', type: 'boolean', required: false, default: 'true', description: 'Show numeric value' },
      { name: 'formatValue', type: '(value: number) => string', required: false, description: 'Value formatter' },
      { name: 'color', type: 'ColorValue', required: false, default: "'primary'", description: 'Filled color' },
      { name: 'zones', type: 'GaugeZone[] | boolean', required: false, description: 'Color zones for segments' },
      { name: 'label', type: 'string', required: false, description: 'Label' },
    ],
    examples: [
      `MeterGauge({
  value: 7,
  min: 0,
  max: 10,
  segments: 10,
  color: 'green',
})`,
    ],
  },
  {
    name: 'ArcGauge',
    category: 'molecules',
    description: 'Semicircle arc gauge with pointer. Visual representation of progress.',
    props: [
      { name: 'value', type: 'number', required: true, description: 'Current value' },
      { name: 'min', type: 'number', required: false, default: '0', description: 'Minimum value' },
      { name: 'max', type: 'number', required: false, default: '100', description: 'Maximum value' },
      { name: 'width', type: 'number', required: false, default: '15', description: 'Arc width' },
      { name: 'showValue', type: 'boolean', required: false, default: 'true', description: 'Show numeric value' },
      { name: 'formatValue', type: '(value: number) => string', required: false, description: 'Value formatter' },
      { name: 'color', type: 'ColorValue', required: false, default: "'primary'", description: 'Arc color' },
      { name: 'zones', type: 'GaugeZone[] | boolean', required: false, description: 'Color zones' },
      { name: 'label', type: 'string', required: false, description: 'Label' },
    ],
    examples: [
      `ArcGauge({
  value: 65,
  showValue: true,
  color: 'cyan',
})`,
    ],
  },
  {
    name: 'DialGauge',
    category: 'molecules',
    description: 'Dial gauge with colored segments and pointer. Shows value within colored zones.',
    props: [
      { name: 'value', type: 'number', required: true, description: 'Current value' },
      { name: 'min', type: 'number', required: false, default: '0', description: 'Minimum value' },
      { name: 'max', type: 'number', required: false, default: '100', description: 'Maximum value' },
      { name: 'width', type: 'number', required: false, default: '11', description: 'Dial width' },
      { name: 'showValue', type: 'boolean', required: false, default: 'true', description: 'Show numeric value' },
      { name: 'showMinMax', type: 'boolean', required: false, default: 'true', description: 'Show min/max labels' },
      { name: 'color', type: 'ColorValue', required: false, default: "'primary'", description: 'Pointer color' },
      { name: 'zones', type: 'GaugeZone[]', required: false, description: 'Color zones (defaults to green/yellow/red)' },
      { name: 'label', type: 'string', required: false, description: 'Label' },
    ],
    examples: [
      `DialGauge({
  value: 75,
  zones: [
    { start: 0, end: 50, color: 'green' },
    { start: 50, end: 80, color: 'yellow' },
    { start: 80, end: 100, color: 'red' },
  ],
})`,
    ],
  },
  {
    name: 'BatteryGauge',
    category: 'molecules',
    description: 'Battery-style indicator with automatic color based on level. Shows charging state.',
    props: [
      { name: 'level', type: 'number', required: true, description: 'Charge level (0-100)' },
      { name: 'showLevel', type: 'boolean', required: false, default: 'true', description: 'Show percentage' },
      { name: 'charging', type: 'boolean', required: false, default: 'false', description: 'Is charging (shows ⚡)' },
      { name: 'width', type: 'number', required: false, default: '10', description: 'Battery width' },
    ],
    examples: [
      `BatteryGauge({ level: 75, charging: true })`,
      `BatteryGauge({ level: 15 })  // Auto-red at low level`,
    ],
  },

  // =============================================================================
  // Heatmaps
  // =============================================================================
  {
    name: 'Heatmap',
    category: 'molecules',
    description: '2D grid-based heatmap visualization with customizable color scales.',
    props: [
      { name: 'data', type: 'HeatmapData', required: true, description: '2D array of numbers or { value, label?, tooltip? }' },
      { name: 'columnHeaders', type: 'string[]', required: false, description: 'Column headers' },
      { name: 'rowHeaders', type: 'string[]', required: false, description: 'Row headers' },
      { name: 'minValue', type: 'number', required: false, description: 'Min value (auto-detected if not specified)' },
      { name: 'maxValue', type: 'number', required: false, description: 'Max value (auto-detected if not specified)' },
      { name: 'colorScale', type: "ColorScale | 'heat' | 'cool' | 'viridis' | 'grayscale'", required: false, default: "'heat'", description: 'Color scale' },
      { name: 'cellWidth', type: 'number', required: false, default: '3', description: 'Cell width in characters' },
      { name: 'showValues', type: 'boolean', required: false, default: 'false', description: 'Show values in cells' },
      { name: 'formatValue', type: '(value: number) => string', required: false, description: 'Value format function' },
      { name: 'showBorder', type: 'boolean', required: false, default: 'false', description: 'Show border between cells' },
      { name: 'borderColor', type: 'ColorValue', required: false, description: 'Border color' },
      { name: 'interactive', type: 'boolean', required: false, default: 'false', description: 'Enable keyboard navigation' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Is active for input' },
      { name: 'onSelect', type: '(row: number, col: number, value: number) => void', required: false, description: 'Selection callback' },
    ],
    examples: [
      `Heatmap({
  data: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ],
  colorScale: 'heat',
})`,
      `Heatmap({
  data: weeklyData,
  columnHeaders: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  rowHeaders: ['Week 1', 'Week 2', 'Week 3'],
  showValues: true,
})`,
    ],
  },
  {
    name: 'ContributionGraph',
    category: 'molecules',
    description: 'GitHub-style contribution heatmap. Shows activity over time in a calendar view.',
    props: [
      { name: 'data', type: 'ContributionData[]', required: true, description: 'Array of { date, count }' },
      { name: 'weeks', type: 'number', required: false, default: '52', description: 'Number of weeks to show' },
      { name: 'startDate', type: 'Date | string', required: false, description: 'Custom start date (overrides weeks)' },
      { name: 'endDate', type: 'Date | string', required: false, description: 'Custom end date (overrides weeks)' },
      { name: 'colorScale', type: "'greens' | 'blues' | 'reds' | 'purples' | 'oranges' | ColorScale", required: false, default: "'greens'", description: 'Color scale' },
      { name: 'showMonths', type: 'boolean', required: false, default: 'true', description: 'Show month labels' },
      { name: 'showDays', type: 'boolean', required: false, default: 'true', description: 'Show day labels (Mon, Wed, Fri)' },
      { name: 'formatValue', type: '(count: number) => string', required: false, description: 'Value formatter for tooltips' },
    ],
    examples: [
      `ContributionGraph({
  data: contributions,
  weeks: 52,
  showMonths: true,
  colorScale: 'greens',
})`,
    ],
  },
  {
    name: 'CalendarHeatmap',
    category: 'molecules',
    description: 'Full year calendar view heatmap organized by month. Shows 12 months in a grid.',
    props: [
      { name: 'data', type: 'ContributionData[]', required: true, description: 'Array of { date, count }' },
      { name: 'year', type: 'number', required: false, description: 'Year to display (default: current year)' },
      { name: 'colorScale', type: "ColorScale | 'heat' | 'greens'", required: false, default: "'greens'", description: 'Color scale' },
      { name: 'showLegend', type: 'boolean', required: false, default: 'true', description: 'Show legend' },
    ],
    examples: [
      `CalendarHeatmap({
  data: yearlyData,
  year: 2024,
  colorScale: 'greens',
})`,
    ],
  },
  {
    name: 'CorrelationMatrix',
    category: 'molecules',
    description: 'Statistical correlation heatmap for displaying correlation coefficients (-1 to +1).',
    props: [
      { name: 'labels', type: 'string[]', required: true, description: 'Labels for variables' },
      { name: 'correlations', type: 'number[][]', required: true, description: 'Correlation matrix data' },
      { name: 'showValues', type: 'boolean', required: false, default: 'true', description: 'Show correlation values' },
      { name: 'decimals', type: 'number', required: false, default: '2', description: 'Decimal places for values' },
    ],
    examples: [
      `CorrelationMatrix({
  labels: ['A', 'B', 'C'],
  correlations: [
    [1.0, 0.8, -0.3],
    [0.8, 1.0, 0.5],
    [-0.3, 0.5, 1.0],
  ],
})`,
    ],
  },
  {
    name: 'TimeHeatmap',
    category: 'molecules',
    description: 'Calendar-based heatmap for activity visualization over time. Supports day/week/month granularity.',
    props: [
      { name: 'data', type: 'TimeHeatmapData[]', required: true, description: 'Array of { date, value }' },
      { name: 'granularity', type: "'day' | 'week' | 'month'", required: false, default: "'day'", description: 'Granularity level' },
      { name: 'startDate', type: 'Date | string', required: false, description: 'Start date (default: 1 year ago)' },
      { name: 'endDate', type: 'Date | string', required: false, description: 'End date (default: today)' },
      { name: 'colorScale', type: "ColorValue[] | 'greens' | 'blues' | 'reds' | 'heat'", required: false, default: "'greens'", description: 'Color scale' },
      { name: 'showLegend', type: 'boolean', required: false, default: 'true', description: 'Show legend' },
      { name: 'title', type: 'string', required: false, description: 'Chart title' },
    ],
    examples: [
      `TimeHeatmap({
  data: [
    { date: '2024-01-01', value: 5 },
    { date: '2024-01-02', value: 10 },
  ],
  granularity: 'day',
  colorScale: 'greens',
})`,
    ],
  },

  // =============================================================================
  // Specialized Charts
  // =============================================================================
  {
    name: 'ScatterPlot',
    category: 'molecules',
    description: 'Two-dimensional scatter plot for correlation analysis. Supports color by value or category.',
    props: [
      { name: 'points', type: 'ScatterPoint[]', required: true, description: 'Data points { x, y, value?, category?, size?, label? }' },
      { name: 'width', type: 'number', required: false, default: '60', description: 'Chart width in characters' },
      { name: 'height', type: 'number', required: false, default: '15', description: 'Chart height in rows' },
      { name: 'xAxis', type: 'AxisOptions', required: false, description: 'X-axis options' },
      { name: 'yAxis', type: 'AxisOptions', required: false, description: 'Y-axis options' },
      { name: 'markerStyle', type: "'circle' | 'square' | 'diamond' | 'plus' | 'star' | 'cross'", required: false, default: "'circle'", description: 'Marker style' },
      { name: 'colorMode', type: "'value' | 'category' | 'uniform'", required: false, default: "'uniform'", description: 'How to color points' },
      { name: 'color', type: 'ColorValue', required: false, default: "'cyan'", description: 'Color for uniform mode' },
      { name: 'colorScale', type: 'ColorValue[]', required: false, description: 'Color scale for value mode' },
      { name: 'title', type: 'string', required: false, description: 'Chart title' },
      { name: 'showLegend', type: 'boolean', required: false, default: 'false', description: 'Show legend' },
      { name: 'onPointClick', type: '(point: ScatterPoint, index: number) => void', required: false, description: 'Point click handler' },
    ],
    examples: [
      `ScatterPlot({
  points: [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
  ],
  width: 50,
  height: 15,
})`,
      `ScatterPlot({
  points: dataWithValues,
  colorMode: 'value',
  colorScale: ['blue', 'cyan', 'green', 'yellow', 'red'],
})`,
    ],
  },
  {
    name: 'RadarChart',
    category: 'molecules',
    description: 'Multi-dimensional radar (spider) chart for comparing 3-8 dimensions across multiple series.',
    props: [
      { name: 'axes', type: 'RadarAxis[]', required: true, description: 'Axis definitions { name, min?, max?, formatter? }' },
      { name: 'series', type: 'RadarSeries[]', required: true, description: 'Data series { name, values, color? }' },
      { name: 'size', type: 'number', required: false, default: '20', description: 'Chart size' },
      { name: 'showLegend', type: 'boolean', required: false, default: 'true', description: 'Show legend' },
      { name: 'title', type: 'string', required: false, description: 'Chart title' },
    ],
    examples: [
      `RadarChart({
  axes: [
    { name: 'Speed', max: 100 },
    { name: 'Power', max: 100 },
    { name: 'Range', max: 100 },
    { name: 'Efficiency', max: 100 },
    { name: 'Durability', max: 100 },
  ],
  series: [
    { name: 'Model A', values: [80, 75, 70, 85, 80], color: 'cyan' },
    { name: 'Model B', values: [70, 85, 80, 75, 90], color: 'green' },
  ],
  size: 20,
})`,
    ],
  },
  {
    name: 'GanttChart',
    category: 'molecules',
    description: 'Project timeline visualization with tasks, progress, and status indicators.',
    props: [
      { name: 'tasks', type: 'GanttTask[]', required: true, description: 'Array of tasks { id, name, startDate, endDate, progress?, status?, isMilestone?, dependsOn? }' },
      { name: 'width', type: 'number', required: false, default: '80', description: 'Chart width' },
      { name: 'title', type: 'string', required: false, description: 'Chart title' },
      { name: 'showLegend', type: 'boolean', required: false, default: 'true', description: 'Show status legend' },
    ],
    examples: [
      `GanttChart({
  tasks: [
    {
      id: '1',
      name: 'Design',
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      progress: 100,
      status: 'complete',
    },
    {
      id: '2',
      name: 'Development',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      progress: 60,
      status: 'in-progress',
    },
    {
      id: '3',
      name: 'Release',
      startDate: '2024-02-15',
      endDate: '2024-02-15',
      isMilestone: true,
    },
  ],
})`,
    ],
  },

  // =============================================================================
  // Legend & Utilities
  // =============================================================================
  {
    name: 'Legend',
    category: 'molecules',
    description: 'Reusable legend component for charts. Supports interactive toggling of series visibility.',
    props: [
      { name: 'items', type: 'LegendItem[]', required: true, description: 'Array of { label, color?, symbol?, visible?, metadata? }' },
      { name: 'position', type: "'top' | 'bottom' | 'right' | 'left'", required: false, default: "'bottom'", description: 'Legend position' },
      { name: 'showSymbols', type: 'boolean', required: false, default: 'true', description: 'Show legend indicator symbols' },
      { name: 'symbolType', type: "'circle' | 'square' | 'line'", required: false, default: "'circle'", description: 'Symbol type' },
      { name: 'interactive', type: 'boolean', required: false, default: 'false', description: 'Enable click to toggle' },
      { name: 'gap', type: 'number', required: false, description: 'Gap between items' },
      { name: 'onItemClick', type: '(index: number, label: string) => void', required: false, description: 'Item click handler' },
      { name: 'isActive', type: 'boolean', required: false, description: 'Is legend active for input handling' },
      { name: 'state', type: 'LegendState', required: false, description: 'External state from createLegend()' },
    ],
    examples: [
      `Legend({
  items: [
    { label: 'Series 1', color: 'cyan' },
    { label: 'Series 2', color: 'green' },
  ],
  position: 'bottom',
})`,
      `// Interactive legend with state
const legendState = createLegend({ items: [...] })
Legend({
  items: [...],
  interactive: true,
  state: legendState,
  onItemClick: (idx, label) => console.log('Toggled:', label),
})`,
    ],
  },
];
