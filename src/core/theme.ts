/**
 * Theme System - Context-based theming for Tuiuiu
 *
 * Clean, unified theme API with:
 * - Direct theme structure access (no conversion layer)
 * - Signal-based reactive theme switching
 * - Component tokens for consistent styling
 * - Background/foreground hierarchy for visual depth
 */

import { createSignal, untrack } from '../primitives/signal.js';
import { colors, type ColorPalette, type ColorShade } from './colors.js';
import type {
  Theme,
  ThemeMode,
  ThemePalette,
  ThemeBackground,
  ThemeForeground,
  ThemeAccent,
  ThemeStates,
  ThemeBorders,
  ThemeOpacity,
  ComponentTokens,
  ComponentName,
  ColorScale,
  ShadeValue,
  BorderRadius,
} from './theme-types.js';

// Re-export types from theme-types
export type {
  Theme,
  ThemeMode,
  ThemePalette,
  ThemeBackground,
  ThemeForeground,
  ThemeAccent,
  ThemeStates,
  ThemeBorders,
  ThemeOpacity,
  ComponentTokens,
  ComponentName,
  ColorScale,
  ShadeValue,
  BorderRadius,
  ForegroundInverse,
  StateToken,
  FocusState,
  DisabledState,
  SelectedState,
  ButtonTokens,
  ButtonVariantTokens,
  PanelTokens,
  MenuTokens,
  MenuItemTokens,
  TabsTokens,
  TabTokens,
  DropdownTokens,
  DropdownItemTokens,
  InputTokens,
  CheckboxTokens,
  RadioTokens,
  TooltipTokens,
  ModalTokens,
  BadgeTokens,
  BadgeVariantTokens,
  ListTokens,
  ListItemTokens,
} from './theme-types.js';

export { getShade } from './theme-types.js';

// =============================================================================
// Theme Imports (Direct - No Conversion)
// =============================================================================

import { darkTheme } from '../themes/dark.theme.js';
import { lightTheme } from '../themes/light.theme.js';
import { monokaiTheme } from '../themes/monokai.theme.js';
import { draculaTheme } from '../themes/dracula.theme.js';
import { nordTheme } from '../themes/nord.theme.js';
import { solarizedDarkTheme } from '../themes/solarized-dark.theme.js';
import { gruvboxTheme } from '../themes/gruvbox.theme.js';
import { tokyoNightTheme } from '../themes/tokyo-night.theme.js';
import { catppuccinTheme } from '../themes/catppuccin.theme.js';
import { highContrastDarkTheme } from '../themes/high-contrast-dark.theme.js';
import { monochromeTheme } from '../themes/monochrome.theme.js';

// Re-export themes
export {
  darkTheme,
  lightTheme,
  monokaiTheme,
  draculaTheme,
  nordTheme,
  solarizedDarkTheme,
  gruvboxTheme,
  tokyoNightTheme,
  catppuccinTheme,
  highContrastDarkTheme,
  monochromeTheme,
};

// =============================================================================
// Theme Context (Signal-based)
// =============================================================================

// Global theme signal
const [currentTheme, setCurrentTheme] = createSignal<Theme>(darkTheme);

// Theme stack for nested themes
const themeStack: Theme[] = [];

/**
 * Get the current theme (reactive).
 *
 * Use destructuring to access specific parts:
 * ```typescript
 * const { palette, background, foreground, components } = useTheme()
 * const buttonBg = components.button.primary.bg
 * ```
 */
export function useTheme(): Theme {
  return currentTheme();
}

/**
 * Get the current theme without tracking (for use outside effects).
 */
export function getTheme(): Theme {
  return untrack(currentTheme);
}

/**
 * Get the current theme mode ('dark' or 'light').
 */
export function useThemeMode(): ThemeMode {
  return currentTheme().mode;
}

/**
 * Check if current theme is dark mode.
 */
export function useIsDark(): boolean {
  return currentTheme().mode === 'dark';
}

/**
 * Get component tokens for a specific component.
 *
 * @example
 * ```typescript
 * const buttonTokens = useComponentTokens('button')
 * const { primary, secondary, outline, ghost } = buttonTokens
 * ```
 */
export function useComponentTokens<K extends ComponentName>(
  component: K
): ComponentTokens[K] {
  return currentTheme().components[component];
}

/**
 * Set the global theme.
 */
