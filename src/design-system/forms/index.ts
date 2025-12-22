/**
 * Design System Forms - User input components
 *
 * Re-exports from canonical sources (atoms/molecules)
 * to maintain consistent API while avoiding code duplication.
 */

// =============================================================================
// Re-exports from Atoms
// =============================================================================

// Button
export {
  Button,
  IconButton,
  ButtonGroup,
  type ButtonProps,
  type ButtonVariant,
  type ButtonSize,
  type IconButtonProps,
  type ButtonGroupProps,
} from '../../atoms/button.js';

// Text Input
export {
  createTextInput,
  renderTextInput,
  TextInput,
  type TextInputState,
  type TextInputOptions,
  type TextInputProps,
} from '../../atoms/text-input.js';

// Switch / Toggle
export {
  createSwitch,
  Switch,
  ToggleGroup,
  type SwitchOptions,
  type SwitchState,
  type SwitchProps,
  type ToggleOption,
  type ToggleGroupOptions,
} from '../../atoms/switch.js';

// Slider
export {
  createSlider,
  Slider,
  createRangeSlider,
  RangeSlider,
  type SliderOptions,
  type SliderState,
  type SliderProps,
  type RangeSliderOptions,
  type RangeSliderState,
} from '../../atoms/slider.js';

// =============================================================================
// Re-exports from Molecules
// =============================================================================

// Select / Menu
export {
  createSelect,
  renderSelect,
  Select,
  Confirm,
  Checkbox,
  type SelectItem,
  type SelectOptions,
} from '../../molecules/select.js';

// Multi-Select
export {
  createMultiSelect,
  MultiSelect,
  type MultiSelectItem,
  type MultiSelectOptions,
  type MultiSelectState,
  type MultiSelectProps,
} from '../../molecules/multi-select.js';

// Radio Group
export {
  createRadioGroup,
  RadioGroup,
  InlineRadio,
  type RadioOption,
  type RadioGroupOptions,
  type RadioGroupState,
  type RadioGroupProps,
  type InlineRadioProps,
} from '../../molecules/radio-group.js';

// Autocomplete
export {
  createAutocomplete,
  Autocomplete,
  Combobox,
  createTagInput,
  TagInput,
  type AutocompleteItem,
  type AutocompleteOptions,
  type AutocompleteState,
  type AutocompleteProps,
  type ComboboxProps,
  type TagInputOptions,
  type TagInputState,
} from '../../molecules/autocomplete.js';
