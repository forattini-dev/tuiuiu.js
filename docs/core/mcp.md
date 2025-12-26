# MCP Server

> **Build terminal UIs with AI.** Tuiuiu includes a comprehensive Model Context Protocol (MCP) server that enables AI assistants like Claude to deeply understand and assist with building terminal applications.

## Why MCP?

When you're working with Claude Code or other AI assistants, the MCP server provides:

- **Full documentation access** — Components, hooks, props, examples
- **Intelligent code generation** — AI understands Tuiuiu's patterns
- **15+ pre-built prompts** — Ready-to-use templates for common tasks
- **Resource system** — Direct access to docs via URIs
- **Argument completions** — Smart suggestions for tool parameters
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

---

## MCP Capabilities Overview

| Feature | Description |
|:--------|:------------|
| **9 Tools** | Query docs, search, get quickstart recipes, create themes |
| **8 Resource Templates** | Dynamic URIs for components, hooks, themes, guides |
| **15 Prompts** | Pre-built templates for dashboards, forms, games, migrations |
| **Completions** | Smart argument suggestions for tools and prompts |
| **Structured Logging** | Debug visibility into MCP operations |

---

## Tools

The MCP server exposes 9 tools to AI assistants:

### Core Tools

#### `tuiuiu_list_components`

List all available components by category.

```typescript
tuiuiu_list_components({ category: 'atoms' })
// → Button, Spinner, ProgressBar, TextInput, Switch, Slider, Timer, Tooltip...
```

**Categories**: `primitives`, `atoms`, `molecules`, `organisms`, `layouts`, `hooks`, `signals`, `themes`

#### `tuiuiu_get_component`

Get detailed documentation for a specific component.

```typescript
tuiuiu_get_component({ name: 'Button' })
// → Props, types, defaults, usage examples, related components
```

**Returns**:
- Component description and category
- Full props table with types and defaults
- Import statement
- Usage examples (basic and advanced)
- Related components

#### `tuiuiu_get_hook`

Get documentation for a hook.

```typescript
tuiuiu_get_hook({ name: 'useInput' })
// → Signature, parameters, return type, examples
```

#### `tuiuiu_search`

Search across all documentation.

```typescript
tuiuiu_search({ query: 'modal dialog' })
// → Matching components, hooks, and concepts ranked by relevance
```

**Search scope**: Components, hooks, themes, guides, examples

#### `tuiuiu_list_themes`

List available themes with color schemes.

```typescript
tuiuiu_list_themes()
// → dark, light, dracula, nord, monokai, tokyo-night, catppuccin...
```

**Returns**: Name, description, and preview colors for each of the 11 built-in themes.

#### `tuiuiu_getting_started`

Get the comprehensive quick start guide.

```typescript
tuiuiu_getting_started()
// → Installation, basic usage, core concepts, first app example
```

### Advanced Tools

#### `tuiuiu_quickstart`

Get ready-to-use code patterns and recipes.

```typescript
tuiuiu_quickstart({ pattern: 'dashboard' })
// → Complete dashboard code with charts, metrics, and keyboard shortcuts
```

**Available patterns** (10 recipes):
| Pattern | Description |
|:--------|:------------|
| `header` | Header with ASCII logo using SplitBox |
| `three-section` | Three-section header (logo, title, status) |
| `status-bar` | Status bar with metrics and FPS |
| `counter` | Interactive counter with keyboard input |
| `hotkeys` | Hotkey navigation showcase |
| `dashboard-cards` | Metric cards with colors |
| `sparkline` | Live data visualization |
| `game-header` | Game-style UI design |
| `command-palette` | VS Code-style command palette |
| `theme-switch` | Tab to cycle through themes |

#### `tuiuiu_create_theme`

Get a comprehensive guide for creating custom themes.

```typescript
tuiuiu_create_theme()
// → Theme structure, color scale generation, component tokens, examples
```

**Covers**:
- Theme type definitions
- Color palette generation (22 colors × 11 shades)
- Background/foreground hierarchy
- Semantic accent colors
- Component token overrides
- Registration and usage

#### `tuiuiu_version`

Get version information and compatibility analysis.

```typescript
tuiuiu_version()
// → Current version, Node.js compatibility, documentation sync status
```

**Returns**:
- Current Tuiuiu version
- MCP server version
- Node.js version requirements
- Documentation sync status (`in-sync`, `docs-ahead`, `docs-behind`)
- Upgrade guidance if needed

---

## Resources

The MCP server provides direct access to documentation via URI-based resources.

### Resource Templates

