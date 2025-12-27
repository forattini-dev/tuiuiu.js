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

describe('auto-scroll', () => {
  it('should scroll to bottom when content grows with autoScroll enabled', () => {
    const state = createScrollList();

    // Initial render with few items
    let items = ['A', 'B', 'C'];
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 5,
      width: 40,
      itemHeight: 1,
      autoScroll: true,
    });

    expect(state.scrollTop()).toBe(0);

    // Add more items (content grows)
    items = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 5,
      width: 40,
      itemHeight: 1,
      autoScroll: true,
    });

    // Should auto-scroll to bottom
    expect(state.scrollTop()).toBe(state.maxScroll());
  });

  it('should respect autoScrollThreshold - only scroll when near bottom', () => {
    const state = createScrollList();

    // Initial render
    const items = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 5,
      width: 40,
      itemHeight: 1,
      autoScroll: true,
      autoScrollThreshold: 2,
    });

    // User scrolls to top
    state.scrollToTop();
    expect(state.scrollTop()).toBe(0);

    // Add more items - should NOT auto-scroll because user is not near bottom
    const moreItems = [...items, 'K', 'L', 'M'];
    ScrollList({
      state,
      items: moreItems,
      children: (item) => Text({}, item),
      height: 5,
      width: 40,
      itemHeight: 1,
      autoScroll: true,
      autoScrollThreshold: 2,
    });

    // Should stay at top because threshold wasn't met
    expect(state.scrollTop()).toBe(0);
  });

  it('should isNearBottom work correctly in normal mode', () => {
    const state = createScrollList();

    // Create a list that needs scrolling
    ScrollList({
      state,
      items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      children: (item) => Text({}, item),
      height: 5,
      width: 40,
      itemHeight: 1,
    });

    // At top
    state.scrollToTop();
    expect(state.isNearBottom(0)).toBe(false);
    expect(state.isNearBottom(10)).toBe(true); // threshold larger than max scroll

    // At bottom
    state.scrollToBottom();
    expect(state.isNearBottom(0)).toBe(true);
    expect(state.isNearBottom(2)).toBe(true);
  });

  it('should isNearBottom work correctly in inverted mode', () => {
    const state = createScrollList({ inverted: true });

    // Create a list that needs scrolling
    ScrollList({
      state,
      items: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'],
      children: (item) => Text({}, item),
      height: 5,
      width: 40,
      itemHeight: 1,
      inverted: true,
    });

    // In inverted mode, scrollTop 0 = bottom
    state.scrollTo(0);
    expect(state.isNearBottom(0)).toBe(true);

    // Move away from bottom
    state.scrollTo(5);
    expect(state.isNearBottom(0)).toBe(false);
    expect(state.isNearBottom(5)).toBe(true);
  });

  it('should ChatList have autoScroll enabled by default', () => {
    const state = createScrollList({ inverted: true });

    // Initial render
    let items = ['A', 'B', 'C'];
    ChatList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 3,
      width: 40,
      itemHeight: 1,
    });

    // Add more items
    items = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    ChatList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 3,
      width: 40,
      itemHeight: 1,
    });

    // ChatList should auto-scroll to bottom by default (which is scrollTop=0 in inverted mode)
    expect(state.scrollTop()).toBe(0);
  });

  it('should expose isNearBottom in useScrollList hook', () => {
    const hook = useScrollList();

    // Verify isNearBottom is exposed
    expect(typeof hook.isNearBottom).toBe('function');

    // Create a list
    ScrollList({
      ...hook.bind,
      items: ['A', 'B', 'C', 'D', 'E'],
      children: (item) => Text({}, item),
      height: 2,
      width: 40,
      itemHeight: 1,
    });

    // Test it works through the hook
    hook.scrollToBottom();
    expect(hook.isNearBottom(0)).toBe(true);

    hook.scrollToTop();
    expect(hook.isNearBottom(0)).toBe(false);
  });
});

