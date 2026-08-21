# Interaction runtime

Tuiuiu 2 has one runtime-scoped authority for keyboard commands, interaction
modes, collection navigation, overlays, and prompts.

## Commands and modes

Commands name intent independently from keys. Bindings decide how an intent is
invoked in a mode or target.

```ts
import {
  useCommand,
  useCommandBinding,
  useInteractionMode,
} from 'tuiuiu.js/app';

useCommand({ id: 'project.save', title: 'Save project', run: saveProject });
useCommandBinding({ command: 'project.save', keys: ['ctrl+s', 'meta+s'] });
useInteractionMode({ mode: 'editor', target: documentId }, isEditorActive);
```

The most recently acquired mode lease owns dispatch. A target binding wins over
a mode binding, which wins over a global binding. Exclusive modes prevent
lower-priority normalized handlers from observing the event. Disabled commands
do not claim a sequence prefix.

`runtime.inspect()` exposes commands, bindings, leases, and conflicts;
`runtime.subscribe()` makes that surface reactive; `runtime.execute()` invokes
a command without fabricating input.

`useShortcut()` is the concise API for a local semantic action.
`useInteraction()` receives normalized events and is intended for text editors
and terminal-protocol tools, not ordinary shortcuts.

## Identity-based collections

`createCollectionController()` owns cursor, selection, filtering, modality, and
viewport invariants by stable key. Reorders preserve identity, removals choose a
deterministic visual neighbor, and disabled rows are skipped.

Tabs, Select, MultiSelect, Menu, Autocomplete, TextInput completion, and
CommandPalette share this controller. `createCollectionBindings()` maps their
semantic actions to the interaction runtime without duplicating key parsing.

## Overlay sessions

`getOverlayHost()` resolves the current app runtime. `open()` returns a session
with `update()`, idempotent `close()`, and a `closed` promise.

```ts
import { Text } from 'tuiuiu.js';
import { getOverlayHost } from 'tuiuiu.js/interaction';

const session = getOverlayHost().open({
  id: 'delete-project',
  content: () => Text({}, 'Delete this project?'),
  closeOnEscape: true,
  closeOnBackdrop: false,
});

const outcome = await session.closed;
```

The host owns priority, effective backdrop, exclusive mode, focus restoration,
timers, and close settlement. The app render loop mounts the VNode host once.
`openModal()` is the UI adapter for Modal presentation.

## Prompts

The `prompt.*` API resolves the active runtime. Inside a rendered app it uses a
VNode prompt and the app's OverlayHost; outside an app it uses the ANSI host.
Both paths share validation, cancellation, and busy semantics.

Only one prompt may be active per runtime. Async validation ignores stale
settlement after cancellation. In non-interactive ANSI execution, prompts need
an explicit default or reject with `PromptNonInteractiveError`.

## Shared scalar editor and completion

`createTextEditor()` owns grapheme-safe insertion, deletion, cursor movement,
and word movement without depending on a renderer. `createCompletionSession()`
owns request cancellation, stale-result suppression, anchor data, and the
identity-based result collection. Visual TextInput and Autocomplete components
layer their presentation over these contracts.
