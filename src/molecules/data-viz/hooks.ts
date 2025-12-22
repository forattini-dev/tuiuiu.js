/**
 * Interactive Hooks for Data Visualization
 *
 * React-like hooks for managing interactive state in charts:
 * - useChartSelection: Manage selected data points
 * - useChartHover: Manage hover state
 * - useChartKeyboard: Keyboard navigation
 * - useChartTooltip: Tooltip positioning
 * - useChartZoom: Zoom and pan
 * - useChartInteraction: Combined interactions
 */

import { createSignal, createEffect, createMemo } from '../../primitives/signal.js';
import type { ColorValue } from '../../utils/types.js';

// =============================================================================
// Types
// =============================================================================

export interface SelectionState {
  /** Selected data point index */
  selectedIndex?: number;
  /** Selected data indices (multi-select) */
  selectedIndices: number[];
  /** Last selected index */
  lastSelectedIndex?: number;
}

export interface HoverState {
  /** Currently hovered index */
  hoveredIndex?: number;
  /** Hover position */
  position?: { x: number; y: number };
}

export interface TooltipState {
  /** Tooltip visible */
  visible: boolean;
  /** Tooltip content */
  content: string;
  /** Tooltip position */
  position: { x: number; y: number };
}

export interface ZoomState {
  /** Zoom level (1 = 100%) */
  level: number;
  /** Pan offset */
  panX: number;
  panY: number;
}

export interface ChartInteractionState {
  selection: SelectionState;
  hover: HoverState;
  tooltip: TooltipState;
  zoom: ZoomState;
  /** Currently focused chart (for keyboard nav) */
  isFocused: boolean;
}

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook for managing data point selection
 *
 * @param dataLength - Number of data points
 * @param multiSelect - Enable multi-select (default: false)
 * @returns Selection state and handlers
 *
 * @example
 * const { selectedIndices, select, clear } = useChartSelection(10)
 * select(0)  // Select first point
 * select(2, true)  // Multi-select with previous
 * clear()  // Clear selection
 */
export function useChartSelection(dataLength: number, multiSelect = false) {
  const [selectedIndices, setSelectedIndices] = createSignal<number[]>([] as number[]);
  const [lastSelectedIndex, setLastSelectedIndex] = createSignal<number | undefined>(undefined);

  const select = (index: number, addToSelection = multiSelect) => {
    if (index < 0 || index >= dataLength) return;

    setLastSelectedIndex(index);

    if (addToSelection && multiSelect) {
      setSelectedIndices((prev) => {
        if (prev.includes(index)) {
          return prev.filter((i) => i !== index);
        }
        return [...prev, index];
      });
    } else {
      setSelectedIndices([index]);
    }
  };

  const selectRange = (start: number, end: number) => {
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    const indices = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    setSelectedIndices(indices);
    setLastSelectedIndex(end);
  };

  const clear = () => {
    setSelectedIndices([]);
    setLastSelectedIndex(undefined);
  };

  const isSelected = (index: number) => selectedIndices().includes(index);

  return {
    selectedIndices,
    lastSelectedIndex,
    select,
    selectRange,
    clear,
    isSelected,
  };
}

/**
 * Hook for managing hover state
 *
 * @param dataLength - Number of data points
 * @returns Hover state and handlers
 *
 * @example
 * const { hoveredIndex, hover, unhover } = useChartHover(10)
 * hover(2)  // Hover over index 2
 * unhover()  // Clear hover
 */
export function useChartHover(dataLength: number) {
  const [hoveredIndex, setHoveredIndex] = createSignal<number | undefined>(undefined);
  const [position, setPosition] = createSignal<{ x: number; y: number } | undefined>(undefined);

  const hover = (index: number, pos?: { x: number; y: number }) => {
    if (index < 0 || index >= dataLength) return;
    setHoveredIndex(index);
    if (pos) setPosition(pos);
  };

  const unhover = () => {
    setHoveredIndex(undefined);
    setPosition(undefined);
  };

  return {
    hoveredIndex,
    position,
    hover,
    unhover,
  };
}

