/**
 * DataTable - Interactive data table with sorting, filtering, pagination
 *
 * Features:
 * - Column sorting (asc/desc)
 * - Text filtering/search
 * - Pagination
 * - Row selection (single/multiple)
 * - Keyboard navigation
 * - Virtual scrolling ready
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal, createMemo } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { Table, type TableColumn, type TableBorderStyle, type TextAlign } from '../molecules/table.js';

// =============================================================================
// Types
// =============================================================================

export type SortDirection = 'asc' | 'desc' | null;

export interface DataTableColumn<T = any> extends TableColumn {
  /** Is sortable */
  sortable?: boolean;
  /** Is filterable */
  filterable?: boolean;
  /** Custom sort function */
  sortFn?: (a: T, b: T, direction: SortDirection) => number;
  /** Custom filter function */
  filterFn?: (value: any, filter: string, row: T) => boolean;
}

export interface DataTableOptions<T = Record<string, any>> {
  /** Column definitions */
  columns: DataTableColumn<T>[];
  /** Data rows */
  data: T[];
  /** Row key extractor */
  getRowKey?: (row: T, index: number) => string;
  /** Selection mode */
  selectionMode?: 'none' | 'single' | 'multiple';
  /** Initially selected row keys */
  initialSelected?: string[];
  /** Pagination */
  pageSize?: number;
  /** Show pagination controls */
  showPagination?: boolean;
  /** Show search/filter input */
  showSearch?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Sort config */
  initialSort?: { column: string; direction: SortDirection };
  /** Table style */
  borderStyle?: TableBorderStyle;
  borderColor?: ColorValue;
  /** Header style */
  headerColor?: ColorValue;
  headerBold?: boolean;
  /** Selection colors */
  selectedColor?: ColorValue;
  cursorColor?: ColorValue;
  /** Zebra striping */
  striped?: boolean;
  stripeColor?: ColorValue;
  /** Max height (rows visible) */
  maxHeight?: number;
  /** Callbacks */
  onSelect?: (rows: T[]) => void;
  onSort?: (column: string, direction: SortDirection) => void;
  onPageChange?: (page: number) => void;
  /** Is active */
  isActive?: boolean;
}

