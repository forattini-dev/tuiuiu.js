/**
 * Context API - Share state between components without prop drilling
 *
 * Inspired by React's Context API, adapted for Tuiuiu's signal-based system.
 *
 * @example
 * // Create context
 * const ThemeContext = createContext<'dark' | 'light'>('dark');
 *
 * // Provide value
 * ThemeContext.Provider({ value: 'light' },
 *   App()
 * )
 *
 * // Consume value
 * const theme = useContext(ThemeContext); // 'light'
 */

import type { VNode } from '../utils/types.js';
import { Box } from '../components/components.js';

/**
 * Context object returned by createContext
 */
export interface Context<T> {
  /** Current value (from nearest Provider or default) */
  _currentValue: T;
  /** Default value when no Provider exists */
  _defaultValue: T;
  /** Stack of values for nested Providers */
  _stack: T[];
  /** Display name for debugging */
  displayName?: string;
  /**
   * Provider component that sets context value for children
   *
   * @example
   * ThemeContext.Provider({ value: 'light' }, App())
   */
  Provider: (props: ContextProviderProps<T>, ...children: VNode[]) => VNode;
}

export interface ContextProviderProps<T> {
  /** Value to provide to descendants */
  value: T;
  /** Child nodes (can also be passed as rest args) */
  children?: VNode | VNode[];
}

/**
 * Create a new Context
 *
 * @param defaultValue - Value used when no Provider exists above in the tree
 * @returns Context object with Provider component
 *
 * @example
 * const UserContext = createContext<User | null>(null);
 *
 * // In app root
 * UserContext.Provider({ value: currentUser },
 *   App()
 * )
 *
 * // In any descendant component
 * const user = useContext(UserContext);
 */
export function createContext<T>(defaultValue: T): Context<T> {
  const context: Context<T> = {
    _currentValue: defaultValue,
    _defaultValue: defaultValue,
    _stack: [],

    Provider: (props: ContextProviderProps<T>, ...restChildren: VNode[]): VNode => {
      const { value, children } = props;

      // Collect all children (from props.children or rest args)
      const allChildren: VNode[] = [];
      if (children) {
        if (Array.isArray(children)) {
          allChildren.push(...children);
        } else {
          allChildren.push(children);
        }
      }
      allChildren.push(...restChildren);

      // Push current value to stack and set new value
      context._stack.push(context._currentValue);
      context._currentValue = value;

      // Create a wrapper that will restore context after render
      // We use a Box with special marker to identify it
      const wrapper = Box(
        {
          __contextProvider: true,
          __contextRestore: () => {
            // Restore previous value after children render
            const prev = context._stack.pop();
            if (prev !== undefined) {
              context._currentValue = prev;
            } else {
              context._currentValue = context._defaultValue;
            }
          },
        } as any,
        ...allChildren
      );

      return wrapper;
    },
  };

  return context;
}

/**
 * Get current value from a Context
 *
 * Returns the value from the nearest Provider above in the tree,
 * or the default value if no Provider exists.
 *
 * @param context - Context created by createContext
 * @returns Current context value
 *
 * @example
 * const theme = useContext(ThemeContext);
 * // Returns 'light' if inside ThemeContext.Provider({ value: 'light' })
 * // Returns default value otherwise
 */
export function useContext<T>(context: Context<T>): T {
  return context._currentValue;
}

/**
 * Check if currently inside a Provider for a context
 *
 * @param context - Context to check
 * @returns true if inside a Provider
 */
export function hasContext<T>(context: Context<T>): boolean {
  return context._stack.length > 0 || context._currentValue !== context._defaultValue;
}
