/**
 * Tuiuiu Signals - Minimal reactive primitives
 *
 * ~100 lines of reactive state management
 */

import {
  allowInternalSignalCreationDuringRender,
  warnIfCreateSignalDuringComponentRender,
} from '../core/dev-warnings.js';

type CleanupFn = () => void;
export type EffectScheduler = (flush: () => void) => void;

export interface EffectOptions {
  scheduler?: EffectScheduler;
  /**
   * When true, effects without a scheduler are batched via queueMicrotask
   * instead of running synchronously. Multiple signal changes in the same
   * tick consolidate into a single effect execution.
   */
  autoBatch?: boolean;
}

// Global tracking for auto-dependency detection
let currentEffect: Effect | null = null;
const batchQueue: Set<Effect> = new Set();
let isBatching = false;

/**
 * Signal - A reactive value container
 *
 * Uses smart listener storage inspired by arrow-js:
 * - 0 subscribers: _subs = null
 * - 1 subscriber: _subs = Effect (no Set allocation)
 * - 2+ subscribers: _subs = Set<Effect>
 */
export class Signal<T> {
  private _value: T;
  private _subs: Effect | Set<Effect> | null = null;

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    // Auto-track dependency when accessed inside an effect
    if (currentEffect) {
      currentEffect._trackDep(this);
    }
    return this._value;
  }

  set value(newValue: T) {
    // Eager state optimization: skip update if value is the same
    // Uses Object.is() for better semantics (handles NaN, -0)
    if (!Object.is(this._value, newValue)) {
      this._value = newValue;
      this._notify();
    }
  }

  /** Update value using a function */
  update(fn: (current: T) => T): void {
    this.value = fn(this._value);
  }

  /** Get value without tracking */
  peek(): T {
    return this._value;
  }

  /** Add subscriber with smart storage (fn vs Set) */
  _addSub(effect: Effect): void {
    if (this._subs === null) {
      this._subs = effect;
    } else if (this._subs instanceof Effect) {
      if (this._subs === effect) return; // already subscribed
      this._subs = new Set([this._subs, effect]);
    } else {
      this._subs.add(effect);
    }
  }

  private _notify(): void {
    if (this._subs === null) return;

    if (this._subs instanceof Effect) {
      const effect = this._subs;
      if (isBatching) {
        batchQueue.add(effect);
      } else {
        effect.notify();
      }
      return;
    }

    // Set path: copy to array to prevent mutation during iteration
    const effects = [...this._subs];
    for (const effect of effects) {
      if (isBatching) {
        batchQueue.add(effect);
      } else {
        effect.notify();
      }
    }
  }

  /** Remove a subscriber */
  unsubscribe(effect: Effect): void {
    if (this._subs === null) return;

    if (this._subs instanceof Effect) {
      if (this._subs === effect) {
        this._subs = null;
      }
      return;
    }

    this._subs.delete(effect);
    // Downgrade Set to single Effect when only 1 remains
    if (this._subs.size === 1) {
      this._subs = this._subs.values().next().value!;
    } else if (this._subs.size === 0) {
      this._subs = null;
    }
  }
}

// =============================================================================
// onCleanup() - Register cleanup in current effect scope (arrow-js pattern)
// =============================================================================

let cleanupCollector: CleanupFn[] | null = null;

/**
 * Register a cleanup function in the current effect/component scope.
 * More ergonomic than returning a cleanup from useEffect —
 * can be called at any point during effect execution.
 *
 * @example
 * createEffect(() => {
 *   const id = setInterval(tick, 1000);
 *   onCleanup(() => clearInterval(id));
 *   // ... more logic, no need to return cleanup
 * });
 */
export function onCleanup(fn: CleanupFn): void {
  if (cleanupCollector) {
    cleanupCollector.push(fn);
  }
}

// =============================================================================
// Microtask auto-batching (arrow-js pattern)
// =============================================================================

let microtaskQueued = false;
const microtaskQueue = new Set<Effect>();

function enqueueMicrotaskFlush(effect: Effect): void {
  microtaskQueue.add(effect);
  if (!microtaskQueued) {
    microtaskQueued = true;
    queueMicrotask(flushMicrotaskQueue);
  }
}

function flushMicrotaskQueue(): void {
  microtaskQueued = false;
  const effects = [...microtaskQueue];
  microtaskQueue.clear();
  for (const effect of effects) {
    effect.run(); // run() directly — avoids re-entering microtask path
  }
}

/**
 * Effect - A reactive side effect that re-runs when dependencies change
 *
 * Improvements over the basic model (inspired by arrow-js):
 * - Dependency deduplication: skips unsubscribe/resubscribe when deps unchanged
 * - onCleanup() collector: register cleanups anywhere during execution
 * - Microtask auto-batching: unscheduled effects batch via queueMicrotask
 */
