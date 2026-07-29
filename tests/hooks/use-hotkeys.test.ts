/**
 * Hotkeys Hook Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseHotkey,
  parseHotkeys,
  matchesHotkey,
  formatHotkey,
  formatHotkeyPlatform,
  registerHotkey,
  getRegisteredHotkeys,
  setHotkeyScope,
  getHotkeyScope,
  resetHotkeyScope,
  pushHotkeyScope,
  popHotkeyScope,
  getHotkeyScopeDepth,
  triggerHotkey,
  isMac,
} from '../../src/hooks/use-hotkeys.js';
import type { HotkeyBinding } from '../../src/hooks/use-hotkeys.js';
import type { Key } from '../../src/hooks/types.js';
import { createKey as createKeyboardKey } from '../helpers/keyboard.js';

describe('parseHotkey', () => {
  it('should parse simple key', () => {
    const binding = parseHotkey('a');
    expect(binding).toEqual({
      key: 'a',
      ctrl: false,
      alt: false,
      shift: false,
      meta: false,
    });
  });

  it('should parse ctrl+key', () => {
    const binding = parseHotkey('ctrl+s');
    expect(binding).toEqual({
      key: 's',
      ctrl: true,
      alt: false,
      shift: false,
      meta: false,
    });
  });

  it('should parse control alias', () => {
    const binding = parseHotkey('control+s');
    expect(binding.ctrl).toBe(true);
  });

  it('should parse ctrl+shift+key', () => {
    const binding = parseHotkey('ctrl+shift+p');
    expect(binding).toEqual({
      key: 'p',
      ctrl: true,
      alt: false,
      shift: true,
      meta: false,
    });
  });

  it('should parse alt+key', () => {
    const binding = parseHotkey('alt+f4');
    expect(binding).toEqual({
      key: 'f4',
      ctrl: false,
      alt: true,
      shift: false,
      meta: false,
    });
  });

  it('should parse option alias for alt', () => {
    const binding = parseHotkey('option+x');
    expect(binding.alt).toBe(true);
  });

  it('should parse cmd/meta+key', () => {
    const binding = parseHotkey('cmd+s');
    expect(binding).toEqual({
      key: 's',
      ctrl: false,
      alt: false,
      shift: false,
      meta: true,
    });
  });

  it('should parse command alias', () => {
    const binding = parseHotkey('command+s');
    expect(binding.meta).toBe(true);
  });

  it('should parse meta directly', () => {
    const binding = parseHotkey('meta+s');
    expect(binding.meta).toBe(true);
  });

  it('should parse all modifiers', () => {
    const binding = parseHotkey('ctrl+alt+shift+meta+x');
    expect(binding).toEqual({
      key: 'x',
      ctrl: true,
      alt: true,
      shift: true,
      meta: true,
    });
  });

  it('should normalize arrow key aliases', () => {
    expect(parseHotkey('up').key).toBe('upArrow');
    expect(parseHotkey('down').key).toBe('downArrow');
    expect(parseHotkey('left').key).toBe('leftArrow');
    expect(parseHotkey('right').key).toBe('rightArrow');
    expect(parseHotkey('arrowup').key).toBe('upArrow');
    expect(parseHotkey('arrowdown').key).toBe('downArrow');
    expect(parseHotkey('arrowleft').key).toBe('leftArrow');
    expect(parseHotkey('arrowright').key).toBe('rightArrow');
  });

  it('should normalize escape alias', () => {
    expect(parseHotkey('esc').key).toBe('escape');
  });

  it('should normalize space alias', () => {
    expect(parseHotkey('space').key).toBe(' ');
  });

  it('should normalize other key aliases', () => {
    expect(parseHotkey('del').key).toBe('delete');
    expect(parseHotkey('ins').key).toBe('insert');
    expect(parseHotkey('pgup').key).toBe('pageUp');
    expect(parseHotkey('pgdn').key).toBe('pageDown');
    expect(parseHotkey('pageup').key).toBe('pageUp');
    expect(parseHotkey('pagedown').key).toBe('pageDown');
    expect(parseHotkey('return').key).toBe('enter');
  });

  it('should be case insensitive', () => {
    const binding = parseHotkey('CTRL+SHIFT+S');
    expect(binding).toEqual({
      key: 's',
      ctrl: true,
      alt: false,
      shift: true,
      meta: false,
    });
  });
});

describe('parseHotkeys', () => {
  it('should parse comma-separated hotkeys', () => {
    const bindings = parseHotkeys('ctrl+s, cmd+s');
    expect(bindings).toHaveLength(2);
    expect(bindings[0]!.ctrl).toBe(true);
    expect(bindings[1]!.meta).toBe(true);
  });

  it('should parse array of hotkeys', () => {
    const bindings = parseHotkeys(['ctrl+z', 'cmd+z']);
    expect(bindings).toHaveLength(2);
    expect(bindings[0]!.key).toBe('z');
    expect(bindings[1]!.key).toBe('z');
  });
});

describe('matchesHotkey', () => {
  const createKey = (overrides: Partial<Key> = {}): Key =>
    createKeyboardKey(overrides);

  it('should match simple letter', () => {
    const binding = parseHotkey('a');
    expect(matchesHotkey('a', createKey(), binding)).toBe(true);
    expect(matchesHotkey('b', createKey(), binding)).toBe(false);
  });

  it('should match ctrl+letter', () => {
    const binding = parseHotkey('ctrl+s');
    // Ctrl+S is ASCII 19 (\x13)
    expect(matchesHotkey('\x13', createKey({ ctrl: true }), binding)).toBe(true);
    expect(matchesHotkey('s', createKey(), binding)).toBe(false);
  });

  it('should match arrow keys', () => {
    const upBinding = parseHotkey('up');
    expect(matchesHotkey('', createKey({ upArrow: true }), upBinding)).toBe(true);
    expect(matchesHotkey('', createKey({ downArrow: true }), upBinding)).toBe(false);
  });

  it('should match escape', () => {
    const binding = parseHotkey('escape');
    expect(matchesHotkey('\x1b', createKey({ escape: true }), binding)).toBe(true);
  });

  it('should match enter/return', () => {
    const binding = parseHotkey('enter');
    expect(matchesHotkey('\r', createKey({ return: true }), binding)).toBe(true);
  });

  it('should require all modifiers to match', () => {
    const binding = parseHotkey('ctrl+shift+s');
    expect(matchesHotkey('\x13', createKey({ ctrl: true, shift: true }), binding)).toBe(true);
    expect(matchesHotkey('\x13', createKey({ ctrl: true }), binding)).toBe(false);
    expect(matchesHotkey('\x13', createKey({ shift: true }), binding)).toBe(false);
  });

  it('should match tab key', () => {
    const binding = parseHotkey('tab');
    expect(matchesHotkey('\t', createKey({ tab: true }), binding)).toBe(true);
    expect(matchesHotkey('\t', createKey(), binding)).toBe(false);
  });

  it('should match backspace key', () => {
    const binding = parseHotkey('backspace');
    expect(matchesHotkey('\x7f', createKey({ backspace: true }), binding)).toBe(true);
    expect(matchesHotkey('\x7f', createKey(), binding)).toBe(false);
  });

  it('should match delete key', () => {
    const binding = parseHotkey('delete');
    expect(matchesHotkey('', createKey({ delete: true }), binding)).toBe(true);
    expect(matchesHotkey('', createKey(), binding)).toBe(false);
  });

  it('should match pageUp key', () => {
    const binding = parseHotkey('pageup');
    expect(matchesHotkey('', createKey({ pageUp: true }), binding)).toBe(true);
    expect(matchesHotkey('', createKey(), binding)).toBe(false);
  });

  it('should match pageDown key', () => {
    const binding = parseHotkey('pagedown');
    expect(matchesHotkey('', createKey({ pageDown: true }), binding)).toBe(true);
    expect(matchesHotkey('', createKey(), binding)).toBe(false);
  });

  it('should match home key', () => {
    const binding = parseHotkey('home');
    expect(matchesHotkey('', createKey({ home: true }), binding)).toBe(true);
    expect(matchesHotkey('', createKey(), binding)).toBe(false);
  });

  it('should match end key', () => {
    const binding = parseHotkey('end');
    expect(matchesHotkey('', createKey({ end: true }), binding)).toBe(true);
    expect(matchesHotkey('', createKey(), binding)).toBe(false);
  });

  it('should match insert key', () => {
    const binding = parseHotkey('insert');
    expect(matchesHotkey('', createKey({ insert: true }), binding)).toBe(true);
    expect(matchesHotkey('', createKey(), binding)).toBe(false);
  });

  it('should match f-keys', () => {
    for (let i = 1; i <= 12; i++) {
      const binding = parseHotkey(`f${i}`);
      const keyProps: Partial<Key> = { [`f${i}` as keyof Key]: true } as any;
      expect(matchesHotkey('', createKey(keyProps), binding)).toBe(true);
    }
  });

  it('should not match incorrect f-key', () => {
    const binding = parseHotkey('f1');
    const keyProps: Partial<Key> = { f2: true } as any;
    expect(matchesHotkey('', createKey(keyProps), binding)).toBe(false);
  });

  it('should check alt via meta key in terminal', () => {
    const binding = parseHotkey('alt+x');
    expect(matchesHotkey('x', createKey({ meta: true }), binding)).toBe(true);
    expect(matchesHotkey('x', createKey(), binding)).toBe(false);
  });

  it('should match left and right arrow keys', () => {
    const leftBinding = parseHotkey('left');
    expect(matchesHotkey('', createKey({ leftArrow: true }), leftBinding)).toBe(true);

    const rightBinding = parseHotkey('right');
    expect(matchesHotkey('', createKey({ rightArrow: true }), rightBinding)).toBe(true);
  });

  it('should match return/enter key', () => {
    const binding = parseHotkey('return');
    expect(matchesHotkey('\r', createKey({ return: true }), binding)).toBe(true);
  });

  it('should match ctrl+letter codes', () => {
    // Ctrl+A is \x01, Ctrl+B is \x02, etc.
    const bindingA = parseHotkey('ctrl+a');
    expect(matchesHotkey('\x01', createKey({ ctrl: true }), bindingA)).toBe(true);

    const bindingZ = parseHotkey('ctrl+z');
    expect(matchesHotkey('\x1a', createKey({ ctrl: true }), bindingZ)).toBe(true);
  });

  it('should not match ctrl+letter for out of range codes', () => {
    // Characters outside a-z range should fall back to direct match
    const binding = parseHotkey('ctrl+1');
    expect(matchesHotkey('1', createKey({ ctrl: true }), binding)).toBe(true);
  });
});

describe('formatHotkey', () => {
  it('should format simple key', () => {
    expect(formatHotkey('a')).toBe('A');
  });

  it('should format with modifiers', () => {
    expect(formatHotkey('ctrl+s')).toBe('Ctrl+S');
    expect(formatHotkey('ctrl+shift+p')).toBe('Ctrl+Shift+P');
    expect(formatHotkey('alt+f4')).toBe('Alt+F4');
  });

  it('should format special keys', () => {
    expect(formatHotkey('escape')).toBe('Escape');
    expect(formatHotkey('enter')).toBe('Enter');
  });
});

describe('scope management', () => {
  beforeEach(() => {
    resetHotkeyScope();
  });

  it('should start with global scope', () => {
    expect(getHotkeyScope()).toBe('global');
  });

  it('should change scope', () => {
    setHotkeyScope('modal');
    expect(getHotkeyScope()).toBe('modal');
  });

  it('should reset to global', () => {
    setHotkeyScope('modal');
    resetHotkeyScope();
    expect(getHotkeyScope()).toBe('global');
  });
});

describe('registerHotkey', () => {
  beforeEach(() => {
    resetHotkeyScope();
  });

  it('should register and unregister hotkey', () => {
    const handler = vi.fn();
    const unregister = registerHotkey('ctrl+t', handler, {
      description: 'Test hotkey',
    });

    const registered = getRegisteredHotkeys();
    expect(registered.some(h => h.description === 'Test hotkey')).toBe(true);

    unregister();

    const afterUnregister = getRegisteredHotkeys();
    expect(afterUnregister.some(h => h.description === 'Test hotkey')).toBe(false);
  });

  it('should format registered hotkeys for display', () => {
    const handler = vi.fn();
    const unregister = registerHotkey('ctrl+shift+s', handler, {
      description: 'Save all',
      scope: 'editor',
    });

    const registered = getRegisteredHotkeys();
    const entry = registered.find(h => h.description === 'Save all');
    expect(entry).toBeDefined();
    expect(entry!.keys).toBe('Ctrl+Shift+S');
    expect(entry!.scope).toBe('editor');

    unregister();
  });

  it('should register with default options', () => {
    const handler = vi.fn();
    const unregister = registerHotkey('ctrl+r', handler);

    const registered = getRegisteredHotkeys();
    const entry = registered.find(h => h.keys === 'Ctrl+R');
    expect(entry).toBeDefined();
    expect(entry!.scope).toBe('global');
    expect(entry!.description).toBe('');

    unregister();
  });

  it('should register with array of hotkeys', () => {
    const handler = vi.fn();
    const unregister = registerHotkey(['ctrl+z', 'cmd+z'], handler, {
      description: 'Undo',
    });

    const registered = getRegisteredHotkeys();
    const entry = registered.find(h => h.description === 'Undo');
    expect(entry).toBeDefined();
    expect(entry!.keys).toBe('Ctrl+Z, Cmd+Z');

    unregister();
  });

  it('should format hotkey with alt modifier', () => {
    const handler = vi.fn();
    const unregister = registerHotkey('alt+f4', handler, {
      description: 'Close',
    });

    const registered = getRegisteredHotkeys();
    const entry = registered.find(h => h.description === 'Close');
    expect(entry).toBeDefined();
    expect(entry!.keys).toBe('Alt+F4');

    unregister();
  });
});

describe('scope stack', () => {
  beforeEach(() => {
    resetHotkeyScope();
  });

  it('should push scope onto stack', () => {
    expect(getHotkeyScope()).toBe('global');
    expect(getHotkeyScopeDepth()).toBe(0);

    pushHotkeyScope('modal');
    expect(getHotkeyScope()).toBe('modal');
    expect(getHotkeyScopeDepth()).toBe(1);
  });

  it('should pop scope from stack', () => {
    pushHotkeyScope('modal');
    pushHotkeyScope('command-palette');
    expect(getHotkeyScope()).toBe('command-palette');
    expect(getHotkeyScopeDepth()).toBe(2);

    const popped = popHotkeyScope();
    expect(popped).toBe('command-palette');
    expect(getHotkeyScope()).toBe('modal');
    expect(getHotkeyScopeDepth()).toBe(1);
  });

  it('should return to global when stack is empty', () => {
    pushHotkeyScope('modal');
    popHotkeyScope();
    expect(getHotkeyScope()).toBe('global');
    expect(getHotkeyScopeDepth()).toBe(0);

    // Popping empty stack should still return global
    const popped = popHotkeyScope();
    expect(popped).toBe('global');
    expect(getHotkeyScope()).toBe('global');
  });

  it('should handle nested push/pop correctly', () => {
    pushHotkeyScope('modal1');
    pushHotkeyScope('modal2');
    pushHotkeyScope('modal3');
    expect(getHotkeyScopeDepth()).toBe(3);

    popHotkeyScope();
    expect(getHotkeyScope()).toBe('modal2');

    popHotkeyScope();
    expect(getHotkeyScope()).toBe('modal1');

    popHotkeyScope();
    expect(getHotkeyScope()).toBe('global');
  });

  it('should reset scope and clear stack', () => {
    pushHotkeyScope('modal1');
    pushHotkeyScope('modal2');
    expect(getHotkeyScopeDepth()).toBe(2);

    resetHotkeyScope();
    expect(getHotkeyScope()).toBe('global');
    expect(getHotkeyScopeDepth()).toBe(0);
  });
});

describe('triggerHotkey', () => {
  const createKey = (overrides: Partial<Key> = {}): Key =>
    createKeyboardKey(overrides);

  beforeEach(() => {
    resetHotkeyScope();
  });

  it('should trigger matching global hotkey', () => {
    const handler = vi.fn();
    const unregister = registerHotkey('a', handler);

    const triggered = triggerHotkey('a', createKey());
    expect(triggered).toBe(true);
    expect(handler).toHaveBeenCalled();

    unregister();
  });

  it('should not trigger non-matching hotkey', () => {
    const handler = vi.fn();
    const unregister = registerHotkey('a', handler);

    const triggered = triggerHotkey('b', createKey());
    expect(triggered).toBe(false);
    expect(handler).not.toHaveBeenCalled();

    unregister();
  });

  it('should respect scope', () => {
    const handler = vi.fn();
    const unregister = registerHotkey('a', handler, { scope: 'modal' });

    // Not in modal scope
    let triggered = triggerHotkey('a', createKey());
    expect(triggered).toBe(false);
    expect(handler).not.toHaveBeenCalled();

    // In modal scope
    setHotkeyScope('modal');
    triggered = triggerHotkey('a', createKey());
    expect(triggered).toBe(true);
    expect(handler).toHaveBeenCalled();

    unregister();
  });

  it('should trigger global hotkey regardless of scope', () => {
    const handler = vi.fn();
    const unregister = registerHotkey('a', handler, { scope: 'global' });

    setHotkeyScope('modal');
    const triggered = triggerHotkey('a', createKey());
    expect(triggered).toBe(true);
    expect(handler).toHaveBeenCalled();

    unregister();
  });

  it('should trigger with multiple bindings', () => {
    const handler = vi.fn();
    const unregister = registerHotkey(['a', 'b'], handler);

    expect(triggerHotkey('a', createKey())).toBe(true);
    expect(triggerHotkey('b', createKey())).toBe(true);
    expect(handler).toHaveBeenCalledTimes(2);

    unregister();
  });

  it('should trigger first matching hotkey only', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const unregister1 = registerHotkey('a', handler1);
    const unregister2 = registerHotkey('a', handler2);

    triggerHotkey('a', createKey());
    expect(handler1).toHaveBeenCalled();
    expect(handler2).not.toHaveBeenCalled();

    unregister1();
    unregister2();
  });
});

describe('formatHotkeyPlatform', () => {
  it('should return formatted hotkey', () => {
    const formatted = formatHotkeyPlatform('ctrl+shift+s');
    expect(formatted).toBeDefined();
    // On non-Mac, should be Ctrl+Shift+S
    // On Mac, should be ⌘⇧S (if isMac returns true)
  });

  it('should format alt key', () => {
    const formatted = formatHotkeyPlatform('alt+x');
    expect(formatted).toBeDefined();
  });
});

describe('isMac', () => {
  it('should return boolean', () => {
    const result = isMac();
    expect(typeof result).toBe('boolean');
  });
});
