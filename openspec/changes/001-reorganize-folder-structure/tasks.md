# Tasks: Reorganize Folder Structure

## Overview
Total tasks: 15
Estimated effort: Medium (structural changes, no new features)

## Task List

### Phase 1: Create Directory Structure
- [x] **T1**: Create new directory structure
  - Create `src/primitives/`
  - Create `src/design-system/{core,primitives,forms,feedback,data-display,overlays,layout}/`
  - Create `src/app/`
  - Validation: `ls -R src/` shows all directories

### Phase 2: Move Simple Files (No Extraction)
- [x] **T2**: Move signal to primitives
  - Move `src/core/signal.ts` → `src/primitives/signal.ts`
  - Update imports in signal.ts if any
  - Create `src/primitives/index.ts`
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T3**: Move renderer and layout to design-system/core
  - Move `src/core/renderer.ts` → `src/design-system/core/renderer.ts`
  - Move `src/core/layout.ts` → `src/design-system/core/layout.ts`
  - Create `src/design-system/core/index.ts`
  - Update imports
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T4**: Move form components
  - Move `src/components/text-input.ts` → `src/design-system/forms/text-input.ts`
  - Move `src/components/select.ts` → `src/design-system/forms/select.ts`
  - Create `src/design-system/forms/index.ts`
  - Update imports
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T5**: Move feedback components
  - Move `src/components/spinner.ts` → `src/design-system/feedback/spinner.ts`
  - Move `src/components/progress-bar.ts` → `src/design-system/feedback/progress-bar.ts`
  - Create `src/design-system/feedback/index.ts`
  - Update imports
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T6**: Move data-display components
  - Move `src/components/table.ts` → `src/design-system/data-display/table.ts`
  - Move `src/components/code-block.ts` → `src/design-system/data-display/code-block.ts`
  - Move `src/components/markdown.ts` → `src/design-system/data-display/markdown.ts`
  - Create `src/design-system/data-display/index.ts`
  - Update imports
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T7**: Move overlay components
  - Move `src/components/modal.ts` → `src/design-system/overlays/modal.ts`
  - Create `src/design-system/overlays/index.ts`
  - Update imports
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T8**: Move layout components
  - Move `src/components/split-panel.ts` → `src/design-system/layout/split-panel.ts`
  - Create `src/design-system/layout/index.ts`
  - Update imports
  - Validation: `pnpm exec tsc --noEmit`

### Phase 3: Extract from Monolithic Files
- [x] **T9**: Extract primitives from components.ts
  - Extract `Box` → `src/design-system/primitives/box.ts`
  - Extract `Text` → `src/design-system/primitives/text.ts`
  - Extract `Spacer`, `Newline`, `Fragment` → `src/design-system/primitives/spacer.ts`
  - Extract `Divider` → `src/design-system/primitives/divider.ts`
  - Extract `Slot` → `src/design-system/primitives/slot.ts`
  - Extract `normalizeChildren` helper (shared)
  - Create `src/design-system/primitives/index.ts`
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T10**: Extract remaining components from components.ts
  - Extract `Badge` → `src/design-system/feedback/badge.ts`
  - Extract `When`, `Each`, `Transform`, `Static` → `src/design-system/primitives/helpers.ts`
  - Extract `Markdown` (basic) → keep in data-display (advanced version)
  - Delete old `src/components/components.ts`
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T11**: Split hooks.ts
  - Extract `useState` → `src/hooks/use-state.ts`
  - Extract `useEffect` → `src/hooks/use-effect.ts`
  - Extract `useInput` → `src/hooks/use-input.ts`
  - Extract `useFocus`, `useFocusManager` → `src/hooks/use-focus.ts`
  - Extract `useApp` → `src/hooks/use-app.ts`
  - Update `src/hooks/index.ts`
  - Delete old `src/hooks/hooks.ts`
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T12**: Create app layer
  - Extract render loop from `src/core/app.ts` → `src/app/render-loop.ts`
  - Extract FocusManager class → `src/app/focus-manager.ts`
  - Extract input handlers → `src/app/input-handler.ts`
  - Create `src/app/index.ts`
  - Delete old `src/core/app.ts`
  - Validation: `pnpm exec tsc --noEmit`

### Phase 4: Update Exports & Clean Up
- [x] **T13**: Create design-system index
  - Create `src/design-system/index.ts` re-exporting all subcategories
  - Ensure all public types are exported
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T14**: Update main index.ts
  - Update `src/index.ts` to re-export from new locations
  - Maintain backward compatibility
  - Validation: `pnpm exec tsc --noEmit`

- [x] **T15**: Clean up and verify
  - Remove empty `src/core/` directory
  - Remove empty `src/components/` directory
  - Update `src/components/index.ts` if it exists (delete or redirect)
  - Run full test suite: `pnpm test:run`
  - Run verification script: `pnpm exec tsx scripts/verify.ts`
  - Validation: All tests pass

## Dependencies Graph
```
T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14 → T15
```

All tasks are sequential - each depends on the previous to avoid import conflicts.

## Parallelization Notes
Tasks T4-T8 (moving component files) could theoretically be parallelized, but doing them sequentially is safer to catch import issues early.

## Rollback Plan
If issues arise:
1. Git stash/revert changes
2. Each task can be individually reverted
3. Keep old files until T15 is complete
