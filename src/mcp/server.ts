/**
 * Tuiuiu MCP Server
 *
 * Model Context Protocol server for serving component documentation
 * to AI assistants like Claude.
 *
 * Features:
 * - Tools: 12 documentation tools (including tuiuiu_api_patterns and tuiuiu_validate_code)
 * - Resources: Component, hook, theme, and guide resources
 * - Resource Templates: Dynamic URIs for flexible access
 * - Prompts: 15+ pre-defined prompts for common tasks
 * - Completions: Argument autocompletion for tools and prompts
 * - Logging: Structured logging to clients
 *
 * Transports:
 * - stdio (for Claude Code)
 * - HTTP (for web integrations)
 */

import * as readline from 'node:readline';
import * as http from 'node:http';
import { getVersion } from '../version.js';
import {
  allComponents,
  allHooks,
  allThemes,
  categories,
  customThemeGuide,
  apiPatterns,
  apiPatternsQuickReference,
  getComponentPattern,
  promptsApiDocs,
  promptsApiGuide,
  formatPromptDoc,
} from './docs-data.js';
import { prompts, getPromptResult } from './prompts.js';
import {
  getStaticResources,
  getResourceTemplates,
  readResource,
} from './resources.js';
import {
  getPromptCompletions,
  getResourceCompletions,
  getToolCompletions,
} from './completions.js';
import { formatSymbolDocSections, getSymbolDoc, searchSymbolDocs } from './symbol-docs.js';
import { formatValidationResult, validateTuiuiuCode } from './validate-code.js';
import {
  createMCPLogger,
  nullLogger,
  type LogSender,
  type MCPLogNotification,
} from './logging.js';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  MCPTool,
  MCPToolResult,
  MCPToolHandler,
  MCPInitializeResult,
  MCPResource,
  MCPResourceTemplate,
  MCPPrompt,
  MCPPromptResult,
  MCPCompletionResult,
  ComponentDoc,
  HookDoc,
  ErrorCodes,
} from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface MCPServerOptions {
  transport?: 'stdio' | 'http' | 'sse';
  port?: number;
  debug?: boolean;
}

// =============================================================================
// Tool Definitions
// =============================================================================

