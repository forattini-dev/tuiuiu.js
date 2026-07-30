import { EventEmitter } from 'node:events';

import { createSignal, render, type VNode } from '../../../src/index.js';
import { createFrameSnapshot } from '../../../src/core/frame.js';
import { createDeltaRenderer } from '../../../src/core/delta-render.js';
import { renderFrameToString } from '../../../src/core/renderer.js';

export interface RuntimeBenchmarkResult {
  avgFrameMs: number;
  avgLayoutMs: number;
  avgAnsiMs: number;
  avgDeltaMs: number;
  avgAnsiBytes: number;
  avgDeltaBytes: number;
  drawCommands: number;
}

export interface LocalizedRuntimeBenchmarkResult extends RuntimeBenchmarkResult {
  avgDrawCommandMs: number;
}

export interface SchedulerBenchmarkResult {
  burstMs: number;
  renderCount: number;
  finalValue: number;
}

export const FRAME_OPTIONS = {
  eagerHitTargets: false,
  eagerQueries: false,
  eagerWarnings: false,
} as const;

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function createBenchmarkStdin(): NodeJS.ReadStream {
  const emitter = new EventEmitter();
  const stdin = Object.assign(emitter, {
    isTTY: true,
    setRawMode() {},
    resume() {},
    pause() {},
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    once: emitter.once.bind(emitter),
    emit: emitter.emit.bind(emitter),
  });
  return stdin as unknown as NodeJS.ReadStream;
}

interface BenchmarkStdout extends NodeJS.WriteStream {
  takeBenchmarkBytes(): number;
}

export function createBenchmarkStdout(width: number, height: number): BenchmarkStdout {
  const emitter = new EventEmitter();
  let writtenBytes = 0;
  const stdout = Object.assign(emitter, {
    columns: width,
    rows: height,
    isTTY: true,
    write(chunk: string | Uint8Array) {
      writtenBytes += typeof chunk === 'string'
        ? Buffer.byteLength(chunk)
        : chunk.byteLength;
      return true;
    },
    takeBenchmarkBytes() {
      const result = writtenBytes;
      writtenBytes = 0;
      return result;
    },
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    once: emitter.once.bind(emitter),
    emit: emitter.emit.bind(emitter),
  });
  return stdout as unknown as BenchmarkStdout;
}

export async function waitForMacrotask(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

export function benchmarkRuntime(
  node: VNode,
  input: { width: number; height: number },
  iterations = 20,
): RuntimeBenchmarkResult {
  const stdout = createBenchmarkStdout(input.width, input.height);
  const delta = createDeltaRenderer({
    stdout,
    useDelta: true,
    showCursor: true,
  });

  const frameTimes: number[] = [];
  const layoutTimes: number[] = [];
  const ansiTimes: number[] = [];
  const deltaTimes: number[] = [];
  const ansiBytes: number[] = [];
  const deltaBytes: number[] = [];
  let drawCommands = 0;

  for (let index = 0; index < 5; index++) {
    const frame = createFrameSnapshot(node, input, FRAME_OPTIONS);
    renderFrameToString(frame);
    delta.renderFrame(frame);
  }
  stdout.takeBenchmarkBytes();

  for (let index = 0; index < iterations; index++) {
    const frameStart = performance.now();
    const frame = createFrameSnapshot(node, input, FRAME_OPTIONS);
    frameTimes.push(performance.now() - frameStart);
    layoutTimes.push(frame.metrics.phases.layoutMs ?? 0);

    const ansiStart = performance.now();
    const ansiOutput = renderFrameToString(frame);
    ansiTimes.push(performance.now() - ansiStart);
    ansiBytes.push(Buffer.byteLength(ansiOutput));

    const deltaStart = performance.now();
    delta.renderFrame(frame);
    deltaTimes.push(performance.now() - deltaStart);
    deltaBytes.push(stdout.takeBenchmarkBytes());

    drawCommands = frame.metrics.structural.drawCommandCount;
  }

  return {
    avgFrameMs: average(frameTimes),
    avgLayoutMs: average(layoutTimes),
    avgAnsiMs: average(ansiTimes),
    avgDeltaMs: average(deltaTimes),
    avgAnsiBytes: average(ansiBytes),
    avgDeltaBytes: average(deltaBytes),
    drawCommands,
  };
}

export function benchmarkLocalizedRuntime(
  buildNode: (tick: number) => VNode,
  input: { width: number; height: number },
  iterations = 12,
): LocalizedRuntimeBenchmarkResult {
  const stdout = createBenchmarkStdout(input.width, input.height);
  const delta = createDeltaRenderer({
    stdout,
    useDelta: true,
    showCursor: true,
  });

  const frameTimes: number[] = [];
  const layoutTimes: number[] = [];
  const drawCommandTimes: number[] = [];
  const ansiTimes: number[] = [];
  const deltaTimes: number[] = [];
  const ansiBytes: number[] = [];
  const deltaBytes: number[] = [];
  let drawCommands = 0;

  for (let index = 0; index < 5; index++) {
    const frame = createFrameSnapshot(buildNode(index), input, FRAME_OPTIONS);
    renderFrameToString(frame);
    delta.renderFrame(frame);
  }
  stdout.takeBenchmarkBytes();

  for (let index = 0; index < iterations; index++) {
    const frameStart = performance.now();
    const frame = createFrameSnapshot(buildNode(index), input, FRAME_OPTIONS);
    frameTimes.push(performance.now() - frameStart);
    layoutTimes.push(frame.metrics.phases.layoutMs ?? 0);
    drawCommandTimes.push(frame.metrics.phases.drawCommandMs ?? 0);

    const ansiStart = performance.now();
    const ansiOutput = renderFrameToString(frame);
    ansiTimes.push(performance.now() - ansiStart);
    ansiBytes.push(Buffer.byteLength(ansiOutput));

    const deltaStart = performance.now();
    delta.renderFrame(frame);
    deltaTimes.push(performance.now() - deltaStart);
    deltaBytes.push(stdout.takeBenchmarkBytes());

    drawCommands = frame.metrics.structural.drawCommandCount;
  }

  return {
    avgFrameMs: average(frameTimes),
    avgLayoutMs: average(layoutTimes),
    avgDrawCommandMs: average(drawCommandTimes),
    avgAnsiMs: average(ansiTimes),
    avgDeltaMs: average(deltaTimes),
    avgAnsiBytes: average(ansiBytes),
    avgDeltaBytes: average(deltaBytes),
    drawCommands,
  };
}

export async function benchmarkBurstScheduler(
  buildNode: (tick: number) => VNode,
  input: { width: number; height: number },
  burstSize = 200,
): Promise<SchedulerBenchmarkResult> {
  const stdin = createBenchmarkStdin();
  const stdout = createBenchmarkStdout(input.width, input.height);
  const [tick, setTick] = createSignal(0);
  let renderCount = 0;

  const instance = render(
    () => {
      renderCount++;
      return buildNode(tick());
    },
    {
      stdin,
      stdout,
      clearOnStart: false,
      showCursor: true,
      useDeltaRenderer: false,
      maxFps: 0,
    },
  );

  const burstStart = performance.now();
  for (let index = 1; index <= burstSize; index++) {
    setTick(index);
  }
  await waitForMacrotask();
  const burstMs = performance.now() - burstStart;

  instance.unmount();

  return {
    burstMs,
    renderCount,
    finalValue: tick(),
  };
}
