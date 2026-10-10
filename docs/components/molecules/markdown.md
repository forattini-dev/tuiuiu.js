# Markdown

## Selectable Markdown reader

`MarkdownView` is a bounded, compact reader from `tuiuiu.js/ui`. It shares the
existing Markdown block/inline parsers and TextView interaction/viewport, without
changing the presentation or API of ordinary `Markdown`.

```ts
import { component, useConst, useEffect } from 'tuiuiu.js/app';
import { MarkdownView, createMarkdownSelection } from 'tuiuiu.js/ui';

const Reader = component('Reader', () => {
  const controller = useConst(() => createMarkdownSelection(
    '# Hello\n\nSelect **bold**, *italic*, and `code`.',
    { showLinkUrls: false },
  ));
  useEffect(() => () => controller.dispose());
  return MarkdownView({ selection: controller, width: 60, height: 12,
    isActive: true, copyMode: 'display' });
});
```

Run `pnpm example markdown-selection-lab` for resize, streaming append and a copy
preview. The demo does not write to the system clipboard.

The caller owns the controller. `update(source, options?)` updates content or
styles; omitted options preserve the previous configuration. Use controller
updates, not direct mutation of `selection.document`; bypassing the controller
invalidates the projection and later reads/updates reject it. Unmounting a view releases
subscriptions but does not dispose the caller's controller. Different readers
need different controllers unless intentionally sharing selection.

`selection` uses **display-document UTF-16 offsets**, not raw Markdown offsets.
`sourceRange()` projects the selected ink to its smallest enclosing raw source
interval. Hidden syntax between endpoints remains inside that interval. Generated
bullets, heading prefixes and inline-code padding have no source positions.
Selecting the whole nonempty display document returns the whole raw source,
including fences and delimiters. Empty selections return `null`.

`copyMode: 'display'` (default) copies projected text without soft-wrap newlines.
`'source'` copies the source interval; partial fragments need not be valid Markdown.
Both policies remove terminal protocols and control characters, including CR in
CRLF. `onCopy(text)` overrides the capability-aware clipboard adapter. Ctrl+Shift+C
copies, Ctrl+A selects all, Escape clears and Shift+arrows extends selection when
`isActive: true`. Mouse selection and wheel scrolling remain available when
keyboard routing is inactive.

This first reader supports styled headings, paragraphs, lists, quotes, links,
images-as-text and literal fenced code. Fences and code borders/gutters are not
painted; tables currently retain their literal source rows. It does not accept
custom block VNodes or provide syntax highlighting, selection between separate
views, double/triple-click selection, drag auto-scroll or search yet.
Block identities are retained on safe append, but the display projection and
viewport reflow still visit the document. Display-document edits cancel captured drags;
ordinary selection repaints do not. Source selections remain stable across resize,
and unchanged display prefixes remain selected across append updates.

## Ordinary Markdown

Terminal markdown renderer with syntax highlighting, tables, and rich formatting.

## Import

```typescript
import { Markdown, renderMarkdown, createMarkdownDocument } from 'tuiuiu.js/ui'
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

> **Note:** The Markdown component automatically fills the available width from its parent container using `width: '100%'`. You can explicitly set `maxWidth` if you need a specific width constraint.

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `string` | required | Markdown content |
| `document` | `MarkdownDocument` | - | Optional per-message incremental block cache |
| `maxWidth` | `number` | `'100%'` | Max width for text wrapping. Defaults to filling parent width |
| `theme` | `MarkdownTheme` | - | Custom theme colors |
| `codeLineNumbers` | `boolean` | `true` | Show line numbers in code blocks |
| `indentSize` | `number` | - | Indent size for nested elements |
| `showLinkUrls` | `boolean` | `true` | Display link/image destinations after their labels |
| `renderNode` | `(node, context) => VNode \| null \| undefined` | - | Override a block while retaining the default renderer as a fallback |

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

### Inline text flow

Paragraphs, headings, list items and quotes use structured inline spans in one
text flow. Bold/italic/strike can nest; escaped punctuation stays literal;
backtick code spans do not interpret emphasis. Balanced parentheses in link
destinations are supported. A formatting boundary does not introduce a line
break or stray indentation.

```typescript
Markdown({
  content: '**Bold and *italic together*** with [docs](https://example.org/a_(b)).',
  maxWidth: 60,
  showLinkUrls: false,
});
```

### Custom block rendering

The extension callback receives an immutable parsed block and a default-render
function. Return `null`/`undefined` to use the built-in renderer. Returned VNodes
retain their IDs and mouse handlers, including inside `ScrollList`.

```typescript
import { Box, Text } from 'tuiuiu.js';
import { Markdown } from 'tuiuiu.js/ui';

