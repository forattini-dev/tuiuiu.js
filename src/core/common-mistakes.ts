export interface CommonMistakeEntry {
  code: 'signals-inside-component-render' | 'api-pattern-mismatch' | 'arrow-key-empty-input' | 'hooks-called-conditionally' | 'hooks-outside-component' | 'missing-effect-cleanup' | 'nested-hooks-in-computed';
  title: string;
  anchor: string;
  summary: string;
  whyItBreaks: string[];
  wrongExample: string;
  rightExample: string;
}

export const commonMistakes: CommonMistakeEntry[] = [
  {
    code: 'signals-inside-component-render',
    title: 'Signals Inside Component Render',
    anchor: 'signals-inside-component-render',
    summary: 'Do not call createSignal() inside a component render. It recreates state every rerender.',
    whyItBreaks: [
      'Signals created inside the component are replaced every time render runs again.',
      'Input handlers and effects often keep references to the old signal instance.',
      'The UI reads a fresh signal while callbacks mutate an older one, so state appears stuck or resets.',
    ],
    wrongExample: `function App() {\n  const [count, setCount] = createSignal(0);\n  useHotkeys('up', () => setCount(c => c + 1));\n  return Text({}, \`Count: \${count()}\`);\n}`,
    rightExample: `function App() {\n  const [count, setCount] = useState(0);\n  useHotkeys('up', () => setCount(c => c + 1));\n  return Text({}, \`Count: \${count()}\`);\n}\n\n// Or keep createSignal() at module scope.\nconst [sharedCount, setSharedCount] = createSignal(0);`,
  },
  {
    code: 'api-pattern-mismatch',
    title: 'Component API Pattern Mismatch',
    anchor: 'api-pattern-mismatch',
    summary: 'Use the child/content pattern each component expects: variadic, props, render-function, or data-driven.',
    whyItBreaks: [
      'Props-pattern components like Page/AppShell/Modal do not read variadic children the same way as Box.',
      'Render-function components like ScrollList and Static need a function, not a prebuilt VNode.',
      'Data-driven components like Tabs and Accordion expect content inside item objects, not top-level children.',
    ],
    wrongExample: `Page({ title: 'Home' }, Content())\nScrollList({ items, children: Text({}, 'Row') })\nTabs({ tabs, children: Text({}, 'Wrong') })`,
    rightExample: `Page({ title: 'Home', children: Content() })\nScrollList({ items, children: (item) => Row({ item }) })\nTabs({ tabs: [{ key: 'home', label: 'Home', content: Content() }] })`,
  },
  {
    code: 'arrow-key-empty-input',
    title: 'Arrow Keys Have Empty input String',
    anchor: 'arrow-key-empty-input',
    summary: 'Arrow keys pass an empty string as `input` in useInput. Use the `key` object or prefer useHotkeys.',
    whyItBreaks: [
      'useInput(input, key) receives input="" for arrow keys, so string checks like input === "ArrowUp" never match.',
      'Checking input length or treating input as the key name silently does nothing on arrow presses.',
      'useHotkeys("up", fn) is the simpler and correct alternative for arrow key handling.',
    ],
    wrongExample: `useInput((input, key) => {\n  if (input === 'ArrowUp') moveUp();   // never fires\n  if (input === 'ArrowDown') moveDown(); // never fires\n});`,
    rightExample: `// Option 1: useInput with key object\nuseInput((input, key) => {\n  if (key.upArrow) moveUp();\n  if (key.downArrow) moveDown();\n});\n\n// Option 2: useHotkeys (preferred)\nuseHotkeys('up', () => moveUp());\nuseHotkeys('down', () => moveDown());`,
  },
  {
    code: 'hooks-called-conditionally',
    title: 'Hooks Called Conditionally',
    anchor: 'hooks-called-conditionally',
    summary: 'Hooks must always be called in the same order on every render. Do not put hooks inside if/else, loops, or after early returns.',
    whyItBreaks: [
      'Hooks use a global index counter to persist state between renders.',
      'If a hook is skipped (inside an if branch), all subsequent hooks read the wrong slot.',
      'This causes state corruption: useState returns the wrong value, useEffect runs the wrong callback.',
    ],
    wrongExample: `function App() {\n  const [show, setShow] = useState(true);\n  if (show()) {\n    const [name, setName] = useState('Alice'); // WRONG: conditional hook!\n  }\n  useHotkeys('q', () => exit());\n}`,
    rightExample: `function App() {\n  const [show, setShow] = useState(true);\n  const [name, setName] = useState('Alice'); // Always called\n  useHotkeys('q', () => exit());\n  // Use the value conditionally, not the hook:\n  return show() ? Text({}, name()) : Text({}, 'Hidden');\n}`,
  },
  {
    code: 'hooks-outside-component',
    title: 'Hooks Called Outside Component',
    anchor: 'hooks-outside-component',
    summary: 'Hooks like useState, useMemo, useComputed must be called inside a component function, not at module scope or in event handlers.',
    whyItBreaks: [
      'Hooks depend on the render cycle to persist state via hook index.',
      'Outside a render cycle there is no hook state array — data is lost or corrupts other hooks.',
      'Use createSignal() at module scope for global state, not useState().',
    ],
    wrongExample: `// At module scope — no render context!\nconst [count, setCount] = useState(0); // WRONG\n\nfunction App() {\n  return Text({}, \`Count: \${count()}\`);\n}`,
    rightExample: `// Module scope: use createSignal\nconst [count, setCount] = createSignal(0);\n\n// Or inside component: use useState\nfunction App() {\n  const [count, setCount] = useState(0);\n  return Text({}, \`Count: \${count()}\`);\n}`,
  },
  {
    code: 'missing-effect-cleanup',
    title: 'Missing Effect Cleanup',
    anchor: 'missing-effect-cleanup',
    summary: 'Effects that create timers, subscriptions, or event listeners must clean them up to prevent memory leaks.',
    whyItBreaks: [
      'Effects re-run when signal dependencies change. Without cleanup, each re-run adds another timer/listener.',
      'After many signal changes you end up with hundreds of timers running simultaneously.',
      'Use return () => cleanup or onCleanup(() => cleanup) inside the effect.',
    ],
    wrongExample: `useEffect(() => {\n  const timer = setInterval(tick, 1000);\n  // WRONG: timer never cleared!\n});`,
    rightExample: `// Option 1: return cleanup\nuseEffect(() => {\n  const timer = setInterval(tick, 1000);\n  return () => clearInterval(timer);\n});\n\n// Option 2: onCleanup (can call multiple times)\nuseEffect(() => {\n  const timer = setInterval(tick, 1000);\n  onCleanup(() => clearInterval(timer));\n  const socket = connect(url());\n  onCleanup(() => socket.close());\n});`,
  },
  {
    code: 'nested-hooks-in-computed',
    title: 'Nested Hooks Inside Computed/Memo',
    anchor: 'nested-hooks-in-computed',
    summary: 'Do not call hooks (useState, useMemo, ComputedText, etc.) inside a Computed or Memo callback. When the wrapper caches, inner hooks are skipped, changing the hook count.',
    whyItBreaks: [
      'Computed and Memo skip their callback when the cached result is still valid.',
      'If hooks are inside the skipped callback, those hooks don\'t run this render.',
      'The hook count changes between renders, corrupting state for all subsequent hooks.',
    ],
    wrongExample: `Computed(() => {\n  // WRONG: ComputedText is a hook — skipped when Computed caches!\n  return Box({},\n    ComputedText(() => \`Score: \${score()}\`),\n  );\n})`,
    rightExample: `// Keep hooks at the top level of the component\nComputedText(() => \`Score: \${score()}\`),\nComputed(() => {\n  // Only use plain VNode constructors inside Computed\n  return Box({}, Text({}, \`Lives: \${lives()}\`));\n})`,
  },
];

