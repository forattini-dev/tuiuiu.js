/**
 * Dirty Flag System
 *
 * Tracks which VNodes have changed and need re-rendering.
 * Inspired by blessed's dirty tracking for optimal render performance.
 *
 * Features:
 * - Mark individual nodes as dirty
 * - Propagate dirty state to ancestors
 * - Skip re-rendering of clean subtrees
 * - Content caching with invalidation
 * - Automatic dirty tracking for signal changes
 */

import type { VNode, LayoutNode } from '../utils/types.js';

// =============================================================================
// Types
// =============================================================================

/** Cache entry for rendered content */
export interface RenderCacheEntry {
  /** The rendered output string */
  output: string;
  /** Width used for rendering */
  width: number;
  /** Height of the output */
  height: number;
  /** Hash of the VNode props and children */
  hash: string;
  /** Timestamp for LRU eviction */
  lastAccess: number;
}

/** Dirty state for a VNode */
export interface DirtyState {
  /** Whether this node needs re-rendering */
  dirty: boolean;
  /** Whether any descendant is dirty */
  childrenDirty: boolean;
  /** Version counter (increments on each change) */
  version: number;
}

// =============================================================================
// Dirty Tracking Registry
// =============================================================================

/**
 * Registry for tracking dirty state across VNodes
 */
class DirtyRegistry {
  private states: WeakMap<VNode, DirtyState> = new WeakMap();
  private renderCache: Map<string, RenderCacheEntry> = new Map();
  private maxCacheSize = 1000;
  private globalVersion = 0;
  private isDirty = true; // Start dirty for initial render

  /**
   * Get or create dirty state for a node
   */
  getState(node: VNode): DirtyState {
    let state = this.states.get(node);
    if (!state) {
      state = { dirty: true, childrenDirty: false, version: 0 };
      this.states.set(node, state);
    }
    return state;
  }

  /**
   * Mark a node as dirty (needs re-rendering)
   */
  markDirty(node: VNode): void {
    const state = this.getState(node);
    if (!state.dirty) {
      state.dirty = true;
      state.version++;
      this.isDirty = true;
      this.globalVersion++;
    }
  }

  /**
   * Mark a node as clean (just rendered)
   */
  markClean(node: VNode): void {
    const state = this.getState(node);
    state.dirty = false;
    state.childrenDirty = false;
  }

  /**
   * Mark children as dirty (propagates up)
   */
  markChildrenDirty(node: VNode): void {
    const state = this.getState(node);
    if (!state.childrenDirty) {
      state.childrenDirty = true;
      this.isDirty = true;
    }
  }

  /**
   * Check if a node is dirty
   */
  isDirtyNode(node: VNode): boolean {
    const state = this.states.get(node);
    return state ? state.dirty : true; // Unknown nodes are dirty
  }

  /**
   * Check if a node or any children are dirty
   */
  needsRender(node: VNode): boolean {
    const state = this.states.get(node);
    if (!state) return true;
    return state.dirty || state.childrenDirty;
  }

  /**
   * Check if anything needs rendering
   */
  hasChanges(): boolean {
    return this.isDirty;
  }

  /**
   * Clear global dirty flag (after render)
   */
  clearGlobalDirty(): void {
    this.isDirty = false;
  }

  /**
   * Get the global version (increments on any change)
   */
  getGlobalVersion(): number {
    return this.globalVersion;
  }

  // ===========================================================================
  // Render Cache
  // ===========================================================================

