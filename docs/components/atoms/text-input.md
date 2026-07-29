# TextInput

Single-line or multiline terminal input with cursor movement, history,
completion, paste handling, and optional scrolling.

## Import

```typescript
import { TextInput, useTextInputState } from 'tuiuiu.js'
```

## Canonical usage

```typescript
function SearchBox() {
  const input = useTextInputState({
    placeholder: 'Search…',
    onSubmit: (value) => runSearch(value),
  })

  return TextInput({
    state: input,
    isActive: true,
    fullWidth: true,
  })
}
```

Use `useTextInputState()` inside a component when application code needs to
read, clear, focus, or otherwise control the input. Passing options directly
to `TextInput()` is suitable for simpler cases.

## Common options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `state` | `TextInputState` | internal | Persistent state created by `useTextInputState()` or `createTextInput()` |
| `initialValue` | `string` | `''` | Initial text |
| `placeholder` | `string` | - | Text shown while empty |
| `onChange` | `(value: string) => void` | - | Change callback |
| `onSubmit` | `(value: string) => void` | - | Submit callback |
| `isActive` | `boolean \| (() => boolean)` | `true` | Whether the input receives keyboard events |
| `multiline` | `boolean` | `false` | Allow multiple lines |
| `wordWrap` | `boolean` | `false` | Wrap multiline content |
| `autoGrow` | `boolean` | `false` | Grow up to `maxLines` |
| `maxLines` | `number` | - | Maximum visible lines |
| `showScrollbar` | `boolean` | `true` | Show overflow position |
| `password` | `boolean` | `false` | Mask entered characters |
| `history` | `Array<string \| TextInputHistoryEntry>` | `[]` | Up/Down history |
| `completion` | `TextInputCompletionOptions` | - | Anchored synchronous or async completions |

See [Forms](/components/forms.md) for controlled forms and
[Prompt Patterns](/resources/prompt-patterns.md) for completion, semantic
segments, and paste workflows.
