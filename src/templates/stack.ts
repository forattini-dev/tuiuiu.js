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

import { Box, normalizeChildren } from '../primitives/nodes.js';
import type { TuiChild, VNode } from '../utils/types.js';
export { Spacer } from '../primitives/nodes.js';
export type { SpacerProps } from '../utils/types.js';

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
}

/**
 * Vertical Stack - Arranges children vertically with optional gap
 *
 * @example
 * ```typescript
 * VStack({ gap: 1 },
 *   Text({}, 'Line 1'),
 *   Text({}, 'Line 2'),
 *   Text({}, 'Line 3'),
 * )
 *
 * // With alignment
 * VStack({ gap: 1, align: 'center' },
 *   Header(),
 *   Content(),
 *   Footer(),
 * )
 * ```
 */
export function VStack(props: VStackProps = {}, ...content: TuiChild[]): VNode {
  const children = normalizeChildren(content);

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
}

/**
 * Horizontal Stack - Arranges children horizontally with optional gap
 *
 * @example
 * ```typescript
 * HStack({ gap: 2 },
 *   Button({ label: 'Cancel' }),
 *   Button({ label: 'OK' }),
 * )
 *
 * // Space between items
 * HStack({ justify: 'between' },
 *   Logo(),
 *   Navigation(),
 *   UserMenu(),
 * )
 * ```
 */
export function HStack(props: HStackProps = {}, ...content: TuiChild[]): VNode {
  const children = normalizeChildren(content);

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
}

/**
 * Center - Centers content horizontally and/or vertically
 *
 * @example
 * ```typescript
 * // Center both ways (full screen)
 * Center({}, Modal({ content: Text({}, '...') }))
 *
 * // Center only horizontally
 * Center({ horizontal: true, vertical: false }, Title())
 *
 * // Center in a specific area
 * Center({ width: 40, height: 10 }, Spinner())
 * ```
 */
export function Center(props: CenterProps = {}, ...children: TuiChild[]): VNode {
  const {
    horizontal = true,
    vertical = true,
    width,
    height,
  } = props;
  const resolvedChildren = normalizeChildren(children);

  return Box(
    {
      width: width ?? 'fill',
      height: height ?? 'fill',
      flexDirection: 'column',
      alignItems: horizontal ? 'center' : 'flex-start',
      justifyContent: vertical ? 'center' : 'flex-start',
    },
    ...resolvedChildren
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
}

/**
 * FullScreen - Container that fills the entire terminal
 *
 * @example
 * ```typescript
 * FullScreen({ padding: 1 }, AppContent())
 *
 * // With background
 * FullScreen({ backgroundColor: 'blue' }, MainView())
 * ```
 */
export function FullScreen(props: FullScreenProps = {}, ...children: TuiChild[]): VNode {
  const {
    backgroundColor,
    padding = 0,
  } = props;

  return Box(
    {
      width: 'fill',
      height: 'fill',
      padding,
      backgroundColor,
      flexDirection: 'column',
    },
    ...children
  );
}

// =============================================================================
// SPACER - Flexible space
// =============================================================================

/**
 * Spacer - Flexible space that pushes siblings apart
 *
 * @example
 * ```typescript
 * // Push items to opposite ends
 * HStack({},
 *   Logo(),
 *   Spacer(),
 *   UserMenu(),
 * )
 *
 * // Equal spacing
 * HStack({},
 *   Item1(),
 *   Spacer(),
 *   Item2(),
 *   Spacer(),
 *   Item3(),
 * )
 * ```
 */
// =============================================================================
// DIVIDER - Re-export from primitives (canonical implementation)
// =============================================================================

export { Divider, type DividerProps } from '../primitives/divider.js';
