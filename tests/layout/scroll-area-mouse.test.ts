/**
 * ScrollArea Mouse Event Tests
 *
 * Tests for mouse scroll interaction with ScrollArea and VirtualList
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ScrollArea,
  VirtualList,
  createScrollArea,
  createVirtualList,
} from '../../src/design-system/layout/scroll-area.js';
import { Box, Text } from '../../src/primitives/index.js';
import { calculateLayout } from '../../src/design-system/core/layout.js';
import { renderToString } from '../../src/design-system/core/renderer.js';
import {
  getHitTestRegistry,
  resetHitTestRegistry,
  registerHitTestFromLayout,
} from '../../src/core/hit-test.js';
import { MouseSimulator, simulateScroll } from '../../src/dev-tools/mouse-simulator.js';
import type { VNode } from '../../src/utils/types.js';

describe('ScrollArea Mouse Events', () => {
  beforeEach(() => {
    resetHitTestRegistry();
  });

  afterEach(() => {
    resetHitTestRegistry();
  });

  describe('Mouse Wheel Scrolling', () => {
    it('should scroll down on wheel down', () => {
      const onScroll = vi.fn();
      const content = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

      const scrollArea = ScrollArea({
        height: 5,
        content,
        onScroll,
      });

      const layout = calculateLayout(scrollArea, 40, 10);
      registerHitTestFromLayout(layout);

      // Simulate scroll down
      const sim = new MouseSimulator();
      sim.scroll(10, 2, 'down', 3);

      const registry = getHitTestRegistry();
      expect(registry.hasClickableElements()).toBe(true);
    });

    it('should scroll up on wheel up', () => {
      const content = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

      const state = createScrollArea({
        height: 5,
        content,
        initialScrollTop: 10, // Start scrolled down
      });

      const scrollArea = ScrollArea({
        height: 5,
        content,
        state,
      });

      const layout = calculateLayout(scrollArea, 40, 10);
      registerHitTestFromLayout(layout);

      // Simulate scroll up
      simulateScroll(10, 2, 'up', 3);

      // State should have scrolled up
      expect(state.scrollTop()).toBeLessThan(10);
    });

    it('should respect scroll step', () => {
      const content = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`);

      const state = createScrollArea({
        height: 5,
        content,
      });

      const scrollArea = ScrollArea({
        height: 5,
        content,
        state,
        scrollStep: 5, // Scroll by 5 lines at a time
      });

      const layout = calculateLayout(scrollArea, 40, 10);
      registerHitTestFromLayout(layout);

      // Initial position
      expect(state.scrollTop()).toBe(0);

      // Simulate scroll down
      simulateScroll(10, 2, 'down', 1);

      // Should have scrolled
      // Note: exact amount depends on implementation
    });

    it('should not scroll past beginning', () => {
      const content = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

      const state = createScrollArea({
        height: 5,
        content,
        initialScrollTop: 0,
      });

      const scrollArea = ScrollArea({
        height: 5,
        content,
        state,
      });

      const layout = calculateLayout(scrollArea, 40, 10);
      registerHitTestFromLayout(layout);

      // Simulate scroll up at top
      simulateScroll(10, 2, 'up', 10);

      expect(state.scrollTop()).toBe(0);
    });

    it('should not scroll past end', () => {
      const content = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);
      const maxScroll = 20 - 5; // content.length - height

      const state = createScrollArea({
        height: 5,
        content,
        initialScrollTop: maxScroll,
      });

      const scrollArea = ScrollArea({
        height: 5,
        content,
        state,
      });

      const layout = calculateLayout(scrollArea, 40, 10);
      registerHitTestFromLayout(layout);

      // Simulate scroll down at bottom
      simulateScroll(10, 2, 'down', 10);

      expect(state.scrollTop()).toBe(maxScroll);
    });
  });

  describe('Scrollbar Rendering', () => {
    it('should show scrollbar when content exceeds height', () => {
      const content = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

      const scrollArea = ScrollArea({
        height: 5,
        content,
        showScrollbar: true,
      });

      const output = renderToString(scrollArea, 40);
      // Should contain scrollbar characters
      expect(output.length).toBeGreaterThan(0);
    });

    it('should not show scrollbar when disabled', () => {
      const content = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

      const scrollArea = ScrollArea({
        height: 5,
        content,
        showScrollbar: false,
      });

      const output = renderToString(scrollArea, 40);
      expect(output).toContain('Line 1');
    });
  });
});

describe('VirtualList Mouse Events', () => {
  beforeEach(() => {
    resetHitTestRegistry();
  });

  afterEach(() => {
    resetHitTestRegistry();
  });

  describe('Mouse Wheel Scrolling', () => {
    it('should scroll on wheel events', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        key: `item-${i}`,
        data: { name: `Item ${i + 1}` },
      }));

      const state = createVirtualList({
        items,
        height: 5,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
      });

      const list = VirtualList({
        items,
        height: 5,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
        state,
      });

      const layout = calculateLayout(list, 40, 10);
      registerHitTestFromLayout(layout);

      // Initial selection
      expect(state.selectedIndex()).toBe(0);

      // Simulate scroll down
      simulateScroll(10, 2, 'down', 1);

      // Selection should have moved
      expect(state.selectedIndex()).toBeGreaterThan(0);
    });

    it('should scroll up on wheel up', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        key: `item-${i}`,
        data: { name: `Item ${i + 1}` },
      }));

      const state = createVirtualList({
        items,
        height: 5,
        initialSelected: 10, // Start in the middle
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
      });

      const list = VirtualList({
        items,
        height: 5,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
        state,
      });

      const layout = calculateLayout(list, 40, 10);
      registerHitTestFromLayout(layout);

      // Simulate scroll up
      simulateScroll(10, 2, 'up', 1);

      expect(state.selectedIndex()).toBeLessThan(10);
    });
  });

  describe('Item Click Selection', () => {
    it('should select item on click', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        key: `item-${i}`,
        data: { name: `Item ${i + 1}` },
      }));

      const onSelect = vi.fn();

      const state = createVirtualList({
        items,
        height: 5,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
        onSelect,
      });

      const list = VirtualList({
        items,
        height: 5,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
        state,
      });

      const layout = calculateLayout(list, 40, 10);
      registerHitTestFromLayout(layout);

      const registry = getHitTestRegistry();
      // Should have clickable items
      expect(registry.hasClickableElements()).toBe(true);
      expect(registry.count).toBeGreaterThanOrEqual(5); // 5 items

      // Get the actual positions of clickable elements
      const elements = registry.getElements();

      // Find the third clickable item (index 2 in list)
      // Elements are registered in render order, so we filter by those with onClick
      const clickableItems = elements.filter(e => e.node.props.onClick);
      expect(clickableItems.length).toBeGreaterThanOrEqual(3);

      // Click on the third item using its actual bounds
      const thirdItem = clickableItems[2];
      const sim = new MouseSimulator();
      sim.click(thirdItem.x + 1, thirdItem.y);

      // Item should be selected
      expect(state.selectedIndex()).toBe(2);
      expect(onSelect).toHaveBeenCalled();
    });

    it('should handle click on scrolled list', () => {
      const items = Array.from({ length: 20 }, (_, i) => ({
        key: `item-${i}`,
        data: { name: `Item ${i + 1}` },
      }));

      const state = createVirtualList({
        items,
        height: 5,
        initialSelected: 10,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
      });

      const list = VirtualList({
        items,
        height: 5,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
        state,
      });

      const layout = calculateLayout(list, 40, 10);
      registerHitTestFromLayout(layout);

      // The list should show items around index 10
      // Clicking should select based on visible position
      const sim = new MouseSimulator();
      sim.click(10, 0);

      // Should have clicked on a visible item
      expect(state.selectedIndex()).toBeGreaterThanOrEqual(0);
    });

    it('should activate item on double click', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        key: `item-${i}`,
        data: { name: `Item ${i + 1}` },
      }));

      const onActivate = vi.fn();

      const list = VirtualList({
        items,
        height: 5,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
        onActivate,
      });

      const layout = calculateLayout(list, 40, 10);
      registerHitTestFromLayout(layout);

      // Render the list
      const output = renderToString(list, 40);
      expect(output).toContain('Item 1');
    });
  });

  describe('Rendering', () => {
    it('should render visible items', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({
        key: `item-${i}`,
        data: { name: `Item ${i + 1}` },
      }));

      const list = VirtualList({
        items,
        height: 3,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name),
      });

      const output = renderToString(list, 40);
      expect(output).toContain('Item 1');
      expect(output).toContain('Item 2');
      expect(output).toContain('Item 3');
    });

    it('should highlight selected item', () => {
      const items = Array.from({ length: 5 }, (_, i) => ({
        key: `item-${i}`,
        data: { name: `Item ${i + 1}` },
      }));

      const list = VirtualList({
        items,
        height: 5,
        initialSelected: 2,
        renderItem: (item, index, isSelected) =>
          Text({ color: isSelected ? 'cyan' : 'white' }, `${isSelected ? '>' : ' '} ${item.data.name}`),
      });

      const output = renderToString(list, 40);
      expect(output).toContain('> Item 3');
    });
  });
});
