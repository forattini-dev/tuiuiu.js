/**
 * FocusZoneManagerAdapter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FocusZoneManagerAdapter } from '../../src/hooks/use-focus.js';
import { resetFocusZoneManager, getFocusZoneManager } from '../../src/core/focus.js';

describe('FocusZoneManagerAdapter', () => {
  beforeEach(() => {
    resetFocusZoneManager();
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
