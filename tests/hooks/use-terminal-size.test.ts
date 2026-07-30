/**
 * Tests for useTerminalSize hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTerminalSize } from '../../src/hooks/use-terminal-size.js';
import * as capabilities from '../../src/core/capabilities.js';
import {
  beginRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';

function renderTerminalSize() {
  beginRender('component');
  try {
    return useTerminalSize();
  } finally {
    endRender();
  }
}

describe('useTerminalSize hook', () => {
  let mockSize = { columns: 120, rows: 40 };
  let registeredHandler: ((size: { columns: number; rows: number }) => void) | null = null;

  beforeEach(() => {
    mockSize = { columns: 120, rows: 40 };
    registeredHandler = null;

    vi.spyOn(capabilities, 'getTerminalSize').mockImplementation(() => ({ ...mockSize }));
    vi.spyOn(capabilities, 'onResize').mockImplementation((handler) => {
      registeredHandler = handler;
      return () => {
        registeredHandler = null;
      };
    });

    resetHookState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useTerminalSize', () => {
    it('should return current terminal size', () => {
      const size = renderTerminalSize();

      expect(size.columns).toBe(120);
      expect(size.rows).toBe(40);
    });

    it('should call getTerminalSize on initialization', () => {
      renderTerminalSize();

      expect(capabilities.getTerminalSize).toHaveBeenCalled();
    });

    it('should subscribe to resize events', () => {
      renderTerminalSize();

      expect(capabilities.onResize).toHaveBeenCalled();
    });

    it('should register a resize handler', () => {
      renderTerminalSize();

      expect(registeredHandler).not.toBeNull();
    });

    it('should handle different terminal sizes', () => {
      mockSize = { columns: 80, rows: 24 };
      const size = renderTerminalSize();

      expect(size.columns).toBe(80);
      expect(size.rows).toBe(24);
    });

    it('should return cleanup function from onResize', () => {
      renderTerminalSize();

      expect(capabilities.onResize).toHaveBeenCalled();
      const onResizeCall = vi.mocked(capabilities.onResize).mock.results[0];
      expect(onResizeCall?.value).toBeInstanceOf(Function);
    });

    it('keeps resize updates across component re-renders', () => {
      const first = renderTerminalSize();
      expect(first).toEqual({ columns: 120, rows: 40 });

      registeredHandler?.({ columns: 92, rows: 31 });
      const resized = renderTerminalSize();

      expect(resized).toEqual({ columns: 92, rows: 31 });
      expect(capabilities.getTerminalSize).toHaveBeenCalledTimes(1);
      expect(capabilities.onResize).toHaveBeenCalledTimes(1);
    });
  });
});
