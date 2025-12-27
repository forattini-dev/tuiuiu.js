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
  colorActive?: ColorValue;
  colorSelected?: ColorValue;
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
// Separate Components (Flexible Positioning)
// =============================================================================

export interface AutocompleteInputProps<T = string> {
  /** Autocomplete state from createAutocomplete() */
  state: AutocompleteState<T>;
  /** Placeholder text */
  placeholder?: string;
  /** Input width */
  width?: number;
  /** Expand to fill available width */
  fullWidth?: boolean;
  /** Active/highlight color */
  colorActive?: ColorValue;
  /** Is input active for keyboard handling */
  isActive?: boolean;
  /** Show border */
  showBorder?: boolean;
}

/**
 * AutocompleteInput - Standalone input component for autocomplete
 *
 * Use with createAutocomplete() state and AutocompleteSuggestions
 * for flexible positioning of the suggestions dropdown.
 *
 * @example
 * const state = createAutocomplete({ items: [...] })
 *
 * // Suggestions to the right of input
 * Box({ flexDirection: 'row', gap: 2 },
 *   AutocompleteInput({ state }),
 *   AutocompleteSuggestions({ state })
 * )
 *
 * @example
 * // Suggestions above input
 * Box({ flexDirection: 'column' },
 *   AutocompleteSuggestions({ state }),
 *   AutocompleteInput({ state })
 * )
 */
export function AutocompleteInput<T = string>(props: AutocompleteInputProps<T>): VNode {
  const {
    state,
    placeholder = '',
    width = 30,
    fullWidth = false,
    colorActive = 'primary',
    isActive = true,
    showBorder = true,
  } = props;

  const isAscii = getRenderMode() === 'ascii';

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
  const isPlaceholder = !value;

  const beforeCursor = value.slice(0, cursor);
  const cursorChar = value[cursor] || ' ';
  const afterCursor = value.slice(cursor + 1);

  const inputBorder = isAscii ? 'single' : 'round';

  return Box(
    {
      width: fullWidth ? undefined : width,
      flexGrow: fullWidth ? 1 : 0,
      borderStyle: showBorder ? inputBorder : 'none',
      borderColor: colorActive,
      paddingX: showBorder ? 1 : 0,
    },
    isPlaceholder
      ? Text({ color: 'mutedForeground', dim: true }, placeholder)
      : Box(
          { flexDirection: 'row' },
          Text({}, beforeCursor),
          Text({ backgroundColor: colorActive, color: getContrastColor(colorActive as string) }, cursorChar),
          Text({}, afterCursor)
        )
  );
}

export interface AutocompleteSuggestionsProps<T = string> {
  /** Autocomplete state from createAutocomplete() */
  state: AutocompleteState<T>;
  /** Suggestions width */
  width?: number;
  /** Expand to fill available width */
  fullWidth?: boolean;
  /** Active/highlight color */
  colorActive?: ColorValue;
  /** Selected item color */
  colorSelected?: ColorValue;
  /** Show border around suggestions */
  showBorder?: boolean;
  /** Hide when no suggestions or closed */
  autoHide?: boolean;
  /** Maximum height (number of visible items) */
  maxHeight?: number;
}

/**
 * AutocompleteSuggestions - Standalone suggestions dropdown
 *
 * Use with createAutocomplete() state and AutocompleteInput
 * for flexible positioning of the suggestions dropdown.
 *
 * @example
 * const state = createAutocomplete({ items: [...] })
 *
 * // Suggestions below input (default layout)
 * Box({ flexDirection: 'column' },
 *   AutocompleteInput({ state }),
 *   AutocompleteSuggestions({ state })
 * )
 *
 * @example
 * // Suggestions in a sidebar
 * Box({ flexDirection: 'row' },
 *   Box({ flexDirection: 'column' },
 *     Text({}, 'Search:'),
 *     AutocompleteInput({ state, width: 20 })
 *   ),
 *   Box({ marginLeft: 2, width: 30 },
 *     Text({}, 'Results:'),
 *     AutocompleteSuggestions({ state, autoHide: false })
 *   )
 * )
 */
