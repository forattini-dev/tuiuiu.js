/**
 * Delta Renderer
 *
 * Optimized rendering system that combines:
 * - Double buffering for flicker-free updates
 * - Cell-level diff for minimal terminal writes
 * - Dirty flag tracking to skip unchanged subtrees
 * - Content caching for static elements
 *
 * 
 * zaz (delta updates)
 */

import type { VNode, TextStyle } from '../utils/types.js';
import { BORDER_STYLES } from '../utils/types.js';
import {
  fitTextToWidth,
  readRenderableSymbol,
  stringWidth,
  truncateText,
} from '../utils/text-utils.js';
import {
  readTerminalSequence,
  sanitizeInlineInput,
} from '../utils/terminal-sanitize.js';
import {
  CellBuffer,
  DoubleBuffer,
  CellAttrs,
  Color,
  emptyCell,
  patchesToAnsi,
  bufferToAnsi,
  type DamageRect,
} from './buffer.js';
import { cleanLayoutTree, clearChanges } from './dirty.js';
import { hideCursor, showCursor } from '../utils/cursor.js';
import { getTheme, resolveColor as resolveThemeColor } from './theme.js';
import { getCapabilities } from './capabilities.js';
import { getSynchronizedBegin, getSynchronizedEnd } from './progressive.js';
import {
  clearImagesForProtocol,
  kittyGraphics,
  renderImageWithProtocol,
} from './graphics.js';
import type {
  DrawBoxCommand,
  DrawCommand,
  DrawTerminalImageCommand,
  DrawTextCommand,
  FrameSnapshot,
  ReservedRegion,
} from './frame.js';
import {
  createFrameSnapshot,
  finalizeFrameRuntimeMetrics,
  recordFramePhaseMetric,
  recordFrameStructuralMetric,
} from './frame.js';
import { recordCommittedFrame } from './perf-inspector.js';
import {
  deleteRuntimeResource,
  getRuntimeResource,
  RUNTIME_RESOURCE_DISPOSE,
} from './runtime-scope.js';

const PRODUCTION_FRAME_OPTIONS = {
  eagerHitTargets: false,
  eagerQueries: false,
  eagerWarnings: false,
} as const;

const DIRTY_AREA_FALLBACK_RATIO = 0.4;
const DIRTY_RECT_FALLBACK_COUNT = 64;

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

const parsedColorCache = new WeakMap<object, Map<string, Color>>();

function getParsedColorCache(): Map<string, Color> {
  const theme = getTheme() as unknown as object;
  let cache = parsedColorCache.get(theme);
  if (!cache) {
    cache = new Map();
    parsedColorCache.set(theme, cache);
  }
  return cache;
}

function drawCommandEquals(left: DrawCommand, right: DrawCommand): boolean {
  if (
    left.type !== right.type ||
    left.order !== right.order ||
    left.zIndex !== right.zIndex ||
    left.id !== right.id ||
    left.nodeType !== right.nodeType
  ) {
    return false;
  }

  if (left.type === 'box' && right.type === 'box') {
    return (
      left.x === right.x &&
      left.y === right.y &&
      left.width === right.width &&
      left.height === right.height &&
      left.backgroundColor === right.backgroundColor &&
      left.borderStyle === right.borderStyle &&
      left.borderColor === right.borderColor &&
      left.borderText === right.borderText &&
      left.borderTextAlign === right.borderTextAlign &&
      left.borderSides?.top === right.borderSides?.top &&
      left.borderSides?.bottom === right.borderSides?.bottom &&
      left.borderSides?.left === right.borderSides?.left &&
      left.borderSides?.right === right.borderSides?.right
    );
  }

  if (left.type === 'text' && right.type === 'text') {
    return (
      left.x === right.x &&
      left.y === right.y &&
      left.maxWidth === right.maxWidth &&
      left.text === right.text &&
      left.inheritedBackgroundColor === right.inheritedBackgroundColor &&
      textStyleEquals(left.style, right.style)
    );
  }

  if (left.type === 'terminal-image' && right.type === 'terminal-image') {
    return (
      left.x === right.x &&
      left.y === right.y &&
      left.width === right.width &&
      left.height === right.height &&
      left.protocol === right.protocol &&
      left.fit === right.fit &&
      left.threshold === right.threshold &&
      left.dither === right.dither &&
      left.preserveAspectRatio === right.preserveAspectRatio &&
      left.cellRender === right.cellRender &&
      left.source.hash === right.source.hash
    );
  }

  return false;
}

function textStyleEquals(left: TextStyle, right: TextStyle): boolean {
  const leftKeys = Object.keys(left) as Array<keyof TextStyle>;
  const rightKeys = Object.keys(right) as Array<keyof TextStyle>;

  if (leftKeys.length !== rightKeys.length) {
    return false;
  }

  for (const key of leftKeys) {
    if (left[key] !== right[key]) {
      return false;
    }
  }

  return true;
}

