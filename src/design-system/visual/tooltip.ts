/**
 * Tooltip - Hover/focus tooltips
 *
 * Features:
 * - Position relative to target (top/bottom/left/right)
 * - Arrow pointer
 * - Border styles
 * - Background color
 * - Show/hide control
 */

import { Box, Text } from '../../components/components.js';
import type { VNode, ColorValue } from '../../utils/types.js';
import { getRenderMode } from '../../core/capabilities.js';

// Border style type (matching Box component)
type BorderStyle = 'single' | 'double' | 'round' | 'bold' | 'none';

// =============================================================================
// Types
// =============================================================================

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipOptions {
  /** Tooltip content */
  content: string | VNode;
  /** Position relative to target */
  position?: TooltipPosition;
  /** Show arrow pointer */
  arrow?: boolean;
  /** Border style */
  borderStyle?: BorderStyle;
  /** Border color */
  borderColor?: ColorValue;
  /** Text color */
  color?: ColorValue;
  /** Background color */
  backgroundColor?: ColorValue;
  /** Is visible */
  visible?: boolean;
  /** Max width */
  maxWidth?: number;
}

// =============================================================================
// Arrow Characters
// =============================================================================

const ARROWS = {
  unicode: {
    top: '▲',
    bottom: '▼',
    left: '◀',
    right: '▶',
  },
  ascii: {
    top: '^',
    bottom: 'v',
    left: '<',
    right: '>',
  },
};

// =============================================================================
// Components
// =============================================================================

/**
 * Tooltip - Tooltip display (position is relative to parent layout)
 *
 * @example
 * // Tooltip above content
 * Box({ flexDirection: 'column' },
 *   Tooltip({ content: 'Press Enter to select', position: 'top', visible: focused }),
 *   Text({}, 'Button')
 * )
 *
 * @example
 * // Tooltip with arrow
 * Tooltip({
 *   content: 'Help text here',
 *   position: 'right',
 *   arrow: true,
 *   borderStyle: 'round',
 * })
 */
export function Tooltip(props: TooltipOptions): VNode | null {
  const {
    content,
    position = 'top',
    arrow = true,
    borderStyle = 'round',
    borderColor = 'gray',
    color = 'white',
    backgroundColor,
    visible = true,
    maxWidth,
  } = props;

  if (!visible) return null;

  const isAscii = getRenderMode() === 'ascii';
  const arrowChars = isAscii ? ARROWS.ascii : ARROWS.unicode;

  // Build content
  const contentNode = typeof content === 'string' ? Text({ color }, content) : content;

  // Arrow node
  const arrowNode = arrow
    ? Text({ color: borderColor }, arrowChars[position])
    : null;

  // Tooltip box
  const tooltipBox = Box(
    {
      borderStyle,
      borderColor,
      paddingLeft: 1,
      paddingRight: 1,
      maxWidth,
    },
    contentNode
  );

  // Compose based on position
  switch (position) {
    case 'top':
      return Box(
        { flexDirection: 'column' },
        tooltipBox,
        arrowNode ? Box({ marginLeft: 2 }, arrowNode) : null
      );

    case 'bottom':
      return Box(
        { flexDirection: 'column' },
        arrowNode ? Box({ marginLeft: 2 }, arrowNode) : null,
        tooltipBox
      );

    case 'left':
      return Box(
        { flexDirection: 'row' },
        tooltipBox,
        arrowNode
      );

    case 'right':
      return Box(
        { flexDirection: 'row' },
        arrowNode,
        tooltipBox
      );

    default:
      return tooltipBox;
  }
}

// =============================================================================
// WithTooltip - Wrapper that shows tooltip on focus
// =============================================================================

export interface WithTooltipOptions {
  /** Target element */
  children: VNode;
  /** Tooltip content */
  tooltip: string | VNode;
  /** Position */
  position?: TooltipPosition;
  /** Is focused/hovered */
  active?: boolean;
  /** Tooltip props */
  tooltipProps?: Partial<TooltipOptions>;
}

/**
 * WithTooltip - Wrapper that shows tooltip when active
 *
 * @example
 * WithTooltip({
 *   children: Button({ label: 'Submit' }),
 *   tooltip: 'Press Enter to submit the form',
 *   position: 'top',
 *   active: isFocused,
 * })
 */
