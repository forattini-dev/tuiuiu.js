# Heatmaps

Grid-based heatmap visualizations for displaying data density, activity over time, and correlations.

## Import

```typescript
import {
  Heatmap,
  ContributionGraph,
  CalendarHeatmap,
  CorrelationMatrix,
  TimeHeatmap,
} from 'tuiuiu.js'
```

## Heatmap

General-purpose 2D grid heatmap.

### Basic Usage

```typescript
Heatmap({
  data: [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9],
  ],
  colorScale: 'heat',
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `HeatmapData` | required | 2D array of numbers or `{ value, label?, tooltip? }` |
| `columnHeaders` | `string[]` | - | Column headers |
| `rowHeaders` | `string[]` | - | Row headers |
| `minValue` | `number` | auto | Minimum value |
| `maxValue` | `number` | auto | Maximum value |
| `colorScale` | `ColorScale \| 'heat' \| 'cool' \| 'viridis' \| 'grayscale'` | `'heat'` | Color scale |
| `cellWidth` | `number` | `3` | Cell width in characters |
| `showValues` | `boolean` | `false` | Show values in cells |
| `formatValue` | `(value: number) => string` | - | Value formatter |
| `showBorder` | `boolean` | `false` | Show cell borders |
| `borderColor` | `ColorValue` | - | Border color |
| `interactive` | `boolean` | `false` | Enable keyboard navigation |
| `isActive` | `boolean` | `true` | Is active for input |
| `onSelect` | `(row, col, value) => void` | - | Selection callback |

### With Headers

```typescript
Heatmap({
  data: weeklyData,
  columnHeaders: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  rowHeaders: ['Week 1', 'Week 2', 'Week 3'],
  showValues: true,
  colorScale: 'viridis',
})
```

### Color Scales

Available built-in color scales:

- `'heat'` - Red to yellow to white (default)
- `'cool'` - Blue to cyan
- `'viridis'` - Purple to yellow (colorblind-friendly)
- `'grayscale'` - Black to white

```typescript
// Custom color scale
Heatmap({
  data: matrix,
  colorScale: ['#0d47a1', '#2196f3', '#64b5f6', '#bbdefb'],
})
```

## ContributionGraph

GitHub-style contribution heatmap showing activity over time.

### Basic Usage

```typescript
ContributionGraph({
  data: [
    { date: '2024-01-01', count: 5 },
    { date: '2024-01-02', count: 10 },
    { date: '2024-01-03', count: 0 },
    // ...
  ],
  weeks: 52,
  colorScale: 'greens',
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ContributionData[]` | required | Array of `{ date, count }` |
| `weeks` | `number` | `52` | Number of weeks to show |
| `startDate` | `Date \| string` | - | Custom start date |
| `endDate` | `Date \| string` | - | Custom end date |
| `colorScale` | `'greens' \| 'blues' \| 'reds' \| 'purples' \| 'oranges' \| ColorScale` | `'greens'` | Color scale |
| `showMonths` | `boolean` | `true` | Show month labels |
| `showDays` | `boolean` | `true` | Show day labels (Mon, Wed, Fri) |
| `formatValue` | `(count: number) => string` | - | Value formatter |

### Different Color Scales

```typescript
// Blue theme for coding stats
ContributionGraph({
  data: codingActivity,
  colorScale: 'blues',
})

// Red theme for error tracking
ContributionGraph({
  data: errorLogs,
  colorScale: 'reds',
})
```

## CalendarHeatmap

Full year calendar view organized by month.

### Basic Usage

```typescript
CalendarHeatmap({
  data: yearlyData,
  year: 2024,
  colorScale: 'greens',
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `ContributionData[]` | required | Array of `{ date, count }` |
| `year` | `number` | current year | Year to display |
| `colorScale` | `ColorScale \| 'heat' \| 'greens'` | `'greens'` | Color scale |
| `showLegend` | `boolean` | `true` | Show legend |

### Example

```typescript
function YearlyActivityView() {
  const [year, setYear] = useState(2024)
  const data = useActivityData(year)

  return Box({ flexDirection: 'column', gap: 1 },
    Box({ flexDirection: 'row', justifyContent: 'space-between' },
      Button({ label: '◀', onClick: () => setYear(y => y - 1) }),
      Text({ bold: true }, `Activity ${year()}`),
      Button({ label: '▶', onClick: () => setYear(y => y + 1) }),
    ),
    CalendarHeatmap({
      data: data(),
      year: year(),
      colorScale: 'greens',
    }),
  )
}
```

## CorrelationMatrix

Statistical correlation heatmap for displaying correlation coefficients.

### Basic Usage

```typescript
CorrelationMatrix({
  labels: ['A', 'B', 'C'],
  correlations: [
    [1.0, 0.8, -0.3],
    [0.8, 1.0, 0.5],
    [-0.3, 0.5, 1.0],
  ],
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `labels` | `string[]` | required | Labels for variables |
| `correlations` | `number[][]` | required | Correlation matrix data |
| `showValues` | `boolean` | `true` | Show correlation values |
| `decimals` | `number` | `2` | Decimal places |

### Color Coding

CorrelationMatrix automatically colors values:
- **Red**: Negative correlations (-1 to 0)
- **White**: No correlation (0)
- **Blue**: Positive correlations (0 to +1)

```typescript
// Data analysis example
CorrelationMatrix({
  labels: ['Price', 'Volume', 'Sentiment', 'Volatility'],
  correlations: calculateCorrelations(stockData),
  decimals: 3,
})
```

## TimeHeatmap

Activity heatmap with configurable time granularity.

### Basic Usage

```typescript
TimeHeatmap({
  data: [
    { date: '2024-01-01', value: 5 },
    { date: '2024-01-02', value: 10 },
  ],
  granularity: 'day',
  colorScale: 'greens',
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `TimeHeatmapData[]` | required | Array of `{ date, value }` |
| `granularity` | `'day' \| 'week' \| 'month'` | `'day'` | Time granularity |
| `startDate` | `Date \| string` | 1 year ago | Start date |
| `endDate` | `Date \| string` | today | End date |
| `colorScale` | `ColorValue[] \| 'greens' \| 'blues' \| 'reds' \| 'heat'` | `'greens'` | Color scale |
| `showLegend` | `boolean` | `true` | Show legend |
| `title` | `string` | - | Chart title |

### Granularity Examples

```typescript
// Daily activity (default)
TimeHeatmap({
  data: dailyData,
  granularity: 'day',
})

// Weekly summary
TimeHeatmap({
  data: weeklyData,
  granularity: 'week',
  title: 'Weekly Activity',
})

// Monthly overview
TimeHeatmap({
  data: monthlyData,
  granularity: 'month',
  title: 'Monthly Summary',
})
```

## Dashboard Example

```typescript
function ActivityDashboard() {
  const contributions = useContributions()
  const correlations = useCorrelations()
  const performance = usePerformanceData()

  return Box({ flexDirection: 'column', gap: 2 },
    // Activity graph
    Box({ borderStyle: 'round', padding: 1 },
      Text({ bold: true, marginBottom: 1 }, 'Contribution Activity'),
      ContributionGraph({
        data: contributions(),
        weeks: 26,
        showMonths: true,
      }),
    ),

    // Performance heatmap
    Box({ flexDirection: 'row', gap: 2 },
      Box({ borderStyle: 'single', padding: 1 },
        Text({ bold: true, marginBottom: 1 }, 'Weekly Performance'),
        Heatmap({
          data: performance().matrix,
          columnHeaders: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          rowHeaders: performance().teams,
          colorScale: 'viridis',
          showValues: true,
        }),
      ),

      Box({ borderStyle: 'single', padding: 1 },
        Text({ bold: true, marginBottom: 1 }, 'Metric Correlations'),
        CorrelationMatrix({
          labels: correlations().labels,
          correlations: correlations().matrix,
        }),
      ),
    ),
  )
}
```

## Related

- [Gauges](gauges.md) - Gauge displays
- [Charts](charts.md) - Line and area charts
- [Bar Charts](bar-chart.md) - Bar chart visualizations
