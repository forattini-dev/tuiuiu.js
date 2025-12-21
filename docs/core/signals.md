# Signals & State

Tuiuiu uses **Signals** for state management. Signals are a reactive primitive that automatically tracks dependencies and triggers updates when values change. This is similar to SolidJS or Preact Signals.

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
