/**
 * Tests for Text Utilities
 */

import { describe, it, expect } from 'vitest';
import {
  stripAnsi,
  stringWidth,
  wrapText,
  truncateText,
  sliceAnsi,
  skipAnsi,
  takeAnsi,
  padAnsi,
  splitLines,
  joinLines,
  normalizeLines,
  compositeHorizontal,
  compositeVertical,
  colorToAnsi,
  colorize,
  style,
  hyperlink,
  styles,
} from '../../src/utils/text-utils.js';

describe('Text Utilities', () => {
  describe('stripAnsi', () => {
    it('should strip ANSI codes', () => {
      const input = '\x1b[31mred\x1b[0m';
      expect(stripAnsi(input)).toBe('red');
    });

    it('should handle multiple codes', () => {
      const input = '\x1b[1m\x1b[36mbold cyan\x1b[0m';
      expect(stripAnsi(input)).toBe('bold cyan');
    });

    it('should handle plain text', () => {
      expect(stripAnsi('plain')).toBe('plain');
    });

    it('should handle empty string', () => {
      expect(stripAnsi('')).toBe('');
    });
  });

  describe('stringWidth', () => {
    it('should return width of plain text', () => {
      expect(stringWidth('hello')).toBe(5);
    });

    it('should ignore ANSI codes', () => {
      expect(stringWidth('\x1b[31mhello\x1b[0m')).toBe(5);
    });

    it('should handle CJK characters as width 2', () => {
      expect(stringWidth('你好')).toBe(4);
    });

    it('should handle emoji as width 2', () => {
      expect(stringWidth('👋')).toBe(2);
    });

    it('should handle mixed content', () => {
      expect(stringWidth('Hi 你好')).toBe(7); // 2 + 1 + 4
    });

    it('should handle empty string', () => {
      expect(stringWidth('')).toBe(0);
    });

    it('should handle zero-width characters', () => {
      // Combining mark
      expect(stringWidth('e\u0301')).toBe(1);
    });

    it('should handle variation selectors', () => {
      expect(stringWidth('👋\uFE0F')).toBe(2);
    });
  });

  describe('wrapText', () => {
    it('should wrap long lines', () => {
      const result = wrapText('hello world foo bar', 10);
      const lines = result.split('\n');
      expect(lines.length).toBeGreaterThan(1);
    });

    it('should not wrap short lines', () => {
      const result = wrapText('short', 20);
      expect(result).toBe('short');
    });

    it('should preserve existing newlines', () => {
      const result = wrapText('a\nb', 80);
      expect(result).toBe('a\nb');
    });

    it('should handle hard wrap option', () => {
      const result = wrapText('verylongwordthatwontfit', 5, { hard: true });
      expect(result.split('\n').length).toBeGreaterThan(1);
    });

    it('should handle trim option', () => {
      const result = wrapText('  hello  ', 20, { trim: true });
      expect(result.trim()).toBe('hello');
    });

    it('should handle wordWrap option', () => {
      const result = wrapText('one two three', 8, { wordWrap: true });
      expect(result).toBeDefined();
    });

    it('should handle empty string', () => {
      expect(wrapText('', 10)).toBe('');
    });

    it('should handle column width 0', () => {
      expect(wrapText('test', 0)).toBe('');
    });

    it('should preserve ANSI codes across lines', () => {
      const result = wrapText('\x1b[31mred text here\x1b[0m', 5, { hard: true });
      expect(result).toContain('\x1b[31m');
    });
  });

  describe('truncateText', () => {
    it('should truncate at end', () => {
      const result = truncateText('hello world', 8, { position: 'end' });
      expect(result).toContain('...');
      expect(stringWidth(result)).toBeLessThanOrEqual(8);
    });

    it('should truncate at start', () => {
      const result = truncateText('hello world', 8, { position: 'start' });
      expect(result).toContain('...');
      expect(stringWidth(result)).toBeLessThanOrEqual(8);
    });

    it('should truncate in middle', () => {
      const result = truncateText('hello world', 8, { position: 'middle' });
      expect(result).toContain('...');
      expect(stringWidth(result)).toBeLessThanOrEqual(8);
    });

    it('should not truncate short text', () => {
      const result = truncateText('hi', 10);
      expect(result).toBe('hi');
    });

    it('should use custom truncation character', () => {
      const result = truncateText('hello world', 8, { truncationCharacter: '…' });
      expect(result).toContain('…');
    });

    it('should add space around truncation', () => {
      const result = truncateText('hello world', 12, { space: true });
      expect(result).toBeDefined();
    });

    it('should prefer truncation on space', () => {
      const result = truncateText('hello world bar', 12, { preferTruncationOnSpace: true });
      expect(result).toBeDefined();
    });

    it('should handle columns smaller than ellipsis', () => {
      const result = truncateText('hello', 2);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('sliceAnsi', () => {
    it('should slice plain text', () => {
      expect(sliceAnsi('hello', 0, 3)).toBe('hel');
    });

    it('should slice from start position', () => {
      expect(sliceAnsi('hello', 2)).toBe('llo');
    });

    it('should preserve ANSI codes', () => {
      const input = '\x1b[31mhello\x1b[0m';
      const result = sliceAnsi(input, 0, 3);
      expect(result).toContain('\x1b[31m');
      expect(result).toContain('hel');
    });

    it('should handle start in middle of styled text', () => {
      const input = '\x1b[31mhello\x1b[0m';
      const result = sliceAnsi(input, 2, 4);
      expect(stripAnsi(result)).toBe('ll');
    });

    it('should handle undefined end', () => {
      const result = sliceAnsi('hello', 2);
      expect(result).toBe('llo');
    });
  });

  describe('skipAnsi', () => {
    it('should skip N visible characters from start', () => {
      expect(skipAnsi('hello world', 3)).toBe('lo world');
    });

    it('should handle count of 0', () => {
      expect(skipAnsi('hello', 0)).toBe('hello');
    });

    it('should handle negative count', () => {
      expect(skipAnsi('hello', -5)).toBe('hello');
    });

    it('should preserve ANSI codes', () => {
      const input = '\x1b[31mHello\x1b[0m World';
      const result = skipAnsi(input, 3);
      // Should return 'lo World' with red still applied to 'lo'
      expect(stripAnsi(result)).toBe('lo World');
      expect(result).toContain('\x1b[31m');
    });

    it('should reapply style after skip', () => {
      const input = '\x1b[36mcyan text\x1b[0m';
      const result = skipAnsi(input, 5);
      expect(stripAnsi(result)).toBe('text');
      expect(result).toContain('\x1b[36m');
    });

    it('should skip entire string', () => {
      expect(skipAnsi('hello', 10)).toBe('');
    });

    it('should handle empty string', () => {
      expect(skipAnsi('', 5)).toBe('');
    });

    it('should handle CJK characters correctly', () => {
      // CJK chars have width 2
      expect(skipAnsi('你好世界', 2)).toBe('好世界'); // Skip 1 CJK char (width 2)
    });

    it('should handle mixed content', () => {
      const input = 'AB你好CD';
      expect(skipAnsi(input, 4)).toBe('好CD'); // Skip AB (2) + 你 (2) = 4
    });
  });

  describe('takeAnsi', () => {
    it('should take N visible characters from start', () => {
      expect(takeAnsi('hello world', 5)).toBe('hello');
    });

    it('should handle count of 0', () => {
      expect(takeAnsi('hello', 0)).toBe('');
    });

    it('should handle negative count', () => {
      expect(takeAnsi('hello', -5)).toBe('');
    });

    it('should preserve ANSI codes', () => {
      const input = '\x1b[31mHello World\x1b[0m';
      const result = takeAnsi(input, 5);
      expect(stripAnsi(result)).toBe('Hello');
      expect(result).toContain('\x1b[31m');
    });

    it('should add reset after styled text', () => {
      const input = '\x1b[32mgreen\x1b[0m';
      const result = takeAnsi(input, 3);
      expect(result).toContain('\x1b[0m');
    });

    it('should take entire string if count exceeds length', () => {
      const input = 'hi';
      const result = takeAnsi(input, 10);
      expect(result).toBe('hi');
    });

    it('should handle empty string', () => {
      expect(takeAnsi('', 5)).toBe('');
    });

    it('should handle CJK characters correctly', () => {
      expect(takeAnsi('你好世界', 4)).toBe('你好'); // Take 2 CJK chars (width 4)
    });

    it('should handle emoji', () => {
      expect(takeAnsi('👋 Hi', 3)).toBe('👋 '); // emoji (2) + space (1) = 3
    });
  });

  describe('padAnsi', () => {
    it('should pad left (default)', () => {
      expect(padAnsi('hi', 5)).toBe('hi   ');
    });

    it('should pad right', () => {
      expect(padAnsi('hi', 5, 'right')).toBe('   hi');
    });

    it('should pad center', () => {
      expect(padAnsi('hi', 6, 'center')).toBe('  hi  ');
    });

    it('should pad center with odd width', () => {
      expect(padAnsi('hi', 5, 'center')).toBe(' hi  ');
    });

    it('should use custom padding character', () => {
      expect(padAnsi('hi', 5, 'left', '-')).toBe('hi---');
    });

    it('should not pad if text is already at width', () => {
      expect(padAnsi('hello', 5)).toBe('hello');
    });

    it('should not truncate if text exceeds width', () => {
      expect(padAnsi('hello world', 5)).toBe('hello world');
    });

    it('should preserve ANSI codes', () => {
      const input = '\x1b[31mhi\x1b[0m';
      const result = padAnsi(input, 5);
      expect(result).toContain('\x1b[31m');
      expect(stringWidth(result)).toBe(5);
    });

    it('should handle CJK characters correctly', () => {
      const result = padAnsi('你', 4);
      expect(stringWidth(result)).toBe(4);
    });

    it('should handle empty string', () => {
      expect(padAnsi('', 5)).toBe('     ');
    });
  });

  describe('splitLines', () => {
    it('should split on newline', () => {
      expect(splitLines('a\nb\nc')).toEqual(['a', 'b', 'c']);
    });

    it('should split on CRLF', () => {
      expect(splitLines('a\r\nb\r\nc')).toEqual(['a', 'b', 'c']);
    });

    it('should handle mixed line endings', () => {
      expect(splitLines('a\nb\r\nc')).toEqual(['a', 'b', 'c']);
    });

    it('should return single element for no newlines', () => {
      expect(splitLines('hello')).toEqual(['hello']);
    });

    it('should handle empty string', () => {
      expect(splitLines('')).toEqual(['']);
    });

    it('should handle trailing newline', () => {
      expect(splitLines('a\nb\n')).toEqual(['a', 'b', '']);
    });

    it('should handle multiple consecutive newlines', () => {
      expect(splitLines('a\n\nb')).toEqual(['a', '', 'b']);
    });
  });

  describe('joinLines', () => {
    it('should join with newline', () => {
      expect(joinLines(['a', 'b', 'c'])).toBe('a\nb\nc');
    });

    it('should handle single line', () => {
      expect(joinLines(['hello'])).toBe('hello');
    });

    it('should handle empty array', () => {
      expect(joinLines([])).toBe('');
    });

    it('should handle empty strings in array', () => {
      expect(joinLines(['a', '', 'b'])).toBe('a\n\nb');
    });
  });

  describe('normalizeLines', () => {
    it('should pad with empty lines if fewer than target', () => {
      const result = normalizeLines('a\nb', 4);
      expect(result).toEqual(['a', 'b', '', '']);
    });

    it('should truncate if more than target', () => {
      const result = normalizeLines('a\nb\nc\nd', 2);
      expect(result).toEqual(['a', 'b']);
    });

    it('should return exact lines if equal to target', () => {
      const result = normalizeLines('a\nb\nc', 3);
      expect(result).toEqual(['a', 'b', 'c']);
    });

    it('should handle single line', () => {
      const result = normalizeLines('hello', 3);
      expect(result).toEqual(['hello', '', '']);
    });

    it('should handle empty string', () => {
      const result = normalizeLines('', 2);
      expect(result).toEqual(['', '']);
    });

    it('should handle target of 0', () => {
      const result = normalizeLines('a\nb', 0);
      expect(result).toEqual([]);
    });
  });

  describe('compositeHorizontal', () => {
    it('should combine two texts side by side', () => {
      const left = 'Hello';
      const right = 'World';
      const result = compositeHorizontal(left, right, 10, 5);
      expect(stringWidth(result)).toBe(10);
    });

    it('should handle different line counts', () => {
      const left = 'A\nB\nC';
      const right = 'X';
      const result = compositeHorizontal(left, right, 10, 5);
      const lines = splitLines(result);
      expect(lines.length).toBe(3);
    });

    it('should respect split point', () => {
      const left = 'ABCDE';
      const right = 'FGHIJ';
      const result = compositeHorizontal(left, right, 10, 3);
      // Left gets 3 chars, right gets 7 chars
      expect(stringWidth(result)).toBe(10);
    });

    it('should add gap between parts', () => {
      const left = 'AB';
      const right = 'CD';
      const result = compositeHorizontal(left, right, 10, 4, 2);
      // Left: 4 chars, gap: 2 chars, right: 4 chars
      const lines = splitLines(result);
      expect(stringWidth(lines[0])).toBe(10);
    });

    it('should handle empty left', () => {
      const result = compositeHorizontal('', 'Hello', 10, 3);
      expect(result).toBeDefined();
    });

    it('should handle empty right', () => {
      const result = compositeHorizontal('Hello', '', 10, 7);
      expect(result).toBeDefined();
    });

    it('should handle multiline content', () => {
      const left = 'Line 1\nLine 2\nLine 3';
      const right = 'A\nB';
      const result = compositeHorizontal(left, right, 20, 10);
      const lines = splitLines(result);
      expect(lines.length).toBe(3);
    });

    it('should preserve ANSI codes in left content', () => {
      const left = '\x1b[31mRed\x1b[0m';
      const right = 'Plain';
      const result = compositeHorizontal(left, right, 10, 5);
      expect(result).toContain('\x1b[31m');
    });

    it('should preserve ANSI codes in right content', () => {
      const left = 'Plain';
      const right = '\x1b[32mGreen\x1b[0m';
      const result = compositeHorizontal(left, right, 10, 5);
      expect(result).toContain('\x1b[32m');
    });

    it('should simulate swipe left at 50%', () => {
      // Simulating transition: left content sliding out, right sliding in
      const prev = 'Previous';
      const next = 'Next';
      const width = 16;
      const splitPoint = 8; // 50%
      const result = compositeHorizontal(prev, next, width, splitPoint);
      expect(stringWidth(result)).toBe(width);
    });
  });

  describe('compositeVertical', () => {
    it('should combine two texts vertically', () => {
      const top = 'Top\nContent';
      const bottom = 'Bottom\nContent';
      const result = compositeVertical(top, bottom, 4, 2);
      const lines = splitLines(result);
      expect(lines.length).toBe(4);
    });

    it('should take bottom lines from top content', () => {
      const top = 'Line1\nLine2\nLine3';
      const bottom = 'A\nB';
      const result = compositeVertical(top, bottom, 3, 1);
      const lines = splitLines(result);
      // Should take last 1 line from top, first 2 from bottom
      expect(lines[0]).toBe('Line3');
    });

    it('should take top lines from bottom content', () => {
      const top = 'A\nB\nC';
      const bottom = 'X\nY\nZ';
      const result = compositeVertical(top, bottom, 4, 2);
      const lines = splitLines(result);
      // Last 2 from top (B,C), first 2 from bottom (X,Y)
      expect(lines).toEqual(['B', 'C', 'X', 'Y']);
    });

    it('should add gap between parts', () => {
      const top = 'A\nB\nC';
      const bottom = 'X\nY\nZ';
      const result = compositeVertical(top, bottom, 5, 2, 1);
      const lines = splitLines(result);
      // 2 from top (B,C) + 1 gap + 2 from bottom (X,Y)
      expect(lines.length).toBe(5);
      expect(lines[2]).toBe(''); // gap line
    });

    it('should handle empty top', () => {
      const result = compositeVertical('', 'Bottom\nContent', 3, 1);
      const lines = splitLines(result);
      expect(lines.length).toBe(3);
    });

    it('should handle empty bottom', () => {
      const result = compositeVertical('Top\nContent', '', 3, 2);
      const lines = splitLines(result);
      expect(lines.length).toBe(3);
    });

    it('should handle single line content', () => {
      const result = compositeVertical('Single', 'Line', 2, 1);
      const lines = splitLines(result);
      expect(lines.length).toBe(2);
    });

    it('should simulate slide up at 50%', () => {
      const prev = 'Line 1\nLine 2\nLine 3\nLine 4';
      const next = 'A\nB\nC\nD';
      const height = 4;
      const splitPoint = 2; // 50%
      const result = compositeVertical(prev, next, height, splitPoint);
      const lines = splitLines(result);
      expect(lines.length).toBe(4);
    });
  });

  describe('colorToAnsi', () => {
    it('should convert named colors to foreground', () => {
      expect(colorToAnsi('red')).toBe('\x1b[31m');
      expect(colorToAnsi('green')).toBe('\x1b[32m');
      expect(colorToAnsi('blue')).toBe('\x1b[34m');
      expect(colorToAnsi('cyan')).toBe('\x1b[36m');
      expect(colorToAnsi('magenta')).toBe('\x1b[35m');
      expect(colorToAnsi('yellow')).toBe('\x1b[33m');
      expect(colorToAnsi('white')).toBe('\x1b[37m');
      expect(colorToAnsi('black')).toBe('\x1b[30m');
      expect(colorToAnsi('gray')).toBe('\x1b[90m');
      expect(colorToAnsi('grey')).toBe('\x1b[90m');
    });

    it('should convert named colors to background', () => {
      expect(colorToAnsi('red', 'background')).toBe('\x1b[41m');
      expect(colorToAnsi('green', 'background')).toBe('\x1b[42m');
    });

    it('should convert bright colors', () => {
      expect(colorToAnsi('redBright')).toBe('\x1b[91m');
      expect(colorToAnsi('greenBright')).toBe('\x1b[92m');
      expect(colorToAnsi('yellowBright')).toBe('\x1b[93m');
      expect(colorToAnsi('blueBright')).toBe('\x1b[94m');
      expect(colorToAnsi('magentaBright')).toBe('\x1b[95m');
      expect(colorToAnsi('cyanBright')).toBe('\x1b[96m');
      expect(colorToAnsi('whiteBright')).toBe('\x1b[97m');
    });

    it('should convert hex colors', () => {
      expect(colorToAnsi('#ff0000')).toBe('\x1b[38;2;255;0;0m');
      expect(colorToAnsi('#00ff00')).toBe('\x1b[38;2;0;255;0m');
    });

    it('should convert short hex colors', () => {
      expect(colorToAnsi('#f00')).toBe('\x1b[38;2;255;0;0m');
      expect(colorToAnsi('#0f0')).toBe('\x1b[38;2;0;255;0m');
    });

    it('should convert hex background', () => {
      expect(colorToAnsi('#ff0000', 'background')).toBe('\x1b[48;2;255;0;0m');
    });

    it('should convert RGB colors', () => {
      expect(colorToAnsi('rgb(255, 0, 0)')).toBe('\x1b[38;2;255;0;0m');
      expect(colorToAnsi('rgb(0, 128, 255)')).toBe('\x1b[38;2;0;128;255m');
    });

    it('should convert RGB background', () => {
      expect(colorToAnsi('rgb(255, 0, 0)', 'background')).toBe('\x1b[48;2;255;0;0m');
    });

    it('should convert ANSI256 colors', () => {
      expect(colorToAnsi('ansi256(196)')).toBe('\x1b[38;5;196m');
      expect(colorToAnsi('ansi256(46)')).toBe('\x1b[38;5;46m');
    });

    it('should convert ANSI256 background', () => {
      expect(colorToAnsi('ansi256(196)', 'background')).toBe('\x1b[48;5;196m');
    });

    it('should return empty for undefined', () => {
      expect(colorToAnsi(undefined as any)).toBe('');
    });

    it('should return empty for invalid color', () => {
      expect(colorToAnsi('invalidcolor')).toBe('');
    });

    it('should return empty for invalid hex', () => {
      expect(colorToAnsi('#12345')).toBe('');
    });
  });

  describe('colorize', () => {
    it('should colorize text', () => {
      const result = colorize('text', 'red');
      expect(result).toBe('\x1b[31mtext\x1b[0m');
    });

    it('should apply background', () => {
      const result = colorize('text', 'blue', 'background');
      expect(result).toBe('\x1b[44mtext\x1b[0m');
    });

    it('should handle undefined color', () => {
      const result = colorize('text', undefined as any);
      expect(result).toBe('text');
    });
  });

  describe('style', () => {
    it('should apply bold', () => {
      const result = style('text', 'bold');
      expect(result).toBe('\x1b[1mtext\x1b[0m');
    });

    it('should apply dim', () => {
      const result = style('text', 'dim');
      expect(result).toBe('\x1b[2mtext\x1b[0m');
    });

    it('should apply italic', () => {
      const result = style('text', 'italic');
      expect(result).toBe('\x1b[3mtext\x1b[0m');
    });

    it('should apply underline', () => {
      const result = style('text', 'underline');
      expect(result).toBe('\x1b[4mtext\x1b[0m');
    });

    it('should apply multiple styles', () => {
      const result = style('text', 'bold', 'underline');
      expect(result).toContain('\x1b[1m');
      expect(result).toContain('\x1b[4m');
    });
  });

  describe('hyperlink', () => {
    it('should create hyperlink', () => {
      const result = hyperlink('Click me', 'https://example.com');
      expect(result).toContain('\x1b]8;;https://example.com\x07');
      expect(result).toContain('Click me');
      expect(result).toContain('\x1b]8;;\x07');
    });
  });

  describe('styles', () => {
    it('should have all style codes', () => {
      expect(styles.reset).toBe('\x1b[0m');
      expect(styles.bold).toBe('\x1b[1m');
      expect(styles.dim).toBe('\x1b[2m');
      expect(styles.italic).toBe('\x1b[3m');
      expect(styles.underline).toBe('\x1b[4m');
      expect(styles.inverse).toBe('\x1b[7m');
      expect(styles.strikethrough).toBe('\x1b[9m');
    });
  });
});
