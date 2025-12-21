/**
 * Text - Styled text content
 */

import type { VNode, TextProps } from '../../utils/types.js';
import { setTextComponent } from './helpers.js';

/**
 * Text - Styled text content
 *
 * @example
 * Text({ color: 'red', bold: true }, 'Error!')
 */
export function Text(props: TextProps, ...children: (string | number)[]): VNode {
  const content = children.length > 0
    ? children.join('')
    : Array.isArray(props.children)
      ? props.children.join('')
      : String(props.children ?? '');

  return {
    type: 'text',
    props: { ...props, children: content },
    children: [],
  };
}

// Register Text component with helpers to avoid circular dependency
setTextComponent(Text);
