import { describe, expect, it } from 'vitest';

import { CellBuffer, createCell } from '../../src/core/buffer.js';

describe('Row-aware diff shortcuts', () => {
  it('invalidates only the mutated row signature', () => {
    const buffer = new CellBuffer(4, 2);

    const initialTop = (buffer as any).getRowSignature(0);
    const initialBottom = (buffer as any).getRowSignature(1);

    buffer.writeChar(1, 0, 'A', 'red');

    const nextTop = (buffer as any).getRowSignature(0);
    const nextBottom = (buffer as any).getRowSignature(1);

    expect(nextTop).not.toBe(initialTop);
    expect(nextBottom).toBe(initialBottom);
  });

  it('deduplicates overlapping rect coverage inside diffRects()', () => {
    const current = new CellBuffer(5, 1);
    const next = new CellBuffer(5, 1);

    next.set(2, 0, createCell('X', 'green'));

    const patches = current.diffRects(next, [
      { x: 1, y: 0, width: 2, height: 1 },
      { x: 2, y: 0, width: 2, height: 1 },
    ]);

    expect(patches).toHaveLength(1);
    expect(patches[0]).toEqual({
      x: 2,
      y: 0,
      cell: { char: 'X', fg: 'green', bg: undefined, attrs: {}, isWide: undefined },
    });
  });

  it('falls back to cell-level diff inside partial row spans', () => {
    const current = new CellBuffer(4, 1);
    const next = new CellBuffer(4, 1);

    current.writeString(0, 0, 'ABCD');
    next.writeString(0, 0, 'ABXD');

    const patches = current.diffRects(next, [{ x: 1, y: 0, width: 2, height: 1 }]);

    expect(patches).toHaveLength(1);
    expect(patches[0]?.x).toBe(2);
    expect(patches[0]?.cell.char).toBe('X');
  });
});
