/**
 * Canvas Widget - 2D Drawing Canvas for Terminal
 *
 * Provides a canvas component for drawing shapes, lines, and graphics
 * in the terminal. Supports multiple drawing modes:
 * - Character mode: Uses ASCII/Unicode characters
 * - Braille mode: Uses braille characters for 2x4 sub-character resolution
 * - Block mode: Uses block characters for 2x2 sub-character resolution
 */

import { createSignal } from '../primitives/signal.js';

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
  const points: Point[] = [];

  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
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
  const points: Point[] = [];

  // Convert to radians
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;

  // Calculate number of steps based on arc length
  const arcLength = Math.abs(endRad - startRad) * radius;
  const steps = Math.max(Math.ceil(arcLength), 20);

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
  const points: Point[] = [];

  if (vertices.length < 3) return points;

  // Find bounding box
  let minY = Infinity;
  let maxY = -Infinity;

  for (const v of vertices) {
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
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

  // Character mode buffer
  private charBuffer: string[][];

  // Braille mode buffer (2x4 resolution per character)
  private brailleBuffer: boolean[][] | null = null;

  // Block mode buffer (2x2 resolution per character)
  private blockBuffer: boolean[][] | null = null;

  constructor(options: CanvasOptions) {
    this.width = options.width;
    this.height = options.height;
    this.mode = options.mode ?? 'character';
    this.foreground = options.foreground ?? null;
    this.background = options.background ?? null;
    this.fillChar = options.fillChar ?? '█';

    // Initialize character buffer
    this.charBuffer = [];
    for (let y = 0; y < this.height; y++) {
      this.charBuffer.push(new Array(this.width).fill(' '));
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
   * Clear the canvas
   */
  clear(): void {
    for (let y = 0; y < this.height; y++) {
      this.charBuffer[y] = new Array(this.width).fill(' ');
    }

    if (this.brailleBuffer) {
      this.brailleBuffer = createBrailleBuffer(this.width, this.height);
    }
    if (this.blockBuffer) {
      this.blockBuffer = createBlockBuffer(this.width, this.height);
    }
  }

  /**
   * Set a pixel/character at position
   */
  setPixel(x: number, y: number, char?: string): void {
    if (this.mode === 'character') {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.charBuffer[y]![x] = char ?? this.fillChar;
      }
    } else if (this.mode === 'braille' && this.brailleBuffer) {
      setBrailleDot(this.brailleBuffer, x, y, true);
    } else if (this.mode === 'block' && this.blockBuffer) {
      setBlockPixel(this.blockBuffer, x, y, true);
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
   * Draw a line from (x0, y0) to (x1, y1)
   */
  line(x0: number, y0: number, x1: number, y1: number, char?: string): void {
    const points = bresenhamLine(
      Math.round(x0),
      Math.round(y0),
      Math.round(x1),
      Math.round(y1)
    );
    for (const p of points) {
      this.setPixel(p.x, p.y, char);
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
    char?: string
  ): void {
    const points = filled
      ? filledRectangle(x, y, width, height)
      : rectanglePoints(x, y, width, height);

    for (const p of points) {
      this.setPixel(p.x, p.y, char);
    }
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
    if (y < 0 || y >= this.height) return;

    let startX = x;

    // Handle alignment
    if (style?.align === 'center') {
      startX = x - Math.floor(str.length / 2);
    } else if (style?.align === 'right') {
      startX = x - str.length + 1;
    }

    for (let i = 0; i < str.length; i++) {
      const px = startX + i;
      if (px >= 0 && px < this.width) {
        this.charBuffer[y]![px] = str[i]!;
      }
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
   * Render canvas to string
   */
  render(): string {
    if (this.mode === 'braille' && this.brailleBuffer) {
      return brailleBufferToString(this.brailleBuffer);
    }

    if (this.mode === 'block' && this.blockBuffer) {
      return blockBufferToString(this.blockBuffer);
    }

    // Character mode
    return this.charBuffer.map((row) => row.join('')).join('\n');
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
  if (data.length === 0) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const step = width / (data.length - 1 || 1);

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
  if (data.length === 0) return;

  const max = Math.max(...data);
  const barWidth = Math.floor(width / data.length);

  for (let i = 0; i < data.length; i++) {
    const barHeight = Math.round((data[i]! / max) * (height - 1));
    const barX = x + i * barWidth;

    for (let dy = 0; dy < barHeight; dy++) {
      for (let dx = 0; dx < barWidth - 1; dx++) {
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

  for (const point of points) {
    const px = x + Math.round(((point.x - minX) / (maxX - minX)) * (width - 1));
    const py = y + height - 1 - Math.round(((point.y - minY) / (maxY - minY)) * (height - 1));
    canvas.setPixel(px, py, char);
  }
}
