/**
 * Internal hooks context - Runtime-scoped mutable state
 *
 * Every rendered app owns a RuntimeScope. Standalone hook utilities use the
 * explicit default scope supplied by runtime-scope.ts.
 */

import type {
  AppContext,
  FocusManager,
} from './types.js';
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

type ComponentKey = string | number;

const HOOK_SLOT_TOKEN = Symbol('tuiuiu.hook-slot-token');

/** Opaque owner/scope reference captured by hook callbacks. */
export interface HookSlotToken {
  readonly [HOOK_SLOT_TOKEN]: true;
  readonly scope: RuntimeScope;
  readonly id: number;
}

type HookSlotReference = HookSlotToken | number;

interface HookSlotRef {
  owner: ComponentOwner;
  index: number;
}

interface ComponentOwner {
  name: string;
  parent: ComponentOwner | null;
  definition: object | null;
  identity: string;
  state: any[];
  slotIds: number[];
  hookIndex: number;
  lastMaxHookIndex: number;
  hookCleanups: Map<number, Set<() => void>>;
  children: Map<object, Map<string, ComponentOwner>>;
  unkeyedCounts: Map<object, number>;
  lastRenderedGeneration: number;
  disposed: boolean;
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
  rootOwner: ComponentOwner;
  currentOwner: ComponentOwner | null;
  slotRefs: Map<number, HookSlotRef>;
  nextSlotId: number;
  lastHookSlotToken: HookSlotToken | null;
  renderGeneration: number;
  isRendering: boolean;
  renderPhaseMode: 'hooks' | 'component';
  mouseHandlers: MouseHandlerEntry[];
  mouseHandlerIdCounter: number;
  lastMouseClick: {
    x: number;
    y: number;
    time: number;
    button: MouseEventType['button'];
  } | null;
}

const HOOK_RUNTIME_STATE = Symbol('tuiuiu.hook-runtime-state');
const appRuntimeScopes = new WeakMap<AppContext, RuntimeScope>();

function createComponentOwner(
  name: string,
  parent: ComponentOwner | null,
  definition: object | null,
  identity: string,
): ComponentOwner {
  return {
    name,
    parent,
    definition,
    identity,
    state: [],
    slotIds: [],
    hookIndex: 0,
    lastMaxHookIndex: 0,
    hookCleanups: new Map(),
    children: new Map(),
    unkeyedCounts: new Map(),
    lastRenderedGeneration: 0,
    disposed: false,
  };
}

