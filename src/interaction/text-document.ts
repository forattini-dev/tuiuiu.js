import { clampToGraphemeBoundary } from '../utils/grapheme.js';

export interface TextDocumentSnapshot {
  value: string;
  revision: number;
  lineCount: number;
}

export interface TextDocumentChange {
  start: number;
  end: number;
  inserted: string;
  revision: number;
}

/** Internal shared endpoint policy: stick before insertions at the endpoint. */
export function rebaseTextOffset(offset: number, value: string, change: TextDocumentChange): number {
  const next = offset <= change.start ? offset
    : offset >= change.end ? offset + change.inserted.length - (change.end - change.start)
    : change.start + change.inserted.length;
  return clampToGraphemeBoundary(value, next, 'left');
}

export interface TextDocumentLine {
  text: string;
  start: number;
  end: number;
}

export interface TextDocumentOptions {
  initialValue?: string;
  /** Maximum UTF-16 length, never cutting through a grapheme. */
  maxLength?: number;
}

export interface TextDocument {
  readonly maxLength: number;
  snapshot(): TextDocumentSnapshot;
  line(index: number): TextDocumentLine;
  setValue(value: string): boolean;
  replace(start: number, end: number, text: string): boolean;
  subscribe(listener: (snapshot: TextDocumentSnapshot, change: TextDocumentChange) => void): () => void;
}

/** Content/revisions are independent of cursor state and terminal geometry. */
export function createTextDocument(options: TextDocumentOptions = {}): TextDocument {
  const maxLength = options.maxLength ?? Number.MAX_SAFE_INTEGER;
  if (!Number.isSafeInteger(maxLength) || maxLength < 0) {
    throw new RangeError('TextDocument maxLength must be a non-negative safe integer');
  }
  const limit = (text: string, available: number) => text.slice(0,
    text.length <= available ? text.length : clampToGraphemeBoundary(text, available, 'left'));
  let value = limit(options.initialValue ?? '', maxLength);
  let revision = 0;
  let lineStarts: number[] | null = null;
  const listeners = new Set<Parameters<TextDocument['subscribe']>[0]>();
  const getLineStarts = () => {
    if (!lineStarts) {
      lineStarts = [0];
      for (let index = 0; index < value.length; index++) {
        if (value[index] === '\n') lineStarts.push(index + 1);
      }
    }
    return lineStarts;
  };
  const snapshot = (): TextDocumentSnapshot => ({ value, revision, lineCount: getLineStarts().length });
  const commit = (next: string, change: Omit<TextDocumentChange, 'revision'>) => {
    if (next === value) return false;
    value = next;
    revision++;
    lineStarts = null;
    const current = snapshot();
    for (const listener of [...listeners]) listener(current, { ...change, revision });
    return true;
  };
  return {
    maxLength,
    snapshot,
    line(index) {
      const starts = getLineStarts();
      if (!Number.isSafeInteger(index) || index < 0 || index >= starts.length) {
        throw new RangeError('TextDocument line index is outside the document');
      }
      const start = starts[index]!;
      let end = index + 1 < starts.length ? starts[index + 1]! - 1 : value.length;
      if (index + 1 < starts.length && value[end - 1] === '\r') end--;
      return { text: value.slice(start, end), start, end };
    },
    setValue(nextValue) {
      const next = limit(nextValue, maxLength);
      return commit(next, { start: 0, end: value.length, inserted: next });
    },
    replace(start, end, text) {
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end) {
        throw new RangeError('TextDocument range must be ordered safe integer UTF-16 offsets');
      }
      const first = clampToGraphemeBoundary(value, start, 'left');
      const last = start === end ? first : clampToGraphemeBoundary(value, end, 'right');
      const inserted = limit(text, Math.max(0, maxLength - (value.length - (last - first))));
      return commit(value.slice(0, first) + inserted + value.slice(last), { start: first, end: last, inserted });
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
