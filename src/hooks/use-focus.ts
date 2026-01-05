/**
 * useFocus - Focus management hooks
 */

import { createEffect } from '../primitives/signal.js';
import { getFocusManager, setFocusManager } from './context.js';
import { hasContext } from '../primitives/context.js';
import { FocusContext } from './focus-context.js';
import { useState } from './use-state.js';
import { getFocusZoneManager } from '../core/focus.js';
import type { FocusOptions, FocusResult, FocusManager } from './types.js';

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
 * FocusZoneManagerAdapter - Bridges simple FocusManager interface to FocusZoneManager
 *
 * This adapter allows existing code using useFocus() to benefit from
 * the advanced FocusZoneManager features (zones, traps, stacks) while
 * maintaining backward compatibility with the simpler FocusManager interface.
 *
 * Elements are registered in the root zone ('__root__') by default.
 */
export class FocusZoneManagerAdapter implements FocusManager {
  private zoneManager = getFocusZoneManager();
  private readonly zoneId: string;

  constructor(zoneId: string = '__root__') {
    this.zoneId = zoneId;
  }

  register(id: string, setFocused: (focused: boolean) => void): void {
    this.zoneManager.registerElement(id, this.zoneId, {
      onFocus: setFocused,
    });
  }

  unregister(id: string): void {
    this.zoneManager.unregisterElement(id, this.zoneId);
  }

  focus(id: string): void {
    this.zoneManager.focusElement(id, this.zoneId);
  }

  focusNext(): void {
    this.zoneManager.focusNextInZone(this.zoneId);
  }

  focusPrevious(): void {
    this.zoneManager.focusPreviousInZone(this.zoneId);
  }

  blur(): void {
    this.zoneManager.blur(this.zoneId);
  }

  getActiveId(): string | undefined {
    return this.zoneManager.getActiveId(this.zoneId) ?? undefined;
  }
}

/**
 * Create a FocusZoneManagerAdapter for use with useFocus
 *
 * This is the recommended way to create a focus manager for new code.
 * It uses the advanced FocusZoneManager internally while providing
 * the simple FocusManager interface.
 *
 * @param zoneId - Optional zone ID. Defaults to root zone.
 */
export function createFocusAdapter(zoneId?: string): FocusManager {
  const adapter = new FocusZoneManagerAdapter(zoneId);
  setFocusManager(adapter);
  return adapter;
}

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
