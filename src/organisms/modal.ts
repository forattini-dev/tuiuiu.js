/**
 * Modal/Window Component - Pop-up dialogs for Reck
 *
 * Features:
 * - Centered modal dialogs
 * - Floating windows with position
 * - Confirmation dialogs
 * - Alert/info boxes
 * - Toast notifications
 * - Backdrop overlay
 *
 * @example
 * ```typescript
 * import { Modal, ConfirmDialog, Toast, createModal } from './modal.js';
 *
 * // Simple modal
 * When(showModal(),
 *   Modal({
 *     title: 'Settings',
 *     content: SettingsForm(),
 *     onClose: () => setShowModal(false)
 *   })
 * )
 *
 * // Confirmation dialog
 * ConfirmDialog({
 *   title: 'Delete File?',
 *   message: 'This action cannot be undone.',
 *   onConfirm: handleDelete,
 *   onCancel: closeDialog
 * })
 * ```
 */

import { Box, Text, Newline } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { getTheme, getContrastColor } from '../core/theme.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { createFocusTrap, getFocusZoneManager } from '../core/focus.js';
import { pushHotkeyScope, popHotkeyScope } from '../hooks/use-hotkeys.js';

/**
 * Border styles for modals - Unicode
 */
const BORDER_CHARS_UNICODE = {
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
  },
  round: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
  },
  heavy: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
  },
};

/**
 * Border styles for modals - ASCII fallback
 */
const BORDER_CHARS_ASCII = {
  single: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
  },
  double: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '=',
    vertical: '|',
  },
  round: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
  },
  heavy: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '=',
    vertical: '|',
  },
};

/** Get border chars based on render mode */
function getBorderChars() {
  return getRenderMode() === 'ascii' ? BORDER_CHARS_ASCII : BORDER_CHARS_UNICODE;
}

/** Icons for Toast and AlertBox - with ASCII fallbacks */
const ICONS_UNICODE = {
  success: '✓',
  error: '✗',
  warning: '⚠',
  info: 'ℹ',
};

const ICONS_ASCII = {
  success: '[OK]',
  error: '[X]',
  warning: '[!]',
  info: '[i]',
};

/** Get icons based on render mode */
function getIcons() {
  return getRenderMode() === 'ascii' ? ICONS_ASCII : ICONS_UNICODE;
}

export type BorderStyle = 'single' | 'double' | 'round' | 'heavy' | 'none';
export type ModalSize = 'small' | 'medium' | 'large' | 'fullscreen' | { width: number; height: number };
export type ModalPosition = 'center' | 'top' | 'bottom' | { x: number; y: number };

/**
 * Modal Props
 */
export interface ModalProps {
  /** Modal title */
  title?: string;
  /** Modal content */
  content: VNode;
  /** Modal size */
  size?: ModalSize;
  /** Modal position */
  position?: ModalPosition;
  /** Border style */
  borderStyle?: BorderStyle;
  /** Border color */
  borderColor?: string;
  /** Title color */
  titleColor?: string;
  /** Show backdrop (dim area behind modal) */
  backdrop?: boolean;
  /** Backdrop character */
  backdropChar?: string;
  /** Show close button hint */
  showCloseHint?: boolean;
  /** Close button hint text */
  closeHint?: string;
  /** Footer content */
  footer?: VNode;
  /** Padding inside modal */
  padding?: number;
  /** Show close button (X) in the title bar */
  showCloseButton?: boolean;
  /** Close callback - called when X button or backdrop is clicked */
  onClose?: () => void;
  /** Close when backdrop is clicked (default: true if onClose is provided) */
  closeOnBackdrop?: boolean;
}

/**
 * Get modal dimensions based on size
 */
