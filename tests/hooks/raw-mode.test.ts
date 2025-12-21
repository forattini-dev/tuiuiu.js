/**
 * Raw Mode Reference Counting Tests
 *
 * Tests for the raw mode reference counting system.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initializeApp, cleanupApp } from '../../src/hooks/use-app.js';
import { resetHookState, clearInputHandlers, setFocusManager } from '../../src/hooks/context.js';

describe('Raw Mode Reference Counting', () => {
  let mockStdin: any;
  let mockStdout: any;

  beforeEach(() => {
    resetHookState();
    clearInputHandlers();
    setFocusManager(null);

    // Create mock stdin with setRawMode spy
    mockStdin = {
      isTTY: true,
      setRawMode: vi.fn(),
      resume: vi.fn(),
      on: vi.fn(),
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

  describe('Initial state', () => {
    it('should enable raw mode on initialization', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      expect(mockStdin.setRawMode).toHaveBeenCalledWith(true);
      expect(appContext.isRawModeEnabled()).toBe(true);
      expect(appContext.rawModeEnabledCount).toBe(1);
    });

    it('should not call setRawMode if stdin is not TTY', () => {
      mockStdin.isTTY = false;

      const appContext = initializeApp(mockStdin, mockStdout);

      expect(mockStdin.setRawMode).not.toHaveBeenCalled();
    });

    it('should not call setRawMode if stdin.setRawMode is undefined', () => {
      mockStdin.setRawMode = undefined;

      // Should not throw
      expect(() => initializeApp(mockStdin, mockStdout)).not.toThrow();
    });
  });

  describe('Reference counting', () => {
    it('should increment count when setRawMode(true) is called', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      // Initial count is 1
      expect(appContext.rawModeEnabledCount).toBe(1);

      // Request raw mode again
      appContext.setRawMode(true);
      expect(appContext.rawModeEnabledCount).toBe(2);

      // And again
      appContext.setRawMode(true);
      expect(appContext.rawModeEnabledCount).toBe(3);
    });

    it('should decrement count when setRawMode(false) is called', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      // Add more references
      appContext.setRawMode(true);
      appContext.setRawMode(true);
      expect(appContext.rawModeEnabledCount).toBe(3);

      // Release references
      appContext.setRawMode(false);
      expect(appContext.rawModeEnabledCount).toBe(2);

      appContext.setRawMode(false);
      expect(appContext.rawModeEnabledCount).toBe(1);
    });

    it('should not go below zero', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      // Release more than we have
      appContext.setRawMode(false);
      appContext.setRawMode(false);
      appContext.setRawMode(false);

      expect(appContext.rawModeEnabledCount).toBe(0);
      expect(appContext.isRawModeEnabled()).toBe(false);
    });

    it('should only call stdin.setRawMode(true) on first enable', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      // Initial call
      expect(mockStdin.setRawMode).toHaveBeenCalledTimes(1);
      expect(mockStdin.setRawMode).toHaveBeenCalledWith(true);

      // Additional enables should not call setRawMode again
      mockStdin.setRawMode.mockClear();
      appContext.setRawMode(true);
      appContext.setRawMode(true);

      expect(mockStdin.setRawMode).not.toHaveBeenCalled();
    });

    it('should only call stdin.setRawMode(false) on last disable', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      // Add references
      appContext.setRawMode(true);
      appContext.setRawMode(true);

      mockStdin.setRawMode.mockClear();

      // First releases should not disable
      appContext.setRawMode(false);
      expect(mockStdin.setRawMode).not.toHaveBeenCalled();

      appContext.setRawMode(false);
      expect(mockStdin.setRawMode).not.toHaveBeenCalled();

      // Last release should disable
      appContext.setRawMode(false);
      expect(mockStdin.setRawMode).toHaveBeenCalledWith(false);
    });
  });

  describe('isRawModeEnabled', () => {
    it('should return true when count > 0', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      expect(appContext.isRawModeEnabled()).toBe(true);

      appContext.setRawMode(true);
      expect(appContext.isRawModeEnabled()).toBe(true);
    });

    it('should return false when count is 0', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      appContext.setRawMode(false);
      expect(appContext.isRawModeEnabled()).toBe(false);
    });
  });

  describe('AppContext integration', () => {
    it('should expose setRawMode on AppContext', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      expect(typeof appContext.setRawMode).toBe('function');
    });

    it('should expose rawModeEnabledCount on AppContext', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      expect(typeof appContext.rawModeEnabledCount).toBe('number');
    });

    it('should expose isRawModeEnabled on AppContext', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      expect(typeof appContext.isRawModeEnabled).toBe('function');
    });
  });

  describe('Use case: Multiple components needing raw mode', () => {
    it('should support multiple components requesting raw mode', () => {
      const appContext = initializeApp(mockStdin, mockStdout);

      // Component 1 needs raw mode
      const component1Enable = () => appContext.setRawMode(true);
      const component1Disable = () => appContext.setRawMode(false);

      // Component 2 needs raw mode
      const component2Enable = () => appContext.setRawMode(true);
      const component2Disable = () => appContext.setRawMode(false);

      // Both enable
      component1Enable();
      component2Enable();
      expect(appContext.rawModeEnabledCount).toBe(3); // Initial + 2

      mockStdin.setRawMode.mockClear();

      // Component 1 unmounts - raw mode should stay enabled
      component1Disable();
      expect(appContext.isRawModeEnabled()).toBe(true);
      expect(mockStdin.setRawMode).not.toHaveBeenCalledWith(false);

      // Component 2 unmounts - still enabled because of initial
      component2Disable();
      expect(appContext.isRawModeEnabled()).toBe(true);

      // Release initial - now disabled
      appContext.setRawMode(false);
      expect(appContext.isRawModeEnabled()).toBe(false);
      expect(mockStdin.setRawMode).toHaveBeenCalledWith(false);
    });
  });

  describe('Non-TTY handling', () => {
    it('should handle setRawMode calls when not TTY', () => {
      mockStdin.isTTY = false;

      const appContext = initializeApp(mockStdin, mockStdout);

      // Should not throw
      expect(() => {
        appContext.setRawMode(true);
        appContext.setRawMode(false);
      }).not.toThrow();

      expect(mockStdin.setRawMode).not.toHaveBeenCalled();
    });
  });
});
