# Storybook Coverage Checklist

This checklist tracks Storybook coverage for every exported UI component.

Legend:
- Story: at least one story exists
- Controls: story exposes all public props or documents non-controllable ones

Notes:
- Callback handlers, render children, and state factories are not controllable in storybook and require code examples.
- This file is generated from the story catalog. Run `pnpm storybook:coverage` after changing story metadata.

## Primitives

| Component | Story | Controls | Notes |
| --- | --- | --- | --- |
| Box | [x] | [x] |  |
| Text | [x] | [x] |  |
| Spacer (primitives) | [x] | [x] | No public props; spacing is layout-driven and not controllable. |
| Newline | [x] | [x] |  |
| Fragment | [x] | [x] | No public props; child grouping is not controllable. |
| When | [x] | [x] |  |
| Each | [x] | [x] |  |
| Transform | [x] | [x] | Transform text output (transform function not controllable) |
| Static | [x] | [x] | Render static items above dynamic content (items not controllable) |
| Slot | [x] | [x] |  |
| Divider (primitives) | [x] | [x] |  |
| SplitBox | [x] | [x] |  |
| Scroll | [x] | [x] |  |

## Atoms

| Component | Story | Controls | Notes |
| --- | --- | --- | --- |
| Spinner | [x] | [x] |  |
| Timer | [x] | [x] |  |
| Button | [x] | [x] | Button with variants and states (onClick not controllable) |
| IconButton | [x] | [x] | Icon-only button (onClick not controllable) |
| ButtonGroup | [x] | [x] |  |
| Switch | [x] | [x] | Boolean toggle (onChange not controllable) |
| ToggleGroup | [x] | [x] | Multiple toggles with shared layout (options not controllable) |
| Slider | [x] | [x] | Single value slider (onChange not controllable) |
| RangeSlider | [x] | [x] | Range slider (onChange not controllable) |
| TextInput | [x] | [x] |  |
| ProgressBar | [x] | [x] |  |
| MultiProgressBar | [x] | [x] | Segment arrays are not controllable; use code examples for segment composition. |
| Tooltip | [x] | [x] |  |
| WithTooltip | [x] | [x] |  |
| InfoBox | [x] | [x] |  |
| Popover | [x] | [x] |  |
| Tag | [x] | [x] |  |
| Badge | [x] | [x] |  |
| StatusIndicator | [x] | [x] |  |
| MetricDisplay | [x] | [x] | Metric display (trend not controllable) |
| Scrollbar | [x] | [x] |  |
| BigText | [x] | [x] |  |
| FigletText | [x] | [x] |  |
| BigTitle | [x] | [x] |  |
| Logo | [x] | [x] |  |
| Digits | [x] | [x] |  |
| Clock | [x] | [x] |  |
| Counter | [x] | [x] |  |
| Countdown | [x] | [x] |  |
| Stopwatch | [x] | [x] |  |
| DigitRoll | [x] | [x] |  |
| Score | [x] | [x] |  |
| Picture | [x] | [x] |  |
| FramedPicture | [x] | [x] |  |
| ColoredPicture | [x] | [x] | Pixel grid data is not controllable; use code examples for color maps. |
| AnimatedPicture | [x] | [x] | Animated picture (animation props not controllable) |
| DataRow | [x] | [x] |  |
| ListItem | [x] | [x] |  |
| HttpStatus | [x] | [x] |  |

## Molecules