function rectsIntersect(left: DamageRect, right: DamageRect): boolean {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

function normalizeRect(rect: DamageRect, width: number, height: number): DamageRect | null {
  const x1 = Math.max(0, rect.x);
  const y1 = Math.max(0, rect.y);
  const x2 = Math.min(width, rect.x + rect.width);
  const y2 = Math.min(height, rect.y + rect.height);

  if (x2 <= x1 || y2 <= y1) {
    return null;
  }

  return {
    x: x1,
    y: y1,
    width: x2 - x1,
    height: y2 - y1,
  };
}

function mergeDirtyRects(rects: DamageRect[], width: number, height: number): DamageRect[] {
  const normalized = rects
    .map(rect => normalizeRect(rect, width, height))
    .filter((rect): rect is DamageRect => rect !== null)
    .sort((left, right) => (left.y - right.y) || (left.x - right.x));

  if (normalized.length <= 1) {
    return normalized;
  }

  const merged: DamageRect[] = [];

  for (const rect of normalized) {
    const last = merged[merged.length - 1];
    if (!last) {
      merged.push({ ...rect });
      continue;
    }

    const touches =
      rectsIntersect(last, rect) ||
      (rect.y <= last.y + last.height && rect.x <= last.x + last.width);

    if (!touches) {
      merged.push({ ...rect });
      continue;
    }

    const nextX1 = Math.min(last.x, rect.x);
    const nextY1 = Math.min(last.y, rect.y);
    const nextX2 = Math.max(last.x + last.width, rect.x + rect.width);
    const nextY2 = Math.max(last.y + last.height, rect.y + rect.height);

    last.x = nextX1;
    last.y = nextY1;
    last.width = nextX2 - nextX1;
    last.height = nextY2 - nextY1;
  }

  return merged;
}

function buildDiffRects(rects: DamageRect[], width: number, height: number): DamageRect[] {
  const spansByRow = new Map<number, Array<{ x1: number; x2: number }>>();

  for (const rect of rects) {
    const normalized = normalizeRect(rect, width, height);
    if (!normalized) {
      continue;
    }

    const x1 = normalized.x;
    const x2 = normalized.x + normalized.width;
    const y2 = normalized.y + normalized.height;

    for (let y = normalized.y; y < y2; y++) {
      const spans = spansByRow.get(y);
      if (spans) {
        spans.push({ x1, x2 });
      } else {
        spansByRow.set(y, [{ x1, x2 }]);
      }
    }
  }

  const rows = [...spansByRow.keys()].sort((left, right) => left - right);
  const diffRects: DamageRect[] = [];

  for (const y of rows) {
    const spans = spansByRow.get(y)!;
    spans.sort((left, right) => left.x1 - right.x1);

    let current = spans[0]!;
    for (let index = 1; index < spans.length; index++) {
      const next = spans[index]!;
      if (next.x1 <= current.x2) {
        current.x2 = Math.max(current.x2, next.x2);
        continue;
      }

      diffRects.push({ x: current.x1, y, width: current.x2 - current.x1, height: 1 });
      current = next;
    }

    diffRects.push({ x: current.x1, y, width: current.x2 - current.x1, height: 1 });
  }

  return diffRects;
}

interface DirtyRegions {
  renderRects: DamageRect[];
  diffRects: DamageRect[];
}

// =============================================================================
// Types
// =============================================================================

export interface DeltaRenderOptions {
  /** Output stream (default: process.stdout) */
  stdout?: NodeJS.WriteStream;
  /** Show cursor during rendering (default: false) */
  showCursor?: boolean;
  /** Use delta rendering (default: true) */
  useDelta?: boolean;
  /** Debug mode - print all changes */
  debug?: boolean;
}

export interface DeltaRenderer {
  /** Render a VNode tree */
  render(node: VNode): void;
  /** Render a previously committed frame */
  renderFrame(frame: FrameSnapshot): void;
  /** Force full redraw */
  fullRedraw(): void;
  /** Clear the screen */
  clear(): void;
  /** Cleanup and restore terminal */
  cleanup(): void;
  /** Get render statistics */
  stats(): RenderStats;
  /** Resize the buffer */
  resize(width: number, height: number): void;
}

export interface RenderStats {
  /** Total renders */
  totalRenders: number;
  /** Delta renders (partial) */
  deltaRenders: number;
  /** Full renders */
  fullRenders: number;
  /** Cells updated in last render */
  lastPatchCount: number;
  /** Total cells */
  totalCells: number;
  /** Percentage updated */
  updatePercentage: number;
}

// =============================================================================
// Delta Renderer Implementation
// =============================================================================

/**
 * Create a delta renderer
 */
export function createDeltaRenderer(options: DeltaRenderOptions = {}): DeltaRenderer {
  const {
    stdout = process.stdout,
    showCursor: showCursorOption = false,
    useDelta = true,
    debug = false,
  } = options;

  let width = stdout.columns || 80;
  let height = stdout.rows || 24;
  let doubleBuffer = new DoubleBuffer(width, height);
  let isFirstRender = true;
  let hasHiddenCursor = false;
  let lastNode: VNode | null = null;
  let lastFrame: FrameSnapshot | null = null;

  // Statistics
  let totalRenders = 0;
  let deltaRenders = 0;
  let fullRenders = 0;
  let lastPatchCount = 0;

  /**
   * Render a VNode tree with delta updates
   */
  function render(node: VNode): void {
    prepareRender(stdout.columns || 80, stdout.rows || 24);
    const frame = createFrameSnapshot(node, { width, height }, PRODUCTION_FRAME_OPTIONS);
    renderFrame(frame);
  }

  /**
   * Render a committed frame with delta updates
   */
  function renderFrame(frame: FrameSnapshot): void {
    prepareRender(frame.info.viewport.width, frame.info.viewport.height);
    commitFrame(frame);
    cleanLayoutTree(frame.layout);
    clearChanges();
    lastNode = frame.root;
    lastFrame = frame;
  }

  /**
   * Force a full redraw
   */
  function fullRedraw(): void {
    isFirstRender = true;
    if (lastNode) {
      render(lastNode);
    } else if (lastFrame) {
      commitFrame(lastFrame);
    }
  }

  /**
   * Clear the screen
   */
  function clear(): void {
    stdout.write('\x1b[2J\x1b[3J\x1b[H');
    doubleBuffer = new DoubleBuffer(width, height);
    isFirstRender = true;
  }

  /**
   * Cleanup and restore terminal
   */
  function cleanup(): void {
    if (!showCursorOption && hasHiddenCursor) {
      showCursor(stdout);
      hasHiddenCursor = false;
    }
  }

  /**
   * Get render statistics
   */
  function stats(): RenderStats {
    const totalCells = width * height;
    return {
      totalRenders,
      deltaRenders,
      fullRenders,
      lastPatchCount,
      totalCells,
      updatePercentage: totalCells > 0 ? (lastPatchCount / totalCells) * 100 : 0,
    };
  }

  /**
   * Resize the buffer
   */
  function resize(newWidth: number, newHeight: number): void {
    width = newWidth;
    height = newHeight;
    doubleBuffer.resize(width, height);
    isFirstRender = true;
  }

  /**
   * Prepare terminal cursor and buffer dimensions before rendering.
   */
  function prepareRender(nextWidth: number, nextHeight: number): void {
    if (!showCursorOption && !hasHiddenCursor) {
      hideCursor(stdout);
      hasHiddenCursor = true;
    }

    if (nextWidth !== width || nextHeight !== height) {
      resize(nextWidth, nextHeight);
    }
  }

  /**
   * Commit a frame to the double buffer and emit either a full redraw or patches.
   * Wraps all stdout writes in synchronized output (BSU/ESU) when supported.
   */
  function commitFrame(frame: FrameSnapshot): void {
    const renderStart = now();
    let outputWriteMs = 0;
    let outputByteCount = 0;
    const frontBuffer = doubleBuffer.getFrontBuffer();
    const backBuffer = doubleBuffer.getBackBuffer();
    totalRenders++;
    const screenArea = width * height;
    const graphicsOutput = buildProtocolGraphicsOutput(lastFrame, frame);

    // Synchronized output sequences (computed lazily)
    const caps = getCapabilities();
    const bsu = getSynchronizedBegin(caps);
    const esu = getSynchronizedEnd(caps);

    const writeChunk = (chunk: string | Uint8Array): void => {
      const writeStart = now();
      stdout.write(chunk as never);
      outputWriteMs += now() - writeStart;
      outputByteCount += typeof chunk === 'string'
        ? Buffer.byteLength(chunk)
        : chunk.byteLength;
    };

    if (!isFirstRender && useDelta && lastFrame) {
      const { renderRects: dirtyRects, diffRects } = collectDirtyRegions(
        lastFrame.drawCommands,
        frame.drawCommands,
        width,
        height,
      );
      recordFrameStructuralMetric(frame, 'dirtyRectCount', dirtyRects.length);
      recordFrameStructuralMetric(frame, 'diffRectCount', diffRects.length);

      if (dirtyRects.length === 0) {
        if (graphicsOutput) {
          writeChunk(graphicsOutput);
        }
        lastPatchCount = 0;
        recordFrameStructuralMetric(frame, 'patchCount', 0);
        recordFrameStructuralMetric(frame, 'outputByteCount', outputByteCount);
        recordFramePhaseMetric(frame, 'outputWriteMs', outputWriteMs);
        recordFramePhaseMetric(frame, 'deltaRenderMs', Math.max(0, now() - renderStart - outputWriteMs));
        finalizeFrameRuntimeMetrics(
          frame,
          frame.metrics.runtimeStartAt ?? frame.metrics.frameStartAt,
        );
        recordCommittedFrame(frame, { renderer: 'delta' });
        return;
      }

      const dirtyArea = getDirtyArea(dirtyRects);
      const shouldFallbackToFull =
        dirtyRects.length > DIRTY_RECT_FALLBACK_COUNT ||
        dirtyArea > (screenArea * DIRTY_AREA_FALLBACK_RATIO);

      if (!shouldFallbackToFull) {
        if (bsu) writeChunk(bsu);
        clearDirtyRects(backBuffer, dirtyRects);
        renderDirtyDrawCommandsToBuffer(frame.drawCommands, dirtyRects, backBuffer, frame.reservedRegions);

        const patches = frontBuffer.diffRects(backBuffer, diffRects);
        frontBuffer.applyPatches(patches);
        backBuffer.clearDamage();
        lastPatchCount = patches.length;
        recordFrameStructuralMetric(frame, 'patchCount', patches.length);

        if (debug) {
          console.error(
            `[delta-render] dirty-rects: ${dirtyRects.length}, patches: ${patches.length}, cells: ${screenArea}`,
          );
        }

        if (graphicsOutput) {
          writeChunk(graphicsOutput);
        }

        if (patches.length > 0) {
          const output = patchesToAnsi(patches, width, true);
          writeChunk(output);
          deltaRenders++;
        }

        if (esu) writeChunk(esu);
        recordFrameStructuralMetric(frame, 'outputByteCount', outputByteCount);
        recordFramePhaseMetric(frame, 'outputWriteMs', outputWriteMs);
        recordFramePhaseMetric(frame, 'deltaRenderMs', Math.max(0, now() - renderStart - outputWriteMs));
        finalizeFrameRuntimeMetrics(
          frame,
          frame.metrics.runtimeStartAt ?? frame.metrics.frameStartAt,
        );
        recordCommittedFrame(frame, { renderer: 'delta' });
        return;
      }
    }

    if (bsu) writeChunk(bsu);
    backBuffer.clear();
    renderDrawCommandsToBuffer(frame.drawCommands, backBuffer, frame.reservedRegions);

    const patches = doubleBuffer.swap();
    lastPatchCount = patches.length;
    recordFrameStructuralMetric(frame, 'patchCount', patches.length);

    if (debug) {
      console.error(`[delta-render] patches: ${patches.length}, cells: ${screenArea}`);
    }

    if (isFirstRender || !useDelta || patches.length > (screenArea * 0.5)) {
      const output = bufferToAnsi(doubleBuffer.getFrontBuffer());
      if (graphicsOutput) {
        writeChunk(graphicsOutput);
      }
      writeChunk('\x1b[H');
      writeChunk(output);
      fullRenders++;
      isFirstRender = false;
      if (esu) writeChunk(esu);
      recordFrameStructuralMetric(frame, 'outputByteCount', outputByteCount);
      recordFramePhaseMetric(frame, 'outputWriteMs', outputWriteMs);
      recordFramePhaseMetric(frame, 'deltaRenderMs', Math.max(0, now() - renderStart - outputWriteMs));
      finalizeFrameRuntimeMetrics(
        frame,
        frame.metrics.runtimeStartAt ?? frame.metrics.frameStartAt,
      );
      recordCommittedFrame(frame, { renderer: 'delta' });
      return;
    }

    if (graphicsOutput) {
      writeChunk(graphicsOutput);
    }

    if (patches.length > 0) {
      const output = patchesToAnsi(patches, width, true);
      writeChunk(output);
      deltaRenders++;
    }

    isFirstRender = false;
    if (esu) writeChunk(esu);
    recordFrameStructuralMetric(frame, 'outputByteCount', outputByteCount);
    recordFramePhaseMetric(frame, 'outputWriteMs', outputWriteMs);
    recordFramePhaseMetric(frame, 'deltaRenderMs', Math.max(0, now() - renderStart - outputWriteMs));
    finalizeFrameRuntimeMetrics(
      frame,
      frame.metrics.runtimeStartAt ?? frame.metrics.frameStartAt,
    );
    recordCommittedFrame(frame, { renderer: 'delta' });
  }

  return {
    render,
    renderFrame,
    fullRedraw,
    clear,
    cleanup,
    stats,
    resize,
  };
}

// =============================================================================
// Draw Commands to Buffer Rendering
// =============================================================================

function getTextCommandBounds(command: DrawTextCommand): DamageRect {
  if (command.maxWidth <= 0 || command.text.length === 0) {
    return { x: command.x, y: command.y, width: 0, height: 0 };
  }

  let maxLineWidth = 0;
  let lastInkRow = -1;

  const lines = fitTextToWidth(command.text, command.maxWidth, command.style.wrap);
  for (let index = 0; index < lines.length; index++) {
    const lineWidth = Math.min(command.maxWidth, stringWidth(lines[index]!));
    if (lineWidth > 0) {
      maxLineWidth = Math.max(maxLineWidth, lineWidth);
      lastInkRow = index;
    }
  }

  return {
    x: command.x,
    y: command.y,
    width: maxLineWidth,
    height: lastInkRow >= 0 ? lastInkRow + 1 : 0,
  };
}

function getCommandBounds(command: DrawCommand): DamageRect {
  if (command.type === 'box' || command.type === 'terminal-image') {
    return {
      x: command.x,
      y: command.y,
      width: command.width,
      height: command.height,
    };
  }

  return getTextCommandBounds(command);
}

function collectDirtyRegions(
  previous: DrawCommand[],
  next: DrawCommand[],
  width: number,
  height: number,
): DirtyRegions {
  const dirtyRects: DamageRect[] = [];
  const maxLength = Math.max(previous.length, next.length);

  for (let index = 0; index < maxLength; index++) {
    const previousCommand = previous[index];
    const nextCommand = next[index];

    if (previousCommand && nextCommand && drawCommandEquals(previousCommand, nextCommand)) {
      continue;
    }

    if (previousCommand) {
      dirtyRects.push(getCommandBounds(previousCommand));
    }

    if (nextCommand) {
      dirtyRects.push(getCommandBounds(nextCommand));
    }
  }

  return {
    renderRects: mergeDirtyRects(dirtyRects, width, height),
    diffRects: buildDiffRects(dirtyRects, width, height),
  };
}

function getDirtyArea(rects: DamageRect[]): number {
  return rects.reduce((total, rect) => total + (rect.width * rect.height), 0);
}

function clearDirtyRects(buffer: CellBuffer, rects: DamageRect[]): void {
  const blank = emptyCell();

  for (const rect of rects) {
    buffer.fill(rect.x, rect.y, rect.width, rect.height, blank);
  }
}

function isReservedCell(regions: readonly ReservedRegion[], x: number, y: number): boolean {
  return regions.some((region) =>
    x >= region.x &&
    x < region.x + region.width &&
    y >= region.y &&
    y < region.y + region.height
  );
}

function writeCharReservedAware(
  buffer: CellBuffer,
  regions: readonly ReservedRegion[],
  x: number,
  y: number,
  char: string,
  fg?: Color,
  bg?: Color,
  attrs: CellAttrs = {},
): void {
  const width = Math.max(1, stringWidth(char));
  for (let offset = 0; offset < width; offset++) {
    if (isReservedCell(regions, x + offset, y)) {
      return;
    }
  }

  buffer.writeChar(x, y, char, fg, bg, attrs);
}

function fillRowReservedAware(
  buffer: CellBuffer,
  regions: readonly ReservedRegion[],
  x: number,
  y: number,
  width: number,
  char: string,
  fg?: Color,
  bg?: Color,
  attrs: CellAttrs = {},
): void {
  for (let col = 0; col < width; col++) {
    if (!isReservedCell(regions, x + col, y)) {
      buffer.writeChar(x + col, y, char, fg, bg, attrs);
    }
  }
}

function renderDrawCommandToBuffer(
  command: DrawCommand,
  buffer: CellBuffer,
  reservedRegions: readonly ReservedRegion[],
): void {
  switch (command.type) {
    case 'box':
      renderBoxToBuffer(command, buffer, reservedRegions);
      break;
    case 'text':
      renderTextToBuffer(command, buffer, reservedRegions);
      break;
    case 'terminal-image':
      renderTerminalImageToBuffer(command, buffer);
      break;
  }
}

function renderDirtyDrawCommandsToBuffer(
  commands: DrawCommand[],
  dirtyRects: DamageRect[],
  buffer: CellBuffer,
  reservedRegions: readonly ReservedRegion[],
): void {
  for (const command of commands) {
    const bounds = getCommandBounds(command);
    if (bounds.width <= 0 || bounds.height <= 0) {
      continue;
    }

    for (const rect of dirtyRects) {
      if (rectsIntersect(bounds, rect)) {
        renderDrawCommandToBuffer(command, buffer, reservedRegions);
        break;
      }
    }
  }
}

/**
 * Render semantic draw commands to a CellBuffer.
 */
function renderDrawCommandsToBuffer(
  commands: DrawCommand[],
  buffer: CellBuffer,
  reservedRegions: readonly ReservedRegion[],
): void {
  for (const command of commands) {
    renderDrawCommandToBuffer(command, buffer, reservedRegions);
  }
}

/**
 * Rasterize a committed frame into the canonical structured cell model.
 *
 * Both the full string renderer and the incremental renderer use this entry
 * point so text parsing, wide-cell handling, colors, borders, reserved regions
 * and terminal-image fallbacks cannot drift between rendering modes.
 */
export function renderFrameToCellBuffer(
  frame: FrameSnapshot,
  buffer = new CellBuffer(
    frame.info.viewport.width,
    frame.info.viewport.height,
  ),
): CellBuffer {
  renderDrawCommandsToBuffer(frame.drawCommands, buffer, frame.reservedRegions);
  return buffer;
}

/**
 * Render a Box command to buffer
 */
function renderBoxToBuffer(
  command: DrawBoxCommand,
  buffer: CellBuffer,
  reservedRegions: readonly ReservedRegion[],
): void {
  const { x, y, width, height, backgroundColor, borderStyle, borderColor, borderSides, borderText, borderTextAlign } = command;
  const boxBg = backgroundColor ? parseColor(backgroundColor) : undefined;
  const parsedBorderColor = borderColor ? parseColor(borderColor) : undefined;

  // Fill background if specified
  if (boxBg) {
    const borderSize = borderStyle && borderStyle !== 'none' ? 1 : 0;
    const fillX = x + borderSize;
    const fillY = y + borderSize;
    const fillWidth = Math.max(0, width - borderSize * 2);
    const fillHeight = Math.max(0, height - borderSize * 2);

    for (let row = 0; row < fillHeight; row++) {
      fillRowReservedAware(buffer, reservedRegions, fillX, fillY + row, fillWidth, ' ', undefined, boxBg, {});
    }
  }

  if (borderStyle && borderStyle !== 'none') {
    const borderChars = BORDER_STYLES[borderStyle] ?? BORDER_STYLES.single;
    const attrs: CellAttrs = {};

    // Per-side visibility
    const showTop = borderSides?.top !== false;
    const showBottom = borderSides?.bottom !== false;
    const showLeft = borderSides?.left !== false;
    const showRight = borderSides?.right !== false;

    // Top border
    if (showTop) {
      const tlChar = showLeft ? borderChars.topLeft : borderChars.top;
      writeCharReservedAware(buffer, reservedRegions, x, y, tlChar, parsedBorderColor, undefined, attrs);
      for (let i = 1; i < width - 1; i++) {
        writeCharReservedAware(buffer, reservedRegions, x + i, y, borderChars.top, parsedBorderColor, undefined, attrs);
      }
      if (width > 1) {
        const trChar = showRight ? borderChars.topRight : borderChars.top;
        writeCharReservedAware(buffer, reservedRegions, x + width - 1, y, trChar, parsedBorderColor, undefined, attrs);
      }

      // Border text overlay
      if (borderText && width > 4) {
        const maxTextLen = width - 4;
        const truncated = truncateText(
          sanitizeInlineInput(borderText),
          maxTextLen,
          { truncationCharacter: '' },
        );
        const textWithPad = ` ${truncated} `;
        const textWidth = stringWidth(textWithPad);
        const align = borderTextAlign ?? 'center';
        const startCol = align === 'left'
          ? x + 1
          : align === 'right'
            ? x + Math.max(1, width - 1 - textWidth)
            : x + Math.max(1, Math.floor((width - textWidth) / 2));
        let index = 0;
        let column = startCol;
        while (index < textWithPad.length && column < x + width - 1) {
          const symbol = readRenderableSymbol(textWithPad, index);
          if (!symbol) break;
          index = symbol.nextIndex;
          const symbolWidth = stringWidth(symbol.symbol);
          if (symbolWidth <= 0 || column + symbolWidth > x + width - 1) {
            continue;
          }
          writeCharReservedAware(
            buffer,
            reservedRegions,
            column,
            y,
            symbol.symbol,
            parsedBorderColor,
            undefined,
            attrs,
          );
          column += symbolWidth;
        }
      }
    }

    // Side borders
    for (let row = 1; row < height - 1; row++) {
      if (showLeft) {
        writeCharReservedAware(buffer, reservedRegions, x, y + row, borderChars.left, parsedBorderColor, undefined, attrs);
      }
      if (showRight && width > 1) {
        writeCharReservedAware(buffer, reservedRegions, x + width - 1, y + row, borderChars.right, parsedBorderColor, undefined, attrs);
      }
    }

    // Bottom border
    if (showBottom && height > 1) {
      const blChar = showLeft ? borderChars.bottomLeft : borderChars.bottom;
      writeCharReservedAware(buffer, reservedRegions, x, y + height - 1, blChar, parsedBorderColor, undefined, attrs);
      for (let i = 1; i < width - 1; i++) {
        writeCharReservedAware(buffer, reservedRegions, x + i, y + height - 1, borderChars.bottom, parsedBorderColor, undefined, attrs);
      }
      if (width > 1) {
        const brChar = showRight ? borderChars.bottomRight : borderChars.bottom;
        writeCharReservedAware(buffer, reservedRegions, x + width - 1, y + height - 1, brChar, parsedBorderColor, undefined, attrs);
      }
    }
  }
}

function renderTerminalImageToBuffer(
  command: DrawTerminalImageCommand,
  buffer: CellBuffer,
): void {
  if (!command.cellRender) {
    return;
  }

  renderTextToBuffer(
    {
      type: 'text',
      order: command.order,
      id: command.id,
      nodeType: command.nodeType,
      x: command.x,
      y: command.y,
      maxWidth: command.width,
      text: getTerminalImagePayload(command),
      style: {},
    },
    buffer,
    [],
  );
}

function getTerminalImageRenderOptions(command: DrawTerminalImageCommand) {
  const options = {
    width: command.width,
    height: command.height,
    fit: command.fit,
    threshold: command.threshold,
    dither: command.dither,
    preserveAspectRatio: command.preserveAspectRatio,
  };

  if (command.protocol === 'kitty' && command.kittyImageId) {
    return {
      ...options,
      imageId: command.kittyImageId,
    };
  }

  return options;
}

function protocolCommandPayloadSignature(command: DrawTerminalImageCommand): string {
  const options = getTerminalImageRenderOptions(command);

  if (command.protocolState) {
    return command.protocolState.getCacheKey(command.source, {
      protocol: command.protocol,
      ...options,
    });
  }

  return [
    command.protocol,
    command.kittyImageId ?? '',
    command.id ?? '',
    command.source.hash,
    options.width,
    options.height,
    options.fit,
    options.threshold ?? '',
    options.dither ? 1 : 0,
    options.preserveAspectRatio ? 1 : 0,
  ].join(':');
}

function protocolCommandIdentity(command: DrawTerminalImageCommand): string {
  return command.instanceKey
    ?? (command.id ? `${command.protocol}:${command.id}` : `${command.protocol}:${protocolCommandPayloadSignature(command)}:${command.x}:${command.y}`);
}

function protocolCommandSignature(command: DrawTerminalImageCommand): string {
  return [
    protocolCommandIdentity(command),
    command.x,
    command.y,
    protocolCommandPayloadSignature(command),
  ].join(':');
}

function getTerminalImagePayload(command: DrawTerminalImageCommand): string {
  const options = getTerminalImageRenderOptions(command);

  if (command.protocolState) {
    return command.protocolState.render(command.source, {
      protocol: command.protocol,
      ...options,
    }).payload;
  }

  return renderImageWithProtocol(command.protocol, command.source, options);
}

function collectProtocolImageCommands(frame: FrameSnapshot | null): DrawTerminalImageCommand[] {
  if (!frame) {
    return [];
  }

  return frame.drawCommands.filter(
    (command): command is DrawTerminalImageCommand =>
      command.type === 'terminal-image' && !command.cellRender,
  );
}

function buildKittyCleanupOutput(
  previousCommands: readonly DrawTerminalImageCommand[],
  nextCommands: readonly DrawTerminalImageCommand[],
): string {
  const nextByIdentity = new Map(
    nextCommands
      .filter(command => command.protocol === 'kitty')
      .map(command => [protocolCommandIdentity(command), command] as const),
  );
  const deletedImageIds = new Set<number>();
  let output = '';

  for (const previousCommand of previousCommands) {
    if (previousCommand.protocol !== 'kitty') {
      continue;
    }

    const nextCommand = nextByIdentity.get(protocolCommandIdentity(previousCommand));
    const changed = !nextCommand || protocolCommandSignature(previousCommand) !== protocolCommandSignature(nextCommand);

    if (!changed) {
      continue;
    }

    if (previousCommand.kittyImageId) {
      if (deletedImageIds.has(previousCommand.kittyImageId)) {
        continue;
      }

      deletedImageIds.add(previousCommand.kittyImageId);
      output += '\x1b7\x1b[H';
      output += kittyGraphics.delete(previousCommand.kittyImageId);
      output += '\x1b8';
      continue;
    }

    return `\x1b7\x1b[H${clearImagesForProtocol('kitty')}\x1b8`;
  }

  return output;
}

function buildProtocolGraphicsOutput(previousFrame: FrameSnapshot | null, frame: FrameSnapshot): string {
  const previousCommands = collectProtocolImageCommands(previousFrame);
  const nextCommands = collectProtocolImageCommands(frame);
  const previousSignature = previousCommands.map(protocolCommandSignature).join('|');
  const nextSignature = nextCommands.map(protocolCommandSignature).join('|');

  if (previousFrame && previousSignature === nextSignature) {
    return '';
  }

  let output = buildKittyCleanupOutput(previousCommands, nextCommands);
  const previousByIdentity = new Map(previousCommands.map(command => [protocolCommandIdentity(command), command] as const));

  for (const command of nextCommands) {
    const previousCommand = previousByIdentity.get(protocolCommandIdentity(command));
    if (previousCommand && protocolCommandSignature(previousCommand) === protocolCommandSignature(command)) {
      continue;
    }

    output += `\x1b7\x1b[${command.y + 1};${command.x + 1}H`;
    output += getTerminalImagePayload(command);
    output += '\x1b8';
  }

  return output;
}

/**
 * Render a Text node to buffer
 */
/**
 * Parse ANSI escape sequences and extract color/style information
 * Returns segments of text with their associated styles
 */
interface AnsiSegment {
  text: string;
  fg?: Color;
  bg?: Color;
  attrs: CellAttrs;
}

function parseSgrByte(value: string | undefined): number | null {
  if (value === undefined || !/^\d{1,3}$/u.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 0 && parsed <= 255 ? parsed : null;
}

function parseColonColor(parts: string[]): Color | null {
  const mode = Number(parts[1]);
  const values = parts.slice(2).filter(value => value !== '');

  if (mode === 5) {
    const ansi256 = parseSgrByte(values.at(-1));
    return ansi256 === null ? null : { ansi256 };
  }

  if (mode === 2) {
    const rgb = values.slice(-3).map(parseSgrByte);
    if (rgb.length !== 3 || rgb.some(value => value === null)) return null;
    return { r: rgb[0]!, g: rgb[1]!, b: rgb[2]! };
  }

  return null;
}

function parseSemicolonColor(
  parameters: string[],
  index: number,
): { color: Color | null; consumed: number } {
  const mode = Number(parameters[index + 1]);
  if (mode === 5) {
    return {
      color: (() => {
        const ansi256 = parseSgrByte(parameters[index + 2]);
        return ansi256 === null ? null : { ansi256 };
      })(),
      consumed: 2,
    };
  }

  if (mode === 2) {
    const rgb = [
      parseSgrByte(parameters[index + 2]),
      parseSgrByte(parameters[index + 3]),
      parseSgrByte(parameters[index + 4]),
    ];
    return {
      color: rgb.some(value => value === null)
        ? null
        : { r: rgb[0]!, g: rgb[1]!, b: rgb[2]! },
      consumed: 4,
    };
  }

  return { color: null, consumed: 0 };
}

const UNDERLINE_VARIANTS: Record<number, CellAttrs['underline']> = {
  0: false,
  1: 'single',
  2: 'double',
  3: 'curly',
  4: 'dotted',
  5: 'dashed',
};

function parseAnsiText(text: string, baseFg?: Color, baseBg?: Color, baseAttrs: CellAttrs = {}): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  let currentFg: Color | undefined = baseFg;
  let currentBg: Color | undefined = baseBg;
  let currentAttrs: CellAttrs = { ...baseAttrs };
  let currentText = '';

  let i = 0;
  while (i < text.length) {
    // Consume all terminal protocols, but interpret only strictly-valid SGR.
    if (text[i] === '\x1b') {
      const sequence = readTerminalSequence(text, i);
      if (!sequence) {
        i++;
        continue;
      }

      // Flush current text
      if (currentText) {
        segments.push({ text: currentText, fg: currentFg, bg: currentBg, attrs: { ...currentAttrs } });
        currentText = '';
      }

      if (sequence.kind === 'sgr') {
        const body = sequence.value.slice(2, -1);
        const parameters = body === '' ? ['0'] : body.split(';');

        for (let k = 0; k < parameters.length; k++) {
          const parameter = parameters[k]!;
          const colonParts = parameter.split(':');
          const code = Number(colonParts[0] || 0);

          if (colonParts.length > 1) {
            if (code === 4) {
              const variant = Number(colonParts[1] || 0);
              if (variant in UNDERLINE_VARIANTS) {
                currentAttrs.underline = UNDERLINE_VARIANTS[variant];
              }
            } else if (code === 38 || code === 48 || code === 58) {
              const color = parseColonColor(colonParts);
              if (color) {
                if (code === 38) currentFg = color;
                else if (code === 48) currentBg = color;
                else currentAttrs.underlineColor = color;
              }
            }
            continue;
          }

          if (code === 0) {
            currentFg = baseFg;
            currentBg = baseBg;
            currentAttrs = { ...baseAttrs };
          } else if (code === 1) {
            currentAttrs.bold = true;
          } else if (code === 2) {
            currentAttrs.dim = true;
          } else if (code === 3) {
            currentAttrs.italic = true;
          } else if (code === 4) {
            currentAttrs.underline = true;
          } else if (code === 5) {
            currentAttrs.blink = true;
          } else if (code === 7) {
            currentAttrs.inverse = true;
          } else if (code === 8) {
            currentAttrs.hidden = true;
          } else if (code === 9) {
            currentAttrs.strikethrough = true;
          } else if (code === 21) {
            currentAttrs.underline = 'double';
          } else if (code === 22) {
            currentAttrs.bold = false;
            currentAttrs.dim = false;
          } else if (code === 23) {
            currentAttrs.italic = false;
          } else if (code === 24) {
            currentAttrs.underline = false;
          } else if (code === 25) {
            currentAttrs.blink = false;
          } else if (code === 27) {
            currentAttrs.inverse = false;
          } else if (code === 28) {
            currentAttrs.hidden = false;
          } else if (code === 29) {
            currentAttrs.strikethrough = false;
          } else if (code >= 30 && code <= 37) {
            const colorNames = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
            currentFg = colorNames[code - 30];
          } else if (code === 39) {
            currentFg = baseFg;
          } else if (code >= 40 && code <= 47) {
            const colorNames = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
            currentBg = colorNames[code - 40];
          } else if (code === 49) {
            currentBg = baseBg;
          } else if (code === 59) {
            currentAttrs.underlineColor = baseAttrs.underlineColor;
          } else if (code >= 90 && code <= 97) {
            const colorNames = ['blackBright', 'redBright', 'greenBright', 'yellowBright', 'blueBright', 'magentaBright', 'cyanBright', 'whiteBright'];
            currentFg = colorNames[code - 90];
          } else if (code >= 100 && code <= 107) {
            const colorNames = ['blackBright', 'redBright', 'greenBright', 'yellowBright', 'blueBright', 'magentaBright', 'cyanBright', 'whiteBright'];
            currentBg = colorNames[code - 100];
          } else if (code === 38 || code === 48 || code === 58) {
            const { color, consumed } = parseSemicolonColor(parameters, k);
            if (color) {
              if (code === 38) currentFg = color;
              else if (code === 48) currentBg = color;
              else currentAttrs.underlineColor = color;
            }
            k += consumed;
          }
        }
      }

      i = sequence.end;
      continue;
    }

    // Regular character
    currentText += text[i];
    i++;
  }

  // Flush remaining text
  if (currentText) {
    segments.push({ text: currentText, fg: currentFg, bg: currentBg, attrs: { ...currentAttrs } });
  }

  return segments;
}

function renderTextToBuffer(
  command: DrawTextCommand,
  buffer: CellBuffer,
  reservedRegions: readonly ReservedRegion[],
): void {
  const { x, y, maxWidth, text, style, inheritedBackgroundColor } = command;
  if (maxWidth <= 0) {
    return;
  }

  // PreText: parse validated ANSI SGR into structured cell attributes
  // so the embedded ANSI codes take full effect without style overlay
  const isPrebuilt = command.prebuiltAnsi === true;

  // Parse colors and attributes (inherit bg from parent if not set)
  const baseFg = isPrebuilt ? undefined : (style.color ? parseColor(style.color) : undefined);
  const baseBg = isPrebuilt ? undefined : (style.backgroundColor
    ? parseColor(style.backgroundColor)
    : inheritedBackgroundColor
      ? parseColor(inheritedBackgroundColor)
      : undefined);
  const baseAttrs: CellAttrs = isPrebuilt ? {} : {
    bold: style.bold,
    dim: style.dim,
    italic: style.italic,
    underline: style.underline,
    underlineColor: style.underlineColor ? parseColor(style.underlineColor) : undefined,
    inverse: style.inverse,
    strikethrough: style.strikethrough,
  };

  // Check if text contains ANSI sequences
  const hasAnsi = isPrebuilt || text.includes('\x1b');
  const lines = fitTextToWidth(text, maxWidth, style.wrap);

  if (hasAnsi) {
    // Parse ANSI and render segments
    const segments = parseAnsiText(lines.join('\n'), baseFg, baseBg, baseAttrs);
    let col = 0;
    let row = 0;

    for (const segment of segments) {
      let index = 0;
      while (index < segment.text.length) {
        const symbol = readRenderableSymbol(segment.text, index);
        if (!symbol) {
          break;
        }

        const char = symbol.symbol;
        if (char === '\n') {
          row++;
          col = 0;
          index = symbol.nextIndex;
          continue;
        }
        const charWidth = stringWidth(char);
        if (charWidth > 0) {
          writeCharReservedAware(buffer, reservedRegions, x + col, y + row, char, segment.fg, segment.bg, segment.attrs);
          col += charWidth;
        }
        index = symbol.nextIndex;
      }
    }
  } else {
    // Handle wrapping for non-ANSI text
    for (let i = 0; i < lines.length; i++) {
      let col = 0;
      let index = 0;
      while (index < lines[i]!.length) {
        const symbol = readRenderableSymbol(lines[i]!, index);
        if (!symbol) {
          break;
        }

        const char = symbol.symbol;
        if (col >= maxWidth) break;
        const charWidth = stringWidth(char);
        if (charWidth > 0) {
          writeCharReservedAware(buffer, reservedRegions, x + col, y + i, char, baseFg, baseBg, baseAttrs);
          col += charWidth;
        }
        index = symbol.nextIndex;
      }
    }
  }
}

/**
 * Parse a color string to Color type
 * Resolves semantic theme colors (primary, success, etc.) to actual color values
 */
function parseColor(color: string): Color {
  const cache = getParsedColorCache();
  const cached = cache.get(color);
  if (cached) {
    return cached;
  }

  // Resolve semantic/theme colors (primary, success, foreground, etc.)
  const resolved = resolveThemeColor(color);
  cache.set(color, resolved);
  return resolved;
}

// =============================================================================
// Runtime-owned Convenience Instance
// =============================================================================

interface DeltaRendererRuntimeState {
  renderer: DeltaRenderer | null;
  [RUNTIME_RESOURCE_DISPOSE](): void;
}

const DELTA_RENDERER_STATE = Symbol('tuiuiu.delta-renderer-state');

function getDeltaRendererState(): DeltaRendererRuntimeState {
  return getRuntimeResource(DELTA_RENDERER_STATE, () => {
    const state: DeltaRendererRuntimeState = {
      renderer: null,
      [RUNTIME_RESOURCE_DISPOSE]() {
        state.renderer?.cleanup();
        state.renderer = null;
      },
    };
    return state;
  });
}

/**
 * Get the current runtime delta renderer instance
 */
export function getDeltaRenderer(options?: DeltaRenderOptions): DeltaRenderer {
  const state = getDeltaRendererState();
  if (!state.renderer) {
    state.renderer = createDeltaRenderer(options);
  }
  return state.renderer;
}

/**
 * Reset the delta renderer (for testing)
 */
export function resetDeltaRenderer(): void {
  deleteRuntimeResource(DELTA_RENDERER_STATE);
}

export function __collectDirtyRegionsForTesting(
  previous: DrawCommand[],
  next: DrawCommand[],
  width: number,
  height: number,
): DirtyRegions {
  return collectDirtyRegions(previous, next, width, height);
}
