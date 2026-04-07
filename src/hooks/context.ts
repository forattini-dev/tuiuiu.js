/**
 * Internal hooks context - Shared mutable state
 *
 * This module holds the global state used by hooks.
 */

import type {
  Key,
  InputHandler,
  InputEvent,
  AppContext,
  FocusManager,
  InputHandlerEntry,
  InputPriority,
  PasteHandler,
  PasteHandlerEntry,
  PasteEvent,
} from './types.js';
import { INPUT_PRIORITY_VALUES } from './types.js';
import type { Effect } from '../primitives/signal.js';

// Inline warn utility to avoid circular dep with dev-warnings.ts
const _hookWarned = new Set<string>();
function hookWarnOnce(key: string, message: string): void {
  if (process.env.NODE_ENV === 'production' || _hookWarned.has(key)) return;
  _hookWarned.add(key);
  console.warn(`[tuiuiu] ${message}`);
}
/** Reset hook warning deduplication state (for tests) */
export function __resetHookWarningsForTesting(): void {
  _hookWarned.clear();
}

// Global app context
let appContext: AppContext | null = null;
let focusManager: FocusManager | null = null;

// Priority-based input handler registry
// Handlers are sorted by priority (highest first) when emitting
const inputHandlers: InputHandlerEntry[] = [];
let handlerIdCounter = 0;

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
let lastMaxHookIndex = 0;
let renderPhaseMode: 'hooks' | 'component' = 'hooks';

/** Call before rendering component */
export function beginRender(mode: 'hooks' | 'component' = 'hooks'): void {
  hookIndex = 0;
  isRendering = true;
  renderPhaseMode = mode;
}

/** Call after rendering component */
export function endRender(): void {
  isRendering = false;
  renderPhaseMode = 'hooks';

  const currentMaxIndex = hookIndex;

  // Detect conditional hook usage: hook count changed between renders
  // This means hooks were called inside if/else, loops, or early returns — which breaks.
  if (lastMaxHookIndex > 0 && currentMaxIndex !== lastMaxHookIndex) {
    hookWarnOnce(
      'hook-count-changed',
      `Hook count changed between renders (${lastMaxHookIndex} → ${currentMaxIndex}). ` +
      'A component with internal hooks (Select, Tabs, Menu, ChatList, ScrollList, etc.) ' +
      'was conditionally added or removed from the render tree. ' +
      'FIX: Keep hook-bearing components always rendered — use height: 0, isActive: false, ' +
      'or display: "none" to hide them instead of removing them with ternaries or When().',
    );
  }

  // Deactivate orphaned hooks (hooks that were called in previous render but not in this one)
  // This happens when switching between components with different numbers of hooks
  if (currentMaxIndex < lastMaxHookIndex) {
    for (let i = currentMaxIndex; i < lastMaxHookIndex; i++) {
      const hookData = hookState.state[i];
      if (hookData && typeof hookData === 'object' && 'registered' in hookData && 'handlerId' in hookData) {
        // This is a useInput hook - deactivate it
        if (hookData.registered && hookData.handlerId !== null) {
          removeInputHandlerById(hookData.handlerId);
          hookData.handlerId = null;
          hookData.registered = false;
        }
      }
    }
  }

  lastMaxHookIndex = currentMaxIndex;
}

/** Whether hooks are currently executing inside a render cycle. */
export function isRenderingHooks(): boolean {
  return isRendering;
}

export function getRenderPhaseMode(): 'hooks' | 'component' {
  return renderPhaseMode;
}

