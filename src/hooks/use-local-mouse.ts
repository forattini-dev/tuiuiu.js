/**
 * useLocalMouse - Component-relative mouse coordinates
 *
 * Transforms terminal-absolute mouse coordinates into component-relative
 * coordinates based on provided bounds.
 *
 * @example
 * // Basic usage with static bounds
 * useLocalMouse(
 *   { x: 10, y: 5, width: 80, height: 24 },
 *   (event) => {
 *     // event.x and event.y are relative to the bounds
 *     console.log(`Local: (${event.x}, ${event.y})`);
 *     console.log(`Global: (${event.globalX}, ${event.globalY})`);
 *     console.log(`Inside: ${event.isInside}`);
 *   }
 * );
 *
 * @example
 * // With reactive bounds (signal/getter)
 * const [bounds, setBounds] = createSignal({ x: 0, y: 0, width: 40, height: 20 });
 * useLocalMouse(bounds, handleClick, { onlyInside: true });
 *
 * @example
 * // Filter to only inside events
 * useLocalMouse(bounds, handleClick, { onlyInside: true });
 */

import {
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
  addMouseHandler,
  removeMouseHandlerById,
} from './context.js';
import {
  enableMouseTracking,
  disableMouseTracking,
  type MouseEvent as BaseMouseEvent,
  type MouseButton,
  type MouseAction,
} from './use-mouse.js';

// =============================================================================
// Types
// =============================================================================

export interface Bounds {
  /** X position of the bounds (left edge) */
  x: number;
  /** Y position of the bounds (top edge) */
  y: number;
  /** Width of the bounds */
  width: number;
  /** Height of the bounds */
  height: number;
}

export type BoundsOrGetter = Bounds | (() => Bounds);

export interface LocalMouseEvent {
  /** X coordinate relative to bounds (can be negative if outside) */
  x: number;
  /** Y coordinate relative to bounds (can be negative if outside) */
  y: number;
  /** Original terminal X coordinate */
  globalX: number;
  /** Original terminal Y coordinate */
  globalY: number;
  /** Whether the event is inside the bounds */
  isInside: boolean;
  /** Which button was pressed/released */
  button: MouseButton;
  /** Type of mouse action */
  action: MouseAction;
  /** Modifier keys held during the event */
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
}

export type LocalMouseHandler = (event: LocalMouseEvent) => void;

