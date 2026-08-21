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
  TuiNode, 
  TuiChild, 
  BoxStyle 
} from '../utils/types.js';
import { warnIfRenderFunctionPatternMisused } from '../core/dev-warnings.js';
import { useConst } from '../hooks/use-const.js';
import { component, type ComponentKeyProps } from '../app/component.js';

/**
 * Normalize children into VNode array
 */
export function normalizeChildren(children: TuiNode): VNode[] {
  if (children === null || children === undefined || children === false || children === true) {
    return [];
  }

  if (Array.isArray(children)) {
    return children.flatMap(normalizeChildren);
  }

  if (typeof children === 'string' || typeof children === 'number') {
    return [Text({}, String(children))];
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
export function Box(props: BoxProps, ...children: TuiChild[]): VNode {
  return {
    type: 'box',
    key: props.key,
    props: { ...props },
    children: normalizeChildren(children),
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
  const content = filteredChildren.join('');

  return {
    type: 'text',
    key: props.key,
    props: { ...props, children: content },
    children: [],
  };
}

/** Zero-width anchor used to position the terminal cursor for IME candidate windows. */
export function CursorAnchor(active = true): VNode {
  return Text({ __cursorAnchor: active }, '');
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
  const {
    flex = 1,
    minSize = 0,
    x,
    y,
  } = props;
  const hasFixedAxis = x !== undefined || y !== undefined;

  return {
    type: 'spacer',
    props: {
      flexGrow: hasFixedAxis ? 0 : flex,
      flexShrink: 0,
      minWidth: x ?? minSize,
      minHeight: y ?? minSize,
      width: x,
      height: y,
    },
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
  const count = props.count ?? 1;
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new RangeError('Newline count must be a non-negative safe integer');
  }
  return {
    type: 'newline',
    props: { count },
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
export function Fragment(...children: TuiChild[]): VNode {
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
export function When(condition: unknown, ...children: TuiChild[]): VNode | null {
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
}

export function Transform(props: TransformProps, ...children: TuiChild[]): VNode {
  const { transform, accessibilityLabel, ...boxProps } = props;
  if (typeof transform !== 'function') {
    throw new TypeError('Transform requires a transform function');
  }
  let lineIndex = 0;
  const transformNode = (node: VNode): VNode => {
    if (node.type === 'text') {
      const lines = String(node.props.children ?? '').split('\n');
      const transformed = lines.map(line => transform(line, lineIndex++)).join('\n');
      return {
        ...node,
        props: { ...node.props, children: transformed },
      };
    }
    return {
      ...node,
      props: { ...node.props },
      children: node.children.map(transformNode),
    };
  };
  const content = normalizeChildren(children).map(transformNode);

  return {
    type: 'box',
    props: {
      ...boxProps,
      ...(accessibilityLabel ? { 'aria-label': accessibilityLabel } : {}),
    },
    children: content,
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
export interface StaticProps<T> extends ComponentKeyProps {
  /** Array of items to render */
  items: T[];
  /** Render function for each item */
  children: (item: T, index: number) => VNode;
  /** Optional styles for the container */
  style?: BoxStyle;
  /** Stable component identity when output must survive remounts */
  id?: string;
  /** Stable append-only identity for each item (defaults to its index) */
  getKey?: (item: T, index: number) => string | number;
}

let nextStaticInstanceId = 1;

function normalizeStaticKey(key: string | number): string {
  return `${typeof key}:${String(key)}`;
}

function renderStatic<T>(props: StaticProps<T>): VNode {
  warnIfRenderFunctionPatternMisused(
    'Static',
    'children',
    props.children,
    '`Static({ items, children: (item, index) => Row(item) })`',
  );

  const {
    items,
    children: render,
    style = {},
    id,
    getKey = (_item: T, index: number) => index,
  } = props;
  const state = useConst(() => ({
    instanceId: nextStaticInstanceId++,
    emittedKeys: new Set<string>(),
  }));
  const keys = items.map((item, index) =>
    normalizeStaticKey(getKey(item, index))
  );
  if (new Set(keys).size !== keys.length) {
    throw new Error('Static item keys must be unique');
  }

  const pending = items
    .map((item, index) => ({ item, index, key: keys[index]! }))
    .filter(entry => !state.emittedKeys.has(entry.key));
  const renderedItems = pending.map(entry => render(entry.item, entry.index));
  for (const entry of pending) state.emittedKeys.add(entry.key);
  const identity = id ?? `static-instance-${state.instanceId}`;
  const batchIdentity = pending.length > 0
    ? pending.map(entry => entry.key).join('|')
    : 'empty';

  return {
    type: 'box',
    props: {
      ...style,
      flexDirection: 'column',
      __static: true,
      __staticId: `${identity}:${batchIdentity}`,
    },
    children: renderedItems,
  };
}

export const Static = component('Static', renderStatic);

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

export function Slot(props: SlotProps, ...children: TuiChild[]): VNode {
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
