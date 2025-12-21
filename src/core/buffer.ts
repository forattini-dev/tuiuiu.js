/**
 * Advanced Cell Buffer System
 *
 * Features:
 * - Structured cell attributes (color, style as data, not strings)
 * - Buffer diffing for delta rendering
 * - Damage tracking for partial updates
 * - Double buffering for flicker-free rendering
 * - Buffer pooling for memory efficiency
 *
 * 
 */

import { stringWidth } from '../utils/text-utils.js';

// =============================================================================
// Types
// =============================================================================

/** Text style attributes stored as flags for efficient comparison */
export interface CellAttrs {
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  blink?: boolean;
  inverse?: boolean;
  hidden?: boolean;
  strikethrough?: boolean;
}

/** Color can be: named, hex, rgb, or ANSI 256 */
export type Color =
  | string // Named color or hex
  | { r: number; g: number; b: number } // RGB
  | { ansi256: number }; // ANSI 256

/** A single terminal cell */
export interface Cell {
  /** The character (can be multi-byte for emoji/CJK) */
  char: string;
  /** Foreground color */
  fg?: Color;
  /** Background color */
  bg?: Color;
  /** Text attributes */
  attrs: CellAttrs;
  /** True if this cell is occupied by a wide char from previous cell */
  isWide?: boolean;
}

/** A rectangular region that needs updating */
export interface DamageRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Represents a change between two buffers */
export interface CellPatch {
  x: number;
  y: number;
  cell: Cell;
}

// =============================================================================
// Cell Utilities
// =============================================================================

/** Create an empty cell */
export function createCell(char = ' ', fg?: Color, bg?: Color, attrs: CellAttrs = {}): Cell {
  return { char, fg, bg, attrs };
}

/** Create a default empty cell */
export function emptyCell(): Cell {
  return { char: ' ', attrs: {} };
}

/** Compare two colors for equality */
export function colorEquals(a?: Color, b?: Color): boolean {
  if (a === b) return true;
  if (a === undefined || b === undefined) return false;

  if (typeof a === 'string' && typeof b === 'string') {
    return a === b;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    if ('r' in a && 'r' in b) {
      return a.r === b.r && a.g === b.g && a.b === b.b;
    }
    if ('ansi256' in a && 'ansi256' in b) {
      return a.ansi256 === b.ansi256;
    }
  }

  return false;
}

/** Compare two cell attributes for equality */
export function attrsEquals(a: CellAttrs, b: CellAttrs): boolean {
  return (
    !!a.bold === !!b.bold &&
    !!a.dim === !!b.dim &&
    !!a.italic === !!b.italic &&
    !!a.underline === !!b.underline &&
    !!a.blink === !!b.blink &&
    !!a.inverse === !!b.inverse &&
    !!a.hidden === !!b.hidden &&
    !!a.strikethrough === !!b.strikethrough
  );
}

/** Compare two cells for equality */
export function cellEquals(a: Cell, b: Cell): boolean {
  return (
    a.char === b.char &&
    colorEquals(a.fg, b.fg) &&
    colorEquals(a.bg, b.bg) &&
    attrsEquals(a.attrs, b.attrs) &&
    !!a.isWide === !!b.isWide
  );
}

/** Clone a cell */
export function cloneCell(cell: Cell): Cell {
  return {
    char: cell.char,
    fg: cell.fg,
    bg: cell.bg,
    attrs: { ...cell.attrs },
    isWide: cell.isWide,
  };
}

// =============================================================================
// CellBuffer Class
// =============================================================================

/**
 * A 2D grid of cells with damage tracking
 */
