# Tuiuiu <small>🐦</small>

> Zero-dependency Terminal UI library with great UX

**Tuiuiu** is a modern, reactive library for building terminal user interfaces in Node.js. It brings the component-based architecture and reactive state management (Signals) you love from the web to the terminal.

## Key Features

- **⚛️ React-like Components**: Build UI with functional components and hooks.
- **⚡ Signals-based State**: Fine-grained reactivity for high performance.
- **🎨 Flexbox Layout**: Powerful layout system powered by Yoga (or similar principles).
- **📦 Zero Dependencies**: Lightweight and easy to bundle.
- **🎮 Interactive**: Built-in handling for keyboard and mouse events.

## Why Tuiuiu?

Building terminal apps should be as easy as building web apps. Tuiuiu provides a familiar DX for React developers while optimized for the constraints of the terminal.

```typescript
import { render, Box, Text, createSignal } from 'tuiuiu.js';

function Counter() {
  const [count, setCount] = createSignal(0);

  return Box({ borderStyle: 'round', padding: 1 },
    Text({}, `Count: ${count()}`),
    // Button concept (hypothetical, usually handled via keybindings)
    Text({ color: 'green' }, ' (Press Up/Down to change)')
  );
}

render(Counter);
```

## Next Steps

- [Installation](/getting-started/installation.md)
- [Quick Start](/getting-started/quick-start.md)
- [Explore Components](/components/overview.md)
