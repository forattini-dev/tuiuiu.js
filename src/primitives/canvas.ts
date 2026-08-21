/**
 * Canvas Widget - 2D Drawing Canvas for Terminal
 *
 * Provides a canvas component for drawing shapes, lines, and graphics
 * in the terminal. Supports multiple drawing modes:
 * - Character mode: Uses ASCII/Unicode characters
 * - Braille mode: Uses braille characters for 2x4 sub-character resolution
 * - Block mode: Uses block characters for 2x2 sub-character resolution
 */

import { colorToAnsi, stringWidth } from '../utils/text-utils.js';
import { segmentGraphemes } from '../utils/grapheme.js';
import { resolveColor } from '../core/theme.js';

// =============================================================================
// Types
// =============================================================================

/**
 * Drawing mode for the canvas
 */
export type CanvasMode = 'character' | 'braille' | 'block';

/**
 * Point in 2D space
 */
export interface Point {
  x: number;
  y: number;
}

/**
 * Canvas color
 */
export type CanvasColor = string | null;

/**
 * Line style
 */
export interface LineStyle {
  color?: CanvasColor;
  thickness?: number;
  dashed?: boolean;
  dashPattern?: number[];
}

/**
 * Fill style
 */
export interface FillStyle {
  color?: CanvasColor;
  pattern?: string;
}

/**
 * Text style
 */
export interface TextStyle {
  color?: CanvasColor;
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
}

/**
 * Canvas options
 */
export interface CanvasOptions {
  /** Canvas width in characters */
  width: number;
  /** Canvas height in characters */
  height: number;
  /** Drawing mode */
  mode?: CanvasMode;
  /** Default foreground color */
  foreground?: CanvasColor;
  /** Default background color */
  background?: CanvasColor;
  /** Fill character for character mode */
  fillChar?: string;
  /** Default color for pixels set without explicit color */
  defaultColor?: CanvasColor;
}

/**
 * Canvas state
 */
export interface CanvasState {
  width: number;
  height: number;
  mode: CanvasMode;
  buffer: string[][];
  foreground: CanvasColor;
  background: CanvasColor;
}

// =============================================================================
// Constants
// =============================================================================

const MAX_CANVAS_DIMENSION = 10_000;
const MAX_CANVAS_CELLS = 1_000_000;
const MAX_DRAW_POINTS = 1_000_000;

/**
 * Braille character patterns (2x4 dots)
 * Each braille character represents 8 dots arranged as:
 * [0] [3]
 * [1] [4]
 * [2] [5]
 * [6] [7]
 */
const BRAILLE_BASE = 0x2800;
const BRAILLE_DOTS = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80];

/**
 * Block character patterns (2x2)
 * Uses Unicode block characters for better density
 */
export const BLOCK_CHARS = {
  empty: ' ',
  full: '█',
  topHalf: '▀',
  bottomHalf: '▄',
  leftHalf: '▌',
  rightHalf: '▐',
  topLeft: '▘',
  topRight: '▝',
  bottomLeft: '▖',
  bottomRight: '▗',
  topLeftBottomRight: '▚',
  topRightBottomLeft: '▞',
  // Quarter blocks
  topLeftBottomLeftBottomRight: '▙',
  topLeftTopRightBottomLeft: '▛',
  topLeftTopRightBottomRight: '▜',
  topRightBottomLeftBottomRight: '▟',
};

/**
 * Box drawing characters for lines
 */
export const LINE_CHARS = {
  horizontal: '─',
  vertical: '│',
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  cross: '┼',
  teeDown: '┬',
  teeUp: '┴',
  teeRight: '├',
  teeLeft: '┤',
};

// =============================================================================
// Braille Utilities
// =============================================================================

/**
 * Create a braille buffer for higher resolution drawing
 */
export function createBrailleBuffer(
  width: number,
  height: number
): boolean[][] {
  validateCanvasDimension(width, 'width');
  validateCanvasDimension(height, 'height');
  validateCanvasArea(width, height, 8);
  // Each character cell is 2x4 braille dots
  const dotWidth = width * 2;
  const dotHeight = height * 4;
  const buffer: boolean[][] = [];

  for (let y = 0; y < dotHeight; y++) {
    buffer.push(new Array(dotWidth).fill(false));
  }

  return buffer;
}

/**
 * Set a dot in the braille buffer
 */
export function setBrailleDot(
  buffer: boolean[][],
  x: number,
  y: number,
  value = true
): void {
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return;
  if (y >= 0 && y < buffer.length && x >= 0 && x < (buffer[0]?.length ?? 0)) {
    buffer[y]![x] = value;
  }
}

/**
 * Convert braille buffer to string output
 */
