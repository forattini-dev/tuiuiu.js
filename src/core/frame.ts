import { calculateLayout } from './layout.js';
import { collectHitTestTargetsFromLayout, type ElementBounds } from './hit-test.js';
import {
  createTerminalImageSource,
  getGraphicsCapabilities,
  isCellGraphicsProtocol,
  resolveRenderableGraphicsProtocol,
  planImageRender,
  type GraphicsProtocol,
  type ImageData,
  type ImageOptions,
  type TerminalImageProtocolState,
  type TerminalImageSource,
} from './graphics.js';
import type { BorderStyleName, BoxStyle, LayoutNode, TextStyle, VNode } from '../utils/types.js';

export interface FrameInput {
  width: number;
  height: number;
  pointer?: {
    x: number;
    y: number;
    buttonDown: boolean;
  };
  scrollDelta?: {
    x: number;
    y: number;
  };
  deltaTimeMs?: number;
}

export interface FrameSnapshotOptions {
  /**
   * Build hit targets during snapshot assembly.
   * When false, hit targets are assembled lazily on first access.
   */
  eagerHitTargets?: boolean;
  /**
   * Build query indexes during snapshot assembly.
   * When false, indexes are assembled lazily on first query.
   */
  eagerQueries?: boolean;
  /**
   * Build duplicate-id warnings during snapshot assembly.
   * When false, duplicate warnings are assembled lazily on first warnings access.
   */
  eagerWarnings?: boolean;
}

export interface FrameInfo {
  frameId: number;
  committedAt: number;
  viewport: {
    width: number;
    height: number;
  };
}

export type RuntimeWarningSeverity = 'info' | 'warning' | 'error';
export type RuntimeWarningCode =
  | 'duplicate-id'
  | 'query-ambiguous'
  | 'query-missing'
  | 'scroll-target-missing'
  | 'engine-contract-violation';

export interface RuntimeWarning {
  code: RuntimeWarningCode;
  severity: RuntimeWarningSeverity;
  message: string;
  id?: string;
}

export interface FramePhaseMetrics {
  vnodeEvalMs?: number;
  layoutMs?: number;
  hitTargetRegistrationMs?: number;
  drawCommandMs?: number;
  ansiRenderMs?: number;
  deltaRenderMs?: number;
}

export interface FrameStructuralMetrics {
  drawCommandCount: number;
  hitTargetCount: number;
  warningCount: number;
}

export interface FrameMetrics {
  frameStartAt: number;
  frameEndAt: number;
  totalFrameMs: number;
  phases: FramePhaseMetrics;
  structural: FrameStructuralMetrics;
}

export interface DrawCommandBase {
  type: DrawCommand['type'];
  order: number;
  zIndex?: number;
  id?: string;
  nodeType?: string;
}

export interface DrawBoxCommand extends DrawCommandBase {
  type: 'box';
  x: number;
  y: number;
  width: number;
  height: number;
  backgroundColor?: string;
  borderStyle?: BorderStyleName;
  borderColor?: string;
}

export interface DrawTextCommand extends DrawCommandBase {
  type: 'text';
  x: number;
  y: number;
  maxWidth: number;
  text: string;
  style: TextStyle;
  inheritedBackgroundColor?: string;
}

export interface DrawTerminalImageCommand extends DrawCommandBase {
  type: 'terminal-image';
  x: number;
  y: number;
  width: number;
  height: number;
  source: TerminalImageSource;
  fit: NonNullable<ImageOptions['fit']>;
  threshold?: number;
  dither?: boolean;
  preserveAspectRatio?: boolean;
  protocol: GraphicsProtocol;
  cellRender: boolean;
  protocolState?: TerminalImageProtocolState;
}

export type DrawCommand = DrawBoxCommand | DrawTextCommand | DrawTerminalImageCommand;

type CachedDrawBoxCommand = Omit<DrawBoxCommand, 'order'>;
type CachedDrawTextCommand = Omit<DrawTextCommand, 'order'>;
type CachedDrawTerminalImageCommand = Omit<DrawTerminalImageCommand, 'order'>;
type CachedDrawCommand = CachedDrawBoxCommand | CachedDrawTextCommand | CachedDrawTerminalImageCommand;

export type QueryStatus = 'found' | 'missing' | 'ambiguous';

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ReservedRegion extends Bounds {
  type: 'terminal-image';
  id?: string;
  protocol: GraphicsProtocol;
}

