import { beforeEach, describe, expect, it, vi } from 'vitest';

import { parseMouseEvent } from '../../src/hooks/use-mouse.js';
import {
  addMouseHandler,
  clearMouseHandlers,
  emitMouseEvent,
  removeMouseHandlerById,
} from '../../src/hooks/context.js';
import {
  generateSGRMouseSequence,
  generateX10MouseSequence,
} from '../../src/dev-tools/mouse-simulator.js';

describe('useMouse parser', () => {
  beforeEach(() => {
    clearMouseHandlers();
  });

  it('normalizes SGR mouse sequences to 0-based coordinates', () => {
    const result = parseMouseEvent(generateSGRMouseSequence(7, 4, 'left', 'click'));

    expect(result).not.toBeNull();
    expect(result!.event.x).toBe(7);
    expect(result!.event.y).toBe(4);
  });

  it('normalizes X10 mouse sequences to 0-based coordinates', () => {
    const result = parseMouseEvent(generateX10MouseSequence(3, 9, 'right', 'click'));

    expect(result).not.toBeNull();
    expect(result!.event.x).toBe(3);
    expect(result!.event.y).toBe(9);
    expect(result!.event.button).toBe('right');
  });

  it('classifies a physical click once for every registered handler', () => {
    const first = vi.fn();
    const second = vi.fn();
    addMouseHandler(first);
    addMouseHandler(second);
    const click = {
      x: 4,
      y: 2,
      button: 'left' as const,
      action: 'click' as const,
      modifiers: { ctrl: false, shift: false, alt: false },
    };

    emitMouseEvent(click);
    emitMouseEvent(click);

    expect(first.mock.calls.map(call => call[0].action)).toEqual([
      'click',
      'double-click',
    ]);
    expect(second.mock.calls.map(call => call[0].action)).toEqual([
      'click',
      'double-click',
    ]);
  });

  it('uses a handler snapshot when subscriptions mutate during dispatch', () => {
    const second = vi.fn();
    let secondId = -1;
    addMouseHandler(() => {
      removeMouseHandlerById(secondId);
    });
    secondId = addMouseHandler(second);

    emitMouseEvent({
      x: 0,
      y: 0,
      button: 'left',
      action: 'release',
      modifiers: { ctrl: false, shift: false, alt: false },
    });

    expect(second).toHaveBeenCalledOnce();
  });
});