export class Effect {
  dependencies = new Set<Signal<any>>();
  /** Scratch set used during tracking to detect dep changes */
  private _nextDeps: Set<Signal<any>> | null = null;
  private _cleanups: CleanupFn[] = [];
  private _returnCleanup: CleanupFn | void = undefined;
  private running = false;
  private disposed = false;
  private scheduled = false;

  constructor(
    private fn: () => CleanupFn | void,
    private options: EffectOptions = {}
  ) {
    this.run();
  }

  /** Track a dependency (called from Signal.get during run()) */
  _trackDep(signal: Signal<any>): void {
    if (this._nextDeps) {
      this._nextDeps.add(signal);
    }
    // Outside of run() tracking is a no-op (safety: should not happen)
  }

  notify(): void {
    if (this.disposed) {
      return;
    }

    const scheduler = this.options.scheduler;
    if (scheduler) {
      if (this.scheduled) {
        return;
      }
      this.scheduled = true;
      scheduler(() => {
        this.run();
      });
      return;
    }

    // No scheduler: use microtask auto-batching if opted in,
    // otherwise run synchronously (preserves existing behavior for createMemo etc.)
    if (this.options.autoBatch) {
      enqueueMicrotaskFlush(this);
    } else {
      this.run();
    }
  }

  run(): void {
    this.scheduled = false;

    // Prevent re-entrant execution (avoids infinite loops)
    if (this.running || this.disposed) {
      return;
    }

    this.running = true;

    try {
      // Run all cleanups (returned + onCleanup-registered)
      this._runCleanups();

      // Set up dependency deduplication: collect new deps in scratch set
      this._nextDeps = new Set<Signal<any>>();

      // Set up onCleanup collector
      const prevCollector = cleanupCollector;
      cleanupCollector = this._cleanups;

      // Run effect with tracking enabled
      const prevEffect = currentEffect;
      currentEffect = this;
      try {
        this._returnCleanup = this.fn();
      } finally {
        currentEffect = prevEffect;
        cleanupCollector = prevCollector;
      }

      // Dependency deduplication: compare old vs new deps
      const oldDeps = this.dependencies;
      const newDeps = this._nextDeps;
      this._nextDeps = null;

      if (!this._samesDeps(oldDeps, newDeps)) {
        // Unsubscribe from deps no longer tracked
        for (const dep of oldDeps) {
          if (!newDeps.has(dep)) {
            dep.unsubscribe(this);
          }
        }
        // Subscribe to newly tracked deps
        for (const dep of newDeps) {
          if (!oldDeps.has(dep)) {
            dep._addSub(this);
          }
        }
        this.dependencies = newDeps;
      }
      // If deps are the same, subscriptions are already in place — no work needed
    } finally {
      this.running = false;
    }
  }

  /** Fast comparison: are old and new dep sets identical? */
  private _samesDeps(a: Set<Signal<any>>, b: Set<Signal<any>>): boolean {
    if (a.size !== b.size) return false;
    for (const dep of a) {
      if (!b.has(dep)) return false;
    }
    return true;
  }

