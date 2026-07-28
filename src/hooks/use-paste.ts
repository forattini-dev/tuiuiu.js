/**
 * usePaste - Handle paste events with priority support
 *
 * Detects paste via bracketed paste mode (ESC[200~ ... ESC[201~) or
 * heuristic detection for terminals without bracketed paste support.
 */

import {
  addPasteHandler,
  removePasteHandlerById,
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
  registerHookCleanup,
} from './context.js';
import type { PasteHandler, PasteEvent, InputPriority, UseInputOptions } from './types.js';

export type { PasteHandler, PasteEvent };

/**
 * usePaste - Handle paste events with priority support
 *
 * Uses hook state persistence to avoid registering duplicate handlers
 * across re-renders. Follows the same pattern as useInput.
 *
 * @param handler - Function called when paste is detected
 * @param options - Configuration options
 *
 * @example
 * // Basic usage
 * usePaste((event) => {
 *   console.log('Pasted:', event.text);
 *   console.log('Bracketed:', event.isBracketed);
 * });
 *
 * @example
 * // Modal that captures paste
 * usePaste((event) => {
 *   insertText(event.text);
 *   return true; // Stop propagation
 * }, { priority: 'modal', stopPropagation: true });
 */
export function usePaste(
  handler: PasteHandler,
  options: UseInputOptions = {}
): void {
  const { isActive = true, priority = 'normal', stopPropagation = false } = options;

  const { value: hookData, isNew } = getHookState<{
    handler: PasteHandler;
    wrapper: PasteHandler;
    registered: boolean;
    handlerId: number | null;
    priority: InputPriority;
    stopPropagation: boolean;
  } | null>(null);

  if (isNew || hookData === null) {
    const wrapper: PasteHandler = (event) => {
      const data = getStoredHookData();
      if (data && data.registered) {
        return data.handler(event);
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

    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);

    function getStoredHookData() {
      return getHookStateByIndex(hookIndex) as typeof data | null;
    }

    if (isActive) {
      data.handlerId = addPasteHandler(wrapper, { priority, stopPropagation });
    }
    registerHookCleanup(() => {
      if (data.handlerId !== null) {
        removePasteHandlerById(data.handlerId);
        data.handlerId = null;
      }
      data.registered = false;
    }, hookIndex);
  } else {
    const prevRegistered = hookData.registered;
    hookData.handler = handler;
    hookData.registered = isActive;

    const priorityChanged = hookData.priority !== priority;
    const stopPropChanged = hookData.stopPropagation !== stopPropagation;
    const optionsChanged = priorityChanged || stopPropChanged;

    if (isActive && !prevRegistered) {
      hookData.priority = priority;
      hookData.stopPropagation = stopPropagation;
      hookData.handlerId = addPasteHandler(hookData.wrapper, { priority, stopPropagation });
    } else if (!isActive && prevRegistered) {
      if (hookData.handlerId !== null) {
        removePasteHandlerById(hookData.handlerId);
        hookData.handlerId = null;
      }
    } else if (isActive && optionsChanged) {
      if (hookData.handlerId !== null) {
        removePasteHandlerById(hookData.handlerId);
      }
      hookData.priority = priority;
      hookData.stopPropagation = stopPropagation;
      hookData.handlerId = addPasteHandler(hookData.wrapper, { priority, stopPropagation });
    }
  }
}
