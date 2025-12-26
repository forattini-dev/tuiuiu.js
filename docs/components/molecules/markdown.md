# Markdown

Terminal markdown renderer with syntax highlighting, tables, and rich formatting.

## Import

```typescript
import { Markdown, renderMarkdown } from 'tuiuiu.js'
```

## Basic Usage

```typescript
Markdown({
  content: `# Hello World

This is **bold** and *italic* text.

- Item 1
- Item 2
`,
})
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | required | Markdown content |
| `maxWidth` | `number` | - | Max width for text wrapping |
| `theme` | `MarkdownTheme` | - | Custom theme colors |
| `codeLineNumbers` | `boolean` | `true` | Show line numbers in code blocks |
| `indentSize` | `number` | - | Indent size for nested elements |

## Theme

| Token | Default | Description |
|-------|---------|-------------|
| `h1` | `'accent'` | Heading 1 color |
| `h2` | `'primary'` | Heading 2 color |
| `h3` | `'info'` | Heading 3 color |
| `h4` | `'success'` | Heading 4 color |
| `h5` | `'warning'` | Heading 5 color |
| `h6` | `'foreground'` | Heading 6 color |
| `bold` | `'foreground'` | Bold text color |
| `italic` | `'foreground'` | Italic text color |
| `link` | `'info'` | Link color |
| `code` | `'primary'` | Inline code color |
| `blockquote` | `'mutedForeground'` | Blockquote color |
| `listMarker` | `'primary'` | List bullet color |
| `hr` | `'border'` | Horizontal rule color |

## Supported Features

### Headers

```markdown
# H1 Heading
## H2 Heading
### H3 Heading
#### H4 Heading
##### H5 Heading
###### H6 Heading
```

### Text Formatting

```markdown
**bold text**
*italic text*
***bold and italic***
~~strikethrough~~
`inline code`
```

### Lists

```markdown
Unordered:
- Item 1
- Item 2
  - Nested item

Ordered:
1. First
2. Second
3. Third
```

### Task Lists

```markdown
- [x] Completed task
- [ ] Pending task
- [ ] Another task
```

Output:
```
☑ Completed task
☐ Pending task
☐ Another task
```

### Code Blocks

````markdown
```typescript
const greeting = 'Hello';
console.log(greeting);
```
````

Renders with syntax highlighting and line numbers.

### Blockquotes

```markdown
> This is a blockquote
> It can span multiple lines
```

Output:
```
│ This is a blockquote
│ It can span multiple lines
```

### Links and Images

```markdown
[Link Text](https://example.com)
![Alt Text](https://example.com/image.png)
```

Output:
```
Link Text (https://example.com)
🖼️ Alt Text (https://example.com/image.png)
```

### Horizontal Rules

```markdown
---
***
___
```

### Tables

```markdown
| Name  | Age | City |
|-------|-----|------|
| Alice | 30  | NYC  |
| Bob   | 25  | LA   |
```

Output:
```
│ Name  │ Age │ City │
├───────┼─────┼──────┤
│ Alice │ 30  │ NYC  │
│ Bob   │ 25  │ LA   │
```

## Alternative API

```typescript
// renderMarkdown function alias
const content = renderMarkdown(`# Title

Some content here.`)
```

## Examples

### Documentation Display

```typescript
Markdown({
  content: `# API Reference

## Installation

\`\`\`bash
npm install my-package
\`\`\`

## Usage

Import the module:

\`\`\`typescript
import { foo } from 'my-package'
\`\`\`

## Options

| Option | Type | Description |
|--------|------|-------------|
| \`name\` | string | The name |
| \`value\` | number | The value |
`,
  maxWidth: 80,
})
```

### README Viewer

```typescript
function ReadmeViewer({ content }) {
  return Box(
    { padding: 1 },
    Markdown({
      content,
      theme: {
        h1: 'cyan',
        h2: 'blue',
        link: 'magenta',
      },
    })
  )
}
```

### Custom Theme

```typescript
Markdown({
  content: readme,
  theme: {
    h1: 'cyan',
    h2: 'blue',
    h3: 'green',
    bold: 'yellow',
    code: 'magenta',
    blockquote: 'gray',
  },
})
```

### Changelog Display

```typescript
Markdown({
  content: `# Changelog

## [1.2.0] - 2024-01-15

### Added
- New feature X
- New feature Y

### Fixed
- Bug in component Z

### Changed
- Updated dependencies
`,
})
```

## Related

- [CodeBlock](/components/molecules/code-block.md) - Syntax highlighted code
- [Table](/components/molecules/table.md) - Data tables
- [Tree](/components/molecules/tree.md) - Hierarchical data

