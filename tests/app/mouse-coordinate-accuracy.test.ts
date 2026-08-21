import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EventEmitter } from 'node:events';

import { render } from '../../src/app/render-loop.js';
import { Box, Text } from '../../src/primitives/index.js';
import { cleanupApp } from '../../src/hooks/use-app.js';
import { clearMouseHandlers, resetHookState, setAppContext } from '../../src/hooks/context.js';
import { resetTestInteractions } from '../../src/testing/interaction.js';
import { useLocalMouse } from '../../src/hooks/use-local-mouse.js';
import { useLayoutRef } from '../../src/hooks/use-layout-ref.js';
import { useState } from '../../src/hooks/use-state.js';
import { generateSGRMouseSequence } from '../../src/dev-tools/mouse-simulator.js';

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
    columns: 60,
    rows: 20,
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

async function waitForOutput(
  stdout: { output: string },
  expected: string,
  timeoutMs = 2500,
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

describe('mouse coordinate accuracy', () => {
  beforeEach(() => {
    resetHookState();
    resetTestInteractions();
    clearMouseHandlers();
    setAppContext(null);
  });

  afterEach(() => {
    cleanupApp();
    resetHookState();
    resetTestInteractions();
    clearMouseHandlers();
  });

  it('keeps local coordinates aligned through padded and gapped ancestors', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();

    function App() {
      const ref = useLayoutRef();
      const [cursor, setCursor] = useState('idle');

      useLocalMouse(
        () => ({
          x: ref.x(),
          y: ref.y(),
          width: ref.width(),
          height: ref.height(),
        }),
        (event) => {
          if (event.action === 'click' && event.button === 'left') {
            setCursor(`${event.x},${event.y}`);
          }
        },
        { onlyInside: true },
      );

      return Box(
        { flexDirection: 'column', padding: 1, gap: 1 },
        Text({}, 'header'),
        Box({ width: 5, height: 3, layoutRef: ref }, Text({}, 'ABCDE'), Text({}, 'FGHIJ'), Text({}, 'KLMNO')),
        Text({}, `cursor:${cursor()}`),
      );
    }

    const instance = render(() => App(), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: false,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await wait(50);
    stdin.emit('data', Buffer.from(generateSGRMouseSequence(3, 4, 'left', 'click')));

    await waitForOutput(stdout, 'cursor:2,1');

    instance.unmount();
  });

  it('keeps local coordinates aligned through nested borders and padding', async () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();

    function App() {
      const ref = useLayoutRef();
      const [cursor, setCursor] = useState('idle');

      useLocalMouse(
        () => ({
          x: ref.x(),
          y: ref.y(),
          width: ref.width(),
          height: ref.height(),
        }),
        (event) => {
          if (event.action === 'click' && event.button === 'left') {
            setCursor(`${event.x},${event.y}`);
          }
        },
        { onlyInside: true },
      );

      return Box(
        { flexDirection: 'column', padding: 1, gap: 1 },
        Text({}, 'header'),
        Box(
          { borderStyle: 'single', padding: 1 },
          Box({ width: 4, height: 2, layoutRef: ref }, Text({}, 'ABCD'), Text({}, 'EFGH')),
        ),
        Text({}, `cursor:${cursor()}`),
      );
    }

    const instance = render(() => App(), {
      stdin,
      stdout,
      maxFps: 0,
      showHardwareCursor: false,
      useDeltaRenderer: false,
      screen: 'fullscreen',
    });

    await wait(50);
    stdin.emit('data', Buffer.from(generateSGRMouseSequence(4, 6, 'left', 'click')));

    await waitForOutput(stdout, 'cursor:1,1');

    instance.unmount();
  });
});
