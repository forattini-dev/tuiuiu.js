/**
 * Border Styles Tests
 *
 * Tests for extended border styles including basic, ASCII, dashed, block,
 * key, panel, and hidden styles.
 */

import { describe, it, expect } from 'vitest';
import {
  BORDER_STYLES,
  getBorderChars,
  listBorderStyles,
  BorderStyleName,
  BorderChars,
} from '../../src/utils/types.js';

describe('Border Styles', () => {
  describe('BORDER_STYLES constant', () => {
    it('should have all expected border styles', () => {
      const expectedStyles: BorderStyleName[] = [
        // Basic styles
        'single', 'double', 'round', 'bold', 'heavy',
        // Mixed styles
        'singleDouble', 'doubleSingle',
        // ASCII styles
        'classic', 'ascii', 'asciiDouble', 'markdown',
        // Arrow style
        'arrow',
        // Dashed styles
        'dashed', 'dashedHeavy',
        // Head styles
        'heavyHead', 'doubleHead',
        // Edge styles
        'heavyEdge', 'doubleEdge',
        // Minimal styles
        'minimal', 'minimalHeavy', 'minimalDouble', 'horizontals',
        // Block styles
        'inner', 'outer', 'thick', 'block',
        // Key styles
        'hkey', 'vkey',
        // Panel styles
        'tall', 'panel', 'tab', 'wide',
        // Hidden styles
        'none', 'hidden', 'blank',
      ];

      for (const style of expectedStyles) {
        expect(BORDER_STYLES).toHaveProperty(style);
      }
    });

    it('each style should have all required border characters', () => {
      const requiredProps: (keyof BorderChars)[] = [
        'topLeft', 'topRight', 'bottomLeft', 'bottomRight',
        'top', 'bottom', 'left', 'right',
      ];

      for (const [styleName, chars] of Object.entries(BORDER_STYLES)) {
        for (const prop of requiredProps) {
          expect(chars, `Style "${styleName}" missing "${prop}"`).toHaveProperty(prop);
          expect(typeof chars[prop], `Style "${styleName}.${prop}" should be string`).toBe('string');
        }
      }
    });
  });

  describe('Basic styles', () => {
    it('single style should use box drawing characters', () => {
      const single = BORDER_STYLES.single;
      expect(single.topLeft).toBe('┌');
      expect(single.topRight).toBe('┐');
      expect(single.bottomLeft).toBe('└');
      expect(single.bottomRight).toBe('┘');
      expect(single.top).toBe('─');
      expect(single.bottom).toBe('─');
      expect(single.left).toBe('│');
      expect(single.right).toBe('│');
    });

    it('double style should use double-line characters', () => {
      const double = BORDER_STYLES.double;
      expect(double.topLeft).toBe('╔');
      expect(double.top).toBe('═');
      expect(double.left).toBe('║');
    });

    it('round style should use rounded corners', () => {
      const round = BORDER_STYLES.round;
      expect(round.topLeft).toBe('╭');
      expect(round.topRight).toBe('╮');
      expect(round.bottomLeft).toBe('╰');
      expect(round.bottomRight).toBe('╯');
    });

    it('bold and heavy should be identical (aliases)', () => {
      expect(BORDER_STYLES.bold).toEqual(BORDER_STYLES.heavy);
    });

    it('bold style should use heavy box drawing', () => {
      const bold = BORDER_STYLES.bold;
      expect(bold.top).toBe('━');
      expect(bold.left).toBe('┃');
    });
  });

  describe('Mixed styles', () => {
    it('singleDouble should have single horizontal, double vertical', () => {
      const style = BORDER_STYLES.singleDouble;
      expect(style.top).toBe('─');  // single
      expect(style.left).toBe('║'); // double
    });

    it('doubleSingle should have double horizontal, single vertical', () => {
      const style = BORDER_STYLES.doubleSingle;
      expect(style.top).toBe('═');  // double
      expect(style.left).toBe('│'); // single
    });
  });

  describe('ASCII styles', () => {
    it('classic and ascii should be identical (aliases)', () => {
      expect(BORDER_STYLES.classic).toEqual(BORDER_STYLES.ascii);
    });

    it('classic should use ASCII characters', () => {
      const classic = BORDER_STYLES.classic;
      expect(classic.topLeft).toBe('+');
      expect(classic.top).toBe('-');
      expect(classic.left).toBe('|');
    });

    it('asciiDouble should use = for horizontal lines', () => {
      const style = BORDER_STYLES.asciiDouble;
      expect(style.top).toBe('=');
      expect(style.bottom).toBe('=');
    });

    it('markdown should use | for all corners', () => {
      const style = BORDER_STYLES.markdown;
      expect(style.topLeft).toBe('|');
      expect(style.topRight).toBe('|');
      expect(style.bottomLeft).toBe('|');
      expect(style.bottomRight).toBe('|');
    });
  });

  describe('Arrow style', () => {
    it('should use arrow characters pointing inward', () => {
      const arrow = BORDER_STYLES.arrow;
      expect(arrow.top).toBe('↓');
      expect(arrow.bottom).toBe('↑');
      expect(arrow.left).toBe('→');
      expect(arrow.right).toBe('←');
    });
  });

  describe('Dashed styles', () => {
    it('dashed should use dashed box drawing characters', () => {
      const dashed = BORDER_STYLES.dashed;
      expect(dashed.top).toBe('╌');
      expect(dashed.left).toBe('╎');
    });

    it('dashedHeavy should use heavy dashed characters', () => {
      const style = BORDER_STYLES.dashedHeavy;
      expect(style.top).toBe('╍');
      expect(style.left).toBe('╏');
    });
  });

  describe('Head styles', () => {
    it('heavyHead should have heavy top, single elsewhere', () => {
      const style = BORDER_STYLES.heavyHead;
      expect(style.top).toBe('━');     // heavy
      expect(style.bottom).toBe('─');  // single
      expect(style.left).toBe('│');    // single
    });

    it('doubleHead should have double top, single elsewhere', () => {
      const style = BORDER_STYLES.doubleHead;
      expect(style.top).toBe('═');     // double
      expect(style.bottom).toBe('─');  // single
    });
  });

  describe('Edge styles', () => {
    it('heavyEdge should have heavy sides, single top/bottom', () => {
      const style = BORDER_STYLES.heavyEdge;
      expect(style.left).toBe('┃');    // heavy
      expect(style.right).toBe('┃');   // heavy
      expect(style.top).toBe('─');     // single
    });

    it('doubleEdge should have double sides, single top/bottom', () => {
      const style = BORDER_STYLES.doubleEdge;
      expect(style.left).toBe('║');    // double
      expect(style.top).toBe('─');     // single
    });
  });

  describe('Minimal styles', () => {
    it('minimal should have horizontal lines only', () => {
      const style = BORDER_STYLES.minimal;
      expect(style.top).toBe('─');
      expect(style.bottom).toBe('─');
      expect(style.left).toBe(' ');
      expect(style.right).toBe(' ');
    });

    it('minimalHeavy should have heavy horizontal lines only', () => {
      const style = BORDER_STYLES.minimalHeavy;
      expect(style.top).toBe('━');
      expect(style.left).toBe(' ');
    });

    it('minimalDouble should have double horizontal lines only', () => {
      const style = BORDER_STYLES.minimalDouble;
      expect(style.top).toBe('═');
      expect(style.left).toBe(' ');
    });

    it('horizontals should have no corners', () => {
      const style = BORDER_STYLES.horizontals;
      expect(style.topLeft).toBe(' ');
      expect(style.topRight).toBe(' ');
      expect(style.top).toBe('─');
    });
  });

  describe('Block styles', () => {
    it('inner should use block quarter characters', () => {
      const style = BORDER_STYLES.inner;
      expect(style.topLeft).toBe('▗');
      expect(style.topRight).toBe('▖');
      expect(style.top).toBe('▄');
      expect(style.left).toBe('▐');
    });

    it('outer should use inverse block characters', () => {
      const style = BORDER_STYLES.outer;
      expect(style.topLeft).toBe('▛');
      expect(style.top).toBe('▀');
      expect(style.left).toBe('▌');
    });

    it('thick should use full block characters', () => {
      const style = BORDER_STYLES.thick;
      expect(style.topLeft).toBe('█');
      expect(style.left).toBe('█');
    });

    it('block should use half block characters', () => {
      const style = BORDER_STYLES.block;
      expect(style.top).toBe('▄');
      expect(style.bottom).toBe('▀');
      expect(style.left).toBe('█');
    });
  });

  describe('Key styles', () => {
    it('hkey should have horizontal fractional lines', () => {
      const style = BORDER_STYLES.hkey;
      expect(style.top).toBe('▔');
      expect(style.bottom).toBe('▁');
      expect(style.left).toBe(' ');
    });

    it('vkey should have vertical fractional lines', () => {
      const style = BORDER_STYLES.vkey;
      expect(style.left).toBe('▏');
      expect(style.right).toBe('▕');
      expect(style.top).toBe(' ');
    });
  });

  describe('Panel styles', () => {
    it('tall should use eighth block characters', () => {
      const style = BORDER_STYLES.tall;
      expect(style.left).toBe('▊');
      expect(style.right).toBe('▎');
      expect(style.top).toBe('▔');
    });

    it('panel should have solid top', () => {
      const style = BORDER_STYLES.panel;
      expect(style.top).toBe('█');
      expect(style.left).toBe('▊');
    });

    it('tab and wide should be identical', () => {
      expect(BORDER_STYLES.tab).toEqual(BORDER_STYLES.wide);
    });

    it('tab should have inverted appearance', () => {
      const style = BORDER_STYLES.tab;
      expect(style.top).toBe('▁');
      expect(style.bottom).toBe('▔');
    });
  });

  describe('Hidden styles', () => {
    it('none should use space characters', () => {
      const style = BORDER_STYLES.none;
      expect(style.topLeft).toBe(' ');
      expect(style.top).toBe(' ');
      expect(style.left).toBe(' ');
    });

    it('hidden should be identical to none', () => {
      expect(BORDER_STYLES.hidden).toEqual(BORDER_STYLES.none);
    });

    it('blank should be identical to none', () => {
      expect(BORDER_STYLES.blank).toEqual(BORDER_STYLES.none);
    });
  });

  describe('getBorderChars', () => {
    it('should return correct border for known style', () => {
      expect(getBorderChars('single')).toEqual(BORDER_STYLES.single);
      expect(getBorderChars('double')).toEqual(BORDER_STYLES.double);
      expect(getBorderChars('round')).toEqual(BORDER_STYLES.round);
    });

    it('should fall back to single for unknown style', () => {
      expect(getBorderChars('unknown-style')).toEqual(BORDER_STYLES.single);
    });

    it('should handle all defined styles', () => {
      for (const styleName of Object.keys(BORDER_STYLES)) {
        const result = getBorderChars(styleName);
        expect(result).toBeDefined();
        expect(result).toEqual(BORDER_STYLES[styleName as BorderStyleName]);
      }
    });
  });

  describe('listBorderStyles', () => {
    it('should return array of all border style names', () => {
      const styles = listBorderStyles();
      expect(Array.isArray(styles)).toBe(true);
      expect(styles.length).toBeGreaterThan(0);
    });

    it('should include all basic styles', () => {
      const styles = listBorderStyles();
      expect(styles).toContain('single');
      expect(styles).toContain('double');
      expect(styles).toContain('round');
      expect(styles).toContain('bold');
    });

    it('should include all block styles', () => {
      const styles = listBorderStyles();
      expect(styles).toContain('inner');
      expect(styles).toContain('outer');
      expect(styles).toContain('thick');
      expect(styles).toContain('block');
    });

    it('should include all panel styles', () => {
      const styles = listBorderStyles();
      expect(styles).toContain('tall');
      expect(styles).toContain('panel');
      expect(styles).toContain('tab');
      expect(styles).toContain('wide');
    });

    it('should match the keys of BORDER_STYLES', () => {
      const styles = listBorderStyles();
      const keys = Object.keys(BORDER_STYLES);
      expect(styles.sort()).toEqual(keys.sort());
    });
  });

  describe('Border rendering helpers', () => {
    it('should be possible to render a simple box', () => {
      const chars = BORDER_STYLES.single;
      const width = 5;
      const height = 3;

      const topLine = chars.topLeft + chars.top.repeat(width - 2) + chars.topRight;
      const middleLine = chars.left + ' '.repeat(width - 2) + chars.right;
      const bottomLine = chars.bottomLeft + chars.bottom.repeat(width - 2) + chars.bottomRight;

      const box = [topLine, middleLine, bottomLine].join('\n');

      expect(box).toBe('┌───┐\n│   │\n└───┘');
    });

    it('should render a double border box', () => {
      const chars = BORDER_STYLES.double;
      const topLine = chars.topLeft + chars.top.repeat(3) + chars.topRight;
      const middleLine = chars.left + ' '.repeat(3) + chars.right;
      const bottomLine = chars.bottomLeft + chars.bottom.repeat(3) + chars.bottomRight;

      const box = [topLine, middleLine, bottomLine].join('\n');

      expect(box).toBe('╔═══╗\n║   ║\n╚═══╝');
    });

    it('should render a round border box', () => {
      const chars = BORDER_STYLES.round;
      const topLine = chars.topLeft + chars.top.repeat(3) + chars.topRight;
      const bottomLine = chars.bottomLeft + chars.bottom.repeat(3) + chars.bottomRight;

      expect(topLine).toBe('╭───╮');
      expect(bottomLine).toBe('╰───╯');
    });

    it('should render a classic ASCII box', () => {
      const chars = BORDER_STYLES.classic;
      const topLine = chars.topLeft + chars.top.repeat(3) + chars.topRight;
      const bottomLine = chars.bottomLeft + chars.bottom.repeat(3) + chars.bottomRight;

      expect(topLine).toBe('+---+');
      expect(bottomLine).toBe('+---+');
    });

    it('should render a minimal style (horizontal only)', () => {
      const chars = BORDER_STYLES.minimal;
      const width = 5;

      const topLine = chars.topLeft + chars.top.repeat(width - 2) + chars.topRight;
      const middleLine = chars.left + ' '.repeat(width - 2) + chars.right;

      expect(topLine).toBe('─────');
      expect(middleLine).toBe('     ');
    });
  });

  describe('Character width consistency', () => {
    it('all characters should be single-width for basic styles', () => {
      const basicStyles: BorderStyleName[] = ['single', 'double', 'round', 'bold', 'classic'];

      for (const styleName of basicStyles) {
        const chars = BORDER_STYLES[styleName];
        for (const [key, char] of Object.entries(chars)) {
          expect(char.length, `${styleName}.${key} should be single character`).toBe(1);
        }
      }
    });

    it('all characters should be single-width for block styles', () => {
      const blockStyles: BorderStyleName[] = ['inner', 'outer', 'thick', 'block'];

      for (const styleName of blockStyles) {
        const chars = BORDER_STYLES[styleName];
        for (const [key, char] of Object.entries(chars)) {
          expect(char.length, `${styleName}.${key} should be single character`).toBe(1);
        }
      }
    });
  });

  describe('Style count', () => {
    it('should have at least 30 border styles', () => {
      const styleCount = Object.keys(BORDER_STYLES).length;
      expect(styleCount).toBeGreaterThanOrEqual(30);
    });

    it('should have exactly the documented number of styles', () => {
      // Total: 35 border styles
      // Basic(5) + Mixed(2) + ASCII(4) + Arrow(1) + Dashed(2) + Head(2) + Edge(2) +
      // Minimal(4) + Block(4) + Key(2) + Panel(4) + Hidden(3) = 35
      expect(Object.keys(BORDER_STYLES).length).toBe(35);
    });
  });
});
