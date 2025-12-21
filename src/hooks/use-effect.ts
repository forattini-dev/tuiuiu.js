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
 * useEffect - Run side effects reactively
 *
 * The effect will re-run whenever any signals read inside it change.
 * Only one effect is created per useEffect call, persisted across re-renders.
 *
 * @example
 * useEffect(() => {
 *   console.log('Count changed:', count());
 *   return () => console.log('Cleanup');
 * });
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
