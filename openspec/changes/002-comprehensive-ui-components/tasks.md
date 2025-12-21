# Tasks: Comprehensive UI Components

## Sprint 1: Core Infrastructure + Data Visualization

### 1.1 Core Infrastructure
- [x] **CORE-001**: Implement `useMouse` hook ✅
  - Parse SGR mouse protocol sequences
  - Support click, double-click, drag, scroll
  - Track modifier keys (ctrl, shift, alt)
  - Provide X10 fallback for legacy terminals

- [x] **CORE-002**: Implement `ThemeProvider` and `useTheme` ✅
  - Create theme context using signals
  - Define `Theme` interface with colors, spacing, borderRadius
  - Create `darkTheme` and `lightTheme` presets
  - Support nested themes

- [x] **CORE-003**: Implement `useAnimation` and `Transition` ✅
  - Frame-based animation scheduler (~60fps)
  - Easing functions: linear, ease-in, ease-out, ease-in-out
  - `Transition` wrapper component for show/hide animations
  - Support fade, slide-up, slide-down, scale effects

- [x] **CORE-004**: Implement ASCII fallback system ✅
  - `detectTerminalCapabilities()` function
  - `setRenderMode()` and `getRenderMode()` functions
  - Character sets for unicode and ascii modes
  - Auto-detection based on TERM and COLORTERM env vars

