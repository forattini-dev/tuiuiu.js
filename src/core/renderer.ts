/**
 * Reck Renderer - Convert VNodes to ANSI terminal output
 *
 * Uses a 2D character buffer for precise positioning
 */

import type { VNode, LayoutNode, TextStyle, BoxStyle } from '../utils/types.js';
import { BORDER_STYLES } from '../utils/types.js';
import { calculateLayout, getVisibleWidth } from './layout.js';
import { stringWidth } from '../utils/text-utils.js';

/** 2D character buffer */
interface Cell {
  char: string;
  style?: string; // ANSI codes
  isPlaceholder?: boolean; // True if this cell is "hidden" by a wide char in the previous cell
}

/**
 * Output buffer for rendering
 */
export class OutputBuffer {
  private cells: Cell[][];
  readonly width: number;
  readonly height: number;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = [];

    for (let y = 0; y < height; y++) {
      const row: Cell[] = [];
      for (let x = 0; x < width; x++) {
        row.push({ char: ' ' });
      }
      this.cells.push(row);
    }
  }

  /** Write a character at position */
  write(x: number, y: number, char: string, style?: string): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.cells[y][x] = { char, style };
    }
  }

  /** Write a string starting at position (ANSI-aware, handles wide chars) */
  writeString(x: number, y: number, text: string, style?: string): void {
    let col = x;
    let i = 0;
    let currentStyle = style;

    while (i < text.length) {
      const char = text[i];

      // Check for ANSI escape sequence
      if (char === '\x1b' && text[i + 1] === '[') {
        // Find end of ANSI sequence (ends with a letter)
        let j = i + 2;
        while (j < text.length && !/[A-Za-z]/.test(text[j])) {
          j++;
        }
        if (j < text.length) {
          // Extract the ANSI sequence
          const ansiSeq = text.slice(i, j + 1);
          // Update current style with this sequence
          if (ansiSeq === '\x1b[0m' || ansiSeq === '\x1b[m') {
            currentStyle = style; // Reset to base style
          } else {
            // Append to current style
            currentStyle = (currentStyle || '') + ansiSeq;
          }
          i = j + 1;
          continue;
        }
      }

      // Skip newlines
      if (char === '\n') {
        i++;
        continue;
      }

      // Handle surrogate pairs (emoji, etc.)
      let fullChar = char;
      const code = char.charCodeAt(0);
      if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
        // High surrogate - combine with low surrogate
        fullChar = char + text[i + 1];
        i++; // Skip the low surrogate
      }

      // Get character width (1 for normal, 2 for wide chars like emoji)
      const charWidth = stringWidth(fullChar);

      // Write visible character
      this.write(col, y, fullChar, currentStyle);

      // For wide characters, mark the next cell as a placeholder
      if (charWidth === 2 && col + 1 < this.width) {
        if (y >= 0 && y < this.height) {
          this.cells[y][col + 1] = { char: '', isPlaceholder: true };
        }
      }

      col += charWidth;
      i++;
    }
  }

  /** Fill a region with a character */
  fill(x: number, y: number, width: number, height: number, char: string, style?: string): void {
    for (let row = y; row < y + height && row < this.height; row++) {
      for (let col = x; col < x + width && col < this.width; col++) {
        this.write(col, row, char, style);
      }
    }
  }

  /** Convert buffer to string */
  toString(): string {
    const lines: string[] = [];

    for (const row of this.cells) {
      let line = '';
      let currentStyle: string | undefined;

      for (const cell of row) {
        // Skip placeholder cells (hidden by wide chars)
        if (cell.isPlaceholder) {
          continue;
        }

        if (cell.style !== currentStyle) {
          if (currentStyle) {
            line += '\x1b[0m'; // Reset
          }
          if (cell.style) {
            line += cell.style;
          }
          currentStyle = cell.style;
        }
        line += cell.char;
      }

      if (currentStyle) {
        line += '\x1b[0m';
      }

      // Trim trailing spaces but keep intentional content
      lines.push(line.trimEnd());
    }

    // Remove trailing empty lines
    while (lines.length > 0 && lines[lines.length - 1] === '') {
      lines.pop();
    }

    return lines.join('\n');
  }
}

