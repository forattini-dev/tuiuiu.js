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

// Mock useInput to prevent actual input handling
vi.mock('../../src/hooks/index.js', () => ({
  useInput: vi.fn(),
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
