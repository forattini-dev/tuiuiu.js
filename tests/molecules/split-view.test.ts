/**
 * Tests for SplitView state and component.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import type { VNode } from '../../src/utils/types.js';
import { Text } from '../../src/primitives/nodes.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { resetTestInteractions, dispatchTestKey } from '../../src/testing/interaction.js';
import { createSplitView, SplitView } from '../../src/molecules/split-view.js';
import { createKey } from '../helpers/keyboard.js';

describe('createSplitView', () => {
  it('handles selection and bounds', () => {
    const view = createSplitView({ items: ['a', 'b', 'c'], initialIndex: 1, keysEnabled: false });

    expect(view.selectedIndex()).toBe(1);
    expect(view.selectedItem()).toBe('b');

    view.select(2);
    expect(view.selectedItem()).toBe('c');

    view.select(99);
    expect(view.selectedItem()).toBe('c');

    view.selectNext();
    expect(view.selectedItem()).toBe('a');

    view.selectPrevious();
    expect(view.selectedItem()).toBe('c');

    view.clearSelection();
    expect(view.selectedIndex()).toBe(null);
  });

  it('skips navigation on empty lists', () => {
    const view = createSplitView({ items: [], keysEnabled: false });
    view.selectNext();
    view.selectPrevious();
    expect(view.selectedIndex()).toBe(null);
  });

  it('handles keyboard input when enabled', () => {
    resetHookState();
    resetTestInteractions();

    beginRender();
    const view = createSplitView({ items: ['x', 'y'], keysEnabled: true });
    endRender();

    dispatchTestKey('j', createKey());
    expect(view.selectedIndex()).toBe(0);

    dispatchTestKey('k', createKey());
    expect(view.selectedIndex()).toBe(1);

    dispatchTestKey('', createKey({ escape: true }));
    expect(view.selectedIndex()).toBe(null);
  });

  it('ignores input when inactive', () => {
    resetHookState();
    resetTestInteractions();

    beginRender();
    const view = createSplitView({ items: ['x', 'y'], keysEnabled: true, isActive: false });
    endRender();

    dispatchTestKey('j', createKey());
    expect(view.selectedIndex()).toBe(null);
  });
});

describe('SplitView component', () => {
  afterEach(() => {
    resetHookState();
    resetTestInteractions();
  });

  it('renders horizontal layout with divider', () => {
    const node = SplitView({
      items: ['a', 'b'],
      renderItem: (item, _idx, selected) => Text({ bold: selected }, item),
      renderDetail: (item) => Text({}, item ?? 'none'),
      selectedIndex: 1,
      keysEnabled: false,
    });

    expect(node.type).toBe('box');
    expect(node.props.flexDirection).toBe('row');
    expect(node.props.gap).toBe(0);
  });

  it('renders vertical layout without divider and custom empty detail', () => {
    const node = SplitView({
      items: ['a', 'b'],
      renderItem: (item, _idx, selected) => Text({ bold: selected }, item),
      renderDetail: (item) => Text({}, item ?? 'none'),
      selectedIndex: null,
      emptyDetail: Text({ color: 'muted' }, 'empty'),
      direction: 'vertical',
      divider: false,
      gap: 2,
      listWidth: 10,
      keysEnabled: false,
    });

    expect(node.type).toBe('box');
    expect(node.props.flexDirection).toBe('column');
    expect(node.props.gap).toBe(2);

    const children = node.children as VNode[];
    const detailPanel = children[children.length - 1] as VNode;
    const detailText = detailPanel.children?.[0] as VNode;
    expect(detailText.props.children).toBe('empty');
  });
});
