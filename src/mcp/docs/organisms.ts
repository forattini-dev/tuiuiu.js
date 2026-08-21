/**
 * Organisms Documentation
 *
 * Complex, self-contained UI units that combine atoms and molecules.
 */

import type { ComponentDoc } from '../types.js';

export const organisms: ComponentDoc[] = [
  // =============================================================================
  // Modals & Dialogs
  // =============================================================================
  {
    name: 'Modal',
    category: 'utils',
    description: 'Modal dialog with customizable size, position, borders, backdrop, and close button. Renders centered content with optional title, footer, and close hint.',
    props: [
      { name: 'title', type: 'string', required: false, description: 'Modal title displayed in title bar' },
      { name: 'content', type: 'VNode', required: true, description: 'Modal content' },
      { name: 'size', type: "'small' | 'medium' | 'large' | 'fullscreen' | { width: number; height: number }", required: false, default: "'medium'", description: 'Modal size (small: 40x10, medium: 60x16, large: 80x22)' },
      { name: 'position', type: "'center' | 'top' | 'bottom' | { x: number; y: number }", required: false, default: "'center'", description: 'Modal position' },
      { name: 'borderStyle', type: "'single' | 'double' | 'round' | 'heavy' | 'none'", required: false, default: "'round'", description: 'Border style' },
      { name: 'borderColor', type: 'ColorValue', required: false, description: 'Border color' },
      { name: 'titleColor', type: 'ColorValue', required: false, description: 'Title color' },
      { name: 'backdrop', type: 'boolean', required: false, default: 'true', description: 'Show backdrop (dim area behind modal)' },
      { name: 'backdropChar', type: 'string', required: false, default: "' '", description: 'Backdrop character' },
      { name: 'showCloseHint', type: 'boolean', required: false, default: 'true', description: 'Show close hint text' },
      { name: 'closeHint', type: 'string', required: false, default: "'Press ESC to close'", description: 'Close hint text' },
      { name: 'footer', type: 'VNode', required: false, description: 'Footer content' },
      { name: 'padding', type: 'number', required: false, default: '1', description: 'Padding inside modal' },
      { name: 'showCloseButton', type: 'boolean', required: false, default: 'false', description: 'Show close button (X) in the title bar' },
      { name: 'onClose', type: '() => void', required: false, description: 'Close callback - called when X button or backdrop is clicked' },
      { name: 'closeOnBackdrop', type: 'boolean', required: false, default: 'true', description: 'Close when backdrop is clicked' },
    ],
    examples: [
      `// Simple modal
Modal({
  title: 'Settings',
  content: SettingsForm(),
  size: 'medium',
  onClose: () => setShowModal(false)
})`,
      `// With state manager
const modalState = createModal()
modalState.open()

When(modalState.isOpen,
  Modal({
    title: 'Confirm Delete',
    content: Text({}, 'Are you sure?'),
    showCloseButton: true,
    onClose: modalState.close
  })
)`,
    ],
  },
  {
    name: 'ConfirmDialog',
    category: 'organisms',
    description: 'Pre-built modal for yes/no confirmations with customizable buttons and semantic colors.',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Dialog title' },
      { name: 'message', type: 'string', required: true, description: 'Confirmation message' },
      { name: 'confirmText', type: 'string', required: false, default: "'Confirm'", description: 'Confirm button text' },
      { name: 'cancelText', type: 'string', required: false, default: "'Cancel'", description: 'Cancel button text' },
      { name: 'confirmColor', type: 'ColorValue', required: false, description: 'Confirm button color' },
      { name: 'cancelColor', type: 'ColorValue', required: false, description: 'Cancel button color' },
      { name: 'selected', type: 'number', required: false, default: '0', description: 'Selected button (0 = cancel, 1 = confirm)' },
      { name: 'type', type: "'info' | 'warning' | 'danger'", required: false, default: "'info'", description: 'Dialog type (affects colors)' },
      { name: 'onConfirm', type: '() => void', required: false, description: 'Confirm callback' },
      { name: 'onCancel', type: '() => void', required: false, description: 'Cancel callback' },
    ],
    examples: [
      `// With createConfirmDialog state
const dialog = createConfirmDialog({
  title: 'Delete File',
  message: 'This action cannot be undone.',
  type: 'danger',
  onConfirm: handleDelete,
  onCancel: closeDialog,
})

ConfirmDialog(dialog.props)

useShortcut(['left', 'right', 'tab'], dialog.toggle)
useShortcut('enter', dialog.activateSelected)
useShortcut('escape', dialog.cancel)`,
    ],
  },
  {
    name: 'Toast',
    category: 'organisms',
    description: 'Simple notification message with semantic colors and icon.',
    props: [
      { name: 'message', type: 'string', required: true, description: 'Toast message' },
      { name: 'type', type: "'success' | 'error' | 'warning' | 'info'", required: false, default: "'info'", description: 'Toast type' },
      { name: 'position', type: "'top' | 'bottom'", required: false, default: "'bottom'", description: 'Position on screen' },
      { name: 'showIcon', type: 'boolean', required: false, default: 'true', description: 'Show icon' },
      { name: 'fullWidth', type: 'boolean', required: false, default: 'false', description: 'Expand to fill available width' },
    ],
    examples: [
      `Toast({ message: 'File saved successfully!', type: 'success' })`,
      `Toast({ message: 'Connection lost', type: 'error', position: 'top' })`,
    ],
  },
  {
    name: 'AlertBox',
    category: 'organisms',
    description: 'Styled alert message box with optional title and icon.',
    props: [
      { name: 'title', type: 'string', required: false, description: 'Alert title' },
      { name: 'message', type: 'string', required: true, description: 'Alert message' },
      { name: 'type', type: "'success' | 'error' | 'warning' | 'info'", required: false, default: "'info'", description: 'Alert type' },
      { name: 'showIcon', type: 'boolean', required: false, default: 'true', description: 'Show icon' },
      { name: 'fullWidth', type: 'boolean', required: false, default: 'false', description: 'Expand to fill available width' },
    ],
    examples: [
      `AlertBox({
  title: 'Warning',
  message: 'This operation may take a while.',
  type: 'warning'
})`,
    ],
  },
  {
    name: 'Window',
    category: 'organisms',
    description: 'Desktop-style window with title bar and optional buttons. Supports semantic variants with intelligent theming.',
    props: [
      { name: 'title', type: 'string', required: true, description: 'Window title' },
      { name: 'variant', type: "'default' | 'primary' | 'success' | 'warning' | 'danger'", required: false, default: "'default'", description: 'Window variant for semantic coloring' },
      { name: 'color', type: 'ColorValue', required: false, description: 'Custom color override (uses getContrastColor for text)' },
      { name: 'width', type: 'number', required: false, description: 'Window width' },
      { name: 'height', type: 'number', required: false, description: 'Window height (content area)' },
      { name: 'showClose', type: 'boolean', required: false, default: 'true', description: 'Show close button' },
      { name: 'showMinimize', type: 'boolean', required: false, default: 'false', description: 'Show minimize button' },
      { name: 'showMaximize', type: 'boolean', required: false, default: 'false', description: 'Show maximize button' },
      { name: 'onClose', type: '() => void', required: false, description: 'Close button callback' },
      { name: 'children', type: 'VNode | VNode[]', required: false, description: 'Window content' },
    ],
    examples: [
      `Window({
  title: 'Settings',
  variant: 'primary',
  showClose: true,
  children: SettingsContent()
})`,
    ],
  },

  // =============================================================================
  // Command Palette
  // =============================================================================
  {
    name: 'CommandPalette',
    category: 'organisms',
    description: 'Searchable command palette with fuzzy search, keyboard navigation, and categorized items. Like VS Code Ctrl+Shift+P.',
    props: [
      { name: 'query', type: 'string', required: true, description: 'Current search query' },
      { name: 'items', type: 'CommandItem[]', required: true, description: 'All available items { id, label, description?, category?, shortcut?, icon?, action? }' },
      { name: 'filteredItems', type: 'CommandItem[]', required: false, description: 'Filtered items; derived from items/query when omitted' },
      { name: 'selectedIndex', type: 'number', required: true, description: 'Currently selected index' },
      { name: 'placeholder', type: 'string', required: false, description: 'Placeholder text for search input' },
      { name: 'title', type: 'string', required: false, description: 'Palette title' },
      { name: 'maxVisible', type: 'number', required: false, description: 'Maximum visible items' },
      { name: 'showCategories', type: 'boolean', required: false, description: 'Show category headers' },
      { name: 'showShortcuts', type: 'boolean', required: false, description: 'Show keyboard shortcuts' },
      { name: 'width', type: 'number', required: false, description: 'Palette width' },
      { name: 'borderStyle', type: "'single' | 'double' | 'round' | 'heavy' | 'none'", required: false, description: 'Border style' },
      { name: 'borderColor', type: 'ColorValue', required: false, description: 'Border color' },
      { name: 'highlightColor', type: 'ColorValue', required: false, description: 'Highlight color for matches' },
      { name: 'selectedBg', type: 'ColorValue', required: false, description: 'Selected item background' },
      { name: 'noResultsMessage', type: 'string', required: false, description: 'No results message' },
      { name: 'onItemClick', type: '(item: CommandItem, index: number) => void', required: false, description: 'Item click callback' },
    ],
    examples: [
      `const palette = createCommandPalette({
  items: [
    { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', action: save },
    { id: 'open', label: 'Open File', shortcut: 'Ctrl+O', category: 'File' },
  ],
  onSelect: (item) => item.action?.(),
  onClose: () => setPaletteOpen(false),
})

When(showPalette(),
  CommandPalette({
    ...palette.props,
    query: palette.query(),
    filteredItems: palette.filteredItems(),
    selectedIndex: palette.selectedIndex(),
  })
)

// CommandPalette binds navigation, confirmation, dismissal, and text editing
// through the active InteractionRuntime when it is mounted.`,
    ],
  },
  {
    name: 'GoToDialog',
    category: 'organisms',
    description: 'Presentational number dialog for jumping to a bounded line, slide, or item.',
    props: [
      { name: 'title', type: 'string', required: false, default: "'Go to'", description: 'Dialog title' },
      { name: 'value', type: 'string', required: true, description: 'Current input value' },
      { name: 'max', type: 'number', required: true, description: 'Maximum allowed number' },
      { name: 'prompt', type: 'string', required: false, default: "'Enter number:'", description: 'Prompt shown above the value' },
      { name: 'width', type: 'number', required: false, default: '30', description: 'Dialog width' },
      { name: 'borderStyle', type: "'single' | 'double' | 'round' | 'heavy' | 'none'", required: false, default: "'round'", description: 'Dialog border style' },
      { name: 'borderColor', type: 'string', required: false, default: "'primary'", description: 'Dialog border color' },
    ],
    examples: [
      `GoToDialog({
  title: 'Go to line',
  prompt: 'Enter line number:',
  value: lineInput(),
  max: documentLineCount,
})`,
    ],
  },

  // =============================================================================
  // Data Table
  // =============================================================================
  {
    name: 'DataTable',
    category: 'organisms',
    description: 'Interactive table with sorting, explicit search mode, pagination, selection, Unicode-safe keyboard navigation, and flex columns.',
    props: [
      { name: 'columns', type: 'DataTableColumn[]', required: true, description: 'Column definitions { key, header, width?, flex?, minWidth?, maxWidth?, sortable?, filterable?, align?, format? }' },
      { name: 'data', type: 'Record<string, unknown>[]', required: true, description: 'Row data' },
      { name: 'getRowKey', type: '(row, index) => string', required: false, description: 'Stable row identity; recommended for sorting and filtering' },
      { name: 'selectionMode', type: "'none' | 'single' | 'multiple'", required: false, default: "'single'", description: 'Row selection behavior' },
      { name: 'pageSize', type: 'number', required: false, default: '10', description: 'Rows per page' },
      { name: 'showPagination', type: 'boolean', required: false, default: 'true', description: 'Show pagination status' },
      { name: 'showSearch', type: 'boolean', required: false, default: 'true', description: 'Enable the / search mode' },
      { name: 'striped', type: 'boolean', required: false, default: 'false', description: 'Alternating row colors' },
      { name: 'borderStyle', type: 'TableBorderStyle', required: false, default: "'single'", description: 'Table border style' },
      { name: 'availableWidth', type: 'number', required: false, default: 'terminal width', description: 'Available width for flex column calculation' },
      { name: 'onSelect', type: '(rows: Record<string, unknown>[]) => void', required: false, description: 'Complete current selection callback' },
      { name: 'onSort', type: '(column: string, direction: SortDirection) => void', required: false, description: 'Sort callback' },
      { name: 'onPageChange', type: '(page: number) => void', required: false, description: 'Zero-based page callback' },
      { name: 'accessibilityLabel', type: 'string', required: false, default: "'Data table'", description: 'Semantic grid label' },
      { name: 'state', type: 'DataTableState', required: false, description: 'External state from createDataTable()' },
    ],
    examples: [
      `// Basic DataTable
const table = createDataTable({
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', width: 30 },
    { key: 'status', header: 'Status', format: (value) => String(value) },
  ],
  data: users,
  pageSize: 20,
})

DataTable({
  columns,
  data: users,
  state: table,
})`,
      `// With flex columns - fills terminal width
DataTable({
  columns: [
    { key: 'id', header: 'ID', width: 6 },           // fixed
    { key: 'name', header: 'Name', flex: 1 },        // 1 part of remaining
    { key: 'desc', header: 'Description', flex: 2 }, // 2 parts of remaining
    { key: 'status', header: 'Status', width: 10 },  // fixed
  ],
  data: items,
})`,
    ],
  },
  {
    name: 'VirtualDataTable',
    category: 'organisms',
    description: 'Windowed DataTable for large datasets. It renders only visible rows while preserving global cursor and selection indices. Import from tuiuiu.js/ui.',
    props: [
      { name: 'columns', type: 'DataTableColumn[]', required: true, description: 'Column definitions' },
      { name: 'data', type: 'Record<string, unknown>[]', required: true, description: 'Row data' },
      { name: 'visibleRows', type: 'number', required: false, default: '20', description: 'Rows in the rendered window' },
      { name: 'rowHeight', type: 'number', required: false, default: '1', description: 'Fixed rendered row height' },
      { name: 'overscan', type: 'number', required: false, default: '3', description: 'Nearby rows sampled for stable width measurement' },
      { name: 'initialScrollOffset', type: 'number', required: false, default: '0', description: 'Initial logical row offset' },
      { name: 'state', type: 'VirtualDataTableState', required: false, description: 'External state from createVirtualDataTable()' },
      { name: 'onScroll', type: '(offset: number) => void', required: false, description: 'Called when the logical offset changes' },
    ],
    examples: [
      `import { createVirtualDataTable, VirtualDataTable } from 'tuiuiu.js/ui'

const state = createVirtualDataTable({
  columns: columns,
  data: largeDataset,
  visibleRows: 30,
})

VirtualDataTable({ columns, data: largeDataset, state })
state.scrollTo(500)`,
    ],
  },

  // =============================================================================
  // File Browser
  // =============================================================================
  {
    name: 'FileBrowser',
    category: 'organisms',
    description: 'Full-featured file browser with tree navigation, file list, breadcrumbs, and preview.',
    props: [
      { name: 'path', type: 'string', required: true, description: 'Current directory path' },
      { name: 'items', type: 'FileItem[]', required: true, description: 'Items in the current directory' },
      { name: 'onPathChange', type: '(path: string) => void', required: false, description: 'Directory navigation handler' },
      { name: 'showHidden', type: 'boolean', required: false, default: 'false', description: 'Show hidden files' },
      { name: 'showPreview', type: 'boolean', required: false, default: 'false', description: 'Show file preview pane' },
      { name: 'icons', type: 'Partial<FileIcons>', required: false, description: 'Custom file icon set' },
      { name: 'onSelect', type: '(item: FileItem) => void', required: false, description: 'File selection handler' },
      { name: 'onOpen', type: '(item: FileItem) => void', required: false, description: 'File open handler' },
      { name: 'filter', type: 'FileFilter', required: false, description: 'File filter function' },
      { name: 'sort', type: "FileSorter", required: false, description: 'Sort field and direction' },
    ],
    examples: [
      `FileBrowser({
  path: '/home/user',
  items: currentItems,
  showHidden: false,
  showPreview: true,
  onPathChange: (path) => loadDirectory(path),
  onSelect: (item) => selectFile(item.path),
  onOpen: (item) => openFile(item.path),
  filter: (item) => !item.name.startsWith('.'),
})`,
    ],
  },
  {
    name: 'FileDirectoryTree',
    category: 'organisms',
    description: 'File browser tree view built from FileItem data (pairs with FileBrowser).',
    props: [
      { name: 'items', type: 'FileItem[]', required: true, description: 'Tree items (files/directories with children)' },
      { name: 'selected', type: 'string', required: false, description: 'Selected item path' },
      { name: 'expanded', type: 'Set<string>', required: false, description: 'Expanded directories' },
      { name: 'onSelect', type: '(item: FileItem) => void', required: false, description: 'Selection callback' },
      { name: 'onToggle', type: '(item: FileItem, expanded: boolean) => void', required: false, description: 'Expand/collapse callback' },
      { name: 'onOpen', type: '(item: FileItem) => void', required: false, description: 'Open callback (Enter/double click)' },
      { name: 'showHidden', type: 'boolean', required: false, default: 'false', description: 'Show hidden files' },
      { name: 'icons', type: 'Partial<FileIcons>', required: false, description: 'Custom icon set' },
      { name: 'indentSize', type: 'number', required: false, description: 'Indent size' },
      { name: 'lineStyle', type: "'none' | 'ascii' | 'unicode'", required: false, description: 'Tree line style' },
      { name: 'width', type: 'number | string', required: false, description: 'Container width' },
      { name: 'height', type: 'number | string', required: false, description: 'Container height' },
      { name: 'maxDepth', type: 'number', required: false, description: 'Max depth to display' },
      { name: 'selectedStyle', type: 'TextStyleProps', required: false, description: 'Selected item style' },
      { name: 'directoryStyle', type: 'TextStyleProps', required: false, description: 'Directory style' },
      { name: 'fileStyle', type: 'TextStyleProps', required: false, description: 'File style' },
    ],
    examples: [
      `FileDirectoryTree({
  items: fileItems,
  onSelect: (item) => openFile(item.path),
  onToggle: (item, expanded) => setExpanded(item.path, expanded),
})`,
    ],
  },

  // =============================================================================
  // Scroll Components - UNIFIED SCROLL SYSTEM
  // =============================================================================
  //
  // DECISION GUIDE:
  // - Scrolling a list of items? → ScrollList (or ChatList for chat UIs)
  // - Scrolling any VNode content? → Scroll (from primitives)
  // - Very large list (10k+ items) with selection? → VirtualList
  //
  // All scroll components use smooth line-by-line scrolling with ANSI preservation.
  //
  {
    name: 'ScrollList',
    category: 'organisms',
    description: `**PRIMARY scroll component for lists.** Uses smooth line-by-line scrolling with automatic height estimation.

IMPORTANT: \`children\` is a FUNCTION, not a VNode! It receives each item and returns the rendered VNode.

Features:
- Smooth scroll (shows partial items at viewport edges)
- Auto height estimation with content-based caching (supports margins!)
- Reactive updates when items change
- Keyboard navigation (arrows, vim keys, page up/down)
- Mouse wheel support
- Auto-scroll for streaming content

**Item spacing:** Use marginBottom on item containers for visual separation between items. Height estimation correctly accounts for all margin shorthands (margin, marginY, marginTop, marginBottom).`,
    props: [
      { name: 'items', type: 'T[] | (() => T[])', required: true, description: 'Items array or reactive accessor' },
      { name: 'children', type: '(item: T, index: number) => VNode', required: true, description: 'Render FUNCTION - receives item, returns VNode' },
      { name: 'height', type: 'number', required: true, description: 'Visible height in lines' },
      { name: 'width', type: 'number', required: false, default: '80', description: 'Width for layout calculations' },
      { name: 'itemHeight', type: 'number | ((item: T) => number)', required: false, description: 'Item height - auto-estimated if omitted (more performant if provided)' },
      { name: 'inverted', type: 'boolean', required: false, default: 'false', description: 'Inverted mode - newest items at bottom (for chat UIs)' },
      { name: 'autoScroll', type: 'boolean', required: false, default: 'false', description: 'Auto-scroll to bottom when content grows' },
      { name: 'autoScrollThreshold', type: 'number', required: false, default: '0', description: 'Smart auto-scroll - only if within N lines of bottom (0 = always)' },
      { name: 'showScrollbar', type: 'boolean', required: false, default: 'true', description: 'Show scrollbar indicator' },
      { name: 'keysEnabled', type: 'boolean', required: false, default: 'true', description: 'Enable keyboard navigation' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Is component focused (disables keys when false)' },
      { name: 'state', type: 'ScrollListState', required: false, description: 'External state from useScrollList() for programmatic control' },
    ],
    examples: [
      `// ✅ Basic usage - children is a FUNCTION
ScrollList({
  items: files(),           // Reactive signal
  children: (file) => FileRow({ file }),  // Function!
  height: 20,
})`,
      `// ✅ With fixed itemHeight (better performance)
ScrollList({
  items: logs(),
  children: (log) => Text({}, log),
  height: 20,
  itemHeight: 1,  // All items are 1 line
})`,
      `// ✅ With programmatic control
const list = useScrollList()

ScrollList({
  ...list.bind,
  items: data(),
  children: (item) => Row({ item }),
  height: 20,
})

// Methods available:
list.scrollToBottom()
list.scrollToTop()
list.scrollTo(50)
list.scrollBy(-5)
list.isNearBottom(3)`,
      `// ✅ Auto-scroll for logs/streaming
ScrollList({
  items: logs(),
  children: (log) => LogEntry({ log }),
  height: 20,
  autoScroll: true,
  autoScrollThreshold: 3,  // Respect user scroll position
})`,
      `// ❌ WRONG - children must be function, not VNode
ScrollList({
  items: data,
  children: Item({ data: data[0] })  // WRONG!
})`,
      `// ✅ Item spacing with margins
ScrollList({
  items: messages(),
  children: (msg) => Box(
    { marginBottom: 1 },  // 1 line gap between items
    Text({ bold: true }, msg.sender),
    Text({}, msg.text),
  ),
  height: 20,
})`,
      `// ✅ Cards with margin + border + padding
ScrollList({
  items: cards(),
  children: (card) => Box(
    { marginBottom: 1, borderStyle: 'round', padding: 1 },
    Text({ bold: true }, card.title),
    Text({}, card.body),
  ),
  height: 20,
})`,
    ],
  },
  {
    name: 'ChatList',
    category: 'organisms',
    description: `**Pre-configured ScrollList for chat/messaging UIs.**

Equivalent to ScrollList with:
- inverted: true (newest at bottom)
- autoScroll: true (auto-scroll on new messages)

Use autoScrollThreshold to respect user scroll position when they're reading history.`,
    props: [
      { name: 'items', type: 'T[] | (() => T[])', required: true, description: 'Chat messages' },
      { name: 'children', type: '(item: T, index: number) => VNode', required: true, description: 'Render function' },
      { name: 'height', type: 'number', required: true, description: 'Visible height' },
      { name: 'width', type: 'number', required: false, default: '80', description: 'Width' },
      { name: 'itemHeight', type: 'number | ((item: T) => number)', required: false, description: 'Item height' },
      { name: 'autoScrollThreshold', type: 'number', required: false, default: '0', description: 'Smart auto-scroll threshold' },
      { name: 'showScrollbar', type: 'boolean', required: false, default: 'true', description: 'Show scrollbar' },
      { name: 'state', type: 'ScrollListState', required: false, description: 'External state' },
    ],
    examples: [
      `// Basic chat UI
ChatList({
  items: messages(),
  children: (msg) => ChatBubble({ message: msg }),
  height: 20,
})`,
      `// Smart auto-scroll (respects user scroll position)
ChatList({
  items: messages(),
  children: (msg) => ChatBubble({ message: msg }),
  height: 20,
  autoScrollThreshold: 5,  // Only auto-scroll if near bottom
})`,
      `// With programmatic control
const chat = useScrollList({ inverted: true })

ChatList({
  ...chat.bind,
  items: messages(),
  children: (msg) => Message({ msg }),
  height: 20,
})

// Scroll to newest after sending
chat.scrollToBottom()`,
    ],
  },
  {
    name: 'ScrollPanel',
    category: 'organisms',
    description: 'Panel container with a titled header and a scrollable body.',
    props: [
      { name: 'title', type: 'string', required: false, description: 'Panel title' },
      { name: 'content', type: 'string[] | VNode[]', required: true, description: 'Scrollable content lines' },
      { name: 'height', type: "number | 'auto' | 'fill'", required: false, default: "'fill'", description: 'Panel height' },
      { name: 'width', type: "number | string | 'auto' | 'fill'", required: false, description: 'Panel width' },
      { name: 'flexGrow', type: 'number', required: false, description: 'Flex grow for layout' },
      { name: 'borderStyle', type: 'BorderStyle', required: false, default: "'round'", description: 'Border style' },
      { name: 'borderColor', type: 'ColorValue', required: false, default: "'muted'", description: 'Border color' },
      { name: 'showScrollbar', type: 'boolean', required: false, default: 'true', description: 'Show scrollbar' },
    ],
    examples: [
      `ScrollPanel({\n  title: 'Live Requests',\n  content: logs(),\n  height: 'fill',\n})`,
    ],
  },
  {
    name: 'VirtualList',
    category: 'organisms',
    description: `**For very large datasets (10k+ items) with selection support.**

Only renders visible items for performance. Requires fixed itemHeight.
Use ScrollList for most cases - only use VirtualList when you have thousands of items.`,
    props: [
      { name: 'items', type: 'VirtualListItem[]', required: true, description: 'All items with { key, data }' },
      { name: 'height', type: 'number', required: true, description: 'Visible height in items' },
      { name: 'renderItem', type: '(item: VirtualListItem, index: number, isSelected: boolean) => VNode', required: true, description: 'Item renderer with selection state' },
      { name: 'showScrollbar', type: 'boolean', required: false, default: 'true', description: 'Show scrollbar' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Enable keyboard' },
      { name: 'state', type: 'VirtualListState', required: false, description: 'External state from createVirtualList()' },
    ],
    examples: [
      `// Large dataset with selection
VirtualList({
  items: largeDataset.map((d, i) => ({ key: String(i), data: d })),
  height: 30,
  renderItem: (item, index, isSelected) =>
    Text({ color: isSelected ? 'cyan' : 'white' }, item.data.label),
})`,
    ],
  },

  // =============================================================================
  // Split Panels
  // =============================================================================
  {
    name: 'SplitPanel',
    category: 'organisms',
    description: 'Split view with two panels. Supports horizontal and vertical orientation.',
    props: [
      { name: 'left', type: 'VNode', required: true, description: 'Left or top panel content' },
      { name: 'right', type: 'VNode', required: true, description: 'Right or bottom panel content' },
      { name: 'direction', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Split direction' },
      { name: 'ratio', type: 'number', required: false, default: '0.5', description: 'Fraction assigned to the left or top panel' },
      { name: 'minWidth', type: 'number', required: false, description: 'Minimum width for each panel' },
      { name: 'dividerStyle', type: "'line' | 'double' | 'dotted' | 'dashed' | 'none'", required: false, default: "'line'", description: 'Divider style' },
      { name: 'dividerColor', type: 'ColorValue', required: false, description: 'Divider color' },
    ],
    examples: [
      `SplitPanel({
  left: FileTree(),
  right: Editor(),
  direction: 'horizontal',
  ratio: 0.3,
})`,
    ],
  },
  {
    name: 'ThreePanel',
    category: 'organisms',
    description: 'Three-panel layout (left sidebar, main content, right sidebar).',
    props: [
      { name: 'left', type: 'VNode', required: true, description: 'Left panel content' },
      { name: 'center', type: 'VNode', required: true, description: 'Center panel content' },
      { name: 'right', type: 'VNode', required: false, description: 'Right panel content' },
      { name: 'leftWidth', type: 'number', required: false, default: '20', description: 'Left panel width (percentage)' },
      { name: 'rightWidth', type: 'number', required: false, default: '20', description: 'Right panel width (percentage)' },
    ],
    examples: [
      `ThreePanel({
  left: Sidebar(),
  center: MainContent(),
  right: Inspector(),
  leftWidth: 25,
  rightWidth: 25,
})`,
    ],
  },

  // =============================================================================
  // Grid Layout
  // =============================================================================
  {
    name: 'Grid',
    category: 'organisms',
    description: 'Grid-inspired terminal layout. Supports tracks, areas, and alignment.',
    props: [
      { name: 'columns', type: 'string | TrackSize[] | number', required: false, description: 'Column tracks (e.g., "1fr 2fr 1fr", [10, "1fr"], or 3 for equal columns)' },
      { name: 'rows', type: 'string | TrackSize[] | number', required: false, description: 'Row tracks' },
      { name: 'areas', type: 'string', required: false, description: 'Named grid areas template string' },
      { name: 'gap', type: 'number | [number, number]', required: false, default: '0', description: 'Gap between cells (or [rowGap, columnGap])' },
      { name: 'rowGap', type: 'number', required: false, description: 'Vertical gap override' },
      { name: 'columnGap', type: 'number', required: false, description: 'Horizontal gap override' },
      { name: 'autoFlow', type: "'row' | 'column' | 'row dense' | 'column dense'", required: false, description: 'Auto-placement direction' },
      { name: 'autoRows', type: 'TrackSize', required: false, description: 'Size for auto-generated rows' },
      { name: 'autoColumns', type: 'TrackSize', required: false, description: 'Size for auto-generated columns' },
      { name: 'justifyItems', type: "'start' | 'end' | 'center' | 'stretch'", required: false, description: 'Horizontal alignment of items' },
      { name: 'alignItems', type: "'start' | 'end' | 'center' | 'stretch'", required: false, description: 'Vertical alignment of items' },
      { name: 'justifyContent', type: "'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'", required: false, description: 'Horizontal alignment of grid within container' },
      { name: 'alignContent', type: "'start' | 'end' | 'center' | 'stretch' | 'space-between' | 'space-around' | 'space-evenly'", required: false, description: 'Vertical alignment of grid within container' },
      { name: 'width', type: 'number', required: false, description: 'Grid width' },
      { name: 'height', type: 'number', required: false, description: 'Grid height' },
      { name: 'border', type: 'boolean', required: false, default: 'false', description: 'Show border around grid' },
      { name: 'borderStyle', type: "BoxStyle['borderStyle']", required: false, description: 'Border style' },
      { name: 'borderColor', type: 'string', required: false, description: 'Border color' },
      { name: 'padding', type: 'number', required: false, description: 'Inner padding' },
      { name: 'children', type: 'VNode[]', required: false, description: 'Grid items (use GridItem for positioning)' },
    ],
    examples: [
      `Grid({
  columns: '1fr 2fr 1fr',
  rows: 'auto 1fr auto',
  gap: 1,
  areas: gridAreasToTemplate([
    ['header', 'header', 'header'],
    ['sidebar', 'main', 'aside'],
    ['footer', 'footer', 'footer'],
  ]),
},
  GridItem({ area: 'header' }, Header()),
  GridItem({ area: 'sidebar' }, Sidebar()),
  GridItem({ area: 'main' }, MainContent()),
)`,
    ],
    relatedComponents: ['GridItem', 'AutoGrid', 'DashboardGrid'],
  },
  {
    name: 'GridItem',
    category: 'organisms',
    description: 'Grid item wrapper for explicit placement inside Grid.',
    props: [
      { name: 'area', type: 'string', required: false, description: 'Named grid area' },
      { name: 'column', type: "number | `${number} / ${number}` | `span ${number}`", required: false, description: 'Column placement' },
      { name: 'row', type: "number | `${number} / ${number}` | `span ${number}`", required: false, description: 'Row placement' },
      { name: 'columnSpan', type: 'number', required: false, description: 'Column span' },
      { name: 'rowSpan', type: 'number', required: false, description: 'Row span' },
      { name: 'justifySelf', type: "'start' | 'end' | 'center' | 'stretch'", required: false, description: 'Horizontal alignment inside cell' },
      { name: 'alignSelf', type: "'start' | 'end' | 'center' | 'stretch'", required: false, description: 'Vertical alignment inside cell' },
    ],
    examples: [
      `GridItem({ area: 'sidebar' }, Sidebar())`,
    ],
    relatedComponents: ['Grid'],
  },
  {
    name: 'GridRow',
    category: 'organisms',
    description: 'Convenience row layout with equal-width columns.',
    props: [
      { name: 'columnCount', type: 'number', required: false, description: 'Override column count (defaults to children length)' },
      { name: 'gap', type: 'number | [number, number]', required: false, default: '0', description: 'Gap between items' },
      { name: 'width', type: 'number', required: false, description: 'Row width' },
      { name: 'border', type: 'boolean', required: false, default: 'false', description: 'Show border' },
      { name: 'padding', type: 'number', required: false, description: 'Inner padding' },
    ],
    examples: [
      `GridRow({ gap: 1 }, CardA(), CardB(), CardC())`,
    ],
    relatedComponents: ['Grid'],
  },
  {
    name: 'GridColumn',
    category: 'organisms',
    description: 'Convenience column layout with equal-height rows.',
    props: [
      { name: 'rowCount', type: 'number', required: false, description: 'Override row count (defaults to children length)' },
      { name: 'gap', type: 'number | [number, number]', required: false, default: '0', description: 'Gap between items' },
      { name: 'height', type: 'number', required: false, description: 'Column height' },
      { name: 'border', type: 'boolean', required: false, default: 'false', description: 'Show border' },
      { name: 'padding', type: 'number', required: false, description: 'Inner padding' },
    ],
    examples: [
      `GridColumn({ gap: 1 }, RowA(), RowB(), RowC())`,
    ],
    relatedComponents: ['Grid'],
  },
  {
    name: 'AutoGrid',
    category: 'organisms',
    description: 'Auto-layout grid that automatically wraps items based on available space.',
    props: [
      { name: 'minColumnWidth', type: 'number', required: true, description: 'Minimum column width' },
      { name: 'gap', type: 'number | [number, number]', required: false, default: '0', description: 'Gap between items' },
      { name: 'width', type: 'number', required: false, description: 'Grid width' },
      { name: 'height', type: 'number', required: false, description: 'Grid height' },
    ],
    examples: [
      `AutoGrid({ minColumnWidth: 25, gap: 1 },
  ...cards.map(card => Card({ ...card }))
)`,
    ],
  },
  {
    name: 'DashboardGrid',
    category: 'organisms',
    description: 'Dashboard-style grid with named regions for header, sidebar, main, and footer.',
    props: [
      { name: 'options.width', type: 'number', required: false, default: '80', description: 'Grid width' },
      { name: 'options.height', type: 'number', required: false, description: 'Grid height' },
      { name: 'options.gap', type: 'number', required: false, default: '0', description: 'Gap between regions' },
      { name: 'options.headerHeight', type: 'number', required: false, default: '3', description: 'Header height' },
      { name: 'options.footerHeight', type: 'number', required: false, default: '1', description: 'Footer height' },
      { name: 'options.sidebarWidth', type: 'number', required: false, default: '20', description: 'Sidebar width' },
      { name: 'options.border', type: 'boolean', required: false, default: 'false', description: 'Show border' },
      { name: 'options.borderStyle', type: "BoxStyle['borderStyle']", required: false, description: 'Border style' },
      { name: 'options.borderColor', type: 'string', required: false, description: 'Border color' },
      { name: 'areas.header', type: 'VNode', required: false, description: 'Header content' },
      { name: 'areas.sidebar', type: 'VNode', required: false, description: 'Sidebar content' },
      { name: 'areas.main', type: 'VNode', required: true, description: 'Main content' },
      { name: 'areas.footer', type: 'VNode', required: false, description: 'Footer content' },
    ],
    examples: [
      `DashboardGrid(
  { width: 80, sidebarWidth: 25 },
  {
    header: StatusBar(),
    sidebar: Navigation(),
    main: Dashboard(),
    footer: HelpText(),
  }
)`,
    ],
  },
  {
    name: 'MasonryGrid',
    category: 'organisms',
    description: 'Masonry-style grid for variable-height items.',
    props: [
      { name: 'columns', type: 'number', required: true, description: 'Number of columns' },
      { name: 'gap', type: 'number', required: false, default: '0', description: 'Gap between columns' },
      { name: 'width', type: 'number', required: false, default: '80', description: 'Grid width' },
    ],
    examples: [
      `MasonryGrid({ columns: 3, gap: 1 },
  ...cards.map(card => Card(card))
)`,
    ],
  },

  // =============================================================================
  // Specialized scroll presets
  // =============================================================================
  {
    name: 'ScrollableText',
    category: 'organisms',
    description: 'Scrollable preset for one text buffer. Use Scroll for arbitrary VNode composition.',
    props: [
      { name: 'text', type: 'string', required: true, description: 'Text content' },
      { name: 'height', type: 'number', required: true, description: 'Visible height' },
    ],
    examples: [
      `ScrollableText({ text: longContent, height: 10 })`,
    ],
    relatedComponents: ['Scroll'],
  },
  {
    name: 'LogViewer',
    category: 'organisms',
    description: 'Log-oriented scroll preset with line numbers, highlighting, and tail following.',
    props: [
      { name: 'lines', type: 'string[]', required: true, description: 'Log lines' },
      { name: 'height', type: 'number', required: true, description: 'Visible height' },
      { name: 'autoScroll', type: 'boolean', required: false, default: 'true', description: 'Auto-scroll' },
      { name: 'showLineNumbers', type: 'boolean', required: false, default: 'false', description: 'Show line numbers' },
      { name: 'highlightPattern', type: 'RegExp', required: false, description: 'Highlight pattern' },
    ],
    examples: [
      `LogViewer({
  lines: logs(),
  height: 15,
  autoScroll: true,
  showLineNumbers: true,
  highlightPattern: /ERROR|WARN/,
})`,
    ],
    relatedComponents: ['ScrollList'],
  },
  {
    name: 'EditableDataTable',
    category: 'organisms',
    description: 'Controlled table with inline text, number, and select editors, validation, and keyboard commit/cancel behavior. Import from tuiuiu.js/ui.',
    props: [
      { name: 'data', type: 'T[]', required: true, description: 'Array of row data objects' },
      { name: 'columns', type: 'EditableColumn<T>[]', required: true, description: 'Column definitions with edit configuration' },
      { name: 'state', type: 'EditableDataTableState<T>', required: false, description: 'External editable table controller' },
      { name: 'onCellEdit', type: '(rowKey: string, column: string, value: any, row: T) => void', required: false, description: 'Controlled cell edit callback' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Enable keyboard navigation and editing' },
    ],
    examples: [
      `import { EditableDataTable } from 'tuiuiu.js/ui'

EditableDataTable({
  data: users(),
  columns: [
    { key: 'name', header: 'Name', editable: true },
    { key: 'age', header: 'Age', editable: true, inputType: 'number' },
  ],
  onCellEdit: (rowKey, column, value) => updateUser(rowKey, { [column]: value }),
})`,
    ],
    relatedComponents: ['DataTable'],
  },
];
