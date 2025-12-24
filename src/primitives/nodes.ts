/**
 * Core Primitives - Box, Text, and VNode factories
 *
 * This file contains the fundamental building blocks of the UI.
 * These are the atomic units that all other components are built upon.
 */

import type { 
  VNode, 
  BoxProps, 
  TextProps, 
  SpacerProps, 
  NewlineProps, 
  ReckNode, 
  ReckChild, 
  BoxStyle 
} from '../utils/types.js';

/**
 * Normalize children into VNode array
 */
export function normalizeChildren(children: ReckNode): VNode[] {
  if (children === null || children === undefined || children === false || children === true) {
    return [];
  }

  if (Array.isArray(children)) {
    return children.flatMap(normalizeChildren);
  }

  if (typeof children === 'string' || typeof children === 'number') {
    return [Text({ children: String(children) })];
  }

  return [children as VNode];
}

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

/**
 * Text - Styled text content
 *
 * @example
 * Text({ color: 'red', bold: true }, 'Error!')
 */
export function Text(props: TextProps, ...children: (string | number)[]): VNode {
  // Filter out null/undefined values to prevent "undefined" or "null" being rendered
  const filteredChildren = children.filter(c => c != null);
  const content = filteredChildren.length > 0
    ? filteredChildren.join('')
    : Array.isArray(props.children)
      ? props.children.filter(c => c != null).join('')
      : String(props.children ?? '');

  return {
    type: 'text',
    props: { ...props, children: content },
    children: [],
  };
}

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

/**
 * Slot - Reserved layout space for content that may appear/disappear
 *
 * The Slot pattern prevents layout shifts by always reserving space,
 * even when content is hidden. This is crucial for stable UX.
 *
 * @example
 * // Job output area - always reserves 5 lines even when no output
 * Slot({ visible: hasOutput, height: 5 },
 *   Text({}, output)
 * )
 *
 * // Conditionally show input, but never shift layout
 * Slot({ visible: showInput, minHeight: 1 },
 *   TextInput({ value: input, onChange: setInput })
 * )
 */
export interface SlotProps {
  /** Whether content is visible */
  visible: boolean;
  /** Fixed height when hidden (in lines) */
  height?: number;
  /** Minimum height (used when visible too) */
  minHeight?: number;
  /** Flex grow factor */
  flexGrow?: number;
  /** Fixed width */
  width?: number;
}

export function Slot(props: SlotProps, ...children: ReckChild[]): VNode {
  const { visible, height = 0, minHeight, flexGrow, width } = props;

  if (visible) {
    // When visible, render children with optional minHeight
    return Box(
      { flexDirection: 'column', minHeight: minHeight ?? height, flexGrow, width },
      ...children
    );
  }

  // When hidden, still reserve the space
  if (height === 0 && !minHeight) {
    return Box({ height: 0 });
  }

  return Box({ height: minHeight ?? height, flexGrow, width });
}