describe('dynamic list growth simulation', () => {
  it('should handle rapid list growth (simulating log streaming)', () => {
    const state = createScrollList();
    const renderList = (items: string[]) => {
      ScrollList({
        state,
        items,
        children: (item) => Text({}, item),
        height: 10,
        width: 80,
        itemHeight: 1,
        autoScroll: true,
      });
    };

    // Start with empty list
    let logs: string[] = [];
    renderList(logs);
    expect(state.scrollTop()).toBe(0);
    expect(state.maxScroll()).toBe(0);

    // Add logs one by one (simulating real-time log streaming)
    for (let i = 1; i <= 50; i++) {
      logs = [...logs, `[${i}] Log message ${i}`];
      renderList(logs);
    }

    // After 50 items with height=10, maxScroll = 50 - 10 = 40
    expect(state.maxScroll()).toBe(40);
    // Should be at the bottom (following new logs)
    expect(state.scrollTop()).toBe(state.maxScroll());
  });

  it('should handle large list growth in batches', () => {
    const state = createScrollList();
    const renderList = (items: string[]) => {
      ScrollList({
        state,
        items,
        children: (item) => Text({}, item),
        height: 20,
        width: 80,
        itemHeight: 1,
        autoScroll: true,
      });
    };

    // Initial batch of 100 items
    let items = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);
    renderList(items);

    // maxScroll = 100 - 20 = 80
    expect(state.maxScroll()).toBe(80);
    expect(state.scrollTop()).toBe(80); // At bottom

    // Add another batch of 100 items
    items = [...items, ...Array.from({ length: 100 }, (_, i) => `Item ${101 + i}`)];
    renderList(items);

    // maxScroll = 200 - 20 = 180
    expect(state.maxScroll()).toBe(180);
    expect(state.scrollTop()).toBe(180); // Still at bottom

    // Add one more batch
    items = [...items, ...Array.from({ length: 100 }, (_, i) => `Item ${201 + i}`)];
    renderList(items);

    // maxScroll = 300 - 20 = 280
    expect(state.maxScroll()).toBe(280);
    expect(state.scrollTop()).toBe(280); // Still following
  });

  it('should NOT auto-scroll when user scrolls away (threshold mode)', () => {
    const state = createScrollList();
    const renderList = (items: string[]) => {
      ScrollList({
        state,
        items,
        children: (item) => Text({}, item),
        height: 10,
        width: 80,
        itemHeight: 1,
        autoScroll: true,
        autoScrollThreshold: 3, // Only auto-scroll if within 3 lines of bottom
      });
    };

    // Start with 20 items - first use autoScroll WITHOUT threshold to go to bottom
    let items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 10,
      width: 80,
      itemHeight: 1,
      autoScroll: true,
      autoScrollThreshold: 0, // No threshold for initial position
    });

    // maxScroll = 20 - 10 = 10
    expect(state.maxScroll()).toBe(10);
    expect(state.scrollTop()).toBe(10); // At bottom

    // User scrolls to top (reading old content)
    state.scrollToTop();
    expect(state.scrollTop()).toBe(0);

    // New items arrive - NOW use threshold
    items = [...items, 'New Item 21', 'New Item 22', 'New Item 23'];
    renderList(items);

    // Should NOT auto-scroll because user is at top (far from bottom)
    expect(state.scrollTop()).toBe(0);

    // More items arrive
    items = [...items, 'New Item 24', 'New Item 25'];
    renderList(items);

    // Still should NOT auto-scroll
    expect(state.scrollTop()).toBe(0);
  });

  it('should auto-scroll when user is within threshold', () => {
    const state = createScrollList();

    // Start with 20 items - use autoScroll WITHOUT threshold to position at bottom first
    let items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 10,
      width: 80,
      itemHeight: 1,
      autoScroll: true,
      autoScrollThreshold: 0, // No threshold to ensure we start at bottom
    });

    // maxScroll = 10
    expect(state.scrollTop()).toBe(10);

    // User scrolls up just a little (2 lines - within threshold of 3)
    state.scrollTo(8); // 2 lines from bottom
    expect(state.scrollTop()).toBe(8);
    expect(state.isNearBottom(3)).toBe(true);

    // New items arrive - NOW use threshold
    items = [...items, 'New Item 21', 'New Item 22'];
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 10,
      width: 80,
      itemHeight: 1,
      autoScroll: true,
      autoScrollThreshold: 3,
    });

    // Should auto-scroll because user was within threshold
    // New maxScroll = 22 - 10 = 12
    expect(state.maxScroll()).toBe(12);
    expect(state.scrollTop()).toBe(12); // Followed to bottom
  });
});

