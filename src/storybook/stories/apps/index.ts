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

import { Box, Text, Spacer, Divider } from '../../../components/components.js';
import { story, defaultControls } from '../../core/registry.js';
import type { Story } from '../../types.js';

// ============================================================================
// Navbars & Headers
// ============================================================================

export const navbarStories: Story[] = [
  story('Navbar - Simple')
    .category('Apps')
    .description('Simple top navigation bar')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'blue',
          paddingX: 2,
          paddingY: 1,
        },
        Text({ color: 'white', bold: true }, '🚀 MyApp'),
        Spacer({}),
        Box(
          { flexDirection: 'row', gap: 3 },
          Text({ color: 'cyan' }, 'Home'),
          Text({ color: 'gray' }, 'Files'),
          Text({ color: 'gray' }, 'Settings'),
          Text({ color: 'gray' }, 'Help')
        )
      )
    ),

  story('Navbar - With Search')
    .category('Apps')
    .description('Navigation bar with search input')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'gray',
          paddingX: 2,
          paddingY: 1,
          gap: 2,
        },
        Text({ color: 'white', bold: true }, '📦 PackageManager'),
        Box(
          { borderStyle: 'single', borderColor: 'white', paddingX: 1, flexGrow: 1 },
          Text({ color: 'gray', dim: true }, '🔍 Search packages...')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'cyan' }, 'Browse'),
          Text({ color: 'gray' }, 'Installed'),
          Text({ color: 'gray' }, 'Updates')
        )
      )
    ),

  story('Navbar - Breadcrumb Style')
    .category('Apps')
    .description('Navigation with breadcrumb path')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          borderStyle: 'single',
          borderColor: 'gray',
          paddingX: 2,
          paddingY: 1,
        },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'cyan' }, '~'),
          Text({ color: 'gray' }, '/'),
          Text({ color: 'cyan' }, 'projects'),
          Text({ color: 'gray' }, '/'),
          Text({ color: 'cyan' }, 'tuiuiu'),
          Text({ color: 'gray' }, '/'),
          Text({ color: 'white', bold: true }, 'src')
        ),
        Spacer({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'green' }, '✓ main'),
          Text({ color: 'gray' }, '|'),
          Text({ color: 'yellow' }, '3 modified')
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
          backgroundColor: 'gray',
        },
        ...tabs.map((tab, idx) =>
          Box(
            {
              paddingX: 2,
              paddingY: 1,
              backgroundColor: idx === props.activeTab ? 'blue' : undefined,
            },
            Text(
              { color: idx === props.activeTab ? 'white' : 'gray' },
              tab
            ),
            idx === props.activeTab ? Text({ color: 'gray', dim: true }, ' ×') : null
          )
        ),
        Spacer({}),
        Box(
          { paddingX: 2, paddingY: 1 },
          Text({ color: 'gray' }, '+')
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
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 30,
          height: 20,
          borderStyle: 'single',
          borderColor: 'gray',
        },
        // Header
        Box(
          { paddingX: 1, backgroundColor: 'blue' },
          Text({ color: 'white', bold: true }, 'EXPLORER')
        ),
        // Tree
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          Text({ color: 'yellow' }, '▼ 📁 tuiuiu'),
          Text({ color: 'gray' }, '  ▼ 📁 src'),
          Text({ color: 'cyan' }, '    ▶ 📁 components'),
          Text({ color: 'cyan' }, '    ▶ 📁 core'),
          Text({ inverse: true }, '    📄 index.ts'),
          Text({}, '    📄 types.ts'),
          Text({ color: 'gray' }, '  ▼ 📁 tests'),
          Text({}, '    📄 app.test.ts'),
          Text({}, '  📄 package.json'),
          Text({}, '  📄 README.md'),
          Spacer({})
        ),
        // Footer
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'gray' },
          Text({ color: 'gray', dim: true }, '12 files, 4 folders')
        )
      )
    ),

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
          borderColor: 'cyan',
        },
        // Logo
        Box(
          { paddingX: 2, paddingY: 1, borderStyle: 'single', borderColor: 'cyan' },
          Text({ color: 'cyan', bold: true }, '🚀 MyApp')
        ),
        // Menu items
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          ...items.map((item, idx) =>
            Box(
              {
                paddingX: 1,
                paddingY: 0,
                backgroundColor: idx === props.activeItem ? 'cyan' : undefined,
              },
              Text(
                { color: idx === props.activeItem ? 'white' : 'gray' },
                `${item.icon} ${item.label}`
              )
            )
          ),
          Spacer({})
        ),
        // User
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'gray' },
          Text({ color: 'gray' }, '👤 john@example.com')
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
          borderColor: 'gray',
        },
        Box(
          { padding: 1 },
          Text({ color: 'cyan', bold: true }, props.expanded ? '☰ Menu' : '☰')
        ),
        Divider({}),
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1 },
          ...items.map((item, idx) =>
            Box(
              { paddingY: 0 },
              Text(
                { color: idx === 0 ? 'cyan' : 'gray' },
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
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'blue',
          paddingX: 1,
        },
        // Left section
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'white' }, '⎇ main'),
          Text({ color: 'white' }, '↻ 0 ↓ 0'),
          Text({ color: 'yellow' }, '⚠ 2'),
          Text({ color: 'red' }, '✗ 1')
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
      )
    ),

  story('StatusBar - Terminal Style')
    .category('Apps')
    .description('Terminal-style status bar')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'gray',
          paddingX: 1,
        },
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'green' }, '●'),
          Text({ color: 'white' }, 'zsh'),
          Text({ color: 'cyan' }, '~/projects/tuiuiu')
        ),
        Spacer({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'yellow' }, '⏱ 0.52s'),
          Text({ color: 'white' }, '🕐 14:32:15')
        )
      )
    ),

  story('StatusBar - Progress')
    .category('Apps')
    .description('Status bar with progress indicator')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          borderStyle: 'single',
          borderColor: 'gray',
          paddingX: 1,
        },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'cyan' }, '⟳'),
          Text({ color: 'white' }, 'Building...'),
          Text({ color: 'cyan' }, '████████░░░░░░░░'),
          Text({ color: 'gray' }, '52%')
        ),
        Spacer({}),
        Text({ color: 'gray' }, 'Press Ctrl+C to cancel')
      )
    ),

  story('StatusBar - Multi-Section')
    .category('Apps')
    .description('Status bar with multiple sections')
    .render(() =>
      Box(
        {
          flexDirection: 'row',
          width: 80,
          backgroundColor: 'gray',
        },
        // Mode indicator
        Box(
          { backgroundColor: 'green', paddingX: 1 },
          Text({ color: 'white', bold: true }, 'NORMAL')
        ),
        // File info
        Box(
          { paddingX: 2 },
          Text({ color: 'white' }, '📄 index.ts')
        ),
        // Modified indicator
        Box(
          { paddingX: 1 },
          Text({ color: 'yellow' }, '[+]')
        ),
        Spacer({}),
        // Position
        Box(
          { backgroundColor: 'blue', paddingX: 1 },
          Text({ color: 'white' }, '42:15')
        ),
        // Percentage
        Box(
          { backgroundColor: 'cyan', paddingX: 1 },
          Text({ color: 'white' }, '68%')
        )
      )
    ),
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
          borderColor: 'cyan',
          paddingX: 1,
        },
        Text({ color: 'cyan', bold: true }, '❯ '),
        Text({ color: 'white' }, 'npm install tuiuiu.js'),
        Text({ color: 'cyan' }, '▋')
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
          borderColor: 'gray',
          padding: 1,
        },
        // History
        Box(
          { flexDirection: 'column', flexGrow: 1 },
          Box(
            { flexDirection: 'row' },
            Text({ color: 'green' }, '$ '),
            Text({ color: 'white' }, 'git status')
          ),
          Text({ color: 'gray' }, 'On branch main'),
          Text({ color: 'gray' }, 'Changes not staged for commit:'),
          Text({ color: 'red' }, '  modified:   src/index.ts'),
          Text({ color: 'red' }, '  modified:   src/app.ts'),
          Text({}),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'green' }, '$ '),
            Text({ color: 'white' }, 'npm test')
          ),
          Text({ color: 'green' }, '✓ All tests passed (42 tests)'),
          Spacer({})
        ),
        // Input
        Divider({ color: 'gray' }),
        Box(
          { flexDirection: 'row' },
          Text({ color: 'green' }, '$ '),
          Text({ color: 'white' }, 'git add .'),
          Text({ color: 'cyan' }, '▋')
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
            borderColor: 'cyan',
            paddingX: 1,
          },
          Text({ color: 'cyan' }, '❯ '),
          Text({ color: 'white' }, 'git ch'),
          Text({ color: 'gray', dim: true }, 'eckout'),
          Text({ color: 'cyan' }, '▋')
        ),
        // Suggestions
        Box(
          {
            flexDirection: 'column',
            borderStyle: 'single',
            borderColor: 'gray',
            marginTop: 0,
          },
          Box(
            { backgroundColor: 'blue', paddingX: 1 },
            Text({ color: 'white' }, 'checkout'),
            Text({ color: 'gray', dim: true }, '  Switch branches')
          ),
          Box(
            { paddingX: 1 },
            Text({ color: 'gray' }, 'cherry-pick'),
            Text({ color: 'gray', dim: true }, '  Apply commits')
          ),
          Box(
            { paddingX: 1 },
            Text({ color: 'gray' }, 'cherry'),
            Text({ color: 'gray', dim: true }, '  Find commits')
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
          borderColor: 'cyan',
        },
        // Search
        Box(
          { paddingX: 2, paddingY: 1, borderStyle: 'single', borderColor: 'gray' },
          Text({ color: 'gray' }, '> '),
          Text({ color: 'white' }, 'file'),
          Text({ color: 'cyan' }, '▋')
        ),
        // Results
        Box(
          { flexDirection: 'column', padding: 1 },
          Box(
            { backgroundColor: 'blue', paddingX: 1, flexDirection: 'row' },
            Text({ color: 'white' }, '📄 New File'),
            Spacer({}),
            Text({ color: 'gray' }, 'Ctrl+N')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({ color: 'gray' }, '📂 Open File'),
            Spacer({}),
            Text({ color: 'gray' }, 'Ctrl+O')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({ color: 'gray' }, '💾 Save File'),
            Spacer({}),
            Text({ color: 'gray' }, 'Ctrl+S')
          ),
          Box(
            { paddingX: 1, flexDirection: 'row' },
            Text({ color: 'gray' }, '📋 Save All Files'),
            Spacer({}),
            Text({ color: 'gray' }, 'Ctrl+Shift+S')
          )
        ),
        // Footer
        Box(
          { paddingX: 1, borderStyle: 'single', borderColor: 'gray' },
          Text({ color: 'gray', dim: true }, '↑↓ Navigate  ↵ Select  Esc Close')
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
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 80,
          height: 24,
        },
        // Top bar (tabs)
        Box(
          { flexDirection: 'row', backgroundColor: 'gray' },
          Box(
            { paddingX: 2, backgroundColor: 'blue' },
            Text({ color: 'white' }, '📄 index.ts ×')
          ),
          Box({ paddingX: 2 }, Text({ color: 'gray' }, '📄 app.ts')),
          Box({ paddingX: 2 }, Text({ color: 'gray' }, '📄 utils.ts')),
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
              borderColor: 'gray',
            },
            Box(
              { paddingX: 1, backgroundColor: 'gray' },
              Text({ color: 'white' }, 'EXPLORER')
            ),
            Box(
              { padding: 1, flexDirection: 'column', flexGrow: 1 },
              Text({ color: 'yellow' }, '▼ 📁 src'),
              Text({ inverse: true }, '  📄 index.ts'),
              Text({}, '  📄 app.ts'),
              Text({}, '  📄 utils.ts'),
              Text({ color: 'cyan' }, '▶ 📁 tests'),
              Spacer({})
            )
          ),
          // Editor area
          Box(
            {
              flexGrow: 1,
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'gray',
            },
            Box(
              { padding: 1, flexGrow: 1, flexDirection: 'column' },
              Text({ color: 'gray' }, ' 1  '),
              Text({}, ''),
              Box(
                { flexDirection: 'row' },
                Text({ color: 'gray' }, ' 2  '),
                Text({ color: 'magenta' }, 'import '),
                Text({ color: 'cyan' }, '{ App }'),
                Text({ color: 'magenta' }, ' from '),
                Text({ color: 'green' }, "'./app'")
              ),
              Box(
                { flexDirection: 'row' },
                Text({ color: 'gray' }, ' 3  '),
                Text({})
              ),
              Box(
                { flexDirection: 'row' },
                Text({ color: 'gray' }, ' 4  '),
                Text({ color: 'magenta' }, 'export '),
                Text({ color: 'cyan' }, 'function '),
                Text({ color: 'yellow' }, 'main'),
                Text({}, '() {')
              ),
              Box(
                { flexDirection: 'row' },
                Text({ color: 'gray' }, ' 5  '),
                Text({}, '  '),
                Text({ color: 'cyan' }, 'const '),
                Text({}, 'app = '),
                Text({ color: 'magenta' }, 'new '),
                Text({ color: 'yellow' }, 'App'),
                Text({}, '()▋')
              ),
              Spacer({})
            )
          )
        ),
        // Status bar
        Box(
          { flexDirection: 'row', backgroundColor: 'blue', paddingX: 1 },
          Text({ color: 'white' }, '⎇ main'),
          Text({ color: 'white' }, '  ✓ 0 ⚠ 0'),
          Spacer({}),
          Text({ color: 'white' }, 'Ln 5, Col 28'),
          Text({ color: 'white' }, '  TypeScript')
        )
      )
    ),

  story('Shell - Dashboard')
    .category('Apps')
    .description('Dashboard application layout')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 80,
          height: 24,
        },
        // Header
        Box(
          { flexDirection: 'row', backgroundColor: 'blue', paddingX: 2, paddingY: 1 },
          Text({ color: 'white', bold: true }, '📊 Analytics Dashboard'),
          Spacer({}),
          Text({ color: 'cyan' }, '🔔 3'),
          Text({ color: 'white' }, '  👤 Admin')
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
              borderColor: 'gray',
              padding: 1,
            },
            Box(
              { backgroundColor: 'cyan', paddingX: 1 },
              Text({ color: 'white' }, '🏠 Overview')
            ),
            Text({ color: 'gray' }, '📈 Analytics'),
            Text({ color: 'gray' }, '👥 Users'),
            Text({ color: 'gray' }, '💰 Revenue'),
            Text({ color: 'gray' }, '📦 Products'),
            Spacer({}),
            Divider({ color: 'gray' }),
            Text({ color: 'gray' }, '⚙️ Settings')
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
                { borderStyle: 'round', borderColor: 'cyan', padding: 1, flexGrow: 1 },
                Text({ color: 'gray', dim: true }, 'Users'),
                Text({}, ''),
                Text({ color: 'cyan', bold: true }, '12,543')
              ),
              Box(
                { borderStyle: 'round', borderColor: 'green', padding: 1, flexGrow: 1 },
                Text({ color: 'gray', dim: true }, 'Revenue'),
                Text({}, ''),
                Text({ color: 'green', bold: true }, '$45.2k')
              ),
              Box(
                { borderStyle: 'round', borderColor: 'yellow', padding: 1, flexGrow: 1 },
                Text({ color: 'gray', dim: true }, 'Orders'),
                Text({}, ''),
                Text({ color: 'yellow', bold: true }, '892')
              )
            ),
            // Chart area
            Box(
              {
                borderStyle: 'single',
                borderColor: 'gray',
                padding: 1,
                flexGrow: 1,
              },
              Box(
                { flexDirection: 'column' },
                Text({ color: 'white', bold: true }, 'Traffic Overview'),
                Text({}),
                Text({ color: 'cyan' }, '     ▂▃▅▇█▇▅▃▂▃▅▇█▇▅▃▂'),
                Text({ color: 'gray' }, '  0 ─┼─────────────────────'),
                Text({ color: 'gray', dim: true }, '     Mon Tue Wed Thu Fri')
              )
            )
          )
        ),
        // Footer
        Box(
          { flexDirection: 'row', backgroundColor: 'gray', paddingX: 1 },
          Text({ color: 'white' }, '● Connected'),
          Spacer({}),
          Text({ color: 'gray' }, 'Last updated: 2 min ago')
        )
      )
    ),

  story('Shell - Terminal')
    .category('Apps')
    .description('Terminal emulator layout')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 80,
          height: 20,
          borderStyle: 'single',
          borderColor: 'gray',
        },
        // Title bar
        Box(
          { flexDirection: 'row', backgroundColor: 'gray', paddingX: 1 },
          Text({ color: 'red' }, '● '),
          Text({ color: 'yellow' }, '● '),
          Text({ color: 'green' }, '● '),
          Spacer({}),
          Text({ color: 'white' }, 'Terminal — zsh'),
          Spacer({}),
          Text({ color: 'gray' }, '     ')
        ),
        // Terminal content
        Box(
          { flexDirection: 'column', padding: 1, flexGrow: 1, backgroundColor: 'black' },
          Box(
            { flexDirection: 'row' },
            Text({ color: 'green' }, '➜ '),
            Text({ color: 'cyan' }, '~/projects/tuiuiu '),
            Text({ color: 'blue' }, 'git:('),
            Text({ color: 'red' }, 'main'),
            Text({ color: 'blue' }, ') '),
            Text({ color: 'yellow' }, '✗ ')
          ),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'white' }, 'npm test')
          ),
          Text({}),
          Text({ color: 'gray' }, '> tuiuiu@0.1.0 test'),
          Text({ color: 'gray' }, '> vitest'),
          Text({}),
          Text({ color: 'green' }, ' ✓ tests/core/signal.test.ts (24 tests) 3ms'),
          Text({ color: 'green' }, ' ✓ tests/core/layout.test.ts (18 tests) 5ms'),
          Text({ color: 'green' }, ' ✓ tests/hooks/hooks.test.ts (12 tests) 4ms'),
          Text({}),
          Text({ color: 'green', bold: true }, ' Test Files  3 passed (3)'),
          Text({ color: 'green', bold: true }, '      Tests  54 passed (54)'),
          Spacer({}),
          Box(
            { flexDirection: 'row' },
            Text({ color: 'green' }, '➜ '),
            Text({ color: 'cyan' }, '~/projects/tuiuiu '),
            Text({ color: 'white' }, '▋')
          )
        )
      )
    ),

  story('Shell - File Manager')
    .category('Apps')
    .description('Dual-pane file manager layout')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 80,
          height: 20,
        },
        // Menu bar
        Box(
          { flexDirection: 'row', backgroundColor: 'cyan', paddingX: 1 },
          Text({ color: 'white' }, 'File'),
          Text({ color: 'white' }, '  Edit'),
          Text({ color: 'white' }, '  View'),
          Text({ color: 'white' }, '  Go'),
          Text({ color: 'white' }, '  Help'),
          Spacer({})
        ),
        // Dual pane
        Box(
          { flexDirection: 'row', flexGrow: 1 },
          // Left pane
          Box(
            {
              width: 40,
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'cyan',
            },
            Box(
              { paddingX: 1, backgroundColor: 'blue' },
              Text({ color: 'white' }, '~/Documents')
            ),
            Box(
              { flexDirection: 'column', padding: 1, flexGrow: 1 },
              Text({ color: 'yellow' }, '..            <DIR>'),
              Text({ color: 'yellow' }, 'projects      <DIR>'),
              Text({ inverse: true }, 'notes.txt      4.2K'),
              Text({}, 'budget.xlsx   12.8K'),
              Text({}, 'resume.pdf    89.3K'),
              Spacer({})
            ),
            Box(
              { paddingX: 1, backgroundColor: 'gray' },
              Text({ color: 'white' }, '5 files, 106.3K')
            )
          ),
          // Right pane
          Box(
            {
              width: 40,
              flexDirection: 'column',
              borderStyle: 'single',
              borderColor: 'gray',
            },
            Box(
              { paddingX: 1, backgroundColor: 'gray' },
              Text({ color: 'white' }, '~/Downloads')
            ),
            Box(
              { flexDirection: 'column', padding: 1, flexGrow: 1 },
              Text({ color: 'yellow' }, '..            <DIR>'),
              Text({}, 'image.png    256.4K'),
              Text({}, 'setup.exe      1.2M'),
              Text({}, 'data.json     34.1K'),
              Spacer({})
            ),
            Box(
              { paddingX: 1, backgroundColor: 'gray' },
              Text({ color: 'white' }, '3 files, 1.5M')
            )
          )
        ),
        // Function key bar
        Box(
          { flexDirection: 'row', backgroundColor: 'blue' },
          Text({ color: 'black', backgroundColor: 'cyan' }, ' 1'),
          Text({ color: 'white' }, 'Help '),
          Text({ color: 'black', backgroundColor: 'cyan' }, '2'),
          Text({ color: 'white' }, 'Menu '),
          Text({ color: 'black', backgroundColor: 'cyan' }, '3'),
          Text({ color: 'white' }, 'View '),
          Text({ color: 'black', backgroundColor: 'cyan' }, '4'),
          Text({ color: 'white' }, 'Edit '),
          Text({ color: 'black', backgroundColor: 'cyan' }, '5'),
          Text({ color: 'white' }, 'Copy '),
          Text({ color: 'black', backgroundColor: 'cyan' }, '6'),
          Text({ color: 'white' }, 'Move '),
          Text({ color: 'black', backgroundColor: 'cyan' }, '7'),
          Text({ color: 'white' }, 'Mkdir'),
          Text({ color: 'black', backgroundColor: 'cyan' }, '8'),
          Text({ color: 'white' }, 'Del '),
          Text({ color: 'black', backgroundColor: 'cyan' }, '10'),
          Text({ color: 'white' }, 'Quit')
        )
      )
    ),

  story('Shell - Chat App')
    .category('Apps')
    .description('Chat application layout')
    .render(() =>
      Box(
        {
          flexDirection: 'column',
          width: 70,
          height: 20,
          borderStyle: 'round',
          borderColor: 'cyan',
        },
        // Header
        Box(
          { flexDirection: 'row', paddingX: 2, paddingY: 1, borderStyle: 'single', borderColor: 'gray' },
          Text({ color: 'green' }, '● '),
          Text({ color: 'white', bold: true }, 'Alice'),
          Text({ color: 'gray', dim: true }, '  Online'),
          Spacer({}),
          Text({ color: 'gray' }, '📞  📹  ⋮')
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
                borderColor: 'gray',
                paddingX: 1,
                alignSelf: 'flex-start',
              },
              Text({}, 'Hey! How is the TUI coming along?')
            ),
            Text({ color: 'gray', dim: true }, '10:30 AM')
          ),
          // Sent message
          Box(
            { flexDirection: 'column', alignItems: 'flex-end', marginBottom: 1 },
            Box(
              {
                borderStyle: 'round',
                borderColor: 'cyan',
                backgroundColor: 'cyan',
                paddingX: 1,
              },
              Text({ color: 'white' }, "It's going great! Almost done 🎉")
            ),
            Text({ color: 'gray', dim: true }, '10:32 AM ✓✓')
          ),
          // Received
          Box(
            { flexDirection: 'column' },
            Box(
              {
                borderStyle: 'round',
                borderColor: 'gray',
                paddingX: 1,
                alignSelf: 'flex-start',
              },
              Text({}, "Awesome! Can't wait to try it!")
            ),
            Text({ color: 'gray', dim: true }, '10:33 AM')
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
            borderColor: 'gray',
            gap: 1,
          },
          Text({ color: 'gray' }, '📎'),
          Box(
            { flexGrow: 1, borderStyle: 'single', borderColor: 'gray', paddingX: 1 },
            Text({ color: 'gray', dim: true }, 'Type a message...')
          ),
          Text({ color: 'gray' }, '😊'),
          Text({ color: 'cyan' }, '➤')
        )
      )
    ),
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
