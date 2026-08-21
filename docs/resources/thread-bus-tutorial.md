# Thread Bus Tutorial (Main + Workers)

This tutorial shows the simplest practical pattern to keep heavy work off the main thread while keeping communication explicit and easy.

The same message contract is reused everywhere:

- one event contract: `InterThreadBusMessage`
- one routing mechanism: `createThreadBus`
- one executor contract: `BackgroundExecutor`

## 1) Define a single contract

Put this in a shared file (`src/ipc.ts`) or duplicate it in your workers.

```ts
import type { InterThreadBusMessage } from 'tuiuiu.js';

export type PipelineBusMessage<TPayload = unknown> = InterThreadBusMessage<TPayload>;
```

## 2) Worker modules (no "game" naming, same pattern for any domain)

Each worker exports `backgroundTaskHandlers` and must include `THREAD_BUS_TASK_TYPE`.

### `workers/analyzer.mjs`

```js
import {
  THREAD_BUS_EVENT_KIND,
  THREAD_BUS_TASK_TYPE,
} from 'tuiuiu.js';

export const backgroundTaskHandlers = {
  async analyze(payload, _signal, reporter) {
    // main expensive work stays here
    const result = payload.text.toUpperCase().slice(0, 32);

    reporter.emit(THREAD_BUS_EVENT_KIND, {
      from: 'analyzer',
      channel: 'pipeline',
      to: 'indexer',
      type: 'index-request',
      payload: { result, jobId: payload.jobId },
    });

    return { result };
  },

  async [THREAD_BUS_TASK_TYPE](message) {
    // optional control commands from other threads/main
    if (message.type === 'cancel-job') {
      // keep your own bookkeeping here
      return { ok: true };
    }

    return { ok: true };
  },
};

export default backgroundTaskHandlers;
```

### `workers/indexer.mjs`

```js
import {
  THREAD_BUS_EVENT_KIND,
  THREAD_BUS_TASK_TYPE,
} from 'tuiuiu.js';

export const backgroundTaskHandlers = {
  async index(payload, _signal, reporter) {
    // any task is fine: file indexing, parsing, db writes, etc.
    return {
      ok: true,
      indexed: payload.files.length,
    };
  },

  async [THREAD_BUS_TASK_TYPE](message, _signal, reporter) {
    if (message.type === 'index-request') {
      reporter.emit(THREAD_BUS_EVENT_KIND, {
        from: 'indexer',
        channel: 'pipeline',
        to: 'main',
        type: 'index-complete',
        payload: {
          jobId: message.payload.jobId,
          found: true,
        },
      });
    }

    return { ok: true };
  },
};

export default backgroundTaskHandlers;
```

> `THREAD_BUS_TASK_TYPE` is the reserved task type for control/event routing between threads.
> Everything else remains normal background work (e.g., `analyze`, `index`).

## 3) Main: bridge + bus in one place

Create two background executors, one thread bus, and keep one subscription point for updates.

```ts
import {
  createBackgroundExecutor,
  createThreadBus,
  THREAD_BUS_EVENT_KIND,
  useApp,
} from 'tuiuiu.js';

const threadBus = {
  analyzer: createBackgroundExecutor({ modulePath: './workers/analyzer.mjs' }),
  indexer: createBackgroundExecutor({ modulePath: './workers/indexer.mjs' }),
};

const bus = createThreadBus({
  threads: threadBus,
});

const app = useApp();

bus.subscribe((message) => {
  app.enqueueExternalUpdate?.(() => {
    if (message.type === 'index-complete') {
      console.log('main received', message.payload.jobId, 'from', message.from);
    }
  });
});
```

### Main → specific thread (task execution)

```ts
threadBus.analyzer.submit({
  type: 'analyze',
  payload: { text: '...long input...', jobId: 'job-1' },
});
```

### Main → specific thread (coordination event)

```ts
bus.post({
  from: 'main',
  to: 'analyzer',
  channel: 'pipeline',
  type: 'cancel-job',
  payload: { jobId: 'job-1', reason: 'newer-job' },
});
```

### Main → all threads

```ts
bus.broadcast('flush-cache', { reason: 'deploy' }, 'control');
```

### Worker → main and worker → worker

Workers send through `reporter.emit(THREAD_BUS_EVENT_KIND, message)`.

`analyzer` can ask `indexer` to index one result:

```js
reporter.emit(THREAD_BUS_EVENT_KIND, {
  from: 'analyzer',
  to: 'indexer',
  channel: 'pipeline',
  type: 'index-request',
  payload: { jobId: 'job-1', files: ['a.md', 'b.md'] },
});
```

`indexer` sends completion back to main:

```js
reporter.emit(THREAD_BUS_EVENT_KIND, {
  from: 'indexer',
  to: 'main',
  channel: 'pipeline',
  type: 'index-complete',
  payload: { jobId: 'job-1', found: true },
});
```

### Optional: keep UI-safe updates

All events arrive outside the renderer tick, so use `enqueueExternalUpdate`.

```ts
bus.subscribe((message) => {
  app.enqueueExternalUpdate?.(() => {
    if (message.type === 'index-complete') {
      setStatus(`Indexed job ${message.payload.jobId}`);
    }
  });
});
```

## 4) Teardown

```ts
await bus.destroy();
```

```ts
// if you kept explicit bridge refs
await Promise.all([threadBus.analyzer.destroy(), threadBus.indexer.destroy()]);
await bus.destroy();
```

## Quick API cheatsheet

- `createBackgroundExecutor({ modulePath: './worker.mjs' })`: creates one worker with stable `execute`/`submit` methods.
- `createThreadBus({ threads })`: centralizes communication.
- `bus.post(...)`: route one message (`to` can be a specific thread, `main`, or `*`).
- `bus.broadcast(...)`: send to all threads.
- `bus.sendToMain(...)`: shortcut to address main.
- `THREAD_BUS_EVENT_KIND`: event kind your worker handlers must emit through `reporter.emit`.
- `THREAD_BUS_TASK_TYPE`: reserved task type your worker must handle for bus messages.
- `createBackgroundExecutorPool()` is the multi-thread version when one worker per domain is no longer enough.

```ts
// message contract (common pattern)
import { InterThreadBusMessage } from 'tuiuiu.js';

type Msg = InterThreadBusMessage<{ jobId: string; [key: string]: unknown }>;
```
