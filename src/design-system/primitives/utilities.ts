/**
 * Utility components - When, Each, Transform, Static
 */

import type { VNode, ReckNode, ReckChild, BoxStyle } from '../../utils/types.js';
import { Fragment } from './spacer.js';
import { normalizeChildren } from './helpers.js';

/**
 * Conditional rendering helper
 *
 * @example
 * When(isLoading,
 *   Text({}, 'Loading...')
 * )
 */
export function When(condition: boolean, ...children: ReckChild[]): VNode | null {
  if (!condition) return null as any;
  return Fragment(...children);
}

/**
 * Map helper for rendering lists
 *
 * @example
 * Each(items, (item, i) =>
 *   Text({ key: i }, item.name)
 * )
 */
export function Each<T>(items: T[], render: (item: T, index: number) => VNode): VNode {
  return Fragment(...items.map(render));
}

/**
 * Transform - Apply a transformation function to rendered text output
 *
 * Useful for:
 * - Gradient effects
 * - Text animations
 * - Custom styling
 *
 * @example
 * Transform({
 *   transform: (text, index) => text.toUpperCase()
 * },
 *   Text({}, 'hello world')
 * )
 */
export interface TransformProps extends BoxStyle {
  /** Function to transform rendered text */
  transform: (text: string, lineIndex: number) => string;
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  children?: ReckNode;
}

export function Transform(props: TransformProps, ...children: ReckChild[]): VNode {
  const { transform, accessibilityLabel, ...boxProps } = props;
  return {
    type: 'box',
    props: {
      ...boxProps,
      __transform: transform,
      __accessibilityLabel: accessibilityLabel,
    },
    children: normalizeChildren(children.length > 0 ? children : props.children),
  };
}

/**
 * Static - Permanently render items above dynamic content
 *
 * Items rendered here stay fixed at the top and don't get re-rendered.
 * Useful for:
 * - Completed task lists
 * - Log messages
 * - Progress history
 *
 * @example
 * Static({
 *   items: completedTasks,
 *   children: (task, i) => Text({ key: i, color: 'green' }, `✓ ${task.name}`)
 * })
 */
export interface StaticProps<T> {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  children: (item: T, index: number) => VNode;
  /** Optional styles for the container */
  style?: BoxStyle;
}

export function Static<T>(props: StaticProps<T>): VNode {
  const { items, children: render, style = {} } = props;

  const renderedItems = items.map((item, index) => render(item, index));

  return {
    type: 'box',
    props: {
      ...style,
      position: 'absolute',
      flexDirection: 'column',
      __static: true,
    },
    children: renderedItems,
  };
}
