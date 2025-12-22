# MCP Server

> **Build terminal UIs with AI.** Tuiuiu includes a native Model Context Protocol (MCP) server that lets AI assistants like Claude understand and help you build terminal applications.

## Why MCP?

When you're working with Claude Code or other AI assistants, the MCP server provides:

- **Full documentation access** — Components, hooks, props, examples
- **Intelligent code generation** — AI understands Tuiuiu's patterns
- **Interactive exploration** — Query components, search docs, get examples
- **Zero configuration** — Works out of the box with Claude Code

```bash
# Start coding with AI assistance
npx tuiuiu.js@latest mcp
```

## Quick Start

### With Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "tuiuiu": {
      "command": "npx",
      "args": ["tuiuiu", "mcp"],
      "env": { "NODE_ENV": "development" }
    }
  }
}
```

Now Claude has full access to Tuiuiu documentation and can help you build terminal UIs.

### CLI Options

```bash
# Standard mode (stdio) - for Claude Code
npx tuiuiu.js@latest mcp

# HTTP mode - for web-based AI tools
npx tuiuiu.js@latest mcp --http

# Custom port (default: 3200)
npx tuiuiu.js@latest mcp --http --port=8080

# Debug logging
npx tuiuiu.js@latest mcp --debug
```

## Available Tools

The MCP server exposes these tools to AI assistants:

### `tuiuiu_list_components`

List all available components by category.

```typescript
// Categories: primitives, atoms, molecules, organisms, layouts, hooks, signals, themes
tuiuiu_list_components({ category: 'atoms' })
// → Button, Spinner, ProgressBar, TextInput, Switch, Slider, Timer, Tooltip...
```

### `tuiuiu_get_component`

Get detailed documentation for a specific component.

```typescript
tuiuiu_get_component({ name: 'Button' })
// → Props, types, defaults, usage examples, related components
```

### `tuiuiu_get_hook`

Get documentation for a hook.

```typescript
tuiuiu_get_hook({ name: 'useInput' })
// → Signature, parameters, return type, examples
```

### `tuiuiu_search`

Search across all documentation.

```typescript
tuiuiu_search({ query: 'modal dialog' })
// → Matching components, hooks, and concepts
```

### `tuiuiu_list_themes`

List available themes with color schemes.

```typescript
tuiuiu_list_themes()
// → dark, light, highContrastDark, monochrome...
```

### `tuiuiu_getting_started`

Get the quick start guide.

```typescript
tuiuiu_getting_started()
// → Installation, basic usage, core concepts
```

## Example Prompts

When working with Claude Code and Tuiuiu MCP enabled, try these prompts:

### Create a Dashboard

```
Create a terminal dashboard with:
- A header showing the app name and current time
- CPU and memory gauges on the left
- A line chart showing request latency on the right
- A status bar at the bottom with keyboard shortcuts
```

### Build a Form

```
Build an interactive form with:
- Text input for name and email
- A dropdown to select a department
- A multi-select for skills
- Submit and cancel buttons
- Validation feedback
```

### Make a File Browser

```
Create a file browser component that:
- Shows a tree view of directories
- Has a preview panel on the right
- Supports keyboard navigation
- Shows file size and modification date
```

## Integration Examples

### With Claude Desktop

```json
// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "tuiuiu": {
      "command": "npx",
      "args": ["tuiuiu", "mcp"]
    }
  }
}
```

### With Custom MCP Client

```typescript
import { MCPServer } from 'tuiuiu.js/mcp';

const server = new MCPServer({
  transport: 'http',
  port: 3200,
  debug: true,
});

await server.start();
console.log('MCP server running on http://localhost:3200');
```

## What Claude Sees

When you enable Tuiuiu MCP, Claude gets access to:

| Resource | Description |
|:---------|:------------|
| 50+ Components | Full props, types, and examples for every component |
| 10 Hooks | Complete hook documentation with signatures |
| 5 Themes | Theme definitions with all color tokens |
| Patterns | Best practices and common UI patterns |
| Examples | Real-world code examples |

## Debugging

### Check MCP Status

```bash
# With debug logging
npx tuiuiu.js@latest mcp --debug
```

### Test Tools Manually

```bash
# HTTP mode for manual testing
npx tuiuiu.js@latest mcp --http --port=3200

# Test with curl
curl -X POST http://localhost:3200 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"tools/call","params":{"name":"tuiuiu_list_components","arguments":{}},"id":1}'
```

## Architecture

```
┌─────────────────┐     stdio/http     ┌─────────────────┐
│   Claude Code   │ ◄─────────────────► │  Tuiuiu MCP     │
│   or AI Tool    │                     │  Server         │
└─────────────────┘                     └────────┬────────┘
                                                 │
                                                 ▼
                                        ┌─────────────────┐
                                        │  Documentation  │
                                        │  • Components   │
                                        │  • Hooks        │
                                        │  • Themes       │
                                        │  • Examples     │
                                        └─────────────────┘
```

## Related

- [Quick Start](/getting-started/quick-start.md) — Get started with Tuiuiu
- [Components Overview](/components/overview.md) — Browse all components
- [Hooks](/hooks/use-input.md) — Learn about hooks
- [Storybook](/core/storybook.md) — Interactive component explorer
