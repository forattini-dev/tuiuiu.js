/**
 * useLayoutRef - Measure layout bounds after render
 */

import { createSignal } from '../primitives/signal.js';
import { getHookState, getCurrentHookIndex, setHookState } from './context.js';
import type { LayoutRect, LayoutRef } from '../utils/types.js';

const EMPTY_RECT: LayoutRect = { x: 0, y: 0, width: 0, height: 0 };

function isSameRect(a: LayoutRect, b: LayoutRect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

/**
 * Create a layout ref for measurement outside component hooks.
 */
export function createLayoutRef(initial?: Partial<LayoutRect>): LayoutRef {
  const [rect, setRect] = createSignal<LayoutRect>({ ...EMPTY_RECT, ...initial });

  const update = (next: LayoutRect) => {
    setRect((prev) => (isSameRect(prev, next) ? prev : next));
  };

  return {
    current: rect,
    x: () => rect().x,
    y: () => rect().y,
    width: () => rect().width,
    height: () => rect().height,
    __update: update,
  };
}

/**
 * Hook to create a stable layout ref across re-renders.
 */
export function useLayoutRef(initial?: Partial<LayoutRect>): LayoutRef {
  const { value: layoutRef, isNew } = getHookState<LayoutRef | null>(null);

  if (isNew || layoutRef === null) {
    const hookIndex = getCurrentHookIndex();
    const newRef = createLayoutRef(initial);
    setHookState(hookIndex, newRef);
    return newRef;
  }

  return layoutRef;
}
