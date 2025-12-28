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
    category: 'organisms',
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

ConfirmDialog({ ...dialog.props, selected: dialog.selected })

// Handle input
useInput((_, key) => {
  if (key.left || key.right) dialog.toggle()
  if (key.return) dialog.confirm()
  if (key.escape) dialog.cancel()
})`,
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
  // Overlay Stack
  // =============================================================================
  {
    name: 'OverlayStack',
    category: 'organisms',
    description: 'Overlay stack manager for modals, dialogs, and toasts. Created via createOverlayStack(). Handles z-ordering, exclusive focus, priority levels, and lifecycle callbacks.',
    props: [
      { name: 'id', type: 'string', required: true, description: 'Unique overlay identifier' },
      { name: 'component', type: '() => VNode | null', required: true, description: 'Component to render' },
      { name: 'priority', type: "'low' | 'normal' | 'high' | 'critical'", required: false, default: "'normal'", description: 'Priority level (higher = above lower)' },
      { name: 'closeOnEscape', type: 'boolean', required: false, default: 'true', description: 'Close when escape is pressed' },
      { name: 'closeOnClickOutside', type: 'boolean', required: false, default: 'false', description: 'Close when clicking outside' },
      { name: 'showBackdrop', type: 'boolean', required: false, default: 'true', description: 'Show backdrop/dim behind' },
      { name: 'backdropChar', type: 'string', required: false, default: "' '", description: 'Backdrop character' },
      { name: 'backdropColor', type: 'ColorValue', required: false, description: 'Backdrop color' },
      { name: 'onOpen', type: '() => void', required: false, description: 'Callback when overlay is opened' },
      { name: 'onClose', type: '() => void', required: false, description: 'Callback when overlay is closed' },
      { name: 'beforeClose', type: '() => boolean', required: false, description: 'Callback before close (return false to cancel)' },
      { name: 'data', type: 'unknown', required: false, description: 'Custom data attached to overlay' },
    ],
    examples: [
      `// Create overlay stack
const overlays = createOverlayStack()

