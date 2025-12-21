# Proposal: Reorganize Folder Structure

## Change ID
`001-reorganize-folder-structure`

## Status
`proposed`

## Summary
Reorganize the tuiuiu source code into a layered architecture with clear separation between primitives, design system components, and application-level concerns. This establishes a foundation for the design system and enables better maintainability.

## Motivation
Currently, all components are mixed in `src/components/` and core functionality in `src/core/`. This makes it difficult to:
- Understand component categories at a glance
- Add new components to the right place
- Maintain clear boundaries between layers
- Scale the codebase as more components are added

## Proposed Changes

### Current Structure
```
src/
├── components/       # All components mixed together
│   ├── components.ts # Basic + some advanced
│   ├── text-input.ts
│   ├── select.ts
│   ├── table.ts
│   ├── modal.ts
│   ├── spinner.ts
│   ├── progress-bar.ts
│   ├── code-block.ts
│   ├── markdown.ts
│   └── split-panel.ts
├── core/            # Signal + renderer + layout
│   ├── signal.ts
│   ├── renderer.ts
│   ├── layout.ts
│   └── app.ts
├── hooks/           # React-like hooks
│   └── hooks.ts
└── utils/           # Utilities
    ├── types.ts
    ├── text-utils.ts
    ├── cursor.ts
    ├── log-update.ts
    └── batcher.ts
```

### New Structure
```
src/
├── primitives/              # Layer 0: Reactive foundation
│   ├── signal.ts
│   └── index.ts
│
├── design-system/           # Layer 1: UI Components
│   ├── core/               # Rendering engine
│   │   ├── renderer.ts
│   │   ├── layout.ts
│   │   └── index.ts
│   ├── primitives/         # Basic building blocks
│   │   ├── box.ts
│   │   ├── text.ts
│   │   ├── spacer.ts
│   │   ├── divider.ts
│   │   ├── slot.ts
│   │   └── index.ts
│   ├── forms/              # Form components
│   │   ├── text-input.ts
│   │   ├── select.ts
│   │   ├── checkbox.ts
│   │   ├── confirm.ts
│   │   └── index.ts
│   ├── feedback/           # User feedback
│   │   ├── spinner.ts
│   │   ├── progress-bar.ts
│   │   ├── badge.ts
│   │   └── index.ts
│   ├── data-display/       # Data presentation
│   │   ├── table.ts
│   │   ├── code-block.ts
│   │   ├── markdown.ts
│   │   └── index.ts
│   ├── overlays/           # Modal, toast
│   │   ├── modal.ts
│   │   └── index.ts
│   ├── layout/             # Layout utilities
│   │   ├── split-panel.ts
│   │   └── index.ts
│   └── index.ts
│
├── app/                     # Layer 2: Application
│   ├── render-loop.ts      # From core/app.ts
│   ├── focus-manager.ts    # Extract from hooks
│   ├── input-handler.ts    # Extract from hooks
│   └── index.ts
│
├── hooks/                   # React-like hooks
│   ├── use-state.ts
│   ├── use-effect.ts
│   ├── use-input.ts
│   ├── use-focus.ts
│   └── index.ts
│
├── utils/                   # Shared utilities
│   ├── types.ts
│   ├── text-utils.ts
│   ├── cursor.ts
│   ├── log-update.ts
│   ├── batcher.ts
│   └── index.ts
│
└── index.ts                 # Public API
```

## Impact Analysis

### Files to Move/Rename
| Current Path | New Path |
|--------------|----------|
| `src/core/signal.ts` | `src/primitives/signal.ts` |
| `src/core/renderer.ts` | `src/design-system/core/renderer.ts` |
| `src/core/layout.ts` | `src/design-system/core/layout.ts` |
| `src/core/app.ts` | `src/app/render-loop.ts` |
| `src/components/text-input.ts` | `src/design-system/forms/text-input.ts` |
| `src/components/select.ts` | `src/design-system/forms/select.ts` |
| `src/components/table.ts` | `src/design-system/data-display/table.ts` |
| `src/components/modal.ts` | `src/design-system/overlays/modal.ts` |
| `src/components/spinner.ts` | `src/design-system/feedback/spinner.ts` |
| `src/components/progress-bar.ts` | `src/design-system/feedback/progress-bar.ts` |
| `src/components/code-block.ts` | `src/design-system/data-display/code-block.ts` |
| `src/components/markdown.ts` | `src/design-system/data-display/markdown.ts` |
| `src/components/split-panel.ts` | `src/design-system/layout/split-panel.ts` |

### Files to Extract From
| Source | Extract To |
|--------|------------|
| `src/components/components.ts` | `src/design-system/primitives/box.ts` |
| `src/components/components.ts` | `src/design-system/primitives/text.ts` |
| `src/components/components.ts` | `src/design-system/primitives/spacer.ts` |
| `src/components/components.ts` | `src/design-system/primitives/divider.ts` |
| `src/components/components.ts` | `src/design-system/primitives/slot.ts` |
| `src/components/components.ts` | `src/design-system/feedback/badge.ts` |
| `src/hooks/hooks.ts` | `src/hooks/use-state.ts` |
| `src/hooks/hooks.ts` | `src/hooks/use-effect.ts` |
| `src/hooks/hooks.ts` | `src/hooks/use-input.ts` |
| `src/hooks/hooks.ts` | `src/hooks/use-focus.ts` |
| `src/hooks/hooks.ts` | `src/app/focus-manager.ts` |
| `src/hooks/hooks.ts` | `src/app/input-handler.ts` |

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Breaking imports | Update all imports atomically |
| Missing exports | Comprehensive index.ts files |
| Test breakage | Update test imports |
| Circular dependencies | Careful layering, primitives → design-system → app |

## Success Criteria
1. All existing tests pass after reorganization
2. TypeScript compilation succeeds
3. No circular dependency warnings
4. `src/index.ts` exports maintain backward compatibility
5. Each layer can be imported independently

## Dependencies
None - this is a foundational change.

## Related Changes
- 002-theme-system (depends on this)
- 003-tests-primitives (depends on this)
