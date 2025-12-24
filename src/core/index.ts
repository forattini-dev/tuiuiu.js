/**
 * Core module exports
 */

// Signals - Reactive primitives
export {
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
} from '../primitives/signal.js';

// Layout engine
export {
  calculateLayout,
  getVisibleWidth,
  measureText,
  clearTextMeasureCache,
} from '../design-system/core/layout.js';

// Renderer
export {
  renderToString,
  OutputBuffer,
} from '../design-system/core/renderer.js';

// Hit Testing (mouse event dispatch)
export {
  getHitTestRegistry,
  resetHitTestRegistry,
  registerHitTestFromLayout,
  hitTestAt,
  enableHitTesting,
  disableHitTesting,
} from './hit-test.js';

export type {
  ElementBounds,
  HitTestResult,
} from './hit-test.js';

// App lifecycle
export {
  render,
  renderOnce,
} from '../app/render-loop.js';

export type {
  RenderOptions,
  ReckInstance,
} from '../app/render-loop.js';

// Theme system
export {
  // Core API
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
  // System detection
  detectColorScheme,
  useSystemTheme,
  // Built-in themes
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
} from './theme.js';

export type {
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
} from './theme.js';

// Colors - Tailwind CSS palette
export {
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
} from './colors.js';

export type {
  ColorShade,
  ColorPalette,
  ColorName,
} from './colors.js';

// Animation system
export {
  useAnimation,
  useTransition,
  lerp,
  lerpColor,
  requestAnimationFrame,
  cancelAllAnimationFrames,
  createSpring,
  easingFunctions,
  // Spring with frequency/damping model
  createHarmonicaSpring,
  // Composite transitions
  createCompositeTransition,
  createSwipeTransition,
  createSlideTransition,
} from './animation.js';

export type {
  AnimationOptions,
  AnimationControls,
  TransitionOptions,
  TransitionState,
  TransitionEffect,
  EasingFunction,
  EasingName,
  SpringOptions,
  // Harmonica spring types
  HarmonicaSpringOptions,
  // Composite transition types
  CompositeDirection,
  CompositeTransitionState,
  CompositeTransitionOptions,
  SwipeOptions,
} from './animation.js';

// Terminal capabilities and ASCII fallback
export {
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
} from './capabilities.js';

export type {
  TerminalCapabilities,
  RenderMode,
  ColorSupport,
  CharacterSet,
} from './capabilities.js';

// Advanced buffer system (delta rendering)
export {
  // Cell types and utilities
  createCell,
  emptyCell,
  cloneCell,
  cellEquals,
  colorEquals,
  attrsEquals,
  // Buffer classes
  CellBuffer,
  DoubleBuffer,
  BufferPool,
  // ANSI conversion
  colorToAnsi,
  attrsToAnsi,
  cellToAnsi,
  bufferToAnsi,
  patchesToAnsi,
} from './buffer.js';

export type {
  Cell,
  CellAttrs,
  Color,
  DamageRect,
  CellPatch,
} from './buffer.js';

// Event system (DOM-like bubbling/capturing)
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
} from './events.js';

export type {
  TuiEvent,
  EventPhase,
  EventHandler,
  EventListenerOptions,
  DelegateOptions,
  // Common event data types
  KeyEventData,
  MouseEventData,
  FocusEventData,
  ChangeEventData,
} from './events.js';

// Graphics protocols (Kitty, iTerm2, Sixel, Braille)
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
} from './graphics.js';

export type {
  GraphicsProtocol,
  ImageOptions,
  ImageData,
  ProtocolCapabilities,
} from './graphics.js';

// Advanced Focus Management
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
} from './focus.js';

export type {
  FocusZoneOptions,
  FocusableElement,
  FocusZoneState,
  FocusStackEntry,
  FocusZoneEventData,
  FocusZoneComponentOptions,
} from './focus.js';

// Advanced Input Handling
export {
  // Protocol detection
  detectKeyboardProtocol,
  setKeyboardProtocol,
  getKeyboardProtocol,
  resetKeyboardProtocol,
  // Kitty protocol
  enableKittyProtocol,
  disableKittyProtocol,
  queryKittyProtocol,
  parseKittyKeyEvent,
  // Mouse handling
  enableMouseTracking,
  disableMouseTracking,
  parseMouseEvent,
  // Bracketed paste
  enableBracketedPaste,
  disableBracketedPaste,
  hasBracketedPaste,
  extractBracketedPaste,
  // Input state machine
  createInputState,
  applyInputAction,
  getSelectedText,
  // Unified parsing
  parseInput,
  // Terminal control
  enableAlternateScreen,
  disableAlternateScreen,
  hideCursor,
  showCursor,
  requestCursorPosition,
  parseCursorPosition,
} from './input.js';

