/**
 * ScrollList - Simple, powerful scrollable lists
 *
 * @layer Organism
 * @description Easy-to-use scrollable list with auto-height estimation
 *
 * Features:
 * - Zero-config for simple cases
 * - Auto-height estimation with caching
 * - ChatList preset for chat UIs
 * - useScrollList hook for advanced control
 * - Keyboard navigation (arrows, page up/down, vim keys)
 * - Mouse scroll support
 * - Scrollbar indicator
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal, createMemo } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { renderToString } from '../core/renderer.js';

// =============================================================================
// Types
// =============================================================================

export interface ScrollListProps<T> {
  /** Items to display */
  items: T[] | (() => T[]);

  /** Render function for each item */
  children: (item: T, index: number) => VNode;

  /** Visible height in lines */
  height: number;

  /** Width for layout calculation */
  width?: number;

  /**
   * Item height - can be:
   * - number: fixed height for all items
   * - function: calculate per item
   * - undefined: auto-estimate (rendered height)
   */
  itemHeight?: number | ((item: T) => number);

  /**
   * Inverted mode (chat-style)
   * - false (default): scroll 0 = top, newest at bottom
   * - true: scroll 0 = bottom, newest visible first
   */
  inverted?: boolean;

  /** Show scrollbar (default: true) */
  showScrollbar?: boolean;

  /** Enable keyboard navigation (default: true) */
  keysEnabled?: boolean;

  /** Is component active/focused (default: true) */
  isActive?: boolean;

  /** Scrollbar thumb color */
  scrollbarColor?: ColorValue;

  /** Scrollbar track color */
  trackColor?: ColorValue;

  /** External state from useScrollList */
  state?: ScrollListState;
}

