/**
 * Divider - Visual separator line
 *
 * Features:
 * - Horizontal and vertical orientation
 * - Customizable character
 * - Title support (centered text)
 * - ASCII fallback support
 * - Theme integration
 */

import type { VNode } from '../../utils/types.js';
import { Box } from './box.js';
import { Text } from './text.js';
import { getChars, getRenderMode } from '../../core/capabilities.js';
import { themeColor } from '../../core/theme.js';

/**
 * Divider props
 */
export interface DividerProps {
  /** Direction of the divider */
  direction?: 'horizontal' | 'vertical';
  /** Character to use for the line (auto-detects based on render mode) */
  char?: string;
  /** Width/length of the divider (default: fills available space) */
  width?: number | string;
  /** Color of the divider */
  color?: string;
  /** Dim the divider */
  dim?: boolean;
  /** Title to show in the middle of the divider */
  title?: string;
  /** Title color */
  titleColor?: string;
  /** Margin around divider */
  margin?: number;
}

/**
 * Divider - Visual separator line
 *
 * @example
 * ```typescript
 * // Simple horizontal divider
 * Divider()
 *
 * // With title
 * Divider({ title: 'Section', titleColor: 'cyan' })
 *
 * // Vertical divider
 * Divider({ direction: 'vertical', width: 10 })
 *
 * // Custom style
 * Divider({ char: '═', color: 'yellow' })
 * ```
 */
export function Divider(props: DividerProps = {}): VNode {
  const chars = getChars();
  const isAscii = getRenderMode() === 'ascii';

  const {
    direction = 'horizontal',
    char,
    width = '100%',
    color = themeColor('border'),
    dim = false,
    title,
    titleColor,
    margin = 0,
  } = props;

  // Default characters based on direction and render mode
  const defaultChar = direction === 'horizontal'
    ? chars.border.horizontal
    : chars.border.vertical;
  const divChar = char ?? defaultChar;

  if (direction === 'horizontal') {
    // Horizontal divider
    if (title) {
      // Divider with title: ──── Title ────
      return Box(
        { flexDirection: 'row', width, marginY: margin },
        Text({ color, dim }, divChar.repeat(3) + ' '),
        Text({ color: titleColor ?? themeColor('text'), bold: true }, title),
        Text({ color, dim }, ' ' + divChar.repeat(3))
      );
    }

    // Simple horizontal divider
    const termWidth = typeof width === 'number' ? width : (process.stdout.columns || 80);

    return {
      type: 'box',
      props: { width, flexDirection: 'row', marginY: margin },
      children: [{
        type: 'text',
        props: {
          color,
          dim,
          children: divChar.repeat(termWidth),
          __divider: true,
        },
        children: [],
      }],
    };
  } else {
    // Vertical divider
    const termHeight = typeof width === 'number' ? width : (process.stdout.rows || 24);
    const lines = Array(termHeight).fill(divChar).join('\n');

    return Box(
      { marginX: margin },
      Text({ color, dim }, lines)
    );
  }
}
