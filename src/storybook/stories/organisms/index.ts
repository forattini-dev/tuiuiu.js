/**
 * Organisms Stories
 *
 * Organisms are complex UI components composed of atoms and molecules.
 * They represent distinct sections of an interface:
 * - Form patterns (Login, Settings)
 * - Layout components (SplitPanel, Grid, Stack)
 * - Complex charts (BarChart, Heatmap)
 * - UI patterns (Dashboard, File Browser, Chat, Command Palette, Navigation)
 */

import { Box, Text, Spacer } from '../../../primitives/nodes.js';
import { Divider } from '../../../primitives/divider.js';
import { story, defaultControls } from '../../core/registry.js';
import { themeColor } from '../../../core/theme.js';
import type { Story } from '../../types.js';

// Chart helper
function textBar(value: number, max: number, width: number, filled: string = '█', empty: string = '░'): string {
  const filledWidth = Math.round((value / max) * width);
  return filled.repeat(filledWidth) + empty.repeat(width - filledWidth);
}

// ============================================================================
// Form Patterns
// ============================================================================

export const formPatternStories: Story[] = [
  story('Form - Login')
    .category('Organisms')
    .description('Login form pattern')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'round',
          borderColor: 'cyan',
          padding: 2,
          width: 40,
        },
        Box(
          { marginBottom: 1 },
          Text({ color: 'cyan', bold: true }, 'Login')
        ),
        Box(
          { flexDirection: 'column', marginBottom: 1 },
          Text({ color: 'gray' }, 'Username:'),
          Box(
            { borderStyle: 'single', borderColor: 'gray', paddingX: 1 },
            Text({}, 'user@example.com')
          )
        ),
        Box(
          { flexDirection: 'column', marginBottom: 1 },
          Text({ color: 'gray' }, 'Password:'),
          Box(
            { borderStyle: 'single', borderColor: 'gray', paddingX: 1 },
            Text({}, '********')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { backgroundColor: 'blue', paddingX: 2 },
            Text({ color: 'white', bold: true }, 'Login')
          ),
          Text({ color: 'gray', dim: true }, 'Forgot password?')
        )
      )
    ),

  story('Form - Settings')
    .category('Organisms')
    .description('Settings form pattern')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          padding: 1,
          width: 50,
        },
        Box(
          { marginBottom: 1 },
          Text({ color: 'white', bold: true }, 'Settings')
        ),
        Box(
          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
          Text({}, 'Dark Mode'),
          Text({ color: 'green' }, '[ON]')
        ),
        Box(
          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
          Text({}, 'Notifications'),
          Text({ color: 'red' }, '[OFF]')
        ),
        Box(
          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
          Text({}, 'Language'),
          Text({ color: 'cyan' }, 'English ▼')
        ),
        Box(
          { flexDirection: 'row', justifyContent: 'space-between' },
          Text({}, 'Volume'),
          Text({ color: 'yellow' }, '████████░░ 80%')
        )
      )
    ),
];

// ============================================================================
// Layout Components
// ============================================================================

export const splitPanelStories: Story[] = [
  story('SplitPanel - Horizontal')
    .category('Organisms')
    .description('Horizontal split with resizable divider')
    .controls({
      ratio: defaultControls.range('Ratio %', 50, 10, 90),
    })
    .render((props) => {
      const leftWidth = Math.floor(58 * (props.ratio / 100));
      const rightWidth = 58 - leftWidth - 1;

      return Box(
        { width: 60, height: 10, flexDirection: 'row', borderStyle: 'single', borderColor: 'gray' },
        Box(
          { width: leftWidth, height: '100%', backgroundColor: 'blue', padding: 1 },
          Text({ color: 'white' }, 'Left Panel')
        ),
        Box(
          { width: 1, height: '100%', backgroundColor: 'gray' },
          Text({ color: 'white' }, '│')
        ),
        Box(
          { width: rightWidth, height: '100%', backgroundColor: 'green', padding: 1 },
          Text({ color: 'white' }, 'Right Panel')
        )
      );
    }),

  story('SplitPanel - Vertical')
    .category('Organisms')
    .description('Vertical split with resizable divider')
    .controls({
      ratio: defaultControls.range('Ratio %', 50, 10, 90),
    })
    .render((props) => {
      const topHeight = Math.floor(13 * (props.ratio / 100));
      const bottomHeight = 13 - topHeight - 1;

      return Box(
        {
          width: 40,
          height: 15,
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
        },
        Box(
          { height: topHeight, width: '100%', backgroundColor: 'blue', padding: 1 },
          Text({ color: 'white' }, 'Top Panel')
        ),
        Box(
          { width: '100%' },
          Text({ color: 'gray' }, '─'.repeat(38))
        ),
        Box(
          { height: bottomHeight, width: '100%', backgroundColor: 'green', padding: 1 },
          Text({ color: 'white' }, 'Bottom Panel')
        )
      );
    }),

  story('SplitPanel - Nested')
    .category('Organisms')
    .description('Nested split panels')
    .render(() =>
      Box(
        { width: 60, height: 15, borderStyle: 'single', borderColor: 'gray' },
        Box(
          { width: 17, height: '100%', backgroundColor: 'blue', padding: 1 },
          Text({ color: 'white' }, 'Sidebar')
        ),
        Box(
          { width: 1, height: '100%' },
          Text({ color: 'gray' }, '│')
        ),
        Box(
          { flexGrow: 1, height: '100%', flexDirection: 'column' },
          Box(
            { height: 9, width: '100%', backgroundColor: 'green', padding: 1 },
            Text({ color: 'white' }, 'Main Content')
          ),
          Box(
            { width: '100%' },
            Text({ color: 'gray' }, '─'.repeat(40))
          ),
          Box(
            { height: 3, width: '100%', backgroundColor: 'magenta', padding: 1 },
            Text({ color: 'white' }, 'Footer')
          )
        )
      )
    ),
];

export const gridStories: Story[] = [
  story('Grid - Basic')
    .category('Organisms')
    .description('Basic grid layout')
    .controls({
      columns: defaultControls.range('Columns', 3, 1, 6),
      gap: defaultControls.range('Gap', 1, 0, 3),
    })
    .render((props) => {
      const cellWidth = Math.floor((50 - (props.columns - 1) * props.gap) / props.columns);
      const cells = Array.from({ length: 9 }, (_, i) => i + 1);
      const colors = ['blue', 'green', 'magenta'] as const;

      return Box(
        { flexDirection: 'column', gap: props.gap, width: 50 },
        ...Array.from({ length: Math.ceil(cells.length / props.columns) }, (_, rowIdx) =>
          Box(
            { flexDirection: 'row', gap: props.gap },
            ...cells
              .slice(rowIdx * props.columns, (rowIdx + 1) * props.columns)
              .map((cell, colIdx) =>
                Box(
                  {
                    width: cellWidth,
                    backgroundColor: colors[(rowIdx * props.columns + colIdx) % 3],
                    padding: 1,
                  },
                  Text({ color: 'white' }, `Cell ${cell}`)
                )
              )
          )
        )
      );
    }),

  story('Grid - Dashboard Layout')
    .category('Organisms')
    .description('Dashboard-style grid layout')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, width: 60 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Box(
            { backgroundColor: 'blue', padding: 1, flexGrow: 1 },
            Text({ color: 'white', bold: true }, 'Users: 1.2k')
          ),
          Box(
            { backgroundColor: 'green', padding: 1, flexGrow: 1 },
            Text({ color: 'white', bold: true }, 'Revenue: $45k')
          ),
          Box(
            { backgroundColor: 'magenta', padding: 1, flexGrow: 1 },
            Text({ color: 'white', bold: true }, 'Orders: 892')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box(
            { backgroundColor: 'gray', padding: 1, width: 38 },
            Text({ color: 'white' }, 'Chart Area\n▂▃▅▇█▇▅▃▂▃▅▇')
          ),
          Box(
            { backgroundColor: 'cyan', padding: 1, flexGrow: 1 },
            Text({ color: 'white' }, 'Activity\n• New user\n• Sale\n• Comment')
          )
        )
      )
    ),
];

