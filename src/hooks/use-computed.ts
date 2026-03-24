/**
 * useComputed - Auto-tracking memoized VNode
 *
 * Wraps a function that reads signals and returns a VNode.
 * The result is cached via createMemo (signal-level auto-tracking)
 * and persisted across re-renders via hook state.
 *
 * When signals read inside fn change, createMemo re-evaluates automatically.
 * When the component re-renders but signals haven't changed, the cached VNode is returned.
 */

import { createMemo } from '../primitives/signal.js';
import { allowInternalSignalCreationDuringRender } from '../core/dev-warnings.js';
import { getHookState, getCurrentHookIndex, setHookState, getHookStateByIndex } from './context.js';
import type { VNode } from '../utils/types.js';

interface ComputedHookData {
  memo: () => VNode | null;
  fn: () => VNode | null;
}

/**
 * useComputed - Create an auto-tracking memoized VNode.
 *
 * The provided function is wrapped in a reactive memo.
 * When signals it reads change, only this VNode is re-computed.
 * When the component re-renders for other reasons, the cached result is returned.
 *
 * Must be called inside a component (follows rules of hooks).
 *
 * @param fn - Function that reads signals and returns a VNode.
 * @returns Cached or freshly computed VNode.
 *
 * @example
 * const scoreNode = useComputed(() => Text({}, `Score: ${score()}`));
 * // Only recomputes when score() changes, not on every component re-render
 */
export function useComputed(fn: () => VNode | null): VNode | null {
  const { value: hookData, isNew } = getHookState<ComputedHookData | null>(null);

  if (isNew || hookData === null) {
    // First render: create a createMemo that auto-tracks signal deps
    const hookIndex = getCurrentHookIndex();

    // createMemo internally creates a Signal — suppress dev warning during render
    const memo = allowInternalSignalCreationDuringRender(() =>
      createMemo<VNode | null>(() => {
        // Always call the latest fn ref from hook state
        const stored = getHookStateByIndex(hookIndex) as ComputedHookData | null;
        return stored ? stored.fn() : fn();
      })
    );

    setHookState(hookIndex, { memo, fn });
    return memo();
  }

  // Subsequent renders: update fn ref so the memo calls the fresh closure
  hookData.fn = fn;
  // Return the memo's current value (auto-recomputes if signals changed)
  return hookData.memo();
}
