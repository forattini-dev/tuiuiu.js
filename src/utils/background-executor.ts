import { Worker } from 'node:worker_threads';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

export interface BackgroundTaskRequest<T = unknown> {
  type: string;
  payload: T;
}

export interface BackgroundTaskError {
  name: string;
  message: string;
  stack?: string;
  code?: string;
}

export interface BackgroundTaskEvent<T = unknown> {
  kind: string;
  taskId: string;
  timestamp: number;
  payload: T;
}

export type BackgroundTaskEventListener = (event: BackgroundTaskEvent) => void;

export interface BackgroundTaskReporter {
  emit: <T = unknown>(kind: string, payload: T) => void;
}

export type BackgroundTaskResult<T = unknown> =
  | { status: 'resolved'; taskId: string; value: T }
  | { status: 'rejected'; taskId: string; error: BackgroundTaskError }
  | { status: 'cancelled'; taskId: string; reason?: string };

export interface BackgroundTaskHandle<T = unknown> {
  id: string;
  result: Promise<BackgroundTaskResult<T>>;
  cancel: (reason?: string) => void;
  subscribe: (listener: BackgroundTaskEventListener) => () => void;
}

export interface BackgroundTaskOptions {
  /** Abort this submission when the external signal is aborted. */
  signal?: AbortSignal;
  /** Cancel this submission after the given number of milliseconds. */
  timeoutMs?: number;
}

export type BackgroundTaskHandler<TPayload = unknown, TResult = unknown> = (
  payload: TPayload,
  signal: AbortSignal,
  reporter: BackgroundTaskReporter
) => TResult | Promise<TResult>;

/**
 * A dynamically-dispatched registry may contain unrelated payload and result
 * types. Individual submit() calls retain their generic contract; only this
 * internal dispatch boundary erases those types.
 */
export type BackgroundTaskHandlers = Record<string, BackgroundTaskHandler<any, any>>;

export interface BackgroundExecutor {
  submit<TPayload = unknown, TResult = unknown>(
    request: BackgroundTaskRequest<TPayload>,
    options?: BackgroundTaskOptions,
  ): BackgroundTaskHandle<TResult>;
  destroy: () => Promise<void>;
  /** Current lifecycle state. */
  readonly state?: BackgroundExecutorState;
  /** Number of tasks waiting for a terminal result. */
  readonly pendingCount?: number;
}

export type BackgroundExecutorState =
  | 'active'
  | 'failed'
  | 'destroying'
  | 'destroyed';

export const THREAD_BUS_TASK_TYPE = '__threadBusMessage__';
export const THREAD_BUS_EVENT_KIND = 'thread-bus';

export interface InterThreadBusMessage<T = unknown> {
  id: string;
  from: string;
  to?: string;
  channel: string;
  type: string;
  payload: T;
  timestamp: number;
}

export type ThreadBusListener<T = unknown> = (event: InterThreadBusMessage<T>) => void;

export interface ThreadBus {
  post<T>(
    message: Omit<InterThreadBusMessage<T>, 'id' | 'timestamp' | 'from'> & {
      from?: string;
      to?: string;
      channel?: string;
    }
  ): void;
  sendToMain<T>(type: string, payload: T, channel?: string, from?: string): void;
  broadcast<T>(type: string, payload: T, channel?: string, from?: string): void;
  subscribe<T>(listener: ThreadBusListener<T>): () => void;
  onChannel<T>(channel: string, listener: ThreadBusListener<T>): () => void;
  destroy: () => Promise<void>;
}

export interface ThreadBusOptions {
  threads: Record<string, TaskBridge>;
  mainThreadName?: string;
  taskType?: string;
  defaultChannel?: string;
  mirrorToMain?: boolean;
  /** Whether destroy() also destroys the supplied bridges (default: true). */
  destroyThreads?: boolean;
}

export interface TaskBridge {
  execute<TPayload = unknown, TResult = unknown>(
    type: string,
    payload: TPayload,
    options?: BackgroundTaskOptions,
  ): BackgroundTaskHandle<TResult>;
  submit<TPayload = unknown, TResult = unknown>(
    request: BackgroundTaskRequest<TPayload>,
    options?: BackgroundTaskOptions,
  ): BackgroundTaskHandle<TResult>;
  destroy: () => Promise<void>;
  /** Current lifecycle state for health-aware scheduling. */
  readonly state?: BackgroundExecutorState;
  /** Number of tasks waiting for a terminal result. */
  readonly pendingCount?: number;
}

export interface WorkerExecutorOptions {
  modulePath: string;
  workerName?: string;
  /** Maximum unsettled tasks accepted by this worker (default: 1024). */
  maxPending?: number;
  /** Default timeout applied when a submission does not provide one. */
  defaultTimeoutMs?: number;
}

export type TaskBridgePoolScheduler = 'round-robin' | 'least-pending';

export interface TaskBridgePoolOptions extends WorkerExecutorOptions {
  poolSize?: number;
  scheduler?: TaskBridgePoolScheduler;
  /** Replace failed workers before accepting new work (default: true). */
  restartFailedWorkers?: boolean;
}

