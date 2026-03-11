/**
 * Dirty Flag System
 *
 * Conservative subtree invalidation with safe escalation rules.
 */

import type { VNode, LayoutNode, BoxStyle } from '../utils/types.js';
import { fingerprintValue } from './structural-fingerprint.js';

export const enum DirtyFlags {
  NONE = 0,
  CONTENT = 1 << 0,
  LAYOUT = 1 << 1,
  STYLE = 1 << 2,
  CHILDREN = 1 << 3,
  FORCE_FULL = 1 << 4,
}

export interface RenderCacheEntry {
  output: string;
  width: number;
  height: number;
  hash: string;
  lastAccess: number;
}

export interface DirtyState {
  dirty: boolean;
  childrenDirty: boolean;
  version: number;
  flags: DirtyFlags;
  subtreeFlags: DirtyFlags;
}

export interface DirtyDiagnostics {
  layoutReuseCount: number;
  layoutFreshCount: number;
  drawReuseCount: number;
  drawFreshCount: number;
  invalidationEscalationCount: number;
  absorbedLayoutDirtyCount: number;
  forceFullCount: number;
}

export type DirtyPhase = 'layout' | 'draw';

function createEmptyDiagnostics(): DirtyDiagnostics {
  return {
    layoutReuseCount: 0,
    layoutFreshCount: 0,
    drawReuseCount: 0,
    drawFreshCount: 0,
    invalidationEscalationCount: 0,
    absorbedLayoutDirtyCount: 0,
    forceFullCount: 0,
  };
}

function isFixedDimensionParent(node: VNode): boolean {
  const style = node.props as BoxStyle;
  const hasFixedWidth =
    typeof style.width === 'number' &&
    style.width > 0 &&
    style.width !== Infinity;
  const hasFixedHeight =
    typeof style.height === 'number' &&
    style.height > 0 &&
    style.height !== Infinity;

  if (!hasFixedWidth || !hasFixedHeight) {
    return false;
  }

  if ((style.flexGrow ?? 0) > 0 || style.width === 'fill' || style.height === 'fill') {
    return false;
  }

  return true;
}

class DirtyRegistry {
  private states: WeakMap<VNode, DirtyState> = new WeakMap();
  private parents: WeakMap<VNode, VNode | null> = new WeakMap();
  private renderCache: Map<string, RenderCacheEntry> = new Map();
  private maxCacheSize = 1000;
  private globalVersion = 0;
  private isDirty = true;
  private rootNode: VNode | null = null;
  private forceFullFrame = false;
  private diagnostics: DirtyDiagnostics = createEmptyDiagnostics();

  getState(node: VNode): DirtyState {
    let state = this.states.get(node);
    if (!state) {
      state = {
        dirty: true,
        childrenDirty: false,
        version: 0,
        flags: DirtyFlags.NONE,
        subtreeFlags: DirtyFlags.NONE,
      };
      this.states.set(node, state);
    }
    return state;
  }

  beginFrame(rootNode: VNode): void {
    this.rootNode = rootNode;
    this.forceFullFrame = false;
    this.diagnostics = createEmptyDiagnostics();
  }

  registerNode(node: VNode, parent: VNode | null): void {
    this.parents.set(node, parent);
    this.getState(node);
  }

  private bubbleDirtyFlags(node: VNode, flags: DirtyFlags): void {
    let parent = this.parents.get(node) ?? null;
    let pendingFlags = flags;
    let parentFound = false;

    while (parent) {
      parentFound = true;
      const parentState = this.getState(parent);
      parentState.childrenDirty = true;
      parentState.subtreeFlags |= pendingFlags;

      if ((pendingFlags & DirtyFlags.LAYOUT) !== 0 && isFixedDimensionParent(parent)) {
        this.diagnostics.absorbedLayoutDirtyCount++;
        break;
      }

      parent = this.parents.get(parent) ?? null;
    }

    if (!parentFound && this.rootNode && node !== this.rootNode) {
      this.diagnostics.invalidationEscalationCount++;
      this.forceFullFrame = true;
    }
  }

