import { beforeEach, describe, expect, it } from 'vitest';

import { Box, Text } from '../../src/primitives/nodes.js';
import { Scroll as OwnedScroll, createScroll } from '../../src/primitives/scroll.js';
import {
  createFrameSnapshot,
  resetFrameSequenceForTesting,
} from '../../src/core/frame.js';
import {
  hitTestAt,
  registerHitTestFromLayout,
  resetHitTestRegistry,
} from '../../src/core/hit-test.js';
import { testComponent } from '../../src/testing/component.js';

const Scroll = testComponent(OwnedScroll);

describe('Frame queries', () => {
  beforeEach(() => {
    resetFrameSequenceForTesting();
    resetHitTestRegistry();
  });

  it('returns root-relative bounds for explicit IDs', () => {
    const frame = createFrameSnapshot(
      Box(
        { id: 'outer', width: 20, height: 8, borderStyle: 'single', padding: 1 } as any,
        Box({ id: 'target', width: 5, height: 2 } as any, Text({}, 'Hi')),
      ),
      { width: 20, height: 10 },
    );

    expect(frame.queries.getElement('outer')).toMatchObject({
      id: 'outer',
      status: 'found',
      found: true,
      ambiguous: false,
      bounds: { x: 0, y: 0, width: 20, height: 8 },
      nodeType: 'box',
    });

    expect(frame.queries.getElement('target')).toMatchObject({
      id: 'target',
      status: 'found',
      found: true,
      ambiguous: false,
      bounds: { x: 2, y: 2, width: 5, height: 2 },
      nodeType: 'box',
    });
  });

  it('fails safely for missing IDs', () => {
    const frame = createFrameSnapshot(Text({}, 'Hello'), {
      width: 20,
      height: 10,
      pointer: { x: 1, y: 1, buttonDown: false },
    });

    expect(frame.queries.getElement('missing')).toEqual({
      id: 'missing',
      status: 'missing',
      found: false,
      ambiguous: false,
    });
    expect(frame.queries.pointerOver('missing')).toBe(false);
    expect(frame.queries.getScrollContainer('missing')).toEqual({
      id: 'missing',
      status: 'missing',
      found: false,
      ambiguous: false,
    });
  });

  it('returns ambiguous status for duplicate explicit IDs', () => {
    const frame = createFrameSnapshot(
      Box(
        { width: 30 },
        Box({ id: 'dup', width: 4, height: 1 } as any, Text({}, 'A')),
        Box({ id: 'dup', width: 4, height: 1 } as any, Text({}, 'B')),
      ),
      { width: 30, height: 10 },
    );

    expect(frame.queries.getElement('dup')).toEqual({
      id: 'dup',
      status: 'ambiguous',
      found: false,
      ambiguous: true,
    });
    expect(frame.warnings).toContainEqual(
      expect.objectContaining({
        code: 'duplicate-id',
        id: 'dup',
      }),
    );
  });

  it('uses committed frame input for pointer checks', () => {
    const input = {
      width: 20,
      height: 10,
      pointer: { x: 1, y: 1, buttonDown: false },
    };

    const frame = createFrameSnapshot(
      Box({ id: 'root', width: 10, height: 3 } as any, Text({}, 'Stable')),
      input,
    );

    input.pointer.x = 99;
    input.pointer.y = 99;

    expect(frame.queries.pointerOver('root')).toBe(true);
  });

  it('keeps pointerOver aligned with hit-test geometry', () => {
    const frame = createFrameSnapshot(
      Box(
        { id: 'button', width: 12, height: 3, borderStyle: 'single', onClick: () => {} } as any,
        Text({}, 'Click'),
      ),
      {
        width: 20,
        height: 10,
        pointer: { x: 1, y: 1, buttonDown: false },
      },
    );

    registerHitTestFromLayout(frame.layout);

    expect(frame.queries.pointerOver('button')).toBe(true);
    expect(hitTestAt(1, 1)?.node.props.id).toBe('button');
    expect(frame.queries.pointerOver('missing')).toBe(false);
    expect(hitTestAt(40, 40)).toBeNull();
  });

  it('queries scroll containers by explicit ID and keeps controls next-frame based', () => {
    const state = createScroll({ height: 3 });
    const lines = Array.from({ length: 6 }, (_, index) => Text({}, `Line ${index + 1}`));
    const node = Scroll({ id: 'log', height: 3, width: 20, state }, ...lines);
    const frame = createFrameSnapshot(node, { width: 20, height: 10 });

    const result = frame.queries.getScrollContainer('log');
    expect(result).toMatchObject({
      id: 'log',
      status: 'found',
      found: true,
      ambiguous: false,
      viewport: { width: 18, height: 3 },
      content: { width: 18, height: 6 },
      offset: { x: 0, y: 0 },
      maxOffset: { x: 0, y: 3 },
      nodeType: 'box',
    });

    result.controls?.scrollTo({ y: 999 });

    expect(result.offset).toEqual({ x: 0, y: 0 });
    expect(state.scrollTop()).toBe(3);

    const nextFrame = createFrameSnapshot(
      Scroll({ id: 'log', height: 3, width: 20, state }, ...lines),
      { width: 20, height: 10 },
    );

    expect(nextFrame.queries.getScrollContainer('log').offset).toEqual({ x: 0, y: 3 });
  });

  it('returns ambiguous status for duplicate scroll container IDs', () => {
    const frame = createFrameSnapshot(
      Box(
        { width: 30 },
        Scroll(
          { id: 'dup-scroll', height: 2, width: 12, state: createScroll({ height: 2 }) },
          Text({}, 'A1'),
          Text({}, 'A2'),
          Text({}, 'A3'),
        ),
        Scroll(
          { id: 'dup-scroll', height: 2, width: 12, state: createScroll({ height: 2 }) },
          Text({}, 'B1'),
          Text({}, 'B2'),
          Text({}, 'B3'),
        ),
      ),
      { width: 30, height: 10 },
    );

    expect(frame.queries.getScrollContainer('dup-scroll')).toEqual({
      id: 'dup-scroll',
      status: 'ambiguous',
      found: false,
      ambiguous: true,
    });
  });
});