export interface ElementQueryResult {
  id: string;
  status: QueryStatus;
  found: boolean;
  ambiguous: boolean;
  bounds?: Bounds;
  nodeType?: string;
}

export interface ScrollQueryControls {
  scrollTo(offset: { x?: number; y?: number }): void;
  scrollBy(delta: { x?: number; y?: number }): void;
  scrollToStart(): void;
  scrollToEnd(): void;
}

export interface ScrollQueryResult {
  id: string;
  status: QueryStatus;
  found: boolean;
  ambiguous: boolean;
  viewport?: { width: number; height: number };
  content?: { width: number; height: number };
  offset?: { x: number; y: number };
  maxOffset?: { x: number; y: number };
  nodeType?: string;
  controls?: ScrollQueryControls;
}

export interface FrameQueries {
  getElement(id: string): ElementQueryResult;
  pointerOver(id: string): boolean;
  getScrollContainer(id: string): ScrollQueryResult;
}

export interface FrameSnapshot {
  info: FrameInfo;
  input: FrameInput;
  root: VNode;
  layout: LayoutNode;
  drawCommands: DrawCommand[];
  reservedRegions: ReservedRegion[];
  hitTargets: ElementBounds[];
  queries: FrameQueries;
  warnings: RuntimeWarning[];
  metrics: FrameMetrics;
}

let nextFrameId = 1;
let committedFrameSnapshot: FrameSnapshot | null = null;

const DEFAULT_FRAME_SNAPSHOT_OPTIONS: Required<FrameSnapshotOptions> = {
  eagerHitTargets: true,
  eagerQueries: true,
  eagerWarnings: true,
};

interface IndexedFrameElement {
  id: string;
  bounds: Bounds;
  nodeType: string;
}

interface ScrollQueryMetadata {
  getViewport(): { width?: number; height?: number };
  getContent(): { width?: number; height?: number };
  getOffset(): { x: number; y: number };
  getMaxOffset(): { x: number; y: number };
  scrollTo(offset: { x?: number; y?: number }): void;
  scrollBy(delta: { x?: number; y?: number }): void;
  scrollToStart(): void;
  scrollToEnd(): void;
}

interface IndexedScrollContainer {
  id: string;
  bounds: Bounds;
  nodeType: string;
  metadata: ScrollQueryMetadata;
}

type ElementQueryIndex = Map<string, IndexedFrameElement[]>;
type ScrollQueryIndex = Map<string, IndexedScrollContainer[]>;

interface DrawCommandCacheEntry {
  cacheKey: string;
  commands: CachedDrawCommand[];
  materialized?: DrawCommand[];
}

interface TerminalImageNodeMetadata {
  source: ImageData | TerminalImageSource;
  protocolState?: TerminalImageProtocolState;
  options?: (ImageOptions & { protocol?: GraphicsProtocol }) | undefined;
}

let drawCommandCache = new WeakMap<LayoutNode, DrawCommandCacheEntry>();

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function cloneFrameInput(input: FrameInput): FrameInput {
  return {
    width: input.width,
    height: input.height,
    pointer: input.pointer ? { ...input.pointer } : undefined,
    scrollDelta: input.scrollDelta ? { ...input.scrollDelta } : undefined,
    deltaTimeMs: input.deltaTimeMs,
  };
}

function resolveFrameSnapshotOptions(
  options?: FrameSnapshotOptions,
): Required<FrameSnapshotOptions> {
  return {
    eagerHitTargets: options?.eagerHitTargets ?? DEFAULT_FRAME_SNAPSHOT_OPTIONS.eagerHitTargets,
    eagerQueries: options?.eagerQueries ?? DEFAULT_FRAME_SNAPSHOT_OPTIONS.eagerQueries,
    eagerWarnings: options?.eagerWarnings ?? DEFAULT_FRAME_SNAPSHOT_OPTIONS.eagerWarnings,
  };
}

function clearDrawCommandCache(): void {
  drawCommandCache = new WeakMap<LayoutNode, DrawCommandCacheEntry>();
}

