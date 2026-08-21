import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  bindRuntimeScope, createRuntimeScope, destroyRuntimeScope, getRuntimeResource, RUNTIME_RESOURCE_DISPOSE, runInRuntimeScope, type RuntimeScope, } from '../../src/core/runtime-scope.js';
import {
  beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { dispatchTestKey, getTestInteractionHandlerCount } from '../../src/testing/interaction.js';
import { useInput } from '../../src/hooks/use-input.js';
import { useState } from '../../src/hooks/use-state.js';
import { createEmptyKey } from '../helpers/keyboard.js';

describe('RuntimeScope', () => {
  const scopes: RuntimeScope[] = [];

  function createScope(): RuntimeScope {
    const scope = createRuntimeScope();
    scopes.push(scope);
    return scope;
  }

  afterEach(() => {
    for (const scope of scopes.splice(0)) {
      resetHookState(scope);
      destroyRuntimeScope(scope);
    }
  });

  it('isolates arbitrary resources and preserves scope across async work', async () => {
    const first = createScope();
    const second = createScope();
    const resource = Symbol('test-resource');

    await runInRuntimeScope(first, async () => {
      getRuntimeResource<string[]>(resource, () => []).push('first');
      await Promise.resolve();
      expect(getRuntimeResource<string[]>(resource, () => [])).toEqual(['first']);
    });

    runInRuntimeScope(second, () => {
      expect(getRuntimeResource<string[]>(resource, () => [])).toEqual([]);
      getRuntimeResource<string[]>(resource, () => []).push('second');
    });

    runInRuntimeScope(first, () => {
      expect(getRuntimeResource<string[]>(resource, () => [])).toEqual(['first']);
    });
  });

  it('disposes owned resources exactly once when the scope is destroyed', () => {
    const scope = createScope();
    const dispose = vi.fn();
    const resource = Symbol('disposable-resource');

    runInRuntimeScope(scope, () => {
      getRuntimeResource(resource, () => ({
        [RUNTIME_RESOURCE_DISPOSE]: dispose,
      }));
    });

    destroyRuntimeScope(scope);
    destroyRuntimeScope(scope);

    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('binds callbacks to the owning runtime', () => {
    const first = createScope();
    const second = createScope();
    const resource = Symbol('bound-resource');
    const callback = bindRuntimeScope(first, () => {
      getRuntimeResource<string[]>(resource, () => []).push('bound');
    });

    runInRuntimeScope(second, callback);

    runInRuntimeScope(first, () => {
      expect(getRuntimeResource<string[]>(resource, () => [])).toEqual(['bound']);
    });
    runInRuntimeScope(second, () => {
      expect(getRuntimeResource<string[]>(resource, () => [])).toEqual([]);
    });
  });

  it('isolates hook state and input handlers between roots', () => {
    const first = createScope();
    const second = createScope();
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();

    runInRuntimeScope(first, () => {
      beginRender();
      const [value] = useState('first');
      useInput(firstHandler);
      endRender();
      expect(value()).toBe('first');
      expect(getTestInteractionHandlerCount()).toBe(1);
    });

    runInRuntimeScope(second, () => {
      beginRender();
      const [value] = useState('second');
      useInput(secondHandler);
      endRender();
      expect(value()).toBe('second');
      expect(getTestInteractionHandlerCount()).toBe(1);
    });

    runInRuntimeScope(first, () => {
      dispatchTestKey('a', createEmptyKey());
    });

    expect(firstHandler).toHaveBeenCalledTimes(1);
    expect(secondHandler).not.toHaveBeenCalled();
  });
});