### 1.2 Data Visualization
- [x] **VIZ-001**: Implement `Sparkline` component ✅
  - Unicode block characters (▁▂▃▄▅▆▇█)
  - Braille dot patterns (optional high-res mode)
  - ASCII fallback (_.-:=*#@)
  - Auto min/max detection
  - Configurable width
  - Color support
  - `SparklineBuffer` class for streaming data

- [x] **VIZ-002**: Implement `BarChart` component ✅
  - Horizontal and vertical orientations
  - Multiple bar styles (solid, gradient)
  - Value labels (inside/outside bars)
  - Percentage display
  - Color per bar
  - ASCII fallback

- [x] **VIZ-003**: Implement `LineChart` component ✅
  - Multi-series support
  - Y-axis with labels
  - X-axis with labels
  - Point markers
  - Line drawing characters (╭╮╯╰─│)
  - Legend display
  - ASCII fallback

- [x] **VIZ-004**: Implement `Gauge` component ✅
  - Semicircle style
  - Arc style
  - Linear style
  - Color thresholds (green/yellow/red)
  - Value label
  - ASCII fallback

---

## Sprint 2: Forms + Data Display

### 2.1 Form Components
- [x] **FORM-001**: Implement `MultiSelect` component ✅
  - Multiple item selection
  - Fuzzy search/filter
  - Configurable max selections
  - Chip/tag display for selected items
  - Keyboard navigation (arrows, space, enter)
  - Mouse click support

- [x] **FORM-002**: Implement `Autocomplete` component ✅
  - Text input with suggestions dropdown
  - Async suggestions support
  - Debounced input
  - Keyboard navigation
  - Mouse click support
  - Custom render for suggestions
  - Includes Combobox and TagInput variants

- [x] **FORM-003**: Implement `RadioGroup` component ✅
  - Single selection
  - Horizontal/vertical layout
  - Custom indicators (●/○)
  - Keyboard navigation
  - Mouse click support
  - Disabled items

- [x] **FORM-004**: Implement `Switch` component ✅
  - Boolean toggle
  - Pill/square/text styles
  - On/off labels
  - Color customization
  - Keyboard toggle (space)
  - Mouse click support
  - Includes ToggleGroup for multiple switches

- [x] **FORM-005**: Implement `Slider` component ✅
  - Numeric value selection
  - Min/max/step configuration
  - Value label display
  - Range labels
  - Keyboard navigation (arrows)
  - Mouse drag support
  - Includes RangeSlider for dual-thumb selection

### 2.2 Data Display
- [x] **DATA-001**: Implement `Tree` component ✅
  - Hierarchical node structure
  - Expand/collapse functionality
  - Connector lines (├└│─)
  - Custom icons per node
  - Keyboard navigation
  - Mouse click support
  - Selection mode
  - ASCII fallback
  - Includes DirectoryTree variant for file system browsing

- [x] **DATA-002**: Implement enhanced `DataTable` component ✅
  - Sortable columns
  - Click-to-sort headers
  - Filter/search
  - Pagination
  - Row selection (single/multi)
  - Keyboard navigation
  - Mouse click support
  - Includes VirtualDataTable for large datasets
  - Includes EditableDataTable for inline editing

- [x] **DATA-003**: Implement `Calendar` component ✅
  - Month view grid
  - Date selection
  - Marked/highlighted dates
  - Week numbers (optional)
  - Navigation between months
  - Keyboard navigation
  - Mouse click support
  - Configurable start of week
  - Includes MiniCalendar and DatePicker variants

---

## Sprint 3: Layout + Visual

### 3.1 Layout Components
- [x] **LAYOUT-001**: Implement `Tabs` component ✅
  - Tab header bar
  - Content panels
  - Top/bottom position
  - Line/box/pills styles
  - Keyboard navigation
  - Mouse click support
  - Closable tabs (optional)
  - Includes VerticalTabs and LazyTabs variants

- [x] **LAYOUT-002**: Implement `Collapsible` component ✅
  - Expandable sections
  - Title with toggle indicator
  - Smooth animation (optional)
  - Custom icons
  - Keyboard toggle
  - Mouse click support
  - Includes Accordion, Details, and ExpandableText variants

- [x] **LAYOUT-003**: Implement `ScrollArea` component ✅
  - Vertical scrolling
  - Scrollbar indicator
  - Keyboard scrolling (arrows, page up/down)
  - Mouse wheel support
  - Scroll position tracking
  - Auto-scroll to bottom (optional)
  - Includes VirtualList, ScrollableText, and LogViewer variants

- [x] **LAYOUT-004**: Implement `Grid` component ✅
  - Column/row definitions
  - Cell spanning
  - Gap between cells
  - Responsive column counts (optional)
  - Alignment options
  - Includes SimpleGrid, AutoGrid, MasonryGrid, TemplateGrid, ResponsiveGrid

### 3.2 Visual Components
- [x] **VISUAL-001**: Implement `BigText` component ✅
  - Block font (box drawing characters)
  - Slant font
  - Small font (3-line height)
  - Standard figlet-like font
  - Color support
  - Gradient colors
  - Center/left/right alignment
  - Includes FigletText, BigTitle, and Logo variants

- [x] **VISUAL-002**: Implement `Digits` component ✅
  - LCD-style numbers
  - Block style
  - Dot matrix style
  - Time/clock format
  - Color support
  - Includes Clock, Counter, Countdown, Stopwatch, DigitRoll, and Score variants

- [x] **VISUAL-003**: Implement `Tooltip` component ✅
  - Position relative to target (top/bottom/left/right)
  - Arrow pointer
  - Border styles
  - Background color
  - Show/hide control
  - Includes WithTooltip, HelpTooltip, InfoBox, Popover, Badge, and Tag variants

---

## Sprint 4: Polish + Advanced

### 4.1 Advanced Components
- [x] **ADV-001**: Implement `DirectoryTree` component ✅ (already exists in tree.ts)
  - File system browsing
  - Lazy loading directories
  - File/folder icons
  - Hidden files toggle
  - Selection callback
  - Keyboard navigation

- [x] **ADV-002**: Implement `Heatmap` component ✅
  - 2D data grid
  - Color intensity mapping
  - Custom color scales (heat, cool, viridis, grayscale, redgreen, temperature)
  - Cell labels
  - Row/column headers
  - ASCII fallback
  - Includes ContributionGraph (GitHub-style)
  - Includes CalendarHeatmap (year view)
  - Includes CorrelationMatrix (statistical)

### 4.2 Documentation & Examples
- [x] **DOC-001**: Create example files for all components ✅
  - examples/06-dashboard.ts - Data visualization (Sparkline, BarChart, LineChart, Gauge, Heatmap)
  - examples/07-advanced-forms.ts - Forms (MultiSelect, Autocomplete, RadioGroup, Switch, Slider)
  - examples/08-layout-components.ts - Layout (Tabs, Accordion, ScrollArea, Grid, Tree)
  - examples/09-visual-components.ts - Visual (BigText, Digits, Clock, Countdown, Badge)

- [x] **DOC-002**: Update main README with new components ✅

- [x] **DOC-003**: Create component API reference documentation ✅

### 4.3 Testing & Quality
- [x] **TEST-001**: Unit tests for all core infrastructure ✅
- [x] **TEST-002**: Unit tests for all data visualization components ✅
- [x] **TEST-003**: Unit tests for all form components ✅
- [x] **TEST-004**: Unit tests for all data display components ✅
- [x] **TEST-005**: Unit tests for all layout components ✅
- [x] **TEST-006**: Unit tests for all visual components ✅
- [x] **TEST-007**: Integration tests for component combinations ✅
- [x] **TEST-008**: Performance benchmarks for charts ✅

### 4.4 Polish
- [x] **POLISH-001**: Ensure 80%+ code coverage ✅ (91.14% achieved)
- [x] **POLISH-002**: Performance optimization pass ✅ (benchmarks verify <50ms dashboard render)
- [x] **POLISH-003**: Edge case handling review ✅ (1665 tests, 91.33% coverage)
- [x] **POLISH-004**: Accessibility review (keyboard navigation) ✅
- [x] **POLISH-005**: TypeScript types review and export ✅

---

## Task Dependencies

```
CORE-001 ──┬──> FORM-* (mouse support)
CORE-002 ──┼──> All components (theming)
CORE-003 ──┼──> LAYOUT-002 (animations)
CORE-004 ──┴──> All components (ASCII fallback)

VIZ-001 ──> VIZ-002 ──> VIZ-003 ──> VIZ-004

FORM-001 ──> FORM-002 (similar patterns)
FORM-003 ──> FORM-004 (similar patterns)

DATA-001 ──> ADV-001 (tree base)
DATA-002 independent

LAYOUT-* independent of each other

VISUAL-* independent of each other
```

## Acceptance Criteria

Each task is complete when:
1. Component is implemented with all documented props
2. Tests pass with 80%+ coverage
3. Storybook example exists
4. ASCII fallback works (where applicable)
5. Mouse support works (where applicable)
6. Theme colors are applied
7. TypeScript types are exported
