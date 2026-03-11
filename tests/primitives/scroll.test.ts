/**
 * Tests for Scroll wrapper component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  Scroll,
  createScroll,
  useScroll,
} from '../../src/primitives/scroll.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { renderToString } from '../../src/core/renderer.js';

// Capture the useInput callback
let capturedInputHandler: ((input: string, key: any) => void) | null = null;
let capturedOptions: any = null;

// Mock useInput to capture callbacks for testing
vi.mock('../../src/hooks/index.js', () => ({
  useInput: vi.fn((handler, options) => {
    capturedInputHandler = handler;
    capturedOptions = options;
  }),
}));

describe('Scroll', () => {
  describe('basic rendering', () => {
    it('should render children content', () => {
      const node = Scroll(
        { height: 5, width: 40 },
        Text({}, 'Hello World')
      );

      const output = renderToString(node, 40);
      expect(output).toContain('Hello World');
    });

    it('should render multiple children', () => {
      const node = Scroll(
        { height: 10, width: 40 },
        Text({}, 'Line 1'),
        Text({}, 'Line 2'),
        Text({}, 'Line 3')
      );

      const output = renderToString(node, 40);
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 2');
      expect(output).toContain('Line 3');
    });

    it('should wrap children in column Box when multiple', () => {
      const node = Scroll(
        { height: 10, width: 40 },
        Text({}, 'A'),
        Text({}, 'B')
      );

      const output = renderToString(node, 40);
      expect(output).toContain('A');
      expect(output).toContain('B');
    });

    it('should handle Box children', () => {
      const node = Scroll(
        { height: 10, width: 40 },
        Box(
          { flexDirection: 'column' },
          Text({}, 'Inside Box 1'),
          Text({}, 'Inside Box 2')
        )
      );

      const output = renderToString(node, 40);
      expect(output).toContain('Inside Box 1');
      expect(output).toContain('Inside Box 2');
    });
  });

  describe('scrollbar', () => {
    it('should show scrollbar when content exceeds height', () => {
      const lines = Array.from({ length: 20 }, (_, i) => Text({}, `Line ${i + 1}`));
      const node = Scroll(
        { height: 5, width: 40, showScrollbar: true },
        ...lines
      );

      const output = renderToString(node, 40);
      // Should show scrollbar thumb
      expect(output).toContain('█');
    });

    it('should hide scrollbar when showScrollbar is false', () => {
      const lines = Array.from({ length: 20 }, (_, i) => Text({}, `Line ${i + 1}`));
      const node = Scroll(
        { height: 5, width: 40, showScrollbar: false },
        ...lines
      );

      const output = renderToString(node, 40);
      // Should not show scrollbar thumb
      expect(output).not.toContain('█');
    });

    it('should not show scrollbar when content fits', () => {
      const node = Scroll(
        { height: 10, width: 40 },
        Text({}, 'Short content')
      );

      const output = renderToString(node, 40);
      // No scrollbar needed
      expect(output).not.toContain('█');
    });
  });

  describe('content types', () => {
    it('should handle long text content', () => {
      const longText = 'This is a very long text that spans multiple lines when wrapped properly in the terminal window.';
      const node = Scroll(
        { height: 5, width: 40 },
        Text({}, longText)
      );

      const output = renderToString(node, 40);
      expect(output).toContain('This is');
    });

    it('should handle nested Box structures', () => {
      const node = Scroll(
        { height: 10, width: 60 },
        Box(
          { borderStyle: 'round', padding: 1 },
          Text({ bold: true }, 'Title'),
          Text({}, 'Content inside a bordered box')
        )
      );

      const output = renderToString(node, 60);
      expect(output).toContain('Title');
      expect(output).toContain('╭'); // Border
    });

    it('should handle empty children', () => {
      const node = Scroll(
        { height: 5, width: 40 }
      );

      // Should not throw
      expect(() => renderToString(node, 40)).not.toThrow();
    });
  });
});

describe('createScroll', () => {
  it('should create state with all methods', () => {
    const state = createScroll();

    expect(state.scrollTop).toBeDefined();
    expect(state.maxScroll).toBeDefined();
    expect(state.scrollBy).toBeDefined();
    expect(state.scrollTo).toBeDefined();
    expect(state.scrollToTop).toBeDefined();
    expect(state.scrollToBottom).toBeDefined();
    expect(state.pageUp).toBeDefined();
    expect(state.pageDown).toBeDefined();
  });

  it('should start at scrollTop 0', () => {
    const state = createScroll();
    expect(state.scrollTop()).toBe(0);
  });

  it('should clamp scrollTo within bounds', () => {
    const state = createScroll();
    // Max scroll is 0 initially
    state.scrollTo(100);
    expect(state.scrollTop()).toBe(0);
  });

  it('should handle negative scrollTo', () => {
    const state = createScroll();
    state.scrollTo(-10);
    expect(state.scrollTop()).toBe(0);
  });

  it('should accept initial height option', () => {
    const state = createScroll({ height: 15 });
    expect(state.scrollTop()).toBe(0);
  });

  it('should scrollBy positive delta', () => {
    const state = createScroll();
    state._setMaxScroll(100);
    state.scrollBy(5);
    expect(state.scrollTop()).toBe(5);
  });

  it('should scrollBy negative delta', () => {
    const state = createScroll();
    state._setMaxScroll(100);
    state.scrollTo(50);
    state.scrollBy(-10);
    expect(state.scrollTop()).toBe(40);
  });

  it('should clamp scrollBy at bottom', () => {
    const state = createScroll();
    state._setMaxScroll(10);
    state.scrollBy(100);
    expect(state.scrollTop()).toBe(10);
  });

  it('should clamp scrollBy at top', () => {
    const state = createScroll();
    state._setMaxScroll(100);
    state.scrollTo(5);
    state.scrollBy(-100);
    expect(state.scrollTop()).toBe(0);
  });

  it('should scrollToTop', () => {
    const state = createScroll();
    state._setMaxScroll(100);
    state.scrollTo(50);
    state.scrollToTop();
    expect(state.scrollTop()).toBe(0);
  });

  it('should scrollToBottom', () => {
    const state = createScroll();
    state._setMaxScroll(100);
    state.scrollToBottom();
    expect(state.scrollTop()).toBe(100);
  });

  it('should pageUp', () => {
    const state = createScroll({ height: 10 });
    state._setMaxScroll(100);
    state.scrollTo(50);
    state.pageUp();
    expect(state.scrollTop()).toBe(41); // 50 - (10 - 1)
  });

  it('should pageDown', () => {
    const state = createScroll({ height: 10 });
    state._setMaxScroll(100);
    state.pageDown();
    expect(state.scrollTop()).toBe(9); // 0 + (10 - 1)
  });

  it('should update height via _setHeight', () => {
    const state = createScroll();
    state._setHeight(20);
    state._setMaxScroll(100);
    state.pageDown();
    expect(state.scrollTop()).toBe(19); // 0 + (20 - 1)
  });
});

describe('useScroll', () => {
  it('should return scroll control interface', () => {
    const scroll = useScroll();

    expect(scroll.scrollToTop).toBeDefined();
    expect(scroll.scrollToBottom).toBeDefined();
    expect(scroll.scrollTo).toBeDefined();
    expect(scroll.scrollBy).toBeDefined();
    expect(scroll.scrollTop).toBeDefined();
    expect(scroll.maxScroll).toBeDefined();
    expect(scroll.bind).toBeDefined();
    expect(scroll.bind.state).toBeDefined();
  });

  it('should provide working methods', () => {
    const scroll = useScroll();

    // Should not throw
    scroll.scrollToTop();
    scroll.scrollToBottom();
    scroll.scrollTo(5);
    scroll.scrollBy(1);

    expect(scroll.scrollTop()).toBeDefined();
    expect(scroll.maxScroll()).toBeDefined();
  });

  it('should update rendered output when controlled programmatically', () => {
    const scroll = useScroll();
    const lines = Array.from({ length: 8 }, (_, i) => Text({}, `Line ${i + 1}`));

    const initial = Scroll(
      { ...scroll.bind, height: 3, width: 40 },
      ...lines
    );
    expect(renderToString(initial, 40)).toContain('Line 1');

    scroll.scrollBy(2);

    const rerendered = Scroll(
      { ...scroll.bind, height: 3, width: 40 },
      ...lines
    );
    const output = renderToString(rerendered, 40);

    expect(output).toContain('Line 3');
    expect(output).not.toContain('Line 1');
  });
});

describe('external state', () => {
  it('should use external state when provided', () => {
    const state = createScroll();
    const node = Scroll(
      { state, height: 5, width: 40 },
      Text({}, 'Content')
    );

    const output = renderToString(node, 40);
    expect(output).toContain('Content');
  });

  it('should use useScroll bind with Scroll', () => {
    const scroll = useScroll();
    const node = Scroll(
      { ...scroll.bind, height: 5, width: 40 },
      Text({}, 'Controlled content')
    );

    const output = renderToString(node, 40);
    expect(output).toContain('Controlled content');
  });
});

describe('keyboard handling', () => {
  beforeEach(() => {
    capturedInputHandler = null;
    capturedOptions = null;
  });

  it('should register input handler when rendering', () => {
    const lines = Array.from({ length: 20 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40 }, ...lines);

    expect(capturedInputHandler).toBeDefined();
    expect(capturedOptions).toBeDefined();
  });

  it('should respect isActive option', () => {
    const lines = Array.from({ length: 20 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, isActive: false }, ...lines);

    expect(capturedOptions?.isActive).toBe(false);
  });

  it('should scroll up with upArrow key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);
    state.scrollTo(10);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    // Simulate upArrow key press
    capturedInputHandler?.('', { upArrow: true });
    expect(state.scrollTop()).toBe(9);
  });

  it('should scroll down with downArrow key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    // Simulate downArrow key press
    capturedInputHandler?.('', { downArrow: true });
    expect(state.scrollTop()).toBe(1);
  });

  it('should scroll up with vim k key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);
    state.scrollTo(10);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('k', {});
    expect(state.scrollTop()).toBe(9);
  });

  it('should scroll down with vim j key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('j', {});
    expect(state.scrollTop()).toBe(1);
  });

  it('should page up with pageUp key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);
    state.scrollTo(10);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('', { pageUp: true });
    expect(state.scrollTop()).toBe(6); // 10 - (5-1)
  });

  it('should page down with pageDown key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('', { pageDown: true });
    expect(state.scrollTop()).toBe(4); // 0 + (5-1)
  });

  it('should page up with vim u key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);
    state.scrollTo(10);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('u', {});
    expect(state.scrollTop()).toBe(6);
  });

  it('should page down with vim d key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('d', {});
    expect(state.scrollTop()).toBe(4);
  });

  it('should scroll to top with home key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);
    state.scrollTo(10);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('', { home: true });
    expect(state.scrollTop()).toBe(0);
  });

  it('should scroll to bottom with end key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('', { end: true });
    expect(state.scrollTop()).toBe(20);
  });

  it('should scroll to top with vim g key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);
    state.scrollTo(10);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('g', {});
    expect(state.scrollTop()).toBe(0);
  });

  it('should scroll to bottom with vim G key', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    capturedInputHandler?.('G', {});
    expect(state.scrollTop()).toBe(20);
  });

  it('should not scroll when keysEnabled is false', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state, keysEnabled: false }, ...lines);

    // Handler is called but should return early
    capturedInputHandler?.('', { downArrow: true });
    expect(state.scrollTop()).toBe(0);
  });

  it('should use custom scrollStep', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state, scrollStep: 3 }, ...lines);

    capturedInputHandler?.('', { downArrow: true });
    expect(state.scrollTop()).toBe(3);
  });

  it('should ignore unrecognized keys', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);
    state.scrollTo(10);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    Scroll({ height: 5, width: 40, state }, ...lines);

    // Unrecognized key should not change scroll position
    capturedInputHandler?.('x', { leftArrow: true });
    expect(state.scrollTop()).toBe(10);
  });
});

describe('mouse scroll handling', () => {
  it('should scroll up on scroll-up event', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);
    state.scrollTo(10);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    const node = Scroll({ height: 5, width: 40, state }, ...lines);

    // Get the onScroll handler from the node props
    const onScroll = (node as any).props.onScroll;
    expect(onScroll).toBeDefined();

    onScroll({ button: 'scroll-up' });
    expect(state.scrollTop()).toBe(7); // 10 - 3
  });

  it('should scroll down on scroll-down event', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    const node = Scroll({ height: 5, width: 40, state }, ...lines);

    const onScroll = (node as any).props.onScroll;
    onScroll({ button: 'scroll-down' });
    expect(state.scrollTop()).toBe(3); // 0 + 3
  });

  it('should ignore other button events', () => {
    const state = createScroll({ height: 5 });
    state._setMaxScroll(20);
    state.scrollTo(10);

    const lines = Array.from({ length: 25 }, (_, i) => Text({}, `Line ${i + 1}`));
    const node = Scroll({ height: 5, width: 40, state }, ...lines);

    const onScroll = (node as any).props.onScroll;
    onScroll({ button: 'left' });
    expect(state.scrollTop()).toBe(10);
  });
});
