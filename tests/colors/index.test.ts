/**
 * Tests for colors module index (theme integration, Tailwind, styles)
 */
import { describe, it, expect } from 'vitest';
import {
  // Theme integration
  theme,
  // Tailwind colors
  tw,
  // Pre-composed styles
  styles,
  // Re-exported ANSI functions
  red,
  bold,
  compose,
  c,
  stripAnsi,
} from '../../src/colors/index.js';

describe('Theme Integration', () => {
  it('should provide theme color functions', () => {
    expect(typeof theme.primary).toBe('function');
    expect(typeof theme.secondary).toBe('function');
    expect(typeof theme.success).toBe('function');
    expect(typeof theme.warning).toBe('function');
    expect(typeof theme.error).toBe('function');
    expect(typeof theme.info).toBe('function');
    expect(typeof theme.muted).toBe('function');
    expect(typeof theme.foreground).toBe('function');
    expect(typeof theme.accent).toBe('function');
  });

  it('should apply theme colors', () => {
    const result = theme.primary('test');
    expect(stripAnsi(result)).toBe('test');
    // Theme colors are hex-based, so should have RGB code
    expect(result).toMatch(/\u001B\[38;2;\d+;\d+;\d+m/);
  });

  it('should provide bold theme variants', () => {
    expect(typeof theme.primaryBold).toBe('function');
    expect(typeof theme.successBold).toBe('function');
    expect(typeof theme.errorBold).toBe('function');
    expect(typeof theme.warningBold).toBe('function');
    expect(typeof theme.infoBold).toBe('function');
  });

  it('should apply bold theme colors', () => {
    const result = theme.errorBold('Error!');
    expect(stripAnsi(result)).toBe('Error!');
    expect(result).toContain('\u001B[1m'); // bold
  });
});

describe('Tailwind Color Integration', () => {
  it('should provide Tailwind palette access', () => {
    expect(typeof tw.blue).toBe('object');
    expect(typeof tw.red).toBe('object');
    expect(typeof tw.green).toBe('object');
  });

  it('should apply Tailwind colors with shades', () => {
    const result = tw.blue[500]('test');
    expect(stripAnsi(result)).toBe('test');
    // blue-500 is #3b82f6 = rgb(59, 130, 246)
    expect(result).toContain('\u001B[38;2;59;130;246m');
  });

  it('should apply different shades', () => {
    const light = tw.blue[100]('light');
    const dark = tw.blue[900]('dark');

    expect(stripAnsi(light)).toBe('light');
    expect(stripAnsi(dark)).toBe('dark');

    // Different shades should produce different codes
    expect(light).not.toBe(dark);
  });

  it('should apply various Tailwind colors', () => {
    const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'pink', 'cyan'] as const;

    for (const color of colors) {
      const result = (tw as any)[color][500]('test');
      expect(stripAnsi(result)).toBe('test');
      expect(result).toMatch(/\u001B\[38;2;\d+;\d+;\d+m/);
    }
  });

  it('should handle base colors', () => {
    // White is a simple color (not a palette)
    const whiteResult = tw.white('test');
    expect(stripAnsi(whiteResult)).toBe('test');

    // Black is also a simple color
    const blackResult = tw.black('test');
    expect(stripAnsi(blackResult)).toBe('test');
  });
});

describe('Pre-composed Styles', () => {
  it('should provide error styles', () => {
    expect(typeof styles.errorBold).toBe('function');
    expect(typeof styles.errorDim).toBe('function');

    expect(stripAnsi(styles.errorBold('Error!'))).toBe('Error!');
  });

  it('should provide success styles', () => {
    expect(typeof styles.successBold).toBe('function');
    expect(typeof styles.successDim).toBe('function');
  });

  it('should provide warning styles', () => {
    expect(typeof styles.warningBold).toBe('function');
    expect(typeof styles.warningDim).toBe('function');
  });

  it('should provide info styles', () => {
    expect(typeof styles.infoBold).toBe('function');
    expect(typeof styles.infoDim).toBe('function');
  });

  it('should provide primary styles', () => {
    expect(typeof styles.primaryBold).toBe('function');
    expect(typeof styles.primaryDim).toBe('function');
  });

  it('should provide link styles', () => {
    expect(typeof styles.link).toBe('function');
    expect(typeof styles.linkBold).toBe('function');

    const result = styles.link('https://example.com');
    expect(stripAnsi(result)).toBe('https://example.com');
    expect(result).toContain('\u001B[4m'); // underline
  });

  it('should provide highlight styles', () => {
    expect(typeof styles.highlight).toBe('function');
    expect(typeof styles.highlightError).toBe('function');
    expect(typeof styles.highlightSuccess).toBe('function');
  });

  it('should provide code styles', () => {
    expect(typeof styles.code).toBe('function');
    expect(typeof styles.codeBold).toBe('function');
  });

  it('should provide header styles', () => {
    expect(typeof styles.h1).toBe('function');
    expect(typeof styles.h2).toBe('function');
    expect(typeof styles.h3).toBe('function');

    const h1Result = styles.h1('Title');
    expect(stripAnsi(h1Result)).toBe('Title');
    expect(h1Result).toContain('\u001B[1m'); // bold
    expect(h1Result).toContain('\u001B[4m'); // underline
  });
});

describe('Re-exported Functions', () => {
  it('should re-export c functions', () => {
    expect(typeof red).toBe('function');
    expect(typeof bold).toBe('function');
    expect(typeof compose).toBe('function');
    expect(typeof c).toBe('function');
  });

  it('should work correctly', () => {
    expect(stripAnsi(red('test'))).toBe('test');
    expect(stripAnsi(bold('test'))).toBe('test');
    expect(stripAnsi(compose(red, bold)('test'))).toBe('test');
    expect(stripAnsi(c.red.bold('test'))).toBe('test');
  });
});

describe('Integration Examples', () => {
  it('should support CLI formatter pattern', () => {
    // This is the pattern cli-args-parser uses
    const formatter = {
      'section-header': (s: string) => c.bold.white(s),
      'option-flag': (s: string) => c.green(s),
      'option-type': (s: string) => c.cyan(s),
      'error-message': (s: string) => c.red(s),
    };

    expect(stripAnsi(formatter['section-header']('OPTIONS'))).toBe('OPTIONS');
    expect(stripAnsi(formatter['option-flag']('--help'))).toBe('--help');
    expect(stripAnsi(formatter['option-type']('string'))).toBe('string');
    expect(stripAnsi(formatter['error-message']('Invalid'))).toBe('Invalid');
  });

  it('should support simple function pattern', () => {
    // Alternative simpler pattern
    const formatter = {
      header: styles.h1,
      flag: (s: string) => c.green(s),
      type: (s: string) => c.cyan(s),
      error: styles.errorBold,
    };

    expect(stripAnsi(formatter.header('OPTIONS'))).toBe('OPTIONS');
    expect(stripAnsi(formatter.error('Failed!'))).toBe('Failed!');
  });

  it('should support theme-based formatter', () => {
    const formatter = {
      primary: theme.primary,
      success: theme.success,
      error: theme.error,
      warning: theme.warning,
    };

    expect(stripAnsi(formatter.primary('Action'))).toBe('Action');
    expect(stripAnsi(formatter.success('Done'))).toBe('Done');
  });
});
