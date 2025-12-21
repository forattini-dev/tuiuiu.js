# Spec: Layout Components

## ADDED Requirements

### REQ-LAYOUT-001: Tabs Component
The system MUST provide a Tabs component for tabbed content navigation.

#### Scenario: Render tabs
- GIVEN tabs: [{id: 'a', label: 'Tab A', content: ...}, {id: 'b', label: 'Tab B', content: ...}]
- WHEN Tabs is rendered
- THEN tab headers are displayed with the first tab's content visible

#### Scenario: Switch tabs via keyboard
- GIVEN a focused Tabs component
- WHEN user presses left/right arrows
- THEN active tab changes and content updates

#### Scenario: Switch tabs via mouse
- GIVEN a Tabs component with mouse support
- WHEN user clicks on a tab header
- THEN that tab becomes active

#### Scenario: Top/bottom position
- GIVEN position: 'bottom'
- WHEN Tabs is rendered
- THEN tab headers appear below the content

#### Scenario: Tab styles
- GIVEN style: 'pills'
- WHEN Tabs is rendered
- THEN tabs appear as pill-shaped buttons

#### Scenario: Disabled tab
- GIVEN a tab with disabled: true
- WHEN user tries to select it
- THEN selection is prevented

---

### REQ-LAYOUT-002: Collapsible Component
The system MUST provide a Collapsible component for expandable sections.

#### Scenario: Collapsed by default
- GIVEN expanded: false (default)
- WHEN Collapsible is rendered
- THEN only the title is visible

#### Scenario: Expand on click
- GIVEN a collapsed section
- WHEN user presses Enter or clicks
- THEN content becomes visible

#### Scenario: Toggle indicator
- GIVEN icons: { expanded: '▼', collapsed: '▶' }
- WHEN section is collapsed
- THEN '▶' is displayed next to title

#### Scenario: Animated transition
- GIVEN animation support enabled
- WHEN section expands
- THEN content slides in smoothly

---

### REQ-LAYOUT-003: ScrollArea Component
The system MUST provide a ScrollArea component for scrollable content.

#### Scenario: Vertical scrolling
- GIVEN content taller than height
- WHEN ScrollArea is rendered
- THEN only visible portion is displayed with scrollbar

#### Scenario: Keyboard scrolling
- GIVEN a focused ScrollArea
- WHEN user presses up/down arrows
- THEN content scrolls by one line

#### Scenario: Page up/down
- GIVEN a focused ScrollArea
- WHEN user presses Page Up/Down
- THEN content scrolls by visible height

#### Scenario: Mouse wheel scrolling
- GIVEN mouse support enabled
- WHEN user scrolls mouse wheel
- THEN content scrolls accordingly

#### Scenario: Scrollbar position
- GIVEN content scrolled 50% down
- WHEN ScrollArea is rendered
- THEN scrollbar thumb is positioned at 50%

#### Scenario: Auto-scroll to bottom
- GIVEN autoScrollBottom: true
- WHEN new content is added
- THEN view scrolls to show new content

---

### REQ-LAYOUT-004: Grid Component
The system MUST provide a Grid component for CSS Grid-like layouts.

#### Scenario: Column grid
- GIVEN columns: 3
- WHEN Grid is rendered with 6 children
- THEN children are arranged in 2 rows of 3 columns

#### Scenario: Column template
- GIVEN columns: '1fr 2fr 1fr'
- WHEN Grid is rendered
- THEN middle column takes twice the width

#### Scenario: Gap between cells
- GIVEN gap: 2
- WHEN Grid is rendered
- THEN 2 characters of space between cells

#### Scenario: Cell spanning
- GIVEN a child with colSpan: 2
- WHEN Grid is rendered
- THEN that child spans 2 columns

#### Scenario: Row spanning
- GIVEN a child with rowSpan: 2
- WHEN Grid is rendered
- THEN that child spans 2 rows

---

## API Specifications

### TabsOptions
```typescript
interface TabsOptions {
  tabs: Array<{
    id: string
    label: string
    content: VNode
    icon?: string
    disabled?: boolean
  }>
  activeTab?: string            // default: first tab
  position?: 'top' | 'bottom'   // default: 'top'
  style?: 'line' | 'box' | 'pills'  // default: 'line'
  onChange?: (tabId: string) => void
  isActive?: boolean
}
```

### CollapsibleOptions
```typescript
interface CollapsibleOptions {
  title: string
  content: VNode
  expanded?: boolean            // default: false
  onToggle?: (expanded: boolean) => void
  icons?: {
    expanded: string            // default: '▼'
    collapsed: string           // default: '▶'
  }
  borderStyle?: 'none' | 'single' | 'round'  // default: 'none'
  animated?: boolean            // default: false
}
```

### ScrollAreaOptions
```typescript
interface ScrollAreaOptions {
  content: VNode
  height: number
  width?: number
  showScrollbar?: boolean       // default: true
  scrollbarPosition?: 'left' | 'right'  // default: 'right'
  scrollTop?: number            // default: 0
  onScroll?: (scrollTop: number) => void
  autoScrollBottom?: boolean    // default: false
  isActive?: boolean
}
```

### GridOptions
```typescript
interface GridOptions {
  columns?: number | string     // number or template like '1fr 2fr 1fr'
  rows?: number | string
  gap?: number                  // default: 0
  children: Array<{
    content: VNode
    column?: number | string    // 1-indexed or span
    row?: number | string
    colSpan?: number            // default: 1
    rowSpan?: number            // default: 1
  }>
}
```

---

## Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/layout/tabs.ts` | CREATE | Tabs component |
| `src/components/layout/collapsible.ts` | CREATE | Collapsible component |
| `src/components/layout/scroll-area.ts` | CREATE | ScrollArea component |
| `src/components/layout/grid.ts` | CREATE | Grid component |
| `src/components/layout/index.ts` | CREATE | Re-exports |
| `tests/components/layout/*.test.ts` | CREATE | Tests for each |
