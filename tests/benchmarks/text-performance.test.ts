import { describe, expect, it } from 'vitest';
import { createTextDocument } from '../../src/interaction/text-document.js';
import { createTextViewport } from '../../src/interaction/text-viewport.js';
import { performanceBudget, shouldSkipPerformanceBenchmarks } from './_shared/performance-budget.js';

const describeOrSkip = shouldSkipPerformanceBenchmarks ? describe.skip : describe;
const initialValue = Array.from({ length: 1000 }, (_, index) => `row ${index}: text é 界 with words and a tab\there`).join('\n');

function setup() {
  const document = createTextDocument({ initialValue });
  const viewport = createTextViewport(document, { width: 25 });
  viewport.lines();
  return { document, viewport };
}

// Initial reflow is deliberately outside these update budgets. Use median batches
// to dampen GC/scheduler noise; structural reuse is also covered by correctness tests.
function medianOperationMs(operation: (step: number) => void, batchSize: number) {
  for (let step = 0; step < batchSize; step++) operation(step);
  const samples: number[] = [];
  for (let batch = 0; batch < 7; batch++) {
    const start = performance.now();
    for (let step = 0; step < batchSize; step++) operation(step);
    samples.push((performance.now() - start) / batchSize);
  }
  return samples.sort((a, b) => a - b)[3]!;
}

describeOrSkip('Incremental text performance budgets', () => {
  it('avoids full document reflow for a localized middle-line edit', () => {
    const { document, viewport } = setup();
    const start = document.line(500).start;
    const ms = medianOperationMs(step => {
      document.replace(start, start + 1, step % 2 ? 'X' : 'Y');
      viewport.lines();
    }, 12);
    expect(document.line(500).text.startsWith('X')).toBe(true);
    expect(ms).toBeLessThan(performanceBudget(8));
  });
  it('avoids reflow of finished lines while streaming whole-value updates', () => {
    const { document, viewport } = setup();
    let updates = 0;
    const ms = medianOperationMs(() => {
      document.setValue(document.snapshot().value + ' token');
      viewport.lines();
      updates++;
    }, 12);
    expect(document.snapshot().value.length).toBe(initialValue.length + updates * 6);
    expect(ms).toBeLessThan(performanceBudget(10));
  });
  it('avoids eager whole-document Unicode segmentation on coordinate lookup', () => {
    const { document, viewport } = setup();
    const offset = document.line(700).start + 17;
    let row = 0;
    const ms = medianOperationMs(() => { row = viewport.positionAt(offset).row; }, 50);
    expect(row).toBeGreaterThanOrEqual(700);
    expect(ms).toBeLessThan(performanceBudget(2));
  });
});