interface PendingTask {
  controller: AbortController;
  cleanup: () => void;
  resolve: (result: BackgroundTaskResult<any>) => void;
  listeners: Set<BackgroundTaskEventListener>;
  cancelled: boolean;
  settled: boolean;
}

function serializeError(error: unknown): BackgroundTaskError {
  if (error instanceof Error) {
    const maybeCode = (error as Error & { code?: string }).code;
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: maybeCode,
    };
  }

  return {
    name: 'Error',
    message: String(error),
  };
}

function toModuleHref(modulePath: string): string {
  if (modulePath.startsWith('file:') || modulePath.startsWith('data:')) {
    return modulePath;
  }

  const absolutePath = path.isAbsolute(modulePath)
    ? modulePath
    : path.resolve(process.cwd(), modulePath);
  return pathToFileURL(absolutePath).href;
}

function createTaskIdFactory() {
  return () => `task-${++globalTaskId}`;
}

let globalTaskId = 0;

const DEFAULT_MAX_PENDING_TASKS = 1024;
const MAX_PENDING_TASKS = 1_000_000;
const MAX_TIMEOUT_MS = 2_147_483_647;

interface ExecutorLimits {
  maxPending?: number;
  defaultTimeoutMs?: number;
}

function validateTimeoutMs(
  timeoutMs: number | undefined,
  optionName: string,
): void {
  if (
    timeoutMs !== undefined
    && (
      !Number.isSafeInteger(timeoutMs)
      || timeoutMs < 0
      || timeoutMs > MAX_TIMEOUT_MS
    )
  ) {
    throw new RangeError(
      `${optionName} must be a safe integer between 0 and ${MAX_TIMEOUT_MS}`,
    );
  }
}

function normalizeExecutorLimits(options: ExecutorLimits): {
  maxPending: number;
  defaultTimeoutMs?: number;
} {
  const maxPending = options.maxPending ?? DEFAULT_MAX_PENDING_TASKS;
  if (
    !Number.isSafeInteger(maxPending)
    || maxPending < 1
    || maxPending > MAX_PENDING_TASKS
  ) {
    throw new RangeError(
      `maxPending must be a safe integer between 1 and ${MAX_PENDING_TASKS}`,
    );
  }
  validateTimeoutMs(options.defaultTimeoutMs, 'defaultTimeoutMs');
  return {
    maxPending,
    defaultTimeoutMs: options.defaultTimeoutMs,
  };
}

function taskCancellationReason(reason: unknown, fallback: string): string {
  if (reason instanceof Error) return reason.message;
  if (reason === undefined || reason === null || reason === '') return fallback;
  return String(reason);
}

function configurePendingTaskControls(
  pendingTask: PendingTask,
  options: BackgroundTaskOptions,
  defaultTimeoutMs: number | undefined,
  cancel: (reason: string) => void,
): void {
  const timeoutMs = options.timeoutMs ?? defaultTimeoutMs;
  validateTimeoutMs(timeoutMs, 'timeoutMs');

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const externalSignal = options.signal;
  const onAbort = () => {
    cancel(taskCancellationReason(externalSignal?.reason, 'Aborted'));
  };

  if (externalSignal) {
    externalSignal.addEventListener('abort', onAbort, { once: true });
  }
  if (timeoutMs !== undefined) {
    timeoutId = setTimeout(() => {
      cancel(`Timed out after ${timeoutMs}ms`);
    }, timeoutMs);
  }

  pendingTask.cleanup = () => {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onAbort);
  };
}

function createTaskEvent<T = unknown>(
  taskId: string,
  kind: string,
  payload: T
): BackgroundTaskEvent<T> {
  return {
    kind,
    taskId,
    timestamp: Date.now(),
    payload,
  };
}

function emitPendingTaskEvent(
  pendingTask: PendingTask | undefined,
  event: BackgroundTaskEvent
): void {
  if (!pendingTask || pendingTask.settled || pendingTask.cancelled || pendingTask.controller.signal.aborted) {
    return;
  }

  for (const listener of pendingTask.listeners) {
    try {
      listener(event);
    } catch {
      // A progress observer must not be able to fail the task or starve
      // the remaining observers.
    }
  }
}

function settlePendingTask(
  pending: Map<string, PendingTask>,
  taskId: string
): PendingTask | undefined {
  const pendingTask = pending.get(taskId);
  if (!pendingTask) {
    return undefined;
  }

  pending.delete(taskId);
  pendingTask.settled = true;
  pendingTask.cleanup();
  pendingTask.listeners.clear();
  return pendingTask;
}

function createRejectedTaskHandle<TResult = unknown>(
  taskId: string,
  name: string,
  message: string
): BackgroundTaskHandle<TResult> {
  return {
    id: taskId,
    result: Promise.resolve({
      status: 'rejected',
      taskId,
      error: { name, message },
    }),
    cancel() {},
    subscribe() {
      return () => {};
    },
  };
}

