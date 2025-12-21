# Implementation Tasks

## Phase 1: Context API (High Priority) ✅ COMPLETED

### 1.1 Core Context Implementation
- [x] 1.1.1 Create `src/primitives/context.ts` with `createContext<T>(defaultValue: T)`
- [x] 1.1.2 Implement Context Provider that updates `_currentValue`
- [x] 1.1.3 Implement `useContext<T>(context: Context<T>)` hook
- [x] 1.1.4 Add context stack for nested providers
- [x] 1.1.5 Export from `src/primitives/index.ts`

### 1.2 Context Tests
- [x] 1.2.1 Test basic context creation and default value
- [x] 1.2.2 Test Provider value override
- [x] 1.2.3 Test nested Provider with different values
- [x] 1.2.4 Test useContext returns current value
- [x] 1.2.5 Test context with signals (reactive updates)

## Phase 2: EventEmitter Input (High Priority) ✅ COMPLETED

### 2.1 Input System Refactor
- [x] 2.1.1 Create internal EventEmitter for input events
- [x] 2.1.2 Refactor `useInput` to use EventEmitter.on/off pattern
- [x] 2.1.3 Add automatic cleanup on unmount
- [x] 2.1.4 Wrap input handler callbacks in `batch()`
- [x] 2.1.5 Update `src/hooks/context.ts` to use EventEmitter

### 2.2 Input Tests
- [x] 2.2.1 Test handler registration with EventEmitter
- [x] 2.2.2 Test handler removal on cleanup
- [x] 2.2.3 Test multiple handlers fire in order
- [x] 2.2.4 Test batch wrapping prevents excess re-renders

## Phase 3: Tab Navigation (High Priority) ✅ COMPLETED

### 3.1 Built-in Tab Handling
- [x] 3.1.1 Add Tab/Shift+Tab detection in render-loop.ts
- [x] 3.1.2 Integrate with FocusManager's focusNext/focusPrevious
- [x] 3.1.3 Add option to disable automatic Tab navigation
- [x] 3.1.4 Handle Escape to blur current focus

### 3.2 Focus Context Migration
- [x] 3.2.1 Create FocusContext using new Context API
- [x] 3.2.2 Migrate FocusManager to use Context Provider
- [x] 3.2.3 Update `useFocus` to consume FocusContext
- [x] 3.2.4 Update `useFocusManager` to consume FocusContext
- [x] 3.2.5 Support both FocusContext and global pattern (backward compat)

### 3.3 Focus Tests
- [x] 3.3.1 Test automatic Tab cycles through focusables
- [x] 3.3.2 Test Shift+Tab cycles backwards
- [x] 3.3.3 Test Escape clears focus
- [x] 3.3.4 Test focus with nested contexts

## Phase 4: Static Output (Medium Priority) ✅ COMPLETED

### 4.1 Static Output Implementation
- [x] 4.1.1 Create `Static` component that renders once
- [x] 4.1.2 Add static output buffer to render-loop
- [x] 4.1.3 Render static content above interactive content
- [x] 4.1.4 Mark static nodes to skip on re-render
- [x] 4.1.5 Export `Static` from components

### 4.2 Static Output Tests
- [x] 4.2.1 Test Static content persists across renders
- [x] 4.2.2 Test Static renders above interactive content
- [x] 4.2.3 Test multiple Static blocks stack correctly

## Phase 5: Raw Mode Counting (Medium Priority) ✅ COMPLETED

### 5.1 Reference Counting
- [x] 5.1.1 Add `rawModeEnabledCount` to app context
- [x] 5.1.2 Create `setRawMode(enabled: boolean)` with counting
- [x] 5.1.3 Update useInput to use setRawMode
- [x] 5.1.4 Ensure cleanup decrements count properly

### 5.2 Raw Mode Tests
- [x] 5.2.1 Test single component enables raw mode
- [x] 5.2.2 Test multiple components share raw mode
- [x] 5.2.3 Test raw mode disabled when all components unmount

## Phase 6: Documentation & Examples ✅ COMPLETED

### 6.1 Documentation
- [x] 6.1.1 Add Context API to docs/hooks/context.md
- [x] 6.1.2 Update docs/hooks/use-focus.md with Tab navigation
- [x] 6.1.3 Add Static component to docs/components/static.md
- [x] 6.1.4 Update sidebar with new pages

### 6.2 Examples
- [x] 6.2.1 Create example: 10-theme-context.ts (light/dark mode)
- [x] 6.2.2 Create example: 11-static-logs.ts (build system logs)
- [x] 6.2.3 Tab navigation works automatically (no example update needed)

## Completion Checklist
- [x] All tests pass (`pnpm test`) - 2019 tests passing
- [x] Type check passes (`pnpm typecheck`)
- [x] Coverage > 80% (`pnpm test:coverage`) - Most files above 80%
- [x] Examples work correctly (10-theme-context.ts, 11-static-logs.ts)
- [x] Documentation updated (context.md, use-focus.md, static.md)