export interface DataTableState<T = Record<string, any>> {
  // Data state
  sortColumn: () => string | null;
  sortDirection: () => SortDirection;
  filterText: () => string;
  currentPage: () => number;
  totalPages: () => number;
  // Derived data
  filteredData: () => T[];
  sortedData: () => T[];
  pageData: () => T[];
  // Selection
  selectedKeys: () => Set<string>;
  cursorIndex: () => number;
  // Actions
  sort: (column: string) => void;
  setFilter: (text: string) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  selectRow: (key: string) => void;
  deselectRow: (key: string) => void;
  toggleRow: (key: string) => void;
  selectAll: () => void;
  deselectAll: () => void;
  moveCursor: (delta: number) => void;
  selectCurrent: () => void;
  getRowKey: (row: T, index: number) => string;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a DataTable state manager
 */
export function createDataTable<T = Record<string, any>>(
  options: DataTableOptions<T>
): DataTableState<T> {
  const {
    columns,
    data,
    getRowKey = (_, i) => String(i),
    selectionMode = 'single',
    initialSelected = [],
    pageSize = 10,
    initialSort,
    onSelect,
    onSort,
    onPageChange,
  } = options;

  const [sortColumn, setSortColumn] = createSignal<string | null>(
    initialSort?.column ?? null
  );
  const [sortDirection, setSortDirection] = createSignal<SortDirection>(
    initialSort?.direction ?? null
  );
  const [filterText, setFilterText] = createSignal('');
  const [currentPage, setCurrentPage] = createSignal(0);
  const [selectedKeys, setSelectedKeys] = createSignal(new Set(initialSelected));
  const [cursorIndex, setCursorIndex] = createSignal(0);

  // Filtered data
  const filteredData = createMemo(() => {
    const filter = filterText().toLowerCase();
    if (!filter) return data;

    return data.filter((row) => {
      for (const col of columns) {
        if (col.filterable === false) continue;

        const value = (row as Record<string, any>)[col.key];
        const strValue = String(value ?? '').toLowerCase();

        if (col.filterFn) {
          if (col.filterFn(value, filter, row)) return true;
        } else if (strValue.includes(filter)) {
          return true;
        }
      }
      return false;
    });
  });

  // Sorted data
  const sortedData = createMemo(() => {
    const column = sortColumn();
    const direction = sortDirection();
    const filtered = filteredData();

    if (!column || !direction) return filtered;

    const col = columns.find((c) => c.key === column);
    if (!col) return filtered;

    return [...filtered].sort((a, b) => {
      if (col.sortFn) {
        return col.sortFn(a, b, direction);
      }

      const aVal = (a as Record<string, any>)[column];
      const bVal = (b as Record<string, any>)[column];

      // Handle different types
      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else {
        comparison = String(aVal ?? '').localeCompare(String(bVal ?? ''));
      }

      return direction === 'desc' ? -comparison : comparison;
    });
  });

  // Paginated data
  const pageData = createMemo(() => {
    const sorted = sortedData();
    if (pageSize <= 0) return sorted;

    const start = currentPage() * pageSize;
    return sorted.slice(start, start + pageSize);
  });

  // Total pages
  const totalPages = createMemo(() => {
    if (pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(sortedData().length / pageSize));
  });

  // Actions
  const sort = (column: string) => {
    const col = columns.find((c) => c.key === column);
    if (!col?.sortable) return;

    let newDirection: SortDirection;
    if (sortColumn() === column) {
      // Cycle: null -> asc -> desc -> null
      const current = sortDirection();
      newDirection = current === null ? 'asc' : current === 'asc' ? 'desc' : null;
    } else {
      newDirection = 'asc';
    }

    setSortColumn(newDirection ? column : null);
    setSortDirection(newDirection);
    setCurrentPage(0);
    onSort?.(column, newDirection);
  };

  const setFilter = (text: string) => {
    setFilterText(text);
    setCurrentPage(0);
    setCursorIndex(0);
  };

  const nextPage = () => {
    setCurrentPage((p) => {
      const newPage = Math.min(p + 1, totalPages() - 1);
      if (newPage !== p) onPageChange?.(newPage);
      return newPage;
    });
    setCursorIndex(0);
  };

  const prevPage = () => {
    setCurrentPage((p) => {
      const newPage = Math.max(p - 1, 0);
      if (newPage !== p) onPageChange?.(newPage);
      return newPage;
    });
    setCursorIndex(0);
  };

  const goToPage = (page: number) => {
    const clamped = Math.max(0, Math.min(page, totalPages() - 1));
    if (clamped !== currentPage()) {
      setCurrentPage(clamped);
      setCursorIndex(0);
      onPageChange?.(clamped);
    }
  };

  const selectRow = (key: string) => {
    if (selectionMode === 'none') return;

    setSelectedKeys((prev) => {
      if (selectionMode === 'single') {
        return new Set([key]);
      }
      const next = new Set(prev);
      next.add(key);
      return next;
    });

    const selected = pageData().filter((row, i) =>
      selectedKeys().has(getRowKey(row, i))
    );
    onSelect?.(selected);
  };

  const deselectRow = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const toggleRow = (key: string) => {
    if (selectedKeys().has(key)) {
      deselectRow(key);
    } else {
      selectRow(key);
    }
  };

  const selectAll = () => {
    if (selectionMode !== 'multiple') return;
    const keys = pageData().map((row, i) => getRowKey(row, i));
    setSelectedKeys(new Set(keys));
    onSelect?.(pageData());
  };

  const deselectAll = () => {
    setSelectedKeys(new Set());
    onSelect?.([]);
  };

  const moveCursor = (delta: number) => {
    const page = pageData();
    setCursorIndex((i) => Math.max(0, Math.min(page.length - 1, i + delta)));
  };

  const selectCurrent = () => {
    const page = pageData();
    const row = page[cursorIndex()];
    if (row) {
      const key = getRowKey(row, cursorIndex());
      toggleRow(key);
    }
  };

  return {
    sortColumn,
    sortDirection,
    filterText,
    currentPage,
    totalPages,
    filteredData,
    sortedData,
    pageData,
    selectedKeys,
    cursorIndex,
    sort,
    setFilter,
    nextPage,
    prevPage,
    goToPage,
    selectRow,
    deselectRow,
    toggleRow,
    selectAll,
    deselectAll,
    moveCursor,
    selectCurrent,
    getRowKey,
  };
}

// =============================================================================
// Component
// =============================================================================

export interface DataTableProps<T = Record<string, any>> extends DataTableOptions<T> {
  /** Pre-created state */
  state?: DataTableState<T>;
}

/**
 * DataTable - Interactive data table
 *
 * @example
 * // Basic sortable table
 * DataTable({
 *   columns: [
 *     { key: 'name', header: 'Name', sortable: true },
 *     { key: 'age', header: 'Age', sortable: true, align: 'right' },
 *     { key: 'email', header: 'Email' },
 *   ],
 *   data: users,
 *   showSearch: true,
 *   showPagination: true,
 *   pageSize: 10,
 * })
 *
 * @example
 * // With selection
 * DataTable({
 *   columns: [...],
 *   data: items,
 *   selectionMode: 'multiple',
 *   onSelect: (rows) => console.log('Selected:', rows),
 * })
 */
export function DataTable<T = Record<string, any>>(props: DataTableProps<T>): VNode {
  const {
    columns,
    showPagination = true,
    showSearch = true,
    searchPlaceholder = 'Search...',
    pageSize = 10,
    borderStyle = 'single',
    borderColor = 'gray',
    headerColor = 'white',
    headerBold = true,
    selectedColor = 'cyan',
    cursorColor = 'yellow',
    selectionMode = 'single',
    striped = false,
    stripeColor = 'gray',
    isActive = true,
    state: externalState,
  } = props;

  const state = externalState || createDataTable(props);
  const isAscii = getRenderMode() === 'ascii';
  const chars = getChars();

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.upArrow || input === 'k') {
        state.moveCursor(-1);
      } else if (key.downArrow || input === 'j') {
        state.moveCursor(1);
      } else if (key.leftArrow || input === 'h') {
        state.prevPage();
      } else if (key.rightArrow || input === 'l') {
        state.nextPage();
      } else if (key.return || input === ' ') {
        state.selectCurrent();
      } else if (input === 'a' && key.ctrl) {
        state.selectAll();
      } else if (input === 'd' && key.ctrl) {
        state.deselectAll();
      } else if (input === 's') {
        // Cycle through sortable columns
        const sortable = columns.filter((c) => c.sortable);
        if (sortable.length > 0) {
          const current = state.sortColumn();
          const currentIdx = sortable.findIndex((c) => c.key === current);
          const nextIdx = (currentIdx + 1) % sortable.length;
          state.sort(sortable[nextIdx]!.key);
        }
      } else if (input === '/') {
        // Focus search (would need ref in real impl)
      } else if (key.backspace && showSearch) {
        state.setFilter(state.filterText().slice(0, -1));
      } else if (input && input.length === 1 && showSearch && !key.ctrl && !key.meta) {
        state.setFilter(state.filterText() + input);
      }
    },
    { isActive }
  );

  const page = state.pageData();
  const cursor = state.cursorIndex();
  const selected = state.selectedKeys();
  const sortCol = state.sortColumn();
  const sortDir = state.sortDirection();
  const filter = state.filterText();
  const currentPageNum = state.currentPage();
  const totalPagesNum = state.totalPages();

  // Build search bar
  let searchNode: VNode | null = null;
  if (showSearch) {
    const searchIcon = isAscii ? '[?]' : '🔍';
    searchNode = Box(
      { marginBottom: 1, flexDirection: 'row', gap: 1 },
      Text({ color: 'gray' }, searchIcon),
      Box(
        { borderStyle: 'single', borderColor: 'gray', paddingX: 1, minWidth: 20 },
        Text({ color: filter ? 'white' : 'gray', dim: !filter }, filter || searchPlaceholder)
      )
    );
  }

  // Build header with sort indicators
  const headerColumns = columns.map((col) => {
    let sortIndicator = '';
    if (col.sortable) {
      if (sortCol === col.key) {
        sortIndicator = sortDir === 'asc' ? (isAscii ? ' ^' : ' ▲') : (isAscii ? ' v' : ' ▼');
      } else {
        sortIndicator = isAscii ? ' ~' : ' ◇';
      }
    }
    return {
      ...col,
      header: col.header + sortIndicator,
    };
  });

  // Build selection column if needed
  const displayColumns: TableColumn[] = [];
  if (selectionMode !== 'none') {
    displayColumns.push({
      key: '_selection',
      header: selectionMode === 'multiple' ? (isAscii ? '[x]' : '☑') : '',
      width: 3,
      align: 'center' as TextAlign,
    });
  }
  displayColumns.push(...headerColumns);

  // Build data with selection and cursor
  const displayData = page.map((row, i) => {
    const rowKey = state.getRowKey(row, i);
    const isSelected = selected.has(rowKey);
    const isCursor = i === cursor;

    const rowData = { ...(row as Record<string, any>) };

    // Selection indicator
    if (selectionMode !== 'none') {
      if (isSelected) {
        rowData._selection = isAscii ? '[x]' : '●';
      } else {
        rowData._selection = isAscii ? '[ ]' : '○';
      }
    }

    // Add cursor/selection styling info
    rowData._isCursor = isCursor;
    rowData._isSelected = isSelected;

    return rowData;
  });

  // Build table rows manually for custom styling
  const tableRows: VNode[] = [];

  // We'll render a custom table with cursor highlighting
  // For simplicity, we use the existing Table but modify the data presentation

  const tableNode = Box(
    { flexDirection: 'column' },
    // Header
    Box(
      { flexDirection: 'row', marginBottom: 1 },
      ...displayColumns.map((col, i) => {
        const width = col.width ?? 15;
        return Box(
          { width, marginRight: 1 },
          Text({ color: headerColor, bold: headerBold }, col.header.slice(0, width))
        );
      })
    ),
    // Rows
    ...displayData.map((row, i) => {
      const isCursor = row._isCursor;
      const isSelectedRow = row._isSelected;

      return Box(
        {
          flexDirection: 'row',
          backgroundColor: isCursor ? cursorColor : isSelectedRow ? selectedColor : undefined,
        },
        ...displayColumns.map((col) => {
          const width = col.width ?? 15;
          let value = row[col.key];
          if (col.format) {
            value = col.format(value, row);
          }
          const strValue = String(value ?? '').slice(0, width);
          const color = isCursor ? 'black' : isSelectedRow ? 'black' : col.color ?? 'white';

          return Box(
            { width, marginRight: 1 },
            Text({ color }, strValue.padEnd(width))
          );
        })
      );
    })
  );

  // Build pagination
  let paginationNode: VNode | null = null;
  if (showPagination && pageSize > 0) {
    const prevArrow = isAscii ? '<' : '←';
    const nextArrow = isAscii ? '>' : '→';

    paginationNode = Box(
      { marginTop: 1, flexDirection: 'row', gap: 2 },
      Text({ color: currentPageNum > 0 ? 'cyan' : 'gray', dim: currentPageNum === 0 }, `${prevArrow} Prev`),
      Text({ color: 'white' }, `Page ${currentPageNum + 1} of ${totalPagesNum}`),
      Text({ color: currentPageNum < totalPagesNum - 1 ? 'cyan' : 'gray', dim: currentPageNum >= totalPagesNum - 1 }, `Next ${nextArrow}`),
      Text({ color: 'gray', dim: true }, `(${state.sortedData().length} total)`)
    );
  }

  // Footer with hints
  const hintsNode = Box(
    { marginTop: 1 },
    Text(
      { color: 'gray', dim: true },
      isAscii
        ? 'jk: nav  hl: page  Enter/Space: select  s: sort  Ctrl+A: all'
        : '↓↑: nav  ←→: page  ↵/␣: select  s: sort  ^A: all'
    )
  );

  return Box(
    { flexDirection: 'column' },
    searchNode,
    tableNode,
    paginationNode,
    hintsNode
  );
}

