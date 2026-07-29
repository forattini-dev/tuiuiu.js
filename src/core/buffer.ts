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

import { readRenderableSymbol, stringWidth } from '../utils/text-utils.js';

const NAMED_COLORS: Record<string, number> = {
  black: 0, red: 1, green: 2, yellow: 3,
  blue: 4, magenta: 5, cyan: 6, white: 7,
  gray: 8, grey: 8,
  blackBright: 8,
  redBright: 9, greenBright: 10, yellowBright: 11,
  blueBright: 12, magentaBright: 13, cyanBright: 14, whiteBright: 15,
};

const UNDERLINE_STYLE_MAP: Record<string, string> = {
  single: '4:1',
  double: '4:2',
  curly: '4:3',
  dotted: '4:4',
  dashed: '4:5',
};

const ANSI_STYLE_CACHE_MAX = 512;
const ansiStyleCache = new Map<string, string>();
const MAX_CELL_BUFFER_CELLS = 4_000_000;

// =============================================================================
// Types
// =============================================================================

/** Text style attributes stored as flags for efficient comparison */
export interface CellAttrs {
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  /** Underline style: true/'single' for standard, or styled variants */
  underline?: boolean | 'single' | 'double' | 'curly' | 'dotted' | 'dashed';
  /** Underline color (for terminals supporting SGR 58) */
  underlineColor?: Color;
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
  // underline can be boolean or string, so direct compare (not !!)
  const aUnderline = a.underline || false;
  const bUnderline = b.underline || false;

