/**
 * Tuiuiu Documentation Data
 *
 * Structured documentation for all components, hooks, and utilities.
 * This data is served via MCP to AI assistants.
 */

import type { ComponentDoc, HookDoc, ThemeDoc } from './types.js';

// =============================================================================
// Primitives
// =============================================================================

export const primitives: ComponentDoc[] = [
  {
    name: 'Box',
    category: 'primitives',
    description: 'Flexbox container for layout. The fundamental building block for all layouts.',
    props: [
      { name: 'flexDirection', type: "'row' | 'column'", required: false, default: "'row'", description: 'Main axis direction' },
      { name: 'justifyContent', type: "'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around'", required: false, default: "'flex-start'", description: 'Alignment along main axis' },
      { name: 'alignItems', type: "'flex-start' | 'center' | 'flex-end' | 'stretch'", required: false, default: "'stretch'", description: 'Alignment along cross axis' },
      { name: 'width', type: "number | string", required: false, description: 'Width in columns or percentage' },
      { name: 'height', type: "number | string", required: false, description: 'Height in rows or percentage' },
      { name: 'padding', type: "number", required: false, default: '0', description: 'Padding on all sides' },
      { name: 'paddingX', type: "number", required: false, description: 'Horizontal padding' },
      { name: 'paddingY', type: "number", required: false, description: 'Vertical padding' },
      { name: 'margin', type: "number", required: false, default: '0', description: 'Margin on all sides' },
      { name: 'gap', type: "number", required: false, description: 'Gap between children' },
      { name: 'flexGrow', type: "number", required: false, description: 'Flex grow factor' },
      { name: 'flexShrink', type: "number", required: false, description: 'Flex shrink factor' },
      { name: 'borderStyle', type: "'single' | 'double' | 'round' | 'bold' | 'none'", required: false, description: 'Border style' },
      { name: 'borderColor', type: "ColorValue", required: false, description: 'Border color' },
      { name: 'backgroundColor', type: "ColorValue", required: false, description: 'Background color' },
    ],
    examples: [
      `Box({ flexDirection: 'column', padding: 1 },\n  Text({}, 'Hello'),\n  Text({}, 'World')\n)`,
      `Box({ borderStyle: 'round', borderColor: 'cyan', padding: 2 },\n  Text({ bold: true }, 'Bordered Box')\n)`,
    ],
  },
  {
    name: 'Text',
    category: 'primitives',
    description: 'Text element with styling support. Renders styled text content.',
    props: [
      { name: 'color', type: "ColorValue", required: false, description: 'Text color (named, hex, or rgb)' },
      { name: 'backgroundColor', type: "ColorValue", required: false, description: 'Background color' },
      { name: 'bold', type: "boolean", required: false, default: 'false', description: 'Bold text' },
      { name: 'italic', type: "boolean", required: false, default: 'false', description: 'Italic text' },
      { name: 'underline', type: "boolean", required: false, default: 'false', description: 'Underlined text' },
      { name: 'strikethrough', type: "boolean", required: false, default: 'false', description: 'Strikethrough text' },
      { name: 'dim', type: "boolean", required: false, default: 'false', description: 'Dimmed text' },
      { name: 'inverse', type: "boolean", required: false, default: 'false', description: 'Inverted colors' },
    ],
    examples: [
      `Text({ color: 'cyan', bold: true }, 'Hello World')`,
      `Text({ color: '#ff6b6b', backgroundColor: 'black' }, 'Custom colors')`,
    ],
  },
  {
    name: 'Spacer',
    category: 'primitives',
    description: 'Flexible spacer that expands to fill available space.',
    props: [
      { name: 'x', type: "number", required: false, description: 'Fixed horizontal size' },
      { name: 'y', type: "number", required: false, description: 'Fixed vertical size' },
    ],
    examples: [
      `Box({ flexDirection: 'row' },\n  Text({}, 'Left'),\n  Spacer(),\n  Text({}, 'Right')\n)`,
    ],
  },
  {
    name: 'Divider',
    category: 'primitives',
    description: 'Horizontal or vertical divider line.',
    props: [
      { name: 'direction', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Divider direction' },
      { name: 'char', type: "string", required: false, default: "'─'", description: 'Character to use for the line' },
      { name: 'color', type: "ColorValue", required: false, description: 'Line color' },
    ],
    examples: [
      `Divider({ color: 'gray' })`,
      `Divider({ direction: 'vertical', char: '│' })`,
    ],
  },
];

// =============================================================================
// Atoms
// =============================================================================

export const atoms: ComponentDoc[] = [
  {
    name: 'Button',
    category: 'atoms',
    description: 'Interactive button with multiple variants and states.',
    props: [
      { name: 'label', type: "string", required: true, description: 'Button label text' },
      { name: 'variant', type: "'primary' | 'secondary' | 'danger' | 'ghost'", required: false, default: "'primary'", description: 'Visual variant' },
      { name: 'disabled', type: "boolean", required: false, default: 'false', description: 'Disable interaction' },
      { name: 'focused', type: "boolean", required: false, default: 'false', description: 'Focus state' },
      { name: 'onPress', type: "() => void", required: false, description: 'Press handler' },
      { name: 'width', type: "number", required: false, description: 'Fixed width' },
    ],
    examples: [
      `Button({ label: 'Submit', variant: 'primary', onPress: () => console.log('clicked') })`,
      `Button({ label: 'Cancel', variant: 'ghost' })`,
    ],
  },
  {
    name: 'TextInput',
    category: 'atoms',
    description: 'Single-line text input field with cursor support.',
    props: [
      { name: 'value', type: "string", required: true, description: 'Current value' },
      { name: 'onChange', type: "(value: string) => void", required: true, description: 'Change handler' },
      { name: 'placeholder', type: "string", required: false, description: 'Placeholder text' },
      { name: 'focused', type: "boolean", required: false, default: 'false', description: 'Focus state' },
      { name: 'password', type: "boolean", required: false, default: 'false', description: 'Hide input as password' },
      { name: 'width', type: "number", required: false, default: '20', description: 'Input width' },
    ],
    examples: [
      `TextInput({ value: name(), onChange: setName, placeholder: 'Enter name' })`,
    ],
  },
  {
    name: 'Checkbox',
    category: 'atoms',
    description: 'Checkbox with label.',
    props: [
      { name: 'checked', type: "boolean", required: true, description: 'Checked state' },
      { name: 'onChange', type: "(checked: boolean) => void", required: false, description: 'Change handler' },
      { name: 'label', type: "string", required: false, description: 'Label text' },
      { name: 'disabled', type: "boolean", required: false, default: 'false', description: 'Disable interaction' },
    ],
    examples: [
      `Checkbox({ checked: agreed(), onChange: setAgreed, label: 'I agree to terms' })`,
    ],
  },
  {
    name: 'ProgressBar',
    category: 'atoms',
    description: 'Progress indicator with multiple styles.',
    props: [
      { name: 'value', type: "number", required: true, description: 'Progress value (0-100)' },
      { name: 'width', type: "number", required: false, default: '20', description: 'Bar width' },
      { name: 'showPercentage', type: "boolean", required: false, default: 'false', description: 'Show percentage text' },
      { name: 'color', type: "ColorValue", required: false, default: "'cyan'", description: 'Fill color' },
      { name: 'style', type: "'block' | 'ascii' | 'gradient'", required: false, default: "'block'", description: 'Visual style' },
    ],
    examples: [
      `ProgressBar({ value: 75, width: 30, showPercentage: true })`,
    ],
  },
  {
    name: 'Spinner',
    category: 'atoms',
    description: 'Animated loading spinner.',
    props: [
      { name: 'style', type: "'dots' | 'line' | 'circle' | 'bounce' | 'pong'", required: false, default: "'dots'", description: 'Animation style' },
      { name: 'color', type: "ColorValue", required: false, default: "'cyan'", description: 'Spinner color' },
      { name: 'label', type: "string", required: false, description: 'Loading label' },
    ],
    examples: [
      `Spinner({ style: 'dots', label: 'Loading...' })`,
    ],
  },
  {
    name: 'Badge',
    category: 'atoms',
    description: 'Status badge or label.',
    props: [
      { name: 'text', type: "string", required: true, description: 'Badge text' },
      { name: 'variant', type: "'default' | 'success' | 'warning' | 'error' | 'info'", required: false, default: "'default'", description: 'Color variant' },
    ],
    examples: [
      `Badge({ text: 'NEW', variant: 'success' })`,
    ],
  },
];

// =============================================================================
// Molecules
// =============================================================================

export const molecules: ComponentDoc[] = [
  {
    name: 'Select',
    category: 'molecules',
    description: 'Dropdown selection with keyboard navigation.',
    props: [
      { name: 'options', type: "SelectOption[]", required: true, description: 'Array of { value, label } options' },
      { name: 'value', type: "string", required: true, description: 'Selected value' },
      { name: 'onChange', type: "(value: string) => void", required: true, description: 'Change handler' },
      { name: 'placeholder', type: "string", required: false, description: 'Placeholder text' },
      { name: 'focused', type: "boolean", required: false, default: 'false', description: 'Focus state' },
    ],
    examples: [
      `Select({\n  options: [{ value: 'a', label: 'Option A' }, { value: 'b', label: 'Option B' }],\n  value: selected(),\n  onChange: setSelected\n})`,
    ],
  },
  {
    name: 'Table',
    category: 'molecules',
    description: 'Data table with headers and rows.',
    props: [
      { name: 'columns', type: "TableColumn[]", required: true, description: 'Column definitions { key, header, width }' },
      { name: 'data', type: "Record<string, unknown>[]", required: true, description: 'Row data' },
      { name: 'borderStyle', type: "BorderStyle", required: false, default: "'single'", description: 'Table border style' },
    ],
    examples: [
      `Table({\n  columns: [\n    { key: 'name', header: 'Name', width: 20 },\n    { key: 'age', header: 'Age', width: 5 }\n  ],\n  data: [{ name: 'Alice', age: 30 }]\n})`,
    ],
  },
  {
    name: 'Tabs',
    category: 'molecules',
    description: 'Tabbed navigation container.',
    props: [
      { name: 'tabs', type: "Tab[]", required: true, description: 'Array of { id, label, content } tabs' },
      { name: 'activeTab', type: "string", required: true, description: 'Active tab id' },
      { name: 'onChange', type: "(id: string) => void", required: true, description: 'Tab change handler' },
    ],
    examples: [
      `Tabs({\n  tabs: [\n    { id: 'home', label: 'Home', content: HomePanel },\n    { id: 'settings', label: 'Settings', content: SettingsPanel }\n  ],\n  activeTab: tab(),\n  onChange: setTab\n})`,
    ],
  },
  {
    name: 'Modal',
    category: 'molecules',
    description: 'Modal dialog overlay.',
    props: [
      { name: 'title', type: "string", required: false, description: 'Modal title' },
      { name: 'visible', type: "boolean", required: true, description: 'Visibility state' },
      { name: 'onClose', type: "() => void", required: false, description: 'Close handler' },
      { name: 'width', type: "number", required: false, default: '50', description: 'Modal width' },
      { name: 'children', type: "VNode", required: true, description: 'Modal content' },
    ],
    examples: [
      `Modal({\n  title: 'Confirm',\n  visible: showModal(),\n  onClose: () => setShowModal(false)\n}, Text({}, 'Are you sure?'))`,
    ],
  },
];

// =============================================================================
// Data Visualization
// =============================================================================

export const dataViz: ComponentDoc[] = [
  {
    name: 'Sparkline',
    category: 'molecules',
    description: 'Inline mini chart for data trends.',
    props: [
      { name: 'data', type: "number[]", required: true, description: 'Data points' },
      { name: 'width', type: "number", required: false, description: 'Chart width' },
      { name: 'height', type: "number", required: false, default: '1', description: 'Chart height in rows' },
      { name: 'color', type: "ColorValue", required: false, description: 'Line color' },
    ],
    examples: [
      `Sparkline({ data: [1, 5, 3, 9, 2, 7], width: 20 })`,
    ],
  },
  {
    name: 'BarChart',
    category: 'molecules',
    description: 'Horizontal or vertical bar chart.',
    props: [
      { name: 'data', type: "BarData[]", required: true, description: 'Array of { label, value, color? }' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Bar orientation' },
      { name: 'width', type: "number", required: false, description: 'Chart width' },
      { name: 'showValues', type: "boolean", required: false, default: 'true', description: 'Show value labels' },
    ],
    examples: [
      `BarChart({\n  data: [\n    { label: 'A', value: 30 },\n    { label: 'B', value: 50 },\n    { label: 'C', value: 20 }\n  ]\n})`,
    ],
  },
  {
    name: 'Gauge',
    category: 'molecules',
    description: 'Gauge/meter display for single values.',
    props: [
      { name: 'value', type: "number", required: true, description: 'Current value' },
      { name: 'max', type: "number", required: false, default: '100', description: 'Maximum value' },
      { name: 'width', type: "number", required: false, description: 'Gauge width' },
      { name: 'showValue', type: "boolean", required: false, default: 'true', description: 'Show numeric value' },
      { name: 'zones', type: "GaugeZone[]", required: false, description: 'Color zones { min, max, color }' },
    ],
    examples: [
      `Gauge({ value: 75, max: 100, width: 30 })`,
    ],
  },
  {
    name: 'Heatmap',
    category: 'molecules',
    description: 'Grid-based heatmap visualization.',
    props: [
      { name: 'data', type: "HeatmapCell[][]", required: true, description: '2D array of { value, label? }' },
      { name: 'colorScale', type: "ColorScale", required: false, default: "'blues'", description: 'Color scale name' },
      { name: 'showValues', type: "boolean", required: false, default: 'false', description: 'Show cell values' },
    ],
    examples: [
      `Heatmap({\n  data: [[{ value: 1 }, { value: 5 }], [{ value: 3 }, { value: 8 }]],\n  colorScale: 'greens'\n})`,
    ],
  },
];

// =============================================================================
// Organisms
// =============================================================================

export const organisms: ComponentDoc[] = [
  {
    name: 'CommandPalette',
    category: 'organisms',
    description: 'Command palette with fuzzy search (like VS Code Ctrl+Shift+P).',
    props: [
      { name: 'commands', type: "Command[]", required: true, description: 'Available commands { id, label, shortcut?, action }' },
      { name: 'visible', type: "boolean", required: true, description: 'Visibility state' },
      { name: 'onClose', type: "() => void", required: true, description: 'Close handler' },
      { name: 'onSelect', type: "(command: Command) => void", required: true, description: 'Command selection handler' },
    ],
    examples: [
      `CommandPalette({\n  commands: [\n    { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', action: save },\n    { id: 'quit', label: 'Quit', shortcut: 'Ctrl+Q', action: quit }\n  ],\n  visible: paletteOpen(),\n  onClose: () => setPaletteOpen(false),\n  onSelect: (cmd) => cmd.action()\n})`,
    ],
  },
  {
    name: 'FileManager',
    category: 'organisms',
    description: 'File browser with tree navigation.',
    props: [
      { name: 'root', type: "string", required: true, description: 'Root directory path' },
      { name: 'onSelect', type: "(path: string) => void", required: false, description: 'File selection handler' },
      { name: 'showHidden', type: "boolean", required: false, default: 'false', description: 'Show hidden files' },
    ],
    examples: [
      `FileManager({ root: '/home/user', onSelect: (path) => openFile(path) })`,
    ],
  },
  {
    name: 'DataTable',
    category: 'organisms',
    description: 'Advanced data table with sorting, filtering, and pagination.',
    props: [
      { name: 'columns', type: "DataTableColumn[]", required: true, description: 'Column definitions with sorting/filtering options' },
      { name: 'data', type: "Record<string, unknown>[]", required: true, description: 'Row data' },
      { name: 'pageSize', type: "number", required: false, default: '10', description: 'Rows per page' },
      { name: 'sortable', type: "boolean", required: false, default: 'true', description: 'Enable column sorting' },
      { name: 'filterable', type: "boolean", required: false, default: 'false', description: 'Enable column filtering' },
    ],
    examples: [
      `DataTable({\n  columns: [\n    { key: 'name', header: 'Name', sortable: true },\n    { key: 'email', header: 'Email', width: 30 }\n  ],\n  data: users,\n  pageSize: 20\n})`,
    ],
  },
];

// =============================================================================
// Layout Components
// =============================================================================

export const layouts: ComponentDoc[] = [
  {
    name: 'VStack',
    category: 'primitives',
    description: 'Vertical stack layout (shorthand for Box with column direction).',
    props: [
      { name: 'gap', type: "number", required: false, default: '0', description: 'Gap between children' },
      { name: 'align', type: "'start' | 'center' | 'end' | 'stretch'", required: false, default: "'stretch'", description: 'Cross-axis alignment' },
    ],
    examples: [
      `VStack({ gap: 1 },\n  Text({}, 'Line 1'),\n  Text({}, 'Line 2'),\n  Text({}, 'Line 3')\n)`,
    ],
  },
  {
    name: 'HStack',
    category: 'primitives',
    description: 'Horizontal stack layout (shorthand for Box with row direction).',
    props: [
      { name: 'gap', type: "number", required: false, default: '0', description: 'Gap between children' },
      { name: 'align', type: "'start' | 'center' | 'end' | 'stretch'", required: false, default: "'center'", description: 'Cross-axis alignment' },
    ],
    examples: [
      `HStack({ gap: 2 },\n  Button({ label: 'OK' }),\n  Button({ label: 'Cancel' })\n)`,
    ],
  },
  {
    name: 'Center',
    category: 'primitives',
    description: 'Centers content both horizontally and vertically.',
    props: [],
    examples: [
      `Center({},\n  Text({ bold: true }, 'Centered Content')\n)`,
    ],
  },
  {
    name: 'SplitPanel',
    category: 'molecules',
    description: 'Resizable split panel layout.',
    props: [
      { name: 'direction', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Split direction' },
      { name: 'initialSize', type: "number", required: false, default: '50', description: 'Initial size percentage' },
      { name: 'minSize', type: "number", required: false, default: '10', description: 'Minimum size percentage' },
      { name: 'left', type: "VNode", required: true, description: 'Left/top panel content' },
      { name: 'right', type: "VNode", required: true, description: 'Right/bottom panel content' },
    ],
    examples: [
      `SplitPanel({\n  direction: 'horizontal',\n  initialSize: 30,\n  left: Sidebar(),\n  right: MainContent()\n})`,
    ],
  },
  {
    name: 'Scroll',
    category: 'primitives',
    description: 'Universal scroll wrapper for any content. Wraps any VNode content and adds scrolling when it exceeds the specified height.',
    props: [
      { name: 'height', type: "number", required: true, description: 'Visible height in lines' },
      { name: 'width', type: "number", required: false, default: '80', description: 'Width for content layout' },
      { name: 'showScrollbar', type: "boolean", required: false, default: 'true', description: 'Show/hide scrollbar' },
      { name: 'keysEnabled', type: "boolean", required: false, default: 'true', description: 'Enable keyboard navigation' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Is component focused' },
      { name: 'scrollbarColor', type: "ColorValue", required: false, default: "'cyan'", description: 'Scrollbar thumb color' },
      { name: 'trackColor', type: "ColorValue", required: false, default: "'gray'", description: 'Scrollbar track color' },
      { name: 'scrollStep', type: "number", required: false, default: '1', description: 'Lines per scroll step' },
      { name: 'state', type: "ScrollState", required: false, description: 'External state for control via useScroll()' },
    ],
    examples: [
      `// Simple content scroll\nScroll({ height: 10 },\n  Text({}, longText),\n)`,
      `// Complex layouts\nScroll({ height: 20, width: 60 },\n  Box({ flexDirection: 'column' },\n    Header(),\n    Content(),\n    Footer(),\n  ),\n)`,
      `// With control hook\nconst scroll = useScroll();\nscroll.scrollToBottom();\n\nScroll({ ...scroll.bind, height: 20 },\n  ...content\n)`,
    ],
  },
  {
    name: 'ScrollList',
    category: 'organisms',
    description: 'Scroll list for rendering arrays of items with automatic height estimation and caching.',
    props: [
      { name: 'items', type: "T[] | (() => T[])", required: true, description: 'Items to display (array or accessor)' },
      { name: 'children', type: "(item: T, index: number) => VNode", required: true, description: 'Render function for each item' },
      { name: 'height', type: "number", required: true, description: 'Visible height in lines' },
      { name: 'width', type: "number", required: false, default: '80', description: 'Width for layout' },
      { name: 'itemHeight', type: "number | ((item: T) => number)", required: false, description: 'Item height (auto-estimated if omitted)' },
      { name: 'inverted', type: "boolean", required: false, default: 'false', description: 'Inverted mode (newest at bottom)' },
      { name: 'showScrollbar', type: "boolean", required: false, default: 'true', description: 'Show/hide scrollbar' },
      { name: 'keysEnabled', type: "boolean", required: false, default: 'true', description: 'Enable keyboard navigation' },
      { name: 'isActive', type: "boolean", required: false, default: 'true', description: 'Is component focused' },
      { name: 'state', type: "ScrollListState", required: false, description: 'External state for control via useScrollList()' },
    ],
    examples: [
      `// Simple list with auto-height\nScrollList({\n  items: files(),\n  children: (file) => FileRow({ file }),\n  height: 20,\n})`,
      `// With fixed item height (more performant)\nScrollList({\n  items: logs(),\n  children: (log) => Text({}, log),\n  height: 20,\n  itemHeight: 1,\n})`,
      `// With control hook\nconst list = useScrollList({ inverted: true });\nlist.scrollToBottom();\n\nScrollList({\n  ...list.bind,\n  items: messages(),\n  children: (msg) => Message({ msg }),\n  height: 20,\n})`,
    ],
  },
  {
    name: 'ChatList',
    category: 'organisms',
    description: 'Pre-configured ScrollList for chat/messaging UIs with inverted scroll (newest at bottom).',
    props: [
      { name: 'items', type: "T[] | (() => T[])", required: true, description: 'Chat messages to display' },
      { name: 'children', type: "(item: T, index: number) => VNode", required: true, description: 'Render function for each message' },
      { name: 'height', type: "number", required: true, description: 'Visible height in lines' },
      { name: 'width', type: "number", required: false, default: '80', description: 'Width for layout' },
      { name: 'itemHeight', type: "number | ((item: T) => number)", required: false, description: 'Item height (auto-estimated if omitted)' },
      { name: 'showScrollbar', type: "boolean", required: false, default: 'true', description: 'Show/hide scrollbar' },
      { name: 'state', type: "ScrollListState", required: false, description: 'External state for control' },
    ],
    examples: [
      `// Simple chat UI\nChatList({\n  items: messages(),\n  children: (msg) => ChatBubble({ message: msg }),\n  height: 20,\n})`,
      `// With control for auto-scroll\nconst chatList = useScrollList({ inverted: true });\n\n// Scroll to bottom when sending\nconst sendMessage = (text) => {\n  addMessage(text);\n  chatList.scrollToBottom();\n};\n\nChatList({\n  ...chatList.bind,\n  items: messages(),\n  children: (msg) => ChatBubble({ message: msg }),\n  height: 20,\n})`,
    ],
  },
  {
    name: 'Grid',
    category: 'molecules',
    description: 'CSS Grid-like layout for terminal.',
    props: [
      { name: 'columns', type: "number | string", required: true, description: 'Number of columns or template' },
      { name: 'rows', type: "number | string", required: false, description: 'Number of rows or template' },
      { name: 'gap', type: "number", required: false, default: '0', description: 'Gap between cells' },
    ],
    examples: [
      `Grid({ columns: 3, gap: 1 },\n  ...cards.map(card => Card(card))\n)`,
    ],
  },
];

// =============================================================================
// Hooks
// =============================================================================

export const hooks: HookDoc[] = [
  {
    name: 'useState',
    description: 'Create reactive state that triggers re-renders when updated.',
    signature: 'useState<T>(initialValue: T): [Accessor<T>, Setter<T>]',
    params: [
      { name: 'initialValue', type: 'T', required: true, description: 'Initial state value' },
    ],
    returns: 'Tuple of [getter function, setter function]',
    examples: [
      `const [count, setCount] = useState(0);\n// Read: count()\n// Write: setCount(5) or setCount(c => c + 1)`,
    ],
  },
  {
    name: 'useEffect',
    description: 'Run side effects when dependencies change.',
    signature: 'useEffect(fn: () => void | (() => void)): void',
    params: [
      { name: 'fn', type: '() => void | (() => void)', required: true, description: 'Effect function, optionally returning cleanup' },
    ],
    returns: 'void',
    examples: [
      `useEffect(() => {\n  console.log('Count changed:', count());\n  return () => console.log('Cleanup');\n});`,
    ],
  },
  {
    name: 'useInput',
    description: 'Handle keyboard input events.',
    signature: 'useInput(handler: InputHandler): void',
    params: [
      { name: 'handler', type: '(input: string, key: Key) => void', required: true, description: 'Input event handler' },
    ],
    returns: 'void',
    examples: [
      `useInput((input, key) => {\n  if (key.upArrow) setIndex(i => i - 1);\n  if (key.downArrow) setIndex(i => i + 1);\n  if (key.return) select();\n  if (key.escape) cancel();\n});`,
    ],
  },
  {
    name: 'useApp',
    description: 'Access app context for exit control and terminal info.',
    signature: 'useApp(): AppContext',
    params: [],
    returns: 'AppContext with exit() method and terminal dimensions',
    examples: [
      `const app = useApp();\nuseInput((_, key) => {\n  if (key.escape) app.exit();\n});`,
    ],
  },
  {
    name: 'useFocus',
    description: 'Manage focus state for interactive components.',
    signature: 'useFocus(options?: FocusOptions): FocusResult',
    params: [
      { name: 'options.autoFocus', type: 'boolean', required: false, default: 'false', description: 'Auto-focus on mount' },
      { name: 'options.id', type: 'string', required: false, description: 'Focus element ID' },
    ],
    returns: 'Object with isFocused() accessor and focus control methods',
    examples: [
      `const { isFocused, focus } = useFocus({ autoFocus: true });\n// isFocused() returns true/false`,
    ],
  },
  {
    name: 'useMouse',
    description: 'Handle mouse events (click, scroll, move).',
    signature: 'useMouse(handler: MouseHandler): void',
    params: [
      { name: 'handler', type: 'MouseHandler', required: true, description: 'Mouse event handler' },
    ],
    returns: 'void',
    examples: [
      `useMouse((event) => {\n  if (event.type === 'click') handleClick(event.x, event.y);\n  if (event.type === 'scroll') handleScroll(event.direction);\n});`,
    ],
  },
  {
    name: 'useHotkeys',
    description: 'Register keyboard shortcuts with human-readable syntax.',
    signature: 'useHotkeys(bindings: HotkeyBinding[], options?: HotkeyOptions): void',
    params: [
      { name: 'bindings', type: 'HotkeyBinding[]', required: true, description: 'Array of { key, handler, description? }' },
      { name: 'options.scope', type: 'string', required: false, description: 'Hotkey scope for context-specific shortcuts' },
    ],
    returns: 'void',
    examples: [
      `useHotkeys([\n  { key: 'ctrl+s', handler: save, description: 'Save file' },\n  { key: 'ctrl+q', handler: quit, description: 'Quit' },\n  { key: 'cmd+shift+p', handler: openPalette, description: 'Command palette' }\n]);`,
    ],
  },
  {
    name: 'useTerminalSize',
    description: 'Get reactive terminal dimensions that update on resize.',
    signature: 'useTerminalSize(): { columns: Accessor<number>, rows: Accessor<number> }',
    params: [],
    returns: 'Object with reactive columns() and rows() accessors',
    examples: [
      `const { columns, rows } = useTerminalSize();\n// columns() and rows() update automatically on terminal resize`,
    ],
  },
  {
    name: 'useScroll',
    description: 'Hook for controlling Scroll component programmatically.',
    signature: 'useScroll(options?: UseScrollOptions): UseScrollReturn',
    params: [
      { name: 'options.height', type: 'number', required: false, description: 'Initial height hint' },
    ],
    returns: 'Object with scroll control methods and bind property for Scroll component',
    examples: [
      `const scroll = useScroll();\n\n// Control\nscroll.scrollToBottom();\nscroll.scrollToTop();\nscroll.scrollTo(10);\nscroll.scrollBy(5);\n\n// Read state\nconst pos = scroll.scrollTop();\nconst max = scroll.maxScroll();\n\n// Bind to component\nScroll({ ...scroll.bind, height: 20 },\n  ...content\n)`,
    ],
  },
  {
    name: 'useScrollList',
    description: 'Hook for controlling ScrollList/ChatList components programmatically.',
    signature: 'useScrollList(options?: UseScrollListOptions): UseScrollListReturn',
    params: [
      { name: 'options.inverted', type: 'boolean', required: false, default: 'false', description: 'Inverted scroll mode' },
    ],
    returns: 'Object with scroll control methods and bind property for ScrollList/ChatList',
    examples: [
      `const list = useScrollList({ inverted: true });\n\n// Control\nlist.scrollToBottom();\nlist.scrollToTop();\nlist.scrollTo(10);\nlist.scrollBy(5);\n\n// Auto-scroll when adding items\nconst addItem = (item) => {\n  items.push(item);\n  list.scrollToBottom();\n};\n\n// Bind to component\nScrollList({\n  ...list.bind,\n  items: items(),\n  children: (item) => Item({ item }),\n  height: 20,\n})`,
    ],
  },
];

// =============================================================================
// Theme System
// =============================================================================

export const themeSystem: ComponentDoc = {
  name: 'Theme System',
  category: 'utils',
  description: 'Global theming with semantic colors, spacing, and multiple built-in themes.',
  props: [
    { name: 'primary', type: "ColorValue", required: true, description: 'Primary brand color' },
    { name: 'secondary', type: "ColorValue", required: true, description: 'Secondary color' },
    { name: 'background', type: "ColorValue", required: true, description: 'Background color' },
    { name: 'surface', type: "ColorValue", required: true, description: 'Surface/card color' },
    { name: 'text', type: "ColorValue", required: true, description: 'Primary text color' },
    { name: 'textMuted', type: "ColorValue", required: true, description: 'Muted text color' },
    { name: 'border', type: "ColorValue", required: true, description: 'Border color' },
    { name: 'success', type: "ColorValue", required: true, description: 'Success state color' },
    { name: 'warning', type: "ColorValue", required: true, description: 'Warning state color' },
    { name: 'error', type: "ColorValue", required: true, description: 'Error state color' },
  ],
  examples: [
    `// Use theme colors\nText({ color: themeColor('primary') }, 'Themed text')`,
    `// Switch themes\nsetTheme(draculaTheme);`,
    `// Available themes: darkTheme, lightTheme, draculaTheme, nordTheme, monokaiTheme, etc.`,
  ],
};

export const availableThemes: ThemeDoc[] = [
  { name: 'darkTheme', description: 'Default dark theme', colors: { primary: 'cyan', background: '#1a1a2e' } },
  { name: 'lightTheme', description: 'Light theme for bright terminals', colors: { primary: 'blue', background: '#ffffff' } },
  { name: 'draculaTheme', description: 'Dracula color scheme', colors: { primary: '#bd93f9', background: '#282a36' } },
  { name: 'nordTheme', description: 'Nord color scheme', colors: { primary: '#88c0d0', background: '#2e3440' } },
  { name: 'monokaiTheme', description: 'Monokai color scheme', colors: { primary: '#66d9ef', background: '#272822' } },
  { name: 'tokyoNightTheme', description: 'Tokyo Night color scheme', colors: { primary: '#7aa2f7', background: '#1a1b26' } },
  { name: 'catppuccinTheme', description: 'Catppuccin Mocha theme', colors: { primary: '#cba6f7', background: '#1e1e2e' } },
  { name: 'gruvboxTheme', description: 'Gruvbox dark theme', colors: { primary: '#fabd2f', background: '#282828' } },
];

// =============================================================================
// Signals (Core Reactivity)
// =============================================================================

export const signals: HookDoc[] = [
  {
    name: 'createSignal',
    description: 'Create a reactive signal (core primitive for state management).',
    signature: 'createSignal<T>(value: T): [Accessor<T>, Setter<T>]',
    params: [
      { name: 'value', type: 'T', required: true, description: 'Initial value' },
    ],
    returns: 'Tuple of [getter, setter]',
    examples: [
      `const [count, setCount] = createSignal(0);\nconsole.log(count()); // 0\nsetCount(5);\nconsole.log(count()); // 5`,
    ],
  },
  {
    name: 'createEffect',
    description: 'Run a function that auto-tracks signal dependencies and re-runs when they change.',
    signature: 'createEffect(fn: () => void): void',
    params: [
      { name: 'fn', type: '() => void', required: true, description: 'Effect function' },
    ],
    returns: 'void',
    examples: [
      `createEffect(() => {\n  console.log('Count is now:', count());\n});`,
    ],
  },
  {
    name: 'createMemo',
    description: 'Create a derived/computed value that caches and updates automatically.',
    signature: 'createMemo<T>(fn: () => T): Accessor<T>',
    params: [
      { name: 'fn', type: '() => T', required: true, description: 'Computation function' },
    ],
    returns: 'Accessor function returning the memoized value',
    examples: [
      `const doubled = createMemo(() => count() * 2);\nconsole.log(doubled()); // auto-updates when count changes`,
    ],
  },
  {
    name: 'batch',
    description: 'Batch multiple signal updates into a single re-render.',
    signature: 'batch(fn: () => void): void',
    params: [
      { name: 'fn', type: '() => void', required: true, description: 'Function with multiple updates' },
    ],
    returns: 'void',
    examples: [
      `batch(() => {\n  setX(1);\n  setY(2);\n  setZ(3);\n}); // Only one re-render`,
    ],
  },
];

// =============================================================================
// All Documentation Combined
// =============================================================================

export const allComponents: ComponentDoc[] = [
  ...primitives,
  ...atoms,
  ...molecules,
  ...dataViz,
  ...organisms,
  ...layouts,
  themeSystem,
];

export const allHooks: HookDoc[] = [
  ...hooks,
  ...signals,
];

export const allThemes: ThemeDoc[] = availableThemes;

// Category groupings for listing
export const categories = {
  primitives: primitives.map(c => c.name),
  atoms: atoms.map(c => c.name),
  molecules: [...molecules, ...dataViz].map(c => c.name),
  organisms: organisms.map(c => c.name),
  layouts: layouts.map(c => c.name),
  hooks: hooks.map(h => h.name),
  signals: signals.map(s => s.name),
  themes: availableThemes.map(t => t.name),
};
