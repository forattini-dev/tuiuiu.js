/**
 * API Patterns Documentation for MCP
 *
 * CRITICAL: This documentation is essential for AI agents to understand
 * how to correctly construct Tuiuiu component calls. Different components
 * use different patterns - using the wrong pattern will cause failures.
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
  // =============================================================================
  // Pattern 1: Variadic Children
  // =============================================================================
  {
    name: 'Variadic Children',
    description:
      'Children are passed as ADDITIONAL ARGUMENTS after the props object, not inside props. This follows React createElement(type, props, ...children) pattern.',
    components: [
      'Box',
      'Text',
      'VStack',
      'HStack',
      'Center',
      'Fragment',
      'Spacer',
      'Newline',
    ],
    signature: 'Component(props, ...children)',
    correctExamples: [
      `// Children after props
Box({ padding: 1 },
  Text({}, 'First child'),
  Text({}, 'Second child'),
  Text({}, 'Third child')
)`,
      `// Nested composition
Box({ flexDirection: 'column' },
  Box({ flexDirection: 'row' },
    Text({}, 'Left'),
    Text({}, 'Right')
  ),
  Text({}, 'Below')
)`,
      `// Text with string children
Text({ color: 'cyan', bold: true }, 'Hello ', 'World')`,
      `// VStack with gap
VStack({ gap: 1 },
  Text({}, 'Line 1'),
  Text({}, 'Line 2'),
  Text({}, 'Line 3')
)`,
    ],
    wrongExamples: [
      `// WRONG - using children prop
Box({ padding: 1, children: Text({}, 'Child') })
// This may work but is NOT the intended API`,
      `// WRONG - array of children
Box({ padding: 1 }, [Text({}, 'A'), Text({}, 'B')])
// Pass children as separate arguments, not array`,
    ],
    why: 'Layout primitives need maximum flexibility for unlimited children. This pattern enables natural visual nesting where the code structure mirrors the output structure.',
  },

  // =============================================================================
  // Pattern 2: Props Children
  // =============================================================================
  {
    name: 'Props Children',
    description:
      'Children are passed as a NAMED PROP called "children" inside the props object. Used by components with multiple named slots (header, footer, sidebar, children).',
    components: [
      'Page',
      'AppShell',
      'Modal',
      'Collapsible',
      'FormField',
      'FormGroup',
      'Grid',
      'Details',
      'ContentWidth',
    ],
    signature: 'Component({ children: VNode, ...otherSlots })',
    correctExamples: [
      `// Page with children as prop
Page({
  title: 'Settings',
  footer: StatusBar(),
  children: SettingsForm()  // Main content area
})`,
      `// AppShell with multiple named slots
AppShell({
  header: Header(),         // Slot: header
  sidebar: Navigation(),    // Slot: sidebar
  footer: StatusBar(),      // Slot: footer
  children: MainContent()   // Slot: main content
})`,
      `// FormField wrapping input
FormField({
  label: 'Email',
  error: errors.email,
  helperText: 'We will not share your email',
  children: TextInput({ ...form.field('email') })
})`,
      `// Modal with title and footer
Modal({
  title: 'Confirm Action',
  footer: ButtonGroup({ buttons: [...] }),
  children: Text({}, 'Are you sure?')
})`,
    ],
    wrongExamples: [
      `// WRONG - passing as argument
Page({ title: 'Settings' }, SettingsForm())
// Page does NOT accept variadic children!`,
      `// WRONG - forgetting children
Page({ title: 'Settings' })
// TypeScript error: children is required`,
      `// WRONG - treating like Box
Modal({ padding: 1 }, Text({}, 'Content'))
// Modal uses props children, not variadic!`,
    ],
    why: 'These components have MULTIPLE named slots (header, footer, sidebar, children). The children prop is just ONE of several content areas. This makes it explicit where each piece of content goes.',
  },

  // =============================================================================
  // Pattern 3: Data-Driven Content
  // =============================================================================
  {
    name: 'Data-Driven Content',
    description:
      'Content is defined INSIDE data objects within an array prop. Each item is a complete configuration object with properties like key, label, content, disabled, etc.',
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
    signature: 'Component({ items/tabs/nodes/buttons: Array<{ content?, label, ... }> })',
    correctExamples: [
      `// Tabs - content INSIDE each tab object
Tabs({
  tabs: [
    { key: 'files', label: 'Files', icon: '📁', content: FilesPanel() },
    { key: 'settings', label: 'Settings', icon: '⚙️', content: SettingsPanel() },
    { key: 'help', label: 'Help', disabled: true, content: HelpPanel() },
  ],
  isActive: true,
})`,
      `// Select with items array
Select({
  items: [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ],
  onChange: setSize,
})`,
      `// ButtonGroup with buttons array
ButtonGroup({
  buttons: [
    { label: 'Save', onClick: save, variant: 'solid' },
    { label: 'Cancel', onClick: cancel, variant: 'outline' },
  ],
})`,
      `// Tree with nested children inside nodes
Tree({
  nodes: [
    {
      id: 'src',
      label: 'src',
      icon: '📁',
      children: [
        { id: 'index', label: 'index.ts', icon: '📄' },
        { id: 'utils', label: 'utils.ts', icon: '📄' },
      ]
    },
  ],
})`,
      `// Accordion with sections
Accordion({
  sections: [
    { key: 'general', title: 'General', content: GeneralContent() },
    { key: 'advanced', title: 'Advanced', content: AdvancedContent() },
  ],
})`,
    ],
    wrongExamples: [
      `// WRONG - using children prop for Tabs
Tabs({
  tabs: [...],
  children: SomeContent()  // NO! Tabs doesn't have children prop
})`,
      `// WRONG - content outside of tab object
Tabs({
  tabs: [{ key: 'a', label: 'A' }],  // Missing content!
  content: ContentA()  // NO! content goes INSIDE each tab
})`,
      `// WRONG - content outside of accordion section
Accordion({
  sections: [{ key: 'a', title: 'A' }],
  children: AccordionContent()  // NO!
})`,
    ],
    why: 'Each item is a COMPLETE data object with multiple properties (key, label, icon, disabled, content). This enables dynamic array operations like filter(), map(), and dynamic add/remove. TypeScript can validate the entire structure.',
  },

  // =============================================================================
  // Pattern 4: Compound Components (State Factory)
  // =============================================================================
  {
    name: 'Compound Components',
    description:
      'Multiple components share state via a state factory function (createX). This enables flexible positioning - you can place each piece anywhere in your component hierarchy. The state factory creates all the logic, and the components are just UI renderers.',
    components: [
      'AutocompleteInput + AutocompleteSuggestions',
      'TabPanel',
      'ScrollArea + ScrollAreaContent',
    ],
    signature: 'createX({ options }) → state; ComponentA({ state }); ComponentB({ state })',
    correctExamples: [
      `// Create shared state
const state = createAutocomplete({
  items: countries,
  onSelect: (item) => console.log(item),
})

// Place components ANYWHERE in hierarchy
Box({ flexDirection: 'row', gap: 2 },
  // Input on the left
  AutocompleteInput({ state, width: 20 }),
  // Suggestions on the right
  AutocompleteSuggestions({ state, width: 30 })
)`,
      `// Suggestions ABOVE input
Box({ flexDirection: 'column' },
  AutocompleteSuggestions({ state }),
  AutocompleteInput({ state })
)`,
      `// Suggestions in a completely different panel
Box({ flexDirection: 'row' },
  Box({ width: 30 },
    Text({}, 'Search:'),
    AutocompleteInput({ state })
  ),
  Box({ marginLeft: 2, width: 40 },
    Text({}, 'Results:'),
    AutocompleteSuggestions({ state, autoHide: false })
  )
)`,
      `// Tabs with TabPanel for custom layout
const tabState = createTabs({ tabs: [...] })

Box({ flexDirection: 'row' },
  TabList({ state: tabState }),  // Tab buttons
  Box({ flex: 1 },
    TabPanel({ state: tabState, id: 'home' }, HomeContent()),
    TabPanel({ state: tabState, id: 'settings' }, SettingsContent()),
  )
)`,
    ],
    wrongExamples: [
      `// WRONG - Creating state inside render (recreates every render!)
function MyComponent() {
  const state = createAutocomplete({ items })  // BAD!
  return AutocompleteInput({ state })
}

// RIGHT - Create state OUTSIDE or use useMemo-like pattern
const state = createAutocomplete({ items })
function MyComponent() {
  return AutocompleteInput({ state })
}`,
      `// WRONG - Not sharing state between components
AutocompleteInput({ state: createAutocomplete({ items }) })
AutocompleteSuggestions({ state: createAutocomplete({ items }) })  // Different state!

// RIGHT - Share the SAME state
const state = createAutocomplete({ items })
AutocompleteInput({ state })
AutocompleteSuggestions({ state })  // Same state!`,
    ],
    why: 'Compound components enable maximum flexibility in layout. The state factory holds all logic (keyboard handling, filtering, selection), while the UI components just render. You can position input and dropdown anywhere, even in different parts of the component tree.',
  },

  // =============================================================================
  // Pattern 5: Render Function
  // =============================================================================
  {
    name: 'Render Function',
    description:
      'The children prop is a FUNCTION that receives each item and returns a VNode. Used for list rendering with virtual scrolling or dynamic content. Items can be reactive (signal or store) for auto-updates!',
    components: ['ScrollList', 'ChatList', 'Static', 'Each'],
    signature: 'Component({ items, children: (item, index) => VNode })',
    correctExamples: [
      `// ScrollList with render function
ScrollList({
  items: messages(),
  children: (msg) => ChatBubble({ message: msg }),
  height: 20,
})`,
      `// With Redux-like store - auto-updates on dispatch!
const store = createStore(todoReducer, { items: [] });

ScrollList({
  items: () => store.getState().items,  // Reactive!
  children: (item) => TodoItem({ item }),
  height: 20,
})

store.dispatch({ type: 'ADD', payload: newItem }); // List re-renders!`,
      `// Static with render function and index
Static({
  items: logs(),
  children: (log, index) => Text({ key: index, color: 'gray' }, log),
})`,
      `// Each for inline lists (helper function, not component)
Box({},
  Each(items(), (item) => ListItem({ item }))
)`,
    ],
    wrongExamples: [
      `// WRONG - passing VNode directly
ScrollList({
  items: messages(),
  children: ChatBubble({ message: messages()[0] })  // NO! Must be function
})`,
      `// WRONG - pre-mapping items
ScrollList({
  items: messages().map(m => ChatBubble({ message: m })),  // NO!
  // children is missing!
})`,
      `// WRONG - forgetting to return VNode
ScrollList({
  items: messages(),
  children: (msg) => { ChatBubble({ message: msg }) }  // Missing return!
})`,
    ],
    why: 'Items is a REACTIVE array that changes over time. The function is called for EACH item when rendering. This enables VIRTUAL SCROLLING (only visible items rendered) and deferred rendering for performance.',
  },
];

// =============================================================================
// Quick Reference
// =============================================================================

export const quickReference = `
# API Patterns Quick Reference

| Pattern | Components | Example |
|---------|------------|---------|
| Variadic | Box, Text, VStack, HStack | \`Box({}, child1, child2)\` |
| Props | Page, AppShell, Modal | \`Page({ children: content })\` |
| Data | Tabs, Select, ButtonGroup | \`Tabs({ tabs: [{ content }] })\` |
| Compound | AutocompleteInput/Suggestions | \`const s = createAutocomplete({}); AutocompleteInput({ state: s })\` |
| Render | ScrollList, Static, Each | \`ScrollList({ items, children: fn })\` |

## Reactive Data Sources

List components (ScrollList, Each, Static) accept reactive data sources:

| Source | Example | Auto-Updates? |
|--------|---------|---------------|
| Static array | \`items: [1, 2, 3]\` | ❌ No |
| Signal | \`items: items\` or \`items: () => items()\` | ✅ Yes |
| Store | \`items: () => store.getState().items\` | ✅ Yes |

\`\`\`typescript
// With createStore (Redux-like)
const store = createStore(todoReducer, { items: [] });

ScrollList({
  items: () => store.getState().items,  // Auto-updates on dispatch!
  children: (item) => TodoItem({ item }),
  height: 20,
});

store.dispatch({ type: 'ADD', payload: newItem }); // List re-renders!
\`\`\`

## Most Common Mistakes

1. **Using children: with Box/Text/VStack/HStack**
   - WRONG: \`Box({ children: Text({}, 'Hi') })\`
   - RIGHT: \`Box({}, Text({}, 'Hi'))\`

2. **Using variadic children with Page/Modal/AppShell**
   - WRONG: \`Page({ title: 'Home' }, Content())\`
   - RIGHT: \`Page({ title: 'Home', children: Content() })\`

3. **Forgetting content inside Tabs/Accordion items**
   - WRONG: \`Tabs({ tabs: [{ key: 'a', label: 'A' }], children: X })\`
   - RIGHT: \`Tabs({ tabs: [{ key: 'a', label: 'A', content: X }] })\`

4. **Passing VNode instead of function to ScrollList**
   - WRONG: \`ScrollList({ items, children: Item({ data }) })\`
   - RIGHT: \`ScrollList({ items, children: (d) => Item({ data: d }) })\`
`;

// =============================================================================
// Component Pattern Lookup
// =============================================================================

export const componentPatternMap: Record<string, string> = {
  // Variadic Children
  Box: 'variadic',
  Text: 'variadic',
  VStack: 'variadic',
  HStack: 'variadic',
  Center: 'variadic',
  Fragment: 'variadic',
  Spacer: 'variadic',
  Newline: 'variadic',

  // Props Children
  Page: 'props',
  AppShell: 'props',
  Modal: 'props',
  Collapsible: 'props',
  FormField: 'props',
  FormGroup: 'props',
  Grid: 'props',
  Details: 'props',
  ContentWidth: 'props',

  // Data-Driven Content
  Tabs: 'data',
  Select: 'data',
  MultiSelect: 'data',
  RadioGroup: 'data',
  Tree: 'data',
  Table: 'data',
  DataTable: 'data',
  ButtonGroup: 'data',
  Accordion: 'data',

  // Compound Components (State Factory)
  AutocompleteInput: 'compound',
  AutocompleteSuggestions: 'compound',
  TabPanel: 'compound',

  // Render Function
  ScrollList: 'render',
  ChatList: 'render',
  Static: 'render',
  Each: 'render',
};

/**
 * Get the API pattern for a component
 */
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

  return apiPatterns.find((p) => p.name === patternNameToDoc[patternName]);
}
