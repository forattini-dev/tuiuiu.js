/**
 * Tests for ANSI color API
 */
import { describe, it, expect } from 'vitest';
import {
  // Foreground colors
  black, red, green, yellow, blue, magenta, cyan, white,
  gray, grey, blackBright, redBright, greenBright, yellowBright,
  blueBright, magentaBright, cyanBright, whiteBright,
  // Background colors
  bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan,
  bgWhite, bgGray, bgGrey,
  // Modifiers
  reset, bold, dim, italic, underline, overline, inverse, hidden, strikethrough, strike,
  // RGB/Hex/256
  rgb, bgRgb, hex, bgHex, ansi256, bgAnsi256,
  // Composition
  compose, styled,
  // Chainable
  c,
  // Utilities
  stripAnsi, hasAnsi, visibleLength,
  // Semantic
  success, error, warning, info, muted, primary, secondary,
  // Color detection
  supportsColor, supportsTrueColor, getColorLevel,
  // Template
  tpl,
  // Types
  type ColorFn,
  type ColorLevel,
} from '../../src/colors/ansi.js';

describe('Foreground Colors', () => {
  it('should apply basic colors', () => {
    expect(red('test')).toContain('\u001B[31m');
    expect(red('test')).toContain('\u001B[39m');
    expect(stripAnsi(red('test'))).toBe('test');
  });

  it('should apply all foreground colors', () => {
    const colors = [
      black, red, green, yellow, blue, magenta, cyan, white,
      gray, grey, blackBright, redBright, greenBright, yellowBright,
      blueBright, magentaBright, cyanBright, whiteBright,
    ];

    for (const color of colors) {
      const result = color('test');
      expect(hasAnsi(result)).toBe(true);
      expect(stripAnsi(result)).toBe('test');
    }
  });

  it('should handle empty strings', () => {
    expect(red('')).toContain('\u001B[31m');
    expect(stripAnsi(red(''))).toBe('');
  });
});

describe('Background Colors', () => {
  it('should apply background colors', () => {
    expect(bgRed('test')).toContain('\u001B[41m');
    expect(bgRed('test')).toContain('\u001B[49m');
    expect(stripAnsi(bgRed('test'))).toBe('test');
  });

  it('should apply all background colors', () => {
    const colors = [
      bgBlack, bgRed, bgGreen, bgYellow, bgBlue, bgMagenta, bgCyan, bgWhite,
      bgGray, bgGrey,
    ];

    for (const color of colors) {
      const result = color('test');
      expect(hasAnsi(result)).toBe(true);
      expect(stripAnsi(result)).toBe('test');
    }
  });
});

describe('Modifiers', () => {
  it('should apply bold', () => {
    expect(bold('test')).toContain('\u001B[1m');
    expect(bold('test')).toContain('\u001B[22m');
  });

  it('should apply all modifiers', () => {
    const modifiers = [
      bold, dim, italic, underline, overline, inverse, hidden, strikethrough, strike,
    ];

    for (const modifier of modifiers) {
      const result = modifier('test');
      expect(hasAnsi(result)).toBe(true);
      expect(stripAnsi(result)).toBe('test');
    }
  });

  it('should reset styles', () => {
    expect(reset('test')).toContain('\u001B[0m');
  });
});

