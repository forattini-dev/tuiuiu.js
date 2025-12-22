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

// Legend
export {
  Legend,
  createLegend,
} from './legend.js';

export type {
  LegendItem,
  LegendPosition,
  LegendOptions,
  LegendState,
  LegendProps,
} from './legend.js';

// Scatter Plot
export {
  ScatterPlot,
} from './scatter-plot.js';

export type {
  ScatterPoint,
  MarkerStyle,
  ScatterPlotOptions,
  ScatterPlotProps,
} from './scatter-plot.js';

// Radar Chart
export {
  RadarChart,
} from './radar-chart.js';

export type {
  RadarAxis,
  RadarSeries,
  RadarChartOptions,
} from './radar-chart.js';

// Gantt Chart
export {
  GanttChart,
} from './gantt-chart.js';

export type {
  TaskStatus,
  GanttTask,
  GanttChartOptions,
} from './gantt-chart.js';

// Time Heatmap
export {
  TimeHeatmap,
} from './time-heatmap.js';

export type {
  TimeHeatmapData,
  TimeGranularity,
  TimeHeatmapOptions,
} from './time-heatmap.js';

// Annotations
export {
  formatAnnotationLabel,
  getAnnotationColor,
} from './annotations.js';

export type {
  Annotation,
  AnnotationType,
  ThresholdAnnotation,
  RangeAnnotation,
  TextAnnotation,
  PointAnnotation,
} from './annotations.js';

// Interactive Hooks
export {
  useChartSelection,
  useChartHover,
  useChartTooltip,
  useChartZoom,
  useChartKeyboard,
  useChartInteraction,
  useChartDataChange,
} from './hooks.js';

export type {
  SelectionState,
  HoverState,
  TooltipState,
  ZoomState,
  ChartInteractionState,
} from './hooks.js';
