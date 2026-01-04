/**
 * Mouse tracking output tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Writable } from 'node:stream';
import { enableMouseTracking, disableMouseTracking, resetMouseState } from '../../src/hooks/use-mouse.js';
import { setAppContext } from '../../src/hooks/context.js';

function createMockStdout(isTTY: boolean): Writable & { isTTY: boolean; output: string } {
  let output = '';
  const stream = new Writable({
    write(chunk, _encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });
  (stream as any).isTTY = isTTY;
  Object.defineProperty(stream, 'output', {
    get: () => output,
    set: (value: string) => {
      output = value;
    },
  });
  return stream as any;
}

describe('mouse tracking output', () => {
  beforeEach(() => {
    resetMouseState();
    setAppContext(null);
  });

  afterEach(() => {
    resetMouseState();
    setAppContext(null);
  });

  it('writes enable/disable sequences to app stdout', () => {
    const stream = createMockStdout(true);
    setAppContext({ stdout: stream } as any);

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true as any);

    enableMouseTracking();
    disableMouseTracking();

    expect(stream.output).toContain('\x1b[?1000h');
    expect(stream.output).toContain('\x1b[?1006h');
    expect(stream.output).toContain('\x1b[?1000l');
    expect(stream.output).toContain('\x1b[?1006l');
    expect(stdoutSpy).not.toHaveBeenCalled();

    stdoutSpy.mockRestore();
  });

  it('does not write to non-TTY stdout', () => {
    const stream = createMockStdout(false);
    setAppContext({ stdout: stream } as any);

    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true as any);

    enableMouseTracking();
    disableMouseTracking();

    expect(stream.output).toBe('');
    expect(stdoutSpy).not.toHaveBeenCalled();

    stdoutSpy.mockRestore();
  });
});
