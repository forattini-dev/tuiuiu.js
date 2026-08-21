import { createFocusTrap } from '../core/focus.js';
import {
  getRuntimeScope,
  getRuntimeResource,
  RUNTIME_RESOURCE_DISPOSE,
  runInRuntimeScope,
  type RuntimeScope,
} from '../core/runtime-scope.js';
import {
  getInteractionRuntime,
  type BindingRegistration,
  type CommandRegistration,
  type InteractionLease,
  type InteractionRuntime,
} from './runtime.js';

export type OverlayCloseReason =
  | 'programmatic'
  | 'escape'
  | 'backdrop'
  | 'timeout'
  | 'dispose';

export type OverlayPriority = 'low' | 'normal' | 'high' | 'critical';
export type OverlayPlacement =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export interface OverlayViewport {
  width: number;
  height: number;
}

export interface OverlayOutcome<TResult = unknown> {
  reason: OverlayCloseReason;
  value?: TResult;
}

export interface OverlaySpec<TContent = unknown, TResult = unknown> {
  id?: string;
  content: TContent | (() => TContent);
  priority?: OverlayPriority;
  blocking?: boolean;
  captureFocus?: boolean;
  hidden?: boolean;
  placement?: OverlayPlacement;
  margin?: number;
  visibleWhen?: (viewport: OverlayViewport) => boolean;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
  backdrop?: boolean;
  timeoutMs?: number;
  beforeClose?: (reason: OverlayCloseReason) => boolean | Promise<boolean>;
  onOpen?: () => void;
  onClose?: (outcome: OverlayOutcome<TResult>) => void;
  data?: unknown;
}

export interface OverlaySnapshotEntry<TContent = unknown> {
  id: string;
  content: TContent | (() => TContent);
  priority: OverlayPriority;
  blocking: boolean;
  captureFocus: boolean;
  hidden: boolean;
  placement: OverlayPlacement;
  margin: number;
  closeOnEscape: boolean;
  closeOnBackdrop: boolean;
  backdrop: boolean;
  order: number;
  data?: unknown;
}

export interface OverlaySnapshot<TContent = unknown> {
  entries: readonly OverlaySnapshotEntry<TContent>[];
  activeId: string | null;
  backdropId: string | null;
}

export interface OverlaySession<TContent = unknown, TResult = unknown> {
  readonly id: string;
  readonly closed: Promise<OverlayOutcome<TResult>>;
  readonly isOpen: boolean;
  update(patch: Partial<Omit<OverlaySpec<TContent, TResult>, 'id'>>): boolean;
  close(value?: TResult, reason?: OverlayCloseReason): Promise<boolean>;
  show(): boolean;
  hide(): boolean;
  focus(): boolean;
  unfocus(): boolean;
}

export interface OverlayFocusAdapter {
  mount(id: string): void;
  activate(id: string): void;
  deactivate(id: string): void;
  unmount(id: string): void;
  dispose(): void;
}

export interface OverlayHostOptions {
  runtime?: InteractionRuntime;
  focus?: OverlayFocusAdapter;
  onError?: (error: unknown) => void;
  /** Optional namespace when multiple hosts intentionally share one runtime. */
  commandNamespace?: string;
  isTextSelecting?: () => boolean;
}

export interface OverlayHost<TContent = unknown> {
  readonly disposed: boolean;
  open<TResult = unknown>(spec: OverlaySpec<TContent, TResult>): OverlaySession<TContent, TResult>;
  close(id: string, value?: unknown, reason?: OverlayCloseReason): Promise<boolean>;
  bringToTop(id: string): boolean;
  setViewport(width: number, height: number): void;
  snapshot(): OverlaySnapshot<TContent>;
  pointerDownBackdrop(id: string): boolean;
  pointerUpBackdrop(id: string): boolean;
  subscribe(listener: (snapshot: OverlaySnapshot<TContent>) => void): () => void;
  dispose(): void;
}

