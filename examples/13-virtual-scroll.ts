/**
 * Virtual Scroll Example
 *
 * Showcases virtual scrolling using VirtualList component:
 * - Fixed height items
 * - Large dataset handling
 * - Keyboard navigation
 *
 * Run with: npx tsx examples/13-virtual-scroll.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  VirtualList,
  createVirtualList,
  Divider,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

type DemoType = 'basic' | 'large' | 'styled';

// Generate sample data
function generateItems(count: number): Array<{ id: number; title: string; description: string }> {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    title: `Item ${i + 1}`,
    description: `This is item number ${i + 1} with some content.`,
  }));
}

function VirtualScrollDemo() {
  const app = useApp();
  const [activeDemo, setActiveDemo] = useState<DemoType>('basic');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const height = 12; // Visible height

  // Small dataset for basic demo
  const basicItems = generateItems(50);

  // Large dataset
  const [largeItems] = useState(() => generateItems(10000));

  // Create virtual list states
  const [basicList, setBasicList] = useState(() =>
    createVirtualList<{ id: number; title: string; description: string }>({
      items: basicItems,
      height,
      itemHeight: 3,
      selectedIndex: 0,
    })
  );

  const [largeList, setLargeList] = useState(() =>
    createVirtualList<{ id: number; title: string; description: string }>({
      items: largeItems(),
      height,
      itemHeight: 3,
      selectedIndex: 0,
    })
  );

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
    if (input === '1') {
      setActiveDemo('basic');
      setSelectedIndex(0);
    }
    if (input === '2') {
      setActiveDemo('large');
      setSelectedIndex(0);
    }
    if (input === '3') {
      setActiveDemo('styled');
      setSelectedIndex(0);
    }

    // Navigation
    const getMaxIndex = () => {
      return activeDemo() === 'basic' ? 49 :
             activeDemo() === 'large' ? 9999 : 49;
    };

    if (key.upArrow) {
      setSelectedIndex(i => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(i => Math.min(getMaxIndex(), i + 1));
    }
    if (key.pageUp) {
      setSelectedIndex(i => Math.max(0, i - 10));
    }
    if (key.pageDown) {
      setSelectedIndex(i => Math.min(getMaxIndex(), i + 10));
    }
    if (key.home) {
      setSelectedIndex(0);
    }
    if (key.end) {
      setSelectedIndex(getMaxIndex());
    }
  });

  const renderItem = (item: { id: number; title: string }, index: number, isSelected: boolean) => {
    return Box(
      {
        key: `item-${item.id}`,
        borderStyle: isSelected ? 'double' : 'single',
        borderColor: isSelected ? 'cyan' : 'gray',
        paddingX: 1,
      },
      Text({ color: isSelected ? 'cyan' : 'white', bold: isSelected }, `#${item.id}: ${item.title}`)
    );
  };

  const renderStyledItem = (item: { id: number; title: string; description: string }, index: number, isSelected: boolean) => {
    const colors = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];
    const color = colors[index % colors.length];

    return Box(
      {
        key: `item-${item.id}`,
        flexDirection: 'column',
        borderStyle: isSelected ? 'double' : 'round',
        borderColor: isSelected ? 'white' : color,
        paddingX: 1,
      },
      Text({ color: isSelected ? 'white' : color as any, bold: isSelected }, `✨ ${item.title}`),
      Text({ color: 'gray', dim: true }, item.description)
    );
  };

  const renderDemo = () => {
    switch (activeDemo()) {
      case 'basic': {
        // Calculate visible items manually for demo
        const idx = selectedIndex();
        const startIdx = Math.max(0, idx - Math.floor(height / 3));
        const endIdx = Math.min(basicItems.length, startIdx + Math.floor(height / 3) + 1);
        const visibleItems = basicItems.slice(startIdx, endIdx);

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Basic Virtual Scroll'),
          Text({ color: 'gray', marginBottom: 1 }, `50 items. Selected: #${idx + 1}`),

          // Progress bar
          Box(
            { marginBottom: 1 },
            Text({ color: 'gray' }, 'Position: '),
            Text({ color: 'cyan' }, '['),
            Text({ color: 'cyan' }, '█'.repeat(Math.floor((idx / 49) * 20))),
            Text({ color: 'gray' }, '░'.repeat(20 - Math.floor((idx / 49) * 20))),
            Text({ color: 'cyan' }, ']'),
            Text({ color: 'gray' }, ` ${Math.round((idx / 49) * 100)}%`)
          ),

          // Items
          Box(
            { flexDirection: 'column' },
            ...visibleItems.map((item, i) =>
              renderItem(item, startIdx + i, startIdx + i === idx)
            )
          ),

          Text({ color: 'gray', dim: true, marginTop: 1 }, `Showing items ${startIdx + 1}-${endIdx}`)
        );
      }

      case 'large': {
        const idx = selectedIndex();
        const items = largeItems();
        const startIdx = Math.max(0, idx - Math.floor(height / 3));
        const endIdx = Math.min(items.length, startIdx + Math.floor(height / 3) + 1);
        const visibleItems = items.slice(startIdx, endIdx);

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'yellow', bold: true, marginBottom: 1 }, 'Large Dataset (10,000 items)'),
          Text({ color: 'gray', marginBottom: 1 }, `Only ${visibleItems.length} items rendered. Selected: #${idx + 1}`),

          // Performance info
          Box(
            { marginBottom: 1 },
            Text({ color: 'green' }, '✓ '),
            Text({ color: 'gray' }, 'Memory efficient - only visible items in DOM'),
          ),

          // Progress bar
          Box(
            { marginBottom: 1 },
            Text({ color: 'gray' }, 'Position: '),
            Text({ color: 'yellow' }, '['),
            Text({ color: 'yellow' }, '█'.repeat(Math.floor((idx / 9999) * 20))),
            Text({ color: 'gray' }, '░'.repeat(20 - Math.floor((idx / 9999) * 20))),
            Text({ color: 'yellow' }, ']'),
            Text({ color: 'gray' }, ` ${Math.round((idx / 9999) * 100)}%`)
          ),

          // Items
          Box(
            { flexDirection: 'column' },
            ...visibleItems.map((item, i) =>
              renderItem(item, startIdx + i, startIdx + i === idx)
            )
          ),

          Text({ color: 'gray', dim: true, marginTop: 1 }, `Item ${idx + 1} of 10,000`)
        );
      }

      case 'styled': {
        const idx = selectedIndex();
        const startIdx = Math.max(0, idx - 2);
        const endIdx = Math.min(basicItems.length, startIdx + 4);
        const visibleItems = basicItems.slice(startIdx, endIdx);

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'magenta', bold: true, marginBottom: 1 }, 'Styled Virtual Scroll'),
          Text({ color: 'gray', marginBottom: 1 }, 'Custom rendering with colors and icons'),

          // Items with styled rendering
          Box(
            { flexDirection: 'column' },
            ...visibleItems.map((item, i) =>
              renderStyledItem(item, startIdx + i, startIdx + i === idx)
            )
          ),

          Text({ color: 'gray', dim: true, marginTop: 1 }, `Use arrow keys to navigate, colors cycle`)
        );
      }

      default:
        return Text({}, 'Select a demo');
    }
  };

  return Box(
    {
      flexDirection: 'column',
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    },
    // Header
    Box(
      { marginBottom: 1 },
      Text({ color: 'cyan', bold: true }, ' Virtual Scroll Demo ')
    ),

    // Navigation
    Box(
      { marginBottom: 1 },
      Text({ color: activeDemo() === 'basic' ? 'cyan' : 'gray' }, '[1] Basic  '),
      Text({ color: activeDemo() === 'large' ? 'yellow' : 'gray' }, '[2] Large (10K)  '),
      Text({ color: activeDemo() === 'styled' ? 'magenta' : 'gray' }, '[3] Styled')
    ),

    Divider({}),

    // Demo content
    Box({ marginTop: 1 }, renderDemo()),

    // Footer
    Box(
      { marginTop: 1 },
      Text({ color: 'gray', dim: true }, '[↑↓] Navigate  [PgUp/PgDn] Jump  [Home/End] First/Last  [Q] Exit')
    )
  );
}

// Run the demo
const { waitUntilExit } = render(VirtualScrollDemo);
await waitUntilExit();
