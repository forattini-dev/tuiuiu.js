# Scroll Components

> **Universal scrolling for any content.** Tuiuiu provides multiple scroll APIs designed for incredible developer experience - from simple wrappers to specialized list components.

## Overview

| Component | Use Case | Key Feature |
|:----------|:---------|:------------|
| `Scroll` | Any content | Wraps anything, auto-scrollbar |
| `ScrollList` | Item lists | Auto-height estimation |
| `ChatList` | Chat/messaging | Inverted, newest at bottom |
| `useScrollList` | Advanced control | Programmatic scroll |
| `useScroll` | Content control | Scroll any wrapped content |

## Scroll Wrapper

The simplest way to add scroll to any content.

```typescript
import { Scroll } from 'tuiuiu.js'

// Wrap any content
Scroll({ height: 10 },
  Text({}, longText),
)

// Complex layouts
Scroll({ height: 20, width: 60 },
  Box({ flexDirection: 'column' },
    Header(),
    Content(),
    Footer(),
  ),
)
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
| `state` | `ScrollState` | - | External state for control |

### With Control

```typescript
import { Scroll, useScroll } from 'tuiuiu.js'

function LogViewer() {
  const scroll = useScroll()

  // Programmatic control
  useEffect(() => {
    scroll.scrollToBottom()
  }, [logs])

  return Scroll(
    { ...scroll.bind, height: 20 },
    ...logs.map(log => Text({}, log))
  )
}
```

## ScrollList

For rendering lists of items with automatic height estimation.

```typescript
import { ScrollList } from 'tuiuiu.js'

// Simple list
ScrollList({
  items: files(),
  children: (file) => FileRow({ file }),
  height: 20,
})

// With fixed item height (more performant)
ScrollList({
  items: logs(),
  children: (log) => Text({}, log),
  height: 20,
  itemHeight: 1,
})

// With calculated height
ScrollList({
  items: messages(),
  children: (msg) => MessageBubble({ msg }),
  height: 20,
  itemHeight: (msg) => calculateHeight(msg),
})
```

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `items` | `T[] \| (() => T[])` | required | Items to display |
| `children` | `(item: T, index: number) => VNode` | required | Render function |
| `height` | `number` | required | Visible height in lines |
| `width` | `number` | `80` | Width for layout |
| `itemHeight` | `number \| ((item: T) => number)` | auto | Item height (auto-estimated if omitted) |
| `inverted` | `boolean` | `false` | Inverted mode (newest at bottom) |
| `showScrollbar` | `boolean` | `true` | Show/hide scrollbar |
| `keysEnabled` | `boolean` | `true` | Enable keyboard navigation |
| `isActive` | `boolean` | `true` | Is component focused |
| `state` | `ScrollListState` | - | External state for control |

### Auto Height Estimation

When `itemHeight` is not provided, ScrollList automatically estimates each item's height by rendering it and counting lines. Results are cached using WeakMap for performance.

```typescript
// Heights are auto-estimated and cached
ScrollList({
  items: messages(),
  children: (msg) => ChatBubble({ message: msg }),
  height: 20,
})

// Invalidate cache when item content changes
import { invalidateScrollListItem } from 'tuiuiu.js'

message.content = 'Updated content'
invalidateScrollListItem(message)
```

## ChatList

Pre-configured for chat/messaging UIs with inverted scroll (newest at bottom).

```typescript
import { ChatList } from 'tuiuiu.js'

ChatList({
  items: messages(),
  children: (msg) => ChatBubble({ message: msg }),
  height: 20,
})
```

ChatList is equivalent to:

```typescript
ScrollList({
  items: messages(),
  children: (msg) => ChatBubble({ message: msg }),
  height: 20,
  inverted: true,
})
```

## useScrollList Hook

For advanced control over scroll lists.

```typescript
import { ScrollList, useScrollList } from 'tuiuiu.js'

