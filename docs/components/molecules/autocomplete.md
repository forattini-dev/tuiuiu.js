# Autocomplete

Text input with dropdown suggestions, fuzzy search, and type-ahead.

## Import

```typescript
import { Autocomplete, createAutocomplete, Combobox, TagInput, createTagInput } from 'tuiuiu.js'
```

## Basic Usage

```typescript
Autocomplete({
  items: [
    { value: 'react', label: 'React' },
    { value: 'vue', label: 'Vue.js' },
    { value: 'angular', label: 'Angular' },
    { value: 'svelte', label: 'Svelte' },
  ],
  placeholder: 'Search frameworks...',
  onSelect: (item) => console.log('Selected:', item),
})
```

Output:
```
╭────────────────────────────────╮
│ re|                            │
╰────────────────────────────────╯
┌────────────────────────────────┐
│ ❯ React                        │
│   Preact - Fast 3kB alternative│
╰────────────────────────────────╯
```

## AutocompleteItem Interface

| Field | Type | Description |
|-------|------|-------------|
| `value` | `T` | Unique value |
| `label` | `string` | Display label |
| `description` | `string` | Optional description |
| `disabled` | `boolean` | Disable this item |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `AutocompleteItem[]` | required | Available items |
| `initialValue` | `string` | `''` | Initial input value |
| `placeholder` | `string` | `''` | Placeholder text |
| `maxSuggestions` | `number` | `5` | Max visible suggestions |
| `minChars` | `number` | `1` | Min chars before suggesting |
| `filter` | `(query, items) => items` | fuzzy | Custom filter function |
| `allowFreeText` | `boolean` | `true` | Allow values not in list |
| `width` | `number` | `30` | Input width |
| `fullWidth` | `boolean` | `false` | Expand to fill width |
| `colorActive` | `ColorValue` | `'primary'` | Active color |
| `colorSelected` | `ColorValue` | `'success'` | Selected item color |
| `onChange` | `(value: string) => void` | - | Input change callback |
| `onSelect` | `(item) => void` | - | Item selection callback |
| `onSubmit` | `(value, item?) => void` | - | Submit callback |
| `isActive` | `boolean` | `true` | Handle keyboard |
| `state` | `AutocompleteState` | - | External state |
| `label` | `string` | - | Input label |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` | Previous suggestion |
| `↓` | Next suggestion |
| `←` / `→` | Move cursor |
| `Enter` | Select suggestion / Submit |
| `Tab` | Select current suggestion |
| `Escape` | Close suggestions |
| `Backspace` | Delete character |
| `Ctrl+A` | Move to start |
| `Ctrl+E` | Move to end |

## Programmatic Control

```typescript
const state = createAutocomplete({
  items: [...],
  onSelect: (item) => console.log(item),
})

// Input control
state.setInput('react')       // Set input value
state.insertChar('a')         // Insert character
state.deleteBack()            // Delete backward
state.deleteForward()         // Delete forward

// Cursor control
state.moveCursorLeft()        // Move cursor left
state.moveCursorRight()       // Move cursor right
state.moveCursorHome()        // Move to start
state.moveCursorEnd()         // Move to end

// Suggestion control
state.moveUp()                // Previous suggestion
state.moveDown()              // Next suggestion
state.selectCurrent()         // Select current
state.open()                  // Open suggestions
state.close()                 // Close suggestions
state.submit()                // Submit value

// State access
state.inputValue()            // Current input
state.cursorPos()             // Cursor position
state.suggestions()           // Filtered suggestions
state.selectedIndex()         // Selected suggestion index
state.isOpen()                // Is dropdown open

