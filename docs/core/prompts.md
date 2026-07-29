# Prompts

> **Simple, blocking CLI prompts** for interactive command-line applications. Zero dependencies, using only Node.js built-in `readline`.

## Overview

Tuiuiu provides two ways to handle user interaction:

| Approach | Use Case | Module |
|----------|----------|--------|
| **Prompts** (blocking) | Simple CLI wizards, setup scripts | `tuiuiu.js` → `prompt.*` |
| **Components** (reactive) | Full TUI applications, dashboards | `tuiuiu.js` → `TextInput`, `Select`, etc. |

This page covers the **blocking prompts** API — perfect for CLI tools that need simple question/answer flows.

Every prompt options object also accepts `theme?: PromptThemeOptions`. Use it
to customize one call, or use `prompt.setTheme()` to configure every blocking
prompt in the process.

## Quick Start

```typescript
import { prompt } from 'tuiuiu.js'

// Simple wizard
const name = await prompt.input('Project name:')
const useTs = await prompt.confirm('Use TypeScript?', { default: true })
const framework = await prompt.select('Framework:', ['react', 'vue', 'svelte'])
const features = await prompt.checkbox('Features:', ['eslint', 'prettier', 'vitest'])

console.log({ name, useTs, framework, features })
```

---

## API Reference

### `prompt.input(message, options?)`

Text input with optional validation and transformation.

```typescript
const name = await prompt.input('Your name:', {
  default: 'Anonymous',
  placeholder: 'Enter your name...',
  validate: v => v.length >= 2 || 'Name too short',
  transform: v => v.trim().toLowerCase(),
})
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `default` | `string` | Default value if empty |
| `placeholder` | `string` | Hint text shown before input |
| `validate` | `(value: string) => boolean \| string` | Return `true` or error message |
| `transform` | `(value: string) => string` | Transform input before returning |
| `theme` | `PromptThemeOptions` | Symbols and colors for this call |

---

### `prompt.confirm(message, options?)`

Yes/no confirmation prompt.

```typescript
const proceed = await prompt.confirm('Continue?', { default: true })
// Shows: ? Continue? (Y/n)

const dangerous = await prompt.confirm('Delete all?', { default: false })
// Shows: ? Delete all? (y/N)
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `default` | `boolean` | Default value (affects Y/n display) |
| `theme` | `PromptThemeOptions` | Symbols and colors for this call |

---

### `prompt.select(message, choices, options?)`

Single selection from a list.

```typescript
const env = await prompt.select(
  'Environment:',
  ['development', 'staging', 'production'] as const,
  { default: 'staging' }
)
```

**Controls:**
- `↑`/`↓` or `j`/`k` — Navigate
- `1`-`9` — Quick select by number
- `Enter` — Confirm selection
- `Esc` / `Ctrl+C` — Cancel

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `default` | `T` | Pre-selected choice |
| `theme` | `PromptThemeOptions` | Symbols and colors for this call |

---

### `prompt.checkbox(message, choices, options?)`

Multiple selection from a list.

```typescript
const features = await prompt.checkbox(
  'Features to enable:',
  ['typescript', 'eslint', 'prettier', 'vitest', 'husky'] as const,
  {
    default: ['typescript', 'eslint'],
    min: 1,
    max: 3,
  }
)
```

**Controls:**
- `↑`/`↓` or `j`/`k` — Navigate
- `Space` — Toggle selection
- `a` — Toggle all
- `Enter` — Confirm
- `Esc` / `Ctrl+C` — Cancel

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `default` | `T[]` | Pre-selected choices |
| `min` | `number` | Minimum selections required |
| `max` | `number` | Maximum selections allowed |
| `validate` | `(values: T[]) => boolean \| string` | Custom validation |
| `theme` | `PromptThemeOptions` | Symbols and colors for this call |

---

### `prompt.autocomplete(message, choices, options?)`

Type-ahead selection with fuzzy matching.

```typescript
const country = await prompt.autocomplete(
  'Country:',
  ['Brazil', 'Germany', 'Japan', 'United States', ...],
  {
    maxSuggestions: 5,
    minInput: 2,
  }
)
```

**Controls:**
- Type to filter
- `↑`/`↓` — Navigate suggestions
- `Tab` — Complete with selected
- `Enter` — Confirm
- `Backspace` — Delete character
- `Esc` / `Ctrl+C` — Cancel

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `default` | `T` | Initial value |
| `minInput` | `number` | Characters before filtering starts (default: 0) |
| `maxSuggestions` | `number` | Max visible suggestions (default: 7) |
| `filter` | `(input: string, choice: T) => boolean` | Custom filter function |
| `theme` | `PromptThemeOptions` | Symbols and colors for this call |

**Fuzzy Matching:**

The default filter supports:
- Exact prefix match: `"bra"` matches `"Brazil"`
- Contains match: `"azi"` matches `"Brazil"`
- Fuzzy match: `"bzl"` matches `"Brazil"` (characters in order)