function buildElementQueryIndex(layout: LayoutNode): ElementQueryIndex {
  const index: ElementQueryIndex = new Map();

  const visit = (current: LayoutNode, offsetX = 0, offsetY = 0): void => {
    const { node, x, y, width, height, children } = current;
    const absX = offsetX + x;
    const absY = offsetY + y;
    const props = node.props as BoxStyle & { id?: string };
    const id = typeof props.id === 'string' ? props.id : undefined;

    if (id && id.length > 0) {
      const entries = index.get(id) ?? [];
      entries.push({
        id,
        nodeType: node.type,
        bounds: {
          x: absX,
          y: absY,
          width,
          height,
        },
      });
      index.set(id, entries);
    }

    const paddingTop = props.paddingTop ?? props.paddingY ?? props.padding ?? 0;
    const paddingLeft = props.paddingLeft ?? props.paddingX ?? props.padding ?? 0;
    const borderSize = props.borderStyle && props.borderStyle !== 'none' ? 1 : 0;
    const contentOffsetX = absX + paddingLeft + borderSize;
    const contentOffsetY = absY + paddingTop + borderSize;

    for (const child of children) {
      visit(child, contentOffsetX, contentOffsetY);
    }
  };

  visit(layout);

  return index;
}

function isScrollQueryMetadata(value: unknown): value is ScrollQueryMetadata {
  return !!(
    value &&
    typeof value === 'object' &&
    typeof (value as ScrollQueryMetadata).getViewport === 'function' &&
    typeof (value as ScrollQueryMetadata).getContent === 'function' &&
    typeof (value as ScrollQueryMetadata).getOffset === 'function' &&
    typeof (value as ScrollQueryMetadata).getMaxOffset === 'function' &&
    typeof (value as ScrollQueryMetadata).scrollTo === 'function' &&
    typeof (value as ScrollQueryMetadata).scrollBy === 'function' &&
    typeof (value as ScrollQueryMetadata).scrollToStart === 'function' &&
    typeof (value as ScrollQueryMetadata).scrollToEnd === 'function'
  );
}

function buildScrollQueryIndex(layout: LayoutNode): ScrollQueryIndex {
  const index: ScrollQueryIndex = new Map();

  const visit = (current: LayoutNode, offsetX = 0, offsetY = 0): void => {
    const { node, x, y, width, height, children } = current;
    const absX = offsetX + x;
    const absY = offsetY + y;
    const props = node.props as BoxStyle & { id?: string; __scrollQuery?: unknown };
    const id = typeof props.id === 'string' ? props.id : undefined;

    if (id && id.length > 0 && isScrollQueryMetadata(props.__scrollQuery)) {
      const entries = index.get(id) ?? [];
      entries.push({
        id,
        nodeType: node.type,
        bounds: {
          x: absX,
          y: absY,
          width,
          height,
        },
        metadata: props.__scrollQuery,
      });
      index.set(id, entries);
    }

    const paddingTop = props.paddingTop ?? props.paddingY ?? props.padding ?? 0;
    const paddingLeft = props.paddingLeft ?? props.paddingX ?? props.padding ?? 0;
    const borderSize = props.borderStyle && props.borderStyle !== 'none' ? 1 : 0;
    const contentOffsetX = absX + paddingLeft + borderSize;
    const contentOffsetY = absY + paddingTop + borderSize;

    for (const child of children) {
      visit(child, contentOffsetX, contentOffsetY);
    }
  };

  visit(layout);

  return index;
}

function collectDuplicateIdWarnings(index: ElementQueryIndex): RuntimeWarning[] {
  const warnings: RuntimeWarning[] = [];

  for (const [id, entries] of index) {
    if (entries.length > 1) {
      warnings.push({
        code: 'duplicate-id',
        severity: 'warning',
        id,
        message: `Duplicate explicit id "${id}" was found ${entries.length} times in the committed frame.`,
      });
    }
  }

  return warnings;
}

function recordWarning(
  warnings: RuntimeWarning[],
  metrics: FrameMetrics,
  warning: RuntimeWarning,
): void {
  const exists = warnings.some((entry) => entry.code === warning.code && entry.id === warning.id);
  if (exists) {
    return;
  }

  warnings.push(warning);
  metrics.structural.warningCount = warnings.length;
}