/**
 * Render a VNode tree to ANSI string
 */
export function renderToString(node: VNode, width?: number, height?: number): string {
  const termWidth = width ?? process.stdout.columns ?? 80;
  const termHeight = height ?? 1000; // Large default for unbounded height

  const layout = calculateLayout(node, termWidth, termHeight);
  const buffer = new OutputBuffer(termWidth, layout.height);

  renderLayout(layout, buffer, 0, 0);

  return buffer.toString();
}

/**
 * Render a layout node to the buffer
 */
function renderLayout(layout: LayoutNode, buffer: OutputBuffer, offsetX: number, offsetY: number): void {
  const { node, x, y, width, height, children } = layout;
  const absX = offsetX + x;
  const absY = offsetY + y;

  // Render based on node type
  switch (node.type) {
    case 'box':
      renderBox(node, buffer, absX, absY, width, height);
      break;
    case 'text':
      renderText(node, buffer, absX, absY, width);
      break;
    case 'spacer':
      // Spacer is just empty space
      break;
    case 'newline':
      // Newline is handled by layout
      break;
    case 'fragment':
      // Fragment just renders children
      break;
  }

  // Calculate content offset (for padding and border)
  const style = node.props as BoxStyle;
  const paddingTop = style.paddingTop ?? style.paddingY ?? style.padding ?? 0;
  const paddingLeft = style.paddingLeft ?? style.paddingX ?? style.padding ?? 0;
  const borderSize = style.borderStyle && style.borderStyle !== 'none' ? 1 : 0;
  const contentOffsetX = absX + paddingLeft + borderSize;
  const contentOffsetY = absY + paddingTop + borderSize;

  // Render children
  for (const child of children) {
    renderLayout(child, buffer, contentOffsetX, contentOffsetY);
  }
}

/**
 * Render a Box node
 */
function renderBox(
  node: VNode,
  buffer: OutputBuffer,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  const style = node.props as BoxStyle;

  // Background fill
  if (style.borderStyle && style.borderStyle !== 'none') {
    const borderChars = BORDER_STYLES[style.borderStyle] ?? BORDER_STYLES.single;
    const borderStyle = style.borderColor ? getColorStyle(style.borderColor) : undefined;

    // Top border
    buffer.write(x, y, borderChars.topLeft, borderStyle);
    for (let i = 1; i < width - 1; i++) {
      buffer.write(x + i, y, borderChars.top, borderStyle);
    }
    buffer.write(x + width - 1, y, borderChars.topRight, borderStyle);

    // Side borders
    for (let row = 1; row < height - 1; row++) {
      buffer.write(x, y + row, borderChars.left, borderStyle);
      buffer.write(x + width - 1, y + row, borderChars.right, borderStyle);
    }

    // Bottom border
    buffer.write(x, y + height - 1, borderChars.bottomLeft, borderStyle);
    for (let i = 1; i < width - 1; i++) {
      buffer.write(x + i, y + height - 1, borderChars.bottom, borderStyle);
    }
    buffer.write(x + width - 1, y + height - 1, borderChars.bottomRight, borderStyle);
  }
}

/**
 * Render a Text node
 */
function renderText(node: VNode, buffer: OutputBuffer, x: number, y: number, maxWidth: number): void {
  const props = node.props as TextStyle & { children: string };
  const text = String(props.children ?? '');
  const style = getTextStyle(props);

  // Handle wrapping
  const lines = wrapText(text, maxWidth, props.wrap);

  for (let i = 0; i < lines.length; i++) {
    buffer.writeString(x, y + i, lines[i], style);
  }
}

/**
 * Get ANSI style codes for text
 */
