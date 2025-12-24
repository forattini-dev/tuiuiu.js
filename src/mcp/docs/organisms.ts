/**
 * Organisms Documentation
 */

import type { ComponentDoc } from '../types.js';

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
];
