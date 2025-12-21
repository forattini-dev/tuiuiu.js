/**
 * Command Palette Component - Kyma-inspired quick navigation
 *
 * A searchable command palette for quick navigation and actions.
 * Inspired by VS Code's Command Palette and Kyma's command/goto dialogs.
 *
 * Features:
 * - Fuzzy search
 * - Keyboard navigation
 * - Categorized items
 * - Keyboard shortcuts display
 * - Focus trap
 *
 * @example
 * ```typescript
 * import { CommandPalette, createCommandPalette } from 'tuiuiu.js';
 *
 * const palette = createCommandPalette({
 *   items: [
 *     { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', action: () => save() },
 *     { id: 'open', label: 'Open File', shortcut: 'Ctrl+O', category: 'File' },
 *   ],
 *   onSelect: (item) => item.action?.(),
 *   onClose: () => setShowPalette(false),
 * });
 *
 * // In your component
 * When(showPalette(),
 *   CommandPalette({
 *     ...palette.props,
 *     query: palette.query(),
 *     selectedIndex: palette.selectedIndex(),
 *   })
 * )
 *
 * // Handle input
 * useInput((input, key) => {
 *   if (key.upArrow) palette.selectPrev();
 *   if (key.downArrow) palette.selectNext();
 *   if (key.return) palette.confirm();
 *   if (key.escape) palette.close();
 *   if (key.backspace) palette.backspace();
 *   if (input && !key.ctrl) palette.type(input);
 * });
 * ```
 */

import { Box, Text } from '../../components/components.js';
import type { VNode } from '../../utils/types.js';
import { stringWidth } from '../../utils/text-utils.js';

// =============================================================================
// Types
// =============================================================================

export interface CommandItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Optional category for grouping */
  category?: string;
  /** Optional keyboard shortcut display */
  shortcut?: string;
  /** Optional icon (single character) */
  icon?: string;
  /** Optional action to execute */
  action?: () => void;
  /** Optional metadata */
  meta?: Record<string, unknown>;
  /** Whether item is disabled */
  disabled?: boolean;
}

export interface CommandPaletteProps {
  /** Search query */
  query: string;
  /** Available items */
  items: CommandItem[];
  /** Filtered items (after search) */
  filteredItems: CommandItem[];
  /** Currently selected index */
  selectedIndex: number;
  /** Placeholder text */
  placeholder?: string;
  /** Title */
  title?: string;
  /** Maximum visible items */
  maxVisible?: number;
  /** Show categories */
  showCategories?: boolean;
  /** Show shortcuts */
  showShortcuts?: boolean;
  /** Width of the palette */
  width?: number;
  /** Border style */
  borderStyle?: 'single' | 'double' | 'round' | 'heavy' | 'none';
  /** Border color */
  borderColor?: string;
  /** Highlight color for matches */
  highlightColor?: string;
  /** Selected item background */
  selectedBg?: string;
  /** No results message */
  noResultsMessage?: string;
  /** Callback for item click */
  onItemClick?: (item: CommandItem, index: number) => void;
}

export interface CommandPaletteState {
  /** Current query */
  query: () => string;
  /** Filtered items */
  filteredItems: () => CommandItem[];
  /** Selected index */
  selectedIndex: () => number;
  /** Props for rendering */
  props: Omit<CommandPaletteProps, 'query' | 'filteredItems' | 'selectedIndex'>;
  /** Type a character */
  type: (char: string) => void;
  /** Delete last character */
  backspace: () => void;
  /** Clear query */
  clear: () => void;
  /** Select previous item */
  selectPrev: () => void;
  /** Select next item */
  selectNext: () => void;
  /** Select item by index */
  selectIndex: (index: number) => void;
  /** Confirm selection */
  confirm: () => void;
  /** Close palette */
  close: () => void;
  /** Get selected item */
  getSelected: () => CommandItem | undefined;
  /** Set items dynamically */
  setItems: (items: CommandItem[]) => void;
}

// =============================================================================
// Fuzzy Search
// =============================================================================

/**
 * Simple fuzzy match - returns score (higher = better match) or -1 for no match
 */
