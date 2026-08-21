import { describe, expect, it, vi } from 'vitest';
import { createCollectionController } from '../../src/interaction/collection.js';
import { createCollectionBindings } from '../../src/interaction/collection-bindings.js';
import { createInteractionKeyEvent, createInteractionRuntime } from '../../src/interaction/runtime.js';
import { parseKeypress } from '../../src/core/hotkeys.js';

function key(value: string) {
  const parsed = parseKeypress(value);
  return { type: 'key' as const, key: createInteractionKeyEvent(parsed.input, parsed.key) };
}

describe('createCollectionBindings', () => {
  it('owns navigation, activation and exact disposal for one target', () => {
    const runtime = createInteractionRuntime();
    const controller = createCollectionController({ items: ['a', 'b'], getKey: (item) => item });
    const onActivate = vi.fn();
    const bindings = createCollectionBindings({ id: 'results', controller, runtime, onActivate });
    bindings.focus();

    expect(runtime.dispatch(key('\x1b[B')).status).toBe('handled');
    expect(controller.snapshot().activeKey).toBe('b');
    expect(runtime.dispatch(key('\r')).status).toBe('handled');
    expect(onActivate).toHaveBeenCalledWith('b');

    bindings.dispose();
    expect(runtime.dispatch(key('\x1b[A')).status).toBe('unhandled');
  });
});
