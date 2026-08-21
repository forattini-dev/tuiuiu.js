import { beforeEach, describe, expect, it } from 'vitest';

import { TerminalImage as OwnedTerminalImage, createTerminalImage } from '../../src/atoms/terminal-image.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { createFrameSnapshot, resetFrameSequenceForTesting } from '../../src/core/frame.js';
import { createSolidImage } from '../../src/core/graphics.js';
import { getHitTestRegistry, resetHitTestRegistry } from '../../src/core/hit-test.js';
import { renderFrameToString, renderToString } from '../../src/core/renderer.js';
import { testComponent } from '../../src/testing/component.js';

const TerminalImage = testComponent(OwnedTerminalImage);

describe('FrameSnapshot', () => {
  beforeEach(() => {
    resetFrameSequenceForTesting();
    resetHitTestRegistry();
  });

  it('creates committed frame metadata without mutating the global hit-test registry', () => {
    const node = Box({ id: 'root', width: 20, height: 3, borderStyle: 'single', onClick: () => {} } as any,
      Text({}, 'Hello frame'),
    );

    const frame = createFrameSnapshot(node, { width: 20, height: 10 });

    expect(frame.info.frameId).toBe(1);
    expect(frame.info.viewport).toEqual({ width: 20, height: 10 });
    expect(frame.hitTargets).toHaveLength(1);
    expect(frame.metrics.structural.hitTargetCount).toBe(1);
    expect(frame.metrics.structural.warningCount).toBe(0);
    expect(frame.metrics.structural.drawCommandCount).toBeGreaterThan(0);
    expect(frame.metrics.phases.layoutMs).toBeGreaterThanOrEqual(0);
    expect(frame.metrics.phases.hitTargetRegistrationMs).toBeGreaterThanOrEqual(0);
    expect(frame.metrics.phases.drawCommandMs).toBeGreaterThanOrEqual(0);
    expect(frame.drawCommands.some((command) => command.type === 'text')).toBe(true);
    expect(frame.drawCommands[0]).toMatchObject({
      order: 0,
      id: 'root',
    });
    expect(getHitTestRegistry().count).toBe(0);
  });

  it('reports duplicate explicit ids as frame warnings', () => {
    const node = Box({ width: 30 },
      Box({ id: 'dup' } as any, Text({}, 'A')),
      Box({ id: 'dup' } as any, Text({}, 'B')),
    );

    const frame = createFrameSnapshot(node, { width: 30, height: 10 });

    expect(frame.warnings).toHaveLength(1);
    expect(frame.warnings[0]).toMatchObject({
      code: 'duplicate-id',
      severity: 'warning',
      id: 'dup',
    });
    expect(frame.metrics.structural.warningCount).toBe(1);
  });

  it('increments frame ids monotonically', () => {
    const first = createFrameSnapshot(Text({}, 'one'), { width: 10, height: 5 });
    const second = createFrameSnapshot(Text({}, 'two'), { width: 10, height: 5 });

    expect(first.info.frameId).toBe(1);
    expect(second.info.frameId).toBe(2);
  });

  it('renders the same ANSI output through the committed frame adapter', () => {
    const node = Box({ width: 20, borderStyle: 'single' },
      Text({ color: 'cyan' }, 'Hello'),
    );

    const frame = createFrameSnapshot(node, { width: 20, height: 10 });
    const fromFrame = renderFrameToString(frame);
    const direct = renderToString(node, { width: 20, height: 10 });

    expect(fromFrame).toBe(direct);
  });

  it('suppresses regular text writes inside reserved protocol-image regions', () => {
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
      Text({ id: 'overlay' } as any, 'overlay-sentinel'),
    );

    const frame = createFrameSnapshot(node, { width: 10, height: 8 });
    const output = renderFrameToString(frame);

    expect(output).toContain('\x1b_G');
    expect(output).not.toContain('overlay-sentinel');
  });

  it('renders halfblock fallback inside normal cell flow without reserved regions', () => {
    const node = Box(
      {
        id: 'fallback-box',
        width: 10,
        height: 6,
        borderStyle: 'single',
        padding: 1,
        __terminalImage: {
          source: createSolidImage(60, 40, 0, 255, 255),
          options: { protocol: 'halfblock' as const },
        },
      } as any,
    );

    const frame = createFrameSnapshot(node, { width: 10, height: 8 });
    const imageCommand = frame.drawCommands.find((command) => command.type === 'terminal-image');
    const output = renderFrameToString(frame);

    expect(imageCommand).toMatchObject({
      type: 'terminal-image',
      cellRender: true,
      protocol: 'halfblock',
    });
    expect(frame.reservedRegions).toEqual([]);
    expect(output).toContain('▀');
  });

  it('emits cleanup commands when a protocol image disappears in the standard renderer path', () => {
    const imageState = createTerminalImage({
      source: createSolidImage(60, 40, 255, 255, 0),
      protocol: 'kitty',
      fit: 'contain',
    });
    const previousNode = Box(
      { id: 'image-box', width: 10, height: 6, borderStyle: 'single', padding: 1 },
      TerminalImage({
        state: imageState,
        width: 'fill',
        height: 'fill',
      }),
    );
    const nextNode = Box(
      { id: 'image-box', width: 10, height: 6, borderStyle: 'single', padding: 1 } as any,
      Text({}, 'gone'),
    );

    const previousFrame = createFrameSnapshot(previousNode, { width: 10, height: 8 });
    const nextFrame = createFrameSnapshot(nextNode, { width: 10, height: 8 });
    const output = renderFrameToString(nextFrame, { previousFrame });

    expect(output).toContain(`\x1b_Ga=d,d=i,i=${imageState.protocolState.kittyImageId}\x1b\\`);
  });

  it('re-emits kitty placement when the same image moves between frames', () => {
    const imageState = createTerminalImage({
      source: createSolidImage(60, 40, 255, 0, 255),
      protocol: 'kitty',
      fit: 'contain',
    });
    const previousFrame = createFrameSnapshot(
      Box(
        { width: 20, height: 10 },
        Box({ width: 10, height: 6 }, TerminalImage({ state: imageState, width: 'fill', height: 'fill' })),
      ),
      { width: 20, height: 10 },
    );
    const nextFrame = createFrameSnapshot(
      Box(
        { width: 20, height: 10, paddingLeft: 4 },
        Box({ width: 10, height: 6 }, TerminalImage({ state: imageState, width: 'fill', height: 'fill' })),
      ),
      { width: 20, height: 10 },
    );

    const output = renderFrameToString(nextFrame, { previousFrame });

    expect(output).toContain(`\x1b_Ga=d,d=i,i=${imageState.protocolState.kittyImageId}\x1b\\`);
    expect(output).toMatch(/\x1b7\x1b\[\d+;\d+H\x1b_Ga=T/);
  });
});
