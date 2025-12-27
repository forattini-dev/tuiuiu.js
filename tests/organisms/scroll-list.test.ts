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
