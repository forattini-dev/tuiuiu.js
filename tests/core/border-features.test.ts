/**
 * Tests for Border Features: partial borders and borderText
 *
 * Tests type-level props acceptance and DrawBoxCommand construction.
 * The actual rendering of partial borders happens in the full render pipeline
 * (renderer.ts and delta-render.ts) — tested here at the data structure level.
 */

import { describe, it, expect } from 'vitest';
import { Box, Text } from '../../src/primitives/nodes.js';
import { renderToString } from '../../src/core/renderer.js';
import type { BoxStyle, BorderStyleName } from '../../src/utils/types.js';

describe('BoxStyle type accepts border props', () => {
  it('accepts borderText prop', () => {
    const style: BoxStyle = {
      borderStyle: 'single',
      borderText: 'My Title',
    };
    expect(style.borderText).toBe('My Title');
  });

  it('accepts borderTop boolean prop', () => {
    const style: BoxStyle = { borderStyle: 'single', borderTop: true };
    expect(style.borderTop).toBe(true);
  });

  it('accepts borderBottom boolean prop', () => {
    const style: BoxStyle = { borderStyle: 'single', borderBottom: false };
    expect(style.borderBottom).toBe(false);
  });

  it('accepts borderLeft boolean prop', () => {
    const style: BoxStyle = { borderStyle: 'single', borderLeft: true };
    expect(style.borderLeft).toBe(true);
  });

  it('accepts borderRight boolean prop', () => {
    const style: BoxStyle = { borderStyle: 'single', borderRight: false };
    expect(style.borderRight).toBe(false);
  });

  it('accepts all border side props together', () => {
    const style: BoxStyle = {
      borderStyle: 'round',
      borderTop: true,
      borderBottom: false,
      borderLeft: true,
      borderRight: false,
      borderText: 'Panel Title',
    };
    expect(style.borderTop).toBe(true);
    expect(style.borderBottom).toBe(false);
    expect(style.borderLeft).toBe(true);
    expect(style.borderRight).toBe(false);
    expect(style.borderText).toBe('Panel Title');
  });
});

describe('VNode props propagation', () => {
  it('Box stores borderText in props', () => {
    const node = Box({ borderStyle: 'single', borderText: 'Title' }, Text({}, 'Hi'));
    expect(node.props.borderText).toBe('Title');
  });

  it('Box stores borderTop in props', () => {
    const node = Box({ borderStyle: 'single', borderTop: false }, Text({}, 'Hi'));
    expect(node.props.borderTop).toBe(false);
  });

  it('Box stores borderBottom in props', () => {
    const node = Box({ borderStyle: 'single', borderBottom: false }, Text({}, 'Hi'));
    expect(node.props.borderBottom).toBe(false);
  });

  it('Box stores borderLeft in props', () => {
    const node = Box({ borderStyle: 'single', borderLeft: false }, Text({}, 'Hi'));
    expect(node.props.borderLeft).toBe(false);
  });

  it('Box stores borderRight in props', () => {
    const node = Box({ borderStyle: 'single', borderRight: false }, Text({}, 'Hi'));
    expect(node.props.borderRight).toBe(false);
  });

  it('Box stores all partial border props', () => {
    const node = Box({
      borderStyle: 'round',
      borderTop: true,
      borderBottom: false,
      borderLeft: true,
      borderRight: false,
      borderText: 'Settings',
    }, Text({}, 'Content'));

    expect(node.props.borderStyle).toBe('round');
    expect(node.props.borderTop).toBe(true);
    expect(node.props.borderBottom).toBe(false);
    expect(node.props.borderLeft).toBe(true);
    expect(node.props.borderRight).toBe(false);
    expect(node.props.borderText).toBe('Settings');
  });

  it('Box omits border props when not specified', () => {
    const node = Box({ borderStyle: 'single' }, Text({}, 'Hi'));
    expect(node.props.borderTop).toBeUndefined();
    expect(node.props.borderBottom).toBeUndefined();
    expect(node.props.borderLeft).toBeUndefined();
    expect(node.props.borderRight).toBeUndefined();
    expect(node.props.borderText).toBeUndefined();
  });
});

describe('Border text in renderToString', () => {
  it('renders basic bordered box', () => {
    const node = Box(
      { borderStyle: 'single', width: 10, height: 3 },
      Text({}, 'Hi')
    );
    const output = renderToString(node, 20);
    expect(output).toContain('─');
    expect(output).toContain('│');
  });

  it('renders border with round style', () => {
    const node = Box(
      { borderStyle: 'round', width: 10, height: 3 },
      Text({}, 'Hi')
    );
    const output = renderToString(node, 20);
    expect(output).toContain('╭');
    expect(output).toContain('╯');
  });

  it('renders different border styles', () => {
    const styles: BorderStyleName[] = ['single', 'double', 'round', 'bold'];
    for (const style of styles) {
      const node = Box(
        { borderStyle: style, width: 10, height: 3 },
        Text({}, 'Hi')
      );
      const output = renderToString(node, 20);
      expect(output.length).toBeGreaterThan(0);
    }
  });
});
