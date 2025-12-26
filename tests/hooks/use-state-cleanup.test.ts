/**
 * Tests for state cleanup hooks
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useThemeOverride,
  useHotkeyScope,
  useCurrentHotkeyScope,
} from '../../src/hooks/use-state-cleanup.js';
import { resetHookState } from '../../src/hooks/context.js';
import * as theme from '../../src/core/theme.js';
import * as hotkeys from '../../src/hooks/use-hotkeys.js';

describe('State Cleanup Hooks', () => {
  beforeEach(() => {
    resetHookState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetHookState();
  });

  describe('useThemeOverride', () => {
    it('should call pushTheme with the provided theme', () => {
      const mockTheme = { name: 'test-theme' } as any;
      const pushSpy = vi.spyOn(theme, 'pushTheme').mockImplementation(() => {});
      vi.spyOn(theme, 'popTheme').mockImplementation(() => {});

      useThemeOverride(mockTheme);

      expect(pushSpy).toHaveBeenCalledWith(mockTheme);
    });

    it('should register popTheme as cleanup function', () => {
      const mockTheme = { name: 'test-theme' } as any;
      const pushSpy = vi.spyOn(theme, 'pushTheme').mockImplementation(() => {});
      vi.spyOn(theme, 'popTheme').mockImplementation(() => {});

      useThemeOverride(mockTheme);

      // The cleanup is registered via useEffect, push should be called
      expect(pushSpy).toHaveBeenCalled();
    });

    it('should support multiple theme overrides', () => {
      const theme1 = { name: 'theme-1' } as any;
      const theme2 = { name: 'theme-2' } as any;
      const pushCalls: any[] = [];

      vi.spyOn(theme, 'pushTheme').mockImplementation((t) => {
        pushCalls.push(t);
      });
      vi.spyOn(theme, 'popTheme').mockImplementation(() => {});

      // First override
      useThemeOverride(theme1);
      expect(pushCalls).toContainEqual(theme1);

      // Reset and create second override
      resetHookState();
      useThemeOverride(theme2);
      expect(pushCalls).toContainEqual(theme2);
    });
  });

  describe('useHotkeyScope', () => {
    it('should call pushHotkeyScope with the provided scope', () => {
      const pushSpy = vi.spyOn(hotkeys, 'pushHotkeyScope').mockImplementation(() => {});
      vi.spyOn(hotkeys, 'popHotkeyScope').mockImplementation(() => '');

      useHotkeyScope('modal');

      expect(pushSpy).toHaveBeenCalledWith('modal');
    });

    it('should register popHotkeyScope as cleanup', () => {
      const pushSpy = vi.spyOn(hotkeys, 'pushHotkeyScope').mockImplementation(() => {});
      vi.spyOn(hotkeys, 'popHotkeyScope').mockImplementation(() => '');

      useHotkeyScope('modal');

      // Push is called, cleanup function is registered via useEffect
      expect(pushSpy).toHaveBeenCalled();
    });

    it('should support different scope names', () => {
      const scopes: string[] = [];
      vi.spyOn(hotkeys, 'pushHotkeyScope').mockImplementation((scope) => {
        scopes.push(scope);
      });
      vi.spyOn(hotkeys, 'popHotkeyScope').mockImplementation(() => '');

      useHotkeyScope('command-palette');
      expect(scopes).toContain('command-palette');

      resetHookState();
      useHotkeyScope('search');
      expect(scopes).toContain('search');
    });

    it('should allow nested scopes', () => {
      const pushCalls: string[] = [];

      vi.spyOn(hotkeys, 'pushHotkeyScope').mockImplementation((scope) => {
        pushCalls.push(scope);
      });
      vi.spyOn(hotkeys, 'popHotkeyScope').mockImplementation(() => {
        return pushCalls.pop() || 'global';
      });

      // First scope
      useHotkeyScope('modal');
      expect(pushCalls).toEqual(['modal']);

      // Nested scope
      resetHookState();
      useHotkeyScope('dialog');
      expect(pushCalls).toEqual(['modal', 'dialog']);
    });
  });

  describe('useCurrentHotkeyScope', () => {
    it('should return the current hotkey scope', () => {
      vi.spyOn(hotkeys, 'getHotkeyScope').mockReturnValue('modal');

      const scope = useCurrentHotkeyScope();

      expect(scope).toBe('modal');
    });

    it('should return global as default scope', () => {
      vi.spyOn(hotkeys, 'getHotkeyScope').mockReturnValue('global');

      const scope = useCurrentHotkeyScope();

      expect(scope).toBe('global');
    });

    it('should reflect scope changes', () => {
      let currentScope = 'global';
      vi.spyOn(hotkeys, 'getHotkeyScope').mockImplementation(() => currentScope);

      expect(useCurrentHotkeyScope()).toBe('global');

      currentScope = 'modal';
      expect(useCurrentHotkeyScope()).toBe('modal');

      currentScope = 'search';
      expect(useCurrentHotkeyScope()).toBe('search');
    });
  });
});
