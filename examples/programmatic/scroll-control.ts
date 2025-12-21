/**
 * Programmatic Scroll Control Example
 *
 * Demonstrates controlling scroll position programmatically:
 * - External scroll state management
 * - API-driven scroll commands (scrollToItem, scrollBy, scrollToTop, scrollToBottom)
 * - Timer-based auto-scroll
 * - No keyboard focus required for scroll control
 *
 * Run with: npx tsx examples/programmatic/scroll-control.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  createSignal,
  createEffect,
  setTheme,
  darkTheme,
} from '../../src/index.js';

setTheme(darkTheme);

/**
 * External scroll state - can be controlled from anywhere
 */
interface ScrollState {
  items: string[];
  visibleCount: number;
  scrollOffset: number;
  selectedIndex: number;
}

function createScrollController(items: string[], visibleCount: number) {
  const [state, setState] = createSignal<ScrollState>({
    items,
    visibleCount,
    scrollOffset: 0,
    selectedIndex: 0,
  });

  return {
    // State getter
    state,

    // Programmatic scroll methods
    scrollToItem(index: number, align: 'start' | 'center' | 'end' = 'center') {
      setState((s) => {
        const safeIndex = Math.max(0, Math.min(index, s.items.length - 1));
        let newOffset: number;

        switch (align) {
          case 'start':
            newOffset = safeIndex;
            break;
          case 'end':
            newOffset = Math.max(0, safeIndex - s.visibleCount + 1);
            break;
          case 'center':
          default:
            newOffset = Math.max(0, safeIndex - Math.floor(s.visibleCount / 2));
        }

        // Clamp offset to valid range
        newOffset = Math.max(0, Math.min(newOffset, s.items.length - s.visibleCount));

        return { ...s, scrollOffset: newOffset, selectedIndex: safeIndex };
      });
    },

    scrollBy(delta: number) {
      setState((s) => {
        const newOffset = Math.max(0, Math.min(s.scrollOffset + delta, s.items.length - s.visibleCount));
        return { ...s, scrollOffset: newOffset };
      });
    },

    scrollToTop() {
      setState((s) => ({ ...s, scrollOffset: 0, selectedIndex: 0 }));
    },

    scrollToBottom() {
      setState((s) => {
        const maxOffset = Math.max(0, s.items.length - s.visibleCount);
        return { ...s, scrollOffset: maxOffset, selectedIndex: s.items.length - 1 };
      });
    },

    select(index: number) {
      setState((s) => {
        const safeIndex = Math.max(0, Math.min(index, s.items.length - 1));
        return { ...s, selectedIndex: safeIndex };
      });
    },

    selectNext() {
      setState((s) => {
        const newIndex = Math.min(s.selectedIndex + 1, s.items.length - 1);
        // Auto-scroll to keep selection visible
        let newOffset = s.scrollOffset;
        if (newIndex >= s.scrollOffset + s.visibleCount) {
          newOffset = newIndex - s.visibleCount + 1;
        }
        return { ...s, selectedIndex: newIndex, scrollOffset: newOffset };
      });
    },

    selectPrev() {
      setState((s) => {
        const newIndex = Math.max(s.selectedIndex - 1, 0);
        let newOffset = s.scrollOffset;
        if (newIndex < s.scrollOffset) {
          newOffset = newIndex;
        }
        return { ...s, selectedIndex: newIndex, scrollOffset: newOffset };
      });
    },

    // Get visible items
    getVisibleItems() {
      const s = state();
      return s.items.slice(s.scrollOffset, s.scrollOffset + s.visibleCount);
    },

    // Check if index is visible
    isVisible(index: number) {
      const s = state();
      return index >= s.scrollOffset && index < s.scrollOffset + s.visibleCount;
    },
  };
}

// Generate sample data
const items = Array.from({ length: 100 }, (_, i) => `Log entry #${(i + 1).toString().padStart(3, '0')} - ${new Date(Date.now() - (100 - i) * 60000).toISOString()}`);

// Create controller OUTSIDE the component - can be accessed anywhere
const scrollController = createScrollController(items, 8);

