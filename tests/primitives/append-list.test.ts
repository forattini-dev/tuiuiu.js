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
});
