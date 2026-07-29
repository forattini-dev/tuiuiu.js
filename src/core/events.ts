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
 * 
 */

import type { VNode } from '../utils/types.js';
import {
  deleteRuntimeResource,
  getRuntimeResource,
  RUNTIME_RESOURCE_DISPOSE,
} from './runtime-scope.js';

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

/**
 * Event handler function.
 *
 * Return values are ignored; promises are observed/awaited by the async
 * dispatch APIs. Accepting arbitrary values preserves normal TypeScript
 * callback ergonomics such as `event => items.push(event)`.
 */
export type EventHandler<T = unknown> = (event: TuiEvent<T>) => unknown | Promise<unknown>;

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

function eventForListener<T>(
  event: TuiEvent<T>,
  passive: boolean
): TuiEvent<T> {
  if (!passive) return event;
  return new Proxy(event, {
    get(target, property, receiver) {
      if (property === 'preventDefault') {
        return () => {};
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      return Reflect.set(target, property, value, receiver);
    },
  });
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
  on<K extends keyof E & string>(
    type: K,
    handler: EventHandler<E[K]>,
    options: EventListenerOptions = {},
  ): () => void {
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
    return () => {
      this.listeners = this.listeners.filter(candidate => candidate.id !== id);
    };
  }

  /**
   * Add a one-time listener
   */
  once<K extends keyof E & string>(
    type: K,
    handler: EventHandler<E[K]>,
    options: EventListenerOptions = {},
  ): () => void {
    return this.on(type, handler, { ...options, once: true });
  }

  /**
   * Remove an event listener
   */
  off<K extends keyof E & string>(type: K, handler?: EventHandler<E[K]>): void {
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
  emit<K extends keyof E & string>(type: K, data?: E[K]): TuiEvent<E[K]> {
    const event = createEvent(type, data as E[K], this.node);
    this.dispatchLocal(event, 'target');
    return event;
  }

  /**
   * Emit an event and await every local handler.
   *
   * All matching handlers get a chance to run. If one or more fail, the
   * returned promise rejects with an AggregateError after dispatch finishes.
   */
  async emitAsync<K extends keyof E & string>(
    type: K,
    data?: E[K],
  ): Promise<TuiEvent<E[K]>> {
    const event = createEvent(type, data as E[K], this.node);
    const errors = await this.dispatchLocalAsync(event, 'target');
    if (errors.length > 0) {
      throw new AggregateError(errors, `Event "${type}" handlers failed`);
    }
    return event;
  }

  /**
   * Dispatch an event with full propagation
   */
  dispatch<T = unknown>(event: TuiEvent<T>): void {
    // Build path from root to target
    const path = this.buildPath();

    // Capture phase (root to parent of target)
    event.phase = 'capture';
    for (let i = 0; i < path.length - 1; i++) {
      if (event.propagationStopped) break;
      const emitter = path[i];
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
   * Dispatch with capture/bubble propagation and await async handlers.
   */
  async dispatchAsync<T = unknown>(event: TuiEvent<T>): Promise<void> {
    const path = this.buildPath();
    const errors: unknown[] = [];

    event.phase = 'capture';
    for (let i = 0; i < path.length - 1; i++) {
      if (event.propagationStopped) break;
      const emitter = path[i]!;
      event.currentTarget = emitter.node;
      errors.push(...await emitter.dispatchLocalAsync(event, 'capture'));
    }

    if (!event.propagationStopped) {
      event.phase = 'target';
      event.currentTarget = this.node;
      errors.push(...await this.dispatchLocalAsync(event, 'target'));
    }

    event.phase = 'bubble';
    for (let i = path.length - 2; i >= 0; i--) {
      if (event.propagationStopped) break;
      const emitter = path[i]!;
      event.currentTarget = emitter.node;
      errors.push(...await emitter.dispatchLocalAsync(event, 'bubble'));
    }

    if (errors.length > 0) {
      throw new AggregateError(
        errors,
        `Event "${event.type}" handlers failed`
      );
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
  hasListeners(type: keyof E & string): boolean {
    return this.listeners.some((l) => l.type === type);
  }

  /**
   * Get listener count for a type
   */
  listenerCount(type?: keyof E & string): number {
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

    for (const listener of [...this.listeners]) {
      if (event.immediatePropagationStopped) break;
      if (listener.type !== event.type) continue;

      // Check phase matching
      const isCapture = listener.options.capture;
      if (phase === 'capture' && !isCapture) continue;
      if (phase === 'bubble' && isCapture) continue;
      // Target phase triggers both capture and bubble listeners

      try {
        const listenerEvent = eventForListener(
          event,
          listener.options.passive === true
        );
        const result = listener.handler(listenerEvent);
        if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
          Promise.resolve(result).catch((error) => {
            console.error(`Error in async event handler for "${event.type}":`, error);
          });
        }
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

  private async dispatchLocalAsync<T>(
    event: TuiEvent<T>,
    phase: EventPhase
  ): Promise<unknown[]> {
    const listenersToRemove: StoredListener[] = [];
    const errors: unknown[] = [];

    for (const listener of [...this.listeners]) {
      if (event.immediatePropagationStopped) break;
      if (listener.type !== event.type) continue;

      const isCapture = listener.options.capture === true;
      if (phase === 'capture' && !isCapture) continue;
      if (phase === 'bubble' && isCapture) continue;

      try {
        await listener.handler(eventForListener(
          event,
          listener.options.passive === true
        ));
      } catch (error) {
        errors.push(error);
      }

      if (listener.options.once) {
        listenersToRemove.push(listener);
      }
    }

    if (listenersToRemove.length > 0) {
      const removedIds = new Set(listenersToRemove.map(listener => listener.id));
      this.listeners = this.listeners.filter(
        listener => !removedIds.has(listener.id)
      );
    }

    return errors;
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

    return handler(event);
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
// Event Bus (Runtime-scoped)
// =============================================================================

/**
 * Runtime-owned event bus for cross-component communication
 */
const EVENT_BUS = Symbol('tuiuiu.event-bus');

class EventBus extends EventEmitter {
  private constructor() {
    super();
  }

  static getInstance(): EventBus {
    return getRuntimeResource(
      EVENT_BUS,
      () => new EventBus(),
    );
  }

  /**
   * Broadcast an event to all listeners (no propagation)
   */
  broadcast<T = unknown>(type: string, data?: T): TuiEvent<T> {
    return this.emit(type, data);
  }

  /**
   * Reset the current runtime bus (for testing)
   */
  static reset(): void {
    deleteRuntimeResource(EVENT_BUS);
  }

  [RUNTIME_RESOURCE_DISPOSE](): void {
    this.removeAllListeners();
  }
}

/** Get the current runtime event bus */
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

    const unsubscribe = emitter.once(type, (event) => {
      if (timeoutId) clearTimeout(timeoutId);
      resolve(event as TuiEvent<T>);
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

  const unsubscribe = emitter.on(type, (event) => {
    const typedEvent = event as TuiEvent<T>;
    if (resolveNext) {
      resolveNext(typedEvent);
      resolveNext = null;
    } else {
      queue.push(typedEvent);
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
    let pending: Promise<unknown> | null = null;
    for (const handler of handlers) {
      if (pending) {
        pending = pending.then(async () => {
          if (!event.immediatePropagationStopped) {
            await handler(event);
          }
        });
        continue;
      }
      if (event.immediatePropagationStopped) break;
      const result = handler(event);
      if (result && typeof (result as PromiseLike<unknown>).then === 'function') {
        pending = Promise.resolve(result);
      }
    }
    return pending ?? undefined;
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
      return handler(event);
    }
    return undefined;
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
