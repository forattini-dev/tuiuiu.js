/**
 * Apps Stories
 *
 * Complete application templates and reusable app structures.
 * This is the highest level in Atomic Design - full application shells:
 * - App Shells: Complete application layouts
 * - Navbars & Headers: Top navigation bars
 * - Sidebars: Side navigation panels
 * - Status Bars & Footers: Bottom status displays
 * - Command Interfaces: CLI-style command UIs
 * - Terminal Apps: Complete terminal application templates
 */

import { Box, Text, Spacer } from '../../../primitives/nodes.js';
import { Divider } from '../../../primitives/divider.js';
import { story, defaultControls } from '../../core/registry.js';
import type { Story } from '../../types.js';

// ============================================================================
// Navbars & Headers
// ============================================================================

export const navbarStories: Story[] = [
  story('Navbar - Simple')
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
// Sidebars
// ============================================================================

export const sidebarStories: Story[] = [
  story('Sidebar - File Explorer')
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
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
    .category('Apps')
    .description('Chat application layout')
    .render(() => {
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
        // Messages
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          // Received message
          Box(
            { flexDirection: 'column', marginBottom: 1 },
            Box(
              {
                borderStyle: 'round',
                borderColor: 'border',
                paddingX: 1,
                alignSelf: 'flex-start',
              },
              Text({}, 'Hey! How is the TUI coming along?')
            ),
            Text({ color: 'mutedForeground', dim: true }, '10:30 AM')
          ),
          // Sent message
          Box(
            { flexDirection: 'column', alignItems: 'flex-end', marginBottom: 1 },
            Box(
              {
                borderStyle: 'round',
                borderColor: 'secondary',
                backgroundColor: 'secondary',
                paddingX: 1,
              },
              Text({ color: 'gray' }, "It's going great! Almost done 🎉")
            ),
            Text({ color: 'mutedForeground', dim: true }, '10:32 AM ✓✓')
          ),
          // Received
          Box(
            { flexDirection: 'column' },
            Box(
              {
                borderStyle: 'round',
                borderColor: 'border',
                paddingX: 1,
                alignSelf: 'flex-start',
              },
              Text({}, "Awesome! Can't wait to try it!")
            ),
            Text({ color: 'mutedForeground', dim: true }, '10:33 AM')
          ),
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
 * All app stories
 */
export const allAppStories: Story[] = [
  ...navbarStories,
  ...sidebarStories,
  ...statusBarStories,
  ...commandStories,
  ...appShellStories,
];

export default allAppStories;