| URI Template | Description |
|:-------------|:------------|
| `tuiuiu://component/{name}` | Get component documentation |
| `tuiuiu://hook/{name}` | Get hook documentation |
| `tuiuiu://theme/{name}` | Get theme details and colors |
| `tuiuiu://category/{category}` | List all items in a category |
| `tuiuiu://guide/{topic}` | Get topic guide |
| `tuiuiu://example/{id}` | Get complete working example |
| `tuiuiu://props/{component}` | Get just the props table |
| `tuiuiu://related/{component}` | Get related components |

### Examples

```
# Get Button component documentation
tuiuiu://component/Button

# Get Dracula theme colors
tuiuiu://theme/dracula

# Get all atoms
tuiuiu://category/atoms

# Get the signals guide
tuiuiu://guide/signals

# Get complete dashboard example
tuiuiu://example/dashboard
```

### Available Guides

| Guide | Description |
|:------|:------------|
| `getting-started` | Quick start guide |
| `custom-themes` | Creating and customizing themes |
| `migration-ink` | Migrating from Ink to Tuiuiu |
| `migration-blessed` | Migrating from blessed to Tuiuiu |
| `signals` | Signals and reactive programming |
| `layout` | Flexbox layout system |
| `input-handling` | Keyboard and mouse input |
| `animations` | Animation system and spring physics |

### Available Examples

| Example | Description |
|:--------|:------------|
| `counter` | Basic counter with keyboard input |
| `dashboard` | Metrics dashboard with charts |
| `form` | Interactive form with validation |
| `file-browser` | File system explorer |
| `data-table` | Sortable, filterable data table |
| `command-palette` | VS Code-style command palette |
| `wizard` | Multi-step onboarding wizard |
| `game-snake` | Complete snake game |

---

## Prompts

The MCP server includes 15 pre-defined prompt templates that help AI assistants generate complete, working Tuiuiu applications.

### Creation Prompts

| Prompt | Arguments | Description |
|:-------|:----------|:------------|
| `create_dashboard` | `metrics` (required), `style` | Create a metrics dashboard with charts |
| `create_form` | `fields` (required), `validation` | Create an interactive form with validation |
| `create_cli_app` | `name`, `commands` (required) | Create a complete CLI application |
| `create_file_browser` | `features` | Create a file browser/explorer |
| `create_data_table` | `columns` (required), `features` | Create an interactive data table |
| `create_wizard` | `steps` (required) | Create a multi-step wizard flow |

### Migration Prompts

| Prompt | Arguments | Description |
|:-------|:----------|:------------|
| `migrate_from_ink` | `code` (required) | Convert Ink/React code to Tuiuiu |
| `migrate_from_blessed` | `code` (required) | Convert blessed code to Tuiuiu |

### Debug & Optimization Prompts

| Prompt | Arguments | Description |
|:-------|:----------|:------------|
| `debug_layout` | `code` (required), `issue` | Analyze and fix flexbox layout issues |
| `debug_signals` | `code` (required) | Debug reactivity and signal issues |
| `optimize_performance` | `code` (required) | Analyze and optimize performance |

### Learning Prompts

| Prompt | Arguments | Description |
|:-------|:----------|:------------|
| `explain_component` | `component` (required) | Deep explanation of a component |
| `compare_patterns` | `pattern` (required) | Compare implementation approaches |

### Theme & Game Prompts

| Prompt | Arguments | Description |
|:-------|:----------|:------------|
| `create_theme` | `primary_color` (required), `style`, `name` | Create a custom theme |
| `create_game` | `type` (required) | Create a terminal game |

### Example: Using Prompts

When working with Claude and Tuiuiu MCP enabled, try prompts like:

```
Use the create_dashboard prompt with metrics: cpu,memory,network,requests
and style: gaming
```

Claude will generate a complete, runnable dashboard application with:
- Header with title and timestamp
- Metric gauges and charts
- Real-time data updates
- Keyboard shortcuts
- Themed styling

---

## Completions

The MCP server provides intelligent argument completions to help AI assistants make better suggestions.

### Prompt Argument Completions

| Prompt | Argument | Completions |
|:-------|:---------|:------------|
| `create_dashboard` | `metrics` | cpu, memory, disk, network, requests, errors, latency, throughput, users, sessions |
| `create_dashboard` | `style` | minimal, detailed, gaming |
| `create_form` | `fields` | name:text, email:email, password:password, role:select, active:checkbox, bio:textarea |
| `create_cli_app` | `commands` | init, build, deploy, status, logs, config, version, help, update, test |
| `create_game` | `type` | snake, tetris, pong, roguelike, breakout, asteroids, minesweeper, custom |
| `explain_component` | `component` | All 50+ component names |

### Resource URI Completions

