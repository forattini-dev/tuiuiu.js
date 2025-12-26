# Charts

Line charts, area charts, scatter plots, and specialized chart components for data visualization.

## Import

```typescript
import {
  LineChart,
  AreaChart,
  ScatterPlot,
  RadarChart,
  GanttChart,
  Legend,
} from 'tuiuiu.js'
```

## LineChart

Multi-series line chart with axes, legends, and grid support.

### Basic Usage

```typescript
LineChart({
  series: [
    { name: 'Sales', data: [10, 25, 30, 45, 60, 55, 70], color: 'cyan' },
  ],
  width: 50,
  height: 10,
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `series` | `DataSeries[]` | required | Array of data series |
| `width` | `number` | `60` | Chart width in characters |
| `height` | `number` | `15` | Chart height in rows |
| `xAxis` | `AxisOptions` | - | X-axis configuration |
| `yAxis` | `AxisOptions` | - | Y-axis configuration |
| `showLegend` | `boolean` | auto | Show legend |
| `legendPosition` | `'top' \| 'bottom' \| 'right'` | `'bottom'` | Legend position |
| `showGrid` | `boolean` | `false` | Show grid lines |
| `gridColor` | `ColorValue` | - | Grid color |
| `title` | `string` | - | Chart title |
| `titleColor` | `ColorValue` | - | Title color |
| `borderStyle` | `'none' \| 'single' \| 'double'` | `'none'` | Border style |

### Multi-Series

```typescript
LineChart({
  series: [
    { name: 'CPU', data: cpuHistory, color: 'green' },
    { name: 'Memory', data: memHistory, color: 'yellow' },
    { name: 'Disk', data: diskHistory, color: 'blue' },
  ],
  yAxis: { min: 0, max: 100, label: '%' },
  showLegend: true,
  showGrid: true,
})
```

### Axis Options

```typescript
interface AxisOptions {
  show?: boolean        // Show axis (default: true)
  label?: string        // Axis label
  min?: number          // Minimum value
  max?: number          // Maximum value
  ticks?: number        // Number of ticks
  formatter?: (v: number) => string  // Value formatter
}

