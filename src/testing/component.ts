import {
  abortRender,
  beginRender,
  endRender,
  resetHookState,
} from '../hooks/context.js';
import {
  createRuntimeScope,
  destroyRuntimeScope,
  runInRuntimeScope,
} from '../core/runtime-scope.js';

/** Evaluate one stateful component tree in an isolated test owner. */
export function renderTestComponent<TResult>(render: () => TResult): TResult {
  const scope = createRuntimeScope();
  try {
    return runInRuntimeScope(scope, () => {
      beginRender('component');
      try {
        const result = render();
        endRender();
        return result;
      } catch (error) {
        abortRender();
        throw error;
      } finally {
        resetHookState(scope);
      }
    });
  } finally {
    destroyRuntimeScope(scope);
  }
}

/** Keep an isolated component owner alive while an interaction assertion runs. */
export function withTestComponent<TResult, TAssertion>(
  render: () => TResult,
  assert: (result: TResult) => TAssertion,
): TAssertion {
  const scope = createRuntimeScope();
  try {
    return runInRuntimeScope(scope, () => {
      beginRender('component');
      try {
        const result = render();
        endRender();
        return assert(result);
      } catch (error) {
        abortRender();
        throw error;
      } finally {
        resetHookState(scope);
      }
    });
  } finally {
    destroyRuntimeScope(scope);
  }
}

/** Wrap a stateful component so unit tests can call it outside an app render. */
export function testComponent<TComponent extends (...args: any[]) => any>(
  ownedComponent: TComponent,
): TComponent {
  return ((...args: Parameters<TComponent>) => {
    beginRender('component');
    try {
      const result = ownedComponent(...args);
      endRender();
      return result;
    } catch (error) {
      abortRender();
      throw error;
    }
  }) as TComponent;
}
