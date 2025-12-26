# Calendar

Interactive month view calendar with date selection and navigation.

## Import

```typescript
import { Calendar, createCalendar, MiniCalendar, DatePicker, createDatePicker } from 'tuiuiu.js'
```

## Basic Usage

```typescript
Calendar({
  onDateSelect: (date) => console.log('Selected:', date),
})
```

Output:
```
       March 2024
Su Mo Tu We Th Fr Sa
                1  2
 3  4  5  6  7  8  9
10 11 12 13 14 15 16
17 18 19 20 21 22 23
24 25 26 27 28 29 30
31
←↓↑→: nav  ⇧←⇧→: month  ↵: select  t: today
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialDate` | `Date` | today | Initial focused date |
| `selectedDates` | `Date[]` | `[]` | Selected dates |
| `events` | `CalendarEvent[]` | `[]` | Events to mark |
| `selectionMode` | `'none' \| 'single' \| 'range' \| 'multiple'` | `'single'` | Selection mode |
| `firstDayOfWeek` | `0 \| 1` | `0` | First day (0=Sun, 1=Mon) |
| `minDate` | `Date` | - | Minimum selectable date |
| `maxDate` | `Date` | - | Maximum selectable date |
| `disabledDates` | `Date[]` | `[]` | Dates that cannot be selected |
| `showWeekNumbers` | `boolean` | `false` | Show week numbers |
| `colorToday` | `ColorValue` | `'success'` | Today's date color |
| `colorSelected` | `ColorValue` | `'primary'` | Selected date color |
| `colorEvent` | `ColorValue` | `'warning'` | Event marker color |
| `colorWeekend` | `ColorValue` | `'mutedForeground'` | Weekend color |
| `colorHeader` | `ColorValue` | `'accent'` | Month/year color |
| `cellWidth` | `number` | `4` | Cell width |
| `onDateSelect` | `(date: Date) => void` | - | Selection callback |
| `onMonthChange` | `(year, month) => void` | - | Month change callback |
| `isActive` | `boolean` | `true` | Handle keyboard |
| `state` | `CalendarState` | - | External state |

## CalendarEvent Interface

| Field | Type | Description |
|-------|------|-------------|
| `date` | `string` | Date in YYYY-MM-DD format |
| `label` | `string` | Event label (optional) |
| `color` | `ColorValue` | Event marker color |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `h` | Previous day |
| `→` / `l` | Next day |
| `↑` / `k` | Previous week |
| `↓` / `j` | Next week |
| `<` / `H` | Previous month |
| `>` / `L` | Next month |
| `K` | Previous year |
| `J` | Next year |
| `Enter` / `Space` | Select date |
| `t` | Go to today |
| `Escape` | Clear selection |

## Programmatic Control

```typescript
const state = createCalendar({
  onDateSelect: (date) => console.log(date),
  selectionMode: 'range',
})

// Navigation
state.moveDay(1)          // Next day
state.moveDay(-1)         // Previous day
state.moveWeek(1)         // Next week
state.moveWeek(-1)        // Previous week
state.moveMonth(1)        // Next month
state.moveMonth(-1)       // Previous month
state.moveYear(1)         // Next year
state.moveYear(-1)        // Previous year
state.goToToday()         // Jump to today

// Selection
state.selectCursor()      // Select current cursor date
state.clearSelection()    // Clear all selections

// State access
state.cursorDate()        // Current cursor position
state.viewDate()          // Current view month
state.selectedDates()     // Array of selected dates
state.rangeStart()        // Range start (if in range mode)
state.getMonthDays()      // Get all days for current view

// Use with component
Calendar({ state })
```

## Selection Modes

### Single Selection

```typescript
Calendar({
  selectionMode: 'single',
  onDateSelect: (date) => setAppointment(date),
})
```

### Range Selection

```typescript
Calendar({
  selectionMode: 'range',
  onDateSelect: (date) => {
    // First click sets start, second click sets end
    console.log('Range:', state.selectedDates())
  },
})
```

### Multiple Selection

```typescript
Calendar({
  selectionMode: 'multiple',
  selectedDates: [new Date('2024-03-15'), new Date('2024-03-20')],
})
```

## With Events

```typescript
Calendar({
  events: [
    { date: '2024-03-15', label: 'Meeting', color: 'info' },
    { date: '2024-03-20', label: 'Deadline', color: 'destructive' },
    { date: '2024-03-25', label: 'Party', color: 'success' },
  ],
})
```

