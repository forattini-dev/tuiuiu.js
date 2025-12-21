/**
 * Tests for Design System Media Components
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import {
  Picture,
  ColoredPicture,
  FramedPicture,
  createPixelGrid,
  createPixelGridFromColors,
  renderPixelGrid,
  createSprite,
  getSpriteFrame,
  nextSpriteFrame,
  createGradientBar,
  rainbowText,
  createShadowedText,
  AsciiPatterns,
  createBanner,
} from '../../src/design-system/media/picture.js';

describe('Media Components', () => {
  describe('Picture', () => {
    it('should render ASCII art', () => {
      const node = Picture({ source: '***\n***\n***' });
      const output = renderToString(node, 80);
      expect(output).toContain('***');
    });

    it('should apply color', () => {
      const node = Picture({ source: '###', color: 'cyan' });
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[36m'); // Cyan
    });

    it('should render AsciiPatterns box', () => {
      const box = AsciiPatterns.box(5, 3);
      const node = Picture({ source: box, color: 'white' });
      const output = renderToString(node, 80);
      expect(output).toContain('┌');
      expect(output).toContain('┐');
    });

    it('should render AsciiPatterns diamond', () => {
      const diamond = AsciiPatterns.diamond(3);
      const node = Picture({ source: diamond });
      const output = renderToString(node, 80);
      expect(output).toContain('◆');
    });

    it('should handle multiline source', () => {
      const source = 'Line 1\nLine 2\nLine 3';
      const node = Picture({ source });
      const output = renderToString(node, 80);
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
      expect(output).toContain('Line 3');
    });

    it('should handle empty source', () => {
      const node = Picture({ source: '' });
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });
  });

  describe('ColoredPicture', () => {
    it('should render colored pixels', () => {
      const pixels = [
        [{ char: 'R', fg: 'red' }, { char: 'G', fg: 'green' }],
        [{ char: 'B', fg: 'blue' }, { char: 'Y', fg: 'yellow' }],
      ];
      const node = ColoredPicture({ pixels });
      const output = renderToString(node, 80);
      expect(output).toContain('R');
      expect(output).toContain('G');
    });

    it('should handle background colors', () => {
      const pixels = [
        [{ char: 'X', fg: 'white', bg: 'red' }],
      ];
      const node = ColoredPicture({ pixels });
      const output = renderToString(node, 80);
      expect(output).toContain('X');
    });

    it('should handle empty pixels', () => {
      const pixels: Array<Array<{ char: string }>> = [];
      const node = ColoredPicture({ pixels });
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });
  });

  describe('FramedPicture', () => {
    it('should add frame around picture', () => {
      const node = FramedPicture({
        source: 'Test',
        title: 'My Picture',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Test');
      expect(output).toContain('My Picture');
      expect(output).toContain('─');
    });

    it('should apply frame color', () => {
      const node = FramedPicture({
        source: 'Art',
        borderColor: 'magenta',
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should use different border styles', () => {
      const styles = ['single', 'double', 'round'] as const;
      for (const style of styles) {
        const node = FramedPicture({
          source: 'X',
          borderStyle: style,
        });
        const output = renderToString(node, 80);
        expect(output).toBeDefined();
      }
    });
  });

  describe('createPixelGrid', () => {
    it('should create pixel grid from ASCII', () => {
      const source = 'AB\nCD';
      const palette = {
        'A': { fg: 'red' },
        'B': { fg: 'green' },
        'C': { fg: 'blue' },
        'D': { fg: 'yellow' },
      };
      const grid = createPixelGrid(source, palette);
      expect(grid.length).toBe(2);
      expect(grid[0].length).toBe(2);
      expect(grid[0][0].char).toBe('A');
      expect(grid[0][0].fg).toBe('red');
    });

    it('should handle unknown chars', () => {
      const source = 'X';
      const palette = {};
      const grid = createPixelGrid(source, palette);
      expect(grid[0][0].char).toBe('X');
    });
  });

  describe('createPixelGridFromColors', () => {
    it('should create grid from color array', () => {
      const colors = [
        ['red', 'green'],
        ['blue', 'yellow'],
      ];
      const grid = createPixelGridFromColors(colors);
      expect(grid.length).toBe(2);
      expect(grid[0][0].fg).toBe('red');
      expect(grid[1][1].fg).toBe('yellow');
    });

    it('should use block character', () => {
      const colors = [['white']];
      const grid = createPixelGridFromColors(colors);
      expect(grid[0][0].char).toBe('█');
    });
  });

  describe('renderPixelGrid', () => {
    it('should render grid to string', () => {
      const grid = [[{ char: 'X', fg: 'cyan' }]];
      const result = renderPixelGrid(grid);
      expect(typeof result).toBe('string');
      expect(result).toContain('X');
    });

    it('should render multiple rows', () => {
      const grid = [
        [{ char: 'A' }, { char: 'B' }],
        [{ char: 'C' }, { char: 'D' }],
      ];
      const result = renderPixelGrid(grid);
      expect(result).toContain('AB');
      expect(result).toContain('CD');
    });
  });

  describe('Sprite', () => {
    it('should create sprite from frames', () => {
      const palette = { 'X': { fg: 'red' } };
      const sprite = createSprite('test', ['X', 'Y', 'Z'], palette);
      expect(sprite.frames.length).toBe(3);
      expect(sprite.currentFrame).toBe(0);
      expect(sprite.name).toBe('test');
    });

    it('should get current frame', () => {
      const palette = { 'A': { fg: 'blue' } };
      const sprite = createSprite('test', ['A', 'B'], palette);
      const frame = getSpriteFrame(sprite);
      expect(frame).toBeDefined();
      expect(Array.isArray(frame)).toBe(true);
    });

    it('should advance to next frame', () => {
      const palette = { 'X': { fg: 'green' } };
      const sprite = createSprite('test', ['X', 'Y', 'Z'], palette);
      const newSprite = nextSpriteFrame(sprite);
      expect(newSprite.currentFrame).toBe(1);
    });

    it('should loop back to first frame', () => {
      const palette = { 'X': { fg: 'yellow' } };
      const sprite = createSprite('test', ['X', 'Y'], palette);
      let s = nextSpriteFrame(sprite);
      s = nextSpriteFrame(s);
      expect(s.currentFrame).toBe(0);
    });
  });

  describe('createGradientBar', () => {
    it('should create gradient bar', () => {
      const bar = createGradientBar(10, [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 1 },
      ]);
      expect(bar.length).toBeGreaterThan(0);
    });

    it('should handle single color', () => {
      const bar = createGradientBar(5, [
        { color: '#00ff00', position: 0 },
      ]);
      expect(bar).toBeDefined();
    });

    it('should handle multiple stops', () => {
      const bar = createGradientBar(20, [
        { color: '#ff0000', position: 0 },
        { color: '#ffff00', position: 0.5 },
        { color: '#00ff00', position: 1 },
      ]);
      expect(bar).toBeDefined();
    });
  });

  describe('rainbowText', () => {
    it('should colorize text with rainbow', () => {
      const result = rainbowText('Hello');
      expect(result).toContain('\x1b[');
      expect(result).toContain('H');
      expect(result).toContain('e');
      expect(result).toContain('l');
      expect(result).toContain('o');
    });

    it('should handle empty text', () => {
      const result = rainbowText('');
      expect(result).toBe('');
    });
  });

  describe('createShadowedText', () => {
    it('should create shadowed text', () => {
      const result = createShadowedText('Test', 'white');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply shadow color', () => {
      const result = createShadowedText('Hi', 'white', 'gray');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should apply text color', () => {
      const result = createShadowedText('Hi', 'cyan');
      expect(result.some(line => line.includes('\x1b[36m'))).toBe(true);
    });
  });

  describe('createBanner', () => {
    it('should create text banner', () => {
      const banner = createBanner('Hello');
      expect(banner).toContain('Hello');
      expect(banner).toContain('═');
    });

    it('should apply box style', () => {
      const banner = createBanner('Test', 'box');
      expect(banner).toContain('Test');
      expect(banner).toContain('┌');
      expect(banner).toContain('┘');
    });

    it('should apply double style', () => {
      const banner = createBanner('Double', 'double');
      expect(banner).toContain('Double');
      expect(banner).toContain('╔');
    });
  });

  describe('AsciiPatterns', () => {
    it('should have pattern functions', () => {
      expect(typeof AsciiPatterns.hline).toBe('function');
      expect(typeof AsciiPatterns.vline).toBe('function');
      expect(typeof AsciiPatterns.box).toBe('function');
      expect(typeof AsciiPatterns.diamond).toBe('function');
    });

    it('should generate hline', () => {
      const line = AsciiPatterns.hline(5);
      expect(line).toBe('─────');
    });

    it('should generate vline', () => {
      const line = AsciiPatterns.vline(3);
      expect(line).toBe('│\n│\n│');
    });

    it('should generate box', () => {
      const box = AsciiPatterns.box(4, 3);
      expect(box).toContain('┌');
      expect(box).toContain('└');
    });
  });
});
