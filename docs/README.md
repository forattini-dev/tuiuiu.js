# Tuiuiu 🐦

> Zero-dependency Terminal UI library for Node.js

?> **Tip:** Want to see components in action? Try our **Storybook**! Just run `npx tuiuiu` in your terminal to explore components interactively.

**Tuiuiu** is a modern, reactive library for building terminal user interfaces. It brings the component-based architecture and Signal-based reactivity you love from the web to the terminal.

## Why Tuiuiu?

| Feature | Benefit |
|:--------|:--------|
| **⚡ Signal Reactivity** | Fine-grained updates without Virtual DOM overhead |
| **📦 Zero Dependencies** | Lightweight, secure, easy to audit |
| **🎨 50+ Components** | Everything from buttons to data tables |
| **🖱️ Mouse Support** | Click, hover, scroll — all work natively |
| **📐 Flexbox Layout** | Use the CSS model you already know |
| **🎭 Theming** | Dark/light modes, custom themes |

## Quick Example

```typescript
import { render, Box, Text, useState, useInput, useApp } from 'tuiuiu.js';

function App() {
  const [count, setCount] = useState(0);
  const { exit } = useApp();

  useInput((char, key) => {
    if (key.upArrow) setCount(c => c + 1);
    if (key.downArrow) setCount(c => c - 1);
    if (key.escape) exit();
  });

  return Box({ padding: 1, borderStyle: 'round', borderColor: 'cyan' },
    Text({ color: 'green', bold: true }, '🐦 Tuiuiu'),
    Text({ marginTop: 1 }, `Count: ${count()}`),
    Text({ color: 'gray', dim: true }, '↑/↓ change • Esc exit')
  );
}

render(App);
```

## Architecture

Tuiuiu follows **Atomic Design** principles:

```
Templates    → Page layouts (AppShell, Page)
    ↑
Organisms    → Complex widgets (Modal, DataTable)
    ↑
Molecules    → Composed components (Select, Table)
    ↑
Atoms        → Simple units (Button, Spinner)
    ↑
Primitives   → Foundation (Box, Text, Signal)
```

### Tree Shaking & Subpath Imports

Tuiuiu is fully tree-shakeable. Import only what you need:

```typescript
// Import everything (convenient)
import { Box, Text, Button, Modal } from 'tuiuiu.js';

// Import by layer (optimized)
import { Box, Text } from 'tuiuiu.js/primitives';
import { Button, Spinner } from 'tuiuiu.js/atoms';
import { Select, Table } from 'tuiuiu.js/molecules';
import { Modal, DataTable } from 'tuiuiu.js/organisms';
import { AppShell, Page } from 'tuiuiu.js/templates';

// Core & utilities
import { createSignal } from 'tuiuiu.js/core';
import { useState, useInput } from 'tuiuiu.js/hooks';
import { render } from 'tuiuiu.js/app';
import { BarChart } from 'tuiuiu.js/design-system';
```

## What's Included

### Primitives
`Box` `Text` `Spacer` `Newline` `Fragment` `Divider` `Canvas`

### Atoms
`Button` `TextInput` `Switch` `Slider` `Spinner` `ProgressBar` `Timer` `Tooltip` `Badge`

### Molecules
`Select` `MultiSelect` `RadioGroup` `Autocomplete` `Table` `Tabs` `Tree` `Calendar` `CodeBlock` `Markdown` `Collapsible`

### Organisms
`Modal` `CommandPalette` `DataTable` `FileManager` `SplitPanel` `ScrollArea` `Grid` `OverlayStack`

### Templates
`AppShell` `Page` `Header` `StatusBar` `VStack` `HStack` `Center` `FullScreen`

### Data Visualization
`BarChart` `LineChart` `Sparkline` `Gauge` `Heatmap` `BigText` `Digits`

## Next Steps

<div class="grid-3">
  <a href="#/getting-started/installation" class="card">
    <h4>📦 Installation</h4>
    <p>Get Tuiuiu installed in your project</p>
  </a>
  <a href="#/getting-started/quick-start" class="card">
    <h4>🚀 Quick Start</h4>
    <p>Build your first terminal app</p>
  </a>
  <a href="#/core/signals" class="card">
    <h4>⚡ Signals</h4>
    <p>Learn the reactivity system</p>
  </a>
</div>

## Storybook

Explore all components interactively:

```bash
npx tuiuiu
```

## Community

- [GitHub](https://github.com/forattini-dev/tuiuiu.js) — Star us!
- [Issues](https://github.com/forattini-dev/tuiuiu.js/issues) — Report bugs
- [Discussions](https://github.com/forattini-dev/tuiuiu.js/discussions) — Ask questions
