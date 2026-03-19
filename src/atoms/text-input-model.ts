import type { BackgroundTaskHandle } from '../utils/background-executor.js';
import { stringWidth } from '../utils/text-utils.js';

import type {
  TextInputCompletionItem,
  TextInputCompletionRankingEntry,
  TextInputHistoryEntry,
  TextInputHistoryItem,
  TextInputSegment,
} from './text-input.js';

type TextInputCompletionItems<T = unknown> = readonly TextInputCompletionItem<T>[];
type TextInputCompletionTask<T = unknown> = BackgroundTaskHandle<TextInputCompletionItems<T>>;

export function sortSegments(segments: readonly TextInputSegment[]): TextInputSegment[] {
  return [...segments].sort((left, right) => {
    if (left.start !== right.start) return left.start - right.start;
    if (left.end !== right.end) return left.end - right.end;
    return left.id.localeCompare(right.id);
  });
}

export function clampSegmentsToValue(
  segments: readonly TextInputSegment[],
  valueLength: number
): TextInputSegment[] {
  return sortSegments(
    segments
      .map((segment) => {
        const start = Math.max(0, Math.min(segment.start, valueLength));
        const end = Math.max(start, Math.min(segment.end, valueLength));
        return {
          ...segment,
          start,
          end,
        };
      })
      .filter((segment) => segment.end > segment.start)
  );
}

export function cloneSegments(segments: readonly TextInputSegment[]): TextInputSegment[] {
  return segments.map((segment) => ({ ...segment }));
}

export function getCursorIndexFromColumn(text: string, column: number): number {
  if (column <= 0) return 0;
  let width = 0;
  let index = 0;

  for (const char of text) {
    const charWidth = stringWidth(char);
    if (width + charWidth > column) break;
    width += charWidth;
    index += char.length;
  }

  return index;
}

export function isTextInputSegment(value: unknown): value is TextInputSegment {
  return !!value
    && typeof value === 'object'
    && 'id' in value
    && 'kind' in value
    && 'start' in value
    && 'end' in value
    && 'displayText' in value
    && typeof (value as TextInputSegment).id === 'string'
    && typeof (value as TextInputSegment).kind === 'string'
    && typeof (value as TextInputSegment).start === 'number'
    && typeof (value as TextInputSegment).end === 'number'
    && typeof (value as TextInputSegment).displayText === 'string';
}

export function normalizeHistoryEntry(
  entry: TextInputHistoryItem
): TextInputHistoryEntry {
  if (typeof entry === 'string') {
    return {
      value: entry,
      segments: [],
    };
  }

  return {
    value: entry.value,
    segments: clampSegmentsToValue(cloneSegments(entry.segments ?? []), entry.value.length),
  };
}

export function normalizeHistoryEntries(
  entries: readonly TextInputHistoryItem[]
): TextInputHistoryEntry[] {
  return entries.map((entry) => normalizeHistoryEntry(entry));
}

export function isTextInputHistoryEntryValue(value: unknown): value is TextInputHistoryEntry {
  return !!value
    && typeof value === 'object'
    && 'value' in value
    && typeof (value as TextInputHistoryEntry).value === 'string'
    && (!('segments' in value)
      || (Array.isArray((value as TextInputHistoryEntry).segments)
        && (value as TextInputHistoryEntry).segments!.every((segment) => isTextInputSegment(segment))));
}

export function findSegmentAtPosition(
  segments: readonly TextInputSegment[],
  position: number
): TextInputSegment | null {
  return segments.find((segment) => position > segment.start && position < segment.end) ?? null;
}

export function clampCursorToSegmentBoundary(
  segments: readonly TextInputSegment[],
  position: number,
  direction: 'nearest' | 'left' | 'right' = 'nearest'
): number {
  const segment = findSegmentAtPosition(segments, position);
  if (!segment) {
    return position;
  }

  if (direction === 'left') {
    return segment.start;
  }
  if (direction === 'right') {
    return segment.end;
  }

  return position - segment.start <= segment.end - position ? segment.start : segment.end;
}

export function expandRangeAcrossSegments(
  segments: readonly TextInputSegment[],
  initialStart: number,
  initialEnd: number
): { start: number; end: number } {
  let start = initialStart;
  let end = initialEnd;
  let changed = true;

  while (changed) {
    changed = false;

    for (const segment of segments) {
      const overlaps = segment.start < end && segment.end > start;
      if (!overlaps) continue;

      if (segment.start < start) {
        start = segment.start;
        changed = true;
      }
      if (segment.end > end) {
        end = segment.end;
        changed = true;
      }
    }
  }

  return { start, end };
}

export function isTaskBackedCompletionResult<T = unknown>(
  value: unknown
): value is TextInputCompletionTask<T> {
  return !!value
    && typeof value === 'object'
    && 'result' in value
    && 'cancel' in value
    && 'subscribe' in value;
}

export function isCompletionRankingEntry(
  value: unknown
): value is TextInputCompletionRankingEntry {
  return !!value
    && typeof value === 'object'
    && 'key' in value
    && 'count' in value
    && 'lastAcceptedAt' in value
    && typeof (value as TextInputCompletionRankingEntry).key === 'string'
    && typeof (value as TextInputCompletionRankingEntry).count === 'number'
    && typeof (value as TextInputCompletionRankingEntry).lastAcceptedAt === 'number';
}

export function sortCompletionRankingEntries(
  entries: readonly TextInputCompletionRankingEntry[]
): TextInputCompletionRankingEntry[] {
  return [...entries]
    .sort((left, right) => {
      if (left.count !== right.count) return right.count - left.count;
      if (left.lastAcceptedAt !== right.lastAcceptedAt) return right.lastAcceptedAt - left.lastAcceptedAt;
      return left.key.localeCompare(right.key);
    })
    .map((entry) => ({ ...entry }));
}
