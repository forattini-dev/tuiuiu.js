/**
 * Tuiuiu Renderer - Convert VNodes to ANSI terminal output
 *
 * Uses a 2D character buffer for precise positioning
 */

import type { VNode, LayoutNode, TextStyle, BoxStyle } from '../utils/types.js';
import { BORDER_STYLES } from '../utils/types.js';
import { getVisibleWidth } from './layout.js';
import {
  createFrameSnapshot,
  recordFramePhaseMetric,
  type DrawBoxCommand,
  type DrawCommand,
  type DrawTerminalImageCommand,
  type DrawTextCommand,
  type FrameSnapshot,
  type ReservedRegion,
} from './frame.js';
import { readRenderableSymbol, stringWidth } from '../utils/text-utils.js';
import { getTheme, resolveColor } from './theme.js';
import { clearImagesForProtocol, kittyGraphics, renderImageWithProtocol } from './graphics.js';

const PRODUCTION_FRAME_OPTIONS = {
  eagerHitTargets: false,
  eagerQueries: false,
  eagerWarnings: false,
} as const;

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

const colorCodeCache = new WeakMap<object, Map<string, string | undefined>>();

/**
 * Calculate the maximum bounding box of a layout tree,
 * including absolute positioned elements that may extend beyond
 * their parent's bounds.
 */
function getLayoutBounds(layout: LayoutNode): { maxY: number; maxX: number } {
  let maxY = layout.y + layout.height;
  let maxX = layout.x + layout.width;

  for (const child of layout.children) {
    const childBounds = getLayoutBounds(child);
    maxY = Math.max(maxY, childBounds.maxY);
    maxX = Math.max(maxX, childBounds.maxX);
  }

  return { maxY, maxX };
}

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

  private clearWideFootprint(x: number, y: number): void {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
      return;
    }

    const cell = this.cells[y][x]!;

    if (cell.isPlaceholder) {
      this.cells[y][x] = { char: ' ' };

      if (x > 0) {
        const previous = this.cells[y][x - 1]!;
        if (!previous.isPlaceholder && stringWidth(previous.char) > 1) {
          this.cells[y][x - 1] = { char: ' ' };
        }
      }

      return;
    }

    if (stringWidth(cell.char) > 1) {
      const footprint = stringWidth(cell.char);
      for (let offset = 1; offset < footprint && x + offset < this.width; offset++) {
        if (this.cells[y][x + offset]?.isPlaceholder) {
          this.cells[y][x + offset] = { char: ' ' };
        }
      }
    }
  }

  /** Write a character at position */
  write(x: number, y: number, char: string, style?: string): void {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      const charWidth = Math.max(1, stringWidth(char));
      this.clearWideFootprint(x, y);
      for (let offset = 1; offset < charWidth && x + offset < this.width; offset++) {
        this.clearWideFootprint(x + offset, y);
      }

      this.cells[y][x] = { char, style };
      for (let offset = 1; offset < charWidth && x + offset < this.width; offset++) {
        this.cells[y][x + offset] = { char: '', style, isPlaceholder: true };
      }
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

      const symbol = readRenderableSymbol(text, i);
      if (!symbol) {
        break;
      }

      const charWidth = stringWidth(symbol.symbol);
      if (charWidth <= 0) {
        i = symbol.nextIndex;
        continue;
      }

      // Write visible character
      this.write(col, y, symbol.symbol, currentStyle);

      col += charWidth;
      i = symbol.nextIndex;
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

  /** Convert buffer to string
   * @param fullHeight - If true, keeps all lines including trailing empty ones
   */
  toString(fullHeight = false): string {
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

    // Remove trailing empty lines (unless fullHeight is requested)
    if (!fullHeight) {
      while (lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
      }
    }

    return lines.join('\n');
  }
}

/** Options for renderToString */
export interface RenderOptions {
  /** Terminal width (defaults to process.stdout.columns or 80) */
  width?: number;
  /** Terminal height (defaults to unbounded) */
  height?: number;
  /** If true, preserve all lines including trailing empty ones (for full-screen apps) */
  fullHeight?: boolean;
}

export interface FrameRenderOptions {
  fullHeight?: boolean;
  previousFrame?: FrameSnapshot | null;
}

