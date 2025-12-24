/**
 * Theme Builder
 *
 * Utilities for defining themes in TypeScript files.
 * Each theme is a separate .ts file that exports a Theme object.
 */

import type {
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
  BorderRadius,
} from './theme-types.js';

// =============================================================================
// Theme Definition Helper
// =============================================================================

/**
 * Input for defining a theme.
 * This is the structure used in theme files.
 */
export interface ThemeDefinition {
  name: string;
  mode: ThemeMode;
  meta: ThemeMeta;
  palette: ThemePalette;
  background: ThemeBackground;
  foreground: ThemeForeground;
  accents: ThemeAccent;
  states: ThemeStates;
  borders: ThemeBorders;
  opacity: ThemeOpacity;
  components: ComponentTokens;
  /** Border radius style (optional, defaults to 'md') */
  borderRadius?: BorderRadius;
}

/**
 * Define a theme with full type checking.
 *
 * @example
 * ```typescript
 * import { defineTheme } from '../core/theme-loader.js';
 * import * as colors from '../core/colors.js';
 *
 * const palette = {
 *   primary: colors.blue,
 *   secondary: colors.slate,
 *   // ...
 * };
 *
 * export const darkTheme = defineTheme({
 *   name: 'dark',
 *   mode: 'dark',
 *   meta: { version: '1.0.0', author: 'tuiuiu', description: 'Default dark theme' },
 *   palette,
 *   background: {
 *     lowest: palette.neutral[900],
 *     base: palette.neutral[800],
 *     // ...
 *   },
 *   // ...
 * });
 * ```
 */
export function defineTheme(definition: ThemeDefinition): Theme {
  return definition;
}

// =============================================================================
// Color Scale Utilities
// =============================================================================

/**
 * Create a color scale from individual shade values.
 */
export function createScale(shades: {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}): ColorScale {
  return shades;
}

/**
 * Get a shade from a color scale with fallback to 500.
 */
export function shade(scale: ColorScale, value: keyof ColorScale = 500): string {
  return scale[value];
}

// =============================================================================
// Theme Merging
// =============================================================================

/**
 * Merge two themes, with the second theme overriding the first.
 * Useful for creating theme variants.
 */
export function mergeThemes(
  base: Theme,
  overrides: Partial<ThemeDefinition>
): Theme {
  return {
    name: overrides.name ?? base.name,
    mode: overrides.mode ?? base.mode,
    meta: { ...base.meta, ...overrides.meta },
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
    components: mergeComponents(base.components, overrides.components),
    borderRadius: overrides.borderRadius ?? base.borderRadius,
  };
}

/**
 * Deep merge component tokens.
 */
