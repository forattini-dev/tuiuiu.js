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
import type { VNode, MouseEventData } from '../utils/types.js';
import { batch, createSignal, createEffect } from '../primitives/signal.js';
import { useConst, useInput, type Key } from '../hooks/index.js';
import { isRenderingHooks } from '../hooks/context.js';
import { getTheme, getContrastColor } from '../core/theme.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { stringWidth } from '../utils/text-utils.js';
import type { BackgroundTaskHandle } from '../utils/background-executor.js';
import type { SyncStorageAdapter } from '../primitives/store.js';
import {
  clampCursorToSegmentBoundary,
  clampSegmentsToValue,
  cloneSegments,
  expandRangeAcrossSegments,
  getCursorIndexFromColumn,
  isTaskBackedCompletionResult,
  normalizeHistoryEntry,
  normalizeHistoryEntries,
  sortCompletionRankingEntries,
  sortSegments,
} from './text-input-model.js';
import {
  isSameCompletionRankingPersistence,
  isSameHistoryPersistenceOptions,
  mergePersistedHistoryEntry,
  readPersistedCompletionRankingEntries,
  readPersistedHistoryEntries,
  writePersistedCompletionRankingEntries,
  writePersistedHistoryEntries,
} from './text-input-persistence.js';

export interface TextInputState {
  value: string;
  cursorPosition: number;
  isMultiline: boolean;
  historyIndex: number;
  viewportOffset: number;
  segments?: TextInputSegment[];
  completion?: TextInputCompletionState | null;
}

export interface TextInputRange {
  start: number;
  end: number;
}

export interface TextInputSegment<T = unknown> {
  id: string;
  kind: string;
  start: number;
  end: number;
  displayText: string;
  payload?: T;
}

export interface TextInputSegmentInput<T = unknown> {
  id?: string;
  kind: string;
  displayText: string;
  payload?: T;
}

export type TextInputInsertedPart<T = unknown> =
  | { type: 'text'; text: string }
  | { type: 'segment'; segment: TextInputSegmentInput<T> };

export interface TextInputInsertion<T = unknown> {
  parts: TextInputInsertedPart<T>[];
}

export interface TextInputIgnoreResult {
  ignore: true;
}

export type TextInputInsertionLike<T = unknown> =
  | string
  | TextInputInsertion<T>
  | TextInputSegmentInput<T>;

export interface TextInputPasteContext {
  text: string;
  value: string;
  cursorPosition: number;
  range: TextInputRange;
  segments: TextInputSegment[];
}

export type TextInputPasteTransformResult<T = unknown> =
  | TextInputInsertionLike<T>
  | TextInputIgnoreResult
  | null
  | undefined;

export interface TextInputCompletionAnchor extends TextInputRange {
  query: string;
  trigger?: string;
}

export interface TextInputCompletionContext {
  value: string;
  cursorPosition: number;
  segments: TextInputSegment[];
  anchor: TextInputCompletionAnchor;
}

export interface TextInputCompletionItem<T = unknown> {
  id: string;
  label: string;
  detail?: string;
  replacement?: TextInputInsertionLike<T>;
  payload?: T;
}

export interface TextInputCompletionRankingEntry {
  key: string;
  count: number;
  lastAcceptedAt: number;
}

export interface TextInputHistoryEntry {
  value: string;
  segments?: TextInputSegment[];
}

export type TextInputHistoryItem = string | TextInputHistoryEntry;

export interface TextInputHistoryPersistenceOptions {
  storage: SyncStorageAdapter;
  key: string;
  limit?: number;
}

export interface TextInputCompletionRankingOptions<T = unknown> {
  getKey: (
    item: TextInputCompletionItem<T>,
    context: TextInputCompletionContext
  ) => string;
  persistence?: {
    storage: SyncStorageAdapter;
    key: string;
  };
}

export interface TextInputCompletionState<T = unknown> {
  anchor: TextInputCompletionAnchor;
  query: string;
  status: 'loading' | 'ready' | 'error';
  items: TextInputCompletionItem<T>[];
  selectedIndex: number;
  statusText?: string;
  progress?: number;
  error?: string;
}

type TextInputCompletionItems<T = unknown> = readonly TextInputCompletionItem<T>[];
type TextInputCompletionTask<T = unknown> = BackgroundTaskHandle<TextInputCompletionItems<T>>;

export interface TextInputCompletionOptions<T = unknown> {
  resolveAnchor: (context: {
    value: string;
    cursorPosition: number;
    segments: TextInputSegment[];
  }) => TextInputCompletionAnchor | null;
  getItems: (context: TextInputCompletionContext) =>
    Promise<TextInputCompletionItems<T>> | TextInputCompletionItems<T> | TextInputCompletionTask<T>;
  ranking?: TextInputCompletionRankingOptions<T>;
}

export interface TextInputOptions {
  /** Initial value */
  initialValue?: string;
  /** Initial semantic segments */
  initialSegments?: TextInputSegment[];
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
  history?: TextInputHistoryItem[];
  /** Optional synchronous persistence for submitted history entries */
  historyPersistence?: TextInputHistoryPersistenceOptions;
  /** Called on value change */
  onChange?: (value: string) => void;
  /** Called when semantic segments change */
  onSegmentsChange?: (segments: TextInputSegment[]) => void;
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
  /** Auto-grow height based on visual line count (up to maxLines) */
  autoGrow?: boolean;
  /** Show scrollbar when content exceeds maxLines (default: true) */
  showScrollbar?: boolean;
  /** Show character count */
  showCharCount?: boolean;
  /** Enable word wrapping */
  wordWrap?: boolean;
  /** If true, Enter creates a newline without Shift */
  enterCreatesNewline?: boolean;
  /** Transform pasted content before it mutates the input buffer */
  transformPaste?: (context: TextInputPasteContext) => TextInputPasteTransformResult;
  /** Async completion provider anchored to the current cursor range */
  completion?: TextInputCompletionOptions;
}

