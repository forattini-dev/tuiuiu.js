# Media Components

Tuiuiu supports two classes of “media”:

- **character-rendered media** such as `Picture`, `ColoredPicture`, and `AnimatedPicture`
- **protocol-backed terminal images** via `TerminalImage`

Use the character-rendered path when you want portable output everywhere. Use `TerminalImage` when you want the runtime to negotiate Kitty, iTerm2, Sixel, or a high-quality fallback automatically.

## TerminalImage

`TerminalImage` renders decoded RGBA image data directly in the terminal when a graphics protocol is available, and falls back to `halfblock` or `braille` when it is not.

```typescript
import { Panel, TerminalImage, loadImageFile } from 'tuiuiu.js';

const image = await loadImageFile('./tests/tuiuiu.png');

Panel({ title: 'Preview', width: 40, height: 14 },
  TerminalImage({
    source: image,
    width: 'fill',
    height: 'fill',
    fit: 'contain',
  })
);
```

### Supported backends

- `kitty`
- `iterm2`
- `sixel`
- `halfblock`
- `braille`

### Important details

- the core runtime accepts decoded RGBA, not raw PNG/JPEG/WebP bytes
- `loadImageFile()` is the convenience bridge for file input and relies on `ffprobe` + `ffmpeg`
- `TerminalImage` participates in layout and reserves its covered cell region so text does not paint over the image

### Stateful rendering

For resize-heavy layouts, use `createTerminalImage()` to hold protocol cache/state across renders:

```typescript
import { createTerminalImage, TerminalImage } from 'tuiuiu.js';

const imageState = createTerminalImage({
  source: rgbaImage,
  fit: 'contain',
});

TerminalImage({
  state: imageState,
  width: 'fill',
  height: 'fill',
});
```

### Capability inspection

```typescript
import { getGraphicsCapabilities, queryGraphicsCapabilities } from 'tuiuiu.js';

const cached = getGraphicsCapabilities();
const negotiated = await queryGraphicsCapabilities();
```

## Picture

The main component for ASCII art and character-grid images. It handles scaling, cropping, and alignment.

### Usage

```typescript
import { Picture } from 'tuiuiu.js';

const art = `
  /\_/\
 ( o.o )
  > ^ <
`;

Picture({
  source: art,
  color: 'cyan',
  borderStyle: 'single'
})
```

### Alignment & Fit

Control how the image fits within its container:

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
  alignY: 'center'
})
```

## Pixel Art

Create colored pixel grids using palettes or raw colors.

### Usage

```typescript
import { createPixelGrid, ColoredPicture } from 'tuiuiu.js';

// Define palette
const palette = {
  'R': { fg: 'red' },
  'G': { fg: 'green' },
  'B': { fg: 'blue' }
};

// Create grid
const grid = createPixelGrid(`
RRR
GGG
BBB
`, palette);

// Render
ColoredPicture({ pixels: grid });
```

## FramedPicture

A convenience component that wraps a `Picture` in a border with an optional title.

```typescript
import { FramedPicture } from 'tuiuiu.js';

FramedPicture({
  source: logo,
  title: 'My App',
  borderStyle: 'double'
})
```

## Effects

Utilities for text effects.

### `createGradientBar(width, stops)`
Generates a gradient string.

```typescript
const bar = createGradientBar(20, [
  { position: 0, color: 'red' },
  { position: 1, color: 'blue' }
]);
```

### `rainbowText(text)`
Colorizes text with a rainbow pattern.

```typescript
Text({}, rainbowText('Hello World'));
```
