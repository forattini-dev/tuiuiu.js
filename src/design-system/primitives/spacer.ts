/**
 * Spacer, Newline, Fragment - Layout utilities
 */

import type { VNode, SpacerProps, NewlineProps, ReckChild } from '../../utils/types.js';
import { normalizeChildren } from './helpers.js';
// Import text to ensure it's initialized
import './text.js';

/**
 * Spacer - Flexible space that expands
 *
 * @example
 * Box({ flexDirection: 'row' },
 *   Text({}, 'Left'),
 *   Spacer(),
 *   Text({}, 'Right')
 * )
 */
export function Spacer(props: SpacerProps = {}): VNode {
  return {
    type: 'spacer',
    props: { flexGrow: 1, ...props },
    children: [],
  };
}

/**
 * Newline - Insert blank lines
 *
 * @example
 * Newline({ count: 2 })
 */
export function Newline(props: NewlineProps = {}): VNode {
  return {
    type: 'newline',
    props: { count: props.count ?? 1 },
    children: [],
  };
}

/**
 * Fragment - Group children without wrapper
 *
 * @example
 * Fragment(
 *   Text({}, 'Line 1'),
 *   Text({}, 'Line 2')
 * )
 */
export function Fragment(...children: ReckChild[]): VNode {
  return {
    type: 'fragment',
    props: {},
    children: normalizeChildren(children),
  };
}
