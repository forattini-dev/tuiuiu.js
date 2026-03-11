import { beforeEach, describe, expect, it } from 'vitest';

import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { useConst, useState } from '../../src/hooks/index.js';

describe('useConst', () => {
  beforeEach(() => {
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
});
