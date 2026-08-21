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
  useShortcut('up', () => setCount(c => c + 1));  // Updates OLD signal
  return Text({}, \`Count: \${count()}\`);  // Shows NEW signal (always 0)
}
\`\`\`

### ✅ CORRECT - Signals at module level
\`\`\`typescript
// Outside the component!
const [count, setCount] = createSignal(0);

function App() {
  useShortcut('up', () => setCount(c => c + 1));  // Updates THE signal
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
- \`setTheme(theme)\` is optional and reactive: call it before the first frame or later for live switching
- Arrow keys have empty \`input\` string (check \`key.upArrow\` instead)
- Read \`tuiuiu://guide/common-mistakes\` for the runtime guardrails behind these warnings
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
      `// ✅ CORRECT - At module level (outside component)\nconst [count, setCount] = createSignal(0);\n\nfunction App() {\n  useShortcut('up', () => setCount(c => c + 1));\n  return Text({}, \`Count: \${count()}\`);\n}`,
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
  {
    name: 'onCleanup',
    description: 'Register a cleanup function inside the current effect scope. More ergonomic than returning a cleanup — can be called at any point during effect execution. Multiple calls are allowed.',
    signature: 'onCleanup(fn: () => void): void',
    params: [
      { name: 'fn', type: '() => void', required: true, description: 'Cleanup function to run when effect re-runs or disposes' },
    ],
    returns: 'void',
    examples: [
      `createEffect(() => {\n  const timer = setInterval(tick, 16);\n  onCleanup(() => clearInterval(timer));\n\n  const socket = connect(url());\n  onCleanup(() => socket.close());\n  // No need to return a cleanup function!\n});`,
    ],
  },
  {
    name: 'createReactiveStore',
    description: 'Create a deeply reactive store with per-property signal tracking. Each property gets its own signal — effects only re-run when the properties they actually read change. Nested objects become reactive lazily (only when accessed).',
    signature: 'createReactiveStore<T extends Record<string, any>>(initial: T): T',
    params: [
      { name: 'initial', type: 'T', required: true, description: 'Initial state object' },
    ],
    returns: 'A reactive proxy of the object',
    examples: [
      `const store = createReactiveStore({\n  player: { name: 'Alice', score: 0 },\n  settings: { theme: 'dark' },\n});\n\n// This effect ONLY re-runs when score changes\ncreateEffect(() => {\n  console.log('Score:', store.player.score);\n});\n\nstore.player.score = 100;       // ✅ triggers effect\nstore.settings.theme = 'light'; // ❌ does NOT trigger effect`,
    ],
  },
  {
    name: 'Computed',
    description: 'Create a fine-grained reactive VNode. The function is evaluated and its signal dependencies are tracked. Only this subtree re-evaluates when its signals change — the parent component does NOT re-run. Use for isolating expensive UI sections.',
    signature: 'Computed(fn: () => VNode | null): VNode',
    params: [
      { name: 'fn', type: '() => VNode | null', required: true, description: 'Function that reads signals and returns a VNode subtree' },
    ],
    returns: 'VNode that updates independently',
    examples: [
      `// Score display — only rebuilds when score() changes\nComputed(() => Text({ bold: true }, \`Score: \${score()}\`))`,
      `// Complex subtree — only rebuilds when its signals change\nComputed(() => {\n  const items = monsters();\n  return Box({},\n    ...items.map(m => Text({}, \`HP: \${m.hp}\`))\n  );\n})`,
    ],
  },
  {
    name: 'ComputedText',
    description: 'Shorthand for Computed + Text. Creates a reactive text node that only updates when the signals it reads change.',
    signature: 'ComputedText(fn: () => string, props?: TextProps): VNode',
    params: [
      { name: 'fn', type: '() => string', required: true, description: 'Function returning text content' },
      { name: 'props', type: 'TextProps', required: false, description: 'Text styling props' },
    ],
    returns: 'Reactive VNode',
    examples: [
      `ComputedText(() => \`Score: \${score()}\`, { color: 'green', bold: true })`,
    ],
  },
  {
    name: 'Memo',
    description: 'Cache a VNode subtree and only rebuild when deps change (shallow comparison). Use for expensive subtrees where you know exactly what should trigger a rebuild.',
    signature: 'Memo(deps: unknown[], fn: () => VNode | null): VNode',
    params: [
      { name: 'deps', type: 'unknown[]', required: true, description: 'Values to watch — rebuild when any changes' },
      { name: 'fn', type: '() => VNode | null', required: true, description: 'Function returning the VNode subtree to cache' },
    ],
    returns: 'Cached VNode',
    examples: [
      `// Only rebuilds when gold or wave changes\nMemo([gold(), wave()], () =>\n  Box({ flexDirection: 'row' },\n    Text({}, \`Gold: \${gold()}\`),\n    Text({}, \`Wave: \${wave()}\`),\n  )\n)`,
      `// Never rebuilds (empty deps) — perfect for static content\nMemo([], () =>\n  Text({ dim: true }, 'WASD: move | B: build | Q: quit')\n)`,
    ],
  },
  {
    name: 'PreText',
    description: 'Render pre-styled text from validated SGR codes while ignoring component text styles. Non-SGR terminal controls are discarded.',
    signature: 'PreText(content: string, props?: Partial<TextProps>): VNode',
    params: [
      { name: 'content', type: 'string', required: true, description: 'String with validated SGR color/style codes already applied' },
      { name: 'props', type: 'Partial<TextProps>', required: false, description: 'Optional layout props (width, height)' },
    ],
    returns: 'VNode whose SGR styles are parsed into structured cells',
    examples: [
      `// Pre-styled game row\nconst row = '\\x1b[32m███\\x1b[0m \\x1b[31m░░░\\x1b[0m';\nPreText(row)`,
      `// Game map with ANSI SGR styling\nBox({ flexDirection: 'column' },\n  ...mapRows.map(row => PreText(row))\n)`,
    ],
  },
];
