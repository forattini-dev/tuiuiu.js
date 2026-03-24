import { describe, it, expect, vi } from 'vitest';
import { createSignal, createEffect, onCleanup, batch } from '../../src/primitives/signal.js';

describe('onCleanup', () => {
  it('runs cleanup when effect re-runs', () => {
    const cleanup = vi.fn();
    const [count, setCount] = createSignal(0);

    createEffect(() => {
      void count();
      onCleanup(cleanup);
    });

    expect(cleanup).not.toHaveBeenCalled();

    setCount(1);
    expect(cleanup).toHaveBeenCalledTimes(1);

    setCount(2);
    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it('runs cleanup when effect is disposed', () => {
    const cleanup = vi.fn();
    const dispose = createEffect(() => {
      onCleanup(cleanup);
    });

    expect(cleanup).not.toHaveBeenCalled();

    dispose();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('supports multiple onCleanup calls in one effect', () => {
    const cleanup1 = vi.fn();
    const cleanup2 = vi.fn();
    const [count, setCount] = createSignal(0);

    createEffect(() => {
      void count();
      onCleanup(cleanup1);
      onCleanup(cleanup2);
    });

    setCount(1);
    expect(cleanup1).toHaveBeenCalledTimes(1);
    expect(cleanup2).toHaveBeenCalledTimes(1);
  });

  it('works alongside returned cleanup', () => {
    const returnCleanup = vi.fn();
    const onCleanupFn = vi.fn();
    const [count, setCount] = createSignal(0);

    createEffect(() => {
      void count();
      onCleanup(onCleanupFn);
      return returnCleanup;
    });

    setCount(1);
    expect(returnCleanup).toHaveBeenCalledTimes(1);
    expect(onCleanupFn).toHaveBeenCalledTimes(1);
  });

  it('is a no-op outside effect scope', () => {
    // Should not throw
    const cleanup = vi.fn();
    onCleanup(cleanup);
    expect(cleanup).not.toHaveBeenCalled();
  });

  it('works with batched updates', () => {
    const cleanup = vi.fn();
    const [a, setA] = createSignal(0);
    const [b, setB] = createSignal(0);

    createEffect(() => {
      void a();
      void b();
      onCleanup(cleanup);
    });

    batch(() => {
      setA(1);
      setB(1);
    });

    // Cleanup should run once (batched)
    expect(cleanup).toHaveBeenCalledTimes(1);
  });
});
