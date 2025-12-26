/**
 * Hotkey Scope Integration Tests
 *
 * Tests for hotkey scope management, including scope isolation,
 * modal interactions, and global hotkey behavior.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  registerHotkey,
  getRegisteredHotkeys,
  pushHotkeyScope,
  popHotkeyScope,
  getHotkeyScope,
  getHotkeyScopeDepth,
  resetHotkeyScope,
  setHotkeyScope,
} from '../../src/hooks/use-hotkeys.js';
import { createModal } from '../../src/organisms/modal.js';

// =============================================================================
// Setup and Teardown
// =============================================================================

describe('Hotkey Scope Integration', () => {
  beforeEach(() => {
    resetHotkeyScope();
  });

  afterEach(() => {
    resetHotkeyScope();
  });

  // ===========================================================================
  // Basic Scope Behavior
  // ===========================================================================

  describe('Basic Scope Behavior', () => {
    it('should start with global scope', () => {
      expect(getHotkeyScope()).toBe('global');
      expect(getHotkeyScopeDepth()).toBe(0);
    });

    it('should change scope when pushed', () => {
      pushHotkeyScope('modal');
      expect(getHotkeyScope()).toBe('modal');
      expect(getHotkeyScopeDepth()).toBe(1);
    });

    it('should restore scope when popped', () => {
      pushHotkeyScope('modal');
      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
      expect(getHotkeyScopeDepth()).toBe(0);
    });

    it('should handle multiple scope levels', () => {
      pushHotkeyScope('app');
      pushHotkeyScope('modal');
      pushHotkeyScope('dropdown');

      expect(getHotkeyScope()).toBe('dropdown');
      expect(getHotkeyScopeDepth()).toBe(3);

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('modal');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('app');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should not go below global scope', () => {
      // Extra pops should stay at global
      popHotkeyScope();
      popHotkeyScope();
      popHotkeyScope();

      expect(getHotkeyScope()).toBe('global');
      expect(getHotkeyScopeDepth()).toBe(0);
    });
  });

  // ===========================================================================
  // Hotkey Registration with Scopes
  // ===========================================================================

  describe('Hotkey Registration with Scopes', () => {
    it('should register hotkey in global scope by default', () => {
      const callback = vi.fn();
      registerHotkey('ctrl+s', callback);

      const hotkeys = getRegisteredHotkeys();
      expect(hotkeys.length).toBeGreaterThan(0);

      // getRegisteredHotkeys returns objects with { keys, description, scope }
      // keys is formatted as "Ctrl+S"
      const registered = hotkeys.find((h) => h.keys === 'Ctrl+S');
      expect(registered).toBeDefined();
      expect(registered?.scope).toBe('global');
    });

    it('should register hotkey in specific scope', () => {
      const callback = vi.fn();
      registerHotkey('escape', callback, { scope: 'modal' });

      const hotkeys = getRegisteredHotkeys();
      const registered = hotkeys.find((h) => h.keys === 'Escape');

      expect(registered).toBeDefined();
      expect(registered?.scope).toBe('modal');
    });

    it('should unregister hotkey', () => {
      const callback = vi.fn();
      const unregister = registerHotkey('ctrl+z', callback);

      expect(getRegisteredHotkeys().some((h) => h.keys === 'Ctrl+Z')).toBe(true);

      unregister();

      expect(getRegisteredHotkeys().some((h) => h.keys === 'Ctrl+Z')).toBe(false);
    });

    it('should register multiple hotkeys with same key in different scopes', () => {
      const globalCallback = vi.fn();
      const modalCallback = vi.fn();

      const unregisterGlobal = registerHotkey('f12', globalCallback, { scope: 'global' });
      const unregisterModal = registerHotkey('f12', modalCallback, { scope: 'modal' });

      const hotkeys = getRegisteredHotkeys();
      const f12Hotkeys = hotkeys.filter((h) => h.keys === 'F12');

      expect(f12Hotkeys.length).toBeGreaterThanOrEqual(2);
      expect(f12Hotkeys.some((h) => h.scope === 'global')).toBe(true);
      expect(f12Hotkeys.some((h) => h.scope === 'modal')).toBe(true);

      // Clean up
      unregisterGlobal();
      unregisterModal();
    });
  });

  // ===========================================================================
  // Scope Isolation
  // ===========================================================================

  describe('Scope Isolation', () => {
    it('should isolate hotkeys to their scope', () => {
      const globalHandler = vi.fn();
      const modalHandler = vi.fn();

      registerHotkey('ctrl+n', globalHandler, { scope: 'global' });
      registerHotkey('ctrl+n', modalHandler, { scope: 'modal' });

      // In global scope
      expect(getHotkeyScope()).toBe('global');

      // Switch to modal scope
      pushHotkeyScope('modal');
      expect(getHotkeyScope()).toBe('modal');

      // Back to global
      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should respect scope hierarchy', () => {
      pushHotkeyScope('app');
      pushHotkeyScope('modal');
      pushHotkeyScope('dialog');

      expect(getHotkeyScope()).toBe('dialog');

      // Pop should follow LIFO order
      popHotkeyScope();
      expect(getHotkeyScope()).toBe('modal');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('app');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });
  });

  // ===========================================================================
  // Modal + Scope Integration
  // ===========================================================================

  describe('Modal + Scope Integration', () => {
    it('should push scope when modal opens', () => {
      const modal = createModal({ hotkeyScope: 'settings' });

      expect(getHotkeyScope()).toBe('global');

      modal.open();
      expect(getHotkeyScope()).toBe('settings');
    });

    it('should pop scope when modal closes', () => {
      const modal = createModal({ hotkeyScope: 'settings' });

      modal.open();
      expect(getHotkeyScope()).toBe('settings');

      modal.close();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle nested modal scopes', () => {
      const settingsModal = createModal({ hotkeyScope: 'settings' });
      const confirmModal = createModal({ hotkeyScope: 'confirm' });

      settingsModal.open();
      expect(getHotkeyScope()).toBe('settings');

      confirmModal.open();
      expect(getHotkeyScope()).toBe('confirm');

      confirmModal.close();
      expect(getHotkeyScope()).toBe('settings');

      settingsModal.close();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should toggle modal and scope together', () => {
      const modal = createModal({ hotkeyScope: 'modal' });

      modal.toggle();
      expect(modal.isOpen).toBe(true);
      expect(getHotkeyScope()).toBe('modal');

      modal.toggle();
      expect(modal.isOpen).toBe(false);
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle modal without hotkeyScope option', () => {
      const modal = createModal(); // No hotkeyScope

      const scopeBefore = getHotkeyScope();
      modal.open();
      expect(getHotkeyScope()).toBe(scopeBefore); // Unchanged

      modal.close();
      expect(getHotkeyScope()).toBe(scopeBefore); // Still unchanged
    });
  });

  // ===========================================================================
  // Global Hotkeys
  // ===========================================================================

  describe('Global Hotkeys', () => {
    it('should allow registration in global scope', () => {
      const callback = vi.fn();
      registerHotkey('ctrl+q', callback, { scope: 'global' });

      const hotkeys = getRegisteredHotkeys();
      const globalHotkey = hotkeys.find((h) => h.keys === 'Ctrl+Q');

      expect(globalHotkey).toBeDefined();
      expect(globalHotkey?.scope).toBe('global');
    });

    it('should keep global hotkeys when scope changes', () => {
      registerHotkey('ctrl+q', vi.fn(), { scope: 'global' });

      pushHotkeyScope('modal');

      // Global hotkeys should still be registered
      const hotkeys = getRegisteredHotkeys();
      const globalHotkey = hotkeys.find((h) => h.keys === 'Ctrl+Q');
      expect(globalHotkey).toBeDefined();

      popHotkeyScope();

      // Still there
      const hotkeyAfterPop = getRegisteredHotkeys().find((h) => h.keys === 'Ctrl+Q');
      expect(hotkeyAfterPop).toBeDefined();
    });
  });

  // ===========================================================================
  // Real-world Scenarios
  // ===========================================================================

  describe('Real-world Scenarios', () => {
    it('should handle application with multiple modals', () => {
      const mainModal = createModal({ hotkeyScope: 'main-modal' });
      const helpModal = createModal({ hotkeyScope: 'help-modal' });
      const confirmModal = createModal({ hotkeyScope: 'confirm-modal' });

      // User opens main settings
      mainModal.open();
      expect(getHotkeyScope()).toBe('main-modal');

      // User opens help while in settings
      helpModal.open();
      expect(getHotkeyScope()).toBe('help-modal');

      // User closes help
      helpModal.close();
      expect(getHotkeyScope()).toBe('main-modal');

      // User triggers unsaved changes confirmation
      confirmModal.open();
      expect(getHotkeyScope()).toBe('confirm-modal');

      // User confirms
      confirmModal.close();
      expect(getHotkeyScope()).toBe('main-modal');

      // User closes main modal
      mainModal.close();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle command palette workflow', () => {
      const commandPalette = createModal({ hotkeyScope: 'command-palette' });

      // Register global hotkey to open command palette
      const openPalette = vi.fn(() => commandPalette.open());
      registerHotkey('ctrl+k', openPalette, { scope: 'global' });

      // Simulate opening
      commandPalette.open();
      expect(getHotkeyScope()).toBe('command-palette');

      // User selects action and closes
      commandPalette.close();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle context menu workflow', () => {
      const contextMenu = createModal({ hotkeyScope: 'context-menu' });
      const subMenu = createModal({ hotkeyScope: 'sub-menu' });

      // User right-clicks
      contextMenu.open();
      expect(getHotkeyScope()).toBe('context-menu');

      // User hovers on submenu
      subMenu.open();
      expect(getHotkeyScope()).toBe('sub-menu');

      // User clicks away
      subMenu.close();
      contextMenu.close();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle wizard with multiple steps', () => {
      // Each step could be a different scope
      const scopes = ['step-1', 'step-2', 'step-3', 'step-4'];

      // Navigate through steps
      for (const scope of scopes) {
        pushHotkeyScope(scope);
        expect(getHotkeyScope()).toBe(scope);
      }

      // Go back through steps
      for (let i = scopes.length - 1; i >= 0; i--) {
        expect(getHotkeyScope()).toBe(scopes[i]);
        popHotkeyScope();
      }

      expect(getHotkeyScope()).toBe('global');
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle rapid open/close cycles', () => {
      const modal = createModal({ hotkeyScope: 'modal' });

      for (let i = 0; i < 10; i++) {
        modal.open();
        modal.close();
      }

      expect(getHotkeyScope()).toBe('global');
      expect(getHotkeyScopeDepth()).toBe(0);
    });

    it('should handle opening same scope multiple times', () => {
      pushHotkeyScope('modal');
      pushHotkeyScope('modal');
      pushHotkeyScope('modal');

      expect(getHotkeyScope()).toBe('modal');
      expect(getHotkeyScopeDepth()).toBe(3);

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('modal');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('modal');

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle scope with empty string name', () => {
      // Empty string should be treated as a valid scope
      pushHotkeyScope('');
      expect(getHotkeyScope()).toBe('');
      expect(getHotkeyScopeDepth()).toBe(1);

      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });

    it('should handle scope with special characters', () => {
      pushHotkeyScope('modal:confirm:delete');
      expect(getHotkeyScope()).toBe('modal:confirm:delete');

      pushHotkeyScope('scope/with/slashes');
      expect(getHotkeyScope()).toBe('scope/with/slashes');

      popHotkeyScope();
      popHotkeyScope();
      expect(getHotkeyScope()).toBe('global');
    });
  });

  // ===========================================================================
  // setHotkeyScope (Direct Set)
  // ===========================================================================

  describe('setHotkeyScope (Direct Set)', () => {
    it('should directly set scope without affecting stack', () => {
      setHotkeyScope('custom');
      expect(getHotkeyScope()).toBe('custom');
    });

    it('should reset to global scope', () => {
      pushHotkeyScope('modal');
      pushHotkeyScope('dialog');

      setHotkeyScope('global');
      expect(getHotkeyScope()).toBe('global');
    });
  });
});
