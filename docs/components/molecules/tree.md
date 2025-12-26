# Tree

Hierarchical data display with expand/collapse, keyboard navigation, and selection.

## Import

```typescript
import { Tree, createTree, DirectoryTree } from 'tuiuiu.js'
```

## Basic Usage

```typescript
Tree({
  nodes: [
    {
      id: 'root',
      label: 'Root',
      children: [
        { id: 'child1', label: 'Child 1' },
        { id: 'child2', label: 'Child 2' },
      ],
    },
  ],
})
```

Output:
```
❯ ▶ Root
    ├── Child 1
    └── Child 2
```

## TreeNode Interface

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `label` | `string` | Display label |
| `icon` | `string` | Optional icon |
| `children` | `TreeNode[]` | Child nodes |
| `data` | `T` | Associated data |
| `disabled` | `boolean` | Disabled state |
| `color` | `ColorValue` | Custom color |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `nodes` | `TreeNode[]` | required | Root nodes |
| `initialExpanded` | `string[]` | `[]` | Initially expanded node IDs |
| `initialSelected` | `string[]` | `[]` | Initially selected node IDs |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | `'single'` | Selection mode |
| `showGuides` | `boolean` | `true` | Show tree guides/lines |
| `indentSize` | `number` | `2` | Indentation size |
| `maxDepth` | `number` | `Infinity` | Max visible depth |
| `colorActive` | `ColorValue` | `'primary'` | Cursor color |
| `colorSelected` | `ColorValue` | `'success'` | Selected color |
| `colorGuide` | `ColorValue` | `'mutedForeground'` | Guide line color |
| `onSelect` | `(node) => void` | - | Selection callback |
| `onExpand` | `(node) => void` | - | Expand callback |
| `onCollapse` | `(node) => void` | - | Collapse callback |
| `isActive` | `boolean` | `true` | Handle keyboard |
| `state` | `TreeState` | - | External state |
| `label` | `string` | - | Tree title |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `k` | Move cursor up |
| `↓` / `j` | Move cursor down |
| `→` / `l` | Expand node |
| `←` / `h` | Collapse node |
| `Enter` / `Space` | Toggle selection or expand |
| `e` | Expand all |
| `c` | Collapse all |

## Visual Appearance

### With Guides (default)

```
❯ ▼ src
  │   ├── index.ts
  │   ├── utils.ts
  │   └── components
  │       ├── Button.tsx
  │       └── Input.tsx
  └── tests
      └── index.test.ts
```

### Without Guides

```typescript
Tree({
  nodes: [...],
  showGuides: false,
})
```
```
❯ ▼ src
    index.ts
    utils.ts
```

## Programmatic Control

```typescript
const state = createTree({
  nodes: [...],
  onSelect: (node) => console.log('Selected:', node.label),
})

// Navigation
state.moveUp()          // Move cursor up
state.moveDown()        // Move cursor down
state.moveTo('node-id') // Jump to specific node

// Expansion
state.expand('node-id')    // Expand node
state.collapse('node-id')  // Collapse node
state.toggle('node-id')    // Toggle expansion
state.toggleCurrent()      // Toggle current node
state.expandAll()          // Expand all nodes
state.collapseAll()        // Collapse all nodes

// Selection
state.select('node-id')       // Select node
state.deselect('node-id')     // Deselect node
state.toggleSelect('node-id') // Toggle selection
state.toggleSelectCurrent()   // Toggle current selection

// State access
state.cursorIndex()        // Current cursor position
state.expanded()           // Set of expanded IDs
state.selected()           // Set of selected IDs
state.flatNodes()          // Flattened visible nodes
state.getCurrentNode()     // Current node under cursor

// Use with component
Tree({ state, nodes: [...] })
```

## Selection Modes

### No Selection

```typescript
Tree({
  nodes: [...],
  selectionMode: 'none',
})
```

### Single Selection