export function brailleBufferToString(buffer: boolean[][]): string {
  const height = buffer.length;
  const width = buffer[0]?.length ?? 0;
  const charHeight = Math.ceil(height / 4);
  const charWidth = Math.ceil(width / 2);

  const lines: string[] = [];

  for (let cy = 0; cy < charHeight; cy++) {
    let line = '';
    for (let cx = 0; cx < charWidth; cx++) {
      let code = BRAILLE_BASE;

      // Map 2x4 dots to braille pattern
      const baseX = cx * 2;
      const baseY = cy * 4;

      // Left column (dots 0, 1, 2, 6)
      if (buffer[baseY]?.[baseX]) code += BRAILLE_DOTS[0]!;
      if (buffer[baseY + 1]?.[baseX]) code += BRAILLE_DOTS[1]!;
      if (buffer[baseY + 2]?.[baseX]) code += BRAILLE_DOTS[2]!;
      if (buffer[baseY + 3]?.[baseX]) code += BRAILLE_DOTS[6]!;

      // Right column (dots 3, 4, 5, 7)
      if (buffer[baseY]?.[baseX + 1]) code += BRAILLE_DOTS[3]!;
      if (buffer[baseY + 1]?.[baseX + 1]) code += BRAILLE_DOTS[4]!;
      if (buffer[baseY + 2]?.[baseX + 1]) code += BRAILLE_DOTS[5]!;
      if (buffer[baseY + 3]?.[baseX + 1]) code += BRAILLE_DOTS[7]!;

      line += String.fromCharCode(code);
    }
    lines.push(line);
  }

  return lines.join('\n');
}

// =============================================================================
// Block Utilities
// =============================================================================

/**
 * Create a block buffer for 2x2 sub-character resolution
 */
export function createBlockBuffer(
  width: number,
  height: number
): boolean[][] {
  validateCanvasDimension(width, 'width');
  validateCanvasDimension(height, 'height');
  validateCanvasArea(width, height, 4);
  const blockWidth = width * 2;
  const blockHeight = height * 2;
  const buffer: boolean[][] = [];

  for (let y = 0; y < blockHeight; y++) {
    buffer.push(new Array(blockWidth).fill(false));
  }

  return buffer;
}

/**
 * Set a pixel in the block buffer
 */
export function setBlockPixel(
  buffer: boolean[][],
  x: number,
  y: number,
  value = true
): void {
  if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return;
  if (y >= 0 && y < buffer.length && x >= 0 && x < (buffer[0]?.length ?? 0)) {
    buffer[y]![x] = value;
  }
}

/**
 * Convert block buffer to string output
 */
export function blockBufferToString(buffer: boolean[][]): string {
  const height = buffer.length;
  const width = buffer[0]?.length ?? 0;
  const charHeight = Math.ceil(height / 2);
  const charWidth = Math.ceil(width / 2);

  const lines: string[] = [];

  for (let cy = 0; cy < charHeight; cy++) {
    let line = '';
    for (let cx = 0; cx < charWidth; cx++) {
      const baseX = cx * 2;
      const baseY = cy * 2;

      const topLeft = buffer[baseY]?.[baseX] ?? false;
      const topRight = buffer[baseY]?.[baseX + 1] ?? false;
      const bottomLeft = buffer[baseY + 1]?.[baseX] ?? false;
      const bottomRight = buffer[baseY + 1]?.[baseX + 1] ?? false;

      // Map 2x2 pattern to block character
      if (!topLeft && !topRight && !bottomLeft && !bottomRight) {
        line += ' ';
      } else if (topLeft && topRight && bottomLeft && bottomRight) {
        line += '█';
      } else if (topLeft && topRight && !bottomLeft && !bottomRight) {
        line += '▀';
      } else if (!topLeft && !topRight && bottomLeft && bottomRight) {
        line += '▄';
      } else if (topLeft && !topRight && bottomLeft && !bottomRight) {
        line += '▌';
      } else if (!topLeft && topRight && !bottomLeft && bottomRight) {
        line += '▐';
      } else if (topLeft && !topRight && !bottomLeft && !bottomRight) {
        line += '▘';
      } else if (!topLeft && topRight && !bottomLeft && !bottomRight) {
        line += '▝';
      } else if (!topLeft && !topRight && bottomLeft && !bottomRight) {
        line += '▖';
      } else if (!topLeft && !topRight && !bottomLeft && bottomRight) {
        line += '▗';
      } else if (topLeft && !topRight && !bottomLeft && bottomRight) {
        line += '▚';
      } else if (!topLeft && topRight && bottomLeft && !bottomRight) {
        line += '▞';
      } else if (topLeft && !topRight && bottomLeft && bottomRight) {
        line += '▙';
      } else if (topLeft && topRight && bottomLeft && !bottomRight) {
        line += '▛';
      } else if (topLeft && topRight && !bottomLeft && bottomRight) {
        line += '▜';
      } else if (!topLeft && topRight && bottomLeft && bottomRight) {
        line += '▟';
      } else {
        line += '▒';
      }
    }
    lines.push(line);
  }

  return lines.join('\n');
}

// =============================================================================
// Drawing Algorithms
// =============================================================================

/**
 * Bresenham's line algorithm
 * Returns all points along a line from (x0, y0) to (x1, y1)
 */
export function bresenhamLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number
): Point[] {
  [x0, y0, x1, y1] = [
    normalizeCoordinate(x0, 'x0'),
    normalizeCoordinate(y0, 'y0'),
    normalizeCoordinate(x1, 'x1'),
    normalizeCoordinate(y1, 'y1'),
  ];
  const points: Point[] = [];

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  if (Math.max(dx, dy) + 1 > MAX_DRAW_POINTS) {
    throw new RangeError(`Line exceeds the ${MAX_DRAW_POINTS} point safety limit`);
  }
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  let x = x0;
  let y = y0;

  while (true) {
    points.push({ x, y });

    if (x === x1 && y === y1) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }

  return points;
}

