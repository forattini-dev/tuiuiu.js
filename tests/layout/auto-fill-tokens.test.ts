/**
 * Auto/fill sizing token tests
 */

import { describe, it, expect } from 'vitest';
import { calculateLayout } from '../../src/core/layout.js';
import { Box, Text } from '../../src/primitives/nodes.js';

describe('auto/fill sizing tokens', () => {
  it('fills remaining height in column layouts', () => {
    const node = Box(
      { flexDirection: 'column', width: 20, height: 10 },
      Box({ height: 2 }, Text({}, 'Header')),
      Box({ height: 'fill' }, Text({}, 'Body'))
    );

    const layout = calculateLayout(node, 20, 10);
    expect(layout.children[1].height).toBe(8);
  });

  it('fills remaining width in row layouts', () => {
    const node = Box(
      { flexDirection: 'row', width: 80, height: 3 },
      Box({ width: 20 }, Text({}, 'Fixed')),
      Box({ width: 'fill' }, Text({}, 'Fill'))
    );

    const layout = calculateLayout(node, 80, 3);
    expect(layout.children[1].width).toBe(60);
  });

  it('auto width sizes to content', () => {
    const node = Box(
      { width: 'auto' },
      Text({}, 'Hello')
    );

    const layout = calculateLayout(node, 50, 5);
    expect(layout.width).toBe(5);
  });

  it('auto height sizes to content', () => {
    const node = Box(
      { height: 'auto' },
      Text({}, 'Line 1\nLine 2')
    );

    const layout = calculateLayout(node, 20, 10);
    expect(layout.height).toBe(2);
  });
});
