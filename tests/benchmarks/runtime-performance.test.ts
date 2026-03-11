import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EventEmitter } from 'node:events';

import { Box, Text, createSignal, darkTheme, render, setTheme } from '../../src/index.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { createDeltaRenderer } from '../../src/core/delta-render.js';
import { renderFrameToString } from '../../src/core/renderer.js';

const isCI = process.env.CI === 'true';
const describeOrSkip = isCI ? describe.skip : describe;

interface BenchmarkResult {
  avgFrameMs: number;
  avgLayoutMs: number;
  avgAnsiMs: number;
  avgDeltaMs: number;
  drawCommands: number;
}

interface SchedulerBenchmarkResult {
  burstMs: number;
  renderCount: number;
  finalValue: number;
}

const FRAME_OPTIONS = {
  eagerHitTargets: false,
  eagerQueries: false,
  eagerWarnings: false,
} as const;

const BUDGETS = {
  small: { frame: 12, layout: 10, ansi: 8, delta: 10 },
  medium: { frame: 20, layout: 18, ansi: 12, delta: 16 },
  large: { frame: 45, layout: 45, ansi: 25, delta: 30 },
};

function metricCard(index: number, value = '1234 req/s') {
  return Box(
    {
      borderStyle: 'round',
      borderColor: 'blue',
      padding: 1,
      width: 20,
      height: 6,
      backgroundColor: index % 2 ? '#101820' : '#1a1f2b',
    },
    Text({ color: 'yellow', bold: true }, `Metric ${index}`),
    Text({ color: 'green' }, value),
    Text({ color: 'cyan' }, '45ms avg'),
    Text({ color: 'gray' }, 'ok ok ok'),
  );
}

function buildDashboard(rows: number, cols: number, sections: number, tick?: number) {
  const blocks = [];

  for (let section = 0; section < sections; section++) {
    const sectionRows = [];

    for (let row = 0; row < rows; row++) {
      const cards = [];
      for (let col = 0; col < cols; col++) {
        const index = section * 1000 + row * cols + col;
        const value = tick !== undefined && index === 0
          ? `${String(1200 + tick).padStart(4, '0')} req/s`
          : '1234 req/s';
        cards.push(metricCard(index, value));
      }
      sectionRows.push(Box({ flexDirection: 'row', columnGap: 1 }, ...cards));
    }

    blocks.push(
      Box(
        { flexDirection: 'column', rowGap: 1 },
        Text({ bold: true }, `Section ${section + 1}`),
        ...sectionRows,
      ),
    );
  }

  return Box(
    { flexDirection: 'column', padding: 1, rowGap: 1, width: 'fill' },
    Text({ bold: true, color: 'white' }, 'Synthetic Dashboard'),
    ...blocks,
  );
}

function benchmarkRuntime(
  node: ReturnType<typeof Box>,
  input: { width: number; height: number },
  iterations = 20,
): BenchmarkResult {
  const fakeStdout = {
    columns: input.width,
    rows: input.height,
    write() {
      return true;
    },
    on() {},
    off() {},
  };
  const delta = createDeltaRenderer({
    stdout: fakeStdout as unknown as NodeJS.WriteStream,
    useDelta: true,
    showCursor: true,
  });

  const frameTimes: number[] = [];
  const layoutTimes: number[] = [];
  const ansiTimes: number[] = [];
  const deltaTimes: number[] = [];
  let drawCommands = 0;

  const warmup = 5;
  for (let i = 0; i < warmup; i++) {
    const frame = createFrameSnapshot(node, input, FRAME_OPTIONS);
    renderFrameToString(frame);
    delta.renderFrame(frame);
  }

  for (let i = 0; i < iterations; i++) {
    const frameStart = performance.now();
    const frame = createFrameSnapshot(node, input, FRAME_OPTIONS);
    frameTimes.push(performance.now() - frameStart);
    layoutTimes.push(frame.metrics.phases.layoutMs ?? 0);

    const ansiStart = performance.now();
    renderFrameToString(frame);
    ansiTimes.push(performance.now() - ansiStart);

    const deltaStart = performance.now();
    delta.renderFrame(frame);
    deltaTimes.push(performance.now() - deltaStart);

    drawCommands = frame.metrics.structural.drawCommandCount;
  }

  const average = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    avgFrameMs: average(frameTimes),
    avgLayoutMs: average(layoutTimes),
    avgAnsiMs: average(ansiTimes),
    avgDeltaMs: average(deltaTimes),
    drawCommands,
  };
}

