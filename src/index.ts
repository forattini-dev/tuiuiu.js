/**
 * Tuiuiu - Zero-dependency Terminal UI library
 *
 * A minimal, reactive terminal UI framework with signal-based reactivity,
 * flexbox layout, and zero external dependencies.
 *
 * @example
 * import { render, Box, Text, useState, useInput } from 'tuiuiu.js';
 *
 * function App() {
 *   const [count, setCount] = useState(0);
 *
 *   useInput((input, key) => {
 *     if (key.upArrow) setCount(c => c + 1);
 *     if (key.downArrow) setCount(c => c - 1);
 *   });
 *
 *   return Box({ flexDirection: 'column', padding: 1 },
 *     Text({ color: 'cyan', bold: true }, 'Counter'),
 *     Text({}, `Count: ${count()}`)
 *   );
 * }
 *
 * const { waitUntilExit } = render(App);
 * await waitUntilExit();
 */

// =============================================================================
// Version
// =============================================================================

export {
  getVersion,
  getVersionSync,
  getVersionInfo,
  formatVersionInfo,
} from './version.js';

export type { VersionInfo } from './version.js';

// =============================================================================
// Core - Signals, Layout, Rendering, App
// =============================================================================

export {
  // Signals
  createSignal,
  createEffect,
  createMemo,
  batch,
  untrack,
  Signal,
  Effect,
  createReducer,
  createRef,
  createDeferred,
  createId,
  resetIdCounter,
  createPrevious,
  createThrottled,
  createDebounced,
  // Layout
  calculateLayout,
  getVisibleWidth,
  measureText,
  clearTextMeasureCache,
  // Renderer
  renderToString,
  measureHeight,
  OutputBuffer,
  // App
  render,
  renderOnce,
  // Hotkeys
  isHotkey,
} from './core/index.js';

export type {
  RenderOptions,
  ReckInstance,
} from './core/index.js';

// =============================================================================
// Hooks - useState, useEffect, useInput, etc.
// =============================================================================

export {
  useState,
  useEffect,
  useInput,
  useApp,
  useFocus,
  useFocusManager,
  parseKeypress,
  useTerminalSize,
  useMouse,
  // Hotkeys
  useHotkeys,
  registerHotkey,
  triggerHotkey,
  getRegisteredHotkeys,
  getHotkeyScope,
  setHotkeyScope,
  resetHotkeyScope,
  parseHotkey,
  parseHotkeys,
  matchesHotkey,
  formatHotkey,
  formatHotkeyPlatform,
  isMac,
  // FPS tracking
  useFps,
  // Timing hooks
  useInterval,
  cleanupInterval,
  useTimeout,
  cleanupTimeout,
  // Form management
  useForm,
  createFormValidator,
  required,
  minLength,
  maxLength,
  email,
  pattern,
  min,
  max,
  matchField,
  custom,
} from './hooks/index.js';

export type {
  Key,
  InputHandler,
  AppContext,
  FocusOptions,
  FocusResult,
  HotkeyBinding,
  HotkeyOptions,
  HotkeyHandler,
  UseFpsResult,
  // Timing types
  UseIntervalOptions,
  UseIntervalReturn,
  UseTimeoutOptions,
  UseTimeoutReturn,
  // Form types
  FormValues,
  FormErrors,
  UseFormOptions,
  UseFormResult,
  FieldBinding,
  ValidationRule,
  FieldValidators,
} from './hooks/index.js';

// =============================================================================
// Primitives - Box, Text, Spacer, etc.
// =============================================================================

export {
  // Basic nodes
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
  // SplitBox
  SplitBox,
  // Canvas
  Canvas,
  createCanvas,
  createBrailleBuffer,
  setBrailleDot,
  brailleBufferToString,
  BLOCK_CHARS as CANVAS_BLOCK_CHARS,
  LINE_CHARS,
  createBlockBuffer,
  setBlockPixel,
  blockBufferToString,
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
  drawSparkline,
  drawBarChart,
  drawScatterPlot,
  // Scroll (primitive)
  Scroll,
  createScroll,
  useScroll,
} from './primitives/index.js';

export type {
  TransformProps,
  StaticProps,
  DividerProps,
  // Scroll types
  ScrollProps,
  ScrollState,
  UseScrollOptions,
  UseScrollReturn,
  SlotProps,
  SplitBoxProps,
  SplitBoxSection,
  CanvasMode,
  CanvasColor,
  CanvasOptions,
  LineStyle as CanvasLineStyle,
  FillStyle,
  TextStyle as CanvasTextStyle,
  CanvasState,
  Point,
} from './primitives/index.js';

