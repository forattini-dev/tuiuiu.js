# BarChart

Render horizontal or vertical bar charts in the terminal.

## Basic Usage

```typescript
import { BarChart } from 'tuiuiu.js';

BarChart({
  data: [
    { label: 'Mon', value: 10 },
    { label: 'Tue', value: 25 },
    { label: 'Wed', value: 15 },
    { label: 'Thu', value: 30 },
    { label: 'Fri', value: 20 },
  ]
})
```

## With Colors

```typescript
BarChart({
  data: [
    { label: 'Sales', value: 1200, color: 'green' },
    { label: 'Costs', value: 800, color: 'red' },
    { label: 'Profit', value: 400, color: 'cyan' },
  ],
  showValues: true,
})
```

## Horizontal vs Vertical

```typescript
// Horizontal bars (default)
BarChart({
  data: chartData,
  direction: 'horizontal',
})

// Vertical bars
BarChart({
  data: chartData,
  direction: 'vertical',
  height: 10,
})
```

## Styling

```typescript
BarChart({
  data: chartData,
  barWidth: 2,           // Bar thickness
  gap: 1,                // Gap between bars
  color: 'cyan',         // Default bar color
  showValues: true,      // Show values on bars
  showLabels: true,      // Show labels
  maxValue: 100,         // Override max scale
})
```

## Real-time Updates

```typescript
function LiveChart() {
  const [data, setData] = useState(initialData);

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => prev.map(item => ({
        ...item,
        value: item.value + Math.random() * 10 - 5
      })));
    }, 1000);
    return () => clearInterval(interval);
  });

  return BarChart({ data: data(), showValues: true });
}
```

## Props Reference

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `data` | `ChartDataPoint[]` | required | Data points to display |
| `direction` | `'horizontal' \| 'vertical'` | `'horizontal'` | Bar direction |
| `width` | `number` | auto | Chart width |
| `height` | `number` | auto | Chart height |
| `barWidth` | `number` | `1` | Bar thickness |
| `gap` | `number` | `1` | Gap between bars |
| `color` | `Color` | `'cyan'` | Default bar color |
| `showValues` | `boolean` | `false` | Show values |
| `showLabels` | `boolean` | `true` | Show labels |
| `maxValue` | `number` | auto | Max scale value |

### ChartDataPoint

```typescript
interface ChartDataPoint {
  label: string;
  value: number;
  color?: Color;  // Override default color
}
```
