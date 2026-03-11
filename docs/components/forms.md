# Form Components

Interactive form controls for TUI workflows.

## Canonical State Path

For normal component usage, prefer the rerender-safe hook path:

```typescript
import {
  Box,
  FormField,
  Select,
  TextInput,
  useSelectState,
  useState,
  useTextInputState,
} from 'tuiuiu.js';

function ProfileForm() {
  const [step, setStep] = useState(0);
  const roleOptions = [
    { value: 'dev', label: 'Developer' },
    { value: 'design', label: 'Designer' },
  ];

  const name = useTextInputState({
    placeholder: 'Enter name...',
    isActive: () => step() === 0,
    onSubmit: () => setStep(1),
  });

  const role = useSelectState({
    items: roleOptions,
    isActive: () => step() === 1,
  });

  return Box(
    { flexDirection: 'column', gap: 1 },
    FormField({
      label: 'Name',
      children: TextInput({ state: name, borderStyle: 'round', fullWidth: true }),
    }),
    FormField({
      label: 'Role',
      children: Select({ state: role, items: roleOptions, borderStyle: 'round', showCount: false }),
    })
  );
}
```

Use `createTextInput()` / `renderTextInput()` and `createSelect()` / `renderSelect()` when you explicitly need low-level or programmatic control.

The same rerender-safe pattern now applies to `MultiSelect`, `Autocomplete`, and `TagInput`: use the direct component API for ordinary screens, and reach for `useMultiSelectState()` / `useAutocompleteState()` when you need explicit controller reuse.

## TextInput

### Features

- Cursor navigation
- History support
- Password mode
- Multi-line mode with wrapping
- Auto-grow and scrollbar
- Click-to-caret

### Main Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `state` | `ReturnType<typeof createTextInput>` | External state from `useTextInputState()` or `createTextInput()` |
| `initialValue` | `string` | Starting value |
| `placeholder` | `string` | Text when empty |
| `password` | `boolean` | Mask characters |
| `multiline` | `boolean` | Enable multi-line input |
| `wordWrap` | `boolean` | Wrap text at the input width |
| `maxLines` | `number` | Maximum visible lines before scrolling |
| `autoGrow` | `boolean` | Grow height up to `maxLines` |
| `showScrollbar` | `boolean` | Show overflow scrollbar |
| `onChange` | `(val: string) => void` | Change handler |
| `onSubmit` | `(val: string) => void` | Enter key handler |

### Canonical Usage

```typescript
const message = useTextInputState({
  multiline: true,
  wordWrap: true,
  autoGrow: true,
  maxLines: 5,
  placeholder: 'Type your message...',
});

TextInput({
  state: message,
  borderStyle: 'round',
  fullWidth: true,
});
```

### Advanced Usage

```typescript
const input = createTextInput({
  history: ['help', 'status', 'deploy'],
  onSubmit: runCommand,
});

renderTextInput(input, {
  borderStyle: 'round',
  fullWidth: true,
});
```

## Select

### Features

- Single or multi-select
- Search/filter
- Grouping
- Keyboard navigation

### Main Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `state` | `ReturnType<typeof createSelect>` | External state from `useSelectState()` or `createSelect()` |
| `items` | `SelectItem[]` | List of options |
| `multiple` | `boolean` | Allow multiple selection |
| `searchable` | `boolean` | Enable filtering |
| `showCount` | `boolean` | Show footer count |
| `borderStyle` | `'none' \| 'single' \| 'round' \| 'double'` | Optional border |

### Canonical Usage

```typescript
const countryOptions = [
  { value: 'br', label: 'Brazil' },
  { value: 'us', label: 'United States' },
];

const country = useSelectState({
  items: countryOptions,
  searchable: true,
});

Select({
  state: country,
  items: countryOptions,
  borderStyle: 'round',
});
```

### Advanced Usage

```typescript
const select = createSelect({
  items: countryOptions,
  searchable: true,
});

renderSelect(select, {
  items: countryOptions,
  borderStyle: 'round',
});
```

## Specialized Inputs

These wrappers now follow the same rerender-safe pattern internally:

```typescript
SearchInput({ placeholder: 'Search...' })
PasswordInput({ placeholder: 'Password' })
NumberInput({ min: 0, max: 100, step: 1 })
```

You can still pass `state` when you want explicit control:

```typescript
const search = createSearchInput({ onSubmit: performSearch });
SearchInput({ state: search });
```

## MultiSelect and Autocomplete

```typescript
const skillOptions = [
  { value: 'ts', label: 'TypeScript' },
  { value: 'go', label: 'Go' },
];

const frameworkOptions = [
  { value: 'react', label: 'React' },
  { value: 'solid', label: 'Solid' },
];

const skills = useMultiSelectState({
  items: [
    ...skillOptions,
  ],
  searchable: true,
});

const framework = useAutocompleteState({
  items: frameworkOptions,
});

MultiSelect({ state: skills, items: skillOptions, showTags: true })
Autocomplete({ state: framework, items: frameworkOptions, placeholder: 'Search...' })
```

`TagInput` also accepts `state` and keeps internal selections stable across parent rerenders.

## FormField

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

```typescript
FormGroup({
  title: 'Personal Information',
  children: [
    FormField({ label: 'Name', children: TextInput({ ... }) }),
    FormField({ label: 'Email', children: TextInput({ ... }) }),
  ],
})
```

## Form State Management

For larger forms, use [`useForm`](/hooks/use-form.md).