function MessageList() {
  const list = useScrollList({ inverted: true })

  // Control methods
  const sendMessage = (text: string) => {
    addMessage(text)
    list.scrollToBottom() // Scroll to newest
  }

  return ScrollList({
    ...list.bind,
    items: messages(),
    children: (msg) => Message({ msg }),
    height: 20,
  })
}
```

### Return Value

| Property | Type | Description |
|:---------|:-----|:------------|
| `scrollToBottom()` | `() => void` | Scroll to bottom |
| `scrollToTop()` | `() => void` | Scroll to top |
| `scrollTo(pos)` | `(pos: number) => void` | Scroll to position |
| `scrollBy(delta)` | `(delta: number) => void` | Scroll by delta |
| `scrollTop()` | `() => number` | Current scroll position |
| `maxScroll()` | `() => number` | Maximum scroll value |
| `bind` | `{ state: ScrollListState }` | Props to spread into ScrollList |

## Keyboard Navigation

All scroll components support keyboard navigation:

| Key | Action |
|:----|:-------|
| `↑` / `k` | Scroll up |
| `↓` / `j` | Scroll down |
| `Page Up` / `u` | Page up |
| `Page Down` / `d` | Page down |
| `Home` / `g` | Scroll to top |
| `End` / `G` | Scroll to bottom |

## Mouse Support

All scroll components support mouse wheel scrolling when the component is focused.

## Examples

### Log Viewer

```typescript
function LogViewer({ logs }: { logs: string[] }) {
  const scroll = useScroll()

  // Auto-scroll to bottom when new logs arrive
  createEffect(() => {
    logs.length // Track dependency
    scroll.scrollToBottom()
  })

  return Scroll(
    { ...scroll.bind, height: 20, width: 80 },
    ...logs.map((log, i) =>
      Text({ color: log.includes('ERROR') ? 'red' : 'white' }, `${i + 1}: ${log}`)
    )
  )
}
```

### Chat Application

```typescript
function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const chatList = useScrollList({ inverted: true })

  const sendMessage = (text: string) => {
    setMessages(m => [...m, { text, sender: 'me', time: new Date() }])
    chatList.scrollToBottom()
  }

  return Box(
    { flexDirection: 'column', height: '100%' },
    ChatList({
      ...chatList.bind,
      items: messages(),
      children: (msg) => ChatBubble({ message: msg }),
      height: 20,
    }),
    TextInput({ onSubmit: sendMessage })
  )
}
```

### File Browser

```typescript
function FileBrowser({ files }: { files: FileInfo[] }) {
  return ScrollList({
    items: files,
    children: (file) =>
      Box(
        { flexDirection: 'row' },
        Text({ color: 'cyan' }, file.isDir ? '📁' : '📄'),
        Text({}, ` ${file.name}`),
        Spacer(),
        Text({ color: 'gray' }, formatSize(file.size))
      ),
    height: 20,
    itemHeight: 1, // Fixed height for performance
  })
}
```

### Terms & Conditions Modal

```typescript
function TermsModal({ terms }: { terms: string }) {
  return Modal(
    { title: 'Terms & Conditions', width: 60, height: 20 },
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

## Migration from DynamicList

`DynamicList` has been replaced by `ScrollList` and `ChatList` with a much simpler API:

### Before

```typescript
// 50+ lines of boilerplate
const [layoutConfig] = useState({ maxWidth: bubbleMaxWidth })
layoutConfig().maxWidth = bubbleMaxWidth

const getMessageHeight = (msg: Message) => {
  const contentWidth = Math.max(10, layoutConfig().maxWidth - 4)
  const lines = getVisualLines(msg.content, contentWidth, true)
  return 1 + lines.length + 2 + 1
}

const [listState] = useState(createDynamicList({
  items: () => messages(),
  height: 10,
  getItemHeight: getMessageHeight,
  renderItem: (msg) => ChatBubble({ message: msg, maxWidth: layoutConfig().maxWidth }),
  inverted: true
}))

DynamicList({
  state: listState(),
  items: () => messages(),
  height: messagesHeight,
  getItemHeight: getMessageHeight,
  renderItem: (msg) => ChatBubble({ message: msg, maxWidth: bubbleMaxWidth }),
  inverted: true,
  keysEnabled: true
})
```

### After

```typescript
// 8 lines, zero boilerplate!
const chatList = useScrollList({ inverted: true })

ChatList({
  ...chatList.bind,
  items: messages(),
  children: (msg) => ChatBubble({ message: msg, maxWidth: bubbleMaxWidth }),
  height: messagesHeight,
  width: width - 2,
})
```

## Related

- [Select](/components/forms.md#select) — Has built-in scroll with `maxVisible`
- [Modal](/components/overlays.md) — Use Scroll for long content
- [VirtualList](/components/layout.md#virtuallist) — For very large lists with selection
