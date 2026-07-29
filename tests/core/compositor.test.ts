import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Box, Text } from '../../src/primitives/nodes.js';
import { createFrameSnapshot, resetFrameSequenceForTesting } from '../../src/core/frame.js';
import { reportMotionFrameCost, resetMotionRuntime } from '../../src/core/motion-runtime.js';
import { stringWidth } from '../../src/utils/text-utils.js';

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

  it('approximates scale with a centered compositor clip', () => {
    const frame = createFrameSnapshot(
      Box(
        {
          id: 'scaled-box',
          width: 10,
          height: 6,
          borderStyle: 'single',
          __compositor: {
            key: 'scale-comp',
            transforms: [{ kind: 'scale', scale: 0.5 }],
          },
        } as any,
        Text({ id: 'scaled-text' } as any, 'abcdefghij'),
      ),
      { width: 20, height: 10 },
    );

    const command = frame.drawCommands.find(
      candidate => candidate.id === 'scaled-box',
    );
    expect(command?.clip).toEqual({
      x: 2,
      y: 1,
      width: 5,
      height: 3,
    });
    expect(frame.layout).toMatchObject({ x: 0, y: 0, width: 10, height: 6 });
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

  it('reveals ANSI-styled wide graphemes by terminal columns', () => {
    const frame = createFrameSnapshot(
      Text({
        id: 'revealed-unicode',
        __compositor: {
          key: 'reveal-unicode-comp',
          transforms: [{ kind: 'reveal', direction: 'left', progress: 0.5 }],
        },
      } as any, '\x1b[31m界界界界\x1b[0m'),
      { width: 20, height: 4 },
    );

    const command = frame.drawCommands.find(
      (candidate) => candidate.id === 'revealed-unicode',
    );
    expect(command).toMatchObject({ type: 'text', maxWidth: 4 });
    if (command?.type === 'text') {
      expect(stringWidth(command.text)).toBe(4);
      expect(command.text).toContain('\x1b[31m');
    }
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