export class CellBuffer {
  private cells: Cell[][];
  private damageRects: DamageRect[] = [];
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = [];

    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push(emptyCell());
      }
      this.cells.push(row);
    }
  }

  /** Get cell at position */
  get(x: number, y: number): Cell | undefined {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.cells[y][x];
    }
    return undefined;
  }

  /** Set cell at position */
  set(x: number, y: number, cell: Cell): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.cells[y][x] = cell;
      this.addDamage(x, y, 1, 1);
    }
  }

  /** Write a character at position */
  writeChar(x: number, y: number, char: string, fg?: Color, bg?: Color, attrs: CellAttrs = {}): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const charWidth = stringWidth(char);
      this.cells[y][x] = { char, fg, bg, attrs };
      this.addDamage(x, y, charWidth, 1);

      // Mark next cell as wide placeholder for double-width chars
      if (charWidth === 2 && x + 1 < this.width) {
        this.cells[y][x + 1] = { char: '', fg, bg, attrs, isWide: true };
      }
    }
  }

  /** Write a string starting at position */
  writeString(x: number, y: number, text: string, fg?: Color, bg?: Color, attrs: CellAttrs = {}): number {
    let col = x;
    for (const char of text) {
      if (char === '\n') continue;
      if (col >= this.width) break;

      const charWidth = stringWidth(char);
      this.writeChar(col, y, char, fg, bg, attrs);
      col += charWidth;
    }
    return col - x; // Return number of columns written
  }

  /** Fill a rectangle with a cell */
  fill(x: number, y: number, width: number, height: number, cell: Cell): void {
    const x1 = Math.max(0, x);
    const y1 = Math.max(0, y);
    const x2 = Math.min(this.width, x + width);
    const y2 = Math.min(this.height, y + height);

    for (let row = y1; row < y2; row++) {
      for (let col = x1; col < x2; col++) {
        this.cells[row][col] = cloneCell(cell);
      }
    }

    if (x2 > x1 && y2 > y1) {
      this.addDamage(x1, y1, x2 - x1, y2 - y1);
    }
  }

  /** Clear the buffer with empty cells */
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x] = emptyCell();
      }
    }
    this.addDamage(0, 0, this.width, this.height);
  }

  /** Copy content from another buffer */
  copyFrom(source: CellBuffer, srcX = 0, srcY = 0, dstX = 0, dstY = 0, width?: number, height?: number): void {
    const w = width ?? source.width;
    const h = height ?? source.height;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const srcCell = source.get(srcX + x, srcY + y);
        if (srcCell) {
          this.set(dstX + x, dstY + y, cloneCell(srcCell));
        }
      }
    }
  }

  // =========================================================================
  // Damage Tracking
  // =========================================================================

  /** Add a damage rectangle */
  addDamage(x: number, y: number, width: number, height: number): void {
    // Clamp to buffer bounds
    const x1 = Math.max(0, x);
    const y1 = Math.max(0, y);
    const x2 = Math.min(this.width, x + width);
    const y2 = Math.min(this.height, y + height);

    if (x2 > x1 && y2 > y1) {
      this.damageRects.push({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 });
    }
  }

  /** Get all damage rectangles */
  getDamage(): DamageRect[] {
    return this.damageRects;
  }

  /** Clear damage tracking */
  clearDamage(): void {
    this.damageRects = [];
  }

  /** Check if any damage exists */
  hasDamage(): boolean {
    return this.damageRects.length > 0;
  }

  /** Merge overlapping damage rectangles for efficiency */
  consolidateDamage(): DamageRect[] {
    if (this.damageRects.length <= 1) {
      return this.damageRects;
    }

    // Simple approach: merge into bounding box
    // More sophisticated: use region algebra
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;

    for (const rect of this.damageRects) {
      minX = Math.min(minX, rect.x);
      minY = Math.min(minY, rect.y);
      maxX = Math.max(maxX, rect.x + rect.width);
      maxY = Math.max(maxY, rect.y + rect.height);
    }

    const merged: DamageRect = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    this.damageRects = [merged];
    return this.damageRects;
  }

  // =========================================================================
  // Buffer Diffing
  // =========================================================================

  /**
   * Calculate patches needed to transform this buffer into target buffer
   * Returns only cells that differ between buffers
   */
  diff(target: CellBuffer): CellPatch[] {
    const patches: CellPatch[] = [];
    const maxX = Math.min(this.width, target.width);
    const maxY = Math.min(this.height, target.height);

    for (let y = 0; y < maxY; y++) {
      for (let x = 0; x < maxX; x++) {
        const current = this.cells[y][x];
        const next = target.cells[y][x];

        if (!cellEquals(current, next)) {
          patches.push({ x, y, cell: cloneCell(next) });
        }
      }
    }

    return patches;
  }

  /**
   * Apply patches to this buffer
   */
  applyPatches(patches: CellPatch[]): void {
    for (const patch of patches) {
      this.set(patch.x, patch.y, patch.cell);
    }
  }

  // =========================================================================
  // Iteration
  // =========================================================================

  /** Iterate over all cells */
  *[Symbol.iterator](): Generator<{ x: number; y: number; cell: Cell }> {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        yield { x, y, cell: this.cells[y][x] };
      }
    }
  }

  /** Iterate over rows */
  *rows(): Generator<{ y: number; cells: Cell[] }> {
    for (let y = 0; y < this.height; y++) {
      yield { y, cells: this.cells[y] };
    }
  }
}