  markDirty(node: VNode, flags: DirtyFlags = DirtyFlags.CONTENT): void {
    const state = this.getState(node);

    state.dirty = true;
    state.flags |= flags;
    state.version++;
    this.isDirty = true;
    this.globalVersion++;

    if ((flags & DirtyFlags.FORCE_FULL) !== 0) {
      this.forceFullFrame = true;
      this.diagnostics.forceFullCount++;
    }

    this.bubbleDirtyFlags(node, flags);
  }

  markClean(node: VNode): void {
    const state = this.getState(node);
    state.dirty = false;
    state.childrenDirty = false;
    state.flags = DirtyFlags.NONE;
    state.subtreeFlags = DirtyFlags.NONE;
  }

  markLayoutClean(node: VNode): void {
    const state = this.getState(node);
    state.dirty = false;
    state.childrenDirty = false;
    state.flags &= ~(DirtyFlags.LAYOUT | DirtyFlags.CHILDREN | DirtyFlags.FORCE_FULL);
    state.subtreeFlags &= ~(DirtyFlags.LAYOUT | DirtyFlags.CHILDREN | DirtyFlags.FORCE_FULL);
  }

  markChildrenDirty(node: VNode, flags: DirtyFlags = DirtyFlags.CHILDREN): void {
    const state = this.getState(node);
    state.childrenDirty = true;
    state.subtreeFlags |= flags;
    this.isDirty = true;
  }

  isDirtyNode(node: VNode): boolean {
    const state = this.states.get(node);
    return state ? state.dirty : true;
  }

  needsRender(node: VNode): boolean {
    const state = this.states.get(node);
    if (!state) return true;
    return state.dirty || state.childrenDirty || state.flags !== DirtyFlags.NONE || state.subtreeFlags !== DirtyFlags.NONE;
  }

  canReuseSubtree(node: VNode): boolean {
    if (this.forceFullFrame) {
      return false;
    }

    const state = this.states.get(node);
    if (!state) {
      return true;
    }

    return (
      !state.dirty &&
      !state.childrenDirty &&
      state.flags === DirtyFlags.NONE &&
      state.subtreeFlags === DirtyFlags.NONE
    );
  }

  hasChanges(): boolean {
    return this.isDirty || this.forceFullFrame;
  }

  clearGlobalDirty(): void {
    this.isDirty = false;
    this.forceFullFrame = false;
  }

  getGlobalVersion(): number {
    return this.globalVersion;
  }

  getDiagnostics(): DirtyDiagnostics {
    return { ...this.diagnostics };
  }

  noteReuse(phase: DirtyPhase): void {
    if (phase === 'layout') {
      this.diagnostics.layoutReuseCount++;
      return;
    }

    this.diagnostics.drawReuseCount++;
  }

  noteFresh(phase: DirtyPhase): void {
    if (phase === 'layout') {
      this.diagnostics.layoutFreshCount++;
      return;
    }

    this.diagnostics.drawFreshCount++;
  }

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

  setCachedRender(node: VNode, width: number, output: string, height: number): void {
    const hash = this.hashNode(node);
    const key = `${hash}:${width}`;

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

  hashNode(node: VNode): string {
    const propsHash = fingerprintValue(node.props ?? {});
    const childrenHash = fingerprintValue(
      node.children?.map((child) => {
        if (typeof child === 'string' || typeof child === 'number') {
          return child;
        }
        if (child && typeof child === 'object' && 'type' in child) {
          return { type: (child as VNode).type, key: (child as VNode).props?.key };
        }
        return null;
      }) ?? [],
    );

    return `${node.type}:${propsHash}:${childrenHash}`;
  }

  private evictOldest(): void {
    const entries = [...this.renderCache.entries()];
    entries.sort((a, b) => a[1].lastAccess - b[1].lastAccess);

    const toRemove = Math.ceil(entries.length * 0.2);
    for (let index = 0; index < toRemove; index++) {
      this.renderCache.delete(entries[index]![0]);
    }
  }

  invalidateCache(node: VNode): void {
    const hash = this.hashNode(node);
    for (const key of this.renderCache.keys()) {
      if (key.startsWith(hash)) {
        this.renderCache.delete(key);
      }
    }
  }

  clearCache(): void {
    this.renderCache.clear();
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.renderCache.size,
      maxSize: this.maxCacheSize,
    };
  }

