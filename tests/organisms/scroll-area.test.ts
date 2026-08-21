import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ScrollArea as OwnedScrollArea,
  VirtualList as OwnedVirtualList,
  ScrollableText as OwnedScrollableText,
  LogViewer as OwnedLogViewer,
  createScrollArea,
  createVirtualList,
  type ScrollAreaOptions,
  type ScrollAreaState,
  type VirtualListOptions,
  type VirtualListState,
  type VirtualListItem,
} from '../../src/organisms/scroll-area.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { renderOnce } from '../../src/app/render-loop.js';
import { beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { testComponent } from '../../src/testing/component.js';

const ScrollArea = testComponent(OwnedScrollArea);
const VirtualList = testComponent(OwnedVirtualList);
const ScrollableText = testComponent(OwnedScrollableText);
const LogViewer = testComponent(OwnedLogViewer);

describe('ScrollArea', () => {
  // ==========================================================================
  // createScrollArea State Factory
  // ==========================================================================
  describe('createScrollArea', () => {
    const defaultContent = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);
    let state: ScrollAreaState;

    beforeEach(() => {
      state = createScrollArea({
        height: 5,
        content: defaultContent,
      });
    });

    describe('initial state', () => {
      it('should start at scrollTop 0', () => {
        expect(state.scrollTop()).toBe(0);
      });

      it('should calculate correct maxScroll', () => {
        expect(state.maxScroll()).toBe(15); // 20 - 5
      });

      it('should return visible items', () => {
        const visible = state.visibleItems();
        expect(visible).toHaveLength(5);
        expect(visible[0]).toBe('Line 1');
        expect(visible[4]).toBe('Line 5');
      });

      it('should respect initialScrollTop', () => {
        const stateWithInitial = createScrollArea({
          height: 5,
          content: defaultContent,
          initialScrollTop: 5,
        });
        expect(stateWithInitial.scrollTop()).toBe(5);
        expect(stateWithInitial.visibleItems()[0]).toBe('Line 6');
      });
    });

    describe('scrollTo', () => {
      it('should scroll to position', () => {
        state.scrollTo(5);
        expect(state.scrollTop()).toBe(5);
      });

      it('should clamp to maxScroll', () => {
        state.scrollTo(100);
        expect(state.scrollTop()).toBe(15);
      });

      it('should clamp to 0', () => {
        state.scrollTo(-10);
        expect(state.scrollTop()).toBe(0);
      });

      it('should call onScroll callback', () => {
        const onScroll = vi.fn();
        const stateWithCallback = createScrollArea({
          height: 5,
          content: defaultContent,
          onScroll,
        });
        stateWithCallback.scrollTo(5);
        expect(onScroll).toHaveBeenCalledWith(5);
      });

      it('should not call onScroll if position unchanged', () => {
        const onScroll = vi.fn();
        const stateWithCallback = createScrollArea({
          height: 5,
          content: defaultContent,
          onScroll,
        });
        stateWithCallback.scrollTo(0); // Already at 0
        expect(onScroll).not.toHaveBeenCalled();
      });
    });

    describe('scrollBy', () => {
      it('should scroll by delta', () => {
        state.scrollBy(3);
        expect(state.scrollTop()).toBe(3);
      });

      it('should scroll up with negative delta', () => {
        state.scrollTo(5);
        state.scrollBy(-2);
        expect(state.scrollTop()).toBe(3);
      });
    });

    describe('scrollToTop', () => {
      it('should scroll to top', () => {
        state.scrollTo(10);
        state.scrollToTop();
        expect(state.scrollTop()).toBe(0);
      });
    });

    describe('scrollToBottom', () => {
      it('should scroll to bottom', () => {
        state.scrollToBottom();
        expect(state.scrollTop()).toBe(15);
      });
    });

    describe('pageUp', () => {
      it('should scroll up by page size', () => {
        state.scrollTo(10);
        state.pageUp();
        expect(state.scrollTop()).toBe(6); // 10 - (5 - 1)
      });

      it('should respect custom pageSize', () => {
        const stateWithPageSize = createScrollArea({
          height: 5,
          content: defaultContent,
          pageSize: 3,
          initialScrollTop: 10,
        });
        stateWithPageSize.pageUp();
        expect(stateWithPageSize.scrollTop()).toBe(7); // 10 - 3
      });
    });

    describe('pageDown', () => {
      it('should scroll down by page size', () => {
        state.pageDown();
        expect(state.scrollTop()).toBe(4); // 0 + (5 - 1)
      });
    });

    describe('edge cases', () => {
      it('should handle content shorter than height', () => {
        const shortState = createScrollArea({
          height: 10,
          content: ['Line 1', 'Line 2'],
        });
        expect(shortState.maxScroll()).toBe(0);
        expect(shortState.visibleItems()).toHaveLength(2);
      });

      it('should handle empty content', () => {
        const emptyState = createScrollArea({
          height: 5,
          content: [],
        });
        expect(emptyState.maxScroll()).toBe(0);
        expect(emptyState.visibleItems()).toHaveLength(0);
      });
    });
  });

  // ==========================================================================
  // ScrollArea Component
  // ==========================================================================
  describe('ScrollArea component', () => {
    const content = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);

    it('should render without errors', () => {
      const output = renderOnce(ScrollArea({ height: 5, content }));
      expect(output).toBeDefined();
    });

    it('should show visible content', () => {
      const output = renderOnce(ScrollArea({ height: 5, content }));
      expect(output).toContain('Line 1');
      expect(output).toContain('Line 5');
    });

    it('should show scrollbar when content exceeds height', () => {
      const output = renderOnce(ScrollArea({
        height: 5,
        content,
        showScrollbar: true,
      }));
      expect(output.length).toBeGreaterThan(0);
    });

    it('should hide scrollbar when disabled', () => {
      const node = ScrollArea({
        height: 5,
        content,
        showScrollbar: false,
      });
      expect(node).toBeDefined();
    });

    it('should accept custom scrollbar colors', () => {
      const node = ScrollArea({
        height: 5,
        content,
        scrollbarColor: 'cyan',
        trackColor: 'gray',
      });
      expect(node).toBeDefined();
    });

    it('should accept external state', () => {
      const externalState = createScrollArea({
        height: 5,
        content,
        initialScrollTop: 5,
      });
      const output = renderOnce(ScrollArea({
        height: 5,
        content,
        state: externalState,
      }));
      expect(output).toContain('Line 6');
    });

    it('should render VNode content', () => {
      const vnodeContent = [
        Text({ color: 'red' }, 'Red text'),
        Text({ color: 'blue' }, 'Blue text'),
      ];
      const node = ScrollArea({
        height: 5,
        content: vnodeContent,
      });
      expect(node).toBeDefined();
    });

    it('should pad with empty lines if content is shorter', () => {
      const shortContent = ['Line 1', 'Line 2'];
      const node = ScrollArea({
        height: 5,
        content: shortContent,
      });
      expect(node).toBeDefined();
    });

    it('should accept width prop', () => {
      const node = ScrollArea({
        height: 5,
        content,
        width: 40,
      });
      expect(node).toBeDefined();
    });

    it('should accept scrollStep prop', () => {
      const node = ScrollArea({
        height: 5,
        content,
        scrollStep: 3,
      });
      expect(node).toBeDefined();
    });

    it('should handle isActive=false', () => {
      const node = ScrollArea({
        height: 5,
        content,
        isActive: false,
      });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // createVirtualList State Factory
  // ==========================================================================
  describe('createVirtualList', () => {
    const items: VirtualListItem<{ name: string }>[] = Array.from(
      { length: 20 },
      (_, i) => ({ key: `item-${i}`, data: { name: `Item ${i + 1}` } })
    );

    let state: VirtualListState<{ name: string }>;

    beforeEach(() => {
      state = createVirtualList({
        items,
        height: 5,
        renderItem: (item) => Text({}, item.data.name),
      });
    });

    describe('initial state', () => {
      it('should start at selectedIndex 0', () => {
        expect(state.selectedIndex()).toBe(0);
      });

      it('should start at scrollTop 0', () => {
        expect(state.scrollTop()).toBe(0);
      });

      it('should return visible items', () => {
        const visible = state.visibleItems();
        expect(visible).toHaveLength(5);
        expect(visible[0]?.item.data.name).toBe('Item 1');
      });

      it('should respect initialSelected', () => {
        const stateWithInitial = createVirtualList({
          items,
          height: 5,
          initialSelected: 10,
          renderItem: (item) => Text({}, item.data.name),
        });
        expect(stateWithInitial.selectedIndex()).toBe(10);
      });
    });

    describe('selectIndex', () => {
      it('should select item at index', () => {
        state.selectIndex(5);
        expect(state.selectedIndex()).toBe(5);
      });

      it('should clamp to valid range', () => {
        state.selectIndex(100);
        expect(state.selectedIndex()).toBe(19);
      });

      it('should clamp negative to 0', () => {
        state.selectIndex(-10);
        expect(state.selectedIndex()).toBe(0);
      });

      it('should call onSelect callback', () => {
        const onSelect = vi.fn();
        const stateWithCallback = createVirtualList({
          items,
          height: 5,
          renderItem: (item) => Text({}, item.data.name),
          onSelect,
        });
        stateWithCallback.selectIndex(5);
        expect(onSelect).toHaveBeenCalledWith(items[5], 5);
      });

      it('should ensure selected item is visible', () => {
        state.selectIndex(10);
        const visible = state.visibleItems();
        const selectedInView = visible.some((v) => v.index === 10);
        expect(selectedInView).toBe(true);
      });
    });

    describe('selectPrev', () => {
      it('should select previous item', () => {
        state.selectIndex(5);
        state.selectPrev();
        expect(state.selectedIndex()).toBe(4);
      });

      it('should not go below 0', () => {
        state.selectPrev();
        expect(state.selectedIndex()).toBe(0);
      });
    });

    describe('selectNext', () => {
      it('should select next item', () => {
        state.selectNext();
        expect(state.selectedIndex()).toBe(1);
      });

      it('should not go beyond last item', () => {
        state.selectIndex(19);
        state.selectNext();
        expect(state.selectedIndex()).toBe(19);
      });
    });

    describe('selectFirst', () => {
      it('should select first item', () => {
        state.selectIndex(10);
        state.selectFirst();
        expect(state.selectedIndex()).toBe(0);
      });
    });

    describe('selectLast', () => {
      it('should select last item', () => {
        state.selectLast();
        expect(state.selectedIndex()).toBe(19);
      });
    });

    describe('pageUp', () => {
      it('should move up by page', () => {
        state.selectIndex(10);
        state.pageUp();
        expect(state.selectedIndex()).toBe(6); // 10 - (5 - 1)
      });
    });

    describe('pageDown', () => {
      it('should move down by page', () => {
        state.pageDown();
        expect(state.selectedIndex()).toBe(4); // 0 + (5 - 1)
      });
    });

    describe('activate', () => {
      it('should call onActivate with selected item', () => {
        const onActivate = vi.fn();
        const stateWithCallback = createVirtualList({
          items,
          height: 5,
          renderItem: (item) => Text({}, item.data.name),
          onActivate,
        });
        stateWithCallback.selectIndex(3);
        stateWithCallback.activate();
        expect(onActivate).toHaveBeenCalledWith(items[3], 3);
      });
    });
  });

  // ==========================================================================
  // VirtualList Component
  // ==========================================================================
  describe('VirtualList component', () => {
    const items: VirtualListItem<{ name: string }>[] = Array.from(
      { length: 20 },
      (_, i) => ({ key: `item-${i}`, data: { name: `Item ${i + 1}` } })
    );

    const renderItem = (item: VirtualListItem<{ name: string }>, index: number, isSelected: boolean) =>
      Text({ color: isSelected ? 'cyan' : 'white' }, item.data.name);

    it('should render without errors', () => {
      const output = renderOnce(VirtualList({ items, height: 5, renderItem }));
      expect(output).toBeDefined();
    });

    it('should show visible items', () => {
      const output = renderOnce(VirtualList({ items, height: 5, renderItem }));
      expect(output).toContain('Item 1');
    });

    it('should highlight selected item', () => {
      const output = renderOnce(VirtualList({
        items,
        height: 5,
        renderItem,
        initialSelected: 2,
      }));
      expect(output).toContain('Item 3');
    });

    it('should accept external state', () => {
      const externalState = createVirtualList({
        items,
        height: 5,
        initialSelected: 5,
        renderItem,
      });
      const node = VirtualList({
        items,
        height: 5,
        renderItem,
        state: externalState,
      });
      expect(node).toBeDefined();
    });

    it('should show scrollbar when items exceed height', () => {
      const node = VirtualList({
        items,
        height: 5,
        renderItem,
        showScrollbar: true,
      });
      expect(node).toBeDefined();
    });

    it('should hide scrollbar when disabled', () => {
      const node = VirtualList({
        items,
        height: 5,
        renderItem,
        showScrollbar: false,
      });
      expect(node).toBeDefined();
    });

    it('should accept width prop', () => {
      const node = VirtualList({
        items,
        height: 5,
        renderItem,
        width: 40,
      });
      expect(node).toBeDefined();
    });

    it('should handle isActive=false', () => {
      const node = VirtualList({
        items,
        height: 5,
        renderItem,
        isActive: false,
      });
      expect(node).toBeDefined();
    });

    it('should pad with empty lines if needed', () => {
      const shortItems = items.slice(0, 3);
      const node = VirtualList({
        items: shortItems,
        height: 5,
        renderItem,
      });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // ScrollableText
  // ==========================================================================
  describe('ScrollableText', () => {
    const longText = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`).join('\n');

    it('should render without errors', () => {
      const output = renderOnce(ScrollableText({ text: longText, height: 5 }));
      expect(output).toBeDefined();
    });

    it('should show first lines', () => {
      const output = renderOnce(ScrollableText({ text: longText, height: 5 }));
      expect(output).toContain('Line 1');
    });

    it('should accept custom color', () => {
      const node = ScrollableText({ text: longText, height: 5, color: 'cyan' });
      expect(node).toBeDefined();
    });

    it('should accept width prop', () => {
      const node = ScrollableText({ text: longText, height: 5, width: 40 });
      expect(node).toBeDefined();
    });

    it('should toggle scrollbar', () => {
      const node = ScrollableText({ text: longText, height: 5, showScrollbar: false });
      expect(node).toBeDefined();
    });

    it('should handle isActive=false', () => {
      const node = ScrollableText({ text: longText, height: 5, isActive: false });
      expect(node).toBeDefined();
    });
  });

  // ==========================================================================
  // LogViewer
  // ==========================================================================
  describe('LogViewer', () => {
    const logLines = Array.from({ length: 30 }, (_, i) => {
      const type = i % 3 === 0 ? 'ERROR' : i % 3 === 1 ? 'WARN' : 'INFO';
      return `[${type}] Log message ${i + 1}`;
    });

    it('should render without errors', () => {
      const output = renderOnce(LogViewer({ lines: logLines, height: 10 }));
      expect(output).toBeDefined();
    });

    it('should auto-scroll to bottom by default', () => {
      const node = LogViewer({ lines: logLines, height: 10, autoScroll: true });
      expect(node).toBeDefined();
    });

    it('should disable auto-scroll when specified', () => {
      const node = LogViewer({ lines: logLines, height: 10, autoScroll: false });
      expect(node).toBeDefined();
    });

    it('should preserve its internal scroll state across renders', () => {
      const initialLines = Array.from({ length: 30 }, (_, index) =>
        `entry-${String(index).padStart(2, '0')}`
      );
      const updatedLines = [...initialLines, 'entry-30'];

      resetHookState();
      beginRender('component');
      LogViewer({ lines: initialLines, height: 10, autoScroll: true });
      endRender();

      beginRender('component');
      const updated = LogViewer({
        lines: updatedLines,
        height: 10,
        autoScroll: false,
      });
      endRender();

      const output = renderOnce(updated);
      expect(output).toContain('entry-20');
      expect(output).not.toContain('entry-00');
      resetHookState();
    });

    it('should accept external state', () => {
      const state = createScrollArea({
        height: 10,
        content: logLines,
        initialScrollTop: 5,
      });
      const output = renderOnce(LogViewer({
        lines: logLines,
        height: 10,
        autoScroll: false,
        state,
      }));

      expect(output).toContain('Log message 6');
    });

    it('should show line numbers when enabled', () => {
      const output = renderOnce(LogViewer({
        lines: logLines,
        height: 10,
        showLineNumbers: true,
      }));
      expect(output).toBeDefined();
    });

    it('should highlight matching patterns', () => {
      const node = LogViewer({
        lines: logLines,
        height: 10,
        highlightPattern: /ERROR/i,
        highlightColor: 'red',
      });
      expect(node).toBeDefined();
    });

    it('should handle isActive=false', () => {
      const node = LogViewer({ lines: logLines, height: 10, isActive: false });
      expect(node).toBeDefined();
    });

    it('should handle empty lines', () => {
      const node = LogViewer({ lines: [], height: 10 });
      expect(node).toBeDefined();
    });

    it('should handle short content', () => {
      const node = LogViewer({ lines: ['Line 1', 'Line 2'], height: 10 });
      expect(node).toBeDefined();
    });
  });
});
