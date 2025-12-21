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

import { Box, Text, Newline } from './components.js';
import type { VNode } from '../utils/types.js';
import { stringWidth } from '../utils/text-utils.js';

/**
 * Border styles for modals
 */
const BORDER_CHARS = {
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

  const chars = BORDER_CHARS[style] || BORDER_CHARS.single;
  const lines: VNode[] = [];

  // Top border with title
  const titleText = title ? ` ${title} ` : '';
  const titleLen = stringWidth(titleText);
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
            Text({ color: titleColor || 'cyan', bold: true }, titleText),
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
  const {
    title,
    content,
    size = 'medium',
    position = 'center',
    borderStyle = 'round',
    borderColor = 'cyan',
    titleColor = 'cyan',
    backdrop = true,
    backdropChar = ' ',
    showCloseHint = true,
    closeHint = 'Press ESC to close',
    footer,
    padding = 1,
  } = props;

  const { width, height } = getModalDimensions(size);
  const chars = borderStyle !== 'none' ? BORDER_CHARS[borderStyle] || BORDER_CHARS.single : null;
  const contentWidth = width - 2 - padding * 2;
  const contentHeight = height - 2 - (title ? 0 : 0) - (footer ? 2 : 0) - (showCloseHint ? 1 : 0);

  const rows: VNode[] = [];

  // Top border with title
  if (chars) {
    const titleText = title ? ` ${title} ` : '';
    const titleLen = titleText.length;
    const remainingWidth = width - 2 - titleLen;
    const leftPadding = Math.max(0, Math.floor(remainingWidth / 2));
    const rightPadding = Math.max(0, remainingWidth - leftPadding);

    rows.push(
      Box(
        { flexDirection: 'row' },
        Text({ color: borderColor }, chars.topLeft),
        Text({ color: borderColor }, chars.horizontal.repeat(leftPadding)),
        title ? Text({ color: titleColor, bold: true }, titleText) : Text({}, ''),
        Text({ color: borderColor }, chars.horizontal.repeat(rightPadding)),
        Text({ color: borderColor }, chars.topRight)
      )
    );
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
    const hintPadding = Math.max(0, width - 2 - stringWidth(closeHint) - padding * 2);
    rows.push(
      Box(
        { flexDirection: 'row' },
        chars ? Text({ color: borderColor }, chars.vertical) : Text({}, ''),
        Text({}, paddingStr),
        Text({ color: 'gray', dim: true }, closeHint),
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
  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    confirmColor = 'green',
    cancelColor = 'gray',
    selected = 0,
    type = 'info',
  } = props;

  // Type-based colors
  const titleColors = {
    info: 'cyan',
    warning: 'yellow',
    danger: 'red',
  };

  const buttonRow = Box(
    { flexDirection: 'row', marginTop: 1 },
    // Cancel button
    Box(
      {
        borderStyle: selected === 0 ? 'round' : 'single',
        borderColor: selected === 0 ? cancelColor : 'gray',
        paddingX: 2,
      },
      Text({ color: selected === 0 ? cancelColor : 'gray', bold: selected === 0 }, cancelText)
    ),
    Text({}, '  '),
    // Confirm button
    Box(
      {
        borderStyle: selected === 1 ? 'round' : 'single',
        borderColor: selected === 1 ? confirmColor : 'gray',
        paddingX: 2,
      },
      Text({ color: selected === 1 ? confirmColor : 'gray', bold: selected === 1 }, confirmText)
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
  const { message, type = 'info', position = 'bottom', showIcon = true } = props;

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'cyan',
  };

  const icon = icons[type];
  const color = colors[type];

  return Box(
    {
      borderStyle: 'round',
      borderColor: color,
      paddingX: 2,
      paddingY: 0,
    },
    showIcon ? Text({ color, bold: true }, `${icon} `) : Text({}, ''),
    Text({ color: 'white' }, message)
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
  const { title, message, type = 'info', showIcon = true } = props;

  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors = {
    success: 'green',
    error: 'red',
    warning: 'yellow',
    info: 'cyan',
  };

  const bgColors = {
    success: 'bgGreen',
    error: 'bgRed',
    warning: 'bgYellow',
    info: 'bgCyan',
  };

  const icon = icons[type];
  const color = colors[type];

  return Box(
    {
      borderStyle: 'round',
      borderColor: color,
      padding: 1,
      flexDirection: 'column',
    },
    title
      ? Box(
          { flexDirection: 'row', marginBottom: 1 },
          showIcon ? Text({ color, bold: true }, `${icon} `) : Text({}, ''),
          Text({ color, bold: true }, title)
        )
      : Box({}),
    Text({}, message)
  );
}

/**
 * Modal state manager
 */
export interface ModalState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Create modal state
 */
export function createModal(): ModalState {
  let isOpen = false;

  return {
    get isOpen() {
      return isOpen;
    },
    open: () => {
      isOpen = true;
    },
    close: () => {
      isOpen = false;
    },
    toggle: () => {
      isOpen = !isOpen;
    },
  };
}

export type { VNode };
