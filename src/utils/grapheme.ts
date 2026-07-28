/**
 * Grapheme-cluster helpers used by rendering and editable text.
 *
 * JavaScript string indexes are UTF-16 offsets. These helpers preserve that
 * public representation while ensuring movement and deletion only land on
 * Unicode grapheme boundaries.
 */

export interface GraphemeInfo {
  segment: string;
  index: number;
  end: number;
}

interface SegmentsLike extends Iterable<{ segment: string; index: number }> {
  containing(index?: number): { segment: string; index: number } | undefined;
}

interface SegmenterLike {
  segment(input: string): SegmentsLike;
}

let segmenter: SegmenterLike | null | undefined;
const markCache = new Map<number, boolean>();
const MARK_CACHE_LIMIT = 256;

function getSegmenter(): SegmenterLike | null {
  if (segmenter !== undefined) {
    return segmenter;
  }

  const Segmenter = (Intl as typeof Intl & {
    Segmenter?: new (
      locale?: string | string[],
      options?: { granularity: 'grapheme' },
    ) => SegmenterLike;
  }).Segmenter;

  segmenter = Segmenter ? new Segmenter(undefined, { granularity: 'grapheme' }) : null;
  return segmenter;
}

function isFallbackContinuation(code: number): boolean {
  return (
    code === 0x200d ||
    (code >= 0x0300 && code <= 0x036f) ||
    (code >= 0x1ab0 && code <= 0x1aff) ||
    (code >= 0x1dc0 && code <= 0x1dff) ||
    (code >= 0x20d0 && code <= 0x20ff) ||
    (code >= 0xfe00 && code <= 0xfe0f) ||
    (code >= 0xfe20 && code <= 0xfe2f) ||
    (code >= 0x1f3fb && code <= 0x1f3ff) ||
    (code >= 0xe0020 && code <= 0xe007f) ||
    (code >= 0xe0100 && code <= 0xe01ef)
  );
}

function isMark(code: number): boolean {
  const cached = markCache.get(code);
  if (cached !== undefined) return cached;

  const result = /\p{M}/u.test(String.fromCodePoint(code));
  if (markCache.size >= MARK_CACHE_LIMIT) markCache.clear();
  markCache.set(code, result);
  return result;
}

function isRegionalIndicator(code: number): boolean {
  return code >= 0x1f1e6 && code <= 0x1f1ff;
}

function isHangulJamo(code: number): boolean {
  return (
    (code >= 0x1100 && code <= 0x11ff) ||
    (code >= 0xa960 && code <= 0xa97f) ||
    (code >= 0xd7b0 && code <= 0xd7ff)
  );
}

function isPrependCodePoint(code: number): boolean {
  return (
    (code >= 0x0600 && code <= 0x0605) ||
    code === 0x06dd ||
    code === 0x070f ||
    code === 0x0890 ||
    code === 0x0891 ||
    code === 0x08e2 ||
    code === 0x0d4e ||
    code === 0x110bd ||
    code === 0x110cd
  );
}

function canReadSingleCodePoint(text: string, code: number, end: number): boolean {
  if (isMark(code) || isPrependCodePoint(code) || isHangulJamo(code)) return false;
  const next = text.codePointAt(end);
  if (next === undefined) return true;
  if (
    isFallbackContinuation(next) ||
    isMark(next) ||
    isHangulJamo(next) ||
    (isRegionalIndicator(code) && isRegionalIndicator(next)) ||
    (code === 0x0d && next === 0x0a)
  ) {
    return false;
  }
  return true;
}

function fallbackSegments(text: string): GraphemeInfo[] {
  const result: GraphemeInfo[] = [];
  let index = 0;

  while (index < text.length) {
    const start = index;
    let joinNext = false;
    const first = text.codePointAt(index)!;
    index += first > 0xffff ? 2 : 1;

    while (index < text.length) {
      const code = text.codePointAt(index)!;
      if (!joinNext && !isFallbackContinuation(code)) {
        break;
      }
      index += code > 0xffff ? 2 : 1;
      joinNext = code === 0x200d;
    }

    result.push({ segment: text.slice(start, index), index: start, end: index });
  }

  return result;
}

export function segmentGraphemes(text: string): GraphemeInfo[] {
  const activeSegmenter = getSegmenter();
  if (!activeSegmenter) {
    return fallbackSegments(text);
  }

  const segments = [...activeSegmenter.segment(text)];
  return segments.map((entry, index) => ({
    segment: entry.segment,
    index: entry.index,
    end: segments[index + 1]?.index ?? text.length,
  }));
}

