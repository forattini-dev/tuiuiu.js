# Picture

Display ASCII art and pixel graphics in the terminal.

## Import

```typescript
import {
  Picture,
  FramedPicture,
  ColoredPicture,
  createPixelGrid,
  createPixelGridFromColors,
  renderPixelGrid,
  AsciiPatterns,
  createBanner,
} from 'tuiuiu.js'
```

## Picture

Display ASCII art with support for scaling, alignment, and transparency.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `string \| string[]` | required | ASCII art content |
| `width` | `number` | - | Fixed width (characters) |
| `height` | `number` | - | Fixed height (lines) |
| `fit` | `'none' \| 'contain' \| 'cover' \| 'fill' \| 'crop'` | `'none'` | How to fit in container |
| `alignX` | `'left' \| 'center' \| 'right'` | `'left'` | Horizontal alignment |
| `alignY` | `'top' \| 'center' \| 'bottom'` | `'top'` | Vertical alignment |
| `color` | `ColorValue` | - | Foreground color |
| `backgroundColor` | `ColorValue` | - | Background color |
| `transparent` | `string` | - | Character to treat as transparent |
| `borderStyle` | `BorderStyle` | - | Border style |
| `borderColor` | `ColorValue` | - | Border color |
| `padding` | `number` | `0` | Padding inside frame |
| `preserveColors` | `boolean` | `false` | Preserve ANSI codes in source |

### Examples

```typescript
// Simple ASCII art
Picture({
  source: `
    /\\_/\\
   ( o.o )
    > ^ <
  `,
  color: 'cyan',
})

// Logo with fixed size
Picture({
  source: LOGO_ART,
  width: 40,
  height: 10,
  fit: 'contain',
  alignX: 'center',
})

// Full-screen splash
Picture({
  source: SPLASH_ART,
  width: process.stdout.columns,
  height: process.stdout.rows,
  fit: 'contain',
  alignX: 'center',
  alignY: 'center',
})
```

## ColoredPicture

Display colored pixel art using a PixelGrid. Each pixel can have its own colors.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pixels` | `PixelGrid` | required | Pixel grid to render |
| `width` | `number` | - | Fixed width |
| `height` | `number` | - | Fixed height |
| `alignX` | `'left' \| 'center' \| 'right'` | `'left'` | Horizontal alignment |
| `alignY` | `'top' \| 'center' \| 'bottom'` | `'top'` | Vertical alignment |
| `borderStyle` | `BorderStyle` | - | Border style |
| `borderColor` | `ColorValue` | - | Border color |
| `padding` | `number` | `0` | Padding |

### Examples

```typescript
// Using palette
const grid = createPixelGrid(`
RRRGGGBBB
RRRGGGBBB
`, {
  'R': { fg: 'red' },
  'G': { fg: 'green' },
  'B': { fg: 'blue' },
})

ColoredPicture({ pixels: grid })

// Using color matrix
const colors = [
  ['red', 'green', 'blue'],
  ['yellow', 'magenta', 'cyan'],
]
const grid2 = createPixelGridFromColors(colors)

ColoredPicture({ pixels: grid2 })
```

## FramedPicture

Picture with a decorative frame and optional title.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `source` | `string \| string[]` | required | ASCII art content |
| `title` | `string` | - | Title at top of frame |
| `titleColor` | `ColorValue` | `'white'` | Title color |
| `borderStyle` | `BorderStyle` | `'single'` | Border style |
| `borderColor` | `ColorValue` | `'gray'` | Border color |
| `color` | `ColorValue` | - | Art foreground color |
| `fit` | `FitMode` | `'none'` | How to fit picture |
| `alignX` | `AlignX` | `'left'` | Horizontal alignment |
| `alignY` | `AlignY` | `'top'` | Vertical alignment |

### Example

```typescript
FramedPicture({
  source: LOGO_ART,
  title: ' My App ',
  titleColor: 'cyan',
  borderStyle: 'double',
  borderColor: 'gray',
})
```

## Creating Pixel Grids

### createPixelGrid

Create a PixelGrid from ASCII art and a color palette.

```typescript
const art = `
RRR
GGG
BBB
`

const palette = {
  'R': { fg: 'red' },
  'G': { fg: 'green' },
  'B': { fg: 'blue' },
}

const grid = createPixelGrid(art, palette)
```

### createPixelGridFromColors

Create a PixelGrid from a 2D array of colors.

```typescript
const colors = [
  ['red', 'red', 'red'],
  ['green', 'green', 'green'],
  ['blue', 'blue', 'blue'],
]

const grid = createPixelGridFromColors(colors)

// With custom character
const grid2 = createPixelGridFromColors(colors, '▓')

// With transparency (null)
const heart = [
  [null, 'red', null, 'red', null],
  ['red', 'red', 'red', 'red', 'red'],
  ['red', 'red', 'red', 'red', 'red'],
  [null, 'red', 'red', 'red', null],
  [null, null, 'red', null, null],
]
const heartGrid = createPixelGridFromColors(heart)
```

### renderPixelGrid

Render a PixelGrid to an ANSI string for direct output.

```typescript
const grid = createPixelGrid(art, palette)
const ansiString = renderPixelGrid(grid)
console.log(ansiString)
```

## Pre-made Patterns

### AsciiPatterns

Pre-defined ASCII art patterns for common shapes.

```typescript
// Static patterns
AsciiPatterns.arrowRight  // →
AsciiPatterns.arrowLeft   // ←
AsciiPatterns.star        // ★
AsciiPatterns.heart       // ♥
AsciiPatterns.checkmark   // ✓
AsciiPatterns.cross       // ✗

// Generated patterns
AsciiPatterns.hline(40)              // ────────────────────
AsciiPatterns.vline(5)               // │ (vertical)
AsciiPatterns.box(20, 10, 'double')  // ╔═══╗ box
AsciiPatterns.diamond(5)             // ◇ shape
```

### createBanner

Generate a text banner with optional border.

```typescript
const banner = createBanner('Welcome!', 'double')

// Result:
// ╔════════════╗
// ║  Welcome!  ║
// ╚════════════╝

Picture({ source: banner })
```

## Types

### Pixel

```typescript
interface Pixel {
  char: string   // Character to display
  fg?: string    // Foreground color
  bg?: string    // Background color
}
```

### PixelGrid

```typescript
type PixelGrid = Pixel[][]  // 2D array of pixels
```

### ColorPalette

```typescript
interface ColorPalette {
  [char: string]: { fg?: string; bg?: string }
}
```

## Related

- [AnimatedPicture](/components/media/animated-picture.md) - Animated pixel art
- [Spinner](/components/atoms/spinner.md) - Loading spinners
- [ProgressBar](/components/atoms/progress-bar.md) - Progress indicators
