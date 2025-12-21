/**
 * Virtual Scrolling Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createVirtualScroll,
  VirtualScrollManager,
  createFixedHeightVirtualScroll,
  createVariableHeightVirtualScroll,
  getScrollDirection,
  getVisibleRangePercent,
  createScrollIndicator,
  createInfiniteScroll,
  VirtualScrollOptions,
} from '../../src/core/virtual-scroll.js';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestItems(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Item ${i}`);
}

function createManager(options: Partial<VirtualScrollOptions<string>> = {}) {
  const items = createTestItems(options.itemCount ?? 100);
  return createVirtualScroll({
    itemCount: items.length,
    getItem: (index) => items[index],
    containerHeight: 10,
    smoothScroll: false, // Disable animation for tests
    ...options,
  });
}

// =============================================================================
// createVirtualScroll
// =============================================================================

describe('createVirtualScroll', () => {
  it('should create a virtual scroll manager', () => {
    const manager = createManager();
    expect(manager).toBeInstanceOf(VirtualScrollManager);
  });

  it('should use default options', () => {
    const items = createTestItems(50);
    const manager = createVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i],
      containerHeight: 10,
    });

    expect(manager.getOffset()).toBe(0);
  });

  it('should respect initialOffset option', () => {
    const manager = createManager({ initialOffset: 20 });
    expect(manager.getOffset()).toBe(20);
  });
});

// =============================================================================
// Layout Calculation
// =============================================================================

describe('Layout Calculation', () => {
  it('should calculate total height with fixed item heights', () => {
    const manager = createManager({
      itemCount: 100,
      measureHeight: () => 1,
    });

    expect(manager.getTotalHeight()).toBe(100);
  });

  it('should calculate total height with variable item heights', () => {
    const manager = createManager({
      itemCount: 10,
      measureHeight: (_, i) => i + 1, // Heights: 1, 2, 3, ... 10
    });

    // Sum of 1 + 2 + ... + 10 = 55
    expect(manager.getTotalHeight()).toBe(55);
  });

  it('should handle empty list', () => {
    const manager = createManager({ itemCount: 0 });
    expect(manager.getTotalHeight()).toBe(0);
  });

  it('should recalculate layout when dirty', () => {
    const items = createTestItems(10);
    const manager = createVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i],
      containerHeight: 5,
      measureHeight: () => 1,
    });

    expect(manager.getTotalHeight()).toBe(10);

    // Invalidate and update
    manager.updateOptions({ itemCount: 20 });
    expect(manager.getTotalHeight()).toBe(20);
  });

  it('should get item position', () => {
    const manager = createManager({
      itemCount: 10,
      measureHeight: () => 2,
    });

    expect(manager['getItemPosition'](0)).toBe(0);
    expect(manager['getItemPosition'](1)).toBe(2);
    expect(manager['getItemPosition'](5)).toBe(10);
  });

  it('should update item height', () => {
    const manager = createManager({
      itemCount: 5,
      measureHeight: () => 1,
    });

    expect(manager.getTotalHeight()).toBe(5);

    manager.updateItemHeight(2, 3);
    expect(manager.getTotalHeight()).toBe(7); // 1 + 1 + 3 + 1 + 1
  });

  it('should invalidate heights cache', () => {
    const measureHeight = vi.fn(() => 1);
    const items = createTestItems(5);
    const manager = createVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i],
      containerHeight: 3,
      measureHeight,
    });

    // Initial measurement
    manager.getTotalHeight();
    const callCount = measureHeight.mock.calls.length;

    // Clear cache
    manager.invalidateHeights();

    // Should re-measure
    manager.getTotalHeight();
    expect(measureHeight.mock.calls.length).toBeGreaterThan(callCount);
  });
});

// =============================================================================
// Scrolling
// =============================================================================

describe('Scrolling', () => {
  it('should scroll to offset', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
    });

    manager.scrollTo(50, false);
    expect(manager.getOffset()).toBe(50);
  });

  it('should clamp scroll offset to valid range', () => {
    const manager = createManager({
      itemCount: 20,
      containerHeight: 10,
      measureHeight: () => 1,
    });

    // Max offset is 20 - 10 = 10
    manager.scrollTo(100, false);
    expect(manager.getOffset()).toBe(10);

    manager.scrollTo(-50, false);
    expect(manager.getOffset()).toBe(0);
  });

  it('should scroll by delta', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
    });

    manager.scrollBy(5, false);
    expect(manager.getOffset()).toBe(5);

    manager.scrollBy(10, false);
    expect(manager.getOffset()).toBe(15);

    manager.scrollBy(-3, false);
    expect(manager.getOffset()).toBe(12);
  });

  it('should scroll to item by index (start alignment)', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      smoothScroll: false,
    });

    manager.scrollToItem(50, 'start');
    expect(manager.getOffset()).toBe(50);
  });

  it('should scroll to item by index (center alignment)', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      smoothScroll: false,
    });

    manager.scrollToItem(50, 'center');
    // Item height 1, container 10, so center offset = 50 - (10 - 1) / 2 = 45.5
    expect(manager.getOffset()).toBe(45.5);
  });

  it('should scroll to item by index (end alignment)', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      smoothScroll: false,
    });

    manager.scrollToItem(50, 'end');
    // Item ends at 51, container is 10, so offset = 51 - 10 = 41
    expect(manager.getOffset()).toBe(41);
  });

  it('should scroll to item with auto alignment (item above viewport)', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      smoothScroll: false,
      initialOffset: 50,
    });

    manager.scrollToItem(30, 'auto');
    expect(manager.getOffset()).toBe(30);
  });

  it('should scroll to item with auto alignment (item below viewport)', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      smoothScroll: false,
      initialOffset: 0,
    });

    manager.scrollToItem(20, 'auto');
    // Item 20 ends at 21, viewport is 0-10, so need offset = 21 - 10 = 11
    expect(manager.getOffset()).toBe(11);
  });

  it('should not scroll when item is already visible (auto)', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      smoothScroll: false,
      initialOffset: 5,
    });

    // Item 7 is at position 7, visible in 5-15 range
    manager.scrollToItem(7, 'auto');
    expect(manager.getOffset()).toBe(5);
  });

  it('should scroll to top', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      initialOffset: 50,
      smoothScroll: false,
    });

    manager.scrollToTop(false);
    expect(manager.getOffset()).toBe(0);
  });

  it('should scroll to bottom', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      smoothScroll: false,
    });

    manager.scrollToBottom(false);
    expect(manager.getOffset()).toBe(90); // 100 - 10
  });

  it('should call onScroll callback', () => {
    const onScroll = vi.fn();
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      onScroll,
      smoothScroll: false,
    });

    manager.scrollTo(25, false);
    expect(onScroll).toHaveBeenCalledWith(25);
  });

  it('should call onEndReached when near end', () => {
    const onEndReached = vi.fn();
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      onEndReached,
      endReachedThreshold: 5,
      smoothScroll: false,
    });

    // Scroll near the end
    manager.scrollTo(87, false);
    expect(onEndReached).toHaveBeenCalled();
  });
});

// =============================================================================
// Visible Items
// =============================================================================

describe('Visible Items', () => {
  it('should return empty for empty list', () => {
    const manager = createManager({ itemCount: 0 });
    const result = manager.getVisibleItems();

    expect(result.items).toHaveLength(0);
    expect(result.totalHeight).toBe(0);
    expect(result.canScrollUp).toBe(false);
    expect(result.canScrollDown).toBe(false);
  });

  it('should return visible items with overscan', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      overscan: 3,
    });

    const result = manager.getVisibleItems();

    // At offset 0, visible area is rows 0-9
    // findIndexAtOffset(10) finds item 10 (first item at/after row 10)
    // With overscan 3: startIndex = max(0, 0-3) = 0, endIndex = min(99, 10+3) = 13
    expect(result.startIndex).toBe(0);
    expect(result.endIndex).toBe(13);
    expect(result.items.length).toBe(14);
  });

  it('should return correct item data', () => {
    const items = ['Apple', 'Banana', 'Cherry'];
    const manager = createVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i],
      containerHeight: 10,
      measureHeight: () => 1,
    });

    const result = manager.getVisibleItems();

    expect(result.items[0].data).toBe('Apple');
    expect(result.items[1].data).toBe('Banana');
    expect(result.items[2].data).toBe('Cherry');
  });

  it('should calculate item positions correctly', () => {
    const manager = createManager({
      itemCount: 5,
      containerHeight: 10,
      measureHeight: (_, i) => i + 1, // Heights: 1, 2, 3, 4, 5
    });

    const result = manager.getVisibleItems();

    expect(result.items[0].start).toBe(0);
    expect(result.items[0].end).toBe(1);
    expect(result.items[0].height).toBe(1);

    expect(result.items[1].start).toBe(1);
    expect(result.items[1].end).toBe(3);
    expect(result.items[1].height).toBe(2);

    expect(result.items[2].start).toBe(3);
    expect(result.items[2].end).toBe(6);
    expect(result.items[2].height).toBe(3);
  });

  it('should indicate scroll capabilities', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      smoothScroll: false,
    });

    // At top
    let result = manager.getVisibleItems();
    expect(result.canScrollUp).toBe(false);
    expect(result.canScrollDown).toBe(true);

    // Somewhere in middle
    manager.scrollTo(50, false);
    result = manager.getVisibleItems();
    expect(result.canScrollUp).toBe(true);
    expect(result.canScrollDown).toBe(true);

    // At bottom
    manager.scrollToBottom(false);
    result = manager.getVisibleItems();
    expect(result.canScrollUp).toBe(true);
    expect(result.canScrollDown).toBe(false);
  });

  it('should calculate scroll progress', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
      smoothScroll: false,
    });

    // At top
    expect(manager.getVisibleItems().scrollProgress).toBe(0);

    // At middle
    manager.scrollTo(45, false);
    expect(manager.getVisibleItems().scrollProgress).toBe(0.5);

    // At bottom
    manager.scrollToBottom(false);
    expect(manager.getVisibleItems().scrollProgress).toBe(1);
  });
});

// =============================================================================
// Binary Search
// =============================================================================

describe('Binary Search (findIndexAtOffset)', () => {
  it('should find item at given offset', () => {
    const manager = createManager({
      itemCount: 100,
      measureHeight: () => 1,
    });

    expect(manager.getItemAtPosition(0)).toBe(0);
    expect(manager.getItemAtPosition(50)).toBe(50);
    expect(manager.getItemAtPosition(99)).toBe(99);
  });

  it('should handle variable heights', () => {
    const manager = createManager({
      itemCount: 10,
      measureHeight: (_, i) => i + 1, // Heights: 1, 2, 3, ... 10
    });

    // Positions: 0, 1, 3, 6, 10, 15, 21, 28, 36, 45
    expect(manager.getItemAtPosition(0)).toBe(0);
    expect(manager.getItemAtPosition(1)).toBe(1);
    expect(manager.getItemAtPosition(3)).toBe(2);
    expect(manager.getItemAtPosition(6)).toBe(3);
    expect(manager.getItemAtPosition(10)).toBe(4);
  });

  it('should handle empty list', () => {
    const manager = createManager({ itemCount: 0 });
    expect(manager.getItemAtPosition(0)).toBe(0);
  });

  it('should clamp to valid range', () => {
    const manager = createManager({
      itemCount: 10,
      measureHeight: () => 1,
    });

    expect(manager.getItemAtPosition(-10)).toBe(0);
    expect(manager.getItemAtPosition(1000)).toBe(9);
  });
});

// =============================================================================
// Options Update
// =============================================================================

describe('Options Update', () => {
  it('should update item count', () => {
    const items = createTestItems(50);
    const manager = createVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i] ?? 'new',
      containerHeight: 10,
      measureHeight: () => 1,
    });

    expect(manager.getTotalHeight()).toBe(50);

    manager.setItemCount(100);
    expect(manager.getTotalHeight()).toBe(100);
  });

  it('should update container height', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      measureHeight: () => 1,
    });

    manager.setContainerHeight(20);

    const result = manager.getVisibleItems();
    expect(result.containerHeight).toBe(20);
  });

  it('should update multiple options', () => {
    const measureHeight = vi.fn(() => 1);
    const items = createTestItems(50);
    const manager = createVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i] ?? 'new',
      containerHeight: 10,
      measureHeight,
    });

    manager.updateOptions({
      itemCount: 100,
      containerHeight: 20,
    });

    expect(manager.getTotalHeight()).toBe(100);
  });
});

// =============================================================================
// Fixed Height Virtual Scroll
// =============================================================================

describe('createFixedHeightVirtualScroll', () => {
  it('should create manager with fixed item height', () => {
    const items = createTestItems(100);
    const manager = createFixedHeightVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i],
      containerHeight: 10,
      itemHeight: 2,
    });

    expect(manager.getTotalHeight()).toBe(200);
  });

  it('should use fixed height for all items', () => {
    const items = ['Short', 'A very long item that would normally be tall'];
    const manager = createFixedHeightVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i],
      containerHeight: 10,
      itemHeight: 3,
    });

    const result = manager.getVisibleItems();
    expect(result.items[0].height).toBe(3);
    expect(result.items[1].height).toBe(3);
  });
});

// =============================================================================
// Variable Height Virtual Scroll
// =============================================================================

describe('createVariableHeightVirtualScroll', () => {
  it('should create manager with variable heights', () => {
    const items = createTestItems(10);
    const manager = createVariableHeightVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i],
      containerHeight: 10,
      measureHeight: (_, i) => i + 1,
    });

    // Sum of 1 + 2 + ... + 10 = 55
    expect(manager.getTotalHeight()).toBe(55);
  });

  it('should use estimate height as fallback', () => {
    const items = createTestItems(10);
    const manager = createVariableHeightVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i],
      containerHeight: 10,
      estimateHeight: () => 2,
    });

    expect(manager.getTotalHeight()).toBe(20);
  });

  it('should use estimatedItemHeight when no functions provided', () => {
    const items = createTestItems(10);
    const manager = createVariableHeightVirtualScroll({
      itemCount: items.length,
      getItem: (i) => items[i],
      containerHeight: 10,
      estimatedItemHeight: 3,
    });

    expect(manager.getTotalHeight()).toBe(30);
  });
});

// =============================================================================
// Scroll Helpers
// =============================================================================

describe('getScrollDirection', () => {
  it('should return up for negative delta', () => {
    expect(getScrollDirection(-5)).toBe('up');
    expect(getScrollDirection(-0.1)).toBe('up');
  });

  it('should return down for positive delta', () => {
    expect(getScrollDirection(5)).toBe('down');
    expect(getScrollDirection(0.1)).toBe('down');
  });

  it('should return none for zero delta', () => {
    expect(getScrollDirection(0)).toBe('none');
  });
});

describe('getVisibleRangePercent', () => {
  it('should calculate visible range as percentage', () => {
    const result = getVisibleRangePercent(0, 10, 100);
    expect(result.start).toBe(0);
    expect(result.end).toBe(0.1);
  });

  it('should handle scrolled state', () => {
    const result = getVisibleRangePercent(50, 10, 100);
    expect(result.start).toBe(0.5);
    expect(result.end).toBe(0.6);
  });

  it('should clamp end to 1', () => {
    const result = getVisibleRangePercent(95, 10, 100);
    expect(result.end).toBe(1);
  });

  it('should handle zero total height', () => {
    const result = getVisibleRangePercent(0, 10, 0);
    expect(result.start).toBe(0);
    expect(result.end).toBe(1);
  });
});

describe('createScrollIndicator', () => {
  it('should calculate scrollbar thumb position and size', () => {
    const result = createScrollIndicator(10, 100, 0);

    // Ratio is 10/100 = 0.1, so size is max(1, floor(10 * 0.1)) = 1
    expect(result.size).toBe(1);
    expect(result.position).toBe(0);
  });

  it('should update position based on offset', () => {
    const result = createScrollIndicator(10, 100, 45);

    // Max offset is 90, so 45/90 = 0.5
    // Max position is 10 - 1 = 9, so position = 0.5 * 9 = 4.5 rounded to 5
    expect(result.position).toBe(5);
  });

  it('should handle content smaller than container', () => {
    const result = createScrollIndicator(100, 50, 0);

    expect(result.position).toBe(0);
    expect(result.size).toBe(100);
  });

  it('should respect minimum thumb size', () => {
    const result = createScrollIndicator(10, 1000, 0, 3);

    // Ratio is very small, so min size of 3 should be used
    expect(result.size).toBe(3);
  });

  it('should clamp position to valid range', () => {
    // At maximum scroll
    const result = createScrollIndicator(10, 100, 90);
    expect(result.position).toBe(9); // 10 - 1
  });
});

// =============================================================================
// Infinite Scroll
// =============================================================================

describe('createInfiniteScroll', () => {
  it('should create infinite scroll manager', () => {
    const loadMore = vi.fn();
    const { state } = createInfiniteScroll(loadMore);

    expect(state.items).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.hasMore).toBe(true);
    expect(state.error).toBeNull();
  });

  it('should load next page', async () => {
    const loadMore = vi.fn().mockResolvedValue({
      items: ['A', 'B', 'C'],
      hasMore: true,
    });

    const { state, loadNextPage } = createInfiniteScroll(loadMore);

    await loadNextPage();

    expect(loadMore).toHaveBeenCalledWith(0, 50);
    expect(state.items).toEqual(['A', 'B', 'C']);
    expect(state.hasMore).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should append items on subsequent loads', async () => {
    let callCount = 0;
    const loadMore = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        items: [callCount],
        hasMore: callCount < 3,
      });
    });

    const { state, loadNextPage } = createInfiniteScroll(loadMore);

    await loadNextPage();
    await loadNextPage();
    await loadNextPage();

    expect(state.items).toEqual([1, 2, 3]);
    expect(state.hasMore).toBe(false);
  });

  it('should not load when already loading', async () => {
    let resolveLoad: (value: any) => void;
    const loadMore = vi.fn().mockReturnValue(
      new Promise((resolve) => {
        resolveLoad = resolve;
      })
    );

    const { loadNextPage } = createInfiniteScroll(loadMore);

    loadNextPage(); // Start loading
    loadNextPage(); // Should be ignored

    expect(loadMore).toHaveBeenCalledTimes(1);

    resolveLoad!({ items: [], hasMore: false });
  });

  it('should not load when hasMore is false', async () => {
    const loadMore = vi.fn().mockResolvedValue({
      items: [],
      hasMore: false,
    });

    const { loadNextPage } = createInfiniteScroll(loadMore);

    await loadNextPage();
    await loadNextPage(); // Should be ignored

    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('should handle errors', async () => {
    const error = new Error('Network error');
    const loadMore = vi.fn().mockRejectedValue(error);

    const { state, loadNextPage } = createInfiniteScroll(loadMore);

    await loadNextPage();

    expect(state.error).toBe(error);
    expect(state.isLoading).toBe(false);
  });

  it('should reset state', async () => {
    const loadMore = vi.fn().mockResolvedValue({
      items: ['A', 'B'],
      hasMore: false,
    });

    const { state, loadNextPage, reset } = createInfiniteScroll(loadMore);

    await loadNextPage();
    expect(state.items).toEqual(['A', 'B']);
    expect(state.hasMore).toBe(false);

    reset();
    expect(state.items).toEqual([]);
    expect(state.hasMore).toBe(true);
  });

  it('should set items directly', () => {
    const loadMore = vi.fn();
    const { state, setItems } = createInfiniteScroll(loadMore);

    setItems(['X', 'Y', 'Z']);
    expect(state.items).toEqual(['X', 'Y', 'Z']);
  });
});

// =============================================================================
// Cleanup
// =============================================================================

describe('Cleanup', () => {
  it('should destroy manager and clear animation', () => {
    const manager = createManager({
      itemCount: 100,
      containerHeight: 10,
      smoothScroll: true,
      scrollDuration: 1000,
    });

    // Start a scroll animation
    manager.scrollTo(50, true);
    expect(manager.isScrolling()).toBe(true);

    // Destroy
    manager.destroy();

    // Animation frame should be cleared (no errors)
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge Cases', () => {
  it('should handle single item', () => {
    const manager = createManager({
      itemCount: 1,
      containerHeight: 10,
      measureHeight: () => 5,
    });

    const result = manager.getVisibleItems();
    expect(result.items).toHaveLength(1);
    expect(result.totalHeight).toBe(5);
    expect(result.canScrollUp).toBe(false);
    expect(result.canScrollDown).toBe(false);
  });

  it('should handle content exactly equal to container', () => {
    const manager = createManager({
      itemCount: 10,
      containerHeight: 10,
      measureHeight: () => 1,
    });

    const result = manager.getVisibleItems();
    expect(result.canScrollDown).toBe(false);
    expect(result.canScrollUp).toBe(false);
  });

  it('should handle very large item counts', () => {
    const manager = createManager({
      itemCount: 100000,
      containerHeight: 50,
      measureHeight: () => 1,
    });

    // Binary search should handle this efficiently
    const result = manager.getVisibleItems();
    expect(result.items.length).toBeLessThan(60); // 50 + 2 * overscan
  });

  it('should handle items taller than container', () => {
    const manager = createManager({
      itemCount: 5,
      containerHeight: 5,
      measureHeight: () => 10, // Each item is taller than container
    });

    const result = manager.getVisibleItems();
    expect(result.items.length).toBeGreaterThanOrEqual(1);
  });
});