// Re-export types from utils for convenience
export type {
  VNode,
  ReckNode,
  BoxStyle as BoxProps,
  TextStyle as TextProps,
} from './utils/types.js';

// Spacer/Newline props
export interface SpacerProps {
  x?: number;
  y?: number;
}

export interface NewlineProps {
  count?: number;
}

// =============================================================================
// Atomic Design - Atoms (smallest functional units)
// =============================================================================

export * from './atoms/index.js';

// =============================================================================
// Atomic Design - Molecules (composed atoms)
// =============================================================================

export * from './molecules/index.js';

// =============================================================================
// Atomic Design - Organisms (complex self-contained units)
// =============================================================================

export * from './organisms/index.js';

// =============================================================================
// Atomic Design - Templates (page-level layouts)
// =============================================================================

export * from './templates/index.js';

// =============================================================================
// Core - Global Tick System (synchronized animations)
// =============================================================================

export {
  // Tick control
  startTick,
  stopTick,
  pauseTick,
  resumeTick,
  resetTick,
  setTickRate,
  getTickRate,
  // Tick state
  getTick,
  tick,
  isTickRunning,
  // Subscriptions
  onTick,
  // Manual control (for testing/storybook)
  advanceTick,
  setTickValue,
  // Animation utilities
  getFrame,
  getFrameItem,
  oscillate,
  getElapsedSeconds,
  everyNTicks,
  // FPS tracking
  trackFrame,
  getFps,
  getFpsMetrics,
  resetFps,
  getFpsColor,
} from './core/index.js';

export type { FpsMetrics } from './core/index.js';

// =============================================================================
// Core - Theme, Animation, Capabilities
// =============================================================================

export {
  // Theme system
  useTheme,
  getTheme,
  setTheme,
  pushTheme,
  popTheme,
  createTheme,
  // Theme mode helpers
  useThemeMode,
  useIsDark,
  // Component tokens
  useComponentTokens,
  // Convenience accessors
  th,
  useBg,
  useFg,
  usePalette,
  useAccents,
  useStates,
  useBorders,
  useOpacity,
  // Color utilities
  getContrastColor,
  getColor,
  getDarker,
  getLighter,
  getBorderRadiusChars,
  resolveColor,
  detectColorScheme,
  useSystemTheme,
  darkTheme,
  lightTheme,
  highContrastDarkTheme,
  monochromeTheme,
  // Popular terminal themes
  monokaiTheme,
  draculaTheme,
  nordTheme,
  solarizedDarkTheme,
  gruvboxTheme,
  tokyoNightTheme,
  catppuccinTheme,
  // Theme collection
  themes,
  themeNames,
  getThemeByName,
  getNextTheme,
  getPreviousTheme,
  // Colors - Tailwind CSS palette
  colors,
  color,
  parseColor,
  getShades,
  listColors,
  listShades,
  white,
  black,
  transparent,
  slate,
  gray,
  zinc,
  neutral,
  stone,
  red,
  orange,
  amber,
  yellow,
  lime,
  green,
  emerald,
  teal,
  cyan,
  sky,
  blue,
  indigo,
  violet,
  purple,
  fuchsia,
  pink,
  rose,
  // Animation system
  useAnimation,
  useTransition,
  lerp,
  lerpColor,
  requestAnimationFrame,
  cancelAllAnimationFrames,
  createSpring,
  easingFunctions,
  createHarmonicaSpring,
  createCompositeTransition,
  createSwipeTransition,
  createSlideTransition,
  // Terminal capabilities and ASCII fallback
  detectTerminalCapabilities,
  setRenderMode,
  getRenderModeSetting,
  getRenderMode,
  getCapabilities,
  refreshCapabilities,
  getChars,
  char,
  supports,
  supportsTrueColor,
  supports256Colors,
  getTerminalSize,
  onResize,
  unicodeChars,
  asciiChars,
} from './core/index.js';