function getModalDimensions(size: ModalSize): { width: number; height: number } {
  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;

  if (typeof size === 'object') {
    return size;
  }

  switch (size) {
    case 'small':
      return { width: Math.min(40, termWidth - 4), height: Math.min(10, termHeight - 4) };
    case 'medium':
      return { width: Math.min(60, termWidth - 4), height: Math.min(16, termHeight - 4) };
    case 'large':
      return { width: Math.min(80, termWidth - 4), height: Math.min(22, termHeight - 4) };
    case 'fullscreen':
      return { width: termWidth - 2, height: termHeight - 2 };
    default:
      return { width: Math.min(60, termWidth - 4), height: Math.min(16, termHeight - 4) };
  }
}

/**
 * Get modal position offsets
 */
function getModalPosition(
  position: ModalPosition,
  width: number,
  height: number
): { x: number; y: number } {
  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;

  if (typeof position === 'object') {
    return position;
  }

  switch (position) {
    case 'top':
      return { x: Math.floor((termWidth - width) / 2), y: 1 };
    case 'bottom':
      return { x: Math.floor((termWidth - width) / 2), y: termHeight - height - 1 };
    case 'center':
    default:
      return {
        x: Math.floor((termWidth - width) / 2),
        y: Math.floor((termHeight - height) / 2),
      };
  }
}

/**
 * Render modal border
 */
function renderBorder(
  width: number,
  height: number,
  style: BorderStyle,
  color: string,
  title?: string,
  titleColor?: string
): VNode[] {
  if (style === 'none') {
    return [];
  }

  const theme = getTheme();
  const borderChars = getBorderChars();
  const chars = borderChars[style] || borderChars.single;
  const lines: VNode[] = [];

  // Top border with title
  const titleText = title ? ` ${title} ` : '';
  const titleLen = titleText.length;
  const remainingWidth = width - 2 - titleLen;
  const leftPadding = Math.floor(remainingWidth / 2);
  const rightPadding = remainingWidth - leftPadding;

  const topLine = title
    ? chars.topLeft +
      chars.horizontal.repeat(leftPadding) +
      titleText +
      chars.horizontal.repeat(rightPadding) +
      chars.topRight
    : chars.topLeft + chars.horizontal.repeat(width - 2) + chars.topRight;

  lines.push(
    Box(
      { flexDirection: 'row' },
      Text({ color }, chars.topLeft),
      title
        ? Box(
            { flexDirection: 'row' },
            Text({ color }, chars.horizontal.repeat(leftPadding)),
            Text({ color: titleColor || theme.palette.primary[500], bold: true }, titleText),
            Text({ color }, chars.horizontal.repeat(rightPadding))
          )
        : Text({ color }, chars.horizontal.repeat(width - 2)),
      Text({ color }, chars.topRight)
    )
  );

  return lines;
}

/**
 * Modal Component
 *
 * Renders a modal dialog with customizable appearance and position.
 *
 * @example
 * ```typescript
 * Modal({
 *   title: 'Confirm Delete',
 *   content: Text({}, 'Are you sure you want to delete this file?'),
 *   size: 'small',
 *   position: 'center',
 *   borderStyle: 'round',
 *   borderColor: 'yellow',
 *   showCloseHint: true
 * })
 * ```
 */
