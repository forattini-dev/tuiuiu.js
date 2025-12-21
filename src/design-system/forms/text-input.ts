/**
 * TextInput - Advanced text input component
 *
 * Features:
 * - Full cursor navigation (arrows, Ctrl+arrows, Home/End)
 * - Word-based deletion (Ctrl+Backspace, Ctrl+Delete)
 * - Line operations (Ctrl+K, Ctrl+U)
 * - Input history (Up/Down arrows)
 * - Multi-line support (Shift+Enter)
 * - Visual cursor with customizable style
 * - Placeholder text
 * - Password mode (masked input)
 */

import { Box, Text } from '../../components/components.js';
import type { VNode } from '../../utils/types.js';
import { createSignal, createEffect } from '../../primitives/signal.js';
import { useInput, type Key } from '../../hooks/index.js';
import { themeColor } from '../../core/theme.js';
import { getChars, getRenderMode } from '../../core/capabilities.js';

export interface TextInputState {
  value: string;
  cursorPosition: number;
  isMultiline: boolean;
  historyIndex: number;
}

export interface TextInputOptions {
  /** Initial value */
  initialValue?: string;
  /** Placeholder when empty */
  placeholder?: string;
  /** Password mode - mask characters */
  password?: boolean;
  /** Character to use for password mask */
  maskChar?: string;
  /** Enable multi-line input (Shift+Enter) */
  multiline?: boolean;
  /** Max length */
  maxLength?: number;
  /** Input history for Up/Down navigation */
  history?: string[];
  /** Called on value change */
  onChange?: (value: string) => void;
  /** Called on submit (Enter) */
  onSubmit?: (value: string) => void;
  /** Called on cancel (Escape) */
  onCancel?: () => void;
  /** Is input active/focused - can be boolean or getter function for reactive updates */
  isActive?: boolean | (() => boolean);
  /** Cursor style */
  cursorStyle?: 'block' | 'underline' | 'bar';
  /** Border style */
  borderStyle?: 'none' | 'single' | 'round' | 'double' | 'bold';
  /** Border color when focused */
  focusedBorderColor?: string;
  /** Border color when unfocused */
  unfocusedBorderColor?: string;
  /** Prompt character */
  prompt?: string;
  /** Prompt color */
  promptColor?: string;
  /** Make input full width */
  fullWidth?: boolean;
}

/**
 * Create a TextInput state manager
 */
