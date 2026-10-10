import { describe, expect, it } from 'vitest';
import { createTextEditor } from '../../src/interaction/text-editor.js';

describe('TextEditor', () => {
  it('normalizes explicit replacement ranges before placing the cursor', () => {
    const editor = createTextEditor({ initialValue: 'a😀b' });
    editor.replace(2, 3, 'X');
    expect(editor.snapshot()).toEqual({ value: 'aXb', cursor: 2 });
    editor.replace(100, 101, '!');
    expect(editor.snapshot()).toEqual({ value: 'aXb!', cursor: 4 });
    expect(() => editor.replace(2, 1, 'X')).toThrow(RangeError);
  });

  it('restores adapter metadata before notifying and records metadata-only changes', () => {
    let metadata = 'old';
    const editor = createTextEditor({ initialValue: 'text', historyState: {
      capture: () => metadata,
      restore: state => { metadata = state as string; },
    } });
    const observed: string[] = [];
    editor.subscribe(snapshot => observed.push(`${snapshot.value}:${metadata}`));
    expect(editor.replace(0, 4, 'text', 'new')).toBe(true);
    editor.undo(); editor.redo();
    expect(observed).toEqual(['text:new', 'text:old', 'text:new']);
    expect(editor.replace(0, 4, 'text')).toBe(false);
  });

  it('trims both undo stacks when the history limit changes', () => {
    const editor = createTextEditor();
    editor.insert('a'); editor.insert('b'); editor.insert('c');
    editor.setHistoryLimit(1);
    expect(editor.undo()).toBe(true);
    expect(editor.undo()).toBe(false);
    editor.setHistoryLimit(0);
    expect(editor.redo()).toBe(false);
    expect(() => editor.setHistoryLimit(NaN)).toThrow(RangeError);
    expect(editor.snapshot().value).toBe('ab');
  });
  it('edits and moves on Unicode grapheme boundaries', () => {
    const editor = createTextEditor({ initialValue: 'a👨‍👩‍👧‍👦b' });
    editor.moveLeft();
    editor.backspace();
    expect(editor.snapshot()).toEqual({ value: 'ab', cursor: 1 });
    editor.insert('é');
    editor.moveHome();
    editor.deleteForward();
    expect(editor.snapshot()).toEqual({ value: 'éb', cursor: 0 });
  });

  it('supports word movement/deletion and bounded insertion', () => {
    const editor = createTextEditor({ initialValue: 'one two', maxLength: 9 });
    editor.backspace(true);
    editor.insert('three!');
    expect(editor.snapshot().value).toBe('one three');
    editor.moveLeft(true);
    expect(editor.snapshot().cursor).toBe(4);
  });

  it('never truncates through a grapheme cluster', () => {
    const editor = createTextEditor({ maxLength: 4 });
    expect(editor.insert('a👨‍👩‍👧‍👦')).toBe(true);
    expect(editor.snapshot()).toEqual({ value: 'a', cursor: 1 });
  });

  it.each(['😀', 'e\u0301', '👨‍👩‍👧‍👦', '🇧🇷'])('clamps explicit cursors inside %s', (grapheme) => {
    const editor = createTextEditor();
    for (let offset = 1; offset < grapheme.length; offset++) {
      editor.setValue(grapheme, offset);
      expect(editor.snapshot().cursor).toBe(0);
      editor.insert('X');
      expect(editor.snapshot()).toEqual({ value: `X${grapheme}`, cursor: 1 });
    }
  });

  it.each([NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid cursor %s without changing the document', (cursor) => {
      const editor = createTextEditor({ initialValue: 'original' });
      expect(() => editor.setValue('replacement', cursor)).toThrow(RangeError);
      expect(editor.snapshot()).toEqual({ value: 'original', cursor: 8 });
    },
  );

  it('clamps out-of-range cursors and bounds the initial value', () => {
    const editor = createTextEditor({ initialValue: 'a😀b', maxLength: 2 });
    expect(editor.snapshot()).toEqual({ value: 'a', cursor: 1 });
    editor.setValue('ab', -10);
    expect(editor.snapshot().cursor).toBe(0);
    editor.setValue('ab', 100);
    expect(editor.snapshot().cursor).toBe(2);
  });

  it('keeps the cursor on a boundary when inserted text joins the next grapheme', () => {
    const editor = createTextEditor({ initialValue: '\u0301' });
    editor.moveHome();
    editor.insert('e');
    expect(editor.snapshot()).toEqual({ value: 'e\u0301', cursor: 2 });
    editor.backspace();
    expect(editor.snapshot()).toEqual({ value: '', cursor: 0 });
  });
});
