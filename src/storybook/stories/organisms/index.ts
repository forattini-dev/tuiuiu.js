/**
 * Organisms Stories
 *
 * Organisms are complex UI components composed of atoms and molecules.
 * They represent full UI sections with behavior and state.
 */

import { Box, Text } from '../../../primitives/nodes.js';
import { Divider } from '../../../primitives/divider.js';
import {
  Modal,
  ConfirmDialog,
  Toast,
  AlertBox,
  Window,
  CommandPalette,
  createCommandPalette,
  GoToDialog,
  createOverlayStack,
  OverlayContainer,
  SplitPanel,
  ThreePanel,
  ScrollArea,
  VirtualList,
  ScrollableText,
  LogViewer,
  ScrollList,
  ChatList,
  Grid,
  GridItem,
  GridRow,
  GridColumn,
  AutoGrid,
  DashboardGrid,
  MasonryGrid,
  DataTable,
  VirtualDataTable,
  EditableDataTable,
  FileBrowser,
  FileDirectoryTree,
  FileList,
  PathBreadcrumbs,
  FileDetails,
  FilePreview,
  FileIcon,
  DirectoryIndicator,
} from '../../../organisms/index.js';
import type { CommandItem, FileItem, VirtualListItem } from '../../../organisms/index.js';
import { story, defaultControls } from '../../core/registry.js';
import type { Story } from '../../types.js';

const commandItems: CommandItem[] = [
  { id: 'new', label: 'New File', shortcut: 'Ctrl+N', category: 'File' },
  { id: 'open', label: 'Open File', shortcut: 'Ctrl+O', category: 'File' },
  { id: 'save', label: 'Save File', shortcut: 'Ctrl+S', category: 'File' },
  { id: 'build', label: 'Build Project', shortcut: 'Ctrl+B', category: 'Build' },
  { id: 'test', label: 'Run Tests', shortcut: 'Ctrl+T', category: 'Build' },
  { id: 'settings', label: 'Settings', category: 'App' },
  { id: 'about', label: 'About', category: 'App' },
];

const scrollLines = Array.from({ length: 40 }, (_, i) => `Line ${i + 1} - scrolling content`);

const virtualItems: VirtualListItem<{ label: string }>[] = Array.from({ length: 60 }, (_, i) => ({
  key: `item-${i + 1}`,
  data: { label: `Virtual item ${i + 1}` },
}));

const listItems = Array.from({ length: 30 }, (_, i) => ({
  id: `row-${i + 1}`,
  label: `List item ${i + 1}`,
}));

const chatMessages = [
  { author: 'Alex', text: 'Did you check the latest build?' },
  { author: 'You', text: 'Yes, looks stable.' },
  { author: 'Alex', text: 'Great. Pushing the release notes now.' },
  { author: 'You', text: 'I will monitor the logs.' },
];

const tableRows = [
  { name: 'Ada Lovelace', role: 'Engineer', score: 92 },
  { name: 'Alan Turing', role: 'Research', score: 88 },
  { name: 'Grace Hopper', role: 'Lead', score: 96 },
  { name: 'Edsger Dijkstra', role: 'Advisor', score: 85 },
  { name: 'Barbara Liskov', role: 'Architect', score: 90 },
  { name: 'Donald Knuth', role: 'Reviewer', score: 91 },
];

const demoFileTree: FileItem[] = [
  {
    name: 'src',
    path: '/demo/src',
    type: 'directory',
    isExpanded: true,
    children: [
      {
        name: 'index.ts',
        path: '/demo/src/index.ts',
        type: 'file',
        size: 1200,
        modified: new Date('2024-02-10'),
      },
      {
        name: 'app.ts',
        path: '/demo/src/app.ts',
        type: 'file',
        size: 2100,
        modified: new Date('2024-02-11'),
      },
      {
        name: 'components',
        path: '/demo/src/components',
        type: 'directory',
        isExpanded: true,
        children: [
          {
            name: 'button.ts',
            path: '/demo/src/components/button.ts',
            type: 'file',
            size: 850,
            modified: new Date('2024-02-11'),
          },
          {
            name: 'input.ts',
            path: '/demo/src/components/input.ts',
            type: 'file',
            size: 1040,
            modified: new Date('2024-02-12'),
          },
        ],
      },
    ],
  },
  {
    name: 'README.md',
    path: '/demo/README.md',
    type: 'file',
    size: 2048,
    modified: new Date('2024-02-08'),
  },
  {
    name: 'package.json',
    path: '/demo/package.json',
    type: 'file',
    size: 900,
    modified: new Date('2024-02-09'),
  },
];

