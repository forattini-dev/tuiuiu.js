/**
 * Divider Tests
 *
 * Tests for the Divider component
 */

import { describe, it, expect } from 'vitest';
import { Divider } from '../../src/primitives/divider.js';

describe('Divider', () => {
  describe('Basic Usage', () => {
    it('should create a horizontal divider by default', () => {
      const vnode = Divider();

      expect(vnode).toBeDefined();
      expect(vnode.type).toBe('box');
      expect(vnode.props.flexDirection).toBe('row');
    });

    it('should create with no props', () => {
      const vnode = Divider({});

      expect(vnode).toBeDefined();
    });
  });

  describe('Horizontal Divider', () => {
    it('should create horizontal divider', () => {
      const vnode = Divider({ direction: 'horizontal' });

      expect(vnode.props.flexDirection).toBe('row');
    });

    it('should apply width', () => {
      const vnode = Divider({ width: 40 });

      expect(vnode.props.width).toBe(40);
    });

    it('should use 100% width by default', () => {
      const vnode = Divider();

      expect(vnode.props.width).toBe('100%');
    });

    it('should apply margin', () => {
      const vnode = Divider({ margin: 1 });

      expect(vnode.props.marginY).toBe(1);
    });
  });

  describe('Vertical Divider', () => {
    it('should create vertical divider', () => {
      const vnode = Divider({ direction: 'vertical' });

      expect(vnode).toBeDefined();
      expect(vnode.type).toBe('box');
    });

    it('should apply margin for vertical', () => {
      const vnode = Divider({
        direction: 'vertical',
        margin: 2,
      });

      expect(vnode.props.marginX).toBe(2);
    });

    it('should respect width for vertical height', () => {
      const vnode = Divider({
        direction: 'vertical',
        width: 10,
      });

      expect(vnode).toBeDefined();
    });
  });

  describe('Title', () => {
    it('should display title in horizontal divider', () => {
      const vnode = Divider({ title: 'Section' });

      expect(vnode).toBeDefined();
      expect(vnode.props.flexDirection).toBe('row');

      const output = JSON.stringify(vnode);
      expect(output).toContain('Section');
    });

    it('should apply title color', () => {
      const vnode = Divider({
        title: 'Colored',
        titleColor: 'cyan',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('cyan');
    });

    it('should make title bold', () => {
      const vnode = Divider({ title: 'Bold Title' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('"bold":true');
    });
  });

  describe('Custom Character', () => {
    it('should use custom character', () => {
      const vnode = Divider({ char: '=' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('=');
    });

    it('should use double line character', () => {
      const vnode = Divider({ char: '═' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('═');
    });

    it('should repeat character for width', () => {
      const vnode = Divider({
        char: '-',
        width: 10,
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('-');
    });
  });

  describe('Styling', () => {
    it('should apply color', () => {
      const vnode = Divider({ color: 'red' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('red');
    });

    it('should apply dim', () => {
      const vnode = Divider({ dim: true });

      const output = JSON.stringify(vnode);
      expect(output).toContain('"dim":true');
    });

    it('should not be dim by default', () => {
      const vnode = Divider();

      const output = JSON.stringify(vnode);
      expect(output).toContain('"dim":false');
    });
  });

  describe('Edge Cases', () => {
    it('should handle numeric width', () => {
      const vnode = Divider({ width: 50 });

      expect(vnode.props.width).toBe(50);
    });

    it('should handle string width', () => {
      const vnode = Divider({ width: '100%' });

      expect(vnode.props.width).toBe('100%');
    });

    it('should handle all props at once', () => {
      const vnode = Divider({
        direction: 'horizontal',
        char: '*',
        width: 40,
        color: 'yellow',
        dim: true,
        title: 'All Props',
        titleColor: 'green',
        margin: 1,
      });

      expect(vnode).toBeDefined();
      const output = JSON.stringify(vnode);
      expect(output).toContain('All Props');
      expect(output).toContain('green');
    });

    it('should create vertical divider with all props', () => {
      const vnode = Divider({
        direction: 'vertical',
        char: '|',
        width: 5,
        color: 'blue',
        dim: true,
        margin: 1,
      });

      expect(vnode).toBeDefined();
      const output = JSON.stringify(vnode);
      expect(output).toContain('blue');
    });
  });
});
