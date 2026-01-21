# useState

Local component state with Signal-based reactivity.

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
  useHotkeys('up', () => setCount(c => c + 1));
  return Text({}, `Count: ${count()}`);
}

// ✅ ALSO VALID - createSignal at module level (for global/shared state)
const [globalCount, setGlobalCount] = createSignal(0);

function Counter() {
  useHotkeys('up', () => setGlobalCount(c => c + 1));
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

## Basic Usage

```typescript
import { useState } from 'tuiuiu.js';

function Counter() {
  const [count, setCount] = useState(0);

  return Box({},
    Text({}, `Count: ${count()}`),  // Note: count() not count
    Button({ onPress: () => setCount(c => c + 1) }, 'Increment')
  );
}
```

## Reading State

State values are **functions** (Signals). Call them to read:

```typescript
const [name, setName] = useState('John');

// ✅ Correct - call the function
Text({}, `Hello, ${name()}`)

// ❌ Wrong - this won't update
Text({}, `Hello, ${name}`)
```

## Setting State

### Direct Value

```typescript
setCount(5);
setName('Jane');
setItems([1, 2, 3]);
```

### Updater Function

When the new value depends on the previous:

```typescript
setCount(prev => prev + 1);
setItems(prev => [...prev, newItem]);
setUser(prev => ({ ...prev, name: 'Jane' }));
```

## With Objects

```typescript
const [user, setUser] = useState({ name: 'John', age: 30 });

// Update specific field
setUser(prev => ({ ...prev, age: 31 }));

// Read nested value
Text({}, `Name: ${user().name}`)
```

## With Arrays

```typescript
const [items, setItems] = useState<string[]>([]);

// Add item
setItems(prev => [...prev, 'new item']);

// Remove item
setItems(prev => prev.filter(item => item !== 'old'));

// Update item
setItems(prev => prev.map(item =>
  item.id === id ? { ...item, done: true } : item
));
```

## Lazy Initial Value

For expensive computations, pass a function:

```typescript
// ✅ Computed once on first render
const [data, setData] = useState(() => expensiveComputation());

// ❌ Computed every render (even if not used)
const [data, setData] = useState(expensiveComputation());
```

## Type Inference

```typescript
// Type inferred from initial value
const [count, setCount] = useState(0);         // number
const [name, setName] = useState('John');      // string
const [active, setActive] = useState(false);   // boolean

// Explicit type for complex values
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<Item[]>([]);
```

## Common Patterns

### Toggle

```typescript
const [open, setOpen] = useState(false);
const toggle = () => setOpen(prev => !prev);
```

### Form Input

```typescript
const [value, setValue] = useState('');

TextInput({
  value: value(),
  onChange: setValue,
})
```

### Loading State

```typescript
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);
const [error, setError] = useState(null);

async function fetchData() {
  setLoading(true);
  setError(null);
  try {
    const result = await api.getData();
    setData(result);
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
}
```

## vs createSignal

`useState` is a wrapper around `createSignal` with component lifecycle integration.

| Feature | useState | createSignal |
|:--------|:--------:|:------------:|
| Component-scoped | ✅ | ❌ |
| Global state | ❌ | ✅ |
| Auto-cleanup | ✅ | Manual |
| Use case | Local state | Shared state |

```typescript
// Local state (per component instance)
function Counter() {
  const [count, setCount] = useState(0);
  // ...
}

// Global state (shared across components)
const [theme, setTheme] = createSignal('dark');

function App() {
  // All components share this theme signal
}
```

## API Reference

```typescript
function useState<T>(initialValue: T | (() => T)): [
  () => T,           // getter (Signal)
  (value: T | ((prev: T) => T)) => void  // setter
]
```

| Param | Type | Description |
|:------|:-----|:------------|
| `initialValue` | `T \| (() => T)` | Initial value or lazy initializer |

**Returns:** Tuple of `[getter, setter]`
