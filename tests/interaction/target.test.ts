import { describe, expect, it, vi } from 'vitest';
import { parseKeypress } from '../../src/core/hotkeys.js';
import { createInteractionKeyEvent, createInteractionRuntime } from '../../src/interaction/runtime.js';
import { createInteractionTarget } from '../../src/interaction/target.js';

function key(input: string) {
  const parsed = parseKeypress(input);
  return { type: 'key' as const, key: createInteractionKeyEvent(parsed.input, parsed.key) };
}

describe('InteractionTarget', () => {
  it('owns focus, commands and handlers as one disposable unit', () => {
    const runtime = createInteractionRuntime();
    const run = vi.fn();
    const target = createInteractionTarget({ id: 'editor', mode: 'editing', runtime, exclusive: true });
    target.command({ id: 'editor.submit', title: 'Submit', run }, 'enter');
    target.focus();

    expect(runtime.inspect()).toMatchObject({ mode: 'editing', target: 'editor', exclusive: true });
    expect(runtime.dispatch(key('\r'))).toMatchObject({ status: 'handled', command: 'editor.submit' });
    expect(run).toHaveBeenCalledOnce();

    target.dispose();
    expect(runtime.inspect().commands).toEqual([]);
    expect(runtime.inspect().mode).toBe('global');
  });

  it('allows exact targets to dispose out of order', () => {
    const runtime = createInteractionRuntime();
    const first = createInteractionTarget({ id: 'first', runtime });
    const second = createInteractionTarget({ id: 'second', runtime });
    first.focus();
    second.focus();
    first.dispose();
    expect(runtime.inspect().target).toBe('second');
    second.dispose();
    expect(runtime.inspect().target).toBeUndefined();
  });
});
