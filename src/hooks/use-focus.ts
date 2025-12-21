/**
 * useFocus - Focus management hooks
 */

import { createEffect } from '../primitives/signal.js';
import { getFocusManager, setFocusManager } from './context.js';
import { hasContext } from '../primitives/context.js';
import { FocusContext } from './focus-context.js';
import { useState } from './use-state.js';
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
 * Focus Manager - Manages focus between components
 */
export class FocusManagerImpl implements FocusManager {
  private items: Map<string, (focused: boolean) => void> = new Map();
  private order: string[] = [];
  private currentIndex = -1;

  register(id: string, setFocused: (focused: boolean) => void): void {
    this.items.set(id, setFocused);
    this.order.push(id);
  }

  unregister(id: string): void {
    this.items.delete(id);
    const index = this.order.indexOf(id);
    if (index >= 0) {
      this.order.splice(index, 1);
      if (this.currentIndex >= index && this.currentIndex > 0) {
        this.currentIndex--;
      }
    }
  }

  focus(id: string): void {
    const index = this.order.indexOf(id);
    if (index >= 0) {
      this.setFocusIndex(index);
    }
  }

  focusNext(): void {
    if (this.order.length === 0) return;
    this.setFocusIndex((this.currentIndex + 1) % this.order.length);
  }

  focusPrevious(): void {
    if (this.order.length === 0) return;
    this.setFocusIndex((this.currentIndex - 1 + this.order.length) % this.order.length);
  }

  blur(): void {
    // Unfocus current without focusing another
    if (this.currentIndex >= 0 && this.currentIndex < this.order.length) {
      const currentId = this.order[this.currentIndex];
      const handler = this.items.get(currentId!);
      handler?.(false);
    }
    this.currentIndex = -1;
  }

  getActiveId(): string | undefined {
    if (this.currentIndex >= 0 && this.currentIndex < this.order.length) {
      return this.order[this.currentIndex];
    }
    return undefined;
  }

  private setFocusIndex(index: number): void {
    // Unfocus current
    if (this.currentIndex >= 0 && this.currentIndex < this.order.length) {
      const currentId = this.order[this.currentIndex];
      const handler = this.items.get(currentId!);
      handler?.(false);
    }

    // Focus new
    this.currentIndex = index;
    if (index >= 0 && index < this.order.length) {
      const newId = this.order[index];
      const handler = this.items.get(newId!);
      handler?.(true);
    }
  }
}

/**
 * Create and initialize a focus manager
 */
export function createFocusManager(): FocusManager {
  const fm = new FocusManagerImpl();
  setFocusManager(fm);
  return fm;
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
    throw new Error('useFocusManager must be called within a Reck app');
  }

  return {
    focusNext: () => getActiveFocusManager()!.focusNext(),
    focusPrevious: () => getActiveFocusManager()!.focusPrevious(),
    focus: (id: string) => getActiveFocusManager()!.focus(id),
    blur: () => getActiveFocusManager()!.blur(),
    getActiveId: () => getActiveFocusManager()!.getActiveId(),
  };
}
