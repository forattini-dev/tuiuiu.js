/**
 * Layout Components Example
 *
 * Showcases layout components:
 * - Tabs
 * - Accordion
 * - Collapsible
 * - ScrollArea
 * - Grid
 * - Tree
 *
 * Run with: npx tsx examples/08-layout-components.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  Tabs,
  Accordion,
  Collapsible,
  ScrollArea,
  Grid,
  GridCell,
  Tree,
  Divider,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

function LayoutDemo() {
  const app = useApp();
  const [activeDemo, setActiveDemo] = useState<string>('tabs');

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
    if (input === '1') setActiveDemo('tabs');
    if (input === '2') setActiveDemo('accordion');
    if (input === '3') setActiveDemo('scroll');
    if (input === '4') setActiveDemo('grid');
    if (input === '5') setActiveDemo('tree');
  });

  const renderDemo = () => {
    switch (activeDemo()) {
      case 'tabs':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Tabs Component'),
          Tabs({
            tabs: [
              {
                id: 'home',
                label: 'Home',
                content: Box(
                  { padding: 1 },
                  Text({}, 'Welcome to the Home tab!'),
                  Text({ color: 'gray', marginTop: 1 }, 'This is the main content area.')
                ),
              },
              {
                id: 'profile',
                label: 'Profile',
                content: Box(
                  { padding: 1 },
                  Text({}, 'User Profile'),
                  Text({ color: 'gray' }, 'Name: John Doe'),
                  Text({ color: 'gray' }, 'Email: john@example.com')
                ),
              },
              {
                id: 'settings',
                label: 'Settings',
                content: Box(
                  { padding: 1 },
                  Text({}, 'Settings Panel'),
                  Text({ color: 'gray' }, 'Configure your preferences here.')
                ),
              },
            ],
            style: 'line',
          })
        );

      case 'accordion':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Accordion Component'),
          Accordion({
            sections: [
              {
                id: 'faq1',
                title: 'What is Tuiuiu?',
                content: Box(
                  { padding: 1 },
                  Text({}, 'Tuiuiu is a zero-dependency Terminal UI library for Node.js.'),
                  Text({ color: 'gray' }, 'It provides React-like components for building TUI apps.')
                ),
              },
              {
                id: 'faq2',
                title: 'How do I install it?',
                content: Box(
                  { padding: 1 },
                  Text({}, 'npm install tuiuiu.js'),
                  Text({ color: 'gray' }, 'or: pnpm add tuiuiu.js')                ),
              },
              {
                id: 'faq3',
                title: 'Is it free to use?',
                content: Box(
                  { padding: 1 },
                  Text({}, 'Yes! Tuiuiu is open source and free to use.'),
                  Text({ color: 'gray' }, 'Licensed under MIT.')
                ),
              },
            ],
            allowMultiple: false,
          })
        );

      case 'scroll':
        const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}: Lorem ipsum dolor sit amet`);
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'ScrollArea Component'),
          Text({ color: 'gray', marginBottom: 1 }, 'Use arrows or mouse wheel to scroll'),
          ScrollArea(
            {
              height: 8,
              showScrollbar: true,
            },
            Box(
              { flexDirection: 'column' },
              ...items.map((item, i) =>
                Text({ color: i % 2 === 0 ? 'white' : 'gray' }, item)
              )
            )
          )
        );

      case 'grid':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Grid Component'),
          Grid(
            {
              columns: 3,
              gap: 1,
            },
            GridCell(
              { borderStyle: 'single', padding: 1 },
              Text({ color: 'red' }, 'Cell 1')
            ),
            GridCell(
              { borderStyle: 'single', padding: 1 },
              Text({ color: 'green' }, 'Cell 2')
            ),
            GridCell(
              { borderStyle: 'single', padding: 1 },
              Text({ color: 'blue' }, 'Cell 3')
            ),
            GridCell(
              { borderStyle: 'single', padding: 1, colSpan: 2 },
              Text({ color: 'yellow' }, 'Cell 4 (spans 2 columns)')
            ),
            GridCell(
              { borderStyle: 'single', padding: 1 },
              Text({ color: 'magenta' }, 'Cell 5')
            )
          )
        );

      case 'tree':
        return Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true, marginBottom: 1 }, 'Tree Component'),
          Tree({
            data: [
              {
                id: 'src',
                label: 'src',
                icon: '📁',
                children: [
                  {
                    id: 'components',
                    label: 'components',
                    icon: '📁',
                    children: [
                      { id: 'box', label: 'box.ts', icon: '📄' },
                      { id: 'text', label: 'text.ts', icon: '📄' },
                      { id: 'button', label: 'button.ts', icon: '📄' },
                    ],
                  },
                  {
                    id: 'hooks',
                    label: 'hooks',
                    icon: '📁',
                    children: [
                      { id: 'useState', label: 'useState.ts', icon: '📄' },
                      { id: 'useEffect', label: 'useEffect.ts', icon: '📄' },
                    ],
                  },
                  { id: 'index', label: 'index.ts', icon: '📄' },
                ],
              },
              {
                id: 'tests',
                label: 'tests',
                icon: '📁',
                children: [
                  { id: 'unit', label: 'unit.test.ts', icon: '🧪' },
                  { id: 'integration', label: 'integration.test.ts', icon: '🧪' },
                ],
              },
              { id: 'package', label: 'package.json', icon: '📦' },
              { id: 'readme', label: 'README.md', icon: '📖' },
            ],
            defaultExpanded: ['src', 'components'],
          })
        );

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
      Text({ color: 'cyan', bold: true }, ' Layout Components Demo ')
    ),

    // Navigation
    Box(
      { marginBottom: 1 },
      Text({ color: activeDemo() === 'tabs' ? 'cyan' : 'gray' }, '[1] Tabs  '),
      Text({ color: activeDemo() === 'accordion' ? 'cyan' : 'gray' }, '[2] Accordion  '),
      Text({ color: activeDemo() === 'scroll' ? 'cyan' : 'gray' }, '[3] Scroll  '),
      Text({ color: activeDemo() === 'grid' ? 'cyan' : 'gray' }, '[4] Grid  '),
      Text({ color: activeDemo() === 'tree' ? 'cyan' : 'gray' }, '[5] Tree')
    ),

    Divider({}),

    // Demo content
    Box({ marginTop: 1, minHeight: 15 }, renderDemo()),

    // Footer
    Box(
      { marginTop: 1 },
      Text({ color: 'gray', dim: true }, 'Press 1-5 to switch demos, Q to exit')
    )
  );
}

// Run the demo
const { waitUntilExit } = render(LayoutDemo);
await waitUntilExit();
