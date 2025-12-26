# Timer

Countdown and elapsed time display with multiple formats.

## Import

```typescript
import { Timer, createTimer, formatTime, parseTime } from 'tuiuiu.js'
```

## Basic Usage

```typescript
// Countdown timer (5 minutes)
Timer({ duration: 300000, autoStart: true })

// Elapsed timer (stopwatch)
Timer({ mode: 'elapsed', autoStart: true })

// With callback
Timer({
  duration: 60000,
  autoStart: true,
  onComplete: () => console.log('Time up!'),
})
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `duration` | `number` | - | Duration in milliseconds |
| `mode` | `'countdown' \| 'elapsed'` | `'countdown'` | Timer mode |
| `format` | `TimerFormat` | `'mm:ss'` | Time format |
| `autoStart` | `boolean` | `false` | Start automatically |
| `color` | `ColorValue` | - | Text color |
| `warningThreshold` | `number` | - | When to show warning color |
| `warningColor` | `ColorValue` | `'warning'` | Warning color |
| `criticalThreshold` | `number` | - | When to show critical color |
| `criticalColor` | `ColorValue` | `'danger'` | Critical color |
| `prefix` | `string` | - | Text before time |
| `suffix` | `string` | - | Text after time |
| `onComplete` | `() => void` | - | Countdown complete handler |
| `onTick` | `(ms: number) => void` | - | Every tick handler |

## Time Formats

| Format | Example |
|--------|---------|
| `'ms'` | `5000` |
| `'s'` | `5` |
| `'mm:ss'` | `01:30` |
| `'hh:mm:ss'` | `01:30:45` |
| `'human'` | `1m 30s` |
| `'compact'` | `1:30` |

## Programmatic Control

```typescript
const timer = createTimer({
  duration: 60000,
  onComplete: () => alert('Done!'),
})

// Control methods
timer.start()     // Start timer
timer.pause()     // Pause timer
timer.resume()    // Resume from pause
timer.stop()      // Stop and reset
timer.reset()     // Reset to initial

// Read state
timer.elapsed()   // Elapsed milliseconds
timer.remaining() // Remaining (countdown)
timer.isRunning() // Is active
timer.isPaused()  // Is paused
timer.isComplete()// Countdown finished

// Use in component
Timer({ state: timer })
```

## MultiTimer

Manage multiple named timers:

```typescript
const timers = createMultiTimer()

// Create/start timers
timers.start('task1')
timers.start('task2')

// Control individual timers
timers.pause('task1')
timers.resume('task1')
timers.stop('task2')

// Get elapsed time
timers.elapsed('task1') // milliseconds

// Stop all
timers.stopAll()
```

## Utility Functions

```typescript
// Format milliseconds to string
formatTime(90000, 'mm:ss')    // "01:30"
formatTime(90000, 'human')    // "1m 30s"
formatTime(3661000, 'hh:mm:ss') // "01:01:01"

// Parse time string to milliseconds
parseTime('1:30')      // 90000
parseTime('01:30:00')  // 5400000
parseTime('5m 30s')    // 330000
```

## Examples

### Pomodoro Timer

```typescript
function PomodoroTimer() {
  const timer = createTimer({
    duration: 25 * 60 * 1000, // 25 minutes
    onComplete: () => {
      playSound('bell')
      showNotification('Break time!')
    },
  })

  return Box({ flexDirection: 'column', gap: 1 },
    Timer({
      state: timer,
      format: 'mm:ss',
      warningThreshold: 60000,  // Warning at 1 min
      criticalThreshold: 10000, // Critical at 10s
    }),
    ButtonGroup({
      buttons: [
        { label: 'Start', onClick: timer.start },
        { label: 'Pause', onClick: timer.pause },
        { label: 'Reset', onClick: timer.reset },
      ],
    })
  )
}
```

### Stopwatch

```typescript
function Stopwatch() {
  const timer = createTimer({ mode: 'elapsed' })

  return Box({},
    Timer({
      state: timer,
      format: 'hh:mm:ss',
      prefix: 'Elapsed: ',
    })
  )
}
```

### Multiple Task Timers

```typescript
function TaskTimers() {
  const timers = createMultiTimer()

  return Box({ flexDirection: 'column' },
    Box({},
      Text({}, 'Task 1: '),
      Text({}, formatTime(timers.elapsed('task1'), 'human'))
    ),
    Box({},
      Text({}, 'Task 2: '),
      Text({}, formatTime(timers.elapsed('task2'), 'human'))
    )
  )
}
```

### Countdown with Warning

```typescript
Timer({
  duration: 300000, // 5 minutes
  format: 'mm:ss',
  warningThreshold: 60000,   // Yellow at 1 min
  criticalThreshold: 10000,  // Red at 10 sec
  autoStart: true,
})
```

## Related

- [Spinner](/components/atoms/spinner.md) - Loading indicators
- [ProgressBar](/components/atoms/progress-bar.md) - Progress display
