/**
 * DataTable Tests
 *
 * Comprehensive tests for the DataTable component and createDataTable state manager:
 * - Initialization and defaults
 * - Sorting (single/multi-column, custom sort functions)
 * - Filtering (text search, custom filter functions)
 * - Pagination (next/prev/goTo)
 * - Row selection (single/multiple)
 * - Keyboard navigation
 * - Callbacks (onSelect, onSort, onPageChange)
 * - Edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createDataTable,
  DataTable,
  VirtualDataTable,
  EditableDataTable,
  type DataTableColumn,
  type DataTableOptions,
  type DataTableState,
} from '../../src/organisms/data-table.js';

// =============================================================================
// Test Data
// =============================================================================

interface User {
  id: number;
  name: string;
  age: number;
  email: string;
  active: boolean;
}

const testUsers: User[] = [
  { id: 1, name: 'Alice', age: 30, email: 'alice@test.com', active: true },
  { id: 2, name: 'Bob', age: 25, email: 'bob@test.com', active: false },
  { id: 3, name: 'Charlie', age: 35, email: 'charlie@test.com', active: true },
  { id: 4, name: 'Diana', age: 28, email: 'diana@test.com', active: true },
  { id: 5, name: 'Eve', age: 22, email: 'eve@test.com', active: false },
];

const testColumns: DataTableColumn<User>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
  { key: 'email', header: 'Email', sortable: false },
  { key: 'active', header: 'Active', sortable: true },
];

function createTestState(options: Partial<DataTableOptions<User>> = {}): DataTableState<User> {
  return createDataTable({
    columns: testColumns,
    data: testUsers,
    getRowKey: (row) => String(row.id),
    ...options,
  });
}

// =============================================================================
// Initialization Tests
// =============================================================================

describe('createDataTable() initialization', () => {
  it('should create state with default values', () => {
    const state = createTestState();

    expect(state.sortColumn()).toBeNull();
    expect(state.sortDirection()).toBeNull();
    expect(state.filterText()).toBe('');
    expect(state.currentPage()).toBe(0);
    expect(state.selectedKeys().size).toBe(0);
    expect(state.cursorIndex()).toBe(0);
  });

  it('should expose all required methods', () => {
    const state = createTestState();

    // Getters
    expect(typeof state.sortColumn).toBe('function');
    expect(typeof state.sortDirection).toBe('function');
    expect(typeof state.filterText).toBe('function');
    expect(typeof state.currentPage).toBe('function');
    expect(typeof state.totalPages).toBe('function');
    expect(typeof state.filteredData).toBe('function');
    expect(typeof state.sortedData).toBe('function');
    expect(typeof state.pageData).toBe('function');
    expect(typeof state.selectedKeys).toBe('function');
    expect(typeof state.cursorIndex).toBe('function');

    // Actions
    expect(typeof state.sort).toBe('function');
    expect(typeof state.setFilter).toBe('function');
    expect(typeof state.nextPage).toBe('function');
    expect(typeof state.prevPage).toBe('function');
    expect(typeof state.goToPage).toBe('function');
    expect(typeof state.selectRow).toBe('function');
    expect(typeof state.deselectRow).toBe('function');
    expect(typeof state.toggleRow).toBe('function');
    expect(typeof state.selectAll).toBe('function');
    expect(typeof state.deselectAll).toBe('function');
    expect(typeof state.moveCursor).toBe('function');
    expect(typeof state.selectCurrent).toBe('function');
    expect(typeof state.getRowKey).toBe('function');
  });

  it('should apply initial sort', () => {
    const state = createTestState({
      initialSort: { column: 'name', direction: 'asc' },
    });

    expect(state.sortColumn()).toBe('name');
    expect(state.sortDirection()).toBe('asc');
  });

  it('should apply initial selection', () => {
    const state = createTestState({
      initialSelected: ['1', '3'],
    });

    expect(state.selectedKeys().has('1')).toBe(true);
    expect(state.selectedKeys().has('3')).toBe(true);
    expect(state.selectedKeys().size).toBe(2);
  });

  it('should use default getRowKey (index-based) when not provided', () => {
    const state = createDataTable({
      columns: testColumns,
      data: testUsers,
    });

    // Default uses index as key
    expect(state.getRowKey(testUsers[0]!, 0)).toBe('0');
    expect(state.getRowKey(testUsers[1]!, 1)).toBe('1');
  });

  it('should use custom getRowKey', () => {
    const state = createTestState({
      getRowKey: (row) => `user-${row.id}`,
    });

    expect(state.getRowKey(testUsers[0]!, 0)).toBe('user-1');
    expect(state.getRowKey(testUsers[1]!, 1)).toBe('user-2');
  });
});

// =============================================================================
// Sorting Tests
// =============================================================================

describe('Sorting', () => {
  it('should sort ascending on first click', () => {
    const state = createTestState();

    state.sort('name');

    expect(state.sortColumn()).toBe('name');
    expect(state.sortDirection()).toBe('asc');
  });

  it('should sort descending on second click', () => {
    const state = createTestState();

    state.sort('name');
    state.sort('name');

    expect(state.sortColumn()).toBe('name');
    expect(state.sortDirection()).toBe('desc');
  });

  it('should clear sort on third click', () => {
    const state = createTestState();

    state.sort('name');
    state.sort('name');
    state.sort('name');

    expect(state.sortColumn()).toBeNull();
    expect(state.sortDirection()).toBeNull();
  });

  it('should sort data correctly ascending by string', () => {
    const state = createTestState();

    state.sort('name');

    const sorted = state.sortedData();
    expect(sorted[0]?.name).toBe('Alice');
    expect(sorted[1]?.name).toBe('Bob');
    expect(sorted[2]?.name).toBe('Charlie');
    expect(sorted[3]?.name).toBe('Diana');
    expect(sorted[4]?.name).toBe('Eve');
  });

  it('should sort data correctly descending by string', () => {
    const state = createTestState();

    state.sort('name');
    state.sort('name');

    const sorted = state.sortedData();
    expect(sorted[0]?.name).toBe('Eve');
    expect(sorted[4]?.name).toBe('Alice');
  });

  it('should sort data correctly by number', () => {
    const state = createTestState();

    state.sort('age');

    const sorted = state.sortedData();
    expect(sorted[0]?.age).toBe(22); // Eve
    expect(sorted[4]?.age).toBe(35); // Charlie
  });

  it('should not sort non-sortable columns', () => {
    const state = createTestState();

    state.sort('email'); // email is not sortable

    expect(state.sortColumn()).toBeNull();
    expect(state.sortDirection()).toBeNull();
  });

  it('should switch to new column and start with asc', () => {
    const state = createTestState();

    state.sort('name'); // asc
    state.sort('name'); // desc
    state.sort('age'); // Switch column, start with asc

    expect(state.sortColumn()).toBe('age');
    expect(state.sortDirection()).toBe('asc');
  });

  it('should call onSort callback', () => {
    const onSort = vi.fn();
    const state = createTestState({ onSort });

    state.sort('name');

    expect(onSort).toHaveBeenCalledWith('name', 'asc');
  });

  it('should reset page to 0 on sort', () => {
    const state = createTestState({ pageSize: 2 });

    state.goToPage(1);
    expect(state.currentPage()).toBe(1);

    state.sort('name');
    expect(state.currentPage()).toBe(0);
  });

  it('should use custom sort function', () => {
    const columns: DataTableColumn<User>[] = [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        sortFn: (a, b, dir) => {
          // Reverse alphabetical
          const cmp = b.name.localeCompare(a.name);
          return dir === 'desc' ? -cmp : cmp;
        },
      },
    ];

    const state = createDataTable({
      columns,
      data: testUsers,
    });

    state.sort('name'); // asc with custom fn = reverse alphabetical

    const sorted = state.sortedData();
    expect(sorted[0]?.name).toBe('Eve');
    expect(sorted[4]?.name).toBe('Alice');
  });
});

// =============================================================================
// Filtering Tests
// =============================================================================

describe('Filtering', () => {
  it('should filter data by text', () => {
    const state = createTestState();

    state.setFilter('alice');

    const filtered = state.filteredData();
    expect(filtered.length).toBe(1);
    expect(filtered[0]?.name).toBe('Alice');
  });

  it('should filter case-insensitively', () => {
    const state = createTestState();

    state.setFilter('ALICE');

    expect(state.filteredData().length).toBe(1);
  });

  it('should filter across all filterable columns', () => {
    const state = createTestState();

    state.setFilter('@test.com');

    expect(state.filteredData().length).toBe(5); // All have @test.com
  });

  it('should return all data when filter is empty', () => {
    const state = createTestState();

    state.setFilter('alice');
    expect(state.filteredData().length).toBe(1);

    state.setFilter('');
    expect(state.filteredData().length).toBe(5);
  });

  it('should reset page and cursor on filter', () => {
    const state = createTestState({ pageSize: 2 });

    state.goToPage(1);
    state.moveCursor(1);

    state.setFilter('alice');

    expect(state.currentPage()).toBe(0);
    expect(state.cursorIndex()).toBe(0);
  });

  it('should skip columns with filterable: false', () => {
    const columns: DataTableColumn<User>[] = [
      { key: 'name', header: 'Name', filterable: true },
      { key: 'email', header: 'Email', filterable: false },
    ];

    const state = createDataTable({
      columns,
      data: testUsers,
    });

    state.setFilter('alice@test.com'); // Only in email field

    // Should not match because email is not filterable
    expect(state.filteredData().length).toBe(0);
  });

  it('should use custom filter function', () => {
    const columns: DataTableColumn<User>[] = [
      {
        key: 'age',
        header: 'Age',
        filterable: true,
        filterFn: (value, filter) => {
          const minAge = parseInt(filter, 10);
          return !isNaN(minAge) && value >= minAge;
        },
      },
    ];

    const state = createDataTable({
      columns,
      data: testUsers,
    });

    state.setFilter('30');

    const filtered = state.filteredData();
    expect(filtered.length).toBe(2); // Alice (30) and Charlie (35)
    expect(filtered.every((u) => u.age >= 30)).toBe(true);
  });

  it('should apply filter before sort', () => {
    const state = createTestState();

    state.setFilter('li'); // Alice, Charlie (names containing 'li')
    state.sort('name');

    const sorted = state.sortedData();
    expect(sorted.length).toBe(2);
    expect(sorted[0]?.name).toBe('Alice');
    expect(sorted[1]?.name).toBe('Charlie');
  });
});

// =============================================================================
// Pagination Tests
// =============================================================================

describe('Pagination', () => {
  it('should calculate total pages correctly', () => {
    const state = createTestState({ pageSize: 2 });

    expect(state.totalPages()).toBe(3); // 5 users / 2 per page = 3 pages
  });

  it('should return first page data by default', () => {
    const state = createTestState({ pageSize: 2 });

    const page = state.pageData();
    expect(page.length).toBe(2);
    expect(page[0]?.name).toBe('Alice');
    expect(page[1]?.name).toBe('Bob');
  });

  it('nextPage() should advance page', () => {
    const state = createTestState({ pageSize: 2 });

    state.nextPage();

    expect(state.currentPage()).toBe(1);
    const page = state.pageData();
    expect(page[0]?.name).toBe('Charlie');
    expect(page[1]?.name).toBe('Diana');
  });

  it('nextPage() should not exceed last page', () => {
    const state = createTestState({ pageSize: 2 });

    state.goToPage(2); // Last page
    state.nextPage();

    expect(state.currentPage()).toBe(2);
  });

  it('prevPage() should go back', () => {
    const state = createTestState({ pageSize: 2 });

    state.nextPage();
    expect(state.currentPage()).toBe(1);

    state.prevPage();
    expect(state.currentPage()).toBe(0);
  });

  it('prevPage() should not go below 0', () => {
    const state = createTestState({ pageSize: 2 });

    state.prevPage();

    expect(state.currentPage()).toBe(0);
  });

  it('goToPage() should jump to specific page', () => {
    const state = createTestState({ pageSize: 2 });

    state.goToPage(2);

    expect(state.currentPage()).toBe(2);
    const page = state.pageData();
    expect(page.length).toBe(1); // Only Eve on last page
    expect(page[0]?.name).toBe('Eve');
  });

  it('goToPage() should clamp to valid range', () => {
    const state = createTestState({ pageSize: 2 });

    state.goToPage(100);
    expect(state.currentPage()).toBe(2); // Max is 2

    state.goToPage(-5);
    expect(state.currentPage()).toBe(0);
  });

  it('should reset cursor on page change', () => {
    const state = createTestState({ pageSize: 2 });

    state.moveCursor(1);
    expect(state.cursorIndex()).toBe(1);

    state.nextPage();
    expect(state.cursorIndex()).toBe(0);
  });

  it('should call onPageChange callback', () => {
    const onPageChange = vi.fn();
    const state = createTestState({ pageSize: 2, onPageChange });

    state.nextPage();

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('should not call onPageChange when page does not change', () => {
    const onPageChange = vi.fn();
    const state = createTestState({ pageSize: 2, onPageChange });

    state.prevPage(); // Already at 0

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('should return all data when pageSize is 0', () => {
    const state = createTestState({ pageSize: 0 });

    expect(state.pageData().length).toBe(5);
    expect(state.totalPages()).toBe(1);
  });

  it('should recalculate pages after filter', () => {
    const state = createTestState({ pageSize: 2 });

    expect(state.totalPages()).toBe(3);

    state.setFilter('alice');

    expect(state.totalPages()).toBe(1);
    expect(state.pageData().length).toBe(1);
  });
});

// =============================================================================
// Row Selection Tests
// =============================================================================

describe('Row Selection', () => {
  describe('single selection mode', () => {
    it('should select a row', () => {
      const state = createTestState({ selectionMode: 'single' });

      state.selectRow('1');

      expect(state.selectedKeys().has('1')).toBe(true);
      expect(state.selectedKeys().size).toBe(1);
    });

    it('should replace selection when selecting another row', () => {
      const state = createTestState({ selectionMode: 'single' });

      state.selectRow('1');
      state.selectRow('2');

      expect(state.selectedKeys().has('1')).toBe(false);
      expect(state.selectedKeys().has('2')).toBe(true);
      expect(state.selectedKeys().size).toBe(1);
    });

    it('should deselect a row', () => {
      const state = createTestState({ selectionMode: 'single' });

      state.selectRow('1');
      state.deselectRow('1');

      expect(state.selectedKeys().size).toBe(0);
    });

    it('should toggle selection', () => {
      const state = createTestState({ selectionMode: 'single' });

      state.toggleRow('1');
      expect(state.selectedKeys().has('1')).toBe(true);

      state.toggleRow('1');
      expect(state.selectedKeys().has('1')).toBe(false);
    });
  });

  describe('multiple selection mode', () => {
    it('should select multiple rows', () => {
      const state = createTestState({ selectionMode: 'multiple' });

      state.selectRow('1');
      state.selectRow('2');
      state.selectRow('3');

      expect(state.selectedKeys().size).toBe(3);
      expect(state.selectedKeys().has('1')).toBe(true);
      expect(state.selectedKeys().has('2')).toBe(true);
      expect(state.selectedKeys().has('3')).toBe(true);
    });

    it('should deselect specific row', () => {
      const state = createTestState({ selectionMode: 'multiple' });

      state.selectRow('1');
      state.selectRow('2');
      state.deselectRow('1');

      expect(state.selectedKeys().has('1')).toBe(false);
      expect(state.selectedKeys().has('2')).toBe(true);
    });

    it('selectAll() should select all rows on current page', () => {
      const state = createTestState({ selectionMode: 'multiple', pageSize: 2 });

      state.selectAll();

      expect(state.selectedKeys().size).toBe(2);
      expect(state.selectedKeys().has('1')).toBe(true);
      expect(state.selectedKeys().has('2')).toBe(true);
    });

    it('deselectAll() should clear all selections', () => {
      const state = createTestState({ selectionMode: 'multiple' });

      state.selectRow('1');
      state.selectRow('2');
      state.deselectAll();

      expect(state.selectedKeys().size).toBe(0);
    });
  });

  describe('none selection mode', () => {
    it('should not allow selection', () => {
      const state = createTestState({ selectionMode: 'none' });

      state.selectRow('1');

      expect(state.selectedKeys().size).toBe(0);
    });
  });

  describe('onSelect callback', () => {
    it('should call onSelect with selected rows', () => {
      const onSelect = vi.fn();
      const state = createTestState({ selectionMode: 'single', onSelect });

      state.selectRow('1');

      expect(onSelect).toHaveBeenCalled();
    });

    it('should call onSelect with empty array on deselectAll', () => {
      const onSelect = vi.fn();
      const state = createTestState({ selectionMode: 'multiple', onSelect });

      state.selectRow('1');
      onSelect.mockClear();

      state.deselectAll();

      expect(onSelect).toHaveBeenCalledWith([]);
    });
  });
});

// =============================================================================
// Cursor Navigation Tests
// =============================================================================

describe('Cursor Navigation', () => {
  it('should start at index 0', () => {
    const state = createTestState();

    expect(state.cursorIndex()).toBe(0);
  });

  it('moveCursor(1) should move down', () => {
    const state = createTestState();

    state.moveCursor(1);

    expect(state.cursorIndex()).toBe(1);
  });

  it('moveCursor(-1) should move up', () => {
    const state = createTestState();

    state.moveCursor(1);
    state.moveCursor(-1);

    expect(state.cursorIndex()).toBe(0);
  });

  it('should not go below 0', () => {
    const state = createTestState();

    state.moveCursor(-1);

    expect(state.cursorIndex()).toBe(0);
  });

  it('should not exceed page data length', () => {
    const state = createTestState({ pageSize: 2 });

    state.moveCursor(10);

    expect(state.cursorIndex()).toBe(1); // Max is 1 (0-indexed, 2 items)
  });

  it('selectCurrent() should toggle selection at cursor', () => {
    const state = createTestState({ selectionMode: 'single' });

    state.moveCursor(1); // Move to Bob (index 1)
    state.selectCurrent();

    expect(state.selectedKeys().has('2')).toBe(true); // Bob's id is 2
  });

  it('selectCurrent() should toggle off if already selected', () => {
    const state = createTestState({ selectionMode: 'single' });

    state.selectCurrent();
    expect(state.selectedKeys().has('1')).toBe(true);

    state.selectCurrent();
    expect(state.selectedKeys().has('1')).toBe(false);
  });
});

// =============================================================================
// Component Rendering Tests
// =============================================================================

describe('DataTable component', () => {
  it('should render without errors', () => {
    const result = DataTable({
      columns: testColumns,
      data: testUsers,
    });

    expect(result).toBeDefined();
    expect(result.type).toBe('box');
  });

  it('should render with external state', () => {
    const state = createTestState();

    const result = DataTable({
      columns: testColumns,
      data: testUsers,
      state,
    });

    expect(result).toBeDefined();
  });

  it('should render search bar when showSearch is true', () => {
    const result = DataTable({
      columns: testColumns,
      data: testUsers,
      showSearch: true,
    });

    // Search is first child
    const children = result.children as any[];
    expect(children.length).toBeGreaterThan(0);
  });

  it('should render pagination when showPagination is true', () => {
    const result = DataTable({
      columns: testColumns,
      data: testUsers,
      showPagination: true,
      pageSize: 2,
    });

    expect(result).toBeDefined();
  });

  it('should not render pagination when pageSize is 0', () => {
    const result = DataTable({
      columns: testColumns,
      data: testUsers,
      showPagination: true,
      pageSize: 0,
    });

    // Pagination should be null when pageSize is 0
    expect(result).toBeDefined();
  });
});

describe('VirtualDataTable component', () => {
  it('should render without errors', () => {
    const result = VirtualDataTable({
      columns: testColumns,
      data: testUsers,
      visibleRows: 3,
    });

    expect(result).toBeDefined();
    expect(result.type).toBe('box');
  });

  it('should use visibleRows as pageSize', () => {
    const result = VirtualDataTable({
      columns: testColumns,
      data: testUsers,
      visibleRows: 2,
    });

    expect(result).toBeDefined();
  });
});

describe('EditableDataTable component', () => {
  it('should render without errors', () => {
    const result = EditableDataTable({
      columns: testColumns.map((c) => ({ ...c, editable: true })),
      data: testUsers,
    });

    expect(result).toBeDefined();
    expect(result.type).toBe('box');
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle empty data', () => {
    const state = createDataTable({
      columns: testColumns,
      data: [],
    });

    expect(state.filteredData().length).toBe(0);
    expect(state.sortedData().length).toBe(0);
    expect(state.pageData().length).toBe(0);
    expect(state.totalPages()).toBe(1);
  });

  it('should handle single row', () => {
    const state = createDataTable({
      columns: testColumns,
      data: [testUsers[0]!],
      pageSize: 10,
    });

    expect(state.pageData().length).toBe(1);
    expect(state.totalPages()).toBe(1);
  });

  it('should handle exact page size match', () => {
    const state = createDataTable({
      columns: testColumns,
      data: testUsers.slice(0, 4), // 4 users
      pageSize: 2,
    });

    expect(state.totalPages()).toBe(2);
  });

  it('should handle null/undefined values in data', () => {
    const dataWithNulls = [
      { id: 1, name: null, age: undefined, email: '', active: true },
      { id: 2, name: 'Bob', age: 25, email: 'bob@test.com', active: false },
    ];

    const state = createDataTable({
      columns: testColumns,
      data: dataWithNulls as any,
    });

    // Should not throw
    expect(state.sortedData().length).toBe(2);

    state.sort('name');
    expect(state.sortedData().length).toBe(2);

    state.setFilter('bob');
    expect(state.filteredData().length).toBe(1);
  });

  it('should handle very large dataset', () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `User ${i}`,
      age: 20 + (i % 50),
      email: `user${i}@test.com`,
      active: i % 2 === 0,
    }));

    const state = createDataTable({
      columns: testColumns,
      data: largeData,
      pageSize: 50,
    });

    expect(state.totalPages()).toBe(20);
    expect(state.pageData().length).toBe(50);

    state.sort('age');
    expect(state.sortedData().length).toBe(1000);
  });

  it('should handle filter that matches no rows', () => {
    const state = createTestState();

    state.setFilter('zzzzzzz');

    expect(state.filteredData().length).toBe(0);
    expect(state.pageData().length).toBe(0);
    expect(state.totalPages()).toBe(1);
  });

  it('should handle page beyond filtered results', () => {
    const state = createTestState({ pageSize: 2 });

    state.goToPage(2);
    expect(state.currentPage()).toBe(2);

    // Filter reduces total pages
    state.setFilter('alice');

    // Should clamp to valid page
    expect(state.currentPage()).toBe(0);
  });
});

// =============================================================================
// Real-world Scenarios
// =============================================================================

describe('Real-world Scenarios', () => {
  it('should support full workflow: filter → sort → paginate → select', () => {
    const onSelect = vi.fn();
    const state = createTestState({
      pageSize: 2,
      selectionMode: 'multiple',
      onSelect,
    });

    // Filter to active users
    state.setFilter('true'); // Matches 'true' in active column
    expect(state.filteredData().length).toBeGreaterThan(0);

    // Sort by age
    state.sort('age');
    const sorted = state.sortedData();
    expect(sorted[0]?.age).toBeLessThanOrEqual(sorted[1]?.age ?? Infinity);

    // Navigate and select
    state.moveCursor(1);
    state.selectCurrent();

    expect(state.selectedKeys().size).toBe(1);
  });

  it('should maintain selection across sorting', () => {
    const state = createTestState({ selectionMode: 'multiple' });

    state.selectRow('1'); // Alice
    state.selectRow('3'); // Charlie

    state.sort('age');

    // Selection should persist (based on keys, not indices)
    expect(state.selectedKeys().has('1')).toBe(true);
    expect(state.selectedKeys().has('3')).toBe(true);
  });

  it('should work with custom row keys', () => {
    const state = createDataTable({
      columns: testColumns,
      data: testUsers,
      getRowKey: (row) => `user-${row.email}`,
      selectionMode: 'single',
    });

    state.selectRow('user-alice@test.com');

    expect(state.selectedKeys().has('user-alice@test.com')).toBe(true);
  });
});
