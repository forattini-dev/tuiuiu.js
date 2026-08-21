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