```typescript
Tree({
  nodes: [...],
  selectionMode: 'single',
  onSelect: (node) => openFile(node.data),
})
```
```
  ● Root
  ○ Child 1
❯ ● Child 2  ← selected
```

### Multiple Selection

```typescript
Tree({
  nodes: [...],
  selectionMode: 'multiple',
  initialSelected: ['child1', 'child3'],
})
```
```
  ● Child 1  ← selected
  ○ Child 2
  ● Child 3  ← selected
```

## DirectoryTree

Specialized tree for file system display:

```typescript
DirectoryTree({
  nodes: [
    {
      id: 'src',
      label: 'src',
      data: { type: 'directory' },
      children: [
        { id: 'index.ts', label: 'index.ts', data: { type: 'file', size: 1024 } },
        { id: 'utils.ts', label: 'utils.ts', data: { type: 'file', size: 512 } },
      ],
    },
  ],
  showSizes: true,
  showHidden: false,
})
```

Output:
```
📁 src
   ├── 📘 index.ts (1K)
   └── 📘 utils.ts (512B)
```

### DirectoryTree Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `showSizes` | `boolean` | `false` | Show file sizes |
| `showHidden` | `boolean` | `false` | Show hidden files (.) |

### File Icons

Automatic icons based on file extension:

| Extension | Icon |
|-----------|------|
| `.ts`, `.tsx` | 📘 |
| `.js`, `.jsx` | 📙 |
| `.json` | 📋 |
| `.md` | 📝 |
| `.css` | 🎨 |
| `.html` | 🌐 |
| `.png`, `.jpg`, `.svg` | 🖼️ |
| `.env`, `.lock` | 🔒 |
| Directories | 📁 |
| Other files | 📄 |

## Features

### With Icons

```typescript
Tree({
  nodes: [
    { id: 'docs', label: 'Documentation', icon: '📚', children: [...] },
    { id: 'src', label: 'Source Code', icon: '💻', children: [...] },
    { id: 'tests', label: 'Tests', icon: '🧪', children: [...] },
  ],
})
```

### With Title

```typescript
Tree({
  nodes: [...],
  label: 'Project Structure',
})
```

### Limited Depth

```typescript
Tree({
  nodes: deepTree,
  maxDepth: 2, // Only show 2 levels
})
```

### Custom Colors

```typescript
Tree({
  nodes: [
    { id: 'error', label: 'Errors', color: 'destructive' },
    { id: 'warning', label: 'Warnings', color: 'warning' },
    { id: 'info', label: 'Info', color: 'info' },
  ],
})
```

## Examples

### File Browser

```typescript
function FileBrowser({ files, onFileSelect }) {
  return Tree({
    nodes: files,
    selectionMode: 'single',
    showGuides: true,
    onSelect: (node) => {
      if (node.data?.type === 'file') {
        onFileSelect(node.data.path)
      }
    },
  })
}
```

### Menu Structure

```typescript
Tree({
  nodes: [
    {
      id: 'file',
      label: 'File',
      children: [
        { id: 'new', label: 'New' },
        { id: 'open', label: 'Open' },
        { id: 'save', label: 'Save' },
      ],
    },
    {
      id: 'edit',
      label: 'Edit',
      children: [
        { id: 'undo', label: 'Undo' },
        { id: 'redo', label: 'Redo' },
      ],
    },
  ],
  selectionMode: 'single',
})
```

### Project Explorer

```typescript
const state = createTree({
  nodes: projectStructure,
  initialExpanded: ['src', 'components'],
  onSelect: (node) => editor.openFile(node.data.path),
})

Box({ flexDirection: 'column' },
  Text({ bold: true }, 'Explorer'),
  Tree({ state, nodes: projectStructure })
)
```

## Related

- [Select](/components/molecules/select.md) - Dropdown selection
- [Collapsible](/components/molecules/collapsible.md) - Expandable sections
- [Table](/components/molecules/table.md) - Data tables

