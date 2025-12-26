# Simple CLI Progress

Use Tuiuiu components for simple CLI tools without a full interactive app.

## Quick Start

```typescript
import { render, Box, Text, ProgressBar, Spinner, createSignal } from 'tuiuiu.js'

// 1. Create signals OUTSIDE component
const [progress, setProgress] = createSignal(0)
const [status, setStatus] = createSignal('Starting...')

// 2. Simple component - just displays state
function DownloadProgress() {
  return Box({ flexDirection: 'column', padding: 1 },
    Box({ flexDirection: 'row', gap: 1 },
      Spinner({ style: 'dots', color: 'cyan' }),
      Text({}, status()),
    ),
    ProgressBar({
      value: progress(),
      width: 40,
      showPercentage: true,
      color: 'cyan',
    }),
  )
}

// 3. Start render (no keyboard handlers needed!)
const { unmount } = render(DownloadProgress, {
  clearOnStart: false,  // Don't clear previous output
  exitOnCtrlC: true,    // Allow Ctrl+C to abort
})

// 4. Your async operation updates signals
async function download() {
  for (let i = 0; i <= 100; i += 10) {
    setProgress(i)
    setStatus(`Downloading... ${i}%`)
    await new Promise(r => setTimeout(r, 200))
  }

  setStatus('Done!')
  await new Promise(r => setTimeout(r, 500))

  // 5. Clean up when done
  unmount()
}

download()
```

## Key Differences from Full Apps

| Full App | Simple CLI |
|----------|------------|
| `await waitUntilExit()` | `unmount()` when done |
| `useInput()` for keyboard | No keyboard handling |
| `useApp().exit()` | Just call `unmount()` |
| Interactive components | Display-only components |

## Patterns

### Download with Recker

```typescript
import { render, Box, Text, ProgressBar, Spinner, createSignal, batch } from 'tuiuiu.js'
import { Client } from 'recker'

const [progress, setProgress] = createSignal(0)
const [speed, setSpeed] = createSignal('0 KB/s')
const [status, setStatus] = createSignal('Connecting...')
const [error, setError] = createSignal<string | null>(null)

function DownloadUI() {
  const err = error()

  if (err) {
    return Box({ padding: 1 },
      Text({ color: 'red', bold: true }, `✗ Error: ${err}`)
    )
  }

  return Box({ flexDirection: 'column', padding: 1 },
    Box({ flexDirection: 'row', gap: 1 },
      Spinner({ style: 'dots', color: 'cyan' }),
      Text({ color: 'cyan' }, status()),
    ),
    ProgressBar({
      value: progress(),
      width: 50,
      showPercentage: true,
      color: progress() === 100 ? 'green' : 'cyan',
    }),
    Text({ color: 'gray', dim: true }, `Speed: ${speed()}`),
  )
}

const { unmount } = render(DownloadUI, { clearOnStart: false })

async function downloadFile(url: string, dest: string) {
  const client = new Client()

  try {
    setStatus('Downloading...')

    const response = await client.get(url, {
      onDownloadProgress: ({ loaded, total, rate }) => {
        batch(() => {
          setProgress(total ? Math.round((loaded / total) * 100) : 0)
          setSpeed(rate ? `${(rate / 1024).toFixed(1)} KB/s` : '...')
        })
      }
    })

    // Save file...
    setStatus('✓ Download complete!')
    setProgress(100)

  } catch (err) {
    setError(err.message)
  } finally {
    await new Promise(r => setTimeout(r, 1000))
    unmount()
  }
}

downloadFile('https://example.com/file.zip', './file.zip')
```

### Multiple Operations

