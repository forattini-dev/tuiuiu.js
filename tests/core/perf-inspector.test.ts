import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { cleanupApp } from '../../src/hooks/use-app.js';
import {
  clearInputHandlers,
  resetHookState,
  setAppContext,
} from '../../src/hooks/context.js';
import { configureProgressive, resetProgressive } from '../../src/core/progressive.js';
import { clearCommittedFrameSnapshot, createFrameSnapshot, finalizeFrameRuntimeMetrics, recordFrameStructuralMetric } from '../../src/core/frame.js';
import {
  configurePerfInspector,
  getPerfFrames,
  getPerfInspectorSummary,
  onSlowFrame,
  recordCommittedFrame,
  resetPerfInspector,
} from '../../src/core/perf-inspector.js';
import { render } from '../../src/app/render-loop.js';
import { renderToString } from '../../src/core/renderer.js';
import { Box, Text } from '../../src/primitives/index.js';
import { PerfOverlay } from '../../src/dev-tools/perf-overlay.js';

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
    write: vi.fn((chunk: string | Uint8Array) => {
      output += chunk.toString();
      return true;
    }),
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
    once: emitter.once.bind(emitter),
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

function recordSyntheticFrame(durationMs: number, outputByteCount: number, patchCount = 0): void {
  const frame = createFrameSnapshot(Text({}, `frame-${durationMs}`), { width: 40, height: 6 });
  recordFrameStructuralMetric(frame, 'outputByteCount', outputByteCount);
  recordFrameStructuralMetric(frame, 'patchCount', patchCount);
  finalizeFrameRuntimeMetrics(
    frame,
    frame.metrics.frameStartAt,
    frame.metrics.frameStartAt + durationMs,
  );
  recordCommittedFrame(frame, { renderer: 'ansi' });
}

describe('perf-inspector', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetPerfInspector();
    resetHookState();
    clearInputHandlers();
    setAppContext(null);
    resetProgressive();
    configureProgressive({ overrides: { focusEvents: false } });
  });

  afterEach(() => {
    vi.useRealTimers();
    cleanupApp();
    clearCommittedFrameSnapshot();
    resetHookState();
    clearInputHandlers();
    setAppContext(null);
    resetProgressive();
    resetPerfInspector();
  });

  it('keeps only the newest frames inside the ring buffer', () => {
    configurePerfInspector({
      maxFrames: 2,
      budget: { frameMs: 10, slowFrameMs: 25 },
    });

    recordSyntheticFrame(5, 12, 1);
    recordSyntheticFrame(11, 18, 2);
    recordSyntheticFrame(35, 24, 3);

    const frames = getPerfFrames();
    const summary = getPerfInspectorSummary();

    expect(frames).toHaveLength(2);
    expect(frames[0]!.totalMs).toBe(11);
    expect(frames[1]!.totalMs).toBe(35);
    expect(summary.frameCount).toBe(2);
    expect(summary.slowFrameCount).toBe(1);
    expect(summary.averageOutputBytes).toBe(21);
    expect(summary.averagePatchCount).toBe(2.5);
  });

  it('notifies slow-frame listeners when a frame crosses the slow threshold', () => {
    configurePerfInspector({
      budget: { frameMs: 10, slowFrameMs: 20 },
    });
    const listener = vi.fn();
    const stop = onSlowFrame(listener);

    recordSyntheticFrame(24, 40, 4);
    stop();

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0].slow).toBe(true);
    expect(listener.mock.calls[0]?.[0].budgetOverrunMs).toBe(14);
  });

  it('records ANSI render-loop commits with runtime phases and output bytes', () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();

    const instance = render(() => Box({}, Text({}, 'Perf ANSI')), {
      stdin,
      stdout,
      useDeltaRenderer: false,
      clearOnStart: false,
    });

    const summary = getPerfInspectorSummary();

    expect(summary.frameCount).toBeGreaterThanOrEqual(1);
    expect(summary.lastFrame?.renderer).toBe('ansi');
    expect(summary.lastFrame?.phases.vnodeEvalMs).toBeGreaterThanOrEqual(0);
    expect(summary.lastFrame?.phases.frameCommitMs).toBeGreaterThanOrEqual(0);
    expect(summary.lastFrame?.phases.ansiRenderMs).toBeGreaterThanOrEqual(0);
    expect(summary.lastFrame?.phases.outputWriteMs).toBeGreaterThanOrEqual(0);
    expect(summary.lastFrame?.structural.outputByteCount).toBeGreaterThan(0);

    instance.unmount();
  });

  it('records delta render-loop commits with patch and dirty metrics', () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();

    const instance = render(() => Text({}, 'Perf Delta'), {
      stdin,
      stdout,
      useDeltaRenderer: true,
      clearOnStart: false,
    });

    const summary = getPerfInspectorSummary();

    expect(summary.frameCount).toBeGreaterThanOrEqual(1);
    expect(summary.lastFrame?.renderer).toBe('delta');
    expect(summary.lastFrame?.phases.deltaRenderMs).toBeGreaterThanOrEqual(0);
    expect(summary.lastFrame?.phases.outputWriteMs).toBeGreaterThanOrEqual(0);
    expect(summary.lastFrame?.structural.outputByteCount).toBeGreaterThan(0);
    expect(summary.lastFrame?.structural.patchCount).toBeGreaterThanOrEqual(0);

    instance.unmount();
  });

  it('renders PerfOverlay from the recorded frame summary', () => {
    const emptyOutput = renderToString(PerfOverlay());
    expect(emptyOutput).toContain('No committed frames recorded yet.');

    recordSyntheticFrame(8, 64, 6);

    const output = renderToString(PerfOverlay());
    expect(output).toContain('Perf Inspector');
    expect(output).toContain('avg');
    expect(output).toContain('bytes');
  });
});
