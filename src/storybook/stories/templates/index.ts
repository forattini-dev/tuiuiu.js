/**
 * Templates Stories
 *
 * Page-level templates and reusable layout structures.
 * This is the highest level in Atomic Design - templates and shells:
 * - App Shells: Complete application layouts
 * - Navbars & Headers: Top navigation bars
 * - Sidebars: Side navigation panels
 * - Status Bars & Footers: Bottom status displays
 * - Command Interfaces: CLI-style command UIs
 * - Terminal Apps: Complete terminal application templates
 */

import { Box, Text, Spacer } from '../../../primitives/nodes.js';
import { Divider } from '../../../primitives/divider.js';
import { SplitBox } from '../../../primitives/split-box.js';
import {
  VStack,
  HStack,
  Center,
  FullScreen,
  Spacer as TemplateSpacer,
  Divider as TemplateDivider,
  Page,
  AppShell,
  StatusBar,
  Header,
  Container,
} from '../../../templates/index.js';
import { story, defaultControls } from '../../core/registry.js';
import type { Story } from '../../types.js';

// ============================================================================
// Stack Layouts
// ============================================================================

export const stackStories: Story[] = [
  story('VStack - Basic')
    .category('Templates')
    .description('Vertical stack layout with alignment and spacing')
    .controls({
      gap: defaultControls.range('Gap', 1, 0, 3),
      align: defaultControls.select('Align', ['left', 'center', 'right', 'stretch'], 'stretch'),
      border: defaultControls.boolean('Border', true),
      borderStyle: defaultControls.select('Border Style', ['single', 'double', 'round', 'bold'], 'round'),
      padding: defaultControls.range('Padding', 1, 0, 2),
      width: defaultControls.range('Width', 30, 20, 60),
    })
    .render((props) =>
      VStack({
        gap: props.gap,
        align: props.align,
        border: props.border,
        borderStyle: props.borderStyle,
        padding: props.padding,
        width: props.width,
        children: [
          Box(
            { borderStyle: 'single', borderColor: 'primary', paddingX: 1 },
            Text({ color: 'primary' }, 'First item')
          ),
          Box(
            { borderStyle: 'single', borderColor: 'success', paddingX: 1 },
            Text({ color: 'success' }, 'Second item')
          ),
          Box(
            { borderStyle: 'single', borderColor: 'warning', paddingX: 1 },
            Text({ color: 'warning' }, 'Third item')
          ),
        ],
      })
    ),

  story('HStack - Basic')
    .category('Templates')
    .description('Horizontal stack with gap and justification')
    .controls({
      gap: defaultControls.range('Gap', 2, 0, 4),
      align: defaultControls.select('Align', ['top', 'center', 'bottom', 'stretch'], 'center'),
      justify: defaultControls.select('Justify', ['start', 'center', 'end', 'between', 'around'], 'between'),
      border: defaultControls.boolean('Border', true),
      borderStyle: defaultControls.select('Border Style', ['single', 'double', 'round', 'bold'], 'single'),
      padding: defaultControls.range('Padding', 1, 0, 2),
      width: defaultControls.range('Width', 60, 40, 80),
    })
    .render((props) =>
      HStack({
        gap: props.gap,
        align: props.align,
        justify: props.justify,
        border: props.border,
        borderStyle: props.borderStyle,
        padding: props.padding,
        width: props.width,
        children: [
          Box(
            { borderStyle: 'round', borderColor: 'primary', paddingX: 1 },
            Text({ color: 'primary' }, 'Alpha')
          ),
          Box(
            { borderStyle: 'round', borderColor: 'accent', paddingX: 1 },
            Text({ color: 'accent' }, 'Beta')
          ),
          Box(
            { borderStyle: 'round', borderColor: 'success', paddingX: 1 },
            Text({ color: 'success' }, 'Gamma')
          ),
        ],
      })
    ),

  story('Center - Basic')
    .category('Templates')
    .description('Center content horizontally and vertically')
    .controls({
      horizontal: defaultControls.boolean('Horizontal', true),
      vertical: defaultControls.boolean('Vertical', true),
      width: defaultControls.range('Width', 40, 20, 80),
      height: defaultControls.range('Height', 12, 6, 20),
    })
    .render((props) =>
      Center({
        horizontal: props.horizontal,
        vertical: props.vertical,
        width: props.width,
        height: props.height,
        children: Box(
          { borderStyle: 'round', borderColor: 'primary', paddingX: 2, paddingY: 1 },
          Text({ color: 'primary', bold: true }, 'Centered')
        ),
      })
    ),

  story('FullScreen - Basic')
    .category('Templates')
    .description('Full terminal container with background')
    .controls({
      backgroundColor: defaultControls.color('Background', 'muted'),
      padding: defaultControls.range('Padding', 1, 0, 2),
    })
    .render((props) =>
      FullScreen({
        backgroundColor: props.backgroundColor,
        padding: props.padding,
        children: Box(
          { borderStyle: 'single', borderColor: 'primary', paddingX: 2, paddingY: 1 },
          Text({ color: 'primary', bold: true }, 'FullScreen content')
        ),
      })
    ),

  story('Spacer - Basic')
    .category('Templates')
    .description('Spacer pushes items apart inside stacks')
    .render(() =>
      HStack({
        gap: 1,
        border: true,
        borderStyle: 'round',
        padding: 1,
        width: 60,
        children: [
          Text({ color: 'foreground' }, 'Left'),
          TemplateSpacer(),
          Text({ color: 'mutedForeground' }, 'Right'),
        ],
      })
    ),

  story('Divider - Basic')
    .category('Templates')
    .description('Template divider uses the shared primitive')
    .controls({
      color: defaultControls.color('Color', 'border'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', width: 50, gap: 1 },
        Text({ color: 'mutedForeground' }, 'Above'),
        TemplateDivider({ color: props.color }),
        Text({ color: 'mutedForeground' }, 'Below')
      )
    ),
];

// ============================================================================
// App Layout Components
// ============================================================================

export const appLayoutStories: Story[] = [
  story('Page - Basic')
    .category('Templates')
    .description('Single-page layout with header, body, and footer')
    .controls({
      title: defaultControls.text('Title', 'Settings'),
      subtitle: defaultControls.text('Subtitle', 'Manage preferences'),
      variant: defaultControls.select('Variant', ['default', 'primary', 'secondary'], 'default'),
      border: defaultControls.boolean('Border', true),
      borderStyle: defaultControls.select('Border Style', ['single', 'double', 'round', 'bold'], 'round'),
      divider: defaultControls.boolean('Divider', true),
      padding: defaultControls.range('Padding', 1, 0, 2),
      width: defaultControls.range('Width', 60, 40, 80),
      height: defaultControls.range('Height', 16, 8, 24),
    })
    .render((props) =>
      Page({
        title: props.title,
        subtitle: props.subtitle,
        variant: props.variant,
        border: props.border,
        borderStyle: props.borderStyle,
        divider: props.divider,
        padding: props.padding,
        width: props.width,
        height: props.height,
        children: Box(
          { flexDirection: 'column', gap: 1 },
          Text({ color: 'mutedForeground' }, 'Account'),
          Text({ color: 'foreground' }, 'Notifications'),
          Text({ color: 'foreground' }, 'Privacy')
        ),
        footer: Text({ color: 'mutedForeground', dim: true }, 'Press Esc to return'),
      })
    ),

  story('AppShell - Basic')
    .category('Templates')
    .description('Application shell with header, sidebar, and footer')
    .controls({
      showSidebar: defaultControls.boolean('Show Sidebar', true),
      showAside: defaultControls.boolean('Show Aside', false),
      dividers: defaultControls.boolean('Dividers', true),
      dividerStyle: defaultControls.select('Divider Style', ['line', 'double', 'dotted', 'dashed', 'thick'], 'line'),
      sidebarWidth: defaultControls.range('Sidebar Width', 22, 15, 30),
      asideWidth: defaultControls.range('Aside Width', 18, 12, 30),
      padding: defaultControls.range('Padding', 1, 0, 2),
    })
    .render((props) =>
      AppShell({
        header: Header({
          title: 'Tuiuiu Console',
          subtitle: 'v1.0',
          rightActions: Text({ color: 'mutedForeground' }, '[?] Help  [Q] Quit'),
          border: false,
        }),
        sidebar: props.showSidebar
          ? Box(
              { flexDirection: 'column', padding: 1, gap: 1 },
              Text({ color: 'primary' }, 'Dashboard'),
              Text({ color: 'mutedForeground' }, 'Logs'),
              Text({ color: 'mutedForeground' }, 'Settings')
            )
          : undefined,
        sidebarWidth: props.sidebarWidth,
        aside: props.showAside
          ? Box(
              { flexDirection: 'column', padding: 1, gap: 1 },
              Text({ color: 'mutedForeground' }, 'Details'),
              Text({ color: 'foreground' }, 'CPU: 45%'),
              Text({ color: 'foreground' }, 'RAM: 2.1G')
            )
          : undefined,
        asideWidth: props.asideWidth,
        footer: StatusBar({
          left: 'Ready',
          center: 'tuiuiu storybook',
          right: 'Ln 12, Col 5',
          variant: 'default',
        }),
        dividers: props.dividers,
        dividerStyle: props.dividerStyle,
        padding: props.padding,
        children: Box(
          { flexDirection: 'column', gap: 1 },
          Text({ color: 'foreground', bold: true }, 'Welcome'),
          Text({ color: 'mutedForeground' }, 'Pick a workspace to continue.'),
          Box(
            { borderStyle: 'single', borderColor: 'border', padding: 1 },
            Text({ color: 'mutedForeground' }, 'Recent: ~/projects/tuiuiu')
          )
        ),
      })
    ),

  story('StatusBar - Basic')
    .category('Templates')
    .description('Status bar with left/center/right slots')
    .controls({
      left: defaultControls.text('Left', 'Ready'),
      center: defaultControls.text('Center', 'main.ts'),
      right: defaultControls.text('Right', 'Ln 42, Col 8'),
      variant: defaultControls.select('Variant', ['default', 'primary', 'info', 'success', 'warning', 'danger'], 'default'),
    })
    .render((props) =>
      StatusBar({
        left: props.left,
        center: props.center,
        right: props.right,
        variant: props.variant,
      })
    ),

  story('Header - Basic')
    .category('Templates')
    .description('Header with title and actions')
    .controls({
      title: defaultControls.text('Title', 'Tuiuiu Studio'),
      subtitle: defaultControls.text('Subtitle', 'v2.1.0'),
      variant: defaultControls.select('Variant', ['default', 'primary', 'secondary', 'accent', 'success', 'warning', 'danger'], 'default'),
      border: defaultControls.boolean('Border', true),
    })
    .render((props) =>
      Header({
        title: props.title,
        subtitle: props.subtitle,
        variant: props.variant,
        border: props.border,
        rightActions: Text({ color: 'mutedForeground' }, '[S] Save  [Q] Quit'),
      })
    ),

  story('Container - Basic')
    .category('Templates')
    .description('Center content with max width')
    .controls({
      maxWidth: defaultControls.range('Max Width', 60, 30, 80),
      center: defaultControls.boolean('Center', true),
      padding: defaultControls.range('Padding', 1, 0, 3),
    })
    .render((props) =>
      Container({
        maxWidth: props.maxWidth,
        center: props.center,
        padding: props.padding,
        children: Box(
          { borderStyle: 'single', borderColor: 'border', padding: 1 },
          Text({ color: 'foreground' }, 'Constrained content area')
        ),
      })
    ),
];

// ============================================================================
// Navbars & Headers
// ============================================================================

export const navbarStories: Story[] = [
  story('Navbar - Simple')
    .category('Templates')
    .description('Simple top navigation bar')
    .render(() => {
      return Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'primary',
          paddingX: 2,
          paddingY: 1,
        },
        Text({ color: 'primaryForeground', bold: true }, '🚀 MyApp'),
        Spacer({}),
        Box(
          { flexDirection: 'row', gap: 3 },
          Text({ color: 'primaryForeground', bold: true }, 'Home'),
          Text({ color: 'primaryForeground', dim: true }, 'Files'),
          Text({ color: 'primaryForeground', dim: true }, 'Settings'),
          Text({ color: 'primaryForeground', dim: true }, 'Help')
        )
      );
    }),

  story('Navbar - With Search')
    .category('Templates')
    .description('Navigation bar with search input')
    .render(() => {
      return Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'muted',
          paddingX: 2,
          paddingY: 1,
          gap: 2,
        },
        Text({ color: 'foreground', bold: true }, '📦 PackageManager'),
        Box(
          { borderStyle: 'single', borderColor: 'border', paddingX: 1, flexGrow: 1 },
          Text({ color: 'mutedForeground', dim: true }, '🔍 Search packages...')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'primary', bold: true }, 'Browse'),
          Text({ color: 'mutedForeground', dim: true }, 'Installed'),
          Text({ color: 'mutedForeground', dim: true }, 'Updates')
        )
      );
    }),

  story('Navbar - Breadcrumb Style')
    .category('Templates')
    .description('Navigation with breadcrumb path')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          borderStyle: 'single',
          borderColor: 'border',
          paddingX: 2,
          paddingY: 1,
        },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'primary' }, '~'),
          Text({ color: 'mutedForeground' }, '/'),
          Text({ color: 'primary' }, 'projects'),
          Text({ color: 'mutedForeground' }, '/'),
          Text({ color: 'primary' }, 'tuiuiu'),
          Text({ color: 'mutedForeground' }, '/'),
          Text({ color: 'foreground', bold: true }, 'src')
        ),
        Spacer({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'success' }, '✓ main'),
          Text({ color: 'mutedForeground' }, '|'),
          Text({ color: 'warning' }, '3 modified')
        )
      )
    ),

  story('Navbar - Tabs Style')
    .category('Templates')
    .description('Tab-based navigation bar')
    .controls({
      activeTab: defaultControls.range('Active Tab', 0, 0, 3),
    })
    .render((props) => {
      const tabs = ['📄 index.ts', '📄 app.ts', '📄 utils.ts', '📄 types.ts'];
      return Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'muted',
        },
        ...tabs.map((tab, idx) => {
          const isActive = idx === props.activeTab;
          return Box(
            {
              paddingX: 2,
              paddingY: 1,
              backgroundColor: isActive ? 'primary' : 'muted',
            },
            Text({ color: isActive ? 'white' : 'mutedForeground' }, tab),
            isActive ? Text({ color: 'white', dim: true }, ' ×') : null
          );
        }),
        Spacer({}),
        Box(
          { paddingX: 2, paddingY: 1 },
          Text({ color: 'mutedForeground' }, '+')
        )
      );
    }),
];

