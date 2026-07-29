/**
 * useMouse - Handle mouse input events
 *
 * Supports SGR mouse protocol with X10 fallback for legacy terminals.
 * Works with xterm, iTerm2, Windows Terminal, Kitty, and most modern terminals.
 */

import {
  addMouseHandler,
  removeMouseHandlerById,
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
  getAppContext,
  registerHookCleanup,
  resetMouseClickState,
} from './context.js';
import { onTerminalPanic } from '../core/terminal-panic.js';
import {
  bindRuntimeScope,
  getRuntimeResource,
  getRuntimeScope,
  type RuntimeScope,
} from '../core/runtime-scope.js';
import {
  parseMouseProtocol,
  startsWithMouseProtocol,
  type MouseProtocolAction,
  type MouseProtocolButton,
  type MouseProtocolEvent,
  type MouseProtocolResult,
} from '../core/mouse-protocol.js';

// =============================================================================
// Types
// =============================================================================

export type MouseButton = MouseProtocolButton;
export type MouseAction = MouseProtocolAction | 'double-click';
export type MouseEvent = Omit<MouseProtocolEvent, 'action'> & {
  action: MouseAction;
};

export type MouseHandler = (event: MouseEvent) => void;

export interface MouseOptions {
  /** Only handle events when active (default: true) */
  isActive?: boolean;
  /** Enable mouse tracking globally when this hook mounts */
  enableTracking?: boolean;
}

// =============================================================================
// Mouse Protocol Constants
// =============================================================================

/** Enable SGR extended mouse mode with click and button-drag tracking. */
const SGR_MOUSE_ENABLE = '\x1b[?1000h\x1b[?1002h\x1b[?1006h';

/** Disable SGR extended mouse mode */
const SGR_MOUSE_DISABLE = '\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?1006l';

interface MouseRuntimeState {
  trackingEnabled: boolean;
  trackingRefCount: number;
  outputStream: NodeJS.WriteStream | null;
  panicRegistered: boolean;
  unregisterPanic: (() => void) | null;
}

const MOUSE_RUNTIME_STATE = Symbol('tuiuiu.mouse-runtime-state');

function getMouseRuntimeState(scope?: RuntimeScope): MouseRuntimeState {
  return getRuntimeResource(
    MOUSE_RUNTIME_STATE,
    () => ({
      trackingEnabled: false,
      trackingRefCount: 0,
      outputStream: null,
      panicRegistered: false,
      unregisterPanic: null,
    }),
    scope,
  );
}

function getMouseOutputStream(scope?: RuntimeScope): NodeJS.WriteStream {
  const appContext = getAppContext(scope);
  return (appContext?.stdout ?? process.stdout) as NodeJS.WriteStream;
}

function isTTYStream(stream: NodeJS.WriteStream): boolean {
  return 'isTTY' in stream && !!(stream as any).isTTY;
}

export type MouseEventResult = MouseProtocolResult;

/**
 * Parse raw input and extract mouse event if present
 */
export function parseMouseEvent(data: string): MouseEventResult | null {
  return parseMouseProtocol(data);
}

/**
 * Check if a string contains a mouse event sequence
 */
export function isMouseEvent(data: string): boolean {
  return startsWithMouseProtocol(data);
}

// =============================================================================
// Mouse Tracking Control
// =============================================================================

/**
 * Enable mouse tracking in the terminal
 */
export function enableMouseTracking(scope?: RuntimeScope): void {
  const resolvedScope = getRuntimeScope(scope);
  const state = getMouseRuntimeState(resolvedScope);
  state.trackingRefCount++;
  if (!state.trackingEnabled) {
    state.trackingEnabled = true;
    registerMousePanicCleanup(resolvedScope);
    const stream = getMouseOutputStream(resolvedScope);
    state.outputStream = stream;
    if (isTTYStream(stream)) {
      stream.write(SGR_MOUSE_ENABLE);
    }
  }
}

/**
 * Disable mouse tracking in the terminal
 */
export function disableMouseTracking(scope?: RuntimeScope): void {
  const resolvedScope = getRuntimeScope(scope);
  const state = getMouseRuntimeState(resolvedScope);
  state.trackingRefCount = Math.max(0, state.trackingRefCount - 1);
  if (state.trackingRefCount === 0 && state.trackingEnabled) {
    state.trackingEnabled = false;
    const stream = state.outputStream ?? getMouseOutputStream(resolvedScope);
    if (isTTYStream(stream)) {
      stream.write(SGR_MOUSE_DISABLE);
    }
    state.outputStream = null;
  }
}

/**
 * Force disable mouse tracking (cleanup)
 */