describe('navigation controls', () => {
  it('should scrollToTop and scrollToBottom work with large lists', () => {
    const state = createScrollList();

    // Create a large list
    const items = Array.from({ length: 500 }, (_, i) => `Item ${i + 1}`);
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 20,
      width: 80,
      itemHeight: 1,
    });

    // maxScroll = 500 - 20 = 480
    expect(state.maxScroll()).toBe(480);

    // Navigate
    state.scrollToBottom();
    expect(state.scrollTop()).toBe(480);

    state.scrollToTop();
    expect(state.scrollTop()).toBe(0);

    state.scrollToBottom();
    expect(state.scrollTop()).toBe(480);
  });

  it('should scrollBy work correctly for incremental navigation', () => {
    const state = createScrollList();

    const items = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 10,
      width: 80,
      itemHeight: 1,
    });

    // maxScroll = 90
    expect(state.maxScroll()).toBe(90);
    expect(state.scrollTop()).toBe(0);

    // Scroll down by 10
    state.scrollBy(10);
    expect(state.scrollTop()).toBe(10);

    // Scroll down by 30 more
    state.scrollBy(30);
    expect(state.scrollTop()).toBe(40);

    // Scroll up by 15
    state.scrollBy(-15);
    expect(state.scrollTop()).toBe(25);

    // Try to scroll past top (should clamp to 0)
    state.scrollBy(-100);
    expect(state.scrollTop()).toBe(0);

    // Try to scroll past bottom (should clamp to maxScroll)
    state.scrollBy(1000);
    expect(state.scrollTop()).toBe(90);
  });

  it('should scrollTo work with exact positions', () => {
    const state = createScrollList();

    const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 10,
      width: 80,
      itemHeight: 1,
    });

    // maxScroll = 40
    state.scrollTo(25);
    expect(state.scrollTop()).toBe(25);

    state.scrollTo(0);
    expect(state.scrollTop()).toBe(0);

    state.scrollTo(40);
    expect(state.scrollTop()).toBe(40);

    // Clamp to bounds
    state.scrollTo(-10);
    expect(state.scrollTop()).toBe(0);

    state.scrollTo(100);
    expect(state.scrollTop()).toBe(40);
  });

  it('should pageUp and pageDown work correctly', () => {
    const state = createScrollList();

    const items = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 10,
      width: 80,
      itemHeight: 1,
    });

    // Start at top
    expect(state.scrollTop()).toBe(0);

    // Page down
    state.pageDown();
    expect(state.scrollTop()).toBe(10);

    state.pageDown();
    expect(state.scrollTop()).toBe(20);

    // Page up
    state.pageUp();
    expect(state.scrollTop()).toBe(10);

    state.pageUp();
    expect(state.scrollTop()).toBe(0);

    // Page up at top should stay at 0
    state.pageUp();
    expect(state.scrollTop()).toBe(0);
  });
});