// ============================================================================
// Headers with Logo (SplitBox)
// ============================================================================

export const headerWithLogoStories: Story[] = [
  story('Header - ASCII Logo Left')
    .category('Templates')
    .description('Header with ASCII art logo on the left using SplitBox')
    .render(() => {
      const logo = Box(
        { flexDirection: 'column' },
        Text({ color: 'primary', bold: true }, '█▀█ █▀▀ █▄▀'),
        Text({ color: 'primary', bold: true }, '█▀▄ ██▄ █ █'),
      );

      const info = Box(
        { flexDirection: 'column' },
        Box(
          { flexDirection: 'row' },
          Text({ color: 'foreground', bold: true }, 'REK SHELL'),
          Text({ color: 'mutedForeground' }, ' v1.0.50'),
          Spacer({}),
          Text({ color: 'success' }, '60fps'),
        ),
        Text({ color: 'mutedForeground' }, '📡 https://api.example.com'),
        Text({ color: 'mutedForeground' }, '⚡ Jobs: idle'),
      );

      return SplitBox({
        borderStyle: 'round',
        borderColor: 'primary',
        width: 70,
        sections: [
          { width: 13, content: logo, valign: 'middle' },
          { flexGrow: 1, content: info },
        ],
        paddingX: 1,
      });
    }),

  story('Header - Block Logo')
    .category('Templates')
    .description('Header with block-style ASCII logo')
    .render(() => {
      const logo = Box(
        { flexDirection: 'column' },
        Text({ color: 'cyan', bold: true }, '▀█▀ █ █ █'),
        Text({ color: 'cyan', bold: true }, ' █  █ █ █'),
        Text({ color: 'cyan', bold: true }, ' █  ▀▀▀ █'),
      );

      const info = Box(
        { flexDirection: 'column' },
        Box(
          { flexDirection: 'row' },
          Text({ color: 'cyan', bold: true }, 'Tuiuiu.js'),
          Text({ color: 'mutedForeground' }, ' Storybook'),
          Spacer({}),
          Text({ color: 'mutedForeground', dim: true }, 'v1.0.8'),
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'success' }, '● 85 components'),
          Text({ color: 'primary' }, '● TypeScript'),
        ),
        Text({ color: 'mutedForeground', dim: true }, 'Zero dependencies TUI framework'),
      );

      return SplitBox({
        borderStyle: 'round',
        borderColor: 'cyan',
        width: 65,
        sections: [
          { width: 11, content: logo, valign: 'middle' },
          { flexGrow: 1, content: info },
        ],
        paddingX: 1,
      });
    }),

  story('Header - Three Sections')
    .category('Templates')
    .description('Header with logo, title, and status sections')
    .render(() => {
      const logo = Box(
        { flexDirection: 'column' },
        Text({ color: 'warning', bold: true }, '╔═╗'),
        Text({ color: 'warning', bold: true }, '╠═╣'),
        Text({ color: 'warning', bold: true }, '╩ ╩'),
      );

      const title = Box(
        { flexDirection: 'column' },
        Text({ color: 'foreground', bold: true }, 'ADMIN PANEL'),
        Text({ color: 'mutedForeground', dim: true }, 'System Management'),
      );

      const status = Box(
        { flexDirection: 'column', alignItems: 'flex-end' },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'success' }, '●'),
          Text({ color: 'success' }, 'Online'),
        ),
        Text({ color: 'mutedForeground', dim: true }, '14:32:15'),
      );

      return SplitBox({
        borderStyle: 'double',
        borderColor: 'warning',
        width: 60,
        sections: [
          { width: 5, content: logo, valign: 'middle', align: 'center' },
          { flexGrow: 1, content: title, valign: 'middle' },
          { width: 12, content: status, valign: 'middle' },
        ],
        paddingX: 1,
      });
    }),

  story('Header - Minimal Logo')
    .category('Templates')
    .description('Minimal header with small logo icon')
    .render(() => {
      const logo = Text({ color: 'primary', bold: true }, '◆');

      const info = Box(
        { flexDirection: 'row' },
        Text({ color: 'foreground', bold: true }, 'MyApp'),
        Spacer({}),
        Text({ color: 'mutedForeground' }, 'Dashboard'),
        Text({ color: 'mutedForeground', dim: true }, '  │  '),
        Text({ color: 'mutedForeground' }, 'Settings'),
        Text({ color: 'mutedForeground', dim: true }, '  │  '),
        Text({ color: 'mutedForeground' }, 'Help'),
      );

      return SplitBox({
        borderStyle: 'round',
        borderColor: 'border',
        width: 60,
        sections: [
          { width: 3, content: logo, align: 'center' },
          { flexGrow: 1, content: info },
        ],
        paddingX: 1,
      });
    }),

  story('Header - IDE Style')
    .category('Templates')
    .description('IDE-style header with file info and git status')
    .render(() => {
      const logo = Box(
        { flexDirection: 'column' },
        Text({ color: 'blue', bold: true }, '┏━┓'),
        Text({ color: 'blue', bold: true }, '┃▶┃'),
        Text({ color: 'blue', bold: true }, '┗━┛'),
      );

      const fileInfo = Box(
        { flexDirection: 'column' },
        Box(
          { flexDirection: 'row' },
          Text({ color: 'foreground', bold: true }, 'CodeEdit Pro'),
          Spacer({}),
          Text({ color: 'success' }, '⎇ main'),
        ),
        Box(
          { flexDirection: 'row' },
          Text({ color: 'primary' }, '📄 src/index.ts'),
          Spacer({}),
          Text({ color: 'warning' }, '● Modified'),
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'mutedForeground', dim: true }, 'TypeScript'),
          Text({ color: 'mutedForeground', dim: true }, 'UTF-8'),
          Text({ color: 'mutedForeground', dim: true }, 'LF'),
        ),
      );

      return SplitBox({
        borderStyle: 'bold',
        borderColor: 'blue',
        width: 60,
        sections: [
          { width: 5, content: logo, valign: 'middle', align: 'center' },
          { flexGrow: 1, content: fileInfo },
        ],
        paddingX: 1,
      });
    }),

  story('Header - Dashboard Metrics')
    .category('Templates')
    .description('Dashboard header with live metrics')
    .render(() => {
      const logo = Box(
        { flexDirection: 'column' },
        Text({ color: 'green', bold: true }, '╭─╮'),
        Text({ color: 'green', bold: true }, '│█│'),
        Text({ color: 'green', bold: true }, '╰─╯'),
      );

      const title = Box(
        { flexDirection: 'column' },
        Text({ color: 'green', bold: true }, 'SYSTEM MONITOR'),
        Text({ color: 'mutedForeground', dim: true }, 'Real-time metrics'),
      );

      const metrics = Box(
        { flexDirection: 'column' },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'mutedForeground' }, 'CPU:'),
          Text({ color: 'warning' }, '45%'),
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'mutedForeground' }, 'RAM:'),
          Text({ color: 'success' }, '2.1G'),
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'mutedForeground' }, 'NET:'),
          Text({ color: 'primary' }, '↓12 ↑4'),
        ),
      );

      return SplitBox({
        borderStyle: 'round',
        borderColor: 'green',
        width: 50,
        sections: [
          { width: 5, content: logo, valign: 'middle', align: 'center' },
          { flexGrow: 1, content: title, valign: 'middle' },
          { width: 12, content: metrics },
        ],
        paddingX: 1,
      });
    }),

  story('Header - Game Style')
    .category('Templates')
    .description('Game-style header with player stats')
    .render(() => {
      const logo = Box(
        { flexDirection: 'column' },
        Text({ color: 'magenta', bold: true }, '╔╦╗'),
        Text({ color: 'magenta', bold: true }, ' ║ '),
        Text({ color: 'magenta', bold: true }, ' ╩ '),
      );

      const title = Box(
        { flexDirection: 'column' },
        Text({ color: 'magenta', bold: true }, 'TERMINAL QUEST'),
        Text({ color: 'yellow' }, '★★★☆☆ Level 42'),
      );

      const stats = Box(
        { flexDirection: 'column', alignItems: 'flex-end' },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'red' }, '♥'),
          Text({ color: 'foreground' }, '85/100'),
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'yellow' }, '⚡'),
          Text({ color: 'foreground' }, '50/50'),
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'cyan' }, '◆'),
          Text({ color: 'foreground' }, '1,234'),
        ),
      );

      return SplitBox({
        borderStyle: 'double',
        borderColor: 'magenta',
        width: 50,
        sections: [
          { width: 5, content: logo, valign: 'middle', align: 'center' },
          { flexGrow: 1, content: title, valign: 'middle' },
          { width: 10, content: stats },
        ],
        paddingX: 1,
      });
    }),
];

