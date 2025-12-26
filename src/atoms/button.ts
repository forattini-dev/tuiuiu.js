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
import { getTheme, getContrastColor } from '../core/theme.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { createSignal } from '../primitives/signal.js';
import { useInput, type Key } from '../hooks/index.js';

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
 *   color: 'success',
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
  const theme = getTheme();
  const {
    label,
    onClick,
    variant = 'solid',
    size = 'medium',
    color = theme.accents.info,
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
        textColor = 'mutedForeground';
        bgColor = undefined;
        borderColor = 'border';
      } else if (isHighlighted) {
        // Use automatic contrast color for text on solid background
        textColor = getContrastColor(color as string);
        bgColor = color;
        borderColor = color;
      } else {
        textColor = color;
        bgColor = undefined;
        borderColor = color;
      }
      break;

    case 'outline':
      textColor = disabled ? 'mutedForeground' : isHighlighted ? color : color;
      bgColor = undefined;
      borderColor = disabled ? 'border' : color;
      break;

    case 'ghost':
      // Ghost uses background when highlighted, need contrast color
      if (isHighlighted && !disabled) {
        textColor = getContrastColor(color as string);
        bgColor = color;
      } else {
        textColor = disabled ? 'mutedForeground' : 'foreground';
        bgColor = undefined;
      }
      borderColor = undefined;
      borderStyle = 'none';
      break;

    case 'link':
      textColor = disabled ? 'mutedForeground' : color;
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
    parts.push(Text({ color: textColor, backgroundColor: bgColor }, spinner + ' '));
  }

  // Icon
  if (icon && !loading) {
    parts.push(Text({ color: textColor, backgroundColor: bgColor }, icon + ' '));
  }

  // Label
  const displayLabel = loading && loadingText ? loadingText : label;
  parts.push(
    Text(
      {
        color: textColor,
        backgroundColor: bgColor,
        bold: isHighlighted && isInteractive,
        dim: disabled,
        underline: variant === 'link' && isHighlighted,
      },
      displayLabel
    )
  );

  // Right icon
  if (iconRight && !loading) {
    parts.push(Text({ color: textColor, backgroundColor: bgColor }, ' ' + iconRight));
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
  const theme = getTheme();
  const {
    icon,
    onClick,
    color = theme.accents.info,
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
        color: disabled ? 'mutedForeground' : isHighlighted ? color : 'foreground',
        bold: isHighlighted,
        dim: disabled,
      },
      icon
    )
  );
}

// =============================================================================
// ButtonGroup - Group of buttons with keyboard navigation
// =============================================================================

export interface ButtonGroupState {
  /** Current focused button index */
  focusedIndex: () => number;
  /** Set focused button index */
  setFocusedIndex: (index: number | ((prev: number) => number)) => void;
  /** Move focus to previous button */
  focusPrev: () => void;
  /** Move focus to next button */
  focusNext: () => void;
  /** Trigger click on currently focused button */
  triggerClick: () => void;
  /** Handle keyboard input - returns true if handled */
  handleInput: (input: string, key: Key) => boolean | void;
}

export interface ButtonGroupOptions {
  /** Button configurations */
  buttons: ButtonProps[];
  /** Initial focused index */
  initialFocusedIndex?: number;
  /** Orientation for keyboard navigation */
  direction?: 'horizontal' | 'vertical';
  /** Wrap around when reaching ends */
  wrap?: boolean;
  /** Is group active/focused - can be boolean or getter function */
  isActive?: boolean | (() => boolean);
  /** Called when focused index changes */
  onFocusChange?: (index: number) => void;
}

/**
 * Create a ButtonGroup state manager with keyboard navigation
 *
 * @example
 * ```typescript
 * const buttons = createButtonGroup({
 *   buttons: [
 *     { label: 'Save', onClick: save },
 *     { label: 'Cancel', onClick: cancel },
 *   ],
 *   direction: 'horizontal',
 * });
 *
 * // Render with built-in keyboard handling
 * renderButtonGroup(buttons)
 *
 * // Or access state manually
 * buttons.focusedIndex()  // Current focus
 * buttons.triggerClick()  // Programmatic click
 * ```
 */
