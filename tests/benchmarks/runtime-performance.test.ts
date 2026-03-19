import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Box, Text, darkTheme, setTheme } from '../../src/index.js';
import {
  benchmarkBurstScheduler,
  benchmarkLocalizedRuntime,
  benchmarkRuntime,
  isCI,
} from './_shared/runtime-benchmark.js';

const describeOrSkip = isCI ? describe.skip : describe;

// Budgets are generous enough to tolerate GC/JIT pressure when running
// inside a full 190+ file suite.  They still catch order-of-magnitude
// regressions.  For tighter checks, run this file in isolation.
const BUDGETS = {
  small: { frame: 16, layout: 14, ansi: 10, delta: 14 },
  medium: { frame: 28, layout: 24, ansi: 16, delta: 22 },
  large: { frame: 55, layout: 55, ansi: 40, delta: 40 },
};

function metricCard(index: number, value = '1234 req/s') {
  return Box(
    {
      borderStyle: 'round',
      borderColor: 'blue',
      padding: 1,
      width: 20,
      height: 6,
      backgroundColor: index % 2 ? '#101820' : '#1a1f2b',
    },
    Text({ color: 'yellow', bold: true }, `Metric ${index}`),
    Text({ color: 'green' }, value),
    Text({ color: 'cyan' }, '45ms avg'),
    Text({ color: 'gray' }, 'ok ok ok'),
  );
}

function buildDashboard(rows: number, cols: number, sections: number, tick?: number) {
  const blocks = [];

  for (let section = 0; section < sections; section++) {
    const sectionRows = [];

    for (let row = 0; row < rows; row++) {
      const cards = [];
      for (let col = 0; col < cols; col++) {
        const index = section * 1000 + row * cols + col;
        const value = tick !== undefined && index === 0
          ? `${String(1200 + tick).padStart(4, '0')} req/s`
          : '1234 req/s';
        cards.push(metricCard(index, value));
      }
      sectionRows.push(Box({ flexDirection: 'row', columnGap: 1 }, ...cards));
    }

    blocks.push(
      Box(
        { flexDirection: 'column', rowGap: 1 },
        Text({ bold: true }, `Section ${section + 1}`),
        ...sectionRows,
      ),
    );
  }

  return Box(
    { flexDirection: 'column', padding: 1, rowGap: 1, width: 'fill' },
    Text({ bold: true, color: 'white' }, 'Synthetic Dashboard'),
    ...blocks,
  );
}

describeOrSkip('Runtime performance benchmarks', () => {
  beforeEach(() => {
    setTheme(darkTheme);
  });

  afterEach(() => {
    setTheme(darkTheme);
  });

  it('meets the small dashboard budget', () => {
    const result = benchmarkRuntime(buildDashboard(3, 4, 3), { width: 140, height: 50 });

    expect(result.drawCommands).toBeGreaterThan(100);
    expect(result.avgFrameMs).toBeLessThan(BUDGETS.small.frame);
    expect(result.avgLayoutMs).toBeLessThan(BUDGETS.small.layout);
    expect(result.avgAnsiMs).toBeLessThan(BUDGETS.small.ansi);
    expect(result.avgDeltaMs).toBeLessThan(BUDGETS.small.delta);
  });

  it('meets the medium dashboard budget', () => {
    const result = benchmarkRuntime(buildDashboard(5, 6, 4), { width: 180, height: 60 });

    expect(result.drawCommands).toBeGreaterThan(500);
    expect(result.avgFrameMs).toBeLessThan(BUDGETS.medium.frame);
    expect(result.avgLayoutMs).toBeLessThan(BUDGETS.medium.layout);
    expect(result.avgAnsiMs).toBeLessThan(BUDGETS.medium.ansi);
    expect(result.avgDeltaMs).toBeLessThan(BUDGETS.medium.delta);
  });

  it('meets the large dashboard budget', () => {
    const result = benchmarkRuntime(buildDashboard(8, 10, 6), { width: 180, height: 60 }, 12);

    expect(result.drawCommands).toBeGreaterThan(2000);
    expect(result.avgFrameMs).toBeLessThan(BUDGETS.large.frame);
    expect(result.avgLayoutMs).toBeLessThan(BUDGETS.large.layout);
    expect(result.avgAnsiMs).toBeLessThan(BUDGETS.large.ansi);
    expect(result.avgDeltaMs).toBeLessThan(BUDGETS.large.delta);
  });

  it('keeps delta cheaper than ANSI when a large tree changes locally', () => {
    const result = benchmarkLocalizedRuntime(
      tick => buildDashboard(8, 10, 6, tick),
      { width: 180, height: 60 },
      12,
    );

    expect(result.drawCommands).toBeGreaterThan(2000);
    expect(result.avgFrameMs).toBeLessThan(65);
    expect(result.avgLayoutMs).toBeLessThan(45);
    expect(result.avgDrawCommandMs).toBeLessThan(22);
    expect(result.avgDeltaMs).toBeLessThan(result.avgAnsiMs);
    expect(result.avgDeltaMs).toBeLessThan(30);
  });

  it('coalesces a large synchronous burst into one follow-up render', async () => {
    const result = await benchmarkBurstScheduler(
      tick => buildDashboard(8, 10, 6, tick),
      { width: 180, height: 60 },
      200,
    );

    expect(result.finalValue).toBe(200);
    expect(result.renderCount).toBe(2);
    expect(result.burstMs).toBeLessThan(150);
  });
});
