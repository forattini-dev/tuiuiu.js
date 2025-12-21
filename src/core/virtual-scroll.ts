/**
 * Virtual Scrolling System
 *
 * Features:
 * - Efficient rendering of large lists (only visible items rendered)
 * - Variable item heights with measurement caching
 * - Smooth scrolling with animation
 * - Overscan for smoother experience
 * - Keyboard navigation
 * - Infinite scroll pattern
 *
 * Inspired by: React Virtual, Textual (ScrollView), Ratatui (List)
 */

// =============================================================================
// Types
// =============================================================================

/** Virtual scroll item */
export interface VirtualItem<T = unknown> {
  /** Item index in the data array */
  index: number;
  /** Computed start position (in rows) */
  start: number;
  /** Computed end position (in rows) */
  end: number;
  /** Item height (in rows) */
  height: number;
  /** The actual data item */
  data: T;
}

/** Height measurement function */
export type MeasureHeight<T> = (item: T, index: number) => number;

/** Virtual scroll options */
export interface VirtualScrollOptions<T> {
  /** Total number of items */
  itemCount: number;
  /** Get item by index */
  getItem: (index: number) => T;
  /** Measure item height (default: 1) */
  measureHeight?: MeasureHeight<T>;
  /** Number of extra items to render above/below visible area */
  overscan?: number;
  /** Container height in rows */
  containerHeight: number;
  /** Enable smooth scrolling animation */
  smoothScroll?: boolean;
  /** Scroll animation duration (ms) */
  scrollDuration?: number;
  /** Initial scroll offset */
  initialOffset?: number;
  /** Callback when scroll position changes */
  onScroll?: (offset: number) => void;
  /** Callback when reaching end (for infinite scroll) */
  onEndReached?: () => void;
  /** Threshold from end to trigger onEndReached (items) */
  endReachedThreshold?: number;
  /** Estimated item height for initial layout */
  estimatedItemHeight?: number;
}

/** Virtual scroll state */
export interface VirtualScrollState {
  /** Current scroll offset (in rows) */
  offset: number;
  /** Target offset for smooth scrolling */
  targetOffset: number;
  /** Whether currently scrolling */
  isScrolling: boolean;
  /** Measured heights cache (index -> height) */
  heightCache: Map<number, number>;
  /** Computed positions cache (index -> start position) */
  positionCache: Map<number, number>;
  /** Total content height */
  totalHeight: number;
  /** Whether height calculation is dirty */
  dirty: boolean;
}

/** Virtual scroll result */
export interface VirtualScrollResult<T> {
  /** Items to render */
  items: VirtualItem<T>[];
  /** Total content height */
  totalHeight: number;
  /** Current scroll offset */
  offset: number;
  /** Container height */
  containerHeight: number;
  /** Whether can scroll up */
  canScrollUp: boolean;
  /** Whether can scroll down */
  canScrollDown: boolean;
  /** First visible item index */
  startIndex: number;
  /** Last visible item index */
  endIndex: number;
  /** Scroll position as percentage (0-1) */
  scrollProgress: number;
}

// =============================================================================
// Virtual Scroll Manager
// =============================================================================

/**
 * Create a virtual scroll manager
 */
export function createVirtualScroll<T>(options: VirtualScrollOptions<T>): VirtualScrollManager<T> {
  return new VirtualScrollManager(options);
}

/**
 * Virtual scroll manager class
 */
export class VirtualScrollManager<T> {
  private options: Required<VirtualScrollOptions<T>>;
  private state: VirtualScrollState;
  private animationFrame: ReturnType<typeof setTimeout> | null = null;

  constructor(options: VirtualScrollOptions<T>) {
    this.options = {
      overscan: 3,
      smoothScroll: true,
      scrollDuration: 150,
      initialOffset: 0,
      onScroll: () => {},
      onEndReached: () => {},
      endReachedThreshold: 5,
      estimatedItemHeight: 1,
      measureHeight: () => 1,
      ...options,
    };

    this.state = {
      offset: this.options.initialOffset,
      targetOffset: this.options.initialOffset,
      isScrolling: false,
      heightCache: new Map(),
      positionCache: new Map(),
      totalHeight: 0,
      dirty: true,
    };

    // Initial calculation
    this.recalculateLayout();
  }