const demoFileList: FileItem[] = [
  {
    name: 'index.ts',
    path: '/demo/src/index.ts',
    type: 'file',
    size: 1200,
    modified: new Date('2024-02-10'),
    permissions: 'rw-r--r--',
    owner: 'cyber',
  },
  {
    name: 'app.ts',
    path: '/demo/src/app.ts',
    type: 'file',
    size: 2100,
    modified: new Date('2024-02-11'),
    permissions: 'rw-r--r--',
    owner: 'cyber',
  },
  {
    name: 'components',
    path: '/demo/src/components',
    type: 'directory',
    size: 0,
    modified: new Date('2024-02-12'),
    permissions: 'rwxr-xr-x',
    owner: 'cyber',
  },
];

const demoFile: FileItem = {
  name: 'index.ts',
  path: '/demo/src/index.ts',
  type: 'file',
  size: 1200,
  modified: new Date('2024-02-10'),
  permissions: 'rw-r--r--',
  owner: 'cyber',
  group: 'staff',
  mimeType: 'text/typescript',
};

const demoFileContent = [
  "import { App } from './app.js';",
  '',
  'const app = new App();',
  'app.run();',
].join('\n');

// ============================================================================
// Modal & Dialogs
// ============================================================================

export const modalStories: Story[] = [
  story('Modal - Basic')
    .category('Organisms')
    .description('Modal with size, border, and backdrop controls')
    .controls({
      title: defaultControls.text('Title', 'Project Settings'),
      size: defaultControls.select('Size', ['small', 'medium', 'large', 'fullscreen'], 'medium'),
      borderStyle: defaultControls.select('Border', ['single', 'double', 'round', 'heavy', 'none'], 'round'),
      backdrop: defaultControls.boolean('Backdrop', true),
      showCloseButton: defaultControls.boolean('Show Close Button', true),
      showCloseHint: defaultControls.boolean('Show Close Hint', true),
      padding: defaultControls.range('Padding', 1, 0, 2),
    })
    .render((props) =>
      Modal({
        title: props.title,
        size: props.size,
        borderStyle: props.borderStyle,
        backdrop: props.backdrop,
        showCloseButton: props.showCloseButton,
        showCloseHint: props.showCloseHint,
        padding: props.padding,
        content: Box(
          { flexDirection: 'column', gap: 1 },
          Text({ color: 'foreground' }, 'General Settings'),
          Text({ color: 'mutedForeground' }, 'Enable notifications: true'),
          Text({ color: 'mutedForeground' }, 'Theme: dark')
        ),
      })
    ),

  story('ConfirmDialog - Basic')
    .category('Organisms')
    .description('Confirmation dialog with selection state')
    .controls({
      title: defaultControls.text('Title', 'Delete file?'),
      message: defaultControls.text('Message', 'This action cannot be undone.'),
      type: defaultControls.select('Type', ['info', 'warning', 'danger'], 'warning'),
      selected: defaultControls.range('Selected', 0, 0, 1),
    })
    .render((props) =>
      ConfirmDialog({
        title: props.title,
        message: props.message,
        type: props.type,
        selected: props.selected,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      })
    ),

  story('Toast - Basic')
    .category('Organisms')
    .description('Toast notification banner')
    .controls({
      message: defaultControls.text('Message', 'Build completed successfully'),
      type: defaultControls.select('Type', ['info', 'success', 'warning', 'error'], 'success'),
      position: defaultControls.select('Position', ['top', 'bottom'], 'bottom'),
      showIcon: defaultControls.boolean('Show Icon', true),
      fullWidth: defaultControls.boolean('Full Width', false),
    })
    .render((props) =>
      Toast({
        message: props.message,
        type: props.type,
        position: props.position,
        showIcon: props.showIcon,
        fullWidth: props.fullWidth,
      })
    ),

  story('AlertBox - Basic')
    .category('Organisms')
    .description('Alert message container')
    .controls({
      title: defaultControls.text('Title', 'Heads up'),
      message: defaultControls.text('Message', 'Backup completed with warnings.'),
      type: defaultControls.select('Type', ['info', 'success', 'warning', 'error'], 'warning'),
      showIcon: defaultControls.boolean('Show Icon', true),
      fullWidth: defaultControls.boolean('Full Width', false),
    })
    .render((props) =>
      AlertBox({
        title: props.title,
        message: props.message,
        type: props.type,
        showIcon: props.showIcon,
        fullWidth: props.fullWidth,
      })
    ),

  story('Window - Basic')
    .category('Organisms')
    .description('Desktop-style window chrome')
    .controls({
      title: defaultControls.text('Title', 'System Monitor'),
      variant: defaultControls.select('Variant', ['default', 'primary', 'success', 'warning', 'danger'], 'default'),
      showClose: defaultControls.boolean('Close Button', true),
      showMinimize: defaultControls.boolean('Minimize Button', true),
      showMaximize: defaultControls.boolean('Maximize Button', false),
      width: defaultControls.range('Width', 50, 30, 80),
      height: defaultControls.range('Height', 8, 4, 16),
    })
    .render((props) =>
      Window({
        title: props.title,
        variant: props.variant,
        showClose: props.showClose,
        showMinimize: props.showMinimize,
        showMaximize: props.showMaximize,
        width: props.width,
        height: props.height,
        children: Box(
          { flexDirection: 'column', gap: 1 },
          Text({ color: 'mutedForeground' }, 'CPU: 42%'),
          Text({ color: 'mutedForeground' }, 'RAM: 2.3G'),
          Text({ color: 'mutedForeground' }, 'NET: 120 Mbps')
        ),
      })
    ),
];