// =============================================================================
// Double Buffer System
// =============================================================================

/**
 * Double buffer for flicker-free rendering
 *
 * Maintains front (displayed) and back (being drawn) buffers.
 * After drawing, swap() makes back buffer visible and old front becomes new back.
 */
export class DoubleBuffer {
  private front: CellBuffer;
  private back: CellBuffer;
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.front = new CellBuffer(width, height);
    this.back = new CellBuffer(width, height);
  }

  /** Get the back buffer for drawing */
  getBackBuffer(): CellBuffer {
    return this.back;
  }

  /** Get the front buffer (currently displayed) */
  getFrontBuffer(): CellBuffer {
    return this.front;
  }

  /** Swap front and back buffers, return patches for what changed */
  swap(): CellPatch[] {
    const patches = this.front.diff(this.back);

    // Swap references
    const temp = this.front;
    this.front = this.back;
    this.back = temp;

    // Clear the new back buffer's damage
    this.back.clearDamage();

    return patches;
  }

  /** Resize both buffers (clears content) */
  resize(width: number, height: number): void {
    (this as { width: number }).width = width;
    (this as { height: number }).height = height;
    this.front = new CellBuffer(width, height);
    this.back = new CellBuffer(width, height);
  }
}

// =============================================================================
// Buffer Pool
// =============================================================================

/**
 * Pool of reusable buffers to reduce allocations
 */
export class BufferPool {
  private pool: Map<string, CellBuffer[]> = new Map();
  private maxPoolSize = 10;

  /** Get or create a buffer of specified size */
  acquire(width: number, height: number): CellBuffer {
    const key = `${width}x${height}`;
    const pool = this.pool.get(key);

    if (pool && pool.length > 0) {
      const buffer = pool.pop()!;
      buffer.clear();
      return buffer;
    }

    return new CellBuffer(width, height);
  }

  /** Return a buffer to the pool for reuse */
  release(buffer: CellBuffer): void {
    const key = `${buffer.width}x${buffer.height}`;
    let pool = this.pool.get(key);

    if (!pool) {
      pool = [];
      this.pool.set(key, pool);
    }

    if (pool.length < this.maxPoolSize) {
      buffer.clear();
      buffer.clearDamage();
      pool.push(buffer);
    }
  }

  /** Clear all pooled buffers */
  clear(): void {
    this.pool.clear();
  }

  /** Get pool statistics */
  stats(): { sizes: string[]; totalBuffers: number } {
    const sizes: string[] = [];
    let total = 0;

    for (const [key, pool] of this.pool) {
      sizes.push(`${key}: ${pool.length}`);
      total += pool.length;
    }

    return { sizes, totalBuffers: total };
  }
}

// =============================================================================
// ANSI Conversion
// =============================================================================

/** Convert a Color to ANSI escape code */
export function colorToAnsi(color: Color | undefined, background: boolean): string {
  if (!color) return '';

  const code = background ? 48 : 38;

  if (typeof color === 'string') {
    // Named colors
    const namedColors: Record<string, number> = {
      black: 0, red: 1, green: 2, yellow: 3,
      blue: 4, magenta: 5, cyan: 6, white: 7,
      gray: 8, grey: 8,
      redBright: 9, greenBright: 10, yellowBright: 11,
      blueBright: 12, magentaBright: 13, cyanBright: 14, whiteBright: 15,
    };

    if (namedColors[color] !== undefined) {
      const base = background ? 40 : 30;
      const n = namedColors[color];
      if (n < 8) return `${base + n}`;
      return `${base + n + 52}`; // Bright colors: 90-97 / 100-107
    }

    // Hex color
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `${code};2;${r};${g};${b}`;
    }

    return '';
  }

  if ('r' in color) {
    return `${code};2;${color.r};${color.g};${color.b}`;
  }

  if ('ansi256' in color) {
    return `${code};5;${color.ansi256}`;
  }

  return '';
}

