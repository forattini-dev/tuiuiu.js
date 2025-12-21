/**
 * Theme System - Context-based theming for Tuiuiu
 *
 * Provides dark/light themes with customizable colors, spacing, and styles.
 * Uses signals for reactive theme switching.
 *
 * Color system includes:
 * - Complete color palette (22 colors × 11 shades)
 * - Semantic colors with foreground variants
 * - Auto-theming support for components
 */

import { createSignal, untrack } from '../primitives/signal.js';
import { colors, type ColorPalette, type ColorShade } from './colors.js';

// =============================================================================
// Types
// =============================================================================

export interface ThemeColors {
  // ---------------------------------------------------------------------------
  // Base Colors
  // ---------------------------------------------------------------------------

  /** Main background color */
  background: string;
  /** Main foreground/text color */
  foreground: string;

  // ---------------------------------------------------------------------------
  // Component Colors
  // ---------------------------------------------------------------------------

  /** Card background color */
  card: string;
  /** Card text color */
  cardForeground: string;

  /** Popover/dropdown background color */
  popover: string;
  /** Popover text color */
  popoverForeground: string;

  // ---------------------------------------------------------------------------
  // Semantic Colors
  // ---------------------------------------------------------------------------

  /** Primary brand color */
  primary: string;
  /** Primary text/icon color (on primary background) */
  primaryForeground: string;

  /** Secondary accent color */
  secondary: string;
  /** Secondary text/icon color */
  secondaryForeground: string;

  /** Muted/subdued background color */
  muted: string;
  /** Muted text color */
  mutedForeground: string;

  /** Accent color for highlights */
  accent: string;
  /** Accent text color */
  accentForeground: string;

  /** Destructive/danger color */
  destructive: string;
  /** Destructive text color */
  destructiveForeground: string;

  // ---------------------------------------------------------------------------
  // UI Colors
  // ---------------------------------------------------------------------------

  /** Border color */
  border: string;
  /** Input border/background color */
  input: string;
  /** Focus ring color */
  ring: string;

  // ---------------------------------------------------------------------------
  // Status Colors
  // ---------------------------------------------------------------------------

  /** Success state color */
  success: string;
  /** Success text color */
  successForeground: string;

  /** Warning state color */
  warning: string;
  /** Warning text color */
  warningForeground: string;

  /** Error state color */
  error: string;
  /** Error text color */
  errorForeground: string;

  /** Info state color */
  info: string;
  /** Info text color */
  infoForeground: string;
}

export interface ThemeSpacing {
  /** Extra small spacing (1 char) */
  xs: number;
  /** Small spacing (2 chars) */
  sm: number;
  /** Medium spacing (4 chars) */
  md: number;
  /** Large spacing (8 chars) */
  lg: number;
  /** Extra large spacing (16 chars) */
  xl: number;
}

export type BorderRadius = 'none' | 'sm' | 'md' | 'lg';

export interface Theme {
  /** Theme name identifier */
  name: string;
  /** Color palette */
  colors: ThemeColors;
  /** Spacing scale */
  spacing: ThemeSpacing;
  /** Default border radius style */
  borderRadius: BorderRadius;
}

// =============================================================================
// Built-in Themes
// =============================================================================

/**
 * Dark theme - Default theme with dark background
 */
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    // Base
    background: colors.slate[950],
    foreground: colors.slate[50],

    // Components
    card: colors.slate[900],
    cardForeground: colors.slate[50],
    popover: colors.slate[900],
    popoverForeground: colors.slate[50],

    // Semantic
    primary: colors.blue[500],
    primaryForeground: '#ffffff',
    secondary: colors.slate[800],
    secondaryForeground: colors.slate[50],
    muted: colors.slate[800],
    mutedForeground: colors.slate[400],
    accent: colors.slate[800],
    accentForeground: colors.slate[50],
    destructive: colors.red[500],
    destructiveForeground: colors.slate[50],

    // UI
    border: colors.slate[700],
    input: colors.slate[700],
    ring: colors.blue[500],

    // Status
    success: colors.green[500],
    successForeground: '#ffffff',
    warning: colors.amber[500],
    warningForeground: colors.slate[900],
    error: colors.red[500],
    errorForeground: '#ffffff',
    info: colors.cyan[500],
    infoForeground: '#ffffff',
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  borderRadius: 'md',
};

/**
 * Light theme - Light background variant
 */
