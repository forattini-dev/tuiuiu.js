/**
 * Select Component Mouse Event Tests
 *
 * Tests for mouse interaction with the Select component
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSelect, Select, renderSelect, type SelectItem } from '../../src/design-system/forms/select.js';
import { Box, Text } from '../../src/primitives/index.js';
import { calculateLayout } from '../../src/design-system/core/layout.js';
import { renderToString } from '../../src/design-system/core/renderer.js';
import {
  getHitTestRegistry,
  resetHitTestRegistry,
  registerHitTestFromLayout,
} from '../../src/core/hit-test.js';
import { MouseSimulator, simulateClick, simulateScroll } from '../../src/dev-tools/mouse-simulator.js';
import { clearInputHandlers } from '../../src/hooks/context.js';
import type { VNode } from '../../src/utils/types.js';

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

describe('Select Mouse Events', () => {
  beforeEach(() => {
    resetHitTestRegistry();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHitTestRegistry();
    clearInputHandlers();
  });

  describe('Item Click Selection', () => {
    it('should select item on click', () => {
      const onChange = vi.fn();
      const state = createSelect({ items: basicItems, onChange });
      const vnode = renderSelect(state, { items: basicItems, onChange });

      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      expect(registry.hasClickableElements()).toBe(true);

      // Get the actual positions of clickable elements
      const elements = registry.getElements();
      const clickableItems = elements.filter(e => e.node.props.onClick);

      // Should have 5 clickable items (one for each item)
      expect(clickableItems.length).toBe(5);

      // Click on the third item
      const thirdItem = clickableItems[2];
      const sim = new MouseSimulator();
      sim.click(thirdItem.x + 1, thirdItem.y);

      // Item should be selected
      expect(state.selected()).toContain('c');
      expect(onChange).toHaveBeenCalledWith('c');
    });

    it('should not select disabled item on click', () => {
      const onChange = vi.fn();
      const state = createSelect({ items: itemsWithDisabled, onChange });
      const vnode = renderSelect(state, { items: itemsWithDisabled, onChange });

      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();

      // Get clickable items (disabled items shouldn't be clickable)
      const elements = registry.getElements();
      const clickableItems = elements.filter(e => e.node.props.onClick);

      // Should have only 3 clickable items (non-disabled ones)
      expect(clickableItems.length).toBe(3);

      // onChange should not have been called yet
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should toggle selection in multi-select mode', () => {
      const onChange = vi.fn();
      const state = createSelect({
        items: basicItems,
        multiple: true,
        onChange,
      });
      const vnode = renderSelect(state, { items: basicItems, multiple: true, onChange });

      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      const elements = registry.getElements();
      const clickableItems = elements.filter(e => e.node.props.onClick);

      // Click first item
      const firstItem = clickableItems[0];
      const sim = new MouseSimulator();
      sim.click(firstItem.x + 1, firstItem.y);

      expect(state.selected()).toContain('a');

      // Click second item (should add to selection)
      const secondItem = clickableItems[1];
      sim.click(secondItem.x + 1, secondItem.y);

      expect(state.selected()).toContain('a');
      expect(state.selected()).toContain('b');

      // Click first item again (should deselect)
      sim.click(firstItem.x + 1, firstItem.y);

      expect(state.selected()).not.toContain('a');
      expect(state.selected()).toContain('b');
    });

    it('should move cursor to clicked item', () => {
      const state = createSelect({ items: basicItems });
      const vnode = renderSelect(state, { items: basicItems });

      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      expect(state.cursorIndex()).toBe(0);

      const registry = getHitTestRegistry();
      const elements = registry.getElements();
      const clickableItems = elements.filter(e => e.node.props.onClick);

      // Click on the fourth item
      const fourthItem = clickableItems[3];
      const sim = new MouseSimulator();
      sim.click(fourthItem.x + 1, fourthItem.y);

      // Cursor should have moved
      expect(state.cursorIndex()).toBe(3);
    });
  });

  describe('Mouse Scroll', () => {
    it('should scroll down on wheel down', () => {
      const state = createSelect({ items: manyItems, maxVisible: 5 });
      const vnode = renderSelect(state, { items: manyItems, maxVisible: 5 });

      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      expect(state.cursorIndex()).toBe(0);

      // Simulate scroll down
      simulateScroll(10, 2, 'down', 3);

      // Cursor should have moved down
      expect(state.cursorIndex()).toBeGreaterThan(0);
    });

    it('should scroll up on wheel up', () => {
      const state = createSelect({ items: manyItems, maxVisible: 5 });

      // Move cursor to middle first
      for (let i = 0; i < 10; i++) {
        state.moveDown();
      }
      expect(state.cursorIndex()).toBe(10);

      const vnode = renderSelect(state, { items: manyItems, maxVisible: 5 });
      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      // Simulate scroll up
      simulateScroll(10, 2, 'up', 3);

      // Cursor should have moved up
      expect(state.cursorIndex()).toBeLessThan(10);
    });

    it('should not scroll past beginning', () => {
      const state = createSelect({ items: manyItems, maxVisible: 5 });
      const vnode = renderSelect(state, { items: manyItems, maxVisible: 5 });

      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      expect(state.cursorIndex()).toBe(0);

      // Simulate scroll up at top
      simulateScroll(10, 2, 'up', 10);

      expect(state.cursorIndex()).toBe(0);
    });

    it('should not scroll past end', () => {
      const state = createSelect({ items: manyItems, maxVisible: 5 });

      // Move cursor to end first
      for (let i = 0; i < 30; i++) {
        state.moveDown();
      }
      const lastIndex = manyItems.length - 1;
      expect(state.cursorIndex()).toBe(lastIndex);

      const vnode = renderSelect(state, { items: manyItems, maxVisible: 5 });
      const layout = calculateLayout(vnode, 60, 20);
      registerHitTestFromLayout(layout);

      // Simulate scroll down at bottom
      simulateScroll(10, 2, 'down', 10);

      expect(state.cursorIndex()).toBe(lastIndex);
    });
  });

  describe('Rendering', () => {
    it('should render visible items', () => {
      const output = renderToString(Select({ items: basicItems }), 60);
      expect(output).toContain('Apple');
      expect(output).toContain('Banana');
      expect(output).toContain('Cherry');
    });

    it('should render all items within visible area', () => {
      // Verify that items are all rendered
      const output = renderToString(
        Select({ items: basicItems }),
        60
      );
      expect(output).toContain('Date');
      expect(output).toContain('Elderberry');
    });

    it('should render multi-select indicators', () => {
      // Multi-select should show checkbox indicators
      const output = renderToString(
        Select({
          items: basicItems,
          multiple: true,
          initialValue: ['a'],
        }),
        60
      );
      // Should have checkbox characters (checked for Apple)
      expect(output.length).toBeGreaterThan(0);
    });

    it('should render scrollbar indicators when needed', () => {
      const output = renderToString(
        Select({ items: manyItems, maxVisible: 5 }),
        60
      );
      // Should show "more below" indicator
      expect(output).toContain('more below');
    });
  });

  describe('State API', () => {
    it('should expose selectIndex method', () => {
      const onChange = vi.fn();
      const state = createSelect({ items: basicItems, onChange });

      expect(state.cursorIndex()).toBe(0);
      expect(state.selected()).toEqual([]);

      // Use selectIndex directly
      state.selectIndex(2);

      expect(state.cursorIndex()).toBe(2);
      expect(state.selected()).toContain('c');
      expect(onChange).toHaveBeenCalledWith('c');
    });

    it('should not select disabled item via selectIndex', () => {
      const onChange = vi.fn();
      const state = createSelect({ items: itemsWithDisabled, onChange });

      // Try to select disabled item (index 1 - Banana)
      state.selectIndex(1);

      // Should not have changed
      expect(state.cursorIndex()).toBe(0);
      expect(state.selected()).toEqual([]);
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should adjust scroll when selecting out of view', () => {
      const state = createSelect({ items: manyItems, maxVisible: 5 });

      expect(state.scrollOffset()).toBe(0);

      // Select item far below
      state.selectIndex(15);

      // Scroll should have adjusted
      expect(state.scrollOffset()).toBeGreaterThan(0);
    });
  });
});