function createElementQueryResult(
  getIndex: () => ElementQueryIndex,
  id: string,
): ElementQueryResult {
  const entries = getIndex().get(id) ?? [];

  if (entries.length === 0) {
    return {
      id,
      status: 'missing',
      found: false,
      ambiguous: false,
    };
  }

  if (entries.length > 1) {
    return {
      id,
      status: 'ambiguous',
      found: false,
      ambiguous: true,
    };
  }

  const [entry] = entries;
  return {
    id,
    status: 'found',
    found: true,
    ambiguous: false,
    bounds: entry.bounds,
    nodeType: entry.nodeType,
  };
}

function createScrollQueryResult(
  getIndex: () => ScrollQueryIndex,
  id: string,
): ScrollQueryResult {
  const entries = getIndex().get(id) ?? [];

  if (entries.length === 0) {
    return {
      id,
      status: 'missing',
      found: false,
      ambiguous: false,
    };
  }

  if (entries.length > 1) {
    return {
      id,
      status: 'ambiguous',
      found: false,
      ambiguous: true,
    };
  }

  const [entry] = entries;
  const viewportMeta = entry.metadata.getViewport();
  const contentMeta = entry.metadata.getContent();
  const offset = entry.metadata.getOffset();
  const maxOffset = entry.metadata.getMaxOffset();

  return {
    id,
    status: 'found',
    found: true,
    ambiguous: false,
    nodeType: entry.nodeType,
    viewport: {
      width: viewportMeta.width ?? entry.bounds.width,
      height: viewportMeta.height ?? entry.bounds.height,
    },
    content: {
      width: contentMeta.width ?? viewportMeta.width ?? entry.bounds.width,
      height: contentMeta.height ?? viewportMeta.height ?? entry.bounds.height,
    },
    offset,
    maxOffset,
    controls: {
      scrollTo: (nextOffset) => entry.metadata.scrollTo(nextOffset),
      scrollBy: (delta) => entry.metadata.scrollBy(delta),
      scrollToStart: () => entry.metadata.scrollToStart(),
      scrollToEnd: () => entry.metadata.scrollToEnd(),
    },
  };
}

function createFrameQueries(
  getElementIndex: () => ElementQueryIndex,
  getScrollIndex: () => ScrollQueryIndex,
  input: FrameInput,
  warnings: RuntimeWarning[],
  metrics: FrameMetrics,
): FrameQueries {
  return {
    getElement: (id: string) => {
      const result = createElementQueryResult(getElementIndex, id);

      if (result.status === 'missing') {
        recordWarning(warnings, metrics, {
          code: 'query-missing',
          severity: 'warning',
          id,
          message: `Element query for explicit id "${id}" did not match any committed element in the current frame.`,
        });
      } else if (result.status === 'ambiguous') {
        recordWarning(warnings, metrics, {
          code: 'query-ambiguous',
          severity: 'warning',
          id,
          message: `Element query for explicit id "${id}" matched multiple committed elements in the current frame.`,
        });
      }

      return result;
    },
    pointerOver: (id: string) => {
      if (!input.pointer) {
        return false;
      }

      const result = createElementQueryResult(getElementIndex, id);
      if (!result.found || !result.bounds) {
        if (result.status === 'missing') {
          recordWarning(warnings, metrics, {
            code: 'query-missing',
            severity: 'warning',
            id,
            message: `Pointer-over query for explicit id "${id}" did not match any committed element in the current frame.`,
          });
        } else if (result.status === 'ambiguous') {
          recordWarning(warnings, metrics, {
            code: 'query-ambiguous',
            severity: 'warning',
            id,
            message: `Pointer-over query for explicit id "${id}" matched multiple committed elements in the current frame.`,
          });
        }
        return false;
      }

      return (
        input.pointer.x >= result.bounds.x &&
        input.pointer.x < result.bounds.x + result.bounds.width &&
        input.pointer.y >= result.bounds.y &&
        input.pointer.y < result.bounds.y + result.bounds.height
      );
    },
    getScrollContainer: (id: string) => {
      const result = createScrollQueryResult(getScrollIndex, id);

      if (result.status === 'missing') {
        recordWarning(warnings, metrics, {
          code: 'scroll-target-missing',
          severity: 'warning',
          id,
          message: `Scroll-container query for explicit id "${id}" did not match any committed scroll target in the current frame.`,
        });
      } else if (result.status === 'ambiguous') {
        recordWarning(warnings, metrics, {
          code: 'query-ambiguous',
          severity: 'warning',
          id,
          message: `Scroll-container query for explicit id "${id}" matched multiple committed scroll targets in the current frame.`,
        });
      }

      return result;
    },
  };
}