export function WithTooltip(props: WithTooltipOptions): VNode {
  const {
    children,
    tooltip,
    position = 'top',
    active = false,
    tooltipProps = {},
  } = props;

  const tooltipNode = active
    ? Tooltip({
        content: tooltip,
        position,
        visible: true,
        ...tooltipProps,
      })
    : null;

  switch (position) {
    case 'top':
      return Box(
        { flexDirection: 'column' },
        tooltipNode,
        children
      );

    case 'bottom':
      return Box(
        { flexDirection: 'column' },
        children,
        tooltipNode
      );

    case 'left':
      return Box(
        { flexDirection: 'row' },
        tooltipNode,
        children
      );

    case 'right':
      return Box(
        { flexDirection: 'row' },
        children,
        tooltipNode
      );

    default:
      return children;
  }
}

// =============================================================================
// HelpTooltip - Help icon with tooltip
// =============================================================================

export interface HelpTooltipOptions {
  /** Help text */
  text: string;
  /** Position */
  position?: TooltipPosition;
  /** Is active/focused */
  active?: boolean;
  /** Icon */
  icon?: string;
  /** Icon color */
  iconColor?: ColorValue;
}

/**
 * HelpTooltip - Help icon that shows tooltip when active
 *
 * @example
 * HelpTooltip({
 *   text: 'Enter your email address',
 *   position: 'right',
 *   active: focused,
 * })
 */
export function HelpTooltip(props: HelpTooltipOptions): VNode {
  const {
    text,
    position = 'right',
    active = false,
    icon = '?',
    iconColor = 'cyan',
  } = props;

  const iconNode = Text({ color: iconColor }, `[${icon}]`);

  return WithTooltip({
    children: iconNode,
    tooltip: text,
    position,
    active,
    tooltipProps: {
      borderStyle: 'round',
      borderColor: iconColor,
    },
  });
}

// =============================================================================
// InfoBox - Information callout box
// =============================================================================

export type InfoBoxType = 'info' | 'warning' | 'error' | 'success' | 'tip';

export interface InfoBoxOptions {
  /** Message content */
  message: string | VNode;
  /** Box type */
  type?: InfoBoxType;
  /** Title (optional) */
  title?: string;
  /** Show icon */
  showIcon?: boolean;
  /** Width */
  width?: number;
}

const INFO_BOX_STYLES: Record<InfoBoxType, { icon: string; color: ColorValue }> = {
  info: { icon: 'ℹ', color: 'blue' },
  warning: { icon: '⚠', color: 'yellow' },
  error: { icon: '✖', color: 'red' },
  success: { icon: '✔', color: 'green' },
  tip: { icon: '💡', color: 'cyan' },
};

const INFO_BOX_STYLES_ASCII: Record<InfoBoxType, { icon: string; color: ColorValue }> = {
  info: { icon: 'i', color: 'blue' },
  warning: { icon: '!', color: 'yellow' },
  error: { icon: 'x', color: 'red' },
  success: { icon: '*', color: 'green' },
  tip: { icon: '>', color: 'cyan' },
};

/**
 * InfoBox - Information callout box
 *
 * @example
 * InfoBox({
 *   type: 'warning',
 *   title: 'Caution',
 *   message: 'This action cannot be undone.',
 * })
 */
export function InfoBox(props: InfoBoxOptions): VNode {
  const {
    message,
    type = 'info',
    title,
    showIcon = true,
    width,
  } = props;

  const isAscii = getRenderMode() === 'ascii';
  const styles = isAscii ? INFO_BOX_STYLES_ASCII : INFO_BOX_STYLES;
  const style = styles[type];

  const contentNode = typeof message === 'string' ? Text({}, message) : message;

  const parts: VNode[] = [];

  // Header with icon and title
  if (showIcon || title) {
    const headerParts: VNode[] = [];

    if (showIcon) {
      headerParts.push(Text({ color: style.color, bold: true }, style.icon + ' '));
    }

    if (title) {
      headerParts.push(Text({ color: style.color, bold: true }, title));
    }

    parts.push(Box({ flexDirection: 'row' }, ...headerParts));
  }

  // Content
  parts.push(
    Box({ marginTop: title ? 1 : 0 }, contentNode)
  );

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: style.color,
      paddingLeft: 1,
      paddingRight: 1,
      paddingTop: 0,
      paddingBottom: 0,
      width,
    },
    ...parts
  );
}