const tools: MCPTool[] = [
  {
    name: 'tuiuiu_list_components',
    description: 'List all available Tuiuiu components by category. Returns component names grouped by category (primitives, atoms, molecules, organisms, layouts, colors).',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: primitives, atoms, molecules, organisms, layouts, colors, hooks, signals, themes',
        },
      },
    },
  },
  {
    name: 'tuiuiu_get_component',
    description: 'Get detailed documentation for a specific Tuiuiu component including props, types, defaults, and examples.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Component name (e.g., Box, Text, Button, Select)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'tuiuiu_get_hook',
    description: 'Get detailed documentation for a Tuiuiu hook including signature, parameters, return type, and examples.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Hook name (e.g., useState, useInput, useEffect, createSignal)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'tuiuiu_search',
    description: 'Search Tuiuiu documentation for components, hooks, or concepts. Returns matching items with descriptions.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "button", "layout", "state management")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'tuiuiu_list_themes',
    description: 'List all available Tuiuiu themes with their color schemes.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'tuiuiu_create_theme',
    description: 'Get a comprehensive guide on how to create custom themes in Tuiuiu. Explains createTheme, defineTheme, mergeThemes, theme structure, color scales, semantic colors, and component tokens.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'tuiuiu_getting_started',
    description: 'Get a quick start guide for Tuiuiu including installation, basic usage, and core concepts.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'tuiuiu_quickstart',
    description: 'Get a list of cool patterns, recipes, and code snippets for common UI patterns. Includes headers with logos, dashboards, forms, status bars, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Optional: filter by pattern name (header, dashboard, form, status, game, etc)',
        },
      },
    },
  },
  {
    name: 'tuiuiu_version',
    description: 'Get version information about Tuiuiu MCP server and check compatibility with a project version. If projectVersion is provided, returns compatibility analysis.',
    inputSchema: {
      type: 'object',
      properties: {
        projectVersion: {
          type: 'string',
          description: 'The Tuiuiu version used by the project (e.g., "1.0.5"). If provided, checks compatibility with the MCP server version.',
        },
      },
    },
  },
  {
    name: 'tuiuiu_api_patterns',
    description: 'CRITICAL: Get documentation on the 4 API patterns for passing children/content to Tuiuiu components. Different components use different patterns - using the wrong one causes failures. Use this to understand why a user\'s code isn\'t working or to write correct component code.',
    inputSchema: {
      type: 'object',
      properties: {
        component: {
          type: 'string',
          description: 'Optional: component name to get the specific pattern for that component (e.g., "Tabs", "Box", "Page")',
        },
        pattern: {
          type: 'string',
          description: 'Optional: filter by pattern type: "variadic", "props", "data", "render"',
        },
      },
    },
  },
  {
    name: 'tuiuiu_prompts_api',
    description: 'Get documentation for the blocking CLI prompts API. Tuiuiu provides simple, zero-dependency prompts (input, confirm, select, checkbox, autocomplete, number, password) for building CLI wizards and setup scripts.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Optional: specific prompt name (input, confirm, select, checkbox, autocomplete, number, password)',
        },
      },
    },
  },
  {
    name: 'tuiuiu_validate_code',
    description: 'Validate a Tuiuiu code snippet against known runtime pitfalls. Detects createSignal inside component render, setTheme after render, and common API-pattern mismatches.',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Tuiuiu code snippet to analyze',
        },
      },
      required: ['code'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

function handleListComponents(args: Record<string, unknown>): MCPToolResult {
  const category = args.category as string | undefined;

  if (category && category in categories) {
    const items = categories[category as keyof typeof categories];
    return {
      content: [{
        type: 'text',
        text: `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n\n${items.map(name => `- ${name}`).join('\n')}`,
      }],
    };
  }

  // Return all categories
  let output = '# Tuiuiu Components\n\n';
  for (const [cat, items] of Object.entries(categories)) {
    output += `## ${cat.charAt(0).toUpperCase() + cat.slice(1)}\n`;
    output += items.map(name => `- ${name}`).join('\n') + '\n\n';
  }

  return { content: [{ type: 'text', text: output }] };
}

function handleGetComponent(args: Record<string, unknown>): MCPToolResult {
  const name = args.name as string;
  if (!name) {
    return {
      content: [{ type: 'text', text: 'Error: component name is required' }],
      isError: true,
    };
  }

  const component = allComponents.find(
    c => c.name.toLowerCase() === name.toLowerCase()
  );

  if (!component) {
    return {
      content: [{
        type: 'text',
        text: `Component "${name}" not found. Use tuiuiu_list_components to see available components.`,
      }],
      isError: true,
    };
  }

  return { content: [{ type: 'text', text: formatComponentDoc(component) }] };
}

function handleGetHook(args: Record<string, unknown>): MCPToolResult {
  const name = args.name as string;
  if (!name) {
    return {
      content: [{ type: 'text', text: 'Error: hook name is required' }],
      isError: true,
    };
  }

  const hook = allHooks.find(
    h => h.name.toLowerCase() === name.toLowerCase()
  );

  if (!hook) {
    return {
      content: [{
        type: 'text',
        text: `Hook "${name}" not found. Available hooks: ${allHooks.map(h => h.name).join(', ')}`,
      }],
      isError: true,
    };
  }

  return { content: [{ type: 'text', text: formatHookDoc(hook) }] };
}

function handleSearch(args: Record<string, unknown>): MCPToolResult {
  const query = (args.query as string || '').toLowerCase();
  if (!query) {
    return {
      content: [{ type: 'text', text: 'Error: search query is required' }],
      isError: true,
    };
  }

  const results: string[] = [];
  const guides = [
    {
      name: 'Getting Started',
      description: 'Quick start guide covering theme timing, useState, and input basics.',
      uri: 'tuiuiu://guide/getting-started',
      keywords: ['quick start', 'theme', 'input', 'useState', 'createSignal'],
    },
    {
      name: 'Common Mistakes',
      description: 'Runtime guardrails for createSignal placement, setTheme timing, and API-pattern mismatches.',
      uri: 'tuiuiu://guide/common-mistakes',
      keywords: ['common mistakes', 'warning', 'createSignal', 'setTheme', 'Page', 'AppShell', 'ScrollList', 'Tabs'],
    },
    {
      name: 'API Patterns',
      description: 'Critical reference for variadic, props, data-driven, and render-function component patterns.',
      tool: 'tuiuiu_api_patterns',
      keywords: ['api patterns', 'children', 'render function', 'data driven', 'props pattern'],
    },
  ];

  // Search components
  for (const comp of allComponents) {
    if (
      comp.name.toLowerCase().includes(query) ||
      comp.description.toLowerCase().includes(query) ||
      comp.category.toLowerCase().includes(query)
    ) {
      results.push(`**${comp.name}** (${comp.category}): ${comp.description}`);
    }
  }

  // Search hooks
  for (const hook of allHooks) {
    if (
      hook.name.toLowerCase().includes(query) ||
      hook.description.toLowerCase().includes(query)
    ) {
      results.push(`**${hook.name}** (hook): ${hook.description}`);
    }
  }

  // Search themes
  for (const theme of allThemes) {
    if (
      theme.name.toLowerCase().includes(query) ||
      theme.description.toLowerCase().includes(query)
    ) {
      results.push(`**${theme.name}** (theme): ${theme.description}`);
    }
  }

  // Search prompts API
  for (const prompt of promptsApiDocs) {
    if (
      prompt.name.toLowerCase().includes(query) ||
      prompt.description.toLowerCase().includes(query)
    ) {
      results.push(`**${prompt.name}** (prompt): ${prompt.description}`);
    }
  }

  for (const guide of guides) {
    if (
      guide.name.toLowerCase().includes(query) ||
      guide.description.toLowerCase().includes(query) ||
      guide.keywords.some(keyword => keyword.toLowerCase().includes(query) || query.includes(keyword.toLowerCase()))
    ) {
      const ref = 'uri' in guide ? `guide: ${guide.uri}` : `tool: ${guide.tool}`;
      results.push(`**${guide.name}** (${ref}): ${guide.description}`);
    }
  }

  for (const symbol of searchSymbolDocs(query)) {
    results.push(
      `**${symbol.name}** (${symbol.kind}, import: ${symbol.importPath})${symbol.pattern ? ` [pattern: ${symbol.pattern}]` : ''}: ${symbol.summary}`,
    );
  }

  if (results.length === 0) {
    return {
      content: [{ type: 'text', text: `No results found for "${query}".` }],
    };
  }

  return {
    content: [{
      type: 'text',
      text: `# Search Results for "${query}"\n\n${results.join('\n\n')}`,
    }],
  };
}

function handleListThemes(): MCPToolResult {
  let output = '# Available Themes\n\n';
  for (const theme of allThemes) {
    output += `## ${theme.name}\n`;
    output += `${theme.description}\n`;
    output += `Colors: ${JSON.stringify(theme.colors)}\n\n`;
  }
  output += '## Usage\n```typescript\nimport { setTheme, draculaTheme } from \'tuiuiu.js\';\nsetTheme(draculaTheme);\n```';
  output += '\n\n**Tip:** Use `tuiuiu_create_theme` tool to learn how to create your own custom themes.';
  return { content: [{ type: 'text', text: output }] };
}

function handleCreateTheme(): MCPToolResult {
  return { content: [{ type: 'text', text: customThemeGuide }] };
}

function handleGettingStarted(): MCPToolResult {
  const guide = `# Getting Started with Tuiuiu

## Installation

\`\`\`bash
npm install tuiuiu.js
# or
pnpm add tuiuiu.js
\`\`\`

## ⚠️ CRITICAL REQUIREMENTS (Read First!)

Before writing any code, you MUST follow these rules:

### 1. Use \`useState\` inside components, \`createSignal\` at module level
- \`useState()\` - Hook that persists across re-renders (use inside components)
- \`createSignal()\` - Primitive that creates new signal each call (use at module level only)

### 2. Call \`setTheme()\` BEFORE \`render()\`
Required for proper input handling.

### 3. Arrow keys have empty \`input\` string
Use \`key.upArrow\`, \`key.downArrow\`, etc. or \`useHotkeys('up', ...)\`

## Basic Example (Recommended Pattern!)

\`\`\`typescript
import {
  render,
  Box,
  Text,
  useState,      // Use useState for component state!
  useHotkeys,
  useApp,
  setTheme,
  darkTheme,
} from 'tuiuiu.js';

// 1. Set theme BEFORE render (required!)
setTheme(darkTheme);

// 2. Component function with useState
function App() {
  const { exit } = useApp();

  // useState persists across re-renders (it's a hook!)
  const [count, setCount] = useState(0);

  // Hooks go inside component
  useHotkeys('up', () => setCount(c => c + 1));
  useHotkeys('down', () => setCount(c => c - 1));
  useHotkeys('q', () => exit());

  return Box({ flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, 'Counter'),
    Text({}, \`Count: \${count()}\`),
    Text({ color: 'gray' }, 'Use ↑/↓ to change, Q to exit')
  );
}

// 3. Render and wait
const { waitUntilExit } = render(App);
await waitUntilExit();
\`\`\`

## useState vs createSignal

\`\`\`typescript
// ✅ CORRECT - useState inside component (persists!)
function App() {
  const [count, setCount] = useState(0);  // Hook - persists!
  // ...
}

// ✅ CORRECT - createSignal at module level (persists!)
const [count, setCount] = createSignal(0);  // Module level - persists!
function App() { /* use count here */ }

// ❌ WRONG - createSignal inside component (BREAKS!)
function App() {
  const [count, setCount] = createSignal(0);  // Recreated each render!
  // State will reset on every keypress!
}
\`\`\`

## Core Concepts

1. **Components**: Use \`Box\` for layout, \`Text\` for content
2. **State**: Use \`useState\` inside components, \`createSignal\` at module level
3. **Hooks**: Use \`useHotkeys\` or \`useInput\` for keyboard (inside components)
4. **Theming**: Call \`setTheme(darkTheme)\` BEFORE \`render()\`

## Troubleshooting

If input doesn't work or state resets:
1. ✅ Is \`setTheme(darkTheme)\` called BEFORE \`render()\`?
2. ✅ Using \`useState\` (not \`createSignal\`) inside components?
3. ✅ For arrow keys, using \`key.upArrow\` not \`input\`?

## Canonical Pitfalls Guide

For the same mistakes the runtime warns about in development mode, read:

- \`tuiuiu://guide/common-mistakes\`

## Explore Components

Use \`tuiuiu_list_components\` to see all available components.
Use \`tuiuiu_get_component\` with a component name for detailed docs.

## Run Storybook

\`\`\`bash
npx tuiuiu
\`\`\`

This opens an interactive component browser to explore all components.
`;

  return { content: [{ type: 'text', text: guide }] };
}

// =============================================================================
// Quickstart Recipes
// =============================================================================

interface QuickstartRecipe {
  name: string;
  category: string;
  description: string;
  code: string;
  components: string[];
}

const quickstartRecipes: QuickstartRecipe[] = [
  {
    name: 'Header with ASCII Logo',
    category: 'header',
    description: 'Professional header with ASCII art logo on the left using SplitBox with connected borders',
    code: `import { SplitBox, Box, Text, Spacer } from 'tuiuiu.js';

const logo = Box(
  { flexDirection: 'column' },
  Text({ color: 'cyan', bold: true }, '█▀█ █▀▀ █▄▀'),
  Text({ color: 'cyan', bold: true }, '█▀▄ ██▄ █ █'),
);

const info = Box(
  { flexDirection: 'column' },
  Box(
    { flexDirection: 'row' },
    Text({ bold: true }, 'MyApp'),
    Text({ color: 'muted' }, ' v1.0'),
    Spacer({}),
    Text({ color: 'success' }, '60 FPS'),
  ),
  Text({ color: 'muted' }, '📡 Connected'),
);

SplitBox({
  borderStyle: 'round',
  sections: [
    { width: 13, content: logo, valign: 'middle' },
    { flexGrow: 1, content: info },
  ],
  paddingX: 1,
})`,
    components: ['SplitBox', 'Box', 'Text', 'Spacer'],
  },
  {
    name: 'Three-Section Header',
    category: 'header',
    description: 'Header with logo, title center, and status on right',
    code: `import { SplitBox, Box, Text } from 'tuiuiu.js';

SplitBox({
  borderStyle: 'double',
  width: 60,
  sections: [
    { width: 5, content: Text({ color: 'primary', bold: true }, '◆'), align: 'center' },
    { flexGrow: 1, content: Text({ bold: true }, 'ADMIN PANEL'), valign: 'middle' },
    { width: 10, content: Text({ color: 'success' }, '● Online') },
  ],
  paddingX: 1,
})`,
    components: ['SplitBox', 'Text'],
  },
  {
    name: 'Status Bar with Metrics',
    category: 'status',
    description: 'VS Code-style status bar with live metrics using useFps',
    code: `import { Box, Text, Spacer, useFps } from 'tuiuiu.js';

function StatusBar() {
  const { fps, color } = useFps();

  return Box(
    { flexDirection: 'row', backgroundColor: 'primary', paddingX: 1 },
    Text({ color: 'white' }, '⎇ main'),
    Text({ color: 'white' }, '  ✓ 0 ⚠ 0'),
    Spacer({}),
    Text({ color }, \`\${fps} FPS\`),
    Text({ color: 'white' }, '  TypeScript'),
  );
}`,
    components: ['Box', 'Text', 'Spacer', 'useFps'],
  },
  {
    name: 'Interactive Counter',
    category: 'form',
    description: 'Basic counter with keyboard input handling',
    code: `import { Box, Text, useState, useInput, useApp } from 'tuiuiu.js';

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
    Text({ bold: true }, \`Count: \${count()}\`),
    Text({ color: 'muted', dim: true }, '↑/↓ change, ESC exit'),
  );
}`,
    components: ['Box', 'Text', 'useState', 'useInput', 'useApp'],
  },
  {
    name: 'Hotkey Navigation',
    category: 'form',
    description: 'Use useHotkeys for declarative keyboard shortcuts',
    code: `import { Box, Text, useState, useHotkeys, getRegisteredHotkeys, formatHotkeyPlatform } from 'tuiuiu.js';

function App() {
  const [mode, setMode] = useState('normal');

  useHotkeys([
    { key: 'ctrl+s', handler: () => save(), description: 'Save file' },
    { key: 'ctrl+k', handler: () => openPalette(), description: 'Command palette' },
    { key: 'escape', handler: () => setMode('normal'), description: 'Cancel' },
  ]);

  // Display hotkeys
  const hotkeys = getRegisteredHotkeys();
  return Box(
    { flexDirection: 'column' },
    ...hotkeys.map(h =>
      Text({}, \`\${formatHotkeyPlatform(h.key)}: \${h.description}\`)
    ),
  );
}`,
    components: ['useHotkeys', 'getRegisteredHotkeys', 'formatHotkeyPlatform'],
  },
  {
    name: 'Dashboard Cards',
    category: 'dashboard',
    description: 'Metric cards with colored borders',
    code: `import { Box, Text } from 'tuiuiu.js';

function MetricCard({ title, value, color }) {
  return Box(
    { borderStyle: 'round', borderColor: color, padding: 1, width: 15 },
    Text({ color: 'muted', dim: true }, title),
    Text({ color, bold: true }, value),
  );
}

Box(
  { flexDirection: 'row', gap: 1 },
  MetricCard({ title: 'Users', value: '12,543', color: 'primary' }),
  MetricCard({ title: 'Revenue', value: '$45.2k', color: 'success' }),
  MetricCard({ title: 'Orders', value: '892', color: 'warning' }),
)`,
    components: ['Box', 'Text'],
  },
  {
    name: 'Live Sparkline',
    category: 'dashboard',
    description: 'Real-time data visualization with Sparkline',
    code: `import { Box, Text, Sparkline, useState, useEffect } from 'tuiuiu.js';

function LiveChart() {
  const [data, setData] = useState([10, 20, 15, 25, 30]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => [...prev.slice(1), Math.random() * 50]);
    }, 1000);
    return () => clearInterval(interval);
  });

  return Box(
    { borderStyle: 'round', padding: 1, flexDirection: 'column' },
    Text({ bold: true }, 'CPU Usage'),
    Sparkline({ data: data(), width: 30, color: 'cyan' }),
  );
}`,
    components: ['Box', 'Text', 'Sparkline', 'useState', 'useEffect'],
  },
  {
    name: 'Game UI Header',
    category: 'game',
    description: 'Game-style header with health, mana, and gold',
    code: `import { SplitBox, Box, Text } from 'tuiuiu.js';

SplitBox({
  borderStyle: 'double',
  borderColor: 'magenta',
  width: 50,
  sections: [
    {
      width: 5,
      content: Box(
        { flexDirection: 'column' },
        Text({ color: 'magenta', bold: true }, '╔╦╗'),
        Text({ color: 'magenta', bold: true }, ' ║ '),
        Text({ color: 'magenta', bold: true }, ' ╩ '),
      ),
      valign: 'middle',
      align: 'center',
    },
    {
      flexGrow: 1,
      content: Box(
        { flexDirection: 'column' },
        Text({ color: 'magenta', bold: true }, 'TERMINAL QUEST'),
        Text({ color: 'yellow' }, '★★★☆☆ Level 42'),
      ),
      valign: 'middle',
    },
    {
      width: 10,
      content: Box(
        { flexDirection: 'column' },
        Text({}, '♥ 85/100'),
        Text({}, '⚡ 50/50'),
        Text({}, '◆ 1,234'),
      ),
    },
  ],
  paddingX: 1,
})`,
    components: ['SplitBox', 'Box', 'Text'],
  },
  {
    name: 'Command Palette',
    category: 'form',
    description: 'VS Code-style command palette with search and keyboard hints',
    code: `import { Box, Text, Spacer, Divider } from 'tuiuiu.js';

Box(
  { flexDirection: 'column', width: 50, borderStyle: 'round', borderColor: 'primary' },
  // Search input
  Box(
    { paddingX: 1, paddingY: 1, borderStyle: 'single', borderColor: 'border' },
    Text({ color: 'muted' }, '> '),
    Text({}, 'file'),
    Text({ color: 'primary' }, '▋'),
  ),
  // Results
  Box(
    { flexDirection: 'column', padding: 1 },
    Box(
      { backgroundColor: 'primary', paddingX: 1, flexDirection: 'row' },
      Text({ color: 'white' }, '📄 New File'),
      Spacer({}),
      Text({ color: 'white', dim: true }, 'Ctrl+N'),
    ),
    Box(
      { paddingX: 1, flexDirection: 'row' },
      Text({ color: 'muted' }, '📂 Open File'),
      Spacer({}),
      Text({ color: 'muted' }, 'Ctrl+O'),
    ),
  ),
  // Footer
  Box(
    { paddingX: 1, borderStyle: 'single', borderColor: 'border' },
    Text({ color: 'muted', dim: true }, '↑↓ Navigate  ↵ Select  Esc Close'),
  ),
)`,
    components: ['Box', 'Text', 'Spacer', 'Divider'],
  },
  {
    name: 'Theme Switching',
    category: 'theme',
    description: 'Cycle through themes with Tab key',
    code: `import { Box, Text, useInput, setTheme, getTheme, getNextTheme, themes } from 'tuiuiu.js';

function App() {
  useInput((input, key) => {
    if (key.tab) {
      const current = getTheme();
      setTheme(getNextTheme(current));
    }
  });

  const theme = getTheme();
  return Box(
    { borderStyle: 'round', padding: 1 },
    Text({ color: 'primary', bold: true }, \`Theme: \${theme.name}\`),
    Text({ color: 'muted' }, 'Press Tab to change'),
  );
}

// Available themes:
// dark, light, monokai, dracula, nord, solarized-dark,
// gruvbox, tokyo-night, catppuccin, high-contrast-dark, monochrome`,
    components: ['setTheme', 'getTheme', 'getNextTheme', 'themes'],
  },
];

function handleQuickstart(args: Record<string, unknown>): MCPToolResult {
  const pattern = (args.pattern as string || '').toLowerCase();

  let recipes = quickstartRecipes;
  if (pattern) {
    recipes = quickstartRecipes.filter(r =>
      r.category.includes(pattern) ||
      r.name.toLowerCase().includes(pattern) ||
      r.description.toLowerCase().includes(pattern)
    );
  }

  if (recipes.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `No recipes found for "${pattern}". Available categories: header, status, dashboard, form, game, theme`,
      }],
    };
  }

  let output = '# Tuiuiu Quickstart Recipes\n\n';
  output += 'Ready-to-use patterns and code snippets.\n\n';

  for (const recipe of recipes) {
    output += `## ${recipe.name}\n`;
    output += `**Category:** ${recipe.category}\n\n`;
    output += `${recipe.description}\n\n`;
    output += `**Components used:** ${recipe.components.join(', ')}\n\n`;
    output += '```typescript\n' + recipe.code + '\n```\n\n';
    output += '---\n\n';
  }

  output += '## Tips\n\n';
  output += '- Use `tuiuiu_get_component <name>` for detailed component docs\n';
  output += '- Use `tuiuiu_get_hook <name>` for hook documentation\n';
  output += '- Run `npx tuiuiu` to explore components in the interactive storybook\n';

  return { content: [{ type: 'text', text: output }] };
}