// ============================================================================
// Sidebars
// ============================================================================

export const sidebarStories: Story[] = [
  story('Sidebar - File Explorer')
    .category('Templates')
    .description('File explorer sidebar')
    .render(() => {
      return Box(
        {
          flexDirection: 'column',
          width: 30,
          height: 20,
          borderStyle: 'single',
          borderColor: 'border',
        },
        // Header
        Box(
          { paddingX: 1, backgroundColor: 'primary' },
          Text({ color: 'primaryForeground', bold: true }, 'EXPLORER')
        ),
        // Tree
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          Text({ color: 'warning' }, '▼ 📁 tuiuiu'),
          Text({ color: 'mutedForeground' }, '  ▼ 📁 src'),
          Text({ color: 'primary' }, '    ▶ 📁 components'),
          Text({ color: 'primary' }, '    ▶ 📁 core'),
          Text({ inverse: true }, '    📄 index.ts'),
          Text({}, '    📄 types.ts'),
          Text({ color: 'mutedForeground' }, '  ▼ 📁 tests'),
          Text({}, '    📄 app.test.ts'),
          Text({}, '  📄 package.json'),
          Text({}, '  📄 README.md'),
          Spacer({})
        ),
        // Footer
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'border' },
          Text({ color: 'mutedForeground', dim: true }, '12 files, 4 folders')
        )
      );
    }),

  story('Sidebar - Navigation Menu')
    .category('Templates')
    .description('Navigation menu sidebar')
    .controls({
      activeItem: defaultControls.range('Active Item', 0, 0, 4),
    })
    .render((props) => {
      const items = [
        { icon: '🏠', label: 'Dashboard' },
        { icon: '📊', label: 'Analytics' },
        { icon: '👥', label: 'Users' },
        { icon: '📁', label: 'Files' },
        { icon: '⚙️', label: 'Settings' },
      ];

      return Box(
        {
          flexDirection: 'column',
          width: 25,
          height: 18,
          borderStyle: 'single',
          borderColor: 'primary',
        },
        // Logo
        Box(
          { paddingX: 2, paddingY: 1, borderStyle: 'single', borderColor: 'primary' },
          Text({ color: 'primary', bold: true }, '🚀 MyApp')
        ),
        // Menu items
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          ...items.map((item, idx) => {
            const isActive = idx === props.activeItem;
            return Box(
              {
                paddingX: 1,
                paddingY: 0,
                backgroundColor: isActive ? 'secondary' : undefined,
              },
              Text(
                { color: isActive ? 'gray' : 'mutedForeground' },
                `${item.icon} ${item.label}`
              )
            );
          }),
          Spacer({})
        ),
        // User
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'border' },
          Text({ color: 'mutedForeground' }, '👤 john@example.com')
        )
      );
    }),

  story('Sidebar - Collapsible')
    .category('Templates')
    .description('Collapsible icon-only sidebar')
    .controls({
      expanded: defaultControls.boolean('Expanded', false),
    })
    .render((props) => {
      const items = [
        { icon: '🏠', label: 'Home' },
        { icon: '📊', label: 'Stats' },
        { icon: '👥', label: 'Users' },
        { icon: '⚙️', label: 'Settings' },
      ];

      return Box(
        {
          flexDirection: 'column',
          width: props.expanded ? 20 : 6,
          height: 15,
          borderStyle: 'single',
          borderColor: 'border',
        },
        Box(
          { padding: 1 },
          Text({ color: 'primary', bold: true }, props.expanded ? '☰ Menu' : '☰')
        ),
        Divider({}),
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          ...items.map((item, idx) =>
            Box(
              { paddingY: 0 },
              Text(
                { color: idx === 0 ? 'primary' : 'mutedForeground' },
                props.expanded ? `${item.icon} ${item.label}` : item.icon
              )
            )
          )
        )
      );
    }),
];

