/**
 * Tests for useTerminalSize hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useTerminalSize } from '../../src/hooks/use-terminal-size.js';
import * as capabilities from '../../src/core/capabilities.js';
import { resetHookState } from '../../src/hooks/context.js';

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
      const size = useTerminalSize();

      expect(size.columns).toBe(120);
      expect(size.rows).toBe(40);
    });

    it('should call getTerminalSize on initialization', () => {
      useTerminalSize();

      expect(capabilities.getTerminalSize).toHaveBeenCalled();
    });

    it('should subscribe to resize events', () => {
      useTerminalSize();

      expect(capabilities.onResize).toHaveBeenCalled();
    });

    it('should register a resize handler', () => {
      useTerminalSize();

      expect(registeredHandler).not.toBeNull();
    });

    it('should handle different terminal sizes', () => {
      mockSize = { columns: 80, rows: 24 };
      const size = useTerminalSize();

      expect(size.columns).toBe(80);
      expect(size.rows).toBe(24);
    });

    it('should return cleanup function from onResize', () => {
      useTerminalSize();

      expect(capabilities.onResize).toHaveBeenCalled();
      const onResizeCall = vi.mocked(capabilities.onResize).mock.results[0];
      expect(onResizeCall?.value).toBeInstanceOf(Function);
    });
  });
});
