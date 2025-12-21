# Advanced Components

## ADDED Requirements

### Requirement: Sparkline Component
The system SHALL provide inline mini-charts for data visualization.

#### Scenario: Render sparkline
- **WHEN** `Sparkline({ data: [1, 3, 2, 5, 4] })` is rendered
- **THEN** a single-line chart using Unicode blocks is displayed
- **AND** values are normalized to available height

#### Scenario: Custom characters
- **WHEN** `chars` option is provided
- **THEN** custom characters are used for bars
- **AND** defaults to '▁▂▃▄▅▆▇█'

#### Scenario: Color gradient
- **WHEN** `gradient: ['cyan', 'green', 'yellow', 'red']` is set
- **THEN** colors transition based on value magnitude

---

### Requirement: BarChart Component
The system SHALL provide bar charts for data comparison.

#### Scenario: Horizontal bars
- **WHEN** `BarChart({ data, orientation: 'horizontal' })` is rendered
- **THEN** horizontal bars with labels are displayed
- **AND** bars scale to fit available width

#### Scenario: Vertical bars
- **WHEN** `BarChart({ data, orientation: 'vertical' })` is rendered
- **THEN** vertical bars with labels below are displayed

#### Scenario: Grouped bars
- **WHEN** multiple series are provided
- **THEN** bars are grouped by category
- **AND** each series has a distinct color

#### Scenario: Labels and values
- **WHEN** `showLabels: true` and `showValues: true` are set
- **THEN** category labels and bar values are displayed

---

### Requirement: LineChart Component
The system SHALL provide line charts for trend visualization.

#### Scenario: Single series
- **WHEN** `LineChart({ data: points })` is rendered
- **THEN** a line connecting data points is displayed
- **AND** Braille characters are used for high resolution

#### Scenario: Multiple series
- **WHEN** multiple `series` are provided
- **THEN** each series is rendered with a distinct color
- **AND** a legend identifies each series

#### Scenario: Axes
- **WHEN** `showAxes: true` is set
- **THEN** X and Y axes with labels are displayed
- **AND** tick marks indicate scale

---

### Requirement: Heatmap Component
The system SHALL provide 2D heatmaps for matrix visualization.

#### Scenario: Render heatmap
- **WHEN** `Heatmap({ data: matrix })` is rendered
- **THEN** a colored grid representing values is displayed
- **AND** colors indicate value magnitude

#### Scenario: Color scale
- **WHEN** `colorScale: ['blue', 'white', 'red']` is set
- **THEN** values are mapped to the color gradient

#### Scenario: Cell labels
- **WHEN** cells are large enough
- **THEN** numeric values are shown in each cell

---

### Requirement: Gauge Component
The system SHALL provide gauges for displaying single values.

#### Scenario: Arc gauge
- **WHEN** `Gauge({ value: 75, type: 'arc' })` is rendered
- **THEN** a semicircular gauge is displayed
- **AND** fill indicates current value

#### Scenario: Linear gauge
- **WHEN** `Gauge({ value: 75, type: 'linear' })` is rendered
- **THEN** a horizontal bar gauge is displayed

#### Scenario: Threshold colors
- **WHEN** `thresholds: { 30: 'green', 70: 'yellow', 90: 'red' }` is set
- **THEN** gauge color changes based on value

---

### Requirement: Tree Component
The system SHALL provide hierarchical tree views.

#### Scenario: Expand/collapse
- **WHEN** a tree node is toggled
- **THEN** its children are shown or hidden
- **AND** an indicator shows expand state

#### Scenario: Lazy loading
- **WHEN** `onLoadChildren` callback is provided
- **THEN** children are loaded on-demand when expanded
- **AND** a loading indicator is shown

#### Scenario: Keyboard navigation
- **WHEN** arrow keys are pressed
- **THEN** focus moves through tree nodes
- **AND** Left/Right expand/collapse nodes

#### Scenario: Selection
- **WHEN** `selectable: true` is set
- **THEN** nodes can be selected with Enter or Space
- **AND** selection state is visually indicated

---

### Requirement: DataGrid Component
The system SHALL provide advanced data grid for tabular data.

#### Scenario: Virtual scrolling
- **WHEN** grid has many rows
- **THEN** only visible rows are rendered
- **AND** scrolling is smooth

#### Scenario: Column sorting
- **WHEN** a column header is clicked
- **THEN** data is sorted by that column
- **AND** sort direction is indicated

#### Scenario: Column filtering
- **WHEN** a filter is applied
- **THEN** only matching rows are displayed
- **AND** filter criteria is shown

#### Scenario: Row selection
- **WHEN** `selectable: true` is set
- **THEN** rows can be selected with click or keyboard
- **AND** multi-select is supported with Shift/Ctrl

#### Scenario: Cell editing
- **WHEN** `editable: true` is set on a column
- **THEN** cells can be edited inline
- **AND** changes trigger an `onChange` callback

---

### Requirement: Tooltip Component
The system SHALL provide tooltips for additional information.

#### Scenario: Hover activation
- **WHEN** focus enters a tooltip trigger
- **THEN** tooltip appears after a delay
- **AND** tooltip disappears when focus leaves

#### Scenario: Positioning
- **WHEN** tooltip would overflow screen
- **THEN** position is adjusted to fit
- **AND** arrow points to trigger element

#### Scenario: Rich content
- **WHEN** tooltip contains Box/Text children
- **THEN** complex content is rendered inside tooltip

---

### Requirement: ContextMenu Component
The system SHALL provide right-click context menus.

#### Scenario: Open on trigger
- **WHEN** right-click (or Shift+F10) occurs
- **THEN** context menu appears at cursor position

#### Scenario: Submenu support
- **WHEN** a menu item has children
- **THEN** a submenu opens on hover/arrow-right

#### Scenario: Keyboard navigation
- **WHEN** arrow keys are pressed
- **THEN** focus moves through menu items
- **AND** Enter activates the focused item

#### Scenario: Dismiss
- **WHEN** Escape is pressed or outside is clicked
- **THEN** menu closes
- **AND** focus returns to trigger

---

### Requirement: Notification Queue
The system SHALL provide a notification/toast queue system.

#### Scenario: Add notification
- **WHEN** `notify({ message, type })` is called
- **THEN** notification appears in designated area
- **AND** older notifications shift to accommodate

#### Scenario: Auto dismiss
- **WHEN** `duration: 5000` is set
- **THEN** notification disappears after 5 seconds
- **AND** exit animation plays

#### Scenario: Queue limit
- **WHEN** more than 5 notifications are queued
- **THEN** oldest notifications are dismissed
- **AND** new notifications are added

#### Scenario: Action buttons
- **WHEN** notification has actions
- **THEN** buttons are rendered in notification
- **AND** clicking action dismisses notification
