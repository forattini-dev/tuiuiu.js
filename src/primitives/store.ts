/**
 * Reactive Store - State management powered by Signals
 *
 * Combines the predictability of Reducers with the performance of fine-grained reactivity.
 */

import { createSignal, Signal } from './signal.js';

// =============================================================================
// Types
// =============================================================================

export interface Action<T = any> {
  type: T;
  payload?: any;
  [extraProps: string]: any;
}

export interface AnyAction extends Action {
  [extraProps: string]: any;
}

export type Reducer<S = any, A extends Action = AnyAction> = (
  state: S | undefined,
  action: A
) => S;

export type Dispatch<A extends Action = AnyAction> = (action: A) => A;

export type StoreEnhancer<S = any, A extends Action = AnyAction> = (
  next: StoreCreator<S, A>
) => StoreCreator<S, A>;

export type StoreCreator<S = any, A extends Action = AnyAction> = (
  reducer: Reducer<S, A>,
  preloadedState?: S
) => Store<S, A>;

export interface Store<S = any, A extends Action = AnyAction> {
  /**
   * Reads the state (non-reactive).
   * Use `store.state()` for reactive access in components.
   */
  getState: () => S;

  /**
   * The reactive state signal.
   * Calling `store.state()` inside a component or effect will track dependencies.
   */
  state: () => S; // The getter part of the signal

  /**
   * Dispatches an action. It is the only way to trigger a state change.
   */
  dispatch: Dispatch<A>;

  /**
   * Subscribes to changes.
   * Returns an unsubscribe function.
   */
  subscribe: (listener: () => void) => () => void;

  /**
   * Replaces the reducer currently used by the store to calculate the state.
   */
  replaceReducer: (nextReducer: Reducer<S, A>) => void;
}

export interface MiddlewareAPI<S = any, A extends Action = AnyAction, D extends Dispatch<A> = Dispatch<A>> {
  dispatch: D;
  getState: () => S;
}

export type Middleware<S = any, A extends Action = AnyAction, D extends Dispatch<A> = Dispatch<A>> = (
  api: MiddlewareAPI<S, A, D>
) => (next: D) => (action: A) => A;

export interface SyncStorageAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

// =============================================================================
// Implementation
// =============================================================================

/**
 * Creates a reactive Redux-like store.
 *
 * @param reducer A function that returns the next state tree, given the current state tree and the action to handle.
 * @param preloadedState The initial state.
 * @param enhancer The store enhancer (e.g. applyMiddleware).
 */
export function createStore<S, A extends Action = AnyAction>(
  reducer: Reducer<S, A>,
  preloadedState?: S,
  enhancer?: StoreEnhancer<S, A>
): Store<S, A> {
  if (typeof enhancer !== 'undefined') {
    return enhancer(createStore as StoreCreator<S, A>)(reducer, preloadedState);
  }

  let currentReducer = reducer;
  // Initialize state via signal
  const [stateSignal, setStateSignal] = createSignal<S>(
    preloadedState as S
  );
  
  // Keep a non-reactive reference for middleware/getState
  let currentState = preloadedState as S;
  
  const listeners = new Map<number, () => void>();
  let nextListenerId = 1;
  let isDispatching = false;

  function getState(): S {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing.'
      );
    }
    return currentState;
  }

  function dispatch(action: A): A {
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
      // Update signal to trigger reactivity
      setStateSignal(currentState);
    } finally {
      isDispatching = false;
    }

    // Notify a stable snapshot so subscriptions created during dispatch only
    // participate in the next dispatch.
    const errors: unknown[] = [];
    for (const listener of [...listeners.values()]) {
      try {
        listener();
      } catch (error) {
        errors.push(error);
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, 'One or more store subscribers failed');
    }

    return action;
  }

  function subscribe(listener: () => void): () => void {
    if (typeof listener !== 'function') {
      throw new TypeError('Store listener must be a function');
    }
    const listenerId = nextListenerId++;
    listeners.set(listenerId, listener);
    return () => {
      listeners.delete(listenerId);
    };
  }

  function replaceReducer(nextReducer: Reducer<S, A>): void {
    currentReducer = nextReducer;
    dispatch({ type: '@@INIT' } as A);
  }

  // Initialize store
  dispatch({ type: '@@INIT' } as A);

  return {
    getState,
    state: stateSignal, // Expose the signal getter
    dispatch,
    subscribe,
    replaceReducer,
  };
}

/**
 * Creates a store enhancer that applies middleware to the dispatch method.
 */
export function applyMiddleware<A extends Action = AnyAction>(
  ...middlewares: Middleware<any, A>[]
): StoreEnhancer<any, A> {
  return (createStore: StoreCreator<any, A>) => (
    reducer: Reducer<any, A>,
    preloadedState?: any
  ) => {
    const store = createStore(reducer, preloadedState);
    let dispatch: Dispatch<A> = (_action: A) => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed.'
      );
    };

    const middlewareAPI: MiddlewareAPI<any, A> = {
      getState: store.getState,
      dispatch: (action: A) => dispatch(action), // Removed ...args
    };
    const chain = middlewares.map((middleware) => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);


    return {
      ...store,
      dispatch,
    };
  };
}

