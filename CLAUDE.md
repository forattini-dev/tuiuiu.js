<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Tuiuiu** is a zero-dependency Terminal UI library for Node.js. It provides a React-like experience for building interactive terminal applications without any external dependencies.

### Key Principles

- **Zero external dependencies** - Everything is implemented from scratch (only Node.js built-ins)
- **Signal-based reactivity** - Fine-grained, auto-tracking dependency system
- **Flexbox layout** - Full flexbox layout engine for terminals
- **Atomic Design** - Component hierarchy: Primitives → Atoms → Molecules → Organisms → Templates
- **Excellent test coverage** - 79 test files, 3500+ tests

## Development Commands

```bash
# Install dependencies
pnpm install

# Type check
pnpm typecheck

# Build
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Run storybook (component explorer)
pnpm storybook

# Run examples
pnpm example examples/01-basic-counter.ts
```

## Architecture

Tuiuiu follows **Atomic Design** principles with a clear component hierarchy:

```
src/
├── primitives/            # Foundation layer (lowest level)
│   ├── signal.ts          # createSignal, createEffect, batch, createMemo
│   ├── context.ts         # Context API (createContext, useContext)
│   ├── store.ts           # State management (createStore, applyMiddleware)
│   ├── nodes.ts           # Box, Text, Spacer, Newline, Fragment
│   ├── canvas.ts          # Canvas-based drawing
│   ├── divider.ts         # Divider component
│   └── index.ts
│
├── atoms/                 # Smallest functional UI units
│   ├── button.ts          # Clickable buttons
│   ├── spinner.ts         # Loading spinners (12+ styles)
│   ├── progress-bar.ts    # Progress indicators
│   ├── timer.ts           # Countdown/stopwatch timers
│   ├── text-input.ts      # Text input field
│   ├── switch.ts          # Toggle switches
│   ├── slider.ts          # Range sliders
│   ├── tooltip.ts         # Tooltips, Tags, Badges
│   └── index.ts
│
├── molecules/             # Composed atoms
│   ├── select.ts          # Dropdown selection
│   ├── multi-select.ts    # Multiple selection
│   ├── radio-group.ts     # Radio button groups
│   ├── autocomplete.ts    # Autocomplete input
│   ├── table.ts           # Basic tables
│   ├── code-block.ts      # Syntax highlighted code
│   ├── markdown.ts        # Markdown renderer
│   ├── tree.ts            # Tree view
│   ├── calendar.ts        # Calendar picker
│   ├── tabs.ts            # Tab navigation
│   ├── collapsible.ts     # Collapsible sections
│   └── data-viz/          # Data visualization
│       ├── sparkline.ts   # Inline charts
│       ├── bar-chart.ts   # Bar charts
│       ├── line-chart.ts  # Line charts
│       ├── gauge.ts       # Gauge displays
│       └── heatmap.ts     # Heatmap displays
│
├── organisms/             # Complex self-contained units
│   ├── modal.ts           # Modal dialogs
│   ├── command-palette.ts # Command palette (⌘K style)
│   ├── data-table.ts      # Full-featured data tables
│   ├── file-browser.ts    # File explorer
│   ├── split-panel.ts     # Resizable split views
│   ├── scroll-area.ts     # Scrollable containers
│   ├── grid.ts            # Advanced grid layouts
│   └── overlay-stack.ts   # Overlay management
│
├── templates/             # Page-level layouts
│   ├── stack.ts           # VStack, HStack, Center, FullScreen
│   └── app.ts             # Page, AppShell, StatusBar, Header
│
├── design-system/         # Alternative organization by function
│   ├── core/              # Layout & renderer
│   ├── forms/             # Form controls
│   ├── feedback/          # Spinners, progress, badges, timers
│   ├── data-display/      # Tables, code, markdown, tree
│   ├── layout/            # Grid, tabs, scroll, split-panel
│   ├── overlays/          # Modal, command-palette
│   ├── navigation/        # File manager
│   ├── visual/            # BigText, digits, tooltips
│   └── media/             # Picture component
│
├── core/                  # Framework internals
│   ├── signal.ts          # Core reactive signals
│   ├── layout.ts          # Flexbox layout engine
│   ├── renderer.ts        # VNode → ANSI string conversion
│   ├── delta-render.ts    # Optimized diff-based rendering
│   ├── buffer.ts          # Cell buffer & double-buffering
│   ├── theme.ts           # Theme system (dark/light/high-contrast)
│   ├── colors.ts          # Color palette (22 colors × 11 shades)
│   ├── animation.ts       # Animation & spring physics
│   ├── tick.ts            # Global tick system for animations
│   ├── focus.ts           # Focus management
│   ├── input.ts           # Input parsing
│   ├── keybindings.ts     # Keyboard shortcuts
│   ├── hit-test.ts        # Mouse hit testing
│   ├── virtual-scroll.ts  # Virtual scrolling
│   ├── events.ts          # Event system
│   ├── router.ts          # Routing
│   ├── error-boundary.ts  # Error handling with stack traces
│   ├── capabilities.ts    # Terminal capabilities detection
│   ├── graphics.ts        # Sixel, Kitty, iTerm2 graphics
│   ├── highlighter.ts     # Syntax highlighting
│   └── visualization.ts   # Visualization utilities
│
├── hooks/                 # React-like hooks
│   ├── use-state.ts       # useState
│   ├── use-effect.ts      # useEffect
│   ├── use-input.ts       # useInput (keyboard handling)
│   ├── use-focus.ts       # useFocus
│   ├── use-mouse.ts       # useMouse
│   ├── use-app.ts         # useApp (app lifecycle)
│   ├── use-navigation.ts  # Linked list navigation
│   ├── use-terminal-size.ts # Terminal dimensions
│   └── focus-context.ts   # Focus context
│
├── styling/               # CSS-like styling system
│   ├── parser.ts          # Style parser
│   ├── tokenizer.ts       # Style tokenizer
│   └── resolver.ts        # Style resolver
│
├── storybook/             # Component explorer
│   ├── app.ts             # Storybook application
│   ├── cli.ts             # CLI entry point
│   ├── stories/           # Component stories
│   │   ├── atoms/         # Atom stories
│   │   ├── molecules/     # Molecule stories
│   │   ├── organisms/     # Organism stories
│   │   └── apps/          # Full app demos
│   └── components/        # Storybook UI components
│
├── dev-tools/             # Development utilities
│   ├── debugger.ts        # Debug overlay
│   ├── mouse-simulator.ts # Mouse event simulation
│   └── testing.ts         # Test utilities
│
├── app/                   # Application layer
│   └── render-loop.ts     # Main render loop
│
├── utils/                 # Utilities
│   ├── types.ts           # VNode, BoxStyle, TextStyle types
│   ├── text-utils.ts      # ANSI-aware text: width, wrap, truncate
│   ├── cursor.ts          # Cursor control
│   ├── log-update.ts      # Incremental terminal updates
│   ├── batcher.ts         # Batching utilities
│   └── fs-storage.ts      # File system storage
│
└── index.ts               # Main entry point
```

