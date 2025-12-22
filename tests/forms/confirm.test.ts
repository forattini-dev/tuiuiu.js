/**
 * Confirm Component - Keyboard Interaction Tests
 *
 * Confirm is a simple Yes/No selection dialog.
 * Tests focus on:
 * - Navigation: Left/Right arrows to switch between Yes/No
 * - Selection: y/n keys for quick selection
 * - Submit: Enter key
 * - Cancel: Escape key
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSelect, type SelectItem, type SelectOptions } from '../../src/molecules/select.js';
import { emitInput, clearInputHandlers, addInputHandler } from '../../src/hooks/context.js';
import type { Key } from '../../src/hooks/types.js';
import { keys, charKey } from '../helpers/keyboard.js';

// Helper to simulate input via EventEmitter
function simulateInput(input: string, key: Key): void {
  emitInput(input, key);
}

// Helper to create select and register handler (since useInput moved to renderSelect)
function createTestSelect<T = any>(options: SelectOptions<T>) {
  const sel = createSelect(options);
  addInputHandler(sel.handleInput);
  return sel;
}

// Confirm items - simulating the Yes/No structure
const confirmItems: SelectItem<boolean>[] = [
  { value: true, label: 'Yes' },
  { value: false, label: 'No' },
];

describe('Confirm Keyboard Interactions', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  // ============================================================================
  // NAVIGATION - ARROWS
  // ============================================================================

  describe('Arrow Navigation', () => {
    it('should switch to No with down arrow (default Yes)', () => {
      const sel = createTestSelect({
        items: confirmItems,
        initialValue: true,
      });
      expect(sel.cursorIndex()).toBe(0); // Yes
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(1); // No
    });

    it('should switch to Yes with up arrow (from No)', () => {
      const sel = createTestSelect({
        items: confirmItems,
        initialValue: false,
      });
      // Start at No (index 1)
      simulateInput('', keys.down().key); // Move to No
      expect(sel.cursorIndex()).toBe(1);
      simulateInput('', keys.up().key);
      expect(sel.cursorIndex()).toBe(0); // Yes
    });

    it('should not go above Yes', () => {
      const sel = createTestSelect({
        items: confirmItems,
        initialValue: true,
      });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('', keys.up().key);
      expect(sel.cursorIndex()).toBe(0); // Still Yes
    });

    it('should not go below No', () => {
      const sel = createTestSelect({
        items: confirmItems,
        initialValue: true,
      });
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(1); // No
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(1); // Still No
    });

    it('should navigate with j/k vim keys', () => {
      const sel = createTestSelect({
        items: confirmItems,
        initialValue: true,
      });
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('j', charKey('j').key);
      expect(sel.cursorIndex()).toBe(1);
      simulateInput('k', charKey('k').key);
      expect(sel.cursorIndex()).toBe(0);
    });
  });

  // ============================================================================
  // SELECTION - SPACE/ENTER
  // ============================================================================

  describe('Selection', () => {
    it('should select Yes and call onSubmit with true', () => {
      const onSubmit = vi.fn();
      createTestSelect({
        items: confirmItems,
        onSubmit,
      });
      // Cursor starts at 0 (Yes)
      simulateInput(' ', charKey(' ').key); // Select
      simulateInput('', keys.enter().key); // Submit
      expect(onSubmit).toHaveBeenCalledWith(true);
    });

    it('should select No and call onSubmit with false', () => {
      const onSubmit = vi.fn();
      createTestSelect({
        items: confirmItems,
        onSubmit,
      });
      simulateInput('', keys.down().key); // Move to No
      simulateInput(' ', charKey(' ').key); // Select
      simulateInput('', keys.enter().key); // Submit
      expect(onSubmit).toHaveBeenCalledWith(false);
    });

    it('should submit on Enter without explicit Space selection', () => {
      const onSubmit = vi.fn();
      createTestSelect({
        items: confirmItems,
        initialValue: false,
        onSubmit,
      });
      simulateInput('', keys.enter().key);
      expect(onSubmit).toHaveBeenCalledWith(false);
    });
  });

  // ============================================================================
  // ESCAPE - CANCEL
  // ============================================================================

  describe('Escape (Cancel)', () => {
    it('should call onCancel when pressing Escape', () => {
      const onCancel = vi.fn();
      createTestSelect({
        items: confirmItems,
        onCancel,
      });
      simulateInput('', keys.escape().key);
      expect(onCancel).toHaveBeenCalled();
    });

    it('should not modify selection when cancelling', () => {
      const onCancel = vi.fn();
      const sel = createTestSelect({
        items: confirmItems,
        initialValue: true,
        onCancel,
      });
      expect(sel.selected()).toEqual([true]);
      simulateInput('', keys.escape().key);
      expect(sel.selected()).toEqual([true]); // Unchanged
    });
  });

  // ============================================================================
  // STATES
  // ============================================================================

  describe('States', () => {
    it('should default to first option (Yes)', () => {
      const sel = createTestSelect({
        items: confirmItems,
      });
      expect(sel.cursorIndex()).toBe(0);
    });

    it('should respect initial value of true (Yes)', () => {
      const sel = createTestSelect({
        items: confirmItems,
        initialValue: true,
      });
      expect(sel.selected()).toEqual([true]);
    });

    it('should respect initial value of false (No)', () => {
      const sel = createTestSelect({
        items: confirmItems,
        initialValue: false,
      });
      expect(sel.selected()).toEqual([false]);
    });

    it('should ignore input when inactive', () => {
      const onSubmit = vi.fn();
      const sel = createTestSelect({
        items: confirmItems,
        isActive: false,
        onSubmit,
      });
      simulateInput('', keys.down().key);
      expect(sel.cursorIndex()).toBe(0);
      simulateInput('', keys.enter().key);
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  // ============================================================================
  // CALLBACK TESTS
  // ============================================================================

  describe('Callbacks', () => {
    it('should call onChange when selection changes', () => {
      const onChange = vi.fn();
      createTestSelect({
        items: confirmItems,
        onChange,
      });
      simulateInput(' ', charKey(' ').key);
      expect(onChange).toHaveBeenCalledWith(true);
    });

    it('should call onChange when switching selection', () => {
      const onChange = vi.fn();
      createTestSelect({
        items: confirmItems,
        initialValue: true,
        onChange,
      });
      // Change to No
      simulateInput('', keys.down().key);
      simulateInput(' ', charKey(' ').key);
      expect(onChange).toHaveBeenCalledWith(false);
    });
  });
});
