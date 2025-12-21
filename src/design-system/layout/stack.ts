/**
 * Stack Layouts - Basic stacking and arrangement components
 *
 * Provides simple, composable layout primitives:
 * - VStack: Vertical stack with configurable gap
 * - HStack: Horizontal stack with configurable gap
 * - Center: Centers content horizontally and/or vertically
 * - FullScreen: Container that fills the terminal
 * - Spacer: Flexible space that pushes siblings apart
 */

import { Box } from '../../primitives/nodes.js';
import type { VNode } from '../../utils/types.js';

// =============================================================================
// VSTACK - Vertical Stack
// =============================================================================

export interface VStackProps {
  /** Gap between children (in lines) */
  gap?: number;
  /** Horizontal alignment */
  align?: 'left' | 'center' | 'right' | 'stretch';
  /** Padding inside the stack */
  padding?: number;
  /** Padding horizontal */
  paddingX?: number;
  /** Padding vertical */
  paddingY?: number;
  /** Fixed width */
  width?: number | string;
  /** Fixed height */
  height?: number | string;
  /** Border around stack */
  border?: boolean;
  /** Border style */
  borderStyle?: 'single' | 'double' | 'round' | 'bold';
  /** Border color */
  borderColor?: string;
  /** Children nodes */
  children: VNode[];
}

/**
 * Vertical Stack - Arranges children vertically with optional gap
 *
 * @example
 * ```typescript
 * VStack({ gap: 1 }, [
 *   Text({}, 'Line 1'),
 *   Text({}, 'Line 2'),
 *   Text({}, 'Line 3'),
 * ])
 *
 * // With alignment
 * VStack({ gap: 1, align: 'center' }, [
 *   Header(),
 *   Content(),
 *   Footer(),
 * ])
 * ```
 */
export function VStack(props: VStackProps): VNode;
export function VStack(children: VNode[]): VNode;
export function VStack(propsOrChildren: VStackProps | VNode[]): VNode {
  // Handle both signatures
  const isArray = Array.isArray(propsOrChildren);
  const props: VStackProps = isArray ? { children: propsOrChildren } : propsOrChildren;

  const {
    gap = 0,
    align = 'stretch',
    padding,
    paddingX,
    paddingY,
    width,
    height,
    border = false,
    borderStyle = 'single',
    borderColor,
    children,
  } = props;

  // Map alignment to flexbox
  const alignItems = align === 'left' ? 'flex-start'
    : align === 'right' ? 'flex-end'
    : align === 'center' ? 'center'
    : 'stretch';

  // Insert spacers between children for gap
  const spacedChildren: VNode[] = [];
  for (let i = 0; i < children.length; i++) {
    spacedChildren.push(children[i]);
    if (gap > 0 && i < children.length - 1) {
      spacedChildren.push(Box({ height: gap }));
    }
  }

  return Box(
    {
      flexDirection: 'column',
      alignItems,
      padding,
      paddingX,
      paddingY,
      width,
      height,
      borderStyle: border ? borderStyle : undefined,
      borderColor: border ? borderColor : undefined,
    },
    ...spacedChildren
  );
}

// =============================================================================
// HSTACK - Horizontal Stack
// =============================================================================

export interface HStackProps {
  /** Gap between children (in characters) */
  gap?: number;
  /** Vertical alignment */
  align?: 'top' | 'center' | 'bottom' | 'stretch';
  /** Horizontal distribution */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  /** Padding inside the stack */
  padding?: number;
  /** Padding horizontal */
  paddingX?: number;
  /** Padding vertical */
  paddingY?: number;
  /** Fixed width */
  width?: number | string;
  /** Fixed height */
  height?: number | string;
  /** Border around stack */
  border?: boolean;
  /** Border style */
  borderStyle?: 'single' | 'double' | 'round' | 'bold';
  /** Border color */
  borderColor?: string;
  /** Children nodes */
  children: VNode[];
}

/**
 * Horizontal Stack - Arranges children horizontally with optional gap
 *
 * @example
 * ```typescript
 * HStack({ gap: 2 }, [
 *   Button({ label: 'Cancel' }),
 *   Button({ label: 'OK' }),
 * ])
 *
 * // Space between items
 * HStack({ justify: 'between' }, [
 *   Logo(),
 *   Navigation(),
 *   UserMenu(),
 * ])
 * ```
 */
