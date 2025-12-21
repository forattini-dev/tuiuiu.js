/**
 * Badge - Small status indicator with label
 */

import type { VNode } from '../../utils/types.js';
import { Text } from '../primitives/text.js';

/**
 * Badge - Small status indicator with label
 *
 * @example
 * Badge({ label: 'SUCCESS', color: 'green' })
 * Badge({ label: 'ERROR', color: 'red', inverse: true })
 */
export interface BadgeProps {
  /** Badge label text */
  label: string;
  /** Badge color */
  color?: string;
  /** Inverse colors (background becomes foreground) */
  inverse?: boolean;
}

export function Badge(props: BadgeProps): VNode {
  const { label, color = 'blue', inverse = false } = props;

  return Text({ color, inverse, bold: true }, ` ${label} `);
}
