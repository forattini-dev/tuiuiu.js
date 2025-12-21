/**
 * Tests for the Advanced Focus Management System
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getFocusZoneManager,
  resetFocusZoneManager,
  createFocusZone,
  createFocusTrap,
  focusElement,
  focusNext,
  focusPrevious,
  focusFirst,
  focusLast,
  blurFocus,
  getActiveId,
  isFocused,
  registerFocusable,
  onFocusChange,
  type FocusZoneEventData,
} from '../../src/core/focus.js';

describe('FocusZoneManager', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  describe('singleton', () => {
    it('should return the same instance', () => {
      const manager1 = getFocusZoneManager();
      const manager2 = getFocusZoneManager();
      expect(manager1).toBe(manager2);
    });

    it('should reset properly', () => {
      const manager1 = getFocusZoneManager();
      resetFocusZoneManager();
      const manager2 = getFocusZoneManager();
      expect(manager1).not.toBe(manager2);
    });
  });

  describe('zone creation', () => {
    it('should create a zone with default options', () => {
      const manager = getFocusZoneManager();
      const zoneId = manager.createZone();
      const zone = manager.getZone(zoneId);

      expect(zone).not.toBeNull();
      expect(zone!.options.trap).toBe(false);
      expect(zone!.options.wrap).toBe(true);
      expect(zone!.options.autoFocus).toBe(true);
    });

    it('should create a zone with custom options', () => {
      const manager = getFocusZoneManager();
      const zoneId = manager.createZone({
        id: 'custom-zone',
        trap: true,
        wrap: false,
      });

      expect(zoneId).toBe('custom-zone');
      const zone = manager.getZone(zoneId);
      expect(zone!.options.trap).toBe(true);
      expect(zone!.options.wrap).toBe(false);
    });

    it('should destroy a zone', () => {
      const manager = getFocusZoneManager();
      const zoneId = manager.createZone();
      manager.destroyZone(zoneId);
      expect(manager.getZone(zoneId)).toBeNull();
    });

    it('should not destroy root zone', () => {
      const manager = getFocusZoneManager();
      manager.destroyZone('__root__');
      expect(manager.getZone('__root__')).not.toBeNull();
    });
  });

  describe('zone activation', () => {
    it('should activate a zone', () => {
      const manager = getFocusZoneManager();
      const zoneId = manager.createZone();

      manager.activateZone(zoneId);
      expect(manager.getActiveZone()!.id).toBe(zoneId);
    });

    it('should push previous zone to stack', () => {
      const manager = getFocusZoneManager();
      const zone1 = manager.createZone();
      const zone2 = manager.createZone();

      manager.activateZone(zone1);
      expect(manager.getStackDepth()).toBe(1); // Root pushed

      manager.activateZone(zone2);
      expect(manager.getStackDepth()).toBe(2);
      expect(manager.getActiveZone()!.id).toBe(zone2);
    });

    it('should deactivate and restore previous zone', () => {
      const manager = getFocusZoneManager();
      const zone1 = manager.createZone();
      const zone2 = manager.createZone();

      manager.activateZone(zone1);
      manager.activateZone(zone2);
      manager.deactivateZone(zone2);

      expect(manager.getActiveZone()!.id).toBe(zone1);
      expect(manager.getStackDepth()).toBe(1);
    });

    it('should warn on stack overflow', () => {
      const manager = getFocusZoneManager();
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Create and activate many zones
      for (let i = 0; i < 12; i++) {
        const zoneId = manager.createZone();
        manager.activateZone(zoneId);
      }

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});

describe('Element Registration', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  it('should register elements in a zone', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone();

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);
    manager.registerElement('el3', zoneId);

    const zone = manager.getZone(zoneId);
    expect(zone!.elements.size).toBe(3);
    expect(zone!.order).toEqual(['el1', 'el2', 'el3']);
  });

  it('should respect custom order', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone();

    manager.registerElement('el1', zoneId, { order: 3 });
    manager.registerElement('el2', zoneId, { order: 1 });
    manager.registerElement('el3', zoneId, { order: 2 });

    const zone = manager.getZone(zoneId);
    expect(zone!.order).toEqual(['el2', 'el3', 'el1']);
  });

  it('should unregister elements', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone();

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);
    manager.unregisterElement('el1', zoneId);

    const zone = manager.getZone(zoneId);
    expect(zone!.elements.size).toBe(1);
    expect(zone!.order).toEqual(['el2']);
  });

  it('should call onFocus callback', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });
    const onFocus = vi.fn();

    manager.registerElement('el1', zoneId, { onFocus });
    manager.activateZone(zoneId);
    manager.focusElement('el1', zoneId);

    expect(onFocus).toHaveBeenCalledWith(true);

    manager.blur(zoneId);
    expect(onFocus).toHaveBeenCalledWith(false);
  });

  it('should skip inactive elements', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });

    manager.registerElement('el1', zoneId, { isActive: false });
    manager.registerElement('el2', zoneId, { isActive: true });

    const zone = manager.getZone(zoneId);
    expect(zone!.order).toEqual(['el2']);
  });

  it('should skip elements with tabIndex -1', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });

    manager.registerElement('el1', zoneId, { tabIndex: -1 });
    manager.registerElement('el2', zoneId);

    const zone = manager.getZone(zoneId);
    expect(zone!.order).toEqual(['el2']);
  });
});

describe('Focus Navigation', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  it('should focus next element', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });
    manager.activateZone(zoneId);

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);
    manager.registerElement('el3', zoneId);

    manager.focusFirst(zoneId);
    expect(manager.getActiveId(zoneId)).toBe('el1');

    manager.focusNext();
    expect(manager.getActiveId(zoneId)).toBe('el2');

    manager.focusNext();
    expect(manager.getActiveId(zoneId)).toBe('el3');
  });

  it('should focus previous element', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });
    manager.activateZone(zoneId);

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);
    manager.registerElement('el3', zoneId);

    manager.focusLast(zoneId);
    expect(manager.getActiveId(zoneId)).toBe('el3');

    manager.focusPrevious();
    expect(manager.getActiveId(zoneId)).toBe('el2');

    manager.focusPrevious();
    expect(manager.getActiveId(zoneId)).toBe('el1');
  });

  it('should wrap focus when enabled', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false, wrap: true });
    manager.activateZone(zoneId);

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);

    manager.focusLast(zoneId);
    manager.focusNext();
    expect(manager.getActiveId(zoneId)).toBe('el1'); // Wrapped

    manager.focusPrevious();
    expect(manager.getActiveId(zoneId)).toBe('el2'); // Wrapped back
  });

  it('should not wrap focus when disabled', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false, wrap: false, trap: true });
    manager.activateZone(zoneId);

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);

    manager.focusLast(zoneId);
    const result = manager.focusNextInZone(zoneId);
    expect(result).toBe(false);
    expect(manager.getActiveId(zoneId)).toBe('el2'); // Didn't change
  });

  it('should focus first and last', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });
    manager.activateZone(zoneId);

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);
    manager.registerElement('el3', zoneId);

    manager.focusFirst(zoneId);
    expect(manager.getActiveId(zoneId)).toBe('el1');

    manager.focusLast(zoneId);
    expect(manager.getActiveId(zoneId)).toBe('el3');
  });

  it('should auto-focus first element on activation', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: true });

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);

    manager.activateZone(zoneId);
    expect(manager.getActiveId(zoneId)).toBe('el1');
  });
});

describe('Focus Trap', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  it('should trap focus within zone', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ trap: true, wrap: true, autoFocus: false });
    manager.activateZone(zoneId);

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);

    manager.focusLast(zoneId);
    manager.focusNext(); // Should wrap within trap
    expect(manager.getActiveId(zoneId)).toBe('el1');
  });

  it('should not escape trap when wrap is false', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ trap: true, wrap: false, autoFocus: false });
    manager.activateZone(zoneId);

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);

    manager.focusLast(zoneId);
    const result = manager.focusNextInZone(zoneId);
    expect(result).toBe(false); // Can't escape trap
    expect(manager.getActiveId(zoneId)).toBe('el2');
  });
});

describe('Focus Stack', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  it('should restore focus when zone is deactivated', () => {
    const manager = getFocusZoneManager();
    const zone1 = manager.createZone({ autoFocus: false, restoreFocus: true });
    const zone2 = manager.createZone({ autoFocus: false, restoreFocus: true });

    manager.registerElement('outer1', zone1);
    manager.registerElement('outer2', zone1);
    manager.registerElement('inner1', zone2);
    manager.registerElement('inner2', zone2);

    // Activate zone1 and focus outer2
    manager.activateZone(zone1);
    manager.focusElement('outer2', zone1);
    expect(manager.getActiveId(zone1)).toBe('outer2');

    // Activate zone2 (modal)
    manager.activateZone(zone2);
    manager.focusFirst(zone2);
    expect(manager.getActiveId(zone2)).toBe('inner1');

    // Deactivate zone2
    manager.deactivateZone(zone2);

    // Should restore to zone1 with outer2 focused
    expect(manager.getActiveZone()!.id).toBe(zone1);
  });
});

describe('Focus Groups', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  it('should focus group', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });
    manager.activateZone(zoneId);

    manager.registerElement('tab1', zoneId, { group: 'tabs' });
    manager.registerElement('tab2', zoneId, { group: 'tabs' });
    manager.registerElement('content1', zoneId, { group: 'content' });

    manager.focusGroup('content', zoneId);
    expect(manager.getActiveId(zoneId)).toBe('content1');
  });

  it('should focus next group', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });
    manager.activateZone(zoneId);

    manager.registerElement('tab1', zoneId, { group: 'tabs', order: 0 });
    manager.registerElement('tab2', zoneId, { group: 'tabs', order: 1 });
    manager.registerElement('content1', zoneId, { group: 'content', order: 2 });
    manager.registerElement('content2', zoneId, { group: 'content', order: 3 });

    manager.focusFirst(zoneId); // Focus tab1
    manager.focusNextGroup(zoneId); // Should jump to content group
    expect(manager.getActiveId(zoneId)).toBe('content1');
  });
});

describe('Focus Event Listeners', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  it('should notify on focus change', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });
    manager.activateZone(zoneId);

    const listener = vi.fn();
    const unsubscribe = manager.onFocusChange(listener);

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);

    manager.focusElement('el1', zoneId);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        elementId: 'el1',
        previousElementId: null,
        zoneId,
        isInitial: true,
      })
    );

    manager.focusElement('el2', zoneId);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        elementId: 'el2',
        previousElementId: 'el1',
        isInitial: false,
      })
    );

    unsubscribe();
    manager.focusElement('el1', zoneId);
    expect(listener).toHaveBeenCalledTimes(2); // No additional calls
  });
});

describe('Public API Functions', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  describe('createFocusZone', () => {
    it('should create and control a zone', () => {
      const zone = createFocusZone({ id: 'test-zone' });

      expect(zone.zoneId).toBe('test-zone');

      zone.activate();
      expect(getFocusZoneManager().getActiveZone()!.id).toBe('test-zone');

      zone.deactivate();
      zone.destroy();
      expect(getFocusZoneManager().getZone('test-zone')).toBeNull();
    });
  });

  describe('createFocusTrap', () => {
    it('should create a trap zone', () => {
      const trap = createFocusTrap({ id: 'modal' });
      const zone = getFocusZoneManager().getZone('modal');

      expect(zone!.options.trap).toBe(true);
      expect(zone!.options.wrap).toBe(true);

      trap.destroy();
    });
  });

  describe('programmatic focus functions', () => {
    it('should work with global functions', () => {
      const zone = createFocusZone({ autoFocus: false });
      zone.activate();

      const unregister1 = registerFocusable('el1');
      const unregister2 = registerFocusable('el2');
      const unregister3 = registerFocusable('el3');

      expect(focusFirst()).toBe(true);
      expect(getActiveId()).toBe('el1');
      expect(isFocused('el1')).toBe(true);

      expect(focusNext()).toBe(true);
      expect(getActiveId()).toBe('el2');

      expect(focusPrevious()).toBe(true);
      expect(getActiveId()).toBe('el1');

      expect(focusLast()).toBe(true);
      expect(getActiveId()).toBe('el3');

      expect(focusElement('el2')).toBe(true);
      expect(getActiveId()).toBe('el2');

      blurFocus();
      expect(getActiveId()).toBeNull();

      unregister1();
      unregister2();
      unregister3();
    });
  });

  describe('onFocusChange', () => {
    it('should work with global function', () => {
      const zone = createFocusZone({ autoFocus: false });
      zone.activate();

      const listener = vi.fn();
      const unsubscribe = onFocusChange(listener);

      registerFocusable('el1');
      focusFirst();

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          elementId: 'el1',
        })
      );

      unsubscribe();
    });
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    resetFocusZoneManager();
  });

  it('should handle empty zone', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });
    manager.activateZone(zoneId);

    expect(manager.focusFirst(zoneId)).toBe(false);
    expect(manager.focusLast(zoneId)).toBe(false);
    expect(manager.focusNext()).toBe(false);
    expect(manager.focusPrevious()).toBe(false);
  });

  it('should handle focusing non-existent element', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone();
    manager.activateZone(zoneId);

    expect(manager.focusElement('nonexistent', zoneId)).toBe(false);
  });

  it('should handle unregistering focused element', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ autoFocus: false });
    manager.activateZone(zoneId);

    manager.registerElement('el1', zoneId);
    manager.registerElement('el2', zoneId);
    manager.focusElement('el1', zoneId);

    manager.unregisterElement('el1', zoneId);

    // Should have moved focus to next element
    expect(manager.getActiveId(zoneId)).toBe('el2');
  });

  it('should handle disabled zone', () => {
    const manager = getFocusZoneManager();
    const zoneId = manager.createZone({ disabled: true });
    manager.activateZone(zoneId);

    // Should not activate disabled zone
    expect(manager.getActiveZone()!.id).not.toBe(zoneId);
  });

  it('should handle multiple zones', () => {
    const manager = getFocusZoneManager();
    const zone1 = manager.createZone({ autoFocus: false });
    const zone2 = manager.createZone({ autoFocus: false });

    manager.registerElement('z1-el1', zone1);
    manager.registerElement('z1-el2', zone1);
    manager.registerElement('z2-el1', zone2);
    manager.registerElement('z2-el2', zone2);

    manager.activateZone(zone1);
    manager.focusFirst(zone1);
    expect(manager.getActiveId(zone1)).toBe('z1-el1');

    manager.activateZone(zone2);
    manager.focusFirst(zone2);
    expect(manager.getActiveId(zone2)).toBe('z2-el1');

    // Zone1 should retain its focus state
    expect(manager.getZone(zone1)!.activeId).toBe('z1-el1');
  });
});
