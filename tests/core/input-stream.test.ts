import { describe, expect, it } from 'vitest';

import {
  createTerminalInputStream,
  type TerminalInputStreamEvent,
} from '../../src/core/input-stream.js';
import { PASTE_END, PASTE_START } from '../../src/core/input.js';

function collect(
  chunks: Array<Buffer | string>,
  options: ConstructorParameters<
    typeof import('../../src/core/input-stream.js').TerminalInputStream
  >[0] = {},
): TerminalInputStreamEvent[] {
  const stream = createTerminalInputStream(options);
  const events = chunks.flatMap((chunk) => stream.push(chunk));
  events.push(...stream.flushPendingInput());
  return events;
}

function chunkBuffer(buffer: Buffer, seed: number): Buffer[] {
  const chunks: Buffer[] = [];
  let offset = 0;
  let state = seed >>> 0;
  while (offset < buffer.length) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const size = 1 + (state % 7);
    chunks.push(buffer.subarray(offset, Math.min(buffer.length, offset + size)));
    offset += size;
  }
  return chunks;
}

function normalizeInputEvents(
  events: TerminalInputStreamEvent[],
): TerminalInputStreamEvent[] {
  const normalized: TerminalInputStreamEvent[] = [];
  for (const event of events) {
    const previous = normalized.at(-1);
    if (event.type === 'input' && previous?.type === 'input') {
      previous.input += event.input;
    } else {
      normalized.push({ ...event });
    }
  }
  return normalized;
}

describe('TerminalInputStream', () => {
  it('decodes UTF-8 identically at every byte boundary', () => {
    const value = 'A你中文かなカナ한글🙂e\u0301👨‍👩‍👧‍👦Z';
    const bytes = Buffer.from(value);
    const expected = [{ type: 'input', input: value }];

    for (let split = 0; split <= bytes.length; split++) {
      expect(normalizeInputEvents(collect([
        bytes.subarray(0, split),
        bytes.subarray(split),
      ]))).toEqual(expected);
    }
  });

  it('frames bracketed paste identically across arbitrary chunking', () => {
    const value = `x${PASTE_START}hé🙂${PASTE_END}y`;
    const bytes = Buffer.from(value);
    const expected: TerminalInputStreamEvent[] = [
      { type: 'input', input: 'x' },
      { type: 'paste', text: 'hé🙂', bracketed: true },
      { type: 'input', input: 'y' },
    ];

    expect(collect([bytes])).toEqual(expected);
    for (let seed = 1; seed <= 100; seed++) {
      expect(normalizeInputEvents(collect(chunkBuffer(bytes, seed)))).toEqual(
        normalizeInputEvents(expected),
      );
    }
  });

  it('retains incomplete CSI, SS3, OSC, and DCS until completed', () => {
    const fixtures = [
      '\x1b[A',
      '\x1bOP',
      '\x1b]0;title\x07',
      '\x1bPpayload\x1b\\',
    ];

    for (const fixture of fixtures) {
      const bytes = Buffer.from(fixture);
      for (let split = 1; split < bytes.length; split++) {
        const stream = createTerminalInputStream();
        expect(stream.push(bytes.subarray(0, split))).toEqual([]);
        expect(stream.status.pendingEscapeBytes).toBeGreaterThan(0);
        expect(stream.push(bytes.subarray(split))).toEqual([
          { type: 'input', input: fixture },
        ]);
        expect(stream.status.pendingEscapeBytes).toBe(0);
      }
    }
  });

  it('flushes an ambiguous escape key only when requested by the host', () => {
    const stream = createTerminalInputStream();

    expect(stream.push('\x1b')).toEqual([]);
    expect(stream.status.pendingEscapeBytes).toBe(1);
    expect(stream.flushPendingInput()).toEqual([
      { type: 'input', input: '\x1b' },
    ]);
    expect(stream.status.pendingEscapeBytes).toBe(0);
  });

  it('caps retained escape data instead of buffering an unbounded sequence', () => {
    const stream = createTerminalInputStream({
      maxPendingEscapeBytes: 4,
    });
    const malicious = '\x1b]abcdef';

    expect(stream.push(malicious)).toEqual([
      { type: 'input', input: malicious },
    ]);
    expect(stream.status.pendingEscapeBytes).toBe(0);
  });

  it('drops an overflowing bracketed paste and resumes after its terminator', () => {
    const stream = createTerminalInputStream({
      maxPasteBytes: 8,
    });

    expect(stream.push(`${PASTE_START}ééé`)).toEqual([]);
    expect(stream.status).toMatchObject({
      pasteActive: true,
      pasteBytes: 6,
      pasteOverflowed: false,
    });
    expect(stream.push(`éé${PASTE_END}z`)).toEqual([
      { type: 'input', input: 'z' },
    ]);
    expect(stream.status).toMatchObject({
      pasteActive: false,
      pasteBytes: 0,
      pasteOverflowed: false,
    });
  });

  it('lets the host abort an unterminated paste without leaking its content', () => {
    const stream = createTerminalInputStream();

    expect(stream.push(`${PASTE_START}secret\x1b[20`)).toEqual([]);
    expect(stream.status.pasteActive).toBe(true);
    expect(stream.status.pendingEscapeBytes).toBeGreaterThan(0);
    stream.abortPaste();
    expect(stream.status.pasteActive).toBe(false);
    expect(stream.status.pendingEscapeBytes).toBe(0);
    expect(stream.flushPendingInput()).toEqual([]);
    expect(stream.push('x')).toEqual([
      { type: 'input', input: 'x' },
    ]);
  });

  it('classifies bounded plain-text bursts as unbracketed paste', () => {
    const text = 'a'.repeat(33);

    expect(collect([text])).toEqual([
      { type: 'paste', text, bracketed: false },
    ]);
    expect(
      collect([text], {
        maxPasteBytes: 10,
      }),
    ).toEqual([]);
  });

  it('is chunk-equivalent for mixed focus, mouse, Kitty, paste, and text data', () => {
    const corpus =
      '\x1b[I' +
      '\x1b[<0;12;4M' +
      '\x1b[97;5u' +
      '\x1b[27;5;97~' +
      PASTE_START +
      'line 1\n中文 日本語 한국어 🙂 line 2' +
      PASTE_END +
      '\x1b[O' +
      'done';
    const bytes = Buffer.from(corpus);
    const expected = collect([bytes]);

    for (let seed = 1; seed <= 250; seed++) {
      expect(normalizeInputEvents(collect(chunkBuffer(bytes, seed)))).toEqual(
        normalizeInputEvents(expected),
      );
    }
  });

  it('validates limits and becomes inert after disposal', () => {
    expect(() =>
      createTerminalInputStream({ maxPasteBytes: 0 }),
    ).toThrow(/maxPasteBytes/);
    expect(() =>
      createTerminalInputStream({ maxPendingEscapeBytes: Number.NaN }),
    ).toThrow(/maxPendingEscapeBytes/);
    expect(() =>
      createTerminalInputStream({ pasteHeuristicThreshold: -1 }),
    ).toThrow(/pasteHeuristicThreshold/);

    const stream = createTerminalInputStream();
    stream.push('\x1b');
    stream.dispose();
    expect(stream.push('x')).toEqual([]);
    expect(stream.flushPendingInput()).toEqual([]);
  });
});
