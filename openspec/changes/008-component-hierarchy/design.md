# Design: Component Hierarchy Architecture

## Context

Tuiuiu is a zero-dependency Terminal UI library following React-like patterns. The current structure evolved organically, leading to:
- Duplicate component definitions (Box/Text in multiple places)
- Unclear separation between "primitives" and "components"
- No standard for component classification
- Incomplete Redux store integration

**Stakeholders**: Library users, contributors, Tetis team

## Goals / Non-Goals

### Goals
- Clear hierarchy: primitives → atoms → molecules → organisms → templates
- Single source of truth for each component
- Consistent import paths
- Proper store + persistence integration
- Backward compatible migration path

### Non-Goals
- Breaking existing public API (re-exports maintained)
- Adding new components (this is organizational)
- Changing component internal implementation
- Full Redux compatibility (we use signals, not Redux)

## Decisions

### 1. Atomic Design Adaptation

**Decision**: Adapt Brad Frost's Atomic Design for terminal UIs

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATOMIC DESIGN LEVELS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PRIMITIVES (not atoms!)                                        │
│  └── VNode factories: Box(), Text(), Spacer()                   │
│  └── Reactivity: createSignal(), createStore()                  │
│  └── Control flow: When(), Each(), Fragment()                   │
│                                                                 │
│  ATOMS (smallest UI with behavior)                              │
│  └── Badge, Tag, Spinner, ProgressBar                           │
│  └── TextInput, Checkbox, Switch, Slider                        │
│  └── InlineCode                                                 │
│                                                                 │
│  MOLECULES (composed atoms)                                     │
│  └── Select, MultiSelect, RadioGroup                            │
│  └── Table, CodeBlock, Tree                                     │
│  └── Tabs, Collapsible, Accordion                               │
│                                                                 │
│  ORGANISMS (complex, self-contained)                            │
│  └── Modal, ConfirmDialog, Toast                                │
│  └── DataTable, FileBrowser, CommandPalette                     │
│  └── SplitPanel, Grid                                           │
│                                                                 │
│  TEMPLATES (page layouts)                                       │
│  └── Page, AppShell, FullScreen                                 │
│  └── VStack, HStack, Center                                     │
│  └── Header, StatusBar, Container                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Rationale**:
- "Primitives" in Tuiuiu means VNode factories + reactive utilities, not visual atoms
- Atoms have internal state/behavior (e.g., TextInput manages cursor position)
- This maps well to existing code organization

### 2. Directory Structure

**Decision**: Create new top-level directories

```
src/
├── core/              # Engine (unchanged)
├── primitives/        # CONSOLIDATED: VNode + reactivity + store
│   ├── index.ts
│   ├── signal.ts      # Moved from core/
│   ├── nodes.ts       # Box, Text, Spacer, Newline, Fragment
│   ├── control-flow.ts # When, Each, Transform, Static, Slot
│   ├── context.ts     # Context API
│   ├── store.ts       # Redux-like store
│   └── divider.ts     # Divider component
│
├── atoms/             # NEW
│   ├── index.ts
│   ├── badge.ts
│   ├── spinner.ts
│   ├── progress-bar.ts
│   ├── text-input.ts
│   ├── checkbox.ts
│   ├── switch.ts
│   ├── slider.ts
│   └── tag.ts
│
├── molecules/         # NEW
│   ├── index.ts
│   ├── select.ts
│   ├── multi-select.ts
│   ├── radio-group.ts
│   ├── table.ts
│   ├── code-block.ts
│   ├── tabs.ts
│   ├── collapsible.ts
│   ├── tree.ts
│   └── calendar.ts
│
├── organisms/         # NEW
│   ├── index.ts
│   ├── modal.ts
│   ├── data-table.ts
│   ├── split-panel.ts
│   ├── command-palette.ts
│   ├── file-browser.ts
│   └── scroll-area.ts
│
├── templates/         # NEW
│   ├── index.ts
│   ├── page.ts
│   ├── app-shell.ts
│   ├── stack.ts       # VStack, HStack
│   ├── grid.ts
│   └── full-screen.ts
│
├── hooks/             # Unchanged
├── utils/             # Unchanged
├── styling/           # Unchanged
├── dev-tools/         # Unchanged
│
├── design-system/     # DEPRECATED - Re-exports only
│   └── index.ts       # Re-exports from atoms/molecules/organisms
│
├── components/        # DEPRECATED - Re-exports only
│   └── index.ts       # Re-exports for backward compat
│
└── index.ts           # Main entry (updated)
```