function fuzzyMatch(query: string, text: string): number {
  if (!query) return 0;

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();

  // Exact match gets highest score
  if (textLower === queryLower) return 1000;

  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) return 500 + (queryLower.length / textLower.length) * 100;

  // Contains query gets medium score
  if (textLower.includes(queryLower)) return 200 + (queryLower.length / textLower.length) * 100;

  // Fuzzy character match
  let queryIndex = 0;
  let score = 0;
  let consecutive = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      score += 10 + consecutive * 5;
      consecutive++;
      queryIndex++;
    } else {
      consecutive = 0;
    }
  }

  // All query characters must be found
  if (queryIndex < queryLower.length) return -1;

  return score;
}

/**
 * Highlight matched characters in text
 */
function highlightMatches(text: string, query: string, highlightColor: string): VNode[] {
  if (!query) return [Text({}, text)];

  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  const result: VNode[] = [];
  let lastIndex = 0;

  // Find character positions to highlight
  const matchPositions: Set<number> = new Set();
  let queryIndex = 0;

  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      matchPositions.add(i);
      queryIndex++;
    }
  }

  // Build highlighted text
  let currentRun = '';
  let isHighlight = false;

  for (let i = 0; i < text.length; i++) {
    const shouldHighlight = matchPositions.has(i);

    if (shouldHighlight !== isHighlight) {
      if (currentRun) {
        result.push(
          isHighlight
            ? Text({ color: highlightColor, bold: true }, currentRun)
            : Text({}, currentRun)
        );
      }
      currentRun = text[i];
      isHighlight = shouldHighlight;
    } else {
      currentRun += text[i];
    }
  }

  if (currentRun) {
    result.push(
      isHighlight
        ? Text({ color: highlightColor, bold: true }, currentRun)
        : Text({}, currentRun)
    );
  }

  return result;
}

// =============================================================================
// Border Characters
// =============================================================================

const BORDER_CHARS = {
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
  },
  round: {
    topLeft: '╭',
    topRight: '╮',
    bottomLeft: '╰',
    bottomRight: '╯',
    horizontal: '─',
    vertical: '│',
  },
  heavy: {
    topLeft: '┏',
    topRight: '┓',
    bottomLeft: '┗',
    bottomRight: '┛',
    horizontal: '━',
    vertical: '┃',
  },
  none: null,
};

// =============================================================================
// Component
// =============================================================================

/**
 * CommandPalette Component
 *
 * Renders a searchable command palette overlay.
 */
