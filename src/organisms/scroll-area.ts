/**
 * ScrollArea - Scrollable content with scrollbar
 *
 * Features:
 * - Vertical scrolling
 * - Scrollbar indicator
 * - Keyboard scrolling (arrows, page up/down)
 * - Scroll position tracking
 * - Auto-scroll to bottom (optional)
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal, createMemo } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { getChars, getRenderMode } from '../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export interface ScrollAreaOptions {
  /** Visible height (lines) */
  height: number;
  /** Content to scroll */
  content: string[] | VNode[];
  /** Initial scroll position */
  initialScrollTop?: number;
  /** Auto-scroll to bottom on content change */
  autoScroll?: boolean;
  /** Show scrollbar */
  showScrollbar?: boolean;
  /** Scrollbar color */
  scrollbarColor?: ColorValue;
  /** Track color */
  trackColor?: ColorValue;
  /** Enable wrapping at width */
  wrapWidth?: number;
  /** Scroll step size */
  scrollStep?: number;
  /** Page scroll size (default: height - 1) */
  pageSize?: number;
  /** Callbacks */
  onScroll?: (scrollTop: number) => void;
  /** Is active */
  isActive?: boolean;
}

export interface ScrollAreaState {
  scrollTop: () => number;
  maxScroll: () => number;
  visibleItems: () => (string | VNode)[];
  scrollTo: (position: number) => void;
  scrollBy: (delta: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  pageUp: () => void;
  pageDown: () => void;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a ScrollArea state manager
 */
export function createScrollArea(options: ScrollAreaOptions): ScrollAreaState {
  const {
    height,
    content,
    initialScrollTop = 0,
    scrollStep = 1,
    pageSize,
    onScroll,
  } = options;

  const [scrollTop, setScrollTop] = createSignal(initialScrollTop);

  const maxScroll = createMemo(() => Math.max(0, content.length - height));

  const clampScroll = (pos: number) => Math.max(0, Math.min(pos, maxScroll()));

  const scrollTo = (position: number) => {
    const clamped = clampScroll(position);
    if (clamped !== scrollTop()) {
      setScrollTop(clamped);
      onScroll?.(clamped);
    }
  };

  const scrollBy = (delta: number) => {
    scrollTo(scrollTop() + delta);
  };

  const scrollToTop = () => scrollTo(0);
  const scrollToBottom = () => scrollTo(maxScroll());

  const effectivePageSize = pageSize ?? Math.max(1, height - 1);
  const pageUp = () => scrollBy(-effectivePageSize);
  const pageDown = () => scrollBy(effectivePageSize);

  const visibleItems = createMemo(() => {
    const top = scrollTop();
    return content.slice(top, top + height);
  });

  return {
    scrollTop,
    maxScroll,
    visibleItems,
    scrollTo,
    scrollBy,
    scrollToTop,
    scrollToBottom,
    pageUp,
    pageDown,
  };
}

// =============================================================================
// Component
// =============================================================================

export interface ScrollAreaProps extends ScrollAreaOptions {
  /** Pre-created state */
  state?: ScrollAreaState;
  /** Width of content area */
  width?: number;
}

/**
 * ScrollArea - Scrollable content with scrollbar
 *
 * @example
 * // Basic scroll area
 * ScrollArea({
 *   height: 10,
 *   content: longText.split('\n'),
 * })
 *
 * @example
 * // With auto-scroll and custom scrollbar
 * ScrollArea({
 *   height: 20,
 *   content: logLines,
 *   autoScroll: true,
 *   scrollbarColor: 'cyan',
 * })
 */
export function ScrollArea(props: ScrollAreaProps): VNode {
  const {
    height,
    content,
    showScrollbar = true,
    scrollbarColor = 'primary',
    trackColor = 'mutedForeground',
    scrollStep = 1,
    isActive = true,
    width,
    state: externalState,
  } = props;

  const state = externalState || createScrollArea(props);
  const chars = getChars();
  const isAscii = getRenderMode() === 'ascii';

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.upArrow || input === 'k') state.scrollBy(-scrollStep);
      else if (key.downArrow || input === 'j') state.scrollBy(scrollStep);
      else if (key.pageUp || input === 'u') state.pageUp();
      else if (key.pageDown || input === 'd') state.pageDown();
      else if (input === 'g') state.scrollToTop();
      else if (input === 'G') state.scrollToBottom();
      else if (key.home) state.scrollToTop();
      else if (key.end) state.scrollToBottom();
    },
    { isActive }
  );

  const scrollTop = state.scrollTop();
  const maxScroll = state.maxScroll();
  const visibleItems = state.visibleItems();

  // Render content
  const contentNodes: VNode[] = visibleItems.map((item, i) => {
    if (typeof item === 'string') {
      return Text({}, item);
    }
    return item;
  });

  // Pad with empty lines if content is shorter than height
  while (contentNodes.length < height) {
    contentNodes.push(Text({}, ''));
  }

  // Render scrollbar
  let scrollbar: VNode | null = null;
  if (showScrollbar && maxScroll > 0) {
    const thumbHeight = Math.max(1, Math.floor((height / content.length) * height));
    const thumbPosition = Math.floor((scrollTop / maxScroll) * (height - thumbHeight));

    const scrollbarLines: VNode[] = [];
    for (let i = 0; i < height; i++) {
      const isThumb = i >= thumbPosition && i < thumbPosition + thumbHeight;
      const char = isThumb
        ? (isAscii ? '#' : chars.scrollbar.thumb)
        : (isAscii ? '|' : chars.scrollbar.track);
      scrollbarLines.push(
        Text({ color: isThumb ? scrollbarColor : trackColor }, char)
      );
    }

    scrollbar = Box(
      { flexDirection: 'column', marginLeft: 1 },
      ...scrollbarLines
    );
  }

  // Handle mouse scroll events
  const handleScroll = (event: { button: string }) => {
    if (event.button === 'scroll-up') {
      state.scrollBy(-scrollStep);
    } else if (event.button === 'scroll-down') {
      state.scrollBy(scrollStep);
    }
  };

  // Compose layout with scroll event handler
  return Box(
    { flexDirection: 'row', width, onScroll: handleScroll },
    Box(
      { flexDirection: 'column', flexGrow: 1 },
      ...contentNodes
    ),
    scrollbar
  );
}