  private _runCleanups(): void {
    // Return-value cleanup
    if (this._returnCleanup) {
      this._returnCleanup();
      this._returnCleanup = undefined;
    }
    // onCleanup-registered cleanups
    if (this._cleanups.length > 0) {
      for (const fn of this._cleanups) {
        fn();
      }
      this._cleanups.length = 0;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    this._runCleanups();
    for (const dep of this.dependencies) {
      dep.unsubscribe(this);
    }
    this.dependencies.clear();
  }
}

/**
 * Create a reactive signal
 */
export function createSignal<T>(initialValue: T): [() => T, (value: T | ((prev: T) => T)) => void] {
  warnIfCreateSignalDuringComponentRender(new Error().stack, import.meta.url);
  const signal = new Signal(initialValue);

  const getter = () => signal.value;
  const setter = (value: T | ((prev: T) => T)) => {
    if (typeof value === 'function') {
      signal.update(value as (prev: T) => T);
    } else {
      signal.value = value;
    }
  };

  return [getter, setter];
}

/**
 * Create a reactive effect that auto-tracks dependencies
 */
export function createEffect(fn: () => CleanupFn | void, options: EffectOptions = {}): () => void {
  const effect = new Effect(fn, options);
  return () => effect.dispose();
}

/**
 * Computed value - derives from other signals
 */
export function createMemo<T>(fn: () => T): () => T {
  const [value, setValue] = allowInternalSignalCreationDuringRender(() => createSignal<T>(undefined as T));

  createEffect(() => {
    setValue(fn());
  });

  return value;
}

/**
 * Batch multiple signal updates into one render
 */
export function batch(fn: () => void): void {
  const wasBatching = isBatching;
  isBatching = true;

  try {
    fn();
  } finally {
    isBatching = wasBatching;

    if (!wasBatching) {
      const effects = [...batchQueue];
      batchQueue.clear();
      for (const effect of effects) {
        effect.notify();
      }
    }
  }
}

/**
 * Untrack - read signals without creating dependencies
 */
export function untrack<T>(fn: () => T): T {
  const prevEffect = currentEffect;
  currentEffect = null;
  try {
    return fn();
  } finally {
    currentEffect = prevEffect;
  }
}

// ============================================
// Additional reactive utilities
// ============================================

/**
 * Reducer - Complex state management with actions
 *
 * @example
 * const [state, dispatch] = createReducer(
 *   (state, action) => {
 *     switch (action.type) {
 *       case 'increment': return { count: state.count + 1 };
 *       case 'decrement': return { count: state.count - 1 };
 *       default: return state;
 *     }
 *   },
 *   { count: 0 }
 * );
 *
 * dispatch({ type: 'increment' });
 */
export function createReducer<S, A>(
  reducer: (state: S, action: A) => S,
  initialState: S | (() => S)
): [() => S, (action: A) => void] {
  const initial = typeof initialState === 'function'
    ? (initialState as () => S)()
    : initialState;

  const [state, setState] = createSignal<S>(initial);

  const dispatch = (action: A) => {
    setState(currentState => reducer(currentState, action));
  };

  return [state, dispatch];
}

/**
 * Ref - Mutable container that doesn't trigger re-renders
 *
 * @example
 * const countRef = createRef(0);
 * countRef.current++; // No re-render triggered
 */
export function createRef<T>(initialValue: T): { current: T } {
  return { current: initialValue };
}

/**
 * Deferred - Value that updates with lower priority
 *
 * When the source signal changes, the deferred value updates
 * after a microtask delay, allowing urgent updates to process first.
 *
 * @example
 * const [search, setSearch] = createSignal('');
 * const deferredSearch = createDeferred(search);
 *
 * // deferredSearch will lag behind search slightly,
 * // keeping the UI responsive during rapid updates
 */
export function createDeferred<T>(source: () => T): () => T {
  const [deferred, setDeferred] = allowInternalSignalCreationDuringRender(() => createSignal<T>(source()));

  createEffect(() => {
    const value = source();
    // Schedule update with lower priority
    queueMicrotask(() => {
      setDeferred(value);
    });
  });

  return deferred;
}

/**
 * ID Generator - Creates unique IDs for components
 */
let idCounter = 0;
export function createId(prefix: string = 'reck'): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Reset the ID counter (useful for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}

/**
 * Previous value - Track the previous value of a signal
 * Useful for comparison or animations
 *
 * @example
 * const [count, setCount] = createSignal(0);
 * const prevCount = createPrevious(count);
 *
 * // After setCount(5):
 * // count() === 5
 * // prevCount() === 0
 */
export function createPrevious<T>(source: () => T): () => T | undefined {
  const [previous, setPrevious] = createSignal<T | undefined>(undefined);

  createEffect(() => {
    const currentValue = source();
    // Use untrack to avoid creating dependency on previous
    const prevValue = untrack(previous);
    if (prevValue !== currentValue) {
      setPrevious(currentValue);
    }
  });

  return previous;
}

/**
 * Throttled signal - Limits how often a signal can update
 * Useful for expensive operations or rate limiting
 *
 * @example
 * const [position, setPosition] = createSignal({ x: 0, y: 0 });
 * const throttledPosition = createThrottled(position, 100); // 100ms
 */
export function createThrottled<T>(source: () => T, delay: number): () => T {
  const [throttled, setThrottled] = createSignal<T>(source());
  let lastUpdate = 0;
  let pending: NodeJS.Timeout | null = null;

  createEffect(() => {
    const value = source();
    const now = Date.now();
    const elapsed = now - lastUpdate;

    if (elapsed >= delay) {
      setThrottled(value);
      lastUpdate = now;
    } else if (!pending) {
      pending = setTimeout(() => {
        setThrottled(source());
        lastUpdate = Date.now();
        pending = null;
      }, delay - elapsed);
    }
  });

  return throttled;
}

/**
 * Debounced signal - Delays updates until activity stops
 * Useful for search inputs or resize handlers
 *
 * @example
 * const [search, setSearch] = createSignal('');
 * const debouncedSearch = createDebounced(search, 300);
 */
export function createDebounced<T>(source: () => T, delay: number): () => T {
  const [debounced, setDebounced] = createSignal<T>(source());
  let timeout: NodeJS.Timeout | null = null;

  createEffect(() => {
    const value = source();

    if (timeout) {
      clearTimeout(timeout);
    }

    timeout = setTimeout(() => {
      setDebounced(value);
    }, delay);
  });

  return debounced;
}
