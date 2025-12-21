# Design: Advanced TUI Patterns Architecture

## Context

Tuiuiu aims to be a zero-dependency, production-grade TUI library. This design documents architectural decisions for implementing advanced patterns learned from 11 industry libraries.

### Constraints
- **Zero Dependencies**: All implementations must be in-house
- **TypeScript Only**: No native bindings or WASM
- **Node.js Target**: v18+ with ESM modules
- **Terminal Agnostic**: Must work in any ANSI-capable terminal

### Stakeholders
- Library users building CLI applications
- Tetis internal tools team
- Open source contributors

## Goals / Non-Goals

### Goals
- Implement delta rendering for 50%+ performance improvement
- Support physics-based animations at 60fps
- Enable image display in modern terminals
- Provide constraint-based layout as alternative to flexbox
- Create robust focus management for complex UIs

### Non-Goals
- Full Cassowary solver (use simplified constraint system)
- Native GPU acceleration
- Full terminal emulation (for embedded terminal widget)
- Support for terminals without ANSI support

## Decisions

### D1: Rendering Architecture

**Decision**: Implement a three-layer rendering architecture:
1. **VNode Layer**: Component definitions (current)
2. **Layout Layer**: Position/size calculations (current)
3. **Cell Buffer Layer**: Character grid with damage tracking (NEW)

**Rationale**:
- Zaz uses cell buffers for efficient delta rendering
- Ratatui's buffer abstraction enables double buffering
- Damage tracking reduces ANSI output by 90%+

**Implementation**:
```typescript
interface Cell {
  char: string;
  fg: Color;
  bg: Color;
  attrs: CellAttrs; // bold, italic, underline, etc.
}

interface Buffer {
  cells: Cell[][];
  width: number;
  height: number;
  diff(other: Buffer): Patch[];
}
```

**Alternatives Considered**:
- Direct ANSI string diffing: Slower, harder to implement
- Virtual DOM like React: Overkill for terminal rendering

---

### D2: Event System Design

**Decision**: Implement DOM-like event bubbling with phase control:
- Capture phase (top-down)
- Target phase
- Bubble phase (bottom-up)
- Support `stopPropagation()` and `preventDefault()`

**Rationale**:
- Blessed's event system is highly successful (25k+ stars)
- Familiar pattern for web developers
- Enables event delegation for large lists

**Implementation**:
```typescript
interface TuiEvent<T = unknown> {
  type: string;
  target: VNode;
  currentTarget: VNode;
  data: T;
  phase: 'capture' | 'target' | 'bubble';
  stopped: boolean;
  defaultPrevented: boolean;
  stopPropagation(): void;
  preventDefault(): void;
}
```

**Alternatives Considered**:
- Textual's message passing: More complex, better for async
- Simple callbacks: Doesn't support delegation

---

### D3: Animation System

**Decision**: Use spring physics as the primary animation primitive, with easing functions as fallback.

**Rationale**:
- Kyma's Harmonica library produces natural motion
- Springs are interruptible without jarring transitions
- Web frameworks (Framer Motion, React Spring) validate this approach

**Implementation**:
```typescript
interface SpringConfig {
  mass: number;      // 1.0 default
  stiffness: number; // 100 default
  damping: number;   // 10 default
  velocity: number;  // Initial velocity
}

function createSpring(config: SpringConfig): AnimatedValue {
  // Damped harmonic oscillator: F = -kx - cv
  // Uses RK4 integration for accuracy
}
```

**Physics Formula**:
```
acceleration = (-stiffness * displacement - damping * velocity) / mass
```

**Alternatives Considered**:
- CSS-like keyframes: Less natural motion
- Bezier curves only: No spring physics feel

---

### D4: Graphics Protocol Support

**Decision**: Implement three image protocols with auto-detection:
1. Kitty Graphics Protocol (preferred)
2. iTerm2 Inline Images
3. Sixel (legacy)
4. Braille fallback (universal)

**Rationale**:
- Zaz demonstrates multi-protocol support is essential
- Kitty protocol is most efficient (direct pixel transfer)
- Sixel has widest legacy support
- Braille works everywhere

**Detection Strategy**:
```typescript
async function detectImageProtocol(): Promise<Protocol> {
  // 1. Check $TERM_PROGRAM for known terminals
  // 2. Query terminal with escape sequences
  // 3. Fall back to braille
}
```

**Alternatives Considered**:
- Single protocol: Poor compatibility
- No images: Missing important capability

---

### D5: Focus Management

**Decision**: Implement focus zones with a focus stack:
- `FocusZone` component creates isolated focus context
- `FocusTrap` prevents focus from leaving
- Focus stack enables modal patterns

**Rationale**:
- TUI-Go's focus chain is proven in production
- Textual's focus zones enable complex UIs
- React's focus trap pattern is well-understood

**Implementation**:
```typescript
const focusStack: FocusZone[] = [];

function pushFocusZone(zone: FocusZone) {
  focusStack.push(zone);
  zone.focusFirst();
}

function popFocusZone() {
  const zone = focusStack.pop();
  if (focusStack.length > 0) {
    focusStack[focusStack.length - 1].restoreFocus();
  }
}
```

