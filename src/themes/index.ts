/**
 * Theme Exports
 *
 * Central export point for all theme files.
 */

// Re-export theme loader utilities
export { defineTheme, mergeThemes, validateTheme, isValidTheme } from '../core/theme-loader.js';

// Re-export theme types
export type {
  ThemeDefinition,
} from '../core/theme-loader.js';

export type {
  Theme,
  ThemePalette,
  ThemeBackground,
  ThemeForeground,
  ThemeAccent,
  ThemeStates,
  ThemeBorders,
  ThemeOpacity,
  ComponentTokens,
  ThemeMeta,
  ThemeMode,
  ColorScale,
} from '../core/theme-types.js';

// =============================================================================
// Theme Imports
// =============================================================================

import { darkTheme } from './dark.theme.js';
import { lightTheme } from './light.theme.js';
import { monokaiTheme } from './monokai.theme.js';
import { draculaTheme } from './dracula.theme.js';
import { nordTheme } from './nord.theme.js';
import { solarizedDarkTheme } from './solarized-dark.theme.js';
import { gruvboxTheme } from './gruvbox.theme.js';
import { tokyoNightTheme } from './tokyo-night.theme.js';
import { catppuccinTheme } from './catppuccin.theme.js';
import { highContrastDarkTheme } from './high-contrast-dark.theme.js';
import { monochromeTheme } from './monochrome.theme.js';

// =============================================================================
// Named Exports
// =============================================================================

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
// Theme Collection
// =============================================================================

/**
 * All available themes as an object.
 */
export const themes = {
  dark: darkTheme,
  light: lightTheme,
  monokai: monokaiTheme,
  dracula: draculaTheme,
  nord: nordTheme,
  'solarized-dark': solarizedDarkTheme,
  gruvbox: gruvboxTheme,
  'tokyo-night': tokyoNightTheme,
  catppuccin: catppuccinTheme,
  'high-contrast-dark': highContrastDarkTheme,
  monochrome: monochromeTheme,
} as const;

/**
 * Theme name type (union of all theme names).
 */
export type ThemeName = keyof typeof themes;

/**
 * List of all theme names.
 */
export const themeNames = Object.keys(themes) as ThemeName[];

/**
 * Get a theme by name.
 */
export function getThemeByName(name: ThemeName) {
  return themes[name];
}

/**
 * Get the next theme in the cycle.
 */
export function getNextTheme(currentName: ThemeName): ThemeName {
  const currentIndex = themeNames.indexOf(currentName);
  const nextIndex = (currentIndex + 1) % themeNames.length;
  return themeNames[nextIndex]!;
}

/**
 * Get the previous theme in the cycle.
 */
export function getPreviousTheme(currentName: ThemeName): ThemeName {
  const currentIndex = themeNames.indexOf(currentName);
  const prevIndex = (currentIndex - 1 + themeNames.length) % themeNames.length;
  return themeNames[prevIndex]!;
}

// =============================================================================
// Default Export
// =============================================================================

export default themes;
