/**
 * Machine-readable guidance for constructing Tuiuiu calls.
 *
 * Tuiuiu is a plain TypeScript/VNode library. JSX is not part of its API.
 */

export interface ApiPatternDoc {
  name: string;
  description: string;
  components: string[];
  signature: string;
  correctExamples: string[];
  wrongExamples: string[];
  why: string;
}

export const apiPatterns: ApiPatternDoc[] = [
  {
    name: 'Variadic Children',
    description:
      'Free-form layout content follows the props object as variadic children.',
    components: [
      'Box',
      'Text',
      'VStack',
      'HStack',
      'Center',
      'Grid',
      'Fragment',
      'Screen',
      'Header',
      'Main',
      'Footer',
      'Sidebar',
      'Panel',
    ],
    signature: 'Component(props, ...children)',
    correctExamples: [
      `Box({ flexDirection: 'column', gap: 1 },
  Text({ bold: true }, 'Settings'),
  HStack({ gap: 1 },
    Text({}, 'Theme'),
    Spacer(),
    Text({ color: 'cyan' }, 'dark'),
  ),
)`,
      `Grid({ columns: '1fr 2fr', gap: 1 },
  Text({}, 'Name'),
  Text({}, 'Tuiuiu'),
)`,
      `screen(
  header(Title('Dashboard'), Spacer(), Caption('v1.0')),
  main(Content()),
  footer(StatusBar()),
)`,
    ],
    wrongExamples: [
      `Page({ title: 'Settings' }, SettingsForm())
// Page is a named-slot component; its children prop is required.`,
      `Modal({ title: 'Confirm' }, Text({}, 'Continue?'))
// Modal uses the named content prop.`,
    ],
    why:
      'Composition primitives need arbitrary nesting. A single canonical normalization path also makes strings, VNodes, and nested arrays predictable.',
  },
  {
    name: 'Props Children',
    description:
      'Structured components receive named VNode props. The main slot may be called children or content; use the public prop name instead of assuming.',
    components: [
      'Page',
      'AppShell',
      'Modal',
      'Collapsible',
      'FormField',
      'FormGroup',
      'Details',
    ],
    signature: 'Component({ children/content, ...namedSlots })',
    correctExamples: [
      `Page({
  title: 'Settings',
  footer: StatusBar({ left: 'Ready' }),
  children: SettingsForm(),
})`,
      `AppShell({
  header: Header({ title: 'Workspace' }),
  sidebar: Navigation(),
  children: MainContent(),
})`,
      `Modal({
  title: 'Confirm action',
  content: Text({}, 'Continue?'),
  footer: Actions(),
})`,
      `FormField({
  label: 'Email',
  error: errors.email,
  children: TextInput({ onChange: setEmail }),
})`,
    ],
    wrongExamples: [
      `Modal({
  title: 'Confirm action',
  children: Text({}, 'Continue?'),
})
// Modal has content, not children.`,
      `Page({ title: 'Settings' }, SettingsForm())
// Page does not accept variadic children.`,
    ],
    why:
      'Named slots make the ownership of headers, sidebars, footers, main content, and actions explicit and type-checkable.',
  },
  {
    name: 'Data-Driven Content',
    description:
      'Selection and navigation components receive arrays of complete item objects. Content belonging to an item stays inside that item.',
    components: [
      'Tabs',
      'Select',
      'MultiSelect',
      'RadioGroup',
      'Tree',
      'Table',
      'DataTable',
      'ButtonGroup',
      'Accordion',
    ],
    signature: 'Component({ items/tabs/nodes/buttons: Array<Item> })',
    correctExamples: [
      `Tabs({
  tabs: [
    { key: 'files', label: 'Files', content: FilesPanel() },
    { key: 'settings', label: 'Settings', content: SettingsPanel() },
  ],
})`,
      `Select({
  items: [
    { value: 'sm', label: 'Small' },
    { value: 'lg', label: 'Large' },
  ],
  onChange: setSize,
})`,
      `Tree({
  nodes: [{
    id: 'src',
    label: 'src',
    children: [{ id: 'index', label: 'index.ts' }],
  }],
})`,
    ],
    wrongExamples: [
      `Tabs({
  tabs: [{ key: 'files', label: 'Files' }],
  children: FilesPanel(),
})
// Put content inside the matching tab object.`,
      `Select({}, Text({}, 'Small'), Text({}, 'Large'))
// Select is driven by its items prop.`,
    ],
    why:
      'Complete data objects support filtering, ordering, selection, and dynamic updates while preserving stable item identity.',
  },
  {
    name: 'Compound Components',
    description:
      'A stable controller can be shared by multiple renderers. Inside components, prefer the corresponding useXState hook when one exists.',
    components: [
      'AutocompleteInput + AutocompleteSuggestions',
      'ScrollArea',
      'TextInput',
      'Select',
    ],
    signature: 'const state = useXState(options); ComponentA({ state }); ComponentB({ state })',
    correctExamples: [
      `function Search() {
  const state = useAutocompleteState({ items: commands })
  return VStack({},
    AutocompleteInput({ state }),
    AutocompleteSuggestions({ state }),
  )
}`,
      `const input = createTextInput({ multiline: true })

function Prompt() {
  return TextInput({ state: input, fullWidth: true })
}`,
    ],
    wrongExamples: [
      `function Search() {
  const state = createAutocomplete({ items: commands })
  return AutocompleteInput({ state })
}
// This recreates the controller on every render.`,
      `AutocompleteInput({ state: createAutocomplete({ items }) })
AutocompleteSuggestions({ state: createAutocomplete({ items }) })
// These renderers do not share the same controller.`,
    ],
    why:
      'Controller identity must survive rerenders so signals, subscriptions, focus, and keyboard state are not reset or leaked.',
  },
  {
    name: 'Render Function',
    description:
      'Deferred and virtualized collections receive a callback that creates a VNode for an item when it is needed.',
    components: ['ScrollList', 'ChatList', 'Static', 'Each'],
    signature: 'Component({ items, children: (item, index) => VNode })',
    correctExamples: [
      `ScrollList({
  items: messages,
  height: 20,
  children: (message) => ChatBubble({ message }),
})`,
      `Static({
  items: logs,
  children: (line, index) => Text({ key: index }, line),
})`,
      `Box({}, Each(items(), (item) => ListItem({ item })))`,
    ],
    wrongExamples: [
      `ScrollList({
  items: messages,
  children: ChatBubble({ message: messages()[0] }),
})
// Pass the callback, not a VNode created eagerly.`,
    ],
    why:
      'Deferring row creation enables virtualization and lets reactive collections rerender only the rows they need.',
  },
];

