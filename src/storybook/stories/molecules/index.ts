/**
 * Molecules Stories
 *
 * Molecules combine atoms into functional units: inputs, navigation, data display,
 * and structured UI patterns.
 */

import { Box, Text } from '../../../primitives/nodes.js';
import { TextInput } from '../../../atoms/index.js';
import {
  Select,
  Confirm,
  Checkbox,
  MultiSelect,
  RadioGroup,
  InlineRadio,
  Autocomplete,
  AutocompleteInput,
  AutocompleteSuggestions,
  createAutocomplete,
  Combobox,
  TagInput,
  SearchInput,
  PasswordInput,
  NumberInput,
  ConfirmButton,
  Table,
  SimpleTable,
  KeyValueTable,
  Tabs,
  TabPanel,
  VerticalTabs,
  LazyTabs,
  Tree,
  DirectoryTree,
  Calendar,
  MiniCalendar,
  DatePicker,
  CodeBlock,
  InlineCode,
  Markdown,
  Collapsible,
  Accordion,
  Details,
  ExpandableText,
  FormField,
  FormGroup,
  SplitView,
  SplashScreen,
  TuiuiuSplash,
  ImpactSplashScreen,
  MinimalSplash,
  ProgressSplash,
  parseColoredBBCode,
  Sparkline,
  BarChart,
  VerticalBarChart,
  StackedBarChart,
  LineChart,
  AreaChart,
  Gauge,
  LinearGauge,
  MeterGauge,
  ArcGauge,
  DialGauge,
  BatteryGauge,
  Heatmap,
  ContributionGraph,
  CalendarHeatmap,
  CorrelationMatrix,
  Legend,
  ScatterPlot,
  RadarChart,
  GanttChart,
  TimeHeatmap,
} from '../../../molecules/index.js';
import type { AutocompleteItem, TreeNode, DirectoryNode } from '../../../molecules/index.js';
import { story, defaultControls } from '../../core/registry.js';
import type { Story } from '../../types.js';

const selectItems = [
  { label: 'Alpha', value: 'alpha' },
  { label: 'Beta', value: 'beta' },
  { label: 'Gamma', value: 'gamma' },
  { label: 'Delta', value: 'delta', disabled: true },
];

const radioOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const autocompleteItems: AutocompleteItem<string>[] = [
  { value: 'node', label: 'Node.js', description: 'Runtime' },
  { value: 'deno', label: 'Deno', description: 'Runtime' },
  { value: 'bun', label: 'Bun', description: 'Runtime' },
  { value: 'react', label: 'React', description: 'UI library' },
  { value: 'vue', label: 'Vue', description: 'UI framework' },
  { value: 'solid', label: 'Solid', description: 'UI library' },
];

const tableRows = [
  { name: 'Ada Lovelace', role: 'Engineer', score: 92 },
  { name: 'Alan Turing', role: 'Research', score: 88 },
  { name: 'Grace Hopper', role: 'Lead', score: 96 },
  { name: 'Barbara Liskov', role: 'Architect', score: 90 },
];

const treeNodes: TreeNode[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    children: [
      { id: 'apps', label: 'apps', children: [{ id: 'web', label: 'web' }] },
      { id: 'packages', label: 'packages', children: [{ id: 'ui', label: 'ui' }] },
      { id: 'docs', label: 'docs' },
    ],
  },
];

const directoryNodes: DirectoryNode[] = [
  {
    id: 'src',
    label: 'src',
    data: { type: 'directory' },
    children: [
      { id: 'index.ts', label: 'index.ts', data: { type: 'file', size: 1200 } },
      { id: 'app.ts', label: 'app.ts', data: { type: 'file', size: 2400 } },
      {
        id: 'components',
        label: 'components',
        data: { type: 'directory' },
        children: [
          { id: 'button.ts', label: 'button.ts', data: { type: 'file', size: 600 } },
        ],
      },
    ],
  },
  { id: 'README.md', label: 'README.md', data: { type: 'file', size: 2048 } },
];

const calendarEvents = [
  { date: '2024-02-10', label: 'Launch', color: 'success' },
  { date: '2024-02-14', label: 'Review', color: 'warning' },
  { date: '2024-02-21', label: 'Demo', color: 'info' },
];

const codeSample = [
  "export function greet(name: string) {",
  "  return `Hello, ${name}!`;",
  "}",
].join('\n');

const markdownSample = [
  '# Release Notes',
  '',
  '- Added new input components',
  '- Improved navigation performance',
  '- Fixed tab focus handling',
  '',
  '```ts',
  'export const version = "1.2.0";',
  '```',
].join('\n');

const splitViewItems = [
  { id: 'req-1', name: 'Login API', status: '200 OK' },
  { id: 'req-2', name: 'Users API', status: '502 Bad Gateway' },
  { id: 'req-3', name: 'Analytics API', status: '204 No Content' },
];

const sparklineData = [3, 6, 4, 8, 7, 9, 6, 10, 8, 12];

const barData = [
  { label: 'Alpha', value: 30 },
  { label: 'Beta', value: 45 },
  { label: 'Gamma', value: 22 },
  { label: 'Delta', value: 55 },
];

