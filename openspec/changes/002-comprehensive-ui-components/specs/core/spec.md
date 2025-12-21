# Spec: Core Infrastructure

## ADDED Requirements

### REQ-CORE-001: Mouse Event Handling
The system MUST provide a `useMouse` hook for handling mouse events in interactive components.

#### Scenario: Basic mouse click detection
- GIVEN a component using `useMouse` hook
- WHEN the user clicks within the component bounds
- THEN the handler receives a MouseEvent with correct coordinates and button

#### Scenario: Mouse drag detection
- GIVEN a component using `useMouse` with drag tracking
- WHEN the user clicks and drags
- THEN the handler receives 'drag' events with updated coordinates

#### Scenario: Scroll wheel detection
- GIVEN a component using `useMouse`
- WHEN the user scrolls the mouse wheel
- THEN the handler receives 'scroll-up' or 'scroll-down' events

---

### REQ-CORE-002: Theming System
The system MUST provide a theming system with `ThemeProvider` and `useTheme` hooks.

#### Scenario: Apply dark theme
- GIVEN an application wrapped in ThemeProvider with darkTheme
- WHEN components call useTheme()
- THEN they receive the dark theme colors and settings

#### Scenario: Nested theme override
- GIVEN a light-themed app with a dark-themed modal
- WHEN the modal renders
- THEN components inside the modal use dark theme colors

#### Scenario: Access theme colors
- GIVEN a component using useTheme()
- WHEN it renders text
- THEN it can apply theme.colors.primary, theme.colors.text, etc.

---

### REQ-CORE-003: Animation System
The system MUST provide animation primitives for smooth transitions.

#### Scenario: Basic animation
- GIVEN a component using useAnimation
- WHEN animation.start() is called
- THEN onFrame is called with progress values from 0 to 1

#### Scenario: Easing functions
- GIVEN an animation with easing: 'ease-out'
- WHEN the animation runs
- THEN progress values follow the ease-out curve

#### Scenario: Transition component
- GIVEN a Transition wrapper with show=true
- WHEN show changes to false
- THEN the exit animation plays before content is removed

---

### REQ-CORE-004: ASCII Fallback Mode
The system MUST support ASCII-only rendering for limited terminals.

#### Scenario: Auto-detect unicode support
- GIVEN a terminal without unicode support
- WHEN detectTerminalCapabilities() is called
- THEN it returns { unicode: false }

#### Scenario: Manual ASCII mode
- GIVEN setRenderMode('ascii') has been called
- WHEN components render
- THEN they use ASCII character sets instead of Unicode

#### Scenario: Character set switching
- GIVEN a Sparkline component
- WHEN rendered in ASCII mode
- THEN it uses '_.-:=*#@' instead of '▁▂▃▄▅▆▇█'

---

## API Specifications

### MouseEvent Interface
```typescript
interface MouseEvent {
  x: number              // Column (0-indexed)
  y: number              // Row (0-indexed)
  button: 'left' | 'right' | 'middle' | 'scroll-up' | 'scroll-down'
  action: 'click' | 'double-click' | 'drag' | 'release' | 'move'
  modifiers: {
    ctrl: boolean
    shift: boolean
    alt: boolean
  }
}
```

### Theme Interface
```typescript
interface Theme {
  name: string
  colors: {
    primary: string
    secondary: string
    background: string
    surface: string
    text: string
    textMuted: string
    border: string
    success: string
    warning: string
    error: string
    info: string
  }
  spacing: {
    xs: number  // 1
    sm: number  // 2
    md: number  // 4
    lg: number  // 8
    xl: number  // 16
  }
  borderRadius: 'none' | 'sm' | 'md' | 'lg'
}
```

### Animation Options
```typescript
interface AnimationOptions {
  duration: number  // milliseconds
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'
  onFrame: (progress: number) => void
}
```

### Terminal Capabilities
```typescript
interface TerminalCapabilities {
  unicode: boolean
  colors: 16 | 256 | 'truecolor'
  mouse: boolean
}
```

---

## Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/core/mouse.ts` | CREATE | Mouse event parsing and useMouse hook |
| `src/core/theme.ts` | CREATE | Theme context, provider, and useTheme hook |
| `src/core/animation.ts` | CREATE | Animation primitives and Transition component |
| `src/core/capabilities.ts` | CREATE | Terminal detection and render mode |
| `src/utils/chars.ts` | CREATE | Unicode and ASCII character sets |
| `src/core/index.ts` | MODIFY | Export new core modules |
| `src/index.ts` | MODIFY | Export new APIs |