// ============================================================================
// Status Bars & Footers
// ============================================================================

export const statusBarStories: Story[] = [
  story('StatusBar - Editor Style')
    .category('Templates')
    .description('VS Code-style status bar')
    .render(() => {
      return Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'primary',
          paddingX: 1,
        },
        // Left section
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'white' }, '⎇ main'),
          Text({ color: 'white' }, '↻ 0 ↓ 0'),
          Text({ color: 'warning' }, '⚠ 2'),
          Text({ color: 'destructive' }, '✗ 1')
        ),
        Spacer({}),
        // Right section
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'white' }, 'Ln 42, Col 15'),
          Text({ color: 'white' }, 'UTF-8'),
          Text({ color: 'white' }, 'LF'),
          Text({ color: 'white' }, 'TypeScript'),
          Text({ color: 'white' }, '⚡ Prettier')
        )
      );
    }),

  story('StatusBar - Terminal Style')
    .category('Templates')
    .description('Terminal-style status bar')
    .render(() => {
      return Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'muted',
          paddingX: 1,
        },
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'success' }, '●'),
          Text({ color: 'foreground' }, 'zsh'),
          Text({ color: 'primary' }, '~/projects/tuiuiu')
        ),
        Spacer({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'warning' }, '⏱ 0.52s'),
          Text({ color: 'foreground' }, '🕐 14:32:15')
        )
      );
    }),

  story('StatusBar - Progress')
    .category('Templates')
    .description('Status bar with progress indicator')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          borderStyle: 'single',
          borderColor: 'border',
          paddingX: 1,
        },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'primary' }, '⟳'),
          Text({ color: 'foreground' }, 'Building...'),
          Text({ color: 'primary' }, '████████░░░░░░░░'),
          Text({ color: 'mutedForeground' }, '52%')
        ),
        Spacer({}),
        Text({ color: 'mutedForeground' }, 'Press Ctrl+C to cancel')
      )
    ),

  story('StatusBar - Multi-Section')
    .category('Templates')
    .description('Status bar with multiple sections')
    .render(() => {
      return Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'muted',
        },
        // Mode indicator
        Box(
          { backgroundColor: 'success', paddingX: 1 },
          Text({ color: 'successForeground', bold: true }, 'NORMAL')
        ),
        // File info
        Box(
          { paddingX: 2 },
          Text({ color: 'foreground' }, '📄 index.ts')
        ),
        // Modified indicator
        Box(
          { paddingX: 1 },
          Text({ color: 'warning' }, '[+]')
        ),
        Spacer({}),
        // Position
        Box(
          { backgroundColor: 'primary', paddingX: 1 },
          Text({ color: 'primaryForeground' }, '42:15')
        ),
        // Percentage
        Box(
          { backgroundColor: 'secondary', paddingX: 1 },
          Text({ color: 'secondaryForeground' }, '68%')
        )
      );
    }),
];

