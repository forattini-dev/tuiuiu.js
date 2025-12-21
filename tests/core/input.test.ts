/**
 * Tests for the Advanced Input Handling System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectKeyboardProtocol,
  setKeyboardProtocol,
  getKeyboardProtocol,
  resetKeyboardProtocol,
  enableKittyProtocol,
  disableKittyProtocol,
  queryKittyProtocol,
  parseKittyKeyEvent,
  enableMouseTracking,
  disableMouseTracking,
  parseMouseEvent,
  enableBracketedPaste,
  disableBracketedPaste,
  hasBracketedPaste,
  extractBracketedPaste,
  createInputState,
  applyInputAction,
  getSelectedText,
  parseInput,
  enableAlternateScreen,
  disableAlternateScreen,
  hideCursor,
  showCursor,
  requestCursorPosition,
  parseCursorPosition,
} from '../../src/core/input.js';

describe('Keyboard Protocol Detection', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetKeyboardProtocol();
    delete process.env.KITTY_WINDOW_ID;
    delete process.env.TERM_PROGRAM;
    delete process.env.TERM;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    resetKeyboardProtocol();
  });

  it('should detect Kitty terminal', () => {
    process.env.KITTY_WINDOW_ID = '1';
    expect(detectKeyboardProtocol()).toBe('kitty');
  });

  it('should detect WezTerm as Kitty-compatible', () => {
    process.env.TERM_PROGRAM = 'WezTerm';
    expect(detectKeyboardProtocol()).toBe('kitty');
  });

  it('should detect foot terminal as Kitty-compatible', () => {
    process.env.TERM = 'foot';
    expect(detectKeyboardProtocol()).toBe('kitty');
  });

  it('should default to legacy protocol', () => {
    expect(detectKeyboardProtocol()).toBe('legacy');
  });

  it('should allow manual override', () => {
    setKeyboardProtocol('kitty');
    expect(getKeyboardProtocol()).toBe('kitty');
    setKeyboardProtocol(null);
    expect(getKeyboardProtocol()).toBe('legacy');
  });
});

describe('Kitty Keyboard Protocol', () => {
  it('should generate enable sequence with flags', () => {
    expect(enableKittyProtocol(0b11111)).toBe('\x1b[>31u');
    expect(enableKittyProtocol(1)).toBe('\x1b[>1u');
  });

  it('should generate disable sequence', () => {
    expect(disableKittyProtocol()).toBe('\x1b[<u');
  });

  it('should generate query sequence', () => {
    expect(queryKittyProtocol()).toBe('\x1b[?u');
  });

  describe('parseKittyKeyEvent', () => {
    it('should parse simple key', () => {
      // CSI 97 u = 'a'
      const event = parseKittyKeyEvent('\x1b[97u');
      expect(event).not.toBeNull();
      expect(event!.keyCode).toBe(97);
      expect(event!.text).toBe('a');
      expect(event!.eventType).toBe('press');
    });

    it('should parse key with modifiers', () => {
      // CSI 97;5u = Ctrl+a (modifier 5 = 4+1, bit 2 = ctrl)
      const event = parseKittyKeyEvent('\x1b[97;5u');
      expect(event).not.toBeNull();
      expect(event!.keyCode).toBe(97);
      expect(event!.modifiers.ctrl).toBe(true);
      expect(event!.modifiers.shift).toBe(false);
    });

    it('should parse key with event type', () => {
      // CSI 97;1:2u = 'a' repeat (event type 2)
      const event = parseKittyKeyEvent('\x1b[97;1:2u');
      expect(event).not.toBeNull();
      expect(event!.eventType).toBe('repeat');

      // CSI 97;1:3u = 'a' release (event type 3)
      const release = parseKittyKeyEvent('\x1b[97;1:3u');
      expect(release).not.toBeNull();
      expect(release!.eventType).toBe('release');
    });

    it('should parse shifted key', () => {
      // CSI 97:65 u = 'a' with shifted 'A'
      const event = parseKittyKeyEvent('\x1b[97:65u');
      expect(event).not.toBeNull();
      expect(event!.keyCode).toBe(97);
      expect(event!.shiftedKey).toBe(65);
    });

    it('should return null for non-Kitty sequences', () => {
      expect(parseKittyKeyEvent('\x1b[A')).toBeNull();
      expect(parseKittyKeyEvent('a')).toBeNull();
    });
  });
});

describe('Mouse Input', () => {
  describe('enableMouseTracking', () => {
    it('should generate SGR mode sequence', () => {
      const seq = enableMouseTracking('sgr');
      expect(seq).toContain('\x1b[?1006h');
    });

    it('should generate any-event mode sequence', () => {
      const seq = enableMouseTracking('any');
      expect(seq).toContain('\x1b[?1003h');
    });
  });

  it('should generate disable sequence', () => {
    const seq = disableMouseTracking();
    expect(seq).toContain('\x1b[?1000l');
    expect(seq).toContain('\x1b[?1006l');
  });

  describe('parseMouseEvent', () => {
    it('should parse SGR left click', () => {
      // CSI < 0 ; 10 ; 20 M = left button down at (10, 20)
      const event = parseMouseEvent('\x1b[<0;10;20M');
      expect(event).not.toBeNull();
      expect(event!.type).toBe('down');
      expect(event!.button).toBe('left');
      expect(event!.x).toBe(10);
      expect(event!.y).toBe(20);
    });

    it('should parse SGR left release', () => {
      // CSI < 0 ; 10 ; 20 m = left button up
      const event = parseMouseEvent('\x1b[<0;10;20m');
      expect(event).not.toBeNull();
      expect(event!.type).toBe('up');
      expect(event!.button).toBe('left');
    });

    it('should parse SGR right click', () => {
      // CSI < 2 ; 10 ; 20 M = right button down
      const event = parseMouseEvent('\x1b[<2;10;20M');
      expect(event).not.toBeNull();
      expect(event!.button).toBe('right');
    });

    it('should parse SGR wheel up', () => {
      // CSI < 64 ; 10 ; 20 M = wheel up
      const event = parseMouseEvent('\x1b[<64;10;20M');
      expect(event).not.toBeNull();
      expect(event!.type).toBe('wheel');
      expect(event!.button).toBe('wheelUp');
    });

    it('should parse SGR wheel down', () => {
      // CSI < 65 ; 10 ; 20 M = wheel down
      const event = parseMouseEvent('\x1b[<65;10;20M');
      expect(event).not.toBeNull();
      expect(event!.type).toBe('wheel');
      expect(event!.button).toBe('wheelDown');
    });

    it('should parse SGR drag', () => {
      // CSI < 32 ; 10 ; 20 M = left button drag (motion flag set)
      const event = parseMouseEvent('\x1b[<32;10;20M');
      expect(event).not.toBeNull();
      expect(event!.type).toBe('drag');
      expect(event!.button).toBe('left');
    });

    it('should parse SGR with modifiers', () => {
      // CSI < 4 ; 10 ; 20 M = left with shift (bit 2)
      const event = parseMouseEvent('\x1b[<4;10;20M');
      expect(event).not.toBeNull();
      expect(event!.shift).toBe(true);

      // CSI < 8 ; 10 ; 20 M = left with alt (bit 3)
      const altEvent = parseMouseEvent('\x1b[<8;10;20M');
      expect(altEvent).not.toBeNull();
      expect(altEvent!.alt).toBe(true);

      // CSI < 16 ; 10 ; 20 M = left with ctrl (bit 4)
      const ctrlEvent = parseMouseEvent('\x1b[<16;10;20M');
      expect(ctrlEvent).not.toBeNull();
      expect(ctrlEvent!.ctrl).toBe(true);
    });

    it('should parse X10 format', () => {
      // CSI M <button+32> <x+33> <y+33>
      const event = parseMouseEvent('\x1b[M !%'); // Button 0, x=1, y=5
      expect(event).not.toBeNull();
      expect(event!.button).toBe('left');
    });

    it('should return null for non-mouse sequences', () => {
      expect(parseMouseEvent('\x1b[A')).toBeNull();
      expect(parseMouseEvent('hello')).toBeNull();
    });
  });
});

describe('Bracketed Paste', () => {
  it('should generate enable sequence', () => {
    expect(enableBracketedPaste()).toBe('\x1b[?2004h');
  });

  it('should generate disable sequence', () => {
    expect(disableBracketedPaste()).toBe('\x1b[?2004l');
  });

  it('should detect bracketed paste', () => {
    expect(hasBracketedPaste('\x1b[200~pasted text\x1b[201~')).toBe(true);
    expect(hasBracketedPaste('normal text')).toBe(false);
  });

  it('should extract paste content', () => {
    const result = extractBracketedPaste('\x1b[200~hello world\x1b[201~');
    expect(result).not.toBeNull();
    expect(result!.paste).toBe('hello world');
    expect(result!.remaining).toBe('');
  });

  it('should handle paste with surrounding content', () => {
    const result = extractBracketedPaste('before\x1b[200~pasted\x1b[201~after');
    expect(result).not.toBeNull();
    expect(result!.paste).toBe('pasted');
    expect(result!.remaining).toBe('beforeafter');
  });

  it('should handle incomplete paste', () => {
    const result = extractBracketedPaste('\x1b[200~partial paste');
    expect(result).not.toBeNull();
    expect(result!.paste).toBe('partial paste');
  });
});

describe('Input State Machine', () => {
  describe('createInputState', () => {
    it('should create empty state', () => {
      const state = createInputState();
      expect(state.buffer).toBe('');
      expect(state.cursor).toBe(0);
      expect(state.selectionStart).toBeNull();
    });

    it('should create state with initial value', () => {
      const state = createInputState('hello');
      expect(state.buffer).toBe('hello');
      expect(state.cursor).toBe(5);
    });
  });

  describe('applyInputAction', () => {
    it('should insert text', () => {
      const state = createInputState('');
      const newState = applyInputAction(state, { type: 'insert', text: 'hello' });
      expect(newState.buffer).toBe('hello');
      expect(newState.cursor).toBe(5);
    });

    it('should insert text at cursor', () => {
      const state = { ...createInputState('ac'), cursor: 1 };
      const newState = applyInputAction(state, { type: 'insert', text: 'b' });
      expect(newState.buffer).toBe('abc');
      expect(newState.cursor).toBe(2);
    });

    it('should delete backward', () => {
      const state = createInputState('hello');
      const newState = applyInputAction(state, { type: 'delete', direction: 'backward' });
      expect(newState.buffer).toBe('hell');
      expect(newState.cursor).toBe(4);
    });

    it('should delete forward', () => {
      const state = { ...createInputState('hello'), cursor: 0 };
      const newState = applyInputAction(state, { type: 'delete', direction: 'forward' });
      expect(newState.buffer).toBe('ello');
      expect(newState.cursor).toBe(0);
    });

    it('should delete selection on insert', () => {
      const state = { ...createInputState('hello'), selectionStart: 1, selectionEnd: 4 };
      const newState = applyInputAction(state, { type: 'insert', text: 'X' });
      expect(newState.buffer).toBe('hXo');
      expect(newState.selectionStart).toBeNull();
    });

    it('should delete word backward', () => {
      const state = createInputState('hello world');
      const newState = applyInputAction(state, { type: 'deleteWord', direction: 'backward' });
      expect(newState.buffer).toBe('hello ');
    });

    it('should delete word forward', () => {
      const state = { ...createInputState('hello world'), cursor: 0 };
      const newState = applyInputAction(state, { type: 'deleteWord', direction: 'forward' });
      expect(newState.buffer).toBe(' world');
    });

    it('should delete line to start', () => {
      const state = { ...createInputState('hello world'), cursor: 6 };
      const newState = applyInputAction(state, { type: 'deleteLine', direction: 'toStart' });
      expect(newState.buffer).toBe('world');
      expect(newState.cursor).toBe(0);
    });

    it('should delete line to end', () => {
      const state = { ...createInputState('hello world'), cursor: 5 };
      const newState = applyInputAction(state, { type: 'deleteLine', direction: 'toEnd' });
      expect(newState.buffer).toBe('hello');
    });

    it('should move cursor left', () => {
      const state = createInputState('hello');
      const newState = applyInputAction(state, { type: 'move', direction: 'left' });
      expect(newState.cursor).toBe(4);
    });

    it('should move cursor right', () => {
      const state = { ...createInputState('hello'), cursor: 0 };
      const newState = applyInputAction(state, { type: 'move', direction: 'right' });
      expect(newState.cursor).toBe(1);
    });

    it('should move cursor home', () => {
      const state = createInputState('hello');
      const newState = applyInputAction(state, { type: 'move', direction: 'home' });
      expect(newState.cursor).toBe(0);
    });

    it('should move cursor end', () => {
      const state = { ...createInputState('hello'), cursor: 0 };
      const newState = applyInputAction(state, { type: 'move', direction: 'end' });
      expect(newState.cursor).toBe(5);
    });

    it('should move by word left', () => {
      const state = createInputState('hello world');
      const newState = applyInputAction(state, { type: 'move', direction: 'wordLeft' });
      expect(newState.cursor).toBe(6);
    });

    it('should move by word right', () => {
      const state = { ...createInputState('hello world'), cursor: 0 };
      const newState = applyInputAction(state, { type: 'move', direction: 'wordRight' });
      expect(newState.cursor).toBe(6);
    });

    it('should select left', () => {
      const state = createInputState('hello');
      const newState = applyInputAction(state, { type: 'select', direction: 'left' });
      expect(newState.selectionStart).toBe(5);
      expect(newState.selectionEnd).toBe(4);
      expect(newState.cursor).toBe(4);
    });

    it('should select all', () => {
      const state = createInputState('hello');
      const newState = applyInputAction(state, { type: 'select', direction: 'all' });
      expect(newState.selectionStart).toBe(0);
      expect(newState.selectionEnd).toBe(5);
    });

    it('should select word', () => {
      const state = { ...createInputState('hello world'), cursor: 7 };
      const newState = applyInputAction(state, { type: 'select', direction: 'word' });
      expect(newState.selectionStart).toBe(6);
      expect(newState.selectionEnd).toBe(11);
    });

    it('should undo', () => {
      let state = createInputState('hello');
      state = applyInputAction(state, { type: 'insert', text: ' world' });
      expect(state.buffer).toBe('hello world');
      state = applyInputAction(state, { type: 'undo' });
      expect(state.buffer).toBe('hello');
    });

    it('should redo', () => {
      let state = createInputState('hello');
      state = applyInputAction(state, { type: 'insert', text: ' world' });
      state = applyInputAction(state, { type: 'undo' });
      state = applyInputAction(state, { type: 'redo' });
      expect(state.buffer).toBe('hello world');
    });

    it('should clear', () => {
      const state = createInputState('hello world');
      const newState = applyInputAction(state, { type: 'clear' });
      expect(newState.buffer).toBe('');
      expect(newState.cursor).toBe(0);
    });
  });

  describe('getSelectedText', () => {
    it('should return null when no selection', () => {
      const state = createInputState('hello');
      expect(getSelectedText(state)).toBeNull();
    });

    it('should return selected text', () => {
      const state = { ...createInputState('hello world'), selectionStart: 0, selectionEnd: 5 };
      expect(getSelectedText(state)).toBe('hello');
    });

    it('should handle reversed selection', () => {
      const state = { ...createInputState('hello world'), selectionStart: 5, selectionEnd: 0 };
      expect(getSelectedText(state)).toBe('hello');
    });
  });
});

describe('Unified Input Parser', () => {
  it('should parse bracketed paste', () => {
    const result = parseInput('\x1b[200~pasted text\x1b[201~');
    expect(result.paste).not.toBeUndefined();
    expect(result.paste!.text).toBe('pasted text');
    expect(result.paste!.isBracketed).toBe(true);
  });

  it('should parse mouse event', () => {
    const result = parseInput('\x1b[<0;10;20M');
    expect(result.mouse).not.toBeUndefined();
    expect(result.mouse!.button).toBe('left');
  });

  it('should parse simple character', () => {
    const result = parseInput('a');
    expect(result.keys.length).toBe(1);
    expect(result.keys[0]!.keyCode).toBe(97);
    expect(result.keys[0]!.text).toBe('a');
  });

  it('should parse ctrl+letter', () => {
    const result = parseInput('\x01'); // Ctrl+A
    expect(result.keys.length).toBe(1);
    expect(result.keys[0]!.modifiers.ctrl).toBe(true);
  });

  it('should parse escape', () => {
    const result = parseInput('\x1b');
    expect(result.keys.length).toBe(1);
    expect(result.keys[0]!.keyCode).toBe(27);
  });
});

describe('Terminal Control Sequences', () => {
  it('should generate alternate screen sequences', () => {
    expect(enableAlternateScreen()).toBe('\x1b[?1049h');
    expect(disableAlternateScreen()).toBe('\x1b[?1049l');
  });

  it('should generate cursor visibility sequences', () => {
    expect(hideCursor()).toBe('\x1b[?25l');
    expect(showCursor()).toBe('\x1b[?25h');
  });

  it('should generate cursor position request', () => {
    expect(requestCursorPosition()).toBe('\x1b[6n');
  });

  it('should parse cursor position response', () => {
    const pos = parseCursorPosition('\x1b[24;80R');
    expect(pos).not.toBeNull();
    expect(pos!.row).toBe(24);
    expect(pos!.col).toBe(80);
  });

  it('should return null for invalid cursor response', () => {
    expect(parseCursorPosition('invalid')).toBeNull();
    expect(parseCursorPosition('\x1b[A')).toBeNull();
  });
});
