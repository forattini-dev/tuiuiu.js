# Common Mistakes

This page mirrors the development-mode warnings built into `tuiuiu.js` and the same guidance exposed through MCP at `tuiuiu://guide/common-mistakes`.

## Signals Inside Component Render

Do not call `createSignal()` inside a component render. It recreates state every rerender.

Why it breaks:
- Signals created inside the component are replaced every time render runs again.
- Input handlers and effects often keep references to the old signal instance.
- The UI reads a fresh signal while callbacks mutate an older one, so state appears stuck or resets.

Wrong:

```typescript
function App() {
  const [count, setCount] = createSignal(0);
  useHotkeys('up', () => setCount(c => c + 1));
  return Text({}, `Count: ${count()}`);
}
```

Right:

```typescript
function App() {
  const [count, setCount] = useState(0);
  useHotkeys('up', () => setCount(c => c + 1));
  return Text({}, `Count: ${count()}`);
}

// Or keep createSignal() at module scope.
const [sharedCount, setSharedCount] = createSignal(0);
```

## Theme After Render

Call `setTheme()` before `render()` so theming and runtime setup initialize consistently.

Why it breaks:
- Theme-dependent setup has already started by the time the app is mounted.
- Input/runtime behavior can diverge from what the new theme expects.
- Late theme changes are valid for explicit theme switching, but initial setup should happen first.

Wrong:

```typescript
const app = render(App);
setTheme(darkTheme);
```

Right:

```typescript
setTheme(darkTheme);
const app = render(App);
```

## API Pattern Mismatch

Use the child/content pattern each component expects: variadic, props, render-function, or data-driven.

Why it breaks:
- Props-pattern components like `Page`, `AppShell`, and `Modal` do not read variadic children the same way as `Box`.
- Render-function components like `ScrollList` and `Static` need a function, not a prebuilt `VNode`.
- Data-driven components like `Tabs` and `Accordion` expect content inside item objects, not top-level children.

Wrong:

```typescript
Page({ title: 'Home' }, Content());
ScrollList({ items, children: Text({}, 'Row') });
Tabs({ tabs, children: Text({}, 'Wrong') });
```

Right:

```typescript
Page({ title: 'Home', children: Content() });
ScrollList({ items, children: (item) => Row({ item }) });
Tabs({ tabs: [{ key: 'home', label: 'Home', content: Content() }] });
```

## Arrow Keys Have Empty input String

Arrow keys pass an empty string as `input` in `useInput`. Use the `key` object or prefer `useHotkeys`.

Why it breaks:
- `useInput(input, key)` receives `input=""` for arrow keys, so string checks like `input === "ArrowUp"` never match.
- Checking input length or treating input as the key name silently does nothing on arrow presses.
- `useHotkeys("up", fn)` is the simpler and correct alternative for arrow key handling.

Wrong:

```typescript
useInput((input, key) => {
  if (input === 'ArrowUp') moveUp();   // never fires
  if (input === 'ArrowDown') moveDown(); // never fires
});
```

Right:

```typescript
// Option 1: useInput with key object
useInput((input, key) => {
  if (key.upArrow) moveUp();
  if (key.downArrow) moveDown();
});

// Option 2: useHotkeys (preferred)
useHotkeys('up', () => moveUp());
useHotkeys('down', () => moveDown());
```

See also:
- [API Patterns](/core/api-patterns.md)
- [Quick Start](/getting-started/quick-start.md)
- [MCP Server](/core/mcp.md)