interface TextInputRuntimeOptions {
  maxLength?: number;
  history: TextInputHistoryEntry[];
  historyPersistence?: TextInputHistoryPersistenceOptions;
  onChange?: (value: string) => void;
  onSegmentsChange?: (segments: TextInputSegment[]) => void;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
  isActive: boolean | (() => boolean);
  multiline: boolean;
  enterCreatesNewline: boolean;
  transformPaste?: (context: TextInputPasteContext) => TextInputPasteTransformResult;
  completion?: TextInputCompletionOptions;
}

function resolveRuntimeOptions(options: TextInputOptions): TextInputRuntimeOptions {
  return {
    maxLength: options.maxLength,
    history: normalizeHistoryEntries(options.history ?? []),
    historyPersistence: options.historyPersistence,
    onChange: options.onChange,
    onSegmentsChange: options.onSegmentsChange,
    onSubmit: options.onSubmit,
    onCancel: options.onCancel,
    isActive: options.isActive ?? true,
    multiline: options.multiline ?? false,
    enterCreatesNewline: options.enterCreatesNewline ?? false,
    transformPaste: options.transformPaste,
    completion: options.completion,
  };
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
    width = 80, // Default width for wrapping
    maxLines,
    autoGrow = false,
    wordWrap = false,
  } = options;
  let currentOptions: TextInputOptions = { ...options };
  let runtimeOptions = resolveRuntimeOptions(currentOptions);
  let wrapWidth = width;
  let wrapWordWrap = wordWrap;
  let wrapMaxLines = maxLines;
  let wrapAutoGrow = autoGrow;
  let resolvedMaxLines = wrapAutoGrow ? (wrapMaxLines ?? 5) : wrapMaxLines;

  // Helper to check if input is currently active
  // Supports both static boolean and reactive getter function
  const checkIsActive = (): boolean => {
    return typeof runtimeOptions.isActive === 'function' ? runtimeOptions.isActive() : runtimeOptions.isActive;
  };

  const [value, setValue] = createSignal(initialValue);
  const [cursorPosition, setCursorPosition] = createSignal(initialValue.length);
  const [isMultilineMode, setIsMultilineMode] = createSignal(false);
  const [historyIndex, setHistoryIndex] = createSignal(-1);
  const [originalHistoryDraft, setOriginalHistoryDraft] = createSignal<TextInputHistoryEntry>({
    value: '',
    segments: [],
  });
  const [viewportOffset, setViewportOffset] = createSignal(0);
  const [preferredColumn, setPreferredColumn] = createSignal<number | null>(null);
  const [segments, setSegments] = createSignal(
    clampSegmentsToValue(options.initialSegments ?? [], initialValue.length)
  );
  const [completionState, setCompletionState] = createSignal<TextInputCompletionState | null>(null);
  let nextSegmentId = segments().length;
  let completionRequestId = 0;
  let suppressedCompletionKey: string | null = null;
  let activeCompletionTask: TextInputCompletionTask | null = null;
  let releaseCompletionTaskEvents: (() => void) | null = null;
  let seedHistoryEntries = runtimeOptions.history;
  let persistedHistoryEntries: TextInputHistoryEntry[] = [];
  const completionRanking = new Map<string, TextInputCompletionRankingEntry>();

  const setLayout = (layout: { width?: number; wordWrap?: boolean; maxLines?: number; autoGrow?: boolean }) => {
    if (typeof layout.width === 'number') {
      wrapWidth = Math.max(1, layout.width);
    }
    if (typeof layout.wordWrap === 'boolean') {
      wrapWordWrap = layout.wordWrap;
    }
    if (layout.maxLines !== undefined) {
      wrapMaxLines = layout.maxLines;
    }
    if (typeof layout.autoGrow === 'boolean') {
      wrapAutoGrow = layout.autoGrow;
    }
    resolvedMaxLines = wrapAutoGrow ? (wrapMaxLines ?? 5) : wrapMaxLines;
  };

  const createSegmentId = () => `segment-${++nextSegmentId}`;

  const getCompletionAnchorKey = (anchor: TextInputCompletionAnchor, nextValue: string, nextCursor: number) =>
    `${anchor.start}:${anchor.end}:${anchor.query}:${nextCursor}:${nextValue}`;

  const emitSegmentsChange = (nextSegments: TextInputSegment[]) => {
    runtimeOptions.onSegmentsChange?.(nextSegments);
  };

  const getHistoryEntries = () => [...seedHistoryEntries, ...persistedHistoryEntries];

  const hydratePersistedHistory = () => {
    persistedHistoryEntries = readPersistedHistoryEntries(runtimeOptions.historyPersistence);
  };

  const persistPromptHistory = () => {
    writePersistedHistoryEntries(runtimeOptions.historyPersistence, persistedHistoryEntries);
  };

  const syncHistorySources = () => {
    seedHistoryEntries = runtimeOptions.history;
    hydratePersistedHistory();
  };

  const applyHistoryEntry = (entry: TextInputHistoryEntry) => {
    const normalizedEntry = normalizeHistoryEntry(entry);
    const nextSegments = cloneSegments(normalizedEntry.segments ?? []);

    batch(() => {
      setValue(normalizedEntry.value);
      setSegments(nextSegments);
      setCursorPositionInternal(normalizedEntry.value.length);
    });
    runtimeOptions.onChange?.(normalizedEntry.value);
    emitSegmentsChange(nextSegments);
  };

  const recordSubmittedHistoryEntry = (
    submittedValue: string,
    submittedSegments: readonly TextInputSegment[]
  ) => {
    if (!runtimeOptions.historyPersistence) {
      return;
    }

    const nextEntry = normalizeHistoryEntry({
      value: submittedValue,
      segments: cloneSegments(submittedSegments),
    });

    if (!nextEntry.value.trim() && (nextEntry.segments?.length ?? 0) === 0) {
      return;
    }

    persistedHistoryEntries = mergePersistedHistoryEntry(
      persistedHistoryEntries,
      nextEntry,
      runtimeOptions.historyPersistence?.limit
    );
    persistPromptHistory();
  };

  const hydrateCompletionRanking = () => {
    const persistence = runtimeOptions.completion?.ranking?.persistence;
    if (!persistence) {
      return;
    }

    completionRanking.clear();
    for (const entry of readPersistedCompletionRankingEntries(persistence)) {
      completionRanking.set(entry.key, entry);
    }
  };

  const persistCompletionRanking = () => {
    writePersistedCompletionRankingEntries(
      runtimeOptions.completion?.ranking?.persistence,
      getCompletionRankingSnapshot()
    );
  };

  const getCompletionRankingSnapshot = () =>
    sortCompletionRankingEntries([...completionRanking.values()]);

  const clearCompletionRanking = () => {
    completionRanking.clear();
    persistCompletionRanking();
  };

  const rankCompletionItems = <T = unknown>(
    items: TextInputCompletionItem<T>[],
    context: TextInputCompletionContext
  ): TextInputCompletionItem<T>[] => {
    const ranking = runtimeOptions.completion?.ranking;
    if (!ranking) {
      return items;
    }

    return [...items]
      .map((item, index) => {
        const key = ranking.getKey(item, context);
        const entry = completionRanking.get(key);
        return {
          item,
          index,
          count: entry?.count ?? 0,
          lastAcceptedAt: entry?.lastAcceptedAt ?? 0,
        };
      })
      .sort((left, right) => {
        if (left.count !== right.count) return right.count - left.count;
        if (left.lastAcceptedAt !== right.lastAcceptedAt) return right.lastAcceptedAt - left.lastAcceptedAt;
        return left.index - right.index;
      })
      .map((entry) => entry.item);
  };

  const recordAcceptedCompletion = (
    item: TextInputCompletionItem,
    context: TextInputCompletionContext
  ) => {
    const ranking = runtimeOptions.completion?.ranking;
    if (!ranking) {
      return;
    }

    const key = ranking.getKey(item, context);
    const previous = completionRanking.get(key);
    completionRanking.set(key, {
      key,
      count: (previous?.count ?? 0) + 1,
      lastAcceptedAt: Date.now(),
    });
    persistCompletionRanking();
  };

  syncHistorySources();
  hydrateCompletionRanking();

  const releaseCompletionTask = (cancelReason?: string) => {
    const task = activeCompletionTask;
    const unsubscribe = releaseCompletionTaskEvents;
    activeCompletionTask = null;
    releaseCompletionTaskEvents = null;

    unsubscribe?.();
    if (task && cancelReason) {
      task.cancel(cancelReason);
    }
  };

  const normalizeInsertion = (
    insertion: TextInputInsertionLike | TextInputIgnoreResult | null | undefined,
    fallbackText = ''
  ): TextInputInsertion | TextInputIgnoreResult => {
    if (!insertion) {
      return { parts: fallbackText ? [{ type: 'text', text: fallbackText }] : [] };
    }

    if (typeof insertion === 'string') {
      return { parts: insertion ? [{ type: 'text', text: insertion }] : [] };
    }

    if ('ignore' in insertion && insertion.ignore) {
      return insertion;
    }

    if ('parts' in insertion) {
      return insertion;
    }

    return {
      parts: [{ type: 'segment', segment: insertion as TextInputSegmentInput }],
    };
  };

  const applyMaxLengthToParts = (
    parts: readonly TextInputInsertedPart[],
    currentValue: string,
    range: TextInputRange
  ): TextInputInsertedPart[] => {
    if (!runtimeOptions.maxLength) {
      return [...parts];
    }

    let remaining = runtimeOptions.maxLength - (currentValue.length - (range.end - range.start));
    if (remaining <= 0) {
      return [];
    }

    const limited: TextInputInsertedPart[] = [];
    for (const part of parts) {
      if (part.type === 'text') {
        const text = part.text.slice(0, remaining);
        if (text.length > 0) {
          limited.push({ type: 'text', text });
          remaining -= text.length;
        }
        if (remaining <= 0) break;
        continue;
      }

      const segmentLength = part.segment.displayText.length;
      if (segmentLength <= remaining) {
        limited.push(part);
        remaining -= segmentLength;
      } else {
        break;
      }
    }

    return limited;
  };

  const applyEdit = (
    range: TextInputRange,
    insertionLike: TextInputInsertionLike | TextInputIgnoreResult | null | undefined,
    options?: {
      resetHistory?: boolean;
      setMultiline?: boolean;
      suppressCompletion?: boolean;
    }
  ) => {
    const currentValue = value();
    const currentSegments = segments();
    const expandedRange = expandRangeAcrossSegments(currentSegments, range.start, range.end);
    const normalizedInsertion = normalizeInsertion(insertionLike);

    if ('ignore' in normalizedInsertion) {
      return false;
    }

    const parts = applyMaxLengthToParts(normalizedInsertion.parts, currentValue, expandedRange);
    const before = currentValue.slice(0, expandedRange.start);
    const after = currentValue.slice(expandedRange.end);

    let insertedText = '';
    let insertedCursor = expandedRange.start;
    let insertedOffset = 0;
    const insertedSegments: TextInputSegment[] = [];

    for (const part of parts) {
      if (part.type === 'text') {
        insertedText += part.text;
        insertedOffset += part.text.length;
        continue;
      }

      const displayText = part.segment.displayText;
      const start = expandedRange.start + insertedOffset;
      insertedText += displayText;
      insertedSegments.push({
        id: part.segment.id ?? createSegmentId(),
        kind: part.segment.kind,
        start,
        end: start + displayText.length,
        displayText,
        payload: part.segment.payload,
      });
      insertedOffset += displayText.length;
    }

    const nextValue = before + insertedText + after;
    const delta = insertedText.length - (expandedRange.end - expandedRange.start);
    const shiftedSegments = currentSegments
      .filter((segment) => segment.end <= expandedRange.start || segment.start >= expandedRange.end)
      .map((segment) => {
        if (segment.start >= expandedRange.end) {
          return {
            ...segment,
            start: segment.start + delta,
            end: segment.end + delta,
          };
        }
        return segment;
      });

    const nextSegments = sortSegments(
      clampSegmentsToValue([...shiftedSegments, ...insertedSegments], nextValue.length)
    );
    insertedCursor = expandedRange.start + insertedText.length;

    if (options?.suppressCompletion && runtimeOptions.completion) {
      const nextAnchor = runtimeOptions.completion.resolveAnchor({
        value: nextValue,
        cursorPosition: insertedCursor,
        segments: nextSegments,
      });
      suppressedCompletionKey = nextAnchor
        ? getCompletionAnchorKey(nextAnchor, nextValue, insertedCursor)
        : null;
    } else {
      suppressedCompletionKey = null;
    }

    batch(() => {
      setValue(nextValue);
      setSegments(nextSegments);
      setCursorPositionInternal(insertedCursor, { updatePreferredColumn: true });
      if (options?.resetHistory) {
        setHistoryIndex(-1);
      }
      if (options?.setMultiline) {
        setIsMultilineMode(true);
      }
    });
    runtimeOptions.onChange?.(nextValue);
    emitSegmentsChange(nextSegments);
    return true;
  };

  const applyPaste = (text: string) => {
    const range = {
      start: cursorPosition(),
      end: cursorPosition(),
    };
    const context: TextInputPasteContext = {
      text,
      value: value(),
      cursorPosition: cursorPosition(),
      range,
      segments: segments(),
    };
    const transformed = runtimeOptions.transformPaste?.(context);
    const insertion = normalizeInsertion(transformed, text);
    return applyEdit(range, insertion, { resetHistory: true, setMultiline: text.includes('\n') });
  };

  const clearCompletion = (cancelReason = 'Completion cleared') => {
    completionRequestId++;
    releaseCompletionTask(cancelReason);
    setCompletionState(null);
  };

  const selectCompletionIndex = (nextIndex: number) => {
    const current = completionState();
    if (!current || current.items.length === 0) {
      return;
    }
    setCompletionState({
      ...current,
      selectedIndex: ((nextIndex % current.items.length) + current.items.length) % current.items.length,
    });
  };

  const refreshCompletion = () => {
    const completion = runtimeOptions.completion;
    if (!completion) {
      clearCompletion();
      return;
    }

    const currentValue = value();
    const currentCursor = cursorPosition();
    const currentSegments = segments();
    const anchor = completion.resolveAnchor({
      value: currentValue,
      cursorPosition: currentCursor,
      segments: currentSegments,
    });

    if (!anchor || anchor.start > anchor.end) {
      suppressedCompletionKey = null;
      clearCompletion();
      return;
    }

    const anchorKey = getCompletionAnchorKey(anchor, currentValue, currentCursor);
    if (suppressedCompletionKey && suppressedCompletionKey === anchorKey) {
      releaseCompletionTask('Completion suppressed');
      setCompletionState(null);
      return;
    }
    if (suppressedCompletionKey && suppressedCompletionKey !== anchorKey) {
      suppressedCompletionKey = null;
    }

    const previous = completionState();
    const shouldReuse =
      previous &&
      previous.anchor.start === anchor.start &&
      previous.anchor.end === anchor.end &&
      previous.query === anchor.query &&
      previous.status !== 'error';

    if (shouldReuse) {
      return;
    }

    const requestId = ++completionRequestId;
    releaseCompletionTask('Completion request replaced');
    setCompletionState({
      anchor,
      query: anchor.query,
      status: 'loading',
      items: previous?.items ?? [],
      selectedIndex: 0,
      statusText: undefined,
      progress: undefined,
    });

    const completionResult = completion.getItems({
      value: currentValue,
      cursorPosition: currentCursor,
      segments: currentSegments,
      anchor,
    });

    if (isTaskBackedCompletionResult(completionResult)) {
      activeCompletionTask = completionResult;
      releaseCompletionTaskEvents = completionResult.subscribe((event) => {
        if (requestId !== completionRequestId || event.kind !== 'progress') {
          return;
        }

        const payload = event.payload as {
          status?: string;
          progress?: number;
        };
        const currentCompletion = completionState();
        if (!currentCompletion || currentCompletion.status !== 'loading') {
          return;
        }

        setCompletionState({
          ...currentCompletion,
          statusText: typeof payload.status === 'string' ? payload.status : currentCompletion.statusText,
          progress: typeof payload.progress === 'number' ? payload.progress : currentCompletion.progress,
        });
      });

      Promise.resolve(completionResult.result)
        .then((result) => {
          if (requestId !== completionRequestId) {
            return;
          }

          releaseCompletionTask();
          if (result.status === 'cancelled') {
            setCompletionState(null);
            return;
          }
          if (result.status === 'rejected') {
            setCompletionState({
              anchor,
              query: anchor.query,
              status: 'error',
              items: [],
              selectedIndex: 0,
              error: result.error.message,
            });
            return;
          }
          if (result.status !== 'resolved') {
            return;
          }

          const nextItems = rankCompletionItems([...result.value], {
            value: currentValue,
            cursorPosition: currentCursor,
            segments: currentSegments,
            anchor,
          });
          setCompletionState({
            anchor,
            query: anchor.query,
            status: 'ready',
            items: nextItems,
            selectedIndex: nextItems.length > 0 ? 0 : 0,
          });
        })
        .catch((error) => {
          if (requestId !== completionRequestId) {
            return;
          }

          releaseCompletionTask();
          setCompletionState({
            anchor,
            query: anchor.query,
            status: 'error',
            items: [],
            selectedIndex: 0,
            error: error instanceof Error ? error.message : String(error),
          });
        });
      return;
    }

    Promise.resolve(completionResult)
      .then((items) => {
        if (requestId !== completionRequestId) {
          return;
        }
        const nextItems = rankCompletionItems([...items], {
          value: currentValue,
          cursorPosition: currentCursor,
          segments: currentSegments,
          anchor,
        });
        setCompletionState({
          anchor,
          query: anchor.query,
          status: 'ready',
          items: nextItems,
          selectedIndex: nextItems.length > 0 ? 0 : 0,
        });
      })
      .catch((error) => {
        if (requestId !== completionRequestId) {
          return;
        }
        setCompletionState({
          anchor,
          query: anchor.query,
          status: 'error',
          items: [],
          selectedIndex: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      });
  };

  const acceptCompletion = (index = completionState()?.selectedIndex ?? 0) => {
    const current = completionState();
    if (!current || current.items.length === 0) {
      return false;
    }

    const item = current.items[Math.max(0, Math.min(index, current.items.length - 1))];
    recordAcceptedCompletion(item, {
      value: value(),
      cursorPosition: cursorPosition(),
      segments: segments(),
      anchor: current.anchor,
    });
    const applied = applyEdit(
      { start: current.anchor.start, end: current.anchor.end },
      item.replacement ?? item.label,
      { resetHistory: true, suppressCompletion: true }
    );
    if (applied) {
      clearCompletion();
    }
    return applied;
  };

  createEffect(() => {
    value();
    cursorPosition();
    segments();
    if (!runtimeOptions.completion) {
      releaseCompletionTask('Completion disabled');
      setCompletionState(null);
      return;
    }
    refreshCompletion();
  });

  const getCursorLineInfo = (val: string, cursor: number) => {
    const visualLines = getVisualLines(val, wrapWidth, wrapWordWrap);
    let lineIndex = 0;
    let lineStart = visualLines[0]?.start ?? 0;
    let lineText = visualLines[0]?.text ?? '';

    for (let i = 0; i < visualLines.length; i++) {
      const line = visualLines[i];
      if (cursor >= line.start && cursor <= line.end) {
        lineIndex = i;
        lineStart = line.start;
        lineText = line.text;
        if (cursor < line.end || i === visualLines.length - 1) {
          break;
        }
      }
    }

    const column = stringWidth(lineText.slice(0, Math.max(0, cursor - lineStart)));
    return { visualLines, lineIndex, lineStart, lineText, column };
  };

  const updatePreferredColumn = (val: string, cursor: number) => {
    const { column } = getCursorLineInfo(val, cursor);
    setPreferredColumn(column);
  };

  const setCursorPositionInternal = (
    pos: number,
    options?: {
      scroll?: boolean;
      updatePreferredColumn?: boolean;
      clampDirection?: 'nearest' | 'left' | 'right';
    }
  ) => {
    const current = value();
    const bounded = Math.max(0, Math.min(pos, current.length));
    const clamped = clampCursorToSegmentBoundary(
      segments(),
      bounded,
      options?.clampDirection ?? 'nearest'
    );
    setCursorPosition(clamped);
    if (options?.updatePreferredColumn !== false) {
      updatePreferredColumn(current, clamped);
    }
    if (options?.scroll !== false) {
      scrollToCursor(current, clamped);
    }
  };

  // Scroll to cursor helper
  const scrollToCursor = (val: string, cursor: number) => {
    if (!resolvedMaxLines) return; // No scrolling needed if no max height

    const visualLines = getVisualLines(val, wrapWidth, wrapWordWrap);

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
    } else if (cursorLineFn >= currentOffset + resolvedMaxLines) {
      setViewportOffset(cursorLineFn - resolvedMaxLines + 1);
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
    const currentSegments = segments();
    const pos = cursorPosition();
    const activeCompletion = completionState();

    // Escape - cancel
    if (key.escape) {
      if (activeCompletion) {
        clearCompletion();
        return;
      }
      runtimeOptions.onCancel?.();
      return;
    }

    // Ctrl+N - insert newline (N = New line, works in all terminals)
    if (key.ctrl && input === 'n' && runtimeOptions.multiline) {
      applyEdit({ start: pos, end: pos }, '\n', {
        resetHistory: true,
        setMultiline: true,
      });
      return;
    }

    // Enter - submit or newline
    // Ctrl+Alt+Enter, Alt+Enter, or Shift+Enter creates newline (if terminal supports it)
    if (key.return) {
      if (((key.shift || key.meta) && runtimeOptions.multiline) || (runtimeOptions.multiline && runtimeOptions.enterCreatesNewline)) {
        applyEdit({ start: pos, end: pos }, '\n', {
          resetHistory: true,
          setMultiline: true,
        });
      } else {
        // Submit
        recordSubmittedHistoryEntry(currentValue, currentSegments);
        runtimeOptions.onSubmit?.(currentValue);
        setHistoryIndex(-1);
      }
      return;
    }

    if (key.tab) {
      if (activeCompletion && activeCompletion.items.length > 0) {
        acceptCompletion();
      }
      return;
    }

    // Cursor movement
    if (key.leftArrow) {
      if (key.ctrl) {
        // Move to previous word boundary
        const newPos = findPrevWordBoundary(currentValue, pos);
        setCursorPositionInternal(newPos, { clampDirection: 'left' });
      } else {
        const newPos = Math.max(0, pos - 1);
        setCursorPositionInternal(newPos, { clampDirection: 'left' });
      }
      return;
    }

    if (key.rightArrow) {
      if (key.ctrl) {
        // Move to next word boundary
        const newPos = findNextWordBoundary(currentValue, pos);
        setCursorPositionInternal(newPos, { clampDirection: 'right' });
      } else {
        const newPos = Math.min(currentValue.length, pos + 1);
        setCursorPositionInternal(newPos, { clampDirection: 'right' });
      }
      return;
    }

    // Home/End or Ctrl+A/E
    if (key.home || (key.ctrl && input === 'a')) {
      setCursorPositionInternal(0);
      return;
    }

    if (key.end || (key.ctrl && input === 'e')) {
      const newPos = currentValue.length;
      setCursorPositionInternal(newPos);
      return;
    }

    if (key.upArrow) {
      if (activeCompletion && activeCompletion.items.length > 0) {
        selectCompletionIndex(activeCompletion.selectedIndex - 1);
        return;
      }

      const { visualLines, lineIndex, column } = getCursorLineInfo(currentValue, pos);
      const targetColumn = preferredColumn() ?? column;

      if (lineIndex > 0) {
        const targetLine = visualLines[lineIndex - 1]!;
        const offset = getCursorIndexFromColumn(targetLine.text, targetColumn);
        const newPos = Math.min(currentValue.length, targetLine.start + offset);
        if (preferredColumn() === null) {
          setPreferredColumn(targetColumn);
        }
        setCursorPositionInternal(newPos, {
          updatePreferredColumn: false,
          clampDirection: 'left',
        });
        return;
      }

      const historyEntries = getHistoryEntries();
      if (historyEntries.length > 0) {
        const currentIndex = historyIndex();
        if (currentIndex === -1) {
          setOriginalHistoryDraft({
            value: currentValue,
            segments: cloneSegments(currentSegments),
          });
        }
        const newIndex = Math.min(currentIndex + 1, historyEntries.length - 1);
        setHistoryIndex(newIndex);
        applyHistoryEntry(historyEntries[historyEntries.length - 1 - newIndex]!);
      }
      return;
    }

    if (key.downArrow) {
      if (activeCompletion && activeCompletion.items.length > 0) {
        selectCompletionIndex(activeCompletion.selectedIndex + 1);
        return;
      }

      const { visualLines, lineIndex, column } = getCursorLineInfo(currentValue, pos);
      const targetColumn = preferredColumn() ?? column;

      if (lineIndex < visualLines.length - 1) {
        const targetLine = visualLines[lineIndex + 1]!;
        const offset = getCursorIndexFromColumn(targetLine.text, targetColumn);
        const newPos = Math.min(currentValue.length, targetLine.start + offset);
        if (preferredColumn() === null) {
          setPreferredColumn(targetColumn);
        }
        setCursorPositionInternal(newPos, {
          updatePreferredColumn: false,
          clampDirection: 'right',
        });
        return;
      }

      if (historyIndex() >= 0) {
        const historyEntries = getHistoryEntries();
        const newIndex = historyIndex() - 1;
        setHistoryIndex(newIndex);
        if (newIndex < 0) {
          applyHistoryEntry(originalHistoryDraft());
        } else {
          applyHistoryEntry(historyEntries[historyEntries.length - 1 - newIndex]!);
        }
      }
      return;
    }

    // History navigation
    // Deletion
    if (key.backspace) {
      if (pos > 0) {
        if (key.ctrl) {
          // Delete word before cursor
          const boundary = findPrevWordBoundary(currentValue, pos);
          applyEdit({ start: boundary, end: pos }, '', { resetHistory: true });
        } else {
          // Delete single char
          applyEdit({ start: pos - 1, end: pos }, '', { resetHistory: true });
        }
      }
      return;
    }

    if (key.delete) {
      if (pos < currentValue.length) {
        if (key.ctrl) {
          // Delete word after cursor
          const boundary = findNextWordBoundary(currentValue, pos);
          applyEdit({ start: pos, end: boundary }, '', { resetHistory: true });
        } else {
          // Delete single char
          applyEdit({ start: pos, end: pos + 1 }, '', { resetHistory: true });
        }
      }
      return;
    }

    // Ctrl+K - delete to end of line
    if (key.ctrl && input === 'k') {
      const lineEnd = currentValue.indexOf('\n', pos);
      const endPos = lineEnd >= 0 ? lineEnd : currentValue.length;
      applyEdit({ start: pos, end: endPos }, '', { resetHistory: true });
      return;
    }

    // Ctrl+U - delete to start of line
    if (key.ctrl && input === 'u') {
      const lineStart = currentValue.lastIndexOf('\n', pos - 1);
      const startPos = lineStart >= 0 ? lineStart + 1 : 0;
      applyEdit({ start: startPos, end: pos }, '', { resetHistory: true });
      return;
    }

    // Ctrl+W - delete word before
    if (key.ctrl && input === 'w') {
      const boundary = findPrevWordBoundary(currentValue, pos);
      applyEdit({ start: boundary, end: pos }, '', { resetHistory: true });
      return;
    }

    // Ctrl+X - clear all (like Ctrl+C in some terminals)
    if (key.ctrl && input === 'x') {
      applyEdit({ start: 0, end: currentValue.length }, '', { resetHistory: true });
      return;
    }

    // Regular character input
    if (input && input.length > 0 && !key.ctrl && !key.meta) {
      if (input.length > 1) {
        applyPaste(input);
      } else {
        applyEdit({ start: pos, end: pos }, input, {
          resetHistory: true,
          setMultiline: input.includes('\n'),
        });
      }
    }
  };

  // handleInput is exposed to be registered during render phase
  // This allows isActive to be a reactive getter function

  return {
    value,
    segments,
    completion: completionState,
    cursorPosition,
    viewportOffset,
    isMultiline: isMultilineMode,
    handleInput, // Expose handler to be registered during render
    setLayout,
    setCursorPosition: (pos: number, options?: { scroll?: boolean }) => {
      setCursorPositionInternal(pos, options);
    },
    setValue: (v: string) => {
      batch(() => {
        setValue(v);
        setSegments([]);
        setCursorPositionInternal(v.length);
        setHistoryIndex(-1);
      });
      runtimeOptions.onChange?.(v);
      emitSegmentsChange([]);
    },
    insertSegment: (
      segment: TextInputSegmentInput,
      range: TextInputRange = { start: cursorPosition(), end: cursorPosition() }
    ) => {
      return applyEdit(range, segment, { resetHistory: true });
    },
    paste: (text: string) => applyPaste(text),
    acceptCompletion,
    cancelCompletion: clearCompletion,
    selectNextCompletion: () => {
      const current = completionState();
      if (!current) return;
      selectCompletionIndex(current.selectedIndex + 1);
    },
    selectPreviousCompletion: () => {
      const current = completionState();
      if (!current) return;
      selectCompletionIndex(current.selectedIndex - 1);
    },
    getCompletionRankingSnapshot,
    clearCompletionRanking,
    clear: () => {
      batch(() => {
        setValue('');
        setSegments([]);
        setCursorPositionInternal(0);
        setHistoryIndex(-1);
      });
      runtimeOptions.onChange?.('');
      emitSegmentsChange([]);
    },
    updateOptions: (nextOptions: TextInputOptions = {}) => {
      const previousHistoryPersistence = runtimeOptions.historyPersistence;
      const previousRankingPersistence = runtimeOptions.completion?.ranking?.persistence;
      currentOptions = { ...currentOptions, ...nextOptions };
      runtimeOptions = resolveRuntimeOptions(currentOptions);
      seedHistoryEntries = runtimeOptions.history;

      if (!isSameHistoryPersistenceOptions(previousHistoryPersistence, runtimeOptions.historyPersistence)) {
        hydratePersistedHistory();
      }

      if (
        !isSameCompletionRankingPersistence(
          previousRankingPersistence,
          runtimeOptions.completion?.ranking?.persistence
        )
      ) {
        hydrateCompletionRanking();
      }

      refreshCompletion();
    },
    getOptions: () => ({ ...currentOptions }),
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
  const mergedOptions = {
    ...(state.getOptions?.() ?? {}),
    ...options,
  };
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
  } = mergedOptions;
  const autoGrow = mergedOptions.autoGrow ?? false;
  const showScrollbar = mergedOptions.showScrollbar ?? true;
  const resolvedMaxLines = autoGrow ? (mergedOptions.maxLines ?? 5) : mergedOptions.maxLines;

  // Register input handler during render phase
  useInput(state.handleInput);

  const value = state.value();
  const cursor = state.cursorPosition();
  const displayValue = password ? maskChar.repeat(value.length) : value;
  const isEmpty = value.length === 0;

  // Use passed specific wrapping options or defaults
  const width = mergedOptions.width ?? 80;
  const wordWrap = mergedOptions.wordWrap ?? false;
  const maxLines = resolvedMaxLines;
  const showCharCount = mergedOptions.showCharCount ?? false;

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

  const baseContentWidth = Math.max(1, (noBorder ? width - 2 : width - 6));
  state.setLayout?.({
    width: baseContentWidth,
    wordWrap,
    maxLines: mergedOptions.maxLines,
    autoGrow,
  });

  const isMultiline = state.isMultiline() || displayValue.includes('\n') || mergedOptions.multiline;

  // Use multiline path when any of these conditions are true
  const shouldUseMultiline = isMultiline || wordWrap || showCharCount;

  // Multi-line handling with wrapping or robust layout features
  // ALWAYS use multiline path when wordWrap is enabled
  if (shouldUseMultiline) {
    // Calculate actual content width for wrapping:
    // - Border: 2 chars (left + right)
    // - paddingX: 2 chars (left + right)
    // - Prompt plus space, or border plus space: 2 chars
    const baseWidth = baseContentWidth;
    let contentWidth = baseWidth;
    const placeholderValue = showPlaceholder ? placeholder : '';
    const multilineSource = showPlaceholder ? placeholderValue : displayValue;
    let lines = getVisualLines(multilineSource, contentWidth, wordWrap);
    const hasOverflow = maxLines !== undefined && lines.length > maxLines;
    const shouldShowScrollbar = showScrollbar && hasOverflow;

    if (shouldShowScrollbar) {
      contentWidth = Math.max(1, baseWidth - 1);
      lines = getVisualLines(multilineSource, contentWidth, wordWrap);
      state.setLayout?.({
        width: contentWidth,
        wordWrap,
        maxLines: mergedOptions.maxLines,
        autoGrow,
      });
    }

    // Viewport handling
    const visibleCount = maxLines ? Math.min(maxLines, lines.length) : lines.length;
    const maxOffset = Math.max(0, lines.length - visibleCount);
    let offset = state.viewportOffset();
    if (offset > maxOffset) {
      offset = maxOffset;
    } else if (offset < 0) {
      offset = 0;
    }
    let visibleLines = lines;

    // If maxLines is set, slice the lines
    if (maxLines) {
      visibleLines = lines.slice(offset, offset + visibleCount);
    }

    const padForScrollbar = shouldShowScrollbar;
    const borderSize = noBorder ? 0 : 1;
    const contentStartX = noBorder ? 0 : 2;
    const contentStartY = borderSize;

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

    const chars = getChars();
    const renderMode = getRenderMode();
    const trackChar = renderMode === 'ascii' ? '|' : chars.scrollbar.track;
    const thumbChar = renderMode === 'ascii' ? '#' : chars.scrollbar.thumb;
    const scrollbarChars: string[] = [];
    if (shouldShowScrollbar && visibleCount > 0) {
      const thumbHeight = Math.max(1, Math.floor((visibleCount / lines.length) * visibleCount));
      const thumbPosition = maxOffset > 0
        ? Math.floor((offset / maxOffset) * (visibleCount - thumbHeight))
        : 0;

      for (let i = 0; i < visibleCount; i++) {
        scrollbarChars.push(
          i >= thumbPosition && i < thumbPosition + thumbHeight ? thumbChar : trackChar
        );
      }
    }

    const renderScrollbar = (index: number, isThumb: boolean): VNode | null => {
      if (!shouldShowScrollbar) return null;
      const color = isThumb
        ? (isActive ? focusedBorderColor : unfocusedBorderColor)
        : unfocusedBorderColor;
      return Text({ color }, scrollbarChars[index] ?? ' ');
    };

    const handleMultilineClick = (event: MouseEventData) => {
      const lineIndex = event.y - contentStartY;
      if (lineIndex < 0 || lineIndex >= visibleLines.length) return;

      const lineObj = visibleLines[lineIndex];
      const linePrompt = lineIndex === 0 && offset === 0 ? prompt : chars.border.vertical;
      const promptWidth = stringWidth(`${linePrompt} `);
      const column = event.x - contentStartX - promptWidth;
      const cursorOffset = getCursorIndexFromColumn(lineObj.text, column);
      const nextCursor = Math.min(value.length, lineObj.start + cursorOffset);

      state.setCursorPosition(nextCursor, { scroll: false });
    };

    const renderedLines = visibleLines.map((lineObj, i) => {
      const lineIndex = offset + i; // Absolute line index
      const isCursorLine = lineIndex === cursorLine;
      const line = lineObj.text;
      const renderPlaceholderLine = showPlaceholder;

      const linePrompt = i === 0 && offset === 0 ? prompt : chars.border.vertical;
      const scrollbarChar = shouldShowScrollbar ? (scrollbarChars[i] ?? ' ') : '';
      const isThumb = shouldShowScrollbar ? scrollbarChar === thumbChar : false;

      if (isCursorLine && isActive) {
        // Ensure cursorCol is within bounds of this line
        const safeCol = Math.min(Math.max(0, cursorCol), line.length);
        const before = line.slice(0, safeCol);
        const char = line[safeCol] || ' ';
        const after = line.slice(safeCol + 1);
        const lineWidth = stringWidth(before + char + after);
        const padCount = padForScrollbar ? Math.max(0, contentWidth - lineWidth) : 0;

        return Box(
          { flexDirection: 'row' },
          Text({ color: foreground }, `${linePrompt} `),
          Text(renderPlaceholderLine ? { color: 'mutedForeground', dim: true } : {}, before),
          Text({
            backgroundColor: cursorBg,
            color: renderPlaceholderLine ? cursorFg : cursorFg,
          }, char),
          Text(renderPlaceholderLine ? { color: 'mutedForeground', dim: true } : {}, after),
          padCount > 0 ? Text({}, ' '.repeat(padCount)) : null,
          renderScrollbar(i, isThumb)
        );
      }

      const lineWidth = stringWidth(line);
      const padCount = padForScrollbar ? Math.max(0, contentWidth - lineWidth) : 0;

      return Box(
        { flexDirection: 'row' },
        Text({ color: foreground }, `${linePrompt} `),
        Text(renderPlaceholderLine ? { color: 'mutedForeground', dim: true } : {}, line),
        padCount > 0 ? Text({}, ' '.repeat(padCount)) : null,
        renderScrollbar(i, isThumb)
      );
    });

    if (showCharCount) {
      const countText = `${value.length}${mergedOptions.maxLength ? '/' + mergedOptions.maxLength : ''}`;
      renderedLines.push(
        Box(
          { flexDirection: 'row', justifyContent: 'flex-end', paddingTop: 0 },
          Text({ color: 'mutedForeground', dim: true }, countText),
          shouldShowScrollbar ? Text({}, ' ') : null
        )
      );
    }

    return Box(
      { ...boxStyle, onClick: handleMultilineClick },
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

  const handleSingleLineClick = (event: MouseEventData) => {
    const borderSize = noBorder ? 0 : 1;
    const contentStartX = noBorder ? 0 : 2;
    const contentStartY = borderSize;
    const lineIndex = event.y - contentStartY;
    if (lineIndex !== 0) return;

    const promptWidth = stringWidth(`${prompt} `);
    const column = event.x - contentStartX - promptWidth;
    const cursorOffset = getCursorIndexFromColumn(displayValue, column);
    const nextCursor = Math.min(displayValue.length, cursorOffset);

    state.setCursorPosition(nextCursor, { scroll: false });
  };

  return Box(
    { ...rowStyle, onClick: handleSingleLineClick },
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

export interface TextInputProps extends TextInputOptions {
  state?: ReturnType<typeof createTextInput>;
}

export function useTextInputState(options: TextInputOptions = {}) {
  const state = useConst(() => createTextInput(options));
  state.updateOptions(options);
  return state;
}

/**
 * Simple standalone TextInput component
 */
export function TextInput({ state, ...options }: TextInputProps): VNode {
  const internalState = state
    ? (state.updateOptions(options), state)
    : isRenderingHooks()
    ? useTextInputState(options)
    : createTextInput(options);

  return renderTextInput(internalState, options);
}
