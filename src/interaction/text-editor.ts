import {
  clampToGraphemeBoundary,
  nextGraphemeBoundary,
  previousGraphemeBoundary,
  nextWordBoundary,
  previousWordBoundary,
} from '../utils/grapheme.js';
import { createTextDocument, rebaseTextOffset, type TextDocument, type TextDocumentOptions } from './text-document.js';

export interface TextEditorSnapshot {
  value: string;
  cursor: number;
}

export interface TextEditorOptions extends TextDocumentOptions {
  document?: TextDocument;
  /** Bounded history; zero disables undo (default: 100 edits). */
  historyLimit?: number;
  /** Adapter-owned metadata captured/restored atomically with undo checkpoints.
   * Capture must return an independent snapshot; restore must not mutate the document.
   */
  historyState?: { capture(): unknown; restore(state: unknown): void };
}

export interface TextEditorSelection {
  anchor: number;
  head: number;
  start: number;
  end: number;
  text: string;
}

export interface TextEditor {
  readonly document: TextDocument;
  readonly disposed: boolean;
  dispose(): void;
  snapshot(): TextEditorSnapshot;
  selection(): TextEditorSelection;
  setSelection(anchor: number, head: number): void;
  setValue(value: string, cursor?: number): void;
  insert(text: string): boolean;
  /** Replace a source range; optional state commits adapter metadata before notification. */
  replace(start: number, end: number, text: string, state?: unknown): boolean;
  backspace(word?: boolean): boolean;
  deleteForward(word?: boolean): boolean;
  moveLeft(word?: boolean, extend?: boolean): boolean;
  moveRight(word?: boolean, extend?: boolean): boolean;
  moveHome(extend?: boolean): boolean;
  moveEnd(extend?: boolean): boolean;
  undo(): boolean;
  redo(): boolean;
  canUndo(): boolean;
  canRedo(): boolean;
  setHistoryLimit(limit: number): void;
  subscribe(listener: (snapshot: TextEditorSnapshot) => void): () => void;
}

