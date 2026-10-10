import { rebaseTextOffset, type TextDocument } from './text-document.js';
import { clampToGraphemeBoundary } from '../utils/grapheme.js';
import { stripTerminalControls } from '../utils/terminal-sanitize.js';

export interface TextSelectionSnapshot {
  readonly anchor: number;
  readonly head: number;
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/** Selection of source text, independent of editing and terminal geometry. */
export interface TextSelection {
  readonly document: TextDocument;
  readonly disposed: boolean;
  snapshot(): TextSelectionSnapshot;
  set(anchor: number, head: number): boolean;
  extend(head: number): boolean;
  clear(): boolean;
  selectAll(): boolean;
  /** Plain source text, with terminal protocols removed. No clipboard writes. */
  copyText(): string;
  subscribe(listener: (selection: TextSelectionSnapshot) => void): () => void;
  dispose(): void;
}

export function createTextSelection(document: TextDocument): TextSelection {
  let anchor = 0;
  let head = 0;
  let disposed = false;
  const listeners = new Set<Parameters<TextSelection['subscribe']>[0]>();
  const assertActive = () => { if (disposed) throw new Error('TextSelection has been disposed'); };
  const snapshot = (): TextSelectionSnapshot => {
    const start = Math.min(anchor, head);
    const end = Math.max(anchor, head);
    return Object.freeze({ anchor, head, start, end, text: document.snapshot().value.slice(start, end) });
  };
  const notify = () => {
    const next = snapshot();
    for (const listener of [...listeners]) listener(next);
  };
  const set = (nextAnchor: number, nextHead: number): boolean => {
    assertActive();
    if (!Number.isSafeInteger(nextAnchor) || !Number.isSafeInteger(nextHead)) {
      throw new RangeError('TextSelection requires safe integer UTF-16 offsets');
    }
    const value = document.snapshot().value;
    nextAnchor = clampToGraphemeBoundary(value, nextAnchor, 'left');
    nextHead = clampToGraphemeBoundary(value, nextHead, 'left');
    if (anchor === nextAnchor && head === nextHead) return false;
    anchor = nextAnchor;
    head = nextHead;
    notify();
    return true;
  };
  const unsubscribe = document.subscribe((next, change) => {
    anchor = rebaseTextOffset(anchor, next.value, change);
    head = rebaseTextOffset(head, next.value, change);
    // Content can change inside unchanged bounds. Subscribers still need repainting.
    notify();
  });
  return {
    document,
    get disposed() { return disposed; },
    snapshot,
    set,
    extend: nextHead => set(anchor, nextHead),
    clear: () => set(head, head),
    selectAll: () => set(0, document.snapshot().value.length),
    copyText: () => stripTerminalControls(snapshot().text),
    subscribe(listener) {
      assertActive();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      unsubscribe();
      listeners.clear();
    },
  };
}
