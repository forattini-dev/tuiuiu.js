# TextInput

Single-line or multiline terminal input with cursor movement, history,
completion, paste handling, and optional scrolling.

## Import

```typescript
import { TextInput, useTextInputState } from 'tuiuiu.js/ui'
import { component } from 'tuiuiu.js/app'
```

## Canonical usage

```typescript
const SearchBox = component('SearchBox', () => {
  const input = useTextInputState({
    placeholder: 'Search…',
    onSubmit: (value) => runSearch(value),
  })

  return TextInput({
    state: input,
    isActive: true,
    fullWidth: true,
  })
})
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
| `undoLimit` | `number` | `100` | Bounded undo checkpoints; zero disables undo. May change through `updateOptions()` |
| `selectionStyle` | `TextStyle` | `{ inverse: true }` | Selection paint; cursor style remains independent |

## Selection and undo/redo

TextInput owns a renderer-independent TextEditor. Shift+Left/Right, Shift+Home/End
and Shift+Up/Down extend selection; Shift-click extends it to the clicked position.
Left/Right without Shift collapse to the respective edge. Typing, paste, newline,
Backspace and Delete replace a selected range. Rich segments remain atomic.
Escape clears selection after dismissing any active completion.

Ctrl+Z undoes an edit; Ctrl+Y or Ctrl+Shift+Z redoes it (when the terminal reports
that combination). Legacy Ctrl+A/E still move to document start/end, not select all.
Use `state.selectAll()` for selection of the whole buffer. Home/End also refer
to the whole document. Shift+Up/Down bypass submitted-history/completion navigation.

```ts
const input = createTextInput({ initialValue: 'hello 👩‍💻', undoLimit: 100 });
input.setSelection(6, input.value().length);
input.insertText('world');
input.undo(); // Restores text, cursor, selection and semantic segments
input.redo();
console.log(input.selection(), input.canUndo(), input.canRedo());
input.dispose();
```

Import `createTextInput` from `tuiuiu.js/ui`. Selection uses UTF-16 offsets and
never splits graphemes; explicit edit ranges expand to whole graphemes and segments.
Undo/redo emits the usual change callbacks once per restore. `setValue()`, `clear()`
and recall of submitted history reset editing history. Fresh edits clear redo.
History retains full strings plus shallow segment snapshots (payload references
are preserved), so use a lower limit for large buffers. `maxLength` counts UTF-16
units and applies to insertion, including zero, without truncating graphemes;
programmatic resets and recalled history retain their supplied values.

`useTextInputState()` and internally owned TextInput controllers dispose on unmount.
For a caller-owned `createTextInput()`, call `dispose()` yourself. Disposal cancels
pending completions and releases subscriptions without disposing external views.
This does not yet add mouse-drag selection, selection clipboard integration or
horizontal scrolling to TextInput. Password mode paints selection on masked text.

Try `pnpm example text-editor-lab`.

See [Forms](/components/forms.md) for controlled forms and
[Prompt Patterns](/resources/prompt-patterns.md) for completion, semantic
segments, and paste workflows.
