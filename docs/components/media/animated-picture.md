# AnimatedPicture

Animated pixel art and ASCII art with built-in effects like pulse, breathe, shimmer, and more.

## Import

```typescript
import {
  AnimatedPicture,
  createAnimatedPicture,
  createPixelGrid,
  createPixelGridFromColors,
  applyBrightnessToGrid,
  applyShimmerToGrid,
  applyRainbowToGrid,
  applyGlitchToGrid,
  adjustBrightness,
  interpolateColor,
} from 'tuiuiu.js'
```

## Basic Usage

```typescript
// Create a pixel grid
const pixels = createPixelGridFromColors([
  ['red', 'red', 'red'],
  ['green', 'green', 'green'],
  ['blue', 'blue', 'blue'],
])

// Create animation controller
const anim = createAnimatedPicture({
  pixels,
  animation: 'pulse',
  duration: 2000,
  minBrightness: 0.3,
})

// Render in component
ColoredPicture({ pixels: anim.pixels() })
```

## Available Animations

| Animation | Description | Best For |
|-----------|-------------|----------|
| `pulse` | Fast brightness oscillation (sine wave) | Attention-grabbing, alerts |
| `breathe` | Slow, smooth breathing effect | Ambient, loading states |
| `blink` | Hard on/off toggle | Warnings, critical alerts |
| `fadeIn` | Gradual appearance | Entry animations |
| `fadeOut` | Gradual disappearance | Exit animations |
| `glow` | Subtle brightness variation | Ambient highlights |
| `shimmer` | Wave of brightness across image | Loading, progress |
| `rainbow` | Cycle through spectrum colors | Fun, celebratory |
| `glitch` | Random distortion/scrambling | Retro, error states |
| `none` | No animation | Static display |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `pixels` | `PixelGrid` | required | Pixel grid to animate |
| `animation` | `PictureAnimation` | `'pulse'` | Animation type |
| `duration` | `number` | `1500` | Cycle duration in ms |
| `minBrightness` | `number` | `0.2` | Minimum brightness (0-1) |
| `maxBrightness` | `number` | `1.0` | Maximum brightness (0-1) |
| `easing` | `AnimationEasing` | `'sine'` | Easing function |
| `loop` | `boolean` | `true` | Loop animation |
| `autoPlay` | `boolean` | `true` | Start automatically |
| `onCycleComplete` | `() => void` | - | Callback each cycle |
| `width` | `number` | - | Fixed width |
| `height` | `number` | - | Fixed height |
| `alignX` | `'left' \| 'center' \| 'right'` | `'left'` | Horizontal alignment |
| `alignY` | `'top' \| 'center' \| 'bottom'` | `'top'` | Vertical alignment |
| `borderStyle` | `BorderStyle` | - | Border style |
| `borderColor` | `string` | - | Border color |
| `padding` | `number` | `0` | Padding |

## Easing Functions

| Easing | Description |
|--------|-------------|
| `linear` | Constant speed |
| `ease-in` | Start slow, end fast |
| `ease-out` | Start fast, end slow |
| `ease-in-out` | Slow start and end |
| `sine` | Smooth sine wave (default) |

## Programmatic Control

```typescript
const anim = createAnimatedPicture({
  pixels: myGrid,
  animation: 'breathe',
  duration: 3000,
  minBrightness: 0.2,
  autoPlay: false,  // Don't start automatically
})

// Control methods
anim.play()         // Start animation
anim.pause()        // Pause animation
anim.stop()         // Stop and reset

// Change animation
anim.setAnimation('shimmer')

// Manual brightness control
anim.setBrightness(0.5)

// State access
anim.isPlaying()    // boolean
anim.progress()     // 0-1
anim.brightness()   // current brightness value
anim.pixels()       // current processed PixelGrid
```

## Examples

### Pulsing Logo

```typescript
const logo = createPixelGrid(`
███╗   ███╗██╗   ██╗
████╗ ████║╚██╗ ██╔╝
██╔████╔██║ ╚████╔╝
██║╚██╔╝██║  ╚██╔╝
██║ ╚═╝ ██║   ██║
╚═╝     ╚═╝   ╚═╝
`, {
  '█': { fg: 'cyan' },
  '╗': { fg: 'cyan' },
  '╔': { fg: 'cyan' },
  '╝': { fg: 'cyan' },
  '╚': { fg: 'cyan' },
  '║': { fg: 'cyan' },
  '═': { fg: 'cyan' },
})

const anim = createAnimatedPicture({
  pixels: logo,
  animation: 'pulse',
  duration: 1500,
  minBrightness: 0.4,
})
```

