/**
 * useInput - Handle keyboard input with priority support
 */

import {
  addInputHandler,
  removeInputHandler,
  removeInputHandlerById,
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
} from './context.js';
import { parseKeypress, type Key, type InputHandler } from '../core/hotkeys.js';
import type { InputPriority, UseInputOptions } from './types.js';

export type { Key, InputHandler, InputPriority, UseInputOptions };
export { parseKeypress };

/**
 * useInput - Handle keyboard input with priority support
 *
 * Uses hook state persistence to avoid registering duplicate handlers
 * across re-renders.
 *
 * @param handler - Function called for each keypress. Return truthy to stop propagation (if stopPropagation is true)
 * @param options - Configuration options
 * @param options.isActive - Whether handler is active (default: true)
 * @param options.priority - Priority level: 'background' | 'normal' | 'modal' | 'critical' (default: 'normal')
 * @param options.stopPropagation - If true, returning truthy stops lower priority handlers (default: false)
 *
 * @example
 * // Basic usage
 * useInput((input, key) => {
 *   if (key.return) submit();
 *   if (key.escape) cancel();
 * });
 *
 * @example
 * // Modal that blocks background input
 * useInput((input, key) => {
 *   if (key.escape) {
 *     closeModal();
 *     return true; // Stop propagation
 *   }
 * }, { priority: 'modal', stopPropagation: true });
 */
export function useInput(
  handler: InputHandler,
  options: UseInputOptions = {}
): void {
  const { isActive = true, priority = 'normal', stopPropagation = false } = options;

  // Get or create hook state for this useInput call
  const { value: hookData, isNew } = getHookState<{
    handler: InputHandler;
    wrapper: InputHandler;
    registered: boolean;
    handlerId: number | null;
    priority: InputPriority;
    stopPropagation: boolean;
  } | null>(null);

  if (isNew || hookData === null) {
    // First render - create wrapper and register
    const wrapper: InputHandler = (input, key) => {
      // Always call the latest handler (stored in hookData)
      const data = getStoredHookData();
      if (data && data.registered) {
        return data.handler(input, key);
      }
    };

    const data = {
      handler,
      wrapper,
      registered: isActive,
      handlerId: null as number | null,
      priority,
      stopPropagation,
    };

    // Store the data
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);

    // Helper to get stored data (closure over hookIndex)
    function getStoredHookData() {
      return getHookStateByIndex(hookIndex) as typeof data | null;
    }

    if (isActive) {
      data.handlerId = addInputHandler(wrapper, { priority, stopPropagation });
    }
  } else {
    // Subsequent render - update handler reference and active state
    const prevRegistered = hookData.registered;
    hookData.handler = handler; // Update to latest handler
    hookData.registered = isActive;

    // Check if priority or stopPropagation changed
    const priorityChanged = hookData.priority !== priority;
    const stopPropChanged = hookData.stopPropagation !== stopPropagation;
    const optionsChanged = priorityChanged || stopPropChanged;

    // Handle activation/deactivation or options change
    if (isActive && !prevRegistered) {
      // Activating
      hookData.priority = priority;
      hookData.stopPropagation = stopPropagation;
      hookData.handlerId = addInputHandler(hookData.wrapper, { priority, stopPropagation });
    } else if (!isActive && prevRegistered) {
      // Deactivating
      if (hookData.handlerId !== null) {
        removeInputHandlerById(hookData.handlerId);
        hookData.handlerId = null;
      } else {
        removeInputHandler(hookData.wrapper);
      }
    } else if (isActive && optionsChanged) {
      // Options changed while active - re-register with new options
      if (hookData.handlerId !== null) {
        removeInputHandlerById(hookData.handlerId);
      } else {
        removeInputHandler(hookData.wrapper);
      }
      hookData.priority = priority;
      hookData.stopPropagation = stopPropagation;
      hookData.handlerId = addInputHandler(hookData.wrapper, { priority, stopPropagation });
    }
  }
}

/**
 * useModalInput - Convenience hook for modal-like components
 *
 * Registers an input handler with modal priority that blocks background input
 * when the handler returns truthy.
 *
 * @example
 * useModalInput((input, key) => {
 *   if (key.escape) {
 *     closeModal();
 *     return true; // Block background components
 *   }
 *   if (key.return) {
 *     confirm();
 *     return true;
 *   }
 * });
 */
export function useModalInput(
  handler: InputHandler,
  options: Omit<UseInputOptions, 'priority' | 'stopPropagation'> = {}
): void {
  useInput(handler, {
    ...options,
    priority: 'modal',
    stopPropagation: true,
  });
}

/**
 * useCriticalInput - Convenience hook for critical dialogs
 *
 * Registers an input handler with critical priority (highest)
 * that blocks all lower priority handlers.
 *
 * @example
 * useCriticalInput((input, key) => {
 *   if (key.return) {
 *     acknowledgeError();
 *     return true;
 *   }
 * });
 */
export function useCriticalInput(
  handler: InputHandler,
  options: Omit<UseInputOptions, 'priority' | 'stopPropagation'> = {}
): void {
  useInput(handler, {
    ...options,
    priority: 'critical',
    stopPropagation: true,
  });
}
