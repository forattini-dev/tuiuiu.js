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
}

interface ContextState<T> {
  currentValue: T;
  stack: T[];
}

const contextStates = new WeakMap<object, ContextState<unknown>>();

function getContextState<T>(context: Context<T>): ContextState<T> {
  const state = contextStates.get(context) as ContextState<T> | undefined;
  if (!state) throw new TypeError('Context must be created with createContext()');
  return state;
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
  const state = getContextState(context);
  const previous = state.currentValue;
  state.stack.push(value);
  state.currentValue = value;

  try {
    return render();
  } finally {
    state.stack.pop();
    state.currentValue = previous;
  }
}

export function createContext<T>(defaultValue: T): Context<T> {
  const context: Context<T> = {
    Provider: (
      props: ContextProviderProps<T>,
      ...restChildren: ContextChild[]
    ): VNode => {
      const renderedChildren = withContext(context, props.value, () => {
        const results: VNode[] = [];
        for (const child of restChildren) {
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

  contextStates.set(context, {
    currentValue: defaultValue,
    stack: [],
  });

  return context;
}

export function useContext<T>(context: Context<T>): T {
  return getContextState(context).currentValue;
}

export function hasContext<T>(context: Context<T>): boolean {
  return getContextState(context).stack.length > 0;
}
