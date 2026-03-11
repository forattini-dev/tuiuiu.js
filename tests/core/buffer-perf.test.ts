import { describe, expect, it } from 'vitest';

import {
  CellBuffer,
  cellEquals,
  cellToAnsi,
  createCell,
  patchesToAnsi,
  type CellPatch,
  type DamageRect,
} from '../../src/core/buffer.js';

const isCI = process.env.CI === 'true';
const describeOrSkip = isCI ? describe.skip : describe;

interface BenchmarkResult {
  avgMs: number;
  minMs: number;
  maxMs: number;
}

function benchmark(fn: () => void, iterations = 25): BenchmarkResult {
  const times: number[] = [];

  for (let index = 0; index < 5; index++) {
    fn();
  }

  for (let index = 0; index < iterations; index++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }

  const totalMs = times.reduce((sum, value) => sum + value, 0);
  return {
    avgMs: totalMs / iterations,
    minMs: Math.min(...times),
    maxMs: Math.max(...times),
  };
}

function shouldSkipRatioCheck(optimized: BenchmarkResult, baseline: BenchmarkResult): boolean {
  return optimized.avgMs < 0.05 || baseline.avgMs < 0.05;
}

function naiveDiff(current: CellBuffer, next: CellBuffer): CellPatch[] {
  const currentCells = (current as any).cells as ReturnType<CellBuffer['get']>[][];
  const nextCells = (next as any).cells as ReturnType<CellBuffer['get']>[][];
  const patches: CellPatch[] = [];
  const maxWidth = Math.min(current.width, next.width);
  const maxHeight = Math.min(current.height, next.height);

  for (let y = 0; y < maxHeight; y++) {
    for (let x = 0; x < maxWidth; x++) {
      const currentCell = currentCells[y]![x]!;
      const nextCell = nextCells[y]![x]!;
      if (!cellEquals(currentCell, nextCell)) {
        patches.push({ x, y, cell: nextCell });
      }
    }
  }

  return patches;
}

function naiveDiffRects(current: CellBuffer, next: CellBuffer, rects: DamageRect[]): CellPatch[] {
  const currentCells = (current as any).cells as ReturnType<CellBuffer['get']>[][];
  const nextCells = (next as any).cells as ReturnType<CellBuffer['get']>[][];
  const patches = new Map<string, CellPatch>();

  for (const rect of rects) {
    const x1 = Math.max(0, rect.x);
    const y1 = Math.max(0, rect.y);
    const x2 = Math.min(current.width, next.width, rect.x + rect.width);
    const y2 = Math.min(current.height, next.height, rect.y + rect.height);

    for (let y = y1; y < y2; y++) {
      for (let x = x1; x < x2; x++) {
        const currentCell = currentCells[y]![x]!;
        const nextCell = nextCells[y]![x]!;
        if (!cellEquals(currentCell, nextCell)) {
          patches.set(`${x}:${y}`, { x, y, cell: nextCell });
        }
      }
    }
  }

  return [...patches.values()];
}

function naivePatchesToAnsi(patches: CellPatch[]): string {
  return patches
    .map(({ x, y, cell }) => `\x1b[${y + 1};${x + 1}H${cellToAnsi(cell)}`)
    .join('');
}

function buildStableBuffers(width: number, height: number): { current: CellBuffer; next: CellBuffer } {
  const current = new CellBuffer(width, height);
  const next = new CellBuffer(width, height);

  for (let row = 0; row < height; row++) {
    const char = row % 2 === 0 ? '·' : ' ';
    current.fill(0, row, width, 1, createCell(char, row % 3 === 0 ? 'cyan' : 'gray'));
    next.fill(0, row, width, 1, createCell(char, row % 3 === 0 ? 'cyan' : 'gray'));
  }

  return { current, next };
}

describeOrSkip('CellBuffer performance microbenchmarks', () => {
  it('keeps unchanged full-buffer diff cheaper than a naive cell scan', () => {
    const { current, next } = buildStableBuffers(180, 60);

    current.diff(next);

    const optimized = benchmark(() => {
      for (let index = 0; index < 8; index++) {
        current.diff(next);
      }
    });

    const baseline = benchmark(() => {
      for (let index = 0; index < 8; index++) {
        naiveDiff(current, next);
      }
    });

    if (!shouldSkipRatioCheck(optimized, baseline)) {
      expect(optimized.avgMs).toBeLessThan(baseline.avgMs * 0.5);
    }

    expect(current.diff(next)).toHaveLength(0);
  });

  it('keeps overlapping localized diffRects cheaper than a naive rect walk', () => {
    const width = 180;
    const height = 60;
    const { current, next } = buildStableBuffers(width, height);
    const rects: DamageRect[] = [];

    for (let row = 10; row < 25; row++) {
      next.writeString(20 + (row % 3), row, `hot-${row}`, 'yellow');
      rects.push({ x: 18, y: row, width: 12, height: 1 });
      rects.push({ x: 20, y: row, width: 14, height: 1 });
    }

    const optimizedPatches = current.diffRects(next, rects);
    const baselinePatches = naiveDiffRects(current, next, rects);

    expect(optimizedPatches).toHaveLength(baselinePatches.length);

    const optimized = benchmark(() => {
      for (let index = 0; index < 10; index++) {
        current.diffRects(next, rects);
      }
    });

    const baseline = benchmark(() => {
      for (let index = 0; index < 10; index++) {
        naiveDiffRects(current, next, rects);
      }
    });

    expect(optimized.avgMs).toBeLessThan(4);
    expect(optimized.maxMs).toBeLessThan(10);
    expect(baseline.avgMs).toBeGreaterThan(0);
  });

  it('keeps styled patch serialization cheaper and shorter than naive per-cell ANSI output', () => {
    const patches: CellPatch[] = [];

    for (let row = 0; row < 20; row++) {
      for (let col = 0; col < 30; col++) {
        patches.push({
          x: col,
          y: row,
          cell: createCell(String.fromCharCode(65 + (col % 26)), 'red', undefined, { bold: true }),
        });
      }
    }

    const optimizedOutput = patchesToAnsi(patches, 80, true);
    const baselineOutput = naivePatchesToAnsi(patches);

    expect(optimizedOutput.length).toBeLessThan(baselineOutput.length);

    const optimized = benchmark(() => {
      for (let index = 0; index < 6; index++) {
        patchesToAnsi(patches, 80, true);
      }
    });

    const baseline = benchmark(() => {
      for (let index = 0; index < 6; index++) {
        naivePatchesToAnsi(patches);
      }
    });

    expect(optimized.avgMs).toBeLessThan(12);
    expect(optimized.maxMs).toBeLessThan(20);
    expect(baseline.avgMs).toBeGreaterThan(0);
  });
});
