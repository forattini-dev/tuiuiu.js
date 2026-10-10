import { describe, expect, it, vi } from 'vitest';
import { createTextDocument } from '../../src/interaction/text-document.js';
import { createTextSelection } from '../../src/interaction/text-selection.js';
import { createTextViewport } from '../../src/interaction/text-viewport.js';

describe('source text selection', () => {
  it('keeps direction, grapheme boundaries and immutable snapshots', () => {
    const selection = createTextSelection(createTextDocument({ initialValue: 'aé👩‍💻z' }));
    selection.set(8, 2);
    expect(selection.snapshot()).toMatchObject({ anchor: 8, head: 1, text: 'é👩‍💻' });
    const before = selection.snapshot();
    expect(Object.isFrozen(before)).toBe(true);
    selection.clear();
    expect(selection.snapshot()).toMatchObject({ anchor: 1, head: 1, text: '' });
    expect(before.text).toBe('é👩‍💻');
    selection.dispose();
  });
  it('clamps offsets, avoids duplicate notifications and validates before mutation', () => {
    const selection = createTextSelection(createTextDocument({ initialValue: 'abc' }));
    const listener = vi.fn();
    selection.subscribe(listener);
    expect(selection.set(-10, 100)).toBe(true);
    expect(selection.set(0, 3)).toBe(false);
    for (const bad of [NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
      expect(() => selection.set(bad, 1)).toThrow(RangeError);
      expect(() => selection.set(1, bad)).toThrow(RangeError);
    }
    expect(listener).toHaveBeenCalledTimes(1);
    expect(selection.snapshot().text).toBe('abc');
    selection.dispose();
  });
  it('rebases edits before/inside/after the selection without modifying content', () => {
    const document = createTextDocument({ initialValue: 'abcdef' });
    const selection = createTextSelection(document);
    selection.set(4, 1);
    document.replace(0, 0, 'X');
    expect(selection.snapshot()).toMatchObject({ anchor: 5, head: 2, text: 'bcd' });
    document.replace(3, 4, 'YY');
    expect(selection.snapshot()).toMatchObject({ anchor: 6, head: 2, text: 'bYYd' });
    document.replace(6, 6, 'Z');
    expect(selection.snapshot().text).toBe('bYYd');
    expect(document.snapshot().value).toBe('XabYYdZef');
    selection.dispose();
  });
  it('notifies content-only edits and releases both subscriptions on disposal', () => {
    const document = createTextDocument({ initialValue: 'abc' });
    const selection = createTextSelection(document);
    selection.selectAll();
    const listener = vi.fn();
    const unsubscribe = selection.subscribe(listener);
    document.replace(1, 2, 'X');
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ text: 'aXc' }));
    unsubscribe();
    selection.clear();
    expect(listener).toHaveBeenCalledTimes(1);
    selection.subscribe(listener);
    selection.dispose(); selection.dispose();
    document.setValue('later');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(() => selection.extend(1)).toThrow('disposed');
    expect(() => selection.subscribe(listener)).toThrow('disposed');
  });
  it('copies source newlines, not soft wraps, and never copies terminal protocols', () => {
    const document = createTextDocument({ initialValue: 'hello\x1b[31m world\x1b[0m\nnext\x1b]52;c;secret\x07' });
    const selection = createTextSelection(document);
    selection.selectAll();
    expect(selection.copyText()).toBe('hello world\nnext');
    expect(selection.snapshot().text).toBe(document.snapshot().value);
    selection.dispose();
  });
});

describe('selection projection onto text viewports', () => {
  it('projects tabs, wide glyphs and soft wraps without counting newline cells', () => {
    const viewport = createTextViewport(createTextDocument({ initialValue: 'a\t界é\r\nz' }), { width: 6, wrap: 'grapheme' });
    expect(viewport.rangeRects(1, 9)).toEqual([
      { row: 0, column: 1, width: 5, start: 1, end: 3 },
      { row: 1, column: 0, width: 1, start: 3, end: 5 },
      { row: 2, column: 0, width: 1, start: 7, end: 8 },
    ]);
    expect(viewport.rangeRects(1, 9, 1, 1)).toEqual([
      { row: 1, column: 0, width: 1, start: 3, end: 5 },
    ]);
    expect(viewport.rangeRects(5, 7)).toEqual([]);
    expect(Object.isFrozen(viewport.rangeRects(0, 1))).toBe(true);
  });
  it('maps placeholders for source controls consistently in both directions', () => {
    const viewport = createTextViewport(createTextDocument({ initialValue: 'a\x1bb' }), { width: 20 });
    expect(viewport.lines()[0]).toMatchObject({ displayText: 'a�b', width: 3 });
    expect(viewport.positionAt(2)).toEqual({ row: 0, column: 2 });
    expect(viewport.offsetAt(0, 2)).toBe(2);
    expect(viewport.rangeRects(1, 2)).toEqual([{ row: 0, column: 1, width: 1, start: 1, end: 2 }]);
  });
  it('reprojects source ranges after resize and rejects invalid geometry', () => {
    const viewport = createTextViewport(createTextDocument({ initialValue: 'abcdef' }), { width: 3 });
    expect(viewport.rangeRects(1, 5)).toHaveLength(2);
    viewport.configure({ width: 6 });
    expect(viewport.rangeRects(1, 5)).toEqual([{ row: 0, column: 1, width: 4, start: 1, end: 5 }]);
    expect(viewport.rangeRects(2, 2)).toEqual([]);
    expect(viewport.rangeRects(0, 6, 0, 0)).toEqual([]);
    for (const args of [[2, 1], [NaN, 1], [0, Infinity], [0, 1, -1], [0, 1, 0, -1]]) {
      expect(() => viewport.rangeRects(args[0]!, args[1]!, args[2], args[3])).toThrow(RangeError);
    }
  });
});
