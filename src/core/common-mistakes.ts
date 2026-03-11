export interface CommonMistakeEntry {
  code: 'signals-inside-component-render' | 'theme-after-render' | 'api-pattern-mismatch' | 'arrow-key-empty-input';
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
    code: 'theme-after-render',
    title: 'Calling setTheme() After render()',
    anchor: 'theme-after-render',
    summary: 'Call setTheme() before render() so theming and runtime setup initialize consistently.',
    whyItBreaks: [
      'Theme-dependent setup has already started by the time the app is mounted.',
      'Input/runtime behavior can diverge from what the new theme expects.',
      'Late theme changes are valid for explicit theme switching, but initial setup should happen first.',
    ],
    wrongExample: `const app = render(App);\nsetTheme(darkTheme);`,
    rightExample: `setTheme(darkTheme);\nconst app = render(App);`,
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
