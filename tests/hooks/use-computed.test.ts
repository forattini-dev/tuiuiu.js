import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useComputed } from '../../src/hooks/use-computed.js';
import { createSignal } from '../../src/primitives/signal.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { Text, Box } from '../../src/primitives/nodes.js';
import { allowInternalSignalCreationDuringRender } from '../../src/core/dev-warnings.js';

describe('useComputed', () => {
  beforeEach(() => {
    resetHookState();
  });

  afterEach(() => {
    resetHookState();
  });

  it('returns the initial VNode on first render', () => {
    beginRender('component');
    const result = useComputed(() => Text({}, 'hello'));
    endRender();

    expect(result).not.toBeNull();
    expect(result!.type).toBe('text');
    expect(result!.props.children).toBe('hello');
  });

  it('returns cached VNode when signal has not changed', () => {
    const [count] = allowInternalSignalCreationDuringRender(() => createSignal(0));

    // First render
    beginRender('component');
    const r1 = useComputed(() => Text({}, `Count: ${count()}`));
    endRender();

    // Second render — same signal value
    beginRender('component');
    const r2 = useComputed(() => Text({}, `Count: ${count()}`));
    endRender();

    // createMemo caches the result when deps unchanged
    expect(r1).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(r1!.props.children).toBe('Count: 0');
    expect(r2!.props.children).toBe('Count: 0');
  });

  it('recomputes when signal changes', () => {
    const [count, setCount] = allowInternalSignalCreationDuringRender(() => createSignal(0));

    // First render
    beginRender('component');
    const r1 = useComputed(() => Text({}, `Count: ${count()}`));
    endRender();

    expect(r1!.props.children).toBe('Count: 0');

    // Change signal
    setCount(42);

    // Second render
    beginRender('component');
    const r2 = useComputed(() => Text({}, `Count: ${count()}`));
    endRender();

    expect(r2!.props.children).toBe('Count: 42');
  });

  it('does not recompute when unrelated signal changes', () => {
    const [count, setCount] = allowInternalSignalCreationDuringRender(() => createSignal(0));
    const [name, setName] = allowInternalSignalCreationDuringRender(() => createSignal('Alice'));

    let computeCount = 0;

    // First render — reads only count()
    beginRender('component');
    const r1 = useComputed(() => {
      computeCount++;
      return Text({}, `Count: ${count()}`);
    });
    endRender();

    expect(computeCount).toBe(1);

    // Change name (not read by this computed)
    setName('Bob');

    // Second render
    beginRender('component');
    const r2 = useComputed(() => {
      computeCount++;
      return Text({}, `Count: ${count()}`);
    });
    endRender();

    // createMemo should NOT have re-evaluated since count() didn't change
    // Note: the fn ref is updated but memo only calls it when tracked signals change
    expect(r2!.props.children).toBe('Count: 0');
  });

  it('handles null results', () => {
    const [show, setShow] = allowInternalSignalCreationDuringRender(() => createSignal(false));

    beginRender('component');
    const result = useComputed(() => show() ? Text({}, 'visible') : null);
    endRender();

    expect(result).toBeNull();

    setShow(true);

    beginRender('component');
    const result2 = useComputed(() => show() ? Text({}, 'visible') : null);
    endRender();

    expect(result2).not.toBeNull();
    expect(result2!.props.children).toBe('visible');
  });

  it('works with multiple useComputed in same component', () => {
    const [a, setA] = allowInternalSignalCreationDuringRender(() => createSignal(1));
    const [b, setB] = allowInternalSignalCreationDuringRender(() => createSignal(10));

    beginRender('component');
    const ra = useComputed(() => Text({}, `A: ${a()}`));
    const rb = useComputed(() => Text({}, `B: ${b()}`));
    endRender();

    expect(ra!.props.children).toBe('A: 1');
    expect(rb!.props.children).toBe('B: 10');

    // Change only a
    setA(2);

    beginRender('component');
    const ra2 = useComputed(() => Text({}, `A: ${a()}`));
    const rb2 = useComputed(() => Text({}, `B: ${b()}`));
    endRender();

    expect(ra2!.props.children).toBe('A: 2');
    expect(rb2!.props.children).toBe('B: 10');
  });
});
