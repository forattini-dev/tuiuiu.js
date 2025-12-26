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
| `width` | `number` | `20` | Width in characters |
| `style` | `ProgressBarStyle` | `'block'` | Visual style |
| `color` | `string` | `'cyan'` | Bar color |
| `background` | `string` | - | Empty bar color |
| `gradient` | `string[]` | - | Gradient colors |
| `label` | `string` | - | Label (left side) |
| `showPercentage` | `boolean` | `false` | Show percentage |
| `showValue` | `boolean` | `false` | Show "50/100" |
| `showEta` | `boolean` | `false` | Show ETA |
| `showSpeed` | `boolean` | `false` | Show speed |
| `eta` | `number` | - | ETA in seconds |
| `speed` | `number` | - | Speed value |
| `speedUnit` | `string` | - | Speed unit (e.g., "MB/s") |

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
// ████████████░░░░░░░░ 45% | 2.5 MB/s | ETA: 2:00
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
  max: 100,
  width: 30,
  showPercentage: true,
})

// Update progress
bar.setValue(25)
bar.increment(5)  // Add 5
bar.increment()   // Add 1

// Get state
bar.value()       // Current value
bar.percentage()  // As percentage
bar.isComplete()  // true if value >= max

// Render
renderProgressBar(bar)
```

## MultiProgressBar

Display multiple progress bars together:

```typescript
MultiProgressBar({
  bars: [
    { label: 'File 1', value: 80, max: 100, color: 'cyan' },
    { label: 'File 2', value: 45, max: 100, color: 'green' },
    { label: 'File 3', value: 20, max: 100, color: 'yellow' },
  ],
  width: 25,
  showPercentage: true,
})
```

Output:
```
File 1 ████████████████████░░░░░ 80%
File 2 ███████████░░░░░░░░░░░░░░ 45%
File 3 █████░░░░░░░░░░░░░░░░░░░░ 20%
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
