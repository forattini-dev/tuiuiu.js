/**
 * Overlay Stack Tests
 *
 * Comprehensive tests for the overlay stack manager including:
 * - Stack operations (push, pop, close, closeAll)
 * - Priority ordering
 * - Callbacks (onOpen, onClose, beforeClose)
 * - OverlayContainer rendering
 * - Helper functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createOverlayStack,
  OverlayContainer,
  shouldBlockInput,
  handleOverlayEscape,
  createModalOverlay,
  createToastOverlay,
  createCriticalOverlay,
  type OverlayConfig,
  type OverlayStackState,
} from '../../src/organisms/overlay-stack.js';
import { Box, Text } from '../../src/primitives/nodes.js';

describe('Overlay Stack', () => {
  let stack: OverlayStackState;

  beforeEach(() => {
    stack = createOverlayStack();
  });

  describe('createOverlayStack() initialization', () => {
    it('should create an empty stack', () => {
      expect(stack.size()).toBe(0);
      expect(stack.hasOverlay()).toBe(false);
      expect(stack.current()).toBeNull();
      expect(stack.all()).toEqual([]);
    });

    it('should have all required methods', () => {
      expect(typeof stack.all).toBe('function');
      expect(typeof stack.current).toBe('function');
      expect(typeof stack.hasOverlay).toBe('function');
      expect(typeof stack.isOpen).toBe('function');
      expect(typeof stack.get).toBe('function');
      expect(typeof stack.push).toBe('function');
      expect(typeof stack.pop).toBe('function');
      expect(typeof stack.close).toBe('function');
      expect(typeof stack.closeAll).toBe('function');
      expect(typeof stack.replace).toBe('function');
      expect(typeof stack.bringToTop).toBe('function');
      expect(typeof stack.size).toBe('function');
      expect(typeof stack.subscribe).toBe('function');
    });
  });

  describe('push()', () => {
    it('should add overlay to stack', () => {
      const config: OverlayConfig = {
        id: 'test-overlay',
        component: () => Box({}),
      };

      stack.push(config);

      expect(stack.size()).toBe(1);
      expect(stack.hasOverlay()).toBe(true);
      expect(stack.isOpen('test-overlay')).toBe(true);
    });

    it('should set current to the pushed overlay', () => {
      stack.push({ id: 'first', component: () => Box({}) });

      expect(stack.current()?.id).toBe('first');
    });

    it('should apply default values', () => {
      stack.push({ id: 'test', component: () => Box({}) });

      const entry = stack.get('test');
      expect(entry?.priority).toBe('normal');
      expect(entry?.closeOnEscape).toBe(true);
      expect(entry?.closeOnClickOutside).toBe(false);
      expect(entry?.showBackdrop).toBe(true);
    });

    it('should call onOpen callback', () => {
      const onOpen = vi.fn();

      stack.push({
        id: 'test',
        component: () => Box({}),
        onOpen,
      });

      expect(onOpen).toHaveBeenCalledOnce();
    });

    it('should prevent duplicate IDs', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      stack.push({ id: 'dupe', component: () => Box({}) });
      stack.push({ id: 'dupe', component: () => Box({}) });

      expect(stack.size()).toBe(1);
      expect(consoleSpy).toHaveBeenCalledWith("Overlay with id 'dupe' already exists");

      consoleSpy.mockRestore();
    });

    it('should add timestamp (pushedAt) to entry', () => {
      const before = Date.now();
      stack.push({ id: 'test', component: () => Box({}) });
      const after = Date.now();

      const entry = stack.get('test');
      expect(entry?.pushedAt).toBeGreaterThanOrEqual(before);
      expect(entry?.pushedAt).toBeLessThanOrEqual(after);
    });
  });

  describe('pop()', () => {
    it('should remove top overlay', () => {
      stack.push({ id: 'first', component: () => Box({}) });
      stack.push({ id: 'second', component: () => Box({}) });

      expect(stack.size()).toBe(2);

      const popped = stack.pop();

      expect(popped?.id).toBe('second');
      expect(stack.size()).toBe(1);
      expect(stack.current()?.id).toBe('first');
    });

    it('should return null when stack is empty', () => {
      expect(stack.pop()).toBeNull();
    });

    it('should call onClose callback', () => {
      const onClose = vi.fn();

      stack.push({
        id: 'test',
        component: () => Box({}),
        onClose,
      });

      stack.pop();

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('should respect beforeClose returning false', () => {
      const beforeClose = vi.fn().mockReturnValue(false);
      const onClose = vi.fn();

      stack.push({
        id: 'test',
        component: () => Box({}),
        beforeClose,
        onClose,
      });

      const result = stack.pop();

      expect(result).toBeNull();
      expect(beforeClose).toHaveBeenCalled();
      expect(onClose).not.toHaveBeenCalled();
      expect(stack.size()).toBe(1);
    });

    it('should proceed when beforeClose returns true', () => {
      const beforeClose = vi.fn().mockReturnValue(true);
      const onClose = vi.fn();

      stack.push({
        id: 'test',
        component: () => Box({}),
        beforeClose,
        onClose,
      });

      const result = stack.pop();

      expect(result?.id).toBe('test');
      expect(onClose).toHaveBeenCalled();
      expect(stack.size()).toBe(0);
    });
  });

  describe('close()', () => {
    it('should close specific overlay by ID', () => {
      stack.push({ id: 'first', component: () => Box({}) });
      stack.push({ id: 'second', component: () => Box({}) });
      stack.push({ id: 'third', component: () => Box({}) });

      const result = stack.close('second');

      expect(result).toBe(true);
      expect(stack.size()).toBe(2);
      expect(stack.isOpen('second')).toBe(false);
      expect(stack.isOpen('first')).toBe(true);
      expect(stack.isOpen('third')).toBe(true);
    });

    it('should return false for non-existent ID', () => {
      stack.push({ id: 'test', component: () => Box({}) });

      expect(stack.close('non-existent')).toBe(false);
      expect(stack.size()).toBe(1);
    });

    it('should call onClose callback', () => {
      const onClose = vi.fn();

      stack.push({
        id: 'test',
        component: () => Box({}),
        onClose,
      });

      stack.close('test');

      expect(onClose).toHaveBeenCalledOnce();
    });

    it('should respect beforeClose returning false', () => {
      const beforeClose = vi.fn().mockReturnValue(false);

      stack.push({
        id: 'test',
        component: () => Box({}),
        beforeClose,
      });

      const result = stack.close('test');

      expect(result).toBe(false);
      expect(stack.size()).toBe(1);
    });
  });

  describe('closeAll()', () => {
    it('should remove all overlays', () => {
      stack.push({ id: 'first', component: () => Box({}) });
      stack.push({ id: 'second', component: () => Box({}) });
      stack.push({ id: 'third', component: () => Box({}) });

      expect(stack.size()).toBe(3);

      stack.closeAll();

      expect(stack.size()).toBe(0);
      expect(stack.hasOverlay()).toBe(false);
    });

    it('should call onClose for each overlay', () => {
      const onClose1 = vi.fn();
      const onClose2 = vi.fn();
      const onClose3 = vi.fn();

      stack.push({ id: 'first', component: () => Box({}), onClose: onClose1 });
      stack.push({ id: 'second', component: () => Box({}), onClose: onClose2 });
      stack.push({ id: 'third', component: () => Box({}), onClose: onClose3 });

      stack.closeAll();

      expect(onClose1).toHaveBeenCalledOnce();
      expect(onClose2).toHaveBeenCalledOnce();
      expect(onClose3).toHaveBeenCalledOnce();
    });

    it('should do nothing on empty stack', () => {
      stack.closeAll();
      expect(stack.size()).toBe(0);
    });
  });

  describe('priority ordering', () => {
    it('should order overlays by priority (low < normal < high < critical)', () => {
      stack.push({ id: 'normal', component: () => Box({}), priority: 'normal' });
      stack.push({ id: 'low', component: () => Box({}), priority: 'low' });
      stack.push({ id: 'critical', component: () => Box({}), priority: 'critical' });
      stack.push({ id: 'high', component: () => Box({}), priority: 'high' });

      const all = stack.all();

      expect(all[0]?.id).toBe('low');
      expect(all[1]?.id).toBe('normal');
      expect(all[2]?.id).toBe('high');
      expect(all[3]?.id).toBe('critical');
    });

    it('should have critical as current (top) overlay', () => {
      stack.push({ id: 'normal', component: () => Box({}), priority: 'normal' });
      stack.push({ id: 'critical', component: () => Box({}), priority: 'critical' });

      expect(stack.current()?.id).toBe('critical');
    });

    it('should order same-priority overlays by push time', async () => {
      stack.push({ id: 'first', component: () => Box({}), priority: 'normal' });
      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 5));
      stack.push({ id: 'second', component: () => Box({}), priority: 'normal' });

      const all = stack.all();

      expect(all[0]?.id).toBe('first');
      expect(all[1]?.id).toBe('second');
      expect(stack.current()?.id).toBe('second');
    });
  });

  describe('bringToTop()', () => {
    it('should bring overlay to top within same priority', async () => {
      stack.push({ id: 'first', component: () => Box({}), priority: 'normal' });
      await new Promise(resolve => setTimeout(resolve, 10));
      stack.push({ id: 'second', component: () => Box({}), priority: 'normal' });

      // Wait to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      const result = stack.bringToTop('first');

      expect(result).toBe(true);
      // After bringToTop, 'first' has the newest timestamp so should be current
      expect(stack.current()?.id).toBe('first');
    });

    it('should return false for non-existent ID', () => {
      stack.push({ id: 'test', component: () => Box({}) });

      expect(stack.bringToTop('non-existent')).toBe(false);
    });

    it('should not affect priority ordering', () => {
      stack.push({ id: 'low', component: () => Box({}), priority: 'low' });
      stack.push({ id: 'high', component: () => Box({}), priority: 'high' });

      stack.bringToTop('low');

      // High priority should still be on top
      expect(stack.current()?.id).toBe('high');
    });
  });

  describe('replace()', () => {
    it('should replace overlay by ID', () => {
      const component1 = () => Text({}, 'First');
      const component2 = () => Text({}, 'Second');

      stack.push({ id: 'test', component: component1 });
      expect(stack.get('test')?.component).toBe(component1);

      const result = stack.replace('test', { id: 'test', component: component2 });

      expect(result).toBe(true);
      expect(stack.get('test')?.component).toBe(component2);
    });

    it('should return false for non-existent ID', () => {
      expect(stack.replace('non-existent', { id: 'new', component: () => Box({}) })).toBe(false);
    });

    it('should keep original pushedAt timestamp', async () => {
      stack.push({ id: 'test', component: () => Box({}) });
      const originalPushedAt = stack.get('test')?.pushedAt;

      await new Promise(resolve => setTimeout(resolve, 10));

      stack.replace('test', { id: 'test', component: () => Text({}, 'Updated') });

      expect(stack.get('test')?.pushedAt).toBe(originalPushedAt);
    });
  });

  describe('get() and isOpen()', () => {
    it('get() should return overlay entry by ID', () => {
      stack.push({ id: 'test', component: () => Box({}), priority: 'high' });

      const entry = stack.get('test');

      expect(entry?.id).toBe('test');
      expect(entry?.priority).toBe('high');
    });

    it('get() should return null for non-existent ID', () => {
      expect(stack.get('non-existent')).toBeNull();
    });

    it('isOpen() should return true for open overlay', () => {
      stack.push({ id: 'test', component: () => Box({}) });

      expect(stack.isOpen('test')).toBe(true);
    });

    it('isOpen() should return false for closed overlay', () => {
      stack.push({ id: 'test', component: () => Box({}) });
      stack.pop();

      expect(stack.isOpen('test')).toBe(false);
    });
  });

  describe('subscribe()', () => {
    it('should notify subscribers on push', () => {
      const callback = vi.fn();
      stack.subscribe(callback);

      stack.push({ id: 'test', component: () => Box({}) });

      expect(callback).toHaveBeenCalledOnce();
    });

    it('should notify subscribers on pop', () => {
      stack.push({ id: 'test', component: () => Box({}) });

      const callback = vi.fn();
      stack.subscribe(callback);

      stack.pop();

      expect(callback).toHaveBeenCalledOnce();
    });

    it('should notify subscribers on close', () => {
      stack.push({ id: 'test', component: () => Box({}) });

      const callback = vi.fn();
      stack.subscribe(callback);

      stack.close('test');

      expect(callback).toHaveBeenCalledOnce();
    });

    it('should notify subscribers on closeAll', () => {
      stack.push({ id: 'first', component: () => Box({}) });
      stack.push({ id: 'second', component: () => Box({}) });

      const callback = vi.fn();
      stack.subscribe(callback);

      stack.closeAll();

      expect(callback).toHaveBeenCalledOnce();
    });

    it('should return unsubscribe function', () => {
      const callback = vi.fn();
      const unsubscribe = stack.subscribe(callback);

      stack.push({ id: 'first', component: () => Box({}) });
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      stack.push({ id: 'second', component: () => Box({}) });
      expect(callback).toHaveBeenCalledTimes(1); // Still 1, not called again
    });
  });
});

describe('OverlayContainer', () => {
  let stack: OverlayStackState;

  beforeEach(() => {
    stack = createOverlayStack();
  });

  it('should render empty Box when no overlays', () => {
    const result = OverlayContainer({ stack });

    expect(result.type).toBe('box');
    expect(result.children).toEqual([]);
  });

  it('should render all overlays', () => {
    stack.push({ id: 'first', component: () => Text({}, 'First'), showBackdrop: false });
    stack.push({ id: 'second', component: () => Text({}, 'Second'), showBackdrop: false });

    const result = OverlayContainer({ stack });

    expect(result.children?.length).toBe(2);
  });

  it('should render overlays in priority order', () => {
    stack.push({
      id: 'normal',
      component: () => Text({ key: 'normal' }, 'Normal'),
      priority: 'normal',
      showBackdrop: false,
    });
    stack.push({
      id: 'low',
      component: () => Text({ key: 'low' }, 'Low'),
      priority: 'low',
      showBackdrop: false,
    });

    const result = OverlayContainer({ stack });

    // Low priority should be first (bottom), normal second (top)
    const children = result.children as Array<{ props?: { key?: string } }>;
    expect(children[0]?.props?.key).toBe('low');
    expect(children[1]?.props?.key).toBe('normal');
  });

  it('should render backdrop when provided', () => {
    stack.push({
      id: 'modal',
      component: () => Text({}, 'Modal'),
      showBackdrop: true,
    });

    const renderBackdrop = vi.fn().mockReturnValue(Box({ key: 'backdrop' }));

    const result = OverlayContainer({ stack, renderBackdrop });

    expect(renderBackdrop).toHaveBeenCalled();
    expect(result.children?.length).toBe(2); // backdrop + modal
  });

  it('should not render backdrop when showBackdrop is false', () => {
    stack.push({
      id: 'modal',
      component: () => Text({}, 'Modal'),
      showBackdrop: false,
    });

    const renderBackdrop = vi.fn().mockReturnValue(Box({ key: 'backdrop' }));

    const result = OverlayContainer({ stack, renderBackdrop });

    expect(renderBackdrop).not.toHaveBeenCalled();
    expect(result.children?.length).toBe(1);
  });

  it('should handle null components gracefully', () => {
    stack.push({
      id: 'null-overlay',
      component: () => null,
      showBackdrop: false,
    });

    const result = OverlayContainer({ stack });

    // Should not include null in children
    expect(result.children?.filter(Boolean).length).toBe(0);
  });
});

describe('shouldBlockInput()', () => {
  let stack: OverlayStackState;

  beforeEach(() => {
    stack = createOverlayStack();
  });

  it('should return false when stack is empty', () => {
    expect(shouldBlockInput(stack)).toBe(false);
  });

  it('should return true when stack has overlays', () => {
    stack.push({ id: 'test', component: () => Box({}) });

    expect(shouldBlockInput(stack)).toBe(true);
  });
});

describe('handleOverlayEscape()', () => {
  let stack: OverlayStackState;

  beforeEach(() => {
    stack = createOverlayStack();
  });

  it('should return false when stack is empty', () => {
    expect(handleOverlayEscape(stack)).toBe(false);
  });

  it('should pop overlay when closeOnEscape is true', () => {
    stack.push({ id: 'test', component: () => Box({}), closeOnEscape: true });

    const result = handleOverlayEscape(stack);

    expect(result).toBe(true);
    expect(stack.size()).toBe(0);
  });

  it('should not pop but return true when closeOnEscape is false', () => {
    stack.push({ id: 'test', component: () => Box({}), closeOnEscape: false });

    const result = handleOverlayEscape(stack);

    expect(result).toBe(true);
    expect(stack.size()).toBe(1);
  });
});

describe('createModalOverlay()', () => {
  it('should create config with normal priority', () => {
    const config = createModalOverlay({
      id: 'my-modal',
      component: () => Box({}),
    });

    expect(config.id).toBe('my-modal');
    expect(config.priority).toBe('normal');
    expect(config.showBackdrop).toBe(true);
    expect(config.closeOnEscape).toBe(true);
  });

  it('should respect closeOnEscape option', () => {
    const config = createModalOverlay({
      id: 'modal',
      component: () => Box({}),
      closeOnEscape: false,
    });

    expect(config.closeOnEscape).toBe(false);
  });

  it('should pass onClose callback', () => {
    const onClose = vi.fn();
    const config = createModalOverlay({
      id: 'modal',
      component: () => Box({}),
      onClose,
    });

    expect(config.onClose).toBe(onClose);
  });
});

describe('createToastOverlay()', () => {
  it('should create config with low priority and no backdrop', () => {
    const config = createToastOverlay({
      id: 'toast',
      component: () => Box({}),
    });

    expect(config.id).toBe('toast');
    expect(config.priority).toBe('low');
    expect(config.showBackdrop).toBe(false);
    expect(config.closeOnEscape).toBe(false);
  });

  it('should have autoClose function', () => {
    const config = createToastOverlay({
      id: 'toast',
      component: () => Box({}),
      duration: 3000,
    });

    expect(typeof config.autoClose).toBe('function');
  });

  it('should call onClose when config.onClose is triggered', () => {
    const onClose = vi.fn();
    const config = createToastOverlay({
      id: 'toast',
      component: () => Box({}),
      onClose,
    });

    config.onClose?.();

    expect(onClose).toHaveBeenCalled();
  });
});

describe('createCriticalOverlay()', () => {
  it('should create config with critical priority', () => {
    const config = createCriticalOverlay({
      id: 'error',
      component: () => Box({}),
    });

    expect(config.id).toBe('error');
    expect(config.priority).toBe('critical');
    expect(config.showBackdrop).toBe(true);
  });

  it('should default closeOnEscape to false', () => {
    const config = createCriticalOverlay({
      id: 'error',
      component: () => Box({}),
    });

    expect(config.closeOnEscape).toBe(false);
  });

  it('should respect closeOnEscape option', () => {
    const config = createCriticalOverlay({
      id: 'error',
      component: () => Box({}),
      closeOnEscape: true,
    });

    expect(config.closeOnEscape).toBe(true);
  });
});

describe('Real-world scenarios', () => {
  let stack: OverlayStackState;

  beforeEach(() => {
    stack = createOverlayStack();
  });

  it('should handle modal → command palette → close palette → close modal', () => {
    stack.push({ id: 'modal', component: () => Text({}, 'Modal') });
    expect(stack.current()?.id).toBe('modal');

    stack.push({ id: 'cmd-palette', component: () => Text({}, 'Palette') });
    expect(stack.current()?.id).toBe('cmd-palette');

    stack.pop();
    expect(stack.current()?.id).toBe('modal');

    stack.pop();
    expect(stack.current()).toBeNull();
  });

  it('should handle critical error appearing over modal', () => {
    stack.push({ id: 'modal', component: () => Text({}, 'Modal'), priority: 'normal' });
    stack.push({ id: 'error', component: () => Text({}, 'Error'), priority: 'critical' });

    // Error should be on top due to priority
    expect(stack.current()?.id).toBe('error');

    // Closing error reveals modal
    stack.pop();
    expect(stack.current()?.id).toBe('modal');
  });

  it('should allow closing all on app reset', () => {
    stack.push({ id: 'modal1', component: () => Box({}) });
    stack.push({ id: 'modal2', component: () => Box({}) });
    stack.push({ id: 'cmd', component: () => Box({}) });

    expect(stack.size()).toBe(3);

    stack.closeAll();

    expect(stack.size()).toBe(0);
    expect(stack.hasOverlay()).toBe(false);
  });

  it('should prevent closing modal with unsaved changes', () => {
    let hasUnsavedChanges = true;

    stack.push({
      id: 'editor',
      component: () => Text({}, 'Editor'),
      beforeClose: () => !hasUnsavedChanges,
    });

    // Try to close - should be blocked
    expect(stack.pop()).toBeNull();
    expect(stack.size()).toBe(1);

    // Save changes
    hasUnsavedChanges = false;

    // Now should close
    expect(stack.pop()?.id).toBe('editor');
    expect(stack.size()).toBe(0);
  });
});
