/**
 * Command Palette Component
 *
 * A searchable command palette for quick navigation and actions.
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

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { stringWidth, truncateText } from '../utils/text-utils.js';
import { getTheme, getContrastColor } from '../core/theme.js';
import { createFocusTrap, getFocusZoneManager } from '../core/focus.js';
import { createSignal } from '../primitives/signal.js';
import {
  previousGraphemeBoundary,
  segmentGraphemes,
} from '../utils/grapheme.js';
import { sanitizeInlineInput } from '../utils/terminal-sanitize.js';
import { createCollectionController } from '../interaction/collection.js';
import { component } from '../app/component.js';
import {
  getInteractionRuntime,
  type InteractionRuntime,
  type InteractionSnapshot,
  type InteractionLease,
} from '../interaction/runtime.js';

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
  /** Filtered items (after search). Derived from items/query when omitted. */
  filteredItems?: CommandItem[];
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
  /** Focus zone ID (if focusTrap enabled) */
  zoneId: string | null;
  /** Activate focus trap (call when palette opens) */
  activate: () => void;
  /** Deactivate focus trap (call when palette closes) */
  deactivate: () => void;
  /** Register a focusable element in the palette's focus zone */
  registerFocusable: (elementId: string, onFocus?: (focused: boolean) => void) => () => void;
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
  const queryGraphemes = segmentGraphemes(queryLower).map(({ segment }) => segment);
  const textGraphemes = segmentGraphemes(textLower).map(({ segment }) => segment);

  // Exact match gets highest score
  if (textLower === queryLower) return 1000;

  // Starts with query gets high score
  if (textLower.startsWith(queryLower)) {
    return 500 + (queryGraphemes.length / Math.max(1, textGraphemes.length)) * 100;
  }

  // Contains query gets medium score
  if (textLower.includes(queryLower)) {
    return 200 + (queryGraphemes.length / Math.max(1, textGraphemes.length)) * 100;
  }

  // Fuzzy character match
  let queryIndex = 0;
  let score = 0;
  let consecutive = 0;

  for (let i = 0; i < textGraphemes.length && queryIndex < queryGraphemes.length; i++) {
    if (textGraphemes[i] === queryGraphemes[queryIndex]) {
      score += 10 + consecutive * 5;
      consecutive++;
      queryIndex++;
    } else {
      consecutive = 0;
    }
  }

  // All query characters must be found
  if (queryIndex < queryGraphemes.length) return -1;

  return score;
}

/**
 * Highlight matched characters in text
 */
