/**
 * State Cleanup Hooks
 *
 * Hooks that automatically clean up state changes when components unmount.
 * These prevent state leakage when modals/overlays close unexpectedly.
 *
 * @example
 * ```typescript
 * function Modal() {
 *   // Theme reverts when modal unmounts
 *   useThemeOverride(highContrastTheme);
 *
 *   // Hotkey scope reverts when modal unmounts
 *   useHotkeyScope('modal');
 *
 *   return ModalContent();
 * }
 * ```
 */

import { useEffect } from './use-effect.js';
import { pushTheme, popTheme, type Theme } from '../core/theme.js';
import {
  pushHotkeyScope,
  popHotkeyScope,
  getHotkeyScope,
} from './use-hotkeys.js';

/**
 * Override the theme for this component's lifetime.
 *
 * Automatically restores the previous theme when the component unmounts.
 * Uses a stack-based approach for nested theme overrides.
 *
 * @param theme - The theme to use while this component is mounted
 *
 * @example
 * ```typescript
 * function HighContrastModal() {
 *   // Theme reverts automatically when modal closes
 *   useThemeOverride(highContrastTheme);
 *
 *   return Modal({ content: Text({}, 'High contrast content') });
 * }
 * ```
 */
export function useThemeOverride(theme: Theme): void {
  useEffect(() => {
    pushTheme(theme);
    return () => {
      popTheme();
    };
  });
}

/**
 * Set the hotkey scope for this component's lifetime.
 *
 * Automatically restores the previous scope when the component unmounts.
 * Uses a stack-based approach for nested scopes.
 *
 * @param scope - The scope to activate while this component is mounted
 *
 * @example
 * ```typescript
 * function Modal() {
 *   // Only 'modal' and 'global' hotkeys work while modal is open
 *   // Reverts to previous scope when modal closes
 *   useHotkeyScope('modal');
 *
 *   return ModalContent();
 * }
 *
 * function CommandPalette() {
 *   // Nested scope - reverts to 'modal' when palette closes
 *   useHotkeyScope('command-palette');
 *
 *   return PaletteContent();
 * }
 * ```
 */
export function useHotkeyScope(scope: string): void {
  useEffect(() => {
    pushHotkeyScope(scope);
    return () => {
      popHotkeyScope();
    };
  });
}

/**
 * Get the current hotkey scope (reactive).
 *
 * @returns The current scope name
 */
export function useCurrentHotkeyScope(): string {
  return getHotkeyScope();
}
