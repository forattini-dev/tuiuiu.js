#!/usr/bin/env node
/**
 * Terminal image pipeline demo.
 *
 * Run: pnpm tsx examples/terminal-image-pipeline.ts
 */

import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

import {
  Box,
  Footer,
  Header,
  Main,
  Panel,
  Screen,
  Spacer,
  TerminalImage,
  Text,
  createImageData,
  createGradientImage,
  createTerminalImage,
  type ImageData,
  queryGraphicsCapabilities,
  render,
  useApp,
  useInput,
} from '../src/index.js';

const DEFAULT_IMAGE_PATH = 'tests/tuiuiu.png';

function loadPngAsRgba(imagePath: string): ImageData {
  const resolvedPath = resolvePath(process.cwd(), imagePath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Image file not found: ${resolvedPath}`);
  }

  const probeOutput = execFileSync(
    'ffprobe',
    [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'stream=width,height',
      '-of',
      'json',
      resolvedPath,
    ],
    { encoding: 'utf8' },
  );
  const probe = JSON.parse(probeOutput) as {
    streams?: Array<{ width?: number; height?: number }>;
  };
  const width = probe.streams?.[0]?.width;
  const height = probe.streams?.[0]?.height;

  if (!width || !height) {
    throw new Error(`Unable to determine image dimensions for ${resolvedPath}`);
  }

  const rawPixels = execFileSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      resolvedPath,
      '-f',
      'rawvideo',
      '-pix_fmt',
      'rgba',
      '-',
    ],
    {
      encoding: 'buffer',
      maxBuffer: Math.max(width * height * 4 * 2, 4 * 1024 * 1024),
    },
  );

  const expectedSize = width * height * 4;
  if (rawPixels.length !== expectedSize) {
    throw new Error(
      `Decoded RGBA size mismatch for ${resolvedPath}: expected ${expectedSize}, got ${rawPixels.length}`,
    );
  }

  return createImageData(rawPixels, width, height);
}

const imagePath = process.env.IMAGE_PATH ?? DEFAULT_IMAGE_PATH;
let sourceDescription = `file=${imagePath}`;
let sourceImage: ImageData;

try {
  sourceImage = loadPngAsRgba(imagePath);
} catch (error) {
  sourceDescription = 'generated gradient fallback';
  sourceImage = createGradientImage(160, 96);
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[terminal-image-pipeline] ${message}`);
  console.error('[terminal-image-pipeline] Falling back to generated RGBA gradient.');
}

const capabilities = await queryGraphicsCapabilities();
const imageState = createTerminalImage({
  source: sourceImage,
  protocol: capabilities.protocol,
  fit: 'contain',
});

function TerminalImagePipelineDemo() {
  const app = useApp();
  const activeProtocol = imageState.protocol() ?? capabilities.protocol;
  const stats = imageState.protocolState.stats();

  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      app.exit();
      return;
    }

    if (input === 'a') {
      imageState.setProtocol(capabilities.protocol);
      imageState.invalidateRenderCache();
      return;
    }

    if (input === 'f') {
      imageState.setProtocol('halfblock');
      imageState.invalidateRenderCache();
      return;
    }

    if (input === 'b') {
      imageState.setProtocol('braille');
      imageState.invalidateRenderCache();
    }
  });

  return Screen(
    {},
    Header(
      { backgroundColor: 'muted', width: 'fill', paddingX: 1 },
      Text({ bold: true }, 'Terminal Image Pipeline'),
      Spacer(),
      Text({ color: 'mutedForeground' }, `negotiated=${capabilities.protocol}`),
      Text({ color: 'mutedForeground' }, '  '),
      Text({ color: 'mutedForeground' }, `active=${activeProtocol}`),
    ),
    Main(
      { padding: 1, gap: 1, flexDirection: 'column' },
      Box(
        { flexDirection: 'row', gap: 2 },
        Box(
          { flexDirection: 'column', width: 30, borderStyle: 'single', padding: 1 },
          Text({ bold: true }, 'Capabilities'),
          Text({}, `cell: ${capabilities.cellSize.width}x${capabilities.cellSize.height}px`),
          Text({}, `queries: ${capabilities.supportsQueries ? 'yes' : 'no'}`),
          Text({}, `placement: ${capabilities.supportsPlacement ? 'yes' : 'no'}`),
          Text({}, `clear: ${capabilities.supportsClear ? 'yes' : 'no'}`),
          Text({}, `detectedBy: ${capabilities.detectedBy}`),
        ),
        Box(
          { flexDirection: 'column', flexGrow: 1, borderStyle: 'single', padding: 1 },
          Text({ bold: true }, 'Controls'),
          Text({}, '[A] Auto protocol'),
          Text({}, '[F] Force halfblock'),
          Text({}, '[B] Force braille'),
          Text({}, '[Q] Quit'),
          Text({ color: 'mutedForeground' }, `cache hits=${stats.hits} misses=${stats.misses} size=${stats.size}`),
        ),
      ),
      Panel(
        {
          title: 'Image Panel',
          flexGrow: 1,
          borderStyle: 'round',
          padding: 1,
        },
        Text({ color: 'mutedForeground' }, 'Resize the terminal to force a new render area and watch the image adapt.'),
        Box({ height: 1 }),
        TerminalImage({
          state: imageState,
          flexGrow: 1,
          width: 'fill',
          height: 'fill',
          borderStyle: 'single',
          padding: 1,
        }),
      ),
    ),
    Footer(
      { backgroundColor: 'muted', width: 'fill', paddingX: 1 },
      Text({ color: 'mutedForeground' }, sourceDescription),
      Spacer(),
      Text({ color: 'mutedForeground' }, 'Exercises active pick, fallback toggle, and live resize'),
    ),
  );
}

const { waitUntilExit } = render(TerminalImagePipelineDemo, { fullHeight: true });
await waitUntilExit();
