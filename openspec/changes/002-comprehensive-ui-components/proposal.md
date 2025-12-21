# Proposal: Comprehensive UI Components for Tuiuiu

## Change ID
`002-comprehensive-ui-components`

## Summary
Add 25+ new UI components to Tuiuiu based on analysis of 8 leading TUI libraries (Blessed, Rich, Textual, Ratatui, PTerms, TUI-GO, IOCraft, ZAZ). This includes data visualization charts, advanced form controls, layout components, and core infrastructure for mouse support, theming, and animations.

## Motivation

### Problem Statement
Tuiuiu currently lacks essential components for building production-grade terminal applications:

1. **No Data Visualization**: No charts, sparklines, gauges, or heatmaps for dashboards
2. **Limited Form Controls**: Missing multi-select, autocomplete, radio groups, sliders
3. **Basic Layout Options**: No tabs, collapsible sections, or grid layout
4. **No Mouse Support**: All interaction is keyboard-only
5. **No Theming System**: Colors are hardcoded per-component
6. **No Animations**: Static transitions feel outdated

### Why Now?
- Growing demand for terminal-based dashboards and monitoring tools
- Competitors (Ink, Blessed, Textual) offer richer component sets
- Need to establish Tuiuiu as a complete solution, not just a primitive library

### Research Conducted
Analyzed 8 TUI libraries across 4 languages:

| Library | Language | Key Insights |
|---------|----------|--------------|
| Blessed | JavaScript | 34 widgets, DOM-like API, comprehensive form controls |
| Rich | Python | Sophisticated progress bars, excellent markdown rendering |
| Textual | Python | CSS theming, Sparkline widget, reactive architecture |
| Ratatui | Rust | BarChart, Canvas shapes, high-performance rendering |
| PTerms | Go | Heatmaps, fuzzy search, interactive components |
| TUI-GO | Go | Grid layout, table styling, focus management |
| IOCraft | Rust | React-like hooks, context providers |
| ZAZ | Rust | Sixel/Kitty image protocols, incremental rendering |

## Proposed Solution

### Core Infrastructure (4 items)
- `useMouse` hook for mouse event handling
- `ThemeProvider` + `useTheme` for theming system
- `useAnimation` + `Transition` for smooth animations
- `setRenderMode` + `detectTerminalCapabilities` for ASCII fallback

### Data Visualization (4 components)
- `Sparkline` - Inline mini-charts using Unicode blocks
- `BarChart` - Horizontal/vertical bar charts
- `LineChart` - Multi-series line charts with axes
- `Gauge` - Progress gauges (semicircle, arc, linear)

### Data Display (3 components)
- `Tree` - Hierarchical data with expand/collapse
- `DataTable` - Sorting, filtering, pagination, selection
- `Calendar` - Month view with date selection

### Forms (5 components)
- `MultiSelect` - Multi-selection with fuzzy search
- `Autocomplete` - Text input with suggestions
- `RadioGroup` - Single-select radio buttons
- `Switch` - Boolean toggle switch
- `Slider` - Numeric value slider

### Layout (4 components)
- `Tabs` - Tabbed content switcher
- `Collapsible` - Expandable/collapsible sections
- `ScrollArea` - Scrollable content with scrollbar
- `Grid` - CSS Grid-like layout system

### Visual (3 components)
- `BigText` - Large ASCII art text (figlet-style)
- `Digits` - LCD-style numeric display
- `Tooltip` - Hover/focus tooltips

### Advanced/Future (2 components)
- `DirectoryTree` - File system browser
- `Heatmap` - 2D color intensity visualization

## Impact Analysis

### Benefits
1. **Complete Design System**: Developers can build full applications without external deps
2. **Dashboard Capability**: Charts enable monitoring and analytics UIs
3. **Better UX**: Mouse support, animations, and theming improve usability
4. **Competitive Parity**: Matches or exceeds Ink/Blessed feature sets

### Risks
1. **Scope Creep**: 25+ components is ambitious
2. **API Complexity**: Must maintain simple, consistent APIs
3. **Performance**: Charts and animations may impact render performance
4. **Testing Burden**: 80% coverage target requires significant test code

### Mitigation
- Phased implementation (4 sprints)
- Strict API conventions (createX/renderX pattern)
- Performance benchmarks for each component
- Test templates for common patterns

## Success Metrics
- [ ] All 25 components implemented and exported
- [ ] 80%+ test coverage on all components
- [ ] Storybook examples for each component
- [ ] Mouse support working on all interactive components
- [ ] ASCII fallback for all visual components
- [ ] Dark/Light theme presets working
- [ ] Zero external dependencies maintained

## Stakeholders
- **Primary**: Tuiuiu users building CLI applications
- **Secondary**: Tetis internal tools and dashboards
- **Reviewers**: Core maintainers

## Timeline
- **Sprint 1**: Core infrastructure + Data Visualization
- **Sprint 2**: Forms + Data Display
- **Sprint 3**: Layout + Visual
- **Sprint 4**: Advanced + Polish

## References
- [Blessed GitHub](https://github.com/chjj/blessed)
- [Textual Widgets](https://textual.textualize.io/widgets/)
- [Ratatui Widgets](https://ratatui.rs/widgets/)
- [PTerms Printers](https://pterm.sh/)
