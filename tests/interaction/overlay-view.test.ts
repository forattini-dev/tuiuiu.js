import { describe, expect, it } from 'vitest';
import { createInteractionRuntime } from '../../src/interaction/runtime.js';
import { createOverlayHost } from '../../src/interaction/overlay.js';
import { OverlayHostView } from '../../src/organisms/overlay-host.js';
import { Text } from '../../src/primitives/nodes.js';
import { renderTestComponent } from '../../src/testing/component.js';
import type { VNode } from '../../src/utils/types.js';

function renderOverlay(placement: Parameters<ReturnType<typeof createOverlayHost<VNode | null>>['open']>[0]['placement']) {
  const host = createOverlayHost<VNode | null>({
    runtime: createInteractionRuntime(),
  });
  host.open({
    id: 'panel',
    content: Text({}, 'Panel'),
    placement,
    margin: 2,
  });
  return renderTestComponent(() => OverlayHostView({ host }));
}

describe('OverlayHostView', () => {
  it.each([
    ['center', 'center', 'center'],
    ['top-left', 'flex-start', 'flex-start'],
    ['top-right', 'flex-end', 'flex-start'],
    ['bottom-left', 'flex-start', 'flex-end'],
    ['bottom-right', 'flex-end', 'flex-end'],
    ['left', 'flex-start', 'center'],
    ['right', 'flex-end', 'center'],
  ] as const)(
    'maps %s placement to renderer alignment',
    (placement, alignItems, justifyContent) => {
      const node = renderOverlay(placement);
      expect(node.children[0]?.props).toMatchObject({
        alignItems,
        justifyContent,
        padding: 2,
      });
    },
  );

  it('omits responsive entries that are hidden at the current viewport', () => {
    const host = createOverlayHost<VNode | null>({
      runtime: createInteractionRuntime(),
    });
    host.open({
      content: Text({}, 'Wide only'),
      visibleWhen: ({ width }) => width >= 80,
    });
    host.setViewport(40, 20);

    const node = renderTestComponent(() => OverlayHostView({ host }));
    expect(node.children).toHaveLength(0);
  });

  it('renders one backdrop behind the authoritative blocking overlay', () => {
    const host = createOverlayHost<VNode | null>({
      runtime: createInteractionRuntime(),
    });
    host.open({
      id: 'modal',
      content: Text({}, 'Modal'),
      blocking: true,
      backdrop: true,
    });

    const node = renderTestComponent(() => OverlayHostView({ host }));
    expect(node.children).toHaveLength(2);
    expect(node.children[0]?.key).toBe('modal:backdrop');
    expect(node.children[1]?.key).toBe('modal:content');
  });
});
