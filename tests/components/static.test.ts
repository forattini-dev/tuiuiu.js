/**
 * Static Component Tests
 *
 * Tests for the Static component and static content rendering.
 */

import { describe, it, expect } from 'vitest';
import { Static } from '../../src/design-system/primitives/utilities.js';
import { Text } from '../../src/design-system/primitives/text.js';
import { Box } from '../../src/design-system/primitives/box.js';
import { Fragment } from '../../src/design-system/primitives/spacer.js';
import { renderToString } from '../../src/design-system/core/renderer.js';

describe('Static Component', () => {
  describe('Basic rendering', () => {
    it('should render items using the render function', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];

      const node = Static({
        items,
        children: (item, index) => Text({ key: index }, item),
      });

      const output = renderToString(node, 80);
      expect(output).toContain('Item 1');
      expect(output).toContain('Item 2');
      expect(output).toContain('Item 3');
    });

    it('should mark node as static', () => {
      const node = Static({
        items: ['test'],
        children: (item) => Text({}, item),
      });

      expect((node.props as any).__static).toBe(true);
    });

    it('should render empty content when items array is empty', () => {
      const node = Static({
        items: [],
        children: (item) => Text({}, String(item)),
      });

      const output = renderToString(node, 80);
      // Should be empty or minimal
      expect(output.trim()).toBe('');
    });

    it('should apply container styles', () => {
      const items = ['styled'];

      const node = Static({
        items,
        children: (item) => Text({}, item),
        style: {
          flexDirection: 'row',
        },
      });

      expect((node.props as any).flexDirection).toBe('column');
      // Static always uses column direction for consistency
    });
  });

  describe('Item rendering', () => {
    it('should pass correct index to render function', () => {
      const items = ['a', 'b', 'c'];
      const receivedIndices: number[] = [];

      const node = Static({
        items,
        children: (item, index) => {
          receivedIndices.push(index);
          return Text({}, `${index}: ${item}`);
        },
      });

      // Trigger rendering by converting to string
      renderToString(node, 80);

      expect(receivedIndices).toEqual([0, 1, 2]);
    });

    it('should render objects with complex render function', () => {
      interface LogItem {
        timestamp: string;
        message: string;
        level: 'info' | 'warn' | 'error';
      }

      const logs: LogItem[] = [
        { timestamp: '10:00', message: 'Started', level: 'info' },
        { timestamp: '10:01', message: 'Warning', level: 'warn' },
        { timestamp: '10:02', message: 'Error occurred', level: 'error' },
      ];

      const node = Static({
        items: logs,
        children: (log, i) =>
          Text(
            { key: i, color: log.level === 'error' ? 'red' : log.level === 'warn' ? 'yellow' : 'green' },
            `[${log.timestamp}] ${log.message}`
          ),
      });

      const output = renderToString(node, 80);
      expect(output).toContain('[10:00] Started');
      expect(output).toContain('[10:01] Warning');
      expect(output).toContain('[10:02] Error occurred');
    });

    it('should handle items that filter to valid content', () => {
      const items = ['valid', '', 'another'];

      const node = Static({
        items: items.filter(Boolean), // Filter out empty strings
        children: (item) => Text({}, item),
      });

      const output = renderToString(node, 80);
      expect(output).toContain('valid');
      expect(output).toContain('another');
    });
  });

  describe('Static node identification', () => {
    it('should have position absolute for proper stacking', () => {
      const node = Static({
        items: ['test'],
        children: (item) => Text({}, item),
      });

      expect((node.props as any).position).toBe('absolute');
    });

    it('should have flexDirection column', () => {
      const node = Static({
        items: ['test'],
        children: (item) => Text({}, item),
      });

      expect((node.props as any).flexDirection).toBe('column');
    });
  });

  describe('Integration with other components', () => {
    it('should work inside a Box', () => {
      const items = ['log1', 'log2'];

      const container = Box({},
        Static({
          items,
          children: (item) => Text({ color: 'gray' }, item),
        }),
        Text({}, 'Interactive content'),
      );

      const output = renderToString(container, 80);
      expect(output).toContain('log1');
      expect(output).toContain('log2');
      expect(output).toContain('Interactive content');
    });

    it('should work with multiple Static components', () => {
      const completed = ['Task 1', 'Task 2'];
      const errors = ['Error 1'];

      const container = Box({ flexDirection: 'column' },
        Static({
          items: completed,
          children: (item, i) => Text({ key: `complete-${i}`, color: 'green' }, `✓ ${item}`),
        }),
        Static({
          items: errors,
          children: (item, i) => Text({ key: `error-${i}`, color: 'red' }, `✗ ${item}`),
        }),
        Text({}, 'Current task...'),
      );

      const output = renderToString(container, 80);
      expect(output).toContain('✓ Task 1');
      expect(output).toContain('✓ Task 2');
      expect(output).toContain('✗ Error 1');
      expect(output).toContain('Current task...');
    });
  });

  describe('Nested content', () => {
    it('should render nested Box inside Static items', () => {
      const items = [{ title: 'Section 1', content: 'Content 1' }];

      const node = Static({
        items,
        children: (item) =>
          Box({ borderStyle: 'single' },
            Text({ bold: true }, item.title),
            Text({}, item.content),
          ),
      });

      const output = renderToString(node, 80);
      expect(output).toContain('Section 1');
      expect(output).toContain('Content 1');
    });
  });
});

describe('Static content separation', () => {
  // These tests verify that the render-loop can identify static nodes

  it('should identify static nodes in tree', () => {
    const staticNode = Static({
      items: ['static item'],
      children: (item) => Text({}, item),
    });

    expect((staticNode.props as any).__static).toBe(true);
  });

  it('should not mark regular nodes as static', () => {
    const regularNode = Box({},
      Text({}, 'Not static'),
    );

    expect((regularNode.props as any).__static).toBeFalsy();
  });

  it('should preserve static marker through rendering', () => {
    const node = Static({
      items: ['test'],
      children: (item) => Text({}, item),
    });

    // The __static property should persist
    expect((node.props as any).__static).toBe(true);

    // Rendering should work
    const output = renderToString(node, 80);
    expect(output).toContain('test');
  });
});