function createDrawCommandCacheKey(
  offsetX: number,
  offsetY: number,
  parentBackgroundColor?: string,
): string {
  return `${offsetX}:${offsetY}:${parentBackgroundColor ?? ''}`;
}

function getCachedDrawCommandEntry(
  layout: LayoutNode,
  cacheKey: string,
): DrawCommandCacheEntry | undefined {
  const cached = drawCommandCache.get(layout);
  if (!cached || cached.cacheKey !== cacheKey) {
    return undefined;
  }
  return cached;
}

function setCachedDrawCommandEntry(
  layout: LayoutNode,
  cacheKey: string,
  commands: CachedDrawCommand[],
): DrawCommandCacheEntry {
  const entry: DrawCommandCacheEntry = {
    cacheKey,
    commands,
  };
  drawCommandCache.set(layout, entry);
  return entry;
}

function materializeDrawCommands(commands: CachedDrawCommand[]): DrawCommand[] {
  return commands.map((command, order) => ({ ...command, order })) as DrawCommand[];
}

function appendCachedDrawCommands(
  target: CachedDrawCommand[],
  source: readonly CachedDrawCommand[],
): void {
  for (const command of source) {
    target.push(command);
  }
}

function isTerminalImageSourceLike(value: ImageData | TerminalImageSource): value is TerminalImageSource {
  return 'desiredColumns' in value && 'desiredRows' in value && 'hash' in value;
}

function isTerminalImageNodeMetadata(value: unknown): value is TerminalImageNodeMetadata {
  return !!(
    value &&
    typeof value === 'object' &&
    'source' in value &&
    value.source &&
    typeof (value as TerminalImageNodeMetadata).source === 'object'
  );
}

function createTerminalImageCommand(
  current: LayoutNode,
  absX: number,
  absY: number,
  width: number,
  height: number,
  props: BoxStyle & TextStyle & { children?: string; id?: string; __terminalImage?: unknown },
): CachedDrawTerminalImageCommand | null {
  if (!isTerminalImageNodeMetadata(props.__terminalImage)) {
    return null;
  }

  const paddingTop = props.paddingTop ?? props.paddingY ?? props.padding ?? 0;
  const paddingBottom = props.paddingBottom ?? props.paddingY ?? props.padding ?? 0;
  const paddingLeft = props.paddingLeft ?? props.paddingX ?? props.padding ?? 0;
  const paddingRight = props.paddingRight ?? props.paddingX ?? props.padding ?? 0;
  const borderSize = props.borderStyle && props.borderStyle !== 'none' ? 1 : 0;
  const contentX = absX + paddingLeft + borderSize;
  const contentY = absY + paddingTop + borderSize;
  const contentWidth = Math.max(0, width - paddingLeft - paddingRight - borderSize * 2);
  const contentHeight = Math.max(0, height - paddingTop - paddingBottom - borderSize * 2);

  if (contentWidth <= 0 || contentHeight <= 0) {
    return null;
  }

  const metadata = props.__terminalImage;
  const graphicsCapabilities = getGraphicsCapabilities();
  const source = isTerminalImageSourceLike(metadata.source)
    ? metadata.source
    : createTerminalImageSource(metadata.source, { cellSize: graphicsCapabilities.cellSize });
  const requestedProtocol = metadata.options?.protocol ?? graphicsCapabilities.protocol;
  const protocol = resolveRenderableGraphicsProtocol(requestedProtocol);
  const plan = planImageRender(source, {
    ...metadata.options,
    width: metadata.options?.width ?? contentWidth,
    height: metadata.options?.height ?? contentHeight,
  });
  const renderWidth = Math.max(0, Math.min(contentWidth, plan.renderColumns));
  const renderHeight = Math.max(0, Math.min(contentHeight, plan.renderRows));

  if (renderWidth <= 0 || renderHeight <= 0) {
    return null;
  }

  return {
    type: 'terminal-image',
    id: typeof props.id === 'string' ? props.id : undefined,
    nodeType: current.node.type,
    x: contentX,
    y: contentY,
    width: renderWidth,
    height: renderHeight,
    source,
    fit: plan.fit,
    threshold: metadata.options?.threshold,
    dither: metadata.options?.dither,
    preserveAspectRatio: metadata.options?.preserveAspectRatio,
    protocol,
    cellRender: isCellGraphicsProtocol(protocol),
    protocolState: metadata.protocolState,
  };
}

