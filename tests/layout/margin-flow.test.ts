/**
 * Layout margin flow tests
 */

import { describe, it, expect } from 'vitest';
import { calculateLayout } from '../../src/core/layout.js';
import { Box, Text } from '../../src/primitives/index.js';

describe('Layout margin flow', () => {
  it('should include horizontal margins in row layout positions', () => {
    const node = Box(
      { flexDirection: 'row' },
      Box({ width: 5, marginLeft: 2, marginRight: 1 }, Text({}, 'A')),
      Box({ width: 5 }, Text({}, 'B'))
    );

    const layout = calculateLayout(node, 30);

    expect(layout.children[0].x).toBe(2);
    expect(layout.children[1].x).toBe(8);
    expect(layout.width).toBe(13);
  });

  it('should include vertical margins in column layout positions', () => {
    const node = Box(
      { flexDirection: 'column' },
      Box({ height: 2, marginTop: 1, marginBottom: 2 }, Text({}, 'A')),
      Box({ height: 1 }, Text({}, 'B'))
    );

    const layout = calculateLayout(node, 20);

    expect(layout.children[0].y).toBe(1);
    expect(layout.children[1].y).toBe(5);
    expect(layout.height).toBe(6);
  });
});
