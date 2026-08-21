/**
 * Tests for ListItem component.
 */

import { describe, expect, it } from 'vitest';
import type { VNode } from '../../src/utils/types.js';
import { createSignal } from '../../src/primitives/signal.js';
import { getTheme } from '../../src/core/theme.js';
import { ListItem as OwnedListItem } from '../../src/atoms/list-item.js';
import { testComponent } from '../../src/testing/component.js';

const ListItem = testComponent(OwnedListItem);

function collectText(node: VNode): string[] {
  if (node.type === 'text') {
    return [String(node.props.children ?? '')];
  }

  return node.children.flatMap((child) => collectText(child as VNode));
}

function getContentColumn(node: VNode): VNode {
  return node.children.find(
    (child) => (child as VNode).type === 'box' && ((child as VNode).props?.flexDirection === 'column')
  ) as VNode;
}

describe('ListItem', () => {
  it('renders icon, primary, secondary, and trailing content', () => {
    const node = ListItem({
      icon: '[F]',
      primary: 'document.pdf',
      secondary: '2.5 MB',
      trailing: 'recent',
    });

    expect(node.type).toBe('box');
    expect(node.props.flexDirection).toBe('row');
    expect(collectText(node)).toEqual(['[F]', 'document.pdf', '2.5 MB', 'recent']);
  });

  it('applies selected styling from the active theme', () => {
    const theme = getTheme();

    const node = ListItem({
      primary: 'Selected item',
      selected: true,
    });

    expect(node.props.backgroundColor).toBe(theme.states.selected.bg);
  });

  it('supports reactive selected state and disabled colors', () => {
    const theme = getTheme();
    const [selected, setSelected] = createSignal(false);

    const initial = ListItem({
      primary: 'Job',
      secondary: 'disabled',
      selected,
      disabled: true,
    });

    setSelected(true);

    const updated = ListItem({
      primary: 'Job',
      secondary: 'disabled',
      selected,
      disabled: true,
    });

    const initialPrimary = (getContentColumn(initial).children[0]) as VNode;
    const updatedPrimary = (getContentColumn(updated).children[0]) as VNode;

    expect(initialPrimary.props.color).toBe(theme.states.disabled.fg);
    expect(updatedPrimary.props.color).toBe(theme.states.disabled.fg);
    expect(updated.props.backgroundColor).toBe(theme.states.selected.bg);
  });
});
