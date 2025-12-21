# Visual Components

These components are designed to create impactful visual displays, ASCII art, and decorative elements.

## BigText

Renders large text using block characters or other fonts.

### Fonts
- **block** (default): 5x5 using full blocks
- **slant**: Angled 4x4
- **small**: Compact 3x3
- **banner**: Tall 5x6
- **mini**: Tiny 2x2
- **doom**: classic video game style
- **shadow**: with drop shadow
- **graffiti**: street art style

### Usage

```typescript
import { BigText } from 'tuiuiu.js';

// Basic
BigText({
  text: 'HELLO',
  font: 'block',
  color: 'cyan'
})

// Gradient
BigText({
  text: 'RAINBOW',
  font: 'banner',
  gradient: ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta']
})
```

## Digits

Displays numbers in an LCD-style format.

### Styles
- **lcd**: 7-segment display simulation (3x5)
- **block**: Solid blocks
- **dotmatrix**: 5x5 dots
- **minimal**: Compact 3x3

### Usage

```typescript
import { Digits, Clock } from 'tuiuiu.js';

// Number
Digits({
  value: 1234,
  style: 'lcd',
  color: 'green'
})

// Clock (requires state management for updates)
Clock({
  time: new Date(),
  showSeconds: true
})
```

## Tooltip

Shows a popup hint relative to a target element.

### Usage

```typescript
import { Tooltip, WithTooltip } from 'tuiuiu.js';

// Direct usage
Tooltip({
  content: 'Press Enter',
  position: 'top',
  visible: true
})

// Wrapper
WithTooltip({
  tooltip: 'Help text',
  active: isHovered,
  children: Text({}, 'Hover me')
})
```

## InfoBox

Callout box for alerts, warnings, or tips.

### Types
- `info` (blue)
- `warning` (yellow)
- `error` (red)
- `success` (green)
- `tip` (cyan)

### Usage

```typescript
import { InfoBox } from 'tuiuiu.js';

InfoBox({
  type: 'warning',
  title: 'Caution',
  message: 'This action is irreversible.'
})
```

## Badge & Tag

Small indicators for status or categories.

### Usage

```typescript
import { Badge, Tag } from 'tuiuiu.js';

Badge({ text: 'NEW', color: 'green', variant: 'solid' })

Tag({ label: 'TypeScript', color: 'cyan', removable: true })
```