  /**
   * Generate a hash for a VNode (for cache key)
   */
  hashNode(node: VNode): string {
    const props = { ...node.props };
    // Remove function props from hash
    for (const key in props) {
      if (typeof props[key] === 'function') {
        delete props[key];
      }
    }

    // Include children in hash
    const childrenStr = JSON.stringify(node.children?.map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return child;
      }
      if (child && typeof child === 'object' && 'type' in child) {
        return { type: (child as VNode).type, key: (child as VNode).props?.key };
      }
      return null;
    }) ?? []);

    return `${node.type}:${JSON.stringify(props)}:${childrenStr}`;
  }

  /**
   * Get cached render output for a node
   */
  getCachedRender(node: VNode, width: number): RenderCacheEntry | undefined {
    const hash = this.hashNode(node);
    const key = `${hash}:${width}`;
    const entry = this.renderCache.get(key);

    if (entry) {
      entry.lastAccess = Date.now();
      return entry;
    }

    return undefined;
  }

  /**
   * Store render output in cache
   */
  setCachedRender(node: VNode, width: number, output: string, height: number): void {
    const hash = this.hashNode(node);
    const key = `${hash}:${width}`;

    // Evict old entries if cache is too large
    if (this.renderCache.size >= this.maxCacheSize) {
      this.evictOldest();
    }

    this.renderCache.set(key, {
      output,
      width,
      height,
      hash,
      lastAccess: Date.now(),
    });
  }

  /**
   * Evict oldest cache entries
   */
  private evictOldest(): void {
    const entries = [...this.renderCache.entries()];
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    // Remove oldest 20%
    const toRemove = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.renderCache.delete(entries[i][0]);
    }
  }

  /**
   * Invalidate cache for a node
   */
  invalidateCache(node: VNode): void {
    const hash = this.hashNode(node);
    // Remove all entries with this hash (any width)
    for (const key of this.renderCache.keys()) {
      if (key.startsWith(hash)) {
        this.renderCache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.renderCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.renderCache.size,
      maxSize: this.maxCacheSize,
    };
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.states = new WeakMap();
    this.renderCache.clear();
    this.globalVersion = 0;
    this.isDirty = true;
  }
}

// =============================================================================
// Singleton Instance
// =============================================================================

let registryInstance: DirtyRegistry | null = null;

/**
 * Get the global dirty registry
 */
export function getDirtyRegistry(): DirtyRegistry {
  if (!registryInstance) {
    registryInstance = new DirtyRegistry();
  }
  return registryInstance;
}

/**
 * Reset the registry (for testing)
 */
export function resetDirtyRegistry(): void {
  registryInstance = null;
}

// =============================================================================
// Convenience Functions
// =============================================================================

/**
 * Mark a node as dirty
 */
export function markDirty(node: VNode): void {
  getDirtyRegistry().markDirty(node);
}

/**
 * Mark a node as clean
 */
export function markClean(node: VNode): void {
  getDirtyRegistry().markClean(node);
}

/**
 * Check if a node needs rendering
 */
export function needsRender(node: VNode): boolean {
  return getDirtyRegistry().needsRender(node);
}

/**
 * Check if anything has changed
 */
export function hasChanges(): boolean {
  return getDirtyRegistry().hasChanges();
}

/**
 * Clear the global dirty flag
 */
export function clearChanges(): void {
  getDirtyRegistry().clearGlobalDirty();
}

/**
 * Get cached render output
 */
export function getCachedRender(node: VNode, width: number): RenderCacheEntry | undefined {
  return getDirtyRegistry().getCachedRender(node, width);
}

/**
 * Store render output in cache
 */
export function setCachedRender(node: VNode, width: number, output: string, height: number): void {
  getDirtyRegistry().setCachedRender(node, width, output, height);
}

/**
 * Invalidate cache for a node
 */
export function invalidateCache(node: VNode): void {
  getDirtyRegistry().invalidateCache(node);
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  getDirtyRegistry().clearCache();
}

// =============================================================================
// Layout Tree Dirty Tracking
// =============================================================================

/**
 * Walk a layout tree and mark dirty nodes
 * Returns true if any node in the subtree is dirty
 */
export function markLayoutTreeDirty(layout: LayoutNode): boolean {
  const registry = getDirtyRegistry();
  let anyDirty = registry.isDirtyNode(layout.node);

  // Check children
  for (const child of layout.children) {
    if (markLayoutTreeDirty(child)) {
      anyDirty = true;
    }
  }

  // Mark children dirty if any descendant is dirty
  if (anyDirty) {
    registry.markChildrenDirty(layout.node);
  }

  return anyDirty;
}

/**
 * Clean all nodes in a layout tree after render
 */
export function cleanLayoutTree(layout: LayoutNode): void {
  const registry = getDirtyRegistry();
  registry.markClean(layout.node);

  for (const child of layout.children) {
    cleanLayoutTree(child);
  }
}

// =============================================================================
// Signal Integration
// =============================================================================

/**
 * Create a dirty-tracking wrapper for a component
 *
 * Automatically marks the component dirty when its render function
 * is called (typically triggered by signal changes)
 */
export function withDirtyTracking<T extends VNode>(
  render: () => T,
  nodeRef: { current: T | null }
): () => T {
  return () => {
    const result = render();

    // Mark the previous node as dirty if exists
    if (nodeRef.current) {
      markDirty(nodeRef.current);
    }

    nodeRef.current = result;
    return result;
  };
}