| Component | Story | Controls | Notes |
| --- | --- | --- | --- |
| ConfirmButton | [x] | [x] |  |
| SearchInput | [x] | [x] |  |
| PasswordInput | [x] | [x] |  |
| NumberInput | [x] | [x] |  |
| Select | [x] | [x] |  |
| Confirm | [x] | [x] |  |
| Checkbox | [x] | [x] | Item arrays and selection callbacks are not controllable. |
| MultiSelect | [x] | [x] |  |
| RadioGroup | [x] | [x] |  |
| InlineRadio | [x] | [x] |  |
| Autocomplete | [x] | [x] |  |
| AutocompleteInput | [x] | [x] | Covered by the shared `AutocompleteInput + Suggestions` story; the shared state factory is not controllable. |
| AutocompleteSuggestions | [x] | [x] | Covered by the shared `AutocompleteInput + Suggestions` story; the shared state factory is not controllable. |
| Combobox | [x] | [x] |  |
| TagInput | [x] | [x] |  |
| Table | [x] | [x] |  |
| SimpleTable | [x] | [x] | Headers, rows, and alignment arrays are not controllable. |
| KeyValueTable | [x] | [x] | Entry objects are not controllable. |
| Tabs | [x] | [x] |  |
| TabPanel | [x] | [x] |  |
| VerticalTabs | [x] | [x] | Tab definition arrays are not controllable. |
| LazyTabs | [x] | [x] | Lazy content factories are not controllable. |
| Tree | [x] | [x] |  |
| DirectoryTree | [x] | [x] |  |
| Calendar | [x] | [x] |  |
| MiniCalendar | [x] | [x] |  |
| DatePicker | [x] | [x] |  |
| CodeBlock | [x] | [x] |  |
| InlineCode | [x] | [x] | Inline code content is fixed to preserve surrounding layout context; use code examples for alternate snippets. |
| Markdown | [x] | [x] |  |
| Collapsible | [x] | [x] | Expanded content children are not controllable. |
| Accordion | [x] | [x] | Section arrays and section content are not controllable. |
| Details | [x] | [x] | Child content is not controllable. |
| ExpandableText | [x] | [x] | Long-form text content is not controllable. |
| FormField | [x] | [x] |  |
| FormGroup | [x] | [x] |  |
| Sparkline | [x] | [x] |  |
| BarChart | [x] | [x] |  |
| VerticalBarChart | [x] | [x] |  |
| StackedBarChart | [x] | [x] | Series segment data is not controllable. |
| LineChart | [x] | [x] | Series arrays are not controllable. |
| AreaChart | [x] | [x] | Series data is not controllable. |
| ScatterPlot | [x] | [x] |  |
| RadarChart | [x] | [x] | Axis and series arrays are not controllable. |
| Gauge | [x] | [x] |  |
| LinearGauge | [x] | [x] |  |
| MeterGauge | [x] | [x] |  |
| ArcGauge | [x] | [x] |  |
| DialGauge | [x] | [x] |  |
| BatteryGauge | [x] | [x] |  |
| Heatmap | [x] | [x] |  |
| ContributionGraph | [x] | [x] | Contribution datasets are not controllable. |
| CalendarHeatmap | [x] | [x] | Contribution datasets are not controllable. |
| CorrelationMatrix | [x] | [x] | Matrix inputs are not controllable. |
| GanttChart | [x] | [x] | Task collections are not controllable. |
| TimeHeatmap | [x] | [x] | Heatmap datasets are not controllable. |
| Legend | [x] | [x] | Legend item arrays are not controllable. |
| SplitView | [x] | [x] |  |
| SplashScreen | [x] | [x] |  |
| TuiuiuSplash | [x] | [x] | Preset art and branding are fixed; only preset behavior is demonstrated. |
| ImpactSplashScreen | [x] | [x] | Preset art composition is not controllable. |
| MinimalSplash | [x] | [x] | Preset layout composition is not controllable. |
| ProgressSplash | [x] | [x] | Preset layout composition is not controllable. |
| Waveform | [x] | [x] |  |

## Organisms

| Component | Story | Controls | Notes |
| --- | --- | --- | --- |
| Modal | [x] | [x] |  |
| ConfirmDialog | [x] | [x] |  |
| Toast | [x] | [x] |  |
| AlertBox | [x] | [x] |  |
| Window | [x] | [x] |  |
| CommandPalette | [x] | [x] |  |
| GoToDialog | [x] | [x] |  |
| SplitPanel | [x] | [x] |  |
| ThreePanel | [x] | [x] |  |
| ScrollArea | [x] | [x] |  |
| VirtualList | [x] | [x] |  |
| ScrollableText | [x] | [x] |  |
| LogViewer | [x] | [x] |  |
| ScrollList | [x] | [x] |  |
| ChatList | [x] | [x] |  |
| Grid | [x] | [x] | Named area definitions are not controllable. |
| GridItem | [x] | [x] | Span/layout placement is not controllable. |
| GridRow | [x] | [x] | Column content arrays are not controllable. |
| GridColumn | [x] | [x] | Row content arrays are not controllable. |
| AutoGrid | [x] | [x] | Responsive item arrays are not controllable. |
| DashboardGrid | [x] | [x] | Dashboard widget arrays are not controllable. |
| MasonryGrid | [x] | [x] | Masonry card arrays are not controllable. |
| DataTable | [x] | [x] |  |
| VirtualDataTable | [x] | [x] |  |
| EditableDataTable | [x] | [x] | Inline editing is interactive; callback results are not persisted by the static story. |
| FileBrowser | [x] | [x] |  |
| FileDirectoryTree | [x] | [x] | File tree datasets are not controllable. |
| FileList | [x] | [x] | File item datasets are not controllable. |
| PathBreadcrumbs | [x] | [x] | Path segments are not controllable. |
| FileDetails | [x] | [x] | File metadata objects are not controllable. |
| FilePreview | [x] | [x] | File content and preview buffers are not controllable. |
| FileIcon | [x] | [x] | File metadata objects are not controllable. |
| DirectoryIndicator | [x] | [x] | Expanded/collapsed states are shown side by side instead of a live control. |
| ScrollPanel | [x] | [x] |  |

## Templates

| Component | Story | Controls | Notes |
| --- | --- | --- | --- |
| VStack | [x] | [x] |  |
| HStack | [x] | [x] |  |
| Center | [x] | [x] |  |
| FullScreen | [x] | [x] |  |
| Spacer (templates) | [x] | [x] | No public props; spacing is layout-driven and not controllable. |
| Divider (templates) | [x] | [x] |  |
| Page | [x] | [x] |  |
| AppShell | [x] | [x] |  |
| StatusBar | [x] | [x] |  |
| Header | [x] | [x] |  |
| Container | [x] | [x] |  |
| Screen | [x] | [x] |  |
| Main | [x] | [x] |  |
| Footer | [x] | [x] |  |
| Sidebar | [x] | [x] |  |
| Panel | [x] | [x] |  |
