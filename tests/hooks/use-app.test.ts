/**
 * Tests for useApp hook
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useApp, initializeApp, cleanupApp } from '../../src/hooks/use-app.js';
import {
  getAppContext,
  setAppContext,
  resetHookState,
  clearInputHandlers,
  getInputHandlerCount,
  addInputHandler,
} from '../../src/hooks/context.js';
import { EventEmitter } from 'node:events';
import { Writable, Readable } from 'node:stream';

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
  (stream as any).output = output;
  return stream as unknown as NodeJS.WriteStream;
}

describe('useApp', () => {
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

  it('throws when called outside app', () => {
    expect(() => useApp()).toThrow('useApp must be called within a Reck app');
  });

  it('returns app context when within app', () => {
    const mockContext = {
      exit: vi.fn(),
      stdin: {} as any,
      stdout: {} as any,
      onExit: vi.fn(),
    };
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
    clearInputHandlers();
    setAppContext(null);
    stdin = createMockStdin();
    stdout = createMockStdout();
    mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    cleanupApp();
    mockExit.mockRestore();
  });

  it('returns app context', () => {
    const ctx = initializeApp(stdin, stdout);
    expect(ctx).toHaveProperty('exit');
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

  describe('input handling', () => {
    it('calls input handlers on keypress', () => {
      initializeApp(stdin, stdout);

      const handler = vi.fn();
      addInputHandler(handler);

      // Simulate keypress
      stdin.emit('data', Buffer.from('a'));

      expect(handler).toHaveBeenCalled();
    });

    it('exits on Ctrl+C', () => {
      const ctx = initializeApp(stdin, stdout);

      // Simulate Ctrl+C (0x03)
      stdin.emit('data', Buffer.from([0x03]));

      expect(mockExit).toHaveBeenCalledWith(0);
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

    it('exits with code 0 by default', () => {
      const ctx = initializeApp(stdin, stdout);
      ctx.exit();

      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('exits with code 1 on error', () => {
      const ctx = initializeApp(stdin, stdout);
      const error = new Error('Test error');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      ctx.exit(error);
      consoleSpy.mockRestore();

      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('only exits once', () => {
      const ctx = initializeApp(stdin, stdout);
      ctx.exit();
      ctx.exit();

      expect(mockExit).toHaveBeenCalledTimes(1);
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
    addInputHandler(vi.fn());
    expect(getInputHandlerCount()).toBeGreaterThan(0);

    cleanupApp();

    expect(getInputHandlerCount()).toBe(0);
  });

  it('clears app context', () => {
    setAppContext({
      exit: vi.fn(),
      stdin: {} as any,
      stdout: {} as any,
      onExit: vi.fn(),
    });

    cleanupApp();

    expect(getAppContext()).toBeNull();
  });
});
