import type { TextDocument } from './text-document.js';
import { clampToGraphemeBoundary, segmentGraphemes } from '../utils/grapheme.js';
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

/** Reflow cached by document revision and viewport configuration. */
export function createTextViewport(document: TextDocument, initial: TextViewportOptions): TextViewport {
  let options = normalize(initial);
  let revision = -1;
  let rows: readonly TextViewportLine[] = [];
  const display = (text: string) => {
    let width = 0;
    let displayText = '';
    for (const { segment } of segmentGraphemes(text)) {
      const cells = segment === '\t' ? options.tabSize - width % options.tabSize : stringWidth(segment);
      displayText += segment === '\t' ? ' '.repeat(cells) : segment;
      width += cells;
    }
    return { displayText, width };
  };
  const lines = () => {
    const snapshot = document.snapshot();
    if (revision === snapshot.revision) return rows;
    const nextRows: TextViewportLine[] = [];
    for (let logicalLine = 0; logicalLine < snapshot.lineCount; logicalLine++) {
      const source = document.line(logicalLine);
      const graphemes = segmentGraphemes(source.text);
      let first = 0;
      do {
        let next = first;
        let width = 0;
        let wordBreak = -1;
        while (next < graphemes.length) {
          const part = graphemes[next]!;
          const cells = part.segment === '\t' ? options.tabSize - width % options.tabSize : stringWidth(part.segment);
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
          logicalLine, ...display(text) }));
        first = next;
      } while (first < graphemes.length);
    }
    rows = Object.freeze(nextRows);
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
      let row = current.findIndex((line, index) => bounded >= line.start && (bounded < line.end
        || (bounded === line.end && (affinity === 'backward' || current[index + 1]?.start !== bounded))));
      if (row < 0) row = current.length - 1;
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
        const cells = part.segment === '\t' ? options.tabSize - width % options.tabSize : stringWidth(part.segment);
        if (width + cells > Math.max(0, column)) break;
        width += cells;
        offset = line.start + part.end;
      }
      return offset;
    },
  };
}