**Alternatives considered**:
1. Keep design-system structure → Rejected: unclear what "forms" vs "feedback" means for classification
2. Flat components folder → Rejected: 100+ components would be unmanageable
3. Domain-based folders → Rejected: doesn't scale, overlapping concerns

### 3. Store Architecture

**Decision**: Keep signals-first with Redux patterns

```typescript
// Store creation (primitives/store.ts)
const store = createStore(
  reducer,
  initialState,
  applyMiddleware(
    createLoggerMiddleware(),
    createPersistMiddleware({
      storage: fsStorage,
      key: 'app-state'
    })
  )
);

// Reactive access (anywhere)
const count = store.state().count; // Auto-tracks dependencies

// Dispatch (anywhere)
store.dispatch({ type: 'INCREMENT' });
```

**Why not pure Redux**:
- Signals provide fine-grained reactivity
- No need for `connect()` HOCs or `useSelector()`
- Simpler mental model for terminal UIs

### 4. Backward Compatibility

**Decision**: Re-export from deprecated locations for 1 major version

```typescript
// src/components/index.ts (deprecated)
/** @deprecated Import from 'tuiuiu/atoms' instead */
export { Badge, Spinner } from '../atoms/index.js';
export { Table, Select } from '../molecules/index.js';
export { Modal } from '../organisms/index.js';

// src/design-system/index.ts (deprecated)
/** @deprecated Import from 'tuiuiu/atoms' or 'tuiuiu/molecules' instead */
export * from '../atoms/index.js';
export * from '../molecules/index.js';
export * from '../organisms/index.js';
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking imports for users | Re-export from old paths with deprecation warnings |
| Large refactor scope | Phase approach: primitives first, then atoms, etc. |
| Confusion during transition | Clear documentation + migration guide |
| Performance regression | Benchmark before/after each phase |

## Migration Plan

### Phase 1: Consolidate Primitives
1. Move `core/signal.ts` → `primitives/signal.ts`
2. Create `primitives/control-flow.ts` (When, Each, etc.)
3. Finalize `primitives/store.ts` integration
4. Update `primitives/index.ts` exports
5. Delete `design-system/primitives/` (already staged)

### Phase 2: Create Atoms
1. Create `src/atoms/` directory
2. Move smallest components (Badge, Spinner, etc.)
3. Update imports in molecules/organisms
4. Add re-exports in deprecated locations

### Phase 3: Create Molecules
1. Create `src/molecules/` directory
2. Move composed components (Select, Table, etc.)
3. Update imports in organisms
4. Add re-exports

### Phase 4: Create Organisms
1. Create `src/organisms/` directory
2. Move complex components (Modal, DataTable, etc.)
3. Add re-exports

### Phase 5: Create Templates
1. Create `src/templates/` directory
2. Move layout components (AppShell, Page, etc.)
3. Add re-exports

### Phase 6: Update Main Exports
1. Update `src/index.ts` with new structure
2. Update `src/design-system/index.ts` as re-export layer
3. Update documentation

### Rollback
Each phase is independent. If issues arise:
1. Revert phase commits
2. Keep re-exports pointing to original locations
3. No user-facing breakage due to re-export layer

## Open Questions

1. **Storybook organization** - Should `src/storybook/stories/` mirror the new structure (atoms/molecules/organisms)?
2. **Data visualization** - Should charts (Sparkline, BarChart, etc.) be atoms or molecules?
3. **Hooks location** - Should component-specific hooks live with their components or in `hooks/`?
