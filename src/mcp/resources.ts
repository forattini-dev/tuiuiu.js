/**
 * Tuiuiu MCP Resources & Resource Templates
 *
 * Provides static resources and dynamic resource templates for
 * accessing Tuiuiu documentation programmatically.
 */

import {
  allComponents,
  allHooks,
  allThemes,
  categories,
  customThemeGuide,
} from './docs-data.js';
import type { ComponentDoc, HookDoc, ThemeDoc, MCPResource } from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface MCPResourceTemplate {
  uriTemplate: string;
  name: string;
  description: string;
  mimeType?: string;
}

export interface MCPResourceContents {
  uri: string;
  mimeType: string;
  text: string;
}

// =============================================================================
// Static Resources
// =============================================================================

/**
 * Get all static resources (components, hooks, themes, guides)
 */
export function getStaticResources(): MCPResource[] {
  const resources: MCPResource[] = [];

  // ─────────────────────────────────────────────────────────────────────────────
  // Component Resources
  // ─────────────────────────────────────────────────────────────────────────────
  for (const comp of allComponents) {
    resources.push({
      uri: `tuiuiu://component/${comp.name}`,
      name: comp.name,
      description: comp.description,
      mimeType: 'text/markdown',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Hook Resources
  // ─────────────────────────────────────────────────────────────────────────────
  for (const hook of allHooks) {
    resources.push({
      uri: `tuiuiu://hook/${hook.name}`,
      name: hook.name,
      description: hook.description,
      mimeType: 'text/markdown',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Theme Resources
  // ─────────────────────────────────────────────────────────────────────────────
  for (const theme of allThemes) {
    resources.push({
      uri: `tuiuiu://theme/${theme.name}`,
      name: theme.name,
      description: theme.description,
      mimeType: 'text/markdown',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Guide Resources
  // ─────────────────────────────────────────────────────────────────────────────
  resources.push({
    uri: 'tuiuiu://guide/getting-started',
    name: 'Getting Started',
    description: 'Quick start guide for Tuiuiu',
    mimeType: 'text/markdown',
  });

  resources.push({
    uri: 'tuiuiu://guide/custom-themes',
    name: 'Custom Themes Guide',
    description: 'How to create and customize Tuiuiu themes',
    mimeType: 'text/markdown',
  });

  resources.push({
    uri: 'tuiuiu://guide/migration-ink',
    name: 'Migration from Ink',
    description: 'Guide for migrating from Ink to Tuiuiu',
    mimeType: 'text/markdown',
  });

  resources.push({
    uri: 'tuiuiu://guide/migration-blessed',
    name: 'Migration from Blessed',
    description: 'Guide for migrating from blessed to Tuiuiu',
    mimeType: 'text/markdown',
  });

  resources.push({
    uri: 'tuiuiu://guide/signals',
    name: 'Signals & Reactivity',
    description: 'Understanding signals and reactive programming in Tuiuiu',
    mimeType: 'text/markdown',
  });

  resources.push({
    uri: 'tuiuiu://guide/layout',
    name: 'Layout System',
    description: 'Flexbox layout system in Tuiuiu',
    mimeType: 'text/markdown',
  });

  resources.push({
    uri: 'tuiuiu://guide/input-handling',
    name: 'Input Handling',
    description: 'Keyboard and mouse input handling in Tuiuiu',
    mimeType: 'text/markdown',
  });

  resources.push({
    uri: 'tuiuiu://guide/animations',
    name: 'Animations',
    description: 'Animation system and spring physics in Tuiuiu',
    mimeType: 'text/markdown',
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // Category Indexes
  // ─────────────────────────────────────────────────────────────────────────────
  for (const category of Object.keys(categories)) {
    resources.push({
      uri: `tuiuiu://category/${category}`,
      name: `${category.charAt(0).toUpperCase() + category.slice(1)} Index`,
      description: `List of all ${category} in Tuiuiu`,
      mimeType: 'text/markdown',
    });
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Examples
  // ─────────────────────────────────────────────────────────────────────────────
  const examples = [
    { id: 'counter', name: 'Basic Counter', desc: 'Simple counter with keyboard input' },
    { id: 'dashboard', name: 'Dashboard', desc: 'Metrics dashboard with charts' },
    { id: 'form', name: 'Form', desc: 'Interactive form with validation' },
    { id: 'file-browser', name: 'File Browser', desc: 'File system explorer' },
    { id: 'data-table', name: 'Data Table', desc: 'Sortable, filterable data table' },
    { id: 'command-palette', name: 'Command Palette', desc: 'VS Code-style command palette' },
    { id: 'wizard', name: 'Multi-step Wizard', desc: 'Onboarding wizard flow' },
    { id: 'game-snake', name: 'Snake Game', desc: 'Classic snake game' },
  ];

  for (const example of examples) {
    resources.push({
      uri: `tuiuiu://example/${example.id}`,
      name: example.name,
      description: example.desc,
      mimeType: 'text/markdown',
    });
  }

  return resources;
}

// =============================================================================
// Resource Templates
// =============================================================================

/**
 * Get resource templates for dynamic resource access
 */
export function getResourceTemplates(): MCPResourceTemplate[] {
  return [
    {
      uriTemplate: 'tuiuiu://component/{name}',
      name: 'Component Documentation',
      description: 'Get documentation for a specific component by name',
      mimeType: 'text/markdown',
    },
    {
      uriTemplate: 'tuiuiu://hook/{name}',
      name: 'Hook Documentation',
      description: 'Get documentation for a specific hook by name',
      mimeType: 'text/markdown',
    },
    {
      uriTemplate: 'tuiuiu://theme/{name}',
      name: 'Theme Documentation',
      description: 'Get details about a specific theme',
      mimeType: 'text/markdown',
    },
    {
      uriTemplate: 'tuiuiu://category/{category}',
      name: 'Category Index',
      description: 'List all items in a category (atoms, molecules, organisms, etc.)',
      mimeType: 'text/markdown',
    },
    {
      uriTemplate: 'tuiuiu://example/{id}',
      name: 'Example Code',
      description: 'Get a complete example by ID',
      mimeType: 'text/markdown',
    },
    {
      uriTemplate: 'tuiuiu://guide/{topic}',
      name: 'Guide',
      description: 'Get a guide on a specific topic',
      mimeType: 'text/markdown',
    },
    {
      uriTemplate: 'tuiuiu://props/{component}',
      name: 'Component Props',
      description: 'Get just the props table for a component',
      mimeType: 'text/markdown',
    },
    {
      uriTemplate: 'tuiuiu://related/{component}',
      name: 'Related Components',
      description: 'Get components related to a specific component',
      mimeType: 'text/markdown',
    },
  ];
}

// =============================================================================
// Resource Content Handlers
// =============================================================================

/**
 * Read a resource by URI
 */
export function readResource(uri: string): MCPResourceContents | null {
  // Parse URI
  const match = uri.match(/^tuiuiu:\/\/(\w+)\/(.+)$/);
  if (!match) return null;

  const [, type, id] = match;

  switch (type) {
    case 'component':
      return readComponentResource(id);
    case 'hook':
      return readHookResource(id);
    case 'theme':
      return readThemeResource(id);
    case 'category':
      return readCategoryResource(id);
    case 'guide':
      return readGuideResource(id);
    case 'example':
      return readExampleResource(id);
    case 'props':
      return readPropsResource(id);
    case 'related':
      return readRelatedResource(id);
    default:
      return null;
  }
}

function readComponentResource(name: string): MCPResourceContents | null {
  const comp = allComponents.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  );
  if (!comp) return null;

  return {
    uri: `tuiuiu://component/${comp.name}`,
    mimeType: 'text/markdown',
    text: formatComponentDoc(comp),
  };
}

function readHookResource(name: string): MCPResourceContents | null {
  const hook = allHooks.find(
    h => h.name.toLowerCase() === name.toLowerCase()
  );
  if (!hook) return null;

  return {
    uri: `tuiuiu://hook/${hook.name}`,
    mimeType: 'text/markdown',
    text: formatHookDoc(hook),
  };
}

function readThemeResource(name: string): MCPResourceContents | null {
  const theme = allThemes.find(
    t => t.name.toLowerCase() === name.toLowerCase()
  );
  if (!theme) return null;

  return {
    uri: `tuiuiu://theme/${theme.name}`,
    mimeType: 'text/markdown',
    text: formatThemeDoc(theme),
  };
}

function readCategoryResource(category: string): MCPResourceContents | null {
  const items = categories[category as keyof typeof categories];
  if (!items) return null;

  let text = `# ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n`;
  text += `${items.length} items in this category.\n\n`;

  for (const name of items) {
    const comp = allComponents.find(c => c.name === name);
    const hook = allHooks.find(h => h.name === name);
    const theme = allThemes.find(t => t.name === name);

    const desc = comp?.description || hook?.description || theme?.description || '';
    text += `- **${name}**: ${desc}\n`;
  }

  return {
    uri: `tuiuiu://category/${category}`,
    mimeType: 'text/markdown',
    text,
  };
}

function readGuideResource(topic: string): MCPResourceContents | null {
  const guides: Record<string, string> = {
    'getting-started': getGettingStartedGuide(),
    'custom-themes': customThemeGuide,
    'migration-ink': getMigrationInkGuide(),
    'migration-blessed': getMigrationBlessedGuide(),
    'signals': getSignalsGuide(),
    'layout': getLayoutGuide(),
    'input-handling': getInputHandlingGuide(),
    'animations': getAnimationsGuide(),
  };

  const content = guides[topic];
  if (!content) return null;

  return {
    uri: `tuiuiu://guide/${topic}`,
    mimeType: 'text/markdown',
    text: content,
  };
}

function readExampleResource(id: string): MCPResourceContents | null {
  const examples: Record<string, string> = {
    counter: getCounterExample(),
    dashboard: getDashboardExample(),
    form: getFormExample(),
    'file-browser': getFileBrowserExample(),
    'data-table': getDataTableExample(),
    'command-palette': getCommandPaletteExample(),
    wizard: getWizardExample(),
    'game-snake': getSnakeGameExample(),
  };

  const content = examples[id];
  if (!content) return null;

  return {
    uri: `tuiuiu://example/${id}`,
    mimeType: 'text/markdown',
    text: content,
  };
}

function readPropsResource(component: string): MCPResourceContents | null {
  const comp = allComponents.find(
    c => c.name.toLowerCase() === component.toLowerCase()
  );
  if (!comp) return null;

  let text = `# ${comp.name} Props\n\n`;
  if (comp.props.length === 0) {
    text += 'This component has no props.\n';
  } else {
    text += '| Name | Type | Required | Default | Description |\n';
    text += '|------|------|----------|---------|-------------|\n';
    for (const prop of comp.props) {
      const def = prop.default ?? '-';
      text += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | ${def} | ${prop.description} |\n`;
    }
  }

  return {
    uri: `tuiuiu://props/${comp.name}`,
    mimeType: 'text/markdown',
    text,
  };
}

function readRelatedResource(component: string): MCPResourceContents | null {
  const comp = allComponents.find(
    c => c.name.toLowerCase() === component.toLowerCase()
  );
  if (!comp) return null;

  let text = `# Components Related to ${comp.name}\n\n`;

  if (comp.relatedComponents && comp.relatedComponents.length > 0) {
    for (const related of comp.relatedComponents) {
      const relatedComp = allComponents.find(c => c.name === related);
      if (relatedComp) {
        text += `## ${relatedComp.name}\n`;
        text += `${relatedComp.description}\n\n`;
      } else {
        text += `- ${related}\n`;
      }
    }
  } else {
    // Find components in the same category
    const sameCategory = allComponents.filter(
      c => c.category === comp.category && c.name !== comp.name
    );
    text += `### Same Category (${comp.category})\n\n`;
    for (const c of sameCategory.slice(0, 5)) {
      text += `- **${c.name}**: ${c.description}\n`;
    }
  }

  return {
    uri: `tuiuiu://related/${comp.name}`,
    mimeType: 'text/markdown',
    text,
  };
}

// =============================================================================
// Formatting Helpers
// =============================================================================

function formatComponentDoc(comp: ComponentDoc): string {
  let output = `# ${comp.name}\n\n`;
  output += `**Category:** ${comp.category}\n\n`;
  output += `${comp.description}\n\n`;

  if (comp.props.length > 0) {
    output += '## Props\n\n';
    output += '| Name | Type | Required | Default | Description |\n';
    output += '|------|------|----------|---------|-------------|\n';
    for (const prop of comp.props) {
      const def = prop.default ?? '-';
      output += `| ${prop.name} | \`${prop.type}\` | ${prop.required ? 'Yes' : 'No'} | ${def} | ${prop.description} |\n`;
    }
    output += '\n';
  }

  if (comp.examples.length > 0) {
    output += '## Examples\n\n';
    for (const example of comp.examples) {
      output += '```typescript\n' + example + '\n```\n\n';
    }
  }

  if (comp.relatedComponents && comp.relatedComponents.length > 0) {
    output += `## Related Components\n\n${comp.relatedComponents.join(', ')}\n`;
  }

  return output;
}

function formatHookDoc(hook: HookDoc): string {
  let output = `# ${hook.name}\n\n`;
  output += `${hook.description}\n\n`;
  output += `## Signature\n\n\`\`\`typescript\n${hook.signature}\n\`\`\`\n\n`;

  if (hook.params.length > 0) {
    output += '## Parameters\n\n';
    output += '| Name | Type | Required | Description |\n';
    output += '|------|------|----------|-------------|\n';
    for (const param of hook.params) {
      output += `| ${param.name} | \`${param.type}\` | ${param.required ? 'Yes' : 'No'} | ${param.description} |\n`;
    }
    output += '\n';
  }

  output += `## Returns\n\n${hook.returns}\n\n`;

  if (hook.examples.length > 0) {
    output += '## Examples\n\n';
    for (const example of hook.examples) {
      output += '```typescript\n' + example + '\n```\n\n';
    }
  }

  return output;
}

function formatThemeDoc(theme: ThemeDoc): string {
  let output = `# ${theme.name} Theme\n\n`;
  output += `${theme.description}\n\n`;
  output += '## Colors\n\n';
  output += '| Name | Value |\n';
  output += '|------|-------|\n';
  for (const [name, value] of Object.entries(theme.colors)) {
    output += `| ${name} | \`${value}\` |\n`;
  }
  output += '\n';
  output += '## Usage\n\n';
  output += '```typescript\n';
  output += `import { setTheme, ${theme.name.toLowerCase().replace(/[- ]/g, '')}Theme } from 'tuiuiu.js';\n`;
  output += `setTheme(${theme.name.toLowerCase().replace(/[- ]/g, '')}Theme);\n`;
  output += '```\n';

  return output;
}

// =============================================================================
// Guide Content
// =============================================================================

function getGettingStartedGuide(): string {
  return `# Getting Started with Tuiuiu

## Installation

\`\`\`bash
npm install tuiuiu.js
# or
pnpm add tuiuiu.js
\`\`\`

## Basic Example

\`\`\`typescript
import { render, Box, Text, useState, useInput, useApp } from 'tuiuiu.js';

function App() {
  const [count, setCount] = useState(0);
  const app = useApp();

  useInput((input, key) => {
    if (key.upArrow) setCount(c => c + 1);
    if (key.downArrow) setCount(c => c - 1);
    if (key.escape) app.exit();
  });

  return Box({ flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, 'Counter'),
    Text({}, \`Count: \${count()}\`),
    Text({ color: 'gray' }, 'Use ↑/↓ to change, ESC to exit')
  );
}

const { waitUntilExit } = render(App);
await waitUntilExit();
\`\`\`

## Core Concepts

1. **Components**: Use \`Box\` for layout, \`Text\` for content
2. **Signals**: Use \`useState\` or \`createSignal\` for reactive state
3. **Hooks**: Use \`useInput\` for keyboard, \`useEffect\` for side effects
4. **Theming**: Use \`setTheme\`, \`getTheme\`, and \`resolveColor\`

## Next Steps

- Explore components with \`tuiuiu://category/atoms\`
- Learn about signals with \`tuiuiu://guide/signals\`
- Try examples with \`tuiuiu://example/dashboard\`
`;
}

function getMigrationInkGuide(): string {
  return `# Migrating from Ink to Tuiuiu

## Key Differences

| Ink | Tuiuiu |
|-----|--------|
| JSX syntax | Function calls |
| React-based | Signal-based |
| \`<Box>\` | \`Box({})\` |
| \`<Text>\` | \`Text({}, 'content')\` |

## JSX to Function Calls

\`\`\`tsx
// Ink (JSX)
<Box flexDirection="column">
  <Text color="green">Hello</Text>
</Box>

// Tuiuiu (Function calls)
Box({ flexDirection: 'column' },
  Text({ color: 'green' }, 'Hello')
)
\`\`\`

## Hooks Mapping

| Ink | Tuiuiu |
|-----|--------|
| useState | useState (same) |
| useEffect | useEffect (same) |
| useInput | useInput (similar API) |
| useApp | useApp (same) |
| useFocus | useFocus (same) |
| useStdin | Not needed |
| useStdout | Not needed |

## Component Mapping

| Ink | Tuiuiu |
|-----|--------|
| Box | Box |
| Text | Text |
| Newline | Newline |
| Spacer | Spacer |
| Static | renderOnce |
| Transform | Use string functions |

## Example Migration

\`\`\`tsx
// Ink
import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';

const App = () => {
  const [count, setCount] = useState(0);
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.upArrow) setCount(c => c + 1);
    if (input === 'q') exit();
  });

  return (
    <Box>
      <Text>Count: {count}</Text>
    </Box>
  );
};

// Tuiuiu
import { render, Box, Text, useState, useInput, useApp } from 'tuiuiu.js';

function App() {
  const [count, setCount] = useState(0);
  const app = useApp();

  useInput((input, key) => {
    if (key.upArrow) setCount(c => c + 1);
    if (input === 'q') app.exit();
  });

  return Box({},
    Text({}, \`Count: \${count()}\`)
  );
}

const { waitUntilExit } = render(App);
await waitUntilExit();
\`\`\`
`;
}

function getMigrationBlessedGuide(): string {
  return `# Migrating from Blessed to Tuiuiu

## Paradigm Shift

Blessed is **imperative** (create widgets, update properties).
Tuiuiu is **declarative** (describe UI, state drives updates).

## Screen → render()

\`\`\`javascript
// Blessed
const blessed = require('blessed');
const screen = blessed.screen({ smartCSR: true });
const box = blessed.box({ content: 'Hello' });
screen.append(box);
screen.render();

// Tuiuiu
import { render, Box, Text } from 'tuiuiu.js';
function App() {
  return Box({}, Text({}, 'Hello'));
}
const { waitUntilExit } = render(App);
\`\`\`

## Widget Mapping

| Blessed | Tuiuiu |
|---------|--------|
| box | Box |
| text | Text |
| list | Select or custom |
| table | Table / DataTable |
| textbox | TextInput |
| button | Button |
| checkbox | Checkbox |
| progressbar | ProgressBar |
| loading | Spinner |
| log | ScrollArea + Text |

## blessed-contrib Mapping

| contrib | Tuiuiu |
|---------|--------|
| line | LineChart |
| bar | BarChart |
| gauge | Gauge |
| sparkline | Sparkline |
| table | DataTable |
| tree | Tree |
| markdown | Markdown |

## Positioning

\`\`\`javascript
// Blessed - absolute positioning
const box = blessed.box({
  top: 0,
  left: 0,
  width: '50%',
  height: '50%',
});

// Tuiuiu - flexbox layout
Box({ width: '50%', height: '50%' },
  // content
)
\`\`\`
`;
}

function getSignalsGuide(): string {
  return `# Signals & Reactivity in Tuiuiu

## What are Signals?

Signals are reactive primitives that automatically track dependencies
and update the UI when their values change.

## Basic Usage

\`\`\`typescript
import { createSignal, createEffect, createMemo } from 'tuiuiu.js';

// Create a signal
const [count, setCount] = createSignal(0);

// Read value (call it as a function)
console.log(count()); // 0

// Update value
setCount(1);
setCount(prev => prev + 1);

// Derived value with memo
const doubled = createMemo(() => count() * 2);

// Side effects
createEffect(() => {
  console.log('Count changed:', count());
});
\`\`\`

## useState (React-like API)

\`\`\`typescript
import { useState } from 'tuiuiu.js';

function Counter() {
  const [count, setCount] = useState(0);

  // Access: count()
  // Update: setCount(n) or setCount(prev => prev + 1)

  return Text({}, \`Count: \${count()}\`);
}
\`\`\`

## Batching Updates

\`\`\`typescript
import { batch } from 'tuiuiu.js';

batch(() => {
  setA(1);
  setB(2);
  setC(3);
}); // Effects run once after batch
\`\`\`

## Common Patterns

### Conditional Rendering
\`\`\`typescript
const [show, setShow] = createSignal(false);
Box({},
  When(show, () => Text({}, 'Visible!'))
)
\`\`\`

### Lists
\`\`\`typescript
const [items, setItems] = createSignal(['a', 'b', 'c']);
Box({},
  Each(items(), (item, index) => Text({}, \`\${index}: \${item}\`))
)
\`\`\`
`;
}

function getLayoutGuide(): string {
  return `# Layout System in Tuiuiu

Tuiuiu uses a **flexbox-based layout system** similar to CSS flexbox.

## Basic Layout

\`\`\`typescript
// Row (default)
Box({ flexDirection: 'row' },
  Text({}, 'Left'),
  Text({}, 'Right'),
)

// Column
Box({ flexDirection: 'column' },
  Text({}, 'Top'),
  Text({}, 'Bottom'),
)
\`\`\`

## Sizing

\`\`\`typescript
// Fixed size
Box({ width: 20, height: 5 })

// Percentage
Box({ width: '50%' })

// Flex grow
Box({ flexGrow: 1 }) // Takes remaining space

// Min/Max
Box({ minWidth: 10, maxWidth: 50 })
\`\`\`

## Alignment

\`\`\`typescript
// Main axis (flexDirection)
Box({ justifyContent: 'center' }) // start, center, end, space-between, space-around

// Cross axis
Box({ alignItems: 'center' }) // start, center, end, stretch
\`\`\`

## Spacing

\`\`\`typescript
// Padding
Box({ padding: 1 })
Box({ paddingX: 2, paddingY: 1 })

// Gap between children
Box({ gap: 1 })
\`\`\`

## Borders

\`\`\`typescript
Box({
  borderStyle: 'round', // single, double, round, bold, none
  borderColor: 'cyan',
})
\`\`\`

## Layout Helpers

\`\`\`typescript
import { VStack, HStack, Center, FullScreen } from 'tuiuiu.js';

VStack({}, ...children)  // Vertical stack
HStack({}, ...children)  // Horizontal stack
Center({}, child)        // Center content
FullScreen({}, child)    // Fill terminal
\`\`\`
`;
}

function getInputHandlingGuide(): string {
  return `# Input Handling in Tuiuiu

## useInput Hook

\`\`\`typescript
import { useInput } from 'tuiuiu.js';

useInput((input, key) => {
  // input: raw character
  // key: parsed key info

  if (input === 'q') exit();
  if (key.upArrow) moveUp();
  if (key.return) submit();
  if (key.ctrl && input === 'c') exit();
});
\`\`\`

## Key Properties

| Property | Description |
|----------|-------------|
| key.upArrow | Up arrow |
| key.downArrow | Down arrow |
| key.leftArrow | Left arrow |
| key.rightArrow | Right arrow |
| key.return | Enter key |
| key.escape | Escape key |
| key.tab | Tab key |
| key.backspace | Backspace |
| key.delete | Delete |
| key.ctrl | Ctrl modifier |
| key.meta | Meta/Cmd modifier |
| key.shift | Shift modifier |

## useHotkeys (Declarative)

\`\`\`typescript
import { useHotkeys } from 'tuiuiu.js';

useHotkeys('ctrl+s', () => save(), { description: 'Save file' });
useHotkeys('ctrl+k', () => openPalette());
useHotkeys(['ctrl+z', 'cmd+z'], () => undo()); // Cross-platform

// With scopes
useHotkeys('escape', () => closeModal(), { scope: 'modal' });
setHotkeyScope('modal'); // Enable modal hotkeys
\`\`\`

## Mouse Input

\`\`\`typescript
import { useMouse } from 'tuiuiu.js';

const { x, y, buttons } = useMouse();

// Or on specific element
Box({
  onClick: (event) => handleClick(event),
  onMouseEnter: () => setHovered(true),
  onMouseLeave: () => setHovered(false),
})
\`\`\`
`;
}

function getAnimationsGuide(): string {
  return `# Animations in Tuiuiu

## Spring Animations

\`\`\`typescript
import { createSpring } from 'tuiuiu.js';

const spring = createSpring({
  stiffness: 150,  // Higher = faster
  damping: 15,     // Higher = less bouncy
});

spring.start(0, 100, (value) => {
  setPosition(value);
});
\`\`\`

## Harmonica Spring

\`\`\`typescript
import { createHarmonicaSpring } from 'tuiuiu.js';

const spring = createHarmonicaSpring({
  frequency: 7,    // Oscillations per second
  damping: 0.75,   // 0-1, how fast it settles
});

spring.start(0, 100, (value) => setOffset(value));
\`\`\`

## Tick System

\`\`\`typescript
import { useTick } from 'tuiuiu.js';

useTick((deltaTime) => {
  // Called every frame (~60 FPS)
  setPosition(pos => pos + velocity * deltaTime);
});
\`\`\`

## Easing Functions

\`\`\`typescript
import { easingFunctions } from 'tuiuiu.js';

// Available: linear, easeIn, easeOut, easeInOut,
// easeInQuad, easeOutQuad, easeInOutQuad,
// easeInCubic, easeOutCubic, easeInOutCubic,
// easeInElastic, easeOutElastic, easeInOutElastic,
// easeInBounce, easeOutBounce, easeInOutBounce
\`\`\`

## Spinner Animations

\`\`\`typescript
import { Spinner } from 'tuiuiu.js';

Spinner({ style: 'dots' })  // 25+ styles available
Spinner({ style: 'bounce', color: 'cyan' })
\`\`\`
`;
}

// =============================================================================
// Example Content
// =============================================================================

function getCounterExample(): string {
  return `# Counter Example

A simple counter demonstrating basic Tuiuiu concepts.

\`\`\`typescript
import { render, Box, Text, useState, useInput, useApp } from 'tuiuiu.js';

function Counter() {
  const [count, setCount] = useState(0);
  const app = useApp();

  useInput((input, key) => {
    if (key.upArrow) setCount(c => c + 1);
    if (key.downArrow) setCount(c => c - 1);
    if (key.escape) app.exit();
  });

  return Box(
    { borderStyle: 'round', padding: 1, flexDirection: 'column' },
    Text({ color: 'cyan', bold: true }, 'Counter'),
    Text({}, \`Count: \${count()}\`),
    Text({ color: 'gray', dim: true }, '↑/↓ to change, ESC to exit'),
  );
}

const { waitUntilExit } = render(Counter);
await waitUntilExit();
\`\`\`
`;
}

function getDashboardExample(): string {
  return `# Dashboard Example

A metrics dashboard with live charts.

\`\`\`typescript
import {
  render, Box, Text, Sparkline, ProgressBar,
  useState, useEffect, useFps, Spacer
} from 'tuiuiu.js';

function Dashboard() {
  const [cpuData, setCpuData] = useState<number[]>([]);
  const [memoryUsage, setMemoryUsage] = useState(0);
  const { fps, color: fpsColor } = useFps();

  useEffect(() => {
    const interval = setInterval(() => {
      setCpuData(prev => {
        const newData = [...prev, Math.random() * 100];
        return newData.slice(-30);
      });
      setMemoryUsage(Math.random() * 100);
    }, 1000);
    return () => clearInterval(interval);
  });

  return Box(
    { flexDirection: 'column', padding: 1 },
    // Header
    Box(
      { borderStyle: 'round', paddingX: 1 },
      Text({ bold: true }, 'System Monitor'),
      Spacer({}),
      Text({ color: fpsColor }, \`\${fps} FPS\`),
    ),
    // Metrics
    Box(
      { flexDirection: 'row', gap: 1, marginTop: 1 },
      // CPU
      Box(
        { borderStyle: 'round', padding: 1, flexGrow: 1 },
        Text({ color: 'cyan' }, 'CPU Usage'),
        Sparkline({ data: cpuData(), width: 30, color: 'cyan' }),
      ),
      // Memory
      Box(
        { borderStyle: 'round', padding: 1, width: 20 },
        Text({ color: 'green' }, 'Memory'),
        ProgressBar({
          value: memoryUsage(),
          max: 100,
          width: 15,
          color: 'green',
        }),
        Text({}, \`\${memoryUsage().toFixed(0)}%\`),
      ),
    ),
  );
}

const { waitUntilExit } = render(Dashboard);
await waitUntilExit();
\`\`\`
`;
}

function getFormExample(): string {
  return `# Form Example

Interactive form with validation and keyboard navigation.

\`\`\`typescript
import {
  render, Box, Text, TextInput, Button, Badge,
  useState, useFocus
} from 'tuiuiu.js';

function Form() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name()) newErrors.name = 'Name is required';
    if (!email().includes('@')) newErrors.email = 'Invalid email';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      setSubmitted(true);
    }
  };

  if (submitted()) {
    return Box(
      { borderStyle: 'round', padding: 1 },
      Text({ color: 'green' }, '✓ Form submitted!'),
      Text({}, \`Name: \${name()}\`),
      Text({}, \`Email: \${email()}\`),
    );
  }

  return Box(
    { flexDirection: 'column', borderStyle: 'round', padding: 1, gap: 1 },
    Text({ bold: true }, 'Registration'),
    // Name field
    Box({ flexDirection: 'column' },
      Text({}, 'Name:'),
      TextInput({
        value: name(),
        onChange: setName,
        placeholder: 'Enter name',
      }),
      errors().name ? Badge({ color: 'red' }, errors().name) : null,
    ),
    // Email field
    Box({ flexDirection: 'column' },
      Text({}, 'Email:'),
      TextInput({
        value: email(),
        onChange: setEmail,
        placeholder: 'Enter email',
      }),
      errors().email ? Badge({ color: 'red' }, errors().email) : null,
    ),
    // Submit
    Button({ onPress: handleSubmit }, 'Submit'),
  );
}

const { waitUntilExit } = render(Form);
await waitUntilExit();
\`\`\`
`;
}

function getFileBrowserExample(): string {
  return `# File Browser Example

File explorer with navigation and preview.

\`\`\`typescript
import {
  render, Box, Text, Tree, SplitPanel,
  useState, useInput
} from 'tuiuiu.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

function FileBrowser() {
  const [currentPath, setCurrentPath] = useState(process.cwd());
  const [selected, setSelected] = useState<string | null>(null);
  const [preview, setPreview] = useState('');

  const getFiles = () => {
    try {
      return fs.readdirSync(currentPath()).map(name => {
        const fullPath = path.join(currentPath(), name);
        const stat = fs.statSync(fullPath);
        return {
          name,
          isDirectory: stat.isDirectory(),
          size: stat.size,
        };
      });
    } catch {
      return [];
    }
  };

  const handleSelect = (file: string) => {
    const fullPath = path.join(currentPath(), file);
    if (fs.statSync(fullPath).isDirectory()) {
      setCurrentPath(fullPath);
    } else {
      setSelected(file);
      try {
        setPreview(fs.readFileSync(fullPath, 'utf8').slice(0, 500));
      } catch {
        setPreview('Cannot preview this file');
      }
    }
  };

  return SplitPanel(
    { direction: 'horizontal', sizes: [60, 40] },
    // File list
    Box(
      { flexDirection: 'column', borderStyle: 'round' },
      Text({ bold: true }, currentPath()),
      ...getFiles().map(f =>
        Text(
          {
            color: f.isDirectory ? 'cyan' : 'white',
            backgroundColor: f.name === selected() ? 'blue' : undefined,
          },
          \`\${f.isDirectory ? '📁' : '📄'} \${f.name}\`
        )
      ),
    ),
    // Preview
    Box(
      { borderStyle: 'round', padding: 1 },
      Text({ bold: true }, 'Preview'),
      Text({ color: 'gray' }, preview() || 'Select a file'),
    ),
  );
}

const { waitUntilExit } = render(FileBrowser);
await waitUntilExit();
\`\`\`
`;
}

function getDataTableExample(): string {
  return `# Data Table Example

Interactive data table with sorting and filtering.

\`\`\`typescript
import {
  render, Box, Text, DataTable,
  useState
} from 'tuiuiu.js';

interface User {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive';
}

function UserTable() {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const users: User[] = [
    { id: 1, name: 'Alice', email: 'alice@example.com', status: 'active' },
    { id: 2, name: 'Bob', email: 'bob@example.com', status: 'inactive' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', status: 'active' },
    // ... more data
  ];

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ bold: true }, 'Users'),
    DataTable({
      columns: [
        { key: 'id', title: 'ID', width: 5 },
        { key: 'name', title: 'Name', width: 15 },
        { key: 'email', title: 'Email', width: 25 },
        {
          key: 'status',
          title: 'Status',
          width: 10,
          render: (val) => Text(
            { color: val === 'active' ? 'green' : 'red' },
            val
          ),
        },
      ],
      data: users,
      sortColumn: sortColumn(),
      sortDirection: sortDir(),
      onSort: (col) => {
        if (sortColumn() === col) {
          setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        } else {
          setSortColumn(col);
          setSortDir('asc');
        }
      },
    }),
  );
}

const { waitUntilExit } = render(UserTable);
await waitUntilExit();
\`\`\`
`;
}

function getCommandPaletteExample(): string {
  return `# Command Palette Example

VS Code-style command palette.

\`\`\`typescript
import {
  render, Box, Text, CommandPalette,
  useState, useHotkeys
} from 'tuiuiu.js';

function App() {
  const [isOpen, setIsOpen] = useState(false);
  const [lastCommand, setLastCommand] = useState('');

  useHotkeys('ctrl+k', () => setIsOpen(true));

  const commands = [
    { id: 'new', label: 'New File', shortcut: 'Ctrl+N' },
    { id: 'open', label: 'Open File', shortcut: 'Ctrl+O' },
    { id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
    { id: 'settings', label: 'Settings', shortcut: 'Ctrl+,' },
    { id: 'theme', label: 'Change Theme' },
    { id: 'quit', label: 'Quit', shortcut: 'Ctrl+Q' },
  ];

  return Box(
    { flexDirection: 'column' },
    Text({}, \`Press Ctrl+K to open command palette\`),
    Text({ color: 'gray' }, \`Last command: \${lastCommand() || 'none'}\`),
    isOpen()
      ? CommandPalette({
          commands,
          onSelect: (cmd) => {
            setLastCommand(cmd.label);
            setIsOpen(false);
          },
          onClose: () => setIsOpen(false),
        })
      : null,
  );
}

const { waitUntilExit } = render(App);
await waitUntilExit();
\`\`\`
`;
}

function getWizardExample(): string {
  return `# Multi-step Wizard Example

Onboarding wizard with step navigation.

\`\`\`typescript
import {
  render, Box, Text, Button, ProgressBar, TextInput,
  useState
} from 'tuiuiu.js';

function Wizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({ name: '', email: '', plan: '' });

  const steps = ['Welcome', 'Details', 'Plan', 'Complete'];

  const renderStep = () => {
    switch (step()) {
      case 0:
        return Box({ flexDirection: 'column' },
          Text({ bold: true, color: 'cyan' }, 'Welcome!'),
          Text({}, 'Let\\'s get you set up.'),
        );
      case 1:
        return Box({ flexDirection: 'column', gap: 1 },
          Text({}, 'Name:'),
          TextInput({
            value: data().name,
            onChange: (v) => setData(d => ({ ...d, name: v })),
          }),
          Text({}, 'Email:'),
          TextInput({
            value: data().email,
            onChange: (v) => setData(d => ({ ...d, email: v })),
          }),
        );
      case 2:
        return Box({ flexDirection: 'column' },
          Text({}, 'Select a plan:'),
          Button({
            onPress: () => setData(d => ({ ...d, plan: 'free' })),
          }, 'Free'),
          Button({
            onPress: () => setData(d => ({ ...d, plan: 'pro' })),
          }, 'Pro'),
        );
      case 3:
        return Box({ flexDirection: 'column' },
          Text({ color: 'green', bold: true }, '✓ All done!'),
          Text({}, \`Name: \${data().name}\`),
          Text({}, \`Email: \${data().email}\`),
          Text({}, \`Plan: \${data().plan}\`),
        );
    }
  };

  return Box(
    { flexDirection: 'column', borderStyle: 'round', padding: 1 },
    // Progress
    Box({ marginBottom: 1 },
      Text({}, \`Step \${step() + 1} of \${steps.length}: \${steps[step()]}\`),
      ProgressBar({
        value: step() + 1,
        max: steps.length,
        width: 20,
      }),
    ),
    // Content
    renderStep(),
    // Navigation
    Box({ marginTop: 1, gap: 1 },
      step() > 0 && step() < 3
        ? Button({ onPress: () => setStep(s => s - 1) }, 'Back')
        : null,
      step() < 3
        ? Button({ onPress: () => setStep(s => s + 1) }, 'Next')
        : null,
    ),
  );
}

const { waitUntilExit } = render(Wizard);
await waitUntilExit();
\`\`\`
`;
}

function getSnakeGameExample(): string {
  return `# Snake Game Example

Classic snake game implementation.

\`\`\`typescript
import {
  render, Box, Text,
  useState, useEffect, useInput, useTick
} from 'tuiuiu.js';

type Point = { x: number; y: number };
type Direction = 'up' | 'down' | 'left' | 'right';

function SnakeGame() {
  const WIDTH = 20;
  const HEIGHT = 10;

  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 5 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 5 });
  const [direction, setDirection] = useState<Direction>('right');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);

  useInput((input, key) => {
    if (key.upArrow && direction() !== 'down') setDirection('up');
    if (key.downArrow && direction() !== 'up') setDirection('down');
    if (key.leftArrow && direction() !== 'right') setDirection('left');
    if (key.rightArrow && direction() !== 'left') setDirection('right');
    if (input === 'r' && gameOver()) {
      setSnake([{ x: 10, y: 5 }]);
      setDirection('right');
      setGameOver(false);
      setScore(0);
    }
  });

  useTick(() => {
    if (gameOver()) return;

    const head = snake()[0];
    const newHead = { ...head };

    switch (direction()) {
      case 'up': newHead.y--; break;
      case 'down': newHead.y++; break;
      case 'left': newHead.x--; break;
      case 'right': newHead.x++; break;
    }

    // Check collision
    if (
      newHead.x < 0 || newHead.x >= WIDTH ||
      newHead.y < 0 || newHead.y >= HEIGHT ||
      snake().some(s => s.x === newHead.x && s.y === newHead.y)
    ) {
      setGameOver(true);
      return;
    }

    const newSnake = [newHead, ...snake()];

    // Check food
    if (newHead.x === food().x && newHead.y === food().y) {
      setScore(s => s + 10);
      setFood({
        x: Math.floor(Math.random() * WIDTH),
        y: Math.floor(Math.random() * HEIGHT),
      });
    } else {
      newSnake.pop();
    }

    setSnake(newSnake);
  }, 150); // Game speed in ms

  const renderBoard = () => {
    const rows = [];
    for (let y = 0; y < HEIGHT; y++) {
      let row = '';
      for (let x = 0; x < WIDTH; x++) {
        if (snake().some(s => s.x === x && s.y === y)) {
          row += '█';
        } else if (food().x === x && food().y === y) {
          row += '●';
        } else {
          row += '·';
        }
      }
      rows.push(Text({ color: 'green' }, row));
    }
    return rows;
  };

  return Box(
    { flexDirection: 'column', borderStyle: 'round', padding: 1 },
    Text({ bold: true }, \`SNAKE  Score: \${score()}\`),
    Box({ borderStyle: 'single' }, ...renderBoard()),
    gameOver()
      ? Text({ color: 'red' }, 'GAME OVER - Press R to restart')
      : Text({ color: 'gray' }, 'Use arrow keys to move'),
  );
}

const { waitUntilExit } = render(SnakeGame);
await waitUntilExit();
\`\`\`
`;
}