Output shows event marker (•) on those dates.

## MiniCalendar

Compact calendar widget:

```typescript
MiniCalendar({
  onDateSelect: (date) => console.log(date),
  showNavigation: true,
})
```

Uses smaller cell width (3) and no week numbers.

## DatePicker

Calendar with input field:

```typescript
DatePicker({
  placeholder: 'Select date...',
  inputWidth: 20,
  onDateSelect: (date) => setFormDate(date),
})
```

Output:
```
╭────────────────────╮
│ Select date...     │
╰────────────────────╯

// When opened:
╭────────────────────╮
│ 2024-03-15         │
╰────────────────────╯
       March 2024
...
```

### DatePicker Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `format` | `string` | `'YYYY-MM-DD'` | Date format |
| `placeholder` | `string` | `'Select date...'` | Input placeholder |
| `inputWidth` | `number` | `20` | Input field width |
| `dropdownPosition` | `'below' \| 'above'` | `'below'` | Calendar position |

### DatePicker State

```typescript
const state = createDatePicker({
  format: 'YYYY-MM-DD',
})

// Dropdown control
state.isOpen()        // Is calendar open
state.open()          // Open calendar
state.close()         // Close calendar
state.toggle()        // Toggle open/close

// Value access
state.formattedValue() // Formatted date string

// Inherits all Calendar methods
state.selectCursor()
state.moveDay(1)
// etc.
```

## Features

### Week Numbers

```typescript
Calendar({
  showWeekNumbers: true,
})
```

```
Wk Su Mo Tu We Th Fr Sa
9                 1  2
10  3  4  5  6  7  8  9
...
```

### Monday Start

```typescript
Calendar({
  firstDayOfWeek: 1, // Monday
})
```

### Date Constraints

```typescript
Calendar({
  minDate: new Date('2024-01-01'),
  maxDate: new Date('2024-12-31'),
  disabledDates: [
    new Date('2024-03-17'), // St. Patrick's Day
    new Date('2024-12-25'), // Christmas
  ],
})
```

Disabled dates appear dimmed and cannot be selected.

## Examples

### Appointment Scheduler

```typescript
function AppointmentPicker({ onSelect }) {
  const [selectedDate, setSelectedDate] = useState(null)

  return Box({ flexDirection: 'column' },
    Text({ bold: true }, 'Select Appointment Date'),
    Calendar({
      selectionMode: 'single',
      minDate: new Date(), // No past dates
      events: existingAppointments.map(a => ({
        date: formatDate(a.date),
        color: 'warning',
      })),
      onDateSelect: (date) => {
        setSelectedDate(date)
        onSelect(date)
      },
    }),
    selectedDate && Text({}, `Selected: ${selectedDate.toDateString()}`),
  )
}
```

### Date Range Picker

```typescript
function DateRangePicker({ onRangeSelect }) {
  const state = createCalendar({
    selectionMode: 'range',
    onDateSelect: () => {
      const dates = state.selectedDates()
      if (dates.length === 2) {
        onRangeSelect({
          start: dates[0],
          end: dates[dates.length - 1],
        })
      }
    },
  })

  return Box({ flexDirection: 'column' },
    Text({ bold: true }, 'Select Date Range'),
    Calendar({ state }),
    Text({ dim: true }, 'Click start date, then end date'),
  )
}
```

### Event Calendar

```typescript
const events = [
  { date: '2024-03-15', label: 'Team Meeting', color: 'info' },
  { date: '2024-03-18', label: 'Project Due', color: 'destructive' },
  { date: '2024-03-22', label: 'Conference', color: 'success' },
]

Box({ flexDirection: 'row', gap: 2 },
  Calendar({ events }),
  Box({ flexDirection: 'column' },
    Text({ bold: true }, 'Events'),
    ...events.map(e =>
      Box({ flexDirection: 'row' },
        Text({ color: e.color }, '●'),
        Text({}, ` ${e.date}: ${e.label}`),
      )
    ),
  ),
)
```

### Form with DatePicker

```typescript
Box({ flexDirection: 'column', gap: 1 },
  TextInput({ label: 'Event Name' }),
  DatePicker({
    placeholder: 'Event date...',
    inputWidth: 25,
  }),
  TextInput({ label: 'Location' }),
  Button({ label: 'Create Event' }),
)
```

## Related

- [Select](/components/molecules/select.md) - Dropdown selection
- [TextInput](/components/atoms/text-input.md) - Text input
- [Modal](/components/organisms/modal.md) - Modal dialogs

