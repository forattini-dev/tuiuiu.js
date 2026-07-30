/**
 * Utilities module exports
 */

// Types
export type {
  VNode,
  TuiNode,
  TuiChild,
  BoxProps,
  TextProps,
  SpacerProps,
  NewlineProps,
  BoxStyle,
  BoxStyleProps,
  TextStyle,
  TextStyleProps,
  ColorValue,
  LayoutNode,
  RenderContext,
  ForegroundColorName,
  VNodeType,
  Component,
  BorderChars,
  BorderStyleName,
  // Mouse event types
  MouseButton,
  MouseEventData,
  MouseEventHandler,
  MouseEventProps,
} from './types.js';

export {
  BORDER_STYLES,
  getBorderChars,
  listBorderStyles,
} from './types.js';

// Text utilities
export {
  stripAnsi,
  stringWidth,
  wrapText,
  truncateText,
  sliceAnsi,
  skipAnsi,
  takeAnsi,
  padAnsi,
  splitLines,
  joinLines,
  normalizeLines,
  compositeHorizontal,
  compositeVertical,
  colorToAnsi,
  colorize,
  style,
  hyperlink,
  styles,
} from './text-utils.js';

export type {
  WrapOptions,
  TruncateOptions,
  TruncatePosition,
  ColorType,
} from './text-utils.js';

// Cursor control
export {
  showCursor,
  hideCursor,
  toggleCursor,
  isCursorHidden,
  cursor,
} from './cursor.js';

// Log update (incremental rendering)
export {
  createLogUpdate,
} from './log-update.js';

export type {
  LogUpdate,
  LogUpdateOptions,
} from './log-update.js';

// Update batching (throttle high-frequency updates)
export {
  createUpdateBatcher,
  createDebounced,
  createThrottled,
} from './batcher.js';

export type {
  UpdateBatcher,
} from './batcher.js';

// Background execution
export {
  createBackgroundExecutor,
  createInlineBackgroundExecutor,
  createWorkerExecutor,
  createThreadBus,
  createTaskBridge,
  createTaskBridgePool,
  THREAD_BUS_EVENT_KIND,
  THREAD_BUS_TASK_TYPE,
} from './background-executor.js';

export type {
  BackgroundExecutor,
  BackgroundExecutorState,
  BackgroundTaskError,
  BackgroundTaskEvent,
  BackgroundTaskEventListener,
  BackgroundTaskHandle,
  BackgroundTaskHandler,
  BackgroundTaskHandlers,
  BackgroundTaskOptions,
  BackgroundTaskReporter,
  BackgroundTaskRequest,
  BackgroundTaskResult,
  InterThreadBusMessage,
  TaskBridge,
  TaskBridgePoolOptions,
  TaskBridgePoolScheduler,
  ThreadBus,
  ThreadBusOptions,
  ThreadBusListener,
  WorkerExecutorOptions,
} from './background-executor.js';

// Node.js FS Storage for persistence
export {
  createNodeFsStorage,
  createNodeFsSyncStorage,
} from './fs-storage.js';

// System data (Linux /proc filesystem)
export {
  getCpuUsage,
  getMemoryInfo,
  getProcessList,
  getSystemInfo,
  resetSystemDataSampling,
  formatBytes,
  formatUptime,
  getStateDescription,
} from './system-data.js';

export type {
  CpuStats,
  CpuUsage,
  MemoryInfo,
  ProcessInfo,
  SystemInfo,
} from './system-data.js';

// Signal-transparent resolution
export {
  resolve,
  isReactive,
  resolveAll,
  resolveProps,
  createResolver,
} from './resolve.js';

export type {
  MaybeReactive,
} from './resolve.js';

// Format utilities
export {
  formatBytes as formatBytesAdvanced, // Avoid conflict with system-data.formatBytes
  formatDuration,
  formatRelative,
  formatNumber,
  formatCompact,
  formatPercent,
  formatDelta,
  truncateMiddle,
  truncateEnd,
} from './formatters.js';
