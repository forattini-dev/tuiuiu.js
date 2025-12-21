/**
 * Command Palette Mouse Event Tests
 *
 * Tests for mouse interaction with CommandPalette component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CommandPalette,
  createCommandPalette,
  type CommandItem,
} from '../../src/design-system/overlays/command-palette.js';
import { Box, Text } from '../../src/primitives/index.js';
import { calculateLayout } from '../../src/design-system/core/layout.js';
import { renderToString } from '../../src/design-system/core/renderer.js';
import {
  getHitTestRegistry,
  resetHitTestRegistry,
  registerHitTestFromLayout,
} from '../../src/core/hit-test.js';
import { MouseSimulator } from '../../src/dev-tools/mouse-simulator.js';
import { clearInputHandlers } from '../../src/hooks/context.js';

// Test items
const basicItems: CommandItem[] = [
  { id: 'save', label: 'Save File', shortcut: 'Ctrl+S' },
  { id: 'open', label: 'Open File', shortcut: 'Ctrl+O' },
  { id: 'close', label: 'Close File', shortcut: 'Ctrl+W' },
  { id: 'new', label: 'New File', shortcut: 'Ctrl+N' },
];

const itemsWithDisabled: CommandItem[] = [
  { id: 'save', label: 'Save File' },
  { id: 'disabled', label: 'Disabled Item', disabled: true },
  { id: 'open', label: 'Open File' },
];

const categorizedItems: CommandItem[] = [
  { id: 'save', label: 'Save', category: 'File' },
  { id: 'open', label: 'Open', category: 'File' },
  { id: 'copy', label: 'Copy', category: 'Edit' },
  { id: 'paste', label: 'Paste', category: 'Edit' },
];

describe('CommandPalette Mouse Events', () => {
  beforeEach(() => {
    resetHitTestRegistry();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHitTestRegistry();
    clearInputHandlers();
  });

  describe('Item Click Selection', () => {
    it('should trigger onItemClick when clicking an item', () => {
      const onItemClick = vi.fn();
      const palette = createCommandPalette({ items: basicItems });

      const vnode = CommandPalette({
        query: palette.query(),
        items: basicItems,
        filteredItems: palette.filteredItems(),
        selectedIndex: palette.selectedIndex(),
        onItemClick,
      });

      const layout = calculateLayout(vnode, 80, 30);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      expect(registry.hasClickableElements()).toBe(true);

      // Get clickable elements
      const elements = registry.getElements();
      const clickableItems = elements.filter(e => e.node.props.onClick);

      // Should have clickable items (one for each item)
      expect(clickableItems.length).toBe(4);

      // Click on the second item
      const secondItem = clickableItems[1];
      const sim = new MouseSimulator();
      sim.click(secondItem.x + 1, secondItem.y);

      // onItemClick should have been called with the item and index
      expect(onItemClick).toHaveBeenCalledTimes(1);
      expect(onItemClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'open', label: 'Open File' }),
        1
      );
    });

    it('should not trigger onItemClick for disabled items', () => {
      const onItemClick = vi.fn();
      const palette = createCommandPalette({ items: itemsWithDisabled });

      const vnode = CommandPalette({
        query: palette.query(),
        items: itemsWithDisabled,
        filteredItems: palette.filteredItems(),
        selectedIndex: palette.selectedIndex(),
        onItemClick,
      });

      const layout = calculateLayout(vnode, 80, 30);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      const elements = registry.getElements();

      // Disabled items should not be clickable
      const clickableItems = elements.filter(e => e.node.props.onClick);

      // Should only have 2 clickable items (not the disabled one)
      expect(clickableItems.length).toBe(2);
    });

    it('should select item and trigger action on click', () => {
      const onSelect = vi.fn();
      const onItemClick = vi.fn((item: CommandItem, index: number) => {
        palette.selectIndex(index);
        palette.confirm();
      });

      const palette = createCommandPalette({
        items: basicItems,
        onSelect,
      });

      const vnode = CommandPalette({
        query: palette.query(),
        items: basicItems,
        filteredItems: palette.filteredItems(),
        selectedIndex: palette.selectedIndex(),
        onItemClick,
      });

      const layout = calculateLayout(vnode, 80, 30);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      const elements = registry.getElements();
      const clickableItems = elements.filter(e => e.node.props.onClick);

      // Click the third item
      const thirdItem = clickableItems[2];
      const sim = new MouseSimulator();
      sim.click(thirdItem.x + 1, thirdItem.y);

      // Check that the index was updated
      expect(palette.selectedIndex()).toBe(2);

      // Check that onSelect was called
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'close' })
      );
    });
  });

  describe('State Manager Integration', () => {
    it('should update selectedIndex via selectIndex method', () => {
      const palette = createCommandPalette({ items: basicItems });

      expect(palette.selectedIndex()).toBe(0);

      palette.selectIndex(2);
      expect(palette.selectedIndex()).toBe(2);

      palette.selectIndex(0);
      expect(palette.selectedIndex()).toBe(0);
    });

    it('should not select out of bounds index', () => {
      const palette = createCommandPalette({ items: basicItems });

      palette.selectIndex(-1);
      expect(palette.selectedIndex()).toBe(0);

      palette.selectIndex(100);
      expect(palette.selectedIndex()).toBe(0);
    });

    it('should handle selectIndex with filtered items', () => {
      const palette = createCommandPalette({ items: basicItems });

      // Type to filter
      palette.type('save');

      // Should have only one filtered item
      expect(palette.filteredItems().length).toBe(1);

      // Select should work within filtered range
      palette.selectIndex(0);
      expect(palette.selectedIndex()).toBe(0);

      // Out of bounds for filtered list
      palette.selectIndex(1);
      expect(palette.selectedIndex()).toBe(0);
    });
  });

  describe('Rendering', () => {
    it('should render all items', () => {
      const palette = createCommandPalette({ items: basicItems });

      const output = renderToString(
        CommandPalette({
          query: palette.query(),
          items: basicItems,
          filteredItems: palette.filteredItems(),
          selectedIndex: palette.selectedIndex(),
        }),
        80
      );

      expect(output).toContain('Save File');
      expect(output).toContain('Open File');
      expect(output).toContain('Close File');
      expect(output).toContain('New File');
    });

    it('should render shortcuts', () => {
      const palette = createCommandPalette({ items: basicItems });

      const output = renderToString(
        CommandPalette({
          query: palette.query(),
          items: basicItems,
          filteredItems: palette.filteredItems(),
          selectedIndex: palette.selectedIndex(),
          showShortcuts: true,
        }),
        80
      );

      expect(output).toContain('Ctrl+S');
      expect(output).toContain('Ctrl+O');
    });

    it('should render category headers', () => {
      const palette = createCommandPalette({ items: categorizedItems });

      const output = renderToString(
        CommandPalette({
          query: palette.query(),
          items: categorizedItems,
          filteredItems: palette.filteredItems(),
          selectedIndex: palette.selectedIndex(),
          showCategories: true,
        }),
        80
      );

      expect(output).toContain('FILE');
      expect(output).toContain('EDIT');
    });

    it('should render placeholder when no query', () => {
      const palette = createCommandPalette({ items: basicItems });

      const output = renderToString(
        CommandPalette({
          query: '',
          items: basicItems,
          filteredItems: palette.filteredItems(),
          selectedIndex: palette.selectedIndex(),
          placeholder: 'Search commands...',
        }),
        80
      );

      expect(output).toContain('Search commands...');
    });

    it('should render no results message', () => {
      const palette = createCommandPalette({ items: basicItems });
      palette.type('xyz'); // No matching items

      const output = renderToString(
        CommandPalette({
          query: palette.query(),
          items: basicItems,
          filteredItems: palette.filteredItems(),
          selectedIndex: palette.selectedIndex(),
          noResultsMessage: 'No commands found',
        }),
        80
      );

      expect(output).toContain('No commands found');
    });
  });

  describe('Fuzzy Search', () => {
    it('should filter items based on query', () => {
      const palette = createCommandPalette({ items: basicItems });

      palette.type('sav');
      expect(palette.filteredItems().length).toBe(1);
      expect(palette.filteredItems()[0]!.id).toBe('save');
    });

    it('should match partial query', () => {
      const palette = createCommandPalette({ items: basicItems });

      palette.type('file');
      // Should match all items with "File" in label
      expect(palette.filteredItems().length).toBe(4);
    });

    it('should handle backspace correctly', () => {
      const palette = createCommandPalette({ items: basicItems });

      palette.type('sav');
      expect(palette.query()).toBe('sav');

      palette.backspace();
      expect(palette.query()).toBe('sa');

      palette.clear();
      expect(palette.query()).toBe('');
    });
  });

  describe('Navigation', () => {
    it('should navigate with selectPrev and selectNext', () => {
      const palette = createCommandPalette({ items: basicItems });

      expect(palette.selectedIndex()).toBe(0);

      palette.selectNext();
      expect(palette.selectedIndex()).toBe(1);

      palette.selectNext();
      expect(palette.selectedIndex()).toBe(2);

      palette.selectPrev();
      expect(palette.selectedIndex()).toBe(1);
    });

    it('should wrap around when navigating', () => {
      const palette = createCommandPalette({ items: basicItems });

      // Go to last item
      palette.selectIndex(3);
      expect(palette.selectedIndex()).toBe(3);

      // Next should wrap to first
      palette.selectNext();
      expect(palette.selectedIndex()).toBe(0);

      // Prev should wrap to last
      palette.selectPrev();
      expect(palette.selectedIndex()).toBe(3);
    });
  });
});
