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
import { useFactoryState } from '../hooks/factory-state.js';
import { getRenderMode } from '../core/capabilities.js';
import { getTheme } from '../core/theme.js';
import { component, type ComponentKeyProps } from '../app/component.js';
import { useConst } from '../hooks/use-const.js';

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
  colorOn?: ColorValue;
  /** Off color */
  colorOff?: ColorValue;
  /** Track color (background) */
  background?: ColorValue;
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
  updateOptions: (options: SwitchOptions) => void;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a Switch state manager
 */
export function createSwitch(options: SwitchOptions = {}): SwitchState {
  const { initialValue = false } = options;
  let runtimeOptions = options;

  const [value, setValueSignal] = createSignal(initialValue);

  const toggle = () => {
    setValueSignal((v) => {
      const newValue = !v;
      runtimeOptions.onChange?.(newValue);
      return newValue;
    });
  };

  const setOn = () => {
    if (!value()) {
      setValueSignal(true);
      runtimeOptions.onChange?.(true);
    }
  };

  const setOff = () => {
    if (value()) {
      setValueSignal(false);
      runtimeOptions.onChange?.(false);
    }
  };

  const setValue = (newValue: boolean) => {
    if (value() !== newValue) {
      setValueSignal(newValue);
      runtimeOptions.onChange?.(newValue);
    }
  };

  return {
    value,
    toggle,
    setOn,
    setOff,
    setValue,
    updateOptions: (nextOptions: SwitchOptions) => {
      runtimeOptions = nextOptions;
    },
  };
}

// =============================================================================
// Component
// =============================================================================

export interface SwitchProps extends SwitchOptions, ComponentKeyProps {
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
 *   colorOn: 'green',
 * })
 */
export const Switch = component<SwitchProps, VNode>('Switch', (props) => {
  const theme = getTheme();
  const {
    onLabel = 'ON',
    offLabel = 'OFF',
    showLabels = false,
    colorOn = theme.accents.positive,
    colorOff = theme.foreground.muted,
    background = theme.borders.default,
    size = 'normal',
    disabled = false,
    isActive = true,
    label,
    state: externalState,
  } = props;

  const state = useFactoryState(externalState, props, createSwitch);
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
  const color = isOn ? colorOn : colorOff;

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
            Text({ color: colorOn }, '●'),
            Text({ color: background, dim: true }, '━')
          )
        : Box(
            { flexDirection: 'row' },
            Text({ color: background, dim: true }, '━'),
            Text({ color: colorOff }, '○')
          );
    } else {
      // Normal: ━●━━ or ━━○━
      const trackLen = 4;
      const thumbPos = isOn ? trackLen - 1 : 0;

      const trackChars: VNode[] = [];
      for (let i = 0; i < trackLen; i++) {
        if (i === thumbPos) {
          trackChars.push(
            Text({ color: isOn ? colorOn : colorOff }, isOn ? '●' : '○')
          );
        } else {
          trackChars.push(Text({ color: background, dim: true }, '━'));
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
    parts.push(Box({ marginRight: 1 }, Text({ color: colorOff, dim: true }, offLabel)));
  }

  parts.push(switchVisual);

  if (showLabels && isOn) {
    parts.push(Box({ marginLeft: 1 }, Text({ color: colorOn }, onLabel)));
  }

  return Box(
    {
      flexDirection: 'row',
      onClick: disabled ? undefined : () => state.toggle(),
    },
    ...parts
  );
});

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

export interface ToggleGroupOptions extends ComponentKeyProps {
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
function renderToggleGroup(props: ToggleGroupOptions): VNode {
  const {
    options,
    direction = 'vertical',
    gap = 1,
    onChange,
    isActive = true,
  } = props;

  const states = useConst(() => new Map<string, SwitchState>());
  const activeKeys = new Set(options.map((option) => option.key));
  for (const key of states.keys()) {
    if (!activeKeys.has(key)) states.delete(key);
  }
  for (const option of options) {
    let state = states.get(option.key);
    const emitChange = () => {
      if (!onChange) return;
      onChange(Object.fromEntries(
        options.map((current) => [current.key, states.get(current.key)?.value() ?? false]),
      ));
    };
    if (!state) {
      state = createSwitch({ initialValue: option.initialValue, onChange: emitChange });
      states.set(option.key, state);
    } else {
      state.updateOptions?.({ initialValue: option.initialValue, onChange: emitChange });
    }
  }

  const toggleNodes = options.map((opt) =>
    Switch({
      key: opt.key,
      label: opt.label,
      disabled: opt.disabled,
      state: states.get(opt.key),
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

export const ToggleGroup = component<ToggleGroupOptions, VNode>('ToggleGroup', renderToggleGroup);
