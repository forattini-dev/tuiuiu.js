import { getTextDocumentChange, type TextDocument, type TextDocumentLine } from './text-document.js';
import { clampToGraphemeBoundary, segmentGraphemes, type GraphemeInfo } from '../utils/grapheme.js';
import { stringWidth } from '../utils/text-utils.js';

export interface TextViewportOptions {
  width: number;
  wrap?: 'none' | 'word' | 'grapheme';
  tabSize?: number;
}

export interface TextViewportLine {
  text: string;
  /** Tabs expanded at their actual column; content otherwise unchanged. */
  displayText: string;
  start: number;
  end: number;
  width: number;
  logicalLine: number;
}

export interface TextViewport {
  configure(options: TextViewportOptions): void;
  lines(): readonly TextViewportLine[];
  positionAt(offset: number, affinity?: 'forward' | 'backward'): { row: number; column: number };
  offsetAt(row: number, column: number): number;
  /** Cell ranges for retained source ink. Line terminators have no cells. */
  rangeRects(start: number, end: number, firstRow?: number, rowCount?: number): readonly TextViewportRangeRect[];
}

export interface TextViewportRangeRect {
  readonly row: number;
  readonly column: number;
  readonly width: number;
  readonly start: number;
  readonly end: number;
}

/** Source controls are visible placeholders, never interpreted terminal protocols. */
function printable(segment: string): string {
  return segment.replace(/[\u0000-\u001f\u007f-\u009f]/gu, '\ufffd');
}

/** Internal shared projection for measurement and styled, source-indexed painting. */
export function projectViewportGrapheme(segment: string, column: number, tabSize: number): { text: string; width: number } {
  const text = segment === '\t' ? ' '.repeat(tabSize - column % tabSize) : printable(segment);
  return { text, width: stringWidth(text) };
}

function normalize(options: TextViewportOptions): Required<TextViewportOptions> {
  const wrap = options.wrap ?? 'word';
  const tabSize = options.tabSize ?? 4;
  if (!Number.isSafeInteger(options.width) || options.width < 1
    || !Number.isSafeInteger(tabSize) || tabSize < 1
    || !['none', 'word', 'grapheme'].includes(wrap)) {
    throw new RangeError('TextViewport requires a positive integer width/tabSize and a valid wrap mode');
  }
  return { width: options.width, wrap, tabSize };
}

