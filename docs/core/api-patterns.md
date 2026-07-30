# API patterns

Tuiuiu uses plain TypeScript functions and VNodes. It does not require or
support JSX. The component signature tells you how content is supplied.

## Quick reference

| Shape | Use it for | Examples |
|---|---|---|
| Variadic composition | Free-form layout | `Box`, `Text`, `VStack`, `HStack`, `Center`, `Grid`, `Screen`, `Panel` |
| Named content and slots | Structured components | `Page`, `AppShell`, `Modal`, `FormField`, `Collapsible` |
| Data collections | Repeated structured items | `Tabs`, `Select`, `Tree`, `Table`, `ButtonGroup` |
| Render callbacks | Deferred or virtualized rows | `ScrollList`, `Static`, `Each` |
| Stable controllers | Stateful behavior shared across frames | `useTextInputState`, `useSelectState`, `createAutocomplete` |

## 1. Variadic composition

Pass content after the props object:

```typescript
Box({ flexDirection: 'column', gap: 1 },
  Text({ bold: true }, 'Settings'),
  HStack({ gap: 1 },
    Text({}, 'Theme'),
    Spacer(),
    Text({ color: 'cyan' }, 'dark'),
  ),
)
```

`VStack`, `HStack`, `Center`, and `Grid` follow the same convention:

```typescript
Grid({ columns: '1fr 2fr', gap: 1 },
  Text({}, 'Name'),
  Text({}, 'Tuiuiu'),
)
```

For migration compatibility, composition primitives normalize nested arrays and
accept `props.children` where the public type declares it. Variadic children are
canonical and take precedence when both forms are supplied.

```typescript
const rows = [
  Text({}, 'one'),
  Text({}, 'two'),
]

VStack({ gap: 1 }, ...rows)
```

Shorthand layout helpers omit the props object:

```typescript
screen(
  header(Title('Dashboard'), Spacer(), Caption('v1.0')),
  main(Content()),
  footer(Caption('[Q] Quit'), Spacer(), Caption('Ready')),
)
```

Use semantic sizing instead of terminal arithmetic:

```typescript
screen(
  header(Title('App')), // content height
  main(Content()),      // remaining height
  footer(Status()),     // content height
)
```

## 2. Named content and slots

Structured components receive named VNode props. Read the prop name instead of
assuming every component calls its main slot `children`.

```typescript
Page({
  title: 'Settings',
  footer: StatusBar({ left: 'Ready' }),
  children: SettingsForm(),
})

AppShell({
  header: Header({ title: 'Workspace' }),
  sidebar: Navigation(),
  children: MainContent(),
})
```

`Modal` deliberately calls its main slot `content`:

```typescript
Modal({
  title: 'Confirm action',
  content: Text({}, 'Continue?'),
  footer: ButtonGroup({
    buttons: [
      { label: 'Continue', onClick: confirm },
      { label: 'Cancel', onClick: cancel },
    ],
  }),
})
```

Other examples:

```typescript
FormField({
  label: 'Email',
  error: errors.email,
  children: TextInput({ onChange: setEmail }),
})

Collapsible({
  title: 'Advanced',
  children: AdvancedSettings(),
})
```

## 3. Data collections

Components that own selection, ordering, or navigation receive data objects:

```typescript
Tabs({
  tabs: [
    { key: 'files', label: 'Files', content: FilesPanel() },
    { key: 'settings', label: 'Settings', content: SettingsPanel() },
  ],
})

Select({
  items: [
    { value: 'sm', label: 'Small' },
    { value: 'lg', label: 'Large' },
  ],
  onChange: setSize,
})
```

Put tab content inside its tab object. `Tabs` has no general `children` slot.

## 4. Render callbacks

Virtualized or reactive collections ask for a function so rows can be created
only when needed:

```typescript
ScrollList({
  items: messages,
  height: 20,
  children: (message) => ChatBubble({ message }),
})

Static({
  items: logs,
  children: (line, index) => Text({ key: index }, line),
})

Box({},
  Each(items(), (item) => ListItem({ item })),
)
```

Pass the callback itself, not the result of calling it.

## 5. Stable controllers and component state

Inside a rendered component, use the `useXState` hook or pass a state object in.
The hook preserves the controller across rerenders and refreshes its options:

```typescript
function Prompt() {
  const input = useTextInputState({
    multiline: true,
    onSubmit: sendMessage,
  })

  return TextInput({
    state: input,
    fullWidth: true,
  })
}
```

Factories such as `createTextInput` and `createAutocomplete` are also useful
outside the render lifecycle or when several components share one controller:

```typescript
const autocomplete = createAutocomplete({ items: commands })

function CommandSearch() {
  return VStack({},
    AutocompleteInput({ state: autocomplete }),
    AutocompleteSuggestions({ state: autocomplete }),
  )
}
```

Do not create a new controller on every render. Use its hook, create it outside
the component, or memoize it with the component lifecycle.

## Width constraints

Prefer `width: 'fill'` and `height: 'fill'` where accepted. Use explicit widths
when a component must measure, wrap, or virtualize content:

```typescript
SplitPanel({
  width: 100,
  height: 30,
  ratio: 0.4,
  left: MenuList(),
  right: Markdown({ content: document, maxWidth: 58 }),
})
```

## Common mistakes

- Passing `children` to `Modal` instead of `content`.
- Passing variadic content to `Page`, whose `children` prop is required.
- Supplying `Tabs.children` instead of each tab's `content`.
- Calling a row renderer before passing it to `ScrollList`.
- Creating `createX()` state inside a component on every frame.
- Using JSX examples with a function/VNode library.

## Related

- [Component hierarchy](./component-hierarchy.md)
- [Imports](./imports.md)
- [Signals](./signals.md)