export const stackStories: Story[] = [
  story('VStack - Basic')
    .category('Organisms')
    .description('Vertical stack layout')
    .controls({
      gap: defaultControls.range('Gap', 1, 0, 5),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: props.gap },
        Box({ backgroundColor: 'blue', padding: 1 }, Text({ color: 'white' }, 'Item 1')),
        Box({ backgroundColor: 'green', padding: 1 }, Text({ color: 'white' }, 'Item 2')),
        Box({ backgroundColor: 'magenta', padding: 1 }, Text({ color: 'white' }, 'Item 3'))
      )
    ),

  story('HStack - Basic')
    .category('Organisms')
    .description('Horizontal stack layout')
    .controls({
      gap: defaultControls.range('Gap', 2, 0, 5),
      justify: defaultControls.select('Justify', ['flex-start', 'center', 'flex-end', 'space-between'], 'flex-start'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'row', gap: props.gap, justifyContent: props.justify, width: 50 },
        Box({ backgroundColor: 'blue', padding: 1 }, Text({ color: 'white' }, 'A')),
        Box({ backgroundColor: 'green', padding: 1 }, Text({ color: 'white' }, 'B')),
        Box({ backgroundColor: 'magenta', padding: 1 }, Text({ color: 'white' }, 'C'))
      )
    ),

  story('Stack - Nested')
    .category('Organisms')
    .description('Nested stacks for complex layouts')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 2, justifyContent: 'space-between', width: 50 },
          Text({ color: 'cyan', bold: true }, 'App Title'),
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'gray' }, 'Home'),
            Text({ color: 'gray' }, 'About'),
            Text({ color: 'gray' }, 'Contact')
          )
        ),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { flexDirection: 'column', gap: 1, width: 15 },
            Text({ color: 'cyan' }, '> Dashboard'),
            Text({ color: 'gray' }, '  Users'),
            Text({ color: 'gray' }, '  Settings')
          ),
          Box(
            { flexDirection: 'column', gap: 1 },
            Text({ bold: true }, 'Dashboard'),
            Text({ color: 'gray' }, 'Welcome to your dashboard.')
          )
        )
      )
    ),
];

export const layoutPatternStories: Story[] = [
  story('Layout - Holy Grail')
    .category('Organisms')
    .description('Classic header-sidebar-main-footer layout')
    .render(() =>
      Box(
        { flexDirection: 'column', width: 60, height: 15 },
        Box(
          { backgroundColor: 'blue', paddingX: 1, width: '100%' },
          Text({ color: 'white', bold: true }, 'Header')
        ),
        Box(
          { flexDirection: 'row', flexGrow: 1 },
          Box(
            { backgroundColor: 'green', width: 12, padding: 1 },
            Text({ color: 'white' }, 'Sidebar')
          ),
          Box(
            { flexGrow: 1, padding: 1 },
            Text({}, 'Main Content Area')
          ),
          Box(
            { backgroundColor: 'magenta', width: 12, padding: 1 },
            Text({ color: 'white' }, 'Aside')
          )
        ),
        Box(
          { backgroundColor: 'cyan', paddingX: 1, width: '100%' },
          Text({ color: 'white' }, 'Footer')
        )
      )
    ),

  story('Layout - Sidebar Toggle')
    .category('Organisms')
    .description('Layout with collapsible sidebar')
    .controls({
      sidebarOpen: defaultControls.boolean('Sidebar Open', true),
    })
    .render((props) =>
      Box(
        { flexDirection: 'row', width: 60, height: 12 },
        props.sidebarOpen
          ? Box(
              {
                backgroundColor: 'blue',
                width: 20,
                padding: 1,
                flexDirection: 'column',
              },
              Text({ color: 'white', bold: true }, 'Navigation'),
              Text({ color: 'cyan' }, '> Home'),
              Text({ color: 'gray' }, '  Files'),
              Text({ color: 'gray' }, '  Settings')
            )
          : null,
        Box(
          { flexGrow: 1, padding: 1, flexDirection: 'column' },
          Text({ bold: true }, 'Content'),
          Text({ color: 'gray' }, props.sidebarOpen ? 'Sidebar is open' : 'Sidebar is closed'),
          Box(
            { marginTop: 1 },
            Text({ color: 'gray', dim: true }, '[Toggle sidebar with control]')
          )
        )
      )
    ),

  story('Layout - Card Grid')
    .category('Organisms')
    .description('Responsive card grid layout')
    .render(() =>
      Box(
        { flexDirection: 'row', flexWrap: 'wrap', gap: 1, width: 60 },
        ...Array.from({ length: 6 }, (_, i) =>
          Box(
            {
              width: 18,
              borderStyle: 'round',
              borderColor: (['cyan', 'green', 'magenta', 'yellow', 'blue', 'red'] as const)[i],
              padding: 1,
              flexDirection: 'column',
            },
            Text({ bold: true }, `Card ${i + 1}`),
            Text({ color: 'gray', dim: true }, 'Card content...')
          )
        )
      )
    ),
];

// ============================================================================
// Complex Charts
// ============================================================================

