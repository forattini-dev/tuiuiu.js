# Tabs

Tabbed content switcher with keyboard navigation and multiple visual styles.

## Import

```typescript
import { Tabs, createTabs, VerticalTabs, LazyTabs, TabPanel } from 'tuiuiu.js'
```

## Basic Usage

```typescript
Tabs({
  tabs: [
    { key: 'home', label: 'Home', content: Text({}, 'Home content') },
    { key: 'settings', label: 'Settings', content: Text({}, 'Settings content') },
    { key: 'help', label: 'Help', content: Text({}, 'Help content') },
  ],
})
```

Output:
```
Home  Settings  Help
━━━━
Home content
```

## Tab Interface

| Field | Type | Description |
|-------|------|-------------|
| `key` | `T` | Unique identifier |
| `label` | `string` | Tab label |
| `icon` | `string` | Optional icon |
| `content` | `VNode \| () => VNode` | Tab content |
| `disabled` | `boolean` | Disable this tab |
| `closable` | `boolean` | Allow closing (if closable enabled) |

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `Tab[]` | required | Tab definitions |
| `initialTab` | `T` | - | Initially active tab |
| `position` | `'top' \| 'bottom'` | `'top'` | Tab bar position |
| `style` | `'line' \| 'box' \| 'pills'` | `'line'` | Visual style |
| `variant` | `'primary' \| 'secondary' \| 'default'` | `'default'` | Theme variant |
| `colorActive` | `ColorValue` | theme | Active tab color |
| `colorInactive` | `ColorValue` | theme | Inactive tab color |
| `closable` | `boolean` | `false` | Allow closing tabs |
| `showCount` | `boolean` | `false` | Show tab count badge |
| `onChange` | `(key: T) => void` | - | Tab change callback |
| `onClose` | `(key: T) => void` | - | Tab close callback |
| `isActive` | `boolean` | `true` | Handle keyboard input |
| `state` | `TabsState` | - | External state |
| `contentHeight` | `number` | - | Content area height |
| `width` | `number` | - | Tabs width |

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` / `h` | Move to previous tab |
| `→` / `l` | Move to next tab |
| `Enter` / `Space` | Select focused tab |
| `x` / `w` | Close tab (if closable) |

## Visual Styles

### Line Style (default)

```typescript
Tabs({
  tabs: [...],
  style: 'line',
})
```
```
Home  Settings  Help
━━━━
```

### Box Style

```typescript
Tabs({
  tabs: [...],
  style: 'box',
})
```
```
╭──────╮  ╭──────────╮  ╭──────╮
│ Home │  │ Settings │  │ Help │
╰──────╯  ╰──────────╯  ╰──────╯
```

### Pills Style

```typescript
Tabs({
  tabs: [...],
  style: 'pills',
})
```
```
(Home)  Settings   Help
```

## Programmatic Control

```typescript
const state = createTabs({
  tabs: [...],
  onChange: (key) => console.log('Tab:', key),
})

// Navigation
state.movePrev()           // Previous tab
state.moveNext()           // Next tab
state.selectFocused()      // Select current

// Tab management
state.closeTab('settings') // Close a tab
state.addTab({            // Add new tab
  key: 'new',
  label: 'New',
  content: Text({}, 'New content'),
})

// State access
state.activeTab()          // Current active key
state.focusIndex()         // Current focus index
state.tabs()              // All tabs

// Use with component
Tabs({ state, tabs: state.tabs() })
```

## VerticalTabs

Tabs with vertical tab bar on the left:

```typescript
VerticalTabs({
  tabs: [
    { key: 'general', label: 'General', icon: '⚙️', content: generalView },
    { key: 'account', label: 'Account', icon: '👤', content: accountView },
    { key: 'privacy', label: 'Privacy', icon: '🔒', content: privacyView },
  ],
  tabWidth: 20,
  contentWidth: 50,
})
```

Output:
```
│ ● General   │ General settings content...
│ ○ Account   │
│ ○ Privacy   │
```

### VerticalTabs Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabWidth` | `number` | `20` | Tab bar width |
| `contentWidth` | `number` | - | Content area width |

## LazyTabs

Tabs that only render content when activated:

```typescript
LazyTabs({
  tabs: [
    { key: 'data', label: 'Data', content: () => loadData() },
    { key: 'chart', label: 'Chart', content: () => renderChart() },
  ],
  loadingContent: Text({ dim: true }, 'Loading...'),
})
```

## TabPanel

Wrapper for tab content:

```typescript
TabPanel({
  children: myContent,
  active: isActive,
  padding: 1,
})
```

## Features

### With Icons

```typescript
Tabs({
  tabs: [
    { key: 'code', label: 'Code', icon: '📝', content: codeView },
    { key: 'output', label: 'Output', icon: '▶️', content: outputView },
    { key: 'debug', label: 'Debug', icon: '🐛', content: debugView },
  ],
})
```

### Closable Tabs

```typescript
Tabs({
  tabs: [
    { key: 'file1', label: 'index.ts', content: file1 },
    { key: 'file2', label: 'utils.ts', content: file2 },
  ],
  closable: true,
  onClose: (key) => console.log('Closed:', key),
})
```

### Tab Position Bottom

```typescript
Tabs({
  tabs: [...],
  position: 'bottom',
})
```
```
Content here...

Home  Settings  Help
━━━━
```

### With Count Badge

```typescript
Tabs({
  tabs: [...],
  showCount: true,
})
```
```
Home  Settings  Help  (3)
```

## Examples

### File Editor Tabs

```typescript
function FileTabs({ files, onFileChange, onFileClose }) {
  return Tabs({
    tabs: files.map(f => ({
      key: f.path,
      label: f.name,
      icon: f.modified ? '●' : '',
      content: CodeBlock({ code: f.content, language: f.language }),
    })),
    closable: true,
    style: 'box',
    onChange: onFileChange,
    onClose: onFileClose,
  })
}
```

### Settings Panel

```typescript
function SettingsPanel() {
  return VerticalTabs({
    tabs: [
      {
        key: 'general',
        label: 'General',
        icon: '⚙️',
        content: Box({ flexDirection: 'column' },
          Switch({ label: 'Dark Mode' }),
          Switch({ label: 'Notifications' }),
        ),
      },
      {
        key: 'account',
        label: 'Account',
        icon: '👤',
        content: Box({ flexDirection: 'column' },
          TextInput({ label: 'Username' }),
          TextInput({ label: 'Email' }),
        ),
      },
    ],
    tabWidth: 20,
  })
}
```

### Dynamic Tabs

```typescript
const state = createTabs({ tabs: initialTabs })

// Add new tab dynamically
function openNewTab(content) {
  state.addTab({
    key: `tab-${Date.now()}`,
    label: 'New Tab',
    content,
  })
}

Tabs({ state, tabs: state.tabs() })
```

## Related

- [Select](/components/molecules/select.md) - Dropdown selection
- [Collapsible](/components/molecules/collapsible.md) - Expandable sections
- [Modal](/components/organisms/modal.md) - Modal dialogs

