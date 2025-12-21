# Media Components

Components for displaying images, pixel art, and ASCII graphics.

## Picture

The main component for displaying ASCII art or pixel grids. It handles scaling, cropping, and alignment.

### Usage

```typescript
import { Picture } from 'tuiuiu';

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
import { createPixelGrid, ColoredPicture } from 'tuiuiu';

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
import { FramedPicture } from 'tuiuiu';

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

```