export const barChartStories: Story[] = [
  story('BarChart - Horizontal')
    .category('Organisms')
    .description('Horizontal bar chart')
    .controls({
      width: defaultControls.range('Width', 20, 10, 40),
    })
    .render((props) => {
      const data = [
        { label: 'JavaScript', value: 85 },
        { label: 'Python', value: 72 },
        { label: 'TypeScript', value: 68 },
        { label: 'Rust', value: 45 },
        { label: 'Go', value: 38 },
      ];
      const max = Math.max(...data.map((d) => d.value));

      return Box(
        { flexDirection: 'column', gap: 1 },
        ...data.map((item) =>
          Box(
            { flexDirection: 'row', gap: 1 },
            Box({ width: 12 }, Text({ color: 'gray' }, item.label)),
            Text({ color: 'cyan' }, textBar(item.value, max, props.width)),
            Text({ color: 'gray', dim: true }, ` ${item.value}%`)
          )
        )
      );
    }),

  story('BarChart - Colored')
    .category('Organisms')
    .description('Bar chart with colors')
    .render(() => {
      const data = [
        { label: 'Success', value: 85, color: 'green' as const },
        { label: 'Warning', value: 45, color: 'yellow' as const },
        { label: 'Error', value: 12, color: 'red' as const },
        { label: 'Info', value: 30, color: 'cyan' as const },
      ];
      const max = 100;

      return Box(
        { flexDirection: 'column', gap: 1 },
        ...data.map((item) =>
          Box(
            { flexDirection: 'row', gap: 1 },
            Box({ width: 10 }, Text({ color: 'gray' }, item.label)),
            Text({ color: item.color }, textBar(item.value, max, 25)),
            Text({ color: item.color }, ` ${item.value}%`)
          )
        )
      );
    }),

  story('BarChart - Stacked')
    .category('Organisms')
    .description('Stacked bar chart representation')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 6 }, Text({ color: 'gray' }, 'Q1:')),
          Text({ backgroundColor: 'blue', color: 'white' }, '████████'),
          Text({ backgroundColor: 'green', color: 'white' }, '████'),
          Text({ backgroundColor: 'yellow', color: 'black' }, '██')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 6 }, Text({ color: 'gray' }, 'Q2:')),
          Text({ backgroundColor: 'blue', color: 'white' }, '██████████'),
          Text({ backgroundColor: 'green', color: 'white' }, '██████'),
          Text({ backgroundColor: 'yellow', color: 'black' }, '███')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 6 }, Text({ color: 'gray' }, 'Q3:')),
          Text({ backgroundColor: 'blue', color: 'white' }, '████████████'),
          Text({ backgroundColor: 'green', color: 'white' }, '████████'),
          Text({ backgroundColor: 'yellow', color: 'black' }, '████')
        ),
        Box(
          { marginTop: 1, flexDirection: 'row', gap: 2 },
          Box({}, Text({ color: 'blue' }, '■'), Text({ color: 'gray' }, ' Sales')),
          Box({}, Text({ color: 'green' }, '■'), Text({ color: 'gray' }, ' Marketing')),
          Box({}, Text({ color: 'yellow' }, '■'), Text({ color: 'gray' }, ' Support'))
        )
      )
    ),
];

export const heatmapStories: Story[] = [
  story('Heatmap - Basic')
    .category('Organisms')
    .description('Color-coded data grid')
    .render(() => {
      const data = [
        [1, 3, 5, 7, 9],
        [2, 4, 6, 8, 10],
        [3, 5, 7, 9, 11],
        [4, 6, 8, 10, 12],
      ];

      const getColor = (value: number): string => {
        if (value > 9) return 'red';
        if (value > 6) return 'yellow';
        if (value > 3) return 'green';
        return 'cyan';
      };

      return Box(
        { flexDirection: 'column' },
        ...data.map((row) =>
          Box(
            { flexDirection: 'row' },
            ...row.map((value) =>
              Text(
                { backgroundColor: getColor(value), color: 'white' },
                ` ${value.toString().padStart(2)} `
              )
            )
          )
        )
      );
    }),

  story('Heatmap - Activity Grid')
    .category('Organisms')
    .description('GitHub-style activity heatmap')
    .render(() => {
      const blocks = ['░', '▒', '▓', '█'];
      const colors = ['gray', 'green', 'greenBright', 'greenBright'] as const;
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeks = 5;

      const getRandomIntensity = () => Math.floor(Math.random() * 4);

      return Box(
        { flexDirection: 'column' },
        Box({ marginBottom: 1 }, Text({ color: 'gray' }, 'Activity (last 5 weeks)')),
        ...days.map((day) =>
          Box(
            { flexDirection: 'row' },
            Box({ width: 4 }, Text({ color: 'gray' }, day)),
            ...Array.from({ length: weeks }, () => {
              const intensity = getRandomIntensity();
              return Text({ color: colors[intensity] }, blocks[intensity] + ' ');
            })
          )
        ),
        Box(
          { marginTop: 1, flexDirection: 'row', gap: 1 },
          Text({ color: 'gray', dim: true }, 'Less'),
          Text({ color: 'gray' }, '░'),
          Text({ color: 'green' }, '▒'),
          Text({ color: 'greenBright' }, '▓'),
          Text({ color: 'greenBright' }, '█'),
          Text({ color: 'gray', dim: true }, 'More')
        )
      );
    }),
];

// ============================================================================
// UI Patterns
// ============================================================================

export const dashboardStories: Story[] = [
  story('Pattern - Stats Cards')
    .category('Organisms')
    .description('Dashboard stats cards layout')
    .render(() =>
      Box(
        { flexDirection: 'row', gap: 2 },
        Box(
          {
            borderStyle: 'round',
            borderColor: 'cyan',
            padding: 1,
            width: 18,
          },
          Box(
            { flexDirection: 'column' },
            Text({ color: 'gray', dim: true }, 'Total Users'),
            Text({ color: 'cyan', bold: true }, '12,543'),
            Text({ color: 'green', dim: true }, '↑ 12.5%')
          )
        ),
        Box(
          {
            borderStyle: 'round',
            borderColor: 'green',
            padding: 1,
            width: 18,
          },
          Box(
            { flexDirection: 'column' },
            Text({ color: 'gray', dim: true }, 'Revenue'),
            Text({ color: 'green', bold: true }, '$45,231'),
            Text({ color: 'green', dim: true }, '↑ 8.2%')
          )
        ),
        Box(
          {
            borderStyle: 'round',
            borderColor: 'yellow',
            padding: 1,
            width: 18,
          },
          Box(
            { flexDirection: 'column' },
            Text({ color: 'gray', dim: true }, 'Orders'),
            Text({ color: 'yellow', bold: true }, '892'),
            Text({ color: 'red', dim: true }, '↓ 3.1%')
          )
        )
      )
    ),

  story('Pattern - Table')
    .category('Organisms')
    .description('Data table pattern')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          width: 60,
        },
        Box(
          { flexDirection: 'row', backgroundColor: 'blue', paddingX: 1 },
          Box({ width: 20 }, Text({ color: 'white', bold: true }, 'Name')),
          Box({ width: 15 }, Text({ color: 'white', bold: true }, 'Status')),
          Box({ width: 10 }, Text({ color: 'white', bold: true }, 'Role')),
          Text({ color: 'white', bold: true }, 'Actions')
        ),
        Box(
          { flexDirection: 'row', paddingX: 1 },
          Box({ width: 20 }, Text({}, 'Alice Johnson')),
          Box({ width: 15 }, Text({ color: 'green' }, '● Active')),
          Box({ width: 10 }, Text({}, 'Admin')),
          Text({ color: 'cyan' }, 'Edit | Del')
        ),
        Box(
          { flexDirection: 'row', paddingX: 1, backgroundColor: 'gray' },
          Box({ width: 20 }, Text({}, 'Bob Smith')),
          Box({ width: 15 }, Text({ color: 'green' }, '● Active')),
          Box({ width: 10 }, Text({}, 'User')),
          Text({ color: 'cyan' }, 'Edit | Del')
        ),
        Box(
          { flexDirection: 'row', paddingX: 1 },
          Box({ width: 20 }, Text({}, 'Carol White')),
          Box({ width: 15 }, Text({ color: 'yellow' }, '○ Pending')),
          Box({ width: 10 }, Text({}, 'User')),
          Text({ color: 'cyan' }, 'Edit | Del')
        ),
        Box(
          { flexDirection: 'row', paddingX: 1, backgroundColor: 'gray' },
          Box({ width: 20 }, Text({}, 'David Brown')),
          Box({ width: 15 }, Text({ color: 'red' }, '○ Inactive')),
          Box({ width: 10 }, Text({}, 'User')),
          Text({ color: 'cyan' }, 'Edit | Del')
        )
      )
    ),

  story('Pattern - Activity Feed')
    .category('Organisms')
    .description('Activity feed pattern')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          padding: 1,
          width: 45,
        },
        Text({ color: 'white', bold: true }, 'Recent Activity'),
        Box({ marginTop: 1 }),
        Box(
          { flexDirection: 'row', gap: 1, marginBottom: 1 },
          Text({ color: 'cyan' }, '●'),
          Box(
            { flexDirection: 'column' },
            Text({}, 'Alice uploaded a file'),
            Text({ color: 'gray', dim: true }, '2 minutes ago')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 1, marginBottom: 1 },
          Text({ color: 'green' }, '●'),
          Box(
            { flexDirection: 'column' },
            Text({}, 'Bob completed a task'),
            Text({ color: 'gray', dim: true }, '15 minutes ago')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 1, marginBottom: 1 },
          Text({ color: 'yellow' }, '●'),
          Box(
            { flexDirection: 'column' },
            Text({}, 'Carol added a comment'),
            Text({ color: 'gray', dim: true }, '1 hour ago')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'magenta' }, '●'),
          Box(
            { flexDirection: 'column' },
            Text({}, 'David joined the team'),
            Text({ color: 'gray', dim: true }, '3 hours ago')
          )
        )
      )
    ),
];