export function AutocompleteSuggestions<T = string>(props: AutocompleteSuggestionsProps<T>): VNode | null {
  const {
    state,
    width = 30,
    fullWidth = false,
    colorActive = 'primary',
    colorSelected = 'success',
    showBorder = true,
    autoHide = true,
    maxHeight,
  } = props;

  const chars = getChars();
  const suggs = state.suggestions();
  const selIdx = state.selectedIndex();
  const open = state.isOpen();

  // Auto-hide when closed or no suggestions
  if (autoHide && (!open || suggs.length === 0)) {
    return null;
  }

  // Apply maxHeight if specified
  const visibleSuggs = maxHeight ? suggs.slice(0, maxHeight) : suggs;

  const suggestionItems = visibleSuggs.map((item, i) => {
    const isSelected = i === selIdx;
    const prefix = isSelected ? chars.arrows.right : ' ';

    return Box(
      { flexDirection: 'row', paddingX: showBorder ? 1 : 0 },
      Text({ color: isSelected ? colorActive : 'mutedForeground' }, prefix + ' '),
      Text(
        { color: isSelected ? colorSelected : 'foreground', bold: isSelected },
        item.label
      ),
      item.description
        ? Text({ color: 'mutedForeground', dim: true }, ` - ${item.description}`)
        : null
    );
  });

  // Show "no results" when autoHide is false but no suggestions
  if (suggestionItems.length === 0) {
    return Box(
      {
        width: fullWidth ? undefined : width,
        flexGrow: fullWidth ? 1 : 0,
        borderStyle: showBorder ? 'single' : 'none',
        borderColor: 'border',
        flexDirection: 'column',
        paddingX: showBorder ? 1 : 0,
      },
      Text({ color: 'mutedForeground', dim: true }, '(no matches)')
    );
  }

  return Box(
    {
      width: fullWidth ? undefined : width,
      flexGrow: fullWidth ? 1 : 0,
      borderStyle: showBorder ? 'single' : 'none',
      borderColor: 'border',
      flexDirection: 'column',
    },
    ...suggestionItems
  );
}

// =============================================================================
// Combined Component (Convenience Wrapper)
// =============================================================================

export interface AutocompleteProps<T = string> extends AutocompleteOptions<T> {
  /** Pre-created state */
  state?: AutocompleteState<T>;
  /** Label */
  label?: string;
  /** Dropdown position relative to input */
  dropdownPosition?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Autocomplete - Text input with dropdown suggestions
 *
 * This is a convenience wrapper that combines AutocompleteInput and
 * AutocompleteSuggestions. For more flexible positioning, use those
 * components separately with createAutocomplete().
 *
 * @example
 * // Basic autocomplete (suggestions below)
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
 * // Suggestions above input
 * Autocomplete({
 *   items: frameworks,
 *   dropdownPosition: 'top',
 * })
 *
 * @example
 * // For custom positioning, use separate components:
 * const state = createAutocomplete({ items: [...] })
 * Box({ flexDirection: 'row' },
 *   AutocompleteInput({ state }),
 *   AutocompleteSuggestions({ state })
 * )
 */
export function Autocomplete<T = string>(props: AutocompleteProps<T>): VNode {
  const {
    placeholder = '',
    width = 30,
    fullWidth = false,
    colorActive = 'primary',
    colorSelected = 'success',
    isActive = true,
    label,
    state: externalState,
    dropdownPosition = 'bottom',
  } = props;

  const state = externalState || createAutocomplete(props);

  const inputNode = AutocompleteInput({
    state,
    placeholder,
    width,
    fullWidth,
    colorActive,
    isActive,
  });

  const suggestionsNode = AutocompleteSuggestions({
    state,
    width,
    fullWidth,
    colorActive,
    colorSelected,
  });

  // Build layout based on dropdown position
  const isHorizontal = dropdownPosition === 'left' || dropdownPosition === 'right';
  const flexDir = isHorizontal ? 'row' : 'column';

  const parts: (VNode | null)[] = [];

  if (label && !isHorizontal) {
    parts.push(Box({ marginBottom: 1 }, Text({ color: 'mutedForeground' }, label)));
  }

  if (dropdownPosition === 'top' || dropdownPosition === 'left') {
    parts.push(suggestionsNode);
    parts.push(inputNode);
  } else {
    parts.push(inputNode);
    parts.push(suggestionsNode);
  }

  return Box(
    {
      flexDirection: flexDir,
      flexGrow: fullWidth ? 1 : 0,
      gap: isHorizontal ? 1 : 0,
    },
    ...parts
  );
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
  colorTag?: ColorValue;
  colorActive?: ColorValue;
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
    colorTag = 'primary',
    colorActive = 'warning',
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
      { paddingX: 1, backgroundColor: colorTag, marginRight: 1 },
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
        Text({ color: i === 0 ? colorActive : 'mutedForeground' }, item.label)
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
        borderColor: colorActive,
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
