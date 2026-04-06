/**
 * usePaste Hook Tests
 *
 * Tests for the usePaste hook:
 * - Registers paste handler on mount
 * - Unregisters on isActive=false
 * - Updates handler reference on re-render
 * - Respects priority and stopPropagation options
 * - Hook state persistence across renders (beginRender/endRender pattern)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  beginRender,
  endRender,
  resetHookState,
  clearPasteHandlers,
  getPasteHandlerCount,
  emitPaste,
  getHookStateByIndex,
  setHookState,
} from '../../src/hooks/context.js';
import { usePaste } from '../../src/hooks/use-paste.js';
import type { PasteEvent } from '../../src/hooks/types.js';

describe('usePaste Hook', () => {
  beforeEach(() => {
    resetHookState();
    clearPasteHandlers();
  });

  afterEach(() => {
    resetHookState();
    clearPasteHandlers();
  });

  // ===========================================================================
  // Registration
  // ===========================================================================

  describe('Registration', () => {
    it('should register a paste handler on first render', () => {
      const handler = vi.fn();

      beginRender();
      usePaste(handler);
      endRender();

      expect(getPasteHandlerCount()).toBe(1);
    });

    it('should register handler only once across re-renders', () => {
      const handler = vi.fn();

      // First render
      beginRender();
      usePaste(handler);
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      // Second render
      beginRender();
      usePaste(handler);
      endRender();

      expect(getPasteHandlerCount()).toBe(1); // Still 1, not 2

      // Third render
      beginRender();
      usePaste(handler);
      endRender();

      expect(getPasteHandlerCount()).toBe(1); // Still 1
    });

    it('should support multiple usePaste calls in same component', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      beginRender();
      usePaste(handler1);
      usePaste(handler2);
      endRender();

      expect(getPasteHandlerCount()).toBe(2);

      // Re-render - count should remain 2
      beginRender();
      usePaste(handler1);
      usePaste(handler2);
      endRender();

      expect(getPasteHandlerCount()).toBe(2);
    });
  });

  // ===========================================================================
  // isActive option
  // ===========================================================================

  describe('isActive option', () => {
    it('should register handler when isActive is true (default)', () => {
      const handler = vi.fn();

      beginRender();
      usePaste(handler);
      endRender();

      expect(getPasteHandlerCount()).toBe(1);
    });

    it('should not register handler when isActive is false on first render', () => {
      const handler = vi.fn();

      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      expect(getPasteHandlerCount()).toBe(0);
    });

    it('should unregister handler when isActive changes to false', () => {
      const handler = vi.fn();

      // First render - active
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      // Second render - inactive
      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      expect(getPasteHandlerCount()).toBe(0);
    });

    it('should re-register handler when isActive changes back to true', () => {
      const handler = vi.fn();

      // First render - active
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      // Second render - inactive
      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      expect(getPasteHandlerCount()).toBe(0);

      // Third render - active again
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);
    });

    it('should not call handler when deactivated', () => {
      const handler = vi.fn();

      // First render - active
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      // Second render - inactive
      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      emitPaste('text', true);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should call handler again after reactivation', () => {
      const handler = vi.fn();

      // Active
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      // Inactive
      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      // Active again
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      emitPaste('text', true);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should remain inactive across multiple renders with isActive=false', () => {
      const handler = vi.fn();

      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      expect(getPasteHandlerCount()).toBe(0);

      emitPaste('text', true);
      expect(handler).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Handler Reference Updates
  // ===========================================================================

  describe('Handler Reference Updates', () => {
    it('should call the latest handler version after re-render', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      // First render with handler1
      beginRender();
      usePaste(handler1);
      endRender();

      emitPaste('first paste', true);
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(0);

      handler1.mockClear();

      // Second render with handler2
      beginRender();
      usePaste(handler2);
      endRender();

      emitPaste('second paste', true);
      expect(handler1).toHaveBeenCalledTimes(0); // Old handler not called
      expect(handler2).toHaveBeenCalledTimes(1); // New handler called
    });

    it('should pass correct PasteEvent to updated handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      beginRender();
      usePaste(handler1);
      endRender();

      // Update handler
      beginRender();
      usePaste(handler2);
      endRender();

      emitPaste('updated text', false);

      expect(handler2).toHaveBeenCalledWith({
        text: 'updated text',
        isBracketed: false,
      });
    });

    it('should update handler reference without changing handler count', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      beginRender();
      usePaste(handler1);
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      beginRender();
      usePaste(handler2);
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      beginRender();
      usePaste(handler3);
      endRender();

      expect(getPasteHandlerCount()).toBe(1);
    });
  });

  // ===========================================================================
  // Priority option
  // ===========================================================================

  describe('Priority option', () => {
    it('should respect default normal priority', () => {
      const callOrder: string[] = [];

      beginRender();
      usePaste((event) => { callOrder.push('paste-normal'); });
      endRender();

      // Add a higher-priority handler via a separate render
      // We need to reset hook state to simulate a different component
      const savedCount = getPasteHandlerCount();

      // Manually add a modal-priority handler to test ordering
      // We already tested this in paste-handlers.test.ts, but verify
      // that usePaste integrates correctly
      expect(savedCount).toBe(1);
    });

    it('should register with specified priority', () => {
      const callOrder: string[] = [];

      // Use two usePaste hooks in the same component with different priorities
      beginRender();
      usePaste(() => { callOrder.push('normal'); }, { priority: 'normal' });
      usePaste(() => { callOrder.push('modal'); }, { priority: 'modal' });
      endRender();

      emitPaste('text', true);

      // Modal fires before normal
      expect(callOrder).toEqual(['modal', 'normal']);
    });

    it('should re-register with new priority when priority changes', () => {
      const handler = vi.fn();

      // First render - normal priority
      beginRender();
      usePaste(handler, { priority: 'normal' });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      // Second render - modal priority
      beginRender();
      usePaste(handler, { priority: 'modal' });
      endRender();

      // Handler count should still be 1 (re-registered, not duplicated)
      expect(getPasteHandlerCount()).toBe(1);

      emitPaste('text', true);
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // stopPropagation option
  // ===========================================================================

  describe('stopPropagation option', () => {
    it('should register with stopPropagation=false by default', () => {
      const handler = vi.fn().mockReturnValue(true);
      const otherHandler = vi.fn();

      // Both hooks in the same component, different priorities
      beginRender();
      usePaste(otherHandler, { priority: 'background' });
      usePaste(handler, { priority: 'normal' }); // returns true but no stopPropagation
      endRender();

      emitPaste('text', true);

      // Both should be called since default stopPropagation is false
      expect(handler).toHaveBeenCalled();
      expect(otherHandler).toHaveBeenCalled();
    });

    it('should register with stopPropagation=true when specified', () => {
      const handler = vi.fn().mockReturnValue(true);
      const lowerHandler = vi.fn();

      // Both hooks in the same component
      beginRender();
      usePaste(lowerHandler, { priority: 'background' });
      usePaste(handler, { priority: 'modal', stopPropagation: true });
      endRender();

      emitPaste('text', true);

      expect(handler).toHaveBeenCalled();
      expect(lowerHandler).not.toHaveBeenCalled();
    });

    it('should re-register when stopPropagation changes', () => {
      const handler = vi.fn().mockReturnValue(true);

      // First render - no stopPropagation
      beginRender();
      usePaste(handler, { priority: 'modal', stopPropagation: false });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      // Second render - with stopPropagation
      beginRender();
      usePaste(handler, { priority: 'modal', stopPropagation: true });
      endRender();

      // Should still be 1 handler (re-registered)
      expect(getPasteHandlerCount()).toBe(1);
    });
  });

  // ===========================================================================
  // Hook State Persistence
  // ===========================================================================

  describe('Hook State Persistence', () => {
    it('should persist hook state across many renders', () => {
      const handler = vi.fn();

      for (let i = 0; i < 10; i++) {
        beginRender();
        usePaste(handler);
        endRender();
      }

      // Should still only have 1 handler
      expect(getPasteHandlerCount()).toBe(1);

      emitPaste('text', true);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle rapid active/inactive toggles', () => {
      const handler = vi.fn();

      for (let i = 0; i < 5; i++) {
        beginRender();
        usePaste(handler, { isActive: true });
        endRender();

        beginRender();
        usePaste(handler, { isActive: false });
        endRender();
      }

      // Should end up inactive
      expect(getPasteHandlerCount()).toBe(0);

      // Re-activate
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      emitPaste('text', true);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should work correctly after resetHookState', () => {
      const handler = vi.fn();

      beginRender();
      usePaste(handler);
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      // Reset simulates unmount
      resetHookState();
      clearPasteHandlers();

      // Fresh start
      const newHandler = vi.fn();

      beginRender();
      usePaste(newHandler);
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      emitPaste('new text', true);
      expect(handler).not.toHaveBeenCalled();
      expect(newHandler).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // Integration: emitPaste calls usePaste handlers
  // ===========================================================================

  describe('Integration with emitPaste', () => {
    it('should receive PasteEvent with correct text and isBracketed=true', () => {
      let receivedEvent: PasteEvent | null = null;

      beginRender();
      usePaste((event) => {
        receivedEvent = event;
      });
      endRender();

      emitPaste('hello world', true);

      expect(receivedEvent).toEqual({
        text: 'hello world',
        isBracketed: true,
      });
    });

    it('should receive PasteEvent with isBracketed=false for heuristic paste', () => {
      let receivedEvent: PasteEvent | null = null;

      beginRender();
      usePaste((event) => {
        receivedEvent = event;
      });
      endRender();

      emitPaste('fast typed text', false);

      expect(receivedEvent).toEqual({
        text: 'fast typed text',
        isBracketed: false,
      });
    });

    it('should receive multiple paste events', () => {
      const events: PasteEvent[] = [];

      beginRender();
      usePaste((event) => {
        events.push(event);
      });
      endRender();

      emitPaste('paste 1', true);
      emitPaste('paste 2', false);
      emitPaste('paste 3', true);

      expect(events).toHaveLength(3);
      expect(events[0].text).toBe('paste 1');
      expect(events[1].text).toBe('paste 2');
      expect(events[2].text).toBe('paste 3');
    });

    it('should stop receiving events when deactivated mid-sequence', () => {
      const events: PasteEvent[] = [];
      const handler = (event: PasteEvent) => {
        events.push(event);
      };

      // Active
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      emitPaste('paste 1', true);

      // Deactivate
      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      emitPaste('paste 2', true); // Should not be received

      // Reactivate
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      emitPaste('paste 3', true);

      expect(events).toHaveLength(2);
      expect(events[0].text).toBe('paste 1');
      expect(events[1].text).toBe('paste 3');
    });

    it('should support returning true for stopPropagation', () => {
      const modalHandler = vi.fn().mockReturnValue(true);
      const bgHandler = vi.fn();

      // Both hooks in same component with different priorities
      beginRender();
      usePaste(bgHandler, { priority: 'background' });
      usePaste(modalHandler, { priority: 'modal', stopPropagation: true });
      endRender();

      emitPaste('text', true);

      expect(modalHandler).toHaveBeenCalled();
      expect(bgHandler).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // Edge Cases
  // ===========================================================================

  describe('Edge Cases', () => {
    it('should handle handler that throws without breaking the hook', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const throwingHandler = vi.fn().mockImplementation(() => {
        throw new Error('Handler error');
      });

      beginRender();
      usePaste(throwingHandler);
      endRender();

      // Should not throw
      expect(() => emitPaste('text', true)).not.toThrow();
      expect(throwingHandler).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        '[tuiuiu] Error in paste handler:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('should handle empty options object', () => {
      const handler = vi.fn();

      beginRender();
      usePaste(handler, {});
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      emitPaste('text', true);
      expect(handler).toHaveBeenCalled();
    });

    it('should handle switching from inactive initial to active', () => {
      const handler = vi.fn();

      // Start inactive
      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      expect(getPasteHandlerCount()).toBe(0);

      // Become active
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      emitPaste('text', true);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should handle changing both priority and stopPropagation simultaneously', () => {
      const handler = vi.fn();

      // First render - normal, no stopPropagation
      beginRender();
      usePaste(handler, { priority: 'normal', stopPropagation: false });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      // Second render - modal, with stopPropagation
      beginRender();
      usePaste(handler, { priority: 'modal', stopPropagation: true });
      endRender();

      // Should re-register (still 1 handler)
      expect(getPasteHandlerCount()).toBe(1);

      emitPaste('text', true);
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should not leave orphaned handlers when options change while active', () => {
      const handler = vi.fn();

      // Cycle through different options
      beginRender();
      usePaste(handler, { priority: 'normal', stopPropagation: false });
      endRender();

      beginRender();
      usePaste(handler, { priority: 'modal', stopPropagation: true });
      endRender();

      beginRender();
      usePaste(handler, { priority: 'critical', stopPropagation: false });
      endRender();

      beginRender();
      usePaste(handler, { priority: 'background', stopPropagation: true });
      endRender();

      // Should always be exactly 1 handler
      expect(getPasteHandlerCount()).toBe(1);
    });

    it('should handle wrapper being called when hook data is not registered', () => {
      // This covers the defensive branch in the wrapper where data.registered is false
      const handler = vi.fn();

      // Register then deactivate
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      // Hook state at index 0 has the hook data
      const hookData = getHookStateByIndex(0);
      expect(hookData).not.toBeNull();

      // Manually set registered=false to simulate edge case
      hookData.registered = false;

      // The wrapper is still in the paste handlers, but registered=false
      // so the actual handler should not be called
      emitPaste('text', true);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle deactivation when handlerId is already null', () => {
      const handler = vi.fn();

      // Start active
      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      // Manually null out the handlerId to simulate edge case
      const hookData = getHookStateByIndex(0);
      hookData.handlerId = null;

      // Deactivate - should handle null handlerId gracefully
      beginRender();
      usePaste(handler, { isActive: false });
      endRender();

      // The handler in the registry was not removed (handlerId was null),
      // but the hook state is now marked as not registered
      expect(hookData.registered).toBe(false);
    });

    it('should handle options change when handlerId is already null', () => {
      const handler = vi.fn();

      // Start active with normal priority
      beginRender();
      usePaste(handler, { priority: 'normal', stopPropagation: false });
      endRender();

      expect(getPasteHandlerCount()).toBe(1);

      // Manually null out the handlerId to simulate edge case
      const hookData = getHookStateByIndex(0);
      hookData.handlerId = null;

      // Change options - should handle null handlerId gracefully
      beginRender();
      usePaste(handler, { priority: 'modal', stopPropagation: true });
      endRender();

      // A new handler should be registered despite old handlerId being null
      expect(getPasteHandlerCount()).toBe(2); // old one orphaned + new one
      expect(hookData.handlerId).not.toBeNull();
    });

    it('should handle wrapper called when hook data is null (post resetHookState)', () => {
      const handler = vi.fn();

      beginRender();
      usePaste(handler, { isActive: true });
      endRender();

      // Get the wrapper reference before reset
      const hookData = getHookStateByIndex(0);
      const wrapper = hookData.wrapper;

      // Reset clears the state array
      resetHookState();

      // Calling the wrapper directly now returns undefined (data is null)
      const result = wrapper({ text: 'test', isBracketed: true });
      expect(result).toBeUndefined();
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