### Component Hierarchy

```
Templates    → Page layouts (AppShell, Page, StatusBar)
    ↑
Organisms    → Complex widgets (Modal, DataTable, CommandPalette)
    ↑
Molecules    → Composed components (Select, Table, CodeBlock)
    ↑
Atoms        → Simple units (Button, Spinner, Badge, TextInput)
    ↑
Primitives   → Foundation (Box, Text, Signal, Context, Store)
```

### Subpath Imports

```typescript
// Import everything
import { Box, Text, Button, Modal } from 'tuiuiu.js'

// Import specific layers
import { Box, Text, createSignal } from 'tuiuiu.js/primitives'
import { Button, Spinner } from 'tuiuiu.js/atoms'
import { Select, Table } from 'tuiuiu.js/molecules'
import { Modal, DataTable } from 'tuiuiu.js/organisms'
import { AppShell, Page } from 'tuiuiu.js/templates'
import { render, renderOnce } from 'tuiuiu.js/app'
import { createDeltaRenderer } from 'tuiuiu.js/core'
import { useState, useInput } from 'tuiuiu.js/hooks'
```

## Key Concepts

### 1. Signals (Reactive Primitives)

```typescript
import { createSignal, createEffect, batch, createMemo } from 'tuiuiu.js'

const [count, setCount] = createSignal(0)
const doubled = createMemo(() => count() * 2)

createEffect(() => console.log('Count:', count(), 'Doubled:', doubled()))

batch(() => {
  setCount(1)
  setCount(2)  // Effect runs once after batch
})
```

### 2. Components (No JSX)

```typescript
import { Box, Text, When, Each } from 'tuiuiu.js'

// Components are functions that return VNodes
Box({ flexDirection: 'column', padding: 1 },
  Text({ color: 'cyan', bold: true }, 'Title'),
  When(isLoading, () => Spinner({ style: 'dots' })),
  Each(items, (item) => Text({}, item.name))
)
```

### 3. Hooks

```typescript
import { useState, useEffect, useInput, useApp, useFocus } from 'tuiuiu.js'

function Counter() {
  const [count, setCount] = useState(0)
  const { isFocused } = useFocus()

  useInput((input, key) => {
    if (key.upArrow) setCount(c => c + 1)
    if (key.escape) useApp().exit()
  })

  return Text({ color: isFocused ? 'cyan' : 'gray' }, `Count: ${count()}`)
}
```

### 4. Store (State Management)

```typescript
import { createStore } from 'tuiuiu.js/primitives'

const store = createStore((state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 }
    default: return state
  }
})

store.dispatch({ type: 'INCREMENT' })
console.log(store.getState().count) // 1
```

### 5. Rendering

```typescript
import { render, renderOnce } from 'tuiuiu.js'

// Interactive app
const { waitUntilExit, rerender } = render(App)
await waitUntilExit()

// One-shot render (no interactivity)
const output = renderOnce(MyComponent())
console.log(output)
```

### 6. Theming

