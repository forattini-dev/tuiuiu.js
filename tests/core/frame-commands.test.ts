import { beforeEach, describe, expect, it } from 'vitest';

import { Box, Text } from '../../src/primitives/nodes.js';
import { createFrameSnapshot, resetFrameSequenceForTesting } from '../../src/core/frame.js';
import { createSolidImage } from '../../src/core/graphics.js';
import { renderFrameToString, renderToString } from '../../src/core/renderer.js';

describe('DrawCommand contract', () => {
  beforeEach(() => {
    resetFrameSequenceForTesting();
  });

  it('emits semantic draw commands in deterministic parent-before-child order', () => {
    const frame = createFrameSnapshot(
      Box(
        { id: 'outer', width: 18, height: 5, borderStyle: 'single', padding: 1 },
        Box(
          { id: 'inner', width: 8, height: 1, backgroundColor: 'blue' },
          Text({ id: 'label', color: 'white' } as any, 'order'),
        ),
      ),
      { width: 18, height: 10 },
    );

    expect(frame.drawCommands.map((command) => command.order)).toEqual([0, 1, 2]);
    expect(frame.drawCommands.map((command) => command.id)).toEqual(['outer', 'inner', 'label']);
    expect(frame.drawCommands.map((command) => command.type)).toEqual(['box', 'box', 'text']);
  });

  it('preserves clipping-compatible text constraints for renderer backends', () => {
    const node = Box(
      { id: 'clip-box', width: 8, borderStyle: 'single', padding: 1 },
      Text({ id: 'clip-text' } as any, '1234567890'),
    );

    const frame = createFrameSnapshot(node, { width: 8, height: 6 });
    const textCommand = frame.drawCommands.find((command) => command.id === 'clip-text');

    expect(textCommand).toMatchObject({
      type: 'text',
      maxWidth: 4,
    });
    expect(renderFrameToString(frame)).toBe(renderToString(node, { width: 8, height: 6 }));
  });

  it('reuses the committed draw-command array for identical stable frames', () => {
    const node = Box(
      { id: 'stable-root', width: 18, height: 5, borderStyle: 'single', padding: 1 },
      Text({ id: 'stable-label', color: 'cyan' } as any, 'stable'),
    );

    const first = createFrameSnapshot(node, { width: 18, height: 10 });
    const second = createFrameSnapshot(node, { width: 18, height: 10 });

    expect(second.drawCommands).toBe(first.drawCommands);
    expect(second.drawCommands.map((command) => command.order)).toEqual([0, 1]);
  });

  it('invalidates cached subtree draw commands when inherited background changes', () => {
    const sharedChild = Box(
      { id: 'shared-panel', width: 8, height: 1 },
      Text({ id: 'shared-label' } as any, 'bg'),
    );

    const first = createFrameSnapshot(
      Box({ width: 12, backgroundColor: 'red' }, sharedChild),
      { width: 12, height: 4 },
    );
    const second = createFrameSnapshot(
      Box({ width: 12, backgroundColor: 'blue' }, sharedChild),
      { width: 12, height: 4 },
    );

    const firstText = first.drawCommands.find((command) => command.id === 'shared-label');
    const secondText = second.drawCommands.find((command) => command.id === 'shared-label');

    expect(firstText).toMatchObject({
      type: 'text',
      inheritedBackgroundColor: 'red',
    });
    expect(secondText).toMatchObject({
      type: 'text',
      inheritedBackgroundColor: 'blue',
    });
  });

  it('emits protocol-backed terminal images as dedicated draw commands with reserved regions', () => {
    const node = Box(
      {
        id: 'image-box',
        width: 10,
        height: 6,
        borderStyle: 'single',
        padding: 1,
        __terminalImage: {
          source: createSolidImage(60, 40, 255, 0, 0),
          options: { protocol: 'kitty' as const },
        },
      } as any,
      Text({ id: 'overlay-label' } as any, 'overlay-sentinel'),
    );

    const frame = createFrameSnapshot(node, { width: 10, height: 8 });
    const imageCommand = frame.drawCommands.find((command) => command.type === 'terminal-image');

    expect(frame.drawCommands.map((command) => command.type)).toEqual(['box', 'terminal-image', 'text']);
    expect(imageCommand).toMatchObject({
      type: 'terminal-image',
      id: 'image-box',
      x: 2,
      y: 2,
      width: 6,
      height: 2,
      protocol: 'kitty',
      cellRender: false,
    });
    expect(frame.reservedRegions).toEqual([
      {
        type: 'terminal-image',
        id: 'image-box',
        protocol: 'kitty',
        x: 2,
        y: 2,
        width: 6,
        height: 2,
      },
    ]);
  });

  it('reuses materialized draw commands for stable frames with terminal images', () => {
    const node = Box(
      {
        id: 'stable-image-box',
        width: 10,
        height: 6,
        borderStyle: 'single',
        padding: 1,
        __terminalImage: {
          source: createSolidImage(60, 40, 0, 255, 0),
          options: { protocol: 'kitty' as const },
        },
      } as any,
    );

    const first = createFrameSnapshot(node, { width: 10, height: 8 });
    const second = createFrameSnapshot(node, { width: 10, height: 8 });

    expect(second.drawCommands).toBe(first.drawCommands);
    expect(second.reservedRegions).toEqual(first.reservedRegions);
  });
});
