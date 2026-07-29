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
 * - Composable sources, including filesystem path completion
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
 *
 * @example
 * // Compose domain triggers with filesystem paths
 * const completion = createComposableCompletion([
 *   createTriggerCompletionSource({ trigger: '@', getItems: searchFiles }),
 *   createTriggerCompletionSource({ trigger: '#', getItems: searchIssues }),
 *   createPathCompletionSource(),
 * ]);
 * TextInput({ completion });
 */

import { readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

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

export interface TextInputCompletionSource<T = unknown> {
  /** Stable source id. Matched against `anchor.trigger` during item lookup. */
  id: string;
  /** Resolve whether this source owns the current cursor token. */
  resolveAnchor: TextInputCompletionOptions<T>['resolveAnchor'];
  /** Return items for a previously resolved anchor. */
  getItems: ArrayTextInputCompletionOptions<T>['getItems'];
}

/**
 * Completion provider whose lookup always resolves to an item array.
 *
 * The general TextInput API also accepts cancellable background task handles.
 * Trigger/path factories never return those handles, so exposing the narrower
 * contract prevents callers from having to narrow an impossible union.
 */
export interface ArrayTextInputCompletionOptions<T = unknown>
  extends Omit<TextInputCompletionOptions<T>, 'getItems'> {
  getItems: (
    context: TextInputCompletionContext,
  ) => Promise<readonly TextInputCompletionItem<T>[]> | readonly TextInputCompletionItem<T>[];
}

export interface ComposableCompletionOptions<T = unknown> {
  /** Sources are tried in order. Put more specific triggers before broad path matching. */
  sources: readonly TextInputCompletionSource<T>[];
  /** Optional ranking/frequency tracking shared by all composed sources. */
  ranking?: TextInputCompletionRankingOptions<T>;
}

export interface PathCompletionPayload {
  absolutePath: string;
  kind: 'directory' | 'file';
  name: string;
  path: string;
}

export interface PathCompletionOptions {
  /** Source id used in completion anchors (default: "path"). */
  id?: string;
  /** Working directory for relative completions (default: process.cwd()). */
  cwd?: string | (() => string);
  /** Home directory for ~/ completions (default: os.homedir()). */
  homeDir?: string | (() => string);
  /** Maximum items returned after sorting (default: 30). */
  maxItems?: number;
  /** Include files in results (default: true). */
  includeFiles?: boolean;
  /** Include directories in results (default: true). */
  includeDirectories?: boolean;
  /** Include dotfiles even when the typed match does not start with "." (default: false). */
  includeHidden?: boolean;
  /** Insert accepted paths as semantic segments instead of plain text (default: false). */
  insertAsSegment?: boolean;
  /** Segment kind for accepted file completions when insertAsSegment is true. */
  fileSegmentKind?: string;
  /** Segment kind for accepted directory completions when insertAsSegment is true. */
  directorySegmentKind?: string;
  /** Optional detail formatter shown by completion dropdowns. */
  detail?: (payload: PathCompletionPayload) => string | undefined;
}

// =============================================================================
// Anchor Resolution
// =============================================================================

/** Default: letters, numbers, underscore, hyphen, dot, forward slash */
const DEFAULT_QUERY_CHARS = /[\p{L}\p{N}\p{M}_\-./\\]/u;
const PATH_SOURCE_ID = 'path';
const PATH_TOKEN_RE = /(?:^|\s)((?:~(?:[/\\][^"'`\s]*)?|\.{1,2}[/\\][^"'`\s]*|[A-Za-z]:[/\\][^"'`\s]*|[/\\][^"'`\s]*|[^"'`\s]+[/\\][^"'`\s]*)$)/;

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

function overlapsSegment(
  segments: readonly TextInputSegment[],
  start: number,
  end: number,
): boolean {
  return segments.some((segment) => start < segment.end && end > segment.start);
}

function resolveConfiguredPath(value: string | (() => string) | undefined, fallback: () => string): string {
  return typeof value === 'function' ? value() : value ?? fallback();
}

function normalizeCompletionPath(value: string): string {
  return value.replace(/\\/g, '/');
}

function resolvePathToken(token: string, cwd: string, homeDir: string): string {
  if (token === '~') return homeDir;
  if (token.startsWith('~/') || token.startsWith('~\\')) {
    return path.resolve(homeDir, token.slice(2));
  }
  if (/^[A-Za-z]:[\\/]/.test(token)) {
    return path.resolve(token);
  }
  if (path.isAbsolute(token)) {
    return path.resolve(token);
  }
  return path.resolve(cwd, token);
}

function splitPathSearch(token: string, cwd: string, homeDir: string): { match: string; searchDir: string } {
  const expanded = resolvePathToken(token, cwd, homeDir);
  const listDirectory = token === '~' || /[/\\]$/.test(token);

  return {
    searchDir: listDirectory ? expanded : path.dirname(expanded),
    match: listDirectory ? '' : path.basename(expanded),
  };
}

function formatPathReplacement(token: string, absolutePath: string, cwd: string, homeDir: string, isDirectory: boolean): string {
  const suffix = isDirectory ? '/' : '';

  if (token === '~' || token.startsWith('~/') || token.startsWith('~\\')) {
    return `~/${normalizeCompletionPath(path.relative(homeDir, absolutePath))}${suffix}`;
  }

  if (token.startsWith('./') || token.startsWith('.\\')) {
    return `./${normalizeCompletionPath(path.relative(cwd, absolutePath))}${suffix}`;
  }

  if (token.startsWith('../') || token.startsWith('..\\')) {
    return `${normalizeCompletionPath(path.relative(cwd, absolutePath))}${suffix}`;
  }

  if (path.isAbsolute(token) || /^[A-Za-z]:[\\/]/.test(token)) {
    return `${normalizeCompletionPath(path.resolve(absolutePath))}${suffix}`;
  }

  return `${normalizeCompletionPath(path.relative(cwd, absolutePath))}${suffix}`;
}

function resolvePathAnchor(
  value: string,
  cursorPosition: number,
  segments: readonly TextInputSegment[],
  sourceId: string,
): TextInputCompletionAnchor | null {
  if (cursorPosition === 0) return null;

  const prefix = value.slice(0, cursorPosition);
  const match = prefix.match(PATH_TOKEN_RE);
  const token = match?.[1];
  if (!token) return null;

  const start = cursorPosition - token.length;
  if (overlapsSegment(segments, start, cursorPosition)) return null;

  return {
    start,
    end: cursorPosition,
    query: token,
    trigger: sourceId,
  };
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
): ArrayTextInputCompletionOptions<T> {
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
 * Adapt a simple TriggerConfig into a source for createComposableCompletion.
 */
export function createTriggerCompletionSource<T = unknown>(
  config: TriggerConfig<T>,
): TextInputCompletionSource<T> {
  const completion = createTriggerCompletion(config);

  return {
    id: config.trigger,
    resolveAnchor: completion.resolveAnchor,
    getItems: completion.getItems,
  };
}

/**
 * Compose multiple completion sources into one TextInput completion provider.
 *
 * Sources are tried in order while resolving anchors. The resolved anchor's
 * `trigger` field is then used to route item lookup back to the owning source.
 */
export function createComposableCompletion<T = unknown>(
  sourcesOrOptions: readonly TextInputCompletionSource<T>[] | ComposableCompletionOptions<T>,
): ArrayTextInputCompletionOptions<T> {
  const isSourceArray = Array.isArray(sourcesOrOptions);
  const sources = (
    isSourceArray
      ? sourcesOrOptions
      : (sourcesOrOptions as ComposableCompletionOptions<T>).sources
  ) as readonly TextInputCompletionSource<T>[];
  const ranking = isSourceArray
    ? undefined
    : (sourcesOrOptions as ComposableCompletionOptions<T>).ranking;

  return {
    resolveAnchor(context) {
      for (const source of sources) {
        const anchor = source.resolveAnchor(context);
        if (anchor) {
          return {
            ...anchor,
            trigger: anchor.trigger ?? source.id,
          };
        }
      }

      return null;
    },

    getItems(context) {
      const source = sources.find((candidate: TextInputCompletionSource<T>) => candidate.id === context.anchor.trigger);
      if (!source) return [];

      return source.getItems(context);
    },

    ranking,
  };
}

/**
 * Create a completion source for filesystem paths.
 *
 * Recognizes `~`, `~/`, `./`, `../`, absolute paths, Windows drive paths, and
 * tokens that already contain a directory separator such as `src/`.
 */
export function createPathCompletionSource(
  options: PathCompletionOptions = {},
): TextInputCompletionSource<PathCompletionPayload> {
  const sourceId = options.id ?? PATH_SOURCE_ID;

  return {
    id: sourceId,
    resolveAnchor({ value, cursorPosition, segments }) {
      return resolvePathAnchor(value, cursorPosition, segments, sourceId);
    },
    getItems({ anchor }) {
      const token = anchor.query;
      const cwd = path.resolve(resolveConfiguredPath(options.cwd, () => process.cwd()));
      const homeDir = path.resolve(resolveConfiguredPath(options.homeDir, homedir));
      const maxItems = Math.max(1, options.maxItems ?? 30);
      const includeFiles = options.includeFiles ?? true;
      const includeDirectories = options.includeDirectories ?? true;
      const includeHidden = options.includeHidden ?? false;
      const insertAsSegment = options.insertAsSegment ?? false;
      const fileSegmentKind = options.fileSegmentKind ?? 'file';
      const directorySegmentKind = options.directorySegmentKind ?? 'folder';

      try {
        const { searchDir, match } = splitPathSearch(token, cwd, homeDir);
        const matchLower = match.toLowerCase();
        const entries = readdirSync(searchDir, { withFileTypes: true })
          .filter((entry) => {
            if (!includeHidden && !match.startsWith('.') && entry.name.startsWith('.')) {
              return false;
            }
            if (match && !entry.name.toLowerCase().startsWith(matchLower)) {
              return false;
            }
            if (entry.isDirectory()) {
              return includeDirectories;
            }
            return includeFiles;
          })
          .sort((left, right) => {
            if (left.isDirectory() !== right.isDirectory()) {
              return left.isDirectory() ? -1 : 1;
            }
            return left.name.localeCompare(right.name);
          })
          .slice(0, maxItems);

        return entries.map((entry): TextInputCompletionItem<PathCompletionPayload> => {
          const isDirectory = entry.isDirectory();
          const absolutePath = path.resolve(searchDir, entry.name);
          const replacementText = formatPathReplacement(token, absolutePath, cwd, homeDir, isDirectory);
          const payload: PathCompletionPayload = {
            absolutePath,
            kind: isDirectory ? 'directory' : 'file',
            name: entry.name,
            path: replacementText,
          };

          return {
            id: replacementText,
            label: `${entry.name}${isDirectory ? '/' : ''}`,
            detail: options.detail?.(payload) ?? (isDirectory ? 'dir' : ''),
            payload,
            replacement: insertAsSegment
              ? {
                  kind: isDirectory ? directorySegmentKind : fileSegmentKind,
                  displayText: replacementText,
                  payload,
                }
              : replacementText,
          };
        });
      } catch {
        return [];
      }
    },
  };
}

/**
 * Convenience provider when an input only needs filesystem path completions.
 */
export function createPathCompletion(
  options: PathCompletionOptions = {},
): ArrayTextInputCompletionOptions<PathCompletionPayload> {
  return createComposableCompletion([createPathCompletionSource(options)]);
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
): ArrayTextInputCompletionOptions<T> {
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