export function createButtonGroup(options: ButtonGroupOptions): ButtonGroupState {
  const {
    buttons,
    initialFocusedIndex = 0,
    direction = 'horizontal',
    wrap = true,
    isActive: isActiveProp = true,
    onFocusChange,
  } = options;

  const checkIsActive = (): boolean => {
    return typeof isActiveProp === 'function' ? isActiveProp() : isActiveProp;
  };

  // Find first non-disabled button for initial focus
  const findFirstEnabled = (): number => {
    const idx = buttons.findIndex((b) => !b.disabled && !b.loading);
    return idx >= 0 ? idx : 0;
  };

  const [focusedIndex, setFocusedIndex] = createSignal(
    buttons[initialFocusedIndex]?.disabled ? findFirstEnabled() : initialFocusedIndex
  );

  const getEnabledCount = (): number => {
    return buttons.filter((b) => !b.disabled && !b.loading).length;
  };

  const focusPrev = () => {
    if (getEnabledCount() === 0) return;

    setFocusedIndex((current) => {
      let newIndex = current - 1;

      // Skip disabled buttons
      while (newIndex >= 0 && (buttons[newIndex]?.disabled || buttons[newIndex]?.loading)) {
        newIndex--;
      }

      // Handle wrap or clamp
      if (newIndex < 0) {
        if (wrap) {
          newIndex = buttons.length - 1;
          while (newIndex > current && (buttons[newIndex]?.disabled || buttons[newIndex]?.loading)) {
            newIndex--;
          }
        } else {
          return current; // Stay at current if no wrap
        }
      }

      if (newIndex !== current) onFocusChange?.(newIndex);
      return newIndex;
    });
  };

  const focusNext = () => {
    if (getEnabledCount() === 0) return;

    setFocusedIndex((current) => {
      let newIndex = current + 1;

      // Skip disabled buttons
      while (newIndex < buttons.length && (buttons[newIndex]?.disabled || buttons[newIndex]?.loading)) {
        newIndex++;
      }

      // Handle wrap or clamp
      if (newIndex >= buttons.length) {
        if (wrap) {
          newIndex = 0;
          while (newIndex < current && (buttons[newIndex]?.disabled || buttons[newIndex]?.loading)) {
            newIndex++;
          }
        } else {
          return current; // Stay at current if no wrap
        }
      }

      if (newIndex !== current) onFocusChange?.(newIndex);
      return newIndex;
    });
  };

  const triggerClick = () => {
    const index = focusedIndex();
    const button = buttons[index];
    if (button && !button.disabled && !button.loading && button.onClick) {
      button.onClick();
    }
  };

  const handleInput = (input: string, key: Key): boolean | void => {
    if (!checkIsActive()) return;

    // Enter/Space = trigger click on focused button
    if (key.return || input === ' ') {
      triggerClick();
      return true;
    }

    // Navigation based on direction
    if (direction === 'horizontal') {
      if (key.leftArrow || (key.shift && key.tab)) {
        focusPrev();
        return true;
      }
      if (key.rightArrow || key.tab) {
        focusNext();
        return true;
      }
    } else {
      // Vertical
      if (key.upArrow || (key.shift && key.tab)) {
        focusPrev();
        return true;
      }
      if (key.downArrow || key.tab) {
        focusNext();
        return true;
      }
    }

    // Vim-style navigation
    if (direction === 'horizontal') {
      if (input === 'h') {
        focusPrev();
        return true;
      }
      if (input === 'l') {
        focusNext();
        return true;
      }
    } else {
      if (input === 'k') {
        focusPrev();
        return true;
      }
      if (input === 'j') {
        focusNext();
        return true;
      }
    }

    // Number keys for quick access (1-9)
    if (/^[1-9]$/.test(input)) {
      const targetIndex = parseInt(input, 10) - 1;
      if (targetIndex < buttons.length && !buttons[targetIndex]?.disabled && !buttons[targetIndex]?.loading) {
        setFocusedIndex(targetIndex);
        onFocusChange?.(targetIndex);
        return true;
      }
    }
  };

  return {
    focusedIndex,
    setFocusedIndex: (indexOrFn) => {
      if (typeof indexOrFn === 'function') {
        setFocusedIndex(indexOrFn);
      } else {
        setFocusedIndex(indexOrFn);
      }
    },
    focusPrev,
    focusNext,
    triggerClick,
    handleInput,
  };
}