describe('inverted mode navigation', () => {
  it('should scrollToBottom go to scrollTop=0 in inverted mode', () => {
    const state = createScrollList({ inverted: true });

    const items = Array.from({ length: 50 }, (_, i) => `Message ${i + 1}`);
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 10,
      width: 80,
      itemHeight: 1,
      inverted: true,
    });

    // In inverted mode, scrollTop=0 means we're at the "bottom" (seeing newest)
    state.scrollToBottom();
    expect(state.scrollTop()).toBe(0);

    // scrollToTop should go to maxScroll (seeing oldest)
    state.scrollToTop();
    expect(state.scrollTop()).toBe(40);
  });

  it('should auto-scroll work correctly in inverted mode (ChatList behavior)', () => {
    const state = createScrollList({ inverted: true });
    const renderList = (items: string[]) => {
      ChatList({
        state,
        items,
        children: (item) => Text({}, item),
        height: 10,
        width: 80,
        itemHeight: 1,
      });
    };

    // Start with some messages
    let messages = ['Hello!', 'How are you?', 'Fine, thanks!'];
    renderList(messages);

    // Should be at bottom (scrollTop=0 in inverted mode)
    expect(state.scrollTop()).toBe(0);

    // Add more messages
    messages = [...messages, 'What are you doing?', 'Just coding!', 'Nice!'];
    renderList(messages);

    // Should still be at bottom
    expect(state.scrollTop()).toBe(0);

    // Add many messages to trigger scrolling
    for (let i = 0; i < 20; i++) {
      messages = [...messages, `Message ${i + 7}`];
      renderList(messages);
    }

    // Should still be at bottom (following new messages)
    expect(state.scrollTop()).toBe(0);
  });

  it('should isNearBottom handle inverted mode edge cases', () => {
    const state = createScrollList({ inverted: true });

    const items = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);
    ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 10,
      width: 80,
      itemHeight: 1,
      inverted: true,
    });

    // maxScroll = 20
    expect(state.maxScroll()).toBe(20);

    // At bottom (scrollTop=0 in inverted mode)
    state.scrollTo(0);
    expect(state.isNearBottom(0)).toBe(true);
    expect(state.isNearBottom(5)).toBe(true);

    // Scroll up a bit (scrollTop=5)
    state.scrollTo(5);
    expect(state.isNearBottom(0)).toBe(false);
    expect(state.isNearBottom(5)).toBe(true);
    expect(state.isNearBottom(4)).toBe(false);

    // At top (scrollTop=maxScroll in inverted mode)
    state.scrollTo(20);
    expect(state.isNearBottom(0)).toBe(false);
    expect(state.isNearBottom(19)).toBe(false);
    expect(state.isNearBottom(20)).toBe(true);
  });
});

describe('visible items rendering', () => {
  it('should only render visible items in viewport', () => {
    const state = createScrollList();
    const renderCalls: number[] = [];

    const items = Array.from({ length: 100 }, (_, i) => `Item ${i + 1}`);
    const node = ScrollList({
      state,
      items,
      children: (item, index) => {
        renderCalls.push(index);
        return Text({}, item);
      },
      height: 5,
      width: 80,
      itemHeight: 1,
    });

    // Render the node
    renderToString(node, 80);

    // Should only render height+buffer items (approximately)
    expect(renderCalls.length).toBeLessThanOrEqual(10);
    expect(renderCalls.length).toBeGreaterThanOrEqual(5);
  });

  it('should update visible items when scrolling', () => {
    const state = createScrollList();

    const items = Array.from({ length: 50 }, (_, i) => `Item ${i + 1}`);

    // Initial render at top
    let node = ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 5,
      width: 80,
      itemHeight: 1,
    });
    let output = renderToString(node, 80);

    expect(output).toContain('Item 1');
    expect(output).toContain('Item 5');
    expect(output).not.toContain('Item 46');

    // Scroll to bottom
    state.scrollToBottom();
    node = ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height: 5,
      width: 80,
      itemHeight: 1,
    });
    output = renderToString(node, 80);

    expect(output).not.toContain('Item 1');
    expect(output).toContain('Item 46');
    expect(output).toContain('Item 50');
  });
});