/**
 * Parse a semver version string into components
 */
function parseSemver(version: string): { major: number; minor: number; patch: number } | null {
  const match = version.match(/^v?(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
  };
}

interface DocsCompatibility {
  status: 'synced' | 'docs-ahead' | 'docs-behind';
  icon: string;
  message: string;
  tip?: string;
}

/**
 * Check if MCP docs are in sync with project version
 */
function checkDocsCompatibility(mcpVersion: string, projectVersion: string): DocsCompatibility {
  const mcp = parseSemver(mcpVersion);
  const project = parseSemver(projectVersion);

  if (!mcp || !project) {
    return {
      status: 'docs-behind',
      icon: '⚠️',
      message: 'Could not parse version',
      tip: 'Versions should follow semver format (e.g., 1.0.5)',
    };
  }

  // Same version - docs are in sync
  if (mcp.major === project.major && mcp.minor === project.minor && mcp.patch === project.patch) {
    return {
      status: 'synced',
      icon: '✅',
      message: 'Documentation is in sync with your project',
    };
  }

  // MCP is newer - docs may have new features not in project
  if (mcp.major > project.major || (mcp.major === project.major && mcp.minor > project.minor)) {
    return {
      status: 'docs-ahead',
      icon: '📚',
      message: `Docs may include features not in your project (${mcpVersion} > ${projectVersion})`,
      tip: `Upgrade project: pnpm add tuiuiu.js@${mcpVersion}`,
    };
  }

  // MCP is older - project may have features not in docs
  if (project.major > mcp.major || (project.major === mcp.major && project.minor > mcp.minor)) {
    return {
      status: 'docs-behind',
      icon: '⚠️',
      message: `Docs may be missing new features (${projectVersion} > ${mcpVersion})`,
      tip: `Update MCP: npx tuiuiu.js@${projectVersion} mcp`,
    };
  }

  // Same major.minor, different patch - generally compatible
  return {
    status: 'synced',
    icon: '✅',
    message: 'Documentation is compatible (patch difference only)',
  };
}

async function handleVersion(args: Record<string, unknown>): Promise<MCPToolResult> {
  const projectVersion = args.projectVersion as string | undefined;
  const mcpVersion = await getVersion();
  const mcpProtocolVersion = '2024-11-05';
  const nodeVersion = process.version;

  let output = `# Tuiuiu MCP Server

| | |
|---|---|
| **MCP Docs Version** | ${mcpVersion} |
| **MCP Protocol** | ${mcpProtocolVersion} |
| **Node.js** | ${nodeVersion} |
`;

  // If projectVersion is provided, check docs compatibility
  if (projectVersion) {
    const compat = checkDocsCompatibility(mcpVersion, projectVersion);

    output += `
## Documentation Status

| | |
|---|---|
| **Your Project** | ${projectVersion} |
| **MCP Docs** | ${mcpVersion} |
| **Status** | ${compat.icon} ${compat.status === 'synced' ? 'Synced' : compat.status === 'docs-ahead' ? 'Docs Ahead' : 'Docs Behind'} |

${compat.message}
`;

    if (compat.tip) {
      output += `\n**Tip:** ${compat.tip}\n`;
    }
  } else {
    output += `
## Check Documentation Sync

Pass your project version to verify docs are current:
\`\`\`json
{ "projectVersion": "1.0.5" }
\`\`\`
`;
  }

  output += `
## Available Documentation

- **${allComponents.length}** components documented
- **${allHooks.length}** hooks documented
- **${allThemes.length}** themes documented

Use \`tuiuiu_list_components\`, \`tuiuiu_get_component\`, \`tuiuiu_get_hook\` to explore.
`;

  return { content: [{ type: 'text', text: output }] };
}

// =============================================================================
// Formatting Helpers
// =============================================================================

function formatComponentDoc(comp: ComponentDoc): string {
  let output = `# ${comp.name}\n\n`;
  output += `**Category:** ${comp.category}\n\n`;
  output += `${comp.description}\n\n`;

  const symbol = getSymbolDoc(comp.name);
  if (symbol) {
    output += formatSymbolDocSections(symbol) + '\n\n';
  }

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
  const symbol = getSymbolDoc(hook.name);
  if (symbol) {
    output += formatSymbolDocSections(symbol) + '\n\n';
  }
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

// =============================================================================
// API Patterns Handler
// =============================================================================

function handleApiPatterns(args: Record<string, unknown>): MCPToolResult {
  const componentName = args.component as string | undefined;
  const patternFilter = args.pattern as string | undefined;

  // If component name provided, return pattern for that specific component
  if (componentName) {
    const pattern = getComponentPattern(componentName);
    if (!pattern) {
      return {
        content: [{
          type: 'text',
          text: `Component "${componentName}" not found. Use tuiuiu_list_components to see available components.\n\n` +
            `**Tip:** Common patterns are:\n` +
            `- Variadic: Box, Text, VStack, HStack\n` +
            `- Props: Page, AppShell, Modal, FormField\n` +
            `- Data: Tabs, Select, ButtonGroup, Tree\n` +
            `- Render: ScrollList, Static, Each`,
        }],
        isError: true,
      };
    }

    let output = `# API Pattern for ${componentName}\n\n`;
    output += `**Pattern:** ${pattern.name}\n\n`;
    output += `${pattern.description}\n\n`;
    output += `## Signature\n\n\`${pattern.signature}\`\n\n`;
    output += `## Correct Usage\n\n`;
    for (const example of pattern.correctExamples.slice(0, 2)) {
      output += '```typescript\n' + example + '\n```\n\n';
    }
    output += `## Common Mistakes\n\n`;
    for (const example of pattern.wrongExamples) {
      output += '```typescript\n' + example + '\n```\n\n';
    }
    output += `## Why This Pattern?\n\n${pattern.why}\n`;
    output += `\nSee also: \`tuiuiu://guide/common-mistakes\`\n`;

    return { content: [{ type: 'text', text: output }] };
  }

  // Filter by pattern type if specified
  let patterns = apiPatterns;
  if (patternFilter) {
    const filterMap: Record<string, string> = {
      variadic: 'Variadic Children',
      props: 'Props Children',
      data: 'Data-Driven Content',
      render: 'Render Function',
    };
    const patternName = filterMap[patternFilter.toLowerCase()];
    if (patternName) {
      patterns = patterns.filter(p => p.name === patternName);
    }
  }

  // Return all patterns or filtered subset
  let output = `# Tuiuiu API Patterns\n\n`;
  output += `**CRITICAL:** Different components use different patterns for children/content.\n`;
  output += `Using the wrong pattern will cause your app to fail!\n\n`;

  for (const pattern of patterns) {
    output += `## ${pattern.name}\n\n`;
    output += `**Components:** ${pattern.components.slice(0, 5).join(', ')}${pattern.components.length > 5 ? '...' : ''}\n\n`;
    output += `**Signature:** \`${pattern.signature}\`\n\n`;
    output += `${pattern.description}\n\n`;

    output += `### Correct\n\n`;
    output += '```typescript\n' + pattern.correctExamples[0] + '\n```\n\n';

    output += `### Wrong\n\n`;
    output += '```typescript\n' + pattern.wrongExamples[0] + '\n```\n\n';

    output += `**Why:** ${pattern.why}\n\n`;
    output += '---\n\n';
  }

  output += apiPatternsQuickReference;
  output += `\n\n## Related Guide\n\n- \`tuiuiu://guide/common-mistakes\``;

  return { content: [{ type: 'text', text: output }] };
}

// =============================================================================
// Prompts API Handler
// =============================================================================

function handlePromptsApi(args: Record<string, unknown>): MCPToolResult {
  const promptName = args.prompt as string | undefined;

  // If specific prompt requested
  if (promptName) {
    const normalizedName = promptName.toLowerCase().replace('prompt.', '');
    const doc = promptsApiDocs.find(p =>
      p.name.toLowerCase().includes(normalizedName)
    );

    if (!doc) {
      return {
        content: [{
          type: 'text',
          text: `Prompt "${promptName}" not found.\n\n` +
            `Available prompts:\n` +
            promptsApiDocs.map(p => `- ${p.name}`).join('\n'),
        }],
        isError: true,
      };
    }

    return { content: [{ type: 'text', text: formatPromptDoc(doc) }] };
  }

  // Return full guide with all prompts
  let output = promptsApiGuide + '\n\n---\n\n# API Reference\n\n';

  for (const doc of promptsApiDocs) {
    output += `## ${doc.name}\n\n`;
    output += `${doc.description}\n\n`;
    output += `**Signature:** \`${doc.signature}\`\n\n`;

    if (doc.options.length > 0) {
      output += '**Options:**\n';
      for (const opt of doc.options) {
        output += `- \`${opt.name}\`: ${opt.type}${opt.default ? ` (default: ${opt.default})` : ''} — ${opt.description}\n`;
      }
      output += '\n';
    }

    if (doc.controls && doc.controls.length > 0) {
      output += '**Controls:** ';
      output += doc.controls.slice(0, 3).join(', ') + '\n\n';
    }

    output += '```typescript\n' + doc.examples[0] + '\n```\n\n';
    output += '---\n\n';
  }

  return { content: [{ type: 'text', text: output }] };
}

function handleValidateCode(args: Record<string, unknown>): MCPToolResult {
  const code = args.code as string | undefined;
  if (!code || !code.trim()) {
    return {
      content: [{ type: 'text', text: 'Error: code is required' }],
      isError: true,
    };
  }

  const result = validateTuiuiuCode(code);
  return {
    content: [{ type: 'text', text: formatValidationResult(result) }],
    isError: !result.ok,
  };
}

// =============================================================================
// Tool Handler Map
// =============================================================================

const toolHandlers: Record<string, MCPToolHandler> = {
  tuiuiu_list_components: handleListComponents,
  tuiuiu_get_component: handleGetComponent,
  tuiuiu_get_hook: handleGetHook,
  tuiuiu_search: handleSearch,
  tuiuiu_list_themes: handleListThemes,
  tuiuiu_create_theme: handleCreateTheme,
  tuiuiu_getting_started: handleGettingStarted,
  tuiuiu_quickstart: handleQuickstart,
  tuiuiu_version: handleVersion,
  tuiuiu_api_patterns: handleApiPatterns,
  tuiuiu_prompts_api: handlePromptsApi,
  tuiuiu_validate_code: handleValidateCode,
};

// =============================================================================
// MCP Server
// =============================================================================

export class MCPServer {
  private options: MCPServerOptions;
  private version: string = '0.0.0';
  private logSender: LogSender | null = null;
  private logger = nullLogger;

  constructor(options: MCPServerOptions = {}) {
    this.options = {
      transport: 'stdio',
      port: 3200,
      debug: false,
      ...options,
    };
  }

  private log(message: string): void {
    if (this.options.debug) {
      // Use stderr for debug logs to avoid polluting stdio protocol
      console.error(`[MCP] ${message}`);
    }
  }

  private sendNotification(notification: JsonRpcNotification): void {
    // Subclasses/transport implementations will override this
  }

  async start(): Promise<void> {
    this.version = await getVersion();
    this.log(`Starting Tuiuiu MCP Server v${this.version}`);
    this.log(`Transport: ${this.options.transport}`);

    if (this.options.transport === 'http') {
      await this.startHttp();
    } else if (this.options.transport === 'sse') {
      await this.startSse();
    } else {
      await this.startStdio();
    }
  }

  private async startStdio(): Promise<void> {
    const rl = readline.createInterface({
      input: process.stdin,
      terminal: false,
    });

    rl.on('line', async (line) => {
      try {
        const request = JSON.parse(line) as JsonRpcRequest;
        this.log(`Request: ${request.method}`);
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        const errorResponse: JsonRpcResponse = {
          jsonrpc: '2.0',
          id: 0,
          error: {
            code: -32700,
            message: 'Parse error',
            data: error instanceof Error ? error.message : String(error),
          },
        };
        process.stdout.write(JSON.stringify(errorResponse) + '\n');
      }
    });

    this.log('Listening on stdio...');
  }

  private async startHttp(): Promise<void> {
    const server = http.createServer(async (req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Health check
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          name: 'tuiuiu',
          version: this.version,
          components: allComponents.length,
          hooks: allHooks.length,
          themes: allThemes.length,
        }));
        return;
      }

      // MCP requests
      if (req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const request = JSON.parse(body) as JsonRpcRequest;
            this.log(`Request: ${request.method}`);
            const response = await this.handleRequest(request);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: 0,
              error: { code: -32700, message: 'Parse error' },
            }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    });

    const port = this.options.port!;
    server.listen(port, () => {
      console.log(`Tuiuiu MCP Server v${this.version}`);
      console.log(`Listening on http://localhost:${port}`);
      console.log(`Health: http://localhost:${port}/health`);
    });
  }

  private async startSse(): Promise<void> {
    // Track active SSE connections for broadcasting notifications
    const sseConnections = new Set<http.ServerResponse>();

    const server = http.createServer(async (req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // Health check
      if (req.method === 'GET' && req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'ok',
          name: 'tuiuiu',
          version: this.version,
          transport: 'sse',
          components: allComponents.length,
          hooks: allHooks.length,
          themes: allThemes.length,
        }));
        return;
      }

      // SSE endpoint - client connects here to receive server events
      if (req.method === 'GET' && req.url === '/sse') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        // Add to active connections
        sseConnections.add(res);
        this.log(`SSE client connected (${sseConnections.size} active)`);

        // Send initial connection event with endpoint info
        const sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        res.write(`event: endpoint\ndata: ${JSON.stringify({
          endpoint: `/message?sessionId=${sessionId}`,
          sessionId
        })}\n\n`);

        // Keep-alive ping every 30 seconds
        const pingInterval = setInterval(() => {
          if (!res.writableEnded) {
            res.write(': ping\n\n');
          }
        }, 30000);

        // Handle client disconnect
        req.on('close', () => {
          sseConnections.delete(res);
          clearInterval(pingInterval);
          this.log(`SSE client disconnected (${sseConnections.size} active)`);
        });

        return;
      }

      // Message endpoint - client sends requests here
      if (req.method === 'POST' && (req.url === '/message' || req.url?.startsWith('/message?'))) {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
          try {
            const request = JSON.parse(body) as JsonRpcRequest;
            this.log(`SSE Request: ${request.method}`);
            const response = await this.handleRequest(request);

            // Also broadcast response to all SSE connections as an event
            const eventData = JSON.stringify(response);
            for (const conn of sseConnections) {
              if (!conn.writableEnded) {
                conn.write(`event: message\ndata: ${eventData}\n\n`);
              }
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(response));
          } catch (error) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              jsonrpc: '2.0',
              id: 0,
              error: { code: -32700, message: 'Parse error' },
            }));
          }
        });
        return;
      }

      res.writeHead(404);
      res.end('Not Found');
    });

    const port = this.options.port!;
    server.listen(port, () => {
      console.log(`Tuiuiu MCP Server v${this.version} (SSE)`);
      console.log(`SSE endpoint: http://localhost:${port}/sse`);
      console.log(`Message endpoint: http://localhost:${port}/message`);
      console.log(`Health: http://localhost:${port}/health`);
    });
  }

  private async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { method, params, id } = request;

    switch (method) {
      // ─────────────────────────────────────────────────────────────────────────
      // Core Protocol
      // ─────────────────────────────────────────────────────────────────────────
      case 'initialize':
        return this.handleInitialize(id);

      case 'ping':
        return { jsonrpc: '2.0', id: id ?? 0, result: {} };

      case 'notifications/initialized':
        this.logger.sessionStart();
        return { jsonrpc: '2.0', id: id ?? 0, result: {} };

      // ─────────────────────────────────────────────────────────────────────────
      // Tools
      // ─────────────────────────────────────────────────────────────────────────
      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          result: { tools },
        };

      case 'tools/call':
        return this.handleToolCall(id, params as Record<string, unknown>);

      // ─────────────────────────────────────────────────────────────────────────
      // Resources
      // ─────────────────────────────────────────────────────────────────────────
      case 'resources/list':
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          result: {
            resources: getStaticResources(),
          },
        };

      case 'resources/templates/list':
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          result: {
            resourceTemplates: getResourceTemplates(),
          },
        };

      case 'resources/read':
        return this.handleResourceRead(id, params as Record<string, unknown>);

      // ─────────────────────────────────────────────────────────────────────────
      // Prompts
      // ─────────────────────────────────────────────────────────────────────────
      case 'prompts/list':
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          result: { prompts },
        };

      case 'prompts/get':
        return this.handlePromptGet(id, params as Record<string, unknown>);

      // ─────────────────────────────────────────────────────────────────────────
      // Completions
      // ─────────────────────────────────────────────────────────────────────────
      case 'completion/complete':
        return this.handleCompletion(id, params as Record<string, unknown>);

      // ─────────────────────────────────────────────────────────────────────────
      // Logging
      // ─────────────────────────────────────────────────────────────────────────
      case 'logging/setLevel':
        // Client requesting to set log level
        return { jsonrpc: '2.0', id: id ?? 0, result: {} };

      default:
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
    }
  }

  private handleInitialize(id: string | number | undefined): JsonRpcResponse<MCPInitializeResult> {
    // Setup logger sender
    this.logSender = (notification: MCPLogNotification) => {
      this.sendNotification(notification);
    };
    this.logger = createMCPLogger(this.logSender, {
      name: 'tuiuiu',
      minLevel: this.options.debug ? 'debug' : 'info',
    });

    return {
      jsonrpc: '2.0',
      id: id ?? 0,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'tuiuiu',
          version: this.version,
        },
        capabilities: {
          tools: {
            listChanged: false,
          },
          resources: {
            subscribe: false,
            listChanged: false,
          },
          prompts: {
            listChanged: false,
          },
          logging: {},
        },
        instructions: `Tuiuiu MCP Server v${this.version}

Tuiuiu is a zero-dependency Terminal UI library for Node.js with React-like patterns.

Available capabilities:
- **Tools**: Query component docs, search, get quickstart recipes
- **Resources**: Access component/hook/theme docs via URIs (tuiuiu://component/Box)
- **Prompts**: Use pre-defined prompts for creating dashboards, forms, games, migrations

Quick start:
1. Use \`tuiuiu_getting_started\` for installation and basic usage
2. Use \`tuiuiu_list_components\` to explore available components
3. Use \`tuiuiu_quickstart\` for ready-to-use code patterns

For creating apps, try prompts like:
- \`create_dashboard\` - Build a metrics dashboard
- \`create_form\` - Create an interactive form
- \`migrate_from_ink\` - Migrate from Ink to Tuiuiu`,
      },
    };
  }

  private async handleToolCall(
    id: string | number | undefined,
    params: Record<string, unknown>
  ): Promise<JsonRpcResponse<MCPToolResult>> {
    const toolName = params.name as string;
    const toolArgs = (params.arguments || {}) as Record<string, unknown>;

    const handler = toolHandlers[toolName];
    if (!handler) {
      return {
        jsonrpc: '2.0',
        id: id ?? 0,
        result: {
          content: [{ type: 'text', text: `Unknown tool: ${toolName}` }],
          isError: true,
        },
      };
    }

    try {
      const result = await handler(toolArgs);
      return {
        jsonrpc: '2.0',
        id: id ?? 0,
        result,
      };
    } catch (error) {
      return {
        jsonrpc: '2.0',
        id: id ?? 0,
        result: {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          }],
          isError: true,
        },
      };
    }
  }

  private handleResourceRead(
    id: string | number | undefined,
    params: Record<string, unknown>
  ): JsonRpcResponse {
    const uri = params.uri as string;
    this.logger.resourceRead(uri);

    // Use the new resource system
    const content = readResource(uri);
    if (content) {
      return {
        jsonrpc: '2.0',
        id: id ?? 0,
        result: {
          contents: [content],
        },
      };
    }

    // Fallback for legacy URIs (component:// and hook://)
    if (uri.startsWith('component://')) {
      const name = uri.replace('component://', '');
      const comp = allComponents.find(c => c.name === name);
      if (comp) {
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          result: {
            contents: [{
              uri,
              mimeType: 'text/markdown',
              text: formatComponentDoc(comp),
            }],
          },
        };
      }
    }

    if (uri.startsWith('hook://')) {
      const name = uri.replace('hook://', '');
      const hook = allHooks.find(h => h.name === name);
      if (hook) {
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          result: {
            contents: [{
              uri,
              mimeType: 'text/markdown',
              text: formatHookDoc(hook),
            }],
          },
        };
      }
    }

    return {
      jsonrpc: '2.0',
      id: id ?? 0,
      error: { code: -32602, message: `Resource not found: ${uri}` },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Prompt Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  private handlePromptGet(
    id: string | number | undefined,
    params: Record<string, unknown>
  ): JsonRpcResponse {
    const promptName = params.name as string;
    const promptArgs = (params.arguments || {}) as Record<string, string>;

    this.logger.promptGet(promptName, promptArgs);

    const result = getPromptResult(promptName, promptArgs);
    if (!result) {
      return {
        jsonrpc: '2.0',
        id: id ?? 0,
        error: {
          code: -32602,
          message: `Prompt not found: ${promptName}. Available prompts: ${prompts.map(p => p.name).join(', ')}`,
        },
      };
    }

    return {
      jsonrpc: '2.0',
      id: id ?? 0,
      result: {
        description: result.description,
        messages: result.messages,
      },
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Completion Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  private handleCompletion(
    id: string | number | undefined,
    params: Record<string, unknown>
  ): JsonRpcResponse<{ completion: MCPCompletionResult }> {
    const ref = params.ref as { type: string; name?: string; uri?: string };
    const argument = params.argument as { name: string; value: string };

    let completion: MCPCompletionResult;

    if (ref.type === 'ref/prompt' && ref.name) {
      completion = getPromptCompletions(ref.name, argument.name, argument.value);
    } else if (ref.type === 'ref/resource' && ref.uri) {
      completion = getResourceCompletions(ref.uri, argument.name, argument.value);
    } else {
      completion = { values: [] };
    }

    return {
      jsonrpc: '2.0',
      id: id ?? 0,
      result: { completion },
    };
  }
}

// =============================================================================
// CLI Entry Point
// =============================================================================

export async function runMcpServer(options: MCPServerOptions = {}): Promise<void> {
  const server = new MCPServer(options);
  await server.start();
}
