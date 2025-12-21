/**
 * FocusContext - Focus management via Context API
 *
 * Provides focus management to components without relying on global module state.
 * Uses the new Context API for proper scoping and nesting support.
 *
 * @example
 * // At app root (done automatically by render())
 * FocusContext.Provider({ value: focusManager },
 *   App()
 * )
 *
 * // In any component
 * const fm = useFocusContext();
 * fm.focusNext();
 */

import { createContext, useContext, hasContext } from '../primitives/context.js';
import type { FocusManager } from './types.js';
import { FocusManagerImpl } from './use-focus.js';

/**
 * Context for focus management
 *
 * Default value is null, indicating no focus management available.
 * The render() function automatically provides a FocusManager.
 */
export const FocusContext = createContext<FocusManager | null>(null);
FocusContext.displayName = 'FocusContext';

/**
 * Get the FocusManager from context
 *
 * @returns FocusManager or null if outside FocusContext.Provider
 *
 * @example
 * const fm = useFocusContext();
 * if (fm) {
 *   fm.focusNext();
 * }
 */
export function useFocusContext(): FocusManager | null {
  return useContext(FocusContext);
}

/**
 * Get the FocusManager from context, throwing if not available
 *
 * Use this when you require focus management to be available.
 *
 * @throws Error if not inside FocusContext.Provider
 * @returns FocusManager
 *
 * @example
 * const { focusNext, focusPrevious } = useFocusContextRequired();
 * if (key.tab) focusNext();
 */
export function useFocusContextRequired(): FocusManager {
  const fm = useFocusContext();
  if (!fm) {
    throw new Error('useFocusContextRequired must be called within a FocusContext.Provider (inside a Reck app)');
  }
  return fm;
}

/**
 * Check if FocusContext is available
 *
 * @returns true if inside a FocusContext.Provider
 */
export function hasFocusContext(): boolean {
  return hasContext(FocusContext) && FocusContext._currentValue !== null;
}

/**
 * Create a new FocusManager instance
 *
 * This is used internally by render() to create the focus manager.
 * You typically don't need to call this directly.
 *
 * @returns New FocusManager instance
 */
export function createFocusManagerInstance(): FocusManager {
  return new FocusManagerImpl();
}
