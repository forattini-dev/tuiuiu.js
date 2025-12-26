/**
 * Tests for Scrollbar component
 */

import { describe, it, expect } from 'vitest';
import { Scrollbar } from '../../src/atoms/scrollbar.js';
import { renderOnce } from '../../src/app/render-loop.js';

describe('Scrollbar', () => {
  describe('basic rendering', () => {
    it('should render empty box when content fits in viewport', () => {
      const output = renderOnce(
        Scrollbar({
          height: 10,
          total: 5, // Content is smaller than height
          current: 0,
        }),
        80
      );

      // Should render empty (no scrollbar needed)
      expect(output.trim()).toBe('');
    });

    it('should render scrollbar when content exceeds viewport', () => {
      const output = renderOnce(
        Scrollbar({
          height: 5,
          total: 20,
          current: 0,
        }),
        80
      );

      // Should have 5 lines
      const lines = output.split('\n');
      expect(lines.length).toBe(5);
    });

    it('should use custom colors', () => {
      const node = Scrollbar({
        height: 5,
        total: 20,
        current: 0,
        color: 'red',
        trackColor: 'blue',
      });

      // Just verify it renders without error
      const output = renderOnce(node, 80);
      expect(output).toBeDefined();
    });
  });

  describe('thumb position', () => {
    it('should position thumb at top when at start', () => {
      const output = renderOnce(
        Scrollbar({
          height: 10,
          total: 100,
          current: 0, // At the very top
          thumbChar: '#',
          trackChar: '|',
        }),
        80
      );

      const lines = output.split('\n');
      // First line should have thumb character
      expect(lines[0]).toContain('#');
    });

    it('should position thumb at bottom when at end', () => {
      const output = renderOnce(
        Scrollbar({
          height: 10,
          total: 100,
          current: 90, // At the very end (maxScroll = 90)
          thumbChar: '#',
          trackChar: '|',
        }),
        80
      );

      const lines = output.split('\n');
      // Last line should have thumb character
      expect(lines[lines.length - 1]).toContain('#');
    });

    it('should position thumb in middle when in middle', () => {
      const output = renderOnce(
        Scrollbar({
          height: 10,
          total: 100,
          current: 45, // Roughly middle
          thumbChar: '#',
          trackChar: '|',
        }),
        80
      );

      // Just verify it renders with both thumb and track characters
      expect(output).toContain('#');
      expect(output).toContain('|');
    });
  });

  describe('custom characters', () => {
    it('should use custom thumb character', () => {
      const output = renderOnce(
        Scrollbar({
          height: 5,
          total: 20,
          current: 0,
          thumbChar: '█',
        }),
        80
      );

      expect(output).toContain('█');
    });

    it('should use custom track character', () => {
      const output = renderOnce(
        Scrollbar({
          height: 5,
          total: 20,
          current: 0,
          trackChar: '░',
        }),
        80
      );

      expect(output).toContain('░');
    });
  });

  describe('edge cases', () => {
    it('should handle current position exceeding max scroll', () => {
      // current (500) is way beyond maxScroll (90)
      const output = renderOnce(
        Scrollbar({
          height: 10,
          total: 100,
          current: 500,
          thumbChar: '#',
          trackChar: '|',
        }),
        80
      );

      // Should still render, with thumb at bottom
      expect(output).toBeDefined();
      const lines = output.split('\n');
      expect(lines[lines.length - 1]).toContain('#');
    });

    it('should handle negative current position', () => {
      const output = renderOnce(
        Scrollbar({
          height: 10,
          total: 100,
          current: -50,
          thumbChar: '#',
          trackChar: '|',
        }),
        80
      );

      // Should still render, with thumb at top
      expect(output).toBeDefined();
      const lines = output.split('\n');
      expect(lines[0]).toContain('#');
    });

    it('should handle height equal to total', () => {
      const output = renderOnce(
        Scrollbar({
          height: 10,
          total: 10,
          current: 0,
        }),
        80
      );

      // No scrollbar needed - content fits exactly
      expect(output.trim()).toBe('');
    });

    it('should handle minimum thumb size', () => {
      // With a very large total, thumb should still be at least 1 char
      const output = renderOnce(
        Scrollbar({
          height: 5,
          total: 1000,
          current: 0,
          thumbChar: '#',
        }),
        80
      );

      expect(output).toContain('#');
    });
  });
});
