/**
 * Column flex height distribution tests
 */

import { describe, it, expect } from 'vitest';
import { calculateLayout } from '../../src/core/layout.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { ScrollArea } from '../../src/organisms/scroll-area.js';

describe('column flex height', () => {
  it('should distribute remaining height to flex children', () => {
    const node = Box(
      { flexDirection: 'column', width: 20, height: 10 },
      Box({ height: 2 }, Text({}, 'Header')),
      Box({ flexGrow: 1 }, Text({}, 'A')),
      Box({ flexGrow: 1 }, Text({}, 'B'))
    );

    const layout = calculateLayout(node, 20, 10);

    expect(layout.children[1].height).toBe(4);
    expect(layout.children[2].height).toBe(4);
  });

  it('should respect minHeight and maxHeight for flex children', () => {
    const node = Box(
      { flexDirection: 'column', width: 20, height: 12 },
      Box({ height: 2 }, Text({}, 'Header')),
      Box({ flexGrow: 1, minHeight: 6 }, Text({}, 'Min')),
      Box({ flexGrow: 1, maxHeight: 2 }, Text({}, 'Max'))
    );

    const layout = calculateLayout(node, 20, 12);

    expect(layout.children[1].height).toBe(6);
    expect(layout.children[2].height).toBe(2);
  });

  it('should let ScrollArea fill remaining height when height is omitted', () => {
    const content = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

    const node = Box(
      { flexDirection: 'column', width: 20, height: 10 },
      Box({ height: 2 }, Text({}, 'Header')),
      ScrollArea({ content })
    );

    const layout = calculateLayout(node, 20, 10);

    expect(layout.children[1].height).toBe(8);
  });
});