export const fileBrowserStories: Story[] = [
  story('Pattern - File Tree')
    .category('Organisms')
    .description('File tree navigation pattern')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          padding: 1,
          width: 40,
        },
        Text({ color: 'white', bold: true }, 'Files'),
        Box({ marginTop: 1 }),
        Text({ color: 'yellow' }, '▼ 📁 src'),
        Text({ color: 'gray' }, '  ▼ 📁 components'),
        Text({ color: 'cyan' }, '    ▶ 📁 ui'),
        Text({}, '      📄 button.ts'),
        Text({ inverse: true }, '      📄 input.ts'),
        Text({}, '      📄 modal.ts'),
        Text({ color: 'cyan' }, '    ▶ 📁 layout'),
        Text({ color: 'gray' }, '  ▼ 📁 utils'),
        Text({}, '      📄 helpers.ts'),
        Text({ color: 'cyan' }, '▶ 📁 tests'),
        Text({}, '📄 package.json'),
        Text({}, '📄 README.md')
      )
    ),

  story('Pattern - File Preview')
    .category('Organisms')
    .description('File browser with preview pane')
    .render(() =>
      Box(
        { flexDirection: 'row', width: 70, height: 15 },
        Box(
          {
            width: 25,
            borderStyle: 'single',
            borderColor: 'gray',
            flexDirection: 'column',
          },
          Box(
            { paddingX: 1, backgroundColor: 'blue' },
            Text({ color: 'white', bold: true }, 'Files')
          ),
          Box(
            { padding: 1, flexDirection: 'column' },
            Text({ color: 'yellow' }, '📁 src'),
            Text({ color: 'yellow' }, '📁 tests'),
            Text({ inverse: true }, '📄 package.json'),
            Text({}, '📄 README.md'),
            Text({}, '📄 tsconfig.json')
          )
        ),
        Box(
          {
            flexGrow: 1,
            borderStyle: 'single',
            borderColor: 'cyan',
            flexDirection: 'column',
          },
          Box(
            { paddingX: 1, backgroundColor: 'cyan' },
            Text({ color: 'white', bold: true }, 'package.json')
          ),
          Box(
            { padding: 1, flexDirection: 'column' },
            Text({ color: 'gray' }, '{'),
            Box(
              { flexDirection: 'row' },
              Text({ color: 'cyan' }, '  "name": '),
              Text({ color: 'green' }, '"tuiuiu"')
            ),
            Box(
              { flexDirection: 'row' },
              Text({ color: 'cyan' }, '  "version": '),
              Text({ color: 'green' }, '"0.1.0"')
            ),
            Box(
              { flexDirection: 'row' },
              Text({ color: 'cyan' }, '  "type": '),
              Text({ color: 'green' }, '"module"')
            ),
            Text({ color: 'gray' }, '  ...')
          )
        )
      )
    ),

  story('Pattern - Breadcrumbs')
    .category('Organisms')
    .description('Breadcrumb navigation pattern')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 2 },
        Box(
          { flexDirection: 'row' },
          Text({ color: 'cyan' }, 'Home'),
          Text({ color: 'gray' }, ' > '),
          Text({ color: 'cyan' }, 'Documents'),
          Text({ color: 'gray' }, ' > '),
          Text({ color: 'cyan' }, 'Projects'),
          Text({ color: 'gray' }, ' > '),
          Text({ color: 'white', bold: true }, 'Report.pdf')
        ),
        Box(
          { flexDirection: 'row' },
          Text({ color: 'cyan' }, '🏠'),
          Text({ color: 'gray' }, ' / '),
          Text({ color: 'cyan' }, '📁 src'),
          Text({ color: 'gray' }, ' / '),
          Text({ color: 'cyan' }, '📁 components'),
          Text({ color: 'gray' }, ' / '),
          Text({ color: 'white', bold: true }, '📄 button.ts')
        )
      )
    ),
];

