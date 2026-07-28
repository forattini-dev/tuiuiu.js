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
import { useFactoryState } from '../hooks/factory-state.js';
import { warnOnce } from '../core/dev-warnings.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { Table, type TableColumn, type TableBorderStyle, type TextAlign, calculateColumnWidths, getTerminalWidth } from '../molecules/table.js';

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
  colorHeader?: ColorValue;
  headerBold?: boolean;
  /** Selection colors */
  colorSelected?: ColorValue;
  colorCursor?: ColorValue;
  /** Zebra striping */
  striped?: boolean;
  colorStripe?: ColorValue;
  /** Max height (rows visible) */
  maxHeight?: number;
  /**
   * Available width for the table. Flex columns will expand to fill this space.
   * If not provided, defaults to process.stdout.columns or 80.
   */
  availableWidth?: number;
  /** Callbacks */
  onSelect?: (rows: T[]) => void;
  onSort?: (column: string, direction: SortDirection) => void;
  onPageChange?: (page: number) => void;
  /** Called when the keyboard cursor changes (index within the active page). */
  onCursorChange?: (index: number) => void;
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
  updateOptions: (options: DataTableOptions<T>) => void;
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
  let runtimeOptions = options;
  const [optionsVersion, setOptionsVersion] = createSignal(0);

  const [sortColumn, setSortColumn] = createSignal<string | null>(
    options.initialSort?.column ?? null
  );
  const [sortDirection, setSortDirection] = createSignal<SortDirection>(
    options.initialSort?.direction ?? null
  );
  const [filterText, setFilterText] = createSignal('');
  const [currentPage, setCurrentPage] = createSignal(0);
  const [selectedKeys, setSelectedKeys] = createSignal(new Set(options.initialSelected ?? []));
  const [cursorIndex, setCursorIndex] = createSignal(0);

  // Filtered data
  const filteredData = createMemo(() => {
    optionsVersion();
    const filter = filterText().toLowerCase();
    const data = runtimeOptions.data;
    const columns = runtimeOptions.columns;
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
    optionsVersion();
    const column = sortColumn();
    const direction = sortDirection();
    const filtered = filteredData();
    const columns = runtimeOptions.columns;

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
    optionsVersion();
    const sorted = sortedData();
    const pageSize = runtimeOptions.pageSize ?? 10;
    if (pageSize <= 0) return sorted;

    const start = currentPage() * pageSize;
    return sorted.slice(start, start + pageSize);
  });

  // Total pages
  const totalPages = createMemo(() => {
    optionsVersion();
    const pageSize = runtimeOptions.pageSize ?? 10;
    if (pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(sortedData().length / pageSize));
  });

  // Actions
  const sort = (column: string) => {
    const col = runtimeOptions.columns.find((c) => c.key === column);
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
    runtimeOptions.onSort?.(column, newDirection);
  };

  const setFilter = (text: string) => {
    setFilterText(text);
    setCurrentPage(0);
    setCursorIndex(0);
    runtimeOptions.onCursorChange?.(0);
  };

  const nextPage = () => {
    setCurrentPage((p) => {
      const newPage = Math.min(p + 1, totalPages() - 1);
      if (newPage !== p) runtimeOptions.onPageChange?.(newPage);
      return newPage;
    });
    setCursorIndex(0);
    runtimeOptions.onCursorChange?.(0);
  };

  const prevPage = () => {
    setCurrentPage((p) => {
      const newPage = Math.max(p - 1, 0);
      if (newPage !== p) runtimeOptions.onPageChange?.(newPage);
      return newPage;
    });
    setCursorIndex(0);
    runtimeOptions.onCursorChange?.(0);
  };

  const goToPage = (page: number) => {
    const clamped = Math.max(0, Math.min(page, totalPages() - 1));
    if (clamped !== currentPage()) {
      setCurrentPage(clamped);
      setCursorIndex(0);
      runtimeOptions.onCursorChange?.(0);
      runtimeOptions.onPageChange?.(clamped);
    }
  };

  const getPageStartIndex = () => {
    const pageSize = runtimeOptions.pageSize ?? 10;
    return pageSize > 0 ? currentPage() * pageSize : 0;
  };

  const selectRow = (key: string) => {
    const selectionMode = runtimeOptions.selectionMode ?? 'single';
    if (selectionMode === 'none') return;

    // Compute new keys directly to avoid stale signal read
    const prevKeys = selectedKeys();
    const newKeys = selectionMode === 'single'
      ? new Set([key])
      : new Set([...prevKeys, key]);
    setSelectedKeys(newKeys);

    // Use the known new keys for onSelect (not the signal which may be stale)
    const pageStart = getPageStartIndex();
    const selected = pageData().filter((row, i) =>
      newKeys.has(getRowKey(row, pageStart + i))
    );
    runtimeOptions.onSelect?.(selected);
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
    const selectionMode = runtimeOptions.selectionMode ?? 'single';
    if (selectionMode !== 'multiple') return;
    const pageStart = getPageStartIndex();
    const keys = pageData().map((row, i) => getRowKey(row, pageStart + i));
    setSelectedKeys(new Set(keys));
    runtimeOptions.onSelect?.(pageData());
  };

  const deselectAll = () => {
    setSelectedKeys(new Set());
    runtimeOptions.onSelect?.([]);
  };

  const moveCursor = (delta: number) => {
    const page = pageData();
    const previous = cursorIndex();
    const next = Math.max(0, Math.min(Math.max(0, page.length - 1), previous + delta));
    setCursorIndex(next);
    if (next !== previous) {
      runtimeOptions.onCursorChange?.(next);
    }
  };

  const selectCurrent = () => {
    const page = pageData();
    const row = page[cursorIndex()];
    if (row) {
      const key = getRowKey(row, getPageStartIndex() + cursorIndex());
      toggleRow(key);
    }
  };

  const getRowKey = (row: T, index: number) =>
    (runtimeOptions.getRowKey ?? ((_: T, i: number) => String(i)))(row, index);

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
    updateOptions: (nextOptions: DataTableOptions<T>) => {
      runtimeOptions = nextOptions;
      setOptionsVersion((version) => version + 1);
      const maxPage = Math.max(0, totalPages() - 1);
      if (currentPage() > maxPage) {
        setCurrentPage(maxPage);
      }
      const maxCursor = Math.max(0, pageData().length - 1);
      if (cursorIndex() > maxCursor) {
        setCursorIndex(maxCursor);
        runtimeOptions.onCursorChange?.(maxCursor);
      }
    },
  };
}