const stackedData = [
  {
    label: 'Q1',
    segments: [
      { value: 30, color: 'primary', label: 'Core' },
      { value: 20, color: 'success', label: 'Add-ons' },
      { value: 10, color: 'warning', label: 'Services' },
    ],
  },
  {
    label: 'Q2',
    segments: [
      { value: 35, color: 'primary', label: 'Core' },
      { value: 25, color: 'success', label: 'Add-ons' },
      { value: 15, color: 'warning', label: 'Services' },
    ],
  },
];

const lineSeries = [
  { name: 'Visits', data: [5, 8, 6, 12, 10, 14, 11], color: 'primary' },
  { name: 'Signups', data: [2, 3, 4, 6, 5, 7, 6], color: 'success' },
];

const scatterPoints = [
  { x: 1, y: 2, category: 'A' },
  { x: 2, y: 3, category: 'A' },
  { x: 3, y: 4, category: 'B' },
  { x: 4, y: 3, category: 'B' },
  { x: 5, y: 5, category: 'C' },
];

const radarAxes = [
  { name: 'Speed', max: 100 },
  { name: 'Quality', max: 100 },
  { name: 'Cost', max: 100 },
  { name: 'Reliability', max: 100 },
];

const radarSeries = [
  { name: 'Plan A', values: [80, 70, 60, 75], color: 'primary' },
  { name: 'Plan B', values: [65, 85, 70, 80], color: 'success' },
];

const heatmapData = [
  [1, 2, 3, 4],
  [2, 3, 4, 5],
  [3, 4, 2, 1],
];

const contributionData = [
  { date: '2024-02-01', count: 2 },
  { date: '2024-02-02', count: 5 },
  { date: '2024-02-05', count: 8 },
  { date: '2024-02-08', count: 3 },
  { date: '2024-02-12', count: 6 },
  { date: '2024-02-15', count: 9 },
];

const correlationLabels = ['CPU', 'RAM', 'IO'];
const correlationMatrix = [
  [1, 0.6, -0.2],
  [0.6, 1, 0.1],
  [-0.2, 0.1, 1],
];

const ganttTasks = [
  { id: '1', name: 'Design', startDate: '2024-01-01', endDate: '2024-01-12', progress: 100, status: 'complete' },
  { id: '2', name: 'Build', startDate: '2024-01-13', endDate: '2024-01-28', progress: 70, status: 'in-progress' },
  { id: '3', name: 'QA', startDate: '2024-01-29', endDate: '2024-02-05', progress: 20, status: 'pending' },
];

const timeHeatmapData = [
  { date: '2024-02-01', value: 2 },
  { date: '2024-02-04', value: 5 },
  { date: '2024-02-07', value: 8 },
  { date: '2024-02-10', value: 3 },
  { date: '2024-02-12', value: 6 },
];

const birdArt = parseColoredBBCode(`
[cyan]..##..[/cyan]
[cyan].####.[/cyan]
[cyan]..##..[/cyan]
`);

// ============================================================================
// Composite Inputs
// ============================================================================

export const compositeInputStories: Story[] = [
  story('SearchInput - Basic')
    .category('Molecules')
    .description('Search input with icons')
    .controls({
      value: defaultControls.text('Value', ''),
      placeholder: defaultControls.text('Placeholder', 'Search...'),
      showSearchIcon: defaultControls.boolean('Show Icon', true),
      showClearButton: defaultControls.boolean('Show Clear', true),
      width: defaultControls.range('Width', 30, 15, 60),
      borderStyle: defaultControls.select('Border', ['none', 'single', 'round', 'double'], 'round'),
    })
    .render((props) => {
      const isActive = props.__storybookActive ?? true;
      return SearchInput({
        value: props.value,
        placeholder: props.placeholder,
        showSearchIcon: props.showSearchIcon,
        showClearButton: props.showClearButton,
        width: props.width,
        borderStyle: props.borderStyle,
        isActive,
        inputOptions: { isActive },
        onChange: () => {},
        onSubmit: () => {},
        onClear: () => {},
      });
    }),

  story('PasswordInput - Basic')
    .category('Molecules')
    .description('Password input with toggle')
    .controls({
      value: defaultControls.text('Value', ''),
      placeholder: defaultControls.text('Placeholder', 'Password'),
      showToggle: defaultControls.boolean('Show Toggle', true),
      width: defaultControls.range('Width', 30, 15, 60),
      borderStyle: defaultControls.select('Border', ['none', 'single', 'round', 'double'], 'round'),
    })
    .render((props) => {
      const isActive = props.__storybookActive ?? true;
      return PasswordInput({
        value: props.value,
        placeholder: props.placeholder,
        showToggle: props.showToggle,
        width: props.width,
        borderStyle: props.borderStyle,
        isActive,
        inputOptions: { isActive },
        onChange: () => {},
        onSubmit: () => {},
      });
    }),

  story('NumberInput - Basic')
    .category('Molecules')
    .description('Number input with stepper buttons')
    .controls({
      value: defaultControls.number('Value', 5),
      min: defaultControls.number('Min', 0),
      max: defaultControls.number('Max', 10),
      step: defaultControls.number('Step', 1),
      showButtons: defaultControls.boolean('Show Buttons', true),
      buttonPosition: defaultControls.select('Button Position', ['sides', 'right'], 'sides'),
      width: defaultControls.range('Width', 10, 6, 20),
      borderStyle: defaultControls.select('Border', ['none', 'single', 'round', 'double'], 'round'),
    })
    .render((props) => {
      const isActive = props.__storybookActive ?? true;
      return NumberInput({
        value: props.value,
        min: props.min,
        max: props.max,
        step: props.step,
        showButtons: props.showButtons,
        buttonPosition: props.buttonPosition,
        width: props.width,
        borderStyle: props.borderStyle,
        isActive,
        onChange: () => {},
      });
    }),

  story('ConfirmButton - Basic')
    .category('Molecules')
    .description('Two-click confirmation button')
    .controls({
      label: defaultControls.text('Label', 'Delete'),
      confirmLabel: defaultControls.text('Confirm Label', 'Are you sure?'),
      variant: defaultControls.select('Variant', ['solid', 'outline', 'ghost', 'link'], 'ghost'),
      confirmVariant: defaultControls.select('Confirm Variant', ['solid', 'outline', 'ghost', 'link'], 'solid'),
      timeout: defaultControls.number('Timeout (ms)', 3000),
      showCountdown: defaultControls.boolean('Show Countdown', true),
      disabled: defaultControls.boolean('Disabled', false),
      focused: defaultControls.boolean('Focused', false),
    })
    .render((props) =>
      ConfirmButton({
        label: props.label,
        confirmLabel: props.confirmLabel,
        variant: props.variant,
        confirmVariant: props.confirmVariant,
        timeout: props.timeout,
        showCountdown: props.showCountdown,
        disabled: props.disabled,
        focused: props.focused,
        onConfirm: () => {},
        onCancel: () => {},
      })
    ),
];

