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
 *   return ModalContent();
 * }
 * ```
 */

import { useEffect } from './use-effect.js';
import { pushTheme, popTheme, type Theme } from '../core/theme.js';

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
