/**
 * Reck Signals - Minimal reactive primitives
 *
 * ~100 lines of reactive state management
 */

type Listener = () => void;
type CleanupFn = () => void;

// Global tracking for auto-dependency detection
let currentEffect: Effect | null = null;
const batchQueue: Set<Effect> = new Set();
let isBatching = false;

/**
 * Signal - A reactive value container
 */
export class Signal<T> {
  private _value: T;
  private subscribers = new Set<Effect>();

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get value(): T {
    // Auto-track dependency when accessed inside an effect
    if (currentEffect) {
      this.subscribers.add(currentEffect);
      currentEffect.dependencies.add(this);
    }
    return this._value;
  }

  set value(newValue: T) {
    // Eager state optimization: skip update if value is the same
    // Uses Object.is() like React for better semantics (handles NaN, -0)
    if (!Object.is(this._value, newValue)) {
      this._value = newValue;
      this.notify();
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

  private notify(): void {
    // Copy subscribers before iterating to prevent infinite loops
    // (effects may re-subscribe during their run)
    const effects = [...this.subscribers];
    for (const effect of effects) {
      if (isBatching) {
        batchQueue.add(effect);
      } else {
        effect.run();
      }
    }
  }

  /** Remove a subscriber */
  unsubscribe(effect: Effect): void {
    this.subscribers.delete(effect);
  }
}

/**
 * Effect - A reactive side effect that re-runs when dependencies change
 */
export class Effect {
  dependencies = new Set<Signal<any>>();
  private cleanup: CleanupFn | void = undefined;
  private running = false;
  private disposed = false;

  constructor(private fn: () => CleanupFn | void) {
    this.run();
  }

  run(): void {
    // Prevent re-entrant execution (avoids infinite loops)
    if (this.running || this.disposed) {
      return;
    }

    this.running = true;

    try {
      // Cleanup previous run
      if (this.cleanup) {
        this.cleanup();
        this.cleanup = undefined;
      }

      // Clear old dependencies
      for (const dep of this.dependencies) {
        dep.unsubscribe(this);
      }
      this.dependencies.clear();

      // Run effect with tracking enabled
      const prevEffect = currentEffect;
      currentEffect = this;
      try {
        this.cleanup = this.fn();
      } finally {
        currentEffect = prevEffect;
      }
    } finally {
      this.running = false;
    }
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    if (this.cleanup) {
      this.cleanup();
      this.cleanup = undefined;
    }
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
export function createEffect(fn: () => CleanupFn | void): () => void {
  const effect = new Effect(fn);
  return () => effect.dispose();
}

/**
 * Computed value - derives from other signals
 */
export function createMemo<T>(fn: () => T): () => T {
  const [value, setValue] = createSignal<T>(undefined as T);

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
        effect.run();
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
  const [deferred, setDeferred] = createSignal<T>(source());

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
