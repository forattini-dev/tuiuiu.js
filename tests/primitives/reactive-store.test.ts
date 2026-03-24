import { describe, it, expect, vi } from 'vitest';
import { createReactiveStore } from '../../src/primitives/store.js';
import { createEffect, batch } from '../../src/primitives/signal.js';

describe('createReactiveStore', () => {
  it('creates a reactive proxy of a plain object', () => {
    const store = createReactiveStore({ count: 0, name: 'test' });
    expect(store.count).toBe(0);
    expect(store.name).toBe('test');
  });

  it('tracks property reads in effects', () => {
    const store = createReactiveStore({ count: 0 });
    const values: number[] = [];

    createEffect(() => {
      values.push(store.count);
    });

    expect(values).toEqual([0]);

    store.count = 1;
    expect(values).toEqual([0, 1]);

    store.count = 2;
    expect(values).toEqual([0, 1, 2]);
  });

  it('only re-runs effects that read the changed property', () => {
    const store = createReactiveStore({ a: 0, b: 0 });
    const aCalls = vi.fn();
    const bCalls = vi.fn();

    createEffect(() => {
      void store.a;
      aCalls();
    });

    createEffect(() => {
      void store.b;
      bCalls();
    });

    expect(aCalls).toHaveBeenCalledTimes(1);
    expect(bCalls).toHaveBeenCalledTimes(1);

    store.a = 1;
    expect(aCalls).toHaveBeenCalledTimes(2);
    expect(bCalls).toHaveBeenCalledTimes(1); // b not affected

    store.b = 1;
    expect(aCalls).toHaveBeenCalledTimes(2); // a not affected
    expect(bCalls).toHaveBeenCalledTimes(2);
  });

  it('skips update when value is the same (Object.is)', () => {
    const store = createReactiveStore({ x: 0 });
    const fn = vi.fn();

    createEffect(() => {
      void store.x;
      fn();
    });

    expect(fn).toHaveBeenCalledTimes(1);

    store.x = 0; // Same value
    expect(fn).toHaveBeenCalledTimes(1); // No re-run
  });

  it('provides lazy deep reactivity for nested objects', () => {
    const store = createReactiveStore({
      user: { name: 'Alice', settings: { theme: 'dark' } },
    });

    const names: string[] = [];
    createEffect(() => {
      names.push(store.user.name);
    });

    expect(names).toEqual(['Alice']);

    store.user.name = 'Bob';
    expect(names).toEqual(['Alice', 'Bob']);
  });

  it('handles property deletion', () => {
    const store = createReactiveStore<Record<string, any>>({ a: 1, b: 2 });
    const fn = vi.fn();

    createEffect(() => {
      void store.a;
      fn();
    });

    expect(fn).toHaveBeenCalledTimes(1);

    delete store.a;
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('works with batch()', () => {
    const store = createReactiveStore({ a: 0, b: 0 });
    const fn = vi.fn();

    createEffect(() => {
      void store.a;
      void store.b;
      fn();
    });

    expect(fn).toHaveBeenCalledTimes(1);

    batch(() => {
      store.a = 1;
      store.b = 1;
    });

    // Should have batched into a single effect run
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('returns the same proxy for repeated access', () => {
    const store = createReactiveStore({ nested: { value: 1 } });
    const ref1 = store.nested;
    const ref2 = store.nested;
    expect(ref1).toBe(ref2);
  });
});
