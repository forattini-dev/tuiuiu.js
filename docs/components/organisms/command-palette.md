# CommandPalette

Searchable command palette for quick navigation and actions (⌘K style).

## Import

```typescript
import { CommandPalette, createCommandPalette, GoToDialog, createGoToDialog } from 'tuiuiu.js'
```

## Basic Usage

```typescript
const palette = createCommandPalette({
  items: [
    { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', action: () => save() },
    { id: 'open', label: 'Open File', shortcut: 'Ctrl+O', category: 'File' },
    { id: 'search', label: 'Find in Files', shortcut: 'Ctrl+Shift+F' },
  ],
  onSelect: (item) => item.action?.(),
  onClose: () => setPaletteVisible(false),
})

// Render when visible
When(showPalette,
  () => CommandPalette({
    ...palette.props,
    query: palette.query(),
    filteredItems: palette.filteredItems(),
    selectedIndex: palette.selectedIndex(),
  })
)

// Handle input
useInput((input, key) => {
  if (key.upArrow) palette.selectPrev()
  else if (key.downArrow) palette.selectNext()
  else if (key.return) palette.confirm()
  else if (key.escape) palette.close()
  else if (key.backspace) palette.backspace()
  else if (input && !key.ctrl) palette.type(input)
})
```

## CommandItem Interface

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier |
| `label` | `string` | Display label |
| `description` | `string` | Optional description |
| `category` | `string` | Group category |
| `shortcut` | `string` | Keyboard shortcut display |
| `icon` | `string` | Single character icon |
| `action` | `() => void` | Action to execute |
| `meta` | `Record<string, unknown>` | Additional metadata |
| `disabled` | `boolean` | Disable this item |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `query` | `string` | required | Search query |
| `items` | `CommandItem[]` | required | All items |
| `filteredItems` | `CommandItem[]` | required | Filtered items |
| `selectedIndex` | `number` | required | Selected index |
| `placeholder` | `string` | `'Type to search...'` | Input placeholder |
| `title` | `string` | `'Command Palette'` | Dialog title |
| `maxVisible` | `number` | `10` | Max visible items |
| `showCategories` | `boolean` | `true` | Show category headers |
| `showShortcuts` | `boolean` | `true` | Show shortcuts |
| `width` | `number` | `60` | Palette width |
| `borderStyle` | `BorderStyle` | `'round'` | Border style |
| `borderColor` | `string` | theme | Border color |
| `highlightColor` | `string` | theme | Match highlight color |
| `selectedBg` | `string` | theme | Selected item background |
| `noResultsMessage` | `string` | `'No results found'` | Empty state message |
| `onItemClick` | `(item, index) => void` | - | Item click callback |

## State Factory

```typescript
const palette = createCommandPalette({
  items: [...],
  onSelect: (item) => console.log('Selected:', item),
  onClose: () => setVisible(false),
  focusTrap: true,
  restoreFocus: true,
  autoFocus: true,
  hotkeyScope: 'palette',
  props: {
    title: 'Quick Actions',
    maxVisible: 8,
    width: 50,
  },
})

// Input methods
palette.type('save')      // Type characters
palette.backspace()       // Delete last char
palette.clear()           // Clear query

// Navigation
palette.selectPrev()      // Previous item
palette.selectNext()      // Next item
palette.selectIndex(3)    // Jump to index

// Actions
palette.confirm()         // Execute selected
palette.close()           // Close palette

// State access
palette.query()           // Current query
palette.filteredItems()   // Filtered results
palette.selectedIndex()   // Selected index
palette.getSelected()     // Get selected item
palette.zoneId            // Focus zone ID

// Focus management
palette.activate()        // Activate focus trap
palette.deactivate()      // Deactivate focus trap

// Dynamic items
palette.setItems(newItems) // Update items
```

## Fuzzy Search

Built-in fuzzy search with scoring:

1. **Exact match** - Highest score (1000)
2. **Starts with** - High score (500+)
3. **Contains** - Medium score (200+)
4. **Character sequence** - Lower score

```typescript
// "sf" matches:
// - "Save File" (contains 's' then 'f')
// - "Settings for profile" (s...f)
// - NOT "File Size" (wrong order)
```

## Visual Appearance

```
╭──────────── Command Palette ────────────╮
│ ❯ save▌                                 │
│────────────────────────────────────────│
│ FILE                                    │
│ ❯ Save File                    Ctrl+S  │
│   Save As...                Ctrl+Shift+S│
│ EDIT                                    │
│   Save Selection                        │
│────────────────────────────────────────│
│ ↑↓ navigate  ⏎ select  esc close       │
╰────────────────────────────────────────╯
```

## Features

### Categories

```typescript
createCommandPalette({
  items: [
    { id: 'new', label: 'New File', category: 'File' },
    { id: 'open', label: 'Open...', category: 'File' },
    { id: 'undo', label: 'Undo', category: 'Edit' },
    { id: 'redo', label: 'Redo', category: 'Edit' },
  ],
  props: { showCategories: true },
})
```

