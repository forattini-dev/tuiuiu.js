# Data Display

Components for displaying structured data in tables, trees, and lists.

> For charts and gauges, see [Data Visualization](/components/viz/index.md).

## Table

Basic table for displaying tabular data.

```typescript
import { Table } from 'tuiuiu.js'

Table({
  columns: [
    { key: 'name', label: 'Name', width: 20 },
    { key: 'role', label: 'Role', width: 15 },
    { key: 'status', label: 'Status', width: 10 },
  ],
  data: [
    { name: 'Alice Johnson', role: 'Engineer', status: 'Active' },
    { name: 'Bob Smith', role: 'Designer', status: 'Away' },
    { name: 'Carol White', role: 'Manager', status: 'Active' },
  ],
})
```

### Table Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | `TableColumn[]` | required | Column definitions |
| `data` | `Record<string, any>[]` | required | Data rows |
| `borderStyle` | `'single' \| 'double' \| 'round' \| 'none'` | `'single'` | Border style |
| `borderColor` | `ColorValue` | `'gray'` | Border color |
| `headerColor` | `ColorValue` | `'cyan'` | Header text color |
| `showHeader` | `boolean` | `true` | Show column headers |
| `striped` | `boolean` | `false` | Alternating row colors |

See also: [DataTable (Organism)](/components/organisms/data-table.md) for interactive tables with sorting, filtering, and pagination.

## Tree

Hierarchical data display with expand/collapse.

```typescript
import { Tree } from 'tuiuiu.js'

Tree({
  nodes: [
    {
      id: 'src',
      label: 'src',
      icon: '📁',
      children: [
        { id: 'index', label: 'index.ts', icon: '📄' },
        { id: 'utils', label: 'utils.ts', icon: '📄' },
        {
          id: 'components',
          label: 'components',
          icon: '📁',
          children: [
            { id: 'button', label: 'Button.ts', icon: '📄' },
          ],
        },
      ],
    },
    { id: 'readme', label: 'README.md', icon: '📝' },
  ],
})
```

### Tree Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `TreeNode[]` | required | Tree data |
| `initialExpanded` | `string[]` | `[]` | Initially expanded node IDs |
| `indentSize` | `number` | `2` | Indentation per level |
| `colorSelected` | `ColorValue` | `'cyan'` | Selected node color |
| `showGuides` | `boolean` | `true` | Show tree guide lines |
| `onSelect` | `(node: TreeNode) => void` | - | Selection callback |
| `onExpand` | `(node: TreeNode) => void` | - | Expand callback |

See also: [Tree (Molecule)](/components/molecules/tree.md) for full API documentation.

## CodeBlock

Syntax-highlighted code display.

```typescript
import { CodeBlock } from 'tuiuiu.js'

CodeBlock({
  code: `function greet(name: string) {
  return \`Hello, \${name}!\`;
}`,
  language: 'typescript',
  showLineNumbers: true,
})
```

### CodeBlock Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `code` | `string` | required | Source code |
| `language` | `string` | `'text'` | Language for highlighting |
| `showLineNumbers` | `boolean` | `false` | Show line numbers |
| `startLine` | `number` | `1` | Starting line number |
| `highlightLines` | `number[]` | `[]` | Lines to highlight |

See also: [CodeBlock (Molecule)](/components/molecules/code-block.md) for full API documentation.

## Markdown

Render markdown content.

```typescript
import { Markdown } from 'tuiuiu.js'

Markdown({
  content: `# Hello

This is **bold** and _italic_ text.

- Item 1
- Item 2

\`\`\`typescript
const x = 1;
\`\`\`
`,
})
```

See also: [Markdown (Molecule)](/components/molecules/markdown.md) for full API documentation.

## Related

- [DataTable](/components/organisms/data-table.md) - Interactive tables with sorting/filtering
- [Tree](/components/molecules/tree.md) - Full tree documentation
- [CodeBlock](/components/molecules/code-block.md) - Full code block documentation
- [Data Visualization](/components/viz/index.md) - Charts, gauges, and heatmaps
