# Overlays

Tuiuiu has one runtime-scoped `OverlayHost`. The app mounts its visual adapter;
application code opens sessions and closes the exact session it owns.

## Open a modal

```ts
import { Text } from 'tuiuiu.js';
import { openModal } from 'tuiuiu.js/ui';

const session = openModal({
  id: 'delete-file',
  title: 'Delete file?',
  content: Text({}, 'This action cannot be undone.'),
  closeOnEscape: true,
  closeOnBackdrop: false,
});

const outcome = await session.closed;
```

The session owns its exclusive interaction mode, focus capture/restoration,
backdrop, timer, updates, and exactly-once close result.

## Custom overlay presentation

```ts
import { getOverlayHost } from 'tuiuiu.js/interaction';

const session = getOverlayHost().open({
  id: 'quick-open',
  priority: 'modal',
  placement: 'center',
  content: () => QuickOpen(),
  closeOnEscape: true,
});

session.update({ content: () => UpdatedQuickOpen() });
session.close('completed', selectedItem);
```

Do not render a second host, mutate a global overlay array, or pop an unrelated
entry. Non-blocking overlays such as toasts use a lower priority and do not steal
modal input authority.

## Prompts

`prompt.*` from `tuiuiu.js/interaction` uses the same host inside an app. It
therefore cannot create a competing raw-mode owner or input listener.

See [Modal](/components/organisms/modal.md) and the
[interaction runtime](/core/interaction-runtime.md).
