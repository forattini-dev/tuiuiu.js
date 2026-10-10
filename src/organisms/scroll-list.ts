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
import { createSignal } from '../primitives/signal.js';
import { useInput } from '../hooks/use-input.js';
import { useFactoryState } from '../hooks/factory-state.js';
import { useConst } from '../hooks/use-const.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { warnIfRenderFunctionPatternMisused } from '../core/dev-warnings.js';
import { measureHeight } from '../core/renderer.js';
import { component, type ComponentKeyProps } from '../app/component.js';

// =============================================================================
// Types
// =============================================================================

export interface ScrollListProps<T> extends ComponentKeyProps {
  /** Items to display */
  items: T[] | (() => T[]);

  /** Render function for each item */
  children: (item: T, index: number) => VNode;

  /** Stable unique identity used to preserve the visible item during updates. */
  getKey?: (item: T, index: number) => string | number;

  /** Preserve item/line offset when geometry changes (default: true with getKey). */
  preserveAnchor?: boolean;

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
  updateOptions: (options: ScrollListInternalOptions) => void;
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
  width: number;
  index: number;
  render: unknown;
  revision: object | undefined;
}

// Use object wrapper so we can replace the WeakMap (for clearing)
const heightCache = {
  owners: new WeakMap<object, WeakMap<object, CacheEntry[]>>(),
  revisions: new WeakMap<object, object>(),
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
  width: number,
  owner: object,
  getNode: () => VNode,
): number {
  let cache = heightCache.owners.get(owner);
  if (!cache) {
    cache = new WeakMap<object, CacheEntry[]>();
    heightCache.owners.set(owner, cache);
  }
  const cacheable = typeof item === 'object' && item !== null;
  const currentHash = cacheable ? getContentHash(item) : '';
  const revision = cacheable ? heightCache.revisions.get(item) : undefined;
  // Only cache objects (not primitives)
  if (cacheable) {
    const cached = cache.get(item)?.find((entry) => entry.width === width);

    // Return cached value only if content hash matches
    if (cached !== undefined && cached.contentHash === currentHash
      && cached.width === width && cached.index === index
      && cached.render === render && cached.revision === revision) {
      return cached.height;
    }
  }

  // Measure height including margins
  const node = getNode();
  const height = Math.max(1, measureHeight(node, width));

  // Cache if object (with content hash for invalidation)
  if (cacheable) {
    const entry: CacheEntry = {
      height,
      contentHash: currentHash,
      width,
      index,
      render,
      revision,
    };
    // Retain at most the full-width and scrollbar-width measurements.
    const previous = cache.get(item)?.filter((candidate) => candidate.width !== width) ?? [];
    cache.set(item, [...previous.slice(-1), entry]);
  }

  return height;
}

// =============================================================================
// State Factory
// =============================================================================

