import { describe, expect, it, vi } from 'vitest';
import {
  createRuntimeScope,
  destroyRuntimeScope,
  runInRuntimeScope,
} from '../../src/core/runtime-scope.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { usePaste } from '../../src/hooks/use-paste.js';
import { getInteractionRuntime } from '../../src/interaction/runtime.js';

describe('internal paste hook adapter', () => {
  it('routes paste through the InteractionRuntime and disposes with its owner', () => {
    const scope = createRuntimeScope();
    const handler = vi.fn(() => true);
    try {
      runInRuntimeScope(scope, () => {
        beginRender();
        usePaste(handler, { stopPropagation: true });
        endRender();
        expect(getInteractionRuntime().dispatch({ type: 'paste', text: 'hello', bracketed: true }))
          .toEqual({ status: 'handled' });
        expect(handler).toHaveBeenCalledWith({ text: 'hello', isBracketed: true });
        resetHookState();
        expect(getInteractionRuntime().dispatch({ type: 'paste', text: 'late', bracketed: true }))
          .toEqual({ status: 'unhandled' });
      });
    } finally {
      destroyRuntimeScope(scope);
    }
  });
});
