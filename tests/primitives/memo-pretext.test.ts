import { describe, it, expect, vi } from 'vitest';
import {
  Memo,
  PreText,
  isMemoVNode,
  refreshMemoVNode,
  type MemoVNode,
} from '../../src/primitives/computed-node.js';
import { Box, Text } from '../../src/primitives/nodes.js';

// =============================================================================
// Memo
// =============================================================================

describe('Memo', () => {
  it('creates a VNode with initial content', () => {
    const node = Memo([1, 2], () => Text({}, 'hello'));
    expect(node.children).toHaveLength(1);
    expect(node.children[0].props.children).toBe('hello');
  });

  it('is detectable via isMemoVNode', () => {
    const memo = Memo([], () => Text({}, 'test'));
    const plain = Text({}, 'test');
    expect(isMemoVNode(memo)).toBe(true);
    expect(isMemoVNode(plain)).toBe(false);
  });

  it('skips rebuild when deps are unchanged', () => {
    const factory = vi.fn(() => Text({}, 'expensive'));
    const node = Memo([1, 'a'], factory) as MemoVNode;

    expect(factory).toHaveBeenCalledTimes(1);

    // Same deps — should NOT call factory again
    const changed = refreshMemoVNode(node, [1, 'a']);
    expect(changed).toBe(false);
    expect(factory).toHaveBeenCalledTimes(1); // still 1
  });

  it('rebuilds when deps change', () => {
    let value = 'first';
    const factory = vi.fn(() => Text({}, value));
    const node = Memo([1], factory) as MemoVNode;

    expect(factory).toHaveBeenCalledTimes(1);
    expect(node.children[0].props.children).toBe('first');

    // Different deps — should rebuild
    value = 'second';
    const changed = refreshMemoVNode(node, [2]);
    expect(changed).toBe(true);
    expect(factory).toHaveBeenCalledTimes(2);
    expect(node.children[0].props.children).toBe('second');
  });

  it('handles empty deps (never rebuilds)', () => {
    const factory = vi.fn(() => Text({}, 'static'));
    const node = Memo([], factory) as MemoVNode;

    // Empty deps should always match empty deps
    const changed = refreshMemoVNode(node, []);
    expect(changed).toBe(false);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('handles null results', () => {
    const node = Memo([true], () => null) as MemoVNode;
    expect(node.children).toHaveLength(0);
  });

  it('compares deps with Object.is (handles NaN, -0)', () => {
    const factory = vi.fn(() => Text({}, 'test'));
    const node = Memo([NaN, -0], factory) as MemoVNode;

    // NaN === NaN with Object.is, -0 === -0
    const changed = refreshMemoVNode(node, [NaN, -0]);
    expect(changed).toBe(false);
    expect(factory).toHaveBeenCalledTimes(1);

    // -0 vs +0 are different with Object.is
    const changed2 = refreshMemoVNode(node, [NaN, 0]);
    expect(changed2).toBe(true);
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('detects deps length change', () => {
    const factory = vi.fn(() => Text({}, 'test'));
    const node = Memo([1, 2], factory) as MemoVNode;

    const changed = refreshMemoVNode(node, [1, 2, 3]);
    expect(changed).toBe(true);
  });

  it('works with complex subtrees', () => {
    const items = ['a', 'b', 'c'];
    const node = Memo([items.length], () =>
      Box({}, ...items.map(i => Text({}, i)))
    );
    expect(node.children[0].children).toHaveLength(3);
  });
});

// =============================================================================
// PreText
// =============================================================================

describe('PreText', () => {
  it('creates a text VNode with __prebuiltAnsi flag', () => {
    const ansi = '\x1b[32mgreen text\x1b[0m';
    const node = PreText(ansi);

    expect(node.type).toBe('text');
    expect(node.props.children).toBe(ansi);
    expect(node.props.__prebuiltAnsi).toBe(true);
  });

  it('accepts layout props', () => {
    const node = PreText('content', { width: 20 });
    expect(node.props.width).toBe(20);
    expect(node.props.__prebuiltAnsi).toBe(true);
  });

  it('preserves ANSI content exactly', () => {
    const complex = `${'\x1b[1m'}bold${'\x1b[0m'} ${'\x1b[38;2;255;0;0m'}red${'\x1b[0m'}`;
    const node = PreText(complex);
    expect(node.props.children).toBe(complex);
  });

  it('works in a Box container', () => {
    const row1 = PreText('\x1b[32m████\x1b[0m');
    const row2 = PreText('\x1b[31m░░░░\x1b[0m');
    const container = Box({ flexDirection: 'column' }, row1, row2);

    expect(container.children).toHaveLength(2);
    expect(container.children[0].props.__prebuiltAnsi).toBe(true);
    expect(container.children[1].props.__prebuiltAnsi).toBe(true);
  });
});
