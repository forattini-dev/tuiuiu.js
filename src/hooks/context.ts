/**
 * Internal hooks context - Shared mutable state
 *
 * This module holds the global state used by hooks.
 * Will be moved to app layer in a future refactor.
 */

import { EventEmitter } from 'node:events';
import type {
  Key,
  InputHandler,
  AppContext,
  FocusManager,
  InputHandlerEntry,
  InputPriority,
} from './types.js';
import { INPUT_PRIORITY_VALUES } from './types.js';
import type { Effect } from '../primitives/signal.js';

// Global app context
let appContext: AppContext | null = null;
let focusManager: FocusManager | null = null;

// Priority-based input handler registry
// Handlers are sorted by priority (highest first) when emitting
const inputHandlers: InputHandlerEntry[] = [];
let handlerIdCounter = 0;

// Legacy EventEmitter for backward compatibility (deprecated)
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
// INPUT HANDLER MANAGEMENT (Priority-based)
// =============================================================================

/** Get the internal input event emitter (legacy, for backward compatibility) */
export function getInputEventEmitter(): EventEmitter {
  return inputEventEmitter;
}

/**
 * Register an input handler with priority support
 *
 * @param handler - The input handler function
 * @param options - Priority and propagation options
 * @returns Handler ID for removal
 */
export function addInputHandler(
  handler: InputHandler,
  options: {
    priority?: InputPriority;
    stopPropagation?: boolean;
  } = {}
): number {
  const { priority = 'normal', stopPropagation = false } = options;

  const id = handlerIdCounter++;
  const entry: InputHandlerEntry = {
    handler,
    priorityValue: INPUT_PRIORITY_VALUES[priority],
    stopPropagation,
    id,
  };

  inputHandlers.push(entry);

  // Warn if we have too many handlers
  if (inputHandlers.length > 100) {
    console.warn(
      `[tuiuiu] High number of input handlers (${inputHandlers.length}). ` +
        'This may indicate a memory leak from handlers not being properly removed.'
    );
  }

  return id;
}

/**
 * Remove an input handler by ID
 */
export function removeInputHandlerById(id: number): boolean {
  const index = inputHandlers.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    inputHandlers.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Remove an input handler by reference (legacy support)
 * @deprecated Use removeInputHandlerById instead
 */
export function removeInputHandler(handler: InputHandler): void {
  const index = inputHandlers.findIndex((entry) => entry.handler === handler);
  if (index !== -1) {
    inputHandlers.splice(index, 1);
  }
  // Also remove from legacy emitter
  inputEventEmitter.off('input', handler);
}

/**
 * Emit input event to all handlers, respecting priority
 *
 * Handlers are called in priority order (highest first).
 * If a handler with stopPropagation returns truthy, lower priority handlers don't fire.
 */
export function emitInput(input: string, key: Key): void {
  // Sort handlers by priority (highest first), stable sort by id for same priority
  const sorted = [...inputHandlers].sort((a, b) => {
    if (b.priorityValue !== a.priorityValue) {
      return b.priorityValue - a.priorityValue;
    }
    return a.id - b.id; // Earlier registered first at same priority
  });

  for (const entry of sorted) {
    try {
      const result = entry.handler(input, key);
      // Stop propagation if handler returned truthy and has stopPropagation flag
      if (entry.stopPropagation && result) {
        break;
      }
    } catch (error) {
      console.error('[tuiuiu] Error in input handler:', error);
    }
  }

  // Also emit to legacy EventEmitter for backward compatibility
  // This will be removed in a future version
  inputEventEmitter.emit('input', input, key);
}

/** Clear all input handlers */
export function clearInputHandlers(): void {
  inputHandlers.length = 0;
  handlerIdCounter = 0;
  inputEventEmitter.removeAllListeners('input');
}

/** Get count of registered input handlers (for testing/debugging) */
export function getInputHandlerCount(): number {
  return inputHandlers.length;
}

/** Get all input handlers (for testing/debugging) */
export function getInputHandlers(): readonly InputHandlerEntry[] {
  return inputHandlers;
}

export function getFocusManager(): FocusManager | null {
  return focusManager;
}

export function setFocusManager(fm: FocusManager | null): void {
  focusManager = fm;
}
