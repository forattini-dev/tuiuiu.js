/**
 * Linked Navigation - Kyma-inspired slide navigation
 *
 * Provides a doubly-linked list navigation system for slides,
 * wizards, onboarding flows, and paginated content.
 *
 * Features:
 * - O(1) next/prev navigation
 * - Jump to first/last
 * - Jump by index
 * - History tracking
 * - Transition callbacks
 *
 * @example
 * ```typescript
 * import { createLinkedNavigation, useNavigation } from 'tuiuiu';
 *
 * // Create navigation from items
 * const nav = createLinkedNavigation([
 *   { id: 'intro', content: 'Welcome!' },
 *   { id: 'step1', content: 'Step 1' },
 *   { id: 'step2', content: 'Step 2' },
 *   { id: 'complete', content: 'Done!' },
 * ]);
 *
 * // Navigate
 * nav.next();     // Go to step1
 * nav.prev();     // Go back to intro
 * nav.goTo(3);    // Jump to complete
 * nav.first();    // Go to intro
 * nav.last();     // Go to complete
 *
 * // Get current
 * const current = nav.current();
 * console.log(current.data.content); // 'Complete!'
 * ```
 */

import { createSignal } from '../primitives/signal.js';

// =============================================================================
// Types
// =============================================================================

export interface LinkedNode<T> {
  /** Node data */
  data: T;
  /** Index in the list */
  index: number;
  /** Previous node */
  prev: LinkedNode<T> | null;
  /** Next node */
  next: LinkedNode<T> | null;
}

export interface NavigationState<T> {
  /** Get current node */
  current: () => LinkedNode<T>;
  /** Get current index (0-based) */
  currentIndex: () => number;
  /** Get total count */
  count: () => number;
  /** Check if at first item */
  isFirst: () => boolean;
  /** Check if at last item */
  isLast: () => boolean;
  /** Check if can go next */
  canNext: () => boolean;
  /** Check if can go prev */
  canPrev: () => boolean;
  /** Go to next item */
  next: () => LinkedNode<T> | null;
  /** Go to previous item */
  prev: () => LinkedNode<T> | null;
  /** Go to first item */
  first: () => LinkedNode<T>;
  /** Go to last item */
  last: () => LinkedNode<T>;
  /** Go to specific index */
  goTo: (index: number) => LinkedNode<T> | null;
  /** Go forward N items */
  forward: (n: number) => LinkedNode<T>;
  /** Go backward N items */
  backward: (n: number) => LinkedNode<T>;
  /** Get node at index */
  at: (index: number) => LinkedNode<T> | null;
  /** Get all nodes as array */
  toArray: () => LinkedNode<T>[];
  /** Map over all nodes */
  map: <U>(fn: (node: LinkedNode<T>, index: number) => U) => U[];
  /** Find node by predicate */
  find: (predicate: (node: LinkedNode<T>) => boolean) => LinkedNode<T> | null;
  /** Get navigation history */
  history: () => number[];
  /** Go back in history */
  back: () => LinkedNode<T> | null;
  /** Clear history */
  clearHistory: () => void;
}

export interface NavigationOptions<T> {
  /** Initial index (default: 0) */
  initialIndex?: number;
  /** Callback when navigation changes */
  onChange?: (current: LinkedNode<T>, previous: LinkedNode<T> | null, direction: 'next' | 'prev' | 'jump') => void;
  /** Callback before navigation (return false to cancel) */
  beforeChange?: (current: LinkedNode<T>, target: LinkedNode<T>, direction: 'next' | 'prev' | 'jump') => boolean;
  /** Enable looping (last → first, first → last) */
  loop?: boolean;
  /** Track navigation history */
  trackHistory?: boolean;
  /** Maximum history length */
  maxHistory?: number;
}

// =============================================================================
// Implementation
// =============================================================================

/**
 * Create a linked navigation system from array of items
 */
