#!/usr/bin/env node
/**
 * Terminal image pipeline demo.
 *
 * Run: pnpm tsx examples/terminal-image-pipeline.ts
 */

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
  createGradientImage,
  createTerminalImage,
  type ImageData,
  loadImageFile,
  queryGraphicsCapabilities,
  render,
  useApp,
  useInput,
} from '../src/index.js';

const DEFAULT_IMAGE_PATH = 'tests/tuiuiu.png';

const imagePath = process.env.IMAGE_PATH ?? DEFAULT_IMAGE_PATH;
let sourceDescription = `file=${imagePath}`;
let sourceImage: ImageData;

try {
  sourceImage = await loadImageFile(imagePath);
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
