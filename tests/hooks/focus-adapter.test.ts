/**
 * FocusZoneManagerAdapter Tests
 *
 * Tests for the adapter that bridges FocusManager interface to FocusZoneManager.
 * This ensures backward compatibility while using the advanced focus system.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FocusZoneManagerAdapter, createFocusAdapter } from '../../src/hooks/use-focus.js';
import { resetFocusZoneManager, getFocusZoneManager } from '../../src/core/focus.js';
import { setFocusManager, getFocusManager } from '../../src/hooks/context.js';

describe('FocusZoneManagerAdapter', () => {
  beforeEach(() => {
    resetFocusZoneManager();
    setFocusManager(null as any);
  });

  describe('register', () => {
    it('should register element in root zone', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused = vi.fn();

      adapter.register('element1', setFocused);

      const manager = getFocusZoneManager();
      const zone = manager.getZone('__root__');
      expect(zone?.elements.has('element1')).toBe(true);
    });

    it('should register element in specified zone', () => {
      const manager = getFocusZoneManager();
      const zoneId = manager.createZone({ id: 'custom-zone' });
      const adapter = new FocusZoneManagerAdapter(zoneId);
      const setFocused = vi.fn();

      adapter.register('element1', setFocused);

      const zone = manager.getZone(zoneId);
      expect(zone?.elements.has('element1')).toBe(true);
    });

    it('should call setFocused callback when focused', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused = vi.fn();

      adapter.register('element1', setFocused);
      adapter.focus('element1');

      expect(setFocused).toHaveBeenCalledWith(true);
    });
  });

  describe('unregister', () => {
    it('should remove element from zone', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused = vi.fn();

      adapter.register('element1', setFocused);
      adapter.unregister('element1');

      const manager = getFocusZoneManager();
      const zone = manager.getZone('__root__');
      expect(zone?.elements.has('element1')).toBe(false);
    });
  });

  describe('focus', () => {
    it('should focus element by id', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      adapter.register('element1', setFocused1);
      adapter.register('element2', setFocused2);
      adapter.focus('element2');

      expect(setFocused2).toHaveBeenCalledWith(true);
      expect(adapter.getActiveId()).toBe('element2');
    });

    it('should blur previous element when focusing new one', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      adapter.register('element1', setFocused1);
      adapter.register('element2', setFocused2);
      adapter.focus('element1');
      adapter.focus('element2');

      expect(setFocused1).toHaveBeenCalledWith(false);
      expect(setFocused2).toHaveBeenCalledWith(true);
    });
  });

  describe('focusNext', () => {
    it('should focus next element in order', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();
      const setFocused3 = vi.fn();

      adapter.register('element1', setFocused1);
      adapter.register('element2', setFocused2);
      adapter.register('element3', setFocused3);
      adapter.focus('element1');
      adapter.focusNext();

      expect(adapter.getActiveId()).toBe('element2');
    });

    it('should wrap to first element when at end', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      adapter.register('element1', setFocused1);
      adapter.register('element2', setFocused2);
      adapter.focus('element2');
      adapter.focusNext();

      expect(adapter.getActiveId()).toBe('element1');
    });
  });

  describe('focusPrevious', () => {
    it('should focus previous element in order', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();
      const setFocused3 = vi.fn();

      adapter.register('element1', setFocused1);
      adapter.register('element2', setFocused2);
      adapter.register('element3', setFocused3);
      adapter.focus('element3');
      adapter.focusPrevious();

      expect(adapter.getActiveId()).toBe('element2');
    });

    it('should wrap to last element when at beginning', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      adapter.register('element1', setFocused1);
      adapter.register('element2', setFocused2);
      adapter.focus('element1');
      adapter.focusPrevious();

      expect(adapter.getActiveId()).toBe('element2');
    });
  });

  describe('blur', () => {
    it('should blur current element', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused = vi.fn();

      adapter.register('element1', setFocused);
      adapter.focus('element1');
      adapter.blur();

      expect(setFocused).toHaveBeenLastCalledWith(false);
      expect(adapter.getActiveId()).toBeUndefined();
    });
  });

  describe('getActiveId', () => {
    it('should return undefined when nothing focused', () => {
      const adapter = new FocusZoneManagerAdapter();

      expect(adapter.getActiveId()).toBeUndefined();
    });

    it('should return focused element id', () => {
      const adapter = new FocusZoneManagerAdapter();
      const setFocused = vi.fn();

      adapter.register('element1', setFocused);
      adapter.focus('element1');

      expect(adapter.getActiveId()).toBe('element1');
    });
  });
});

describe('createFocusAdapter', () => {
  beforeEach(() => {
    resetFocusZoneManager();
    setFocusManager(null as any);
  });

  it('should create adapter and set as global focus manager', () => {
    const adapter = createFocusAdapter();

    expect(adapter).toBeInstanceOf(FocusZoneManagerAdapter);
    expect(getFocusManager()).toBe(adapter);
  });

  it('should create adapter with custom zone id', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ id: 'custom-zone' });
    const adapter = createFocusAdapter(zoneId);
    const setFocused = vi.fn();

    adapter.register('element1', setFocused);

    const zone = manager.getZone(zoneId);
    expect(zone?.elements.has('element1')).toBe(true);
  });
});

describe('Adapter vs FocusManagerImpl Compatibility', () => {
  beforeEach(() => {
    resetFocusZoneManager();
    setFocusManager(null as any);
  });

  it('should work with useFocus flow', () => {
    const adapter = createFocusAdapter();
    const callbacks: boolean[] = [];

    // Simulate useFocus registering components
    adapter.register('input1', (focused) => callbacks.push(focused));
    adapter.register('input2', (focused) => callbacks.push(focused));
    adapter.register('input3', (focused) => callbacks.push(focused));

    // Simulate tab navigation
    adapter.focus('input1');
    expect(callbacks).toContain(true);

    adapter.focusNext();
    expect(adapter.getActiveId()).toBe('input2');

    adapter.focusPrevious();
    expect(adapter.getActiveId()).toBe('input1');

    adapter.blur();
    expect(adapter.getActiveId()).toBeUndefined();
  });

  it('should handle rapid registration/unregistration', () => {
    const adapter = createFocusAdapter();
    const setFocused = vi.fn();

    for (let i = 0; i < 10; i++) {
      adapter.register(`element${i}`, setFocused);
    }

    adapter.focus('element5');
    expect(adapter.getActiveId()).toBe('element5');

    adapter.unregister('element5');
    // Should auto-focus next element after unregistering focused one
    expect(adapter.getActiveId()).not.toBe('element5');

    for (let i = 0; i < 10; i++) {
      adapter.unregister(`element${i}`);
    }
  });
});