function createCancelledTaskHandle<TResult = unknown>(
  taskId: string,
  reason: string,
): BackgroundTaskHandle<TResult> {
  return {
    id: taskId,
    result: Promise.resolve({
      status: 'cancelled',
      taskId,
      reason,
    }),
    cancel() {},
    subscribe() {
      return () => {};
    },
  };
}

export function createInlineBackgroundExecutor(
  handlers: BackgroundTaskHandlers,
  options: ExecutorLimits = {},
): BackgroundExecutor {
  const limits = normalizeExecutorLimits(options);
  const nextTaskId = createTaskIdFactory();
  const pending = new Map<string, PendingTask>();
  let state: BackgroundExecutorState = 'active';

  return {
    submit<TPayload = unknown, TResult = unknown>(
      request: BackgroundTaskRequest<TPayload>,
      taskOptions: BackgroundTaskOptions = {},
    ): BackgroundTaskHandle<TResult> {
      const taskId = nextTaskId();
      if (state !== 'active') {
        return createRejectedTaskHandle<TResult>(
          taskId,
          'ExecutorUnavailableError',
          `Background executor is ${state}`
        );
      }
      if (taskOptions.signal?.aborted) {
        return createCancelledTaskHandle<TResult>(
          taskId,
          taskCancellationReason(taskOptions.signal.reason, 'Aborted'),
        );
      }
      if (pending.size >= limits.maxPending) {
        return createRejectedTaskHandle<TResult>(
          taskId,
          'QueueSaturatedError',
          `Background executor has reached maxPending (${limits.maxPending})`,
        );
      }
      try {
        validateTimeoutMs(
          taskOptions.timeoutMs ?? limits.defaultTimeoutMs,
          'timeoutMs',
        );
      } catch (error) {
        return createRejectedTaskHandle<TResult>(
          taskId,
          'InvalidTaskOptionsError',
          error instanceof Error ? error.message : String(error),
        );
      }

      const handler = handlers[request.type];
      const controller = new AbortController();
      const pendingTask: PendingTask = {
        controller,
        cleanup: () => {},
        resolve: () => {},
        listeners: new Set(),
        cancelled: false,
        settled: false,
      };
      const cancelTask = (reason: string): void => {
        const current = pending.get(taskId);
        if (!current) return;
        current.cancelled = true;
        current.controller.abort(reason);
        settlePendingTask(pending, taskId);
        current.resolve({
          status: 'cancelled',
          taskId,
          reason,
        });
      };
      const reporter: BackgroundTaskReporter = {
        emit(kind, payload) {
          emitPendingTaskEvent(
            pending.get(taskId),
            createTaskEvent(taskId, kind, payload)
          );
        },
      };

      const result = new Promise<BackgroundTaskResult<TResult>>((resolve) => {
        pendingTask.resolve = resolve;
        pending.set(taskId, pendingTask);

        queueMicrotask(async () => {
          if (!pending.has(taskId)) {
            return;
          }

          if (!handler) {
            settlePendingTask(pending, taskId);
            resolve({
              status: 'rejected',
              taskId,
              error: {
                name: 'UnknownTaskError',
                message: `Unknown background task "${request.type}"`,
              },
            });
            return;
          }

          if (controller.signal.aborted) {
            settlePendingTask(pending, taskId);
            resolve({
              status: 'cancelled',
              taskId,
              reason: String(controller.signal.reason ?? 'Cancelled'),
            });
            return;
          }

          try {
            const value = await handler(request.payload, controller.signal, reporter);
            settlePendingTask(pending, taskId);
            if (controller.signal.aborted) {
              resolve({
                status: 'cancelled',
                taskId,
                reason: String(controller.signal.reason ?? 'Cancelled'),
              });
              return;
            }

            resolve({
              status: 'resolved',
              taskId,
              value: value as TResult,
            });
          } catch (error) {
            settlePendingTask(pending, taskId);
            if (controller.signal.aborted) {
              resolve({
                status: 'cancelled',
                taskId,
                reason: String(controller.signal.reason ?? 'Cancelled'),
              });
              return;
            }

            resolve({
              status: 'rejected',
              taskId,
              error: serializeError(error),
            });
          }
        });
      });

      const handle: BackgroundTaskHandle<TResult> = {
        id: taskId,
        result,
        cancel(reason) {
          cancelTask(reason ?? 'Cancelled');
        },
        subscribe(listener) {
          const pendingTask = pending.get(taskId);
          if (!pendingTask || pendingTask.settled || pendingTask.cancelled) {
            return () => {};
          }

          pendingTask.listeners.add(listener);
          return () => {
            pendingTask.listeners.delete(listener);
          };
        },
      };
      configurePendingTaskControls(
        pendingTask,
        taskOptions,
        limits.defaultTimeoutMs,
        cancelTask,
      );
      return handle;
    },

    async destroy() {
      if (state === 'destroyed' || state === 'destroying') return;
      state = 'destroying';
      for (const [taskId, pendingTask] of pending) {
        pendingTask.cancelled = true;
        pendingTask.settled = true;
        pendingTask.cleanup();
        pendingTask.listeners.clear();
        pendingTask.controller.abort('Executor destroyed');
        pendingTask.resolve({
          status: 'cancelled',
          taskId,
          reason: 'Executor destroyed',
        });
      }
      pending.clear();
      state = 'destroyed';
    },

    get state() {
      return state;
    },

    get pendingCount() {
      return pending.size;
    },
  };
}

