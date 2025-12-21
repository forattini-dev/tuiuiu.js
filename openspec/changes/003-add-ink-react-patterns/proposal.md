# Change: Add Ink/React Patterns for Better Developer Experience

## Why

After analyzing Ink (terminal UI library) and React's source code, we identified several architectural patterns that would significantly improve Tuiuiu's developer experience and robustness:

1. **Context API Missing**: Currently using global modules for focus/input management, making component composition harder
2. **No Static Output**: Logs get overwritten on re-render, losing important information
3. **Manual Tab Navigation**: Users must implement Tab/Shift+Tab handling manually
4. **Array-based Input Handlers**: Less robust than EventEmitter pattern
5. **No Raw Mode Reference Counting**: Multiple components requiring raw mode can conflict

These patterns were battle-tested in production libraries (Ink has 25k+ stars, React powers millions of apps).

## What Changes

### High Priority
- **ADDED**: Context API system (`createContext`, `useContext`, Provider pattern)
- **MODIFIED**: Focus management to use Context instead of global module
- **ADDED**: Built-in Tab/Shift+Tab navigation in render loop
- **ADDED**: EventEmitter-based input handling (replacing array)

### Medium Priority
- **ADDED**: Static output support (logs that persist above interactive UI)
- **ADDED**: Raw mode reference counting (multiple components can safely use raw mode)
- **MODIFIED**: Input handlers wrapped in `batch()` for better performance

### Low Priority (Future)
- **ADDED**: Accessibility roles for screen reader support

## Impact

- **Affected specs**: core (new), hooks (modified)
- **Affected code**:
  - `src/primitives/context.ts` (new)
  - `src/hooks/context.ts` (modified)
  - `src/hooks/use-focus.ts` (modified)
  - `src/hooks/use-input.ts` (modified)
  - `src/app/render-loop.ts` (modified)
- **Breaking changes**: None (additive changes)
- **Dependencies**: None (maintains zero-deps philosophy)

## User Stories

1. **As a developer**, I want to share state between deeply nested components without prop drilling, so I can build complex UIs more easily.

2. **As a developer**, I want Tab/Shift+Tab to work automatically between focusable components, so I don't have to implement it manually.

3. **As a developer**, I want to log debug information that doesn't disappear on re-render, so I can debug my apps effectively.

4. **As a developer**, I want multiple input components to coexist without raw mode conflicts.

## Success Criteria

- [ ] Context API works with signals for reactivity
- [ ] Tab navigation works automatically with `useFocus`
- [ ] Static output renders above interactive content
- [ ] All existing tests pass
- [ ] New tests added for each feature (80%+ coverage)
