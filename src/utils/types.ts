/**
 * Reck Types - Component and VNode definitions
 */

/** Color names supported */
export type ForegroundColorName =
  | 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey'
  | 'blackBright' | 'redBright' | 'greenBright' | 'yellowBright' | 'blueBright' | 'magentaBright' | 'cyanBright' | 'whiteBright';

/** Box style properties (flexbox layout) */
export interface BoxStyle {
  // Display & Position
  display?: 'flex' | 'none';
  position?: 'relative' | 'absolute';

  // Flex container properties
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
  flexWrap?: 'wrap' | 'nowrap' | 'wrap-reverse';

  // Flex item properties
  flexGrow?: number;
  flexShrink?: number;
  flexBasis?: number | 'auto' | 'content';
  flex?: number; // Shorthand for grow/shrink/basis

  // Alignment
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'space-between' | 'space-around';

  // Spacing - Padding
  padding?: number;
  paddingX?: number;
  paddingY?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;

  // Spacing - Margin
  margin?: number | 'auto';
  marginX?: number | 'auto';
  marginY?: number | 'auto';
  marginTop?: number | 'auto';
  marginBottom?: number | 'auto';
  marginLeft?: number | 'auto';
  marginRight?: number | 'auto';

  // Gap
  gap?: number;
  columnGap?: number;
  rowGap?: number;

  // Size
  width?: number | string;
  height?: number | string;
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;

  // Absolute positioning offsets (when position: 'absolute')
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;

  // Border - Extended styles (inspired by textual, cli-boxes, and more)
  borderStyle?: BorderStyleName;
  borderColor?: ColorValue;
  borderTopColor?: ColorValue;
  borderBottomColor?: ColorValue;
  borderLeftColor?: ColorValue;
  borderRightColor?: ColorValue;
  borderDim?: boolean;
  borderDimTop?: boolean;
  borderDimBottom?: boolean;
  borderDimLeft?: boolean;
  borderDimRight?: boolean;
  // Per-side border visibility (from ink)
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;

  // Overflow
  overflow?: 'visible' | 'hidden';
  overflowX?: 'visible' | 'hidden';
  overflowY?: 'visible' | 'hidden';

  // Background color (for filled backgrounds)
  backgroundColor?: ColorValue;
}

/** Text style properties */
export interface TextStyle {
  color?: ColorValue;
  backgroundColor?: ColorValue;
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  inverse?: boolean;
  wrap?: 'wrap' | 'truncate' | 'truncate-start' | 'truncate-middle' | 'truncate-end';
}

export type ColorValue = ForegroundColorName | string;

/** Box style props (alias for BoxStyle) */
export type BoxStyleProps = BoxStyle;

/** Text style props (alias for TextStyle) */
export type TextStyleProps = TextStyle;

// =============================================================================
// Mouse Event Types
// =============================================================================

/** Mouse button types */
export type MouseButton = 'left' | 'right' | 'middle' | 'scroll-up' | 'scroll-down' | 'none';

/** Mouse event data passed to handlers */
export interface MouseEventData {
  /** Column position (0-indexed, relative to element) */
  x: number;
  /** Row position (0-indexed, relative to element) */
  y: number;
  /** Absolute column position on screen */
  absoluteX: number;
  /** Absolute row position on screen */
  absoluteY: number;
  /** Which button was pressed/released */
  button: MouseButton;
  /** Modifier keys held during the event */
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
  /** The target element */
  target: VNode | null;
  /** Stop event from bubbling to parent elements */
  stopPropagation: () => void;
}

/** Mouse event handler function */
export type MouseEventHandler = (event: MouseEventData) => void;

