/**
 * useState - Create reactive state with persistence across renders
 */

import { createSignal } from '../primitives/signal.js';
import { allowInternalSignalCreationDuringRender } from '../core/dev-warnings.js';
import { getHookState, getCurrentHookIndex, setHookState } from './context.js';

/**
 * useState - Create reactive state that persists across re-renders.
 *
 * Returns `[getter, setter]`. Call `getter()` to read, `setter(value)` to update.
 * The signal persists between re-renders — unlike `createSignal`, which recreates on each call.
 *
 * **Rules:**
 * - Must be called inside a component function (not at module scope)
 * - Must be called unconditionally (not inside if/else or loops)
 * - Call order must be the same every render
 *
 * **Common mistake:** Don't use `createSignal()` inside components — it recreates
 * the signal every render, losing state. Use `useState()` instead.
 *
 * @example
 * function Counter() {
 *   const [count, setCount] = useState(0);
 *   useShortcut('up', () => setCount(c => c + 1));
 *   return Text({}, `Count: ${count()}`);
 * }
 *
 * @see docs/core/signals.md
 */
export function useState<T>(initialValue: T): [() => T, (value: T | ((prev: T) => T)) => void] {
  // Get or create signal for this hook index
  const { value: signal, isNew } = getHookState<[() => T, (value: T | ((prev: T) => T)) => void] | null>(null);

  if (isNew || signal === null) {
    // First render - create new signal and store it
    const newSignal = allowInternalSignalCreationDuringRender(() => createSignal(initialValue));
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, newSignal);
    return newSignal;
  }

  // Subsequent renders - return stored signal
  return signal;
}
