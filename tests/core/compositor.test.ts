import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box, Text } from '../../src/primitives/nodes.js';
import { createFrameSnapshot, resetFrameSequenceForTesting } from '../../src/core/frame.js';
import { reportMotionFrameCost, resetMotionRuntime } from '../../src/core/motion-runtime.js';

describe('compositor pipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetFrameSequenceForTesting();
    resetMotionRuntime();
  });

  afterEach(() => {
    resetMotionRuntime();
    vi.useRealTimers();
  });

  it('applies slide after layout without moving layout bounds', () => {
    const frame = createFrameSnapshot(
      Box(
        {
          id: 'panel',
          width: 12,
          height: 3,
          __compositor: {
            key: 'panel-comp',
            transforms: [{ kind: 'slide', offsetX: 3, offsetY: 1 }],
          },
        } as any,
        Text({ id: 'label' } as any, 'hello'),
      ),
      { width: 20, height: 10 },
    );

    const textCommand = frame.drawCommands.find((command) => command.id === 'label');

    expect(frame.layout.x).toBe(0);
    expect(frame.layout.y).toBe(0);
    expect(textCommand).toMatchObject({
      type: 'text',
      x: 3,
      y: 1,
    });
  });

  it('suppresses text output when fade reaches zero opacity', () => {
    const frame = createFrameSnapshot(
      Text({
        id: 'faded',
        __compositor: {
          key: 'fade-comp',
          transforms: [{ kind: 'fade', opacity: 0 }],
        },
      } as any, 'hidden'),
      { width: 20, height: 4 },
    );

    expect(frame.drawCommands.find((command) => command.id === 'faded')).toBeUndefined();
  });

  it('clips text with reveal transforms', () => {
    const frame = createFrameSnapshot(
      Text({
        id: 'revealed',
        __compositor: {
          key: 'reveal-comp',
          transforms: [{ kind: 'reveal', direction: 'left', progress: 0.5 }],
        },
      } as any, 'terminal'),
      { width: 20, height: 4 },
    );

    const textCommand = frame.drawCommands.find((command) => command.id === 'revealed');
    expect(textCommand).toMatchObject({
      type: 'text',
      text: 'term',
      maxWidth: 4,
    });
  });

  it('simplifies shimmer when motion runtime is reduced', () => {
    const fullFrame = createFrameSnapshot(
      Text({
        id: 'shimmered',
        color: 'cyan',
        __compositor: {
          key: 'shimmer-comp',
          transforms: [{ kind: 'shimmer', phase: 0.5, span: 1 }],
        },
      } as any, 'glow'),
      { width: 20, height: 4 },
    );

    reportMotionFrameCost(40);

    const reducedFrame = createFrameSnapshot(
      Text({
        id: 'shimmered',
        color: 'cyan',
        __compositor: {
          key: 'shimmer-comp',
          transforms: [{ kind: 'shimmer', phase: 0.5, span: 1 }],
        },
      } as any, 'glow'),
      { width: 20, height: 4 },
    );

    const fullText = fullFrame.drawCommands.find((command) => command.id === 'shimmered');
    const reducedText = reducedFrame.drawCommands.find((command) => command.id === 'shimmered');

    expect(fullText).toMatchObject({
      type: 'text',
      style: expect.objectContaining({
        inverse: true,
        bold: true,
      }),
    });
    expect(reducedText).toMatchObject({
      type: 'text',
      style: expect.not.objectContaining({
        inverse: true,
      }),
    });
  });
});