/** Convert cell attributes to ANSI codes */
export function attrsToAnsi(attrs: CellAttrs): string[] {
  const codes: string[] = [];
  if (attrs.bold) codes.push('1');
  if (attrs.dim) codes.push('2');
  if (attrs.italic) codes.push('3');
  if (attrs.underline) codes.push('4');
  if (attrs.blink) codes.push('5');
  if (attrs.inverse) codes.push('7');
  if (attrs.hidden) codes.push('8');
  if (attrs.strikethrough) codes.push('9');
  return codes;
}

/** Convert a cell to ANSI string with style */
export function cellToAnsi(cell: Cell): string {
  if (cell.isWide) return ''; // Skip wide placeholders

  const codes: string[] = [];

  // Attributes
  codes.push(...attrsToAnsi(cell.attrs));

  // Colors
  const fg = colorToAnsi(cell.fg, false);
  const bg = colorToAnsi(cell.bg, true);
  if (fg) codes.push(fg);
  if (bg) codes.push(bg);

  if (codes.length > 0) {
    return `\x1b[${codes.join(';')}m${cell.char}\x1b[0m`;
  }

  return cell.char;
}

/**
 * Convert a CellBuffer to ANSI string (optimized for output)
 */
export function bufferToAnsi(buffer: CellBuffer): string {
  const lines: string[] = [];

  for (const { cells } of buffer.rows()) {
    let line = '';
    let lastStyle: string | null = null;

    for (const cell of cells) {
      if (cell.isWide) continue;

      // Build style string
      const codes: string[] = [];
      codes.push(...attrsToAnsi(cell.attrs));
      const fg = colorToAnsi(cell.fg, false);
      const bg = colorToAnsi(cell.bg, true);
      if (fg) codes.push(fg);
      if (bg) codes.push(bg);

      const style = codes.length > 0 ? codes.join(';') : null;

      // Only emit style change if different
      if (style !== lastStyle) {
        if (lastStyle !== null) {
          line += '\x1b[0m';
        }
        if (style !== null) {
          line += `\x1b[${style}m`;
        }
        lastStyle = style;
      }

      line += cell.char;
    }

    // Reset at end of line if styled
    if (lastStyle !== null) {
      line += '\x1b[0m';
    }

    lines.push(line.trimEnd());
  }

  // Remove trailing empty lines
  while (lines.length > 0 && lines[lines.length - 1] === '') {
    lines.pop();
  }

  return lines.join('\n');
}

/**
 * Generate ANSI commands for applying patches (delta rendering)
 *
 * Uses cursor positioning to only update changed cells
 */
export function patchesToAnsi(patches: CellPatch[], width: number): string {
  if (patches.length === 0) return '';

  // Sort patches by position for optimal cursor movement
  patches.sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  let output = '';
  let lastX = -1;
  let lastY = -1;
  let lastStyle: string | null = null;

  for (const patch of patches) {
    const { x, y, cell } = patch;

    if (cell.isWide) continue;

    // Move cursor if not at expected position
    if (y !== lastY || x !== lastX + 1) {
      // ANSI cursor position: \x1b[{row};{col}H (1-indexed)
      output += `\x1b[${y + 1};${x + 1}H`;
    }

    // Build style
    const codes: string[] = [];
    codes.push(...attrsToAnsi(cell.attrs));
    const fg = colorToAnsi(cell.fg, false);
    const bg = colorToAnsi(cell.bg, true);
    if (fg) codes.push(fg);
    if (bg) codes.push(bg);

    const style = codes.length > 0 ? codes.join(';') : null;

    if (style !== lastStyle) {
      if (lastStyle !== null) {
        output += '\x1b[0m';
      }
      if (style !== null) {
        output += `\x1b[${style}m`;
      }
      lastStyle = style;
    }

    output += cell.char;
    lastX = x + (stringWidth(cell.char) - 1);
    lastY = y;
  }

  if (lastStyle !== null) {
    output += '\x1b[0m';
  }

  return output;
}
