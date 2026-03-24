import { describe, it, expect } from 'vitest';
import {
  Computed,
  ComputedText,
  isReactiveVNode,
  refreshReactiveVNode,
} from '../../src/primitives/computed-node.js';
import { createSignal } from '../../src/primitives/signal.js';
import { Text, Box } from '../../src/primitives/nodes.js';
import type { ReactiveVNode } from '../../src/primitives/computed-node.js';

describe('Computed', () => {
  it('creates a VNode with initial content', () => {
    const node = Computed(() => Text({}, 'hello'));
    expect(node.type).toBe('box');
    expect(node.children).toHaveLength(1);
    expect(node.children[0].type).toBe('text');
    expect(node.children[0].props.children).toBe('hello');
  });

  it('is detectable via isReactiveVNode', () => {
    const reactive = Computed(() => Text({}, 'test'));
    const plain = Text({}, 'test');

    expect(isReactiveVNode(reactive)).toBe(true);
    expect(isReactiveVNode(plain)).toBe(false);
  });

  it('reads signals eagerly for initial render', () => {
    const [count] = createSignal(42);
    const node = Computed(() => Text({}, `Count: ${count()}`));

    expect(node.children[0].props.children).toBe('Count: 42');
  });

  it('refreshes when signal changes', () => {
    const [count, setCount] = createSignal(0);
    const node = Computed(() => Text({}, `Count: ${count()}`)) as ReactiveVNode;

    expect(node.children[0].props.children).toBe('Count: 0');

    setCount(5);
    const changed = refreshReactiveVNode(node);

    expect(changed).toBe(true);
    expect(node.children[0].props.children).toBe('Count: 5');
  });

  it('returns false when refresh produces same result', () => {
    let value = 'hello';
    const textNode = Text({}, 'hello');
    const node = Computed(() => textNode) as ReactiveVNode;

    // Same reference returned
    const changed = refreshReactiveVNode(node);
    expect(changed).toBe(false);
  });

  it('handles null results', () => {
    const [show, setShow] = createSignal(true);
    const node = Computed(() =>
      show() ? Text({}, 'visible') : null
    ) as ReactiveVNode;

    expect(node.children).toHaveLength(1);

    setShow(false);
    refreshReactiveVNode(node);
    expect(node.children).toHaveLength(0);
  });

  it('works with complex subtrees', () => {
    const [items, setItems] = createSignal(['a', 'b', 'c']);
    const node = Computed(() =>
      Box({},
        ...items().map(item => Text({}, item))
      )
    ) as ReactiveVNode;

    expect(node.children[0].children).toHaveLength(3);

    setItems(['x', 'y']);
    refreshReactiveVNode(node);
    expect(node.children[0].children).toHaveLength(2);
  });
});

describe('ComputedText', () => {
  it('creates a text node with content', () => {
    const [name, setName] = createSignal('Alice');
    const node = ComputedText(() => `Hello, ${name()}!`);

    // Outside render context: returns a plain text VNode
    expect(node.type).toBe('text');
    expect(node.props.children).toBe('Hello, Alice!');
  });

  it('accepts style props', () => {
    const node = ComputedText(() => 'styled', { color: 'red', bold: true });
    expect(node.props.color).toBe('red');
    expect(node.props.bold).toBe(true);
    expect(node.props.children).toBe('styled');
  });

  it('evaluates signal content', () => {
    const [count, setCount] = createSignal(0);
    const node = ComputedText(() => `${count()}`);

    expect(node.props.children).toBe('0');
  });
});