export function CommandPalette(props: CommandPaletteProps): VNode {
  const {
    query,
    items,
    filteredItems,
    selectedIndex,
    placeholder = 'Type to search...',
    title = 'Command Palette',
    maxVisible = 10,
    showCategories = true,
    showShortcuts = true,
    width = 60,
    borderStyle = 'round',
    borderColor = 'cyan',
    highlightColor = 'yellow',
    selectedBg = 'blue',
    noResultsMessage = 'No results found',
    onItemClick,
  } = props;

  const chars = borderStyle !== 'none' ? BORDER_CHARS[borderStyle] : null;
  const innerWidth = width - 2;

  const rows: VNode[] = [];

  // Top border with title
  if (chars) {
    const titleText = ` ${title} `;
    const titleLen = stringWidth(titleText);
    const remaining = innerWidth - titleLen;
    const left = Math.floor(remaining / 2);
    const right = remaining - left;

    rows.push(
      Box(
        { flexDirection: 'row' },
        Text({ color: borderColor }, chars.topLeft),
        Text({ color: borderColor }, chars.horizontal.repeat(left)),
        Text({ color: 'cyan', bold: true }, titleText),
        Text({ color: borderColor }, chars.horizontal.repeat(right)),
        Text({ color: borderColor }, chars.topRight)
      )
    );
  }

  // Search input
  const inputDisplay = query || placeholder;
  const inputColor = query ? 'white' : 'gray';
  const cursor = query ? '▌' : '';

  rows.push(
    Box(
      { flexDirection: 'row' },
      chars ? Text({ color: borderColor }, chars.vertical) : null,
      Text({}, ' '),
      Text({ color: 'cyan' }, '❯ '),
      Text({ color: inputColor, dim: !query }, inputDisplay),
      Text({ color: 'cyan' }, cursor),
      Text({}, ' '.repeat(Math.max(0, innerWidth - 4 - stringWidth(inputDisplay) - 1))),
      chars ? Text({ color: borderColor }, chars.vertical) : null
    )
  );

  // Separator
  if (chars) {
    rows.push(
      Box(
        { flexDirection: 'row' },
        Text({ color: borderColor }, chars.vertical),
        Text({ color: 'gray', dim: true }, '─'.repeat(innerWidth)),
        Text({ color: borderColor }, chars.vertical)
      )
    );
  }

  // Items or no results
  if (filteredItems.length === 0) {
    rows.push(
      Box(
        { flexDirection: 'row' },
        chars ? Text({ color: borderColor }, chars.vertical) : null,
        Text({}, ' '),
        Text({ color: 'gray', dim: true, italic: true }, noResultsMessage),
        Text({}, ' '.repeat(Math.max(0, innerWidth - 2 - stringWidth(noResultsMessage)))),
        chars ? Text({ color: borderColor }, chars.vertical) : null
      )
    );
  } else {
    // Calculate visible range (scroll if needed)
    const visibleCount = Math.min(maxVisible, filteredItems.length);
    let startIndex = 0;

    if (selectedIndex >= visibleCount) {
      startIndex = selectedIndex - visibleCount + 1;
    }

    // Group by category if enabled
    let currentCategory = '';

    for (let i = startIndex; i < startIndex + visibleCount && i < filteredItems.length; i++) {
      const item = filteredItems[i]!;
      const isSelected = i === selectedIndex;

      // Category header
      if (showCategories && item.category && item.category !== currentCategory) {
        currentCategory = item.category;
        rows.push(
          Box(
            { flexDirection: 'row' },
            chars ? Text({ color: borderColor }, chars.vertical) : null,
            Text({}, ' '),
            Text({ color: 'gray', dim: true, bold: true }, currentCategory.toUpperCase()),
            Text({}, ' '.repeat(Math.max(0, innerWidth - 2 - stringWidth(currentCategory)))),
            chars ? Text({ color: borderColor }, chars.vertical) : null
          )
        );
      }

      // Item row
      const icon = item.icon ? `${item.icon} ` : '';
      const shortcut = showShortcuts && item.shortcut ? item.shortcut : '';
      const labelWidth = innerWidth - 4 - stringWidth(icon) - stringWidth(shortcut);

      const labelNodes = highlightMatches(item.label, query, highlightColor);
      const labelText = item.label.slice(0, labelWidth);
      const padding = Math.max(0, labelWidth - stringWidth(item.label));

      rows.push(
        Box(
          {
            flexDirection: 'row',
            onClick: item.disabled ? undefined : () => onItemClick?.(item, i),
          },
          chars ? Text({ color: borderColor }, chars.vertical) : null,
          Text({ backgroundColor: isSelected ? selectedBg : undefined }, ' '),
          Text({ color: isSelected ? 'white' : 'cyan' }, icon),
          Box(
            {
              flexDirection: 'row',
              backgroundColor: isSelected ? selectedBg : undefined,
            },
            ...highlightMatches(labelText, query, highlightColor)
          ),
          Text({ backgroundColor: isSelected ? selectedBg : undefined }, ' '.repeat(padding)),
          Text({
            color: 'gray',
            dim: true,
            backgroundColor: isSelected ? selectedBg : undefined
          }, shortcut),
          Text({ backgroundColor: isSelected ? selectedBg : undefined }, ' '),
          chars ? Text({ color: borderColor }, chars.vertical) : null
        )
      );

      // Description if present and selected
      if (isSelected && item.description) {
        const descText = item.description.slice(0, innerWidth - 4);
        rows.push(
          Box(
            { flexDirection: 'row' },
            chars ? Text({ color: borderColor }, chars.vertical) : null,
            Text({}, '  '),
            Text({ color: 'gray', dim: true, italic: true }, descText),
            Text({}, ' '.repeat(Math.max(0, innerWidth - 4 - stringWidth(descText)))),
            chars ? Text({ color: borderColor }, chars.vertical) : null
          )
        );
      }
    }

    // Scroll indicator
    if (filteredItems.length > visibleCount) {
      const scrollInfo = `${selectedIndex + 1}/${filteredItems.length}`;
      rows.push(
        Box(
          { flexDirection: 'row' },
          chars ? Text({ color: borderColor }, chars.vertical) : null,
          Text({}, ' '.repeat(innerWidth - stringWidth(scrollInfo) - 1)),
          Text({ color: 'gray', dim: true }, scrollInfo),
          Text({}, ' '),
          chars ? Text({ color: borderColor }, chars.vertical) : null
        )
      );
    }
  }

  // Help hint
  const helpText = '↑↓ navigate  ⏎ select  esc close';
  rows.push(
    Box(
      { flexDirection: 'row' },
      chars ? Text({ color: borderColor }, chars.vertical) : null,
      Text({}, ' '),
      Text({ color: 'gray', dim: true }, helpText),
      Text({}, ' '.repeat(Math.max(0, innerWidth - 2 - stringWidth(helpText)))),
      chars ? Text({ color: borderColor }, chars.vertical) : null
    )
  );

  // Bottom border
  if (chars) {
    rows.push(
      Text(
        { color: borderColor },
        chars.bottomLeft + chars.horizontal.repeat(innerWidth) + chars.bottomRight
      )
    );
  }

  return Box({ flexDirection: 'column' }, ...rows);
}