function benchmarkLocalizedRuntime(
  buildNode: (tick: number) => ReturnType<typeof Box>,
  input: { width: number; height: number },
  iterations = 12,
) {
  const fakeStdout = {
    columns: input.width,
    rows: input.height,
    write() {
      return true;
    },
    on() {},
    off() {},
  };
  const delta = createDeltaRenderer({
    stdout: fakeStdout as unknown as NodeJS.WriteStream,
    useDelta: true,
    showCursor: true,
  });

  const frameTimes: number[] = [];
  const layoutTimes: number[] = [];
  const drawCommandTimes: number[] = [];
  const ansiTimes: number[] = [];
  const deltaTimes: number[] = [];
  let drawCommands = 0;

  const warmup = 5;
  for (let i = 0; i < warmup; i++) {
    const frame = createFrameSnapshot(buildNode(i), input, FRAME_OPTIONS);
    renderFrameToString(frame);
    delta.renderFrame(frame);
  }

  for (let i = 0; i < iterations; i++) {
    const frameStart = performance.now();
    const frame = createFrameSnapshot(buildNode(i), input, FRAME_OPTIONS);
    frameTimes.push(performance.now() - frameStart);
    layoutTimes.push(frame.metrics.phases.layoutMs ?? 0);
    drawCommandTimes.push(frame.metrics.phases.drawCommandMs ?? 0);

    const ansiStart = performance.now();
    renderFrameToString(frame);
    ansiTimes.push(performance.now() - ansiStart);

    const deltaStart = performance.now();
    delta.renderFrame(frame);
    deltaTimes.push(performance.now() - deltaStart);

    drawCommands = frame.metrics.structural.drawCommandCount;
  }

  const average = (values: number[]) =>
    values.reduce((sum, value) => sum + value, 0) / values.length;

  return {
    avgFrameMs: average(frameTimes),
    avgLayoutMs: average(layoutTimes),
    avgDrawCommandMs: average(drawCommandTimes),
    avgAnsiMs: average(ansiTimes),
    avgDeltaMs: average(deltaTimes),
    drawCommands,
  };
}

function createBenchmarkStdin(): NodeJS.ReadStream {
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

function createBenchmarkStdout(width: number, height: number): NodeJS.WriteStream {
  const emitter = new EventEmitter();
  const stdout = Object.assign(emitter, {
    columns: width,
    rows: height,
    isTTY: true,
    write() {
      return true;
    },
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    once: emitter.once.bind(emitter),
    emit: emitter.emit.bind(emitter),
  });
  return stdout as unknown as NodeJS.WriteStream;
}

async function benchmarkBurstScheduler(
  buildNode: (tick: number) => ReturnType<typeof Box>,
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
  await new Promise((resolve) => setTimeout(resolve, 0));
  const burstMs = performance.now() - burstStart;

  instance.unmount();

  return {
    burstMs,
    renderCount,
    finalValue: tick(),
  };
}

describeOrSkip('Runtime performance benchmarks', () => {
  beforeEach(() => {
    setTheme(darkTheme);
  });

  afterEach(() => {
    setTheme(darkTheme);
  });

  it('meets the small dashboard budget', () => {
    const result = benchmarkRuntime(buildDashboard(3, 4, 3), { width: 140, height: 50 });

    expect(result.drawCommands).toBeGreaterThan(100);
    expect(result.avgFrameMs).toBeLessThan(BUDGETS.small.frame);
    expect(result.avgLayoutMs).toBeLessThan(BUDGETS.small.layout);
    expect(result.avgAnsiMs).toBeLessThan(BUDGETS.small.ansi);
    expect(result.avgDeltaMs).toBeLessThan(BUDGETS.small.delta);
  });

  it('meets the medium dashboard budget', () => {
    const result = benchmarkRuntime(buildDashboard(5, 6, 4), { width: 180, height: 60 });

    expect(result.drawCommands).toBeGreaterThan(500);
    expect(result.avgFrameMs).toBeLessThan(BUDGETS.medium.frame);
    expect(result.avgLayoutMs).toBeLessThan(BUDGETS.medium.layout);
    expect(result.avgAnsiMs).toBeLessThan(BUDGETS.medium.ansi);
    expect(result.avgDeltaMs).toBeLessThan(BUDGETS.medium.delta);
  });

  it('meets the large dashboard budget', () => {
    const result = benchmarkRuntime(buildDashboard(8, 10, 6), { width: 180, height: 60 }, 12);

    expect(result.drawCommands).toBeGreaterThan(2000);
    expect(result.avgFrameMs).toBeLessThan(BUDGETS.large.frame);
    expect(result.avgLayoutMs).toBeLessThan(BUDGETS.large.layout);
    expect(result.avgAnsiMs).toBeLessThan(BUDGETS.large.ansi);
    expect(result.avgDeltaMs).toBeLessThan(BUDGETS.large.delta);
  });

  it('keeps delta cheaper than ANSI when a large tree changes locally', () => {
    const result = benchmarkLocalizedRuntime(
      tick => buildDashboard(8, 10, 6, tick),
      { width: 180, height: 60 },
      12,
    );

    expect(result.drawCommands).toBeGreaterThan(2000);
    expect(result.avgFrameMs).toBeLessThan(25);
    expect(result.avgLayoutMs).toBeLessThan(20);
    expect(result.avgDrawCommandMs).toBeLessThan(4);
    expect(result.avgDeltaMs).toBeLessThan(result.avgAnsiMs);
    expect(result.avgDeltaMs).toBeLessThan(16);
  });

  it('coalesces a large synchronous burst into one follow-up render', async () => {
    const result = await benchmarkBurstScheduler(
      tick => buildDashboard(8, 10, 6, tick),
      { width: 180, height: 60 },
      200,
    );

    expect(result.finalValue).toBe(200);
    expect(result.renderCount).toBe(2);
    expect(result.burstMs).toBeLessThan(150);
  });
});
