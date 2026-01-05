# Building Beautiful Headers

This guide teaches you how to create professional headers for your terminal applications using Tuiuiu.js, from simple navbars to complex headers with ASCII logos and live metrics.

## Overview

Headers are the first thing users see. A well-designed header communicates:
- **Brand identity** (logo, colors)
- **Current context** (file, page, mode)
- **Status information** (connection, metrics, time)

## The Header Component

Tuiuiu provides a built-in `Header` component with **two modes**:

### Styled Mode (with `title` prop)

Pre-styled header with theme variants:

```typescript
import { Header } from 'tuiuiu.js';

Header({
  title: 'My App',
  subtitle: 'v1.0.0',
  variant: 'primary',  // 'default' | 'primary' | 'success' | 'warning' | 'danger'
  rightActions: Text({}, '[H]elp  [Q]uit'),
})
```

### Layout Mode (with children)

Flexible layout for custom content:

```typescript
import { Header, header, Title, Caption, Spacer } from 'tuiuiu.js';

// With empty props
Header({},
  Title('Dashboard'),
  Spacer(),
  Caption('v1.0.0')
)

// Shorthand helper (no props needed!)
header(
  Title('Dashboard'),
  Spacer(),
  Caption('v1.0.0')
)
```

**Defaults for Layout Mode:**
- `height: 'auto'` - Sizes to content
- `width: 'fill'` - Fills container width
- `flexDirection: 'row'` - Horizontal layout
- `alignItems: 'center'` - Vertically centered

### Full-Screen Layout with Header

```typescript
import { screen, header, main, footer, Title, Caption, Spacer } from 'tuiuiu.js';

screen(
  header(
    Title('My App'),
    Spacer(),
    Caption('v1.0')
  ),
  main(Content()),
  footer(
    Caption('[Q] Quit'),
    Spacer(),
    Caption('Ready')
  )
)
```

## Basic Header

The simplest header uses a `Box` with horizontal layout:

```typescript
import { Box, Text, Spacer } from 'tuiuiu.js';

function SimpleHeader() {
  return Box(
    {
      flexDirection: 'row',
      borderStyle: 'round',
      borderColor: 'primary',
      paddingX: 1,
    },
    Text({ color: 'primary', bold: true }, '🚀 MyApp'),
    Spacer({}),
    Text({ color: 'muted' }, 'v1.0.0'),
  );
}
```

Result:
```
╭──────────────────────────────────────────╮
│ 🚀 MyApp                          v1.0.0 │
╰──────────────────────────────────────────╯
```

## Headers with Logo (SplitBox)

For headers with ASCII art logos, use `SplitBox` - it creates bordered containers with internal divisions where the divider characters properly connect:

```typescript
import { SplitBox, Box, Text } from 'tuiuiu.js';

function LogoHeader() {
  const logo = Box(
    { flexDirection: 'column' },
    Text({ color: 'cyan', bold: true }, '█▀█ █▀▀ █▄▀'),
    Text({ color: 'cyan', bold: true }, '█▀▄ ██▄ █ █'),
  );

  const info = Box(
    { flexDirection: 'column' },
    Text({ color: 'foreground', bold: true }, 'REK SHELL v1.0'),
    Text({ color: 'muted' }, '📡 https://api.example.com'),
    Text({ color: 'muted' }, '⚡ Jobs: idle'),
  );

  return SplitBox({
    borderStyle: 'round',
    borderColor: 'cyan',
    width: 60,
    sections: [
      { width: 13, content: logo, valign: 'middle' },
      { flexGrow: 1, content: info },
    ],
    paddingX: 1,
  });
}
```

Result:
```
╭─────────────┬──────────────────────────────────────────╮
│ █▀█ █▀▀ █▄▀ │ REK SHELL v1.0                           │
│ █▀▄ ██▄ █ █ │ 📡 https://api.example.com               │
│             │ ⚡ Jobs: idle                             │
╰─────────────┴──────────────────────────────────────────╯
```

### SplitBox Props

| Prop | Type | Description |
|:-----|:-----|:------------|
| `sections` | `SplitBoxSection[]` | Array of sections to render |
| `borderStyle` | `'single' \| 'round' \| 'double' \| 'bold'` | Border style |
| `borderColor` | `string` | Border color |
| `width` | `number` | Total width |
| `paddingX` | `number` | Horizontal padding inside sections |
| `paddingY` | `number` | Vertical padding inside sections |

### Section Props

| Prop | Type | Description |
|:-----|:-----|:------------|
| `width` | `number` | Fixed width |
| `flexGrow` | `number` | Flex grow factor |
| `content` | `VNode` | Content to render |
| `align` | `'left' \| 'center' \| 'right'` | Horizontal alignment |
| `valign` | `'top' \| 'middle' \| 'bottom'` | Vertical alignment |

## Three-Section Headers

For headers with logo, title, and status:

```typescript
function ThreeSectionHeader() {
  const logo = Box(
    { flexDirection: 'column' },
    Text({ color: 'green', bold: true }, '╭─╮'),
    Text({ color: 'green', bold: true }, '│█│'),
    Text({ color: 'green', bold: true }, '╰─╯'),
  );

  const title = Box(
    { flexDirection: 'column' },
    Text({ color: 'green', bold: true }, 'SYSTEM MONITOR'),
    Text({ color: 'muted', dim: true }, 'Real-time metrics'),
  );

  const status = Box(
    { flexDirection: 'column', alignItems: 'flex-end' },
    Text({ color: 'success' }, '● Online'),
    Text({ color: 'muted', dim: true }, '14:32:15'),
  );

  return SplitBox({
    borderStyle: 'round',
    borderColor: 'green',
    width: 50,
    sections: [
      { width: 5, content: logo, valign: 'middle', align: 'center' },
      { flexGrow: 1, content: title, valign: 'middle' },
      { width: 12, content: status, valign: 'middle' },
    ],
    paddingX: 1,
  });
}
```

