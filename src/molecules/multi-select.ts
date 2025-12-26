/**
 * MultiSelect - Enhanced multi-selection with fuzzy search
 *
 * @layer Molecule
 * @description Multi-selection composed of checkboxes with fuzzy search
 *
 * Features:
 * - Multiple selection with checkboxes
 * - Fuzzy search filtering
 * - Keyboard navigation
 * - Select all / deselect all
 * - Tags display for selected items
 * - Grouping support
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal, createMemo } from '../primitives/signal.js';
import { useInput, type Key } from '../hooks/index.js';
import { getChars, getRenderMode } from '../core/capabilities.js';

// =============================================================================
// Types
// =============================================================================

export interface MultiSelectItem<T = string> {
  /** Unique value */
  value: T;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Group name */
  group?: string;
}

export interface MultiSelectOptions<T = string> {
  /** Items to select from */
  items: MultiSelectItem<T>[];
  /** Initially selected values */
  initialValue?: T[];
  /** Max visible items */
  maxVisible?: number;
  /** Enable fuzzy search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Show selected count */
  showCount?: boolean;
  /** Show tags for selected items */
  showTags?: boolean;
  /** Max tags to show before "+N more" */
  maxTags?: number;
  /** Min selections required */
  minSelections?: number;
  /** Max selections allowed */
  maxSelections?: number;
  /** Colors */
  colorActive?: ColorValue;
  colorSelected?: ColorValue;
  /** Callbacks */
  onChange?: (values: T[]) => void;
  onSubmit?: (values: T[]) => void;
  onCancel?: () => void;
  /** Is active */
  isActive?: boolean;
}

export interface MultiSelectState<T = string> {
  cursorIndex: () => number;
  selected: () => T[];
  searchQuery: () => string;
  isSearching: () => boolean;
  filteredItems: () => MultiSelectItem<T>[];
  visibleItems: () => { items: MultiSelectItem<T>[]; startIndex: number };
  scrollOffset: () => number;
  // Actions
  moveUp: () => void;
  moveDown: () => void;
  toggleCurrent: () => void;
  toggleIndex: (index: number) => void;
  selectAll: () => void;
  deselectAll: () => void;
  setSearch: (query: string) => void;
  submit: () => void;
  cancel: () => void;
  isSelected: (value: T) => boolean;
}

// =============================================================================
// Fuzzy Search
// =============================================================================

/**
 * Simple fuzzy match score
 */
