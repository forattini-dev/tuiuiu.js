/**
 * Reactive Store - State management powered by Signals
 *
 * Combines the predictability of Reducers with the performance of fine-grained reactivity.
 */

import { createSignal, createEffect, type Signal } from './signal.js';

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
  
  const listeners = new Set<() => void>();
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

    // Notify manual subscribers (outside of signal graph)
    listeners.forEach((listener) => listener());

    return action;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
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
    let dispatch: Dispatch<A> = (action: A) => {
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

// =============================================================================
// Persistence Middleware
// =============================================================================

export interface PersistOptions {
  /** File path to save state */
  path?: string; // In browser/mock env, this might be localStorage key
  /** Key to use if using localStorage */
  key?: string;
  /** Save format */
  format?: 'json';
  /** Debounce save time in ms */
  debounce?: number;
  /** Storage engine adapter */
  storage?: {
    getItem: (key: string) => string | null | Promise<string | null>;
    setItem: (key: string, value: string) => void | Promise<void>;
  };
}

/**
 * Creates a persistence middleware.
 * Note: Actual file I/O should be injected via `storage` to keep this primitive environment-agnostic.
 * For Node.js, pass an fs-based storage adapter.
 */
export function createPersistMiddleware(options: PersistOptions): Middleware<any, any> { // Added any, any for S, A
  const {
    key = 'root',
    format = 'json',
    debounce = 1000,
    storage
  } = options;

  if (!storage) {
    console.warn('Persist middleware created without storage adapter. State will not be saved.');
    return () => (next) => (action) => next(action);
  }

  let timer: any = null;

  return (store) => (next) => (action) => {
    const result = next(action);
    const state = store.getState();

    // Debounce save
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const serialized = JSON.stringify(state);
        storage.setItem(key, serialized);
      } catch (e) {
        console.error('Failed to persist state:', e);
      }
    }, debounce);

    return result;
  };
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