// =============================================================================
// State Manager
// =============================================================================

export interface CreateCommandPaletteOptions {
  /** Available items */
  items: CommandItem[];
  /** Callback when item is selected */
  onSelect?: (item: CommandItem) => void;
  /** Callback when palette is closed */
  onClose?: () => void;
  /** Custom filter function */
  filter?: (item: CommandItem, query: string) => number;
  /** Palette props */
  props?: Partial<Omit<CommandPaletteProps, 'query' | 'items' | 'filteredItems' | 'selectedIndex'>>;
}

/**
 * Create command palette state manager
 *
 * @example
 * ```typescript
 * const palette = createCommandPalette({
 *   items: [
 *     { id: 'save', label: 'Save', shortcut: 'Ctrl+S' },
 *     { id: 'open', label: 'Open', shortcut: 'Ctrl+O' },
 *   ],
 *   onSelect: (item) => console.log('Selected:', item.label),
 * });
 *
 * // Use in render
 * CommandPalette({
 *   ...palette.props,
 *   query: palette.query(),
 *   filteredItems: palette.filteredItems(),
 *   selectedIndex: palette.selectedIndex(),
 * })
 * ```
 */
export function createCommandPalette(options: CreateCommandPaletteOptions): CommandPaletteState {
  const { onSelect, onClose, filter = (item, query) => fuzzyMatch(query, item.label) } = options;

  let items = [...options.items];
  let query = '';
  let selectedIndex = 0;
  let filteredItems: CommandItem[] = items;

  const updateFiltered = () => {
    if (!query) {
      filteredItems = items.filter(i => !i.disabled);
    } else {
      filteredItems = items
        .filter(i => !i.disabled)
        .map(item => ({
          item,
          score: Math.max(
            filter(item, query),
            item.description ? filter({ ...item, label: item.description }, query) * 0.5 : -1,
            item.category ? filter({ ...item, label: item.category }, query) * 0.3 : -1
          ),
        }))
        .filter(({ score }) => score >= 0)
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);
    }

    // Reset selection if out of bounds
    if (selectedIndex >= filteredItems.length) {
      selectedIndex = Math.max(0, filteredItems.length - 1);
    }
  };

  updateFiltered();

  return {
    query: () => query,
    filteredItems: () => filteredItems,
    selectedIndex: () => selectedIndex,

    props: {
      items,
      placeholder: options.props?.placeholder,
      title: options.props?.title,
      maxVisible: options.props?.maxVisible,
      showCategories: options.props?.showCategories,
      showShortcuts: options.props?.showShortcuts,
      width: options.props?.width,
      borderStyle: options.props?.borderStyle,
      borderColor: options.props?.borderColor,
      highlightColor: options.props?.highlightColor,
      selectedBg: options.props?.selectedBg,
      noResultsMessage: options.props?.noResultsMessage,
    },

    type: (char: string) => {
      query += char;
      updateFiltered();
    },

    backspace: () => {
      query = query.slice(0, -1);
      updateFiltered();
    },

    clear: () => {
      query = '';
      updateFiltered();
    },

    selectPrev: () => {
      if (filteredItems.length > 0) {
        selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : filteredItems.length - 1;
      }
    },

    selectNext: () => {
      if (filteredItems.length > 0) {
        selectedIndex = selectedIndex < filteredItems.length - 1 ? selectedIndex + 1 : 0;
      }
    },

    selectIndex: (index: number) => {
      if (index >= 0 && index < filteredItems.length) {
        selectedIndex = index;
      }
    },

    confirm: () => {
      const selected = filteredItems[selectedIndex];
      if (selected) {
        selected.action?.();
        onSelect?.(selected);
      }
    },

    close: () => {
      onClose?.();
    },

    getSelected: () => filteredItems[selectedIndex],

    setItems: (newItems: CommandItem[]) => {
      items = [...newItems];
      updateFiltered();
    },
  };
}

