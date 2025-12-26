/**
 * ConfirmButton - Button that requires confirmation before executing action
 *
 * @layer Atom
 * @description Two-click safety button for destructive actions
 *
 * @example
 * ```typescript
 * ConfirmButton({
 *   label: 'Delete',
 *   confirmLabel: 'Are you sure?',
 *   onConfirm: () => deleteItem(),
 *   variant: 'danger',
 * })
 * ```
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { createSignal, createEffect } from '../primitives/signal.js';
import { getTheme } from '../core/theme.js';
import { Button, type ButtonVariant, type ButtonSize } from './button.js';

export interface ConfirmButtonState {
  /** Is in confirmation state */
  isConfirming: () => boolean;
  /** Remaining time in confirmation state */
  remainingTime: () => number;
  /** Trigger first click (enter confirmation) */
  click: () => void;
  /** Confirm action */
  confirm: () => void;
  /** Cancel confirmation */
  cancel: () => void;
  /** Reset to initial state */
  reset: () => void;
}

export interface ConfirmButtonOptions {
  /** Confirmation timeout in milliseconds */
  timeout?: number;
  /** Called when confirmed */
  onConfirm?: () => void;
  /** Called when cancelled */
  onCancel?: () => void;
}

/**
 * Create a ConfirmButton state manager
 *
 * @example
 * ```typescript
 * const deleteBtn = createConfirmButton({
 *   timeout: 3000,
 *   onConfirm: () => deleteItem(),
 *   onCancel: () => console.log('Cancelled'),
 * });
 *
 * ConfirmButton({
 *   state: deleteBtn,
 *   label: 'Delete',
 *   confirmLabel: 'Click again to confirm',
 * });
 * ```
 */
export function createConfirmButton(options: ConfirmButtonOptions = {}): ConfirmButtonState {
  const { timeout = 3000, onConfirm, onCancel } = options;

  const [isConfirming, setIsConfirming] = createSignal(false);
  const [remainingTime, setRemainingTime] = createSignal(0);
  let timeoutId: NodeJS.Timeout | null = null;
  let intervalId: NodeJS.Timeout | null = null;

  const clearTimers = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  const reset = () => {
    clearTimers();
    setIsConfirming(false);
    setRemainingTime(0);
  };

  const click = () => {
    if (isConfirming()) {
      // Second click = confirm
      onConfirm?.();
      reset();
    } else {
      // First click = enter confirmation mode
      setIsConfirming(true);
      setRemainingTime(timeout);

      // Start countdown
      const startTime = Date.now();
      intervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, timeout - elapsed);
        setRemainingTime(remaining);
      }, 100);

      // Auto-cancel after timeout
      timeoutId = setTimeout(() => {
        cancel();
      }, timeout);
    }
  };

  const confirm = () => {
    if (isConfirming()) {
      onConfirm?.();
      reset();
    }
  };

  const cancel = () => {
    onCancel?.();
    reset();
  };

  return {
    isConfirming,
    remainingTime,
    click,
    confirm,
    cancel,
    reset,
  };
}

export interface ConfirmButtonProps {
  /** State from createConfirmButton() */
  state?: ConfirmButtonState;
  /** Button label */
  label: string;
  /** Label shown in confirmation state */
  confirmLabel?: string;
  /** Button variant */
  variant?: ButtonVariant;
  /** Variant when confirming */
  confirmVariant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Called when confirmed */
  onConfirm?: () => void;
  /** Called when cancelled */
  onCancel?: () => void;
  /** Confirmation timeout in milliseconds */
  timeout?: number;
  /** Show remaining time */
  showCountdown?: boolean;
  /** Is button disabled */
  disabled?: boolean;
  /** Is button focused */
  focused?: boolean;
}

/**
 * ConfirmButton - Button that requires confirmation before executing action
 *
 * @example
 * ```typescript
 * // Simple usage
 * ConfirmButton({
 *   label: 'Delete Item',
 *   confirmLabel: 'Are you sure?',
 *   onConfirm: () => deleteItem(),
 *   variant: 'ghost',
 *   confirmVariant: 'solid',
 *   color: 'error',
 * })
 *
 * // With state for programmatic control
 * const btn = createConfirmButton({ onConfirm: handleDelete });
 * ConfirmButton({ state: btn, label: 'Delete' });
 *
 * // Escape cancels confirmation
 * useInput((_, key) => {
 *   if (key.escape) btn.cancel();
 * });
 * ```
 */
export function ConfirmButton(props: ConfirmButtonProps): VNode {
  const theme = getTheme();
  const {
    state,
    label,
    confirmLabel = 'Are you sure?',
    variant = 'ghost',
    confirmVariant = 'solid',
    size,
    onConfirm,
    onCancel,
    timeout = 3000,
    showCountdown = true,
    disabled = false,
    focused = false,
  } = props;

  // Use state or create inline
  const internalState = state || createConfirmButton({
    timeout,
    onConfirm,
    onCancel,
  });

  const isConfirming = internalState.isConfirming();
  const remainingTime = internalState.remainingTime();

  // Format countdown
  const countdown = showCountdown && isConfirming
    ? ` (${Math.ceil(remainingTime / 1000)}s)`
    : '';

  return Button({
    label: isConfirming ? `${confirmLabel}${countdown}` : label,
    variant: isConfirming ? confirmVariant : variant,
    color: isConfirming ? 'error' : undefined,
    size,
    disabled,
    focused,
    onClick: () => internalState.click(),
  });
}
