# Tasks: Component Hierarchy Refactor

## 1. Phase 1: Consolidate Primitives

### 1.1 Core Reactive Primitives
- [ ] 1.1.1 Ensure `primitives/signal.ts` has all signal utilities
- [ ] 1.1.2 Ensure `primitives/context.ts` has Context API
- [ ] 1.1.3 Finalize `primitives/store.ts` with createStore, applyMiddleware
- [ ] 1.1.4 Create `utils/fs-storage.ts` for Node.js persistence adapter

### 1.2 VNode Primitives
- [ ] 1.2.1 Ensure `primitives/nodes.ts` has: Box, Text, Spacer, Newline, Fragment
- [ ] 1.2.2 Create `primitives/control-flow.ts` with: When, Each, Transform, Static, Slot
- [ ] 1.2.3 Ensure `primitives/divider.ts` is properly exported

### 1.3 Cleanup Old Primitives
- [ ] 1.3.1 Delete `design-system/primitives/` (already staged for deletion)
- [ ] 1.3.2 Update `primitives/index.ts` to export all primitives
- [ ] 1.3.3 Remove duplicate Box/Text from `components/index.ts`

### 1.4 Update Core Exports
- [ ] 1.4.1 Update `core/index.ts` to re-export from primitives where needed
- [ ] 1.4.2 Ensure backward compat for `createSignal` import from core

## 2. Phase 2: Create Atoms Directory

### 2.1 Setup Atoms Structure
- [ ] 2.1.1 Create `src/atoms/` directory
- [ ] 2.1.2 Create `src/atoms/index.ts` with all exports

### 2.2 Migrate Feedback Atoms
- [ ] 2.2.1 Move/create `atoms/badge.ts` from design-system/feedback
- [ ] 2.2.2 Move/create `atoms/spinner.ts` from design-system/feedback
- [ ] 2.2.3 Move/create `atoms/progress-bar.ts` from design-system/feedback
- [ ] 2.2.4 Move/create `atoms/timer.ts` from design-system/feedback

### 2.3 Migrate Form Atoms
- [ ] 2.3.1 Move/create `atoms/text-input.ts` from design-system/forms
- [ ] 2.3.2 Move/create `atoms/checkbox.ts` (extract from select)
- [ ] 2.3.3 Move/create `atoms/switch.ts` from design-system/forms
- [ ] 2.3.4 Move/create `atoms/slider.ts` from design-system/forms
- [ ] 2.3.5 Move/create `atoms/button.ts` from design-system/forms

### 2.4 Migrate Visual Atoms
- [ ] 2.4.1 Move/create `atoms/tag.ts` from design-system/visual
- [ ] 2.4.2 Move/create `atoms/inline-code.ts` from design-system/data-display
- [ ] 2.4.3 Move/create `atoms/tooltip.ts` from design-system/visual

## 3. Phase 3: Create Molecules Directory

### 3.1 Setup Molecules Structure
- [ ] 3.1.1 Create `src/molecules/` directory
- [ ] 3.1.2 Create `src/molecules/index.ts` with all exports

### 3.2 Migrate Form Molecules
- [ ] 3.2.1 Move/create `molecules/select.ts` from design-system/forms
- [ ] 3.2.2 Move/create `molecules/multi-select.ts` from design-system/forms
- [ ] 3.2.3 Move/create `molecules/radio-group.ts` from design-system/forms
- [ ] 3.2.4 Move/create `molecules/autocomplete.ts` from design-system/forms
- [ ] 3.2.5 Move/create `molecules/confirm.ts` (Yes/No prompt)

### 3.3 Migrate Data Display Molecules
- [ ] 3.3.1 Move/create `molecules/table.ts` from design-system/data-display
- [ ] 3.3.2 Move/create `molecules/code-block.ts` from design-system/data-display
- [ ] 3.3.3 Move/create `molecules/markdown.ts` from design-system/data-display
- [ ] 3.3.4 Move/create `molecules/tree.ts` from design-system/data-display
- [ ] 3.3.5 Move/create `molecules/calendar.ts` from design-system/data-display

### 3.4 Migrate Navigation Molecules
- [ ] 3.4.1 Move/create `molecules/tabs.ts` from design-system/layout
- [ ] 3.4.2 Move/create `molecules/collapsible.ts` from design-system/layout
- [ ] 3.4.3 Move/create `molecules/accordion.ts` from design-system/layout

### 3.5 Migrate Data Viz Molecules
- [ ] 3.5.1 Move/create `molecules/sparkline.ts` from components/data-viz
- [ ] 3.5.2 Move/create `molecules/bar-chart.ts` from components/data-viz
- [ ] 3.5.3 Move/create `molecules/line-chart.ts` from components/data-viz
- [ ] 3.5.4 Move/create `molecules/gauge.ts` from components/data-viz
- [ ] 3.5.5 Move/create `molecules/heatmap.ts` from components/data-viz

## 4. Phase 4: Create Organisms Directory

### 4.1 Setup Organisms Structure
- [ ] 4.1.1 Create `src/organisms/` directory
- [ ] 4.1.2 Create `src/organisms/index.ts` with all exports

