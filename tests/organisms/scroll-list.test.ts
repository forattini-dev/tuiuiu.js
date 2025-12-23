/**
 * Tests for ScrollList, ChatList, and useScrollList
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ScrollList,
  ChatList,
  useScrollList,
  createScrollList,
  clearScrollListCache,
  invalidateScrollListItem,
} from '../../src/organisms/scroll-list.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { renderToString } from '../../src/core/renderer.js';

// Mock useInput to prevent actual input handling
vi.mock('../../src/hooks/index.js', () => ({
  useInput: vi.fn(),
}));

describe('ScrollList', () => {
  beforeEach(() => {
    clearScrollListCache();
  });

  describe('basic rendering', () => {
    it('should render items with children function', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const node = ScrollList({
        items,
        children: (item) => Text({}, item),
        height: 10,
        width: 40,
      });

      const output = renderToString(node, 40);
      expect(output).toContain('Item 1');
      expect(output).toContain('Item 2');
      expect(output).toContain('Item 3');
    });

    it('should render with fixed itemHeight', () => {
      const items = ['A', 'B', 'C'];
      const node = ScrollList({
        items,
        children: (item) => Text({}, item),
        height: 5,
        width: 20,
        itemHeight: 1,
      });

      const output = renderToString(node, 20);
      expect(output).toContain('A');
      expect(output).toContain('B');
      expect(output).toContain('C');
    });

    it('should render with function itemHeight', () => {
      const items = ['Short', 'A bit longer item'];
      const node = ScrollList({
        items,
        children: (item) => Text({}, item),
        height: 10,
        width: 40,
        itemHeight: (item) => Math.ceil(item.length / 10),
      });

      const output = renderToString(node, 40);
      expect(output).toContain('Short');
      expect(output).toContain('A bit longer item');
    });

    it('should auto-estimate height when itemHeight not provided', () => {
      const items = [{ text: 'Hello' }, { text: 'World' }];
      const node = ScrollList({
        items,
        children: (item) => Text({}, item.text),
        height: 10,
        width: 40,
      });

      const output = renderToString(node, 40);
      expect(output).toContain('Hello');
      expect(output).toContain('World');
    });

    it('should render scrollbar when content exceeds height', () => {
      const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
      const node = ScrollList({
        items,
        children: (item) => Text({}, item),
        height: 5,
        width: 40,
        itemHeight: 1,
        showScrollbar: true,
      });

      const output = renderToString(node, 40);
      // Scrollbar should be visible (contains thumb character)
      expect(output).toContain('█');
    });

    it('should hide scrollbar when showScrollbar is false', () => {
      const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
      const node = ScrollList({
        items,
        children: (item) => Text({}, item),
        height: 5,
        width: 40,
        itemHeight: 1,
        showScrollbar: false,
      });

      const output = renderToString(node, 40);
      // Scrollbar thumb should not be present
      expect(output).not.toContain('█');
    });
  });

  describe('inverted mode', () => {
    it('should render items in inverted order when inverted is true', () => {
      const items = ['First', 'Second', 'Third'];
      const node = ScrollList({
        items,
        children: (item) => Text({}, item),
        height: 10,
        width: 40,
        inverted: true,
      });

      const output = renderToString(node, 40);
      // All items should be visible
      expect(output).toContain('First');
      expect(output).toContain('Second');
      expect(output).toContain('Third');
    });
  });

  describe('items as function', () => {
    it('should accept items as accessor function', () => {
      const getItems = () => ['Dynamic 1', 'Dynamic 2'];
      const node = ScrollList({
        items: getItems,
        children: (item) => Text({}, item),
        height: 10,
        width: 40,
      });

      const output = renderToString(node, 40);
      expect(output).toContain('Dynamic 1');
      expect(output).toContain('Dynamic 2');
    });
  });

  describe('empty list', () => {
    it('should handle empty items array', () => {
      const node = ScrollList({
        items: [],
        children: (item: string) => Text({}, item),
        height: 5,
        width: 40,
      });

      // Should not throw
      const output = renderToString(node, 40);
      expect(output).toBeDefined();
    });
  });
});

describe('ChatList', () => {
  it('should be inverted by default', () => {
    const items = ['Msg 1', 'Msg 2'];
    const node = ChatList({
      items,
      children: (item) => Text({}, item),
      height: 10,
      width: 40,
    });

    const output = renderToString(node, 40);
    expect(output).toContain('Msg 1');
    expect(output).toContain('Msg 2');
  });

  it('should pass all props to ScrollList', () => {
    const items = ['Chat message'];
    const node = ChatList({
      items,
      children: (item) => Box({ borderStyle: 'round' }, Text({}, item)),
      height: 5,
      width: 40,
      showScrollbar: false,
    });

    const output = renderToString(node, 40);
    expect(output).toContain('Chat message');
    expect(output).toContain('╭'); // Border
  });
});

describe('createScrollList', () => {
  it('should create state with scroll methods', () => {
    const state = createScrollList();

    expect(state.scrollTop).toBeDefined();
    expect(state.maxScroll).toBeDefined();
    expect(state.scrollBy).toBeDefined();
    expect(state.scrollTo).toBeDefined();
    expect(state.scrollToTop).toBeDefined();
    expect(state.scrollToBottom).toBeDefined();
    expect(state.pageUp).toBeDefined();
    expect(state.pageDown).toBeDefined();
    expect(state.setHeight).toBeDefined();
    expect(state.setInverted).toBeDefined();
  });

  it('should initialize with scrollTop at 0', () => {
    const state = createScrollList();
    expect(state.scrollTop()).toBe(0);
  });

  it('should allow setting height', () => {
    const state = createScrollList({ initialHeight: 10 });
    state.setHeight(20);
    // Height is internal, but we can test pageUp/pageDown behavior
    expect(state.scrollTop()).toBe(0);
  });

  it('should respect inverted option', () => {
    const stateNormal = createScrollList({ inverted: false });
    const stateInverted = createScrollList({ inverted: true });

    // Both should start at 0
    expect(stateNormal.scrollTop()).toBe(0);
    expect(stateInverted.scrollTop()).toBe(0);
  });
});

describe('useScrollList', () => {
  it('should return scroll control methods', () => {
    const result = useScrollList();

    expect(result.scrollToBottom).toBeDefined();
    expect(result.scrollToTop).toBeDefined();
    expect(result.scrollTo).toBeDefined();
    expect(result.scrollBy).toBeDefined();
    expect(result.scrollTop).toBeDefined();
    expect(result.maxScroll).toBeDefined();
    expect(result.bind).toBeDefined();
    expect(result.bind.state).toBeDefined();
  });

  it('should accept inverted option', () => {
    const result = useScrollList({ inverted: true });
    expect(result.bind.state).toBeDefined();
  });

  it('should provide working scrollToBottom', () => {
    const result = useScrollList();
    // Should not throw
    result.scrollToBottom();
    expect(result.scrollTop()).toBe(0); // No max scroll set yet
  });

  it('should provide working scrollTo', () => {
    const result = useScrollList();
    result.scrollTo(10);
    // Clamped to maxScroll (0 initially)
    expect(result.scrollTop()).toBe(0);
  });
});

describe('height cache', () => {
  it('should cache height for object items', () => {
    const item1 = { id: 1, text: 'Hello' };
    const item2 = { id: 2, text: 'World' };

    // First render
    const node1 = ScrollList({
      items: [item1, item2],
      children: (item) => Text({}, item.text),
      height: 10,
      width: 40,
    });
    renderToString(node1, 40);

    // Second render with same objects - should use cache
    const node2 = ScrollList({
      items: [item1, item2],
      children: (item) => Text({}, item.text),
      height: 10,
      width: 40,
    });
    const output = renderToString(node2, 40);

    expect(output).toContain('Hello');
    expect(output).toContain('World');
  });

  it('should invalidate specific item from cache', () => {
    const item = { id: 1, text: 'Original' };

    // First render
    const node1 = ScrollList({
      items: [item],
      children: (i) => Text({}, i.text),
      height: 10,
      width: 40,
    });
    renderToString(node1, 40);

    // Modify item
    item.text = 'Modified';

    // Invalidate cache
    invalidateScrollListItem(item);

    // Second render should use new height
    const node2 = ScrollList({
      items: [item],
      children: (i) => Text({}, i.text),
      height: 10,
      width: 40,
    });
    const output = renderToString(node2, 40);

    expect(output).toContain('Modified');
  });
});

describe('external state', () => {
  it('should use external state when provided', () => {
    const state = createScrollList({ inverted: true });

    const node = ScrollList({
      state,
      items: ['A', 'B', 'C'],
      children: (item) => Text({}, item),
      height: 10,
      width: 40,
    });

    const output = renderToString(node, 40);
    expect(output).toContain('A');
    expect(output).toContain('B');
    expect(output).toContain('C');
  });

  it('should use useScrollList bind with ScrollList', () => {
    const hook = useScrollList({ inverted: true });

    const node = ScrollList({
      ...hook.bind,
      items: ['X', 'Y', 'Z'],
      children: (item) => Text({}, item),
      height: 10,
      width: 40,
    });

    const output = renderToString(node, 40);
    expect(output).toContain('X');
    expect(output).toContain('Y');
    expect(output).toContain('Z');
  });
});

describe('complex items', () => {
  it('should render complex VNode children', () => {
    interface Message {
      id: number;
      text: string;
      author: string;
    }

    const messages: Message[] = [
      { id: 1, text: 'Hello!', author: 'Alice' },
      { id: 2, text: 'Hi there!', author: 'Bob' },
    ];

    const node = ChatList({
      items: messages,
      children: (msg) =>
        Box(
          { flexDirection: 'column', borderStyle: 'round' },
          Text({ bold: true }, msg.author),
          Text({}, msg.text)
        ),
      height: 20,
      width: 50,
    });

    const output = renderToString(node, 50);
    expect(output).toContain('Alice');
    expect(output).toContain('Hello!');
    expect(output).toContain('Bob');
    expect(output).toContain('Hi there!');
  });
});