/**
 * Midpoint circle algorithm
 * Returns all points on the circumference of a circle
 */
export function midpointCircle(
  cx: number,
  cy: number,
  radius: number
): Point[] {
  cx = normalizeCoordinate(cx, 'circle center x');
  cy = normalizeCoordinate(cy, 'circle center y');
  radius = normalizeNonNegativeDrawingInteger(radius, 'circle radius');
  if (radius * 8 > MAX_DRAW_POINTS) {
    throw new RangeError('Circle exceeds the drawing point safety limit');
  }
  const points: Point[] = [];

  if (radius <= 0) {
    points.push({ x: cx, y: cy });
    return points;
  }

  let x = radius;
  let y = 0;
  let d = 1 - radius;

  const addCirclePoints = (px: number, py: number) => {
    points.push({ x: cx + px, y: cy + py });
    points.push({ x: cx - px, y: cy + py });
    points.push({ x: cx + px, y: cy - py });
    points.push({ x: cx - px, y: cy - py });
    points.push({ x: cx + py, y: cy + px });
    points.push({ x: cx - py, y: cy + px });
    points.push({ x: cx + py, y: cy - px });
    points.push({ x: cx - py, y: cy - px });
  };

  addCirclePoints(x, y);

  while (x > y) {
    y++;
    if (d <= 0) {
      d += 2 * y + 1;
    } else {
      x--;
      d += 2 * (y - x) + 1;
    }
    addCirclePoints(x, y);
  }

  return points;
}

/**
 * Fill circle using scanlines
 */
export function filledCircle(
  cx: number,
  cy: number,
  radius: number
): Point[] {
  cx = normalizeCoordinate(cx, 'circle center x');
  cy = normalizeCoordinate(cy, 'circle center y');
  radius = normalizeNonNegativeDrawingInteger(radius, 'circle radius');
  if (Math.PI * radius * radius > MAX_DRAW_POINTS) {
    throw new RangeError('Filled circle exceeds the drawing point safety limit');
  }
  const points: Point[] = [];

  for (let y = -radius; y <= radius; y++) {
    const width = Math.floor(Math.sqrt(radius * radius - y * y));
    for (let x = -width; x <= width; x++) {
      points.push({ x: cx + x, y: cy + y });
    }
  }

  return points;
}

/**
 * Midpoint ellipse algorithm
 */
export function midpointEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number
): Point[] {
  cx = normalizeCoordinate(cx, 'ellipse center x');
  cy = normalizeCoordinate(cy, 'ellipse center y');
  rx = normalizeNonNegativeDrawingInteger(rx, 'ellipse x radius');
  ry = normalizeNonNegativeDrawingInteger(ry, 'ellipse y radius');
  if (4 * (rx + ry) > MAX_DRAW_POINTS) {
    throw new RangeError('Ellipse exceeds the drawing point safety limit');
  }
  const points: Point[] = [];

  if (rx <= 0 || ry <= 0) {
    points.push({ x: cx, y: cy });
    return points;
  }

  const rx2 = rx * rx;
  const ry2 = ry * ry;

  let x = 0;
  let y = ry;
  let px = 0;
  let py = 2 * rx2 * y;

  const addEllipsePoints = (px: number, py: number) => {
    points.push({ x: cx + px, y: cy + py });
    points.push({ x: cx - px, y: cy + py });
    points.push({ x: cx + px, y: cy - py });
    points.push({ x: cx - px, y: cy - py });
  };

  addEllipsePoints(x, y);

  // Region 1
  let d1 = ry2 - rx2 * ry + 0.25 * rx2;
  while (px < py) {
    x++;
    px += 2 * ry2;
    if (d1 < 0) {
      d1 += ry2 + px;
    } else {
      y--;
      py -= 2 * rx2;
      d1 += ry2 + px - py;
    }
    addEllipsePoints(x, y);
  }

  // Region 2
  let d2 = ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2;
  while (y > 0) {
    y--;
    py -= 2 * rx2;
    if (d2 > 0) {
      d2 += rx2 - py;
    } else {
      x++;
      px += 2 * ry2;
      d2 += rx2 - py + px;
    }
    addEllipsePoints(x, y);
  }

  return points;
}

/**
 * Arc points (portion of a circle)
 */
export function arcPoints(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
): Point[] {
  cx = normalizeCoordinate(cx, 'arc center x');
  cy = normalizeCoordinate(cy, 'arc center y');
  radius = normalizeNonNegativeDrawingInteger(radius, 'arc radius');
  if (!Number.isFinite(startAngle) || !Number.isFinite(endAngle)) {
    throw new RangeError('Arc angles must be finite numbers');
  }
  const points: Point[] = [];

  // Convert to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate number of steps based on arc length
  const arcLength = Math.abs(endRad - startRad) * radius;
  const steps = Math.max(Math.ceil(arcLength), 20);
  if (!Number.isSafeInteger(steps) || steps > MAX_DRAW_POINTS) {
    throw new RangeError('Arc exceeds the drawing point safety limit');
  }

  for (let i = 0; i <= steps; i++) {
    const angle = startRad + (i / steps) * (endRad - startRad);
    const x = Math.round(cx + radius * Math.cos(angle));
    const y = Math.round(cy + radius * Math.sin(angle));
    points.push({ x, y });
  }

  return points;
}

/**
 * Bezier curve points (cubic)
 */
