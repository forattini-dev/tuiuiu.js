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

export interface WorkerThreadBackgroundExecutorOptions {
  modulePath: string;
  workerName?: string;
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

export function createWorkerThreadBackgroundExecutor(
  options: WorkerThreadBackgroundExecutorOptions
): BackgroundExecutor {
  const nextTaskId = createTaskIdFactory();
  const pending = new Map<string, PendingTask>();
  const worker = new Worker(
    new URL(`data:text/javascript;charset=utf-8,${encodeURIComponent(createWorkerSource())}`),
    {
      name: options.workerName ?? 'tuiuiu-background-executor',
      workerData: {
        modulePath: toModuleHref(options.modulePath),
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
    return createWorkerThreadBackgroundExecutor({
      modulePath: options.modulePath,
      workerName: options.workerName,
    });
  }

  return createInlineBackgroundExecutor(options.handlers ?? {});
}