function resolveRenderOptions(widthOrOptions?: number | RenderOptions, height?: number): {
  width: number;
  height: number;
  fullHeight: boolean;
} {
  if (typeof widthOrOptions === 'object') {
    return {
      width: widthOrOptions.width ?? process.stdout.columns ?? 80,
      height: widthOrOptions.height ?? 1000,
      fullHeight: widthOrOptions.fullHeight ?? false,
    };
  }

  return {
    width: widthOrOptions ?? process.stdout.columns ?? 80,
    height: height ?? 1000,
    fullHeight: false,
  };
}

export function renderFrameToString(frame: FrameSnapshot, options: FrameRenderOptions = {}): string {
  const renderStart = now();
  const { fullHeight = false, previousFrame = null } = options;
  const layout = frame.layout;
  const style = frame.root.props as BoxStyle;
  const marginBottom = style.marginBottom ?? style.marginY ?? style.margin ?? 0;
  const bounds = getLayoutBounds(layout);
  const layoutFullHeight = bounds.maxY + (typeof marginBottom === 'number' ? marginBottom : 0);
  const viewportHeight = frame.info.viewport.height;
  const bufferHeight = fullHeight && viewportHeight < 1000 ? viewportHeight : layoutFullHeight;
  const buffer = new OutputBuffer(frame.info.viewport.width, bufferHeight);

  renderDrawCommands(frame, buffer);

  const output = buffer.toString(fullHeight);
  const graphicsOutput = renderProtocolGraphics(frame, previousFrame);
  recordFramePhaseMetric(frame, 'ansiRenderMs', now() - renderStart);
  return graphicsOutput + output;
}

/**
 * Render a VNode tree to ANSI string
 */
export function renderToString(node: VNode, widthOrOptions?: number | RenderOptions, height?: number): string {
  const resolved = resolveRenderOptions(widthOrOptions, height);
  const frame = createFrameSnapshot(node, {
    width: resolved.width,
    height: resolved.height,
  }, PRODUCTION_FRAME_OPTIONS);

  return renderFrameToString(frame, {
    fullHeight: resolved.fullHeight,
  });
}

/**
 * Measure the height of a VNode tree including margins and absolute positioned elements
 * Returns the full bounding box height (useful for scroll calculations)
 */
export function measureHeight(node: VNode, width?: number): number {
  const termWidth = width ?? process.stdout.columns ?? 80;
  const frame = createFrameSnapshot(node, {
    width: termWidth,
    height: 1000,
  }, PRODUCTION_FRAME_OPTIONS);
  const layout = frame.layout;

  // Calculate full bounding box height including margins AND absolute positioned elements
  const style = node.props as BoxStyle;
  const marginBottom = style.marginBottom ?? style.marginY ?? style.margin ?? 0;
  const bounds = getLayoutBounds(layout);
  return bounds.maxY + (typeof marginBottom === 'number' ? marginBottom : 0);
}

