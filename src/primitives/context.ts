/**
 * Context API - synchronous tree-scoped values without JSX.
 *
 * Components in tuiuiu are ordinary function calls, so an already-created
 * VNode cannot retroactively observe a Provider. Pass descendants as render
 * functions when they read context:
 *
 * ThemeContext.Provider({ value: 'dark' }, () => App())
 */

import type { VNode } from '../utils/types.js';
import { Box } from './nodes.js';

export type ContextRenderResult =
  | VNode
  | VNode[]
  | null
  | undefined;

export type ContextChild =
  | VNode
  | (() => ContextRenderResult);

export interface Context<T> {
  /** Current synchronous value; public for backwards-compatible inspection. */
  _currentValue: T;
  /** Default value used outside every Provider. */
  _defaultValue: T;
  /** Active provider values, primarily exposed for diagnostics. */
  _stack: T[];
  /** Display name for debugging. */
  displayName?: string;
  /**
   * Evaluates render-function children within this context value.
   *
   * Eager VNodes are accepted as layout children, but any `useContext()` calls
   * used to create them have already happened. Use `() => Child()` whenever a
   * descendant reads this context.
   */
  Provider: (
    props: ContextProviderProps<T>,
    ...children: ContextChild[]
  ) => VNode;
}

export interface ContextProviderProps<T> {
  value: T;
  children?: ContextChild | ContextChild[];
}

function appendContextResult(
  target: VNode[],
  result: ContextRenderResult,
): void {
  if (result === null || result === undefined) return;
  if (Array.isArray(result)) {
    target.push(...result);
  } else {
    target.push(result);
  }
}

/**
 * Runs a function with a context value and always restores the previous scope.
 */
export function withContext<T, R>(
  context: Context<T>,
  value: T,
  render: () => R,
): R {
  const previous = context._currentValue;
  context._stack.push(value);
  context._currentValue = value;

  try {
    return render();
  } finally {
    context._stack.pop();
    context._currentValue = previous;
  }
}

export function createContext<T>(defaultValue: T): Context<T> {
  const context: Context<T> = {
    _currentValue: defaultValue,
    _defaultValue: defaultValue,
    _stack: [],

    Provider: (
      props: ContextProviderProps<T>,
      ...restChildren: ContextChild[]
    ): VNode => {
      const requestedChildren = props.children === undefined
        ? []
        : Array.isArray(props.children)
          ? props.children
          : [props.children];
      const allChildren = [...requestedChildren, ...restChildren];

      const renderedChildren = withContext(context, props.value, () => {
        const results: VNode[] = [];
        for (const child of allChildren) {
          appendContextResult(
            results,
            typeof child === 'function' ? child() : child,
          );
        }
        return results;
      });

      return Box(
        {
          __contextProvider: true,
          'aria-label': context.displayName
            ? `${context.displayName} Provider`
            : 'Context Provider',
        } as any,
        ...renderedChildren,
      );
    },
  };

  return context;
}

export function useContext<T>(context: Context<T>): T {
  return context._currentValue;
}

export function hasContext<T>(context: Context<T>): boolean {
  return context._stack.length > 0;
}
