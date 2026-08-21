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
import type { VNode, ColorValue, BoxStyle, LayoutRect } from '../utils/types.js';
import { createSignal } from './signal.js';
import { useInput } from '../hooks/index.js';
import { useFactoryState } from '../hooks/factory-state.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { calculateLayout } from '../core/layout.js';
import { component, type ComponentKeyProps } from '../app/component.js';

// =============================================================================
// Types
// =============================================================================

export interface ScrollProps extends ComponentKeyProps {
  /** Explicit runtime query ID */
  id?: string;

  /** Visible height in lines */
  height: number;

  /** Width for content layout */
  width?: BoxStyle['width'];

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
  updateOptions: (options: ScrollInternalOptions) => void;
}

interface ScrollInternalOptions {
  height?: number;
}

interface InternalScrollState extends ScrollState {
  _setMaxScroll: (max: number) => void;
  _setHeight: (h: number) => void;
}

function validatePositiveInteger(value: number, name: string): number {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer`);
  }
  return value;
}

function validateFiniteNumber(value: number, name: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${name} must be a finite number`);
  }
  return value;
}

// =============================================================================
// State Factory
// =============================================================================

export function createScroll(options: ScrollInternalOptions = {}): InternalScrollState {
  const initialHeight = validatePositiveInteger(options.height ?? 10, 'height');
  const [scrollTop, setScrollTop] = createSignal(0);
  const [maxScroll, setMaxScroll] = createSignal(0);
  const [height, setHeight] = createSignal(initialHeight);

  const scrollBy = (delta: number) => {
    validateFiniteNumber(delta, 'scroll delta');
    const max = maxScroll();
    setScrollTop(current => Math.max(0, Math.min(max, current + delta)));
  };

  const scrollTo = (pos: number) => {
    validateFiniteNumber(pos, 'scroll position');
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
    updateOptions: (nextOptions: ScrollInternalOptions) => {
      setHeight(validatePositiveInteger(nextOptions.height ?? 10, 'height'));
    },
    _setMaxScroll: (max: number) => {
      const normalized = validateFiniteNumber(max, 'maxScroll');
      if (normalized < 0) {
        throw new RangeError('maxScroll must be non-negative');
      }
      const nextMax = Math.floor(normalized);
      setMaxScroll(nextMax);
      setScrollTop(current => Math.min(current, nextMax));
    },
    _setHeight: (nextHeight: number) => {
      setHeight(validatePositiveInteger(nextHeight, 'height'));
    },
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
  const state = useFactoryState<
    UseScrollOptions,
    InternalScrollState
  >(undefined, options, createScroll);

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
function renderScroll(props: ScrollProps, ...children: VNode[]): VNode {
  const {
    id,
    height,
    width,
    showScrollbar = true,
    keysEnabled = true,
    isActive = true,
    scrollbarColor = 'cyan',
    trackColor = 'gray',
    scrollStep = 1,
    state: externalState,
  } = props;
  validatePositiveInteger(height, 'height');
  validatePositiveInteger(scrollStep, 'scrollStep');
  if (
    typeof width === 'number' &&
    (!Number.isSafeInteger(width) || width <= 0)
  ) {
    throw new RangeError('width must be a positive safe integer');
  }

  // Use external state or create internal
  const state = useFactoryState(
    externalState,
    { height },
    createScroll
  );

  // Update height in state
  if (isInternalScrollState(state)) {
    state._setHeight(height);
  }

  const hasKnownWidth = typeof width === 'number';
  const initialContentWidth = hasKnownWidth ? width : undefined;
  let currentContentRect: LayoutRect = { x: 0, y: 0, width: 0, height: 0 };
  const contentLayoutRef = {
    current: () => currentContentRect,
    x: () => currentContentRect.x,
    y: () => currentContentRect.y,
    width: () => currentContentRect.width,
    height: () => currentContentRect.height,
    __update: (rect: LayoutRect) => {
      currentContentRect = rect;
      if (isInternalScrollState(state)) {
        state._setMaxScroll(Math.max(0, rect.height - height));
      }
    },
  };
  const contentNode = Box(
    {
      flexDirection: 'column',
      width: 'fill',
      layoutRef: contentLayoutRef,
    },
    ...children,
  );

  let totalHeight = height + state.maxScroll();
  if (initialContentWidth !== undefined) {
    let measured = calculateLayout(contentNode, initialContentWidth, Infinity);
    if (showScrollbar && measured.height > height && initialContentWidth > 2) {
      measured = calculateLayout(contentNode, initialContentWidth - 2, Infinity);
    }
    totalHeight = measured.height;
    if (isInternalScrollState(state)) {
      state._setMaxScroll(Math.max(0, totalHeight - height));
    }
  }

  const scrollTop = state.scrollTop();
  const maxScroll = state.maxScroll();

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
  const contentWidth = typeof width === 'number'
    ? Math.max(0, width - (hasScrollbar ? scrollbarWidth : 0))
    : undefined;
  const scrollQuery = {
    getViewport: () => ({ width: contentWidth, height }),
    getContent: () => ({ width: contentWidth, height: totalHeight }),
    getOffset: () => ({ x: 0, y: state.scrollTop() }),
    getMaxOffset: () => ({ x: 0, y: state.maxScroll() }),
    scrollTo: ({ y }: { x?: number; y?: number }) => {
      state.scrollTo(y ?? state.scrollTop());
    },
    scrollBy: ({ y }: { x?: number; y?: number }) => {
      state.scrollBy(y ?? 0);
    },
    scrollToStart: () => state.scrollToTop(),
    scrollToEnd: () => state.scrollToBottom(),
  };

  return Box(
    {
      id,
      flexDirection: 'row',
      width: width ?? 'fill',
      onScroll: handleScroll,
      __scrollQuery: scrollQuery,
    },
    Box(
      {
        flexDirection: 'column',
        flexGrow: 1,
        height,
        ...(contentWidth !== undefined ? { width: contentWidth } : undefined),
        overflow: 'hidden',
        __scrollOffsetY: scrollTop,
      },
      contentNode,
    ),
    scrollbar
  );
}

export const Scroll = component('Scroll', renderScroll);

function isInternalScrollState(state: ScrollState): state is InternalScrollState {
  return (
    typeof (state as Partial<InternalScrollState>)._setMaxScroll === 'function' &&
    typeof (state as Partial<InternalScrollState>)._setHeight === 'function'
  );
}
