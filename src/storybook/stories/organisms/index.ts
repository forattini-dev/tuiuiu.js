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
import { getTheme } from '../../../core/theme.js';
import type { Story } from '../../types.js';
import { StatusBar, Header } from '../../../templates/app.js';

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
          borderColor: 'primary',
          padding: 2,
          width: 40,
        },
        Box(
          { marginBottom: 1 },
          Text({ color: 'primary', bold: true }, 'Login')
        ),
        Box(
          { flexDirection: 'column', marginBottom: 1 },
          Text({ color: 'muted' }, 'Username:'),
          Box(
            { borderStyle: 'single', borderColor: 'border', paddingX: 1 },
            Text({}, 'user@example.com')
          )
        ),
        Box(
          { flexDirection: 'column', marginBottom: 1 },
          Text({ color: 'muted' }, 'Password:'),
          Box(
            { borderStyle: 'single', borderColor: 'border', paddingX: 1 },
            Text({}, '********')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { backgroundColor: 'primary', paddingX: 2 },
            Text({ color: 'primaryForeground', bold: true }, 'Login')
          ),
          Text({ color: 'muted', dim: true }, 'Forgot password?')
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
          borderColor: 'border',
          padding: 1,
          width: 50,
        },
        Box(
          { marginBottom: 1 },
          Text({ color: 'foreground', bold: true }, 'Settings')
        ),
        Box(
          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
          Text({}, 'Dark Mode'),
          Text({ color: 'success' }, '[ON]')
        ),
        Box(
          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
          Text({}, 'Notifications'),
          Text({ color: 'error' }, '[OFF]')
        ),
        Box(
          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 1 },
          Text({}, 'Language'),
          Text({ color: 'primary' }, 'English ▼')
        ),
        Box(
          { flexDirection: 'row', justifyContent: 'space-between' },
          Text({}, 'Volume'),
          Text({ color: 'warning' }, '████████░░ 80%')
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
        { width: 60, height: 10, flexDirection: 'row', borderStyle: 'single', borderColor: 'border' },
        Box(
          { width: leftWidth, height: '100%', backgroundColor: 'info', padding: 1 },
          Text({ color: 'foreground' }, 'Left Panel')
        ),
        Box(
          { width: 1, height: '100%', backgroundColor: 'muted' },
          Text({ color: 'foreground' }, '│')
        ),
        Box(
          { width: rightWidth, height: '100%', backgroundColor: 'success', padding: 1 },
          Text({ color: 'foreground' }, 'Right Panel')
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
          borderColor: 'border',
        },
        Box(
          { height: topHeight, width: '100%', backgroundColor: 'info', padding: 1 },
          Text({ color: 'foreground' }, 'Top Panel')
        ),
        Box(
          { width: '100%' },
          Text({ color: 'muted' }, '─'.repeat(38))
        ),
        Box(
          { height: bottomHeight, width: '100%', backgroundColor: 'success', padding: 1 },
          Text({ color: 'foreground' }, 'Bottom Panel')
        )
      );
    }),

  story('SplitPanel - Nested')
    .category('Organisms')
    .description('Nested split panels')
    .render(() =>
      Box(
        { width: 60, height: 15, borderStyle: 'single', borderColor: 'border' },
        Box(
          { width: 17, height: '100%', backgroundColor: 'info', padding: 1 },
          Text({ color: 'foreground' }, 'Sidebar')
        ),
        Box(
          { width: 1, height: '100%' },
          Text({ color: 'muted' }, '│')
        ),
        Box(
          { flexGrow: 1, height: '100%', flexDirection: 'column' },
          Box(
            { height: 9, width: '100%', backgroundColor: 'success', padding: 1 },
            Text({ color: 'foreground' }, 'Main Content')
          ),
          Box(
            { width: '100%' },
            Text({ color: 'muted' }, '─'.repeat(40))
          ),
          Box(
            { height: 3, width: '100%', backgroundColor: 'secondary', padding: 1 },
            Text({ color: 'foreground' }, 'Footer')
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
      const colors = ['info', 'success', 'secondary'] as const;

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
                  Text({ color: 'foreground' }, `Cell ${cell}`)
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
            { backgroundColor: 'info', padding: 1, flexGrow: 1 },
            Text({ color: 'foreground', bold: true }, 'Users: 1.2k')
          ),
          Box(
            { backgroundColor: 'success', padding: 1, flexGrow: 1 },
            Text({ color: 'foreground', bold: true }, 'Revenue: $45k')
          ),
          Box(
            { backgroundColor: 'secondary', padding: 1, flexGrow: 1 },
            Text({ color: 'foreground', bold: true }, 'Orders: 892')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box(
            { backgroundColor: 'muted', padding: 1, width: 38 },
            Text({ color: 'foreground' }, 'Chart Area\n▂▃▅▇█▇▅▃▂▃▅▇')
          ),
          Box(
            { backgroundColor: 'primary', padding: 1, flexGrow: 1 },
            Text({ color: 'primaryForeground' }, 'Activity\n• New user\n• Sale\n• Comment')
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
        Box({ backgroundColor: 'info', padding: 1 }, Text({ color: 'foreground' }, 'Item 1')),
        Box({ backgroundColor: 'success', padding: 1 }, Text({ color: 'foreground' }, 'Item 2')),
        Box({ backgroundColor: 'secondary', padding: 1 }, Text({ color: 'foreground' }, 'Item 3'))
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
        Box({ backgroundColor: 'info', padding: 1 }, Text({ color: 'foreground' }, 'A')),
        Box({ backgroundColor: 'success', padding: 1 }, Text({ color: 'foreground' }, 'B')),
        Box({ backgroundColor: 'secondary', padding: 1 }, Text({ color: 'foreground' }, 'C'))
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
          Text({ color: 'primary', bold: true }, 'App Title'),
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'muted' }, 'Home'),
            Text({ color: 'muted' }, 'About'),
            Text({ color: 'muted' }, 'Contact')
          )
        ),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { flexDirection: 'column', gap: 1, width: 15 },
            Text({ color: 'primary' }, '> Dashboard'),
            Text({ color: 'muted' }, '  Users'),
            Text({ color: 'muted' }, '  Settings')
          ),
          Box(
            { flexDirection: 'column', gap: 1 },
            Text({ bold: true }, 'Dashboard'),
            Text({ color: 'muted' }, 'Welcome to your dashboard.')
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
          { backgroundColor: 'info', paddingX: 1, width: '100%' },
          Text({ color: 'foreground', bold: true }, 'Header')
        ),
        Box(
          { flexDirection: 'row', flexGrow: 1 },
          Box(
            { backgroundColor: 'success', width: 12, padding: 1 },
            Text({ color: 'foreground' }, 'Sidebar')
          ),
          Box(
            { flexGrow: 1, padding: 1 },
            Text({}, 'Main Content Area')
          ),
          Box(
            { backgroundColor: 'secondary', width: 12, padding: 1 },
            Text({ color: 'secondaryForeground' }, 'Aside')
          )
        ),
        Box(
          { backgroundColor: 'primary', paddingX: 1, width: '100%' },
          Text({ color: 'primaryForeground' }, 'Footer')
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
                backgroundColor: 'info',
                width: 20,
                padding: 1,
                flexDirection: 'column',
              },
              Text({ color: 'foreground', bold: true }, 'Navigation'),
              Text({ color: 'primary' }, '> Home'),
              Text({ color: 'muted' }, '  Files'),
              Text({ color: 'muted' }, '  Settings')
            )
          : null,
        Box(
          { flexGrow: 1, padding: 1, flexDirection: 'column' },
          Text({ bold: true }, 'Content'),
          Text({ color: 'muted' }, props.sidebarOpen ? 'Sidebar is open' : 'Sidebar is closed'),
          Box(
            { marginTop: 1 },
            Text({ color: 'muted', dim: true }, '[Toggle sidebar with control]')
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
              borderColor: (['primary', 'success', 'secondary', 'warning', 'info', 'error'] as const)[i],
              padding: 1,
              flexDirection: 'column',
            },
            Text({ bold: true }, `Card ${i + 1}`),
            Text({ color: 'muted', dim: true }, 'Card content...')
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
            Box({ width: 12 }, Text({ color: 'muted' }, item.label)),
            Text({ color: 'primary' }, textBar(item.value, max, props.width)),
            Text({ color: 'muted', dim: true }, ` ${item.value}%`)
          )
        )
      );
    }),

  story('BarChart - Colored')
    .category('Organisms')
    .description('Bar chart with colors')
    .render(() => {
      const data = [
        { label: 'Success', value: 85, color: 'success' as const },
        { label: 'Warning', value: 45, color: 'warning' as const },
        { label: 'Error', value: 12, color: 'error' as const },
        { label: 'Info', value: 30, color: 'info' as const },
      ];
      const max = 100;

      return Box(
        { flexDirection: 'column', gap: 1 },
        ...data.map((item) =>
          Box(
            { flexDirection: 'row', gap: 1 },
            Box({ width: 10 }, Text({ color: 'muted' }, item.label)),
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
          Box({ width: 6 }, Text({ color: 'muted' }, 'Q1:')),
          Text({ backgroundColor: 'info', color: 'foreground' }, '████████'),
          Text({ backgroundColor: 'success', color: 'foreground' }, '████'),
          Text({ backgroundColor: 'warning', color: 'background' }, '██')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 6 }, Text({ color: 'muted' }, 'Q2:')),
          Text({ backgroundColor: 'info', color: 'foreground' }, '██████████'),
          Text({ backgroundColor: 'success', color: 'foreground' }, '██████'),
          Text({ backgroundColor: 'warning', color: 'background' }, '███')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 6 }, Text({ color: 'muted' }, 'Q3:')),
          Text({ backgroundColor: 'info', color: 'foreground' }, '████████████'),
          Text({ backgroundColor: 'success', color: 'foreground' }, '████████'),
          Text({ backgroundColor: 'warning', color: 'background' }, '████')
        ),
        Box(
          { marginTop: 1, flexDirection: 'row', gap: 2 },
          Box({}, Text({ color: 'info' }, '■'), Text({ color: 'muted' }, ' Sales')),
          Box({}, Text({ color: 'success' }, '■'), Text({ color: 'muted' }, ' Marketing')),
          Box({}, Text({ color: 'warning' }, '■'), Text({ color: 'muted' }, ' Support'))
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
        if (value > 9) return 'error';
        if (value > 6) return 'warning';
        if (value > 3) return 'success';
        return 'primary';
      };

      return Box(
        { flexDirection: 'column' },
        ...data.map((row) =>
          Box(
            { flexDirection: 'row' },
            ...row.map((value) =>
              Text(
                { backgroundColor: getColor(value), color: 'foreground' },
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
      const colors = ['muted', 'success', 'success', 'success'] as const;
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeks = 5;

      const getRandomIntensity = () => Math.floor(Math.random() * 4);

      return Box(
        { flexDirection: 'column' },
        Box({ marginBottom: 1 }, Text({ color: 'muted' }, 'Activity (last 5 weeks)')),
        ...days.map((day) =>
          Box(
            { flexDirection: 'row' },
            Box({ width: 4 }, Text({ color: 'muted' }, day)),
            ...Array.from({ length: weeks }, () => {
              const intensity = getRandomIntensity();
              return Text({ color: colors[intensity] }, blocks[intensity] + ' ');
            })
          )
        ),
        Box(
          { marginTop: 1, flexDirection: 'row', gap: 1 },
          Text({ color: 'muted', dim: true }, 'Less'),
          Text({ color: 'muted' }, '░'),
          Text({ color: 'success' }, '▒'),
          Text({ color: 'success' }, '▓'),
          Text({ color: 'success' }, '█'),
          Text({ color: 'muted', dim: true }, 'More')
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
            borderColor: 'primary',
            padding: 1,
            width: 18,
          },
          Box(
            { flexDirection: 'column' },
            Text({ color: 'muted', dim: true }, 'Total Users'),
            Text({ color: 'primary', bold: true }, '12,543'),
            Text({ color: 'success', dim: true }, '↑ 12.5%')
          )
        ),
        Box(
          {
            borderStyle: 'round',
            borderColor: 'success',
            padding: 1,
            width: 18,
          },
          Box(
            { flexDirection: 'column' },
            Text({ color: 'muted', dim: true }, 'Revenue'),
            Text({ color: 'success', bold: true }, '$45,231'),
            Text({ color: 'success', dim: true }, '↑ 8.2%')
          )
        ),
        Box(
          {
            borderStyle: 'round',
            borderColor: 'warning',
            padding: 1,
            width: 18,
          },
          Box(
            { flexDirection: 'column' },
            Text({ color: 'muted', dim: true }, 'Orders'),
            Text({ color: 'warning', bold: true }, '892'),
            Text({ color: 'error', dim: true }, '↓ 3.1%')
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
          borderColor: 'border',
          width: 60,
        },
        Box(
          { flexDirection: 'row', backgroundColor: 'info', paddingX: 1 },
          Box({ width: 20 }, Text({ color: 'foreground', bold: true }, 'Name')),
          Box({ width: 15 }, Text({ color: 'foreground', bold: true }, 'Status')),
          Box({ width: 10 }, Text({ color: 'foreground', bold: true }, 'Role')),
          Text({ color: 'foreground', bold: true }, 'Actions')
        ),
        Box(
          { flexDirection: 'row', paddingX: 1 },
          Box({ width: 20 }, Text({}, 'Alice Johnson')),
          Box({ width: 15 }, Text({ color: 'success' }, '● Active')),
          Box({ width: 10 }, Text({}, 'Admin')),
          Text({ color: 'primary' }, 'Edit | Del')
        ),
        Box(
          { flexDirection: 'row', paddingX: 1, backgroundColor: 'muted' },
          Box({ width: 20 }, Text({}, 'Bob Smith')),
          Box({ width: 15 }, Text({ color: 'success' }, '● Active')),
          Box({ width: 10 }, Text({}, 'User')),
          Text({ color: 'primary' }, 'Edit | Del')
        ),
        Box(
          { flexDirection: 'row', paddingX: 1 },
          Box({ width: 20 }, Text({}, 'Carol White')),
          Box({ width: 15 }, Text({ color: 'warning' }, '○ Pending')),
          Box({ width: 10 }, Text({}, 'User')),
          Text({ color: 'primary' }, 'Edit | Del')
        ),
        Box(
          { flexDirection: 'row', paddingX: 1, backgroundColor: 'muted' },
          Box({ width: 20 }, Text({}, 'David Brown')),
          Box({ width: 15 }, Text({ color: 'error' }, '○ Inactive')),
          Box({ width: 10 }, Text({}, 'User')),
          Text({ color: 'primary' }, 'Edit | Del')
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
          borderColor: 'border',
          padding: 1,
          width: 45,
        },
        Text({ color: 'foreground', bold: true }, 'Recent Activity'),
        Box({ marginTop: 1 }),
        Box(
          { flexDirection: 'row', gap: 1, marginBottom: 1 },
          Text({ color: 'primary' }, '●'),
          Box(
            { flexDirection: 'column' },
            Text({}, 'Alice uploaded a file'),
            Text({ color: 'muted', dim: true }, '2 minutes ago')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 1, marginBottom: 1 },
          Text({ color: 'success' }, '●'),
          Box(
            { flexDirection: 'column' },
            Text({}, 'Bob completed a task'),
            Text({ color: 'muted', dim: true }, '15 minutes ago')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 1, marginBottom: 1 },
          Text({ color: 'warning' }, '●'),
          Box(
            { flexDirection: 'column' },
            Text({}, 'Carol added a comment'),
            Text({ color: 'muted', dim: true }, '1 hour ago')
          )
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'secondary' }, '●'),
          Box(
            { flexDirection: 'column' },
            Text({}, 'David joined the team'),
            Text({ color: 'muted', dim: true }, '3 hours ago')
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
          borderColor: 'border',
          padding: 1,
          width: 40,
        },
        Text({ color: 'foreground', bold: true }, 'Files'),
        Box({ marginTop: 1 }),
        Text({ color: 'warning' }, '▼ 📁 src'),
        Text({ color: 'muted' }, '  ▼ 📁 components'),
        Text({ color: 'primary' }, '    ▶ 📁 ui'),
        Text({}, '      📄 button.ts'),
        Text({ inverse: true }, '      📄 input.ts'),
        Text({}, '      📄 modal.ts'),
        Text({ color: 'primary' }, '    ▶ 📁 layout'),
        Text({ color: 'muted' }, '  ▼ 📁 utils'),
        Text({}, '      📄 helpers.ts'),
        Text({ color: 'primary' }, '▶ 📁 tests'),
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
            borderColor: 'border',
            flexDirection: 'column',
          },
          Box(
            { paddingX: 1, backgroundColor: 'info' },
            Text({ color: 'foreground', bold: true }, 'Files')
          ),
          Box(
            { padding: 1, flexDirection: 'column' },
            Text({ color: 'warning' }, '📁 src'),
            Text({ color: 'warning' }, '📁 tests'),
            Text({ inverse: true }, '📄 package.json'),
            Text({}, '📄 README.md'),
            Text({}, '📄 tsconfig.json')
          )
        ),
        Box(
          {
            flexGrow: 1,
            borderStyle: 'single',
            borderColor: 'primary',
            flexDirection: 'column',
          },
          Box(
            { paddingX: 1, backgroundColor: 'primary' },
            Text({ color: 'primaryForeground', bold: true }, 'package.json')
          ),
          Box(
            { padding: 1, flexDirection: 'column' },
            Text({ color: 'muted' }, '{'),
            Box(
              { flexDirection: 'row' },
              Text({ color: 'primary' }, '  "name": '),
              Text({ color: 'success' }, '"tuiuiu"')
            ),
            Box(
              { flexDirection: 'row' },
              Text({ color: 'primary' }, '  "version": '),
              Text({ color: 'success' }, '"0.1.0"')
            ),
            Box(
              { flexDirection: 'row' },
              Text({ color: 'primary' }, '  "type": '),
              Text({ color: 'success' }, '"module"')
            ),
            Text({ color: 'muted' }, '  ...')
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
          Text({ color: 'primary' }, 'Home'),
          Text({ color: 'muted' }, ' > '),
          Text({ color: 'primary' }, 'Documents'),
          Text({ color: 'muted' }, ' > '),
          Text({ color: 'primary' }, 'Projects'),
          Text({ color: 'muted' }, ' > '),
          Text({ color: 'foreground', bold: true }, 'Report.pdf')
        ),
        Box(
          { flexDirection: 'row' },
          Text({ color: 'primary' }, '🏠'),
          Text({ color: 'muted' }, ' / '),
          Text({ color: 'primary' }, '📁 src'),
          Text({ color: 'muted' }, ' / '),
          Text({ color: 'primary' }, '📁 components'),
          Text({ color: 'muted' }, ' / '),
          Text({ color: 'foreground', bold: true }, '📄 button.ts')
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
          borderColor: 'border',
          padding: 1,
          width: 50,
        },
        Box(
          { flexDirection: 'column', marginBottom: 1 },
          Text({ color: 'primary', bold: true }, 'Alice'),
          Box(
            {
              borderStyle: 'round',
              borderColor: 'border',
              paddingX: 1,
              marginLeft: 2,
            },
            Text({}, 'Hey, how are you?')
          ),
          Text({ color: 'muted', dim: true }, '  10:30 AM')
        ),
        Box(
          { flexDirection: 'column', alignItems: 'flex-end', marginBottom: 1 },
          Text({ color: 'success', bold: true }, 'You'),
          Box(
            {
              borderStyle: 'round',
              borderColor: 'success',
              paddingX: 1,
              marginRight: 2,
            },
            Text({}, "I'm good, thanks! Working on the TUI.")
          ),
          Text({ color: 'muted', dim: true }, '10:32 AM  ')
        ),
        Box(
          { flexDirection: 'column' },
          Text({ color: 'primary', bold: true }, 'Alice'),
          Box(
            {
              borderStyle: 'round',
              borderColor: 'border',
              paddingX: 1,
              marginLeft: 2,
            },
            Text({}, "That sounds interesting! Can't wait to see it.")
          ),
          Text({ color: 'muted', dim: true }, '  10:33 AM')
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
          borderColor: 'primary',
          padding: 1,
          width: 50,
          gap: 1,
        },
        Text({ color: 'muted' }, '📎'),
        Box(
          { flexGrow: 1 },
          Text({ color: 'muted', dim: true }, 'Type a message...')
        ),
        Text({ color: 'muted' }, '😊'),
        Text({ color: 'primary' }, '➤')
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
          Text({ color: 'muted', dim: true }, 'Alice is typing'),
          Text({ color: 'muted' }, '...')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'primary' }, '●'),
          Text({ color: 'primary', dim: true }, '●'),
          Text({ color: 'muted', dim: true }, '●')
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
          borderColor: 'primary',
          width: 50,
        },
        Box(
          {
            paddingX: 1,
            paddingY: 1,
            borderStyle: 'single',
            borderColor: 'border',
          },
          Text({ color: 'muted' }, '> '),
          Text({ color: 'foreground' }, 'open file'),
          Text({ color: 'muted', dim: true }, '...')
        ),
        Box(
          { flexDirection: 'column', padding: 1 },
          Box(
            { backgroundColor: 'info', paddingX: 1, flexDirection: 'row' },
            Text({ color: 'foreground' }, '📄 Open File'),
            Spacer({}),
            Text({ color: 'muted' }, 'Ctrl+O')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({}, '📁 Open Folder'),
            Spacer({}),
            Text({ color: 'muted' }, 'Ctrl+K O')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({}, '📝 Open Recent'),
            Spacer({}),
            Text({ color: 'muted' }, 'Ctrl+R')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({}, '🔍 Open in Explorer'),
            Spacer({}),
            Text({ color: 'muted' }, 'Ctrl+Shift+E')
          )
        ),
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'border' },
          Text({ color: 'muted', dim: true }, '↑↓ Navigate  '),
          Text({ color: 'muted', dim: true }, '↵ Select  '),
          Text({ color: 'muted', dim: true }, 'Esc Close')
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
          borderColor: 'border',
          width: 35,
        },
        Box(
          { paddingX: 1, backgroundColor: 'info' },
          Text({ color: 'foreground', bold: true }, 'Quick Actions')
        ),
        Box(
          { flexDirection: 'column', padding: 1 },
          Box(
            { flexDirection: 'row' },
            Text({ color: 'primary' }, '[N] '),
            Text({}, 'New File')
          ),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'primary' }, '[S] '),
            Text({}, 'Save')
          ),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'primary' }, '[F] '),
            Text({}, 'Find')
          ),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'primary' }, '[R] '),
            Text({}, 'Replace')
          ),
          Divider({}),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'primary' }, '[Q] '),
            Text({ color: 'muted' }, 'Quit')
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
          borderColor: 'border',
          width: 25,
          height: 15,
        },
        Box(
          { paddingX: 1, backgroundColor: 'info' },
          Text({ color: 'foreground', bold: true }, '🚀 AppName')
        ),
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          Box(
            { backgroundColor: 'primary', paddingX: 1 },
            Text({ color: 'primaryForeground' }, '🏠 Dashboard')
          ),
          Box({ paddingX: 1 }, Text({ color: 'muted' }, '📊 Analytics')),
          Box({ paddingX: 1 }, Text({ color: 'muted' }, '👥 Users')),
          Box({ paddingX: 1 }, Text({ color: 'muted' }, '📁 Files')),
          Box({ paddingX: 1 }, Text({ color: 'muted' }, '⚙️  Settings')),
          Spacer({})
        ),
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'border' },
          Text({ color: 'muted', dim: true }, '? Help')
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
          { flexDirection: 'row', borderStyle: 'single', borderColor: 'border' },
          Box(
            { backgroundColor: 'info', paddingX: 2 },
            Text({ color: 'foreground', bold: true }, 'Overview')
          ),
          Box({ paddingX: 2 }, Text({ color: 'muted' }, 'Details')),
          Box({ paddingX: 2 }, Text({ color: 'muted' }, 'Settings')),
          Box({ paddingX: 2 }, Text({ color: 'muted' }, 'Logs'))
        ),
        Box(
          {
            borderStyle: 'single',
            borderColor: 'info',
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
        Text({ color: 'muted' }, '« First'),
        Text({ color: 'primary' }, '‹ Prev'),
        Text({ color: 'muted' }, '1'),
        Text({ color: 'foreground', inverse: true }, ' 2 '),
        Text({ color: 'muted' }, '3'),
        Text({ color: 'muted' }, '4'),
        Text({ color: 'muted' }, '...'),
        Text({ color: 'muted' }, '10'),
        Text({ color: 'primary' }, 'Next ›'),
        Text({ color: 'muted' }, 'Last »')
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
            backgroundColor: 'muted',
            justifyContent: 'center',
            alignItems: 'center',
          },
          // Modal window
          Box(
            {
              flexDirection: 'column',
              width: 40,
              borderStyle: 'double',
              borderColor: 'primary',
              backgroundColor: 'background',
            },
            // Header
            Box(
              { paddingX: 1, justifyContent: 'space-between', borderStyle: 'single', borderColor: 'border' },
              Text({ color: 'primary', bold: true }, props.title),
              props.showClose && Text({ color: 'muted' }, '[×]')
            ),
            // Body
            Box(
              { padding: 1, flexGrow: 1 },
              Text({}, 'Are you sure you want to proceed with this action?')
            ),
            // Footer
            Box(
              { paddingX: 1, paddingY: 1, gap: 2, justifyContent: 'flex-end', borderStyle: 'single', borderColor: 'border' },
              Text({ color: 'muted', inverse: true }, ' Cancel '),
              Text({ color: 'primary', inverse: true }, ' Confirm ')
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
      const colors = { info: 'info', warning: 'warning', error: 'error', success: 'success' };
      const icon = icons[alertType as keyof typeof icons] || '⚠';
      const color = colors[alertType as keyof typeof colors] || 'warning';

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
            borderColor: 'warning',
            backgroundColor: 'warning',
            paddingX: 1,
          },
          Text({ color: 'background' }, 'Helpful tooltip text')
        );

      return Box(
        { flexDirection: 'column', alignItems: 'center', gap: 1, padding: 2 },
        props.position === 'top' && renderTooltip(),
        Box(
          { flexDirection: 'row', gap: 1 },
          props.position === 'left' && renderTooltip(),
          Box(
            { borderStyle: 'single', borderColor: 'primary', paddingX: 2, paddingY: 1 },
            Text({ color: 'primary' }, 'Hover me')
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
      const colors = { info: 'info', success: 'success', warning: 'warning', error: 'error' };
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
          Text({ color: 'muted', dim: true }, '  ×')
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
          { borderStyle: 'round', borderColor: 'success', paddingX: 1, width: 35 },
          Text({ color: 'success' }, '✓ '),
          Text({}, 'File uploaded'),
          Text({ color: 'muted' }, '  ×')
        ),
        Box(
          { borderStyle: 'round', borderColor: 'info', paddingX: 1, width: 35 },
          Text({ color: 'info' }, 'ℹ '),
          Text({}, '2 new messages'),
          Text({ color: 'muted' }, '  ×')
        ),
        Box(
          { borderStyle: 'round', borderColor: 'warning', paddingX: 1, width: 35 },
          Text({ color: 'warning' }, '⚠ '),
          Text({}, 'Low disk space'),
          Text({ color: 'muted' }, '  ×')
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
          { borderStyle: 'single', borderColor: 'primary', paddingX: 1 },
          Text({ color: 'primary' }, '⚙ Settings ▼')
        ),
        // Dropdown
        Box(
          {
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: 'border',
            marginLeft: 2,
            width: 25,
          },
          Box({ paddingX: 1, backgroundColor: 'info' }, Text({ color: 'foreground' }, '👤 Profile')),
          Box({ paddingX: 1 }, Text({ color: 'muted' }, '🔔 Notifications')),
          Box({ paddingX: 1 }, Text({ color: 'muted' }, '🎨 Appearance')),
          Divider({ color: 'border' }),
          Box({ paddingX: 1 }, Text({ color: 'error' }, '🚪 Logout'))
        )
      )
    ),

  story('Popup - Context Menu')
    .category('Organisms')
    .description('Right-click context menu')
    .render(() =>
      Box(
        { flexDirection: 'column', width: 50, height: 12 },
        Text({ color: 'muted', dim: true }, 'Right-click area simulation:'),
        Box(
          { flexDirection: 'row', marginTop: 1 },
          Box(
            { width: 20, height: 8, borderStyle: 'single', borderColor: 'border' },
            Text({ color: 'muted', dim: true }, 'Content...')
          ),
          Box(
            {
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'primary',
              marginLeft: 2,
              width: 20,
            },
            Box({ paddingX: 1 }, Text({}, '📋 Copy')),
            Box({ paddingX: 1 }, Text({}, '✂️  Cut')),
            Box({ paddingX: 1 }, Text({}, '📄 Paste')),
            Divider({ color: 'border' }),
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
          { height: 5, borderStyle: 'single', borderColor: 'border', padding: 1 },
          Text({ color: 'muted' }, 'Main content area...')
        ),
        // Status bar
        Box(
          { backgroundColor: 'info', paddingX: 1, justifyContent: 'space-between' },
          Box(
            { gap: 2 },
            Text({ color: 'foreground' }, 'NORMAL'),
            Text({ color: 'foreground' }, 'main.ts'),
            Text({ color: 'foreground' }, 'TypeScript')
          ),
          Box(
            { gap: 2 },
            Text({ color: 'foreground' }, 'Ln 42, Col 15'),
            Text({ color: 'foreground' }, 'UTF-8'),
            Text({ color: 'foreground' }, 'LF')
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
          backgroundColor: 'muted',
          paddingX: 1,
          width: 60,
          justifyContent: 'space-between',
        },
        Box(
          { gap: 2 },
          Text({ color: 'success' }, '✓ Connected'),
          Text({ color: 'primary' }, '↻ Syncing...'),
          Text({ color: 'warning' }, '⚠ 2 warnings')
        ),
        Box(
          { gap: 2 },
          Text({ color: 'foreground' }, '🔋 85%'),
          Text({ color: 'foreground' }, '📶 Strong'),
          Text({ color: 'foreground' }, '14:32')
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
          backgroundColor: 'info',
          paddingX: 1,
          width: 60,
          justifyContent: 'space-between',
        },
        Box(
          { gap: 1 },
          Text({ color: 'foreground' }, 'Building...'),
          Text({ color: 'primary' }, `[${bar}]`),
          Text({ color: 'foreground' }, `${props.progress}%`)
        ),
        Text({ color: 'warning' }, 'Press Ctrl+C to cancel')
      );
    }),

  story('StatusBar - Interactive')
    .category('Organisms')
    .description('StatusBar with selectable variant and custom color')
    .controls({
      variant: defaultControls.select('Variant', ['default', 'primary', 'info', 'success', 'warning', 'danger'], 'primary'),
      customColor: defaultControls.color('Custom Color', ''),
      leftText: defaultControls.text('Left Text', 'Ready'),
      centerText: defaultControls.text('Center Text', 'file.ts'),
      rightText: defaultControls.text('Right Text', 'Ln 42, Col 8'),
    })
    .render((props) =>
      StatusBar({
        variant: props.customColor ? undefined : props.variant,
        color: props.customColor || undefined,
        left: props.leftText,        // String → auto-colored!
        center: props.centerText || undefined,
        right: props.rightText,
      })
    ),

  story('StatusBar - All Variants')
    .category('Organisms')
    .description('StatusBar component showing all semantic variants')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, width: 60 },
        Text({ bold: true, color: 'primary' }, 'StatusBar Variants:'),
        StatusBar({
          variant: 'default',
          left: '● Default',    // Strings are auto-colored based on variant!
          right: 'Ready',
        }),
        StatusBar({
          variant: 'primary',
          left: '● Primary',
          right: 'Active',
        }),
        StatusBar({
          variant: 'success',
          left: '✓ Success',
          right: 'Connected',
        }),
        StatusBar({
          variant: 'warning',
          left: '⚠ Warning',
          right: '2 issues',
        }),
        StatusBar({
          variant: 'danger',
          left: '✗ Danger',
          right: 'Error!',
        }),
        StatusBar({
          variant: 'info',
          left: 'ℹ Info',
          right: 'Building...',
        })
      )
    ),

  story('Header - Interactive')
    .category('Organisms')
    .description('Header with selectable variant and custom color')
    .controls({
      variant: defaultControls.select('Variant', ['default', 'primary', 'secondary', 'success', 'warning', 'danger'], 'primary'),
      customColor: defaultControls.color('Custom Color', ''),
      title: defaultControls.text('Title', 'My Application'),
      subtitle: defaultControls.text('Subtitle', 'v1.0.0'),
      border: defaultControls.boolean('Show Border', false),
    })
    .render((props) =>
      Header({
        title: props.title,
        subtitle: props.subtitle || undefined,
        variant: props.customColor ? undefined : props.variant,
        color: props.customColor || undefined,
        border: props.border,
      })
    ),

  story('Header - All Variants')
    .category('Organisms')
    .description('Header component showing all semantic variants')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, width: 60 },
        Header({
          title: 'Default Header',
          subtitle: 'v1.0.0',
          variant: 'default',
        }),
        Header({
          title: 'Primary Header',
          subtitle: 'v1.0.0',
          variant: 'primary',
        }),
        Header({
          title: 'Success Header',
          subtitle: 'All systems go',
          variant: 'success',
        }),
        Header({
          title: 'Warning Header',
          subtitle: 'Attention required',
          variant: 'warning',
        }),
        Header({
          title: 'Danger Header',
          subtitle: 'Critical error',
          variant: 'danger',
        })
      )
    ),

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
          borderColor: props.focused ? 'primary' : 'border',
        },
        // Title bar
        Box(
          {
            backgroundColor: props.focused ? 'info' : 'muted',
            paddingX: 1,
            justifyContent: 'space-between',
          },
          Text({ color: 'foreground', bold: props.focused }, props.title),
          Box(
            { gap: 1 },
            Text({ color: 'foreground' }, '─'),
            Text({ color: 'foreground' }, '□'),
            Text({ color: 'error' }, '×')
          )
        ),
        // Content
        Box(
          { padding: 1, flexGrow: 1 },
          Text({ color: 'muted' }, 'Window content goes here...')
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
          borderColor: 'primary',
        },
        // Title bar
        Box(
          { backgroundColor: 'info', paddingX: 1, justifyContent: 'space-between' },
          Text({ color: 'foreground', bold: true }, 'Text Editor'),
          Box({ gap: 1 }, Text({ color: 'foreground' }, '─ □ ×'))
        ),
        // Menu bar
        Box(
          { borderStyle: 'single', borderColor: 'border', paddingX: 1, gap: 2 },
          Text({ color: 'foreground', underline: true }, 'F'),
          Text({ color: 'muted' }, 'ile'),
          Text({ color: 'foreground', underline: true }, 'E'),
          Text({ color: 'muted' }, 'dit'),
          Text({ color: 'foreground', underline: true }, 'V'),
          Text({ color: 'muted' }, 'iew'),
          Text({ color: 'foreground', underline: true }, 'H'),
          Text({ color: 'muted' }, 'elp')
        ),
        // Content
        Box(
          { padding: 1, flexGrow: 1 },
          Text({ color: 'muted' }, 'Document content...')
        ),
        // Status bar
        Box(
          { backgroundColor: 'muted', paddingX: 1, justifyContent: 'space-between' },
          Text({ color: 'foreground' }, 'Ready'),
          Text({ color: 'foreground' }, 'Ln 1, Col 1')
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
          borderColor: 'warning',
        },
        // Title bar
        Box(
          { backgroundColor: 'warning', paddingX: 1 },
          Text({ color: 'background', bold: true }, '⚠ Warning')
        ),
        // Content
        Box(
          { padding: 1 },
          Text({}, 'Are you sure you want to delete this file? This action cannot be undone.')
        ),
        // Buttons
        Box(
          { paddingX: 1, paddingBottom: 1, gap: 2, justifyContent: 'flex-end' },
          Text({ color: 'muted', inverse: true }, ' No '),
          Text({ color: 'error', inverse: true }, ' Yes ')
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
          { borderStyle: 'double', borderColor: 'primary', paddingX: 1 },
          Text({ color: 'primary', bold: true }, '🖥️  Real-time Dashboard'),
          Spacer({}),
          Text({ color: 'success' }, '● Live'),
          Text({ color: 'muted' }, ' | '),
          Text({ color: 'muted', dim: true }, 'Uptime: 02:34:56')
        ),
        // Row 1
        Box(
          { flexDirection: 'row', gap: 1 },
          Box(
            { borderStyle: 'round', borderColor: 'success', padding: 1, width: 28 },
            Box(
              { flexDirection: 'column' },
              Text({ color: 'muted', dim: true }, 'CPU Usage'),
              Box(
                { flexDirection: 'row', gap: 1 },
                Text({ color: 'success' }, '[████████████░░░░░░░░]'),
                Text({ color: 'success', bold: true }, '58.3%')
              ),
              Text({ color: 'success', dim: true }, randomSparkline(25))
            )
          ),
          Box(
            { borderStyle: 'round', borderColor: 'primary', padding: 1, width: 28 },
            Box(
              { flexDirection: 'column' },
              Text({ color: 'muted', dim: true }, 'Memory'),
              Box(
                { flexDirection: 'row', gap: 1 },
                Text({ color: 'primary' }, '[██████████░░░░░░░░░░]'),
                Text({ color: 'primary', bold: true }, '52.1%')
              ),
              Text({ color: 'muted' }, '8.3 GB / 16.0 GB')
            )
          )
        ),
        // Row 2
        Box(
          { flexDirection: 'row', gap: 1 },
          Box(
            { borderStyle: 'round', borderColor: 'info', padding: 1, width: 40 },
            Box(
              { flexDirection: 'column' },
              Box(
                { flexDirection: 'row' },
                Text({ color: 'muted', dim: true }, 'Requests/sec'),
                Spacer({}),
                Text({ color: 'muted', dim: true }, 'Total: 1.2M')
              ),
              Text({ color: 'info', bold: true }, '892 req/s'),
              Text({ color: 'info' }, randomSparkline(35))
            )
          ),
          Box(
            { borderStyle: 'round', borderColor: 'warning', padding: 1, width: 18 },
            Box(
              { flexDirection: 'column' },
              Text({ color: 'muted', dim: true }, 'Active Spinners'),
              Text({ color: 'primary' }, '⠋ Fetching...'),
              Text({ color: 'success' }, '◜ Processing...'),
              Text({ color: 'warning' }, '🕐 Syncing...')
            )
          )
        ),
        // Footer
        Box(
          { backgroundColor: 'info', paddingX: 1 },
          Text({ color: 'foreground' }, '● 234 connections'),
          Spacer({}),
          Text({ color: 'foreground' }, 'Render: 30 FPS'),
          Text({ color: 'muted' }, ' | '),
          Text({ color: 'foreground' }, '14:32:45')
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
          { borderStyle: 'round', borderColor: 'success', padding: 1, width: 20 },
          Box(
            { flexDirection: 'column', alignItems: 'center' },
            Text({ color: 'muted', dim: true }, 'CPU'),
            Text({ color: 'success', bold: true }, '58%'),
            Text({ color: 'success' }, '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁')
          )
        ),
        // Memory Gauge
        Box(
          { borderStyle: 'round', borderColor: 'primary', padding: 1, width: 20 },
          Box(
            { flexDirection: 'column', alignItems: 'center' },
            Text({ color: 'muted', dim: true }, 'Memory'),
            Text({ color: 'primary', bold: true }, '8.3GB'),
            Text({ color: 'primary' }, '████████░░░░░░░░')
          )
        ),
        // Disk Gauge
        Box(
          { borderStyle: 'round', borderColor: 'warning', padding: 1, width: 20 },
          Box(
            { flexDirection: 'column', alignItems: 'center' },
            Text({ color: 'muted', dim: true }, 'Disk'),
            Text({ color: 'warning', bold: true }, '78%'),
            Text({ color: 'warning' }, '████████████░░░░')
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
          props.showLabels && Box({ width: 10 }, Text({ color: 'muted' }, 'CPU:')),
          Text({ color: 'success' }, '▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃'),
          Text({ color: 'success', bold: true }, ' 58%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          props.showLabels && Box({ width: 10 }, Text({ color: 'muted' }, 'Memory:')),
          Text({ color: 'primary' }, '▄▄▄▄▅▅▅▅▅▅▆▆▆▆▆▆▅▅▅▅▅▅▄▄▄▄▄▄▄▄▄'),
          Text({ color: 'primary', bold: true }, ' 52%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          props.showLabels && Box({ width: 10 }, Text({ color: 'muted' }, 'Network:')),
          Text({ color: 'secondary' }, '▂▃▅▇█▆▄▂▁▂▃▅▇█▆▄▂▁▂▃▅▇█▆▄▂▁▂▃▅'),
          Text({ color: 'secondary', bold: true }, ' 45MB/s')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          props.showLabels && Box({ width: 10 }, Text({ color: 'muted' }, 'Errors:')),
          Text({ color: 'error' }, '▁▁▁▁▁▁▁▁▂▁▁▁▁▁▁▁▁▁▁▃▁▁▁▁▁▁▁▁▁▁▁'),
          Text({ color: 'success', bold: true }, ' 0.1%')
        )
      )
    ),

  story('Spinner - Animated')
    .category('Organisms')
    .description('Spinner styles (run real example for animation)')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({ color: 'muted', dim: true }, 'Note: For real animation, run: pnpm tsx examples/realtime-dashboard.ts'),
        Box({ marginTop: 1 }),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'primary' }, '⠋'), Text({}, 'dots - Braille dots')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'success' }, '◜'), Text({}, 'arc - Arc spinner')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'warning' }, '◐'), Text({}, 'circle - Circle')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'secondary' }, '🕐'), Text({}, 'clock - Clock emoji')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'info' }, '🌍'), Text({}, 'earth - Globe')),
        Box({ flexDirection: 'row', gap: 1 }, Text({ color: 'error' }, '←'), Text({}, 'arrow - Directional')),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'primary' }, '[=== ]'),
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
