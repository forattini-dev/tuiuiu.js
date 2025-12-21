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

Center({ width: 40, height: 10, children: Spinner() })
```

## Grid

CSS Grid-like layout system.

### Usage

```typescript
import { Grid } from 'tuiuiu.js';

// Simple columns
Grid({ columns: 3, gap: 1 },
  Item1(), Item2(), Item3()
)

// Advanced template
Grid({
  templateColumns: [10, '1fr', '2fr'], // Fixed, Flexible, Double-Flex
  gap: 1,
  children: [...]
})
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

## ScrollArea

Scrollable container with scrollbar.

```typescript
import { ScrollArea } from 'tuiuiu.js';

ScrollArea({
  height: 10,
  content: logLines // Array of strings or VNodes
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