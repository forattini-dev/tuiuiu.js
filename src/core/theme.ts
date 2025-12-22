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

/**
 * Monokai theme - Classic code editor theme
 */
export const monokaiTheme: Theme = {
  name: 'monokai',
  colors: {
    background: '#272822',
    foreground: '#F8F8F2',
    card: '#3E3D32',
    cardForeground: '#F8F8F2',
    popover: '#3E3D32',
    popoverForeground: '#F8F8F2',
    primary: '#A6E22E',
    primaryForeground: '#272822',
    secondary: '#49483E',
    secondaryForeground: '#F8F8F2',
    muted: '#49483E',
    mutedForeground: '#75715E',
    accent: '#66D9EF',
    accentForeground: '#272822',
    destructive: '#F92672',
    destructiveForeground: '#F8F8F2',
    border: '#49483E',
    input: '#3E3D32',
    ring: '#A6E22E',
    success: '#A6E22E',
    successForeground: '#272822',
    warning: '#E6DB74',
    warningForeground: '#272822',
    error: '#F92672',
    errorForeground: '#F8F8F2',
    info: '#66D9EF',
    infoForeground: '#272822',
  },
  spacing: { xs: 1, sm: 2, md: 4, lg: 8, xl: 16 },
  borderRadius: 'md',
};

/**
 * Dracula theme - Popular dark theme
 */
export const draculaTheme: Theme = {
  name: 'dracula',
  colors: {
    background: '#282A36',
    foreground: '#F8F8F2',
    card: '#44475A',
    cardForeground: '#F8F8F2',
    popover: '#44475A',
    popoverForeground: '#F8F8F2',
    primary: '#BD93F9',
    primaryForeground: '#282A36',
    secondary: '#44475A',
    secondaryForeground: '#F8F8F2',
    muted: '#44475A',
    mutedForeground: '#6272A4',
    accent: '#8BE9FD',
    accentForeground: '#282A36',
    destructive: '#FF5555',
    destructiveForeground: '#F8F8F2',
    border: '#6272A4',
    input: '#44475A',
    ring: '#BD93F9',
    success: '#50FA7B',
    successForeground: '#282A36',
    warning: '#F1FA8C',
    warningForeground: '#282A36',
    error: '#FF5555',
    errorForeground: '#F8F8F2',
    info: '#8BE9FD',
    infoForeground: '#282A36',
  },
  spacing: { xs: 1, sm: 2, md: 4, lg: 8, xl: 16 },
  borderRadius: 'md',
};

/**
 * Nord theme - Arctic, bluish theme
 */
export const nordTheme: Theme = {
  name: 'nord',
  colors: {
    background: '#2E3440',
    foreground: '#ECEFF4',
    card: '#3B4252',
    cardForeground: '#ECEFF4',
    popover: '#3B4252',
    popoverForeground: '#ECEFF4',
    primary: '#88C0D0',
    primaryForeground: '#2E3440',
    secondary: '#434C5E',
    secondaryForeground: '#ECEFF4',
    muted: '#4C566A',
    mutedForeground: '#D8DEE9',
    accent: '#81A1C1',
    accentForeground: '#2E3440',
    destructive: '#BF616A',
    destructiveForeground: '#ECEFF4',
    border: '#4C566A',
    input: '#3B4252',
    ring: '#88C0D0',
    success: '#A3BE8C',
    successForeground: '#2E3440',
    warning: '#EBCB8B',
    warningForeground: '#2E3440',
    error: '#BF616A',
    errorForeground: '#ECEFF4',
    info: '#81A1C1',
    infoForeground: '#2E3440',
  },
  spacing: { xs: 1, sm: 2, md: 4, lg: 8, xl: 16 },
  borderRadius: 'md',
};

/**
 * Solarized Dark theme
 */