function createWorkerSource(): string {
  return `
import { parentPort, workerData } from 'node:worker_threads';

const serializeError = (error) => {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
    };
  }

  return {
    name: 'Error',
    message: String(error),
  };
};

const loadedModule = await import(workerData.modulePath);
const handlers = loadedModule.backgroundTaskHandlers ?? loadedModule.handlers ?? loadedModule.default;
if (!handlers || typeof handlers !== 'object') {
  throw new Error('Worker background executor module must export a handlers object.');
}

const controllers = new Map();
const cancelledTasks = new Map();

parentPort.on('message', async (message) => {
  if (!message || typeof message !== 'object') {
    return;
  }

  if (message.kind === 'cancel') {
    const controller = controllers.get(message.taskId);
    if (controller) {
      controller.abort(message.reason ?? 'Cancelled');
    } else {
      cancelledTasks.set(message.taskId, message.reason ?? 'Cancelled');
    }
    return;
  }

  if (message.kind !== 'run') {
    return;
  }

  const handler = handlers[message.taskType];
  if (typeof handler !== 'function') {
    parentPort.postMessage({
      kind: 'result',
      result: {
        status: 'rejected',
        taskId: message.taskId,
        error: {
          name: 'UnknownTaskError',
          message: 'Unknown background task "' + message.taskType + '"',
        },
      },
    });
    return;
  }

  const controller = new AbortController();
  const pendingReason = cancelledTasks.get(message.taskId);
  if (pendingReason !== undefined) {
    controller.abort(pendingReason);
    cancelledTasks.delete(message.taskId);
  }
  controllers.set(message.taskId, controller);
  const reporter = {
    emit(kind, payload) {
      if (controller.signal.aborted) {
        return;
      }

      parentPort.postMessage({
        kind: 'event',
        event: {
          kind,
          taskId: message.taskId,
          timestamp: Date.now(),
          payload,
        },
      });
    },
  };

  try {
    const value = await handler(message.payload, controller.signal, reporter);
    parentPort.postMessage({
      kind: 'result',
      result: controller.signal.aborted
        ? {
            status: 'cancelled',
            taskId: message.taskId,
            reason: String(controller.signal.reason ?? 'Cancelled'),
          }
        : {
            status: 'resolved',
            taskId: message.taskId,
            value,
          },
    });
  } catch (error) {
    parentPort.postMessage({
      kind: 'result',
      result: controller.signal.aborted
        ? {
            status: 'cancelled',
            taskId: message.taskId,
            reason: String(controller.signal.reason ?? 'Cancelled'),
          }
        : {
            status: 'rejected',
            taskId: message.taskId,
            error: serializeError(error),
          },
    });
  } finally {
    controllers.delete(message.taskId);
  }
});
`;
}