### 4.2 Migrate Overlay Organisms
- [ ] 4.2.1 Move/create `organisms/modal.ts` from design-system/overlays
- [ ] 4.2.2 Move/create `organisms/confirm-dialog.ts` from design-system/overlays
- [ ] 4.2.3 Move/create `organisms/toast.ts` from design-system/overlays
- [ ] 4.2.4 Move/create `organisms/command-palette.ts` from design-system/overlays
- [ ] 4.2.5 Move/create `organisms/alert-box.ts` from design-system/overlays

### 4.3 Migrate Layout Organisms
- [ ] 4.3.1 Move/create `organisms/split-panel.ts` from design-system/layout
- [ ] 4.3.2 Move/create `organisms/scroll-area.ts` from design-system/layout
- [ ] 4.3.3 Move/create `organisms/virtual-list.ts` from design-system/layout
- [ ] 4.3.4 Move/create `organisms/grid.ts` from design-system/layout

### 4.4 Migrate Data Organisms
- [ ] 4.4.1 Move/create `organisms/data-table.ts` from design-system/data-display
- [ ] 4.4.2 Move/create `organisms/file-browser.ts` from design-system/navigation
- [ ] 4.4.3 Move/create `organisms/log-viewer.ts` from design-system/layout

## 5. Phase 5: Create Templates Directory

### 5.1 Setup Templates Structure
- [ ] 5.1.1 Create `src/templates/` directory
- [ ] 5.1.2 Create `src/templates/index.ts` with all exports

### 5.2 Migrate Stack Layouts
- [ ] 5.2.1 Move/create `templates/stack.ts` (VStack, HStack, Center)
- [ ] 5.2.2 Move/create `templates/spacer.ts` (layout spacer utils)

### 5.3 Migrate Page Layouts
- [ ] 5.3.1 Move/create `templates/page.ts` from design-system/layout
- [ ] 5.3.2 Move/create `templates/app-shell.ts` from design-system/layout
- [ ] 5.3.3 Move/create `templates/full-screen.ts` from design-system/layout
- [ ] 5.3.4 Move/create `templates/header.ts` from design-system/layout
- [ ] 5.3.5 Move/create `templates/status-bar.ts` from design-system/layout
- [ ] 5.3.6 Move/create `templates/container.ts` from design-system/layout

## 6. Phase 6: Update Exports & Backward Compat

### 6.1 Main Index Updates
- [ ] 6.1.1 Update `src/index.ts` with new import structure
- [ ] 6.1.2 Organize exports by category (primitives, atoms, molecules, etc.)
- [ ] 6.1.3 Add JSDoc comments for each export section

### 6.2 Backward Compatibility Layer
- [ ] 6.2.1 Update `components/index.ts` to re-export from atoms/molecules/organisms
- [ ] 6.2.2 Update `design-system/index.ts` to re-export from new structure
- [ ] 6.2.3 Add `@deprecated` JSDoc to old export locations
- [ ] 6.2.4 Add console.warn for deprecated imports (dev mode only)

### 6.3 Subpath Exports (package.json)
- [ ] 6.3.1 Add `exports` field to package.json for subpath imports
- [ ] 6.3.2 Configure `tuiuiu/primitives`, `tuiuiu/atoms`, etc.
- [ ] 6.3.3 Test subpath imports work correctly

## 7. Phase 7: Storybook & Tests

### 7.1 Update Storybook
- [ ] 7.1.1 Reorganize stories to match new structure (atoms/molecules/organisms)
- [ ] 7.1.2 Update story imports to use new paths
- [ ] 7.1.3 Add category labels in storybook sidebar

### 7.2 Update Tests
- [ ] 7.2.1 Update test imports to use new paths
- [ ] 7.2.2 Ensure all tests pass after migration
- [ ] 7.2.3 Add import path tests for backward compat

### 7.3 Documentation
- [ ] 7.3.1 Update CLAUDE.md with new architecture
- [ ] 7.3.2 Create migration guide for users
- [ ] 7.3.3 Update README examples

## 8. Phase 8: Store Integration

### 8.1 Finalize Store API
- [ ] 8.1.1 Review and finalize `createStore()` API
- [ ] 8.1.2 Review and finalize `applyMiddleware()` API
- [ ] 8.1.3 Add `combineReducers()` utility

### 8.2 Persistence Layer
- [ ] 8.2.1 Finalize `utils/fs-storage.ts` implementation
- [ ] 8.2.2 Add `createPersistMiddleware()` with debounce
- [ ] 8.2.3 Add `loadPersistedState()` utility for initial hydration
- [ ] 8.2.4 Test persistence with real filesystem

### 8.3 Store Hooks
- [ ] 8.3.1 Create `useStore()` hook for easy component integration
- [ ] 8.3.2 Create `useDispatch()` hook
- [ ] 8.3.3 Create `useSelector()` hook (optional, signals already reactive)

## 9. Validation & Cleanup

### 9.1 Validation
- [ ] 9.1.1 Run `pnpm typecheck` - ensure no type errors
- [ ] 9.1.2 Run `pnpm test` - ensure all tests pass
- [ ] 9.1.3 Run `pnpm build` - ensure build succeeds
- [ ] 9.1.4 Test example apps still work

### 9.2 Cleanup
- [ ] 9.2.1 Remove empty/unused files from old structure
- [ ] 9.2.2 Remove duplicate type definitions
- [ ] 9.2.3 Clean up circular dependencies if any
- [ ] 9.2.4 Final review of all imports