Result:
```
╭─────┬──────────────────────────┬────────────╮
│ ╭─╮ │ SYSTEM MONITOR           │   ● Online │
│ │█│ │ Real-time metrics        │   14:32:15 │
│ ╰─╯ │                          │            │
╰─────┴──────────────────────────┴────────────╯
```

## Adding Live Metrics

Use `useFps` and other hooks for live data:

```typescript
import { SplitBox, Box, Text, useFps, Spacer } from 'tuiuiu.js';

function LiveHeader() {
  const { fps, color } = useFps();

  const logo = Text({ color: 'primary', bold: true }, '◆');

  const info = Box(
    { flexDirection: 'row' },
    Text({ color: 'foreground', bold: true }, 'MyApp'),
    Spacer({}),
    Text({ color }, `${fps} FPS`),
  );

  return SplitBox({
    borderStyle: 'round',
    sections: [
      { width: 3, content: logo, align: 'center' },
      { flexGrow: 1, content: info },
    ],
    paddingX: 1,
  });
}
```

## ASCII Art Logo Ideas

Here are some logo patterns you can use:

### Block Style
```
█▀█ █▀▀ █▄▀    ▀█▀ █ █ █    █▀▀ █ █ █
█▀▄ ██▄ █ █     █  █ █ █    █▀▀ ▀▄▀ █
                █  ▀▀▀ █    ▀   ▀   ▀
```

### Box Style
```
╔═╗    ┏━┓    ╭─╮    ┌─┐
╠═╣    ┃▶┃    │█│    │▣│
╩ ╩    ┗━┛    ╰─╯    └─┘
```

### Simple Icons
```
◆  ●  ▶  ★  ◈  ⬡  ⬢
```

### Game/Fantasy
```
╔╦╗    ⚔️     🛡️     ⚡
 ║     ╳╳     ╳╳     ╳╳
 ╩     ╳╳     ╳╳     ╳╳
```

## Border Styles

SplitBox supports multiple border styles:

| Style | Characters | Use Case |
|:------|:-----------|:---------|
| `single` | `┌─┬─┐` | Default, clean |
| `round` | `╭─┬─╮` | Modern, friendly |
| `double` | `╔═╦═╗` | Prominent, formal |
| `bold` | `┏━┳━┓` | Strong emphasis |

## Best Practices

### 1. Keep It Scannable
Users should understand the header at a glance:
- Logo/brand on the left
- Main info in the center
- Status/metrics on the right

### 2. Use Semantic Colors
```typescript
Text({ color: 'success' }, '● Online')    // Green for positive
Text({ color: 'warning' }, '● Loading')   // Yellow for caution
Text({ color: 'error' }, '● Error')       // Red for problems
Text({ color: 'muted' }, 'v1.0.0')        // Gray for secondary info
```

### 3. Responsive Width
Use terminal width for full-width headers:
```typescript
const termWidth = process.stdout.columns || 80;

SplitBox({
  width: termWidth,
  sections: [...],
});
```

### 4. Vertical Alignment
For multi-line logos, use `valign: 'middle'` to center content vertically:
```typescript
{ width: 10, content: logo, valign: 'middle' }
```

## Complete Example

Here's a complete dashboard header:

```typescript
import { SplitBox, Box, Text, Spacer, useFps } from 'tuiuiu.js';

function DashboardHeader() {
  const { fps, color } = useFps();
  const now = new Date().toLocaleTimeString();

  const logo = Box(
    { flexDirection: 'column' },
    Text({ color: 'primary', bold: true }, '┌─┐'),
    Text({ color: 'primary', bold: true }, '│▣│'),
    Text({ color: 'primary', bold: true }, '└─┘'),
  );

  const title = Box(
    { flexDirection: 'column' },
    Box(
      { flexDirection: 'row' },
      Text({ color: 'primary', bold: true }, 'Dashboard'),
      Text({ color: 'muted' }, ' v2.0'),
    ),
    Text({ color: 'muted', dim: true }, 'Analytics & Monitoring'),
  );

  const metrics = Box(
    { flexDirection: 'column', alignItems: 'flex-end' },
    Box(
      { flexDirection: 'row', gap: 1 },
      Text({ color: 'success' }, '●'),
      Text({}, 'Connected'),
    ),
    Text({ color }, `${fps} FPS`),
    Text({ color: 'muted', dim: true }, now),
  );

  return SplitBox({
    borderStyle: 'round',
    borderColor: 'primary',
    sections: [
      { width: 5, content: logo, valign: 'middle', align: 'center' },
      { flexGrow: 1, content: title, valign: 'middle' },
      { width: 14, content: metrics },
    ],
    paddingX: 1,
  });
}
```

## See Also

- [SplitBox API](/API.md#splitbox) - Full API reference
- [Theming](/core/theming.md) - Color and theme customization
- [useFps Hook](/hooks/use-fps.md) - Performance monitoring
- [Storybook](/core/storybook.md) - Interactive examples