  return (
    !!a.bold === !!b.bold &&
    !!a.dim === !!b.dim &&
    !!a.italic === !!b.italic &&
    aUnderline === bUnderline &&
    colorEquals(a.underlineColor, b.underlineColor) &&
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
  private rowSignatures: (string | null)[];
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    if (
      !Number.isSafeInteger(width) ||
      !Number.isSafeInteger(height) ||
      width < 0 ||
      height < 0 ||
      width * height > MAX_CELL_BUFFER_CELLS
    ) {
      throw new RangeError(
        `CellBuffer dimensions must be non-negative safe integers totaling at most ${MAX_CELL_BUFFER_CELLS} cells`,
      );
    }
    this.width = width;
    this.height = height;
    this.cells = [];
    this.rowSignatures = new Array(height).fill(null);

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
    if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.cells[y][x];
    }
    return undefined;
  }

  /** Set cell at position */
  set(x: number, y: number, cell: Cell): void {
    if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height) {
      if (cell.isWide) {
        const previous = x > 0 ? this.cells[y][x - 1] : undefined;
        if (!previous || previous.isWide || stringWidth(previous.char) <= 1) {
          this.clearWideFootprint(x, y);
          this.cells[y][x] = emptyCell();
          this.invalidateRow(y);
          this.addDamage(x, y, 1, 1);
          return;
        }
      }
      const cellWidth = cell.isWide ? 1 : Math.max(1, stringWidth(cell.char));
      if (!cell.isWide) {
        this.clearWideFootprint(x, y);
      }
      if (!cell.isWide && cellWidth > 1 && x + cellWidth > this.width) {
        this.cells[y][x] = emptyCell();
        this.invalidateRow(y);
        this.addDamage(x, y, 1, 1);
        return;
      }
      this.cells[y][x] = cell;
      this.invalidateRow(y);
      if (!cell.isWide && cellWidth > 1 && x + cellWidth <= this.width) {
        for (let offset = 1; offset < cellWidth; offset++) {
          this.clearWideFootprint(x + offset, y);
          this.cells[y][x + offset] = {
            char: '',
            fg: cell.fg,
            bg: cell.bg,
            attrs: cell.attrs,
            isWide: true,
          };
        }
      }
      this.addDamage(x, y, Math.min(cellWidth, this.width - x), 1);
    }
  }

  /**
   * Clear both halves of a wide glyph when either its head or placeholder is
   * overwritten. A terminal cell buffer must never retain an orphaned half.
   */
  private clearWideFootprint(x: number, y: number): void {
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      x < 0 ||
      x >= this.width ||
      y < 0 ||
      y >= this.height
    ) return;

    const cell = this.cells[y][x];
    if (cell.isWide) {
      this.cells[y][x] = emptyCell();
      this.invalidateRow(y);
      this.addDamage(x, y, 1, 1);

      if (x > 0) {
        const previous = this.cells[y][x - 1]!;
        if (!previous.isWide && stringWidth(previous.char) > 1) {
          this.cells[y][x - 1] = emptyCell();
          this.addDamage(x - 1, y, 1, 1);
        }
      }
      return;
    }

    const footprint = stringWidth(cell.char);
    if (footprint <= 1) return;

    this.cells[y][x] = emptyCell();
    this.invalidateRow(y);
    this.addDamage(x, y, 1, 1);
    for (let offset = 1; offset < footprint && x + offset < this.width; offset++) {
      if (this.cells[y][x + offset]?.isWide) {
        this.cells[y][x + offset] = emptyCell();
        this.addDamage(x + offset, y, 1, 1);
      }
    }
  }

  /** Write a character at position */
  writeChar(x: number, y: number, char: string, fg?: Color, bg?: Color, attrs: CellAttrs = {}): void {
    if (Number.isInteger(x) && Number.isInteger(y) && x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const charWidth = stringWidth(char);
      if (charWidth <= 0 || x + charWidth > this.width) return;

      for (let offset = 0; offset < charWidth; offset++) {
        this.clearWideFootprint(x + offset, y);
      }
      this.cells[y][x] = { char, fg, bg, attrs };
      this.invalidateRow(y);
      this.addDamage(x, y, charWidth, 1);

      // Mark next cell as wide placeholder for double-width chars
      if (charWidth === 2 && x + 1 < this.width) {
        this.cells[y][x + 1] = { char: '', fg, bg, attrs, isWide: true };
      }
    }
  }

  /** Write a string starting at position */
  writeString(x: number, y: number, text: string, fg?: Color, bg?: Color, attrs: CellAttrs = {}): number {
    if (!Number.isInteger(x) || !Number.isInteger(y)) return 0;
    let col = x;
    let index = 0;

    while (index < text.length) {
      const symbol = readRenderableSymbol(text, index);
      if (!symbol) break;
      index = symbol.nextIndex;

      if (symbol.symbol === '\n') continue;
      if (col >= this.width) break;

      const charWidth = stringWidth(symbol.symbol);
      if (charWidth <= 0) continue;
      if (col + charWidth > this.width) break;
      this.writeChar(col, y, symbol.symbol, fg, bg, attrs);
      col += charWidth;
    }
    return col - x; // Return number of columns written
  }

  /** Fill a single row with the same cell data */
  fillRow(x: number, y: number, width: number, char: string, fg?: Color, bg?: Color, attrs: CellAttrs = {}): void {
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      !Number.isInteger(width) ||
      y < 0 ||
      y >= this.height ||
      width <= 0
    ) return;

    if (stringWidth(char) !== 1) {
      const charWidth = stringWidth(char);
      if (charWidth <= 0) return;
      const start = Math.max(0, x);
      const end = Math.min(this.width, x + width);
      for (let col = start; col + charWidth <= end; col += charWidth) {
        this.writeChar(col, y, char, fg, bg, attrs);
      }
      return;
    }

    const x1 = Math.max(0, x);
    const x2 = Math.min(this.width, x + width);
    if (x2 <= x1) return;

    for (let col = x1; col < x2; col++) {
      this.clearWideFootprint(col, y);
      this.cells[y][col] = { char, fg, bg, attrs };
    }

    this.invalidateRow(y);
    this.addDamage(x1, y, x2 - x1, 1);
  }

  /** Fill a rectangle with a cell */
  fill(x: number, y: number, width: number, height: number, cell: Cell): void {
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      !Number.isInteger(width) ||
      !Number.isInteger(height)
    ) return;
    const x1 = Math.max(0, x);
    const y1 = Math.max(0, y);
    const x2 = Math.min(this.width, x + width);
    const y2 = Math.min(this.height, y + height);

    if (x2 <= x1 || y2 <= y1) {
      return;
    }

    if (stringWidth(cell.char) !== 1) {
      for (let row = y1; row < y2; row++) {
        this.fillRow(x1, row, x2 - x1, cell.char, cell.fg, cell.bg, cell.attrs);
      }
      return;
    }

    for (let row = y1; row < y2; row++) {
      for (let col = x1; col < x2; col++) {
        this.clearWideFootprint(col, row);
        this.cells[row][col] = { char: cell.char, fg: cell.fg, bg: cell.bg, attrs: cell.attrs };
      }
      this.invalidateRow(row);
    }

    this.addDamage(x1, y1, x2 - x1, y2 - y1);
  }

  /** Clear the buffer with empty cells */
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x] = emptyCell();
      }
      this.rowSignatures[y] = null;
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
    if (
      !Number.isInteger(x) ||
      !Number.isInteger(y) ||
      !Number.isInteger(width) ||
      !Number.isInteger(height)
    ) return;
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
      if (this.getRowSignature(y) === target.getRowSignature(y)) {
        continue;
      }

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
   * Calculate patches only inside the provided rectangles.
   * Rectangles should already be normalized to buffer space.
   */
  diffRects(target: CellBuffer, rects: DamageRect[]): CellPatch[] {
    const patches: CellPatch[] = [];
    const maxX = Math.min(this.width, target.width);
    const rowSpans = buildMergedRowSpans(this.width, this.height, target.width, target.height, rects);

    for (const span of rowSpans) {
      const coversWholeRow = span.x1 === 0 && span.x2 >= maxX;
      if (coversWholeRow && this.getRowSignature(span.y) === target.getRowSignature(span.y)) {
        continue;
      }

      for (let x = span.x1; x < span.x2; x++) {
        const current = this.cells[span.y][x];
        const next = target.cells[span.y][x];

        if (!cellEquals(current, next)) {
          patches.push({ x, y: span.y, cell: cloneCell(next) });
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
      this.set(patch.x, patch.y, cloneCell(patch.cell));
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

  private invalidateRow(y: number): void {
    if (y >= 0 && y < this.height) {
      this.rowSignatures[y] = null;
    }
  }

  private getRowSignature(y: number): string {
    const cached = this.rowSignatures[y];
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    const row = this.cells[y];
    let signature = '';

    for (let x = 0; x < row.length; x++) {
      const cell = row[x]!;
      signature += `${cell.char.length}:${cell.char}\u0001${cell.isWide ? 1 : 0}\u0001${getStyleCacheKey(cell.fg, cell.bg, cell.attrs)}\u0002`;
    }

    this.rowSignatures[y] = signature;
    return signature;
  }
}

interface RowSpan {
  y: number;
  x1: number;
  x2: number;
}

function buildMergedRowSpans(
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  rects: DamageRect[],
): RowSpan[] {
  const maxWidth = Math.min(sourceWidth, targetWidth);
  const maxHeight = Math.min(sourceHeight, targetHeight);
  if (rects.length <= 1) {
    return buildMergedRowSpansLinear(maxWidth, maxHeight, rects);
  }

  if (areRectsMonotonic(rects)) {
    return buildMergedRowSpansLinear(maxWidth, maxHeight, rects);
  }

  return buildMergedRowSpansGeneric(maxWidth, maxHeight, rects);
}

function areRectsMonotonic(rects: readonly DamageRect[]): boolean {
  let lastExpandedY = -1;
  let lastExpandedX = -1;

  for (const rect of rects) {
    const x1 = Math.max(0, rect.x);
    const y1 = Math.max(0, rect.y);
    const y2 = rect.y + rect.height - 1;

    if (rect.width <= 0 || rect.height <= 0 || y2 < y1) {
      continue;
    }

    if (y1 < lastExpandedY) {
      return false;
    }

    if (y1 === lastExpandedY && x1 < lastExpandedX) {
      return false;
    }

    lastExpandedY = y2;
    lastExpandedX = x1;
  }

  return true;
}

function buildMergedRowSpansLinear(
  maxWidth: number,
  maxHeight: number,
  rects: readonly DamageRect[],
): RowSpan[] {
  const merged: RowSpan[] = [];

  for (const rect of rects) {
    const x1 = Math.max(0, rect.x);
    const y1 = Math.max(0, rect.y);
    const x2 = Math.min(maxWidth, rect.x + rect.width);
    const y2 = Math.min(maxHeight, rect.y + rect.height);

    if (x2 <= x1 || y2 <= y1) {
      continue;
    }

    for (let y = y1; y < y2; y++) {
      const last = merged[merged.length - 1];
      if (last && last.y === y && x1 <= last.x2) {
        last.x2 = Math.max(last.x2, x2);
        continue;
      }

      merged.push({ y, x1, x2 });
    }
  }

  return merged;
}

function buildMergedRowSpansGeneric(
  maxWidth: number,
  maxHeight: number,
  rects: readonly DamageRect[],
): RowSpan[] {
  const spansByRow = new Map<number, Array<{ x1: number; x2: number }>>();

  for (const rect of rects) {
    const x1 = Math.max(0, rect.x);
    const y1 = Math.max(0, rect.y);
    const x2 = Math.min(maxWidth, rect.x + rect.width);
    const y2 = Math.min(maxHeight, rect.y + rect.height);

    if (x2 <= x1 || y2 <= y1) {
      continue;
    }

    for (let y = y1; y < y2; y++) {
      const spans = spansByRow.get(y);
      if (spans) {
        spans.push({ x1, x2 });
      } else {
        spansByRow.set(y, [{ x1, x2 }]);
      }
    }
  }

  const merged: RowSpan[] = [];
  const rows = [...spansByRow.keys()].sort((left, right) => left - right);

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

      merged.push({ y, x1: current.x1, x2: current.x2 });
      current = next;
    }

    merged.push({ y, x1: current.x1, x2: current.x2 });
  }

  return merged;
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

  /** Swap only within dirty rectangles */
  swapDirty(rects: DamageRect[]): CellPatch[] {
    const patches = this.front.diffRects(this.back, rects);

    const temp = this.front;
    this.front = this.back;
    this.back = temp;

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
    if (NAMED_COLORS[color] !== undefined) {
      const base = background ? 40 : 30;
      const n = NAMED_COLORS[color];
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

  // Styled underline support
  if (attrs.underline) {
    if (typeof attrs.underline === 'string') {
      codes.push(UNDERLINE_STYLE_MAP[attrs.underline] || '4');
    } else {
      codes.push('4');
    }

    // Colored underline (SGR 58;2;R;G;B or 58;5;N)
    if (attrs.underlineColor) {
      const underlineColorCode = underlineColorToAnsi(attrs.underlineColor);
      if (underlineColorCode) {
        codes.push(underlineColorCode);
      }
    }
  }

  if (attrs.blink) codes.push('5');
  if (attrs.inverse) codes.push('7');
  if (attrs.hidden) codes.push('8');
  if (attrs.strikethrough) codes.push('9');
  return codes;
}

function underlineColorToAnsi(color: Color): string {
  const fgCode = colorToAnsi(color, false);
  if (!fgCode) return '';

  if (fgCode.startsWith('38;')) {
    return `58;${fgCode.slice(3)}`;
  }

  const namedCode = Number.parseInt(fgCode, 10);
  if (Number.isNaN(namedCode)) {
    return '';
  }

  if (namedCode >= 30 && namedCode <= 37) {
    return `58;5;${namedCode - 30}`;
  }

  if (namedCode >= 90 && namedCode <= 97) {
    return `58;5;${namedCode - 82}`;
  }

  return '';
}

function serializeColorKey(color: Color | undefined): string {
  if (!color) {
    return '';
  }

  if (typeof color === 'string') {
    return `s:${color}`;
  }

  if ('r' in color) {
    return `r:${color.r},${color.g},${color.b}`;
  }

  return `a:${color.ansi256}`;
}

function getStyleCacheKey(fg: Color | undefined, bg: Color | undefined, attrs: CellAttrs): string {
  return [
    attrs.bold ? '1' : '0',
    attrs.dim ? '1' : '0',
    attrs.italic ? '1' : '0',
    attrs.underline === undefined || attrs.underline === false ? '0' : String(attrs.underline),
    serializeColorKey(attrs.underlineColor),
    attrs.blink ? '1' : '0',
    attrs.inverse ? '1' : '0',
    attrs.hidden ? '1' : '0',
    attrs.strikethrough ? '1' : '0',
    serializeColorKey(fg),
    serializeColorKey(bg),
  ].join('|');
}

function getCachedStyleString(fg: Color | undefined, bg: Color | undefined, attrs: CellAttrs): string | null {
  const key = getStyleCacheKey(fg, bg, attrs);
  const cached = ansiStyleCache.get(key);
  if (cached !== undefined) {
    return cached === '' ? null : cached;
  }

  const codes: string[] = [];
  codes.push(...attrsToAnsi(attrs));

  const fgAnsi = colorToAnsi(fg, false);
  const bgAnsi = colorToAnsi(bg, true);
  if (fgAnsi) codes.push(fgAnsi);
  if (bgAnsi) codes.push(bgAnsi);

  const style = codes.length > 0 ? codes.join(';') : '';
  if (ansiStyleCache.has(key)) {
    ansiStyleCache.delete(key);
  } else if (ansiStyleCache.size >= ANSI_STYLE_CACHE_MAX) {
    const oldest = ansiStyleCache.keys().next();
    if (!oldest.done) {
      ansiStyleCache.delete(oldest.value);
    }
  }
  ansiStyleCache.set(key, style);
  return style === '' ? null : style;
}

function getCharWidthFast(char: string): number {
  if (char.length === 1 && char.charCodeAt(0) <= 0x7f) {
    return 1;
  }

  return stringWidth(char);
}

/** Convert a cell to ANSI string with style */
export function cellToAnsi(cell: Cell): string {
  if (cell.isWide) return ''; // Skip wide placeholders

  const style = getCachedStyleString(cell.fg, cell.bg, cell.attrs);
  if (style !== null) {
    return `\x1b[${style}m${cell.char}\x1b[0m`;
  }

  return cell.char;
}

/**
 * Convert a CellBuffer to ANSI string (optimized for output)
 *
 * @param fullHeight Preserve trailing empty rows when true.
 */
export function bufferToAnsi(buffer: CellBuffer, fullHeight = false): string {
  const lines: string[] = [];

  for (const { cells } of buffer.rows()) {
    const lineParts: string[] = [];
    let runText = '';
    let lastStyle: string | null = null;

    const flushRun = () => {
      if (runText.length > 0) {
        lineParts.push(runText);
        runText = '';
      }
    };

    for (const cell of cells) {
      if (cell.isWide) continue;

      const style = getCachedStyleString(cell.fg, cell.bg, cell.attrs);

      // Only emit style change if different
      if (style !== lastStyle) {
        flushRun();
        if (lastStyle !== null) {
          lineParts.push('\x1b[0m');
        }
        if (style !== null) {
          lineParts.push(`\x1b[${style}m`);
        }
        lastStyle = style;
      }

      runText += cell.char;
    }

    flushRun();

    // Reset at end of line if styled
    if (lastStyle !== null) {
      lineParts.push('\x1b[0m');
    }

    lines.push(lineParts.join('').trimEnd());
  }

  // Remove trailing empty lines
  if (!fullHeight) {
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }
  }

  return lines.join('\n');
}

/**
 * Generate ANSI commands for applying patches (delta rendering)
 *
 * Uses cursor positioning to only update changed cells
 */
export function patchesToAnsi(patches: CellPatch[], width: number, alreadySorted = false): string {
  if (patches.length === 0) return '';

  if (!alreadySorted) {
    // Sort patches by position for optimal cursor movement
    patches.sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
  }

  const outputParts: string[] = [];
  let lastX = -1;
  let lastY = -1;
  let lastStyle: string | null = null;
  let runText = '';

  const flushRun = () => {
    if (runText.length > 0) {
      outputParts.push(runText);
      runText = '';
    }
  };

  for (const patch of patches) {
    const { x, y, cell } = patch;

    if (cell.isWide || x < 0 || x >= width || y < 0) continue;

    // Move cursor if not at expected position
    if (y !== lastY || x !== lastX + 1) {
      flushRun();
      // ANSI cursor position: \x1b[{row};{col}H (1-indexed)
      outputParts.push(`\x1b[${y + 1};${x + 1}H`);
    }

    const style = getCachedStyleString(cell.fg, cell.bg, cell.attrs);

    if (style !== lastStyle) {
      flushRun();
      if (lastStyle !== null) {
        outputParts.push('\x1b[0m');
      }
      if (style !== null) {
        outputParts.push(`\x1b[${style}m`);
      }
      lastStyle = style;
    }

    runText += cell.char;
    lastX = x + (getCharWidthFast(cell.char) - 1);
    lastY = y;
  }

  flushRun();

  if (lastStyle !== null) {
    outputParts.push('\x1b[0m');
  }

  return outputParts.join('');
}
