/** Tests for the canonical variadic stack composition API. */

import { describe, expect, it } from 'vitest';
import { Box, Text } from '../../src/primitives/nodes.js';
import { Center, FullScreen, HStack, Spacer, VStack } from '../../src/templates/stack.js';

describe('VStack', () => {
  it('stacks variadic children vertically and inserts height gaps', () => {
    const node = VStack(
      { gap: 2 },
      Text({}, 'A'),
      Text({}, 'B'),
      Text({}, 'C'),
    );

    expect(node.props.flexDirection).toBe('column');
    expect(node.children).toHaveLength(5);
    expect(node.children[1]?.props.height).toBe(2);
    expect(node.children[3]?.props.height).toBe(2);
  });

  it('does not add a spacer after the last child', () => {
    expect(VStack({ gap: 1 }, Text({}, 'Only')).children).toHaveLength(1);
  });

  it.each([
    ['left', 'flex-start'],
    ['center', 'center'],
    ['right', 'flex-end'],
    ['stretch', 'stretch'],
  ] as const)('maps %s alignment to %s', (align, expected) => {
    expect(VStack({ align }, Text({}, 'Item')).props.alignItems).toBe(expected);
  });

  it('applies dimensions, padding, and enabled borders', () => {
    const node = VStack(
      {
        width: '100%',
        height: 20,
        paddingX: 4,
        paddingY: 2,
        border: true,
        borderStyle: 'round',
        borderColor: 'cyan',
      },
      Text({}, 'Content'),
    );

    expect(node.props).toMatchObject({
      width: '100%',
      height: 20,
      paddingX: 4,
      paddingY: 2,
      borderStyle: 'round',
      borderColor: 'cyan',
    });
  });

  it('omits border style when disabled', () => {
    expect(VStack({ border: false, borderStyle: 'round' }).props.borderStyle).toBeUndefined();
  });
});

describe('HStack', () => {
  it('stacks variadic children horizontally and inserts width gaps', () => {
    const node = HStack(
      { gap: 4 },
      Text({}, 'A'),
      Text({}, 'B'),
      Text({}, 'C'),
    );

    expect(node.props.flexDirection).toBe('row');
    expect(node.children).toHaveLength(5);
    expect(node.children[1]?.props.width).toBe(4);
    expect(node.children[3]?.props.width).toBe(4);
  });

  it.each([
    ['top', 'flex-start'],
    ['center', 'center'],
    ['bottom', 'flex-end'],
    ['stretch', 'stretch'],
  ] as const)('maps %s alignment to %s', (align, expected) => {
    expect(HStack({ align }, Text({}, 'Item')).props.alignItems).toBe(expected);
  });

  it.each([
    ['start', 'flex-start'],
    ['center', 'center'],
    ['end', 'flex-end'],
    ['between', 'space-between'],
    ['around', 'space-around'],
  ] as const)('maps %s justification to %s', (justify, expected) => {
    expect(HStack({ justify }, Text({}, 'Item')).props.justifyContent).toBe(expected);
  });

  it('keeps a flexible Spacer as a normal child', () => {
    const node = HStack({}, Text({}, 'Left'), Spacer(), Text({}, 'Right'));

    expect(node.children).toHaveLength(3);
    expect(node.children[1]?.props.flexGrow).toBe(1);
  });
});

describe('Center', () => {
  it('centers variadic content in both axes by default', () => {
    const node = Center({ width: 80, height: 24 }, Text({}, 'Centered'));

    expect(node.props).toMatchObject({
      alignItems: 'center',
      justifyContent: 'center',
      width: 80,
      height: 24,
    });
    expect(node.children[0]?.props.children).toBe('Centered');
  });

  it('can center only one axis and fills unspecified dimensions', () => {
    const horizontal = Center(
      { horizontal: true, vertical: false },
      Box({}, Text({}, 'Horizontal')),
    );
    const vertical = Center(
      { horizontal: false, vertical: true },
      Text({}, 'Vertical'),
    );

    expect(horizontal.props).toMatchObject({
      alignItems: 'center',
      justifyContent: 'flex-start',
      width: 'fill',
      height: 'fill',
    });
    expect(vertical.props).toMatchObject({
      alignItems: 'flex-start',
      justifyContent: 'center',
    });
  });
});

describe('FullScreen', () => {
  it('fills its parent and accepts variadic content', () => {
    const node = FullScreen(
      { padding: 2, backgroundColor: 'blue' },
      Text({}, 'Full Screen'),
    );

    expect(node.props).toMatchObject({
      flexDirection: 'column',
      width: 'fill',
      height: 'fill',
      padding: 2,
      backgroundColor: 'blue',
    });
    expect(node.children[0]?.props.children).toBe('Full Screen');
  });
});

describe('nested composition', () => {
  it('preserves nested stack hierarchy', () => {
    const node = VStack(
      {},
      HStack({}, Text({}, 'A'), Text({}, 'B')),
      HStack({}, Text({}, 'C'), Text({}, 'D')),
    );

    expect(node.children).toHaveLength(2);
    expect(node.children[0]?.props.flexDirection).toBe('row');
    expect(node.children[1]?.props.flexDirection).toBe('row');
  });
});