// Use with component
Autocomplete({ state, items: [...] })
```

## Fuzzy Matching

Default filter uses smart fuzzy matching:

1. Exact prefix match (highest score)
2. Substring match
3. Description match
4. Character sequence match (fuzzy)

```typescript
// "re" matches:
// - "React" (prefix match - highest)
// - "Preact" (substring match)
// - "Vue.js" with description "reactive" (description match)
```

## Custom Filter

```typescript
Autocomplete({
  items: [...],
  filter: (query, items) => {
    // Case-insensitive contains
    return items.filter(item =>
      item.label.toLowerCase().includes(query.toLowerCase())
    )
  },
})
```

## Combobox

Autocomplete that requires selection from list (no free text):

```typescript
Combobox({
  items: countries,
  placeholder: 'Select country...',
  errorMessage: 'Please select a valid country',
})
```

Inherits all Autocomplete props but with `allowFreeText: false`.

## TagInput

Multiple selection with tag chips:

```typescript
TagInput({
  items: [
    { value: 'js', label: 'JavaScript' },
    { value: 'ts', label: 'TypeScript' },
    { value: 'py', label: 'Python' },
    { value: 'go', label: 'Go' },
  ],
  placeholder: 'Add skills...',
  maxTags: 5,
  onChange: (values) => console.log('Tags:', values),
})
```

Output:
```
┌─────────────────────────────────────────────┐
│ JavaScript x  TypeScript x  Add skills...  │
└─────────────────────────────────────────────┘
```

### TagInput Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `AutocompleteItem[]` | required | Available items |
| `initialValues` | `T[]` | `[]` | Initially selected values |
| `maxTags` | `number` | `Infinity` | Maximum tags allowed |
| `placeholder` | `string` | `'Add tag...'` | Placeholder text |
| `width` | `number` | `40` | Component width |
| `fullWidth` | `boolean` | `false` | Expand to fill |
| `colorTag` | `ColorValue` | `'primary'` | Tag background color |
| `colorActive` | `ColorValue` | `'warning'` | Active suggestion color |
| `onChange` | `(values: T[]) => void` | - | Change callback |
| `isActive` | `boolean` | `true` | Handle keyboard |

### TagInput Keyboard

| Key | Action |
|-----|--------|
| `Backspace` (empty input) | Remove last tag |
| `Enter` / `Tab` | Add selected suggestion |
| Characters | Type to filter |

### TagInput State

```typescript
const state = createTagInput({
  items: [...],
  maxTags: 5,
})

// Tag management
state.addTag('js')       // Add tag
state.removeTag('ts')    // Remove specific tag
state.removeLastTag()    // Remove last tag

// Input control
state.setInput('type')   // Set filter text

// State access
state.tags()             // Array of selected values
state.inputValue()       // Current filter text
state.suggestions()      // Filtered suggestions
state.selectedIndex()    // Selected suggestion
state.isOpen()           // Is dropdown open
```

## Features

### With Descriptions

```typescript
Autocomplete({
  items: [
    { value: 'npm', label: 'npm', description: 'Node Package Manager' },
    { value: 'yarn', label: 'Yarn', description: 'Fast, reliable, secure' },
    { value: 'pnpm', label: 'pnpm', description: 'Fast, disk efficient' },
  ],
})
```

### With Label

```typescript
Autocomplete({
  label: 'Package Manager',
  items: [...],
  placeholder: 'Select...',
})
```

### Full Width

```typescript
Autocomplete({
  items: [...],
  fullWidth: true,
})
```

### Minimum Characters

```typescript
Autocomplete({
  items: largeList,
  minChars: 2, // Only show suggestions after 2 chars
  maxSuggestions: 10,
})
```

## Examples

### Search Box

```typescript
function SearchBox({ onSearch }) {
  const [results, setResults] = useState([])

  return Autocomplete({
    items: results,
    placeholder: 'Search...',
    filter: async (query, items) => {
      const data = await fetchResults(query)
      setResults(data)
      return data
    },
    onSubmit: (value) => onSearch(value),
  })
}
```

### Command Palette

```typescript
Autocomplete({
  items: [
    { value: 'file:new', label: 'New File', description: 'Create a new file' },
    { value: 'file:open', label: 'Open File', description: 'Open an existing file' },
    { value: 'file:save', label: 'Save', description: 'Save current file' },
    { value: 'edit:undo', label: 'Undo', description: 'Undo last action' },
    { value: 'edit:redo', label: 'Redo', description: 'Redo last action' },
  ],
  placeholder: 'Type a command...',
  fullWidth: true,
  onSelect: (item) => executeCommand(item.value),
})
```

### Skill Selection Form

```typescript
function SkillForm() {
  const [skills, setSkills] = useState([])

  return Box({ flexDirection: 'column', gap: 1 },
    TextInput({ label: 'Name' }),
    TextInput({ label: 'Email' }),
    TagInput({
      items: allSkills,
      initialValues: skills,
      placeholder: 'Add skills...',
      maxTags: 10,
      onChange: setSkills,
    }),
    Button({
      label: 'Submit',
      onClick: () => submitForm({ skills }),
    }),
  )
}
```

### Country Selector

```typescript
Combobox({
  items: countries.map(c => ({
    value: c.code,
    label: c.name,
    description: c.region,
  })),
  placeholder: 'Select country...',
  onSelect: (item) => setCountry(item.value),
})
```

### User Mention Input

```typescript
Autocomplete({
  items: users.map(u => ({
    value: u.id,
    label: `@${u.username}`,
    description: u.name,
  })),
  minChars: 1,
  onSelect: (item) => insertMention(item.value),
})
```

## Related

- [Select](/components/molecules/select.md) - Dropdown selection
- [TextInput](/components/atoms/text-input.md) - Text input
- [Table](/components/molecules/table.md) - Data tables

