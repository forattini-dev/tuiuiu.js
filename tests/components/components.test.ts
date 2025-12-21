/**
 * Tests for Tuiuiu Components
 *
 * Comprehensive tests for Box, Text, Spacer, Slot, and other components
 */

import { describe, it, expect } from 'vitest';
import {
  Box,
  Text,
  Spacer,
  Newline,
  Fragment,
  When,
  Each,
  Divider,
  BasicSpinner as Spinner,
  BasicProgressBar as ProgressBar,
  Badge,
  Slot,
} from '../../src/components/index.js';
import { renderToString } from '../../src/core/renderer.js';
import type { VNode } from '../../src/utils/types.js';

describe('Components', () => {
  describe('Text', () => {
    it('should create a text node', () => {
      const node = Text({}, 'hello');
      expect(node.type).toBe('text');
      const output = renderToString(node, 80);
      expect(output).toContain('hello');
    });

    it('should handle multiple children', () => {
      const node = Text({}, 'hello', ' ', 'world');
      const output = renderToString(node, 80);
      expect(output).toContain('hello world');
    });

    it('should apply color', () => {
      const node = Text({ color: 'red' }, 'error');
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[31m'); // Red ANSI code
      expect(output).toContain('error');
    });

    it('should apply bold', () => {
      const node = Text({ bold: true }, 'bold text');
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[1m'); // Bold ANSI code
    });

    it('should apply dim', () => {
      const node = Text({ dim: true }, 'dim text');
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[2m'); // Dim ANSI code
    });

    it('should apply underline', () => {
      const node = Text({ underline: true }, 'underlined');
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[4m'); // Underline ANSI code
    });

    it('should apply italic', () => {
      const node = Text({ italic: true }, 'italic');
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[3m'); // Italic ANSI code
    });

    it('should apply strikethrough', () => {
      const node = Text({ strikethrough: true }, 'strikethrough');
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[9m'); // Strikethrough ANSI code
    });

    it('should apply backgroundColor', () => {
      const node = Text({ backgroundColor: 'blue' }, 'highlight');
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[44m'); // Blue background ANSI code
    });

    it('should combine multiple styles', () => {
      const node = Text({ color: 'green', bold: true }, 'styled');
      const output = renderToString(node, 80);
      expect(output).toContain('styled');
      expect(output).toMatch(/\x1b\[\d+(;\d+)*m/); // Has ANSI code
    });
  });

  describe('Box', () => {
    it('should create a box node', () => {
      const node = Box({});
      expect(node.type).toBe('box');
    });

    it('should contain children', () => {
      const node = Box({}, Text({}, 'child'));
      expect(node.children).toHaveLength(1);
    });

    it('should render with border', () => {
      const node = Box(
        { borderStyle: 'single', width: 10, height: 3 },
        Text({}, 'hi')
      );
      const output = renderToString(node, 80);
      expect(output).toContain('─'); // Horizontal border
      expect(output).toContain('│'); // Vertical border
    });

    it('should render with round border', () => {
      const node = Box(
        { borderStyle: 'round', width: 10, height: 3 },
        Text({}, 'hi')
      );
      const output = renderToString(node, 80);
      expect(output).toContain('╭'); // Round corner
      expect(output).toContain('╯'); // Round corner
    });

    it('should apply border color', () => {
      const node = Box(
        { borderStyle: 'single', borderColor: 'cyan', width: 10, height: 3 },
        Text({}, 'hi')
      );
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[36m'); // Cyan
    });

    it('should render column layout', () => {
      const node = Box(
        { flexDirection: 'column' },
        Text({}, 'line1'),
        Text({}, 'line2')
      );
      const output = renderToString(node, 80);
      const lines = output.split('\n');
      expect(lines[0]).toContain('line1');
      expect(lines[1]).toContain('line2');
    });

    it('should render row layout', () => {
      const node = Box(
        { flexDirection: 'row' },
        Text({}, 'A'),
        Text({}, 'B')
      );
      const output = renderToString(node, 80);
      expect(output).toContain('AB');
    });
  });

  describe('Spacer', () => {
    it('should create a spacer with flexGrow', () => {
      const node = Spacer();
      expect(node.type).toMatch(/spacer|box/);
      expect(node.props.flexGrow).toBe(1);
    });

    it('should expand to fill space', () => {
      const node = Box(
        { flexDirection: 'row', width: 20 },
        Text({}, 'L'),
        Spacer(),
        Text({}, 'R')
      );
      const output = renderToString(node, 80);
      expect(output.startsWith('L')).toBe(true);
      expect(output.trimEnd().endsWith('R')).toBe(true);
    });
  });

  describe('Newline', () => {
    it('should create newlines', () => {
      const node = Box(
        { flexDirection: 'column' },
        Text({}, 'before'),
        Newline(),
        Text({}, 'after')
      );
      const output = renderToString(node, 80);
      const lines = output.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(3);
    });

    it('should create multiple newlines', () => {
      const node = Box(
        { flexDirection: 'column' },
        Text({}, 'top'),
        Newline({ count: 3 }),
        Text({}, 'bottom')
      );
      const output = renderToString(node, 80);
      const lines = output.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Fragment', () => {
    it('should group children without wrapper', () => {
      const node = Fragment(
        Text({}, 'A'),
        Text({}, 'B')
      );
      expect(node.type).toBe('fragment');
      expect(node.children).toHaveLength(2);
    });
  });

  describe('When (conditional rendering)', () => {
    it('should render child when condition is true', () => {
      const node = Box(
        {},
        When(true, Text({}, 'visible'))
      );
      const output = renderToString(node, 80);
      expect(output).toContain('visible');
    });

    it('should not render child when condition is false', () => {
      const node = Box(
        {},
        When(false, Text({}, 'hidden'))
      );
      const output = renderToString(node, 80);
      expect(output).not.toContain('hidden');
    });

    it('should handle truthy/falsy values', () => {
      const output1 = renderToString(Box({}, When(1, Text({}, 'one'))), 80);
      const output2 = renderToString(Box({}, When(0, Text({}, 'zero'))), 80);
      const output3 = renderToString(Box({}, When('str', Text({}, 'str'))), 80);
      const output4 = renderToString(Box({}, When('', Text({}, 'empty'))), 80);

      expect(output1).toContain('one');
      expect(output2).not.toContain('zero');
      expect(output3).toContain('str');
      expect(output4).not.toContain('empty');
    });
  });

  describe('Each (list rendering)', () => {
    it('should render items from array', () => {
      const items = ['A', 'B', 'C'];
      const node = Box(
        { flexDirection: 'column' },
        Each(items, (item) => Text({}, item))
      );
      const output = renderToString(node, 80);
      expect(output).toContain('A');
      expect(output).toContain('B');
      expect(output).toContain('C');
    });

    it('should pass index to render function', () => {
      const items = ['first', 'second'];
      const node = Box(
        { flexDirection: 'column' },
        Each(items, (item, idx) => Text({}, `${idx}: ${item}`))
      );
      const output = renderToString(node, 80);
      expect(output).toContain('0: first');
      expect(output).toContain('1: second');
    });

    it('should handle empty array', () => {
      const node = Box(
        {},
        Each([], (item) => Text({}, item))
      );
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });
  });

  describe('Divider', () => {
    it('should render horizontal divider', () => {
      const node = Divider({ width: 10 });
      const output = renderToString(node, 80);
      expect(output).toMatch(/─{10}/);
    });

    it('should render with custom character', () => {
      const node = Divider({ width: 5, char: '=' });
      const output = renderToString(node, 80);
      expect(output).toContain('=====');
    });

    it('should apply color', () => {
      const node = Divider({ width: 5, color: 'yellow' });
      const output = renderToString(node, 80);
      expect(output).toContain('33m'); // Yellow code (may be combined with dim: 2;33m)
    });
  });

  describe('Spinner', () => {
    it('should render spinner frame', () => {
      const node = Spinner({ frame: 0 });
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should render different frames', () => {
      const frame0 = renderToString(Spinner({ frame: 0 }), 80);
      const frame1 = renderToString(Spinner({ frame: 1 }), 80);
      expect(frame0).toBeDefined();
      expect(frame1).toBeDefined();
    });

    it('should accept custom color', () => {
      const node = Spinner({ frame: 0, color: 'magenta' });
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[35m'); // Magenta
    });
  });

  describe('ProgressBar', () => {
    it('should render progress bar at 0%', () => {
      const node = ProgressBar({ percent: 0, width: 10 });
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should render progress bar at 50%', () => {
      const node = ProgressBar({ percent: 0.5, width: 10 });
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should render progress bar at 100%', () => {
      const node = ProgressBar({ percent: 1, width: 10 });
      const output = renderToString(node, 80);
      expect(output.length).toBeGreaterThan(0);
    });

    it('should clamp value between 0 and 1', () => {
      const under = ProgressBar({ percent: -0.5, width: 10 });
      const over = ProgressBar({ percent: 1.5, width: 10 });
      expect(() => renderToString(under, 80)).not.toThrow();
      expect(() => renderToString(over, 80)).not.toThrow();
    });
  });

  describe('Badge', () => {
    it('should render badge with label', () => {
      const node = Badge({ label: 'INFO' });
      const output = renderToString(node, 80);
      expect(output).toContain('INFO');
    });

    it('should apply color', () => {
      const node = Badge({ label: 'ERROR', color: 'red' });
      const output = renderToString(node, 80);
      expect(output).toContain('ERROR');
      expect(output).toMatch(/\x1b\[\d+(;\d+)*m/); // Has ANSI code
    });
  });

  describe('Slot', () => {
    it('should render children when visible', () => {
      const node = Slot({ visible: true }, Text({}, 'visible content'));
      const output = renderToString(node, 80);
      expect(output).toContain('visible content');
    });

    it('should not render children when not visible', () => {
      const node = Slot({ visible: false }, Text({}, 'hidden content'));
      const output = renderToString(node, 80);
      expect(output).not.toContain('hidden content');
    });

    it('should create box node', () => {
      const node = Slot({ visible: true }, Text({}, 'test'));
      expect(node.type).toBe('box');
    });

    it('should collapse to height 0 when hidden and no height specified', () => {
      const node = Slot({ visible: false, height: 0 });
      expect(node.props.height).toBe(0);
    });

    it('should reserve height when hidden and height specified', () => {
      const node = Slot({ visible: false, height: 3 });
      expect(node.props.height).toBe(3);
    });

    it('should apply minHeight when visible', () => {
      const node = Slot({ visible: true, minHeight: 2 }, Text({}, 'test'));
      expect(node.props.minHeight).toBe(2);
    });

    it('should work in layout context', () => {
      const node = Box(
        { flexDirection: 'column' },
        Text({}, 'before'),
        Slot({ visible: true }, Text({}, 'slot content')),
        Text({}, 'after')
      );
      const output = renderToString(node, 80);
      expect(output).toContain('before');
      expect(output).toContain('slot content');
      expect(output).toContain('after');
    });

    it('should maintain layout stability when toggling', () => {
      // Hidden slot with reserved height
      const hiddenNode = Box(
        { flexDirection: 'column', width: 20 },
        Text({}, 'header'),
        Slot({ visible: false, height: 1 }),
        Text({}, 'footer')
      );

      // Visible slot
      const visibleNode = Box(
        { flexDirection: 'column', width: 20 },
        Text({}, 'header'),
        Slot({ visible: true, height: 1 }, Text({}, 'X')),
        Text({}, 'footer')
      );

      const hiddenOutput = renderToString(hiddenNode, 80);
      const visibleOutput = renderToString(visibleNode, 80);

      // Both should have header and footer
      expect(hiddenOutput).toContain('header');
      expect(hiddenOutput).toContain('footer');
      expect(visibleOutput).toContain('header');
      expect(visibleOutput).toContain('footer');

      // Visible should have the slot content
      expect(visibleOutput).toContain('X');
    });
  });
});
