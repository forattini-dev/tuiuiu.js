# API Patterns

Understanding how to pass children and content to Tuiuiu components is **essential**. Different components use different patterns based on their purpose.

> **Why does this matter?** Using the wrong pattern will cause your app to fail silently or throw errors. This guide explains each pattern and when to use it.

## The Four Patterns

| Pattern | Components | When to Use |
|---------|------------|-------------|
| [Variadic Children](#1-variadic-children) | `Box`, `Text`, `VStack`, `HStack` | Free-form layout composition |
| [Props Children](#2-props-children) | `Page`, `AppShell`, `Modal`, `Collapsible` | Components with named slots |
| [Data-Driven Content](#3-data-driven-content) | `Tabs`, `Select`, `Tree`, `Table` | List-based configuration |
| [Render Function](#4-render-function) | `ScrollList`, `Static`, `Each` | Dynamic list rendering |

---

## 1. Variadic Children

**Used by:** `Box`, `Text`, `VStack`, `HStack`, `Center`, `Fragment`

Children are passed as **additional arguments** after the props object.

```typescript
// ✅ CORRECT - children after props
Box({ padding: 1 },
  Text({}, 'First child'),
  Text({}, 'Second child'),
  Text({}, 'Third child')
)

// ✅ CORRECT - nested composition
Box({ flexDirection: 'column' },
  Box({ flexDirection: 'row' },
    Text({}, 'Left'),
    Text({}, 'Right')
  ),
  Text({}, 'Below')
)
```

```typescript
// ❌ WRONG - using children prop
Box({ padding: 1, children: Text({}, 'Child') })
// This may work but is NOT the intended API

// ❌ WRONG - array of children
Box({ padding: 1 }, [Text({}, 'A'), Text({}, 'B')])
// Pass children as separate arguments, not array
```

### Why This Pattern?

- **Primitives** need maximum flexibility for layout
- Follows React's `createElement(type, props, ...children)` pattern
- Natural composition: components nest visually like the output
- Unlimited number of children

### Signature

```typescript
function Box(props: BoxProps, ...children: VNode[]): VNode
function Text(props: TextProps, ...children: string[]): VNode
```

---

## 2. Props Children

**Used by:** `Page`, `AppShell`, `Modal`, `Collapsible`, `FormField`, `FormGroup`, `Grid`, `Details`, `Center`, `ContentWidth`

Children are passed as a **named prop** called `children`.

```typescript
// ✅ CORRECT - children as prop
Page({
  title: 'Settings',
  footer: StatusBar(),
  children: SettingsForm()  // Main content area
})

// ✅ CORRECT - multiple named slots
AppShell({
  header: Header(),         // Slot: header
  sidebar: Navigation(),    // Slot: sidebar
  footer: StatusBar(),      // Slot: footer
  children: MainContent()   // Slot: main content
})

// ✅ CORRECT - form field wrapping input
FormField({
  label: 'Email',
  error: errors.email,
  helperText: 'We will not share your email',
  children: TextInput({ ...form.field('email') })
})
```

```typescript
// ❌ WRONG - passing as argument
Page({ title: 'Settings' }, SettingsForm())
// Page does NOT accept variadic children

// ❌ WRONG - forgetting children
Page({ title: 'Settings' })
// TypeScript error: children is required
```

### Why This Pattern?

- Component has **multiple named slots** (header, footer, sidebar, children)
- `children` is just ONE of several content areas
- TypeScript can enforce `children` as **required**
- Explicit about where each piece goes

### Components Using This Pattern

| Component | Slots |
|-----------|-------|
| `Page` | `header?`, `footer?`, `children` |
| `AppShell` | `header?`, `sidebar?`, `aside?`, `footer?`, `children` |
| `Modal` | `title?`, `footer?`, `children` |
| `Collapsible` | `title`, `children` |
| `FormField` | `label`, `error?`, `helperText?`, `children` |
| `FormGroup` | `title?`, `children` |
| `Grid` | `children` (array of `GridCell`) |
| `Details` | `summary`, `children` |

### Signature

```typescript
interface PageProps {
  title?: string;
  header?: VNode;
  footer?: VNode;
  children: VNode;  // Required!
}

function Page(props: PageProps): VNode
```

---

## 3. Data-Driven Content

**Used by:** `Tabs`, `Select`, `MultiSelect`, `RadioGroup`, `Tree`, `Table`, `DataTable`, `ButtonGroup`

Content is defined inside **data objects** within an array.

```typescript
// ✅ CORRECT - tabs with content inside each tab object
Tabs({
  tabs: [
    { key: 'files', label: 'Files', icon: '📁', content: FilesPanel() },
    { key: 'settings', label: 'Settings', icon: '⚙️', content: SettingsPanel() },
    { key: 'help', label: 'Help', disabled: true, content: HelpPanel() },
  ],
  isActive: true,
})

// ✅ CORRECT - select with items
Select({
  items: [
    { value: 'sm', label: 'Small' },
    { value: 'md', label: 'Medium' },
    { value: 'lg', label: 'Large' },
  ],
  onChange: setSize,
})

// ✅ CORRECT - button group
ButtonGroup({
  buttons: [
    { label: 'Save', onClick: save, variant: 'solid' },
    { label: 'Cancel', onClick: cancel, variant: 'outline' },
  ],
})

// ✅ CORRECT - tree with nested children
Tree({
  nodes: [
    {
      id: 'src',
      label: 'src',
      icon: '📁',
      children: [
        { id: 'index', label: 'index.ts', icon: '📄' },
        { id: 'utils', label: 'utils.ts', icon: '📄' },
      ]
    },
  ],
})
```

```typescript
// ❌ WRONG - using children prop for Tabs
Tabs({
  tabs: [...],
  children: SomeContent()  // NO! Tabs doesn't have children prop
})

// ❌ WRONG - content outside of tab object
Tabs({
  tabs: [{ key: 'a', label: 'A' }],  // Missing content!
  content: ContentA()  // NO! content goes INSIDE each tab
})
```

### Why This Pattern?

- Each item is a **complete data object** with multiple properties
- `content` is just ONE property alongside `key`, `label`, `icon`, `disabled`
- Enables operations: `tabs.filter()`, `tabs.map()`, dynamic add/remove
- TypeScript validates entire item structure

### Data Structure

```typescript
// Tab item
interface Tab {
  key: string;       // Unique identifier
  label: string;     // Display text
  icon?: string;     // Optional icon
  disabled?: boolean;
  content: VNode;    // The content for this tab
}

// Select item
interface SelectItem {
  value: any;        // The value
  label: string;     // Display text
  description?: string;
  disabled?: boolean;
  // NO content - Select shows labels, not custom content
}

// Button in ButtonGroup
interface ButtonProps {
  label: string;
  onClick?: () => void;
  variant?: 'solid' | 'outline' | 'ghost';
  disabled?: boolean;
  // NO content - Button IS the content
}
```

---

## 4. Render Function

**Used by:** `ScrollList`, `ChatList`, `Static`, `Each`

Children is a **function** that receives each item and returns a VNode.

```typescript
// ✅ CORRECT - render function for each item
ScrollList({
  items: messages(),
  children: (msg) => ChatBubble({ message: msg }),
  height: 20,
})

// ✅ CORRECT - with index
Static({
  items: logs(),
  children: (log, index) => Text({ key: index, color: 'gray' }, log),
})

// ✅ CORRECT - Each for inline lists
Box({},
  Each(items(), (item) => ListItem({ item }))
)
```

```typescript
// ❌ WRONG - passing VNode directly
ScrollList({
  items: messages(),
  children: ChatBubble({ message: messages()[0] })  // NO! Must be function
})

// ❌ WRONG - pre-mapping items
ScrollList({
  items: messages().map(m => ChatBubble({ message: m })),  // NO!
  children: ???
})
```

### Why This Pattern?

- `items` is a **reactive array** that changes over time
- Function is called for **each item** when rendering
- Enables **virtual scrolling** (only visible items rendered)
- Defers rendering until needed

### Reactive Data Sources (Signals & Stores)

List components support **reactive data sources** - when data changes, the list automatically updates!

| Source | Example | Auto-Updates? |
|--------|---------|---------------|
| Static array | `items: [1, 2, 3]` | ❌ No |
| Signal | `items: items` or `items: () => items()` | ✅ Yes |
| Store | `items: () => store.getState().items` | ✅ Yes |

```typescript
// ✅ With createSignal - auto-updates!
const [items, setItems] = createSignal<Item[]>([])

ScrollList({
  items,  // Signal accessor is reactive
  children: (item) => ListItem({ item }),
  height: 20,
})

setItems(prev => [...prev, newItem]) // List re-renders!

// ✅ With createStore (Redux-like) - auto-updates!
const store = createStore(todoReducer, { items: [] })

ScrollList({
  items: () => store.getState().items,  // Derived from store
  children: (item) => TodoItem({ item }),
  height: 20,
})

store.dispatch({ type: 'ADD', payload: newItem }) // List re-renders!
```

### Signature

```typescript
interface ScrollListProps<T> {
  items: T[] | (() => T[]);
  children: (item: T, index: number) => VNode;
  height: number;
  // ...
}
```

---

## Quick Reference Table

| Component | Pattern | Example |
|-----------|---------|---------|
| `Box` | Variadic | `Box({}, child1, child2)` |
| `Text` | Variadic | `Text({}, 'Hello ', 'World')` |
| `VStack` | Variadic | `VStack({ gap: 1 }, a, b, c)` |
| `HStack` | Variadic | `HStack({ gap: 1 }, a, b, c)` |
| `Page` | Props | `Page({ children: content })` |
| `AppShell` | Props | `AppShell({ header, children })` |
| `Modal` | Props | `Modal({ title, children })` |
| `Collapsible` | Props | `Collapsible({ title, children })` |
| `FormField` | Props | `FormField({ label, children })` |
| `FormGroup` | Props | `FormGroup({ title, children })` |
| `Grid` | Props | `Grid({ columns, children: [...] })` |
| `Tabs` | Data | `Tabs({ tabs: [{ content }] })` |
| `Select` | Data | `Select({ items: [...] })` |
| `ButtonGroup` | Data | `ButtonGroup({ buttons: [...] })` |
| `Tree` | Data | `Tree({ nodes: [...] })` |
| `Table` | Data | `Table({ columns, data })` |
| `ScrollList` | Render | `ScrollList({ items, children: fn })` |
| `Static` | Render | `Static({ items, children: fn })` |
| `Each` | Render | `Each(items, fn)` |

---

## Common Mistakes

### Mistake 1: Using `children:` with Variadic Components

```typescript
// ❌ WRONG
Box({ children: Text({}, 'Hello') })

// ✅ CORRECT
Box({}, Text({}, 'Hello'))
```

### Mistake 2: Using Variadic with Props Components

```typescript
// ❌ WRONG
Page({ title: 'Home' }, Content())

// ✅ CORRECT
Page({ title: 'Home', children: Content() })
```

### Mistake 3: Forgetting `content` in Tabs

```typescript
// ❌ WRONG - content outside tab
Tabs({
  tabs: [{ key: 'a', label: 'A' }],
  children: ContentA()
})

// ✅ CORRECT - content inside each tab
Tabs({
  tabs: [{ key: 'a', label: 'A', content: ContentA() }],
})
```

### Mistake 4: Passing VNode Instead of Function

```typescript
// ❌ WRONG
ScrollList({
  items: data,
  children: Item({ data: data[0] })  // VNode, not function!
})

// ✅ CORRECT
ScrollList({
  items: data,
  children: (item) => Item({ data: item })  // Function!
})
```

---

## Why Different Patterns?

| Pattern | Purpose | Flexibility |
|---------|---------|-------------|
| **Variadic** | Layout primitives | Maximum - unlimited children |
| **Props** | Slot-based layouts | Structured - named areas |
| **Data** | Configuration-driven | Dynamic - array operations |
| **Render** | List optimization | Efficient - deferred rendering |

The pattern matches the component's **purpose**:

- **Layout primitives** (`Box`) need unlimited composition
- **Page layouts** (`AppShell`) need organized slots
- **Selection components** (`Tabs`) need data structures
- **List components** (`ScrollList`) need efficient rendering

---

## Related

- [Primitives](./primitives.md) - Box, Text, and layout basics
- [Component Hierarchy](./hierarchy.md) - Atoms, Molecules, Organisms
- [Signals](./signals.md) - Reactive state management