export type {
  KeyboardProtocol,
  MouseButton,
  MouseEventType,
  MouseEvent,
  MouseMode,
  KittyKeyEvent,
  KeyModifiers,
  PasteEvent,
  ParsedInput,
  InputState,
  InputAction,
} from './input.js';

// Virtual Scrolling
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
} from './virtual-scroll.js';

export type {
  VirtualItem,
  MeasureHeight,
  VirtualScrollOptions,
  VirtualScrollState,
  VirtualScrollResult,
  ScrollDirection,
  InfiniteScrollState,
} from './virtual-scroll.js';

// Data Visualization
export {
  // Sparklines
  sparkline,
  sparklineGradient,
  // Bar charts
  barChart,
  verticalBarChart,
  horizontalBar,
  // Box plot
  calculateBoxPlotStats,
  boxPlot,
  // Histogram
  calculateHistogramBins,
  histogram,
  // Pie chart
  pieChart,
  // Line chart
  lineChart,
  // Gauge
  gauge,
  // Heatmap
  heatmap,
  // Utilities
  calculateStats,
  normalizeData,
  scaleData,
} from './visualization.js';

export type {
  ChartColor,
  DataPoint,
  SparklineOptions,
  BarChartOptions,
  BoxPlotOptions,
  BoxPlotStats,
  HistogramOptions,
  HistogramBin,
  PieChartOptions,
  LineChartOptions,
  GaugeOptions,
  HeatmapOptions,
} from './visualization.js';

// Overlay System
export {
  // Manager
  resetOverlayManager,
  setOverlayTerminalSize,
  getOverlayTerminalSize,
  // Layer management
  addLayer,
  removeLayer,
  getLayer,
  getLayers,
  getVisibleLayers,
  getTopLayer,
  hasBackdrop,
  updateLayer,
  showLayer,
  hideLayer,
  bringToFront,
  getLayerCount,
  hasLayer,
  // Modal
  showModal,
  closeModal,
  closeTopModal,
  // Toast
  showToast,
  dismissToast,
  dismissAllToasts,
  // Popup
  showPopup,
  closePopup,
  // Tooltip
  showTooltip,
  hideTooltip,
  // Menu
  showMenu,
  closeMenu,
  updateMenuSelection,
  selectMenuItem,
  // Rendering
  renderOverlays,
  isPointInOverlay,
  handleOverlayClick,
  handleOverlayEscape,
} from './overlay.js';

export type {
  OverlayType,
  OverlayPosition,
  AnchorPosition,
  OverlaySize,
  OverlayLayer,
  ModalOptions,
  ToastOptions,
  PopupOptions,
  TooltipOptions,
  MenuItem,
  MenuOptions,
} from './overlay.js';

// Constraint-Based Layout
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
} from './constraint.js';

export type {
  ConstraintPriority,
  ConstraintOperator,
  ConstraintVariable,
  ConstraintTerm,
  ConstraintExpression,
  Constraint,
  ConstraintSolution,
  ConstraintElement,
  ConstraintLayoutOptions,
} from './constraint.js';

// Hotkeys & Input Processing
export {
  isHotkey,
  parseKeypress,
} from './hotkeys.js';

export type {
  Key,
  InputHandler,
} from './hotkeys.js';

// Key Binding System
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
} from './keybindings.js';

export type {
  KeyModifiers as KeyBindingModifiers,
  KeyCombo,
  KeyBinding,
  KeyBindingOptions,
  KeyMode,
  KeyConflict,
} from './keybindings.js';

// Command Palette
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
} from './command-palette.js';

export type {
  Command,
  CommandOptions,
  FuzzyMatch,
  CommandPaletteState,
  CommandPaletteOptions,
} from './command-palette.js';

// Screen Manager
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
} from './screen.js';

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
} from './screen.js';

