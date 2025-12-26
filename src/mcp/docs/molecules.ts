/**
 * Molecules Documentation
 * Complete documentation for all molecule-level components
 */

import type { ComponentDoc } from '../types.js';

export const molecules: ComponentDoc[] = [
  // =============================================================================
  // Collapsible Components
  // =============================================================================
  {
    name: 'Collapsible',
    category: 'molecules',
    description: 'Expandable/collapsible section with keyboard support. Space/Enter toggles, arrows expand/collapse.',
    props: [
      { name: 'title', type: "string", required: true, description: 'Section title' },
      { name: 'children', type: "VNode | VNode[]", required: true, description: 'Content when expanded' },
      { name: 'initialExpanded', type: "boolean", required: false, default: 'false', description: 'Initial expanded state' },
      { name: 'collapsedIcon', type: "string", required: false, description: 'Icon when collapsed' },
      { name: 'expandedIcon', type: "string", required: false, description: 'Icon when expanded' },
      { name: 'titleColor', type: "ColorValue", required: false, default: "'white'", description: 'Title color' },
      { name: 'indent', type: "number", required: false, default: '2', description: 'Content indentation' },
      { name: 'disabled', type: "boolean", required: false, default: 'false', description: 'Disable interaction' },
      { name: 'onToggle', type: "(expanded: boolean) => void", required: false, description: 'Toggle callback' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard handling' },
      { name: 'state', type: "CollapsibleState", required: false, description: 'External state from createCollapsible()' },
    ],
    examples: [
      `Collapsible({\n  title: 'Advanced Options',\n  children: Box({}, Text({}, 'Hidden content'))\n})`,
      `// With custom icons\nCollapsible({\n  title: 'Details',\n  collapsedIcon: '📁',\n  expandedIcon: '📂',\n  children: detailsContent\n})`,
    ],
    relatedComponents: ['Accordion', 'Details', 'ExpandableText'],
  },
  {
    name: 'Accordion',
    category: 'molecules',
    description: 'Multiple collapsible sections with keyboard navigation. Supports single or multiple open sections.',
    props: [
      { name: 'sections', type: "AccordionSection[]", required: true, description: 'Array of { key, title, content, icon?, disabled? }' },
      { name: 'initialExpanded', type: "string", required: false, description: 'Initially expanded section key' },
      { name: 'multiple', type: "boolean", required: false, default: 'false', description: 'Allow multiple sections open' },
      { name: 'gap', type: "number", required: false, default: '0', description: 'Gap between sections' },
      { name: 'titleColor', type: "ColorValue", required: false, default: "'white'", description: 'Section title color' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Focused section color' },
      { name: 'onChange', type: "(expanded: string[]) => void", required: false, description: 'Change callback with expanded keys' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard handling' },
      { name: 'state', type: "AccordionState", required: false, description: 'External state from createAccordion()' },
    ],
    examples: [
      `Accordion({\n  sections: [\n    { key: 'general', title: 'General', content: GeneralContent() },\n    { key: 'advanced', title: 'Advanced', content: AdvancedContent() },\n  ],\n})`,
    ],
    relatedComponents: ['Collapsible', 'Tabs'],
  },
  {
    name: 'Details',
    category: 'molecules',
    description: 'Simple expandable section like HTML <details> element.',
    props: [
      { name: 'summary', type: "string", required: true, description: 'Summary text (always visible)' },
      { name: 'children', type: "VNode | VNode[]", required: true, description: 'Content when expanded' },
      { name: 'open', type: "boolean", required: false, default: 'false', description: 'Initial open state' },
      { name: 'icon', type: "string", required: false, description: 'Custom icon' },
    ],
    examples: [
      `Details({\n  summary: 'Click to see more',\n  children: Text({}, 'Hidden details here')\n})`,
    ],
    relatedComponents: ['Collapsible', 'ExpandableText'],
  },
  {
    name: 'ExpandableText',
    category: 'molecules',
    description: 'Long text with show more/less toggle. Truncates to maxLines when collapsed.',
    props: [
      { name: 'text', type: "string", required: true, description: 'Full text content' },
      { name: 'maxLines', type: "number", required: false, default: '3', description: 'Max visible lines when collapsed' },
      { name: 'showMoreLabel', type: "string", required: false, default: "'Show more'", description: 'Expand label' },
      { name: 'showLessLabel', type: "string", required: false, default: "'Show less'", description: 'Collapse label' },
      { name: 'color', type: "ColorValue", required: false, default: "'white'", description: 'Text color' },
    ],
    examples: [
      `ExpandableText({\n  text: veryLongText,\n  maxLines: 5,\n  showMoreLabel: 'Read more...',\n})`,
    ],
    relatedComponents: ['Details', 'Collapsible'],
  },

  // =============================================================================
  // Selection Components
  // =============================================================================
  {
    name: 'Select',
    category: 'molecules',
    description: 'Dropdown selection with keyboard navigation, search, and grouping.',
    props: [
      { name: 'items', type: "SelectItem[]", required: true, description: 'Array of { value, label, description?, disabled?, group? }' },
      { name: 'initialValue', type: "T", required: false, description: 'Initially selected value' },
      { name: 'placeholder', type: "string", required: false, default: "'Select...'", description: 'Placeholder when no selection' },
      { name: 'maxVisible', type: "number", required: false, default: '10', description: 'Max visible items' },
      { name: 'searchable', type: "boolean", required: false, default: 'true', description: 'Enable fuzzy search' },
      { name: 'width', type: "number", required: false, default: '30', description: 'Component width' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Focused item color' },
      { name: 'selectedColor', type: "ColorValue", required: false, default: "'green'", description: 'Selected item color' },
      { name: 'onChange', type: "(value: T) => void", required: false, description: 'Selection change handler' },
      { name: 'onSubmit', type: "(value: T) => void", required: false, description: 'Submit handler (Enter)' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "SelectState", required: false, description: 'External state from createSelect()' },
    ],
    examples: [
      `Select({\n  items: [\n    { value: 'us', label: 'United States' },\n    { value: 'uk', label: 'United Kingdom' },\n  ],\n  onChange: (country) => setCountry(country),\n})`,
    ],
    relatedComponents: ['MultiSelect', 'RadioGroup', 'Combobox'],
  },
  {
    name: 'Confirm',
    category: 'molecules',
    description: 'Yes/No confirmation prompt. Quick way to get boolean confirmation.',
    props: [
      { name: 'message', type: "string", required: true, description: 'Confirmation message' },
      { name: 'yesLabel', type: "string", required: false, default: "'Yes'", description: 'Yes button label' },
      { name: 'noLabel', type: "string", required: false, default: "'No'", description: 'No button label' },
      { name: 'defaultValue', type: "boolean", required: false, default: 'true', description: 'Default selection (Yes)' },
      { name: 'onConfirm', type: "(result: boolean) => void", required: true, description: 'Confirmation callback' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
    ],
    examples: [
      `Confirm({\n  message: 'Delete this file?',\n  onConfirm: (yes) => yes && deleteFile(),\n})`,
      `// Custom labels\nConfirm({\n  message: 'Save changes?',\n  yesLabel: 'Save',\n  noLabel: 'Discard',\n  onConfirm: handleSave,\n})`,
    ],
    relatedComponents: ['Select', 'Modal'],
  },
  {
    name: 'MultiSelect',
    category: 'molecules',
    description: 'Multi-selection with checkboxes, fuzzy search, and tags display.',
    props: [
      { name: 'items', type: "MultiSelectItem[]", required: true, description: 'Array of { value, label, description?, disabled?, group? }' },
      { name: 'initialValue', type: "T[]", required: false, default: '[]', description: 'Initially selected values' },
      { name: 'maxVisible', type: "number", required: false, default: '10', description: 'Max visible items' },
      { name: 'searchable', type: "boolean", required: false, default: 'true', description: 'Enable fuzzy search' },
      { name: 'searchPlaceholder', type: "string", required: false, description: 'Search placeholder text' },
      { name: 'showCount', type: "boolean", required: false, default: 'true', description: 'Show selected count' },
      { name: 'showTags', type: "boolean", required: false, default: 'false', description: 'Show tags for selected items' },
      { name: 'maxTags', type: "number", required: false, default: '3', description: 'Max tags before +N more' },
      { name: 'minSelections', type: "number", required: false, default: '0', description: 'Min required selections' },
      { name: 'maxSelections', type: "number", required: false, description: 'Max allowed selections' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Focused item color' },
      { name: 'selectedColor', type: "ColorValue", required: false, default: "'green'", description: 'Selected item color' },
      { name: 'onChange', type: "(values: T[]) => void", required: false, description: 'Selection change handler' },
      { name: 'onSubmit', type: "(values: T[]) => void", required: false, description: 'Submit handler (Enter)' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "MultiSelectState", required: false, description: 'External state from createMultiSelect()' },
    ],
    examples: [
      `MultiSelect({\n  items: [\n    { value: 'react', label: 'React' },\n    { value: 'vue', label: 'Vue' },\n    { value: 'angular', label: 'Angular' },\n  ],\n  showTags: true,\n  onChange: (frameworks) => setSelected(frameworks),\n})`,
    ],
    relatedComponents: ['Select', 'TagInput'],
  },
  {
    name: 'RadioGroup',
    category: 'molecules',
    description: 'Single selection radio buttons with keyboard navigation.',
    props: [
      { name: 'options', type: "RadioOption[]", required: true, description: 'Array of { value, label, description?, disabled? }' },
      { name: 'initialValue', type: "T", required: false, description: 'Initially selected value' },
      { name: 'direction', type: "'horizontal' | 'vertical'", required: false, default: "'vertical'", description: 'Layout direction' },
      { name: 'gap', type: "number", required: false, description: 'Gap between options' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Focused option color' },
      { name: 'selectedColor', type: "ColorValue", required: false, default: "'green'", description: 'Selected option color' },
      { name: 'onChange', type: "(value: T) => void", required: false, description: 'Selection change handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "RadioGroupState", required: false, description: 'External state from createRadioGroup()' },
    ],
    examples: [
      `RadioGroup({\n  options: [\n    { value: 'small', label: 'Small' },\n    { value: 'medium', label: 'Medium' },\n    { value: 'large', label: 'Large' },\n  ],\n  initialValue: 'medium',\n  onChange: (size) => console.log(size),\n})`,
    ],
    relatedComponents: ['InlineRadio', 'Select', 'ToggleGroup'],
  },
  {
    name: 'InlineRadio',
    category: 'molecules',
    description: 'Compact inline radio selector. Single row display for quick choices.',
    props: [
      { name: 'options', type: "RadioOption[]", required: true, description: 'Array of { value, label }' },
      { name: 'value', type: "T", required: false, description: 'Currently selected value' },
      { name: 'separator', type: "string", required: false, default: "' | '", description: 'Separator between options' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Selected option color' },
      { name: 'onChange', type: "(value: T) => void", required: false, description: 'Selection handler' },
    ],
    examples: [
      `InlineRadio({\n  options: [\n    { value: 'asc', label: 'A-Z' },\n    { value: 'desc', label: 'Z-A' },\n  ],\n  value: sortOrder(),\n  onChange: setSortOrder,\n})`,
    ],
    relatedComponents: ['RadioGroup'],
  },
  {
    name: 'Autocomplete',
    category: 'molecules',
    description: 'Text input with fuzzy search suggestions. Supports custom filtering and free text.',
    props: [
      { name: 'items', type: "AutocompleteItem[]", required: true, description: 'Array of { value, label, description?, disabled? }' },
      { name: 'placeholder', type: "string", required: false, description: 'Input placeholder' },
      { name: 'maxSuggestions', type: "number", required: false, default: '5', description: 'Max suggestions shown' },
      { name: 'minChars', type: "number", required: false, default: '1', description: 'Min chars to trigger suggestions' },
      { name: 'filter', type: "(query: string, item: AutocompleteItem) => boolean", required: false, description: 'Custom filter function' },
      { name: 'allowFreeText', type: "boolean", required: false, default: 'false', description: 'Allow non-matching input' },
      { name: 'width', type: "number", required: false, default: '30', description: 'Input width' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Active suggestion color' },
      { name: 'onChange', type: "(value: string) => void", required: false, description: 'Value change handler' },
      { name: 'onSelect', type: "(item: AutocompleteItem) => void", required: false, description: 'Item selection handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "AutocompleteState", required: false, description: 'External state from createAutocomplete()' },
    ],
    examples: [
      `Autocomplete({\n  items: countries,\n  placeholder: 'Search country...',\n  onSelect: (country) => setCountry(country.value),\n})`,
    ],
    relatedComponents: ['Combobox', 'TagInput', 'TextInput'],
  },
  {
    name: 'Combobox',
    category: 'molecules',
    description: 'Autocomplete with dropdown visibility control. Opens on focus, closes on select.',
    props: [
      { name: 'items', type: "AutocompleteItem[]", required: true, description: 'Array of { value, label }' },
      { name: 'placeholder', type: "string", required: false, description: 'Input placeholder' },
      { name: 'width', type: "number", required: false, default: '30', description: 'Input width' },
      { name: 'maxSuggestions', type: "number", required: false, default: '5', description: 'Max suggestions shown' },
      { name: 'allowFreeText', type: "boolean", required: false, default: 'false', description: 'Allow custom values' },
      { name: 'onChange', type: "(value: string) => void", required: false, description: 'Value change handler' },
      { name: 'onSelect', type: "(item: AutocompleteItem) => void", required: false, description: 'Selection handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
    ],
    examples: [
      `Combobox({\n  items: cities,\n  placeholder: 'Select or type city...',\n  allowFreeText: true,\n  onSelect: (city) => setCity(city.value),\n})`,
    ],
    relatedComponents: ['Autocomplete', 'Select'],
  },
  {
    name: 'TagInput',
    category: 'molecules',
    description: 'Input for adding multiple tags with autocomplete suggestions.',
    props: [
      { name: 'suggestions', type: "TagItem[]", required: false, default: '[]', description: 'Autocomplete suggestions' },
      { name: 'initialTags', type: "T[]", required: false, default: '[]', description: 'Initially added tags' },
      { name: 'placeholder', type: "string", required: false, default: "'Add tag...'", description: 'Input placeholder' },
      { name: 'width', type: "number", required: false, default: '40', description: 'Component width' },
      { name: 'maxTags', type: "number", required: false, description: 'Maximum allowed tags' },
      { name: 'allowDuplicates', type: "boolean", required: false, default: 'false', description: 'Allow duplicate tags' },
      { name: 'allowCustom', type: "boolean", required: false, default: 'true', description: 'Allow custom (non-suggestion) tags' },
      { name: 'tagColor', type: "ColorValue", required: false, default: "'primary'", description: 'Tag color' },
      { name: 'onChange', type: "(tags: T[]) => void", required: false, description: 'Tags change handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "TagInputState", required: false, description: 'External state from createTagInput()' },
    ],
    examples: [
      `TagInput({\n  suggestions: [\n    { value: 'react', label: 'React' },\n    { value: 'vue', label: 'Vue' },\n  ],\n  placeholder: 'Add framework...',\n  onChange: (tags) => setTags(tags),\n})`,
    ],
    relatedComponents: ['Autocomplete', 'Tag', 'MultiSelect'],
  },

  // =============================================================================
  // Table Components
  // =============================================================================
  {
    name: 'Table',
    category: 'molecules',
    description: 'Data table with headers, sorting, alignment, and borders.',
    props: [
      { name: 'columns', type: "TableColumn[]", required: true, description: 'Column definitions { key, header, width?, align?, format? }' },
      { name: 'data', type: "Record<string, unknown>[]", required: true, description: 'Row data array' },
      { name: 'borderStyle', type: "'single' | 'double' | 'round' | 'bold' | 'none'", required: false, default: "'single'", description: 'Table border style' },
      { name: 'headerColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Header text color' },
      { name: 'borderColor', type: "ColorValue", required: false, description: 'Border color' },
      { name: 'alternateRows', type: "boolean", required: false, default: 'false', description: 'Alternate row colors' },
      { name: 'compact', type: "boolean", required: false, default: 'false', description: 'Remove padding' },
    ],
    examples: [
      `Table({\n  columns: [\n    { key: 'name', header: 'Name', width: 20 },\n    { key: 'age', header: 'Age', width: 5, align: 'right' },\n  ],\n  data: [\n    { name: 'Alice', age: 30 },\n    { name: 'Bob', age: 25 },\n  ],\n})`,
    ],
    relatedComponents: ['SimpleTable', 'KeyValueTable', 'DataTable'],
  },
  {
    name: 'SimpleTable',
    category: 'molecules',
    description: 'Minimal table from 2D array. No configuration needed.',
    props: [
      { name: 'rows', type: "string[][]", required: true, description: '2D array of cell values' },
      { name: 'headers', type: "string[]", required: false, description: 'Optional header row' },
      { name: 'borderStyle', type: "BorderStyle", required: false, default: "'single'", description: 'Border style' },
    ],
    examples: [
      `SimpleTable({\n  headers: ['Name', 'Value'],\n  rows: [\n    ['CPU', '45%'],\n    ['Memory', '2.1 GB'],\n    ['Disk', '120 GB'],\n  ],\n})`,
    ],
    relatedComponents: ['Table', 'KeyValueTable'],
  },
  {
    name: 'KeyValueTable',
    category: 'molecules',
    description: 'Two-column key-value display. Perfect for details/properties.',
    props: [
      { name: 'data', type: "Record<string, string | number>", required: true, description: 'Key-value pairs object' },
      { name: 'keyWidth', type: "number", required: false, default: '15', description: 'Key column width' },
      { name: 'valueWidth', type: "number", required: false, description: 'Value column width' },
      { name: 'keyColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Key text color' },
      { name: 'separator', type: "string", required: false, default: "': '", description: 'Key-value separator' },
      { name: 'borderStyle', type: "BorderStyle", required: false, default: "'none'", description: 'Border style' },
    ],
    examples: [
      `KeyValueTable({\n  data: {\n    'Name': 'John Doe',\n    'Email': 'john@example.com',\n    'Role': 'Admin',\n    'Status': 'Active',\n  },\n})`,
    ],
    relatedComponents: ['Table', 'SimpleTable'],
  },

  // =============================================================================
  // Tab Components
  // =============================================================================
  {
    name: 'Tabs',
    category: 'molecules',
    description: 'Tabbed navigation with keyboard support. **API Pattern: Data-Driven** - content goes INSIDE each tab object, NOT as a children prop. Use tabs array with { key, label, content } objects.',
    props: [
      { name: 'tabs', type: "Tab[]", required: true, description: 'Array of { key, label, content, icon?, disabled? } - CONTENT GOES HERE!' },
      { name: 'activeIndex', type: "number", required: false, default: '0', description: 'Active tab index' },
      { name: 'variant', type: "'underline' | 'boxed' | 'pills'", required: false, default: "'underline'", description: 'Tab style variant' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Active tab color' },
      { name: 'gap', type: "number", required: false, default: '2', description: 'Gap between tabs' },
      { name: 'onChange', type: "(index: number) => void", required: false, description: 'Tab change handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
    ],
    examples: [
      `// ✅ CORRECT - content INSIDE each tab object\nTabs({\n  tabs: [\n    { key: 'home', label: 'Home', content: HomePanel() },\n    { key: 'settings', label: 'Settings', icon: '⚙️', content: SettingsPanel() },\n  ],\n  isActive: true,\n})`,
      `// ❌ WRONG - Tabs has NO children prop\nTabs({\n  tabs: [{ key: 'a', label: 'A' }],\n  children: ContentA()  // WRONG! content goes inside tabs array\n})`,
    ],
    relatedComponents: ['TabPanel', 'VerticalTabs', 'LazyTabs'],
  },
  {
    name: 'TabPanel',
    category: 'molecules',
    description: 'Content panel for a specific tab. Renders only when tab is active.',
    props: [
      { name: 'tabs', type: "TabsState", required: true, description: 'Tabs state from createTabs()' },
      { name: 'id', type: "T", required: true, description: 'Tab id this panel belongs to' },
      { name: 'children', type: "VNode | VNode[]", required: true, description: 'Panel content' },
    ],
    examples: [
      `TabPanel({ tabs: tabsState, id: 'home' },\n  Text({}, 'Home content')\n)`,
    ],
    relatedComponents: ['Tabs'],
  },
  {
    name: 'VerticalTabs',
    category: 'molecules',
    description: 'Vertical tab layout with tabs on the left side.',
    props: [
      { name: 'tabs', type: "Tab[]", required: true, description: 'Array of { id, label, icon? }' },
      { name: 'initialTab', type: "T", required: false, description: 'Initially active tab' },
      { name: 'tabWidth', type: "number", required: false, default: '20', description: 'Tab column width' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Active tab color' },
      { name: 'children', type: "VNode | VNode[]", required: true, description: 'Content area' },
      { name: 'onChange', type: "(id: T) => void", required: false, description: 'Tab change handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
    ],
    examples: [
      `VerticalTabs({\n  tabs: [\n    { id: 'general', label: '⚙️ General' },\n    { id: 'appearance', label: '🎨 Appearance' },\n    { id: 'advanced', label: '🔧 Advanced' },\n  ],\n  tabWidth: 18,\n  children: TabContent(),\n})`,
    ],
    relatedComponents: ['Tabs', 'LazyTabs'],
  },
  {
    name: 'LazyTabs',
    category: 'molecules',
    description: 'Tabs with lazy-loaded content. Panels only render when first activated.',
    props: [
      { name: 'tabs', type: "Tab[]", required: true, description: 'Array of { id, label, render: () => VNode }' },
      { name: 'initialTab', type: "T", required: false, description: 'Initially active tab' },
      { name: 'keepMounted', type: "boolean", required: false, default: 'true', description: 'Keep panels mounted after first render' },
      { name: 'variant', type: "'underline' | 'boxed' | 'pills'", required: false, default: "'underline'", description: 'Tab style' },
      { name: 'onChange', type: "(id: T) => void", required: false, description: 'Tab change handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
    ],
    examples: [
      `LazyTabs({\n  tabs: [\n    { id: 'logs', label: 'Logs', render: () => LogsPanel() },\n    { id: 'metrics', label: 'Metrics', render: () => MetricsPanel() },\n  ],\n  keepMounted: true,\n})`,
    ],
    relatedComponents: ['Tabs', 'VerticalTabs'],
  },

  // =============================================================================
  // Tree Components
  // =============================================================================
  {
    name: 'Tree',
    category: 'molecules',
    description: 'Hierarchical tree view with keyboard navigation, expansion, and selection.',
    props: [
      { name: 'nodes', type: "TreeNode[]", required: true, description: 'Array of { id, label, icon?, children?, data?, disabled?, color? }' },
      { name: 'initialExpanded', type: "string[]", required: false, default: '[]', description: 'Initially expanded node IDs' },
      { name: 'initialSelected', type: "string[]", required: false, default: '[]', description: 'Initially selected node IDs' },
      { name: 'selectionMode', type: "'none' | 'single' | 'multiple'", required: false, default: "'single'", description: 'Selection mode' },
      { name: 'showGuides', type: "boolean", required: false, default: 'true', description: 'Show tree lines/guides' },
      { name: 'indentSize', type: "number", required: false, default: '2', description: 'Indentation size' },
      { name: 'maxDepth', type: "number", required: false, description: 'Max visible depth' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Cursor color' },
      { name: 'selectedColor', type: "ColorValue", required: false, default: "'green'", description: 'Selected node color' },
      { name: 'guideColor', type: "ColorValue", required: false, default: "'gray'", description: 'Guide lines color' },
      { name: 'label', type: "string", required: false, description: 'Tree title' },
      { name: 'onSelect', type: "(node: TreeNode) => void", required: false, description: 'Selection callback' },
      { name: 'onExpand', type: "(node: TreeNode) => void", required: false, description: 'Expand callback' },
      { name: 'onCollapse', type: "(node: TreeNode) => void", required: false, description: 'Collapse callback' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "TreeState", required: false, description: 'External state from createTree()' },
    ],
    examples: [
      `Tree({\n  nodes: [\n    {\n      id: 'src',\n      label: 'src',\n      icon: '📁',\n      children: [\n        { id: 'index.ts', label: 'index.ts', icon: '📄' },\n      ],\n    },\n  ],\n  onSelect: (node) => openFile(node.id),\n})`,
    ],
    relatedComponents: ['DirectoryTree', 'Accordion'],
  },
  {
    name: 'DirectoryTree',
    category: 'molecules',
    description: 'File system directory tree with folder/file icons.',
    props: [
      { name: 'root', type: "DirectoryNode", required: true, description: 'Root directory { name, type: "directory", children: [...] }' },
      { name: 'showHidden', type: "boolean", required: false, default: 'false', description: 'Show hidden files (.)' },
      { name: 'showIcons', type: "boolean", required: false, default: 'true', description: 'Show file type icons' },
      { name: 'activeColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Active item color' },
      { name: 'onSelect', type: "(node: DirectoryNode) => void", required: false, description: 'Selection handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
    ],
    examples: [
      `DirectoryTree({\n  root: {\n    name: 'project',\n    type: 'directory',\n    children: [\n      { name: 'src', type: 'directory', children: [...] },\n      { name: 'package.json', type: 'file' },\n    ],\n  },\n  onSelect: (node) => openFile(node.name),\n})`,
    ],
    relatedComponents: ['Tree', 'FileManager'],
  },

  // =============================================================================
  // Calendar Components
  // =============================================================================
  {
    name: 'Calendar',
    category: 'molecules',
    description: 'Interactive month calendar with date selection, events, and keyboard navigation.',
    props: [
      { name: 'initialDate', type: "Date", required: false, description: 'Initial date (defaults to today)' },
      { name: 'selectedDates', type: "Date[]", required: false, default: '[]', description: 'Initially selected dates' },
      { name: 'events', type: "CalendarEvent[]", required: false, description: 'Events to mark { date: "YYYY-MM-DD", label?, color? }' },
      { name: 'selectionMode', type: "'none' | 'single' | 'range' | 'multiple'", required: false, default: "'single'", description: 'Selection mode' },
      { name: 'firstDayOfWeek', type: "0 | 1", required: false, default: '0', description: '0=Sunday, 1=Monday' },
      { name: 'minDate', type: "Date", required: false, description: 'Minimum selectable date' },
      { name: 'maxDate', type: "Date", required: false, description: 'Maximum selectable date' },
      { name: 'disabledDates', type: "Date[]", required: false, description: 'Disabled dates' },
      { name: 'showWeekNumbers', type: "boolean", required: false, default: 'false', description: 'Show week numbers' },
      { name: 'todayColor', type: "ColorValue", required: false, default: "'green'", description: 'Today highlight color' },
      { name: 'selectedColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Selected date color' },
      { name: 'cellWidth', type: "number", required: false, default: '4', description: 'Day cell width' },
      { name: 'onDateSelect', type: "(date: Date) => void", required: false, description: 'Selection callback' },
      { name: 'onMonthChange', type: "(year: number, month: number) => void", required: false, description: 'Month change callback' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "CalendarState", required: false, description: 'External state from createCalendar()' },
    ],
    examples: [
      `Calendar({\n  onDateSelect: (date) => console.log(date),\n})`,
      `// With events\nCalendar({\n  events: [\n    { date: '2024-03-15', label: 'Meeting', color: 'blue' },\n  ],\n  selectionMode: 'range',\n})`,
    ],
    relatedComponents: ['MiniCalendar', 'DatePicker'],
  },
  {
    name: 'MiniCalendar',
    category: 'molecules',
    description: 'Compact calendar for space-constrained layouts.',
    props: [
      { name: 'date', type: "Date", required: false, description: 'Displayed month/year' },
      { name: 'selectedDate', type: "Date", required: false, description: 'Selected date' },
      { name: 'cellWidth', type: "number", required: false, default: '2', description: 'Day cell width' },
      { name: 'onDateSelect', type: "(date: Date) => void", required: false, description: 'Selection handler' },
    ],
    examples: [
      `MiniCalendar({\n  selectedDate: today,\n  onDateSelect: setDate,\n})`,
    ],
    relatedComponents: ['Calendar', 'DatePicker'],
  },
  {
    name: 'DatePicker',
    category: 'molecules',
    description: 'Calendar dropdown with input field for date selection.',
    props: [
      { name: 'placeholder', type: "string", required: false, default: "'Select date...'", description: 'Input placeholder' },
      { name: 'inputWidth', type: "number", required: false, default: '20', description: 'Input field width' },
      { name: 'format', type: "string", required: false, default: "'YYYY-MM-DD'", description: 'Date display format' },
      { name: 'selectionMode', type: "'single' | 'range'", required: false, default: "'single'", description: 'Selection mode' },
      { name: 'minDate', type: "Date", required: false, description: 'Minimum date' },
      { name: 'maxDate', type: "Date", required: false, description: 'Maximum date' },
      { name: 'onDateSelect', type: "(date: Date) => void", required: false, description: 'Selection handler' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: "DatePickerState", required: false, description: 'External state from createDatePicker()' },
    ],
    examples: [
      `DatePicker({\n  placeholder: 'Pick a date',\n  onDateSelect: (date) => setSelectedDate(date),\n})`,
    ],
    relatedComponents: ['Calendar', 'MiniCalendar'],
  },

  // =============================================================================
  // Code & Text Components
  // =============================================================================
  {
    name: 'CodeBlock',
    category: 'molecules',
    description: 'Syntax-highlighted code block with line numbers and theme support.',
    props: [
      { name: 'code', type: "string", required: true, description: 'Code content' },
      { name: 'language', type: "Language", required: false, default: "'plaintext'", description: 'Programming language (typescript, javascript, python, rust, go, etc.)' },
      { name: 'theme', type: "CodeTheme", required: false, description: 'Syntax highlighting theme' },
      { name: 'showLineNumbers', type: "boolean", required: false, default: 'true', description: 'Show line numbers' },
      { name: 'startLine', type: "number", required: false, default: '1', description: 'Starting line number' },
      { name: 'highlightLines', type: "number[]", required: false, description: 'Lines to highlight' },
      { name: 'maxWidth', type: "number", required: false, description: 'Max width (wrap long lines)' },
      { name: 'wrap', type: "boolean", required: false, default: 'false', description: 'Wrap long lines' },
      { name: 'borderStyle', type: "BorderStyle", required: false, default: "'round'", description: 'Border style' },
      { name: 'borderColor', type: "ColorValue", required: false, description: 'Border color' },
      { name: 'title', type: "string", required: false, description: 'Code block title/filename' },
    ],
    examples: [
      `CodeBlock({\n  code: 'const x = 1;\\nconst y = 2;',\n  language: 'typescript',\n  showLineNumbers: true,\n})`,
      `// With highlighted lines\nCodeBlock({\n  code: codeString,\n  language: 'python',\n  highlightLines: [3, 4, 5],\n  title: 'example.py',\n})`,
    ],
    relatedComponents: ['InlineCode', 'Markdown'],
  },
  {
    name: 'InlineCode',
    category: 'molecules',
    description: 'Inline code snippet with syntax highlighting. For code within text.',
    props: [
      { name: 'code', type: "string", required: true, description: 'Code content' },
      { name: 'language', type: "Language", required: false, description: 'Programming language' },
      { name: 'color', type: "ColorValue", required: false, default: "'cyan'", description: 'Code color' },
    ],
    examples: [
      `Box({ flexDirection: 'row' },\n  Text({}, 'Use '),\n  InlineCode({ code: 'useState()' }),\n  Text({}, ' for state'),\n)`,
    ],
    relatedComponents: ['CodeBlock', 'Markdown'],
  },
  {
    name: 'Markdown',
    category: 'molecules',
    description: 'Markdown renderer with support for headings, lists, code, and formatting.',
    props: [
      { name: 'content', type: "string", required: true, description: 'Markdown content' },
      { name: 'width', type: "number", required: false, description: 'Max width for wrapping' },
      { name: 'codeTheme', type: "CodeTheme", required: false, description: 'Code block theme' },
      { name: 'headingColors', type: "ColorValue[]", required: false, description: 'Colors for h1-h6' },
      { name: 'linkColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Link color' },
      { name: 'codeColor', type: "ColorValue", required: false, default: "'yellow'", description: 'Inline code color' },
    ],
    examples: [
      `Markdown({ content: '# Hello\\n\\nThis is **bold** and _italic_.' })`,
      `// From file\nMarkdown({ content: readmeContent, width: 80 })`,
    ],
    relatedComponents: ['CodeBlock', 'InlineCode'],
  },

  // =============================================================================
  // Layout Components
  // Note: SplitPanel moved to organisms (src/organisms/split-panel.ts)
  // =============================================================================
  {
    name: 'Grid',
    category: 'molecules',
    description: 'CSS Grid-like layout for terminal with columns and rows.',
    props: [
      { name: 'columns', type: "number | string", required: true, description: 'Number of columns or template string' },
      { name: 'rows', type: "number | string", required: false, description: 'Number of rows or template string' },
      { name: 'gap', type: "number", required: false, default: '0', description: 'Gap between cells' },
      { name: 'rowGap', type: "number", required: false, description: 'Vertical gap between rows' },
      { name: 'columnGap', type: "number", required: false, description: 'Horizontal gap between columns' },
    ],
    examples: [
      `Grid({ columns: 3, gap: 1 },\n  ...cards.map(card => Card(card))\n)`,
      `// With template\nGrid({ columns: '1fr 2fr 1fr', gap: 2 },\n  Left(),\n  Center(),\n  Right(),\n)`,
    ],
    relatedComponents: ['SplitPanel'],
  },

  // =============================================================================
  // Form Components (DevX)
  // =============================================================================
  {
    name: 'FormField',
    category: 'molecules',
    description: 'Wraps any input with label and error display. Supports vertical and horizontal layouts.',
    props: [
      { name: 'label', type: 'string', required: true, description: 'Field label text' },
      { name: 'required', type: 'boolean', required: false, default: 'false', description: 'Show required asterisk' },
      { name: 'error', type: 'string', required: false, description: 'Error message to display' },
      { name: 'helperText', type: 'string', required: false, description: 'Helper text (shown when no error)' },
      { name: 'labelColor', type: 'string', required: false, description: 'Label color' },
      { name: 'errorColor', type: 'string', required: false, description: 'Error color' },
      { name: 'children', type: 'VNode | VNode[]', required: true, description: 'Input component(s)' },
      { name: 'gap', type: 'number', required: false, default: '0', description: 'Gap between elements' },
      { name: 'fullWidth', type: 'boolean', required: false, default: 'false', description: 'Full width' },
      { name: 'direction', type: "'vertical' | 'horizontal'", required: false, default: "'vertical'", description: 'Layout direction' },
      { name: 'labelWidth', type: 'number', required: false, description: 'Label width (horizontal layout)' },
    ],
    examples: [
      `FormField({\n  label: 'Email',\n  required: true,\n  error: emailError(),\n  children: TextInput({ state: emailInput }),\n})`,
      `// Horizontal layout\nFormField({\n  label: 'Name',\n  direction: 'horizontal',\n  labelWidth: 15,\n  children: TextInput({ state: nameInput }),\n})`,
    ],
    relatedComponents: ['FormGroup', 'TextInput'],
  },
  {
    name: 'FormGroup',
    category: 'molecules',
    description: 'Groups multiple form fields together with optional title and description.',
    props: [
      { name: 'title', type: 'string', required: false, description: 'Group title' },
      { name: 'description', type: 'string', required: false, description: 'Group description' },
      { name: 'children', type: 'VNode | VNode[]', required: true, description: 'Form fields' },
      { name: 'gap', type: 'number', required: false, default: '1', description: 'Gap between fields' },
      { name: 'borderStyle', type: "'none' | 'single' | 'round' | 'double'", required: false, default: "'none'", description: 'Border style' },
      { name: 'padding', type: 'number', required: false, default: '0', description: 'Padding' },
    ],
    examples: [
      `FormGroup({\n  title: 'Account Settings',\n  description: 'Update your account information',\n  gap: 1,\n  children: [\n    FormField({ label: 'Name', children: TextInput({ ... }) }),\n    FormField({ label: 'Email', children: TextInput({ ... }) }),\n  ],\n})`,
    ],
    relatedComponents: ['FormField'],
  },
];
