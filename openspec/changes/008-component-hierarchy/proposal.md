# Change: Refactor Component Hierarchy with Atomic Design

## Why

The current codebase has components scattered across multiple directories (`src/components/`, `src/design-system/`, `src/design-system/primitives/`) with unclear hierarchy and duplicate implementations. This creates confusion about:
- What constitutes a "primitive" vs a "component"
- Where new components should be placed
- How components should compose each other

Additionally, the Redux-like store implementation in `src/primitives/store.ts` needs proper integration with the persistence layer.

## What Changes

### Directory Structure Refactor
- **NEW** `src/atoms/` - Smallest UI components with state (TextInput, Spinner, Badge)
- **NEW** `src/molecules/` - Composed atoms (Select, Table, Tabs)
- **NEW** `src/organisms/` - Complex units (Modal, DataTable, FileBrowser)
- **NEW** `src/templates/` - Page layouts (AppShell, Page, VStack/HStack)
- **CONSOLIDATE** `src/primitives/` - Core VNode factories + Reactivity (Box, Text, signals, store)
- **DEPRECATE** `src/design-system/primitives/` - Migrate to `src/primitives/`
- **DEPRECATE** `src/components/` - Migrate to atoms/molecules/organisms

### Component Classification
| Level | Directory | Purpose | Examples |
|-------|-----------|---------|----------|
| 0 | `core/` | Engine (invisible) | layout, renderer, buffer |
| 1 | `primitives/` | VNode factories + reactivity | Box, Text, createSignal, createStore |
| 2 | `atoms/` | Smallest UI with state | Badge, Spinner, TextInput, Switch |
| 3 | `molecules/` | Composed atoms | Select, Table, Tabs, CodeBlock |
| 4 | `organisms/` | Complex units | Modal, SplitPanel, FileBrowser |
| 5 | `templates/` | Page layouts | AppShell, Page, FullScreen |

### Store Integration
- Finalize `createStore()` API in primitives
- Add `createPersistMiddleware()` with fs-storage adapter
- Create `useStore()` hook for component integration

## Impact

- **Affected specs**: component-architecture (new), primitives (modified)
- **Affected code**:
  - `src/components/*` - All files migrated
  - `src/design-system/*` - Re-organized
  - `src/primitives/*` - Consolidated
  - `src/index.ts` - Updated exports
- **Breaking changes**: Import paths will change (backward compat re-exports provided)
- **Migration**: Automatic re-exports in old locations for 1 version
