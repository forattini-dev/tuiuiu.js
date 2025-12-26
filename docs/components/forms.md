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

## FormField

A wrapper component for form inputs with label, error, and helper text support.

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `label` | `string` | Field label |
| `required` | `boolean` | Show required indicator |
| `error` | `string` | Error message |
| `helperText` | `string` | Helper text (shown when no error) |
| `children` | `VNode` | Input component |

### Example

```typescript
FormField({
  label: 'Email',
  required: true,
  error: errors.email,
  helperText: 'We will never share your email',
  children: TextInput({ ...form.field('email') }),
})
```

## FormGroup

A container for multiple related form fields with consistent styling.

### Example

```typescript
FormGroup({
  title: 'Personal Information',
  children: [
    FormField({ label: 'Name', children: TextInput({ ... }) }),
    FormField({ label: 'Email', children: TextInput({ ... }) }),
  ],
})
```

## Specialized Inputs

### SearchInput

Text input with search icon and clear button.

```typescript
const search = createSearchInput({
  placeholder: 'Search...',
  onSubmit: (query) => performSearch(query),
})

SearchInput({ state: search })
```

### PasswordInput

Text input with show/hide toggle.

```typescript
const password = createPasswordInput({
  placeholder: 'Enter password',
})

PasswordInput({ state: password })
```

### NumberInput

Numeric input with increment/decrement buttons.

```typescript
const count = createNumberInput({
  min: 0,
  max: 100,
  step: 1,
  initialValue: 50,
})

NumberInput({ state: count })
```

## Form State Management

For complex forms, use the `useForm` hook. See the [useForm](/hooks/use-form.md) documentation for details.

```typescript
import { useForm, FormField, TextInput, Button } from 'tuiuiu.js'

const form = useForm({
  initialValues: { email: '', password: '' },
  validate: (values) => ({
    email: !values.email ? 'Required' : undefined,
  }),
  onSubmit: handleSubmit,
})

// Use form.field() for easy binding
FormField({
  label: 'Email',
  error: form.errors().email,
  children: TextInput({ ...form.field('email') }),
})
```

## Related

- [useForm](/hooks/use-form.md) - Form state management hook
- [Button](/components/atoms/button.md) - Button components
- [Modal](/components/organisms/modal.md) - Modal dialogs
