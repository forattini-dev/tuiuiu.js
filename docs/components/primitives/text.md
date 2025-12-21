# Text

Render styled text content with colors, formatting, and text manipulation.

## Basic Usage

```typescript
import { Text } from 'tuiuiu.js';

Text({}, 'Hello, World!')
Text({ color: 'cyan' }, 'Cyan text')
Text({ bold: true }, 'Bold text')
```

## Colors

### Named Colors

```typescript
// Standard colors
Text({ color: 'red' }, 'Red')
Text({ color: 'green' }, 'Green')
Text({ color: 'blue' }, 'Blue')
Text({ color: 'yellow' }, 'Yellow')
Text({ color: 'magenta' }, 'Magenta')
Text({ color: 'cyan' }, 'Cyan')
Text({ color: 'white' }, 'White')
Text({ color: 'gray' }, 'Gray')

// Bright variants
Text({ color: 'redBright' }, 'Bright Red')
Text({ color: 'greenBright' }, 'Bright Green')
// ... etc
```

### Hex & RGB Colors

```typescript
Text({ color: '#ff6b6b' }, 'Coral')
Text({ color: '#4ecdc4' }, 'Teal')
Text({ color: 'rgb(255, 107, 107)' }, 'RGB Coral')
```

### Background Colors

```typescript
Text({ backgroundColor: 'blue' }, 'Blue background')
Text({ color: 'white', backgroundColor: 'red' }, 'White on red')
Text({ backgroundColor: '#333' }, 'Dark background')
```

## Text Styles

```typescript
Text({ bold: true }, 'Bold')
Text({ dim: true }, 'Dimmed')
Text({ italic: true }, 'Italic')
Text({ underline: true }, 'Underlined')
Text({ strikethrough: true }, 'Strikethrough')
Text({ inverse: true }, 'Inverted')

// Combine styles
Text({ bold: true, underline: true, color: 'cyan' }, 'Bold underlined cyan')
```

## Text Wrapping

```typescript
// Wrap text at container width
Text({ wrap: 'wrap' }, 'Long text that will wrap to multiple lines when needed...')

// Truncate with ellipsis
Text({ wrap: 'truncate' }, 'Long text that will be truncated with...')

// Truncate at start
Text({ wrap: 'truncate-start' }, '...truncated at the start')

// Truncate in middle
Text({ wrap: 'truncate-middle' }, 'Long te...iddle')

// No wrapping (default)
Text({ wrap: 'nowrap' }, 'Text on single line')
```

## Props Reference

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `color` | `Color` | - | Text color |
| `backgroundColor` | `Color` | - | Background color |
| `bold` | `boolean` | `false` | Bold text |
| `dim` | `boolean` | `false` | Dimmed text |
| `italic` | `boolean` | `false` | Italic text |
| `underline` | `boolean` | `false` | Underlined text |
| `strikethrough` | `boolean` | `false` | Strikethrough text |
| `inverse` | `boolean` | `false` | Swap foreground/background |
| `wrap` | `'wrap' \| 'truncate' \| 'truncate-start' \| 'truncate-middle' \| 'nowrap'` | `'nowrap'` | Text wrapping mode |

## Color Reference

### Standard Colors
`black` `red` `green` `yellow` `blue` `magenta` `cyan` `white` `gray`

### Bright Colors
`blackBright` `redBright` `greenBright` `yellowBright` `blueBright` `magentaBright` `cyanBright` `whiteBright`

## Examples

### Status Indicator

```typescript
function Status({ status }: { status: 'ok' | 'warning' | 'error' }) {
  const colors = { ok: 'green', warning: 'yellow', error: 'red' };
  const icons = { ok: '✓', warning: '⚠', error: '✗' };

  return Text({ color: colors[status], bold: true },
    `${icons[status]} ${status.toUpperCase()}`
  );
}
```

### Code Output

```typescript
Box({ padding: 1, backgroundColor: '#1e1e1e' },
  Text({ color: '#569cd6' }, 'const '),
  Text({ color: '#4ec9b0' }, 'message'),
  Text({ color: 'white' }, ' = '),
  Text({ color: '#ce9178' }, '"Hello"'),
  Text({ color: 'white' }, ';')
)
```