export function createTextInput(options: TextInputOptions = {}) {
  const {
    initialValue = '',
    placeholder = '',
    password = false,
    maskChar = '*',
    multiline = false,
    maxLength,
    history = [],
    onChange,
    onSubmit,
    onCancel,
    isActive: isActiveProp = true,
  } = options;

  // Helper to check if input is currently active
  // Supports both static boolean and reactive getter function
  const checkIsActive = (): boolean => {
    return typeof isActiveProp === 'function' ? isActiveProp() : isActiveProp;
  };

  const [value, setValue] = createSignal(initialValue);
  const [cursorPosition, setCursorPosition] = createSignal(initialValue.length);
  const [isMultilineMode, setIsMultilineMode] = createSignal(false);
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  const [originalValue, setOriginalValue] = createSignal('');

  // Word boundary detection
  const isWordChar = (char: string): boolean => /[\w]/.test(char);

  const findPrevWordBoundary = (text: string, pos: number): number => {
    if (pos <= 0) return 0;
    let i = pos - 1;
    // Skip non-word chars
    while (i > 0 && !isWordChar(text[i])) i--;
    // Skip word chars
    while (i > 0 && isWordChar(text[i - 1])) i--;
    return i;
  };

  const findNextWordBoundary = (text: string, pos: number): number => {
    if (pos >= text.length) return text.length;
    let i = pos;
    // Skip word chars
    while (i < text.length && isWordChar(text[i])) i++;
    // Skip non-word chars
    while (i < text.length && !isWordChar(text[i])) i++;
    return i;
  };

  // Input handling
  const handleInput = (input: string, key: Key) => {
    // Check isActive dynamically at input time (supports reactive getter)
    if (!checkIsActive()) return;

    const currentValue = value();
    const pos = cursorPosition();

    // Escape - cancel
    if (key.escape) {
      onCancel?.();
      return;
    }

    // Enter - submit or newline
    if (key.return) {
      if (key.shift && multiline) {
        // Insert newline
        const newValue = currentValue.slice(0, pos) + '\n' + currentValue.slice(pos);
        setValue(newValue);
        setCursorPosition(pos + 1);
        setIsMultilineMode(true);
        onChange?.(newValue);
      } else {
        // Submit
        onSubmit?.(currentValue);
        setHistoryIndex(-1);
      }
      return;
    }

    // Tab - could be used for completion
    if (key.tab) {
      // Reserved for future tab completion
      return;
    }

    // Cursor movement
    if (key.leftArrow) {
      if (key.ctrl) {
        // Move to previous word boundary
        setCursorPosition(findPrevWordBoundary(currentValue, pos));
      } else {
        setCursorPosition(Math.max(0, pos - 1));
      }
      return;
    }

    if (key.rightArrow) {
      if (key.ctrl) {
        // Move to next word boundary
        setCursorPosition(findNextWordBoundary(currentValue, pos));
      } else {
        setCursorPosition(Math.min(currentValue.length, pos + 1));
      }
      return;
    }

    // Home/End or Ctrl+A/E
    if (key.home || (key.ctrl && input === 'a')) {
      setCursorPosition(0);
      return;
    }

    if (key.end || (key.ctrl && input === 'e')) {
      setCursorPosition(currentValue.length);
      return;
    }

    // History navigation
    if (key.upArrow && history.length > 0) {
      const currentIndex = historyIndex();
      if (currentIndex === -1) {
        setOriginalValue(currentValue);
      }
      const newIndex = Math.min(currentIndex + 1, history.length - 1);
      setHistoryIndex(newIndex);
      const historyValue = history[history.length - 1 - newIndex];
      setValue(historyValue);
      setCursorPosition(historyValue.length);
      onChange?.(historyValue);
      return;
    }

    if (key.downArrow && historyIndex() >= 0) {
      const newIndex = historyIndex() - 1;
      setHistoryIndex(newIndex);
      if (newIndex < 0) {
        const orig = originalValue();
        setValue(orig);
        setCursorPosition(orig.length);
        onChange?.(orig);
      } else {
        const historyValue = history[history.length - 1 - newIndex];
        setValue(historyValue);
        setCursorPosition(historyValue.length);
        onChange?.(historyValue);
      }
      return;
    }

    // Deletion
    if (key.backspace) {
      if (pos > 0) {
        if (key.ctrl) {
          // Delete word before cursor
          const boundary = findPrevWordBoundary(currentValue, pos);
          const newValue = currentValue.slice(0, boundary) + currentValue.slice(pos);
          setValue(newValue);
          setCursorPosition(boundary);
          onChange?.(newValue);
        } else {
          // Delete single char
          const newValue = currentValue.slice(0, pos - 1) + currentValue.slice(pos);
          setValue(newValue);
          setCursorPosition(pos - 1);
          onChange?.(newValue);
        }
      }
      return;
    }

    if (key.delete) {
      if (pos < currentValue.length) {
        if (key.ctrl) {
          // Delete word after cursor
          const boundary = findNextWordBoundary(currentValue, pos);
          const newValue = currentValue.slice(0, pos) + currentValue.slice(boundary);
          setValue(newValue);
          onChange?.(newValue);
        } else {
          // Delete single char
          const newValue = currentValue.slice(0, pos) + currentValue.slice(pos + 1);
          setValue(newValue);
          onChange?.(newValue);
        }
      }
      return;
    }

    // Ctrl+K - delete to end of line
    if (key.ctrl && input === 'k') {
      const lineEnd = currentValue.indexOf('\n', pos);
      const endPos = lineEnd >= 0 ? lineEnd : currentValue.length;
      const newValue = currentValue.slice(0, pos) + currentValue.slice(endPos);
      setValue(newValue);
      onChange?.(newValue);
      return;
    }

    // Ctrl+U - delete to start of line
    if (key.ctrl && input === 'u') {
      const lineStart = currentValue.lastIndexOf('\n', pos - 1);
      const startPos = lineStart >= 0 ? lineStart + 1 : 0;
      const newValue = currentValue.slice(0, startPos) + currentValue.slice(pos);
      setValue(newValue);
      setCursorPosition(startPos);
      onChange?.(newValue);
      return;
    }

    // Ctrl+W - delete word before
    if (key.ctrl && input === 'w') {
      const boundary = findPrevWordBoundary(currentValue, pos);
      const newValue = currentValue.slice(0, boundary) + currentValue.slice(pos);
      setValue(newValue);
      setCursorPosition(boundary);
      onChange?.(newValue);
      return;
    }

    // Ctrl+X - clear all (like Ctrl+C in some terminals)
    if (key.ctrl && input === 'x') {
      setValue('');
      setCursorPosition(0);
      onChange?.('');
      return;
    }

    // Regular character input
    if (input && input.length > 0 && !key.ctrl && !key.meta) {
      // Check max length
      if (maxLength && currentValue.length + input.length > maxLength) {
        const remaining = maxLength - currentValue.length;
        if (remaining <= 0) return;
        input = input.slice(0, remaining);
      }

      const newValue = currentValue.slice(0, pos) + input + currentValue.slice(pos);
      setValue(newValue);
      setCursorPosition(pos + input.length);
      setHistoryIndex(-1);
      onChange?.(newValue);
    }
  };

  // Register input handler
  // Note: We always register and check isActive dynamically in handleInput
  // This allows isActive to be a reactive getter function
  useInput(handleInput);

  return {
    value,
    cursorPosition,
    isMultiline: isMultilineMode,
    setValue: (v: string) => {
      setValue(v);
      setCursorPosition(v.length);
      onChange?.(v);
    },
    clear: () => {
      setValue('');
      setCursorPosition(0);
      setHistoryIndex(-1);
      onChange?.('');
    },
    focus: () => {
      // Focus logic if needed
    },
  };
}

