/**
 * Slider - Numeric value slider
 *
 * @layer Atom
 * @description Interactive slider for numeric value selection
 *
 * Features:
 * - Keyboard-driven value selection
 * - Step increments
 * - Range constraints
 * - Visual track and thumb
 * - Value display
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { useFactoryState } from '../hooks/factory-state.js';
import { getRenderMode } from '../core/capabilities.js';
import { component, type ComponentKeyProps } from '../app/component.js';

// =============================================================================
// Types
// =============================================================================

export interface SliderOptions {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Initial value */
  initialValue?: number;
  /** Slider width in characters */
  width?: number;
  /** Show current value */
  showValue?: boolean;
  /** Show min/max labels */
  showMinMax?: boolean;
  /** Value formatter */
  formatValue?: (value: number) => string;
  /** Filled track color */
  color?: ColorValue;
  /** Empty track color */
  background?: ColorValue;
  /** Thumb color */
  thumbColor?: ColorValue;
  /** Is disabled */
  disabled?: boolean;
  /** Callbacks */
  onChange?: (value: number) => void;
  /** Is active */
  isActive?: boolean;
}

export interface SliderState {
  value: () => number;
  normalized: () => number;
  increment: () => void;
  decrement: () => void;
  incrementLarge: () => void;
  decrementLarge: () => void;
  setValue: (value: number) => void;
  setNormalized: (normalized: number) => void;
  updateOptions: (options: SliderOptions) => void;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a Slider state manager
 */
export function createSlider(options: SliderOptions = {}): SliderState {
  const {
    min = 0,
    max = 100,
    initialValue = min,
  } = options;
  let runtimeOptions = options;

  const getMin = () => runtimeOptions.min ?? min;
  const getMax = () => runtimeOptions.max ?? max;
  const getStep = () => runtimeOptions.step ?? 1;
  const clamp = (v: number) => Math.max(getMin(), Math.min(getMax(), v));
  const [value, setValueSignal] = createSignal(clamp(initialValue));

  const normalized = () => {
    const currentMin = getMin();
    const currentMax = getMax();
    const range = currentMax - currentMin;
    return range > 0 ? (value() - currentMin) / range : 0;
  };

  const increment = () => {
    setValueSignal((v) => {
      const newValue = clamp(v + getStep());
      if (newValue !== v) runtimeOptions.onChange?.(newValue);
      return newValue;
    });
  };

  const decrement = () => {
    setValueSignal((v) => {
      const newValue = clamp(v - getStep());
      if (newValue !== v) runtimeOptions.onChange?.(newValue);
      return newValue;
    });
  };

  const incrementLarge = () => {
    const largeStep = getStep() * 10;
    setValueSignal((v) => {
      const newValue = clamp(v + largeStep);
      if (newValue !== v) runtimeOptions.onChange?.(newValue);
      return newValue;
    });
  };

  const decrementLarge = () => {
    const largeStep = getStep() * 10;
    setValueSignal((v) => {
      const newValue = clamp(v - largeStep);
      if (newValue !== v) runtimeOptions.onChange?.(newValue);
      return newValue;
    });
  };

  const setValue = (newValue: number) => {
    const clamped = clamp(newValue);
    if (clamped !== value()) {
      setValueSignal(clamped);
      runtimeOptions.onChange?.(clamped);
    }
  };

  const setNormalized = (norm: number) => {
    const clampedNorm = Math.max(0, Math.min(1, norm));
    const currentMin = getMin();
    const currentMax = getMax();
    const newValue = currentMin + clampedNorm * (currentMax - currentMin);
    setValue(newValue);
  };

  return {
    value,
    normalized,
    increment,
    decrement,
    incrementLarge,
    decrementLarge,
    setValue,
    setNormalized,
    updateOptions: (nextOptions: SliderOptions) => {
      runtimeOptions = nextOptions;
      const clamped = clamp(value());
      if (clamped !== value()) {
        setValueSignal(clamped);
      }
    },
  };
}

// =============================================================================
// Component
// =============================================================================

export interface SliderProps extends SliderOptions, ComponentKeyProps {
  /** Pre-created state */
  state?: SliderState;
  /** Label */
  label?: string;
}

/**
 * Slider - Numeric value slider
 *
 * @example
 * // Basic slider
 * Slider({
 *   min: 0,
 *   max: 100,
 *   initialValue: 50,
 *   onChange: (value) => console.log(value),
 * })
 *
 * @example
 * // Volume control
 * Slider({
 *   label: 'Volume',
 *   min: 0,
 *   max: 100,
 *   showValue: true,
 *   formatValue: (v) => `${v}%`,
 *   color: 'green',
 * })
 */
export const Slider = component<SliderProps, VNode>('Slider', (props) => {
  const {
    min = 0,
    max = 100,
    width = 20,
    showValue = true,
    showMinMax = false,
    formatValue = (v) => String(Math.round(v)),
    color = 'primary',
    background = 'border',
    thumbColor = 'foreground',
    disabled = false,
    isActive = true,
    label,
    state: externalState,
  } = props;

  const state = useFactoryState(externalState, props, createSlider);
  const isAscii = getRenderMode() === 'ascii';

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (disabled) return;

      if (key.leftArrow || input === 'h') {
        state.decrement();
      } else if (key.rightArrow || input === 'l') {
        state.increment();
      } else if (key.upArrow || input === 'k') {
        state.incrementLarge();
      } else if (key.downArrow || input === 'j') {
        state.decrementLarge();
      } else if (input === '0') {
        state.setValue(min);
      } else if (input === '$') {
        state.setValue(max);
      }
    },
    { isActive }
  );

