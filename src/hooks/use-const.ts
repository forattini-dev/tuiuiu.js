/**
 * useConst - Create a value exactly once per component instance.
 */

import { getHookState, getCurrentHookIndex, setHookState } from './context.js';
import { allowInternalSignalCreationDuringRender } from '../core/dev-warnings.js';

/**
 * Lazily creates a stable value that persists across re-renders.
 *
 * @example
 * const input = useConst(() => createTextInput({ placeholder: 'Search...' }));
 */
export function useConst<T>(factory: () => T): T {
  const { value, isNew } = getHookState<T | null>(null);

  if (isNew || value === null) {
    // A useConst factory is evaluated once and its result survives future
    // renders. Signal-backed controllers created here are therefore stable,
    // unlike a bare createSignal() call in component render.
    const created = allowInternalSignalCreationDuringRender(factory);
    setHookState(getCurrentHookIndex(), created);
    return created;
  }

  return value;
}
