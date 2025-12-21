/**
 * Box - Container with flexbox layout
 */

import type { VNode, BoxProps, ReckChild } from '../../utils/types.js';
import { normalizeChildren } from './helpers.js';
// Import text to ensure it's initialized
import './text.js';

/**
 * Box - Container with flexbox layout
 *
 * @example
 * Box({ flexDirection: 'row', padding: 1 },
 *   Text({ color: 'cyan' }, 'Hello'),
 *   Text({ color: 'green' }, 'World')
 * )
 */
export function Box(props: BoxProps, ...children: ReckChild[]): VNode {
  return {
    type: 'box',
    props: { ...props },
    children: normalizeChildren(children.length > 0 ? children : props.children),
  };
}