function highlightMatches(text: string, query: string, highlightColor: string): VNode[] {
  if (!query) return [Text({}, text)];

  const queryGraphemes = segmentGraphemes(query.toLowerCase()).map(({ segment }) => segment);
  const textGraphemes = segmentGraphemes(text);
  const result: VNode[] = [];

  // Find character positions to highlight
  const matchPositions: Set<number> = new Set();
  let queryIndex = 0;

  for (let i = 0; i < textGraphemes.length && queryIndex < queryGraphemes.length; i++) {
    if (textGraphemes[i]!.segment.toLowerCase() === queryGraphemes[queryIndex]) {
      matchPositions.add(i);
      queryIndex++;
    }
  }

  // Build highlighted text
  let currentRun = '';
  let isHighlight = false;

  for (let i = 0; i < textGraphemes.length; i++) {
    const shouldHighlight = matchPositions.has(i);
    const grapheme = textGraphemes[i]!.segment;

    if (shouldHighlight !== isHighlight) {
      if (currentRun) {
        result.push(
          isHighlight
            ? Text({ color: highlightColor, bold: true }, currentRun)
            : Text({}, currentRun)
        );
      }
      currentRun = grapheme;
      isHighlight = shouldHighlight;
    } else {
      currentRun += grapheme;
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
export const CommandPalette = component<CommandPaletteProps, VNode>('CommandPalette', (props) => {
  const theme = getTheme();
  const tokens = theme.components.commandPalette;

  const {
    query,
    items,
    filteredItems: providedFilteredItems,
    selectedIndex,
    placeholder = 'Type to search...',
    title = 'Command Palette',
    maxVisible = 10,
    showCategories = true,
    showShortcuts = true,
    width = 60,
    borderStyle = 'round',
    borderColor = props.borderColor ?? tokens.border,
    highlightColor = props.highlightColor ?? tokens.highlightFg,
    selectedBg = props.selectedBg ?? tokens.itemSelectedBg,
    noResultsMessage = 'No results found',
    onItemClick,
  } = props;

  if (!Number.isInteger(width) || width < 10) {
    throw new RangeError('CommandPalette width must be an integer greater than or equal to 10');
  }
  if (!Number.isInteger(maxVisible) || maxVisible <= 0) {
    throw new RangeError('CommandPalette maxVisible must be a positive integer');
  }

  const filteredItems = providedFilteredItems ?? items
    .filter(item => !item.disabled)
    .map(item => ({
      item,
      score: Math.max(
        fuzzyMatch(query, item.label),
        item.description ? fuzzyMatch(query, item.description) * 0.5 : -1,
        item.category ? fuzzyMatch(query, item.category) * 0.3 : -1,
      ),
    }))
    .filter(({ score }) => score >= 0)
    .sort((left, right) => right.score - left.score)
    .map(({ item }) => item);

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
        Text({ color: 'primary', bold: true }, titleText),
        Text({ color: borderColor }, chars.horizontal.repeat(right)),
        Text({ color: borderColor }, chars.topRight)
      )
    );
  }

  // Search input
  const inputDisplay = query || placeholder;
  const inputColor = query ? 'foreground' : 'mutedForeground';
  const cursor = query ? '▌' : '';

  rows.push(
    Box(
      { flexDirection: 'row' },
      chars ? Text({ color: borderColor }, chars.vertical) : null,
      Text({}, ' '),
      Text({ color: 'primary' }, '❯ '),
      Text({ color: inputColor, dim: !query }, inputDisplay),
      Text({ color: 'primary' }, cursor),
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
        Text({ color: 'mutedForeground', dim: true }, '─'.repeat(innerWidth)),
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
        Text({ color: 'mutedForeground', dim: true, italic: true }, noResultsMessage),
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
            Text({ color: 'mutedForeground', dim: true, bold: true }, currentCategory.toUpperCase()),
            Text({}, ' '.repeat(Math.max(0, innerWidth - 2 - stringWidth(currentCategory)))),
            chars ? Text({ color: borderColor }, chars.vertical) : null
          )
        );
      }

      // Item row
      const icon = item.icon ? `${item.icon} ` : '';
      const shortcut = showShortcuts && item.shortcut ? item.shortcut : '';
      const labelWidth = Math.max(
        0,
        innerWidth - 4 - stringWidth(icon) - stringWidth(shortcut),
      );
      const labelText = truncateText(item.label, labelWidth, {
        truncationCharacter: '',
      });
      const padding = Math.max(0, labelWidth - stringWidth(labelText));

      rows.push(
        Box(
          {
            flexDirection: 'row',
            onClick: item.disabled ? undefined : () => onItemClick?.(item, i),
          },
          chars ? Text({ color: borderColor }, chars.vertical) : null,
          Text({ backgroundColor: isSelected ? selectedBg : undefined }, ' '),
          Text({ color: isSelected ? getContrastColor(selectedBg) : 'primary', backgroundColor: isSelected ? selectedBg : undefined }, icon),
          Box(
            {
              flexDirection: 'row',
              backgroundColor: isSelected ? selectedBg : undefined,
            },
            ...highlightMatches(labelText, query, highlightColor)
          ),
          Text({ backgroundColor: isSelected ? selectedBg : undefined }, ' '.repeat(padding)),
          Text({
            color: 'mutedForeground',
            dim: true,
            backgroundColor: isSelected ? selectedBg : undefined
          }, shortcut),
          Text({ backgroundColor: isSelected ? selectedBg : undefined }, ' '),
          chars ? Text({ color: borderColor }, chars.vertical) : null
        )
      );

      // Description if present and selected
      if (isSelected && item.description) {
        const descriptionWidth = Math.max(0, innerWidth - 4);
        const descText = truncateText(item.description, descriptionWidth, {
          truncationCharacter: '',
        });
        rows.push(
          Box(
            { flexDirection: 'row' },
            chars ? Text({ color: borderColor }, chars.vertical) : null,
            Text({}, '  '),
            Text({ color: 'mutedForeground', dim: true, italic: true }, descText),
            Text({}, ' '.repeat(Math.max(0, descriptionWidth - stringWidth(descText)))),
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
          Text({ color: 'mutedForeground', dim: true }, scrollInfo),
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
      Text({ color: 'mutedForeground', dim: true }, helpText),
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
});

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
  /** Enable focus trap when palette opens (recommended for accessibility) */
  focusTrap?: boolean;
  /** Restore focus to previous element when palette closes */
  restoreFocus?: boolean;
  /** Auto-focus first item when palette opens */
  autoFocus?: boolean;
  /** Semantic interaction mode owned while the palette is active. */
  mode?: string;
  /** Runtime used to acquire the palette mode. */
  runtime?: InteractionRuntime;
}

export interface CreateInteractionCommandPaletteOptions
  extends Omit<CreateCommandPaletteOptions, 'items'> {
  /** Runtime whose semantic command registry supplies the palette items. */
  runtime?: InteractionRuntime;
}

export interface InteractionCommandPaletteState extends CommandPaletteState {
  /** Re-read commands and bindings from the runtime immediately. */
  refresh: () => void;
  /** Stop following runtime registry changes. */
  dispose: () => void;
}

function commandItemsFromSnapshot(
  snapshot: InteractionSnapshot,
  runtime: InteractionRuntime,
): CommandItem[] {
  return snapshot.commands.map((command) => {
    const binding = snapshot.bindings.find((candidate) => candidate.command === command.id);
    const keys = binding
      ? (Array.isArray(binding.keys) ? binding.keys : [binding.keys])
      : [];
    return {
      id: command.id,
      label: command.title,
      description: command.description,
      category: command.category,
      shortcut: keys[0],
      disabled: command.enabled?.() === false,
      action: () => {
        runtime.execute(command.id, { type: 'command', source: 'command-palette' });
      },
    };
  });
}

/** Convert the canonical semantic command registry into visual palette items. */
export function commandItemsFromInteractionRuntime(
  runtime: InteractionRuntime = getInteractionRuntime(),
): CommandItem[] {
  return commandItemsFromSnapshot(runtime.inspect(), runtime);
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
  const {
    onSelect,
    onClose,
    filter = (item, query) => fuzzyMatch(query, item.label),
    focusTrap = false,
    restoreFocus = true,
    autoFocus = true,
    mode = 'command-palette',
    runtime = getInteractionRuntime(),
  } = options;

  let items = [...options.items];
  const [querySignal, setQuery] = createSignal('');
  const [selectedIndexSignal, setSelectedIndex] = createSignal(0);
  const [filteredItemsSignal, setFilteredItems] = createSignal<CommandItem[]>([]);
  const enabledItems = () => items.filter((item) => !item.disabled);
  const collection = createCollectionController<CommandItem, string>({
    items: enabledItems(),
    getKey: (item) => item.id,
    loop: true,
    viewportSize: options.props?.maxVisible ?? Number.MAX_SAFE_INTEGER,
    filter: (item, query) => Math.max(
      filter(item, query),
      item.description ? filter({ ...item, label: item.description }, query) * 0.5 : -1,
      item.category ? filter({ ...item, label: item.category }, query) * 0.3 : -1,
    ),
  });

  const syncCollection = () => {
    const snapshot = collection.snapshot();
    setFilteredItems([...snapshot.items]);
    setSelectedIndex(Math.max(0, snapshot.activeIndex));
  };

  collection.subscribe(syncCollection);
  syncCollection();

  // Focus trap zone
  let focusZone: ReturnType<typeof createFocusTrap> | null = null;
  let zoneId: string | null = null;
  let interactionLease: InteractionLease | null = null;

  if (focusTrap) {
    focusZone = createFocusTrap({ restoreFocus, autoFocus });
    zoneId = focusZone.zoneId;
  }

  const updateFiltered = () => {
    collection.setQuery(querySignal());
  };

  return {
    query: querySignal,
    filteredItems: filteredItemsSignal,
    selectedIndex: selectedIndexSignal,

    get zoneId() {
      return zoneId;
    },

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
      const inlineInput = sanitizeInlineInput(char);
      if (!inlineInput) return;
      setQuery(q => q + inlineInput);
      updateFiltered();
    },

    backspace: () => {
      setQuery(q => q.slice(0, previousGraphemeBoundary(q, q.length)));
      updateFiltered();
    },

    clear: () => {
      setQuery('');
      updateFiltered();
    },

    selectPrev: () => {
      collection.move(-1);
    },

    selectNext: () => {
      collection.move(1);
    },

    selectIndex: (index: number) => {
      const item = filteredItemsSignal()[index];
      if (item) collection.setActive(item.id, 'programmatic');
    },

    confirm: () => {
      const selected = collection.activate();
      if (selected) {
        selected.action?.();
        onSelect?.(selected);
      }
    },

    close: () => {
      if (focusZone) {
        focusZone.deactivate();
      }
      interactionLease?.dispose();
      interactionLease = null;
      onClose?.();
    },

    getSelected: () => filteredItemsSignal()[selectedIndexSignal()],

    setItems: (newItems: CommandItem[]) => {
      items = [...newItems];
      collection.reconcile(enabledItems());
    },

    activate: () => {
      interactionLease?.dispose();
      interactionLease = runtime.enter({ mode, exclusive: true });
      if (focusZone) {
        focusZone.activate();
      }
    },

    deactivate: () => {
      if (focusZone) {
        focusZone.deactivate();
      }
      interactionLease?.dispose();
      interactionLease = null;
    },

    registerFocusable: (elementId: string, onFocus?: (focused: boolean) => void) => {
      if (!zoneId) {
        return () => {};
      }
      const manager = getFocusZoneManager();
      manager.registerElement(elementId, zoneId, { onFocus });
      return () => manager.unregisterElement(elementId, zoneId!);
    },
  };
}

