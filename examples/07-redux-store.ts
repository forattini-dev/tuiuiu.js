/**
 * Example 07: Redux-inspired Reactive Store with Persistence
 *
 * Demonstrates:
 * - createStore for global state management
 * - Reducers for predictable state updates
 * - applyMiddleware for adding logger and persistence
 * - createNodeFsStorage for file-system persistence in Node.js
 * - Signals for reactive UI updates
 *
 * Run: pnpm tsx examples/07-redux-store.ts
 */

import { render, Box, Text, useInput, useApp } from '../src/index.js';
import {
  createStore,
  createLoggerMiddleware,
  createPersistMiddleware,
  applyMiddleware,
  type Action,
} from '../src/primitives/store.js';
import { createNodeFsStorage } from '../src/utils/fs-storage.js';

// =============================================================================
// 1. State Definition and Reducer
// =============================================================================

interface AppState {
  count: number;
  lastAction: string;
  isLoggedIn: boolean;
  username: string | null;
}

// Actions
interface IncrementAction extends Action { type: 'INCREMENT'; payload: number; }
interface DecrementAction extends Action { type: 'DECREMENT'; payload: number; }
interface LoginAction extends Action { type: 'LOGIN'; payload: { username: string; }; }
interface LogoutAction extends Action { type: 'LOGOUT'; }
type AppActions = IncrementAction | DecrementAction | LoginAction | LogoutAction;


const initialState: AppState = {
  count: 0,
  lastAction: 'INIT',
  isLoggedIn: false,
  username: null,
};

function appReducer(state: AppState = initialState, action: AppActions): AppState {
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state,
        count: state.count + action.payload,
        lastAction: 'INCREMENT',
      };
    case 'DECREMENT':
      return {
        ...state,
        count: state.count - action.payload,
        lastAction: 'DECREMENT',
      };
    case 'LOGIN':
      return {
        ...state,
        isLoggedIn: true,
        username: action.payload.username,
        lastAction: 'LOGIN',
      };
    case 'LOGOUT':
      return {
        ...state,
        isLoggedIn: false,
        username: null,
        lastAction: 'LOGOUT',
      };
    default:
      return state;
  }
}

// =============================================================================
// 2. Store Creation with Middlewares
// =============================================================================

// File system storage adapter for Node.js
const fsStorage = createNodeFsStorage({
  dir: './.app-data', // Directory to store persisted state
  ext: '.json',
});

// Load initial state from persistence if available
// Note: This is an async operation, createStore expects sync preloadedState.
// For a real app, you'd load state first, then create store or handle async load.
// For this example, we'll try to load sync or use initial.
let preloadedState = initialState;
try {
  const persistedState = fsStorage.getItem('appState');
  if (persistedState) {
    preloadedState = JSON.parse(persistedState);
    console.log('Loaded persisted state:', preloadedState);
  }
} catch (error) {
  console.warn('Could not load persisted state, starting with initial state:', error);
}


const store = createStore(
  appReducer,
  preloadedState,
  applyMiddleware(
    createLoggerMiddleware(),
    createPersistMiddleware({ key: 'appState', storage: fsStorage, debounce: 500 })
  )
);

// =============================================================================
// 3. TUI Component
// =============================================================================

function App(): VNode {
  const { exit } = useApp();
  
  // Reactive access to store state
  const state = store.state;

  useInput((char, key) => {
    if (key.upArrow) {
      store.dispatch({ type: 'INCREMENT', payload: 1 });
    }
    if (key.downArrow) {
      store.dispatch({ type: 'DECREMENT', payload: 1 });
    }
    if (char === 'l') {
      if (state().isLoggedIn) {
        store.dispatch({ type: 'LOGOUT' });
      } else {
        store.dispatch({ type: 'LOGIN', payload: { username: 'tuiuiu-user' } });
      }
    }
    if (char === 'r') {
        // Reset state
        store.replaceReducer(appReducer); // Re-initialize with original reducer to reset state
        store.dispatch({ type: '@@INIT' } as AppActions);
    }
    if (key.escape || (key.ctrl && char === 'c')) {
      exit();
    }
  });

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '📦 Tuiuiu Reactive Store Example'),
    Text({}),
    Box(
      { borderStyle: 'round', borderColor: 'blue', padding: 1 },
      Text({ color: 'yellow', bold: true }, `Count: ${state().count}`),
      Text({}),
      state().isLoggedIn
        ? Text({ color: 'green' }, `Logged in as: ${state().username}`)
        : Text({ color: 'red' }, 'Not logged in'),
      Text({}),
      Text({ color: 'gray', dim: true }, `Last Action: ${state().lastAction}`)
    ),
    Text({}),
    Text({ color: 'gray', dim: true }, '↑/↓: Inc/Dec Count | L: Login/Logout | R: Reset State | ESC/Ctrl+C: Quit'),
    Text({ color: 'gray', dim: true }, 'State is persisted to ./.app-data/appState.json'),
  );
}

// Initial dispatch for any middleware that needs to run on setup
store.dispatch({ type: '@@INIT' } as AppActions);

const { waitUntilExit } = render(App);
await waitUntilExit();
