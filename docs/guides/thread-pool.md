# Worker Pool Guide

When one worker is not enough, use `createTaskBridgePool()` to fan heavy tasks across multiple workers.

`createTaskBridgePool()` keeps the same `TaskBridge` contract (`submit`, `execute`, `destroy`) and adds a scheduler in front of multiple workers.

## API

```ts
import {
  createTaskBridgePool,
  type TaskBridgePoolScheduler,
  type TaskBridgePoolOptions,
} from 'tuiuiu.js';
```

```ts
const pool = createTaskBridgePool({
  modulePath: './workers/compute.mjs',
  poolSize: 4,              // number of workers in the pool
  scheduler: 'least-pending', // 'round-robin' | 'least-pending'
});
```

### Options

- `modulePath` (required): worker module.
- `poolSize`:
  - default: `1`
  - number of worker instances created and kept warm
- `workerName` (optional): base name for generated workers
- `scheduler`:
  - `'round-robin'`: rotate through workers
  - `'least-pending'`: send to the worker with fewer active handles

## Example Worker module (`workers/compute.mjs`)

```js
export const backgroundTaskHandlers = {
  async hashText(payload) {
    const input = String(payload.text ?? '');
    let hash = 0;
    for (let i = 0; i < input.length * payload.rounds; i += 1) {
      hash = (Math.imul(hash, 31) + input.charCodeAt(i % input.length)) >>> 0;
    }
    return { hash };
  },
};

export default backgroundTaskHandlers;
```

## Dispatching from main

```ts
import { fileURLToPath } from 'node:url';
import { createTaskBridgePool } from '../src/index.js';

const workerPath = fileURLToPath(
  new URL('./_shared/thread-pool-worker.mjs', import.meta.url)
);

const pool = createTaskBridgePool({
  modulePath: workerPath,
  poolSize: 4,
  scheduler: 'least-pending',
});

const handles = [
  pool.submit({ type: 'hashText', payload: { text: 'alpha', rounds: 12000, jobId: 'hash-1' }}),
  pool.submit({ type: 'hashText', payload: { text: 'bravo', rounds: 12000, jobId: 'hash-2' }}),
];

const results = await Promise.all(handles.map((h) => h.result));
console.log(results);
```

```ts
await pool.destroy();
```

## Pool + Thread Bus (multi-thread communication)

`createTaskBridgePool()` returns a `TaskBridge`, so you can use it directly in `createThreadBus()` just like one worker.

```ts
import {
  createTaskBridge,
  createTaskBridgePool,
  createThreadBus,
} from 'tuiuiu.js';

const analyzerPool = createTaskBridgePool({
  modulePath: './workers/analyzer.mjs',
  poolSize: 3,
  scheduler: 'least-pending',
});

const indexer = createTaskBridge('./workers/indexer.mjs');

const bus = createThreadBus({
  threads: {
    analyzer: analyzerPool,
    indexer,
  },
});

bus.subscribe((message) => {
  if (message.to === 'main') {
    console.log('[main]', message.channel, message.type, message.payload);
  }
});

await bus.destroy();
await analyzerPool.destroy();
await indexer.destroy();
```

## Scheduler behavior (what to pick)

- Use `'round-robin'` when tasks are fairly similar.
- Use `'least-pending'` when task durations vary a lot (one big task + many small tasks).

## FAQ

- `poolSize` is not a request-size limiter.
  It controls how many workers exist in parallel.
- You can still use `createTaskBridge()` for one-off or small integrations.
- You can pass the pool directly to the Thread Bus by keeping its `TaskBridge` shape.

```ts
import { createThreadBus } from 'tuiuiu.js';

const bus = createThreadBus({
  threads: {
    compute: pool,
  },
});
```
