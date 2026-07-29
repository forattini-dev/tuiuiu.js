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
