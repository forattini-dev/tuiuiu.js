import type { TextStyle } from './types.js';
import { fitTextToWidth, readRenderableSymbol, sliceAnsi, stringWidth } from './text-utils.js';
import { stripTerminalControls } from './terminal-sanitize.js';

/** Span styles cannot change paragraph geometry. Offsets are UTF-16, not cells. */
export type TextSpanStyle = Readonly<Omit<TextStyle, 'wrap'>>;
export interface TextSpan {
  readonly text: string;
  readonly style?: TextSpanStyle;
}

const STYLE_KEYS = ['color', 'backgroundColor', 'bold', 'dim', 'italic', 'underline',
  'underlineColor', 'strikethrough', 'inverse'] as const;

/** Snapshot caller-owned data and strip terminal protocols, including SGR. */
export function normalizeTextSpans(parts: readonly (string | number | TextSpan)[]): readonly TextSpan[] {
  return Object.freeze(parts.map(part => {
    if (typeof part !== 'object') return Object.freeze({ text: stripTerminalControls(String(part)) });
    const style: Record<string, unknown> = {};
    for (const key of STYLE_KEYS) {
      if (part.style?.[key] !== undefined) style[key] = part.style[key];
    }
    return Object.freeze({ text: stripTerminalControls(part.text), style: Object.freeze(style) });
  }));
}

export function textSpansEqual(left?: readonly TextSpan[], right?: readonly TextSpan[]): boolean {
  if (left === right) return true;
  if (!left || !right || left.length !== right.length) return false;
  return left.every((span, index) => span.text === right[index]!.text &&
    STYLE_KEYS.every(key => span.style?.[key] === right[index]!.style?.[key]));
}

/**
 * Use the same fitter as Text/layout. Recover source offsets for retained ink;
 * generated truncation markers have no source style. A grapheme spanning two
 * runs takes the style of its first code unit and is never split into cells.
 */
export function layoutTextSpans(
  spans: readonly TextSpan[], columns: number, wrap?: TextStyle['wrap'],
): TextSpan[][] {
  const source = spans.map(span => span.text).join('');
  const ranges: { end: number; style?: TextSpanStyle }[] = [];
  let end = 0;
  for (const span of spans) { end += span.text.length; ranges.push({ end, style: span.style }); }
  const styleAt = (offset: number): TextSpanStyle | undefined => {
    let low = 0;
    let high = ranges.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (ranges[middle]!.end <= offset) low = middle + 1;
      else high = middle;
    }
    return ranges[low]?.style;
  };
  const rows: TextSpan[][] = [];
  let sourceBase = 0;
  for (const line of source.split('\n')) {
    let searchFrom = 0;
    for (const fitted of fitTextToWidth(line, columns, wrap)) {
      const truncated = columns > 0 && wrap?.startsWith('truncate') && stringWidth(line) > columns;
      const match = truncated ? -1 : line.indexOf(fitted, searchFrom);
      let prefix = 0;
      let suffix = 0;
      if (truncated) {
        // Use the canonical column slicer, not string matching: a literal …
        // may coincide with the generated marker and must keep its own style.
        const available = columns - 1;
        prefix = wrap === 'truncate-start' ? 0
          : sliceAnsi(line, 0, wrap === 'truncate-middle' ? Math.ceil(available / 2) : available).length;
        suffix = wrap === 'truncate-start' ? sliceAnsi(line, stringWidth(line) - available).length
          : wrap === 'truncate-middle' ? sliceAnsi(line, stringWidth(line) - Math.floor(available / 2)).length : 0;
      }
      const row: TextSpan[] = [];
      let index = 0;
      while (index < fitted.length) {
        const symbol = readRenderableSymbol(fitted, index);
        if (!symbol) break;
        const sourceOffset = match >= 0 ? sourceBase + match + index
          : index < prefix ? sourceBase + index
          : index >= fitted.length - suffix ? sourceBase + line.length - fitted.length + index
          : -1;
        row.push({ text: symbol.symbol, style: sourceOffset >= 0 ? styleAt(sourceOffset) : undefined });
        index = symbol.nextIndex;
      }
      rows.push(row);
      if (match >= 0) searchFrom = match + fitted.length;
    }
    sourceBase += line.length + 1;
  }
  return rows;
}
