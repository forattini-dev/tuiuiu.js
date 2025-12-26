/**
 * Atoms - Smallest UI units with internal state
 *
 * @layer Atoms
 * @description Basic interactive components (buttons, inputs, badges, etc.)
 *
 * Atoms are the smallest functional units in our component hierarchy.
 * They can have internal state but are not composed of other components.
 *
 * Examples:
 * - Badge: Simple status indicator
 * - Button: Clickable action trigger
 * - Spinner: Loading indicator
 * - TextInput: Text entry field
 * - Slider: Numeric value selection
 * - Switch: Boolean toggle
 * - Timer: Time display/countdown
 * - ProgressBar: Progress indicator
 * - Tooltip: Contextual information
 */

// =============================================================================
// Spinner - Loading indicators
// =============================================================================
export {
  Spinner,
  createSpinner,
  renderSpinner,
  listSpinnerStyles,
  getSpinnerConfig,
  getSpinnerCount,
  type SpinnerOptions,
  type SpinnerStyle,
} from './spinner.js';

// =============================================================================
// Timer - Stopwatch and countdown
// =============================================================================
export {
  Timer,
  createTimer,
  createMultiTimer,
  formatTime,
  parseTime,
  type TimerProps,
  type TimerState,
  type TimerFormat,
  type TimerMode,
  type CreateTimerOptions,
  type MultiTimerState,
} from './timer.js';

// =============================================================================
// Button - Clickable actions with keyboard navigation
// =============================================================================
export {
  Button,
  IconButton,
  ButtonGroup,
  createButtonGroup,
  renderButtonGroup,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type IconButtonProps,
  type ButtonGroupProps,
  type ButtonGroupState,
  type ButtonGroupOptions,
} from './button.js';

// =============================================================================
// Switch - Boolean toggle
// =============================================================================
export {
  Switch,
  createSwitch,
  ToggleGroup,
  type SwitchProps,
  type SwitchState,
  type SwitchOptions,
  type ToggleOption,
  type ToggleGroupOptions,
} from './switch.js';

// =============================================================================
// Slider - Numeric value selection
// =============================================================================
export {
  Slider,
  createSlider,
  RangeSlider,
  createRangeSlider,
  type SliderProps,
  type SliderState,
  type SliderOptions,
  type RangeSliderOptions,
  type RangeSliderState,
} from './slider.js';

// =============================================================================
// TextInput - Text entry
// =============================================================================
export {
  TextInput,
  createTextInput,
  renderTextInput,
  type TextInputProps,
  type TextInputOptions,
  type TextInputState,
} from './text-input.js';

// =============================================================================
// ProgressBar - Progress indicators
// =============================================================================
export {
  ProgressBar,
  createProgressBar,
  renderProgressBar,
  MultiProgressBar,
  type ProgressBarOptions,
  type ProgressBarStyle,
} from './progress-bar.js';

// =============================================================================
// Tooltip & related visual components
// =============================================================================
export {
  Tooltip,
  WithTooltip,
  HelpTooltip,
  InfoBox,
  Popover,
  Badge,
  Tag,
  type TooltipOptions,
  type TooltipPosition,
  type WithTooltipOptions,
  type HelpTooltipOptions,
  type InfoBoxOptions,
  type InfoBoxType,
  type PopoverOptions,
  type BadgeOptions,
  type TagOptions,
} from './tooltip.js';

// =============================================================================
// DevX Composite Inputs
// =============================================================================
export {
  SearchInput,
  createSearchInput,
  PasswordInput,
  createPasswordInput,
  NumberInput,
  createNumberInput,
  type SearchInputOptions,
  type SearchInputState,
  type SearchInputProps,
  type PasswordInputOptions,
  type PasswordInputState,
  type PasswordInputProps,
  type NumberInputOptions,
  type NumberInputState,
  type NumberInputProps,
} from './devx-inputs.js';

// =============================================================================
// ConfirmButton - Two-click safety button
// =============================================================================
export {
  ConfirmButton,
  createConfirmButton,
  type ConfirmButtonOptions,
  type ConfirmButtonState,
  type ConfirmButtonProps,
} from './confirm-button.js';
