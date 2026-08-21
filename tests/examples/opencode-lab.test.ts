import { EventEmitter } from 'node:events';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import {
  HomeScreen,
  OpenCodeLab,
  SessionScreen,
  colors,
  type ConversationMessage,
} from '../../examples/opencode-lab.js';
import { Text } from '../../src/index.js';
import { render } from '../../src/app/render-loop.js';
import { renderToString } from '../../src/core/renderer.js';
import { resetHookState, setAppContext } from '../../src/hooks/context.js';
import { cleanupApp } from '../../src/hooks/use-app.js';
import { resetTestInteractions } from '../../src/testing/interaction.js';
import { stringWidth, stripAnsi } from '../../src/utils/text-utils.js';

interface Viewport {
  width: number;
  height: number;
}

const viewports: Viewport[] = [
  { width: 80, height: 24 },
  { width: 120, height: 36 },
  { width: 160, height: 42 },
];

const messages: ConversationMessage[] = [
  { id: 1, role: 'user', content: 'Test the responsive OpenCode layout' },
];

function composer(placeholder: string) {
  return Text({ color: colors.muted }, placeholder);
}

function renderFrame(node: ReturnType<typeof HomeScreen>, width: number) {
  return stripAnsi(renderToString(node, width));
}

function expectFrameWithinViewport(
  frame: string,
  viewport: Viewport,
): void {
  const lines = frame.split('\n');
  expect(lines.length).toBeLessThanOrEqual(viewport.height);
  expect(
    lines.every((line) => stringWidth(line) <= viewport.width),
  ).toBe(true);
}

describe('OpenCode lab responsive contracts', () => {
  for (const viewport of viewports) {
    it(`keeps the home screen inside ${viewport.width}x${viewport.height}`, () => {
      const frame = renderFrame(
        HomeScreen({
          ...viewport,
          composer: composer('Ask anything... "Fix broken tests"'),
          agent: 'Build',
          model: 'Big Pickle',
        }),
        viewport.width,
      );

      expectFrameWithinViewport(frame, viewport);
      expect(frame).toContain('Ask anything');
      expect(frame).toContain('ctrl+p');
      expect(frame).toContain('Tip');
      expect(frame).toContain('tuiuiu.js');
      expect(frame).toContain('█▀▀█ █▀▀█ █▀▀█ █▀▀▄ █▀▀▀ █▀▀█ █▀▀█ █▀▀█');
      expect(frame).toContain('▀▀▀▀ █▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀');
    });

    it(`keeps the session composer at the bottom of ${viewport.width}x${viewport.height}`, () => {
      const frame = renderFrame(
        SessionScreen({
          ...viewport,
          composer: composer('Ask a follow-up...'),
          agent: 'Build',
          model: 'Big Pickle',
          sessionTitle: 'Responsive test',
          messages,
          phase: 'thinking',
          sidebarVisible: true,
        }),
        viewport.width,
      );
      const lines = frame.split('\n');
      const composerLine = lines.findIndex((line) =>
        line.includes('Ask a follow-up'),
      );

      expectFrameWithinViewport(frame, viewport);
      expect(frame).toContain('Thinking');
      expect(frame).toContain('BUILD');
      expect(frame).toContain('esc interrupt');
      expect(composerLine).toBeGreaterThanOrEqual(viewport.height - 5);

      if (viewport.width >= 105) {
        expect(frame).toContain('Context');
        expect(frame).toContain('Getting started');
      } else {
        expect(frame).not.toContain('Context');
        expect(frame).not.toContain('Getting started');
      }
    });

  }

  it('renders the armed two-press interruption state', () => {
    const frame = renderFrame(
      SessionScreen({
        width: 100,
        height: 28,
        composer: composer('Ask a follow-up...'),
        agent: 'Build',
        model: 'Big Pickle',
        messages,
        phase: 'thinking',
        interruptArmed: true,
      }),
      100,
    );

    expect(frame).toContain('esc again to interrupt');
  });

  it('shows the selected provider, model, effort, and credential state', () => {
    const frame = renderFrame(
      SessionScreen({
        width: 120,
        height: 32,
        composer: composer('Ask a follow-up...'),
        agent: 'Build',
        provider: 'OpenAI',
        model: 'GPT-5.6',
        effort: 'high',
        credentialConfigured: true,
        messages,
        phase: 'idle',
      }),
      120,
    );

    expect(frame).toContain('GPT-5.6');
    expect(frame).toContain('OpenAI · high');
    expect(frame).toContain('credential configured');
  });
});

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

