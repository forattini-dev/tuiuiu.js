# Import Map

All public APIs organized by category. Import from `tuiuiu.js` for convenience,
`tuiuiu.js/minimal` for the compact application runtime, or dedicated
subpaths as the application grows.

## Signals & State

```typescript
import {
  createSignal,        // Module-level reactive value [getter, setter]
  createEffect,        // Auto-tracking side effect
  createMemo,          // Derived/computed value
  batch,               // Batch multiple signal updates
  untrack,             // Read signals without tracking
  onCleanup,           // Register cleanup in current effect
  createReactiveStore, // Per-property reactive store (proxy-based)
  createStore,         // Redux-like reducer store
} from 'tuiuiu.js';
```

## Hooks (inside components only)

```typescript
import {
  useState,      // Persistent reactive state
  useEffect,     // Reactive side effect
  useMemo,       // Cache value by deps
  useComputed,   // Auto-tracking cached VNode
  useInput,      // Raw keyboard input
  useHotkeys,    // Keyboard shortcuts
  useApp,        // App lifecycle (exit)
  useFocus,      // Focus management
  useFps,        // Frame rate monitor
  useInterval,   // Repeating timer
  useTimeout,    // One-shot timer
  useMouse,      // Mouse events
  useForm,       // Form state management
  useClipboard,  // Clipboard (OSC 52)
} from 'tuiuiu.js';
```

## Performance

```typescript
import {
  Computed,      // Auto-tracking reactive VNode isolation
  ComputedText,  // Shorthand for reactive text
  Memo,          // Cache VNode subtree by deps
  PreText,       // Pre-styled, validated SGR text
} from 'tuiuiu.js';
```

## Primitives (layout building blocks)

```typescript
import {
  Box,           // Flexbox container
  Text,          // Styled text
  Spacer,        // Flexible space
  Newline,       // Blank lines
  Fragment,      // Group without wrapper
  When,          // Conditional rendering
  Each,          // List rendering
  Divider,       // Horizontal/vertical line
  Slot,          // Reserved layout space
  Transform,     // Text transform wrapper
  Static,        // Permanent content above dynamic
  Panel,         // Bordered container with title
  SplitBox,      // Resizable split panes
  Canvas,        // Braille/block drawing
} from 'tuiuiu.js';
```

## Layout helpers

```typescript
import {
  Screen,        // Full terminal, column layout
  Header,        // Top bar (height: auto)
  Main,          // Content area (height: fill)
  Footer,        // Bottom bar (height: auto)
  Sidebar,       // Side panel (height: fill)
  VStack,        // Vertical stack (column)
  HStack,        // Horizontal stack (row)
} from 'tuiuiu.js';
```

## Typography

```typescript
import {
  Title,         // Bold heading text
  Subtitle,      // Secondary heading
  Caption,       // Small helper text
  Label,         // Form label
} from 'tuiuiu.js';
```

## Atoms

```typescript
import {
  Button,        // Clickable button
  Spinner,       // Loading indicator
  TextInput,     // Text field
  Badge,         // Status badge
  Switch,        // Toggle switch
  Slider,        // Value slider
  ProgressBar,   // Progress indicator
  Checkbox,      // Check/uncheck
  Avatar,        // User avatar
} from 'tuiuiu.js';
```

## Molecules

```typescript
import {
  Select,        // Dropdown selector
  Tabs,          // Tab navigation
  Table,         // Data table
  CodeBlock,     // Syntax-highlighted code
  Calendar,      // Date picker
  TreeView,      // File tree
  Toast,         // Notification toast
} from 'tuiuiu.js';
```

## Organisms

```typescript
import {
  Modal,         // Dialog overlay
  DataTable,     // Sortable/filterable table
  CommandPalette,// Command search (Ctrl+K)
  FileBrowser,   // File explorer
  Wizard,        // Multi-step wizard
} from 'tuiuiu.js';

// Unstable APIs use the explicit experimental entry point.
import {
  createEditableDataTable,
  createVirtualDataTable,
  VirtualDataTable,
  EditableDataTable,
} from 'tuiuiu.js/experimental';
```

## App lifecycle

```typescript
import {
  render,        // Mount app to terminal
  renderOnce,    // Render single frame (no interactivity)
  setTheme,      // Select or reactively switch the runtime theme
  darkTheme,     // Built-in dark theme
  lightTheme,    // Built-in light theme
} from 'tuiuiu.js';
```

## Colors (standalone, no UI framework needed)

```typescript
import { red, green, bold, dim, c } from 'tuiuiu.js/colors';

console.log(red('Error!'));
console.log(c.green.bold('Success!'));
```

## Subpath imports

| Path | Contents |
|------|----------|
| `tuiuiu.js` | Everything |
| `tuiuiu.js/minimal` | render, primitives, signals, essential hooks, and themes without component catalogs or tooling |
| `tuiuiu.js/primitives` | Box, Text, signals, store |
| `tuiuiu.js/atoms` | Button, Spinner, TextInput, etc. |
| `tuiuiu.js/molecules` | Select, Tabs, Table, etc. |
| `tuiuiu.js/organisms` | Modal, DataTable, FileBrowser, CommandPalette |
| `tuiuiu.js/experimental` | Unstable VirtualDataTable and EditableDataTable APIs |
| `tuiuiu.js/styling` | Optional standalone terminal style-rule parser/resolver; not used automatically by rendering |
| `tuiuiu.js/templates` | AppShell, Page, VStack, HStack |
| `tuiuiu.js/hooks` | All hooks |
| `tuiuiu.js/app` | render, renderOnce |
| `tuiuiu.js/colors` | ANSI color functions |
| `tuiuiu.js/core` | Layout, renderer, theme (advanced) |
