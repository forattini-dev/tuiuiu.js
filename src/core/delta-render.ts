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

import type { VNode, LayoutNode, TextStyle, BoxStyle } from '../utils/types.js';
import { BORDER_STYLES } from '../utils/types.js';
import { calculateLayout, getVisibleWidth } from '../design-system/core/layout.js';
import { stringWidth } from '../utils/text-utils.js';
import {
  CellBuffer,
  DoubleBuffer,
  Cell,
  CellAttrs,
  Color,
  patchesToAnsi,
  bufferToAnsi,
  emptyCell,
  colorToAnsi,
} from './buffer.js';
import { getDirtyRegistry, needsRender, markClean, clearChanges } from './dirty.js';
import { hideCursor, showCursor } from '../utils/cursor.js';
import type { Writable } from 'node:stream';

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

  // Statistics
  let totalRenders = 0;
  let deltaRenders = 0;
  let fullRenders = 0;
  let lastPatchCount = 0;

  /**
   * Render a VNode tree with delta updates
   */
  function render(node: VNode): void {
    // Hide cursor if needed
    if (!showCursorOption && !hasHiddenCursor) {
      hideCursor(stdout);
      hasHiddenCursor = true;
    }

    // Check if resize needed
    const newWidth = stdout.columns || 80;
    const newHeight = stdout.rows || 24;
    if (newWidth !== width || newHeight !== height) {
      resize(newWidth, newHeight);
    }

    // Calculate layout
    const layout = calculateLayout(node, width, height);

    // Get back buffer and clear it
    const backBuffer = doubleBuffer.getBackBuffer();
    backBuffer.clear();

    // Render layout to back buffer
    renderLayoutToBuffer(layout, backBuffer, 0, 0);

    // Swap buffers and get patches
    const patches = doubleBuffer.swap();
    lastPatchCount = patches.length;
    totalRenders++;

    if (debug) {
      console.error(`[delta-render] patches: ${patches.length}, cells: ${width * height}`);
    }

    // Decide rendering strategy
    if (isFirstRender || !useDelta || patches.length > (width * height * 0.5)) {
      // Full redraw for first render or if >50% changed
      const output = bufferToAnsi(doubleBuffer.getFrontBuffer());
      stdout.write('\x1b[H'); // Move to home position
      stdout.write(output);
      fullRenders++;
      isFirstRender = false;
    } else if (patches.length > 0) {
      // Delta update - only render changed cells
      const output = patchesToAnsi(patches, width);
      stdout.write(output);
      deltaRenders++;
    }

    // Mark all nodes clean
    markClean(node);
    clearChanges();
    lastNode = node;
  }

  /**
   * Force a full redraw
   */
  function fullRedraw(): void {
    isFirstRender = true;
    if (lastNode) {
      render(lastNode);
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

  return {
    render,
    fullRedraw,
    clear,
    cleanup,
    stats,
    resize,
  };
}

// =============================================================================
// Layout to Buffer Rendering
// =============================================================================

/**
 * Render a layout tree to a CellBuffer
 */
function renderLayoutToBuffer(
  layout: LayoutNode,
  buffer: CellBuffer,
  offsetX: number,
  offsetY: number,
  parentBg?: Color
): void {
  const { node, x, y, width, height, children } = layout;
  const absX = offsetX + x;
  const absY = offsetY + y;

  // Get this node's background color (or inherit from parent)
  const style = node.props as BoxStyle;
  const nodeBg = style.backgroundColor ? parseColor(style.backgroundColor) : parentBg;

  // Render based on node type
  switch (node.type) {
    case 'box':
      renderBoxToBuffer(node, buffer, absX, absY, width, height, nodeBg);
      break;
    case 'text':
      renderTextToBuffer(node, buffer, absX, absY, width, nodeBg);
      break;
    case 'spacer':
      // Note: Spacer background is NOT filled to avoid flickering.
      // Background inheritance happens through text children.
      break;
    case 'newline':
    case 'fragment':
      // No visual representation
      break;
  }

  // Calculate content offset (for padding and border)
  const paddingTop = style.paddingTop ?? style.paddingY ?? style.padding ?? 0;
  const paddingLeft = style.paddingLeft ?? style.paddingX ?? style.padding ?? 0;
  const borderSize = style.borderStyle && style.borderStyle !== 'none' ? 1 : 0;
  const contentOffsetX = absX + paddingLeft + borderSize;
  const contentOffsetY = absY + paddingTop + borderSize;

  // Render children (pass background color for inheritance)
  for (const child of children) {
    renderLayoutToBuffer(child, buffer, contentOffsetX, contentOffsetY, nodeBg);
  }
}

/**
 * Render a Box node to buffer
 */
function renderBoxToBuffer(
  node: VNode,
  buffer: CellBuffer,
  x: number,
  y: number,
  width: number,
  height: number,
  bgColor?: Color
): void {
  const style = node.props as BoxStyle;

  // Parse colors
  const borderColor = style.borderColor ? parseColor(style.borderColor) : undefined;

  // Note: Background is NOT filled here to avoid flickering.
  // Text children inherit parentBg and render with the correct background.

  if (style.borderStyle && style.borderStyle !== 'none') {
    const borderChars = BORDER_STYLES[style.borderStyle] ?? BORDER_STYLES.single;
    const attrs: CellAttrs = {};

    // Top border
    buffer.writeChar(x, y, borderChars.topLeft, borderColor, undefined, attrs);
    for (let i = 1; i < width - 1; i++) {
      buffer.writeChar(x + i, y, borderChars.top, borderColor, undefined, attrs);
    }
    if (width > 1) {
      buffer.writeChar(x + width - 1, y, borderChars.topRight, borderColor, undefined, attrs);
    }

    // Side borders
    for (let row = 1; row < height - 1; row++) {
      buffer.writeChar(x, y + row, borderChars.left, borderColor, undefined, attrs);
      if (width > 1) {
        buffer.writeChar(x + width - 1, y + row, borderChars.right, borderColor, undefined, attrs);
      }
    }

    // Bottom border
    if (height > 1) {
      buffer.writeChar(x, y + height - 1, borderChars.bottomLeft, borderColor, undefined, attrs);
      for (let i = 1; i < width - 1; i++) {
        buffer.writeChar(x + i, y + height - 1, borderChars.bottom, borderColor, undefined, attrs);
      }
      if (width > 1) {
        buffer.writeChar(x + width - 1, y + height - 1, borderChars.bottomRight, borderColor, undefined, attrs);
      }
    }
  }
}

/**
 * Render a Text node to buffer
 */
function renderTextToBuffer(
  node: VNode,
  buffer: CellBuffer,
  x: number,
  y: number,
  maxWidth: number,
  parentBg?: Color
): void {
  const props = node.props as TextStyle & { children: string };
  const text = String(props.children ?? '');

  // Parse colors and attributes (inherit bg from parent if not set)
  const fg = props.color ? parseColor(props.color) : undefined;
  const bg = props.backgroundColor ? parseColor(props.backgroundColor) : parentBg;
  const attrs: CellAttrs = {
    bold: props.bold,
    dim: props.dim,
    italic: props.italic,
    underline: props.underline,
    inverse: props.inverse,
    strikethrough: props.strikethrough,
  };

  // Handle wrapping
  const lines = wrapTextForBuffer(text, maxWidth, props.wrap);

  for (let i = 0; i < lines.length; i++) {
    let col = 0;
    for (const char of lines[i]) {
      if (col >= maxWidth) break;
      const charWidth = stringWidth(char);
      buffer.writeChar(x + col, y + i, char, fg, bg, attrs);
      col += charWidth;
    }
  }
}

/**
 * Parse a color string to Color type
 */
function parseColor(color: string): Color {
  // Named colors - return as string for colorToAnsi to handle
  return color;
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