function createHookRuntimeState(): HookRuntimeState {
  const rootOwner = createComponentOwner('Root', null, null, 'root');
  return {
    appContext: null,
    focusManager: null,
    rootOwner,
    currentOwner: null,
    slotRefs: new Map(),
    nextSlotId: 0,
    lastHookSlotToken: null,
    renderGeneration: 0,
    isRendering: false,
    renderPhaseMode: 'hooks',
    mouseHandlers: [],
    mouseHandlerIdCounter: 0,
    lastMouseClick: null,
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
  runtime.renderGeneration++;
  runtime.rootOwner.hookIndex = 0;
  runtime.rootOwner.unkeyedCounts.clear();
  runtime.rootOwner.lastRenderedGeneration = runtime.renderGeneration;
  runtime.currentOwner = runtime.rootOwner;
  runtime.lastHookSlotToken = null;
  runtime.isRendering = true;
  runtime.renderPhaseMode = mode;
}

function formatOwner(owner: ComponentOwner): string {
  return owner.parent ? `${formatOwner(owner.parent)} > ${owner.name}` : owner.name;
}

function runHookCleanups(
  slotId: number,
  owner: ComponentOwner,
): void {
  const cleanups = owner.hookCleanups.get(slotId);
  if (!cleanups) return;
  owner.hookCleanups.delete(slotId);
  for (const cleanup of [...cleanups].reverse()) {
    try {
      cleanup();
    } catch (error) {
      console.error('[tuiuiu] Error during hook cleanup:', error);
    }
  }
}

function releaseSlot(runtime: HookRuntimeState, owner: ComponentOwner, index: number): void {
  const slotId = owner.slotIds[index];
  if (slotId === undefined) return;
  runHookCleanups(slotId, owner);
  runtime.slotRefs.delete(slotId);
}

function finalizeOwnerHooks(runtime: HookRuntimeState, owner: ComponentOwner): void {
  const currentMaxIndex = owner.hookIndex;
  if (owner.lastMaxHookIndex > 0 && currentMaxIndex !== owner.lastMaxHookIndex) {
    hookWarnOnce(
      `hook-count-changed:${formatOwner(owner)}`,
      `Hook count changed in ${formatOwner(owner)} (${owner.lastMaxHookIndex} → ${currentMaxIndex}). ` +
      'Hooks must be called unconditionally inside that component.',
    );
  }

  if (currentMaxIndex < owner.lastMaxHookIndex) {
    for (let index = owner.lastMaxHookIndex - 1; index >= currentMaxIndex; index--) {
      releaseSlot(runtime, owner, index);
    }
  }

  owner.state.length = currentMaxIndex;
  owner.slotIds.length = currentMaxIndex;
  owner.lastMaxHookIndex = currentMaxIndex;
}

function disposeOwner(runtime: HookRuntimeState, owner: ComponentOwner): void {
  if (owner.disposed) return;
  owner.disposed = true;
  for (const byIdentity of owner.children.values()) {
    for (const child of byIdentity.values()) disposeOwner(runtime, child);
  }
  owner.children.clear();
  for (let index = owner.slotIds.length - 1; index >= 0; index--) {
    releaseSlot(runtime, owner, index);
  }
  owner.state = [];
  owner.slotIds = [];
  owner.lastMaxHookIndex = 0;
}

function pruneUnvisitedOwners(runtime: HookRuntimeState, owner: ComponentOwner): void {
  for (const [definition, byIdentity] of owner.children) {
    for (const [identity, child] of byIdentity) {
      if (child.lastRenderedGeneration !== runtime.renderGeneration) {
        disposeOwner(runtime, child);
        byIdentity.delete(identity);
      } else {
        pruneUnvisitedOwners(runtime, child);
      }
    }
    if (byIdentity.size === 0) owner.children.delete(definition);
  }
}

/** Call after rendering component */
export function endRender(): void {
  const runtime = getHookRuntimeState();
  if (!runtime.isRendering) return;
  finalizeOwnerHooks(runtime, runtime.rootOwner);
  pruneUnvisitedOwners(runtime, runtime.rootOwner);
  runtime.currentOwner = null;
  runtime.isRendering = false;
  runtime.renderPhaseMode = 'hooks';
}

/** Abort a failed root evaluation without pruning or truncating the last committed owner tree. */
export function abortRender(): void {
  const runtime = getHookRuntimeState();
  runtime.currentOwner = null;
  runtime.isRendering = false;
  runtime.renderPhaseMode = 'hooks';
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
  const scope = getRuntimeScope();
  // Warn if hook called outside render context
  if (!runtime.isRendering) {
    hookWarnOnce(
      'hook-outside-render',
      'A hook (useState, useMemo, useComputed, etc.) was called outside a component render. ' +
      'Hooks must be called inside a component function, not at module scope or in event handlers. ' +
      'Move the hook call inside your component function.',
    );
  }

  const owner = runtime.currentOwner ?? runtime.rootOwner;
  const index = owner.hookIndex++;

  if (index >= owner.state.length) {
    const slotId = runtime.nextSlotId++;
    owner.state.push(initialValue);
    owner.slotIds.push(slotId);
    runtime.slotRefs.set(slotId, { owner, index });
    runtime.lastHookSlotToken = { [HOOK_SLOT_TOKEN]: true, scope, id: slotId };
    return { value: initialValue, isNew: true };
  }

  const slotId = owner.slotIds[index]!;
  runtime.lastHookSlotToken = { [HOOK_SLOT_TOKEN]: true, scope, id: slotId };
  return { value: owner.state[index], isNew: false };
}

/** Update hook state at a specific index */
function resolveHookSlot(reference: HookSlotReference): {
  runtime: HookRuntimeState;
  ref: HookSlotRef | undefined;
  id: number;
} {
  const runtime = typeof reference === 'number'
    ? getHookRuntimeState()
    : getHookRuntimeState(reference.scope);
  const id = typeof reference === 'number' ? reference : reference.id;
  return { runtime, ref: runtime.slotRefs.get(id), id };
}

export function setHookState(index: HookSlotReference, value: any): void {
  const { ref } = resolveHookSlot(index);
  if (ref && !ref.owner.disposed) ref.owner.state[ref.index] = value;
}

/** Get hook state by index (for closures that need to access state later) */
export function getHookStateByIndex(index: HookSlotReference): any {
  const { ref } = resolveHookSlot(index);
  return ref && !ref.owner.disposed ? ref.owner.state[ref.index] : undefined;
}

/** Get hook index (for setState to know which index to update) */
export function getCurrentHookIndex(): HookSlotToken {
  const token = getHookRuntimeState().lastHookSlotToken;
  if (!token) throw new Error('[tuiuiu] No hook slot is active');
  return token;
}

/**
 * Register cleanup associated with a hook slot.
 *
 * Cleanups run when the slot becomes orphaned and on root unmount.
 */
export function registerHookCleanup(
  cleanup: () => void,
  index: HookSlotReference = getCurrentHookIndex(),
): () => void {
  const { ref, id } = resolveHookSlot(index);
  if (!ref || ref.owner.disposed) return () => {};
  let cleanups = ref.owner.hookCleanups.get(id);
  if (!cleanups) {
    cleanups = new Set();
    ref.owner.hookCleanups.set(id, cleanups);
  }
  cleanups.add(cleanup);
  return () => {
    cleanups?.delete(cleanup);
    if (cleanups?.size === 0) ref.owner.hookCleanups.delete(id);
  };
}

/** Execute one explicit stateful component inside its keyed owner. */
export function renderOwnedComponent<T>(
  definition: object,
  name: string,
  key: ComponentKey | undefined,
  render: () => T,
): T {
  const runtime = getHookRuntimeState();
  const parent = runtime.currentOwner;
  if (!runtime.isRendering || !parent) {
    throw new Error(
      `[tuiuiu] ${name} is stateful and must be evaluated inside render(() => ...).`,
    );
  }

  let identity: string;
  if (key === undefined) {
    const ordinal = parent.unkeyedCounts.get(definition) ?? 0;
    if (ordinal > 0 && process.env.NODE_ENV !== 'production') {
      throw new Error(
        `[tuiuiu] Multiple unkeyed ${name} components share the same owner. ` +
        'Pass a stable `key` to every repeated stateful component.',
      );
    }
    parent.unkeyedCounts.set(definition, ordinal + 1);
    identity = `unkeyed:${ordinal}`;
  } else {
    identity = `key:${typeof key}:${String(key)}`;
  }

  let byIdentity = parent.children.get(definition);
  if (!byIdentity) {
    byIdentity = new Map();
    parent.children.set(definition, byIdentity);
  }
  let owner = byIdentity.get(identity);
  const wasNew = !owner;
  if (!owner) {
    owner = createComponentOwner(name, parent, definition, identity);
    byIdentity.set(identity, owner);
  } else if (owner.lastRenderedGeneration === runtime.renderGeneration) {
    throw new Error(`[tuiuiu] Duplicate ${name} component key: ${String(key)}`);
  }

  owner.disposed = false;
  const previousGeneration = owner.lastRenderedGeneration;
  const previousState = owner.state.slice();
  const previousSlotIds = owner.slotIds.slice();
  const previousLastMaxHookIndex = owner.lastMaxHookIndex;
  owner.lastRenderedGeneration = runtime.renderGeneration;
  owner.hookIndex = 0;
  owner.unkeyedCounts.clear();
  runtime.currentOwner = owner;
  try {
    const result = render();
    finalizeOwnerHooks(runtime, owner);
    return result;
  } catch (error) {
    for (let index = owner.slotIds.length - 1; index >= previousSlotIds.length; index--) {
      releaseSlot(runtime, owner, index);
    }
    owner.state = previousState;
    owner.slotIds = previousSlotIds;
    owner.lastMaxHookIndex = previousLastMaxHookIndex;
    owner.lastRenderedGeneration = previousGeneration;
    if (wasNew) byIdentity.delete(identity);
    if (byIdentity.size === 0) parent.children.delete(definition);
    throw error;
  } finally {
    runtime.currentOwner = parent;
  }
}

/** Reset all hook state (on unmount) */
export function resetHookState(scope?: RuntimeScope): void {
  const resolvedScope = getRuntimeScope(scope);
  const runtime = getHookRuntimeState(resolvedScope);
  runInRuntimeScope(resolvedScope, () => {
    disposeOwner(runtime, runtime.rootOwner);
  });
  runtime.rootOwner = createComponentOwner('Root', null, null, 'root');
  runtime.currentOwner = null;
  runtime.slotRefs.clear();
  runtime.nextSlotId = 0;
  runtime.lastHookSlotToken = null;
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
