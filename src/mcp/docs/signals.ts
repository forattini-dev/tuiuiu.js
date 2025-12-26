/**
 * Signals Documentation (Core Reactivity)
 */

import type { HookDoc } from '../types.js';

export const signals: HookDoc[] = [
  {
    name: 'createSignal',
    description: 'Create a reactive signal (core primitive for state management).',
    signature: 'createSignal<T>(value: T): [Accessor<T>, Setter<T>]',
    params: [
      { name: 'value', type: 'T', required: true, description: 'Initial value' },
    ],
    returns: 'Tuple of [getter, setter]',
    examples: [
      `const [count, setCount] = createSignal(0);\nconsole.log(count()); // 0\nsetCount(5);\nconsole.log(count()); // 5`,
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
    description: 'Create a Redux-like store for complex state management. Perfect for list components - passing a store-derived accessor to ScrollList/Each automatically updates when items change!',
    signature: 'createStore<S, A>(reducer: Reducer<S, A>, initialState: S): Store<S, A>',
    params: [
      { name: 'reducer', type: '(state: S, action: A) => S', required: true, description: 'Reducer function (state, action) => newState' },
      { name: 'initialState', type: 'S', required: true, description: 'Initial state value' },
    ],
    returns: 'Store with getState(), dispatch(action), subscribe(listener)',
    examples: [
      `// Define reducer\nconst todoReducer = (state = { items: [] }, action) => {\n  switch (action.type) {\n    case 'ADD': return { items: [...state.items, action.payload] };\n    case 'REMOVE': return { items: state.items.filter(i => i.id !== action.payload) };\n    default: return state;\n  }\n};\n\n// Create store\nconst store = createStore(todoReducer, { items: [] });`,
      `// Use with list components - auto-updates!\nScrollList({\n  items: () => store.getState().items,  // Reactive!\n  children: (item) => TodoItem({ item }),\n  height: 20,\n})\n\n// Dispatch updates the list automatically\nstore.dispatch({ type: 'ADD', payload: { id: 1, text: 'New item' } });`,
      `// Subscribe to changes\nconst unsubscribe = store.subscribe(() => {\n  console.log('State changed:', store.getState());\n});`,
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