// =============================================================================
// Popover - Positioned popover box
// =============================================================================

export interface PopoverOptions {
  /** Popover content */
  content: VNode;
  /** Position */
  position?: TooltipPosition;
  /** Is visible */
  visible?: boolean;
  /** Border style */
  borderStyle?: BorderStyle;
  /** Border color */
  borderColor?: ColorValue;
  /** Width */
  width?: number;
  /** Show arrow */
  arrow?: boolean;
}

/**
 * Popover - Positioned popover content
 *
 * @example
 * Popover({
 *   content: MenuItems(),
 *   position: 'bottom',
 *   visible: isOpen,
 *   width: 30,
 * })
 */
export function Popover(props: PopoverOptions): VNode | null {
  const {
    content,
    position = 'bottom',
    visible = true,
    borderStyle = 'round',
    borderColor = 'gray',
    width,
    arrow = true,
  } = props;

  if (!visible) return null;

  const isAscii = getRenderMode() === 'ascii';
  const arrowChars = isAscii ? ARROWS.ascii : ARROWS.unicode;

  // Arrow based on position (inverted for popover)
  const arrowChar =
    position === 'top'
      ? arrowChars.bottom
      : position === 'bottom'
        ? arrowChars.top
        : position === 'left'
          ? arrowChars.right
          : arrowChars.left;

  const arrowNode = arrow
    ? Text({ color: borderColor }, arrowChar)
    : null;

  const popoverBox = Box(
    {
      borderStyle,
      borderColor,
      width,
      padding: 1,
    },
    content
  );

  switch (position) {
    case 'top':
      return Box(
        { flexDirection: 'column' },
        popoverBox,
        arrowNode ? Box({ marginLeft: 2 }, arrowNode) : null
      );

    case 'bottom':
      return Box(
        { flexDirection: 'column' },
        arrowNode ? Box({ marginLeft: 2 }, arrowNode) : null,
        popoverBox
      );

    case 'left':
      return Box(
        { flexDirection: 'row' },
        popoverBox,
        arrowNode
      );

    case 'right':
      return Box(
        { flexDirection: 'row' },
        arrowNode,
        popoverBox
      );

    default:
      return popoverBox;
  }
}

// =============================================================================
// Badge - Small badge/chip display
// =============================================================================

export interface BadgeOptions {
  /** Badge text */
  text: string;
  /** Badge color */
  color?: ColorValue;
  /** Variant */
  variant?: 'solid' | 'outline' | 'subtle';
}

/**
 * Badge - Small badge/chip
 *
 * @example
 * Badge({ text: 'NEW', color: 'green' })
 * Badge({ text: '5', color: 'red', variant: 'solid' })
 */
export function Badge(props: BadgeOptions): VNode {
  const { text, color = 'gray', variant = 'subtle' } = props;

  switch (variant) {
    case 'solid':
      return Text(
        { color: 'black', backgroundColor: color, bold: true },
        ` ${text} `
      );

    case 'outline':
      return Box(
        { borderStyle: 'round', borderColor: color },
        Text({ color }, text)
      );

    case 'subtle':
    default:
      return Text({ color, dim: true }, `[${text}]`);
  }
}

// =============================================================================
// Tag - Labeled tag
// =============================================================================

export interface TagOptions {
  /** Tag label */
  label: string;
  /** Tag color */
  color?: ColorValue;
  /** Removable */
  removable?: boolean;
  /** On remove callback */
  onRemove?: () => void;
}

/**
 * Tag - Labeled tag with optional remove
 *
 * @example
 * Tag({ label: 'TypeScript', color: 'blue' })
 * Tag({ label: 'React', color: 'cyan', removable: true })
 */
export function Tag(props: TagOptions): VNode {
  const { label, color = 'gray', removable = false } = props;

  return Box(
    { flexDirection: 'row' },
    Text({ color }, `[${label}`),
    removable ? Text({ color, dim: true }, ' ×') : null,
    Text({ color }, ']')
  );
}
