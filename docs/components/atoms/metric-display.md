# MetricDisplay

Dashboard metric component with value, trend sparkline, delta percentage, and threshold-based coloring.

## Import

```typescript
import { MetricDisplay, createMetric } from 'tuiuiu.js'
```

## Basic Usage

### With `createMetric()` (Recommended)

The `createMetric()` factory provides auto-tracking state management:

```typescript
const cpu = createMetric({
  label: 'CPU',
  unit: '%',
  historySize: 20,
  thresholds: {
    success: [0, 50],    // Green: 0-50%
    warning: [50, 80],   // Yellow: 50-80%
    error: [80, 100],    // Red: 80-100%
  },
})

// Update value - history and delta auto-calculated!
cpu.set(45)
cpu.set(52)  // delta = +15.5%

// Render
MetricDisplay({ metric: cpu })
```

### Standalone Mode

For one-off usage without state management:

```typescript
MetricDisplay({
  label: 'Response Time',
  value: 145,
  unit: 'ms',
  trend: [120, 130, 145, 142, 145],
  delta: 2.1,
})
```

## createMetric() API

```typescript
interface CreateMetricOptions {
  label: string              // Metric label
  unit?: string              // Unit suffix (e.g., '%', 'ms')
  initial?: number           // Initial value (default: 0)
  historySize?: number       // Trend history size (default: 10)
  thresholds?: ThresholdConfig  // Color thresholds
}

interface MetricState {
  value: () => number        // Current value signal
  set: (n: number) => void   // Update value (tracks history)
  history: () => number[]    // History signal for sparkline
  delta: () => number        // Auto-calculated delta %
  color: () => string        // Threshold-resolved color
  label: string              // Metric label
  unit: string               // Unit suffix
}
```

## Threshold Configuration

Thresholds determine value coloring based on ranges:

```typescript
const metric = createMetric({
  label: 'CPU',
  unit: '%',
  thresholds: {
    success: [0, 50],     // value 0-50 = green
    warning: [50, 80],    // value 50-80 = yellow
    error: [80, 100],     // value 80-100 = red
  },
})
```

For inverted thresholds (lower is worse):

```typescript
const uptime = createMetric({
  label: 'Uptime',
  unit: '%',
  thresholds: {
    error: [0, 90],       // value 0-90 = red (bad)
    warning: [90, 99],    // value 90-99 = yellow
    success: [99, 100],   // value 99-100 = green (good)
  },
})
```

## Layout Options

```typescript
// Horizontal (default): Label: 45% +5% ▁▃▅▇█
MetricDisplay({ metric: cpu, layout: 'horizontal' })

// Vertical:
// CPU
// 45% +5%
// ▁▃▅▇█
MetricDisplay({ metric: cpu, layout: 'vertical' })
```

## Size Variants

```typescript
MetricDisplay({ metric, size: 'compact' })  // Smaller, muted label
MetricDisplay({ metric, size: 'normal' })   // Default
MetricDisplay({ metric, size: 'large' })    // Bold value
```

## Customization

```typescript
MetricDisplay({
  metric: cpu,
  trendWidth: 15,      // Sparkline width (default: 10)
  showTrend: false,    // Hide sparkline
  showDelta: false,    // Hide delta indicator
})
```

## Dashboard Example

```typescript
function MetricsDashboard() {
  const cpu = createMetric({
    label: 'CPU',
    unit: '%',
    thresholds: { success: [0, 50], warning: [50, 80], error: [80, 100] },
  })

  const memory = createMetric({
    label: 'Memory',
    unit: '%',
    thresholds: { success: [0, 60], warning: [60, 85], error: [85, 100] },
  })

  const requests = createMetric({
    label: 'Requests',
    unit: '/s',
    historySize: 30,
  })

  // Simulate updates
  useInterval(() => {
    cpu.set(Math.random() * 100)
    memory.set(Math.random() * 100)
    requests.set(Math.floor(Math.random() * 1000))
  }, 1000)

  return Box(
    { flexDirection: 'row', gap: 4, padding: 1 },
    MetricDisplay({ metric: cpu }),
    MetricDisplay({ metric: memory }),
    MetricDisplay({ metric: requests }),
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `metric` | `MetricState` | - | State from `createMetric()` |
| `label` | `MaybeReactive<string>` | - | Label (standalone mode) |
| `value` | `MaybeReactive<number>` | - | Value (standalone mode) |
| `unit` | `MaybeReactive<string>` | - | Unit suffix |
| `trend` | `MaybeReactive<number[]>` | - | Trend data (standalone) |
| `trendWidth` | `number` | `10` | Sparkline width |
| `delta` | `MaybeReactive<number>` | - | Delta % (standalone) |
| `thresholds` | `ThresholdConfig` | - | Value color thresholds |
| `layout` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `size` | `'compact' \| 'normal' \| 'large'` | `'normal'` | Size variant |
| `showTrend` | `boolean` | `true` | Show sparkline |
| `showDelta` | `boolean` | `true` | Show delta indicator |

## Delta Colors

- **Positive delta** (`+5%`): `success` (green)
- **Negative delta** (`-5%`): `error` (red)
- **Zero delta** (`0%`): `muted` (gray)

## Related Components

- [StatusIndicator](./status-indicator.md) - For status displays
- [ProgressBar](./progress-bar.md) - For progress tracking
- [Sparkline](../viz/sparkline.md) - Standalone sparklines
- [Gauge](../viz/gauges.md) - Circular/linear gauges
