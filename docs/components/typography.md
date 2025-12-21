# Typography Components

Components for rendering text and rich content.

## Text

The basic component for rendering text. Supports colors and text modifiers.

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `color` | `string` | Text color (name or hex) |
| `backgroundColor` | `string` | Background color |
| `bold` | `boolean` | Bold text |
| `dim` | `boolean` | Dim text |
| `italic` | `boolean` | Italic text |
| `underline` | `boolean` | Underlined text |
| `strikethrough` | `boolean` | Strikethrough text |
| `wrap` | `'wrap' \| 'truncate'` | Text wrapping mode |

### Example

```typescript
Text({ color: 'green', bold: true }, 'Success!')
```

## Markdown

Renders rich Markdown content in the terminal.

### Supported Features
- Headers (`#`, `##`, etc.)
- Bold (`**text**`), Italic (`*text*`)
- Lists (`- item`, `1. item`)
- Blockquotes (`> text`)
- Code Blocks (```)
- Tables
- Links

### Example

```typescript
Markdown({
  content: `
    # Hello World
    This is **bold** and *italic*.
    - Item 1
    - Item 2
  `
})
```

## CodeBlock

Renders syntax-highlighted code blocks with line numbers.

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `code` | `string` | The code to render |
| `language` | `string` | Language for highlighting (js, ts, python, etc.) |
| `lineNumbers` | `boolean` | Show line numbers |
| `highlightLines` | `number[]` | Lines to visually highlight |
| `theme` | `CodeTheme` | Custom color theme |

### Example

```typescript
CodeBlock({
  code: 'const a = 1;',
  language: 'javascript',
  highlightLines: [1]
})
```

## InlineCode

Renders a small snippet of code inline with other text.

### Example

```typescript
Box({ flexDirection: 'row' },
  Text({}, 'Run '),
  InlineCode({ code: 'npm install' }),
  Text({}, ' to start.')
)
```

```