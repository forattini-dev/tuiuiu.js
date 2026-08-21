import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

import { render } from '../../src/app/render-loop.js';
import { cleanupApp } from '../../src/hooks/use-app.js';
import { resetHookState, setAppContext } from '../../src/hooks/context.js';
import { resetTestInteractions } from '../../src/testing/interaction.js';
import { ShellSessionWorkbench } from '../../examples/shell-session-workbench.ts';
import { createShellSessionController } from '../../examples/_shared/shell-session-controller.ts';

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
  });

  return stream as unknown as NodeJS.WriteStream & { output: string };
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripAnsi(value: string): string {
  return value.replace(/\u001b\[[0-9;?]*[ -/]*[@-~]/g, '');
}

function createMockSyncStorage(initial = new Map<string, string>()) {
  const saved = initial;
  return {
    saved,
    storage: {
      getItem: vi.fn((key: string) => saved.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => {
        saved.set(key, value);
      }),
    },
  };
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

  throw new Error(`Timed out waiting for output containing "${expected}"`);
}

async function typeText(stdin: NodeJS.ReadStream, text: string): Promise<void> {
  for (const char of text) {
    stdin.emit('data', Buffer.from(char));
    await wait(0);
  }
}

describe('shell-session-workbench example', () => {
  beforeEach(() => {
    resetHookState();
    resetTestInteractions();
    setAppContext(null);
  });

  afterEach(() => {
    cleanupApp();
    resetHookState();
    resetTestInteractions();
  });

  it('streams process output into the example transcript', async () => {
    const controller = createShellSessionController();
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '!demo-stream');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'demo:start');
    await waitForOutput(stdout, 'demo:middle');

    instance.unmount();
    controller.destroy();
  });

  it('hydrates persisted replay state before the first rendered frame and resets runtime flags', async () => {
    const persisted = createMockSyncStorage(new Map([
      ['shell-session-state', JSON.stringify({
        entries: [
          { stream: 'system', text: '$ echo restored-state' },
          { stream: 'stdout', text: 'restored-state' },
        ],
        commandHistory: ['echo restored-state'],
        running: true,
        currentCommand: 'demo-hang',
      })],
    ]));
    const controller = createShellSessionController({
      persistence: {
        storage: persisted.storage,
        key: 'shell-session-state',
      },
    });
    const snapshot = controller.getSnapshot();

    expect(snapshot.running).toBe(false);
    expect(snapshot.currentCommand).toBeNull();
    expect(snapshot.commandHistory).toEqual(['echo restored-state']);
    expect(snapshot.liveStatus.phase).toBe('idle');
    expect(snapshot.stdin.writable).toBe(false);

    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin: createMockStdin(),
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await waitForOutput(stdout, 'restored-state');
    await waitForOutput(stdout, 'running: no');
    await waitForOutput(stdout, 'STATUS  idle');
    expect(controller.getSnapshot().stdin.writable).toBe(false);

    instance.unmount();
    controller.destroy();
  });

  it('restores replay buffer content after remount', async () => {
    const controller = createShellSessionController();
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const first = render(() => ShellSessionWorkbench({ controller }), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '!demo-stream');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'demo:end');

    first.unmount();
    resetHookState();
    resetTestInteractions();
    setAppContext(null);

    const secondStdout = createMockStdout();
    const second = render(() => ShellSessionWorkbench({ controller }), {
      stdin: createMockStdin(),
      stdout: secondStdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await waitForOutput(secondStdout, 'demo:start');
    await waitForOutput(secondStdout, 'demo:end');

    second.unmount();
    controller.destroy();
  });

  it('recalls prior shell commands from controller history', async () => {
    const controller = createShellSessionController();
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '!echo history-check');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'history-check');

    stdin.emit('data', Buffer.from('\x1b[A'));
    await waitForOutput(stdout, 'payload: echo history-check');

    instance.unmount();
    controller.destroy();
  });

  it('does not steal Up history recall from wrapped prompt navigation', async () => {
    const controller = createShellSessionController();
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '!echo history-check');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'history-check');

    const longNote = 'wrapped note '.repeat(8).trim();
    await typeText(stdin, longNote);
    stdin.emit('data', Buffer.from('\x1b[A'));
    stdin.emit('data', Buffer.from('\r'));

    const startedAt = Date.now();
    while (Date.now() - startedAt < 2500) {
      if (
        controller.getSnapshot().entries.some(
          (entry) => entry.text === `Text mode stays local: ${longNote}`
        )
      ) {
        break;
      }
      await wait(25);
    }

    expect(
      controller.getSnapshot().entries.some(
        (entry) => entry.text === `Text mode stays local: ${longNote}`
      )
    ).toBe(true);
    expect(
      controller.getSnapshot().entries.filter((entry) => entry.text === '$ echo history-check')
    ).toHaveLength(1);

    instance.unmount();
    controller.destroy();
  });

  it('keeps plain-text submit local when no shell process is accepting stdin', async () => {
    const controller = createShellSessionController();
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, 'local note');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'local note');
    expect(controller.getSnapshot().stdin.writable).toBe(false);
    expect(
      controller.getSnapshot().entries.some((entry) => entry.text === 'Text mode stays local: local note')
    ).toBe(true);

    instance.unmount();
    controller.destroy();
  });

  it('routes plain-text submit into child stdin when the active process accepts input', async () => {
    const controller = createShellSessionController();
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '!demo-stdin');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'stdin:ready');
    expect(controller.getSnapshot().stdin.writable).toBe(true);

    await typeText(stdin, 'hello stdin');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'stdin> hello stdin');
    await waitForOutput(stdout, 'stdin:echo hello stdin');
    expect(controller.getSnapshot().stdin.writable).toBe(true);

    await typeText(stdin, '!literal bang');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'stdin> !literal bang');
    await waitForOutput(stdout, 'stdin:echo !literal bang');

    instance.unmount();
    controller.destroy();
  });

  it('shows active shell status before a long-running command completes', async () => {
    const controller = createShellSessionController();
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '!demo-status');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'STATUS  running');
    await waitForOutput(stdout, 'summary: Running demo-status...');
    await waitForOutput(stdout, 'status:end');

    instance.unmount();
    controller.destroy();
  });

  it('persists replay transcript and command history through the configured storage adapter', async () => {
    const persisted = createMockSyncStorage();
    const controller = createShellSessionController({
      persistence: {
        storage: persisted.storage,
        key: 'shell-session-state',
      },
    });

    controller.appendSystemMessage('persist-me');
    controller.runCommand('demo-stream');

    expect(persisted.storage.setItem).toHaveBeenCalled();

    const saved = JSON.parse(persisted.saved.get('shell-session-state') ?? '{}') as {
      entries?: Array<{ stream: string; text: string }>;
      commandHistory?: string[];
    };

    expect(saved.entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ stream: 'system', text: 'persist-me' }),
        expect.objectContaining({ stream: 'system', text: '$ demo-stream' }),
      ])
    );
    expect(saved.commandHistory).toEqual(['demo-stream']);

    controller.destroy();
  });

  it('reflects stdin close truthfully in the workbench state', async () => {
    const controller = createShellSessionController();
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '!demo-stdin');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'stdin:ready');
    expect(controller.getSnapshot().stdin.writable).toBe(true);

    await typeText(stdin, '!stdin-close');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'stdin close requested');
    await waitForOutput(stdout, 'stdin:closed');
    expect(controller.getSnapshot().stdin.writable).toBe(false);

    instance.unmount();
    controller.destroy();
  });

  it('reflects interruption of the active shell command in the workbench transcript', async () => {
    const controller = createShellSessionController();
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '!demo-hang');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'hang:start');
    controller.interrupt();

    await waitForOutput(stdout, 'STATUS  interrupt-requested');
    await waitForOutput(stdout, 'Interrupt requested');

    instance.unmount();
    controller.destroy();
  });

  it('falls back safely when persisted shell session state is invalid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const persisted = {
      getItem: vi.fn(() => '{bad-json'),
      setItem: vi.fn(),
    };
    const controller = createShellSessionController({
      persistence: {
        storage: persisted,
        key: 'shell-session-state',
      },
    });
    const stdout = createMockStdout();
    const instance = render(() => ShellSessionWorkbench({ controller }), {
      stdin: createMockStdin(),
      stdout,
      maxFps: 0,
      showHardwareCursor: true,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    expect(controller.getSnapshot()).toMatchObject({
      entries: [],
      commandHistory: [],
      running: false,
      currentCommand: null,
      liveStatus: expect.objectContaining({
        phase: 'idle',
      }),
      stdin: expect.objectContaining({
        writable: false,
      }),
    });
    await waitForOutput(stdout, 'No shell output yet');
    expect(warn).toHaveBeenCalledWith(
      'Failed to hydrate persisted shell session state. Falling back to empty session state.',
      expect.anything()
    );

    instance.unmount();
    controller.destroy();
    warn.mockRestore();
  });
});