```
tuiuiu://component/B → Button, Box, Badge, BarChart...
tuiuiu://theme/d → dark, dracula
tuiuiu://guide/m → migration-ink, migration-blessed
```

### Tool Argument Completions

| Tool | Argument | Completions |
|:-----|:---------|:------------|
| `tuiuiu_list_components` | `category` | primitives, atoms, molecules, organisms, layouts, hooks, signals, themes |
| `tuiuiu_get_component` | `name` | All component names |
| `tuiuiu_quickstart` | `pattern` | header, status, dashboard, form, game, theme, navigation, modal |

---

## Logging

The MCP server includes structured logging for debugging and visibility.

### Log Levels

| Level | Description |
|:------|:------------|
| `debug` | Detailed debug information |
| `info` | General information |
| `notice` | Notable events |
| `warning` | Warnings |
| `error` | Errors |
| `critical` | Critical errors |

### Specialized Log Methods

The server logs specific MCP operations:

```typescript
// Logged automatically by the server:
toolCall('tuiuiu_get_component', { name: 'Button' })
toolResult('tuiuiu_get_component', { success: true, size: 2048 })
promptGet('create_dashboard', { metrics: 'cpu,memory' })
resourceRead('tuiuiu://component/Modal')
sessionStart({ clientId: 'claude-code' })
```

### Enable Debug Logging

```bash
npx tuiuiu.js@latest mcp --debug
```

---

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

### Programmatic Resource Access

```typescript
import { getResourceContents } from 'tuiuiu.js/mcp';

// Get component documentation
const buttonDocs = await getResourceContents('tuiuiu://component/Button');

// Get theme colors
const draculaTheme = await getResourceContents('tuiuiu://theme/dracula');

// Get complete example
const dashboardCode = await getResourceContents('tuiuiu://example/dashboard');
```

---

## What Claude Sees

When you enable Tuiuiu MCP, Claude gets access to:

| Resource | Count | Description |
|:---------|:------|:------------|
| Components | 50+ | Full props, types, examples for every component |
| Hooks | 10+ | Complete hook documentation with signatures |
| Themes | 11 | Theme definitions with all color tokens |
| Guides | 8 | In-depth guides on core concepts |
| Examples | 8 | Complete, runnable code examples |
| Prompts | 15 | Pre-built templates for common tasks |
| Recipes | 10 | Ready-to-use code patterns |

---

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

### List Resources

```bash
curl -X POST http://localhost:3200 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/list","params":{},"id":1}'
```

### Get Resource Contents

```bash
curl -X POST http://localhost:3200 \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"resources/read","params":{"uri":"tuiuiu://component/Button"},"id":1}'
```

---

## Architecture

```
┌─────────────────┐     stdio/http     ┌─────────────────┐
│   Claude Code   │ ◄─────────────────► │  Tuiuiu MCP     │
│   or AI Tool    │                     │  Server         │
└─────────────────┘                     └────────┬────────┘
                                                 │
                    ┌────────────────────────────┼────────────────────────────┐
                    │                            │                            │
                    ▼                            ▼                            ▼
          ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
          │     Tools       │          │   Resources     │          │    Prompts      │
          │  (9 handlers)   │          │ (8 templates)   │          │ (15 templates)  │
          └────────┬────────┘          └────────┬────────┘          └────────┬────────┘
                   │                            │                            │
                   ▼                            ▼                            ▼
          ┌─────────────────────────────────────────────────────────────────────────────┐
          │                           Documentation Data                                 │
          │                                                                              │
          │   Components (50+)  •  Hooks (10+)  •  Themes (11)  •  Guides (8)           │
          │   Examples (8)  •  Recipes (10)  •  Categories (8)                          │
          └─────────────────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/mcp/
├── server.ts       # Main MCP server (9 tool handlers, quickstart recipes)
├── prompts.ts      # 15 prompt templates with message generation
├── resources.ts    # Resource templates and content generation
├── completions.ts  # Argument autocompletion logic
├── logging.ts      # Structured logging system
├── docs-data.ts    # Documentation data aggregator
├── docs/           # Per-category documentation
│   ├── primitives.ts
│   ├── atoms.ts
│   ├── molecules.ts
│   ├── organisms.ts
│   ├── layouts.ts
│   ├── hooks.ts
│   ├── signals.ts
│   └── themes.ts
├── types.ts        # TypeScript definitions
└── index.ts        # CLI entry point
```

---

## Related

- [Quick Start](/getting-started/quick-start.md) — Get started with Tuiuiu
- [Components Overview](/components/overview.md) — Browse all components
- [Hooks](/hooks/use-input.md) — Learn about hooks
- [Theming](/core/theming.md) — Customize themes
- [Storybook](/core/storybook.md) — Interactive component explorer