export function createLinkedNavigation<T>(
  items: T[],
  options: NavigationOptions<T> = {}
): NavigationState<T> {
  const {
    initialIndex = 0,
    onChange,
    beforeChange,
    loop = false,
    trackHistory = true,
    maxHistory = 50,
  } = options;

  if (items.length === 0) {
    throw new Error('Cannot create navigation with empty items array');
  }

  // Build linked list
  const nodes: LinkedNode<T>[] = items.map((data, index) => ({
    data,
    index,
    prev: null,
    next: null,
  }));

  // Link nodes
  for (let i = 0; i < nodes.length; i++) {
    nodes[i]!.prev = i > 0 ? nodes[i - 1]! : null;
    nodes[i]!.next = i < nodes.length - 1 ? nodes[i + 1]! : null;
  }

  const firstNode = nodes[0]!;
  const lastNode = nodes[nodes.length - 1]!;

  // State
  let currentNode = nodes[Math.min(initialIndex, nodes.length - 1)]!;
  const navigationHistory: number[] = trackHistory ? [currentNode.index] : [];

  // Signal for reactivity
  const [version, setVersion] = createSignal(0);
  const triggerUpdate = () => setVersion(v => v + 1);

  // Navigation helpers
  const navigateTo = (
    target: LinkedNode<T>,
    direction: 'next' | 'prev' | 'jump'
  ): LinkedNode<T> | null => {
    if (beforeChange && !beforeChange(currentNode, target, direction)) {
      return null;
    }

    const previous = currentNode;
    currentNode = target;

    if (trackHistory) {
      navigationHistory.push(currentNode.index);
      if (navigationHistory.length > maxHistory) {
        navigationHistory.shift();
      }
    }

    onChange?.(currentNode, previous, direction);
    triggerUpdate();

    return currentNode;
  };

  return {
    current: () => {
      version(); // Subscribe to updates
      return currentNode;
    },

    currentIndex: () => {
      version();
      return currentNode.index;
    },

    count: () => nodes.length,

    isFirst: () => {
      version();
      return currentNode.index === 0;
    },

    isLast: () => {
      version();
      return currentNode.index === nodes.length - 1;
    },

    canNext: () => {
      version();
      return loop || currentNode.next !== null;
    },

    canPrev: () => {
      version();
      return loop || currentNode.prev !== null;
    },

    next: () => {
      let target = currentNode.next;
      if (!target && loop) {
        target = firstNode;
      }
      if (!target) return null;
      return navigateTo(target, 'next');
    },

    prev: () => {
      let target = currentNode.prev;
      if (!target && loop) {
        target = lastNode;
      }
      if (!target) return null;
      return navigateTo(target, 'prev');
    },

    first: () => {
      if (currentNode === firstNode) return currentNode;
      return navigateTo(firstNode, 'jump') || currentNode;
    },

    last: () => {
      if (currentNode === lastNode) return currentNode;
      return navigateTo(lastNode, 'jump') || currentNode;
    },

    goTo: (index: number) => {
      if (index < 0 || index >= nodes.length) return null;
      const target = nodes[index]!;
      if (currentNode === target) return currentNode;
      return navigateTo(target, 'jump');
    },

    forward: (n: number) => {
      let target = currentNode;
      for (let i = 0; i < n && target.next; i++) {
        target = target.next;
      }
      if (target === currentNode) return currentNode;
      return navigateTo(target, 'next') || currentNode;
    },

    backward: (n: number) => {
      let target = currentNode;
      for (let i = 0; i < n && target.prev; i++) {
        target = target.prev;
      }
      if (target === currentNode) return currentNode;
      return navigateTo(target, 'prev') || currentNode;
    },

    at: (index: number) => {
      if (index < 0 || index >= nodes.length) return null;
      return nodes[index] || null;
    },

    toArray: () => [...nodes],

    map: <U>(fn: (node: LinkedNode<T>, index: number) => U): U[] => {
      return nodes.map((node, i) => fn(node, i));
    },

    find: (predicate: (node: LinkedNode<T>) => boolean) => {
      return nodes.find(predicate) || null;
    },

    history: () => [...navigationHistory],

    back: () => {
      if (navigationHistory.length < 2) return null;
      navigationHistory.pop(); // Remove current
      const prevIndex = navigationHistory[navigationHistory.length - 1];
      if (prevIndex === undefined) return null;
      const target = nodes[prevIndex];
      if (!target) return null;
      currentNode = target;
      triggerUpdate();
      return currentNode;
    },

    clearHistory: () => {
      navigationHistory.length = 0;
      if (trackHistory) {
        navigationHistory.push(currentNode.index);
      }
    },
  };
}

// =============================================================================
// Hook Version (for use in components)
// =============================================================================

/**
 * Navigation hook for use in components
 *
 * @example
 * ```typescript
 * function Wizard() {
 *   const nav = useNavigation([
 *     { title: 'Step 1', component: Step1 },
 *     { title: 'Step 2', component: Step2 },
 *     { title: 'Step 3', component: Step3 },
 *   ]);
 *
 *   useInput((_, key) => {
 *     if (key.rightArrow) nav.next();
 *     if (key.leftArrow) nav.prev();
 *   });
 *
 *   const step = nav.current();
 *   return step.data.component();
 * }
 * ```
 */