export function createWorkerExecutor(
  modulePath: string,
  options?: Omit<WorkerExecutorOptions, 'modulePath'>
): BackgroundExecutor;
export function createWorkerExecutor(
  options: WorkerExecutorOptions
): BackgroundExecutor;
export function createWorkerExecutor(
  modulePathOrOptions: string | WorkerExecutorOptions,
  options?: Omit<WorkerExecutorOptions, 'modulePath'>
): BackgroundExecutor {
  const resolvedOptions = typeof modulePathOrOptions === 'string'
    ? {
        modulePath: modulePathOrOptions,
        ...options,
      }
    : modulePathOrOptions;

  const limits = normalizeExecutorLimits(resolvedOptions);
  const nextTaskId = createTaskIdFactory();
  const pending = new Map<string, PendingTask>();
  let state: BackgroundExecutorState = 'active';
  const worker = new Worker(
    new URL(`data:text/javascript;charset=utf-8,${encodeURIComponent(createWorkerSource())}`),
    {
      name: resolvedOptions.workerName ?? 'tuiuiu-background-executor',
      workerData: {
        modulePath: toModuleHref(resolvedOptions.modulePath),
      },
    }
  );

  worker.on('message', (message: {
    kind?: string;
    event?: BackgroundTaskEvent;
    result?: BackgroundTaskResult;
  }) => {
    if (message?.kind === 'event' && message.event) {
      const pendingTask = pending.get(message.event.taskId);
      emitPendingTaskEvent(pendingTask, message.event);
      return;
    }

    if (message?.kind !== 'result' || !message.result) {
      return;
    }

    const pendingTask = settlePendingTask(pending, message.result.taskId);
    if (!pendingTask) {
      return;
    }

    pendingTask.resolve(message.result);
  });

  const rejectAllPending = (error: BackgroundTaskError): void => {
    for (const [taskId, pendingTask] of pending) {
      pendingTask.settled = true;
      pendingTask.cleanup();
      pendingTask.listeners.clear();
      pendingTask.resolve({
        status: 'rejected',
        taskId,
        error,
      });
    }
    pending.clear();
  };

  worker.on('error', (error) => {
    if (state === 'destroying' || state === 'destroyed') {
      return;
    }
    state = 'failed';
    rejectAllPending(serializeError(error));
  });

  worker.on('exit', (code) => {
    if (state === 'destroying' || state === 'destroyed') {
      return;
    }

    state = 'failed';
    rejectAllPending({
      name: 'WorkerExitError',
      message: `Background worker exited before shutdown (code ${code})`,
      code: String(code),
    });
  });

  return {
    submit<TPayload = unknown, TResult = unknown>(
      request: BackgroundTaskRequest<TPayload>,
      taskOptions: BackgroundTaskOptions = {},
    ): BackgroundTaskHandle<TResult> {
      const taskId = nextTaskId();
      if (state !== 'active') {
        return createRejectedTaskHandle<TResult>(
          taskId,
          'ExecutorUnavailableError',
          `Background worker is ${state}`
        );
      }
      if (taskOptions.signal?.aborted) {
        return createCancelledTaskHandle<TResult>(
          taskId,
          taskCancellationReason(taskOptions.signal.reason, 'Aborted'),
        );
      }
      if (pending.size >= limits.maxPending) {
        return createRejectedTaskHandle<TResult>(
          taskId,
          'QueueSaturatedError',
          `Background worker has reached maxPending (${limits.maxPending})`,
        );
      }
      try {
        validateTimeoutMs(
          taskOptions.timeoutMs ?? limits.defaultTimeoutMs,
          'timeoutMs',
        );
      } catch (error) {
        return createRejectedTaskHandle<TResult>(
          taskId,
          'InvalidTaskOptionsError',
          error instanceof Error ? error.message : String(error),
        );
      }

      const controller = new AbortController();
      const pendingTask: PendingTask = {
        controller,
        cleanup: () => {},
        resolve: () => {},
        listeners: new Set(),
        cancelled: false,
        settled: false,
      };
      const cancelTask = (reason: string): void => {
        const current = pending.get(taskId);
        if (!current) return;
        current.cancelled = true;
        current.controller.abort(reason);
        settlePendingTask(pending, taskId);
        current.resolve({
          status: 'cancelled',
          taskId,
          reason,
        });
        try {
          worker.postMessage({
            kind: 'cancel',
            taskId,
            reason,
          });
        } catch {
          // The task is already settled; a concurrent worker exit cannot
          // change the result observed by the caller.
        }
      };

      const result = new Promise<BackgroundTaskResult<TResult>>((resolve) => {
        pendingTask.resolve = resolve;
        pending.set(taskId, pendingTask);
      });

      try {
        worker.postMessage({
          kind: 'run',
          taskId,
          taskType: request.type,
          payload: request.payload,
        });
      } catch (error) {
        const orphanedTask = settlePendingTask(pending, taskId);
        orphanedTask?.resolve({
          status: 'rejected',
          taskId,
          error: serializeError(error),
        });
      }

      const handle: BackgroundTaskHandle<TResult> = {
        id: taskId,
        result,
        cancel(reason) {
          cancelTask(reason ?? 'Cancelled');
        },
        subscribe(listener) {
          const pendingTask = pending.get(taskId);
          if (!pendingTask || pendingTask.settled || pendingTask.cancelled) {
            return () => {};
          }

          pendingTask.listeners.add(listener);
          return () => {
            pendingTask.listeners.delete(listener);
          };
        },
      };
      configurePendingTaskControls(
        pendingTask,
        taskOptions,
        limits.defaultTimeoutMs,
        cancelTask,
      );
      return handle;
    },

    async destroy() {
      if (state === 'destroyed' || state === 'destroying') return;
      state = 'destroying';
      for (const [taskId, pendingTask] of pending) {
        pendingTask.cancelled = true;
        pendingTask.settled = true;
        pendingTask.cleanup();
        pendingTask.listeners.clear();
        pendingTask.controller.abort('Executor destroyed');
        pendingTask.resolve({
          status: 'cancelled',
          taskId,
          reason: 'Executor destroyed',
        });
      }
      pending.clear();
      try {
        await worker.terminate();
      } finally {
        state = 'destroyed';
      }
    },

    get state() {
      return state;
    },

    get pendingCount() {
      return pending.size;
    },
  };
}

export function createBackgroundExecutor(options: {
  handlers?: BackgroundTaskHandlers;
  modulePath?: string;
  workerName?: string;
  maxPending?: number;
  defaultTimeoutMs?: number;
}): BackgroundExecutor {
  if (options.modulePath) {
    return createWorkerExecutor({
      modulePath: options.modulePath,
      workerName: options.workerName,
      maxPending: options.maxPending,
      defaultTimeoutMs: options.defaultTimeoutMs,
    });
  }

  return createInlineBackgroundExecutor(options.handlers ?? {}, {
    maxPending: options.maxPending,
    defaultTimeoutMs: options.defaultTimeoutMs,
  });
}