// ============================================================================
// Command Interfaces
// ============================================================================

export const commandStories: Story[] = [
  story('Command - Input Line')
    .category('Templates')
    .description('Simple command input line')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          borderStyle: 'single',
          borderColor: 'primary',
          paddingX: 1,
        },
        Text({ color: 'primary', bold: true }, '❯ '),
        Text({ color: 'foreground' }, 'npm install tuiuiu.js'),
        Text({ color: 'primary' }, '▋')
      )
    ),

  story('Command - With Output')
    .category('Templates')
    .description('Command line with output history')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 80,
          height: 15,
          borderStyle: 'single',
          borderColor: 'border',
          padding: 1,
        },
        // History
        Box(
          { flexDirection: 'column', flexGrow: 1 },
          Box(
            { flexDirection: 'row' },
            Text({ color: 'success' }, '$ '),
            Text({ color: 'foreground' }, 'git status')
          ),
          Text({ color: 'mutedForeground' }, 'On branch main'),
          Text({ color: 'mutedForeground' }, 'Changes not staged for commit:'),
          Text({ color: 'destructive' }, '  modified:   src/index.ts'),
          Text({ color: 'destructive' }, '  modified:   src/app.ts'),
          Text({}),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'success' }, '$ '),
            Text({ color: 'foreground' }, 'npm test')
          ),
          Text({ color: 'success' }, '✓ All tests passed (42 tests)'),
          Spacer({})
        ),
        // Input
        Divider({ color: 'border' }),
        Box(
          { flexDirection: 'row' },
          Text({ color: 'success' }, '$ '),
          Text({ color: 'foreground' }, 'git add .'),
          Text({ color: 'primary' }, '▋')
        )
      )
    ),

  story('Command - Autocomplete')
    .category('Templates')
    .description('Command with autocomplete suggestions')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 60,
        },
        // Input
        Box(
          {
            flexDirection: 'row',
            borderStyle: 'single',
            borderColor: 'primary',
            paddingX: 1,
          },
          Text({ color: 'primary' }, '❯ '),
          Text({ color: 'foreground' }, 'git ch'),
          Text({ color: 'mutedForeground', dim: true }, 'eckout'),
          Text({ color: 'primary' }, '▋')
        ),
        // Suggestions
        Box(
          {
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: 'border',
            marginTop: 0,
          },
          (() => {
            return Box(
              { backgroundColor: 'primary', paddingX: 1 },
              Text({ color: 'primaryForeground' }, 'checkout'),
              Text({ color: 'primaryForeground', dim: true }, '  Switch branches')
            );
          })(),
          Box(
            { paddingX: 1 },
            Text({ color: 'mutedForeground' }, 'cherry-pick'),
            Text({ color: 'mutedForeground', dim: true }, '  Apply commits')
          ),
          Box(
            { paddingX: 1 },
            Text({ color: 'mutedForeground' }, 'cherry'),
            Text({ color: 'mutedForeground', dim: true }, '  Find commits')
          )
        )
      )
    ),

  story('Command - Palette')
    .category('Templates')
    .description('Command palette with keyboard shortcuts')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 60,
          borderStyle: 'round',
          borderColor: 'primary',
        },
        // Search
        Box(
          { paddingX: 2, paddingY: 1, borderStyle: 'single', borderColor: 'border' },
          Text({ color: 'mutedForeground' }, '> '),
          Text({ color: 'foreground' }, 'file'),
          Text({ color: 'primary' }, '▋')
        ),
        // Results
        Box(
          { flexDirection: 'column', padding: 1 },
          (() => {
            return Box(
              { backgroundColor: 'primary', paddingX: 1, flexDirection: 'row' },
              Text({ color: 'primaryForeground' }, '📄 New File'),
              Spacer({}),
              Text({ color: 'primaryForeground', dim: true }, 'Ctrl+N')
            );
          })(),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({ color: 'mutedForeground' }, '📂 Open File'),
            Spacer({}),
            Text({ color: 'mutedForeground' }, 'Ctrl+O')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({ color: 'mutedForeground' }, '💾 Save File'),
            Spacer({}),
            Text({ color: 'mutedForeground' }, 'Ctrl+S')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({ color: 'mutedForeground' }, '📋 Save All Files'),
            Spacer({}),
            Text({ color: 'mutedForeground' }, 'Ctrl+Shift+S')
          )
        ),
        // Footer
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'border' },
          Text({ color: 'mutedForeground', dim: true }, '↑↓ Navigate  ↵ Select  Esc Close')
        )
      )
    ),
];

