# useShortcut

`useShortcut()` creates one owner-scoped semantic command and binds one or more
canonical key chords to it.

```ts
import { useShortcut } from 'tuiuiu.js/app';

useShortcut('escape', close);
useShortcut(['ctrl+s', 'meta+s'], save, {
  id: 'document.save',
  title: 'Save document',
  category: 'File',
  isActive: canSave(),
});
```

Options can select an interaction `mode`, `target`, and `priority`. The hook
updates registrations across renders and disposes the exact command and
bindings with its ComponentOwner.

For discoverable commands whose registration and binding are separate, use
`useCommand()` and `useCommandBinding()`. For normalized editor or protocol
events, use `useInteraction()`.
