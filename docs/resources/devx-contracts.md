# DEVX Contract Coverage

This page defines the validation contract for the DEVX work done around rerender-safe interactive components, public API stability, and example/docs consistency.

## Primary Runner

Use the consolidated runner when you touch interactive API behavior:

```bash
pnpm validate:devx-contracts
```

It runs:

- `pnpm test:devx-contracts`
- `pnpm typecheck`
- `pnpm build`
- `pnpm verify:contracts`

## What This Guarantees

The DEVX contract runner is intended to prove:

- direct component usage does not reset interactive state on parent rerender
- stable controller hooks keep the same controller instance across rerenders
- mutable callbacks and behavior options update without forcing controller recreation
- public examples and curated imports still match the build output
- the package still typechecks and builds after the behavior changes

## Behavior Matrix

### Forms and Selection

Covered by:

- [interactive-state-hooks.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/forms/interactive-state-hooks.test.ts)
- [interactive-wave1-state.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/forms/interactive-wave1-state.test.ts)
- [interactive-wave2-state.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/forms/interactive-wave2-state.test.ts)

Guarantees:

- `TextInput` / `Select` rerender safety
- `useTextInputState()` / `useSelectState()` stable controller reuse
- wave 1 controls (`Switch`, `Slider`, `RangeSlider`, `RadioGroup`, `Tabs`, `MultiSelect`, `Autocomplete`, `TagInput`, `Tree`)
- wave 2 controls (`Calendar`, `DatePicker`, `Collapsible`, `Accordion`, `ButtonGroup`, `ConfirmButton`)

### Scroll and Data Containers

Covered by:

- [interactive-wave2-organisms-state.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/organisms/interactive-wave2-organisms-state.test.ts)
- [scroll-area.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/organisms/scroll-area.test.ts)
- [scroll-list.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/organisms/scroll-list.test.ts)
- [data-table.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/organisms/data-table.test.ts)

Guarantees:

- `ScrollArea`, `VirtualList`, `ScrollList`, and `DataTable` preserve state across rerenders
- `useScrollList()` and `useDataTableState()` stay reusable
- scroll, pagination, and selection behavior still work after stabilization

### Residual Interactive Surfaces

Covered by:

- [residual-interactive-devx.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/integration/residual-interactive-devx.test.ts)
- [scroll.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/primitives/scroll.test.ts)
- [tabs-mouse.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/layout/tabs-mouse.test.ts)
- [legend.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/molecules/data-viz/legend.test.ts)
- [data-viz.test.ts](/home/cyber/Work/tetis/libs/tuiuiu.js/tests/components/data-viz.test.ts)

Guarantees:

- `Scroll` preserves position across rerenders
- `useScroll()` supports programmatic control that changes rendered output
- `VerticalTabs` reacts to click and keyboard without resetting controller state
- interactive `Legend` reacts to click and updates callbacks across rerenders
- interactive `Heatmap` is keyboard-first and does not promise mouse click selection

## Contract Boundaries

These tests do **not** mean every historical OpenSpec change in the repository is fully validated.

They are specifically the contract for:

- [stabilize-public-devx-contracts](/home/cyber/Work/tetis/libs/tuiuiu.js/openspec/changes/stabilize-public-devx-contracts/tasks.md)
- [expand-rerender-safe-interactive-components](/home/cyber/Work/tetis/libs/tuiuiu.js/openspec/changes/expand-rerender-safe-interactive-components/tasks.md)
- [stabilize-residual-interactive-devx](/home/cyber/Work/tetis/libs/tuiuiu.js/openspec/changes/stabilize-residual-interactive-devx/tasks.md)

## When To Run It

Run `pnpm validate:devx-contracts` whenever you change:

- interactive component controllers
- `state?` props or `useXState()` hooks
- scroll, selection, pagination, expansion, or cursor behavior
- curated examples or public contract docs
- package exports or example validation rules
