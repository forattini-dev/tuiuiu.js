# Modal and confirmation dialogs

Import visual modal components from `tuiuiu.js/ui`. Use `openModal()` when the
modal needs lifecycle, input, focus, or a backdrop.

## Modal presentation

```ts
import { Modal } from 'tuiuiu.js/ui';

Modal({
  title: 'Settings',
  content: SettingsForm(),
  size: 'medium',
  footer: Actions(),
});
```

`Modal()` is presentation. It does not create an independent overlay lifecycle.

## Session-owned modal

```ts
import { Text } from 'tuiuiu.js';
import { openModal } from 'tuiuiu.js/ui';

const session = openModal({
  id: 'settings',
  title: 'Settings',
  content: Text({}, 'Preferences'),
  closeOnEscape: true,
});

const result = await session.closed;
```

The app's OverlayHost renders the content and owns focus restoration, the
exclusive modal mode, backdrop policy, timers, and settlement.

## ConfirmDialog

`ConfirmDialog()` is the visual confirmation component.
`createConfirmDialog()` provides selection state when custom control is needed.
The visual labels are configured with `confirmText` and `cancelText`.

```ts
import { ConfirmDialog, createConfirmDialog } from 'tuiuiu.js/ui';
import { useShortcut } from 'tuiuiu.js/app';

const dialog = createConfirmDialog({
  title: 'Delete file?',
  message: 'This action cannot be undone.',
  type: 'danger',
  onConfirm: deleteFile,
  onCancel: cancel,
});

useShortcut(['left', 'right', 'tab'], dialog.toggle);
useShortcut('enter', dialog.activateSelected);
useShortcut('escape', dialog.cancel);

ConfirmDialog(dialog.props);
```

For a complete app, open this presentation with `openModal()` and close the
returned session from the confirmation callbacks. The checked-in example is
available through `pnpm example confirm-dialog-overlay`.

The example runs unchanged in PowerShell and Windows Terminal because command
routing and terminal ownership do not depend on POSIX shell behavior.

## Other presentations

- `Toast` renders a temporary notification.
- `AlertBox` renders an inline semantic alert.
- `Window` renders positioned floating content.
- `GoToDialog` renders a bounded numeric jump dialog.

When these need overlay lifecycle, open them as content of the canonical host.
See [Overlays](/components/overlays.md).