export function getCommonMistake(code: CommonMistakeEntry['code']): CommonMistakeEntry {
  const entry = commonMistakes.find((mistake) => mistake.code === code);
  if (!entry) {
    throw new Error(`Unknown common mistake: ${code}`);
  }
  return entry;
}

export function getCommonMistakeDocsPath(code: CommonMistakeEntry['code']): string {
  return `docs/resources/common-mistakes.md#${getCommonMistake(code).anchor}`;
}

export function getCommonMistakeReference(code: CommonMistakeEntry['code']): string {
  const path = getCommonMistakeDocsPath(code);
  return `See ${path} or tuiuiu://guide/common-mistakes.`;
}

export function getCommonMistakesGuideMarkdown(): string {
  const sections = commonMistakes.map((mistake) => [
    `## ${mistake.title}`,
    '',
    mistake.summary,
    '',
    'Why it breaks:',
    ...mistake.whyItBreaks.map((line) => `- ${line}`),
    '',
    'Wrong:',
    '```typescript',
    mistake.wrongExample,
    '```',
    '',
    'Right:',
    '```typescript',
    mistake.rightExample,
    '```',
  ].join('\n'));

  return [
    '# Common Mistakes',
    '',
    'These are the runtime mistakes the library actively warns about in development mode and the same issues the MCP server should steer agents away from.',
    '',
    ...sections,
  ].join('\n');
}