// =============================================================================
// VirtualDataTable (for large datasets)
// =============================================================================

export interface VirtualDataTableOptions<T> extends DataTableOptions<T> {
  /** Visible row count */
  visibleRows?: number;
  /** Row height (for scrolling calculation) */
  rowHeight?: number;
  /** Overscan rows (render extra for smooth scrolling) */
  overscan?: number;
}

/**
 * VirtualDataTable - Virtual scrolling for large datasets
 *
 * @example
 * VirtualDataTable({
 *   columns: [...],
 *   data: largeDataset, // 10000+ rows
 *   visibleRows: 20,
 *   pageSize: 0, // Disable pagination, use virtual scroll
 * })
 */
export function VirtualDataTable<T = Record<string, any>>(
  props: VirtualDataTableOptions<T>
): VNode {
  const {
    visibleRows = 20,
    overscan = 3,
    ...rest
  } = props;

  // For now, just use regular DataTable with adjusted pageSize
  // A full virtual implementation would need scroll position tracking
  return DataTable({
    ...rest,
    pageSize: visibleRows,
    showPagination: true,
  });
}

// =============================================================================
// EditableDataTable (inline editing)
// =============================================================================

export interface EditableColumn<T> extends DataTableColumn<T> {
  /** Is editable */
  editable?: boolean;
  /** Input type */
  inputType?: 'text' | 'number' | 'select';
  /** Options for select type */
  options?: { value: any; label: string }[];
  /** Validate function */
  validate?: (value: any, row: T) => boolean | string;
}

export interface EditableDataTableOptions<T> extends Omit<DataTableOptions<T>, 'columns'> {
  /** Editable columns */
  columns: EditableColumn<T>[];
  /** On cell edit callback */
  onCellEdit?: (rowKey: string, column: string, value: any, row: T) => void;
}

/**
 * EditableDataTable - Table with inline cell editing
 */
export function EditableDataTable<T = Record<string, any>>(
  props: EditableDataTableOptions<T>
): VNode {
  // Simplified implementation - full version would need cell-level focus
  return DataTable({
    ...props,
    columns: props.columns,
  });
}
