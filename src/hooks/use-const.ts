/**
 * useConst - Create a value exactly once per component instance.
 */

import { getHookState, getCurrentHookIndex, setHookState } from './context.js';

/**
 * Lazily creates a stable value that persists across re-renders.
 *
 * @example
 * const input = useConst(() => createTextInput({ placeholder: 'Search...' }));
 */
export function useConst<T>(factory: () => T): T {
  const { value, isNew } = getHookState<T | null>(null);

  if (isNew || value === null) {
    const created = factory();
    setHookState(getCurrentHookIndex(), created);
    return created;
  }

  return value;
}