// =============================================================================
// VirtualList - Virtualized list for large datasets
// =============================================================================

export interface VirtualListItem<T = unknown> {
  key: string;
  data: T;
}

export interface VirtualListOptions<T = unknown> {
  /** List items */
  items: VirtualListItem<T>[];
  /** Visible height (items) */
  height: number;
  /** Render function for each item */
  renderItem: (item: VirtualListItem<T>, index: number, isSelected: boolean) => VNode;
  /** Initial selected index */
  initialSelected?: number;
  /** Selection color */
  selectionColor?: ColorValue;
  /** Show scrollbar */
  showScrollbar?: boolean;
  /** Callbacks */
  onSelect?: (item: VirtualListItem<T>, index: number) => void;
  onActivate?: (item: VirtualListItem<T>, index: number) => void;
  /** Is active */
  isActive?: boolean;
}

export interface VirtualListState<T = unknown> {
  selectedIndex: () => number;
  scrollTop: () => number;
  visibleItems: () => { item: VirtualListItem<T>; index: number }[];
  selectIndex: (index: number) => void;
  selectPrev: () => void;
  selectNext: () => void;
  selectFirst: () => void;
  selectLast: () => void;
  pageUp: () => void;
  pageDown: () => void;
  activate: () => void;
}

/**
 * Create a VirtualList state manager
 */
