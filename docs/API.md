# Tuiuiu API Reference

Complete API reference for all Tuiuiu components, hooks, and utilities.

## Table of Contents

- [Core](#core)
  - [Signals](#signals)
  - [Rendering](#rendering)
  - [App Lifecycle](#app-lifecycle)
- [Hooks](#hooks)
- [Components](#components)
  - [Primitives](#primitives)
  - [Forms](#forms)
  - [Data Display](#data-display)
  - [Layout](#layout)
  - [Visual](#visual)
  - [Feedback](#feedback)
  - [Overlays](#overlays)
- [Data Visualization](#data-visualization)
- [Theme System](#theme-system)
- [Animation System](#animation-system)
- [Terminal Capabilities](#terminal-capabilities)
- [Utilities](#utilities)

---

## Core

### Signals

Fine-grained reactive primitives for state management.

#### `createSignal<T>(initialValue: T): [Accessor<T>, Setter<T>]`

Creates a reactive signal with getter and setter.

```typescript
const [count, setCount] = createSignal(0);
console.log(count()); // 0
setCount(5);
setCount(c => c + 1); // Updater function
```

#### `createEffect(fn: () => void): () => void`

Creates a side effect that re-runs when its dependencies change.

```typescript
const [name, setName] = createSignal("Alice");
createEffect(() => {
  console.log(`Hello, ${name()}`);
});
setName("Bob"); // Logs: "Hello, Bob"
```

#### `createMemo<T>(fn: () => T): Accessor<T>`

Creates a memoized computed value.

```typescript
const [a, setA] = createSignal(1);
const [b, setB] = createSignal(2);
const sum = createMemo(() => a() + b());
console.log(sum()); // 3
```

#### `batch(fn: () => void): void`

Batches multiple signal updates to trigger effects once.

```typescript
batch(() => {
  setCount(1);
  setName("Alice");
}); // Effects run once after batch
```

#### `untrack<T>(fn: () => T): T`

Reads signals without creating dependencies.

```typescript
createEffect(() => {
  const name = untrack(() => otherSignal());
});
```

### Rendering

#### `render(component: Component, options?: RenderOptions): ReckInstance`

Renders an interactive terminal application.

```typescript
const { waitUntilExit, rerender } = render(App);
await waitUntilExit();
```

**Options:**
- `stdout?: NodeJS.WriteStream` - Output stream (default: process.stdout)
- `stdin?: NodeJS.ReadStream` - Input stream (default: process.stdin)
- `debug?: boolean` - Enable debug mode
- `exitOnError?: boolean` - Exit on component error

#### `renderOnce(vnode: VNode): string`

Renders a component once without interactivity.

```typescript
const output = renderOnce(
  Box({ padding: 1 }, Text({}, "Hello"))
);
console.log(output);
```

#### `renderToString(vnode: VNode, width: number, height: number): string`

Renders a VNode to a string with specified dimensions.

```typescript
const output = renderToString(myComponent, 80, 24);
```

### App Lifecycle

#### `useApp(): AppContext`

Access the application context.

```typescript
const app = useApp();
app.exit(); // Exit the application
app.exit(1); // Exit with error code
```

---

## Hooks

### `useState<T>(initialValue: T): [Accessor<T>, Setter<T>]`

Component state hook (alias for createSignal).

```typescript
const [visible, setVisible] = useState(true);
```

### `useEffect(fn: () => void | (() => void)): void`

Effect hook with cleanup support.

```typescript
useEffect(() => {
  const interval = setInterval(() => tick(), 1000);
  return () => clearInterval(interval); // Cleanup
});
```

### `useInput(handler: InputHandler, options?: { isActive?: boolean }): void`

Handle keyboard input.

```typescript
useInput((input, key) => {
  if (key.upArrow) moveUp();
  if (key.downArrow) moveDown();
  if (key.return) submit();
  if (key.escape) cancel();
  if (input === 'q') quit();
}, { isActive: isFocused });
```

**Key object properties:**
- `upArrow`, `downArrow`, `leftArrow`, `rightArrow`
- `return` (Enter key)
- `escape`
- `backspace`, `delete`
- `tab`, `shift` + `tab`
- `pageUp`, `pageDown`
- `home`, `end`
- `ctrl`, `shift`, `meta`

### `useFocus(options?: FocusOptions): FocusResult`

Manage component focus.

```typescript
const { isFocused, focus, blur } = useFocus({
  autoFocus: true,
  id: 'my-input'
});
```

### `useFocusManager(): FocusManager`

Manage focus across multiple focusable components.

```typescript
const focusManager = useFocusManager();
focusManager.focusNext();
focusManager.focusPrevious();
```

### `useFps(): UseFpsResult`

Track frames per second for performance monitoring.

```typescript
const { fps, metrics, color } = useFps();

// fps: current FPS (number)
// color: 'green' | 'yellow' | 'red' based on performance
// metrics: detailed FpsMetrics object
```

**FpsMetrics:**
- `fps` - Current frames per second
- `avgFps` - Rolling average (10s window)
- `minFps` / `maxFps` - Min/max recorded
- `totalFrames` - Total frames rendered
- `uptime` - Time since tracking started (ms)
- `frameTime` - Milliseconds per frame

**Color thresholds:** green (≥30), yellow (15-29), red (<15)

---

## Components

### Primitives

#### `Box(props: BoxProps, ...children: VNode[]): VNode`

Flexbox container component.

```typescript
Box({
  flexDirection: 'column',
  padding: 1,
  borderStyle: 'round',
  borderColor: 'cyan',
  width: 40,
  height: 10,
  justifyContent: 'center',
  alignItems: 'center',
}, children)
```

**Props:**
- `flexDirection`: `'row'` | `'column'` | `'row-reverse'` | `'column-reverse'`
- `justifyContent`: `'flex-start'` | `'flex-end'` | `'center'` | `'space-between'` | `'space-around'`
- `alignItems`: `'flex-start'` | `'flex-end'` | `'center'` | `'stretch'`
- `padding`, `paddingX`, `paddingY`, `paddingTop`, `paddingRight`, `paddingBottom`, `paddingLeft`: number
- `margin`, `marginX`, `marginY`, `marginTop`, `marginRight`, `marginBottom`, `marginLeft`: number
- `width`, `height`, `minWidth`, `minHeight`, `maxWidth`, `maxHeight`: number | string
- `flexGrow`, `flexShrink`, `flexBasis`: number | string
- `gap`: number
- `borderStyle`: `'single'` | `'double'` | `'round'` | `'bold'` | `'classic'` | `'arrow'` | `'none'`
- `borderColor`: ColorValue

#### `Text(props: TextProps, ...children: string[]): VNode`

Text display component.

```typescript
Text({
  color: 'cyan',
  backgroundColor: 'black',
  bold: true,
  italic: true,
  underline: true,
  strikethrough: true,
  dim: true,
  wrap: 'wrap'
}, 'Hello World')
```

**Props:**
- `color`, `backgroundColor`: ColorValue (named, hex, rgb)
- `bold`, `italic`, `underline`, `strikethrough`, `dim`, `inverse`: boolean
- `wrap`: `'wrap'` | `'truncate'` | `'truncate-start'` | `'truncate-middle'` | `'truncate-end'`

#### `Spacer(props?: { x?: number; y?: number }): VNode`

Creates flexible space.

#### `Newline(props?: { count?: number }): VNode`

Inserts newlines.

#### `Divider(props?: DividerProps): VNode`

Horizontal divider line.

```typescript
Divider({ title: 'Section', color: 'gray' })
```

#### `SplitBox(props: SplitBoxProps): VNode`

Box with internal divisions and connected border characters (┬ ┴).

```typescript
SplitBox({
  borderStyle: 'round',
  borderColor: 'cyan',
  width: 60,
  sections: [
    { width: 12, content: Logo(), valign: 'middle' },
    { flexGrow: 1, content: Content() },
  ],
  paddingX: 1,
})
```

**Props:**
- `sections`: Array of section definitions
- `borderStyle`: `'single'` | `'round'` | `'double'` | `'bold'`
- `borderColor`: ColorValue
- `width`: Total width (defaults to terminal width)
- `paddingX`, `paddingY`: Padding inside sections

**Section Props:**
- `width`: Fixed width in characters
- `flexGrow`: Flex grow factor
- `content`: VNode to render
- `align`: `'left'` | `'center'` | `'right'`
- `valign`: `'top'` | `'middle'` | `'bottom'`

#### `When(condition: boolean, child: VNode): VNode | null`

Conditional rendering.

```typescript
When(isLoading, Spinner({}))
```

#### `Each<T>(items: T[], render: (item: T, i: number) => VNode): VNode`

List rendering.

```typescript
Each(items, (item, i) => Text({ key: i }, item.name))
```

### Forms

#### `Select(props: SelectOptions): VNode`

Single-select dropdown.

```typescript
Select({
  items: [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
  ],
  onSelect: (item) => console.log(item.value),
  onCancel: () => console.log('cancelled'),
})
```

#### `MultiSelect(props: MultiSelectProps): VNode`

Multi-select with checkboxes.

```typescript
MultiSelect({
  items: [
    { label: 'JavaScript', value: 'js' },
    { label: 'TypeScript', value: 'ts' },
    { label: 'Python', value: 'py' },
  ],
  selected: ['ts'],
  maxSelected: 3,
  fuzzySearch: true,
  onSubmit: (selected) => console.log(selected),
})
```

#### `Autocomplete(props: AutocompleteProps): VNode`

Text input with suggestions.

```typescript
Autocomplete({
  items: cities,
  placeholder: 'Type a city...',
  onSelect: (item) => setCity(item.value),
})
```

#### `RadioGroup(props: RadioGroupProps): VNode`

Radio button group.

```typescript
RadioGroup({
  options: [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
  ],
  selected: 'dark',
  onChange: (value) => setTheme(value),
})
```

#### `Switch(props: SwitchProps): VNode`

Boolean toggle switch.

```typescript
Switch({
  value: enabled,
  onChange: setEnabled,
  onLabel: 'ON',
  offLabel: 'OFF',
})
```

#### `Slider(props: SliderProps): VNode`

Numeric value slider.

```typescript
Slider({
  value: 50,
  min: 0,
  max: 100,
  step: 5,
  width: 30,
  onChange: setValue,
})
```

#### `RangeSlider(props: RangeSliderProps): VNode`

Dual-thumb range slider.

```typescript
RangeSlider({
  value: [20, 80],
  min: 0,
  max: 100,
  onChange: setRange,
})
```

#### `Confirm(props: ConfirmProps): VNode`

Yes/No confirmation.

```typescript
Confirm({
  message: 'Are you sure?',
  onConfirm: () => proceed(),
  onCancel: () => cancel(),
})
```

#### `Checkbox(props: CheckboxProps): VNode`

Single checkbox.

### Data Display

#### `Tree(props: TreeProps): VNode`

Hierarchical tree view.

```typescript
Tree({
  nodes: [
    {
      id: 'root',
      label: 'Project',
      icon: '📁',
      children: [
        { id: 'src', label: 'src', icon: '📁', children: [...] },
        { id: 'readme', label: 'README.md', icon: '📄' },
      ],
    },
  ],
  initialExpanded: ['root', 'src'],
  onSelect: (node) => console.log(node.id),
})
```

#### `DirectoryTree(props: DirectoryTreeOptions): VNode`

File system tree browser.

#### `DataTable(props: DataTableProps): VNode`

Sortable, filterable data table.

```typescript
DataTable({
  columns: [
    { key: 'name', header: 'Name', width: 20, sortable: true },
    { key: 'value', header: 'Value', width: 10, align: 'right' },
  ],
  data: [
    { name: 'Alpha', value: 100 },
    { name: 'Beta', value: 200 },
  ],
  sortable: true,
  selectable: true,
  pageSize: 10,
})
```

#### `VirtualDataTable(props: VirtualDataTableOptions): VNode`

Virtualized table for large datasets.

#### `EditableDataTable(props: EditableDataTableOptions): VNode`

Table with inline editing.

#### `Calendar(props: CalendarProps): VNode`

Month calendar view.

```typescript
Calendar({
  date: new Date(),
  events: [
    { date: new Date(2025, 0, 15), label: 'Meeting' },
  ],
  onSelect: (date) => console.log(date),
})
```

#### `MiniCalendar(props: MiniCalendarOptions): VNode`

Compact calendar.

#### `DatePicker(props: DatePickerOptions): VNode`

Date selection input.

#### `Table(props: TableOptions): VNode`

Basic table with borders.

```typescript
Table({
  data: [
    ['Name', 'Age', 'City'],
    ['Alice', '30', 'NYC'],
    ['Bob', '25', 'LA'],
  ],
  header: true,
  borderStyle: 'single',
})
```

#### `SimpleTable` / `KeyValueTable`

Simplified table variants.

### Layout

#### `Tabs(props: TabsProps): VNode`

Tabbed content switcher.

```typescript
Tabs({
  tabs: [
    { id: 'home', label: 'Home', content: HomePanel() },
    { id: 'settings', label: 'Settings', content: SettingsPanel() },
  ],
  style: 'line', // 'line' | 'box' | 'pills'
})
```

#### `VerticalTabs(props: VerticalTabsOptions): VNode`

Vertical tab layout.

#### `LazyTabs(props: LazyTabsProps): VNode`

Tabs with lazy content loading.

#### `Accordion(props: AccordionProps): VNode`

Expandable sections.

```typescript
Accordion({
  sections: [
    { id: 'faq1', title: 'Question 1', content: Answer1() },
    { id: 'faq2', title: 'Question 2', content: Answer2() },
  ],
  allowMultiple: true,
  defaultExpanded: ['faq1'],
})
```

#### `Collapsible(props: CollapsibleProps): VNode`

Single expandable section.

```typescript
Collapsible({
  title: 'Details',
  defaultOpen: true,
  children: content,
})
```

#### `ScrollArea(props: ScrollAreaProps): VNode`

Scrollable content area.

```typescript
ScrollArea({
  height: 10,
  showScrollbar: true,
}, longContent)
```

#### `Scrollbar(props: ScrollbarOptions): VNode`

Standalone scrollbar atom for custom scroll implementations.

```typescript
Scrollbar({
  height: 10,       // Visible area height
  total: 50,        // Total content height
  current: 15,      // Current scroll position
  color: 'primary', // Thumb color
  trackColor: 'muted',
})
```

#### `VirtualList(props: VirtualListProps): VNode`

Virtualized list for performance.

#### `LogViewer(props: LogViewerOptions): VNode`

Auto-scrolling log display.

#### `Grid(props: GridProps): VNode`

CSS Grid-like layout.

```typescript
Grid({
  columns: 3,
  gap: 1,
  children: [
    GridCell({ colSpan: 2 }, content1),
    GridCell({}, content2),
  ],
})
```

#### `GridCell(props: GridCellProps, ...children: VNode[]): VNode`

Grid cell with span options.

#### `SimpleGrid` / `AutoGrid` / `MasonryGrid` / `TemplateGrid` / `ResponsiveGrid`

Grid variants for different layouts.

#### `SplitPanel(props: SplitPanelProps): VNode`

Resizable split panel.

```typescript
SplitPanel({
  direction: 'horizontal',
  ratio: 0.3,
  left: sidebar,
  right: main,
})
```

#### `ThreePanel(props: ThreePanelProps): VNode`

Three-panel layout (sidebar + main + detail).

#### `VStack` / `HStack` / `Center` / `FullScreen`

Layout helper components.

### Visual

#### `BigText(props: BigTextOptions): VNode`

Large ASCII art text.

```typescript
BigText({
  text: 'HELLO',
  font: 'block', // 'block' | 'slant' | 'small' | 'standard'
  colors: ['cyan', 'blue', 'magenta'],
})
```

#### `FigletText` / `BigTitle` / `Logo`

BigText variants.

#### `Digits(props: DigitsOptions): VNode`

LCD-style number display.

```typescript
Digits({
  value: '1234',
  style: 'lcd', // 'lcd' | 'block' | 'dot'
  color: 'green',
})
```

#### `Clock(props: ClockOptions): VNode`

Real-time clock display.

```typescript
Clock({
  time: new Date(),
  format: '24h', // '12h' | '24h'
  showSeconds: true,
  style: 'lcd',
})
```

#### `Countdown(props: CountdownOptions): VNode`

Countdown timer.

```typescript
Countdown({
  targetDate: futureDate,
  format: 'hh:mm:ss',
  onComplete: () => alert('Done!'),
})
```

#### `Stopwatch(props: StopwatchOptions): VNode`

Stopwatch timer.

#### `Counter` / `DigitRoll` / `Score`

Number display variants.

#### `Badge(props: BadgeProps): VNode`

Inline badge/tag.

```typescript
Badge({ label: 'NEW', color: 'green' })
Badge({ label: 'ERROR', color: 'red' })
```

#### `Tag(props: TagOptions): VNode`

Styled tag with optional close button.

#### `Tooltip(props: TooltipOptions): VNode`

Tooltip popup.

```typescript
Tooltip({
  content: 'Help text here',
  position: 'top', // 'top' | 'bottom' | 'left' | 'right'
})
```

#### `WithTooltip(props: WithTooltipOptions): VNode`

Wrapper to add tooltip to any component.

#### `HelpTooltip` / `InfoBox` / `Popover`

Tooltip variants.

### Feedback

#### `Spinner(props: SpinnerOptions): VNode`

Loading spinner.

```typescript
Spinner({
  style: 'dots', // 'dots' | 'line' | 'arc' | 'bounce' | 'pulse'
  color: 'cyan',
  label: 'Loading...',
})
```

#### `ProgressBar(props: ProgressBarOptions): VNode`

Progress indicator.

```typescript
ProgressBar({
  value: 75,
  max: 100,
  width: 40,
  showPercentage: true,
  style: 'smooth', // 'smooth' | 'block' | 'ascii'
})
```

#### `MultiProgressBar`: Multiple progress bars.

### Overlays

#### `Modal(props: ModalProps): VNode`

Modal dialog.

```typescript
Modal({
  title: 'Confirm',
  visible: showModal,
  onClose: () => setShowModal(false),
  size: 'medium',
}, content)
```

#### `ConfirmDialog(props: ConfirmDialogProps): VNode`

Confirmation modal.

#### `Toast(props: ToastProps): VNode`

Toast notification.

```typescript
Toast({
  message: 'Saved successfully!',
  type: 'success', // 'success' | 'error' | 'warning' | 'info'
  duration: 3000,
})
```

#### `AlertBox(props: AlertBoxProps): VNode`

Alert message box.

---

## Data Visualization

### Sparkline

Inline mini-charts.

```typescript
Sparkline({
  data: [10, 20, 15, 25, 30],
  width: 20,
  style: 'block', // 'block' | 'braille' | 'ascii'
  color: 'cyan',
  showLabels: true,
})
```

#### `SparklineBuffer`

Streaming data buffer for sparklines.

```typescript
const buffer = createSparklineBuffer({ maxPoints: 100 });
buffer.push(newValue);
Sparkline({ data: buffer.data, width: 50 })
```

### BarChart

Bar chart visualization.

```typescript
BarChart({
  data: [
    { label: 'Jan', value: 100, color: 'blue' },
    { label: 'Feb', value: 150, color: 'green' },
  ],
  width: 40,
  orientation: 'horizontal', // 'horizontal' | 'vertical'
  showValues: true,
})
```

#### `VerticalBarChart` / `StackedBarChart`

Bar chart variants.

### LineChart

Multi-series line chart.

```typescript
LineChart({
  series: [
    {
      name: 'Revenue',
      data: [{ x: 0, y: 10 }, { x: 1, y: 20 }, { x: 2, y: 15 }],
      color: 'cyan',
    },
    {
      name: 'Costs',
      data: [{ x: 0, y: 5 }, { x: 1, y: 8 }, { x: 2, y: 12 }],
      color: 'red',
    },
  ],
  width: 60,
  height: 15,
  showLegend: true,
  showAxis: true,
})
```

#### `AreaChart`

Filled area chart.

#### `BrailleCanvas` / `AsciiCanvas`

Low-level canvas for custom visualizations.

```typescript
const canvas = new BrailleCanvas(80, 20);
canvas.setPixel(10, 5);
canvas.drawLine(0, 0, 40, 10);
const lines = canvas.render();
```

### Gauge

Progress/meter gauges.

```typescript
Gauge({
  value: 75,
  max: 100,
  style: 'arc', // 'arc' | 'semicircle' | 'linear'
  label: 'CPU',
  zones: DEFAULT_ZONES,
})
```

**Zone configuration:**

```typescript
const zones: GaugeZone[] = [
  { min: 0, max: 60, color: 'green' },
  { min: 60, max: 80, color: 'yellow' },
  { min: 80, max: 100, color: 'red' },
];
```

#### `LinearGauge` / `MeterGauge` / `ArcGauge` / `DialGauge` / `BatteryGauge`

Gauge variants.

### Heatmap

2D intensity visualization.

```typescript
Heatmap({
  data: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ],
  rowHeaders: ['A', 'B', 'C'],
  columnHeaders: ['X', 'Y', 'Z'],
  colorScale: 'heat', // 'heat' | 'cool' | 'viridis' | 'grayscale'
  showValues: true,
})
```

#### `ContributionGraph`

GitHub-style contribution graph.

#### `CalendarHeatmap`

Year view calendar heatmap.

#### `CorrelationMatrix`

Statistical correlation matrix.

---

## Theme System

### Built-in Themes

```typescript
import { darkTheme, lightTheme, highContrastDarkTheme, monochromeTheme } from 'tuiuiu.js';

setTheme(darkTheme);
setTheme(lightTheme);
```

### Theme API

```typescript
// Get current theme
const theme = getTheme();

// Set theme globally
setTheme(darkTheme);

// Stack themes (push/pop)
pushTheme(customTheme);
// ... components use customTheme
popTheme();

// Create custom theme
const myTheme = createTheme({
  name: 'my-theme',
  colors: {
    primary: '#007acc',
    secondary: '#6c757d',
    background: '#1e1e1e',
    surface: '#252526',
    text: '#d4d4d4',
    textMuted: '#808080',
    border: '#404040',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
  },
});
```

### Theme Utilities

```typescript
// Get theme color
const color = themeColor('primary');

// Get theme spacing
const space = themeSpacing('md'); // xs, sm, md, lg, xl

// Use in component
const theme = useTheme();
Box({ borderColor: theme.colors.primary })
```

---

## Animation System

### `useAnimation(options: AnimationOptions): AnimationControls`

Frame-based animations.

```typescript
const animation = useAnimation({
  duration: 500,
  easing: 'ease-out',
  onFrame: (progress) => {
    setOpacity(progress);
  },
  onComplete: () => console.log('done'),
});

animation.start();
animation.stop();
animation.reset();
```

### `useTransition(options: TransitionOptions): TransitionState`

State transitions with animations.

```typescript
const transition = useTransition({
  show: visible,
  enter: 'fade',
  exit: 'fade',
  duration: 300,
});

if (transition.mounted) {
  Box({ opacity: transition.progress }, content)
}
```

### Easing Functions

Available easings:
- `linear`
- `ease-in`, `ease-out`, `ease-in-out`
- `quad-in`, `quad-out`, `quad-in-out`
- `cubic-in`, `cubic-out`, `cubic-in-out`
- `back-in`, `back-out`, `back-in-out`
- `bounce-in`, `bounce-out`, `bounce-in-out`
- `elastic-in`, `elastic-out`, `elastic-in-out`

### Spring Animations

```typescript
const spring = createSpring({
  mass: 1,
  tension: 170,
  friction: 26,
});

const value = spring.step(targetValue, deltaTime);
```

---

## Terminal Capabilities

### Detection

```typescript
const caps = getCapabilities();
// { colors: 'truecolor', unicode: true, mouse: true, width: 120, height: 40 }
```

### Render Modes

```typescript
// Force ASCII mode (for limited terminals)
setRenderMode('ascii');

// Use Unicode (default)
setRenderMode('unicode');

// Get current mode
const mode = getRenderMode();
```

### Character Sets

```typescript
// Get appropriate characters for current mode
const chars = getChars();
// { horizontal: '─', vertical: '│', corner: '╭', ... }

// Or get specific char
const bullet = char('bullet'); // '●' or '*' depending on mode
```

### Color Support

```typescript
if (supportsTrueColor()) {
  // Use hex colors
}

if (supports256Colors()) {
  // Use 256-color palette
}
```

### Terminal Size

```typescript
const { width, height } = getTerminalSize();

onResize((width, height) => {
  console.log(`Resized to ${width}x${height}`);
});
```

---

## Utilities

### Text Utilities

```typescript
import { stripAnsi, stringWidth, wrapText, truncateText } from 'tuiuiu.js';

// Strip ANSI codes
stripAnsi('\x1b[31mRed\x1b[0m'); // 'Red'

// Get visible width (handles emojis, CJK)
stringWidth('Hello 👋'); // 8

// Wrap text
wrapText('Long text...', 40); // Wrapped string

// Truncate
truncateText('Long text', 10); // 'Long te...'
truncateText('Long text', 10, { position: 'middle' }); // 'Lon...ext'
```

### Cursor Control

```typescript
import { showCursor, hideCursor, cursor } from 'tuiuiu.js';

hideCursor();
// ... render UI
showCursor();

// Position cursor
cursor.moveTo(10, 5);
cursor.up(2);
cursor.down(3);
cursor.clear();
```

### Color Utilities

```typescript
import { colorize, colorToAnsi, style } from 'tuiuiu.js';

// Apply color
colorize('Hello', 'red');
colorize('Hello', '#ff0000');
colorize('Hello', 'rgb(255, 0, 0)');

// Get ANSI code
const code = colorToAnsi('cyan');

// Apply multiple styles
style('Bold red', { bold: true, color: 'red' });
```

### Hyperlinks

```typescript
import { hyperlink } from 'tuiuiu.js';

// Create clickable link (if terminal supports)
const link = hyperlink('Click here', 'https://example.com');
```

---

## Types Reference

### VNode

```typescript
interface VNode {
  type: 'box' | 'text';
  props: BoxStyle | TextStyle;
  children?: (VNode | string)[];
}
```

### ColorValue

```typescript
type ColorValue =
  | 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white'
  | 'gray' | 'redBright' | 'greenBright' | ... // bright variants
  | `#${string}` // hex
  | `rgb(${number}, ${number}, ${number})`; // RGB
```

### BorderStyle

```typescript
type BorderStyle = 'single' | 'double' | 'round' | 'bold' | 'singleDouble' | 'doubleSingle' | 'classic' | 'arrow' | 'none';
```

---

## Performance Tips

1. **Use `batch()` for multiple updates** to avoid redundant re-renders
2. **Use `createMemo()` for computed values** instead of computing in render
3. **Use `VirtualList` or `VirtualDataTable`** for large datasets
4. **Use `LazyTabs`** for tabs with heavy content
5. **Prefer `renderToString`** for static content that doesn't need interactivity
6. **Use ASCII mode** on slow/limited terminals

---

## Example: Complete App

```typescript
import {
  render, Box, Text, useState, useInput, useApp,
  Tabs, DataTable, Badge, Sparkline, setTheme, darkTheme
} from 'tuiuiu.js';

setTheme(darkTheme);

function Dashboard() {
  const app = useApp();
  const [data] = useState([10, 20, 15, 25, 30, 20, 35]);

  useInput((input, key) => {
    if (key.escape || input === 'q') app.exit();
  });

  return Box(
    { flexDirection: 'column', padding: 1 },
    Box(
      { flexDirection: 'row', marginBottom: 1 },
      Text({ bold: true, color: 'cyan' }, 'Dashboard'),
      Badge({ label: 'LIVE', color: 'green' })
    ),
    Box(
      { flexDirection: 'row' },
      Text({}, 'CPU: '),
      Sparkline({ data, width: 30, color: 'green' })
    ),
    Text({ color: 'gray', marginTop: 1 }, 'Press Q to exit')
  );
}

const { waitUntilExit } = render(Dashboard);
await waitUntilExit();
```