/**
 * Create a command palette backed directly by the InteractionRuntime registry.
 * Registrations, updates, bindings, enabled state, and removals stay in sync.
 */
export function createInteractionCommandPalette(
  options: CreateInteractionCommandPaletteOptions = {},
): InteractionCommandPaletteState {
  const { runtime = getInteractionRuntime(), ...paletteOptions } = options;
  const palette = createCommandPalette({
    ...paletteOptions,
    items: commandItemsFromInteractionRuntime(runtime),
  });
  const refresh = () => palette.setItems(commandItemsFromInteractionRuntime(runtime));
  const unsubscribe = runtime.subscribe(refresh);

  return Object.assign(palette, {
    refresh,
    dispose: unsubscribe,
  });
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
 * GoTo Dialog - Simple number input dialog for jumping to slides
 */
export function GoToDialog(props: GoToDialogProps): VNode {
  const {
    value,
    max,
    title = 'Go To',
    prompt = 'Enter number:',
    width = 30,
    borderStyle = 'round',
    borderColor = 'primary',
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
        Text({ color: 'primary', bold: true }, titleText),
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
      Text({ color: 'foreground' }, prompt),
      Text({}, ' '),
      Text({ color: 'primary', bold: true }, display),
      Text({}, ' '),
      Text({ color: 'mutedForeground', dim: true }, rangeText),
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
      Text({ color: 'mutedForeground', dim: true }, helpText),
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