export function createVirtualList<T = unknown>(
  options: VirtualListOptions<T>
): VirtualListState<T> {
  const { items, height, initialSelected = 0, onSelect, onActivate } = options;

  const [selectedIndex, setSelectedIndex] = createSignal(initialSelected);
  const [scrollTop, setScrollTop] = createSignal(0);

  const ensureVisible = (index: number) => {
    const top = scrollTop();
    if (index < top) {
      setScrollTop(index);
    } else if (index >= top + height) {
      setScrollTop(index - height + 1);
    }
  };

  const selectIndex = (index: number) => {
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    setSelectedIndex(clamped);
    ensureVisible(clamped);
    onSelect?.(items[clamped]!, clamped);
  };

  const selectPrev = () => selectIndex(selectedIndex() - 1);
  const selectNext = () => selectIndex(selectedIndex() + 1);
  const selectFirst = () => selectIndex(0);
  const selectLast = () => selectIndex(items.length - 1);

  const pageUp = () => selectIndex(selectedIndex() - height + 1);
  const pageDown = () => selectIndex(selectedIndex() + height - 1);

  const activate = () => {
    const index = selectedIndex();
    const item = items[index];
    if (item) {
      onActivate?.(item, index);
    }
  };

  const visibleItems = createMemo(() => {
    const top = scrollTop();
    return items
      .slice(top, top + height)
      .map((item, i) => ({ item, index: top + i }));
  });

  return {
    selectedIndex,
    scrollTop,
    visibleItems,
    selectIndex,
    selectPrev,
    selectNext,
    selectFirst,
    selectLast,
    pageUp,
    pageDown,
    activate,
  };
}

export interface VirtualListProps<T = unknown> extends VirtualListOptions<T> {
  /** Pre-created state */
  state?: VirtualListState<T>;
  /** Width */
  width?: number;
}

/**
 * VirtualList - Virtualized list for large datasets
 *
 * @example
 * VirtualList({
 *   items: files.map((f, i) => ({ key: f.name, data: f })),
 *   height: 20,
 *   renderItem: (item, index, selected) =>
 *     Text({ color: selected ? 'cyan' : 'white' }, item.data.name),
 *   onActivate: (item) => openFile(item.data),
 * })
 */
export function VirtualList<T = unknown>(props: VirtualListProps<T>): VNode {
  const {
    height,
    renderItem,
    showScrollbar = true,
    isActive = true,
    width,
    state: externalState,
  } = props;

  const state = externalState || createVirtualList(props);
  const chars = getChars();
  const isAscii = getRenderMode() === 'ascii';

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.upArrow || input === 'k') state.selectPrev();
      else if (key.downArrow || input === 'j') state.selectNext();
      else if (key.pageUp || input === 'u') state.pageUp();
      else if (key.pageDown || input === 'd') state.pageDown();
      else if (input === 'g') state.selectFirst();
      else if (input === 'G') state.selectLast();
      else if (key.return || input === ' ') state.activate();
    },
    { isActive }
  );

  const selectedIdx = state.selectedIndex();
  const visible = state.visibleItems();
  const totalItems = props.items.length;
  const scrollTop = state.scrollTop();

  // Handle mouse scroll events
  const handleScroll = (event: { button: string }) => {
    if (event.button === 'scroll-up') {
      state.selectPrev();
    } else if (event.button === 'scroll-down') {
      state.selectNext();
    }
  };

  // Render visible items with click handlers
  const itemNodes = visible.map(({ item, index }) => {
    const isSelected = index === selectedIdx;
    const renderedItem = renderItem(item, index, isSelected);

    return Box(
      { onClick: () => state.selectIndex(index) },
      renderedItem
    );
  });

  // Pad with empty lines if needed
  while (itemNodes.length < height) {
    itemNodes.push(Text({}, ''));
  }

  // Scrollbar
  let scrollbar: VNode | null = null;
  if (showScrollbar && totalItems > height) {
    const maxScroll = totalItems - height;
    const thumbHeight = Math.max(1, Math.floor((height / totalItems) * height));
    const thumbPosition = Math.floor((scrollTop / maxScroll) * (height - thumbHeight));

    const scrollbarLines: VNode[] = [];
    for (let i = 0; i < height; i++) {
      const isThumb = i >= thumbPosition && i < thumbPosition + thumbHeight;
      const char = isThumb
        ? (isAscii ? '#' : chars.scrollbar.thumb)
        : (isAscii ? '|' : chars.scrollbar.track);
      scrollbarLines.push(Text({ color: isThumb ? 'primary' : 'mutedForeground' }, char));
    }

    scrollbar = Box(
      { flexDirection: 'column', marginLeft: 1 },
      ...scrollbarLines
    );
  }

  return Box(
    { flexDirection: 'row', width, onScroll: handleScroll },
    Box(
      { flexDirection: 'column', flexGrow: 1 },
      ...itemNodes
    ),
    scrollbar
  );
}

