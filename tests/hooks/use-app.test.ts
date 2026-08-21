/**
 * Tests for useApp hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useApp, initializeApp, cleanupApp } from '../../src/hooks/use-app.js';
import { useTerminalFocus } from '../../src/hooks/use-terminal-focus.js';
import {
  getAppContext, setAppContext, resetHookState } from '../../src/hooks/context.js';
import { resetTestInteractions, getTestInteractionHandlerCount, registerTestKeyHandler, registerTestPasteHandler } from '../../src/testing/interaction.js';
import { configureProgressive, resetProgressive } from '../../src/core/progressive.js';
import { EventEmitter } from 'node:events';
import { Writable, Readable } from 'node:stream';
import type { AppContext } from '../../src/hooks/types.js';

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
function createMockStdout(): NodeJS.WriteStream {
  let output = '';
  const stream = new Writable({
    write(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });
  Object.assign(stream, {
    isTTY: true,
    getOutput: () => output,
    clearOutput: () => {
      output = '';
    },
  });
  return stream as unknown as NodeJS.WriteStream;
}

function createMockAppContext(): AppContext {
  return {
    exit: vi.fn(),
    dispose: vi.fn(),
    stdin: {} as NodeJS.ReadStream,
    stdout: {} as NodeJS.WriteStream,
    onExit: vi.fn(() => vi.fn()),
    autoTabNavigation: true,
    setAutoTabNavigation: vi.fn(),
    setRawMode: vi.fn(),
    rawModeEnabledCount: 0,
    isRawModeEnabled: vi.fn(() => false),
    writeLine: vi.fn(),
  };
}

describe('useApp', () => {
  beforeEach(() => {
    resetHookState();
    resetTestInteractions();
    setAppContext(null);
    resetProgressive();
  });

  afterEach(() => {
    cleanupApp();
    resetHookState();
    resetTestInteractions();
  });

  it('throws when called outside app', () => {
    expect(() => useApp()).toThrow('useApp must be called within a Tuiuiu app');
  });

  it('returns app context when within app', () => {
    const mockContext = createMockAppContext();
    setAppContext(mockContext);

    const app = useApp();
    expect(app).toBe(mockContext);
  });
});

describe('initializeApp', () => {
  let stdin: NodeJS.ReadStream;
  let stdout: NodeJS.WriteStream;
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    resetHookState();
    resetTestInteractions();
    setAppContext(null);
    resetProgressive();
    stdin = createMockStdin();
    stdout = createMockStdout();
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    cleanupApp();
    resetProgressive();
    mockExit.mockRestore();
  });

  it('returns app context', () => {
    const ctx = initializeApp(stdin, stdout);
    expect(ctx).toHaveProperty('exit');
    expect(ctx).toHaveProperty('dispose');
    expect(ctx).toHaveProperty('stdin');
    expect(ctx).toHaveProperty('stdout');
    expect(ctx).toHaveProperty('onExit');
  });

  it('sets up raw mode on TTY stdin', () => {
    initializeApp(stdin, stdout);
    expect(stdin.setRawMode).toHaveBeenCalledWith(true);
  });

  it('resumes stdin', () => {
    initializeApp(stdin, stdout);
    expect(stdin.resume).toHaveBeenCalled();
  });

  it('sets app context globally', () => {
    initializeApp(stdin, stdout);
    expect(getAppContext()).not.toBeNull();
  });

  it('allows simultaneous apps on distinct terminal streams', () => {
    const first = initializeApp(stdin, stdout);
    const second = initializeApp(createMockStdin(), createMockStdout());

    expect(first).not.toBe(second);
    first.dispose();
    second.dispose();
  });

  it('rejects simultaneous apps that share either terminal stream', () => {
    const first = initializeApp(stdin, stdout);

    expect(() => initializeApp(stdin, createMockStdout())).toThrow(
      /cannot be shared/u,
    );
    expect(() => initializeApp(createMockStdin(), stdout)).toThrow(
      /cannot be shared/u,
    );

    first.dispose();
  });

  it('allows a new app after direct disposal', () => {
    const first = initializeApp(stdin, stdout);
    first.dispose();

    expect(getAppContext()).toBeNull();
    expect(() => initializeApp(createMockStdin(), createMockStdout())).not.toThrow();
  });

  it('restores host-owned raw and paused input state', () => {
    (stdin as NodeJS.ReadStream & { isRaw: boolean }).isRaw = true;
    (stdin as NodeJS.ReadStream & { isPaused: () => boolean }).isPaused = () => true;

    const ctx = initializeApp(stdin, stdout);
    expect(stdin.setRawMode).not.toHaveBeenCalledWith(true);

    ctx.dispose();

    expect(stdin.setRawMode).toHaveBeenLastCalledWith(true);
    expect(stdin.pause).toHaveBeenCalled();
  });

  it.each([
    [{ maxPasteBytes: 0 }, /maxPasteBytes/u],
    [{ maxPasteBytes: Number.MAX_SAFE_INTEGER + 1 }, /maxPasteBytes/u],
    [{ maxPendingEscapeBytes: 0 }, /maxPendingEscapeBytes/u],
    [{ escapeSequenceTimeoutMs: -1 }, /escapeSequenceTimeoutMs/u],
    [{ pasteTimeoutMs: Number.POSITIVE_INFINITY }, /pasteTimeoutMs/u],
  ])('rejects invalid bounded-input options %#', (invalidOptions, message) => {
    expect(() => initializeApp(stdin, stdout, invalidOptions)).toThrow(message);
  });

  describe('input handling', () => {
    it('calls input handlers on keypress', () => {
      const ctx = initializeApp(stdin, stdout);

      const handler = vi.fn();
      registerTestKeyHandler(handler, { app: ctx });

      // Simulate keypress
      stdin.emit('data', Buffer.from('a'));

      expect(handler).toHaveBeenCalled();
    });

    it('exits on Ctrl+C', () => {
      const ctx = initializeApp(stdin, stdout);
      const callback = vi.fn();
      ctx.onExit(callback);

      // Simulate Ctrl+C (0x03)
      stdin.emit('data', Buffer.from([0x03]));

      expect(callback).toHaveBeenCalledWith(undefined);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('can pass Ctrl+C through when exitOnCtrlC is disabled', () => {
      const ctx = initializeApp(stdin, stdout, { exitOnCtrlC: false });
      const handler = vi.fn();
      registerTestKeyHandler(handler, { app: ctx });

      stdin.emit('data', Buffer.from([0x03]));

      expect(handler).toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('dispatches Kitty CSI-u modifiers through the real app path', () => {
      const ctx = initializeApp(stdin, stdout, { exitOnCtrlC: false });
      const handler = vi.fn();
      registerTestKeyHandler(handler, { app: ctx });

      stdin.emit('data', Buffer.from('\x1b[97;6u'));

      expect(handler).toHaveBeenCalledWith(
        'a',
        expect.objectContaining({
          ctrl: true,
          shift: true,
          eventType: 'press',
        }),
        expect.any(Object),
      );
    });

    it('recognizes Ctrl+C reported through Kitty CSI-u', () => {
      const ctx = initializeApp(stdin, stdout);
      const callback = vi.fn();
      ctx.onExit(callback);

      stdin.emit('data', Buffer.from('\x1b[99;5u'));

      expect(callback).toHaveBeenCalledWith(undefined);
      expect(mockExit).not.toHaveBeenCalled();
    });

    it('decodes a UTF-8 character split across stream chunks', () => {
      const ctx = initializeApp(stdin, stdout);
      const handler = vi.fn();
      registerTestKeyHandler(handler, { app: ctx });
      const emoji = Buffer.from('😀');

      stdin.emit('data', emoji.subarray(0, 2));
      stdin.emit('data', emoji.subarray(2));

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0]).toBe('😀');
    });

    it('recognizes bracketed paste across every byte split', () => {
      const payload = 'linha 😀\nsegunda linha';
      const packet = Buffer.from(`\x1b[200~${payload}\x1b[201~`);

      for (let split = 0; split <= packet.length; split++) {
        const activeStdin = createMockStdin();
        const activeStdout = createMockStdout();
        const ctx = initializeApp(activeStdin, activeStdout);
        const handler = vi.fn();
        registerTestPasteHandler(handler, { app: ctx });

        activeStdin.emit('data', packet.subarray(0, split));
        activeStdin.emit('data', packet.subarray(split));

        expect(handler, `split at byte ${split}`).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0]?.[0]).toEqual(
          expect.objectContaining({ text: payload, isBracketed: true }),
        );
        ctx.dispose();
      }
    });

    it('parses a terminal sequence split across stream chunks', () => {
      configureProgressive({ overrides: { focusEvents: true } });
      initializeApp(stdin, stdout);

      stdin.emit('data', Buffer.from('\x1b['));
      expect(useTerminalFocus().focused).toBe(true);
      stdin.emit('data', Buffer.from('O'));

      expect(useTerminalFocus().focused).toBe(false);
    });

    it('flushes an ambiguous Escape key after its configured deadline', () => {
      vi.useFakeTimers();
      try {
        const ctx = initializeApp(stdin, stdout, {
          escapeSequenceTimeoutMs: 5,
        });
        const handler = vi.fn();
        registerTestKeyHandler(handler, { app: ctx });

        stdin.emit('data', Buffer.from('\x1b'));
        expect(handler).not.toHaveBeenCalled();
        vi.advanceTimersByTime(5);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler.mock.calls[0]?.[1]).toEqual(
          expect.objectContaining({ escape: true }),
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it('drops an unterminated paste after its configured deadline', () => {
      vi.useFakeTimers();
      try {
        const ctx = initializeApp(stdin, stdout, {
          pasteTimeoutMs: 5,
        });
        const pasteHandler = vi.fn();
        const inputHandler = vi.fn();
        registerTestPasteHandler(pasteHandler, { app: ctx });
        registerTestKeyHandler(inputHandler, { app: ctx });

        stdin.emit('data', Buffer.from('\x1b[200~secret'));
        vi.advanceTimersByTime(5);
        stdin.emit('data', Buffer.from('x'));

        expect(pasteHandler).not.toHaveBeenCalled();
        expect(inputHandler).toHaveBeenCalledWith(
          'x',
          expect.any(Object),
          expect.any(Object),
        );
      } finally {
        vi.useRealTimers();
      }
    });

    it('does not retain escape sequences beyond maxPendingEscapeBytes', () => {
      const ctx = initializeApp(stdin, stdout, {
        maxPendingEscapeBytes: 4,
        escapeSequenceTimeoutMs: 60_000,
      });
      const handler = vi.fn();
      registerTestKeyHandler(handler, { app: ctx });

      stdin.emit('data', Buffer.from('\x1b]abcdef'));

      expect(handler).toHaveBeenCalled();
    });

    it('drops bracketed pastes larger than maxPasteBytes', () => {
      const ctx = initializeApp(stdin, stdout, { maxPasteBytes: 4 });
      const handler = vi.fn();
      registerTestPasteHandler(handler, { app: ctx });

      stdin.emit('data', Buffer.from('\x1b[200~123'));
      stdin.emit('data', Buffer.from('45\x1b[201~'));

      expect(handler).not.toHaveBeenCalled();
    });

    it('applies automatic Tab handling before a bracketed paste marker', () => {
      const ctx = initializeApp(stdin, stdout);
      const inputHandler = vi.fn();
      const pasteHandler = vi.fn();
      registerTestKeyHandler(inputHandler, { app: ctx });
      registerTestPasteHandler(pasteHandler, { app: ctx });

      stdin.emit('data', Buffer.from('\t\x1b[200~hello\x1b[201~'));

      expect(inputHandler).not.toHaveBeenCalled();
      expect(pasteHandler).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'hello', isBracketed: true }),
      );
    });

    it('tracks terminal focus reactively when supported', () => {
      configureProgressive({ overrides: { focusEvents: true } });
      initializeApp(stdin, stdout);

      expect(useTerminalFocus().focused).toBe(true);

      stdin.emit('data', Buffer.from('\x1b[O'));
      expect(useTerminalFocus().focused).toBe(false);

      stdin.emit('data', Buffer.from('\x1b[I'));
      expect(useTerminalFocus().focused).toBe(true);
    });
  });

  describe('exit', () => {
    it('calls exit callbacks', () => {
      const ctx = initializeApp(stdin, stdout);
      const callback = vi.fn();
      ctx.onExit(callback);

      ctx.exit();

      expect(callback).toHaveBeenCalled();
    });

    it('restores raw mode on exit', () => {
      const ctx = initializeApp(stdin, stdout);
      ctx.exit();

      expect(stdin.setRawMode).toHaveBeenCalledWith(false);
    });

    it('enables and disables terminal focus reporting when supported', () => {
      configureProgressive({ overrides: { focusEvents: true } });
      const ctx = initializeApp(stdin, stdout);
      expect((stdout as any).getOutput()).toContain('\x1b[?1004h');

      (stdout as any).clearOutput();
      ctx.exit();
      expect((stdout as any).getOutput()).toContain('\x1b[?1004l');
    });

    it('does not terminate the host process by default', () => {
      const ctx = initializeApp(stdin, stdout);
      ctx.exit();

      expect(mockExit).not.toHaveBeenCalled();
    });

    it('can terminate the process when explicitly configured', () => {
      const ctx = initializeApp(stdin, stdout, { exitProcess: true });
      ctx.exit();

      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('uses code 1 for an error when process exit is enabled', () => {
      const ctx = initializeApp(stdin, stdout, { exitProcess: true });
      const error = new Error('Test error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      ctx.exit(error);
      consoleSpy.mockRestore();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('only exits once', () => {
      const ctx = initializeApp(stdin, stdout, { exitProcess: true });
      ctx.exit();
      ctx.exit();

      expect(mockExit).toHaveBeenCalledTimes(1);
    });

    it('isolates exit callback failures and still notifies later callbacks', () => {
      const ctx = initializeApp(stdin, stdout);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const laterCallback = vi.fn();
      ctx.onExit(() => {
        throw new Error('callback failed');
      });
      ctx.onExit(laterCallback);

      expect(() => ctx.exit()).not.toThrow();
      expect(laterCallback).toHaveBeenCalledWith(undefined);
      expect(consoleSpy).toHaveBeenCalledWith(
        '[tuiuiu] Error in app exit callback:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });

    it('notifies callbacks registered after exit immediately', () => {
      const ctx = initializeApp(stdin, stdout);
      const error = new Error('already exited');
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      ctx.exit(error);
      const callback = vi.fn();

      const unsubscribe = ctx.onExit(callback);

      expect(callback).toHaveBeenCalledWith(error);
      expect(() => unsubscribe()).not.toThrow();
      consoleSpy.mockRestore();
    });
  });

  describe('non-TTY stdin', () => {
    it('handles non-TTY stdin', () => {
      const nonTTYStdin = createMockStdin();
      (nonTTYStdin as any).isTTY = false;

      initializeApp(nonTTYStdin, stdout);

      // setRawMode should not be called for non-TTY
      expect(nonTTYStdin.setRawMode).not.toHaveBeenCalled();
    });
  });
});

describe('cleanupApp', () => {
  it('clears input handlers', () => {
    const stdin = createMockStdin();
    const stdout = createMockStdout();
    const ctx = initializeApp(stdin, stdout);
    registerTestKeyHandler(vi.fn(), { app: ctx });
    expect(getTestInteractionHandlerCount(ctx)).toBeGreaterThan(0);

    cleanupApp(ctx);

    expect(getTestInteractionHandlerCount(ctx)).toBe(0);
  });

  it('clears app context', () => {
    setAppContext(createMockAppContext());

    cleanupApp();

    expect(getAppContext()).toBeNull();
  });
});