// ============================================================================
// Command Palette
// ============================================================================

export const commandPaletteStories: Story[] = [
  story('CommandPalette - Basic')
    .category('Organisms')
    .description('Searchable command palette')
    .controls({
      query: defaultControls.text('Query', ''),
      selectedIndex: defaultControls.range('Selected Index', 0, 0, 6),
      width: defaultControls.range('Width', 50, 30, 70),
      showCategories: defaultControls.boolean('Show Categories', true),
      showShortcuts: defaultControls.boolean('Show Shortcuts', true),
    })
    .render((props) => {
      const palette = createCommandPalette({
        items: commandItems,
        props: {
          title: 'Command Palette',
          placeholder: 'Type a command...',
          maxVisible: 6,
          showCategories: props.showCategories,
          showShortcuts: props.showShortcuts,
          width: props.width,
        },
      });

      palette.clear();
      for (const char of props.query) {
        palette.type(char);
      }

      const filtered = palette.filteredItems();
      const clampedIndex = Math.max(0, Math.min(props.selectedIndex, filtered.length - 1));
      palette.selectIndex(clampedIndex);

      return CommandPalette({
        ...palette.props,
        query: palette.query(),
        items: commandItems,
        filteredItems: palette.filteredItems(),
        selectedIndex: palette.selectedIndex(),
      });
    }),

  story('GoToDialog - Basic')
    .category('Organisms')
    .description('Number prompt dialog')
    .controls({
      title: defaultControls.text('Title', 'Go To Line'),
      prompt: defaultControls.text('Prompt', 'Enter line:'),
      value: defaultControls.text('Value', '42'),
      max: defaultControls.number('Max', 200, { min: 10, max: 500, step: 10 }),
      width: defaultControls.range('Width', 30, 20, 50),
      borderStyle: defaultControls.select('Border', ['single', 'double', 'round', 'heavy', 'none'], 'round'),
    })
    .render((props) =>
      GoToDialog({
        title: props.title,
        prompt: props.prompt,
        value: props.value,
        max: props.max,
        width: props.width,
        borderStyle: props.borderStyle,
        borderColor: 'primary',
      })
    ),
];

// ============================================================================
// Overlay Stack
// ============================================================================

