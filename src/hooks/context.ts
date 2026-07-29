/**
 * Internal hooks context - Runtime-scoped mutable state
 *
 * Every rendered app owns a RuntimeScope. Standalone hook utilities use the
 * compatibility scope supplied by runtime-scope.ts.
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
import {
  getRuntimeResource,
  getRuntimeScope,
  runInRuntimeScope,
  type RuntimeScope,
} from '../core/runtime-scope.js';

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

// =============================================================================
// HOOK STATE PERSISTENCE
// =============================================================================
// Hook index system for persisting state across renders

interface HookState {
  state: any[];        // useState values
  effects: Effect[];   // useEffect effects
}

type MouseEventType = import('./use-mouse.js').MouseEvent;
type MouseHandlerType = (event: MouseEventType) => void;

interface MouseHandlerEntry {
  handler: MouseHandlerType;
  id: number;
}

interface HookRuntimeState {
  appContext: AppContext | null;
  focusManager: FocusManager | null;
  inputHandlers: InputHandlerEntry[];
  handlerIdCounter: number;
  hookState: HookState;
  hookIndex: number;
  isRendering: boolean;
  lastMaxHookIndex: number;
  renderPhaseMode: 'hooks' | 'component';
  hookCleanups: Map<number, Set<() => void>>;
  mouseHandlers: MouseHandlerEntry[];
  mouseHandlerIdCounter: number;
  lastMouseClick: {
    x: number;
    y: number;
    time: number;
    button: MouseEventType['button'];
  } | null;
  pasteHandlers: PasteHandlerEntry[];
  pasteHandlerIdCounter: number;
}

const HOOK_RUNTIME_STATE = Symbol('tuiuiu.hook-runtime-state');
const appRuntimeScopes = new WeakMap<AppContext, RuntimeScope>();

function createHookRuntimeState(): HookRuntimeState {
  return {
    appContext: null,
    focusManager: null,
    inputHandlers: [],
    handlerIdCounter: 0,
    hookState: { state: [], effects: [] },
    hookIndex: 0,
    isRendering: false,
    lastMaxHookIndex: 0,
    renderPhaseMode: 'hooks',
    hookCleanups: new Map(),
    mouseHandlers: [],
    mouseHandlerIdCounter: 0,
    lastMouseClick: null,
    pasteHandlers: [],
    pasteHandlerIdCounter: 0,
  };
}

function getHookRuntimeState(scope?: RuntimeScope): HookRuntimeState {
  return getRuntimeResource(HOOK_RUNTIME_STATE, createHookRuntimeState, scope);
}

export function getRuntimeScopeForApp(appContext: AppContext): RuntimeScope | null {
  return appRuntimeScopes.get(appContext) ?? null;
}

export function runWithAppContext<T>(
  appContext: AppContext,
  callback: () => T,
): T {
  const scope = getRuntimeScopeForApp(appContext);
  if (!scope) return callback();
  return runInRuntimeScope(scope, callback);
}

/** Call before rendering component */
export function beginRender(mode: 'hooks' | 'component' = 'hooks'): void {
  const runtime = getHookRuntimeState();
  runtime.hookIndex = 0;
  runtime.isRendering = true;
  runtime.renderPhaseMode = mode;
}