  const norm = state.normalized();
  const currentValue = state.value();
  const thumbPos = Math.round(norm * (width - 1));

  // Build track
  const trackParts: VNode[] = [];

  if (isAscii) {
    // ASCII: [=====>    ]
    for (let i = 0; i < width; i++) {
      if (i < thumbPos) {
        trackParts.push(Text({ color }, '='));
      } else if (i === thumbPos) {
        trackParts.push(Text({ color: thumbColor, bold: true }, '>'));
      } else {
        trackParts.push(Text({ color: background, dim: true }, '-'));
      }
    }
  } else {
    // Unicode: ━━━━●░░░░░
    for (let i = 0; i < width; i++) {
      if (i < thumbPos) {
        trackParts.push(Text({ color }, '━'));
      } else if (i === thumbPos) {
        trackParts.push(Text({ color: thumbColor, bold: true }, '●'));
      } else {
        trackParts.push(Text({ color: background, dim: true }, '░'));
      }
    }
  }

  // Build full component
  const parts: (VNode | null)[] = [];

  if (label) {
    parts.push(Box({ marginRight: 1 }, Text({ dim: disabled }, label)));
  }

  if (showMinMax) {
    parts.push(Box({ marginRight: 1 }, Text({ color: 'mutedForeground', dim: true }, formatValue(min))));
  }

  parts.push(Box({ flexDirection: 'row' }, ...trackParts));

  if (showMinMax) {
    parts.push(Box({ marginLeft: 1 }, Text({ color: 'mutedForeground', dim: true }, formatValue(max))));
  }

  if (showValue) {
    parts.push(Box({ marginLeft: 1 }, Text({ color }, formatValue(currentValue))));
  }

  return Box(
    { flexDirection: 'row', alignItems: 'center' },
    ...parts
  );
});

// =============================================================================
// Range Slider (two thumbs)
// =============================================================================

export interface RangeSliderOptions {
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step increment */
  step?: number;
  /** Initial range [start, end] */
  initialValue?: [number, number];
  /** Slider width */
  width?: number;
  /** Show values */
  showValue?: boolean;
  /** Value formatter */
  formatValue?: (value: number) => string;
  /** Range color */
  rangeColor?: ColorValue;
  /** Track color */
  trackColor?: ColorValue;
  /** Callbacks */
  onChange?: (range: [number, number]) => void;
  /** Is active */
  isActive?: boolean;
}

export interface RangeSliderState {
  range: () => [number, number];
  activeThumb: () => 'start' | 'end';
  switchThumb: () => void;
  increment: () => void;
  decrement: () => void;
  setRange: (range: [number, number]) => void;
  updateOptions: (options: RangeSliderOptions) => void;
}

/**
 * Create a RangeSlider state manager
 */