### Icons

```typescript
{
  id: 'git',
  label: 'Git: Commit',
  icon: '📝',
  category: 'Source Control',
}
```

### Custom Filter

```typescript
createCommandPalette({
  items: [...],
  filter: (item, query) => {
    // Custom scoring function
    // Return -1 for no match, positive for match (higher = better)
    if (item.label.toLowerCase().includes(query)) return 100
    if (item.description?.includes(query)) return 50
    return -1
  },
})
```

### Focus Trap

```typescript
const palette = createCommandPalette({
  items: [...],
  focusTrap: true,      // Trap focus in palette
  restoreFocus: true,   // Restore focus on close
  autoFocus: true,      // Auto-focus first item
})

// When opening
palette.activate()

// When closing
palette.deactivate()
```

### Hotkey Scopes

```typescript
const palette = createCommandPalette({
  items: [...],
  hotkeyScope: 'command-palette',
})

// Automatically pushes scope on activate
// Automatically pops scope on close
```

## GoToDialog

Simple numeric input dialog:

```typescript
const goTo = createGoToDialog({
  max: totalSlides,
  onConfirm: (num) => goToSlide(num),
  onClose: () => setDialogVisible(false),
})

// Render
GoToDialog({
  value: goTo.value(),
  max: goTo.props.max,
  title: 'Go To Slide',
  prompt: 'Enter slide number:',
})

// Handle input
useInput((input, key) => {
  if (key.return) goTo.confirm()
  else if (key.escape) goTo.close()
  else if (key.backspace) goTo.backspace()
  else if (/\d/.test(input)) goTo.type(input)
})
```

### GoToDialog Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | required | Current input |
| `max` | `number` | required | Maximum value |
| `title` | `string` | `'Go To'` | Dialog title |
| `prompt` | `string` | `'Enter number:'` | Prompt text |
| `width` | `number` | `30` | Dialog width |
| `borderStyle` | `BorderStyle` | `'round'` | Border style |
| `borderColor` | `string` | `'primary'` | Border color |

## Examples

### Application Command Palette

```typescript
function AppCommandPalette() {
  const [visible, setVisible] = useState(false)

  const palette = createCommandPalette({
    items: [
      // File operations
      { id: 'new', label: 'New File', shortcut: '⌘N', category: 'File', action: newFile },
      { id: 'open', label: 'Open File', shortcut: '⌘O', category: 'File', action: openFile },
      { id: 'save', label: 'Save', shortcut: '⌘S', category: 'File', action: save },

      // Edit operations
      { id: 'undo', label: 'Undo', shortcut: '⌘Z', category: 'Edit', action: undo },
      { id: 'redo', label: 'Redo', shortcut: '⇧⌘Z', category: 'Edit', action: redo },

      // View
      { id: 'zoom-in', label: 'Zoom In', shortcut: '⌘+', category: 'View' },
      { id: 'zoom-out', label: 'Zoom Out', shortcut: '⌘-', category: 'View' },
    ],
    onSelect: (item) => {
      item.action?.()
      setVisible(false)
    },
    onClose: () => setVisible(false),
  })

  // Global hotkey to open
  useHotkeys('ctrl+k', () => {
    setVisible(true)
    palette.activate()
  })

  // Handle palette input
  useInput((input, key) => {
    if (!visible()) return
    if (key.upArrow) palette.selectPrev()
    else if (key.downArrow) palette.selectNext()
    else if (key.return) palette.confirm()
    else if (key.escape) palette.close()
    else if (key.backspace) palette.backspace()
    else if (input && !key.ctrl) palette.type(input)
  }, { isActive: visible })

  return When(visible, () =>
    Box({ position: 'absolute', top: 5, left: 10 },
      CommandPalette({
        ...palette.props,
        query: palette.query(),
        filteredItems: palette.filteredItems(),
        selectedIndex: palette.selectedIndex(),
      })
    )
  )
}
```

### Dynamic Items

```typescript
const palette = createCommandPalette({
  items: [],
  onSelect: (item) => executeCommand(item.id),
})

// Load commands dynamically
async function loadCommands() {
  const commands = await fetchCommands()
  palette.setItems(commands.map(cmd => ({
    id: cmd.id,
    label: cmd.name,
    description: cmd.description,
    category: cmd.category,
    action: () => cmd.execute(),
  })))
}
```

### Recent Files Palette

```typescript
createCommandPalette({
  items: recentFiles.map(file => ({
    id: file.path,
    label: file.name,
    description: file.path,
    icon: getFileIcon(file.extension),
    action: () => openFile(file.path),
  })),
  props: {
    title: 'Recent Files',
    showCategories: false,
    placeholder: 'Search recent files...',
  },
})
```

## Related

- [Modal](/components/organisms/modal.md) - Modal dialogs
- [Autocomplete](/components/molecules/autocomplete.md) - Type-ahead input
- [Select](/components/molecules/select.md) - Selection component