export function Modal(props: ModalProps): VNode {
  const theme = getTheme();
  const {
    title,
    content,
    size = 'medium',
    position = 'center',
    borderStyle = 'round',
    borderColor = theme.accents.info,
    titleColor = theme.accents.info,
    backdrop = true,
    backdropChar = ' ',
    showCloseHint = true,
    closeHint = 'Press ESC to close',
    footer,
    padding = 1,
    showCloseButton = false,
    onClose,
    closeOnBackdrop = true,
  } = props;

  const { width, height } = getModalDimensions(size);
  const borderChars = getBorderChars();
  const chars = borderStyle !== 'none' ? borderChars[borderStyle] || borderChars.single : null;
  const contentWidth = width - 2 - padding * 2;
  const contentHeight = height - 2 - (title ? 0 : 0) - (footer ? 2 : 0) - (showCloseHint ? 1 : 0);

  const isAscii = getRenderMode() === 'ascii';
  const closeButtonChar = isAscii ? '[X]' : ' × ';

  const rows: VNode[] = [];

  // Top border with title and optional close button
  if (chars) {
    const titleText = title ? ` ${title} ` : '';
    const titleLen = titleText.length;
    const closeButtonLen = showCloseButton ? closeButtonChar.length : 0;
    const remainingWidth = width - 2 - titleLen - closeButtonLen;
    const leftPadding = Math.max(0, Math.floor(remainingWidth / 2));
    const rightPadding = Math.max(0, remainingWidth - leftPadding);

    const titleBarParts: VNode[] = [
      Text({ color: borderColor }, chars.topLeft),
      Text({ color: borderColor }, chars.horizontal.repeat(leftPadding)),
      title ? Text({ color: titleColor, bold: true }, titleText) : Text({}, ''),
      Text({ color: borderColor }, chars.horizontal.repeat(rightPadding)),
    ];

    // Add close button if enabled
    if (showCloseButton && onClose) {
      titleBarParts.push(
        Box(
          { onClick: onClose },
          Text({ color: theme.accents.critical }, closeButtonChar)
        )
      );
    }

    titleBarParts.push(Text({ color: borderColor }, chars.topRight));

    rows.push(Box({ flexDirection: 'row' }, ...titleBarParts));
  }

  // Content area
  const paddingStr = ' '.repeat(padding);
  rows.push(
    Box(
      { flexDirection: 'row' },
      chars ? Text({ color: borderColor }, chars.vertical) : Text({}, ''),
      Text({}, paddingStr),
      Box({ width: contentWidth, flexDirection: 'column' }, content),
      Text({}, paddingStr),
      chars ? Text({ color: borderColor }, chars.vertical) : Text({}, '')
    )
  );

  // Close hint
  if (showCloseHint && closeHint) {
    const hintPadding = Math.max(0, width - 2 - closeHint.length - padding * 2);
    rows.push(
      Box(
        { flexDirection: 'row' },
        chars ? Text({ color: borderColor }, chars.vertical) : Text({}, ''),
        Text({}, paddingStr),
        Text({ color: theme.foreground.muted, dim: true }, closeHint),
        Text({}, ' '.repeat(hintPadding)),
        Text({}, paddingStr),
        chars ? Text({ color: borderColor }, chars.vertical) : Text({}, '')
      )
    );
  }

  // Footer
  if (footer) {
    rows.push(
      Box(
        { flexDirection: 'row' },
        chars ? Text({ color: borderColor }, chars.vertical) : Text({}, ''),
        Text({}, paddingStr),
        Box({ width: contentWidth, flexDirection: 'column' }, footer),
        Text({}, paddingStr),
        chars ? Text({ color: borderColor }, chars.vertical) : Text({}, '')
      )
    );
  }

  // Bottom border
  if (chars) {
    rows.push(
      Text(
        { color: borderColor },
        chars.bottomLeft + chars.horizontal.repeat(width - 2) + chars.bottomRight
      )
    );
  }

  return Box({ flexDirection: 'column' }, ...rows);
}

/**
 * Confirmation Dialog Props
 */
export interface ConfirmDialogProps {
  /** Dialog title */
  title: string;
  /** Confirmation message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm button color */
  confirmColor?: string;
  /** Cancel button color */
  cancelColor?: string;
  /** Selected button (0 = cancel, 1 = confirm) */
  selected?: number;
  /** Dialog type (affects colors) */
  type?: 'info' | 'warning' | 'danger';
  /** Callback when confirm button is clicked */
  onConfirm?: () => void;
  /** Callback when cancel button is clicked */
  onCancel?: () => void;
}

/**
 * Confirmation Dialog
 *
 * Pre-built modal for yes/no confirmations.
 *
 * @example
 * ```typescript
 * const dialog = createConfirmDialog({
 *   title: 'Delete File',
 *   message: 'This action cannot be undone.',
 *   type: 'danger'
 * });
 *
 * // Render
 * ConfirmDialog({
 *   ...dialog.props,
 *   selected: dialog.selected
 * })
 *
 * // Handle input
 * useInput((_, key) => {
 *   if (key.left || key.right) dialog.toggle();
 *   if (key.return) dialog.confirm();
 *   if (key.escape) dialog.cancel();
 * });
 * ```
 */
