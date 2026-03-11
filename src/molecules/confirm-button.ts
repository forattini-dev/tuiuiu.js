/**
 * ConfirmButton - Button that requires confirmation before executing action
 *
 * @layer Molecule
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

import type { VNode } from '../utils/types.js';
import { createSignal } from '../primitives/signal.js';
import { getTheme } from '../core/theme.js';
import { useFactoryState } from '../hooks/factory-state.js';
import { Button, type ButtonVariant, type ButtonSize } from '../atoms/button.js';

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
  /** Update runtime options without recreating controller */
  updateOptions: (options: ConfirmButtonOptions) => void;
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
  let runtimeOptions = options;

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
      runtimeOptions.onConfirm?.();
      reset();
    } else {
      // First click = enter confirmation mode
      const timeout = runtimeOptions.timeout ?? 3000;
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
      runtimeOptions.onConfirm?.();
      reset();
    }
  };

  const cancel = () => {
    runtimeOptions.onCancel?.();
    reset();
  };

  return {
    isConfirming,
    remainingTime,
    click,
    confirm,
    cancel,
    reset,
    updateOptions: (nextOptions: ConfirmButtonOptions) => {
      runtimeOptions = nextOptions;
    },
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
  const internalState = useFactoryState(
    state,
    {
      timeout,
      onConfirm,
      onCancel,
    },
    createConfirmButton
  );

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
