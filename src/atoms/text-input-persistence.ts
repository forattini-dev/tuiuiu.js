import type {
  TextInputCompletionRankingEntry,
  TextInputCompletionRankingOptions,
  TextInputHistoryEntry,
  TextInputHistoryPersistenceOptions,
} from './text-input.js';
import {
  isCompletionRankingEntry,
  isTextInputHistoryEntryValue,
  normalizeHistoryEntry,
  sortCompletionRankingEntries,
} from './text-input-model.js';

export function isSameHistoryPersistenceOptions(
  left?: TextInputHistoryPersistenceOptions,
  right?: TextInputHistoryPersistenceOptions
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }

  return left.storage === right.storage
    && left.key === right.key
    && left.limit === right.limit;
}

export function isSameCompletionRankingPersistence(
  left?: TextInputCompletionRankingOptions['persistence'],
  right?: TextInputCompletionRankingOptions['persistence']
): boolean {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }

  return left.storage === right.storage
    && left.key === right.key;
}

function resolveHistoryPersistenceLimit(limit?: number): number {
  return Math.max(1, limit ?? 50);
}

function trimPersistedHistoryEntries(
  entries: readonly TextInputHistoryEntry[],
  limit?: number
): TextInputHistoryEntry[] {
  return entries.slice(-resolveHistoryPersistenceLimit(limit));
}

export function readPersistedHistoryEntries(
  persistence: TextInputHistoryPersistenceOptions | undefined
): TextInputHistoryEntry[] {
  if (!persistence) {
    return [];
  }

  try {
    const serialized = persistence.storage.getItem(persistence.key);
    if (serialized === null) {
      return [];
    }

    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      throw new Error('Persisted prompt history must be an array.');
    }

    return trimPersistedHistoryEntries(
      parsed.map((entry) => {
        if (typeof entry === 'string') {
          return normalizeHistoryEntry(entry);
        }
        if (!isTextInputHistoryEntryValue(entry)) {
          throw new Error('Persisted prompt history contains invalid entries.');
        }
        return normalizeHistoryEntry(entry);
      }),
      persistence.limit
    );
  } catch (error) {
    console.warn(
      'Failed to hydrate persisted prompt history. Falling back to seeded history only.',
      error
    );
    return [];
  }
}

export function writePersistedHistoryEntries(
  persistence: TextInputHistoryPersistenceOptions | undefined,
  entries: readonly TextInputHistoryEntry[]
): void {
  if (!persistence) {
    return;
  }

  try {
    persistence.storage.setItem(
      persistence.key,
      JSON.stringify(trimPersistedHistoryEntries(entries, persistence.limit))
    );
  } catch (error) {
    console.warn('Failed to persist prompt history snapshot.', error);
  }
}

export function mergePersistedHistoryEntry(
  entries: readonly TextInputHistoryEntry[],
  nextEntry: TextInputHistoryEntry,
  limit?: number
): TextInputHistoryEntry[] {
  const serializedEntry = JSON.stringify(nextEntry);
  return trimPersistedHistoryEntries(
    [
      ...entries.filter((entry) => JSON.stringify(entry) !== serializedEntry),
      nextEntry,
    ],
    limit
  );
}

export function readPersistedCompletionRankingEntries(
  persistence: TextInputCompletionRankingOptions['persistence'] | undefined
): TextInputCompletionRankingEntry[] {
  if (!persistence) {
    return [];
  }

  try {
    const serialized = persistence.storage.getItem(persistence.key);
    if (serialized === null) {
      return [];
    }

    const parsed = JSON.parse(serialized);
    if (!Array.isArray(parsed)) {
      throw new Error('Persisted completion ranking must be an array.');
    }

    return parsed.map((entry) => {
      if (!isCompletionRankingEntry(entry)) {
        throw new Error('Persisted completion ranking contains invalid entries.');
      }

      return { ...entry };
    });
  } catch (error) {
    console.warn(
      'Failed to hydrate persisted completion ranking. Falling back to empty ranking state.',
      error
    );
    return [];
  }
}

export function writePersistedCompletionRankingEntries(
  persistence: TextInputCompletionRankingOptions['persistence'] | undefined,
  entries: readonly TextInputCompletionRankingEntry[]
): void {
  if (!persistence) {
    return;
  }

  try {
    persistence.storage.setItem(
      persistence.key,
      JSON.stringify(sortCompletionRankingEntries(entries))
    );
  } catch (error) {
    console.warn('Failed to persist completion ranking snapshot.', error);
  }
}
