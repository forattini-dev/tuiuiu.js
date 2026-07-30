/**
 * Tuiuiu Renderer - Convert VNodes to ANSI terminal output
 *
 * Rasterizes frames through the canonical structured CellBuffer.
 */

import type { VNode, LayoutNode, BoxStyle } from '../utils/types.js';
import {
  recordFramePhaseMetric,
  type DrawTerminalImageCommand,
  type FrameSnapshot,
} from './frame.js';
import { readRenderableSymbol, stringWidth } from '../utils/text-utils.js';
import { readTerminalSequence } from '../utils/terminal-sanitize.js';
import { clearImagesForProtocol, kittyGraphics, renderImageWithProtocol, isProtocolGraphics } from './graphics.js';
import type { GraphicsProtocol } from './graphics.js';
import { passthroughWrap } from './progressive.js';
import { getCapabilities } from './capabilities.js';
import { CellBuffer, bufferToAnsi } from './buffer.js';
import { renderFrameToCellBuffer } from './delta-render.js';
import { createProductionFrameSnapshot } from './frame-lifecycle.js';

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

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
 * Legacy ANSI-string buffer.
 *
 * @deprecated Runtime rendering uses the structured CellBuffer from
 * `tuiuiu.js/core`. This class remains exported for source compatibility.
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

    const cell = this.cells[y]?.[x];
    if (!cell) {
      return;
    }

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

      // Only SGR is styling. Every other terminal protocol is consumed without
      // being copied into cell styles, so ordinary Text cannot move the cursor,
      // erase the screen, or execute OSC/DCS payloads.
      if (char === '\x1b') {
        const sequence = readTerminalSequence(text, i);
        if (sequence) {
          if (sequence.kind === 'sgr' && (sequence.value === '\x1b[0m' || sequence.value === '\x1b[m')) {
            currentStyle = style; // Reset to base style
          } else if (sequence.kind === 'sgr') {
            currentStyle = (currentStyle || '') + sequence.value;
          }
          i = sequence.end;
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
  const buffer = new CellBuffer(frame.info.viewport.width, bufferHeight);
  renderFrameToCellBuffer(frame, buffer);

  const output = bufferToAnsi(buffer, fullHeight);
  const graphicsOutput = renderProtocolGraphics(frame, previousFrame);
  recordFramePhaseMetric(frame, 'ansiRenderMs', now() - renderStart);
  return graphicsOutput + output;
}

/**
 * Render a VNode tree to ANSI string
 */
export function renderToString(node: VNode, widthOrOptions?: number | RenderOptions, height?: number): string {
  const resolved = resolveRenderOptions(widthOrOptions, height);
  const callerProvidedHeight = typeof widthOrOptions === 'object'
    ? widthOrOptions.height !== undefined
    : height !== undefined;
  const viewportHeight = !callerProvidedHeight && node.props.height === 'fill'
    ? process.stdout.rows ?? 24
    : resolved.height;
  const frame = createProductionFrameSnapshot(node, {
    width: resolved.width,
    height: viewportHeight,
  });

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
  const frame = createProductionFrameSnapshot(node, {
    width: termWidth,
    height: 1000,
  });
  const layout = frame.layout;

  // Calculate full bounding box height including margins AND absolute positioned elements
  const style = node.props as BoxStyle;
  const marginBottom = style.marginBottom ?? style.marginY ?? style.margin ?? 0;
  const bounds = getLayoutBounds(layout);
  return bounds.maxY + (typeof marginBottom === 'number' ? marginBottom : 0);
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

/**
 * Wrap a graphics payload through multiplexer passthrough when needed.
 * Protocol graphics (kitty, iterm2, sixel) contain escape sequences that
 * must be wrapped for tmux/screen. Cell-rendered protocols (halfblock, braille)
 * never reach this code path.
 */
function wrapGraphicsPayload(payload: string, protocol: GraphicsProtocol): string {
  if (!isProtocolGraphics(protocol)) {
    return payload;
  }
  const caps = getCapabilities();
  if (!caps.multiplexer) {
    return payload;
  }
  return passthroughWrap(payload, caps.multiplexer);
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
      output += wrapGraphicsPayload(
        `\x1b7\x1b[H${kittyGraphics.delete(previousCommand.kittyImageId)}\x1b8`,
        'kitty',
      );
      continue;
    }

    return wrapGraphicsPayload(
      `\x1b7\x1b[H${clearImagesForProtocol('kitty')}\x1b8`,
      'kitty',
    );
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
    output += wrapGraphicsPayload(
      `\x1b7\x1b[${command.y + 1};${command.x + 1}H${payload}\x1b8`,
      command.protocol,
    );
  }

  return output;
}