// ============================================================================
// Selection & Choice
// ============================================================================

export const selectionStories: Story[] = [
  story('Select - Basic')
    .category('Molecules')
    .description('Selectable list with search and multi-select')
    .controls({
      multiple: defaultControls.boolean('Multiple', false),
      searchable: defaultControls.boolean('Searchable', true),
      maxVisible: defaultControls.range('Max Visible', 6, 3, 10),
      showCount: defaultControls.boolean('Show Count', true),
      fullWidth: defaultControls.boolean('Full Width', false),
    })
    .render((props) =>
      Select({
        items: selectItems,
        multiple: props.multiple,
        searchable: props.searchable,
        maxVisible: props.maxVisible,
        showCount: props.showCount,
        fullWidth: props.fullWidth,
        initialValue: props.multiple ? ['alpha', 'gamma'] : 'alpha',
      })
    ),

  story('Confirm - Basic')
    .category('Molecules')
    .description('Confirm prompt based on Select')
    .controls({
      message: defaultControls.text('Message', 'Proceed with deployment?'),
      defaultValue: defaultControls.boolean('Default Value', false),
      yesLabel: defaultControls.text('Yes Label', 'Yes'),
      noLabel: defaultControls.text('No Label', 'No'),
    })
    .render((props) =>
      Confirm({
        message: props.message,
        defaultValue: props.defaultValue,
        yesLabel: props.yesLabel,
        noLabel: props.noLabel,
      })
    ),

  story('Checkbox - Basic')
    .category('Molecules')
    .description('Checkbox list for multiple selections')
    .render(() =>
      Checkbox({
        items: selectItems,
        initialValue: ['alpha', 'gamma'],
        showCount: false,
      })
    ),

  story('MultiSelect - Basic')
    .category('Molecules')
    .description('Multi-select with tags and search')
    .controls({
      searchable: defaultControls.boolean('Searchable', true),
      showTags: defaultControls.boolean('Show Tags', true),
      showCount: defaultControls.boolean('Show Count', true),
      maxVisible: defaultControls.range('Max Visible', 6, 3, 12),
    })
    .render((props) =>
      MultiSelect({
        items: selectItems,
        initialValue: ['alpha', 'gamma'],
        searchable: props.searchable,
        showTags: props.showTags,
        showCount: props.showCount,
        maxVisible: props.maxVisible,
      })
    ),

  story('RadioGroup - Basic')
    .category('Molecules')
    .description('Radio group with direction control')
    .controls({
      direction: defaultControls.select('Direction', ['vertical', 'horizontal'], 'vertical'),
      gap: defaultControls.range('Gap', 1, 0, 3),
    })
    .render((props) =>
      RadioGroup({
        options: radioOptions,
        initialValue: 'weekly',
        direction: props.direction,
        gap: props.gap,
      })
    ),

  story('InlineRadio - Basic')
    .category('Molecules')
    .description('Inline radio display')
    .controls({
      selected: defaultControls.boolean('Selected', true),
      disabled: defaultControls.boolean('Disabled', false),
    })
    .render((props) =>
      InlineRadio({
        label: 'Option',
        selected: props.selected,
        disabled: props.disabled,
      })
    ),
];

