/**
 * Prompt Submit Controller - TextInput submit policy helper
 *
 * @layer Atom
 * @description Coordinates completion-first submit, continuation, busy queueing, and interrupt hooks
 */

import { createSignal } from '../primitives/signal.js';
import type {
  TextInputCompletionState,
  TextInputRange,
  TextInputSegment,
} from './text-input.js';

export type PromptSubmitBusyPolicy = 'ignore' | 'queue';
export type PromptSubmitSource = 'submit' | 'queue';

export interface PromptSubmitInputState {
  value: () => string;
  segments: () => TextInputSegment[];
  completion: () => TextInputCompletionState | null;
  acceptCompletion: () => boolean;
  insertText: (text: string, range?: TextInputRange) => boolean;
  clear: () => void;
}

export interface PromptSubmitItem {
  id: string;
  value: string;
  trimmedValue: string;
  segments: TextInputSegment[];
  source: PromptSubmitSource;
  queuedAt?: number;
}

export interface PromptSubmitEvent extends PromptSubmitItem {
  queued: boolean;
}

export type PromptSubmitResult =
  | { action: 'accepted-completion' }
  | { action: 'continued'; value: string }
  | { action: 'ignored'; reason: 'empty' }
  | { action: 'busy-ignored'; item: PromptSubmitItem }
  | { action: 'queued'; item: PromptSubmitItem; queueDepth: number }
  | { action: 'queue-full'; item: PromptSubmitItem; queueDepth: number }
  | { action: 'submitted'; item: PromptSubmitItem }
  | { action: 'interrupted'; queueDepth: number }
  | { action: 'interrupt-ignored'; reason: 'not-busy' | 'missing-handler' }
  | { action: 'dequeued'; item: PromptSubmitItem; queueDepth: number }
  | { action: 'dequeue-empty' };

export interface PromptSubmitInterruptContext {
  queueDepth: number;
  queuedItems: PromptSubmitItem[];
}

export interface PromptSubmitControllerOptions {
  /** TextInput state returned by createTextInput/useTextInputState */
  input: PromptSubmitInputState;
  /** Application-owned submit handler */
  onSubmit: (event: PromptSubmitEvent) => void | Promise<void>;
  /** Application-owned interrupt hook */
  onInterrupt?: (context: PromptSubmitInterruptContext) => void;
  /** External busy state or getter. If omitted, use controller.setBusy(). */
  isBusy?: boolean | (() => boolean);
  /** Initial internal busy state (default: false) */
  initialBusy?: boolean;
  /** Accept active completions before submit (default: true) */
  acceptCompletionFirst?: boolean;
  /** Allow empty prompt submit (default: false) */
  allowEmpty?: boolean;
  /** Clear the prompt after immediate or queued submission dispatch (default: true) */
  clearOnSubmit?: boolean;
  /** Marker that becomes a newline instead of submitting (default: "\\") */
  continuationMarker?: string | false;
  /** Busy behavior for additional submits (default: "ignore") */
  busyPolicy?: PromptSubmitBusyPolicy;
  /** Maximum queued submissions when busyPolicy is "queue" (default: 20) */
  maxQueue?: number;
  /** Prefix used for generated item ids (default: "prompt") */
  idPrefix?: string;
  /** Clock override for queuedAt timestamps */
  now?: () => number;
  /** Id factory override for tests */
  createId?: (nextIndex: number) => string;
}

export interface PromptSubmitController {
  submit: () => PromptSubmitResult;
  submitQueued: (item: PromptSubmitItem) => PromptSubmitResult;
  dequeue: () => PromptSubmitResult;
  interrupt: () => PromptSubmitResult;
  clearQueue: () => void;
  queue: () => PromptSubmitItem[];
  queueDepth: () => number;
  busy: () => boolean;
  setBusy: (busy: boolean) => void;
  updateOptions: (options: Partial<PromptSubmitControllerOptions>) => void;
}

function cloneSegments(segments: readonly TextInputSegment[]): TextInputSegment[] {
  return segments.map((segment) => ({ ...segment }));
}

function resolveBusy(
  external: PromptSubmitControllerOptions['isBusy'],
  internalBusy: boolean,
): boolean {
  if (typeof external === 'function') return external();
  if (typeof external === 'boolean') return external;
  return internalBusy;
}

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return !!value && typeof (value as { then?: unknown }).then === 'function';
}

/**
 * Create a prompt submit controller for TextInput-backed composers.
 *
 * @example
 * const prompt = useTextInputState({ multiline: true });
 * const submit = useConst(() => createPromptSubmitController({
 *   input: prompt,
 *   busyPolicy: 'queue',
 *   onSubmit: ({ value }) => runPrompt(value),
 * }));
 * prompt.updateOptions({ onSubmit: () => submit.submit() });
 */
