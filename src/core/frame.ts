import { calculateLayout, clearTextMeasureCache } from './layout.js';
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
import {
  applyCompositor,
  fingerprintCompositorBinding,
  isCompositorBindingMetadata,
  type BoundCompositorMetadata,
  type CompositorBindingMetadata,
} from './compositor.js';
import { getMotionRuntimeState } from './motion-runtime.js';
import {
  canReuseSubtree,
  getDirtyDiagnostics,
  markDirty,
  noteDirtyFresh,
  noteDirtyReuse,
  resetDirtyRegistry,
  DirtyFlags,
} from './dirty.js';
import { fingerprintValue } from './structural-fingerprint.js';
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
  frameCommitMs?: number;
  staticRenderMs?: number;
  ansiRenderMs?: number;
  deltaRenderMs?: number;
  outputWriteMs?: number;
}

export interface FrameStructuralMetrics {
  drawCommandCount: number;
  hitTargetCount: number;
  warningCount: number;
  reservedRegionCount: number;
  patchCount: number;
  dirtyRectCount: number;
  diffRectCount: number;
  outputByteCount: number;
  layoutReuseCount: number;
  layoutFreshCount: number;
  drawReuseCount: number;
  drawFreshCount: number;
  invalidationEscalationCount: number;
  absorbedLayoutDirtyCount: number;
}

export interface FrameMetrics {
  frameStartAt: number;
  frameEndAt: number;
  totalFrameMs: number;
  runtimeStartAt?: number;
  runtimeEndAt?: number;
  runtimeTotalMs?: number;
  phases: FramePhaseMetrics;
  structural: FrameStructuralMetrics;
}

export interface DrawCommandBase {
  type: DrawCommand['type'];
  order: number;
  zIndex?: number;
  id?: string;
  nodeType?: string;
  compositorKeys?: string[];
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
  /** Per-side border visibility (all true if omitted) */
  borderSides?: { top?: boolean; bottom?: boolean; left?: boolean; right?: boolean };
  /** Text to display inline in the top border */
  borderText?: string;
}

export interface DrawTextCommand extends DrawCommandBase {
  type: 'text';
  x: number;
  y: number;
  maxWidth: number;
  text: string;
  style: TextStyle;
  inheritedBackgroundColor?: string;
  /** When true, text contains pre-built ANSI and should skip style encoding */
  prebuiltAnsi?: boolean;
}

export interface DrawTerminalImageCommand extends DrawCommandBase {
  type: 'terminal-image';
  x: number;
  y: number;
  width: number;
  height: number;
  instanceKey?: string;
  kittyImageId?: number;
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
const DRAW_FINGERPRINT_IGNORE_KEYS = new Set(['__terminalImage', '__compositor']);
const BOX_DRAW_KEYS = new Set([
  'id',
  'backgroundColor',
  'borderStyle',
  'borderColor',
]);
const TEXT_DRAW_KEYS = new Set([
  'id',
  'children',
  'color',
  'backgroundColor',
  'bold',
  'dim',
  'italic',
  'underline',
  'strikethrough',
  'inverse',
  'wrap',
]);

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
  fingerprint: string;
  childRefs: VNode[];
  commands: CachedDrawCommand[];
  hasCompositor: boolean;
  materialized?: DrawCommand[];
  subtreeSignature: string;
  materializedSignature?: string;
}

interface StructuralDrawCommandCacheEntry {
  commands: CachedDrawCommand[];
  hasCompositor: boolean;
  materialized?: DrawCommand[];
  materializedSignature?: string;
}

interface TerminalImageNodeMetadata {
  source: ImageData | TerminalImageSource;
  protocolState?: TerminalImageProtocolState;
  options?: (ImageOptions & { protocol?: GraphicsProtocol }) | undefined;
}

interface CompositorNodeMetadata extends CompositorBindingMetadata {}

