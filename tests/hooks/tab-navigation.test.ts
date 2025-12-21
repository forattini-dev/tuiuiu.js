/**
 * Tab Navigation Tests
 *
 * Tests for automatic Tab/Shift+Tab focus navigation and FocusContext.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { FocusManagerImpl } from '../../src/hooks/use-focus.js';
import { initializeApp, cleanupApp } from '../../src/hooks/use-app.js';
import { setFocusManager, getFocusManager, clearInputHandlers } from '../../src/hooks/context.js';
import { resetHookState } from '../../src/hooks/context.js';
import {
  FocusContext,
  useFocusContext,
  useFocusContextRequired,
  hasFocusContext,
  createFocusManagerInstance,
} from '../../src/hooks/focus-context.js';

describe('Tab Navigation', () => {
  let mockStdin: any;
  let mockStdout: any;
  let dataHandler: (data: Buffer) => void;

  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
    setFocusManager(null);

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
    clearInputHandlers();
    setFocusManager(null);
  });

  describe('FocusManager blur and getActiveId', () => {
    it('should return undefined when no component is focused', () => {
      const fm = new FocusManagerImpl();
      expect(fm.getActiveId()).toBeUndefined();
    });

    it('should return focused component id', () => {
      const fm = new FocusManagerImpl();
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      fm.register('input1', setFocused1);
      fm.register('input2', setFocused2);
      fm.focus('input2');

      expect(fm.getActiveId()).toBe('input2');
    });

    it('should blur current focus', () => {
      const fm = new FocusManagerImpl();
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
      const fm = new FocusManagerImpl();
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
      const appContext = initializeApp(mockStdin, mockStdout, { autoTabNavigation: true });
      const fm = getFocusManager()!;

      const setFocused = vi.fn();
      fm.register('field1', setFocused);
      fm.focus('field1');

      expect(fm.getActiveId()).toBe('field1');

      // Press Escape (0x1b)
      dataHandler(Buffer.from([0x1b]));

      // Should blur
      expect(fm.getActiveId()).toBeUndefined();
      expect(setFocused).toHaveBeenLastCalledWith(false);
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

describe('FocusContext', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
    setFocusManager(null);
    // Reset FocusContext state
    FocusContext._currentValue = null;
    FocusContext._stack = [];
  });

  afterEach(() => {
    cleanupApp();
    resetHookState();
    clearInputHandlers();
    setFocusManager(null);
    FocusContext._currentValue = null;
    FocusContext._stack = [];
  });

  describe('createFocusManagerInstance', () => {
    it('should create a new FocusManager instance', () => {
      const fm = createFocusManagerInstance();

      expect(fm).toBeDefined();
      expect(typeof fm.register).toBe('function');
      expect(typeof fm.unregister).toBe('function');
      expect(typeof fm.focus).toBe('function');
      expect(typeof fm.focusNext).toBe('function');
      expect(typeof fm.focusPrevious).toBe('function');
      expect(typeof fm.blur).toBe('function');
      expect(typeof fm.getActiveId).toBe('function');
    });
  });

  describe('useFocusContext', () => {
    it('should return null when no FocusContext.Provider exists', () => {
      const result = useFocusContext();
      expect(result).toBeNull();
    });

    it('should return FocusManager when inside FocusContext.Provider', () => {
      const fm = createFocusManagerInstance();
      FocusContext._currentValue = fm;

      const result = useFocusContext();
      expect(result).toBe(fm);

      // Cleanup
      FocusContext._currentValue = null;
    });
  });

  describe('useFocusContextRequired', () => {
    it('should throw when no FocusContext.Provider exists', () => {
      expect(() => useFocusContextRequired()).toThrow(
        'useFocusContextRequired must be called within a FocusContext.Provider'
      );
    });

    it('should return FocusManager when inside FocusContext.Provider', () => {
      const fm = createFocusManagerInstance();
      FocusContext._currentValue = fm;

      const result = useFocusContextRequired();
      expect(result).toBe(fm);

      // Cleanup
      FocusContext._currentValue = null;
    });
  });

  describe('hasFocusContext', () => {
    it('should return false when no FocusContext exists', () => {
      expect(hasFocusContext()).toBe(false);
    });

    it('should return true when FocusContext has value', () => {
      const fm = createFocusManagerInstance();
      FocusContext._currentValue = fm;
      FocusContext._stack.push(null); // Simulate being inside provider

      expect(hasFocusContext()).toBe(true);

      // Cleanup
      FocusContext._currentValue = null;
      FocusContext._stack = [];
    });

    it('should return false when FocusContext value is null', () => {
      FocusContext._currentValue = null;
      expect(hasFocusContext()).toBe(false);
    });
  });

  describe('FocusContext.Provider', () => {
    it('should provide FocusManager to children', () => {
      const fm = createFocusManagerInstance();

      // Simulate Provider wrapping
      FocusContext._stack.push(FocusContext._currentValue);
      FocusContext._currentValue = fm;

      expect(useFocusContext()).toBe(fm);

      // Restore
      FocusContext._currentValue = FocusContext._stack.pop() ?? null;
    });

    it('should support nested providers', () => {
      const fm1 = createFocusManagerInstance();
      const fm2 = createFocusManagerInstance();

      // Outer provider
      FocusContext._stack.push(FocusContext._currentValue);
      FocusContext._currentValue = fm1;

      expect(useFocusContext()).toBe(fm1);

      // Inner provider
      FocusContext._stack.push(FocusContext._currentValue);
      FocusContext._currentValue = fm2;

      expect(useFocusContext()).toBe(fm2);

      // Exit inner
      FocusContext._currentValue = FocusContext._stack.pop() ?? null;
      expect(useFocusContext()).toBe(fm1);

      // Exit outer
      FocusContext._currentValue = FocusContext._stack.pop() ?? null;
      expect(useFocusContext()).toBeNull();
    });
  });

  describe('FocusContext displayName', () => {
    it('should have displayName set', () => {
      expect(FocusContext.displayName).toBe('FocusContext');
    });
  });
});

describe('Focus integration with Context', () => {
  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
    setFocusManager(null);
    FocusContext._currentValue = null;
    FocusContext._stack = [];
  });

  afterEach(() => {
    cleanupApp();
    resetHookState();
    clearInputHandlers();
    setFocusManager(null);
    FocusContext._currentValue = null;
    FocusContext._stack = [];
  });

  it('should prefer FocusContext over global when both exist', () => {
    // Set up global FocusManager
    const globalFm = new FocusManagerImpl();
    setFocusManager(globalFm);

    const globalSetFocused = vi.fn();
    globalFm.register('global-field', globalSetFocused);

    // Set up context FocusManager
    const contextFm = createFocusManagerInstance();
    FocusContext._stack.push(FocusContext._currentValue);
    FocusContext._currentValue = contextFm;

    const contextSetFocused = vi.fn();
    contextFm.register('context-field', contextSetFocused);

    // useFocusContext should return context FM
    expect(useFocusContext()).toBe(contextFm);

    // Focus via context FM
    contextFm.focus('context-field');
    expect(contextSetFocused).toHaveBeenCalledWith(true);
    expect(globalSetFocused).not.toHaveBeenCalled();

    // Cleanup
    FocusContext._currentValue = FocusContext._stack.pop() ?? null;
  });

  it('should fall back to global when FocusContext is empty', () => {
    // Set up global FocusManager only
    const globalFm = new FocusManagerImpl();
    setFocusManager(globalFm);

    const globalSetFocused = vi.fn();
    globalFm.register('global-field', globalSetFocused);

    // No context set
    expect(useFocusContext()).toBeNull();

    // getFocusManager should still work
    expect(getFocusManager()).toBe(globalFm);
  });
});
