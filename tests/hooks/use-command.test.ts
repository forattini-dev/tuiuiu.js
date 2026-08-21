import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import {
  useCommand,
  useCommandBinding,
  useInteractionMode,
} from '../../src/hooks/use-command.js';
import { createInteractionKeyEvent, getInteractionRuntime } from '../../src/interaction/runtime.js';
import { parseKeypress } from '../../src/core/hotkeys.js';
import { resetDefaultRuntimeScope } from '../../src/core/runtime-scope.js';

function render(callback: () => void) {
  beginRender('component');
  callback();
  endRender();
}

function key(input: string) {
  const parsed = parseKeypress(input);
  return {
    type: 'key' as const,
    key: createInteractionKeyEvent(parsed.input, parsed.key),
  };
}

describe('semantic interaction hooks', () => {
  beforeEach(() => {
    resetHookState();
    resetDefaultRuntimeScope();
  });

  afterEach(() => {
    resetHookState();
    resetDefaultRuntimeScope();
  });

  it('keeps command behavior and metadata current across renders', () => {
    const first = vi.fn();
    const second = vi.fn();
    const component = (title: string, run: () => void) => {
      useCommand({ id: 'test.run', title, run });
      useCommandBinding({ command: 'test.run', keys: 'x' });
    };

    render(() => component('First title', first));
    render(() => component('Second title', second));
    expect(getInteractionRuntime().inspect().commands[0]!.title).toBe('Second title');
    getInteractionRuntime().dispatch(key('x'));
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('updates binding predicates without creating another binding', () => {
    const run = vi.fn();
    let enabled = false;
    const component = () => {
      useCommand({ id: 'test.when', title: 'Conditional', run });
      useCommandBinding({ command: 'test.when', keys: 'w', when: () => enabled });
    };

    render(component);
    expect(getInteractionRuntime().dispatch(key('w')).status).toBe('unhandled');
    enabled = true;
    render(component);
    expect(getInteractionRuntime().dispatch(key('w')).status).toBe('handled');
    expect(getInteractionRuntime().inspect().bindings).toHaveLength(1);
  });

  it('owns and releases exact interaction mode leases', () => {
    const component = (active: boolean) => {
      useInteractionMode({ mode: 'dialog', target: 'one', exclusive: true }, active);
    };

    render(() => component(true));
    expect(getInteractionRuntime().inspect()).toMatchObject({
      mode: 'dialog',
      target: 'one',
      exclusive: true,
    });
    render(() => component(false));
    expect(getInteractionRuntime().inspect()).toMatchObject({ mode: 'global', exclusive: false });
  });
});
