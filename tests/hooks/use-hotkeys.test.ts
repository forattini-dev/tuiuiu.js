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
} from '../../src/hooks/use-hotkeys.js';
import type { HotkeyBinding } from '../../src/hooks/use-hotkeys.js';
import type { Key } from '../../src/hooks/types.js';

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
  });

  it('should normalize escape alias', () => {
    expect(parseHotkey('esc').key).toBe('escape');
  });

  it('should normalize space alias', () => {
    expect(parseHotkey('space').key).toBe(' ');
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
  const createKey = (overrides: Partial<Key> = {}): Key => ({
    upArrow: false,
    downArrow: false,
    leftArrow: false,
    rightArrow: false,
    return: false,
    escape: false,
    tab: false,
    backspace: false,
    delete: false,
    pageUp: false,
    pageDown: false,
    home: false,
    end: false,
    insert: false,
    ctrl: false,
    meta: false,
    shift: false,
    ...overrides,
  });

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
});