// ============================================================================
// Autocomplete
// ============================================================================

export const autocompleteStories: Story[] = [
  story('Autocomplete - Basic')
    .category('Molecules')
    .description('Type-ahead input with suggestions')
    .controls({
      placeholder: defaultControls.text('Placeholder', 'Search frameworks...'),
      minChars: defaultControls.range('Min Chars', 1, 1, 3),
      maxSuggestions: defaultControls.range('Max Suggestions', 5, 3, 8),
      allowFreeText: defaultControls.boolean('Allow Free Text', true),
      dropdownPosition: defaultControls.select('Dropdown Position', ['bottom', 'top', 'left', 'right'], 'bottom'),
      width: defaultControls.range('Width', 32, 20, 60),
    })
    .render((props) =>
      Autocomplete({
        items: autocompleteItems,
        placeholder: props.placeholder,
        minChars: props.minChars,
        maxSuggestions: props.maxSuggestions,
        allowFreeText: props.allowFreeText,
        dropdownPosition: props.dropdownPosition,
        width: props.width,
      })
    ),

  story('AutocompleteInput + Suggestions')
    .category('Molecules')
    .description('Input and suggestion list as separate components')
    .controls({
      value: defaultControls.text('Value', 're'),
      placeholder: defaultControls.text('Placeholder', 'Type...'),
      maxSuggestions: defaultControls.range('Max Suggestions', 5, 3, 8),
      width: defaultControls.range('Width', 32, 20, 60),
    })
    .render((props) => {
      const state = createAutocomplete({
        items: autocompleteItems,
        initialValue: props.value,
        maxSuggestions: props.maxSuggestions,
      });
      state.setInput(props.value);

      return Box(
        { flexDirection: 'column', gap: 1 },
        AutocompleteInput({
          state,
          placeholder: props.placeholder,
          width: props.width,
        }),
        AutocompleteSuggestions({
          state,
          width: props.width,
        })
      );
    }),

  story('Combobox - Basic')
    .category('Molecules')
    .description('Autocomplete requiring selection')
    .controls({
      placeholder: defaultControls.text('Placeholder', 'Pick a runtime...'),
      width: defaultControls.range('Width', 32, 20, 60),
    })
    .render((props) =>
      Combobox({
        items: autocompleteItems,
        placeholder: props.placeholder,
        width: props.width,
      })
    ),

  story('TagInput - Basic')
    .category('Molecules')
    .description('Tag input with autocomplete suggestions')
    .controls({
      maxTags: defaultControls.range('Max Tags', 5, 2, 10),
      width: defaultControls.range('Width', 40, 20, 60),
      fullWidth: defaultControls.boolean('Full Width', false),
    })
    .render((props) =>
      TagInput({
        items: autocompleteItems,
        placeholder: 'Add tags...',
        maxTags: props.maxTags,
        width: props.width,
        fullWidth: props.fullWidth,
      })
    ),
];

// ============================================================================
// Tables
// ============================================================================

export const tableStories: Story[] = [
  story('Table - Basic')
    .category('Molecules')
    .description('Table with columns and formatting')
    .controls({
      borderStyle: defaultControls.select('Border', ['single', 'double', 'round', 'bold', 'ascii', 'none'], 'single'),
      striped: defaultControls.boolean('Striped', false),
      rowSeparator: defaultControls.boolean('Row Separator', false),
      compact: defaultControls.boolean('Compact', false),
    })
    .render((props) =>
      Table({
        columns: [
          { key: 'name', header: 'Name' },
          { key: 'role', header: 'Role' },
          { key: 'score', header: 'Score', align: 'right' },
        ],
        data: tableRows,
        borderStyle: props.borderStyle,
        striped: props.striped,
        rowSeparator: props.rowSeparator,
        compact: props.compact,
      })
    ),

  story('SimpleTable - Basic')
    .category('Molecules')
    .description('Simple table from rows array')
    .render(() =>
      SimpleTable({
        headers: ['Service', 'Status', 'Latency'],
        rows: [
          ['Auth', 'OK', '120ms'],
          ['Payments', 'WARN', '420ms'],
          ['Search', 'OK', '85ms'],
        ],
        borderStyle: 'round',
        align: ['left', 'center', 'right'],
      })
    ),

  story('KeyValueTable - Basic')
    .category('Molecules')
    .description('Key-value table for metadata')
    .render(() =>
      KeyValueTable({
        entries: {
          version: '1.2.0',
          uptime: '3h 24m',
          region: 'us-east-1',
        },
        borderStyle: 'single',
      })
    ),
];

// ============================================================================
// Tabs
// ============================================================================

