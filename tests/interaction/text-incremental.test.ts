import { describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'node:child_process';
import { createTextDocument, getTextDocumentChange, type TextDocument } from '../../src/interaction/text-document.js';
import { createTextViewport, type TextViewportOptions } from '../../src/interaction/text-viewport.js';
import { clampToGraphemeBoundary, segmentGraphemes } from '../../src/utils/grapheme.js';

function checkLines(document: TextDocument) {
  const { value, lineCount } = document.snapshot();
  const raw = value.split('\n');
  expect(lineCount).toBe(raw.length);
  let offset = 0;
  raw.forEach((line, index) => {
    const text = index < raw.length - 1 && line.endsWith('\r') ? line.slice(0, -1) : line;
    expect(document.line(index)).toEqual({ text, start: offset, end: offset + text.length });
    offset += line.length + 1;
  });
}

describe('incremental text document and reflow', () => {
  it('indexes edits at line starts/ends, CRLF, empty lines and EOF correctly', () => {
    for (const initialValue of ['', 'a', '\n', 'a\r\nb\n', '\n\n', '\ra\r\n', '👩‍💻é\n界']) {
      for (let start = 0; start <= initialValue.length; start++) {
        for (let end = start; end <= initialValue.length; end++) {
          for (const inserted of ['', '\n', '\r', '\r\n', 'a\n\nb', 'é']) {
            const document = createTextDocument({ initialValue });
            document.snapshot();
            document.replace(start, end, inserted);
            checkLines(document);
          }
        }
      }
    }
  });
  it('keeps a single immutable mutation record and leaves no-ops or listener mutation harmless', () => {
    const document = createTextDocument({ initialValue: 'abc\nlast' });
    expect(getTextDocumentChange(document, -1)).toBeUndefined();
    document.subscribe((_snapshot, change) => { change.start = 99; change.inserted = 'not the edit'; });
    document.replace(1, 2, 'X');
    const change = getTextDocumentChange(document, 0);
    expect(change).toEqual({ start: 1, end: 2, inserted: 'X', revision: 1 });
    expect(Object.isFrozen(change)).toBe(true);
    expect(document.setValue('aXc\nlast')).toBe(false);
    expect(getTextDocumentChange(document, 0)).toBe(change);
    document.replace(2, 2, '\n');
    expect(getTextDocumentChange(document, 0)).toBeUndefined();
    expect(getTextDocumentChange(document, 1)?.inserted).toBe('\n');
    expect(change?.revision).toBe(1);
    checkLines(document);
  });
  it('matches fresh geometry for arbitrary full replacements, including raw diffs inside Unicode clusters', () => {
    const values = ['', '\n', '\n\n', 'a\r\nb\n', 'a\nb\n', 'ab\n', 'a\rb\n',
      'a\n\r\n', '👩‍💻é\n界', '👩‍🔧e\n界', '🇧🇷\n', '\ud800\nx\udc00'];
    for (const initialValue of values) {
      for (const next of values) {
        const document = createTextDocument({ initialValue });
        const view = createTextViewport(document, { width: 2 });
        view.lines();
        document.setValue(next);
        checkLines(document);
        expect(view.lines()).toEqual(createTextViewport(createTextDocument({ initialValue: next }), { width: 2 }).lines());
      }
    }
  });
  it('keeps edit work local even in a large, wrapped document', () => {
    const document = createTextDocument({ initialValue: Array.from({ length: 1000 }, (_, index) => `line ${index}: é 界 words`).join('\n') });
    const view = createTextViewport(document, { width: 8 });
    const before = view.lines();
    const start = document.line(500).start;
    const readLine = vi.spyOn(document, 'line');
    document.replace(start, start + 1, 'L');
    const after = view.lines();
    expect(readLine.mock.calls).toEqual([[500]]);
    expect(after[0]).toBe(before[0]);
    expect(after.at(-1)).toBe(before.at(-1));
    readLine.mockClear();
    document.setValue(document.snapshot().value + '\nstreamed tail');
    view.lines();
    expect(readLine.mock.calls).toEqual([[999], [1000]]);
  });
  it('does not pin old whole-string revisions through retained logical-line slices', () => {
    const documentUrl = new URL('../../src/interaction/text-document.ts', import.meta.url).href;
    const viewportUrl = new URL('../../src/interaction/text-viewport.ts', import.meta.url).href;
    // A separate GC-enabled Node process measures retained heap, not transient
    // allocations or Vitest's own caches. Without detachment this retains ~20 MB.
    const script = `
      import { createTextDocument } from ${JSON.stringify(documentUrl)};
      import { createTextViewport } from ${JSON.stringify(viewportUrl)};
      const initialValue = Array.from({ length: 200 }, (_, i) => ('row ' + i + ': ').padEnd(500, 'x')).join('\\n');
      const document = createTextDocument({ initialValue });
      const viewport = createTextViewport(document, { width: 1000, wrap: 'none' });
      viewport.lines();
      for (let i = 0; i < 3; i++) global.gc();
      const before = process.memoryUsage().heapUsed;
      for (let i = 0; i < 200; i++) {
        const start = document.line(i).start;
        document.replace(start, start + 1, 'Y');
        viewport.lines();
      }
      for (let i = 0; i < 3; i++) global.gc();
      console.log(JSON.stringify({ retained: process.memoryUsage().heapUsed - before, rows: viewport.lines().length }));
    `;
    const measured: { retained: number; rows: number } = JSON.parse(execFileSync(process.execPath,
      ['--expose-gc', '--import', 'tsx', '--input-type=module', '-e', script], { encoding: 'utf8', timeout: 20_000 }));
    expect(measured.rows).toBe(200);
    expect(measured.retained).toBeLessThan(4 * 1024 * 1024);
  });
  it('reflows only the edited logical line and preserves untouched row identities', () => {
    const document = createTextDocument({ initialValue: 'prefix wraps\nedit this\nsuffix wraps' });
    const subscribe = vi.spyOn(document, 'subscribe');
    const readLine = vi.spyOn(document, 'line');
    const view = createTextViewport(document, { width: 5, wrap: 'grapheme' });
    const before = view.lines();
    expect(readLine).toHaveBeenCalledTimes(3);
    readLine.mockClear();
    const line = document.line(1);
    readLine.mockClear();
    document.replace(line.start, line.start + 1, 'X');
    const after = view.lines();
    expect(readLine).toHaveBeenCalledTimes(1);
    expect(readLine).toHaveBeenCalledWith(1);
    expect(after).not.toBe(before);
    expect(after[0]).toBe(before[0]);
    expect(after.at(-1)).toBe(before.at(-1));
    expect(after.find(row => row.logicalLine === 1)?.text).toBe('Xdit ');
    expect(before.find(row => row.logicalLine === 1)?.text).toBe('edit ');
    expect(view.lines()).toBe(after);
    expect(subscribe).not.toHaveBeenCalled();
  });
  it('shifts unchanged suffix geometry without resegmenting it after inserted lines', () => {
    const document = createTextDocument({ initialValue: 'first\nmiddle\nlast\t界' });
    const view = createTextViewport(document, { width: 5, wrap: 'grapheme', tabSize: 4 });
    const before = view.lines();
    const readLine = vi.spyOn(document, 'line');
    document.replace(7, 8, 'long\nnew');
    const after = view.lines();
    expect(readLine.mock.calls.map(([index]) => index)).toEqual([1, 2]);
    expect(after[0]).toBe(before[0]);
    const oldSuffix = before.filter(row => row.logicalLine === 2);
    const suffix = after.filter(row => row.logicalLine === 3);
    expect(suffix).toEqual(oldSuffix.map(row => ({ ...row, start: row.start + 7, end: row.end + 7, logicalLine: 3 })));
    expect(oldSuffix[0]!.logicalLine).toBe(2);
    expect(Object.isFrozen(after)).toBe(true);
    expect(Object.isFrozen(suffix[0])).toBe(true);
  });
  it('reflows streaming setValue changes while preserving public replacement events', () => {
    const document = createTextDocument({ initialValue: 'first\nsecond\ntail' });
    const view = createTextViewport(document, { width: 8 });
    const before = view.lines();
    const event = vi.fn();
    document.subscribe(event);
    const readLine = vi.spyOn(document, 'line');
    document.setValue('first\nsecond\ntail + streamed');
    const after = view.lines();
    expect(readLine.mock.calls.map(([index]) => index)).toEqual([2]);
    expect(after[0]).toBe(before[0]);
    expect(after[1]).toBe(before[1]);
    expect(event.mock.calls[0]![1]).toEqual({ start: 0, end: 17, inserted: 'first\nsecond\ntail + streamed', revision: 1 });
    expect(getTextDocumentChange(document, 0)).toEqual({ start: 17, end: 17, inserted: ' + streamed', revision: 1 });
    for (const value of ['first\nsecond\ntail + é', 'first\nsecond\ntail + e', 'first\nsecond\ntail + 😀',
      'first\nsecond\ntail + 😃', 'first\r\nsecond\ntail', 'first\rsecond\ntail']) {
      document.setValue(value);
      checkLines(document);
      expect(view.lines()).toEqual(createTextViewport(createTextDocument({ initialValue: value }), { width: 8 }).lines());
    }
  });
  it('falls back safely after missed revisions and rebuilds only on real geometry changes', () => {
    const document = createTextDocument({ initialValue: 'one\ntwo\nthree' });
    const view = createTextViewport(document, { width: 5 });
    const first = view.lines();
    const readLine = vi.spyOn(document, 'line');
    document.replace(0, 0, 'X');
    document.replace(0, 0, 'Y');
    const next = view.lines();
    expect(readLine).toHaveBeenCalledTimes(3);
    expect(next[0]!.text).toBe('YXone');
    readLine.mockClear();
    view.configure({ width: 5, wrap: 'word', tabSize: 4 });
    expect(view.lines()).toBe(next);
    expect(readLine).not.toHaveBeenCalled();
    view.configure({ width: 7 });
    expect(view.lines()).not.toBe(next);
    expect(readLine).toHaveBeenCalledTimes(3);
    expect(first[0]!.text).toBe('one');
    document.setValue('reset\n');
    expect(view.lines().map(row => row.text)).toEqual(['reset', '']);
  });
  it('does not require hidden mutation metadata or extra subscriptions on external documents', () => {
    const original = createTextDocument({ initialValue: 'one\ntwo' });
    const external: TextDocument = { ...original };
    const subscribe = vi.spyOn(external, 'subscribe');
    const readLine = vi.spyOn(external, 'line');
    const view = createTextViewport(external, { width: 10 });
    view.lines();
    readLine.mockClear();
    original.replace(0, 1, 'X');
    expect(view.lines()[0]!.text).toBe('Xne');
    expect(readLine).toHaveBeenCalledTimes(2);
    expect(subscribe).not.toHaveBeenCalled();
  });
  it.each(['word', 'grapheme', 'none'] as const)('matches fresh layout and coordinate projection through deterministic edits (%s)', wrap => {
    let seed = 0x12345678;
    const random = (max: number) => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed % max; };
    const document = createTextDocument({ initialValue: 'first é\r\n\t👩‍💻 界 last\n' });
    let options: TextViewportOptions = { width: 7, wrap, tabSize: 4 };
    const view = createTextViewport(document, options);
    view.lines();
    const pieces = ['', 'X', '\n', '\r\n', '\t', '界', 'é', '👩‍💻', 'a b\n\n', '\x1b'];
    for (let step = 0; step < 100; step++) {
      const edits = step % 9 === 0 ? 2 : 1;
      for (let edit = 0; edit < edits; edit++) {
        const { value } = document.snapshot();
        const start = random(value.length + 1);
        const end = start + random(value.length - start + 1);
        document.replace(start, end, pieces[random(pieces.length)]!);
        checkLines(document);
      }
      if (step % 7 === 0) { options = { width: 1 + random(10), wrap, tabSize: 1 + random(6) }; view.configure(options); }
      if (step % 17 === 0) document.setValue('reset\r\n\t界 é👩‍💻\n');
      const fresh = createTextViewport(createTextDocument({ initialValue: document.snapshot().value }), options);
      expect(view.lines()).toEqual(fresh.lines());
      const length = document.snapshot().value.length;
      for (let offset = 0; offset <= length; offset++) {
        expect(view.positionAt(offset)).toEqual(fresh.positionAt(offset));
        expect(view.positionAt(offset, 'backward')).toEqual(fresh.positionAt(offset, 'backward'));
      }
      for (let row = 0; row < view.lines().length; row++) {
        for (let column = 0; column < options.width + 2; column++) expect(view.offsetAt(row, column)).toBe(fresh.offsetAt(row, column));
      }
      expect(view.rangeRects(0, length, 0, 3)).toEqual(fresh.rangeRects(0, length, 0, 3));
    }
  });
});

