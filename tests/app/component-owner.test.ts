import { afterEach, describe, expect, it } from 'vitest';
import { component } from '../../src/app/component.js';
import {
  beginRender,
  abortRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import { useEffect } from '../../src/hooks/use-effect.js';
import { useState } from '../../src/hooks/use-state.js';

function renderPass(render: () => void): void {
  beginRender('component');
  try {
    render();
  } finally {
    endRender();
  }
}

function failedRenderPass(render: () => void): void {
  beginRender('component');
  try {
    render();
  } catch {
    abortRender();
  }
}

describe('component ownership', () => {
  afterEach(() => resetHookState());

  it('preserves state by key when siblings reorder', () => {
    const values = new Map<string, () => number>();
    const setters = new Map<string, (value: number) => void>();
    const Item = component<{ id: string }, null>('Item', ({ id }) => {
      const [value, setValue] = useState(0);
      values.set(id, value);
      setters.set(id, setValue);
      return null;
    });

    renderPass(() => {
      Item({ id: 'a', key: 'a' });
      Item({ id: 'b', key: 'b' });
    });
    setters.get('a')!(7);

    renderPass(() => {
      Item({ id: 'b', key: 'b' });
      Item({ id: 'a', key: 'a' });
    });

    expect(values.get('a')!()).toBe(7);
    expect(values.get('b')!()).toBe(0);
  });

  it('disposes only the owner removed from the tree', () => {
    const disposed: string[] = [];
    const Item = component<{ id: string }, null>('Item', ({ id }) => {
      useEffect(() => () => disposed.push(id));
      return null;
    });

    renderPass(() => {
      Item({ id: 'a', key: 'a' });
      Item({ id: 'b', key: 'b' });
    });
    renderPass(() => {
      Item({ id: 'b', key: 'b' });
    });

    expect(disposed).toEqual(['a']);
    resetHookState();
    expect(disposed).toEqual(['a', 'b']);
  });

  it('isolates hook counts between nested owners', () => {
    const setters = new Map<string, (value: number) => void>();
    const values = new Map<string, () => number>();
    const Item = component<{ id: string; extra: boolean }, null>('Item', ({ id, extra }) => {
      const [value, setValue] = useState(0);
      if (extra) useState('optional');
      values.set(id, value);
      setters.set(id, setValue);
      return null;
    });

    renderPass(() => {
      Item({ id: 'a', extra: true, key: 'a' });
      Item({ id: 'b', extra: false, key: 'b' });
    });
    setters.get('b')!(4);
    renderPass(() => {
      Item({ id: 'a', extra: false, key: 'a' });
      Item({ id: 'b', extra: false, key: 'b' });
    });

    expect(values.get('b')!()).toBe(4);
  });

  it('rejects repeated unkeyed stateful siblings in development', () => {
    const Item = component<Record<string, never>, null>('Item', () => null);

    expect(() => renderPass(() => {
      Item({});
      Item({});
    })).toThrow(/stable `key`/);
  });

  it('keeps the committed owner tree when an evaluation aborts', () => {
    const disposed: string[] = [];
    const values = new Map<string, () => number>();
    const setters = new Map<string, (value: number) => void>();
    const Item = component<{ id: string; fail?: boolean }, null>('Item', ({ id, fail }) => {
      const [value, setValue] = useState(0);
      useEffect(() => () => disposed.push(id));
      values.set(id, value);
      setters.set(id, setValue);
      if (fail) throw new Error('render failed');
      return null;
    });

    renderPass(() => {
      Item({ id: 'a', key: 'a' });
      Item({ id: 'b', key: 'b' });
    });
    setters.get('b')!(9);

    failedRenderPass(() => {
      Item({ id: 'a', key: 'a', fail: true });
    });
    expect(disposed).toEqual([]);

    renderPass(() => {
      Item({ id: 'a', key: 'a' });
      Item({ id: 'b', key: 'b' });
    });
    expect(values.get('b')!()).toBe(9);
  });

  it('supports a no-props stateful root invocation', () => {
    const Root = component<null>('Root', () => {
      useState(1);
      return null;
    });
    expect(() => renderPass(() => { Root(); })).not.toThrow();
  });
});