export function ConfirmDialog(props: ConfirmDialogProps): VNode {
  const theme = getTheme();
  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = theme.accents.positive,
    cancelColor = theme.foreground.muted,
    selected = 0,
    type = 'info',
    onConfirm,
    onCancel,
  } = props;

  // Type-based colors
  const titleColors: Record<string, string> = {
    info: theme.accents.info,
    warning: theme.accents.warning,
    danger: theme.accents.critical,
  };

  const inactiveColor = theme.foreground.muted;

  const buttonRow = Box(
    { flexDirection: 'row', marginTop: 1 },
    // Cancel button
    Box(
      {
        borderStyle: selected === 0 ? 'round' : 'single',
        borderColor: selected === 0 ? cancelColor : inactiveColor,
        paddingX: 2,
        onClick: onCancel,
      },
      Text({ color: selected === 0 ? cancelColor : inactiveColor, bold: selected === 0 }, cancelText)
    ),
    Text({}, '  '),
    // Confirm button
    Box(
      {
        borderStyle: selected === 1 ? 'round' : 'single',
        borderColor: selected === 1 ? confirmColor : inactiveColor,
        paddingX: 2,
        onClick: onConfirm,
      },
      Text({ color: selected === 1 ? confirmColor : inactiveColor, bold: selected === 1 }, confirmText)
    )
  );

  return Modal({
    title,
    titleColor: titleColors[type],
    borderColor: titleColors[type],
    size: 'small',
    content: Box(
      { flexDirection: 'column' },
      Text({}, message),
      buttonRow
    ),
    showCloseHint: false,
  });
}

/**
 * Create interactive confirm dialog state
 */
export function createConfirmDialog(options: {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'danger';
  onConfirm?: () => void;
  onCancel?: () => void;
}) {
  let selected = 0;

  return {
    get props(): ConfirmDialogProps {
      return {
        title: options.title,
        message: options.message,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        type: options.type,
        selected,
      };
    },
    get selected() {
      return selected;
    },
    toggle: () => {
      selected = selected === 0 ? 1 : 0;
    },
    selectCancel: () => {
      selected = 0;
    },
    selectConfirm: () => {
      selected = 1;
    },
    confirm: () => {
      if (selected === 1) {
        options.onConfirm?.();
      } else {
        options.onCancel?.();
      }
    },
    cancel: () => {
      options.onCancel?.();
    },
  };
}

/**
 * Toast notification type
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast Props
 */
export interface ToastProps {
  /** Toast message */
  message: string;
  /** Toast type */
  type?: ToastType;
  /** Position on screen */
  position?: 'top' | 'bottom';
  /** Show icon */
  showIcon?: boolean;
  /** Expand to fill available width */
  fullWidth?: boolean;
}

/**
 * Toast Notification
 *
 * Simple notification message.
 *
 * @example
 * ```typescript
 * Toast({
 *   message: 'File saved successfully!',
 *   type: 'success',
 *   position: 'bottom'
 * })
 * ```
 */
export function Toast(props: ToastProps): VNode {
  const theme = getTheme();
  const { message, type = 'info', position = 'bottom', showIcon = true, fullWidth = false } = props;

  const icons = getIcons();

  // Use theme tokens for intelligent coloring
  const tokens = theme.components.toast[type];
  const icon = icons[type];

  return Box(
    {
      flexDirection: 'row',
      borderStyle: 'round',
      borderColor: tokens.border,
      backgroundColor: tokens.bg,
      paddingX: 2,
      paddingY: 0,
      flexGrow: fullWidth ? 1 : 0,
    },
    showIcon ? Text({ color: tokens.iconFg, bold: true }, `${icon} `) : Text({}, ''),
    Box({ flexGrow: fullWidth ? 1 : 0 }, Text({ color: tokens.fg }, message))
  );
}