function renderDrawCommands(frame: FrameSnapshot, buffer: OutputBuffer): void {
  for (const command of frame.drawCommands) {
    switch (command.type) {
      case 'box':
        renderBoxCommand(command, buffer, frame.reservedRegions);
        break;
      case 'text':
        renderTextCommand(command, buffer, frame.reservedRegions);
        break;
      case 'terminal-image':
        renderTerminalImageCommand(command, buffer);
        break;
    }
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

function writeReservedAware(
  buffer: OutputBuffer,
  regions: readonly ReservedRegion[],
  x: number,
  y: number,
  char: string,
  style?: string,
): void {
  const width = Math.max(1, stringWidth(char));
  for (let offset = 0; offset < width; offset++) {
    if (isReservedCell(regions, x + offset, y)) {
      return;
    }
  }
  buffer.write(x, y, char, style);
}

function fillReservedAware(
  buffer: OutputBuffer,
  regions: readonly ReservedRegion[],
  x: number,
  y: number,
  width: number,
  height: number,
  char: string,
  style?: string,
): void {
  for (let row = y; row < y + height; row++) {
    for (let col = x; col < x + width; col++) {
      if (!isReservedCell(regions, col, row)) {
        buffer.write(col, row, char, style);
      }
    }
  }
}

function writeStringReservedAware(
  buffer: OutputBuffer,
  regions: readonly ReservedRegion[],
  x: number,
  y: number,
  text: string,
  style?: string,
): void {
  let col = x;
  let index = 0;
  let currentStyle = style;

  while (index < text.length) {
    const char = text[index]!;

    if (char === '\x1b' && text[index + 1] === '[') {
      let ansiEnd = index + 2;
      while (ansiEnd < text.length && !/[A-Za-z]/.test(text[ansiEnd]!)) {
        ansiEnd++;
      }
      if (ansiEnd < text.length) {
        const ansiSeq = text.slice(index, ansiEnd + 1);
        if (ansiSeq === '\x1b[0m' || ansiSeq === '\x1b[m') {
          currentStyle = style;
        } else {
          currentStyle = (currentStyle || '') + ansiSeq;
        }
        index = ansiEnd + 1;
        continue;
      }
    }

    if (char === '\n') {
      index++;
      continue;
    }

    const symbol = readRenderableSymbol(text, index);
    if (!symbol) {
      break;
    }

    const symbolWidth = stringWidth(symbol.symbol);
    if (symbolWidth > 0) {
      writeReservedAware(buffer, regions, col, y, symbol.symbol, currentStyle);
      col += symbolWidth;
    }

    index = symbol.nextIndex;
  }
}

function renderBoxCommand(
  command: DrawBoxCommand,
  buffer: OutputBuffer,
  reservedRegions: readonly ReservedRegion[],
): void {
  const { x, y, width, height, backgroundColor, borderStyle, borderColor } = command;

  if (backgroundColor) {
    const bgCode = getColorCode(backgroundColor, true);
    if (bgCode) {
      const bgStyle = `\x1b[${bgCode}m`;
      fillReservedAware(buffer, reservedRegions, x, y, width, height, ' ', bgStyle);
    }
  }

  if (borderStyle && borderStyle !== 'none') {
    const borderChars = BORDER_STYLES[borderStyle] ?? BORDER_STYLES.single;
    const borderAnsiStyle = borderColor ? getColorStyle(borderColor) : undefined;

    writeReservedAware(buffer, reservedRegions, x, y, borderChars.topLeft, borderAnsiStyle);
    for (let i = 1; i < width - 1; i++) {
      writeReservedAware(buffer, reservedRegions, x + i, y, borderChars.top, borderAnsiStyle);
    }
    if (width > 1) {
      writeReservedAware(buffer, reservedRegions, x + width - 1, y, borderChars.topRight, borderAnsiStyle);
    }

    for (let row = 1; row < height - 1; row++) {
      writeReservedAware(buffer, reservedRegions, x, y + row, borderChars.left, borderAnsiStyle);
      if (width > 1) {
        writeReservedAware(buffer, reservedRegions, x + width - 1, y + row, borderChars.right, borderAnsiStyle);
      }
    }

    if (height > 1) {
      writeReservedAware(buffer, reservedRegions, x, y + height - 1, borderChars.bottomLeft, borderAnsiStyle);
      for (let i = 1; i < width - 1; i++) {
        writeReservedAware(buffer, reservedRegions, x + i, y + height - 1, borderChars.bottom, borderAnsiStyle);
      }
      if (width > 1) {
        writeReservedAware(
          buffer,
          reservedRegions,
          x + width - 1,
          y + height - 1,
          borderChars.bottomRight,
          borderAnsiStyle,
        );
      }
    }
  }
}

function renderTextCommand(
  command: DrawTextCommand,
  buffer: OutputBuffer,
  reservedRegions: readonly ReservedRegion[],
): void {
  const { x, y, maxWidth, text, style, inheritedBackgroundColor } = command;

  let ansiStyle = getTextStyle(style);
  if (inheritedBackgroundColor && !style.backgroundColor) {
    const inheritedCode = getColorCode(inheritedBackgroundColor, true);
    if (inheritedCode) {
      ansiStyle = `\x1b[${inheritedCode}m${ansiStyle ?? ''}`;
    }
  }

  const lines = wrapText(text, maxWidth, style.wrap);
  for (let i = 0; i < lines.length; i++) {
    writeStringReservedAware(buffer, reservedRegions, x, y + i, lines[i]!, ansiStyle);
  }
}

function renderTerminalImageCommand(command: DrawTerminalImageCommand, buffer: OutputBuffer): void {
  if (!command.cellRender) {
    return;
  }

  const rendered = getTerminalImagePayload(command);
  const lines = rendered.split('\n');

  for (let row = 0; row < lines.length; row++) {
    buffer.writeString(command.x, command.y + row, lines[row]!);
  }
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
      output += `\x1b7\x1b[H${kittyGraphics.delete(previousCommand.kittyImageId)}\x1b8`;
      continue;
    }

    return `\x1b7\x1b[H${clearImagesForProtocol('kitty')}\x1b8`;
  }

  return output;
}

