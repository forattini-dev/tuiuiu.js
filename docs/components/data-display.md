# Data Visualization

Tuiuiu includes a suite of terminal-based charting components for building dashboards, monitoring tools, and analytics displays.

## Sparkline

Compact inline charts for showing trends.

### Usage

```typescript
import { Sparkline } from 'tuiuiu.js';

// Basic
Sparkline({
  data: [1, 5, 2, 8, 3, 9, 4, 7],
  color: 'green'
});

// Braille (High Resolution)
Sparkline({
  data: [/* ... */],
  style: 'braille',
  color: 'cyan'
});
```

### SparklineBuffer

For streaming data, use `SparklineBuffer` to manage the rolling window.

```typescript
import { createSparklineBuffer } from 'tuiuiu.js';

const buffer = createSparklineBuffer({ maxPoints: 40 });

// Add data point
buffer.push(cpuUsage);

// Render
return buffer.toVNode({ color: 'yellow' });
```

## BarChart

Horizontal or vertical bar charts.

### Usage

```typescript
import { BarChart } from 'tuiuiu.js';

BarChart({
  data: [
    { label: 'Q1', value: 120 },
    { label: 'Q2', value: 150 },
    { label: 'Q3', value: 180, color: 'green' }
  ],
  maxBarLength: 30
});
```

### Stacked Bar Chart

```typescript
import { StackedBarChart } from 'tuiuiu.js';

StackedBarChart({
  data: [
    {
      label: 'Server 1',
      segments: [
        { value: 40, color: 'blue' },  // Used
        { value: 60, color: 'gray' }   // Free
      ]
    }
  ]
});
```

## LineChart

Multi-series line charts with axes and legends. Supports Braille (high res) and ASCII modes.

### Usage

```typescript
import { LineChart } from 'tuiuiu.js';

LineChart({
  width: 60,
  height: 15,
  series: [
    { name: 'Requests', data: [10, 45, 30, 70], color: 'cyan' },
    { name: 'Errors', data: [2, 5, 1, 8], color: 'red' }
  ],
  yAxis: { label: 'Req/s', min: 0 },
  showLegend: true
});
```

## Gauge

Visual indicators for single values or progress.

### Styles

- **Linear**: Standard progress bar style.
- **Arc**: Semicircle gauge.
- **Dial**: Circular dial with pointer.
- **Meter**: Segmented LED-style meter.

### Usage

```typescript
import { Gauge } from 'tuiuiu.js';

// Linear
Gauge({
  value: 75,
  style: 'linear',
  label: 'CPU',
  zones: [
    { start: 80, end: 100, color: 'red' } // Warning zone
  ]
});

// Arc
Gauge({
  value: 60,
  style: 'arc',
  color: 'blue'
});
```

## Heatmaps

For time-based and correlation visualizations, see the [Heatmaps documentation](/components/viz/heatmaps.md):

- **ContributionGraph** - GitHub-style activity graph
- **CalendarHeatmap** - Year-view calendar with intensity
- **TimeHeatmap** - Hour × Day matrix
- **CorrelationMatrix** - Statistical correlation display

## Detailed Documentation

For comprehensive documentation including all props, examples, and dashboard recipes:

- [**Charts**](/components/viz/charts.md) - LineChart, AreaChart, ScatterPlot, RadarChart, GanttChart
- [**Gauges**](/components/viz/gauges.md) - MeterGauge, ArcGauge, DialGauge, BatteryGauge
- [**Heatmaps**](/components/viz/heatmaps.md) - ContributionGraph, CalendarHeatmap, TimeHeatmap, CorrelationMatrix
- [**Overview**](/components/viz/index.md) - Quick reference for all visualization components

## Related

- [Feedback Components](/components/feedback.md) - Progress bars, spinners
- [Tables](/components/data-display.md#tables) - Tabular data display