# Signals & State

Tuiuiu uses **Signals** for state management. Signals are a reactive primitive that automatically tracks dependencies and triggers updates when values change. This provides fine-grained reactivity.

## ⚠️ Important: `useState` vs `createSignal`

Before diving in, understand when to use each:

| API | Where to use | Persistence |
|-----|--------------|-------------|
| `useState(initial)` | **Inside components** | ✅ Persists across re-renders (it's a hook) |
| `createSignal(initial)` | **Module level only** | ❌ Creates new signal each call |

```typescript
// ✅ RECOMMENDED - useState inside component
function Counter() {
  const [count, setCount] = useState(0);  // Hook - persists!
  useShortcut('up', () => setCount(c => c + 1));
  return Text({}, `Count: ${count()}`);
}

// ✅ ALSO VALID - createSignal at module level (for global/shared state)
const [globalCount, setGlobalCount] = createSignal(0);

function Counter() {
  useShortcut('up', () => setGlobalCount(c => c + 1));
  return Text({}, `Count: ${globalCount()}`);
}

// ❌ WRONG - createSignal inside component (WILL BREAK!)
function Counter() {
  const [count, setCount] = createSignal(0);  // Recreated every render!
  // State will reset on every keypress!
}
```

> **Why does `createSignal` inside components break?**
>
> When a signal changes, the component function is called again. `createSignal(0)` creates a NEW signal with initial value. Handlers still reference the OLD signal. Result: updates are "lost".

See [useState hook](/hooks/use-state.md) for more details.

## Why Signals?

- **Fine-grained Reactivity**: Only the parts of the UI that depend on a signal will re-render.
- **No Dependency Arrays**: You don't need to manually list dependencies — they're tracked automatically.
- **Performance**: Signals are extremely fast and efficient.

## Basic Usage

### `createSignal`

Creates a reactive value. Returns a getter and a setter.

```typescript
import { createSignal } from 'tuiuiu.js';

// Create a signal with initial value 0
const [count, setCount] = createSignal(0);

// Read the value (dependencies are tracked here)
console.log(count()); 

// Update the value
setCount(1);

// Update based on previous value
setCount(prev => prev + 1);
```

### `createEffect`

Runs a side effect whenever dependent signals change.

```typescript
import { createEffect, createSignal } from 'tuiuiu.js';

const [name, setName] = createSignal("Alice");

createEffect(() => {
  // This function runs immediately, and then again whenever `name` changes.
  console.log(`Hello, ${name()}!`);
});

setName("Bob"); // Logs: "Hello, Bob!"
```

### `createMemo`

Creates a derived signal that only updates when its dependencies change. Useful for expensive calculations.

```typescript
import { createMemo, createSignal } from 'tuiuiu.js';

const [count, setCount] = createSignal(0);

const doubleCount = createMemo(() => {
  console.log("Calculating...");
  return count() * 2;
});

console.log(doubleCount()); // Logs: "Calculating...", then 0
console.log(doubleCount()); // Returns 0 (cached)

setCount(1);
console.log(doubleCount()); // Logs: "Calculating...", then 2
```

## Advanced Signals

### `batch`

Batches multiple updates into a single re-render.

```typescript
import { batch } from 'tuiuiu.js';

batch(() => {
  setName("Alice");
  setAge(30);
}); // Only one update triggers here
```

### `untrack`

Reads a signal without creating a dependency.

```typescript
import { untrack } from 'tuiuiu.js';

createEffect(() => {
  console.log(name()); // Tracks `name`
  console.log(untrack(age)); // Reads `age` but doesn't track it
});
```

### `onCleanup`

Register cleanup functions anywhere inside an effect — no need to return them.

```typescript
import { createEffect, onCleanup } from 'tuiuiu.js';

createEffect(() => {
  const id = setInterval(tick, 1000);
  onCleanup(() => clearInterval(id));  // Runs when effect re-runs or disposes

  const socket = connect(url());
  onCleanup(() => socket.close());     // Multiple onCleanup calls are fine

  // No need to return a cleanup function!
});
```

`onCleanup` works alongside the traditional return-based cleanup:

```typescript
createEffect(() => {
  onCleanup(() => console.log('cleanup via onCleanup'));
  return () => console.log('cleanup via return');
  // Both run when the effect re-runs
});
```

### `autoBatch` (Effect option)

Automatically batches rapid signal updates via `queueMicrotask`:

```typescript
import { createEffect, createSignal } from 'tuiuiu.js';

const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log('Count:', count());
}, { autoBatch: true });

// These 100 updates coalesce into 1 effect run
for (let i = 0; i < 100; i++) {
  setCount(i);
}
// Effect runs once after microtask with count = 99
```

> **Note:** Default effects run synchronously (important for `createMemo`). Use `autoBatch` for effects where immediate consistency isn't required.

### `createResource` (Concept)

While not part of the core primitives, you can build async resource loaders using signals easily:

```typescript
const [data, setData] = createSignal(null);
const [loading, setLoading] = createSignal(true);

createEffect(async () => {
  setLoading(true);
  const result = await fetchData();
  setData(result);
  setLoading(false);
});
```