export const tabsStories: Story[] = [
  story('Tabs - Basic')
    .category('Molecules')
    .description('Tabbed content switcher')
    .controls({
      style: defaultControls.select('Style', ['line', 'box', 'pills'], 'line'),
      position: defaultControls.select('Position', ['top', 'bottom'], 'top'),
      variant: defaultControls.select('Variant', ['default', 'primary', 'secondary'], 'default'),
      showCount: defaultControls.boolean('Show Count', false),
    })
    .render((props) =>
      Tabs({
        tabs: [
          { key: 'overview', label: 'Overview', content: Text({}, 'Overview content') },
          { key: 'details', label: 'Details', content: Text({}, 'Details content') },
          { key: 'settings', label: 'Settings', content: Text({}, 'Settings content') },
        ],
        style: props.style,
        position: props.position,
        variant: props.variant,
        showCount: props.showCount,
        width: 50,
      })
    ),

  story('TabPanel - Basic')
    .category('Molecules')
    .description('Standalone tab panel container')
    .controls({
      active: defaultControls.boolean('Active', true),
      padding: defaultControls.range('Padding', 1, 0, 3),
    })
    .render((props) =>
      TabPanel({
        active: props.active,
        padding: props.padding,
        children: Text({ color: 'mutedForeground' }, 'Tab content panel'),
      })
    ),

  story('VerticalTabs - Basic')
    .category('Molecules')
    .description('Vertical tabs with list on the left')
    .render(() =>
      VerticalTabs({
        tabs: [
          { key: 'core', label: 'Core', content: Text({}, 'Core settings') },
          { key: 'ui', label: 'UI', content: Text({}, 'Theme options') },
          { key: 'dev', label: 'Dev', content: Text({}, 'Debug flags') },
        ],
        tabWidth: 18,
        contentWidth: 30,
      })
    ),

  story('LazyTabs - Basic')
    .category('Molecules')
    .description('Tabs that load content lazily')
    .render(() =>
      LazyTabs({
        tabs: [
          { key: 'home', label: 'Home', content: () => Text({}, 'Home loaded') },
          { key: 'logs', label: 'Logs', content: () => Text({}, 'Logs loaded') },
          { key: 'stats', label: 'Stats', content: () => Text({}, 'Stats loaded') },
        ],
        width: 50,
      })
    ),
];

// ============================================================================
// Trees & Calendars
// ============================================================================

export const treeStories: Story[] = [
  story('Tree - Basic')
    .category('Molecules')
    .description('Expandable tree view')
    .controls({
      selectionMode: defaultControls.select('Selection', ['none', 'single', 'multiple'], 'single'),
      showGuides: defaultControls.boolean('Show Guides', true),
      indentSize: defaultControls.range('Indent', 2, 2, 4),
    })
    .render((props) =>
      Tree({
        nodes: treeNodes,
        selectionMode: props.selectionMode,
        showGuides: props.showGuides,
        indentSize: props.indentSize,
        initialExpanded: ['workspace', 'apps'],
      })
    ),

  story('DirectoryTree - Basic')
    .category('Molecules')
    .description('Directory tree with file icons')
    .controls({
      showSizes: defaultControls.boolean('Show Sizes', true),
      showHidden: defaultControls.boolean('Show Hidden', false),
    })
    .render((props) =>
      DirectoryTree({
        nodes: directoryNodes,
        showSizes: props.showSizes,
        showHidden: props.showHidden,
        initialExpanded: ['src', 'components'],
      })
    ),
];

export const calendarStories: Story[] = [
  story('Calendar - Basic')
    .category('Molecules')
    .description('Month calendar with events')
    .controls({
      selectionMode: defaultControls.select('Selection', ['none', 'single', 'range', 'multiple'], 'single'),
      firstDayOfWeek: defaultControls.select('First Day', ['0', '1'], '1'),
      showWeekNumbers: defaultControls.boolean('Week Numbers', false),
    })
    .render((props) =>
      Calendar({
        events: calendarEvents,
        selectionMode: props.selectionMode,
        firstDayOfWeek: props.firstDayOfWeek === '1' ? 1 : 0,
        showWeekNumbers: props.showWeekNumbers,
      })
    ),

  story('MiniCalendar - Basic')
    .category('Molecules')
    .description('Compact calendar widget')
    .controls({
      showNavigation: defaultControls.boolean('Navigation', true),
    })
    .render((props) =>
      MiniCalendar({
        events: calendarEvents,
        showNavigation: props.showNavigation,
        cellWidth: 3,
      })
    ),

  story('DatePicker - Basic')
    .category('Molecules')
    .description('Date picker with input field')
    .controls({
      placeholder: defaultControls.text('Placeholder', 'Select date...'),
      inputWidth: defaultControls.range('Input Width', 20, 12, 30),
      dropdownPosition: defaultControls.select('Dropdown', ['below', 'above'], 'below'),
    })
    .render((props) =>
      DatePicker({
        placeholder: props.placeholder,
        inputWidth: props.inputWidth,
        dropdownPosition: props.dropdownPosition,
        selectionMode: 'single',
      })
    ),
];

// ============================================================================
// Code & Markdown
// ============================================================================