  // ===========================================================================
  // Layout Calculation
  // ===========================================================================

  /**
   * Recalculate total height and positions
   */
  recalculateLayout(): void {
    const { itemCount, getItem, measureHeight } = this.options;

    let position = 0;
    this.state.positionCache.clear();

    for (let i = 0; i < itemCount; i++) {
      this.state.positionCache.set(i, position);

      let height = this.state.heightCache.get(i);
      if (height === undefined) {
        const item = getItem(i);
        height = measureHeight(item, i);
        this.state.heightCache.set(i, height);
      }

      position += height;
    }

    this.state.totalHeight = position;
    this.state.dirty = false;
  }

  /**
   * Get height for item at index
   */
  getItemHeight(index: number): number {
    let height = this.state.heightCache.get(index);
    if (height === undefined) {
      const item = this.options.getItem(index);
      height = this.options.measureHeight(item, index);
      this.state.heightCache.set(index, height);
    }
    return height;
  }

  /**
   * Get position for item at index
   */
  getItemPosition(index: number): number {
    if (this.state.dirty) {
      this.recalculateLayout();
    }
    return this.state.positionCache.get(index) ?? 0;
  }

  /**
   * Update item height (call when item content changes)
   */
  updateItemHeight(index: number, height: number): void {
    const oldHeight = this.state.heightCache.get(index);
    if (oldHeight !== height) {
      this.state.heightCache.set(index, height);
      this.state.dirty = true;
    }
  }

  /**
   * Invalidate height cache
   */
  invalidateHeights(): void {
    this.state.heightCache.clear();
    this.state.dirty = true;
  }

  // ===========================================================================
  // Scrolling
  // ===========================================================================

  /**
   * Scroll to offset
   */
  scrollTo(offset: number, animate = true): void {
    const maxOffset = Math.max(0, this.state.totalHeight - this.options.containerHeight);
    const clampedOffset = Math.max(0, Math.min(offset, maxOffset));

    if (animate && this.options.smoothScroll) {
      this.animateScroll(clampedOffset);
    } else {
      this.state.offset = clampedOffset;
      this.state.targetOffset = clampedOffset;
      this.options.onScroll(clampedOffset);
    }

    this.checkEndReached();
  }

  /**
   * Scroll by delta
   */
  scrollBy(delta: number, animate = false): void {
    this.scrollTo(this.state.offset + delta, animate);
  }

  /**
   * Scroll to item by index
   */
  scrollToItem(index: number, align: 'start' | 'center' | 'end' | 'auto' = 'auto'): void {
    if (this.state.dirty) {
      this.recalculateLayout();
    }

    const itemStart = this.getItemPosition(index);
    const itemHeight = this.getItemHeight(index);
    const itemEnd = itemStart + itemHeight;
    const { containerHeight } = this.options;
    const { offset } = this.state;

    let targetOffset = offset;

    switch (align) {
      case 'start':
        targetOffset = itemStart;
        break;
      case 'center':
        targetOffset = itemStart - (containerHeight - itemHeight) / 2;
        break;
      case 'end':
        targetOffset = itemEnd - containerHeight;
        break;
      case 'auto':
        // Scroll only if item is not fully visible
        if (itemStart < offset) {
          targetOffset = itemStart;
        } else if (itemEnd > offset + containerHeight) {
          targetOffset = itemEnd - containerHeight;
        }
        break;
    }

    this.scrollTo(targetOffset);
  }

  /**
   * Scroll to top
   */
  scrollToTop(animate = true): void {
    this.scrollTo(0, animate);
  }

  /**
   * Scroll to bottom
   */
  scrollToBottom(animate = true): void {
    this.scrollTo(this.state.totalHeight - this.options.containerHeight, animate);
  }

