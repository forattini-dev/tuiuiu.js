import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { fileURLToPath } from 'node:url';

import {
  createInlineBackgroundExecutor,
  createTaskBridge,
  createTaskBridgePool,
  createThreadBus,
  createWorkerExecutor,
  THREAD_BUS_EVENT_KIND,
  THREAD_BUS_TASK_TYPE,
  type BackgroundTaskEvent,
  type TaskBridge,
} from '../../src/utils/background-executor.js';
import { render } from '../../src/app/render-loop.js';
import { Text } from '../../src/primitives/nodes.js';
import { createSignal } from '../../src/primitives/signal.js';
import { useApp, useEffect, useInput, useState } from '../../src/hooks/index.js';
import { cleanupApp } from '../../src/hooks/use-app.js';
import {
  clearInputHandlers,
  emitInput,
  resetHookState,
  setAppContext,
} from '../../src/hooks/context.js';
import { charKey } from '../helpers/keyboard.js';

function createMockStdin(): NodeJS.ReadStream {
  const emitter = new EventEmitter();
  const stdin = Object.assign(emitter, {
    isTTY: true,
    setRawMode: vi.fn(),
    resume: vi.fn(),
    pause: vi.fn(),
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter),
  });
  return stdin as unknown as NodeJS.ReadStream;
}

function createMockStdout(): NodeJS.WriteStream & { output: string } {
  let output = '';
  const emitter = new EventEmitter();
  const stream = Object.assign(emitter, {
    columns: 80,
    rows: 24,
    isTTY: true,
    write: vi.fn((chunk: string | Buffer) => {
      output += chunk.toString();
      return true;
    }),
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    emit: emitter.emit.bind(emitter),
  });

  Object.defineProperty(stream, 'output', {
    get: () => output,
    set: (value: string) => {
      output = value;
    },
  });

  return stream as unknown as NodeJS.WriteStream & { output: string };
}

const workerModulePath = fileURLToPath(new URL('../fixtures/background-task-handlers.mjs', import.meta.url));