/** Common mouse event props for interactive elements */
export interface MouseEventProps {
  /** Called when element is clicked (left mouse button) */
  onClick?: MouseEventHandler;
  /** Called when element is double-clicked */
  onDoubleClick?: MouseEventHandler;
  /** Called when any mouse button is pressed on element */
  onMouseDown?: MouseEventHandler;
  /** Called when any mouse button is released on element */
  onMouseUp?: MouseEventHandler;
  /** Called when mouse moves over element */
  onMouseMove?: MouseEventHandler;
  /** Called when mouse enters element bounds */
  onMouseEnter?: MouseEventHandler;
  /** Called when mouse leaves element bounds */
  onMouseLeave?: MouseEventHandler;
  /** Called on right-click (context menu) */
  onContextMenu?: MouseEventHandler;
  /** Called on scroll wheel */
  onScroll?: MouseEventHandler;
}

// =============================================================================
// Component Props
// =============================================================================

/** Box component props */
export interface BoxProps extends BoxStyle, MouseEventProps {
  /** Unique key for reconciliation */
  key?: string | number;
  /** Child elements */
  children?: ReckNode;
}

/** Text component props */
export interface TextProps extends TextStyle, MouseEventProps {
  /** Unique key for reconciliation */
  key?: string | number;
  /** Text content */
  children?: string | number | (string | number)[];
}

/** Spacer props */
export interface SpacerProps {
  // Spacer takes all available space
}

/** Newline props */
export interface NewlineProps {
  count?: number;
}

/** Virtual Node types */
export type VNodeType = 'box' | 'text' | 'spacer' | 'newline' | 'fragment';

export interface VNode {
  type: VNodeType;
  props: Record<string, any>;
  children: VNode[];
  key?: string | number;
}

/** What can be a child of a component */
export type ReckChild = VNode | string | number | boolean | null | undefined;
export type ReckNode = ReckChild | ReckChild[];

/** Component function type */
export type Component<P = {}> = (props: P) => VNode | null;

/** Border style names */
export type BorderStyleName =
  // Basic styles
  | 'single'
  | 'double'
  | 'round'
  | 'bold'
  | 'heavy' // Alias for bold
  // Mixed styles (from cli-boxes)
  | 'singleDouble'
  | 'doubleSingle'
  // ASCII styles
  | 'classic'
  | 'ascii' // Alias for classic
  | 'asciiDouble'
  | 'markdown'
  // Arrow style
  | 'arrow'
  // Dashed styles
  | 'dashed'
  | 'dashedHeavy'
  // Head styles (heavy/double on top only)
  | 'heavyHead'
  | 'doubleHead'
  // Edge styles (heavy/double on sides only)
  | 'heavyEdge'
  | 'doubleEdge'
  // Minimal styles (top/bottom only)
  | 'minimal'
  | 'minimalHeavy'
  | 'minimalDouble'
  // Horizontals (no sides)
  | 'horizontals'
  // Block styles (from textual)
  | 'inner'
  | 'outer'
  | 'thick'
  | 'block'
  // Key styles (from textual)
  | 'hkey'
  | 'vkey'
  // Panel styles (from textual)
  | 'tall'
  | 'panel'
  | 'tab'
  | 'wide'
  // Hidden
  | 'none'
  | 'hidden'
  | 'blank';

/** Border characters */
export interface BorderChars {
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
  top: string;
  bottom: string;
  left: string;
  right: string;
}