export function useNavigation<T>(
  items: T[],
  options: NavigationOptions<T> = {}
): NavigationState<T> {
  // Create navigation once
  return createLinkedNavigation(items, options);
}

// =============================================================================
// Wizard Builder
// =============================================================================

export interface WizardStep<T = unknown> {
  /** Step ID */
  id: string;
  /** Step title */
  title: string;
  /** Step description */
  description?: string;
  /** Step data */
  data?: T;
  /** Whether step can be skipped */
  skippable?: boolean;
  /** Validation function */
  validate?: () => boolean | Promise<boolean>;
}

export interface WizardState<T = unknown> extends NavigationState<WizardStep<T>> {
  /** Get step by ID */
  getStep: (id: string) => LinkedNode<WizardStep<T>> | null;
  /** Go to step by ID */
  goToStep: (id: string) => LinkedNode<WizardStep<T>> | null;
  /** Check if step is completed */
  isCompleted: (index: number) => boolean;
  /** Mark step as completed */
  markCompleted: (index: number) => void;
  /** Get all completed steps */
  completedSteps: () => number[];
  /** Get progress (0-1) */
  progress: () => number;
  /** Validate current step */
  validateCurrent: () => Promise<boolean>;
}

/**
 * Create a wizard navigation with validation and progress tracking
 */
export function createWizard<T = unknown>(
  steps: WizardStep<T>[],
  options: NavigationOptions<WizardStep<T>> = {}
): WizardState<T> {
  const completed = new Set<number>();
  const nav = createLinkedNavigation(steps, options);

  return {
    ...nav,

    getStep: (id: string) => {
      return nav.find(node => node.data.id === id);
    },

    goToStep: (id: string) => {
      const step = nav.find(node => node.data.id === id);
      if (!step) return null;
      return nav.goTo(step.index);
    },

    isCompleted: (index: number) => completed.has(index),

    markCompleted: (index: number) => {
      if (index >= 0 && index < nav.count()) {
        completed.add(index);
      }
    },

    completedSteps: () => [...completed].sort((a, b) => a - b),

    progress: () => {
      return completed.size / nav.count();
    },

    validateCurrent: async () => {
      const current = nav.current();
      if (!current.data.validate) return true;
      const result = await current.data.validate();
      if (result) {
        completed.add(current.index);
      }
      return result;
    },
  };
}

// =============================================================================
// Pagination Builder
// =============================================================================

export interface PageInfo {
  /** Current page (1-based) */
  page: number;
  /** Total pages */
  totalPages: number;
  /** Items per page */
  perPage: number;
  /** Total items */
  totalItems: number;
  /** First item index on current page */
  firstItem: number;
  /** Last item index on current page */
  lastItem: number;
}

export interface PaginationState<T> extends NavigationState<T[]> {
  /** Get page info */
  pageInfo: () => PageInfo;
  /** Get items on current page */
  items: () => T[];
  /** Go to specific page (1-based) */
  goToPage: (page: number) => T[] | null;
}

/**
 * Create pagination from a flat array
 *
 * @example
 * ```typescript
 * const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'];
 * const pagination = createPagination(items, { perPage: 3 });
 *
 * pagination.items();     // ['a', 'b', 'c']
 * pagination.next();
 * pagination.items();     // ['d', 'e', 'f']
 * pagination.pageInfo();  // { page: 2, totalPages: 4, ... }
 * ```
 */
export function createPagination<T>(
  items: T[],
  options: NavigationOptions<T[]> & { perPage?: number } = {}
): PaginationState<T> {
  const { perPage = 10, ...navOptions } = options;

  // Split items into pages
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += perPage) {
    pages.push(items.slice(i, i + perPage));
  }

  if (pages.length === 0) {
    pages.push([]);
  }

  const nav = createLinkedNavigation(pages, navOptions);

  return {
    ...nav,

    pageInfo: () => {
      const current = nav.current();
      const page = current.index + 1;
      const totalPages = nav.count();
      const firstItem = current.index * perPage;
      const lastItem = Math.min(firstItem + perPage - 1, items.length - 1);

      return {
        page,
        totalPages,
        perPage,
        totalItems: items.length,
        firstItem,
        lastItem,
      };
    },

    items: () => nav.current().data,

    goToPage: (page: number) => {
      const result = nav.goTo(page - 1);
      return result ? result.data : null;
    },
  };
}
