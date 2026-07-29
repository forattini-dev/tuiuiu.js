/**
 * Tuiuiu CLI Prompts API Documentation
 *
 * Documentation for the blocking prompts API for CLI applications.
 */

export interface PromptDoc {
  name: string;
  description: string;
  signature: string;
  options: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: string;
    description: string;
  }>;
  returns: string;
  examples: string[];
  controls?: string[];
}

export const promptsApiDocs: PromptDoc[] = [
  {
    name: 'prompt.input',
    description: 'Text input prompt with optional validation and transformation. Returns the user\'s input as a string.',
    signature: 'prompt.input(message: string, options?: InputOptions): Promise<string>',
    options: [
      { name: 'default', type: 'string', required: false, description: 'Default value if user presses Enter without typing' },
      { name: 'placeholder', type: 'string', required: false, description: 'Hint text shown before user starts typing' },
      { name: 'validate', type: '(value: string) => boolean | string', required: false, description: 'Return true if valid, or error message string' },
      { name: 'transform', type: '(value: string) => string', required: false, description: 'Transform input before returning' },
      { name: 'theme', type: 'PromptThemeOptions', required: false, description: 'Symbols and colors for this prompt only' },
    ],
    returns: 'Promise<string>',
    examples: [
      `const name = await prompt.input('Your name:', {
  default: 'Anonymous',
  validate: v => v.length >= 2 || 'Name too short',
  transform: v => v.trim(),
})`,
    ],
  },
  {
    name: 'prompt.confirm',
    description: 'Yes/no confirmation prompt. Shows (Y/n) or (y/N) based on default value.',
    signature: 'prompt.confirm(message: string, options?: ConfirmOptions): Promise<boolean>',
    options: [
      { name: 'default', type: 'boolean', required: false, default: 'false', description: 'Default value (affects Y/n vs y/N display)' },
      { name: 'theme', type: 'PromptThemeOptions', required: false, description: 'Symbols and colors for this prompt only' },
    ],
    returns: 'Promise<boolean>',
    examples: [
      `const proceed = await prompt.confirm('Continue?', { default: true })
// Shows: ? Continue? (Y/n)`,
      `const dangerous = await prompt.confirm('Delete all?', { default: false })
// Shows: ? Delete all? (y/N)`,
    ],
  },
  {
    name: 'prompt.select',
    description: 'Single selection from a list. Navigate with arrow keys or j/k, quick select with 1-9.',
    signature: 'prompt.select<T extends string>(message: string, choices: readonly T[], options?: SelectOptions<T>): Promise<T>',
    options: [
      { name: 'default', type: 'T', required: false, description: 'Pre-selected choice' },
      { name: 'theme', type: 'PromptThemeOptions', required: false, description: 'Symbols and colors for this prompt only' },
    ],
    returns: 'Promise<T>',
    controls: [
      '↑/↓ or j/k — Navigate',
      '1-9 — Quick select by number',
      'Enter — Confirm selection',
      'Esc / Ctrl+C — Cancel',
    ],
    examples: [
      `const env = await prompt.select(
  'Environment:',
  ['development', 'staging', 'production'] as const,
  { default: 'staging' }
)
// Type: 'development' | 'staging' | 'production'`,
    ],
  },
  {
    name: 'prompt.checkbox',
    description: 'Multiple selection from a list with min/max constraints. Toggle items with Space, toggle all with "a".',
    signature: 'prompt.checkbox<T extends string>(message: string, choices: readonly T[], options?: CheckboxOptions<T>): Promise<T[]>',
    options: [
      { name: 'default', type: 'T[]', required: false, description: 'Pre-selected choices' },
      { name: 'min', type: 'number', required: false, description: 'Minimum selections required' },
      { name: 'max', type: 'number', required: false, description: 'Maximum selections allowed' },
      { name: 'validate', type: '(values: T[]) => boolean | string', required: false, description: 'Custom validation function' },
      { name: 'theme', type: 'PromptThemeOptions', required: false, description: 'Symbols and colors for this prompt only' },
    ],
    returns: 'Promise<T[]>',
    controls: [
      '↑/↓ or j/k — Navigate',
      'Space — Toggle selection',
      'a — Toggle all',
      'Enter — Confirm',
      'Esc / Ctrl+C — Cancel',
    ],
    examples: [
      `const features = await prompt.checkbox(
  'Features to enable:',
  ['typescript', 'eslint', 'prettier', 'vitest', 'husky'] as const,
  { default: ['typescript', 'eslint'], min: 1, max: 3 }
)
// Type: ('typescript' | 'eslint' | 'prettier' | 'vitest' | 'husky')[]`,
    ],
  },
  {
    name: 'prompt.autocomplete',
    description: 'Type-ahead selection with fuzzy matching. Supports prefix, contains, and fuzzy matching.',
    signature: 'prompt.autocomplete<T extends string>(message: string, choices: readonly T[], options?: AutocompleteOptions<T>): Promise<T>',
    options: [
      { name: 'default', type: 'T', required: false, description: 'Initial value' },
      { name: 'minInput', type: 'number', required: false, default: '0', description: 'Characters before filtering starts' },
      { name: 'maxSuggestions', type: 'number', required: false, default: '7', description: 'Max visible suggestions' },
      { name: 'filter', type: '(input: string, choice: T) => boolean', required: false, description: 'Custom filter function' },
      { name: 'theme', type: 'PromptThemeOptions', required: false, description: 'Symbols and colors for this prompt only' },
    ],
    returns: 'Promise<T>',
    controls: [
      'Type — Filter choices',
      '↑/↓ — Navigate suggestions',
      'Tab — Complete with selected',
      'Enter — Confirm',
      'Backspace — Delete character',
      'Esc / Ctrl+C — Cancel',
    ],
    examples: [
      `const country = await prompt.autocomplete('Country:', countries, {
  maxSuggestions: 5,
  minInput: 2,
})

// Fuzzy matching supports:
// - Prefix: "bra" matches "Brazil"
// - Contains: "azi" matches "Brazil"
// - Fuzzy: "bzl" matches "Brazil" (chars in order)`,
    ],
  },
  {
    name: 'prompt.number',
    description: 'Numeric input with constraints. Supports min/max bounds and integer-only mode.',
    signature: 'prompt.number(message: string, options?: NumberOptions): Promise<number>',
    options: [
      { name: 'default', type: 'number', required: false, description: 'Default value' },
      { name: 'min', type: 'number', required: false, description: 'Minimum allowed value' },
      { name: 'max', type: 'number', required: false, description: 'Maximum allowed value' },
      { name: 'integer', type: 'boolean', required: false, default: 'false', description: 'Require integer (no decimals)' },
      { name: 'validate', type: '(value: number) => boolean | string', required: false, description: 'Custom validation' },
      { name: 'theme', type: 'PromptThemeOptions', required: false, description: 'Symbols and colors for this prompt only' },
    ],
    returns: 'Promise<number>',
    examples: [
      `const port = await prompt.number('Port:', {
  default: 3000,
  min: 1024,
  max: 65535,
  integer: true,
})`,
      `const price = await prompt.number('Price:', {
  min: 0,
  validate: v => v > 0 || 'Must be positive',
})`,
    ],
  },
  {
    name: 'prompt.password',
    description: 'Masked input for sensitive data. Shows mask characters instead of actual input.',
    signature: 'prompt.password(message: string, options?: PasswordOptions): Promise<string>',
    options: [
      { name: 'mask', type: 'string', required: false, default: "'*'", description: 'Character to display' },
      { name: 'validate', type: '(value: string) => boolean | string', required: false, description: 'Validation function' },
      { name: 'theme', type: 'PromptThemeOptions', required: false, description: 'Symbols and colors for this prompt only' },
    ],
    returns: 'Promise<string>',
    examples: [
      `const token = await prompt.password('API Token:', {
  mask: '•',
  validate: v => v.length >= 8 || 'Token too short',
})`,
    ],
  },
];

