/**
 * Tests for Canvas color integration
 *
 * Tests color support in the Canvas class including setPixel with color,
 * getPixelColor, setPixelColor, and ANSI-colored rendering.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createCanvas, Canvas } from '../../src/primitives/canvas.js';

describe('Canvas color integration', () => {
  describe('setPixel with color', () => {
    it('should store color when provided', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixel(5, 5, '█', '#FF0000');

      expect(canvas.getPixel(5, 5)).toBe('█');
      expect(canvas.getPixelColor(5, 5)).toBe('#FF0000');
    });

    it('should use defaultColor when color is not provided', () => {
      const canvas = createCanvas({
        width: 10,
        height: 10,
        defaultColor: '#00FF00',
      });

      canvas.setPixel(5, 5, '█');

      expect(canvas.getPixel(5, 5)).toBe('█');
      expect(canvas.getPixelColor(5, 5)).toBe('#00FF00');
    });

    it('should use null when no color and no defaultColor', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixel(5, 5, '█');

      expect(canvas.getPixel(5, 5)).toBe('█');
      expect(canvas.getPixelColor(5, 5)).toBe(null);
    });

    it('should allow null color to override defaultColor', () => {
      const canvas = createCanvas({
        width: 10,
        height: 10,
        defaultColor: '#00FF00',
      });

      canvas.setPixel(5, 5, '█', null);

      expect(canvas.getPixelColor(5, 5)).toBe(null);
    });
  });

  describe('getPixelColor', () => {
    it('should return color of set pixel', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixel(3, 3, '█', '#0000FF');

      expect(canvas.getPixelColor(3, 3)).toBe('#0000FF');
    });

    it('should return null for empty pixel', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      expect(canvas.getPixelColor(3, 3)).toBe(null);
    });

    it('should return null for out of bounds coordinates', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      expect(canvas.getPixelColor(-1, -1)).toBe(null);
      expect(canvas.getPixelColor(100, 100)).toBe(null);
    });
  });

  describe('setPixelColor', () => {
    it('should change color without changing character', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixel(2, 2, 'X', '#FF0000');
      canvas.setPixelColor(2, 2, '#00FF00');

      expect(canvas.getPixel(2, 2)).toBe('X');
      expect(canvas.getPixelColor(2, 2)).toBe('#00FF00');
    });

    it('should work on empty cells', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixelColor(2, 2, '#0000FF');

      expect(canvas.getPixel(2, 2)).toBe(' ');
      expect(canvas.getPixelColor(2, 2)).toBe('#0000FF');
    });

    it('should handle out of bounds gracefully', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      // Should not throw
      canvas.setPixelColor(-1, -1, '#FF0000');
      canvas.setPixelColor(100, 100, '#FF0000');
    });
  });

  describe('clear', () => {
    it('should reset both characters and colors', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixel(5, 5, '█', '#FF0000');

      expect(canvas.getPixel(5, 5)).toBe('█');
      expect(canvas.getPixelColor(5, 5)).toBe('#FF0000');

      canvas.clear();

      expect(canvas.getPixel(5, 5)).toBe(' ');
      expect(canvas.getPixelColor(5, 5)).toBe(null);
    });
  });

  describe('render with colors', () => {
    it('should return array of strings', () => {
      const canvas = createCanvas({ width: 3, height: 1 });

      const result = canvas.render();

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
    });

    it('should include ANSI codes for colored pixels', () => {
      const canvas = createCanvas({ width: 3, height: 1 });

      canvas.setPixel(0, 0, '█', '#FF0000');
      canvas.setPixel(1, 0, '█', '#00FF00');
      canvas.setPixel(2, 0, '█', '#0000FF');

      const result = canvas.render();
      const line = result[0];

      // Should contain ANSI escape sequences
      expect(line).toContain('\x1b[');
      // Should contain reset codes
      expect(line).toContain('\x1b[0m');
      // Should contain the characters
      expect(line).toContain('█');
    });

    it('should handle mixed colored and uncolored pixels', () => {
      const canvas = createCanvas({ width: 2, height: 1 });

      canvas.setPixel(0, 0, 'A', '#FF0000');
      canvas.setPixel(1, 0, 'B'); // No color

      const result = canvas.render();
      const line = result[0];

      // Should have ANSI for 'A' and reset before 'B'
      expect(line).toContain('A');
      expect(line).toContain('B');
      expect(line).toContain('\x1b[0m');
    });

    it('should not include ANSI codes for uncolored canvas', () => {
      const canvas = createCanvas({ width: 5, height: 1 });

      canvas.setPixel(0, 0, 'X');
      canvas.setPixel(1, 0, 'Y');

      const result = canvas.render();
      const line = result[0];

      // No ANSI codes for uncolored pixels
      expect(line).not.toContain('\x1b[');
    });
  });

  describe('renderLine', () => {
    it('should render single line with colors', () => {
      const canvas = createCanvas({ width: 5, height: 3 });

      canvas.setPixel(0, 1, '█', '#FF0000');
      canvas.setPixel(1, 1, '█', '#00FF00');

      const line = canvas.renderLine(1);

      expect(line).toContain('\x1b[');
      expect(line).toContain('█');
    });

    it('should return empty string for out of bounds', () => {
      const canvas = createCanvas({ width: 5, height: 3 });

      expect(canvas.renderLine(-1)).toBe('');
      expect(canvas.renderLine(100)).toBe('');
    });
  });

  describe('color format support', () => {
    it('should support hex color format', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixel(0, 0, '█', '#FF6600');

      expect(canvas.getPixelColor(0, 0)).toBe('#FF6600');

      const result = canvas.render();
      // Should contain ANSI true color sequence for #FF6600
      expect(result[0]).toContain('\x1b[38;2;255;102;0m');
    });

    it('should support short hex color format', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixel(0, 0, '█', '#F60');

      expect(canvas.getPixelColor(0, 0)).toBe('#F60');

      const result = canvas.render();
      // Short hex gets expanded to full hex for ANSI
      expect(result[0]).toContain('\x1b[38;2;255;102;0m');
    });

    it('should support named color format', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixel(0, 0, '█', 'cyan');

      expect(canvas.getPixelColor(0, 0)).toBe('cyan');

      const result = canvas.render();
      // Named color should produce ANSI code
      expect(result[0]).toContain('\x1b[36m');
    });

    it('should support rgb color format', () => {
      const canvas = createCanvas({ width: 10, height: 10 });

      canvas.setPixel(0, 0, '█', 'rgb(255, 102, 0)');

      expect(canvas.getPixelColor(0, 0)).toBe('rgb(255, 102, 0)');

      const result = canvas.render();
      // RGB format should produce ANSI true color sequence
      expect(result[0]).toContain('\x1b[38;2;255;102;0m');
    });
  });

  describe('renderToString', () => {
    it('should join lines with newlines', () => {
      const canvas = createCanvas({ width: 3, height: 2 });

      canvas.setPixel(0, 0, 'A');
      canvas.setPixel(0, 1, 'B');

      const result = canvas.renderToString();

      expect(result).toContain('\n');
      expect(result.split('\n')).toHaveLength(2);
    });
  });
});
