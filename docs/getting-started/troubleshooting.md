# Troubleshooting

Common issues and how to fix them.

## "State resets on every keypress"

**Cause:** `createSignal()` inside a component. It recreates the signal every render.

```typescript
// ❌ Wrong
function App() {
  const [count, setCount] = createSignal(0); // Recreated!
}

// ✅ Fix: use useState inside components
function App() {
  const [count, setCount] = useState(0); // Persists
}

// ✅ Or: createSignal at module scope
const [count, setCount] = createSignal(0);
```

## "Theme colors don't work"

`setTheme()` is reactive and can be called before or after `render()`. If a
color does not change, verify that the component uses a semantic theme token
instead of a fixed ANSI color.

```typescript
// Fixed color: intentionally unaffected by theme changes
Text({ color: 'red' }, 'Fixed');

// Semantic token: follows the active theme
Text({ color: theme.colors.primary }, 'Themed');

setTheme(darkTheme); // Updates mounted apps reactively
```

## "Arrow keys don't work in useInput"

**Cause:** Arrow keys send empty string as `input`.

```typescript
// ❌ Wrong
useInput((input) => {
  if (input === 'ArrowUp') moveUp(); // Never fires
});

// ✅ Fix: use key object or useHotkeys
useInput((input, key) => {
  if (key.upArrow) moveUp();
});

// ✅ Better: useHotkeys
useHotkeys('up', () => moveUp());
```

## "Hook count changed between renders"

**Cause:** Hooks inside if/else or after early returns.

```typescript
// ❌ Wrong
function App() {
  if (loading()) return Text({}, 'Loading...');
  const [data, setData] = useState(null); // Skipped when loading!
}

// ✅ Fix: all hooks at the top, before any returns
function App() {
  const [data, setData] = useState(null); // Always called
  if (loading()) return Text({}, 'Loading...');
}
```

## "Computed/Memo don't seem to cache"

**Cause:** Nesting hooks inside Computed/Memo callbacks.

```typescript
// ❌ Wrong: ComputedText is a hook — skipped when outer Computed caches
Computed(() => Box({},
  ComputedText(() => `Score: ${score()}`), // Hook inside Computed!
))

// ✅ Fix: keep hooks at component top level
ComputedText(() => `Score: ${score()}`),  // Hook at top level
Computed(() => Box({},                     // No hooks inside
  Text({}, `Lives: ${lives()}`),
))
```

## "Memory leak / high CPU usage"

**Cause:** Effects without cleanup.

```typescript
// ❌ Wrong: timer accumulates on every signal change
useEffect(() => {
  setInterval(tick, 1000); // Never cleared!
});

// ✅ Fix: clean up resources
useEffect(() => {
  const timer = setInterval(tick, 1000);
  onCleanup(() => clearInterval(timer));
});
```

## "Terminal corrupted after crash"

**Cause:** App crashed without proper cleanup.

**Fix:** Run `reset` in your terminal, or press `Ctrl+C` twice.

**Prevention:** Wrap your root component:

```typescript
const SafeApp = withErrorBoundary(App);
render(SafeApp);
```

## "Component shows wrong API pattern"

**Cause:** Using wrong child passing pattern.

```typescript
// Box, Text, VStack → variadic children
Box({}, child1, child2)

// Page, Modal → children prop
Page({ title: 'Home', children: Content() })

// Tabs, Select → data-driven
Tabs({ tabs: [{ key: 'a', label: 'Tab A', content: ... }] })

// ScrollList → render function
ScrollList({ items, children: (item) => Row(item) })
```

See `docs/core/api-patterns.md` for the complete guide.

## Still stuck?

1. Check `docs/core/imports.md` for the right import
2. Run `pnpm storybook` to explore components interactively
3. Check the examples in `examples/` directory
4. Read the MCP docs: `npx tuiuiu.js mcp` for AI assistant guidance
