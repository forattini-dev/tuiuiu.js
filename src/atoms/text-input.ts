/**
 * TextInput - Advanced text input component
 *
 * @layer Atom
 * @description Full-featured text input with cursor, history, and editing
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

import { Box, Text } from '../primitives/nodes.js';
import type { VNode } from '../utils/types.js';
import { createSignal, createEffect } from '../primitives/signal.js';
import { useInput, type Key } from '../hooks/index.js';
import { getTheme, getContrastColor } from '../core/theme.js';
import { getChars, getRenderMode } from '../core/capabilities.js';

export interface TextInputState {
  value: string;
  cursorPosition: number;
  isMultiline: boolean;
  historyIndex: number;
  viewportOffset: number;
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
  foreground?: string;
  /** Make input full width (flex: 1) */
  fullWidth?: boolean;
  /** Fixed width in columns for wrapping calculation */
  width?: number;
  /** Maximum number of lines to display (for textarea mode) */
  maxLines?: number;
  /** Show character count */
  showCharCount?: boolean;
  /** Enable word wrapping */
  wordWrap?: boolean;
  /** If true, Enter creates a newline without Shift */
  enterCreatesNewline?: boolean;
}

interface VisualLine {
  text: string;
  start: number;
  end: number;
}

/**
 * Calculate visual lines based on width and wrapping
 * Preserves strict whitespace for editor behavior
 */