function createBusMessageId(): string {
  return `bus-msg-${Math.random().toString(36).slice(2)}`;
}

function createThreadBusListenerSet(): Map<string, Set<ThreadBusListener<any>>> {
  return new Map();
}

function notifyThreadBusListeners<T>(
  listeners: Set<ThreadBusListener<any>>,
  event: InterThreadBusMessage<T>
): void {
  for (const listener of listeners) {
    try {
      listener(event);
    } catch {
      // Listener isolation keeps routing deterministic when one observer fails.
    }
  }
}

function normalizeThreadBusMessage<T = unknown>(
  source: string,
  rawMessage: InterThreadBusMessage<T> | Omit<InterThreadBusMessage<T>, 'id' | 'timestamp'> | Omit<InterThreadBusMessage<T>, 'id' | 'timestamp' | 'from'> & { from?: string },
  defaults: { mainThreadName: string; defaultChannel: string },
  authoritativeSource = false
): InterThreadBusMessage | null {
  if (!rawMessage || typeof rawMessage !== 'object') {
    return null;
  }

  const messageLike = rawMessage as Partial<InterThreadBusMessage<T>>;
  const type = typeof messageLike.type === 'string' ? messageLike.type : '';
  const channel =
    typeof messageLike.channel === 'string' && messageLike.channel.length > 0
      ? messageLike.channel
      : defaults.defaultChannel;
  const target = typeof messageLike.to === 'string' && messageLike.to.length > 0
    ? messageLike.to
    : defaults.mainThreadName;
  const payload = (messageLike as { payload?: T }).payload;

  if (!type || channel.length === 0) {
    return null;
  }

  return {
    id: messageLike.id ?? createBusMessageId(),
    from: authoritativeSource ? source : messageLike.from ?? source,
    to: target,
    channel,
    type,
    payload: payload as T,
    timestamp: typeof messageLike.timestamp === 'number' ? messageLike.timestamp : Date.now(),
  };
}

