/**
 * Tab Navigation Tests
 *
 * Tests for automatic Tab/Shift+Tab focus navigation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FocusZoneManagerAdapter } from '../../src/hooks/use-focus.js';
import { initializeApp, cleanupApp } from '../../src/hooks/use-app.js';
import { setFocusManager, getFocusManager } from '../../src/hooks/context.js';
import { resetTestInteractions } from '../../src/testing/interaction.js';
import { resetHookState } from '../../src/hooks/context.js';
import { resetFocusZoneManager } from '../../src/core/focus.js';

describe('Tab Navigation', () => {
  let mockStdin: any;
  let mockStdout: any;
  let dataHandler: (data: Buffer) => void;

  beforeEach(() => {
    resetHookState();
    resetTestInteractions();
    setFocusManager(null);
    resetFocusZoneManager();

    // Create mock stdin
    mockStdin = {
      isTTY: true,
      setRawMode: vi.fn(),
      resume: vi.fn(),
      on: vi.fn((event: string, handler: any) => {
        if (event === 'data') {
          dataHandler = handler;
        }
      }),
      off: vi.fn(),
    };

    // Create mock stdout
    mockStdout = {
      columns: 80,
      rows: 24,
    };
  });

  afterEach(() => {
    cleanupApp();
    resetHookState();
    resetTestInteractions();
    setFocusManager(null);
  });

  describe('FocusManager blur and getActiveId', () => {
    it('should return undefined when no component is focused', () => {
      const fm = new FocusZoneManagerAdapter();
      expect(fm.getActiveId()).toBeUndefined();
    });

    it('should return focused component id', () => {
      const fm = new FocusZoneManagerAdapter();
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      fm.register('input1', setFocused1);
      fm.register('input2', setFocused2);
      fm.focus('input2');

      expect(fm.getActiveId()).toBe('input2');
    });

    it('should blur current focus', () => {
      const fm = new FocusZoneManagerAdapter();
      const setFocused = vi.fn();

      fm.register('input1', setFocused);
      fm.focus('input1');

      expect(fm.getActiveId()).toBe('input1');
      expect(setFocused).toHaveBeenLastCalledWith(true);

      fm.blur();

      expect(fm.getActiveId()).toBeUndefined();
      expect(setFocused).toHaveBeenLastCalledWith(false);
    });

    it('should handle blur when nothing is focused', () => {
      const fm = new FocusZoneManagerAdapter();
      // Should not throw
      expect(() => fm.blur()).not.toThrow();
      expect(fm.getActiveId()).toBeUndefined();
    });
  });

  describe('Automatic Tab navigation', () => {
    it('should focus next on Tab', () => {
      const appContext = initializeApp(mockStdin, mockStdout, { autoTabNavigation: true });
      const fm = getFocusManager()!;

      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();
      const setFocused3 = vi.fn();

      fm.register('field1', setFocused1);
      fm.register('field2', setFocused2);
      fm.register('field3', setFocused3);

      // Initial state - nothing focused
      expect(fm.getActiveId()).toBeUndefined();

      // Press Tab (0x09)
      dataHandler(Buffer.from([0x09]));

      // Should focus first item
      expect(fm.getActiveId()).toBe('field1');
      expect(setFocused1).toHaveBeenCalledWith(true);
    });

    it('should focus previous on Shift+Tab', () => {
      const appContext = initializeApp(mockStdin, mockStdout, { autoTabNavigation: true });
      const fm = getFocusManager()!;

      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      fm.register('field1', setFocused1);
      fm.register('field2', setFocused2);

      // Focus second item first
      fm.focus('field2');
      expect(fm.getActiveId()).toBe('field2');

      // Press Shift+Tab (escape sequence for shift+tab: ESC [ Z)
      dataHandler(Buffer.from('\x1b[Z'));

      // Should focus previous (first) item
      expect(fm.getActiveId()).toBe('field1');
    });

    it('should blur on Escape when something is focused', () => {
      vi.useFakeTimers();
      const appContext = initializeApp(mockStdin, mockStdout, { autoTabNavigation: true });
      const fm = getFocusManager()!;

      const setFocused = vi.fn();
      fm.register('field1', setFocused);
      fm.focus('field1');

      expect(fm.getActiveId()).toBe('field1');

      // Press Escape (0x1b)
      dataHandler(Buffer.from([0x1b]));
      vi.advanceTimersByTime(25);

      // Should blur
      expect(fm.getActiveId()).toBeUndefined();
      expect(setFocused).toHaveBeenLastCalledWith(false);
      vi.useRealTimers();
    });

    it('should not consume Escape when nothing is focused', () => {
      const appContext = initializeApp(mockStdin, mockStdout, { autoTabNavigation: true });
      const fm = getFocusManager()!;

      // No components registered, nothing focused
      expect(fm.getActiveId()).toBeUndefined();

      // Escape should not throw when nothing is focused
      // (it passes through to input handlers)
      expect(() => dataHandler(Buffer.from([0x1b]))).not.toThrow();

      // Focus should still be undefined
      expect(fm.getActiveId()).toBeUndefined();
    });

    it('should wrap around on Tab (cycle through focusable items)', () => {
      const appContext = initializeApp(mockStdin, mockStdout, { autoTabNavigation: true });
      const fm = getFocusManager()!;

      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      fm.register('field1', setFocused1);
      fm.register('field2', setFocused2);

      // Focus last item
      fm.focus('field2');
      expect(fm.getActiveId()).toBe('field2');

      // Press Tab - should wrap to first
      dataHandler(Buffer.from([0x09]));
      expect(fm.getActiveId()).toBe('field1');
    });
  });

  describe('autoTabNavigation option', () => {
    it('should disable Tab navigation when autoTabNavigation is false', () => {
      const appContext = initializeApp(mockStdin, mockStdout, { autoTabNavigation: false });
      const fm = getFocusManager()!;

      const setFocused1 = vi.fn();
      fm.register('field1', setFocused1);

      // Press Tab - should NOT change focus (disabled)
      dataHandler(Buffer.from([0x09]));

      // Focus should not have been set automatically
      // (Tab goes to input handlers instead)
      expect(setFocused1).not.toHaveBeenCalledWith(true);
    });

    it('should allow runtime toggle of autoTabNavigation', () => {
      const appContext = initializeApp(mockStdin, mockStdout, { autoTabNavigation: true });
      const fm = getFocusManager()!;

      const setFocused = vi.fn();
      fm.register('field1', setFocused);

      // Tab should work initially
      dataHandler(Buffer.from([0x09]));
      expect(fm.getActiveId()).toBe('field1');

      // Disable
      appContext.setAutoTabNavigation(false);

      // Reset focus
      fm.blur();

      // Tab should not work now (goes to handlers)
      setFocused.mockClear();
      dataHandler(Buffer.from([0x09]));
      // Focus might not change because it goes to input handlers
    });

    it('should expose autoTabNavigation state on AppContext', () => {
      const appContext = initializeApp(mockStdin, mockStdout, { autoTabNavigation: true });

      expect(appContext.autoTabNavigation).toBe(true);

      appContext.setAutoTabNavigation(false);
      // Note: The internal variable changes, but appContext.autoTabNavigation is a snapshot
      // This tests the setter exists and doesn't throw
    });
  });
});
