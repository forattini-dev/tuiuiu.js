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
import { getVisibleWidth } from './layout.js';
import { readRenderableSymbol, stringWidth } from '../utils/text-utils.js';
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
import { markClean, clearChanges } from './dirty.js';
import { hideCursor, showCursor } from '../utils/cursor.js';
import { getTheme, resolveColor as resolveThemeColor } from './theme.js';
import {
  clearImagesForProtocol,
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
import { createFrameSnapshot, recordFramePhaseMetric } from './frame.js';

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
      left.borderColor === right.borderColor
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
    markClean(frame.root);
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
   */
  function commitFrame(frame: FrameSnapshot): void {
    const renderStart = now();
    const frontBuffer = doubleBuffer.getFrontBuffer();
    const backBuffer = doubleBuffer.getBackBuffer();
    totalRenders++;
    const screenArea = width * height;
    const graphicsOutput = buildProtocolGraphicsOutput(lastFrame, frame);

    if (!isFirstRender && useDelta && lastFrame) {
      const dirtyRects = collectDirtyRects(lastFrame.drawCommands, frame.drawCommands, width, height);

      if (dirtyRects.length === 0) {
        if (graphicsOutput) {
          stdout.write(graphicsOutput);
        }
        lastPatchCount = 0;
        recordFramePhaseMetric(frame, 'deltaRenderMs', now() - renderStart);
        return;
      }

      const dirtyArea = getDirtyArea(dirtyRects);
      const shouldFallbackToFull =
        dirtyRects.length > DIRTY_RECT_FALLBACK_COUNT ||
        dirtyArea > (screenArea * DIRTY_AREA_FALLBACK_RATIO);

      if (!shouldFallbackToFull) {
        clearDirtyRects(backBuffer, dirtyRects);
        renderDirtyDrawCommandsToBuffer(frame.drawCommands, dirtyRects, backBuffer, frame.reservedRegions);

        const patches = frontBuffer.diffRects(backBuffer, dirtyRects);
        frontBuffer.applyPatches(patches);
        backBuffer.clearDamage();
        lastPatchCount = patches.length;

        if (debug) {
          console.error(
            `[delta-render] dirty-rects: ${dirtyRects.length}, patches: ${patches.length}, cells: ${screenArea}`,
          );
        }

        if (graphicsOutput) {
          stdout.write(graphicsOutput);
        }

        if (patches.length > 0) {
          const output = patchesToAnsi(patches, width, true);
          stdout.write(output);
          deltaRenders++;
        }

        recordFramePhaseMetric(frame, 'deltaRenderMs', now() - renderStart);
        return;
      }
    }

    backBuffer.clear();
    renderDrawCommandsToBuffer(frame.drawCommands, backBuffer, frame.reservedRegions);

    const patches = doubleBuffer.swap();
    lastPatchCount = patches.length;

    if (debug) {
      console.error(`[delta-render] patches: ${patches.length}, cells: ${screenArea}`);
    }

    if (isFirstRender || !useDelta || patches.length > (screenArea * 0.5)) {
      const output = bufferToAnsi(doubleBuffer.getFrontBuffer());
      if (graphicsOutput) {
        stdout.write(graphicsOutput);
      }
      stdout.write('\x1b[H');
      stdout.write(output);
      fullRenders++;
      isFirstRender = false;
      recordFramePhaseMetric(frame, 'deltaRenderMs', now() - renderStart);
      return;
    }

    if (graphicsOutput) {
      stdout.write(graphicsOutput);
    }

    if (patches.length > 0) {
      const output = patchesToAnsi(patches, width, true);
      stdout.write(output);
      deltaRenders++;
    }

    isFirstRender = false;
    recordFramePhaseMetric(frame, 'deltaRenderMs', now() - renderStart);
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

  if (command.text.includes('\x1b[')) {
    const segments = parseAnsiText(command.text);
    let row = 0;
    let col = 0;

    for (const segment of segments) {
      let index = 0;
      while (index < segment.text.length) {
        const symbol = readRenderableSymbol(segment.text, index);
        if (!symbol) {
          break;
        }

        const char = symbol.symbol;
        if (char === '\n') {
          maxLineWidth = Math.max(maxLineWidth, col);
          row++;
          col = 0;
          index = symbol.nextIndex;
          continue;
        }

        if (col >= command.maxWidth) {
          maxLineWidth = Math.max(maxLineWidth, col);
          row++;
          col = 0;
        }

        col += stringWidth(char);
        maxLineWidth = Math.max(maxLineWidth, Math.min(command.maxWidth, col));
        lastInkRow = row;
        index = symbol.nextIndex;
      }
    }
  } else {
    const lines = wrapTextForBuffer(command.text, command.maxWidth, command.style.wrap);

    for (let index = 0; index < lines.length; index++) {
      const lineWidth = Math.min(command.maxWidth, getVisibleWidth(lines[index]!));
      if (lineWidth > 0) {
        maxLineWidth = Math.max(maxLineWidth, lineWidth);
        lastInkRow = index;
      }
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

function collectDirtyRects(
  previous: DrawCommand[],
  next: DrawCommand[],
  width: number,
  height: number,
): DamageRect[] {
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

  return mergeDirtyRects(dirtyRects, width, height);
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
 * Render a Box command to buffer
 */
function renderBoxToBuffer(
  command: DrawBoxCommand,
  buffer: CellBuffer,
  reservedRegions: readonly ReservedRegion[],
): void {
  const { x, y, width, height, backgroundColor, borderStyle, borderColor } = command;
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

    // Top border
    writeCharReservedAware(buffer, reservedRegions, x, y, borderChars.topLeft, parsedBorderColor, undefined, attrs);
    for (let i = 1; i < width - 1; i++) {
      writeCharReservedAware(buffer, reservedRegions, x + i, y, borderChars.top, parsedBorderColor, undefined, attrs);
    }
    if (width > 1) {
      writeCharReservedAware(
        buffer,
        reservedRegions,
        x + width - 1,
        y,
        borderChars.topRight,
        parsedBorderColor,
        undefined,
        attrs,
      );
    }

    // Side borders
    for (let row = 1; row < height - 1; row++) {
      writeCharReservedAware(buffer, reservedRegions, x, y + row, borderChars.left, parsedBorderColor, undefined, attrs);
      if (width > 1) {
        writeCharReservedAware(
          buffer,
          reservedRegions,
          x + width - 1,
          y + row,
          borderChars.right,
          parsedBorderColor,
          undefined,
          attrs,
        );
      }
    }

    // Bottom border
    if (height > 1) {
      writeCharReservedAware(
        buffer,
        reservedRegions,
        x,
        y + height - 1,
        borderChars.bottomLeft,
        parsedBorderColor,
        undefined,
        attrs,
      );
      for (let i = 1; i < width - 1; i++) {
        writeCharReservedAware(
          buffer,
          reservedRegions,
          x + i,
          y + height - 1,
          borderChars.bottom,
          parsedBorderColor,
          undefined,
          attrs,
        );
      }
      if (width > 1) {
        writeCharReservedAware(
          buffer,
          reservedRegions,
          x + width - 1,
          y + height - 1,
          borderChars.bottomRight,
          parsedBorderColor,
          undefined,
          attrs,
        );
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

function protocolCommandSignature(command: DrawTerminalImageCommand): string {
  if (command.protocolState) {
    return command.protocolState.getCacheKey(command.source, {
      protocol: command.protocol,
      width: command.width,
      height: command.height,
      fit: command.fit,
      threshold: command.threshold,
      dither: command.dither,
      preserveAspectRatio: command.preserveAspectRatio,
    });
  }

  return [
    command.protocol,
    command.id ?? '',
    command.x,
    command.y,
    command.width,
    command.height,
    command.source.hash,
    command.fit,
    command.threshold ?? '',
    command.dither ? 1 : 0,
    command.preserveAspectRatio ? 1 : 0,
  ].join(':');
}

function getTerminalImagePayload(command: DrawTerminalImageCommand): string {
  const options = {
    width: command.width,
    height: command.height,
    fit: command.fit,
    threshold: command.threshold,
    dither: command.dither,
    preserveAspectRatio: command.preserveAspectRatio,
  };

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

function buildProtocolGraphicsOutput(previousFrame: FrameSnapshot | null, frame: FrameSnapshot): string {
  const previousCommands = collectProtocolImageCommands(previousFrame);
  const nextCommands = collectProtocolImageCommands(frame);
  const previousSignature = previousCommands.map(protocolCommandSignature).join('|');
  const nextSignature = nextCommands.map(protocolCommandSignature).join('|');

  if (previousFrame && previousSignature === nextSignature) {
    return '';
  }

  let output = '';

  if (previousCommands.length > 0 && previousSignature !== nextSignature) {
    const previousProtocols = new Set(previousCommands.map(command => command.protocol));
    if (previousProtocols.has('kitty')) {
      output += '\x1b7\x1b[H';
      output += clearImagesForProtocol('kitty');
      output += '\x1b8';
    }
  }

  for (const command of nextCommands) {
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

function parseAnsiText(text: string, baseFg?: Color, baseBg?: Color, baseAttrs: CellAttrs = {}): AnsiSegment[] {
  const segments: AnsiSegment[] = [];
  let currentFg: Color | undefined = baseFg;
  let currentBg: Color | undefined = baseBg;
  let currentAttrs: CellAttrs = { ...baseAttrs };
  let currentText = '';

  let i = 0;
  while (i < text.length) {
    // Check for ANSI escape sequence
    if (text[i] === '\x1b' && text[i + 1] === '[') {
      // Flush current text
      if (currentText) {
        segments.push({ text: currentText, fg: currentFg, bg: currentBg, attrs: { ...currentAttrs } });
        currentText = '';
      }

      // Find end of ANSI sequence
      let j = i + 2;
      while (j < text.length && !/[A-Za-z]/.test(text[j]!)) {
        j++;
      }

      if (j < text.length && text[j] === 'm') {
        // Parse SGR (Select Graphic Rendition) codes
        const codes = text.slice(i + 2, j).split(';').map(c => parseInt(c, 10) || 0);

        for (let k = 0; k < codes.length; k++) {
          const code = codes[k]!;

          if (code === 0) {
            // Reset
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
          } else if (code === 7) {
            currentAttrs.inverse = true;
          } else if (code === 9) {
            currentAttrs.strikethrough = true;
          } else if (code >= 30 && code <= 37) {
            // Standard foreground colors
            const colorNames = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
            currentFg = colorNames[code - 30];
          } else if (code >= 40 && code <= 47) {
            // Standard background colors
            const colorNames = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];
            currentBg = colorNames[code - 40];
          } else if (code >= 90 && code <= 97) {
            // Bright foreground colors
            const colorNames = ['blackBright', 'redBright', 'greenBright', 'yellowBright', 'blueBright', 'magentaBright', 'cyanBright', 'whiteBright'];
            currentFg = colorNames[code - 90];
          } else if (code >= 100 && code <= 107) {
            // Bright background colors
            const colorNames = ['blackBright', 'redBright', 'greenBright', 'yellowBright', 'blueBright', 'magentaBright', 'cyanBright', 'whiteBright'];
            currentBg = colorNames[code - 100];
          } else if (code === 38 && codes[k + 1] === 2) {
            // 24-bit foreground: 38;2;r;g;b
            const r = codes[k + 2] ?? 0;
            const g = codes[k + 3] ?? 0;
            const b = codes[k + 4] ?? 0;
            currentFg = { r, g, b };
            k += 4;
          } else if (code === 48 && codes[k + 1] === 2) {
            // 24-bit background: 48;2;r;g;b
            const r = codes[k + 2] ?? 0;
            const g = codes[k + 3] ?? 0;
            const b = codes[k + 4] ?? 0;
            currentBg = { r, g, b };
            k += 4;
          } else if (code === 38 && codes[k + 1] === 5) {
            // 256-color foreground: 38;5;n
            currentFg = { ansi256: codes[k + 2] ?? 0 };
            k += 2;
          } else if (code === 48 && codes[k + 1] === 5) {
            // 256-color background: 48;5;n
            currentBg = { ansi256: codes[k + 2] ?? 0 };
            k += 2;
          }
        }
      }

      i = j + 1;
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

  // Parse colors and attributes (inherit bg from parent if not set)
  const baseFg = style.color ? parseColor(style.color) : undefined;
  const baseBg = style.backgroundColor
    ? parseColor(style.backgroundColor)
    : inheritedBackgroundColor
      ? parseColor(inheritedBackgroundColor)
      : undefined;
  const baseAttrs: CellAttrs = {
    bold: style.bold,
    dim: style.dim,
    italic: style.italic,
    underline: style.underline,
    inverse: style.inverse,
    strikethrough: style.strikethrough,
  };

  // Check if text contains ANSI sequences
  const hasAnsi = text.includes('\x1b[');

  if (hasAnsi) {
    // Parse ANSI and render segments
    const segments = parseAnsiText(text, baseFg, baseBg, baseAttrs);
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
        if (col >= maxWidth) {
          row++;
          col = 0;
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
    const lines = wrapTextForBuffer(text, maxWidth, style.wrap);

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

/**
 * Wrap text to fit width (simplified version for buffer rendering)
 */
function wrapTextForBuffer(text: string, maxWidth: number, mode?: TextStyle['wrap']): string[] {
  if (maxWidth <= 0) return [text];

  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    const lineWidth = getVisibleWidth(line);

    if (mode === 'truncate' || mode === 'truncate-end') {
      result.push(truncate(line, maxWidth));
    } else if (mode === 'truncate-start') {
      result.push(truncateStart(line, maxWidth));
    } else if (mode === 'truncate-middle') {
      result.push(truncateMiddle(line, maxWidth));
    } else if (lineWidth <= maxWidth) {
      result.push(line);
    } else {
      // Word wrap
      result.push(...wrapLine(line, maxWidth));
    }
  }

  return result;
}

function truncate(text: string, maxWidth: number): string {
  if (getVisibleWidth(text) <= maxWidth) return text;
  let result = '';
  let width = 0;
  for (const char of text) {
    const charWidth = stringWidth(char);
    if (width + charWidth + 1 > maxWidth) break;
    result += char;
    width += charWidth;
  }
  return result + '…';
}

function truncateStart(text: string, maxWidth: number): string {
  if (getVisibleWidth(text) <= maxWidth) return text;
  const chars = [...text];
  let result = '';
  let width = 0;
  for (let i = chars.length - 1; i >= 0; i--) {
    const charWidth = stringWidth(chars[i]);
    if (width + charWidth + 1 > maxWidth) break;
    result = chars[i] + result;
    width += charWidth;
  }
  return '…' + result;
}

function truncateMiddle(text: string, maxWidth: number): string {
  if (getVisibleWidth(text) <= maxWidth) return text;
  const available = maxWidth - 1;
  const startLen = Math.ceil(available / 2);
  const endLen = Math.floor(available / 2);
  return text.slice(0, startLen) + '…' + text.slice(-endLen);
}

function wrapLine(line: string, maxWidth: number): string[] {
  if (getVisibleWidth(line) <= maxWidth) {
    return [line];
  }

  const words = line.split(' ');
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (getVisibleWidth(test) <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [''];
}

// =============================================================================
// Singleton Instance
// =============================================================================

let deltaRendererInstance: DeltaRenderer | null = null;

/**
 * Get the global delta renderer instance
 */
export function getDeltaRenderer(options?: DeltaRenderOptions): DeltaRenderer {
  if (!deltaRendererInstance) {
    deltaRendererInstance = createDeltaRenderer(options);
  }
  return deltaRendererInstance;
}

/**
 * Reset the delta renderer (for testing)
 */
export function resetDeltaRenderer(): void {
  if (deltaRendererInstance) {
    deltaRendererInstance.cleanup();
  }
  deltaRendererInstance = null;
}
