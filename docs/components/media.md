# Media Components

Tuiuiu has two image paths:

- character-rendered media: `Picture`, `ColoredPicture`, `AnimatedPicture`
- terminal-protocol media: `TerminalImage`

Use the character-rendered path when you need maximum portability.
Use the terminal-protocol path when the terminal can render raster content through Kitty, iTerm2, or Sixel.

## TerminalImage Deep Dive

`TerminalImage` is the pipeline for decoded image payloads. It supports:

- Kitty Graphics Protocol (`kitty`)
- iTerm2 inline images (`iterm2`)
- Sixel (`sixel`)
- `halfblock` fallback (`▀` with `fg`/`bg`)
- `braille` fallback

By default, protocol selection is automatic with terminal profile hints + active capability probing.

### API and source types

`TerminalImage` accepts:

- `ImageData` (`pixels`, `width`, `height`) in RGBA
- `TerminalImageSource` (precomputed `cellSize` + `desiredColumns` + `desiredRows` + `hash`)

```typescript
import {
  createImageData,
  createTerminalImageSource,
  loadImageFile,
  TerminalImage,
} from 'tuiuiu.js';

// 1) direct RGBA data
const raw = createImageData(
  new Uint8Array([255, 0, 0, 255, 0, 0, 255, 255]),
  2,
  1,
);

// 2) precomputed source
const source = createTerminalImageSource(raw, { cellSize: { width: 10, height: 20 } });

// 3) file decoder helper
const fileImage = await loadImageFile('./tests/tuiuiu.png');

TerminalImage({ source: raw });
TerminalImage({ source });
TerminalImage({ source: fileImage });
```

`loadImageFile()` is a convenience around `ffprobe` + `ffmpeg` and returns `ImageData`.
If your environment does not have those binaries, load images in-process and pass
`ImageData` directly.

### Rendering pipeline and sizing model

`TerminalImage` is sized in cell units and keeps aspect ratio depending on the `fit` mode.

- `none` keeps source resolution and clips to target.
- `contain` preserves aspect ratio and fits inside target.
- `cover` fills target and crops overflow.
- `fill` stretches to exact target columns and rows.
- `crop` keeps source pixel scale and clips to target.

You can set cell dimensions explicitly with `imageWidth`/`imageHeight` or rely on source metadata.

```typescript
TerminalImage({
  source: fileImage,
  width: 60,       // columns
  height: 20,      // rows
  fit: 'contain',
  imageWidth: 640,
  imageHeight: 360,
});
```

### Protocol control

`protocol` in props/state is optional and may be:

- `'kitty' | 'iterm2' | 'sixel'`
- `'halfblock' | 'braille'`
- `'none'` (resolved through `getFallbackProtocol()`)

If omitted, runtime policy is used first; explicit protocol always wins.

```typescript
import { getGraphicsProtocol, getGraphicsCapabilities } from 'tuiuiu.js';

const caps = getGraphicsCapabilities();
const negotiated = getGraphicsProtocol();

TerminalImage({
  source: fileImage,
  protocol:
    caps.profile?.knownCaps.preferredGraphics === 'kitty' || caps.profile?.knownCaps.preferredGraphics === 'iterm2'
      ? caps.profile.knownCaps.preferredGraphics
      : 'halfblock',
});

console.log(negotiated);
```

### Layering behavior and reservation

`TerminalImage` commands reserve their exact terminal cell rectangle in the frame.

- normal text and box painting does not overwrite this reserved area in the same commit
- when an image leaves the tree, stale image payloads are cleaned

This is what makes protocol-backed images safe inside `Panel`, `Tabs`, `ScrollPanel`, and `SplitPanel`.

### Stateful mode and cache behavior

For dynamic content and heavy redraws, use `createTerminalImage()` to persist protocol cache and avoid re-encoding when geometry is unchanged.

