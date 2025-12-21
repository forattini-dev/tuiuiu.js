/**
 * Select - Interactive selection component
 *
 * Features:
 * - Single and multi-select modes
 * - Keyboard navigation (arrows, vim keys, search)
 * - Type-ahead search/filtering
 * - Visual indicators (cursor, checkboxes)
 * - Grouping with headers
 * - Pagination for large lists
 * - Custom item rendering
 * - Disabled items
 * - Descriptions and hints
 */

import { Box, Text } from '../../components/components.js';
import type { VNode } from '../../utils/types.js';
import { createSignal } from '../../primitives/signal.js';
import { useInput, type Key } from '../../hooks/index.js';
import { themeColor } from '../../core/theme.js';
import { getChars, getRenderMode } from '../../core/capabilities.js';

export interface SelectItem<T = any> {
  /** Unique value */
  value: T;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Group header (renders before this item) */
  group?: string;
  /** Custom color */
  color?: string;
  /** Icon/prefix */
  icon?: string;
}

export interface SelectOptions<T = any> {
  /** Items to select from */
  items: SelectItem<T>[];
  /** Allow multiple selections */
  multiple?: boolean;
  /** Initially selected value(s) */
  initialValue?: T | T[];
  /** Max visible items (for scrolling) */
  maxVisible?: number;
  /** Enable type-ahead search */
  searchable?: boolean;
  /** Placeholder for search */
  searchPlaceholder?: string;
  /** Cursor indicator */
  cursorIndicator?: string;
  /** Selected indicator (single) */
  selectedIndicator?: string;
  /** Checked indicator (multi) */
  checkedIndicator?: string;
  /** Unchecked indicator (multi) */
  uncheckedIndicator?: string;
  /** Active item color */
  activeColor?: string;
  /** Selected item color */
  selectedColor?: string;
  /** Disabled item color */
  disabledColor?: string;
  /** Show item count */
  showCount?: boolean;
  /** On selection change */
  onChange?: (value: T | T[]) => void;
  /** On submit (Enter) */
  onSubmit?: (value: T | T[]) => void;
  /** On cancel (Escape) */
  onCancel?: () => void;
  /** Is active/focused - can be boolean or getter function for reactive updates */
  isActive?: boolean | (() => boolean);
  /** Expand to fill available width */
  fullWidth?: boolean;
}

/**
 * Create a select state manager
 */
