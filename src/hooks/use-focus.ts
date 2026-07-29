/**
 * useFocus - Focus management hooks
 */

import { createEffect } from '../primitives/signal.js';
import { getFocusManager } from './context.js';
import { hasContext } from '../primitives/context.js';
import { FocusContext } from './focus-context.js';
import { useState } from './use-state.js';
import type { FocusOptions, FocusResult, FocusManager } from './types.js';

export {
  createFocusAdapter,
  FocusZoneManagerAdapter,
} from './focus-adapter.js';

/**
 * Get FocusManager from Context or global fallback
 *
 * Prefers FocusContext if available, otherwise uses global module state.
 * This allows gradual migration to Context-based focus management.
 */
function getActiveFocusManager(): FocusManager | null {
  // Check Context first
  if (hasContext(FocusContext) && FocusContext._currentValue !== null) {
    return FocusContext._currentValue;
  }
  // Fall back to global
  return getFocusManager();
}

export type { FocusOptions, FocusResult, FocusManager };

/**
 * useFocus - Focus management for the component
 *
 * @example
 * const { isFocused, focus } = useFocus({ autoFocus: true });
 */
export function useFocus(options: FocusOptions = {}): FocusResult {
  const { autoFocus = false, isActive = true, id } = options;
  const [isFocused, setIsFocused] = useState(false);

  createEffect(() => {
    const focusManager = getActiveFocusManager();
    if (!focusManager || !isActive) return;

    const focusId = id ?? Math.random().toString(36).slice(2);
    focusManager.register(focusId, setIsFocused);

    if (autoFocus) {
      focusManager.focus(focusId);
    }

    return () => {
      getActiveFocusManager()?.unregister(focusId);
    };
  });

  return {
    isFocused: isFocused(),
    focus: () => {
      const focusManager = getActiveFocusManager();
      if (focusManager && id) {
        focusManager.focus(id);
      }
    },
  };
}

/**
 * useFocusManager - Control focus programmatically
 *
 * @example
 * const { focusNext, focusPrevious, blur } = useFocusManager();
 * if (key.tab) focusNext();
 * if (key.escape) blur();
 */
export function useFocusManager(): {
  focusNext: () => void;
  focusPrevious: () => void;
  focus: (id: string) => void;
  blur: () => void;
  getActiveId: () => string | undefined;
} {
  const focusManager = getActiveFocusManager();
  if (!focusManager) {
    throw new Error('useFocusManager must be called within a Tuiuiu app');
  }

  return {
    focusNext: () => getActiveFocusManager()!.focusNext(),
    focusPrevious: () => getActiveFocusManager()!.focusPrevious(),
    focus: (id: string) => getActiveFocusManager()!.focus(id),
    blur: () => getActiveFocusManager()!.blur(),
    getActiveId: () => getActiveFocusManager()!.getActiveId(),
  };
}
