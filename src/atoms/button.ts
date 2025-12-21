/**
 * Button - Clickable button component
 *
 * @layer Atom
 * @description Interactive button with variants, icons, and loading states
 *
 * Features:
 * - Mouse click support
 * - Keyboard activation (Enter/Space)
 * - Multiple variants (solid, outline, ghost)
 * - Disabled state
 * - Loading state with spinner
 * - Focus/hover states
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { themeColor } from '../core/theme.js';
import { getChars, getRenderMode } from '../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'link';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps {
  /** Button label */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size */
  size?: ButtonSize;
  /** Color */
  color?: ColorValue;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Loading text */
  loadingText?: string;
  /** Icon before label */
  icon?: string;
  /** Icon after label */
  iconRight?: string;
  /** Full width */
  fullWidth?: boolean;
  /** Currently focused */
  focused?: boolean;
  /** Currently hovered (from mouse) */
  hovered?: boolean;
}

// =============================================================================
// Component
// =============================================================================

/**
 * Button - Clickable button component
 *
 * @example
 * // Basic button
 * Button({
 *   label: 'Click me',
 *   onClick: () => console.log('Clicked!'),
 * })
 *
 * @example
 * // With icon and variant
 * Button({
 *   label: 'Save',
 *   icon: '💾',
 *   variant: 'solid',
 *   color: 'green',
 *   onClick: handleSave,
 * })
 *
 * @example
 * // Loading state
 * Button({
 *   label: 'Submit',
 *   loading: true,
 *   loadingText: 'Submitting...',
 * })
 */
export function Button(props: ButtonProps): VNode {
  const {
    label,
    onClick,
    variant = 'solid',
    size = 'medium',
    color = themeColor('info'),
    disabled = false,
    loading = false,
    loadingText,
    icon,
    iconRight,
    fullWidth = false,
    focused = false,
    hovered = false,
  } = props;

  const isAscii = getRenderMode() === 'ascii';
  const chars = getChars();

  // Padding based on size
  const paddingX = size === 'small' ? 1 : size === 'large' ? 3 : 2;
  const paddingY = size === 'large' ? 1 : 0;

  // Colors based on variant and state
  const isInteractive = !disabled && !loading;
  const isHighlighted = focused || hovered;

  let textColor: ColorValue;
  let bgColor: ColorValue | undefined;
  let borderColor: ColorValue | undefined;
  let borderStyle: 'single' | 'round' | 'none' = 'round';

  switch (variant) {
    case 'solid':
      if (disabled) {
        textColor = 'gray';
        bgColor = undefined;
        borderColor = 'gray';
      } else if (isHighlighted) {
        textColor = 'black';
        bgColor = color;
        borderColor = color;
      } else {
        textColor = color;
        bgColor = undefined;
        borderColor = color;
      }
      break;

    case 'outline':
      textColor = disabled ? 'gray' : isHighlighted ? color : color;
      bgColor = undefined;
      borderColor = disabled ? 'gray' : color;
      break;

    case 'ghost':
      textColor = disabled ? 'gray' : isHighlighted ? color : 'white';
      bgColor = isHighlighted && !disabled ? color : undefined;
      borderColor = undefined;
      borderStyle = 'none';
      break;

    case 'link':
      textColor = disabled ? 'gray' : color;
      bgColor = undefined;
      borderColor = undefined;
      borderStyle = 'none';
      break;
  }

  // Build content
  const parts: VNode[] = [];

  // Loading spinner
  if (loading) {
    const spinner = isAscii ? chars.spinner[0] : chars.spinner[0];
    parts.push(Text({ color: textColor }, spinner + ' '));
  }

  // Icon
  if (icon && !loading) {
    parts.push(Text({ color: textColor }, icon + ' '));
  }

  // Label
  const displayLabel = loading && loadingText ? loadingText : label;
  parts.push(
    Text(
      {
        color: variant === 'solid' && isHighlighted && !disabled ? 'black' : textColor,
        backgroundColor: variant === 'solid' && isHighlighted && !disabled ? bgColor : undefined,
        bold: isHighlighted && isInteractive,
        dim: disabled,
        underline: variant === 'link' && isHighlighted,
      },
      displayLabel
    )
  );

  // Right icon
  if (iconRight && !loading) {
    parts.push(Text({ color: textColor }, ' ' + iconRight));
  }

  // Wrapper
  const boxProps: any = {
    flexDirection: 'row',
    paddingX,
    paddingY,
    flexGrow: fullWidth ? 1 : 0,
  };

  if (borderStyle !== 'none') {
    boxProps.borderStyle = borderStyle;
    boxProps.borderColor = borderColor;
  }

  // Add onClick handler if interactive
  if (isInteractive && onClick) {
    boxProps.onClick = onClick;
  }

  return Box(boxProps, ...parts);
}

// =============================================================================
// IconButton - Button with just an icon
// =============================================================================

export interface IconButtonProps {
  /** Icon to display */
  icon: string;
  /** Aria label (for accessibility) */
  label: string;
  /** Click handler */
  onClick?: () => void;
  /** Color */
  color?: ColorValue;
  /** Disabled state */
  disabled?: boolean;
  /** Currently focused */
  focused?: boolean;
  /** Currently hovered */
  hovered?: boolean;
}

/**
 * IconButton - Button with just an icon
 */
export function IconButton(props: IconButtonProps): VNode {
  const {
    icon,
    onClick,
    color = themeColor('info'),
    disabled = false,
    focused = false,
    hovered = false,
  } = props;

  const isHighlighted = focused || hovered;
  const isInteractive = !disabled;

  const boxProps: any = {
    paddingX: 1,
  };

  if (isInteractive && onClick) {
    boxProps.onClick = onClick;
  }

  return Box(
    boxProps,
    Text(
      {
        color: disabled ? 'gray' : isHighlighted ? color : 'white',
        bold: isHighlighted,
        dim: disabled,
      },
      icon
    )
  );
}

// =============================================================================
// ButtonGroup - Group of buttons
// =============================================================================

export interface ButtonGroupProps {
  /** Buttons to render */
  buttons: ButtonProps[];
  /** Orientation */
  direction?: 'horizontal' | 'vertical';
  /** Gap between buttons */
  gap?: number;
  /** Currently focused index */
  focusedIndex?: number;
}

/**
 * ButtonGroup - Group of buttons with shared styling
 */
export function ButtonGroup(props: ButtonGroupProps): VNode {
  const {
    buttons,
    direction = 'horizontal',
    gap = 1,
    focusedIndex,
  } = props;

  const buttonNodes = buttons.map((buttonProps, i) =>
    Button({
      ...buttonProps,
      focused: i === focusedIndex,
    })
  );

  return Box(
    {
      flexDirection: direction === 'horizontal' ? 'row' : 'column',
      gap,
    },
    ...buttonNodes
  );
}
