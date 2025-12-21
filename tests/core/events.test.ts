/**
 * Tests for the Event System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createEvent,
  EventEmitter,
  getEventBus,
  delegate,
  waitForEvent,
  combineHandlers,
  conditionalHandler,
  debounceHandler,
  throttleHandler,
  type TuiEvent,
  type EventHandler,
} from '../../src/core/events.js';

describe('createEvent', () => {
  it('should create an event with type and data', () => {
    const event = createEvent('click', { x: 10, y: 20 });
    expect(event.type).toBe('click');
    expect(event.data).toEqual({ x: 10, y: 20 });
  });

  it('should initialize with correct defaults', () => {
    const event = createEvent('test', null);
    expect(event.target).toBeNull();
    expect(event.currentTarget).toBeNull();
    expect(event.phase).toBe('none');
    expect(event.propagationStopped).toBe(false);
    expect(event.immediatePropagationStopped).toBe(false);
    expect(event.defaultPrevented).toBe(false);
    expect(event.timestamp).toBeGreaterThan(0);
  });

  it('should allow stopping propagation', () => {
    const event = createEvent('test', null);
    event.stopPropagation();
    expect(event.propagationStopped).toBe(true);
  });

  it('should allow stopping immediate propagation', () => {
    const event = createEvent('test', null);
    event.stopImmediatePropagation();
    expect(event.propagationStopped).toBe(true);
    expect(event.immediatePropagationStopped).toBe(true);
  });

  it('should allow preventing default', () => {
    const event = createEvent('test', null);
    event.preventDefault();
    expect(event.defaultPrevented).toBe(true);
  });
});

describe('EventEmitter', () => {
  let emitter: EventEmitter;

  beforeEach(() => {
    emitter = new EventEmitter();
  });

  describe('on/off', () => {
    it('should add and remove listeners', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.emit('test');
      expect(handler).toHaveBeenCalledTimes(1);

      emitter.off('test', handler);
      emitter.emit('test');
      expect(handler).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();
      const unsubscribe = emitter.on('test', handler);

      emitter.emit('test');
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();
      emitter.emit('test');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should support multiple listeners', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      emitter.on('test', handler1);
      emitter.on('test', handler2);
      emitter.emit('test');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should only call handlers for matching type', () => {
      const handler = vi.fn();
      emitter.on('click', handler);
      emitter.emit('keypress');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('once', () => {
    it('should only trigger once', () => {
      const handler = vi.fn();
      emitter.once('test', handler);

      emitter.emit('test');
      emitter.emit('test');
      emitter.emit('test');

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('emit', () => {
    it('should pass event to handlers', () => {
      const handler = vi.fn();
      emitter.on('test', handler);
      emitter.emit('test', { value: 42 });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test',
          data: { value: 42 },
        })
      );
    });

    it('should return the event', () => {
      const event = emitter.emit('test', 'data');
      expect(event.type).toBe('test');
      expect(event.data).toBe('data');
    });
  });

  describe('priority', () => {
    it('should call higher priority handlers first', () => {
      const order: number[] = [];

      emitter.on('test', () => order.push(1), { priority: 1 });
      emitter.on('test', () => order.push(3), { priority: 3 });
      emitter.on('test', () => order.push(2), { priority: 2 });

      emitter.emit('test');
      expect(order).toEqual([3, 2, 1]);
    });
  });

  describe('stopImmediatePropagation', () => {
    it('should prevent other handlers on same emitter', () => {
      const handler1 = vi.fn((e: TuiEvent) => e.stopImmediatePropagation());
      const handler2 = vi.fn();

      emitter.on('test', handler1, { priority: 2 });
      emitter.on('test', handler2, { priority: 1 });

      emitter.emit('test');

      expect(handler1).toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('hasListeners/listenerCount', () => {
    it('should report listener status', () => {
      expect(emitter.hasListeners('test')).toBe(false);
      expect(emitter.listenerCount('test')).toBe(0);

      emitter.on('test', () => {});
      emitter.on('test', () => {});

      expect(emitter.hasListeners('test')).toBe(true);
      expect(emitter.listenerCount('test')).toBe(2);
      expect(emitter.listenerCount()).toBe(2);
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners', () => {
      emitter.on('a', () => {});
      emitter.on('b', () => {});
      emitter.on('a', () => {});

      emitter.removeAllListeners();

      expect(emitter.listenerCount()).toBe(0);
    });
  });
});

describe('Event Propagation', () => {
  let root: EventEmitter;
  let parent: EventEmitter;
  let child: EventEmitter;

  beforeEach(() => {
    root = new EventEmitter();
    parent = new EventEmitter();
    child = new EventEmitter();

    parent.setParent(root);
    child.setParent(parent);
  });

  describe('bubbling', () => {
    it('should bubble events up the tree', () => {
      const order: string[] = [];

      root.on('test', () => order.push('root'));
      parent.on('test', () => order.push('parent'));
      child.on('test', () => order.push('child'));

      const event = createEvent('test', null);
      child.dispatch(event);

      // Capture phase is empty (no capture listeners), then target, then bubble
      expect(order).toEqual(['child', 'parent', 'root']);
    });

    it('should stop bubbling when stopPropagation is called', () => {
      const order: string[] = [];

      root.on('test', () => order.push('root'));
      parent.on('test', (e) => {
        order.push('parent');
        e.stopPropagation();
      });
      child.on('test', () => order.push('child'));

      const event = createEvent('test', null);
      child.dispatch(event);

      expect(order).toEqual(['child', 'parent']);
    });
  });

  describe('capturing', () => {
    it('should capture events down the tree first', () => {
      const order: string[] = [];

      root.on('test', () => order.push('root-capture'), { capture: true });
      parent.on('test', () => order.push('parent-capture'), { capture: true });
      child.on('test', () => order.push('child-target'));

      const event = createEvent('test', null);
      child.dispatch(event);

      expect(order).toEqual(['root-capture', 'parent-capture', 'child-target']);
    });

    it('should do capture then bubble', () => {
      const order: string[] = [];

      root.on('test', () => order.push('root-capture'), { capture: true });
      root.on('test', () => order.push('root-bubble'));
      child.on('test', () => order.push('child-target'));

      const event = createEvent('test', null);
      child.dispatch(event);

      expect(order).toEqual(['root-capture', 'child-target', 'root-bubble']);
    });
  });

  describe('parent management', () => {
    it('should update parent correctly', () => {
      const newParent = new EventEmitter();
      child.setParent(newParent);

      expect(child.getParent()).toBe(newParent);
      expect(parent.getChildren()).not.toContain(child);
      expect(newParent.getChildren()).toContain(child);
    });

    it('should handle null parent', () => {
      child.setParent(null);
      expect(child.getParent()).toBeNull();
      expect(parent.getChildren()).not.toContain(child);
    });
  });
});

describe('Event Bus', () => {
  beforeEach(() => {
    // Reset singleton between tests
    (getEventBus() as any).removeAllListeners();
  });

  it('should be a singleton', () => {
    const bus1 = getEventBus();
    const bus2 = getEventBus();
    expect(bus1).toBe(bus2);
  });

  it('should broadcast events', () => {
    const handler = vi.fn();
    const bus = getEventBus();

    bus.on('global', handler);
    bus.broadcast('global', { message: 'hello' });

    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'global',
        data: { message: 'hello' },
      })
    );
  });
});

describe('delegate', () => {
  it('should filter by type', () => {
    const handler = vi.fn();
    const delegated = delegate(handler, {
      typeMatch: (type) => type === 'click',
    });

    const clickEvent = createEvent('click', null);
    const keyEvent = createEvent('key', null);

    delegated(clickEvent);
    delegated(keyEvent);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(clickEvent);
  });

  it('should filter by target', () => {
    const handler = vi.fn();
    const delegated = delegate(handler, {
      targetMatch: (target) => target?.props?.id === 'button',
    });

    const buttonEvent = createEvent('click', null, { type: 'box', props: { id: 'button' }, children: [] });
    const otherEvent = createEvent('click', null, { type: 'box', props: { id: 'other' }, children: [] });

    delegated(buttonEvent);
    delegated(otherEvent);

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('waitForEvent', () => {
  it('should resolve when event occurs', async () => {
    const emitter = new EventEmitter();

    const promise = waitForEvent<string>(emitter, 'done');

    setTimeout(() => emitter.emit('done', 'success'), 10);

    const event = await promise;
    expect(event.type).toBe('done');
    expect(event.data).toBe('success');
  });

  it('should reject on timeout', async () => {
    const emitter = new EventEmitter();

    await expect(waitForEvent(emitter, 'never', 10)).rejects.toThrow('Timeout');
  });
});

describe('combineHandlers', () => {
  it('should call all handlers in order', () => {
    const order: number[] = [];

    const combined = combineHandlers(
      () => order.push(1),
      () => order.push(2),
      () => order.push(3)
    );

    const event = createEvent('test', null);
    combined(event);

    expect(order).toEqual([1, 2, 3]);
  });

  it('should stop on immediate propagation stop', () => {
    const order: number[] = [];

    const combined = combineHandlers(
      () => order.push(1),
      (e) => {
        order.push(2);
        e.stopImmediatePropagation();
      },
      () => order.push(3)
    );

    const event = createEvent('test', null);
    combined(event);

    expect(order).toEqual([1, 2]);
  });
});

describe('conditionalHandler', () => {
  it('should only call handler when condition is true', () => {
    const handler = vi.fn();
    const conditional = conditionalHandler(
      (e) => e.data === 'allowed',
      handler
    );

    conditional(createEvent('test', 'allowed'));
    conditional(createEvent('test', 'denied'));

    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe('debounceHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce calls', () => {
    const handler = vi.fn();
    const debounced = debounceHandler(handler, 100);

    debounced(createEvent('test', 1));
    debounced(createEvent('test', 2));
    debounced(createEvent('test', 3));

    expect(handler).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ data: 3 }));
  });
});

describe('throttleHandler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should throttle calls', () => {
    const handler = vi.fn();
    const throttled = throttleHandler(handler, 100);

    // First call goes through immediately
    throttled(createEvent('test', 1));
    expect(handler).toHaveBeenCalledTimes(1);

    // These are throttled
    throttled(createEvent('test', 2));
    throttled(createEvent('test', 3));
    expect(handler).toHaveBeenCalledTimes(1);

    // After limit, last call goes through
    vi.advanceTimersByTime(100);
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith(expect.objectContaining({ data: 3 }));
  });
});
