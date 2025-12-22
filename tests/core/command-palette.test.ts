/**
 * Tests for Command Palette System
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  fuzzyMatch,
  searchCommands,
  CommandRegistry,
  getCommandRegistry,
  resetCommandRegistry,
  registerCommand,
  unregisterCommand,
  executeCommand,
  searchGlobalCommands,
  createCommandPaletteState,
  highlightMatches,
  formatCommand,
  groupByCategory,
  resetCommandIdCounter,
  type Command,
} from '../../src/core/command-palette.js';
import { resetKeyBindingRegistry } from '../../src/core/keybindings.js';

describe('Fuzzy Search', () => {
  describe('fuzzyMatch', () => {
    it('should match exact string', () => {
      const result = fuzzyMatch('hello', 'hello');
      expect(result).not.toBeNull();
      expect(result!.matches).toEqual([0, 1, 2, 3, 4]);
    });

    it('should match substring', () => {
      const result = fuzzyMatch('hlo', 'hello');
      expect(result).not.toBeNull();
      expect(result!.matches).toEqual([0, 2, 4]);
    });

    it('should be case insensitive', () => {
      const result = fuzzyMatch('HeLLo', 'hello');
      expect(result).not.toBeNull();
    });

    it('should return null for no match', () => {
      const result = fuzzyMatch('xyz', 'hello');
      expect(result).toBeNull();
    });

    it('should return null if pattern chars not in order', () => {
      const result = fuzzyMatch('ol', 'hello');
      expect(result).toBeNull();
    });

    it('should handle empty pattern', () => {
      const result = fuzzyMatch('', 'hello');
      expect(result).not.toBeNull();
      expect(result!.score).toBe(0);
    });

    it('should give higher score for consecutive matches', () => {
      const consecutive = fuzzyMatch('hel', 'hello');
      const spread = fuzzyMatch('heo', 'hello');
      expect(consecutive!.score).toBeGreaterThan(spread!.score);
    });

    it('should give higher score for word start matches', () => {
      const wordStart = fuzzyMatch('sf', 'save file');
      const midWord = fuzzyMatch('av', 'save file');
      expect(wordStart!.score).toBeGreaterThan(midWord!.score);
    });

    it('should give higher score for first char match', () => {
      const firstChar = fuzzyMatch('h', 'hello');
      const midChar = fuzzyMatch('e', 'hello');
      expect(firstChar!.score).toBeGreaterThan(midChar!.score);
    });

    it('should give higher score for case match', () => {
      const caseMatch = fuzzyMatch('H', 'Hello');
      const noCase = fuzzyMatch('h', 'Hello');
      expect(caseMatch!.score).toBeGreaterThan(noCase!.score);
    });

    it('should prefer shorter strings', () => {
      const short = fuzzyMatch('ab', 'ab');
      const long = fuzzyMatch('ab', 'abcdefghij');
      expect(short!.score).toBeGreaterThan(long!.score);
    });
  });

  describe('searchCommands', () => {
    const commands: Command[] = [
      { id: '1', label: 'Save File', action: () => {} },
      { id: '2', label: 'Save All', action: () => {} },
      { id: '3', label: 'Open File', action: () => {} },
      { id: '4', label: 'Close File', action: () => {} },
      { id: '5', label: 'Settings', category: 'Preferences', action: () => {} },
    ];

    it('should find matching commands', () => {
      const results = searchCommands(commands, 'save');
      expect(results.length).toBe(2);
      expect(results.map(r => r.command.label)).toContain('Save File');
      expect(results.map(r => r.command.label)).toContain('Save All');
    });

    it('should sort by score', () => {
      const results = searchCommands(commands, 'sf');
      expect(results[0].command.label).toBe('Save File');
    });

    it('should limit results', () => {
      const results = searchCommands(commands, 'f', 2);
      expect(results.length).toBe(2);
    });

    it('should filter disabled commands', () => {
      const cmds: Command[] = [
        { id: '1', label: 'Enabled', action: () => {} },
        { id: '2', label: 'Disabled', enabled: false, action: () => {} },
      ];
      const results = searchCommands(cmds, 'dis');
      expect(results.length).toBe(0); // 'Disabled' is filtered out
    });

    it('should match category', () => {
      const results = searchCommands(commands, 'pref');
      expect(results.length).toBe(1);
      expect(results[0].command.label).toBe('Settings');
    });

    it('should match tags', () => {
      const cmds: Command[] = [
        { id: '1', label: 'Git Push', tags: ['source control', 'git'], action: () => {} },
      ];
      const results = searchCommands(cmds, 'source');
      expect(results.length).toBe(1);
    });

    it('should match description', () => {
      const cmds: Command[] = [
        { id: '1', label: 'Format', description: 'Format document using prettier', action: () => {} },
      ];
      const results = searchCommands(cmds, 'prettier');
      expect(results.length).toBe(1);
    });

    it('should return all enabled commands for empty query', () => {
      const results = searchCommands(commands, '');
      expect(results.length).toBe(5);
    });
  });
});

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
    resetCommandIdCounter();
    resetKeyBindingRegistry();
  });

  describe('register', () => {
    it('should register a command', () => {
      const id = registry.register({
        label: 'Test Command',
        action: () => {},
      });

      expect(id).toBe('command_1');
      expect(registry.get(id)).toBeDefined();
      expect(registry.get(id)?.label).toBe('Test Command');
    });

    it('should use provided id', () => {
      const id = registry.register({
        id: 'custom-id',
        label: 'Test',
        action: () => {},
      });

      expect(id).toBe('custom-id');
    });

    it('should register keybinding if provided', () => {
      registry.register({
        label: 'Save',
        keybinding: 'ctrl+s',
        action: () => {},
      });

      // Keybinding should be registered (tested via keybinding registry)
      const cmd = registry.get('command_1');
      expect(cmd?.keybinding).toBe('ctrl+s');
    });

    it('should default enabled to true', () => {
      const id = registry.register({ label: 'Test', action: () => {} });
      expect(registry.get(id)?.enabled).toBe(true);
    });
  });

  describe('unregister', () => {
    it('should remove a command', () => {
      const id = registry.register({ label: 'Test', action: () => {} });
      expect(registry.unregister(id)).toBe(true);
      expect(registry.get(id)).toBeUndefined();
    });

    it('should return false for non-existent command', () => {
      expect(registry.unregister('non-existent')).toBe(false);
    });

    it('should remove from recent', async () => {
      const id = registry.register({ label: 'Test', action: () => {} });
      await registry.execute(id);
      expect(registry.getRecent()).toHaveLength(1);

      registry.unregister(id);
      expect(registry.getRecent()).toHaveLength(0);
    });
  });

  describe('getAll', () => {
    it('should return all commands', () => {
      registry.register({ label: 'A', action: () => {} });
      registry.register({ label: 'B', action: () => {} });
      registry.register({ label: 'C', action: () => {} });

      expect(registry.getAll()).toHaveLength(3);
    });
  });

  describe('getByCategory', () => {
    it('should return commands by category', () => {
      registry.register({ label: 'A', category: 'File', action: () => {} });
      registry.register({ label: 'B', category: 'File', action: () => {} });
      registry.register({ label: 'C', category: 'Edit', action: () => {} });

      expect(registry.getByCategory('File')).toHaveLength(2);
      expect(registry.getByCategory('Edit')).toHaveLength(1);
    });
  });

  describe('getCategories', () => {
    it('should return all unique categories', () => {
      registry.register({ label: 'A', category: 'File', action: () => {} });
      registry.register({ label: 'B', category: 'Edit', action: () => {} });
      registry.register({ label: 'C', category: 'File', action: () => {} });
      registry.register({ label: 'D', action: () => {} }); // No category

      const categories = registry.getCategories();
      expect(categories).toEqual(['Edit', 'File']);
    });
  });

  describe('execute', () => {
    it('should execute command action', async () => {
      const action = vi.fn();
      const id = registry.register({ label: 'Test', action });

      const result = await registry.execute(id);
      expect(result).toBe(true);
      expect(action).toHaveBeenCalled();
    });

    it('should return false for non-existent command', async () => {
      const result = await registry.execute('non-existent');
      expect(result).toBe(false);
    });

    it('should return false for disabled command', async () => {
      const action = vi.fn();
      const id = registry.register({ label: 'Test', enabled: false, action });

      const result = await registry.execute(id);
      expect(result).toBe(false);
      expect(action).not.toHaveBeenCalled();
    });

    it('should handle async actions', async () => {
      let resolved = false;
      const id = registry.register({
        label: 'Test',
        action: async () => {
          await Promise.resolve();
          resolved = true;
        },
      });

      await registry.execute(id);
      expect(resolved).toBe(true);
    });

    it('should catch errors', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const id = registry.register({
        label: 'Test',
        action: () => {
          throw new Error('Test error');
        },
      });

      const result = await registry.execute(id);
      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });
  });

  describe('recent commands', () => {
    it('should track recent commands', async () => {
      const id1 = registry.register({ label: 'A', action: () => {} });
      const id2 = registry.register({ label: 'B', action: () => {} });

      await registry.execute(id1);
      await registry.execute(id2);

      const recent = registry.getRecent();
      expect(recent).toHaveLength(2);
      expect(recent[0].id).toBe(id2); // Most recent first
    });

    it('should not duplicate in recent', async () => {
      const id = registry.register({ label: 'A', action: () => {} });

      await registry.execute(id);
      await registry.execute(id);
      await registry.execute(id);

      expect(registry.getRecent()).toHaveLength(1);
    });

    it('should respect hideFromRecent', async () => {
      const id = registry.register({
        label: 'A',
        hideFromRecent: true,
        action: () => {},
      });

      await registry.execute(id);
      expect(registry.getRecent()).toHaveLength(0);
    });

    it('should limit recent count', async () => {
      registry.setMaxRecent(3);

      for (let i = 0; i < 5; i++) {
        const id = registry.register({ label: `Cmd${i}`, action: () => {} });
        await registry.execute(id);
      }

      expect(registry.getRecent()).toHaveLength(3);
    });

    it('should clear recent', async () => {
      const id = registry.register({ label: 'A', action: () => {} });
      await registry.execute(id);

      registry.clearRecent();
      expect(registry.getRecent()).toHaveLength(0);
    });
  });

  describe('search', () => {
    it('should search commands', () => {
      registry.register({ label: 'Save File', action: () => {} });
      registry.register({ label: 'Save All', action: () => {} });
      registry.register({ label: 'Open', action: () => {} });

      const results = registry.search('save');
      expect(results).toHaveLength(2);
    });
  });

  describe('setEnabled', () => {
    it('should enable/disable commands', () => {
      const id = registry.register({ label: 'Test', action: () => {} });

      registry.setEnabled(id, false);
      expect(registry.get(id)?.enabled).toBe(false);

      registry.setEnabled(id, true);
      expect(registry.get(id)?.enabled).toBe(true);
    });
  });

  describe('subscribe', () => {
    it('should notify on register', () => {
      const listener = vi.fn();
      registry.subscribe(listener);

      registry.register({ label: 'Test', action: () => {} });
      expect(listener).toHaveBeenCalled();
    });

    it('should allow unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = registry.subscribe(listener);

      unsubscribe();
      registry.register({ label: 'Test', action: () => {} });
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should clear all commands', async () => {
      const id = registry.register({ label: 'Test', action: () => {} });
      await registry.execute(id);

      registry.clear();

      expect(registry.size).toBe(0);
      expect(registry.getRecent()).toHaveLength(0);
    });
  });
});

describe('Global Registry Functions', () => {
  beforeEach(() => {
    resetCommandRegistry();
    resetKeyBindingRegistry();
  });

  it('should return same instance', () => {
    const reg1 = getCommandRegistry();
    const reg2 = getCommandRegistry();
    expect(reg1).toBe(reg2);
  });

  it('should register commands globally', () => {
    const id = registerCommand({ label: 'Test', action: () => {} });
    expect(getCommandRegistry().get(id)).toBeDefined();
  });

  it('should unregister commands globally', () => {
    const id = registerCommand({ label: 'Test', action: () => {} });
    unregisterCommand(id);
    expect(getCommandRegistry().get(id)).toBeUndefined();
  });

  it('should execute commands globally', async () => {
    const action = vi.fn();
    const id = registerCommand({ label: 'Test', action });

    await executeCommand(id);
    expect(action).toHaveBeenCalled();
  });

  it('should search commands globally', () => {
    registerCommand({ label: 'Save', action: () => {} });
    const results = searchGlobalCommands('save');
    expect(results).toHaveLength(1);
  });
});

describe('createCommandPaletteState', () => {
  beforeEach(() => {
    resetCommandRegistry();
    resetKeyBindingRegistry();
  });

  it('should create initial state', () => {
    const { state } = createCommandPaletteState();
    expect(state().isOpen).toBe(false);
    expect(state().query).toBe('');
    expect(state().selectedIndex).toBe(0);
  });

  it('should open palette', () => {
    const { state, open } = createCommandPaletteState();
    open();
    expect(state().isOpen).toBe(true);
  });

  it('should close palette', () => {
    const { state, open, close } = createCommandPaletteState();
    open();
    close();
    expect(state().isOpen).toBe(false);
    expect(state().query).toBe('');
  });

  it('should toggle palette', () => {
    const { state, toggle } = createCommandPaletteState();
    toggle();
    expect(state().isOpen).toBe(true);
    toggle();
    expect(state().isOpen).toBe(false);
  });

  it('should update query and results', () => {
    registerCommand({ label: 'Save', action: () => {} });
    registerCommand({ label: 'Open', action: () => {} });

    const { state, open, setQuery } = createCommandPaletteState();
    open();
    setQuery('save');

    expect(state().query).toBe('save');
    expect(state().results).toHaveLength(1);
    expect(state().selectedIndex).toBe(0);
  });

  it('should navigate results', () => {
    registerCommand({ label: 'A', action: () => {} });
    registerCommand({ label: 'B', action: () => {} });
    registerCommand({ label: 'C', action: () => {} });

    const { state, open, selectNext, selectPrevious, selectFirst, selectLast } =
      createCommandPaletteState();
    open();

    expect(state().selectedIndex).toBe(0);

    selectNext();
    expect(state().selectedIndex).toBe(1);

    selectNext();
    expect(state().selectedIndex).toBe(2);

    selectNext(); // Should not exceed max
    expect(state().selectedIndex).toBe(2);

    selectPrevious();
    expect(state().selectedIndex).toBe(1);

    selectLast();
    expect(state().selectedIndex).toBe(2);

    selectFirst();
    expect(state().selectedIndex).toBe(0);
  });

  it('should execute selected command', async () => {
    const action = vi.fn();
    registerCommand({ label: 'Test', action });

    const { state, open, executeSelected } = createCommandPaletteState();
    open();

    const result = await executeSelected();
    expect(result).toBe(true);
    expect(action).toHaveBeenCalled();
    expect(state().isOpen).toBe(false); // Should close after execute
  });

  it('should show recent commands first', async () => {
    const id1 = registerCommand({ label: 'AAA', action: () => {} });
    registerCommand({ label: 'BBB', action: () => {} });

    // Execute AAA to make it recent
    await executeCommand(id1);

    const { state, open } = createCommandPaletteState();
    open();

    // Recent should be first
    expect(state().results[0].command.label).toBe('AAA');
  });
});

describe('Helper Functions', () => {
  describe('highlightMatches', () => {
    it('should return single segment for no matches', () => {
      const result = highlightMatches('hello', []);
      expect(result).toEqual([{ text: 'hello', highlight: false }]);
    });

    it('should highlight matched characters', () => {
      const result = highlightMatches('hello', [0, 2, 4]);
      expect(result).toEqual([
        { text: 'h', highlight: true },
        { text: 'e', highlight: false },
        { text: 'l', highlight: true },
        { text: 'l', highlight: false },
        { text: 'o', highlight: true },
      ]);
    });

    it('should group consecutive matches', () => {
      const result = highlightMatches('hello', [0, 1, 2]);
      expect(result).toEqual([
        { text: 'hel', highlight: true },
        { text: 'lo', highlight: false },
      ]);
    });
  });

  describe('formatCommand', () => {
    it('should format command label', () => {
      const cmd: Command = { id: '1', label: 'Save', action: () => {} };
      expect(formatCommand(cmd)).toBe('Save');
    });

    it('should include keybinding', () => {
      const cmd: Command = {
        id: '1',
        label: 'Save',
        keybinding: 'ctrl+s',
        action: () => {},
      };
      expect(formatCommand(cmd)).toBe('Save (Ctrl+S)');
    });
  });

  describe('groupByCategory', () => {
    it('should group commands by category', () => {
      const commands: Command[] = [
        { id: '1', label: 'A', category: 'File', action: () => {} },
        { id: '2', label: 'B', category: 'Edit', action: () => {} },
        { id: '3', label: 'C', category: 'File', action: () => {} },
        { id: '4', label: 'D', action: () => {} },
      ];

      const groups = groupByCategory(commands);

      expect(groups.get('File')).toHaveLength(2);
      expect(groups.get('Edit')).toHaveLength(1);
      expect(groups.get('')).toHaveLength(1); // Uncategorized
    });
  });
});