// =============================================================================
// ScrollableText - Simple scrollable text component
// =============================================================================

export interface ScrollableTextProps {
  /** Text content */
  text: string;
  /** Visible height */
  height: number;
  /** Width (for wrapping) */
  width?: number;
  /** Text color */
  color?: ColorValue;
  /** Show scrollbar */
  showScrollbar?: boolean;
  /** Is active */
  isActive?: boolean;
}

/**
 * ScrollableText - Simple scrollable text
 */
export function ScrollableText(props: ScrollableTextProps): VNode {
  const {
    text,
    height,
    width,
    color = 'foreground',
    showScrollbar = true,
    isActive = true,
  } = props;

  const lines = text.split('\n');

  return ScrollArea({
    height,
    content: lines.map((line) => Text({ color }, line)),
    showScrollbar,
    isActive,
    width,
  });
}

// =============================================================================
// LogViewer - Auto-scrolling log viewer
// =============================================================================

export interface LogViewerOptions {
  /** Log lines */
  lines: string[];
  /** Visible height */
  height: number;
  /** Auto-scroll to bottom */
  autoScroll?: boolean;
  /** Show line numbers */
  showLineNumbers?: boolean;
  /** Highlight pattern (regex) */
  highlightPattern?: RegExp;
  /** Highlight color */
  highlightColor?: ColorValue;
  /** Is active */
  isActive?: boolean;
}

/**
 * LogViewer - Auto-scrolling log viewer
 *
 * @example
 * LogViewer({
 *   lines: logBuffer,
 *   height: 20,
 *   autoScroll: true,
 *   highlightPattern: /error|warning/i,
 *   highlightColor: 'red',
 * })
 */
export function LogViewer(props: LogViewerOptions): VNode {
  const {
    lines,
    height,
    autoScroll = true,
    showLineNumbers = false,
    highlightPattern,
    highlightColor = 'yellow',
    isActive = true,
  } = props;

  const state = createScrollArea({
    height,
    content: lines,
    autoScroll,
    isActive,
  });

  // Auto-scroll to bottom when content changes
  if (autoScroll) {
    state.scrollToBottom();
  }

  const scrollTop = state.scrollTop();
  const visibleItems = state.visibleItems();

  const lineNumberWidth = showLineNumbers
    ? String(lines.length).length + 2
    : 0;

  const contentNodes = visibleItems.map((item, i) => {
    const lineNum = scrollTop + i + 1;
    const line = item as string;

    // Check for highlight
    const shouldHighlight = highlightPattern?.test(line);

    const lineContent = Box(
      { flexDirection: 'row' },
      showLineNumbers
        ? Text(
          { color: 'mutedForeground', dim: true },
          String(lineNum).padStart(lineNumberWidth - 1) + ' '
        )
        : null,
      Text(
        { color: shouldHighlight ? highlightColor : 'foreground' },
        line
      )
    );

    return lineContent;
  });

  // Pad with empty lines
  while (contentNodes.length < height) {
    contentNodes.push(Text({}, ''));
  }

  // Scrollbar
  const maxScroll = Math.max(0, lines.length - height);
  let scrollbar: VNode | null = null;
  if (maxScroll > 0) {
    const chars = getChars();
    const isAscii = getRenderMode() === 'ascii';
    const thumbHeight = Math.max(1, Math.floor((height / lines.length) * height));
    const thumbPosition = Math.floor((scrollTop / maxScroll) * (height - thumbHeight));

    const scrollbarLines: VNode[] = [];
    for (let i = 0; i < height; i++) {
      const isThumb = i >= thumbPosition && i < thumbPosition + thumbHeight;
      const char = isThumb
        ? (isAscii ? '#' : chars.scrollbar.thumb)
        : (isAscii ? '|' : chars.scrollbar.track);
      scrollbarLines.push(Text({ color: isThumb ? 'primary' : 'mutedForeground' }, char));
    }

    scrollbar = Box(
      { flexDirection: 'column', marginLeft: 1 },
      ...scrollbarLines
    );
  }

  return Box(
    { flexDirection: 'row' },
    Box(
      { flexDirection: 'column', flexGrow: 1 },
      ...contentNodes
    ),
    scrollbar
  );
}
