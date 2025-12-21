# Design: Comprehensive UI Components

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Application                              │
├─────────────────────────────────────────────────────────────────┤
│  ThemeProvider                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Components (Box, Text, Charts, Forms, etc.)                ││
│  │  ┌─────────────────────────────────────────────────────────┐││
│  │  │  Hooks (useState, useInput, useMouse, useTheme)         │││
│  │  │  ┌─────────────────────────────────────────────────────┐│││
│  │  │  │  Signals (createSignal, createEffect, batch)        ││││
│  │  │  └─────────────────────────────────────────────────────┘│││
│  │  └─────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Renderer (VNode → ANSI)  │  Layout Engine (Flexbox)            │
├─────────────────────────────────────────────────────────────────┤
│  Terminal (stdin/stdout)  │  Mouse/Keyboard Events               │
└─────────────────────────────────────────────────────────────────┘
```

## Technical Decisions

### Decision 1: Mouse Support Implementation

**Context**: Need to support mouse events for interactive components.

**Options Considered**:
1. **SGR Mouse Protocol** - Modern, supports coordinates > 223
2. **X10 Mouse Protocol** - Legacy, limited coordinate range
3. **Custom Protocol** - Roll our own

**Decision**: Use **SGR Mouse Protocol** with X10 fallback

**Rationale**:
- SGR is widely supported (xterm, iTerm2, Windows Terminal, Kitty)
- Provides button state, modifiers, and pixel-accurate coordinates
- X10 fallback ensures compatibility with older terminals

**Implementation**:
```typescript
// Enable mouse tracking
const ENABLE_MOUSE = '\x1b[?1000h\x1b[?1002h\x1b[?1006h'
const DISABLE_MOUSE = '\x1b[?1000l\x1b[?1002l\x1b[?1006l'

// Parse SGR mouse event: \x1b[<button;x;yM or \x1b[<button;x;ym
function parseMouseEvent(sequence: string): MouseEvent | null
```

---

### Decision 2: Theming System Architecture

**Context**: Need a flexible theming system that doesn't add runtime overhead.

**Options Considered**:
1. **CSS-like Stylesheets** - Like Textual's TCSS
2. **Context-based Themes** - Like React's Context API
3. **Global Config** - Simple global state

**Decision**: Use **Context-based Themes** with compile-time optimization

**Rationale**:
- Familiar pattern for React developers
- Allows nested themes (e.g., dark modal in light app)
- Can be tree-shaken if not used

**Implementation**:
```typescript
// Theme context using signals
const themeSignal = createSignal<Theme>(defaultTheme)

export function ThemeProvider(theme: Theme, ...children: VNode[]): VNode {
  return batch(() => {
    themeSignal[1](theme)
    return Fragment({}, ...children)
  })
}

export function useTheme(): Theme {
  return themeSignal[0]()
}
```

**Default Themes**:
```typescript
export const darkTheme: Theme = {
  name: 'dark',
  colors: {
    primary: '#3b82f6',
    secondary: '#6366f1',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9',
    textMuted: '#64748b',
    border: '#334155',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#06b6d4',
  },
  spacing: { xs: 1, sm: 2, md: 4, lg: 8, xl: 16 },
  borderRadius: 'md',
}