describe('complete navigation round-trip with content verification', () => {
  /**
   * Helper to render and get output
   */
  const renderList = (state: ReturnType<typeof createScrollList>, items: string[], height: number) => {
    const node = ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height,
      width: 80,
      itemHeight: 1,
    });
    return renderToString(node, 80);
  };

  it('should navigate from top to bottom and back to top', () => {
    const state = createScrollList();
    const items = Array.from({ length: 100 }, (_, i) => `Line_${String(i + 1).padStart(3, '0')}`);
    // Items: Line_001, Line_002, ..., Line_100

    // 1. Start at top - should see Line_001 to Line_010
    let output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Line_001');
    expect(output).toContain('Line_010');
    expect(output).not.toContain('Line_011');
    expect(output).not.toContain('Line_100');

    // 2. Scroll to bottom - should see Line_091 to Line_100
    state.scrollToBottom();
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(90); // 100 - 10 = 90
    expect(output).not.toContain('Line_001');
    expect(output).not.toContain('Line_090');
    expect(output).toContain('Line_091');
    expect(output).toContain('Line_100');

    // 3. Scroll back to top - should see Line_001 to Line_010 again
    state.scrollToTop();
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Line_001');
    expect(output).toContain('Line_010');
    expect(output).not.toContain('Line_091');
    expect(output).not.toContain('Line_100');
  });

  it('should navigate incrementally with scrollBy', () => {
    const state = createScrollList();
    const items = Array.from({ length: 50 }, (_, i) => `Row_${String(i + 1).padStart(2, '0')}`);
    // Items: Row_01, Row_02, ..., Row_50

    // 1. Start at top
    let output = renderList(state, items, 5);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Row_01');
    expect(output).toContain('Row_05');
    expect(output).not.toContain('Row_06');

    // 2. Scroll down by 5
    state.scrollBy(5);
    output = renderList(state, items, 5);
    expect(state.scrollTop()).toBe(5);
    expect(output).not.toContain('Row_01');
    expect(output).toContain('Row_06');
    expect(output).toContain('Row_10');
    expect(output).not.toContain('Row_11');

    // 3. Scroll down by 10 more
    state.scrollBy(10);
    output = renderList(state, items, 5);
    expect(state.scrollTop()).toBe(15);
    expect(output).not.toContain('Row_10');
    expect(output).toContain('Row_16');
    expect(output).toContain('Row_20');

    // 4. Scroll up by 10
    state.scrollBy(-10);
    output = renderList(state, items, 5);
    expect(state.scrollTop()).toBe(5);
    expect(output).toContain('Row_06');
    expect(output).toContain('Row_10');
    expect(output).not.toContain('Row_16');

    // 5. Scroll up by 5 - back to top
    state.scrollBy(-5);
    output = renderList(state, items, 5);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Row_01');
    expect(output).toContain('Row_05');
  });

  it('should navigate with pageUp and pageDown', () => {
    const state = createScrollList();
    const items = Array.from({ length: 60 }, (_, i) => `Page_${String(i + 1).padStart(2, '0')}`);
    // Items: Page_01, Page_02, ..., Page_60

    // 1. Start at top
    let output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Page_01');
    expect(output).toContain('Page_10');

    // 2. Page down (should move by height = 10)
    state.pageDown();
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(10);
    expect(output).not.toContain('Page_01');
    expect(output).toContain('Page_11');
    expect(output).toContain('Page_20');

    // 3. Page down again
    state.pageDown();
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(20);
    expect(output).toContain('Page_21');
    expect(output).toContain('Page_30');

    // 4. Page up
    state.pageUp();
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(10);
    expect(output).toContain('Page_11');
    expect(output).toContain('Page_20');

    // 5. Page up again - back to top
    state.pageUp();
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Page_01');
    expect(output).toContain('Page_10');
  });

  it('should handle scrollTo with content verification', () => {
    const state = createScrollList();
    const items = Array.from({ length: 100 }, (_, i) => `Pos_${String(i + 1).padStart(3, '0')}`);

    // 1. Start at top
    let output = renderList(state, items, 10);
    expect(output).toContain('Pos_001');

    // 2. Scroll to position 25
    state.scrollTo(25);
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(25);
    expect(output).not.toContain('Pos_001');
    expect(output).toContain('Pos_026');
    expect(output).toContain('Pos_035');

    // 3. Scroll to position 50
    state.scrollTo(50);
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(50);
    expect(output).toContain('Pos_051');
    expect(output).toContain('Pos_060');

    // 4. Scroll back to 0
    state.scrollTo(0);
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Pos_001');
    expect(output).toContain('Pos_010');

    // 5. Scroll to end
    state.scrollTo(90); // maxScroll = 100 - 10 = 90
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(90);
    expect(output).toContain('Pos_091');
    expect(output).toContain('Pos_100');
  });

  it('should clamp scroll positions and verify content at boundaries', () => {
    const state = createScrollList();
    const items = Array.from({ length: 30 }, (_, i) => `Bound_${String(i + 1).padStart(2, '0')}`);
    // maxScroll = 30 - 10 = 20

    // 1. Try to scroll to negative position - should clamp to 0
    state.scrollTo(-100);
    let output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Bound_01');
    expect(output).toContain('Bound_10');

    // 2. Try to scroll past end - should clamp to maxScroll
    state.scrollTo(1000);
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(20);
    expect(output).toContain('Bound_21');
    expect(output).toContain('Bound_30');

    // 3. scrollBy past top - should clamp
    state.scrollTo(10);
    state.scrollBy(-100);
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Bound_01');

    // 4. scrollBy past bottom - should clamp
    state.scrollBy(1000);
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(20);
    expect(output).toContain('Bound_30');
  });
});