export const chatStories: Story[] = [
  story('Pattern - Chat Messages')
    .category('Organisms')
    .description('Chat message list pattern')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          padding: 1,
          width: 50,
        },
        Box(
          { flexDirection: 'column', marginBottom: 1 },
          Text({ color: 'cyan', bold: true }, 'Alice'),
          Box(
            {
              borderStyle: 'round',
              borderColor: 'gray',
              paddingX: 1,
              marginLeft: 2,
            },
            Text({}, 'Hey, how are you?')
          ),
          Text({ color: 'gray', dim: true }, '  10:30 AM')
        ),
        Box(
          { flexDirection: 'column', alignItems: 'flex-end', marginBottom: 1 },
          Text({ color: 'green', bold: true }, 'You'),
          Box(
            {
              borderStyle: 'round',
              borderColor: 'green',
              paddingX: 1,
              marginRight: 2,
            },
            Text({}, "I'm good, thanks! Working on the TUI.")
          ),
          Text({ color: 'gray', dim: true }, '10:32 AM  ')
        ),
        Box(
          { flexDirection: 'column' },
          Text({ color: 'cyan', bold: true }, 'Alice'),
          Box(
            {
              borderStyle: 'round',
              borderColor: 'gray',
              paddingX: 1,
              marginLeft: 2,
            },
            Text({}, "That sounds interesting! Can't wait to see it.")
          ),
          Text({ color: 'gray', dim: true }, '  10:33 AM')
        )
      )
    ),

  story('Pattern - Chat Input')
    .category('Organisms')
    .description('Chat input with actions')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          borderStyle: 'single',
          borderColor: 'cyan',
          padding: 1,
          width: 50,
          gap: 1,
        },
        Text({ color: 'gray' }, '📎'),
        Box(
          { flexGrow: 1 },
          Text({ color: 'gray', dim: true }, 'Type a message...')
        ),
        Text({ color: 'gray' }, '😊'),
        Text({ color: 'cyan' }, '➤')
      )
    ),

  story('Pattern - Typing Indicator')
    .category('Organisms')
    .description('Typing indicator pattern')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'gray', dim: true }, 'Alice is typing'),
          Text({ color: 'gray' }, '...')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'cyan' }, '●'),
          Text({ color: 'cyan', dim: true }, '●'),
          Text({ color: 'gray', dim: true }, '●')
        )
      )
    ),
];

export const commandPaletteStories: Story[] = [
  story('Pattern - Command Palette')
    .category('Organisms')
    .description('Command palette pattern')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'round',
          borderColor: 'cyan',
          width: 50,
        },
        Box(
          {
            paddingX: 1,
            paddingY: 1,
            borderStyle: 'single',
            borderColor: 'gray',
          },
          Text({ color: 'gray' }, '> '),
          Text({ color: 'white' }, 'open file'),
          Text({ color: 'gray', dim: true }, '...')
        ),
        Box(
          { flexDirection: 'column', padding: 1 },
          Box(
            { backgroundColor: 'blue', paddingX: 1, flexDirection: 'row' },
            Text({ color: 'white' }, '📄 Open File'),
            Spacer({}),
            Text({ color: 'gray' }, 'Ctrl+O')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({}, '📁 Open Folder'),
            Spacer({}),
            Text({ color: 'gray' }, 'Ctrl+K O')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({}, '📝 Open Recent'),
            Spacer({}),
            Text({ color: 'gray' }, 'Ctrl+R')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({}, '🔍 Open in Explorer'),
            Spacer({}),
            Text({ color: 'gray' }, 'Ctrl+Shift+E')
          )
        ),
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'gray' },
          Text({ color: 'gray', dim: true }, '↑↓ Navigate  '),
          Text({ color: 'gray', dim: true }, '↵ Select  '),
          Text({ color: 'gray', dim: true }, 'Esc Close')
        )
      )
    ),

  story('Pattern - Quick Actions')
    .category('Organisms')
    .description('Quick action menu pattern')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          width: 35,
        },
        Box(
          { paddingX: 1, backgroundColor: 'blue' },
          Text({ color: 'white', bold: true }, 'Quick Actions')
        ),
        Box(
          { flexDirection: 'column', padding: 1 },
          Box(
            { flexDirection: 'row' },
            Text({ color: 'cyan' }, '[N] '),
            Text({}, 'New File')
          ),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'cyan' }, '[S] '),
            Text({}, 'Save')
          ),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'cyan' }, '[F] '),
            Text({}, 'Find')
          ),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'cyan' }, '[R] '),
            Text({}, 'Replace')
          ),
          Divider({}),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'cyan' }, '[Q] '),
            Text({ color: 'gray' }, 'Quit')
          )
        )
      )
    ),
];

export const navigationStories: Story[] = [
  story('Pattern - Sidebar Nav')
    .category('Organisms')
    .description('Sidebar navigation pattern')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          borderStyle: 'single',
          borderColor: 'gray',
          width: 25,
          height: 15,
        },
        Box(
          { paddingX: 1, backgroundColor: 'blue' },
          Text({ color: 'white', bold: true }, '🚀 AppName')
        ),
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          Box(
            { backgroundColor: 'cyan', paddingX: 1 },
            Text({ color: 'white' }, '🏠 Dashboard')
          ),
          Box({ paddingX: 1 }, Text({ color: 'gray' }, '📊 Analytics')),
          Box({ paddingX: 1 }, Text({ color: 'gray' }, '👥 Users')),
          Box({ paddingX: 1 }, Text({ color: 'gray' }, '📁 Files')),
          Box({ paddingX: 1 }, Text({ color: 'gray' }, '⚙️  Settings')),
          Spacer({})
        ),
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'gray' },
          Text({ color: 'gray', dim: true }, '? Help')
        )
      )
    ),

  story('Pattern - Tab Bar')
    .category('Organisms')
    .description('Tab bar navigation pattern')
    .render(() =>
      Box(
        { flexDirection: 'column', width: 50 },
        Box(
          { flexDirection: 'row', borderStyle: 'single', borderColor: 'gray' },
          Box(
            { backgroundColor: 'blue', paddingX: 2 },
            Text({ color: 'white', bold: true }, 'Overview')
          ),
          Box({ paddingX: 2 }, Text({ color: 'gray' }, 'Details')),
          Box({ paddingX: 2 }, Text({ color: 'gray' }, 'Settings')),
          Box({ paddingX: 2 }, Text({ color: 'gray' }, 'Logs'))
        ),
        Box(
          {
            borderStyle: 'single',
            borderColor: 'blue',
            padding: 1,
            height: 8,
          },
          Text({}, 'Overview content goes here...')
        )
      )
    ),

  story('Pattern - Pagination')
    .category('Organisms')
    .description('Pagination controls pattern')
    .render(() =>
      Box(
        { flexDirection: 'row', gap: 1, justifyContent: 'center', width: 50 },
        Text({ color: 'gray' }, '« First'),
        Text({ color: 'cyan' }, '‹ Prev'),
        Text({ color: 'gray' }, '1'),
        Text({ color: 'white', inverse: true }, ' 2 '),
        Text({ color: 'gray' }, '3'),
        Text({ color: 'gray' }, '4'),
        Text({ color: 'gray' }, '...'),
        Text({ color: 'gray' }, '10'),
        Text({ color: 'cyan' }, 'Next ›'),
        Text({ color: 'gray' }, 'Last »')
      )
    ),
];

/**
 * Overlay stories - Modal, Popup, Tooltip, Toast
 */
