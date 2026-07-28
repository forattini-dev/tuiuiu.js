import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import {
  createTerminalSession,
  type TerminalSessionOptions,
} from '../../src/core/terminal-session.js';

function createStreams(options: {
  initialRaw?: boolean;
  paused?: boolean;
} = {}): TerminalSessionOptions & {
  rawChanges: boolean[];
  writes: string[];
  pause: ReturnType<typeof vi.fn>;
  resume: ReturnType<typeof vi.fn>;
} {
  const inputEmitter = new EventEmitter();
  const outputEmitter = new EventEmitter();
  const rawChanges: boolean[] = [];
  const writes: string[] = [];
  const pause = vi.fn();
  const resume = vi.fn();

  const stdin = Object.assign(inputEmitter, {
    isTTY: true,
    isRaw: options.initialRaw ?? false,
    isPaused: () => options.paused ?? false,
    setRawMode(value: boolean) {
      rawChanges.push(value);
      this.isRaw = value;
    },
    pause,
    resume,
  }) as unknown as NodeJS.ReadStream;
  const stdout = Object.assign(outputEmitter, {
    isTTY: true,
    columns: 80,
    rows: 24,
    write(value: string) {
      writes.push(value);
      return true;
    },
  }) as unknown as NodeJS.WriteStream;

  return {
    stdin,
    stdout,
    focusEvents: true,
    bracketedPaste: true,
    rawChanges,
    writes,
    pause,
    resume,
  };
}

describe('TerminalSession', () => {
  it('symmetrically enables and restores terminal-owned modes', () => {
    const streams = createStreams({ paused: true });
    const session = createTerminalSession(streams);

    session.start();

    expect(streams.rawChanges).toEqual([true]);
    expect(streams.resume).toHaveBeenCalledTimes(1);
    expect(streams.writes).toContain('\x1b[?1004h');
    expect(streams.writes).toContain('\x1b[?2004h');
    expect(session.rawModeEnabledCount).toBe(1);

    session.dispose();

    expect(streams.rawChanges.at(-1)).toBe(false);
    expect(streams.pause).toHaveBeenCalledTimes(1);
    expect(streams.writes).toContain('\x1b[?1004l');
    expect(streams.writes).toContain('\x1b[?2004l');
    expect(session.rawModeEnabledCount).toBe(0);
  });

  it('preserves host raw mode and reference-counts leases', () => {
    const streams = createStreams({ initialRaw: true });
    const session = createTerminalSession(streams);

    session.start();
    session.setRawMode(true);
    session.setRawMode(false);

    expect(session.rawModeEnabledCount).toBe(1);
    expect(streams.rawChanges).toEqual([]);

    session.dispose();
    expect(streams.rawChanges).toEqual([true]);
  });

  it('is idempotent and cannot be restarted after disposal', () => {
    const streams = createStreams();
    const session = createTerminalSession(streams);

    session.start();
    session.start();
    session.dispose();
    session.dispose();

    expect(streams.resume).toHaveBeenCalledTimes(1);
    expect(streams.rawChanges).toEqual([true, false]);
    expect(() => session.start()).toThrow('Cannot restart');
  });

  it('does not mutate terminal state when disposed before start', () => {
    const streams = createStreams({ paused: true });
    const session = createTerminalSession(streams);

    session.dispose();

    expect(streams.rawChanges).toEqual([]);
    expect(streams.writes).toEqual([]);
    expect(streams.pause).not.toHaveBeenCalled();
    expect(streams.resume).not.toHaveBeenCalled();
  });

  it('keeps the raw lease count valid under generated action sequences', () => {
    let seed = 0x73657373;
    const random = () => {
      seed = (Math.imul(seed, 1103515245) + 12345) >>> 0;
      return seed;
    };

    for (let sample = 0; sample < 200; sample++) {
      const streams = createStreams({ initialRaw: sample % 2 === 0 });
      const session = createTerminalSession(streams);
      session.start();

      for (let action = 0; action < 100; action++) {
        session.setRawMode((random() & 1) === 1);
        expect(session.rawModeEnabledCount).toBeGreaterThanOrEqual(0);
      }

      session.dispose();
      expect(session.rawModeEnabledCount).toBe(0);
      expect((streams.stdin as NodeJS.ReadStream & { isRaw: boolean }).isRaw)
        .toBe(sample % 2 === 0);
    }
  });
});