describe('inverted mode content verification', () => {
  const renderList = (state: ReturnType<typeof createScrollList>, items: string[], height: number) => {
    const node = ScrollList({
      state,
      items,
      children: (item) => Text({}, item),
      height,
      width: 80,
      itemHeight: 1,
      inverted: true,
    });
    return renderToString(node, 80);
  };

  it('should show newest items (end of array) when at bottom in inverted mode', () => {
    const state = createScrollList({ inverted: true });
    const items = Array.from({ length: 50 }, (_, i) => `Msg_${String(i + 1).padStart(2, '0')}`);
    // In inverted mode, "bottom" (newest) = scrollTop 0

    // 1. At bottom (scrollTop=0) - should see newest items
    state.scrollToBottom();
    let output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    // In inverted mode at scrollTop=0, we see the LAST items in the array
    expect(output).toContain('Msg_50');
    expect(output).toContain('Msg_41');
    expect(output).not.toContain('Msg_01');

    // 2. Scroll to top (oldest) - should see first items
    state.scrollToTop();
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(40); // maxScroll = 50 - 10 = 40
    // In inverted mode at scrollTop=40, we see the FIRST items in the array
    expect(output).toContain('Msg_01');
    expect(output).toContain('Msg_10');
    expect(output).not.toContain('Msg_50');

    // 3. Scroll back to bottom
    state.scrollToBottom();
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Msg_50');
  });

  it('should navigate correctly in inverted mode with scrollBy', () => {
    const state = createScrollList({ inverted: true });
    const items = Array.from({ length: 30 }, (_, i) => `Chat_${String(i + 1).padStart(2, '0')}`);
    // maxScroll = 30 - 10 = 20

    // 1. Start at bottom (newest)
    state.scrollToBottom();
    let output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Chat_30');
    expect(output).toContain('Chat_21');

    // 2. Scroll up (towards older messages) - in inverted mode, scrollBy(+) moves towards older
    state.scrollBy(10);
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(10);
    expect(output).toContain('Chat_20');
    expect(output).toContain('Chat_11');
    expect(output).not.toContain('Chat_30');

    // 3. Scroll down (back towards newer) - scrollBy(-) moves towards newer
    state.scrollBy(-5);
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(5);
    expect(output).toContain('Chat_25');
    expect(output).toContain('Chat_16');

    // 4. All the way back to bottom
    state.scrollToBottom();
    output = renderList(state, items, 10);
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Chat_30');
  });
});

