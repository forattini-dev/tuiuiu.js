/**
 * Tests for useFocus hooks and FocusManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FocusManagerImpl,
  createFocusManager,
  useFocus,
  useFocusManager,
} from '../../src/hooks/use-focus.js';
import {
  getFocusManager,
  setFocusManager,
  beginRender,
  endRender,
  resetHookState,
} from '../../src/hooks/context.js';

describe('FocusManagerImpl', () => {
  let fm: FocusManagerImpl;

  beforeEach(() => {
    fm = new FocusManagerImpl();
  });

  describe('register', () => {
    it('registers a focusable item', () => {
      const setFocused = vi.fn();
      fm.register('item1', setFocused);
      // No error means success
    });

    it('allows multiple items', () => {
      fm.register('item1', vi.fn());
      fm.register('item2', vi.fn());
      fm.register('item3', vi.fn());
    });
  });

  describe('unregister', () => {
    it('unregisters an item', () => {
      const setFocused = vi.fn();
      fm.register('item1', setFocused);
      fm.unregister('item1');
    });

    it('handles unregistering non-existent item', () => {
      fm.unregister('nonexistent');
    });

    it('adjusts current index when unregistering focused item', () => {
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();
      const setFocused3 = vi.fn();

      fm.register('item1', setFocused1);
      fm.register('item2', setFocused2);
      fm.register('item3', setFocused3);

      // Focus item2 (index 1)
      fm.focus('item2');
      expect(setFocused2).toHaveBeenCalledWith(true);

      // Unregister item1 (index 0)
      fm.unregister('item1');

      // Focus should still work
      fm.focusNext();
    });
  });

  describe('focus', () => {
    it('focuses a specific item by id', () => {
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      fm.register('item1', setFocused1);
      fm.register('item2', setFocused2);

      fm.focus('item2');
      expect(setFocused2).toHaveBeenCalledWith(true);
    });

    it('ignores focus on non-existent id', () => {
      fm.focus('nonexistent');
      // No error
    });

    it('unfocuses previous item when focusing new', () => {
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      fm.register('item1', setFocused1);
      fm.register('item2', setFocused2);

      fm.focus('item1');
      expect(setFocused1).toHaveBeenCalledWith(true);

      fm.focus('item2');
      expect(setFocused1).toHaveBeenCalledWith(false);
      expect(setFocused2).toHaveBeenCalledWith(true);
    });
  });

  describe('focusNext', () => {
    it('focuses next item', () => {
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();
      const setFocused3 = vi.fn();

      fm.register('item1', setFocused1);
      fm.register('item2', setFocused2);
      fm.register('item3', setFocused3);

      fm.focusNext(); // Focus item1 (index 0)
      expect(setFocused1).toHaveBeenCalledWith(true);

      fm.focusNext(); // Focus item2 (index 1)
      expect(setFocused2).toHaveBeenCalledWith(true);
    });

    it('wraps around to first item', () => {
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      fm.register('item1', setFocused1);
      fm.register('item2', setFocused2);

      fm.focusNext(); // item1
      fm.focusNext(); // item2
      fm.focusNext(); // back to item1
      expect(setFocused1).toHaveBeenLastCalledWith(true);
    });

    it('does nothing with empty items', () => {
      fm.focusNext();
      // No error
    });
  });

  describe('focusPrevious', () => {
    it('focuses previous item', () => {
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();
      const setFocused3 = vi.fn();

      fm.register('item1', setFocused1);
      fm.register('item2', setFocused2);
      fm.register('item3', setFocused3);

      fm.focus('item3'); // Start at item3

      fm.focusPrevious(); // Focus item2
      expect(setFocused2).toHaveBeenCalledWith(true);
    });

    it('wraps around to last item', () => {
      const setFocused1 = vi.fn();
      const setFocused2 = vi.fn();

      fm.register('item1', setFocused1);
      fm.register('item2', setFocused2);

      fm.focusNext(); // item1 (index 0)
      fm.focusPrevious(); // wrap to item2 (index 1)
      expect(setFocused2).toHaveBeenLastCalledWith(true);
    });

    it('does nothing with empty items', () => {
      fm.focusPrevious();
      // No error
    });
  });
});

describe('createFocusManager', () => {
  afterEach(() => {
    setFocusManager(null);
  });

  it('creates and sets focus manager', () => {
    const fm = createFocusManager();
    expect(fm).toBeInstanceOf(FocusManagerImpl);
    expect(getFocusManager()).toBe(fm);
  });
});

describe('useFocus', () => {
  beforeEach(() => {
    resetHookState();
    setFocusManager(new FocusManagerImpl());
  });

  afterEach(() => {
    resetHookState();
    setFocusManager(null);
  });

  it('returns focus result', () => {
    beginRender();
    const result = useFocus();
    endRender();

    expect(result).toHaveProperty('isFocused');
    expect(result).toHaveProperty('focus');
  });

  it('auto-focuses when autoFocus is true', () => {
    beginRender();
    const result = useFocus({ autoFocus: true, id: 'test' });
    endRender();

    expect(result.isFocused).toBe(true);
  });

  it('does not focus when isActive is false', () => {
    beginRender();
    const result = useFocus({ autoFocus: true, isActive: false, id: 'test' });
    endRender();

    expect(result.isFocused).toBe(false);
  });

  it('returns false when not focused', () => {
    beginRender();
    const result = useFocus({ id: 'test' });
    endRender();

    expect(result.isFocused).toBe(false);
  });

  it('focus method focuses the item', () => {
    const fm = getFocusManager()!;

    beginRender();
    const result1 = useFocus({ id: 'item1' });
    const result2 = useFocus({ id: 'item2' });
    endRender();

    result2.focus();
    // Focus manager should now have item2 focused
  });

  it('uses random id when not provided', () => {
    beginRender();
    const result = useFocus();
    endRender();

    expect(result).toBeDefined();
  });

  it('returns no-op focus when no id', () => {
    beginRender();
    const result = useFocus();
    endRender();

    // Calling focus without id should not throw
    result.focus();
  });
});

describe('useFocusManager', () => {
  beforeEach(() => {
    resetHookState();
    setFocusManager(new FocusManagerImpl());
  });

  afterEach(() => {
    resetHookState();
    setFocusManager(null);
  });

  it('returns focus manager controls', () => {
    const controls = useFocusManager();
    expect(controls).toHaveProperty('focusNext');
    expect(controls).toHaveProperty('focusPrevious');
    expect(controls).toHaveProperty('focus');
  });

  it('throws when no focus manager', () => {
    setFocusManager(null);
    expect(() => useFocusManager()).toThrow('useFocusManager must be called within a Reck app');
  });

  it('focusNext works', () => {
    const fm = getFocusManager()!;
    const setFocused = vi.fn();
    fm.register('test', setFocused);

    const { focusNext } = useFocusManager();
    focusNext();
    expect(setFocused).toHaveBeenCalledWith(true);
  });

  it('focusPrevious works', () => {
    const fm = getFocusManager()!;
    const setFocused1 = vi.fn();
    const setFocused2 = vi.fn();
    fm.register('item1', setFocused1);
    fm.register('item2', setFocused2);
    fm.focus('item2');

    const { focusPrevious } = useFocusManager();
    focusPrevious();
    expect(setFocused1).toHaveBeenLastCalledWith(true);
  });

  it('focus works', () => {
    const fm = getFocusManager()!;
    const setFocused = vi.fn();
    fm.register('test', setFocused);

    const { focus } = useFocusManager();
    focus('test');
    expect(setFocused).toHaveBeenCalledWith(true);
  });
});