const overlayStories: Story[] = [
  story('Modal - Basic')
    .category('Organisms')
    .description('Basic modal dialog')
    .controls({
      title: defaultControls.text('Title', 'Confirm Action'),
      showClose: defaultControls.boolean('Show Close', true),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', width: 50, height: 15 },
        // Backdrop simulation
        Box(
          {
            flexGrow: 1,
            backgroundColor: 'gray',
            justifyContent: 'center',
            alignItems: 'center',
          },
          // Modal window
          Box(
            {
              flexDirection: 'column',
              width: 40,
              borderStyle: 'double',
              borderColor: 'cyan',
              backgroundColor: 'black',
            },
            // Header
            Box(
              { paddingX: 1, justifyContent: 'space-between', borderStyle: 'single', borderColor: 'gray' },
              Text({ color: 'cyan', bold: true }, props.title),
              props.showClose && Text({ color: 'gray' }, '[×]')
            ),
            // Body
            Box(
              { padding: 1, flexGrow: 1 },
              Text({}, 'Are you sure you want to proceed with this action?')
            ),
            // Footer
            Box(
              { paddingX: 1, paddingY: 1, gap: 2, justifyContent: 'flex-end', borderStyle: 'single', borderColor: 'gray' },
              Text({ color: 'gray', inverse: true }, ' Cancel '),
              Text({ color: 'cyan', inverse: true }, ' Confirm ')
            )
          )
        )
      )
    ),

  story('Modal - Alert')
    .category('Organisms')
    .description('Alert modal with icon')
    .controls({
      type: defaultControls.select('Type', ['info', 'warning', 'error', 'success'], 'warning'),
    })
    .render((props) => {
      const alertType = props.type || 'warning';
      const icons = { info: 'ℹ', warning: '⚠', error: '✗', success: '✓' };
      const colors = { info: 'cyan', warning: 'yellow', error: 'red', success: 'green' };
      const icon = icons[alertType as keyof typeof icons] || '⚠';
      const color = colors[alertType as keyof typeof colors] || 'yellow';

      return Box(
        {
          flexDirection: 'column',
          width: 45,
          borderStyle: 'double',
          borderColor: color as any,
        },
        Box(
          { padding: 1, alignItems: 'center', gap: 1 },
          Text({ color: color as any, bold: true }, icon),
          Text({ color: color as any, bold: true }, String(alertType).toUpperCase())
        ),
        Box(
          { paddingX: 1, paddingBottom: 1 },
          Text({}, 'This is an important message that requires your attention.')
        ),
        Box(
          { paddingX: 1, paddingBottom: 1, justifyContent: 'center' },
          Text({ color: color as any, inverse: true }, '  OK  ')
        )
      );
    }),

  story('Tooltip - Basic')
    .category('Organisms')
    .description('Tooltip on hover/focus')
    .controls({
      position: defaultControls.select('Position', ['top', 'bottom', 'left', 'right'], 'top'),
    })
    .render((props) => {
      const renderTooltip = () =>
        Box(
          {
            borderStyle: 'single',
            borderColor: 'yellow',
            backgroundColor: 'yellow',
            paddingX: 1,
          },
          Text({ color: 'black' }, 'Helpful tooltip text')
        );

      return Box(
        { flexDirection: 'column', alignItems: 'center', gap: 1, padding: 2 },
        props.position === 'top' && renderTooltip(),
        Box(
          { flexDirection: 'row', gap: 1 },
          props.position === 'left' && renderTooltip(),
          Box(
            { borderStyle: 'single', borderColor: 'cyan', paddingX: 2, paddingY: 1 },
            Text({ color: 'cyan' }, 'Hover me')
          ),
          props.position === 'right' && renderTooltip()
        ),
        props.position === 'bottom' && renderTooltip()
      );
    }),

  story('Toast - Notification')
    .category('Organisms')
    .description('Toast notification messages')
    .controls({
      type: defaultControls.select('Type', ['info', 'success', 'warning', 'error'], 'success'),
    })
    .render((props) => {
      const icons = { info: 'ℹ', success: '✓', warning: '⚠', error: '✗' };
      const colors = { info: 'cyan', success: 'green', warning: 'yellow', error: 'red' };
      const messages = {
        info: 'New update available',
        success: 'Changes saved successfully!',
        warning: 'Your session will expire soon',
        error: 'Failed to save changes',
      };
      const icon = icons[props.type as keyof typeof icons];
      const color = colors[props.type as keyof typeof colors];
      const message = messages[props.type as keyof typeof messages];

      return Box(
        { flexDirection: 'column', alignItems: 'flex-end', width: 50, height: 10 },
        Box(
          {
            borderStyle: 'round',
            borderColor: color as any,
            paddingX: 1,
            width: 35,
          },
          Text({ color: color as any }, `${icon} `),
          Text({}, message),
          Text({ color: 'gray', dim: true }, '  ×')
        )
      );
    }),

  story('Toast - Stack')
    .category('Organisms')
    .description('Multiple stacked toasts')
    .render(() =>
      Box(
        { flexDirection: 'column', alignItems: 'flex-end', gap: 1, width: 50 },
        Box(
          { borderStyle: 'round', borderColor: 'green', paddingX: 1, width: 35 },
          Text({ color: 'green' }, '✓ '),
          Text({}, 'File uploaded'),
          Text({ color: 'gray' }, '  ×')
        ),
        Box(
          { borderStyle: 'round', borderColor: 'cyan', paddingX: 1, width: 35 },
          Text({ color: 'cyan' }, 'ℹ '),
          Text({}, '2 new messages'),
          Text({ color: 'gray' }, '  ×')
        ),
        Box(
          { borderStyle: 'round', borderColor: 'yellow', paddingX: 1, width: 35 },
          Text({ color: 'yellow' }, '⚠ '),
          Text({}, 'Low disk space'),
          Text({ color: 'gray' }, '  ×')
        )
      )
    ),

  story('Popup - Dropdown Menu')
    .category('Organisms')
    .description('Dropdown popup menu')
    .render(() =>
      Box(
        { flexDirection: 'column', width: 40 },
        // Trigger
        Box(
          { borderStyle: 'single', borderColor: 'cyan', paddingX: 1 },
          Text({ color: 'cyan' }, '⚙ Settings ▼')
        ),
        // Dropdown
        Box(
          {
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: 'gray',
            marginLeft: 2,
            width: 25,
          },
          Box({ paddingX: 1, backgroundColor: 'blue' }, Text({ color: 'white' }, '👤 Profile')),
          Box({ paddingX: 1 }, Text({ color: 'gray' }, '🔔 Notifications')),
          Box({ paddingX: 1 }, Text({ color: 'gray' }, '🎨 Appearance')),
          Divider({ color: 'gray' }),
          Box({ paddingX: 1 }, Text({ color: 'red' }, '🚪 Logout'))
        )
      )
    ),

  story('Popup - Context Menu')
    .category('Organisms')
    .description('Right-click context menu')
    .render(() =>
      Box(
        { flexDirection: 'column', width: 50, height: 12 },
        Text({ color: 'gray', dim: true }, 'Right-click area simulation:'),
        Box(
          { flexDirection: 'row', marginTop: 1 },
          Box(
            { width: 20, height: 8, borderStyle: 'single', borderColor: 'gray' },
            Text({ color: 'gray', dim: true }, 'Content...')
          ),
          Box(
            {
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'cyan',
              marginLeft: 2,
              width: 20,
            },
            Box({ paddingX: 1 }, Text({}, '📋 Copy')),
            Box({ paddingX: 1 }, Text({}, '✂️  Cut')),
            Box({ paddingX: 1 }, Text({}, '📄 Paste')),
            Divider({ color: 'gray' }),
            Box({ paddingX: 1 }, Text({}, '🗑️  Delete')),
            Box({ paddingX: 1 }, Text({}, 'ℹ️  Properties'))
          )
        )
      )
    ),
];

