/**
 * useMemo - Cache a value between re-renders until deps change
 *
 * Like React's useMemo, but for tuiuiu's hook system.
 * Persists across re-renders via hook state index.
 */

import { getHookState, getCurrentHookIndex, setHookState } from './context.js';

interface MemoHookData<T> {
  deps: unknown[];
  result: T;
}

function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

/**
 * useMemo - Memoize an expensive computation.
 *
 * Returns a cached value and only re-computes when deps change.
 * Must be called inside a component (follows rules of hooks).
 *
 * @param deps - Values to watch. When any value changes, fn is re-called.
 * @param fn - Computation function. Only called when deps change.
 * @returns The cached (or freshly computed) value.
 *
 * @example
 * // Only recomputes when items changes
 * const sorted = useMemo([items()], () => {
 *   return items().sort((a, b) => a.name.localeCompare(b.name));
 * });
 */
export function useMemo<T>(deps: unknown[], fn: () => T): T {
  const { value: hookData, isNew } = getHookState<MemoHookData<T> | null>(null);

  if (isNew || hookData === null || !depsEqual(hookData.deps, deps)) {
    // First render or deps changed — compute fresh
    const result = fn();
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, { deps, result });
    return result;
  }

  // Cache hit — skip computation
  return hookData.result;
}
