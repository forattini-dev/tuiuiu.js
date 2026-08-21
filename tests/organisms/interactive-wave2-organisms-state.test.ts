import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderToString } from '../../src/core/renderer.js';
import {
  beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { resetTestInteractions, dispatchTestKey } from '../../src/testing/interaction.js';
import {
  DataTable,
  ScrollArea,
  ScrollList,
  VirtualList,
  useDataTableState,
  useScrollList,
  type DataTableColumn,
  type VirtualListItem,
} from '../../src/organisms/index.js';
import { Text } from '../../src/primitives/nodes.js';
import { keys } from '../helpers/keyboard.js';

function renderWithHooks<T>(factory: () => T): T {
  beginRender();
  const result = factory();
  endRender();
  return result;
}

const scrollContent = Array.from({ length: 8 }, (_, index) => `Line ${index + 1}`);
const scrollItems = Array.from({ length: 8 }, (_, index) => `Item ${index + 1}`);
const virtualItems: VirtualListItem<string>[] = [
  { key: 'alpha', data: 'Alpha' },
  { key: 'beta', data: 'Beta' },
  { key: 'gamma', data: 'Gamma' },
  { key: 'delta', data: 'Delta' },
];

type UserRow = {
  id: number;
  name: string;
  age: number;
};

const tableColumns: DataTableColumn<UserRow>[] = [
  { key: 'name', header: 'Name', sortable: true },
  { key: 'age', header: 'Age', sortable: true },
];

const tableRows: UserRow[] = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
  { id: 3, name: 'Charlie', age: 35 },
  { id: 4, name: 'Diana', age: 28 },
  { id: 5, name: 'Eve', age: 22 },
];

describe('Wave 2 stateful organisms', () => {
  beforeEach(() => {
    resetHookState();
    resetTestInteractions();
  });

  afterEach(() => {
    resetHookState();
    resetTestInteractions();
  });

  it('keeps ScrollArea position across parent re-renders and updates callbacks', () => {
    const firstOnScroll = vi.fn();
    const secondOnScroll = vi.fn();

    const renderApp = (onScroll: (scrollTop: number) => void) =>
      renderWithHooks(() =>
        ScrollArea({
          height: 3,
          content: scrollContent,
          isActive: true,
          onScroll,
        })
      );

    renderApp(firstOnScroll);
    dispatchTestKey('', keys.down().key);

    const rerendered = renderApp(secondOnScroll);
    dispatchTestKey('', keys.down().key);

    const output = renderToString(rerendered, 60);
    expect(output).toContain('Line 3');
    expect(output).not.toContain('Line 1');
    expect(firstOnScroll).toHaveBeenCalledWith(1);
    expect(secondOnScroll).toHaveBeenCalledWith(2);
  });

  it('keeps VirtualList selection across parent re-renders and updates callbacks', () => {
    const firstOnSelect = vi.fn();
    const secondOnSelect = vi.fn();

    const renderItem = (item: VirtualListItem<string>, _index: number, isSelected: boolean) =>
      Text({}, `${isSelected ? '>' : ' '} ${item.data}`);

    const renderApp = (onSelect: (item: VirtualListItem<string>, index: number) => void) =>
      renderWithHooks(() =>
        VirtualList({
          items: virtualItems,
          height: 3,
          renderItem,
          onSelect,
          isActive: true,
        })
      );

    renderApp(firstOnSelect);
    dispatchTestKey('', keys.down().key);

    renderApp(secondOnSelect);
    dispatchTestKey('', keys.down().key);
    const rerendered = renderApp(secondOnSelect);

    const output = renderToString(rerendered, 60);
    expect(output).toContain('> Gamma');
    expect(firstOnSelect).toHaveBeenCalledWith(virtualItems[1], 1);
    expect(secondOnSelect).toHaveBeenCalledWith(virtualItems[2], 2);
  });

  it('keeps ScrollList position across parent re-renders', () => {
    const renderApp = () =>
      renderWithHooks(() =>
        ScrollList({
          items: scrollItems,
          children: (item) => Text({}, item),
          height: 3,
          width: 30,
          itemHeight: 1,
          isActive: true,
        })
      );

    renderApp();
    dispatchTestKey('', keys.down().key);
    dispatchTestKey('', keys.down().key);

    const rerendered = renderApp();
    const output = renderToString(rerendered, 30);

    expect(output).toContain('Item 3');
    expect(output).not.toContain('Item 1');
  });

  it('returns the same ScrollList controller across re-renders', () => {
    const renderController = () =>
      renderWithHooks(() => {
        const list = useScrollList({ inverted: true });
        ScrollList({
          ...list.bind,
          items: scrollItems,
          children: (item) => Text({}, item),
          height: 3,
          width: 30,
          itemHeight: 1,
          isActive: true,
        });
        return list;
      });

    const first = renderController();
    dispatchTestKey('', keys.down().key);
    dispatchTestKey('', keys.down().key);

    const second = renderController();

    expect(second.bind.state).toBe(first.bind.state);
    expect(second.scrollTop()).toBe(2);
  });

  it('keeps DataTable pagination across parent re-renders and updates callbacks', () => {
    const firstOnPageChange = vi.fn();
    const secondOnPageChange = vi.fn();

    const renderApp = (onPageChange: (page: number) => void) =>
      renderWithHooks(() =>
        DataTable({
          columns: tableColumns,
          data: tableRows,
          getRowKey: (row) => String(row.id),
          pageSize: 2,
          showSearch: false,
          isActive: true,
          onPageChange,
        })
      );

    renderApp(firstOnPageChange);
    dispatchTestKey('', keys.right().key);

    renderApp(secondOnPageChange);
    dispatchTestKey('', keys.right().key);
    const rerendered = renderApp(secondOnPageChange);

    const output = renderToString(rerendered, 80);
    expect(output).toContain('Eve');
    expect(output).not.toContain('Alice');
    expect(firstOnPageChange).toHaveBeenCalledWith(1);
    expect(secondOnPageChange).toHaveBeenCalledWith(2);
  });

  it('returns the same DataTable controller across re-renders', () => {
    const renderController = () =>
      renderWithHooks(() =>
        useDataTableState({
          columns: tableColumns,
          data: tableRows,
          getRowKey: (row) => String(row.id),
          pageSize: 2,
        })
      );

    const first = renderController();
    first.goToPage(1);
    first.setFilter('char');

    const second = renderController();

    expect(second).toBe(first);
    expect(second.filterText()).toBe('char');
    expect(second.currentPage()).toBe(0);
    expect(second.pageData()[0]?.name).toBe('Charlie');
  });
});
