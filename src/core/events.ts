/**
 * Advanced Event System
 *
 * Features:
 * - DOM-like event bubbling and capturing
 * - Event delegation support
 * - Async event handling
 * - Event pooling for performance
 * - TypeScript-first with full type safety
 *
 * Inspired by: Blessed (event bubbling), Textual (message passing)
 */

import type { VNode } from '../utils/types.js';

// =============================================================================
// Types
// =============================================================================

/** Event phases similar to DOM */
export type EventPhase = 'none' | 'capture' | 'target' | 'bubble';

/** Base event interface */
export interface TuiEvent<T = unknown> {
  /** Event type (e.g., 'click', 'keypress', 'focus') */
  readonly type: string;
  /** The element that triggered the event */
  readonly target: VNode | null;
  /** The current element handling the event */
  currentTarget: VNode | null;
  /** Custom event data */
  readonly data: T;
  /** Current propagation phase */
  phase: EventPhase;
  /** Timestamp when event was created */
  readonly timestamp: number;
  /** Whether propagation was stopped */
  propagationStopped: boolean;
  /** Whether immediate propagation was stopped */
  immediatePropagationStopped: boolean;
  /** Whether default action was prevented */
  defaultPrevented: boolean;
  /** Stop event from bubbling up */
  stopPropagation(): void;
  /** Stop event immediately, preventing other listeners on same target */
  stopImmediatePropagation(): void;
  /** Prevent default action */
  preventDefault(): void;
}

/** Event handler function */
export type EventHandler<T = unknown> = (event: TuiEvent<T>) => void | Promise<void>;

/** Event listener options */
export interface EventListenerOptions {
  /** Execute during capture phase instead of bubble */
  capture?: boolean;
  /** Remove listener after first execution */
  once?: boolean;
  /** Passive listeners can't preventDefault */
  passive?: boolean;
  /** Priority for ordering (higher = first) */
  priority?: number;
}

/** Stored listener with metadata */
interface StoredListener {
  type: string;
  handler: EventHandler<any>;
  options: EventListenerOptions;
  id: number;
}

// =============================================================================
// Event Class
// =============================================================================

let eventIdCounter = 0;

/**
 * Create a new TUI event
 */
export function createEvent<T = unknown>(
  type: string,
  data: T,
  target: VNode | null = null
): TuiEvent<T> {
  let propagationStopped = false;
  let immediatePropagationStopped = false;
  let defaultPrevented = false;

  return {
    type,
    target,
    currentTarget: target,
    data,
    phase: 'none',
    timestamp: Date.now(),

    get propagationStopped() {
      return propagationStopped;
    },
    set propagationStopped(value: boolean) {
      propagationStopped = value;
    },

    get immediatePropagationStopped() {
      return immediatePropagationStopped;
    },
    set immediatePropagationStopped(value: boolean) {
      immediatePropagationStopped = value;
    },

    get defaultPrevented() {
      return defaultPrevented;
    },
    set defaultPrevented(value: boolean) {
      defaultPrevented = value;
    },

    stopPropagation() {
      propagationStopped = true;
    },

    stopImmediatePropagation() {
      propagationStopped = true;
      immediatePropagationStopped = true;
    },

    preventDefault() {
      defaultPrevented = true;
    },
  };
}

// =============================================================================
// Event Emitter
// =============================================================================

/**
 * Event emitter with capture/bubble support
 *
 * Can be used standalone or attached to VNodes
 * Generic parameter E allows type-safe event maps
 */
export class EventEmitter<E extends Record<string, any> = Record<string, any>> {
  private listeners: StoredListener[] = [];
  private parent: EventEmitter<any> | null = null;
  private children: Set<EventEmitter<any>> = new Set();
  private listenerIdCounter = 0;

  /** Associate with a VNode for target tracking */
  node: VNode | null = null;

  /**
   * Add an event listener
   */
  on<T = unknown>(type: string, handler: EventHandler<T>, options: EventListenerOptions = {}): () => void {
    const id = this.listenerIdCounter++;
    const listener: StoredListener = {
      type,
      handler,
      options: {
        capture: false,
        once: false,
        passive: false,
        priority: 0,
        ...options,
      },
      id,
    };

    this.listeners.push(listener);

    // Sort by priority (higher first)
    this.listeners.sort((a, b) => (b.options.priority ?? 0) - (a.options.priority ?? 0));

    // Return unsubscribe function
    return () => this.off(type, handler);
  }