export const lightTheme: Theme = {
  name: 'light',
  colors: {
    primary: '#2563eb',
    secondary: '#4f46e5',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textMuted: '#64748b',
    border: '#e2e8f0',
    success: '#16a34a',
    warning: '#d97706',
    error: '#dc2626',
    info: '#0891b2',
  },
  spacing: { xs: 1, sm: 2, md: 4, lg: 8, xl: 16 },
  borderRadius: 'md',
}
```

---

### Decision 3: Animation System

**Context**: Need smooth animations for transitions without blocking the event loop.

**Options Considered**:
1. **setInterval-based** - Simple, predictable timing
2. **requestAnimationFrame-like** - 60fps targeting
3. **Signal-based Transitions** - Declarative, reactive

**Decision**: Use **Signal-based Transitions** with frame scheduling

**Rationale**:
- Fits naturally with existing signal architecture
- Declarative API is more ergonomic
- Can batch multiple animations efficiently

**Implementation**:
```typescript
export function useAnimation(options: AnimationOptions) {
  const frameRef = { current: null as NodeJS.Timeout | null }
  const startTime = { current: 0 }

  const start = () => {
    startTime.current = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime.current
      const progress = Math.min(elapsed / options.duration, 1)
      const eased = easingFunctions[options.easing || 'linear'](progress)
      options.onFrame(eased)
      if (progress < 1) {
        frameRef.current = setTimeout(tick, 16) // ~60fps
      }
    }
    tick()
  }

  const stop = () => {
    if (frameRef.current) clearTimeout(frameRef.current)
  }

  return { start, stop }
}
```

**Easing Functions** (built-in):
```typescript
const easingFunctions = {
  linear: (t: number) => t,
  'ease-in': (t: number) => t * t,
  'ease-out': (t: number) => t * (2 - t),
  'ease-in-out': (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
}
```

---

### Decision 4: ASCII Fallback Strategy

**Context**: Some terminals don't support Unicode characters.

**Options Considered**:
1. **Auto-detection Only** - Detect and switch automatically
2. **User Configuration** - Let user choose
3. **Both** - Auto-detect with override

**Decision**: Use **Both** - Auto-detection with user override

**Rationale**:
- Best of both worlds
- CI/CD environments may need explicit ASCII mode
- Users can override for accessibility

**Implementation**:
```typescript
let renderMode: 'unicode' | 'ascii' | 'auto' = 'auto'

export function setRenderMode(mode: 'unicode' | 'ascii' | 'auto'): void {
  renderMode = mode
}

export function getRenderMode(): 'unicode' | 'ascii' {
  if (renderMode !== 'auto') return renderMode
  return detectTerminalCapabilities().unicode ? 'unicode' : 'ascii'
}

export function detectTerminalCapabilities() {
  const term = process.env.TERM || ''
  const colorTerm = process.env.COLORTERM || ''

  return {
    unicode: !term.includes('linux') && !term.includes('dumb'),
    colors: colorTerm === 'truecolor' ? 'truecolor' :
            term.includes('256color') ? 256 : 16,
    mouse: term.includes('xterm') || term.includes('screen') ||
           term.includes('tmux') || term.includes('kitty'),
  }
}
```

**Character Sets**:
```typescript
export const CHARS = {
  unicode: {
    sparkline: '▁▂▃▄▅▆▇█',
    progress: '━',
    progressEmpty: '─',
    border: { tl: '╭', tr: '╮', bl: '╰', br: '╯', h: '─', v: '│' },
    checkbox: { checked: '◉', unchecked: '○' },
    radio: { selected: '●', unselected: '○' },
    tree: { branch: '├', last: '└', pipe: '│', dash: '─' },
    arrow: { up: '▲', down: '▼', left: '◀', right: '▶' },
  },
  ascii: {
    sparkline: '_.-:=*#@',
    progress: '=',
    progressEmpty: '-',
    border: { tl: '+', tr: '+', bl: '+', br: '+', h: '-', v: '|' },
    checkbox: { checked: '[x]', unchecked: '[ ]' },
    radio: { selected: '(*)', unselected: '( )' },
    tree: { branch: '|--', last: '`--', pipe: '|', dash: '-' },
    arrow: { up: '^', down: 'v', left: '<', right: '>' },
  },
}
```

---

### Decision 5: Chart Rendering Algorithm

**Context**: Need efficient algorithms for rendering charts in terminal.

**Approach**: Implement from scratch, using recker as reference only.

**Sparkline Algorithm**:
```typescript
export function renderSparkline(data: number[], width: number): string {
  const chars = getRenderMode() === 'unicode'
    ? '▁▂▃▄▅▆▇█'
    : '_.-:=*#@'

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  // Resample if needed
  const resampled = data.length > width
    ? resample(data, width)
    : data

  // Pad if needed
  const padded = resampled.length < width
    ? [...Array(width - resampled.length).fill(null), ...resampled]
    : resampled

  return padded
    .map(v => v === null ? ' ' : chars[Math.floor((v - min) / range * (chars.length - 1))])
    .join('')
}
```

**BarChart Algorithm**:
```typescript
export function renderBarChart(
  data: Array<{ label: string; value: number }>,
  options: { width: number; direction: 'horizontal' | 'vertical' }
): string[] {
  const maxValue = Math.max(...data.map(d => d.value))
  const maxLabelLen = Math.max(...data.map(d => d.label.length))

  if (options.direction === 'horizontal') {
    const barWidth = options.width - maxLabelLen - 3
    return data.map(d => {
      const filled = Math.round((d.value / maxValue) * barWidth)
      const bar = '█'.repeat(filled) + '░'.repeat(barWidth - filled)
      return `${d.label.padStart(maxLabelLen)} │${bar}│`
    })
  }
  // Vertical implementation...
}
```

---

## File Structure

```
src/
├── core/
│   ├── mouse.ts           # Mouse event parsing and hook
│   ├── theme.ts           # Theme context and hooks
│   ├── animation.ts       # Animation primitives
│   └── capabilities.ts    # Terminal detection
│
├── components/
│   ├── data-viz/
│   │   ├── sparkline.ts
│   │   ├── bar-chart.ts
│   │   ├── line-chart.ts
│   │   └── gauge.ts
│   │
│   ├── data-display/
│   │   ├── tree.ts
│   │   ├── data-table.ts
│   │   └── calendar.ts
│   │
│   ├── forms/
│   │   ├── multi-select.ts
│   │   ├── autocomplete.ts
│   │   ├── radio-group.ts
│   │   ├── switch.ts
│   │   └── slider.ts
│   │
│   ├── layout/
│   │   ├── tabs.ts
│   │   ├── collapsible.ts
│   │   ├── scroll-area.ts
│   │   └── grid.ts
│   │
│   └── visual/
│       ├── big-text.ts
│       ├── digits.ts
│       └── tooltip.ts
│
└── utils/
    └── chars.ts           # Unicode/ASCII character sets
```

## API Conventions

### Component Pattern
```typescript
// Options interface
export interface XOptions {
  // Required props
  data: T[]

  // Optional props with defaults
  width?: number
  height?: number

  // Event handlers
  onChange?: (value: T) => void
  onSelect?: (item: T) => void

  // Interaction
  isActive?: boolean
}

// State type (for interactive components)
export interface XState {
  selectedIndex: number
  // ... internal state
}

// Factory functions
export function createX(options: XOptions): XState
export function renderX(state: XState, options: XOptions): VNode
export function X(options: XOptions): VNode
```

### Naming Conventions
- Components: PascalCase (`BarChart`, `MultiSelect`)
- Hooks: camelCase with `use` prefix (`useMouse`, `useTheme`)
- Options: ComponentName + `Options` (`BarChartOptions`)
- State: ComponentName + `State` (`BarChartState`)

## Performance Considerations

1. **Lazy Rendering**: Charts only recalculate when data changes
2. **Memoization**: Cache expensive calculations (axis labels, bar widths)
3. **Batched Updates**: Use `batch()` for multiple signal updates
4. **Incremental Rendering**: Only redraw changed regions (future optimization)

## Testing Strategy

Each component needs:
1. **Render Tests**: Verify VNode structure
2. **Interaction Tests**: Keyboard/mouse handling
3. **Edge Cases**: Empty data, extreme values, boundary conditions
4. **Integration Tests**: Works with other components
5. **Visual Regression**: Screenshot comparison (manual)
