# Box

The foundational layout component. Every UI in Tuiuiu starts with `Box`.

## Basic Usage

```typescript
import { Box, Text } from 'tuiuiu.js';

Box({ padding: 1 },
  Text({}, 'Hello, World!')
)
```

## Flexbox Layout

Box uses Flexbox for layout, just like CSS:

```typescript
// Row layout (default)
Box({ flexDirection: 'row', gap: 2 },
  Text({}, 'Left'),
  Text({}, 'Right')
)

// Column layout
Box({ flexDirection: 'column', gap: 1 },
  Text({}, 'Top'),
  Text({}, 'Bottom')
)

// Centered content
Box({ justifyContent: 'center', alignItems: 'center', height: 10 },
  Text({}, 'Centered!')
)

// Space between
Box({ justifyContent: 'space-between', width: 40 },
  Text({}, 'Left'),
  Text({}, 'Right')
)
```

## Borders

```typescript
// Basic border
Box({ borderStyle: 'single' },
  Text({}, 'Single border')
)

// Rounded with color
Box({ borderStyle: 'round', borderColor: 'cyan' },
  Text({}, 'Rounded cyan')
)

// All border styles
const styles = ['single', 'double', 'round', 'bold', 'singleDouble', 'doubleSingle', 'classic', 'arrow'];
```

## Spacing

```typescript
// Padding (inside)
Box({ padding: 2 }, Text({}, 'Padded'))
Box({ paddingX: 2, paddingY: 1 }, Text({}, 'Different axes'))
Box({ paddingTop: 1, paddingRight: 2 }, Text({}, 'Specific sides'))

// Margin (outside)
Box({ margin: 1 }, Text({}, 'With margin'))
Box({ marginTop: 2 }, Text({}, 'Top margin only'))
```

## Sizing

```typescript
// Fixed dimensions
Box({ width: 20, height: 5 }, Text({}, 'Fixed size'))

// Min/max constraints
Box({ minWidth: 10, maxWidth: 50 }, Text({}, 'Constrained'))

// Percentage (relative to parent)
Box({ width: '50%' }, Text({}, 'Half width'))

// Flex grow
Box({ flexDirection: 'row' },
  Box({ flexGrow: 1 }, Text({}, 'Grows')),
  Box({ width: 10 }, Text({}, 'Fixed'))
)
```

## Mouse Events

```typescript
Box({
  onClick: () => console.log('Clicked!'),
  onMouseEnter: () => setHover(true),
  onMouseLeave: () => setHover(false),
  onScroll: (delta) => scroll(delta),
  borderStyle: hover() ? 'double' : 'single',
},
  Text({}, 'Interactive box')
)
```

## Props Reference

### Layout Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `flexDirection` | `'row' \| 'column' \| 'row-reverse' \| 'column-reverse'` | `'row'` | Main axis direction |
| `justifyContent` | `'flex-start' \| 'flex-end' \| 'center' \| 'space-between' \| 'space-around' \| 'space-evenly'` | `'flex-start'` | Main axis alignment |
| `alignItems` | `'flex-start' \| 'flex-end' \| 'center' \| 'stretch'` | `'stretch'` | Cross axis alignment |
| `flexWrap` | `'nowrap' \| 'wrap'` | `'nowrap'` | Enable wrapping |
| `flexGrow` | `number` | `0` | Grow factor |
| `flexShrink` | `number` | `1` | Shrink factor |
| `gap` | `number` | `0` | Gap between children |

### Dimension Props

| Prop | Type | Description |
|:-----|:-----|:------------|
| `width` | `number \| string` | Box width |
| `height` | `number \| string` | Box height |
| `minWidth` | `number` | Minimum width |
| `maxWidth` | `number` | Maximum width |
| `minHeight` | `number` | Minimum height |
| `maxHeight` | `number` | Maximum height |

### Spacing Props

| Prop | Type | Description |
|:-----|:-----|:------------|
| `padding` | `number` | All sides padding |
| `paddingX` | `number` | Left and right padding |
| `paddingY` | `number` | Top and bottom padding |
| `paddingTop` | `number` | Top padding |
| `paddingRight` | `number` | Right padding |
| `paddingBottom` | `number` | Bottom padding |
| `paddingLeft` | `number` | Left padding |
| `margin` | `number` | All sides margin |
| `marginX` | `number` | Left and right margin |
| `marginY` | `number` | Top and bottom margin |
| `marginTop` | `number` | Top margin |
| `marginRight` | `number` | Right margin |
| `marginBottom` | `number` | Bottom margin |
| `marginLeft` | `number` | Left margin |

### Border Props

| Prop | Type | Description |
|:-----|:-----|:------------|
| `borderStyle` | `BorderStyle` | Border style |
| `borderColor` | `Color` | Border color |
| `borderTopColor` | `Color` | Top border color |
| `borderRightColor` | `Color` | Right border color |
| `borderBottomColor` | `Color` | Bottom border color |
| `borderLeftColor` | `Color` | Left border color |

### Event Props

| Prop | Type | Description |
|:-----|:-----|:------------|
| `onClick` | `() => void` | Click handler |
| `onMouseEnter` | `() => void` | Mouse enter handler |
| `onMouseLeave` | `() => void` | Mouse leave handler |
| `onScroll` | `(delta: number) => void` | Scroll handler |
| `onFocus` | `() => void` | Focus handler |
| `onBlur` | `() => void` | Blur handler |

## Examples

### Dashboard Panel

```typescript
Box({
  borderStyle: 'round',
  borderColor: 'blue',
  padding: 1,
  flexDirection: 'column',
},
  Text({ color: 'cyan', bold: true }, '📊 Metrics'),
  Box({ marginTop: 1, flexDirection: 'column', gap: 1 },
    Text({}, `CPU: ${cpu()}%`),
    Text({}, `Memory: ${mem()}%`),
    Text({}, `Disk: ${disk()}%`)
  )
)
```

### Split Layout

```typescript
Box({ flexDirection: 'row', height: '100%' },
  Box({ width: 20, borderStyle: 'single' },
    Text({}, 'Sidebar')
  ),
  Box({ flexGrow: 1, padding: 1 },
    Text({}, 'Main Content')
  )
)
```
