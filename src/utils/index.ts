/**
 * Utilities module exports
 */

// Types
export type {
  VNode,
  ReckNode,
  ReckChild,
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

// Node.js FS Storage for persistence
export {
  createNodeFsStorage
} from './fs-storage.js';

// System data (Linux /proc filesystem)
export {
  getCpuUsage,
  getMemoryInfo,
  getProcessList,
  getSystemInfo,
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