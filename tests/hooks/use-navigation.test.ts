/**
 * Tests for use-navigation.ts
 *
 * Covers:
 * - createLinkedNavigation: all navigation methods
 * - useNavigation: hook wrapper
 * - createWizard: wizard-specific functionality
 * - createPagination: pagination functionality
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createLinkedNavigation,
  useNavigation,
  createWizard,
  createPagination,
  type LinkedNode,
  type NavigationState,
  type WizardStep,
  type WizardState,
  type PaginationState,
} from '../../src/hooks/use-navigation.js';
import {
  keys,
  createInputHarness,
  createFocusState,
  createFocusedHandler,
} from '../helpers/keyboard.js';

describe('createLinkedNavigation', () => {
  // ==========================================================================
  // Basic Creation
  // ==========================================================================

  describe('basic creation', () => {
    it('should create navigation from array', () => {
      const items = ['a', 'b', 'c'];
      const nav = createLinkedNavigation(items);

      expect(nav.count()).toBe(3);
      expect(nav.current().data).toBe('a');
      expect(nav.currentIndex()).toBe(0);
    });

    it('should throw error for empty array', () => {
      expect(() => createLinkedNavigation([])).toThrow(
        'Cannot create navigation with empty items array'
      );
    });

    it('should use initialIndex option', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const nav = createLinkedNavigation(items, { initialIndex: 2 });

      expect(nav.currentIndex()).toBe(2);
      expect(nav.current().data).toBe('c');
    });

    it('should clamp initialIndex to valid range', () => {
      const items = ['a', 'b', 'c'];
      const nav = createLinkedNavigation(items, { initialIndex: 100 });

      expect(nav.currentIndex()).toBe(2); // Last valid index
      expect(nav.current().data).toBe('c');
    });
  });

  // ==========================================================================
  // Linked List Structure
  // ==========================================================================

  describe('linked list structure', () => {
    it('should create proper prev/next links', () => {
      const items = ['a', 'b', 'c'];
      const nav = createLinkedNavigation(items);

      const first = nav.at(0)!;
      const second = nav.at(1)!;
      const third = nav.at(2)!;

      expect(first.prev).toBeNull();
      expect(first.next).toBe(second);

      expect(second.prev).toBe(first);
      expect(second.next).toBe(third);

      expect(third.prev).toBe(second);
      expect(third.next).toBeNull();
    });

    it('should set correct indices', () => {
      const items = ['a', 'b', 'c', 'd'];
      const nav = createLinkedNavigation(items);

      for (let i = 0; i < items.length; i++) {
        expect(nav.at(i)!.index).toBe(i);
      }
    });

    it('should store data correctly', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const nav = createLinkedNavigation(items);

      expect(nav.at(0)!.data).toEqual({ id: 1 });
      expect(nav.at(1)!.data).toEqual({ id: 2 });
      expect(nav.at(2)!.data).toEqual({ id: 3 });
    });
  });

  // ==========================================================================
  // Navigation: next/prev
  // ==========================================================================

  describe('next/prev navigation', () => {
    it('should navigate to next item', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      const result = nav.next();

      expect(result).not.toBeNull();
      expect(result!.data).toBe('b');
      expect(nav.currentIndex()).toBe(1);
    });

    it('should navigate to prev item', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], { initialIndex: 2 });

      const result = nav.prev();

      expect(result).not.toBeNull();
      expect(result!.data).toBe('b');
      expect(nav.currentIndex()).toBe(1);
    });

    it('should return null when at end (no loop)', () => {
      const nav = createLinkedNavigation(['a', 'b'], { initialIndex: 1 });

      const result = nav.next();

      expect(result).toBeNull();
      expect(nav.currentIndex()).toBe(1); // Stays at current
    });

    it('should return null when at start (no loop)', () => {
      const nav = createLinkedNavigation(['a', 'b']);

      const result = nav.prev();

      expect(result).toBeNull();
      expect(nav.currentIndex()).toBe(0); // Stays at current
    });

    it('should loop from end to start when loop=true', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], {
        initialIndex: 2,
        loop: true,
      });

      const result = nav.next();

      expect(result).not.toBeNull();
      expect(result!.data).toBe('a');
      expect(nav.currentIndex()).toBe(0);
    });

    it('should loop from start to end when loop=true', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], { loop: true });

      const result = nav.prev();

      expect(result).not.toBeNull();
      expect(result!.data).toBe('c');
      expect(nav.currentIndex()).toBe(2);
    });
  });

  // ==========================================================================
  // Navigation: first/last
  // ==========================================================================

  describe('first/last navigation', () => {
    it('should navigate to first item', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c', 'd'], { initialIndex: 3 });

      const result = nav.first();

      expect(result.data).toBe('a');
      expect(nav.currentIndex()).toBe(0);
    });

    it('should return current when already at first', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      const result = nav.first();

      expect(result.data).toBe('a');
      expect(nav.currentIndex()).toBe(0);
    });

    it('should navigate to last item', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c', 'd']);

      const result = nav.last();

      expect(result.data).toBe('d');
      expect(nav.currentIndex()).toBe(3);
    });

    it('should return current when already at last', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], { initialIndex: 2 });

      const result = nav.last();

      expect(result.data).toBe('c');
      expect(nav.currentIndex()).toBe(2);
    });
  });

  // ==========================================================================
  // Navigation: goTo
  // ==========================================================================

  describe('goTo navigation', () => {
    it('should go to specific index', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c', 'd', 'e']);

      const result = nav.goTo(3);

      expect(result).not.toBeNull();
      expect(result!.data).toBe('d');
      expect(nav.currentIndex()).toBe(3);
    });

    it('should return null for out of range index (negative)', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      expect(nav.goTo(-1)).toBeNull();
      expect(nav.currentIndex()).toBe(0); // Unchanged
    });

    it('should return null for out of range index (too high)', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      expect(nav.goTo(10)).toBeNull();
      expect(nav.currentIndex()).toBe(0); // Unchanged
    });

    it('should return current when going to same index', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], { initialIndex: 1 });

      const result = nav.goTo(1);

      expect(result).not.toBeNull();
      expect(result!.data).toBe('b');
    });
  });

  // ==========================================================================
  // Navigation: forward/backward
  // ==========================================================================

  describe('forward/backward navigation', () => {
    it('should go forward N items', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c', 'd', 'e']);

      const result = nav.forward(3);

      expect(result.data).toBe('d');
      expect(nav.currentIndex()).toBe(3);
    });

    it('should stop at end when going forward past bounds', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      const result = nav.forward(10);

      expect(result.data).toBe('c');
      expect(nav.currentIndex()).toBe(2);
    });

    it('should go backward N items', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c', 'd', 'e'], { initialIndex: 4 });

      const result = nav.backward(2);

      expect(result.data).toBe('c');
      expect(nav.currentIndex()).toBe(2);
    });

    it('should stop at start when going backward past bounds', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], { initialIndex: 2 });

      const result = nav.backward(10);

      expect(result.data).toBe('a');
      expect(nav.currentIndex()).toBe(0);
    });

    it('should return current when forward(0)', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], { initialIndex: 1 });

      const result = nav.forward(0);

      expect(result.data).toBe('b');
    });
  });

  // ==========================================================================
  // Status Methods
  // ==========================================================================

  describe('status methods', () => {
    it('should correctly report isFirst', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      expect(nav.isFirst()).toBe(true);
      nav.next();
      expect(nav.isFirst()).toBe(false);
      nav.first();
      expect(nav.isFirst()).toBe(true);
    });

    it('should correctly report isLast', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], { initialIndex: 2 });

      expect(nav.isLast()).toBe(true);
      nav.prev();
      expect(nav.isLast()).toBe(false);
      nav.last();
      expect(nav.isLast()).toBe(true);
    });

    it('should correctly report canNext', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      expect(nav.canNext()).toBe(true);
      nav.last();
      expect(nav.canNext()).toBe(false);
    });

    it('should correctly report canPrev', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], { initialIndex: 1 });

      expect(nav.canPrev()).toBe(true);
      nav.first();
      expect(nav.canPrev()).toBe(false);
    });

    it('should report canNext true when loop=true at end', () => {
      const nav = createLinkedNavigation(['a', 'b'], { initialIndex: 1, loop: true });

      expect(nav.canNext()).toBe(true);
    });

    it('should report canPrev true when loop=true at start', () => {
      const nav = createLinkedNavigation(['a', 'b'], { loop: true });

      expect(nav.canPrev()).toBe(true);
    });
  });

  // ==========================================================================
  // Access Methods
  // ==========================================================================

  describe('access methods', () => {
    it('should return node at specific index', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      expect(nav.at(0)!.data).toBe('a');
      expect(nav.at(1)!.data).toBe('b');
      expect(nav.at(2)!.data).toBe('c');
    });

    it('should return null for invalid index', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      expect(nav.at(-1)).toBeNull();
      expect(nav.at(5)).toBeNull();
    });

    it('should convert to array', () => {
      const items = ['a', 'b', 'c'];
      const nav = createLinkedNavigation(items);

      const arr = nav.toArray();

      expect(arr).toHaveLength(3);
      expect(arr.map(n => n.data)).toEqual(['a', 'b', 'c']);
    });

    it('should map over nodes', () => {
      const nav = createLinkedNavigation([1, 2, 3]);

      const result = nav.map((node, i) => node.data * 10 + i);

      expect(result).toEqual([10, 21, 32]);
    });

    it('should find node by predicate', () => {
      const nav = createLinkedNavigation([
        { id: 1, name: 'one' },
        { id: 2, name: 'two' },
        { id: 3, name: 'three' },
      ]);

      const found = nav.find(node => node.data.name === 'two');

      expect(found).not.toBeNull();
      expect(found!.data.id).toBe(2);
    });

    it('should return null when find has no match', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      const found = nav.find(node => node.data === 'z');

      expect(found).toBeNull();
    });
  });

  // ==========================================================================
  // Callbacks
  // ==========================================================================

  describe('callbacks', () => {
    it('should call onChange on navigation', () => {
      const onChange = vi.fn();
      const nav = createLinkedNavigation(['a', 'b', 'c'], { onChange });

      nav.next();

      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({ data: 'b' }),
        expect.objectContaining({ data: 'a' }),
        'next'
      );
    });

    it('should call onChange with correct direction', () => {
      const onChange = vi.fn();
      const nav = createLinkedNavigation(['a', 'b', 'c'], { onChange, initialIndex: 1 });

      nav.prev();
      expect(onChange).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'prev'
      );

      nav.goTo(2);
      expect(onChange).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        'jump'
      );
    });

    it('should cancel navigation when beforeChange returns false', () => {
      const beforeChange = vi.fn().mockReturnValue(false);
      const nav = createLinkedNavigation(['a', 'b', 'c'], { beforeChange });

      const result = nav.next();

      expect(result).toBeNull();
      expect(nav.currentIndex()).toBe(0);
    });

    it('should allow navigation when beforeChange returns true', () => {
      const beforeChange = vi.fn().mockReturnValue(true);
      const nav = createLinkedNavigation(['a', 'b', 'c'], { beforeChange });

      const result = nav.next();

      expect(result).not.toBeNull();
      expect(nav.currentIndex()).toBe(1);
    });

    it('should pass correct params to beforeChange', () => {
      const beforeChange = vi.fn().mockReturnValue(true);
      const nav = createLinkedNavigation(['a', 'b', 'c'], { beforeChange });

      nav.next();

      expect(beforeChange).toHaveBeenCalledWith(
        expect.objectContaining({ data: 'a', index: 0 }),
        expect.objectContaining({ data: 'b', index: 1 }),
        'next'
      );
    });
  });

  // ==========================================================================
  // History
  // ==========================================================================

  describe('history tracking', () => {
    it('should track navigation history by default', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c', 'd']);

      nav.next();
      nav.next();
      nav.goTo(0);

      const history = nav.history();

      expect(history).toEqual([0, 1, 2, 0]);
    });

    it('should not track history when trackHistory=false', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c'], { trackHistory: false });

      nav.next();
      nav.next();

      expect(nav.history()).toEqual([]);
    });

    it('should go back in history', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c', 'd', 'e']);

      nav.goTo(4);
      nav.goTo(2);
      nav.goTo(0);

      const result = nav.back();

      expect(result).not.toBeNull();
      expect(result!.data).toBe('c');
      expect(nav.currentIndex()).toBe(2);
    });

    it('should return null when history is too short', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c']);

      // History only has initial position
      expect(nav.back()).toBeNull();
    });

    it('should clear history', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c', 'd']);

      nav.next();
      nav.next();
      nav.clearHistory();

      // Should only have current position
      expect(nav.history()).toEqual([2]);
    });

    it('should respect maxHistory limit', () => {
      const nav = createLinkedNavigation(['a', 'b', 'c', 'd', 'e'], {
        maxHistory: 3,
        loop: true,
      });

      // Navigate many times
      for (let i = 0; i < 10; i++) {
        nav.next();
      }

      expect(nav.history().length).toBeLessThanOrEqual(3);
    });
  });

  // ==========================================================================
  // Keyboard Integration
  // ==========================================================================

  describe('keyboard integration', () => {
    let nav: NavigationState<string>;
    let selectedIndex: number;

    beforeEach(() => {
      nav = createLinkedNavigation(['a', 'b', 'c', 'd', 'e']);
      selectedIndex = 0;
    });

    it('should navigate with arrow keys', () => {
      const harness = createInputHarness((_, key) => {
        if (key.rightArrow) nav.next();
        if (key.leftArrow) nav.prev();
      });

      harness.press(keys.right());
      expect(nav.currentIndex()).toBe(1);

      harness.press(keys.right());
      expect(nav.currentIndex()).toBe(2);

      harness.press(keys.left());
      expect(nav.currentIndex()).toBe(1);
    });

    it('should navigate with j/k keys (vim style)', () => {
      const harness = createInputHarness((input) => {
        if (input === 'j') nav.next();
        if (input === 'k') nav.prev();
      });

      harness.type('jj');
      expect(nav.currentIndex()).toBe(2);

      harness.type('k');
      expect(nav.currentIndex()).toBe(1);
    });

    it('should go to first/last with home/end keys', () => {
      const harness = createInputHarness((_, key) => {
        if (key.home) nav.first();
        if (key.end) nav.last();
      });

      harness.press(keys.end());
      expect(nav.currentIndex()).toBe(4);

      harness.press(keys.home());
      expect(nav.currentIndex()).toBe(0);
    });

    it('should go to first/last with g/G keys (vim style)', () => {
      const harness = createInputHarness((input) => {
        if (input === 'g') nav.first();
        if (input === 'G') nav.last();
      });

      harness.type('G');
      expect(nav.currentIndex()).toBe(4);

      harness.type('g');
      expect(nav.currentIndex()).toBe(0);
    });

    it('should navigate by page with pageUp/pageDown', () => {
      const pageSize = 3;
      const harness = createInputHarness((_, key) => {
        if (key.pageDown) nav.forward(pageSize);
        if (key.pageUp) nav.backward(pageSize);
      });

      harness.press(keys.pageDown());
      expect(nav.currentIndex()).toBe(3);

      harness.press(keys.pageUp());
      expect(nav.currentIndex()).toBe(0);
    });

    it('should only respond when focused', () => {
      const focus = createFocusState(false);
      const focusedHandler = createFocusedHandler(focus, (_, key) => {
        if (key.rightArrow) nav.next();
      });
      const harness = createInputHarness(focusedHandler);

      // Not focused - no effect
      harness.press(keys.right());
      expect(nav.currentIndex()).toBe(0);

      // Focus and try again
      focus.focus();
      harness.press(keys.right());
      expect(nav.currentIndex()).toBe(1);

      // Blur and verify no effect
      focus.blur();
      harness.press(keys.right());
      expect(nav.currentIndex()).toBe(1);
    });

    it('should navigate with number keys', () => {
      const harness = createInputHarness((input) => {
        const num = parseInt(input);
        if (!isNaN(num) && num >= 1 && num <= nav.count()) {
          nav.goTo(num - 1);
        }
      });

      harness.press(keys.num3());
      expect(nav.currentIndex()).toBe(2);

      harness.press(keys.num1());
      expect(nav.currentIndex()).toBe(0);

      harness.press(keys.num5());
      expect(nav.currentIndex()).toBe(4);
    });
  });
});

// =============================================================================
// useNavigation Hook
// =============================================================================

describe('useNavigation', () => {
  it('should create navigation (wrapper function)', () => {
    const nav = useNavigation(['a', 'b', 'c']);

    expect(nav.count()).toBe(3);
    expect(nav.current().data).toBe('a');
  });

  it('should accept options', () => {
    const nav = useNavigation(['a', 'b', 'c'], { initialIndex: 1, loop: true });

    expect(nav.currentIndex()).toBe(1);
    expect(nav.canPrev()).toBe(true); // Loop enabled
  });
});

// =============================================================================
// createWizard
// =============================================================================

describe('createWizard', () => {
  const steps: WizardStep[] = [
    { id: 'intro', title: 'Introduction', description: 'Welcome to the wizard' },
    { id: 'step1', title: 'Step 1', description: 'First step', skippable: true },
    { id: 'step2', title: 'Step 2', description: 'Second step', validate: () => true },
    { id: 'step3', title: 'Step 3', description: 'Third step', validate: () => false },
    { id: 'complete', title: 'Complete', description: 'All done!' },
  ];

  // ==========================================================================
  // Basic Wizard Navigation
  // ==========================================================================

  describe('basic navigation', () => {
    it('should create wizard with steps', () => {
      const wizard = createWizard(steps);

      expect(wizard.count()).toBe(5);
      expect(wizard.current().data.id).toBe('intro');
    });

    it('should inherit all navigation methods', () => {
      const wizard = createWizard(steps);

      wizard.next();
      expect(wizard.current().data.id).toBe('step1');

      wizard.last();
      expect(wizard.current().data.id).toBe('complete');

      wizard.goTo(2);
      expect(wizard.current().data.id).toBe('step2');
    });
  });

  // ==========================================================================
  // Step Access by ID
  // ==========================================================================

  describe('step access by ID', () => {
    it('should get step by ID', () => {
      const wizard = createWizard(steps);

      const step = wizard.getStep('step2');

      expect(step).not.toBeNull();
      expect(step!.data.title).toBe('Step 2');
      expect(step!.index).toBe(2);
    });

    it('should return null for unknown ID', () => {
      const wizard = createWizard(steps);

      expect(wizard.getStep('unknown')).toBeNull();
    });

    it('should go to step by ID', () => {
      const wizard = createWizard(steps);

      const result = wizard.goToStep('complete');

      expect(result).not.toBeNull();
      expect(wizard.currentIndex()).toBe(4);
    });

    it('should return null when going to unknown step ID', () => {
      const wizard = createWizard(steps);

      expect(wizard.goToStep('invalid')).toBeNull();
    });
  });

  // ==========================================================================
  // Completion Tracking
  // ==========================================================================

  describe('completion tracking', () => {
    it('should track completed steps', () => {
      const wizard = createWizard(steps);

      expect(wizard.isCompleted(0)).toBe(false);

      wizard.markCompleted(0);
      expect(wizard.isCompleted(0)).toBe(true);

      wizard.markCompleted(1);
      wizard.markCompleted(2);

      expect(wizard.completedSteps()).toEqual([0, 1, 2]);
    });

    it('should ignore invalid indices for markCompleted', () => {
      const wizard = createWizard(steps);

      wizard.markCompleted(-1);
      wizard.markCompleted(100);

      expect(wizard.completedSteps()).toEqual([]);
    });

    it('should calculate progress', () => {
      const wizard = createWizard(steps);

      expect(wizard.progress()).toBe(0);

      wizard.markCompleted(0);
      wizard.markCompleted(1);

      expect(wizard.progress()).toBe(2 / 5);

      wizard.markCompleted(2);
      wizard.markCompleted(3);
      wizard.markCompleted(4);

      expect(wizard.progress()).toBe(1);
    });
  });

  // ==========================================================================
  // Validation
  // ==========================================================================

  describe('validation', () => {
    it('should validate current step (sync true)', async () => {
      const wizard = createWizard(steps);
      wizard.goTo(2); // step2 with validate: () => true

      const result = await wizard.validateCurrent();

      expect(result).toBe(true);
      expect(wizard.isCompleted(2)).toBe(true);
    });

    it('should validate current step (sync false)', async () => {
      const wizard = createWizard(steps);
      wizard.goTo(3); // step3 with validate: () => false

      const result = await wizard.validateCurrent();

      expect(result).toBe(false);
      expect(wizard.isCompleted(3)).toBe(false);
    });

    it('should pass validation when no validate function', async () => {
      const wizard = createWizard(steps);
      // Step 0 (intro) has no validate function

      const result = await wizard.validateCurrent();

      expect(result).toBe(true);
    });

    it('should handle async validation', async () => {
      const asyncSteps: WizardStep[] = [
        {
          id: 'async',
          title: 'Async',
          validate: () => Promise.resolve(true),
        },
      ];
      const wizard = createWizard(asyncSteps);

      const result = await wizard.validateCurrent();

      expect(result).toBe(true);
      expect(wizard.isCompleted(0)).toBe(true);
    });
  });

  // ==========================================================================
  // Wizard with Keyboard
  // ==========================================================================

  describe('keyboard integration', () => {
    it('should navigate wizard with arrows', () => {
      const wizard = createWizard(steps);
      const harness = createInputHarness((_, key) => {
        if (key.rightArrow && wizard.canNext()) wizard.next();
        if (key.leftArrow && wizard.canPrev()) wizard.prev();
      });

      harness.press(keys.right());
      expect(wizard.current().data.id).toBe('step1');

      harness.press(keys.right());
      expect(wizard.current().data.id).toBe('step2');

      harness.press(keys.left());
      expect(wizard.current().data.id).toBe('step1');
    });

    it('should mark complete on enter', () => {
      const wizard = createWizard(steps);
      const harness = createInputHarness((_, key) => {
        if (key.return) {
          wizard.markCompleted(wizard.currentIndex());
          wizard.next();
        }
      });

      harness.press(keys.enter());
      expect(wizard.isCompleted(0)).toBe(true);
      expect(wizard.current().data.id).toBe('step1');
    });

    it('should focus control wizard navigation', () => {
      const wizard = createWizard(steps);
      const focus = createFocusState(false);
      const focusedHandler = createFocusedHandler(focus, (_, key) => {
        if (key.rightArrow) wizard.next();
      });
      const harness = createInputHarness(focusedHandler);

      // Not focused - no effect
      harness.press(keys.right());
      expect(wizard.currentIndex()).toBe(0);

      // Focus
      focus.focus();
      harness.press(keys.right());
      expect(wizard.currentIndex()).toBe(1);
    });
  });
});

// =============================================================================
// createPagination
// =============================================================================

describe('createPagination', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];

  // ==========================================================================
  // Basic Pagination
  // ==========================================================================

  describe('basic pagination', () => {
    it('should create pagination from items', () => {
      const pagination = createPagination(items, { perPage: 3 });

      expect(pagination.count()).toBe(4); // 10 items / 3 per page = 4 pages
      expect(pagination.items()).toEqual(['a', 'b', 'c']);
    });

    it('should handle partial last page', () => {
      const pagination = createPagination(items, { perPage: 3 });

      pagination.last();
      expect(pagination.items()).toEqual(['j']); // Only 1 item on last page
    });

    it('should use default perPage of 10', () => {
      const pagination = createPagination(items);

      expect(pagination.count()).toBe(1); // 10 items fit in 1 page
      expect(pagination.items()).toEqual(items);
    });

    it('should handle empty items', () => {
      const pagination = createPagination([], { perPage: 5 });

      expect(pagination.count()).toBe(1); // At least 1 empty page
      expect(pagination.items()).toEqual([]);
    });
  });

  // ==========================================================================
  // Page Info
  // ==========================================================================

  describe('pageInfo', () => {
    it('should return correct page info on first page', () => {
      const pagination = createPagination(items, { perPage: 3 });

      const info = pagination.pageInfo();

      expect(info.page).toBe(1);
      expect(info.totalPages).toBe(4);
      expect(info.perPage).toBe(3);
      expect(info.totalItems).toBe(10);
      expect(info.firstItem).toBe(0);
      expect(info.lastItem).toBe(2);
    });

    it('should update page info on navigation', () => {
      const pagination = createPagination(items, { perPage: 3 });

      pagination.next();
      const info = pagination.pageInfo();

      expect(info.page).toBe(2);
      expect(info.firstItem).toBe(3);
      expect(info.lastItem).toBe(5);
    });

    it('should handle last page info correctly', () => {
      const pagination = createPagination(items, { perPage: 3 });

      pagination.last();
      const info = pagination.pageInfo();

      expect(info.page).toBe(4);
      expect(info.firstItem).toBe(9);
      expect(info.lastItem).toBe(9); // Only 1 item
    });
  });

  // ==========================================================================
  // goToPage
  // ==========================================================================

  describe('goToPage', () => {
    it('should go to specific page (1-based)', () => {
      const pagination = createPagination(items, { perPage: 3 });

      const result = pagination.goToPage(3);

      expect(result).toEqual(['g', 'h', 'i']);
      expect(pagination.pageInfo().page).toBe(3);
    });

    it('should return null for invalid page', () => {
      const pagination = createPagination(items, { perPage: 3 });

      expect(pagination.goToPage(0)).toBeNull();
      expect(pagination.goToPage(10)).toBeNull();
    });

    it('should work with page 1', () => {
      const pagination = createPagination(items, { perPage: 3 });
      pagination.next();

      const result = pagination.goToPage(1);

      expect(result).toEqual(['a', 'b', 'c']);
    });
  });

  // ==========================================================================
  // Pagination with Keyboard
  // ==========================================================================

  describe('keyboard integration', () => {
    it('should paginate with arrow keys', () => {
      const pagination = createPagination(items, { perPage: 3 });
      const harness = createInputHarness((_, key) => {
        if (key.rightArrow) pagination.next();
        if (key.leftArrow) pagination.prev();
      });

      harness.press(keys.right());
      expect(pagination.items()).toEqual(['d', 'e', 'f']);

      harness.press(keys.right());
      expect(pagination.items()).toEqual(['g', 'h', 'i']);

      harness.press(keys.left());
      expect(pagination.items()).toEqual(['d', 'e', 'f']);
    });

    it('should go to first/last page with home/end', () => {
      const pagination = createPagination(items, { perPage: 3 });
      const harness = createInputHarness((_, key) => {
        if (key.home) pagination.first();
        if (key.end) pagination.last();
      });

      harness.press(keys.end());
      expect(pagination.pageInfo().page).toBe(4);

      harness.press(keys.home());
      expect(pagination.pageInfo().page).toBe(1);
    });

    it('should jump to page with number keys', () => {
      const pagination = createPagination(items, { perPage: 3 });
      const harness = createInputHarness((input) => {
        const num = parseInt(input);
        if (!isNaN(num) && num >= 1 && num <= pagination.count()) {
          pagination.goToPage(num);
        }
      });

      harness.press(keys.num2());
      expect(pagination.pageInfo().page).toBe(2);

      harness.press(keys.num4());
      expect(pagination.pageInfo().page).toBe(4);

      harness.press(keys.num1());
      expect(pagination.pageInfo().page).toBe(1);
    });

    it('should respect focus state', () => {
      const pagination = createPagination(items, { perPage: 3 });
      const focus = createFocusState(false);
      const focusedHandler = createFocusedHandler(focus, (_, key) => {
        if (key.rightArrow) pagination.next();
      });
      const harness = createInputHarness(focusedHandler);

      // Not focused
      harness.press(keys.right());
      expect(pagination.pageInfo().page).toBe(1);

      // Focus and navigate
      focus.focus();
      harness.press(keys.right());
      expect(pagination.pageInfo().page).toBe(2);
    });
  });
});