// =============================================================================
// GoTo Dialog (Simpler version for numeric input)
// =============================================================================

export interface GoToDialogProps {
  /** Current input value */
  value: string;
  /** Maximum allowed value */
  max: number;
  /** Title */
  title?: string;
  /** Prompt text */
  prompt?: string;
  /** Width */
  width?: number;
  /** Border style */
  borderStyle?: 'single' | 'double' | 'round' | 'heavy' | 'none';
  /** Border color */
  borderColor?: string;
}

/**
 * GoTo Dialog - Simple number input dialog
 * Inspired by Kyma's goto dialog for jumping to slides
 */
export function GoToDialog(props: GoToDialogProps): VNode {
  const {
    value,
    max,
    title = 'Go To',
    prompt = 'Enter number:',
    width = 30,
    borderStyle = 'round',
    borderColor = 'cyan',
  } = props;

  const chars = borderStyle !== 'none' ? BORDER_CHARS[borderStyle] : null;
  const innerWidth = width - 2;

  const rows: VNode[] = [];

  // Top border with title
  if (chars) {
    const titleText = ` ${title} `;
    const titleLen = stringWidth(titleText);
    const remaining = innerWidth - titleLen;
    const left = Math.floor(remaining / 2);
    const right = remaining - left;

    rows.push(
      Box(
        { flexDirection: 'row' },
        Text({ color: borderColor }, chars.topLeft),
        Text({ color: borderColor }, chars.horizontal.repeat(left)),
        Text({ color: 'cyan', bold: true }, titleText),
        Text({ color: borderColor }, chars.horizontal.repeat(right)),
        Text({ color: borderColor }, chars.topRight)
      )
    );
  }

  // Prompt and input
  const display = value || '_';
  const rangeText = `(1-${max})`;
  const inputLine = `${prompt} ${display}`;

  rows.push(
    Box(
      { flexDirection: 'row' },
      chars ? Text({ color: borderColor }, chars.vertical) : null,
      Text({}, ' '),
      Text({ color: 'white' }, prompt),
      Text({}, ' '),
      Text({ color: 'cyan', bold: true }, display),
      Text({}, ' '),
      Text({ color: 'gray', dim: true }, rangeText),
      Text({}, ' '.repeat(Math.max(0, innerWidth - 2 - stringWidth(inputLine) - stringWidth(rangeText) - 1))),
      chars ? Text({ color: borderColor }, chars.vertical) : null
    )
  );

  // Help
  const helpText = '⏎ confirm  esc cancel';
  rows.push(
    Box(
      { flexDirection: 'row' },
      chars ? Text({ color: borderColor }, chars.vertical) : null,
      Text({}, ' '),
      Text({ color: 'gray', dim: true }, helpText),
      Text({}, ' '.repeat(Math.max(0, innerWidth - 2 - stringWidth(helpText)))),
      chars ? Text({ color: borderColor }, chars.vertical) : null
    )
  );

  // Bottom border
  if (chars) {
    rows.push(
      Text(
        { color: borderColor },
        chars.bottomLeft + chars.horizontal.repeat(innerWidth) + chars.bottomRight
      )
    );
  }

  return Box({ flexDirection: 'column' }, ...rows);
}

/**
 * Create GoTo dialog state
 */
export function createGoToDialog(options: {
  max: number;
  onConfirm?: (value: number) => void;
  onClose?: () => void;
  props?: Partial<Omit<GoToDialogProps, 'value' | 'max'>>;
}) {
  let value = '';

  return {
    value: () => value,
    props: {
      max: options.max,
      ...options.props,
    },

    type: (char: string) => {
      if (/^\d$/.test(char)) {
        const newValue = value + char;
        const num = parseInt(newValue, 10);
        if (num <= options.max) {
          value = newValue;
        }
      }
    },

    backspace: () => {
      value = value.slice(0, -1);
    },

    clear: () => {
      value = '';
    },

    confirm: () => {
      const num = parseInt(value, 10);
      if (!isNaN(num) && num >= 1 && num <= options.max) {
        options.onConfirm?.(num);
      }
    },

    close: () => {
      options.onClose?.();
    },

    getValue: () => {
      const num = parseInt(value, 10);
      return isNaN(num) ? null : num;
    },
  };
}