export function createPromptSubmitController(
  options: PromptSubmitControllerOptions,
): PromptSubmitController {
  let runtimeOptions = { ...options };
  const [internalBusy, setInternalBusy] = createSignal(runtimeOptions.initialBusy ?? false);
  const [queue, setQueue] = createSignal<PromptSubmitItem[]>([]);
  let nextId = 0;

  const getBusy = () => resolveBusy(runtimeOptions.isBusy, internalBusy());
  const now = () => runtimeOptions.now?.() ?? Date.now();

  const createItem = (source: PromptSubmitSource, queuedAt?: number): PromptSubmitItem => {
    nextId += 1;
    const value = runtimeOptions.input.value();
    return {
      id: runtimeOptions.createId?.(nextId) ?? `${runtimeOptions.idPrefix ?? 'prompt'}-${nextId}`,
      value,
      trimmedValue: value.trim(),
      segments: cloneSegments(runtimeOptions.input.segments()),
      source,
      queuedAt,
    };
  };

  const dispatch = (item: PromptSubmitItem, queued: boolean): PromptSubmitResult => {
    const maybePromise = runtimeOptions.onSubmit({ ...item, queued });
    if (isPromiseLike(maybePromise) && runtimeOptions.isBusy === undefined) {
      setInternalBusy(true);
      void maybePromise.finally(() => {
        setInternalBusy(false);
      });
    }

    if (runtimeOptions.clearOnSubmit ?? true) {
      runtimeOptions.input.clear();
    }

    return { action: 'submitted', item };
  };

  const enqueue = (item: PromptSubmitItem): PromptSubmitResult => {
    const maxQueue = runtimeOptions.maxQueue ?? 20;
    const currentQueue = queue();
    if (currentQueue.length >= maxQueue) {
      return { action: 'queue-full', item, queueDepth: currentQueue.length };
    }

    const queuedItem = { ...item, queuedAt: item.queuedAt ?? now(), source: 'queue' as const };
    const nextQueue = [...currentQueue, queuedItem];
    setQueue(nextQueue);
    if (runtimeOptions.clearOnSubmit ?? true) {
      runtimeOptions.input.clear();
    }
    return { action: 'queued', item: queuedItem, queueDepth: nextQueue.length };
  };

  const submit = (): PromptSubmitResult => {
    const completion = runtimeOptions.input.completion();
    if (
      (runtimeOptions.acceptCompletionFirst ?? true)
      && completion
      && completion.items.length > 0
      && runtimeOptions.input.acceptCompletion()
    ) {
      return { action: 'accepted-completion' };
    }

    const value = runtimeOptions.input.value();
    const marker = runtimeOptions.continuationMarker ?? '\\';
    if (marker && value.endsWith(marker)) {
      const start = value.length - marker.length;
      runtimeOptions.input.insertText('\n', { start, end: value.length });
      return {
        action: 'continued',
        value: `${value.slice(0, start)}\n`,
      };
    }

    const item = createItem('submit');
    if (!runtimeOptions.allowEmpty && item.trimmedValue.length === 0) {
      return { action: 'ignored', reason: 'empty' };
    }

    if (getBusy()) {
      if (runtimeOptions.busyPolicy === 'queue') {
        return enqueue(item);
      }
      return { action: 'busy-ignored', item };
    }

    return dispatch(item, false);
  };

  const dequeue = (): PromptSubmitResult => {
    const currentQueue = queue();
    const [item, ...rest] = currentQueue;
    if (!item) {
      return { action: 'dequeue-empty' };
    }

    setQueue(rest);
    return { action: 'dequeued', item, queueDepth: rest.length };
  };

  const submitQueued = (item: PromptSubmitItem): PromptSubmitResult => {
    if (!runtimeOptions.allowEmpty && item.trimmedValue.length === 0) {
      return { action: 'ignored', reason: 'empty' };
    }
    return dispatch({ ...item, source: 'queue' }, true);
  };

  return {
    submit,
    submitQueued,
    dequeue,
    interrupt: () => {
      if (!getBusy()) {
        return { action: 'interrupt-ignored', reason: 'not-busy' };
      }
      if (!runtimeOptions.onInterrupt) {
        return { action: 'interrupt-ignored', reason: 'missing-handler' };
      }
      runtimeOptions.onInterrupt({
        queueDepth: queue().length,
        queuedItems: queue(),
      });
      return { action: 'interrupted', queueDepth: queue().length };
    },
    clearQueue: () => setQueue([]),
    queue: () => [...queue()],
    queueDepth: () => queue().length,
    busy: getBusy,
    setBusy: (busy) => setInternalBusy(busy),
    updateOptions: (nextOptions) => {
      runtimeOptions = { ...runtimeOptions, ...nextOptions };
    },
  };
}
