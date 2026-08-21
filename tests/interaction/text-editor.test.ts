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
});
