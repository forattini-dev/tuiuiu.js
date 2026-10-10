import type { TextSpan, TextSpanStyle } from './styled-text.js';

/** UTF-16 display intervals. Generated decoration deliberately has no source. */
export interface TextSourceRange {
  readonly start: number;
  readonly end: number;
  readonly sourceStart: number;
  readonly sourceEnd: number;
}

export interface TextProjection {
  readonly text: string;
  readonly spans: readonly TextSpan[];
  readonly ranges: readonly TextSourceRange[];
}

/** Internal builder shared by inline and block projections, never cell geometry. */
export function createTextProjectionBuilder() {
  const spans: TextSpan[] = [];
  const ranges: TextSourceRange[] = [];
  let length = 0;
  const append = (text: string, style?: TextSpanStyle, sourceStart?: number, sourceEnd = (sourceStart ?? 0) + text.length) => {
    if (!text) return;
    const previous = spans.at(-1);
    if (previous && previous.style === style) spans[spans.length - 1] = { text: previous.text + text, style };
    else spans.push({ text, style });
    if (sourceStart !== undefined) {
      const last = ranges.at(-1);
      if (last && last.end === length && last.sourceEnd === sourceStart
        && last.end - last.start === last.sourceEnd - last.sourceStart
        && text.length === sourceEnd - sourceStart) {
        ranges[ranges.length - 1] = { ...last, end: length + text.length, sourceEnd };
      } else ranges.push({ start: length, end: length + text.length, sourceStart, sourceEnd });
    }
    length += text.length;
  };
  return {
    append,
    appendProjection(projection: TextProjection) {
      const base = length;
      for (const span of projection.spans) append(span.text, span.style);
      for (const range of projection.ranges) ranges.push({ ...range, start: base + range.start, end: base + range.end });
    },
    finish(): TextProjection {
      return Object.freeze({ text: spans.map(span => span.text).join(''),
        spans: Object.freeze(spans.map(span => Object.freeze({ text: span.text,
          style: span.style && Object.freeze({ ...span.style }) }))),
        ranges: Object.freeze(ranges.map(range => Object.freeze({ ...range }))) });
    },
  };
}

/** Only intersecting ink contributes; concealed interior syntax stays in the range. */
export function projectedSourceRange(projection: TextProjection, start: number, end: number): { start: number; end: number } | null {
  let first = Infinity;
  let last = -Infinity;
  for (const range of projection.ranges) {
    const left = Math.max(start, range.start);
    const right = Math.min(end, range.end);
    if (right <= left) continue;
    const linear = range.end - range.start === range.sourceEnd - range.sourceStart;
    first = Math.min(first, linear ? range.sourceStart + left - range.start : range.sourceStart);
    last = Math.max(last, linear ? range.sourceStart + right - range.start : range.sourceEnd);
  }
  return first === Infinity ? null : { start: first, end: last };
}

/** Compose inline concealment with block normalization without flattening offsets. */
export function composeTextProjection(display: TextProjection, source: TextProjection): TextProjection {
  const ranges: TextSourceRange[] = [];
  let cursor = 0;
  for (const outer of display.ranges) {
    while (cursor < source.ranges.length && source.ranges[cursor]!.end <= outer.sourceStart) cursor++;
    for (let index = cursor; index < source.ranges.length; index++) {
      const inner = source.ranges[index]!;
      if (inner.start >= outer.sourceEnd) break;
      const left = Math.max(outer.sourceStart, inner.start);
      const right = Math.min(outer.sourceEnd, inner.end);
      if (right <= left) continue;
      const linear = inner.end - inner.start === inner.sourceEnd - inner.sourceStart;
      ranges.push(Object.freeze({ start: outer.start + left - outer.sourceStart,
        end: outer.start + right - outer.sourceStart,
        sourceStart: linear ? inner.sourceStart + left - inner.start : inner.sourceStart,
        sourceEnd: linear ? inner.sourceStart + right - inner.start : inner.sourceEnd }));
    }
  }
  return Object.freeze({ ...display, ranges: Object.freeze(ranges) });
}