```typescript
import { createTerminalImage, TerminalImage } from 'tuiuiu.js';

const imgState = createTerminalImage({
  source: fileImage,
  fit: 'contain',
  protocol: 'kitty',
});

function Dashboard({ source }) {
  imgState.updateOptions({ source, fit: 'cover' });

  return TerminalImage({
    state: imgState,
    width: 'fill',
    height: 12,
  });
}
```

State methods available on `TerminalImageState`:

- `setSource`
- `setFit`
- `setProtocol`
- `setImageSize`
- `invalidateRenderCache`
- `updateOptions`

### Capability-aware behavior

Check capability snapshots before forcing protocol mode.

```typescript
import { getCapabilities } from 'tuiuiu.js';

const caps = getCapabilities();

if (caps.profile?.knownCaps.preferredGraphics) {
  // protocol path is reasonable
}
```

For advanced diagnosis, inspect:

- `queryGraphicsCapabilities()`
- `getGraphicsCapabilities()`
- `getGraphicsProtocol()`
- terminal profile via `detectTerminalProfile()`

## Picture

`Picture` is the character-rendered baseline. It is best when you want deterministic output in CI, serial logs, or legacy terminals.

### Usage

```typescript
import { Picture } from 'tuiuiu.js';

const art = `
  /\\_/\\
 ( o.o )
  > ^ <
`;

Picture({
  source: art,
  color: 'cyan',
  borderStyle: 'single',
});
```

### Alignment and fit

`fit`, `alignX`, and `alignY` work similarly to other layout-bound media components.

- `fit`: `'none' | 'contain' | 'cover' | 'fill' | 'crop'`
- `alignX`: `'left' | 'center' | 'right'`
- `alignY`: `'top' | 'center' | 'bottom'`

```typescript
Picture({
  source: bigLogo,
  width: 40,
  height: 10,
  fit: 'contain',
  alignX: 'center',
  alignY: 'center',
});
```

## Pixel Art

Create colored pixel grids using palettes or raw color matrices.

### Usage

```typescript
import { createPixelGrid, ColoredPicture } from 'tuiuiu.js';

const palette = {
  R: { fg: 'red' },
  G: { fg: 'green' },
  B: { fg: 'blue' },
};

const grid = createPixelGrid(`
RRR
GGG
BBB
`, palette);

ColoredPicture({ pixels: grid });
```

## FramedPicture

Convenience wrapper for `Picture` with title and border controls.

```typescript
import { FramedPicture } from 'tuiuiu.js';

FramedPicture({
  source: logo,
  title: 'My App',
  borderStyle: 'double',
});
```

## Effects

Utility helpers for terminal visual effects.

### `createGradientBar(width, stops)`

```typescript
const bar = createGradientBar(20, [
  { position: 0, color: 'red' },
  { position: 1, color: 'blue' },
]);
```

### `rainbowText(text)`

```typescript
Text({}, rainbowText('Hello World'));
```

## Image animation with TerminalImage

The image animation API in [Image Animation](/core/image-animation.md) emits `ImageData` over time. Feed it directly to `TerminalImage`.

```typescript
import {
  createImageData,
  createAnimatedImageSource,
  createAnimatedImage,
  TerminalImage,
} from 'tuiuiu.js';

const red = createImageData([255, 0, 0, 255], 1, 1);
const blue = createImageData([0, 0, 255, 255], 1, 1);
const animSource = createAnimatedImageSource([red, blue], { defaultDuration: 120 });
const anim = createAnimatedImage(animSource);

anim.play();

TerminalImage({
  source: anim.currentImageData(),
  width: 24,
  height: 6,
  fit: 'contain',
});
```

## Performance and reliability checklist

- Prefer `createTerminalImage()` for frequent updates; keep `fit` stable when possible.
- Use `protocol` only when the terminal capabilities are known or probed.
- In multiplexers (`tmux`, `screen`, `zellij`), passthrough constraints can affect protocol commands.
- For unknown terminals, let runtime fallback to `halfblock` or `braille`.

## Related

- [Image Animation](/core/image-animation.md)
- [Terminal Detection](/core/terminal-detection.md)
- [Capabilities](/core/capabilities.md)
- [Picture](/components/media/picture.md)
