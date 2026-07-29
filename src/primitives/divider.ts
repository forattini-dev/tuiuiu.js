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

import type { VNode } from '../utils/types.js';
import { Box, Text } from './nodes.js';
import { getChars } from '../core/capabilities.js';
import { getTheme } from '../core/theme.js';
import { segmentGraphemes } from '../utils/grapheme.js';
import { sanitizeInlineInput } from '../utils/terminal-sanitize.js';

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
  /** Vertical divider length. `width` remains a compatibility fallback. */
  height?: number | string;
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
  const theme = getTheme();
  const chars = getChars();

  const {
    direction = 'horizontal',
    char,
    width = '100%',
    height,
    color = theme.borders.default,
    dim = false,
    title,
    titleColor,
    margin = 0,
  } = props;

  // Default characters based on direction and render mode
  const defaultChar = direction === 'horizontal'
    ? chars.border.horizontal
    : chars.border.vertical;
  const requestedChar = sanitizeInlineInput(char ?? defaultChar);
  const divChar = segmentGraphemes(requestedChar)[0]?.segment ?? defaultChar;
  const validateLength = (
    value: number | string,
    name: string
  ): number | string => {
    if (typeof value === 'number') {
      if (!Number.isSafeInteger(value) || value < 0) {
        throw new RangeError(`${name} must be a non-negative safe integer`);
      }
      return value;
    }
    if (value !== 'fill' && !/^\d+(?:\.\d+)?%$/u.test(value)) {
      throw new RangeError(`${name} must be "fill", a percentage, or an integer`);
    }
    return value;
  };

  if (direction === 'horizontal') {
    const resolvedWidth = validateLength(width, 'Divider width');
    // Horizontal divider
    if (title) {
      // Divider with title: ──── Title ────
      return Box(
        { flexDirection: 'row', width: resolvedWidth, marginY: margin },
        Text({ color, dim }, divChar.repeat(3) + ' '),
        Text({ color: titleColor ?? theme.foreground.primary, bold: true }, title),
        Text({ color, dim }, ' ' + divChar.repeat(3))
      );
    }

    return {
      type: 'box',
      props: { width: resolvedWidth, flexDirection: 'row', marginY: margin },
      children: [{
        type: 'text',
        props: {
          color,
          dim,
          children: divChar,
          width: 'fill',
          flexGrow: 1,
          __divider: 'horizontal',
        },
        children: [],
      }],
    };
  } else {
    const compatibilityLength = width === '100%' ? 1 : width;
    const resolvedHeight = validateLength(
      height ?? compatibilityLength,
      'Divider height'
    );
    return {
      type: 'box',
      props: { marginX: margin, height: resolvedHeight },
      children: [{
        type: 'text',
        props: {
          color,
          dim,
          children: divChar,
          height: 'fill',
          __divider: 'vertical',
        },
        children: [],
      }],
    };
  }
}