// Stack API
overlays.push({ id, component, priority? })  // Add overlay
overlays.pop()                               // Remove top overlay
overlays.close(id)                           // Close specific overlay
overlays.closeAll()                          // Close all overlays
overlays.current()                           // Get top overlay
overlays.hasOverlay()                        // Check if any open
overlays.isOpen(id)                          // Check if specific is open
overlays.get(id)                             // Get overlay by ID
overlays.bringToTop(id)                      // Move to top
overlays.size()                              // Number of overlays`,
      `// Helper functions
import { createModalOverlay, createToastOverlay, createCriticalOverlay,
         shouldBlockInput, handleOverlayEscape } from 'tuiuiu.js'

// Quick modal creation
overlays.push(createModalOverlay({
  id: 'settings',
  component: () => SettingsModal(),
  onClose: () => console.log('closed'),
}))

// Low-priority toast (no backdrop)
const toast = createToastOverlay({
  id: 'notification',
  component: () => Toast({ message: 'Saved!' }),
  duration: 3000,
})
overlays.push(toast)

// Critical overlay (highest priority, no escape close)
overlays.push(createCriticalOverlay({
  id: 'error',
  component: () => ErrorDialog(),
}))

// Input handling
useInput((_, key) => {
  if (key.escape && handleOverlayEscape(overlays)) return
  if (shouldBlockInput(overlays)) return
  // Normal input handling
})`,
    ],
  },
  {
    name: 'OverlayContainer',
    category: 'organisms',
    description: 'Container component that renders all overlays from an overlay stack. Used with createOverlayStack() for modal/dialog management.',
    props: [
      { name: 'stack', type: 'OverlayStackState', required: true, description: 'Overlay stack from createOverlayStack()' },
      { name: 'renderBackdrop', type: '(entry: OverlayEntry) => VNode | null', required: false, description: 'Custom backdrop renderer' },
    ],
    examples: [
      `// Create overlay stack
const overlays = createOverlayStack()

// Push an overlay
overlays.push({
  id: 'confirm',
  component: () => ConfirmDialog({ ... }),
  priority: 'normal',
  closeOnEscape: true,
})

// Render in your app
Box({},
  MainContent(),
  OverlayContainer({ stack: overlays })
)

// Handle input
useInput((_, key) => {
  if (key.escape && overlays.hasOverlay()) {
    if (overlays.current()?.closeOnEscape) {
      overlays.pop()
    }
    return
  }
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
      { name: 'filteredItems', type: 'CommandItem[]', required: true, description: 'Filtered items (after search)' },
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

useInput((input, key) => {
  if (key.upArrow) palette.selectPrev()
  if (key.downArrow) palette.selectNext()
  if (key.return) palette.confirm()
  if (key.escape) palette.close()
  if (input && !key.ctrl) palette.type(input)
})`,
    ],
  },
  {
    name: 'GoToDialog',
    category: 'organisms',
    description: 'Quick navigation dialog for jumping to specific line, file, or item. Uses createGoToDialog() for state management.',
    props: [
      { name: 'title', type: 'string', required: false, default: "'Go to'", description: 'Dialog title' },
      { name: 'placeholder', type: 'string', required: false, description: 'Input placeholder' },
      { name: 'value', type: 'string', required: true, description: 'Current input value' },
      { name: 'onSubmit', type: '(value: string) => void', required: false, description: 'Submit callback' },
      { name: 'onClose', type: '() => void', required: false, description: 'Close callback' },
    ],
    examples: [
      `const goTo = createGoToDialog({
  onSubmit: (line) => jumpToLine(Number(line)),
  onClose: () => setShowGoTo(false),
})

GoToDialog({
  title: 'Go to line',
  placeholder: 'Enter line number...',
  value: goTo.value(),
  onSubmit: goTo.submit,
  onClose: goTo.close,
})`,
    ],
  },

  // =============================================================================
  // Data Table
  // =============================================================================
  {
    name: 'DataTable',
    category: 'organisms',
    description: 'Advanced data table with sorting, filtering, pagination, and keyboard navigation.',
    props: [
      { name: 'columns', type: 'DataTableColumn[]', required: true, description: 'Column definitions { key, header, width?, sortable?, filterable?, align?, render? }' },
      { name: 'data', type: 'Record<string, unknown>[]', required: true, description: 'Row data' },
      { name: 'pageSize', type: 'number', required: false, default: '10', description: 'Rows per page' },
      { name: 'sortable', type: 'boolean', required: false, default: 'true', description: 'Enable column sorting' },
      { name: 'filterable', type: 'boolean', required: false, default: 'false', description: 'Enable column filtering' },
      { name: 'showRowNumbers', type: 'boolean', required: false, default: 'false', description: 'Show row numbers' },
      { name: 'highlightSelected', type: 'boolean', required: false, default: 'true', description: 'Highlight selected row' },
      { name: 'striped', type: 'boolean', required: false, default: 'false', description: 'Alternating row colors' },
      { name: 'bordered', type: 'boolean', required: false, default: 'true', description: 'Show borders' },
      { name: 'onRowSelect', type: '(row: Record<string, unknown>, index: number) => void', required: false, description: 'Row selection callback' },
      { name: 'state', type: 'DataTableState', required: false, description: 'External state from createDataTable()' },
    ],
    examples: [
      `const table = createDataTable({
  columns: [
    { key: 'name', header: 'Name', sortable: true },
    { key: 'email', header: 'Email', width: 30 },
    { key: 'status', header: 'Status', render: (val) => Badge({ label: val }) },
  ],
  data: users,
  pageSize: 20,
})

DataTable({
  ...table.props,
  onRowSelect: (row) => openUser(row.id),
})`,
    ],
  },
  {
    name: 'VirtualDataTable',
    category: 'organisms',
    description: 'DataTable variant with virtual scrolling for very large datasets.',
    props: [
      { name: 'columns', type: 'DataTableColumn[]', required: true, description: 'Column definitions' },
      { name: 'data', type: 'Record<string, unknown>[]', required: true, description: 'Row data' },
      { name: 'height', type: 'number', required: true, description: 'Visible height in rows' },
      { name: 'rowHeight', type: 'number', required: false, default: '1', description: 'Row height' },
    ],
    examples: [
      `VirtualDataTable({
  columns: columns,
  data: largeDataset,  // 10k+ rows
  height: 30,
})`,
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
      { name: 'root', type: 'string', required: true, description: 'Root directory path' },
      { name: 'currentPath', type: 'string', required: false, description: 'Current path (controlled)' },
      { name: 'showHidden', type: 'boolean', required: false, default: 'false', description: 'Show hidden files' },
      { name: 'showPreview', type: 'boolean', required: false, default: 'false', description: 'Show file preview pane' },
      { name: 'showDetails', type: 'boolean', required: false, default: 'true', description: 'Show file details (size, date)' },
      { name: 'iconSet', type: "'unicode' | 'ascii' | 'nerd'", required: false, default: "'unicode'", description: 'Icon set to use' },
      { name: 'onSelect', type: '(path: string) => void', required: false, description: 'File selection handler' },
      { name: 'onNavigate', type: '(path: string) => void', required: false, description: 'Directory navigation handler' },
      { name: 'filter', type: 'FileFilter', required: false, description: 'File filter function' },
      { name: 'sort', type: "FileSortField", required: false, description: 'Sort field (name, size, date, type)' },
    ],
    examples: [
      `FileBrowser({
  root: '/home/user',
  showHidden: false,
  showPreview: true,
  onSelect: (path) => openFile(path),
  filter: (item) => !item.name.startsWith('.'),
})`,
    ],
  },
  {
    name: 'DirectoryTree',
    category: 'organisms',
    description: 'Tree view of directory structure with expandable nodes.',
    props: [
      { name: 'root', type: 'string', required: true, description: 'Root directory path' },
      { name: 'expanded', type: 'Set<string>', required: false, description: 'Expanded directories' },
      { name: 'selected', type: 'string', required: false, description: 'Selected path' },
      { name: 'showHidden', type: 'boolean', required: false, default: 'false', description: 'Show hidden files' },
      { name: 'showFiles', type: 'boolean', required: false, default: 'true', description: 'Show files (not just directories)' },
      { name: 'onSelect', type: '(path: string) => void', required: false, description: 'Selection callback' },
      { name: 'onExpand', type: '(path: string) => void', required: false, description: 'Expand callback' },
      { name: 'onCollapse', type: '(path: string) => void', required: false, description: 'Collapse callback' },
    ],
    examples: [
      `DirectoryTree({
  root: process.cwd(),
  showFiles: false,
  onSelect: (dir) => setCurrentDir(dir),
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
- Auto height estimation with content-based caching
- Reactive updates when items change
- Keyboard navigation (arrows, vim keys, page up/down)
- Mouse wheel support
- Auto-scroll for streaming content`,
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
      { name: 'hotkeyScope', type: 'string', required: false, default: "'global'", description: 'Hotkey scope for conflict prevention' },
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
    name: 'Scroll',
    category: 'primitives',
    description: `**Universal scroll wrapper for any VNode content.**

Use this when scrolling complex layouts, not lists of items.
Supports smooth line-by-line scrolling with ANSI preservation.`,
    props: [
      { name: 'height', type: 'number', required: true, description: 'Visible height in lines' },
      { name: 'width', type: 'number', required: false, default: '80', description: 'Width for content layout' },
      { name: 'showScrollbar', type: 'boolean', required: false, default: 'true', description: 'Show scrollbar' },
      { name: 'keysEnabled', type: 'boolean', required: false, default: 'true', description: 'Enable keyboard navigation' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Is focused' },
      { name: 'scrollbarColor', type: 'ColorValue', required: false, default: "'cyan'", description: 'Thumb color' },
      { name: 'trackColor', type: 'ColorValue', required: false, default: "'gray'", description: 'Track color' },
      { name: 'state', type: 'ScrollState', required: false, description: 'External state from useScroll()' },
    ],
    examples: [
      `// Wrap any content
Scroll({ height: 10 },
  Text({}, veryLongText),
)`,
      `// Complex layouts
Scroll({ height: 20, width: 60 },
  Box({ flexDirection: 'column' },
    Header(),
    Content(),
    Footer(),
  ),
)`,
      `// With programmatic control
const scroll = useScroll()

Scroll(
  { ...scroll.bind, height: 20 },
  ...contentNodes
)

scroll.scrollToBottom()`,
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
    description: 'Resizable split view with two panels. Supports horizontal and vertical orientation.',
    props: [
      { name: 'first', type: 'VNode', required: true, description: 'First panel content' },
      { name: 'second', type: 'VNode', required: true, description: 'Second panel content' },
      { name: 'direction', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Split direction' },
      { name: 'initialSize', type: 'number', required: false, default: '50', description: 'Initial size of first panel (percentage)' },
      { name: 'minSize', type: 'number', required: false, default: '10', description: 'Minimum size (percentage)' },
      { name: 'maxSize', type: 'number', required: false, default: '90', description: 'Maximum size (percentage)' },
      { name: 'dividerStyle', type: "'single' | 'double' | 'thick' | 'dashed'", required: false, default: "'single'", description: 'Divider style' },
      { name: 'dividerColor', type: 'ColorValue', required: false, description: 'Divider color' },
      { name: 'resizable', type: 'boolean', required: false, default: 'true', description: 'Allow resizing' },
      { name: 'state', type: 'SplitPanelState', required: false, description: 'External state from createSplitPanel()' },
    ],
    examples: [
      `SplitPanel({
  first: FileTree(),
  second: Editor(),
  direction: 'horizontal',
  initialSize: 30,
})`,
    ],
  },
  {
    name: 'ThreePanel',
    category: 'organisms',
    description: 'Three-panel layout (left sidebar, main content, right sidebar).',
    props: [
      { name: 'left', type: 'VNode', required: false, description: 'Left panel content' },
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
    description: 'CSS Grid-like layout for terminal. Supports tracks, areas, and alignment.',
    props: [
      { name: 'columns', type: 'string | TrackSize[]', required: false, description: 'Column tracks (e.g., "1fr 2fr 1fr" or [{ fr: 1 }, { px: 20 }])' },
      { name: 'rows', type: 'string | TrackSize[]', required: false, description: 'Row tracks' },
      { name: 'areas', type: 'string[][]', required: false, description: 'Named grid areas' },
      { name: 'gap', type: 'number', required: false, default: '0', description: 'Gap between cells' },
      { name: 'justifyItems', type: "'start' | 'end' | 'center' | 'stretch'", required: false, description: 'Horizontal alignment of items' },
      { name: 'alignItems', type: "'start' | 'end' | 'center' | 'stretch'", required: false, description: 'Vertical alignment of items' },
      { name: 'width', type: 'number', required: false, description: 'Grid width' },
      { name: 'height', type: 'number', required: false, description: 'Grid height' },
      { name: 'children', type: 'VNode[]', required: false, description: 'Grid items (use GridItem for positioning)' },
    ],
    examples: [
      `Grid({
  columns: '1fr 2fr 1fr',
  rows: 'auto 1fr auto',
  gap: 1,
  areas: [
    ['header', 'header', 'header'],
    ['sidebar', 'main', 'aside'],
    ['footer', 'footer', 'footer'],
  ],
},
  GridItem({ area: 'header' }, Header()),
  GridItem({ area: 'sidebar' }, Sidebar()),
  GridItem({ area: 'main' }, MainContent()),
)`,
    ],
  },
  {
    name: 'AutoGrid',
    category: 'organisms',
    description: 'Auto-layout grid that automatically wraps items based on available space.',
    props: [
      { name: 'minItemWidth', type: 'number', required: false, default: '20', description: 'Minimum item width' },
      { name: 'gap', type: 'number', required: false, default: '1', description: 'Gap between items' },
      { name: 'width', type: 'number', required: false, description: 'Grid width' },
      { name: 'children', type: 'VNode[]', required: false, description: 'Grid items' },
    ],
    examples: [
      `AutoGrid({ minItemWidth: 25, gap: 1 },
  ...cards.map(card => Card({ ...card }))
)`,
    ],
  },
  {
    name: 'DashboardGrid',
    category: 'organisms',
    description: 'Dashboard-style grid with named regions for header, sidebar, main, and footer.',
    props: [
      { name: 'header', type: 'VNode', required: false, description: 'Header content' },
      { name: 'sidebar', type: 'VNode', required: false, description: 'Sidebar content' },
      { name: 'main', type: 'VNode', required: true, description: 'Main content' },
      { name: 'footer', type: 'VNode', required: false, description: 'Footer content' },
      { name: 'sidebarWidth', type: 'number', required: false, default: '20', description: 'Sidebar width (percentage)' },
    ],
    examples: [
      `DashboardGrid({
  header: StatusBar(),
  sidebar: Navigation(),
  main: Dashboard(),
  footer: HelpText(),
})`,
    ],
  },

  // =============================================================================
  // Legacy Scroll Components (prefer ScrollList/Scroll instead)
  // =============================================================================
  {
    name: 'ScrollableText',
    category: 'organisms',
    description: `**PREFER: Scroll from primitives**

Legacy component. Use Scroll({ height }, Text({}, content)) instead for better performance and consistency.`,
    props: [
      { name: 'text', type: 'string', required: true, description: 'Text content' },
      { name: 'height', type: 'number', required: true, description: 'Visible height' },
    ],
    examples: [
      `// ❌ Legacy
ScrollableText({ text: longContent, height: 10 })

// ✅ Preferred
Scroll({ height: 10 }, Text({}, longContent))`,
    ],
    relatedComponents: ['Scroll'],
  },
  {
    name: 'LogViewer',
    category: 'organisms',
    description: `**PREFER: ScrollList with autoScroll**

Legacy component with line numbers and highlighting. Use ScrollList for more flexibility.`,
    props: [
      { name: 'lines', type: 'string[]', required: true, description: 'Log lines' },
      { name: 'height', type: 'number', required: true, description: 'Visible height' },
      { name: 'autoScroll', type: 'boolean', required: false, default: 'true', description: 'Auto-scroll' },
      { name: 'showLineNumbers', type: 'boolean', required: false, default: 'false', description: 'Show line numbers' },
      { name: 'highlightPattern', type: 'RegExp', required: false, description: 'Highlight pattern' },
    ],
    examples: [
      `// ❌ Legacy
LogViewer({ lines: logs(), height: 15, autoScroll: true })

// ✅ Preferred - more flexible
ScrollList({
  items: logs(),
  children: (log, i) => Box({ flexDirection: 'row' },
    Text({ color: 'gray' }, String(i + 1).padStart(4) + ' '),
    Text({ color: log.includes('ERROR') ? 'red' : 'foreground' }, log),
  ),
  height: 15,
  itemHeight: 1,
  autoScroll: true,
})`,
    ],
    relatedComponents: ['ScrollList'],
  },
  {
    name: 'EditableDataTable',
    category: 'organisms',
    description: 'DataTable with inline cell editing support. Extends DataTable with editable columns.',
    props: [
      { name: 'data', type: 'T[]', required: true, description: 'Array of row data objects' },
      { name: 'columns', type: 'EditableColumn<T>[]', required: true, description: 'Column definitions with edit configuration' },
      { name: 'height', type: 'number', required: true, description: 'Visible height in rows' },
      { name: 'onCellEdit', type: '(row: T, key: string, value: any) => void', required: false, description: 'Cell edit callback' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Enable keyboard navigation and editing' },
    ],
    examples: [
      `EditableDataTable({\n  data: users(),\n  columns: [\n    { key: 'name', header: 'Name', editable: true },\n    { key: 'email', header: 'Email', editable: true },\n    { key: 'role', header: 'Role', editable: true, options: ['admin', 'user'] },\n  ],\n  height: 10,\n  onCellEdit: (row, key, value) => updateUser(row.id, { [key]: value }),\n})`,
    ],
    relatedComponents: ['DataTable'],
  },
];
