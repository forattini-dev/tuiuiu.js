/**
 * Badge - Small status indicator with label
 */

import type { VNode } from '../../utils/types.js';
import { Text } from '../../primitives/nodes.js';
import { themeColorPair, getContrastColor, type SemanticColorKey } from '../../core/theme.js';

/**
 * Badge variant - semantic color variants
 */
export type BadgeVariant = SemanticColorKey | 'default';

/**
 * Badge - Small status indicator with label
 *
 * @example
 * // Using semantic variant (recommended - auto colors from theme)
 * Badge({ label: 'SUCCESS', variant: 'success' })
 * Badge({ label: 'ERROR', variant: 'destructive' })
 * Badge({ label: 'NEW', variant: 'primary' })
 *
 * @example
 * // Using custom color (auto-calculates contrast)
 * Badge({ label: 'CUSTOM', color: '#ff6600' })
 *
 * @example
 * // Legacy inverse mode (deprecated, prefer variant)
 * Badge({ label: 'OLD', color: 'red', inverse: true })
 */
export interface BadgeProps {
  /** Badge label text */
  label: string;
  /** Semantic variant - uses theme colors with proper foreground */
  variant?: BadgeVariant;
  /** Custom badge color (overrides variant) */
  color?: string;
  /** Inverse colors (legacy - prefer using variant) */
  inverse?: boolean;
}

export function Badge(props: BadgeProps): VNode {
  const { label, variant, color, inverse = false } = props;

  // Priority: custom color > variant > default
  if (color) {
    // Custom color: auto-calculate contrast
    const textColor = getContrastColor(color);
    return Text({ color: textColor, backgroundColor: color, bold: true }, ` ${label} `);
  }

  if (variant && variant !== 'default') {
    // Semantic variant: use theme color pair
    const { bg, fg } = themeColorPair(variant);
    return Text({ color: fg, backgroundColor: bg, bold: true }, ` ${label} `);
  }

  // Default/legacy mode: use inverse or simple color
  return Text({ color: 'blue', inverse, bold: true }, ` ${label} `);
}