export function createScrollList(options: ScrollListInternalOptions = {}): ScrollListState {
  const [scrollTop, setScrollTop] = createSignal(0);
  const [height, setHeight] = createSignal(options.initialHeight ?? 10);
  const [inverted, setInverted] = createSignal(options.inverted ?? false);
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
    updateOptions: (nextOptions: ScrollListInternalOptions) => {
      setHeight(nextOptions.initialHeight ?? 10);
      setInverted(nextOptions.inverted ?? false);
    },
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
  const nextOptions = {
    inverted: options.inverted,
  };
  const state = useFactoryState(undefined, nextOptions, createScrollList);

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
function renderScrollList<T>(props: ScrollListProps<T>): VNode {
  warnIfRenderFunctionPatternMisused(
    'ScrollList',
    'children',
    props.children,
    '`ScrollList({ items, height: 10, children: (item, index) => Row(item) })`',
  );

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
    scrollbarColor = 'primary',
    trackColor = 'muted',
    state: externalState,
    autoScroll = false,
    autoScrollThreshold = 0,
    getKey,
    preserveAnchor = true,
  } = props;

  // Use external state or create internal
  const state = useFactoryState(
    externalState,
    { inverted, initialHeight: height },
    createScrollList
  );
  const cacheOwner = useConst(() => ({}));
  const geometry = useConst(() => ({ previous: null as null | {
    state: ScrollListState;
    keys: (string | number)[];
    offsets: number[];
    height: number;
    inverted: boolean;
  } }));

  // Cast to internal state type for accessing private methods
  const internalState = state as ScrollListState & {
    _setMaxScroll: (max: number) => void;
    _prevItemCount: () => number;
    _setPrevItemCount: (count: number) => void;
    _prevTotalHeight: () => number;
    _setPrevTotalHeight: (h: number) => void;
  };

  // Get items array
  const getItems = (): T[] => {
    return typeof items === 'function' ? (items as () => T[])() : items;
  };

  // Height resolver
  let contentWidth = width;
  // Measurement at full/scrollbar width and painting must share one evaluation.
  // Re-evaluating owned components in the same pass triggers duplicate keys.
  const renderedItems = new Map<number, VNode>();
  const renderItem = (item: T, index: number): VNode => {
    let node = renderedItems.get(index);
    if (!node) { node = children(item, index); renderedItems.set(index, node); }
    return node;
  };
  const getItemHeight = (item: T, index: number): number => {
    if (typeof itemHeight === 'number') {
      return itemHeight;
    }
    if (typeof itemHeight === 'function') {
      return itemHeight(item);
    }
    // Auto-estimate
    return estimateItemHeight(item, children, index, contentWidth, cacheOwner, () => renderItem(item, index));
  };

  // Calculate total height and max scroll
  const itemList = getItems();
  const keys = getKey ? itemList.map(getKey) : null;
  if (keys && (keys.some(key => typeof key !== 'string'
    && (typeof key !== 'number' || !Number.isFinite(key))) || new Set(keys).size !== keys.length)) {
    throw new TypeError('ScrollList getKey must return unique strings or finite numbers');
  }
  let totalHeight = 0;
  const itemHeights: number[] = [];

  for (let i = 0; i < itemList.length; i++) {
    const h = getItemHeight(itemList[i]!, i);
    itemHeights.push(h);
    totalHeight += h;
  }

  // A visible scrollbar occupies two columns. Measure and rasterize at the
  // same content width, otherwise wrapped items silently lose their tail.
  if (showScrollbar && totalHeight > height) {
    contentWidth = Math.max(1, width - 2);
    totalHeight = 0;
    for (let i = 0; i < itemList.length; i++) {
      const h = getItemHeight(itemList[i]!, i);
      itemHeights[i] = h;
      totalHeight += h;
    }
  }

  const offsets = [0];
  for (const itemH of itemHeights) offsets.push(offsets[offsets.length - 1]! + itemH);
  const maxScroll = Math.max(0, totalHeight - height);
  const previous = geometry.previous;
  let anchoredScroll: number | null = null;
  if (keys && preserveAnchor && previous?.state === state && previous.inverted === inverted && previous.keys.length) {
    const previousTotal = previous.offsets[previous.offsets.length - 1]!;
    const top = Math.max(0, inverted
      ? previousTotal - previous.height - state.scrollTop() : state.scrollTop());
    let index = 0;
    while (index + 1 < previous.keys.length && previous.offsets[index + 1]! <= top) index++;
    const positions = new Map(keys.map((key, position) => [key, position]));
    let target = positions.get(previous.keys[index]!);
    let lineOffset = top - previous.offsets[index]!;
    if (target === undefined) {
      lineOffset = 0;
      for (let next = index + 1; next < previous.keys.length && target === undefined; next++) {
        target = positions.get(previous.keys[next]!);
      }
      for (let prior = index - 1; prior >= 0 && target === undefined; prior--) {
        target = positions.get(previous.keys[prior]!);
      }
    }
    if (target !== undefined) {
      const anchoredTop = offsets[target]! + Math.min(lineOffset, Math.max(0, itemHeights[target]! - 1));
      anchoredScroll = inverted ? totalHeight - height - anchoredTop : anchoredTop;
    }
  }
  let followedBottom = false;

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
        followedBottom = true;
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

  if (!followedBottom && anchoredScroll !== null) state.scrollTo(anchoredScroll);
  geometry.previous = keys && preserveAnchor ? { state, keys, offsets, height, inverted } : null;

  // Clamp scrollTop if it exceeds maxScroll (can happen when content shrinks)
  const currentScrollTop = state.scrollTop();
  if (currentScrollTop > maxScroll) {
    state.scrollTo(maxScroll);
  }

  const scrollTop = state.scrollTop();

  useInput((input, key) => {
    if (!keysEnabled || !isActive) return;
    if (key.pageUp) {
      state.pageUp();
      return;
    }
    if (key.pageDown) {
      state.pageDown();
      return;
    }
    if (key.home) {
      state.scrollToTop();
      return;
    }
    if (key.end) {
      state.scrollToBottom();
      return;
    }

    // Arrow keys - direction depends on inverted mode
    if (key.upArrow) {
      state.scrollBy(inverted ? 1 : -1);
      return;
    }
    if (key.downArrow) {
      state.scrollBy(inverted ? -1 : 1);
      return;
    }

    // Vim keys - same direction logic
    if (input === 'k' && !key.ctrl && !key.meta && !key.option) {
      state.scrollBy(inverted ? 1 : -1);
      return;
    }
    if (input === 'j' && !key.ctrl && !key.meta && !key.option) {
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

  // Keep the visible subtree semantic: the frame clips and translates it just
  // like Scroll. Serializing here destroys handlers, IDs and image metadata.
  // Both modes share top-down geometry; inverted scrollTop is distance from bottom.
  const viewportTop = Math.max(0, inverted ? totalHeight - height - scrollTop : scrollTop);
  let low = 0;
  let high = itemList.length;
  while (low < high) {
    const middle = (low + high) >>> 1;
    if (offsets[middle + 1]! <= viewportTop) low = middle + 1;
    else high = middle;
  }
  const firstIndex = low;
  const intersectingNodes: VNode[] = [];
  for (let index = firstIndex; index < itemList.length && offsets[index]! < viewportTop + height; index++) {
    intersectingNodes.push(Box({ height: itemHeights[index]!, flexShrink: 0, overflow: 'hidden' },
      renderItem(itemList[index]!, index)));
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

  return Box(
    { flexDirection: 'row', width, onScroll: handleScroll },
    Box(
      {
        flexDirection: 'column', flexGrow: 1, height, width: contentWidth,
        overflow: 'hidden', __scrollOffsetY: viewportTop - (offsets[firstIndex] ?? viewportTop),
      },
      Box({ flexDirection: 'column', flexShrink: 0 }, ...intersectingNodes)
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
function renderChatList<T>(props: ChatListProps<T>): VNode {
  return ScrollList({
    autoScroll: true, // Can be overridden by props
    ...props,
    inverted: true,
  });
}

export const ScrollList = component('ScrollList', renderScrollList);
export const ChatList = component('ChatList', renderChatList);

// =============================================================================
// Utility: Clear height cache
// =============================================================================

/**
 * Clear the height estimation cache
 * Useful when item content changes but object reference stays the same
 */
export function clearScrollListCache(): void {
  // Replace the WeakMap with a fresh one to clear all cached heights
  heightCache.owners = new WeakMap<object, WeakMap<object, CacheEntry[]>>();
  heightCache.revisions = new WeakMap<object, object>();
}

/**
 * Invalidate cached height for a specific item
 */
export function invalidateScrollListItem<T extends object>(item: T): void {
  heightCache.revisions.set(item, {});
}