describe('multi-line items without overlap', () => {
  /**
   * This test ensures that items with multiple lines:
   * 1. Are rendered completely (all lines visible)
   * 2. Do not overlap with other items
   * 3. Items that don't fit are excluded rather than truncated
   */
  it('should only render items that fit completely (no partial/truncated items)', () => {
    const state = createScrollList();
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Title_${i + 1}`,
      body: `Body_${i + 1}`,
    }));

    // Each item is 2 lines, height is 8, so we can fit 4 items
    const node = ScrollList({
      state,
      items,
      children: (item) => Box(
        { flexDirection: 'column' },
        Text({}, item.title),
        Text({}, item.body),
      ),
      height: 8,
      width: 40,
      itemHeight: 2,
    });

    const output = renderToString(node, 40);

    // Should see items 1-4 (4 items * 2 lines = 8 lines)
    expect(output).toContain('Title_1');
    expect(output).toContain('Body_1');
    expect(output).toContain('Title_4');
    expect(output).toContain('Body_4');

    // Item 5 should NOT be visible (doesn't fit)
    expect(output).not.toContain('Title_5');
    expect(output).not.toContain('Body_5');
  });

  it('should not truncate items that partially fit', () => {
    const state = createScrollList();
    const items = [
      { id: 1, lines: ['A1', 'A2', 'A3'] }, // 3 lines
      { id: 2, lines: ['B1', 'B2', 'B3'] }, // 3 lines
      { id: 3, lines: ['C1', 'C2', 'C3'] }, // 3 lines
    ];

    // Height is 7, each item is 3 lines
    // First 2 items = 6 lines, 1 line left - not enough for item 3
    const node = ScrollList({
      state,
      items,
      children: (item) => Box(
        { flexDirection: 'column' },
        ...item.lines.map(line => Text({}, line)),
      ),
      height: 7,
      width: 40,
      itemHeight: 3,
    });

    const output = renderToString(node, 40);

    // Should see items 1 and 2 completely
    expect(output).toContain('A1');
    expect(output).toContain('A2');
    expect(output).toContain('A3');
    expect(output).toContain('B1');
    expect(output).toContain('B2');
    expect(output).toContain('B3');

    // Item 3 should NOT appear at all (not even partially)
    expect(output).not.toContain('C1');
    expect(output).not.toContain('C2');
    expect(output).not.toContain('C3');
  });

  it('should navigate correctly with multi-line items', () => {
    const state = createScrollList();
    const items = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      title: `Item_${String(i + 1).padStart(2, '0')}_Title`,
      body: `Item_${String(i + 1).padStart(2, '0')}_Body`,
    }));

    const render = () => {
      const node = ScrollList({
        state,
        items,
        children: (item) => Box(
          { flexDirection: 'column' },
          Text({}, item.title),
          Text({}, item.body),
        ),
        height: 8, // 4 items visible
        width: 40,
        itemHeight: 2,
      });
      return renderToString(node, 40);
    };

    // Initial: items 1-4
    let output = render();
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Item_01_Title');
    expect(output).toContain('Item_04_Body');
    expect(output).not.toContain('Item_05');

    // Scroll down 2 lines (1 item): items 2-5
    state.scrollBy(2);
    output = render();
    expect(state.scrollTop()).toBe(2);
    expect(output).not.toContain('Item_01');
    expect(output).toContain('Item_02_Title');
    expect(output).toContain('Item_05_Body');
    expect(output).not.toContain('Item_06');

    // Scroll to bottom: items 7-10
    state.scrollToBottom();
    output = render();
    expect(state.scrollTop()).toBe(12); // 20 total lines - 8 viewport = 12
    expect(output).toContain('Item_07_Title');
    expect(output).toContain('Item_10_Body');
    expect(output).not.toContain('Item_06');

    // Scroll up 4 lines (2 items): items 5-8
    state.scrollBy(-4);
    output = render();
    expect(state.scrollTop()).toBe(8);
    expect(output).toContain('Item_05_Title');
    expect(output).toContain('Item_08_Body');
    expect(output).not.toContain('Item_04');
    expect(output).not.toContain('Item_09');

    // Scroll to top: items 1-4
    state.scrollToTop();
    output = render();
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Item_01_Title');
    expect(output).toContain('Item_04_Body');
    expect(output).not.toContain('Item_05');
  });

  it('should handle inverted mode with multi-line items', () => {
    const state = createScrollList({ inverted: true });
    const items = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      title: `Msg_${String(i + 1).padStart(2, '0')}_Title`,
      body: `Msg_${String(i + 1).padStart(2, '0')}_Body`,
    }));

    const render = () => {
      const node = ScrollList({
        state,
        items,
        children: (item) => Box(
          { flexDirection: 'column' },
          Text({}, item.title),
          Text({}, item.body),
        ),
        height: 6, // 3 items visible
        width: 40,
        itemHeight: 2,
        inverted: true,
      });
      return renderToString(node, 40);
    };

    // At bottom (newest): items 6-8
    state.scrollToBottom();
    let output = render();
    expect(state.scrollTop()).toBe(0);
    expect(output).toContain('Msg_08_Title');
    expect(output).toContain('Msg_06_Body');
    expect(output).not.toContain('Msg_05');

    // At top (oldest): items 1-3
    state.scrollToTop();
    output = render();
    expect(state.scrollTop()).toBe(10); // 16 total - 6 viewport = 10
    expect(output).toContain('Msg_01_Title');
    expect(output).toContain('Msg_03_Body');
    expect(output).not.toContain('Msg_04');
  });
});