/**
 * Composes single-argument functions from right to left.
 */
function compose(...funcs: Function[]) {
  if (funcs.length === 0) {
    return (arg: any) => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce(
    (a, b) =>
      (...args: any) =>
        a(b(...args))
  );
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function defaultPersistedMerge<S>(initialState: S, persistedState: S): S {
  if (isPlainObject(initialState) && isPlainObject(persistedState)) {
    return {
      ...initialState,
      ...persistedState,
    } as S;
  }

  return persistedState;
}

// =============================================================================
// Persistence Middleware
// =============================================================================

export interface PersistedStoreOptions<S, A extends Action = AnyAction> {
  reducer: Reducer<S, A>;
  initialState: S;
  storage: SyncStorageAdapter;
  key?: string;
  debounce?: number;
  migrate?: (persistedState: unknown) => S;
  merge?: (initialState: S, persistedState: S) => S;
}

export interface PersistOptions {
  /** Key to use if using localStorage */
  key?: string;
  /** Debounce save time in ms */
  debounce?: number;
  /** Receives serialization and storage failures. */
  onError?: (error: unknown) => void;
  /** Storage engine adapter */
  storage?: {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, value: string) => void | Promise<void>;
  };
}

export interface PersistController {
  /** Immediately writes the latest queued state, if any. */
  flush: () => Promise<void>;
  /** Cancels a queued write and prevents future writes. */
  dispose: () => void;
  /** Whether a state snapshot is waiting to be written. */
  pending: () => boolean;
}

export type PersistMiddleware<S = any, A extends Action = AnyAction> =
  Middleware<S, A> & PersistController;

export interface PersistedStore<S = any, A extends Action = AnyAction>
  extends Store<S, A> {
  persistence: PersistController;
}

/**
 * Creates a store that hydrates synchronously from persisted state before the
 * first dispatch, then saves subsequent updates through the persistence
 * middleware.
 *
 * Async storage adapters are intentionally out of scope for this helper.
 */
export function createPersistedStore<S, A extends Action = AnyAction>(
  options: PersistedStoreOptions<S, A>
): PersistedStore<S, A> {
  const {
    reducer,
    initialState,
    storage,
    key = 'root',
    debounce = 1000,
    migrate,
    merge = defaultPersistedMerge,
  } = options;

  let preloadedState = initialState;

  try {
    const serialized = storage.getItem(key);

    if (serialized !== null) {
      const parsed = JSON.parse(serialized);
      const hydratedState = migrate ? migrate(parsed) : (parsed as S);
      preloadedState = merge(initialState, hydratedState);
    }
  } catch (error) {
    console.warn('Failed to hydrate persisted state. Falling back to initial state.', error);
  }

  const persist = createPersistMiddleware({
    key,
    debounce,
    storage,
  });

  const store = createStore(reducer, preloadedState, applyMiddleware(persist));
  return {
    ...store,
    persistence: persist,
  };
}

/**
 * Creates a persistence middleware.
 * This middleware is save-only: it persists state after dispatches but does not
 * hydrate initial state from storage.
 *
 * Actual file I/O should be injected via `storage` to keep this primitive
 * environment-agnostic. For Node.js, pass an fs-based storage adapter.
 */
export function createPersistMiddleware(options: PersistOptions): PersistMiddleware<any, any> {
  const {
    key = 'root',
    debounce = 1000,
    storage,
    onError,
  } = options;
  if (!Number.isSafeInteger(debounce) || debounce < 0) {
    throw new RangeError('Persist debounce must be a non-negative safe integer');
  }

  if (!storage) {
    console.warn('Persist middleware created without storage adapter. State will not be saved.');
    const passThrough = (() => (next: Dispatch) => (action: Action) =>
      next(action)) as unknown as PersistMiddleware;
    passThrough.flush = async () => {};
    passThrough.dispose = () => {};
    passThrough.pending = () => false;
    return passThrough;
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestState: unknown;
  let hasPendingState = false;
  let disposed = false;

  const reportError = (error: unknown): void => {
    if (onError) {
      try {
        onError(error);
      } catch (handlerError) {
        console.error('Persist error handler failed:', handlerError);
      }
      return;
    }
    console.error('Failed to persist state:', error);
  };

  const flush = async (): Promise<void> => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (!hasPendingState || disposed) return;

    const state = latestState;
    hasPendingState = false;
    try {
      const serialized = JSON.stringify(state);
      await storage.setItem(key, serialized);
    } catch (error) {
      reportError(error);
    }
  };

  const middleware = ((store) => (next) => (action) => {
    const result = next(action);
    if (disposed) return result;
    latestState = store.getState();
    hasPendingState = true;

    // Debounce save
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, debounce);
    timer.unref?.();

    return result;
  }) as PersistMiddleware;

  middleware.flush = flush;
  middleware.dispose = () => {
    if (disposed) return;
    disposed = true;
    hasPendingState = false;
    latestState = undefined;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  middleware.pending = () => hasPendingState && !disposed;

  return middleware;
}

/**
 * Creates a logger middleware.
 * Logs actions and state changes to the console.
 */
export function createLoggerMiddleware(): Middleware<any, any> { // Added any, any for S, A
  return (store) => (next) => (action) => {
    console.log('  dispatching', action);
    const prevState = store.getState();
    const result = next(action);
    const nextState = store.getState();
    console.log('  prev state', prevState);
    console.log('  next state', nextState);
    return result;
  };
}

// =============================================================================
// Reactive Store with Lazy Proxying (inspired by arrow-js)
// =============================================================================

/**
 * Creates a deeply reactive store using Proxy with lazy child wrapping.
 *
 * Unlike the Redux-style `createStore`, this provides fine-grained reactivity
 * at every property level. Child objects become reactive only when first accessed
 * (lazy proxying), reducing initialization cost for large stores.
 *
 * @example
 * const store = createReactiveStore({
 *   user: { name: 'Alice', settings: { theme: 'dark' } },
 *   items: [1, 2, 3],
 *   count: 0,
 * });
 *
 * // Reading in an effect auto-tracks fine-grained dependencies
 * createEffect(() => {
 *   console.log(store.count);        // Only re-runs when count changes
 * });
 *
 * createEffect(() => {
 *   console.log(store.user.name);    // Only re-runs when user.name changes
 * });
 *
 * store.count = 1;                    // Triggers first effect only
 * store.user.name = 'Bob';           // Triggers second effect only
 */
export function createReactiveStore<T extends Record<string, any>>(initial: T): T {
  if (!isPlainObject(initial)) {
    throw new TypeError('Reactive store root must be a plain object');
  }
  return deepReactive(initial);
}

// WeakMap to track already-proxied objects (avoids double-proxying)
const proxyCache = new WeakMap<object, any>();

// WeakMap to store per-property signals for each reactive object
const propertySignals = new WeakMap<object, Map<string | symbol, Signal<any>>>();

function getOrCreatePropertySignal<V>(
  target: object,
  key: string | symbol,
  initialValue: V,
): Signal<V> {
  let signals = propertySignals.get(target);
  if (!signals) {
    signals = new Map();
    propertySignals.set(target, signals);
  }
  let signal = signals.get(key);
  if (!signal) {
    signal = new Signal(initialValue);
    signals.set(key, signal);
  }
  return signal as Signal<V>;
}

function deepReactive<T extends object>(obj: T): T {
  if (!isPlainObject(obj) && !Array.isArray(obj)) {
    return obj;
  }
  // Already proxied? Return cached proxy
  if (proxyCache.has(obj)) {
    return proxyCache.get(obj);
  }

  // Cache for lazily-created child proxies
  const childProxies = new Map<string | symbol, any>();

  const proxy = new Proxy(obj, {
    get(target: any, key: string | symbol, receiver: any): any {
      // Symbol & prototype access: pass through without tracking
      if (typeof key === 'symbol') {
        return Reflect.get(target, key, receiver);
      }

      const value = Reflect.get(target, key, receiver);

      // Track dependency via property signal (lazy creation)
      const signal = getOrCreatePropertySignal(target, key, value);
      signal.value; // Read triggers tracking in current effect

      // Lazy child proxying: only wrap objects when accessed
      if (isPlainObject(value) || Array.isArray(value)) {
        if (!childProxies.has(key)) {
          childProxies.set(key, deepReactive(value));
        }
        return childProxies.get(key);
      }

      return value;
    },

    set(target: any, key: string | symbol, newValue: any, receiver: any): boolean {
      const oldValue = Reflect.get(target, key, receiver);
      const oldLength = Array.isArray(target) ? target.length : undefined;
      const result = Reflect.set(target, key, newValue, receiver);

      if (result && !Object.is(oldValue, newValue)) {
        // Clear cached child proxy if value changed
        childProxies.delete(key);

        // Notify signal subscribers
        if (typeof key !== 'symbol') {
          const signal = getOrCreatePropertySignal(target, key, newValue);
          signal.value = newValue; // Triggers notify
        }
      }
      if (
        result &&
        Array.isArray(target) &&
        key !== 'length' &&
        oldLength !== target.length
      ) {
        const lengthSignal = getOrCreatePropertySignal(
          target,
          'length',
          oldLength,
        );
        lengthSignal.value = target.length;
      }

      return result;
    },

    deleteProperty(target: any, key: string | symbol): boolean {
      const had = key in target;
      const result = Reflect.deleteProperty(target, key);
      if (had && result) {
        childProxies.delete(key);
        if (typeof key !== 'symbol') {
          const signals = propertySignals.get(target);
          if (signals) {
            const signal = signals.get(key);
            if (signal) {
              signal.value = undefined;
            }
          }
        }
      }
      return result;
    },
  });

  proxyCache.set(obj, proxy);
  return proxy;
}
