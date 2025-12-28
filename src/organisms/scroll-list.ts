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
import { useInput } from '../hooks/use-input.js';
import { getHotkeyScope, matchesHotkey, parseHotkey } from '../hooks/use-hotkeys.js';
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

  /**
   * Auto-scroll to bottom when content grows (default: false)
   * Useful for chat/log UIs where new items appear at the bottom
   */
  autoScroll?: boolean;

  /**
   * Auto-scroll threshold in lines (default: 0)
   * When > 0, only auto-scroll if user is within this many lines from bottom.
   * This enables "smart" auto-scroll that respects when user scrolls up to read.
   * When 0, always auto-scroll regardless of current position.
   */
  autoScrollThreshold?: number;

  /**
   * Hotkey scope for keyboard navigation (default: 'global')
   *
   * Use scopes to prevent conflicts when multiple scroll lists exist,
   * or when scroll list is inside a modal/overlay.
   *
   * @example
   * ```typescript
   * // Only responds when 'chat' scope is active
   * ScrollList({ ..., hotkeyScope: 'chat' })
   *
   * // In parent component
   * pushHotkeyScope('chat')  // Enable chat hotkeys
   * popHotkeyScope()         // Disable chat hotkeys
   * ```
   */
  hotkeyScope?: string;
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
  /** Check if user is near bottom (within threshold lines) */
  isNearBottom: (threshold?: number) => boolean;
}

interface ScrollListInternalOptions {
  inverted?: boolean;
  initialHeight?: number;
}

// =============================================================================
// Height Estimation Cache
// =============================================================================

// Cache entry stores height AND a content hash to detect mutations
interface CacheEntry {
  height: number;
  contentHash: string;
}

// Use object wrapper so we can replace the WeakMap (for clearing)
let heightCache = {
  map: new WeakMap<object, CacheEntry>(),
};

/**
 * Generate a simple hash from item content for cache invalidation
 * This detects when object content changes even if reference stays the same
 */
function getContentHash(item: unknown): string {
  if (item === null || item === undefined) return 'null';
  if (typeof item !== 'object') return String(item);

  // For objects, create a hash from stringified content
  // This is simple but effective for detecting mutations
  try {
    return JSON.stringify(item);
  } catch {
    // Circular reference or other issue - use object keys
    return Object.keys(item as object).join(',');
  }
}

