/**
 * Design System Overlays - Layered UI components
 *
 * Re-exports from canonical sources (organisms)
 * to maintain consistent API while avoiding code duplication.
 */

// =============================================================================
// Re-exports from Organisms
// =============================================================================

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
} from '../../organisms/modal.js';

// Command Palette
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
} from '../../organisms/command-palette.js';

// Overlay Stack Manager
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
} from '../../organisms/overlay-stack.js';
