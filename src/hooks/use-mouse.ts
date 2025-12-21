/**
 * useMouse - Handle mouse input events
 *
 * Supports SGR mouse protocol with X10 fallback for legacy terminals.
 * Works with xterm, iTerm2, Windows Terminal, Kitty, and most modern terminals.
 */

import {
  addInputHandler,
  removeInputHandler,
  getHookState,
  getCurrentHookIndex,
  setHookState,
  getHookStateByIndex,
} from './context.js';
import type { InputHandler } from './types.js';

// =============================================================================
// Types
// =============================================================================

export type MouseButton = 'left' | 'right' | 'middle' | 'scroll-up' | 'scroll-down' | 'none';
export type MouseAction = 'click' | 'double-click' | 'drag' | 'release' | 'move';

export interface MouseEvent {
  /** Column position (0-indexed) */
  x: number;
  /** Row position (0-indexed) */
  y: number;
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

/** Enable SGR extended mouse mode (most modern terminals) */
const SGR_MOUSE_ENABLE = '\x1b[?1000h\x1b[?1002h\x1b[?1006h';

/** Disable SGR extended mouse mode */
const SGR_MOUSE_DISABLE = '\x1b[?1000l\x1b[?1002l\x1b[?1006l';

/** Enable basic X10 mouse mode (legacy fallback) */
const X10_MOUSE_ENABLE = '\x1b[?1000h';

/** Disable basic X10 mouse mode */
const X10_MOUSE_DISABLE = '\x1b[?1000l';

// Track if mouse is globally enabled to avoid multiple enable/disable
let mouseTrackingEnabled = false;
let mouseTrackingRefCount = 0;

// =============================================================================
// Mouse Event Parsing
// =============================================================================

/**
 * SGR mouse event format: \x1b[<button;x;yM (press) or \x1b[<button;x;ym (release)
 * Button encoding:
 *   0 = left, 1 = middle, 2 = right
 *   +4 = shift, +8 = meta/alt, +16 = ctrl
 *   +32 = motion (drag)
 *   64 = scroll up, 65 = scroll down
 */
const SGR_MOUSE_RE = /^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/;

/**
 * X10 mouse event format: \x1b[M<button><x><y>
 * Coordinates are encoded as character codes starting at 33 (!)
 */
const X10_MOUSE_RE = /^\x1b\[M([\x00-\xff])([\x00-\xff])([\x00-\xff])$/;

/**
 * Parse SGR mouse event
 */
function parseSGRMouse(match: RegExpMatchArray): MouseEvent | null {
  const buttonCode = parseInt(match[1]!, 10);
  const x = parseInt(match[2]!, 10) - 1; // Convert to 0-indexed
  const y = parseInt(match[3]!, 10) - 1;
  const isRelease = match[4] === 'm';

  // Decode modifiers
  const modifiers = {
    shift: !!(buttonCode & 4),
    alt: !!(buttonCode & 8),
    ctrl: !!(buttonCode & 16),
  };

  // Decode button (lower 2 bits, but also check for scroll)
  const baseButton = buttonCode & 3;
  const isMotion = !!(buttonCode & 32);
  const isScroll = buttonCode >= 64 && buttonCode <= 67;

  let button: MouseButton;
  let action: MouseAction;

  if (isScroll) {
    button = (buttonCode & 1) ? 'scroll-down' : 'scroll-up';
    action = 'click';
  } else {
    switch (baseButton) {
      case 0: button = 'left'; break;
      case 1: button = 'middle'; break;
      case 2: button = 'right'; break;
      default: button = 'none'; break;
    }

    if (isRelease) {
      action = 'release';
    } else if (isMotion) {
      action = 'drag';
    } else {
      action = 'click';
    }
  }

  return { x, y, button, action, modifiers };
}

/**
 * Parse X10 mouse event (legacy format)
 */
function parseX10Mouse(match: RegExpMatchArray): MouseEvent | null {
  const buttonByte = match[1]!.charCodeAt(0);
  const x = match[2]!.charCodeAt(0) - 33; // 33 = '!'
  const y = match[3]!.charCodeAt(0) - 33;

  // Decode modifiers
  const modifiers = {
    shift: !!(buttonByte & 4),
    alt: !!(buttonByte & 8),
    ctrl: !!(buttonByte & 16),
  };

  // Decode button
  const baseButton = buttonByte & 3;
  const isMotion = !!(buttonByte & 32);
  const isRelease = baseButton === 3;

  let button: MouseButton;
  let action: MouseAction;

  if (isRelease) {
    button = 'none';
    action = 'release';
  } else {
    switch (baseButton) {
      case 0: button = 'left'; break;
      case 1: button = 'middle'; break;
      case 2: button = 'right'; break;
      default: button = 'none'; break;
    }
    action = isMotion ? 'drag' : 'click';
  }

  return { x, y, button, action, modifiers };
}

/**
 * Parse raw input and extract mouse event if present
 */
export function parseMouseEvent(data: string): MouseEvent | null {
  // Try SGR format first (more precise)
  const sgrMatch = SGR_MOUSE_RE.exec(data);
  if (sgrMatch) {
    return parseSGRMouse(sgrMatch);
  }

  // Fall back to X10 format
  const x10Match = X10_MOUSE_RE.exec(data);
  if (x10Match) {
    return parseX10Mouse(x10Match);
  }

  return null;
}

/**
 * Check if a string contains a mouse event sequence
 */
export function isMouseEvent(data: string): boolean {
  return SGR_MOUSE_RE.test(data) || X10_MOUSE_RE.test(data);
}

// =============================================================================
// Mouse Tracking Control
// =============================================================================

/**
 * Enable mouse tracking in the terminal
 */
export function enableMouseTracking(): void {
  mouseTrackingRefCount++;
  if (!mouseTrackingEnabled) {
    mouseTrackingEnabled = true;
    process.stdout.write(SGR_MOUSE_ENABLE);
  }
}

/**
 * Disable mouse tracking in the terminal
 */
export function disableMouseTracking(): void {
  mouseTrackingRefCount = Math.max(0, mouseTrackingRefCount - 1);
  if (mouseTrackingRefCount === 0 && mouseTrackingEnabled) {
    mouseTrackingEnabled = false;
    process.stdout.write(SGR_MOUSE_DISABLE);
  }
}

/**
 * Force disable mouse tracking (cleanup)
 */
export function forceDisableMouseTracking(): void {
  mouseTrackingRefCount = 0;
  if (mouseTrackingEnabled) {
    mouseTrackingEnabled = false;
    process.stdout.write(SGR_MOUSE_DISABLE);
  }
}

/**
 * Check if mouse tracking is currently enabled
 */
export function isMouseTrackingEnabled(): boolean {
  return mouseTrackingEnabled;
}

// =============================================================================
// Double-click Detection
// =============================================================================

interface ClickState {
  lastClick: { x: number; y: number; time: number; button: MouseButton } | null;
}

const clickState: ClickState = { lastClick: null };
const DOUBLE_CLICK_THRESHOLD = 300; // ms
const DOUBLE_CLICK_DISTANCE = 2; // pixels

/**
 * Detect double-click by comparing with last click
 */
function detectDoubleClick(event: MouseEvent): MouseEvent {
  if (event.action !== 'click') {
    return event;
  }

  const now = Date.now();
  const last = clickState.lastClick;

  if (
    last &&
    last.button === event.button &&
    now - last.time < DOUBLE_CLICK_THRESHOLD &&
    Math.abs(event.x - last.x) <= DOUBLE_CLICK_DISTANCE &&
    Math.abs(event.y - last.y) <= DOUBLE_CLICK_DISTANCE
  ) {
    // Double-click detected
    clickState.lastClick = null;
    return { ...event, action: 'double-click' };
  }

  // Store this click for potential double-click
  clickState.lastClick = {
    x: event.x,
    y: event.y,
    time: now,
    button: event.button,
  };

  return event;
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
    inputWrapper: InputHandler;
    registered: boolean;
    trackingEnabled: boolean;
  } | null>(null);

  if (isNew || hookData === null) {
    // First render - create wrapper and register
    const inputWrapper: InputHandler = (input, _key) => {
      // Check if this is a mouse event
      const mouseEvent = parseMouseEvent(input);
      if (mouseEvent) {
        const data = getStoredHookData();
        if (data && data.registered) {
          // Detect double-clicks
          const processedEvent = detectDoubleClick(mouseEvent);
          data.handler(processedEvent);
        }
      }
    };

    const data = {
      handler,
      inputWrapper,
      registered: isActive,
      trackingEnabled: false,
    };

    // Store the data
    const hookIndex = getCurrentHookIndex();
    setHookState(hookIndex, data);

    // Helper to get stored data (closure over hookIndex)
    function getStoredHookData() {
      return getHookStateByIndex(hookIndex) as typeof data | null;
    }

    if (isActive) {
      addInputHandler(inputWrapper);
    }

    if (enableTracking && isActive) {
      enableMouseTracking();
      data.trackingEnabled = true;
    }
  } else {
    // Subsequent render - update handler reference and active state
    const prevRegistered = hookData.registered;
    const prevTrackingEnabled = hookData.trackingEnabled;

    hookData.handler = handler; // Update to latest handler
    hookData.registered = isActive;

    // Handle activation/deactivation
    if (isActive && !prevRegistered) {
      addInputHandler(hookData.inputWrapper);
    } else if (!isActive && prevRegistered) {
      removeInputHandler(hookData.inputWrapper);
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
// Cleanup on process exit
// =============================================================================

// Ensure mouse tracking is disabled when the process exits
process.on('exit', () => {
  forceDisableMouseTracking();
});

process.on('SIGINT', () => {
  forceDisableMouseTracking();
  process.exit(0);
});

process.on('SIGTERM', () => {
  forceDisableMouseTracking();
  process.exit(0);
});
