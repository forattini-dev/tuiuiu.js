/**
 * useInput - Handle keyboard input
 */

import {
  addInputHandler,
  removeInputHandler,
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
} from './context.js';
import { parseKeypress, type Key, type InputHandler } from '../core/hotkeys.js';

export type { Key, InputHandler };
export { parseKeypress };

/**
 * useInput - Handle keyboard input
 *
 * Uses hook state persistence to avoid registering duplicate handlers
 * across re-renders.
 *
 * @example
 * useInput((input, key) => {
 *   if (key.return) {
 *     submit();
 *   } else if (key.escape) {
 *     cancel();
 *   } else {
 *     setInput(prev => prev + input);
 *   }
 * });
 */
export function useInput(handler: InputHandler, options: { isActive?: boolean } = {}): void {
  const { isActive = true } = options;

  // Get or create hook state for this useInput call
  const { value: hookData, isNew } = getHookState<{
    handler: InputHandler;
    wrapper: InputHandler;
    registered: boolean;
  } | null>(null);

  if (isNew || hookData === null) {
    // First render - create wrapper and register
    const wrapper: InputHandler = (input, key) => {
      // Always call the latest handler (stored in hookData)
      const data = getStoredHookData();
      if (data && data.registered) {
        data.handler(input, key);
      }
    };

    const data = {
      handler,
      wrapper,
      registered: isActive,
    };

    // Store the data
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);

    // Helper to get stored data (closure over hookIndex)
    function getStoredHookData() {
      return getHookStateByIndex(hookIndex) as typeof data | null;
    }

    if (isActive) {
      addInputHandler(wrapper);
    }
  } else {
    // Subsequent render - update handler reference and active state
    const prevRegistered = hookData.registered;
    hookData.handler = handler; // Update to latest handler
    hookData.registered = isActive;

    // Handle activation/deactivation
    if (isActive && !prevRegistered) {
      addInputHandler(hookData.wrapper);
    } else if (!isActive && prevRegistered) {
      removeInputHandler(hookData.wrapper);
    }
  }
}