export function bezierCurve(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  steps = 50
): Point[] {
  [p0, p1, p2, p3].forEach(validateDrawingPoint);
  steps = normalizeDrawingSteps(steps, 'Bezier steps');
  const points: Point[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const t2 = t * t;
    const t3 = t2 * t;
    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;

    const x = Math.round(
      mt3 * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t3 * p3.x
    );
    const y = Math.round(
      mt3 * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t3 * p3.y
    );

    points.push({ x, y });
  }

  return points;
}

/**
 * Quadratic bezier curve
 */
export function quadraticBezier(
  p0: Point,
  p1: Point,
  p2: Point,
  steps = 50
): Point[] {
  [p0, p1, p2].forEach(validateDrawingPoint);
  steps = normalizeDrawingSteps(steps, 'Quadratic Bezier steps');
  const points: Point[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const mt = 1 - t;

    const x = Math.round(mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x);
    const y = Math.round(mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y);

    points.push({ x, y });
  }

  return points;
}

/**
 * Polygon points (closed shape)
 */
export function polygonPoints(vertices: Point[]): Point[] {
  vertices.forEach(validateDrawingPoint);
  const points: Point[] = [];

  if (vertices.length < 2) return points;

  for (let i = 0; i < vertices.length; i++) {
    const start = vertices[i]!;
    const end = vertices[(i + 1) % vertices.length]!;
    const linePoints = bresenhamLine(start.x, start.y, end.x, end.y);
    points.push(...linePoints);
  }

  return points;
}

/**
 * Filled polygon using scanline fill
 */
export function filledPolygon(vertices: Point[]): Point[] {
  vertices.forEach(validateDrawingPoint);
  const points: Point[] = [];

  if (vertices.length < 3) return points;

  // Find bounding box
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  for (const v of vertices) {
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
  }
  if (
    (maxX - minX + 1) * (maxY - minY + 1) > MAX_DRAW_POINTS
  ) {
    throw new RangeError('Polygon exceeds the drawing point safety limit');
  }

  // Scanline fill
  for (let y = minY; y <= maxY; y++) {
    const intersections: number[] = [];

    // Find all intersections with this scanline
    for (let i = 0; i < vertices.length; i++) {
      const v1 = vertices[i]!;
      const v2 = vertices[(i + 1) % vertices.length]!;

      // Check if edge crosses this scanline
      if ((v1.y <= y && v2.y > y) || (v2.y <= y && v1.y > y)) {
        // Calculate x intersection
        const x = v1.x + ((y - v1.y) / (v2.y - v1.y)) * (v2.x - v1.x);
        intersections.push(Math.round(x));
      }
    }

    // Sort intersections
    intersections.sort((a, b) => a - b);

    // Fill between pairs of intersections
    for (let i = 0; i < intersections.length; i += 2) {
      const x1 = intersections[i]!;
      const x2 = intersections[i + 1] ?? x1;
      for (let x = x1; x <= x2; x++) {
        points.push({ x, y });
      }
    }
  }

  return points;
}

/**
 * Rectangle outline
 */
export function rectanglePoints(
  x: number,
  y: number,
  width: number,
  height: number
): Point[] {
  x = normalizeCoordinate(x, 'rectangle x');
  y = normalizeCoordinate(y, 'rectangle y');
  validateShapeDimension(width, 'rectangle width');
  validateShapeDimension(height, 'rectangle height');
  if (width * 2 + height * 2 > MAX_DRAW_POINTS) {
    throw new RangeError('Rectangle exceeds the drawing point safety limit');
  }
  const points: Point[] = [];

  // Top edge
  for (let i = 0; i < width; i++) {
    points.push({ x: x + i, y });
  }
  // Bottom edge
  for (let i = 0; i < width; i++) {
    points.push({ x: x + i, y: y + height - 1 });
  }
  // Left edge (excluding corners)
  for (let i = 1; i < height - 1; i++) {
    points.push({ x, y: y + i });
  }
  // Right edge (excluding corners)
  for (let i = 1; i < height - 1; i++) {
    points.push({ x: x + width - 1, y: y + i });
  }

  return points;
}

/**
 * Filled rectangle
 */
export function filledRectangle(
  x: number,
  y: number,
  width: number,
  height: number
): Point[] {
  x = normalizeCoordinate(x, 'rectangle x');
  y = normalizeCoordinate(y, 'rectangle y');
  validateShapeDimension(width, 'rectangle width');
  validateShapeDimension(height, 'rectangle height');
  if (width * height > MAX_DRAW_POINTS) {
    throw new RangeError('Filled rectangle exceeds the drawing point safety limit');
  }
  const points: Point[] = [];

  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      points.push({ x: x + dx, y: y + dy });
    }
  }

  return points;
}

// =============================================================================
// Canvas Class
// =============================================================================

/**
 * Canvas - 2D Drawing Canvas for Terminal
 *
 * @example
 * ```typescript
 * const canvas = createCanvas({ width: 40, height: 20 });
 *
 * // Draw shapes
 * canvas.line(0, 0, 39, 19);
 * canvas.circle(20, 10, 5);
 * canvas.rect(5, 5, 10, 8, true);
 *
 * // Render to string
 * const output = canvas.render();
 * console.log(output);
 * ```
 */
