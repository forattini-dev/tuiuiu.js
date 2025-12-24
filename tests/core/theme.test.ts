/**
 * Tests for Theme System
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  darkTheme,
  lightTheme,
  highContrastDarkTheme,
  monochromeTheme,
  useTheme,
  getTheme,
  setTheme,
  pushTheme,
  popTheme,
  createTheme,
  getBorderRadiusChars,
  resolveColor,
  detectColorScheme,
  useSystemTheme,
  themes,
} from '../../src/core/theme.js';

describe('Theme System', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset to default theme
    setTheme(darkTheme);
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ===========================================================================
  // Built-in Themes
  // ===========================================================================

  describe('Built-in Themes', () => {
    it('should have dark theme with all colors', () => {
      expect(darkTheme.name).toBe('dark');
      // v3 themes use palette, foreground, background, accents, and borders
      expect(darkTheme.palette.primary).toBeDefined();
      expect(darkTheme.palette.secondary).toBeDefined();
      expect(darkTheme.background.base).toBeDefined();
      expect(darkTheme.foreground.primary).toBeDefined();
      expect(darkTheme.foreground.muted).toBeDefined();
      expect(darkTheme.background.surface).toBeDefined();
      expect(darkTheme.borders.default).toBeDefined();
      expect(darkTheme.accents.positive).toBeDefined();
      expect(darkTheme.accents.warning).toBeDefined();
      expect(darkTheme.accents.critical).toBeDefined();
      expect(darkTheme.accents.info).toBeDefined();
    });

    it('should have light theme', () => {
      expect(lightTheme.name).toBe('light');
      expect(lightTheme.background.base).toBe('#ffffff');
      expect(lightTheme.foreground.primary).toBeDefined();
    });

    it('should have high contrast dark theme', () => {
      expect(highContrastDarkTheme.name).toBe('high-contrast-dark');
      expect(highContrastDarkTheme.background.base).toBe('#000000');
      expect(highContrastDarkTheme.foreground.primary).toBe('#ffffff');
    });

    it('should have monochrome theme', () => {
      expect(monochromeTheme.name).toBe('monochrome');
      expect(monochromeTheme.borderRadius).toBe('none');
    });

    it('should have palette hierarchy', () => {
      // v3 themes use palette with color scales
      expect(darkTheme.palette.primary[500]).toBeDefined();
      expect(darkTheme.palette.secondary[500]).toBeDefined();
      expect(darkTheme.palette.success[500]).toBeDefined();
      expect(darkTheme.palette.warning[500]).toBeDefined();
      expect(darkTheme.palette.danger[500]).toBeDefined();
      expect(darkTheme.palette.neutral[500]).toBeDefined();
    });

    it('should export themes object', () => {
      expect(themes.dark).toBe(darkTheme);
      expect(themes.light).toBe(lightTheme);
      expect(themes.highContrastDark).toBe(highContrastDarkTheme);
      expect(themes.monochrome).toBe(monochromeTheme);
    });
  });

  // ===========================================================================
  // Theme Context
  // ===========================================================================

  describe('useTheme / getTheme / setTheme', () => {
    it('should return current theme with useTheme', () => {
      const theme = useTheme();
      expect(theme.name).toBe('dark');
    });

    it('should return current theme with getTheme', () => {
      const theme = getTheme();
      expect(theme.name).toBe('dark');
    });

    it('should set theme', () => {
      setTheme(lightTheme);
      expect(useTheme().name).toBe('light');
    });

    it('should switch between themes', () => {
      expect(useTheme().name).toBe('dark');

      setTheme(lightTheme);
      expect(useTheme().name).toBe('light');

      setTheme(monochromeTheme);
      expect(useTheme().name).toBe('monochrome');
    });
  });

  // ===========================================================================
  // Theme Stack
  // ===========================================================================

  describe('pushTheme / popTheme', () => {
    it('should push theme onto stack', () => {
      expect(useTheme().name).toBe('dark');

      pushTheme(lightTheme);
      expect(useTheme().name).toBe('light');
    });

    it('should pop theme from stack', () => {
      pushTheme(lightTheme);
      expect(useTheme().name).toBe('light');

      popTheme();
      expect(useTheme().name).toBe('dark');
    });

    it('should handle multiple pushes and pops', () => {
      pushTheme(lightTheme);
      pushTheme(monochromeTheme);
      expect(useTheme().name).toBe('monochrome');

      popTheme();
      expect(useTheme().name).toBe('light');

      popTheme();
      expect(useTheme().name).toBe('dark');
    });

    it('should do nothing when popping empty stack', () => {
      const initial = useTheme();
      popTheme();
      popTheme();
      popTheme();
      expect(useTheme()).toBe(initial);
    });
  });

  // ===========================================================================
  // Theme Utilities
  // ===========================================================================

  describe('createTheme', () => {
    it('should create theme by extending base', () => {
      const custom = createTheme(darkTheme, {
        name: 'custom',
      });

      expect(custom.name).toBe('custom');
      expect(custom.palette.primary[500]).toBe(darkTheme.palette.primary[500]);
      expect(custom.foreground.primary).toBe(darkTheme.foreground.primary);
    });

    it('should override palette colors (full replacement)', () => {
      // createTheme replaces the full palette, so you need to spread all colors
      const custom = createTheme(darkTheme, {
        palette: {
          ...darkTheme.palette,
          primary: {
            ...darkTheme.palette.primary,
            500: '#ff0000',
          },
        },
      });

      expect(custom.palette.primary[500]).toBe('#ff0000');
      expect(custom.palette.secondary[500]).toBe(darkTheme.palette.secondary[500]);
    });

    it('should override accents', () => {
      const custom = createTheme(darkTheme, {
        accents: {
          ...darkTheme.accents,
          critical: '#ff0000',
        },
      });

      expect(custom.accents.critical).toBe('#ff0000');
      expect(custom.accents.positive).toBe(darkTheme.accents.positive);
    });

    it('should override foreground', () => {
      const custom = createTheme(darkTheme, {
        foreground: {
          ...darkTheme.foreground,
          primary: '#ffffff',
        },
      });

      expect(custom.foreground.primary).toBe('#ffffff');
      expect(custom.foreground.muted).toBe(darkTheme.foreground.muted);
    });
  });

  // Note: themeColor and themeSpacing were deprecated in v3 - use getTheme() directly

  describe('getBorderRadiusChars', () => {
    it('should return square corners for none', () => {
      const chars = getBorderRadiusChars('none');
      expect(chars.tl).toBe('┌');
      expect(chars.tr).toBe('┐');
      expect(chars.bl).toBe('└');
      expect(chars.br).toBe('┘');
    });

    it('should return square corners for sm', () => {
      const chars = getBorderRadiusChars('sm');
      expect(chars.tl).toBe('┌');
    });

    it('should return rounded corners for md', () => {
      const chars = getBorderRadiusChars('md');
      expect(chars.tl).toBe('╭');
      expect(chars.tr).toBe('╮');
      expect(chars.bl).toBe('╰');
      expect(chars.br).toBe('╯');
    });

    it('should return rounded corners for lg', () => {
      const chars = getBorderRadiusChars('lg');
      expect(chars.tl).toBe('╭');
    });

    it('should handle invalid input with default', () => {
      // @ts-expect-error Testing invalid input
      const chars = getBorderRadiusChars('invalid');
      expect(chars.tl).toBe('╭'); // Default to rounded
    });
  });

  // ===========================================================================
  // Color Resolution
  // ===========================================================================

  describe('resolveColor', () => {
    it('should resolve primary color', () => {
      expect(resolveColor('primary')).toBe(darkTheme.palette.primary[500]);
    });

    it('should resolve secondary color', () => {
      expect(resolveColor('secondary')).toBe(darkTheme.palette.secondary[500]);
    });

    it('should resolve semantic colors', () => {
      expect(resolveColor('success')).toBe(darkTheme.accents.positive);
      expect(resolveColor('warning')).toBe(darkTheme.accents.warning);
      expect(resolveColor('error')).toBe(darkTheme.accents.critical);
      expect(resolveColor('info')).toBe(darkTheme.accents.info);
    });

    it('should resolve danger as error', () => {
      expect(resolveColor('danger')).toBe(darkTheme.accents.critical);
    });

    it('should resolve muted colors', () => {
      // 'muted' maps to the muted background color (for subtle areas like tabs)
      expect(resolveColor('muted')).toBe(darkTheme.background.subtle);
      // 'muted-foreground' and 'mutedForeground' map to the muted text color
      expect(resolveColor('muted-foreground')).toBe(darkTheme.foreground.muted);
      expect(resolveColor('mutedForeground')).toBe(darkTheme.foreground.muted);
    });

    it('should resolve Tailwind-style colors from colors.ts', () => {
      // Tailwind color-shade format resolves to colors from colors.ts
      // These are direct hex values, not from theme palette
      expect(resolveColor('blue-500')).toBe('#3b82f6');
      expect(resolveColor('red-500')).toBe('#ef4444');
      expect(resolveColor('green-500')).toBe('#22c55e');
      expect(resolveColor('gray-100')).toBe('#f3f4f6');
    });

    it('should pass through unknown colors', () => {
      expect(resolveColor('#ff0000')).toBe('#ff0000');
      expect(resolveColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
      expect(resolveColor('unknowncolor')).toBe('unknowncolor');
    });

    it('should reflect theme changes', () => {
      setTheme(lightTheme);
      expect(resolveColor('background')).toBe('#ffffff');
    });
  });

  // ===========================================================================
  // Theme Detection
  // ===========================================================================

  describe('detectColorScheme', () => {
    it('should default to dark', () => {
      delete process.env.COLORFGBG;
      delete process.env.TERM_PROGRAM;
      expect(detectColorScheme()).toBe('dark');
    });

    it('should detect light from COLORFGBG with bg=7', () => {
      process.env.COLORFGBG = '0;7';
      expect(detectColorScheme()).toBe('light');
    });

    it('should detect light from COLORFGBG with bg=15', () => {
      process.env.COLORFGBG = '0;15';
      expect(detectColorScheme()).toBe('light');
    });

    it('should detect dark from COLORFGBG with bg=0', () => {
      process.env.COLORFGBG = '7;0';
      expect(detectColorScheme()).toBe('dark');
    });

    it('should detect dark from COLORFGBG with bg=8', () => {
      process.env.COLORFGBG = '7;8';
      expect(detectColorScheme()).toBe('dark');
    });

    it('should detect light for Apple Terminal', () => {
      delete process.env.COLORFGBG;
      process.env.TERM_PROGRAM = 'Apple_Terminal';
      expect(detectColorScheme()).toBe('light');
    });
  });

  describe('useSystemTheme', () => {
    it('should set dark theme for dark scheme', () => {
      delete process.env.COLORFGBG;
      delete process.env.TERM_PROGRAM;
      useSystemTheme();
      expect(useTheme().name).toBe('dark');
    });

    it('should set light theme for light scheme', () => {
      process.env.COLORFGBG = '0;7';
      useSystemTheme();
      expect(useTheme().name).toBe('light');
    });
  });
});
