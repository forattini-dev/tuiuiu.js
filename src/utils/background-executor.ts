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

export type BackgroundTaskHandlers = Record<string, BackgroundTaskHandler>;

export interface BackgroundExecutor {
  submit<TPayload = unknown, TResult = unknown>(
    request: BackgroundTaskRequest<TPayload>
  ): BackgroundTaskHandle<TResult>;
  destroy: () => Promise<void>;
}

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
  let nextId = 0;
  return () => `task-${++nextId}`;
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
    listener(event);
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

export function createInlineBackgroundExecutor(
  handlers: BackgroundTaskHandlers
): BackgroundExecutor {
  const nextTaskId = createTaskIdFactory();
  const pending = new Map<string, PendingTask>();

  return {
    submit<TPayload = unknown, TResult = unknown>(
      request: BackgroundTaskRequest<TPayload>
    ): BackgroundTaskHandle<TResult> {
      const taskId = nextTaskId();
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

  worker.on('error', (error) => {
    const serialized = serializeError(error);
    for (const [taskId, pendingTask] of pending) {
      pendingTask.settled = true;
      pendingTask.listeners.clear();
      pendingTask.resolve({
        status: 'rejected',
        taskId,
        error: serialized,
      });
    }
    pending.clear();
  });

  return {
    submit<TPayload = unknown, TResult = unknown>(
      request: BackgroundTaskRequest<TPayload>
    ): BackgroundTaskHandle<TResult> {
      const taskId = nextTaskId();
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

      worker.postMessage({
        kind: 'run',
        taskId,
        taskType: request.type,
        payload: request.payload,
      });

      return {
        id: taskId,
        result,
        cancel(reason) {
          const pendingTask = pending.get(taskId);
          if (!pendingTask) return;
          pendingTask.cancelled = true;
          pendingTask.controller.abort(reason ?? 'Cancelled');
          worker.postMessage({
            kind: 'cancel',
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
      await worker.terminate();
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
    listener(event);
  }
}

function normalizeThreadBusMessage<T = unknown>(
  source: string,
  rawMessage: InterThreadBusMessage<T> | Omit<InterThreadBusMessage<T>, 'id' | 'timestamp'> | Omit<InterThreadBusMessage<T>, 'id' | 'timestamp' | 'from'> & { from?: string },
  defaults: { mainThreadName: string; defaultChannel: string }
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
    from: messageLike.from ?? source,
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
}: ThreadBusOptions): ThreadBus {
  const allListeners = new Set<ThreadBusListener<any>>();
  const channelListeners = createThreadBusListenerSet();
  const activeThreads = new Map<string, TaskBridge>();
  const threadTaskCleanup = new Set<() => void>();
  const defaults = { mainThreadName, defaultChannel };

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

        threadBridge.execute(taskType, message);
      }
      return;
    }

    const destination = activeThreads.get(message.to);
    if (!destination || message.to === message.from) {
      return;
    }

    destination.execute(taskType, message);
  };

  const post = <T>(
    rawMessage: Omit<InterThreadBusMessage<T>, 'id' | 'timestamp' | 'from'> & {
      from?: string;
      to?: string;
      channel?: string;
    }
  ): void => {
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

        const message = normalizeThreadBusMessage(threadName, event.payload as InterThreadBusMessage<unknown>, defaults);
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
      void handle.result.finally(() => {
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
          defaults
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
      void handle.result.finally(() => {
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
      for (const unsubscribe of threadTaskCleanup) {
        unsubscribe();
      }
      threadTaskCleanup.clear();

      for (const threadBridge of activeThreads.values()) {
        await threadBridge.destroy();
      }
      activeThreads.clear();
      allListeners.clear();
      channelListeners.clear();
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
  const poolSize = Math.max(1, Math.floor(options.poolSize ?? 1));
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

    void handle.result.finally(settleLoad);
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
      for (const bridge of bridges) {
        await bridge.destroy();
      }
    },
  };
}