export function createSelect<T = any>(options: SelectOptions<T>) {
  const {
    items,
    multiple = false,
    initialValue,
    maxVisible = 10,
    searchable = false,
    onChange,
    isActive: isActiveProp = true,
  } = options;

  // Helper to check if select is currently active
  // Supports both static boolean and reactive getter function
  const checkIsActive = (): boolean => {
    return typeof isActiveProp === 'function' ? isActiveProp() : isActiveProp;
  };

  // Initialize selected values
  let initialSelected: T[] = [];
  if (multiple) {
    if (Array.isArray(initialValue)) {
      initialSelected = initialValue as T[];
    } else if (initialValue !== undefined) {
      initialSelected = [initialValue as T];
    }
  } else if (initialValue !== undefined) {
    initialSelected = [initialValue as T];
  }

  const [cursorIndex, setCursorIndex] = createSignal(0);
  const [selected, setSelected] = createSignal<T[]>(initialSelected);
  const [scrollOffset, setScrollOffset] = createSignal(0);
  const [searchQuery, setSearchQuery] = createSignal('');
  const [isSearching, setIsSearching] = createSignal(false);

  // Filter items based on search
  const getFilteredItems = (): SelectItem<T>[] => {
    const query = searchQuery().toLowerCase();
    if (!query) return items;
    return items.filter((item) =>
      item.label.toLowerCase().includes(query) ||
      item.description?.toLowerCase().includes(query)
    );
  };

  // Get visible items based on scroll
  const getVisibleItems = (): { items: SelectItem<T>[]; startIndex: number } => {
    const filtered = getFilteredItems();
    const offset = scrollOffset();
    const visible = filtered.slice(offset, offset + maxVisible);
    return { items: visible, startIndex: offset };
  };

  // Navigation
  const moveUp = () => {
    const filtered = getFilteredItems();
    setCursorIndex((i) => {
      let newIndex = i - 1;
      // Skip disabled items
      while (newIndex >= 0 && filtered[newIndex]?.disabled) {
        newIndex--;
      }
      if (newIndex < 0) newIndex = i; // Stay at current if can't move

      // Adjust scroll
      if (newIndex < scrollOffset()) {
        setScrollOffset(newIndex);
      }
      return newIndex;
    });
  };

  const moveDown = () => {
    const filtered = getFilteredItems();
    setCursorIndex((i) => {
      let newIndex = i + 1;
      // Skip disabled items
      while (newIndex < filtered.length && filtered[newIndex]?.disabled) {
        newIndex++;
      }
      if (newIndex >= filtered.length) newIndex = i; // Stay at current if can't move

      // Adjust scroll
      if (newIndex >= scrollOffset() + maxVisible) {
        setScrollOffset(newIndex - maxVisible + 1);
      }
      return newIndex;
    });
  };

  const moveToTop = () => {
    setCursorIndex(0);
    setScrollOffset(0);
  };

  const moveToBottom = () => {
    const filtered = getFilteredItems();
    const lastIndex = filtered.length - 1;
    setCursorIndex(lastIndex);
    setScrollOffset(Math.max(0, filtered.length - maxVisible));
  };

  // Selection
  const toggleSelection = () => {
    const filtered = getFilteredItems();
    const item = filtered[cursorIndex()];
    if (!item || item.disabled) return;

    if (multiple) {
      setSelected((prev) => {
        const newSelected = prev.includes(item.value)
          ? prev.filter((v) => v !== item.value)
          : [...prev, item.value];
        onChange?.(newSelected);
        return newSelected;
      });
    } else {
      setSelected([item.value]);
      onChange?.(item.value);
    }
  };

  const selectAll = () => {
    if (!multiple) return;
    const filtered = getFilteredItems();
    const allValues = filtered.filter((i) => !i.disabled).map((i) => i.value);
    setSelected(allValues);
    onChange?.(allValues);
  };

  const selectNone = () => {
    setSelected([]);
    onChange?.(multiple ? [] : undefined as any);
  };

  // Search
  const updateSearch = (query: string) => {
    setSearchQuery(query);
    setCursorIndex(0);
    setScrollOffset(0);
  };

  // Input handling
  const handleInput = (input: string, key: Key) => {
    // Check isActive dynamically at input time (supports reactive getter)
    if (!checkIsActive()) return;

    // Escape - cancel search or component
    if (key.escape) {
      if (isSearching()) {
        setIsSearching(false);
        setSearchQuery('');
      } else {
        options.onCancel?.();
      }
      return;
    }

    // Enter - submit
    if (key.return) {
      if (isSearching()) {
        setIsSearching(false);
      } else {
        const value = multiple ? selected() : selected()[0];
        options.onSubmit?.(value);
      }
      return;
    }

    // Search mode handling
    if (isSearching()) {
      if (key.backspace) {
        updateSearch(searchQuery().slice(0, -1));
        return;
      }
      if (input && input.length === 1 && !key.ctrl && !key.meta) {
        updateSearch(searchQuery() + input);
        return;
      }
    }

    // Navigation
    if (key.upArrow || (key.ctrl && input === 'p')) {
      moveUp();
      return;
    }

    if (key.downArrow || (key.ctrl && input === 'n')) {
      moveDown();
      return;
    }

    // Vim keys (when not searching)
    if (!isSearching()) {
      if (input === 'k') {
        moveUp();
        return;
      }
      if (input === 'j') {
        moveDown();
        return;
      }
      if (input === 'g') {
        moveToTop();
        return;
      }
      if (input === 'G') {
        moveToBottom();
        return;
      }
    }

    // Home/End
    if (key.home) {
      moveToTop();
      return;
    }

    if (key.end) {
      moveToBottom();
      return;
    }

    // Space - toggle selection
    if (input === ' ') {
      toggleSelection();
      return;
    }

    // Tab in multi-select - toggle and move
    if (key.tab && multiple) {
      toggleSelection();
      if (key.shift) {
        moveUp();
      } else {
        moveDown();
      }
      return;
    }

    // Ctrl+A - select all (multi)
    if (key.ctrl && input === 'a' && multiple) {
      selectAll();
      return;
    }

    // Ctrl+D - deselect all
    if (key.ctrl && input === 'd') {
      selectNone();
      return;
    }

    // / - start search
    if (input === '/' && searchable && !isSearching()) {
      setIsSearching(true);
      return;
    }

    // Type-ahead search (when searchable and not in search mode)
    if (searchable && input && input.length === 1 && !key.ctrl && !key.meta && !isSearching()) {
      setIsSearching(true);
      updateSearch(input);
    }
  };

  // Register input handler
  // Note: We always register and check isActive dynamically in handleInput
  // This allows isActive to be a reactive getter function
  useInput(handleInput);

  return {
    cursorIndex,
    selected,
    scrollOffset,
    searchQuery,
    isSearching,
    getFilteredItems,
    getVisibleItems,
    toggleSelection,
    selectAll,
    selectNone,
    moveUp,
    moveDown,
  };
}

/**
 * Render a select component
 */