/** Scalar, renderer-independent editor shared by prompt and input adapters. */
export function createTextEditor(options: TextEditorOptions = {}): TextEditor {
  const listeners = new Set<(snapshot: TextEditorSnapshot) => void>();
  if (options.document && (options.initialValue !== undefined || options.maxLength !== undefined)) {
    throw new TypeError('TextEditor document owns initialValue and maxLength');
  }
  let historyLimit = options.historyLimit ?? 100;
  if (!Number.isSafeInteger(historyLimit) || historyLimit < 0) {
    throw new RangeError('TextEditor historyLimit must be a non-negative safe integer');
  }
  const document = options.document ?? createTextDocument(options);
  let value = document.snapshot().value;
  let cursor = value.length;
  let anchor = cursor;
  let disposed = false;
  let editing = false;
  type Checkpoint = TextEditorSnapshot & { anchor: number; state: unknown };
  const past: Checkpoint[] = [];
  const future: Checkpoint[] = [];
  const assertActive = () => { if (disposed) throw new Error('TextEditor has been disposed'); };

  const snapshot = (): TextEditorSnapshot => ({ value, cursor });
  const notify = () => {
    const next = snapshot();
    for (const listener of [...listeners]) listener(next);
  };
  const checkpoint = (): Checkpoint => ({ value, cursor, anchor, state: options.historyState?.capture() });
  const updateCursor = (next: number, extend = false) => {
    assertActive();
    const clamped = clampToGraphemeBoundary(value, next, 'left');
    if (clamped === cursor && (extend || anchor === cursor)) return false;
    cursor = clamped;
    if (!extend) anchor = cursor;
    notify();
    return true;
  };
  const replace = (start: number, end: number, text: string, state?: unknown) => {
    assertActive();
    if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end) {
      throw new RangeError('TextEditor range must be ordered safe integer UTF-16 offsets');
    }
    const first = clampToGraphemeBoundary(value, start, 'left');
    const last = start === end ? first : clampToGraphemeBoundary(value, end, 'right');
    const before = checkpoint();
    editing = true;
    let changed: boolean;
    try { changed = document.replace(first, last, text); } finally { editing = false; }
    if (!changed && !(options.historyState && state !== undefined)) return false;
    if (options.historyState && state !== undefined) options.historyState.restore(state);
    if (historyLimit > 0) {
      past.push(before);
      if (past.length > historyLimit) past.shift();
    }
    future.length = 0;
    const insertedLength = value.length - (before.value.length - (last - first));
    // Insertion can merge with the following combining marks or ZWJ sequence.
    cursor = clampToGraphemeBoundary(value, first + insertedLength, 'right');
    anchor = cursor;
    notify();
    return true;
  };
  const selection = (): TextEditorSelection => {
    const start = Math.min(anchor, cursor);
    const end = Math.max(anchor, cursor);
    return { anchor, head: cursor, start, end, text: value.slice(start, end) };
  };
  const unsubscribe = document.subscribe((next, change) => {
    value = next.value;
    if (editing) return;
    cursor = rebaseTextOffset(cursor, value, change);
    anchor = rebaseTextOffset(anchor, value, change);
    past.length = 0;
    future.length = 0;
    notify();
  });
  const restore = (from: Checkpoint[], to: Checkpoint[]) => {
    assertActive();
    const next = from.pop();
    if (!next) return false;
    to.push(checkpoint());
    editing = true;
    try { document.setValue(next.value); } finally { editing = false; }
    cursor = next.cursor;
    anchor = next.anchor;
    options.historyState?.restore(next.state);
    notify();
    return true;
  };

  return {
    document,
    get disposed() { return disposed; },
    dispose() { if (disposed) return; disposed = true; unsubscribe(); listeners.clear(); past.length = 0; future.length = 0; },
    snapshot,
    selection,
    setSelection(nextAnchor, nextHead) {
      assertActive();
      if (!Number.isSafeInteger(nextAnchor) || !Number.isSafeInteger(nextHead)) {
        throw new RangeError('TextEditor selection must use safe integer UTF-16 offsets');
      }
      const first = clampToGraphemeBoundary(value, nextAnchor, 'left');
      const last = clampToGraphemeBoundary(value, nextHead, 'left');
      if (first === anchor && last === cursor) return;
      anchor = first;
      cursor = last;
      notify();
    },
    setValue(nextValue, nextCursor = nextValue.length) {
      assertActive();
      if (!Number.isSafeInteger(nextCursor)) {
        throw new RangeError('TextEditor cursor must be a safe integer UTF-16 offset');
      }
      editing = true;
      try { document.setValue(nextValue); } finally { editing = false; }
      value = document.snapshot().value;
      cursor = clampToGraphemeBoundary(value, nextCursor, 'left');
      anchor = cursor;
      past.length = 0;
      future.length = 0;
      notify();
    },
    insert(text) {
      const { start, end } = selection();
      return replace(start, end, text);
    },
    replace,
    backspace(word = false) {
      assertActive();
      if (anchor !== cursor) { const { start, end } = selection(); return replace(start, end, ''); }
      if (cursor === 0) return false;
      const start = word
        ? previousWordBoundary(value, cursor)
        : previousGraphemeBoundary(value, cursor);
      return replace(start, cursor, '');
    },
    deleteForward(word = false) {
      assertActive();
      if (anchor !== cursor) { const { start, end } = selection(); return replace(start, end, ''); }
      if (cursor === value.length) return false;
      const end = word
        ? nextWordBoundary(value, cursor)
        : nextGraphemeBoundary(value, cursor);
      return replace(cursor, end, '');
    },
    moveLeft(word = false, extend = false) {
      if (!extend && anchor !== cursor) return updateCursor(Math.min(anchor, cursor));
      return updateCursor(word
        ? previousWordBoundary(value, cursor)
        : previousGraphemeBoundary(value, cursor), extend);
    },
    moveRight(word = false, extend = false) {
      if (!extend && anchor !== cursor) return updateCursor(Math.max(anchor, cursor));
      return updateCursor(word
        ? nextWordBoundary(value, cursor)
        : nextGraphemeBoundary(value, cursor), extend);
    },
    moveHome(extend = false) {
      return updateCursor(0, extend);
    },
    moveEnd(extend = false) {
      return updateCursor(value.length, extend);
    },
    undo: () => restore(past, future),
    redo: () => restore(future, past),
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    setHistoryLimit(limit) {
      assertActive();
      if (!Number.isSafeInteger(limit) || limit < 0) {
        throw new RangeError('TextEditor historyLimit must be a non-negative safe integer');
      }
      if (historyLimit === limit) return;
      historyLimit = limit;
      if (past.length > limit) past.splice(0, past.length - limit);
      if (future.length > limit) future.splice(0, future.length - limit);
      notify();
    },
    subscribe(listener) {
      assertActive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
