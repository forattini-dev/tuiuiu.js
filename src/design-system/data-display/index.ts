/**
 * Design System Data Display - Data presentation components
 */

// Table
export {
  Table,
  SimpleTable,
  KeyValueTable,
  type TableBorderStyle,
  type TextAlign,
  type TableColumn,
  type TableOptions,
} from './table.js';

// Code Block
export {
  CodeBlock,
  InlineCode,
  type Language,
  type CodeTheme,
  type CodeBlockOptions,
} from './code-block.js';

// Markdown (advanced)
export {
  Markdown,
  renderMarkdown,
  type MarkdownOptions,
} from './markdown.js';

// Tree
export {
  createTree,
  Tree,
  DirectoryTree,
  type TreeNode,
  type TreeOptions,
  type TreeState,
  type TreeProps,
  type FlattenedNode,
  type DirectoryNode,
  type DirectoryTreeOptions,
} from './tree.js';

// Calendar
export {
  createCalendar,
  Calendar,
  MiniCalendar,
  createDatePicker,
  DatePicker,
  type CalendarEvent,
  type CalendarOptions,
  type CalendarState,
  type CalendarDay,
  type CalendarProps,
  type MiniCalendarOptions,
  type DatePickerOptions,
  type DatePickerState,
} from './calendar.js';

// DataTable (interactive)
export {
  createDataTable,
  DataTable,
  VirtualDataTable,
  EditableDataTable,
  type SortDirection,
  type DataTableColumn,
  type DataTableOptions,
  type DataTableState,
  type DataTableProps,
  type VirtualDataTableOptions,
  type EditableColumn,
  type EditableDataTableOptions,
} from './data-table.js';
