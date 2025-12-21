# Project Context

## Purpose
Tuiuiu is a zero-dependency Terminal UI library for building rich CLI applications. It provides React-like components and hooks for creating interactive terminal interfaces without any external dependencies.

## Tech Stack
- TypeScript (ES2022, NodeNext modules)
- Node.js (v18+)
- Vitest for testing
- No external runtime dependencies (zero-deps philosophy)

## Project Conventions

### Code Style
- Factory functions for components (no JSX)
- Dual API pattern: `createX()` for state + `renderX()` for display
- Signal-based reactivity (auto-tracking dependencies)
- All colors support: named (16), hex (#fff), rgb(r,g,b), ansi256(n)

### Architecture Patterns
- **Layer 0 (Primitives)**: Signal, Effect, reactive utilities
- **Layer 1 (Design System)**: UI components organized by category
- **Layer 2 (Application)**: Pages, layouts, routing, focus management
- Components are pure functions returning VNode trees
- VNode → Layout calculation → ANSI string → Terminal output

### Testing Strategy
- 100% keyboard interaction coverage for all interactive components
- Unit tests for each component and utility
- Integration tests for focus management and input handling
- Vitest with v8 coverage provider

### Git Workflow
- Conventional commits
- OpenSpec for feature proposals
- Main branch for releases

## Domain Context
- Terminal rendering uses ANSI escape sequences
- Layout engine is Yoga-inspired flexbox
- Input parsing handles multiple terminal types (xterm, gnome, rxvt, putty, cygwin)
- Focus management is global with Tab navigation

## Important Constraints
- **Zero external dependencies** - Everything must be implemented in-house
- No JSX transpilation - Pure TypeScript function calls
- Must work in any terminal that supports ANSI codes
- Performance critical - Terminal rendering must be fast

## External Dependencies
- None (zero-deps philosophy)
- Dev dependencies: TypeScript, Vitest, tsx
