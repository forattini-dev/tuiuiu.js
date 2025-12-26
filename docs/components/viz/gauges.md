# Gauges

Gauge components for displaying single values with visual indicators, progress, and thresholds.

## Import

```typescript
import { Gauge, MeterGauge, ArcGauge, DialGauge, BatteryGauge } from 'tuiuiu.js'
```

## Gauge

Universal gauge component that dispatches to specific styles.

### Basic Usage

```typescript
// Linear gauge (default)
Gauge({ value: 75 })

// Meter gauge with segments
Gauge({ value: 75, style: 'meter' })

// Arc gauge
Gauge({ value: 75, style: 'arc' })

// Dial gauge
Gauge({ value: 75, style: 'dial' })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | required | Current value |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `style` | `'linear' \| 'arc' \| 'meter' \| 'dial'` | `'linear'` | Gauge style |
| `width` | `number` | `30` | Gauge width |
| `height` | `number` | - | Height (for vertical/arc) |
| `showValue` | `boolean` | `true` | Show numeric value |
| `formatValue` | `(value: number) => string` | - | Value formatter |
| `valuePosition` | `'left' \| 'right' \| 'center' \| 'inside' \| 'below'` | `'right'` | Value position |
| `showMinMax` | `boolean` | `false` | Show min/max labels |
| `color` | `ColorValue` | `'primary'` | Fill color |
| `backgroundColor` | `ColorValue` | - | Background color |
| `zones` | `GaugeZone[] \| boolean` | - | Color zones |
| `label` | `string` | - | Label text |
| `labelColor` | `ColorValue` | - | Label color |

### Color Zones

Zones allow automatic color changes based on value ranges:

```typescript
// Use default zones (green/yellow/red)
Gauge({ value: 85, zones: true })

// Custom zones
Gauge({
  value: 75,
  zones: [
    { start: 0, end: 50, color: 'green' },
    { start: 50, end: 80, color: 'yellow' },
    { start: 80, end: 100, color: 'red' },
  ],
})
```

## MeterGauge

Segmented gauge with discrete indicators.

### Basic Usage

```typescript
MeterGauge({
  value: 7,
  min: 0,
  max: 10,
  segments: 10,
  color: 'green',
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | required | Current value |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `segments` | `number` | `10` | Number of segments |
| `segmentChar` | `string` | `●` | Filled segment character |
| `emptyChar` | `string` | `○` | Empty segment character |
| `showValue` | `boolean` | `true` | Show numeric value |
| `formatValue` | `(value: number) => string` | - | Value formatter |
| `color` | `ColorValue` | `'primary'` | Fill color |
| `zones` | `GaugeZone[] \| boolean` | - | Color zones |
| `label` | `string` | - | Label text |

### Custom Characters

```typescript
// Star rating style
MeterGauge({
  value: 4,
  max: 5,
  segments: 5,
  segmentChar: '★',
  emptyChar: '☆',
  color: 'yellow',
})

// Block style
MeterGauge({
  value: 75,
  segmentChar: '█',
  emptyChar: '░',
})
```

## ArcGauge

Semicircle arc gauge with visual appeal.

### Basic Usage

```typescript
ArcGauge({
  value: 65,
  showValue: true,
  color: 'cyan',
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | required | Current value |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `width` | `number` | `15` | Arc width |
| `showValue` | `boolean` | `true` | Show numeric value |
| `formatValue` | `(value: number) => string` | - | Value formatter |
| `color` | `ColorValue` | `'primary'` | Arc color |
| `zones` | `GaugeZone[] \| boolean` | - | Color zones |
| `label` | `string` | - | Label text |

### With Zones

```typescript
ArcGauge({
  value: 85,
  label: 'CPU',
  zones: [
    { start: 0, end: 60, color: 'green' },
    { start: 60, end: 80, color: 'yellow' },
    { start: 80, end: 100, color: 'red' },
  ],
})
```

## DialGauge

Dial-style gauge with colored segments and pointer.

### Basic Usage

```typescript
DialGauge({
  value: 75,
  zones: [
    { start: 0, end: 50, color: 'green' },
    { start: 50, end: 80, color: 'yellow' },
    { start: 80, end: 100, color: 'red' },
  ],
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | required | Current value |
| `min` | `number` | `0` | Minimum value |
| `max` | `number` | `100` | Maximum value |
| `width` | `number` | `11` | Dial width |
| `showValue` | `boolean` | `true` | Show numeric value |
| `showMinMax` | `boolean` | `true` | Show min/max labels |
| `color` | `ColorValue` | `'primary'` | Pointer color |
| `zones` | `GaugeZone[]` | default zones | Color zones |
| `label` | `string` | - | Label text |

## BatteryGauge

Battery indicator with automatic color and charging state.

### Basic Usage

```typescript
// Normal battery
BatteryGauge({ level: 75 })

// Low battery (auto-red)
BatteryGauge({ level: 15 })

// Charging
BatteryGauge({ level: 75, charging: true })
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `level` | `number` | required | Charge level (0-100) |
| `showLevel` | `boolean` | `true` | Show percentage |
| `charging` | `boolean` | `false` | Show charging indicator (⚡) |
| `width` | `number` | `10` | Battery width |

### Automatic Colors

BatteryGauge automatically colors based on level:
- **Green**: 50-100%
- **Yellow**: 20-49%
- **Red**: 0-19%

## Dashboard Example

```typescript
function SystemMonitor() {
  const cpu = useCpuData()
  const memory = useMemoryData()
  const battery = useBatteryData()

  return Box({ flexDirection: 'column', gap: 1 },
    // Header gauges
    Box({ flexDirection: 'row', gap: 2 },
      DialGauge({
        value: cpu.percent,
        label: 'CPU',
        zones: true,
      }),
      ArcGauge({
        value: memory.percent,
        label: 'Memory',
        color: 'cyan',
      }),
      BatteryGauge({
        level: battery.level,
        charging: battery.isCharging,
      }),
    ),

    // Detail meters
    Box({ flexDirection: 'column', gap: 0 },
      Text({}, 'Core Usage:'),
      ...cpu.cores.map((core, i) =>
        MeterGauge({
          value: core,
          max: 100,
          segments: 20,
          label: `Core ${i}`,
          zones: true,
        })
      ),
    ),
  )
}
```

## Related

- [Bar Charts](bar-chart.md) - Horizontal and vertical bars
- [Charts](charts.md) - Line and area charts
- [Feedback](/components/feedback.md) - Progress bars and spinners