export type {
  // Theme
  Theme,
  ThemeMode,
  ThemePalette,
  ThemeBackground,
  ThemeForeground,
  ThemeAccent,
  ThemeStates,
  ThemeBorders,
  ThemeOpacity,
  ComponentTokens,
  ComponentName,
  ColorScale,
  ShadeValue,
  BorderRadius,
  // Colors (Tailwind palette)
  ColorShade,
  ColorPalette as TailwindPalette,
  ColorName,
  // Animation
  AnimationOptions,
  AnimationControls,
  TransitionOptions,
  TransitionState,
  TransitionEffect,
  EasingFunction,
  EasingName,
  SpringOptions,
  HarmonicaSpringOptions,
  CompositeDirection,
  CompositeTransitionState,
  CompositeTransitionOptions,
  SwipeOptions,
  // Capabilities
  TerminalCapabilities,
  RenderMode,
  ColorSupport,
  CharacterSet,
} from './core/index.js';

// =============================================================================
// Data Visualization - Charts and Graphs
// =============================================================================

export {
  // Sparkline
  Sparkline,
  renderSparklineString,
  SparklineBuffer,
  createSparklineBuffer,
  renderBrailleSparkline,
  BLOCK_CHARS,
  ASCII_CHARS,
  // Bar Chart
  BarChart,
  VerticalBarChart,
  StackedBarChart,
  renderBarChartStrings,
  HORIZONTAL_BLOCKS,
  VERTICAL_BLOCKS,
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
  // Heatmap
  Heatmap,
  createHeatmap,
  ContributionGraph,
  CalendarHeatmap,
  CorrelationMatrix,
  COLOR_SCALES,
} from './molecules/data-viz/index.js';

export type {
  // Sparkline
  SparklineOptions,
  SparklineStyle,
  SparklineBufferOptions,
  // Bar Chart
  BarData,
  BarOrientation,
  BarChartOptions,
  VerticalBarChartOptions,
  StackedBarData,
  StackedBarChartOptions,
  // Line Chart
  DataPoint,
  DataSeries,
  AxisOptions,
  LineChartOptions,
  AreaChartOptions,
  // Gauge
  GaugeStyle,
  GaugeZone,
  GaugeOptions,
  MeterOptions,
  BatteryGaugeOptions,
  // Heatmap
  HeatmapCell,
  HeatmapData,
  ColorScale as HeatmapColorScale,
  HeatmapOptions,
  HeatmapState,
  HeatmapProps,
  ContributionData,
  ContributionGraphOptions,
  CalendarHeatmapOptions,
  CorrelationMatrixOptions,
} from './molecules/data-viz/index.js';

// =============================================================================
// Utils - Types, Text utilities, Cursor control
// =============================================================================

export {
  BORDER_STYLES,
  stripAnsi,
  stringWidth,
  wrapText,
  truncateText,
  sliceAnsi,
  colorToAnsi,
  colorize,
  style,
  hyperlink,
  styles,
  showCursor,
  hideCursor,
  toggleCursor,
  isCursorHidden,
  cursor,
  createLogUpdate,
  createUpdateBatcher,
  createDebounced as debouncedFn,
  createThrottled as throttledFn,
} from './utils/index.js';

export type {
  BoxStyle,
  TextStyle,
  ColorValue,
  LayoutNode,
  RenderContext,
  ForegroundColorName,
  VNodeType,
  Component,
  BorderChars,
  WrapOptions,
  TruncateOptions,
  TruncatePosition,
  ColorType,
  LogUpdate,
  LogUpdateOptions,
  UpdateBatcher,
  ReckChild,
} from './utils/index.js';

// =============================================================================
// Core - Event System
// =============================================================================

export {
  // Event creation
  createEvent,
  // Event emitter
  EventEmitter,
  // Global event bus
  getEventBus,
  // Delegation helpers
  delegate,
  // Async helpers
  waitForEvent,
  eventIterator,
  // Composition helpers
  combineHandlers,
  conditionalHandler,
  debounceHandler,
  throttleHandler,
} from './core/index.js';

export type {
  TuiEvent,
  EventPhase,
  EventHandler,
  EventListenerOptions,
  DelegateOptions,
} from './core/index.js';

// =============================================================================
// Core - Focus Management
// =============================================================================

export {
  // Zone manager
  getFocusZoneManager,
  resetFocusZoneManager,
  // Zone helpers
  createFocusZone,
  createFocusTrap,
  // Programmatic focus
  focusElement,
  focusNext,
  focusPrevious,
  focusFirst,
  focusLast,
  blurFocus,
  getActiveId,
  isFocused,
  registerFocusable,
  onFocusChange,
} from './core/index.js';

export type {
  FocusZoneOptions,
  FocusZoneState,
  FocusZoneEventData,
  FocusableElement,
  FocusZoneComponentOptions,
} from './core/index.js';

