/**
 * BigText Tests
 *
 * Tests for the ASCII art text component with 9 fonts.
 */

import { describe, it, expect } from 'vitest';
import {
  BigText,
  FigletText,
  BigTitle,
  Logo,
  listBigTextFonts,
  getBigTextFontInfo,
  getBigTextFontCount,
  renderBigText,
  type BigTextFont,
} from '../../src/design-system/visual/big-text.js';

describe('BigText', () => {
  describe('listBigTextFonts', () => {
    it('should return all available fonts', () => {
      const fonts = listBigTextFonts();
      expect(Array.isArray(fonts)).toBe(true);
      expect(fonts.length).toBeGreaterThan(0);
    });

    it('should include all 9 fonts', () => {
      const fonts = listBigTextFonts();
      const expectedFonts: BigTextFont[] = [
        'block', 'slant', 'small', 'standard', 'banner', 'mini',
        'shadow', 'doom', 'graffiti',
      ];

      for (const font of expectedFonts) {
        expect(fonts).toContain(font);
      }
    });

    it('should have exactly 9 fonts', () => {
      const fonts = listBigTextFonts();
      expect(fonts.length).toBe(9);
    });
  });

  describe('getBigTextFontCount', () => {
    it('should return 9', () => {
      expect(getBigTextFontCount()).toBe(9);
    });
  });

  describe('getBigTextFontInfo', () => {
    it('should return font height and sample for block font', () => {
      const info = getBigTextFontInfo('block');
      expect(info).toHaveProperty('height');
      expect(info).toHaveProperty('sample');
      expect(info.height).toBeGreaterThan(0);
      expect(Array.isArray(info.sample)).toBe(true);
      expect(info.sample.length).toBe(info.height);
    });

    it('should return different heights for different fonts', () => {
      const blockInfo = getBigTextFontInfo('block');
      const miniInfo = getBigTextFontInfo('mini');
      const bannerInfo = getBigTextFontInfo('banner');

      // Mini should be shorter than block and banner
      expect(miniInfo.height).toBeLessThan(blockInfo.height);
      expect(miniInfo.height).toBeLessThan(bannerInfo.height);
    });

    it('should return sample text for all fonts', () => {
      const fonts = listBigTextFonts();

      for (const font of fonts) {
        const info = getBigTextFontInfo(font);
        expect(info.sample.length).toBe(info.height);
        expect(info.sample.every((line) => typeof line === 'string')).toBe(true);
      }
    });
  });

  describe('renderBigText', () => {
    it('should render text to string array', () => {
      const lines = renderBigText('A', { font: 'block' });
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should render uppercase correctly', () => {
      const linesUpper = renderBigText('ABC');
      const linesLower = renderBigText('abc');

      // Should be the same (both converted to uppercase)
      expect(linesUpper).toEqual(linesLower);
    });

    it('should respect letter spacing', () => {
      const spacing1 = renderBigText('AB', { letterSpacing: 1 });
      const spacing3 = renderBigText('AB', { letterSpacing: 3 });

      // Longer spacing should produce longer lines
      expect(spacing3[0]!.length).toBeGreaterThan(spacing1[0]!.length);
    });

    it('should handle empty text', () => {
      const lines = renderBigText('');
      expect(Array.isArray(lines)).toBe(true);
    });

    it('should handle spaces', () => {
      const lines = renderBigText('A B');
      expect(Array.isArray(lines)).toBe(true);
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should render all fonts without error', () => {
      const fonts = listBigTextFonts();

      for (const font of fonts) {
        const lines = renderBigText('HELLO', { font });
        expect(Array.isArray(lines)).toBe(true);
        expect(lines.length).toBeGreaterThan(0);
      }
    });
  });

  describe('BigText component', () => {
    it('should return a VNode', () => {
      const node = BigText({ text: 'HELLO' });
      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should accept font option', () => {
      const node = BigText({ text: 'HELLO', font: 'doom' });
      expect(node).toBeDefined();
    });

    it('should accept color option', () => {
      const node = BigText({ text: 'HELLO', color: 'cyan' });
      expect(node).toBeDefined();
    });

    it('should accept gradient option', () => {
      const node = BigText({
        text: 'RAINBOW',
        gradient: ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'],
      });
      expect(node).toBeDefined();
    });

    it('should accept alignment option', () => {
      const left = BigText({ text: 'HELLO', align: 'left' });
      const center = BigText({ text: 'HELLO', align: 'center' });
      const right = BigText({ text: 'HELLO', align: 'right' });

      expect(left).toBeDefined();
      expect(center).toBeDefined();
      expect(right).toBeDefined();
    });
  });

  describe('FigletText component', () => {
    it('should return a VNode', () => {
      const node = FigletText({ text: 'Welcome' });
      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should use banner font by default', () => {
      const node = FigletText({ text: 'Welcome' });
      expect(node).toBeDefined();
    });
  });

  describe('BigTitle component', () => {
    it('should return a VNode', () => {
      const node = BigTitle({ title: 'MYAPP' });
      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should accept subtitle', () => {
      const node = BigTitle({
        title: 'MYAPP',
        subtitle: 'Version 2.0',
      });
      expect(node).toBeDefined();
    });

    it('should accept underline option', () => {
      const node = BigTitle({
        title: 'MYAPP',
        underline: true,
      });
      expect(node).toBeDefined();
    });

    it('should accept custom underline character', () => {
      const node = BigTitle({
        title: 'MYAPP',
        underline: true,
        underlineChar: '-',
      });
      expect(node).toBeDefined();
    });
  });

  describe('Logo component', () => {
    it('should return a VNode', () => {
      const node = Logo({ text: 'TUIUIU' });
      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should accept colors (gradient)', () => {
      const node = Logo({
        text: 'TUIUIU',
        colors: ['cyan', 'blue'],
      });
      expect(node).toBeDefined();
    });

    it('should accept tagline', () => {
      const node = Logo({
        text: 'TUIUIU',
        tagline: 'Terminal UI Library',
      });
      expect(node).toBeDefined();
    });

    it('should accept width option', () => {
      const node = Logo({
        text: 'TUIUIU',
        width: 80,
      });
      expect(node).toBeDefined();
    });
  });

  describe('Font characteristics', () => {
    it('block font should be 5 lines tall', () => {
      const info = getBigTextFontInfo('block');
      expect(info.height).toBe(5);
    });

    it('mini font should be 2 lines tall', () => {
      const info = getBigTextFontInfo('mini');
      expect(info.height).toBe(2);
    });

    it('small font should be 3 lines tall', () => {
      const info = getBigTextFontInfo('small');
      expect(info.height).toBe(3);
    });

    it('banner font should be 6 lines tall', () => {
      const info = getBigTextFontInfo('banner');
      expect(info.height).toBe(6);
    });

    it('slant font should be 4 lines tall', () => {
      const info = getBigTextFontInfo('slant');
      expect(info.height).toBe(4);
    });

    it('shadow font should be 5 lines tall', () => {
      const info = getBigTextFontInfo('shadow');
      expect(info.height).toBe(5);
    });

    it('doom font should be 5 lines tall', () => {
      const info = getBigTextFontInfo('doom');
      expect(info.height).toBe(5);
    });

    it('graffiti font should be 5 lines tall', () => {
      const info = getBigTextFontInfo('graffiti');
      expect(info.height).toBe(5);
    });
  });

  describe('Character support', () => {
    it('should support uppercase letters A-Z', () => {
      const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lines = renderBigText(letters, { font: 'block' });
      expect(lines.length).toBeGreaterThan(0);
      // Each letter should render (no empty output)
      expect(lines[0]!.length).toBeGreaterThan(0);
    });

    it('should support digits 0-9', () => {
      const digits = '0123456789';
      const lines = renderBigText(digits, { font: 'block' });
      expect(lines.length).toBeGreaterThan(0);
      expect(lines[0]!.length).toBeGreaterThan(0);
    });

    it('should support common punctuation', () => {
      const punct = '!?.-:';
      const lines = renderBigText(punct, { font: 'block' });
      expect(lines.length).toBeGreaterThan(0);
    });

    it('should handle unknown characters gracefully', () => {
      const text = 'A@#$B'; // @ # $ are not defined
      const lines = renderBigText(text, { font: 'block' });
      expect(lines.length).toBeGreaterThan(0);
      // Should still render without crashing
    });
  });

  describe('New fonts (shadow, doom, graffiti)', () => {
    it('shadow font should have shadow effect characters', () => {
      const lines = renderBigText('A', { font: 'shadow' });
      const combined = lines.join('');
      // Shadow font uses ▒ for shadow effect
      expect(combined.includes('▒') || combined.includes('░')).toBe(true);
    });

    it('doom font should use heavy block characters', () => {
      const lines = renderBigText('A', { font: 'doom' });
      const combined = lines.join('');
      // DOOM font uses █ (full block) extensively
      expect(combined.includes('█')).toBe(true);
    });

    it('graffiti font should use decorative blocks', () => {
      const lines = renderBigText('A', { font: 'graffiti' });
      const combined = lines.join('');
      // Graffiti uses various block characters
      expect(combined.includes('█') || combined.includes('▄')).toBe(true);
    });
  });
});
