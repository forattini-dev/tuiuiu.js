/**
 * Design System Forms - User input components
 */

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
} from './button.js';

// Text Input
export {
  createTextInput,
  renderTextInput,
  TextInput,
  type TextInputState,
  type TextInputOptions,
  type TextInputProps,
} from './text-input.js';

// Select / Menu
export {
  createSelect,
  renderSelect,
  Select,
  Confirm,
  Checkbox,
  type SelectItem,
  type SelectOptions,
} from './select.js';

// Multi-Select
export {
  createMultiSelect,
  MultiSelect,
  type MultiSelectItem,
  type MultiSelectOptions,
  type MultiSelectState,
  type MultiSelectProps,
} from './multi-select.js';

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
} from './radio-group.js';

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
} from './switch.js';

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
} from './slider.js';

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
} from './autocomplete.js';
