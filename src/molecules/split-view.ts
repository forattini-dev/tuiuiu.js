/**
 * SplitView - Master-detail layout component
 *
 * @layer Molecule
 * @description Split view with list selection and detail panel
 *
 * Features:
 * - createSplitView() state factory
 * - Keyboard navigation (Up/Down/Enter/Escape)
 * - Horizontal/vertical layouts
 * - Configurable split ratio
 * - Signal-transparent props
 * - Both controlled and uncontrolled modes
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { createSignal, createMemo } from '../primitives/signal.js';
import { useInput, type Key } from '../hooks/index.js';
import { getTheme } from '../core/theme.js';
import { resolve, type MaybeReactive } from '../utils/resolve.js';

// =============================================================================
// Types
// =============================================================================

export type SplitDirection = 'horizontal' | 'vertical';

/** State returned by createSplitView */
export interface SplitViewState<T> {
  /** Items array */
  items: () => T[];
  /** Currently selected index (null if none) */
  selectedIndex: () => number | null;
  /** Currently selected item (null if none) */
  selectedItem: () => T | null;
  /** Check if index is selected */
  isSelected: (index: number) => boolean;
  /** Select by index */
  select: (index: number | null) => void;
  /** Select next item (wraps) */
  selectNext: () => void;
  /** Select previous item (wraps) */
  selectPrevious: () => void;
  /** Clear selection */
  clearSelection: () => void;
  /** Cleanup function */
  cleanup: () => void;
}

/** Options for createSplitView */
export interface CreateSplitViewOptions<T> {
  /** Items array (can be reactive) */
  items: MaybeReactive<T[]>;
  /** Initial selection index */
  initialIndex?: number;
  /** Enable keyboard navigation (default: true) */
  keysEnabled?: boolean;
  /** Is active (for keyboard handling) */
  isActive?: MaybeReactive<boolean>;
  /** Callback when selection changes */
  onSelect?: (item: T | null, index: number | null) => void;
}

/** SplitView component props */
export interface SplitViewProps<T> {
  /** Use state from createSplitView */
  state?: SplitViewState<T>;

  // OR uncontrolled props
  /** Items array */
  items?: MaybeReactive<T[]>;
  /** Selected index (controlled) */
  selectedIndex?: MaybeReactive<number | null>;
  /** Selection change callback */
  onSelect?: (item: T, index: number) => void;
  /** Enable keyboard navigation */
  keysEnabled?: boolean;
  /** Is active for keyboard input */
  isActive?: MaybeReactive<boolean>;

  // Render functions (required)
  /** Render each list item */
  renderItem: (item: T, index: number, selected: boolean) => VNode;
  /** Render detail view */
  renderDetail: (item: T | null) => VNode;

