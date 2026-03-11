/**
 * Tests for ScrollPanel component.
 */

import { describe, it, expect } from 'vitest';
import { TerminalImage } from '../../src/atoms/terminal-image.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { createSolidImage } from '../../src/core/graphics.js';
import { renderFrameToString } from '../../src/core/renderer.js';
import type { VNode } from '../../src/utils/types.js';
import { ScrollPanel } from '../../src/organisms/scroll-panel.js';

describe('ScrollPanel', () => {
  it('uses auto height to apply flexGrow', () => {
    const node = ScrollPanel({
      title: 'Logs',
      content: ['a', 'b'],
      height: 'fill',
      flexGrow: 2,
    });

    expect(node.type).toBe('box');
    expect(node.props.flexGrow).toBe(2);

    const children = node.children as VNode[];
    expect(children[0]?.type).toBe('box');
  });

  it('uses fixed height without auto flexGrow', () => {
    const node = ScrollPanel({
      content: ['a', 'b'],
      height: 10,
    });

    expect(node.type).toBe('box');
    expect(node.props.height).toBe(10);

    const children = node.children as VNode[];
    expect(children[0]?.type).toBe('box');
  });

  it('renders TerminalImage content inside the scrollable body', () => {
    const node = ScrollPanel({
      title: 'Preview',
      height: 8,
      content: [
        TerminalImage({
          source: createSolidImage(60, 40, 0, 255, 255),
          protocol: 'kitty',
          width: 12,
          height: 6,
        }),
      ],
    });

    const frame = createFrameSnapshot(node, { width: 32, height: 12 });
    const output = renderFrameToString(frame);

    expect(frame.drawCommands.some(command => command.type === 'terminal-image')).toBe(true);
    expect(frame.reservedRegions).toHaveLength(1);
    expect(output).toContain('\x1b_G');
  });
});
