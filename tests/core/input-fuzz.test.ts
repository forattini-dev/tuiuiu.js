import { describe, expect, it } from 'vitest';
import { parseKittyKeyEvent } from '../../src/core/input.js';
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
  it('never throws for deterministic arbitrary UTF-16 input', () => {
    const random = createRandom(0x74756975);

    for (let sample = 0; sample < 1_000; sample++) {
      const length = random() % 96;
      let input = '';
      for (let index = 0; index < length; index++) {
        input += String.fromCharCode(random() & 0xffff);
      }
      expect(() => parseKeypress(input)).not.toThrow();
      expect(() => parseKittyKeyEvent(input)).not.toThrow();
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

    }
  });
});