let drawCommandCache = new WeakMap<LayoutNode, DrawCommandCacheEntry>();
let structuralDrawCommandCache = new Map<string, StructuralDrawCommandCacheEntry>();
const STRUCTURAL_DRAW_COMMAND_CACHE_MAX = 4096;

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
  structuralDrawCommandCache = new Map<string, StructuralDrawCommandCacheEntry>();
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
  activeCompositorKeys: readonly string[] = [],
): string {
  const compositorKeySignature = activeCompositorKeys.length > 0
    ? fingerprintValue(activeCompositorKeys)
    : '';
  return `${offsetX}:${offsetY}:${parentBackgroundColor ?? ''}:${compositorKeySignature}`;
}

function createDrawCommandFingerprint(
  node: VNode,
  imageCommand: CachedDrawTerminalImageCommand | null,
): string {
  const sourceKeys = node.type === 'text' ? TEXT_DRAW_KEYS : BOX_DRAW_KEYS;
  const rawProps = node.props as Record<string, unknown> | undefined;
  const filteredProps: Record<string, unknown> = {};

  if (rawProps) {
    for (const key of sourceKeys) {
      if (key in rawProps) {
        filteredProps[key] = rawProps[key];
      }
    }
  }

  return fingerprintValue({
    type: node.type,
    props: filteredProps,
    image: imageCommand
      ? {
          protocol: imageCommand.protocol,
          hash: imageCommand.source.hash,
          width: imageCommand.width,
          height: imageCommand.height,
          instanceKey: imageCommand.instanceKey,
          kittyImageId: imageCommand.kittyImageId,
          fit: imageCommand.fit,
          threshold: imageCommand.threshold,
          dither: imageCommand.dither,
          preserveAspectRatio: imageCommand.preserveAspectRatio,
        }
      : null,
  }, {
    ignoreKeys: DRAW_FINGERPRINT_IGNORE_KEYS,
  });
}

function composeSubtreeSignature(
  current: LayoutNode,
  cacheKey: string,
  baseFingerprint: string,
  compositor: CompositorNodeMetadata | null,
  compositorKeys: readonly string[],
  childSignatures: readonly string[],
): string {
  return fingerprintValue([
    cacheKey,
    baseFingerprint,
    fingerprintCompositorBinding(compositor) ?? '',
    compositorKeys.length,
    ...compositorKeys,
    current.x,
    current.y,
    current.width,
    current.height,
    childSignatures.length,
    ...childSignatures,
  ]);
}

function getCachedDrawCommandEntry(
  layout: LayoutNode,
  cacheKey: string,
  getFingerprint: () => string,
): DrawCommandCacheEntry | undefined {
  if (!canReuseSubtree(layout.node)) {
    return undefined;
  }

  const cached = drawCommandCache.get(layout);
  if (!cached) {
    return undefined;
  }

  if (cached.cacheKey !== cacheKey) {
    markDirty(layout.node, DirtyFlags.LAYOUT);
    return undefined;
  }

  const fingerprint = getFingerprint();
  if (cached.fingerprint !== fingerprint) {
    markDirty(layout.node, DirtyFlags.CONTENT | DirtyFlags.STYLE);
    return undefined;
  }

  if (cached.childRefs.length !== layout.node.children.length) {
    markDirty(layout.node, DirtyFlags.CHILDREN);
    return undefined;
  }

  for (let index = 0; index < cached.childRefs.length; index++) {
    if (cached.childRefs[index] !== layout.node.children[index]) {
      markDirty(layout.node, DirtyFlags.CHILDREN);
      return undefined;
    }
  }

  return cached;
}

function setCachedDrawCommandEntry(
  layout: LayoutNode,
  cacheKey: string,
  fingerprint: string,
  commands: CachedDrawCommand[],
  hasCompositor: boolean,
  subtreeSignature: string,
): DrawCommandCacheEntry {
  const entry: DrawCommandCacheEntry = {
    cacheKey,
    fingerprint,
    childRefs: [...layout.node.children],
    commands,
    hasCompositor,
    subtreeSignature,
  };
  drawCommandCache.set(layout, entry);
  return entry;
}

function materializeDrawCommands(commands: CachedDrawCommand[]): DrawCommand[] {
  return commands.map((command, order) => ({ ...command, order })) as DrawCommand[];
}

