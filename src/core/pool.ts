/**
 * Object Pool - Reusable object allocator (inspired by arrow-js)
 *
 * Pre-allocates objects and reuses them to eliminate GC pressure
 * during frequent render cycles. Objects are acquired from the pool
 * and returned when no longer needed.
 *
 * @example
 * const vnodePool = createPool<VNode>(
 *   () => ({ type: 'box', props: {}, children: [], key: undefined }),
 *   (node) => { node.type = 'box'; node.props = {}; node.children = []; node.key = undefined; }
 * );
 *
 * const node = vnodePool.acquire();
 * // ... use node ...
 * vnodePool.release(node);
 */

export interface Pool<T> {
  /** Get an object from the pool (or create one if pool is empty) */
  acquire(): T;
  /** Return an object to the pool for reuse */
  release(obj: T): void;
  /** Pre-allocate objects into the pool */
  grow(count: number): void;
  /** Number of objects currently available in the pool */
  readonly available: number;
  /** Total objects ever created by this pool */
  readonly totalCreated: number;
  /** Drain the pool (free all pre-allocated objects) */
  drain(): void;
}

export interface PoolOptions {
  /** Initial pool size (default: 64) */
  initialSize?: number;
  /** Maximum pool size — objects beyond this are discarded on release (default: 1024) */
  maxSize?: number;
}

/**
 * Create an object pool.
 *
 * @param factory - Creates a new object instance
 * @param reset - Resets an object to its initial state before reuse
 */
export function createPool<T>(
  factory: () => T,
  reset: (obj: T) => void,
  options: PoolOptions = {},
): Pool<T> {
  const { initialSize = 64, maxSize = 1024 } = options;

  const pool: T[] = [];
  let totalCreated = 0;

  // Pre-allocate initial pool
  for (let i = 0; i < initialSize; i++) {
    pool.push(factory());
    totalCreated++;
  }

  return {
    acquire(): T {
      if (pool.length > 0) {
        return pool.pop()!;
      }
      totalCreated++;
      return factory();
    },

    release(obj: T): void {
      if (pool.length < maxSize) {
        reset(obj);
        pool.push(obj);
      }
      // Beyond maxSize, let GC collect it
    },

    grow(count: number): void {
      const toCreate = Math.min(count, maxSize - pool.length);
      for (let i = 0; i < toCreate; i++) {
        pool.push(factory());
        totalCreated++;
      }
    },

    get available(): number {
      return pool.length;
    },

    get totalCreated(): number {
      return totalCreated;
    },

    drain(): void {
      pool.length = 0;
    },
  };
}

// =============================================================================
// VNode Pool
// =============================================================================

import type { VNode, VNodeType } from '../utils/types.js';

const EMPTY_CHILDREN: VNode[] = [];
const EMPTY_PROPS: Record<string, any> = {};

/** Pool for VNode objects — avoids allocating new objects on every render */
export const vnodePool = createPool<VNode>(
  () => ({ type: 'box', props: {}, children: [], key: undefined }),
  (node) => {
    node.type = 'box';
    node.props = EMPTY_PROPS;
    node.children = EMPTY_CHILDREN;
    node.key = undefined;
  },
  { initialSize: 128, maxSize: 2048 },
);

/** Acquire a VNode from the pool with the given properties */
export function acquireVNode(
  type: VNodeType,
  props: Record<string, any>,
  children: VNode[],
  key?: string | number,
): VNode {
  const node = vnodePool.acquire();
  node.type = type;
  node.props = props;
  node.children = children;
  node.key = key;
  return node;
}

/** Release a VNode tree back to the pool (recursive) */
export function releaseVNodeTree(node: VNode): void {
  // Release children first (depth-first)
  if (node.children && node.children.length > 0) {
    for (const child of node.children) {
      releaseVNodeTree(child);
    }
  }
  vnodePool.release(node);
}

// =============================================================================
// LayoutNode Pool
// =============================================================================

import type { LayoutNode } from '../utils/types.js';

const EMPTY_VNODE: VNode = { type: 'box', props: {}, children: [] };

/** Pool for LayoutNode objects */
export const layoutNodePool = createPool<LayoutNode>(
  () => ({ x: 0, y: 0, width: 0, height: 0, node: EMPTY_VNODE, children: [] }),
  (ln) => {
    ln.x = 0;
    ln.y = 0;
    ln.width = 0;
    ln.height = 0;
    ln.node = EMPTY_VNODE;
    ln.children = [];
  },
  { initialSize: 128, maxSize: 2048 },
);

/** Acquire a LayoutNode from the pool */
export function acquireLayoutNode(
  x: number,
  y: number,
  width: number,
  height: number,
  node: VNode,
  children: LayoutNode[],
): LayoutNode {
  const ln = layoutNodePool.acquire();
  ln.x = x;
  ln.y = y;
  ln.width = width;
  ln.height = height;
  ln.node = node;
  ln.children = children;
  return ln;
}

/** Release a LayoutNode tree back to the pool (recursive) */
export function releaseLayoutNodeTree(ln: LayoutNode): void {
  if (ln.children && ln.children.length > 0) {
    for (const child of ln.children) {
      releaseLayoutNodeTree(child);
    }
  }
  layoutNodePool.release(ln);
}