export interface ButtonGroupProps {
  /** Button configurations (required if no state provided) */
  buttons?: ButtonProps[];
  /** State from createButtonGroup() */
  state?: ButtonGroupState;
  /** Orientation */
  direction?: 'horizontal' | 'vertical';
  /** Gap between buttons */
  gap?: number;
  /** Currently focused index (for manual control, ignored if state provided) */
  focusedIndex?: number;
  /** Is group active for keyboard input */
  isActive?: boolean | (() => boolean);
  /** Wrap around when reaching ends */
  wrap?: boolean;
  /** Called when focused index changes */
  onFocusChange?: (index: number) => void;
}

/**
 * Render a ButtonGroup with keyboard navigation
 *
 * Uses the state from createButtonGroup() and registers keyboard handlers.
 */
export function renderButtonGroup(
  state: ButtonGroupState,
  buttons: ButtonProps[],
  options: Omit<ButtonGroupProps, 'state' | 'buttons'> = {}
): VNode {
  const { direction = 'horizontal', gap = 1 } = options;

  // Register input handler during render phase with stopPropagation
  useInput(state.handleInput, { stopPropagation: true });

  const buttonNodes = buttons.map((buttonProps, i) =>
    Button({
      ...buttonProps,
      focused: i === state.focusedIndex(),
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

/**
 * ButtonGroup - Group of buttons with optional keyboard navigation
 *
 * @example
 * ```typescript
 * // Simple usage with manual focus control
 * ButtonGroup({
 *   buttons: [
 *     { label: 'Save', onClick: save },
 *     { label: 'Cancel', onClick: cancel },
 *   ],
 *   focusedIndex: 0,
 * })
 *
 * // With built-in keyboard navigation (recommended)
 * const group = createButtonGroup({
 *   buttons: [
 *     { label: 'Save', onClick: save },
 *     { label: 'Cancel', onClick: cancel },
 *   ],
 * });
 * ButtonGroup({ state: group, buttons: [...] })
 * // Arrow keys navigate, Enter/Space triggers click!
 * ```
 */
export function ButtonGroup(props: ButtonGroupProps): VNode {
  const {
    buttons = [],
    state,
    direction = 'horizontal',
    gap = 1,
    focusedIndex: manualFocusedIndex,
    isActive = true,
    wrap = true,
    onFocusChange,
  } = props;

  // If state is provided, use renderButtonGroup for full keyboard support
  if (state) {
    return renderButtonGroup(state, buttons, { direction, gap });
  }

  // If isActive is true and no state provided, create internal state for keyboard nav
  const isActiveValue = typeof isActive === 'function' ? isActive() : isActive;
  if (isActiveValue && buttons.length > 0) {
    // Create inline state for keyboard handling
    const internalState = createButtonGroup({
      buttons,
      initialFocusedIndex: manualFocusedIndex ?? 0,
      direction,
      wrap,
      isActive,
      onFocusChange,
    });

    return renderButtonGroup(internalState, buttons, { direction, gap });
  }

  // Fallback: Simple render without keyboard handling (isActive: false)
  const buttonNodes = buttons.map((buttonProps, i) =>
    Button({
      ...buttonProps,
      focused: i === manualFocusedIndex,
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