export const solarizedDarkTheme: Theme = {
  name: 'solarized-dark',
  colors: {
    background: '#002B36',
    foreground: '#839496',
    card: '#073642',
    cardForeground: '#839496',
    popover: '#073642',
    popoverForeground: '#839496',
    primary: '#268BD2',
    primaryForeground: '#FDF6E3',
    secondary: '#073642',
    secondaryForeground: '#839496',
    muted: '#073642',
    mutedForeground: '#657B83',
    accent: '#2AA198',
    accentForeground: '#FDF6E3',
    destructive: '#DC322F',
    destructiveForeground: '#FDF6E3',
    border: '#586E75',
    input: '#073642',
    ring: '#268BD2',
    success: '#859900',
    successForeground: '#FDF6E3',
    warning: '#B58900',
    warningForeground: '#FDF6E3',
    error: '#DC322F',
    errorForeground: '#FDF6E3',
    info: '#2AA198',
    infoForeground: '#FDF6E3',
  },
  spacing: { xs: 1, sm: 2, md: 4, lg: 8, xl: 16 },
  borderRadius: 'md',
};

/**
 * Gruvbox Dark theme - Warm retro theme
 */
export const gruvboxTheme: Theme = {
  name: 'gruvbox',
  colors: {
    background: '#282828',
    foreground: '#EBDBB2',
    card: '#3C3836',
    cardForeground: '#EBDBB2',
    popover: '#3C3836',
    popoverForeground: '#EBDBB2',
    primary: '#B8BB26',
    primaryForeground: '#282828',
    secondary: '#504945',
    secondaryForeground: '#EBDBB2',
    muted: '#504945',
    mutedForeground: '#928374',
    accent: '#83A598',
    accentForeground: '#282828',
    destructive: '#FB4934',
    destructiveForeground: '#EBDBB2',
    border: '#665C54',
    input: '#3C3836',
    ring: '#B8BB26',
    success: '#B8BB26',
    successForeground: '#282828',
    warning: '#FABD2F',
    warningForeground: '#282828',
    error: '#FB4934',
    errorForeground: '#EBDBB2',
    info: '#83A598',
    infoForeground: '#282828',
  },
  spacing: { xs: 1, sm: 2, md: 4, lg: 8, xl: 16 },
  borderRadius: 'md',
};

/**
 * Tokyo Night theme - Modern VSCode theme
 */
export const tokyoNightTheme: Theme = {
  name: 'tokyo-night',
  colors: {
    background: '#1A1B26',
    foreground: '#A9B1D6',
    card: '#24283B',
    cardForeground: '#A9B1D6',
    popover: '#24283B',
    popoverForeground: '#A9B1D6',
    primary: '#7AA2F7',
    primaryForeground: '#1A1B26',
    secondary: '#414868',
    secondaryForeground: '#A9B1D6',
    muted: '#414868',
    mutedForeground: '#565F89',
    accent: '#BB9AF7',
    accentForeground: '#1A1B26',
    destructive: '#F7768E',
    destructiveForeground: '#A9B1D6',
    border: '#414868',
    input: '#24283B',
    ring: '#7AA2F7',
    success: '#9ECE6A',
    successForeground: '#1A1B26',
    warning: '#E0AF68',
    warningForeground: '#1A1B26',
    error: '#F7768E',
    errorForeground: '#A9B1D6',
    info: '#7DCFFF',
    infoForeground: '#1A1B26',
  },
  spacing: { xs: 1, sm: 2, md: 4, lg: 8, xl: 16 },
  borderRadius: 'md',
};

/**
 * Catppuccin Mocha theme - Soothing pastel theme
 */
