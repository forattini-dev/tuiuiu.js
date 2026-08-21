# Commands and shortcuts

Keyboard actions are resolved by the runtime-scoped InteractionRuntime.

Use `useShortcut()` for local semantic actions:

```ts
import { useShortcut } from 'tuiuiu.js/app';

useShortcut('ctrl+s', save, { id: 'document.save', title: 'Save document' });
useShortcut(['ctrl+z', 'meta+z'], undo);
```

Use `useCommand()` and `useCommandBinding()` when commands need discovery,
metadata, dynamic enabled state, or multiple configurable bindings. Use
`useInteractionMode()` and targets for modal or local precedence.

There is no global hotkey-scope stack in v2. Registrations and modes return to
the correct state through owner cleanup and token-specific disposal.

See [Interaction runtime](/core/interaction-runtime.md).
