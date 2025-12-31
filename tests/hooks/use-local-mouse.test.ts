/**
 * Tests for useLocalMouse hook
 *
 * Tests component-relative mouse coordinate transformation.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  beginRender,
  endRender,
  resetHookState,
  emitMouseEvent,
  clearMouseHandlers,
  getMouseHandlerCount,
} from '../../src/hooks/context.js';
import {
  useLocalMouse,
  type LocalMouseEvent,
  type Bounds,
} from '../../src/hooks/use-local-mouse.js';
import { resetMouseState } from '../../src/hooks/use-mouse.js';

describe('useLocalMouse hook', () => {
  beforeEach(() => {
    resetHookState();
    clearMouseHandlers();
    resetMouseState();
  });

  afterEach(() => {
    resetHookState();
    clearMouseHandlers();
    resetMouseState();
  });

  const createMouseEvent = (
    x: number,
    y: number,
    options: {
      button?: 'left' | 'right' | 'middle' | 'scroll-up' | 'scroll-down' | 'none';
      action?: 'click' | 'double-click' | 'drag' | 'release' | 'move';
      ctrl?: boolean;
      shift?: boolean;
      alt?: boolean;
    } = {}
  ) => ({
    x,
    y,
    button: options.button ?? 'left',
    action: options.action ?? 'click',
    modifiers: {
      ctrl: options.ctrl ?? false,
      shift: options.shift ?? false,
      alt: options.alt ?? false,
    },
  });

  describe('coordinate transformation', () => {
    it('should transform terminal coordinates to local coordinates', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 12, y: 5, width: 80, height: 24 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      // Click at terminal position (20, 10)
      emitMouseEvent(createMouseEvent(20, 10));

      expect(handler).toHaveBeenCalledTimes(1);
      const event: LocalMouseEvent = handler.mock.calls[0][0];

      // Local coordinates: (20 - 12, 10 - 5) = (8, 5)
      expect(event.x).toBe(8);
      expect(event.y).toBe(5);
      expect(event.globalX).toBe(20);
      expect(event.globalY).toBe(10);
    });

    it('should provide both local and global coordinates', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 10, y: 10, width: 20, height: 10 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      emitMouseEvent(createMouseEvent(15, 15));

      const event: LocalMouseEvent = handler.mock.calls[0][0];
      expect(event.x).toBe(5);
      expect(event.y).toBe(5);
      expect(event.globalX).toBe(15);
      expect(event.globalY).toBe(15);
    });

    it('should handle negative local coordinates for outside clicks', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 10, y: 10, width: 20, height: 10 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      // Click at (5, 5) which is outside and before bounds
      emitMouseEvent(createMouseEvent(5, 5));

      const event: LocalMouseEvent = handler.mock.calls[0][0];
      expect(event.x).toBe(-5); // 5 - 10 = -5
      expect(event.y).toBe(-5); // 5 - 10 = -5
    });
  });

  describe('isInside detection', () => {
    it('should return isInside=true for clicks inside bounds', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 10, y: 10, width: 20, height: 10 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      emitMouseEvent(createMouseEvent(15, 15));

      const event: LocalMouseEvent = handler.mock.calls[0][0];
      expect(event.isInside).toBe(true);
    });

    it('should return isInside=false for clicks outside bounds', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 10, y: 10, width: 20, height: 10 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      emitMouseEvent(createMouseEvent(5, 5));

      const event: LocalMouseEvent = handler.mock.calls[0][0];
      expect(event.isInside).toBe(false);
    });

    it('should correctly detect edge boundaries', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 10, y: 10, width: 20, height: 10 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      // Top-left corner (inside)
      emitMouseEvent(createMouseEvent(10, 10));
      expect(handler.mock.calls[0][0].isInside).toBe(true);

      handler.mockClear();

      // Just outside right edge (x: 10 + 20 = 30, so 30 is outside)
      emitMouseEvent(createMouseEvent(30, 15));
      expect(handler.mock.calls[0][0].isInside).toBe(false);

      handler.mockClear();

      // Just inside right edge (x: 29)
      emitMouseEvent(createMouseEvent(29, 15));
      expect(handler.mock.calls[0][0].isInside).toBe(true);

      handler.mockClear();

      // Just outside bottom edge (y: 10 + 10 = 20, so 20 is outside)
      emitMouseEvent(createMouseEvent(15, 20));
      expect(handler.mock.calls[0][0].isInside).toBe(false);
    });
  });

  describe('onlyInside option', () => {
    it('should filter events outside bounds when onlyInside is true', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 10, y: 10, width: 20, height: 10 };

      beginRender();
      useLocalMouse(bounds, handler, { onlyInside: true, enableTracking: false });
      endRender();

      // Click outside
      emitMouseEvent(createMouseEvent(5, 5));
      expect(handler).toHaveBeenCalledTimes(0);

      // Click inside
      emitMouseEvent(createMouseEvent(15, 15));
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].isInside).toBe(true);
    });

    it('should pass through all events when onlyInside is false', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 10, y: 10, width: 20, height: 10 };

      beginRender();
      useLocalMouse(bounds, handler, { onlyInside: false, enableTracking: false });
      endRender();

      // Click outside
      emitMouseEvent(createMouseEvent(5, 5));
      expect(handler).toHaveBeenCalledTimes(1);

      // Click inside
      emitMouseEvent(createMouseEvent(15, 15));
      expect(handler).toHaveBeenCalledTimes(2);
    });

    it('should default onlyInside to false', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 10, y: 10, width: 20, height: 10 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      // Click outside should still be received
      emitMouseEvent(createMouseEvent(5, 5));
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('reactive bounds', () => {
    it('should support bounds as a getter function', () => {
      const handler = vi.fn();
      let currentBounds: Bounds = { x: 0, y: 0, width: 10, height: 10 };

      beginRender();
      useLocalMouse(() => currentBounds, handler, { enableTracking: false });
      endRender();

      // Initial bounds
      emitMouseEvent(createMouseEvent(5, 5));
      expect(handler.mock.calls[0][0].x).toBe(5);
      expect(handler.mock.calls[0][0].y).toBe(5);

      handler.mockClear();

      // Update bounds
      currentBounds = { x: 5, y: 5, width: 10, height: 10 };

      // Same terminal position, different local coordinates
      emitMouseEvent(createMouseEvent(10, 10));
      expect(handler.mock.calls[0][0].x).toBe(5); // 10 - 5 = 5
      expect(handler.mock.calls[0][0].y).toBe(5); // 10 - 5 = 5
    });

    it('should re-evaluate bounds getter on each event', () => {
      const handler = vi.fn();
      let boundsCallCount = 0;
      const boundsGetter = () => {
        boundsCallCount++;
        return { x: 0, y: 0, width: 10, height: 10 };
      };

      beginRender();
      useLocalMouse(boundsGetter, handler, { enableTracking: false });
      endRender();

      emitMouseEvent(createMouseEvent(5, 5));
      emitMouseEvent(createMouseEvent(5, 5));
      emitMouseEvent(createMouseEvent(5, 5));

      expect(boundsCallCount).toBe(3);
    });
  });

  describe('mouse actions', () => {
    it('should pass through all mouse actions', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      // Test various actions
      emitMouseEvent(createMouseEvent(10, 10, { action: 'click' }));
      expect(handler.mock.calls[0][0].action).toBe('click');

      emitMouseEvent(createMouseEvent(10, 10, { action: 'drag' }));
      expect(handler.mock.calls[1][0].action).toBe('drag');

      emitMouseEvent(createMouseEvent(10, 10, { action: 'release' }));
      expect(handler.mock.calls[2][0].action).toBe('release');

      emitMouseEvent(createMouseEvent(10, 10, { action: 'move' }));
      expect(handler.mock.calls[3][0].action).toBe('move');
    });

    it('should preserve button information', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      emitMouseEvent(createMouseEvent(10, 10, { button: 'left' }));
      expect(handler.mock.calls[0][0].button).toBe('left');

      emitMouseEvent(createMouseEvent(10, 10, { button: 'right' }));
      expect(handler.mock.calls[1][0].button).toBe('right');

      emitMouseEvent(createMouseEvent(10, 10, { button: 'middle' }));
      expect(handler.mock.calls[2][0].button).toBe('middle');
    });

    it('should preserve modifier keys', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };

      beginRender();
      useLocalMouse(bounds, handler, { enableTracking: false });
      endRender();

      emitMouseEvent(createMouseEvent(10, 10, { ctrl: true, shift: true, alt: false }));

      const event: LocalMouseEvent = handler.mock.calls[0][0];
      expect(event.modifiers.ctrl).toBe(true);
      expect(event.modifiers.shift).toBe(true);
      expect(event.modifiers.alt).toBe(false);
    });
  });

  describe('isActive option', () => {
    it('should not register handler when isActive is false', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };

      beginRender();
      useLocalMouse(bounds, handler, { isActive: false, enableTracking: false });
      endRender();

      expect(getMouseHandlerCount()).toBe(0);

      emitMouseEvent(createMouseEvent(10, 10));
      expect(handler).toHaveBeenCalledTimes(0);
    });

    it('should register handler when isActive is true', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };

      beginRender();
      useLocalMouse(bounds, handler, { isActive: true, enableTracking: false });
      endRender();

      expect(getMouseHandlerCount()).toBe(1);
    });

    it('should handle isActive changes across renders', () => {
      const handler = vi.fn();
      const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };

      // First render - active
      beginRender();
      useLocalMouse(bounds, handler, { isActive: true, enableTracking: false });
      endRender();

      expect(getMouseHandlerCount()).toBe(1);

      // Second render - inactive
      beginRender();
      useLocalMouse(bounds, handler, { isActive: false, enableTracking: false });
      endRender();

      expect(getMouseHandlerCount()).toBe(0);

      // Third render - active again
      beginRender();
      useLocalMouse(bounds, handler, { isActive: true, enableTracking: false });
      endRender();

      expect(getMouseHandlerCount()).toBe(1);
    });
  });

  describe('handler updates', () => {
    it('should use latest handler on subsequent renders', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const bounds: Bounds = { x: 0, y: 0, width: 100, height: 100 };

      // First render
      beginRender();
      useLocalMouse(bounds, handler1, { enableTracking: false });
      endRender();

      emitMouseEvent(createMouseEvent(10, 10));
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(0);

      handler1.mockClear();

      // Second render with new handler
      beginRender();
      useLocalMouse(bounds, handler2, { enableTracking: false });
      endRender();

      emitMouseEvent(createMouseEvent(10, 10));
      expect(handler1).toHaveBeenCalledTimes(0);
      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup', () => {
    it('should provide cleanupLocalMouse function', async () => {
      const { cleanupLocalMouse } = await import('../../src/hooks/use-local-mouse.js');
      expect(typeof cleanupLocalMouse).toBe('function');
    });
  });
});