export function HStack(props: HStackProps): VNode;
export function HStack(children: VNode[]): VNode;
export function HStack(propsOrChildren: HStackProps | VNode[]): VNode {
  const isArray = Array.isArray(propsOrChildren);
  const props: HStackProps = isArray ? { children: propsOrChildren } : propsOrChildren;

  const {
    gap = 0,
    align = 'stretch',
    justify = 'start',
    padding,
    paddingX,
    paddingY,
    width,
    height,
    border = false,
    borderStyle = 'single',
    borderColor,
    children,
  } = props;

  // Map alignment
  const alignItems = align === 'top' ? 'flex-start'
    : align === 'bottom' ? 'flex-end'
    : align === 'center' ? 'center'
    : 'stretch';

  // Map justify
  const justifyContent = justify === 'start' ? 'flex-start'
    : justify === 'end' ? 'flex-end'
    : justify === 'center' ? 'center'
    : justify === 'between' ? 'space-between'
    : justify === 'around' ? 'space-around'
    : 'flex-start';

  // Insert spacers between children for gap
  const spacedChildren: VNode[] = [];
  for (let i = 0; i < children.length; i++) {
    spacedChildren.push(children[i]);
    if (gap > 0 && i < children.length - 1) {
      spacedChildren.push(Box({ width: gap }));
    }
  }

  return Box(
    {
      flexDirection: 'row',
      alignItems,
      justifyContent,
      padding,
      paddingX,
      paddingY,
      width,
      height,
      borderStyle: border ? borderStyle : undefined,
      borderColor: border ? borderColor : undefined,
    },
    ...spacedChildren
  );
}

// =============================================================================
// CENTER - Centers content
// =============================================================================

export interface CenterProps {
  /** Center horizontally */
  horizontal?: boolean;
  /** Center vertically */
  vertical?: boolean;
  /** Fixed width (defaults to terminal width) */
  width?: number;
  /** Fixed height (defaults to terminal height) */
  height?: number;
  /** Child node */
  children: VNode;
}

/**
 * Center - Centers content horizontally and/or vertically
 *
 * @example
 * ```typescript
 * // Center both ways (full screen)
 * Center({ children: Modal({ content: '...' }) })
 *
 * // Center only horizontally
 * Center({ horizontal: true, vertical: false, children: Title() })
 *
 * // Center in a specific area
 * Center({ width: 40, height: 10, children: Spinner() })
 * ```
 */
export function Center(props: CenterProps): VNode {
  const {
    horizontal = true,
    vertical = true,
    width,
    height,
    children,
  } = props;

  const termWidth = width ?? (process.stdout.columns || 80);
  const termHeight = height ?? (process.stdout.rows || 24);

  return Box(
    {
      width: termWidth,
      height: termHeight,
      flexDirection: 'column',
      alignItems: horizontal ? 'center' : 'flex-start',
      justifyContent: vertical ? 'center' : 'flex-start',
    },
    children
  );
}

// =============================================================================
// FULLSCREEN - Full terminal container
// =============================================================================

export interface FullScreenProps {
  /** Background character */
  background?: string;
  /** Background color */
  backgroundColor?: string;
  /** Padding from edges */
  padding?: number;
  /** Child node */
  children: VNode;
}

/**
 * FullScreen - Container that fills the entire terminal
 *
 * @example
 * ```typescript
 * FullScreen({
 *   padding: 1,
 *   children: AppContent()
 * })
 *
 * // With background
 * FullScreen({
 *   backgroundColor: 'blue',
 *   children: MainView()
 * })
 * ```
 */
export function FullScreen(props: FullScreenProps): VNode {
  const {
    backgroundColor,
    padding = 0,
    children,
  } = props;

  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;

  return Box(
    {
      width: termWidth,
      height: termHeight,
      padding,
      backgroundColor,
      flexDirection: 'column',
    },
    children
  );
}

// =============================================================================
// SPACER - Flexible space
// =============================================================================

export interface SpacerProps {
  /** Flex grow value (default: 1) */
  flex?: number;
  /** Minimum size */
  minSize?: number;
}

/**
 * Spacer - Flexible space that pushes siblings apart
 *
 * @example
 * ```typescript
 * // Push items to opposite ends
 * HStack({ children: [
 *   Logo(),
 *   Spacer(),
 *   UserMenu(),
 * ]})
 *
 * // Equal spacing
 * HStack({ children: [
 *   Item1(),
 *   Spacer(),
 *   Item2(),
 *   Spacer(),
 *   Item3(),
 * ]})
 * ```
 */
export function Spacer(props: SpacerProps = {}): VNode {
  const { flex = 1, minSize = 0 } = props;

  return Box({
    flexGrow: flex,
    flexShrink: 0,
    minWidth: minSize,
    minHeight: minSize,
  });
}

// =============================================================================
// DIVIDER - Re-export from primitives (canonical implementation)
// =============================================================================

export { Divider, type DividerProps } from '../../primitives/divider.js';