export const overlayStories: Story[] = [
  story('OverlayContainer - Stack')
    .category('Organisms')
    .description('Overlay stack renders multiple layers')
    .render(() => {
      const stack = createOverlayStack();

      stack.push({
        id: 'toast',
        priority: 'low',
        showBackdrop: false,
        component: () => Toast({ message: 'Saved snapshot', type: 'success' }),
      });

      stack.push({
        id: 'modal',
        priority: 'normal',
        showBackdrop: true,
        component: () =>
          Modal({
            title: 'Overlay Modal',
            size: 'small',
            borderStyle: 'round',
            content: Box(
              { flexDirection: 'column', gap: 1 },
              Text({ color: 'foreground' }, 'This modal is inside the stack.'),
              Text({ color: 'mutedForeground' }, 'Backdrop is handled by container.')
            ),
          }),
      });

      return Box(
        { flexDirection: 'column', width: 60, height: 14 },
        Box(
          { flexDirection: 'column', padding: 1, borderStyle: 'single', borderColor: 'border' },
          Text({ color: 'foreground', bold: true }, 'Main View'),
          Text({ color: 'mutedForeground' }, 'Overlay container renders above this content.')
        ),
        OverlayContainer({
          stack,
          renderBackdrop: () =>
            Box({ width: 60, height: 14, backgroundColor: 'muted' }, Text({ dim: true }, ' ')),
        })
      );
    }),
];

// ============================================================================
// Split Panels
// ============================================================================

export const splitPanelStories: Story[] = [
  story('SplitPanel - Horizontal')
    .category('Organisms')
    .description('Horizontal split panel with divider')
    .controls({
      ratio: defaultControls.range('Ratio %', 35, 20, 80),
      divider: defaultControls.boolean('Divider', true),
      dividerStyle: defaultControls.select('Divider Style', ['line', 'double', 'dotted', 'dashed', 'thick', 'none'], 'line'),
      border: defaultControls.boolean('Border', true),
      borderStyle: defaultControls.select('Border Style', ['single', 'double', 'round'], 'round'),
    })
    .render((props) =>
      SplitPanel({
        left: Box(
          { flexDirection: 'column', padding: 1 },
          Text({ color: 'foreground', bold: true }, 'Navigation'),
          Text({ color: 'mutedForeground' }, '- Dashboard'),
          Text({ color: 'mutedForeground' }, '- Reports'),
          Text({ color: 'mutedForeground' }, '- Settings')
        ),
        right: Box(
          { flexDirection: 'column', padding: 1 },
          Text({ color: 'foreground', bold: true }, 'Main Content'),
          Text({ color: 'mutedForeground' }, 'Select an item to continue.')
        ),
        ratio: props.ratio / 100,
        divider: props.divider,
        dividerStyle: props.dividerStyle,
        border: props.border,
        borderStyle: props.borderStyle,
        width: 60,
        height: 10,
      })
    ),

  story('SplitPanel - Vertical')
    .category('Organisms')
    .description('Vertical split panel')
    .controls({
      ratio: defaultControls.range('Ratio %', 50, 20, 80),
      dividerStyle: defaultControls.select('Divider Style', ['line', 'double', 'dotted', 'dashed', 'thick', 'none'], 'line'),
    })
    .render((props) =>
      SplitPanel({
        left: Box(
          { flexDirection: 'column', padding: 1 },
          Text({ color: 'foreground', bold: true }, 'Top Panel'),
          Text({ color: 'mutedForeground' }, 'Summary metrics')
        ),
        right: Box(
          { flexDirection: 'column', padding: 1 },
          Text({ color: 'foreground', bold: true }, 'Bottom Panel'),
          Text({ color: 'mutedForeground' }, 'Detailed output log')
        ),
        direction: 'vertical',
        ratio: props.ratio / 100,
        divider: true,
        dividerStyle: props.dividerStyle,
        width: 50,
        height: 12,
      })
    ),

  story('ThreePanel - Basic')
    .category('Organisms')
    .description('Three panel layout for editor shells')
    .controls({
      showRight: defaultControls.boolean('Show Right Panel', true),
      dividerStyle: defaultControls.select('Divider Style', ['line', 'double', 'dotted', 'dashed', 'thick'], 'line'),
    })
    .render((props) =>
      ThreePanel({
        left: Box(
          { flexDirection: 'column', padding: 1 },
          Text({ color: 'foreground', bold: true }, 'Files'),
          Text({ color: 'mutedForeground' }, 'src/index.ts'),
          Text({ color: 'mutedForeground' }, 'src/app.ts')
        ),
        center: Box(
          { flexDirection: 'column', padding: 1 },
          Text({ color: 'foreground', bold: true }, 'Editor'),
          Text({ color: 'mutedForeground' }, 'const app = new App();')
        ),
        right: props.showRight
          ? Box(
              { flexDirection: 'column', padding: 1 },
              Text({ color: 'foreground', bold: true }, 'Inspector'),
              Text({ color: 'mutedForeground' }, 'Props: 3')
            )
          : undefined,
        dividerStyle: props.dividerStyle,
        width: 70,
        height: 12,
      })
    ),
];