**Alternatives Considered**:
- Global focus only: Can't do modals properly
- Per-component focus: Too fragmented

---

### D6: Constraint Layout

**Decision**: Implement a simplified constraint system (not full Cassowary):
- Support `==`, `<=`, `>=` constraints
- Three priority levels: Required, Strong, Weak
- Optimize for common cases (equal width, percentage)

**Rationale**:
- Full Cassowary is complex (~2000 lines)
- Most UIs need simple constraints
- Can upgrade to full solver if needed

**Implementation**:
```typescript
interface Constraint {
  left: Expression;
  op: '==' | '<=' | '>=';
  right: Expression;
  priority: 'required' | 'strong' | 'weak';
}

// Example: Two columns, equal width
constraints: [
  { left: col1.width, op: '==', right: col2.width, priority: 'required' },
  { left: col1.width + col2.width, op: '==', right: parent.width, priority: 'required' }
]
```

**Alternatives Considered**:
- Full Cassowary: Too complex for v1
- CSS Grid emulation: Different use case

---

### D7: Virtual Scrolling

**Decision**: Implement windowed rendering with overscan:
- Render visible items + 3 above/below (overscan)
- Maintain item height cache for variable heights
- Support scroll-to-item API

**Rationale**:
- Essential for lists with 1000+ items
- React Virtual and similar libraries prove this approach
- Overscan prevents flicker during fast scrolling

**Implementation**:
```typescript
interface VirtualScrollState {
  scrollOffset: number;
  itemHeights: Map<number, number>;
  visibleRange: { start: number; end: number };
  overscan: number;
}

function getVisibleItems(state: VirtualScrollState, items: any[]) {
  const { start, end } = state.visibleRange;
  return items.slice(
    Math.max(0, start - state.overscan),
    Math.min(items.length, end + state.overscan)
  );
}
```

**Alternatives Considered**:
- Full DOM-like recycling: Overkill for terminals
- No virtualization: Memory/performance issues

## Risks / Trade-offs

### R1: Complexity Budget
- **Risk**: Advanced features increase codebase complexity
- **Mitigation**: Clear module boundaries, extensive documentation
- **Trade-off**: Accept increased LOC for capabilities

### R2: Terminal Compatibility
- **Risk**: Advanced features fail in basic terminals
- **Mitigation**: Feature detection + graceful degradation
- **Trade-off**: Some features will be unavailable

### R3: Performance Overhead
- **Risk**: Abstraction layers add overhead
- **Mitigation**: Benchmark continuously, profile hot paths
- **Trade-off**: Slightly slower baseline for much faster updates

### R4: API Surface
- **Risk**: Large API increases learning curve
- **Mitigation**: Progressive disclosure, good defaults
- **Trade-off**: More to learn but more capability

## Migration Plan

### Phase 1: Non-Breaking Additions
- Add Cell Buffer alongside current renderer
- Add event system as opt-in
- Add animation utilities

### Phase 2: Gradual Migration
- Update built-in components to use buffers
- Add focus zone support
- Add virtual scrolling

### Phase 3: Breaking Changes (v2.0)
- Replace renderer internals
- Require focus zones for interactive components
- Deprecate old APIs

### Rollback
- Feature flags for each major feature
- Compatibility shims for old patterns
- Version pinning support

## Open Questions

1. **Q**: Should constraint layout replace or complement flexbox?
   **A**: Complement - flexbox for most cases, constraints for complex

2. **Q**: How to handle terminals that lie about capabilities?
   **A**: Allow manual override via `TUIUIU_TERMINAL` env var

3. **Q**: Should animations be frame-limited?
   **A**: Yes, default to 60fps with configurable limit

4. **Q**: How to test image protocol output?
   **A**: Snapshot testing with known terminal responses

## File Structure

```
src/
├── core/
│   ├── buffer.ts          # Cell buffer implementation
│   ├── damage.ts          # Damage tracking
│   └── capabilities.ts    # Terminal detection (extended)
│
├── events/
│   ├── emitter.ts         # Event emitter
│   ├── bubbling.ts        # Event propagation
│   └── types.ts           # Event type definitions
│
├── animation/
│   ├── spring.ts          # Spring physics
│   ├── easing.ts          # Easing functions
│   ├── sequence.ts        # Animation chaining
│   └── hooks.ts           # useSpring, useTransition
│
├── graphics/
│   ├── protocols.ts       # Protocol detection
│   ├── kitty.ts           # Kitty protocol
│   ├── iterm2.ts          # iTerm2 protocol
│   ├── sixel.ts           # Sixel encoder
│   └── braille.ts         # Braille fallback
│
├── layout/
│   ├── constraints.ts     # Constraint solver
│   └── virtual-scroll.ts  # Virtual scrolling
│
└── focus/
    ├── zone.ts            # Focus zone
    ├── trap.ts            # Focus trap
    └── manager.ts         # Global focus management
```
