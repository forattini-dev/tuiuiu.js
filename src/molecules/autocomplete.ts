/**
 * Autocomplete - Text input with dropdown suggestions
 *
 * @layer Molecule
 * @description Type-ahead input with fuzzy search suggestions
 *
 * Features:
 * - Type-ahead suggestions
 * - Fuzzy matching
 * - Keyboard navigation
 * - Custom filtering
 * - Async data source support
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { createSignal, createMemo } from '../primitives/signal.js';
import { useInput } from '../hooks/index.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { getContrastColor } from '../core/theme.js';

// =============================================================================
// Types
// =============================================================================

export interface AutocompleteItem<T = string> {
  /** Unique value */
  value: T;
  /** Display label */
  label: string;
  /** Optional description */
  description?: string;
  /** Disabled state */
  disabled?: boolean;
}

export interface AutocompleteOptions<T = string> {
  /** Available items */
  items: AutocompleteItem<T>[];
  /** Initial input value */
  initialValue?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Max suggestions to show */
  maxSuggestions?: number;
  /** Min characters before showing suggestions */
  minChars?: number;
  /** Custom filter function */
  filter?: (query: string, items: AutocompleteItem<T>[]) => AutocompleteItem<T>[];
  /** Allow free text (not in items) */
  allowFreeText?: boolean;
  /** Input width */
  width?: number;
  /** Expand to fill available width */
  fullWidth?: boolean;
  /** Colors */
  activeColor?: ColorValue;
  selectedColor?: ColorValue;
  /** Callbacks */
  onChange?: (value: string) => void;
  onSelect?: (item: AutocompleteItem<T>) => void;
  onSubmit?: (value: string, item?: AutocompleteItem<T>) => void;
  /** Is active */
  isActive?: boolean;
}

export interface AutocompleteState<T = string> {
  inputValue: () => string;
  cursorPos: () => number;
  suggestions: () => AutocompleteItem<T>[];
  selectedIndex: () => number;
  isOpen: () => boolean;
  // Actions
  setInput: (value: string) => void;
  insertChar: (char: string) => void;
  deleteBack: () => void;
  deleteForward: () => void;
  moveCursorLeft: () => void;
  moveCursorRight: () => void;
  moveCursorHome: () => void;
  moveCursorEnd: () => void;
  moveUp: () => void;
  moveDown: () => void;
  selectCurrent: () => void;
  open: () => void;
  close: () => void;
  submit: () => void;
}

// =============================================================================
// Default Filter (Fuzzy Match)
// =============================================================================