/**
 * Alert Box Props
 */
export interface AlertBoxProps {
  /** Alert title */
  title?: string;
  /** Alert message */
  message: string;
  /** Alert type */
  type?: 'success' | 'error' | 'warning' | 'info';
  /** Show icon */
  showIcon?: boolean;
  /** Expand to fill available width */
  fullWidth?: boolean;
}

/**
 * Alert Box
 *
 * Styled alert message box.
 *
 * @example
 * ```typescript
 * AlertBox({
 *   title: 'Warning',
 *   message: 'This operation may take a while.',
 *   type: 'warning'
 * })
 * ```
 */
export function AlertBox(props: AlertBoxProps): VNode {
  const theme = getTheme();
  const { title, message, type = 'info', showIcon = true, fullWidth = false } = props;

  const icons = getIcons();

  // Map AlertBox types to Toast tokens
  const toastType = type as ToastType;
  const tokens = theme.components.toast[toastType];
  const icon = icons[type];

  return Box(
    {
      borderStyle: 'round',
      borderColor: tokens.border,
      backgroundColor: tokens.bg,
      padding: 1,
      flexDirection: 'column',
      flexGrow: fullWidth ? 1 : 0,
    },
    title
      ? Box(
          { flexDirection: 'row', marginBottom: 1 },
          showIcon ? Text({ color: tokens.iconFg, bold: true }, `${icon} `) : Text({}, ''),
          Text({ color: tokens.iconFg, bold: true }, title)
        )
      : Box({}),
    Text({ color: tokens.fg }, message)
  );
}

/**
 * Modal options for createModal
 */
export interface CreateModalOptions {
  /** Enable focus trap when modal opens */
  focusTrap?: boolean;
  /** Restore focus to previous element when modal closes */
  restoreFocus?: boolean;
  /** Auto-focus first focusable element when modal opens */
  autoFocus?: boolean;
  /** Hotkey scope to activate when modal opens (auto-restored on close) */
  hotkeyScope?: string;
}

/**
 * Modal state manager
 */
export interface ModalState {
  /** Whether modal is open */
  isOpen: boolean;
  /** Open the modal */
  open: () => void;
  /** Close the modal */
  close: () => void;
  /** Toggle modal open/closed */
  toggle: () => void;
  /** Focus zone ID (if focusTrap enabled) */
  zoneId: string | null;
  /** Register a focusable element in the modal's focus zone */
  registerFocusable: (elementId: string, onFocus?: (focused: boolean) => void) => () => void;
}

/**
 * Create modal state with optional focus trap
 *
 * @example
 * ```typescript
 * // Basic modal without focus management
 * const modal = createModal();
 *
 * // Modal with focus trap (recommended for accessibility)
 * const modal = createModal({ focusTrap: true });
 *
 * // In your render
 * When(modal.isOpen,
 *   Modal({ content: MyContent(), onClose: modal.close })
 * )
 *
 * // Register focusable elements in modal
 * const unregister = modal.registerFocusable('my-input', setFocused);
 * ```
 */
export function createModal(options: CreateModalOptions = {}): ModalState {
  const {
    focusTrap = false,
    restoreFocus = true,
    autoFocus = true,
    hotkeyScope,
  } = options;

  let isOpen = false;
  let focusZone: ReturnType<typeof createFocusTrap> | null = null;
  let zoneId: string | null = null;

  // Create focus trap zone if enabled
  if (focusTrap) {
    focusZone = createFocusTrap({ restoreFocus, autoFocus });
    zoneId = focusZone.zoneId;
  }

  return {
    get isOpen() {
      return isOpen;
    },
    get zoneId() {
      return zoneId;
    },
    open: () => {
      isOpen = true;
      if (hotkeyScope) {
        pushHotkeyScope(hotkeyScope);
      }
      if (focusZone) {
        focusZone.activate();
      }
    },
    close: () => {
      isOpen = false;
      if (focusZone) {
        focusZone.deactivate();
      }
      if (hotkeyScope) {
        popHotkeyScope();
      }
    },
    toggle: () => {
      if (isOpen) {
        isOpen = false;
        if (focusZone) {
          focusZone.deactivate();
        }
        if (hotkeyScope) {
          popHotkeyScope();
        }
      } else {
        isOpen = true;
        if (hotkeyScope) {
          pushHotkeyScope(hotkeyScope);
        }
        if (focusZone) {
          focusZone.activate();
        }
      }
    },
    registerFocusable: (elementId: string, onFocus?: (focused: boolean) => void) => {
      if (!zoneId) {
        // No focus zone - return no-op cleanup
        return () => {};
      }
      const manager = getFocusZoneManager();
      manager.registerElement(elementId, zoneId, { onFocus });
      return () => manager.unregisterElement(elementId, zoneId!);
    },
  };
}