export const codeStories: Story[] = [
  story('CodeBlock - Basic')
    .category('Molecules')
    .description('Code block with syntax highlighting')
    .controls({
      language: defaultControls.select('Language', ['typescript', 'javascript', 'json', 'bash', 'plain'], 'typescript'),
      lineNumbers: defaultControls.boolean('Line Numbers', true),
      wrap: defaultControls.boolean('Wrap', false),
      maxWidth: defaultControls.range('Max Width', 50, 30, 80),
    })
    .render((props) =>
      CodeBlock({
        code: codeSample,
        language: props.language,
        lineNumbers: props.lineNumbers,
        wrap: props.wrap,
        maxWidth: props.maxWidth,
        highlightLines: [2],
      })
    ),

  story('InlineCode - Basic')
    .category('Molecules')
    .description('Inline code tag')
    .render(() =>
      Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: 'mutedForeground' }, 'Install with'),
        InlineCode({ code: 'pnpm add tuiuiu.js' })
      )
    ),

  story('Markdown - Basic')
    .category('Molecules')
    .description('Markdown renderer')
    .controls({
      maxWidth: defaultControls.range('Max Width', 60, 40, 90),
      codeLineNumbers: defaultControls.boolean('Code Line Numbers', true),
    })
    .render((props) =>
      Markdown({
        content: markdownSample,
        maxWidth: props.maxWidth,
        codeLineNumbers: props.codeLineNumbers,
      })
    ),
];

// ============================================================================
// Collapsible & Forms
// ============================================================================

export const collapsibleStories: Story[] = [
  story('Collapsible - Basic')
    .category('Molecules')
    .description('Expandable section')
    .render(() =>
      Collapsible({
        title: 'Advanced Options',
        children: Box(
          { flexDirection: 'column', gap: 1 },
          Text({}, 'Enable auto-save'),
          Text({}, 'Show notifications'),
          Text({}, 'Use experimental API')
        ),
      })
    ),

  story('Accordion - Basic')
    .category('Molecules')
    .description('Accordion list')
    .render(() =>
      Accordion({
        sections: [
          { key: 'general', title: 'General', content: Text({}, 'General settings') },
          { key: 'display', title: 'Display', content: Text({}, 'Display settings') },
          { key: 'security', title: 'Security', content: Text({}, 'Security settings') },
        ],
        initialExpanded: 'general',
      })
    ),

  story('Details - Basic')
    .category('Molecules')
    .description('Details element with summary')
    .render(() =>
      Details({
        summary: 'View details',
        children: Text({ color: 'mutedForeground' }, 'Detailed description goes here.'),
      })
    ),

  story('ExpandableText - Basic')
    .category('Molecules')
    .description('Expandable text snippet')
    .render(() =>
      ExpandableText({
        text: 'This is a long text block that collapses after a few lines. It can be expanded or collapsed as needed to save space in compact UIs.',
        maxLines: 2,
      })
    ),
];

export const formStories: Story[] = [
  story('FormField - Basic')
    .category('Molecules')
    .description('Label + input wrapper')
    .controls({
      label: defaultControls.text('Label', 'Email'),
      required: defaultControls.boolean('Required', true),
      error: defaultControls.text('Error', ''),
      helperText: defaultControls.text('Helper', 'We will never share your email'),
      direction: defaultControls.select('Direction', ['vertical', 'horizontal'], 'vertical'),
      labelWidth: defaultControls.range('Label Width', 12, 8, 20),
    })
    .render((props) =>
      FormField({
        label: props.label,
        required: props.required,
        error: props.error || undefined,
        helperText: props.helperText || undefined,
        direction: props.direction,
        labelWidth: props.labelWidth,
        children: TextInput({
          placeholder: 'name@company.com',
          width: 30,
          isActive: false,
        }),
      })
    ),

  story('FormGroup - Basic')
    .category('Molecules')
    .description('Grouped form fields')
    .controls({
      title: defaultControls.text('Title', 'Profile'),
      description: defaultControls.text('Description', 'Update personal details'),
      borderStyle: defaultControls.select('Border', ['none', 'single', 'round', 'double'], 'round'),
      padding: defaultControls.range('Padding', 1, 0, 2),
      gap: defaultControls.range('Gap', 1, 0, 2),
    })
    .render((props) =>
      FormGroup({
        title: props.title,
        description: props.description,
        borderStyle: props.borderStyle,
        padding: props.padding,
        gap: props.gap,
        children: [
          FormField({
            label: 'Name',
            children: TextInput({ placeholder: 'Jane Doe', width: 24, isActive: false }),
          }),
          FormField({
            label: 'Role',
            children: TextInput({ placeholder: 'Engineer', width: 24, isActive: false }),
          }),
        ],
      })
    ),
];

// ============================================================================
// Split View
// ============================================================================

export const splitViewStories: Story[] = [
  story('SplitView - Basic')
    .category('Molecules')
    .description('Master-detail split view')
    .controls({
      ratio: defaultControls.range('Ratio %', 35, 20, 80),
      direction: defaultControls.select('Direction', ['horizontal', 'vertical'], 'horizontal'),
      divider: defaultControls.boolean('Divider', true),
    })
    .render((props) =>
      SplitView({
        items: splitViewItems,
        ratio: props.ratio / 100,
        direction: props.direction,
        divider: props.divider,
        renderItem: (item, _index, selected) =>
          Box(
            { paddingX: 1 },
            Text({ color: selected ? 'primary' : 'foreground' }, `${item.name}`),
            Text({ color: 'mutedForeground', dim: true }, item.status)
          ),
        renderDetail: (item) =>
          item
            ? Box(
                { flexDirection: 'column', gap: 1 },
                Text({ color: 'foreground', bold: true }, item.name),
                Text({ color: 'mutedForeground' }, `Status: ${item.status}`)
              )
            : Text({ color: 'mutedForeground' }, 'Select a request')
      })
    ),
];