/**
 * Status bar stories
 */
const statusBarStories: Story[] = [
  story('StatusBar - Basic')
    .category('Organisms')
    .description('Application status bar')
    .render(() =>
      Box(
        { flexDirection: 'column', width: 60 },
        // Content area
        Box(
          { height: 5, borderStyle: 'single', borderColor: 'gray', padding: 1 },
          Text({ color: 'gray' }, 'Main content area...')
        ),
        // Status bar
        Box(
          { backgroundColor: 'blue', paddingX: 1, justifyContent: 'space-between' },
          Box(
            { gap: 2 },
            Text({ color: 'white' }, 'NORMAL'),
            Text({ color: 'white' }, 'main.ts'),
            Text({ color: 'white' }, 'TypeScript')
          ),
          Box(
            { gap: 2 },
            Text({ color: 'white' }, 'Ln 42, Col 15'),
            Text({ color: 'white' }, 'UTF-8'),
            Text({ color: 'white' }, 'LF')
          )
        )
      )
    ),

  story('StatusBar - With Icons')
    .category('Organisms')
    .description('Status bar with status icons')
    .render(() =>
      Box(
        {
          backgroundColor: 'gray',
          paddingX: 1,
          width: 60,
          justifyContent: 'space-between',
        },
        Box(
          { gap: 2 },
          Text({ color: 'green' }, '✓ Connected'),
          Text({ color: 'cyan' }, '↻ Syncing...'),
          Text({ color: 'yellow' }, '⚠ 2 warnings')
        ),
        Box(
          { gap: 2 },
          Text({ color: 'white' }, '🔋 85%'),
          Text({ color: 'white' }, '📶 Strong'),
          Text({ color: 'white' }, '14:32')
        )
      )
    ),

  story('StatusBar - Progress')
    .category('Organisms')
    .description('Status bar with progress indicator')
    .controls({
      progress: defaultControls.range('Progress', 65, 0, 100),
    })
    .render((props) => {
      const width = 20;
      const filled = Math.floor((props.progress / 100) * width);
      const bar = '█'.repeat(filled) + '░'.repeat(width - filled);

      return Box(
        {
          backgroundColor: 'blue',
          paddingX: 1,
          width: 60,
          justifyContent: 'space-between',
        },
        Box(
          { gap: 1 },
          Text({ color: 'white' }, 'Building...'),
          Text({ color: 'cyan' }, `[${bar}]`),
          Text({ color: 'white' }, `${props.progress}%`)
        ),
        Text({ color: 'yellow' }, 'Press Ctrl+C to cancel')
      );
    }),

  story('Window - Basic')
    .category('Organisms')
    .description('Window with title bar')
    .controls({
      title: defaultControls.text('Title', 'My Window'),
      focused: defaultControls.boolean('Focused', true),
    })
    .render((props) =>
      Box(
        {
          flexDirection: 'column',
          width: 45,
          height: 12,
          borderStyle: 'double',
          borderColor: props.focused ? 'cyan' : 'gray',
        },
        // Title bar
        Box(
          {
            backgroundColor: props.focused ? 'blue' : 'gray',
            paddingX: 1,
            justifyContent: 'space-between',
          },
          Text({ color: 'white', bold: props.focused }, props.title),
          Box(
            { gap: 1 },
            Text({ color: 'white' }, '─'),
            Text({ color: 'white' }, '□'),
            Text({ color: 'red' }, '×')
          )
        ),
        // Content
        Box(
          { padding: 1, flexGrow: 1 },
          Text({ color: 'gray' }, 'Window content goes here...')
        )
      )
    ),

  story('Window - With Menu')
    .category('Organisms')
    .description('Window with menu bar')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 50,
          height: 15,
          borderStyle: 'double',
          borderColor: 'cyan',
        },
        // Title bar
        Box(
          { backgroundColor: 'blue', paddingX: 1, justifyContent: 'space-between' },
          Text({ color: 'white', bold: true }, 'Text Editor'),
          Box({ gap: 1 }, Text({ color: 'white' }, '─ □ ×'))
        ),
        // Menu bar
        Box(
          { borderStyle: 'single', borderColor: 'gray', paddingX: 1, gap: 2 },
          Text({ color: 'white', underline: true }, 'F'),
          Text({ color: 'gray' }, 'ile'),
          Text({ color: 'white', underline: true }, 'E'),
          Text({ color: 'gray' }, 'dit'),
          Text({ color: 'white', underline: true }, 'V'),
          Text({ color: 'gray' }, 'iew'),
          Text({ color: 'white', underline: true }, 'H'),
          Text({ color: 'gray' }, 'elp')
        ),
        // Content
        Box(
          { padding: 1, flexGrow: 1 },
          Text({ color: 'gray' }, 'Document content...')
        ),
        // Status bar
        Box(
          { backgroundColor: 'gray', paddingX: 1, justifyContent: 'space-between' },
          Text({ color: 'white' }, 'Ready'),
          Text({ color: 'white' }, 'Ln 1, Col 1')
        )
      )
    ),

  story('Window - Dialog')
    .category('Organisms')
    .description('Dialog window with buttons')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 40,
          borderStyle: 'double',
          borderColor: 'yellow',
        },
        // Title bar
        Box(
          { backgroundColor: 'yellow', paddingX: 1 },
          Text({ color: 'black', bold: true }, '⚠ Warning')
        ),
        // Content
        Box(
          { padding: 1 },
          Text({}, 'Are you sure you want to delete this file? This action cannot be undone.')
        ),
        // Buttons
        Box(
          { paddingX: 1, paddingBottom: 1, gap: 2, justifyContent: 'flex-end' },
          Text({ color: 'gray', inverse: true }, ' No '),
          Text({ color: 'red', inverse: true }, ' Yes ')
        )
      )
    ),
];

/**
 * Real-time Dashboard stories
 * Note: For actual real-time animation, run: pnpm tsx examples/realtime-dashboard.ts
 */
