/**
 * Data Visualization Components
 *
 * Terminal-based charts and graphs for dashboards and monitoring.
 */

// Sparkline
export {
  Sparkline,
  renderSparklineString,
  SparklineBuffer,
  createSparklineBuffer,
  renderBrailleSparkline,
  BLOCK_CHARS,
  ASCII_CHARS,
} from './sparkline.js';

export type {
  SparklineOptions,
  SparklineStyle,
  SparklineBufferOptions,
} from './sparkline.js';

// Bar Chart
export {
  BarChart,
  VerticalBarChart,
  StackedBarChart,
  renderBarChartStrings,
  HORIZONTAL_BLOCKS,
  VERTICAL_BLOCKS,
} from './bar-chart.js';

export type {
  BarData,
  BarOrientation,
  BarChartOptions,
  VerticalBarChartOptions,
  StackedBarData,
  StackedBarChartOptions,
} from './bar-chart.js';

// Line Chart
export {
  LineChart,
  AreaChart,
  renderLineChartStrings,
  renderMultiSeriesChart,
  BrailleCanvas,
  AsciiCanvas,
} from './line-chart.js';

export type {
  DataPoint,
  DataSeries,
  AxisOptions,
  LineChartOptions,
  AreaChartOptions,
} from './line-chart.js';

// Gauge
export {
  Gauge,
  LinearGauge,
  MeterGauge,
  ArcGauge,
  DialGauge,
  BatteryGauge,
  renderLinearGaugeString,
  DEFAULT_ZONES,
  getZoneColor,
} from './gauge.js';

export type {
  GaugeStyle,
  GaugeZone,
  GaugeOptions,
  MeterOptions,
  BatteryGaugeOptions,
} from './gauge.js';

// Heatmap
export {
  Heatmap,
  createHeatmap,
  ContributionGraph,
  CalendarHeatmap,
  CorrelationMatrix,
  COLOR_SCALES,
} from './heatmap.js';

export type {
  HeatmapCell,
  HeatmapData,
  ColorScale,
  HeatmapOptions,
  HeatmapState,
  HeatmapProps,
  ContributionData,
  ContributionGraphOptions,
  CalendarHeatmapOptions,
  CorrelationMatrixOptions,
} from './heatmap.js';