function getMaterializedDrawCommandSignature(
  subtreeSignature: string,
  hasCompositor: boolean,
): string {
  if (!hasCompositor) {
    return subtreeSignature;
  }

  return `${subtreeSignature}|motion:${getMotionRuntimeState().qualityTier}`;
}

function evictStructuralDrawCommandCacheEntries(): void {
  const toRemove = Math.max(1, Math.ceil(STRUCTURAL_DRAW_COMMAND_CACHE_MAX * 0.1));
  const keys = structuralDrawCommandCache.keys();

  for (let index = 0; index < toRemove; index++) {
    const next = keys.next();
    if (next.done) {
      break;
    }
    structuralDrawCommandCache.delete(next.value);
  }
}

function getStructuralDrawCommandEntry(signature: string): StructuralDrawCommandCacheEntry | undefined {
  return structuralDrawCommandCache.get(signature);
}

function setStructuralDrawCommandEntry(
  signature: string,
  commands: CachedDrawCommand[],
  hasCompositor: boolean,
): StructuralDrawCommandCacheEntry {
  const existing = structuralDrawCommandCache.get(signature);
  const entry: StructuralDrawCommandCacheEntry = {
    commands,
    hasCompositor,
    materialized: existing?.materialized,
    materializedSignature: existing?.materializedSignature,
  };

  if (!structuralDrawCommandCache.has(signature) && structuralDrawCommandCache.size >= STRUCTURAL_DRAW_COMMAND_CACHE_MAX) {
    evictStructuralDrawCommandCacheEntries();
  }

  structuralDrawCommandCache.set(signature, entry);
  return entry;
}

function cacheMaterializedStructuralDrawCommands(
  signature: string,
  materialized: DrawCommand[],
  materializedSignature: string,
): void {
  const entry = structuralDrawCommandCache.get(signature);
  if (!entry) {
    return;
  }

  entry.materialized = materialized;
  entry.materializedSignature = materializedSignature;
}

function appendCachedDrawCommands(
  target: CachedDrawCommand[],
  source: readonly CachedDrawCommand[],
): void {
  for (const command of source) {
    target.push(command);
  }
}