function defaultFilter<T>(
  query: string,
  items: AutocompleteItem<T>[]
): AutocompleteItem<T>[] {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();

  return items
    .map((item) => {
      const label = item.label.toLowerCase();
      const desc = (item.description || '').toLowerCase();

      // Exact prefix match gets highest score
      if (label.startsWith(lowerQuery)) {
        return { item, score: 100 };
      }

      // Substring match
      if (label.includes(lowerQuery)) {
        return { item, score: 80 - label.indexOf(lowerQuery) };
      }

      // Description match
      if (desc.includes(lowerQuery)) {
        return { item, score: 50 };
      }

      // Fuzzy match: all chars must appear in order
      let queryIdx = 0;
      let score = 0;
      for (let i = 0; i < label.length && queryIdx < lowerQuery.length; i++) {
        if (label[i] === lowerQuery[queryIdx]) {
          score += 5;
          queryIdx++;
        }
      }

      if (queryIdx === lowerQuery.length) {
        return { item, score };
      }

      return { item, score: 0 };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.item);
}

// =============================================================================
// State Factory
// =============================================================================

/**
 * Create an Autocomplete state manager
 */
export function createAutocomplete<T = string>(
  options: AutocompleteOptions<T>
): AutocompleteState<T> {
  const {
    items,
    initialValue = '',
    maxSuggestions = 5,
    minChars = 1,
    filter = defaultFilter,
    onChange,
    onSelect,
    onSubmit,
  } = options;

  const [inputValue, setInputValue] = createSignal(initialValue);
  const [cursorPos, setCursorPos] = createSignal(initialValue.length);
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [isOpen, setIsOpen] = createSignal(false);

  // Filtered suggestions
  const suggestions = createMemo(() => {
    const query = inputValue();
    if (query.length < minChars) return [];

    const filtered = filter(query, items.filter((i) => !i.disabled));
    return filtered.slice(0, maxSuggestions);
  });

  const setInput = (value: string) => {
    setInputValue(value);
    setCursorPos(value.length);
    setSelectedIndex(0);
    setIsOpen(value.length >= minChars);
    onChange?.(value);
  };

  const insertChar = (char: string) => {
    const value = inputValue();
    const pos = cursorPos();
    const newValue = value.slice(0, pos) + char + value.slice(pos);
    setInputValue(newValue);
    setCursorPos(pos + char.length);
    setSelectedIndex(0);
    setIsOpen(newValue.length >= minChars);
    onChange?.(newValue);
  };

  const deleteBack = () => {
    const value = inputValue();
    const pos = cursorPos();
    if (pos === 0) return;

    const newValue = value.slice(0, pos - 1) + value.slice(pos);
    setInputValue(newValue);
    setCursorPos(pos - 1);
    setSelectedIndex(0);
    onChange?.(newValue);
  };

  const deleteForward = () => {
    const value = inputValue();
    const pos = cursorPos();
    if (pos >= value.length) return;

    const newValue = value.slice(0, pos) + value.slice(pos + 1);
    setInputValue(newValue);
    onChange?.(newValue);
  };

  const moveCursorLeft = () => {
    setCursorPos((p) => Math.max(0, p - 1));
  };

  const moveCursorRight = () => {
    setCursorPos((p) => Math.min(inputValue().length, p + 1));
  };

  const moveCursorHome = () => {
    setCursorPos(0);
  };

  const moveCursorEnd = () => {
    setCursorPos(inputValue().length);
  };

  const moveUp = () => {
    const suggs = suggestions();
    if (suggs.length === 0) return;

    setSelectedIndex((i) => (i - 1 + suggs.length) % suggs.length);
  };

  const moveDown = () => {
    const suggs = suggestions();
    if (suggs.length === 0) return;

    setSelectedIndex((i) => (i + 1) % suggs.length);
  };

  const selectCurrent = () => {
    const suggs = suggestions();
    const idx = selectedIndex();
    const item = suggs[idx];

    if (item) {
      setInputValue(item.label);
      setCursorPos(item.label.length);
      setIsOpen(false);
      onSelect?.(item);
    }
  };

  const open = () => {
    if (inputValue().length >= minChars) {
      setIsOpen(true);
    }
  };

  const close = () => {
    setIsOpen(false);
  };

  const submit = () => {
    const suggs = suggestions();
    const idx = selectedIndex();
    const item = suggs[idx];
    onSubmit?.(inputValue(), item);
    setIsOpen(false);
  };

  return {
    inputValue,
    cursorPos,
    suggestions,
    selectedIndex,
    isOpen,
    setInput,
    insertChar,
    deleteBack,
    deleteForward,
    moveCursorLeft,
    moveCursorRight,
    moveCursorHome,
    moveCursorEnd,
    moveUp,
    moveDown,
    selectCurrent,
    open,
    close,
    submit,
  };
}

// =============================================================================
// Component
// =============================================================================

export interface AutocompleteProps<T = string> extends AutocompleteOptions<T> {
  /** Pre-created state */
  state?: AutocompleteState<T>;
  /** Label */
  label?: string;
}

/**
 * Autocomplete - Text input with dropdown suggestions
 *
 * @example
 * // Basic autocomplete
 * Autocomplete({
 *   items: [
 *     { value: 'react', label: 'React' },
 *     { value: 'vue', label: 'Vue.js' },
 *     { value: 'angular', label: 'Angular' },
 *   ],
 *   placeholder: 'Search frameworks...',
 *   onSelect: (item) => console.log(item),
 * })
 *
 * @example
 * // With custom filter
 * Autocomplete({
 *   items: users,
 *   filter: (query, items) =>
 *     items.filter(i => i.label.toLowerCase().includes(query.toLowerCase())),
 *   onSubmit: (value, item) => console.log(value, item),
 * })
 */
export function Autocomplete<T = string>(props: AutocompleteProps<T>): VNode {
  const {
    placeholder = '',
    width = 30,
    fullWidth = false,
    activeColor = 'primary',
    selectedColor = 'success',
    isActive = true,
    label,
    state: externalState,
  } = props;

  const state = externalState || createAutocomplete(props);
  const isAscii = getRenderMode() === 'ascii';
  const chars = getChars();

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.upArrow) {
        state.moveUp();
      } else if (key.downArrow) {
        state.moveDown();
      } else if (key.leftArrow) {
        state.moveCursorLeft();
      } else if (key.rightArrow) {
        state.moveCursorRight();
      } else if (key.return) {
        if (state.isOpen() && state.suggestions().length > 0) {
          state.selectCurrent();
        } else {
          state.submit();
        }
      } else if (key.tab) {
        if (state.suggestions().length > 0) {
          state.selectCurrent();
        }
      } else if (key.escape) {
        state.close();
      } else if (key.backspace || key.delete) {
        if (key.backspace) {
          state.deleteBack();
        } else {
          state.deleteForward();
        }
      } else if (input === 'a' && key.ctrl) {
        state.moveCursorHome();
      } else if (input === 'e' && key.ctrl) {
        state.moveCursorEnd();
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        state.insertChar(input);
      }
    },
    { isActive }
  );

  const value = state.inputValue();
  const cursor = state.cursorPos();
  const suggs = state.suggestions();
  const selIdx = state.selectedIndex();
  const open = state.isOpen();

  // Build input display with cursor
  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  const beforeCursor = value.slice(0, cursor);
  const cursorChar = value[cursor] || ' ';
  const afterCursor = value.slice(cursor + 1);

  // Input box
  const inputBorder = isAscii ? 'single' : 'round';
  const inputNode = Box(
    {
      width: fullWidth ? undefined : width,
      flexGrow: fullWidth ? 1 : 0,
      borderStyle: inputBorder,
      borderColor: activeColor,
      paddingX: 1,
    },
    isPlaceholder
      ? Text({ color: 'mutedForeground', dim: true }, placeholder)
      : Box(
          { flexDirection: 'row' },
          Text({}, beforeCursor),
          Text({ backgroundColor: activeColor, color: getContrastColor(activeColor as string) }, cursorChar),
          Text({}, afterCursor)
        )
  );

  // Suggestions dropdown
  let suggestionsNode: VNode | null = null;
  if (open && suggs.length > 0) {
    const suggestionItems = suggs.map((item, i) => {
      const isSelected = i === selIdx;
      const prefix = isSelected ? chars.arrows.right : ' ';

      return Box(
        { flexDirection: 'row', paddingX: 1 },
        Text({ color: isSelected ? activeColor : 'mutedForeground' }, prefix + ' '),
        Text(
          { color: isSelected ? selectedColor : 'foreground', bold: isSelected },
          item.label
        ),
        item.description
          ? Text({ color: 'mutedForeground', dim: true }, ` - ${item.description}`)
          : null
      );
    });

    suggestionsNode = Box(
      {
        width: fullWidth ? undefined : width,
        flexGrow: fullWidth ? 1 : 0,
        borderStyle: 'single',
        borderColor: 'border',
        flexDirection: 'column',
      },
      ...suggestionItems
    );
  }

  // Build full component
  const parts: (VNode | null)[] = [];

  if (label) {
    parts.push(Box({ marginBottom: 1 }, Text({ color: 'mutedForeground' }, label)));
  }

  parts.push(inputNode);

  if (suggestionsNode) {
    parts.push(suggestionsNode);
  }

  return Box({ flexDirection: 'column', flexGrow: fullWidth ? 1 : 0 }, ...parts);
}

