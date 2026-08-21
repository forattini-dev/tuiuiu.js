/** Internal owner-aware adapter from hook-based controls to InteractionRuntime. */

import {
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
  registerHookCleanup,
} from './context.js';
import { parseKeypress, type Key } from '../core/hotkeys.js';
import { getInteractionRuntime, type Disposable } from '../interaction/runtime.js';
import type { InputHandler, InputEvent, InputPriority, UseInputOptions } from './types.js';
import { INPUT_PRIORITY_VALUES } from './types.js';

export type { Key, InputHandler, InputEvent, InputPriority, UseInputOptions };
export { parseKeypress };

interface InputHookState {
  handler: InputHandler;
  registration: Disposable | null;
  active: boolean;
  priority: InputPriority;
  stopPropagation: boolean;
}

function register(state: InputHookState): Disposable {
  return getInteractionRuntime().registerHandler((event) => {
    if (!state.active || event.type !== 'key') return false;
    const handled = state.handler(event.key.text, event.key.native, {
      input: event.key.text,
      key: event.key.native,
      isPasted: false,
      raw: event.key.text,
    });
    return state.stopPropagation && Boolean(handled);
  }, {
    priority: INPUT_PRIORITY_VALUES[state.priority],
  });
}

/**
 * Internal migration adapter. Built-in controls use the single Interaction
 * Runtime even before each control has moved to semantic commands.
 */
export function useInput(
  handler: InputHandler,
  options: UseInputOptions = {},
): void {
  const { isActive = true, priority = 'normal', stopPropagation = false } = options;
  const { value, isNew } = getHookState<InputHookState | null>(null);
  const hookIndex = getCurrentHookIndex();

  if (isNew || value === null) {
    const state: InputHookState = {
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

  const state = getHookStateByIndex(hookIndex) as InputHookState | null;
  if (!state) return;
  const mustReregister = state.priority !== priority;
  state.handler = handler;
  state.active = isActive;
  state.priority = priority;
  state.stopPropagation = stopPropagation;
  if (!isActive || mustReregister) {
    state.registration?.dispose();
    state.registration = null;
  }
  if (isActive && !state.registration) state.registration = register(state);
}

export function useModalInput(
  handler: InputHandler,
  options: Omit<UseInputOptions, 'priority' | 'stopPropagation'> = {},
): void {
  useInput(handler, { ...options, priority: 'modal', stopPropagation: true });
}

export function useCriticalInput(
  handler: InputHandler,
  options: Omit<UseInputOptions, 'priority' | 'stopPropagation'> = {},
): void {
  useInput(handler, { ...options, priority: 'critical', stopPropagation: true });
}
