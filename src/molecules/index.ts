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
  type SelectItem,
  type SelectOptions,
} from './select.js';

export {
  MultiSelect,
  createMultiSelect,
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
  createAutocomplete,
  Combobox,
  TagInput,
  createTagInput,
  type AutocompleteItem,
  type AutocompleteOptions,
  type AutocompleteState,
  type AutocompleteProps,
  type ComboboxProps,
  type TagInputOptions,
  type TagInputState,
} from './autocomplete.js';

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
  type Tab,
  type TabsOptions,
  type TabsState,
  type TabsProps,
  type TabPanelProps,
  type VerticalTabsOptions,
  type LazyTabsProps,
} from './tabs.js';

export {
  Tree,
  DirectoryTree,
  createTree,
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
  type CalendarEvent,
  type CalendarOptions,
  type CalendarState,
  type CalendarDay,
  type CalendarProps,
  type MiniCalendarOptions,
  type DatePickerOptions,
  type DatePickerState,
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
