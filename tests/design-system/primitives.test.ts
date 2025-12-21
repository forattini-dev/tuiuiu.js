/**
 * Tests for Design System Primitive Components
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { Text, Box } from '../../src/components/components.js';
import { When, Each, Transform, Static } from '../../src/design-system/primitives/utilities.js';
import { Divider } from '../../src/design-system/primitives/divider.js';
import { Slot } from '../../src/design-system/primitives/slot.js';

describe('Primitive Components', () => {
  describe('When', () => {
    it('should render children when condition is true', () => {
      const node = When(true, Text({}, 'Visible'));
      const output = renderToString(node!, 80);
      expect(output).toContain('Visible');
    });

    it('should return null when condition is false', () => {
      const node = When(false, Text({}, 'Hidden'));
      expect(node).toBeNull();
    });

    it('should render multiple children', () => {
      const node = When(true,
        Text({}, 'First'),
        Text({}, 'Second')
      );
      const output = renderToString(node!, 80);
      expect(output).toContain('First');
      expect(output).toContain('Second');
    });
  });

  describe('Each', () => {
    it('should render items', () => {
      const items = ['Apple', 'Banana', 'Cherry'];
      const node = Each(items, (item, i) =>
        Text({ key: i }, item)
      );
      const output = renderToString(node, 80);
      expect(output).toContain('Apple');
      expect(output).toContain('Banana');
      expect(output).toContain('Cherry');
    });

    it('should handle empty array', () => {
      const items: string[] = [];
      const node = Each(items, (item, i) =>
        Text({ key: i }, item)
      );
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });

    it('should pass index to render function', () => {
      const items = ['a', 'b', 'c'];
      const node = Each(items, (item, i) =>
        Text({ key: i }, `${i}: ${item}`)
      );
      const output = renderToString(node, 80);
      expect(output).toContain('0: a');
      expect(output).toContain('1: b');
      expect(output).toContain('2: c');
    });
  });

  describe('Transform', () => {
    it('should create transform node', () => {
      const node = Transform({
        transform: (text) => text.toUpperCase(),
      }, Text({}, 'hello'));
      expect(node.type).toBe('box');
      expect(node.props.__transform).toBeDefined();
    });

    it('should accept accessibility label', () => {
      const node = Transform({
        transform: (text) => text,
        accessibilityLabel: 'Description',
      }, Text({}, 'content'));
      expect(node.props.__accessibilityLabel).toBe('Description');
    });

    it('should handle children in props', () => {
      const node = Transform({
        transform: (text) => text,
        children: Text({}, 'child'),
      });
      expect(node.children.length).toBeGreaterThan(0);
    });
  });

  describe('Static', () => {
    it('should render static items', () => {
      const items = ['Task 1', 'Task 2'];
      const node = Static({
        items,
        children: (item, i) => Text({ key: i }, item),
      });
      expect(node.type).toBe('box');
      expect(node.props.__static).toBe(true);
    });

    it('should apply style', () => {
      const node = Static({
        items: ['item'],
        children: (item) => Text({}, item),
        style: { padding: 1 },
      });
      expect(node.props.padding).toBe(1);
    });

    it('should handle empty items', () => {
      const node = Static({
        items: [],
        children: (item) => Text({}, item),
      });
      expect(node.children.length).toBe(0);
    });
  });

  describe('Divider', () => {
    it('should render horizontal divider', () => {
      const node = Divider({});
      const output = renderToString(node, 80);
      expect(output).toContain('─');
    });

    it('should render with custom character', () => {
      const node = Divider({ char: '=' });
      const output = renderToString(node, 80);
      expect(output).toContain('=');
    });

    it('should apply color', () => {
      const node = Divider({ color: 'cyan' });
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[36m');
    });

    it('should apply width', () => {
      const node = Divider({ width: 20 });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render vertical orientation', () => {
      const node = Divider({ orientation: 'vertical', height: 3 });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  describe('Slot', () => {
    it('should render children when visible', () => {
      const node = Slot({ visible: true }, Text({}, 'Visible Content'));
      const output = renderToString(node, 80);
      expect(output).toContain('Visible Content');
    });

    it('should reserve space when hidden', () => {
      const node = Slot({ visible: false, height: 3 });
      expect(node.props.height).toBe(3);
    });

    it('should apply minHeight when visible', () => {
      const node = Slot({ visible: true, minHeight: 5 }, Text({}, 'Content'));
      expect(node.props.minHeight).toBe(5);
    });

    it('should apply flexGrow', () => {
      const node = Slot({ visible: true, flexGrow: 1 }, Text({}, 'Flex'));
      expect(node.props.flexGrow).toBe(1);
    });

    it('should apply width', () => {
      const node = Slot({ visible: false, height: 2, width: 20 });
      expect(node.props.width).toBe(20);
    });
  });

});
