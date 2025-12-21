/**
 * useState - Create reactive state with persistence across renders
 */

import { createSignal, Signal } from '../primitives/signal.js';
import { getHookState, getCurrentHookIndex, setHookState } from './context.js';

/**
 * useState - Create reactive state
 *
 * Unlike createSignal, useState persists the same signal instance
 * across re-renders using a hook index system.
 *
 * @example
 * const [count, setCount] = useState(0);
 * setCount(count() + 1);
 */
export function useState<T>(initialValue: T): [() => T, (value: T | ((prev: T) => T)) => void] {
  // Get or create signal for this hook index
  const { value: signal, isNew } = getHookState<[() => T, (value: T | ((prev: T) => T)) => void] | null>(null);

  if (isNew || signal === null) {
    // First render - create new signal and store it
    const newSignal = createSignal(initialValue);
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, newSignal);
    return newSignal;
  }

  // Subsequent renders - return stored signal
  return signal;
}