interface CachedDrawCommandBuildResult {
  commands: CachedDrawCommand[];
  hasCompositor: boolean;
  subtreeSignature: string;
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

function getCompositorNodeMetadata(node: VNode): CompositorNodeMetadata | null {
  const props = node.props as { __compositor?: unknown } | undefined;
  return isCompositorBindingMetadata(props?.__compositor) ? props.__compositor : null;
}

function collectCompositorBindings(
  layout: LayoutNode,
  bindings: Map<string, BoundCompositorMetadata> = new Map(),
): Map<string, BoundCompositorMetadata> {
  const binding = getCompositorNodeMetadata(layout.node);
  if (binding) {
    bindings.set(binding.key, {
      ...binding,
      bounds: {
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
      },
    });
  }

  for (const child of layout.children) {
    collectCompositorBindings(child, bindings);
  }

  return bindings;
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
    instanceKey: metadata.protocolState?.instanceKey,
    kittyImageId: metadata.protocolState?.kittyImageId,
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
  activeCompositorKeys: readonly string[] = [],
): CachedDrawCommandBuildResult {
  const { node, x, y, width, height, children } = current;
  const absX = offsetX + x;
  const absY = offsetY + y;
  const props = node.props as BoxStyle & TextStyle & {
    children?: string;
    id?: string;
    __terminalImage?: unknown;
    __prebuiltAnsi?: boolean;
  };
  const compositor = getCompositorNodeMetadata(node);
  const compositorKeys = compositor
    ? [...activeCompositorKeys, compositor.key]
    : [...activeCompositorKeys];
  let hasCompositor = compositor !== null;
  const imageCommand = createTerminalImageCommand(current, absX, absY, width, height, props);
  const imageCacheKey =
    imageCommand
      ? `:${imageCommand.protocol}:${imageCommand.source.hash}:${imageCommand.width}x${imageCommand.height}:${imageCommand.fit}:${imageCommand.threshold ?? ''}:${imageCommand.dither ? 1 : 0}:${imageCommand.preserveAspectRatio ? 1 : 0}`
      : '';
  const cacheKey = createDrawCommandCacheKey(offsetX, offsetY, parentBackgroundColor, compositorKeys) + imageCacheKey;
  let fingerprint: string | undefined;
  const getFingerprint = () => {
    if (fingerprint === undefined) {
      fingerprint = createDrawCommandFingerprint(node, imageCommand);
    }
    return fingerprint;
  };
  const cached = getCachedDrawCommandEntry(current, cacheKey, getFingerprint);
  if (cached) {
    noteDirtyReuse('draw');
    return {
      commands: cached.commands,
      hasCompositor: cached.hasCompositor,
      subtreeSignature: cached.subtreeSignature,
    };
  }

  const resolvedFingerprint = getFingerprint();
  const id = typeof props.id === 'string' ? props.id : undefined;
  const backgroundColor =
    typeof props.backgroundColor === 'string' ? props.backgroundColor : undefined;
  const childResults: CachedDrawCommandBuildResult[] = [];
  const childSignatures: string[] = [];
  const paddingTop = props.paddingTop ?? props.paddingY ?? props.padding ?? 0;
  const paddingLeft = props.paddingLeft ?? props.paddingX ?? props.padding ?? 0;
  const borderSize = props.borderStyle && props.borderStyle !== 'none' ? 1 : 0;
  const contentOffsetX = absX + paddingLeft + borderSize;
  const contentOffsetY = absY + paddingTop + borderSize;
  const nextBackgroundColor = backgroundColor ?? parentBackgroundColor;

  for (const child of children) {
    const childResult = buildCachedDrawCommands(
      child,
      contentOffsetX,
      contentOffsetY,
      nextBackgroundColor,
      compositorKeys,
    );
    childResults.push(childResult);
    hasCompositor ||= childResult.hasCompositor;
    childSignatures.push(childResult.subtreeSignature);
  }

  const subtreeSignature = composeSubtreeSignature(
    current,
    cacheKey,
    resolvedFingerprint,
    compositor,
    compositorKeys,
    childSignatures,
  );
  const structuralCached = getStructuralDrawCommandEntry(subtreeSignature);
  if (structuralCached) {
    noteDirtyReuse('draw');
    const entry = setCachedDrawCommandEntry(
      current,
      cacheKey,
      resolvedFingerprint,
      structuralCached.commands,
      structuralCached.hasCompositor,
      subtreeSignature,
    );

    const materializedSignature = getMaterializedDrawCommandSignature(
      subtreeSignature,
      structuralCached.hasCompositor,
    );
    if (structuralCached.materialized && structuralCached.materializedSignature === materializedSignature) {
      entry.materialized = structuralCached.materialized;
      entry.materializedSignature = materializedSignature;
    }

    return {
      commands: entry.commands,
      hasCompositor: entry.hasCompositor,
      subtreeSignature,
    };
  }

  const commands: CachedDrawCommand[] = [];
  if (node.type === 'box' && (backgroundColor || (props.borderStyle && props.borderStyle !== 'none'))) {
    // Build per-side border visibility flags
    const hasSideOverrides = props.borderTop !== undefined || props.borderBottom !== undefined ||
      props.borderLeft !== undefined || props.borderRight !== undefined;
    const borderSides = hasSideOverrides ? {
      top: props.borderTop ?? true,
      bottom: props.borderBottom ?? true,
      left: props.borderLeft ?? true,
      right: props.borderRight ?? true,
    } : undefined;

    commands.push({
      type: 'box',
      id,
      nodeType: node.type,
      compositorKeys: compositorKeys.length > 0 ? [...compositorKeys] : undefined,
      x: absX,
      y: absY,
      width,
      height,
      backgroundColor,
      borderStyle: props.borderStyle,
      borderColor: typeof props.borderColor === 'string' ? props.borderColor : undefined,
      borderSides,
      borderText: typeof props.borderText === 'string' ? props.borderText : undefined,
    });
  } else if (node.type === 'text') {
    commands.push({
      type: 'text',
      id,
      nodeType: node.type,
      compositorKeys: compositorKeys.length > 0 ? [...compositorKeys] : undefined,
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
      ...(props.__prebuiltAnsi ? { prebuiltAnsi: true } : undefined),
    });
  }

  if (imageCommand) {
    commands.push({
      ...imageCommand,
      compositorKeys: compositorKeys.length > 0 ? [...compositorKeys] : undefined,
    });
  }

  for (const childResult of childResults) {
    appendCachedDrawCommands(commands, childResult.commands);
  }

  noteDirtyFresh('draw');
  const entry = setCachedDrawCommandEntry(
    current,
    cacheKey,
    resolvedFingerprint,
    commands,
    hasCompositor,
    subtreeSignature,
  );
  setStructuralDrawCommandEntry(subtreeSignature, entry.commands, hasCompositor);

  return {
    commands: entry.commands,
    hasCompositor,
    subtreeSignature,
  };
}

function buildDrawCommands(layout: LayoutNode): DrawCommand[] {
  const cachedCommands = buildCachedDrawCommands(layout);
  const cached = drawCommandCache.get(layout);
  const materializedSignature = getMaterializedDrawCommandSignature(
    cachedCommands.subtreeSignature,
    cachedCommands.hasCompositor,
  );

  if (cached?.materialized) {
    if (materializedSignature === cached.materializedSignature) {
      return cached.materialized;
    }
    cached.materialized = undefined;
    cached.materializedSignature = undefined;
  }

  const materializedCommands = materializeDrawCommands(cachedCommands.commands);
  const materialized = cachedCommands.hasCompositor
    ? applyCompositor(
      materializedCommands,
      collectCompositorBindings(layout),
    )
    : materializedCommands;
  const entry = drawCommandCache.get(layout);

  if (entry) {
    entry.materialized = materialized;
    entry.materializedSignature = materializedSignature;
  }
  cacheMaterializedStructuralDrawCommands(
    cachedCommands.subtreeSignature,
    materialized,
    materializedSignature,
  );

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
      reservedRegionCount: reservedRegions.length,
      patchCount: 0,
      dirtyRectCount: 0,
      diffRectCount: 0,
      outputByteCount: 0,
      layoutReuseCount: 0,
      layoutFreshCount: 0,
      drawReuseCount: 0,
      drawFreshCount: 0,
      invalidationEscalationCount: 0,
      absorbedLayoutDirtyCount: 0,
    },
  };
  const dirtyDiagnostics = getDirtyDiagnostics();
  metrics.structural.layoutReuseCount = dirtyDiagnostics.layoutReuseCount;
  metrics.structural.layoutFreshCount = dirtyDiagnostics.layoutFreshCount;
  metrics.structural.drawReuseCount = dirtyDiagnostics.drawReuseCount;
  metrics.structural.drawFreshCount = dirtyDiagnostics.drawFreshCount;
  metrics.structural.invalidationEscalationCount = dirtyDiagnostics.invalidationEscalationCount;
  metrics.structural.absorbedLayoutDirtyCount = dirtyDiagnostics.absorbedLayoutDirtyCount;
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

export function recordFrameStructuralMetric(
  frame: FrameSnapshot,
  metric: keyof FrameStructuralMetrics,
  value: number,
): void {
  frame.metrics.structural[metric] = value;
}

export function finalizeFrameRuntimeMetrics(
  frame: FrameSnapshot,
  runtimeStartAt: number,
  runtimeEndAt = Date.now(),
): void {
  frame.metrics.runtimeStartAt = runtimeStartAt;
  frame.metrics.runtimeEndAt = runtimeEndAt;
  frame.metrics.runtimeTotalMs = Math.max(0, runtimeEndAt - runtimeStartAt);
  frame.metrics.frameEndAt = runtimeEndAt;
}

export function resetFrameSequenceForTesting(): void {
  nextFrameId = 1;
  clearCommittedFrameSnapshot();
  clearDrawCommandCache();
  resetDirtyRegistry();
  clearTextMeasureCache();
}
