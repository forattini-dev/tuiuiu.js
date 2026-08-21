# CommandPalette

CommandPalette is a searchable visual adapter over the active
InteractionRuntime command registry. It does not own a parallel command or
hotkey registry.

```ts
import {
  useCommand,
  useCommandBinding,
  useShortcut,
} from 'tuiuiu.js/app';
import { CommandPalette, createInteractionCommandPalette } from 'tuiuiu.js/ui';

useCommand({ id: 'file.save', title: 'Save file', category: 'File', run: save });
useCommandBinding({ command: 'file.save', keys: ['ctrl+s', 'meta+s'] });

const palette = createInteractionCommandPalette();
useShortcut('ctrl+k', palette.activate, {
  id: 'palette.open',
  title: 'Open command palette',
});

CommandPalette(palette.props);
```

The adapter follows registrations, metadata, enabled state, binding updates,
and removals. Confirming a result executes it through `runtime.execute()`.
Navigation and text editing are routed through the palette's interaction mode.

Dispose the palette controller when it is created outside a component owner.
Inside a component, prefer the owner-safe UI API.

See [Interaction runtime](/core/interaction-runtime.md).
