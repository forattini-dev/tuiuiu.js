/**
 * Storybook Global Store
 *
 * Manages global state for the Storybook application, primarily focused on
 * the development experience (Logs, Theme toggling, etc).
 */

import { createStore, type Action } from '../primitives/store.js';

// =============================================================================
// Types
// =============================================================================

export type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string[];
  timestamp: number;
}

export interface StorybookState {
  logs: LogEntry[];
  isLogOpen: boolean;
  maxLogs: number;
  // Search state
  searchVisible: boolean;
  searchQuery: string;
}

// Actions
export interface AddLogAction extends Action { type: 'ADD_LOG'; payload: { level: LogLevel; args: any[] }; }
export interface ToggleLogAction extends Action { type: 'TOGGLE_LOG'; }
export interface ClearLogsAction extends Action { type: 'CLEAR_LOGS'; }
export interface ToggleSearchAction extends Action { type: 'TOGGLE_SEARCH'; }
export interface SetSearchQueryAction extends Action { type: 'SET_SEARCH_QUERY'; payload: string; }
export interface CloseSearchAction extends Action { type: 'CLOSE_SEARCH'; }

export type StorybookAction =
  | AddLogAction
  | ToggleLogAction
  | ClearLogsAction
  | ToggleSearchAction
  | SetSearchQueryAction
  | CloseSearchAction;

// =============================================================================
// Reducer
// =============================================================================

const initialState: StorybookState = {
  logs: [],
  isLogOpen: false, // Collapsed by default, toggle with F12
  maxLogs: 100, // Keep memory sane
  // Search state
  searchVisible: false,
  searchQuery: '',
};

function storybookReducer(state: StorybookState = initialState, action: StorybookAction): StorybookState {
  switch (action.type) {
    case 'ADD_LOG': {
      const entry: LogEntry = {
        id: Math.random().toString(36).substr(2, 9),
        level: action.payload.level,
        message: action.payload.args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ),
        timestamp: Date.now(),
      };

      const newLogs = [...state.logs, entry];
      if (newLogs.length > state.maxLogs) {
        newLogs.shift(); // Remove oldest
      }

      // Auto-open on error if desired, or keep current state
      const shouldOpen = action.payload.level === 'error' ? true : state.isLogOpen;

      return {
        ...state,
        logs: newLogs,
        // Uncomment to auto-open on error:
        // isLogOpen: shouldOpen
      };
    }

    case 'TOGGLE_LOG':
      return {
        ...state,
        isLogOpen: !state.isLogOpen,
      };

    case 'CLEAR_LOGS':
      return {
        ...state,
        logs: [],
      };

    case 'TOGGLE_SEARCH':
      return {
        ...state,
        searchVisible: !state.searchVisible,
        searchQuery: state.searchVisible ? '' : state.searchQuery, // Clear on close
      };

    case 'SET_SEARCH_QUERY':
      return {
        ...state,
        searchQuery: action.payload,
      };

    case 'CLOSE_SEARCH':
      return {
        ...state,
        searchVisible: false,
        searchQuery: '',
      };

    default:
      return state;
  }
}

// =============================================================================
// Store Instance
// =============================================================================

export const storybookStore = createStore(storybookReducer, initialState);

// =============================================================================
// Console Interceptor
// =============================================================================

/**
 * Patches the global console object to redirect logs to the Redux store.
 */
export function interceptConsole() {
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;
  const originalDebug = console.debug;

  function dispatchLog(level: LogLevel, args: any[]) {
    // We dispatch to store. 
    // IMPORTANT: We must NOT log inside the reducer or subscribers using console.* 
    // or we'll get an infinite loop.
    storybookStore.dispatch({
      type: 'ADD_LOG',
      payload: { level, args }
    });
  }

  console.log = (...args: any[]) => dispatchLog('log', args);
  console.warn = (...args: any[]) => dispatchLog('warn', args);
  console.error = (...args: any[]) => dispatchLog('error', args);
  console.info = (...args: any[]) => dispatchLog('info', args);
  console.debug = (...args: any[]) => dispatchLog('debug', args);

  return () => {
    // Restore function
    console.log = originalLog;
    console.warn = originalWarn;
    console.error = originalError;
    console.info = originalInfo;
    console.debug = originalDebug;
  };
}