export function setTheme(theme: Theme): void {
  setCurrentTheme(theme);
}

/**
 * Push a theme onto the stack (for nested themes).
 */
export function pushTheme(theme: Theme): void {
  themeStack.push(untrack(currentTheme));
  setCurrentTheme(theme);
}

/**
 * Pop a theme from the stack.
 */
export function popTheme(): void {
  const previous = themeStack.pop();
  if (previous) {
    setCurrentTheme(previous);
  }
}

// =============================================================================
// Theme Collection
// =============================================================================

/**
 * All built-in themes.
 */
export const themes = {
  dark: darkTheme,
  light: lightTheme,
  monokai: monokaiTheme,
  dracula: draculaTheme,
  nord: nordTheme,
  solarizedDark: solarizedDarkTheme,
  gruvbox: gruvboxTheme,
  tokyoNight: tokyoNightTheme,
  catppuccin: catppuccinTheme,
  highContrastDark: highContrastDarkTheme,
  monochrome: monochromeTheme,
} as const;

/** Theme name type */
export type ThemeName = keyof typeof themes;

/** All theme names for cycling */
export const themeNames = Object.keys(themes) as ThemeName[];

/**
 * Get a theme by name.
 */
export function getThemeByName(name: ThemeName): Theme {
  return themes[name];
}

/**
 * Get next theme in cycle.
 */
export function getNextTheme(current: Theme): Theme {
  const currentIndex = themeNames.findIndex(name => themes[name].name === current.name);
  const nextIndex = (currentIndex + 1) % themeNames.length;
  return themes[themeNames[nextIndex]!]!;
}

/**
 * Get previous theme in cycle.
 */
export function getPreviousTheme(current: Theme): Theme {
  const currentIndex = themeNames.findIndex(name => themes[name].name === current.name);
  const prevIndex = (currentIndex - 1 + themeNames.length) % themeNames.length;
  return themes[themeNames[prevIndex]!]!;
}

// =============================================================================
// Theme Utilities
// =============================================================================

/**
 * Create a custom theme by extending an existing theme.
 *
 * For deep customization, use `mergeThemes` from theme-loader.
 */
export function createTheme(base: Theme, overrides: Partial<Theme>): Theme {
  return {
    ...base,
    ...overrides,
    palette: overrides.palette ?? base.palette,
    background: { ...base.background, ...overrides.background },
    foreground: {
      ...base.foreground,
      ...overrides.foreground,
      inverse: {
        ...base.foreground.inverse,
        ...(overrides.foreground?.inverse ?? {}),
      },
    },
    accents: { ...base.accents, ...overrides.accents },
    states: {
      ...base.states,
      ...overrides.states,
      hover: { ...base.states.hover, ...(overrides.states?.hover ?? {}) },
      active: { ...base.states.active, ...(overrides.states?.active ?? {}) },
      focus: {
        ...base.states.focus,
        ...(overrides.states?.focus ?? {}),
        ring: {
          ...base.states.focus.ring,
          ...(overrides.states?.focus?.ring ?? {}),
        },
      },
      disabled: { ...base.states.disabled, ...(overrides.states?.disabled ?? {}) },
      selected: { ...base.states.selected, ...(overrides.states?.selected ?? {}) },
    },
    borders: { ...base.borders, ...overrides.borders },
    opacity: { ...base.opacity, ...overrides.opacity },
    components: overrides.components ?? base.components,
  };
}

/**
 * Map border radius to actual characters.
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
// Color Utilities
// =============================================================================

/**
 * Calculate relative luminance of a color (WCAG formula).
 * Returns value between 0 (black) and 1 (white).
 */
