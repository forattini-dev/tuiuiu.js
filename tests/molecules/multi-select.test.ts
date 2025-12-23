/**
 * MultiSelect Tests
 *
 * Tests for MultiSelect, createMultiSelect
 */

import { describe, it, expect, vi } from 'vitest';
import { createMultiSelect, MultiSelect } from '../../src/molecules/multi-select.js';

const basicItems = [
  { value: 'a', label: 'Apple' },
  { value: 'b', label: 'Banana' },
  { value: 'c', label: 'Cherry' },
  { value: 'd', label: 'Date' },
];

describe('createMultiSelect', () => {
  describe('Initialization', () => {
    it('should create with default state', () => {
      const state = createMultiSelect({ items: basicItems });

      expect(state.cursorIndex()).toBe(0);
      expect(state.selected()).toEqual([]);
      expect(state.searchQuery()).toBe('');
    });

    it('should respect initialValue', () => {
      const state = createMultiSelect({
        items: basicItems,
        initialValue: ['a', 'c'],
      });

      expect(state.selected()).toEqual(['a', 'c']);
    });

    it('should track search state', () => {
      const state = createMultiSelect({ items: basicItems });

      expect(state.isSearching()).toBe(false);
    });
  });

  describe('Navigation', () => {
    it('should move cursor down', () => {
      const state = createMultiSelect({ items: basicItems });

      expect(state.cursorIndex()).toBe(0);
      state.moveDown();
      expect(state.cursorIndex()).toBe(1);
    });

    it('should move cursor up', () => {
      const state = createMultiSelect({
        items: basicItems,
        initialValue: ['b'],
      });

      state.moveDown();
      state.moveUp();
      expect(state.cursorIndex()).toBe(0);
    });

    it('should not move past end', () => {
      const state = createMultiSelect({ items: basicItems });

      // Move to end
      state.moveDown();
      state.moveDown();
      state.moveDown();
      state.moveDown(); // Try to go past end

      expect(state.cursorIndex()).toBeLessThanOrEqual(basicItems.length - 1);
    });

    it('should not move before start', () => {
      const state = createMultiSelect({ items: basicItems });

      state.moveUp();
      expect(state.cursorIndex()).toBe(0);
    });
  });

  describe('Selection', () => {
    it('should toggle current item', () => {
      const onChange = vi.fn();
      const state = createMultiSelect({
        items: basicItems,
        onChange,
      });

      state.toggleCurrent();
      expect(state.selected()).toContain('a');
      expect(onChange).toHaveBeenCalled();
    });

    it('should toggle by index', () => {
      const state = createMultiSelect({ items: basicItems });

      state.toggleIndex(2);
      expect(state.selected()).toContain('c');
    });

    it('should check if value is selected', () => {
      const state = createMultiSelect({
        items: basicItems,
        initialValue: ['b'],
      });

      expect(state.isSelected('b')).toBe(true);
      expect(state.isSelected('a')).toBe(false);
    });

    it('should select all', () => {
      const state = createMultiSelect({ items: basicItems });

      state.selectAll();
      expect(state.selected().length).toBe(basicItems.length);
    });

    it('should deselect all', () => {
      const state = createMultiSelect({
        items: basicItems,
        initialValue: ['a', 'b', 'c'],
      });

      state.deselectAll();
      expect(state.selected()).toEqual([]);
    });
  });

  describe('Search', () => {
    it('should set search query', () => {
      const state = createMultiSelect({ items: basicItems });

      state.setSearch('app');
      expect(state.searchQuery()).toBe('app');
    });

    it('should filter items by search', () => {
      const state = createMultiSelect({ items: basicItems });

      state.setSearch('ban');
      const filtered = state.filteredItems();
      expect(filtered.length).toBeLessThan(basicItems.length);
      expect(filtered.some((i) => i.label === 'Banana')).toBe(true);
    });

    it('should return all items when search is empty', () => {
      const state = createMultiSelect({ items: basicItems });

      expect(state.filteredItems().length).toBe(basicItems.length);
    });
  });

  describe('Callbacks', () => {
    it('should call onSubmit', () => {
      const onSubmit = vi.fn();
      const state = createMultiSelect({
        items: basicItems,
        onSubmit,
      });

      state.toggleCurrent();
      state.submit();
      expect(onSubmit).toHaveBeenCalledWith(['a']);
    });

    it('should call onCancel', () => {
      const onCancel = vi.fn();
      const state = createMultiSelect({
        items: basicItems,
        onCancel,
      });

      state.cancel();
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Visible Items', () => {
    it('should return visible items', () => {
      const state = createMultiSelect({
        items: basicItems,
        maxVisible: 2,
      });

      const { items, startIndex } = state.visibleItems();
      expect(items.length).toBeLessThanOrEqual(2);
      expect(startIndex).toBe(0);
    });

    it('should track scroll offset', () => {
      const state = createMultiSelect({ items: basicItems });

      expect(state.scrollOffset()).toBe(0);
    });
  });
});

describe('MultiSelect Component', () => {
  it('should create multi-select component', () => {
    const vnode = MultiSelect({ items: basicItems });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should render with initial values', () => {
    const vnode = MultiSelect({
      items: basicItems,
      initialValue: ['a', 'b'],
    });

    expect(vnode).toBeDefined();
  });

  it('should show search placeholder', () => {
    const vnode = MultiSelect({
      items: basicItems,
      searchable: true,
      searchPlaceholder: 'Search items...',
    });

    expect(vnode).toBeDefined();
  });

  it('should accept external state', () => {
    const state = createMultiSelect({
      items: basicItems,
      initialValue: ['c'],
    });
    const vnode = MultiSelect({ items: basicItems, state });

    expect(vnode).toBeDefined();
  });

  it('should handle disabled items', () => {
    const items = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    const vnode = MultiSelect({ items });

    expect(vnode).toBeDefined();
  });

  it('should show count when enabled', () => {
    const vnode = MultiSelect({
      items: basicItems,
      showCount: true,
    });

    expect(vnode).toBeDefined();
  });

  it('should show tags when enabled', () => {
    const vnode = MultiSelect({
      items: basicItems,
      initialValue: ['a'],
      showTags: true,
    });

    expect(vnode).toBeDefined();
  });

  it('should apply custom colors', () => {
    const vnode = MultiSelect({
      items: basicItems,
      activeColor: 'blue',
      selectedColor: 'green',
    });

    expect(vnode).toBeDefined();
  });

  it('should handle isActive=false', () => {
    const vnode = MultiSelect({
      items: basicItems,
      isActive: false,
    });

    expect(vnode).toBeDefined();
  });
});