// =============================================================================
// Core - Graphics System
// =============================================================================

export {
  // Protocol detection
  detectGraphicsProtocol,
  setGraphicsProtocol,
  getGraphicsProtocol,
  getProtocolCapabilities,
  resetGraphicsDetection,
  // Protocol implementations
  kittyGraphics,
  iterm2Graphics,
  sixelGraphics,
  brailleGraphics,
  // Unified rendering
  renderImage,
  clearImages,
  // Image utilities
  createImageData,
  createSolidImage,
  createGradientImage,
  scaleImage,
} from './core/index.js';

export type {
  GraphicsProtocol,
  ProtocolCapabilities,
  ImageOptions,
  ImageData,
} from './core/index.js';

// =============================================================================
// Core - Virtual Scroll
// =============================================================================

export {
  // Core manager
  createVirtualScroll,
  VirtualScrollManager,
  // Fixed/variable height helpers
  createFixedHeightVirtualScroll,
  createVariableHeightVirtualScroll,
  // Scroll helpers
  getScrollDirection,
  getVisibleRangePercent,
  createScrollIndicator,
  // Infinite scroll
  createInfiniteScroll,
} from './core/index.js';

export type {
  VirtualItem,
  MeasureHeight,
  VirtualScrollOptions,
  VirtualScrollState,
  VirtualScrollResult,
} from './core/index.js';

// =============================================================================
// Core - Constraint Layout
// =============================================================================

export {
  // Variable creation
  createVariable,
  // Expression building
  expr,
  constant,
  add,
  subtract,
  multiply,
  divide,
  addConstant,
  // Constraint creation
  eq,
  lte,
  gte,
  // Element creation
  createElement,
  // Convenience constraints
  equalWidths,
  equalHeights,
  equalSizes,
  percentWidth,
  percentHeight,
  aspectRatio,
  centerHorizontally,
  centerVertically,
  center,
  pinToEdges,
  stackHorizontally,
  stackVertically,
  alignTops,
  alignLefts,
  distributeHorizontally,
  // Solver
  ConstraintSolver,
  ConstraintLayoutManager,
  Solver,
} from './core/index.js';

export type {
  ConstraintVariable,
  ConstraintExpression,
  Constraint,
  ConstraintPriority,
  ConstraintElement,
  ConstraintSolution,
  ConstraintLayoutOptions,
} from './core/index.js';

// =============================================================================
// Core - Key Bindings
// =============================================================================

export {
  // Parsing
  parseKeyCombo,
  keyComboToString,
  keyComboEquals,
  keyComboFromEvent,
  formatKeyCombo,
  formatKeyString,
  // Registry
  KeyBindingRegistry,
  getKeyBindingRegistry,
  resetKeyBindingRegistry,
  resetBindingIdCounter,
  // Convenience functions
  registerKeybinding,
  unregisterKeybinding,
  setKeyMode,
  getKeyMode,
  handleKeyEvent,
  // Hook
  useKeyBindings,
} from './core/index.js';

export type {
  KeyModifiers,
  KeyCombo,
  KeyBinding,
  KeyBindingOptions,
  KeyMode,
  KeyConflict,
} from './core/index.js';

// =============================================================================
// Core - Command Palette
// =============================================================================

export {
  // Fuzzy search
  fuzzyMatch,
  searchCommands,
  // Registry
  CommandRegistry,
  getCommandRegistry,
  resetCommandRegistry,
  resetCommandIdCounter,
  // Convenience functions
  registerCommand,
  unregisterCommand,
  executeCommand,
  searchGlobalCommands,
  // State management
  createCommandPaletteState,
  // Helpers
  highlightMatches,
  formatCommand,
  groupByCategory,
} from './core/index.js';

export type {
  Command,
  CommandOptions,
  FuzzyMatch,
  CommandPaletteState,
  CommandPaletteOptions,
} from './core/index.js';

// =============================================================================
// Styling - TCSS (Terminal CSS)
// =============================================================================

export {
  // Tokenizer
  TokenType,
  Tokenizer,
  tokenize,
  tokenizeWithErrors,
  // Parser
  Parser,
  parse,
  parseStrict,
  visitAST,
  stringifySelector,
  stringifyValue,
} from './styling/index.js';

