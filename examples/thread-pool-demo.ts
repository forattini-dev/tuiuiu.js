/**
 * Thread Pool Demo
 *
 * Demonstrates:
 * - running many CPU tasks through createTaskBridgePool()
 * - round-robin and least-pending scheduling
 * - reading per-task progress events
 *
 * Run with:
 * - pnpm tsx examples/thread-pool-demo.ts
 * - pnpm example thread-pool-demo
 */

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

type DemoTask =
  | { type: 'hashText'; payload: { jobId: string; text: string; rounds: number } }
  | { type: 'primeRange'; payload: { jobId: string; limit: number } };

const jobs: DemoTask[] = [
  { type: 'hashText', payload: { jobId: 'hash-1', text: 'alpha thread pool benchmark', rounds: 42000 } },
  { type: 'primeRange', payload: { jobId: 'primes-1', limit: 28_000 } },
  { type: 'hashText', payload: { jobId: 'hash-2', text: 'multi-thread message bus integration', rounds: 39000 } },
  { type: 'primeRange', payload: { jobId: 'primes-2', limit: 31_000 } },
  { type: 'hashText', payload: { jobId: 'hash-3', text: 'parallelism without blocking render loop', rounds: 46000 } },
  { type: 'primeRange', payload: { jobId: 'primes-3', limit: 33_000 } },
  { type: 'hashText', payload: { jobId: 'hash-4', text: 'cancelable background work', rounds: 31000 } },
  { type: 'primeRange', payload: { jobId: 'primes-4', limit: 29_000 } },
];

function formatPercent(ratio: number): string {
  return `${Math.max(0, Math.min(100, ratio * 100)).toFixed(1)}%`;
}

function formatMs(ms: number): string {
  return `${Math.round(ms)}ms`;
}

async function main() {
  const start = performance.now();
  const handles = jobs.map((job) => pool.submit(job));
  const completed = new Map<string, boolean>();

  handles.forEach((handle, index) => {
    const jobId = jobs[index]!.payload.jobId;
    handle.subscribe((event) => {
      if (event.kind === 'progress') {
        const payload = event.payload as {
          phase: string;
          ratio: number;
        };
        completed.set(jobId, false);
        process.stdout.write(
          `\r[${jobId}] ${payload.phase} ${formatPercent(payload.ratio)}`
        );
      }
    });
  });

  const settled = await Promise.all(
    handles.map(async (handle, index) => {
      const result = await handle.result;
      const jobId = jobs[index]!.payload.jobId;
      completed.set(jobId, true);
      return {
        jobId,
        result,
      };
  }));

  process.stdout.write('\n');

  let resolved = 0;
  let rejected = 0;
  let cancelled = 0;

  for (const { jobId, result } of settled) {
    if (result.status === 'resolved') {
      resolved += 1;
      console.log(`[ok] ${jobId}:`, result.value);
    } else if (result.status === 'cancelled') {
      cancelled += 1;
      console.log(`[cancelled] ${jobId}: ${result.reason}`);
    } else {
      rejected += 1;
      console.log(`[error] ${jobId}:`, result.error.message);
    }
  }

  const elapsed = formatMs(performance.now() - start);
  console.log(
    `\nSummary: resolved=${resolved}, cancelled=${cancelled}, rejected=${rejected}, duration=${elapsed}`
  );
  console.log(`Active job tracking keys: ${completed.size}`);

  await pool.destroy();
}

main().catch((error) => {
  console.error('[thread-pool-demo] failed', error);
  process.exitCode = 1;
});
