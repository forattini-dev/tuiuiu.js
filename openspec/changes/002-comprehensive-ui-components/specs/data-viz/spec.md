# Spec: Data Visualization Components

## ADDED Requirements

### REQ-VIZ-001: Sparkline Component
The system MUST provide a Sparkline component for inline mini-charts.

#### Scenario: Render basic sparkline
- GIVEN data: [1, 5, 3, 8, 2, 7]
- WHEN Sparkline is rendered
- THEN it displays Unicode blocks representing the values (e.g., ▁▅▃█▂▇)

#### Scenario: Auto-scale values
- GIVEN data with values ranging from 100 to 500
- WHEN Sparkline is rendered
- THEN the lowest value maps to ▁ and highest to █

#### Scenario: Custom width
- GIVEN data with 20 points and width: 10
- WHEN Sparkline is rendered
- THEN it resamples data to fit 10 characters

#### Scenario: ASCII fallback
- GIVEN renderMode is 'ascii'
- WHEN Sparkline is rendered
- THEN it uses '_.-:=*#@' instead of Unicode blocks

#### Scenario: SparklineBuffer streaming
- GIVEN a SparklineBuffer with maxPoints: 30
- WHEN 50 values are pushed
- THEN only the last 30 values are retained

---

### REQ-VIZ-002: BarChart Component
The system MUST provide a BarChart component for bar visualizations.

#### Scenario: Horizontal bar chart
- GIVEN data: [{label: 'A', value: 10}, {label: 'B', value: 20}]
- WHEN BarChart is rendered with direction: 'horizontal'
- THEN it displays horizontal bars with labels on the left

#### Scenario: Vertical bar chart
- GIVEN the same data with direction: 'vertical'
- WHEN BarChart is rendered
- THEN it displays vertical bars with labels below

#### Scenario: Show values
- GIVEN showValues: true
- WHEN BarChart is rendered
- THEN each bar displays its numeric value

#### Scenario: Color per bar
- GIVEN data with color property per item
- WHEN BarChart is rendered
- THEN each bar uses its specified color

---

### REQ-VIZ-003: LineChart Component
The system MUST provide a LineChart component for trend visualization.

#### Scenario: Single series
- GIVEN series: [{ data: [1, 3, 2, 5, 4] }]
- WHEN LineChart is rendered
- THEN it displays a line connecting the points

#### Scenario: Multiple series
- GIVEN two series with different colors
- WHEN LineChart is rendered
- THEN both lines are displayed with their respective colors

#### Scenario: Y-axis labels
- GIVEN showYAxis: true
- WHEN LineChart is rendered
- THEN Y-axis labels are displayed on the left

#### Scenario: X-axis labels
- GIVEN xLabels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
- WHEN LineChart is rendered
- THEN X-axis labels are displayed below the chart

#### Scenario: Legend
- GIVEN showLegend: true and multiple series with labels
- WHEN LineChart is rendered
- THEN a legend is displayed showing series colors and labels

---

### REQ-VIZ-004: Gauge Component
The system MUST provide a Gauge component for progress/status visualization.

#### Scenario: Semicircle gauge
- GIVEN value: 75, style: 'semicircle'
- WHEN Gauge is rendered
- THEN it displays a semicircular progress indicator at 75%

#### Scenario: Linear gauge
- GIVEN value: 50, style: 'linear'
- WHEN Gauge is rendered
- THEN it displays a horizontal linear gauge at 50%

#### Scenario: Color thresholds
- GIVEN thresholds: [{value: 30, color: 'green'}, {value: 70, color: 'yellow'}, {value: 100, color: 'red'}]
- WHEN value is 80
- THEN the gauge displays in red color

#### Scenario: Value label
- GIVEN showPercentage: true
- WHEN Gauge is rendered
- THEN it displays the percentage value (e.g., "75%")

---

## API Specifications

### SparklineOptions
```typescript
interface SparklineOptions {
  data: number[]
  width?: number           // default: data.length
  min?: number             // auto-detected
  max?: number             // auto-detected
  style?: 'block' | 'braille' | 'ascii'  // default: 'block'
  color?: string
  showLabels?: boolean     // show min/max labels
}
```

### BarChartOptions
```typescript
interface BarChartOptions {
  data: Array<{
    label: string
    value: number
    color?: string
  }>
  direction?: 'horizontal' | 'vertical'  // default: 'horizontal'
  width?: number
  height?: number
  showValues?: boolean     // default: false
  showPercentage?: boolean // default: false
  barChar?: string         // default: '█'
  maxValue?: number        // auto-detected
  gap?: number             // default: 0
}
```

### LineChartOptions
```typescript
interface LineChartOptions {
  series: Array<{
    data: number[]
    color?: string
    label?: string
    style?: 'line' | 'scatter'  // default: 'line'
  }>
  width?: number
  height?: number
  xLabels?: string[]
  showYAxis?: boolean      // default: true
  showLegend?: boolean     // default: false
}
```

### GaugeOptions
```typescript
interface GaugeOptions {
  value: number
  min?: number             // default: 0
  max?: number             // default: 100
  style?: 'semicircle' | 'arc' | 'linear'  // default: 'linear'
  width?: number
  label?: string
  showPercentage?: boolean // default: true
  thresholds?: Array<{
    value: number
    color: string
  }>
}
```

---

## Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/data-viz/sparkline.ts` | CREATE | Sparkline component |
| `src/components/data-viz/bar-chart.ts` | CREATE | BarChart component |
| `src/components/data-viz/line-chart.ts` | CREATE | LineChart component |
| `src/components/data-viz/gauge.ts` | CREATE | Gauge component |
| `src/components/data-viz/index.ts` | CREATE | Re-exports |
| `tests/components/data-viz/sparkline.test.ts` | CREATE | Tests |
| `tests/components/data-viz/bar-chart.test.ts` | CREATE | Tests |
| `tests/components/data-viz/line-chart.test.ts` | CREATE | Tests |
| `tests/components/data-viz/gauge.test.ts` | CREATE | Tests |
