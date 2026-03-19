import { beforeEach, describe, expect, it } from 'vitest';

import { Box, Text } from '../../src/primitives/nodes.js';
import { calculateLayout, clearTextMeasureCache } from '../../src/core/layout.js';

describe('layout reuse cache', () => {
  beforeEach(() => {
    clearTextMeasureCache();
  });

  it('reuses the same layout object for a stable node under identical constraints', () => {
    const node = Box(
      { padding: 1, borderStyle: 'single' },
      Text({}, 'Stable'),
    );

    const first = calculateLayout(node, 80, 24);
    const second = calculateLayout(node, 80, 24);

    expect(second).toBe(first);
  });

  it('reuses a stable child subtree even when the parent vnode is recreated', () => {
    const sharedChild = Box(
      { padding: 1, borderStyle: 'single' },
      Text({}, 'Static panel'),
    );

    const first = calculateLayout(
      Box({ flexDirection: 'column' }, sharedChild, Text({}, 'tick 1')),
      80,
      24,
    );
    const second = calculateLayout(
      Box({ flexDirection: 'column' }, sharedChild, Text({}, 'tick 2')),
      80,
      24,
    );

    expect(second.children[0]).toBe(first.children[0]);
    expect(second.children[1]).not.toBe(first.children[1]);
  });

  it('recomputes geometry when an equivalent rebuilt subtree changes content', () => {
    const first = calculateLayout(
      Box({ padding: 1 }, Text({}, 'short')),
      80,
      24,
    );
    const second = calculateLayout(
      Box({ padding: 1 }, Text({}, 'a much longer label')),
      80,
      24,
    );

    expect(second.width).toBeGreaterThan(first.width);
    expect(second.children[0]?.width).toBeGreaterThan(first.children[0]?.width ?? 0);
  });

  it('invalidates the cached layout when layout-affecting props change in place', () => {
    const node = Box({ padding: 1 }, Text({}, 'abc'));

    const first = calculateLayout(node, 80, 24);
    (node.props as { padding: number }).padding = 3;
    const second = calculateLayout(node, 80, 24);

    expect(second).not.toBe(first);
    expect(second.width).toBe(9);
    expect(second.width).toBeGreaterThan(first.width);
  });

  it('does not invalidate the cached layout when only function props change', () => {
    const node = Box({ padding: 1, onClick: () => 'first' } as any, Text({}, 'abc'));

    const first = calculateLayout(node, 80, 24);
    (node.props as { onClick: () => string }).onClick = () => 'second';
    const second = calculateLayout(node, 80, 24);

    expect(second).toBe(first);
  });

  it('does not invalidate the cached layout when only render-only styles change', () => {
    const node = Text({ color: 'red', bold: true } as any, 'abc');

    const first = calculateLayout(node, 80, 24);
    (node.props as { color: string; bold: boolean }).color = 'blue';
    (node.props as { color: string; bold: boolean }).bold = false;
    const second = calculateLayout(node, 80, 24);

    expect(second).toBe(first);
  });

  it('invalidates the cached layout when width or height constraints change', () => {
    const node = Box({ width: 'fill', height: 'fill' }, Text({}, 'x'));

    const first = calculateLayout(node, 20, 10);
    const second = calculateLayout(node, 40, 12);

    expect(second).not.toBe(first);
    expect(first.width).toBe(20);
    expect(second.width).toBe(40);
    expect(first.height).toBe(10);
    expect(second.height).toBe(12);
  });

  it('updates descendant layout refs for structurally equivalent rebuilt subtrees', () => {
    let firstRect: { x: number; y: number; width: number; height: number } | undefined;
    let secondRect: { x: number; y: number; width: number; height: number } | undefined;

    const firstLayoutRef = {
      __update: (rect: { x: number; y: number; width: number; height: number }) => {
        firstRect = rect;
      },
    };
    const secondLayoutRef = {
      __update: (rect: { x: number; y: number; width: number; height: number }) => {
        secondRect = rect;
      },
    };

    calculateLayout(
      Box({}, Box({ width: 10, height: 3, layoutRef: firstLayoutRef } as any, Text({}, 'same'))),
      40,
      10,
    );
    calculateLayout(
      Box({}, Box({ width: 10, height: 3, layoutRef: secondLayoutRef } as any, Text({}, 'same'))),
      40,
      10,
    );

    expect(firstRect).toEqual({ x: 0, y: 0, width: 10, height: 3 });
    expect(secondRect).toEqual({ x: 0, y: 0, width: 10, height: 3 });
  });

  it('updates child layout refs after row positioning reuses a precomputed layout', () => {
    let childRect: { x: number; y: number; width: number; height: number } | undefined;

    const childLayoutRef = {
      __update: (rect: { x: number; y: number; width: number; height: number }) => {
        childRect = rect;
      },
    };

    calculateLayout(
      Box(
        { flexDirection: 'row', width: 30 },
        Text({}, 'label'),
        Box({ width: 10, height: 3, layoutRef: childLayoutRef } as any, Text({}, 'fixed')),
      ),
      30,
      10,
    );

    expect(childRect).toEqual({ x: 5, y: 0, width: 10, height: 3 });
  });

  it('reports absolute layoutRef coordinates through padded ancestors', () => {
    let childRect: { x: number; y: number; width: number; height: number } | undefined;

    const childLayoutRef = {
      __update: (rect: { x: number; y: number; width: number; height: number }) => {
        childRect = rect;
      },
    };

    calculateLayout(
      Box(
        { flexDirection: 'column', padding: 1, gap: 1 },
        Text({}, 'top'),
        Box({ width: 10, height: 3, layoutRef: childLayoutRef } as any, Text({}, 'fixed')),
      ),
      40,
      12,
    );

    expect(childRect).toEqual({ x: 1, y: 3, width: 10, height: 3 });
  });

  it('reports absolute layoutRef coordinates through nested padding and borders', () => {
    let childRect: { x: number; y: number; width: number; height: number } | undefined;

    const childLayoutRef = {
      __update: (rect: { x: number; y: number; width: number; height: number }) => {
        childRect = rect;
      },
    };

    calculateLayout(
      Box(
        { flexDirection: 'column', padding: 1, gap: 1 },
        Text({}, 'top'),
        Box(
          { borderStyle: 'single', padding: 1 },
          Box({ width: 4, height: 2, layoutRef: childLayoutRef } as any, Text({}, 'map')),
        ),
      ),
      40,
      16,
    );

    expect(childRect).toEqual({ x: 3, y: 5, width: 4, height: 2 });
  });

  it('does not mutate cached child layouts when parent alignment changes', () => {
    const sharedChild = Box({ flexGrow: 1 }, Text({}, 'X'));

    const centered = calculateLayout(
      Box(
        { flexDirection: 'row', alignItems: 'center', width: 20, height: 5 },
        sharedChild,
      ),
      20,
      5,
    );
    const bottomAligned = calculateLayout(
      Box(
        { flexDirection: 'row', alignItems: 'flex-end', width: 20, height: 5 },
        sharedChild,
      ),
      20,
      5,
    );

    expect(centered.children[0].y).toBe(2);
    expect(bottomAligned.children[0].y).toBe(4);
    expect(centered.children[0].y).toBe(2);
  });
});