  private animateScroll(targetOffset: number): void {
    this.state.targetOffset = targetOffset;
    this.state.isScrolling = true;

    if (this.animationFrame) {
      clearTimeout(this.animationFrame);
    }

    const startOffset = this.state.offset;
    const distance = targetOffset - startOffset;
    const startTime = Date.now();
    const duration = this.options.scrollDuration;

    const step = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      this.state.offset = startOffset + distance * eased;

      this.options.onScroll(this.state.offset);

      if (progress < 1) {
        this.animationFrame = setTimeout(step, 16);
      } else {
        this.state.offset = targetOffset;
        this.state.isScrolling = false;
        this.animationFrame = null;
      }
    };

    step();
  }

  private checkEndReached(): void {
    const { itemCount, endReachedThreshold, onEndReached, containerHeight } = this.options;
    const { totalHeight, offset } = this.state;

    // Check if we're near the end
    const remaining = totalHeight - offset - containerHeight;
    const threshold = endReachedThreshold * (this.options.estimatedItemHeight || 1);

    if (remaining <= threshold && itemCount > 0) {
      onEndReached();
    }
  }

  // ===========================================================================
  // Query
  // ===========================================================================

  /**
   * Get visible items for rendering
   */
  getVisibleItems(): VirtualScrollResult<T> {
    if (this.state.dirty) {
      this.recalculateLayout();
    }

    const { itemCount, getItem, containerHeight, overscan } = this.options;
    const { offset, totalHeight } = this.state;

    if (itemCount === 0) {
      return {
        items: [],
        totalHeight: 0,
        offset: 0,
        containerHeight,
        canScrollUp: false,
        canScrollDown: false,
        startIndex: 0,
        endIndex: 0,
        scrollProgress: 0,
      };
    }

    // Find start index (binary search)
    let startIndex = this.findIndexAtOffset(offset);
    startIndex = Math.max(0, startIndex - overscan);

    // Find end index
    const endOffset = offset + containerHeight;
    let endIndex = this.findIndexAtOffset(endOffset);
    endIndex = Math.min(itemCount - 1, endIndex + overscan);

    // Build items array
    const items: VirtualItem<T>[] = [];
    for (let i = startIndex; i <= endIndex; i++) {
      const start = this.getItemPosition(i);
      const height = this.getItemHeight(i);

      items.push({
        index: i,
        start,
        end: start + height,
        height,
        data: getItem(i),
      });
    }

    const maxOffset = Math.max(0, totalHeight - containerHeight);

    return {
      items,
      totalHeight,
      offset,
      containerHeight,
      canScrollUp: offset > 0,
      canScrollDown: offset < maxOffset,
      startIndex,
      endIndex,
      scrollProgress: maxOffset > 0 ? offset / maxOffset : 0,
    };
  }

  /**
   * Find item index at given offset using binary search
   */
  private findIndexAtOffset(offset: number): number {
    const { itemCount } = this.options;

    if (itemCount === 0) return 0;

    let low = 0;
    let high = itemCount - 1;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const position = this.getItemPosition(mid);
      const height = this.getItemHeight(mid);

      if (offset < position) {
        high = mid - 1;
      } else if (offset >= position + height) {
        low = mid + 1;
      } else {
        return mid;
      }
    }

    return Math.max(0, Math.min(low, itemCount - 1));
  }

  /**
   * Get current offset
   */
  getOffset(): number {
    return this.state.offset;
  }

  /**
   * Get total height
   */
  getTotalHeight(): number {
    if (this.state.dirty) {
      this.recalculateLayout();
    }
    return this.state.totalHeight;
  }

  /**
   * Check if currently scrolling
   */
  isScrolling(): boolean {
    return this.state.isScrolling;
  }

  /**
   * Get index of item at given row position
   */
  getItemAtPosition(position: number): number {
    return this.findIndexAtOffset(position);
  }

  // ===========================================================================
  // Options Update
  // ===========================================================================

  /**
   * Update item count
   */
  setItemCount(count: number): void {
    if (this.options.itemCount !== count) {
      this.options.itemCount = count;
      this.state.dirty = true;
    }
  }

  /**
   * Update container height
   */
  setContainerHeight(height: number): void {
    this.options.containerHeight = height;
  }

  /**
   * Update options
   */
  updateOptions(options: Partial<VirtualScrollOptions<T>>): void {
    Object.assign(this.options, options);
    if (options.itemCount !== undefined || options.measureHeight !== undefined) {
      this.state.dirty = true;
    }
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.animationFrame) {
      clearTimeout(this.animationFrame);
      this.animationFrame = null;
    }
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a fixed-height virtual scroll (all items same height)
 */
