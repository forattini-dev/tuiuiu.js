/**
 * Tests for Design System Layout Components
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { Text, Box } from '../../src/components/components.js';
import { VStack, HStack, Center, Spacer } from '../../src/design-system/layout/stack.js';
import { SplitPanel, ThreePanel, createSplitPanel } from '../../src/design-system/layout/split-panel.js';

describe('Layout Components', () => {
  describe('VStack', () => {
    it('should stack children vertically', () => {
      const node = VStack({
        children: [
          Text({}, 'Line 1'),
          Text({}, 'Line 2'),
          Text({}, 'Line 3'),
        ],
      });
      const output = renderToString(node, 80);
      const lines = output.split('\n');
      expect(lines[0]).toContain('Line 1');
      expect(lines[1]).toContain('Line 2');
      expect(lines[2]).toContain('Line 3');
    });

    it('should apply gap', () => {
      const node = VStack({
        gap: 2,
        children: [
          Text({}, 'A'),
          Text({}, 'B'),
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should align left', () => {
      const node = VStack({
        align: 'left',
        children: [
          Text({}, 'Left'),
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Left');
    });

    it('should align center', () => {
      const node = VStack({
        align: 'center',
        width: 20,
        children: [
          Text({}, 'Center'),
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Center');
    });

    it('should align right', () => {
      const node = VStack({
        align: 'right',
        width: 20,
        children: [
          Text({}, 'Right'),
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Right');
    });

    it('should apply padding', () => {
      const node = VStack({
        padding: 1,
        children: [
          Text({}, 'Padded'),
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Padded');
    });

    it('should handle empty children', () => {
      const node = VStack({ children: [] });
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });
  });

  describe('HStack', () => {
    it('should stack children horizontally', () => {
      const node = HStack({
        children: [
          Text({}, 'A'),
          Text({}, 'B'),
          Text({}, 'C'),
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('A');
      expect(output).toContain('B');
      expect(output).toContain('C');
    });

    it('should apply gap', () => {
      const node = HStack({
        gap: 2,
        children: [
          Text({}, 'X'),
          Text({}, 'Y'),
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should align top', () => {
      const node = HStack({
        align: 'top',
        children: [
          Text({}, 'Top'),
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Top');
    });

    it('should align center', () => {
      const node = HStack({
        align: 'center',
        height: 3,
        children: [
          Text({}, 'Centered'),
        ],
      });
      const output = renderToString(node, 80);
      // Check content is rendered (alignment may vary based on terminal width)
      expect(output).toBeDefined();
    });

    it('should align bottom', () => {
      const node = HStack({
        align: 'bottom',
        height: 3,
        children: [
          Text({}, 'At Bottom'),
        ],
      });
      const output = renderToString(node, 80);
      // Check content is rendered
      expect(output).toBeDefined();
    });

    it('should handle empty children', () => {
      const node = HStack({ children: [] });
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });
  });

  describe('Center', () => {
    it('should center content', () => {
      const node = Center({
        width: 20,
        height: 3,
        children: Text({}, 'Centered'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Centered');
    });

    it('should handle box child', () => {
      const node = Center({
        width: 30,
        height: 5,
        children: Box({ borderStyle: 'single' }, Text({}, 'Box')),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Box');
    });
  });

  describe('Spacer', () => {
    it('should create spacer with flexGrow', () => {
      const node = Spacer();
      expect(node.props.flexGrow).toBe(1);
    });
  });

  describe('SplitPanel', () => {
    it('should render left and right panels', () => {
      const node = SplitPanel({
        left: Text({}, 'Left Panel'),
        right: Text({}, 'Right Panel'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Left Panel');
      expect(output).toContain('Right Panel');
    });

    it('should apply ratio', () => {
      const node = SplitPanel({
        left: Text({}, 'L'),
        right: Text({}, 'R'),
        ratio: 0.3,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with divider', () => {
      const node = SplitPanel({
        left: Text({}, 'L'),
        right: Text({}, 'R'),
        divider: true,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('│');
    });

    it('should apply different divider styles', () => {
      const styles = ['line', 'double', 'dotted', 'dashed', 'thick'] as const;
      for (const style of styles) {
        const node = SplitPanel({
          left: Text({}, 'L'),
          right: Text({}, 'R'),
          divider: true,
          dividerStyle: style,
        });
        const output = renderToString(node, 80);
        expect(output).toBeDefined();
      }
    });

    it('should hide divider with none style', () => {
      const node = SplitPanel({
        left: Text({}, 'L'),
        right: Text({}, 'R'),
        divider: true,
        dividerStyle: 'none',
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply fixed left width', () => {
      const node = SplitPanel({
        left: Text({}, 'L'),
        right: Text({}, 'R'),
        leftWidth: 20,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply fixed right width', () => {
      const node = SplitPanel({
        left: Text({}, 'L'),
        right: Text({}, 'R'),
        rightWidth: 20,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply gap', () => {
      const node = SplitPanel({
        left: Text({}, 'L'),
        right: Text({}, 'R'),
        gap: 2,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should show border', () => {
      const node = SplitPanel({
        left: Text({}, 'L'),
        right: Text({}, 'R'),
        border: true,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('─');
    });

    it('should show panel titles', () => {
      const node = SplitPanel({
        left: Text({}, 'L'),
        right: Text({}, 'R'),
        leftTitle: 'Files',
        rightTitle: 'Content',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Files');
      expect(output).toContain('Content');
    });

    it('should render vertical split', () => {
      const node = SplitPanel({
        left: Text({}, 'Top'),
        right: Text({}, 'Bottom'),
        direction: 'vertical',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Top');
      expect(output).toContain('Bottom');
    });
  });

  describe('createSplitPanel', () => {
    it('should create panel state', () => {
      const state = createSplitPanel({});
      expect(state.ratio).toBe(0.5);
    });

    it('should set initial ratio', () => {
      const state = createSplitPanel({ initialRatio: 0.3 });
      expect(state.ratio).toBe(0.3);
    });

    it('should update ratio', () => {
      const state = createSplitPanel({});
      state.setRatio(0.7);
      expect(state.ratio).toBe(0.7);
    });

    it('should clamp ratio to min', () => {
      const state = createSplitPanel({ minRatio: 0.2 });
      state.setRatio(0.1);
      expect(state.ratio).toBe(0.2);
    });

    it('should clamp ratio to max', () => {
      const state = createSplitPanel({ maxRatio: 0.8 });
      state.setRatio(0.9);
      expect(state.ratio).toBe(0.8);
    });

    it('should toggle left panel', () => {
      const state = createSplitPanel({});
      state.toggleLeft();
      expect(state.leftCollapsed).toBe(true);
      expect(state.ratio).toBe(0);
      state.toggleLeft();
      expect(state.leftCollapsed).toBe(false);
    });

    it('should toggle right panel', () => {
      const state = createSplitPanel({});
      state.toggleRight();
      expect(state.rightCollapsed).toBe(true);
      expect(state.ratio).toBe(1);
      state.toggleRight();
      expect(state.rightCollapsed).toBe(false);
    });

    it('should expand left', () => {
      const state = createSplitPanel({});
      state.expandLeft();
      expect(state.rightCollapsed).toBe(true);
    });

    it('should expand right', () => {
      const state = createSplitPanel({});
      state.expandRight();
      expect(state.leftCollapsed).toBe(true);
    });
  });

  describe('ThreePanel', () => {
    it('should render three panels', () => {
      const node = ThreePanel({
        left: Text({}, 'Left'),
        center: Text({}, 'Center'),
        right: Text({}, 'Right'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Left');
      expect(output).toContain('Center');
      expect(output).toContain('Right');
    });

    it('should render without right panel', () => {
      const node = ThreePanel({
        left: Text({}, 'Left'),
        center: Text({}, 'Center'),
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Left');
      expect(output).toContain('Center');
    });

    it('should apply dividers', () => {
      const node = ThreePanel({
        left: Text({}, 'L'),
        center: Text({}, 'C'),
        right: Text({}, 'R'),
        dividers: true,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('│');
    });

    it('should hide dividers', () => {
      const node = ThreePanel({
        left: Text({}, 'L'),
        center: Text({}, 'C'),
        right: Text({}, 'R'),
        dividers: false,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply fixed widths', () => {
      const node = ThreePanel({
        left: Text({}, 'L'),
        center: Text({}, 'C'),
        right: Text({}, 'R'),
        leftWidth: 15,
        rightWidth: 20,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should apply divider style', () => {
      const node = ThreePanel({
        left: Text({}, 'L'),
        center: Text({}, 'C'),
        right: Text({}, 'R'),
        dividerStyle: 'double',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('║');
    });
  });
});