interface InternalEntry<TContent> {
  id: string;
  spec: OverlaySpec<TContent, unknown>;
  order: number;
  lease: InteractionLease | null;
  command: CommandRegistration;
  binding: BindingRegistration;
  timer?: ReturnType<typeof setTimeout>;
  closing?: Promise<boolean>;
  resolve: (outcome: OverlayOutcome<unknown>) => void;
  closed: Promise<OverlayOutcome<unknown>>;
}

const OVERLAY_HOST = Symbol('tuiuiu.overlay-host');
const PRIORITY: Record<OverlayPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  critical: 4,
};

export function createOverlayFocusAdapter(): OverlayFocusAdapter {
  const scope = getRuntimeScope();
  const traps = new Map<string, ReturnType<typeof createFocusTrap>>();
  const scoped = <T>(operation: () => T): T => runInRuntimeScope(scope, operation);
  return {
    mount(id) {
      if (traps.has(id)) return;
      traps.set(id, scoped(() => createFocusTrap({ id: `overlay:${id}`, restoreFocus: true })));
    },
    activate(id) {
      scoped(() => traps.get(id)?.activate());
    },
    deactivate(id) {
      scoped(() => traps.get(id)?.deactivate());
    },
    unmount(id) {
      const trap = traps.get(id);
      if (!trap) return;
      scoped(() => trap.destroy());
      traps.delete(id);
    },
    dispose() {
      scoped(() => {
        for (const trap of traps.values()) trap.destroy();
      });
      traps.clear();
    },
  };
}

function validateSpec<TContent>(spec: OverlaySpec<TContent, unknown>): void {
  if (spec.id !== undefined && spec.id.trim().length === 0) {
    throw new TypeError('Overlay id must be a non-empty string');
  }
  if (
    spec.timeoutMs !== undefined
    && (!Number.isFinite(spec.timeoutMs) || spec.timeoutMs < 0)
  ) {
    throw new RangeError('Overlay timeoutMs must be a finite non-negative number');
  }
  if (spec.margin !== undefined && (!Number.isFinite(spec.margin) || spec.margin < 0)) {
    throw new RangeError('Overlay margin must be a finite non-negative number');
  }
}

