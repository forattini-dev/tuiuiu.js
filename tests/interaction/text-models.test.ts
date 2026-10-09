import { describe, expect, it } from 'vitest';
import { createTextDocument } from '../../src/interaction/text-document.js';
import { createTextViewport } from '../../src/interaction/text-viewport.js';
import { createTextEditor } from '../../src/interaction/text-editor.js';

describe('TextDocument', () => {
  it('indexes LF and CRLF without exposing line terminators', () => {
    const document = createTextDocument({ initialValue: 'a\r\n👋\n' });
    expect(document.snapshot()).toEqual({ value: 'a\r\n👋\n', revision: 0, lineCount: 3 });
    expect(document.line(0)).toEqual({ text: 'a', start: 0, end: 1 });
    expect(document.line(1)).toEqual({ text: '👋', start: 3, end: 5 });
    expect(document.line(2)).toEqual({ text: '', start: 6, end: 6 });
    expect(() => document.line(3)).toThrow(RangeError);
  });
  it('emits bounded grapheme-safe change ranges and ignores no-ops', () => {
    const document = createTextDocument({ initialValue: 'a😀b', maxLength: 5 });
    const changes: unknown[] = [];
    const unsubscribe = document.subscribe((_snapshot, change) => changes.push(change));
    expect(document.replace(2, 3, 'é')).toBe(true);
    expect(document.snapshot().value).toBe('aéb');
    expect(changes).toEqual([{ start: 1, end: 3, inserted: 'é', revision: 1 }]);
    expect(document.setValue('aéb')).toBe(false);
    unsubscribe();
    document.setValue('new');
    expect(changes).toHaveLength(1);
    expect(() => document.replace(2, 1, '')).toThrow(RangeError);
  });
  it.each([-1, Infinity, NaN, 1.5])('rejects invalid limits %s', maxLength => {
    expect(() => createTextDocument({ maxLength })).toThrow(RangeError);
  });
});

describe('TextViewport', () => {
  it('retains layout until content or geometry changes', () => {
    const document = createTextDocument({ initialValue: 'abc def\n' });
    const view = createTextViewport(document, { width: 4 });
    const lines = view.lines();
    expect(lines.map(line => line.text)).toEqual(['abc', ' def', '']);
    expect(Object.isFrozen(lines)).toBe(true);
    expect(Object.isFrozen(lines[0])).toBe(true);
    view.configure({ width: 4 });
    expect(view.lines()).toBe(lines);
    document.setValue('abc def\n');
    expect(view.lines()).toBe(lines);
    view.configure({ width: 8 });
    expect(view.lines()).not.toBe(lines);
    expect(view.lines().map(line => line.text)).toEqual(['abc def', '']);
    document.replace(0, 1, 'X');
    expect(view.lines()[0]!.text).toBe('Xbc def');
  });
  it('maps tab cells, wide glyphs and soft-wrap affinity', () => {
    const view = createTextViewport(createTextDocument({ initialValue: 'a\t😀b' }), { width: 20, wrap: 'none' });
    expect(view.lines()[0]).toMatchObject({ displayText: 'a   😀b', width: 7 });
    expect(view.positionAt(3)).toEqual({ row: 0, column: 4 });
    expect(view.offsetAt(0, 5)).toBe(2);
    expect(view.offsetAt(0, 6)).toBe(4);
    const wrapped = createTextViewport(createTextDocument({ initialValue: 'abcd' }), { width: 2, wrap: 'grapheme' });
    expect(wrapped.positionAt(2)).toEqual({ row: 1, column: 0 });
    expect(wrapped.positionAt(2, 'backward')).toEqual({ row: 0, column: 2 });
    expect(wrapped.offsetAt(1, 1)).toBe(3);
  });
  it('roundtrips all grapheme boundaries through CRLF and trailing empty lines', () => {
    const document = createTextDocument({ initialValue: 'é😀\r\nz\n' });
    const view = createTextViewport(document, { width: 1 });
    for (const offset of [0, 2, 4, 6, 7, 8]) {
      const position = view.positionAt(offset);
      expect(view.offsetAt(position.row, position.column)).toBe(offset);
    }
    expect(view.positionAt(5)).toEqual(view.positionAt(4));
    expect(view.offsetAt(100, 100)).toBe(8);
  });
  it('makes progress when a single glyph is wider than the viewport', () => {
    const view = createTextViewport(createTextDocument({ initialValue: '😀👋' }), { width: 1 });
    expect(view.lines().map(line => line.text)).toEqual(['😀', '👋']);
  });
  it.each([0, -1, NaN, Infinity, 1.5])('rejects invalid widths %s', width => {
    expect(() => createTextViewport(createTextDocument(), { width })).toThrow(RangeError);
  });
});

describe('TextEditor document/selection/history', () => {
  it('replaces a backward selection and restores its direction through undo/redo', () => {
    const editor = createTextEditor({ initialValue: 'a😀bc' });
    editor.setSelection(5, 1);
    expect(editor.selection()).toEqual({ anchor: 5, head: 1, start: 1, end: 5, text: '😀bc' });
    editor.insert('X');
    expect(editor.snapshot()).toEqual({ value: 'aX', cursor: 2 });
    expect(editor.undo()).toBe(true);
    expect(editor.selection()).toMatchObject({ anchor: 5, head: 1, text: '😀bc' });
    expect(editor.redo()).toBe(true);
    expect(editor.snapshot()).toEqual({ value: 'aX', cursor: 2 });
  });
  it('extends on grapheme boundaries and collapses on non-extended movement', () => {
    const editor = createTextEditor({ initialValue: 'a👋b' });
    editor.moveLeft(false, true);
    editor.moveLeft(false, true);
    expect(editor.selection().text).toBe('👋b');
    editor.moveRight();
    expect(editor.selection().text).toBe('');
    expect(editor.snapshot().cursor).toBe(4);
    editor.setSelection(2, 4);
    expect(editor.selection().text).toBe('👋b');
    editor.deleteForward();
    expect(editor.snapshot().value).toBe('a');
  });
  it('bounds history, clears redo on a fresh edit and resets on setValue', () => {
    const editor = createTextEditor({ historyLimit: 2 });
    editor.insert('a'); editor.insert('b'); editor.insert('c');
    expect(editor.undo()).toBe(true);
    expect(editor.undo()).toBe(true);
    expect(editor.undo()).toBe(false);
    expect(editor.snapshot().value).toBe('a');
    editor.insert('X');
    expect(editor.canRedo()).toBe(false);
    editor.setValue('reset');
    expect(editor.canUndo()).toBe(false);
    const noHistory = createTextEditor({ historyLimit: 0 });
    noHistory.insert('a');
    expect(noHistory.undo()).toBe(false);
  });
  it('transforms external edits, invalidates stale history and releases subscriptions', () => {
    const document = createTextDocument({ initialValue: 'abc' });
    const first = createTextEditor({ document });
    const second = createTextEditor({ document });
    first.setSelection(1, 2);
    second.moveHome(); second.insert('X');
    expect(first.selection()).toMatchObject({ anchor: 2, head: 3, text: 'b' });
    first.insert('Y');
    expect(second.canUndo()).toBe(false);
    let notifications = 0;
    first.subscribe(() => notifications++);
    first.dispose(); first.dispose();
    document.setValue('later');
    expect(notifications).toBe(0);
    expect(first.disposed).toBe(true);
    expect(() => first.insert('!')).toThrow('disposed');
    expect(() => createTextEditor({ document, initialValue: '' })).toThrow(TypeError);
    expect(() => createTextEditor({ historyLimit: -1 })).toThrow(RangeError);
  });
});