/**
 * Hook for managing tooltip display
 *
 * @returns Tooltip state and handlers
 *
 * @example
 * const { visible, show, hide } = useChartTooltip()
 * show('Value: 42', { x: 10, y: 20 })
 * hide()
 */
export function useChartTooltip() {
  const [visible, setVisible] = createSignal(false);
  const [content, setContent] = createSignal('');
  const [position, setPosition] = createSignal({ x: 0, y: 0 });

  const show = (text: string, pos: { x: number; y: number }) => {
    setContent(text);
    setPosition(pos);
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

  return {
    visible,
    content,
    position,
    show,
    hide,
  };
}

/**
 * Hook for managing zoom and pan
 *
 * @param initialLevel - Initial zoom level (default: 1)
 * @returns Zoom state and handlers
 *
 * @example
 * const { level, panX, panY, zoom, pan, reset } = useChartZoom()
 * zoom(1.2)  // Zoom to 120%
 * pan(10, 5)  // Pan by 10, 5
 * reset()  // Reset zoom and pan
 */
export function useChartZoom(initialLevel = 1) {
  const [level, setLevel] = createSignal(initialLevel);
  const [panX, setPanX] = createSignal(0);
  const [panY, setPanY] = createSignal(0);

  const zoom = (newLevel: number, minLevel = 0.1, maxLevel = 5) => {
    const clamped = Math.max(minLevel, Math.min(maxLevel, newLevel));
    setLevel(clamped);
  };

  const zoomIn = (factor = 1.2) => {
    zoom(level() * factor);
  };

  const zoomOut = (factor = 0.8) => {
    zoom(level() * factor);
  };

  const pan = (dx: number, dy: number) => {
    setPanX((p) => p + dx);
    setPanY((p) => p + dy);
  };

  const reset = () => {
    setLevel(initialLevel);
    setPanX(0);
    setPanY(0);
  };

  return {
    level,
    panX,
    panY,
    zoom,
    zoomIn,
    zoomOut,
    pan,
    reset,
  };
}

/**
 * Hook for keyboard navigation in charts
 *
 * @param dataLength - Number of data points
 * @param onSelect - Callback when item selected via keyboard
 * @param onNavigate - Callback when navigation occurs
 * @returns Navigation state and handlers
 *
 * @example
 * const nav = useChartKeyboard(10, (idx) => select(idx))
 * // User presses Up/Down arrows to navigate
 */
export function useChartKeyboard(
  dataLength: number,
  onSelect?: (index: number) => void,
  onNavigate?: (index: number) => void
) {
  const [currentIndex, setCurrentIndex] = createSignal(0);
  const [isNavigating, setIsNavigating] = createSignal(false);

  const navigate = (direction: 'up' | 'down' | 'first' | 'last') => {
    let newIndex = currentIndex();

    switch (direction) {
      case 'up':
        newIndex = Math.max(0, newIndex - 1);
        break;
      case 'down':
        newIndex = Math.min(dataLength - 1, newIndex + 1);
        break;
      case 'first':
        newIndex = 0;
        break;
      case 'last':
        newIndex = dataLength - 1;
        break;
    }

    setCurrentIndex(newIndex);
    setIsNavigating(true);
    onNavigate?.(newIndex);
  };

  const selectCurrent = () => {
    onSelect?.(currentIndex());
  };

  return {
    currentIndex,
    isNavigating,
    navigate,
    selectCurrent,
  };
}

/**
 * Combined hook for full chart interactivity
 *
 * @param dataLength - Number of data points
 * @param options - Configuration options
 * @returns All interaction handlers
 *
 * @example
 * const interaction = useChartInteraction(data.length, {
 *   multiSelect: true,
 *   withTooltip: true,
 *   withZoom: true,
 * })
 *
 * // Use in event handlers
 * onMouseMove={(e) => interaction.hover(index, { x: e.x, y: e.y })}
 * onMouseLeave={() => interaction.unhover()}
 * onClick={(e) => interaction.select(index)}
 * onKeyDown={(k) => {
 *   if (k.upArrow) interaction.navigateUp()
 *   if (k.downArrow) interaction.navigateDown()
 * }}
 */
export function useChartInteraction(
  dataLength: number,
  options: {
    multiSelect?: boolean;
    withTooltip?: boolean;
    withZoom?: boolean;
    withKeyboard?: boolean;
  } = {}
) {
  const { multiSelect = false, withTooltip = true, withZoom = true, withKeyboard = true } = options;

  const selection = useChartSelection(dataLength, multiSelect);
  const hover = useChartHover(dataLength);
  const tooltip = withTooltip ? useChartTooltip() : null;
  const zoom = withZoom ? useChartZoom() : null;
  const keyboard = withKeyboard ? useChartKeyboard(dataLength) : null;

  const [isFocused, setIsFocused] = createSignal(false);

  const select = (index: number, addToSelection?: boolean) => {
    selection.select(index, addToSelection);
  };

  const hoverPoint = (index: number, pos?: { x: number; y: number }) => {
    hover.hover(index, pos);
  };

  const unhover = () => {
    hover.unhover();
  };

  const navigateUp = () => {
    keyboard?.navigate('up');
  };

  const navigateDown = () => {
    keyboard?.navigate('down');
  };

  const navigateFirst = () => {
    keyboard?.navigate('first');
  };

  const navigateLast = () => {
    keyboard?.navigate('last');
  };

  const selectCurrent = () => {
    keyboard?.selectCurrent();
  };

  const focus = () => setIsFocused(true);
  const blur = () => setIsFocused(false);

  // Memoize combined state
  const state = createMemo(() => ({
    selection: {
      selectedIndices: selection.selectedIndices(),
      lastSelectedIndex: selection.lastSelectedIndex?.(),
    },
    hover: {
      hoveredIndex: hover.hoveredIndex(),
      position: hover.position(),
    },
    tooltip: tooltip
      ? {
          visible: tooltip.visible(),
          content: tooltip.content(),
          position: tooltip.position(),
        }
      : undefined,
    zoom: zoom
      ? {
          level: zoom.level(),
          panX: zoom.panX(),
          panY: zoom.panY(),
        }
      : undefined,
    isFocused: isFocused(),
  }));

  return {
    // State
    state,
    isSelected: selection.isSelected,
    hoveredIndex: hover.hoveredIndex,
    isFocused,

    // Selection API
    select,
    selectRange: selection.selectRange,
    clearSelection: selection.clear,

    // Hover API
    hoverPoint,
    unhover,

    // Tooltip API (if enabled)
    showTooltip: tooltip?.show,
    hideTooltip: tooltip?.hide,

    // Zoom API (if enabled)
    zoomIn: zoom?.zoomIn,
    zoomOut: zoom?.zoomOut,
    resetZoom: zoom?.reset,
    pan: zoom?.pan,

    // Keyboard API (if enabled)
    navigateUp,
    navigateDown,
    navigateFirst,
    navigateLast,
    selectCurrent,

    // Focus management
    focus,
    blur,
  };
}

/**
 * Hook for tracking data changes and animations
 *
 * @param data - Data array
 * @param onDataChange - Callback when data changes
 * @returns Data tracking utilities
 *
 * @example
 * const { changedIndices, hasChanged } = useChartDataChange(data, (indices) => {
 *   // Call this manually when data changes to update tracking
 *   updateChangedIndices(indices)
 * })
 */
export function useChartDataChange<T>(data: T[], onDataChange?: (indices: number[]) => void) {
  const [changedIndices, setChangedIndices] = createSignal<number[]>([]);

  // Manual update function to avoid infinite loops
  const updateChangedIndices = (previousData: T[]) => {
    const changed: number[] = [];
    for (let i = 0; i < Math.max(data.length, previousData.length); i++) {
      if (data[i] !== previousData[i]) {
        changed.push(i);
      }
    }
    setChangedIndices(changed);
    onDataChange?.(changed);
  };

  const hasChanged = (index: number) => changedIndices().includes(index);

  return {
    changedIndices,
    hasChanged,
    updateChangedIndices,
  };
}

// =============================================================================
// Type exports are at the top of the file
// =============================================================================
