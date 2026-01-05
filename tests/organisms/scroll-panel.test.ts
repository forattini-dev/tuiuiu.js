/**
 * Tests for ScrollPanel component.
 */

import { describe, it, expect } from 'vitest';
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
});
