import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMemo } from '../../src/hooks/use-memo.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';

describe('useMemo', () => {
  beforeEach(() => {
    resetHookState();
  });

  afterEach(() => {
    resetHookState();
  });

  it('computes on first render', () => {
    const factory = vi.fn(() => 42);

    beginRender('component');
    const result = useMemo([1], factory);
    endRender();

    expect(result).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('returns cached value when deps unchanged', () => {
    const factory = vi.fn(() => 42);

    // First render
    beginRender('component');
    const r1 = useMemo([1, 'a'], factory);
    endRender();

    // Second render — same deps
    beginRender('component');
    const r2 = useMemo([1, 'a'], factory);
    endRender();

    expect(r1).toBe(42);
    expect(r2).toBe(42);
    expect(factory).toHaveBeenCalledTimes(1); // NOT called again
  });

  it('recomputes when deps change', () => {
    let value = 'first';
    const factory = vi.fn(() => value);

    // First render
    beginRender('component');
    const r1 = useMemo([1], factory);
    endRender();

    // Second render — different deps
    value = 'second';
    beginRender('component');
    const r2 = useMemo([2], factory);
    endRender();

    expect(r1).toBe('first');
    expect(r2).toBe('second');
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('handles empty deps (never recomputes)', () => {
    const factory = vi.fn(() => 'static');

    beginRender('component');
    useMemo([], factory);
    endRender();

    beginRender('component');
    useMemo([], factory);
    endRender();

    beginRender('component');
    useMemo([], factory);
    endRender();

    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('handles multiple useMemo in same component', () => {
    const f1 = vi.fn(() => 'a');
    const f2 = vi.fn(() => 'b');

    // First render
    beginRender('component');
    const r1 = useMemo([1], f1);
    const r2 = useMemo([2], f2);
    endRender();

    expect(r1).toBe('a');
    expect(r2).toBe('b');

    // Second render — only first dep changes
    beginRender('component');
    const r1b = useMemo([99], f1);
    const r2b = useMemo([2], f2);
    endRender();

    expect(f1).toHaveBeenCalledTimes(2); // recomputed
    expect(f2).toHaveBeenCalledTimes(1); // cached
  });

  it('uses Object.is for comparison', () => {
    const factory = vi.fn(() => 'result');

    beginRender('component');
    useMemo([NaN, -0], factory);
    endRender();

    // NaN === NaN and -0 === -0 with Object.is
    beginRender('component');
    useMemo([NaN, -0], factory);
    endRender();

    expect(factory).toHaveBeenCalledTimes(1);

    // -0 vs +0 are different
    beginRender('component');
    useMemo([NaN, 0], factory);
    endRender();

    expect(factory).toHaveBeenCalledTimes(2);
  });
});
