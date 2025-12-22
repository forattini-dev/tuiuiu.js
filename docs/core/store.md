# Centralized Store

Tuiuiu includes a built-in Flux-compatible state management solution for complex applications.

## Basic Usage

```typescript
import { createStore } from 'tuiuiu.js';

// Create a store with a reducer
const store = createStore((state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    default:
      return state;
  }
});

// Get current state
console.log(store.getState()); // { count: 0 }

// Subscribe to changes
const unsubscribe = store.subscribe(() => {
  console.log('State changed:', store.getState());
});

// Dispatch actions
store.dispatch({ type: 'INCREMENT' }); // State changed: { count: 1 }
store.dispatch({ type: 'INCREMENT' }); // State changed: { count: 2 }

// Unsubscribe when done
unsubscribe();
```

## With Components

```typescript
import { render, Box, Text, useInput } from 'tuiuiu.js';
import { createStore } from 'tuiuiu.js/primitives';

const store = createStore((state = { count: 0 }, action) => {
  switch (action.type) {
    case 'INCREMENT': return { count: state.count + 1 };
    case 'DECREMENT': return { count: state.count - 1 };
    default: return state;
  }
});

function Counter() {
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    return store.subscribe(() => setState(store.getState()));
  });

  useInput((char, key) => {
    if (key.upArrow) store.dispatch({ type: 'INCREMENT' });
    if (key.downArrow) store.dispatch({ type: 'DECREMENT' });
  });

  return Box({ padding: 1 },
    Text({}, `Count: ${state.count}`)
  );
}
```

## Middleware

Add middleware for logging, async actions, and more:

```typescript
import { createStore, applyMiddleware } from 'tuiuiu.js';

// Logger middleware
const logger = (store) => (next) => (action) => {
  console.log('Dispatching:', action);
  const result = next(action);
  console.log('Next state:', store.getState());
  return result;
};

// Thunk middleware (async actions)
const thunk = (store) => (next) => (action) => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

const store = createStore(
  reducer,
  applyMiddleware(logger, thunk)
);

// Async action with thunk
const fetchData = () => async (dispatch, getState) => {
  dispatch({ type: 'FETCH_START' });
  try {
    const data = await api.getData();
    dispatch({ type: 'FETCH_SUCCESS', payload: data });
  } catch (error) {
    dispatch({ type: 'FETCH_ERROR', error });
  }
};

store.dispatch(fetchData());
```

## Combining Reducers

For larger apps, split reducers by domain:

```typescript
import { createStore, combineReducers } from 'tuiuiu.js';

const usersReducer = (state = [], action) => {
  switch (action.type) {
    case 'ADD_USER':
      return [...state, action.payload];
    default:
      return state;
  }
};

const settingsReducer = (state = { theme: 'dark' }, action) => {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  users: usersReducer,
  settings: settingsReducer,
});

const store = createStore(rootReducer);

// State shape: { users: [], settings: { theme: 'dark' } }
```

## API Reference

### `createStore(reducer, enhancer?)`

Creates a Redux store.

| Param | Type | Description |
|:------|:-----|:------------|
| `reducer` | `(state, action) => state` | Root reducer function |
| `enhancer` | `StoreEnhancer` | Optional enhancer (e.g., `applyMiddleware`) |

**Returns:** `Store`

### `Store` Methods

| Method | Description |
|:-------|:------------|
| `getState()` | Returns current state |
| `dispatch(action)` | Dispatches an action |
| `subscribe(listener)` | Adds a change listener, returns unsubscribe function |
| `replaceReducer(reducer)` | Replaces the current reducer |

### `applyMiddleware(...middlewares)`

Applies middleware to the store's dispatch function.

```typescript
const store = createStore(reducer, applyMiddleware(logger, thunk));
```

### `combineReducers(reducers)`

Combines multiple reducers into one.

```typescript
const rootReducer = combineReducers({
  todos: todosReducer,
  user: userReducer,
});
```

## Comparison with Signals

| Feature | Store | Signals |
|:--------|:-----:|:-------:|
| Global state | ✅ | ✅ |
| Time-travel debugging | ✅ | ❌ |
| Middleware support | ✅ | ❌ |
| DevTools integration | ✅ | ❌ |
| Fine-grained reactivity | ❌ | ✅ |
| Learning curve | Higher | Lower |

**Use Store when:**
- You need middleware (logging, async)
- You want predictable state updates
- Your app has complex state logic
- You need time-travel debugging

**Use Signals when:**
- You want simple, direct state updates
- You need fine-grained reactivity
- Your state logic is straightforward
- You prefer less boilerplate
