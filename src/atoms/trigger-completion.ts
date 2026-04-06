/**
 * Trigger Completion - Factory for inline trigger-based completions
 *
 * @layer Atom
 * @description Convenience factory to create TextInputCompletionOptions
 * from simple trigger character configs (e.g., @mentions, /commands, #tags)
 *
 * Features:
 * - Single or multi-trigger support
 * - Auto-generates resolveAnchor and getItems from simple config
 * - Segment insertion with cursor clamping (via TextInput completion system)
 * - Async item fetching
 * - Optional ranking by usage frequency
 *
 * @example
 * // Single trigger
 * const mention = createTriggerCompletion({
 *   trigger: '@',
 *   getItems: (query) => searchUsers(query).then(users =>
 *     users.map(u => ({ id: u.id, label: u.name, detail: u.email }))
 *   ),
 * });
 * TextInput({ completion: mention });
 *
 * @example
 * // Multiple triggers in one input
 * const completion = createMultiTriggerCompletion([
 *   { trigger: '@', getItems: searchUsers, segmentKind: 'mention' },
 *   { trigger: '/', getItems: searchCommands, segmentKind: 'command' },
 *   { trigger: '#', getItems: searchTags, segmentKind: 'tag' },
 * ]);
 * TextInput({ completion });
 */

import type {
  TextInputCompletionOptions,
  TextInputCompletionAnchor,
  TextInputCompletionItem,
  TextInputCompletionContext,
  TextInputCompletionRankingOptions,
  TextInputSegment,
} from './text-input.js';

// =============================================================================
// Types
// =============================================================================

export interface TriggerItem<T = unknown> {
  /** Unique identifier */
  id: string;
  /** Display label (shown in dropdown and inserted on accept) */
  label: string;
  /** Secondary text (shown dimmed in dropdown) */
  detail?: string;
  /** Icon character (shown before label) */
  icon?: string;
  /** Custom data attached to the inserted segment */
  payload?: T;
}

export interface TriggerConfig<T = unknown> {
  /** Trigger character(s) that activate completion (e.g., '@', '/', '#') */
  trigger: string;
  /** Fetch suggestions for a query string */
  getItems: (query: string) => Promise<TriggerItem<T>[]> | TriggerItem<T>[];
  /** Minimum characters after trigger before searching (default: 0) */
  minChars?: number;
  /** Insert as a semantic segment/pill (default: true) */
  insertAsSegment?: boolean;
  /** Segment kind for inserted items (default: trigger string) */
  segmentKind?: string;
  /** Optional ranking/frequency tracking */
  ranking?: TextInputCompletionRankingOptions<T>;
  /** Characters that are valid in the query (default: letters, numbers, _, -, .) */
  queryPattern?: RegExp;
}

// =============================================================================
// Anchor Resolution
// =============================================================================

/** Default: letters, numbers, underscore, hyphen, dot, forward slash */
const DEFAULT_QUERY_CHARS = /[\p{L}\p{N}\p{M}_\-./\\]/u;

/**
 * Scan backwards from cursor to find a trigger character.
 * The trigger must be preceded by whitespace or be at the start of input.
 */