// ============================================================================
// Scroll Areas & Lists
// ============================================================================

export const scrollAreaStories: Story[] = [
  story('ScrollArea - Basic')
    .category('Organisms')
    .description('Scrollable list of lines')
    .controls({
      height: defaultControls.range('Height', 10, 5, 18),
      showScrollbar: defaultControls.boolean('Show Scrollbar', true),
      width: defaultControls.range('Width', 50, 30, 70),
    })
    .render((props) =>
      ScrollArea({
        height: props.height,
        width: props.width,
        content: scrollLines,
        showScrollbar: props.showScrollbar,
      })
    ),

  story('VirtualList - Basic')
    .category('Organisms')
    .description('Virtualized list with selection')
    .controls({
      height: defaultControls.range('Height', 8, 5, 16),
      width: defaultControls.range('Width', 40, 25, 60),
      showScrollbar: defaultControls.boolean('Show Scrollbar', true),
    })
    .render((props) =>
      VirtualList({
        items: virtualItems,
        height: props.height,
        width: props.width,
        showScrollbar: props.showScrollbar,
        renderItem: (item, _index, selected) =>
          Text({ color: selected ? 'primary' : 'foreground' }, item.data.label),
      })
    ),

  story('ScrollableText - Basic')
    .category('Organisms')
    .description('Scrollable text block')
    .controls({
      height: defaultControls.range('Height', 6, 4, 12),
      width: defaultControls.range('Width', 50, 30, 70),
      showScrollbar: defaultControls.boolean('Show Scrollbar', true),
    })
    .render((props) =>
      ScrollableText({
        text:
          'This is a long paragraph that demonstrates scrollable text.\n' +
          'It can be used for logs, readme previews, or long descriptions.\n' +
          'Keep scrolling to read the rest of the content.\n' +
          'Each line is rendered with the ScrollArea underneath.',
        height: props.height,
        width: props.width,
        showScrollbar: props.showScrollbar,
      })
    ),

  story('LogViewer - Basic')
    .category('Organisms')
    .description('Log viewer with highlight pattern')
    .controls({
      height: defaultControls.range('Height', 8, 5, 16),
      showLineNumbers: defaultControls.boolean('Line Numbers', true),
      autoScroll: defaultControls.boolean('Auto Scroll', true),
    })
    .render((props) =>
      LogViewer({
        lines: [
          'INFO 12:00:01 Boot sequence start',
          'INFO 12:00:02 Loading modules',
          'WARN 12:00:03 Cache miss: user.profile',
          'ERROR 12:00:04 Connection timeout',
          'INFO 12:00:05 Retrying...',
          'INFO 12:00:06 Connected',
        ],
        height: props.height,
        showLineNumbers: props.showLineNumbers,
        autoScroll: props.autoScroll,
        highlightPattern: /ERROR|WARN/,
        highlightColor: 'warning',
      })
    ),
];

