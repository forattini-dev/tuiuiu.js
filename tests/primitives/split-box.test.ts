import { describe, expect, it, vi } from 'vitest';

import { createFrameSnapshot } from '../../src/core/frame.js';
import { renderToString } from '../../src/core/renderer.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { SplitBox } from '../../src/primitives/split-box.js';
import { stripAnsi } from '../../src/utils/text-utils.js';

describe('SplitBox', () => {
  it('renders connected dividers through the main frame renderer', () => {
    const node = SplitBox({
      width: 20,
      minHeight: 3,
      sections: [
        { width: 6, content: Text({}, 'A') },
        { content: Text({}, 'B'), valign: 'bottom' },
      ],
    });

    const output = stripAnsi(renderToString(node, { width: 20, height: 10 }));
    const lines = output.split('\n');

    expect(lines).toEqual([
      '┌──────┬───────────┐',
      '│A     │           │',
      '│      │           │',
      '│      │B          │',
      '└──────┴───────────┘',
    ]);
  });

  it('keeps original interactive section VNodes in the committed tree', () => {
    const onClick = vi.fn();
    const interactive = Box(
      { id: 'interactive', onClick },
      Text({}, 'Click me'),
    );
    const node = SplitBox({
      width: 24,
      sections: [
        { content: interactive },
        { content: Text({}, 'Other') },
      ],
    });
    const frame = createFrameSnapshot(node, { width: 24, height: 8 });

    expect(frame.hitTargets.some(target => target.node === interactive)).toBe(true);
    expect(frame.queries.getElement('interactive')).toMatchObject({
      found: true,
      ambiguous: false,
    });
  });

  it('does not swallow errors thrown while laying out section content', () => {
    const node = SplitBox({
      width: 20,
      sections: [
        { content: Box({ width: Number.NaN }, Text({}, 'invalid')) },
      ],
    });

    expect(() => createFrameSnapshot(node, { width: 20, height: 8 }))
      .toThrow(RangeError);
  });

  it('rejects ambiguous or unsafe sizing inputs', () => {
    expect(() => SplitBox({ sections: [] })).toThrow(RangeError);
    expect(() => SplitBox({
      width: 4,
      sections: [
        { content: Text({}, 'A') },
        { content: Text({}, 'B') },
      ],
    })).toThrow(RangeError);
    expect(() => SplitBox({
      padding: -1,
      sections: [{ content: Text({}, 'A') }],
    })).toThrow(RangeError);
    expect(() => SplitBox({
      sections: [{ flexGrow: Number.NaN, content: Text({}, 'A') }],
    })).toThrow(RangeError);
  });
});