export const BORDER_STYLES: Record<BorderStyleName, BorderChars> = {
  // ==========================================================================
  // Basic styles
  // ==========================================================================
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    top: '─',
    bottom: '─',
    left: '│',
    right: '│',
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    top: '═',
    bottom: '═',
    left: '║',
    right: '║',
  },
  round: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    top: '─',
    bottom: '─',
    left: '│',
    right: '│',
  },
  bold: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    top: '━',
    bottom: '━',
    left: '┃',
    right: '┃',
  },
  // Alias for bold (textual naming)
  heavy: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    top: '━',
    bottom: '━',
    left: '┃',
    right: '┃',
  },

  // ==========================================================================
  // Mixed styles (from cli-boxes)
  // ==========================================================================
  // Single horizontal, double vertical
  singleDouble: {
    topLeft: '╓',
    topRight: '╖',
    bottomLeft: '╙',
    bottomRight: '╜',
    top: '─',
    bottom: '─',
    left: '║',
    right: '║',
  },
  // Double horizontal, single vertical
  doubleSingle: {
    topLeft: '╒',
    topRight: '╕',
    bottomLeft: '╘',
    bottomRight: '╛',
    top: '═',
    bottom: '═',
    left: '│',
    right: '│',
  },

  // ==========================================================================
  // ASCII styles
  // ==========================================================================
  classic: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    top: '-',
    bottom: '-',
    left: '|',
    right: '|',
  },
  // Alias for classic (textual naming)
  ascii: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    top: '-',
    bottom: '-',
    left: '|',
    right: '|',
  },
  // ASCII with double lines using =
  asciiDouble: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    top: '=',
    bottom: '=',
    left: '|',
    right: '|',
  },
  // Markdown table style
  markdown: {
    topLeft: '|',
    topRight: '|',
    bottomLeft: '|',
    bottomRight: '|',
    top: '-',
    bottom: '-',
    left: '|',
    right: '|',
  },

  // ==========================================================================
  // Arrow style (from cli-boxes)
  // ==========================================================================
  arrow: {
    topLeft: '↘',
    topRight: '↙',
    bottomLeft: '↗',
    bottomRight: '↖',
    top: '↓',
    bottom: '↑',
    left: '→',
    right: '←',
  },

  // ==========================================================================
  // Dashed styles (from textual)
  // ==========================================================================
  dashed: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    top: '╌',
    bottom: '╌',
    left: '╎',
    right: '╎',
  },
  // Heavy dashed (from textual)
  dashedHeavy: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    top: '╍',
    bottom: '╍',
    left: '╏',
    right: '╏',
  },

  // ==========================================================================
  // Head styles (heavy/double on top, single elsewhere)
  // ==========================================================================
  // Heavy top border, single sides
  heavyHead: {
    topLeft: '┎',
    topRight: '┒',
    bottomLeft: '└',
    bottomRight: '┘',
    top: '━',
    bottom: '─',
    left: '│',
    right: '│',
  },
  // Double top border, single sides
  doubleHead: {
    topLeft: '╒',
    topRight: '╕',
    bottomLeft: '└',
    bottomRight: '┘',
    top: '═',
    bottom: '─',
    left: '│',
    right: '│',
  },

  // ==========================================================================
  // Edge styles (heavy/double on sides, single top/bottom)
  // ==========================================================================
  // Heavy sides, single top/bottom
  heavyEdge: {
    topLeft: '┍',
    topRight: '┑',
    bottomLeft: '┕',
    bottomRight: '┙',
    top: '─',
    bottom: '─',
    left: '┃',
    right: '┃',
  },
  // Double sides, single top/bottom
  doubleEdge: {
    topLeft: '╓',
    topRight: '╖',
    bottomLeft: '╙',
    bottomRight: '╜',
    top: '─',
    bottom: '─',
    left: '║',
    right: '║',
  },

  // ==========================================================================
  // Minimal styles (top/bottom only, no corners)
  // ==========================================================================
  // Simple horizontal lines
  minimal: {
    topLeft: '─',
    topRight: '─',
    bottomLeft: '─',
    bottomRight: '─',
    top: '─',
    bottom: '─',
    left: ' ',
    right: ' ',
  },
  // Heavy horizontal lines
  minimalHeavy: {
    topLeft: '━',
    topRight: '━',
    bottomLeft: '━',
    bottomRight: '━',
    top: '━',
    bottom: '━',
    left: ' ',
    right: ' ',
  },
  // Double horizontal lines
  minimalDouble: {
    topLeft: '═',
    topRight: '═',
    bottomLeft: '═',
    bottomRight: '═',
    top: '═',
    bottom: '═',
    left: ' ',
    right: ' ',
  },
  // Only top/bottom, no sides
  horizontals: {
    topLeft: ' ',
    topRight: ' ',
    bottomLeft: ' ',
    bottomRight: ' ',
    top: '─',
    bottom: '─',
    left: ' ',
    right: ' ',
  },

  // ==========================================================================
  // Block styles (from textual)
  // ==========================================================================
  // Inner block border
  inner: {
    topLeft: '▗',
    topRight: '▖',
    bottomLeft: '▝',
    bottomRight: '▘',
    top: '▄',
    bottom: '▀',
    left: '▐',
    right: '▌',
  },
  // Outer block border
  outer: {
    topLeft: '▛',
    topRight: '▜',
    bottomLeft: '▙',
    bottomRight: '▟',
    top: '▀',
    bottom: '▄',
    left: '▌',
    right: '▐',
  },
  // Thick block border (full blocks)
  thick: {
    topLeft: '█',
    topRight: '█',
    bottomLeft: '█',
    bottomRight: '█',
    top: '▀',
    bottom: '▄',
    left: '█',
    right: '█',
  },
  // Block style
  block: {
    topLeft: '▄',
    topRight: '▄',
    bottomLeft: '▀',
    bottomRight: '▀',
    top: '▄',
    bottom: '▀',
    left: '█',
    right: '█',
  },

  // ==========================================================================
  // Key styles (from textual)
  // ==========================================================================
  // Horizontal key (top/bottom lines only)
  hkey: {
    topLeft: '▔',
    topRight: '▔',
    bottomLeft: '▁',
    bottomRight: '▁',
    top: '▔',
    bottom: '▁',
    left: ' ',
    right: ' ',
  },
  // Vertical key (side lines only)
  vkey: {
    topLeft: '▏',
    topRight: '▕',
    bottomLeft: '▏',
    bottomRight: '▕',
    top: ' ',
    bottom: ' ',
    left: '▏',
    right: '▕',
  },

  // ==========================================================================
  // Panel styles (from textual)
  // ==========================================================================
  // Tall panel style
  tall: {
    topLeft: '▊',
    topRight: '▎',
    bottomLeft: '▊',
    bottomRight: '▎',
    top: '▔',
    bottom: '▁',
    left: '▊',
    right: '▎',
  },
  // Full panel style
  panel: {
    topLeft: '▊',
    topRight: '▎',
    bottomLeft: '▊',
    bottomRight: '▎',
    top: '█',
    bottom: '▁',
    left: '▊',
    right: '▎',
  },
  // Tab style
  tab: {
    topLeft: '▁',
    topRight: '▁',
    bottomLeft: '▔',
    bottomRight: '▔',
    top: '▁',
    bottom: '▔',
    left: '▎',
    right: '▊',
  },
  // Wide style
  wide: {
    topLeft: '▁',
    topRight: '▁',
    bottomLeft: '▔',
    bottomRight: '▔',
    top: '▁',
    bottom: '▔',
    left: '▎',
    right: '▊',
  },

  // ==========================================================================
  // Hidden styles
  // ==========================================================================
  none: {
    topLeft: ' ',
    topRight: ' ',
    bottomLeft: ' ',
    bottomRight: ' ',
    top: ' ',
    bottom: ' ',
    left: ' ',
    right: ' ',
  },
  hidden: {
    topLeft: ' ',
    topRight: ' ',
    bottomLeft: ' ',
    bottomRight: ' ',
    top: ' ',
    bottom: ' ',
    left: ' ',
    right: ' ',
  },
  blank: {
    topLeft: ' ',
    topRight: ' ',
    bottomLeft: ' ',
    bottomRight: ' ',
    top: ' ',
    bottom: ' ',
    left: ' ',
    right: ' ',
  },
};

/**
 * Get border characters for a given style name.
 * Falls back to 'single' if the style is not found.
 */
export function getBorderChars(style: BorderStyleName | string): BorderChars {
  return BORDER_STYLES[style as BorderStyleName] || BORDER_STYLES.single;
}

/**
 * List all available border style names.
 */
export function listBorderStyles(): BorderStyleName[] {
  return Object.keys(BORDER_STYLES) as BorderStyleName[];
}

/** Computed layout for a node */
export interface LayoutNode {
  x: number;
  y: number;
  width: number;
  height: number;
  node: VNode;
  children: LayoutNode[];
}

/** Render context passed through the tree */
export interface RenderContext {
  width: number;
  height: number;
  x: number;
  y: number;
}
