# Scroll Components

> **Smooth, line-by-line scrolling for any content.** Tuiuiu provides a unified scroll system with automatic height estimation, ANSI-preserving line slicing, and reactive updates.

## Quick Decision Guide

```
What are you scrolling?
│
├─► List of items (array) ──────────► ScrollList or ChatList
│   ├─► Chat/messages (newest at bottom) ──► ChatList
│   └─► Any list (files, logs, options) ──► ScrollList
│
└─► Any content (VNodes, layouts) ──► Scroll
```

## Core Components

| Component | Use Case | Key Feature |
|:----------|:---------|:------------|
| `Scroll` | Any VNode content | Wraps anything, smooth line-by-line scroll |
| `ScrollList` | Array of items | Auto-height estimation, smooth scroll |
| `ChatList` | Chat/messaging | Inverted + auto-scroll enabled |
| `useScrollList` | Programmatic control | Methods for scroll manipulation |
| `useScroll` | Programmatic control | Control for Scroll wrapper |

## Smooth Scrolling Behavior

All scroll components use **line-based slicing** for smooth scrolling:

- Content is rendered to string
- Lines are sliced based on scroll position
- ANSI codes and styles are preserved
- Partial items appear at viewport edges (no chunky jumps)

```
┌─────────────────────────────────────┐
│ ▌ Visible portion of item 1 (2 lines)│  ← Partial item at top
│ ▌ Item 1 line 3                      │
├─────────────────────────────────────┤
│   Item 2 line 1                      │  ← Fully visible items
│   Item 2 line 2                      │
│   Item 2 line 3                      │
├─────────────────────────────────────┤
│   Item 3 line 1                      │  ← Partial item at bottom
└─────────────────────────────────────┘
     Smooth scroll shows partial items!
```

---

## ScrollList

**The primary component for scrolling lists of items.**

```typescript
import { ScrollList, useScrollList } from 'tuiuiu.js'

// Basic usage - items as array or signal
ScrollList({
  items: files(),              // Reactive signal or array
  children: (file) => FileRow({ file }),  // Render function (NOT VNode!)
  height: 20,
})

// With auto-estimated heights (default)
ScrollList({
  items: messages(),
  children: (msg) => MessageBubble({ msg }),  // Heights auto-calculated
  height: 20,
})

// With fixed height (more performant for uniform items)
ScrollList({
  items: logs(),
  children: (log) => Text({}, log),
  height: 20,
  itemHeight: 1,  // All items are 1 line
})

// With programmatic control
const list = useScrollList()

ScrollList({
  ...list.bind,  // Spread the bind object
  items: data(),
  children: (item) => Row({ item }),
  height: 20,
})

// Programmatic methods
list.scrollToBottom()
list.scrollToTop()
list.scrollTo(50)
list.scrollBy(-5)
list.isNearBottom(3)  // Within 3 lines of bottom?
```

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `items` | `T[] \| (() => T[])` | required | Items (array or reactive accessor) |
| `children` | `(item: T, index: number) => VNode` | required | Render function (NOT a VNode!) |
| `height` | `number` | required | Visible height in lines |
| `width` | `number` | `80` | Width for layout calculations |
| `itemHeight` | `number \| ((item: T) => number)` | auto | Item height (auto-estimated if omitted) |
| `inverted` | `boolean` | `false` | Inverted mode (newest at bottom) |
| `autoScroll` | `boolean` | `false` | Auto-scroll when content grows |
| `autoScrollThreshold` | `number` | `0` | Smart auto-scroll (0 = always) |
| `showScrollbar` | `boolean` | `true` | Show/hide scrollbar |
| `keysEnabled` | `boolean` | `true` | Enable keyboard navigation |
| `isActive` | `boolean` | `true` | Is component focused |
| `state` | `ScrollListState` | - | External state from useScrollList |
| `hotkeyScope` | `string` | `'global'` | Hotkey scope for conflict prevention |

### Height Estimation & Caching

When `itemHeight` is omitted, ScrollList automatically:
1. Renders each item to calculate its height
2. Caches results using content-based hashing
3. Invalidates cache when item content changes

```typescript
// Manual cache invalidation (rarely needed)
import { invalidateScrollListItem, clearScrollListCache } from 'tuiuiu.js'

// Invalidate specific item when its content changes
message.content = 'Updated!'
invalidateScrollListItem(message)

// Clear entire cache (for major data changes)
clearScrollListCache()
```

