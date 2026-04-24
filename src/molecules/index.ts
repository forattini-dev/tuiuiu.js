/**
 * Molecules - Composed atoms forming functional UI units
 *
 * @layer Molecule
 * @description Components that combine atoms into functional groups
 *
 * Molecules are groups of atoms bonded together that form the smallest
 * fundamental units of a compound. They have their own distinct properties.
 */

// Selection
export {
  Select,
  Confirm,
  Checkbox,
  createSelect,
  renderSelect,
  useSelectState,
  type SelectItem,
  type CreateSelectOptions,
  type SelectRenderOptions,
  type SelectProps,
  type SelectOptions,
} from './select.js';

export {
  MultiSelect,
  createMultiSelect,
  useMultiSelectState,
  type MultiSelectItem,
  type MultiSelectOptions,
  type MultiSelectState,
  type MultiSelectProps,
} from './multi-select.js';

export {
  RadioGroup,
  InlineRadio,
  createRadioGroup,
  type RadioOption,
  type RadioGroupOptions,
  type RadioGroupState,
  type RadioGroupProps,
  type InlineRadioProps,
} from './radio-group.js';

export {
  Autocomplete,
  AutocompleteInput,
  AutocompleteSuggestions,
  createAutocomplete,
  useAutocompleteState,
  Combobox,
  TagInput,
  createTagInput,
  useTagInputState,
  type AutocompleteItem,
  type AutocompleteOptions,
  type AutocompleteState,
  type AutocompleteProps,
  type AutocompleteInputProps,
  type AutocompleteSuggestionsProps,
  type ComboboxProps,
  type TagInputOptions,
  type TagInputState,
  type TagInputProps,
} from './autocomplete.js';

// Composite Inputs
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

export {
  ConfirmButton,
  createConfirmButton,
  type ConfirmButtonOptions,
  type ConfirmButtonState,
  type ConfirmButtonProps,
} from './confirm-button.js';

// Data Display
export {
  Table,
  SimpleTable,
  KeyValueTable,
  type TableColumn,
  type TableOptions,
  type TableBorderStyle,
  type TextAlign,
} from './table.js';

export {
  Tabs,
  TabPanel,
  VerticalTabs,
  LazyTabs,
  createTabs,
  useTabsState,
  type Tab,
  type TabsOptions,
  type TabsState,
  type TabsProps,
  type TabPanelProps,
  type VerticalTabsOptions,
  type VerticalTabsProps,
  type LazyTabsProps,
} from './tabs.js';

export {
  Tree,
  DirectoryTree,
  createTree,
  useTreeState,
  type TreeNode,
  type TreeOptions,
  type TreeState,
  type TreeProps,
  type FlattenedNode,
  type DirectoryNode,
  type DirectoryTreeOptions,
} from './tree.js';

export {
  Calendar,
  MiniCalendar,
  DatePicker,
  createCalendar,
  createDatePicker,
  useCalendarState,
  useDatePickerState,
  type CalendarEvent,
  type CalendarOptions,
  type CalendarState,
  type CalendarDay,
  type CalendarProps,
  type MiniCalendarOptions,
  type DatePickerOptions,
  type DatePickerState,
  type DatePickerProps,
} from './calendar.js';

export {
  CodeBlock,
  InlineCode,
  type Language,
  type CodeTheme,
  type CodeBlockOptions,
} from './code-block.js';

export {
  Markdown,
  renderMarkdown,
  type MarkdownOptions,
} from './markdown.js';

export {
  TerminalMessage,
  type TerminalMessageOptions,
  type TerminalMessageRole,
  type TerminalMessageRoleStyle,
} from './terminal-message.js';

export {
  ActivityTrail,
  type ActivityStatus,
  type ActivityTrailItem,
  type ActivityTrailOptions,
  type ActivityTrailStatusStyle,
} from './activity-trail.js';

// Layout
export {
  Collapsible,
  Accordion,
  Details,
  ExpandableText,
  createCollapsible,
  createAccordion,
  type CollapsibleOptions,
  type CollapsibleState,
  type CollapsibleProps,
  type AccordionSection,
  type AccordionOptions,
  type AccordionState,
  type AccordionProps,
  type DetailsProps,
  type ExpandableTextProps,
} from './collapsible.js';

// Form helpers
export {
  FormField,
  FormGroup,
  type FormFieldProps,
  type FormGroupProps,
} from './form-field.js';

// Data Visualization
export * from './data-viz/index.js';

// SplitView - Master-detail layout
export {
  SplitView,
  createSplitView,
  type SplitViewProps,
  type CreateSplitViewOptions,
  type SplitViewState,
  type SplitDirection,
} from './split-view.js';

// Splash Screen - Animated loading/intro screens
export {
  SplashScreen,
  createSplashScreen,
  TuiuiuSplash,
  ImpactSplashScreen,
  MinimalSplash,
  ProgressSplash,
  parseColoredBBCode,
  TUIUIU_LOGO_LARGE,
  TUIUIU_LOGO_MEDIUM,
  TUIUIU_LOGO_SMALL,
  type SplashScreenOptions,
  type SplashScreenState,
  type SplashScreenProps,
  type ImpactSplashProps,
} from './splash-screen.js';

// Menu - Navigable menu with submenus
export {
  Menu,
  createMenu,
} from './menu.js';

export type {
  MenuItem,
  MenuSeparator,
  MenuEntry,
  MenuOptions,
  MenuProps,
  MenuState,
} from './menu.js';