// ============================================================================
// Data Visualization
// ============================================================================

export const dataVizStories: Story[] = [
  story('Sparkline - Basic')
    .category('Molecules')
    .description('Inline sparkline')
    .controls({
      style: defaultControls.select('Style', ['block', 'braille', 'ascii'], 'block'),
      width: defaultControls.range('Width', 20, 10, 40),
      showLabels: defaultControls.boolean('Labels', true),
    })
    .render((props) =>
      Sparkline({
        data: sparklineData,
        style: props.style,
        width: props.width,
        showLabels: props.showLabels,
        label: 'CPU',
      })
    ),

  story('BarChart - Horizontal')
    .category('Molecules')
    .description('Horizontal bar chart')
    .controls({
      showValues: defaultControls.boolean('Show Values', true),
      showPercentage: defaultControls.boolean('Show Percentage', false),
      width: defaultControls.range('Width', 50, 30, 70),
    })
    .render((props) =>
      BarChart({
        data: barData,
        showValues: props.showValues,
        showPercentage: props.showPercentage,
        width: props.width,
      })
    ),

  story('VerticalBarChart - Basic')
    .category('Molecules')
    .description('Vertical bar chart')
    .controls({
      height: defaultControls.range('Height', 8, 5, 12),
    })
    .render((props) =>
      VerticalBarChart({
        data: barData,
        height: props.height,
      })
    ),

  story('StackedBarChart - Basic')
    .category('Molecules')
    .description('Stacked bar chart')
    .render(() =>
      StackedBarChart({
        data: stackedData,
        maxBarLength: 30,
      })
    ),

  story('LineChart - Basic')
    .category('Molecules')
    .description('Line chart with multiple series')
    .render(() =>
      LineChart({
        series: lineSeries,
        width: 50,
        height: 8,
        title: 'Weekly Traffic',
        showLegend: true,
      })
    ),

  story('AreaChart - Basic')
    .category('Molecules')
    .description('Area chart with filled series')
    .render(() =>
      AreaChart({
        series: lineSeries,
        width: 50,
        height: 8,
        title: 'Weekly Signups',
      })
    ),

  story('ScatterPlot - Basic')
    .category('Molecules')
    .description('Scatter plot with categories')
    .controls({
      markerStyle: defaultControls.select('Marker', ['circle', 'square', 'diamond', 'plus', 'star', 'cross'], 'circle'),
      colorMode: defaultControls.select('Color Mode', ['category', 'value', 'uniform'], 'category'),
    })
    .render((props) =>
      ScatterPlot({
        points: scatterPoints,
        width: 50,
        height: 10,
        markerStyle: props.markerStyle,
        colorMode: props.colorMode,
        title: 'Latency Scatter',
      })
    ),

  story('RadarChart - Basic')
    .category('Molecules')
    .description('Radar chart for multi-axis comparison')
    .render(() =>
      RadarChart({
        axes: radarAxes,
        series: radarSeries,
        size: 16,
        showLegend: true,
      })
    ),

  story('Gauge - Basic')
    .category('Molecules')
    .description('Gauge with selectable style')
    .controls({
      value: defaultControls.range('Value', 65, 0, 100),
      style: defaultControls.select('Style', ['linear', 'arc', 'meter', 'dial'], 'linear'),
      showValue: defaultControls.boolean('Show Value', true),
    })
    .render((props) =>
      Gauge({
        value: props.value,
        style: props.style,
        showValue: props.showValue,
        label: 'Usage',
      })
    ),

  story('LinearGauge - Basic')
    .category('Molecules')
    .description('Linear gauge')
    .controls({
      value: defaultControls.range('Value', 55, 0, 100),
      showMinMax: defaultControls.boolean('Min/Max', false),
    })
    .render((props) =>
      LinearGauge({
        value: props.value,
        showMinMax: props.showMinMax,
        width: 30,
      })
    ),

  story('MeterGauge - Basic')
    .category('Molecules')
    .description('Segmented meter gauge')
    .controls({
      value: defaultControls.range('Value', 72, 0, 100),
      segments: defaultControls.range('Segments', 10, 5, 20),
    })
    .render((props) =>
      MeterGauge({
        value: props.value,
        segments: props.segments,
        width: 30,
      })
    ),

  story('ArcGauge - Basic')
    .category('Molecules')
    .description('Arc gauge')
    .controls({
      value: defaultControls.range('Value', 40, 0, 100),
    })
    .render((props) =>
      ArcGauge({
        value: props.value,
        width: 20,
        showValue: true,
      })
    ),

  story('DialGauge - Basic')
    .category('Molecules')
    .description('Dial gauge')
    .controls({
      value: defaultControls.range('Value', 75, 0, 100),
    })
    .render((props) =>
      DialGauge({
        value: props.value,
        width: 20,
        showValue: true,
      })
    ),

  story('BatteryGauge - Basic')
    .category('Molecules')
    .description('Battery gauge')
    .controls({
      level: defaultControls.range('Level', 80, 0, 100),
      charging: defaultControls.boolean('Charging', false),
      showLevel: defaultControls.boolean('Show Level', true),
    })
    .render((props) =>
      BatteryGauge({
        level: props.level,
        charging: props.charging,
        showLevel: props.showLevel,
        width: 12,
      })
    ),

  story('Heatmap - Basic')
    .category('Molecules')
    .description('Heatmap grid')
    .controls({
      showValues: defaultControls.boolean('Show Values', true),
    })
    .render((props) =>
      Heatmap({
        data: heatmapData,
        columnHeaders: ['Mon', 'Tue', 'Wed', 'Thu'],
        rowHeaders: ['W1', 'W2', 'W3'],
        showValues: props.showValues,
        cellWidth: 4,
      })
    ),

  story('ContributionGraph - Basic')
    .category('Molecules')
    .description('GitHub-style contribution graph')
    .render(() =>
      ContributionGraph({
        data: contributionData,
        weeks: 6,
        showMonths: false,
        showDays: true,
      })
    ),

  story('CalendarHeatmap - Basic')
    .category('Molecules')
    .description('Year calendar heatmap')
    .render(() =>
      CalendarHeatmap({
        data: contributionData,
        year: 2024,
        showLegend: false,
      })
    ),

  story('CorrelationMatrix - Basic')
    .category('Molecules')
    .description('Correlation matrix heatmap')
    .render(() =>
      CorrelationMatrix({
        labels: correlationLabels,
        correlations: correlationMatrix,
        showValues: true,
        decimals: 2,
      })
    ),

  story('GanttChart - Basic')
    .category('Molecules')
    .description('Gantt chart timeline')
    .render(() =>
      GanttChart({
        tasks: ganttTasks,
        width: 60,
        title: 'Release Plan',
        showLegend: true,
      })
    ),

  story('TimeHeatmap - Basic')
    .category('Molecules')
    .description('Time heatmap')
    .render(() =>
      TimeHeatmap({
        data: timeHeatmapData,
        granularity: 'day',
        showLegend: true,
        title: 'Activity',
      })
    ),

  story('Legend - Basic')
    .category('Molecules')
    .description('Legend component')
    .render(() =>
      Legend({
        items: [
          { label: 'Success', color: 'success' },
          { label: 'Warning', color: 'warning' },
          { label: 'Error', color: 'destructive' },
        ],
        position: 'bottom',
        showSymbols: true,
      })
    ),
];

