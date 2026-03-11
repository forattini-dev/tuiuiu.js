/**
 * Tests for cell size invalidation on terminal resize
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getGraphicsCapabilities,
  resetGraphicsDetection,
  invalidateCellSize,
  onCellSizeChange,
  queryGraphicsCapabilities,
} from '../../src/core/graphics.js';

describe('Cell size invalidation', () => {
  beforeEach(() => {
    resetGraphicsDetection();
    // Clear relevant env vars
    delete process.env.TUIUIU_GRAPHICS;
    delete process.env.TERM_PROGRAM;
    delete process.env.TERM;
    delete process.env.COLORTERM;
    delete process.env.FORCE_COLOR;
    delete process.env.KITTY_WINDOW_ID;
    delete process.env.ITERM_SESSION_ID;
    delete process.env.GHOSTTY_RESOURCES_DIR;
    delete process.env.WEZTERM_PANE;
    delete process.env.WT_SESSION;
  });

  it('invalidateCellSize is a no-op when no capabilities are cached', () => {
    // Should not throw
    expect(() => invalidateCellSize()).not.toThrow();
  });

  it('invalidateCellSize resets cell size to defaults after query', async () => {
    // First, negotiate capabilities with a custom cell size via transport
    const transport = {
      isAvailable: () => true,
      request: async () => {
        // Simulate a response with cell size 12x24
        return '\x1b[6;24;12t\x1b[?0n';
      },
    };

    const caps = await queryGraphicsCapabilities({
      transport,
      force: true,
    });

    expect(caps.cellSize.width).toBe(12);
    expect(caps.cellSize.height).toBe(24);

    // Now the capabilities are cached
    const cached = getGraphicsCapabilities();
    expect(cached.cellSize.width).toBe(12);
    expect(cached.cellSize.height).toBe(24);

    // Invalidate cell size (simulating terminal resize)
    invalidateCellSize();

    // After invalidation, the cached capabilities should have default cell size
    // since we reset to defaults (no re-query, just invalidation)
    const afterInvalidation = getGraphicsCapabilities();
    expect(afterInvalidation.cellSize).toBeDefined();
    expect(afterInvalidation.cellSize.width).toBeGreaterThan(0);
    expect(afterInvalidation.cellSize.height).toBeGreaterThan(0);
  });

  it('invalidateCellSize preserves the protocol after invalidation', async () => {
    const transport = {
      isAvailable: () => true,
      request: async () => {
        // Simulate kitty graphics response with cell size
        return '\x1b_Gi=31;OK\x1b\\\x1b[6;20;10t\x1b[?0n';
      },
    };

    const caps = await queryGraphicsCapabilities({
      transport,
      force: true,
    });

    expect(caps.protocol).toBe('kitty');

    invalidateCellSize();

    const afterInvalidation = getGraphicsCapabilities();
    expect(afterInvalidation.protocol).toBe('kitty');
  });
});

describe('onCellSizeChange', () => {
  beforeEach(() => {
    resetGraphicsDetection();
    delete process.env.TUIUIU_GRAPHICS;
    delete process.env.TERM_PROGRAM;
    delete process.env.TERM;
    delete process.env.COLORTERM;
    delete process.env.FORCE_COLOR;
    delete process.env.KITTY_WINDOW_ID;
    delete process.env.ITERM_SESSION_ID;
    delete process.env.GHOSTTY_RESOURCES_DIR;
    delete process.env.WEZTERM_PANE;
    delete process.env.WT_SESSION;
  });

  it('listener is called when cell size changes after invalidation', async () => {
    const transport = {
      isAvailable: () => true,
      request: async () => {
        return '\x1b[6;24;12t\x1b[?0n';
      },
    };

    await queryGraphicsCapabilities({ transport, force: true });

    const listener = vi.fn();
    const cleanup = onCellSizeChange(listener);

    invalidateCellSize();

    // The default cell size (10x20) differs from queried (12x24),
    // so the listener should have been called
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        width: expect.any(Number),
        height: expect.any(Number),
      }),
    );

    cleanup();
  });

  it('listener is NOT called when cell size has not changed', async () => {
    // Query with default cell size (10x20) which matches the fallback
    const transport = {
      isAvailable: () => true,
      request: async () => {
        return '\x1b[6;20;10t\x1b[?0n';
      },
    };

    await queryGraphicsCapabilities({ transport, force: true });

    const listener = vi.fn();
    const cleanup = onCellSizeChange(listener);

    invalidateCellSize();

    // Cell size was 10x20 and defaults to 10x20, so no change
    expect(listener).not.toHaveBeenCalled();

    cleanup();
  });

  it('cleanup removes the listener', async () => {
    const transport = {
      isAvailable: () => true,
      request: async () => {
        return '\x1b[6;24;12t\x1b[?0n';
      },
    };

    await queryGraphicsCapabilities({ transport, force: true });

    const listener = vi.fn();
    const cleanup = onCellSizeChange(listener);

    // Remove listener before invalidation
    cleanup();

    invalidateCellSize();

    expect(listener).not.toHaveBeenCalled();
  });

  it('multiple listeners are supported', async () => {
    const transport = {
      isAvailable: () => true,
      request: async () => {
        return '\x1b[6;30;15t\x1b[?0n';
      },
    };

    await queryGraphicsCapabilities({ transport, force: true });

    const listener1 = vi.fn();
    const listener2 = vi.fn();
    const cleanup1 = onCellSizeChange(listener1);
    const cleanup2 = onCellSizeChange(listener2);

    invalidateCellSize();

    expect(listener1).toHaveBeenCalledTimes(1);
    expect(listener2).toHaveBeenCalledTimes(1);

    cleanup1();
    cleanup2();
  });

  it('resetGraphicsDetection clears all listeners', async () => {
    const listener = vi.fn();
    onCellSizeChange(listener);

    // Reset clears listeners
    resetGraphicsDetection();

    // Set up capabilities again so invalidation has something to work with
    const transport = {
      isAvailable: () => true,
      request: async () => {
        return '\x1b[6;24;12t\x1b[?0n';
      },
    };
    await queryGraphicsCapabilities({ transport, force: true });

    invalidateCellSize();

    // Listener was cleared by reset, should not be called
    expect(listener).not.toHaveBeenCalled();
  });
});
