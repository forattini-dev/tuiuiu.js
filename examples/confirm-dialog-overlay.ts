/**
 * ConfirmDialog + OverlayContainer
 *
 * A complete quit-confirmation flow that works with keyboard and mouse input.
 *
 * Run:
 *   pnpm example confirm-dialog-overlay
 */

import {
  Box,
  Button,
  ConfirmDialog,
  OverlayContainer,
  Text,
  createConfirmDialog,
  createModalOverlay,
  createOverlayStack,
  render,
  useApp,
  useConst,
  useInput,
  useState,
  type VNode,
} from '../src/index.js';

const QUIT_DIALOG_ID = 'confirm-quit';

export function ConfirmDialogOverlayExample(): VNode {
  const app = useApp();
  const overlays = useConst(createOverlayStack);
  const [status, setStatus] = useState('Ready. Press Q, Enter, or click the button.');

  const dialog = useConst(() => createConfirmDialog({
    title: 'Quit tuiuiu.js?',
    message: 'Unsaved work will be lost.',
    confirmText: 'Quit',
    cancelText: 'Keep working',
    type: 'danger',
    onConfirm: () => {
      overlays.close(QUIT_DIALOG_ID);
      app.exit();
    },
    onCancel: () => {
      overlays.close(QUIT_DIALOG_ID);
      setStatus('Quit cancelled. The application is still running.');
    },
  }));

  const openQuitDialog = () => {
    if (overlays.isOpen(QUIT_DIALOG_ID)) return;

    dialog.selectCancel();
    setStatus('Choose an action in the confirmation dialog.');
    overlays.push(createModalOverlay({
      id: QUIT_DIALOG_ID,
      closeOnEscape: false,
      component: () => ConfirmDialog(dialog.props),
    }));
  };

  useInput((input, key) => {
    if (overlays.hasOverlay()) {
      if (key.leftArrow || key.rightArrow || key.tab) {
        dialog.toggle();
      } else if (key.return) {
        dialog.confirm();
      } else if (key.escape) {
        dialog.cancel();
      }
      return true;
    }

    if (input.toLowerCase() === 'q' || key.return) {
      openQuitDialog();
    } else if (key.ctrl && input.toLowerCase() === 'c') {
      app.exit();
    }

    return false;
  }, { priority: 'modal', stopPropagation: true });

  return Box(
    {
      position: 'relative',
      width: 'fill',
      height: 'fill',
      flexDirection: 'column',
      padding: 1,
    },
    Text({ color: 'cyan', bold: true }, 'ConfirmDialog + OverlayContainer'),
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
    OverlayContainer({ stack: overlays }),
  );
}

const { waitUntilExit } = render(ConfirmDialogOverlayExample, {
  fullHeight: true,
  autoTabNavigation: false,
});
await waitUntilExit();