export const promptsApiGuide = `# Tuiuiu CLI Prompts API

> **Simple, blocking CLI prompts** for interactive command-line applications.
> Zero dependencies, using only Node.js built-in \`readline\`.

## Overview

Tuiuiu provides two ways to handle user interaction:

| Approach | Use Case | Module |
|----------|----------|--------|
| **Prompts** (blocking) | Simple CLI wizards, setup scripts | \`tuiuiu.js\` → \`prompt.*\` |
| **Components** (reactive) | Full TUI applications, dashboards | \`tuiuiu.js\` → \`TextInput\`, \`Select\`, etc. |

## Quick Start

\`\`\`typescript
import { prompt } from 'tuiuiu.js'

// Simple wizard
const name = await prompt.input('Project name:')
const useTs = await prompt.confirm('Use TypeScript?', { default: true })
const framework = await prompt.select('Framework:', ['react', 'vue', 'svelte'])
const features = await prompt.checkbox('Features:', ['eslint', 'prettier', 'vitest'])
const country = await prompt.autocomplete('Country:', countries)
const port = await prompt.number('Port:', { min: 1024, max: 65535 })
const token = await prompt.password('API Token:')

console.log({ name, useTs, framework, features, country, port })
\`\`\`

## Available Prompts

| Prompt | Description |
|--------|-------------|
| \`prompt.input()\` | Text input with validation and transform |
| \`prompt.confirm()\` | Yes/no confirmation (Y/n) |
| \`prompt.select()\` | Single selection from list |
| \`prompt.checkbox()\` | Multiple selection with min/max |
| \`prompt.autocomplete()\` | Type-ahead with fuzzy matching |
| \`prompt.number()\` | Numeric input with constraints |
| \`prompt.password()\` | Masked input for secrets |

## Appearance

Set a process-wide prompt theme, or pass the same shape as \`options.theme\`
to override a single call:

\`\`\`typescript
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

await prompt.select('Environment:', ['dev', 'prod'], {
  theme: {
    symbols: { question: 'λ' },
    colors: { accent: 'magenta' },
  },
})
\`\`\`

Colors support ANSI names, hex, RGB, ANSI 256, or \`null\` to disable a
color role. Use \`prompt.getTheme()\` to inspect a defensive copy and
\`prompt.resetTheme()\` to restore the defaults.

## Non-TTY Behavior

All prompts gracefully handle non-interactive environments (CI/CD, pipes):

\`\`\`typescript
// In non-TTY mode, returns default immediately
await prompt.select('Env:', ['dev', 'prod'], { default: 'dev' })
// → Returns 'dev' without interaction
\`\`\`

## TypeScript Support

Prompts preserve literal types when using \`as const\`:

\`\`\`typescript
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
\`\`\`

## Full Example

\`\`\`typescript
import { prompt } from 'tuiuiu.js'

async function setupWizard() {
  console.log('\\n  Project Setup\\n')

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
    console.log('\\nCreating project...')
    console.log({ name, template, features, port })
  }
}

setupWizard()
\`\`\`
`;

export function formatPromptDoc(doc: PromptDoc): string {
  let output = `# ${doc.name}\n\n`;
  output += `${doc.description}\n\n`;
  output += `## Signature\n\n\`\`\`typescript\n${doc.signature}\n\`\`\`\n\n`;

  if (doc.options.length > 0) {
    output += '## Options\n\n';
    output += '| Option | Type | Required | Default | Description |\n';
    output += '|--------|------|----------|---------|-------------|\n';
    for (const opt of doc.options) {
      output += `| \`${opt.name}\` | \`${opt.type}\` | ${opt.required ? 'Yes' : 'No'} | ${opt.default ?? '-'} | ${opt.description} |\n`;
    }
    output += '\n';
  }

  if (doc.controls && doc.controls.length > 0) {
    output += '## Controls\n\n';
    for (const ctrl of doc.controls) {
      output += `- ${ctrl}\n`;
    }
    output += '\n';
  }

  output += `## Returns\n\n\`${doc.returns}\`\n\n`;

  if (doc.examples.length > 0) {
    output += '## Examples\n\n';
    for (const example of doc.examples) {
      output += '```typescript\n' + example + '\n```\n\n';
    }
  }

  return output;
}
