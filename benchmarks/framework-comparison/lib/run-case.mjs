import { performance } from 'node:perf_hooks';

import { CaptureStream, createInputStream } from './capture-stream.mjs';
import {
  OUTPUT_MARKER,
  ROW_COUNT,
  TERMINAL_HEIGHT,
  TERMINAL_WIDTH,
  footerLine,
  workerLine,
} from './scenario.mjs';
import { average, summarize } from './stats.mjs';

function collectMemory() {
  const memory = process.memoryUsage();
  return {
    heapUsed: memory.heapUsed,
    rss: memory.rss,
  };
}

function forceGarbageCollection() {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc();
  }
}

function delta(after, before) {
  return {
    bytes: after.bytes - before.bytes,
    writes: after.writes - before.writes,
  };
}

export async function runCase({
  createAdapter,
  framework,
  moduleLoadMs,
  scenario,
  config,
}) {
  const stdout = new CaptureStream(TERMINAL_WIDTH, TERMINAL_HEIGHT);
  const stderr = new CaptureStream(TERMINAL_WIDTH, TERMINAL_HEIGHT);
  const stdin = createInputStream();
  const adapter = createAdapter({ scenario, stdout, stderr, stdin });

  const mountStartedAt = performance.now();
  await adapter.mount();
  await stdout.waitForText(OUTPUT_MARKER);
  await adapter.flush();
  for (const expectedLine of [
    workerLine(0, 0, scenario),
    workerLine(ROW_COUNT - 1, 0, scenario),
    footerLine(0, scenario),
  ]) {
    if (!stdout.recentOutput.includes(expectedLine)) {
      throw new Error(
        `${framework}/${scenario} did not render expected content: ${expectedLine}`,
      );
    }
  }
  const firstPaintAt = performance.now();

  let tick = 0;
  for (let index = 0; index < config.warmupIterations; index += 1) {
    tick += 1;
    await adapter.update(tick);
  }

  const updateLatencies = [];
  const updateBytes = [];
  const updateWrites = [];
  for (let index = 0; index < config.updateIterations; index += 1) {
    tick += 1;
    const before = stdout.snapshot();
    const startedAt = performance.now();
    await adapter.update(tick);
    updateLatencies.push(performance.now() - startedAt);
    const outputDelta = delta(stdout.snapshot(), before);
    updateBytes.push(outputDelta.bytes);
    updateWrites.push(outputDelta.writes);
  }

  const burstBefore = stdout.snapshot();
  const burstStartedAt = performance.now();
  await adapter.burst(tick + 1, config.burstIterations);
  const burstMs = performance.now() - burstStartedAt;
  tick += config.burstIterations;
  const burstOutput = delta(stdout.snapshot(), burstBefore);

  forceGarbageCollection();
  const memoryBefore = collectMemory();
  await adapter.burst(tick + 1, config.memoryIterations);
  tick += config.memoryIterations;
  const memoryBeforeGc = collectMemory();
  forceGarbageCollection();
  const memoryAfterGc = collectMemory();

  await adapter.unmount();
  stdin.destroy();
  stdout.end();
  stderr.end();

  return {
    framework,
    scenario,
    moduleLoadMs,
    processToFirstPaintMs: firstPaintAt,
    mountToFirstPaintMs: firstPaintAt - mountStartedAt,
    updateLatencyMs: summarize(updateLatencies),
    avgUpdateBytes: average(updateBytes),
    avgUpdateWrites: average(updateWrites),
    burst: {
      iterations: config.burstIterations,
      durationMs: burstMs,
      bytes: burstOutput.bytes,
      writes: burstOutput.writes,
    },
    memory: {
      iterations: config.memoryIterations,
      heapGrowthBeforeGc: memoryBeforeGc.heapUsed - memoryBefore.heapUsed,
      retainedHeapGrowth: memoryAfterGc.heapUsed - memoryBefore.heapUsed,
      rssGrowth: memoryAfterGc.rss - memoryBefore.rss,
    },
    totalOutputBytes: stdout.totalBytes,
  };
}
