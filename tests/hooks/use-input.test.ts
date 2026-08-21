import { describe, expect, it, vi } from 'vitest';
import { parseKeypress } from '../../src/core/hotkeys.js';
import {
  createRuntimeScope,
  destroyRuntimeScope,
  runInRuntimeScope,
} from '../../src/core/runtime-scope.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { useInput } from '../../src/hooks/use-input.js';
import { createInteractionKeyEvent, getInteractionRuntime } from '../../src/interaction/runtime.js';

function key(input: string) {
  const parsed = parseKeypress(input);
  return { type: 'key' as const, key: createInteractionKeyEvent(parsed.input, parsed.key) };
}

describe('internal key hook adapter', () => {
  it('registers built-in controls in the InteractionRuntime and cleans up', () => {
    const scope = createRuntimeScope();
    const handler = vi.fn(() => true);
    try {
      runInRuntimeScope(scope, () => {
        beginRender('component');
        useInput(handler, { stopPropagation: true });
        endRender();
        expect(getInteractionRuntime().dispatch(key('x'))).toEqual({ status: 'handled' });
        expect(handler).toHaveBeenCalledOnce();
        resetHookState();
        expect(getInteractionRuntime().dispatch(key('x'))).toEqual({ status: 'unhandled' });
      });
    } finally {
      destroyRuntimeScope(scope);
    }
  });

  it('updates activation and the latest callback without duplicate registration', () => {
    const scope = createRuntimeScope();
    const first = vi.fn();
    const second = vi.fn();
    try {
      runInRuntimeScope(scope, () => {
        beginRender();
        useInput(first);
        endRender();
        beginRender();
        useInput(second, { isActive: false });
        endRender();
        getInteractionRuntime().dispatch(key('x'));
        expect(first).not.toHaveBeenCalled();
        expect(second).not.toHaveBeenCalled();
        beginRender();
        useInput(second);
        endRender();
        getInteractionRuntime().dispatch(key('x'));
        expect(second).toHaveBeenCalledOnce();
      });
    } finally {
      destroyRuntimeScope(scope);
    }
  });
});
