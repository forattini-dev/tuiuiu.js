/**
 * Design System Data Display - Data presentation components
 *
 * Re-exports from canonical sources (molecules/organisms)
 * to maintain consistent API while avoiding code duplication.
 */

// =============================================================================
// Re-exports from Molecules
// =============================================================================

// Table
export {
  Table,
  SimpleTable,
  KeyValueTable,
  type TableBorderStyle,
  type TextAlign,
  type TableColumn,
  type TableOptions,
} from '../../molecules/table.js';

// Code Block
export {
  CodeBlock,
  InlineCode,
  type Language,
  type CodeTheme,
  type CodeBlockOptions,
} from '../../molecules/code-block.js';

// Markdown
export {
  Markdown,
  renderMarkdown,
  type MarkdownOptions,
} from '../../molecules/markdown.js';

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
} from '../../molecules/tree.js';

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
} from '../../molecules/calendar.js';

// =============================================================================
// Re-exports from Organisms
// =============================================================================

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
} from '../../organisms/data-table.js';
