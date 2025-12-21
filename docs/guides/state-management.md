# State Management Patterns

Tuiuiu relies on a **Signals** architecture for state management. This guide covers common patterns for managing complex state in your applications.

## 1. Local Component State

For state that is only relevant to a specific component (e.g., whether a collapsible is open), use `createSignal` or `useState` inside the component function.

```typescript
function Counter() {
  // Local state
  const [count, setCount] = createSignal(0);

  return Box({}, 
    Text({}, `Count: ${count()}`),
    Button('Inc', () => setCount(c => c + 1))
  );
}
```

## 2. Global State (Store Pattern)

For data shared across the app (e.g., User Profile, Theme, App Config), create signals outside your components and export them.

```typescript
// store.ts
import { createSignal } from 'tuiuiu';

// Create a singleton store
export const [user, setUser] = createSignal({ name: 'Guest', loggedIn: false });
export const [theme, setTheme] = createSignal('dark');

// Export actions
export function login(name: string) {
  setUser({ name, loggedIn: true });
}
```

```typescript
// Header.ts
import { user } from './store';

function Header() {
  // Subscribes to 'user' automatically
  return Text({}, `Welcome, ${user().name}`);
}
```

## 3. Complex Logic (Reducers)

If your state logic involves many different actions, a reducer pattern might be cleaner. Tuiuiu provides `createReducer` for this.

```typescript
import { createReducer } from 'tuiuiu';

type State = { count: number; lastAction: string };
type Action = { type: 'inc' } | { type: 'dec' } | { type: 'reset' };

const [state, dispatch] = createReducer<State, Action>(
  (state, action) => {
    switch (action.type) {
      case 'inc': return { count: state.count + 1, lastAction: 'increment' };
      case 'dec': return { count: state.count - 1, lastAction: 'decrement' };
      case 'reset': return { count: 0, lastAction: 'reset' };
      default: return state;
    }
  },
  { count: 0, lastAction: 'none' }
);

// Usage
dispatch({ type: 'inc' });
console.log(state().count);
```

## 4. Derived State (Computed/Memo)

Use `createMemo` to create values that automatically update when their dependencies change. This is efficient because it caches the result.

```typescript
const [firstName, setFirst] = createSignal('John');
const [lastName, setLast] = createSignal('Doe');

// Automatically updates when first OR last name changes
const fullName = createMemo(() => `${firstName()} ${lastName()}`);

// Automatically updates when fullName changes
const upperName = createMemo(() => fullName().toUpperCase());
```

## 5. Async State (Resources)

Handling async data (like fetching from an API) typically involves three states: `loading`, `data`, and `error`.

```typescript
function createResource<T>(fetcher: () => Promise<T>) {
  const [data, setData] = createSignal<T | null>(null);
  const [loading, setLoading] = createSignal(true);
  const [error, setError] = createSignal<Error | null>(null);

  // Auto-run on creation
  fetcher()
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));

  return { data, loading, error };
}

// Usage
const users = createResource(fetchUsersApi);

function UserList() {
  if (users.loading()) return Text({}, 'Loading...');
  if (users.error()) return Text({ color: 'red' }, 'Error!');
  
  return Table({ data: users.data() });
}
```

## 6. Avoiding "Prop Drilling" (Context)

While global signals work well, sometimes you want to provide state only to a specific subtree of components. Tuiuiu does not have a formal React `Context` API yet, but you can achieve this using Higher-Order Components or simple module scoping within a feature folder.

*Tip: Since Tuiuiu functions run once to generate the VNode tree (and effects run subsequently), you can pass signals down as props easily without performance penalty.*