LineChart({
  series: [{ name: 'Revenue', data: revenueData, color: 'green' }],
  xAxis: {
    label: 'Month',
    formatter: (v) => months[v],
  },
  yAxis: {
    min: 0,
    label: 'USD',
    formatter: (v) => `$${v.toLocaleString()}`,
  },
})
```

## AreaChart

Filled area chart for single data series.

### Basic Usage

```typescript
AreaChart({
  data: [10, 25, 30, 45, 60, 55, 70],
  color: 'cyan',
  width: 50,
  height: 10,
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `DataPoint[] \| number[]` | required | Data points |
| `color` | `ColorValue` | `'cyan'` | Fill color |
| `name` | `string` | `'Data'` | Series name |
| `width` | `number` | `60` | Chart width |
| `height` | `number` | `15` | Chart height |
| `xAxis` | `AxisOptions` | - | X-axis options |
| `yAxis` | `AxisOptions` | - | Y-axis options |
| `title` | `string` | - | Chart title |

### With Title and Axes

```typescript
AreaChart({
  data: networkTraffic,
  color: 'green',
  title: 'Network Traffic',
  yAxis: {
    label: 'MB/s',
    formatter: (v) => `${v} MB/s`,
  },
})
```

## ScatterPlot

Two-dimensional scatter plot for correlation analysis.

### Basic Usage

```typescript
ScatterPlot({
  points: [
    { x: 1, y: 2 },
    { x: 2, y: 4 },
    { x: 3, y: 6 },
    { x: 4, y: 5 },
  ],
  width: 50,
  height: 15,
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `points` | `ScatterPoint[]` | required | Data points |
| `width` | `number` | `60` | Chart width |
| `height` | `number` | `15` | Chart height |
| `xAxis` | `AxisOptions` | - | X-axis options |
| `yAxis` | `AxisOptions` | - | Y-axis options |
| `markerStyle` | `'circle' \| 'square' \| 'diamond' \| 'plus' \| 'star' \| 'cross'` | `'circle'` | Marker style |
| `colorMode` | `'value' \| 'category' \| 'uniform'` | `'uniform'` | Color mode |
| `color` | `ColorValue` | `'cyan'` | Color for uniform mode |
| `colorScale` | `ColorValue[]` | - | Colors for value mode |
| `title` | `string` | - | Chart title |
| `showLegend` | `boolean` | `false` | Show legend |
| `onPointClick` | `(point, index) => void` | - | Click handler |

### Color by Value

```typescript
ScatterPlot({
  points: dataWithValues.map(d => ({
    x: d.x,
    y: d.y,
    value: d.intensity,
  })),
  colorMode: 'value',
  colorScale: ['blue', 'cyan', 'green', 'yellow', 'red'],
  title: 'Intensity Distribution',
})
```

### Color by Category

```typescript
ScatterPlot({
  points: categorizedData.map(d => ({
    x: d.x,
    y: d.y,
    category: d.group,
  })),
  colorMode: 'category',
  showLegend: true,
})
```

## RadarChart

Multi-dimensional radar (spider) chart.

### Basic Usage

```typescript
RadarChart({
  axes: [
    { name: 'Speed', max: 100 },
    { name: 'Power', max: 100 },
    { name: 'Range', max: 100 },
    { name: 'Efficiency', max: 100 },
    { name: 'Durability', max: 100 },
  ],
  series: [
    { name: 'Model A', values: [80, 75, 70, 85, 80], color: 'cyan' },
    { name: 'Model B', values: [70, 85, 80, 75, 90], color: 'green' },
  ],
  size: 20,
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `axes` | `RadarAxis[]` | required | Axis definitions |
| `series` | `RadarSeries[]` | required | Data series |
| `size` | `number` | `20` | Chart size |
| `showLegend` | `boolean` | `true` | Show legend |
| `title` | `string` | - | Chart title |

### Comparison Example

```typescript
function ProductComparison({ products }) {
  const axes = [
    { name: 'Performance', max: 10 },
    { name: 'Price', max: 10 },
    { name: 'Quality', max: 10 },
    { name: 'Support', max: 10 },
    { name: 'Features', max: 10 },
  ]

  const series = products.map((p, i) => ({
    name: p.name,
    values: [p.perf, p.price, p.quality, p.support, p.features],
    color: ['cyan', 'green', 'yellow', 'magenta'][i % 4],
  }))

  return RadarChart({
    axes,
    series,
    title: 'Product Comparison',
  })
}
```

## GanttChart

Project timeline visualization with tasks and milestones.

### Basic Usage

```typescript
GanttChart({
  tasks: [
    {
      id: '1',
      name: 'Design',
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      progress: 100,
      status: 'complete',
    },
    {
      id: '2',
      name: 'Development',
      startDate: '2024-01-15',
      endDate: '2024-02-15',
      progress: 60,
      status: 'in-progress',
    },
    {
      id: '3',
      name: 'Release',
      startDate: '2024-02-15',
      endDate: '2024-02-15',
      isMilestone: true,
    },
  ],
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tasks` | `GanttTask[]` | required | Array of tasks |
| `width` | `number` | `80` | Chart width |
| `title` | `string` | - | Chart title |
| `showLegend` | `boolean` | `true` | Show status legend |

### Task Properties

```typescript
interface GanttTask {
  id: string
  name: string
  startDate: string | Date
  endDate: string | Date
  progress?: number        // 0-100
  status?: 'pending' | 'in-progress' | 'complete' | 'blocked'
  isMilestone?: boolean    // Diamond marker
  dependsOn?: string[]     // Task IDs
}
```

## Legend

Reusable legend component for any chart.

### Basic Usage

```typescript
Legend({
  items: [
    { label: 'Series 1', color: 'cyan' },
    { label: 'Series 2', color: 'green' },
    { label: 'Series 3', color: 'yellow' },
  ],
  position: 'bottom',
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `LegendItem[]` | required | Legend items |
| `position` | `'top' \| 'bottom' \| 'right' \| 'left'` | `'bottom'` | Position |
| `showSymbols` | `boolean` | `true` | Show symbols |
| `symbolType` | `'circle' \| 'square' \| 'line'` | `'circle'` | Symbol type |
| `interactive` | `boolean` | `false` | Enable clicking |
| `gap` | `number` | - | Gap between items |
| `onItemClick` | `(index, label) => void` | - | Click handler |
| `isActive` | `boolean` | - | Is active for input |
| `state` | `LegendState` | - | External state |

### Interactive Legend

```typescript
const legendState = createLegend({
  items: series.map(s => ({ label: s.name, color: s.color })),
})

Box({ flexDirection: 'column' },
  LineChart({
    series: series.filter((_, i) => legendState.isVisible(i)),
    // ...other props
  }),
  Legend({
    items: legendState.items(),
    interactive: true,
    state: legendState,
    onItemClick: (idx) => legendState.toggle(idx),
  }),
)
```

## Dashboard Example

```typescript
function AnalyticsDashboard() {
  const metrics = useMetrics()
  const timeline = useTimeline()
  const comparison = useComparison()

  return Box({ flexDirection: 'column', gap: 2 },
    // Top row: Line chart
    Box({ borderStyle: 'round', padding: 1 },
      LineChart({
        series: metrics().series,
        title: 'Performance Metrics',
        showLegend: true,
        showGrid: true,
        height: 12,
      }),
    ),

    // Middle row: Scatter + Radar
    Box({ flexDirection: 'row', gap: 2 },
      Box({ borderStyle: 'single', padding: 1, flexGrow: 1 },
        ScatterPlot({
          points: metrics().scatter,
          title: 'Correlation Analysis',
          colorMode: 'value',
          height: 10,
        }),
      ),
      Box({ borderStyle: 'single', padding: 1 },
        RadarChart({
          axes: comparison().axes,
          series: comparison().series,
          title: 'Comparison',
          size: 15,
        }),
      ),
    ),

    // Bottom: Gantt
    Box({ borderStyle: 'double', padding: 1 },
      GanttChart({
        tasks: timeline().tasks,
        title: 'Project Timeline',
      }),
    ),
  )
}
```

## Related

- [Bar Charts](bar-chart.md) - Horizontal and vertical bars
- [Sparklines](sparkline.md) - Inline mini-charts
- [Gauges](gauges.md) - Gauge displays
- [Heatmaps](heatmaps.md) - Grid-based heatmaps