export const lightTheme: Theme = {
  name: 'light',
  colors: {
    // Base
    background: '#ffffff',
    foreground: colors.slate[950],

    // Components
    card: '#ffffff',
    cardForeground: colors.slate[950],
    popover: '#ffffff',
    popoverForeground: colors.slate[950],

    // Semantic
    primary: colors.blue[600],
    primaryForeground: '#ffffff',
    secondary: colors.slate[100],
    secondaryForeground: colors.slate[900],
    muted: colors.slate[100],
    mutedForeground: colors.slate[500],
    accent: colors.slate[100],
    accentForeground: colors.slate[900],
    destructive: colors.red[600],
    destructiveForeground: '#ffffff',

    // UI
    border: colors.slate[200],
    input: colors.slate[200],
    ring: colors.blue[600],

    // Status
    success: colors.green[600],
    successForeground: '#ffffff',
    warning: colors.amber[600],
    warningForeground: colors.slate[900],
    error: colors.red[600],
    errorForeground: '#ffffff',
    info: colors.cyan[600],
    infoForeground: '#ffffff',
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  borderRadius: 'md',
};

/**
 * High contrast dark theme - For accessibility
 */
export const highContrastDarkTheme: Theme = {
  name: 'high-contrast-dark',
  colors: {
    // Base
    background: '#000000',
    foreground: '#ffffff',

    // Components
    card: colors.neutral[950],
    cardForeground: '#ffffff',
    popover: colors.neutral[950],
    popoverForeground: '#ffffff',

    // Semantic
    primary: colors.blue[400],
    primaryForeground: '#000000',
    secondary: colors.neutral[800],
    secondaryForeground: '#ffffff',
    muted: colors.neutral[800],
    mutedForeground: colors.neutral[300],
    accent: colors.neutral[800],
    accentForeground: '#ffffff',
    destructive: colors.red[400],
    destructiveForeground: '#000000',

    // UI
    border: colors.neutral[500],
    input: colors.neutral[600],
    ring: colors.blue[400],

    // Status
    success: colors.green[400],
    successForeground: '#000000',
    warning: colors.amber[400],
    warningForeground: '#000000',
    error: colors.red[400],
    errorForeground: '#000000',
    info: colors.cyan[400],
    infoForeground: '#000000',
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  borderRadius: 'sm',
};

/**
 * Monochrome theme - Grayscale only
 */
export const monochromeTheme: Theme = {
  name: 'monochrome',
  colors: {
    // Base
    background: colors.neutral[900],
    foreground: colors.neutral[50],

    // Components
    card: colors.neutral[800],
    cardForeground: colors.neutral[50],
    popover: colors.neutral[800],
    popoverForeground: colors.neutral[50],

    // Semantic
    primary: colors.neutral[300],
    primaryForeground: colors.neutral[900],
    secondary: colors.neutral[700],
    secondaryForeground: colors.neutral[50],
    muted: colors.neutral[800],
    mutedForeground: colors.neutral[400],
    accent: colors.neutral[700],
    accentForeground: colors.neutral[50],
    destructive: colors.neutral[200],
    destructiveForeground: colors.neutral[900],

    // UI
    border: colors.neutral[600],
    input: colors.neutral[700],
    ring: colors.neutral[400],

    // Status
    success: colors.neutral[300],
    successForeground: colors.neutral[900],
    warning: colors.neutral[400],
    warningForeground: colors.neutral[900],
    error: colors.neutral[200],
    errorForeground: colors.neutral[900],
    info: colors.neutral[300],
    infoForeground: colors.neutral[900],
  },
  spacing: {
    xs: 1,
    sm: 2,
    md: 4,
    lg: 8,
    xl: 16,
  },
  borderRadius: 'none',
};

// =============================================================================
// Theme Context (Signal-based)
// =============================================================================

// Global theme signal
const [currentTheme, setCurrentTheme] = createSignal<Theme>(darkTheme);

// Theme stack for nested themes
const themeStack: Theme[] = [];

/**
 * Get the current theme
 */
export function useTheme(): Theme {
  return currentTheme();
}

/**
 * Get the current theme without tracking (for use outside effects)
 */
export function getTheme(): Theme {
  return untrack(currentTheme);
}

/**
 * Set the global theme
 */
export function setTheme(theme: Theme): void {
  setCurrentTheme(theme);
}

/**
 * Push a theme onto the stack (for nested themes)
 */
export function pushTheme(theme: Theme): void {
  themeStack.push(untrack(currentTheme));
  setCurrentTheme(theme);
}

/**
 * Pop a theme from the stack
 */
export function popTheme(): void {
  const previous = themeStack.pop();
  if (previous) {
    setCurrentTheme(previous);
  }
}

// =============================================================================
// Theme Utilities
// =============================================================================

/**
 * Create a custom theme by extending an existing theme
 */
export function createTheme(base: Theme, overrides: Partial<Theme>): Theme {
  return {
    ...base,
    ...overrides,
    colors: {
      ...base.colors,
      ...overrides.colors,
    },
    spacing: {
      ...base.spacing,
      ...overrides.spacing,
    },
  };
}

/**
 * Get a color from the current theme
 */
export function themeColor(key: keyof ThemeColors): string {
  return currentTheme().colors[key];
}

/**
 * Get a spacing value from the current theme
 */
export function themeSpacing(key: keyof ThemeSpacing): number {
  return currentTheme().spacing[key];
}

/**
 * Map border radius to actual characters
 */
export function getBorderRadiusChars(radius: BorderRadius): {
  tl: string;
  tr: string;
  bl: string;
  br: string;
} {
  switch (radius) {
    case 'none':
    case 'sm':
      return { tl: '┌', tr: '┐', bl: '└', br: '┘' };
    case 'md':
    case 'lg':
      return { tl: '╭', tr: '╮', bl: '╰', br: '╯' };
    default:
      return { tl: '╭', tr: '╮', bl: '╰', br: '╯' };
  }
}

// =============================================================================
// Color Resolution
// =============================================================================

/**
 * Resolve a color string to a hex value.
 *
 * Supports multiple formats:
 * - Semantic names: 'primary', 'secondary', 'destructive', etc.
 * - Tailwind format: 'blue-500', 'gray-100', 'red-600'
 * - Color name only: 'blue', 'red' (uses shade 500)
 * - Hex values: '#3b82f6', '#fff'
 * - RGB values: 'rgb(59, 130, 246)'
 *
 * @example
 * resolveColor('primary')      // Theme's primary color
 * resolveColor('blue-500')     // '#3b82f6'
 * resolveColor('blue')         // '#3b82f6' (shade 500)
 * resolveColor('#ff0000')      // '#ff0000' (passed through)
 */
export function resolveColor(colorInput: string): string {
  const theme = untrack(currentTheme);

  // 1. Semantic color names from theme
  const semanticMap: Record<string, string> = {
    // Base
    'background': theme.colors.background,
    'foreground': theme.colors.foreground,

    // Components
    'card': theme.colors.card,
    'card-foreground': theme.colors.cardForeground,
    'cardForeground': theme.colors.cardForeground,
    'popover': theme.colors.popover,
    'popover-foreground': theme.colors.popoverForeground,
    'popoverForeground': theme.colors.popoverForeground,

    // Semantic
    'primary': theme.colors.primary,
    'primary-foreground': theme.colors.primaryForeground,
    'primaryForeground': theme.colors.primaryForeground,
    'secondary': theme.colors.secondary,
    'secondary-foreground': theme.colors.secondaryForeground,
    'secondaryForeground': theme.colors.secondaryForeground,
    'muted': theme.colors.muted,
    'muted-foreground': theme.colors.mutedForeground,
    'mutedForeground': theme.colors.mutedForeground,
    'accent': theme.colors.accent,
    'accent-foreground': theme.colors.accentForeground,
    'accentForeground': theme.colors.accentForeground,
    'destructive': theme.colors.destructive,
    'destructive-foreground': theme.colors.destructiveForeground,
    'destructiveForeground': theme.colors.destructiveForeground,

    // UI
    'border': theme.colors.border,
    'input': theme.colors.input,
    'ring': theme.colors.ring,

    // Status
    'success': theme.colors.success,
    'success-foreground': theme.colors.successForeground,
    'successForeground': theme.colors.successForeground,
    'warning': theme.colors.warning,
    'warning-foreground': theme.colors.warningForeground,
    'warningForeground': theme.colors.warningForeground,
    'error': theme.colors.error,
    'error-foreground': theme.colors.errorForeground,
    'errorForeground': theme.colors.errorForeground,
    'danger': theme.colors.error,
    'danger-foreground': theme.colors.errorForeground,
    'info': theme.colors.info,
    'info-foreground': theme.colors.infoForeground,
    'infoForeground': theme.colors.infoForeground,
  };

  if (colorInput in semanticMap) {
    return semanticMap[colorInput];
  }

  // 2. Tailwind format: "color-shade" (e.g., "blue-500", "gray-100")
  const tailwindMatch = colorInput.match(/^([a-z]+)-(\d+)$/);
  if (tailwindMatch) {
    const [, name, shadeStr] = tailwindMatch;
    const shade = parseInt(shadeStr, 10) as ColorShade;
    const palette = colors[name as keyof typeof colors];

    if (palette && typeof palette === 'object' && shade in palette) {
      return (palette as ColorPalette)[shade];
    }
  }

  // 3. Color name only (uses shade 500)
  if (colorInput in colors) {
    const palette = colors[colorInput as keyof typeof colors];
    if (typeof palette === 'object') {
      return (palette as ColorPalette)[500];
    }
    // Base colors (white, black, transparent)
    if (typeof palette === 'string') {
      return palette;
    }
  }

  // 4. Return as-is (hex, rgb, named CSS color, etc.)
  return colorInput;
}

// =============================================================================
// Theme Detection
// =============================================================================

/**
 * Detect system color scheme preference
 * Note: In terminal context, this checks COLORFGBG or similar env vars
 */
export function detectColorScheme(): 'dark' | 'light' {
  // Check COLORFGBG environment variable (format: "fg;bg")
  const colorFgBg = process.env.COLORFGBG;
  if (colorFgBg) {
    const parts = colorFgBg.split(';');
    const bg = parseInt(parts[parts.length - 1] || '0', 10);
    // Background colors 0-6 and 8 are typically dark
    // Background colors 7 and 9-15 are typically light
    if (bg === 7 || (bg >= 9 && bg <= 15)) {
      return 'light';
    }
    return 'dark';
  }

  // Check for light terminal indicators
  const term = process.env.TERM || '';
  const termProgram = process.env.TERM_PROGRAM || '';

  // Some terminal programs default to light
  if (termProgram.toLowerCase().includes('apple_terminal')) {
    return 'light';
  }

  // Default to dark (most modern terminals)
  return 'dark';
}

/**
 * Auto-select theme based on system preference
 */
export function useSystemTheme(): void {
  const scheme = detectColorScheme();
  setTheme(scheme === 'light' ? lightTheme : darkTheme);
}

// =============================================================================
// Exports
// =============================================================================

export const themes = {
  dark: darkTheme,
  light: lightTheme,
  highContrastDark: highContrastDarkTheme,
  monochrome: monochromeTheme,
};

// =============================================================================
// Tailwind-style Helpers
// =============================================================================

/**
 * Tailwind-style color utilities.
 *
 * @example
 * tw.color('blue', 500)       // '#3b82f6'
 * tw.color('gray', 100)       // '#f3f4f6'
 * tw.theme('primary')         // Current theme's primary color
 * tw.darker('blue', 2)        // blue-700 (500 + 2*100)
 * tw.lighter('blue', 2)       // blue-300 (500 - 2*100)
 */
export const tw = {
  /**
   * Get a Tailwind color by name and shade
   */
  color: (name: string, shade: ColorShade = 500): string => {
    const palette = colors[name as keyof typeof colors];
    if (!palette) return name;
    if (typeof palette === 'string') return palette;
    return (palette as ColorPalette)[shade] ?? (palette as ColorPalette)[500];
  },

  /**
   * Get a color from the current theme
   */
  theme: (key: keyof ThemeColors): string => {
    return untrack(currentTheme).colors[key];
  },

  /**
   * Get a darker shade of a color (moves towards 950)
   * @param name Color name
   * @param steps Number of shade steps to darken (1 = +100)
   */
  darker: (name: string, steps: number = 1): string => {
    const shade = Math.min(500 + steps * 100, 950) as ColorShade;
    return resolveColor(`${name}-${shade}`);
  },

  /**
   * Get a lighter shade of a color (moves towards 50)
   * @param name Color name
   * @param steps Number of shade steps to lighten (1 = -100)
   */
  lighter: (name: string, steps: number = 1): string => {
    const shade = Math.max(500 - steps * 100, 50) as ColorShade;
    return resolveColor(`${name}-${shade}`);
  },

  /**
   * Get a shade relative to a base shade
   * @param name Color name
   * @param baseShade Starting shade
   * @param offset Offset from base (+100, -200, etc.)
   */
  shade: (name: string, baseShade: ColorShade, offset: number): string => {
    const newShade = Math.max(50, Math.min(950, baseShade + offset)) as ColorShade;
    return resolveColor(`${name}-${newShade}`);
  },
};
