import { describe, expect, it } from 'vitest';
import { CellBuffer, bufferToAnsi, createCell } from '../../src/core/buffer.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { renderFrameToString } from '../../src/core/renderer.js';
import { readTerminalSequence } from '../../src/utils/terminal-sanitize.js';
import { stringWidth } from '../../src/utils/text-utils.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import type { VNode } from '../../src/utils/types.js';

function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

describe('cell buffer generated-operation contracts', () => {
  it('never retains orphaned wide-glyph cells', () => {
    const random = createRandom(0x63656c6c);
    const glyphs = [' ', 'a', '中', '😀', '👩🏽‍💻', 'e\u0301'];

    for (let sample = 0; sample < 25; sample++) {
      const buffer = new CellBuffer(20, 6);

      for (let operation = 0; operation < 100; operation++) {
        const x = random() % buffer.width;
        const y = random() % buffer.height;
        const glyph = glyphs[random() % glyphs.length]!;

        switch (random() % 3) {
          case 0:
            buffer.writeChar(x, y, glyph);
            break;
          case 1:
            buffer.set(x, y, createCell(glyph));
            break;
          default:
            buffer.fill(x, y, (random() % 6) + 1, 1, createCell(glyph));
            break;
        }

        for (const { x: cellX, y: cellY, cell } of buffer) {
          if (cell.isWide) {
            const head = buffer.get(cellX - 1, cellY);
            expect(head).toBeDefined();
            expect(head?.isWide).not.toBe(true);
            expect(stringWidth(head?.char ?? '')).toBeGreaterThan(1);
            continue;
          }

          const width = stringWidth(cell.char);
          if (width > 1) {
            expect(cellX + width).toBeLessThanOrEqual(buffer.width);
            for (let offset = 1; offset < width; offset++) {
              expect(buffer.get(cellX + offset, cellY)?.isWide).toBe(true);
            }
          }
        }
      }
    }
  });
});

describe('renderer generated-frame contracts', () => {
  it('rasterizes arbitrary trees without leaking non-SGR terminal protocols', () => {
    const random = createRandom(0x72656e64);
    const texts = [
      'plain',
      '中 😀 e\u0301',
      '👩🏽‍💻 🇧🇷',
      '\x1b[31mred\x1b[0m',
      'A\x1b[2JB',
      'A\x1b]2;owned\x07B',
      'A\x1bPpayload\x1b\\B',
      '\ud800 lone surrogate',
    ];
    const colors = [undefined, 'red', 'primary', '#12abef'] as const;

    const makeNode = (depth: number): VNode => {
      if (depth <= 0 || (random() & 1) === 0) {
        return Text(
          {
            color: colors[random() % colors.length],
            bold: (random() & 3) === 0,
            underline: (random() & 7) === 0,
            wrap: ['wrap', 'truncate', 'truncate-start', 'truncate-middle'][
              random() % 4
            ] as 'wrap' | 'truncate' | 'truncate-start' | 'truncate-middle',
          },
          texts[random() % texts.length]!,
        );
      }

      return Box(
        {
          flexDirection: (random() & 1) === 0 ? 'column' : 'row',
          width: (random() % 24) + 4,
          borderStyle: (random() & 1) === 0 ? 'single' : undefined,
          padding: random() % 2,
        },
        ...Array.from({ length: (random() % 3) + 1 }, () => makeNode(depth - 1)),
      );
    };

    for (let sample = 0; sample < 100; sample++) {
      const width = (random() % 76) + 5;
      const frame = createFrameSnapshot(makeNode(3), { width, height: 80 });
      const output = renderFrameToString(frame);

      for (const line of output.split('\n')) {
        expect(stringWidth(line)).toBeLessThanOrEqual(width);
      }

      let index = 0;
      while (index < output.length) {
        if (output[index] !== '\x1b') {
          index++;
          continue;
        }

        const sequence = readTerminalSequence(output, index);
        expect(sequence).not.toBeNull();
        expect(sequence?.kind).toBe('sgr');
        index = sequence?.end ?? index + 1;
      }
    }
  });

  it('preserves explicit full-height serialization in the canonical buffer', () => {
    const buffer = new CellBuffer(4, 3);
    buffer.writeString(0, 0, 'A');

    expect(bufferToAnsi(buffer)).toBe('A');
    expect(bufferToAnsi(buffer, true)).toBe('A\n\n');
  });
});
