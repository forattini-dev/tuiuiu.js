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
  themeNames,
  getThemeByName,
  getNextTheme,
  getPreviousTheme,
  getContrastColor,
  getColor,
  getDarker,
  getLighter,
  th,
  useBg,
  useFg,
  usePalette,
  useAccents,
  useStates,
  useBorders,
  useOpacity,
  useThemeMode,
  useIsDark,
  useComponentTokens,
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

  // ===========================================================================
  // Theme Navigation
  // ===========================================================================

  describe('themeNames', () => {
    it('should contain all theme names', () => {
      expect(themeNames).toContain('dark');
      expect(themeNames).toContain('light');
      expect(themeNames).toContain('monokai');
      expect(themeNames).toContain('dracula');
      expect(themeNames).toContain('nord');
    });

    it('should have same length as themes object keys', () => {
      expect(themeNames.length).toBe(Object.keys(themes).length);
    });
  });

  describe('getThemeByName', () => {
    it('should return theme by name', () => {
      expect(getThemeByName('dark')).toBe(darkTheme);
      expect(getThemeByName('light')).toBe(lightTheme);
      expect(getThemeByName('monokai').name).toBe('monokai');
    });
  });

  describe('getNextTheme', () => {
    it('should return next theme in cycle', () => {
      const next = getNextTheme(darkTheme);
      // dark is first, so next should be second theme
      expect(next.name).toBe(themeNames[1]);
    });

    it('should wrap around to first theme', () => {
      const lastThemeName = themeNames[themeNames.length - 1]!;
      const lastTheme = themes[lastThemeName];
      const next = getNextTheme(lastTheme);
      expect(next.name).toBe('dark');
    });
  });

  describe('getPreviousTheme', () => {
    it('should return previous theme in cycle', () => {
      const secondTheme = themes[themeNames[1]!]!;
      const prev = getPreviousTheme(secondTheme);
      expect(prev.name).toBe('dark');
    });

    it('should wrap around to last theme', () => {
      const prev = getPreviousTheme(darkTheme);
      const lastThemeName = themeNames[themeNames.length - 1]!;
      expect(prev.name).toBe(lastThemeName);
    });
  });

  // ===========================================================================
  // Color Utilities
  // ===========================================================================

  describe('getContrastColor', () => {
    it('should return white for dark colors', () => {
      expect(getContrastColor('#000000')).toBe('white');
      expect(getContrastColor('#1a1a1a')).toBe('white');
      expect(getContrastColor('#3b82f6')).toBe('white'); // blue-500
    });

    it('should return black for light colors', () => {
      expect(getContrastColor('#ffffff')).toBe('black');
      expect(getContrastColor('#fbbf24')).toBe('black'); // amber-400
      expect(getContrastColor('#f0f0f0')).toBe('black');
    });

    it('should handle named colors', () => {
      expect(getContrastColor('black')).toBe('white');
      expect(getContrastColor('white')).toBe('black');
      expect(getContrastColor('yellow')).toBe('black');
      expect(getContrastColor('blue')).toBe('white');
    });

    it('should default to white for unknown colors', () => {
      expect(getContrastColor('unknown')).toBe('white');
    });

    it('should handle shorthand hex', () => {
      expect(getContrastColor('#fff')).toBe('black');
      expect(getContrastColor('#000')).toBe('white');
    });
  });

  describe('getColor', () => {
    it('should return color for name and shade', () => {
      expect(getColor('blue', 500)).toBe('#3b82f6');
      expect(getColor('red', 500)).toBe('#ef4444');
    });

    it('should use 500 as default shade', () => {
      expect(getColor('green')).toBe(getColor('green', 500));
    });

    it('should return input for unknown colors', () => {
      expect(getColor('unknown')).toBe('unknown');
    });

    it('should return string colors as-is', () => {
      expect(getColor('white')).toBe('#ffffff');
      expect(getColor('black')).toBe('#000000');
    });
  });

  describe('getDarker', () => {
    it('should return darker shade', () => {
      const base = getColor('blue', 500);
      const darker = getDarker('blue', 1);
      expect(darker).toBe(getColor('blue', 600));
      expect(darker).not.toBe(base);
    });

    it('should cap at 900', () => {
      const max = getDarker('blue', 10);
      expect(max).toBe(getColor('blue', 900));
    });
  });

  describe('getLighter', () => {
    it('should return lighter shade', () => {
      const base = getColor('blue', 500);
      const lighter = getLighter('blue', 1);
      expect(lighter).toBe(getColor('blue', 400));
      expect(lighter).not.toBe(base);
    });

    it('should cap at 50', () => {
      const min = getLighter('blue', 10);
      expect(min).toBe(getColor('blue', 50));
    });
  });

  // ===========================================================================
  // Shorthand Accessors
  // ===========================================================================

  describe('th', () => {
    it('should return current theme', () => {
      expect(th()).toBe(useTheme());
      expect(th().name).toBe('dark');
    });
  });

  describe('useBg', () => {
    it('should return background colors', () => {
      const bg = useBg();
      expect(bg.base).toBe(darkTheme.background.base);
      expect(bg.surface).toBe(darkTheme.background.surface);
    });
  });

  describe('useFg', () => {
    it('should return foreground colors', () => {
      const fg = useFg();
      expect(fg.primary).toBe(darkTheme.foreground.primary);
      expect(fg.muted).toBe(darkTheme.foreground.muted);
    });
  });

  describe('usePalette', () => {
    it('should return color palette', () => {
      const palette = usePalette();
      expect(palette.primary[500]).toBe(darkTheme.palette.primary[500]);
      expect(palette.secondary[500]).toBe(darkTheme.palette.secondary[500]);
    });
  });

  describe('useAccents', () => {
    it('should return accent colors', () => {
      const accents = useAccents();
      expect(accents.positive).toBe(darkTheme.accents.positive);
      expect(accents.warning).toBe(darkTheme.accents.warning);
      expect(accents.critical).toBe(darkTheme.accents.critical);
    });
  });

  describe('useStates', () => {
    it('should return state colors', () => {
      const states = useStates();
      expect(states.hover).toBeDefined();
      expect(states.active).toBeDefined();
      expect(states.focus).toBeDefined();
      expect(states.disabled).toBeDefined();
    });
  });

  describe('useBorders', () => {
    it('should return border colors', () => {
      const borders = useBorders();
      expect(borders.default).toBe(darkTheme.borders.default);
      expect(borders.subtle).toBeDefined();
    });
  });

  describe('useOpacity', () => {
    it('should return opacity values', () => {
      const opacity = useOpacity();
      expect(opacity.disabled).toBeDefined();
      expect(typeof opacity.disabled).toBe('number');
    });
  });

  // ===========================================================================
  // Mode Helpers
  // ===========================================================================

  describe('useThemeMode', () => {
    it('should return dark for dark themes', () => {
      setTheme(darkTheme);
      expect(useThemeMode()).toBe('dark');
    });

    it('should return light for light themes', () => {
      setTheme(lightTheme);
      expect(useThemeMode()).toBe('light');
    });
  });

  describe('useIsDark', () => {
    it('should return true for dark themes', () => {
      setTheme(darkTheme);
      expect(useIsDark()).toBe(true);
    });

    it('should return false for light themes', () => {
      setTheme(lightTheme);
      expect(useIsDark()).toBe(false);
    });
  });

  describe('useComponentTokens', () => {
    it('should return button tokens', () => {
      const buttonTokens = useComponentTokens('button');
      expect(buttonTokens.primary).toBeDefined();
      expect(buttonTokens.primary.bg).toBeDefined();
    });

    it('should return input tokens', () => {
      const inputTokens = useComponentTokens('input');
      expect(inputTokens.bg).toBeDefined();
      expect(inputTokens.border).toBeDefined();
    });

    it('should return modal tokens', () => {
      const modalTokens = useComponentTokens('modal');
      expect(modalTokens.bg).toBeDefined();
      expect(modalTokens.overlay).toBeDefined();
    });
  });

  // ===========================================================================
  // Additional resolveColor Tests
  // ===========================================================================

  describe('resolveColor extended', () => {
    it('should resolve foreground variants', () => {
      expect(resolveColor('foreground')).toBe(darkTheme.foreground.primary);
      expect(resolveColor('foreground-primary')).toBe(darkTheme.foreground.primary);
      expect(resolveColor('foreground-muted')).toBe(darkTheme.foreground.muted);
    });

    it('should resolve background variants', () => {
      expect(resolveColor('background-base')).toBe(darkTheme.background.base);
      expect(resolveColor('background-surface')).toBe(darkTheme.background.surface);
      expect(resolveColor('surface')).toBe(darkTheme.background.surface);
    });

    it('should resolve auto-contrast foreground colors', () => {
      const primaryFg = resolveColor('primaryForeground');
      expect(['white', 'black']).toContain(primaryFg);
    });

    it('should resolve border colors', () => {
      expect(resolveColor('border')).toBe(darkTheme.borders.default);
      expect(resolveColor('border-subtle')).toBe(darkTheme.borders.subtle);
    });

    it('should resolve palette shades', () => {
      expect(resolveColor('primary-500')).toBe(darkTheme.palette.primary[500]);
      expect(resolveColor('neutral-700')).toBe(darkTheme.palette.neutral[700]);
    });
  });

});