export interface UseLocalMouseOptions {
  /** Only invoke callback when event is inside bounds (default: false) */
  onlyInside?: boolean;
  /** Only handle events when active (default: true) */
  isActive?: boolean;
  /** Enable mouse tracking globally when this hook mounts (default: true) */
  enableTracking?: boolean;
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Resolve bounds from either static object or getter function
 */
function resolveBounds(boundsOrGetter: BoundsOrGetter): Bounds {
  if (typeof boundsOrGetter === 'function') {
    return boundsOrGetter();
  }
  return boundsOrGetter;
}

/**
 * Check if a point is inside the bounds
 */
function isPointInside(x: number, y: number, bounds: Bounds): boolean {
  return (
    x >= bounds.x &&
    x < bounds.x + bounds.width &&
    y >= bounds.y &&
    y < bounds.y + bounds.height
  );
}

/**
 * Transform a base mouse event into a local mouse event
 */
function transformToLocalEvent(
  baseEvent: BaseMouseEvent,
  bounds: Bounds
): LocalMouseEvent {
  const localX = baseEvent.x - bounds.x;
  const localY = baseEvent.y - bounds.y;
  const isInside = isPointInside(baseEvent.x, baseEvent.y, bounds);

  return {
    x: localX,
    y: localY,
    globalX: baseEvent.x,
    globalY: baseEvent.y,
    isInside,
    button: baseEvent.button,
    action: baseEvent.action,
    modifiers: baseEvent.modifiers,
  };
}

// =============================================================================
// Hook State Interface
// =============================================================================

interface LocalMouseHookData {
  boundsOrGetter: BoundsOrGetter;
  handler: LocalMouseHandler;
  options: UseLocalMouseOptions;
  handlerId: number | null;
  registered: boolean;
  trackingEnabled: boolean;
}

// =============================================================================
// useLocalMouse Hook
// =============================================================================

/**
 * useLocalMouse - Handle mouse events with component-relative coordinates
 *
 * @param boundsOrGetter - Static bounds object or getter function for reactive bounds
 * @param handler - Callback that receives local mouse events
 * @param options - Configuration options
 */
export function useLocalMouse(
  boundsOrGetter: BoundsOrGetter,
  handler: LocalMouseHandler,
  options: UseLocalMouseOptions = {}
): void {
  const {
    onlyInside = false,
    isActive = true,
    enableTracking: enableTrackingOpt = true,
  } = options;

  const { value: hookData, isNew } = getHookState<LocalMouseHookData | null>(null);

  if (isNew || hookData === null) {
    // First render - create wrapper and register
    const hookIndex = getCurrentHookIndex();

    // Mouse handler wrapper that transforms coordinates
    const mouseWrapper = (event: BaseMouseEvent) => {
      const data = getHookStateByIndex(hookIndex) as LocalMouseHookData | null;
      if (!data || !data.registered) return;

      // Resolve current bounds (supports reactive updates)
      const currentBounds = resolveBounds(data.boundsOrGetter);

      // Transform to local coordinates
      const localEvent = transformToLocalEvent(event, currentBounds);

      // Filter based on onlyInside option
      if (data.options.onlyInside && !localEvent.isInside) {
        return;
      }

      // Call the handler with transformed event
      data.handler(localEvent);
    };

    const data: LocalMouseHookData = {
      boundsOrGetter,
      handler,
      options: { onlyInside, isActive, enableTracking: enableTrackingOpt },
      handlerId: isActive ? addMouseHandler(mouseWrapper) : null,
      registered: isActive,
      trackingEnabled: false,
    };

    setHookState(hookIndex, data);

    if (enableTrackingOpt && isActive) {
      enableMouseTracking();
      data.trackingEnabled = true;
    }
  } else {
    // Subsequent render - update references
    const prevRegistered = hookData.registered;
    const prevTrackingEnabled = hookData.trackingEnabled;

    // Update to latest values
    hookData.boundsOrGetter = boundsOrGetter;
    hookData.handler = handler;
    hookData.options = { onlyInside, isActive, enableTracking: enableTrackingOpt };
    hookData.registered = isActive;

    // Handle activation/deactivation
    if (isActive && !prevRegistered) {
      // Re-register with new wrapper
      const hookIndex = getCurrentHookIndex();
      const mouseWrapper = (event: BaseMouseEvent) => {
        const data = getHookStateByIndex(hookIndex) as LocalMouseHookData | null;
        if (!data || !data.registered) return;

        const currentBounds = resolveBounds(data.boundsOrGetter);
        const localEvent = transformToLocalEvent(event, currentBounds);

        if (data.options.onlyInside && !localEvent.isInside) {
          return;
        }

        data.handler(localEvent);
      };
      hookData.handlerId = addMouseHandler(mouseWrapper);
    } else if (!isActive && prevRegistered) {
      if (hookData.handlerId !== null) {
        removeMouseHandlerById(hookData.handlerId);
        hookData.handlerId = null;
      }
    }

    // Handle mouse tracking
    const shouldTrack = enableTrackingOpt && isActive;
    if (shouldTrack && !prevTrackingEnabled) {
      enableMouseTracking();
      hookData.trackingEnabled = true;
    } else if (!shouldTrack && prevTrackingEnabled) {
      disableMouseTracking();
      hookData.trackingEnabled = false;
    }
  }
}

/**
 * Cleanup function to be called on unmount
 */
export function cleanupLocalMouse(hookData: LocalMouseHookData): void {
  if (hookData.handlerId !== null) {
    removeMouseHandlerById(hookData.handlerId);
    hookData.handlerId = null;
  }
  if (hookData.trackingEnabled) {
    disableMouseTracking();
    hookData.trackingEnabled = false;
  }
  hookData.registered = false;
}
