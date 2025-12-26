/**
 * DevX Composite Input Components
 *
 * @layer Atom
 * @description Pre-configured input components for common use cases
 *
 * These components wrap TextInput with additional functionality:
 * - SearchInput: Search icon, clear button, submit on Enter
 * - PasswordInput: Visibility toggle
 * - NumberInput: Increment/decrement controls
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { createSignal } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { getTheme } from '../core/theme.js';
import { getRenderMode } from '../core/capabilities.js';
import { createTextInput, renderTextInput, type TextInputOptions } from './text-input.js';

// =============================================================================
// Icons (with ASCII fallbacks)
// =============================================================================

function getIcons() {
  const isAscii = getRenderMode() === 'ascii';
  return {
    search: isAscii ? '[?]' : '🔍',
    clear: isAscii ? '[x]' : '✕',
    eye: isAscii ? '[o]' : '👁',
    eyeOff: isAscii ? '[-]' : '👁‍🗨',
    plus: isAscii ? '[+]' : '▲',
    minus: isAscii ? '[-]' : '▼',
  };
}

// =============================================================================
// SearchInput
// =============================================================================

export interface SearchInputOptions extends Omit<TextInputOptions, 'onSubmit'> {
  /** Called when Enter is pressed */
  onSubmit?: (value: string) => void;
  /** Called when clear button is clicked */
  onClear?: () => void;
}

export interface SearchInputState {
  /** Current value */
  value: () => string;
  /** Cursor position */
  cursorPosition: () => number;
  /** Set value */
  setValue: (v: string) => void;
  /** Clear the input */
  clear: () => void;
  /** Submit the current value */
  submit: () => void;
  /** Handle input events */
  handleInput: (input: string, key: import('../hooks/types.js').Key) => void;
  /** Focus the input */
  focus: () => void;
  /** Internal state for renderTextInput */
  _internal: ReturnType<typeof createTextInput>;
}

/**
 * Create a SearchInput state manager
 *
 * @example
 * ```typescript
 * const search = createSearchInput({
 *   placeholder: 'Search...',
 *   onSubmit: (query) => handleSearch(query),
 *   onClear: () => setResults([]),
 * });
 *
 * SearchInput({ state: search });
 *
 * // Programmatic control
 * search.clear();
 * search.setValue('react');
 * search.submit();
 * ```
 */
export function createSearchInput(options: SearchInputOptions = {}): SearchInputState {
  const textInput = createTextInput({
    ...options,
    placeholder: options.placeholder || 'Search...',
    onSubmit: options.onSubmit,
  });

  return {
    value: textInput.value,
    cursorPosition: textInput.cursorPosition,
    setValue: textInput.setValue,
    handleInput: textInput.handleInput,
    focus: textInput.focus,
    clear: () => {
      textInput.clear();
      options.onClear?.();
    },
    submit: () => {
      options.onSubmit?.(textInput.value());
    },
    _internal: textInput,
  };
}

export interface SearchInputProps {
  /** State from createSearchInput() */
  state?: SearchInputState;
  /** Or use standalone with value */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Called on value change */
  onChange?: (value: string) => void;
  /** Called when Enter is pressed */
  onSubmit?: (value: string) => void;
  /** Called when clear button is clicked */
  onClear?: () => void;
  /** Is input focused */
  isActive?: boolean | (() => boolean);
  /** Show search icon (default: true) */
  showSearchIcon?: boolean;
  /** Show clear button (default: true) */
  showClearButton?: boolean;
  /** Width */
  width?: number;
  /** Border style */
  borderStyle?: 'none' | 'single' | 'round' | 'double';
  /** Input options */
  inputOptions?: TextInputOptions;
}

/**
 * SearchInput - Text input with search icon and clear button
 *
 * @example
 * ```typescript
 * // With state manager
 * const search = createSearchInput({ onSubmit: handleSearch });
 * SearchInput({ state: search });
 *
 * // Standalone
 * SearchInput({
 *   placeholder: 'Search files...',
 *   onSubmit: (query) => searchFiles(query),
 *   onClear: () => clearResults(),
 * });
 * ```
 */