export function useDataTableState<T = Record<string, any>>(options: DataTableOptions<T>) {
  return useFactoryState<DataTableOptions<T>, DataTableState<T>>(undefined, options, createDataTable);
}

// =============================================================================
// Component
// =============================================================================

export interface DataTableProps<T = Record<string, any>> extends DataTableOptions<T> {
  /** Pre-created state */
  state?: DataTableState<T>;
  /**
   * Render only a window of the active page while keeping cursor and selection
   * indices relative to the full page.
   *
   * @internal Prefer VirtualDataTable unless composing a custom virtualizer.
   */
  viewport?: {
    start: number;
    size: number;
    overscan?: number;
    rowHeight?: number;
  };
  /** @internal The owner already synchronized the external state options. */
  stateOptionsManaged?: boolean;
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
    borderColor = 'border',
    colorHeader = 'foreground',
    headerBold = true,
    colorSelected = 'primary',
    colorCursor = 'warning',
    selectionMode = 'single',
    striped = false,
    colorStripe = 'mutedForeground',
    isActive = true,
    availableWidth,
    state: externalState,
    viewport,
    stateOptionsManaged = false,
  } = props;

  const state = externalState && stateOptionsManaged
    ? externalState
    : useFactoryState(externalState, props, createDataTable);
  const isAscii = getRenderMode() === 'ascii';
  const chars = getChars();

  // Setup keyboard handling
  // When search has text, single-char input goes to search (not vim nav).
  // Arrow keys always work for navigation regardless of search state.
  useInput(
    (input, key) => {
      const isSearching = showSearch && state.filterText().length > 0;

      // Arrow keys: always navigate (regardless of search)
      if (key.upArrow) {
        state.moveCursor(-1);
      } else if (key.downArrow) {
        state.moveCursor(1);
      } else if (key.leftArrow) {
        state.prevPage();
      } else if (key.rightArrow) {
        state.nextPage();
      } else if (key.return || input === ' ') {
        state.selectCurrent();
      } else if (input === 'a' && key.ctrl) {
        state.selectAll();
      } else if (input === 'd' && key.ctrl) {
        state.deselectAll();
      } else if (key.backspace && showSearch) {
        state.setFilter(state.filterText().slice(0, -1));
      } else if (isSearching && input && input.length === 1 && !key.ctrl && !key.meta) {
        // When actively searching: all chars go to search filter
        state.setFilter(state.filterText() + input);
      } else if (!isSearching && (input === 'k')) {
        state.moveCursor(-1);
      } else if (!isSearching && (input === 'j')) {
        state.moveCursor(1);
      } else if (!isSearching && (input === 'h')) {
        state.prevPage();
      } else if (!isSearching && (input === 'l')) {
        state.nextPage();
      } else if (!isSearching && input === 's') {
        const sortable = columns.filter((c) => c.sortable);
        if (sortable.length > 0) {
          const current = state.sortColumn();
          const currentIdx = sortable.findIndex((c) => c.key === current);
          const nextIdx = (currentIdx + 1) % sortable.length;
          state.sort(sortable[nextIdx]!.key);
        }
      } else if (input && input.length === 1 && showSearch && !key.ctrl && !key.meta) {
        // Start searching with first char
        state.setFilter(state.filterText() + input);
      }
    },
    { isActive }
  );

  const fullPage = state.pageData();
  const viewportStart = viewport
    ? Math.max(0, Math.min(Math.trunc(viewport.start), fullPage.length))
    : 0;
  const viewportSize = viewport
    ? Math.max(0, Math.trunc(viewport.size))
    : fullPage.length;
  const viewportEnd = Math.min(fullPage.length, viewportStart + viewportSize);
  const overscan = viewport ? Math.max(0, Math.trunc(viewport.overscan ?? 0)) : 0;
  const measurementStart = Math.max(0, viewportStart - overscan);
  const measurementEnd = Math.min(fullPage.length, viewportEnd + overscan);
  const page = fullPage.slice(viewportStart, viewportEnd);
  const measurementPage = fullPage.slice(measurementStart, measurementEnd);
  const cursor = state.cursorIndex();
  const selected = state.selectedKeys();
  const sortCol = state.sortColumn();
  const sortDir = state.sortDirection();
  const filter = state.filterText();
  const currentPageNum = state.currentPage();
  const totalPagesNum = state.totalPages();
  const pageStartIndex = pageSize > 0 ? currentPageNum * pageSize : 0;

  // Build search bar
  let searchNode: VNode | null = null;
  if (showSearch) {
    const searchIcon = isAscii ? '[?]' : '🔍';
    searchNode = Box(
      { marginBottom: 1, flexDirection: 'row', gap: 1 },
      Text({ color: 'mutedForeground' }, searchIcon),
      Box(
        { borderStyle: 'single', borderColor: 'border', paddingX: 1, minWidth: 20 },
        Text({ color: filter ? 'foreground' : 'mutedForeground', dim: !filter }, filter || searchPlaceholder)
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

  // Calculate column widths (supports flex columns)
  const effectiveAvailableWidth = availableWidth ?? getTerminalWidth();
  const columnWidths = calculateColumnWidths(
    displayColumns,
    measurementPage as Record<string, any>[],
    undefined, // maxWidth
    0,         // padding (we handle marginRight separately)
    effectiveAvailableWidth
  );

  // Build data with selection and cursor
  const displayData = page.map((row, i) => {
    const pageIndex = viewportStart + i;
    const rowKey = state.getRowKey(row, pageStartIndex + pageIndex);
    const isSelected = selected.has(rowKey);
    const isCursor = pageIndex === cursor;

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
        const width = columnWidths[i] ?? 15;
        return Box(
          { width, marginRight: 1 },
          Text({ color: colorHeader, bold: headerBold }, col.header.slice(0, width))
        );
      })
    ),
    // Rows
    ...displayData.map((row, rowIdx) => {
      const isCursor = row._isCursor;
      const isSelectedRow = row._isSelected;

      return Box(
        {
          flexDirection: 'row',
          height: viewport?.rowHeight,
          backgroundColor: isCursor ? colorCursor : isSelectedRow ? colorSelected : undefined,
        },
        ...displayColumns.map((col, colIdx) => {
          const width = columnWidths[colIdx] ?? 15;
          let value = row[col.key];
          if (col.format) {
            value = col.format(value, row);
          }
          const strValue = String(value ?? '').slice(0, width);
          const color = isCursor ? 'background' : isSelectedRow ? 'background' : col.color ?? 'foreground';

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
      Text({ color: currentPageNum > 0 ? 'primary' : 'mutedForeground', dim: currentPageNum === 0 }, `${prevArrow} Prev`),
      Text({ color: 'foreground' }, `Page ${currentPageNum + 1} of ${totalPagesNum}`),
      Text({ color: currentPageNum < totalPagesNum - 1 ? 'primary' : 'mutedForeground', dim: currentPageNum >= totalPagesNum - 1 }, `Next ${nextArrow}`),
      Text({ color: 'mutedForeground', dim: true }, `(${state.sortedData().length} total)`)
    );
  }

  // Footer with hints
  const hintsNode = Box(
    { marginTop: 1 },
    Text(
      { color: 'mutedForeground', dim: true },
      viewport
        ? `${fullPage.length === 0 ? 0 : viewportStart + 1}-${viewportEnd} / ${fullPage.length} rows  ` +
          (isAscii
            ? 'jk: nav  Enter/Space: select  s: sort  Ctrl+A: all'
            : '↓↑: nav  ↵/␣: select  s: sort  ^A: all')
        : isAscii
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
  /** Fixed height of each rendered row */
  rowHeight?: number;
  /** Extra rows sampled above and below the viewport for stable width measurement */
  overscan?: number;
  /** Initial logical row at the top of the viewport */
  initialScrollOffset?: number;
  /** Pre-created virtual table state */
  state?: VirtualDataTableState<T>;
  /** Called when the logical scroll offset changes */
  onScroll?: (offset: number) => void;
}

export interface VirtualDataTableRange {
  /** First visible row (inclusive). */
  start: number;
  /** Last visible row (exclusive). */
  end: number;
  /** First row sampled for measurement (inclusive). */
  overscanStart: number;
  /** Last row sampled for measurement (exclusive). */
  overscanEnd: number;
}

export interface VirtualDataTableState<T = Record<string, any>> {
  /** Full DataTable controller. Its pageSize is always zero. */
  tableState: DataTableState<T>;
  /** Logical row at the top of the viewport. */
  scrollOffset: () => number;
  /** Current visible and overscan ranges. */
  visibleRange: () => VirtualDataTableRange;
  /** Scroll so the requested row is at the top when possible. */
  scrollTo: (index: number) => void;
  /** Scroll by a number of logical rows. */
  scrollBy: (delta: number) => void;
  /** Make a cursor index visible without moving it unnecessarily. */
  ensureCursorVisible: (index: number) => void;
  /** Synchronize changing component options while preserving state. */
  updateOptions: (options: VirtualDataTableOptions<T>) => void;
}

function finiteInteger(value: number | undefined, fallback: number, minimum: number): number {
  return Number.isFinite(value)
    ? Math.max(minimum, Math.trunc(value!))
    : fallback;
}

/**
 * Create an imperative virtual DataTable controller.
 *
 * The underlying DataTable always owns the complete filtered/sorted dataset.
 * Only rendering is windowed, so cursor, selection, sorting and filtering keep
 * stable global row indices.
 */
export function createVirtualDataTable<T = Record<string, any>>(
  options: VirtualDataTableOptions<T>
): VirtualDataTableState<T> {
  let runtimeOptions = options;
  let tableState!: DataTableState<T>;
  const [optionsVersion, setOptionsVersion] = createSignal(0);

  const initialVisibleRows = finiteInteger(options.visibleRows, 20, 1);
  const initialMaxOffset = Math.max(0, options.data.length - initialVisibleRows);
  const initialOffset = Math.min(
    finiteInteger(options.initialScrollOffset, 0, 0),
    initialMaxOffset
  );
  const [scrollOffset, setScrollOffset] = createSignal(initialOffset);

  const visibleRows = () => {
    optionsVersion();
    return finiteInteger(runtimeOptions.visibleRows, 20, 1);
  };

  const overscanRows = () => {
    optionsVersion();
    return finiteInteger(runtimeOptions.overscan, 3, 0);
  };

  const maxScrollOffset = () =>
    Math.max(0, tableState.pageData().length - visibleRows());

  const scrollTo = (index: number) => {
    const previous = scrollOffset();
    const normalized = Number.isFinite(index) ? Math.trunc(index) : previous;
    const next = Math.max(0, Math.min(normalized, maxScrollOffset()));
    if (next === previous) return;
    setScrollOffset(next);
    runtimeOptions.onScroll?.(next);
  };

  const ensureCursorVisible = (index: number) => {
    const offset = scrollOffset();
    const count = visibleRows();
    if (index < offset) {
      scrollTo(index);
    } else if (index >= offset + count) {
      scrollTo(index - count + 1);
    }
  };

  const toDataTableOptions = (
    next: VirtualDataTableOptions<T>
  ): DataTableOptions<T> => {
    const {
      visibleRows: _visibleRows,
      rowHeight: _rowHeight,
      overscan: _overscan,
      initialScrollOffset: _initialScrollOffset,
      state: _state,
      onScroll: _onScroll,
      onCursorChange,
      ...dataTableOptions
    } = next;

    return {
      ...dataTableOptions,
      pageSize: 0,
      showPagination: false,
      onCursorChange: (index) => {
        ensureCursorVisible(index);
        onCursorChange?.(index);
      },
    };
  };

  tableState = createDataTable(toDataTableOptions(options));

  const state: VirtualDataTableState<T> = {
    tableState,
    scrollOffset,
    visibleRange: () => {
      optionsVersion();
      const total = tableState.pageData().length;
      const start = Math.min(scrollOffset(), Math.max(0, total - visibleRows()));
      const end = Math.min(total, start + visibleRows());
      const overscan = overscanRows();
      return {
        start,
        end,
        overscanStart: Math.max(0, start - overscan),
        overscanEnd: Math.min(total, end + overscan),
      };
    },
    scrollTo,
    scrollBy: (delta) => {
      const normalized = Number.isFinite(delta) ? Math.trunc(delta) : 0;
      scrollTo(scrollOffset() + normalized);
    },
    ensureCursorVisible,
    updateOptions: (next) => {
      runtimeOptions = next;
      setOptionsVersion((version) => version + 1);
      tableState.updateOptions(toDataTableOptions(next));
      scrollTo(scrollOffset());
    },
  };

  return state;
}

/**
 * VirtualDataTable - Virtual scrolling for large datasets
 *
 * @example
 * VirtualDataTable({
 *   columns: [...],
 *   data: largeDataset, // 10000+ rows
 *   visibleRows: 20,
 *   overscan: 3,
 * })
 */
export function VirtualDataTable<T = Record<string, any>>(
  props: VirtualDataTableOptions<T>
): VNode {
  const {
    visibleRows: requestedVisibleRows = 20,
    rowHeight: requestedRowHeight = 1,
    overscan = 3,
    initialScrollOffset: _initialScrollOffset,
    onScroll: _onScroll,
    state: externalState,
    ...dataTableProps
  } = props;
  const state = useFactoryState(externalState, props, createVirtualDataTable);
  const visibleRows = finiteInteger(requestedVisibleRows, 20, 1);
  const rowHeight = finiteInteger(requestedRowHeight, 1, 1);
  const range = state.visibleRange();

  return DataTable({
    ...dataTableProps,
    pageSize: 0,
    showPagination: false,
    state: state.tableState,
    stateOptionsManaged: true,
    viewport: {
      start: range.start,
      size: visibleRows,
      overscan,
      rowHeight,
    },
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
  warnOnce(
    'editable-data-table-stub',
    'EditableDataTable is not yet fully implemented — it renders a read-only DataTable. ' +
    'Inline cell editing will be added in a future release.',
  );

  return DataTable({
    ...props,
    columns: props.columns,
  });
}
