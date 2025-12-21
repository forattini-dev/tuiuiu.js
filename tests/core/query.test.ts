/**
 * Query API Tests
 *
 * Tests for CSS-like selector system for VNodes.
 */

import { describe, it, expect } from 'vitest';
import {
  query,
  queryAll,
  queryResults,
  matches,
  closest,
  findByType,
  findByClass,
  findById,
  countMatches,
  hasMatch,
} from '../../src/core/query.js';
import type { VNode } from '../../src/utils/types.js';

// Helper to create VNode
function createNode(
  type: string,
  props: Record<string, any> = {},
  children: VNode[] = []
): VNode {
  return { type, props, children };
}

// Create a test tree
function createTestTree(): VNode {
  return createNode('box', { id: 'root', className: 'container' }, [
    createNode('box', { id: 'header', className: 'header primary' }, [
      createNode('text', { className: 'title' }, []),
      createNode('text', { className: 'subtitle dim' }, []),
    ]),
    createNode('box', { id: 'content', className: 'content' }, [
      createNode('box', { className: 'item active' }, [
        createNode('text', { className: 'label' }, []),
      ]),
      createNode('box', { className: 'item' }, [
        createNode('text', { className: 'label' }, []),
      ]),
      createNode('box', { className: 'item disabled', disabled: true }, [
        createNode('text', { className: 'label muted' }, []),
      ]),
    ]),
    createNode('box', { id: 'footer', className: 'footer' }, [
      createNode('text', { className: 'copyright' }, []),
    ]),
  ]);
}