export const scrollListStories: Story[] = [
  story('ScrollList - Basic')
    .category('Organisms')
    .description('Scrollable list with custom renderer')
    .controls({
      height: defaultControls.range('Height', 8, 5, 16),
      width: defaultControls.range('Width', 50, 30, 70),
      showScrollbar: defaultControls.boolean('Show Scrollbar', true),
    })
    .render((props) =>
      ScrollList({
        items: listItems,
        height: props.height,
        width: props.width,
        showScrollbar: props.showScrollbar,
        children: (item) =>
          Box(
            { paddingX: 1 },
            Text({ color: 'foreground' }, item.label)
          ),
      })
    ),

  story('ChatList - Basic')
    .category('Organisms')
    .description('Chat list preset with auto-scroll')
    .controls({
      height: defaultControls.range('Height', 8, 5, 16),
      width: defaultControls.range('Width', 60, 40, 80),
      showScrollbar: defaultControls.boolean('Show Scrollbar', true),
    })
    .render((props) =>
      ChatList({
        items: chatMessages,
        height: props.height,
        width: props.width,
        showScrollbar: props.showScrollbar,
        children: (msg) =>
          Box(
            { flexDirection: 'column', paddingX: 1 },
            Text({ color: msg.author === 'You' ? 'primary' : 'foreground', bold: true }, msg.author),
            Text({ color: 'mutedForeground' }, msg.text)
          ),
      })
    ),
];

// ============================================================================
// Grid Layouts
// ============================================================================

export const gridStories: Story[] = [
  story('Grid - Areas')
    .category('Organisms')
    .description('Grid with named areas')
    .render(() =>
      Grid(
        {
          columns: '14 1fr',
          rows: '3 1fr 2',
          gap: 1,
          areas: ['"header header"', '"nav main"', '"footer footer"'].join('\n'),
          width: 60,
          height: 12,
          border: true,
          borderStyle: 'round',
        },
        GridItem(
          { area: 'header' },
          Box(
            { padding: 1, backgroundColor: 'primary' },
            Text({ color: 'primaryForeground', bold: true }, 'Header')
          )
        ),
        GridItem(
          { area: 'nav' },
          Box(
            { padding: 1, borderStyle: 'single', borderColor: 'border', flexDirection: 'column' },
            Text({ color: 'mutedForeground' }, 'Nav 1'),
            Text({ color: 'mutedForeground' }, 'Nav 2'),
            Text({ color: 'mutedForeground' }, 'Nav 3')
          )
        ),
        GridItem(
          { area: 'main' },
          Box(
            { padding: 1, borderStyle: 'single', borderColor: 'border' },
            Text({ color: 'foreground' }, 'Main content area')
          )
        ),
        GridItem(
          { area: 'footer' },
          Box(
            { paddingX: 1, backgroundColor: 'muted' },
            Text({ color: 'mutedForeground' }, 'Footer')
          )
        )
      )
    ),

  story('GridItem - Spans')
    .category('Organisms')
    .description('Grid items with explicit row/column spans')
    .render(() =>
      Grid(
        { columns: '1fr 1fr 1fr', rows: '2 2', gap: 1, width: 60, border: true },
        GridItem(
          { column: '1 / 3', row: 1 },
          Box({ padding: 1, backgroundColor: 'primary' }, Text({ color: 'primaryForeground' }, 'Span 2 cols'))
        ),
        GridItem(
          { column: 3, row: '1 / 3' },
          Box({ padding: 1, backgroundColor: 'success' }, Text({ color: 'successForeground' }, 'Span 2 rows'))
        ),
        GridItem(
          { column: 1, row: 2 },
          Box({ padding: 1, borderStyle: 'single', borderColor: 'border' }, Text({}, 'Cell A'))
        ),
        GridItem(
          { column: 2, row: 2 },
          Box({ padding: 1, borderStyle: 'single', borderColor: 'border' }, Text({}, 'Cell B'))
        )
      )
    ),

  story('GridRow - Basic')
    .category('Organisms')
    .description('Single row with equal columns')
    .render(() =>
      GridRow(
        { width: 60, gap: 1 },
        Box({ padding: 1, borderStyle: 'round', borderColor: 'primary' }, Text({}, 'One')),
        Box({ padding: 1, borderStyle: 'round', borderColor: 'accent' }, Text({}, 'Two')),
        Box({ padding: 1, borderStyle: 'round', borderColor: 'success' }, Text({}, 'Three'))
      )
    ),

  story('GridColumn - Basic')
    .category('Organisms')
    .description('Single column with equal rows')
    .render(() =>
      GridColumn(
        { width: 30, gap: 1 },
        Box({ padding: 1, borderStyle: 'single', borderColor: 'border' }, Text({}, 'Row 1')),
        Box({ padding: 1, borderStyle: 'single', borderColor: 'border' }, Text({}, 'Row 2')),
        Box({ padding: 1, borderStyle: 'single', borderColor: 'border' }, Text({}, 'Row 3'))
      )
    ),

  story('AutoGrid - Responsive')
    .category('Organisms')
    .description('Auto grid adapts to width')
    .render(() =>
      AutoGrid(
        { width: 60, minColumnWidth: 12, gap: 1 },
        Box({ padding: 1, borderStyle: 'round', borderColor: 'primary' }, Text({}, 'Card A')),
        Box({ padding: 1, borderStyle: 'round', borderColor: 'accent' }, Text({}, 'Card B')),
        Box({ padding: 1, borderStyle: 'round', borderColor: 'success' }, Text({}, 'Card C')),
        Box({ padding: 1, borderStyle: 'round', borderColor: 'warning' }, Text({}, 'Card D'))
      )
    ),

  story('DashboardGrid - Basic')
    .category('Organisms')
    .description('Dashboard grid helper')
    .render(() =>
      DashboardGrid(
        { width: 60, height: 14, gap: 1, border: true, borderStyle: 'round' },
        {
          header: Box(
            { paddingX: 1, backgroundColor: 'primary' },
            Text({ color: 'primaryForeground', bold: true }, 'Dashboard')
          ),
          sidebar: Box(
            { flexDirection: 'column', padding: 1 },
            Text({ color: 'mutedForeground' }, 'Overview'),
            Text({ color: 'mutedForeground' }, 'Reports'),
            Text({ color: 'mutedForeground' }, 'Settings')
          ),
          main: Box(
            { flexDirection: 'column', padding: 1 },
            Text({ color: 'foreground', bold: true }, 'KPIs'),
            Divider({}),
            Text({ color: 'mutedForeground' }, 'Visitors: 12,430'),
            Text({ color: 'mutedForeground' }, 'Conversion: 4.2%')
          ),
          footer: Box(
            { paddingX: 1, backgroundColor: 'muted' },
            Text({ color: 'mutedForeground' }, 'Updated 2m ago')
          ),
        }
      )
    ),

  story('MasonryGrid - Basic')
    .category('Organisms')
    .description('Masonry layout for variable height cards')
    .render(() =>
      MasonryGrid(
        { columns: 3, gap: 1, width: 60 },
        Box({ padding: 1, borderStyle: 'round', borderColor: 'primary', height: 3 }, Text({}, 'Card A')),
        Box({ padding: 1, borderStyle: 'round', borderColor: 'success', height: 2 }, Text({}, 'Card B')),
        Box({ padding: 1, borderStyle: 'round', borderColor: 'accent', height: 4 }, Text({}, 'Card C')),
        Box({ padding: 1, borderStyle: 'round', borderColor: 'warning', height: 3 }, Text({}, 'Card D')),
        Box({ padding: 1, borderStyle: 'round', borderColor: 'border', height: 2 }, Text({}, 'Card E'))
      )
    ),
];

