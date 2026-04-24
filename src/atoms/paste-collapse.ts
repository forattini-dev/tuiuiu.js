/**
 * Paste Collapse - TextInput paste transform helper
 *
 * @layer Atom
 * @description Collapse large pasted text into compact semantic TextInput segments
 */

import type {
  TextInputPasteContext,
  TextInputPasteTransformResult,
  TextInputSegmentInput,
} from './text-input.js';

export interface PasteCollapseSummary {
  /** Number of characters in the pasted text */
  charCount: number;
  /** Number of lines in the pasted text */
  lineCount: number;
  /** Short preview derived from the pasted text */
  preview: string;
}

export interface PasteCollapseRecord<TMetadata = unknown> extends PasteCollapseSummary {
  /** Stable paste id */
  id: string;
  /** Original pasted text */
  text: string;
  /** Creation timestamp in milliseconds */
  createdAt: number;
  /** Optional application metadata */
  metadata?: TMetadata;
}

export interface PasteCollapseStore<TMetadata = unknown> {
  /** Add pasted text and return the stored record */
  add: (text: string, options?: { metadata?: TMetadata }) => PasteCollapseRecord<TMetadata>;
  /** Get a record by id */
  get: (id: string) => PasteCollapseRecord<TMetadata> | undefined;
  /** List records from oldest to newest */
  list: () => PasteCollapseRecord<TMetadata>[];
  /** Remove a record by id */
  remove: (id: string) => boolean;
  /** Clear all stored records */
  clear: () => void;
  /** Current record count */
  size: () => number;
}

export interface PasteCollapseStoreOptions {
  /** Maximum records retained, oldest-first eviction (default: 50) */
  maxItems?: number;
  /** Prefix used when generating ids (default: "paste") */
  idPrefix?: string;
  /** Character count used for preview metadata (default: 80) */
  previewChars?: number;
  /** Clock override for tests */
  now?: () => number;
  /** Id factory override for tests */
  createId?: (nextIndex: number) => string;
}

export interface PasteCollapsePayload<TMetadata = unknown> extends PasteCollapseSummary {
  /** Id used to retrieve the original pasted text from the store */
  pasteId: string;
  /** Optional application metadata */
  metadata?: TMetadata;
  /** Original text, only present when includeTextInPayload is enabled */
  text?: string;
}

export interface PasteCollapseTransformOptions<TMetadata = unknown, TPayload = PasteCollapsePayload<TMetadata>> {
  /** Collapse when pasted text has at least this many characters (default: 500) */
  minChars?: number;
  /** Collapse when pasted text has at least this many lines (default: 3) */
  minLines?: number;
  /** Store used to retain original pasted text */
  store?: PasteCollapseStore<TMetadata>;
  /** Maximum records retained when a store is not provided (default: 50) */
  maxStored?: number;
  /** Segment kind inserted into TextInput (default: "paste") */
  segmentKind?: string;
  /** Static or dynamic placeholder displayed in the input */
  placeholder?: string | ((record: PasteCollapseRecord<TMetadata>, context: TextInputPasteContext) => string);
  /** Optional metadata attached to the store record and default payload */
  metadata?: TMetadata | ((context: TextInputPasteContext, summary: PasteCollapseSummary) => TMetadata);
  /** Payload factory for the inserted semantic segment */
  payload?: (record: PasteCollapseRecord<TMetadata>, context: TextInputPasteContext) => TPayload;
  /** Custom collapse predicate */
  shouldCollapse?: (context: TextInputPasteContext, summary: PasteCollapseSummary) => boolean;
  /** Include original text in the default segment payload (default: false) */
  includeTextInPayload?: boolean;
  /** Character count used for preview metadata (default: 80) */
  previewChars?: number;
}

export interface PasteCollapseTransform<TMetadata = unknown, TPayload = PasteCollapsePayload<TMetadata>> {
  (context: TextInputPasteContext): TextInputPasteTransformResult<TPayload>;
  /** Store used by this transform */
  store: PasteCollapseStore<TMetadata>;
}

function countLines(text: string): number {
  if (!text) return 1;
  return text.split(/\r\n|\r|\n/).length;
}

