# Spec: Data Display Components

## ADDED Requirements

### REQ-DATA-001: Tree Component
The system MUST provide a Tree component for hierarchical data display.

#### Scenario: Render tree structure
- GIVEN nodes: [{id: '1', label: 'Root', children: [{id: '2', label: 'Child'}]}]
- WHEN Tree is rendered
- THEN it displays the hierarchy with proper indentation and connectors

#### Scenario: Expand/collapse nodes
- GIVEN a tree with expanded: ['1']
- WHEN user presses Enter on a collapsed node
- THEN the node expands and children are visible

#### Scenario: Keyboard navigation
- GIVEN a focused Tree component
- WHEN user presses up/down arrows
- THEN selection moves between visible nodes

#### Scenario: Mouse click selection
- GIVEN a Tree with mouse support
- WHEN user clicks on a node
- THEN that node becomes selected

#### Scenario: Custom icons
- GIVEN nodes with icon property
- WHEN Tree is rendered
- THEN each node displays its custom icon

#### Scenario: ASCII fallback
- GIVEN renderMode is 'ascii'
- WHEN Tree is rendered
- THEN it uses '|--' and '`--' instead of '├──' and '└──'

---

### REQ-DATA-002: DataTable Component (Enhanced)
The system MUST provide an enhanced DataTable with sorting, filtering, and pagination.

#### Scenario: Sortable columns
- GIVEN columns with sortable: true
- WHEN user presses Enter on a column header
- THEN data is sorted by that column

#### Scenario: Sort direction toggle
- GIVEN a column sorted ascending
- WHEN user activates the same column again
- THEN sort direction toggles to descending

#### Scenario: Row selection
- GIVEN selectable: true
- WHEN user presses Space on a row
- THEN the row becomes selected

#### Scenario: Multi-select mode
- GIVEN multiSelect: true
- WHEN user selects multiple rows
- THEN all selected rows are tracked

#### Scenario: Pagination
- GIVEN pageSize: 10 with 25 rows of data
- WHEN DataTable is rendered
- THEN only 10 rows are visible with page controls

#### Scenario: Page navigation
- GIVEN current page is 1
- WHEN user navigates to page 2
- THEN rows 11-20 are displayed

---

### REQ-DATA-003: Calendar Component
The system MUST provide a Calendar component for date display and selection.

#### Scenario: Month view
- GIVEN a Calendar component
- WHEN rendered
- THEN it displays a month grid with day numbers

#### Scenario: Date selection
- GIVEN a Calendar with isActive: true
- WHEN user presses Enter on a date
- THEN onSelect is called with the selected Date

#### Scenario: Marked dates
- GIVEN markedDates: [{date: new Date('2025-01-15'), color: 'green'}]
- WHEN Calendar is rendered
- THEN January 15th is highlighted in green

#### Scenario: Month navigation
- GIVEN a Calendar showing January
- WHEN user presses right arrow on last day
- THEN February is displayed

#### Scenario: Week numbers
- GIVEN showWeekNumbers: true
- WHEN Calendar is rendered
- THEN week numbers are displayed on the left

#### Scenario: Start of week
- GIVEN startOfWeek: 1 (Monday)
- WHEN Calendar is rendered
- THEN weeks start with Monday instead of Sunday

---

## API Specifications

### TreeNode Interface
```typescript
interface TreeNode<T = any> {
  id: string
  label: string
  data?: T
  children?: TreeNode<T>[]
  icon?: string
  color?: string
}
```

### TreeOptions
```typescript
interface TreeOptions<T = any> {
  nodes: TreeNode<T>[]
  expanded?: string[]           // initially expanded node IDs
  showLines?: boolean           // default: true
  lineStyle?: 'ascii' | 'unicode'  // default: 'unicode'
  icons?: {
    expanded: string            // default: '▼'
    collapsed: string           // default: '▶'
    leaf: string                // default: '•'
  }
  selectable?: boolean          // default: true
  onSelect?: (node: TreeNode<T>) => void
  onToggle?: (node: TreeNode<T>, expanded: boolean) => void
  isActive?: boolean
}
```

### DataTableColumn
```typescript
interface DataTableColumn {
  key: string
  header: string
  width?: number | 'auto'
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  render?: (value: any, row: any) => string
}
```

### DataTableOptions
```typescript
interface DataTableOptions<T = any> {
  columns: DataTableColumn[]
  data: T[]
  sortable?: boolean            // default: true
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
  selectable?: boolean          // default: false
  multiSelect?: boolean         // default: false
  pageSize?: number             // 0 = no pagination
  page?: number                 // default: 1
  showPagination?: boolean      // default: true when pageSize > 0
  onSort?: (column: string, direction: 'asc' | 'desc') => void
  onSelect?: (rows: T[]) => void
  onPageChange?: (page: number) => void
  isActive?: boolean
}
```

### CalendarOptions
```typescript
interface CalendarOptions {
  selectedDate?: Date
  markedDates?: Array<{
    date: Date
    color?: string
    label?: string
  }>
  startOfWeek?: 0 | 1           // 0 = Sunday, 1 = Monday
  showWeekNumbers?: boolean     // default: false
  onSelect?: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  isActive?: boolean
}
```

---

## Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/data-display/tree.ts` | CREATE | Tree component |
| `src/components/data-display/data-table.ts` | CREATE | Enhanced DataTable |
| `src/components/data-display/calendar.ts` | CREATE | Calendar component |
| `src/components/data-display/index.ts` | CREATE | Re-exports |
| `tests/components/data-display/tree.test.ts` | CREATE | Tests |
| `tests/components/data-display/data-table.test.ts` | CREATE | Tests |
| `tests/components/data-display/calendar.test.ts` | CREATE | Tests |
