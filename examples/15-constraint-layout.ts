/**
 * Constraint-Based Layout Example
 *
 * Showcases constraint-based layout capabilities:
 * - Equality constraints (==)
 * - Inequality constraints (<=, >=)
 * - Percentage-based sizing
 * - Centering and alignment
 * - Stacking and distribution
 *
 * Run with: npx tsx examples/15-constraint-layout.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  ConstraintLayoutManager,
  eq,
  lte,
  gte,
  percentWidth,
  percentHeight,
  center,
  equalWidths,
  stackHorizontally,
  stackVertically,
  alignTops,
  pinToEdges,
  Divider,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

type LayoutExample = 'percentage' | 'equal' | 'stack' | 'center' | 'complex';

function ConstraintLayoutDemo() {
  const app = useApp();
  const [activeExample, setActiveExample] = useState<LayoutExample>('percentage');
  const [containerWidth, setContainerWidth] = useState(60);
  const [containerHeight, setContainerHeight] = useState(15);

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
    if (input === '1') setActiveExample('percentage');
    if (input === '2') setActiveExample('equal');
    if (input === '3') setActiveExample('stack');
    if (input === '4') setActiveExample('center');
    if (input === '5') setActiveExample('complex');

    // Resize container
    if (key.leftArrow) setContainerWidth(Math.max(40, containerWidth() - 5));
    if (key.rightArrow) setContainerWidth(Math.min(80, containerWidth() + 5));
    if (key.upArrow) setContainerHeight(Math.max(10, containerHeight() - 2));
    if (key.downArrow) setContainerHeight(Math.min(25, containerHeight() + 2));
  });

  const renderBox = (
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    color: string
  ) => {
    if (width < 1 || height < 1) return null;

    const lines: any[] = [];
    const innerWidth = Math.max(0, width - 2);

    // Top border
    lines.push(
      Text({ color }, '┌' + '─'.repeat(innerWidth) + '┐')
    );

    // Content lines
    for (let i = 0; i < height - 2; i++) {
      const content = i === Math.floor((height - 2) / 2)
        ? label.substring(0, innerWidth).padStart(Math.floor((innerWidth + label.length) / 2)).padEnd(innerWidth)
        : ' '.repeat(innerWidth);
      lines.push(
        Text({ color }, '│' + content + '│')
      );
    }

    // Bottom border
    lines.push(
      Text({ color }, '└' + '─'.repeat(innerWidth) + '┘')
    );

    return Box(
      {
        position: 'absolute',
        left: x,
        top: y,
        flexDirection: 'column',
      },
      ...lines
    );
  };

  const renderExample = () => {
    const width = containerWidth();
    const height = containerHeight();

    switch (activeExample()) {
      case 'percentage': {
        // Percentage-based layout: sidebar 25%, main 75%
        const manager = new ConstraintLayoutManager({ width, height, padding: 1 });
        const sidebar = manager.addElement('sidebar');
        const main = manager.addElement('main');
        const container = manager.getContainer();

        // Sidebar: 25% width, full height, left aligned
        manager.addConstraint(eq(sidebar.x, container.x));
        manager.addConstraint(eq(sidebar.y, container.y));
        manager.addConstraint(percentWidth(sidebar, container, 25));
        manager.addConstraint(eq(sidebar.height, container.height));

        // Main: 75% width, full height, right of sidebar
        manager.addConstraint(eq(main.x, sidebar.right));
        manager.addConstraint(eq(main.y, container.y));
        manager.addConstraint(percentWidth(main, container, 75));
        manager.addConstraint(eq(main.height, container.height));

        const layouts = manager.solve();
        const sidebarLayout = layouts.get('sidebar')!;
        const mainLayout = layouts.get('main')!;

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Percentage Layout (25% / 75%)'),
          Text({ color: 'gray', marginBottom: 1 }, 'sidebar.width = 25% of container'),
          Box(
            { position: 'relative', width, height },
            renderBox(sidebarLayout.x, sidebarLayout.y, sidebarLayout.width, sidebarLayout.height, 'Sidebar', 'cyan'),
            renderBox(mainLayout.x, mainLayout.y, mainLayout.width, mainLayout.height, 'Main', 'green')
          )
        );
      }

      case 'equal': {
        // Equal width columns
        const manager = new ConstraintLayoutManager({ width, height, padding: 1 });
        const col1 = manager.addElement('col1');
        const col2 = manager.addElement('col2');
        const col3 = manager.addElement('col3');
        const container = manager.getContainer();

        // All columns same Y and height
        manager.addConstraint(eq(col1.y, container.y));
        manager.addConstraint(eq(col2.y, container.y));
        manager.addConstraint(eq(col3.y, container.y));
        manager.addConstraint(eq(col1.height, container.height));
        manager.addConstraint(eq(col2.height, container.height));
        manager.addConstraint(eq(col3.height, container.height));

        // Equal widths
        manager.addConstraints(equalWidths([col1, col2, col3]));

        // Stack horizontally
        manager.addConstraint(eq(col1.x, container.x));
        manager.addConstraints(stackHorizontally([col1, col2, col3], 0));

        // Total width equals container
        manager.addConstraint(eq(col3.right, container.right));

        const layouts = manager.solve();

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'magenta', bold: true, marginBottom: 1 }, 'Equal Width Columns'),
          Text({ color: 'gray', marginBottom: 1 }, 'col1.width = col2.width = col3.width'),
          Box(
            { position: 'relative', width, height },
            renderBox(layouts.get('col1')!.x, layouts.get('col1')!.y, layouts.get('col1')!.width, layouts.get('col1')!.height, 'Col 1', 'magenta'),
            renderBox(layouts.get('col2')!.x, layouts.get('col2')!.y, layouts.get('col2')!.width, layouts.get('col2')!.height, 'Col 2', 'yellow'),
            renderBox(layouts.get('col3')!.x, layouts.get('col3')!.y, layouts.get('col3')!.width, layouts.get('col3')!.height, 'Col 3', 'blue')
          )
        );
      }

      case 'stack': {
        // Vertical stack with gaps
        const manager = new ConstraintLayoutManager({ width, height, padding: 1 });
        const header = manager.addElement('header');
        const content = manager.addElement('content');
        const footer = manager.addElement('footer');
        const container = manager.getContainer();

        // All full width
        manager.addConstraint(eq(header.x, container.x));
        manager.addConstraint(eq(content.x, container.x));
        manager.addConstraint(eq(footer.x, container.x));
        manager.addConstraint(eq(header.width, container.width));
        manager.addConstraint(eq(content.width, container.width));
        manager.addConstraint(eq(footer.width, container.width));

        // Fixed header and footer heights
        manager.addConstraint(eq(header.height, 3));
        manager.addConstraint(eq(footer.height, 3));

        // Header at top
        manager.addConstraint(eq(header.y, container.y));

        // Stack vertically with gap
        manager.addConstraints(stackVertically([header, content, footer], 1));

        // Footer at bottom
        manager.addConstraint(eq(footer.bottom, container.bottom));

        const layouts = manager.solve();

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'green', bold: true, marginBottom: 1 }, 'Vertical Stack Layout'),
          Text({ color: 'gray', marginBottom: 1 }, 'header.bottom + gap = content.top'),
          Box(
            { position: 'relative', width, height },
            renderBox(layouts.get('header')!.x, layouts.get('header')!.y, layouts.get('header')!.width, layouts.get('header')!.height, 'Header', 'green'),
            renderBox(layouts.get('content')!.x, layouts.get('content')!.y, layouts.get('content')!.width, layouts.get('content')!.height, 'Content', 'cyan'),
            renderBox(layouts.get('footer')!.x, layouts.get('footer')!.y, layouts.get('footer')!.width, layouts.get('footer')!.height, 'Footer', 'yellow')
          )
        );
      }

      case 'center': {
        // Centered dialog
        const manager = new ConstraintLayoutManager({ width, height, padding: 1 });
        const dialog = manager.addElement('dialog');
        const container = manager.getContainer();

        // Fixed size dialog
        manager.addConstraint(eq(dialog.width, 30));
        manager.addConstraint(eq(dialog.height, 8));

        // Center in container
        manager.addConstraints(center(dialog, container));

        const layouts = manager.solve();

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'yellow', bold: true, marginBottom: 1 }, 'Centered Element'),
          Text({ color: 'gray', marginBottom: 1 }, 'dialog.centerX = container.centerX'),
          Box(
            { position: 'relative', width, height },
            // Background container outline
            Box(
              { position: 'absolute', left: 0, top: 0 },
              Text({ color: 'gray', dim: true }, '┌' + '─'.repeat(width - 2) + '┐'),
              ...Array.from({ length: height - 2 }, () =>
                Text({ color: 'gray', dim: true }, '│' + ' '.repeat(width - 2) + '│')
              ),
              Text({ color: 'gray', dim: true }, '└' + '─'.repeat(width - 2) + '┘')
            ),
            renderBox(layouts.get('dialog')!.x, layouts.get('dialog')!.y, layouts.get('dialog')!.width, layouts.get('dialog')!.height, 'Dialog', 'yellow')
          )
        );
      }

      case 'complex': {
        // Complex dashboard layout
        const manager = new ConstraintLayoutManager({ width, height, padding: 1 });
        const header = manager.addElement('header');
        const sidebar = manager.addElement('sidebar');
        const main = manager.addElement('main');
        const widget1 = manager.addElement('widget1');
        const widget2 = manager.addElement('widget2');
        const container = manager.getContainer();

        // Header: full width, 3 lines
        manager.addConstraint(eq(header.x, container.x));
        manager.addConstraint(eq(header.y, container.y));
        manager.addConstraint(eq(header.width, container.width));
        manager.addConstraint(eq(header.height, 3));

        // Sidebar: 20% width, below header
        manager.addConstraint(eq(sidebar.x, container.x));
        manager.addConstraint(eq(sidebar.y, header.bottom));
        manager.addConstraint(percentWidth(sidebar, container, 20));
        manager.addConstraint(eq(sidebar.bottom, container.bottom));

        // Main: 80% width, below header
        manager.addConstraint(eq(main.x, sidebar.right));
        manager.addConstraint(eq(main.y, header.bottom));
        manager.addConstraint(percentWidth(main, container, 50));
        manager.addConstraint(eq(main.bottom, container.bottom));

        // Widgets: remaining 30%, stacked vertically
        manager.addConstraint(eq(widget1.x, main.right));
        manager.addConstraint(eq(widget1.y, header.bottom));
        manager.addConstraint(eq(widget1.right, container.right));
        manager.addConstraint(eq(widget1.height, 4));

        manager.addConstraint(eq(widget2.x, main.right));
        manager.addConstraint(eq(widget2.y, widget1.bottom));
        manager.addConstraint(eq(widget2.right, container.right));
        manager.addConstraint(eq(widget2.bottom, container.bottom));

        const layouts = manager.solve();

        return Box(
          { flexDirection: 'column' },
          Text({ color: 'red', bold: true, marginBottom: 1 }, 'Complex Dashboard Layout'),
          Text({ color: 'gray', marginBottom: 1 }, 'Multiple constraints working together'),
          Box(
            { position: 'relative', width, height },
            renderBox(layouts.get('header')!.x, layouts.get('header')!.y, layouts.get('header')!.width, layouts.get('header')!.height, 'Header', 'blue'),
            renderBox(layouts.get('sidebar')!.x, layouts.get('sidebar')!.y, layouts.get('sidebar')!.width, layouts.get('sidebar')!.height, 'Sidebar', 'cyan'),
            renderBox(layouts.get('main')!.x, layouts.get('main')!.y, layouts.get('main')!.width, layouts.get('main')!.height, 'Main', 'green'),
            renderBox(layouts.get('widget1')!.x, layouts.get('widget1')!.y, layouts.get('widget1')!.width, layouts.get('widget1')!.height, 'Widget1', 'yellow'),
            renderBox(layouts.get('widget2')!.x, layouts.get('widget2')!.y, layouts.get('widget2')!.width, layouts.get('widget2')!.height, 'Widget2', 'magenta')
          )
        );
      }

      default:
        return Text({}, 'Select an example');
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
      Text({ color: 'cyan', bold: true }, ' Constraint-Based Layout Demo ')
    ),

    // Navigation
    Box(
      { marginBottom: 1 },
      Text({ color: activeExample() === 'percentage' ? 'cyan' : 'gray' }, '[1] Percentage  '),
      Text({ color: activeExample() === 'equal' ? 'magenta' : 'gray' }, '[2] Equal  '),
      Text({ color: activeExample() === 'stack' ? 'green' : 'gray' }, '[3] Stack  '),
      Text({ color: activeExample() === 'center' ? 'yellow' : 'gray' }, '[4] Center  '),
      Text({ color: activeExample() === 'complex' ? 'red' : 'gray' }, '[5] Complex')
    ),

    // Container size info
    Box(
      { marginBottom: 1 },
      Text({ color: 'gray' }, `Container: ${containerWidth()}x${containerHeight()} | Use arrows to resize`)
    ),

    Divider({}),

    // Example content
    Box({ marginTop: 1 }, renderExample()),

    // Footer
    Box(
      { marginTop: 1 },
      Text({ color: 'gray', dim: true }, '[1-5] Examples  [←→↑↓] Resize  [Q] Exit')
    )
  );
}

// Run the demo
const { waitUntilExit } = render(ConstraintLayoutDemo);
await waitUntilExit();
