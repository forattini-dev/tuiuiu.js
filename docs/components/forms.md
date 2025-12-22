# Form Components

Interactive components for user input.

## TextInput

A fully featured text input field.

### Features
- Cursor navigation
- History support (Up/Down arrows)
- Password mode (masking)
- Multi-line support
- Placeholder text

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `initialValue` | `string` | Starting value |
| `placeholder` | `string` | Text when empty |
| `password` | `boolean` | Mask characters |
| `onChange` | `(val: string) => void` | Change handler |
| `onSubmit` | `(val: string) => void` | Enter key handler |

### Usage (with state)

```typescript
const input = createTextInput({
  placeholder: 'Enter name...',
  onSubmit: (name) => console.log('Hello', name)
});

// Render
renderTextInput(input);
```

?> **Testing Tip:** When unit testing `TextInput` logic without rendering, you must manually register the input handler: `addInputHandler(input.handleInput)`.

## Select

A dropdown-like selection component.

### Features
- Single or Multi-select
- Search / Filtering
- Keyboard navigation
- Grouping

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `items` | `SelectItem[]` | List of items `{ label, value }` |
| `multiple` | `boolean` | Allow multiple selections |
| `searchable` | `boolean` | Enable filtering |

### Usage

```typescript
const select = createSelect({
  items: [
    { label: 'Option A', value: 'a' },
    { label: 'Option B', value: 'b' }
  ],
  onSubmit: (val) => console.log('Selected:', val)
});

// Render
renderSelect(select);
```

## Checkbox

A convenience wrapper around `Select` with `multiple: true`.

### Example

```typescript
Checkbox({
  items: [
    { label: 'Read Terms', value: 'terms' },
    { label: 'Subscribe', value: 'sub' }
  ],
  onSubmit: (values) => console.log('Checked:', values)
})
```

## ConfirmDialog

A pre-built modal for Yes/No confirmations.

### Example

```typescript
const confirm = createConfirmDialog({
  title: 'Delete File?',
  message: 'Are you sure?',
  onConfirm: () => deleteFile()
});

// Render
ConfirmDialog(confirm.props);
```