---

## ChatList

**Pre-configured ScrollList for chat/messaging UIs.**

```typescript
import { ChatList } from 'tuiuiu.js'

ChatList({
  items: messages(),
  children: (msg) => ChatBubble({ message: msg }),
  height: 20,
})
```

ChatList is simply:
```typescript
ScrollList({
  items,
  children,
  height,
  inverted: true,      // Newest items at bottom
  autoScroll: true,    // Auto-scroll on new messages
})
```

### Smart Auto-Scroll

Use `autoScrollThreshold` to respect user scroll position:

```typescript
ChatList({
  items: messages(),
  children: (msg) => Message({ msg }),
  height: 20,
  autoScrollThreshold: 5,  // Only auto-scroll if within 5 lines of bottom
})
```

When user scrolls up to read history, new messages won't jump them back down.

---

## Scroll

**Universal wrapper for scrolling any VNode content.**

Use when you need to scroll complex layouts, not just arrays of items.

```typescript
import { Scroll, useScroll } from 'tuiuiu.js'

// Wrap any content
Scroll({ height: 10 },
  Text({}, veryLongText),
)

// Complex layouts
Scroll({ height: 20, width: 60 },
  Box({ flexDirection: 'column' },
    Header(),
    Content(),
    Footer(),
  ),
)

// With programmatic control
const scroll = useScroll()

Scroll(
  { ...scroll.bind, height: 20 },
  ...contentNodes
)

scroll.scrollToBottom()
```

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `height` | `number` | required | Visible height in lines |
| `width` | `number` | `80` | Width for content layout |
| `showScrollbar` | `boolean` | `true` | Show/hide scrollbar |
| `keysEnabled` | `boolean` | `true` | Enable keyboard navigation |
| `isActive` | `boolean` | `true` | Is component focused |
| `scrollbarColor` | `ColorValue` | `'cyan'` | Scrollbar thumb color |
| `trackColor` | `ColorValue` | `'gray'` | Scrollbar track color |
| `scrollStep` | `number` | `1` | Lines per scroll step |
| `state` | `ScrollState` | - | External state from useScroll |

---

## Keyboard Navigation

All scroll components support:

| Key | Action |
|:----|:-------|
| `↑` / `k` | Scroll up |
| `↓` / `j` | Scroll down |
| `Page Up` / `u` | Page up |
| `Page Down` / `d` | Page down |
| `Home` / `g` | Scroll to top |
| `End` / `G` | Scroll to bottom |

Mouse wheel scrolling is also supported when the component is focused.

---

## Examples

### Log Viewer with Auto-Scroll

```typescript
function LogViewer() {
  const [logs, setLogs] = useState<string[]>([])

  // Simulated log streaming
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(l => [...l, `[${Date.now()}] New log entry`])
    }, 1000)
    return () => clearInterval(interval)
  })

  return ScrollList({
    items: logs(),
    children: (log, i) => Text(
      { color: log.includes('ERROR') ? 'red' : 'foreground' },
      `${i + 1}: ${log}`
    ),
    height: 20,
    itemHeight: 1,
    autoScroll: true,
  })
}
```

### Chat Application

```typescript
function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const chat = useScrollList({ inverted: true })

  const sendMessage = (text: string) => {
    setMessages(m => [...m, { text, sender: 'me', time: new Date() }])
    chat.scrollToBottom()
  }

  return Box(
    { flexDirection: 'column', height: '100%' },
    ChatList({
      ...chat.bind,
      items: messages(),
      children: (msg) => ChatBubble({ message: msg }),
      height: 20,
    }),
    TextInput({ onSubmit: sendMessage, placeholder: 'Type a message...' })
  )
}
```

### File Browser

```typescript
function FileBrowser({ files }: { files: FileInfo[] }) {
  const list = useScrollList()

  return ScrollList({
    ...list.bind,
    items: files,
    children: (file) => Box(
      { flexDirection: 'row' },
      Text({ color: 'cyan' }, file.isDir ? '📁' : '📄'),
      Text({}, ` ${file.name}`),
      Spacer(),
      Text({ color: 'gray' }, formatSize(file.size))
    ),
    height: 20,
    itemHeight: 1,  // Fixed height for performance
  })
}
```

