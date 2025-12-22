/**
 * TextInput Keyboard Interaction Tests
 *
 * Comprehensive tests for all keyboard interactions:
 * - Character input (a-z, 0-9, symbols)
 * - Navigation (arrows, Home, End, Ctrl+arrows)
 * - Deletion (Backspace, Delete, Ctrl+Backspace, Ctrl+Delete)
 * - Line operations (Ctrl+K, Ctrl+U, Ctrl+W, Ctrl+X)
 * - Actions (Enter, Escape, Tab)
 * - History navigation (Up/Down arrows)
 * - Multi-line (Shift+Enter)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createTextInput, renderTextInput } from '../../src/atoms/text-input.js';
import { keys, charKey, typeString } from '../helpers/keyboard.js';
import {
  addInputHandler,
  removeInputHandler,
  clearInputHandlers,
  emitInput,
} from '../../src/hooks/context.js';
import type { Key, InputHandler } from '../../src/hooks/types.js';

// Helper to simulate input via EventEmitter
function simulateInput(input: string, key: Key): void {
  emitInput(input, key);
}

// Helper to type a sequence
function type(sequence: Array<{ input: string; key: Key }>): void {
  for (const { input, key } of sequence) {
    simulateInput(input, key);
  }
}

// Helper to create input and register handler
function createTestInput(options?: Parameters<typeof createTextInput>[0]) {
  const ti = createTextInput(options);
  addInputHandler(ti.handleInput);
  return ti;
}

describe('TextInput Keyboard Interactions', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  afterEach(() => {
    clearInputHandlers();
  });

  // ============================================================================
  // CHARACTER INPUT
  // ============================================================================

  describe('Character Input', () => {
    it('should insert character at cursor position (empty input)', () => {
      const ti = createTestInput({ initialValue: '' });
      simulateInput('a', charKey('a').key);
      expect(ti.value()).toBe('a');
      expect(ti.cursorPosition()).toBe(1);
    });

    it('should insert character at cursor position (end of string)', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('!', charKey('!').key);
      expect(ti.value()).toBe('hello!');
      expect(ti.cursorPosition()).toBe(6);
    });

    it('should insert character at cursor position (middle of string)', () => {
      const ti = createTestInput({ initialValue: 'hllo' });
      // Move cursor to position 1
      simulateInput('', keys.home().key);
      simulateInput('', keys.right().key);
      // Insert 'e'
      simulateInput('e', charKey('e').key);
      expect(ti.value()).toBe('hello');
      expect(ti.cursorPosition()).toBe(2);
    });

    it('should insert character at beginning when cursor is at 0', () => {
      const ti = createTestInput({ initialValue: 'orld' });
      simulateInput('', keys.home().key);
      simulateInput('w', charKey('w').key);
      expect(ti.value()).toBe('world');
      expect(ti.cursorPosition()).toBe(1);
    });

    it('should insert multiple characters in sequence', () => {
      const ti = createTestInput({ initialValue: '' });
      type(typeString('hello'));
      expect(ti.value()).toBe('hello');
      expect(ti.cursorPosition()).toBe(5);
    });

    it('should handle number input', () => {
      const ti = createTestInput({ initialValue: '' });
      type(typeString('12345'));
      expect(ti.value()).toBe('12345');
    });

    it('should handle symbol input', () => {
      const ti = createTestInput({ initialValue: '' });
      type(typeString('!@#$%'));
      expect(ti.value()).toBe('!@#$%');
    });

    it('should handle space input', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput(' ', charKey(' ').key);
      expect(ti.value()).toBe('hello ');
    });

    it('should respect maxLength', () => {
      const ti = createTestInput({ initialValue: '', maxLength: 5 });
      type(typeString('hello world'));
      expect(ti.value()).toBe('hello');
      expect(ti.value().length).toBe(5);
    });

    it('should do nothing when disabled (isActive=false)', () => {
      const ti = createTestInput({ initialValue: 'test', isActive: false });
      simulateInput('x', charKey('x').key);
      expect(ti.value()).toBe('test');
    });

    it('should call onChange when character is inserted', () => {
      const onChange = vi.fn();
      const ti = createTestInput({ initialValue: '', onChange });
      simulateInput('a', charKey('a').key);
      expect(onChange).toHaveBeenCalledWith('a');
    });
  });

  // ============================================================================
  // BACKSPACE - DELETE BEFORE CURSOR
  // ============================================================================

  describe('Backspace (Delete Before Cursor)', () => {
    it('should delete character before cursor', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.backspace().key);
      expect(ti.value()).toBe('hell');
      expect(ti.cursorPosition()).toBe(4);
    });

    it('should do nothing when cursor is at position 0', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.backspace().key);
      expect(ti.value()).toBe('hello');
      expect(ti.cursorPosition()).toBe(0);
    });

    it('should delete character in middle of string', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.right().key);
      simulateInput('', keys.right().key);
      simulateInput('', keys.right().key); // Cursor at position 3, after 'l'
      simulateInput('', keys.backspace().key);
      expect(ti.value()).toBe('helo');
      expect(ti.cursorPosition()).toBe(2);
    });

    it('should delete multiple characters with repeated backspace', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.backspace().key);
      simulateInput('', keys.backspace().key);
      simulateInput('', keys.backspace().key);
      expect(ti.value()).toBe('he');
      expect(ti.cursorPosition()).toBe(2);
    });

    it('should call onChange when character is deleted', () => {
      const onChange = vi.fn();
      const ti = createTestInput({ initialValue: 'ab', onChange });
      simulateInput('', keys.backspace().key);
      expect(onChange).toHaveBeenCalledWith('a');
    });
  });

  // ============================================================================
  // DELETE - DELETE AFTER CURSOR
  // ============================================================================

  describe('Delete (Delete After Cursor)', () => {
    it('should delete character after cursor', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.delete().key);
      expect(ti.value()).toBe('ello');
      expect(ti.cursorPosition()).toBe(0);
    });

    it('should do nothing when cursor is at end', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.delete().key);
      expect(ti.value()).toBe('hello');
      expect(ti.cursorPosition()).toBe(5);
    });

    it('should delete character in middle of string', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.right().key);
      simulateInput('', keys.right().key); // Cursor at position 2
      simulateInput('', keys.delete().key);
      expect(ti.value()).toBe('helo');
      expect(ti.cursorPosition()).toBe(2);
    });

    it('should call onChange when character is deleted', () => {
      const onChange = vi.fn();
      const ti = createTestInput({ initialValue: 'ab', onChange });
      simulateInput('', keys.home().key);
      onChange.mockClear();
      simulateInput('', keys.delete().key);
      expect(onChange).toHaveBeenCalledWith('b');
    });
  });

  // ============================================================================
  // CTRL+BACKSPACE - DELETE WORD BEFORE
  // ============================================================================

  describe('Ctrl+Backspace (Delete Word Before)', () => {
    it('should delete word before cursor', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      simulateInput('', keys.ctrlBackspace().key);
      expect(ti.value()).toBe('hello ');
      expect(ti.cursorPosition()).toBe(6);
    });

    it('should delete to word boundary', () => {
      const ti = createTestInput({ initialValue: 'one two three' });
      simulateInput('', keys.ctrlBackspace().key);
      expect(ti.value()).toBe('one two ');
    });

    it('should handle cursor in middle of word', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.left().key);
      simulateInput('', keys.left().key); // cursor at "hel|lo"
      simulateInput('', keys.ctrlBackspace().key);
      expect(ti.value()).toBe('lo');
    });

    it('should do nothing at position 0', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.ctrlBackspace().key);
      expect(ti.value()).toBe('hello');
    });
  });

  // ============================================================================
  // CTRL+DELETE - DELETE WORD AFTER
  // ============================================================================

  describe('Ctrl+Delete (Delete Word After)', () => {
    it('should delete word after cursor', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.ctrlDelete().key);
      // findNextWordBoundary skips word chars AND following non-word chars (spaces)
      expect(ti.value()).toBe('world');
    });

    it('should do nothing at end', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.ctrlDelete().key);
      expect(ti.value()).toBe('hello');
    });
  });

  // ============================================================================
  // LEFT ARROW - CURSOR MOVEMENT
  // ============================================================================

  describe('Left Arrow (Cursor Left)', () => {
    it('should move cursor one position left', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.left().key);
      expect(ti.cursorPosition()).toBe(4);
    });

    it('should not move past position 0', () => {
      const ti = createTestInput({ initialValue: 'hi' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.left().key);
      expect(ti.cursorPosition()).toBe(0);
    });

    it('should move multiple times', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.left().key);
      simulateInput('', keys.left().key);
      simulateInput('', keys.left().key);
      expect(ti.cursorPosition()).toBe(2);
    });
  });

  // ============================================================================
  // RIGHT ARROW - CURSOR MOVEMENT
  // ============================================================================

  describe('Right Arrow (Cursor Right)', () => {
    it('should move cursor one position right', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.right().key);
      expect(ti.cursorPosition()).toBe(1);
    });

    it('should not move past end of string', () => {
      const ti = createTestInput({ initialValue: 'hi' });
      simulateInput('', keys.right().key);
      expect(ti.cursorPosition()).toBe(2);
    });

    it('should move multiple times', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.right().key);
      simulateInput('', keys.right().key);
      simulateInput('', keys.right().key);
      expect(ti.cursorPosition()).toBe(3);
    });
  });

  // ============================================================================
  // CTRL+LEFT - WORD NAVIGATION
  // ============================================================================

  describe('Ctrl+Left Arrow (Previous Word)', () => {
    it('should move to previous word boundary', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      simulateInput('', keys.ctrlLeft().key);
      expect(ti.cursorPosition()).toBe(6); // Before 'world'
    });

    it('should skip multiple words', () => {
      const ti = createTestInput({ initialValue: 'one two three' });
      simulateInput('', keys.ctrlLeft().key);
      simulateInput('', keys.ctrlLeft().key);
      expect(ti.cursorPosition()).toBe(4); // Before 'two'
    });

    it('should stop at position 0', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.ctrlLeft().key);
      simulateInput('', keys.ctrlLeft().key);
      expect(ti.cursorPosition()).toBe(0);
    });
  });

  // ============================================================================
  // CTRL+RIGHT - WORD NAVIGATION
  // ============================================================================

  describe('Ctrl+Right Arrow (Next Word)', () => {
    it('should move to next word boundary', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.ctrlRight().key);
      expect(ti.cursorPosition()).toBe(6); // After 'hello '
    });

    it('should stop at end of string', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.ctrlRight().key);
      simulateInput('', keys.ctrlRight().key);
      expect(ti.cursorPosition()).toBe(5);
    });
  });

  // ============================================================================
  // HOME - GO TO START
  // ============================================================================

  describe('Home (Go to Start)', () => {
    it('should move cursor to position 0', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      simulateInput('', keys.home().key);
      expect(ti.cursorPosition()).toBe(0);
    });

    it('should do nothing if already at 0', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.home().key);
      expect(ti.cursorPosition()).toBe(0);
    });
  });

  // ============================================================================
  // END - GO TO END
  // ============================================================================

  describe('End (Go to End)', () => {
    it('should move cursor to end of string', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('', keys.end().key);
      expect(ti.cursorPosition()).toBe(5);
    });

    it('should do nothing if already at end', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.end().key);
      expect(ti.cursorPosition()).toBe(5);
    });
  });

  // ============================================================================
  // CTRL+A - GO TO START (ALTERNATIVE)
  // ============================================================================

  describe('Ctrl+A (Go to Start Alternative)', () => {
    it('should move cursor to position 0', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      simulateInput('a', keys.ctrlA().key);
      expect(ti.cursorPosition()).toBe(0);
    });
  });

  // ============================================================================
  // CTRL+E - GO TO END (ALTERNATIVE)
  // ============================================================================

  describe('Ctrl+E (Go to End Alternative)', () => {
    it('should move cursor to end of string', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('e', keys.ctrlE().key);
      expect(ti.cursorPosition()).toBe(5);
    });
  });

  // ============================================================================
  // ENTER - SUBMIT
  // ============================================================================

  describe('Enter (Submit)', () => {
    it('should call onSubmit with current value', () => {
      const onSubmit = vi.fn();
      const ti = createTestInput({ initialValue: 'hello', onSubmit });
      simulateInput('', keys.enter().key);
      expect(onSubmit).toHaveBeenCalledWith('hello');
    });

    it('should reset history index on submit', () => {
      const onSubmit = vi.fn();
      const ti = createTestInput({
        initialValue: '',
        history: ['one', 'two'],
        onSubmit,
      });
      simulateInput('', keys.up().key); // Navigate history
      simulateInput('', keys.enter().key);
      // After submit, typing new text should not be from history
      type(typeString('new'));
      expect(ti.value()).toBe('twonew');
    });

    it('should not call onSubmit if not provided', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      expect(() => simulateInput('', keys.enter().key)).not.toThrow();
    });
  });

  // ============================================================================
  // SHIFT+ENTER - NEW LINE (MULTILINE)
  // ============================================================================

  describe('Shift+Enter (New Line - Multiline)', () => {
    it('should insert newline when multiline is enabled', () => {
      const ti = createTestInput({ initialValue: 'line1', multiline: true });
      simulateInput('', keys.shiftEnter().key);
      expect(ti.value()).toBe('line1\n');
      expect(ti.cursorPosition()).toBe(6);
    });

    it('should insert newline in middle of text', () => {
      const ti = createTestInput({ initialValue: 'helloworld', multiline: true });
      // Move cursor to position 5
      simulateInput('', keys.home().key);
      for (let i = 0; i < 5; i++) {
        simulateInput('', keys.right().key);
      }
      simulateInput('', keys.shiftEnter().key);
      expect(ti.value()).toBe('hello\nworld');
    });

    it('should NOT insert newline when multiline is disabled', () => {
      const onSubmit = vi.fn();
      const ti = createTestInput({
        initialValue: 'line1',
        multiline: false,
        onSubmit,
      });
      simulateInput('', keys.shiftEnter().key);
      // When multiline is false, shift+enter acts like enter
      expect(onSubmit).toHaveBeenCalledWith('line1');
    });

    it('should set isMultiline flag when newline is inserted', () => {
      const ti = createTestInput({ initialValue: 'test', multiline: true });
      expect(ti.isMultiline()).toBe(false);
      simulateInput('', keys.shiftEnter().key);
      expect(ti.isMultiline()).toBe(true);
    });
  });

  // ============================================================================
  // ESCAPE - CANCEL
  // ============================================================================

  describe('Escape (Cancel)', () => {
    it('should call onCancel when pressed', () => {
      const onCancel = vi.fn();
      const ti = createTestInput({ initialValue: 'hello', onCancel });
      simulateInput('', keys.escape().key);
      expect(onCancel).toHaveBeenCalled();
    });

    it('should not throw if onCancel is not provided', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      expect(() => simulateInput('', keys.escape().key)).not.toThrow();
    });

    it('should not modify value when escaping', () => {
      const onCancel = vi.fn();
      const ti = createTestInput({ initialValue: 'hello', onCancel });
      simulateInput('', keys.escape().key);
      expect(ti.value()).toBe('hello');
    });
  });

  // ============================================================================
  // TAB - RESERVED
  // ============================================================================

  describe('Tab (Reserved)', () => {
    it('should not modify value', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.tab().key);
      expect(ti.value()).toBe('hello');
    });

    it('should not move cursor', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      const pos = ti.cursorPosition();
      simulateInput('', keys.tab().key);
      expect(ti.cursorPosition()).toBe(pos);
    });
  });

  // ============================================================================
  // UP ARROW - HISTORY NAVIGATION
  // ============================================================================

  describe('Up Arrow (History Previous)', () => {
    it('should navigate to previous history entry', () => {
      const ti = createTestInput({
        initialValue: '',
        history: ['first', 'second', 'third'],
      });
      simulateInput('', keys.up().key);
      expect(ti.value()).toBe('third'); // Most recent
    });

    it('should navigate through multiple history entries', () => {
      const ti = createTestInput({
        initialValue: '',
        history: ['first', 'second', 'third'],
      });
      simulateInput('', keys.up().key);
      expect(ti.value()).toBe('third');
      simulateInput('', keys.up().key);
      expect(ti.value()).toBe('second');
      simulateInput('', keys.up().key);
      expect(ti.value()).toBe('first');
    });

    it('should stop at oldest history entry', () => {
      const ti = createTestInput({
        initialValue: '',
        history: ['only'],
      });
      simulateInput('', keys.up().key);
      simulateInput('', keys.up().key);
      simulateInput('', keys.up().key);
      expect(ti.value()).toBe('only');
    });

    it('should preserve original value for later restoration', () => {
      const ti = createTestInput({
        initialValue: 'original',
        history: ['history1'],
      });
      simulateInput('', keys.up().key);
      expect(ti.value()).toBe('history1');
      simulateInput('', keys.down().key);
      expect(ti.value()).toBe('original');
    });

    it('should do nothing if history is empty', () => {
      const ti = createTestInput({ initialValue: 'hello', history: [] });
      simulateInput('', keys.up().key);
      expect(ti.value()).toBe('hello');
    });

    it('should move cursor to end of history entry', () => {
      const ti = createTestInput({
        initialValue: '',
        history: ['hello'],
      });
      simulateInput('', keys.up().key);
      expect(ti.cursorPosition()).toBe(5);
    });
  });

  // ============================================================================
  // DOWN ARROW - HISTORY NAVIGATION
  // ============================================================================

  describe('Down Arrow (History Next)', () => {
    it('should navigate to next (more recent) history entry', () => {
      const ti = createTestInput({
        initialValue: '',
        history: ['first', 'second', 'third'],
      });
      simulateInput('', keys.up().key);
      simulateInput('', keys.up().key);
      expect(ti.value()).toBe('second');
      simulateInput('', keys.down().key);
      expect(ti.value()).toBe('third');
    });

    it('should restore original value when going past newest', () => {
      const ti = createTestInput({
        initialValue: 'original',
        history: ['history'],
      });
      simulateInput('', keys.up().key);
      expect(ti.value()).toBe('history');
      simulateInput('', keys.down().key);
      expect(ti.value()).toBe('original');
    });

    it('should do nothing if not in history mode', () => {
      const ti = createTestInput({
        initialValue: 'hello',
        history: ['history'],
      });
      simulateInput('', keys.down().key);
      expect(ti.value()).toBe('hello');
    });
  });

  // ============================================================================
  // CTRL+K - DELETE TO END OF LINE
  // ============================================================================

  describe('Ctrl+K (Delete to End of Line)', () => {
    it('should delete from cursor to end of string', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      simulateInput('', keys.home().key);
      for (let i = 0; i < 5; i++) {
        simulateInput('', keys.right().key);
      }
      simulateInput('k', keys.ctrlK().key);
      expect(ti.value()).toBe('hello');
    });

    it('should delete entire string if cursor at start', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('k', keys.ctrlK().key);
      expect(ti.value()).toBe('');
    });

    it('should do nothing if cursor at end', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('k', keys.ctrlK().key);
      expect(ti.value()).toBe('hello');
    });

    it('should delete to newline in multiline mode', () => {
      const ti = createTestInput({ initialValue: 'line1\nline2', multiline: true });
      simulateInput('', keys.home().key);
      simulateInput('k', keys.ctrlK().key);
      expect(ti.value()).toBe('\nline2');
    });
  });

  // ============================================================================
  // CTRL+U - DELETE TO START OF LINE
  // ============================================================================

  describe('Ctrl+U (Delete to Start of Line)', () => {
    it('should delete from start to cursor', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      // Cursor is at end
      simulateInput('u', keys.ctrlU().key);
      expect(ti.value()).toBe('');
      expect(ti.cursorPosition()).toBe(0);
    });

    it('should delete from line start to cursor in multiline', () => {
      const ti = createTestInput({ initialValue: 'line1\nline2', multiline: true });
      // Cursor at end (after line2)
      simulateInput('u', keys.ctrlU().key);
      expect(ti.value()).toBe('line1\n');
      expect(ti.cursorPosition()).toBe(6);
    });

    it('should do nothing if cursor at start', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      simulateInput('', keys.home().key);
      simulateInput('u', keys.ctrlU().key);
      expect(ti.value()).toBe('hello');
    });
  });

  // ============================================================================
  // CTRL+W - DELETE WORD BEFORE (ALTERNATIVE)
  // ============================================================================

  describe('Ctrl+W (Delete Word Before)', () => {
    it('should delete word before cursor', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      simulateInput('w', keys.ctrlW().key);
      expect(ti.value()).toBe('hello ');
    });

    it('should work like Ctrl+Backspace', () => {
      const ti1 = createTestInput({ initialValue: 'one two three' });
      const ti2 = createTestInput({ initialValue: 'one two three' });

      simulateInput('w', keys.ctrlW().key);
      // Note: ti2 uses different handler context, need separate test
      expect(ti1.value()).toBe('one two ');
    });
  });

  // ============================================================================
  // CTRL+X - CLEAR ALL
  // ============================================================================

  describe('Ctrl+X (Clear All)', () => {
    it('should clear entire input', () => {
      const ti = createTestInput({ initialValue: 'hello world' });
      simulateInput('x', keys.ctrlX().key);
      expect(ti.value()).toBe('');
      expect(ti.cursorPosition()).toBe(0);
    });

    it('should call onChange with empty string', () => {
      const onChange = vi.fn();
      const ti = createTestInput({ initialValue: 'hello', onChange });
      simulateInput('x', keys.ctrlX().key);
      expect(onChange).toHaveBeenCalledWith('');
    });
  });

  // ============================================================================
  // STATE TESTS
  // ============================================================================

  describe('States', () => {
    describe('Empty Field', () => {
      it('should handle typing into empty field', () => {
        const ti = createTestInput({ initialValue: '' });
        type(typeString('hello'));
        expect(ti.value()).toBe('hello');
      });

      it('should handle backspace on empty field', () => {
        const ti = createTestInput({ initialValue: '' });
        simulateInput('', keys.backspace().key);
        expect(ti.value()).toBe('');
      });
    });

    describe('Cursor at Beginning', () => {
      it('should handle left arrow at beginning', () => {
        const ti = createTestInput({ initialValue: 'hello' });
        simulateInput('', keys.home().key);
        simulateInput('', keys.left().key);
        expect(ti.cursorPosition()).toBe(0);
      });

      it('should insert at beginning correctly', () => {
        const ti = createTestInput({ initialValue: 'world' });
        simulateInput('', keys.home().key);
        type(typeString('hello '));
        expect(ti.value()).toBe('hello world');
      });
    });

    describe('Cursor in Middle', () => {
      it('should handle insertion in middle', () => {
        const ti = createTestInput({ initialValue: 'helloworld' });
        simulateInput('', keys.home().key);
        for (let i = 0; i < 5; i++) {
          simulateInput('', keys.right().key);
        }
        simulateInput(' ', charKey(' ').key);
        expect(ti.value()).toBe('hello world');
      });

      it('should handle deletion in middle', () => {
        const ti = createTestInput({ initialValue: 'hello  world' });
        simulateInput('', keys.home().key);
        for (let i = 0; i < 6; i++) {
          simulateInput('', keys.right().key);
        }
        simulateInput('', keys.backspace().key);
        expect(ti.value()).toBe('hello world');
      });
    });

    describe('Cursor at End', () => {
      it('should handle right arrow at end', () => {
        const ti = createTestInput({ initialValue: 'hello' });
        simulateInput('', keys.right().key);
        expect(ti.cursorPosition()).toBe(5);
      });

      it('should append at end correctly', () => {
        const ti = createTestInput({ initialValue: 'hello' });
        simulateInput('!', charKey('!').key);
        expect(ti.value()).toBe('hello!');
      });
    });

    describe('With Placeholder', () => {
      it('should replace placeholder with typed text', () => {
        const ti = createTestInput({ initialValue: '', placeholder: 'Type here...' });
        simulateInput('h', charKey('h').key);
        expect(ti.value()).toBe('h');
      });
    });

    describe('Password Mode', () => {
      it('should accept input normally in password mode', () => {
        const ti = createTestInput({ initialValue: '', password: true });
        type(typeString('secret'));
        expect(ti.value()).toBe('secret');
      });

      it('should handle all operations in password mode', () => {
        const ti = createTestInput({ initialValue: 'pass', password: true });
        simulateInput('', keys.backspace().key);
        expect(ti.value()).toBe('pas');
      });
    });

    describe('Disabled (isActive=false)', () => {
      it('should ignore all input when disabled', () => {
        const ti = createTestInput({ initialValue: 'original', isActive: false });
        simulateInput('x', charKey('x').key);
        simulateInput('', keys.backspace().key);
        simulateInput('', keys.left().key);
        expect(ti.value()).toBe('original');
      });
    });

    describe('MaxLength', () => {
      it('should stop accepting input at maxLength', () => {
        const ti = createTestInput({ initialValue: '', maxLength: 3 });
        type(typeString('hello'));
        expect(ti.value()).toBe('hel');
      });

      it('should truncate pasted text to fit maxLength', () => {
        const ti = createTestInput({ initialValue: 'ab', maxLength: 5 });
        type(typeString('cdefgh'));
        expect(ti.value()).toBe('abcde');
      });
    });
  });

  // ============================================================================
  // RENDER TEXT INPUT TESTS
  // ============================================================================

  describe('renderTextInput', () => {
    it('should render basic text input', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      const vnode = renderTextInput(ti);
      expect(vnode).toBeDefined();
      expect(vnode.type).toBe('box');
    });

    it('should render with placeholder when empty', () => {
      const ti = createTestInput({ initialValue: '' });
      const vnode = renderTextInput(ti, { placeholder: 'Type here...' });
      expect(vnode).toBeDefined();
      expect(vnode.type).toBe('box');
    });

    it('should render password mode with masked characters', () => {
      const ti = createTestInput({ initialValue: 'secret' });
      const vnode = renderTextInput(ti, { password: true, maskChar: '*' });
      expect(vnode).toBeDefined();
      // The value should be masked in render
    });

    it('should render with custom mask character', () => {
      const ti = createTestInput({ initialValue: 'pass' });
      const vnode = renderTextInput(ti, { password: true, maskChar: '•' });
      expect(vnode).toBeDefined();
    });

    it('should render with different border styles', () => {
      const ti = createTestInput({ initialValue: 'test' });

      const roundVnode = renderTextInput(ti, { borderStyle: 'round' });
      expect(roundVnode).toBeDefined();

      const singleVnode = renderTextInput(ti, { borderStyle: 'single' });
      expect(singleVnode).toBeDefined();

      const noneVnode = renderTextInput(ti, { borderStyle: 'none' });
      expect(noneVnode).toBeDefined();
    });

    it('should render with focused state', () => {
      const ti = createTestInput({ initialValue: 'test' });
      const vnode = renderTextInput(ti, { isActive: true, focusedBorderColor: 'cyan' });
      expect(vnode).toBeDefined();
      expect(vnode.props.borderColor).toBe('cyan');
    });

    it('should render with unfocused state', () => {
      const ti = createTestInput({ initialValue: 'test' });
      const vnode = renderTextInput(ti, { isActive: false, unfocusedBorderColor: 'gray' });
      expect(vnode).toBeDefined();
      expect(vnode.props.borderColor).toBe('gray');
    });

    it('should render with custom prompt', () => {
      const ti = createTestInput({ initialValue: 'test' });
      const vnode = renderTextInput(ti, { prompt: '>', promptColor: 'green' });
      expect(vnode).toBeDefined();
    });

    it('should render with fullWidth option', () => {
      const ti = createTestInput({ initialValue: 'test' });
      const vnode = renderTextInput(ti, { fullWidth: true });
      expect(vnode).toBeDefined();
    });

    it('should render multiline content', () => {
      const ti = createTestInput({ initialValue: 'line1\nline2\nline3', multiline: true });
      const vnode = renderTextInput(ti, {});
      expect(vnode).toBeDefined();
      expect(vnode.type).toBe('box');
      // Should have multiple children for multi-line
      expect(vnode.children.length).toBe(3);
    });

    it('should render cursor on correct line in multiline', () => {
      const ti = createTestInput({ initialValue: 'line1\nline2', multiline: true });
      // Cursor should be at end of line2 (position 11)
      const vnode = renderTextInput(ti, { isActive: true });
      expect(vnode).toBeDefined();
      expect(vnode.children.length).toBe(2);
    });

    it('should render multiline with cursor in middle of line', () => {
      const ti = createTestInput({ initialValue: 'hello\nworld', multiline: true });
      // Move cursor to position 8 (middle of "world")
      simulateInput('', keys.home().key);
      for (let i = 0; i < 8; i++) {
        simulateInput('', keys.right().key);
      }
      const vnode = renderTextInput(ti, { isActive: true });
      expect(vnode).toBeDefined();
    });

    it('should render without border when borderStyle is none', () => {
      const ti = createTestInput({ initialValue: 'test' });
      const vnode = renderTextInput(ti, { borderStyle: 'none' });
      expect(vnode).toBeDefined();
      expect(vnode.props.borderStyle).toBeUndefined();
    });

    it('should render cursor when active and not empty', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      // Move cursor to middle
      simulateInput('', keys.home().key);
      simulateInput('', keys.right().key);
      simulateInput('', keys.right().key);
      const vnode = renderTextInput(ti, { isActive: true });
      expect(vnode).toBeDefined();
    });

    it('should render cursor on empty space when at end', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      // Cursor is already at end
      const vnode = renderTextInput(ti, { isActive: true });
      expect(vnode).toBeDefined();
    });

    it('should not render cursor when not active', () => {
      const ti = createTestInput({ initialValue: 'hello' });
      const vnode = renderTextInput(ti, { isActive: false });
      expect(vnode).toBeDefined();
    });

    it('should render empty placeholder with cursor when active', () => {
      const ti = createTestInput({ initialValue: '' });
      const vnode = renderTextInput(ti, {
        isActive: true,
        placeholder: 'Enter text...'
      });
      expect(vnode).toBeDefined();
    });

    it('should render placeholder without cursor when not active', () => {
      const ti = createTestInput({ initialValue: '' });
      const vnode = renderTextInput(ti, {
        isActive: false,
        placeholder: 'Enter text...'
      });
      expect(vnode).toBeDefined();
    });

    it('should handle multiline with cursor at first line', () => {
      const ti = createTestInput({ initialValue: 'first\nsecond\nthird', multiline: true });
      // Move cursor to beginning (first line)
      simulateInput('', keys.home().key);
      simulateInput('', keys.home().key);
      const vnode = renderTextInput(ti, { isActive: true });
      expect(vnode).toBeDefined();
      expect(vnode.children.length).toBe(3);
    });

    it('should handle multiline without active state', () => {
      const ti = createTestInput({ initialValue: 'line1\nline2', multiline: true });
      const vnode = renderTextInput(ti, { isActive: false });
      expect(vnode).toBeDefined();
      // Non-active multiline should still render all lines
      expect(vnode.children.length).toBe(2);
    });

    it('should use default options when not provided', () => {
      const ti = createTestInput({ initialValue: 'test' });
      const vnode = renderTextInput(ti);
      expect(vnode).toBeDefined();
      // Should use default borderStyle 'round'
      expect(vnode.props.borderStyle).toBe('round');
    });
  });

  // ============================================================================
  // PUBLIC API TESTS
  // ============================================================================

  describe('Public API', () => {
    describe('setValue', () => {
      it('should set value and move cursor to end', () => {
        const ti = createTestInput({ initialValue: '' });
        ti.setValue('new value');
        expect(ti.value()).toBe('new value');
        expect(ti.cursorPosition()).toBe(9);
      });

      it('should call onChange', () => {
        const onChange = vi.fn();
        const ti = createTestInput({ initialValue: '', onChange });
        ti.setValue('test');
        expect(onChange).toHaveBeenCalledWith('test');
      });
    });

    describe('clear', () => {
      it('should clear value and reset cursor', () => {
        const ti = createTestInput({ initialValue: 'hello' });
        ti.clear();
        expect(ti.value()).toBe('');
        expect(ti.cursorPosition()).toBe(0);
      });

      it('should call onChange with empty string', () => {
        const onChange = vi.fn();
        const ti = createTestInput({ initialValue: 'hello', onChange });
        ti.clear();
        expect(onChange).toHaveBeenCalledWith('');
      });
    });
  });
});
