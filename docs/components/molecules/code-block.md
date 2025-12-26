# CodeBlock

Syntax highlighted code display with line numbers, highlighting, and themes.

## Import

```typescript
import { CodeBlock, InlineCode } from 'tuiuiu.js'
```

## Basic Usage

```typescript
CodeBlock({
  code: `const greeting = 'Hello World';
console.log(greeting);`,
  language: 'typescript',
})
```

Output:
```
╭──────────────────────────────────╮
│ 1 │ const greeting = 'Hello World'; │
│ 2 │ console.log(greeting);          │
╰──────────────────────────────────╯
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | required | Code content |
| `language` | `Language` | `'plain'` | Language for highlighting |
| `lineNumbers` | `boolean` | `true` | Show line numbers |
| `startLine` | `number` | `1` | Starting line number |
| `highlightLines` | `number[]` | `[]` | Lines to highlight (1-indexed) |
| `highlightColor` | `ColorValue` | `'warning'` | Highlight color |
| `theme` | `Partial<CodeTheme>` | - | Custom theme |
| `filename` | `string` | - | Filename to display |
| `showFilename` | `boolean` | `true` | Show filename header |
| `maxWidth` | `number` | - | Max width (truncates) |
| `wrap` | `boolean` | `false` | Word wrap long lines |
| `showCopy` | `boolean` | `true` | Show copy indicator |
| `borderStyle` | `'none' \| 'single' \| 'round'` | `'round'` | Border style |
| `borderColor` | `ColorValue` | `'border'` | Border color |

## Supported Languages

| Language | Description |
|----------|-------------|
| `javascript` | JavaScript |
| `typescript` | TypeScript |
| `python` | Python |
| `json` | JSON |
| `yaml` | YAML |
| `bash` | Bash/Shell |
| `shell` | Shell scripts |
| `html` | HTML |
| `css` | CSS |
| `sql` | SQL |
| `go` | Go |
| `rust` | Rust |
| `markdown` | Markdown |
| `diff` | Diff format |
| `plain` | Plain text |

## CodeTheme

| Token | Description |
|-------|-------------|
| `keyword` | Keywords (const, function, if) |
| `string` | String literals |
| `number` | Numeric values |
| `comment` | Comments |
| `function` | Function names |
| `variable` | Variables |
| `operator` | Operators |
| `punctuation` | Punctuation |
| `type` | Type names |
| `constant` | Constants (true, false) |
| `builtin` | Built-in functions |
| `added` | Added lines (diff) |
| `removed` | Removed lines (diff) |
| `lineNumber` | Line numbers |
| `background` | Background color |

## Features

### With Filename Header

```typescript
CodeBlock({
  code: 'export function hello() { }',
  language: 'typescript',
  filename: 'src/utils.ts',
})
```

Output:
```
📄 src/utils.ts  [copy]
╭─────────────────────────────────╮
│ 1 │ export function hello() { } │
╰─────────────────────────────────╯
```

### Line Highlighting

```typescript
CodeBlock({
  code: `function add(a, b) {
  const result = a + b;
  return result;
}`,
  language: 'javascript',
  highlightLines: [2],
})
```

Output:
```
  1 │ function add(a, b) {
▶ 2 │   const result = a + b;
  3 │   return result;
  4 │ }
```

### Diff Mode

```typescript
CodeBlock({
  code: `- const old = 'value';
+ const new = 'updated';
  unchanged line`,
  language: 'diff',
})
```

Output shows added lines in green, removed in red.

### Custom Starting Line

```typescript
CodeBlock({
  code: '// Code from line 50',
  language: 'typescript',
  startLine: 50,
})
```

### Custom Theme

```typescript
CodeBlock({
  code: 'const x = 1;',
  language: 'typescript',
  theme: {
    keyword: 'magenta',
    string: 'green',
    number: 'cyan',
    comment: 'gray',
  },
})
```

## InlineCode

Single line code without line numbers:

```typescript
// Plain inline code
InlineCode({ code: 'npm install' })

// With language highlighting
InlineCode({ code: 'const x = 1', language: 'typescript' })

// Custom color
InlineCode({ code: 'success', color: 'green' })
```

Output: ` npm install `

### InlineCode Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | required | Code content |
| `language` | `Language` | `'plain'` | Language highlighting |
| `color` | `ColorValue` | `'primary'` | Text color |

## Examples

### Function Documentation

```typescript
Box({ flexDirection: 'column' },
  Text({ bold: true }, 'Usage:'),
  CodeBlock({
    code: `import { render } from 'tuiuiu.js'

const app = () => Box({}, Text({}, 'Hello'))
render(app)`,
    language: 'typescript',
    filename: 'example.ts',
  })
)
```

### Error Display

```typescript
CodeBlock({
  code: errorStack,
  language: 'plain',
  highlightLines: [1], // Highlight error line
  highlightColor: 'destructive',
  borderColor: 'destructive',
})
```

### Configuration File

```typescript
CodeBlock({
  code: JSON.stringify(config, null, 2),
  language: 'json',
  filename: 'config.json',
  lineNumbers: false,
})
```

## Related

- [Markdown](/components/molecules/markdown.md) - Markdown with code blocks
- [Tree](/components/molecules/tree.md) - Hierarchical data display

