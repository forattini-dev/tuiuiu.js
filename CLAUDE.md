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

The project is inspired by:
- **React** - Component model and hooks
- **Ink** - Terminal UI concepts
- **Yoga** - Flexbox layout engine

Key principles:
- **Zero external dependencies** - Everything is implemented from scratch
- **Signal-based reactivity** - Fine-grained, auto-tracking dependency system
- **Flexbox layout** - Yoga-inspired layout engine for terminals
- **Excellent test coverage** - Learn from the best libs in `./node_modules`

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

# Run a single test file
pnpm test tests/signal.test.ts
```

## Architecture

```
src/
├── core/                  # Core framework
│   ├── signal.ts          # Reactive signals (createSignal, createEffect, batch)
│   ├── layout.ts          # Flexbox layout engine
│   ├── renderer.ts        # VNode → ANSI string conversion
│   ├── app.ts             # Main render loop, lifecycle
│   └── index.ts
│
├── hooks/                 # React-like hooks
│   ├── hooks.ts           # useState, useEffect, useInput, useFocus
│   └── index.ts
│
├── components/            # UI components
│   ├── components.ts      # Basic: Box, Text, Spacer, Fragment, When, Each
│   ├── select.ts          # Interactive selection/dropdown
│   ├── table.ts           # Rich data tables
│   ├── text-input.ts      # Text input with cursor
│   ├── modal.ts           # Modal dialogs, toasts
│   ├── spinner.ts         # Loading indicators
│   ├── progress-bar.ts    # Progress bars
│   ├── markdown.ts        # Markdown renderer
│   ├── code-block.ts      # Syntax highlighted code
│   ├── split-panel.ts     # Resizable panels
│   └── index.ts
│
├── utils/                 # Utilities
│   ├── types.ts           # VNode, BoxStyle, TextStyle types
│   ├── text-utils.ts      # ANSI-aware text: width, wrap, truncate
│   ├── cursor.ts          # Show/hide cursor
│   ├── log-update.ts      # Incremental terminal rendering
│   └── index.ts
│
└── index.ts               # Main entry point
```

### Key Concepts

**1. Signals (Reactive Primitives)**
```typescript
import { createSignal, createEffect, batch } from 'tuiuiu.js'

const [count, setCount] = createSignal(0)
createEffect(() => console.log('Count:', count()))
setCount(c => c + 1)  // Triggers effect
```

**2. Components (No JSX)**
```typescript
import { Box, Text, When } from 'tuiuiu.js'

// Components are functions that return VNodes
Box({ flexDirection: 'column', padding: 1 },
  Text({ color: 'cyan', bold: true }, 'Title'),
  When(isLoading, Text({}, 'Loading...'))
)
```

**3. Hooks**
```typescript
import { useState, useEffect, useInput, useApp } from 'tuiuiu.js'

function Counter() {
  const [count, setCount] = useState(0)

  useInput((input, key) => {
    if (key.upArrow) setCount(c => c + 1)
    if (key.escape) useApp().exit()
  })

  return Text({}, `Count: ${count()}`)
}
```

**4. Rendering**
```typescript
import { render, renderOnce } from 'tuiuiu.js'

// Interactive app
const { waitUntilExit } = render(App)
await waitUntilExit()

// One-shot render (no interactivity)
const output = renderOnce(MyComponent())
console.log(output)
```

## Testing

Tests are in `tests/` directory. We use Vitest with happy-dom.

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test tests/signal.test.ts

# Watch mode
pnpm test:watch

# Coverage (target: 80%)
pnpm test:coverage
```

Test structure:
```
tests/
├── core/
│   ├── signal.test.ts     # Signal reactivity tests
│   ├── layout.test.ts     # Layout calculation tests
│   └── renderer.test.ts   # Rendering tests
├── hooks/
│   └── hooks.test.ts      # Hook behavior tests
├── components/
│   ├── box.test.ts        # Box component tests
│   └── text.test.ts       # Text component tests
└── utils/
    └── text-utils.test.ts # Text utility tests
```

## Conventions

- Use pnpm (not npm or yarn)
- Zero external dependencies in `src/` - only Node.js built-ins
- DevDependencies are OK (TypeScript, Vitest, etc.)
- All exports must be typed
- Components return `VNode | null`
- Use `createSignal` naming, not `useSignal`

## Inspiration Libraries

Available in `./node_modules` for reference:
- **ink** - React for CLI (see how they do rendering)
- **react** - Component model, reconciliation
- **yoga** - Flexbox layout algorithm
- **cli-boxes** - Box character sets
- **cli-cursor** - Cursor control
- **cli-truncate** - Text truncation
- **wrap-ansi** - Text wrapping
- **marked-terminal** - Markdown rendering
- **grok-cli** - AI agent TUI example

## Border Styles

Available border styles: `single`, `double`, `round`, `bold`, `singleDouble`, `doubleSingle`, `classic`, `arrow`, `none`

```typescript
Box({ borderStyle: 'round', borderColor: 'cyan' },
  Text({}, 'Rounded box!')
)
```

## Color Support

Named colors: `black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`
Bright variants: `redBright`, `greenBright`, etc.
Hex colors: `#ff0000`
RGB: `rgb(255, 0, 0)`

```typescript
Text({ color: 'cyan', backgroundColor: '#333' }, 'Styled text')
```
