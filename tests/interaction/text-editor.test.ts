import { describe, expect, it } from 'vitest';
import { createTextEditor } from '../../src/interaction/text-editor.js';

describe('TextEditor', () => {
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