export function SearchInput(props: SearchInputProps): VNode {
  const theme = getTheme();
  const icons = getIcons();
  const {
    state,
    value,
    placeholder = 'Search...',
    onChange,
    onSubmit,
    onClear,
    isActive = true,
    showSearchIcon = true,
    showClearButton = true,
    width,
    borderStyle = 'round',
    inputOptions = {},
  } = props;

  // Use state or create inline
  const internalState = state || createSearchInput({
    initialValue: value,
    placeholder,
    onChange,
    onSubmit,
    onClear,
    ...inputOptions,
  });

  const currentValue = internalState.value();
  const hasValue = currentValue.length > 0;

  const handleClear = () => {
    internalState.clear();
  };

  return Box(
    {
      flexDirection: 'row',
      alignItems: 'center',
      borderStyle,
      borderColor: theme.foreground.muted,
      paddingX: 1,
      width,
    },
    // Search icon
    showSearchIcon
      ? Box(
          { marginRight: 1 },
          Text({ color: theme.foreground.muted }, icons.search)
        )
      : null,
    // Input
    Box(
      { flexGrow: 1 },
      renderTextInput(internalState._internal, {
        borderStyle: 'none',
        isActive,
        fullWidth: true,
        placeholder,
      })
    ),
    // Clear button (visible when has value)
    showClearButton && hasValue
      ? Box(
          { onClick: handleClear, marginLeft: 1 },
          Text({ color: theme.foreground.muted }, icons.clear)
        )
      : null
  );
}

// =============================================================================
// PasswordInput
// =============================================================================

export interface PasswordInputOptions extends TextInputOptions {
  /** Initial visibility state */
  visible?: boolean;
}

export interface PasswordInputState {
  /** Current value */
  value: () => string;
  /** Cursor position */
  cursorPosition: () => number;
  /** Set value */
  setValue: (v: string) => void;
  /** Clear the input */
  clear: () => void;
  /** Handle input events */
  handleInput: (input: string, key: import('../hooks/types.js').Key) => void;
  /** Focus the input */
  focus: () => void;
  /** Is password visible */
  isVisible: () => boolean;
  /** Toggle visibility */
  toggleVisibility: () => void;
  /** Set visibility */
  setVisible: (visible: boolean) => void;
  /** Internal state for renderTextInput */
  _internal: ReturnType<typeof createTextInput>;
}

/**
 * Create a PasswordInput state manager
 *
 * @example
 * ```typescript
 * const password = createPasswordInput({
 *   onSubmit: (value) => login(value),
 * });
 *
 * PasswordInput({ state: password });
 *
 * // Programmatic control
 * password.toggleVisibility();
 * console.log(password.value());
 * ```
 */
export function createPasswordInput(options: PasswordInputOptions = {}): PasswordInputState {
  const [isVisible, setIsVisible] = createSignal(options.visible ?? false);

  const textInput = createTextInput({
    ...options,
    password: true,
    placeholder: options.placeholder || 'Password',
  });

  return {
    value: textInput.value,
    cursorPosition: textInput.cursorPosition,
    setValue: textInput.setValue,
    clear: textInput.clear,
    handleInput: textInput.handleInput,
    focus: textInput.focus,
    isVisible,
    toggleVisibility: () => setIsVisible(!isVisible()),
    setVisible: setIsVisible,
    _internal: textInput,
  };
}

export interface PasswordInputProps {
  /** State from createPasswordInput() */
  state?: PasswordInputState;
  /** Or use standalone with value */
  value?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Called on value change */
  onChange?: (value: string) => void;
  /** Called when Enter is pressed */
  onSubmit?: (value: string) => void;
  /** Is input focused */
  isActive?: boolean | (() => boolean);
  /** Show visibility toggle (default: true) */
  showToggle?: boolean;
  /** Width */
  width?: number;
  /** Border style */
  borderStyle?: 'none' | 'single' | 'round' | 'double';
  /** Input options */
  inputOptions?: TextInputOptions;
}

/**
 * PasswordInput - Password input with visibility toggle
 *
 * @example
 * ```typescript
 * const password = createPasswordInput({ onSubmit: login });
 * PasswordInput({ state: password });
 * ```
 */
export function PasswordInput(props: PasswordInputProps): VNode {
  const theme = getTheme();
  const icons = getIcons();
  const {
    state,
    value,
    placeholder = 'Password',
    onChange,
    onSubmit,
    isActive = true,
    showToggle = true,
    width,
    borderStyle = 'round',
    inputOptions = {},
  } = props;

  // Use state or create inline
  const internalState = state || createPasswordInput({
    initialValue: value,
    placeholder,
    onChange,
    onSubmit,
    ...inputOptions,
  });

  const isVisible = internalState.isVisible();

  return Box(
    {
      flexDirection: 'row',
      alignItems: 'center',
      borderStyle,
      borderColor: theme.foreground.muted,
      paddingX: 1,
      width,
    },
    // Input
    Box(
      { flexGrow: 1 },
      renderTextInput(internalState._internal, {
        borderStyle: 'none',
        isActive,
        fullWidth: true,
        password: !isVisible,
        placeholder,
      })
    ),
    // Toggle button
    showToggle
      ? Box(
          { onClick: () => internalState.toggleVisibility(), marginLeft: 1 },
          Text({ color: theme.foreground.muted }, isVisible ? icons.eye : icons.eyeOff)
        )
      : null
  );
}

