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

// One change per live document, not a retained revision journal or subscription.
// Viewports that missed a revision fall back to fresh reflow safely.
const latestChanges = new WeakMap<TextDocument, Readonly<TextDocumentChange>>();

/** Internal raw UTF-16 invalidation range, not the public selection-rebase event. */
export function getTextDocumentChange(document: TextDocument, fromRevision: number): Readonly<TextDocumentChange> | undefined {
  const change = latestChanges.get(document);
  return change?.revision === fromRevision + 1 ? change : undefined;
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
  const commit = (next: string, change: Omit<TextDocumentChange, 'revision'>, invalidation = change) => {
    if (next === value) return false;
    const starts = getLineStarts();
    const after = (offset: number) => {
      let low = 0;
      let high = starts.length;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (starts[middle]! <= offset) low = middle + 1;
        else high = middle;
      }
      return low;
    };
    const nextStarts = starts.slice(0, after(invalidation.start));
    for (let index = 0; index < invalidation.inserted.length; index++) {
      if (invalidation.inserted[index] === '\n') nextStarts.push(invalidation.start + index + 1);
    }
    const delta = invalidation.inserted.length - (invalidation.end - invalidation.start);
    for (let index = after(invalidation.end); index < starts.length; index++) nextStarts.push(starts[index]! + delta);
    value = next;
    revision++;
    lineStarts = nextStarts;
    latestChanges.set(document, Object.freeze({ ...invalidation, revision }));
    const current = snapshot();
    for (const listener of [...listeners]) listener(current, { ...change, revision });
    return true;
  };
  const document: TextDocument = {
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
      if (next === value) return false;
      // Geometry can retain intact lines even when callers replace the whole value.
      // Keep the public full-replacement event for cursor rebasing/history semantics.
      let start = 0;
      const sharedLength = Math.min(value.length, next.length);
      while (start < sharedLength && value[start] === next[start]) start++;
      let end = value.length;
      let nextEnd = next.length;
      while (end > start && nextEnd > start && value[end - 1] === next[nextEnd - 1]) { end--; nextEnd--; }
      return commit(next, { start: 0, end: value.length, inserted: next },
        { start, end, inserted: next.slice(start, nextEnd) });
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
  return document;
}
