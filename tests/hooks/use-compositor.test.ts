import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box, Text } from '../../src/primitives/nodes.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { useCompositor } from '../../src/hooks/use-compositor.js';
import { resetMotionRuntime } from '../../src/core/motion-runtime.js';

describe('useCompositor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetHookState();
    resetMotionRuntime();
  });

  afterEach(() => {
    resetHookState();
    resetMotionRuntime();
    vi.useRealTimers();
  });

  function renderComponent() {
    let controls: ReturnType<typeof useCompositor> | null = null;
    beginRender('component');
    const node = (() => {
      controls = useCompositor();
      return Box(controls.bind({ id: 'panel', width: 12 } as any), Text({}, 'hello'));
    })();
    endRender();
    return { node, controls: controls! };
  }

  it('binds stable compositor metadata onto props', () => {
    const first = renderComponent();
    const second = renderComponent();

    expect((first.node.props as any).__compositor.key).toBe((second.node.props as any).__compositor.key);
    expect((first.node.props as any).__compositor.transforms).toEqual([]);
  });

  it('updates bound transforms when a slide animation advances', () => {
    let render = renderComponent();
    const cancel = render.controls.slide({ toX: 4, duration: 100 });

    vi.advanceTimersByTime(50);
    render = renderComponent();

    expect((render.node.props as any).__compositor.transforms).toEqual([
      expect.objectContaining({
        kind: 'slide',
        offsetX: expect.any(Number),
      }),
    ]);

    cancel();
    render = renderComponent();
    expect((render.node.props as any).__compositor.transforms).toEqual([]);
  });

  it('cleans up transforms when hook state is reset', () => {
    let render = renderComponent();
    render.controls.fade({ from: 0, to: 1, duration: 100 });
    vi.advanceTimersByTime(50);
    render = renderComponent();
    expect((render.node.props as any).__compositor.transforms.length).toBe(1);

    resetHookState();

    render = renderComponent();
    expect((render.node.props as any).__compositor.transforms).toEqual([]);
  });
});
