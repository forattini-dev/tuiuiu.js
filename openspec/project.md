# Project Context

## Purpose

Tuiuiu is a zero-dependency Terminal UI library for building rich CLI applications. It provides React-like components and hooks for creating interactive terminal interfaces without any external dependencies.

## Tech Stack

- **Language**: TypeScript (ES2022, NodeNext modules)
- **Runtime**: Node.js (v18+)
- **Testing**: Vitest with happy-dom (79 files, 3500+ tests)
- **Dependencies**: Zero external runtime dependencies (zero-deps philosophy)

## Project Conventions

### Code Style

- Factory functions for components (no JSX)
- Dual API pattern: `createX()` for state + `ComponentX()` for display
- Signal-based reactivity (auto-tracking dependencies)
- All colors support: named (16), hex (#fff), rgb(r,g,b), palette (blue-500)

### Architecture Patterns

- **Atomic Design Hierarchy**:
  - Primitives → Foundation (Signal, Context, Store, Box, Text)
  - Atoms → Simple UI (Button, Spinner, Badge, TextInput)
  - Molecules → Composed (Select, Table, CodeBlock, Charts)
  - Organisms → Complex (Modal, DataTable, CommandPalette)
  - Templates → Layouts (AppShell, Page, StatusBar)

- **Dual Organization**:
  - By atomic level: `src/primitives/`, `src/atoms/`, etc.
  - By function: `src/design-system/forms/`, `src/design-system/feedback/`, etc.

- **Rendering Pipeline**:
  - VNode → Layout calculation → Cell buffer → ANSI string → Terminal output
  - Delta rendering for minimal updates
  - Double buffering for flicker-free output

### Component Patterns

```typescript
// State function
export function createComponent(options?: Options): ComponentState {
  const [value, setValue] = createSignal(options?.initial ?? 0)
  return { value, setValue, ... }
}

// Display function
export function Component(props: Props): VNode {
  return Box({ ... },
    Text({ ... }, props.label)
  )
}
```

### Testing Strategy

- 100% keyboard interaction coverage for all interactive components
- Unit tests for each component and utility
- Integration tests for focus management and input handling
- Mouse simulation tests using dev-tools/mouse-simulator
- Vitest with v8 coverage provider

### Git Workflow

- Conventional commits
- OpenSpec for feature proposals
- Main branch for releases

## Domain Context

### Terminal Rendering
- Uses ANSI escape sequences for all output
- Supports 16 colors, 256 colors, and true color
- Cell-based buffer with double buffering
- Delta rendering for efficient updates

### Layout Engine
- Full flexbox implementation for terminals
- Supports: flex-direction, justify-content, align-items, gap, padding, margin
- Constraint-based layout with min/max sizes
- Virtual scrolling for large content

### Input Handling
- Parses input from multiple terminal types (xterm, gnome, rxvt, putty, cygwin)
- Mouse support (click, drag, scroll)
- Focus management with Tab navigation
- Keyboard shortcuts system

### Theme System
- Dark, light, high-contrast, monochrome themes
- Semantic colors: primary, destructive, muted, etc.
- Color palette: 22 colors × 11 shades
- Theme-aware components

### Animation System
- Spring physics (stiffness/damping and frequency/damping models)
- Easing functions
- Global tick system for synchronized animations
- Composite transitions (swipe, slide)

## Important Constraints

- **Zero external dependencies** - Everything must be implemented in-house
- No JSX transpilation - Pure TypeScript function calls
- Must work in any terminal that supports ANSI codes
- Performance critical - Terminal rendering must be fast
- Node.js built-ins only (EventEmitter, fs, path, etc.)

## External Dependencies

- **Runtime**: None (zero-deps philosophy)
- **Dev dependencies**: TypeScript, Vitest, tsx, happy-dom, @vitest/coverage-v8

## Directory Structure

```
src/
├── primitives/       # Foundation: signals, context, store, nodes
├── atoms/            # Simple: button, spinner, input, badge
├── molecules/        # Composed: select, table, charts, markdown
├── organisms/        # Complex: modal, data-table, command-palette
├── templates/        # Layouts: app shell, stacks, pages
├── design-system/    # Alt organization by function
├── core/             # Framework: layout, render, theme, animation
├── hooks/            # React-like: useState, useInput, useFocus
├── styling/          # CSS-like styling system
├── storybook/        # Component explorer
├── dev-tools/        # Debug & test utilities
├── app/              # Application render loop
└── utils/            # Text utilities, types
```

## Key Modules

### Core (`src/core/`)
| Module | Purpose |
|--------|---------|
| `signal.ts` | Reactive signals (createSignal, createEffect, batch) |
| `layout.ts` | Flexbox layout engine |
| `renderer.ts` | VNode → ANSI conversion |
| `delta-render.ts` | Optimized diff-based rendering |
| `buffer.ts` | Cell buffer & double-buffering |
| `theme.ts` | Theme system (colors, semantic tokens) |
| `colors.ts` | Color palette (22 × 11 shades) |
| `animation.ts` | Animation & spring physics |
| `tick.ts` | Global tick for synchronized animations |
| `focus.ts` | Focus management |
| `input.ts` | Input parsing |
| `keybindings.ts` | Keyboard shortcuts |
| `hit-test.ts` | Mouse hit testing |
| `virtual-scroll.ts` | Virtual scrolling |
| `events.ts` | Event system |
| `error-boundary.ts` | Error handling with stack traces |
| `capabilities.ts` | Terminal capabilities detection |
| `graphics.ts` | Sixel, Kitty, iTerm2 graphics |
| `highlighter.ts` | Syntax highlighting |

### Hooks (`src/hooks/`)
| Hook | Purpose |
|------|---------|
| `useState` | Reactive state with persistence |
| `useEffect` | Side effects |
| `useInput` | Keyboard handling |
| `useFocus` | Focus state |
| `useMouse` | Mouse events |
| `useApp` | App lifecycle (exit, rerender) |
| `useNavigation` | Linked list navigation |
| `useTerminalSize` | Terminal dimensions |

### Components

**Atoms**: Button, Spinner, ProgressBar, Timer, TextInput, Switch, Slider, Tooltip, Badge

**Molecules**: Select, MultiSelect, RadioGroup, Autocomplete, Table, CodeBlock, Markdown, Tree, Calendar, Tabs, Collapsible, Sparkline, BarChart, LineChart, Gauge, Heatmap

**Organisms**: Modal, CommandPalette, DataTable, FileBrowser, SplitPanel, ScrollArea, Grid, OverlayStack

**Templates**: VStack, HStack, Center, FullScreen, AppShell, Page, StatusBar, Header

## Storybook

Component explorer accessible via `pnpm storybook`:
- Stories organized by atomic level
- Live component preview
- Interactive playground
- Comparison view for variants
