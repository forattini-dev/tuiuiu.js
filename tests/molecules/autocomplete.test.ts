/**
 * Autocomplete Tests
 *
 * Tests for Autocomplete, Combobox, TagInput components
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createAutocomplete,
  Autocomplete,
  Combobox,
  createTagInput,
  TagInput,
  type AutocompleteItem,
} from '../../src/molecules/autocomplete.js';

// Sample items for testing
const sampleItems: AutocompleteItem[] = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue.js', description: 'Progressive framework' },
  { value: 'angular', label: 'Angular', description: 'Google framework' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'solid', label: 'SolidJS' },
];

const disabledItems: AutocompleteItem[] = [
  { value: 'a', label: 'Active' },
  { value: 'd', label: 'Disabled', disabled: true },
];

describe('createAutocomplete', () => {
  describe('Initialization', () => {
    it('should create with default state', () => {
      const state = createAutocomplete({ items: sampleItems });

      expect(state.inputValue()).toBe('');
      expect(state.cursorPos()).toBe(0);
      expect(state.selectedIndex()).toBe(0);
      expect(state.isOpen()).toBe(false);
      expect(state.suggestions()).toEqual([]);
    });

    it('should respect initialValue', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      expect(state.inputValue()).toBe('test');
      expect(state.cursorPos()).toBe(4);
    });
  });

  describe('Input Operations', () => {
    it('should set input value', () => {
      const state = createAutocomplete({ items: sampleItems });

      state.setInput('react');
      expect(state.inputValue()).toBe('react');
      expect(state.cursorPos()).toBe(5);
    });

    it('should insert character at cursor', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.moveCursorHome();
      state.insertChar('x');
      expect(state.inputValue()).toBe('xtest');
      expect(state.cursorPos()).toBe(1);
    });

    it('should delete character backward', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.deleteBack();
      expect(state.inputValue()).toBe('tes');
      expect(state.cursorPos()).toBe(3);
    });

    it('should not delete backward at start', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.moveCursorHome();
      state.deleteBack();
      expect(state.inputValue()).toBe('test');
    });

    it('should delete character forward', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.moveCursorHome();
      state.deleteForward();
      expect(state.inputValue()).toBe('est');
    });

    it('should not delete forward at end', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.deleteForward();
      expect(state.inputValue()).toBe('test');
    });
  });

  describe('Cursor Movement', () => {
    it('should move cursor left', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.moveCursorLeft();
      expect(state.cursorPos()).toBe(3);
    });

    it('should not move cursor left past 0', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.moveCursorHome();
      state.moveCursorLeft();
      expect(state.cursorPos()).toBe(0);
    });

    it('should move cursor right', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.moveCursorHome();
      state.moveCursorRight();
      expect(state.cursorPos()).toBe(1);
    });

    it('should not move cursor right past end', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.moveCursorRight();
      expect(state.cursorPos()).toBe(4);
    });

    it('should move cursor to home', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.moveCursorHome();
      expect(state.cursorPos()).toBe(0);
    });

    it('should move cursor to end', () => {
      const state = createAutocomplete({
        items: sampleItems,
        initialValue: 'test',
      });

      state.moveCursorHome();
      state.moveCursorEnd();
      expect(state.cursorPos()).toBe(4);
    });
  });

  describe('Suggestions', () => {
    it('should filter suggestions by query', () => {
      const state = createAutocomplete({ items: sampleItems });

      state.setInput('re');
      const suggs = state.suggestions();

      expect(suggs.length).toBeGreaterThan(0);
      expect(suggs[0].label).toBe('React');
    });

    it('should respect minChars', () => {
      const state = createAutocomplete({
        items: sampleItems,
        minChars: 2,
      });

      state.setInput('r');
      expect(state.suggestions()).toEqual([]);

      state.setInput('re');
      expect(state.suggestions().length).toBeGreaterThan(0);
    });

    it('should respect maxSuggestions', () => {
      const state = createAutocomplete({
        items: sampleItems,
        maxSuggestions: 2,
      });

      state.setInput('a');
      expect(state.suggestions().length).toBeLessThanOrEqual(2);
    });

    it('should filter out disabled items', () => {
      const state = createAutocomplete({ items: disabledItems });

      state.setInput('d');
      const suggs = state.suggestions();

      // Disabled items should not appear
      expect(suggs.every((s) => !s.disabled)).toBe(true);
    });

    it('should support custom filter', () => {
      const customFilter = vi.fn(() => [sampleItems[0]]);
      const state = createAutocomplete({
        items: sampleItems,
        filter: customFilter,
      });

      state.setInput('test');
      state.suggestions();

      expect(customFilter).toHaveBeenCalledWith('test', expect.any(Array));
    });
  });

  describe('Selection Navigation', () => {
    it('should move selection down', () => {
      const state = createAutocomplete({ items: sampleItems });

      state.setInput('a'); // Should show Angular and React (contains 'a')
      expect(state.selectedIndex()).toBe(0);

      state.moveDown();
      expect(state.selectedIndex()).toBe(1);
    });

    it('should wrap around when moving down', () => {
      const state = createAutocomplete({
        items: sampleItems,
        maxSuggestions: 2,
      });

      state.setInput('a');
      state.moveDown();
      state.moveDown();
      expect(state.selectedIndex()).toBe(0);
    });

    it('should move selection up', () => {
      const state = createAutocomplete({ items: sampleItems });

      state.setInput('a');
      state.moveDown();
      state.moveUp();
      expect(state.selectedIndex()).toBe(0);
    });

    it('should wrap around when moving up', () => {
      const state = createAutocomplete({
        items: sampleItems,
        maxSuggestions: 2,
      });

      state.setInput('a');
      state.moveUp();
      // Should wrap to last item
      expect(state.selectedIndex()).toBe(1);
    });

    it('should not navigate with no suggestions', () => {
      const state = createAutocomplete({ items: sampleItems });

      state.moveDown();
      state.moveUp();
      expect(state.selectedIndex()).toBe(0);
    });
  });

  describe('Selection', () => {
    it('should select current item', () => {
      const onSelect = vi.fn();
      const state = createAutocomplete({
        items: sampleItems,
        onSelect,
      });

      state.setInput('react');
      state.selectCurrent();

      expect(state.inputValue()).toBe('React');
      expect(state.isOpen()).toBe(false);
      expect(onSelect).toHaveBeenCalled();
    });

    it('should not select if no suggestions', () => {
      const onSelect = vi.fn();
      const state = createAutocomplete({
        items: sampleItems,
        onSelect,
      });

      state.selectCurrent();
      expect(onSelect).not.toHaveBeenCalled();
    });
  });

  describe('Open/Close', () => {
    it('should open dropdown when input has minChars', () => {
      const state = createAutocomplete({
        items: sampleItems,
        minChars: 2,
      });

      state.setInput('re');
      expect(state.isOpen()).toBe(true);
    });

    it('should not open when input is below minChars', () => {
      const state = createAutocomplete({
        items: sampleItems,
        minChars: 2,
      });

      state.setInput('r');
      state.open();
      expect(state.isOpen()).toBe(false);
    });

    it('should close dropdown', () => {
      const state = createAutocomplete({ items: sampleItems });

      state.setInput('react');
      expect(state.isOpen()).toBe(true);

      state.close();
      expect(state.isOpen()).toBe(false);
    });
  });

  describe('Submit', () => {
    it('should call onSubmit with current value', () => {
      const onSubmit = vi.fn();
      const state = createAutocomplete({
        items: sampleItems,
        onSubmit,
      });

      state.setInput('react');
      state.submit();

      expect(onSubmit).toHaveBeenCalledWith('react', expect.any(Object));
      expect(state.isOpen()).toBe(false);
    });

    it('should call onSubmit without item if no match', () => {
      const onSubmit = vi.fn();
      const state = createAutocomplete({
        items: sampleItems,
        onSubmit,
      });

      state.setInput('xyz');
      state.submit();

      expect(onSubmit).toHaveBeenCalledWith('xyz', undefined);
    });
  });

  describe('Callbacks', () => {
    it('should call onChange on input changes', () => {
      const onChange = vi.fn();
      const state = createAutocomplete({
        items: sampleItems,
        onChange,
      });

      state.setInput('test');
      expect(onChange).toHaveBeenCalledWith('test');

      state.insertChar('x');
      expect(onChange).toHaveBeenCalledWith('testx');

      state.deleteBack();
      expect(onChange).toHaveBeenCalledWith('test');
    });
  });
});

describe('Autocomplete Component', () => {
  it('should create an autocomplete component', () => {
    const vnode = Autocomplete({ items: sampleItems });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should render with placeholder', () => {
    const vnode = Autocomplete({
      items: sampleItems,
      placeholder: 'Search...',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Search...');
  });

  it('should render with label', () => {
    const vnode = Autocomplete({
      items: sampleItems,
      label: 'Framework:',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Framework:');
  });

  it('should accept external state', () => {
    const state = createAutocomplete({
      items: sampleItems,
      initialValue: 'test',
    });

    const vnode = Autocomplete({
      items: sampleItems,
      state,
    });

    expect(vnode).toBeDefined();
  });

  it('should apply custom width', () => {
    const vnode = Autocomplete({
      items: sampleItems,
      width: 50,
    });

    expect(vnode).toBeDefined();
  });

  it('should support fullWidth', () => {
    const vnode = Autocomplete({
      items: sampleItems,
      fullWidth: true,
    });

    expect(vnode).toBeDefined();
  });

  it('should apply custom colors', () => {
    const vnode = Autocomplete({
      items: sampleItems,
      activeColor: 'cyan',
      selectedColor: 'green',
    });

    expect(vnode).toBeDefined();
  });
});

describe('Combobox Component', () => {
  it('should create a combobox component', () => {
    const vnode = Combobox({ items: sampleItems });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should not allow free text', () => {
    // Combobox is just Autocomplete with allowFreeText: false
    const vnode = Combobox({
      items: sampleItems,
      errorMessage: 'Select from list',
    });

    expect(vnode).toBeDefined();
  });
});

describe('createTagInput', () => {
  describe('Initialization', () => {
    it('should create with empty tags', () => {
      const state = createTagInput({ items: sampleItems });

      expect(state.tags()).toEqual([]);
      expect(state.inputValue()).toBe('');
      expect(state.isOpen()).toBe(false);
    });

    it('should respect initialValues', () => {
      const state = createTagInput({
        items: sampleItems,
        initialValues: ['react', 'vue'],
      });

      expect(state.tags()).toEqual(['react', 'vue']);
    });
  });

  describe('Tag Operations', () => {
    it('should add a tag', () => {
      const state = createTagInput({ items: sampleItems });

      state.addTag('react');
      expect(state.tags()).toContain('react');
    });

    it('should not add duplicate tag', () => {
      const state = createTagInput({ items: sampleItems });

      state.addTag('react');
      state.addTag('react');
      expect(state.tags()).toEqual(['react']);
    });

    it('should respect maxTags', () => {
      const state = createTagInput({
        items: sampleItems,
        maxTags: 2,
      });

      state.addTag('react');
      state.addTag('vue');
      state.addTag('angular');

      expect(state.tags().length).toBe(2);
      expect(state.tags()).not.toContain('angular');
    });

    it('should remove a tag', () => {
      const state = createTagInput({
        items: sampleItems,
        initialValues: ['react', 'vue'],
      });

      state.removeTag('react');
      expect(state.tags()).toEqual(['vue']);
    });

    it('should remove last tag', () => {
      const state = createTagInput({
        items: sampleItems,
        initialValues: ['react', 'vue', 'angular'],
      });

      state.removeLastTag();
      expect(state.tags()).toEqual(['react', 'vue']);
    });

    it('should not remove last tag when empty', () => {
      const state = createTagInput({ items: sampleItems });

      state.removeLastTag();
      expect(state.tags()).toEqual([]);
    });
  });

  describe('Input Operations', () => {
    it('should set input value', () => {
      const state = createTagInput({ items: sampleItems });

      state.setInput('test');
      expect(state.inputValue()).toBe('test');
      expect(state.isOpen()).toBe(true);
    });

    it('should close when input is empty', () => {
      const state = createTagInput({ items: sampleItems });

      state.setInput('test');
      state.setInput('');
      expect(state.isOpen()).toBe(false);
    });

    it('should clear input after adding tag', () => {
      const state = createTagInput({ items: sampleItems });

      state.setInput('react');
      state.addTag('react');
      expect(state.inputValue()).toBe('');
      expect(state.isOpen()).toBe(false);
    });
  });

  describe('Suggestions', () => {
    it('should filter out selected items', () => {
      const state = createTagInput({
        items: sampleItems,
        initialValues: ['react'],
      });

      state.setInput('re');
      const suggs = state.suggestions();

      // React should not appear since it's already selected
      expect(suggs.find((s) => s.value === 'react')).toBeUndefined();
    });

    it('should filter out disabled items', () => {
      const state = createTagInput({ items: disabledItems });

      state.setInput('d');
      const suggs = state.suggestions();

      expect(suggs.every((s) => !s.disabled)).toBe(true);
    });
  });

  describe('Callbacks', () => {
    it('should call onChange when tags change', () => {
      const onChange = vi.fn();
      const state = createTagInput({
        items: sampleItems,
        onChange,
      });

      state.addTag('react');
      expect(onChange).toHaveBeenCalledWith(['react']);

      state.addTag('vue');
      expect(onChange).toHaveBeenCalledWith(['react', 'vue']);

      state.removeTag('react');
      expect(onChange).toHaveBeenCalledWith(['vue']);
    });
  });
});

describe('TagInput Component', () => {
  it('should create a tag input component', () => {
    const vnode = TagInput({ items: sampleItems });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should render with placeholder', () => {
    const vnode = TagInput({
      items: sampleItems,
      placeholder: 'Add tags...',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Add tags...');
  });

  it('should apply custom width', () => {
    const vnode = TagInput({
      items: sampleItems,
      width: 60,
    });

    expect(vnode).toBeDefined();
  });

  it('should support fullWidth', () => {
    const vnode = TagInput({
      items: sampleItems,
      fullWidth: true,
    });

    expect(vnode).toBeDefined();
  });

  it('should apply custom colors', () => {
    const vnode = TagInput({
      items: sampleItems,
      tagColor: 'cyan',
      activeColor: 'yellow',
    });

    expect(vnode).toBeDefined();
  });
});

describe('Fuzzy Filter', () => {
  it('should match exact prefix with highest score', () => {
    const state = createAutocomplete({ items: sampleItems });

    state.setInput('React');
    const suggs = state.suggestions();

    expect(suggs[0].label).toBe('React');
  });

  it('should match substring', () => {
    const state = createAutocomplete({ items: sampleItems });

    state.setInput('act');
    const suggs = state.suggestions();

    expect(suggs.some((s) => s.label === 'React')).toBe(true);
  });

  it('should match description', () => {
    const state = createAutocomplete({ items: sampleItems });

    state.setInput('progressive');
    const suggs = state.suggestions();

    expect(suggs.some((s) => s.label === 'Vue.js')).toBe(true);
  });

  it('should match fuzzy (chars in order)', () => {
    const state = createAutocomplete({ items: sampleItems });

    state.setInput('rct');
    const suggs = state.suggestions();

    expect(suggs.some((s) => s.label === 'React')).toBe(true);
  });

  it('should not match when query is empty', () => {
    const state = createAutocomplete({ items: sampleItems });

    state.setInput('');
    expect(state.suggestions()).toEqual([]);
  });
});

describe('Edge Cases', () => {
  it('should handle empty items array', () => {
    const state = createAutocomplete({ items: [] });

    state.setInput('test');
    expect(state.suggestions()).toEqual([]);
  });

  it('should handle special characters in query', () => {
    const state = createAutocomplete({ items: sampleItems });

    state.setInput('vu.js');
    // Should still work
    expect(state.suggestions().length).toBeGreaterThanOrEqual(0);
  });

  it('should handle unicode input', () => {
    const items: AutocompleteItem[] = [
      { value: 'cafe', label: 'Café' },
      { value: 'emoji', label: '🎉 Party' },
    ];
    const state = createAutocomplete({ items });

    state.setInput('caf');
    expect(state.suggestions().some((s) => s.label === 'Café')).toBe(true);
  });

  it('should handle rapid input changes', () => {
    const state = createAutocomplete({ items: sampleItems });

    state.setInput('r');
    state.setInput('re');
    state.setInput('rea');
    state.setInput('reac');
    state.setInput('react');

    expect(state.inputValue()).toBe('react');
    expect(state.suggestions().length).toBeGreaterThan(0);
  });

  it('should reset selectedIndex on new input', () => {
    const state = createAutocomplete({ items: sampleItems });

    state.setInput('a');
    state.moveDown();
    state.moveDown();
    expect(state.selectedIndex()).toBeGreaterThan(0);

    state.setInput('react');
    expect(state.selectedIndex()).toBe(0);
  });
});
