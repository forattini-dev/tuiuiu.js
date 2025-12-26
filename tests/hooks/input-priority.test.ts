/**
 * Input Priority System Tests
 *
 * Tests for the priority-based input handling system that prevents
 * input leakage to background components when modals/overlays are active.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addInputHandler,
  removeInputHandlerById,
  emitInput,
  clearInputHandlers,
  getInputHandlerCount,
  getInputHandlers,
} from '../../src/hooks/context.js';
import { INPUT_PRIORITY_VALUES } from '../../src/hooks/types.js';
import type { Key, InputHandler } from '../../src/hooks/types.js';

// Helper to create a mock key object
function createKey(overrides: Partial<Key> = {}): Key {
  return {
    upArrow: false,
    downArrow: false,
    leftArrow: false,
    rightArrow: false,
    pageUp: false,
    pageDown: false,
    home: false,
    end: false,
    insert: false,
    return: false,
    escape: false,
    tab: false,
    backspace: false,
    delete: false,
    clear: false,
    ctrl: false,
    shift: false,
    meta: false,
    option: false,
    f1: false,
    f2: false,
    f3: false,
    f4: false,
    f5: false,
    f6: false,
    f7: false,
    f8: false,
    f9: false,
    f10: false,
    f11: false,
    f12: false,
    ...overrides,
  };
}

describe('Input Priority System', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  describe('INPUT_PRIORITY_VALUES', () => {
    it('should have correct priority ordering', () => {
      expect(INPUT_PRIORITY_VALUES.background).toBeLessThan(INPUT_PRIORITY_VALUES.normal);
      expect(INPUT_PRIORITY_VALUES.normal).toBeLessThan(INPUT_PRIORITY_VALUES.modal);
      expect(INPUT_PRIORITY_VALUES.modal).toBeLessThan(INPUT_PRIORITY_VALUES.critical);
    });

    it('should have all priority levels defined', () => {
      expect(INPUT_PRIORITY_VALUES).toHaveProperty('background');
      expect(INPUT_PRIORITY_VALUES).toHaveProperty('normal');
      expect(INPUT_PRIORITY_VALUES).toHaveProperty('modal');
      expect(INPUT_PRIORITY_VALUES).toHaveProperty('critical');
    });
  });

  describe('addInputHandler', () => {
    it('should add handler with default priority (normal)', () => {
      const handler = vi.fn();
      addInputHandler(handler);

      expect(getInputHandlerCount()).toBe(1);
      const handlers = getInputHandlers();
      expect(handlers[0].priorityValue).toBe(INPUT_PRIORITY_VALUES.normal);
      expect(handlers[0].stopPropagation).toBe(false);
    });

    it('should add handler with specified priority', () => {
      const handler = vi.fn();
      addInputHandler(handler, { priority: 'modal' });

      const handlers = getInputHandlers();
      expect(handlers[0].priorityValue).toBe(INPUT_PRIORITY_VALUES.modal);
    });

    it('should add handler with stopPropagation', () => {
      const handler = vi.fn();
      addInputHandler(handler, { stopPropagation: true });

      const handlers = getInputHandlers();
      expect(handlers[0].stopPropagation).toBe(true);
    });

    it('should return unique handler ID', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const id1 = addInputHandler(handler1);
      const id2 = addInputHandler(handler2);

      expect(id1).not.toBe(id2);
    });
  });

  describe('removeInputHandlerById', () => {
    it('should remove handler by ID', () => {
      const handler = vi.fn();
      const id = addInputHandler(handler);

      expect(getInputHandlerCount()).toBe(1);
      const removed = removeInputHandlerById(id);
      expect(removed).toBe(true);
      expect(getInputHandlerCount()).toBe(0);
    });

    it('should return false for non-existent ID', () => {
      const removed = removeInputHandlerById(999);
      expect(removed).toBe(false);
    });

    it('should only remove specified handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const id1 = addInputHandler(handler1);
      addInputHandler(handler2);

      expect(getInputHandlerCount()).toBe(2);
      removeInputHandlerById(id1);
      expect(getInputHandlerCount()).toBe(1);

      // Emit to verify handler2 is still active
      emitInput('x', createKey());
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });
  });

  describe('emitInput - Priority Ordering', () => {
    it('should call handlers in priority order (highest first)', () => {
      const callOrder: string[] = [];

      addInputHandler(() => { callOrder.push('background'); }, { priority: 'background' });
      addInputHandler(() => { callOrder.push('normal'); }, { priority: 'normal' });
      addInputHandler(() => { callOrder.push('modal'); }, { priority: 'modal' });
      addInputHandler(() => { callOrder.push('critical'); }, { priority: 'critical' });

      emitInput('x', createKey());

      expect(callOrder).toEqual(['critical', 'modal', 'normal', 'background']);
    });

    it('should maintain registration order for same priority', () => {
      const callOrder: string[] = [];

      addInputHandler(() => { callOrder.push('first'); }, { priority: 'normal' });
      addInputHandler(() => { callOrder.push('second'); }, { priority: 'normal' });
      addInputHandler(() => { callOrder.push('third'); }, { priority: 'normal' });

      emitInput('x', createKey());

      expect(callOrder).toEqual(['first', 'second', 'third']);
    });
  });

  describe('emitInput - Stop Propagation', () => {
    it('should stop propagation when handler returns truthy with stopPropagation flag', () => {
      const backgroundHandler = vi.fn();
      const normalHandler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(true);

      addInputHandler(backgroundHandler, { priority: 'background' });
      addInputHandler(normalHandler, { priority: 'normal' });
      addInputHandler(modalHandler, { priority: 'modal', stopPropagation: true });

      emitInput('x', createKey());

      expect(modalHandler).toHaveBeenCalled();
      expect(normalHandler).not.toHaveBeenCalled();
      expect(backgroundHandler).not.toHaveBeenCalled();
    });

    it('should NOT stop propagation when handler returns falsy', () => {
      const backgroundHandler = vi.fn();
      const normalHandler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(false);

      addInputHandler(backgroundHandler, { priority: 'background' });
      addInputHandler(normalHandler, { priority: 'normal' });
      addInputHandler(modalHandler, { priority: 'modal', stopPropagation: true });

      emitInput('x', createKey());

      expect(modalHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(backgroundHandler).toHaveBeenCalled();
    });

    it('should NOT stop propagation when stopPropagation is false even if handler returns truthy', () => {
      const normalHandler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(true);

      addInputHandler(normalHandler, { priority: 'normal' });
      addInputHandler(modalHandler, { priority: 'modal', stopPropagation: false });

      emitInput('x', createKey());

      expect(modalHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
    });

    it('should continue to handlers at same priority even with stopPropagation', () => {
      const callOrder: string[] = [];

      addInputHandler(() => { callOrder.push('normal1'); }, { priority: 'normal' });
      addInputHandler(() => { callOrder.push('normal2'); return true; }, { priority: 'normal', stopPropagation: true });
      addInputHandler(() => { callOrder.push('background'); }, { priority: 'background' });

      emitInput('x', createKey());

      // normal1 fires first (same priority, earlier registered)
      // normal2 fires and returns true with stopPropagation
      // background should NOT fire (lower priority)
      expect(callOrder).toContain('normal1');
      expect(callOrder).toContain('normal2');
      expect(callOrder).not.toContain('background');
    });
  });

  describe('emitInput - Error Handling', () => {
    it('should catch errors in handlers and continue to next', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const handler1 = vi.fn().mockImplementation(() => {
        throw new Error('Test error');
      });
      const handler2 = vi.fn();

      addInputHandler(handler1, { priority: 'modal' });
      addInputHandler(handler2, { priority: 'normal' });

      emitInput('x', createKey());

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        '[tuiuiu] Error in input handler:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });
  });

  describe('clearInputHandlers', () => {
    it('should remove all handlers', () => {
      addInputHandler(vi.fn());
      addInputHandler(vi.fn());
      addInputHandler(vi.fn());

      expect(getInputHandlerCount()).toBe(3);
      clearInputHandlers();
      expect(getInputHandlerCount()).toBe(0);
    });
  });

  describe('Real-world Scenarios', () => {
    it('should block background input when modal is open', () => {
      const backgroundHandler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(true);

      // Simulate background component
      addInputHandler(backgroundHandler, { priority: 'normal' });

      // Simulate modal opening
      const modalId = addInputHandler(modalHandler, {
        priority: 'modal',
        stopPropagation: true,
      });

      // Input should only go to modal
      emitInput('x', createKey());
      expect(modalHandler).toHaveBeenCalled();
      expect(backgroundHandler).not.toHaveBeenCalled();

      // Simulate modal closing
      removeInputHandlerById(modalId);
      vi.clearAllMocks();

      // Input should now go to background
      emitInput('y', createKey());
      expect(backgroundHandler).toHaveBeenCalled();
    });

    it('should handle nested modals correctly', () => {
      const backgroundHandler = vi.fn();
      const modal1Handler = vi.fn().mockReturnValue(true);
      const modal2Handler = vi.fn().mockReturnValue(true);

      addInputHandler(backgroundHandler, { priority: 'normal' });
      const modal1Id = addInputHandler(modal1Handler, {
        priority: 'modal',
        stopPropagation: true,
      });
      const modal2Id = addInputHandler(modal2Handler, {
        priority: 'modal',
        stopPropagation: true,
      });

      // Both modals registered, first one (earlier) fires first due to same priority
      emitInput('x', createKey());
      expect(modal1Handler).toHaveBeenCalled();
      expect(modal2Handler).not.toHaveBeenCalled(); // Stopped by modal1
      expect(backgroundHandler).not.toHaveBeenCalled();

      // Close first modal
      removeInputHandlerById(modal1Id);
      vi.clearAllMocks();

      // Now modal2 handles input
      emitInput('y', createKey());
      expect(modal2Handler).toHaveBeenCalled();
      expect(backgroundHandler).not.toHaveBeenCalled();

      // Close second modal
      removeInputHandlerById(modal2Id);
      vi.clearAllMocks();

      // Now background handles input
      emitInput('z', createKey());
      expect(backgroundHandler).toHaveBeenCalled();
    });

    it('should allow critical dialog to override modal', () => {
      const modalHandler = vi.fn();
      const criticalHandler = vi.fn().mockReturnValue(true);

      addInputHandler(modalHandler, { priority: 'modal', stopPropagation: true });
      addInputHandler(criticalHandler, { priority: 'critical', stopPropagation: true });

      emitInput('x', createKey());

      expect(criticalHandler).toHaveBeenCalled();
      expect(modalHandler).not.toHaveBeenCalled();
    });

    it('should allow background handlers for analytics/debugging', () => {
      const analyticsHandler = vi.fn();
      const normalHandler = vi.fn();

      addInputHandler(analyticsHandler, { priority: 'background' });
      addInputHandler(normalHandler, { priority: 'normal' });

      emitInput('x', createKey());

      // Both should be called (no stopPropagation)
      expect(normalHandler).toHaveBeenCalled();
      expect(analyticsHandler).toHaveBeenCalled();
    });
  });
});
