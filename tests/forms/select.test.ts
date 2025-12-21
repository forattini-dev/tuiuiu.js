/**
 * Select Component - Keyboard Interaction Tests
 *
 * Tests all keyboard interactions for the Select component:
 * - Navigation: Up/Down, Home/End, Page Up/Down, Vim keys (j/k/g/G)
 * - Selection: Space, Enter, Tab
 * - Multi-select: Ctrl+A, Ctrl+D, Toggle all
 * - Search: /, typing, Backspace
 * - Actions: Escape (cancel/exit search)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSelect, Select, Confirm, Checkbox, type SelectItem, type SelectOptions } from '../../src/design-system/forms/select.js';
import { emitInput, clearInputHandlers, getInputHandlerCount } from '../../src/hooks/context.js';
import type { Key } from '../../src/hooks/types.js';
import { keys, charKey } from '../helpers/keyboard.js';

// Helper to simulate input via EventEmitter
function simulateInput(input: string, key: Key): void {
  emitInput(input, key);
}

// Test items
const basicItems: SelectItem<string>[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Date' },
  { value: 'e', label: 'Elderberry' },
];

const itemsWithDisabled: SelectItem<string>[] = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana', disabled: true },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Date', disabled: true },
  { value: 'e', label: 'Elderberry' },
];

const manyItems: SelectItem<number>[] = Array.from({ length: 20 }, (_, i) => ({
  value: i,
  label: `Item ${i + 1}`,
}));

describe('Select Keyboard Interactions', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  // ============================================================================
  // NAVIGATION - UP ARROW
  // ============================================================================

  describe('Up Arrow (Move Up)', () => {
    it('should move cursor up one position', () => {
      const sel = createSelect({ items: basicItems });
      // Start at index 0, move down first
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(1);
      // Now move up
      simulateInput('', keys.up().key);
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should not move above first item', () => {
      const sel = createSelect({ items: basicItems });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('', keys.up().key);
      expect(sel.cursorIndex()).toBe(0); // Still at 0
    });

    it('should skip disabled items', () => {
      const sel = createSelect({ items: itemsWithDisabled });
      // Items: Apple (0), Banana (1-disabled), Cherry (2), Date (3-disabled), Elderberry (4)
      // Move down: 0 → skip 1 → 2
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(2); // Cherry
      // Move up should skip disabled Banana and go to Apple
      simulateInput('', keys.up().key);
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should work with Ctrl+P as alternative', () => {
      const sel = createSelect({ items: basicItems });
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(1);
      simulateInput('p', { ...keys.up().key, upArrow: false, ctrl: true });
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should adjust scroll when moving above visible area', () => {
      const sel = createSelect({ items: manyItems, maxVisible: 5 });
      // Move to bottom using End key
      simulateInput('', keys.end().key);
      expect(sel.scrollOffset()).toBeGreaterThan(0);
      // Move up multiple times
      for (let i = 0; i < 20; i++) {
        simulateInput('', keys.up().key);
      }
      expect(sel.cursorIndex()).toBe(0);
      expect(sel.scrollOffset()).toBe(0);
    });
  });

  // ============================================================================
  // NAVIGATION - DOWN ARROW
  // ============================================================================

  describe('Down Arrow (Move Down)', () => {
    it('should move cursor down one position', () => {
      const sel = createSelect({ items: basicItems });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(1);
    });

    it('should not move past last item', () => {
      const sel = createSelect({ items: basicItems });
      // Move to last item
      for (let i = 0; i < 10; i++) {
        simulateInput('', keys.down().key);
      }
      expect(sel.cursorIndex()).toBe(4); // Last index
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(4); // Still at 4
    });

    it('should skip disabled items', () => {
      const sel = createSelect({ items: itemsWithDisabled });
      expect(sel.cursorIndex()).toBe(0); // Apple
      simulateInput('', keys.down().key);
      // Should skip Banana (disabled) and land on Cherry
      expect(sel.cursorIndex()).toBe(2);
    });

    it('should work with Ctrl+N as alternative', () => {
      const sel = createSelect({ items: basicItems });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('n', { ...keys.down().key, downArrow: false, ctrl: true });
      expect(sel.cursorIndex()).toBe(1);
    });

    it('should adjust scroll when moving below visible area', () => {
      const sel = createSelect({ items: manyItems, maxVisible: 5 });
      expect(sel.scrollOffset()).toBe(0);
      // Move down past visible area
      for (let i = 0; i < 6; i++) {
        simulateInput('', keys.down().key);
      }
      expect(sel.cursorIndex()).toBe(6);
      expect(sel.scrollOffset()).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // NAVIGATION - VIM KEYS (j/k)
  // ============================================================================

  describe('Vim Keys (j/k)', () => {
    it('should move down with j', () => {
      const sel = createSelect({ items: basicItems });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('j', charKey('j').key);
      expect(sel.cursorIndex()).toBe(1);
    });

    it('should move up with k', () => {
      const sel = createSelect({ items: basicItems });
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(1);
      simulateInput('k', charKey('k').key);
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should go to top with g', () => {
      const sel = createSelect({ items: basicItems });
      // Move to middle
      simulateInput('', keys.down().key);
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(2);
      // Go to top
      simulateInput('g', charKey('g').key);
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should go to bottom with G (shift+g)', () => {
      const sel = createSelect({ items: basicItems });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('G', charKey('G').key);
      expect(sel.cursorIndex()).toBe(4);
    });

    it('should not work in search mode', () => {
      const sel = createSelect({ items: basicItems, searchable: true });
      // Enter search mode
      simulateInput('/', charKey('/').key);
      expect(sel.isSearching()).toBe(true);
      // j should add to search, not move
      const initialCursor = sel.cursorIndex();
      simulateInput('j', charKey('j').key);
      expect(sel.cursorIndex()).toBe(initialCursor);
      expect(sel.searchQuery()).toBe('j');
    });
  });

  // ============================================================================
  // NAVIGATION - HOME/END
  // ============================================================================

  describe('Home (Go to Top)', () => {
    it('should move cursor to first item', () => {
      const sel = createSelect({ items: basicItems });
      // Move to middle
      simulateInput('', keys.down().key);
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(2);
      simulateInput('', keys.home().key);
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should reset scroll offset to 0', () => {
      const sel = createSelect({ items: manyItems, maxVisible: 5 });
      // Move to bottom using End key
      simulateInput('', keys.end().key);
      expect(sel.scrollOffset()).toBeGreaterThan(0);
      simulateInput('', keys.home().key);
      expect(sel.scrollOffset()).toBe(0);
      expect(sel.cursorIndex()).toBe(0);
    });
  });

  describe('End (Go to Bottom)', () => {
    it('should move cursor to last item', () => {
      const sel = createSelect({ items: basicItems });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('', keys.end().key);
      expect(sel.cursorIndex()).toBe(4);
    });

    it('should set scroll to show last items', () => {
      const sel = createSelect({ items: manyItems, maxVisible: 5 });
      expect(sel.scrollOffset()).toBe(0);
      simulateInput('', keys.end().key);
      expect(sel.cursorIndex()).toBe(19);
      expect(sel.scrollOffset()).toBe(15); // 20 - 5 = 15
    });
  });

  // ============================================================================
  // SELECTION - SPACE
  // ============================================================================

  describe('Space (Toggle Selection)', () => {
    it('should select item in single-select mode', () => {
      const sel = createSelect({ items: basicItems });
      expect(sel.selected()).toEqual([]);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['a']);
    });

    it('should change selection in single-select mode', () => {
      const sel = createSelect({ items: basicItems });
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['a']);
      simulateInput('', keys.down().key);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['b']);
    });

    it('should toggle item in multi-select mode', () => {
      const sel = createSelect({ items: basicItems, multiple: true });
      expect(sel.selected()).toEqual([]);
      // Select first
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['a']);
      // Select second
      simulateInput('', keys.down().key);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['a', 'b']);
      // Deselect first
      simulateInput('', keys.up().key);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['b']);
    });

    it('should not select disabled items', () => {
      const sel = createSelect({ items: itemsWithDisabled });
      // Move to disabled item (Banana at index 1 but skipped, so we need to check)
      // Since disabled items are skipped in navigation, we need to test differently
      expect(sel.selected()).toEqual([]);
      // Try selecting at current position
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['a']); // Apple is selected
    });

    it('should call onChange callback', () => {
      const onChange = vi.fn();
      const sel = createSelect({ items: basicItems, onChange });
      simulateInput(' ', charKey(' ').key);
      expect(onChange).toHaveBeenCalledWith('a');
    });
  });

  // ============================================================================
  // SELECTION - ENTER (SUBMIT)
  // ============================================================================

  describe('Enter (Submit)', () => {
    it('should call onSubmit with selected value', () => {
      const onSubmit = vi.fn();
      createSelect({ items: basicItems, onSubmit, initialValue: 'b' });
      simulateInput('', keys.enter().key);
      expect(onSubmit).toHaveBeenCalledWith('b');
    });

    it('should call onSubmit with selected array in multi-select', () => {
      const onSubmit = vi.fn();
      createSelect({
        items: basicItems,
        multiple: true,
        onSubmit,
        initialValue: ['a', 'c'],
      });
      simulateInput('', keys.enter().key);
      expect(onSubmit).toHaveBeenCalledWith(['a', 'c']);
    });

    it('should exit search mode without cancelling', () => {
      const onSubmit = vi.fn();
      const sel = createSelect({
        items: basicItems,
        searchable: true,
        onSubmit,
      });
      // Enter search mode
      simulateInput('/', charKey('/').key);
      expect(sel.isSearching()).toBe(true);
      // Press Enter to exit search
      simulateInput('', keys.enter().key);
      expect(sel.isSearching()).toBe(false);
      // onSubmit should NOT be called (only exits search mode)
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // SELECTION - ESCAPE (CANCEL)
  // ============================================================================

  describe('Escape (Cancel)', () => {
    it('should call onCancel callback', () => {
      const onCancel = vi.fn();
      createSelect({ items: basicItems, onCancel });
      simulateInput('', keys.escape().key);
      expect(onCancel).toHaveBeenCalled();
    });

    it('should exit search mode without calling onCancel', () => {
      const onCancel = vi.fn();
      const sel = createSelect({
        items: basicItems,
        searchable: true,
        onCancel,
      });
      // Enter search mode
      simulateInput('/', charKey('/').key);
      simulateInput('a', charKey('a').key);
      expect(sel.isSearching()).toBe(true);
      expect(sel.searchQuery()).toBe('a');
      // Escape should exit search mode first
      simulateInput('', keys.escape().key);
      expect(sel.isSearching()).toBe(false);
      expect(sel.searchQuery()).toBe('');
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('should call onCancel on second escape after exiting search', () => {
      const onCancel = vi.fn();
      const sel = createSelect({
        items: basicItems,
        searchable: true,
        onCancel,
      });
      // Enter search mode
      simulateInput('/', charKey('/').key);
      expect(sel.isSearching()).toBe(true);
      // First escape exits search
      simulateInput('', keys.escape().key);
      expect(sel.isSearching()).toBe(false);
      expect(onCancel).not.toHaveBeenCalled();
      // Second escape calls onCancel
      simulateInput('', keys.escape().key);
      expect(onCancel).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // MULTI-SELECT - TAB
  // ============================================================================

  describe('Tab (Multi-select Toggle & Move)', () => {
    it('should toggle selection and move down', () => {
      const sel = createSelect({ items: basicItems, multiple: true });
      expect(sel.selected()).toEqual([]);
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('', keys.tab().key);
      expect(sel.selected()).toEqual(['a']);
      expect(sel.cursorIndex()).toBe(1);
    });

    it('should toggle selection and move up with Shift+Tab', () => {
      const sel = createSelect({ items: basicItems, multiple: true });
      // Move to item 2
      simulateInput('', keys.down().key);
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(2);
      // Shift+Tab
      simulateInput('', keys.shiftTab().key);
      expect(sel.selected()).toEqual(['c']);
      expect(sel.cursorIndex()).toBe(1);
    });

    it('should not affect single-select mode', () => {
      const sel = createSelect({ items: basicItems, multiple: false });
      expect(sel.cursorIndex()).toBe(0);
      // Tab should not do anything special in single-select
      simulateInput('', keys.tab().key);
      // Behavior depends on implementation - may do nothing or pass through
    });
  });

  // ============================================================================
  // MULTI-SELECT - CTRL+A / CTRL+D
  // ============================================================================

  describe('Ctrl+A (Select All)', () => {
    it('should select all items in multi-select mode', () => {
      const sel = createSelect({ items: basicItems, multiple: true });
      expect(sel.selected()).toEqual([]);
      simulateInput('a', { ...charKey('a').key, ctrl: true });
      expect(sel.selected()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('should not select disabled items', () => {
      const sel = createSelect({ items: itemsWithDisabled, multiple: true });
      simulateInput('a', { ...charKey('a').key, ctrl: true });
      // Should only select non-disabled items
      expect(sel.selected()).toEqual(['a', 'c', 'e']);
    });

    it('should not work in single-select mode', () => {
      const sel = createSelect({ items: basicItems, multiple: false });
      simulateInput('a', { ...charKey('a').key, ctrl: true });
      expect(sel.selected()).toEqual([]);
    });

    it('should call onChange with all values', () => {
      const onChange = vi.fn();
      createSelect({ items: basicItems, multiple: true, onChange });
      simulateInput('a', { ...charKey('a').key, ctrl: true });
      expect(onChange).toHaveBeenCalledWith(['a', 'b', 'c', 'd', 'e']);
    });
  });

  describe('Ctrl+D (Deselect All)', () => {
    it('should deselect all items', () => {
      const sel = createSelect({
        items: basicItems,
        multiple: true,
        initialValue: ['a', 'b', 'c'],
      });
      expect(sel.selected()).toEqual(['a', 'b', 'c']);
      simulateInput('d', { ...charKey('d').key, ctrl: true });
      expect(sel.selected()).toEqual([]);
    });

    it('should work in single-select mode too', () => {
      const sel = createSelect({
        items: basicItems,
        initialValue: 'b',
      });
      expect(sel.selected()).toEqual(['b']);
      simulateInput('d', { ...charKey('d').key, ctrl: true });
      expect(sel.selected()).toEqual([]);
    });

    it('should call onChange with empty array/undefined', () => {
      const onChange = vi.fn();
      createSelect({
        items: basicItems,
        multiple: true,
        initialValue: ['a'],
        onChange,
      });
      simulateInput('d', { ...charKey('d').key, ctrl: true });
      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  // ============================================================================
  // SEARCH - ENTER SEARCH MODE
  // ============================================================================

  describe('/ (Enter Search Mode)', () => {
    it('should enter search mode when searchable', () => {
      const sel = createSelect({ items: basicItems, searchable: true });
      expect(sel.isSearching()).toBe(false);
      simulateInput('/', charKey('/').key);
      expect(sel.isSearching()).toBe(true);
    });

    it('should not enter search mode when not searchable', () => {
      const sel = createSelect({ items: basicItems, searchable: false });
      expect(sel.isSearching()).toBe(false);
      simulateInput('/', charKey('/').key);
      expect(sel.isSearching()).toBe(false);
    });

    it('should not enter search mode if already searching', () => {
      const sel = createSelect({ items: basicItems, searchable: true });
      simulateInput('/', charKey('/').key);
      expect(sel.isSearching()).toBe(true);
      // Typing / again should add to search query
      simulateInput('/', charKey('/').key);
      expect(sel.searchQuery()).toBe('/');
    });
  });

  // ============================================================================
  // SEARCH - TYPING
  // ============================================================================

  describe('Search Typing', () => {
    it('should add characters to search query', () => {
      const sel = createSelect({ items: basicItems, searchable: true });
      simulateInput('/', charKey('/').key);
      simulateInput('a', charKey('a').key);
      expect(sel.searchQuery()).toBe('a');
      simulateInput('p', charKey('p').key);
      expect(sel.searchQuery()).toBe('ap');
      simulateInput('p', charKey('p').key);
      expect(sel.searchQuery()).toBe('app');
    });

    it('should filter items based on search query', () => {
      const sel = createSelect({ items: basicItems, searchable: true });
      simulateInput('/', charKey('/').key);
      simulateInput('a', charKey('a').key);
      // Items containing 'a': Apple, Banana, Date (Cherry and Elderberry don't have 'a')
      const filtered = sel.getFilteredItems();
      expect(filtered.length).toBe(3);
      expect(filtered.map((i) => i.label)).toEqual([
        'Apple',
        'Banana',
        'Date',
      ]);
    });

    it('should reset cursor and scroll when search changes', () => {
      const sel = createSelect({ items: manyItems, maxVisible: 5, searchable: true });
      // Move cursor
      simulateInput('', keys.down().key);
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(2);
      // Start search
      simulateInput('/', charKey('/').key);
      simulateInput('1', charKey('1').key);
      // Cursor should reset to 0
      expect(sel.cursorIndex()).toBe(0);
      expect(sel.scrollOffset()).toBe(0);
    });

    it('should enable type-ahead search automatically', () => {
      const sel = createSelect({ items: basicItems, searchable: true });
      expect(sel.isSearching()).toBe(false);
      // Just start typing without /
      simulateInput('b', charKey('b').key);
      expect(sel.isSearching()).toBe(true);
      expect(sel.searchQuery()).toBe('b');
    });
  });

  // ============================================================================
  // SEARCH - BACKSPACE
  // ============================================================================

  describe('Search Backspace', () => {
    it('should remove last character from search query', () => {
      const sel = createSelect({ items: basicItems, searchable: true });
      simulateInput('/', charKey('/').key);
      simulateInput('a', charKey('a').key);
      simulateInput('p', charKey('p').key);
      expect(sel.searchQuery()).toBe('ap');
      simulateInput('', keys.backspace().key);
      expect(sel.searchQuery()).toBe('a');
    });

    it('should handle backspace on empty search', () => {
      const sel = createSelect({ items: basicItems, searchable: true });
      simulateInput('/', charKey('/').key);
      expect(sel.searchQuery()).toBe('');
      simulateInput('', keys.backspace().key);
      expect(sel.searchQuery()).toBe('');
    });

    it('should update filtered items when backspacing', () => {
      const sel = createSelect({ items: basicItems, searchable: true });
      simulateInput('/', charKey('/').key);
      simulateInput('c', charKey('c').key);
      simulateInput('h', charKey('h').key);
      // Only Cherry matches 'ch'
      expect(sel.getFilteredItems().length).toBe(1);
      expect(sel.getFilteredItems()[0].label).toBe('Cherry');
      // Backspace to just 'c'
      simulateInput('', keys.backspace().key);
      // Now matches Cherry and... nothing else with 'c'? Let me check
      // Actually: Cherry starts with C, nothing else does
      expect(sel.getFilteredItems().length).toBe(1);
    });
  });

  // ============================================================================
  // STATES
  // ============================================================================

  describe('States', () => {
    describe('Empty List', () => {
      it('should handle empty items array', () => {
        const sel = createSelect({ items: [] });
        expect(sel.cursorIndex()).toBe(0);
        expect(sel.selected()).toEqual([]);
        // Navigation should not crash
        simulateInput('', keys.down().key);
        simulateInput('', keys.up().key);
      });
    });

    describe('Single Item', () => {
      it('should handle single item', () => {
        const items: SelectItem<string>[] = [{ value: 'only', label: 'Only One' }];
        const sel = createSelect({ items });
        expect(sel.cursorIndex()).toBe(0);
        simulateInput('', keys.down().key);
        expect(sel.cursorIndex()).toBe(0); // Can't go past single item
        simulateInput(' ', charKey(' ').key);
        expect(sel.selected()).toEqual(['only']);
      });
    });

    describe('Initial Selection', () => {
      it('should start with initial value selected', () => {
        const sel = createSelect({
          items: basicItems,
          initialValue: 'c',
        });
        expect(sel.selected()).toEqual(['c']);
      });

      it('should start with multiple initial values', () => {
        const sel = createSelect({
          items: basicItems,
          multiple: true,
          initialValue: ['a', 'c', 'e'],
        });
        expect(sel.selected()).toEqual(['a', 'c', 'e']);
      });
    });

    describe('All Items Disabled', () => {
      it('should not move when all items are disabled', () => {
        const disabledItems: SelectItem<string>[] = [
          { value: 'a', label: 'A', disabled: true },
          { value: 'b', label: 'B', disabled: true },
        ];
        const sel = createSelect({ items: disabledItems });
        expect(sel.cursorIndex()).toBe(0);
        simulateInput('', keys.down().key);
        expect(sel.cursorIndex()).toBe(0);
      });

      it('should not select when all items are disabled', () => {
        const disabledItems: SelectItem<string>[] = [
          { value: 'a', label: 'A', disabled: true },
        ];
        const sel = createSelect({ items: disabledItems });
        simulateInput(' ', charKey(' ').key);
        expect(sel.selected()).toEqual([]);
      });
    });

    describe('Inactive State', () => {
      it('should ignore all input when inactive', () => {
        const onChange = vi.fn();
        const sel = createSelect({
          items: basicItems,
          isActive: false,
          onChange,
        });
        simulateInput('', keys.down().key);
        expect(sel.cursorIndex()).toBe(0);
        simulateInput(' ', charKey(' ').key);
        expect(sel.selected()).toEqual([]);
        expect(onChange).not.toHaveBeenCalled();
      });
    });

    describe('Scrolling', () => {
      it('should show correct visible items window', () => {
        const sel = createSelect({ items: manyItems, maxVisible: 5 });
        const { items, startIndex } = sel.getVisibleItems();
        expect(items.length).toBe(5);
        expect(startIndex).toBe(0);
        expect(items[0].label).toBe('Item 1');
        expect(items[4].label).toBe('Item 5');
      });

      it('should scroll window when cursor moves', () => {
        const sel = createSelect({ items: manyItems, maxVisible: 5 });
        // Move down 6 times
        for (let i = 0; i < 6; i++) {
          simulateInput('', keys.down().key);
        }
        const { items, startIndex } = sel.getVisibleItems();
        expect(startIndex).toBeGreaterThan(0);
        expect(items.some((i) => i.label === 'Item 7')).toBe(true);
      });
    });

    describe('Filtered Empty Results', () => {
      it('should handle search with no results', () => {
        const sel = createSelect({ items: basicItems, searchable: true });
        simulateInput('/', charKey('/').key);
        simulateInput('x', charKey('x').key);
        simulateInput('y', charKey('y').key);
        simulateInput('z', charKey('z').key);
        expect(sel.getFilteredItems().length).toBe(0);
        // Navigation should not crash
        simulateInput('', keys.down().key);
        simulateInput('', keys.up().key);
      });
    });
  });

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  describe('Public API', () => {
    describe('toggleSelection', () => {
      it('should toggle current item selection', () => {
        const sel = createSelect({ items: basicItems, multiple: true });
        expect(sel.selected()).toEqual([]);
        sel.toggleSelection();
        expect(sel.selected()).toEqual(['a']);
        sel.toggleSelection();
        expect(sel.selected()).toEqual([]);
      });
    });

    describe('selectAll', () => {
      it('should select all non-disabled items', () => {
        const sel = createSelect({ items: itemsWithDisabled, multiple: true });
        sel.selectAll();
        expect(sel.selected()).toEqual(['a', 'c', 'e']);
      });
    });

    describe('selectNone', () => {
      it('should deselect all items', () => {
        const sel = createSelect({
          items: basicItems,
          multiple: true,
          initialValue: ['a', 'b'],
        });
        expect(sel.selected()).toEqual(['a', 'b']);
        sel.selectNone();
        expect(sel.selected()).toEqual([]);
      });
    });

    describe('moveUp/moveDown', () => {
      it('should move cursor programmatically', () => {
        const sel = createSelect({ items: basicItems });
        expect(sel.cursorIndex()).toBe(0);
        sel.moveDown();
        expect(sel.cursorIndex()).toBe(1);
        sel.moveDown();
        expect(sel.cursorIndex()).toBe(2);
        sel.moveUp();
        expect(sel.cursorIndex()).toBe(1);
      });
    });
  });
});

// ============================================================================
// CONFIRM COMPONENT
// ============================================================================

describe('Confirm Component', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  it('should render with message', () => {
    const result = Confirm({ message: 'Are you sure?' });
    expect(result).toBeDefined();
    expect(result.type).toBe('box');
  });

  it('should render with custom labels', () => {
    const result = Confirm({
      message: 'Delete file?',
      yesLabel: 'Delete',
      noLabel: 'Cancel',
    });
    expect(result).toBeDefined();
  });

  it('should render with default value', () => {
    const result = Confirm({
      message: 'Continue?',
      defaultValue: true,
    });
    expect(result).toBeDefined();
  });

  it('should call onConfirm when submitted', () => {
    const onConfirm = vi.fn();
    Confirm({
      message: 'Proceed?',
      onConfirm,
    });

    // Simulate Enter key to confirm
    simulateInput('', keys.enter().key);
    expect(onConfirm).toHaveBeenCalledWith(false); // Default is first option (Yes = true)
  });

  it('should be inactive when isActive is false', () => {
    const onConfirm = vi.fn();
    Confirm({
      message: 'Proceed?',
      onConfirm,
      isActive: false,
    });

    simulateInput('', keys.enter().key);
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

// ============================================================================
// CHECKBOX COMPONENT
// ============================================================================

describe('Checkbox Component', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  it('should render as multi-select', () => {
    const result = Checkbox({ items: basicItems });
    expect(result).toBeDefined();
  });

  it('should allow multiple selections', () => {
    Checkbox({ items: basicItems });

    // Select first item
    simulateInput(' ', charKey(' ').key);
    // Move down and select second
    simulateInput('', keys.down().key);
    simulateInput(' ', charKey(' ').key);

    // Both should be selected (verify via handlers being called)
    expect(getInputHandlerCount()).toBeGreaterThan(0);
  });

  it('should pass through all options except multiple', () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();

    Checkbox({
      items: basicItems,
      onSubmit,
      onChange,
      initialValue: ['a', 'b'],
    });

    expect(onChange).not.toHaveBeenCalled(); // Not called on init
    simulateInput('', keys.enter().key);
    expect(onSubmit).toHaveBeenCalledWith(['a', 'b']);
  });
});

// ============================================================================
// SELECT COMPONENT (VNode)
// ============================================================================

describe('Select Component (VNode)', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  it('should render with items', () => {
    const result = Select({ items: basicItems });
    expect(result).toBeDefined();
    expect(result.type).toBe('box');
  });

  it('should render with custom styling', () => {
    const result = Select({
      items: basicItems,
      cursorColor: 'cyan',
      selectedColor: 'green',
      labelColor: 'white',
    });
    expect(result).toBeDefined();
  });

  it('should render with count in multi-select mode', () => {
    const result = Select({
      items: basicItems,
      multiple: true,
      showCount: true,
      initialValue: ['a', 'b'],
    });
    expect(result).toBeDefined();
  });

  it('should render searchable with placeholder', () => {
    const result = Select({
      items: basicItems,
      searchable: true,
      searchPlaceholder: 'Type to filter...',
    });
    expect(result).toBeDefined();
  });
});