```typescript
import { render, Box, Text, ProgressBar, createSignal, batch } from 'tuiuiu.js'

interface Task {
  name: string
  progress: number
  status: 'pending' | 'running' | 'done' | 'error'
}

const [tasks, setTasks] = createSignal<Task[]>([
  { name: 'Install dependencies', progress: 0, status: 'pending' },
  { name: 'Build project', progress: 0, status: 'pending' },
  { name: 'Run tests', progress: 0, status: 'pending' },
  { name: 'Deploy', progress: 0, status: 'pending' },
])

function TaskList() {
  return Box({ flexDirection: 'column', padding: 1 },
    Text({ bold: true, marginBottom: 1 }, 'Build Pipeline'),
    ...tasks().map((task, i) =>
      Box({ key: i, flexDirection: 'column', marginBottom: 1 },
        Box({ flexDirection: 'row', gap: 1 },
          Text({
            color: task.status === 'done' ? 'green' :
                   task.status === 'error' ? 'red' :
                   task.status === 'running' ? 'cyan' : 'gray'
          },
            task.status === 'done' ? '✓' :
            task.status === 'error' ? '✗' :
            task.status === 'running' ? '◌' : '○'
          ),
          Text({}, task.name),
        ),
        task.status === 'running' && ProgressBar({
          value: task.progress,
          width: 30,
          showPercentage: true,
        }),
      )
    ),
  )
}

const { unmount } = render(TaskList, { clearOnStart: false })

// Update task helper
function updateTask(index: number, updates: Partial<Task>) {
  setTasks(ts => ts.map((t, i) =>
    i === index ? { ...t, ...updates } : t
  ))
}

async function runPipeline() {
  for (let i = 0; i < tasks().length; i++) {
    updateTask(i, { status: 'running' })

    // Simulate work
    for (let p = 0; p <= 100; p += 20) {
      updateTask(i, { progress: p })
      await new Promise(r => setTimeout(r, 100))
    }

    updateTask(i, { status: 'done', progress: 100 })
  }

  await new Promise(r => setTimeout(r, 500))
  unmount()
}

runPipeline()
```

### Spinner Only (Indeterminate)

```typescript
import { render, Box, Text, Spinner, createSignal } from 'tuiuiu.js'

const [message, setMessage] = createSignal('Processing...')

function LoadingUI() {
  return Box({ flexDirection: 'row', gap: 1, padding: 1 },
    Spinner({ style: 'dots', color: 'cyan' }),
    Text({}, message()),
  )
}

const { unmount } = render(LoadingUI, { clearOnStart: false })

async function doWork() {
  setMessage('Connecting to server...')
  await someAsyncWork()

  setMessage('Fetching data...')
  await moreAsyncWork()

  setMessage('Done!')
  await new Promise(r => setTimeout(r, 500))
  unmount()

  console.log('\nOperation completed successfully!')
}

doWork()
```

## Options

```typescript
render(Component, {
  clearOnStart: false,   // Keep previous terminal output
  exitOnCtrlC: true,     // Allow abort with Ctrl+C
  showCursor: false,     // Hide cursor during progress
  debug: false,          // Don't use incremental rendering
})
```

## Tips

### Preserve Output After Complete

```typescript
const { unmount, clear } = render(Component, { clearOnStart: false })

// When done, don't clear - just unmount
async function finish() {
  setStatus('✓ Complete!')
  await new Promise(r => setTimeout(r, 500))
  unmount()
  // Previous output stays visible
  console.log('\nAll done!')
}
```

### Error Handling

```typescript
const [error, setError] = createSignal<string | null>(null)

function UI() {
  const err = error()
  if (err) {
    return Text({ color: 'red' }, `✗ ${err}`)
  }
  return ProgressUI()
}

try {
  await riskyOperation()
} catch (e) {
  setError(e.message)
  await new Promise(r => setTimeout(r, 2000))
} finally {
  unmount()
}
```

### Batch Updates

When updating multiple signals, use `batch` for a single render:

```typescript
import { batch } from 'tuiuiu.js'

batch(() => {
  setProgress(50)
  setStatus('Halfway there...')
  setSpeed('1.2 MB/s')
})
// Only one render happens
```

## When NOT to Use This Pattern

Use a full app instead when you need:
- Keyboard input (navigation, confirmation)
- Focus management
- Multiple interactive components
- Long-running processes with user control

## Related

- [ProgressBar](/components/atoms/progress-bar.md) - Progress bar component
- [Spinner](/components/atoms/spinner.md) - Loading spinner
- [Programmatic Control](/guides/programmatic-control.md) - External state control
- [Signals](/core/signals.md) - Reactive state
