/**
 * Switch - Boolean toggle component
 *
 * @layer Atom
 * @description On/off toggle with visual track and thumb
 *
 * Features:
 * - On/Off toggle
 * - Keyboard activation
 * - Custom labels
 * - Animated transition (optional)
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { themeColor } from '../core/theme.js';

// =============================================================================
// Types
// =============================================================================

export interface SwitchOptions {
  /** Initial value */
  initialValue?: boolean;
  /** On label */
  onLabel?: string;
  /** Off label */
  offLabel?: string;
  /** Show labels */
  showLabels?: boolean;
  /** On color */
  onColor?: ColorValue;
  /** Off color */
  offColor?: ColorValue;
  /** Track color when off */
  trackColor?: ColorValue;
  /** Size: compact or normal */
  size?: 'compact' | 'normal';
  /** Is disabled */
  disabled?: boolean;
  /** Callbacks */
  onChange?: (value: boolean) => void;
  /** Is active */
  isActive?: boolean;
}

export interface SwitchState {
  value: () => boolean;
  toggle: () => void;
  setOn: () => void;
  setOff: () => void;
  setValue: (value: boolean) => void;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a Switch state manager
 */
export function createSwitch(options: SwitchOptions = {}): SwitchState {
  const { initialValue = false, onChange } = options;

  const [value, setValueSignal] = createSignal(initialValue);

  const toggle = () => {
    setValueSignal((v) => {
      const newValue = !v;
      onChange?.(newValue);
      return newValue;
    });
  };

  const setOn = () => {
    if (!value()) {
      setValueSignal(true);
      onChange?.(true);
    }
  };

  const setOff = () => {
    if (value()) {
      setValueSignal(false);
      onChange?.(false);
    }
  };

  const setValue = (newValue: boolean) => {
    if (value() !== newValue) {
      setValueSignal(newValue);
      onChange?.(newValue);
    }
  };

  return { value, toggle, setOn, setOff, setValue };
}

// =============================================================================
// Component
// =============================================================================

export interface SwitchProps extends SwitchOptions {
  /** Pre-created state */
  state?: SwitchState;
  /** Label before switch */
  label?: string;
}

/**
 * Switch - Boolean toggle component
 *
 * @example
 * // Basic switch
 * Switch({
 *   initialValue: true,
 *   onChange: (value) => console.log(value),
 * })
 *
 * @example
 * // With labels
 * Switch({
 *   label: 'Dark mode',
 *   showLabels: true,
 *   onLabel: 'ON',
 *   offLabel: 'OFF',
 *   onColor: 'green',
 * })
 */
export function Switch(props: SwitchProps): VNode {
  const {
    onLabel = 'ON',
    offLabel = 'OFF',
    showLabels = false,
    onColor = themeColor('success'),
    offColor = themeColor('mutedForeground'),
    trackColor = themeColor('border'),
    size = 'normal',
    disabled = false,
    isActive = true,
    label,
    state: externalState,
  } = props;

  const state = externalState || createSwitch(props);
  const isAscii = getRenderMode() === 'ascii';

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (disabled) return;

      if (input === ' ' || key.return) {
        state.toggle();
      } else if (key.leftArrow || input === 'h') {
        state.setOff();
      } else if (key.rightArrow || input === 'l') {
        state.setOn();
      }
    },
    { isActive }
  );

  const isOn = state.value();
  const color = isOn ? onColor : offColor;

  // Build switch visual
  let switchVisual: VNode;

  if (isAscii) {
    // ASCII mode: [OFF] or [ ON]
    if (size === 'compact') {
      switchVisual = Text(
        { color },
        isOn ? '[*]' : '[ ]'
      );
    } else {
      switchVisual = Text(
        { color, dim: disabled },
        isOn ? `[${onLabel}]` : `[${offLabel}]`
      );
    }
  } else {
    // Unicode mode with track and thumb
    if (size === 'compact') {
      // Compact: ●━ or ━○
      switchVisual = isOn
        ? Box(
            { flexDirection: 'row' },
            Text({ color: onColor }, '●'),
            Text({ color: trackColor, dim: true }, '━')
          )
        : Box(
            { flexDirection: 'row' },
            Text({ color: trackColor, dim: true }, '━'),
            Text({ color: offColor }, '○')
          );
    } else {
      // Normal: ━●━━ or ━━○━
      const trackLen = 4;
      const thumbPos = isOn ? trackLen - 1 : 0;

      const trackChars: VNode[] = [];
      for (let i = 0; i < trackLen; i++) {
        if (i === thumbPos) {
          trackChars.push(
            Text({ color: isOn ? onColor : offColor }, isOn ? '●' : '○')
          );
        } else {
          trackChars.push(Text({ color: trackColor, dim: true }, '━'));
        }
      }

      switchVisual = Box({ flexDirection: 'row' }, ...trackChars);
    }
  }

  // Build full component
  const parts: (VNode | null)[] = [];

  if (label) {
    parts.push(Box({ marginRight: 1 }, Text({ dim: disabled }, label)));
  }

  if (showLabels && !isOn) {
    parts.push(Box({ marginRight: 1 }, Text({ color: offColor, dim: true }, offLabel)));
  }

  parts.push(switchVisual);

  if (showLabels && isOn) {
    parts.push(Box({ marginLeft: 1 }, Text({ color: onColor }, onLabel)));
  }

  return Box(
    {
      flexDirection: 'row',
      onClick: disabled ? undefined : () => state.toggle(),
    },
    ...parts
  );
}

// =============================================================================
// Toggle Group (multiple switches)
// =============================================================================

export interface ToggleOption {
  /** Unique key */
  key: string;
  /** Label */
  label: string;
  /** Initial value */
  initialValue?: boolean;
  /** Disabled */
  disabled?: boolean;
}

export interface ToggleGroupOptions {
  /** Toggle options */
  options: ToggleOption[];
  /** Direction */
  direction?: 'horizontal' | 'vertical';
  /** Gap */
  gap?: number;
  /** On change callback */
  onChange?: (values: Record<string, boolean>) => void;
  /** Is active */
  isActive?: boolean;
}

/**
 * ToggleGroup - Multiple toggles
 */
export function ToggleGroup(props: ToggleGroupOptions): VNode {
  const {
    options,
    direction = 'vertical',
    gap = 1,
    onChange,
    isActive = true,
  } = props;

  // Create states for each toggle
  const states = options.map((opt) =>
    createSwitch({
      initialValue: opt.initialValue,
      onChange: () => {
        if (onChange) {
          const values: Record<string, boolean> = {};
          options.forEach((o, i) => {
            values[o.key] = states[i]!.value();
          });
          onChange(values);
        }
      },
    })
  );

  const toggleNodes = options.map((opt, i) =>
    Switch({
      label: opt.label,
      disabled: opt.disabled,
      state: states[i],
      isActive,
      size: 'compact',
    })
  );

  return Box(
    {
      flexDirection: direction === 'vertical' ? 'column' : 'row',
      gap,
    },
    ...toggleNodes
  );
}
