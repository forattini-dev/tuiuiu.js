/**
 * Presets - Pre-configured component props for common use cases
 *
 * @layer DevX
 * @description Ready-to-use prop configurations that can be spread into components
 *
 * @example
 * ```typescript
 * import { presets } from 'tuiuiu.js'
 *
 * // Use preset with spread
 * Button({ ...presets.dangerButton, label: 'Delete' })
 * Modal({ ...presets.confirmModal, title: 'Confirm', content: message })
 * Badge({ ...presets.statusSuccess, label: 'Active' })
 *
 * // Override preset values
 * Button({
 *   ...presets.dangerButton,
 *   label: 'Remove',
 *   size: 'large', // override default size
 * })
 * ```
 */

import type { ButtonProps, ButtonVariant, ButtonSize } from '../atoms/button.js';
import type { BadgeOptions } from '../atoms/tooltip.js';
import type { ModalProps, ModalSize } from '../organisms/modal.js';

// =============================================================================
// Button Presets
// =============================================================================

/**
 * Danger/destructive button preset
 * Use for destructive actions like delete, remove, cancel
 */
export const dangerButton: Partial<ButtonProps> = {
  variant: 'solid',
  color: 'error',
};

/**
 * Success button preset
 * Use for positive actions like save, confirm, submit
 */
export const successButton: Partial<ButtonProps> = {
  variant: 'solid',
  color: 'success',
};

/**
 * Warning button preset
 * Use for cautionary actions that need attention
 */
export const warningButton: Partial<ButtonProps> = {
  variant: 'solid',
  color: 'warning',
};

/**
 * Ghost button preset
 * Use for secondary actions with minimal visual weight
 */
export const ghostButton: Partial<ButtonProps> = {
  variant: 'ghost',
};

/**
 * Link button preset
 * Use for inline text-style actions
 */
export const linkButton: Partial<ButtonProps> = {
  variant: 'link',
};

/**
 * Primary button preset
 * Use for primary actions with emphasis
 */
export const primaryButton: Partial<ButtonProps> = {
  variant: 'solid',
  color: 'info',
};

/**
 * Outline button preset
 * Use for secondary actions with visible border
 */
export const outlineButton: Partial<ButtonProps> = {
  variant: 'outline',
};

/**
 * Small button preset
 * Use for compact interfaces
 */
export const smallButton: Partial<ButtonProps> = {
  size: 'small',
};

/**
 * Large button preset
 * Use for prominent actions
 */
export const largeButton: Partial<ButtonProps> = {
  size: 'large',
};

// =============================================================================
// Modal Presets
// =============================================================================

/**
 * Confirm modal preset
 * Use for confirmation dialogs (small, with close hint)
 */
export const confirmModal: Partial<ModalProps> = {
  size: 'small',
  showCloseHint: true,
  borderStyle: 'round',
  backdrop: true,
};

/**
 * Alert modal preset
 * Use for alert/warning dialogs (small, centered)
 */
export const alertModal: Partial<ModalProps> = {
  size: 'small',
  position: 'center',
  borderStyle: 'double',
  backdrop: true,
  showCloseHint: true,
};

/**
 * Form modal preset
 * Use for modal forms (medium size, more padding)
 */
export const formModal: Partial<ModalProps> = {
  size: 'medium',
  padding: 2,
  borderStyle: 'round',
  backdrop: true,
  showCloseButton: true,
};

/**
 * Large modal preset
 * Use for content-heavy modals
 */
export const largeModal: Partial<ModalProps> = {
  size: 'large',
  padding: 2,
  borderStyle: 'single',
  backdrop: true,
  showCloseButton: true,
};

/**
 * Fullscreen modal preset
 * Use for immersive experiences
 */
export const fullscreenModal: Partial<ModalProps> = {
  size: 'fullscreen',
  padding: 1,
  borderStyle: 'none',
  backdrop: false,
  showCloseButton: true,
};

