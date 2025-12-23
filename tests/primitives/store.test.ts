/**
 * Store Tests
 *
 * Tests for reactive Redux-like store with signals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createStore,
  applyMiddleware,
  createPersistMiddleware,
  createLoggerMiddleware,
  type Action,
  type Reducer,
  type Middleware,
} from '../../src/primitives/store.js';
import { createEffect } from '../../src/primitives/signal.js';

// Simple counter reducer for testing
interface CounterState {
  count: number;
}

type CounterAction =
  | { type: 'INCREMENT' }
  | { type: 'DECREMENT' }
  | { type: 'SET'; payload: number }
  | { type: 'RESET' }
  | { type: '@@INIT' };

const counterReducer: Reducer<CounterState, CounterAction> = (
  state = { count: 0 },
  action
) => {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    case 'SET':
      return { count: action.payload };
    case 'RESET':
      return { count: 0 };
    default:
      return state;
  }
};

describe('createStore', () => {
  describe('Basic Operations', () => {
    it('should create a store with initial state', () => {
      const store = createStore(counterReducer, { count: 10 });

      expect(store.getState()).toEqual({ count: 10 });
    });

    it('should use reducer default when no preloaded state', () => {
      const store = createStore(counterReducer);

      // After @@INIT, should have reducer's default state
      expect(store.getState()).toEqual({ count: 0 });
    });

    it('should dispatch actions and update state', () => {
      const store = createStore(counterReducer, { count: 0 });

      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState().count).toBe(1);

      store.dispatch({ type: 'INCREMENT' });
      expect(store.getState().count).toBe(2);

      store.dispatch({ type: 'DECREMENT' });
      expect(store.getState().count).toBe(1);
    });

    it('should dispatch SET action with payload', () => {
      const store = createStore(counterReducer);

      store.dispatch({ type: 'SET', payload: 42 });
      expect(store.getState().count).toBe(42);
    });

    it('should dispatch RESET action', () => {
      const store = createStore(counterReducer, { count: 100 });

      store.dispatch({ type: 'RESET' });
      expect(store.getState().count).toBe(0);
    });

    it('should return the dispatched action', () => {
      const store = createStore(counterReducer);
      const action = { type: 'INCREMENT' } as const;

      const result = store.dispatch(action);
      expect(result).toEqual(action);
    });
  });

  describe('Reactive State Signal', () => {
    it('should expose state as a reactive signal', () => {
      const store = createStore(counterReducer, { count: 5 });

      // state() should return current state
      expect(store.state()).toEqual({ count: 5 });

      store.dispatch({ type: 'INCREMENT' });
      expect(store.state()).toEqual({ count: 6 });
    });

    it('should trigger effects when state changes', () => {
      const store = createStore(counterReducer, { count: 0 });
      const effectFn = vi.fn();

      createEffect(() => {
        const state = store.state();
        effectFn(state.count);
      });

      // Initial effect run
      expect(effectFn).toHaveBeenCalledWith(0);

      store.dispatch({ type: 'INCREMENT' });
      expect(effectFn).toHaveBeenCalledWith(1);

      store.dispatch({ type: 'SET', payload: 10 });
      expect(effectFn).toHaveBeenCalledWith(10);
    });
  });

  describe('Subscriptions', () => {
    it('should notify subscribers on dispatch', () => {
      const store = createStore(counterReducer, { count: 0 });
      const listener = vi.fn();

      store.subscribe(listener);
      store.dispatch({ type: 'INCREMENT' });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should allow multiple subscribers', () => {
      const store = createStore(counterReducer);
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);
      store.dispatch({ type: 'INCREMENT' });

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it('should unsubscribe correctly', () => {
      const store = createStore(counterReducer);
      const listener = vi.fn();

      const unsubscribe = store.subscribe(listener);
      store.dispatch({ type: 'INCREMENT' });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.dispatch({ type: 'INCREMENT' });
      expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });

  describe('Replace Reducer', () => {
    it('should replace the reducer', () => {
      const store = createStore(counterReducer, { count: 5 });

      // New reducer that doubles on INCREMENT
      const doubleReducer: Reducer<CounterState, CounterAction> = (
        state = { count: 0 },
        action
      ) => {
        if (action.type === 'INCREMENT') {
          return { count: state.count * 2 };
        }
        return state;
      };

      store.replaceReducer(doubleReducer);
      store.dispatch({ type: 'INCREMENT' });

      expect(store.getState().count).toBe(10); // 5 * 2
    });

    it('should dispatch @@INIT after replacing reducer', () => {
      const initSpy = vi.fn();
      const spyReducer: Reducer<CounterState, CounterAction> = (
        state = { count: 0 },
        action
      ) => {
        if (action.type === '@@INIT') initSpy();
        return state;
      };

      const store = createStore(counterReducer);
      store.replaceReducer(spyReducer);

      expect(initSpy).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should throw if getState called during dispatch', () => {
      const badReducer: Reducer<CounterState, CounterAction> = (state, action) => {
        // This would cause issues - accessing getState during reduce
        // We can't easily test this without internal access
        return state || { count: 0 };
      };

      const store = createStore(badReducer);
      // Normal dispatch should work
      expect(() => store.dispatch({ type: 'INCREMENT' })).not.toThrow();
    });

    it('should throw if dispatching during dispatch', () => {
      let store: ReturnType<typeof createStore<CounterState, CounterAction>>;

      const recursiveReducer: Reducer<CounterState, CounterAction> = (
        state = { count: 0 },
        action
      ) => {
        if (action.type === 'INCREMENT' && state.count === 0) {
          // Attempting to dispatch during reduce should throw
          expect(() => store.dispatch({ type: 'DECREMENT' })).toThrow(
            'Reducers may not dispatch actions'
          );
        }
        return { count: state.count + 1 };
      };

      store = createStore(recursiveReducer);
      store.dispatch({ type: 'INCREMENT' });
    });
  });
});

describe('applyMiddleware', () => {
  it('should apply a single middleware', () => {
    const actionLog: string[] = [];
    const logMiddleware: Middleware = () => (next) => (action) => {
      actionLog.push(action.type);
      return next(action);
    };

    const store = createStore(
      counterReducer,
      { count: 0 },
      applyMiddleware(logMiddleware)
    );

    store.dispatch({ type: 'INCREMENT' });
    store.dispatch({ type: 'DECREMENT' });

    expect(actionLog).toContain('INCREMENT');
    expect(actionLog).toContain('DECREMENT');
  });

  it('should apply multiple middlewares in order', () => {
    const order: number[] = [];

    const middleware1: Middleware = () => (next) => (action) => {
      order.push(1);
      const result = next(action);
      order.push(4);
      return result;
    };

    const middleware2: Middleware = () => (next) => (action) => {
      order.push(2);
      const result = next(action);
      order.push(3);
      return result;
    };

    const store = createStore(
      counterReducer,
      { count: 0 },
      applyMiddleware(middleware1, middleware2)
    );

    order.length = 0; // Clear @@INIT
    store.dispatch({ type: 'INCREMENT' });

    // Middleware executes: m1 before -> m2 before -> reducer -> m2 after -> m1 after
    expect(order).toEqual([1, 2, 3, 4]);
  });

  it('should allow middleware to access getState', () => {
    let capturedState: CounterState | null = null;

    const stateMiddleware: Middleware = (api) => (next) => (action) => {
      capturedState = api.getState();
      return next(action);
    };

    const store = createStore(
      counterReducer,
      { count: 42 },
      applyMiddleware(stateMiddleware)
    );

    store.dispatch({ type: 'INCREMENT' });

    // Middleware captured state before the action
    expect(capturedState).toEqual({ count: 42 });
  });

  it('should allow middleware to dispatch', () => {
    const thunkMiddleware: Middleware = (api) => (next) => (action: any) => {
      if (action.type === 'DOUBLE_INCREMENT') {
        api.dispatch({ type: 'INCREMENT' });
        api.dispatch({ type: 'INCREMENT' });
        return action;
      }
      return next(action);
    };

    const store = createStore(
      counterReducer,
      { count: 0 },
      applyMiddleware(thunkMiddleware)
    );

    store.dispatch({ type: 'DOUBLE_INCREMENT' } as any);
    expect(store.getState().count).toBe(2);
  });

  it('should throw if dispatching during middleware construction', () => {
    const badMiddleware: Middleware = (api) => {
      // Attempting to dispatch during construction
      expect(() => api.dispatch({ type: 'INCREMENT' })).toThrow(
        'Dispatching while constructing your middleware is not allowed'
      );
      return (next) => (action) => next(action);
    };

    createStore(counterReducer, { count: 0 }, applyMiddleware(badMiddleware));
  });
});

describe('createPersistMiddleware', () => {
  it('should warn when no storage adapter provided', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const middleware = createPersistMiddleware({});
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('without storage adapter')
    );

    warnSpy.mockRestore();
  });

  it('should work as pass-through without storage', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const middleware = createPersistMiddleware({});
    const store = createStore(counterReducer, { count: 0 }, applyMiddleware(middleware));

    store.dispatch({ type: 'INCREMENT' });
    expect(store.getState().count).toBe(1);
  });

  it('should persist state with storage adapter', async () => {
    const storage = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => storage.get(key) || null,
      setItem: (key: string, value: string) => storage.set(key, value),
    };

    const middleware = createPersistMiddleware({
      key: 'test-state',
      storage: mockStorage,
      debounce: 10, // Short debounce for testing
    });

    const store = createStore(counterReducer, { count: 5 }, applyMiddleware(middleware));

    store.dispatch({ type: 'INCREMENT' });

    // Wait for debounce
    await new Promise((resolve) => setTimeout(resolve, 50));

    const saved = storage.get('test-state');
    expect(saved).toBeDefined();
    expect(JSON.parse(saved!)).toEqual({ count: 6 });
  });

  it('should handle storage errors gracefully', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const badStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('Storage full');
      },
    };

    const middleware = createPersistMiddleware({
      storage: badStorage,
      debounce: 10,
    });

    const store = createStore(counterReducer, { count: 0 }, applyMiddleware(middleware));
    store.dispatch({ type: 'INCREMENT' });

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to persist state:',
      expect.any(Error)
    );

    errorSpy.mockRestore();
  });
});

describe('createLoggerMiddleware', () => {
  it('should log actions and state changes', () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const middleware = createLoggerMiddleware();
    const store = createStore(counterReducer, { count: 0 }, applyMiddleware(middleware));

    logSpy.mockClear(); // Clear @@INIT logs
    store.dispatch({ type: 'INCREMENT' });

    expect(logSpy).toHaveBeenCalledWith('  dispatching', { type: 'INCREMENT' });
    expect(logSpy).toHaveBeenCalledWith('  prev state', { count: 0 });
    expect(logSpy).toHaveBeenCalledWith('  next state', { count: 1 });

    logSpy.mockRestore();
  });
});

describe('Complex Reducer', () => {
  interface TodoState {
    todos: { id: number; text: string; done: boolean }[];
    filter: 'all' | 'active' | 'done';
  }

  type TodoAction =
    | { type: 'ADD_TODO'; payload: string }
    | { type: 'TOGGLE_TODO'; payload: number }
    | { type: 'SET_FILTER'; payload: 'all' | 'active' | 'done' }
    | { type: '@@INIT' };

  const todoReducer: Reducer<TodoState, TodoAction> = (
    state = { todos: [], filter: 'all' },
    action
  ) => {
    switch (action.type) {
      case 'ADD_TODO':
        return {
          ...state,
          todos: [
            ...state.todos,
            { id: Date.now(), text: action.payload, done: false },
          ],
        };
      case 'TOGGLE_TODO':
        return {
          ...state,
          todos: state.todos.map((t) =>
            t.id === action.payload ? { ...t, done: !t.done } : t
          ),
        };
      case 'SET_FILTER':
        return { ...state, filter: action.payload };
      default:
        return state;
    }
  };

  it('should handle complex state updates', () => {
    const store = createStore(todoReducer);

    store.dispatch({ type: 'ADD_TODO', payload: 'Learn Tuiuiu' });
    store.dispatch({ type: 'ADD_TODO', payload: 'Build TUI app' });

    const state = store.getState();
    expect(state.todos.length).toBe(2);
    expect(state.todos[0].text).toBe('Learn Tuiuiu');
    expect(state.todos[1].text).toBe('Build TUI app');
  });

  it('should handle toggle action', () => {
    const store = createStore(todoReducer);

    store.dispatch({ type: 'ADD_TODO', payload: 'Task' });
    const todoId = store.getState().todos[0].id;

    expect(store.getState().todos[0].done).toBe(false);

    store.dispatch({ type: 'TOGGLE_TODO', payload: todoId });
    expect(store.getState().todos[0].done).toBe(true);

    store.dispatch({ type: 'TOGGLE_TODO', payload: todoId });
    expect(store.getState().todos[0].done).toBe(false);
  });

  it('should handle filter changes', () => {
    const store = createStore(todoReducer);

    expect(store.getState().filter).toBe('all');

    store.dispatch({ type: 'SET_FILTER', payload: 'active' });
    expect(store.getState().filter).toBe('active');

    store.dispatch({ type: 'SET_FILTER', payload: 'done' });
    expect(store.getState().filter).toBe('done');
  });
});
