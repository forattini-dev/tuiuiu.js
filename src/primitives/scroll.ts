/**
 * Scroll - Universal scroll wrapper for any content
 *
 * @layer Primitive
 * @description Wraps any content and adds scrolling when it exceeds height
 *
 * Features:
 * - Wraps any VNode content
 * - Automatic scrollbar when content exceeds height
 * - Keyboard navigation (arrows, page up/down, vim keys)
 * - Mouse scroll support
 * - Works with any content - text, boxes, complex layouts
 *
 * @example
 * // Simple content scroll
 * Scroll({ height: 10 },
 *   Text({}, longText),
 * )
 *
 * @example
 * // Complex content scroll
 * Scroll({ height: 20, width: 60 },
 *   Box({ flexDirection: 'column' },
 *     Header(),
 *     Content(),
 *     Footer(),
 *   ),
 * )
 */

import { Box, Text } from './nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal } from './signal.js';
import { useInput } from '../hooks/index.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { renderToString } from '../core/renderer.js';

// =============================================================================
// Types
// =============================================================================

export interface ScrollProps {
  /** Visible height in lines */
  height: number;

  /** Width for content layout */
  width?: number;

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

  /** Scroll step size (default: 1) */
  scrollStep?: number;

  /** External state for control */
  state?: ScrollState;
}

export interface ScrollState {
  scrollTop: () => number;
  maxScroll: () => number;
  scrollBy: (delta: number) => void;
  scrollTo: (pos: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  pageUp: () => void;
  pageDown: () => void;
}

interface ScrollInternalOptions {
  height?: number;
}

// =============================================================================
// State Factory
// =============================================================================

export function createScroll(options: ScrollInternalOptions = {}): ScrollState & { _setMaxScroll: (max: number) => void; _setHeight: (h: number) => void } {
  const { height: initialHeight = 10 } = options;

  const [scrollTop, setScrollTop] = createSignal(0);
  const [maxScroll, setMaxScroll] = createSignal(0);
  const [height, setHeight] = createSignal(initialHeight);

  const scrollBy = (delta: number) => {
    const max = maxScroll();
    setScrollTop(current => Math.max(0, Math.min(max, current + delta)));
  };

  const scrollTo = (pos: number) => {
    const max = maxScroll();
    setScrollTop(Math.max(0, Math.min(max, pos)));
  };

  const pageUp = () => scrollBy(-Math.max(1, height() - 1));
  const pageDown = () => scrollBy(Math.max(1, height() - 1));
  const scrollToTop = () => scrollTo(0);
  const scrollToBottom = () => scrollTo(maxScroll());

  return {
    scrollTop,
    maxScroll,
    scrollBy,
    scrollTo,
    scrollToTop,
    scrollToBottom,
    pageUp,
    pageDown,
    _setMaxScroll: setMaxScroll,
    _setHeight: setHeight,
  };
}

// =============================================================================
// Hook
// =============================================================================

export interface UseScrollOptions {
  height?: number;
}

export interface UseScrollReturn {
  scrollToTop: () => void;
  scrollToBottom: () => void;
  scrollTo: (pos: number) => void;
  scrollBy: (delta: number) => void;
  scrollTop: () => number;
  maxScroll: () => number;
  bind: { state: ScrollState };
}

/**
 * Hook for scroll control
 *
 * @example
 * const scroll = useScroll();
 *
 * // Control
 * scroll.scrollToBottom();
 *
 * // In render
 * Scroll({ ...scroll.bind, height: 20 },
 *   ...content
 * )
 */
export function useScroll(options: UseScrollOptions = {}): UseScrollReturn {
  const state = createScroll(options);

  return {
    scrollToTop: () => state.scrollToTop(),
    scrollToBottom: () => state.scrollToBottom(),
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
 * Scroll - Universal scroll wrapper
 *
 * Wraps any content and adds scrolling when it exceeds the specified height.
 *
 * @example
 * // Wrap text content
 * Scroll({ height: 10 },
 *   Text({}, veryLongText),
 * )
 *
 * @example
 * // Wrap complex layouts
 * Scroll({ height: 20, width: 60 },
 *   Box({ flexDirection: 'column' },
 *     ...manyComponents
 *   ),
 * )
 *
 * @example
 * // With control hook
 * const scroll = useScroll();
 * scroll.scrollToBottom();
 *
 * Scroll({ ...scroll.bind, height: 20 },
 *   ...content
 * )
 */
export function Scroll(props: ScrollProps, ...children: VNode[]): VNode {
  const {
    height,
    width = 80,
    showScrollbar = true,
    keysEnabled = true,
    isActive = true,
    scrollbarColor = 'cyan',
    trackColor = 'gray',
    scrollStep = 1,
    state: externalState,
  } = props;

  // Use external state or create internal
  const state = externalState || createScroll({ height });

  // Update height in state
  if ('_setHeight' in state) {
    (state as any)._setHeight(height);
  }

  // Render children to string to calculate total height
  const contentNode = children.length === 1 ? children[0]! : Box({ flexDirection: 'column' }, ...children);
  const rendered = renderToString(contentNode, width);
  const lines = rendered.split('\n');
  const totalHeight = lines.length;

  // Calculate max scroll
  const maxScroll = Math.max(0, totalHeight - height);

  // Update max scroll in state
  if ('_setMaxScroll' in state) {
    (state as any)._setMaxScroll(maxScroll);
  }

  const scrollTop = state.scrollTop();

  // Keyboard handling
  useInput((input, key) => {
    if (!keysEnabled) return;

    if (key.upArrow || input === 'k') state.scrollBy(-scrollStep);
    else if (key.downArrow || input === 'j') state.scrollBy(scrollStep);
    else if (key.pageUp || input === 'u') state.pageUp();
    else if (key.pageDown || input === 'd') state.pageDown();
    else if (key.home || input === 'g') state.scrollToTop();
    else if (key.end || input === 'G') state.scrollToBottom();
  }, { isActive });

  // Mouse scroll
  const handleScroll = (event: { button: string }) => {
    if (event.button === 'scroll-up') {
      state.scrollBy(-3);
    } else if (event.button === 'scroll-down') {
      state.scrollBy(3);
    }
  };

  // Get visible lines
  const visibleLines = lines.slice(scrollTop, scrollTop + height);

  // Pad with empty lines if needed
  while (visibleLines.length < height) {
    visibleLines.push('');
  }

  // Create content nodes from visible lines
  const contentNodes = visibleLines.map(line => Text({}, line));

  // Scrollbar
  let scrollbar: VNode | null = null;

  if (showScrollbar && maxScroll > 0) {
    const chars = getChars();
    const isAscii = getRenderMode() === 'ascii';

    const thumbHeight = Math.max(1, Math.floor((height / totalHeight) * height));
    const thumbPosition = Math.floor((scrollTop / maxScroll) * (height - thumbHeight));

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
      ...contentNodes
    ),
    scrollbar
  );
}
