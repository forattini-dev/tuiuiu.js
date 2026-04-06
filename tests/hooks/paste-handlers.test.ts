/**
 * Paste Handler Registry Tests
 *
 * Tests for the paste handler system in context.ts:
 * - addPasteHandler / removePasteHandlerById
 * - emitPaste with priority ordering and stopPropagation
 * - clearPasteHandlers / getPasteHandlerCount
 * - emitInput InputEvent 3rd argument
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  addPasteHandler,
  removePasteHandlerById,
  emitPaste,
  clearPasteHandlers,
  getPasteHandlerCount,
  addInputHandler,
  emitInput,
  clearInputHandlers,
} from '../../src/hooks/context.js';
import { INPUT_PRIORITY_VALUES } from '../../src/hooks/types.js';
import type { Key, PasteEvent, InputEvent } from '../../src/hooks/types.js';

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

describe('Paste Handler Registry', () => {
  beforeEach(() => {
    clearPasteHandlers();
  });

  // ===========================================================================
  // addPasteHandler
  // ===========================================================================

  describe('addPasteHandler', () => {
    it('should return a numeric handler ID', () => {
      const handler = vi.fn();
      const id = addPasteHandler(handler);

      expect(typeof id).toBe('number');
    });

    it('should return unique IDs for each handler', () => {
      const id1 = addPasteHandler(vi.fn());
      const id2 = addPasteHandler(vi.fn());
      const id3 = addPasteHandler(vi.fn());

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
      expect(id1).not.toBe(id3);
    });

    it('should increment handler count', () => {
      expect(getPasteHandlerCount()).toBe(0);

      addPasteHandler(vi.fn());
      expect(getPasteHandlerCount()).toBe(1);

      addPasteHandler(vi.fn());
      expect(getPasteHandlerCount()).toBe(2);
    });

    it('should default to normal priority when no options given', () => {
      const handler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(true);

      // Add a normal handler (default) and a modal handler with stopPropagation
      addPasteHandler(handler);
      addPasteHandler(modalHandler, { priority: 'modal', stopPropagation: true });

      emitPaste('hello', true);

      // Modal fires first and stops propagation, so normal should NOT be called
      expect(modalHandler).toHaveBeenCalled();
      expect(handler).not.toHaveBeenCalled();
    });

    it('should default stopPropagation to false when no options given', () => {
      const handler1 = vi.fn().mockReturnValue(true);
      const handler2 = vi.fn();

      // Both at default priority, handler1 returns truthy but no stopPropagation
      addPasteHandler(handler1);
      addPasteHandler(handler2);

      emitPaste('test', false);

      // Both should be called since stopPropagation defaults to false
      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should accept priority option', () => {
      const callOrder: string[] = [];

      addPasteHandler(() => { callOrder.push('normal'); });
      addPasteHandler(() => { callOrder.push('modal'); }, { priority: 'modal' });

      emitPaste('text', true);

      // Modal fires before normal
      expect(callOrder).toEqual(['modal', 'normal']);
    });

    it('should accept stopPropagation option', () => {
      const normalHandler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(true);

      addPasteHandler(normalHandler);
      addPasteHandler(modalHandler, { priority: 'modal', stopPropagation: true });

      emitPaste('text', true);

      expect(modalHandler).toHaveBeenCalled();
      expect(normalHandler).not.toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // removePasteHandlerById
  // ===========================================================================

  describe('removePasteHandlerById', () => {
    it('should remove handler by ID and return true', () => {
      const handler = vi.fn();
      const id = addPasteHandler(handler);

      expect(getPasteHandlerCount()).toBe(1);
      const removed = removePasteHandlerById(id);
      expect(removed).toBe(true);
      expect(getPasteHandlerCount()).toBe(0);
    });

    it('should return false for non-existent ID', () => {
      const removed = removePasteHandlerById(999);
      expect(removed).toBe(false);
    });

    it('should return false when removing same ID twice', () => {
      const id = addPasteHandler(vi.fn());

      expect(removePasteHandlerById(id)).toBe(true);
      expect(removePasteHandlerById(id)).toBe(false);
    });

    it('should only remove the specified handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      const id1 = addPasteHandler(handler1);
      addPasteHandler(handler2);
      addPasteHandler(handler3);

      expect(getPasteHandlerCount()).toBe(3);
      removePasteHandlerById(id1);
      expect(getPasteHandlerCount()).toBe(2);

      // Emit to verify handler1 is gone but handler2/handler3 still active
      emitPaste('test', false);
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });

    it('should remove handler from the middle of the list', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      addPasteHandler(handler1);
      const id2 = addPasteHandler(handler2);
      addPasteHandler(handler3);

      removePasteHandlerById(id2);

      emitPaste('test', true);
      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).toHaveBeenCalled();
    });
  });

  // ===========================================================================
  // emitPaste - Basic behavior
  // ===========================================================================

  describe('emitPaste - Basic Behavior', () => {
    it('should call handler with correct PasteEvent (bracketed)', () => {
      const handler = vi.fn();
      addPasteHandler(handler);

      emitPaste('pasted text', true);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        text: 'pasted text',
        isBracketed: true,
      });
    });

    it('should call handler with correct PasteEvent (heuristic / non-bracketed)', () => {
      const handler = vi.fn();
      addPasteHandler(handler);

      emitPaste('heuristic paste', false);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        text: 'heuristic paste',
        isBracketed: false,
      });
    });

    it('should call all registered handlers', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      addPasteHandler(handler1);
      addPasteHandler(handler2);
      addPasteHandler(handler3);

      emitPaste('text', true);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);
    });

    it('should do nothing when no handlers are registered', () => {
      // Should not throw
      expect(() => emitPaste('text', true)).not.toThrow();
    });

    it('should handle empty text paste', () => {
      const handler = vi.fn();
      addPasteHandler(handler);

      emitPaste('', true);

      expect(handler).toHaveBeenCalledWith({ text: '', isBracketed: true });
    });

    it('should handle multiline text paste', () => {
      const handler = vi.fn();
      addPasteHandler(handler);

      const multiline = 'line1\nline2\nline3';
      emitPaste(multiline, true);

      expect(handler).toHaveBeenCalledWith({ text: multiline, isBracketed: true });
    });

    it('should handle paste with special characters', () => {
      const handler = vi.fn();
      addPasteHandler(handler);

      const special = 'Hello\t\r\n\x1b[31mworld\x00';
      emitPaste(special, false);

      expect(handler).toHaveBeenCalledWith({ text: special, isBracketed: false });
    });
  });

  // ===========================================================================
  // emitPaste - Priority Ordering
  // ===========================================================================

  describe('emitPaste - Priority Ordering', () => {
    it('should call handlers in priority order (highest first)', () => {
      const callOrder: string[] = [];

      addPasteHandler(() => { callOrder.push('background'); }, { priority: 'background' });
      addPasteHandler(() => { callOrder.push('normal'); }, { priority: 'normal' });
      addPasteHandler(() => { callOrder.push('modal'); }, { priority: 'modal' });
      addPasteHandler(() => { callOrder.push('critical'); }, { priority: 'critical' });

      emitPaste('text', true);

      expect(callOrder).toEqual(['critical', 'modal', 'normal', 'background']);
    });

    it('should maintain registration order for same priority', () => {
      const callOrder: string[] = [];

      addPasteHandler(() => { callOrder.push('first'); }, { priority: 'normal' });
      addPasteHandler(() => { callOrder.push('second'); }, { priority: 'normal' });
      addPasteHandler(() => { callOrder.push('third'); }, { priority: 'normal' });

      emitPaste('text', true);

      expect(callOrder).toEqual(['first', 'second', 'third']);
    });

    it('should interleave priorities correctly when registered in mixed order', () => {
      const callOrder: string[] = [];

      addPasteHandler(() => { callOrder.push('normal1'); }, { priority: 'normal' });
      addPasteHandler(() => { callOrder.push('critical1'); }, { priority: 'critical' });
      addPasteHandler(() => { callOrder.push('background1'); }, { priority: 'background' });
      addPasteHandler(() => { callOrder.push('modal1'); }, { priority: 'modal' });
      addPasteHandler(() => { callOrder.push('normal2'); }, { priority: 'normal' });

      emitPaste('text', false);

      expect(callOrder).toEqual(['critical1', 'modal1', 'normal1', 'normal2', 'background1']);
    });

    it('should use correct numeric priority values', () => {
      // Verify the priority values match what we expect
      expect(INPUT_PRIORITY_VALUES.background).toBe(0);
      expect(INPUT_PRIORITY_VALUES.normal).toBe(1);
      expect(INPUT_PRIORITY_VALUES.modal).toBe(2);
      expect(INPUT_PRIORITY_VALUES.critical).toBe(3);
    });
  });

  // ===========================================================================
  // emitPaste - Stop Propagation
  // ===========================================================================

  describe('emitPaste - Stop Propagation', () => {
    it('should stop propagation when handler returns truthy with stopPropagation flag', () => {
      const backgroundHandler = vi.fn();
      const normalHandler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(true);

      addPasteHandler(backgroundHandler, { priority: 'background' });
      addPasteHandler(normalHandler, { priority: 'normal' });
      addPasteHandler(modalHandler, { priority: 'modal', stopPropagation: true });

      emitPaste('text', true);

      expect(modalHandler).toHaveBeenCalled();
      expect(normalHandler).not.toHaveBeenCalled();
      expect(backgroundHandler).not.toHaveBeenCalled();
    });

    it('should NOT stop propagation when handler returns falsy', () => {
      const backgroundHandler = vi.fn();
      const normalHandler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(false);

      addPasteHandler(backgroundHandler, { priority: 'background' });
      addPasteHandler(normalHandler, { priority: 'normal' });
      addPasteHandler(modalHandler, { priority: 'modal', stopPropagation: true });

      emitPaste('text', true);

      expect(modalHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(backgroundHandler).toHaveBeenCalled();
    });

    it('should NOT stop propagation when handler returns undefined (void)', () => {
      const normalHandler = vi.fn();
      const modalHandler = vi.fn(); // returns undefined by default

      addPasteHandler(normalHandler, { priority: 'normal' });
      addPasteHandler(modalHandler, { priority: 'modal', stopPropagation: true });

      emitPaste('text', true);

      expect(modalHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
    });

    it('should NOT stop propagation when stopPropagation is false even if handler returns truthy', () => {
      const normalHandler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(true);

      addPasteHandler(normalHandler, { priority: 'normal' });
      addPasteHandler(modalHandler, { priority: 'modal', stopPropagation: false });

      emitPaste('text', true);

      expect(modalHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
    });

    it('should stop at the first handler with stopPropagation that returns truthy', () => {
      const callOrder: string[] = [];

      addPasteHandler(() => { callOrder.push('background'); }, { priority: 'background' });
      addPasteHandler(() => { callOrder.push('normal'); return true; }, { priority: 'normal', stopPropagation: true });
      addPasteHandler(() => { callOrder.push('modal'); return true; }, { priority: 'modal', stopPropagation: true });
      addPasteHandler(() => { callOrder.push('critical'); }, { priority: 'critical' });

      emitPaste('text', true);

      // critical fires first (no stopPropagation), then modal fires and stops
      expect(callOrder).toEqual(['critical', 'modal']);
    });

    it('should allow same-priority handlers to fire even when stopPropagation triggers', () => {
      const callOrder: string[] = [];

      addPasteHandler(() => { callOrder.push('normal1'); }, { priority: 'normal' });
      addPasteHandler(() => { callOrder.push('normal2'); return true; }, { priority: 'normal', stopPropagation: true });
      addPasteHandler(() => { callOrder.push('background'); }, { priority: 'background' });

      emitPaste('text', true);

      // Both normal handlers fire (same priority, in order), then stops before background
      // Based on the implementation: sorted array iterates, normal1 fires, normal2 fires and stops
      expect(callOrder).toContain('normal1');
      expect(callOrder).toContain('normal2');
      expect(callOrder).not.toContain('background');
    });
  });

  // ===========================================================================
  // emitPaste - Error Handling
  // ===========================================================================

  describe('emitPaste - Error Handling', () => {
    it('should catch errors in handlers and continue to next', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const handler1 = vi.fn().mockImplementation(() => {
        throw new Error('Paste handler error');
      });
      const handler2 = vi.fn();

      addPasteHandler(handler1, { priority: 'modal' });
      addPasteHandler(handler2, { priority: 'normal' });

      emitPaste('text', true);

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
      expect(consoleError).toHaveBeenCalledWith(
        '[tuiuiu] Error in paste handler:',
        expect.any(Error)
      );

      consoleError.mockRestore();
    });

    it('should catch error and still respect stopPropagation on subsequent handler', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      const criticalHandler = vi.fn().mockImplementation(() => {
        throw new Error('Critical error');
      });
      const modalHandler = vi.fn().mockReturnValue(true);
      const normalHandler = vi.fn();

      addPasteHandler(criticalHandler, { priority: 'critical', stopPropagation: true });
      addPasteHandler(modalHandler, { priority: 'modal', stopPropagation: true });
      addPasteHandler(normalHandler, { priority: 'normal' });

      emitPaste('text', true);

      // Critical throws (error caught, continues), modal returns true with stopPropagation
      expect(criticalHandler).toHaveBeenCalled();
      expect(modalHandler).toHaveBeenCalled();
      expect(normalHandler).not.toHaveBeenCalled();

      consoleError.mockRestore();
    });

    it('should handle multiple errors gracefully', () => {
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      addPasteHandler(() => { throw new Error('Error 1'); }, { priority: 'critical' });
      addPasteHandler(() => { throw new Error('Error 2'); }, { priority: 'modal' });
      addPasteHandler(() => { throw new Error('Error 3'); }, { priority: 'normal' });

      emitPaste('text', true);

      expect(consoleError).toHaveBeenCalledTimes(3);

      consoleError.mockRestore();
    });
  });

  // ===========================================================================
  // clearPasteHandlers
  // ===========================================================================

  describe('clearPasteHandlers', () => {
    it('should remove all handlers', () => {
      addPasteHandler(vi.fn());
      addPasteHandler(vi.fn());
      addPasteHandler(vi.fn());

      expect(getPasteHandlerCount()).toBe(3);
      clearPasteHandlers();
      expect(getPasteHandlerCount()).toBe(0);
    });

    it('should result in no handlers called on emitPaste', () => {
      const handler = vi.fn();
      addPasteHandler(handler);

      clearPasteHandlers();
      emitPaste('text', true);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should allow adding new handlers after clearing', () => {
      addPasteHandler(vi.fn());
      addPasteHandler(vi.fn());
      clearPasteHandlers();

      const newHandler = vi.fn();
      addPasteHandler(newHandler);

      expect(getPasteHandlerCount()).toBe(1);

      emitPaste('test', false);
      expect(newHandler).toHaveBeenCalledTimes(1);
    });
  });

  // ===========================================================================
  // getPasteHandlerCount
  // ===========================================================================

  describe('getPasteHandlerCount', () => {
    it('should return 0 when no handlers registered', () => {
      expect(getPasteHandlerCount()).toBe(0);
    });

    it('should return correct count after additions', () => {
      addPasteHandler(vi.fn());
      expect(getPasteHandlerCount()).toBe(1);

      addPasteHandler(vi.fn());
      expect(getPasteHandlerCount()).toBe(2);

      addPasteHandler(vi.fn());
      expect(getPasteHandlerCount()).toBe(3);
    });

    it('should return correct count after removals', () => {
      const id1 = addPasteHandler(vi.fn());
      const id2 = addPasteHandler(vi.fn());
      addPasteHandler(vi.fn());

      expect(getPasteHandlerCount()).toBe(3);

      removePasteHandlerById(id1);
      expect(getPasteHandlerCount()).toBe(2);

      removePasteHandlerById(id2);
      expect(getPasteHandlerCount()).toBe(1);
    });

    it('should return 0 after clearing', () => {
      addPasteHandler(vi.fn());
      addPasteHandler(vi.fn());

      clearPasteHandlers();
      expect(getPasteHandlerCount()).toBe(0);
    });
  });

  // ===========================================================================
  // Real-world Scenarios
  // ===========================================================================

  describe('Real-world Scenarios', () => {
    it('should block background paste when modal is open', () => {
      const editorHandler = vi.fn();
      const modalHandler = vi.fn().mockReturnValue(true);

      // Background editor paste handler
      addPasteHandler(editorHandler, { priority: 'normal' });

      // Modal opens and captures paste
      const modalId = addPasteHandler(modalHandler, {
        priority: 'modal',
        stopPropagation: true,
      });

      // Paste should only go to modal
      emitPaste('pasted text', true);
      expect(modalHandler).toHaveBeenCalled();
      expect(editorHandler).not.toHaveBeenCalled();

      // Modal closes
      removePasteHandlerById(modalId);
      vi.clearAllMocks();

      // Paste now goes to editor
      emitPaste('more text', true);
      expect(editorHandler).toHaveBeenCalled();
    });

    it('should handle nested modals capturing paste', () => {
      const editorHandler = vi.fn();
      const modal1Handler = vi.fn().mockReturnValue(true);
      const modal2Handler = vi.fn().mockReturnValue(true);

      addPasteHandler(editorHandler, { priority: 'normal' });
      const modal1Id = addPasteHandler(modal1Handler, {
        priority: 'modal',
        stopPropagation: true,
      });
      const modal2Id = addPasteHandler(modal2Handler, {
        priority: 'modal',
        stopPropagation: true,
      });

      // First modal (earlier registered) fires first at same priority
      emitPaste('text', true);
      expect(modal1Handler).toHaveBeenCalled();
      expect(modal2Handler).not.toHaveBeenCalled();
      expect(editorHandler).not.toHaveBeenCalled();

      // Close first modal
      removePasteHandlerById(modal1Id);
      vi.clearAllMocks();

      // Second modal now handles paste
      emitPaste('text', true);
      expect(modal2Handler).toHaveBeenCalled();
      expect(editorHandler).not.toHaveBeenCalled();

      // Close second modal
      removePasteHandlerById(modal2Id);
      vi.clearAllMocks();

      // Editor now handles paste
      emitPaste('text', true);
      expect(editorHandler).toHaveBeenCalled();
    });

    it('should allow critical dialog to override modal paste handling', () => {
      const modalHandler = vi.fn();
      const criticalHandler = vi.fn().mockReturnValue(true);

      addPasteHandler(modalHandler, { priority: 'modal', stopPropagation: true });
      addPasteHandler(criticalHandler, { priority: 'critical', stopPropagation: true });

      emitPaste('text', true);

      expect(criticalHandler).toHaveBeenCalled();
      expect(modalHandler).not.toHaveBeenCalled();
    });

    it('should allow analytics/logging paste handlers at background priority', () => {
      const analyticsHandler = vi.fn();
      const editorHandler = vi.fn();

      addPasteHandler(analyticsHandler, { priority: 'background' });
      addPasteHandler(editorHandler, { priority: 'normal' });

      emitPaste('user paste', true);

      // Both should be called (no stopPropagation)
      expect(editorHandler).toHaveBeenCalled();
      expect(analyticsHandler).toHaveBeenCalled();

      // Verify analytics received same event
      expect(analyticsHandler).toHaveBeenCalledWith({
        text: 'user paste',
        isBracketed: true,
      });
    });
  });
});

// =============================================================================
// emitInput - InputEvent 3rd argument
// =============================================================================

describe('emitInput - InputEvent 3rd Argument', () => {
  beforeEach(() => {
    clearInputHandlers();
  });

  it('should pass InputEvent as 3rd argument to handlers', () => {
    const handler = vi.fn();
    addInputHandler(handler);

    const key = createKey({ return: true });
    emitInput('a', key);

    expect(handler).toHaveBeenCalledTimes(1);

    const [input, keyArg, eventArg] = handler.mock.calls[0];
    expect(input).toBe('a');
    expect(keyArg).toBe(key);
    expect(eventArg).toBeDefined();
    expect(eventArg.input).toBe('a');
    expect(eventArg.key).toBe(key);
    expect(eventArg.isPasted).toBe(false);
  });

  it('should pass isPasted=false by default', () => {
    const handler = vi.fn();
    addInputHandler(handler);

    emitInput('x', createKey());

    const event: InputEvent = handler.mock.calls[0][2];
    expect(event.isPasted).toBe(false);
  });

  it('should allow overriding isPasted via event partial', () => {
    const handler = vi.fn();
    addInputHandler(handler);

    emitInput('x', createKey(), { isPasted: true });

    const event: InputEvent = handler.mock.calls[0][2];
    expect(event.isPasted).toBe(true);
  });

  it('should allow passing raw data via event partial', () => {
    const handler = vi.fn();
    addInputHandler(handler);

    emitInput('a', createKey(), { raw: '\x1b[A' });

    const event: InputEvent = handler.mock.calls[0][2];
    expect(event.raw).toBe('\x1b[A');
  });

  it('should construct full InputEvent merging defaults with partial', () => {
    const handler = vi.fn();
    addInputHandler(handler);

    const key = createKey({ ctrl: true });
    emitInput('c', key, { isPasted: true, raw: '\x03' });

    const event: InputEvent = handler.mock.calls[0][2];
    expect(event).toEqual({
      input: 'c',
      key,
      isPasted: true,
      raw: '\x03',
    });
  });

  it('should pass InputEvent to all handlers in priority order', () => {
    const events: InputEvent[] = [];

    addInputHandler((_input, _key, event) => { events.push(event!); }, { priority: 'normal' });
    addInputHandler((_input, _key, event) => { events.push(event!); }, { priority: 'modal' });

    emitInput('z', createKey(), { isPasted: true });

    // Modal fires first
    expect(events).toHaveLength(2);
    expect(events[0].isPasted).toBe(true);
    expect(events[1].isPasted).toBe(true);
    // Both receive the same event object
    expect(events[0]).toBe(events[1]);
  });

  it('should default raw to undefined when not provided', () => {
    const handler = vi.fn();
    addInputHandler(handler);

    emitInput('a', createKey());

    const event: InputEvent = handler.mock.calls[0][2];
    expect(event.raw).toBeUndefined();
  });
});
