# useFps

Track frames per second for performance monitoring. Automatically tracks frames on each render.

## Basic Usage

```typescript
import { useFps } from 'tuiuiu.js';

function App() {
  const { fps, metrics, color } = useFps();

  return Box({ flexDirection: 'column' },
    Text({ color }, `${fps} FPS`),
    Text({}, `Avg: ${metrics.avgFps} | Min: ${metrics.minFps} | Max: ${metrics.maxFps}`)
  );
}
```

## Return Value

`useFps()` returns an object with:

| Property | Type | Description |
|:---------|:-----|:------------|
| `fps` | `number` | Current frames per second |
| `metrics` | `FpsMetrics` | Detailed performance metrics |
| `color` | `'green' \| 'yellow' \| 'red'` | Color based on performance |

### FpsMetrics

```typescript
interface FpsMetrics {
  fps: number;       // Current FPS
  avgFps: number;    // Rolling average (10s window)
  minFps: number;    // Minimum recorded FPS
  maxFps: number;    // Maximum recorded FPS
  totalFrames: number; // Total frames rendered
  uptime: number;    // Time since tracking started (ms)
  frameTime: number; // Milliseconds per frame (1000/fps)
}
```

## Color Thresholds

The `color` property is automatically determined based on FPS:

| FPS | Color | Meaning |
|:----|:------|:--------|
| ≥ 30 | `green` | Good performance |
| 15-29 | `yellow` | Acceptable, may need optimization |
| < 15 | `red` | Poor performance |

## Examples

### Simple FPS Display

```typescript
function FpsCounter() {
  const { fps, color } = useFps();

  return Text({ color, bold: true }, `${fps} FPS`);
}
```

### Detailed Metrics Panel

```typescript
function PerformancePanel() {
  const { fps, metrics, color } = useFps();

  return Box({ flexDirection: 'column', borderStyle: 'round', padding: 1 },
    Text({ bold: true }, 'Performance'),
    Divider(),
    Text({ color }, `Current: ${fps} FPS`),
    Text({}, `Average: ${metrics.avgFps} FPS`),
    Text({}, `Range: ${metrics.minFps} - ${metrics.maxFps} FPS`),
    Text({}, `Frame time: ${metrics.frameTime.toFixed(1)}ms`),
    Text({}, `Frames: ${metrics.totalFrames}`),
    Text({}, `Uptime: ${(metrics.uptime / 1000).toFixed(1)}s`)
  );
}
```

### Status Bar Integration

```typescript
function StatusBar() {
  const { fps, color } = useFps();
  const { columns } = useTerminalSize();

  return Box({ width: columns(), backgroundColor: 'gray' },
    Spacer(),
    Text({ color }, `${fps} FPS`),
    Text({}, ' | '),
    Text({}, new Date().toLocaleTimeString())
  );
}
```

## Core Functions

For advanced use cases, you can use the core FPS functions directly:

```typescript
import {
  trackFrame,
  getFps,
  getFpsMetrics,
  resetFps,
  getFpsColor
} from 'tuiuiu.js';

// Manual frame tracking (useFps does this automatically)
trackFrame();

// Get current FPS
const fps = getFps();

// Get all metrics
const metrics = getFpsMetrics();

// Get color for any FPS value
const color = getFpsColor(45); // 'green'

// Reset tracking (useful between screens/views)
resetFps();
```

## How It Works

1. **Frame Tracking**: Each call to `useFps()` calls `trackFrame()` internally, incrementing the frame counter
2. **FPS Calculation**: Every second, the frame count is converted to FPS
3. **Rolling Average**: A 10-second rolling window calculates average FPS
4. **Min/Max Tracking**: Records the lowest and highest FPS values seen

## Performance Notes

- `useFps()` is lightweight and designed for production use
- Frame tracking uses module-level state, shared across all components
- Calling `useFps()` in multiple components won't cause double-counting issues
- Use `resetFps()` when transitioning between views to get fresh metrics

## API Reference

```typescript
function useFps(): UseFpsResult

interface UseFpsResult {
  fps: number;
  metrics: FpsMetrics;
  color: 'green' | 'yellow' | 'red';
}

interface FpsMetrics {
  fps: number;
  avgFps: number;
  minFps: number;
  maxFps: number;
  totalFrames: number;
  uptime: number;
  frameTime: number;
}
```
