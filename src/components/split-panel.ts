/**
 * Split Panel Component - Two-column/row layouts for Reck
 *
 * Features:
 * - Horizontal split (side by side)
 * - Vertical split (stacked)
 * - Fixed or percentage widths
 * - Resizable divider
 * - Collapsible panels
 *
 * @example
 * ```typescript
 * import { SplitPanel, createSplitPanel } from './split-panel.js';
 *
 * // Fixed split
 * SplitPanel({
 *   left: MyLeftPanel(),
 *   right: MyRightPanel(),
 *   leftWidth: 30,
 *   divider: true
 * })
 *
 * // Percentage split
 * SplitPanel({
 *   left: Sidebar(),
 *   right: Content(),
 *   ratio: 0.3, // 30% left, 70% right
 * })
 * ```
 */

import { Box, Text } from './components.js';
import type { VNode } from '../utils/types.js';
import { stringWidth } from '../utils/text-utils.js';

/**
 * Border characters for split dividers
 */
const DIVIDER_CHARS = {
  vertical: {
    line: '│',
    double: '║',
    dotted: '┊',
    dashed: '┆',
    thick: '┃',
  },
  horizontal: {
    line: '─',
    double: '═',
    dotted: '┈',
    dashed: '┄',
    thick: '━',
  },
};

export type DividerStyle = 'line' | 'double' | 'dotted' | 'dashed' | 'thick' | 'none';

/**
 * Split Panel Props
 */
export interface SplitPanelProps {
  /** Left/top panel content */
  left: VNode;
  /** Right/bottom panel content */
  right: VNode;
  /** Split direction */
  direction?: 'horizontal' | 'vertical';
  /** Left/top panel fixed width (in characters) */
  leftWidth?: number;
  /** Right/bottom panel fixed width (in characters) */
  rightWidth?: number;
  /** Split ratio (0-1, percentage of left/top panel) */
  ratio?: number;
  /** Show divider between panels */
  divider?: boolean;
  /** Divider style */
  dividerStyle?: DividerStyle;
  /** Divider color */
  dividerColor?: string;
  /** Gap between panels (when no divider) */
  gap?: number;
  /** Border around the entire split panel */
  border?: boolean;
  /** Border style */
  borderStyle?: 'single' | 'double' | 'round';
  /** Border color */
  borderColor?: string;
  /** Minimum width for each panel */
  minWidth?: number;
  /** Panel titles */
  leftTitle?: string;
  rightTitle?: string;
  /** Title colors */
  leftTitleColor?: string;
  rightTitleColor?: string;
}

/**
 * Render a vertical divider
 */
function VerticalDivider(props: {
  height: number;
  style: DividerStyle;
  color?: string;
}): VNode {
  const { height, style, color = 'gray' } = props;

  if (style === 'none') {
    return Box({});
  }

  const char = DIVIDER_CHARS.vertical[style] || DIVIDER_CHARS.vertical.line;
  const lines = Array(height).fill(char).join('\n');

  return Box(
    { flexDirection: 'column' },
    Text({ color, dim: style === 'dotted' || style === 'dashed' }, lines)
  );
}

/**
 * Render a horizontal divider
 */
function HorizontalDivider(props: {
  width: number;
  style: DividerStyle;
  color?: string;
}): VNode {
  const { width, style, color = 'gray' } = props;

  if (style === 'none') {
    return Box({});
  }

  const char = DIVIDER_CHARS.horizontal[style] || DIVIDER_CHARS.horizontal.line;
  const line = char.repeat(width);

  return Text({ color, dim: style === 'dotted' || style === 'dashed' }, line);
}

/**
 * Panel header with title
 */
function PanelHeader(props: {
  title: string;
  width: number;
  color?: string;
  align?: 'left' | 'center' | 'right';
}): VNode {
  const { title, width, color = 'cyan', align = 'left' } = props;

  let paddedTitle = title;
  const padding = width - stringWidth(title);

  if (padding > 0) {
    switch (align) {
      case 'center':
        const leftPad = Math.floor(padding / 2);
        paddedTitle = ' '.repeat(leftPad) + title + ' '.repeat(padding - leftPad);
        break;
      case 'right':
        paddedTitle = ' '.repeat(padding) + title;
        break;
      default:
        paddedTitle = title + ' '.repeat(padding);
    }
  }

  return Text({ color, bold: true }, paddedTitle.slice(0, width));
}

