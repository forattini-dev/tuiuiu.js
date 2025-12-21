# Design: Reorganize Folder Structure

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        src/index.ts                              │
│                      (Public API Exports)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│    Layer 2    │    │    Layer 1    │    │    Layer 0    │
│      app/     │    │ design-system/│    │  primitives/  │
│               │    │               │    │               │
│ - render-loop │    │ - primitives/ │    │ - signal.ts   │
│ - focus-mgr   │    │ - forms/      │    │ - (reactive)  │
│ - input-hdlr  │    │ - feedback/   │    │               │
│               │    │ - data-disp/  │    │               │
│               │    │ - overlays/   │    │               │
│               │    │ - layout/     │    │               │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
            ┌───────────────┐    ┌───────────────┐
            │    hooks/     │    │    utils/     │
            │               │    │               │
            │ - use-state   │    │ - types       │
            │ - use-effect  │    │ - text-utils  │
            │ - use-input   │    │ - cursor      │
            │ - use-focus   │    │ - batcher     │
            └───────────────┘    └───────────────┘
```

## Layer Definitions

### Layer 0: Primitives (`src/primitives/`)
**Purpose**: Core reactive primitives that all other layers depend on.

**Contents**:
- `signal.ts` - Signal, Effect, batch, createSignal, createEffect, createMemo, etc.

**Dependencies**: None (utils only)

**Consumers**: All other layers

### Layer 1: Design System (`src/design-system/`)
**Purpose**: UI components organized by category.

**Subcategories**:

| Category | Purpose | Components |
|----------|---------|------------|
| `core/` | Rendering engine | renderer, layout |
| `primitives/` | Basic building blocks | Box, Text, Spacer, Divider, Slot |
| `forms/` | User input | TextInput, Select, Checkbox, Confirm |
| `feedback/` | User feedback | Spinner, ProgressBar, Badge |
| `data-display/` | Data presentation | Table, CodeBlock, Markdown |
| `overlays/` | Layered UI | Modal, Toast |
| `layout/` | Layout utilities | SplitPanel, ThreePanel |

**Dependencies**: primitives, utils

**Consumers**: app, user code

### Layer 2: Application (`src/app/`)
**Purpose**: Application-level concerns like rendering loop and focus management.

**Contents**:
- `render-loop.ts` - Main render function, terminal setup
- `focus-manager.ts` - Global focus state, Tab navigation
- `input-handler.ts` - Keyboard input parsing and routing

**Dependencies**: primitives, design-system, hooks

**Consumers**: User code

## Import Rules

```typescript
// ✅ ALLOWED
// primitives → utils
import { ... } from '../utils/types.js';

// design-system → primitives
import { createSignal } from '../primitives/signal.js';

// design-system → utils
import { stringWidth } from '../utils/text-utils.js';

// app → design-system
import { Box, Text } from '../design-system/index.js';

// app → primitives
import { createEffect } from '../primitives/signal.js';

// hooks → primitives
import { createSignal, createEffect } from '../primitives/signal.js';

// ❌ NOT ALLOWED
// primitives → design-system (circular)
// primitives → app (circular)
// design-system → app (wrong direction)
```

## File Extraction Strategy

### `components.ts` → Multiple Files

The monolithic `components.ts` (580+ lines) will be split:

```typescript
// src/design-system/primitives/box.ts
export interface BoxProps { ... }
export function Box(props: BoxProps, ...children): VNode { ... }

// src/design-system/primitives/text.ts
export interface TextProps { ... }
export function Text(props: TextProps, ...children): VNode { ... }

// etc.
```

Each file will:
1. Define its own types/interfaces
2. Import shared types from utils/types.ts
3. Export only its component

### `hooks.ts` → Multiple Files

The monolithic `hooks.ts` (570+ lines) will be split:

```typescript
// src/hooks/use-state.ts
export function useState<T>(initial: T): [() => T, (v: T) => void] { ... }

// src/hooks/use-effect.ts
export function useEffect(fn: () => void | (() => void)): () => void { ... }

// src/hooks/use-input.ts
export function useInput(handler: InputHandler, options?: UseInputOptions): void { ... }

// src/hooks/use-focus.ts
export function useFocus(options?: FocusOptions): FocusResult { ... }
```

Global state (inputHandlers, focusManager) moves to `src/app/`:

```typescript
// src/app/input-handler.ts
export const inputHandlers: InputHandler[] = [];
export function registerInputHandler(handler: InputHandler): () => void { ... }

// src/app/focus-manager.ts
export class FocusManager { ... }
export const focusManager = new FocusManager();
```

## Index File Structure

Each directory has an `index.ts` that re-exports:

```typescript
// src/design-system/primitives/index.ts
export * from './box.js';
export * from './text.js';
export * from './spacer.js';
export * from './divider.js';
export * from './slot.js';

// src/design-system/index.ts
export * from './primitives/index.js';
export * from './forms/index.js';
export * from './feedback/index.js';
export * from './data-display/index.js';
export * from './overlays/index.js';
export * from './layout/index.js';
export * from './core/index.js';
```

## Backward Compatibility

The main `src/index.ts` will maintain backward compatibility by re-exporting everything:

```typescript
// src/index.ts
// Primitives
export * from './primitives/index.js';

// Design System
export * from './design-system/index.js';

// Application
export * from './app/index.js';

// Hooks
export * from './hooks/index.js';

// Utils
export * from './utils/index.js';
```

Users can continue to:
```typescript
import { Box, Text, createSignal, render } from 'tuiuiu';
```

Or use more specific imports:
```typescript
import { Box, Text } from 'tuiuiu/design-system/primitives';
import { createSignal } from 'tuiuiu/primitives';
```

## Migration Steps

1. **Create directories** - Empty structure first
2. **Move simple files** - Files that don't need splitting (spinner, table, etc.)
3. **Extract primitives** - Box, Text, Spacer from components.ts
4. **Extract hooks** - Split hooks.ts into individual files
5. **Update imports** - Fix all import paths
6. **Update index files** - Create/update all index.ts
7. **Run tests** - Verify nothing broke
8. **Clean up** - Remove old files

## Trade-offs

| Decision | Pros | Cons |
|----------|------|------|
| Many small files | Clear ownership, easy to find | More files to navigate |
| Category folders | Logical grouping | Deeper nesting |
| Separate primitives | Clear foundation layer | Extra directory |
| Keep utils flat | Simple structure | May grow large |

## Alternatives Considered

### Alternative 1: Flat structure with prefixes
```
src/components/
├── primitive-box.ts
├── primitive-text.ts
├── form-text-input.ts
├── form-select.ts
```
**Rejected**: Harder to navigate, no clear layering.

### Alternative 2: Feature-based structure
```
src/
├── text-input/
│   ├── component.ts
│   ├── state.ts
│   └── tests/
```
**Rejected**: Loses the design system concept, harder to share code.

### Alternative 3: Keep monolithic files
**Rejected**: Already causing maintenance issues, doesn't scale.
