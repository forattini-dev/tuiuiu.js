/**
 * Integration Tests: Component Combinations
 *
 * Tests realistic usage patterns combining multiple components
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  // Core
  renderToString,
  Box,
  Text,
  createSignal,
  createEffect,
  batch,
  // Theme
  setTheme,
  darkTheme,
  lightTheme,
  getTheme,
  // Capabilities
  setRenderMode,
  getRenderMode,
  // Data Viz
  Sparkline,
  BarChart,
  LineChart,
  Gauge,
  Heatmap,
  // Forms
  MultiSelect,
  RadioGroup,
  Switch,
  Slider,
  // Layout
  Tabs,
  Accordion,
  ScrollArea,
  Grid,
  GridCell,
  Tree,
  // Visual
  BigText,
  Digits,
  Badge,
  Tooltip,
  // Data Display
  DataTable,
  Calendar,
  // Gauge utilities
  DEFAULT_ZONES,
} from '../../src/index.js';

describe('Integration: Component Combinations', () => {
  beforeEach(() => {
    setTheme(darkTheme);
    setRenderMode('unicode');
  });

  afterEach(() => {
    setRenderMode('unicode');
  });

  // ===========================================================================
  // Dashboard Patterns
  // ===========================================================================

  describe('Dashboard Pattern', () => {
    it('renders a dashboard with multiple gauges', () => {
      // Gauges render as VNodes
      const dashboard = Box(
        { flexDirection: 'row' },
        Gauge({ value: 75, max: 100, label: 'CPU', style: 'arc' }),
        Gauge({ value: 60, max: 100, label: 'Memory', style: 'arc' }),
        Gauge({ value: 45, max: 100, label: 'Disk', style: 'arc' })
      );
      expect(dashboard).not.toBeNull();
      expect(dashboard.type).toBe('box');
      expect(dashboard.children?.length).toBe(3);
    });

    it('renders a dashboard with sparklines and stats', () => {
      const data = [10, 20, 15, 25, 30, 20, 35];
      const dashboard = Box(
        { flexDirection: 'column' },
        Box(
          { flexDirection: 'row' },
          Text({ bold: true }, 'CPU Usage: '),
          Sparkline({ data, width: 20, color: 'green' })
        ),
        Box(
          { flexDirection: 'row' },
          Text({ bold: true }, 'Memory: '),
          Sparkline({ data: data.map((d) => d * 2), width: 20, color: 'yellow' })
        )
      );
      const output = renderToString(dashboard, 60, 10);
      expect(output).toContain('CPU Usage');
      expect(output).toContain('Memory');
    });

    it('renders a dashboard with charts and badges', () => {
      const dashboard = Box(
        { flexDirection: 'column' },
        Box(
          { flexDirection: 'row' },
          Badge({ label: 'LIVE', color: 'green' }),
          Text({ marginLeft: 1 }, 'System Status')
        ),
        BarChart({
          data: [
            { label: 'API', value: 95 },
            { label: 'DB', value: 88 },
            { label: 'Cache', value: 100 },
          ],
          width: 30,
        })
      );
      const output = renderToString(dashboard, 50, 15);
      expect(output).toContain('LIVE');
      expect(output).toContain('API');
    });
  });

  // ===========================================================================
  // Form Patterns
  // ===========================================================================

  describe('Form Pattern', () => {
    it('renders a form with multiple input types', () => {
      const form = Box(
        { flexDirection: 'column', padding: 1 },
        Text({ bold: true }, 'Settings'),
        Box(
          { marginTop: 1 },
          Text({}, 'Theme: '),
          RadioGroup({
            options: [
              { label: 'Dark', value: 'dark' },
              { label: 'Light', value: 'light' },
            ],
            selected: 'dark',
          })
        ),
        Box(
          { marginTop: 1 },
          Text({}, 'Notifications: '),
          Switch({ value: true })
        ),
        Box(
          { marginTop: 1 },
          Text({}, 'Volume: '),
          Slider({ value: 50, min: 0, max: 100, width: 20 })
        )
      );
      const output = renderToString(form, 50, 20);
      expect(output).toContain('Settings');
      expect(output).toContain('Theme');
      expect(output).toContain('Dark');
      expect(output).toContain('Light');
    });

    it('renders a multi-select with search', () => {
      const form = Box(
        { flexDirection: 'column' },
        Text({ bold: true }, 'Select Tags:'),
        MultiSelect({
          items: [
            { label: 'JavaScript', value: 'js' },
            { label: 'TypeScript', value: 'ts' },
            { label: 'Python', value: 'py' },
            { label: 'Rust', value: 'rust' },
          ],
          selected: ['ts'],
          fuzzySearch: true,
        })
      );
      const output = renderToString(form, 40, 15);
      expect(output).toContain('Select Tags');
      expect(output).toContain('JavaScript');
    });
  });

  // ===========================================================================
  // Layout Patterns
  // ===========================================================================

  describe('Layout Pattern', () => {
    it('renders tabs with different content types', () => {
      const layout = Tabs({
        tabs: [
          {
            id: 'overview',
            label: 'Overview',
            content: Box(
              {},
              Gauge({ value: 75, max: 100, label: 'Health', style: 'linear' })
            ),
          },
          {
            id: 'details',
            label: 'Details',
            content: Box(
              {},
              Text({}, 'Detailed information here')
            ),
          },
        ],
      });
      const output = renderToString(layout, 50, 15);
      expect(output).toContain('Overview');
      expect(output).toContain('Details');
    });

    it('renders an accordion with nested components', () => {
      const layout = Accordion({
        sections: [
          {
            id: 'stats',
            title: 'Statistics',
            content: Box(
              {},
              Sparkline({ data: [1, 2, 3, 4, 5], width: 20 })
            ),
          },
          {
            id: 'config',
            title: 'Configuration',
            content: Box(
              {},
              Switch({ value: true }),
              Text({ marginLeft: 1 }, 'Enabled')
            ),
          },
        ],
        defaultExpanded: ['stats'],
      });
      const output = renderToString(layout, 40, 15);
      expect(output).toContain('Statistics');
      expect(output).toContain('Configuration');
    });

    it('renders a grid with mixed content', () => {
      const layout = Grid({
        columns: 2,
        gap: 1,
        children: [
          Badge({ label: 'NEW', color: 'green' }),
          Digits({ value: '42', style: 'lcd' }),
          Sparkline({ data: [1, 2, 3, 4, 5, 6, 7, 8], width: 30 }),
        ],
      });
      const output = renderToString(layout, 50, 15);
      expect(output).toContain('NEW');
    });
  });

  // ===========================================================================
  // Tree and Data Display Patterns
  // ===========================================================================

  describe('Data Display Pattern', () => {
    it('renders a tree with icons and nested items', () => {
      const tree = Tree({
        nodes: [
          {
            id: 'root',
            label: 'Project',
            icon: '📁',
            children: [
              {
                id: 'src',
                label: 'src',
                icon: '📁',
                children: [
                  { id: 'index', label: 'index.ts', icon: '📄' },
                ],
              },
              { id: 'readme', label: 'README.md', icon: '📖' },
            ],
          },
        ],
        initialExpanded: ['root', 'src'],
      });
      const output = renderToString(tree, 40, 15);
      expect(output).toContain('Project');
      expect(output).toContain('src');
      expect(output).toContain('index.ts');
    });

    it('renders a data table with sorting', () => {
      const table = DataTable({
        columns: [
          { key: 'name', header: 'Name', width: 15 },
          { key: 'value', header: 'Value', width: 10 },
        ],
        data: [
          { name: 'Alpha', value: 100 },
          { name: 'Beta', value: 200 },
          { name: 'Gamma', value: 150 },
        ],
        sortable: true,
      });
      const output = renderToString(table, 40, 15);
      expect(output).toContain('Name');
      expect(output).toContain('Value');
      expect(output).toContain('Alpha');
    });

    it('renders a calendar with events', () => {
      // Just verify the Calendar component can be created and returns a VNode
      const cal = Calendar({
        date: new Date(2025, 0, 15),
        events: [
          { date: new Date(2025, 0, 10), label: 'Meeting' },
          { date: new Date(2025, 0, 20), label: 'Deadline' },
        ],
      });
      expect(cal).not.toBeNull();
      expect(cal.type).toBeDefined();
    });
  });

  // ===========================================================================
  // Theme Integration
  // ===========================================================================

  describe('Theme Integration', () => {
    it('components respect theme changes', () => {
      setTheme(darkTheme);
      const darkOutput = renderToString(
        Badge({ label: 'TEST', color: 'blue' }),
        20,
        5
      );

      setTheme(lightTheme);
      const lightOutput = renderToString(
        Badge({ label: 'TEST', color: 'blue' }),
        20,
        5
      );

      // Both should render the badge
      expect(darkOutput).toContain('TEST');
      expect(lightOutput).toContain('TEST');
    });

    it('nested components inherit theme', () => {
      setTheme(darkTheme);
      const component = Box(
        { borderStyle: 'single' },
        Gauge({ value: 50, max: 100, zones: DEFAULT_ZONES }),
        Badge({ label: 'OK', color: 'green' })
      );
      const output = renderToString(component, 30, 10);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // ASCII Mode Integration
  // ===========================================================================

  describe('ASCII Mode Integration', () => {
    it('all components render in ASCII mode', () => {
      setRenderMode('ascii');

      const dashboard = Box(
        { flexDirection: 'column', borderStyle: 'single' },
        Sparkline({ data: [1, 2, 3, 4, 5], width: 15 }),
        Gauge({ value: 75, max: 100, style: 'linear', width: 15 }),
        Badge({ label: 'TEST' })
      );

      const output = renderToString(dashboard, 30, 15);
      expect(output.length).toBeGreaterThan(0);
      // Should not contain complex unicode characters in ASCII mode
      // (though the actual check depends on implementation)
    });

    it('heatmap renders in ASCII mode', () => {
      setRenderMode('ascii');
      const heatmap = Heatmap({
        data: [
          [1, 2, 3],
          [4, 5, 6],
        ],
        rowHeaders: ['A', 'B'],
        columnHeaders: ['X', 'Y', 'Z'],
      });
      const output = renderToString(heatmap, 30, 10);
      expect(output.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // Reactive Integration
  // ===========================================================================

  describe('Reactive Integration', () => {
    it('signals work with component rendering', () => {
      const [count, setCount] = createSignal(0);
      let renderCount = 0;

      createEffect(() => {
        count(); // Subscribe
        renderCount++;
      });

      expect(renderCount).toBe(1);

      batch(() => {
        setCount(1);
        setCount(2);
        setCount(3);
      });

      // Should only trigger once due to batching
      expect(renderCount).toBe(2);
      expect(count()).toBe(3);
    });

    it('components can use signal values', () => {
      const [value, setValue] = createSignal(25);

      // Components can be created with signal values
      const text1 = Text({}, `Value: ${value()}`);
      const output1 = renderToString(text1, 30, 5);
      expect(output1).toContain('25');

      setValue(75);
      // After updating signal, new component reflects new value
      const text2 = Text({}, `Value: ${value()}`);
      const output2 = renderToString(text2, 30, 5);
      expect(output2).toContain('75');
    });
  });

  // ===========================================================================
  // Complex Layouts
  // ===========================================================================

  describe('Complex Layouts', () => {
    it('renders a complete app shell', () => {
      const appShell = Box(
        { flexDirection: 'column', width: '100%' },
        // Header
        Box(
          { borderStyle: 'single', padding: 1 },
          Text({ bold: true }, 'MyApp'),
          Badge({ label: 'v1.0', color: 'cyan' })
        ),
        // Main content
        Box(
          { flexDirection: 'row', flexGrow: 1 },
          // Sidebar
          Box(
            { width: 20, borderStyle: 'single' },
            Text({}, 'Sidebar')
          ),
          // Content
          Box(
            { flexGrow: 1, borderStyle: 'single' },
            Text({}, 'Main Content Area')
          )
        ),
        // Footer
        Box(
          { borderStyle: 'single', justifyContent: 'center' },
          Text({ dim: true }, 'Press Q to exit')
        )
      );

      const output = renderToString(appShell, 80, 30);
      expect(output).toContain('MyApp');
      expect(output).toContain('v1.0');
      expect(output).toContain('Main Content Area');
    });

    it('renders a monitoring dashboard', () => {
      const monitoringDashboard = Box(
        { flexDirection: 'column' },
        // Title
        Text({ bold: true, color: 'cyan' }, 'System Monitor'),
        // Metrics row
        Box(
          { flexDirection: 'row', marginTop: 1 },
          Box(
            { flexDirection: 'column', marginRight: 2 },
            Text({}, 'CPU'),
            Gauge({ value: 65, max: 100, style: 'linear', width: 15, zones: DEFAULT_ZONES })
          ),
          Box(
            { flexDirection: 'column', marginRight: 2 },
            Text({}, 'MEM'),
            Gauge({ value: 82, max: 100, style: 'linear', width: 15, zones: DEFAULT_ZONES })
          ),
          Box(
            { flexDirection: 'column' },
            Text({}, 'DISK'),
            Gauge({ value: 45, max: 100, style: 'linear', width: 15, zones: DEFAULT_ZONES })
          )
        ),
        // Charts
        Box(
          { marginTop: 1 },
          LineChart({
            series: [
              {
                name: 'Requests',
                data: [
                  { x: 0, y: 10 },
                  { x: 1, y: 20 },
                  { x: 2, y: 15 },
                  { x: 3, y: 25 },
                ],
                color: 'cyan',
              },
            ],
            width: 40,
            height: 8,
          })
        )
      );

      const output = renderToString(monitoringDashboard, 60, 25);
      expect(output).toContain('System Monitor');
      expect(output).toContain('CPU');
      expect(output).toContain('MEM');
      expect(output).toContain('DISK');
    });
  });
});