describe('background executor', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
    setAppContext(null);
  });

  afterEach(() => {
    cleanupApp();
    resetHookState();
    clearInputHandlers();
  });

  it('resolves results and serializes errors through the inline executor contract', async () => {
    const executor = createInlineBackgroundExecutor({
      uppercase: async (payload: { text: string }) => payload.text.toUpperCase(),
      explode: async (payload: { message: string }) => {
        throw new Error(payload.message);
      },
    });

    const resolvedTask = executor.submit<{ text: string }, string>({
      type: 'uppercase',
      payload: { text: 'hello' },
    });
    const rejectedTask = executor.submit<{ message: string }, never>({
      type: 'explode',
      payload: { message: 'boom' },
    });

    await expect(resolvedTask.result).resolves.toMatchObject({
      status: 'resolved',
      value: 'HELLO',
    });
    await expect(rejectedTask.result).resolves.toMatchObject({
      status: 'rejected',
      error: { message: 'boom' },
    });

    await executor.destroy();
  });

  it('delivers ordered progress events through the inline executor before resolution', async () => {
    const executor = createInlineBackgroundExecutor({
      progressEcho: async (payload: { text: string }, _signal, reporter) => {
        reporter.emit('progress', { progress: 10, status: 'start' });
        await Promise.resolve();
        reporter.emit('progress', { progress: 85, status: 'finish' });
        return payload.text.toUpperCase();
      },
    });

    const task = executor.submit<{ text: string }, string>({
      type: 'progressEcho',
      payload: { text: 'hello' },
    });
    const events: BackgroundTaskEvent[] = [];
    task.subscribe((event) => {
      events.push(event);
    });

    await expect(task.result).resolves.toMatchObject({
      status: 'resolved',
      value: 'HELLO',
    });
    expect(events).toHaveLength(2);
    expect(events.map((event) => event.kind)).toEqual(['progress', 'progress']);
    expect(events.map((event) => event.payload)).toEqual([
      { progress: 10, status: 'start' },
      { progress: 85, status: 'finish' },
    ]);
    expect(events.every((event) => event.taskId === task.id)).toBe(true);
    expect(events.every((event) => typeof event.timestamp === 'number')).toBe(true);

    await executor.destroy();
  });

  it('lets listeners unsubscribe without affecting other task listeners', async () => {
    const executor = createInlineBackgroundExecutor({
      progressEcho: async (_payload, _signal, reporter) => {
        reporter.emit('progress', { step: 1 });
        await Promise.resolve();
        reporter.emit('progress', { step: 2 });
        return 'done';
      },
    });

    const task = executor.submit({
      type: 'progressEcho',
      payload: undefined,
    });
    const firstListenerEvents: BackgroundTaskEvent[] = [];
    const secondListenerEvents: BackgroundTaskEvent[] = [];
    let unsubscribe = () => {};

    unsubscribe = task.subscribe((event) => {
      firstListenerEvents.push(event);
      unsubscribe();
    });
    task.subscribe((event) => {
      secondListenerEvents.push(event);
    });

    await expect(task.result).resolves.toMatchObject({
      status: 'resolved',
      value: 'done',
    });
    expect(firstListenerEvents).toHaveLength(1);
    expect(secondListenerEvents).toHaveLength(2);
    expect(secondListenerEvents.map((event) => event.payload)).toEqual([
      { step: 1 },
      { step: 2 },
    ]);

    await executor.destroy();
  });

  it('runs tasks in a worker thread and reports a unified result envelope', async () => {
    const executor = createWorkerExecutor(workerModulePath);

    const infoTask = executor.submit<undefined, { isMainThread: boolean; threadId: number }>({
      type: 'threadInfo',
      payload: undefined,
    });

    await expect(infoTask.result).resolves.toMatchObject({
      status: 'resolved',
      value: {
        isMainThread: false,
      },
    });

    await executor.destroy();
  });

  it('delivers ordered progress events through the worker-thread executor before resolution', async () => {
    const executor = createWorkerExecutor(workerModulePath);

    const task = executor.submit<{ text: string; delayMs: number }, string>({
      type: 'progressEcho',
      payload: { text: 'worker-done', delayMs: 5 },
    });
    const events: BackgroundTaskEvent[] = [];
    task.subscribe((event) => {
      events.push(event);
    });

    await expect(task.result).resolves.toMatchObject({
      status: 'resolved',
      value: 'worker-done',
    });
    expect(events).toHaveLength(3);
    expect(events.map((event) => event.payload)).toEqual([
      { progress: 15, status: 'Preparing background work' },
      { progress: 60, status: 'Running background work' },
      { progress: 92, status: 'Wrapping background work' },
    ]);

    await executor.destroy();
  });

  it('supports task cancellation in the worker-thread executor', async () => {
    const executor = createWorkerExecutor(workerModulePath);

    const task = executor.submit<{ text: string; delayMs: number }, string>({
      type: 'delayedEcho',
      payload: { text: 'slow', delayMs: 50 },
    });

    task.cancel('No longer needed');

    await expect(task.result).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'No longer needed',
    });

    await executor.destroy();
  });

  it('ignores late worker events after cancellation', async () => {
    const executor = createWorkerExecutor(workerModulePath);

    const task = executor.submit<{ delayMs: number }, string>({
      type: 'emitAfterAbort',
      payload: { delayMs: 40 },
    });
    const events: BackgroundTaskEvent[] = [];
    task.subscribe((event) => {
      events.push(event);
    });

    task.cancel('Stop now');

    await expect(task.result).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'Stop now',
    });
    expect(events).toHaveLength(0);

    await executor.destroy();
  });

  it('keeps input and rendering responsive on the main thread while a worker task runs', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const executor = createWorkerExecutor(workerModulePath);
    const [typed, setTyped] = createSignal('');

    const instance = render(
      () => {
        useInput((input) => {
          if (input) {
            setTyped((current) => current + input);
          }
        });
        return Text({}, `Typed: ${typed()}`);
      },
      {
        stdin,
        stdout,
        maxFps: 0,
        clearOnStart: false,
        showCursor: true,
        useDeltaRenderer: false,
      }
    );

    const task = executor.submit<{ text: string; delayMs: number }, string>({
      type: 'delayedEcho',
      payload: { text: 'done', delayMs: 40 },
    });

    emitInput('x', charKey('x').key);
    await Promise.resolve();

    expect(stdout.output).toContain('Typed: x');
    await expect(task.result).resolves.toMatchObject({
      status: 'resolved',
      value: 'done',
    });

    instance.unmount();
    await executor.destroy();
  });

  it('lets task events drive UI state through enqueueExternalUpdate before task completion', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const executor = createWorkerExecutor(workerModulePath);

    const instance = render(
      () => {
        const app = useApp();
        const [status, setStatus] = useState('idle');

        useEffect(() => {
          const task = executor.submit<{ text: string; delayMs: number }, string>({
            type: 'progressEcho',
            payload: { text: 'finished', delayMs: 15 },
          });

          const unsubscribe = task.subscribe((event) => {
            if (event.kind !== 'progress') return;
            const payload = event.payload as { status?: string };
            app.enqueueExternalUpdate?.(() => {
              setStatus(payload.status ?? 'working');
            });
          });

          void task.result.then((result) => {
            if (result.status === 'resolved') {
              app.enqueueExternalUpdate?.(() => {
                setStatus(result.value);
              });
            }
          });

          return () => {
            unsubscribe();
            task.cancel('Unmounted');
          };
        });

        return Text({}, `Status: ${status()}`);
      },
      {
        stdin,
        stdout,
        maxFps: 0,
        clearOnStart: false,
        showCursor: true,
        useDeltaRenderer: false,
      }
    );

    await vi.waitFor(() => {
      expect(stdout.output).toMatch(/Status: (Preparing|Running|Wrapping) background work/);
    });
    await vi.waitFor(() => {
      expect(stdout.output).toContain('Status: finished');
    });

    instance.unmount();
    await executor.destroy();
  });

  it('settles cancellation immediately even when an inline handler ignores abort', async () => {
    const executor = createInlineBackgroundExecutor({
      ignoreAbort: async () => new Promise(resolve => {
        setTimeout(() => resolve('late'), 100);
      }),
    });
    const task = executor.submit({ type: 'ignoreAbort', payload: undefined });

    task.cancel('Stop now');

    await expect(task.result).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'Stop now',
    });
    expect(executor.pendingCount).toBe(0);
    await executor.destroy();
  });

  it('rejects submissions after inline and worker executors are destroyed', async () => {
    const inline = createInlineBackgroundExecutor({});
    const worker = createWorkerExecutor(workerModulePath);
    await Promise.all([inline.destroy(), worker.destroy()]);

    await expect(inline.submit({
      type: 'unknown',
      payload: undefined,
    }).result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'ExecutorUnavailableError' },
    });
    await expect(worker.submit({
      type: 'uppercase',
      payload: { text: 'late' },
    }).result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'ExecutorUnavailableError' },
    });
    expect(inline.state).toBe('destroyed');
    expect(worker.state).toBe('destroyed');
  });

  it('settles a task when its worker exits cleanly without a result', async () => {
    const executor = createWorkerExecutor(workerModulePath);
    const task = executor.submit({
      type: 'exitCleanly',
      payload: undefined,
    });

    await expect(task.result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'WorkerExitError', code: '0' },
    });
    expect(executor.state).toBe('failed');
    await expect(executor.submit({
      type: 'uppercase',
      payload: { text: 'late' },
    }).result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'ExecutorUnavailableError' },
    });
    await executor.destroy();
  });

  it('enters a permanent failed state after worker startup failure', async () => {
    const missingModule = fileURLToPath(
      new URL('../fixtures/does-not-exist.mjs', import.meta.url)
    );
    const executor = createWorkerExecutor(missingModule);

    await expect(executor.submit({
      type: 'uppercase',
      payload: { text: 'hello' },
    }).result).resolves.toMatchObject({
      status: 'rejected',
    });
    expect(executor.state).toBe('failed');
    await expect(executor.submit({
      type: 'uppercase',
      payload: { text: 'late' },
    }).result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'ExecutorUnavailableError' },
    });
    await executor.destroy();
  });

  it('settles uncloneable worker payloads without leaving pending tasks', async () => {
    const executor = createWorkerExecutor(workerModulePath);
    const task = executor.submit({
      type: 'uppercase',
      payload: { text: 'hello', callback: () => {} },
    });

    await expect(task.result).resolves.toMatchObject({
      status: 'rejected',
    });
    expect(executor.pendingCount).toBe(0);
    await executor.destroy();
  });

  it('settles worker cancellation immediately when a handler ignores abort', async () => {
    const executor = createWorkerExecutor(workerModulePath);
    const task = executor.submit({
      type: 'ignoreAbort',
      payload: { text: 'late', delayMs: 100 },
    });

    task.cancel('No longer needed');

    await expect(task.result).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'No longer needed',
    });
    expect(executor.pendingCount).toBe(0);
    await executor.destroy();
  });

  it('supports external abort signals and task timeouts', async () => {
    const inline = createInlineBackgroundExecutor({
      waitForAbort: async (_payload, signal) => new Promise((resolve) => {
        signal.addEventListener('abort', () => resolve('late'), { once: true });
      }),
    });
    const controller = new AbortController();
    const externallyCancelled = inline.submit({
      type: 'waitForAbort',
      payload: undefined,
    }, { signal: controller.signal });
    controller.abort('Caller stopped');

    await expect(externallyCancelled.result).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'Caller stopped',
    });

    const timedOut = inline.submit({
      type: 'waitForAbort',
      payload: undefined,
    }, { timeoutMs: 5 });
    await expect(timedOut.result).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'Timed out after 5ms',
    });
    expect(inline.pendingCount).toBe(0);
    await inline.destroy();
  });

  it('applies default worker timeouts and rejects pre-aborted work', async () => {
    const worker = createWorkerExecutor(workerModulePath, {
      defaultTimeoutMs: 5,
    });
    const timedOut = worker.submit({
      type: 'ignoreAbort',
      payload: { text: 'late', delayMs: 100 },
    });
    await expect(timedOut.result).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'Timed out after 5ms',
    });

    const controller = new AbortController();
    controller.abort(new Error('Already cancelled'));
    const preAborted = worker.submit({
      type: 'uppercase',
      payload: { text: 'ignored' },
    }, { signal: controller.signal });
    await expect(preAborted.result).resolves.toMatchObject({
      status: 'cancelled',
      reason: 'Already cancelled',
    });
    expect(worker.pendingCount).toBe(0);
    await worker.destroy();
  });

  it('enforces executor backpressure without dispatching excess work', async () => {
    let releaseFirst = () => {};
    const executor = createInlineBackgroundExecutor({
      blocked: async () => new Promise<string>((resolve) => {
        releaseFirst = () => resolve('done');
      }),
    }, { maxPending: 1 });

    const first = executor.submit({ type: 'blocked', payload: undefined });
    const rejected = executor.submit({ type: 'blocked', payload: undefined });

    await expect(rejected.result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'QueueSaturatedError' },
    });
    expect(executor.pendingCount).toBe(1);

    await Promise.resolve();
    releaseFirst();
    await expect(first.result).resolves.toMatchObject({
      status: 'resolved',
      value: 'done',
    });
    await executor.destroy();
  });

  it.each([
    [{ maxPending: 0 }, /maxPending/u],
    [{ maxPending: Number.POSITIVE_INFINITY }, /maxPending/u],
    [{ defaultTimeoutMs: -1 }, /defaultTimeoutMs/u],
  ])('rejects invalid executor limits %#', (options, message) => {
    expect(() => createInlineBackgroundExecutor({}, options)).toThrow(message);
  });

  it('returns a rejected envelope for invalid per-task timeout', async () => {
    const executor = createInlineBackgroundExecutor({});
    const task = executor.submit({
      type: 'unused',
      payload: undefined,
    }, { timeoutMs: -1 });

    await expect(task.result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'InvalidTaskOptionsError' },
    });
    await executor.destroy();
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, 129])(
    'rejects invalid task pool size %s',
    (poolSize) => {
      expect(() => createTaskBridgePool({
        modulePath: workerModulePath,
        poolSize,
      })).toThrow('poolSize must be a safe integer between 1 and 128');
    }
  );

  it('creates globally unique task ids across a worker pool', async () => {
    const pool = createTaskBridgePool({
      modulePath: workerModulePath,
      poolSize: 2,
    });

    const first = pool.execute('delayedEcho', { text: 'a', delayMs: 10 });
    const second = pool.execute('delayedEcho', { text: 'b', delayMs: 10 });

    expect(first.id).not.toBe(second.id);
    await Promise.all([first.result, second.result]);
    await pool.destroy();
  });

  it('applies backpressure across a saturated task pool', async () => {
    const pool = createTaskBridgePool({
      modulePath: workerModulePath,
      poolSize: 1,
      maxPending: 1,
    });

    const first = pool.execute('delayedEcho', { text: 'first', delayMs: 30 });
    const rejected = pool.execute('delayedEcho', { text: 'second', delayMs: 1 });

    await expect(rejected.result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'QueueSaturatedError' },
    });
    expect(pool.pendingCount).toBe(1);
    await expect(first.result).resolves.toMatchObject({
      status: 'resolved',
      value: 'first',
    });
    await pool.destroy();
  });

  it('restarts failed pool workers before accepting new work', async () => {
    const pool = createTaskBridgePool({
      modulePath: workerModulePath,
      poolSize: 1,
    });

    await expect(pool.execute('exitCleanly', undefined).result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'WorkerExitError' },
    });
    await expect(pool.execute('uppercase', { text: 'recovered' }).result).resolves.toMatchObject({
      status: 'resolved',
      value: 'RECOVERED',
    });
    expect(pool.state).toBe('active');
    await pool.destroy();
    expect(pool.state).toBe('destroyed');
  });

  it('can keep failed pool workers retired when restart is disabled', async () => {
    const pool = createTaskBridgePool({
      modulePath: workerModulePath,
      poolSize: 1,
      restartFailedWorkers: false,
    });

    await expect(pool.execute('exitCleanly', undefined).result).resolves.toMatchObject({
      status: 'rejected',
    });
    await expect(pool.execute('uppercase', { text: 'unavailable' }).result).resolves.toMatchObject({
      status: 'rejected',
      error: { name: 'QueueSaturatedError' },
    });
    await pool.destroy();
  });

  it('keeps thread-bus listener and worker identity isolated', async () => {
    const workerBridge = createTaskBridge(createInlineBackgroundExecutor({
      [THREAD_BUS_TASK_TYPE]: (_payload, _signal, reporter) => {
        reporter.emit(THREAD_BUS_EVENT_KIND, {
          from: 'forged-worker',
          to: 'main',
          channel: 'updates',
          type: 'reply',
          payload: 'done',
        });
      },
    }));
    const bus = createThreadBus({ threads: { analyzer: workerBridge } });
    const observed: Array<{ from: string; type: string }> = [];
    bus.subscribe(() => {
      throw new Error('broken listener');
    });
    bus.subscribe(event => {
      observed.push({ from: event.from, type: event.type });
    });

    expect(() => bus.post({
      to: 'analyzer',
      channel: 'updates',
      type: 'start',
      payload: null,
    })).not.toThrow();

    await vi.waitFor(() => {
      expect(observed).toContainEqual({ from: 'analyzer', type: 'reply' });
    });
    expect(observed).not.toContainEqual({
      from: 'forged-worker',
      type: 'reply',
    });
    await bus.destroy();
  });

  it('can release a thread bus without taking ownership of its bridges', async () => {
    const destroy = vi.fn(async () => {});
    const bridge: TaskBridge = {
      execute: () => {
        throw new Error('not used');
      },
      submit: () => {
        throw new Error('not used');
      },
      destroy,
    };
    const bus = createThreadBus({
      threads: { worker: bridge },
      destroyThreads: false,
    });

    await bus.destroy();
    await bus.destroy();

    expect(destroy).not.toHaveBeenCalled();
  });

  it('attempts to destroy every owned bridge and aggregates failures', async () => {
    const firstDestroy = vi.fn(async () => {
      throw new Error('first failed');
    });
    const secondDestroy = vi.fn(async () => {});
    const makeBridge = (destroy: () => Promise<void>): TaskBridge => ({
      execute: () => {
        throw new Error('not used');
      },
      submit: () => {
        throw new Error('not used');
      },
      destroy,
    });
    const bus = createThreadBus({
      threads: {
        first: makeBridge(firstDestroy),
        second: makeBridge(secondDestroy),
      },
    });

    await expect(bus.destroy()).rejects.toThrow(
      'Failed to destroy one or more thread bridges'
    );
    expect(firstDestroy).toHaveBeenCalledOnce();
    expect(secondDestroy).toHaveBeenCalledOnce();
  });
});