function renderProtocolGraphics(frame: FrameSnapshot, previousFrame: FrameSnapshot | null): string {
  const nextCommands = collectProtocolImageCommands(frame);
  if (nextCommands.length === 0 && !previousFrame) {
    return '';
  }

  const previousCommands = collectProtocolImageCommands(previousFrame);
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

    const payload = getTerminalImagePayload(command);
    output += `\x1b7\x1b[${command.y + 1};${command.x + 1}H${payload}\x1b8`;
  }

  return output;
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
 *
 * Supports:
 * - ANSI color names: 'red', 'cyan', 'whiteBright', etc.
 * - Semantic theme colors: 'primary', 'success', 'foreground', 'primaryForeground', etc.
 * - Hex colors: '#3b82f6', '#fff' (short form)
 * - RGB colors: 'rgb(255, 100, 50)'
 */
function getColorCode(color: string, background: boolean): string | undefined {
  const theme = getTheme() as unknown as object;
  let cache = colorCodeCache.get(theme);
  if (!cache) {
    cache = new Map();
    colorCodeCache.set(theme, cache);
  }

  const cacheKey = `${background ? 'bg' : 'fg'}:${color}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const offset = background ? 10 : 0;

  // Basic ANSI colors (check these first for performance)
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
    const value = String(basicColors[color] + offset);
    cache.set(cacheKey, value);
    return value;
  }

  // Resolve semantic/theme colors to hex values
  // This handles: 'primary', 'foreground', 'primaryForeground', 'success-500', etc.
  const resolved = resolveColor(color);

  // Check if resolved value is a basic color name (e.g., when primaryForeground resolves to 'white' or 'black')
  if (basicColors[resolved] !== undefined) {
    const value = String(basicColors[resolved] + offset);
    cache.set(cacheKey, value);
    return value;
  }

  // Hex color (after resolution)
  if (resolved.startsWith('#')) {
    const hex = resolved.slice(1);
    // Handle short hex (#fff -> #ffffff)
    const fullHex = hex.length === 3
      ? hex[0]! + hex[0] + hex[1]! + hex[1] + hex[2]! + hex[2]
      : hex;
    const r = parseInt(fullHex.slice(0, 2), 16);
    const g = parseInt(fullHex.slice(2, 4), 16);
    const b = parseInt(fullHex.slice(4, 6), 16);
    const value = `${background ? 48 : 38};2;${r};${g};${b}`;
    cache.set(cacheKey, value);
    return value;
  }

  // RGB color
  if (resolved.startsWith('rgb')) {
    const match = resolved.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      const value = `${background ? 48 : 38};2;${match[1]};${match[2]};${match[3]}`;
      cache.set(cacheKey, value);
      return value;
    }
  }

  cache.set(cacheKey, undefined);
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
 * Truncate text at end (ANSI-aware)
 */
function truncate(text: string, maxWidth: number, ellipsis: string): string {
  if (getVisibleWidth(text) <= maxWidth) return text;
  const ellipsisWidth = getVisibleWidth(ellipsis);
  let result = '';
  let width = 0;

  for (const char of text) {
    const charWidth = stringWidth(char);
    if (width + charWidth + ellipsisWidth > maxWidth) break;
    result += char;
    width += charWidth;
  }

  return result + ellipsis;
}

/**
 * Truncate text at start (ANSI-aware)
 */
function truncateStart(text: string, maxWidth: number, ellipsis: string): string {
  if (getVisibleWidth(text) <= maxWidth) return text;
  const ellipsisWidth = getVisibleWidth(ellipsis);
  const chars = [...text];
  let result = '';
  let width = 0;

  for (let i = chars.length - 1; i >= 0; i--) {
    const charWidth = stringWidth(chars[i]);
    if (width + charWidth + ellipsisWidth > maxWidth) break;
    result = chars[i] + result;
    width += charWidth;
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
