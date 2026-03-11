import { describe, expect, it } from 'vitest';

import { createSolidImage } from '../../src/core/graphics.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { renderFrameToString } from '../../src/core/renderer.js';
import { TerminalImage, createTerminalImage } from '../../src/atoms/terminal-image.js';

describe('TerminalImage', () => {
  it('attaches terminal-image metadata to a box vnode', () => {
    const source = createSolidImage(60, 40, 255, 0, 0);
    const node = TerminalImage({
      id: 'hero',
      width: 10,
      height: 6,
      borderStyle: 'single',
      padding: 1,
      source,
      protocol: 'kitty',
      fit: 'contain',
    });

    expect(node.type).toBe('box');
    expect(node.props.__terminalImage).toMatchObject({
      source,
      options: {
        fit: 'contain',
        protocol: 'kitty',
        width: undefined,
        height: undefined,
      },
    });
    expect(node.props.__terminalImage.protocolState).toMatchObject({
      render: expect.any(Function),
      invalidate: expect.any(Function),
      clear: expect.any(Function),
      stats: expect.any(Function),
    });

    const frame = createFrameSnapshot(node, { width: 10, height: 8 });
    expect(frame.drawCommands.find((command) => command.type === 'terminal-image')).toMatchObject({
      type: 'terminal-image',
      protocol: 'kitty',
      cellRender: false,
    });
  });

  it('supports stateful source and protocol updates through createTerminalImage', () => {
    const state = createTerminalImage({
      source: createSolidImage(60, 40, 0, 255, 0),
      protocol: 'halfblock',
      fit: 'contain',
    });

    const initialNode = TerminalImage({
      width: 10,
      height: 6,
      borderStyle: 'single',
      padding: 1,
      state,
    });
    const initialFrame = createFrameSnapshot(initialNode, { width: 10, height: 8 });

    state.setSource(createSolidImage(60, 40, 0, 0, 255));
    state.setProtocol('kitty');

    const nextNode = TerminalImage({
      width: 10,
      height: 6,
      borderStyle: 'single',
      padding: 1,
      state,
    });
    const nextFrame = createFrameSnapshot(nextNode, { width: 10, height: 8 });

    expect(initialFrame.drawCommands.find((command) => command.type === 'terminal-image')).toMatchObject({
      protocol: 'halfblock',
      cellRender: true,
    });
    expect(nextFrame.drawCommands.find((command) => command.type === 'terminal-image')).toMatchObject({
      protocol: 'kitty',
      cellRender: false,
    });
  });

  it('reuses cached terminal-image payloads across stable renders', () => {
    const state = createTerminalImage({
      source: createSolidImage(20, 20, 255, 0, 255),
      protocol: 'halfblock',
      fit: 'contain',
    });

    const render = () => renderFrameToString(
      createFrameSnapshot(
        TerminalImage({
          width: 10,
          height: 6,
          borderStyle: 'single',
          padding: 1,
          state,
        }),
        { width: 10, height: 8 },
      ),
    );

    const first = render();
    const second = render();

    expect(second).toBe(first);
    expect(state.protocolState.stats()).toMatchObject({
      hits: 1,
      misses: 1,
      size: 1,
    });
  });
});