function getTextStyle(props: TextStyle): string | undefined {
  const codes: string[] = [];

  if (props.bold) codes.push('1');
  if (props.dim) codes.push('2');
  if (props.italic) codes.push('3');
  if (props.underline) codes.push('4');
  if (props.inverse) codes.push('7');
  if (props.strikethrough) codes.push('9');

  // Foreground color
  if (props.color) {
    const colorCode = getColorCode(props.color, false);
    if (colorCode) codes.push(colorCode);
  }

  // Background color
  if (props.backgroundColor) {
    const colorCode = getColorCode(props.backgroundColor, true);
    if (colorCode) codes.push(colorCode);
  }

  return codes.length > 0 ? `\x1b[${codes.join(';')}m` : undefined;
}

/**
 * Get ANSI color style string
 */
function getColorStyle(color: string): string | undefined {
  const code = getColorCode(color, false);
  return code ? `\x1b[${code}m` : undefined;
}

/**
 * Get ANSI color code
 */
function getColorCode(color: string, background: boolean): string | undefined {
  const offset = background ? 10 : 0;

  // Basic colors
  const basicColors: Record<string, number> = {
    black: 30,
    red: 31,
    green: 32,
    yellow: 33,
    blue: 34,
    magenta: 35,
    cyan: 36,
    white: 37,
    gray: 90,
    grey: 90,
    blackBright: 90,
    redBright: 91,
    greenBright: 92,
    yellowBright: 93,
    blueBright: 94,
    magentaBright: 95,
    cyanBright: 96,
    whiteBright: 97,
  };

  if (basicColors[color] !== undefined) {
    return String(basicColors[color] + offset);
  }

  // Hex color
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `${background ? 48 : 38};2;${r};${g};${b}`;
  }

  // RGB
  if (color.startsWith('rgb')) {
    const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return `${background ? 48 : 38};2;${match[1]};${match[2]};${match[3]}`;
    }
  }

  return undefined;
}

/**
 * Wrap text to fit width
 */
function wrapText(text: string, maxWidth: number, mode?: TextStyle['wrap']): string[] {
  if (maxWidth <= 0) return [text];

  const lines = text.split('\n');
  const result: string[] = [];

  for (const line of lines) {
    if (mode === 'truncate' || mode === 'truncate-end') {
      result.push(truncate(line, maxWidth, '…'));
    } else if (mode === 'truncate-start') {
      result.push(truncateStart(line, maxWidth, '…'));
    } else if (mode === 'truncate-middle') {
      result.push(truncateMiddle(line, maxWidth, '…'));
    } else {
      // Default: wrap
      result.push(...wrapLine(line, maxWidth));
    }
  }

  return result;
}

/**
 * Wrap a single line
 */
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

/**
 * Truncate text at end
 */
function truncate(text: string, maxWidth: number, ellipsis: string): string {
  if (getVisibleWidth(text) <= maxWidth) return text;
  const ellipsisWidth = getVisibleWidth(ellipsis);
  let result = '';
  let width = 0;

  for (const char of text) {
    if (width + 1 + ellipsisWidth > maxWidth) break;
    result += char;
    width++;
  }

  return result + ellipsis;
}

/**
 * Truncate text at start
 */
function truncateStart(text: string, maxWidth: number, ellipsis: string): string {
  if (getVisibleWidth(text) <= maxWidth) return text;
  const ellipsisWidth = getVisibleWidth(ellipsis);
  const chars = [...text];
  let result = '';
  let width = 0;

  for (let i = chars.length - 1; i >= 0; i--) {
    if (width + 1 + ellipsisWidth > maxWidth) break;
    result = chars[i] + result;
    width++;
  }

  return ellipsis + result;
}

/**
 * Truncate text in middle
 */
function truncateMiddle(text: string, maxWidth: number, ellipsis: string): string {
  if (getVisibleWidth(text) <= maxWidth) return text;
  const ellipsisWidth = getVisibleWidth(ellipsis);
  const available = maxWidth - ellipsisWidth;
  const startLen = Math.ceil(available / 2);
  const endLen = Math.floor(available / 2);

  return text.slice(0, startLen) + ellipsis + text.slice(-endLen);
}