export function renderSelect<T = any>(
  state: ReturnType<typeof createSelect<T>>,
  options: SelectOptions<T>
): VNode {
  const chars = getChars();
  const isAscii = getRenderMode() === 'ascii';

  const {
    multiple = false,
    cursorIndicator = chars.arrows.right,
    selectedIndicator = chars.radio.selected,
    checkedIndicator = chars.checkbox.checked,
    uncheckedIndicator = chars.checkbox.unchecked,
    activeColor = themeColor('info'),
    selectedColor = themeColor('success'),
    disabledColor = themeColor('textMuted'),
    showCount = true,
    searchable = false,
    searchPlaceholder = 'Type to search...',
    fullWidth = false,
  } = options;

  const { items: visibleItems, startIndex } = state.getVisibleItems();
  const filtered = state.getFilteredItems();
  const selected = state.selected();
  const cursor = state.cursorIndex();
  const isSearching = state.isSearching();
  const searchQuery = state.searchQuery();

  const rows: VNode[] = [];

  // Search input
  if (searchable && (isSearching || searchQuery)) {
    const searchIcon = isAscii ? '/' : '🔍';
    rows.push(
      Box(
        { flexDirection: 'row', marginBottom: 1 },
        Text({ color: activeColor }, `${searchIcon} `),
        searchQuery
          ? Text({ color: themeColor('text') }, searchQuery)
          : Text({ color: themeColor('textMuted'), dim: true }, searchPlaceholder),
        isSearching ? Text({ backgroundColor: themeColor('text'), color: themeColor('background') }, ' ') : Text({}, '')
      )
    );
  }

  // Track last group header
  let lastGroup: string | undefined;

  // Render visible items
  for (let i = 0; i < visibleItems.length; i++) {
    const item = visibleItems[i];
    const actualIndex = startIndex + i;
    const isActive = actualIndex === cursor;
    const isSelected = selected.includes(item.value);

    // Group header
    if (item.group && item.group !== lastGroup) {
      lastGroup = item.group;
      const hr = chars.border.horizontal.repeat(2);
      rows.push(
        Box(
          { marginTop: i > 0 ? 1 : 0, marginBottom: 0 },
          Text({ color: themeColor('warning'), bold: true }, `${hr} ${item.group} ${hr}`)
        )
      );
    }

    // Build item row
    const parts: VNode[] = [];

    // Cursor indicator
    parts.push(
      Text({ color: activeColor }, isActive ? cursorIndicator + ' ' : '  ')
    );

    // Selection indicator
    if (multiple) {
      parts.push(
        Text(
          { color: isSelected ? selectedColor : themeColor('textMuted') },
          isSelected ? checkedIndicator + ' ' : uncheckedIndicator + ' '
        )
      );
    } else if (isSelected) {
      parts.push(Text({ color: selectedColor }, selectedIndicator + ' '));
    }

    // Icon
    if (item.icon) {
      parts.push(Text({ color: item.color ?? 'white' }, item.icon + ' '));
    }

    // Label
    const labelColor = item.disabled
      ? disabledColor
      : isActive
      ? activeColor
      : isSelected
      ? selectedColor
      : item.color ?? 'white';

    parts.push(
      Text(
        {
          color: labelColor,
          bold: isActive,
          dim: item.disabled,
          strikethrough: item.disabled,
        },
        item.label
      )
    );

    // Description
    if (item.description) {
      parts.push(Text({ color: 'gray', dim: true }, ` - ${item.description}`));
    }

    rows.push(Box({ flexDirection: 'row' }, ...parts));
  }

  // Scroll indicators
  const scrollOffset = state.scrollOffset();
  const arrowUp = chars.arrows.up;
  const arrowDown = chars.arrows.down;
  if (scrollOffset > 0) {
    rows.unshift(
      Box(
        { flexDirection: 'row' },
        Text({ color: themeColor('textMuted'), dim: true }, `  ${arrowUp} more above`)
      )
    );
  }
  if (scrollOffset + visibleItems.length < filtered.length) {
    rows.push(
      Box(
        { flexDirection: 'row' },
        Text({ color: themeColor('textMuted'), dim: true }, `  ${arrowDown} more below`)
      )
    );
  }

  // Count footer
  if (showCount) {
    const countText = multiple
      ? `${selected.length} selected of ${filtered.length}`
      : `${filtered.length} items`;
    rows.push(
      Box(
        { marginTop: 1 },
        Text({ color: 'gray', dim: true }, countText)
      )
    );
  }

  return Box({ flexDirection: 'column', flexGrow: fullWidth ? 1 : 0 }, ...rows);
}

/**
 * Simple standalone Select component
 */
export function Select<T = any>(options: SelectOptions<T>): VNode {
  const state = createSelect(options);
  return renderSelect(state, options);
}

/**
 * Confirmation dialog
 */
export function Confirm(options: {
  message: string;
  defaultValue?: boolean;
  yesLabel?: string;
  noLabel?: string;
  onConfirm?: (value: boolean) => void;
  isActive?: boolean;
}): VNode {
  const {
    message,
    defaultValue = false,
    yesLabel = 'Yes',
    noLabel = 'No',
    onConfirm,
    isActive = true,
  } = options;

  const items: SelectItem<boolean>[] = [
    { value: true, label: yesLabel },
    { value: false, label: noLabel },
  ];

  return Box(
    { flexDirection: 'column' },
    Box(
      { marginBottom: 1 },
      Text({ color: themeColor('warning') }, '? '),
      Text({ color: themeColor('text'), bold: true }, message)
    ),
    Select({
      items,
      initialValue: defaultValue,
      onSubmit: (value) => onConfirm?.(value as boolean),
      isActive,
      showCount: false,
    })
  );
}

/**
 * Multi-choice checkbox list
 */
export function Checkbox<T = any>(options: Omit<SelectOptions<T>, 'multiple'>): VNode {
  return Select({ ...options, multiple: true });
}
