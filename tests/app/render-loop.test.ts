/**
 * Tests for app/render-loop.ts - Main render loop and app lifecycle
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, renderOnce } from '../../src/app/render-loop.js';
import { Text, Box } from '../../src/primitives/index.js';
import { createSignal } from '../../src/primitives/signal.js';
import { EventEmitter } from 'node:events';
import { Writable } from 'node:stream';
import {
  resetHookState,
  setAppContext,
  clearInputHandlers,
} from '../../src/hooks/context.js';
import { cleanupApp } from '../../src/hooks/use-app.js';
import { clearCommittedFrameSnapshot, getCommittedFrameSnapshot } from '../../src/core/frame.js';
import { getMotionRuntimeState, reportMotionBudgetResult, resetMotionRuntime } from '../../src/core/motion-runtime.js';
import { resetTerminalFocusState, setTerminalFocusState } from '../../src/core/terminal-focus.js';
import { configureProgressive, resetProgressive } from '../../src/core/progressive.js';

// Create mock stdin
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

// Create mock stdout
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
    set: (v: string) => {
      output = v;
    },
  });
  return stream as unknown as NodeJS.WriteStream & { output: string };
}

describe('render-loop', () => {
  let stdin: NodeJS.ReadStream;
  let stdout: NodeJS.WriteStream & { output: string };
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    resetHookState();
    clearInputHandlers();
    setAppContext(null);
    resetProgressive();
    configureProgressive({ overrides: { focusEvents: false } });
    resetMotionRuntime();
    resetTerminalFocusState();
    stdin = createMockStdin();
    stdout = createMockStdout();
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    vi.useRealTimers();
    mockExit.mockRestore();
    cleanupApp();
    resetHookState();
    clearInputHandlers();
    clearCommittedFrameSnapshot();
    resetMotionRuntime();
    resetProgressive();
    resetTerminalFocusState();
  });

  describe('render', () => {
    it('returns TuiInstance with expected methods', () => {
      const node = Text({}, 'Hello');
      const instance = render(node, { stdin, stdout });

      expect(instance).toHaveProperty('rerender');
      expect(instance).toHaveProperty('unmount');
      expect(instance).toHaveProperty('waitUntilExit');
      expect(instance).toHaveProperty('clear');

      instance.unmount();
    });

    it('renders initial content to stdout', () => {
      const node = Text({}, 'Hello World');
      const instance = render(node, { stdin, stdout });

      // Should have rendered initial content
      expect(stdout.output).toContain('Hello World');

      instance.unmount();
    });

    it('accepts function as node', () => {
      const instance = render(() => Text({}, 'From function'), { stdin, stdout });

      expect(stdout.output).toContain('From function');

      instance.unmount();
    });

    it('clears terminal on start by default', () => {
      const node = Text({}, 'Test');
      const instance = render(node, { stdin, stdout });

      // Clear terminal sequence should be written first
      expect(stdout.output).toContain('\x1b[2J');

      instance.unmount();
    });

    it('skips clear on start when clearOnStart is false', () => {
      stdout.output = '';
      const node = Text({}, 'Test');
      const instance = render(node, { stdin, stdout, clearOnStart: false });

      // Should not have clear sequence
      expect(stdout.output).not.toContain('\x1b[2J');

      instance.unmount();
    });

    it('handles debug mode', () => {
      const node = Text({}, 'Debug content');
      const instance = render(node, { stdin, stdout, debug: true });

      expect(stdout.output).toContain('Debug content');

      instance.unmount();
    });

    it('rerender updates content', () => {
      const node1 = Text({}, 'First');
      const instance = render(node1, { stdin, stdout });

      expect(stdout.output).toContain('First');

      const node2 = Text({}, 'Second');
      instance.rerender(node2);

      // Need to advance timers to let throttled render happen
      vi.advanceTimersByTime(100);

      expect(stdout.output).toContain('Second');

      instance.unmount();
    });

    it('unmount cleans up and resolves exit promise', async () => {
      const node = Text({}, 'Test');
      const instance = render(node, { stdin, stdout });

      let resolved = false;
      instance.waitUntilExit().then(() => {
        resolved = true;
      });

      instance.unmount();

      // Flush microtasks
      await vi.runAllTimersAsync();

      expect(resolved).toBe(true);
    });

    it('clear method clears output', () => {
      const node = Text({}, 'Content');
      const instance = render(node, { stdin, stdout });

      stdout.output = '';
      instance.clear();

      // Clear should write clear sequence
      expect(stdout.output).toContain('\x1b[2J');

      instance.unmount();
    });

    it('handles resize events', () => {
      let renderCount = 0;
      const instance = render(
        () => {
          renderCount++;
          return Text({}, `Render ${renderCount}`);
        },
        { stdin, stdout }
      );

      const initialCount = renderCount;

      // Simulate resize
      stdout.emit('resize');
      vi.advanceTimersByTime(100);

      // Should have re-rendered
      expect(renderCount).toBeGreaterThan(initialCount);

      instance.unmount();
    });

    it('respects maxFps throttling', () => {
      let renderCount = 0;
      const [count, setCount] = createSignal(0);

      const instance = render(
        () => {
          renderCount++;
          return Text({}, `Count: ${count()}`);
        },
        { stdin, stdout, maxFps: 10 } // 100ms between frames
      );

      expect(getMotionRuntimeState().config.targetFps).toBe(10);
      expect(getMotionRuntimeState().config.frameBudgetMs).toBe(100);

      // Initial render
      expect(renderCount).toBe(1);

      // Rapid updates
      setCount(1);
      setCount(2);
      setCount(3);

      // Should be throttled, so not all updates rendered yet
      vi.advanceTimersByTime(50);

      // After waiting for throttle, should render
      vi.advanceTimersByTime(100);

      instance.unmount();
    });

    it('reactive updates via signals', () => {
      const [text, setText] = createSignal('Initial');

      const instance = render(
        () => Text({}, text()),
        { stdin, stdout }
      );

      expect(stdout.output).toContain('Initial');

      setText('Updated');
      vi.advanceTimersByTime(100);

      expect(stdout.output).toContain('Updated');

      instance.unmount();
    });

    it('coalesces synchronous updates into one evaluation and paint when maxFps is uncapped', async () => {
      const [count, setCount] = createSignal(0);
      let renderCount = 0;

      const instance = render(
        () => {
          renderCount++;
          return Text({}, `Count: ${count()}`);
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

      expect(renderCount).toBe(1);
      expect(stdout.write).toHaveBeenCalledTimes(1);

      setCount(1);
      setCount(2);
      setCount(3);

      // Evaluation and paint are deferred so a burst of sync updates can collapse to the latest state.
      expect(renderCount).toBe(1);
      expect(stdout.write).toHaveBeenCalledTimes(1);

      await Promise.resolve();

      expect(renderCount).toBe(2);
      expect(stdout.write).toHaveBeenCalledTimes(2);
      expect(stdout.output).toContain('Count: 3');

      instance.unmount();
    });

    it('does not add extra render-loop delay when adaptive pressure is elevated', async () => {
      const [count, setCount] = createSignal(0);
      let renderCount = 0;

      const instance = render(
        () => {
          renderCount++;
          return Text({}, `Count: ${count()}`);
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

      expect(renderCount).toBe(1);

      reportMotionBudgetResult({ totalMs: 8, phaseOverrunCount: 1 });
      expect(getMotionRuntimeState().presentationPressure).toBe('elevated');

      setCount(1);
      await Promise.resolve();

      expect(renderCount).toBe(2);
      expect(stdout.output).toContain('Count: 1');

      instance.unmount();
    });

    it('does not compound maxFps throttling when adaptive pressure is elevated', () => {
      const [count, setCount] = createSignal(0);
      let renderCount = 0;

      const instance = render(
        () => {
          renderCount++;
          return Text({}, `Count: ${count()}`);
        },
        {
          stdin,
          stdout,
          maxFps: 30,
          clearOnStart: false,
          showCursor: true,
          useDeltaRenderer: false,
        }
      );

      expect(renderCount).toBe(1);

      reportMotionBudgetResult({ totalMs: 40, overBudget: true });
      expect(getMotionRuntimeState().presentationPressure).not.toBe('normal');

      setCount(1);

      vi.advanceTimersByTime(33);
      expect(renderCount).toBe(1);

      vi.advanceTimersByTime(1);
      expect(renderCount).toBe(2);

      instance.unmount();
    });

    it('waits for drain and keeps only the latest pending frame under output backpressure', async () => {
      const [count, setCount] = createSignal(0);
      let renderCount = 0;
      let writeCount = 0;

      vi.mocked(stdout.write).mockImplementation((chunk: string | Buffer) => {
        writeCount++;
        stdout.output += chunk.toString();
        return writeCount !== 2;
      });

      const instance = render(
        () => {
          renderCount++;
          return Text({}, `Count: ${count()}`);
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

      expect(renderCount).toBe(1);
      expect(writeCount).toBe(1);

      setCount(1);
      await Promise.resolve();

      expect(renderCount).toBe(2);
      expect(writeCount).toBe(2);

      setCount(2);
      setCount(3);

      expect(renderCount).toBe(2);
      expect(writeCount).toBe(2);

      stdout.emit('drain');
      await Promise.resolve();

      expect(renderCount).toBe(3);
      expect(writeCount).toBe(3);
      expect(stdout.output).toContain('Count: 3');

      instance.unmount();
    });

    it('supports fixed-step updates with presentation capped independently', () => {
      const [count, setCount] = createSignal(0);
      let renderCount = 0;
      let updateCount = 0;
      const deltas: number[] = [];

      const instance = render(
        () => {
          renderCount++;
          return Text({}, `Count: ${count()}`);
        },
        {
          stdin,
          stdout,
          maxFps: 4,
          clearOnStart: false,
          showCursor: true,
          useDeltaRenderer: false,
          fixedStep: {
            updateFps: 20,
            onUpdate: ({ deltaTimeMs }) => {
              updateCount++;
              deltas.push(deltaTimeMs);
              setCount((value) => value + 1);
            },
          },
        }
      );

      expect(renderCount).toBe(1);
      expect(updateCount).toBe(0);

      vi.advanceTimersByTime(250);

      expect(updateCount).toBe(5);
      expect(deltas).toEqual([50, 50, 50, 50, 50]);
      expect(count()).toBe(5);
      expect(renderCount).toBe(2);

      instance.unmount();
    });

    it('pauses fixed-step updates while the terminal is unfocused and resumes without catch-up', () => {
      const [count, setCount] = createSignal(0);
      let updateCount = 0;

      const instance = render(
        () => Text({}, `Count: ${count()}`),
        {
          stdin,
          stdout,
          maxFps: 0,
          clearOnStart: false,
          showCursor: true,
          useDeltaRenderer: false,
          fixedStep: {
            updateFps: 20,
            onUpdate: () => {
              updateCount++;
              setCount((value) => value + 1);
            },
          },
        }
      );

      vi.advanceTimersByTime(100);
      expect(updateCount).toBe(2);

      setTerminalFocusState(false);
      vi.advanceTimersByTime(300);
      expect(updateCount).toBe(2);
      expect(count()).toBe(2);

      setTerminalFocusState(true);
      vi.advanceTimersByTime(49);
      expect(updateCount).toBe(2);

      vi.advanceTimersByTime(1);
      expect(updateCount).toBe(3);
      expect(count()).toBe(3);

      instance.unmount();
    });

    it('can keep fixed-step updates running while unfocused when pauseWhenUnfocused is false', () => {
      let updateCount = 0;

      const instance = render(
        () => Text({}, `Updates: ${updateCount}`),
        {
          stdin,
          stdout,
          maxFps: 0,
          clearOnStart: false,
          showCursor: true,
          useDeltaRenderer: false,
          fixedStep: {
            updateFps: 20,
            pauseWhenUnfocused: false,
            onUpdate: () => {
              updateCount++;
            },
          },
        }
      );

      setTerminalFocusState(false);
      vi.advanceTimersByTime(100);
      expect(updateCount).toBe(2);

      instance.unmount();
    });

    it('commits the last rendered frame for runtime queries and clears it on unmount', () => {
      const instance = render(
        Box({ id: 'root', width: 20, height: 3 } as any, Text({}, 'Committed')),
        { stdin, stdout, clearOnStart: false },
      );

      const frame = getCommittedFrameSnapshot();
      expect(frame).not.toBeNull();
      expect(frame?.queries.getElement('root')).toMatchObject({
        status: 'found',
        found: true,
      });

      instance.unmount();

      expect(getCommittedFrameSnapshot()).toBeNull();
    });

    it('unmount only happens once', () => {
      const node = Text({}, 'Test');
      const instance = render(node, { stdin, stdout });

      instance.unmount();
      // Second unmount should not throw
      instance.unmount();
    });

    it('handles exit on Ctrl+C', () => {
      const node = Text({}, 'Test');
      render(node, { stdin, stdout, exitOnCtrlC: true });

      // Ctrl+C is handled by initializeApp
      stdin.emit('data', Buffer.from([0x03]));

      expect(mockExit).toHaveBeenCalled();
    });
  });

  describe('renderOnce', () => {
    it('renders node to string', () => {
      const node = Text({}, 'Static content');
      const output = renderOnce(node);

      expect(output).toContain('Static content');
    });

    it('uses specified width', () => {
      const node = Box({ width: '100%' }, Text({}, 'Full width'));
      const output = renderOnce(node, 40);

      // Output should be rendered with 40 columns width
      expect(output).toBeDefined();
    });

    it('renders Box with content', () => {
      const node = Box(
        { padding: 1, borderStyle: 'single' },
        Text({}, 'Boxed')
      );
      const output = renderOnce(node);

      expect(output).toContain('Boxed');
      expect(output).toContain('│'); // Box border
    });

    it('handles nested components', () => {
      const node = Box(
        {},
        Box({}, Text({}, 'Nested 1')),
        Box({}, Text({}, 'Nested 2'))
      );
      const output = renderOnce(node);

      expect(output).toContain('Nested 1');
      expect(output).toContain('Nested 2');
    });
  });

  describe('render with various options', () => {
    it('showCursor option', () => {
      const node = Text({}, 'Test');
      const instance = render(node, { stdin, stdout, showCursor: true });

      // With showCursor true, cursor should be visible
      instance.unmount();
    });

    it('handles non-TTY stdout gracefully', () => {
      const nonTTYStdout = createMockStdout();
      (nonTTYStdout as any).isTTY = false;

      const node = Text({}, 'Test');
      const instance = render(node, { stdin, stdout: nonTTYStdout });

      expect(nonTTYStdout.output).toContain('Test');

      instance.unmount();
    });

    it('handles undefined columns', () => {
      const stdoutNoColumns = createMockStdout();
      (stdoutNoColumns as any).columns = undefined;

      const node = Text({}, 'Test');
      const instance = render(node, { stdin, stdout: stdoutNoColumns });

      // Should use fallback width of 80
      expect(stdoutNoColumns.output).toContain('Test');

      instance.unmount();
    });
  });

  describe('render loop lifecycle', () => {
    it('waitUntilExit returns a promise', () => {
      const node = Text({}, 'Test');
      const instance = render(node, { stdin, stdout });

      const promise = instance.waitUntilExit();
      expect(promise).toBeInstanceOf(Promise);

      instance.unmount();
    });

    it('cleanup removes resize listener', () => {
      const node = Text({}, 'Test');
      const instance = render(node, { stdin, stdout });

      instance.unmount();

      // After unmount, resize should not trigger re-render
      let threw = false;
      try {
        stdout.emit('resize');
      } catch {
        threw = true;
      }
      expect(threw).toBe(false);
    });

    it('skips render when unmounted', () => {
      const [count, setCount] = createSignal(0);
      const instance = render(
        () => Text({}, `Count: ${count()}`),
        { stdin, stdout }
      );

      instance.unmount();

      // Update signal after unmount
      setCount(1);
      vi.advanceTimersByTime(100);

      // Should not crash
    });

    it('does not duplicate output when value unchanged', () => {
      const [text] = createSignal('Same');

      const instance = render(
        () => Text({}, text()),
        { stdin, stdout }
      );

      stdout.output = '';

      // Force a render attempt with same value
      instance.rerender(Text({}, 'Same'));
      vi.advanceTimersByTime(100);

      // Should skip duplicate render (output may be empty or same)
      instance.unmount();
    });
  });
});