function buildReservedRegions(drawCommands: readonly DrawCommand[]): ReservedRegion[] {
  return drawCommands.flatMap((command) => {
    if (command.type !== 'terminal-image' || command.cellRender) {
      return [];
    }

    return [{
      type: 'terminal-image' as const,
      id: command.id,
      protocol: command.protocol,
      x: command.x,
      y: command.y,
      width: command.width,
      height: command.height,
    }];
  });
}

function buildCachedDrawCommands(
  current: LayoutNode,
  offsetX = 0,
  offsetY = 0,
  parentBackgroundColor?: string,
): CachedDrawCommand[] {
  const { node, x, y, width, height, children } = current;
  const absX = offsetX + x;
  const absY = offsetY + y;
  const props = node.props as BoxStyle & TextStyle & {
    children?: string;
    id?: string;
    __terminalImage?: unknown;
  };
  const imageCommand = createTerminalImageCommand(current, absX, absY, width, height, props);
  const imageCacheKey =
    imageCommand
      ? `:${imageCommand.protocol}:${imageCommand.source.hash}:${imageCommand.width}x${imageCommand.height}:${imageCommand.fit}:${imageCommand.threshold ?? ''}:${imageCommand.dither ? 1 : 0}:${imageCommand.preserveAspectRatio ? 1 : 0}`
      : '';
  const cacheKey = createDrawCommandCacheKey(offsetX, offsetY, parentBackgroundColor) + imageCacheKey;
  const cached = getCachedDrawCommandEntry(current, cacheKey);
  if (cached) {
    return cached.commands;
  }

  const commands: CachedDrawCommand[] = [];
  const id = typeof props.id === 'string' ? props.id : undefined;
  const backgroundColor =
    typeof props.backgroundColor === 'string' ? props.backgroundColor : undefined;

  if (node.type === 'box' && (backgroundColor || (props.borderStyle && props.borderStyle !== 'none'))) {
    commands.push({
      type: 'box',
      id,
      nodeType: node.type,
      x: absX,
      y: absY,
      width,
      height,
      backgroundColor,
      borderStyle: props.borderStyle,
      borderColor: typeof props.borderColor === 'string' ? props.borderColor : undefined,
    });
  } else if (node.type === 'text') {
    commands.push({
      type: 'text',
      id,
      nodeType: node.type,
      x: absX,
      y: absY,
      maxWidth: width,
      text: String(props.children ?? ''),
      style: {
        color: props.color,
        backgroundColor: props.backgroundColor,
        bold: props.bold,
        dim: props.dim,
        italic: props.italic,
        underline: props.underline,
        strikethrough: props.strikethrough,
        inverse: props.inverse,
        wrap: props.wrap,
      },
      inheritedBackgroundColor: parentBackgroundColor,
    });
  }

  if (imageCommand) {
    commands.push(imageCommand);
  }

  const paddingTop = props.paddingTop ?? props.paddingY ?? props.padding ?? 0;
  const paddingLeft = props.paddingLeft ?? props.paddingX ?? props.padding ?? 0;
  const borderSize = props.borderStyle && props.borderStyle !== 'none' ? 1 : 0;
  const contentOffsetX = absX + paddingLeft + borderSize;
  const contentOffsetY = absY + paddingTop + borderSize;
  const nextBackgroundColor = backgroundColor ?? parentBackgroundColor;

  for (const child of children) {
    appendCachedDrawCommands(
      commands,
      buildCachedDrawCommands(child, contentOffsetX, contentOffsetY, nextBackgroundColor),
    );
  }

  return setCachedDrawCommandEntry(current, cacheKey, commands).commands;
}

function buildDrawCommands(layout: LayoutNode): DrawCommand[] {
  const cached = drawCommandCache.get(layout);

  if (cached?.materialized) {
    return cached.materialized;
  }

  const cachedCommands = buildCachedDrawCommands(layout);
  const materialized = materializeDrawCommands(cachedCommands);
  const entry = drawCommandCache.get(layout);

  if (entry) {
    entry.materialized = materialized;
  }

  return materialized;
}