export type {
  Token,
  TokenizerError,
  TokenizerOptions,
  // Parser types
  ASTNode,
  SelectorType,
  CombinatorType,
  SimpleSelector,
  CompoundSelector,
  ComplexSelector,
  SelectorList,
  Value,
  Declaration,
  Rule,
  VariableDefinition,
  ImportRule,
  MediaCondition,
  MediaRule,
  Stylesheet,
  ParserError,
  ParseResult,
  ParserOptions,
  // Resolver types
  Specificity,
  MatchElement,
  ResolvedValue,
  ResolvedStyles,
  VariableScope,
  MatchedRule,
  StyleSheetOptions,
  MediaContext,
  BoxStyleProps,
  TextStyleProps,
  StyleProps,
} from './styling/index.js';

export {
  // Specificity
  calculateSpecificity,
  compareSpecificity,
  specificityToNumber,
  specificityToString,
  getSpecificity,
  // Matching
  matchSelector,
  // Inheritance
  isInheritable,
  // Value utilities
  valueToString,
  // StyleSheet
  StyleSheet,
  createStyleSheet,
  // Style application
  resolvedStylesToProps,
  applyStyles,
} from './styling/index.js';

// =============================================================================
// Core - Screen Manager
// =============================================================================

export {
  // Manager
  ScreenManager,
  getScreenManager,
  resetScreenManager,
  createScreenManager,
  // Screen creation
  createScreen,
  generateScreenId,
  resetScreenIdCounter,
  // Convenience navigation
  pushScreen,
  popScreen,
  replaceScreen,
  goBack,
  // Hooks
  useScreen,
  useScreenState,
} from './core/index.js';

export type {
  ScreenComponent,
  Screen,
  ScreenStackEntry,
  TransitionDirection,
  ScreenNavigationEvent,
  ScreenManagerOptions,
  ScreenManagerState,
  ScreenManagerEvents,
  UseScreenResult,
} from './core/index.js';

// =============================================================================
// Developer Tools - Debugging and Testing Utilities
// =============================================================================

export {
  // Dev mode control
  setDevMode,
  isDevMode,
  configureDevTools,
  getDevToolsConfig,
  // Layout inspector
  inspectLayout,
  formatLayoutTree,
  // Event log
  logEvent,
  getEventLog,
  clearEventLog,
  formatEventLog,
  // Performance monitor
  startFrame,
  recordRender,
  recordLayout,
  recordSignalUpdate,
  getPerformanceMetrics,
  resetPerformanceMetrics,
  formatPerformanceMetrics,
  // Component tree
  buildComponentTree,
  formatComponentTree,
  findComponentByPath,
  countComponents,
  // Signal graph
  registerSignal,
  updateSignalValue,
  addSignalDependency,
  getSignalGraph,
  formatSignalGraph,
  clearSignalRegistry,
  // Debug panel
  getDebugPanelData,
  // Terminal simulator
  TerminalSimulator,
  // Snapshot testing
  createSnapshot,
  compareSnapshots,
  formatSnapshotDiff,
  stripAnsi as devStripAnsi,
  // Event simulation
  createEventSimulator,
  // Accessibility
  checkAccessibility,
  formatAccessibilityReport,
  // Test harness
  createTestHarness,
} from './dev-tools/index.js';

export type {
  // Debugger types
  DevToolsConfig,
  LayoutInfo,
  EventLogEntry,
  PerformanceMetrics,
  FrameStats,
  ComponentTreeNode,
  SignalNode,
  SignalGraph,
  DebugPanelData,
  // Testing types
  TerminalSize,
  CursorPosition,
  TerminalCell,
  TerminalState,
  KeyEvent,
  MouseEvent as TestMouseEvent,
  SnapshotOptions,
  SnapshotDiff,
  AccessibilityIssue,
  AccessibilityReport,
  EventSimulator,
  TestHarnessOptions,
  TestHarness,
} from './dev-tools/index.js';

// =============================================================================
// Presets - Pre-configured component props for common use cases
// =============================================================================

export {
  // Button presets
  dangerButton,
  successButton,
  warningButton,
  ghostButton,
  linkButton,
  primaryButton,
  outlineButton,
  smallButton,
  largeButton,
  // Modal presets
  confirmModal,
  alertModal,
  formModal,
  largeModal,
  fullscreenModal,
  // Badge presets
  statusSuccess,
  statusWarning,
  statusError,
  statusInfo,
  statusNeutral,
  statusPending,
  outlineSuccess,
  outlineWarning,
  outlineError,
  // Aggregate object
  presets,
  // Utilities
  getPreset,
  listPresets,
  listPresetsByCategory,
  type PresetName,
} from './presets/index.js';