async function waitForOutput(
  stdout: { output: string },
  expected: string,
  timeoutMs = 2_500,
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (stripAnsi(stdout.output).includes(expected)) return;
    await wait(20);
  }
  throw new Error(
    `Timed out waiting for "${expected}". Tail:\n${stripAnsi(stdout.output).slice(-1_200)}`,
  );
}

async function typeText(stdin: NodeJS.ReadStream, text: string): Promise<void> {
  for (const character of text) {
    stdin.emit('data', Buffer.from(character));
    await wait(0);
  }
}

describe('OpenCode lab interaction contracts', () => {
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

  it('requires Escape twice before interrupting an active run', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => OpenCodeLab(), {
      stdin,
      stdout,
      maxFps: 0,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, 'Improve the terminal experience');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'Thinking');

    stdin.emit('data', Buffer.from('\x1b'));
    await waitForOutput(stdout, 'again to interrupt');
    expect(stripAnsi(stdout.output)).not.toContain('Session interrupted by the user.');

    stdin.emit('data', Buffer.from('\x1b'));
    await waitForOutput(stdout, 'Session interrupted by the user.');

    instance.unmount();
  });

  it('opens the runtime-backed command palette', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => OpenCodeLab(), {
      stdin,
      stdout,
      maxFps: 0,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    stdin.emit('data', Buffer.from('\x10'));
    await waitForOutput(stdout, 'Open command palette');
    await waitForOutput(stdout, 'Toggle sidebar');

    instance.unmount();
  });

  it('opens a filtered slash-command popup from the composer', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => OpenCodeLab(), {
      stdin,
      stdout,
      maxFps: 0,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '/');
    await waitForOutput(stdout, '/models');
    await waitForOutput(stdout, 'enter run');

    await typeText(stdin, 'mod');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'Select provider');

    instance.unmount();
  });

  it('opens /models as a modal and reveals more providers with ctrl+a', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => OpenCodeLab(), {
      stdin,
      stdout,
      maxFps: 0,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, '/models');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'Select provider');
    await waitForOutput(stdout, 'ctrl+a');

    stdin.emit('data', Buffer.from('\x01'));
    await waitForOutput(stdout, 'All providers');
    await waitForOutput(stdout, 'OpenRouter');

    stdin.emit('data', Buffer.from('\x06'));
    await waitForOutput(stdout, 'Reasoning and general-purpose coding models');

    stdin.emit('data', Buffer.from('\x14'));
    await waitForOutput(stdout, 'effort (high)');

    instance.unmount();
  });

  it('configures provider, API key, model, and effort without exposing the key', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => OpenCodeLab(), {
      stdin,
      stdout,
      maxFps: 0,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });
    const secret = 'sk-example-secret';

    await typeText(stdin, '/models');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'Select provider');

    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'Enter OpenAI API key:');
    await typeText(stdin, secret);
    expect(stripAnsi(stdout.output)).not.toContain(secret);

    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'Select a OpenAI model:');
    stdin.emit('data', Buffer.from('\r'));
    await waitForOutput(stdout, 'Select effort for GPT-5.6:');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'GPT-5.6 · medium');
    await waitForOutput(stdout, 'OpenAI');
    expect(stripAnsi(stdout.output)).not.toContain(secret);

    instance.unmount();
  });

  it('runs the complete simulated agent sequence', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const instance = render(() => OpenCodeLab(), {
      stdin,
      stdout,
      maxFps: 0,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await typeText(stdin, 'Build an OpenCode-like example');
    stdin.emit('data', Buffer.from('\r'));

    await waitForOutput(stdout, 'Read examples/opencode-lab.ts');
    await waitForOutput(stdout, 'Implemented a focused simulation', 4_000);
    await waitForOutput(stdout, 'guarded interruption');

    instance.unmount();
  });
});