describe('bounded Unicode offset clamping', () => {
  it('matches full segmentation at every offset and affinity for diverse grapheme contexts', () => {
    for (const value of ['a\r\nb', 'é👩‍💻🇧🇷界', '\u0600A\u0301B', '각', '\ud800x\udc00', 'a'.repeat(1000) + 'é']) {
      const parts = segmentGraphemes(value);
      for (let offset = -1; offset <= value.length + 1; offset += 0.5) {
        const bounded = Math.max(0, Math.min(offset, value.length));
        const part = parts.find(item => bounded > item.index && bounded < item.end);
        for (const direction of ['left', 'right', 'nearest'] as const) {
          const expected = !part ? bounded : direction === 'left' ? part.index : direction === 'right' ? part.end
            : bounded - part.index <= part.end - bounded ? part.index : part.end;
          expect(clampToGraphemeBoundary(value, offset, direction)).toBe(expected);
        }
      }
    }
    expect(clampToGraphemeBoundary('abc', NaN)).toBeNaN();
  });
  it('does not iterate all graphemes for a single clamp when Intl.Segmenter is available', () => {
    const original = Intl.Segmenter.prototype.segment;
    const segment = vi.spyOn(Intl.Segmenter.prototype, 'segment').mockImplementation(function (this: Intl.Segmenter, value: string) {
      const parts = original.call(this, value);
      return { containing: offset => parts.containing(offset), [Symbol.iterator]() { throw new Error('Eager segmentation'); } };
    });
    try {
      expect(clampToGraphemeBoundary('a'.repeat(10_000) + 'é', 10_001, 'left')).toBe(10_000);
      expect(segment).toHaveBeenCalledTimes(1);
    } finally { segment.mockRestore(); }
  });
});