// ============================================================================
// Data Tables
// ============================================================================

export const dataTableStories: Story[] = [
  story('DataTable - Basic')
    .category('Organisms')
    .description('Sortable table with pagination and search')
    .controls({
      showSearch: defaultControls.boolean('Search', true),
      showPagination: defaultControls.boolean('Pagination', true),
      selectionMode: defaultControls.select('Selection', ['none', 'single', 'multiple'], 'single'),
      striped: defaultControls.boolean('Striped', false),
      pageSize: defaultControls.range('Page Size', 4, 2, 8),
      isActive: defaultControls.boolean('Active', true),
    })
    .render((props) =>
      DataTable({
        columns: [
          { key: 'name', header: 'Name', sortable: true },
          { key: 'role', header: 'Role' },
          { key: 'score', header: 'Score', sortable: true, align: 'right' },
        ],
        data: tableRows,
        showSearch: props.showSearch,
        showPagination: props.showPagination,
        selectionMode: props.selectionMode,
        striped: props.striped,
        pageSize: props.pageSize,
        isActive: props.isActive,
      })
    ),

  story('VirtualDataTable - Basic')
    .category('Organisms')
    .description('Virtualized table wrapper')
    .controls({
      visibleRows: defaultControls.range('Visible Rows', 6, 3, 12),
      isActive: defaultControls.boolean('Active', true),
    })
    .render((props) =>
      VirtualDataTable({
        columns: [
          { key: 'name', header: 'Name', sortable: true },
          { key: 'role', header: 'Role' },
          { key: 'score', header: 'Score', sortable: true, align: 'right' },
        ],
        data: tableRows,
        visibleRows: props.visibleRows,
        isActive: props.isActive,
      })
    ),

  story('EditableDataTable - Basic')
    .category('Organisms')
    .description('Editable columns (uses DataTable for now)')
    .render(() =>
      EditableDataTable({
        columns: [
          { key: 'name', header: 'Name', editable: false },
          { key: 'role', header: 'Role', editable: true },
          { key: 'score', header: 'Score', editable: true, align: 'right' },
        ],
        data: tableRows,
        selectionMode: 'none',
      })
    ),
];

