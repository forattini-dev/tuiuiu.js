/**
 * Signals Documentation (Core Reactivity)
 *
 * ⚠️ CRITICAL: Signals MUST be created at MODULE LEVEL (outside components)!
 * This is the #1 cause of "input works but UI doesn't update" bugs.
 */

import type { HookDoc } from '../types.js';

/**
 * Critical information about signal placement that MUST be shown to users
 */
export const signalCriticalInfo = `
## ⚠️ CRITICAL: Signal Placement

**Signals MUST be created at MODULE LEVEL (outside the component function)!**

This is the #1 cause of "input works but UI doesn't update" bugs.

### ❌ WRONG - Signals inside component (WILL BREAK!)
\`\`\`typescript
function App() {
  const [count, setCount] = createSignal(0);  // Recreated every render!
  useHotkeys('up', () => setCount(c => c + 1));  // Updates OLD signal
  return Text({}, \`Count: \${count()}\`);  // Shows NEW signal (always 0)
}
\`\`\`

### ✅ CORRECT - Signals at module level
\`\`\`typescript
// Outside the component!
const [count, setCount] = createSignal(0);

function App() {
  useHotkeys('up', () => setCount(c => c + 1));  // Updates THE signal
  return Text({}, \`Count: \${count()}\`);  // Shows THE signal
}
\`\`\`

### Why does this happen?
1. Signal changes → reactive effect triggers re-render
2. Component function is called again
3. If signals are inside → NEW signals created with initial values
4. Hotkey handlers still reference OLD signals
5. Updates go to old signals, UI reads new signals = nothing updates

### Also remember:
- Call \`setTheme(darkTheme)\` BEFORE \`render()\`
- Arrow keys have empty \`input\` string (check \`key.upArrow\` instead)
`;

export const signals: HookDoc[] = [
  {
    name: 'createSignal',
    description: '⚠️ CRITICAL: Must be at MODULE LEVEL! Create a reactive signal (core primitive for state management). Signals created inside components will be recreated on each render, causing state loss.',
    signature: 'createSignal<T>(value: T): [Accessor<T>, Setter<T>]',
    params: [
      { name: 'value', type: 'T', required: true, description: 'Initial value' },
    ],
    returns: 'Tuple of [getter, setter]',
    examples: [
      `// ✅ CORRECT - At module level (outside component)\nconst [count, setCount] = createSignal(0);\n\nfunction App() {\n  useHotkeys('up', () => setCount(c => c + 1));\n  return Text({}, \`Count: \${count()}\`);\n}`,
      `// ❌ WRONG - Inside component (will lose state!)\nfunction App() {\n  const [count, setCount] = createSignal(0);  // DON'T DO THIS!\n  // ...\n}`,
    ],
  },
  {
    name: 'createEffect',
    description: 'Run a function that auto-tracks signal dependencies and re-runs when they change.',
    signature: 'createEffect(fn: () => void): void',
    params: [
      { name: 'fn', type: '() => void', required: true, description: 'Effect function' },
    ],
    returns: 'void',
    examples: [
      `createEffect(() => {\n  console.log('Count is now:', count());\n});`,
    ],
  },
  {
    name: 'createMemo',
    description: 'Create a derived/computed value that caches and updates automatically.',
    signature: 'createMemo<T>(fn: () => T): Accessor<T>',
    params: [
      { name: 'fn', type: '() => T', required: true, description: 'Computation function' },
    ],
    returns: 'Accessor function returning the memoized value',
    examples: [
      `const doubled = createMemo(() => count() * 2);\nconsole.log(doubled()); // auto-updates when count changes`,
    ],
  },
  {
    name: 'batch',
    description: 'Batch multiple signal updates into a single re-render.',
    signature: 'batch(fn: () => void): void',
    params: [
      { name: 'fn', type: '() => void', required: true, description: 'Function with multiple updates' },
    ],
    returns: 'void',
    examples: [
      `batch(() => {\n  setX(1);\n  setY(2);\n  setZ(3);\n}); // Only one re-render`,
    ],
  },
  {
    name: 'createStore',
    description: 'Create a Redux-like store for complex shared state. Use `store.state()` for reactive reads inside components and effects.',
    signature: 'createStore<S, A>(reducer: Reducer<S, A>, initialState: S): Store<S, A>',
    params: [
      { name: 'reducer', type: '(state: S, action: A) => S', required: true, description: 'Reducer function (state, action) => newState' },
      { name: 'initialState', type: 'S', required: true, description: 'Initial state value' },
    ],
    returns: 'Store with getState(), state(), dispatch(action), subscribe(listener)',
    examples: [
      `// Define reducer\nconst todoReducer = (state = { items: [] }, action) => {\n  switch (action.type) {\n    case 'ADD': return { items: [...state.items, action.payload] };\n    case 'REMOVE': return { items: state.items.filter(i => i.id !== action.payload) };\n    default: return state;\n  }\n};\n\n// Create store\nconst store = createStore(todoReducer, { items: [] });`,
      `// Use with list components - auto-updates!\nScrollList({\n  items: () => store.state().items,\n  children: (item) => TodoItem({ item }),\n  height: 20,\n})\n\n// Dispatch updates the list automatically\nstore.dispatch({ type: 'ADD', payload: { id: 1, text: 'New item' } });`,
      `// Subscribe to changes\nconst unsubscribe = store.subscribe(() => {\n  console.log('State changed:', store.getState());\n});`,
    ],
  },
  {
    name: 'createPersistedStore',
    description: 'Create a store that hydrates synchronously from persisted JSON before the first read, then saves future updates after dispatch.',
    signature: 'createPersistedStore<S, A>({ reducer, initialState, storage, key?, debounce?, migrate?, merge? }): Store<S, A>',
    params: [
      { name: 'reducer', type: 'Reducer<S, A>', required: true, description: 'Reducer function used by the store' },
      { name: 'initialState', type: 'S', required: true, description: 'Fallback state and merge base' },
      { name: 'storage', type: 'SyncStorageAdapter', required: true, description: 'Synchronous getItem/setItem adapter' },
      { name: 'key', type: 'string', required: false, description: 'Persistence key (defaults to "root")' },
      { name: 'debounce', type: 'number', required: false, description: 'Save debounce in milliseconds' },
      { name: 'migrate', type: '(persisted: unknown) => S', required: false, description: 'Transforms persisted JSON before merge' },
      { name: 'merge', type: '(initialState: S, persistedState: S) => S', required: false, description: 'Overrides default shallow merge for plain objects' },
    ],
    returns: 'Hydrated Store with persistence save-through enabled',
    examples: [
      `const storage = {\n  getItem: (key) => localStorage.getItem(key),\n  setItem: (key, value) => localStorage.setItem(key, value),\n};\n\nconst store = createPersistedStore({\n  reducer,\n  initialState,\n  storage,\n  key: 'app-state',\n  debounce: 250,\n});`,
    ],
  },
  {
    name: 'applyMiddleware',
    description: 'Apply middleware to a store for logging, async actions, etc.',
    signature: 'applyMiddleware<S, A>(...middlewares: Middleware<S, A>[]): StoreEnhancer<S, A>',
    params: [
      { name: 'middlewares', type: 'Middleware[]', required: true, description: 'Middleware functions' },
    ],
    returns: 'Store enhancer function',
    examples: [
      `// Logger middleware\nconst logger = store => next => action => {\n  console.log('dispatching', action);\n  const result = next(action);\n  console.log('next state', store.getState());\n  return result;\n};\n\nconst store = createStore(reducer, initialState);\napplyMiddleware(logger)(store);`,
    ],
  },
];
