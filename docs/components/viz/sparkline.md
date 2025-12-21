# Sparkline

Compact inline charts for showing trends in small spaces.

## Basic Usage

```typescript
import { Sparkline } from 'tuiuiu.js';

Sparkline({
  data: [1, 5, 2, 8, 3, 9, 4, 7],
})
```

## Styles

```typescript
// Block style (default)
Sparkline({ data, style: 'block' })
// Output: ▁▅▂█▃█▄▇

// Braille style (higher resolution)
Sparkline({ data, style: 'braille' })
// Output: ⣀⡠⠔⠊⠉

// Line style
Sparkline({ data, style: 'line' })
// Output: ╱╲╱╲
```

## With Colors

```typescript
Sparkline({
  data: [1, 5, 2, 8, 3, 9],
  color: 'cyan',
})

// Gradient based on value
Sparkline({
  data: values,
  colorScale: ['red', 'yellow', 'green'],  // Low → High
})
```

## Sizing

```typescript
Sparkline({
  data: longDataSet,
  width: 20,   // Fixed width
  height: 2,   // For braille style
})
```

## Real-time Usage

```typescript
function CpuSparkline() {
  const [history, setHistory] = useState<number[]>([]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const cpu = await getCpuUsage();
      setHistory(prev => [...prev.slice(-20), cpu]);
    }, 1000);
    return () => clearInterval(interval);
  });

  return Box({ flexDirection: 'row', gap: 1 },
    Text({ color: 'gray' }, 'CPU:'),
    Sparkline({ data: history(), width: 20, color: 'green' }),
    Text({}, `${history().slice(-1)[0] || 0}%`)
  );
}
```

## Dashboard Example

```typescript
Box({ flexDirection: 'column', gap: 1 },
  Box({ flexDirection: 'row', justifyContent: 'space-between' },
    Text({}, 'CPU'),
    Sparkline({ data: cpuHistory(), width: 15, color: 'cyan' }),
    Text({}, `${cpu()}%`)
  ),
  Box({ flexDirection: 'row', justifyContent: 'space-between' },
    Text({}, 'MEM'),
    Sparkline({ data: memHistory(), width: 15, color: 'green' }),
    Text({}, `${mem()}%`)
  ),
  Box({ flexDirection: 'row', justifyContent: 'space-between' },
    Text({}, 'NET'),
    Sparkline({ data: netHistory(), width: 15, color: 'yellow' }),
    Text({}, `${net()}KB/s`)
  )
)
```

## Props Reference

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `data` | `number[]` | required | Data points |
| `width` | `number` | `10` | Chart width in characters |
| `height` | `number` | `1` | Chart height (braille only) |
| `style` | `'block' \| 'braille' \| 'line'` | `'block'` | Rendering style |
| `color` | `Color` | `'white'` | Sparkline color |
| `colorScale` | `Color[]` | - | Gradient colors based on value |
| `min` | `number` | auto | Override minimum value |
| `max` | `number` | auto | Override maximum value |
