# Centralized Store

Tuiuiu includes a reducer-driven store for shared state and middleware-heavy flows.

Use it when you need:
- reducer-based updates
- middleware
- shared state that outgrows local hooks or module-level signals

For most component-local state, prefer `useState()`. For shared reactive state without reducers, prefer `createSignal()` at module scope.

## Basic Usage

```typescript
import { createStore } from 'tuiuiu.js';

const store = createStore(
  (state = { count: 0 }, action) => {
    switch (action.type) {
      case 'INCREMENT':
        return { count: state.count + 1 };
      case 'DECREMENT':
        return { count: state.count - 1 };
      default:
        return state;
    }
  },
  { count: 0 }
);

console.log(store.getState()); // Non-reactive read

const unsubscribe = store.subscribe(() => {
  console.log('State changed:', store.getState());
});

store.dispatch({ type: 'INCREMENT' });
store.dispatch({ type: 'INCREMENT' });

unsubscribe();
```

## Reactive Usage in Components

Inside components, use `store.state()` so reads participate in Tuiuiu's reactive graph.

```typescript
import { render, Box, Text, useShortcut, useApp } from 'tuiuiu.js';
import { createStore } from 'tuiuiu.js/ui';

const store = createStore(
  (state = { count: 0 }, action) => {
    switch (action.type) {
      case 'INCREMENT':
        return { count: state.count + 1 };
      case 'DECREMENT':
        return { count: state.count - 1 };
      default:
        return state;
    }
  },
  { count: 0 }
);

function Counter() {
  const { exit } = useApp();
  const state = store.state();

  useShortcut('up', () => store.dispatch({ type: 'INCREMENT' }));
  useShortcut('down', () => store.dispatch({ type: 'DECREMENT' }));
  useShortcut(['q', 'escape'], exit);

  return Box(
    { padding: 1, borderStyle: 'round' },
    Text({}, `Count: ${state.count}`),
    Text({ dim: true }, 'Up/Down to change, Q to quit')
  );
}

render(Counter);
```

## Middleware

```typescript
import { createStore, applyMiddleware } from 'tuiuiu.js';

const logger = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next state:', store.getState());
  return result;
};

const thunk = (store) => (next) => (action) => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

const store = createStore(
  reducer,
  initialState,
  applyMiddleware(logger, thunk)
);
```

## Persisted Store

Use `createPersistedStore()` when you want explicit synchronous hydration at boot plus debounced saves after dispatches.

```typescript
import {
  createPersistedStore,
  createNodeFsSyncStorage,
} from 'tuiuiu.js';

const storage = createNodeFsSyncStorage({
  dir: './.app-state',
});

const store = createPersistedStore({
  reducer,
  initialState,
  storage,
  key: 'app-state',
  debounce: 250,
});
```

Hydration happens before the store is returned. If persisted data exists, it is parsed and merged with `initialState`. By default, plain-object state is shallow-merged; use `merge` or `migrate` if you need different behavior.

If you are in a browser-like environment, you can also pass a sync adapter backed by `localStorage`.

## Persistence Middleware

`createPersistMiddleware()` is still available as a save-only primitive. It writes state after dispatches, but it does not hydrate initial state from storage.

```typescript
import {
  createStore,
  applyMiddleware,
  createPersistMiddleware,
} from 'tuiuiu.js';

const storage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
};

const persist = createPersistMiddleware({
  key: 'app-state',
  debounce: 250,
  storage,
});

const store = createStore(reducer, initialState, applyMiddleware(persist));
```

Prefer `createPersistedStore()` for the built-in hydration path. Use `createPersistMiddleware()` directly when you already control boot-time loading yourself.

## API Reference

### `createStore(reducer, preloadedState?, enhancer?)`

Creates a reactive reducer store.

### `Store`

| Method | Description |
|:-------|:------------|
| `getState()` | Returns the current state without reactive tracking |
| `state()` | Reactive accessor for components and effects |
| `dispatch(action)` | Dispatches an action |
| `subscribe(listener)` | Adds a change listener and returns `unsubscribe` |
| `replaceReducer(reducer)` | Replaces the current reducer |

### `applyMiddleware(...middlewares)`

Composes middleware around `dispatch`.

### `createPersistedStore(options)`

Creates a store that hydrates synchronously from persisted JSON before the first read, then persists subsequent updates through the save-only middleware.

Supported options:
- `reducer`
- `initialState`
- `storage` (sync `getItem` / `setItem`)
- `key`
- `debounce`
- `migrate`
- `merge`

### `createPersistMiddleware(options)`

Persists state after dispatches using a provided storage adapter.

Supported options:
- `key`
- `debounce`
- `storage`

## Reactive Store (Proxy-based)

`createReactiveStore` provides fine-grained reactivity at the property level. Each property gets its own signal — effects only re-run when the properties they actually read change.

```typescript
import { createReactiveStore, createEffect } from 'tuiuiu.js';

const store = createReactiveStore({
  player: { name: 'Alice', score: 0 },
  settings: { theme: 'dark', volume: 80 },
});

// This effect ONLY re-runs when score changes
createEffect(() => {
  console.log('Score:', store.player.score);
});

// This effect ONLY re-runs when theme changes
createEffect(() => {
  console.log('Theme:', store.settings.theme);
});

store.player.score = 100;    // Only first effect runs
store.settings.theme = 'light'; // Only second effect runs
store.settings.volume = 50;  // Neither effect runs (volume not tracked)
```

### Lazy Proxying

Nested objects become reactive **only when accessed**. A store with 50 properties but where you only read 3 will only create 3 property signals — not 50.

```typescript
const bigStore = createReactiveStore({
  moduleA: { /* lots of data */ },
  moduleB: { /* lots of data */ },
  moduleC: { /* lots of data */ },
});

// Only moduleA becomes reactive — B and C are untouched
createEffect(() => {
  console.log(bigStore.moduleA.status);
});
```

### When to Use

| Need | Use |
|:-----|:----|
| Simple component state | `useState()` |
| Shared global state | `createSignal()` at module level |
| Object with many properties, fine-grained tracking | `createReactiveStore()` |
| Reducer workflow, middleware | `createStore()` |

## Store vs Signals vs Reactive Store

| Feature | createStore | createSignal | createReactiveStore |
|:--------|:-----:|:-------:|:-------:|
| Reducer workflow | ✅ | ❌ | ❌ |
| Middleware | ✅ | ❌ | ❌ |
| Fine-grained field tracking | ❌ | ❌ | ✅ |
| Lazy nested reactivity | ❌ | ❌ | ✅ |
| Boilerplate | Higher | Lower | Lower |
| Best for | Complex state machines | Simple shared values | Object-shaped state |

Use `createStore` when reducers and middleware matter. Use `createSignal` for simple values. Use `createReactiveStore` when you have structured state and want per-property reactivity.
