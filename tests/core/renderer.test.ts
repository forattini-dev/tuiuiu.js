/**
 * Renderer tests - ANSI colors and emoji handling
 */

import { describe, it, expect } from 'vitest';
import { renderOnce, Box, Text } from '../../src/index.js';
import { stringWidth, stripAnsi, colorize } from '../../src/utils/text-utils.js';

describe('stringWidth', () => {
  it('calculates width of plain text', () => {
    expect(stringWidth('hello')).toBe(5);
    expect(stringWidth('world')).toBe(5);
  });

  it('ignores ANSI codes', () => {
    const colored = '\x1b[31mred\x1b[0m';
    expect(stringWidth(colored)).toBe(3);
  });

  it('handles emojis as width 2', () => {
    expect(stringWidth('🎉')).toBe(2);
    expect(stringWidth('👍')).toBe(2);
    expect(stringWidth('✨')).toBe(2);
    expect(stringWidth('📚')).toBe(2);
    expect(stringWidth('🎛️')).toBeGreaterThanOrEqual(2); // May have variation selector
  });

  it('handles mixed text and emoji', () => {
    // "A" (1) + "🎉" (2) + "B" (1) = 4
    expect(stringWidth('A🎉B')).toBe(4);
  });

  it('handles CJK characters as width 2', () => {
    expect(stringWidth('中')).toBe(2);
    expect(stringWidth('日本')).toBe(4);
  });

  it('handles colored text with emojis', () => {
    const coloredEmoji = colorize('🎉', 'red', 'foreground');
    // The emoji is still 2 wide, ANSI codes add 0 width
    expect(stringWidth(coloredEmoji)).toBe(2);
  });
});

describe('Renderer with colors', () => {
  it('renders colored text correctly positioned', () => {
    const output = renderOnce(
      Box({ width: 20, borderStyle: 'single' },
        Text({ color: 'red' }, 'RED'),
        Text({ color: 'blue' }, 'BLUE')
      )
    );

    // Box should have consistent width
    const lines = output.split('\n');
    // All lines should have same visible width (20)
    for (const line of lines) {
      const width = stringWidth(line);
      expect(width).toBe(20);
    }
  });

  it('renders text with embedded colors correctly', () => {
    const coloredText = colorize('HELLO', 'cyan', 'foreground');
    const output = renderOnce(
      Box({ width: 15, borderStyle: 'single' },
        Text({}, coloredText)
      )
    );

    // Box should maintain width even with ANSI codes
    const lines = output.split('\n');
    for (const line of lines) {
      expect(stringWidth(line)).toBe(15);
    }

    // Should contain the ANSI codes for cyan
    expect(output).toContain('\x1b[36m'); // cyan foreground
    expect(output).toContain('HELLO');
  });
});

describe('Renderer with emojis', () => {
  it('renders emoji with correct width accounting', () => {
    const output = renderOnce(
      Box({ width: 10, borderStyle: 'single' },
        Text({}, '📚 Hi')
      )
    );

    console.log('Output:');
    console.log(output);
    console.log('---');
    const lines = output.split('\n');
    for (const line of lines) {
      console.log(`Line width: ${stringWidth(line)}, raw length: ${line.length}, line: "${line}"`);
    }

    // Box should be 10 wide
    for (const line of lines) {
      expect(stringWidth(line)).toBe(10);
    }
  });

  it('renders multiple emojis correctly', () => {
    const output = renderOnce(
      Box({ width: 15, borderStyle: 'single' },
        Text({}, '🎉🎊🎁')
      )
    );

    const lines = output.split('\n');
    for (const line of lines) {
      expect(stringWidth(line)).toBe(15);
    }
  });

  it('handles emoji in row layout', () => {
    const output = renderOnce(
      Box({ flexDirection: 'row', width: 20, borderStyle: 'single' },
        Text({}, '📚'),
        Text({}, ' Components')
      )
    );

    const lines = output.split('\n');
    for (const line of lines) {
      expect(stringWidth(line)).toBe(20);
    }
  });
});

describe('Renderer with mixed content', () => {
  it('renders colored emoji correctly', () => {
    // Color around emoji shouldn't affect width calculation
    const coloredEmoji = colorize('🎉', 'yellow', 'foreground');

    const output = renderOnce(
      Box({ width: 10, borderStyle: 'single' },
        Text({}, coloredEmoji)
      )
    );

    const lines = output.split('\n');
    for (const line of lines) {
      expect(stringWidth(line)).toBe(10);
    }
  });

  it('renders box with emoji title and colored content', () => {
    const output = renderOnce(
      Box({ flexDirection: 'column', width: 20, borderStyle: 'round' },
        Text({}, '📚 Components'),
        Text({ color: 'cyan' }, 'Layout'),
        Text({ color: 'green' }, 'Typography')
      )
    );

    const lines = output.split('\n');
    for (const line of lines) {
      expect(stringWidth(line)).toBe(20);
    }
  });

  it('renders three-column layout with emojis and flexGrow', () => {
    const output = renderOnce(
      Box({ flexDirection: 'row', width: 40 },
        Box({ width: 12, borderStyle: 'single' },
          Text({}, '📚 Left')
        ),
        Box({ flexGrow: 1, borderStyle: 'single' },
          Text({}, 'Center')
        ),
        Box({ width: 12, borderStyle: 'single' },
          Text({}, '🎛️ Right')
        )
      )
    );

    const lines = output.split('\n');
    // All lines should be 40 wide (flexGrow fills remaining space)
    for (const line of lines) {
      expect(stringWidth(line)).toBe(40);
    }
  });
});

describe('Color rendering', () => {
  it('preserves inline colors in text', () => {
    const red = colorize('R', 'red', 'foreground');
    const green = colorize('G', 'green', 'foreground');
    const blue = colorize('B', 'blue', 'foreground');
    const rainbow = red + green + blue;

    const output = renderOnce(
      Box({ width: 10, borderStyle: 'single' },
        Text({}, rainbow)
      )
    );

    // Should contain all color codes
    expect(output).toContain('\x1b[31m'); // red
    expect(output).toContain('\x1b[32m'); // green
    expect(output).toContain('\x1b[34m'); // blue
    expect(output).toContain('R');
    expect(output).toContain('G');
    expect(output).toContain('B');

    // Width should still be consistent
    const lines = output.split('\n');
    for (const line of lines) {
      expect(stringWidth(line)).toBe(10);
    }
  });

  it('handles RGB true colors', () => {
    const trueColor = colorize('X', 'rgb(255, 128, 0)', 'foreground');

    expect(trueColor).toContain('\x1b[38;2;'); // True color prefix
    expect(stringWidth(trueColor)).toBe(1);
  });

  it('handles hex colors', () => {
    const hexColor = colorize('X', '#ff0000', 'foreground');

    expect(hexColor).toContain('\x1b[38;2;'); // True color prefix
    expect(stringWidth(hexColor)).toBe(1);
  });
});
