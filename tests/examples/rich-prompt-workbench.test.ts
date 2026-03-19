import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

import { render } from '../../src/app/render-loop.js';
import { cleanupApp } from '../../src/hooks/use-app.js';
import {
  clearInputHandlers,
  resetHookState,
  setAppContext,
} from '../../src/hooks/context.js';
import { RichPromptWorkbench } from '../../examples/rich-prompt-workbench.ts';

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
    columns: 100,
    rows: 28,
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

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

async function waitForOutput(
  stdout: { output: string },
  expected: string,
  timeoutMs = 2500
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const clean = stripAnsi(stdout.output);
    if (clean.includes(expected)) {
      return;
    }
    await wait(25);
  }

  const clean = stripAnsi(stdout.output);
  throw new Error(
    `Timed out waiting for output containing "${expected}". Tail:\n${clean.slice(-1200)}`
  );
}

async function typeText(stdin: NodeJS.ReadStream, text: string): Promise<void> {
  for (const char of text) {
    stdin.emit('data', Buffer.from(char));
    await wait(0);
  }
}

describe('rich-prompt-workbench example', () => {
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

  it('completes a worker-backed prompt pass and records the assistant output', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => RichPromptWorkbench(), {
      stdin,
      stdout,
      maxFps: 0,
      clearOnStart: false,
      showCursor: true,
      useDeltaRenderer: false,
      fullHeight: true,
    });

    await typeText(stdin, 'terminal worker');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'Reference prompt processed');
    await waitForOutput(stdout, 'trace render-loop and');
    await waitForOutput(stdout, 'executor with worker-thread');

    instance.unmount();
  });

  it('cancels an in-flight worker task with Escape', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => RichPromptWorkbench(), {
      stdin,
      stdout,
      maxFps: 0,
      clearOnStart: false,
      showCursor: true,
      useDeltaRenderer: false,
      fullHeight: true,
    });

    await typeText(stdin, 'cancel this worker task');
    stdin.emit('data', Buffer.from('\r'));
    await wait(80);
    stdin.emit('data', Buffer.from('\x1b'));

    await waitForOutput(stdout, 'Background task cancelled');

    instance.unmount();
  });

  it('hydrates persisted completion ranking when storage is provided', async () => {
    const rankingStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => RichPromptWorkbench({ rankingStorage }), {
      stdin,
      stdout,
      maxFps: 0,
      clearOnStart: false,
      showCursor: true,
      useDeltaRenderer: false,
      fullHeight: true,
    });

    await wait(50);
    expect(rankingStorage.getItem).toHaveBeenCalledWith('completion-ranking');

    instance.unmount();
  });

  it('routes slash commands through app-owned prompt logic', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => RichPromptWorkbench(), {
      stdin,
      stdout,
      maxFps: 0,
      clearOnStart: false,
      showCursor: true,
      useDeltaRenderer: false,
      fullHeight: true,
    });

    await typeText(stdin, '/help');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'Available slash commands');
    await waitForOutput(stdout, '/help • /clear • /tokens • /seed');

    instance.unmount();
  });

  it('routes slash commands with arguments through the workbench prompt', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => RichPromptWorkbench(), {
      stdin,
      stdout,
      maxFps: 0,
      clearOnStart: false,
      showCursor: true,
      useDeltaRenderer: false,
      fullHeight: true,
    });

    await typeText(stdin, '/seed reviewer');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'Inserted @reviewer and');
    await waitForOutput(stdout, '#src/atoms/text-input.ts into');

    instance.unmount();
  });

  it('routes shell-style bang prompts through prompt mode routing', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => RichPromptWorkbench(), {
      stdin,
      stdout,
      maxFps: 0,
      clearOnStart: false,
      showCursor: true,
      useDeltaRenderer: false,
      fullHeight: true,
    });

    await typeText(stdin, '!git status');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'Shell mode preview');
    await waitForOutput(stdout, 'Would run: git status');

    instance.unmount();
  });

  it('renders live slash-command context while typing', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => RichPromptWorkbench(), {
      stdin,
      stdout,
      maxFps: 0,
      clearOnStart: false,
      showCursor: true,
      useDeltaRenderer: false,
      fullHeight: true,
    });

    await typeText(stdin, '/seed reviewer');

    await waitForOutput(stdout, 'EDITING ARGUMENTS  /seed');
    await waitForOutput(stdout, 'current arg: reviewer');
    await waitForOutput(stdout, 'usage: /seed <preset>');

    instance.unmount();
  });

  it('renders live slash-command diagnostics while typing', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => RichPromptWorkbench(), {
      stdin,
      stdout,
      maxFps: 0,
      clearOnStart: false,
      showCursor: true,
      useDeltaRenderer: false,
      fullHeight: true,
    });

    await typeText(stdin, '/seed');
    await waitForOutput(stdout, 'warning: Preset required.');

    await typeText(stdin, ' mystery');
    await waitForOutput(stdout, 'error: Unknown preset: mystery');

    instance.unmount();
  });
});