// ============================================================================
// File Browser
// ============================================================================

export const fileBrowserStories: Story[] = [
  story('FileBrowser - Basic')
    .category('Organisms')
    .description('Combined tree + list file browser')
    .controls({
      splitView: defaultControls.boolean('Split View', true),
      showPreview: defaultControls.boolean('Show Preview', false),
      viewMode: defaultControls.select('View Mode', ['list', 'details', 'tree'], 'list'),
      width: defaultControls.range('Width', 70, 50, 90),
      height: defaultControls.range('Height', 16, 10, 24),
    })
    .render((props) =>
      FileBrowser({
        path: '/demo',
        items: demoFileTree,
        splitView: props.splitView,
        showPreview: props.showPreview,
        viewMode: props.viewMode,
        width: props.width,
        height: props.height,
      })
    ),

  story('FileDirectoryTree - Basic')
    .category('Organisms')
    .description('Directory tree for file navigation')
    .render(() =>
      FileDirectoryTree({
        items: demoFileTree,
        selected: '/demo/src/index.ts',
        expanded: new Set(['/demo/src', '/demo/src/components']),
        width: 40,
        height: 12,
      })
    ),

  story('FileList - Details')
    .category('Organisms')
    .description('File list with details view')
    .render(() =>
      FileList({
        items: demoFileList,
        viewMode: 'details',
        showSize: true,
        showModified: true,
        showPermissions: true,
        width: 60,
      })
    ),

  story('PathBreadcrumbs - Basic')
    .category('Organisms')
    .description('Breadcrumb navigation for paths')
    .render(() =>
      PathBreadcrumbs({
        path: '/demo/src/components',
        homePath: '/demo',
        showHomeAs: '~',
      })
    ),

  story('FileDetails - Basic')
    .category('Organisms')
    .description('File metadata view')
    .render(() =>
      FileDetails({
        item: demoFile,
        width: 50,
      })
    ),

  story('FilePreview - Basic')
    .category('Organisms')
    .description('Preview file contents with line numbers')
    .render(() =>
      FilePreview({
        item: demoFile,
        content: demoFileContent,
        maxLines: 12,
        lineNumbers: true,
        width: 60,
        height: 12,
      })
    ),

  story('FileIcon - Basic')
    .category('Organisms')
    .description('File type icon')
    .render(() =>
      Box(
        { flexDirection: 'row', gap: 2 },
        FileIcon({ item: demoFile }),
        Text({ color: 'mutedForeground' }, demoFile.name)
      )
    ),

  story('DirectoryIndicator - Basic')
    .category('Organisms')
    .description('Indicator for expanded/collapsed folders')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          DirectoryIndicator({ isExpanded: true }),
          Text({ color: 'mutedForeground' }, 'Expanded')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          DirectoryIndicator({ isExpanded: false }),
          Text({ color: 'mutedForeground' }, 'Collapsed')
        )
      )
    ),
];

/**
 * All organism stories
 */
export const allOrganismStories: Story[] = [
  ...modalStories,
  ...commandPaletteStories,
  ...overlayStories,
  ...splitPanelStories,
  ...scrollAreaStories,
  ...scrollListStories,
  ...gridStories,
  ...dataTableStories,
  ...fileBrowserStories,
];

export default allOrganismStories;