export function createOverlayHost<TContent = unknown>(
  options: OverlayHostOptions = {},
): OverlayHost<TContent> {
  const runtime = options.runtime ?? getInteractionRuntime();
  const focus = options.focus ?? createOverlayFocusAdapter();
  const entries = new Map<string, InternalEntry<TContent>>();
  const listeners = new Set<(snapshot: OverlaySnapshot<TContent>) => void>();
  let nextId = 1;
  let nextOrder = 1;
  let activeId: string | null = null;
  let backdropPressId: string | null = null;
  let isDisposed = false;
  let viewport: OverlayViewport = { width: 80, height: 24 };

  const sorted = () => [...entries.values()].sort((left, right) => {
    const priority = PRIORITY[left.spec.priority ?? 'normal'] - PRIORITY[right.spec.priority ?? 'normal'];
    return priority || left.order - right.order;
  });

  const isVisible = (entry: InternalEntry<TContent>) => (
    !(entry.spec.hidden ?? false) && (entry.spec.visibleWhen?.(viewport) ?? true)
  );

  const activeEntry = (ordered = sorted()) => [...ordered].reverse().find(
    (entry) => isVisible(entry) && ((entry.spec.blocking ?? false) || (entry.spec.captureFocus ?? false)),
  ) ?? null;

  const buildSnapshot = (): OverlaySnapshot<TContent> => {
    const ordered = sorted();
    const topBlocking = [...ordered].reverse().find(
      (entry) => isVisible(entry) && (entry.spec.blocking ?? false),
    );
    return {
      entries: ordered.map((entry) => ({
        id: entry.id,
        content: entry.spec.content,
        priority: entry.spec.priority ?? 'normal',
        blocking: entry.spec.blocking ?? false,
        captureFocus: entry.spec.captureFocus ?? false,
        hidden: !isVisible(entry),
        placement: entry.spec.placement ?? 'center',
        margin: entry.spec.margin ?? 0,
        closeOnEscape: entry.spec.closeOnEscape ?? true,
        closeOnBackdrop: entry.spec.closeOnBackdrop ?? false,
        backdrop: entry.spec.backdrop ?? (entry.spec.blocking ?? false),
        order: entry.order,
        data: entry.spec.data,
      })),
      activeId: activeEntry(ordered)?.id ?? null,
      backdropId: topBlocking && (topBlocking.spec.backdrop ?? true) ? topBlocking.id : null,
    };
  };

  const notify = () => {
    const snapshot = buildSnapshot();
    for (const listener of [...listeners]) {
      try {
        listener(snapshot);
      } catch (error) {
        options.onError?.(error);
      }
    }
  };

  const syncActive = () => {
    const next = activeEntry();
    if (activeId !== next?.id) {
      if (activeId && entries.get(activeId)?.spec.captureFocus) focus.deactivate(activeId);
      activeId = next?.id ?? null;
      if (activeId && next?.spec.captureFocus) focus.activate(activeId);
    }
    for (const entry of entries.values()) {
      if (entry !== next) {
        entry.lease?.dispose();
        entry.lease = null;
      }
    }
    if (next && !next.lease) {
      next.lease = runtime.enter({
        mode: 'overlay',
        target: next.id,
        exclusive: next.spec.blocking ?? false,
      });
    }
  };

  const schedule = (entry: InternalEntry<TContent>) => {
    if (entry.timer) clearTimeout(entry.timer);
    entry.timer = undefined;
    const timeout = entry.spec.timeoutMs;
    if (timeout === undefined || timeout === 0) return;
    entry.timer = setTimeout(() => {
      entry.timer = undefined;
      void close(entry.id, undefined, 'timeout');
    }, timeout);
    entry.timer.unref?.();
  };

  const finalize = (entry: InternalEntry<TContent>, outcome: OverlayOutcome<unknown>) => {
    if (!entries.delete(entry.id)) return false;
    if (entry.timer) clearTimeout(entry.timer);
    entry.command.dispose();
    entry.binding.dispose();
    entry.lease?.dispose();
    if (backdropPressId === entry.id) backdropPressId = null;
    focus.unmount(entry.id);
    syncActive();
    entry.resolve(outcome);
    try {
      entry.spec.onClose?.(outcome);
    } catch (error) {
      options.onError?.(error);
    }
    notify();
    return true;
  };

  const close = (
    id: string,
    value?: unknown,
    reason: OverlayCloseReason = 'programmatic',
  ): Promise<boolean> => {
    const entry = entries.get(id);
    if (!entry) return Promise.resolve(false);
    if (entry.closing) return entry.closing;
    try {
      const allowed = reason === 'dispose' ? true : entry.spec.beforeClose?.(reason);
      if (allowed && typeof (allowed as Promise<boolean>).then === 'function') {
        entry.closing = Promise.resolve(allowed)
          .then((result) => result === false ? false : finalize(entry, { reason, value }))
          .catch((error) => {
            options.onError?.(error);
            return false;
          })
          .finally(() => {
            entry.closing = undefined;
          });
        return entry.closing;
      }
      return Promise.resolve(allowed === false ? false : finalize(entry, { reason, value }));
    } catch (error) {
      options.onError?.(error);
      return Promise.resolve(false);
    }
  };

  const host: OverlayHost<TContent> = {
    get disposed() {
      return isDisposed;
    },
    open<TResult>(input: OverlaySpec<TContent, TResult>) {
      if (isDisposed) throw new Error('OverlayHost has been disposed');
      const spec = input as OverlaySpec<TContent, unknown>;
      validateSpec(spec);
      const id = spec.id ?? `overlay-${nextId++}`;
      if (entries.has(id)) throw new Error(`Overlay already open: ${id}`);
      let resolve!: (outcome: OverlayOutcome<unknown>) => void;
      const closed = new Promise<OverlayOutcome<unknown>>((done) => {
        resolve = done;
      });
      const commandId = `overlay.close:${options.commandNamespace ? `${options.commandNamespace}:` : ''}${id}`;
      const command = runtime.registerCommand({
        id: commandId,
        title: `Close overlay ${id}`,
        category: 'Overlay',
        enabled: () => entries.get(id)?.spec.closeOnEscape ?? true,
        run: () => {
          void close(id, undefined, 'escape');
        },
      });
      const binding = runtime.bind({
        command: commandId,
        keys: 'escape',
        mode: 'overlay',
        target: id,
        priority: 100,
      });
      const entry: InternalEntry<TContent> = {
        id,
        spec,
        order: nextOrder++,
        lease: null,
        command,
        binding,
        resolve,
        closed,
      };
      entries.set(id, entry);
      if (spec.captureFocus ?? false) focus.mount(id);
      syncActive();
      schedule(entry);
      try {
        spec.onOpen?.();
      } catch (error) {
        options.onError?.(error);
      }
      notify();
      const session: OverlaySession<TContent, TResult> = {
        id,
        get closed() {
          return closed as Promise<OverlayOutcome<TResult>>;
        },
        get isOpen() {
          return entries.has(id);
        },
        update(patch) {
          const current = entries.get(id);
          if (!current) return false;
          const next: OverlaySpec<TContent, unknown> = {
            ...current.spec,
            ...(patch as Partial<OverlaySpec<TContent, unknown>>),
          };
          validateSpec(next);
          current.spec = next;
          if (next.captureFocus ?? false) focus.mount(id);
          else focus.unmount(id);
          current.command.update({
            id: commandId,
            title: `Close overlay ${id}`,
            category: 'Overlay',
            enabled: () => entries.get(id)?.spec.closeOnEscape ?? true,
            run: () => { void close(id, undefined, 'escape'); },
          });
          schedule(current);
          syncActive();
          notify();
          return true;
        },
        close(value, reason) {
          return close(id, value, reason);
        },
        show() {
          return session.update({ hidden: false });
        },
        hide() {
          return session.update({ hidden: true });
        },
        focus() {
          const updated = session.update({ captureFocus: true, hidden: false });
          if (updated) host.bringToTop(id);
          return updated;
        },
        unfocus() {
          return session.update({ captureFocus: false });
        },
      };
      return session;
    },
    close,
    bringToTop(id) {
      const entry = entries.get(id);
      if (!entry) return false;
      entry.order = nextOrder++;
      syncActive();
      notify();
      return true;
    },
    setViewport(width, height) {
      if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
        throw new RangeError('Overlay viewport must use positive finite dimensions');
      }
      viewport = { width: Math.trunc(width), height: Math.trunc(height) };
      syncActive();
      notify();
    },
    snapshot: buildSnapshot,
    pointerDownBackdrop(id) {
      if (buildSnapshot().backdropId !== id) return false;
      backdropPressId = id;
      return true;
    },
    pointerUpBackdrop(id) {
      const matches = backdropPressId === id && buildSnapshot().backdropId === id;
      backdropPressId = null;
      if (!matches) return false;
      if (options.isTextSelecting?.()) return true;
      const entry = entries.get(id);
      if (!(entry?.spec.closeOnBackdrop ?? false)) return true;
      void close(id, undefined, 'backdrop');
      return true;
    },
    subscribe(listener) {
      if (isDisposed) throw new Error('OverlayHost has been disposed');
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    dispose() {
      if (isDisposed) return;
      isDisposed = true;
      for (const entry of [...entries.values()].reverse()) {
        finalize(entry, { reason: 'dispose' });
      }
      listeners.clear();
      focus.dispose();
    },
  };

  Object.assign(host, {
    [RUNTIME_RESOURCE_DISPOSE]: () => host.dispose(),
  });
  return host;
}

export function getOverlayHost<TContent = unknown>(scope?: RuntimeScope): OverlayHost<TContent> {
  return getRuntimeResource(
    OVERLAY_HOST,
    () => createOverlayHost<TContent>(),
    scope,
  );
}