export function forceDisableMouseTracking(scope?: RuntimeScope): void {
  const resolvedScope = getRuntimeScope(scope);
  const state = getMouseRuntimeState(resolvedScope);
  state.trackingRefCount = 0;
  if (state.trackingEnabled) {
    state.trackingEnabled = false;
    const stream = state.outputStream ?? getMouseOutputStream(resolvedScope);
    if (isTTYStream(stream)) {
      stream.write(SGR_MOUSE_DISABLE);
    }
    state.outputStream = null;
  }
}

/**
 * Check if mouse tracking is currently enabled
 */
export function isMouseTrackingEnabled(scope?: RuntimeScope): boolean {
  return getMouseRuntimeState(scope).trackingEnabled;
}

// =============================================================================
// useMouse Hook
// =============================================================================

/**
 * useMouse - Handle mouse input events
 *
 * @example
 * useMouse((event) => {
 *   if (event.action === 'click' && event.button === 'left') {
 *     handleClick(event.x, event.y);
 *   }
 * });
 *
 * @example
 * // With options
 * useMouse(
 *   (event) => {
 *     if (event.action === 'drag') {
 *       handleDrag(event.x, event.y);
 *     }
 *   },
 *   { isActive: isDragging, enableTracking: true }
 * );
 */
export function useMouse(handler: MouseHandler, options: MouseOptions = {}): void {
  const { isActive = true, enableTracking = true } = options;

  // Get or create hook state for this useMouse call
  const { value: hookData, isNew } = getHookState<{
    handler: MouseHandler;
    handlerId: number | null;
    registered: boolean;
    trackingEnabled: boolean;
  } | null>(null);

  if (isNew || hookData === null) {
    // First render - create wrapper and register
    const hookIndex = getCurrentHookIndex();

    const mouseWrapper = (event: MouseEvent) => {
      const data = getHookStateByIndex(hookIndex) as typeof hookData;
      if (data && data.registered) {
        data.handler(event);
      }
    };

    const data = {
      handler,
      handlerId: isActive ? addMouseHandler(mouseWrapper) : null,
      registered: isActive,
      trackingEnabled: false,
    };

    // Store the data
    setHookState(hookIndex, data);

    if (enableTracking && isActive) {
      enableMouseTracking();
      data.trackingEnabled = true;
    }
    registerHookCleanup(() => {
      if (data.handlerId !== null) {
        removeMouseHandlerById(data.handlerId);
        data.handlerId = null;
      }
      if (data.trackingEnabled) {
        disableMouseTracking();
        data.trackingEnabled = false;
      }
      data.registered = false;
    }, hookIndex);
  } else {
    // Subsequent render - update handler reference and active state
    const prevRegistered = hookData.registered;
    const prevTrackingEnabled = hookData.trackingEnabled;

    hookData.handler = handler; // Update to latest handler
    hookData.registered = isActive;

    // Handle activation/deactivation
    if (isActive && !prevRegistered) {
      // Re-register - need to create new wrapper
      const hookIndex = getCurrentHookIndex();
      const mouseWrapper = (event: MouseEvent) => {
        const data = getHookStateByIndex(hookIndex) as typeof hookData;
        if (data && data.registered) {
          data.handler(event);
        }
      };
      hookData.handlerId = addMouseHandler(mouseWrapper);
    } else if (!isActive && prevRegistered) {
      if (hookData.handlerId !== null) {
        removeMouseHandlerById(hookData.handlerId);
        hookData.handlerId = null;
      }
    }

    // Handle mouse tracking
    const shouldTrack = enableTracking && isActive;
    if (shouldTrack && !prevTrackingEnabled) {
      enableMouseTracking();
      hookData.trackingEnabled = true;
    } else if (!shouldTrack && prevTrackingEnabled) {
      disableMouseTracking();
      hookData.trackingEnabled = false;
    }
  }
}

// =============================================================================
// Cleanup on process exit (via centralized terminal-panic)
// =============================================================================

/**
 * Register mouse cleanup with centralized panic handler.
 * Called when mouse tracking is first enabled.
 */
function registerMousePanicCleanup(scope: RuntimeScope): void {
  const state = getMouseRuntimeState(scope);
  if (state.panicRegistered) return;
  state.panicRegistered = true;
  state.unregisterPanic = onTerminalPanic(
    bindRuntimeScope(scope, () => forceDisableMouseTracking(scope)),
  );
}

/**
 * Remove mouse exit handlers (useful for tests)
 */
export function removeMouseExitHandlers(scope?: RuntimeScope): void {
  const state = getMouseRuntimeState(scope);
  if (state.unregisterPanic) {
    state.unregisterPanic();
    state.unregisterPanic = null;
  }
  state.panicRegistered = false;
}

/**
 * Reset mouse module state (for testing purposes only).
 */
export function resetMouseState(scope?: RuntimeScope): void {
  forceDisableMouseTracking(scope);
  resetMouseClickState(scope);
}
