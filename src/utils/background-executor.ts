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
    request: BackgroundTaskRequest<TPayload>
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
    payload: TPayload
  ): BackgroundTaskHandle<TResult>;
  submit<TPayload = unknown, TResult = unknown>(
    request: BackgroundTaskRequest<TPayload>
  ): BackgroundTaskHandle<TResult>;
  destroy: () => Promise<void>;
}

export interface WorkerExecutorOptions {
  modulePath: string;
  workerName?: string;
}

export type TaskBridgePoolScheduler = 'round-robin' | 'least-pending';

export interface TaskBridgePoolOptions extends WorkerExecutorOptions {
  poolSize?: number;
  scheduler?: TaskBridgePoolScheduler;
}

interface PendingTask {
  controller: AbortController;
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

export function createInlineBackgroundExecutor(
  handlers: BackgroundTaskHandlers
): BackgroundExecutor {
  const nextTaskId = createTaskIdFactory();
  const pending = new Map<string, PendingTask>();
  let state: BackgroundExecutorState = 'active';

  return {
    submit<TPayload = unknown, TResult = unknown>(
      request: BackgroundTaskRequest<TPayload>
    ): BackgroundTaskHandle<TResult> {
      const taskId = nextTaskId();
      if (state !== 'active') {
        return createRejectedTaskHandle<TResult>(
          taskId,
          'ExecutorUnavailableError',
          `Background executor is ${state}`
        );
      }

      const handler = handlers[request.type];
      const controller = new AbortController();
      const pendingTask: PendingTask = {
        controller,
        resolve: () => {},
        listeners: new Set(),
        cancelled: false,
        settled: false,
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

      return {
        id: taskId,
        result,
        cancel(reason) {
          const pendingTask = pending.get(taskId);
          if (!pendingTask) return;
          pendingTask.cancelled = true;
          pendingTask.controller.abort(reason ?? 'Cancelled');
          settlePendingTask(pending, taskId);
          pendingTask.resolve({
            status: 'cancelled',
            taskId,
            reason: reason ?? 'Cancelled',
          });
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
    },

    async destroy() {
      if (state === 'destroyed' || state === 'destroying') return;
      state = 'destroying';
      for (const [taskId, pendingTask] of pending) {
        pendingTask.cancelled = true;
        pendingTask.settled = true;
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
  options?: Pick<WorkerExecutorOptions, 'workerName'>
): BackgroundExecutor;
export function createWorkerExecutor(
  options: WorkerExecutorOptions
): BackgroundExecutor;
export function createWorkerExecutor(
  modulePathOrOptions: string | WorkerExecutorOptions,
  options?: Pick<WorkerExecutorOptions, 'workerName'>
): BackgroundExecutor {
  const resolvedOptions = typeof modulePathOrOptions === 'string'
    ? {
        modulePath: modulePathOrOptions,
        ...options,
      }
    : modulePathOrOptions;

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
      request: BackgroundTaskRequest<TPayload>
    ): BackgroundTaskHandle<TResult> {
      const taskId = nextTaskId();
      if (state !== 'active') {
        return createRejectedTaskHandle<TResult>(
          taskId,
          'ExecutorUnavailableError',
          `Background worker is ${state}`
        );
      }

      const controller = new AbortController();
      const pendingTask: PendingTask = {
        controller,
        resolve: () => {},
        listeners: new Set(),
        cancelled: false,
        settled: false,
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

      return {
        id: taskId,
        result,
        cancel(reason) {
          const pendingTask = pending.get(taskId);
          if (!pendingTask) return;
          pendingTask.cancelled = true;
          pendingTask.controller.abort(reason ?? 'Cancelled');
          settlePendingTask(pending, taskId);
          pendingTask.resolve({
            status: 'cancelled',
            taskId,
            reason: reason ?? 'Cancelled',
          });
          try {
            worker.postMessage({
              kind: 'cancel',
              taskId,
              reason: reason ?? 'Cancelled',
            });
          } catch {
            // The handle is already settled. A concurrent worker exit does not
            // change the cancellation result observed by the caller.
          }
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
    },

    async destroy() {
      if (state === 'destroyed' || state === 'destroying') return;
      state = 'destroying';
      for (const [taskId, pendingTask] of pending) {
        pendingTask.cancelled = true;
        pendingTask.settled = true;
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
}): BackgroundExecutor {
  if (options.modulePath) {
    return createWorkerExecutor({
      modulePath: options.modulePath,
      workerName: options.workerName,
    });
  }

  return createInlineBackgroundExecutor(options.handlers ?? {});
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
    execute<TPayload, TResult>(type: string, payload: TPayload) {
      const handle = bridge.execute<TPayload, TResult>(type, payload);
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
    submit<TPayload, TResult>(request: BackgroundTaskRequest<TPayload>) {
      const handle = bridge.submit<TPayload, TResult>(request);
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
    request: BackgroundTaskRequest<TPayload>
  ): BackgroundTaskHandle<TResult> => {
    return executor.submit<TPayload, TResult>(request);
  };

  return {
    execute<TPayload, TResult>(type: string, payload: TPayload) {
      return createHandle<TPayload, TResult>({
        type,
        payload,
      });
    },
    submit<TPayload, TResult>(request: BackgroundTaskRequest<TPayload>) {
      return createHandle<TPayload, TResult>(request);
    },
    async destroy() {
      await executor.destroy();
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

  const poolSize = requestedPoolSize;
  const scheduler = options.scheduler ?? 'round-robin';
  const bridges = Array.from({ length: poolSize }, (_, index) =>
    createTaskBridge({
      modulePath: options.modulePath,
      workerName: options.workerName
        ? `${options.workerName}-${index + 1}`
        : `tuiuiu-background-executor-pool-${index + 1}`,
    })
  );

  const workerLoad = bridges.map(() => ({
    pending: 0,
  }));
  let rrCursor = -1;

  const pickWorkerIndex = (): number => {
    if (bridges.length === 1) {
      return 0;
    }

    if (scheduler === 'least-pending') {
      let selected = 0;
      let lowestLoad = workerLoad[0].pending;
      for (let i = 1; i < workerLoad.length; i += 1) {
        if (workerLoad[i].pending < lowestLoad) {
          lowestLoad = workerLoad[i].pending;
          selected = i;
        }
      }
      return selected;
    }

    rrCursor = (rrCursor + 1) % bridges.length;
    return rrCursor;
  };

  const withLoadTracking = <TResult = unknown>(
    trackedWorkerIndex: number,
    handle: BackgroundTaskHandle<TResult>
  ): BackgroundTaskHandle<TResult> => {
    workerLoad[trackedWorkerIndex].pending += 1;
    let settled = false;

    const settleLoad = () => {
      if (settled) return;
      settled = true;
      workerLoad[trackedWorkerIndex].pending -= 1;
    };

    void handle.result.then(settleLoad, settleLoad);
    return handle;
  };

  const createSubmitHandle = <TPayload = unknown, TResult = unknown>(
    request: BackgroundTaskRequest<TPayload>
  ): BackgroundTaskHandle<TResult> => {
    const index = pickWorkerIndex();
    const handle = bridges[index].submit<TPayload, TResult>(request);
    return withLoadTracking<TResult>(index, handle);
  };

  return {
    execute<TPayload, TResult>(type: string, payload: TPayload) {
      const index = pickWorkerIndex();
      const handle = bridges[index].execute<TPayload, TResult>(type, payload);
      return withLoadTracking<TResult>(index, handle);
    },
    submit(request) {
      return createSubmitHandle(request);
    },
    async destroy() {
      const results = await Promise.allSettled(
        bridges.map(bridge => bridge.destroy())
      );
      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);
      if (errors.length > 0) {
        throw new AggregateError(errors, 'Failed to destroy one or more task pool workers');
      }
    },
  };
}