export class Canvas {
  private width: number;
  private height: number;
  private mode: CanvasMode;
  private foreground: CanvasColor;
  private background: CanvasColor;
  private fillChar: string;
  private defaultColor: CanvasColor;

  // Character mode buffer
  private charBuffer: string[][];

  // Color buffer (stores color for each cell)
  private colorBuffer: (CanvasColor | undefined)[][];
  private boldBuffer: boolean[][];
  private italicBuffer: boolean[][];

  // Braille mode buffer (2x4 resolution per character)
  private brailleBuffer: boolean[][] | null = null;

  // Block mode buffer (2x2 resolution per character)
  private blockBuffer: boolean[][] | null = null;

  constructor(options: CanvasOptions) {
    validateCanvasDimension(options.width, 'width');
    validateCanvasDimension(options.height, 'height');
    validateCanvasArea(options.width, options.height, 1);
    this.width = options.width;
    this.height = options.height;
    this.mode = options.mode ?? 'character';
    this.foreground = options.foreground ?? null;
    this.background = options.background ?? null;
    this.fillChar = normalizeCanvasCell(options.fillChar ?? '\u2588', 'fillChar');
    this.defaultColor = options.defaultColor ?? null;

    // Initialize character buffer
    this.charBuffer = [];
    for (let y = 0; y < this.height; y++) {
      this.charBuffer.push(new Array(this.width).fill(' '));
    }

    // Initialize color buffer
    this.colorBuffer = [];
    this.boldBuffer = [];
    this.italicBuffer = [];
    for (let y = 0; y < this.height; y++) {
      this.colorBuffer.push(new Array(this.width).fill(undefined));
      this.boldBuffer.push(new Array(this.width).fill(false));
      this.italicBuffer.push(new Array(this.width).fill(false));
    }

    // Initialize mode-specific buffers
    if (this.mode === 'braille') {
      this.brailleBuffer = createBrailleBuffer(this.width, this.height);
    } else if (this.mode === 'block') {
      this.blockBuffer = createBlockBuffer(this.width, this.height);
    }
  }

  /**
   * Get canvas dimensions
   */
  get dimensions(): { width: number; height: number } {
    return { width: this.width, height: this.height };
  }

  /**
   * Get effective resolution based on mode
   */
  get resolution(): { width: number; height: number } {
    switch (this.mode) {
      case 'braille':
        return { width: this.width * 2, height: this.height * 4 };
      case 'block':
        return { width: this.width * 2, height: this.height * 2 };
      default:
        return { width: this.width, height: this.height };
    }
  }