function estimateItemHeight<T>(
  item: T,
  render: (item: T, index: number) => VNode,
  index: number,
  width: number
): number {
  // Only cache objects (not primitives)
  if (typeof item === 'object' && item !== null) {
    const cached = heightCache.map.get(item);
    const currentHash = getContentHash(item);

    // Return cached value only if content hash matches
    if (cached !== undefined && cached.contentHash === currentHash) {
      return cached.height;
    }
  }

  // Render to string and count lines
  const node = render(item, index);
  const rendered = renderToString(node, width);
  const height = Math.max(1, rendered.split('\n').length);

  // Cache if object (with content hash for invalidation)
  if (typeof item === 'object' && item !== null) {
    heightCache.map.set(item, {
      height,
      contentHash: getContentHash(item),
    });
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
  const [prevItemCount, setPrevItemCount] = createSignal(0);
  const [prevTotalHeight, setPrevTotalHeight] = createSignal(0);

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

  /**
   * Check if user is near bottom (within threshold lines)
   * In inverted mode, "near bottom" means scrollTop is near 0
   * In normal mode, "near bottom" means scrollTop is near maxScroll
   */
  const isNearBottom = (threshold: number = 0): boolean => {
    const max = maxScroll();
    const current = scrollTop();
    const inv = inverted();

    if (max === 0) return true; // No scrolling needed = at bottom

    if (inv) {
      // Inverted: bottom is at scrollTop = 0
      return current <= threshold;
    } else {
      // Normal: bottom is at scrollTop = maxScroll
      return current >= max - threshold;
    }
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
    isNearBottom,
    // Internal: allow updating maxScroll and item count from component
    _setMaxScroll: setMaxScroll,
    _prevItemCount: prevItemCount,
    _setPrevItemCount: setPrevItemCount,
    _prevTotalHeight: prevTotalHeight,
    _setPrevTotalHeight: setPrevTotalHeight,
  } as ScrollListState & {
    _setMaxScroll: (max: number) => void;
    _prevItemCount: () => number;
    _setPrevItemCount: (count: number) => void;
    _prevTotalHeight: () => number;
    _setPrevTotalHeight: (h: number) => void;
  };
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
  /** Check if user is near bottom (within threshold lines) */
  isNearBottom: (threshold?: number) => boolean;
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
    isNearBottom: (threshold?: number) => state.isNearBottom(threshold),
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
    autoScroll = false,
    autoScrollThreshold = 0,
    hotkeyScope = 'global',
  } = props;

  // Use external state or create internal
  const state = externalState || createScrollList({ inverted, initialHeight: height });

  // Cast to internal state type for accessing private methods
  const internalState = state as ScrollListState & {
    _setMaxScroll: (max: number) => void;
    _prevItemCount: () => number;
    _setPrevItemCount: (count: number) => void;
    _prevTotalHeight: () => number;
    _setPrevTotalHeight: (h: number) => void;
  };

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

  // Auto-scroll when content grows
  // IMPORTANT: Check isNearBottom BEFORE updating maxScroll, so we use the old maxScroll
  if (autoScroll && '_prevItemCount' in internalState && '_setPrevItemCount' in internalState) {
    const prevCount = internalState._prevItemCount();
    const currentCount = itemList.length;
    const prevHeight = '_prevTotalHeight' in internalState ? internalState._prevTotalHeight() : 0;

    // Content grows in two ways:
    // 1. New items added (currentCount > prevCount)
    // 2. Existing items grew (totalHeight > prevHeight with same count)
    const itemsAdded = currentCount > prevCount;
    const contentGrew = totalHeight > prevHeight;

    if (itemsAdded || contentGrew) {
      // Content has grown - check if we should auto-scroll
      // Use current state (old maxScroll) to determine if user was near bottom
      const shouldAutoScroll =
        autoScrollThreshold === 0 ||
        state.isNearBottom(autoScrollThreshold);

      // Now update maxScroll before scrolling
      if ('_setMaxScroll' in internalState) {
        internalState._setMaxScroll(maxScroll);
      }

      if (shouldAutoScroll) {
        state.scrollToBottom();
      }
    } else {
      // No growth, just update maxScroll
      if ('_setMaxScroll' in internalState) {
        internalState._setMaxScroll(maxScroll);
      }
    }

    // Update previous count and height
    internalState._setPrevItemCount(currentCount);
    if ('_setPrevTotalHeight' in internalState) {
      internalState._setPrevTotalHeight(totalHeight);
    }
  } else {
    // No auto-scroll, just update maxScroll
    if ('_setMaxScroll' in internalState) {
      internalState._setMaxScroll(maxScroll);
    }
  }

  // Clamp scrollTop if it exceeds maxScroll (can happen when content shrinks)
  const currentScrollTop = state.scrollTop();
  if (currentScrollTop > maxScroll) {
    state.scrollTo(maxScroll);
  }

  const scrollTop = state.scrollTop();

  // Keyboard handling via single useInput with scope checking
  // This is more efficient than 8 separate useHotkeys calls
  //
  // Hotkeys only fire when:
  // 1. keysEnabled is true
  // 2. isActive is true
  // 3. The current scope matches hotkeyScope (or scope is 'global')
  //
  // Pre-parse hotkey bindings for efficiency
  const bindings = {
    pageup: parseHotkey('pageup'),
    pagedown: parseHotkey('pagedown'),
    home: parseHotkey('home'),
    end: parseHotkey('end'),
    up: parseHotkey('up'),
    down: parseHotkey('down'),
    k: parseHotkey('k'),
    j: parseHotkey('j'),
  };

  useInput((input, key) => {
    // Check if keys are enabled and component is active
    if (!keysEnabled || !isActive) return;

    // Check scope - only respond if scope matches or is 'global'
    const currentScope = getHotkeyScope();
    if (hotkeyScope !== 'global' && hotkeyScope !== currentScope) return;

    // Check each hotkey binding
    if (matchesHotkey(input, key, bindings.pageup)) {
      state.pageUp();
      return;
    }
    if (matchesHotkey(input, key, bindings.pagedown)) {
      state.pageDown();
      return;
    }
    if (matchesHotkey(input, key, bindings.home)) {
      state.scrollToTop();
      return;
    }
    if (matchesHotkey(input, key, bindings.end)) {
      state.scrollToBottom();
      return;
    }

    // Arrow keys - direction depends on inverted mode
    if (matchesHotkey(input, key, bindings.up)) {
      state.scrollBy(inverted ? 1 : -1);
      return;
    }
    if (matchesHotkey(input, key, bindings.down)) {
      state.scrollBy(inverted ? -1 : 1);
      return;
    }

    // Vim keys - same direction logic
    if (matchesHotkey(input, key, bindings.k)) {
      state.scrollBy(inverted ? 1 : -1);
      return;
    }
    if (matchesHotkey(input, key, bindings.j)) {
      state.scrollBy(inverted ? -1 : 1);
      return;
    }
  }, { isActive })

  // Mouse scroll
  const handleScroll = (event: { button: string }) => {
    if (event.button === 'scroll-up') {
      state.scrollBy(inverted ? 3 : -3);
    } else if (event.button === 'scroll-down') {
      state.scrollBy(inverted ? -3 : 3);
    }
  };

  // Render visible items
  // Strategy: Only render COMPLETE items that fit in the viewport.
  // We skip items that start before scrollTop to prevent partial items
  // from overflowing (terminal layouts don't clip overflow like CSS).
  const visibleNodes: VNode[] = [];

  if (!inverted) {
    // Standard (top-down)
    // Find the first item that starts AT or AFTER scrollTop
    let currentY = 0;
    let firstVisibleIndex = 0;

    // Skip items that END at or before scrollTop (completely above)
    for (let i = 0; i < itemList.length; i++) {
      const itemH = itemHeights[i]!;
      if (currentY + itemH <= scrollTop) {
        currentY += itemH;
        firstVisibleIndex = i + 1;
      } else {
        break;
      }
    }

    // If first "visible" item starts BEFORE scrollTop, it's partial - skip it
    // This prevents rendering items that would overflow above the viewport
    if (currentY < scrollTop && firstVisibleIndex < itemList.length) {
      currentY += itemHeights[firstVisibleIndex]!;
      firstVisibleIndex++;
    }

    // Now render items starting from firstVisibleIndex
    let renderedHeight = 0;
    for (let i = firstVisibleIndex; i < itemList.length; i++) {
      const item = itemList[i]!;
      const itemH = itemHeights[i]!;

      // Only add item if it FITS in remaining space
      if (renderedHeight + itemH <= height) {
        visibleNodes.push(children(item, i));
        renderedHeight += itemH;
      } else {
        break;
      }
    }
  } else {
    // Inverted (chat-style, bottom-up)
    // In inverted mode, scrollTop=0 means "show newest items" (at the end of the array)
    // We iterate from the end (newest) towards the beginning (oldest)
    const reversedItems = [...itemList].reverse();
    const reversedHeights = [...itemHeights].reverse();

    // Find first visible item (skip items below viewport)
    let linesSkipped = 0;
    let firstVisibleIndex = 0;

    for (let i = 0; i < reversedItems.length; i++) {
      const itemH = reversedHeights[i]!;
      if (linesSkipped + itemH <= scrollTop) {
        linesSkipped += itemH;
        firstVisibleIndex = i + 1;
      } else {
        break;
      }
    }

    // If first "visible" item starts before scrollTop, skip it (partial)
    if (linesSkipped < scrollTop && firstVisibleIndex < reversedItems.length) {
      linesSkipped += reversedHeights[firstVisibleIndex]!;
      firstVisibleIndex++;
    }

    // Render items starting from firstVisibleIndex
    let renderedHeight = 0;
    for (let i = firstVisibleIndex; i < reversedItems.length; i++) {
      const item = reversedItems[i]!;
      const itemH = reversedHeights[i]!;
      const originalIndex = itemList.length - 1 - i;

      if (renderedHeight + itemH <= height) {
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
 * - Auto-scroll enabled (scrolls to new messages)
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
    autoScroll: true, // Can be overridden by props
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
  // Replace the WeakMap with a fresh one to clear all cached heights
  heightCache.map = new WeakMap<object, CacheEntry>();
}

/**
 * Invalidate cached height for a specific item
 */
export function invalidateScrollListItem<T extends object>(item: T): void {
  heightCache.map.delete(item);
}
