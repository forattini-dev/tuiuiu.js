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
  // Scroll & Virtual Lists
  // =============================================================================
  {
    name: 'ScrollList',
    category: 'organisms',
    description: 'Scroll list with automatic height estimation, caching, and keyboard navigation. **API Pattern: Render Function** - children is a FUNCTION that receives each item. Items can be reactive (signal/store) for auto-updates. Supports auto-scroll for chat/log UIs.',
    props: [
      { name: 'items', type: 'T[] | (() => T[])', required: true, description: 'Items to display - supports signals, stores, or static arrays. When reactive, list auto-updates!' },
      { name: 'children', type: '(item: T, index: number) => VNode', required: true, description: 'Render FUNCTION (NOT VNode!) - called for each item' },
      { name: 'height', type: 'number', required: true, description: 'Visible height in lines' },
      { name: 'width', type: 'number', required: false, default: '80', description: 'Width for layout' },
      { name: 'itemHeight', type: 'number | ((item: T) => number)', required: false, description: 'Item height (auto-estimated if omitted)' },
      { name: 'inverted', type: 'boolean', required: false, default: 'false', description: 'Inverted mode (newest at bottom)' },
      { name: 'showScrollbar', type: 'boolean', required: false, default: 'true', description: 'Show/hide scrollbar' },
      { name: 'keysEnabled', type: 'boolean', required: false, default: 'true', description: 'Enable keyboard navigation' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Is component focused' },
      { name: 'state', type: 'ScrollListState', required: false, description: 'External state for control via useScrollList()' },
      { name: 'autoScroll', type: 'boolean', required: false, default: 'false', description: 'Auto-scroll to bottom when content grows (useful for chat/log UIs)' },
      { name: 'autoScrollThreshold', type: 'number', required: false, default: '0', description: 'Only auto-scroll if within this many lines from bottom. 0 = always auto-scroll.' },
    ],
    examples: [
      `// ✅ CORRECT - children is a function\nScrollList({\n  items: files(),  // Reactive signal\n  children: (file) => FileRow({ file }),  // Function!\n  height: 20,\n})`,
      `// ✅ With Redux-like store - auto-updates on dispatch!\nconst store = createStore(todoReducer, { items: [] })\n\nScrollList({\n  items: () => store.getState().items,  // Derived from store\n  children: (item) => TodoItem({ item }),\n  height: 15,\n})\n\nstore.dispatch({ type: 'ADD', payload: newItem }) // List updates!`,
      `// ✅ Auto-scroll to follow new items (like logs)\nScrollList({\n  items: logs(),\n  children: (log) => LogEntry({ log }),\n  height: 20,\n  autoScroll: true,  // Always scroll to new items\n})`,
      `// ✅ Smart auto-scroll (only if near bottom)\nScrollList({\n  items: messages(),\n  children: (msg) => Message({ msg }),\n  height: 20,\n  autoScroll: true,\n  autoScrollThreshold: 5,  // Only auto-scroll if within 5 lines of bottom\n})`,
      `// ❌ WRONG - children must be function, not VNode\nScrollList({\n  items: data,\n  children: Item({ data: data[0] })  // WRONG! Must be function\n})`,
    ],
  },
  {
    name: 'ChatList',
    category: 'organisms',
    description: 'Pre-configured ScrollList for chat/messaging UIs with inverted scroll (newest at bottom) and auto-scroll enabled by default.',
    props: [
      { name: 'items', type: 'T[] | (() => T[])', required: true, description: 'Chat messages to display' },
      { name: 'children', type: '(item: T, index: number) => VNode', required: true, description: 'Render function for each message' },
      { name: 'height', type: 'number', required: true, description: 'Visible height in lines' },
      { name: 'width', type: 'number', required: false, default: '80', description: 'Width for layout' },
      { name: 'itemHeight', type: 'number | ((item: T) => number)', required: false, description: 'Item height' },
      { name: 'showScrollbar', type: 'boolean', required: false, default: 'true', description: 'Show/hide scrollbar' },
      { name: 'state', type: 'ScrollListState', required: false, description: 'External state for control' },
      { name: 'autoScroll', type: 'boolean', required: false, default: 'true', description: 'Auto-scroll when new messages arrive (enabled by default!)' },
      { name: 'autoScrollThreshold', type: 'number', required: false, default: '0', description: 'Smart auto-scroll threshold' },
    ],
    examples: [
      `// Basic chat - auto-scrolls to new messages\nChatList({\n  items: messages(),\n  children: (msg) => ChatBubble({ message: msg }),\n  height: 20,\n})`,
      `// Disable auto-scroll\nChatList({\n  items: messages(),\n  children: (msg) => ChatBubble({ message: msg }),\n  height: 20,\n  autoScroll: false,\n})`,
    ],
  },
  {
    name: 'ScrollArea',
    category: 'organisms',
    description: 'Generic scrollable container for any content with horizontal and vertical scrolling.',
    props: [
      { name: 'width', type: 'number', required: true, description: 'Visible width' },
      { name: 'height', type: 'number', required: true, description: 'Visible height' },
      { name: 'content', type: 'VNode', required: true, description: 'Content to scroll' },
      { name: 'showScrollbar', type: 'boolean', required: false, default: 'true', description: 'Show scrollbar' },
      { name: 'scrollbarPosition', type: "'right' | 'left'", required: false, default: "'right'", description: 'Scrollbar position' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Accept keyboard input' },
      { name: 'state', type: 'ScrollAreaState', required: false, description: 'External state from createScrollArea()' },
    ],
    examples: [
      `ScrollArea({
  width: 60,
  height: 20,
  content: LongContent(),
})`,
    ],
  },
  {
    name: 'VirtualList',
    category: 'organisms',
    description: 'Virtual scrolling list for extremely large datasets. Only renders visible items.',
    props: [
      { name: 'items', type: 'VirtualListItem[]', required: true, description: 'All items' },
      { name: 'width', type: 'number', required: true, description: 'List width' },
      { name: 'height', type: 'number', required: true, description: 'Visible height' },
      { name: 'itemHeight', type: 'number', required: true, description: 'Fixed item height' },
      { name: 'renderItem', type: '(item: VirtualListItem, index: number) => VNode', required: true, description: 'Item renderer' },
      { name: 'overscan', type: 'number', required: false, default: '3', description: 'Extra items to render above/below' },
      { name: 'state', type: 'VirtualListState', required: false, description: 'External state from createVirtualList()' },
    ],
    examples: [
      `VirtualList({
  items: largeDataset,  // 100k items
  width: 80,
  height: 30,
  itemHeight: 1,
  renderItem: (item) => Text({}, item.label),
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
  // Scroll Components (Extended)
  // =============================================================================
  {
    name: 'ScrollableText',
    category: 'organisms',
    description: 'Simple scrollable text container. Wraps text content in a ScrollArea with keyboard navigation.',
    props: [
      { name: 'text', type: 'string', required: true, description: 'Text content to display (newlines create separate lines)' },
      { name: 'height', type: 'number', required: true, description: 'Visible height in rows' },
      { name: 'width', type: 'number', required: false, description: 'Width in columns' },
      { name: 'color', type: 'ColorValue', required: false, default: "'foreground'", description: 'Text color' },
      { name: 'showScrollbar', type: 'boolean', required: false, default: 'true', description: 'Show scrollbar' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Enable keyboard scrolling' },
    ],
    examples: [
      `ScrollableText({\n  text: longContent,\n  height: 10,\n  showScrollbar: true,\n})`,
    ],
    relatedComponents: ['ScrollArea', 'LogViewer'],
  },
  {
    name: 'LogViewer',
    category: 'organisms',
    description: 'Auto-scrolling log viewer with line numbers, pattern highlighting, and optional timestamps.',
    props: [
      { name: 'lines', type: 'string[]', required: true, description: 'Array of log lines' },
      { name: 'height', type: 'number', required: true, description: 'Visible height in rows' },
      { name: 'autoScroll', type: 'boolean', required: false, default: 'true', description: 'Auto-scroll to bottom when new lines added' },
      { name: 'showLineNumbers', type: 'boolean', required: false, default: 'false', description: 'Show line numbers' },
      { name: 'highlightPattern', type: 'RegExp', required: false, description: 'Pattern to highlight in log lines' },
      { name: 'highlightColor', type: 'ColorValue', required: false, default: "'yellow'", description: 'Color for highlighted matches' },
      { name: 'isActive', type: 'boolean', required: false, default: 'true', description: 'Enable keyboard scrolling' },
    ],
    examples: [
      `const [logs, setLogs] = useState<string[]>([]);\n\n// Add log line\nsetLogs(l => [...l, \`[\${new Date().toISOString()}] New event\`]);\n\nLogViewer({\n  lines: logs(),\n  height: 15,\n  autoScroll: true,\n  showLineNumbers: true,\n  highlightPattern: /error|warn/i,\n  highlightColor: 'red',\n})`,
    ],
    relatedComponents: ['ScrollArea', 'ScrollableText'],
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
