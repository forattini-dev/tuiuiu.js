# ProgressBar

Visual progress indicator with multiple styles and advanced features.

<div align="center">

![Progress Bar Demo](../../recordings/components/progress-bar.gif)

</div>

## Import

```typescript
import { ProgressBar, createProgressBar, MultiProgressBar } from 'tuiuiu.js'
```

## Basic Usage

```typescript
// Simple progress bar
ProgressBar({ value: 50, max: 100 })

// With percentage
ProgressBar({ value: 0.75, showPercentage: true })

// With label
ProgressBar({ value: 50, max: 100, label: 'Download:' })
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | `0` | Current progress (0-1 or 0-100) |
| `max` | `number` | auto | Maximum value |
| `width` | `number` | `40` | Bar width in characters |
| `style` | `ProgressBarStyle` | `'block'` | Visual style |
| `color` | `string` | theme info | Bar color |
| `background` | `string` | theme muted | Empty bar color |
| `gradient` | `string[]` | - | Gradient colors |
| `label` | `string` | - | Label (left side) |
| `description` | `string` | - | Description (right side) |
| `showPercentage` | `boolean` | `true` | Show percentage |
| `showValue` | `boolean` | `false` | Show "50/100" |
| `showEta` | `boolean` | `false` | Show ETA |
| `showSpeed` | `boolean` | `false` | Show speed |
| `eta` | `number` | - | ETA in seconds |
| `speed` | `number` | - | Speed value |
| `speedUnit` | `string` | `'/s'` | Speed unit (e.g., "MB/s") |
| `indeterminate` | `boolean` | `false` | Render an unknown-duration animation |
| `indeterminateStyle` | `'classic' \| 'marquee' \| 'fill-and-clear'` | `'classic'` | Unknown-duration animation style |
| `borderStyle` | `'none' \| 'brackets' \| 'pipes' \| 'arrows'` | `'brackets'` | Standalone component border |

## Styles

### Block (default)
```typescript
ProgressBar({ value: 50, style: 'block' })
// ████████████░░░░░░░░ 50%
```

### Smooth
```typescript
ProgressBar({ value: 50, style: 'smooth' })
// Uses fractional block characters for smoother progress
```

### Line
```typescript
ProgressBar({ value: 50, style: 'line' })
// ━━━━━━━━━━──────────
```

### Dots
```typescript
ProgressBar({ value: 50, style: 'dots' })
// ●●●●●●●●●●○○○○○○○○○○
```

### Braille
```typescript
ProgressBar({ value: 50, style: 'braille' })
// Uses braille characters for high-resolution
```

### ASCII
```typescript
ProgressBar({ value: 50, style: 'ascii' })
// [==========          ]
```

## Advanced Features

### With ETA and Speed

```typescript
ProgressBar({
  value: 45,
  max: 100,
  showPercentage: true,
  showEta: true,
  showSpeed: true,
  eta: 120, // seconds
  speed: 2.5,
  speedUnit: 'MB/s',
})
// [██████████████████░░░░░░░░░░░░░░░░░░░░░░] 45% ETA: 2m 0s 2.5MB/s
```

### With Gradient

```typescript
ProgressBar({
  value: 75,
  max: 100,
  gradient: ['red', 'yellow', 'green'],
})
// Gradient from red (0%) to yellow (50%) to green (100%)
```

### Custom Colors

```typescript
ProgressBar({
  value: 60,
  color: 'success',
  background: 'neutral-700',
})
```

## Programmatic Control

```typescript
const bar = createProgressBar({
  value: 0,
  max: 100,
})

// Update progress
bar.setProgress(25, 100)
bar.increment(5)  // Add 5
bar.increment()   // Add 1

// Get state
bar.progress()    // Normalized value from 0 to 1
bar.getElapsed()  // Elapsed seconds
bar.getEta()      // Estimated remaining seconds
bar.getSpeed()    // Processed items per second

// Render
renderProgressBar(bar, {
  width: 30,
  showPercentage: true,
  showValue: true,
  value: Math.round(bar.progress() * 100),
  max: 100,
})
```

## MultiProgressBar

Display multiple values as segments of one bar. `width` is the maximum width of
both the bordered bar and its legend; long legends are truncated with `…`.

```typescript
MultiProgressBar({
  segments: [
    { label: 'complete', value: 80, color: 'green' },
    { label: 'running', value: 15, color: 'cyan' },
    { label: 'failed', value: 5, color: 'red' },
  ],
  total: 100,
  width: 25,
  showLegend: true,
})
```

Output:
```
[███████████████████████]
• complete: 80  • runni…
```

## Examples

### File Download

```typescript
function DownloadBar({ bytesReceived, totalBytes, bytesPerSecond }) {
  const eta = (totalBytes - bytesReceived) / bytesPerSecond

  return ProgressBar({
    value: bytesReceived,
    max: totalBytes,
    label: 'Downloading:',
    showPercentage: true,
    showSpeed: true,
    showEta: true,
    speed: bytesPerSecond / (1024 * 1024),
    speedUnit: 'MB/s',
    eta,
  })
}
```

### Build Progress

```typescript
function BuildProgress({ step, totalSteps, currentTask }) {
  return Box({ flexDirection: 'column' },
    Text({}, currentTask),
    ProgressBar({
      value: step,
      max: totalSteps,
      style: 'smooth',
      showValue: true,
      color: 'primary',
    })
  )
}
```

### Health Bar (Gaming)

```typescript
function HealthBar({ health, maxHealth }) {
  const color = health > 50 ? 'green' : health > 25 ? 'yellow' : 'red'

  return ProgressBar({
    value: health,
    max: maxHealth,
    label: 'HP',
    color,
    style: 'block',
    showValue: true,
  })
}
```

## Related

- [Spinner](/components/atoms/spinner.md) - Loading indicators
- [Gauge](/components/viz/gauges.md) - Gauge displays
- [Sparkline](/components/viz/sparkline.md) - Inline charts