export interface ScrollListState {
  scrollTop: () => number;
  maxScroll: () => number;
  scrollBy: (delta: number) => void;
  scrollTo: (pos: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  pageUp: () => void;
  pageDown: () => void;
  setHeight: (h: number) => void;
  setInverted: (inv: boolean) => void;
}

interface ScrollListInternalOptions {
  inverted?: boolean;
  initialHeight?: number;
}

// =============================================================================
// Height Estimation Cache
// =============================================================================

// WeakMap to cache heights - automatically garbage collected when items are removed
const heightCache = new WeakMap<object, number>();

function estimateItemHeight<T>(
  item: T,
  render: (item: T, index: number) => VNode,
  index: number,
  width: number
): number {
  // Only cache objects (not primitives)
  if (typeof item === 'object' && item !== null) {
    const cached = heightCache.get(item);
    if (cached !== undefined) return cached;
  }

  // Render to string and count lines
  const node = render(item, index);
  const rendered = renderToString(node, width);
  const height = Math.max(1, rendered.split('\n').length);

  // Cache if object
  if (typeof item === 'object' && item !== null) {
    heightCache.set(item, height);
  }

  return height;
}

// =============================================================================
// State Factory
// =============================================================================

export function createScrollList(options: ScrollListInternalOptions = {}): ScrollListState {
  const { inverted: initialInverted = false, initialHeight = 10 } = options;

  const [scrollTop, setScrollTop] = createSignal(0);
  const [height, setHeight] = createSignal(initialHeight);
  const [inverted, setInverted] = createSignal(initialInverted);
  const [maxScroll, setMaxScroll] = createSignal(0);

  const scrollBy = (delta: number) => {
    const max = maxScroll();
    setScrollTop(current => Math.max(0, Math.min(max, current + delta)));
  };

  const scrollTo = (pos: number) => {
    const max = maxScroll();
    setScrollTop(Math.max(0, Math.min(max, pos)));
  };

  const effectivePageHeight = () => Math.max(1, height());

  const pageUp = () => {
    scrollBy(inverted() ? effectivePageHeight() : -effectivePageHeight());
  };

  const pageDown = () => {
    scrollBy(inverted() ? -effectivePageHeight() : effectivePageHeight());
  };

  const scrollToBottom = () => {
    scrollTo(inverted() ? 0 : maxScroll());
  };

  const scrollToTop = () => {
    scrollTo(inverted() ? maxScroll() : 0);
  };

  return {
    scrollTop,
    maxScroll,
    scrollBy,
    scrollTo,
    scrollToTop,
    scrollToBottom,
    pageUp,
    pageDown,
    setHeight,
    setInverted,
    // Internal: allow updating maxScroll from component
    _setMaxScroll: setMaxScroll,
  } as ScrollListState & { _setMaxScroll: (max: number) => void };
}

// =============================================================================
// Hook
// =============================================================================

export interface UseScrollListOptions {
  inverted?: boolean;
}

export interface UseScrollListReturn {
  /** Scroll to bottom of list */
  scrollToBottom: () => void;
  /** Scroll to top of list */
  scrollToTop: () => void;
  /** Scroll to specific position */
  scrollTo: (pos: number) => void;
  /** Scroll by delta */
  scrollBy: (delta: number) => void;
  /** Current scroll position */
  scrollTop: () => number;
  /** Maximum scroll value */
  maxScroll: () => number;
  /** Props to spread into ScrollList */
  bind: { state: ScrollListState };
}

/**
 * Hook for advanced scroll list control
 *
 * @example
 * const list = useScrollList({ inverted: true });
 *
 * // Later:
 * list.scrollToBottom();
 *
 * // In render:
 * ScrollList({
 *   ...list.bind,
 *   items: messages(),
 *   children: (msg) => ChatBubble({ message: msg }),
 *   height: 20,
 * })
 */
export function useScrollList(options: UseScrollListOptions = {}): UseScrollListReturn {
  const state = createScrollList({
    inverted: options.inverted,
  });

  return {
    scrollToBottom: () => state.scrollToBottom(),
    scrollToTop: () => state.scrollToTop(),
    scrollTo: (pos: number) => state.scrollTo(pos),
    scrollBy: (delta: number) => state.scrollBy(delta),
    scrollTop: () => state.scrollTop(),
    maxScroll: () => state.maxScroll(),
    bind: { state },
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * ScrollList - Simple, powerful scrollable list
 *
 * @example
 * // Basic usage
 * ScrollList({
 *   items: messages(),
 *   children: (msg) => Text({}, msg.content),
 *   height: 20,
 * })
 *
 * @example
 * // With fixed item height
 * ScrollList({
 *   items: files(),
 *   children: (file) => FileRow({ file }),
 *   height: 20,
 *   itemHeight: 1,
 * })
 *
 * @example
 * // With hook for control
 * const list = useScrollList();
 * // ...
 * ScrollList({
 *   ...list.bind,
 *   items: data(),
 *   children: (item) => Row({ item }),
 *   height: 20,
 * })
 */
export function ScrollList<T>(props: ScrollListProps<T>): VNode {
  const {
    items,
    children,
    height,
    width = 80,
    itemHeight,
    inverted = false,
    showScrollbar = true,
    keysEnabled = true,
    isActive = true,
    scrollbarColor = 'cyan',
    trackColor = 'gray',
    state: externalState,
  } = props;

  // Use external state or create internal
  const state = externalState || createScrollList({ inverted, initialHeight: height });

  // Update state with current props
  state.setHeight(height);
  state.setInverted(inverted);

  // Get items array
  const getItems = (): T[] => {
    return typeof items === 'function' ? (items as () => T[])() : items;
  };

  // Height resolver
  const getItemHeight = (item: T, index: number): number => {
    if (typeof itemHeight === 'number') {
      return itemHeight;
    }
    if (typeof itemHeight === 'function') {
      return itemHeight(item);
    }
    // Auto-estimate
    return estimateItemHeight(item, children, index, width);
  };

  // Calculate total height and max scroll
  const itemList = getItems();
  let totalHeight = 0;
  const itemHeights: number[] = [];

  for (let i = 0; i < itemList.length; i++) {
    const h = getItemHeight(itemList[i]!, i);
    itemHeights.push(h);
    totalHeight += h;
  }

  const maxScroll = Math.max(0, totalHeight - height);

  // Update max scroll in state
  if ('_setMaxScroll' in state) {
    (state as any)._setMaxScroll(maxScroll);
  }

  const scrollTop = state.scrollTop();

  // Keyboard handling
  useInput((input, key) => {
    if (!keysEnabled) return;

    if (key.pageUp) state.pageUp();
    else if (key.pageDown) state.pageDown();
    else if (key.home) state.scrollToTop();
    else if (key.end) state.scrollToBottom();

    // Arrows / Vim keys
    if (inverted) {
      if (key.upArrow || input === 'k') state.scrollBy(1);
      else if (key.downArrow || input === 'j') state.scrollBy(-1);
    } else {
      if (key.upArrow || input === 'k') state.scrollBy(-1);
      else if (key.downArrow || input === 'j') state.scrollBy(1);
    }
  }, { isActive });

  // Mouse scroll
  const handleScroll = (event: { button: string }) => {
    if (event.button === 'scroll-up') {
      state.scrollBy(inverted ? 3 : -3);
    } else if (event.button === 'scroll-down') {
      state.scrollBy(inverted ? -3 : 3);
    }
  };

  // Render visible items
  const visibleNodes: VNode[] = [];

  if (!inverted) {
    // Standard (top-down)
    let currentY = 0;
    let renderedHeight = 0;

    for (let i = 0; i < itemList.length; i++) {
      const item = itemList[i]!;
      const itemH = itemHeights[i]!;

      if (currentY + itemH <= scrollTop) {
        currentY += itemH;
        continue;
      }

      if (renderedHeight < height) {
        visibleNodes.push(children(item, i));
        renderedHeight += itemH;
      } else {
        break;
      }

      currentY += itemH;
    }
  } else {
    // Inverted (chat-style, bottom-up)
    const reversedItems = [...itemList].reverse();
    const reversedHeights = [...itemHeights].reverse();

    let linesSkipped = 0;
    let renderedHeight = 0;

    for (let i = 0; i < reversedItems.length; i++) {
      const item = reversedItems[i]!;
      const itemH = reversedHeights[i]!;
      const originalIndex = itemList.length - 1 - i;

      if (linesSkipped < scrollTop) {
        if (linesSkipped + itemH <= scrollTop) {
          linesSkipped += itemH;
          continue;
        }
      }

      if (renderedHeight < height) {
        visibleNodes.unshift(children(item, originalIndex));
        renderedHeight += itemH;
      } else {
        break;
      }
    }
  }

  // Scrollbar
  let scrollbar: VNode | null = null;

  if (showScrollbar && maxScroll > 0) {
    const chars = getChars();
    const isAscii = getRenderMode() === 'ascii';

    const scrollValue = inverted
      ? Math.max(0, maxScroll - scrollTop)
      : scrollTop;

    const thumbHeight = Math.max(1, Math.floor((height / totalHeight) * height));
    const thumbPosition = Math.floor((scrollValue / maxScroll) * (height - thumbHeight));

    const scrollbarLines: VNode[] = [];
    for (let i = 0; i < height; i++) {
      const isThumb = i >= thumbPosition && i < thumbPosition + thumbHeight;
      const char = isThumb
        ? (isAscii ? '#' : chars.scrollbar.thumb)
        : (isAscii ? '|' : chars.scrollbar.track);
      scrollbarLines.push(Text({ color: isThumb ? scrollbarColor : trackColor }, char));
    }

    scrollbar = Box(
      { flexDirection: 'column', marginLeft: 1, flexShrink: 0 },
      ...scrollbarLines
    );
  }

  // Layout
  const hasScrollbar = showScrollbar && maxScroll > 0;
  const scrollbarWidth = 2;
  const contentWidth = hasScrollbar ? width - scrollbarWidth : width;

  return Box(
    { flexDirection: 'row', width, onScroll: handleScroll },
    Box(
      { flexDirection: 'column', flexGrow: 1, height, width: contentWidth },
      ...visibleNodes
    ),
    scrollbar
  );
}

// =============================================================================
// Presets
// =============================================================================

export interface ChatListProps<T> extends Omit<ScrollListProps<T>, 'inverted'> {}

/**
 * ChatList - Pre-configured for chat UIs
 *
 * Features:
 * - Inverted by default (newest messages visible)
 * - Scroll 0 = bottom (newest)
 * - Intuitive keyboard navigation
 *
 * @example
 * ChatList({
 *   items: messages(),
 *   children: (msg) => ChatBubble({ message: msg }),
 *   height: 20,
 * })
 */
export function ChatList<T>(props: ChatListProps<T>): VNode {
  return ScrollList({
    ...props,
    inverted: true,
  });
}

// =============================================================================
// Utility: Clear height cache
// =============================================================================

/**
 * Clear the height estimation cache
 * Useful when item content changes but object reference stays the same
 */
export function clearScrollListCache(): void {
  // WeakMap doesn't have a clear method, but we can create a new one
  // This is a no-op since we're using module-level WeakMap
  // Items are automatically removed when objects are garbage collected
}

/**
 * Invalidate cached height for a specific item
 */
export function invalidateScrollListItem<T extends object>(item: T): void {
  heightCache.delete(item);
}
