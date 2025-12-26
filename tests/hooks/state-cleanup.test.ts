/**
 * State Cleanup Hooks Tests
 *
 * Tests for useThemeOverride and useHotkeyScope hooks
 * that automatically clean up state changes when components unmount.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  pushHotkeyScope,
  popHotkeyScope,
  getHotkeyScope,
  getHotkeyScopeDepth,
  resetHotkeyScope,
} from '../../src/hooks/use-hotkeys.js';
import {
  pushTheme,
  popTheme,
  getTheme,
  setTheme,
} from '../../src/core/theme.js';
import { darkTheme } from '../../src/themes/dark.theme.js';
import { lightTheme } from '../../src/themes/light.theme.js';
import { draculaTheme } from '../../src/themes/dracula.theme.js';

describe('Hotkey Scope Stack', () => {
  beforeEach(() => {
    resetHotkeyScope();
  });

  describe('pushHotkeyScope', () => {
    it('should set the current scope', () => {
      expect(getHotkeyScope()).toBe('global');

      pushHotkeyScope('modal');
      expect(getHotkeyScope()).toBe('modal');
    });

    it('should increment stack depth', () => {
      expect(getHotkeyScopeDepth()).toBe(0);

      pushHotkeyScope('modal');
      expect(getHotkeyScopeDepth()).toBe(1);

      pushHotkeyScope('command-palette');
      expect(getHotkeyScopeDepth()).toBe(2);
    });

    it('should support nested scopes', () => {
      pushHotkeyScope('modal');
      expect(getHotkeyScope()).toBe('modal');

      pushHotkeyScope('command-palette');
      expect(getHotkeyScope()).toBe('command-palette');

      pushHotkeyScope('confirm-dialog');
      expect(getHotkeyScope()).toBe('confirm-dialog');
    });
  });

  describe('popHotkeyScope', () => {
    it('should restore previous scope', () => {
      pushHotkeyScope('modal');
      pushHotkeyScope('command-palette');
      expect(getHotkeyScope()).toBe('command-palette');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('modal');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should return the popped scope', () => {
      pushHotkeyScope('modal');
      pushHotkeyScope('command-palette');

      expect(popHotkeyScope()).toBe('command-palette');
      expect(popHotkeyScope()).toBe('modal');
    });

    it('should return to global when stack is empty', () => {
      pushHotkeyScope('modal');
      popHotkeyScope();

      // Extra pop should stay at global
      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should decrement stack depth', () => {
      pushHotkeyScope('modal');
      pushHotkeyScope('command-palette');
      expect(getHotkeyScopeDepth()).toBe(2);

      popHotkeyScope();
      expect(getHotkeyScopeDepth()).toBe(1);

      popHotkeyScope();
      expect(getHotkeyScopeDepth()).toBe(0);
    });
  });

  describe('resetHotkeyScope', () => {
    it('should reset to global and clear stack', () => {
      pushHotkeyScope('modal');
      pushHotkeyScope('command-palette');
      pushHotkeyScope('nested');

      resetHotkeyScope();

      expect(getHotkeyScope()).toBe('global');
      expect(getHotkeyScopeDepth()).toBe(0);
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle modal opening and closing', () => {
      // App starts at global
      expect(getHotkeyScope()).toBe('global');

      // Modal opens
      pushHotkeyScope('modal');
      expect(getHotkeyScope()).toBe('modal');

      // User interacts with modal...

      // Modal closes
      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle command palette inside modal', () => {
      // App starts at global
      expect(getHotkeyScope()).toBe('global');

      // Modal opens
      pushHotkeyScope('modal');
      expect(getHotkeyScope()).toBe('modal');

      // Command palette opens inside modal
      pushHotkeyScope('command-palette');
      expect(getHotkeyScope()).toBe('command-palette');

      // Command palette closes
      popHotkeyScope();
      expect(getHotkeyScope()).toBe('modal');

      // Modal closes
      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle multiple modals stacking', () => {
      pushHotkeyScope('modal-1');
      pushHotkeyScope('modal-2');
      pushHotkeyScope('modal-3');

      expect(getHotkeyScope()).toBe('modal-3');

      // Close in reverse order
      popHotkeyScope();
      expect(getHotkeyScope()).toBe('modal-2');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('modal-1');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });
  });
});

describe('Theme Stack', () => {
  beforeEach(() => {
    // Reset to dark theme
    setTheme(darkTheme);
    // Pop any remaining stacked themes
    while (true) {
      try {
        popTheme();
      } catch {
        break;
      }
      // Safety check - prevent infinite loop
      if (getTheme().name === darkTheme.name) break;
    }
    setTheme(darkTheme);
  });

  describe('pushTheme', () => {
    it('should change the current theme', () => {
      expect(getTheme().name).toBe('dark');

      pushTheme(lightTheme);
      expect(getTheme().name).toBe('light');
    });

    it('should support nested theme overrides', () => {
      pushTheme(lightTheme);
      expect(getTheme().name).toBe('light');

      pushTheme(draculaTheme);
      expect(getTheme().name).toBe('dracula');
    });
  });

  describe('popTheme', () => {
    it('should restore previous theme', () => {
      pushTheme(lightTheme);
      pushTheme(draculaTheme);
      expect(getTheme().name).toBe('dracula');

      popTheme();
      expect(getTheme().name).toBe('light');

      popTheme();
      expect(getTheme().name).toBe('dark');
    });
  });

  describe('Real-world scenarios', () => {
    it('should handle modal with different theme', () => {
      // App uses dark theme
      expect(getTheme().name).toBe('dark');

      // Modal opens with high contrast theme
      pushTheme(lightTheme);
      expect(getTheme().name).toBe('light');

      // Modal closes - back to dark
      popTheme();
      expect(getTheme().name).toBe('dark');
    });

    it('should handle nested theme overrides', () => {
      // App uses dark theme
      expect(getTheme().name).toBe('dark');

      // Modal opens with light theme
      pushTheme(lightTheme);
      expect(getTheme().name).toBe('light');

      // Nested component uses dracula
      pushTheme(draculaTheme);
      expect(getTheme().name).toBe('dracula');

      // Nested component unmounts
      popTheme();
      expect(getTheme().name).toBe('light');

      // Modal closes
      popTheme();
      expect(getTheme().name).toBe('dark');
    });
  });
});
