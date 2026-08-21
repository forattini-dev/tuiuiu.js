import {
  createCollectionController,
  type CollectionController,
} from './collection.js';
import type { Disposable } from './runtime.js';

export interface CompletionAnchor {
  start: number;
  end: number;
  query: string;
  trigger?: string;
}

export interface CompletionRequestContext<C = unknown> {
  anchor: CompletionAnchor;
  context: C;
  signal: AbortSignal;
}

export type CompletionStatus = 'idle' | 'loading' | 'open' | 'empty' | 'error';

export interface CompletionSnapshot<T, K> {
  status: CompletionStatus;
  anchor: CompletionAnchor | null;
  items: readonly T[];
  activeKey: K | null;
  activeIndex: number;
  error: unknown;
}

export interface CompletionSessionOptions<T, K, C = unknown> {
  getKey: (item: T) => K;
  getItems: (request: CompletionRequestContext<C>) => readonly T[] | Promise<readonly T[]>;
  isDisabled?: (item: T) => boolean;
  limit?: number;
  onError?: (error: unknown) => void;
}

export interface CompletionSession<T, K, C = unknown> extends Disposable {
  readonly collection: CollectionController<T, K>;
  snapshot(): CompletionSnapshot<T, K>;
  complete(anchor: CompletionAnchor | null, context: C): Promise<CompletionSnapshot<T, K>>;
  move(delta: number): boolean;
  accept(): T | undefined;
  cancel(): void;
  subscribe(listener: (snapshot: CompletionSnapshot<T, K>) => void): () => void;
}

function validateAnchor(anchor: CompletionAnchor): CompletionAnchor {
  if (
    !Number.isSafeInteger(anchor.start)
    || !Number.isSafeInteger(anchor.end)
    || anchor.start < 0
    || anchor.end < anchor.start
  ) throw new RangeError('Completion anchor must be a valid non-negative range');
  return { ...anchor };
}

/** Async, last-request-wins completion with identity-preserving navigation. */
export function createCompletionSession<T, K, C = unknown>(
  options: CompletionSessionOptions<T, K, C>,
): CompletionSession<T, K, C> {
  const limit = options.limit ?? 50;
  if (!Number.isSafeInteger(limit) || limit < 1) {
    throw new RangeError('Completion limit must be a positive safe integer');
  }
  const listeners = new Set<(snapshot: CompletionSnapshot<T, K>) => void>();
  const collection = createCollectionController<T, K>({
    items: [],
    getKey: options.getKey,
    isDisabled: options.isDisabled,
    loop: true,
    viewportSize: limit,
  });
  let status: CompletionStatus = 'idle';
  let anchor: CompletionAnchor | null = null;
  let error: unknown = null;
  let requestId = 0;
  let abortController: AbortController | null = null;
  let disposed = false;

  const snapshot = (): CompletionSnapshot<T, K> => {
    const current = collection.snapshot();
    return {
      status,
      anchor: anchor ? { ...anchor } : null,
      items: [...current.items],
      activeKey: current.activeKey,
      activeIndex: current.activeIndex,
      error,
    };
  };
  const notify = () => {
    const current = snapshot();
    for (const listener of [...listeners]) listener(current);
  };
  const reset = () => {
    abortController?.abort();
    abortController = null;
    requestId++;
    anchor = null;
    error = null;
    status = 'idle';
    collection.reconcile([]);
    notify();
  };

  return {
    collection,
    get disposed() {
      return disposed;
    },
    snapshot,
    async complete(nextAnchor, context) {
      if (disposed) throw new Error('CompletionSession has been disposed');
      if (nextAnchor === null) {
        reset();
        return snapshot();
      }
      abortController?.abort();
      const controller = new AbortController();
      abortController = controller;
      const currentRequest = ++requestId;
      anchor = validateAnchor(nextAnchor);
      error = null;
      status = 'loading';
      notify();
      try {
        const resolved = await options.getItems({
          anchor: { ...anchor },
          context,
          signal: controller.signal,
        });
        if (disposed || controller.signal.aborted || currentRequest !== requestId) return snapshot();
        collection.reconcile([...resolved].slice(0, limit));
        collection.first();
        status = collection.snapshot().items.length > 0 ? 'open' : 'empty';
      } catch (cause) {
        if (disposed || controller.signal.aborted || currentRequest !== requestId) return snapshot();
        error = cause;
        status = 'error';
        collection.reconcile([]);
        options.onError?.(cause);
      }
      notify();
      return snapshot();
    },
    move: (delta) => status === 'open' && collection.move(delta),
    accept() {
      if (status !== 'open') return undefined;
      const item = collection.activate();
      if (item !== undefined) reset();
      return item;
    },
    cancel: reset,
    subscribe(listener) {
      if (disposed) throw new Error('CompletionSession has been disposed');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      abortController?.abort();
      abortController = null;
      listeners.clear();
    },
  };
}
