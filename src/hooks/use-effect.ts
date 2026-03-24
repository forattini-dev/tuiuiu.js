/**
 * useEffect - Run side effects reactively
 *
 * Uses hook state persistence to avoid creating duplicate effects
 * across re-renders.
 */

import { createEffect, Effect } from '../primitives/signal.js';
import {
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
} from './context.js';

interface EffectHookData {
  effect: Effect;
  fn: () => void | (() => void);
  dispose: () => void;
}

/**
 * useEffect - Run side effects that auto-track signal dependencies.
 *
 * Re-runs whenever signals read inside it change. Persists across re-renders.
 * Return a cleanup function or use `onCleanup()` for resource disposal.
 *
 * **Rules:**
 * - Must be called inside a component (not at module scope)
 * - Must be called unconditionally (not inside if/else)
 * - Always clean up subscriptions, timers, and event listeners
 *
 * @example
 * useEffect(() => {
 *   console.log('Count is:', count());
 *   return () => console.log('Cleanup');
 * });
 *
 * @example
 * // Using onCleanup (can be called multiple times)
 * useEffect(() => {
 *   const timer = setInterval(tick, 1000);
 *   onCleanup(() => clearInterval(timer));
 * });
 *
 * @see docs/core/signals.md
 */
export function useEffect(fn: () => void | (() => void)): () => void {
  // Get or create hook state for this useEffect call
  const { value: hookData, isNew } = getHookState<EffectHookData | null>(null);

  if (isNew || hookData === null) {
    // First render - create the effect
    const hookIndex = getCurrentHookIndex();

    // Pre-create the data object so the effect wrapper can access it
    const data: EffectHookData = {
      effect: null as any, // Will be set below
      fn,
      dispose: null as any, // Will be set below
    };

    // Store data BEFORE creating effect, so the wrapper can access it
    setHookState(hookIndex, data);

    // Create wrapper that always calls the latest fn
    const effect = new Effect(() => {
      const storedData = getHookStateByIndex(hookIndex) as EffectHookData | null;
      if (storedData) {
        return storedData.fn();
      }
    });

    const dispose = () => effect.dispose();

    // Update the data with actual effect and dispose
    data.effect = effect;
    data.dispose = dispose;

    return dispose;
  } else {
    // Subsequent render - update fn reference
    // The effect will use the new fn on next run
    hookData.fn = fn;
    return hookData.dispose;
  }
}