// ============================================================================
// Complete App Shells
// ============================================================================

export const appShellStories: Story[] = [
  story('Shell - Editor')
    .category('Templates')
    .description('Complete code editor layout')
    .render(() => {
      return Box(
        {
          flexDirection: 'column',
          width: 80,
          height: 24,
        },
        // Top bar (tabs)
        Box(
          { flexDirection: 'row', backgroundColor: 'muted' },
          Box(
            { paddingX: 2, backgroundColor: 'primary' },
            Text({ color: 'primaryForeground' }, '📄 index.ts ×')
          ),
          Box({ paddingX: 2 }, Text({ color: 'mutedForeground' }, '📄 app.ts')),
          Box({ paddingX: 2 }, Text({ color: 'mutedForeground' }, '📄 utils.ts')),
          Spacer({})
        ),
        // Main content
        Box(
          { flexDirection: 'row', flexGrow: 1 },
          // Sidebar
          Box(
            {
              width: 25,
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'border',
            },
            Box(
              { paddingX: 1, backgroundColor: 'muted' },
              Text({ color: 'mutedForeground' }, 'EXPLORER')
            ),
            Box(
              { padding: 1, flexDirection: 'column', flexGrow: 1 },
              Text({ color: 'warning' }, '▼ 📁 src'),
              Text({ inverse: true }, '  📄 index.ts'),
              Text({}, '  📄 app.ts'),
              Text({}, '  📄 utils.ts'),
              Text({ color: 'primary' }, '▶ 📁 tests'),
              Spacer({})
            )
          ),
          // Editor area
          Box(
            {
              flexGrow: 1,
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'border',
            },
            Box(
              { padding: 1, flexGrow: 1, flexDirection: 'column' },
              Text({ color: 'mutedForeground' }, ' 1  '),
              Text({}, ''),
              Box(
                { flexDirection: 'row' },
                Text({ color: 'mutedForeground' }, ' 2  '),
                Text({ color: 'accent' }, 'import '),
                Text({ color: 'primary' }, '{ App }'),
                Text({ color: 'accent' }, ' from '),
                Text({ color: 'success' }, "'./app'")
              ),
              Box(
                { flexDirection: 'row' },
                Text({ color: 'mutedForeground' }, ' 3  '),
                Text({})
              ),
              Box(
                { flexDirection: 'row' },
                Text({ color: 'mutedForeground' }, ' 4  '),
                Text({ color: 'accent' }, 'export '),
                Text({ color: 'primary' }, 'function '),
                Text({ color: 'warning' }, 'main'),
                Text({}, '() {')
              ),
              Box(
                { flexDirection: 'row' },
                Text({ color: 'mutedForeground' }, ' 5  '),
                Text({}, '  '),
                Text({ color: 'primary' }, 'const '),
                Text({}, 'app = '),
                Text({ color: 'accent' }, 'new '),
                Text({ color: 'warning' }, 'App'),
                Text({}, '()▋')
              ),
              Spacer({})
            )
          )
        ),
        // Status bar
        Box(
          { flexDirection: 'row', backgroundColor: 'primary', paddingX: 1 },
          Text({ color: 'primaryForeground' }, '⎇ main'),
          Text({ color: 'primaryForeground' }, '  ✓ 0 ⚠ 0'),
          Spacer({}),
          Text({ color: 'primaryForeground' }, 'Ln 5, Col 28'),
          Text({ color: 'primaryForeground' }, '  TypeScript')
        )
      );
    }),

  story('Shell - Dashboard')
    .category('Templates')
    .description('Dashboard application layout')
    .render(() => {
      return Box(
        {
          flexDirection: 'column',
          width: 80,
          height: 24,
        },
        // Header
        Box(
          { flexDirection: 'row', backgroundColor: 'primary', paddingX: 2, paddingY: 1 },
          Text({ color: 'primaryForeground', bold: true }, '📊 Analytics Dashboard'),
          Spacer({}),
          Text({ color: 'warning' }, '🔔 3'),
          Text({ color: 'primaryForeground' }, '  👤 Admin')
        ),
        // Main content
        Box(
          { flexDirection: 'row', flexGrow: 1 },
          // Sidebar
          Box(
            {
              width: 20,
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'border',
              padding: 1,
            },
            Box(
              { backgroundColor: 'secondary', paddingX: 1 },
              Text({ color: 'gray' }, '🏠 Overview')
            ),
            Text({ color: 'mutedForeground' }, '📈 Analytics'),
            Text({ color: 'mutedForeground' }, '👥 Users'),
            Text({ color: 'mutedForeground' }, '💰 Revenue'),
            Text({ color: 'mutedForeground' }, '📦 Products'),
            Spacer({}),
            Divider({ color: 'border' }),
            Text({ color: 'mutedForeground' }, '⚙️ Settings')
          ),
          // Content area
          Box(
            {
              flexGrow: 1,
              flexDirection: 'column',
              padding: 1,
              gap: 1,
            },
            // Stats row
            Box(
              { flexDirection: 'row', gap: 1 },
              Box(
                { borderStyle: 'round', borderColor: 'primary', padding: 1, flexGrow: 1 },
                Text({ color: 'mutedForeground', dim: true }, 'Users'),
                Text({}, ''),
                Text({ color: 'primary', bold: true }, '12,543')
              ),
              Box(
                { borderStyle: 'round', borderColor: 'success', padding: 1, flexGrow: 1 },
                Text({ color: 'mutedForeground', dim: true }, 'Revenue'),
                Text({}, ''),
                Text({ color: 'success', bold: true }, '$45.2k')
              ),
              Box(
                { borderStyle: 'round', borderColor: 'warning', padding: 1, flexGrow: 1 },
                Text({ color: 'mutedForeground', dim: true }, 'Orders'),
                Text({}, ''),
                Text({ color: 'warning', bold: true }, '892')
              )
            ),
            // Chart area
            Box(
              {
                borderStyle: 'single',
                borderColor: 'border',
                padding: 1,
                flexGrow: 1,
              },
              Box(
                { flexDirection: 'column' },
                Text({ color: 'foreground', bold: true }, 'Traffic Overview'),
                Text({}),
                Text({ color: 'primary' }, '     ▂▃▅▇█▇▅▃▂▃▅▇█▇▅▃▂'),
                Text({ color: 'mutedForeground' }, '  0 ─┼─────────────────────'),
                Text({ color: 'mutedForeground', dim: true }, '     Mon Tue Wed Thu Fri')
              )
            )
          )
        ),
        // Footer
        Box(
          { flexDirection: 'row', backgroundColor: 'muted', paddingX: 1 },
          Text({ color: 'success' }, '● Connected'),
          Spacer({}),
          Text({ color: 'mutedForeground', dim: true }, 'Last updated: 2 min ago')
        )
      );
    }),

  story('Shell - Terminal')
    .category('Templates')
    .description('Terminal emulator layout')
    .render(() => {
      return Box(
        {
          flexDirection: 'column',
          width: 80,
          height: 20,
          borderStyle: 'single',
          borderColor: 'border',
        },
        // Title bar
        Box(
          { flexDirection: 'row', backgroundColor: 'muted', paddingX: 1 },
          Text({ color: 'destructive' }, '● '),
          Text({ color: 'warning' }, '● '),
          Text({ color: 'success' }, '● '),
          Spacer({}),
          Text({ color: 'foreground' }, 'Terminal — zsh'),
          Spacer({}),
          Text({ color: 'mutedForeground' }, '     ')
        ),
        // Terminal content
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1, backgroundColor: 'background' },
          Box(
            { flexDirection: 'row' },
            Text({ color: 'success' }, '➜ '),
            Text({ color: 'primary' }, '~/projects/tuiuiu '),
            Text({ color: 'accent' }, 'git:('),
            Text({ color: 'destructive' }, 'main'),
            Text({ color: 'accent' }, ') '),
            Text({ color: 'warning' }, '✗ ')
          ),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'foreground' }, 'npm test')
          ),
          Text({}),
          Text({ color: 'mutedForeground' }, '> tuiuiu@0.1.0 test'),
          Text({ color: 'mutedForeground' }, '> vitest'),
          Text({}),
          Text({ color: 'success' }, ' ✓ tests/core/signal.test.ts (24 tests) 3ms'),
          Text({ color: 'success' }, ' ✓ tests/core/layout.test.ts (18 tests) 5ms'),
          Text({ color: 'success' }, ' ✓ tests/hooks/hooks.test.ts (12 tests) 4ms'),
          Text({}),
          Text({ color: 'success', bold: true }, ' Test Files  3 passed (3)'),
          Text({ color: 'success', bold: true }, '      Tests  54 passed (54)'),
          Spacer({}),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'success' }, '➜ '),
            Text({ color: 'primary' }, '~/projects/tuiuiu '),
            Text({ color: 'foreground' }, '▋')
          )
        )
      );
    }),

  story('Shell - File Manager')
    .category('Templates')
    .description('Dual-pane file manager layout')
    .render(() => {
      return Box(
        {
          flexDirection: 'column',
          width: 80,
          height: 20,
        },
        // Menu bar
        Box(
          { flexDirection: 'row', backgroundColor: 'secondary', paddingX: 1 },
          Text({ color: 'gray' }, 'File'),
          Text({ color: 'gray' }, '  Edit'),
          Text({ color: 'gray' }, '  View'),
          Text({ color: 'gray' }, '  Go'),
          Text({ color: 'gray' }, '  Help'),
          Spacer({})
        ),
        // Dual pane
        Box(
          { flexDirection: 'row', flexGrow: 1 },
          // Left pane (active)
          Box(
            {
              width: 40,
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'primary',
            },
            Box(
              { paddingX: 1, backgroundColor: 'primary' },
              Text({ color: 'primaryForeground' }, '~/Documents')
            ),
            Box(
              { flexDirection: 'column', padding: 1, flexGrow: 1 },
              Text({ color: 'warning' }, '..            <DIR>'),
              Text({ color: 'warning' }, 'projects      <DIR>'),
              Text({ inverse: true }, 'notes.txt      4.2K'),
              Text({}, 'budget.xlsx   12.8K'),
              Text({}, 'resume.pdf    89.3K'),
              Spacer({})
            ),
            Box(
              { paddingX: 1, backgroundColor: 'muted' },
              Text({ color: 'mutedForeground' }, '5 files, 106.3K')
            )
          ),
          // Right pane (inactive)
          Box(
            {
              width: 40,
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'border',
            },
            Box(
              { paddingX: 1, backgroundColor: 'muted' },
              Text({ color: 'mutedForeground' }, '~/Downloads')
            ),
            Box(
              { flexDirection: 'column', padding: 1, flexGrow: 1 },
              Text({ color: 'warning' }, '..            <DIR>'),
              Text({}, 'image.png    256.4K'),
              Text({}, 'setup.exe      1.2M'),
              Text({}, 'data.json     34.1K'),
              Spacer({})
            ),
            Box(
              { paddingX: 1, backgroundColor: 'muted' },
              Text({ color: 'mutedForeground' }, '3 files, 1.5M')
            )
          )
        ),
        // Function key bar
        Box(
          { flexDirection: 'row', backgroundColor: 'primary' },
          Text({ color: 'secondary' }, ' 1'),
          Text({ color: 'primaryForeground' }, 'Help '),
          Text({ color: 'secondary' }, '2'),
          Text({ color: 'primaryForeground' }, 'Menu '),
          Text({ color: 'secondary' }, '3'),
          Text({ color: 'primaryForeground' }, 'View '),
          Text({ color: 'secondary' }, '4'),
          Text({ color: 'primaryForeground' }, 'Edit '),
          Text({ color: 'secondary' }, '5'),
          Text({ color: 'primaryForeground' }, 'Copy '),
          Text({ color: 'secondary' }, '6'),
          Text({ color: 'primaryForeground' }, 'Move '),
          Text({ color: 'secondary' }, '7'),
          Text({ color: 'primaryForeground' }, 'Mkdir'),
          Text({ color: 'secondary' }, '8'),
          Text({ color: 'primaryForeground' }, 'Del '),
          Text({ color: 'secondary' }, '10'),
          Text({ color: 'primaryForeground' }, 'Quit')
        )
      );
    }),

  story('Shell - Chat App')
    .category('Templates')
    .description('Chat application layout with proper ChatBubble components')
    .render(() => {
      // ChatBubble component - user messages on right, others on left
      const ChatBubble = (props: {
        content: string;
        sender: string;
        time: string;
        isUser?: boolean;
        status?: string;
      }) => {
        const { content, sender, time, isUser = false, status } = props;

        const bubble = Box(
          {
            flexDirection: 'column',
            borderStyle: 'round',
            borderColor: isUser ? 'primary' : 'border',
            backgroundColor: isUser ? 'primary' : undefined,
            paddingX: 1,
            maxWidth: 45,
          },
          // Header: sender + time
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: isUser ? 'primaryForeground' : 'primary', bold: true }, sender),
            Text({ color: isUser ? 'primaryForeground' : 'mutedForeground', dim: true }, time)
          ),
          // Content
          Text({ color: isUser ? 'primaryForeground' : 'foreground' }, content),
          // Status for user messages
          status ? Text({ color: 'primaryForeground', dim: true }, status) : null
        );

        // Align: user right, others left
        return Box(
          {
            flexDirection: 'row',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            marginBottom: 1,
            width: '100%',
          },
          bubble
        );
      };

      return Box(
        {
          flexDirection: 'column',
          width: 70,
          height: 20,
          borderStyle: 'round',
          borderColor: 'primary',
        },
        // Header
        Box(
          { flexDirection: 'row', paddingX: 2, paddingY: 1, borderStyle: 'single', borderColor: 'border' },
          Text({ color: 'success' }, '● '),
          Text({ color: 'foreground', bold: true }, 'Alice'),
          Text({ color: 'mutedForeground', dim: true }, '  Online'),
          Spacer({}),
          Text({ color: 'mutedForeground' }, '📞  📹  ⋮')
        ),
        // Messages using ChatBubble
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          ChatBubble({
            sender: '👩 Alice',
            content: 'Hey! How is the TUI coming along?',
            time: '10:30 AM',
          }),
          ChatBubble({
            sender: '👤 You',
            content: "It's going great! Almost done 🎉",
            time: '10:32 AM',
            isUser: true,
            status: '✓✓',
          }),
          ChatBubble({
            sender: '👩 Alice',
            content: "Awesome! Can't wait to try it!",
            time: '10:33 AM',
          }),
          Spacer({})
        ),
        // Input
        Box(
          {
            flexDirection: 'row',
            paddingX: 1,
            paddingY: 1,
            borderStyle: 'single',
            borderColor: 'border',
            gap: 1,
          },
          Text({ color: 'mutedForeground' }, '📎'),
          Box(
            { flexGrow: 1, borderStyle: 'single', borderColor: 'border', paddingX: 1 },
            Text({ color: 'mutedForeground', dim: true }, 'Type a message...')
          ),
          Text({ color: 'mutedForeground' }, '😊'),
          Text({ color: 'primary' }, '➤')
        )
      );
    }),
];

/**
 * All template stories
 */
export const allTemplateStories: Story[] = [
  ...stackStories,
  ...appLayoutStories,
  ...navbarStories,
  ...headerWithLogoStories,
  ...sidebarStories,
  ...statusBarStories,
  ...commandStories,
  ...appShellStories,
];

export default allTemplateStories;
