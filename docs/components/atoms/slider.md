# Slider

Interactive slider for numeric value selection.

## Import

```typescript
import { Slider, createSlider, RangeSlider, createRangeSlider } from 'tuiuiu.js'
```

## Basic Usage

```typescript
// Simple slider
Slider({ min: 0, max: 100, initialValue: 50 })

// With value display
Slider({
  min: 0,
  max: 100,
  showValue: true,
  onChange: (v) => console.log(v),
})

// Custom step
Slider({ min: 0, max: 1, step: 0.1, showValue: true })
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `step` | `number` | `1` | Step increment |
| `initialValue` | `number` | `min` | Initial value |
| `width` | `number` | `20` | Width in characters |
| `showValue` | `boolean` | `false` | Show current value |
| `showMinMax` | `boolean` | `false` | Show min/max labels |
| `formatValue` | `(v: number) => string` | - | Value formatter |
| `color` | `ColorValue` | `'primary'` | Filled track color |
| `background` | `ColorValue` | - | Empty track color |
| `thumbColor` | `ColorValue` | - | Thumb color |
| `disabled` | `boolean` | `false` | Disable interaction |
| `isActive` | `boolean` | `true` | Handle keyboard input |
| `onChange` | `(value: number) => void` | - | Change handler |

## Visual Appearance

```
[━━━━━━━━●━━━━━━━━━━] 50
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `h` | Decrease by step |
| `→` / `l` | Increase by step |
| `Home` | Go to minimum |
| `End` | Go to maximum |
| `Page Up` | Increase by 10 steps |
| `Page Down` | Decrease by 10 steps |

## Programmatic Control

```typescript
const slider = createSlider({
  min: 0,
  max: 100,
  step: 5,
  onChange: (v) => console.log(v),
})

// Control methods
slider.increment()        // Add step
slider.decrement()        // Subtract step
slider.incrementLarge()   // Add 10 steps
slider.decrementLarge()   // Subtract 10 steps
slider.setValue(75)       // Set specific value
slider.setNormalized(0.5) // Set as 0-1 ratio

// Read state
slider.value()      // Current value
slider.normalized() // Value as 0-1 ratio

// Use in component
Slider({ state: slider })
```

## RangeSlider

Two-handle slider for selecting a range:

```typescript
RangeSlider({
  min: 0,
  max: 100,
  initialStart: 25,
  initialEnd: 75,
  onChange: (start, end) => console.log(`${start} - ${end}`),
})
```

### RangeSlider Output

```
[━━━━━●━━━━━━━━━━●━━] 25-75
```

### RangeSlider Props

| Prop | Type | Description |
|------|------|-------------|
| `initialStart` | `number` | Initial start value |
| `initialEnd` | `number` | Initial end value |
| `onChange` | `(start, end) => void` | Range change handler |

### RangeSlider State

```typescript
const range = createRangeSlider({ min: 0, max: 100 })

range.start()            // Start value
range.end()              // End value
range.setStart(20)       // Set start
range.setEnd(80)         // Set end
range.setRange(20, 80)   // Set both
```

## Examples

### Volume Control

```typescript
function VolumeSlider() {
  return Slider({
    min: 0,
    max: 100,
    initialValue: 50,
    showValue: true,
    formatValue: (v) => `${v}%`,
    color: 'cyan',
  })
}
```

### Price Range Filter

```typescript
function PriceFilter() {
  return RangeSlider({
    min: 0,
    max: 1000,
    initialStart: 100,
    initialEnd: 500,
    showValue: true,
    formatValue: (v) => `$${v}`,
    onChange: (min, max) => filterProducts(min, max),
  })
}
```

### Percentage Slider

```typescript
Slider({
  min: 0,
  max: 1,
  step: 0.01,
  initialValue: 0.5,
  showValue: true,
  formatValue: (v) => `${Math.round(v * 100)}%`,
})
```

## Related

- [ProgressBar](/components/atoms/progress-bar.md) - Progress indicators
- [Switch](/components/atoms/switch.md) - Boolean toggle
- [Forms](/components/forms.md) - Form components
