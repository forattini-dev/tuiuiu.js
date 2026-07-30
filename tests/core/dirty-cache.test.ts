import { beforeEach, describe, expect, it } from 'vitest';

import { Box, Text } from '../../src/primitives/nodes.js';
import type { LayoutNode, VNode } from '../../src/utils/types.js';
import {
  DirtyFlags,
  beginDirtyFrame,
  canReuseSubtree,
  cleanLayoutTree,
  clearAllCaches,
  clearChanges,
  getCachedRender,
  getDirtyDiagnostics,
  getDirtyRegistry,
  hasChanges,
  invalidateCache,
  markDirty,
  markLayoutTreeDirty,
  needsRender,
  noteDirtyFresh,
  noteDirtyReuse,
  registerDirtyNode,
  resetDirtyRegistry,
  setCachedRender,
  withDirtyTracking,
} from '../../src/core/dirty.js';

function layout(node: VNode, children: LayoutNode[] = []): LayoutNode {
  return {
    x: 0,
    y: 0,
    width: 10,
    height: 2,
    node,
    children,
  };
}

describe('dirty registry cache and diagnostics', () => {
  beforeEach(() => {
    resetDirtyRegistry();
  });

  it('keys render cache by the complete VNode structure and width', () => {
    const first = Box({ id: 'row' }, Text({}, 'first'));
    const changedChild = Box({ id: 'row' }, Text({}, 'second'));

    setCachedRender(first, 20, 'cached-first', 2);

    expect(getCachedRender(first, 20)).toMatchObject({
      output: 'cached-first',
      width: 20,
      height: 2,
    });
    expect(getCachedRender(first, 21)).toBeUndefined();
    expect(getCachedRender(changedChild, 20)).toBeUndefined();
  });

  it('distinguishes top-level VNode keys and invalidates only matching entries', () => {
    const first: VNode = {
      type: 'box',
      key: 'first',
      props: {},
      children: [],
    };
    const second: VNode = {
      type: 'box',
      key: 'second',
      props: {},
      children: [],
    };

    setCachedRender(first, 10, 'first', 1);
    setCachedRender(second, 10, 'second', 1);
    invalidateCache(first);

    expect(getCachedRender(first, 10)).toBeUndefined();
    expect(getCachedRender(second, 10)?.output).toBe('second');

    clearAllCaches();
    expect(getDirtyRegistry().getCacheStats().size).toBe(0);
  });

  it('propagates layout dirtiness through layout trees and cleans recursively', () => {
    const child = Text({}, 'child');
    const root = Box({ width: 10 }, child);
    const tree = layout(root, [layout(child)]);

    beginDirtyFrame(root);
    registerDirtyNode(root, null);
    registerDirtyNode(child, root);
    cleanLayoutTree(tree);
    clearChanges();

    expect(hasChanges()).toBe(false);
    markDirty(child, DirtyFlags.CONTENT);
    expect(markLayoutTreeDirty(tree)).toBe(true);
    expect(needsRender(root)).toBe(true);
    expect(canReuseSubtree(root)).toBe(false);

    cleanLayoutTree(tree);
    clearChanges();
    expect(needsRender(root)).toBe(false);
    expect(needsRender(child)).toBe(false);
  });

  it('records fresh/reuse diagnostics independently for layout and draw', () => {
    noteDirtyReuse('layout');
    noteDirtyReuse('draw');
    noteDirtyFresh('layout');
    noteDirtyFresh('draw');

    expect(getDirtyDiagnostics()).toMatchObject({
      layoutReuseCount: 1,
      drawReuseCount: 1,
      layoutFreshCount: 1,
      drawFreshCount: 1,
    });
  });

  it('forces a full invalidation when a tracked render replaces its prior node', () => {
    const previous = Box({ width: 10 }, Text({}, 'old'));
    const nodeRef = { current: previous };
    const render = withDirtyTracking(
      () => Box({ width: 10 }, Text({}, 'new')),
      nodeRef,
    );

    beginDirtyFrame(previous);
    registerDirtyNode(previous, null);
    render();

    expect(nodeRef.current).not.toBe(previous);
    expect(getDirtyDiagnostics().forceFullCount).toBe(1);
    expect(canReuseSubtree(previous)).toBe(false);
  });
});
