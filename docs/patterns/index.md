# Application patterns

## Stateful component

```ts
const SearchPanel = component<{ key?: string }>('SearchPanel', () => {
  const [query, setQuery] = useState('');
  useShortcut('escape', () => setQuery(''));
  return TextInput({ key: 'query', value: query(), onChange: setQuery });
});
```

State, hooks, and cleanup belong to the component owner. Reorderable sibling
instances need stable keys.

## Discoverable action

```ts
useCommand({ id: 'file.save', title: 'Save file', run: save });
useCommandBinding({ command: 'file.save', keys: ['ctrl+s', 'meta+s'] });
```

## Modal workflow

```ts
const session = openModal({
  id: 'settings',
  title: 'Settings',
  content: SettingsForm(),
});

const outcome = await session.closed;
```

## Dynamic collection

Use stable domain identities for items and keys. The shared collection
controller preserves logical cursor and selection across filtering, removal,
and reordering.

## App extension

Declare typed slots with `defineSlots()`, contribute through
`app.contributions`, and dispose the returned handle to remove the exact
contribution.