export function getVisualLines(text: string, width: number, wrap: boolean): VisualLine[] {
  if (!wrap || width < 1) {
    const lines = text.split('\n');
    let currentIndex = 0;
    return lines.map(line => {
      const start = currentIndex;
      const end = start + line.length;
      currentIndex = end + 1; // +1 for newline
      return { text: line, start, end };
    });
  }

  // Strict word wrapping
  const lines: VisualLine[] = [];
  let currentIndex = 0;

  // Split by physical newlines first
  const physicalLines = text.split('\n');

  for (let phase = 0; phase < physicalLines.length; phase++) {
    const rawLine = physicalLines[phase];
    if (rawLine === '') {
      lines.push({ text: '', start: currentIndex, end: currentIndex });
      currentIndex += 1;
      continue;
    }

    let lineRemaining = rawLine;
    let lineStartIndex = currentIndex;

    while (lineRemaining.length > width) {
      // Find split point
      let splitIndex = -1;

      // Look for last space within width
      for (let i = width; i >= 1; i--) {
        if (lineRemaining[i] === ' ' || lineRemaining[i] === '\t') {
          splitIndex = i;
          break;
        }
      }

      // Force break if no space found
      if (splitIndex === -1) {
        splitIndex = width;
      }

      const subLine = lineRemaining.slice(0, splitIndex);
      lines.push({
        text: subLine,
        start: lineStartIndex,
        end: lineStartIndex + subLine.length
      });

      // Move past the split part
      // Note: we don't consume the space if we wrapped at it? 
      // Standard editors usually push the space to next line or hide it at eol.
      // For simple logic, we keep it in the string but visual wrapping is tricky.
      // Let's stick to simple greedy char slice for now if strict preservation is needed,
      // BUT user requested 'wrap from end' which implies word wrap.
      // My logic above attempts word wrap.

      // Adjust for next iteration
      lineRemaining = lineRemaining.slice(splitIndex);
      lineStartIndex += splitIndex;
    }

    // Remaining part
    lines.push({
      text: lineRemaining,
      start: lineStartIndex,
      end: lineStartIndex + lineRemaining.length
    });

    currentIndex += rawLine.length + 1; // +1 for newline
  }

  return lines;
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
    width = 80, // Default width for wrapping
    maxLines,
    wordWrap = false,
    enterCreatesNewline = false,
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
  const [viewportOffset, setViewportOffset] = createSignal(0);

  // Scroll to cursor helper
  const scrollToCursor = (val: string, cursor: number) => {
    if (!maxLines) return; // No scrolling needed if no max height

    const visualLines = getVisualLines(val, width, wordWrap);

    // Find visual line containing cursor
    let cursorLineFn = 0;

    // Fallback if cursor is at very end
    if (cursor >= val.length && visualLines.length > 0) {
      cursorLineFn = visualLines.length - 1;
      // If the last line is full and cursor causes a wrap-to-new-empty-line logic?
      // Our getVisualLines handles 'newline' at end by pushing empty line?
      // Check getVisualLines: "currentIndex += rawLine.length + 1". 
      // If text ends with \n, physicalLines has empty string at end.
    } else {
      // Find line where start <= cursor <= end
      // Note: For end of line cursor, it should be on that line unless it wrapped
      for (let i = 0; i < visualLines.length; i++) {
        const line = visualLines[i];
        // Cursor can be at 'end' index (after last char)
        if (cursor >= line.start && cursor <= line.end) {
          // If cursor is at start of next line vs end of this line?
          // Visual wrap: if wrapped at index X, chars 0..X-1 are line 1. X starts line 2.
          // Cursor at X is on line 2.
          // So condition: cursor < line.end ?? 
          // Let's use strict: start <= cursor < end, except for last line or eol.
          cursorLineFn = i;
          // If cursor is exactly at line.end (unwrapped), it's visually at end of this line.
          // If it matched because of wrapping, getLogic handles it.
          // We simply break on first match from top.
          if (cursor < line.end) break;
          // If cursor == line.end, it might be effectively on next line if wrapped?
          // But loop continues.
        }
      }
    }

    const currentOffset = viewportOffset();
    if (cursorLineFn < currentOffset) {
      setViewportOffset(cursorLineFn);
    } else if (cursorLineFn >= currentOffset + maxLines) {
      setViewportOffset(cursorLineFn - maxLines + 1);
    }
  };

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

    // Ctrl+N - insert newline (N = New line, works in all terminals)
    if (key.ctrl && input === 'n' && multiline) {
      const newValue = currentValue.slice(0, pos) + '\n' + currentValue.slice(pos);
      setValue(newValue);
      const newPos = pos + 1;
      setCursorPosition(newPos);
      setIsMultilineMode(true);
      scrollToCursor(newValue, newPos);
      onChange?.(newValue);
      return;
    }

    // Enter - submit or newline
    // Ctrl+Alt+Enter, Alt+Enter, or Shift+Enter creates newline (if terminal supports it)
    if (key.return) {
      if (((key.shift || key.meta) && multiline) || (multiline && enterCreatesNewline)) {
        // Insert newline
        const newValue = currentValue.slice(0, pos) + '\n' + currentValue.slice(pos);
        setValue(newValue);
        const newPos = pos + 1;
        setCursorPosition(newPos);
        setIsMultilineMode(true);
        scrollToCursor(newValue, newPos);
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
        const newPos = findPrevWordBoundary(currentValue, pos);
        setCursorPosition(newPos);
        scrollToCursor(currentValue, newPos);
      } else {
        const newPos = Math.max(0, pos - 1);
        setCursorPosition(newPos);
        scrollToCursor(currentValue, newPos);
      }
      return;
    }

    if (key.rightArrow) {
      if (key.ctrl) {
        // Move to next word boundary
        const newPos = findNextWordBoundary(currentValue, pos);
        setCursorPosition(newPos);
        scrollToCursor(currentValue, newPos);
      } else {
        const newPos = Math.min(currentValue.length, pos + 1);
        setCursorPosition(newPos);
        scrollToCursor(currentValue, newPos);
      }
      return;
    }

    // Home/End or Ctrl+A/E
    if (key.home || (key.ctrl && input === 'a')) {
      setCursorPosition(0);
      scrollToCursor(currentValue, 0);
      return;
    }

    if (key.end || (key.ctrl && input === 'e')) {
      const newPos = currentValue.length;
      setCursorPosition(newPos);
      scrollToCursor(currentValue, newPos);
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
      // Update scroll on input
      const newPos = pos + input.length;
      scrollToCursor(newValue, newPos);
    }
  };

  // handleInput is exposed to be registered during render phase
  // This allows isActive to be a reactive getter function

  return {
    value,
    cursorPosition,
    viewportOffset,
    isMultiline: isMultilineMode,
    handleInput, // Expose handler to be registered during render
    setValue: (v: string) => {
      setValue(v);
      setCursorPosition(v.length);
      scrollToCursor(v, v.length);
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
  const theme = getTheme();
  const {
    placeholder = 'Type here...',
    password = false,
    maskChar = '*',
    cursorStyle = 'block',
    borderStyle = 'round',
    focusedBorderColor = theme.accents.info,
    unfocusedBorderColor = theme.borders.default,
    prompt = getChars().arrows.right,
    foreground = theme.accents.info,
    isActive = true,
    fullWidth = false,
  } = options;

  // Register input handler during render phase
  useInput(state.handleInput);

  const value = state.value();
  const cursor = state.cursorPosition();
  const displayValue = password ? maskChar.repeat(value.length) : value;
  const isEmpty = value.length === 0;

  // Use passed specific wrapping options or defaults
  const width = options.width ?? 80;
  const wordWrap = options.wordWrap ?? false;
  const maxLines = options.maxLines;
  const showCharCount = options.showCharCount ?? false;

  // Build the input display with cursor
  const beforeCursor = displayValue.slice(0, cursor);
  const cursorChar = displayValue[cursor] || ' ';
  const afterCursor = displayValue.slice(cursor + 1);

  const showPlaceholder = isEmpty && placeholder;

  // Cursor colors based on theme
  const cursorBg = theme.foreground.primary;
  const cursorFg = getContrastColor(cursorBg);

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

  const isMultiline = state.isMultiline() || displayValue.includes('\n') || options.multiline;

  // Use multiline path when any of these conditions are true
  const shouldUseMultiline = isMultiline || wordWrap || showCharCount;

  // Multi-line handling with wrapping or robust layout features
  // ALWAYS use multiline path when wordWrap is enabled
  if (shouldUseMultiline) {
    // Calculate actual content width for wrapping:
    // - Border: 2 chars (left + right)
    // - paddingX: 2 chars (left + right)
    // - Prompt "❯ " or "│ ": 2 chars
    const contentWidth = noBorder ? width - 2 : width - 6;
    const lines = getVisualLines(displayValue, contentWidth, wordWrap);

    // Viewport handling
    let offset = state.viewportOffset();
    let visibleLines = lines;

    // If maxLines is set, slice the lines
    if (maxLines) {
      visibleLines = lines.slice(offset, offset + maxLines);
    }

    // Determine visual cursor position relative to viewport
    // We need to match the cursor index to a line and col
    let cursorLine = -1;
    let cursorCol = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (cursor >= line.start && cursor <= line.end) {
        cursorLine = i;
        cursorCol = cursor - line.start;
        // Handle edge case where cursor is at the very beginning of a wrapped line
        // but logially might be at end of previous?
        // Usually cursor is at 'index' which falls into one bucket.
        break;
      }
    }

    // Adjust cursorLine to be relative to visible window
    const relativeCursorLine = cursorLine - offset;

    const renderedLines = visibleLines.map((lineObj, i) => {
      const lineIndex = offset + i; // Absolute line index
      const isCursorLine = lineIndex === cursorLine;
      const line = lineObj.text;

      const linePrompt = i === 0 && offset === 0 ? prompt : getChars().border.vertical;

      if (isCursorLine && isActive) {
        // Ensure cursorCol is within bounds of this line
        const safeCol = Math.min(Math.max(0, cursorCol), line.length);
        const before = line.slice(0, safeCol);
        const char = line[safeCol] || ' ';
        const after = line.slice(safeCol + 1);

        return Box(
          { flexDirection: 'row' },
          Text({ color: foreground }, `${linePrompt} `),
          Text({}, before),
          Text({ backgroundColor: cursorBg, color: cursorFg }, char),
          Text({}, after)
        );
      }

      return Box(
        { flexDirection: 'row' },
        Text({ color: foreground }, `${linePrompt} `),
        Text({}, line)
      );
    });

    if (showCharCount) {
      const countText = `${value.length}${options.maxLength ? '/' + options.maxLength : ''}`;
      renderedLines.push(
        Box(
          { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 0 },
          Text({ color: 'mutedForeground', dim: true }, countText)
        )
      );
    }

    return Box(
      boxStyle,
      ...renderedLines
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
    Text({ color: foreground }, `${prompt} `),
    showPlaceholder
      ? Box(
        { flexDirection: 'row', flexGrow: fullWidth ? 1 : 0 },
        Text({ color: 'mutedForeground', dim: true }, placeholder),
        isActive ? Text({ backgroundColor: cursorBg, color: cursorFg }, ' ') : Text({}, '')
      )
      : Box(
        { flexDirection: 'row', flexGrow: fullWidth ? 1 : 0 },
        Text({}, beforeCursor),
        isActive
          ? Text({ backgroundColor: cursorBg, color: cursorFg }, cursorChar)
          : Text({}, cursorChar),
        Text({}, afterCursor)
      )
  );
}

export type { TextInputOptions as TextInputProps };

/**
 * Simple standalone TextInput component
 */
export function TextInput(options: TextInputOptions): VNode {
  const state = createTextInput(options);
  return renderTextInput(state, options);
}
