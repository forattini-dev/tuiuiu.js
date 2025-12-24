/**
 * Tuiuiu MCP Server
 *
 * Model Context Protocol server for serving component documentation
 * to AI assistants like Claude.
 *
 * Supports:
 * - stdio transport (for Claude Code)
 * - HTTP transport (for web integrations)
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
} from './docs-data.js';
import type {
  JsonRpcRequest,
  JsonRpcResponse,
  MCPTool,
  MCPToolResult,
  MCPToolHandler,
  MCPInitializeResult,
  MCPResource,
  ComponentDoc,
  HookDoc,
  ErrorCodes,
} from './types.js';

// =============================================================================
// Types
// =============================================================================

export interface MCPServerOptions {
  transport?: 'stdio' | 'http';
  port?: number;
  debug?: boolean;
}

// =============================================================================
// Tool Definitions
// =============================================================================

const tools: MCPTool[] = [
  {
    name: 'tuiuiu_list_components',
    description: 'List all available Tuiuiu components by category. Returns component names grouped by category (primitives, atoms, molecules, organisms, layouts).',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category: primitives, atoms, molecules, organisms, layouts, hooks, signals, themes',
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
4. **Theming**: Use \`setTheme\`, \`getTheme\`, and \`resolveColor\` for consistent styling

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
};

// =============================================================================
// MCP Server
// =============================================================================

export class MCPServer {
  private options: MCPServerOptions;
  private version: string = '0.0.0';

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

  async start(): Promise<void> {
    this.version = await getVersion();
    this.log(`Starting Tuiuiu MCP Server v${this.version}`);
    this.log(`Transport: ${this.options.transport}`);

    if (this.options.transport === 'http') {
      await this.startHttp();
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

  private async handleRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    const { method, params, id } = request;

    switch (method) {
      case 'initialize':
        return this.handleInitialize(id);

      case 'ping':
        return { jsonrpc: '2.0', id: id ?? 0, result: {} };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          result: { tools },
        };

      case 'tools/call':
        return this.handleToolCall(id, params as Record<string, unknown>);

      case 'resources/list':
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          result: { resources: this.getResources() },
        };

      case 'resources/read':
        return this.handleResourceRead(id, params as Record<string, unknown>);

      default:
        return {
          jsonrpc: '2.0',
          id: id ?? 0,
          error: { code: -32601, message: `Method not found: ${method}` },
        };
    }
  }

  private handleInitialize(id: string | number | undefined): JsonRpcResponse<MCPInitializeResult> {
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
          tools: {},
          resources: {},
        },
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

  private getResources(): MCPResource[] {
    const resources: MCPResource[] = [];

    // Component docs as resources
    for (const comp of allComponents) {
      resources.push({
        uri: `component://${comp.name}`,
        name: comp.name,
        description: comp.description,
        mimeType: 'text/markdown',
      });
    }

    // Hook docs as resources
    for (const hook of allHooks) {
      resources.push({
        uri: `hook://${hook.name}`,
        name: hook.name,
        description: hook.description,
        mimeType: 'text/markdown',
      });
    }

    return resources;
  }

  private handleResourceRead(
    id: string | number | undefined,
    params: Record<string, unknown>
  ): JsonRpcResponse {
    const uri = params.uri as string;

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
}

// =============================================================================
// CLI Entry Point
// =============================================================================

export async function runMcpServer(options: MCPServerOptions = {}): Promise<void> {
  const server = new MCPServer(options);
  await server.start();
}