describe('RGB/Hex/256 Colors', () => {
  it('should apply RGB colors', () => {
    const result = rgb(255, 100, 50)('test');
    expect(result).toContain('\u001B[38;2;255;100;50m');
    expect(stripAnsi(result)).toBe('test');
  });

  it('should apply background RGB colors', () => {
    const result = bgRgb(0, 100, 200)('test');
    expect(result).toContain('\u001B[48;2;0;100;200m');
    expect(stripAnsi(result)).toBe('test');
  });

  it('should apply hex colors (long form)', () => {
    const result = hex('#ff6600')('test');
    expect(result).toContain('\u001B[38;2;255;102;0m');
    expect(stripAnsi(result)).toBe('test');
  });

  it('should apply hex colors (short form)', () => {
    const result = hex('#f60')('test');
    expect(result).toContain('\u001B[38;2;255;102;0m');
    expect(stripAnsi(result)).toBe('test');
  });

  it('should apply background hex colors', () => {
    const result = bgHex('#0066ff')('test');
    expect(result).toContain('\u001B[48;2;0;102;255m');
    expect(stripAnsi(result)).toBe('test');
  });

  it('should apply ANSI 256 colors', () => {
    const result = ansi256(196)('test');
    expect(result).toContain('\u001B[38;5;196m');
    expect(stripAnsi(result)).toBe('test');
  });

  it('should apply background ANSI 256 colors', () => {
    const result = bgAnsi256(21)('test');
    expect(result).toContain('\u001B[48;5;21m');
    expect(stripAnsi(result)).toBe('test');
  });

  it('should handle invalid hex gracefully', () => {
    const result = hex('invalid')('test');
    expect(result).toBe('test');
  });
});

describe('Composition', () => {
  it('should compose multiple functions', () => {
    const errorStyle = compose(red, bold);
    const result = errorStyle('Error!');
    expect(hasAnsi(result)).toBe(true);
    expect(stripAnsi(result)).toBe('Error!');
    // Should have both red and bold codes
    expect(result).toContain('\u001B[31m');
    expect(result).toContain('\u001B[1m');
  });

  it('should compose many functions', () => {
    const style = compose(bgBlue, white, bold, underline);
    const result = style('test');
    expect(stripAnsi(result)).toBe('test');
  });

  it('should use styled() as alternative syntax', () => {
    const result = styled('test', red, bold);
    expect(stripAnsi(result)).toBe('test');
    expect(result).toContain('\u001B[31m');
    expect(result).toContain('\u001B[1m');
  });
});

describe('Chainable API (c)', () => {
  it('should apply single color', () => {
    const result = c.red('test');
    expect(hasAnsi(result)).toBe(true);
    expect(stripAnsi(result)).toBe('test');
  });

  it('should chain color and modifier', () => {
    const result = c.red.bold('test');
    expect(stripAnsi(result)).toBe('test');
    expect(result).toContain('\u001B[31m');
    expect(result).toContain('\u001B[1m');
  });

  it('should chain background and foreground', () => {
    const result = c.bgBlue.white('test');
    expect(stripAnsi(result)).toBe('test');
    expect(result).toContain('\u001B[44m');
    expect(result).toContain('\u001B[37m');
  });

  it('should chain multiple modifiers', () => {
    const result = c.red.bold.underline('test');
    expect(stripAnsi(result)).toBe('test');
  });

  it('should support rgb method', () => {
    const result = c.rgb(255, 100, 50)('test');
    expect(result).toContain('\u001B[38;2;255;100;50m');
  });

  it('should support hex method', () => {
    const result = c.hex('#ff6600')('test');
    expect(result).toContain('\u001B[38;2;255;102;0m');
  });

  it('should support chained rgb', () => {
    const result = c.rgb(255, 100, 50).bold('test');
    expect(result).toContain('\u001B[38;2;255;100;50m');
    expect(result).toContain('\u001B[1m');
  });

  it('should support bgRgb method', () => {
    const result = c.bgRgb(0, 100, 200)('test');
    expect(result).toContain('\u001B[48;2;0;100;200m');
  });

  it('should support bgHex method', () => {
    const result = c.bgHex('#0066ff')('test');
    expect(result).toContain('\u001B[48;2;0;102;255m');
  });

  it('should support ansi256 method', () => {
    const result = c.ansi256(196)('test');
    expect(result).toContain('\u001B[38;5;196m');
  });

  it('should support bgAnsi256 method', () => {
    const result = c.bgAnsi256(21)('test');
    expect(result).toContain('\u001B[48;5;21m');
  });
});