// Screen Transitions
export {
  // Manager
  ScreenTransitionManager,
  createScreenTransitionManager,
  getTransitionManager,
  resetTransitionManager,
  // Configuration helpers
  createTransition,
  createSpringTransition,
  // Offset calculations
  calculateTransitionOffsets,
  // Render helpers
  applyHorizontalOffset,
  applyVerticalOffset,
  applyOpacity,
  compositeScreens,
  // Hook
  useScreenTransition,
  // Presets
  transitionPresets,
  DEFAULT_FORWARD_TRANSITION,
  DEFAULT_BACKWARD_TRANSITION,
  SPRING_FORWARD_TRANSITION,
  SPRING_BACKWARD_TRANSITION,
  FADE_TRANSITION,
  NO_TRANSITION,
} from './transitions.js';

export type {
  ScreenTransitionType,
  ScreenTransitionConfig,
  ScreenTransitionState,
  TransitionOffsets,
  ScreenTransitionManagerOptions,
  TransitionFrameCallback,
} from './transitions.js';

// Router
export {
  // Router class
  Router,
  createRouter,
  getRouter,
  setRouter,
  resetRouter,
  // Path utilities
  parsePathPattern,
  matchPath,
  buildPath,
  parseQuery,
  buildQuery,
  parsePath,
  normalizePath,
  // Hooks
  useRoute,
  useNavigate,
  useParams,
  useQuery,
  useRouteMatch,
  // Guard helpers
  createAuthGuard,
  createRoleGuard,
  combineGuards,
} from './router.js';

export type {
  RouteParams,
  QueryParams,
  RouteLocation,
  NavigationTarget,
  RouteDefinition,
  MatchedRoute,
  NavigationGuard,
  NavigationResult,
  RouterOptions,
  HistoryEntry,
  RouterEvents,
  PathSegment,
} from './router.js';

// Syntax Highlighter
export {
  // Language detection
  getLanguage,
  listLanguages,
  // Tokenization
  tokenize,
  tokenizeLines,
  // Themes (renamed to avoid conflict with theme.js)
  themes as highlightThemes,
  getTokenColor,
  // ANSI output
  tokensToAnsi,
  highlight,
  highlightWithLineNumbers,
} from './highlighter.js';

export type {
  TokenType,
  Token,
  HighlightedLine,
  HighlightTheme,
  LanguageDefinition,
} from './highlighter.js';

// Query API - CSS-like selector system
export {
  // Main query functions
  query,
  queryAll,
  queryResults,
  matches,
  closest,
  // Convenience functions
  findByType,
  findByClass,
  findById,
  countMatches,
  hasMatch,
} from './query.js';

export type {
  QueryOptions,
  QueryResult,
  SelectorPart,
  ParsedSelector,
  Combinator,
} from './query.js';

// Dirty Flag System (blessed-style optimization)
export {
  // Registry
  getDirtyRegistry,
  resetDirtyRegistry,
  // Convenience functions
  markDirty,
  markClean,
  needsRender,
  hasChanges,
  clearChanges,
  // Cache functions
  getCachedRender,
  setCachedRender,
  invalidateCache,
  clearAllCaches,
  // Layout tree helpers
  markLayoutTreeDirty,
  cleanLayoutTree,
  // Signal integration
  withDirtyTracking,
} from './dirty.js';

export type {
  RenderCacheEntry,
  DirtyState,
} from './dirty.js';

// Delta Renderer (blessed-style diff rendering)
export {
  createDeltaRenderer,
  getDeltaRenderer,
  resetDeltaRenderer,
} from './delta-render.js';

export type {
  DeltaRenderOptions,
  DeltaRenderer,
  RenderStats,
} from './delta-render.js';

// Error Boundary
export {
  // Stack trace parsing
  parseStackLine,
  parseStackTrace,
  // Source code extraction
  extractCodeExcerpt,
  // Error display component
  ErrorOverview,
  // Error state management
  setError,
  clearError,
  getError,
  onError,
  // Error boundary wrapper
  withErrorBoundary,
  tryCatch,
  resetErrorBoundary,
} from './error-boundary.js';

export type {
  ErrorInfo,
  StackFrame,
  CodeExcerpt,
} from './error-boundary.js';

// Global Tick System (synchronized animations)
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
} from './tick.js';

// FPS Tracking
export {
  trackFrame,
  getFps,
  getFpsMetrics,
  resetFps,
  getFpsColor,
} from './fps.js';

export type { FpsMetrics } from './fps.js';
