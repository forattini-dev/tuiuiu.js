/**
 * Tests for the Cell Buffer System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CellBuffer,
  DoubleBuffer,
  BufferPool,
  createCell,
  emptyCell,
  cloneCell,
  cellEquals,
  colorEquals,
  attrsEquals,
  bufferToAnsi,
  patchesToAnsi,
  type Cell,
  type Color,
  type CellAttrs,
} from '../../src/core/buffer.js';

describe('Cell Utilities', () => {
  describe('createCell', () => {
    it('should create a cell with default values', () => {
      const cell = createCell();
      expect(cell.char).toBe(' ');
      expect(cell.fg).toBeUndefined();
      expect(cell.bg).toBeUndefined();
      expect(cell.attrs).toEqual({});
    });

    it('should create a cell with custom values', () => {
      const cell = createCell('A', 'red', 'blue', { bold: true });
      expect(cell.char).toBe('A');
      expect(cell.fg).toBe('red');
      expect(cell.bg).toBe('blue');
      expect(cell.attrs.bold).toBe(true);
    });
  });

  describe('emptyCell', () => {
    it('should create a space cell', () => {
      const cell = emptyCell();
      expect(cell.char).toBe(' ');
      expect(cell.attrs).toEqual({});
    });
  });

  describe('cloneCell', () => {
    it('should create an independent copy', () => {
      const original = createCell('X', 'cyan', undefined, { italic: true });
      const clone = cloneCell(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original);
      expect(clone.attrs).not.toBe(original.attrs);

      // Modifying clone shouldn't affect original
      clone.char = 'Y';
      clone.attrs.bold = true;
      expect(original.char).toBe('X');
      expect(original.attrs.bold).toBeUndefined();
    });
  });

  describe('colorEquals', () => {
    it('should compare string colors', () => {
      expect(colorEquals('red', 'red')).toBe(true);
      expect(colorEquals('red', 'blue')).toBe(false);
      expect(colorEquals('#ff0000', '#ff0000')).toBe(true);
    });

    it('should compare RGB colors', () => {
      expect(colorEquals({ r: 255, g: 0, b: 0 }, { r: 255, g: 0, b: 0 })).toBe(true);
      expect(colorEquals({ r: 255, g: 0, b: 0 }, { r: 0, g: 255, b: 0 })).toBe(false);
    });

    it('should compare ANSI256 colors', () => {
      expect(colorEquals({ ansi256: 196 }, { ansi256: 196 })).toBe(true);
      expect(colorEquals({ ansi256: 196 }, { ansi256: 46 })).toBe(false);
    });

    it('should handle undefined', () => {
      expect(colorEquals(undefined, undefined)).toBe(true);
      expect(colorEquals('red', undefined)).toBe(false);
      expect(colorEquals(undefined, 'red')).toBe(false);
    });

    it('should compare different types as not equal', () => {
      expect(colorEquals('red', { r: 255, g: 0, b: 0 })).toBe(false);
    });
  });

  describe('attrsEquals', () => {
    it('should compare empty attrs', () => {
      expect(attrsEquals({}, {})).toBe(true);
    });

    it('should compare matching attrs', () => {
      expect(attrsEquals({ bold: true, italic: true }, { bold: true, italic: true })).toBe(true);
    });

    it('should detect differences', () => {
      expect(attrsEquals({ bold: true }, { bold: false })).toBe(false);
      expect(attrsEquals({ bold: true }, {})).toBe(false);
    });

    it('should treat undefined and false as equal', () => {
      expect(attrsEquals({ bold: undefined }, { bold: false })).toBe(true);
    });
  });

  describe('cellEquals', () => {
    it('should compare identical cells', () => {
      const cell1 = createCell('A', 'red', 'blue', { bold: true });
      const cell2 = createCell('A', 'red', 'blue', { bold: true });
      expect(cellEquals(cell1, cell2)).toBe(true);
    });

    it('should detect char differences', () => {
      const cell1 = createCell('A');
      const cell2 = createCell('B');
      expect(cellEquals(cell1, cell2)).toBe(false);
    });

    it('should detect color differences', () => {
      const cell1 = createCell('A', 'red');
      const cell2 = createCell('A', 'blue');
      expect(cellEquals(cell1, cell2)).toBe(false);
    });

    it('should detect attr differences', () => {
      const cell1 = createCell('A', undefined, undefined, { bold: true });
      const cell2 = createCell('A', undefined, undefined, { italic: true });
      expect(cellEquals(cell1, cell2)).toBe(false);
    });

    it('should detect wide flag differences', () => {
      const cell1: Cell = { char: '', attrs: {}, isWide: true };
      const cell2: Cell = { char: '', attrs: {}, isWide: false };
      expect(cellEquals(cell1, cell2)).toBe(false);
    });
  });
});

describe('CellBuffer', () => {
  let buffer: CellBuffer;

  beforeEach(() => {
    buffer = new CellBuffer(10, 5);
  });

  describe('constructor', () => {
    it('should create buffer with correct dimensions', () => {
      expect(buffer.width).toBe(10);
      expect(buffer.height).toBe(5);
    });

    it('should initialize with empty cells', () => {
      const cell = buffer.get(0, 0);
      expect(cell?.char).toBe(' ');
    });
  });

  describe('get/set', () => {
    it('should get and set cells', () => {
      const cell = createCell('X', 'red');
      buffer.set(3, 2, cell);
      expect(buffer.get(3, 2)).toEqual(cell);
    });

    it('should return undefined for out of bounds', () => {
      expect(buffer.get(-1, 0)).toBeUndefined();
      expect(buffer.get(0, -1)).toBeUndefined();
      expect(buffer.get(10, 0)).toBeUndefined();
      expect(buffer.get(0, 5)).toBeUndefined();
    });

    it('should ignore out of bounds set', () => {
      buffer.set(-1, 0, createCell('X'));
      buffer.set(100, 100, createCell('Y'));
      // Should not throw
    });
  });

  describe('writeChar', () => {
    it('should write a character', () => {
      buffer.writeChar(5, 2, 'A', 'cyan', undefined, { bold: true });
      const cell = buffer.get(5, 2);
      expect(cell?.char).toBe('A');
      expect(cell?.fg).toBe('cyan');
      expect(cell?.attrs.bold).toBe(true);
    });

    it('should handle wide characters', () => {
      buffer.writeChar(3, 1, '🎉'); // Emoji is 2 cells wide
      expect(buffer.get(3, 1)?.char).toBe('🎉');
      expect(buffer.get(4, 1)?.isWide).toBe(true);
    });
  });

  describe('writeString', () => {
    it('should write a string', () => {
      const written = buffer.writeString(0, 0, 'Hello');
      expect(written).toBe(5);
      expect(buffer.get(0, 0)?.char).toBe('H');
      expect(buffer.get(4, 0)?.char).toBe('o');
    });

    it('should apply style to all characters', () => {
      buffer.writeString(0, 0, 'Hi', 'red', 'blue', { underline: true });
      expect(buffer.get(0, 0)?.fg).toBe('red');
      expect(buffer.get(0, 0)?.bg).toBe('blue');
      expect(buffer.get(0, 0)?.attrs.underline).toBe(true);
      expect(buffer.get(1, 0)?.fg).toBe('red');
    });

    it('should stop at buffer edge', () => {
      const written = buffer.writeString(8, 0, 'Hello');
      expect(written).toBe(2); // Only 'He' fits
    });

    it('should skip newlines', () => {
      buffer.writeString(0, 0, 'A\nB');
      expect(buffer.get(0, 0)?.char).toBe('A');
      expect(buffer.get(1, 0)?.char).toBe('B');
    });
  });

  describe('fill', () => {
    it('should fill a region', () => {
      const cell = createCell('#', 'green');
      buffer.fill(2, 1, 3, 2, cell);

      expect(buffer.get(2, 1)?.char).toBe('#');
      expect(buffer.get(4, 2)?.char).toBe('#');
      expect(buffer.get(1, 1)?.char).toBe(' '); // Outside fill
    });

    it('should clip to buffer bounds', () => {
      const cell = createCell('X');
      buffer.fill(-2, -2, 5, 5, cell);
      expect(buffer.get(0, 0)?.char).toBe('X');
      expect(buffer.get(2, 2)?.char).toBe('X');
    });
  });

  describe('clear', () => {
    it('should reset all cells to empty', () => {
      buffer.writeString(0, 0, 'Hello');
      buffer.clear();
      expect(buffer.get(0, 0)?.char).toBe(' ');
      expect(buffer.get(4, 0)?.char).toBe(' ');
    });
  });

  describe('damage tracking', () => {
    it('should track damage on set', () => {
      buffer.clearDamage();
      buffer.set(5, 3, createCell('X'));
      expect(buffer.hasDamage()).toBe(true);
      expect(buffer.getDamage()).toHaveLength(1);
    });

    it('should track damage on fill', () => {
      buffer.clearDamage();
      buffer.fill(1, 1, 3, 2, createCell('#'));
      expect(buffer.getDamage()[0]).toEqual({ x: 1, y: 1, width: 3, height: 2 });
    });

    it('should consolidate damage', () => {
      buffer.clearDamage();
      buffer.set(0, 0, createCell('A'));
      buffer.set(5, 3, createCell('B'));
      buffer.set(2, 1, createCell('C'));

      const consolidated = buffer.consolidateDamage();
      expect(consolidated).toHaveLength(1);
      expect(consolidated[0]).toEqual({ x: 0, y: 0, width: 6, height: 4 });
    });

    it('should clear damage', () => {
      buffer.set(0, 0, createCell('X'));
      buffer.clearDamage();
      expect(buffer.hasDamage()).toBe(false);
    });
  });

  describe('diff', () => {
    it('should return empty patches for identical buffers', () => {
      const buffer2 = new CellBuffer(10, 5);
      const patches = buffer.diff(buffer2);
      expect(patches).toHaveLength(0);
    });

    it('should detect changed cells', () => {
      const buffer2 = new CellBuffer(10, 5);
      buffer2.set(3, 2, createCell('X', 'red'));

      const patches = buffer.diff(buffer2);
      expect(patches).toHaveLength(1);
      expect(patches[0]).toEqual({
        x: 3,
        y: 2,
        cell: { char: 'X', fg: 'red', bg: undefined, attrs: {}, isWide: undefined },
      });
    });

    it('should detect multiple changes', () => {
      const buffer2 = new CellBuffer(10, 5);
      buffer2.writeString(0, 0, 'ABC');

      const patches = buffer.diff(buffer2);
      expect(patches).toHaveLength(3);
    });
  });

  describe('applyPatches', () => {
    it('should apply patches to buffer', () => {
      const patches = [
        { x: 0, y: 0, cell: createCell('A', 'red') },
        { x: 1, y: 0, cell: createCell('B', 'blue') },
      ];

      buffer.applyPatches(patches);
      expect(buffer.get(0, 0)?.char).toBe('A');
      expect(buffer.get(0, 0)?.fg).toBe('red');
      expect(buffer.get(1, 0)?.char).toBe('B');
    });
  });

  describe('iteration', () => {
    it('should iterate over all cells', () => {
      let count = 0;
      for (const { x, y, cell } of buffer) {
        count++;
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(cell).toBeDefined();
      }
      expect(count).toBe(50); // 10 * 5
    });

    it('should iterate over rows', () => {
      let rowCount = 0;
      for (const { y, cells } of buffer.rows()) {
        rowCount++;
        expect(y).toBeGreaterThanOrEqual(0);
        expect(cells).toHaveLength(10);
      }
      expect(rowCount).toBe(5);
    });
  });

  describe('copyFrom', () => {
    it('should copy content from another buffer', () => {
      const source = new CellBuffer(5, 3);
      source.writeString(0, 0, 'ABC');
      source.writeString(0, 1, 'DEF');

      buffer.copyFrom(source, 0, 0, 2, 1);

      expect(buffer.get(2, 1)?.char).toBe('A');
      expect(buffer.get(3, 1)?.char).toBe('B');
      expect(buffer.get(2, 2)?.char).toBe('D');
    });
  });
});

describe('DoubleBuffer', () => {
  let doubleBuffer: DoubleBuffer;

  beforeEach(() => {
    doubleBuffer = new DoubleBuffer(20, 10);
  });

  it('should have correct dimensions', () => {
    expect(doubleBuffer.width).toBe(20);
    expect(doubleBuffer.height).toBe(10);
  });

  it('should provide separate front and back buffers', () => {
    const front = doubleBuffer.getFrontBuffer();
    const back = doubleBuffer.getBackBuffer();
    expect(front).not.toBe(back);
  });

  it('should swap buffers and return patches', () => {
    const back = doubleBuffer.getBackBuffer();
    back.writeString(0, 0, 'Hello');

    const patches = doubleBuffer.swap();
    expect(patches).toHaveLength(5);

    // After swap, front should have "Hello"
    const newFront = doubleBuffer.getFrontBuffer();
    expect(newFront.get(0, 0)?.char).toBe('H');
  });

  it('should return empty patches on identical content', () => {
    // Both buffers are initially empty
    const patches = doubleBuffer.swap();
    expect(patches).toHaveLength(0);
  });

  it('should resize both buffers', () => {
    doubleBuffer.resize(30, 15);
    expect(doubleBuffer.width).toBe(30);
    expect(doubleBuffer.height).toBe(15);
    expect(doubleBuffer.getFrontBuffer().width).toBe(30);
    expect(doubleBuffer.getBackBuffer().height).toBe(15);
  });
});

describe('BufferPool', () => {
  let pool: BufferPool;

  beforeEach(() => {
    pool = new BufferPool();
  });

  it('should create new buffers when pool is empty', () => {
    const buffer = pool.acquire(10, 5);
    expect(buffer.width).toBe(10);
    expect(buffer.height).toBe(5);
  });

  it('should reuse released buffers', () => {
    const buffer1 = pool.acquire(10, 5);
    buffer1.writeString(0, 0, 'Test');
    pool.release(buffer1);

    const buffer2 = pool.acquire(10, 5);
    // Should be same instance (reused)
    expect(buffer2).toBe(buffer1);
    // Should be cleared
    expect(buffer2.get(0, 0)?.char).toBe(' ');
  });

  it('should not reuse different sized buffers', () => {
    const buffer1 = pool.acquire(10, 5);
    pool.release(buffer1);

    const buffer2 = pool.acquire(20, 10);
    expect(buffer2).not.toBe(buffer1);
  });

  it('should report stats', () => {
    pool.acquire(10, 5);
    pool.acquire(10, 5);
    pool.release(pool.acquire(10, 5));
    pool.release(pool.acquire(20, 10));

    const stats = pool.stats();
    expect(stats.totalBuffers).toBe(2);
  });

  it('should clear pool', () => {
    pool.release(pool.acquire(10, 5));
    pool.release(pool.acquire(10, 5));
    pool.clear();

    const stats = pool.stats();
    expect(stats.totalBuffers).toBe(0);
  });
});

describe('ANSI Conversion', () => {
  describe('bufferToAnsi', () => {
    it('should convert empty buffer', () => {
      const buffer = new CellBuffer(5, 2);
      const ansi = bufferToAnsi(buffer);
      expect(ansi).toBe('');
    });

    it('should convert buffer with text', () => {
      const buffer = new CellBuffer(10, 1);
      buffer.writeString(0, 0, 'Hello');
      const ansi = bufferToAnsi(buffer);
      expect(ansi).toBe('Hello');
    });

    it('should include color codes', () => {
      const buffer = new CellBuffer(10, 1);
      buffer.writeString(0, 0, 'Hi', 'red');
      const ansi = bufferToAnsi(buffer);
      expect(ansi).toContain('\x1b[31m'); // Red foreground
      expect(ansi).toContain('Hi');
      expect(ansi).toContain('\x1b[0m'); // Reset
    });

    it('should handle multiple styles', () => {
      const buffer = new CellBuffer(10, 1);
      buffer.writeChar(0, 0, 'A', 'red');
      buffer.writeChar(1, 0, 'B', 'blue');
      const ansi = bufferToAnsi(buffer);
      expect(ansi).toContain('A');
      expect(ansi).toContain('B');
    });
  });

  describe('patchesToAnsi', () => {
    it('should return empty for no patches', () => {
      const ansi = patchesToAnsi([], 80);
      expect(ansi).toBe('');
    });

    it('should include cursor positioning', () => {
      const patches = [{ x: 5, y: 3, cell: createCell('X') }];
      const ansi = patchesToAnsi(patches, 80);
      // ANSI cursor position is 1-indexed: \x1b[4;6H
      expect(ansi).toContain('\x1b[4;6H');
      expect(ansi).toContain('X');
    });

    it('should optimize consecutive cells', () => {
      const patches = [
        { x: 0, y: 0, cell: createCell('A') },
        { x: 1, y: 0, cell: createCell('B') },
        { x: 2, y: 0, cell: createCell('C') },
      ];
      const ansi = patchesToAnsi(patches, 80);
      // Should position once, then write ABC consecutively
      expect(ansi).toBe('\x1b[1;1HABC');
    });

    it('should handle non-consecutive cells', () => {
      const patches = [
        { x: 0, y: 0, cell: createCell('A') },
        { x: 5, y: 2, cell: createCell('B') },
      ];
      const ansi = patchesToAnsi(patches, 80);
      expect(ansi).toContain('\x1b[1;1H');
      expect(ansi).toContain('\x1b[3;6H');
    });

    it('should include styles', () => {
      const patches = [{ x: 0, y: 0, cell: createCell('X', 'cyan', 'yellow', { bold: true }) }];
      const ansi = patchesToAnsi(patches, 80);
      expect(ansi).toContain('1'); // Bold
      expect(ansi).toContain('36'); // Cyan
      expect(ansi).toContain('43'); // Yellow background
    });
  });
});
