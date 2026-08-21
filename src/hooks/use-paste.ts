/** Internal owner-aware paste adapter for built-in controls. */

import {
  getHookState,
  getCurrentHookIndex,
  setHookState,
  registerHookCleanup,
} from './context.js';
import { getInteractionRuntime, type Disposable } from '../interaction/runtime.js';
import type { PasteHandler, PasteEvent, InputPriority, UseInputOptions } from './types.js';
import { INPUT_PRIORITY_VALUES } from './types.js';

export type { PasteHandler, PasteEvent };

interface PasteHookState {
  handler: PasteHandler;
  registration: Disposable | null;
  active: boolean;
  priority: InputPriority;
  stopPropagation: boolean;
}

function register(state: PasteHookState): Disposable {
  return getInteractionRuntime().registerHandler((event) => {
    if (!state.active || event.type !== 'paste') return false;
    const handled = state.handler({ text: event.text, isBracketed: event.bracketed });
    return state.stopPropagation && Boolean(handled);
  }, { priority: INPUT_PRIORITY_VALUES[state.priority] });
}

export function usePaste(handler: PasteHandler, options: UseInputOptions = {}): void {
  const { isActive = true, priority = 'normal', stopPropagation = false } = options;
  const { value, isNew } = getHookState<PasteHookState | null>(null);
  const hookIndex = getCurrentHookIndex();

  if (isNew || value === null) {
    const state: PasteHookState = {
      handler,
      registration: null,
      active: isActive,
      priority,
      stopPropagation,
    };
    setHookState(hookIndex, state);
    if (isActive) state.registration = register(state);
    registerHookCleanup(() => {
      state.registration?.dispose();
      state.registration = null;
      state.active = false;
    }, hookIndex);
    return;
  }

  const mustReregister = value.priority !== priority;
  value.handler = handler;
  value.active = isActive;
  value.priority = priority;
  value.stopPropagation = stopPropagation;
  if (!isActive || mustReregister) {
    value.registration?.dispose();
    value.registration = null;
  }
  if (isActive && !value.registration) value.registration = register(value);
}
