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
  themeColor,
  themeSpacing,
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
      expect(darkTheme.colors.primary).toBeDefined();
      expect(darkTheme.colors.secondary).toBeDefined();
      expect(darkTheme.colors.background).toBeDefined();
      expect(darkTheme.colors.surface).toBeDefined();
      expect(darkTheme.colors.text).toBeDefined();
      expect(darkTheme.colors.textMuted).toBeDefined();
      expect(darkTheme.colors.border).toBeDefined();
      expect(darkTheme.colors.success).toBeDefined();
      expect(darkTheme.colors.warning).toBeDefined();
      expect(darkTheme.colors.error).toBeDefined();
      expect(darkTheme.colors.info).toBeDefined();
    });

    it('should have light theme', () => {
      expect(lightTheme.name).toBe('light');
      expect(lightTheme.colors.background).toBe('#ffffff');
      expect(lightTheme.colors.text).toBe('#0f172a');
    });

    it('should have high contrast dark theme', () => {
      expect(highContrastDarkTheme.name).toBe('high-contrast-dark');
      expect(highContrastDarkTheme.colors.background).toBe('#000000');
      expect(highContrastDarkTheme.colors.text).toBe('#ffffff');
      expect(highContrastDarkTheme.borderRadius).toBe('sm');
    });

    it('should have monochrome theme', () => {
      expect(monochromeTheme.name).toBe('monochrome');
      expect(monochromeTheme.borderRadius).toBe('none');
    });

    it('should have spacing scale', () => {
      expect(darkTheme.spacing.xs).toBe(1);
      expect(darkTheme.spacing.sm).toBe(2);
      expect(darkTheme.spacing.md).toBe(4);
      expect(darkTheme.spacing.lg).toBe(8);
      expect(darkTheme.spacing.xl).toBe(16);
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
      expect(custom.colors.primary).toBe(darkTheme.colors.primary);
      expect(custom.spacing.md).toBe(darkTheme.spacing.md);
    });

    it('should override colors', () => {
      const custom = createTheme(darkTheme, {
        colors: {
          primary: '#ff0000',
        },
      });

      expect(custom.colors.primary).toBe('#ff0000');
      expect(custom.colors.secondary).toBe(darkTheme.colors.secondary);
    });

    it('should override spacing', () => {
      const custom = createTheme(darkTheme, {
        spacing: {
          md: 8,
        },
      });

      expect(custom.spacing.md).toBe(8);
      expect(custom.spacing.sm).toBe(darkTheme.spacing.sm);
    });

    it('should override border radius', () => {
      const custom = createTheme(darkTheme, {
        borderRadius: 'lg',
      });

      expect(custom.borderRadius).toBe('lg');
    });
  });

  describe('themeColor', () => {
    it('should get color from current theme', () => {
      expect(themeColor('primary')).toBe(darkTheme.colors.primary);
      expect(themeColor('error')).toBe(darkTheme.colors.error);
    });

    it('should reflect theme changes', () => {
      setTheme(lightTheme);
      expect(themeColor('background')).toBe('#ffffff');
    });
  });

  describe('themeSpacing', () => {
    it('should get spacing from current theme', () => {
      expect(themeSpacing('xs')).toBe(1);
      expect(themeSpacing('md')).toBe(4);
      expect(themeSpacing('xl')).toBe(16);
    });
  });

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
      expect(resolveColor('primary')).toBe(darkTheme.colors.primary);
    });

    it('should resolve secondary color', () => {
      expect(resolveColor('secondary')).toBe(darkTheme.colors.secondary);
    });

    it('should resolve semantic colors', () => {
      expect(resolveColor('success')).toBe(darkTheme.colors.success);
      expect(resolveColor('warning')).toBe(darkTheme.colors.warning);
      expect(resolveColor('error')).toBe(darkTheme.colors.error);
      expect(resolveColor('info')).toBe(darkTheme.colors.info);
    });

    it('should resolve danger as error', () => {
      expect(resolveColor('danger')).toBe(darkTheme.colors.error);
    });

    it('should resolve muted as textMuted', () => {
      expect(resolveColor('muted')).toBe(darkTheme.colors.textMuted);
      expect(resolveColor('text-muted')).toBe(darkTheme.colors.textMuted);
    });

    it('should pass through unknown colors', () => {
      expect(resolveColor('#ff0000')).toBe('#ff0000');
      expect(resolveColor('cyan')).toBe('cyan');
      expect(resolveColor('rgb(255, 0, 0)')).toBe('rgb(255, 0, 0)');
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