/** Get or initialize hook state at current index */
export function getHookState<T>(initialValue: T): { value: T; isNew: boolean } {
  // Warn if hook called outside render context
  if (!isRendering) {
    hookWarnOnce(
      'hook-outside-render',
      'A hook (useState, useMemo, useComputed, etc.) was called outside a component render. ' +
      'Hooks must be called inside a component function, not at module scope or in event handlers. ' +
      'Move the hook call inside your component function.',
    );
  }

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
  lastMaxHookIndex = 0;
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
 * Emit input event to all handlers, respecting priority
 *
 * Handlers are called in priority order (highest first).
 * If a handler with stopPropagation returns truthy, lower priority handlers don't fire.
 */
export function emitInput(input: string, key: Key, event?: Partial<InputEvent>): void {
  // Sort handlers by priority (highest first), stable sort by id for same priority
  const sorted = [...inputHandlers].sort((a, b) => {
    if (b.priorityValue !== a.priorityValue) {
      return b.priorityValue - a.priorityValue;
    }
    return a.id - b.id; // Earlier registered first at same priority
  });

  const inputEvent: InputEvent = {
    input,
    key,
    isPasted: false,
    ...event,
  };

  for (const entry of sorted) {
    try {
      const result = entry.handler(input, key, inputEvent);
      // Stop propagation if handler returned truthy and has stopPropagation flag
      if (entry.stopPropagation && result) {
        break;
      }
    } catch (error) {
      console.error('[tuiuiu] Error in input handler:', error);
    }
  }
}

/** Clear all input handlers */
export function clearInputHandlers(): void {
  inputHandlers.length = 0;
  handlerIdCounter = 0;
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

// =============================================================================
// MOUSE EVENT HANDLING
// =============================================================================

// Import MouseEvent type dynamically to avoid circular dependency
type MouseEventType = import('./use-mouse.js').MouseEvent;
type MouseHandlerType = (event: MouseEventType) => void;

interface MouseHandlerEntry {
  handler: MouseHandlerType;
  id: number;
}

const mouseHandlers: MouseHandlerEntry[] = [];
let mouseHandlerIdCounter = 0;

/**
 * Register a mouse event handler
 */
export function addMouseHandler(handler: MouseHandlerType): number {
  const id = mouseHandlerIdCounter++;
  mouseHandlers.push({ handler, id });
  return id;
}

/**
 * Remove a mouse handler by ID
 */
export function removeMouseHandlerById(id: number): boolean {
  const index = mouseHandlers.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    mouseHandlers.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Emit mouse event to all handlers
 */
export function emitMouseEvent(event: MouseEventType): void {
  for (const entry of mouseHandlers) {
    try {
      entry.handler(event);
    } catch (error) {
      console.error('[tuiuiu] Error in mouse handler:', error);
    }
  }
}

/**
 * Clear all mouse handlers
 */
export function clearMouseHandlers(): void {
  mouseHandlers.length = 0;
  mouseHandlerIdCounter = 0;
}

/**
 * Get the number of registered mouse handlers
 */
export function getMouseHandlerCount(): number {
  return mouseHandlers.length;
}

// =============================================================================
// PASTE EVENT HANDLING (Priority-based)
// =============================================================================

const pasteHandlers: PasteHandlerEntry[] = [];
let pasteHandlerIdCounter = 0;

/**
 * Register a paste event handler with priority support
 */
export function addPasteHandler(
  handler: PasteHandler,
  options: {
    priority?: InputPriority;
    stopPropagation?: boolean;
  } = {}
): number {
  const { priority = 'normal', stopPropagation = false } = options;

  const id = pasteHandlerIdCounter++;
  const entry: PasteHandlerEntry = {
    handler,
    priorityValue: INPUT_PRIORITY_VALUES[priority],
    stopPropagation,
    id,
  };

  pasteHandlers.push(entry);
  return id;
}

/**
 * Remove a paste handler by ID
 */
export function removePasteHandlerById(id: number): boolean {
  const index = pasteHandlers.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    pasteHandlers.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Emit paste event to all handlers, respecting priority
 */
export function emitPaste(text: string, isBracketed: boolean): void {
  const sorted = [...pasteHandlers].sort((a, b) => {
    if (b.priorityValue !== a.priorityValue) {
      return b.priorityValue - a.priorityValue;
    }
    return a.id - b.id;
  });

  const event: PasteEvent = { text, isBracketed };

  for (const entry of sorted) {
    try {
      const result = entry.handler(event);
      if (entry.stopPropagation && result) {
        break;
      }
    } catch (error) {
      console.error('[tuiuiu] Error in paste handler:', error);
    }
  }
}

/** Clear all paste handlers */
export function clearPasteHandlers(): void {
  pasteHandlers.length = 0;
  pasteHandlerIdCounter = 0;
}

/** Get count of registered paste handlers */
export function getPasteHandlerCount(): number {
  return pasteHandlers.length;
}
