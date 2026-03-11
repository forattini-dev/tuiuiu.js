import { beforeEach, describe, expect, it } from 'vitest';

import { Box, Text } from '../../src/primitives/nodes.js';
import { calculateLayout, clearTextMeasureCache } from '../../src/core/layout.js';
import { createFrameSnapshot, resetFrameSequenceForTesting } from '../../src/core/frame.js';
import {
  DirtyFlags,
  beginDirtyFrame,
  canReuseSubtree,
  cleanLayoutTree,
  getDirtyDiagnostics,
  markDirty,
  registerDirtyNode,
  resetDirtyRegistry,
} from '../../src/core/dirty.js';

describe('conservative subtree invalidation', () => {
  beforeEach(() => {
    resetDirtyRegistry();
    resetFrameSequenceForTesting();
    clearTextMeasureCache();
  });

  it('skips stable sibling subtrees when one branch changes', () => {
    const stableSidebar = Box(
      { id: 'sidebar', width: 12, borderStyle: 'single', padding: 1 },
      Text({}, 'stable sidebar'),
    );

    const first = createFrameSnapshot(
      Box(
        { width: 40, flexDirection: 'row', gap: 1 },
        stableSidebar,
        Box({ id: 'content', flexGrow: 1 }, Text({}, 'tick 1')),
      ),
      { width: 40, height: 12 },
    );
    const second = createFrameSnapshot(
      Box(
        { width: 40, flexDirection: 'row', gap: 1 },
        stableSidebar,
        Box({ id: 'content', flexGrow: 1 }, Text({}, 'tick 2')),
      ),
      { width: 40, height: 12 },
    );

    expect(second.metrics.structural.layoutReuseCount).toBeGreaterThan(0);
    expect(second.metrics.structural.drawReuseCount).toBeGreaterThan(0);
  });

  it('fixed-dimension parent absorbs child layout dirty without escalating to grandparent', () => {
    const child = Text({}, 'child');
    const fixedPanel = Box({ width: 12, height: 4 }, child);
    const root = Box({ flexDirection: 'column' }, fixedPanel);

    const layout = calculateLayout(root, 40, 20);
    cleanLayoutTree(layout);

    markDirty(child, DirtyFlags.LAYOUT);

    expect(canReuseSubtree(child)).toBe(false);
    expect(canReuseSubtree(fixedPanel)).toBe(false);
    expect(canReuseSubtree(root)).toBe(true);
    expect(getDirtyDiagnostics().absorbedLayoutDirtyCount).toBeGreaterThan(0);
  });

  it('FORCE_FULL invalidation disables subtree reuse for the whole frame', () => {
    const root = Box({ width: 20 }, Text({}, 'a'));
    const layout = calculateLayout(root, 20, 5);
    cleanLayoutTree(layout);

    markDirty(root, DirtyFlags.FORCE_FULL);

    expect(canReuseSubtree(root)).toBe(false);
    expect(getDirtyDiagnostics().forceFullCount).toBe(1);
  });

  it('ambiguous ownership escalates to a safe full-frame fallback', () => {
    const root = Box({ width: 20 }, Text({}, 'root'));
    const orphan = Text({}, 'orphan');

    beginDirtyFrame(root);
    registerDirtyNode(root, null);
    markDirty(orphan, DirtyFlags.CONTENT);

    expect(canReuseSubtree(root)).toBe(false);
    expect(getDirtyDiagnostics().invalidationEscalationCount).toBe(1);
  });
});
