import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { __resetDevWarningsForTesting } from '../../src/core/dev-warnings.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { useConst, useState } from '../../src/hooks/index.js';
import { createSignal } from '../../src/primitives/signal.js';

describe('useConst', () => {
  beforeEach(() => {
    __resetDevWarningsForTesting();
    resetHookState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    __resetDevWarningsForTesting();
    resetHookState();
  });

  it('creates a value exactly once across re-renders', () => {
    let factoryCalls = 0;

    function Component() {
      const value = useConst(() => ({ id: ++factoryCalls }));
      const [count, setCount] = useState(0);
      return { value, count, setCount };
    }

    beginRender();
    const first = Component();
    endRender();

    first.setCount(3);

    beginRender();
    const second = Component();
    endRender();

    expect(factoryCalls).toBe(1);
    expect(second.value).toBe(first.value);
    expect(second.count()).toBe(3);
  });

  it('allows a stable signal-backed factory during component render', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    beginRender('component');
    const [value, setValue] = useConst(() => createSignal(1));
    endRender();

    setValue(2);

    beginRender('component');
    const [sameValue] = useConst(() => createSignal(99));
    endRender();

    expect(sameValue).toBe(value);
    expect(sameValue()).toBe(2);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