function getLuminance(hex: string): number {
  let color = hex.startsWith('#') ? hex.slice(1) : hex;
  if (color.length === 3) {
    color = color[0]! + color[0] + color[1]! + color[1] + color[2]! + color[2];
  }

  const r = parseInt(color.slice(0, 2), 16) / 255;
  const g = parseInt(color.slice(2, 4), 16) / 255;
  const b = parseInt(color.slice(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Get the best contrasting text color (white or black) for a given background.
 * Uses WCAG luminance formula for accessibility.
 *
 * @example
 * ```typescript
 * getContrastColor('#3b82f6')  // 'white' (blue is dark)
 * getContrastColor('#fbbf24')  // 'black' (amber is light)
 * ```
 */
export function getContrastColor(color: string): 'white' | 'black' {
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

  if (color in namedColorLuminance) {
    return namedColorLuminance[color]! > 0.5 ? 'black' : 'white';
  }

  // For hex colors, calculate luminance
  if (color.startsWith('#')) {
    const luminance = getLuminance(color);
    return luminance > 0.4 ? 'black' : 'white';
  }

  // Default to white for unknown colors (assume dark)
  return 'white';
}

/**
 * Get a Tailwind color by name and shade.
 *
 * @example
 * ```typescript
 * getColor('blue', 500)   // '#3b82f6'
 * getColor('gray', 100)   // '#f3f4f6'
 * ```
 */
export function getColor(name: string, shade: ColorShade = 500): string {
  const palette = colors[name as keyof typeof colors];
  if (!palette) return name;
  if (typeof palette === 'string') return palette;
  return (palette as ColorPalette)[shade] ?? (palette as ColorPalette)[500];
}

/**
 * Get a darker shade of a color.
 *
 * @param name Color name from colors.ts
 * @param steps Number of shade steps to darken (1 = +100)
 */
export function getDarker(name: string, steps: number = 1): string {
  const shade = Math.min(500 + steps * 100, 900) as ColorShade;
  return getColor(name, shade);
}

/**
 * Get a lighter shade of a color.
 *
 * @param name Color name from colors.ts
 * @param steps Number of shade steps to lighten (1 = -100)
 */
export function getLighter(name: string, steps: number = 1): string {
  const shade = Math.max(500 - steps * 100, 50) as ColorShade;
  return getColor(name, shade);
}

// =============================================================================
// System Theme Detection
// =============================================================================

/**
 * Detect system color scheme preference.
 * Checks COLORFGBG environment variable.
 */
export function detectColorScheme(): ThemeMode {
  const colorFgBg = process.env.COLORFGBG;
  if (colorFgBg) {
    const parts = colorFgBg.split(';');
    const bg = parseInt(parts[parts.length - 1] || '0', 10);
    if (bg === 7 || (bg >= 9 && bg <= 15)) {
      return 'light';
    }
    return 'dark';
  }

  const termProgram = process.env.TERM_PROGRAM || '';
  if (termProgram.toLowerCase().includes('apple_terminal')) {
    return 'light';
  }

  return 'dark';
}

/**
 * Auto-select theme based on system preference.
 */
export function useSystemTheme(): void {
  const scheme = detectColorScheme();
  setTheme(scheme === 'light' ? lightTheme : darkTheme);
}

// =============================================================================
// Convenience Aliases
// =============================================================================

/**
 * Shorthand for common theme access patterns.
 *
 * @example
 * ```typescript
 * const { bg, fg, palette, components } = th()
 * ```
 */
export function th(): Theme {
  return currentTheme();
}

/**
 * Get background colors from current theme.
 */
export function useBg(): ThemeBackground {
  return currentTheme().background;
}

/**
 * Get foreground colors from current theme.
 */
export function useFg(): ThemeForeground {
  return currentTheme().foreground;
}

/**
 * Get palette from current theme.
 */
export function usePalette(): ThemePalette {
  return currentTheme().palette;
}

/**
 * Get accent colors from current theme.
 */
export function useAccents(): ThemeAccent {
  return currentTheme().accents;
}

/**
 * Get state colors from current theme.
 */
export function useStates(): ThemeStates {
  return currentTheme().states;
}

/**
 * Get border colors from current theme.
 */
export function useBorders(): ThemeBorders {
  return currentTheme().borders;
}

/**
 * Get opacity values from current theme.
 */
export function useOpacity(): ThemeOpacity {
  return currentTheme().opacity;
}

// =============================================================================
// Color Resolution (for renderer)
// =============================================================================

/**
 * Semantic color name mappings.
 * Maps semantic color names to theme values.
 *
 * Inspired by Bootstrap/DaisyUI color patterns:
 * - Base colors: primary, secondary, success, warning, danger, info
 * - Foreground variants: primaryForeground (text on primary bg)
 * - Background hierarchy: background, surface, card, popover, overlay
 * - Text hierarchy: foreground, mutedForeground, secondaryForeground
 */
const SEMANTIC_COLORS: Record<string, (theme: Theme) => string> = {
  // ==========================================================================
  // Foreground (Text) Hierarchy
  // ==========================================================================
  foreground: (t) => t.foreground.primary,
  'foreground-primary': (t) => t.foreground.primary,
  'foreground-secondary': (t) => t.foreground.secondary,
  'foreground-muted': (t) => t.foreground.muted,
  'foreground-disabled': (t) => t.foreground.disabled,
  mutedForeground: (t) => t.foreground.muted,
  'muted-foreground': (t) => t.foreground.muted,
  disabledForeground: (t) => t.foreground.disabled,

  // ==========================================================================
  // Background Hierarchy
  // ==========================================================================
  background: (t) => t.background.base,
  'background-base': (t) => t.background.base,
  'background-subtle': (t) => t.background.subtle,
  'background-surface': (t) => t.background.surface,
  'background-raised': (t) => t.background.raised,
  'background-elevated': (t) => t.background.elevated,
  surface: (t) => t.background.surface,
  card: (t) => t.background.surface,
  popover: (t) => t.background.popover,
  overlay: (t) => t.background.overlay,

  // ==========================================================================
  // Semantic Colors (Bootstrap/DaisyUI-style)
  // Base colors with auto-contrast foreground variants
  // ==========================================================================

  // Primary - Main brand color
  primary: (t) => t.palette.primary[500],
  'primary-50': (t) => t.palette.primary[50],
  'primary-100': (t) => t.palette.primary[100],
  'primary-200': (t) => t.palette.primary[200],
  'primary-300': (t) => t.palette.primary[300],
  'primary-400': (t) => t.palette.primary[400],
  'primary-500': (t) => t.palette.primary[500],
  'primary-600': (t) => t.palette.primary[600],
  'primary-700': (t) => t.palette.primary[700],
  'primary-800': (t) => t.palette.primary[800],
  'primary-900': (t) => t.palette.primary[900],
  primaryForeground: (t) => getContrastColor(t.palette.primary[500]), // Auto-contrast
  'primary-foreground': (t) => getContrastColor(t.palette.primary[500]),

  // Secondary - Neutral/accent
  secondary: (t) => t.palette.secondary[500],
  'secondary-50': (t) => t.palette.secondary[50],
  'secondary-100': (t) => t.palette.secondary[100],
  'secondary-200': (t) => t.palette.secondary[200],
  'secondary-300': (t) => t.palette.secondary[300],
  'secondary-400': (t) => t.palette.secondary[400],
  'secondary-500': (t) => t.palette.secondary[500],
  'secondary-600': (t) => t.palette.secondary[600],
  'secondary-700': (t) => t.palette.secondary[700],
  'secondary-800': (t) => t.palette.secondary[800],
  'secondary-900': (t) => t.palette.secondary[900],
  secondaryForeground: (t) => getContrastColor(t.palette.secondary[500]), // Auto-contrast
  'secondary-foreground': (t) => getContrastColor(t.palette.secondary[500]),

  // Success - Positive/confirmation
  success: (t) => t.accents.positive,
  'success-50': (t) => t.palette.success[50],
  'success-100': (t) => t.palette.success[100],
  'success-200': (t) => t.palette.success[200],
  'success-300': (t) => t.palette.success[300],
  'success-400': (t) => t.palette.success[400],
  'success-500': (t) => t.palette.success[500],
  'success-600': (t) => t.palette.success[600],
  'success-700': (t) => t.palette.success[700],
  'success-800': (t) => t.palette.success[800],
  'success-900': (t) => t.palette.success[900],
  successForeground: (t) => getContrastColor(t.accents.positive), // Auto-contrast
  'success-foreground': (t) => getContrastColor(t.accents.positive),

  // Warning - Caution/attention
  warning: (t) => t.accents.warning,
  'warning-50': (t) => t.palette.warning[50],
  'warning-100': (t) => t.palette.warning[100],
  'warning-200': (t) => t.palette.warning[200],
  'warning-300': (t) => t.palette.warning[300],
  'warning-400': (t) => t.palette.warning[400],
  'warning-500': (t) => t.palette.warning[500],
  'warning-600': (t) => t.palette.warning[600],
  'warning-700': (t) => t.palette.warning[700],
  'warning-800': (t) => t.palette.warning[800],
  'warning-900': (t) => t.palette.warning[900],
  warningForeground: (t) => getContrastColor(t.accents.warning), // Auto-contrast
  'warning-foreground': (t) => getContrastColor(t.accents.warning),

  // Danger/Error/Destructive - Critical/negative
  danger: (t) => t.accents.critical,
  error: (t) => t.accents.critical,
  destructive: (t) => t.accents.critical,
  'danger-50': (t) => t.palette.danger[50],
  'danger-100': (t) => t.palette.danger[100],
  'danger-200': (t) => t.palette.danger[200],
  'danger-300': (t) => t.palette.danger[300],
  'danger-400': (t) => t.palette.danger[400],
  'danger-500': (t) => t.palette.danger[500],
  'danger-600': (t) => t.palette.danger[600],
  'danger-700': (t) => t.palette.danger[700],
  'danger-800': (t) => t.palette.danger[800],
  'danger-900': (t) => t.palette.danger[900],
  dangerForeground: (t) => getContrastColor(t.accents.critical), // Auto-contrast
  'danger-foreground': (t) => getContrastColor(t.accents.critical),
  errorForeground: (t) => getContrastColor(t.accents.critical),
  destructiveForeground: (t) => getContrastColor(t.accents.critical),

  // Info - Informational
  info: (t) => t.accents.info,
  infoForeground: (t) => getContrastColor(t.accents.info), // Auto-contrast
  'info-foreground': (t) => getContrastColor(t.accents.info),

  // Muted - De-emphasized background (like Tailwind's muted)
  muted: (t) => t.background.subtle,
  'muted-background': (t) => t.background.subtle,

  // Accent - Highlighted elements
  accent: (t) => t.palette.primary[400],
  accentForeground: (t) => getContrastColor(t.palette.primary[400]), // Auto-contrast
  'accent-foreground': (t) => getContrastColor(t.palette.primary[400]),

  // Neutral - Gray scale
  neutral: (t) => t.palette.neutral[500],
  'neutral-50': (t) => t.palette.neutral[50],
  'neutral-100': (t) => t.palette.neutral[100],
  'neutral-200': (t) => t.palette.neutral[200],
  'neutral-300': (t) => t.palette.neutral[300],
  'neutral-400': (t) => t.palette.neutral[400],
  'neutral-500': (t) => t.palette.neutral[500],
  'neutral-600': (t) => t.palette.neutral[600],
  'neutral-700': (t) => t.palette.neutral[700],
  'neutral-800': (t) => t.palette.neutral[800],
  'neutral-900': (t) => t.palette.neutral[900],

  // ==========================================================================
  // Borders
  // ==========================================================================
  border: (t) => t.borders.default,
  'border-subtle': (t) => t.borders.subtle,
  'border-strong': (t) => t.borders.strong,
  input: (t) => t.components.input.border,
  ring: (t) => t.states.focus.ring.color,
};

/**
 * Resolve a color value to a hex string.
 *
 * Handles:
 * - ANSI color names (returned as-is for the renderer)
 * - Semantic theme colors (primary, success, foreground, etc.)
 * - Hex colors (#rrggbb)
 * - RGB colors (rgb(r,g,b))
 * - Palette colors (blue-500)
 *
 * @example
 * ```typescript
 * resolveColor('primary')     // '#3b82f6' (from theme)
 * resolveColor('foreground')  // '#f8fafc' (from theme)
 * resolveColor('#ff6600')     // '#ff6600' (passthrough)
 * resolveColor('blue-500')    // '#3b82f6' (from colors.ts)
 * resolveColor('red')         // 'red' (ANSI color, passthrough)
 * ```
 */
export function resolveColor(color: string): string {
  // Already a hex or rgb color - pass through
  if (color.startsWith('#') || color.startsWith('rgb')) {
    return color;
  }

  // Check for semantic theme color
  const theme = untrack(currentTheme);
  const resolver = SEMANTIC_COLORS[color];
  if (resolver) {
    return resolver(theme);
  }

  // Check for palette color (e.g., 'blue-500')
  const paletteMatch = color.match(/^([a-z]+)-(\d+)$/);
  if (paletteMatch) {
    const [, colorName, shade] = paletteMatch;
    const shadeNum = parseInt(shade, 10) as 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
    return getColor(colorName!, shadeNum);
  }

  // Return as-is (might be ANSI color name like 'red', 'cyan', etc.)
  return color;
}