// ============================================================================
// Splash Screens
// ============================================================================

export const splashStories: Story[] = [
  story('SplashScreen - Basic')
    .category('Molecules')
    .description('Configurable splash screen')
    .controls({
      title: defaultControls.text('Title', 'TUIUIU'),
      subtitle: defaultControls.text('Subtitle', 'Initializing workspace'),
      loadingType: defaultControls.select('Loading', ['spinner', 'progress', 'dots', 'none'], 'none'),
      font: defaultControls.select('Font', ['block', 'slant', 'small', 'standard', 'banner', 'mini', 'shadow', 'doom', 'graffiti'], 'block'),
    })
    .render((props) =>
      SplashScreen({
        title: props.title,
        subtitle: props.subtitle,
        loadingType: props.loadingType,
        font: props.font,
        duration: 0,
      })
    ),

  story('TuiuiuSplash - Preset')
    .category('Molecules')
    .description('Branded splash preset')
    .render(() =>
      TuiuiuSplash({ duration: 0, loadingType: 'none' })
    ),

  story('ImpactSplashScreen - Preset')
    .category('Molecules')
    .description('Impact splash with colored art')
    .render(() =>
      ImpactSplashScreen({
        birdArt,
        subtitle: 'Welcome',
        showLogo: true,
        loadingType: 'none',
        duration: 0,
      })
    ),

  story('MinimalSplash - Preset')
    .category('Molecules')
    .description('Minimal splash variant')
    .render(() =>
      MinimalSplash({
        title: 'Minimal',
        loadingType: 'dots',
        duration: 0,
      })
    ),

  story('ProgressSplash - Preset')
    .category('Molecules')
    .description('Progress splash variant')
    .render(() =>
      ProgressSplash({
        title: 'Loading',
        loadingType: 'progress',
        duration: 0,
      })
    ),
];

/**
 * All molecule stories
 */
export const allMoleculeStories: Story[] = [
  ...compositeInputStories,
  ...selectionStories,
  ...autocompleteStories,
  ...tableStories,
  ...tabsStories,
  ...treeStories,
  ...calendarStories,
  ...codeStories,
  ...collapsibleStories,
  ...formStories,
  ...splitViewStories,
  ...dataVizStories,
  ...splashStories,
];

export default allMoleculeStories;
