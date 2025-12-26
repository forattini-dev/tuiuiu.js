/**
 * Tests for useInput hook and parseKeypress function
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parseKeypress, useInput, useModalInput, useCriticalInput } from '../../src/hooks/use-input.js';
import {
  beginRender,
  endRender,
  resetHookState,
  clearInputHandlers,
  getInputHandlerCount,
} from '../../src/hooks/context.js';

describe('parseKeypress', () => {
  describe('simple keys', () => {
    it('parses carriage return', () => {
      const { input, key } = parseKeypress('\r');
      expect(key.return).toBe(true);
      expect(input).toBe('');
    });

    it('parses newline', () => {
      const { input, key } = parseKeypress('\n');
      expect(key.return).toBe(true);
    });

    it('parses tab', () => {
      const { input, key } = parseKeypress('\t');
      expect(key.tab).toBe(true);
    });

    it('parses backspace (DEL)', () => {
      const { input, key } = parseKeypress('\x7f');
      expect(key.backspace).toBe(true);
    });

    it('parses backspace with meta', () => {
      const { input, key } = parseKeypress('\x1b\x7f');
      expect(key.backspace).toBe(true);
      expect(key.meta).toBe(true);
    });

    it('parses backspace (BS)', () => {
      const { input, key } = parseKeypress('\b');
      expect(key.backspace).toBe(true);
    });

    it('parses escape', () => {
      const { input, key } = parseKeypress('\x1b');
      expect(key.escape).toBe(true);
    });

    it('parses double escape (meta)', () => {
      const { input, key } = parseKeypress('\x1b\x1b');
      expect(key.escape).toBe(true);
      expect(key.meta).toBe(true);
    });

    it('parses space', () => {
      const { input, key } = parseKeypress(' ');
      expect(input).toBe(' ');
    });

    it('parses space with meta', () => {
      const { input, key } = parseKeypress('\x1b ');
      expect(input).toBe(' ');
      expect(key.meta).toBe(true);
    });
  });

  describe('ctrl+letter', () => {
    it('parses ctrl+a', () => {
      const { input, key } = parseKeypress('\x01');
      expect(key.ctrl).toBe(true);
      expect(input).toBe('a');
    });

    it('parses ctrl+c', () => {
      const { input, key } = parseKeypress('\x03');
      expect(key.ctrl).toBe(true);
      expect(input).toBe('c');
    });

    it('parses ctrl+z', () => {
      const { input, key } = parseKeypress('\x1a');
      expect(key.ctrl).toBe(true);
      expect(input).toBe('z');
    });
  });

  describe('regular characters', () => {
    it('parses numbers', () => {
      for (let i = 0; i <= 9; i++) {
        const { input, key } = parseKeypress(String(i));
        expect(input).toBe(String(i));
      }
    });

    it('parses lowercase letters', () => {
      for (let code = 'a'.charCodeAt(0); code <= 'z'.charCodeAt(0); code++) {
        const char = String.fromCharCode(code);
        const { input, key } = parseKeypress(char);
        expect(input).toBe(char);
      }
    });

    it('parses uppercase letters with shift', () => {
      const { input, key } = parseKeypress('A');
      expect(input).toBe('a');
      expect(key.shift).toBe(true);
    });

    it('parses special characters', () => {
      const { input, key } = parseKeypress('!');
      expect(input).toBe('!');
    });
  });

  describe('meta+character', () => {
    it('parses meta+letter', () => {
      const { input, key } = parseKeypress('\x1ba');
      expect(input).toBe('a');
      expect(key.meta).toBe(true);
    });

    it('parses meta+uppercase letter', () => {
      const { input, key } = parseKeypress('\x1bA');
      expect(input).toBe('a');
      expect(key.meta).toBe(true);
      expect(key.shift).toBe(true);
    });

    it('parses meta+number', () => {
      const { input, key } = parseKeypress('\x1b5');
      expect(input).toBe('5');
      expect(key.meta).toBe(true);
    });
  });

  describe('arrow keys (xterm)', () => {
    it('parses up arrow', () => {
      const { input, key } = parseKeypress('\x1b[A');
      expect(key.upArrow).toBe(true);
    });

    it('parses down arrow', () => {
      const { input, key } = parseKeypress('\x1b[B');
      expect(key.downArrow).toBe(true);
    });

    it('parses right arrow', () => {
      const { input, key } = parseKeypress('\x1b[C');
      expect(key.rightArrow).toBe(true);
    });

    it('parses left arrow', () => {
      const { input, key } = parseKeypress('\x1b[D');
      expect(key.leftArrow).toBe(true);
    });
  });

  describe('arrow keys (gnome)', () => {
    it('parses up arrow (gnome)', () => {
      const { input, key } = parseKeypress('\x1bOA');
      expect(key.upArrow).toBe(true);
    });

    it('parses down arrow (gnome)', () => {
      const { input, key } = parseKeypress('\x1bOB');
      expect(key.downArrow).toBe(true);
    });

    it('parses right arrow (gnome)', () => {
      const { input, key } = parseKeypress('\x1bOC');
      expect(key.rightArrow).toBe(true);
    });

    it('parses left arrow (gnome)', () => {
      const { input, key } = parseKeypress('\x1bOD');
      expect(key.leftArrow).toBe(true);
    });
  });

  describe('navigation keys', () => {
    it('parses home', () => {
      const { input, key } = parseKeypress('\x1b[H');
      expect(key.home).toBe(true);
    });

    it('parses end', () => {
      const { input, key } = parseKeypress('\x1b[F');
      expect(key.end).toBe(true);
    });

    it('parses insert', () => {
      const { input, key } = parseKeypress('\x1b[2~');
      expect(key.insert).toBe(true);
    });

    it('parses delete', () => {
      const { input, key } = parseKeypress('\x1b[3~');
      expect(key.delete).toBe(true);
    });

    it('parses page up', () => {
      const { input, key } = parseKeypress('\x1b[5~');
      expect(key.pageUp).toBe(true);
    });

    it('parses page down', () => {
      const { input, key } = parseKeypress('\x1b[6~');
      expect(key.pageDown).toBe(true);
    });

    it('parses home (xterm alternate)', () => {
      const { input, key } = parseKeypress('\x1b[1~');
      expect(key.home).toBe(true);
    });

    it('parses end (xterm alternate)', () => {
      const { input, key } = parseKeypress('\x1b[4~');
      expect(key.end).toBe(true);
    });
  });

  describe('function keys (xterm)', () => {
    it('parses f1 (OP)', () => {
      const { input, key } = parseKeypress('\x1bOP');
      expect(key.f1).toBe(true);
    });

    it('parses f2 (OQ)', () => {
      const { input, key } = parseKeypress('\x1bOQ');
      expect(key.f2).toBe(true);
    });

    it('parses f3 (OR)', () => {
      const { input, key } = parseKeypress('\x1bOR');
      expect(key.f3).toBe(true);
    });

    it('parses f4 (OS)', () => {
      const { input, key } = parseKeypress('\x1bOS');
      expect(key.f4).toBe(true);
    });

    it('parses f5', () => {
      const { input, key } = parseKeypress('\x1b[15~');
      expect(key.f5).toBe(true);
    });

    it('parses f6', () => {
      const { input, key } = parseKeypress('\x1b[17~');
      expect(key.f6).toBe(true);
    });

    it('parses f7', () => {
      const { input, key } = parseKeypress('\x1b[18~');
      expect(key.f7).toBe(true);
    });

    it('parses f8', () => {
      const { input, key } = parseKeypress('\x1b[19~');
      expect(key.f8).toBe(true);
    });

    it('parses f9', () => {
      const { input, key } = parseKeypress('\x1b[20~');
      expect(key.f9).toBe(true);
    });

    it('parses f10', () => {
      const { input, key } = parseKeypress('\x1b[21~');
      expect(key.f10).toBe(true);
    });

    it('parses f11', () => {
      const { input, key } = parseKeypress('\x1b[23~');
      expect(key.f11).toBe(true);
    });

    it('parses f12', () => {
      const { input, key } = parseKeypress('\x1b[24~');
      expect(key.f12).toBe(true);
    });
  });

  describe('function keys (rxvt)', () => {
    it('parses f1 (rxvt)', () => {
      const { input, key } = parseKeypress('\x1b[11~');
      expect(key.f1).toBe(true);
    });

    it('parses f2 (rxvt)', () => {
      const { input, key } = parseKeypress('\x1b[12~');
      expect(key.f2).toBe(true);
    });
  });

  describe('function keys (cygwin)', () => {
    it('parses f1 (cygwin)', () => {
      const { input, key } = parseKeypress('\x1b[[A');
      expect(key.f1).toBe(true);
    });

    it('parses f2 (cygwin)', () => {
      const { input, key } = parseKeypress('\x1b[[B');
      expect(key.f2).toBe(true);
    });

    it('parses f3 (cygwin)', () => {
      const { input, key } = parseKeypress('\x1b[[C');
      expect(key.f3).toBe(true);
    });

    it('parses f4 (cygwin)', () => {
      const { input, key } = parseKeypress('\x1b[[D');
      expect(key.f4).toBe(true);
    });

    it('parses f5 (cygwin)', () => {
      const { input, key } = parseKeypress('\x1b[[E');
      expect(key.f5).toBe(true);
    });
  });

  describe('rxvt navigation keys', () => {
    it('parses home (rxvt)', () => {
      const { input, key } = parseKeypress('\x1b[7~');
      expect(key.home).toBe(true);
    });

    it('parses end (rxvt)', () => {
      const { input, key } = parseKeypress('\x1b[8~');
      expect(key.end).toBe(true);
    });
  });

  describe('shift+key (rxvt)', () => {
    it('parses shift+up', () => {
      const { input, key } = parseKeypress('\x1b[a');
      expect(key.upArrow).toBe(true);
      expect(key.shift).toBe(true);
    });

    it('parses shift+down', () => {
      const { input, key } = parseKeypress('\x1b[b');
      expect(key.downArrow).toBe(true);
      expect(key.shift).toBe(true);
    });

    it('parses shift+tab', () => {
      const { input, key } = parseKeypress('\x1b[Z');
      expect(key.tab).toBe(true);
      expect(key.shift).toBe(true);
    });
  });

  describe('ctrl+key (rxvt)', () => {
    it('parses ctrl+up', () => {
      const { input, key } = parseKeypress('\x1bOa');
      expect(key.upArrow).toBe(true);
      expect(key.ctrl).toBe(true);
    });

    it('parses ctrl+down', () => {
      const { input, key } = parseKeypress('\x1bOb');
      expect(key.downArrow).toBe(true);
      expect(key.ctrl).toBe(true);
    });
  });

  describe('gnome navigation keys', () => {
    it('parses home (gnome)', () => {
      const { input, key } = parseKeypress('\x1bOH');
      expect(key.home).toBe(true);
    });

    it('parses end (gnome)', () => {
      const { input, key } = parseKeypress('\x1bOF');
      expect(key.end).toBe(true);
    });

    it('parses clear (gnome)', () => {
      const { input, key } = parseKeypress('\x1bOE');
      expect(key.clear).toBe(true);
    });
  });

  describe('modifiers with escape sequences', () => {
    it('parses arrow with modifier', () => {
      // CSI 1;2 A = Shift+Up
      const { input, key } = parseKeypress('\x1b[1;2A');
      expect(key.upArrow).toBe(true);
      expect(key.shift).toBe(true);
    });

    it('parses arrow with ctrl modifier', () => {
      // CSI 1;5 A = Ctrl+Up
      const { input, key } = parseKeypress('\x1b[1;5A');
      expect(key.upArrow).toBe(true);
      expect(key.ctrl).toBe(true);
    });

    it('parses double escape as option key', () => {
      const { input, key } = parseKeypress('\x1b\x1b[A');
      expect(key.upArrow).toBe(true);
      expect(key.option).toBe(true);
    });
  });

  describe('buffer input', () => {
    it('handles buffer input', () => {
      const { input, key } = parseKeypress(Buffer.from('a'));
      expect(input).toBe('a');
    });

    it('handles high-bit meta prefix', () => {
      // Buffer with single byte > 127 (meta+a = 225 = 'a' + 128)
      const { input, key } = parseKeypress(Buffer.from([225]));
      // This should be converted to ESC + 'a'
      expect(key.meta).toBe(true);
    });
  });

  describe('multi-character input', () => {
    it('handles pasted text', () => {
      const { input, key } = parseKeypress('hello world');
      expect(input).toBe('hello world');
    });
  });
});

describe('useInput hook', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  it('registers handler on mount', () => {
    const handler = vi.fn();

    beginRender();
    useInput(handler);
    endRender();

    expect(getInputHandlerCount()).toBe(1);
  });

  it('does not register when isActive is false', () => {
    const handler = vi.fn();

    beginRender();
    useInput(handler, { isActive: false });
    endRender();

    expect(getInputHandlerCount()).toBe(0);
  });

  it('toggles registration based on isActive', () => {
    const handler = vi.fn();

    // Start active
    beginRender();
    useInput(handler, { isActive: true });
    endRender();
    expect(getInputHandlerCount()).toBe(1);

    // Deactivate
    beginRender();
    useInput(handler, { isActive: false });
    endRender();
    expect(getInputHandlerCount()).toBe(0);

    // Reactivate
    beginRender();
    useInput(handler, { isActive: true });
    endRender();
    expect(getInputHandlerCount()).toBe(1);
  });

  it('re-registers when priority changes', () => {
    const handler = vi.fn();

    // Start with normal priority
    beginRender();
    useInput(handler, { isActive: true, priority: 'normal' });
    endRender();
    expect(getInputHandlerCount()).toBe(1);

    // Change to modal priority
    beginRender();
    useInput(handler, { isActive: true, priority: 'modal' });
    endRender();
    expect(getInputHandlerCount()).toBe(1);
  });

  it('re-registers when stopPropagation changes', () => {
    const handler = vi.fn();

    // Start without stopPropagation
    beginRender();
    useInput(handler, { isActive: true, stopPropagation: false });
    endRender();
    expect(getInputHandlerCount()).toBe(1);

    // Enable stopPropagation
    beginRender();
    useInput(handler, { isActive: true, stopPropagation: true });
    endRender();
    expect(getInputHandlerCount()).toBe(1);
  });
});

describe('useModalInput hook', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  it('registers handler with modal priority', () => {
    const handler = vi.fn();

    beginRender();
    useModalInput(handler);
    endRender();

    expect(getInputHandlerCount()).toBe(1);
  });

  it('respects isActive option', () => {
    const handler = vi.fn();

    beginRender();
    useModalInput(handler, { isActive: false });
    endRender();

    expect(getInputHandlerCount()).toBe(0);
  });
});

describe('useCriticalInput hook', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  afterEach(() => {
    resetHookState();
    clearInputHandlers();
  });

  it('registers handler with critical priority', () => {
    const handler = vi.fn();

    beginRender();
    useCriticalInput(handler);
    endRender();

    expect(getInputHandlerCount()).toBe(1);
  });

  it('respects isActive option', () => {
    const handler = vi.fn();

    beginRender();
    useCriticalInput(handler, { isActive: false });
    endRender();

    expect(getInputHandlerCount()).toBe(0);
  });
});
