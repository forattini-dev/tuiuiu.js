/** Low-level rendering engine. No UI components or app lifecycle ownership. */

export {
  createSignal,
  createEffect,
  createMemo,
  batch,
  untrack,
  onCleanup,
  createReducer,
  createRef,
  createDeferred,
  createId,
  createPrevious,
  createThrottled,
  createDebounced,
  type Signal,
  type Effect,
} from '../primitives/signal.js';

export {
  calculateLayout,
  getVisibleWidth,
  measureText,
  clearTextMeasureCache,
} from './layout.js';

export {
  renderToString,
  renderFrameToString,
  measureHeight,
  type RenderOptions as StaticRenderOptions,
} from './renderer.js';

export {
  createFrameSnapshot,
  getCommittedFrameSnapshot,
  getCommittedFrameQueries,
  type Bounds,
  type DrawBoxCommand,
  type DrawCommand,
  type DrawCommandBase,
  type DrawTextCommand,
  type ElementQueryResult,
  type FrameInfo,
  type FrameInput,
  type FrameMetrics,
  type FramePhaseMetrics,
  type FrameQueries,
  type FrameSnapshot,
  type FrameSnapshotOptions,
  type FrameStructuralMetrics,
  type QueryStatus,
  type RuntimeWarning,
  type RuntimeWarningCode,
  type RuntimeWarningSeverity,
  type ScrollQueryControls,
  type ScrollQueryResult,
} from './frame.js';

export {
  configurePerfInspector,
  getPerfInspectorConfig,
  getPerfFrames,
  getPerfInspectorSummary,
  onSlowFrame,
  resetPerfInspector,
  type PerfBudgetConfig,
  type PerfFrameRecord,
  type PerfInspectorConfig,
  type PerfInspectorSummary,
  type PerfRendererKind,
} from './perf-inspector.js';

export {
  getCapabilities,
  refreshCapabilities,
  getTerminalSize,
  getRenderMode,
  setRenderMode,
  type RenderMode,
  type TerminalCapabilities,
} from './capabilities.js';

export {
  createGradientImage,
  createTerminalImageSource,
  queryGraphicsCapabilities,
  type ImageData,
  type TerminalImageCapabilities,
  type GraphicsProtocol,
} from './graphics.js';

export { loadImageFile } from './image-file.js';

export {
  adaptive,
  adaptiveColor,
  adaptiveUnderline,
  canClipboard,
  canColorUnderlines,
  canHyperlink,
  canNotify,
  canStyleUnderlines,
  canSyncOutput,
  getTerminalName,
  hasGpuAcceleration,
} from './adaptive.js';

export {
  createAnimatedImage,
  createAnimatedImageSource,
  framesFromSpriteSheet,
  type AnimatedImageFrame,
  type AnimatedImageSource,
  type AnimatedImageState,
} from './image-animation.js';

export { parseKeypress, type Key } from './hotkeys.js';

export {
  createTerminalInputStream,
  type TerminalInputStream,
  type TerminalInputStreamEvent,
  type TerminalInputStreamOptions,
} from './input-stream.js';
