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
import { getChars, getRenderMode } from '../core/capabilities.js';
import {
  clampToGraphemeBoundary,
  nextGraphemeBoundary,
  previousGraphemeBoundary,
} from '../utils/grapheme.js';
import { stringWidth } from '../utils/text-utils.js';
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
  /** @internal Cell focus supplied by higher-level table variants. */
  cellFocus?: {
    rowKey: string;
    column: string;
    editing?: boolean;
    value?: string;
    cursorPosition?: number;
  } | null;
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
    cellFocus = null,
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

    return {
      row: rowData,
      rowKey,
      isCursor,
      isSelected,
    };
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
    ...displayData.map(({ row, rowKey, isCursor, isSelected: isSelectedRow }) => {
      return Box(
        {
          flexDirection: 'row',
          height: viewport?.rowHeight,
          backgroundColor: isCursor ? colorCursor : isSelectedRow ? colorSelected : undefined,
        },
        ...displayColumns.map((col, colIdx) => {
          const width = columnWidths[colIdx] ?? 15;
          let value = row[col.key];
          const isFocusedCell =
            cellFocus?.rowKey === rowKey &&
            cellFocus.column === col.key;
          if (isFocusedCell && cellFocus.editing) {
            const draft = cellFocus.value ?? '';
            const cursorPosition = clampToGraphemeBoundary(
              draft,
              cellFocus.cursorPosition ?? draft.length,
            );
            const cursorGlyph = isAscii ? '|' : '│';
            value =
              draft.slice(0, cursorPosition) +
              cursorGlyph +
              draft.slice(cursorPosition);
          } else if (col.format) {
            value = col.format(value, row);
          }
          const strValue = String(value ?? '').slice(0, width);
          const color = isCursor ? 'background' : isSelectedRow ? 'background' : col.color ?? 'foreground';

          return Box(
            { width, marginRight: 1 },
            Text(
              {
                color,
                inverse: isFocusedCell,
                underline: isFocusedCell && !cellFocus?.editing,
              },
              strValue.padEnd(width),
            )
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
  /** Pre-created editable table state */
  state?: EditableDataTableState<T>;
  /** On cell edit callback */
  onCellEdit?: (rowKey: string, column: string, value: any, row: T) => void;
}

export interface EditableDataTableCell {
  rowKey: string;
  column: string;
}

export interface EditableDataTableState<T = Record<string, any>> {
  /** Underlying table controller for sorting, filtering, selection, and rows. */
  tableState: DataTableState<T>;
  /** Index in the complete columns array, or -1 when no column is editable. */
  activeColumnIndex: () => number;
  /** Key of the active editable column. */
  activeColumn: () => string | null;
  /** Row key under the keyboard cursor. */
  activeRowKey: () => string | null;
  /** Cell captured when editing began. */
  editingCell: () => EditableDataTableCell | null;
  /** Whether input is currently editing a cell. */
  isEditing: () => boolean;
  /** String representation shown in the inline editor. */
  draftValue: () => string;
  /** UTF-16 cursor offset, always aligned to a grapheme boundary. */
  cursorPosition: () => number;
  /** Current validation error, if any. */
  validationError: () => string | null;
  /** Move focus through editable columns, wrapping at the edges. */
  moveColumn: (delta: number) => void;
  /** Move the table cursor and cancel any active edit. */
  moveRow: (delta: number) => void;
  /** Begin editing the active cell. */
  startEditing: () => boolean;
  /** Discard the draft and leave edit mode. */
  cancelEditing: () => void;
  /** Validate, emit onCellEdit, and leave edit mode on success. */
  commitEditing: () => boolean;
  /** Replace the draft and move the cursor to its end. */
  setDraftValue: (value: string) => void;
  /** Insert text at the current grapheme-safe cursor. */
  insertText: (value: string) => void;
  /** Delete the grapheme before the cursor. */
  backspace: () => void;
  /** Delete the grapheme after the cursor. */
  deleteForward: () => void;
  /** Move the editor cursor without entering a grapheme cluster. */
  moveEditCursor: (direction: 'left' | 'right' | 'home' | 'end') => void;
  /** Cycle a select editor by a signed delta. */
  moveSelectOption: (delta: number) => void;
  /** Synchronize changing component options while preserving the controller. */
  updateOptions: (options: EditableDataTableOptions<T>) => void;
}

interface EditableRowContext<T> {
  row: T;
  rowKey: string;
}

function stripInlineControls(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f-\u009f]/g, '');
}

/**
 * Create an imperative controller for inline table editing.
 *
 * Data remains controlled by the caller. A successful commit invokes
 * `onCellEdit`; the parent supplies the updated `data` on its next render.
 */
export function createEditableDataTable<T = Record<string, any>>(
  options: EditableDataTableOptions<T>
): EditableDataTableState<T> {
  let runtimeOptions = options;
  let capturedRow: T | null = null;
  const [optionsVersion, setOptionsVersion] = createSignal(0);

  const toDataTableOptions = (
    next: EditableDataTableOptions<T>
  ): DataTableOptions<T> => {
    const {
      state: _state,
      onCellEdit: _onCellEdit,
      ...tableOptions
    } = next;
    return tableOptions;
  };

  const tableState = createDataTable(toDataTableOptions(options));
  const firstEditableColumn = () =>
    runtimeOptions.columns.findIndex((column) => column.editable);
  const [activeColumnIndex, setActiveColumnIndex] = createSignal(
    firstEditableColumn(),
  );
  const [editingCell, setEditingCell] =
    createSignal<EditableDataTableCell | null>(null);
  const [draftValue, setDraft] = createSignal('');
  const [cursorPosition, setCursorPosition] = createSignal(0);
  const [validationError, setValidationError] =
    createSignal<string | null>(null);
  const [selectedOptionIndex, setSelectedOptionIndex] = createSignal(-1);

  const editableColumnIndices = (): number[] => {
    optionsVersion();
    const indices: number[] = [];
    runtimeOptions.columns.forEach((column, index) => {
      if (column.editable) indices.push(index);
    });
    return indices;
  };

  const activeColumn = (): string | null => {
    optionsVersion();
    return runtimeOptions.columns[activeColumnIndex()]?.key ?? null;
  };

  const getActiveRow = (): EditableRowContext<T> | null => {
    const rowIndex = tableState.cursorIndex();
    const row = tableState.pageData()[rowIndex];
    if (row === undefined) return null;
    const pageSize = runtimeOptions.pageSize ?? 10;
    const globalIndex =
      (pageSize > 0 ? tableState.currentPage() * pageSize : 0) + rowIndex;
    return {
      row,
      rowKey: tableState.getRowKey(row, globalIndex),
    };
  };

  const activeRowKey = () => getActiveRow()?.rowKey ?? null;

  const cancelEditing = () => {
    capturedRow = null;
    setEditingCell(null);
    setDraft('');
    setCursorPosition(0);
    setSelectedOptionIndex(-1);
    setValidationError(null);
  };

  const setDraftValue = (value: string) => {
    const cleanValue = stripInlineControls(value);
    setDraft(cleanValue);
    setCursorPosition(cleanValue.length);
    setValidationError(null);
  };

  const startEditing = (): boolean => {
    const rowContext = getActiveRow();
    const column = runtimeOptions.columns[activeColumnIndex()];
    if (!rowContext || !column?.editable) return false;

    const rawValue = (rowContext.row as Record<string, any>)[column.key];
    let displayValue = String(rawValue ?? '');
    let optionIndex = -1;
    if (column.inputType === 'select') {
      const choices = column.options ?? [];
      optionIndex = choices.findIndex((option) => Object.is(option.value, rawValue));
      if (optionIndex < 0 && choices.length > 0) optionIndex = 0;
      displayValue = choices[optionIndex]?.label ?? '';
    }

    capturedRow = rowContext.row;
    setEditingCell({
      rowKey: rowContext.rowKey,
      column: column.key,
    });
    setDraft(displayValue);
    setCursorPosition(displayValue.length);
    setSelectedOptionIndex(optionIndex);
    setValidationError(null);
    return true;
  };

  const resolveCandidateValue = (
    column: EditableColumn<T>,
  ): { ok: true; value: any } | { ok: false; error: string } => {
    if (column.inputType === 'number') {
      const draft = draftValue().trim();
      if (draft.length === 0) {
        return { ok: false, error: 'Enter a valid number' };
      }
      const numberValue = Number(draft);
      if (!Number.isFinite(numberValue)) {
        return { ok: false, error: 'Enter a valid number' };
      }
      return { ok: true, value: numberValue };
    }

    if (column.inputType === 'select') {
      const option = column.options?.[selectedOptionIndex()];
      return option
        ? { ok: true, value: option.value }
        : { ok: false, error: 'Select an available option' };
    }

    return { ok: true, value: draftValue() };
  };

  const commitEditing = (): boolean => {
    const cell = editingCell();
    const row = capturedRow;
    const column = runtimeOptions.columns.find(
      (candidate) => candidate.key === cell?.column,
    );
    if (!cell || !row || !column?.editable) {
      cancelEditing();
      return false;
    }

    const candidate = resolveCandidateValue(column);
    if (candidate.ok === false) {
      setValidationError(candidate.error);
      return false;
    }

    if (column.validate) {
      try {
        const result = column.validate(candidate.value, row);
        if (result !== true) {
          setValidationError(
            typeof result === 'string' ? result : 'Invalid value',
          );
          return false;
        }
      } catch (error) {
        setValidationError(
          error instanceof Error && error.message
            ? error.message
            : 'Validation failed',
        );
        return false;
      }
    }

    runtimeOptions.onCellEdit?.(
      cell.rowKey,
      column.key,
      candidate.value,
      row,
    );
    cancelEditing();
    return true;
  };

  const moveColumn = (delta: number) => {
    if (editingCell()) return;
    const indices = editableColumnIndices();
    if (indices.length === 0) {
      setActiveColumnIndex(-1);
      return;
    }
    const currentPosition = Math.max(
      0,
      indices.indexOf(activeColumnIndex()),
    );
    const normalizedDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
    const nextPosition =
      ((currentPosition + normalizedDelta) % indices.length + indices.length) %
      indices.length;
    setActiveColumnIndex(indices[nextPosition]!);
  };

  const moveRow = (delta: number) => {
    cancelEditing();
    tableState.moveCursor(delta);
  };

  const insertText = (value: string) => {
    const cell = editingCell();
    if (!cell) return;
    const column = runtimeOptions.columns.find(
      (candidate) => candidate.key === cell.column,
    );
    if (column?.inputType === 'select') return;
    const cleanValue = stripInlineControls(value);
    if (!cleanValue) return;
    const draft = draftValue();
    const cursor = clampToGraphemeBoundary(draft, cursorPosition());
    const next = draft.slice(0, cursor) + cleanValue + draft.slice(cursor);
    setDraft(next);
    setCursorPosition(cursor + cleanValue.length);
    setValidationError(null);
  };

  const backspace = () => {
    const draft = draftValue();
    const cursor = clampToGraphemeBoundary(draft, cursorPosition());
    const previous = previousGraphemeBoundary(draft, cursor);
    if (previous === cursor) return;
    setDraft(draft.slice(0, previous) + draft.slice(cursor));
    setCursorPosition(previous);
    setValidationError(null);
  };

  const deleteForward = () => {
    const draft = draftValue();
    const cursor = clampToGraphemeBoundary(draft, cursorPosition());
    const next = nextGraphemeBoundary(draft, cursor);
    if (next === cursor) return;
    setDraft(draft.slice(0, cursor) + draft.slice(next));
    setValidationError(null);
  };

  const moveEditCursor = (
    direction: 'left' | 'right' | 'home' | 'end',
  ) => {
    const draft = draftValue();
    const cursor = clampToGraphemeBoundary(draft, cursorPosition());
    if (direction === 'home') {
      setCursorPosition(0);
    } else if (direction === 'end') {
      setCursorPosition(draft.length);
    } else if (direction === 'left') {
      setCursorPosition(previousGraphemeBoundary(draft, cursor));
    } else {
      setCursorPosition(nextGraphemeBoundary(draft, cursor));
    }
  };

  const moveSelectOption = (delta: number) => {
    const cell = editingCell();
    const column = runtimeOptions.columns.find(
      (candidate) => candidate.key === cell?.column,
    );
    const choices = column?.options ?? [];
    if (column?.inputType !== 'select' || choices.length === 0) return;
    const current = Math.max(0, selectedOptionIndex());
    const normalizedDelta = Number.isFinite(delta) ? Math.trunc(delta) : 0;
    const next =
      ((current + normalizedDelta) % choices.length + choices.length) %
      choices.length;
    setSelectedOptionIndex(next);
    setDraft(choices[next]!.label);
    setCursorPosition(choices[next]!.label.length);
    setValidationError(null);
  };

  return {
    tableState,
    activeColumnIndex,
    activeColumn,
    activeRowKey,
    editingCell,
    isEditing: () => editingCell() !== null,
    draftValue,
    cursorPosition,
    validationError,
    moveColumn,
    moveRow,
    startEditing,
    cancelEditing,
    commitEditing,
    setDraftValue,
    insertText,
    backspace,
    deleteForward,
    moveEditCursor,
    moveSelectOption,
    updateOptions: (next) => {
      runtimeOptions = next;
      setOptionsVersion((version) => version + 1);
      tableState.updateOptions(toDataTableOptions(next));

      const indices = editableColumnIndices();
      const currentCell = editingCell();
      if (!indices.includes(activeColumnIndex())) {
        setActiveColumnIndex(indices[0] ?? -1);
        cancelEditing();
      } else if (
        currentCell &&
        (
          activeRowKey() !== currentCell.rowKey ||
          !runtimeOptions.columns.some(
            (column) =>
              column.key === currentCell.column &&
              column.editable,
          )
        )
      ) {
        cancelEditing();
      }
    },
  };
}

/**
 * EditableDataTable - Table with inline cell editing
 */
export function EditableDataTable<T = Record<string, any>>(
  props: EditableDataTableOptions<T>
): VNode {
  const {
    state: externalState,
    onCellEdit: _onCellEdit,
    columns,
    showSearch = true,
    isActive = true,
    ...dataTableProps
  } = props;
  const state = useFactoryState(externalState, props, createEditableDataTable);

  useInput(
    (input, key) => {
      if (state.isEditing()) {
        const column = columns[state.activeColumnIndex()];
        if (key.escape) {
          state.cancelEditing();
        } else if (key.return) {
          state.commitEditing();
        } else if (key.tab) {
          if (state.commitEditing()) {
            state.moveColumn(key.shift ? -1 : 1);
          }
        } else if (column?.inputType === 'select') {
          if (key.leftArrow || key.upArrow) {
            state.moveSelectOption(-1);
          } else if (key.rightArrow || key.downArrow) {
            state.moveSelectOption(1);
          }
        } else if (key.leftArrow) {
          state.moveEditCursor('left');
        } else if (key.rightArrow) {
          state.moveEditCursor('right');
        } else if (key.home) {
          state.moveEditCursor('home');
        } else if (key.end) {
          state.moveEditCursor('end');
        } else if (key.backspace) {
          state.backspace();
        } else if (key.delete) {
          state.deleteForward();
        } else if (input && !key.ctrl && !key.meta) {
          state.insertText(input);
        }
        return true;
      }

      const isSearching = showSearch && state.tableState.filterText().length > 0;
      if (key.upArrow) {
        state.moveRow(-1);
      } else if (key.downArrow) {
        state.moveRow(1);
      } else if (key.leftArrow) {
        state.moveColumn(-1);
      } else if (key.rightArrow) {
        state.moveColumn(1);
      } else if (key.pageUp) {
        state.tableState.prevPage();
      } else if (key.pageDown) {
        state.tableState.nextPage();
      } else if (key.return) {
        state.startEditing();
      } else if (input === ' ') {
        state.tableState.selectCurrent();
      } else if (input === 'a' && key.ctrl) {
        state.tableState.selectAll();
      } else if (input === 'd' && key.ctrl) {
        state.tableState.deselectAll();
      } else if (key.backspace && showSearch) {
        state.tableState.setFilter(
          state.tableState.filterText().slice(0, -1),
        );
      } else if (!isSearching && input === 's') {
        const sortable = columns.filter((column) => column.sortable);
        if (sortable.length > 0) {
          const current = state.tableState.sortColumn();
          const currentIndex = sortable.findIndex(
            (column) => column.key === current,
          );
          state.tableState.sort(
            sortable[(currentIndex + 1) % sortable.length]!.key,
          );
        }
      } else if (
        input &&
        showSearch &&
        !key.ctrl &&
        !key.meta
      ) {
        state.tableState.setFilter(
          state.tableState.filterText() + stripInlineControls(input),
        );
      } else {
        return false;
      }
      return true;
    },
    {
      isActive,
      priority: 'normal',
      stopPropagation: true,
    },
  );

  const activeRowKey = state.activeRowKey();
  const activeColumn = state.activeColumn();
  const editingCell = state.editingCell();
  const validationError = state.validationError();
  const displayColumns = columns.map((column) =>
    state.isEditing() && column.key === editingCell?.column
      ? {
          ...column,
          minWidth: Math.max(
            column.minWidth ?? 0,
            stringWidth(state.draftValue()) + 1,
          ),
        }
      : column,
  );

  return Box(
    { flexDirection: 'column' },
    DataTable({
      ...dataTableProps,
      columns: displayColumns,
      showSearch,
      isActive: false,
      state: state.tableState,
      stateOptionsManaged: true,
      cellFocus:
        activeRowKey && activeColumn
          ? {
              rowKey: editingCell?.rowKey ?? activeRowKey,
              column: editingCell?.column ?? activeColumn,
              editing: state.isEditing(),
              value: state.draftValue(),
              cursorPosition: state.cursorPosition(),
            }
          : null,
    }),
    validationError
      ? Text({ color: 'danger', bold: true }, `Error: ${validationError}`)
      : Text(
          { color: 'mutedForeground', dim: true },
          state.isEditing()
            ? 'Enter: commit  Esc: cancel  Tab: commit and move'
            : 'Arrows: move cell  Enter: edit  Space: select  PgUp/PgDn: page',
        ),
  );
}
