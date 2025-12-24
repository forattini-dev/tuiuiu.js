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
];