describe('Utilities', () => {
  it('should strip ANSI codes', () => {
    expect(stripAnsi(red('Hello'))).toBe('Hello');
    expect(stripAnsi(c.red.bold('Test'))).toBe('Test');
    expect(stripAnsi('plain')).toBe('plain');
  });

  it('should detect ANSI codes', () => {
    expect(hasAnsi(red('test'))).toBe(true);
    expect(hasAnsi('plain')).toBe(false);
  });

  it('should calculate visible length', () => {
    expect(visibleLength(red('Hello'))).toBe(5);
    expect(visibleLength(c.red.bold('Test'))).toBe(4);
    expect(visibleLength('plain')).toBe(5);
  });
});

describe('Semantic Aliases', () => {
  it('should provide semantic color functions', () => {
    expect(typeof success).toBe('function');
    expect(typeof error).toBe('function');
    expect(typeof warning).toBe('function');
    expect(typeof info).toBe('function');
    expect(typeof muted).toBe('function');
    expect(typeof primary).toBe('function');
    expect(typeof secondary).toBe('function');

    expect(stripAnsi(success('ok'))).toBe('ok');
    expect(stripAnsi(error('fail'))).toBe('fail');
  });
});

describe('Color Detection', () => {
  it('should return color level', () => {
    const level = getColorLevel();
    expect([0, 1, 2, 3]).toContain(level);
  });

  it('should detect color support', () => {
    const supports = supportsColor();
    expect(typeof supports).toBe('boolean');
  });

  it('should detect true color support', () => {
    const supports = supportsTrueColor();
    expect(typeof supports).toBe('boolean');
  });
});

describe('Template Literal', () => {
  it('should parse simple color', () => {
    const result = tpl`{red Error}`;
    expect(stripAnsi(result)).toBe('Error');
    expect(result).toContain('\u001B[31m');
  });

  it('should parse chained styles', () => {
    const result = tpl`{bold.underline Important}`;
    expect(stripAnsi(result)).toBe('Important');
    expect(result).toContain('\u001B[1m');
    expect(result).toContain('\u001B[4m');
  });

  it('should parse multiple patterns', () => {
    const result = tpl`{red Error:} Something {yellow happened}`;
    expect(stripAnsi(result)).toBe('Error: Something happened');
  });

  it('should handle hex in template', () => {
    const result = tpl`{hex('#ff6600') Orange}`;
    expect(stripAnsi(result)).toBe('Orange');
    expect(result).toContain('\u001B[38;2;255;102;0m');
  });

  it('should handle rgb in template', () => {
    const result = tpl`{rgb(255,100,50) Custom}`;
    expect(stripAnsi(result)).toBe('Custom');
    expect(result).toContain('\u001B[38;2;255;100;50m');
  });

  it('should interpolate values', () => {
    const name = 'World';
    const result = tpl`Hello {blue ${name}}!`;
    expect(stripAnsi(result)).toBe('Hello World!');
  });
});

describe('Type Safety', () => {
  it('should have correct ColorFn type', () => {
    const fn: ColorFn = red;
    expect(fn('test')).toBe(red('test'));
  });

  it('should have correct ColorLevel type', () => {
    const level: ColorLevel = getColorLevel();
    expect([0, 1, 2, 3]).toContain(level);
  });
});

describe('Edge Cases', () => {
  it('should handle nested colors', () => {
    const result = red(blue('inner'));
    expect(stripAnsi(result)).toBe('inner');
  });

  it('should handle special characters', () => {
    expect(stripAnsi(red('\n\t'))).toBe('\n\t');
    expect(stripAnsi(red('emoji: '))).toBe('emoji: ');
  });

  it('should handle unicode', () => {
    expect(stripAnsi(red(''))).toBe('');
    expect(stripAnsi(red('日本語'))).toBe('日本語');
  });

  it('should be reusable', () => {
    const style = compose(red, bold);
    expect(stripAnsi(style('a'))).toBe('a');
    expect(stripAnsi(style('b'))).toBe('b');
    expect(stripAnsi(style('c'))).toBe('c');
  });
});