export function createFixedHeightVirtualScroll<T>(
  options: Omit<VirtualScrollOptions<T>, 'measureHeight'> & { itemHeight: number }
): VirtualScrollManager<T> {
  const { itemHeight, ...rest } = options;
  return new VirtualScrollManager({
    ...rest,
    measureHeight: () => itemHeight,
    estimatedItemHeight: itemHeight,
  });
}

/**
 * Create a variable-height virtual scroll with height estimator
 */
export function createVariableHeightVirtualScroll<T>(
  options: VirtualScrollOptions<T> & {
    /** Estimate height before measurement */
    estimateHeight?: MeasureHeight<T>;
  }
): VirtualScrollManager<T> {
  const { estimateHeight, measureHeight, ...rest } = options;

  // Use estimator as fallback for unmeasured items
  const actualMeasure: MeasureHeight<T> = measureHeight || ((item, index) => {
    if (estimateHeight) {
      return estimateHeight(item, index);
    }
    return options.estimatedItemHeight || 1;
  });

  return new VirtualScrollManager({
    ...rest,
    measureHeight: actualMeasure,
  });
}

// =============================================================================
// Scroll Helpers
// =============================================================================

/** Scroll direction */
export type ScrollDirection = 'up' | 'down' | 'none';

/**
 * Determine scroll direction from delta
 */
export function getScrollDirection(delta: number): ScrollDirection {
  if (delta < 0) return 'up';
  if (delta > 0) return 'down';
  return 'none';
}

/**
 * Calculate visible range percentage
 */
export function getVisibleRangePercent(
  offset: number,
  containerHeight: number,
  totalHeight: number
): { start: number; end: number } {
  if (totalHeight === 0) return { start: 0, end: 1 };

  const start = offset / totalHeight;
  const end = Math.min(1, (offset + containerHeight) / totalHeight);

  return { start, end };
}

/**
 * Create scroll indicators (for scrollbar rendering)
 */
export function createScrollIndicator(
  containerHeight: number,
  totalHeight: number,
  offset: number,
  minThumbSize = 1
): { position: number; size: number } {
  if (totalHeight <= containerHeight) {
    return { position: 0, size: containerHeight };
  }

  const ratio = containerHeight / totalHeight;
  let size = Math.max(minThumbSize, Math.floor(containerHeight * ratio));
  const maxPosition = containerHeight - size;
  const scrollRange = totalHeight - containerHeight;
  const position = Math.round((offset / scrollRange) * maxPosition);

  return { position: Math.max(0, Math.min(position, maxPosition)), size };
}

// =============================================================================
// Infinite Scroll Helper
// =============================================================================

/** Infinite scroll state */
export interface InfiniteScrollState<T> {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  error: Error | null;
}

/**
 * Create infinite scroll manager
 */
export function createInfiniteScroll<T>(
  loadMore: (offset: number, limit: number) => Promise<{ items: T[]; hasMore: boolean }>
): {
  state: InfiniteScrollState<T>;
  loadNextPage: () => Promise<void>;
  reset: () => void;
  setItems: (items: T[]) => void;
} {
  const state: InfiniteScrollState<T> = {
    items: [],
    isLoading: false,
    hasMore: true,
    error: null,
  };

  const loadNextPage = async () => {
    if (state.isLoading || !state.hasMore) return;

    state.isLoading = true;
    state.error = null;

    try {
      const result = await loadMore(state.items.length, 50);
      state.items = [...state.items, ...result.items];
      state.hasMore = result.hasMore;
    } catch (err) {
      state.error = err instanceof Error ? err : new Error(String(err));
    } finally {
      state.isLoading = false;
    }
  };

  const reset = () => {
    state.items = [];
    state.isLoading = false;
    state.hasMore = true;
    state.error = null;
  };

  const setItems = (items: T[]) => {
    state.items = items;
  };

  return { state, loadNextPage, reset, setItems };
}
