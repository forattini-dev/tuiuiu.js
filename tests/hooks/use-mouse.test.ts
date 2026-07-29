import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  isMouseTrackingEnabled,
  parseMouseEvent,
  resetMouseState,
  useMouse,
} from '../../src/hooks/use-mouse.js';
import {
  addMouseHandler,
  beginRender,
  clearMouseHandlers,
  emitMouseEvent,
  endRender,
  getMouseHandlerCount,
  removeMouseHandlerById,
  resetHookState,
} from '../../src/hooks/context.js';
import {
  generateSGRMouseSequence,
  generateX10MouseSequence,
} from '../../src/dev-tools/mouse-simulator.js';

describe('useMouse parser', () => {
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
    expect(result!.event.action).toBe('click');
  });

  it('consumes one batched event and shares extended protocol support', () => {
    const sgr = '\x1b[<4;8;5M';
    const result = parseMouseEvent(`${sgr}suffix`);

    expect(result).toMatchObject({
      length: sgr.length,
      event: {
        x: 7,
        y: 4,
        button: 'left',
        action: 'click',
        modifiers: { shift: true, alt: false, ctrl: false },
      },
    });

    expect(parseMouseEvent('\x1b[<0;120;240;8;5M')?.event).toMatchObject({
      x: 7,
      y: 4,
      pixelX: 120,
      pixelY: 240,
    });
    expect(parseMouseEvent('\x1b[32;8;5M')?.event).toMatchObject({
      x: 7,
      y: 4,
      button: 'left',
      action: 'click',
    });
  });

  it('decodes X10 wheel bits before ordinary buttons', () => {
    const scrollUp = `\x1b[M${String.fromCharCode(32 + 64)}!!`;
    expect(parseMouseEvent(scrollUp)?.event).toMatchObject({
      x: 0,
      y: 0,
      button: 'scroll-up',
      action: 'click',
    });
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

  it('activates, updates, and deactivates hook handlers across renders', () => {
    const first = vi.fn();
    const second = vi.fn();

    beginRender();
    useMouse(first, { isActive: false, enableTracking: false });
    endRender();
    expect(getMouseHandlerCount()).toBe(0);

    beginRender();
    useMouse(first, { isActive: true, enableTracking: false });
    endRender();
    expect(getMouseHandlerCount()).toBe(1);

    beginRender();
    useMouse(second, { isActive: true, enableTracking: false });
    endRender();
    emitMouseEvent({
      x: 2,
      y: 3,
      button: 'right',
      action: 'release',
      modifiers: { ctrl: false, shift: false, alt: false },
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();

    beginRender();
    useMouse(second, { isActive: false, enableTracking: false });
    endRender();
    expect(getMouseHandlerCount()).toBe(0);
  });

  it('owns and releases its tracking lease on hook cleanup', () => {
    beginRender();
    useMouse(vi.fn());
    endRender();

    expect(isMouseTrackingEnabled()).toBe(true);
    resetHookState();
    expect(isMouseTrackingEnabled()).toBe(false);
    expect(getMouseHandlerCount()).toBe(0);
  });
});