// =============================================================================
// Window Component
// =============================================================================

/**
 * Window variant type
 */
export type WindowVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';

/**
 * Window Props
 */
export interface WindowProps {
  /** Window title */
  title: string;
  /** Window variant for semantic coloring */
  variant?: WindowVariant;
  /** Custom color override (uses getContrastColor for text) */
  color?: string;
  /** Window width */
  width?: number;
  /** Window height (content area) */
  height?: number;
  /** Show close button */
  showClose?: boolean;
  /** Show minimize button */
  showMinimize?: boolean;
  /** Show maximize button */
  showMaximize?: boolean;
  /** Close button callback */
  onClose?: () => void;
  /** Window content */
  children?: VNode | VNode[];
}

/**
 * Window Component
 *
 * Desktop-style window with title bar and optional buttons.
 * Supports semantic variants with intelligent theming.
 *
 * @example
 * ```typescript
 * Window({
 *   title: 'Settings',
 *   variant: 'primary',
 *   showClose: true,
 *   children: Text({}, 'Window content')
 * })
 * ```
 */
export function Window(props: WindowProps): VNode {
  const theme = getTheme();
  const {
    title,
    variant = 'default',
    color,
    width,
    height,
    showClose = true,
    showMinimize = false,
    showMaximize = false,
    onClose,
    children,
  } = props;

  // Get colors from theme tokens or custom color
  let titleBarBg: string;
  let titleBarFg: string;
  let bg: string;
  let fg: string;
  let border: string;
  let buttonFg: string;
  let closeFg: string;

  if (color) {
    // Custom color - use getContrastColor for text
    titleBarBg = color;
    titleBarFg = getContrastColor(color);
    bg = theme.background.base;
    fg = theme.foreground.primary;
    border = color;
    buttonFg = titleBarFg;
    closeFg = titleBarFg;
  } else {
    // Use theme tokens based on variant
    const tokens = theme.components.window[variant];
    titleBarBg = tokens.titleBarBg;
    titleBarFg = tokens.titleBarFg;
    bg = tokens.bg;
    fg = tokens.fg;
    border = tokens.border;
    buttonFg = tokens.buttonFg;
    closeFg = tokens.closeFg;
  }

  // Build title bar buttons
  const buttons: VNode[] = [];
  if (showMinimize) {
    buttons.push(Text({ color: buttonFg }, ' ─ '));
  }
  if (showMaximize) {
    buttons.push(Text({ color: buttonFg }, ' □ '));
  }
  if (showClose) {
    buttons.push(Text({ color: closeFg }, ' × '));
  }

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: border,
      width,
      backgroundColor: bg,
    },
    // Title bar
    Box(
      {
        flexDirection: 'row',
        backgroundColor: titleBarBg,
        paddingX: 1,
      },
      // Title
      Box({ flexGrow: 1 }, Text({ color: titleBarFg, bold: true }, title)),
      // Buttons
      Box({ flexDirection: 'row' }, ...buttons)
    ),
    // Content area
    Box(
      {
        flexDirection: 'column',
        padding: 1,
        height,
      },
      ...(Array.isArray(children) ? children : children ? [children] : [])
    )
  );
}

export type { VNode };
