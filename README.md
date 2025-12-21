<div align="center">

# 🐦 Tuiuiu

### The Modern Terminal UI Framework

**Zero-dependency** • **Signal-based Reactivity** • **Flexbox Layout** • **Vite-powered**

Build complex, reactive, and beautiful terminal applications with a React-like API.
<br>
Pure Node.js. No C++ bindings. No transpilation required.

[![npm version](https://img.shields.io/npm/v/tuiuiu.svg?style=flat-square&color=F5A623)](https://www.npmjs.com/package/tuiuiu)
[![License](https://img.shields.io/npm/l/tuiuiu.svg?style=flat-square&color=007AFF)](https://github.com/tetis-io/tuiuiu/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)

[📖 Documentation](docs/README.md) · [🚀 Quick Start](#quick-start) · [📦 Components](#component-library)

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

  useInput((input, key) => {
    if (key.upArrow) setCount(c => c + 1);
    if (key.downArrow) setCount(c => c - 1);
    if (key.escape) useApp().exit();
  });

  return Box({ flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'cyan' },
    Text({ color: 'green', bold: true }, ' 🐦 Tuiuiu Counter '),
    Box({ marginTop: 1 },
      Text({}, 'Current Count: '),
      Text({ color: 'yellow' }, `${count()}`)
    ),
    Text({ color: 'gray', dim: true, marginTop: 1 }, '↑/↓ to change, Esc to exit')
  );
}

const { waitUntilExit } = render(Counter);
await waitUntilExit();
```

## What's Inside

| Category | Features |
|:---------|:---------|
| **Core** | Signal-based reactivity, Flexbox engine (Yoga-like), Event System, Focus Management |
| **Components** | 50+ built-in components: Box, Text, Modal, Table, Tabs, Grid, SplitPanel... |
| **Forms** | TextInput, Select, MultiSelect, Checkbox, Radio, Slider, Autocomplete |
| **Data Viz** | BarChart, LineChart, Sparkline, Heatmap, Gauge, ContributionGraph |
| **Theming** | CSS-like styling, Dark/Light modes, Custom themes, High Contrast |
| **DevTools** | Layout Inspector, Event Log, Performance Metrics, Terminal Simulator |

## Highlights

### ⚡ Signal-based Reactivity
Fine-grained reactivity without the VDOM overhead. Updates are precise and efficient.

```typescript
import { createSignal, createEffect } from 'tuiuiu.js';

const [count, setCount] = createSignal(0);
const doubled = () => count() * 2;

createEffect(() => {
  console.log(`Count: ${count()}, Doubled: ${doubled()}`);
});

setCount(5); // Logs: "Count: 5, Doubled: 10"
```

### 📦 Flexbox Layout
Build complex layouts using familiar Flexbox properties.

```typescript
Box({ 
  flexDirection: 'row', 
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 1 
},
  Text({ color: 'blue' }, 'Left'),
  Text({ color: 'red' }, 'Right')
)
```

### 🎨 Rich Forms
Interactive form components with full keyboard support and validation.

```typescript
import { Select, TextInput, Box } from 'tuiuiu.js';

Box({ flexDirection: 'column', gap: 1 },
  TextInput({ 
    placeholder: 'Enter your name...',
    onSubmit: (name) => console.log(name)
  }),
  Select({
    items: [
      { label: 'Option A', value: 'a' },
      { label: 'Option B', value: 'b' }
    ],
    onSelect: (item) => console.log(item)
  })
)
```

### 📊 Data Visualization
Render beautiful charts and graphs directly in the terminal.

```typescript
import { BarChart, Sparkline } from 'tuiuiu.js';

BarChart({
  data: [
    { label: 'Mon', value: 10 },
    { label: 'Tue', value: 25 },
    { label: 'Wed', value: 15 }
  ],
  color: 'cyan'
});

Sparkline({ 
  data: [1, 5, 2, 8, 3, 9], 
  width: 20, 
  style: 'braille' 
});
```

### 🖱️ Full Mouse Support
Interact with components using standard mouse events (click, hover, scroll).

```typescript
Box({
  borderStyle: 'round',
  onClick: () => console.log('Clicked!'),
  onMouseEnter: () => setHover(true),
  onMouseLeave: () => setHover(false),
  // Supports hovering, scrolling, right-click context menus, etc.
}, 
  Text({}, 'Hover or Click Me')
)
```

## Documentation

Visit the [Documentation](docs/README.md) to explore the full API, guides, and examples.

- [Getting Started](docs/getting-started/quick-start.md)
- [Component Reference](docs/components/overview.md)
- [Hooks & Signals](docs/hooks/index.md)
- [Theming System](docs/core/theming.md)

## License

MIT © [Tetis.io](https://tetis.io)