/**
 * Render a text input as a VNode
 */
export function renderTextInput(
  state: ReturnType<typeof createTextInput>,
  options: TextInputOptions = {}
): VNode {
  const {
    placeholder = 'Type here...',
    password = false,
    maskChar = '*',
    cursorStyle = 'block',
    borderStyle = 'round',
    focusedBorderColor = themeColor('info'),
    unfocusedBorderColor = themeColor('border'),
    prompt = getChars().arrows.right,
    promptColor = themeColor('info'),
    isActive = true,
    fullWidth = false,
  } = options;

  const value = state.value();
  const cursor = state.cursorPosition();
  const displayValue = password ? maskChar.repeat(value.length) : value;
  const isEmpty = value.length === 0;

  // Build the input display with cursor
  const beforeCursor = displayValue.slice(0, cursor);
  const cursorChar = displayValue[cursor] || ' ';
  const afterCursor = displayValue.slice(cursor + 1);

  const showPlaceholder = isEmpty && placeholder;

  // Multi-line handling
  const lines = displayValue.split('\n');
  const isMultiline = lines.length > 1;

  // Box style based on borderStyle
  const noBorder = borderStyle === 'none';
  const boxStyle: any = {
    flexDirection: 'column' as const,
    flexGrow: fullWidth ? 1 : 0,
  };

  if (!noBorder) {
    boxStyle.borderStyle = borderStyle;
    boxStyle.borderColor = isActive ? focusedBorderColor : unfocusedBorderColor;
    boxStyle.paddingX = 1;
  }

  if (isMultiline) {
    // Calculate which line the cursor is on
    let charCount = 0;
    let cursorLine = 0;
    let cursorCol = cursor;

    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= cursor) {
        cursorLine = i;
        cursorCol = cursor - charCount;
        break;
      }
      charCount += lines[i].length + 1; // +1 for newline
    }

    return Box(
      boxStyle,
      ...lines.map((line, i) => {
        const linePrompt = i === 0 ? prompt : getChars().border.vertical;
        if (i === cursorLine && isActive) {
          const before = line.slice(0, cursorCol);
          const char = line[cursorCol] || ' ';
          const after = line.slice(cursorCol + 1);
          return Box(
            { flexDirection: 'row' },
            Text({ color: promptColor }, `${linePrompt} `),
            Text({}, before),
            Text({ backgroundColor: 'white', color: 'black' }, char),
            Text({}, after)
          );
        }
        return Box(
          { flexDirection: 'row' },
          Text({ color: promptColor }, `${linePrompt} `),
          Text({}, line)
        );
      })
    );
  }

  // Single line - simple row layout
  const rowStyle: any = {
    flexDirection: 'row' as const,
    flexGrow: fullWidth ? 1 : 0,
  };

  if (!noBorder) {
    rowStyle.borderStyle = borderStyle;
    rowStyle.borderColor = isActive ? focusedBorderColor : unfocusedBorderColor;
    rowStyle.paddingX = 1;
  }

  return Box(
    rowStyle,
    Text({ color: promptColor }, `${prompt} `),
    showPlaceholder
      ? Box(
          { flexDirection: 'row', flexGrow: fullWidth ? 1 : 0 },
          Text({ color: 'gray', dim: true }, placeholder),
          isActive ? Text({ backgroundColor: 'white', color: 'black' }, ' ') : Text({}, '')
        )
      : Box(
          { flexDirection: 'row', flexGrow: fullWidth ? 1 : 0 },
          Text({}, beforeCursor),
          isActive
            ? Text({ backgroundColor: 'white', color: 'black' }, cursorChar)
            : Text({}, cursorChar),
          Text({}, afterCursor)
        )
  );
}

export type { TextInputOptions as TextInputProps };