  /**
   * Add a one-time listener
   */
  once<T = unknown>(type: string, handler: EventHandler<T>, options: EventListenerOptions = {}): () => void {
    return this.on(type, handler, { ...options, once: true });
  }

  /**
   * Remove an event listener
   */
  off<T = unknown>(type: string, handler?: EventHandler<T>): void {
    if (handler) {
      this.listeners = this.listeners.filter(
        (l) => !(l.type === type && l.handler === handler)
      );
    } else {
      // Remove all listeners for this type
      this.listeners = this.listeners.filter((l) => l.type !== type);
    }
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners = [];
  }

  /**
   * Emit an event (target phase only, no propagation)
   */
  emit<T = unknown>(type: string, data?: T): TuiEvent<T> {
    const event = createEvent(type, data as T, this.node);
    this.dispatchLocal(event, 'target');
    return event;
  }

  /**
   * Dispatch an event with full propagation
   */
  dispatch<T = unknown>(event: TuiEvent<T>): void {
    // Build path from root to target
    const path = this.buildPath();

    // Capture phase (root to target)
    event.phase = 'capture';
    for (const emitter of path) {
      if (event.propagationStopped) break;
      event.currentTarget = emitter.node;
      emitter.dispatchLocal(event, 'capture');
    }

    // Target phase
    if (!event.propagationStopped) {
      event.phase = 'target';
      event.currentTarget = this.node;
      this.dispatchLocal(event, 'target');
    }

    // Bubble phase (target to root)
    event.phase = 'bubble';
    for (let i = path.length - 2; i >= 0; i--) {
      if (event.propagationStopped) break;
      const emitter = path[i];
      event.currentTarget = emitter.node;
      emitter.dispatchLocal(event, 'bubble');
    }
  }

  /**
   * Set parent emitter for event propagation
   */
  setParent(parent: EventEmitter<any> | null): void {
    if (this.parent) {
      this.parent.children.delete(this);
    }
    this.parent = parent;
    if (parent) {
      parent.children.add(this);
    }
  }

  /**
   * Get parent emitter
   */
  getParent(): EventEmitter<any> | null {
    return this.parent;
  }

  /**
   * Get child emitters
   */
  getChildren(): EventEmitter<any>[] {
    return Array.from(this.children);
  }

  /**
   * Check if this emitter has listeners for a type
   */
  hasListeners(type: string): boolean {
    return this.listeners.some((l) => l.type === type);
  }

  /**
   * Get listener count for a type
   */
  listenerCount(type?: string): number {
    if (type) {
      return this.listeners.filter((l) => l.type === type).length;
    }
    return this.listeners.length;
  }

  // =========================================================================
  // Private Methods
  // =========================================================================

  private dispatchLocal<T>(event: TuiEvent<T>, phase: EventPhase): void {
    const listenersToRemove: StoredListener[] = [];

    for (const listener of this.listeners) {
      if (event.immediatePropagationStopped) break;
      if (listener.type !== event.type) continue;

      // Check phase matching
      const isCapture = listener.options.capture;
      if (phase === 'capture' && !isCapture) continue;
      if (phase === 'bubble' && isCapture) continue;
      // Target phase triggers both capture and bubble listeners

      try {
        listener.handler(event);
      } catch (error) {
        console.error(`Error in event handler for "${event.type}":`, error);
      }

      if (listener.options.once) {
        listenersToRemove.push(listener);
      }
    }

    // Remove one-time listeners
    for (const listener of listenersToRemove) {
      this.listeners = this.listeners.filter((l) => l.id !== listener.id);
    }
  }

  private buildPath(): EventEmitter[] {
    const path: EventEmitter[] = [];
    let current: EventEmitter | null = this;

    while (current) {
      path.unshift(current);
      current = current.parent;
    }

    return path;
  }
}

// =============================================================================
// Event Delegation
// =============================================================================

/**
 * Event delegation helper
 *
 * Allows a parent to handle events from children matching a selector
 */
export interface DelegateOptions {
  /** Type filter function */
  typeMatch?: (type: string) => boolean;
  /** Target filter function */
  targetMatch?: (target: VNode | null) => boolean;
}

/**
 * Create a delegating event handler
 */
export function delegate<T = unknown>(
  handler: EventHandler<T>,
  options: DelegateOptions = {}
): EventHandler<T> {
  return (event: TuiEvent<T>) => {
    // Check type match
    if (options.typeMatch && !options.typeMatch(event.type)) {
      return;
    }

    // Check target match
    if (options.targetMatch && !options.targetMatch(event.target)) {
      return;
    }

    handler(event);
  };
}

