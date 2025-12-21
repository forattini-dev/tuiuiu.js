/**
 * Checkbox Component - Keyboard Interaction Tests
 *
 * Checkbox is a wrapper around Select with multiple=true.
 * Tests focus on multi-select specific interactions:
 * - Navigation: Up/Down arrows, vim keys
 * - Toggle: Space key
 * - Select/Deselect All: Ctrl+A, Ctrl+D, a/n keys
 * - Submit: Enter
 * - Cancel: Escape
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Checkbox } from '../../src/design-system/forms/select.js';
import { createSelect, type SelectItem } from '../../src/design-system/forms/select.js';
import { emitInput, clearInputHandlers } from '../../src/hooks/context.js';
import type { Key } from '../../src/hooks/types.js';
import { keys, charKey } from '../helpers/keyboard.js';

// Helper to simulate input via EventEmitter
function simulateInput(input: string, key: Key): void {
  emitInput(input, key);
}

// Test items
const checkboxItems: SelectItem<string>[] = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2' },
  { value: 'opt3', label: 'Option 3' },
  { value: 'opt4', label: 'Option 4' },
];

const itemsWithDisabled: SelectItem<string>[] = [
  { value: 'opt1', label: 'Option 1' },
  { value: 'opt2', label: 'Option 2', disabled: true },
  { value: 'opt3', label: 'Option 3' },
];

describe('Checkbox Keyboard Interactions', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  // ============================================================================
  // NAVIGATION
  // ============================================================================

  describe('Navigation', () => {
    it('should navigate down with down arrow', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(1);
    });

    it('should navigate up with up arrow', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      simulateInput('', keys.down().key);
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(2);
      simulateInput('', keys.up().key);
      expect(sel.cursorIndex()).toBe(1);
    });

    it('should navigate with vim j/k keys', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('j', charKey('j').key);
      expect(sel.cursorIndex()).toBe(1);
      simulateInput('k', charKey('k').key);
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should go to top with Home', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      simulateInput('', keys.end().key);
      expect(sel.cursorIndex()).toBe(3);
      simulateInput('', keys.home().key);
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should go to bottom with End', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('', keys.end().key);
      expect(sel.cursorIndex()).toBe(3);
    });

    it('should skip disabled items', () => {
      const sel = createSelect({ items: itemsWithDisabled, multiple: true });
      expect(sel.cursorIndex()).toBe(0);
      // Move down should skip disabled opt2 and land on opt3
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(2);
    });
  });

  // ============================================================================
  // TOGGLE SELECTION - SPACE
  // ============================================================================

  describe('Space (Toggle)', () => {
    it('should check item with Space', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      expect(sel.selected()).toEqual([]);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['opt1']);
    });

    it('should uncheck item with Space', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true, initialValue: ['opt1'] });
      expect(sel.selected()).toEqual(['opt1']);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual([]);
    });

    it('should toggle multiple items independently', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      // Check first
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['opt1']);
      // Move and check second
      simulateInput('', keys.down().key);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['opt1', 'opt2']);
      // Uncheck first
      simulateInput('', keys.up().key);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['opt2']);
    });

    it('should not toggle disabled items', () => {
      const sel = createSelect({ items: itemsWithDisabled, multiple: true });
      // Try to navigate to disabled item (it will be skipped)
      // So we can't directly test toggling disabled items via Space
      // The select will skip disabled items automatically
      expect(sel.selected()).toEqual([]);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['opt1']); // First non-disabled item
    });

    it('should call onChange when toggling', () => {
      const onChange = vi.fn();
      createSelect({ items: checkboxItems, multiple: true, onChange });
      simulateInput(' ', charKey(' ').key);
      expect(onChange).toHaveBeenCalledWith(['opt1']);
    });
  });

  // ============================================================================
  // SELECT ALL - CTRL+A
  // ============================================================================

  describe('Ctrl+A (Select All)', () => {
    it('should select all items', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      expect(sel.selected()).toEqual([]);
      simulateInput('a', { ...charKey('a').key, ctrl: true });
      expect(sel.selected()).toEqual(['opt1', 'opt2', 'opt3', 'opt4']);
    });

    it('should not select disabled items', () => {
      const sel = createSelect({ items: itemsWithDisabled, multiple: true });
      simulateInput('a', { ...charKey('a').key, ctrl: true });
      expect(sel.selected()).toEqual(['opt1', 'opt3']);
    });

    it('should call onChange with all values', () => {
      const onChange = vi.fn();
      createSelect({ items: checkboxItems, multiple: true, onChange });
      simulateInput('a', { ...charKey('a').key, ctrl: true });
      expect(onChange).toHaveBeenCalledWith(['opt1', 'opt2', 'opt3', 'opt4']);
    });
  });

  // ============================================================================
  // DESELECT ALL - CTRL+D
  // ============================================================================

  describe('Ctrl+D (Deselect All)', () => {
    it('should deselect all items', () => {
      const sel = createSelect({
        items: checkboxItems,
        multiple: true,
        initialValue: ['opt1', 'opt2', 'opt3'],
      });
      expect(sel.selected()).toEqual(['opt1', 'opt2', 'opt3']);
      simulateInput('d', { ...charKey('d').key, ctrl: true });
      expect(sel.selected()).toEqual([]);
    });

    it('should call onChange with empty array', () => {
      const onChange = vi.fn();
      createSelect({
        items: checkboxItems,
        multiple: true,
        initialValue: ['opt1'],
        onChange,
      });
      simulateInput('d', { ...charKey('d').key, ctrl: true });
      expect(onChange).toHaveBeenCalledWith([]);
    });
  });

  // ============================================================================
  // TAB - TOGGLE AND MOVE
  // ============================================================================

  describe('Tab (Toggle and Move)', () => {
    it('should toggle and move down', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      expect(sel.selected()).toEqual([]);
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('', keys.tab().key);
      expect(sel.selected()).toEqual(['opt1']);
      expect(sel.cursorIndex()).toBe(1);
    });

    it('should toggle and move up with Shift+Tab', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      simulateInput('', keys.down().key);
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(2);
      simulateInput('', keys.shiftTab().key);
      expect(sel.selected()).toEqual(['opt3']);
      expect(sel.cursorIndex()).toBe(1);
    });

    it('should allow rapid selection with Tab', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      // Tab through all items
      simulateInput('', keys.tab().key);
      simulateInput('', keys.tab().key);
      simulateInput('', keys.tab().key);
      simulateInput('', keys.tab().key);
      expect(sel.selected()).toEqual(['opt1', 'opt2', 'opt3', 'opt4']);
    });
  });

  // ============================================================================
  // ENTER - SUBMIT
  // ============================================================================

  describe('Enter (Submit)', () => {
    it('should call onSubmit with selected values', () => {
      const onSubmit = vi.fn();
      createSelect({
        items: checkboxItems,
        multiple: true,
        initialValue: ['opt2', 'opt4'],
        onSubmit,
      });
      simulateInput('', keys.enter().key);
      expect(onSubmit).toHaveBeenCalledWith(['opt2', 'opt4']);
    });

    it('should submit empty array if nothing selected', () => {
      const onSubmit = vi.fn();
      createSelect({
        items: checkboxItems,
        multiple: true,
        onSubmit,
      });
      simulateInput('', keys.enter().key);
      expect(onSubmit).toHaveBeenCalledWith([]); // Empty array for multi-select
    });
  });

  // ============================================================================
  // ESCAPE - CANCEL
  // ============================================================================

  describe('Escape (Cancel)', () => {
    it('should call onCancel', () => {
      const onCancel = vi.fn();
      createSelect({
        items: checkboxItems,
        multiple: true,
        onCancel,
      });
      simulateInput('', keys.escape().key);
      expect(onCancel).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // STATES
  // ============================================================================

  describe('States', () => {
    it('should start with initial selections', () => {
      const sel = createSelect({
        items: checkboxItems,
        multiple: true,
        initialValue: ['opt1', 'opt3'],
      });
      expect(sel.selected()).toEqual(['opt1', 'opt3']);
    });

    it('should handle empty list', () => {
      const sel = createSelect({ items: [], multiple: true });
      expect(sel.selected()).toEqual([]);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual([]);
    });

    it('should handle single item', () => {
      const items: SelectItem<string>[] = [{ value: 'only', label: 'Only One' }];
      const sel = createSelect({ items, multiple: true });
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual(['only']);
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual([]);
    });

    it('should ignore input when inactive', () => {
      const sel = createSelect({
        items: checkboxItems,
        multiple: true,
        isActive: false,
      });
      simulateInput(' ', charKey(' ').key);
      expect(sel.selected()).toEqual([]);
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should preserve order of selections', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      // Select items in order: opt3, opt1, opt4
      simulateInput('', keys.down().key);
      simulateInput('', keys.down().key);
      simulateInput(' ', charKey(' ').key); // opt3
      simulateInput('', keys.home().key);
      simulateInput(' ', charKey(' ').key); // opt1
      simulateInput('', keys.end().key);
      simulateInput(' ', charKey(' ').key); // opt4
      expect(sel.selected()).toEqual(['opt3', 'opt1', 'opt4']);
    });
  });

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  describe('Public API', () => {
    it('selectAll should select all non-disabled items', () => {
      const sel = createSelect({ items: itemsWithDisabled, multiple: true });
      sel.selectAll();
      expect(sel.selected()).toEqual(['opt1', 'opt3']);
    });

    it('selectNone should deselect all items', () => {
      const sel = createSelect({
        items: checkboxItems,
        multiple: true,
        initialValue: ['opt1', 'opt2'],
      });
      sel.selectNone();
      expect(sel.selected()).toEqual([]);
    });

    it('toggleSelection should toggle current item', () => {
      const sel = createSelect({ items: checkboxItems, multiple: true });
      sel.toggleSelection();
      expect(sel.selected()).toEqual(['opt1']);
      sel.toggleSelection();
      expect(sel.selected()).toEqual([]);
    });
  });
});