```typescript
import { setTheme, getTheme, darkTheme, lightTheme } from 'tuiuiu.js'

setTheme(darkTheme)  // or lightTheme, highContrastDarkTheme, monochromeTheme

// Theme colors
const theme = getTheme()
Text({ color: theme.colors.primary }, 'Primary colored text')

// Semantic colors
Text({ color: 'primary' }, 'Uses theme primary')
Text({ color: 'destructive' }, 'Uses theme destructive')
Text({ color: 'mutedForeground' }, 'Muted text')
```

### 7. Animations

```typescript
import { createSpring, createHarmonicaSpring, easingFunctions } from 'tuiuiu.js'

// Spring animation
const spring = createSpring({ stiffness: 150, damping: 15 })
spring.start(0, 100, (value) => setPosition(value))

// Harmonica spring (frequency/damping model)
const harmonica = createHarmonicaSpring({ frequency: 7, damping: 0.75 })
harmonica.start(0, 100, (value) => setOffset(value))
```

## Testing

Tests are in `tests/` directory. We use Vitest with happy-dom.

```bash
# Run all tests (79 files, 3500+ tests)
pnpm test

# Run specific test
pnpm test tests/core/signal.test.ts

# Watch mode
pnpm test:watch

# Coverage
pnpm test:coverage
```

Test structure:
```
tests/
├── core/              # Signal, layout, renderer, theme tests
├── primitives/        # Context, nodes, store tests
├── hooks/             # Hook behavior tests
├── components/        # Static component tests
├── forms/             # Form component tests (button, select, etc.)
├── layout/            # Layout tests (scroll, tabs, fullwidth)
├── overlays/          # Modal, command-palette tests
├── design-system/     # Design system tests
├── dev-tools/         # Debugger, mouse simulator tests
├── styling/           # Style parser tests
├── integration/       # Integration tests
├── benchmarks/        # Performance benchmarks
└── helpers/           # Test utilities
```

## Conventions

- Use **pnpm** (not npm or yarn)
- Zero external dependencies in `src/` - only Node.js built-ins
- DevDependencies are OK (TypeScript, Vitest, etc.)
- All exports must be typed
- Components return `VNode | null`
- Use `createSignal` naming, not `useSignal`
- Dual API pattern: `createX()` for state + Component for display

## Border Styles

Available: `single`, `double`, `round`, `bold`, `singleDouble`, `doubleSingle`, `classic`, `arrow`, `heavy`, `none`

```typescript
Box({ borderStyle: 'round', borderColor: 'cyan' },
  Text({}, 'Rounded box!')
)
```

## Color Support

```typescript
// Named colors (16)
Text({ color: 'cyan' }, 'Named')

// Bright variants
Text({ color: 'cyanBright' }, 'Bright')

// Hex colors
Text({ color: '#ff6600' }, 'Hex')

// RGB
Text({ color: 'rgb(255, 102, 0)' }, 'RGB')

// Theme semantic colors
Text({ color: 'primary' }, 'Primary')
Text({ color: 'destructive' }, 'Destructive')
Text({ color: 'muted' }, 'Muted')

// Palette colors (22 colors × 11 shades)
Text({ color: 'blue-500' }, 'Palette')
```

## Spinner Styles

Available: `dots`, `line`, `pipe`, `simpleDots`, `simpleDotsScrolling`, `star`, `arc`, `circle`, `squareCorners`, `circleQuarters`, `circleHalves`, `bounce`, `bouncingBar`, `pong`, `hamburger`, `toggle`, `arrow`, `balloon`, `flip`, `noise`, `point`, `layer`, `betaWave`, `aesthetic`, `dwarfFortress`, `monkey`

```typescript
Spinner({ style: 'dots', color: 'cyan' })
```

## Storybook

Run the component explorer:

```bash
pnpm storybook
```

Navigate with:
- `↑/↓` - Navigate components
- `Enter` - Select/execute
- `Tab` - Switch panels
- `q` - Quit

## Examples

```bash
# List all examples
pnpm example:list

# Run specific example
pnpm example examples/01-basic-counter.ts
pnpm example examples/06-dashboard.ts
```

## File Structure Summary

| Directory | Purpose |
|-----------|---------|
| `src/primitives/` | Foundation: signals, context, store, basic nodes |
| `src/atoms/` | Simple UI units: button, spinner, input |
| `src/molecules/` | Composed: select, table, code-block, charts |
| `src/organisms/` | Complex: modal, data-table, command-palette |
| `src/templates/` | Layouts: app shell, stacks, pages |
| `src/design-system/` | Alternative org by function |
| `src/core/` | Framework internals |
| `src/hooks/` | React-like hooks |
| `src/styling/` | CSS-like styling system |
| `src/storybook/` | Component explorer |
| `src/dev-tools/` | Debug & testing utilities |
| `src/app/` | Application render loop |
| `src/utils/` | Text utilities, types |
| `tests/` | 79 test files, 3500+ tests |
| `examples/` | Usage examples |
| `docs/` | Documentation & recordings |