/** Call after rendering component */
export function endRender(): void {
  const runtime = getHookRuntimeState();
  runtime.isRendering = false;
  runtime.renderPhaseMode = 'hooks';

  const currentMaxIndex = runtime.hookIndex;

  // Detect conditional hook usage: hook count changed between renders
  // This means hooks were called inside if/else, loops, or early returns — which breaks.
  if (runtime.lastMaxHookIndex > 0 && currentMaxIndex !== runtime.lastMaxHookIndex) {
    hookWarnOnce(
      'hook-count-changed',
      `Hook count changed between renders (${runtime.lastMaxHookIndex} → ${currentMaxIndex}). ` +
      'A component with internal hooks (Select, Tabs, Menu, ChatList, ScrollList, etc.) ' +
      'was conditionally added or removed from the render tree. ' +
      'FIX: Keep hook-bearing components always rendered — use height: 0, isActive: false, ' +
      'or display: "none" to hide them instead of removing them with ternaries or When().',
    );
  }

  // Deactivate orphaned hooks (hooks that were called in previous render but not in this one)
  // This happens when switching between components with different numbers of hooks
  if (currentMaxIndex < runtime.lastMaxHookIndex) {
    for (let i = currentMaxIndex; i < runtime.lastMaxHookIndex; i++) {
      runHookCleanups(i, runtime);
      const hookData = runtime.hookState.state[i];
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

  runtime.hookState.state.length = Math.min(runtime.hookState.state.length, currentMaxIndex);
  runtime.lastMaxHookIndex = currentMaxIndex;
}

/** Whether hooks are currently executing inside a render cycle. */
export function isRenderingHooks(): boolean {
  return getHookRuntimeState().isRendering;
}

export function getRenderPhaseMode(): 'hooks' | 'component' {
  return getHookRuntimeState().renderPhaseMode;
}

/** Get or initialize hook state at current index */
export function getHookState<T>(initialValue: T): { value: T; isNew: boolean } {
  const runtime = getHookRuntimeState();
  // Warn if hook called outside render context
  if (!runtime.isRendering) {
    hookWarnOnce(
      'hook-outside-render',
      'A hook (useState, useMemo, useComputed, etc.) was called outside a component render. ' +
      'Hooks must be called inside a component function, not at module scope or in event handlers. ' +
      'Move the hook call inside your component function.',
    );
  }

  const index = runtime.hookIndex++;

  if (index >= runtime.hookState.state.length) {
    // New hook - initialize
    runtime.hookState.state.push(initialValue);
    return { value: initialValue, isNew: true };
  }

  // Existing hook - return stored value
  return { value: runtime.hookState.state[index], isNew: false };
}

/** Update hook state at a specific index */
export function setHookState(index: number, value: any): void {
  getHookRuntimeState().hookState.state[index] = value;
}

/** Get hook state by index (for closures that need to access state later) */
export function getHookStateByIndex(index: number): any {
  return getHookRuntimeState().hookState.state[index];
}

/** Get hook index (for setState to know which index to update) */
export function getCurrentHookIndex(): number {
  return getHookRuntimeState().hookIndex - 1; // Return the index of the last accessed hook
}

/**
 * Register cleanup associated with a hook slot.
 *
 * Cleanups run when the slot becomes orphaned and on root unmount.
 */
export function registerHookCleanup(
  cleanup: () => void,
  index = getCurrentHookIndex(),
): () => void {
  const runtime = getHookRuntimeState();
  let cleanups = runtime.hookCleanups.get(index);
  if (!cleanups) {
    cleanups = new Set();
    runtime.hookCleanups.set(index, cleanups);
  }
  cleanups.add(cleanup);
  return () => {
    cleanups?.delete(cleanup);
    if (cleanups?.size === 0) runtime.hookCleanups.delete(index);
  };
}

function runHookCleanups(index: number, runtime: HookRuntimeState): void {
  const cleanups = runtime.hookCleanups.get(index);
  if (!cleanups) return;
  runtime.hookCleanups.delete(index);
  for (const cleanup of [...cleanups].reverse()) {
    try {
      cleanup();
    } catch (error) {
      console.error('[tuiuiu] Error during hook cleanup:', error);
    }
  }
}

/** Reset all hook state (on unmount) */
export function resetHookState(scope?: RuntimeScope): void {
  const resolvedScope = getRuntimeScope(scope);
  const runtime = getHookRuntimeState(resolvedScope);
  runInRuntimeScope(resolvedScope, () => {
    for (const index of [...runtime.hookCleanups.keys()].sort((a, b) => b - a)) {
      runHookCleanups(index, runtime);
    }
  });

  for (const effect of runtime.hookState.effects) {
    if (effect) effect.dispose();
  }
  runtime.hookState = { state: [], effects: [] };
  runtime.hookIndex = 0;
  runtime.lastMaxHookIndex = 0;
  runtime.isRendering = false;
}

export function getAppContext(scope?: RuntimeScope): AppContext | null {
  return getHookRuntimeState(scope).appContext;
}

export function setAppContext(
  ctx: AppContext | null,
  scope?: RuntimeScope,
): void {
  const resolvedScope = getRuntimeScope(scope);
  const runtime = getHookRuntimeState(resolvedScope);
  const previous = runtime.appContext;
  runtime.appContext = ctx;
  if (previous && previous !== ctx) appRuntimeScopes.delete(previous);
  if (ctx) appRuntimeScopes.set(ctx, resolvedScope);
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
  const runtime = getHookRuntimeState();

  const id = runtime.handlerIdCounter++;
  const entry: InputHandlerEntry = {
    handler,
    priorityValue: INPUT_PRIORITY_VALUES[priority],
    stopPropagation,
    id,
  };

  runtime.inputHandlers.push(entry);

  // Warn if we have too many handlers
  if (runtime.inputHandlers.length > 100) {
    console.warn(
      `[tuiuiu] High number of input handlers (${runtime.inputHandlers.length}). ` +
        'This may indicate a memory leak from handlers not being properly removed.'
    );
  }

  return id;
}

/**
 * Remove an input handler by ID
 */
export function removeInputHandlerById(id: number): boolean {
  const runtime = getHookRuntimeState();
  const index = runtime.inputHandlers.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    runtime.inputHandlers.splice(index, 1);
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
  const runtime = getHookRuntimeState();
  // Sort handlers by priority (highest first), stable sort by id for same priority
  const sorted = [...runtime.inputHandlers].sort((a, b) => {
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
export function clearInputHandlers(scope?: RuntimeScope): void {
  const runtime = getHookRuntimeState(scope);
  runtime.inputHandlers.length = 0;
  runtime.handlerIdCounter = 0;
}

/** Get count of registered input handlers (for testing/debugging) */
export function getInputHandlerCount(): number {
  return getHookRuntimeState().inputHandlers.length;
}

/** Get all input handlers (for testing/debugging) */
export function getInputHandlers(): readonly InputHandlerEntry[] {
  return getHookRuntimeState().inputHandlers;
}

export function getFocusManager(): FocusManager | null {
  return getHookRuntimeState().focusManager;
}

export function setFocusManager(
  fm: FocusManager | null,
  scope?: RuntimeScope,
): void {
  getHookRuntimeState(scope).focusManager = fm;
}

// =============================================================================
// MOUSE EVENT HANDLING
// =============================================================================

/**
 * Register a mouse event handler
 */
export function addMouseHandler(handler: MouseHandlerType): number {
  const runtime = getHookRuntimeState();
  const id = runtime.mouseHandlerIdCounter++;
  runtime.mouseHandlers.push({ handler, id });
  return id;
}

/**
 * Remove a mouse handler by ID
 */
export function removeMouseHandlerById(id: number): boolean {
  const runtime = getHookRuntimeState();
  const index = runtime.mouseHandlers.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    runtime.mouseHandlers.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Emit mouse event to all handlers
 */
export function emitMouseEvent(event: MouseEventType): void {
  const runtime = getHookRuntimeState();
  const processedEvent = classifyMouseClick(runtime, event);
  for (const entry of [...runtime.mouseHandlers]) {
    try {
      entry.handler(processedEvent);
    } catch (error) {
      console.error('[tuiuiu] Error in mouse handler:', error);
    }
  }
}

/**
 * Clear all mouse handlers
 */
export function clearMouseHandlers(scope?: RuntimeScope): void {
  const runtime = getHookRuntimeState(scope);
  runtime.mouseHandlers.length = 0;
  runtime.mouseHandlerIdCounter = 0;
  runtime.lastMouseClick = null;
}

const DOUBLE_CLICK_THRESHOLD = 300;
const DOUBLE_CLICK_DISTANCE = 2;

function classifyMouseClick(
  runtime: HookRuntimeState,
  event: MouseEventType
): MouseEventType {
  if (event.action !== 'click') return event;

  const now = Date.now();
  const last = runtime.lastMouseClick;
  if (
    last
    && last.button === event.button
    && now - last.time < DOUBLE_CLICK_THRESHOLD
    && Math.abs(event.x - last.x) <= DOUBLE_CLICK_DISTANCE
    && Math.abs(event.y - last.y) <= DOUBLE_CLICK_DISTANCE
  ) {
    runtime.lastMouseClick = null;
    return { ...event, action: 'double-click' };
  }

  runtime.lastMouseClick = {
    x: event.x,
    y: event.y,
    time: now,
    button: event.button,
  };
  return event;
}

export function resetMouseClickState(scope?: RuntimeScope): void {
  getHookRuntimeState(scope).lastMouseClick = null;
}

/**
 * Get the number of registered mouse handlers
 */
export function getMouseHandlerCount(): number {
  return getHookRuntimeState().mouseHandlers.length;
}

// =============================================================================
// PASTE EVENT HANDLING (Priority-based)
// =============================================================================

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
  const runtime = getHookRuntimeState();

  const id = runtime.pasteHandlerIdCounter++;
  const entry: PasteHandlerEntry = {
    handler,
    priorityValue: INPUT_PRIORITY_VALUES[priority],
    stopPropagation,
    id,
  };

  runtime.pasteHandlers.push(entry);
  return id;
}

/**
 * Remove a paste handler by ID
 */
export function removePasteHandlerById(id: number): boolean {
  const runtime = getHookRuntimeState();
  const index = runtime.pasteHandlers.findIndex((entry) => entry.id === id);
  if (index !== -1) {
    runtime.pasteHandlers.splice(index, 1);
    return true;
  }
  return false;
}

/**
 * Emit paste event to all handlers, respecting priority
 */
export function emitPaste(text: string, isBracketed: boolean): void {
  const sorted = [...getHookRuntimeState().pasteHandlers].sort((a, b) => {
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
export function clearPasteHandlers(scope?: RuntimeScope): void {
  const runtime = getHookRuntimeState(scope);
  runtime.pasteHandlers.length = 0;
  runtime.pasteHandlerIdCounter = 0;
}

/** Get count of registered paste handlers */
export function getPasteHandlerCount(): number {
  return getHookRuntimeState().pasteHandlers.length;
}
