# CLI Integration Guide

Build complete CLI applications with **cli-args-parser** + **tuiuiu.js** — zero external dependencies.

## Overview

| Library | Purpose |
|---------|---------|
| **cli-args-parser** | Argument parsing, subcommands, help generation |
| **tuiuiu.js/prompts** | Interactive prompts (input, select, checkbox) |
| **tuiuiu.js/colors** | Terminal colors and styling |
| **tuiuiu.js** (full) | Reactive TUI applications |

## Installation

```bash
pnpm add cli-args-parser tuiuiu.js
```

## Quick Start

```typescript
import { createCLI } from 'cli-args-parser'
import { prompt, c } from 'tuiuiu.js'

const cli = createCLI({
  name: 'myapp',
  version: '1.0.0',
  commands: {
    init: {
      description: 'Initialize project',
      handler: async () => {
        const name = await prompt.input('Project name:')
        const features = await prompt.checkbox('Features:', ['ts', 'eslint', 'prettier'])
        console.log(c.green(`Created ${name} with ${features.join(', ')}`))
      }
    }
  }
})

await cli.run(process.argv.slice(2))
```

## Prompts API

### `prompt.input(message, options?)`

Text input with validation and transform.

```typescript
const name = await prompt.input('Your name:', {
  default: 'Anonymous',
  validate: v => v.length >= 2 || 'Too short',
  transform: v => v.trim(),
})
```

### `prompt.confirm(message, options?)`

Yes/no confirmation.

```typescript
const proceed = await prompt.confirm('Continue?', { default: true })
// Shows: ? Continue? (Y/n)
```

### `prompt.select(message, choices, options?)`

Single selection from list.

```typescript
const env = await prompt.select(
  'Environment:',
  ['development', 'staging', 'production'] as const,
  { default: 'development' }
)
```

**Controls:** Arrow keys, `j`/`k`, number keys (1-9), Enter

### `prompt.checkbox(message, choices, options?)`

Multiple selection from list.

```typescript
const features = await prompt.checkbox(
  'Features:',
  ['typescript', 'eslint', 'prettier', 'vitest'] as const,
  { default: ['typescript'], min: 1, max: 3 }
)
```

**Controls:** Arrow keys, Space (toggle), `a` (toggle all), Enter

### `prompt.autocomplete(message, choices, options?)`

Type-ahead selection with fuzzy search.

```typescript
const country = await prompt.autocomplete('Country:', countries, {
  maxSuggestions: 5,
  minInput: 2,  // Start filtering after 2 chars
})
```

### `prompt.password(message, options?)`

Masked input for secrets.

```typescript
const token = await prompt.password('API Token:', {
  mask: '*',
  validate: v => v.length >= 8 || 'Too short',
})
```

### `prompt.number(message, options?)`

Numeric input with constraints.

```typescript
const port = await prompt.number('Port:', {
  min: 1024,
  max: 65535,
  integer: true,
  default: 3000,
})
```

## CLI Arguments API

See [cli-args-parser documentation](https://github.com/forattini-dev/cli-args-parser) for full API.

### Basic Schema

```typescript
const cli = createCLI({
  name: 'deploy',
  version: '1.0.0',

  // Global options (all commands)
  options: {
    verbose: { short: 'v', type: 'boolean', description: 'Verbose output' },
    config: { short: 'c', type: 'string', description: 'Config file' },
  },

  commands: {
    prod: {
      description: 'Deploy to production',
      positional: [
        { name: 'tag', required: true, description: 'Version tag' }
      ],
      options: {
        force: { short: 'f', type: 'boolean', description: 'Skip confirmation' }
      },
      handler: async (result) => {
        const tag = result.positional.tag
        const force = result.options.force
        // ...
      }
    }
  }
})
```

### Nested Subcommands

```typescript
commands: {
  config: {
    description: 'Manage configuration',
    commands: {
      get: { description: 'Get value', positional: [{ name: 'key' }] },
      set: { description: 'Set value', positional: [{ name: 'key' }, { name: 'value' }] },
    }
  }
}

// Usage: myapp config get theme
// Usage: myapp config set theme dark
```

### Custom Theming

```typescript
import { c } from 'tuiuiu.js'
import type { Formatter } from 'cli-args-parser'

const theme: Formatter = {
  'program-name': s => c.cyan.bold(s),
  'command-name': s => c.yellow(s),
  'option-flag': s => c.green(s),
  'option-type': s => c.cyan(s),
  'error-message': s => c.red(s),
}

const cli = createCLI({
  name: 'myapp',
  formatter: theme,
  // ...
})
```

## Pattern: Interactive Fallback

Allow both CLI flags and interactive prompts:

```typescript
handler: async (result) => {
  const skipPrompts = result.options['skip-prompts']

  // Get from flag or prompt
  let name = result.options.name
  if (!name && !skipPrompts) {
    name = await prompt.input('Project name:')
  }
  name = name || 'default'

  // Continue with name...
}
```

This enables:
- **Interactive mode:** `myapp init` (prompts user)
- **Script mode:** `myapp init --name=foo --skip-prompts` (no prompts)

## Non-TTY Handling

All prompts gracefully handle non-interactive environments (CI/CD, pipes):

```typescript
// In non-TTY mode:
await prompt.select('Env:', ['dev', 'prod'], { default: 'dev' })
// Returns 'dev' immediately without interaction
```

## Full Example

See [`examples/cli-wizard.ts`](../../examples/cli-wizard.ts) for a complete example demonstrating:

- Subcommands with handlers
- All prompt types
- Theming with tuiuiu.js/colors
- Interactive fallback pattern
- Production confirmation flow

Run it:

```bash
pnpm tsx examples/cli-wizard.ts
pnpm tsx examples/cli-wizard.ts init
pnpm tsx examples/cli-wizard.ts deploy staging --tag=v1.0.0
```