function mergeComponents(
  base: ComponentTokens,
  overrides?: Partial<ComponentTokens>
): ComponentTokens {
  if (!overrides) return base;

  return {
    button: {
      primary: { ...base.button.primary, ...overrides.button?.primary },
      secondary: { ...base.button.secondary, ...overrides.button?.secondary },
      outline: { ...base.button.outline, ...overrides.button?.outline },
      ghost: { ...base.button.ghost, ...overrides.button?.ghost },
    },
    panel: { ...base.panel, ...overrides.panel },
    menu: {
      ...base.menu,
      ...overrides.menu,
      item: { ...base.menu.item, ...overrides.menu?.item },
    },
    tabs: {
      ...base.tabs,
      ...overrides.tabs,
      tab: { ...base.tabs.tab, ...overrides.tabs?.tab },
    },
    dropdown: {
      ...base.dropdown,
      ...overrides.dropdown,
      item: { ...base.dropdown.item, ...overrides.dropdown?.item },
    },
    input: { ...base.input, ...overrides.input },
    checkbox: { ...base.checkbox, ...overrides.checkbox },
    radio: { ...base.radio, ...overrides.radio },
    tooltip: { ...base.tooltip, ...overrides.tooltip },
    modal: { ...base.modal, ...overrides.modal },
    badge: {
      default: { ...base.badge.default, ...overrides.badge?.default },
      success: { ...base.badge.success, ...overrides.badge?.success },
      warning: { ...base.badge.warning, ...overrides.badge?.warning },
      danger: { ...base.badge.danger, ...overrides.badge?.danger },
    },
    list: {
      item: { ...base.list.item, ...overrides.list?.item },
    },
    header: {
      default: { ...base.header.default, ...overrides.header?.default },
      primary: { ...base.header.primary, ...overrides.header?.primary },
      secondary: { ...base.header.secondary, ...overrides.header?.secondary },
      success: { ...base.header.success, ...overrides.header?.success },
      warning: { ...base.header.warning, ...overrides.header?.warning },
      danger: { ...base.header.danger, ...overrides.header?.danger },
    },
    statusbar: {
      default: { ...base.statusbar.default, ...overrides.statusbar?.default },
      primary: { ...base.statusbar.primary, ...overrides.statusbar?.primary },
      info: { ...base.statusbar.info, ...overrides.statusbar?.info },
      success: { ...base.statusbar.success, ...overrides.statusbar?.success },
      warning: { ...base.statusbar.warning, ...overrides.statusbar?.warning },
      danger: { ...base.statusbar.danger, ...overrides.statusbar?.danger },
    },
    page: {
      default: { ...base.page.default, ...overrides.page?.default },
      primary: { ...base.page.primary, ...overrides.page?.primary },
      secondary: { ...base.page.secondary, ...overrides.page?.secondary },
    },
    appshell: { ...base.appshell, ...overrides.appshell },
    collapsible: {
      default: { ...base.collapsible.default, ...overrides.collapsible?.default },
      primary: { ...base.collapsible.primary, ...overrides.collapsible?.primary },
      secondary: { ...base.collapsible.secondary, ...overrides.collapsible?.secondary },
    },
    commandPalette: { ...base.commandPalette, ...overrides.commandPalette },
    splitPanel: { ...base.splitPanel, ...overrides.splitPanel },
    toast: {
      success: { ...base.toast.success, ...overrides.toast?.success },
      error: { ...base.toast.error, ...overrides.toast?.error },
      warning: { ...base.toast.warning, ...overrides.toast?.warning },
      info: { ...base.toast.info, ...overrides.toast?.info },
    },
    window: {
      default: { ...base.window.default, ...overrides.window?.default },
      primary: { ...base.window.primary, ...overrides.window?.primary },
      success: { ...base.window.success, ...overrides.window?.success },
      warning: { ...base.window.warning, ...overrides.window?.warning },
      danger: { ...base.window.danger, ...overrides.window?.danger },
    },
  };
}

// =============================================================================
// Validation
// =============================================================================

/**
 * Validate a theme has all required properties.
 * Returns an array of validation errors (empty if valid).
 */
export function validateTheme(theme: unknown): string[] {
  const errors: string[] = [];

  if (!theme || typeof theme !== 'object') {
    errors.push('Theme must be an object');
    return errors;
  }

  const t = theme as Record<string, unknown>;

  // Required top-level properties
  const required = ['name', 'mode', 'meta', 'palette', 'background', 'foreground', 'accents', 'states', 'borders', 'opacity', 'components'];
  for (const prop of required) {
    if (!(prop in t)) {
      errors.push(`Missing required property: ${prop}`);
    }
  }

  // Mode must be 'dark' or 'light'
  if (t.mode && t.mode !== 'dark' && t.mode !== 'light') {
    errors.push(`Invalid mode: ${t.mode}. Must be 'dark' or 'light'`);
  }

  // Palette must have required colors
  if (t.palette && typeof t.palette === 'object') {
    const palette = t.palette as Record<string, unknown>;
    const paletteColors = ['primary', 'secondary', 'success', 'warning', 'danger', 'neutral'];
    for (const color of paletteColors) {
      if (!(color in palette)) {
        errors.push(`Missing palette color: palette.${color}`);
      }
    }
  }

  return errors;
}

/**
 * Check if a theme is valid.
 */
export function isValidTheme(theme: unknown): theme is Theme {
  return validateTheme(theme).length === 0;
}
