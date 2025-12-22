/**
 * Tests for Key Binding Registry
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseKeyCombo,
  keyComboToString,
  keyComboEquals,
  keyComboFromEvent,
  formatKeyCombo,
  formatKeyString,
  KeyBindingRegistry,
  getKeyBindingRegistry,
  resetKeyBindingRegistry,
  registerKeybinding,
  unregisterKeybinding,
  setKeyMode,
  getKeyMode,
  handleKeyEvent,
  useKeyBindings,
  resetBindingIdCounter,
} from '../../src/core/keybindings.js';

describe('Key Parsing', () => {
  describe('parseKeyCombo', () => {
    it('should parse simple keys', () => {
      const combo = parseKeyCombo('k');
      expect(combo.key).toBe('k');
      expect(combo.modifiers.ctrl).toBeFalsy();
      expect(combo.modifiers.alt).toBeFalsy();
      expect(combo.modifiers.shift).toBeFalsy();
      expect(combo.modifiers.meta).toBeFalsy();
    });

    it('should parse ctrl modifier', () => {
      const combo = parseKeyCombo('ctrl+k');
      expect(combo.key).toBe('k');
      expect(combo.modifiers.ctrl).toBe(true);
    });

    it('should parse alt modifier', () => {
      const combo = parseKeyCombo('alt+x');
      expect(combo.key).toBe('x');
      expect(combo.modifiers.alt).toBe(true);
    });

    it('should parse shift modifier', () => {
      const combo = parseKeyCombo('shift+enter');
      expect(combo.key).toBe('Enter');
      expect(combo.modifiers.shift).toBe(true);
    });

    it('should parse meta/cmd modifier', () => {
      const combo = parseKeyCombo('cmd+s');
      expect(combo.key).toBe('s');
      expect(combo.modifiers.meta).toBe(true);
    });

    it('should parse multiple modifiers', () => {
      const combo = parseKeyCombo('ctrl+shift+alt+k');
      expect(combo.key).toBe('k');
      expect(combo.modifiers.ctrl).toBe(true);
      expect(combo.modifiers.shift).toBe(true);
      expect(combo.modifiers.alt).toBe(true);
    });

    it('should normalize special keys', () => {
      expect(parseKeyCombo('esc').key).toBe('Escape');
      expect(parseKeyCombo('escape').key).toBe('Escape');
      expect(parseKeyCombo('enter').key).toBe('Enter');
      expect(parseKeyCombo('return').key).toBe('Enter');
      expect(parseKeyCombo('space').key).toBe(' ');
      expect(parseKeyCombo('up').key).toBe('ArrowUp');
      expect(parseKeyCombo('down').key).toBe('ArrowDown');
      expect(parseKeyCombo('left').key).toBe('ArrowLeft');
      expect(parseKeyCombo('right').key).toBe('ArrowRight');
      expect(parseKeyCombo('tab').key).toBe('Tab');
      expect(parseKeyCombo('backspace').key).toBe('Backspace');
      expect(parseKeyCombo('delete').key).toBe('Delete');
    });

    it('should handle case insensitivity', () => {
      const combo1 = parseKeyCombo('CTRL+K');
      const combo2 = parseKeyCombo('ctrl+k');
      expect(keyComboEquals(combo1, combo2)).toBe(true);
    });
  });

  describe('keyComboToString', () => {
    it('should convert simple key to string', () => {
      const combo = parseKeyCombo('k');
      expect(keyComboToString(combo)).toBe('k');
    });

    it('should convert combo with modifiers to string', () => {
      const combo = parseKeyCombo('ctrl+shift+k');
      expect(keyComboToString(combo)).toBe('ctrl+shift+k');
    });

    it('should maintain consistent order', () => {
      const combo = parseKeyCombo('shift+ctrl+alt+meta+x');
      expect(keyComboToString(combo)).toBe('ctrl+alt+shift+meta+x');
    });
  });

  describe('keyComboEquals', () => {
    it('should return true for equal combos', () => {
      const a = parseKeyCombo('ctrl+k');
      const b = parseKeyCombo('ctrl+k');
      expect(keyComboEquals(a, b)).toBe(true);
    });

    it('should return false for different keys', () => {
      const a = parseKeyCombo('ctrl+k');
      const b = parseKeyCombo('ctrl+j');
      expect(keyComboEquals(a, b)).toBe(false);
    });

    it('should return false for different modifiers', () => {
      const a = parseKeyCombo('ctrl+k');
      const b = parseKeyCombo('alt+k');
      expect(keyComboEquals(a, b)).toBe(false);
    });

    it('should be case insensitive for keys', () => {
      const a = parseKeyCombo('K');
      const b = parseKeyCombo('k');
      expect(keyComboEquals(a, b)).toBe(true);
    });
  });

  describe('keyComboFromEvent', () => {
    it('should create combo from event data', () => {
      const combo = keyComboFromEvent('k', { ctrl: true, shift: true });
      expect(combo.key).toBe('k');
      expect(combo.modifiers.ctrl).toBe(true);
      expect(combo.modifiers.shift).toBe(true);
      expect(combo.modifiers.alt).toBe(false);
    });

    it('should normalize special keys', () => {
      const combo = keyComboFromEvent('escape', {});
      expect(combo.key).toBe('Escape');
    });
  });

  describe('formatKeyCombo', () => {
    it('should format simple key', () => {
      const combo = parseKeyCombo('k');
      expect(formatKeyCombo(combo)).toBe('K');
    });

    it('should format combo with modifiers', () => {
      const combo = parseKeyCombo('ctrl+shift+k');
      expect(formatKeyCombo(combo)).toBe('Ctrl+Shift+K');
    });

    it('should format special keys', () => {
      const combo = parseKeyCombo('ctrl+enter');
      expect(formatKeyCombo(combo)).toBe('Ctrl+Enter');
    });
  });

  describe('formatKeyString', () => {
    it('should format key string', () => {
      expect(formatKeyString('ctrl+k')).toBe('Ctrl+K');
      expect(formatKeyString('cmd+shift+p')).toBe('Cmd+Shift+P');
    });
  });
});

describe('KeyBindingRegistry', () => {
  let registry: KeyBindingRegistry;

  beforeEach(() => {
    registry = new KeyBindingRegistry();
    resetBindingIdCounter();
  });

  describe('register', () => {
    it('should register a binding', () => {
      const action = vi.fn();
      const id = registry.register({
        key: 'ctrl+k',
        action,
        description: 'Test action',
      });

      expect(id).toBe('binding_1');
      const binding = registry.get(id);
      expect(binding).toBeDefined();
      expect(binding?.key).toBe('ctrl+k');
      expect(binding?.action).toBe(action);
      expect(binding?.description).toBe('Test action');
      expect(binding?.context).toBe('global');
      expect(binding?.enabled).toBe(true);
    });

    it('should register with custom context', () => {
      const id = registry.register({
        key: 'k',
        action: () => {},
        context: 'editor',
      });

      const binding = registry.get(id);
      expect(binding?.context).toBe('editor');
    });

    it('should register with priority', () => {
      const id = registry.register({
        key: 'k',
        action: () => {},
        priority: 10,
      });

      const binding = registry.get(id);
      expect(binding?.priority).toBe(10);
    });

    it('should detect conflicts in dev mode', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      registry.register({ key: 'ctrl+k', action: () => {} });
      registry.register({ key: 'ctrl+k', action: () => {} });

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('unregister', () => {
    it('should remove a binding', () => {
      const id = registry.register({ key: 'k', action: () => {} });
      expect(registry.get(id)).toBeDefined();

      const result = registry.unregister(id);
      expect(result).toBe(true);
      expect(registry.get(id)).toBeUndefined();
    });

    it('should return false for non-existent binding', () => {
      const result = registry.unregister('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('setEnabled', () => {
    it('should enable/disable a binding', () => {
      const id = registry.register({ key: 'k', action: () => {} });

      registry.setEnabled(id, false);
      expect(registry.get(id)?.enabled).toBe(false);

      registry.setEnabled(id, true);
      expect(registry.get(id)?.enabled).toBe(true);
    });
  });

  describe('getAll', () => {
    it('should return all bindings', () => {
      registry.register({ key: 'a', action: () => {} });
      registry.register({ key: 'b', action: () => {} });
      registry.register({ key: 'c', action: () => {} });

      expect(registry.getAll()).toHaveLength(3);
    });
  });

  describe('getByContext', () => {
    it('should return bindings for a specific context', () => {
      registry.register({ key: 'a', action: () => {}, context: 'global' });
      registry.register({ key: 'b', action: () => {}, context: 'editor' });
      registry.register({ key: 'c', action: () => {}, context: 'editor' });

      expect(registry.getByContext('global')).toHaveLength(1);
      expect(registry.getByContext('editor')).toHaveLength(2);
    });

    it('should exclude disabled bindings', () => {
      const id = registry.register({ key: 'a', action: () => {}, context: 'test' });
      registry.register({ key: 'b', action: () => {}, context: 'test' });

      registry.setEnabled(id, false);
      expect(registry.getByContext('test')).toHaveLength(1);
    });
  });

  describe('context stack', () => {
    it('should manage context stack', () => {
      expect(registry.getContextStack()).toEqual(['global']);
      expect(registry.getCurrentContext()).toBe('global');

      registry.pushContext('screen1');
      expect(registry.getContextStack()).toEqual(['global', 'screen1']);
      expect(registry.getCurrentContext()).toBe('screen1');

      registry.pushContext('dialog');
      expect(registry.getContextStack()).toEqual(['global', 'screen1', 'dialog']);

      registry.popContext();
      expect(registry.getContextStack()).toEqual(['global', 'screen1']);

      registry.popContext();
      expect(registry.getContextStack()).toEqual(['global']);
    });

    it('should not pop last context (global)', () => {
      registry.popContext();
      expect(registry.getContextStack()).toEqual(['global']);
    });
  });

  describe('resolve', () => {
    it('should resolve binding by key combo', () => {
      const action = vi.fn();
      registry.register({ key: 'ctrl+k', action });

      const combo = parseKeyCombo('ctrl+k');
      const binding = registry.resolve(combo);

      expect(binding).toBeDefined();
      expect(binding?.action).toBe(action);
    });

    it('should return null for unmatched combo', () => {
      registry.register({ key: 'ctrl+k', action: () => {} });

      const combo = parseKeyCombo('ctrl+j');
      expect(registry.resolve(combo)).toBeNull();
    });

    it('should prefer more specific context', () => {
      const globalAction = vi.fn();
      const editorAction = vi.fn();

      registry.register({ key: 'ctrl+s', action: globalAction, context: 'global' });
      registry.register({ key: 'ctrl+s', action: editorAction, context: 'editor' });

      registry.pushContext('editor');

      const combo = parseKeyCombo('ctrl+s');
      const binding = registry.resolve(combo);

      expect(binding?.action).toBe(editorAction);
    });

    it('should prefer higher priority at same context', () => {
      const lowAction = vi.fn();
      const highAction = vi.fn();

      registry.register({ key: 'ctrl+k', action: lowAction, priority: 0 });
      registry.register({ key: 'ctrl+k', action: highAction, priority: 10 });

      const combo = parseKeyCombo('ctrl+k');
      const binding = registry.resolve(combo);

      expect(binding?.action).toBe(highAction);
    });

    it('should ignore disabled bindings', () => {
      const action = vi.fn();
      const id = registry.register({ key: 'ctrl+k', action });
      registry.setEnabled(id, false);

      const combo = parseKeyCombo('ctrl+k');
      expect(registry.resolve(combo)).toBeNull();
    });
  });

  describe('handle', () => {
    it('should execute matching binding action', async () => {
      const action = vi.fn();
      registry.register({ key: 'ctrl+k', action });

      const handled = await registry.handle('k', { ctrl: true });

      expect(handled).toBe(true);
      expect(action).toHaveBeenCalled();
    });

    it('should return false when no match', async () => {
      const action = vi.fn();
      registry.register({ key: 'ctrl+k', action });

      const handled = await registry.handle('j', { ctrl: true });

      expect(handled).toBe(false);
      expect(action).not.toHaveBeenCalled();
    });

    it('should handle async actions', async () => {
      let resolved = false;
      const action = async () => {
        await Promise.resolve();
        resolved = true;
      };
      registry.register({ key: 'ctrl+k', action });

      await registry.handle('k', { ctrl: true });

      expect(resolved).toBe(true);
    });
  });

  describe('key modes', () => {
    it('should start in default mode', () => {
      expect(registry.getMode()).toBe('default');
    });

    it('should switch to vim mode', () => {
      registry.setMode('vim');
      expect(registry.getMode()).toBe('vim');
    });

    it('should switch to emacs mode', () => {
      registry.setMode('emacs');
      expect(registry.getMode()).toBe('emacs');
    });

    it('should switch back to default mode', () => {
      registry.setMode('vim');
      registry.setMode('default');
      expect(registry.getMode()).toBe('default');
    });
  });

  describe('conflicts', () => {
    it('should find conflicts for a binding', () => {
      registry.register({ key: 'ctrl+k', action: () => {} });
      const id = registry.register({ key: 'ctrl+k', action: () => {} });

      const binding = registry.get(id)!;
      const conflicts = registry.findConflicts(binding);

      expect(conflicts).toHaveLength(1);
    });

    it('should get all conflicts', () => {
      registry.register({ key: 'ctrl+k', action: () => {} });
      registry.register({ key: 'ctrl+k', action: () => {} });
      registry.register({ key: 'ctrl+j', action: () => {} });
      registry.register({ key: 'ctrl+j', action: () => {} });

      const conflicts = registry.getAllConflicts();
      expect(conflicts).toHaveLength(2);
    });

    it('should not report conflicts across contexts', () => {
      registry.register({ key: 'ctrl+k', action: () => {}, context: 'global' });
      registry.register({ key: 'ctrl+k', action: () => {}, context: 'editor' });

      const conflicts = registry.getAllConflicts();
      expect(conflicts).toHaveLength(0);
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on register', () => {
      const listener = vi.fn();
      registry.subscribe(listener);

      registry.register({ key: 'k', action: () => {} });
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should notify listeners on unregister', () => {
      const listener = vi.fn();
      const id = registry.register({ key: 'k', action: () => {} });

      registry.subscribe(listener);
      registry.unregister(id);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = registry.subscribe(listener);

      registry.register({ key: 'a', action: () => {} });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      registry.register({ key: 'b', action: () => {} });
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear', () => {
    it('should clear all bindings', () => {
      registry.register({ key: 'a', action: () => {} });
      registry.register({ key: 'b', action: () => {} });
      registry.pushContext('test');
      registry.setMode('vim');

      registry.clear();

      expect(registry.getAll()).toHaveLength(0);
      expect(registry.getContextStack()).toEqual(['global']);
      expect(registry.getMode()).toBe('default');
    });
  });
});

describe('Global Registry Functions', () => {
  beforeEach(() => {
    resetKeyBindingRegistry();
  });

  describe('getKeyBindingRegistry', () => {
    it('should return the same instance', () => {
      const reg1 = getKeyBindingRegistry();
      const reg2 = getKeyBindingRegistry();
      expect(reg1).toBe(reg2);
    });
  });

  describe('registerKeybinding', () => {
    it('should register on global registry', () => {
      const id = registerKeybinding({ key: 'ctrl+k', action: () => {} });
      const registry = getKeyBindingRegistry();
      expect(registry.get(id)).toBeDefined();
    });
  });

  describe('unregisterKeybinding', () => {
    it('should unregister from global registry', () => {
      const id = registerKeybinding({ key: 'ctrl+k', action: () => {} });
      const result = unregisterKeybinding(id);
      expect(result).toBe(true);
    });
  });

  describe('setKeyMode / getKeyMode', () => {
    it('should set and get mode', () => {
      setKeyMode('vim');
      expect(getKeyMode()).toBe('vim');
    });
  });

  describe('handleKeyEvent', () => {
    it('should handle through global registry', async () => {
      const action = vi.fn();
      registerKeybinding({ key: 'ctrl+k', action });

      const handled = await handleKeyEvent('k', { ctrl: true });
      expect(handled).toBe(true);
      expect(action).toHaveBeenCalled();
    });
  });
});

describe('useKeyBindings', () => {
  beforeEach(() => {
    resetKeyBindingRegistry();
  });

  it('should register bindings', () => {
    const action = vi.fn();
    useKeyBindings([{ key: 'ctrl+k', action }]);

    const registry = getKeyBindingRegistry();
    expect(registry.getAll()).toHaveLength(1);
  });

  it('should use provided context', () => {
    useKeyBindings([{ key: 'k', action: () => {} }], 'my-component');

    const registry = getKeyBindingRegistry();
    const bindings = registry.getByContext('my-component');
    expect(bindings).toHaveLength(1);
  });

  it('should cleanup on dispose', () => {
    const { cleanup } = useKeyBindings([
      { key: 'a', action: () => {} },
      { key: 'b', action: () => {} },
    ]);

    const registry = getKeyBindingRegistry();
    expect(registry.getAll()).toHaveLength(2);

    cleanup();
    expect(registry.getAll()).toHaveLength(0);
  });

  it('should push and pop context', () => {
    const registry = getKeyBindingRegistry();

    const { cleanup } = useKeyBindings([{ key: 'k', action: () => {} }], 'test-context');

    expect(registry.getContextStack()).toContain('test-context');

    cleanup();
    expect(registry.getContextStack()).not.toContain('test-context');
  });
});
