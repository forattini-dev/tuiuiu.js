import { describe, expect, it } from 'vitest';
import { createTextDocument } from '../../src/interaction/text-document.js';
import { createTextViewport } from '../../src/interaction/text-viewport.js';
import { performanceBudget, shouldSkipPerformanceBenchmarks } from './_shared/performance-budget.js';
import { createCodeTokenDocument } from '../../src/utils/code-tokenizer.js';
import { Markdown, createMarkdownDocument } from '../../src/molecules/markdown.js';

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

describeOrSkip('Incremental lexical performance budgets', () => {
  const source = Array.from({ length: 1000 }, (_, index) => `const value${index} = ${index}; // é 界 comment`).join('\n') + '\n';
  it('retains completed lines while appending source', () => {
    const document = createCodeTokenDocument();
    document.update(source, 'ts');
    let content = source;
    const ms = medianOperationMs(step => {
      content += `const streamed${step} = 42;\n`;
      document.update(content, 'ts');
    }, 12);
    expect(document.snapshot().reparsedFrom).toBeGreaterThan(source.length - 1);
    expect(document.snapshot().reusedTokenCount).toBeGreaterThan(1000);
    expect(ms).toBeLessThan(performanceBudget(2));
  });
  it('avoids retokenizing intact code before a late edit', () => {
    const document = createCodeTokenDocument();
    document.update(source, 'ts');
    const start = source.lastIndexOf('value999');
    const ms = medianOperationMs(step => {
      document.update(source.slice(0, start) + (step % 2 ? 'other999' : 'value999') + source.slice(start + 8), 'ts');
    }, 12);
    expect(document.snapshot().reparsedFrom).toBeGreaterThan(source.length * 0.9);
    expect(ms).toBeLessThan(performanceBudget(2));
  });
  it('retains fitted code rows during rich Markdown streaming', () => {
    const document = createMarkdownDocument();
    let content = source;
    const render = () => Markdown({ content: '~~~ts\n' + content + '~~~', document, maxWidth: 80 });
    const initial = render().children[0]!.children[0]!.children[0];
    let last = render();
    const ms = medianOperationMs(step => {
      content += `const streamed${step} = 42;\n`;
      last = render();
    }, 6);
    expect(last.children[0]!.children[0]!.children[0]).toBe(initial);
    expect(ms).toBeLessThan(performanceBudget(20));
  });
});