### Modal with Scrollable Content

```typescript
function TermsModal({ terms }: { terms: string }) {
  return Modal(
    { title: 'Terms & Conditions', width: 60 },
    Scroll(
      { height: 15, width: 56 },
      Text({}, terms)
    ),
    Box(
      { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 1 },
      Button({ label: 'Decline', variant: 'secondary' }),
      Button({ label: 'Accept', variant: 'primary' })
    )
  )
}
```

### Multiple Scroll Areas with Hotkey Scopes

```typescript
function DualPane() {
  const [activePane, setActivePane] = useState<'left' | 'right'>('left')

  return Box(
    { flexDirection: 'row' },
    // Left pane
    Box({ width: '50%', borderStyle: activePane === 'left' ? 'round' : 'single' },
      ScrollList({
        items: leftItems(),
        children: (item) => LeftItem({ item }),
        height: 20,
        hotkeyScope: 'left-pane',
        isActive: activePane === 'left',
      })
    ),
    // Right pane
    Box({ width: '50%', borderStyle: activePane === 'right' ? 'round' : 'single' },
      ScrollList({
        items: rightItems(),
        children: (item) => RightItem({ item }),
        height: 20,
        hotkeyScope: 'right-pane',
        isActive: activePane === 'right',
      })
    )
  )
}
```

---

## Best Practices

### Performance

1. **Use `itemHeight` for uniform items** - Avoids height estimation overhead
2. **Use reactive signals for items** - Enables automatic updates
3. **Avoid unnecessary re-renders** - Use `createMemo` for derived data

```typescript
// Good - fixed height, reactive items
ScrollList({
  items: logs(),  // Reactive signal
  children: (log) => LogLine({ log }),
  height: 20,
  itemHeight: 1,  // Known fixed height
})

// Less optimal - variable heights, static array
ScrollList({
  items: staticArray,  // Static, no reactivity
  children: (item) => ComplexItem({ item }),  // Heights must be estimated
  height: 20,
})
```

### UX

1. **Use `autoScrollThreshold` for streaming content** - Respects user scroll position
2. **Use `ChatList` for chat UIs** - Pre-configured for best chat experience
3. **Combine with keyboard shortcuts** - Add navigation with `useHotkeys`

```typescript
// Smart auto-scroll for logs
ScrollList({
  items: logs(),
  children: (log) => LogEntry({ log }),
  height: 20,
  autoScroll: true,
  autoScrollThreshold: 3,  // Only auto-scroll if near bottom
})
```

### Accessibility

1. **Set `isActive` appropriately** - Disables keyboard when not focused
2. **Use `hotkeyScope`** - Prevents conflicts between multiple scroll areas
3. **Show scrollbar** - Visual indicator of more content

---

## API Reference

### useScrollList

```typescript
const list = useScrollList(options?: UseScrollListOptions)

// Options
interface UseScrollListOptions {
  inverted?: boolean  // Start from bottom
}

// Returns
interface UseScrollListReturn {
  scrollToBottom(): void
  scrollToTop(): void
  scrollTo(pos: number): void
  scrollBy(delta: number): void
  scrollTop(): number
  maxScroll(): number
  isNearBottom(threshold?: number): boolean
  bind: { state: ScrollListState }
}
```

### useScroll

```typescript
const scroll = useScroll(options?: UseScrollOptions)

// Options
interface UseScrollOptions {
  height?: number
}

// Returns
interface UseScrollReturn {
  scrollToBottom(): void
  scrollToTop(): void
  scrollTo(pos: number): void
  scrollBy(delta: number): void
  scrollTop(): number
  maxScroll(): number
  bind: { state: ScrollState }
}
```

### Cache Utilities

```typescript
import {
  invalidateScrollListItem,  // Invalidate single item
  clearScrollListCache       // Clear entire cache
} from 'tuiuiu.js'

// When item content changes
invalidateScrollListItem(item)

// Major data refresh
clearScrollListCache()
```

---

## Related

- [Select](/components/forms.md#select) — Has built-in scroll with `maxVisible`
- [Modal](/components/overlays.md) — Use Scroll for long modal content
- [VirtualList](/components/layout.md#virtuallist) — For very large lists (10k+ items) with selection