Markdown({
  content: '```ts\nconst answer = 42;\n```',
  renderNode(node, { defaultRender }) {
    if (node.type !== 'codeblock') return null;
    return Box({ flexDirection: 'column' },
      Text({ color: 'info', bold: true }, node.language ?? 'plain'),
      defaultRender(),
    );
  },
});
```

Custom renderer results are intentionally not cached, since the callback may
read application state. Built-in rendering still reuses stable blocks when a
per-message `document` is supplied. The inline parser has bounded nesting/work;
unsupported or excessively complex syntax remains literal. It does not replace
a CommonMark/GFM parser or provide Tree-sitter, per-span links, or text selection.

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
function ReadmeViewer({ content, width }) {
  return Box(
    { padding: 1 },
    Markdown({
      content,
      maxWidth: width - 2,  // Account for padding
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
  maxWidth: 80,
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
  maxWidth: 60,
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

### Inside Scroll or SplitPanel

The Markdown component now automatically fills the available width from its parent, so it works out of the box:

```typescript
// ✅ Works automatically - Markdown fills parent width
Scroll(
  { height: 20, width: 60 },
  Markdown({ content: readme }),  // Fills to 60 (or 58 with scrollbar)
)

// ✅ Also works with explicit maxWidth
Scroll(
  { height: 20, width: 60 },
  Markdown({ content: readme, maxWidth: 50 }),  // Explicitly smaller
)
```

```typescript
// Inside SplitPanel - works automatically
SplitPanel({
  direction: 'horizontal',
  width: 100,
  height: 30,
  ratio: 0.4,
  left: MenuList(),
  right: Markdown({ content: selectedDoc }),  // Fills right panel automatically
})
```

## Incremental streaming

Keep one document per message, not one shared cache for unrelated messages:

```ts
import { component, useConst } from 'tuiuiu.js/app';
import { createMarkdownDocument, TerminalMessage } from 'tuiuiu.js/ui';

const AssistantMessage = component('AssistantMessage', (props: {
  content: string;
  streaming: boolean;
}) => {
  const document = useConst(() => createMarkdownDocument());
  return TerminalMessage({
    role: 'assistant',
    content: props.content,
    streaming: props.streaming,
    streamingMarkdown: true,
    document,
    maxWidth: 80,
  });
});
```

The parser retains immutable identities for a grammar-stable prefix and reparses
the unfinished tail. Tables, partial delimiters, and unclosed code fences are
not prematurely committed. A replacement/truncation falls back to full parsing.
Rendering reuses stable block VNodes until formatting options change.
`document.snapshot()` reports revision, reused block count and the source offset
where parsing resumed.

No document is required for ordinary Markdown calls. Raw text remains
TerminalMessage's default during streaming; rich streaming is explicitly opt-in.
This implements Tuiuiu's Markdown subset, not a full CommonMark specification.
A long unfinished paragraph/fence still requires reparsing its tail; prefix
comparison, layout and frame rendering also have costs. Incremental parsing is
not a claim of constant-time streaming or a measured advantage over OpenTUI.

## Related

- [CodeBlock](/components/molecules/code-block.md) - Syntax highlighted code
- [Table](/components/molecules/table.md) - Data tables
- [Tree](/components/molecules/tree.md) - Hierarchical data