function fuzzyMatch(query: string, text: string): number {
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();

  if (lowerText.includes(lowerQuery)) {
    // Exact substring match gets high score
    return 100 - lowerText.indexOf(lowerQuery);
  }

  // Character-by-character fuzzy matching
  let queryIndex = 0;
  let score = 0;
  let lastMatchIndex = -1;

  for (let i = 0; i < lowerText.length && queryIndex < lowerQuery.length; i++) {
    if (lowerText[i] === lowerQuery[queryIndex]) {
      score += 10;
      // Bonus for consecutive matches
      if (lastMatchIndex === i - 1) score += 5;
      // Bonus for word start matches
      if (i === 0 || lowerText[i - 1] === ' ') score += 3;
      lastMatchIndex = i;
      queryIndex++;
    }
  }

  // All query characters must be found
  return queryIndex === lowerQuery.length ? score : 0;
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create a MultiSelect state manager
 */
export function createMultiSelect<T = string>(
  options: MultiSelectOptions<T>
): MultiSelectState<T> {
  const {
    items,
    initialValue = [],
    maxVisible = 10,
    searchable = true,
    minSelections = 0,
    maxSelections = Infinity,
    onChange,
    onSubmit,
    onCancel,
  } = options;

  const [cursorIndex, setCursorIndex] = createSignal(0);
  const [selected, setSelected] = createSignal<T[]>(initialValue);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [isSearching, setIsSearching] = createSignal(false);
  const [scrollOffset, setScrollOffset] = createSignal(0);

  // Filtered items based on search
  const filteredItems = createMemo(() => {
    const query = searchQuery();
    if (!query || !searchable) return items;

    return items
      .map((item) => ({
        item,
        score: Math.max(
          fuzzyMatch(query, item.label),
          fuzzyMatch(query, item.description || '')
        ),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((r) => r.item);
  });

  // Visible items with scroll
  const visibleItems = createMemo(() => {
    const filtered = filteredItems();
    const offset = scrollOffset();
    const visible = filtered.slice(offset, offset + maxVisible);
    return { items: visible, startIndex: offset };
  });

  // Navigation
  const moveUp = () => {
    const filtered = filteredItems();
    setCursorIndex((i) => {
      let newIndex = i - 1;
      while (newIndex >= 0 && filtered[newIndex]?.disabled) {
        newIndex--;
      }
      if (newIndex < 0) return i;

      if (newIndex < scrollOffset()) {
        setScrollOffset(newIndex);
      }
      return newIndex;
    });
  };

  const moveDown = () => {
    const filtered = filteredItems();
    setCursorIndex((i) => {
      let newIndex = i + 1;
      while (newIndex < filtered.length && filtered[newIndex]?.disabled) {
        newIndex++;
      }
      if (newIndex >= filtered.length) return i;

      if (newIndex >= scrollOffset() + maxVisible) {
        setScrollOffset(newIndex - maxVisible + 1);
      }
      return newIndex;
    });
  };

  const isSelected = (value: T): boolean => {
    return selected().includes(value);
  };

  const toggleCurrent = () => {
    toggleIndex(cursorIndex());
  };

  const toggleIndex = (index: number) => {
    const filtered = filteredItems();
    if (index < 0 || index >= filtered.length) return;
    const item = filtered[index];
    if (item.disabled) return;

    // Update cursor if different
    if (index !== cursorIndex()) {
      setCursorIndex(index);
    }

    setSelected((prev) => {
      if (prev.includes(item.value)) {
        // Deselect
        if (prev.length <= minSelections) return prev;
        const newSelected = prev.filter((v) => v !== item.value);
        onChange?.(newSelected);
        return newSelected;
      } else {
        // Select
        if (prev.length >= maxSelections) return prev;
        const newSelected = [...prev, item.value];
        onChange?.(newSelected);
        return newSelected;
      }
    });
  };

  const selectAll = () => {
    const filtered = filteredItems();
    const selectable = filtered
      .filter((item) => !item.disabled)
      .map((item) => item.value)
      .slice(0, maxSelections);
    setSelected(selectable);
    onChange?.(selectable);
  };

  const deselectAll = () => {
    if (minSelections > 0) {
      const keep = selected().slice(0, minSelections);
      setSelected(keep);
      onChange?.(keep);
    } else {
      setSelected([]);
      onChange?.([]);
    }
  };

  const setSearch = (query: string) => {
    setSearchQuery(query);
    setCursorIndex(0);
    setScrollOffset(0);
  };

  const submit = () => {
    onSubmit?.(selected());
  };

  const cancel = () => {
    onCancel?.();
  };

  return {
    cursorIndex,
    selected,
    searchQuery,
    isSearching,
    filteredItems,
    visibleItems,
    scrollOffset,
    moveUp,
    moveDown,
    toggleCurrent,
    toggleIndex,
    selectAll,
    deselectAll,
    setSearch,
    submit,
    cancel,
    isSelected,
  };
}

// =============================================================================
// Component
// =============================================================================

export interface MultiSelectProps<T = string> extends MultiSelectOptions<T> {
  /** Pre-created state (for controlled mode) */
  state?: MultiSelectState<T>;
}

/**
 * MultiSelect - Interactive multi-selection component
 *
 * @example
 * MultiSelect({
 *   items: [
 *     { value: 'react', label: 'React' },
 *     { value: 'vue', label: 'Vue' },
 *     { value: 'angular', label: 'Angular' },
 *   ],
 *   searchable: true,
 *   showTags: true,
 *   onChange: (values) => console.log(values),
 * })
 */
export function MultiSelect<T = string>(props: MultiSelectProps<T>): VNode {
  const {
    items,
    maxVisible = 10,
    searchable = true,
    showCount = true,
    showTags = false,
    maxTags = 3,
    colorActive = 'primary',
    colorSelected = 'success',
    isActive = true,
    state: externalState,
  } = props;

  const state = externalState || createMultiSelect(props);
  const chars = getChars();

  // Setup keyboard handling with stopPropagation to prevent input leakage
  useInput(
    (input, key) => {
      if (key.upArrow || input === 'k') {
        state.moveUp();
        return true;
      } else if (key.downArrow || input === 'j') {
        state.moveDown();
        return true;
      } else if (input === ' ' || key.return) {
        if (key.return && !state.isSearching()) {
          state.submit();
        } else {
          state.toggleCurrent();
        }
        return true;
      } else if (input === 'a' && key.ctrl) {
        state.selectAll();
        return true;
      } else if (input === 'd' && key.ctrl) {
        state.deselectAll();
        return true;
      } else if (key.escape) {
        state.cancel();
        return true;
      } else if (searchable && input && input.length === 1) {
        state.setSearch(state.searchQuery() + input);
        return true;
      } else if (key.backspace && searchable) {
        state.setSearch(state.searchQuery().slice(0, -1));
        return true;
      }
      return false;
    },
    { isActive, stopPropagation: true }
  );

  const { items: visible, startIndex } = state.visibleItems();
  const filtered = state.filteredItems();
  const cursor = state.cursorIndex();
  const selectedValues = state.selected();

  // Build tags display
  let tagsNode: VNode | null = null;
  if (showTags && selectedValues.length > 0) {
    const selectedItems = items.filter((item) =>
      selectedValues.includes(item.value)
    );
    const displayTags = selectedItems.slice(0, maxTags);
    const remaining = selectedItems.length - maxTags;

    const tagNodes = displayTags.map((item) =>
      Box(
        { paddingX: 1, borderStyle: 'round', borderColor: colorSelected },
        Text({ color: colorSelected }, item.label)
      )
    );

    if (remaining > 0) {
      tagNodes.push(Text({ color: 'mutedForeground', dim: true }, `+${remaining} more`));
    }

    tagsNode = Box({ flexDirection: 'row', gap: 1, marginBottom: 1 }, ...tagNodes);
  }

  // Build search input
  let searchNode: VNode | null = null;
  if (searchable) {
    const query = state.searchQuery();
    searchNode = Box(
      { marginBottom: 1 },
      Text({ color: 'mutedForeground' }, '🔍 '),
      Text({}, query || props.searchPlaceholder || 'Type to search...')
    );
  }

  // Build item rows
  const itemNodes = visible.map((item, i) => {
    const globalIndex = startIndex + i;
    const isCurrentCursor = globalIndex === cursor;
    const isItemSelected = state.isSelected(item.value);

    const checkbox = isItemSelected
      ? chars.checkbox.checked
      : chars.checkbox.unchecked;

    const cursorChar = isCurrentCursor ? chars.arrows.right : ' ';
    const labelColor = item.disabled
      ? 'mutedForeground'
      : isCurrentCursor
        ? colorActive
        : isItemSelected
          ? colorSelected
          : 'foreground';

    return Box(
      {
        flexDirection: 'row',
        gap: 1,
        onClick: item.disabled ? undefined : () => state.toggleIndex(globalIndex),
      },
      Text({ color: isCurrentCursor ? colorActive : 'mutedForeground' }, cursorChar),
      Text({ color: isItemSelected ? colorSelected : 'mutedForeground' }, checkbox),
      Text({ color: labelColor, dim: item.disabled }, item.label),
      item.description
        ? Text({ color: 'mutedForeground', dim: true }, ` - ${item.description}`)
        : null
    );
  });

  // Build footer with count
  let footerNode: VNode | null = null;
  if (showCount) {
    footerNode = Box(
      { marginTop: 1 },
      Text(
        { color: 'mutedForeground', dim: true },
        `${selectedValues.length} selected · ${filtered.length} items`
      )
    );
  }

  // Scroll indicators
  const hasMore = filtered.length > maxVisible;
  const scrollTop = state.scrollOffset() > 0;
  const scrollBottom = state.scrollOffset() + maxVisible < filtered.length;

  return Box(
    { flexDirection: 'column' },
    tagsNode,
    searchNode,
    scrollTop ? Text({ color: 'mutedForeground', dim: true }, '  ▲ more above') : null,
    ...itemNodes,
    scrollBottom ? Text({ color: 'mutedForeground', dim: true }, '  ▼ more below') : null,
    footerNode
  );
}