const realtimeDashboardStories: Story[] = [
  story('Dashboard - Metrics')
    .category('Organisms')
    .description('Dashboard with live metrics (static preview)')
    .render(() => {
      const sparkChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
      const randomSparkline = (len: number) =>
        Array.from({ length: len }, () => sparkChars[Math.floor(Math.random() * 8)]).join('');

      return Box(
        { flexDirection: 'column', gap: 1 },
        // Header
        Box(
          { borderStyle: 'double', borderColor: 'cyan', paddingX: 1 },
          Text({ color: 'cyan', bold: true }, '🖥️  Real-time Dashboard'),
          Spacer({}),
          Text({ color: 'green' }, '● Live'),
          Text({ color: 'gray' }, ' | '),
          Text({ color: 'gray', dim: true }, 'Uptime: 02:34:56')
        ),
        // Row 1
        Box(
          { flexDirection: 'row', gap: 1 },
          Box(
            { borderStyle: 'round', borderColor: 'green', padding: 1, width: 28 },
            Box(
              { flexDirection: 'column' },
              Text({ color: 'gray', dim: true }, 'CPU Usage'),
              Box(
                { flexDirection: 'row', gap: 1 },
                Text({ color: 'green' }, '[████████████░░░░░░░░]'),
                Text({ color: 'green', bold: true }, '58.3%')
              ),
              Text({ color: 'green', dim: true }, randomSparkline(25))
            )
          ),
          Box(
            { borderStyle: 'round', borderColor: 'cyan', padding: 1, width: 28 },
            Box(
              { flexDirection: 'column' },
              Text({ color: 'gray', dim: true }, 'Memory'),
              Box(
                { flexDirection: 'row', gap: 1 },
                Text({ color: 'cyan' }, '[██████████░░░░░░░░░░]'),
                Text({ color: 'cyan', bold: true }, '52.1%')
              ),
              Text({ color: 'gray' }, '8.3 GB / 16.0 GB')
            )
          )
        ),
        // Row 2
        Box(
          { flexDirection: 'row', gap: 1 },
          Box(
            { borderStyle: 'round', borderColor: 'blue', padding: 1, width: 40 },
            Box(
              { flexDirection: 'column' },
              Box(
                { flexDirection: 'row' },
                Text({ color: 'gray', dim: true }, 'Requests/sec'),
                Spacer({}),
                Text({ color: 'gray', dim: true }, 'Total: 1.2M')
              ),
              Text({ color: 'blue', bold: true }, '892 req/s'),
              Text({ color: 'blue' }, randomSparkline(35))
            )
          ),
          Box(
            { borderStyle: 'round', borderColor: 'yellow', padding: 1, width: 18 },
            Box(
              { flexDirection: 'column' },
              Text({ color: 'gray', dim: true }, 'Active Spinners'),
              Text({ color: 'cyan' }, '⠋ Fetching...'),
              Text({ color: 'green' }, '◜ Processing...'),
              Text({ color: 'yellow' }, '🕐 Syncing...')
            )
          )
        ),
        // Footer
        Box(
          { backgroundColor: 'blue', paddingX: 1 },
          Text({ color: 'white' }, '● 234 connections'),
          Spacer({}),
          Text({ color: 'white' }, 'Render: 30 FPS'),
          Text({ color: 'gray' }, ' | '),
          Text({ color: 'white' }, '14:32:45')
        )
      );
    }),

  story('Dashboard - Gauges')
    .category('Organisms')
    .description('Gauge widgets for metrics')
    .render(() =>
      Box(
        { flexDirection: 'row', gap: 2 },
        // CPU Gauge
        Box(
          { borderStyle: 'round', borderColor: 'green', padding: 1, width: 20 },
          Box(
            { flexDirection: 'column', alignItems: 'center' },
            Text({ color: 'gray', dim: true }, 'CPU'),
            Text({ color: 'green', bold: true }, '58%'),
            Text({ color: 'green' }, '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁')
          )
        ),
        // Memory Gauge
        Box(
          { borderStyle: 'round', borderColor: 'cyan', padding: 1, width: 20 },
          Box(
            { flexDirection: 'column', alignItems: 'center' },
            Text({ color: 'gray', dim: true }, 'Memory'),
            Text({ color: 'cyan', bold: true }, '8.3GB'),
            Text({ color: 'cyan' }, '████████░░░░░░░░')
          )
        ),
        // Disk Gauge
        Box(
          { borderStyle: 'round', borderColor: 'yellow', padding: 1, width: 20 },
          Box(
            { flexDirection: 'column', alignItems: 'center' },
            Text({ color: 'gray', dim: true }, 'Disk'),
            Text({ color: 'yellow', bold: true }, '78%'),
            Text({ color: 'yellow' }, '████████████░░░░')
          )
        )
      )
    ),

  story('Dashboard - Sparklines')
    .category('Organisms')
    .description('Sparkline charts for time series')
    .controls({
      showLabels: defaultControls.boolean('Show Labels', true),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, width: 50 },
        Box(
          { flexDirection: 'row', gap: 1 },
          props.showLabels && Box({ width: 10 }, Text({ color: 'gray' }, 'CPU:')),
          Text({ color: 'green' }, '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃'),
          Text({ color: 'green', bold: true }, ' 58%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          props.showLabels && Box({ width: 10 }, Text({ color: 'gray' }, 'Memory:')),
          Text({ color: 'cyan' }, '▄▄▄▄▅▅▅▅▅▅▆▆▆▆▆▆▅▅▅▅▅▅▄▄▄▄▄▄▄▄▄'),
          Text({ color: 'cyan', bold: true }, ' 52%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          props.showLabels && Box({ width: 10 }, Text({ color: 'gray' }, 'Network:')),
          Text({ color: 'magenta' }, '▂▃▅▇█▆▄▂▁▂▃▅▇█▆▄▂▁▂▃▅▇█▆▄▂▁▂▃▅'),
          Text({ color: 'magenta', bold: true }, ' 45MB/s')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          props.showLabels && Box({ width: 10 }, Text({ color: 'gray' }, 'Errors:')),
          Text({ color: 'red' }, '▁▁▁▁▁▁▁▁▂▁▁▁▁▁▁▁▁▁▁▃▁▁▁▁▁▁▁▁▁▁▁'),
          Text({ color: 'green', bold: true }, ' 0.1%')
        )
      )
    ),

  story('Spinner - Animated')
    .category('Organisms')
    .description('Spinner styles (run real example for animation)')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({ color: 'gray', dim: true }, 'Note: For real animation, run: pnpm tsx examples/realtime-dashboard.ts'),
        Box({ marginTop: 1 }),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'cyan' }, '⠋'), Text({}, 'dots - Braille dots')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'green' }, '◜'), Text({}, 'arc - Arc spinner')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'yellow' }, '◐'), Text({}, 'circle - Circle')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'magenta' }, '🕐'), Text({}, 'clock - Clock emoji')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'blue' }, '🌍'), Text({}, 'earth - Globe')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'red' }, '←'), Text({}, 'arrow - Directional')),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'cyan' }, '[=== ]'),
          Text({}, 'bouncingBar - Progress bar')
        )
      )
    ),
];

/**
 * All organism stories
 */
export const allOrganismStories: Story[] = [
  ...formPatternStories,
  ...splitPanelStories,
  ...gridStories,
  ...stackStories,
  ...layoutPatternStories,
  ...barChartStories,
  ...heatmapStories,
  ...dashboardStories,
  ...fileBrowserStories,
  ...chatStories,
  ...commandPaletteStories,
  ...navigationStories,
  ...overlayStories,
  ...statusBarStories,
  ...realtimeDashboardStories,
];

export default allOrganismStories;
