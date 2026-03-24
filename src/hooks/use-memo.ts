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
 * useMemo - Cache an expensive computation between re-renders.
 *
 * Only re-computes when deps change (shallow comparison via Object.is).
 * Use `Memo(deps, fn)` component for caching VNode subtrees.
 *
 * **Rules:**
 * - Must be called inside a component (not at module scope)
 * - Must be called unconditionally (not inside if/else)
 * - Do NOT nest inside Computed — causes hook count changes
 *
 * @param deps - Values to watch. Re-computes when any changes.
 * @param fn - Computation function. Skipped when deps match.
 * @returns Cached or freshly computed value.
 *
 * @example
 * const sorted = useMemo([items()], () =>
 *   items().sort((a, b) => a.name.localeCompare(b.name))
 * );
 *
 * @example
 * // Empty deps = compute once, cache forever
 * const config = useMemo([], () => parseConfig());
 *
 * @see docs/core/performance.md
 */
export function useMemo<T>(deps: unknown[], fn: () => T): T {
  const { value: hookData, isNew } = getHookState<MemoHookData<T> | null>(null);

  if (isNew || hookData === null || !hookData.deps || !depsEqual(hookData.deps, deps)) {
    // First render or deps changed — compute fresh
    const result = fn();
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, { deps, result });
    return result;
  }

  // Cache hit — skip computation
  return hookData.result;
}
