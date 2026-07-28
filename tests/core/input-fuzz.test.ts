import { describe, expect, it } from 'vitest';
import {
  applyInputAction,
  createInputState,
  parseInput,
  parseKittyKeyEvent,
  parseMouseEvent,
} from '../../src/core/input.js';
import { parseKeypress } from '../../src/core/hotkeys.js';
import {
  clampToGraphemeBoundary,
  nextGraphemeBoundary,
  previousGraphemeBoundary,
  segmentGraphemes,
} from '../../src/utils/grapheme.js';

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

describe('terminal input fuzz contracts', () => {
  it('never throws for deterministic arbitrary UTF-16 and byte input', () => {
    const random = createRandom(0x74756975);

    for (let sample = 0; sample < 1_000; sample++) {
      const length = random() % 96;
      let input = '';
      for (let index = 0; index < length; index++) {
        input += String.fromCharCode(random() & 0xffff);
      }
      const bytes = Buffer.from(
        Array.from({ length: random() % 96 }, () => random() & 0xff),
      );

      expect(() => parseInput(input)).not.toThrow();
      expect(() => parseKeypress(input)).not.toThrow();
      expect(() => parseMouseEvent(input)).not.toThrow();
      expect(() => parseKittyKeyEvent(input)).not.toThrow();
      expect(() => parseInput(bytes)).not.toThrow();
      expect(() => parseKeypress(bytes)).not.toThrow();
    }
  });

  it('rejects unsafe Kitty code points and integers instead of throwing', () => {
    const malformed = [
      '\x1b[97;1;1114112u',
      '\x1b[97;1;55296u',
      '\x1b[999999999999999999999999999999u',
      '\x1b[97;1;:u',
      '\x1b[97;0u',
    ];

    for (const sequence of malformed) {
      expect(() => parseKittyKeyEvent(sequence)).not.toThrow();
      expect(parseKittyKeyEvent(sequence)).toBeNull();
    }
  });

  it('bounds recursive parsing of adversarial batched focus events', () => {
    const input = '\x1b[I'.repeat(10_000);
    expect(() => parseInput(input)).not.toThrow();
    expect(parseInput(input).focus).toEqual({ focused: true });
  });
});

describe('Unicode editing property contracts', () => {
  it('keeps segmentation, movement and deletion on grapheme boundaries', () => {
    const random = createRandom(0x67726170);
    const atoms = [
      'a',
      ' ',
      'é',
      'e\u0301',
      '中',
      '😀',
      '👩🏽‍💻',
      '🇧🇷',
      'क',
      '\r\n',
      '\ud800',
      '\udfff',
    ];

    for (let sample = 0; sample < 300; sample++) {
      const atomCount = random() % 30;
      let value = '';
      for (let index = 0; index < atomCount; index++) {
        value += atoms[random() % atoms.length]!;
      }

      const segments = segmentGraphemes(value);
      expect(segments.map((segment) => segment.segment).join('')).toBe(value);

      let expectedIndex = 0;
      for (const segment of segments) {
        expect(segment.index).toBe(expectedIndex);
        expect(segment.end).toBeGreaterThan(segment.index);
        expectedIndex = segment.end;
      }
      expect(expectedIndex).toBe(value.length);

      for (let position = 0; position <= value.length; position++) {
        const previous = previousGraphemeBoundary(value, position);
        const next = nextGraphemeBoundary(value, position);
        const nearest = clampToGraphemeBoundary(value, position);
        expect(previous).toBeGreaterThanOrEqual(0);
        expect(previous).toBeLessThanOrEqual(position);
        expect(next).toBeGreaterThanOrEqual(position);
        expect(next).toBeLessThanOrEqual(value.length);
        expect(
          segments.some((segment) =>
            segment.index === nearest || segment.end === nearest
          ) || nearest === 0,
        ).toBe(true);
      }

      let editState = createInputState(value);
      for (let remaining = segments.length; remaining > 0; remaining--) {
        editState = applyInputAction(editState, {
          type: 'delete',
          direction: 'backward',
        });
        expect(editState.buffer).toBe(
          segments.slice(0, remaining - 1).map((segment) => segment.segment).join(''),
        );
        expect(editState.cursor).toBe(editState.buffer.length);
      }
    }
  });
});
