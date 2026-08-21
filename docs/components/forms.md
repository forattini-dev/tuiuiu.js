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
- Semantic segments attached to text ranges
- Paste transforms before buffer mutation
- Anchored async completion state

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
| `initialSegments` | `TextInputSegment[]` | Seed the input with semantic tokens |
| `onSegmentsChange` | `(segments: TextInputSegment[]) => void` | Observe segment updates |
| `transformPaste` | `(context) => TextInputInsertionLike` | Replace raw pasted text with text or segments |
| `completion` | `TextInputCompletionOptions` | Anchored completion provider that may return items directly, a promise, or a task-backed handle |
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

### Structured Prompt Usage

```typescript
const prompt = useTextInputState({
  multiline: true,
  autoGrow: true,
  maxLines: 6,
  history: [
    {
      value: '@research',
      segments: [
        {
          id: 'seed-research',
          kind: 'mention',
          start: 0,
          end: 9,
          displayText: '@research',
          payload: { agent: 'research' },
        },
      ],
    },
  ],
  transformPaste: ({ text }) => {
    if (text.length < 80) return undefined;
    return {
      parts: [
        { type: 'text', text: 'Review ' },
        {
          type: 'segment',
          segment: {
            kind: 'paste',
            displayText: `[paste:${text.length}c]`,
            payload: { text },
          },
        },
      ],
    };
  },
  completion: {
    resolveAnchor: ({ value, cursorPosition }) => {
      const prefix = value.slice(0, cursorPosition);
      const match = prefix.match(/(?:^|\\s)([@#])([\\w./-]*)$/);
      if (!match || match.index === undefined) return null;
      const start = match[0].startsWith(' ') ? match.index + 1 : match.index;
      return {
        start,
        end: cursorPosition,
        query: match[2] ?? '',
        trigger: match[1],
      };
    },
    getItems: loadPromptSuggestions,
  },
});

TextInput({ state: prompt, borderStyle: 'round', fullWidth: true });
```

The controller also exposes low-level helpers such as `insertSegment()`, `paste()`, `acceptCompletion()`, and `cancelCompletion()` for prompt-like applications that want explicit orchestration.

History entries can be plain strings or structured `{ value, segments }` objects. When a structured history entry is recalled with Up/Down, the controller restores both the text and the semantic tokens. Returning to the live draft also restores the draft segments instead of dropping them.

If you want submitted prompts to survive process restarts, add synchronous prompt-history persistence:

```typescript
import { createNodeFsSyncStorage } from 'tuiuiu.js';

const promptHistoryStorage = createNodeFsSyncStorage({
  dir: './.prompt-state',
});

const prompt = useTextInputState({
  history: [
    {
      value: '#src/atoms/text-input.ts',
      segments: [
        {
          id: 'seed-file',
          kind: 'file',
          start: 0,
          end: 25,
          displayText: '#src/atoms/text-input.ts',
          payload: { path: 'src/atoms/text-input.ts' },
        },
      ],
    },
  ],
  historyPersistence: {
    storage: promptHistoryStorage,
    key: 'rich-prompt-history',
    limit: 20,
  },
});
```

Persisted prompt history hydrates synchronously when the controller is created, so the first history navigation session can already restore prior structured prompts.

### Prompt Command Routing

Slash commands remain application-owned prompt semantics, but the library now provides helpers to remove most of the boilerplate. See the advanced reference in [prompt-patterns.md](../resources/prompt-patterns.md).

In short:

- `createPromptCommandRegistry()` centralizes slash-command matching, completion, and parse helpers
- `inspectPrompt(value, cursorPosition)` exposes live slash-command context and diagnostics while the user is typing
- `completeArgs` lets each command provide argument-specific completion without pushing command semantics into `TextInput`

### Prompt Mode Routing

When one prompt needs multiple submit routes, `createPromptModeRegistry()` classifies prompt mode by prefix without pushing those semantics into `TextInput`. `inspectPrompt()` is the single inspection API. See [prompt-patterns.md](../resources/prompt-patterns.md) for the full example.

### Task-Backed Completion Usage

When completion sources need ranking or background work, `getItems` can return a task handle instead of awaiting the result inline. The controller cancels obsolete tasks automatically when the anchor changes or the session closes. See [prompt-patterns.md](../resources/prompt-patterns.md) for the full pattern.

### Completion Ranking

Completion ranking is opt-in and controller-local. When enabled, accepted items gain frecency weight and rise in later sessions for the same ranking key:

```typescript
const prompt = useTextInputState({
  completion: {
    resolveAnchor,
    getItems: loadPromptSuggestions,
    ranking: {
      getKey: (item, context) => `${context.anchor.trigger ?? ''}:${item.id}`,
    },
  },
});
```

Provider order remains the stable tie-break when items have equal scores or no ranking history. The controller also exposes `getCompletionRankingSnapshot()` and `clearCompletionRanking()` for apps that want to inspect or reset the local in-memory ranking state.

If you want ranking to survive process restarts, add synchronous persistence:

```typescript
import { createNodeFsSyncStorage } from 'tuiuiu.js';

const rankingStorage = createNodeFsSyncStorage({
  dir: './.prompt-state',
});

const prompt = useTextInputState({
  completion: {
    resolveAnchor,
    getItems: loadPromptSuggestions,
    ranking: {
      getKey: (item, context) => `${context.anchor.trigger ?? ''}:${item.id}`,
      persistence: {
        storage: rankingStorage,
        key: 'rich-prompt-ranking',
      },
    },
  },
});
```

Persisted ranking hydrates synchronously when the controller is created, so the first completion session in a new process can already use prior ranking history.

For the full advanced prompt stack, including background task progress and the core-vs-app-owned boundary, see [prompt-patterns.md](../resources/prompt-patterns.md) and the workbench references in [examples.md](../resources/examples.md).

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

`MultiSelect` uses `j`/`k` for navigation outside search. Press `/` (or start
typing another printable character) to enter search mode; while searching,
all printable input, including `j`, `k`, spaces, emoji, and pasted text, is
part of the query. `Enter` keeps the current filter and returns to navigation,
while `Escape` clears the filter and returns to navigation. Backspace removes
one complete Unicode grapheme.

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
