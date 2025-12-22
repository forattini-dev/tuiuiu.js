/**
 * Tests for command-palette.ts
 *
 * Covers:
 * - CommandPalette: component rendering
 * - createCommandPalette: state management
 * - GoToDialog: component rendering
 * - createGoToDialog: state management
 * - Fuzzy search and filtering
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  CommandPalette,
  createCommandPalette,
  GoToDialog,
  createGoToDialog,
  type CommandItem,
  type CommandPaletteProps,
  type CommandPaletteState,
} from '../../../src/organisms/command-palette.js';
import {
  keys,
  createInputHarness,
  createFocusState,
  createFocusedHandler,
  typeString,
} from '../../helpers/keyboard.js';

// =============================================================================
// Test Data
// =============================================================================

const testItems: CommandItem[] = [
  { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', category: 'File' },
  { id: 'open', label: 'Open File', shortcut: 'Ctrl+O', category: 'File' },
  { id: 'new', label: 'New File', shortcut: 'Ctrl+N', category: 'File' },
  { id: 'copy', label: 'Copy', shortcut: 'Ctrl+C', category: 'Edit' },
  { id: 'paste', label: 'Paste', shortcut: 'Ctrl+V', category: 'Edit' },
  { id: 'cut', label: 'Cut', shortcut: 'Ctrl+X', category: 'Edit' },
  { id: 'find', label: 'Find', shortcut: 'Ctrl+F', category: 'Edit' },
  { id: 'settings', label: 'Settings', icon: '⚙', description: 'Configure application' },
  { id: 'help', label: 'Help', icon: '?', description: 'Show help documentation' },
];

// =============================================================================
// CommandPalette Component
// =============================================================================

describe('CommandPalette component', () => {
  const defaultProps: CommandPaletteProps = {
    query: '',
    items: testItems,
    filteredItems: testItems,
    selectedIndex: 0,
  };

  describe('rendering', () => {
    it('should render with default props', () => {
      const result = CommandPalette(defaultProps);

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
      expect(result.props.flexDirection).toBe('column');
    });

    it('should render with query', () => {
      const result = CommandPalette({
        ...defaultProps,
        query: 'save',
      });

      expect(result).toBeDefined();
    });

    it('should render with selected index', () => {
      const result = CommandPalette({
        ...defaultProps,
        selectedIndex: 3,
      });

      expect(result).toBeDefined();
    });

    it('should render with custom title', () => {
      const result = CommandPalette({
        ...defaultProps,
        title: 'Custom Title',
      });

      expect(result).toBeDefined();
    });

    it('should render with custom placeholder', () => {
      const result = CommandPalette({
        ...defaultProps,
        placeholder: 'Search commands...',
      });

      expect(result).toBeDefined();
    });

    it('should render no results message', () => {
      const result = CommandPalette({
        ...defaultProps,
        filteredItems: [],
        noResultsMessage: 'Nothing found',
      });

      expect(result).toBeDefined();
    });
  });

  describe('styling', () => {
    it('should render with different border styles', () => {
      const styles = ['single', 'double', 'round', 'heavy', 'none'] as const;

      for (const borderStyle of styles) {
        const result = CommandPalette({
          ...defaultProps,
          borderStyle,
        });
        expect(result).toBeDefined();
      }
    });

    it('should apply custom colors', () => {
      const result = CommandPalette({
        ...defaultProps,
        borderColor: 'magenta',
        highlightColor: 'green',
        selectedBg: 'red',
      });

      expect(result).toBeDefined();
    });

    it('should respect custom width', () => {
      const result = CommandPalette({
        ...defaultProps,
        width: 80,
      });

      expect(result).toBeDefined();
    });
  });

  describe('categories and shortcuts', () => {
    it('should show categories', () => {
      const result = CommandPalette({
        ...defaultProps,
        showCategories: true,
      });

      expect(result).toBeDefined();
    });

    it('should hide categories', () => {
      const result = CommandPalette({
        ...defaultProps,
        showCategories: false,
      });

      expect(result).toBeDefined();
    });

    it('should show shortcuts', () => {
      const result = CommandPalette({
        ...defaultProps,
        showShortcuts: true,
      });

      expect(result).toBeDefined();
    });

    it('should hide shortcuts', () => {
      const result = CommandPalette({
        ...defaultProps,
        showShortcuts: false,
      });

      expect(result).toBeDefined();
    });
  });

  describe('scrolling', () => {
    it('should respect maxVisible', () => {
      const result = CommandPalette({
        ...defaultProps,
        maxVisible: 5,
      });

      expect(result).toBeDefined();
    });

    it('should show scroll indicator when items exceed maxVisible', () => {
      const result = CommandPalette({
        ...defaultProps,
        maxVisible: 3,
        selectedIndex: 5,
      });

      expect(result).toBeDefined();
    });
  });

  describe('description display', () => {
    it('should show description for selected item', () => {
      const itemsWithDesc: CommandItem[] = [
        { id: 'with-desc', label: 'Item', description: 'This is a description' },
      ];

      const result = CommandPalette({
        ...defaultProps,
        items: itemsWithDesc,
        filteredItems: itemsWithDesc,
        selectedIndex: 0,
      });

      expect(result).toBeDefined();
    });
  });
});

// =============================================================================
// createCommandPalette
// =============================================================================

describe('createCommandPalette', () => {
  // ==========================================================================
  // Creation and Initial State
  // ==========================================================================

  describe('creation', () => {
    it('should create with items', () => {
      const palette = createCommandPalette({ items: testItems });

      expect(palette.query()).toBe('');
      expect(palette.selectedIndex()).toBe(0);
      expect(palette.filteredItems()).toEqual(testItems);
    });

    it('should exclude disabled items', () => {
      const items: CommandItem[] = [
        { id: 'enabled', label: 'Enabled' },
        { id: 'disabled', label: 'Disabled', disabled: true },
      ];

      const palette = createCommandPalette({ items });

      expect(palette.filteredItems()).toHaveLength(1);
      expect(palette.filteredItems()[0]!.id).toBe('enabled');
    });

    it('should include props', () => {
      const palette = createCommandPalette({
        items: testItems,
        props: {
          title: 'My Palette',
          width: 80,
        },
      });

      expect(palette.props.title).toBe('My Palette');
      expect(palette.props.width).toBe(80);
    });
  });

  // ==========================================================================
  // Typing and Search
  // ==========================================================================

  describe('typing and search', () => {
    it('should update query on type', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.type('s');
      expect(palette.query()).toBe('s');

      palette.type('a');
      expect(palette.query()).toBe('sa');

      palette.type('v');
      expect(palette.query()).toBe('sav');
    });

    it('should filter items on type', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.type('s');
      palette.type('a');
      palette.type('v');
      palette.type('e');

      expect(palette.filteredItems().some(i => i.id === 'save')).toBe(true);
      expect(palette.filteredItems().length).toBeLessThan(testItems.length);
    });

    it('should handle backspace', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.type('save');
      expect(palette.query()).toBe('save');

      palette.backspace();
      expect(palette.query()).toBe('sav');

      palette.backspace();
      expect(palette.query()).toBe('sa');
    });

    it('should handle clear', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.type('search');
      palette.clear();

      expect(palette.query()).toBe('');
      expect(palette.filteredItems()).toEqual(testItems);
    });

    it('should fuzzy match label', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.type('sf'); // Should match "Save File"

      const filtered = palette.filteredItems();
      expect(filtered.some(i => i.label.includes('Save'))).toBe(true);
    });

    it('should match against description', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.type('configure'); // Description of "Settings"

      const filtered = palette.filteredItems();
      expect(filtered.some(i => i.id === 'settings')).toBe(true);
    });

    it('should match against category', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.type('edit'); // Category name

      const filtered = palette.filteredItems();
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should return no results for non-matching query', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.type('zzzzzzz');

      expect(palette.filteredItems()).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Selection
  // ==========================================================================

  describe('selection', () => {
    it('should select next', () => {
      const palette = createCommandPalette({ items: testItems });

      expect(palette.selectedIndex()).toBe(0);

      palette.selectNext();
      expect(palette.selectedIndex()).toBe(1);

      palette.selectNext();
      expect(palette.selectedIndex()).toBe(2);
    });

    it('should wrap around at end', () => {
      const items = [
        { id: '1', label: 'One' },
        { id: '2', label: 'Two' },
        { id: '3', label: 'Three' },
      ];
      const palette = createCommandPalette({ items });

      palette.selectNext(); // 0 -> 1
      palette.selectNext(); // 1 -> 2
      palette.selectNext(); // 2 -> 0 (wrap)

      expect(palette.selectedIndex()).toBe(0);
    });

    it('should select prev', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.selectNext();
      palette.selectNext();
      expect(palette.selectedIndex()).toBe(2);

      palette.selectPrev();
      expect(palette.selectedIndex()).toBe(1);
    });

    it('should wrap around at start', () => {
      const items = [
        { id: '1', label: 'One' },
        { id: '2', label: 'Two' },
        { id: '3', label: 'Three' },
      ];
      const palette = createCommandPalette({ items });

      palette.selectPrev(); // 0 -> 2 (wrap)

      expect(palette.selectedIndex()).toBe(2);
    });

    it('should select by index', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.selectIndex(5);
      expect(palette.selectedIndex()).toBe(5);
    });

    it('should ignore invalid index', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.selectIndex(-1);
      expect(palette.selectedIndex()).toBe(0);

      palette.selectIndex(100);
      expect(palette.selectedIndex()).toBe(0);
    });

    it('should get selected item', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.selectIndex(3);
      const selected = palette.getSelected();

      expect(selected).toBeDefined();
      expect(selected).toBe(testItems[3]);
    });

    it('should reset selection when filtered items change', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.selectIndex(5);
      palette.type('save'); // Filter to 1 item

      // Selection should be clamped
      expect(palette.selectedIndex()).toBeLessThan(palette.filteredItems().length);
    });
  });

  // ==========================================================================
  // Confirm and Close
  // ==========================================================================

  describe('confirm and close', () => {
    it('should call onSelect on confirm', () => {
      const onSelect = vi.fn();
      const palette = createCommandPalette({ items: testItems, onSelect });

      palette.selectIndex(2);
      palette.confirm();

      expect(onSelect).toHaveBeenCalledTimes(1);
      expect(onSelect).toHaveBeenCalledWith(testItems[2]);
    });

    it('should call item action on confirm', () => {
      const action = vi.fn();
      const items: CommandItem[] = [
        { id: 'action', label: 'With Action', action },
      ];
      const palette = createCommandPalette({ items });

      palette.confirm();

      expect(action).toHaveBeenCalledTimes(1);
    });

    it('should call onClose on close', () => {
      const onClose = vi.fn();
      const palette = createCommandPalette({ items: testItems, onClose });

      palette.close();

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not error when confirming with no items', () => {
      const palette = createCommandPalette({ items: [] });

      // Should not throw
      palette.confirm();
    });
  });

  // ==========================================================================
  // Dynamic Items
  // ==========================================================================

  describe('setItems', () => {
    it('should update items dynamically', () => {
      const palette = createCommandPalette({ items: testItems });

      const newItems: CommandItem[] = [
        { id: 'new1', label: 'New Item 1' },
        { id: 'new2', label: 'New Item 2' },
      ];

      palette.setItems(newItems);

      expect(palette.filteredItems()).toEqual(newItems);
    });

    it('should reset selection after setItems', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.selectIndex(5);

      palette.setItems([{ id: 'single', label: 'Single' }]);

      expect(palette.selectedIndex()).toBe(0);
    });

    it('should re-filter after setItems', () => {
      const palette = createCommandPalette({ items: testItems });

      palette.type('new');

      palette.setItems([
        { id: 'new-item', label: 'New Item' },
        { id: 'other', label: 'Other' },
      ]);

      expect(palette.filteredItems().some(i => i.id === 'new-item')).toBe(true);
    });
  });

  // ==========================================================================
  // Custom Filter
  // ==========================================================================

  describe('custom filter', () => {
    it('should use custom filter function', () => {
      const customFilter = vi.fn().mockReturnValue(100);
      const palette = createCommandPalette({
        items: testItems,
        filter: customFilter,
      });

      palette.type('test');

      expect(customFilter).toHaveBeenCalled();
    });

    it('should respect custom filter scoring', () => {
      const palette = createCommandPalette({
        items: testItems,
        filter: (item, query) => {
          // Only match items with 's' in id
          return item.id.includes('s') ? 100 : -1;
        },
      });

      palette.type('x');

      const filtered = palette.filteredItems();
      expect(filtered.every(i => i.id.includes('s'))).toBe(true);
    });
  });

  // ==========================================================================
  // Keyboard Integration
  // ==========================================================================

  describe('keyboard integration', () => {
    it('should navigate with arrow keys', () => {
      const palette = createCommandPalette({ items: testItems });
      const harness = createInputHarness((_, key) => {
        if (key.upArrow) palette.selectPrev();
        if (key.downArrow) palette.selectNext();
      });

      harness.press(keys.down());
      expect(palette.selectedIndex()).toBe(1);

      harness.press(keys.down());
      expect(palette.selectedIndex()).toBe(2);

      harness.press(keys.up());
      expect(palette.selectedIndex()).toBe(1);
    });

    it('should type search query', () => {
      const palette = createCommandPalette({ items: testItems });
      const harness = createInputHarness((input, key) => {
        if (key.backspace) {
          palette.backspace();
        } else if (input && !key.ctrl && !key.meta) {
          palette.type(input);
        }
      });

      harness.type('save');
      expect(palette.query()).toBe('save');
    });

    it('should backspace to delete', () => {
      const palette = createCommandPalette({ items: testItems });
      const harness = createInputHarness((input, key) => {
        if (key.backspace) {
          palette.backspace();
        } else if (input) {
          palette.type(input);
        }
      });

      harness.type('test');
      harness.press(keys.backspace());
      expect(palette.query()).toBe('tes');
    });

    it('should confirm with enter', () => {
      const onSelect = vi.fn();
      const palette = createCommandPalette({ items: testItems, onSelect });
      const harness = createInputHarness((_, key) => {
        if (key.return) palette.confirm();
        if (key.downArrow) palette.selectNext();
      });

      harness.press(keys.down());
      harness.press(keys.enter());

      expect(onSelect).toHaveBeenCalledWith(testItems[1]);
    });

    it('should close with escape', () => {
      const onClose = vi.fn();
      const palette = createCommandPalette({ items: testItems, onClose });
      const harness = createInputHarness((_, key) => {
        if (key.escape) palette.close();
      });

      harness.press(keys.escape());

      expect(onClose).toHaveBeenCalled();
    });

    it('should clear with Ctrl+U', () => {
      const palette = createCommandPalette({ items: testItems });
      const harness = createInputHarness((input, key) => {
        if (key.ctrl && input === 'u') {
          palette.clear();
        } else if (input && !key.ctrl) {
          palette.type(input);
        }
      });

      harness.type('test');
      harness.press(keys.ctrlU());

      expect(palette.query()).toBe('');
    });

    it('should only respond when focused', () => {
      const palette = createCommandPalette({ items: testItems });
      const focus = createFocusState(false);
      const focusedHandler = createFocusedHandler(focus, (_, key) => {
        if (key.downArrow) palette.selectNext();
      });
      const harness = createInputHarness(focusedHandler);

      // Not focused
      harness.press(keys.down());
      expect(palette.selectedIndex()).toBe(0);

      // Focus
      focus.focus();
      harness.press(keys.down());
      expect(palette.selectedIndex()).toBe(1);
    });

    it('should handle full workflow', () => {
      const onSelect = vi.fn();
      const onClose = vi.fn();
      const palette = createCommandPalette({
        items: testItems,
        onSelect,
        onClose,
      });

      const harness = createInputHarness((input, key) => {
        if (key.escape) {
          palette.close();
        } else if (key.return) {
          palette.confirm();
        } else if (key.upArrow) {
          palette.selectPrev();
        } else if (key.downArrow) {
          palette.selectNext();
        } else if (key.backspace) {
          palette.backspace();
        } else if (input && !key.ctrl) {
          palette.type(input);
        }
      });

      // Search for "copy"
      harness.type('copy');
      expect(palette.query()).toBe('copy');

      // Navigate to find Copy
      const filteredBefore = palette.filteredItems();
      expect(filteredBefore.some(i => i.id === 'copy')).toBe(true);

      // Clear and try again
      harness.press(keys.escape());
      expect(onClose).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// GoToDialog Component
// =============================================================================

describe('GoToDialog component', () => {
  describe('rendering', () => {
    it('should render with value', () => {
      const result = GoToDialog({ value: '5', max: 10 });

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
    });

    it('should render with empty value', () => {
      const result = GoToDialog({ value: '', max: 10 });

      expect(result).toBeDefined();
    });

    it('should render with custom title', () => {
      const result = GoToDialog({
        value: '1',
        max: 10,
        title: 'Jump to Slide',
      });

      expect(result).toBeDefined();
    });

    it('should render with custom prompt', () => {
      const result = GoToDialog({
        value: '3',
        max: 100,
        prompt: 'Enter page:',
      });

      expect(result).toBeDefined();
    });

    it('should render with different border styles', () => {
      const styles = ['single', 'double', 'round', 'heavy', 'none'] as const;

      for (const borderStyle of styles) {
        const result = GoToDialog({
          value: '1',
          max: 10,
          borderStyle,
        });
        expect(result).toBeDefined();
      }
    });

    it('should render with custom width', () => {
      const result = GoToDialog({
        value: '1',
        max: 10,
        width: 40,
      });

      expect(result).toBeDefined();
    });
  });
});

// =============================================================================
// createGoToDialog
// =============================================================================

describe('createGoToDialog', () => {
  // ==========================================================================
  // Creation
  // ==========================================================================

  describe('creation', () => {
    it('should create with max value', () => {
      const dialog = createGoToDialog({ max: 10 });

      expect(dialog.value()).toBe('');
      expect(dialog.props.max).toBe(10);
    });

    it('should include custom props', () => {
      const dialog = createGoToDialog({
        max: 50,
        props: { title: 'Go To Page' },
      });

      expect(dialog.props.title).toBe('Go To Page');
    });
  });

  // ==========================================================================
  // Typing
  // ==========================================================================

  describe('typing', () => {
    it('should accept digits', () => {
      const dialog = createGoToDialog({ max: 1000 });

      dialog.type('1');
      expect(dialog.value()).toBe('1');

      dialog.type('2');
      expect(dialog.value()).toBe('12');

      dialog.type('3');
      expect(dialog.value()).toBe('123');
    });

    it('should reject non-digits', () => {
      const dialog = createGoToDialog({ max: 100 });

      dialog.type('a');
      expect(dialog.value()).toBe('');

      dialog.type('!');
      expect(dialog.value()).toBe('');

      dialog.type(' ');
      expect(dialog.value()).toBe('');
    });

    it('should reject value exceeding max', () => {
      const dialog = createGoToDialog({ max: 10 });

      dialog.type('1');
      dialog.type('1'); // 11 > 10, rejected

      expect(dialog.value()).toBe('1');
    });

    it('should allow value equal to max', () => {
      const dialog = createGoToDialog({ max: 100 });

      dialog.type('1');
      dialog.type('0');
      dialog.type('0'); // 100 == 100, allowed

      expect(dialog.value()).toBe('100');
    });
  });

  // ==========================================================================
  // Backspace and Clear
  // ==========================================================================

  describe('backspace and clear', () => {
    it('should handle backspace', () => {
      const dialog = createGoToDialog({ max: 1000 });

      dialog.type('1');
      dialog.type('2');
      dialog.type('3');
      dialog.backspace();

      expect(dialog.value()).toBe('12');
    });

    it('should handle clear', () => {
      const dialog = createGoToDialog({ max: 1000 });

      dialog.type('1');
      dialog.type('2');
      dialog.type('3');
      dialog.clear();

      expect(dialog.value()).toBe('');
    });
  });

  // ==========================================================================
  // Confirm and Close
  // ==========================================================================

  describe('confirm and close', () => {
    it('should call onConfirm with number', () => {
      const onConfirm = vi.fn();
      const dialog = createGoToDialog({ max: 100, onConfirm });

      dialog.type('4');
      dialog.type('2');
      dialog.confirm();

      expect(onConfirm).toHaveBeenCalledWith(42);
    });

    it('should not call onConfirm for invalid value', () => {
      const onConfirm = vi.fn();
      const dialog = createGoToDialog({ max: 100, onConfirm });

      dialog.confirm(); // Empty value

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should not call onConfirm for zero', () => {
      const onConfirm = vi.fn();
      const dialog = createGoToDialog({ max: 100, onConfirm });

      dialog.type('0');
      dialog.confirm();

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should call onClose', () => {
      const onClose = vi.fn();
      const dialog = createGoToDialog({ max: 100, onClose });

      dialog.close();

      expect(onClose).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // getValue
  // ==========================================================================

  describe('getValue', () => {
    it('should return number when valid', () => {
      const dialog = createGoToDialog({ max: 100 });

      dialog.type('4');
      dialog.type('2');

      expect(dialog.getValue()).toBe(42);
    });

    it('should return null when empty', () => {
      const dialog = createGoToDialog({ max: 100 });

      expect(dialog.getValue()).toBeNull();
    });
  });

  // ==========================================================================
  // Keyboard Integration
  // ==========================================================================

  describe('keyboard integration', () => {
    it('should type numbers', () => {
      const dialog = createGoToDialog({ max: 1000 });
      const harness = createInputHarness((input) => {
        dialog.type(input);
      });

      harness.press(keys.num1());
      harness.press(keys.num2());
      harness.press(keys.num3());

      expect(dialog.value()).toBe('123');
    });

    it('should backspace', () => {
      const dialog = createGoToDialog({ max: 100 });
      const harness = createInputHarness((input, key) => {
        if (key.backspace) {
          dialog.backspace();
        } else {
          dialog.type(input);
        }
      });

      harness.press(keys.num1());
      harness.press(keys.num2());
      harness.press(keys.backspace());

      expect(dialog.value()).toBe('1');
    });

    it('should confirm with enter', () => {
      const onConfirm = vi.fn();
      const dialog = createGoToDialog({ max: 100, onConfirm });
      const harness = createInputHarness((input, key) => {
        if (key.return) {
          dialog.confirm();
        } else {
          dialog.type(input);
        }
      });

      harness.press(keys.num5());
      harness.press(keys.enter());

      expect(onConfirm).toHaveBeenCalledWith(5);
    });

    it('should close with escape', () => {
      const onClose = vi.fn();
      const dialog = createGoToDialog({ max: 100, onClose });
      const harness = createInputHarness((_, key) => {
        if (key.escape) dialog.close();
      });

      harness.press(keys.escape());

      expect(onClose).toHaveBeenCalled();
    });

    it('should only respond when focused', () => {
      const dialog = createGoToDialog({ max: 100 });
      const focus = createFocusState(false);
      const focusedHandler = createFocusedHandler(focus, (input) => {
        dialog.type(input);
      });
      const harness = createInputHarness(focusedHandler);

      // Not focused
      harness.press(keys.num5());
      expect(dialog.value()).toBe('');

      // Focus
      focus.focus();
      harness.press(keys.num5());
      expect(dialog.value()).toBe('5');
    });
  });
});

// =============================================================================
// Integration: Complex Scenarios
// =============================================================================

describe('command palette integration', () => {
  it('should handle search, navigate, confirm workflow', () => {
    const onSelect = vi.fn();
    const palette = createCommandPalette({
      items: testItems,
      onSelect,
    });

    const harness = createInputHarness((input, key) => {
      if (key.escape) palette.close();
      else if (key.return) palette.confirm();
      else if (key.upArrow) palette.selectPrev();
      else if (key.downArrow) palette.selectNext();
      else if (key.backspace) palette.backspace();
      else if (input && !key.ctrl) palette.type(input);
    });

    // Search for "file"
    harness.type('file');
    expect(palette.filteredItems().every(i =>
      i.label.toLowerCase().includes('file') ||
      i.category?.toLowerCase().includes('file')
    )).toBe(true);

    // Navigate down
    harness.press(keys.down());
    harness.press(keys.down());

    // Confirm
    harness.press(keys.enter());
    expect(onSelect).toHaveBeenCalled();
  });

  it('should handle goto dialog for slide navigation', () => {
    const currentSlide = { value: 1 };
    const totalSlides = 20;

    const dialog = createGoToDialog({
      max: totalSlides,
      onConfirm: (num) => {
        currentSlide.value = num;
      },
    });

    const harness = createInputHarness((input, key) => {
      if (key.return) dialog.confirm();
      else dialog.type(input);
    });

    // Type slide number
    harness.press(keys.num1());
    harness.press(keys.num5());

    // Confirm
    harness.press(keys.enter());

    expect(currentSlide.value).toBe(15);
  });
});