/**
 * Split Panel Component
 *
 * Creates a two-panel layout with customizable split ratio and divider.
 *
 * @example
 * ```typescript
 * // Side-by-side panels with divider
 * SplitPanel({
 *   left: NavigationPanel(),
 *   right: ContentPanel(),
 *   ratio: 0.25,
 *   divider: true,
 *   dividerStyle: 'line',
 *   leftTitle: 'Navigation',
 *   rightTitle: 'Content'
 * })
 *
 * // Stacked panels (top/bottom)
 * SplitPanel({
 *   left: HeaderPanel(),
 *   right: BodyPanel(),
 *   direction: 'vertical',
 *   leftWidth: 3, // 3 lines for header
 * })
 * ```
 */
export function SplitPanel(props: SplitPanelProps): VNode {
  const {
    left,
    right,
    direction = 'horizontal',
    leftWidth,
    rightWidth,
    ratio = 0.5,
    divider = false,
    dividerStyle = 'line',
    dividerColor = 'gray',
    gap = 0,
    border = false,
    borderStyle = 'single',
    borderColor = 'gray',
    minWidth = 10,
    leftTitle,
    rightTitle,
    leftTitleColor = 'cyan',
    rightTitleColor = 'cyan',
  } = props;

  // Calculate terminal dimensions
  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;

  // Calculate panel dimensions
  let leftSize: number;
  let rightSize: number;
  const dividerSize = divider && dividerStyle !== 'none' ? 1 : gap;

  if (direction === 'horizontal') {
    const availableWidth = termWidth - dividerSize - (border ? 2 : 0);

    if (leftWidth !== undefined) {
      leftSize = Math.min(leftWidth, availableWidth - minWidth);
      rightSize = availableWidth - leftSize;
    } else if (rightWidth !== undefined) {
      rightSize = Math.min(rightWidth, availableWidth - minWidth);
      leftSize = availableWidth - rightSize;
    } else {
      leftSize = Math.floor(availableWidth * ratio);
      rightSize = availableWidth - leftSize;
    }
  } else {
    const availableHeight = termHeight - dividerSize - (border ? 2 : 0);

    if (leftWidth !== undefined) {
      leftSize = Math.min(leftWidth, availableHeight - 2);
      rightSize = availableHeight - leftSize;
    } else if (rightWidth !== undefined) {
      rightSize = Math.min(rightWidth, availableHeight - 2);
      leftSize = availableHeight - rightSize;
    } else {
      leftSize = Math.floor(availableHeight * ratio);
      rightSize = availableHeight - leftSize;
    }
  }

  // Build panel content
  const leftPanel = Box(
    {
      width: direction === 'horizontal' ? leftSize : undefined,
      height: direction === 'vertical' ? leftSize : undefined,
      flexDirection: 'column',
    },
    leftTitle
      ? PanelHeader({
          title: leftTitle,
          width: direction === 'horizontal' ? leftSize : termWidth,
          color: leftTitleColor,
        })
      : Box({}),
    left
  );

  const rightPanel = Box(
    {
      width: direction === 'horizontal' ? rightSize : undefined,
      height: direction === 'vertical' ? rightSize : undefined,
      flexDirection: 'column',
    },
    rightTitle
      ? PanelHeader({
          title: rightTitle,
          width: direction === 'horizontal' ? rightSize : termWidth,
          color: rightTitleColor,
        })
      : Box({}),
    right
  );

  // Build divider
  const dividerNode = divider
    ? direction === 'horizontal'
      ? VerticalDivider({ height: termHeight - (border ? 2 : 0), style: dividerStyle, color: dividerColor })
      : HorizontalDivider({ width: termWidth - (border ? 2 : 0), style: dividerStyle, color: dividerColor })
    : gap > 0
    ? Box({ width: direction === 'horizontal' ? gap : undefined, height: direction === 'vertical' ? gap : undefined })
    : Box({});

  // Assemble the split panel
  const content = Box(
    { flexDirection: direction === 'horizontal' ? 'row' : 'column' },
    leftPanel,
    dividerNode,
    rightPanel
  );

  // Wrap with border if needed
  if (border) {
    return Box(
      {
        flexDirection: 'column',
        borderStyle: borderStyle,
        borderColor: borderColor,
        padding: 0,
      },
      content
    );
  }

  return content;
}