// =============================================================================
// Combobox (Autocomplete with required selection)
// =============================================================================

export interface ComboboxProps<T = string> extends AutocompleteProps<T> {
  /** Error message for invalid input */
  errorMessage?: string;
}

/**
 * Combobox - Autocomplete that requires selection from list
 */
export function Combobox<T = string>(props: ComboboxProps<T>): VNode {
  const { errorMessage = 'Please select from the list', ...rest } = props;

  // Override to not allow free text
  return Autocomplete({
    ...rest,
    allowFreeText: false,
  });
}

// =============================================================================
// TagInput (Multiple selections)
// =============================================================================

export interface TagInputOptions<T = string> {
  /** Available items */
  items: AutocompleteItem<T>[];
  /** Initially selected values */
  initialValues?: T[];
  /** Max tags allowed */
  maxTags?: number;
  /** Placeholder */
  placeholder?: string;
  /** Width */
  width?: number;
  /** Expand to fill available width */
  fullWidth?: boolean;
  /** Colors */
  tagColor?: ColorValue;
  activeColor?: ColorValue;
  /** Callbacks */
  onChange?: (values: T[]) => void;
  /** Is active */
  isActive?: boolean;
}

export interface TagInputState<T = string> {
  tags: () => T[];
  inputValue: () => string;
  suggestions: () => AutocompleteItem<T>[];
  selectedIndex: () => number;
  isOpen: () => boolean;
  // Actions
  addTag: (value: T) => void;
  removeTag: (value: T) => void;
  removeLastTag: () => void;
  setInput: (value: string) => void;
}

/**
 * Create a TagInput state manager
 */
