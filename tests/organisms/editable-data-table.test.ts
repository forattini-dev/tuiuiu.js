import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderToString } from '../../src/core/renderer.js';
import {
  beginRender,
  clearInputHandlers,
  emitInput,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';
import {
  createEditableDataTable,
  EditableDataTable,
  type EditableColumn,
  type EditableDataTableOptions,
} from '../../src/organisms/data-table.js';
import { charKey, keys } from '../helpers/keyboard.js';

interface User {
  id: number;
  name: string;
  age: number;
  role: 'active' | 'inactive';
}

const users: User[] = [
  { id: 1, name: 'Alice', age: 30, role: 'active' },
  { id: 2, name: 'Bob', age: 25, role: 'inactive' },
  { id: 3, name: 'Charlie', age: 35, role: 'active' },
  { id: 4, name: 'Diana', age: 28, role: 'inactive' },
];

const columns: EditableColumn<User>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Name', editable: true },
  {
    key: 'age',
    header: 'Age',
    editable: true,
    inputType: 'number',
    validate: (value) => value >= 18 || 'Age must be at least 18',
  },
  {
    key: 'role',
    header: 'Role',
    editable: true,
    inputType: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
    ],
  },
];

function createOptions(
  overrides: Partial<EditableDataTableOptions<User>> = {},
): EditableDataTableOptions<User> {
  return {
    columns,
    data: users,
    getRowKey: (row) => String(row.id),
    showSearch: false,
    ...overrides,
  };
}

function renderWithHooks<T>(factory: () => T): T {
  beginRender();
  const result = factory();
  endRender();
  return result;
}

describe('createEditableDataTable', () => {
  it('focuses only editable columns and wraps at both edges', () => {
    const state = createEditableDataTable(createOptions());

    expect(state.activeColumnIndex()).toBe(1);
    expect(state.activeColumn()).toBe('name');

    state.moveColumn(1);
    expect(state.activeColumn()).toBe('age');
    state.moveColumn(1);
    expect(state.activeColumn()).toBe('role');
    state.moveColumn(1);
    expect(state.activeColumn()).toBe('name');
    state.moveColumn(-1);
    expect(state.activeColumn()).toBe('role');
  });

  it('edits text without splitting grapheme clusters', () => {
    const onCellEdit = vi.fn();
    const state = createEditableDataTable(createOptions({ onCellEdit }));

    expect(state.startEditing()).toBe(true);
    state.setDraftValue('A👨‍👩‍👧‍👦B');
    state.backspace();
    expect(state.draftValue()).toBe('A👨‍👩‍👧‍👦');
    state.backspace();
    expect(state.draftValue()).toBe('A');
    state.insertText('\nZ\u001b');
    expect(state.draftValue()).toBe('AZ');
    expect(state.commitEditing()).toBe(true);

    expect(onCellEdit).toHaveBeenCalledWith('1', 'name', 'AZ', users[0]);
    expect(state.isEditing()).toBe(false);
  });

  it('keeps invalid numeric drafts active and commits finite numbers', () => {
    const onCellEdit = vi.fn();
    const state = createEditableDataTable(createOptions({ onCellEdit }));
    state.moveColumn(1);
    state.startEditing();

    state.setDraftValue('not-a-number');
    expect(state.commitEditing()).toBe(false);
    expect(state.validationError()).toBe('Enter a valid number');
    expect(state.isEditing()).toBe(true);

    state.setDraftValue('17');
    expect(state.commitEditing()).toBe(false);
    expect(state.validationError()).toBe('Age must be at least 18');

    state.setDraftValue('42');
    expect(state.commitEditing()).toBe(true);
    expect(onCellEdit).toHaveBeenCalledWith('1', 'age', 42, users[0]);
  });

  it('cycles select labels but commits the underlying value', () => {
    const onCellEdit = vi.fn();
    const state = createEditableDataTable(createOptions({ onCellEdit }));
    state.moveColumn(2);

    state.startEditing();
    expect(state.draftValue()).toBe('Active');
    state.moveSelectOption(1);
    expect(state.draftValue()).toBe('Inactive');
    expect(state.commitEditing()).toBe(true);

    expect(onCellEdit).toHaveBeenCalledWith(
      '1',
      'role',
      'inactive',
      users[0],
    );
  });

  it('cancels without emitting and uses global fallback keys across pages', () => {
    const onCellEdit = vi.fn();
    const state = createEditableDataTable(
      createOptions({
        getRowKey: undefined,
        pageSize: 2,
        onCellEdit,
      }),
    );

    state.startEditing();
    state.setDraftValue('Discarded');
    state.cancelEditing();
    expect(onCellEdit).not.toHaveBeenCalled();

    state.tableState.nextPage();
    state.startEditing();
    state.setDraftValue('Changed');
    state.commitEditing();
    expect(onCellEdit).toHaveBeenCalledWith('2', 'name', 'Changed', users[2]);
  });

  it('resynchronizes columns and cancels a cell removed by new options', () => {
    const initial = createOptions();
    const state = createEditableDataTable(initial);
    state.startEditing();

    state.updateOptions({
      ...initial,
      columns: [
        { key: 'id', header: 'ID' },
        { key: 'age', header: 'Age', editable: true, inputType: 'number' },
      ],
    });

    expect(state.isEditing()).toBe(false);
    expect(state.activeColumn()).toBe('age');
  });
});

describe('EditableDataTable component input', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  it('owns navigation and commit input without the base table handling it twice', () => {
    const onCellEdit = vi.fn();
    const options = createOptions({ onCellEdit });
    const state = createEditableDataTable(options);

    renderWithHooks(() => EditableDataTable({ ...options, state }));
    emitInput('', keys.enter().key);
    expect(state.isEditing()).toBe(true);

    emitInput('X', charKey('X').key);
    emitInput('', keys.enter().key);
    expect(onCellEdit).toHaveBeenCalledWith(
      '1',
      'name',
      'AliceX',
      users[0],
    );
    expect(state.tableState.selectedKeys().size).toBe(0);
  });

  it('renders the inline cursor and a validation error', () => {
    const options = createOptions();
    const state = createEditableDataTable(options);
    state.moveColumn(1);
    state.startEditing();
    state.setDraftValue('invalid');
    state.commitEditing();

    const node = renderWithHooks(() =>
      EditableDataTable({ ...options, state }),
    );
    const output = renderToString(node, 100);

    expect(output).toContain('invalid│');
    expect(output).toContain('Error: Enter a valid number');
  });
});