  /**
   * Clear the canvas (resets both characters and colors)
   */
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      this.charBuffer[y] = new Array(this.width).fill(' ');
      this.colorBuffer[y] = new Array(this.width).fill(undefined);
      this.boldBuffer[y] = new Array(this.width).fill(false);
      this.italicBuffer[y] = new Array(this.width).fill(false);
    }

    if (this.brailleBuffer) {
      this.brailleBuffer = createBrailleBuffer(this.width, this.height);
    }
    if (this.blockBuffer) {
      this.blockBuffer = createBlockBuffer(this.width, this.height);
    }
  }

  /**
   * Set a pixel/character at position with optional color
   */
  setPixel(x: number, y: number, char?: string, color?: CanvasColor): void {
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return;
    if (this.mode === 'character') {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.charBuffer[y]![x] = char === undefined
          ? this.fillChar
          : normalizeCanvasCell(char, 'pixel character');
        this.colorBuffer[y]![x] = color !== undefined
          ? color
          : (this.defaultColor ?? this.foreground);
      }
    } else if (this.mode === 'braille' && this.brailleBuffer) {
      setBrailleDot(this.brailleBuffer, x, y, true);
      this.setSubpixelColor(x, y, 2, 4, color);
    } else if (this.mode === 'block' && this.blockBuffer) {
      setBlockPixel(this.blockBuffer, x, y, true);
      this.setSubpixelColor(x, y, 2, 2, color);
    }
  }

  /**
   * Get a character at position
   */
  getPixel(x: number, y: number): string {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.charBuffer[y]![x]!;
    }
    return ' ';
  }

  /**
   * Get the color at a specific position
   */
  getPixelColor(x: number, y: number): CanvasColor {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.colorBuffer[y]![x] ?? null;
    }
    return null;
  }

  /**
   * Set only the color at a position without changing the character
   */
  setPixelColor(x: number, y: number, color: CanvasColor): void {
    if (
      Number.isSafeInteger(x) &&
      Number.isSafeInteger(y) &&
      x >= 0 && x < this.width &&
      y >= 0 && y < this.height
    ) {
      this.colorBuffer[y]![x] = color;
    }
  }

  private setSubpixelColor(
    x: number,
    y: number,
    cellWidth: number,
    cellHeight: number,
    color: CanvasColor | undefined,
  ): void {
    if (x < 0 || y < 0) return;
    const cellX = Math.floor(x / cellWidth);
    const cellY = Math.floor(y / cellHeight);
    if (cellX >= this.width || cellY >= this.height) return;
    this.colorBuffer[cellY]![cellX] = color !== undefined
      ? color
      : (this.defaultColor ?? this.foreground);
  }

  /**
   * Draw a line from (x0, y0) to (x1, y1)
   */
  line(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    charOrStyle?: string | LineStyle,
    style?: LineStyle,
  ): void {
    const resolvedStyle = typeof charOrStyle === 'object'
      ? charOrStyle
      : style;
    const char = typeof charOrStyle === 'string'
      ? charOrStyle
      : undefined;
    const points = bresenhamLine(x0, y0, x1, y1);
    const thickness = normalizeLineThickness(resolvedStyle?.thickness);
    if (points.length * thickness * thickness > MAX_DRAW_POINTS) {
      throw new RangeError('Styled line exceeds the drawing point safety limit');
    }
    const dashPattern = normalizeDashPattern(resolvedStyle);
    let patternIndex = 0;
    let remaining = dashPattern?.[0] ?? 0;
    let drawing = true;

    for (const point of points) {
      if (!dashPattern || drawing) {
        const before = Math.floor((thickness - 1) / 2);
        const after = thickness - before - 1;
        for (let offsetY = -before; offsetY <= after; offsetY++) {
          for (let offsetX = -before; offsetX <= after; offsetX++) {
            this.setPixel(
              point.x + offsetX,
              point.y + offsetY,
              char,
              resolvedStyle?.color,
            );
          }
        }
      }

      if (dashPattern) {
        remaining--;
        if (remaining === 0) {
          patternIndex = (patternIndex + 1) % dashPattern.length;
          remaining = dashPattern[patternIndex]!;
          drawing = !drawing;
        }
      }
    }
  }

  /**
   * Draw a rectangle
   */
  rect(
    x: number,
    y: number,
    width: number,
    height: number,
    filled = false,
    charOrStyle?: string | LineStyle | FillStyle,
  ): void {
    validateShapeDimension(width, 'rectangle width');
    validateShapeDimension(height, 'rectangle height');
    const style = typeof charOrStyle === 'object'
      ? charOrStyle
      : undefined;
    const char = typeof charOrStyle === 'string'
      ? charOrStyle
      : ('pattern' in (style ?? {}) ? (style as FillStyle).pattern : undefined);

    if (filled) {
      for (const point of filledRectangle(x, y, width, height)) {
        this.setPixel(point.x, point.y, char, style?.color);
      }
      return;
    }

    const lineStyle = style as LineStyle | undefined;
    this.line(x, y, x + width - 1, y, char, lineStyle);
    this.line(x, y + height - 1, x + width - 1, y + height - 1, char, lineStyle);
    this.line(x, y, x, y + height - 1, char, lineStyle);
    this.line(x + width - 1, y, x + width - 1, y + height - 1, char, lineStyle);
  }

  /**
   * Draw a circle
   */
  circle(cx: number, cy: number, radius: number, filled = false, char?: string): void {
    const points = filled
      ? filledCircle(cx, cy, radius)
      : midpointCircle(cx, cy, radius);

    for (const p of points) {
      this.setPixel(p.x, p.y, char);
    }
  }

  /**
   * Draw an ellipse
   */
  ellipse(cx: number, cy: number, rx: number, ry: number, char?: string): void {
    const points = midpointEllipse(cx, cy, rx, ry);
    for (const p of points) {
      this.setPixel(p.x, p.y, char);
    }
  }

  /**
   * Draw an arc
   */
  arc(
    cx: number,
    cy: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    char?: string
  ): void {
    const points = arcPoints(cx, cy, radius, startAngle, endAngle);
    for (const p of points) {
      this.setPixel(p.x, p.y, char);
    }
  }

  /**
   * Draw a polygon
   */
  polygon(vertices: Point[], filled = false, char?: string): void {
    const points = filled ? filledPolygon(vertices) : polygonPoints(vertices);
    for (const p of points) {
      this.setPixel(p.x, p.y, char);
    }
  }

  /**
   * Draw a cubic bezier curve
   */
  bezier(p0: Point, p1: Point, p2: Point, p3: Point, char?: string): void {
    const points = bezierCurve(p0, p1, p2, p3);
    for (const p of points) {
      this.setPixel(p.x, p.y, char);
    }
  }

  /**
   * Draw a quadratic bezier curve
   */
  quadBezier(p0: Point, p1: Point, p2: Point, char?: string): void {
    const points = quadraticBezier(p0, p1, p2);
    for (const p of points) {
      this.setPixel(p.x, p.y, char);
    }
  }

  /**
   * Draw text at position
   */
  text(x: number, y: number, str: string, style?: TextStyle): void {
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y)) return;
    if (this.mode !== 'character' || y < 0 || y >= this.height) return;

    let startX = x;
    const graphemes = segmentGraphemes(str).map(entry => entry.segment);
    const textWidth = graphemes.reduce(
      (total, grapheme) => total + Math.max(0, stringWidth(grapheme)),
      0,
    );

    // Handle alignment
    if (style?.align === 'center') {
      startX = x - Math.floor(textWidth / 2);
    } else if (style?.align === 'right') {
      startX = x - textWidth + 1;
    }

    let px = startX;
    for (const grapheme of graphemes) {
      const graphemeWidth = stringWidth(grapheme);
      if (graphemeWidth <= 0) continue;
      if (
        px >= 0 &&
        px + graphemeWidth <= this.width
      ) {
        this.charBuffer[y]![px] = grapheme;
        this.colorBuffer[y]![px] = style?.color !== undefined
          ? style.color
          : (this.defaultColor ?? this.foreground);
        this.boldBuffer[y]![px] = style?.bold ?? false;
        this.italicBuffer[y]![px] = style?.italic ?? false;
        for (let continuation = 1; continuation < graphemeWidth; continuation++) {
          this.charBuffer[y]![px + continuation] = '';
          this.colorBuffer[y]![px + continuation] = this.colorBuffer[y]![px];
          this.boldBuffer[y]![px + continuation] = style?.bold ?? false;
          this.italicBuffer[y]![px + continuation] = style?.italic ?? false;
        }
      }
      px += graphemeWidth;
    }
  }

  /**
   * Draw points from an array
   */
  drawPoints(points: Point[], char?: string): void {
    for (const p of points) {
      this.setPixel(p.x, p.y, char);
    }
  }

  /**
   * Flood fill from a point
   */
  floodFill(x: number, y: number, fillChar: string, targetChar?: string): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;

    const target = targetChar ?? this.charBuffer[y]![x]!;
    if (target === fillChar) return;

    const stack: Point[] = [{ x, y }];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const p = stack.pop()!;
      const key = `${p.x},${p.y}`;

      if (visited.has(key)) continue;
      if (p.x < 0 || p.x >= this.width || p.y < 0 || p.y >= this.height) continue;
      if (this.charBuffer[p.y]![p.x] !== target) continue;

      visited.add(key);
      this.charBuffer[p.y]![p.x] = fillChar;

      stack.push({ x: p.x + 1, y: p.y });
      stack.push({ x: p.x - 1, y: p.y });
      stack.push({ x: p.x, y: p.y + 1 });
      stack.push({ x: p.x, y: p.y - 1 });
    }
  }

  /**
   * Helper to resolve and convert a color to ANSI code
   */
  private colorToAnsiCode(
    color: CanvasColor,
    layer: 'foreground' | 'background' = 'foreground',
  ): string {
    if (!color) return '';
    // Resolve palette/semantic colors first, then convert to ANSI
    const resolved = resolveColor(color);
    return colorToAnsi(resolved, layer);
  }

  /**
   * Render a row of canvas cells with colors and text attributes.
   */
  private renderCells(chars: string[], y: number): string {
    const RESET = '\x1b[0m';
    let result = '';
    let currentSignature = '';

    for (let x = 0; x < this.width; x++) {
      const char = chars[x] ?? ' ';
      if (char === '') continue;
      const storedColor = this.colorBuffer[y]?.[x];
      const foreground = storedColor === undefined
        ? this.foreground
        : storedColor;
      const bold = this.boldBuffer[y]?.[x] ?? false;
      const italic = this.italicBuffer[y]?.[x] ?? false;
      const signature = [
        foreground ?? '',
        this.background ?? '',
        bold ? '1' : '0',
        italic ? '1' : '0',
      ].join(':');

      if (signature !== currentSignature) {
        if (currentSignature !== '') result += RESET;
        if (foreground) result += this.colorToAnsiCode(foreground);
        if (this.background) {
          result += this.colorToAnsiCode(this.background, 'background');
        }
        if (bold) result += '\x1b[1m';
        if (italic) result += '\x1b[3m';
        currentSignature = signature;
      }

      result += char;
    }

    if (currentSignature !== '' && currentSignature !== '::0:0') {
      result += RESET;
    }

    return result;
  }

  /**
   * Render a single line with ANSI color codes.
   */
  renderLine(y: number): string {
    if (!Number.isSafeInteger(y) || y < 0 || y >= this.height) return '';
    return this.renderCells(this.charBuffer[y]!, y);
  }

  /**
   * Render canvas to string array with ANSI color codes
   */
  render(): string[] {
    if (this.mode === 'braille' && this.brailleBuffer) {
      return brailleBufferToString(this.brailleBuffer)
        .split('\n')
        .map((line, y) => this.renderCells(Array.from(line), y));
    }

    if (this.mode === 'block' && this.blockBuffer) {
      return blockBufferToString(this.blockBuffer)
        .split('\n')
        .map((line, y) => this.renderCells(Array.from(line), y));
    }

    // Character mode with colors
    const lines: string[] = [];
    for (let y = 0; y < this.height; y++) {
      lines.push(this.renderLine(y));
    }
    return lines;
  }

  /**
   * Render canvas to a single string (lines joined with newlines).
   */
  renderToString(): string {
    return this.render().join('\n');
  }

  /**
   * Get canvas state
   */
  getState(): CanvasState {
    return {
      width: this.width,
      height: this.height,
      mode: this.mode,
      buffer: this.charBuffer.map((row) => [...row]),
      foreground: this.foreground,
      background: this.background,
    };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a new canvas
 */
export function createCanvas(options: CanvasOptions): Canvas {
  return new Canvas(options);
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Create a sparkline chart on a canvas
 */
export function drawSparkline(
  canvas: Canvas,
  data: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  char = '█'
): void {
  if (data.length === 0 || !isValidPlotRect(x, y, width, height)) return;
  if (data.some(value => !Number.isFinite(value))) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  if (data.length === 1) {
    canvas.setPixel(
      x,
      Math.round(y + height - 1 - ((data[0]! - min) / range) * (height - 1)),
      char
    );
    return;
  }

  const step = (width - 1) / (data.length - 1);

  for (let i = 0; i < data.length - 1; i++) {
    const x0 = Math.round(x + i * step);
    const y0 = Math.round(y + height - 1 - ((data[i]! - min) / range) * (height - 1));
    const x1 = Math.round(x + (i + 1) * step);
    const y1 = Math.round(y + height - 1 - ((data[i + 1]! - min) / range) * (height - 1));

    canvas.line(x0, y0, x1, y1, char);
  }
}

/**
 * Create a bar chart on a canvas
 */
export function drawBarChart(
  canvas: Canvas,
  data: number[],
  x: number,
  y: number,
  width: number,
  height: number,
  char = '█'
): void {
  if (data.length === 0 || !isValidPlotRect(x, y, width, height)) return;
  if (data.some(value => !Number.isFinite(value))) return;

  const max = Math.max(0, ...data);
  if (max <= 0) return;
  const barWidth = Math.max(1, Math.floor(width / data.length));

  for (let i = 0; i < data.length; i++) {
    const barHeight = Math.max(
      0,
      Math.min(height, Math.round((data[i]! / max) * height))
    );
    const barX = x + i * barWidth;

    for (let dy = 0; dy < barHeight; dy++) {
      for (let dx = 0; dx < Math.max(1, barWidth - 1); dx++) {
        canvas.setPixel(barX + dx, y + height - 1 - dy, char);
      }
    }
  }
}

/**
 * Create a scatter plot on a canvas
 */
export function drawScatterPlot(
  canvas: Canvas,
  points: { x: number; y: number }[],
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  canvasBounds: { x: number; y: number; width: number; height: number },
  char = '●'
): void {
  const { minX, maxX, minY, maxY } = bounds;
  const { x, y, width, height } = canvasBounds;
  if (!isValidPlotRect(x, y, width, height)) return;
  if (
    ![minX, maxX, minY, maxY].every(Number.isFinite)
    || points.some(point => !Number.isFinite(point.x) || !Number.isFinite(point.y))
  ) return;
  const rangeX = maxX - minX;
  const rangeY = maxY - minY;

  for (const point of points) {
    const px = x + (rangeX === 0
      ? Math.floor((width - 1) / 2)
      : Math.round(((point.x - minX) / rangeX) * (width - 1)));
    const py = y + (rangeY === 0
      ? Math.floor((height - 1) / 2)
      : height - 1 - Math.round(((point.y - minY) / rangeY) * (height - 1)));
    canvas.setPixel(px, py, char);
  }
}

function validateCanvasDimension(value: number, name: string): void {
  if (
    !Number.isSafeInteger(value) ||
    value < 0 ||
    value > MAX_CANVAS_DIMENSION
  ) {
    throw new RangeError(
      `Canvas ${name} must be a safe integer from 0 to ${MAX_CANVAS_DIMENSION}`,
    );
  }
}

function validateCanvasArea(
  width: number,
  height: number,
  resolutionMultiplier: number,
): void {
  if (width * height * resolutionMultiplier > MAX_CANVAS_CELLS) {
    throw new RangeError(
      `Canvas allocation exceeds the ${MAX_CANVAS_CELLS} cell safety limit`,
    );
  }
}

function normalizeCoordinate(value: number, name: string): number {
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`${name} must be a finite safe-range number`);
  }
  return Math.round(value);
}