export const catppuccinTheme: Theme = {
  name: 'catppuccin',
  colors: {
    background: '#1E1E2E',
    foreground: '#CDD6F4',
    card: '#313244',
    cardForeground: '#CDD6F4',
    popover: '#313244',
    popoverForeground: '#CDD6F4',
    primary: '#CBA6F7',
    primaryForeground: '#1E1E2E',
    secondary: '#45475A',
    secondaryForeground: '#CDD6F4',
    muted: '#45475A',
    mutedForeground: '#6C7086',
    accent: '#89DCEB',
    accentForeground: '#1E1E2E',
    destructive: '#F38BA8',
    destructiveForeground: '#CDD6F4',
    border: '#6C7086',
    input: '#313244',
    ring: '#CBA6F7',
    success: '#A6E3A1',
    successForeground: '#1E1E2E',
    warning: '#F9E2AF',
    warningForeground: '#1E1E2E',
    error: '#F38BA8',
    errorForeground: '#CDD6F4',
    info: '#89DCEB',
    infoForeground: '#1E1E2E',
  },
  spacing: { xs: 1, sm: 2, md: 4, lg: 8, xl: 16 },
  borderRadius: 'lg',
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
 * Semantic color keys that have foreground variants
 */
export type SemanticColorKey =
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'accent'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'card'
  | 'popover';

/**
 * Get a color pair (background + foreground) for semantic colors.
 * Use this for buttons, badges, navbars, and any filled components.
 *
 * @example
 * const { bg, fg } = themeColorPair('primary');
 * Box({ backgroundColor: bg },
 *   Text({ color: fg }, 'Button')
 * )
 *
 * @example
 * // Destructuring in component
 * const colors = themeColorPair('success');
 * Badge({ backgroundColor: colors.bg, color: colors.fg }, 'OK')
 */
export function themeColorPair(key: SemanticColorKey): { bg: string; fg: string } {
  const theme = currentTheme();
  const fgKey = `${key}Foreground` as keyof ThemeColors;
  return {
    bg: theme.colors[key],
    fg: theme.colors[fgKey],
  };
}

/**
 * Get a spacing value from the current theme
 */
export function themeSpacing(key: keyof ThemeSpacing): number {
  return currentTheme().spacing[key];
}

/**
 * Calculate relative luminance of a color (WCAG formula).
 * Returns value between 0 (black) and 1 (white).
 */
function getLuminance(hex: string): number {
  // Normalize hex
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color[0]! + color[0] + color[1]! + color[1] + color[2]! + color[2];
  }

  const r = parseInt(color.slice(0, 2), 16) / 255;
  const g = parseInt(color.slice(2, 4), 16) / 255;
  const b = parseInt(color.slice(4, 6), 16) / 255;

  // sRGB to linear
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Get the best contrasting text color (white or black) for a given background.
 * Uses WCAG luminance formula for accessibility.
 *
 * @example
 * getContrastColor('#3b82f6')  // 'white' (blue is dark)
 * getContrastColor('#fbbf24')  // 'black' (amber is light)
 * getContrastColor('cyan')     // 'black' (cyan is light)
 *
 * @example
 * // With custom component
 * const bg = '#ff6b6b';
 * Box({ backgroundColor: bg },
 *   Text({ color: getContrastColor(bg) }, 'Hello')
 * )
 */
export function getContrastColor(color: string): 'white' | 'black' {
  // Resolve color if it's a theme/tailwind reference
  const resolved = resolveColor(color);

  // Handle named colors (basic ANSI)
  const namedColorLuminance: Record<string, number> = {
    black: 0,
    red: 0.2,
    green: 0.35,
    yellow: 0.9,
    blue: 0.15,
    magenta: 0.25,
    cyan: 0.6,
    white: 1,
    gray: 0.5,
    grey: 0.5,
  };

  if (resolved in namedColorLuminance) {
    return namedColorLuminance[resolved]! > 0.5 ? 'black' : 'white';
  }

  // For hex colors, calculate luminance
  if (resolved.startsWith('#')) {
    const luminance = getLuminance(resolved);
    // WCAG recommends 0.179 as threshold, we use 0.5 for terminal readability
    return luminance > 0.4 ? 'black' : 'white';
  }

  // Default to white for unknown colors (assume dark)
  return 'white';
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
  monokai: monokaiTheme,
  dracula: draculaTheme,
  nord: nordTheme,
  solarizedDark: solarizedDarkTheme,
  gruvbox: gruvboxTheme,
  tokyoNight: tokyoNightTheme,
  catppuccin: catppuccinTheme,
};

/** All theme names for cycling */
export const themeNames = Object.keys(themes) as (keyof typeof themes)[];

/** Get next theme in cycle */
export function getNextTheme(current: Theme): Theme {
  const currentIndex = themeNames.findIndex(name => themes[name].name === current.name);
  const nextIndex = (currentIndex + 1) % themeNames.length;
  return themes[themeNames[nextIndex]!]!;
}

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