function resolveAnchorForTrigger(
  trigger: string,
  value: string,
  cursorPosition: number,
  segments: readonly TextInputSegment[],
  queryPattern: RegExp,
): TextInputCompletionAnchor | null {
  if (cursorPosition === 0) return null;

  // Walk backwards from cursor collecting query chars
  let queryEnd = cursorPosition;
  let pos = cursorPosition - 1;

  while (pos >= 0) {
    const char = value[pos]!;

    // Found the trigger
    if (value.slice(pos, pos + trigger.length) === trigger) {
      // Trigger must be at start or preceded by whitespace
      if (pos === 0 || /\s/.test(value[pos - 1]!)) {
        // Make sure we're not inside an existing segment
        const insideSegment = segments.some(
          (s) => pos >= s.start && pos < s.end,
        );
        if (insideSegment) return null;

        const queryStart = pos + trigger.length;
        return {
          start: pos,
          end: queryEnd,
          query: value.slice(queryStart, queryEnd),
          trigger,
        };
      }
      return null;
    }

    // Check if this char is valid in a query
    if (!queryPattern.test(char)) return null;

    pos--;
  }

  return null;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create TextInputCompletionOptions from a single trigger config.
 *
 * @example
 * const mentions = createTriggerCompletion({
 *   trigger: '@',
 *   getItems: async (query) => {
 *     const users = await api.searchUsers(query);
 *     return users.map(u => ({ id: u.id, label: u.name, detail: u.role }));
 *   },
 * });
 *
 * const state = createTextInputState({ completion: mentions });
 */
export function createTriggerCompletion<T = unknown>(
  config: TriggerConfig<T>,
): TextInputCompletionOptions<T> {
  const {
    trigger,
    getItems,
    minChars = 0,
    insertAsSegment = true,
    segmentKind = trigger,
    ranking,
    queryPattern = DEFAULT_QUERY_CHARS,
  } = config;

  return {
    resolveAnchor({ value, cursorPosition, segments }) {
      return resolveAnchorForTrigger(trigger, value, cursorPosition, segments, queryPattern);
    },

    async getItems(context: TextInputCompletionContext): Promise<readonly TextInputCompletionItem<T>[]> {
      const { anchor } = context;
      if (anchor.query.length < minChars) return [];

      const items = await getItems(anchor.query);

      return items.map((item): TextInputCompletionItem<T> => ({
        id: item.id,
        label: `${trigger}${item.label}`,
        detail: item.detail,
        payload: item.payload,
        replacement: insertAsSegment
          ? {
              kind: segmentKind,
              displayText: `${trigger}${item.label}`,
              payload: item.payload,
            }
          : `${trigger}${item.label} `, // Plain text with trailing space
      }));
    },

    ranking,
  };
}

/**
 * Create TextInputCompletionOptions that supports multiple trigger characters.
 *
 * Each trigger is tried in order. The first one that matches wins.
 *
 * @example
 * const completion = createMultiTriggerCompletion([
 *   { trigger: '@', getItems: searchUsers, segmentKind: 'mention' },
 *   { trigger: '/', getItems: searchCommands, segmentKind: 'command' },
 *   { trigger: '#', getItems: searchTags, segmentKind: 'tag' },
 * ]);
 *
 * TextInput({ completion });
 */
export function createMultiTriggerCompletion<T = unknown>(
  configs: TriggerConfig<T>[],
): TextInputCompletionOptions<T> {
  // Pre-build individual completions
  const completions = configs.map((config) => ({
    config,
    queryPattern: config.queryPattern ?? DEFAULT_QUERY_CHARS,
  }));

  return {
    resolveAnchor({ value, cursorPosition, segments }) {
      // Try each trigger — first match wins
      for (const { config, queryPattern } of completions) {
        const anchor = resolveAnchorForTrigger(
          config.trigger,
          value,
          cursorPosition,
          segments,
          queryPattern,
        );
        if (anchor) return anchor;
      }
      return null;
    },

    async getItems(context: TextInputCompletionContext): Promise<readonly TextInputCompletionItem<T>[]> {
      const { anchor } = context;
      if (!anchor.trigger) return [];

      // Find the config for this trigger
      const matched = configs.find((c) => c.trigger === anchor.trigger);
      if (!matched) return [];

      const minChars = matched.minChars ?? 0;
      if (anchor.query.length < minChars) return [];

      const insertAsSegment = matched.insertAsSegment ?? true;
      const segmentKind = matched.segmentKind ?? anchor.trigger;
      const items = await matched.getItems(anchor.query);

      return items.map((item): TextInputCompletionItem<T> => ({
        id: item.id,
        label: `${anchor.trigger}${item.label}`,
        detail: item.detail,
        payload: item.payload,
        replacement: insertAsSegment
          ? {
              kind: segmentKind,
              displayText: `${anchor.trigger}${item.label}`,
              payload: item.payload,
            }
          : `${anchor.trigger}${item.label} `,
      }));
    },
  };
}