---

### `prompt.password(message, options?)`

Masked input for sensitive data.

```typescript
const token = await prompt.password('API Token:', {
  mask: '•',
  validate: v => v.length >= 8 || 'Token too short',
})
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `mask` | `string` | Character to display (default: `'*'`) |
| `validate` | `(value: string) => boolean \| string` | Validation function |
| `theme` | `PromptThemeOptions` | Symbols and colors for this call |

---

### `prompt.number(message, options?)`

Numeric input with constraints.

```typescript
const port = await prompt.number('Port:', {
  default: 3000,
  min: 1024,
  max: 65535,
  integer: true,
})

const price = await prompt.number('Price:', {
  min: 0,
  validate: v => v > 0 || 'Must be positive',
})
```

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `default` | `number` | Default value |
| `min` | `number` | Minimum allowed value |
| `max` | `number` | Maximum allowed value |
| `integer` | `boolean` | Require integer (no decimals) |
| `validate` | `(value: number) => boolean \| string` | Custom validation |
| `theme` | `PromptThemeOptions` | Symbols and colors for this call |

---

## Customizing Prompt Appearance

Configure symbols and colors once for an entire CLI:

```typescript
import { prompt } from 'tuiuiu.js'

prompt.setTheme({
  symbols: {
    question: '◆',
    error: '×',
    pointer: '›',
    selected: '●',
    unselected: '○',
    cursor: '▌',
  },
  colors: {
    accent: '#cba6f7',
    answer: 'greenBright',
    error: 'redBright',
  },
})
```

The same shape can override one call without mutating the global theme:

```typescript
const environment = await prompt.select(
  'Environment:',
  ['development', 'production'] as const,
  {
    theme: {
      symbols: { question: 'λ', pointer: '→' },
      colors: { accent: 'magenta' },
    },
  },
)
```

Colors accept named ANSI colors, `#rgb`, `#rrggbb`, `rgb(r, g, b)`,
`ansi256(n)`, or `null` to disable that color role.

| Color role | Used for |
|------------|----------|
| `accent` | Question prefix and active option |
| `answer` | Final answer, pointer, and selected checkbox |
| `error` | Validation and cancellation marker |

`prompt.getTheme()` returns a defensive copy. `prompt.resetTheme()` restores
the built-in symbols and cyan/green/yellow color roles.

---

## Non-TTY Behavior

All prompts gracefully handle non-interactive environments (CI/CD pipelines, piped input):

```typescript
// In non-TTY mode, returns default immediately
await prompt.select('Env:', ['dev', 'prod'], { default: 'dev' })
// → Returns 'dev' without interaction, prints "(non-interactive)"
```

This allows the same code to work in both interactive and automated contexts.

---

## TypeScript Support

Prompts preserve literal types when using `as const`:

```typescript
// Type: 'dev' | 'staging' | 'prod'
const env = await prompt.select(
  'Environment:',
  ['dev', 'staging', 'prod'] as const
)

// Type: ('ts' | 'eslint' | 'prettier')[]
const features = await prompt.checkbox(
  'Features:',
  ['ts', 'eslint', 'prettier'] as const
)
```

---

## Examples

### Setup Wizard

```typescript
import { prompt } from 'tuiuiu.js'

async function setupWizard() {
  console.log('\n  Project Setup\n')

  const name = await prompt.input('Project name:', {
    default: 'my-project',
    validate: v => /^[a-z0-9-]+$/.test(v) || 'Use lowercase, numbers, dashes',
  })

  const template = await prompt.select(
    'Template:',
    ['minimal', 'standard', 'full'] as const
  )

  const features = await prompt.checkbox(
    'Features:',
    ['typescript', 'eslint', 'prettier', 'vitest'] as const,
    { min: 1 }
  )

  const port = await prompt.number('Dev server port:', {
    default: 3000,
    min: 1024,
    max: 65535,
  })

  const confirmed = await prompt.confirm('Create project?', { default: true })

  if (confirmed) {
    console.log('\nCreating project...')
    console.log({ name, template, features, port })
  }
}

setupWizard()
```

### Interactive Fallback Pattern

Allow both CLI flags and interactive prompts:

```typescript
import { prompt } from 'tuiuiu.js'

interface Options {
  name?: string
  skipPrompts?: boolean
}

async function init(options: Options) {
  // Use flag value or prompt
  let name = options.name
  if (!name && !options.skipPrompts) {
    name = await prompt.input('Project name:')
  }
  name = name || 'default'

  // Continue with name...
}

// Interactive: init({})
// Scripted: init({ name: 'myapp', skipPrompts: true })
```

---

## See Also

- [CLI Integration Guide](/guides/cli-integration.md) — Using prompts with cli-args-parser
- [TextInput Component](/components/atoms/text-input.md) — Reactive text input for TUI apps
- [Select Component](/components/molecules/select.md) — Reactive select for TUI apps
