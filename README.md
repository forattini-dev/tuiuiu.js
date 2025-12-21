<div align="center">

# 🐦 Tuiuiu

### Terminal UI Framework for the Modern Era

Build beautiful, reactive terminal apps with a familiar component API.
<br>
**Zero dependencies** • **Signals-based** • **Flexbox layout** • **Full mouse support**
<br>
50+ components. Pure Node.js. No C++ bindings.

[![npm version](https://img.shields.io/npm/v/tuiuiu.js.svg?style=flat-square&color=F5A623)](https://www.npmjs.com/package/tuiuiu.js)
[![npm downloads](https://img.shields.io/npm/dm/tuiuiu.js.svg?style=flat-square&color=34C759)](https://www.npmjs.com/package/tuiuiu.js)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/npm/l/tuiuiu.js.svg?style=flat-square&color=007AFF)](https://github.com/forattini-dev/tuiuiu.js/blob/main/LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success?style=flat-square)](https://www.npmjs.com/package/tuiuiu.js)

[📖 Documentation](https://forattini-dev.github.io/tuiuiu.js) · [🚀 Quick Start](#quick-start) · [🎨 Storybook](#storybook)

<img src="docs/assets/demo-hero.gif" alt="Tuiuiu Demo" width="700">

</div>

---

## Quick Start

```bash
npm install tuiuiu.js
```

```typescript
import { render, Box, Text, useState, useInput, useApp } from 'tuiuiu.js';

function Counter() {
  const [count, setCount] = useState(0);
  const { exit } = useApp();

  useInput((char, key) => {
    if (key.upArrow) setCount(c => c + 1);
    if (key.downArrow) setCount(c => c - 1);
    if (key.escape) exit();
  });

  return Box({ flexDirection: 'column', padding: 1, borderStyle: 'round' },
    Text({ color: 'cyan', bold: true }, '🐦 Tuiuiu Counter'),
    Text({ color: 'yellow', marginTop: 1 }, `Count: ${count()}`),
    Text({ color: 'gray', dim: true }, '↑/↓: change • Esc: exit')
  );
}

const { waitUntilExit } = render(Counter);
await waitUntilExit();
```

## What's Inside

| Category | Features |
|:---------|:---------|
| **Core** | Signal-based reactivity, Flexbox layout engine, Focus management, Event system |
| **Primitives** | Box, Text, Spacer, Newline, Fragment, Divider, Canvas |
| **Atoms** | Button, TextInput, Switch, Slider, Spinner, ProgressBar, Timer, Tooltip |
| **Molecules** | Select, MultiSelect, RadioGroup, Autocomplete, Table, Tabs, Tree, Calendar, CodeBlock, Markdown |
| **Organisms** | Modal, CommandPalette, DataTable, FileManager, SplitPanel, ScrollArea, Grid, OverlayStack |
| **Templates** | AppShell, Page, Header, StatusBar, VStack, HStack, Center, FullScreen |
| **Data Viz** | BarChart, LineChart, Sparkline, Heatmap, Gauge, BigText, Digits |
| **DevTools** | Layout Inspector, Event Logger, Performance Metrics, Component Storybook |

## Gallery

<table>
<tr>
<td align="center" width="50%">
<strong>📊 Real-time Dashboard</strong><br>
<img src="docs/assets/demo-dashboard.gif" alt="Dashboard" width="100%">
</td>
<td align="center" width="50%">
<strong>📝 Interactive Forms</strong><br>
<img src="docs/assets/demo-forms.gif" alt="Forms" width="100%">
</td>
</tr>
<tr>
<td align="center">
<strong>📈 Data Visualization</strong><br>
<img src="docs/assets/demo-charts.gif" alt="Charts" width="100%">
</td>
<td align="center">
<strong>💬 Chat Application</strong><br>
<img src="docs/assets/demo-chat.gif" alt="Chat" width="100%">
</td>
</tr>
<tr>
<td align="center">
<strong>🎨 Component Storybook</strong><br>
<img src="docs/assets/demo-storybook.gif" alt="Storybook" width="100%">
</td>
<td align="center">
<strong>⏳ Spinners & Progress</strong><br>
<img src="docs/assets/demo-spinners.gif" alt="Spinners" width="100%">
</td>
</tr>
</table>

## Highlights

### ⚡ Signal-based Reactivity

Fine-grained reactivity without Virtual DOM overhead. Only what changes gets updated.

```typescript
import { createSignal, createEffect } from 'tuiuiu.js';

const [count, setCount] = createSignal(0);
const doubled = () => count() * 2;

createEffect(() => console.log(`Count: ${count()}, Doubled: ${doubled()}`));

setCount(5); // → "Count: 5, Doubled: 10"
```

### 📦 Flexbox Layout

Build complex layouts with the CSS Flexbox model you already know.

```typescript
Box({
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 2,
  padding: 1
},
  Text({ color: 'blue' }, 'Left'),
  Box({ flexGrow: 1 }),
  Text({ color: 'red' }, 'Right')
)
```

### 🎨 50+ Ready-to-Use Components

From simple buttons to complex data tables, everything is included.

```typescript
import { Select, Modal, DataTable, CommandPalette } from 'tuiuiu.js';

// Dropdown select
Select({
  items: [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' },
  ],
  onSelect: (item) => console.log(item)
});

// Command palette (⌘K style)
CommandPalette({
  commands: [
    { id: 'new', label: 'New File', shortcut: 'Ctrl+N' },
    { id: 'open', label: 'Open File', shortcut: 'Ctrl+O' },
  ],
  onSelect: (cmd) => handleCommand(cmd)
});
```

### 🖱️ Full Mouse Support

Click, hover, scroll, drag — all mouse events work out of the box.

```typescript
Box({
  borderStyle: 'round',
  onClick: () => console.log('Clicked!'),
  onMouseEnter: () => setHover(true),
  onMouseLeave: () => setHover(false),
  onScroll: (delta) => scrollBy(delta),
},
  Text({}, hover() ? '🔥 Hovering!' : 'Hover me')
)
```

### 📊 Data Visualization

Render charts and graphs directly in the terminal.

```typescript
import { BarChart, Sparkline, Gauge } from 'tuiuiu.js';

BarChart({
  data: [
    { label: 'Mon', value: 10 },
    { label: 'Tue', value: 25 },
    { label: 'Wed', value: 15 },
  ],
  color: 'cyan',
  showValues: true
});

Sparkline({ data: [1, 5, 2, 8, 3, 9], width: 20, style: 'braille' });

Gauge({ value: 75, max: 100, label: 'CPU', color: 'green' });
```

### 🏗️ Atomic Design + Tree Shaking

Components organized in a clear hierarchy. Import only what you need — unused code is automatically removed from your bundle.

```typescript
// Import everything (convenient for development)
import { Box, Button, Modal } from 'tuiuiu.js';

// Import by layer (optimized bundles)
import { Box, Text } from 'tuiuiu.js/primitives';
import { Button, Spinner } from 'tuiuiu.js/atoms';
import { Select, Table } from 'tuiuiu.js/molecules';
import { Modal, DataTable } from 'tuiuiu.js/organisms';
import { AppShell, Page } from 'tuiuiu.js/templates';

// Core systems
import { createSignal, createEffect } from 'tuiuiu.js/core';
import { useState, useInput, useMouse } from 'tuiuiu.js/hooks';
import { render, renderOnce } from 'tuiuiu.js/app';

// Utilities & extras
import { measureText, getVisibleWidth } from 'tuiuiu.js/utils';
import { BarChart, Gauge } from 'tuiuiu.js/design-system';
```

<details>
<summary>All subpath imports</summary>

| Import | Contents |
|:-------|:---------|
| `tuiuiu.js` | Everything (main entry) |
| `tuiuiu.js/primitives` | Box, Text, Spacer, Fragment, Divider, Canvas |
| `tuiuiu.js/atoms` | Button, TextInput, Switch, Slider, Spinner, ProgressBar, Timer |
| `tuiuiu.js/molecules` | Select, MultiSelect, Table, Tabs, Tree, Calendar, CodeBlock |
| `tuiuiu.js/organisms` | Modal, CommandPalette, DataTable, FileManager, SplitPanel |
| `tuiuiu.js/templates` | AppShell, Page, VStack, HStack, StatusBar |
| `tuiuiu.js/core` | createSignal, createEffect, batch, calculateLayout |
| `tuiuiu.js/hooks` | useState, useEffect, useInput, useMouse, useFocus |
| `tuiuiu.js/app` | render, renderOnce, useApp |
| `tuiuiu.js/utils` | Text measurement, ANSI utilities |
| `tuiuiu.js/design-system` | Full design system (charts, forms, navigation) |
| `tuiuiu.js/storybook` | Component explorer utilities |

</details>

### 🔄 Redux-like Store

Built-in state management for complex applications.

```typescript
import { createStore } from 'tuiuiu.js';

const reducer = (state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 };
    case 'DECREMENT': return { count: state.count - 1 };
    default: return state;
  }
};

const store = createStore(reducer, { count: 0 });

store.subscribe(() => console.log(store.state()));
store.dispatch({ type: 'INCREMENT' });
```

## Storybook

Tuiuiu includes a built-in component storybook for exploring all components:

```bash
# Run the storybook
npx tuiuiu

# Or if installed locally
pnpm storybook
```

Navigate through categories, see live previews, and copy code examples.

## Examples

```bash
# Clone and explore
git clone https://github.com/forattini-dev/tuiuiu.js
cd tuiuiu.js
pnpm install

# Run examples
pnpm example:01  # Basic counter
pnpm example:04  # Forms showcase
pnpm example:06  # Dashboard
pnpm example:chat  # Chat application
```

<details>
<summary>All 20+ examples</summary>

| Example | Description |
|:--------|:------------|
| `01-basic-counter` | useState, useInput basics |
| `02-async-loading` | Async operations with spinners |
| `03-global-state` | Shared state across components |
| `04-forms` | Form inputs and validation |
| `05-multi-component` | Component composition |
| `06-dashboard` | Real-time dashboard layout |
| `07-advanced-forms` | Complex form patterns |
| `08-layout-components` | Flexbox layouts |
| `09-visual-components` | Charts and visualizations |
| `10-theme-context` | Theming system |
| `11-static-logs` | Log viewer pattern |
| `12-animation-system` | Animations and transitions |
| `13-virtual-scroll` | Large list virtualization |
| `14-focus-management` | Focus navigation |
| `15-constraint-layout` | Advanced constraints |
| `16-graphics-braille` | Braille graphics |
| `17-event-system` | Event handling patterns |
| `chat` | Full chat application |
| `realtime-dashboard` | Live updating dashboard |

</details>

## Documentation

| Topic | Link |
|:------|:-----|
| Quick Start | [→ Getting Started](https://forattini-dev.github.io/tuiuiu.js/#/getting-started/quick-start) |
| Components | [→ Component Reference](https://forattini-dev.github.io/tuiuiu.js/#/components/overview) |
| Hooks | [→ Hooks API](https://forattini-dev.github.io/tuiuiu.js/#/hooks/use-input) |
| Signals | [→ Reactive State](https://forattini-dev.github.io/tuiuiu.js/#/core/signals) |
| Layout | [→ Flexbox Guide](https://forattini-dev.github.io/tuiuiu.js/#/core/layout) |
| Theming | [→ Theme System](https://forattini-dev.github.io/tuiuiu.js/#/core/theming) |
| Storybook | [→ Component Explorer](https://forattini-dev.github.io/tuiuiu.js/#/core/storybook) |

## Numbers

| Metric | Value |
|:-------|:------|
| Components | 50+ |
| Dependencies | 0 |
| Subpath Imports | 12 |
| Hooks | 10 |
| Examples | 20+ |
| Border Styles | 9 |
| Named Colors | 18 |
| Tests | 3500+ |
| Tree Shakeable | ✅ |

## Why "Tuiuiu"?

The [Tuiuiu](https://en.wikipedia.org/wiki/Jabiru) (Jabiru mycteria) is a majestic Brazilian bird — the tallest flying bird in South America. Just like this bird stands out in its environment, Tuiuiu stands out in the terminal UI landscape: elegant, powerful, and distinctly Brazilian.

## License

MIT © [Tetis.io](https://tetis.io)