function normalizeNonNegativeDrawingInteger(
  value: number,
  name: string,
): number {
  if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
    throw new RangeError(`${name} must be a non-negative safe-range number`);
  }
  return Math.round(value);
}

function normalizeDrawingSteps(value: number, name: string): number {
  if (
    !Number.isSafeInteger(value) ||
    value <= 0 ||
    value > MAX_DRAW_POINTS
  ) {
    throw new RangeError(
      `${name} must be a safe integer from 1 to ${MAX_DRAW_POINTS}`,
    );
  }
  return value;
}

function validateDrawingPoint(point: Point): void {
  normalizeCoordinate(point.x, 'point.x');
  normalizeCoordinate(point.y, 'point.y');
}

function validateShapeDimension(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
}

function normalizeCanvasCell(value: string, name: string): string {
  const graphemes = segmentGraphemes(value);
  if (
    graphemes.length !== 1 ||
    stringWidth(graphemes[0]!.segment) !== 1
  ) {
    throw new RangeError(`${name} must contain exactly one single-cell grapheme`);
  }
  return graphemes[0]!.segment;
}

function normalizeLineThickness(value: number | undefined): number {
  if (value === undefined) return 1;
  if (!Number.isSafeInteger(value) || value <= 0 || value > 64) {
    throw new RangeError('Line thickness must be a safe integer from 1 to 64');
  }
  return value;
}

function normalizeDashPattern(style: LineStyle | undefined): number[] | null {
  const requested = style?.dashPattern;
  if (!style?.dashed && requested === undefined) return null;
  const pattern = requested ?? [3, 2];
  if (
    pattern.length === 0 ||
    pattern.some(value => !Number.isSafeInteger(value) || value <= 0)
  ) {
    throw new RangeError('Line dashPattern must contain positive safe integers');
  }
  return [...pattern];
}

function isValidPlotRect(
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return (
    Number.isSafeInteger(x)
    && Number.isSafeInteger(y)
    && Number.isSafeInteger(width)
    && Number.isSafeInteger(height)
    && width > 0
    && height > 0
    && width * height <= MAX_DRAW_POINTS
  );
}