// =============================================================================
// NumberInput
// =============================================================================

export interface NumberInputOptions {
  /** Initial value */
  initialValue?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step for increment/decrement */
  step?: number;
  /** Called on value change */
  onChange?: (value: number) => void;
}

export interface NumberInputState {
  /** Current value */
  value: () => number;
  /** Set value */
  setValue: (value: number) => void;
  /** Increment by step */
  increment: () => void;
  /** Decrement by step */
  decrement: () => void;
  /** Clamp value to min/max */
  clamp: (value: number) => number;
}

/**
 * Create a NumberInput state manager
 *
 * @example
 * ```typescript
 * const quantity = createNumberInput({
 *   initialValue: 1,
 *   min: 0,
 *   max: 100,
 *   step: 1,
 *   onChange: (val) => setQuantity(val),
 * });
 *
 * NumberInput({ state: quantity });
 *
 * // Programmatic control
 * quantity.increment();
 * quantity.setValue(50);
 * ```
 */
export function createNumberInput(options: NumberInputOptions = {}): NumberInputState {
  const { min, max, step = 1, onChange } = options;
  const [value, setValueInternal] = createSignal(options.initialValue ?? 0);

  const clamp = (val: number): number => {
    let clamped = val;
    if (min !== undefined) clamped = Math.max(min, clamped);
    if (max !== undefined) clamped = Math.min(max, clamped);
    return clamped;
  };

  const setValue = (val: number) => {
    const clamped = clamp(val);
    setValueInternal(clamped);
    onChange?.(clamped);
  };

  return {
    value,
    setValue,
    increment: () => setValue(value() + step),
    decrement: () => setValue(value() - step),
    clamp,
  };
}

export interface NumberInputProps {
  /** State from createNumberInput() */
  state?: NumberInputState;
  /** Or use standalone with value */
  value?: number;
  /** Minimum value */
  min?: number;
  /** Maximum value */
  max?: number;
  /** Step for increment/decrement */
  step?: number;
  /** Called on value change */
  onChange?: (value: number) => void;
  /** Is input focused */
  isActive?: boolean | (() => boolean);
  /** Show increment/decrement buttons (default: true) */
  showButtons?: boolean;
  /** Button position */
  buttonPosition?: 'sides' | 'right';
  /** Width */
  width?: number;
  /** Border style */
  borderStyle?: 'none' | 'single' | 'round' | 'double';
}

/**
 * NumberInput - Numeric input with increment/decrement controls
 *
 * @example
 * ```typescript
 * const qty = createNumberInput({ min: 0, max: 100, step: 1 });
 * NumberInput({ state: qty });
 * ```
 */
export function NumberInput(props: NumberInputProps): VNode {
  const theme = getTheme();
  const icons = getIcons();
  const {
    state,
    value,
    min,
    max,
    step = 1,
    onChange,
    isActive = true,
    showButtons = true,
    buttonPosition = 'sides',
    width = 10,
    borderStyle = 'round',
  } = props;

  // Use state or create inline
  const internalState = state || createNumberInput({
    initialValue: value ?? 0,
    min,
    max,
    step,
    onChange,
  });

  const currentValue = internalState.value();
  const isActiveResolved = typeof isActive === 'function' ? isActive() : isActive;

  // Handle keyboard input
  if (isActiveResolved) {
    useInput((_input, key) => {
      if (key.upArrow) internalState.increment();
      if (key.downArrow) internalState.decrement();
    });
  }

  const decrementButton = Box(
    { onClick: () => internalState.decrement() },
    Text({ color: theme.foreground.muted }, icons.minus)
  );

  const incrementButton = Box(
    { onClick: () => internalState.increment() },
    Text({ color: theme.foreground.muted }, icons.plus)
  );

  const valueDisplay = Box(
    { flexGrow: 1, justifyContent: 'center' },
    Text({ color: theme.foreground.primary }, String(currentValue))
  );

  if (buttonPosition === 'right') {
    return Box(
      {
        flexDirection: 'row',
        alignItems: 'center',
        borderStyle,
        borderColor: theme.foreground.muted,
        paddingX: 1,
        width,
      },
      valueDisplay,
      showButtons ? Box(
        { flexDirection: 'column', marginLeft: 1 },
        incrementButton,
        decrementButton
      ) : null
    );
  }

  // Default: sides
  return Box(
    {
      flexDirection: 'row',
      alignItems: 'center',
      borderStyle,
      borderColor: theme.foreground.muted,
      paddingX: 1,
      width,
    },
    showButtons ? decrementButton : null,
    valueDisplay,
    showButtons ? incrementButton : null
  );
}