function createPreview(text: string, maxChars: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, Math.max(0, maxChars - 1))}...`;
}

function summarizePaste(text: string, previewChars: number): PasteCollapseSummary {
  return {
    charCount: text.length,
    lineCount: countLines(text),
    preview: createPreview(text, previewChars),
  };
}

function defaultPlaceholder(record: PasteCollapseRecord): string {
  const lines = record.lineCount === 1 ? '1 line' : `${record.lineCount} lines`;
  return `[paste:${lines},${record.charCount}c]`;
}

function defaultPayload<TMetadata>(
  record: PasteCollapseRecord<TMetadata>,
  includeText: boolean,
): PasteCollapsePayload<TMetadata> {
  return {
    pasteId: record.id,
    charCount: record.charCount,
    lineCount: record.lineCount,
    preview: record.preview,
    metadata: record.metadata,
    ...(includeText ? { text: record.text } : {}),
  };
}

/**
 * Create an in-memory store for collapsed paste records.
 */
export function createPasteCollapseStore<TMetadata = unknown>(
  options: PasteCollapseStoreOptions = {},
): PasteCollapseStore<TMetadata> {
  const maxItems = options.maxItems ?? 50;
  const idPrefix = options.idPrefix ?? 'paste';
  const previewChars = options.previewChars ?? 80;
  const now = options.now ?? (() => Date.now());
  const records = new Map<string, PasteCollapseRecord<TMetadata>>();
  let counter = 0;

  const prune = () => {
    while (maxItems >= 0 && records.size > maxItems) {
      const oldest = records.keys().next().value as string | undefined;
      if (!oldest) return;
      records.delete(oldest);
    }
  };

  return {
    add: (text, addOptions) => {
      counter += 1;
      const id = options.createId?.(counter) ?? `${idPrefix}-${counter}`;
      const record: PasteCollapseRecord<TMetadata> = {
        id,
        text,
        ...summarizePaste(text, previewChars),
        createdAt: now(),
        metadata: addOptions?.metadata,
      };
      records.set(id, record);
      prune();
      return record;
    },
    get: (id) => records.get(id),
    list: () => [...records.values()],
    remove: (id) => records.delete(id),
    clear: () => {
      records.clear();
    },
    size: () => records.size,
  };
}

/**
 * Create a TextInput transformPaste handler that collapses large paste payloads.
 *
 * @example
 * const pasteCollapse = createPasteCollapseTransform({ minLines: 2 });
 * const input = createTextInput({ transformPaste: pasteCollapse });
 * const record = pasteCollapse.store.get(segment.payload.pasteId);
 */
export function createPasteCollapseTransform<TMetadata = unknown, TPayload = PasteCollapsePayload<TMetadata>>(
  options: PasteCollapseTransformOptions<TMetadata, TPayload> = {},
): PasteCollapseTransform<TMetadata, TPayload> {
  const store = options.store ?? createPasteCollapseStore<TMetadata>({
    maxItems: options.maxStored,
    previewChars: options.previewChars,
  });
  const minChars = options.minChars ?? 500;
  const minLines = options.minLines ?? 3;
  const segmentKind = options.segmentKind ?? 'paste';
  const previewChars = options.previewChars ?? 80;
  const includeTextInPayload = options.includeTextInPayload ?? false;

  const transform = ((context: TextInputPasteContext): TextInputPasteTransformResult<TPayload> => {
    const summary = summarizePaste(context.text, previewChars);
    const defaultCollapse = summary.charCount >= minChars || summary.lineCount >= minLines;
    const collapse = options.shouldCollapse?.(context, summary) ?? defaultCollapse;

    if (!collapse) {
      return undefined;
    }

    const metadata = typeof options.metadata === 'function'
      ? (options.metadata as (context: TextInputPasteContext, summary: PasteCollapseSummary) => TMetadata)(context, summary)
      : options.metadata;
    const record = store.add(context.text, { metadata });
    const displayText = typeof options.placeholder === 'function'
      ? options.placeholder(record, context)
      : options.placeholder ?? defaultPlaceholder(record);
    const payload = options.payload
      ? options.payload(record, context)
      : defaultPayload(record, includeTextInPayload) as TPayload;

    const segment: TextInputSegmentInput<TPayload> = {
      id: record.id,
      kind: segmentKind,
      displayText,
      payload,
    };

    return segment;
  }) as PasteCollapseTransform<TMetadata, TPayload>;

  transform.store = store;
  return transform;
}
