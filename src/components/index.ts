/**
 * Components module exports
 *
 * This module re-exports from the new design-system locations for backward compatibility.
 */

// =============================================================================
// Primitives (from design-system/primitives)
// =============================================================================

export {
  Box,
  Text,
  Spacer,
  Newline,
  Fragment,
  When,
  Each,
  Transform,
  Static,
  Divider,
  Slot,
} from '../design-system/primitives/index.js';

export type {
  TransformProps,
  StaticProps,
  DividerProps,
  SlotProps,
} from '../design-system/primitives/index.js';

// Re-export types from utils for convenience
export type {
  VNode,
  ReckNode,
  BoxStyle as BoxProps,
  TextStyle as TextProps,
} from '../utils/types.js';

// Spacer/Newline props
export interface SpacerProps {
  x?: number;
  y?: number;
}

export interface NewlineProps {
  count?: number;
}

// =============================================================================
// Feedback (from design-system/feedback)
// =============================================================================

export {
  createSpinner,
  renderSpinner,
  Spinner,
  createProgressBar,
  renderProgressBar,
  ProgressBar,
  MultiProgressBar,
  Badge,
} from '../design-system/feedback/index.js';

export type {
  SpinnerStyle,
  SpinnerOptions,
  ProgressBarStyle,
  ProgressBarOptions,
  BadgeProps,
} from '../design-system/feedback/index.js';

// =============================================================================
// Basic versions (aliases for simple use cases)
// =============================================================================

// Re-export basic spinner from the old components.js for now
// TODO: Remove this after cleanup
export { Spinner as BasicSpinner } from './components.js';
export { ProgressBar as BasicProgressBar } from './components.js';
export { Markdown as BasicMarkdown } from './components.js';
export { SPINNER_FRAMES } from './components.js';

export type {
  SpinnerProps as BasicSpinnerProps,
  ProgressBarProps as BasicProgressBarProps,
  MarkdownProps as BasicMarkdownProps,
} from './components.js';

// =============================================================================
// Forms (from design-system/forms)
// =============================================================================

export {
  createTextInput,
  renderTextInput,
  createSelect,
  renderSelect,
  Select,
  Confirm,
  Checkbox,
} from '../design-system/forms/index.js';

export type {
  TextInputState,
  TextInputOptions,
  TextInputProps,
  SelectItem,
  SelectOptions,
} from '../design-system/forms/index.js';

// =============================================================================
// Data Display (from design-system/data-display)
// =============================================================================

export {
  Table,
  SimpleTable,
  KeyValueTable,
  CodeBlock,
  InlineCode,
  Markdown,
  renderMarkdown,
} from '../design-system/data-display/index.js';

export type {
  TableBorderStyle,
  TextAlign,
  TableColumn,
  TableOptions,
  Language,
  CodeTheme,
  CodeBlockOptions,
  MarkdownOptions,
} from '../design-system/data-display/index.js';

// =============================================================================
// Overlays (from design-system/overlays)
// =============================================================================

export {
  Modal,
  ConfirmDialog,
  Toast,
  AlertBox,
  createModal,
  createConfirmDialog,
} from '../design-system/overlays/index.js';

export type {
  ModalProps,
  ModalState,
  ModalSize,
  ModalPosition,
  ConfirmDialogProps,
  ToastProps,
  ToastType,
  AlertBoxProps,
  BorderStyle,
} from '../design-system/overlays/index.js';

// =============================================================================
// Layout (from design-system/layout)
// =============================================================================

export {
  SplitPanel,
  ThreePanel,
  createSplitPanel,
} from '../design-system/layout/index.js';

export type {
  SplitPanelProps,
  SplitPanelState,
  ThreePanelProps,
  DividerStyle,
} from '../design-system/layout/index.js';

// =============================================================================
// Data Visualization (from data-viz)
// =============================================================================

export {
  // Sparkline
  Sparkline,
  renderSparklineString,
  SparklineBuffer,
  createSparklineBuffer,
  renderBrailleSparkline,
  // Bar Chart
  BarChart,
  VerticalBarChart,
  StackedBarChart,
  renderBarChartStrings,
  // Line Chart
  LineChart,
  AreaChart,
  renderLineChartStrings,
  renderMultiSeriesChart,
  BrailleCanvas,
  AsciiCanvas,
  // Gauge
  Gauge,
  LinearGauge,
  MeterGauge,
  ArcGauge,
  DialGauge,
  BatteryGauge,
  renderLinearGaugeString,
  DEFAULT_ZONES,
  getZoneColor,
} from './data-viz/index.js';

export type {
  // Sparkline types
  SparklineOptions,
  SparklineStyle,
  SparklineBufferOptions,
  // Bar Chart types
  BarData,
  BarOrientation,
  BarChartOptions,
  VerticalBarChartOptions,
  StackedBarData,
  StackedBarChartOptions,
  // Line Chart types
  DataPoint,
  DataSeries,
  AxisOptions,
  LineChartOptions,
  AreaChartOptions,
  // Gauge types
  GaugeStyle,
  GaugeZone,
  GaugeOptions,
  MeterOptions,
  BatteryGaugeOptions,
} from './data-viz/index.js';

// =============================================================================
// Canvas (2D drawing primitives)
// =============================================================================

export {
  // Braille utilities
  createBrailleBuffer,
  setBrailleDot,
  brailleBufferToString,
  // Block utilities
  BLOCK_CHARS,
  LINE_CHARS,
  createBlockBuffer,
  setBlockPixel,
  blockBufferToString,
  // Drawing algorithms
  bresenhamLine,
  midpointCircle,
  filledCircle,
  midpointEllipse,
  arcPoints,
  bezierCurve,
  quadraticBezier,
  polygonPoints,
  filledPolygon,
  rectanglePoints,
  filledRectangle,
  // Canvas class
  Canvas,
  createCanvas,
  // Utility drawing functions
  drawSparkline,
  drawBarChart,
  drawScatterPlot,
} from './canvas.js';

export type {
  // Canvas types
  CanvasMode,
  CanvasColor,
  CanvasOptions,
  LineStyle,
  FillStyle,
  TextStyle,
  CanvasState,
  Point,
} from './canvas.js';

// =============================================================================
// Grid Layout (CSS Grid-inspired)
// =============================================================================

export {
  // Track parsing
  parseTrackSize,
  parseTrackDefinition,
  parseGridAreas,
  // Size calculation
  calculateTrackSizes,
  calculateCellPosition,
  calculateGridLayout,
  // Components
  Grid,
  GridItem,
  GridRow,
  GridColumn,
  AutoGrid,
  DashboardGrid,
  MasonryGrid,
  // Utilities
  repeat,
  minmax,
  gridAreasToTemplate,
} from './grid.js';

export type {
  TrackSize,
  ParsedTrack,
  GridArea,
  JustifyItems,
  AlignItems,
  JustifyContent,
  AlignContent,
  GridOptions,
  GridItemOptions,
  CellPosition,
  GridLayout,
} from './grid.js';