describe('Query API', () => {
  describe('query()', () => {
    it('should find element by type', () => {
      const root = createTestTree();
      const result = query(root, 'text');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('text');
    });

    it('should find element by class', () => {
      const root = createTestTree();
      const result = query(root, '.title');
      expect(result).not.toBeNull();
      expect(result!.props.className).toBe('title');
    });

    it('should find element by ID', () => {
      const root = createTestTree();
      const result = query(root, '#header');
      expect(result).not.toBeNull();
      expect(result!.props.id).toBe('header');
    });

    it('should find element by type and class', () => {
      const root = createTestTree();
      const result = query(root, 'box.item');
      expect(result).not.toBeNull();
      expect(result!.type).toBe('box');
      expect(result!.props.className).toContain('item');
    });

    it('should find element by type and ID', () => {
      const root = createTestTree();
      const result = query(root, 'box#header');
      expect(result).not.toBeNull();
      expect(result!.props.id).toBe('header');
    });

    it('should find element with multiple classes', () => {
      const root = createTestTree();
      const result = query(root, '.item.active');
      expect(result).not.toBeNull();
      expect(result!.props.className).toContain('active');
    });

    it('should return null for non-matching selector', () => {
      const root = createTestTree();
      const result = query(root, '.nonexistent');
      expect(result).toBeNull();
    });

    it('should return the first match', () => {
      const root = createTestTree();
      const result = query(root, '.item');
      expect(result).not.toBeNull();
      expect(result!.props.className).toContain('active');
    });
  });

  describe('queryAll()', () => {
    it('should find all elements by type', () => {
      const root = createTestTree();
      const results = queryAll(root, 'text');
      // 6 text nodes: title, subtitle, 3 labels, copyright
      expect(results.length).toBe(6);
      results.forEach(r => expect(r.type).toBe('text'));
    });

    it('should find all elements by class', () => {
      const root = createTestTree();
      const results = queryAll(root, '.item');
      expect(results.length).toBe(3);
    });

    it('should find all elements with specific class', () => {
      const root = createTestTree();
      const results = queryAll(root, '.label');
      expect(results.length).toBe(3);
    });

    it('should return empty array for non-matching selector', () => {
      const root = createTestTree();
      const results = queryAll(root, '.nonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('queryResults()', () => {
    it('should return results with metadata', () => {
      const root = createTestTree();
      const results = queryResults(root, '.item');

      expect(results.length).toBe(3);
      results.forEach(r => {
        expect(r).toHaveProperty('node');
        expect(r).toHaveProperty('path');
        expect(r).toHaveProperty('parent');
        expect(r).toHaveProperty('index');
        expect(r).toHaveProperty('depth');
      });
    });

    it('should include correct depth', () => {
      const root = createTestTree();
      const results = queryResults(root, '.label');

      // Labels are at depth 3 (root -> content -> item -> label)
      results.forEach(r => {
        expect(r.depth).toBe(3);
      });
    });

    it('should include correct index', () => {
      const root = createTestTree();
      const results = queryResults(root, '.item');

      expect(results[0]!.index).toBe(0);
      expect(results[1]!.index).toBe(1);
      expect(results[2]!.index).toBe(2);
    });
  });

  describe('matches()', () => {
    it('should return true for matching type', () => {
      const node = createNode('box', {});
      expect(matches(node, 'box')).toBe(true);
    });

    it('should return false for non-matching type', () => {
      const node = createNode('box', {});
      expect(matches(node, 'text')).toBe(false);
    });

    it('should return true for matching class', () => {
      const node = createNode('box', { className: 'primary active' });
      expect(matches(node, '.primary')).toBe(true);
      expect(matches(node, '.active')).toBe(true);
    });

    it('should return false for non-matching class', () => {
      const node = createNode('box', { className: 'primary' });
      expect(matches(node, '.secondary')).toBe(false);
    });

    it('should return true for matching ID', () => {
      const node = createNode('box', { id: 'header' });
      expect(matches(node, '#header')).toBe(true);
    });

    it('should return false for non-matching ID', () => {
      const node = createNode('box', { id: 'header' });
      expect(matches(node, '#footer')).toBe(false);
    });

    it('should match type and class together', () => {
      const node = createNode('box', { className: 'primary' });
      expect(matches(node, 'box.primary')).toBe(true);
      expect(matches(node, 'text.primary')).toBe(false);
    });

    it('should match multiple classes', () => {
      const node = createNode('box', { className: 'primary active highlight' });
      expect(matches(node, '.primary.active')).toBe(true);
      expect(matches(node, '.primary.highlight')).toBe(true);
      expect(matches(node, '.primary.nonexistent')).toBe(false);
    });
  });

  describe('descendant combinator', () => {
    it('should find descendant by type', () => {
      const root = createTestTree();
      const results = queryAll(root, 'box text');
      // Each box with text children contributes: header(2), items(3), footer(1) = 6
      // But descendant finds ALL text under ALL boxes = can have duplicates
      expect(results.length).toBeGreaterThan(0);
      results.forEach(r => expect(r.type).toBe('text'));
    });

    it('should find descendant by class', () => {
      const root = createTestTree();
      const results = queryAll(root, '.content .label');
      expect(results.length).toBe(3);
    });

    it('should find deep descendant', () => {
      const root = createTestTree();
      const results = queryAll(root, '#root .item .label');
      expect(results.length).toBe(3);
    });

    it('should find descendant by ID', () => {
      const root = createTestTree();
      const result = query(root, '#content .active');
      expect(result).not.toBeNull();
      expect(result!.props.className).toContain('active');
    });
  });

  describe('child combinator', () => {
    it('should find direct child by type', () => {
      const root = createTestTree();
      // #header has 2 direct text children
      const results = queryAll(root, '#header > text');
      expect(results.length).toBe(2);
    });

    it('should not find non-direct descendants', () => {
      const root = createTestTree();
      // Root doesn't have direct text children
      const results = queryAll(root, '#root > text');
      expect(results.length).toBe(0);
    });

    it('should find direct child by class', () => {
      const root = createTestTree();
      const results = queryAll(root, '#content > .item');
      expect(results.length).toBe(3);
    });
  });

  describe('pseudo-classes', () => {
    it(':first-child should match first element', () => {
      const root = createTestTree();
      const result = query(root, '.item:first-child');
      expect(result).not.toBeNull();
      expect(result!.props.className).toContain('active');
    });

    it(':last-child should match last element', () => {
      const root = createTestTree();
      const result = query(root, '.item:last-child');
      expect(result).not.toBeNull();
      expect(result!.props.className).toContain('disabled');
    });

    it(':disabled should match disabled elements', () => {
      const root = createTestTree();
      const result = query(root, '.item:disabled');
      expect(result).not.toBeNull();
      expect(result!.props.disabled).toBe(true);
    });

    it(':enabled should match non-disabled elements', () => {
      const root = createTestTree();
      const results = queryAll(root, '.item:enabled');
      expect(results.length).toBe(2);
    });

    it(':empty should match elements without children', () => {
      const root = createTestTree();
      const results = queryAll(root, 'text:empty');
      // 6 text nodes: title, subtitle, 3 labels, copyright
      expect(results.length).toBe(6);
    });

    it(':not-empty should match elements with children', () => {
      const root = createTestTree();
      const results = queryAll(root, 'box:not-empty');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('attribute selectors', () => {
    it('[attr] should match elements with attribute', () => {
      const node = createNode('box', { 'data-test': true });
      expect(matches(node, '[data-test]')).toBe(true);
    });

    it('[attr=value] should match exact value', () => {
      const node = createNode('box', { 'data-type': 'primary' });
      expect(matches(node, '[data-type=primary]')).toBe(true);
      expect(matches(node, '[data-type=secondary]')).toBe(false);
    });

    it('[attr^=value] should match start', () => {
      const node = createNode('box', { className: 'btn-primary' });
      expect(matches(node, '[className^=btn]')).toBe(true);
    });

    it('[attr$=value] should match end', () => {
      const node = createNode('box', { className: 'btn-primary' });
      expect(matches(node, '[className$=primary]')).toBe(true);
    });

    it('[attr*=value] should match contains', () => {
      const node = createNode('box', { className: 'btn-primary-lg' });
      expect(matches(node, '[className*=primary]')).toBe(true);
    });
  });

  describe('closest()', () => {
    it('should find closest ancestor by type', () => {
      const root = createTestTree();
      const label = query(root, '.label');
      const item = closest(label!, '.item', root);
      expect(item).not.toBeNull();
      expect(item!.props.className).toContain('item');
    });

    it('should find closest ancestor by ID', () => {
      const root = createTestTree();
      const label = query(root, '.label');
      const content = closest(label!, '#content', root);
      expect(content).not.toBeNull();
      expect(content!.props.id).toBe('content');
    });

    it('should return null if no ancestor matches', () => {
      const root = createTestTree();
      const label = query(root, '.label');
      const result = closest(label!, '.nonexistent', root);
      expect(result).toBeNull();
    });
  });

  describe('findByType()', () => {
    it('should find all elements of type', () => {
      const root = createTestTree();
      const boxes = findByType(root, 'box');
      expect(boxes.length).toBeGreaterThan(0);
      boxes.forEach(b => expect(b.type).toBe('box'));
    });
  });

  describe('findByClass()', () => {
    it('should find all elements with class', () => {
      const root = createTestTree();
      const items = findByClass(root, 'item');
      expect(items.length).toBe(3);
    });
  });

  describe('findById()', () => {
    it('should find element by ID', () => {
      const root = createTestTree();
      const header = findById(root, 'header');
      expect(header).not.toBeNull();
      expect(header!.props.id).toBe('header');
    });

    it('should return null for non-existent ID', () => {
      const root = createTestTree();
      const result = findById(root, 'nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('countMatches()', () => {
    it('should count matching elements', () => {
      const root = createTestTree();
      expect(countMatches(root, '.item')).toBe(3);
      expect(countMatches(root, '.label')).toBe(3);
      // 6 text nodes: title, subtitle, 3 labels, copyright
      expect(countMatches(root, 'text')).toBe(6);
    });

    it('should return 0 for no matches', () => {
      const root = createTestTree();
      expect(countMatches(root, '.nonexistent')).toBe(0);
    });
  });

  describe('hasMatch()', () => {
    it('should return true when match exists', () => {
      const root = createTestTree();
      expect(hasMatch(root, '.item')).toBe(true);
      expect(hasMatch(root, '#header')).toBe(true);
    });

    it('should return false when no match exists', () => {
      const root = createTestTree();
      expect(hasMatch(root, '.nonexistent')).toBe(false);
      expect(hasMatch(root, '#nonexistent')).toBe(false);
    });
  });

  describe('complex selectors', () => {
    it('should handle type + class + id', () => {
      const root = createTestTree();
      const result = query(root, 'box#header.header');
      expect(result).not.toBeNull();
    });

    it('should handle multiple descendant levels', () => {
      const root = createTestTree();
      const result = query(root, '#root #content .item .label');
      expect(result).not.toBeNull();
    });

    it('should handle mixed combinators', () => {
      const root = createTestTree();
      const result = query(root, '#content > .item .label');
      expect(result).not.toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle empty selector', () => {
      const root = createTestTree();
      const results = queryAll(root, '');
      expect(results).toEqual([]);
    });

    it('should handle whitespace-only selector', () => {
      const root = createTestTree();
      const results = queryAll(root, '   ');
      expect(results).toEqual([]);
    });

    it('should handle universal selector *', () => {
      const root = createNode('box', {}, [
        createNode('text', {}),
        createNode('box', {}),
      ]);
      // Universal selector matches all types
      const results = queryAll(root, '*');
      // Should match root and children
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive type matching', () => {
      const root = createNode('Box', {});
      expect(matches(root, 'box')).toBe(true);
      expect(matches(root, 'BOX')).toBe(true);
    });

    it('should handle className array', () => {
      const node = createNode('box', { className: ['primary', 'active'] });
      expect(matches(node, '.primary')).toBe(true);
      expect(matches(node, '.active')).toBe(true);
    });

    it('should handle class prop instead of className', () => {
      const node = createNode('box', { class: 'primary' });
      expect(matches(node, '.primary')).toBe(true);
    });
  });
});
