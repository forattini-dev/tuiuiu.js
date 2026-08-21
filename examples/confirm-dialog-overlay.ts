/**
 * ConfirmDialog + OverlayHost
 *
 * A complete quit-confirmation flow that works with keyboard and mouse input.
 *
 * Run:
 *   pnpm example confirm-dialog-overlay
 */

import {
  Box,
  Button,
  Text,
  render,
  useApp,
  useConst,
  useInteraction,
  useState,
  type VNode,
} from '../src/index.js';
import { getOverlayHost } from '../src/interaction/index.js';
import { ConfirmDialog, createConfirmDialog } from '../src/ui/index.js';

const QUIT_DIALOG_ID = 'confirm-quit';

export function ConfirmDialogOverlayExample(): VNode {
  const app = useApp();
  const overlays = getOverlayHost<VNode | null>();
  const [status, setStatus] = useState('Ready. Press Q, Enter, or click the button.');

  const dialog = useConst(() => createConfirmDialog({
    title: 'Quit tuiuiu.js?',
    message: 'Unsaved work will be lost.',
    confirmText: 'Quit',
    cancelText: 'Keep working',
    type: 'danger',
    onConfirm: () => {
      void overlays.close(QUIT_DIALOG_ID, true);
      app.exit();
    },
    onCancel: () => {
      void overlays.close(QUIT_DIALOG_ID, false);
      setStatus('Quit cancelled. The application is still running.');
    },
  }));

  const openQuitDialog = () => {
    if (overlays.snapshot().entries.some((entry) => entry.id === QUIT_DIALOG_ID)) return;

    dialog.selectCancel();
    setStatus('Choose an action in the confirmation dialog.');
    overlays.open({
      id: QUIT_DIALOG_ID,
      blocking: true,
      captureFocus: true,
      backdrop: true,
      closeOnEscape: true,
      closeOnBackdrop: false,
      content: () => ConfirmDialog(dialog.props),
      onClose: ({ reason }) => {
        if (reason === 'escape') {
          setStatus('Quit cancelled. The application is still running.');
        }
      },
    });
  };

  useInteraction((event) => {
    if (event.type !== 'key') return;
    const key = event.key.native;
    if (key.leftArrow || key.rightArrow || key.tab) {
      dialog.toggle();
      return true;
    }
    if (key.return) {
      dialog.activateSelected();
      return true;
    }
    return false;
  }, { mode: 'overlay', target: QUIT_DIALOG_ID, priority: 200 });

  useInteraction((event) => {
    if (event.type !== 'key') return;
    const input = event.key.text;
    const key = event.key.native;
    if (input.toLowerCase() === 'q' || key.return) {
      openQuitDialog();
    } else if (key.ctrl && input.toLowerCase() === 'c') {
      app.exit();
    }

    return false;
  });

  return Box(
    {
      position: 'relative',
      width: 'fill',
      height: 'fill',
      flexDirection: 'column',
      padding: 1,
    },
    Text({ color: 'cyan', bold: true }, 'ConfirmDialog + OverlayHost'),
    Text({}, 'The main application remains mounted while the dialog owns input.'),
    Box({ marginTop: 1 },
      Button({
        label: 'Quit application',
        color: 'red',
        onClick: openQuitDialog,
      }),
    ),
    Box({ marginTop: 1 },
      Text({ color: 'gray' }, status()),
    ),
    Text(
      { color: 'gray', dim: true },
      'Dialog: ←/→ or Tab selects • Enter confirms • Esc cancels',
    ),
  );
}

const { waitUntilExit } = render(ConfirmDialogOverlayExample, {
  screen: 'fullscreen',
  autoTabNavigation: false,
});
await waitUntilExit();
