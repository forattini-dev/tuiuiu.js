/**
 * RadioGroup - Single selection radio buttons
 *
 * @layer Molecule
 * @description Single selection from options with keyboard navigation
 *
 * Features:
 * - Single selection from options
 * - Keyboard navigation
 * - Horizontal and vertical layouts
 * - Custom styling
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { useFactoryState } from '../hooks/factory-state.js';
import { getChars } from '../core/capabilities.js';
import { component, type ComponentKeyProps } from '../app/component.js';

// =============================================================================
// Types
// =============================================================================

export interface RadioOption<T = string> {
  /** Unique value */
  value: T;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
}

export interface RadioGroupOptions<T = string> {
  /** Radio options */
  options: RadioOption<T>[];
  /** Initially selected value */
  initialValue?: T;
  /** Layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Gap between items */
  gap?: number;
  /** Active/focused color */
  colorActive?: ColorValue;
  /** Selected indicator color */
  colorSelected?: ColorValue;
  /** Callbacks */
  onChange?: (value: T) => void;
  /** Is active */
  isActive?: boolean;
  /** Expand to fill available width */
  fullWidth?: boolean;
}

export interface RadioGroupState<T = string> {
  focusIndex: () => number;
  selected: () => T | undefined;
  movePrev: () => void;
  moveNext: () => void;
  selectCurrent: () => void;
  select: (value: T) => void;
  updateOptions: (options: RadioGroupOptions<T>) => void;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a RadioGroup state manager
 */
export function createRadioGroup<T = string>(
  options: RadioGroupOptions<T>
): RadioGroupState<T> {
  const { initialValue } = options;
  let runtimeOptions = options;

  // Find initial focus index
  const initialIndex = initialValue
    ? runtimeOptions.options.findIndex((o) => o.value === initialValue)
    : 0;

  const [focusIndex, setFocusIndex] = createSignal(Math.max(0, initialIndex));
  const [selected, setSelected] = createSignal<T | undefined>(initialValue);

  const movePrev = () => {
    setFocusIndex((i) => {
      let newIndex = i - 1;
      while (newIndex >= 0 && runtimeOptions.options[newIndex]?.disabled) {
        newIndex--;
      }
      return newIndex >= 0 ? newIndex : i;
    });
  };

  const moveNext = () => {
    setFocusIndex((i) => {
      let newIndex = i + 1;
      while (newIndex < runtimeOptions.options.length && runtimeOptions.options[newIndex]?.disabled) {
        newIndex++;
      }
      return newIndex < runtimeOptions.options.length ? newIndex : i;
    });
  };

  const selectCurrent = () => {
    const opt = runtimeOptions.options[focusIndex()];
    if (opt && !opt.disabled) {
      setSelected(opt.value);
      runtimeOptions.onChange?.(opt.value);
    }
  };

  const select = (value: T) => {
    const index = runtimeOptions.options.findIndex((o) => o.value === value);
    if (index >= 0 && !runtimeOptions.options[index]?.disabled) {
      setFocusIndex(index);
      setSelected(value);
      runtimeOptions.onChange?.(value);
    }
  };

  return {
    focusIndex,
    selected,
    movePrev,
    moveNext,
    selectCurrent,
    select,
    updateOptions: (nextOptions: RadioGroupOptions<T>) => {
      runtimeOptions = nextOptions;
      const maxIndex = Math.max(0, runtimeOptions.options.length - 1);
      setFocusIndex((index) => Math.min(index, maxIndex));
    },
  };
}

// =============================================================================
// Component
// =============================================================================

export interface RadioGroupProps<T = string> extends RadioGroupOptions<T>, ComponentKeyProps {
  /** Pre-created state */
  state?: RadioGroupState<T>;
}

/**
 * RadioGroup - Single selection radio buttons
 *
 * @example
 * RadioGroup({
 *   options: [
 *     { value: 'small', label: 'Small' },
 *     { value: 'medium', label: 'Medium' },
 *     { value: 'large', label: 'Large' },
 *   ],
 *   initialValue: 'medium',
 *   onChange: (value) => console.log(value),
 * })
 */
function renderRadioGroup<T = string>(props: RadioGroupProps<T>): VNode {
  const {
    options,
    direction = 'vertical',
    gap = direction === 'vertical' ? 0 : 2,
    colorActive = 'primary',
    colorSelected = 'success',
    isActive = true,
    fullWidth = false,
    state: externalState,
  } = props;

  const state = useFactoryState(externalState, props, createRadioGroup);
  const chars = getChars();

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (direction === 'vertical') {
        if (key.upArrow || input === 'k') state.movePrev();
        else if (key.downArrow || input === 'j') state.moveNext();
      } else {
        if (key.leftArrow || input === 'h') state.movePrev();
        else if (key.rightArrow || input === 'l') state.moveNext();
      }

      if (input === ' ' || key.return) {
        state.selectCurrent();
      }
    },
    { isActive }
  );

  const focus = state.focusIndex();
  const selectedValue = state.selected();

  const optionNodes = options.map((opt, i) => {
    const isFocused = i === focus;
    const isSelected = opt.value === selectedValue;

    const radio = isSelected
      ? chars.radio.selected
      : chars.radio.unselected;

    const labelColor = opt.disabled
      ? 'mutedForeground'
      : isFocused
        ? colorActive
        : isSelected
          ? colorSelected
          : 'foreground';

    return Box(
      {
        flexDirection: 'row',
        gap: 1,
        onClick: opt.disabled ? undefined : () => state.select(opt.value),
      },
      Text({ color: isSelected ? colorSelected : 'mutedForeground' }, radio),
      Text({ color: labelColor, dim: opt.disabled }, opt.label),
      opt.description
        ? Text({ color: 'mutedForeground', dim: true }, ` ${opt.description}`)
        : null
    );
  });

  return Box(
    {
      flexDirection: direction === 'vertical' ? 'column' : 'row',
      gap,
      flexGrow: fullWidth ? 1 : 0,
    },
    ...optionNodes
  );
}

export const RadioGroup = component('RadioGroup', renderRadioGroup);

// =============================================================================
// Inline Radio (single option display)
// =============================================================================

export interface InlineRadioProps {
  /** Is selected */
  selected: boolean;
  /** Label text */
  label: string;
  /** Is disabled */
  disabled?: boolean;
  /** Selected color */
  color?: ColorValue;
  /** On click callback */
  onClick?: () => void;
}

/**
 * InlineRadio - Single radio button display
 */
export function InlineRadio(props: InlineRadioProps): VNode {
  const { selected, label, disabled = false, color = 'primary' } = props;
  const chars = getChars();

  const radio = selected ? chars.radio.selected : chars.radio.unselected;
  const labelColor = disabled ? 'mutedForeground' : selected ? color : 'foreground';

  return Box(
    { flexDirection: 'row', gap: 1, onClick: disabled ? undefined : props.onClick },
    Text({ color: selected ? color : 'mutedForeground' }, radio),
    Text({ color: labelColor, dim: disabled }, label)
  );
}
