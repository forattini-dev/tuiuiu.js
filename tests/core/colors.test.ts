/**
 * Tests for color utilities
 */

import { describe, it, expect } from 'vitest';
import {
  color,
  parseColor,
  getShades,
  listColors,
  listShades,
  colors,
  white,
  black,
  transparent,
  slate,
  red,
  blue,
} from '../../src/core/colors.js';

describe('Color Utilities', () => {
  describe('color', () => {
    it('should return color value for known color and shade', () => {
      expect(color('red', 500)).toBe('#ef4444');
      expect(color('blue', 500)).toBe('#3b82f6');
    });

    it('should use 500 as default shade', () => {
      expect(color('green')).toBe(color('green', 500));
    });

    it('should return the input as-is for unknown colors', () => {
      expect(color('unknown')).toBe('unknown');
      expect(color('#ff0000')).toBe('#ff0000');
    });

    it('should handle all valid shades', () => {
      const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
      for (const shade of shades) {
        expect(color('red', shade)).toBeDefined();
        expect(color('red', shade)).toMatch(/^#[a-f0-9]{6}$/i);
      }
    });
  });

  describe('parseColor', () => {
    it('should parse valid color strings', () => {
      const result = parseColor('red-500');
      expect(result).toEqual({
        name: 'red',
        shade: 500,
        value: '#ef4444',
      });
    });

    it('should parse different shades', () => {
      const result = parseColor('blue-200');
      expect(result).toEqual({
        name: 'blue',
        shade: 200,
        value: '#bfdbfe',
      });
    });

    it('should return null for invalid format', () => {
      expect(parseColor('red')).toBeNull();
      expect(parseColor('#ff0000')).toBeNull();
      expect(parseColor('')).toBeNull();
    });

    it('should return null for unknown colors', () => {
      const result = parseColor('unknown-500');
      expect(result).toBeNull();
    });

    it('should return null for invalid shades', () => {
      const result = parseColor('red-123');
      expect(result).toBeNull();
    });
  });

  describe('getShades', () => {
    it('should return all shades for a known color', () => {
      const shades = getShades('red');
      expect(shades).toHaveLength(11);
      expect(shades[0]).toBe('#fef2f2'); // red-50
      expect(shades[5]).toBe('#ef4444'); // red-500
    });

    it('should return empty array for unknown colors', () => {
      expect(getShades('unknown')).toEqual([]);
    });

    it('should return empty array for non-palette colors', () => {
      // white, black, transparent are strings, not palettes
      expect(getShades('white')).toEqual([]);
    });
  });

  describe('listColors', () => {
    it('should return all available color names', () => {
      const colorNames = listColors();
      expect(colorNames).toContain('red');
      expect(colorNames).toContain('blue');
      expect(colorNames).toContain('green');
      expect(colorNames).toContain('slate');
      expect(colorNames).toContain('gray');
    });

    it('should include base colors', () => {
      const colorNames = listColors();
      expect(colorNames).toContain('white');
      expect(colorNames).toContain('black');
      expect(colorNames).toContain('transparent');
    });
  });

  describe('listShades', () => {
    it('should return all available shades', () => {
      const shades = listShades();
      expect(shades).toEqual([50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]);
    });
  });

  describe('color constants', () => {
    it('should export base colors', () => {
      expect(white).toBe('#ffffff');
      expect(black).toBe('#000000');
      expect(transparent).toBe('transparent');
    });

    it('should export color palettes', () => {
      expect(slate[500]).toBe('#64748b');
      expect(red[500]).toBe('#ef4444');
      expect(blue[500]).toBe('#3b82f6');
    });

    it('should have all colors in the colors object', () => {
      expect(colors.red).toBeDefined();
      expect(colors.blue).toBeDefined();
      expect(colors.green).toBeDefined();
    });
  });
});
