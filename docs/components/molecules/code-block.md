# CodeBlock

Syntax highlighted code display with line numbers, highlighting, and themes.

## Import

```typescript
import { CodeBlock, InlineCode } from 'tuiuiu.js/ui'
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
| `maxWidth` | `number` | - | Code-row columns, including line numbers/markers, excluding border/padding and filename header |
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

### Structured highlighting and fitting

Code is highlighted as a whole source before lines are wrapped or truncated.
Multiline comments, Python triple-quoted strings, JavaScript template strings,
Go raw strings and Rust raw strings keep their style across lines. Tokens remain
structured spans inside one text flow per visual row, not separate flex items.
`InlineCode` uses the same highlighter and one text flow.

With `maxWidth`, `wrap: false` truncates with `…`; `wrap: true` uses the canonical
word fitter and blank continuation gutters. Both account for terminal columns,
not UTF-16 length. `maxWidth: 0` hides row content; negative or nonfinite values
throw. A viewport narrower than one wide grapheme can still clip that grapheme.
Without `maxWidth`, the surrounding layout determines available width.

```ts
CodeBlock({
  code: '/* multiline\nconst notAKeyword = 42;\n*/\nconst greeting = "Hello world";',
  language: 'typescript',
  maxWidth: 40,
  wrap: true,
  theme: { comment: 'gray', keyword: 'magenta', number: 'cyan' },
})
```

This is a lightweight lexical highlighter, not a full grammar parser or language
server. Function/type names are heuristics; template interpolation, regular
expression literals, heredocs and embedded languages are not parsed separately.
Unfinished strings/comments can be colored while streaming. Unknown Markdown
fence languages fall back to plain text. `showCopy` remains a label, not an
interactive clipboard action.

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