export function createThreadBus({
  threads,
  mainThreadName = 'main',
  taskType = THREAD_BUS_TASK_TYPE,
  defaultChannel = 'default',
  mirrorToMain = true,
  destroyThreads = true,
}: ThreadBusOptions): ThreadBus {
  const allListeners = new Set<ThreadBusListener<any>>();
  const channelListeners = createThreadBusListenerSet();
  const activeThreads = new Map<string, TaskBridge>();
  const threadTaskCleanup = new Set<() => void>();
  const defaults = { mainThreadName, defaultChannel };
  let destroyed = false;

  const emitToListeners = (event: InterThreadBusMessage) => {
    notifyThreadBusListeners(allListeners, event);
    notifyThreadBusListeners(channelListeners.get(event.channel) ?? new Set(), event);
  };

  const routeToThread = (message: InterThreadBusMessage): void => {
    if (!message.to) {
      return;
    }

    if (message.to === '*') {
      for (const [threadName, threadBridge] of activeThreads) {
        if (threadName === message.from) {
          continue;
        }

        try {
          threadBridge.execute(taskType, message);
        } catch {
          // One unavailable destination must not prevent a broadcast from
          // reaching the other workers.
        }
      }
      return;
    }

    const destination = activeThreads.get(message.to);
    if (!destination || message.to === message.from) {
      return;
    }

    try {
      destination.execute(taskType, message);
    } catch {
      // A failed destination is isolated from the main bus.
    }
  };

  const post = <T>(
    rawMessage: Omit<InterThreadBusMessage<T>, 'id' | 'timestamp' | 'from'> & {
      from?: string;
      to?: string;
      channel?: string;
    }
  ): void => {
    if (destroyed) return;

    const message = normalizeThreadBusMessage<T>(rawMessage.from ?? mainThreadName, rawMessage, defaults);
    if (!message) {
      return;
    }

    if (mirrorToMain || message.to === mainThreadName) {
      emitToListeners(message);
    }

    routeToThread(message);
  };

  const createThreadBridge = (threadName: string, bridge: TaskBridge): TaskBridge => ({
    execute<TPayload, TResult>(
      type: string,
      payload: TPayload,
      options?: BackgroundTaskOptions,
    ) {
      const handle = bridge.execute<TPayload, TResult>(type, payload, options);
      const unsubscribe = handle.subscribe((event) => {
        if (event.kind !== THREAD_BUS_EVENT_KIND) {
          return;
        }

        const message = normalizeThreadBusMessage(
          threadName,
          event.payload as InterThreadBusMessage<unknown>,
          defaults,
          true
        );
        if (!message) {
          return;
        }

        post({
          from: message.from,
          channel: message.channel,
          to: message.to,
          type: message.type,
          payload: message.payload,
        });
      });
      threadTaskCleanup.add(unsubscribe);
      void handle.result.then(() => {
        unsubscribe();
        threadTaskCleanup.delete(unsubscribe);
      }, () => {
        unsubscribe();
        threadTaskCleanup.delete(unsubscribe);
      });
      return handle;
    },
    submit<TPayload, TResult>(
      request: BackgroundTaskRequest<TPayload>,
      options?: BackgroundTaskOptions,
    ) {
      const handle = bridge.submit<TPayload, TResult>(request, options);
      const unsubscribe = handle.subscribe((event) => {
        if (event.kind !== THREAD_BUS_EVENT_KIND) {
          return;
        }

        const message = normalizeThreadBusMessage(
          threadName,
          event.payload as InterThreadBusMessage<unknown>,
          defaults,
          true
        );
        if (!message) {
          return;
        }

        post({
          from: message.from,
          channel: message.channel,
          to: message.to,
          type: message.type,
          payload: message.payload,
        });
      });
      threadTaskCleanup.add(unsubscribe);
      void handle.result.then(() => {
        unsubscribe();
        threadTaskCleanup.delete(unsubscribe);
      }, () => {
        unsubscribe();
        threadTaskCleanup.delete(unsubscribe);
      });
      return handle;
    },
    async destroy() {
      await bridge.destroy();
    },
    get state() {
      return bridge.state;
    },
    get pendingCount() {
      return bridge.pendingCount;
    },
  });

  for (const [name, bridge] of Object.entries(threads)) {
    activeThreads.set(name, createThreadBridge(name, bridge));
  }

  return {
    post,
    sendToMain(type, payload, channel = defaultChannel, from = mainThreadName) {
      post({
        from,
        to: mainThreadName,
        type,
        payload,
        channel,
      });
    },
    broadcast(type, payload, channel = defaultChannel, from = mainThreadName) {
      post({
        from,
        to: '*',
        channel,
        type,
        payload,
      });
    },
    subscribe(listener) {
      allListeners.add(listener);
      return () => {
        allListeners.delete(listener);
      };
    },
    onChannel(channel, listener) {
      const listeners = channelListeners.get(channel);
      if (!listeners) {
        const next = new Set<ThreadBusListener<any>>();
        next.add(listener);
        channelListeners.set(channel, next);
        return () => {
          const current = channelListeners.get(channel);
          if (!current) return;
          current.delete(listener);
          if (current.size === 0) {
            channelListeners.delete(channel);
          }
        };
      }

      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) {
          channelListeners.delete(channel);
        }
      };
    },
    async destroy() {
      if (destroyed) return;
      destroyed = true;
      for (const unsubscribe of threadTaskCleanup) {
        unsubscribe();
      }
      threadTaskCleanup.clear();

      const bridges = [...activeThreads.values()];
      activeThreads.clear();
      allListeners.clear();
      channelListeners.clear();

      if (!destroyThreads) {
        return;
      }

      const results = await Promise.allSettled(
        bridges.map(threadBridge => threadBridge.destroy())
      );
      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);
      if (errors.length > 0) {
        throw new AggregateError(errors, 'Failed to destroy one or more thread bridges');
      }
    },
  };
}

export function createTaskBridge(
  executorOrModule:
    | BackgroundExecutor
    | string
    | WorkerExecutorOptions
): TaskBridge {
  const executor: BackgroundExecutor = typeof executorOrModule === 'string'
    ? createWorkerExecutor(executorOrModule)
    : typeof executorOrModule === 'object' && 'modulePath' in executorOrModule && !('submit' in executorOrModule)
      ? createWorkerExecutor(executorOrModule as WorkerExecutorOptions)
      : (executorOrModule as BackgroundExecutor);

  const createHandle = <TPayload = unknown, TResult = unknown>(
    request: BackgroundTaskRequest<TPayload>,
    options?: BackgroundTaskOptions,
  ): BackgroundTaskHandle<TResult> => {
    return executor.submit<TPayload, TResult>(request, options);
  };

  return {
    execute<TPayload, TResult>(
      type: string,
      payload: TPayload,
      options?: BackgroundTaskOptions,
    ) {
      return createHandle<TPayload, TResult>({
        type,
        payload,
      }, options);
    },
    submit<TPayload, TResult>(
      request: BackgroundTaskRequest<TPayload>,
      options?: BackgroundTaskOptions,
    ) {
      return createHandle<TPayload, TResult>(request, options);
    },
    async destroy() {
      await executor.destroy();
    },
    get state() {
      return executor.state;
    },
    get pendingCount() {
      return executor.pendingCount;
    },
  };
}

