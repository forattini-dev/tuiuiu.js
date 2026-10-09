import {
  clampToGraphemeBoundary,
  nextGraphemeBoundary,
  previousGraphemeBoundary,
  nextWordBoundary,
  previousWordBoundary,
} from '../utils/grapheme.js';

export interface TextEditorSnapshot {
  value: string;
  cursor: number;
}

export interface TextEditorOptions {
  initialValue?: string;
  maxLength?: number;
}

export interface TextEditor {
  snapshot(): TextEditorSnapshot;
  setValue(value: string, cursor?: number): void;
  insert(text: string): boolean;
  backspace(word?: boolean): boolean;
  deleteForward(word?: boolean): boolean;
  moveLeft(word?: boolean): boolean;
  moveRight(word?: boolean): boolean;
  moveHome(): boolean;
  moveEnd(): boolean;
  subscribe(listener: (snapshot: TextEditorSnapshot) => void): () => void;
}

/** Scalar, renderer-independent editor shared by prompt and input adapters. */
export function createTextEditor(options: TextEditorOptions = {}): TextEditor {
  const listeners = new Set<(snapshot: TextEditorSnapshot) => void>();
  const maxLength = options.maxLength ?? Number.MAX_SAFE_INTEGER;
  if (!Number.isSafeInteger(maxLength) || maxLength < 0) {
    throw new RangeError('TextEditor maxLength must be a non-negative safe integer');
  }
  const initialValue = options.initialValue ?? '';
  let value = initialValue.slice(0, clampToGraphemeBoundary(initialValue, maxLength, 'left'));
  let cursor = value.length;

  const snapshot = (): TextEditorSnapshot => ({ value, cursor });
  const notify = () => {
    const next = snapshot();
    for (const listener of [...listeners]) listener(next);
  };
  const updateCursor = (next: number) => {
    const clamped = clampToGraphemeBoundary(value, next, 'left');
    if (clamped === cursor) return false;
    cursor = clamped;
    notify();
    return true;
  };
  const replace = (start: number, end: number, text: string) => {
    const available = Math.max(0, maxLength - (value.length - (end - start)));
    const insertion = text.slice(0, clampToGraphemeBoundary(text, available, 'left'));
    if (!insertion && start === end) return false;
    value = value.slice(0, start) + insertion + value.slice(end);
    // Insertion can merge with the following combining marks or ZWJ sequence.
    cursor = clampToGraphemeBoundary(value, start + insertion.length, 'right');
    notify();
    return true;
  };

  return {
    snapshot,
    setValue(nextValue, nextCursor = nextValue.length) {
      if (!Number.isSafeInteger(nextCursor)) {
        throw new RangeError('TextEditor cursor must be a safe integer UTF-16 offset');
      }
      value = nextValue.slice(
        0,
        clampToGraphemeBoundary(nextValue, maxLength, 'left'),
      );
      cursor = clampToGraphemeBoundary(value, nextCursor, 'left');
      notify();
    },
    insert(text) {
      return replace(cursor, cursor, text);
    },
    backspace(word = false) {
      if (cursor === 0) return false;
      const start = word
        ? previousWordBoundary(value, cursor)
        : previousGraphemeBoundary(value, cursor);
      return replace(start, cursor, '');
    },
    deleteForward(word = false) {
      if (cursor === value.length) return false;
      const end = word
        ? nextWordBoundary(value, cursor)
        : nextGraphemeBoundary(value, cursor);
      return replace(cursor, end, '');
    },
    moveLeft(word = false) {
      return updateCursor(word
        ? previousWordBoundary(value, cursor)
        : previousGraphemeBoundary(value, cursor));
    },
    moveRight(word = false) {
      return updateCursor(word
        ? nextWordBoundary(value, cursor)
        : nextGraphemeBoundary(value, cursor));
    },
    moveHome() {
      return updateCursor(0);
    },
    moveEnd() {
      return updateCursor(value.length);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