export const quickReference = `
## Quick reference

Tuiuiu uses TypeScript function calls and VNodes, never JSX.

| Component shape | Correct form |
|---|---|
| Layout composition | \`Box(props, ...children)\` |
| Stack/grid composition | \`VStack(props, ...children)\`, \`Grid(props, ...children)\` |
| Named slots | \`Page({ children })\`, \`Modal({ content })\` |
| Data collection | \`Tabs({ tabs: [{ content }] })\` |
| Deferred rows | \`ScrollList({ items, children: item => Row(item) })\` |
| Stateful renderer | \`const state = useXState(options); X({ state })\` |

Layout components accept free-form content only as variadic children.
`;

export const componentPatternMap: Record<string, string> = {
  Box: 'variadic',
  Text: 'variadic',
  VStack: 'variadic',
  HStack: 'variadic',
  Center: 'variadic',
  Grid: 'variadic',
  Fragment: 'variadic',
  Screen: 'variadic',
  Header: 'variadic',
  Main: 'variadic',
  Footer: 'variadic',
  Sidebar: 'variadic',
  Panel: 'variadic',
  screen: 'variadic',
  header: 'variadic',
  main: 'variadic',
  footer: 'variadic',
  sidebar: 'variadic',

  Page: 'props',
  AppShell: 'props',
  Modal: 'props',
  Collapsible: 'props',
  FormField: 'props',
  FormGroup: 'props',
  Details: 'props',

  Tabs: 'data',
  Select: 'data',
  MultiSelect: 'data',
  RadioGroup: 'data',
  Tree: 'data',
  Table: 'data',
  DataTable: 'data',
  ButtonGroup: 'data',
  Accordion: 'data',

  AutocompleteInput: 'compound',
  AutocompleteSuggestions: 'compound',
  ScrollArea: 'compound',
  TextInput: 'compound',

  ScrollList: 'render',
  ChatList: 'render',
  Static: 'render',
  Each: 'render',
};

export function getComponentPattern(componentName: string): ApiPatternDoc | undefined {
  const patternName = componentPatternMap[componentName];
  if (!patternName) return undefined;

  const patternNameToDoc: Record<string, string> = {
    variadic: 'Variadic Children',
    props: 'Props Children',
    data: 'Data-Driven Content',
    compound: 'Compound Components',
    render: 'Render Function',
  };

  return apiPatterns.find((pattern) => pattern.name === patternNameToDoc[patternName]);
}