  reset(): void {
    this.states = new WeakMap();
    this.parents = new WeakMap();
    this.renderCache.clear();
    this.globalVersion = 0;
    this.isDirty = true;
    this.rootNode = null;
    this.forceFullFrame = false;
    this.diagnostics = createEmptyDiagnostics();
  }
}

let registryInstance: DirtyRegistry | null = null;

export function getDirtyRegistry(): DirtyRegistry {
  if (!registryInstance) {
    registryInstance = new DirtyRegistry();
  }
  return registryInstance;
}

export function resetDirtyRegistry(): void {
  registryInstance = null;
}

export function beginDirtyFrame(rootNode: VNode): void {
  getDirtyRegistry().beginFrame(rootNode);
}

export function registerDirtyNode(node: VNode, parent: VNode | null): void {
  getDirtyRegistry().registerNode(node, parent);
}

export function markDirty(node: VNode, flags: DirtyFlags = DirtyFlags.CONTENT): void {
  getDirtyRegistry().markDirty(node, flags);
}

export function markClean(node: VNode): void {
  getDirtyRegistry().markClean(node);
}

export function markLayoutClean(node: VNode): void {
  getDirtyRegistry().markLayoutClean(node);
}

export function noteDirtyReuse(phase: DirtyPhase): void {
  getDirtyRegistry().noteReuse(phase);
}

export function noteDirtyFresh(phase: DirtyPhase): void {
  getDirtyRegistry().noteFresh(phase);
}

export function canReuseSubtree(node: VNode): boolean {
  return getDirtyRegistry().canReuseSubtree(node);
}

export function getDirtyDiagnostics(): DirtyDiagnostics {
  return getDirtyRegistry().getDiagnostics();
}

export function needsRender(node: VNode): boolean {
  return getDirtyRegistry().needsRender(node);
}

export function hasChanges(): boolean {
  return getDirtyRegistry().hasChanges();
}

export function clearChanges(): void {
  getDirtyRegistry().clearGlobalDirty();
}

export function getCachedRender(node: VNode, width: number): RenderCacheEntry | undefined {
  return getDirtyRegistry().getCachedRender(node, width);
}

export function setCachedRender(node: VNode, width: number, output: string, height: number): void {
  getDirtyRegistry().setCachedRender(node, width, output, height);
}

export function invalidateCache(node: VNode): void {
  getDirtyRegistry().invalidateCache(node);
}

export function clearAllCaches(): void {
  getDirtyRegistry().clearCache();
}

export function markLayoutTreeDirty(layout: LayoutNode): boolean {
  const registry = getDirtyRegistry();
  let anyDirty = registry.isDirtyNode(layout.node);

  for (const child of layout.children) {
    if (markLayoutTreeDirty(child)) {
      anyDirty = true;
    }
  }

  if (anyDirty) {
    registry.markChildrenDirty(layout.node);
  }

  return anyDirty;
}

export function cleanLayoutTree(layout: LayoutNode): void {
  const registry = getDirtyRegistry();
  registry.markClean(layout.node);

  for (const child of layout.children) {
    cleanLayoutTree(child);
  }
}

export function withDirtyTracking<T extends VNode>(
  render: () => T,
  nodeRef: { current: T | null },
): () => T {
  return () => {
    const result = render();

    if (nodeRef.current) {
      markDirty(nodeRef.current, DirtyFlags.FORCE_FULL);
    }

    nodeRef.current = result;
    return result;
  };
}