// =============================================================================
// Badge Presets
// =============================================================================

/**
 * Success status badge
 * Use for positive states: active, online, completed
 */
export const statusSuccess: Partial<BadgeOptions> = {
  variant: 'solid',
  color: 'success',
};

/**
 * Warning status badge
 * Use for warning states: pending, expiring, needs attention
 */
export const statusWarning: Partial<BadgeOptions> = {
  variant: 'solid',
  color: 'warning',
};

/**
 * Error status badge
 * Use for error states: failed, offline, critical
 */
export const statusError: Partial<BadgeOptions> = {
  variant: 'solid',
  color: 'error',
};

/**
 * Info status badge
 * Use for informational states: new, beta, count
 */
export const statusInfo: Partial<BadgeOptions> = {
  variant: 'solid',
  color: 'info',
};

/**
 * Neutral status badge
 * Use for neutral states: draft, inactive
 */
export const statusNeutral: Partial<BadgeOptions> = {
  variant: 'subtle',
  color: 'gray',
};

/**
 * Pending status badge
 * Use for pending/loading states: processing, queued
 */
export const statusPending: Partial<BadgeOptions> = {
  variant: 'subtle',
  color: 'yellow',
};

/**
 * Outline success badge
 * Lighter variant of success
 */
export const outlineSuccess: Partial<BadgeOptions> = {
  variant: 'outline',
  color: 'success',
};

/**
 * Outline warning badge
 * Lighter variant of warning
 */
export const outlineWarning: Partial<BadgeOptions> = {
  variant: 'outline',
  color: 'warning',
};

/**
 * Outline error badge
 * Lighter variant of error
 */
export const outlineError: Partial<BadgeOptions> = {
  variant: 'outline',
  color: 'error',
};

// =============================================================================
// Aggregated Presets Object
// =============================================================================

/**
 * All presets in one object for easy import
 *
 * @example
 * ```typescript
 * import { presets } from 'tuiuiu.js'
 *
 * Button({ ...presets.dangerButton, label: 'Delete' })
 * Badge({ ...presets.statusSuccess, label: 'Online' })
 * Modal({ ...presets.confirmModal, title: 'Confirm', content: msg })
 * ```
 */
export const presets = {
  // Buttons
  dangerButton,
  successButton,
  warningButton,
  ghostButton,
  linkButton,
  primaryButton,
  outlineButton,
  smallButton,
  largeButton,

  // Modals
  confirmModal,
  alertModal,
  formModal,
  largeModal,
  fullscreenModal,

  // Badges
  statusSuccess,
  statusWarning,
  statusError,
  statusInfo,
  statusNeutral,
  statusPending,
  outlineSuccess,
  outlineWarning,
  outlineError,
} as const;

export type PresetName = keyof typeof presets;

/**
 * Get a preset by name
 *
 * @example
 * ```typescript
 * const preset = getPreset('dangerButton')
 * Button({ ...preset, label: 'Delete' })
 * ```
 */
export function getPreset<K extends PresetName>(name: K): (typeof presets)[K] {
  return presets[name];
}

/**
 * List all available preset names
 */
export function listPresets(): PresetName[] {
  return Object.keys(presets) as PresetName[];
}

/**
 * List presets by category
 */
export function listPresetsByCategory(): Record<string, PresetName[]> {
  return {
    button: [
      'dangerButton',
      'successButton',
      'warningButton',
      'ghostButton',
      'linkButton',
      'primaryButton',
      'outlineButton',
      'smallButton',
      'largeButton',
    ],
    modal: [
      'confirmModal',
      'alertModal',
      'formModal',
      'largeModal',
      'fullscreenModal',
    ],
    badge: [
      'statusSuccess',
      'statusWarning',
      'statusError',
      'statusInfo',
      'statusNeutral',
      'statusPending',
      'outlineSuccess',
      'outlineWarning',
      'outlineError',
    ],
  };
}