// =============================================================================
// Common Event Types
// =============================================================================

/** Keyboard event data */
export interface KeyEventData {
  key: string;
  char?: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
}

/** Mouse event data */
export interface MouseEventData {
  x: number;
  y: number;
  button: 'left' | 'middle' | 'right' | 'none';
  type: 'down' | 'up' | 'move' | 'wheel';
  deltaX?: number;
  deltaY?: number;
}

/** Focus event data */
export interface FocusEventData {
  focused: boolean;
  relatedTarget?: VNode | null;
}

/** Value change event data */
export interface ChangeEventData<T = unknown> {
  value: T;
  previousValue?: T;
}

// =============================================================================
// Event Bus (Global)
// =============================================================================

/**
 * Global event bus for cross-component communication
 *
 * Similar to Textual's message passing but simpler
 */
class EventBus extends EventEmitter {
  private static instance: EventBus | null = null;

  private constructor() {
    super();
  }

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Broadcast an event to all listeners (no propagation)
   */
  broadcast<T = unknown>(type: string, data?: T): TuiEvent<T> {
    return this.emit(type, data);
  }

  /**
   * Reset the singleton (for testing)
   */
  static reset(): void {
    if (EventBus.instance) {
      EventBus.instance.removeAllListeners();
    }
    EventBus.instance = null;
  }
}

/** Get the global event bus */
export function getEventBus(): EventBus {
  return EventBus.getInstance();
}

// =============================================================================
// Async Event Helpers
// =============================================================================

/**
 * Wait for an event to occur
 */
export function waitForEvent<T = unknown>(
  emitter: EventEmitter,
  type: string,
  timeout?: number
): Promise<TuiEvent<T>> {
  return new Promise((resolve, reject) => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const unsubscribe = emitter.once<T>(type, (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve(event);
    });

    if (timeout !== undefined) {
      timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for event "${type}"`));
      }, timeout);
    }
  });
}

/**
 * Create an async iterator for events
 */
export async function* eventIterator<T = unknown>(
  emitter: EventEmitter,
  type: string
): AsyncGenerator<TuiEvent<T>, void, unknown> {
  const queue: TuiEvent<T>[] = [];
  let resolveNext: ((event: TuiEvent<T>) => void) | null = null;
  let done = false;

  const unsubscribe = emitter.on<T>(type, (event) => {
    if (resolveNext) {
      resolveNext(event);
      resolveNext = null;
    } else {
      queue.push(event);
    }
  });

  try {
    while (!done) {
      if (queue.length > 0) {
        yield queue.shift()!;
      } else {
        yield await new Promise<TuiEvent<T>>((resolve) => {
          resolveNext = resolve;
        });
      }
    }
  } finally {
    unsubscribe();
  }
}

// =============================================================================
// Event Composition Helpers
// =============================================================================

/**
 * Combine multiple handlers into one
 */
export function combineHandlers<T = unknown>(
  ...handlers: EventHandler<T>[]
): EventHandler<T> {
  return (event: TuiEvent<T>) => {
    for (const handler of handlers) {
      if (event.immediatePropagationStopped) break;
      handler(event);
    }
  };
}

/**
 * Create a handler that only runs if condition is true
 */
export function conditionalHandler<T = unknown>(
  condition: (event: TuiEvent<T>) => boolean,
  handler: EventHandler<T>
): EventHandler<T> {
  return (event: TuiEvent<T>) => {
    if (condition(event)) {
      handler(event);
    }
  };
}

/**
 * Debounce an event handler
 */
export function debounceHandler<T = unknown>(
  handler: EventHandler<T>,
  delay: number
): EventHandler<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  return (event: TuiEvent<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handler(event), delay);
  };
}

/**
 * Throttle an event handler
 */
export function throttleHandler<T = unknown>(
  handler: EventHandler<T>,
  limit: number
): EventHandler<T> {
  let lastRun = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastEvent: TuiEvent<T> | undefined;

  return (event: TuiEvent<T>) => {
    const now = Date.now();
    lastEvent = event; // Always save the latest event

    if (now - lastRun >= limit) {
      lastRun = now;
      handler(event);
    } else if (!timeoutId) {
      timeoutId = setTimeout(() => {
        lastRun = Date.now();
        timeoutId = undefined;
        if (lastEvent) {
          handler(lastEvent);
        }
      }, limit - (now - lastRun));
    }
  };
}