/**
 * State for interactive split panel
 */
export interface SplitPanelState {
  ratio: number;
  leftCollapsed: boolean;
  rightCollapsed: boolean;
  setRatio: (ratio: number) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
  expandLeft: () => void;
  expandRight: () => void;
}

/**
 * Create interactive split panel state
 *
 * @example
 * ```typescript
 * const split = createSplitPanel({ initialRatio: 0.3 });
 *
 * // Use in component
 * SplitPanel({
 *   left: leftCollapsed ? CollapsedSidebar() : FullSidebar(),
 *   right: ContentArea(),
 *   ratio: split.ratio,
 * })
 *
 * // Toggle panels
 * if (key === '[') split.toggleLeft();
 * if (key === ']') split.toggleRight();
 * ```
 */
export function createSplitPanel(options: {
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
}): SplitPanelState {
  const { initialRatio = 0.5, minRatio = 0.1, maxRatio = 0.9 } = options;

  let ratio = initialRatio;
  let leftCollapsed = false;
  let rightCollapsed = false;
  let savedRatio = initialRatio;

  return {
    get ratio() {
      if (leftCollapsed) return 0;
      if (rightCollapsed) return 1;
      return ratio;
    },
    get leftCollapsed() {
      return leftCollapsed;
    },
    get rightCollapsed() {
      return rightCollapsed;
    },
    setRatio: (newRatio: number) => {
      ratio = Math.max(minRatio, Math.min(maxRatio, newRatio));
      leftCollapsed = false;
      rightCollapsed = false;
    },
    toggleLeft: () => {
      if (leftCollapsed) {
        leftCollapsed = false;
        ratio = savedRatio;
      } else {
        savedRatio = ratio;
        leftCollapsed = true;
        rightCollapsed = false;
      }
    },
    toggleRight: () => {
      if (rightCollapsed) {
        rightCollapsed = false;
        ratio = savedRatio;
      } else {
        savedRatio = ratio;
        rightCollapsed = true;
        leftCollapsed = false;
      }
    },
    expandLeft: () => {
      leftCollapsed = false;
      rightCollapsed = true;
    },
    expandRight: () => {
      rightCollapsed = false;
      leftCollapsed = true;
    },
  };
}

/**
 * Three-panel layout (common for IDE-like interfaces)
 */
export interface ThreePanelProps {
  /** Left sidebar */
  left: VNode;
  /** Main content area */
  center: VNode;
  /** Right sidebar (optional) */
  right?: VNode;
  /** Left panel width */
  leftWidth?: number;
  /** Right panel width */
  rightWidth?: number;
  /** Show dividers */
  dividers?: boolean;
  /** Divider style */
  dividerStyle?: DividerStyle;
}

/**
 * Three Panel Layout
 *
 * Common layout for editors/IDEs with left sidebar, main content, and optional right panel.
 *
 * @example
 * ```typescript
 * ThreePanel({
 *   left: FileTree(),
 *   center: Editor(),
 *   right: Properties(),
 *   leftWidth: 25,
 *   rightWidth: 30,
 *   dividers: true
 * })
 * ```
 */
export function ThreePanel(props: ThreePanelProps): VNode {
  const {
    left,
    center,
    right,
    leftWidth = 25,
    rightWidth = 30,
    dividers = true,
    dividerStyle = 'line',
  } = props;

  const termWidth = process.stdout.columns || 80;
  const dividerSize = dividers ? 1 : 0;

  // Calculate center width
  const centerWidth = termWidth - leftWidth - (right ? rightWidth : 0) - (right ? 2 : 1) * dividerSize;

  const leftPanel = Box({ width: leftWidth, flexDirection: 'column' }, left);
  const centerPanel = Box({ width: centerWidth, flexDirection: 'column' }, center);

  const parts: VNode[] = [leftPanel];

  if (dividers) {
    parts.push(VerticalDivider({ height: process.stdout.rows || 24, style: dividerStyle, color: 'gray' }));
  }

  parts.push(centerPanel);

  if (right) {
    if (dividers) {
      parts.push(VerticalDivider({ height: process.stdout.rows || 24, style: dividerStyle, color: 'gray' }));
    }
    parts.push(Box({ width: rightWidth, flexDirection: 'column' }, right));
  }

  return Box({ flexDirection: 'row' }, ...parts);
}

export type { VNode };
