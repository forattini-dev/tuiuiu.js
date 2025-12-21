# Technical Design: Ink/React Patterns

## Context

After analyzing Ink (25k+ stars) and React source code, we identified patterns that would improve Tuiuiu's architecture. These patterns are battle-tested in production and align with developer expectations from web development.

### Key Learnings

| Pattern | Source | Benefit |
|---------|--------|---------|
| Context API | React | Eliminates prop drilling, enables theming |
| FocusContext | Ink | Clean focus management with Provider |
| EventEmitter Input | Ink | More robust than array push/splice |
| Tab Navigation | Ink | Works automatically, matches expectations |
| Static Output | Ink | Logs persist above interactive UI |
| Raw Mode Counting | Ink | Multiple components can safely use raw mode |

## Goals / Non-Goals

### Goals
- Implement Context API compatible with signals
- Provide automatic Tab/Shift+Tab navigation
- Support static output that persists across renders
- Maintain zero external dependencies
- Preserve backward compatibility

### Non-Goals
- Full React reconciler (we use direct rendering)
- JSX support (we use function calls)
- React DevTools integration (future)
- Concurrent mode / Suspense (future)

## Decisions

### Decision 1: Context API Design

**What**: Simple context with `_currentValue` and Provider pattern

**Why**: React's context is surprisingly simple - just an object with a current value. We can integrate with signals for reactivity.

```typescript
interface Context<T> {
  _currentValue: T;
  _defaultValue: T;
  _stack: T[];  // For nested providers
  Provider: (props: { value: T; children: VNode }) => VNode;
}

function createContext<T>(defaultValue: T): Context<T>;
function useContext<T>(context: Context<T>): T;
```

**Alternatives considered**:
- Full React context with Consumer component → Overkill for our use case
- Observable-based context → Adds complexity, signals already handle reactivity

### Decision 2: EventEmitter for Input

**What**: Use Node.js built-in EventEmitter for input events

**Why**:
- Zero dependencies (Node.js built-in)
- Robust on/off cleanup pattern
- Well-tested in Ink production use

```typescript
// Before (current)
inputHandlers: InputHandler[] = [];
inputHandlers.push(handler);
inputHandlers.splice(index, 1);

// After
internal_eventEmitter = new EventEmitter();
eventEmitter.on('input', handler);
eventEmitter.off('input', handler);  // Cleanup
```

**Alternatives considered**:
- Keep array-based → Less robust cleanup, can have stale handlers
- Custom event system → Reinventing the wheel

### Decision 3: Tab Navigation in Render Loop

**What**: Handle Tab/Shift+Tab at app level, integrated with FocusManager

**Why**: This is expected behavior - users shouldn't need to implement it manually.

```typescript
// In render-loop.ts handleInput
if (input === '\t') {
  focusManager.focusNext();
}
if (input === '\x1b[Z') {  // Shift+Tab
  focusManager.focusPrevious();
}
```

**Options**:
- `disableAutoTabNavigation`: boolean option to opt out

### Decision 4: FocusContext Migration

**What**: Migrate FocusManager from global module to Context

**Why**:
- Clean component tree integration
- Supports multiple focus scopes (modal, sidebar, etc.)
- Matches Ink's proven pattern

```typescript
const FocusContext = createContext<FocusManager | null>(null);

// In render loop
FocusContext.Provider({ value: focusManager },
  App()
)

// In components
const fm = useContext(FocusContext);
```

### Decision 5: Static Output Architecture

**What**: Special `<Static>` component that renders once and persists

**Why**: Logs and debug info shouldn't disappear on re-render

```typescript
function Static(props: { children: VNode }): VNode {
  return Box({
    __internal_static: true,  // Marker for renderer
    ...props
  });
}
```

**Implementation**:
1. Collect static nodes during render
2. Render static content to separate buffer
3. Output: static buffer + newline + interactive buffer
4. On re-render: skip static nodes, only update interactive

## Risks / Trade-offs

### Risk: Breaking existing apps
**Mitigation**: All changes are additive. Existing patterns continue to work.

### Risk: Performance regression with EventEmitter
**Mitigation**: Node.js EventEmitter is highly optimized. Benchmark before/after.

### Risk: Context stack complexity
**Mitigation**: Keep implementation simple - just array push/pop.

## Migration Plan

### Phase 1 (Non-breaking)
- Add Context API as new feature
- Add EventEmitter alongside existing array (dual mode)
- Add Static component

### Phase 2 (Soft deprecation)
- Console.warn for direct getFocusManager() usage
- Migrate internal code to use Context

### Phase 3 (Cleanup - Future major version)
- Remove deprecated global patterns
- EventEmitter only

## Open Questions

1. **Should Context update trigger re-render?**
   - Option A: Yes, using effect → More React-like
   - Option B: No, just value change → Simpler, user manages reactivity
   - **Decision**: Option B - keep simple, signals handle reactivity

2. **How to handle focus in modals?**
   - Nested FocusContext with separate scope
   - Need `restoreFocus` option when modal closes
   - **Deferred**: Implement basic version first

3. **Static output scrolling?**
   - What happens when static content exceeds terminal height?
   - **Deferred**: Start simple, enhance based on feedback