/**
 * Read the grapheme containing a UTF-16 offset without segmenting the entire
 * remaining string. Renderers call this once per visible symbol, so an
 * eager `segmentGraphemes(text.slice(offset))` would become quadratic.
 */
export function readGrapheme(text: string, position: number): GraphemeInfo | null {
  if (position < 0 || position >= text.length) return null;
  const code = text.codePointAt(position);
  if (code === undefined) return null;
  const codePointEnd = position + (code > 0xffff ? 2 : 1);
  if (canReadSingleCodePoint(text, code, codePointEnd)) {
    return {
      segment: text.slice(position, codePointEnd),
      index: position,
      end: codePointEnd,
    };
  }

  const activeSegmenter = getSegmenter();
  if (activeSegmenter) {
    const entry = activeSegmenter.segment(text).containing(position);
    if (!entry) return null;
    return {
      segment: entry.segment,
      index: entry.index,
      end: entry.index + entry.segment.length,
    };
  }

  // The fallback renderer advances only through boundaries returned here.
  let end = codePointEnd;
  let joinNext = false;
  while (end < text.length) {
    const code = text.codePointAt(end)!;
    if (!joinNext && !isFallbackContinuation(code)) break;
    end += code > 0xffff ? 2 : 1;
    joinNext = code === 0x200d;
  }
  return { segment: text.slice(position, end), index: position, end };
}

export function previousGraphemeBoundary(text: string, position: number): number {
  const bounded = Math.max(0, Math.min(position, text.length));
  let previous = 0;
  for (const grapheme of segmentGraphemes(text)) {
    if (grapheme.end >= bounded) {
      return grapheme.index;
    }
    previous = grapheme.end;
  }
  return previous;
}

export function nextGraphemeBoundary(text: string, position: number): number {
  const bounded = Math.max(0, Math.min(position, text.length));
  for (const grapheme of segmentGraphemes(text)) {
    if (grapheme.end > bounded) {
      return grapheme.end;
    }
  }
  return text.length;
}

export function clampToGraphemeBoundary(
  text: string,
  position: number,
  direction: 'nearest' | 'left' | 'right' = 'nearest',
): number {
  const bounded = Math.max(0, Math.min(position, text.length));
  for (const grapheme of segmentGraphemes(text)) {
    if (bounded === grapheme.index || bounded === grapheme.end) {
      return bounded;
    }
    if (bounded > grapheme.index && bounded < grapheme.end) {
      if (direction === 'left') return grapheme.index;
      if (direction === 'right') return grapheme.end;
      return bounded - grapheme.index <= grapheme.end - bounded ? grapheme.index : grapheme.end;
    }
  }
  return bounded;
}

export function isUnicodeWordGrapheme(grapheme: string): boolean {
  return /[\p{L}\p{M}\p{N}_]/u.test(grapheme);
}

export function previousWordBoundary(text: string, position: number): number {
  const segments = segmentGraphemes(text);
  let index = segments.findIndex((segment) => segment.end >= position);
  if (index < 0) index = segments.length;
  if (index === segments.length) index--;

  while (index >= 0 && !isUnicodeWordGrapheme(segments[index]!.segment)) index--;
  while (index > 0 && isUnicodeWordGrapheme(segments[index - 1]!.segment)) index--;
  return index >= 0 ? segments[index]!.index : 0;
}

export function nextWordBoundary(text: string, position: number): number {
  const segments = segmentGraphemes(text);
  let index = segments.findIndex((segment) => segment.end > position);
  if (index < 0) return text.length;

  while (index < segments.length && isUnicodeWordGrapheme(segments[index]!.segment)) index++;
  while (index < segments.length && !isUnicodeWordGrapheme(segments[index]!.segment)) index++;
  return index < segments.length ? segments[index]!.index : text.length;
}

/**
 * Find the end of the next word without consuming separators after it.
 * Useful for forward word deletion and current-word selection.
 */
export function nextWordEnd(text: string, position: number): number {
  const segments = segmentGraphemes(text);
  let index = segments.findIndex((segment) => segment.end > position);
  if (index < 0) return text.length;

  while (index < segments.length && !isUnicodeWordGrapheme(segments[index]!.segment)) index++;
  while (index < segments.length && isUnicodeWordGrapheme(segments[index]!.segment)) index++;
  return index < segments.length ? segments[index]!.index : text.length;
}