function ProgrammaticScrollDemo() {
  const app = useApp();
  const [autoScroll, setAutoScroll] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(1000);

  // Auto-scroll effect (controlled externally)
  createEffect(() => {
    if (!autoScroll()) return;

    const interval = setInterval(() => {
      scrollController.selectNext();
    }, autoScrollSpeed());

    return () => clearInterval(interval);
  });

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }

    // Manual navigation (but could also be triggered programmatically)
    if (key.upArrow) scrollController.selectPrev();
    if (key.downArrow) scrollController.selectNext();
    if (key.pageUp) scrollController.scrollBy(-5);
    if (key.pageDown) scrollController.scrollBy(5);
    if (key.home) scrollController.scrollToTop();
    if (key.end) scrollController.scrollToBottom();

    // Programmatic controls
    if (input === 'a') setAutoScroll((v) => !v);
    if (input === '+') setAutoScrollSpeed((s) => Math.max(100, s - 200));
    if (input === '-') setAutoScrollSpeed((s) => Math.min(3000, s + 200));

    // Jump to specific positions (programmatically)
    if (input === '1') scrollController.scrollToItem(0);
    if (input === '2') scrollController.scrollToItem(24);
    if (input === '3') scrollController.scrollToItem(49, 'center');
    if (input === '4') scrollController.scrollToItem(74);
    if (input === '5') scrollController.scrollToItem(99);
  });

  const state = scrollController.state();
  const visibleItems = scrollController.getVisibleItems();

  return Box(
    { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'cyan' },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: 'cyan', bold: true }, ' Programmatic Scroll Control ')
    ),

    // Controls info
    Box(
      { marginBottom: 1, flexDirection: 'column' },
      Box(
        {},
        Text({ color: 'yellow' }, 'Auto-scroll: '),
        Text({ color: autoScroll() ? 'green' : 'gray' }, autoScroll() ? 'ON' : 'OFF'),
        Text({ color: 'gray' }, ` (${autoScrollSpeed()}ms) `)
      ),
      Box(
        {},
        Text({ color: 'gray' }, 'Position: '),
        Text({ color: 'white' }, `${state.selectedIndex + 1}`),
        Text({ color: 'gray' }, ` / ${state.items.length}`)
      )
    ),

    // Progress bar
    Box(
      { marginBottom: 1 },
      Text({ color: 'cyan' }, '['),
      Text({ color: 'cyan' }, '█'.repeat(Math.floor((state.selectedIndex / 99) * 30))),
      Text({ color: 'gray' }, '░'.repeat(30 - Math.floor((state.selectedIndex / 99) * 30))),
      Text({ color: 'cyan' }, ']')
    ),

    // Scrollable list
    Box(
      { flexDirection: 'column', borderStyle: 'single', borderColor: 'gray' },
      ...visibleItems.map((item, i) => {
        const actualIndex = state.scrollOffset + i;
        const isSelected = actualIndex === state.selectedIndex;
        return Box(
          { key: `item-${actualIndex}`, paddingX: 1 },
          Text(
            {
              color: isSelected ? 'cyan' : 'white',
              bold: isSelected,
              inverse: isSelected,
            },
            isSelected ? ` ${item} ` : item
          )
        );
      })
    ),

    // Quick jump buttons info
    Box(
      { marginTop: 1, flexDirection: 'column' },
      Text({ color: 'gray', dim: true }, 'Quick jump: [1] Start  [2] 25%  [3] 50%  [4] 75%  [5] End'),
      Text({ color: 'gray', dim: true }, '[A] Toggle auto-scroll  [+/-] Speed  [Q] Exit')
    ),

    // API usage hint
    Box(
      { marginTop: 1, borderStyle: 'single', borderColor: 'yellow', padding: 1 },
      Box(
        { flexDirection: 'column' },
        Text({ color: 'yellow', bold: true }, 'Programmatic API:'),
        Text({ color: 'gray' }, 'scrollController.scrollToItem(50, "center")'),
        Text({ color: 'gray' }, 'scrollController.scrollBy(-10)'),
        Text({ color: 'gray' }, 'scrollController.selectNext()'),
        Text({ color: 'gray' }, 'scrollController.scrollToBottom()')
      )
    )
  );
}

// Run the demo
const { waitUntilExit } = render(ProgrammaticScrollDemo);
await waitUntilExit();