export function createFrameSnapshot(
  node: VNode,
  input: FrameInput,
  options: FrameSnapshotOptions = {},
): FrameSnapshot {
  const resolvedOptions = resolveFrameSnapshotOptions(options);
  const committedInput = cloneFrameInput(input);
  const frameStartAt = Date.now();
  const framePerfStart = now();

  const layoutStart = now();
  const layout = calculateLayout(node, committedInput.width, committedInput.height);
  const layoutMs = now() - layoutStart;

  const drawCommandStart = now();
  const drawCommands = buildDrawCommands(layout);
  const reservedRegions = buildReservedRegions(drawCommands);
  const drawCommandMs = now() - drawCommandStart;

  const metrics: FrameMetrics = {
    frameStartAt,
    frameEndAt: Date.now(),
    totalFrameMs: 0,
    phases: {
      layoutMs,
      drawCommandMs,
    },
    structural: {
      drawCommandCount: drawCommands.length,
      hitTargetCount: 0,
      warningCount: 0,
    },
  };
  let elementIndex: ElementQueryIndex | undefined;
  let scrollIndex: ScrollQueryIndex | undefined;
  let hitTargets: ElementBounds[] | undefined;
  const warnings: RuntimeWarning[] = [];
  let duplicateWarningsCollected = false;

  const ensureElementIndex = (): ElementQueryIndex => {
    if (!elementIndex) {
      elementIndex = buildElementQueryIndex(layout);
    }
    return elementIndex;
  };

  const ensureScrollIndex = (): ScrollQueryIndex => {
    if (!scrollIndex) {
      scrollIndex = buildScrollQueryIndex(layout);
    }
    return scrollIndex;
  };

  const ensureHitTargets = (): ElementBounds[] => {
    if (!hitTargets) {
      const hitTargetStart = now();
      hitTargets = collectHitTestTargetsFromLayout(layout);
      metrics.phases.hitTargetRegistrationMs = now() - hitTargetStart;
      metrics.structural.hitTargetCount = hitTargets.length;
    }
    return hitTargets;
  };

  const ensureDuplicateWarnings = (): RuntimeWarning[] => {
    if (!duplicateWarningsCollected) {
      warnings.push(...collectDuplicateIdWarnings(ensureElementIndex()));
      duplicateWarningsCollected = true;
      metrics.structural.warningCount = warnings.length;
    }
    return warnings;
  };

  if (resolvedOptions.eagerQueries) {
    ensureElementIndex();
    ensureScrollIndex();
  }

  if (resolvedOptions.eagerWarnings) {
    ensureDuplicateWarnings();
  }

  if (resolvedOptions.eagerHitTargets) {
    ensureHitTargets();
  }

  const queries = createFrameQueries(
    ensureElementIndex,
    ensureScrollIndex,
    committedInput,
    warnings,
    metrics,
  );
  const frameEndAt = Date.now();
  const totalFrameMs = now() - framePerfStart;
  metrics.frameEndAt = frameEndAt;
  metrics.totalFrameMs = totalFrameMs;

  const frame: FrameSnapshot = {
    info: {
      frameId: nextFrameId++,
      committedAt: frameEndAt,
      viewport: {
        width: committedInput.width,
        height: committedInput.height,
      },
    },
    input: committedInput,
    root: node,
    layout,
    drawCommands,
    reservedRegions,
    queries,
    metrics,
    get hitTargets() {
      return ensureHitTargets();
    },
    get warnings() {
      return ensureDuplicateWarnings();
    },
  };

  return frame;
}

export function setCommittedFrameSnapshot(frame: FrameSnapshot | null): void {
  committedFrameSnapshot = frame;
}

export function getCommittedFrameSnapshot(): FrameSnapshot | null {
  return committedFrameSnapshot;
}

export function getCommittedFrameQueries(): FrameQueries | null {
  return committedFrameSnapshot?.queries ?? null;
}

export function clearCommittedFrameSnapshot(): void {
  committedFrameSnapshot = null;
}

export function recordFramePhaseMetric(
  frame: FrameSnapshot,
  phase: keyof FramePhaseMetrics,
  durationMs: number,
): void {
  frame.metrics.phases[phase] = durationMs;
  frame.metrics.frameEndAt = Date.now();
  frame.metrics.totalFrameMs = Math.max(0, frame.metrics.frameEndAt - frame.metrics.frameStartAt);
}

export function resetFrameSequenceForTesting(): void {
  nextFrameId = 1;
  clearCommittedFrameSnapshot();
  clearDrawCommandCache();
}