  // Layout options
  /** Split ratio (0-1, default: 0.33) */
  ratio?: number;
  /** Layout direction (default: 'horizontal') */
  direction?: SplitDirection;
  /** Show divider line (default: true) */
  divider?: boolean;
  /** Content when nothing selected */
  emptyDetail?: VNode;
  /** List width in chars (alternative to ratio) */
  listWidth?: number;
  /** Gap between panels */
  gap?: number;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a SplitView state manager
 *
 * Manages selection state and keyboard navigation for master-detail layouts.
 *
 * @example
 * ```typescript
 * const view = createSplitView({
 *   items: requests,
 *   keysEnabled: true,
 *   onSelect: (item) => console.log('Selected:', item),
 * })
 *
 * // Use in component
 * SplitView({
 *   state: view,
 *   renderItem: (item, i, selected) => ListItem({ ...item, selected }),
 *   renderDetail: (item) => item ? RequestDetail({ request: item }) : null,
 * })
 * ```
 */
export function createSplitView<T>(options: CreateSplitViewOptions<T>): SplitViewState<T> {
  const {
    items: itemsProp,
    initialIndex,
    keysEnabled = true,
    isActive: isActiveProp = true,
    onSelect,
  } = options;

  // Selection state
  const [selectedIndex, setSelectedIndex] = createSignal<number | null>(initialIndex ?? null);

  // Memoized items
  const items = createMemo(() => resolve(itemsProp));

  // Memoized selected item
  const selectedItem = createMemo(() => {
    const idx = selectedIndex();
    const arr = items();
    return idx !== null && idx >= 0 && idx < arr.length ? arr[idx] : null;
  });

  // Check if active
  const checkIsActive = () => {
    const active = resolve(isActiveProp);
    return active;
  };

  // Cleanup function
  let cleanedUp = false;
  const cleanup = () => {
    cleanedUp = true;
  };

  // Navigation functions
  const select = (index: number | null) => {
    const arr = items();
    if (index !== null && (index < 0 || index >= arr.length)) return;
    setSelectedIndex(index);
    onSelect?.(index !== null ? arr[index] : null, index);
  };

  const selectNext = () => {
    const arr = items();
    if (arr.length === 0) return;
    const current = selectedIndex();
    const next = current === null ? 0 : (current + 1) % arr.length;
    select(next);
  };

  const selectPrevious = () => {
    const arr = items();
    if (arr.length === 0) return;
    const current = selectedIndex();
    const prev = current === null ? arr.length - 1 : (current - 1 + arr.length) % arr.length;
    select(prev);
  };

  const clearSelection = () => {
    select(null);
  };

  const isSelected = (index: number) => selectedIndex() === index;

  // Keyboard navigation
  if (keysEnabled) {
    useInput((input: string, key: Key) => {
      if (cleanedUp || !checkIsActive()) return false;

      if (key.downArrow || input === 'j') {
        selectNext();
        return true;
      }
      if (key.upArrow || input === 'k') {
        selectPrevious();
        return true;
      }
      if (key.escape) {
        clearSelection();
        return true;
      }
      return false;
    });
  }

  return {
    items,
    selectedIndex,
    selectedItem,
    isSelected,
    select,
    selectNext,
    selectPrevious,
    clearSelection,
    cleanup,
  };
}

// =============================================================================
// Component
// =============================================================================

/**
 * SplitView - Master-detail layout component
 *
 * @example
 * // With createSplitView state
 * const view = createSplitView({ items: requests, keysEnabled: true })
 * SplitView({
 *   state: view,
 *   renderItem: (item, i, selected) => ListItem({ primary: item.name, selected }),
 *   renderDetail: (item) => item ? Detail({ data: item }) : Text({}, 'Select an item'),
 * })
 *
 * @example
 * // Uncontrolled mode
 * SplitView({
 *   items: files,
 *   renderItem: (file, i, selected) => fileListItem(file.name),
 *   renderDetail: (file) => file ? FilePreview({ file }) : null,
 *   ratio: 0.4,
 *   direction: 'horizontal',
 * })
 *
 * @example
 * // Vertical layout
 * SplitView({
 *   items: logs,
 *   renderItem: (log, i, sel) => Text({ bold: sel }, log.message),
 *   renderDetail: (log) => log ? LogDetail({ log }) : null,
 *   direction: 'vertical',
 *   ratio: 0.6,
 * })
 */
export function SplitView<T>(props: SplitViewProps<T>): VNode {
  const {
    state,
    items: itemsProp,
    selectedIndex: selectedIndexProp,
    onSelect,
    keysEnabled = true,
    isActive: isActiveProp = true,
    renderItem,
    renderDetail,
    ratio = 0.33,
    direction = 'horizontal',
    divider = true,
    emptyDetail,
    listWidth,
    gap = 1,
  } = props;

  const theme = getTheme();

  // Use provided state or create internal state for uncontrolled mode
  const internalState = state ?? (() => {
    const items = itemsProp ?? [];
    const initialIndex = selectedIndexProp !== undefined ? resolve(selectedIndexProp) : null;
    return createSplitView({
      items,
      initialIndex: initialIndex ?? undefined,
      keysEnabled,
      isActive: isActiveProp,
      onSelect: onSelect ? (item, idx) => item && idx !== null && onSelect(item, idx) : undefined,
    });
  })();

  // Get current values
  const items = internalState.items();
  const selectedItem = internalState.selectedItem();

  // Calculate dimensions
  const isHorizontal = direction === 'horizontal';

  // Divider component
  const dividerNode = divider
    ? Box(
        {
          [isHorizontal ? 'width' : 'height']: 1,
          backgroundColor: theme.borders.default,
        }
      )
    : null;

  // List panel
  const listPanel = Box(
    {
      flexDirection: 'column',
      width: listWidth ?? (isHorizontal ? `${Math.round(ratio * 100)}%` : '100%'),
      height: isHorizontal ? '100%' : `${Math.round(ratio * 100)}%`,
      overflow: 'hidden',
    },
    ...items.map((item, index) =>
      renderItem(item, index, internalState.isSelected(index))
    )
  );

  // Detail panel
  const detailPanel = Box(
    {
      flexGrow: 1,
      flexDirection: 'column',
      overflow: 'hidden',
    },
    selectedItem !== null
      ? renderDetail(selectedItem)
      : emptyDetail ?? Text({ color: 'muted' }, 'No item selected')
  );

  // Layout
  if (isHorizontal) {
    return Box(
      {
        flexDirection: 'row',
        gap: divider ? 0 : gap,
        width: '100%',
        height: '100%',
      },
      listPanel,
      dividerNode,
      detailPanel
    );
  }

  // Vertical layout
  return Box(
    {
      flexDirection: 'column',
      gap: divider ? 0 : gap,
      width: '100%',
      height: '100%',
    },
    listPanel,
    dividerNode,
    detailPanel
  );
}

