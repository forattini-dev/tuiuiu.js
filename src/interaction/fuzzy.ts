import { segmentGraphemes } from '../utils/grapheme.js';

export interface FuzzyMatchScore {
  score: number;
  /** UTF-16 offsets of matching graphemes in the candidate. */
  matches: readonly number[];
}

const WORD_SEPARATORS = new Set([' ', '-', '_', '.', '/', ':', '\\']);

/** Pure fuzzy scoring shared by completion and palettes. */
export function scoreFuzzyMatch(pattern: string, candidate: string): FuzzyMatchScore | null {
  if (!pattern) return { score: 0, matches: [] };
  const patternParts = segmentGraphemes(pattern);
  const candidateParts = segmentGraphemes(candidate);
  const matches: number[] = [];
  let patternIndex = 0;
  let previousCandidateIndex = -1;
  let score = 0;

  for (
    let candidateIndex = 0;
    candidateIndex < candidateParts.length && patternIndex < patternParts.length;
    candidateIndex++
  ) {
    const part = candidateParts[candidateIndex]!;
    const expected = patternParts[patternIndex]!;
    if (part.segment.toLowerCase() !== expected.segment.toLowerCase()) continue;
    matches.push(part.index);
    score += 1;
    if (previousCandidateIndex === candidateIndex - 1) score += 15;
    else if (previousCandidateIndex >= 0) score -= candidateIndex - previousCandidateIndex - 1;
    if (candidateIndex === 0) score += 8;
    if (candidateIndex > 0 && WORD_SEPARATORS.has(candidateParts[candidateIndex - 1]!.segment)) {
      score += 10;
    }
    if (WORD_SEPARATORS.has(part.segment)) score += 5;
    if (part.segment === expected.segment) score += 1;
    previousCandidateIndex = candidateIndex;
    patternIndex++;
  }

  if (patternIndex !== patternParts.length) return null;
  score += Math.max(0, 50 - candidateParts.length);
  return { score, matches };
}

export interface FuzzySearchField<T> {
  value: (item: T) => string | undefined;
  weight?: number;
}

export interface FuzzySearchResult<T> extends FuzzyMatchScore {
  item: T;
}

export function searchFuzzy<T>(
  items: readonly T[],
  query: string,
  fields: readonly FuzzySearchField<T>[],
  limit = 50,
): FuzzySearchResult<T>[] {
  if (!Number.isSafeInteger(limit) || limit < 0) {
    throw new RangeError('Fuzzy search limit must be a non-negative safe integer');
  }
  return items
    .flatMap((item) => {
      let best: FuzzyMatchScore | null = query.trim() ? null : { score: 0, matches: [] };
      for (const field of fields) {
        const value = field.value(item);
        if (!value) continue;
        const match = scoreFuzzyMatch(query, value);
        if (!match) continue;
        const weighted = { ...match, score: match.score * (field.weight ?? 1) };
        if (!best || weighted.score > best.score) best = weighted;
      }
      return best ? [{ item, ...best }] : [];
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}
