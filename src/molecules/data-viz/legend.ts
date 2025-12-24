/**
 * Legend Component - Reusable legend for charts with color indicators
 *
 * Features:
 * - Flexible positioning (top, bottom, right, left)
 * - Color indicators (● or ■ symbols)
 * - Optional interactivity (click to toggle visibility)
 * - Series grouping
 * - Custom styling
 */

import { Box, Text } from '../../primitives/nodes.js';
import type { VNode, ColorValue } from '../../utils/types.js';
import { createSignal } from '../../primitives/signal.js';

// =============================================================================
// Types
// =============================================================================

export interface LegendItem {
  /** Item label/name */
  label: string;
  /** Color indicator */
  color?: ColorValue;
  /** Optional symbol to use instead of default */
  symbol?: string;
  /** Whether item is visible (for interactive legends) */
  visible?: boolean;
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

export type LegendPosition = 'top' | 'bottom' | 'right' | 'left';

export interface LegendOptions {
  /** Items to display */
  items: LegendItem[];
  /** Legend position */
  position?: LegendPosition;
  /** Show legend indicator symbols */
  showSymbols?: boolean;
  /** Symbol type */
  symbolType?: 'circle' | 'square' | 'line';
  /** Enable interactivity (click to toggle) */
  interactive?: boolean;
  /** Gap between items */
  gap?: number;
  /** On item click (for interactive legends) */
  onItemClick?: (index: number, label: string) => void;
  /** Is legend active (for input handling) */
  isActive?: boolean;
}

// =============================================================================
// State Management
// =============================================================================

export interface LegendState {
  visibleItems: () => boolean[];
  toggleItem: (index: number) => void;
  toggleAll: () => void;
  showItem: (index: number) => void;
  hideItem: (index: number) => void;
  getVisibleItems: () => LegendItem[];
}

/**
 * Create interactive legend state
 */
export function createLegend(options: LegendOptions): LegendState {
  const [visibleItems, setVisibleItems] = createSignal(
    options.items.map((item) => item.visible ?? true)
  );

  const toggleItem = (index: number) => {
    setVisibleItems((items) => {
      const newItems = [...items];
      newItems[index] = !newItems[index];
      return newItems;
    });
    options.onItemClick?.(index, options.items[index]!.label);
  };

  const toggleAll = () => {
    const allVisible = visibleItems().every((v) => v);
    setVisibleItems(() => options.items.map(() => !allVisible));
  };

  const showItem = (index: number) => {
    setVisibleItems((items) => {
      const newItems = [...items];
      newItems[index] = true;
      return newItems;
    });
  };

  const hideItem = (index: number) => {
    setVisibleItems((items) => {
      const newItems = [...items];
      newItems[index] = false;
      return newItems;
    });
  };

  const getVisibleItems = () => {
    return options.items.filter((_, i) => visibleItems()[i]);
  };

  return {
    visibleItems,
    toggleItem,
    toggleAll,
    showItem,
    hideItem,
    getVisibleItems,
  };
}

// =============================================================================
// Rendering
// =============================================================================

/**
 * Get symbol for legend item
 */
function getSymbol(
  symbolType: 'circle' | 'square' | 'line' = 'circle',
  customSymbol?: string
): string {
  if (customSymbol) return customSymbol;

  switch (symbolType) {
    case 'circle':
      return '●';
    case 'square':
      return '■';
    case 'line':
      return '─';
    default:
      return '●';
  }
}

// =============================================================================
// Component
// =============================================================================

export interface LegendProps extends LegendOptions {
  state?: LegendState;
}

/**
 * Legend - Reusable legend component for charts
 *
 * @example
 * // Basic legend
 * Legend({
 *   items: [
 *     { label: 'Series 1', color: 'cyan' },
 *     { label: 'Series 2', color: 'green' },
 *   ],
 *   position: 'bottom',
 * })
 *
 * @example
 * // Interactive legend with state management
 * const legendState = createLegend({ items: [...] })
 * Legend({
 *   items: [...],
 *   interactive: true,
 *   state: legendState,
 *   onItemClick: (idx, label) => console.log(`Clicked: ${label}`),
 * })
 */
export function Legend(props: LegendProps): VNode {
  const {
    items,
    position = 'bottom',
    showSymbols = true,
    symbolType = 'circle',
    interactive = false,
    gap = position === 'right' ? 0 : 2,
    state: externalState,
  } = props;

  const state = externalState || (interactive ? createLegend(props) : undefined);
  const visibleItems = state?.visibleItems() ?? items.map(() => true);

  // Build legend items
  const legendItems: VNode[] = items.map((item, idx) => {
    const isVisible = visibleItems[idx];
    const symbol = getSymbol(symbolType, item.symbol);
    const textColor = item.color ?? 'mutedForeground';

    // Build item content
    const itemContent: VNode[] = [];

    if (showSymbols) {
      itemContent.push(
        Text(
          {
            color: textColor,
            dim: !isVisible,
          },
          symbol
        )
      );
    }

    itemContent.push(
      Text(
        {
          color: 'mutedForeground',
          dim: !isVisible,
        },
        item.label
      )
    );

    // Item wrapper with optional click handler
    return Box(
      {
        flexDirection: 'row',
        gap: showSymbols ? 1 : 0,
        paddingRight: interactive ? 1 : 0,
        paddingLeft: interactive ? 1 : 0,
        // Visual feedback for interactive mode
        ...(interactive && isVisible === false
          ? {
              backgroundColor: 'mutedForeground',
            }
          : {}),
      },
      ...itemContent
    );
  });

  // Layout based on position
  const isVertical = position === 'right' || position === 'left';
  const flexDirection = isVertical ? 'column' : 'row';

  return Box(
    {
      flexDirection,
      gap,
    },
    ...legendItems
  );
}

// =============================================================================
// Exports
// =============================================================================

// Types are exported above via export type