/** Reflow changed logical lines; reuse other geometry without owning a listener. */
export function createTextViewport(document: TextDocument, initial: TextViewportOptions): TextViewport {
  let options = normalize(initial);
  let revision = -1;
  let rows: readonly TextViewportLine[] = [];
  let layouts: { source: TextDocumentLine; rows: readonly TextViewportLine[] }[] = [];
  const displayParts = (parts: readonly GraphemeInfo[], first = 0, end = parts.length) => {
    let width = 0;
    let displayText = '';
    for (let index = first; index < end; index++) {
      const projected = projectViewportGrapheme(parts[index]!.segment, width, options.tabSize);
      displayText += projected.text;
      width += projected.width;
    }
    return { displayText, width };
  };
  const display = (text: string) => displayParts(segmentGraphemes(text));
  const reflow = (logicalLine: number) => {
    const current = document.line(logicalLine);
    // Retained slices can otherwise pin a different whole document revision per
    // edited line in V8. Detach UTF-16 ink once per reflow, preserving lone surrogates.
    const source = { ...current, text: current.text.split('').join('') };
    const graphemes = segmentGraphemes(source.text);
    const nextRows: TextViewportLine[] = [];
    let first = 0;
    do {
      let next = first;
      let width = 0;
      let wordBreak = -1;
      while (next < graphemes.length) {
        const part = graphemes[next]!;
        const cells = part.segment === '\t' ? options.tabSize - width % options.tabSize : stringWidth(printable(part.segment));
        if (options.wrap !== 'none' && next > first && width + cells > options.width) break;
        width += cells;
        if (/^[\t ]$/u.test(part.segment) && next > first) wordBreak = next;
        next++;
        if (options.wrap !== 'none' && width >= options.width) break;
      }
      if (options.wrap === 'word' && next < graphemes.length && wordBreak > first) next = wordBreak;
      const start = graphemes[first]?.index ?? source.text.length;
      const end = next > first ? graphemes[next - 1]!.end : start;
      const text = source.text.slice(start, end);
      nextRows.push(Object.freeze({ text, start: source.start + start, end: source.start + end,
        logicalLine, ...displayParts(graphemes, first, next) }));
      first = next;
    } while (first < graphemes.length);
    return { source, rows: Object.freeze(nextRows) };
  };
  const logicalLineAt = (offset: number) => {
    let low = 0;
    let high = layouts.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (layouts[middle]!.source.start <= offset) low = middle + 1;
      else high = middle;
    }
    return Math.max(0, low - 1);
  };
  const lines = () => {
    const snapshot = document.snapshot();
    if (revision === snapshot.revision) return rows;
    const change = revision >= 0 ? getTextDocumentChange(document, revision) : undefined;
    if (change && change.revision === snapshot.revision) {
      const first = logicalLineAt(change.start);
      const last = logicalLineAt(change.end);
      const insertedLines = change.inserted.split('\n').length - 1;
      const lineDelta = insertedLines - (last - first);
      const offsetDelta = change.inserted.length - (change.end - change.start);
      const next = layouts.slice(0, first);
      for (let index = first; index <= first + insertedLines; index++) next.push(reflow(index));
      for (let index = last + 1; index < layouts.length; index++) {
        const layout = layouts[index]!;
        next.push(lineDelta === 0 && offsetDelta === 0 ? layout : {
          source: { ...layout.source, start: layout.source.start + offsetDelta, end: layout.source.end + offsetDelta },
          rows: Object.freeze(layout.rows.map(row => Object.freeze({ ...row, start: row.start + offsetDelta,
            end: row.end + offsetDelta, logicalLine: row.logicalLine + lineDelta }))),
        });
      }
      layouts = next;
    } else layouts = Array.from({ length: snapshot.lineCount }, (_, index) => reflow(index));
    rows = Object.freeze(layouts.flatMap(layout => layout.rows));
    revision = snapshot.revision;
    return rows;
  };
  return {
    configure(next) {
      const normalized = normalize(next);
      if (normalized.width === options.width && normalized.wrap === options.wrap && normalized.tabSize === options.tabSize) return;
      options = normalized;
      revision = -1;
    },
    lines,
    positionAt(offset, affinity = 'forward') {
      if (!Number.isSafeInteger(offset)) throw new RangeError('TextViewport offset must be a safe integer');
      const bounded = clampToGraphemeBoundary(document.snapshot().value, offset, 'left');
      const current = lines();
      let low = 0;
      let high = current.length;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (current[middle]!.start <= bounded) low = middle + 1;
        else high = middle;
      }
      let row = Math.max(0, low - 1);
      if (affinity === 'backward' && row > 0 && current[row]!.start === bounded && current[row - 1]!.end === bounded) row--;
      const line = current[row]!;
      return { row, column: display(line.text.slice(0, Math.max(0, bounded - line.start))).width };
    },
    offsetAt(row, column) {
      if (!Number.isSafeInteger(row) || !Number.isSafeInteger(column)) {
        throw new RangeError('TextViewport row/column must be safe integers');
      }
      const current = lines();
      const line = current[Math.max(0, Math.min(row, current.length - 1))]!;
      let width = 0;
      let offset = line.start;
      for (const part of segmentGraphemes(line.text)) {
        const cells = part.segment === '\t' ? options.tabSize - width % options.tabSize : stringWidth(printable(part.segment));
        if (width + cells > Math.max(0, column)) break;
        width += cells;
        offset = line.start + part.end;
      }
      return offset;
    },
    rangeRects(start, end, firstRow = 0, rowCount = Number.MAX_SAFE_INTEGER) {
      if (![start, end, firstRow, rowCount].every(Number.isSafeInteger) || start > end
        || firstRow < 0 || rowCount < 0) {
        throw new RangeError('TextViewport ranges require ordered safe offsets and non-negative row bounds');
      }
      if (start === end || rowCount === 0) return Object.freeze([]);
      const value = document.snapshot().value;
      const first = clampToGraphemeBoundary(value, start, 'left');
      const last = clampToGraphemeBoundary(value, end, 'left');
      const rects: TextViewportRangeRect[] = [];
      const current = lines();
      for (let row = firstRow; row < Math.min(current.length, firstRow + rowCount); row++) {
        const line = current[row]!;
        const from = Math.max(first, line.start);
        const to = Math.min(last, line.end);
        if (from >= to) continue;
        const column = display(line.text.slice(0, from - line.start)).width;
        const right = display(line.text.slice(0, to - line.start)).width;
        rects.push(Object.freeze({ row, column, width: right - column, start: from, end: to }));
      }
      return Object.freeze(rects);
    },
  };
}
