/**
 * AppendList tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { AppendList } from '../../src/primitives/append-list.js';
import { Text } from '../../src/primitives/nodes.js';

describe('AppendList', () => {
  beforeEach(() => {
    resetHookState();
  });

  afterEach(() => {
    resetHookState();
  });

  it('renders append-only updates as static output', () => {
    beginRender();
    const first = AppendList({
      items: ['a', 'b'],
      children: (item) => Text({}, item),
    });
    endRender();

    expect((first.props as any).__static).toBe(true);

    beginRender();
    const second = AppendList({
      items: ['a', 'b', 'c'],
      children: (item) => Text({}, item),
    });
    endRender();

    expect((second.props as any).__static).toBe(true);
  });

  it('falls back to normal rendering when items reorder', () => {
    beginRender();
    AppendList({
      items: ['a', 'b'],
      children: (item) => Text({}, item),
    });
    endRender();

    beginRender();
    const fallback = AppendList({
      items: ['b', 'a'],
      children: (item) => Text({}, item),
    });
    endRender();

    expect((fallback.props as any).__static).not.toBe(true);
    expect(fallback.children.length).toBe(2);
  });

  it('uses absolute indices so duplicate values do not collide', () => {
    beginRender();
    const first = AppendList({
      items: ['same', 'same'],
      children: (item, index) => Text({}, `${index}:${item}`),
    });
    endRender();

    beginRender();
    const second = AppendList({
      items: ['same', 'same', 'same'],
      children: (item, index) => Text({}, `${index}:${item}`),
    });
    endRender();

    expect(first.children.map(node => node.props.children)).toEqual([
      '0:same',
      '1:same',
    ]);
    expect(second.children.map(node => node.props.children)).toEqual([
      '2:same',
    ]);
    expect(first.props.__staticId).not.toBe(second.props.__staticId);
  });

  it('rejects duplicate explicit keys in one appended batch', () => {
    beginRender();
    expect(() => AppendList({
      items: [{ id: 1 }, { id: 1 }],
      getKey: item => item.id,
      children: item => Text({}, String(item.id)),
    })).toThrow(/unique/);
    endRender();
  });
});
