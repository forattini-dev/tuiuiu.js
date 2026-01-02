/**
 * Badge - Small status indicator with label
 *
 * @layer Atom
 * @description Displays small status badges with semantic variants
 *
 * Features:
 * - Semantic variants (success, warning, danger, info)
 * - Auto-contrast text colors
 * - Custom color support
 * - Theme-aware styling
 */

import type { VNode, ColorValue } from '../utils/types.js';
import { Text, Box } from '../primitives/nodes.js';
import { getTheme, getContrastColor, resolveColor } from '../core/theme.js';

// =============================================================================
// Types
// =============================================================================

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export type BadgeStyle = 'solid' | 'outline' | 'subtle';

export interface BadgeProps {
  /** Badge label text */
  label: string;
  /** Semantic variant (uses theme colors) */
  variant?: BadgeVariant;
  /** Visual style */
  style?: BadgeStyle;
  /** Custom color (overrides variant) */
  color?: ColorValue;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Badge - Small status indicator
 *
 * @example
 * // Semantic variants
 * Badge({ label: 'NEW', variant: 'primary' })
 * Badge({ label: 'SUCCESS', variant: 'success' })
 * Badge({ label: 'ERROR', variant: 'danger' })
 *
 * @example
 * // Style variants
 * Badge({ label: 'Solid', variant: 'success', style: 'solid' })
 * Badge({ label: 'Outline', variant: 'success', style: 'outline' })
 * Badge({ label: 'Subtle', variant: 'success', style: 'subtle' })
 *
 * @example
 * // Custom color
 * Badge({ label: 'Custom', color: '#ff6600' })
 */
export function Badge(props: BadgeProps): VNode {
  const { label, variant = 'default', style = 'solid', color } = props;
  const theme = getTheme();

  // Determine base color
  let baseColor: string;
  if (color) {
    baseColor = resolveColor(color);
  } else {
    const badgeTokens = theme.components.badge;
    switch (variant) {
      case 'success':
        baseColor = badgeTokens.success.bg;
        break;
      case 'warning':
        baseColor = badgeTokens.warning.bg;
        break;
      case 'danger':
        baseColor = badgeTokens.danger.bg;
        break;
      case 'info':
        baseColor = theme.accents.info;
        break;
      case 'primary':
        baseColor = theme.palette.primary[500];
        break;
      case 'secondary':
        baseColor = theme.palette.secondary[500];
        break;
      default:
        baseColor = badgeTokens.default.bg;
    }
  }

  // Apply style variant
  switch (style) {
    case 'solid': {
      const textColor = getContrastColor(baseColor);
      return Text(
        { color: textColor, backgroundColor: baseColor, bold: true },
        ` ${label} `
      );
    }

    case 'outline':
      return Box(
        { borderStyle: 'round', borderColor: baseColor },
        Text({ color: baseColor }, label)
      );

    case 'subtle':
    default:
      return Text({ color: baseColor, dim: true }, `[${label}]`);
  }
}

// =============================================================================
// Preset Factories
// =============================================================================

/**
 * Success badge preset
 * @example successBadge('Active')
 */
export function successBadge(
  label: string,
  style: BadgeStyle = 'solid'
): VNode {
  return Badge({ label, variant: 'success', style });
}

/**
 * Warning badge preset
 * @example warningBadge('Pending')
 */
export function warningBadge(
  label: string,
  style: BadgeStyle = 'solid'
): VNode {
  return Badge({ label, variant: 'warning', style });
}

/**
 * Danger/Error badge preset
 * @example dangerBadge('Failed')
 */
export function dangerBadge(
  label: string,
  style: BadgeStyle = 'solid'
): VNode {
  return Badge({ label, variant: 'danger', style });
}

/**
 * Info badge preset
 * @example infoBadge('Note')
 */
export function infoBadge(label: string, style: BadgeStyle = 'solid'): VNode {
  return Badge({ label, variant: 'info', style });
}

/**
 * Primary badge preset
 * @example primaryBadge('NEW')
 */
export function primaryBadge(
  label: string,
  style: BadgeStyle = 'solid'
): VNode {
  return Badge({ label, variant: 'primary', style });
}
