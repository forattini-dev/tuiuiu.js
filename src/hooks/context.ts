/**
 * Internal hooks context - Shared mutable state
 *
 * This module holds the global state used by hooks.
 * Will be moved to app layer in a future refactor.
 */

import { EventEmitter } from 'node:events';
import type { Key, InputHandler, AppContext, FocusManager } from './types.js';
import type { Effect } from '../primitives/signal.js';

// Global app context
let appContext: AppContext | null = null;
let focusManager: FocusManager | null = null;

// EventEmitter for input events
// More robust than array-based: proper on/off cleanup, no stale handlers
const inputEventEmitter = new EventEmitter();
inputEventEmitter.setMaxListeners(100); // Allow many input handlers

// =============================================================================
// HOOK STATE PERSISTENCE
// =============================================================================
// Hook index system for persisting state across renders

interface HookState {
  state: any[];        // useState values
  effects: Effect[];   // useEffect effects
}

let hookState: HookState = { state: [], effects: [] };
let hookIndex = 0;
let isRendering = false;

/** Call before rendering component */
export function beginRender(): void {
  hookIndex = 0;
  isRendering = true;
}

/** Call after rendering component */
export function endRender(): void {
  isRendering = false;
}

/** Get or initialize hook state at current index */
export function getHookState<T>(initialValue: T): { value: T; isNew: boolean } {
  const index = hookIndex++;

  if (index >= hookState.state.length) {
    // New hook - initialize
    hookState.state.push(initialValue);
    return { value: initialValue, isNew: true };
  }

  // Existing hook - return stored value
  return { value: hookState.state[index], isNew: false };
}

/** Update hook state at a specific index */
export function setHookState(index: number, value: any): void {
  hookState.state[index] = value;
}

/** Get hook state by index (for closures that need to access state later) */
export function getHookStateByIndex(index: number): any {
  return hookState.state[index];
}

/** Get hook index (for setState to know which index to update) */
export function getCurrentHookIndex(): number {
  return hookIndex - 1; // Return the index of the last accessed hook
}

/** Get or initialize effect at current index */
export function getHookEffect(index: number): Effect | undefined {
  return hookState.effects[index];
}

/** Store effect at current index */
export function setHookEffect(index: number, effect: Effect): void {
  hookState.effects[index] = effect;
}

/** Reset all hook state (on unmount) */
export function resetHookState(): void {
  // Dispose all effects
  for (const effect of hookState.effects) {
    if (effect) {
      effect.dispose();
    }
  }
  hookState = { state: [], effects: [] };
  hookIndex = 0;
}

export function getAppContext(): AppContext | null {
  return appContext;
}

export function setAppContext(ctx: AppContext | null): void {
  appContext = ctx;
}

// =============================================================================
// INPUT HANDLER MANAGEMENT (EventEmitter-based)
// =============================================================================

/** Get the internal input event emitter */
export function getInputEventEmitter(): EventEmitter {
  return inputEventEmitter;
}

/** Register an input handler via EventEmitter */
export function addInputHandler(handler: InputHandler): void {
  inputEventEmitter.on('input', handler);
}

/** Remove an input handler via EventEmitter */
export function removeInputHandler(handler: InputHandler): void {
  inputEventEmitter.off('input', handler);
}

/** Emit input event to all handlers */
export function emitInput(input: string, key: Key): void {
  inputEventEmitter.emit('input', input, key);
}

/** Clear all input handlers */
export function clearInputHandlers(): void {
  inputEventEmitter.removeAllListeners('input');
}

/** Get count of registered input handlers (for testing/debugging) */
export function getInputHandlerCount(): number {
  return inputEventEmitter.listenerCount('input');
}

export function getFocusManager(): FocusManager | null {
  return focusManager;
}

export function setFocusManager(fm: FocusManager | null): void {
  focusManager = fm;
}
