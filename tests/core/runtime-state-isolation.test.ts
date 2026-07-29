import { EventEmitter } from 'node:events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  configureTerminalCapabilitySource,
  getCapabilities,
  getRenderMode,
  getTerminalSize,
  onResize,
  setRenderMode,
} from '../../src/core/capabilities.js';
import {
  configureMotionRuntime,
  getMotionRuntimeState,
  getPrefersReducedMotion,
  reportMotionFrameCost,
  requestMotionFrame,
  setPrefersReducedMotion,
} from '../../src/core/motion-runtime.js';
import {
  getGraphicsProtocol,
  setGraphicsProtocol,
} from '../../src/core/graphics.js';
import {
  getKeyboardProtocol,
  setKeyboardProtocol,
} from '../../src/core/input.js';
import {
  getLayerCount,
  getOverlayTerminalSize,
  setOverlayTerminalSize,
  showModal,
  showToast,
  showTooltip,
} from '../../src/core/overlay.js';
import {
  configureProgressive,
  getProgressiveOverrides,
  resetProgressive,
} from '../../src/core/progressive.js';
import {
  configurePerfInspector,
  getPerfInspectorConfig,
} from '../../src/core/perf-inspector.js';
import {
  createRuntimeScope,
  destroyRuntimeScope,
  resetDefaultRuntimeScope,
  runInRuntimeScope,
  type RuntimeScope,
} from '../../src/core/runtime-scope.js';
import { darkTheme, getTheme, lightTheme, setTheme } from '../../src/core/theme.js';
import {
  getTick,
  getTickRate,
  onTick,
  setTickRate,
  setTickValue,
  startTick,
} from '../../src/core/tick.js';

function createOutput(columns: number, rows: number): NodeJS.WriteStream {
  const output = new EventEmitter() as EventEmitter & {
    columns: number;
    rows: number;
    write: () => boolean;
  };
  output.columns = columns;
  output.rows = rows;
  output.write = () => true;
  return output as unknown as NodeJS.WriteStream;
}

describe('per-runtime UI state', () => {
  const scopes: RuntimeScope[] = [];

  function createScope(): RuntimeScope {
    const scope = createRuntimeScope();
    scopes.push(scope);
    return scope;
  }

  beforeEach(() => {
    vi.useFakeTimers();
    resetDefaultRuntimeScope();
  });

  afterEach(() => {
    for (const scope of scopes.splice(0)) destroyRuntimeScope(scope);
    resetDefaultRuntimeScope();
    vi.useRealTimers();
  });

  it('inherits pre-render defaults and isolates subsequent mutations', () => {
    setTheme(lightTheme);
    setRenderMode('ascii');
    configureProgressive({ overrides: { focusEvents: true } });
    configureMotionRuntime({ targetFps: 20, reducedFps: 10 });
    setPrefersReducedMotion(true);
    setTickValue(7);
    setTickRate(250);
    setOverlayTerminalSize(100, 40);
    setKeyboardProtocol('xterm');
    setGraphicsProtocol('braille');
    configurePerfInspector({ maxFrames: 25 });

    const first = createScope();
    const second = createScope();

    for (const scope of [first, second]) {
      runInRuntimeScope(scope, () => {
        expect(getTheme()).toBe(lightTheme);
        expect(getRenderMode()).toBe('ascii');
        expect(getProgressiveOverrides()?.focusEvents).toBe(true);
        expect(getMotionRuntimeState().config.targetFps).toBe(20);
        expect(getPrefersReducedMotion()).toBe(true);
        expect(getTick()).toBe(7);
        expect(getTickRate()).toBe(250);
        expect(getOverlayTerminalSize()).toEqual({ width: 100, height: 40 });
        expect(getKeyboardProtocol()).toBe('xterm');
        expect(getGraphicsProtocol()).toBe('braille');
        expect(getPerfInspectorConfig().maxFrames).toBe(25);
      });
    }

    runInRuntimeScope(first, () => {
      setTheme(darkTheme);
      setRenderMode('unicode');
      resetProgressive();
      reportMotionFrameCost(100);
      setPrefersReducedMotion(false);
      setTickValue(99);
      setOverlayTerminalSize(60, 20);
      showModal({ content: ['first only'] });
      setKeyboardProtocol('kitty');
      setGraphicsProtocol('halfblock');
      configurePerfInspector({ maxFrames: 5 });
    });

    runInRuntimeScope(second, () => {
      expect(getTheme()).toBe(lightTheme);
      expect(getRenderMode()).toBe('ascii');
      expect(getProgressiveOverrides()?.focusEvents).toBe(true);
      expect(getMotionRuntimeState().qualityTier).toBe('full');
      expect(getPrefersReducedMotion()).toBe(true);
      expect(getTick()).toBe(7);
      expect(getOverlayTerminalSize()).toEqual({ width: 100, height: 40 });
      expect(getLayerCount()).toBe(0);
      expect(getKeyboardProtocol()).toBe('xterm');
      expect(getGraphicsProtocol()).toBe('braille');
      expect(getPerfInspectorConfig().maxFrames).toBe(25);
    });
  });

  it('binds capability caches and resize listeners to each output stream', () => {
    const first = createScope();
    const second = createScope();
    const firstOutput = createOutput(90, 30);
    const secondOutput = createOutput(140, 50);
    const firstResize = vi.fn();
    const secondResize = vi.fn();

    runInRuntimeScope(first, () => {
      configureTerminalCapabilitySource({
        env: { TERM: 'dumb' },
        stdout: firstOutput,
      });
      onResize(firstResize);
      expect(getTerminalSize()).toEqual({ columns: 90, rows: 30 });
      expect(getCapabilities().unicode).toBe(false);
    });

    runInRuntimeScope(second, () => {
      configureTerminalCapabilitySource({
        env: { TERM: 'xterm-256color' },
        stdout: secondOutput,
      });
      onResize(secondResize);
      expect(getTerminalSize()).toEqual({ columns: 140, rows: 50 });
      expect(getCapabilities().unicode).toBe(true);
    });

    Object.assign(firstOutput, { columns: 91, rows: 31 });
    firstOutput.emit('resize');

    expect(firstResize).toHaveBeenCalledWith({ columns: 91, rows: 31 });
    expect(secondResize).not.toHaveBeenCalled();

    runInRuntimeScope(second, () => {
      expect(getTerminalSize()).toEqual({ columns: 140, rows: 50 });
    });
  });

  it('cancels timers and listeners when their owning runtime is destroyed', () => {
    const scope = createScope();
    const tickListener = vi.fn();
    const frame = vi.fn();
    const toastDismiss = vi.fn();

    runInRuntimeScope(scope, () => {
      onTick(tickListener);
      startTick(100);
      requestMotionFrame(frame);
      showToast({
        message: 'ephemeral',
        duration: 500,
        onDismiss: toastDismiss,
      });
      showTooltip({
        text: 'delayed',
        target: { x: 1, y: 1 },
        delay: 250,
      });
    });

    destroyRuntimeScope(scope);
    vi.advanceTimersByTime(1_000);

    expect(tickListener).not.toHaveBeenCalled();
    expect(frame).not.toHaveBeenCalled();
    expect(toastDismiss).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});
