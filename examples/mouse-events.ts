/**
 * Mouse Events Demo - Complete showcase of all mouse events in Tuiuiu
 *
 * This example demonstrates:
 * - onMouseEnter / onMouseLeave (hover)
 * - onClick (left click)
 * - onDoubleClick
 * - onContextMenu (right click)
 * - onMouseDown / onMouseUp
 * - onMouseMove (drag)
 * - onScroll (scroll wheel)
 *
 * Run: pnpm tsx examples/mouse-events.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useApp,
  useInput,
  type MouseEventData,
} from '../src/index.js'

// Event log entry
interface LogEntry {
  id: number
  event: string
  details: string
  color: string
  timestamp: number
}

// Colors for different event types
const EVENT_COLORS: Record<string, string> = {
  enter: 'green',
  leave: 'red',
  click: 'cyan',
  doubleClick: 'magenta',
  contextMenu: 'yellow',
  mouseDown: 'blue',
  mouseUp: 'blueBright',
  mouseMove: 'gray',
  scroll: 'white',
}

function MouseEventsDemo() {
  const { exit } = useApp()

  // State
  const [hovered, setHovered] = useState<Record<string, boolean>>({})
  const [pressed, setPressed] = useState<Record<string, boolean>>({})
  const [clickCount, setClickCount] = useState(0)
  const [scrollDelta, setScrollDelta] = useState(0)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [logId, setLogId] = useState(0)

  // Exit on 'q' or Escape
  useInput((input, key) => {
    if (input === 'q' || key.escape) exit()
    if (input === 'c') {
      setLogs([])
      setClickCount(0)
      setScrollDelta(0)
    }
  })

  // Add log entry
  const addLog = (event: string, details: string) => {
    const id = logId()
    setLogId(id + 1)
    setLogs((prev) => {
      const newLogs = [
        { id, event, details, color: EVENT_COLORS[event] || 'white', timestamp: Date.now() },
        ...prev,
      ]
      return newLogs.slice(0, 12) // Keep last 12 entries
    })
  }

  // Format event data
  const formatEvent = (e: MouseEventData) => {
    const mods = []
    if (e.modifiers.ctrl) mods.push('Ctrl')
    if (e.modifiers.shift) mods.push('Shift')
    if (e.modifiers.alt) mods.push('Alt')
    const modStr = mods.length ? ` [${mods.join('+')}]` : ''
    return `(${e.x}, ${e.y}) btn=${e.button}${modStr}`
  }

  // Interactive box with all events
  const InteractiveBox = (props: { id: string; label: string; color: string }) => {
    const isHovered = hovered()[props.id] || false
    const isPressed = pressed()[props.id] || false

    return Box(
      {
        borderStyle: 'round',
        borderColor: isPressed ? 'yellow' : isHovered ? props.color : 'gray',
        padding: 1,
        minWidth: 28,
        minHeight: 5,
        backgroundColor: isPressed ? 'gray' : undefined,

        onMouseEnter: (e) => {
          setHovered((h) => ({ ...h, [props.id]: true }))
          addLog('enter', `${props.label} ${formatEvent(e)}`)
        },

        onMouseLeave: (e) => {
          setHovered((h) => ({ ...h, [props.id]: false }))
          setPressed((p) => ({ ...p, [props.id]: false }))
          addLog('leave', `${props.label} ${formatEvent(e)}`)
        },

        onClick: (e) => {
          setClickCount((c) => c + 1)
          addLog('click', `${props.label} ${formatEvent(e)}`)
        },

        onDoubleClick: (e) => {
          addLog('doubleClick', `${props.label} ${formatEvent(e)}`)
        },

        onContextMenu: (e) => {
          addLog('contextMenu', `${props.label} ${formatEvent(e)}`)
        },

        onMouseDown: (e) => {
          setPressed((p) => ({ ...p, [props.id]: true }))
          addLog('mouseDown', `${props.label} ${formatEvent(e)}`)
        },

        onMouseUp: (e) => {
          setPressed((p) => ({ ...p, [props.id]: false }))
          addLog('mouseUp', `${props.label} ${formatEvent(e)}`)
        },

        onMouseMove: (e) => {
          setLastPos({ x: e.absoluteX, y: e.absoluteY })
          // Don't log every move to avoid spam, just update position
        },

        onScroll: (e) => {
          const delta = e.button === 'scroll-up' ? 1 : -1
          setScrollDelta((d) => d + delta)
          addLog('scroll', `${props.label} ${e.button} ${formatEvent(e)}`)
        },
      },
      Text(
        { color: isHovered ? props.color : 'white', bold: isHovered },
        props.label
      ),
      Text(
        { color: 'gray', dim: true },
        isPressed ? 'Pressed!' : isHovered ? 'Hovering...' : 'Hover me'
      )
    )
  }

  // Drag area
  const DragArea = () => {
    const isHovered = hovered()['drag'] || false
    const isDragging = pressed()['drag'] || false

    return Box(
      {
        borderStyle: 'double',
        borderColor: isDragging ? 'yellow' : isHovered ? 'magenta' : 'gray',
        padding: 1,
        minWidth: 40,
        minHeight: 7,

        onMouseEnter: () => setHovered((h) => ({ ...h, drag: true })),
        onMouseLeave: () => {
          setHovered((h) => ({ ...h, drag: false }))
          setPressed((p) => ({ ...p, drag: false }))
        },

        onMouseDown: (e) => {
          setPressed((p) => ({ ...p, drag: true }))
          addLog('mouseDown', `Drag area ${formatEvent(e)}`)
        },

        onMouseUp: (e) => {
          setPressed((p) => ({ ...p, drag: false }))
          addLog('mouseUp', `Drag area ${formatEvent(e)}`)
        },

        onMouseMove: (e) => {
          setLastPos({ x: e.absoluteX, y: e.absoluteY })
          if (isDragging) {
            addLog('mouseMove', `Dragging at ${formatEvent(e)}`)
          }
        },
      },
      Text({ color: 'magenta', bold: true }, 'Drag Area'),
      Text({ color: 'gray' }, isDragging ? 'Dragging...' : 'Click and drag here'),
      Text({ color: 'cyan' }, `Mouse: (${lastPos().x}, ${lastPos().y})`)
    )
  }

  // Scroll area
  const ScrollArea = () => {
    const isHovered = hovered()['scroll'] || false

    return Box(
      {
        borderStyle: 'round',
        borderColor: isHovered ? 'green' : 'gray',
        padding: 1,
        minWidth: 30,
        minHeight: 7,

        onMouseEnter: () => setHovered((h) => ({ ...h, scroll: true })),
        onMouseLeave: () => setHovered((h) => ({ ...h, scroll: false })),

        onScroll: (e) => {
          const delta = e.button === 'scroll-up' ? 1 : -1
          setScrollDelta((d) => d + delta)
          addLog('scroll', `Scroll ${e.button}`)
        },
      },
      Text({ color: 'green', bold: true }, 'Scroll Area'),
      Text({ color: 'gray' }, 'Use scroll wheel here'),
      Text({ color: 'yellow', bold: true }, `Delta: ${scrollDelta()}`)
    )
  }

  // Event log panel
  const EventLog = () =>
    Box(
      {
        borderStyle: 'single',
        borderColor: 'gray',
        padding: 1,
        minWidth: 50,
        flexGrow: 1,
      },
      Box(
        { marginBottom: 1 },
        Text({ color: 'white', bold: true }, 'Event Log')
      ),
      ...logs().map((log) =>
        Text(
          { key: String(log.id), color: log.color as any },
          `${log.event.padEnd(12)} ${log.details}`
        )
      ),
      logs().length === 0
        ? Text({ color: 'gray', dim: true }, 'Interact with boxes to see events...')
        : null
    )

  // Stats panel
  const Stats = () =>
    Box(
      {
        flexDirection: 'row',
        gap: 2,
        marginBottom: 1,
      },
      Box(
        { borderStyle: 'round', borderColor: 'cyan', paddingX: 2 },
        Text({ color: 'cyan' }, `Clicks: ${clickCount()}`)
      ),
      Box(
        { borderStyle: 'round', borderColor: 'yellow', paddingX: 2 },
        Text({ color: 'yellow' }, `Scroll: ${scrollDelta()}`)
      ),
      Box(
        { borderStyle: 'round', borderColor: 'magenta', paddingX: 2 },
        Text({ color: 'magenta' }, `Pos: (${lastPos().x}, ${lastPos().y})`)
      )
    )

  return Box(
    { flexDirection: 'column', padding: 1 },

    // Header
    Text({ color: 'cyan', bold: true }, '🖱️  Mouse Events Demo'),
    Box(
      { marginBottom: 1 },
      Text({ color: 'gray' }, 'All mouse events in Tuiuiu | q=quit c=clear')
    ),

    // Stats
    Stats(),

    // Main content
    Box(
      { flexDirection: 'row', gap: 2 },

      // Left column - interactive boxes
      Box(
        { flexDirection: 'column', gap: 1 },

        // Row 1 - basic boxes
        Box(
          { flexDirection: 'row', gap: 1 },
          InteractiveBox({ id: 'box1', label: 'Box 1', color: 'cyan' }),
          InteractiveBox({ id: 'box2', label: 'Box 2', color: 'green' })
        ),

        // Row 2 - more boxes
        Box(
          { flexDirection: 'row', gap: 1 },
          InteractiveBox({ id: 'box3', label: 'Box 3', color: 'yellow' }),
          InteractiveBox({ id: 'box4', label: 'Box 4', color: 'red' })
        ),

        // Drag area
        DragArea(),

        // Scroll area
        ScrollArea()
      ),

      // Right column - event log
      EventLog()
    ),

    // Footer with event legend
    Box(
      { marginTop: 1, flexDirection: 'row', gap: 2, flexWrap: 'wrap' },
      Text({ color: 'green' }, 'enter'),
      Text({ color: 'red' }, 'leave'),
      Text({ color: 'cyan' }, 'click'),
      Text({ color: 'magenta' }, 'doubleClick'),
      Text({ color: 'yellow' }, 'contextMenu'),
      Text({ color: 'blue' }, 'mouseDown'),
      Text({ color: 'blueBright' }, 'mouseUp'),
      Text({ color: 'gray' }, 'mouseMove'),
      Text({ color: 'white' }, 'scroll')
    )
  )
}

// Run
const { waitUntilExit } = render(MouseEventsDemo)
await waitUntilExit()
