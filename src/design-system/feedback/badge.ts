/**
 * Badge - Small status indicator with label
 */

import type { VNode } from '../../utils/types.js';
import { Text } from '../../primitives/nodes.js';
import { getTheme, getContrastColor } from '../../core/theme.js';

/**
 * Badge variant - semantic color variants
 */
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'default';

/**
 * Badge - Small status indicator with label
 *
 * @example
 * // Using semantic variant (recommended - auto colors from theme)
 * Badge({ label: 'SUCCESS', variant: 'success' })
 * Badge({ label: 'ERROR', variant: 'danger' })
 * Badge({ label: 'NEW', variant: 'primary' })
 *
 * @example
 * // Using custom color (auto-calculates contrast)
 * Badge({ label: 'CUSTOM', color: '#ff6600' })
 *
 */
export interface BadgeProps {
  /** Badge label text */
  label: string;
  /** Semantic variant - uses theme colors with proper foreground */
  variant?: BadgeVariant;
  /** Custom badge color (overrides variant) */
  color?: string;
}

export function Badge(props: BadgeProps): VNode {
  const theme = getTheme();
  const { label, variant, color } = props;

  // Priority: custom color > variant > default
  if (color) {
    // Custom color: auto-calculate contrast
    const textColor = getContrastColor(color);
    return Text({ color: textColor, backgroundColor: color, bold: true }, ` ${label} `);
  }

  // Use component tokens for badges
  const badgeTokens = theme.components.badge;
  let bg: string;
  let fg: string;

  switch (variant) {
    case 'success':
      bg = badgeTokens.success.bg;
      fg = badgeTokens.success.fg;
      break;
    case 'warning':
      bg = badgeTokens.warning.bg;
      fg = badgeTokens.warning.fg;
      break;
    case 'danger':
      bg = badgeTokens.danger.bg;
      fg = badgeTokens.danger.fg;
      break;
    case 'primary':
      bg = theme.palette.primary[500];
      fg = theme.foreground.inverse.base;
      break;
    case 'secondary':
      bg = theme.palette.secondary[500];
      fg = theme.foreground.inverse.base;
      break;
    default:
      bg = badgeTokens.default.bg;
      fg = badgeTokens.default.fg;
  }

  return Text({ color: fg, backgroundColor: bg, bold: true }, ` ${label} `);
}