export function createRangeSlider(options: RangeSliderOptions = {}): RangeSliderState {
  const {
    min = 0,
    max = 100,
    initialValue = [min, max],
  } = options;
  let runtimeOptions = options;

  const getMin = () => runtimeOptions.min ?? min;
  const getMax = () => runtimeOptions.max ?? max;
  const getStep = () => runtimeOptions.step ?? 1;
  const clamp = (v: number) => Math.max(getMin(), Math.min(getMax(), v));
  const [range, setRangeSignal] = createSignal<[number, number]>([
    clamp(initialValue[0]),
    clamp(initialValue[1]),
  ]);
  const [activeThumb, setActiveThumb] = createSignal<'start' | 'end'>('start');

  const switchThumb = () => {
    setActiveThumb((t) => (t === 'start' ? 'end' : 'start'));
  };

  const increment = () => {
    setRangeSignal((r) => {
      const thumb = activeThumb();
      let newRange: [number, number];

      if (thumb === 'start') {
        const newStart = clamp(r[0] + getStep());
        newRange = [Math.min(newStart, r[1]), r[1]];
      } else {
        const newEnd = clamp(r[1] + getStep());
        newRange = [r[0], newEnd];
      }

      if (newRange[0] !== r[0] || newRange[1] !== r[1]) {
        runtimeOptions.onChange?.(newRange);
      }
      return newRange;
    });
  };

  const decrement = () => {
    setRangeSignal((r) => {
      const thumb = activeThumb();
      let newRange: [number, number];

      if (thumb === 'start') {
        const newStart = clamp(r[0] - getStep());
        newRange = [newStart, r[1]];
      } else {
        const newEnd = clamp(r[1] - getStep());
        newRange = [r[0], Math.max(newEnd, r[0])];
      }

      if (newRange[0] !== r[0] || newRange[1] !== r[1]) {
        runtimeOptions.onChange?.(newRange);
      }
      return newRange;
    });
  };

  const setRange = (newRange: [number, number]) => {
    const clamped: [number, number] = [
      clamp(Math.min(newRange[0], newRange[1])),
      clamp(Math.max(newRange[0], newRange[1])),
    ];
    setRangeSignal(clamped);
    runtimeOptions.onChange?.(clamped);
  };

  return {
    range,
    activeThumb,
    switchThumb,
    increment,
    decrement,
    setRange,
    updateOptions: (nextOptions: RangeSliderOptions) => {
      runtimeOptions = nextOptions;
      const [start, end] = range();
      const clamped: [number, number] = [
        clamp(Math.min(start, end)),
        clamp(Math.max(start, end)),
      ];
      if (clamped[0] !== start || clamped[1] !== end) {
        setRangeSignal(clamped);
      }
    },
  };
}

/**
 * RangeSlider - Two-thumb range selection
 *
 * @example
 * RangeSlider({
 *   min: 0,
 *   max: 100,
 *   initialValue: [20, 80],
 *   onChange: ([start, end]) => console.log(start, end),
 * })
 */
export interface RangeSliderProps extends RangeSliderOptions, ComponentKeyProps {
  /** Pre-created state */
  state?: RangeSliderState;
}

export const RangeSlider = component<RangeSliderProps, VNode>('RangeSlider', (props) => {
  const {
    min = 0,
    max = 100,
    width = 20,
    showValue = true,
    formatValue = (v) => String(Math.round(v)),
    rangeColor = 'primary',
    trackColor = 'border',
    isActive = true,
    state: externalState,
  } = props;

  const state = useFactoryState(externalState, props, createRangeSlider);
  const isAscii = getRenderMode() === 'ascii';

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.leftArrow || input === 'h') {
        state.decrement();
      } else if (key.rightArrow || input === 'l') {
        state.increment();
      } else if (key.tab || input === ' ') {
        state.switchThumb();
      }
    },
    { isActive }
  );

  const [start, end] = state.range();
  const active = state.activeThumb();
  const rangeVal = max - min;
  const startPos = Math.round(((start - min) / rangeVal) * (width - 1));
  const endPos = Math.round(((end - min) / rangeVal) * (width - 1));

  // Build track
  const trackParts: VNode[] = [];
  const thumbChar = isAscii ? 'O' : '●';
  const filledChar = isAscii ? '=' : '━';
  const emptyChar = isAscii ? '-' : '░';

  for (let i = 0; i < width; i++) {
    if (i === startPos) {
      trackParts.push(
        Text({ color: active === 'start' ? 'white' : rangeColor, bold: active === 'start' }, thumbChar)
      );
    } else if (i === endPos) {
      trackParts.push(
        Text({ color: active === 'end' ? 'white' : rangeColor, bold: active === 'end' }, thumbChar)
      );
    } else if (i > startPos && i < endPos) {
      trackParts.push(Text({ color: rangeColor }, filledChar));
    } else {
      trackParts.push(Text({ color: trackColor, dim: true }, emptyChar));
    }
  }

  const parts: VNode[] = [];

  if (showValue) {
    parts.push(Box({ marginRight: 1 }, Text({ color: 'mutedForeground' }, formatValue(start))));
  }

  parts.push(Box({ flexDirection: 'row' }, ...trackParts));

  if (showValue) {
    parts.push(Box({ marginLeft: 1 }, Text({ color: 'mutedForeground' }, formatValue(end))));
  }

  return Box(
    { flexDirection: 'row', alignItems: 'center' },
    ...parts
  );
});