export function createTagInput<T = string>(
  options: TagInputOptions<T>
): TagInputState<T> {
  const {
    items,
    initialValues = [],
    maxTags = Infinity,
    onChange,
  } = options;

  const [tags, setTags] = createSignal<T[]>(initialValues);
  const [inputValue, setInputValue] = createSignal('');
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [isOpen, setIsOpen] = createSignal(false);

  // Filter out already selected items
  const suggestions = createMemo(() => {
    const query = inputValue();
    const selected = tags();

    if (!query) return [];

    const available = items.filter(
      (i) => !i.disabled && !selected.includes(i.value)
    );

    return defaultFilter(query, available).slice(0, 5);
  });

  const addTag = (value: T) => {
    const current = tags();
    if (current.length >= maxTags) return;
    if (current.includes(value)) return;

    const newTags = [...current, value];
    setTags(newTags);
    setInputValue('');
    setIsOpen(false);
    onChange?.(newTags);
  };

  const removeTag = (value: T) => {
    const newTags = tags().filter((t) => t !== value);
    setTags(newTags);
    onChange?.(newTags);
  };

  const removeLastTag = () => {
    const current = tags();
    if (current.length === 0) return;

    const newTags = current.slice(0, -1);
    setTags(newTags);
    onChange?.(newTags);
  };

  const setInput = (value: string) => {
    setInputValue(value);
    setSelectedIndex(0);
    setIsOpen(value.length > 0);
  };

  return {
    tags,
    inputValue,
    suggestions,
    selectedIndex,
    isOpen,
    addTag,
    removeTag,
    removeLastTag,
    setInput,
  };
}

/**
 * TagInput - Multiple tag selection with autocomplete
 *
 * @example
 * TagInput({
 *   items: skills,
 *   placeholder: 'Add skills...',
 *   maxTags: 5,
 *   onChange: (values) => console.log(values),
 * })
 */
export function TagInput<T = string>(props: TagInputOptions<T>): VNode {
  const {
    items,
    placeholder = 'Add tag...',
    width = 40,
    fullWidth = false,
    tagColor = 'primary',
    activeColor = 'warning',
    isActive = true,
  } = props;

  const state = createTagInput(props);
  const chars = getChars();

  // Setup keyboard handling
  useInput(
    (input, key) => {
      if (key.upArrow) {
        // Not implemented for simplicity
      } else if (key.downArrow) {
        // Not implemented for simplicity
      } else if (key.backspace) {
        if (state.inputValue() === '') {
          state.removeLastTag();
        } else {
          const val = state.inputValue();
          state.setInput(val.slice(0, -1));
        }
      } else if (key.return || key.tab) {
        const suggs = state.suggestions();
        const idx = state.selectedIndex();
        const item = suggs[idx];
        if (item) {
          state.addTag(item.value);
        }
      } else if (input && input.length === 1 && !key.ctrl && !key.meta) {
        state.setInput(state.inputValue() + input);
      }
    },
    { isActive }
  );

  const currentTags = state.tags();
  const input = state.inputValue();
  const suggs = state.suggestions();

  // Build tag chips
  const tagNodes = currentTags.map((tagValue) => {
    const item = items.find((i) => i.value === tagValue);
    const label = item?.label || String(tagValue);

    return Box(
      { paddingX: 1, backgroundColor: tagColor, marginRight: 1 },
      Text({ color: 'black' }, label),
      Text({ color: 'black', dim: true }, ' x')
    );
  });

  // Input area
  const inputNode = Box(
    { flexDirection: 'row' },
    Text({ color: input ? 'foreground' : 'mutedForeground', dim: !input }, input || placeholder)
  );

  // Suggestions
  let suggestionsNode: VNode | null = null;
  if (suggs.length > 0) {
    const suggItems = suggs.map((item, i) =>
      Box(
        { paddingX: 1 },
        Text({ color: i === 0 ? activeColor : 'mutedForeground' }, item.label)
      )
    );
    suggestionsNode = Box(
      { borderStyle: 'single', borderColor: 'border', flexDirection: 'column' },
      ...suggItems
    );
  }

  return Box(
    { flexDirection: 'column', width: fullWidth ? undefined : width, flexGrow: fullWidth ? 1 : 0 },
    Box(
      {
        flexDirection: 'row',
        flexWrap: 'wrap',
        borderStyle: 'single',
        borderColor: activeColor,
        padding: 1,
        gap: 1,
        flexGrow: fullWidth ? 1 : 0,
      },
      ...tagNodes,
      inputNode
    ),
    suggestionsNode
  );
}