### Loading Indicator with Shimmer

```typescript
const loadingBar = createPixelGridFromColors([
  ['cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan', 'cyan'],
])

const loading = createAnimatedPicture({
  pixels: loadingBar,
  animation: 'shimmer',
  duration: 1000,
  minBrightness: 0.3,
})

function LoadingScreen() {
  return Box({ flexDirection: 'column', alignItems: 'center' },
    Text({}, 'Loading...'),
    ColoredPicture({ pixels: loading.pixels(), width: 20 }),
  )
}
```

### Rainbow Celebration

```typescript
const star = createPixelGrid(`
    ★
   ★★★
  ★★★★★
   ★★★
    ★
`, {
  '★': { fg: 'yellow' },
})

const celebration = createAnimatedPicture({
  pixels: star,
  animation: 'rainbow',
  duration: 2000,
})
```

### Glitch Effect for Errors

```typescript
const errorIcon = createPixelGridFromColors([
  [null, 'red', 'red', null],
  ['red', null, null, 'red'],
  ['red', 'red', 'red', 'red'],
  ['red', null, null, 'red'],
])

const glitchError = createAnimatedPicture({
  pixels: errorIcon,
  animation: 'glitch',
  duration: 500,
})
```

### Breathing Ambient Effect

```typescript
const ambient = createAnimatedPicture({
  pixels: myArt,
  animation: 'breathe',
  duration: 4000,      // Slow breathing
  minBrightness: 0.6,  // Subtle dim
  maxBrightness: 1.0,
  easing: 'ease-in-out',
})
```

### Controlled Fade Animation

```typescript
const fadeAnim = createAnimatedPicture({
  pixels: splash,
  animation: 'fadeIn',
  duration: 1000,
  loop: false,         // Only once
  autoPlay: false,
  onCycleComplete: () => {
    // Switch to main content after fade in
    showMainApp()
  },
})

// Trigger on mount
fadeAnim.play()
```

## Color Utilities

### adjustBrightness

Adjust the brightness of a color:

```typescript
adjustBrightness('#ff0000', 0.5)  // Dim red to half brightness
adjustBrightness('cyan', 0.3)     // Dim cyan to 30%
adjustBrightness('#fff', 1.5)     // Brighten (clamped to #ffffff)
```

### interpolateColor

Blend between two colors:

```typescript
interpolateColor('#ff0000', '#0000ff', 0.5)  // Purple (middle)
interpolateColor('red', 'blue', 0.25)        // 75% red, 25% blue
```

### Grid Effects

Apply effects to entire pixel grids:

```typescript
// Dim entire image to 50%
const dimmed = applyBrightnessToGrid(grid, 0.5)

// Shimmer wave at 30% progress
const shimmered = applyShimmerToGrid(grid, 0.3, 0.2)

// Rainbow effect at 50% progress
const rainbow = applyRainbowToGrid(grid, 0.5)

// Glitch at 40% intensity
const glitched = applyGlitchToGrid(grid, 0.4)
```

## Creating Pixel Grids

### From ASCII with Palette

```typescript
const grid = createPixelGrid(`
RRRGGGBBB
RRRGGGBBB
`, {
  'R': { fg: 'red' },
  'G': { fg: 'green' },
  'B': { fg: 'blue' },
})
```

### From Color Matrix

```typescript
const grid = createPixelGridFromColors([
  ['red', 'green', 'blue'],
  ['yellow', 'cyan', 'magenta'],
], '▓')  // Custom character (default: █)
```

## Tips

### Performance

- Animations run at ~60fps using `setInterval`
- Use `autoPlay: false` and call `play()` when visible
- Call `stop()` when component unmounts

### Brightness Range

- `minBrightness: 0` makes image invisible at dimmest
- `minBrightness: 0.3-0.5` is usually good for visibility
- `maxBrightness: 1` is full brightness

### Duration Guidelines

| Effect | Recommended Duration |
|--------|---------------------|
| `pulse` | 1000-2000ms |
| `breathe` | 3000-5000ms |
| `blink` | 500-1000ms |
| `shimmer` | 1000-2000ms |
| `rainbow` | 2000-4000ms |
| `glitch` | 300-800ms |

## Related

- [Picture](/components/media/picture.md) - Static picture component
- [ColoredPicture](/components/media/picture.md#coloredpicture) - Colored pixel art
- [Spinner](/components/atoms/spinner.md) - Loading spinners
- [Animation](/core/animation.md) - Animation system
