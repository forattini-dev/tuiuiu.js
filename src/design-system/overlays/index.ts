/**
 * Design System Overlays - Layered UI components
 */

// Modal / Window
export {
  Modal,
  ConfirmDialog,
  Toast,
  AlertBox,
  createModal,
  createConfirmDialog,
  type ModalProps,
  type ModalState,
  type ModalSize,
  type ModalPosition,
  type ConfirmDialogProps,
  type ToastProps,
  type ToastType,
  type AlertBoxProps,
  type BorderStyle,
} from './modal.js';

// Command Palette (Kyma-inspired)
export {
  CommandPalette,
  createCommandPalette,
  GoToDialog,
  createGoToDialog,
  type CommandItem,
  type CommandPaletteProps,
  type CommandPaletteState,
  type CreateCommandPaletteOptions,
  type GoToDialogProps,
} from './command-palette.js';

// Overlay Stack Manager (Kyma-inspired)
export {
  createOverlayStack,
  OverlayContainer,
  shouldBlockInput,
  handleOverlayEscape,
  createModalOverlay,
  createToastOverlay,
  createCriticalOverlay,
  type OverlayPriority,
  type OverlayConfig,
  type OverlayEntry,
  type OverlayStackState,
  type OverlayContainerProps,
  type UseOverlayInputOptions,
} from './overlay-stack.js';