export function createTaskBridgePool(
  options: TaskBridgePoolOptions
): TaskBridge {
  const requestedPoolSize = options.poolSize ?? 1;
  if (
    !Number.isSafeInteger(requestedPoolSize)
    || requestedPoolSize < 1
    || requestedPoolSize > 128
  ) {
    throw new RangeError('poolSize must be a safe integer between 1 and 128');
  }
  if (options.scheduler && !['round-robin', 'least-pending'].includes(options.scheduler)) {
    throw new TypeError(`Unknown task pool scheduler: ${String(options.scheduler)}`);
  }

  const limits = normalizeExecutorLimits(options);
  const poolSize = requestedPoolSize;
  const scheduler = options.scheduler ?? 'round-robin';
  const restartFailedWorkers = options.restartFailedWorkers ?? true;
  const nextPoolTaskId = createTaskIdFactory();
  let state: BackgroundExecutorState = 'active';
  let destroyPromise: Promise<void> | null = null;
  const retiredBridgeDestructions: Promise<void>[] = [];

  const createPoolBridge = (index: number): TaskBridge =>
    createTaskBridge({
      modulePath: options.modulePath,
      workerName: options.workerName
        ? `${options.workerName}-${index + 1}`
        : `tuiuiu-background-executor-pool-${index + 1}`,
      maxPending: limits.maxPending,
      defaultTimeoutMs: limits.defaultTimeoutMs,
    });

  const bridges = Array.from(
    { length: poolSize },
    (_, index) => createPoolBridge(index),
  );

  const workerLoad = bridges.map((): { pending: number } => ({
    pending: 0,
  }));
  let rrCursor = -1;

  const refreshFailedWorkers = (): void => {
    if (!restartFailedWorkers || state !== 'active') return;

    for (let index = 0; index < bridges.length; index += 1) {
      const bridge = bridges[index];
      if (bridge.state !== 'failed') continue;

      const retired = bridge.destroy();
      retiredBridgeDestructions.push(retired);
      bridges[index] = createPoolBridge(index);
      workerLoad[index] = { pending: 0 };
    }
  };

  const availableWorkerIndices = (): number[] => {
    refreshFailedWorkers();
    const indices: number[] = [];
    for (let index = 0; index < bridges.length; index += 1) {
      const bridge = bridges[index];
      const pendingCount = bridge.pendingCount ?? workerLoad[index].pending;
      if (bridge.state === 'active' && pendingCount < limits.maxPending) {
        indices.push(index);
      }
    }
    return indices;
  };

  const pickWorkerIndex = (): number | null => {
    const available = availableWorkerIndices();
    if (available.length === 0) return null;

    if (scheduler === 'least-pending') {
      let selected = available[0];
      let lowestLoad = bridges[selected].pendingCount ?? workerLoad[selected].pending;
      for (const index of available.slice(1)) {
        const load = bridges[index].pendingCount ?? workerLoad[index].pending;
        if (load < lowestLoad) {
          lowestLoad = load;
          selected = index;
        }
      }
      return selected;
    }

    for (let offset = 1; offset <= bridges.length; offset += 1) {
      const candidate = (rrCursor + offset) % bridges.length;
      if (available.includes(candidate)) {
        rrCursor = candidate;
        return candidate;
      }
    }
    return null;
  };

  const withLoadTracking = <TResult = unknown>(
    load: { pending: number },
    handle: BackgroundTaskHandle<TResult>
  ): BackgroundTaskHandle<TResult> => {
    load.pending += 1;
    let settled = false;

    const settleLoad = () => {
      if (settled) return;
      settled = true;
      load.pending = Math.max(0, load.pending - 1);
    };

    void handle.result.then(settleLoad, settleLoad);
    return handle;
  };

  const createSubmitHandle = <TPayload = unknown, TResult = unknown>(
    request: BackgroundTaskRequest<TPayload>,
    taskOptions?: BackgroundTaskOptions,
  ): BackgroundTaskHandle<TResult> => {
    if (state !== 'active') {
      return createRejectedTaskHandle<TResult>(
        nextPoolTaskId(),
        'ExecutorUnavailableError',
        `Background task pool is ${state}`,
      );
    }

    const index = pickWorkerIndex();
    if (index === null) {
      return createRejectedTaskHandle<TResult>(
        nextPoolTaskId(),
        'QueueSaturatedError',
        `All ${bridges.length} background workers are unavailable or saturated`,
      );
    }

    const load = workerLoad[index];
    const handle = bridges[index].submit<TPayload, TResult>(request, taskOptions);
    return withLoadTracking<TResult>(load, handle);
  };

  return {
    execute<TPayload, TResult>(
      type: string,
      payload: TPayload,
      taskOptions?: BackgroundTaskOptions,
    ) {
      return createSubmitHandle<TPayload, TResult>({
        type,
        payload,
      }, taskOptions);
    },
    submit(request, taskOptions) {
      return createSubmitHandle(request, taskOptions);
    },
    async destroy() {
      if (destroyPromise) return destroyPromise;
      state = 'destroying';
      destroyPromise = (async () => {
        const results = await Promise.allSettled([
          ...bridges.map(bridge => bridge.destroy()),
          ...retiredBridgeDestructions,
        ]);
        state = 'destroyed';
        const errors = results
          .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
          .map(result => result.reason);
        if (errors.length > 0) {
          throw new AggregateError(errors, 'Failed to destroy one or more task pool workers');
        }
      })();
      return destroyPromise;
    },
    get state() {
      return state;
    },
    get pendingCount() {
      return workerLoad.reduce((total, load) => total + load.pending, 0);
    },
  };
}
