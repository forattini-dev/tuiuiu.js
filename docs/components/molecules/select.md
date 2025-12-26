# Select

Interactive selection component with keyboard navigation, search, and multi-select support.

## Import

```typescript
import { Select, createSelect, Checkbox, Confirm } from 'tuiuiu.js'
```

## Basic Usage

```typescript
// Single select
Select({
  items: [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
  ],
  onSubmit: (value) => console.log('Selected:', value),
})

// Multi-select
Select({
  items: [...],
  multiple: true,
  onSubmit: (values) => console.log('Selected:', values),
})
```

## SelectItem

| Field | Type | Description |
|-------|------|-------------|
| `value` | `T` | Unique value |
| `label` | `string` | Display label |
| `description` | `string` | Optional description |
| `disabled` | `boolean` | Disable this item |
| `group` | `string` | Group header |
| `icon` | `string` | Icon/prefix |
| `color` | `string` | Custom color |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SelectItem[]` | required | Items to select from |
| `multiple` | `boolean` | `false` | Allow multiple selections |
| `initialValue` | `T \| T[]` | - | Initially selected |
| `maxVisible` | `number` | `10` | Max visible items |
| `searchable` | `boolean` | `false` | Enable search/filter |
| `searchPlaceholder` | `string` | `'Search...'` | Search placeholder |
| `cursorIndicator` | `string` | `'❯'` | Cursor indicator |
| `selectedIndicator` | `string` | `'●'` | Selected indicator |
| `checkedIndicator` | `string` | `'◉'` | Checked (multi) |
| `uncheckedIndicator` | `string` | `'○'` | Unchecked (multi) |
| `colorActive` | `string` | theme | Active item color |
| `colorSelected` | `string` | theme | Selected color |
| `showCount` | `boolean` | `false` | Show selection count |
| `fullWidth` | `boolean` | `false` | Expand to fill width |
| `isActive` | `boolean` | `true` | Handle keyboard input |
| `onChange` | `(value) => void` | - | Selection change |
| `onSubmit` | `(value) => void` | - | Enter key handler |
| `onCancel` | `() => void` | - | Escape handler |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `k` | Move up |
| `↓` / `j` | Move down |
| `Space` | Toggle selection (multi) |
| `Enter` | Submit selection |
| `Escape` | Cancel |
| `Home` / `g` | Go to first |
| `End` / `G` | Go to last |
| `a-z` | Type-ahead search |

## Visual Appearance

### Single Select
```
  Apple
❯ Banana     ← cursor
  Orange
```

### Multi Select
```
◉ Apple      ← checked
○ Banana     ← unchecked
◉ Orange     ← checked
```

## Programmatic Control

```typescript
const select = createSelect({
  items: [...],
  multiple: true,
})

// Navigation
select.next()       // Move cursor down
select.prev()       // Move cursor up
select.first()      // Go to first
select.last()       // Go to last

// Selection
select.toggle()     // Toggle current item
select.select()     // Select current (single)
select.selectAll()  // Select all (multi)
select.deselectAll()// Deselect all

// Search
select.search('ban') // Filter items

// State
select.cursor()     // Current cursor index
select.selected()   // Selected value(s)
select.items()      // Filtered items

// Render
renderSelect(select)
```

## Features

### With Descriptions

```typescript
Select({
  items: [
    { value: 'npm', label: 'npm', description: 'Node Package Manager' },
    { value: 'yarn', label: 'Yarn', description: 'Fast, reliable, secure' },
    { value: 'pnpm', label: 'pnpm', description: 'Fast, disk efficient' },
  ],
})
```

### With Groups

```typescript
Select({
  items: [
    { value: 'red', label: 'Red', group: 'Warm Colors' },
    { value: 'orange', label: 'Orange' },
    { value: 'blue', label: 'Blue', group: 'Cool Colors' },
    { value: 'green', label: 'Green' },
  ],
})
```

Output:
```
── Warm Colors ──
  Red
  Orange
── Cool Colors ──
  Blue
  Green
```

### With Icons

```typescript
Select({
  items: [
    { value: 'js', label: 'JavaScript', icon: '📜' },
    { value: 'ts', label: 'TypeScript', icon: '💙' },
    { value: 'py', label: 'Python', icon: '🐍' },
  ],
})
```

### Searchable

```typescript
Select({
  items: countries, // large list
  searchable: true,
  searchPlaceholder: 'Type to filter...',
  maxVisible: 10,
})
```

## Checkbox

Alias for single-column multi-select:

```typescript
Checkbox({
  items: [
    { value: 'terms', label: 'Accept terms' },
    { value: 'newsletter', label: 'Subscribe to newsletter' },
  ],
  initialValue: ['terms'],
  onSubmit: (selected) => save(selected),
})
```

## Confirm

Yes/No confirmation dialog:

```typescript
Confirm({
  message: 'Are you sure you want to delete?',
  onConfirm: () => deleteItem(),
  onCancel: () => console.log('Cancelled'),
})
```

Output:
```
Are you sure you want to delete?
  Yes
❯ No
```

## Examples

### Package Manager Selection

```typescript
function SelectPackageManager() {
  return Select({
    items: [
      { value: 'npm', label: 'npm', description: 'Default Node.js package manager' },
      { value: 'yarn', label: 'Yarn', description: 'Facebook package manager' },
      { value: 'pnpm', label: 'pnpm', description: 'Performant npm' },
    ],
    onSubmit: (pm) => initProject(pm),
    onCancel: () => exit(),
  })
}
```

### Feature Selection

```typescript
function SelectFeatures() {
  return Select({
    items: [
      { value: 'ts', label: 'TypeScript', group: 'Language' },
      { value: 'eslint', label: 'ESLint', group: 'Tooling' },
      { value: 'prettier', label: 'Prettier' },
      { value: 'jest', label: 'Jest', group: 'Testing' },
      { value: 'vitest', label: 'Vitest' },
    ],
    multiple: true,
    showCount: true,
    onSubmit: (features) => scaffold(features),
  })
}
```

## Related

- [MultiSelect](/components/forms.md#multiselect) - Full multi-select
- [RadioGroup](/components/forms.md#radiogroup) - Radio buttons
- [Autocomplete](/components/forms.md#autocomplete) - With async search
