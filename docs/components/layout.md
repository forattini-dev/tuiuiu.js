# Layout Components

Expanded layout components for building complex application structures.

## Stack Layouts

Composable primitives for arranging content.

### `VStack`
Vertical stack with spacing.

```typescript
import { VStack } from 'tuiuiu.js';

VStack({ gap: 1 },
  Header(),
  Content(),
  Footer()
)
```

### `HStack`
Horizontal stack with spacing and alignment.

```typescript
import { HStack } from 'tuiuiu.js';

HStack({ gap: 2, align: 'center' },
  Icon(),
  Label(),
  Badge()
)
```

### `Center`
Centers content horizontally and/or vertically.

```typescript
import { Center } from 'tuiuiu.js';

Center({ width: 40, height: 10 }, Spinner())
```

## Sizing Tokens

Tuiuiu provides two special sizing tokens for `width` and `height` props:

| Token | Behavior | Use Case |
|:------|:---------|:---------|
| `'auto'` | Size to content | Headers, footers, buttons |
| `'fill'` | Expand to fill remaining space | Main content, sidebars |

```typescript
// 'auto' - sizes to content
Header({ height: 'auto' }, Title('App'))  // Height = 1 line

// 'fill' - expands to fill remaining space
Main({ height: 'fill' }, Content())  // Takes all remaining height
```

These tokens eliminate manual height calculations:

```typescript
// ❌ Before: manual math
Box({ height: termHeight - headerHeight - footerHeight }, Content())

// ✅ After: semantic sizing
screen(
  header(Title('App')),     // height: 'auto' (1 line)
  main(Content()),          // height: 'fill' (remaining space)
  footer(Status())          // height: 'auto' (1 line)
)
```

## Terminal Layout Primitives

High-level helpers for full-screen terminal layouts. These components default to sensible sizing and let you use `'fill'`/`'auto'` tokens instead of manual height math.

### Screen / Header / Main / Footer

```typescript
import { Box, Screen, Header, Main, Footer, Sidebar, Panel, Title, Caption, Spacer, Text } from 'tuiuiu.js';

Screen({},
  Header({ backgroundColor: 'muted', width: 'fill', paddingX: 1 },
    Title('System Dashboard', { color: 'foreground' }),
    Spacer(),
    Caption('v2.1.0')
  ),
  Main({ gap: 1, padding: 1 },
    Box({ flexDirection: 'row', gap: 1, height: 'fill' },
      Sidebar({ width: 24 }, Nav()),
      Panel({ title: 'Overview', flexGrow: 1 }, Stats())
    )
  ),
  Footer({ backgroundColor: 'muted', width: 'fill', paddingX: 1 },
    Text({ color: 'mutedForeground' }, '[Q] Quit'),
    Spacer(),
    Text({ color: 'mutedForeground' }, 'Ready')
  )
)
```

### `Panel` + `Sidebar`

```typescript
import { Box, Sidebar, Panel } from 'tuiuiu.js';

Box({ flexDirection: 'row', height: 'fill' },
  Sidebar({ width: 22 }, Nav()),
  Panel({ title: 'Details', flexGrow: 1 }, Details())
)
```

### Shorthand Helpers

For cleaner code when you don't need custom props, use the lowercase shorthand helpers:

```typescript
import { screen, header, main, footer, sidebar } from 'tuiuiu.js';

// Clean syntax without empty props
screen(
  header(Title('Dashboard'), Spacer(), Caption('v1.0')),
  main(Content()),
  footer(Text({}, '[Q] Quit'), Spacer(), Text({}, 'Ready'))
)

// Equivalent to:
Screen({},
  Header({}, Title('Dashboard'), Spacer(), Caption('v1.0')),
  Main({}, Content()),
  Footer({}, Text({}, '[Q] Quit'), Spacer(), Text({}, 'Ready'))
)
```

| Component | Shorthand | Default Props |
|:----------|:----------|:--------------|
| `Screen(props, ...children)` | `screen(...children)` | Terminal width/height, column layout |
| `Header(props, ...children)` | `header(...children)` | Row layout, auto height, fill width |
| `Main(props, ...children)` | `main(...children)` | Fill height, column layout |
| `Footer(props, ...children)` | `footer(...children)` | Auto height, row layout |
| `Sidebar(props, ...children)` | `sidebar(...children)` | Auto width, fill height |

## Grid

Grid-inspired terminal layout system.

### Usage

```typescript
import { Grid } from 'tuiuiu.js';

// Simple columns
Grid({ columns: 3, gap: 1 },
  Item1(), Item2(), Item3()
)

// Advanced template
Grid({
  columns: [10, '1fr', '2fr'], // Fixed, Flexible, Double-Flex
  gap: 1,
}, ...items)
```

## Tabs

Tabbed interface for switching views.

### Usage

```typescript
import { Tabs } from 'tuiuiu.js';

Tabs({
  tabs: [
    { key: 'home', label: 'Home', content: HomeView() },
    { key: 'settings', label: 'Settings', content: SettingsView() }
  ],
  style: 'pills',
  activeColor: 'cyan'
})
```

## Collapsible & Accordion

Expandable sections.

```typescript
import { Collapsible, Accordion } from 'tuiuiu.js';

// Single
Collapsible({
  title: 'Details',
  children: DetailedContent()
})

// Multiple (Accordion)
Accordion({
  sections: [
    { key: 'a', title: 'Section A', content: ContentA() },
    { key: 'b', title: 'Section B', content: ContentB() }
  ]
})
```

## Scroll Components

For comprehensive scrolling capabilities, see the dedicated [Scroll documentation](/components/scroll.md).

Tuiuiu provides multiple scroll APIs:

| Component | Use Case |
|:----------|:---------|
| `Scroll` | Universal wrapper for any content |
| `ScrollList` | Item lists with auto-height |
| `ChatList` | Chat/messaging (inverted) |

```typescript
import { Scroll, ScrollList, ChatList, useScrollList } from 'tuiuiu.js'

// Wrap any content
Scroll({ height: 10 }, Text({}, longText))

// Item lists with auto-height
ScrollList({
  items: files,
  children: (file) => FileRow({ file }),
  height: 20,
})

// Chat with inverted scroll
ChatList({
  items: messages(),
  children: (msg) => ChatBubble({ message: msg }),
  height: 20,
})
```

## App Layouts

High-level structures for full applications.

### `AppShell`
Standard app layout with Header, Sidebar, Content, and Footer.

```typescript
import { AppShell } from 'tuiuiu.js';

AppShell({
  header: MyHeader(),
  sidebar: MySidebar(),
  footer: MyStatusBar(),
  children: MyMainContent()
})
```

### `Page`
Single page layout with header/footer.

```typescript
import { Page } from 'tuiuiu.js';

Page({
  title: 'Settings',
  subtitle: 'Preferences',
  children: Form()
})
```
