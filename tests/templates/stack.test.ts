/**
 * Stack Templates Tests
 *
 * Tests for VStack, HStack, Center, FullScreen, and Spacer components
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VStack, HStack, Center, FullScreen, Spacer } from '../../src/templates/stack.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { renderToString } from '../../src/core/renderer.js';

describe('VStack', () => {
  describe('Basic Usage', () => {
    it('should create a vertical stack with children array', () => {
      const vnode = VStack([
        Text({}, 'Line 1'),
        Text({}, 'Line 2'),
      ]);

      expect(vnode.type).toBe('box');
      expect(vnode.props.flexDirection).toBe('column');
      expect(vnode.children.length).toBe(2);
    });

    it('should create a vertical stack with props object', () => {
      const vnode = VStack({
        gap: 1,
        children: [
          Text({}, 'Line 1'),
          Text({}, 'Line 2'),
        ],
      });

      expect(vnode.type).toBe('box');
      expect(vnode.props.flexDirection).toBe('column');
      // With gap=1, should have spacer between children
      expect(vnode.children.length).toBe(3); // 2 texts + 1 spacer
    });
  });

  describe('Gap', () => {
    it('should insert spacers between children when gap > 0', () => {
      const vnode = VStack({
        gap: 2,
        children: [
          Text({}, 'A'),
          Text({}, 'B'),
          Text({}, 'C'),
        ],
      });

      // 3 children + 2 spacers = 5
      expect(vnode.children.length).toBe(5);

      // Spacers should have height matching gap
      expect(vnode.children[1].props.height).toBe(2);
      expect(vnode.children[3].props.height).toBe(2);
    });

    it('should not insert spacers when gap = 0', () => {
      const vnode = VStack({
        gap: 0,
        children: [Text({}, 'A'), Text({}, 'B')],
      });

      expect(vnode.children.length).toBe(2);
    });

    it('should not insert spacer after last child', () => {
      const vnode = VStack({
        gap: 1,
        children: [Text({}, 'Only')],
      });

      expect(vnode.children.length).toBe(1);
    });
  });

  describe('Alignment', () => {
    it('should align left (flex-start)', () => {
      const vnode = VStack({
        align: 'left',
        children: [Text({}, 'Left')],
      });

      expect(vnode.props.alignItems).toBe('flex-start');
    });

    it('should align center', () => {
      const vnode = VStack({
        align: 'center',
        children: [Text({}, 'Center')],
      });

      expect(vnode.props.alignItems).toBe('center');
    });

    it('should align right (flex-end)', () => {
      const vnode = VStack({
        align: 'right',
        children: [Text({}, 'Right')],
      });

      expect(vnode.props.alignItems).toBe('flex-end');
    });

    it('should stretch by default', () => {
      const vnode = VStack([Text({}, 'Stretch')]);

      expect(vnode.props.alignItems).toBe('stretch');
    });
  });

  describe('Padding', () => {
    it('should apply padding', () => {
      const vnode = VStack({
        padding: 2,
        children: [Text({}, 'Padded')],
      });

      expect(vnode.props.padding).toBe(2);
    });

    it('should apply paddingX and paddingY', () => {
      const vnode = VStack({
        paddingX: 4,
        paddingY: 2,
        children: [Text({}, 'Padded')],
      });

      expect(vnode.props.paddingX).toBe(4);
      expect(vnode.props.paddingY).toBe(2);
    });
  });

  describe('Dimensions', () => {
    it('should apply fixed width and height', () => {
      const vnode = VStack({
        width: 40,
        height: 20,
        children: [Text({}, 'Sized')],
      });

      expect(vnode.props.width).toBe(40);
      expect(vnode.props.height).toBe(20);
    });

    it('should support string dimensions', () => {
      const vnode = VStack({
        width: '100%',
        children: [Text({}, 'Full')],
      });

      expect(vnode.props.width).toBe('100%');
    });
  });

  describe('Border', () => {
    it('should apply border when enabled', () => {
      const vnode = VStack({
        border: true,
        borderStyle: 'round',
        borderColor: 'cyan',
        children: [Text({}, 'Bordered')],
      });

      expect(vnode.props.borderStyle).toBe('round');
      expect(vnode.props.borderColor).toBe('cyan');
    });

    it('should not apply border when disabled', () => {
      const vnode = VStack({
        border: false,
        borderStyle: 'round',
        children: [Text({}, 'No Border')],
      });

      expect(vnode.props.borderStyle).toBeUndefined();
    });
  });
});

describe('HStack', () => {
  describe('Basic Usage', () => {
    it('should create a horizontal stack with children array', () => {
      const vnode = HStack([
        Text({}, 'Left'),
        Text({}, 'Right'),
      ]);

      expect(vnode.type).toBe('box');
      expect(vnode.props.flexDirection).toBe('row');
      expect(vnode.children.length).toBe(2);
    });

    it('should create a horizontal stack with props object', () => {
      const vnode = HStack({
        gap: 2,
        children: [
          Text({}, 'A'),
          Text({}, 'B'),
        ],
      });

      expect(vnode.props.flexDirection).toBe('row');
      expect(vnode.children.length).toBe(3); // 2 texts + 1 spacer
    });
  });

  describe('Gap', () => {
    it('should insert width spacers between children', () => {
      const vnode = HStack({
        gap: 4,
        children: [
          Text({}, 'A'),
          Text({}, 'B'),
          Text({}, 'C'),
        ],
      });

      // Spacers should have width matching gap
      expect(vnode.children[1].props.width).toBe(4);
      expect(vnode.children[3].props.width).toBe(4);
    });
  });

  describe('Alignment', () => {
    it('should align top (flex-start)', () => {
      const vnode = HStack({
        align: 'top',
        children: [Text({}, 'Top')],
      });

      expect(vnode.props.alignItems).toBe('flex-start');
    });

    it('should align center', () => {
      const vnode = HStack({
        align: 'center',
        children: [Text({}, 'Center')],
      });

      expect(vnode.props.alignItems).toBe('center');
    });

    it('should align bottom (flex-end)', () => {
      const vnode = HStack({
        align: 'bottom',
        children: [Text({}, 'Bottom')],
      });

      expect(vnode.props.alignItems).toBe('flex-end');
    });

    it('should stretch by default', () => {
      const vnode = HStack([Text({}, 'Stretch')]);

      expect(vnode.props.alignItems).toBe('stretch');
    });
  });

  describe('Justify', () => {
    it('should justify start', () => {
      const vnode = HStack({
        justify: 'start',
        children: [Text({}, 'Start')],
      });

      expect(vnode.props.justifyContent).toBe('flex-start');
    });

    it('should justify center', () => {
      const vnode = HStack({
        justify: 'center',
        children: [Text({}, 'Center')],
      });

      expect(vnode.props.justifyContent).toBe('center');
    });

    it('should justify end', () => {
      const vnode = HStack({
        justify: 'end',
        children: [Text({}, 'End')],
      });

      expect(vnode.props.justifyContent).toBe('flex-end');
    });

    it('should justify between (space-between)', () => {
      const vnode = HStack({
        justify: 'between',
        children: [Text({}, 'A'), Text({}, 'B')],
      });

      expect(vnode.props.justifyContent).toBe('space-between');
    });

    it('should justify around (space-around)', () => {
      const vnode = HStack({
        justify: 'around',
        children: [Text({}, 'A'), Text({}, 'B')],
      });

      expect(vnode.props.justifyContent).toBe('space-around');
    });
  });

  describe('Border', () => {
    it('should apply border when enabled', () => {
      const vnode = HStack({
        border: true,
        borderStyle: 'double',
        borderColor: 'green',
        children: [Text({}, 'Bordered')],
      });

      expect(vnode.props.borderStyle).toBe('double');
      expect(vnode.props.borderColor).toBe('green');
    });
  });
});

describe('Center', () => {
  it('should center both horizontally and vertically by default', () => {
    const vnode = Center({
      width: 80,
      height: 24,
      children: Text({}, 'Centered'),
    });

    expect(vnode.props.alignItems).toBe('center');
    expect(vnode.props.justifyContent).toBe('center');
    expect(vnode.props.width).toBe(80);
    expect(vnode.props.height).toBe(24);
  });

  it('should center only horizontally when vertical=false', () => {
    const vnode = Center({
      horizontal: true,
      vertical: false,
      width: 80,
      height: 24,
      children: Text({}, 'H Center'),
    });

    expect(vnode.props.alignItems).toBe('center');
    expect(vnode.props.justifyContent).toBe('flex-start');
  });

  it('should center only vertically when horizontal=false', () => {
    const vnode = Center({
      horizontal: false,
      vertical: true,
      width: 80,
      height: 24,
      children: Text({}, 'V Center'),
    });

    expect(vnode.props.alignItems).toBe('flex-start');
    expect(vnode.props.justifyContent).toBe('center');
  });

  it('should use terminal size when dimensions not specified', () => {
    const vnode = Center({
      children: Text({}, 'Full'),
    });

    // Should have some width/height from process.stdout or defaults
    expect(vnode.props.width).toBeGreaterThan(0);
    expect(vnode.props.height).toBeGreaterThan(0);
  });
});

describe('FullScreen', () => {
  it('should fill terminal dimensions', () => {
    const vnode = FullScreen({
      children: Text({}, 'Full Screen'),
    });

    expect(vnode.props.flexDirection).toBe('column');
    expect(vnode.props.width).toBeGreaterThan(0);
    expect(vnode.props.height).toBeGreaterThan(0);
  });

  it('should apply padding', () => {
    const vnode = FullScreen({
      padding: 2,
      children: Text({}, 'Padded'),
    });

    expect(vnode.props.padding).toBe(2);
  });

  it('should apply background color', () => {
    const vnode = FullScreen({
      backgroundColor: 'blue',
      children: Text({}, 'Blue BG'),
    });

    expect(vnode.props.backgroundColor).toBe('blue');
  });
});

describe('Spacer', () => {
  it('should create a flexible space with default flex=1', () => {
    const vnode = Spacer();

    expect(vnode.props.flexGrow).toBe(1);
    expect(vnode.props.flexShrink).toBe(0);
  });

  it('should respect custom flex value', () => {
    const vnode = Spacer({ flex: 2 });

    expect(vnode.props.flexGrow).toBe(2);
  });

  it('should respect minSize', () => {
    const vnode = Spacer({ minSize: 10 });

    expect(vnode.props.minWidth).toBe(10);
    expect(vnode.props.minHeight).toBe(10);
  });

  it('should push items apart in HStack', () => {
    const vnode = HStack([
      Text({}, 'Left'),
      Spacer(),
      Text({}, 'Right'),
    ]);

    expect(vnode.children.length).toBe(3);
    expect(vnode.children[1].props.flexGrow).toBe(1);
  });
});

describe('Integration', () => {
  it('should create valid VNode structure for VStack with gap', () => {
    const vnode = VStack({
      gap: 1,
      children: [
        Text({}, 'Line 1'),
        Text({}, 'Line 2'),
      ],
    });

    // Verify structure
    expect(vnode.type).toBe('box');
    expect(vnode.props.flexDirection).toBe('column');
    expect(vnode.children.length).toBe(3); // 2 texts + 1 gap spacer
    // Text stores content in props.children
    expect(vnode.children[0].props.children).toBe('Line 1');
    expect(vnode.children[2].props.children).toBe('Line 2');
  });

  it('should create valid VNode structure for nested stacks', () => {
    const vnode = VStack([
      HStack([
        Text({}, 'A'),
        Text({}, 'B'),
      ]),
      HStack([
        Text({}, 'C'),
        Text({}, 'D'),
      ]),
    ]);

    // Verify structure
    expect(vnode.type).toBe('box');
    expect(vnode.children.length).toBe(2);
    expect(vnode.children[0].props.flexDirection).toBe('row');
    expect(vnode.children[1].props.flexDirection).toBe('row');
  });

  it('should create valid VNode structure for HStack with Spacer', () => {
    const vnode = HStack([
      Text({}, 'Logo'),
      Spacer(),
      Text({}, 'Menu'),
    ]);

    // Verify structure
    expect(vnode.type).toBe('box');
    expect(vnode.props.flexDirection).toBe('row');
    expect(vnode.children.length).toBe(3);
    // Text stores content in props.children
    expect(vnode.children[0].props.children).toBe('Logo');
    expect(vnode.children[1].props.flexGrow).toBe(1); // Spacer
    expect(vnode.children[2].props.children).toBe('Menu');
  });
});
