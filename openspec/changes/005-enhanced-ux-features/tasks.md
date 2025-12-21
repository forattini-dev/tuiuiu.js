# Tasks: Enhanced UX Features Implementation

## Phase 1: Command System

### 1.1 Key Binding Registry
- [x] 1.1.1 Create `KeyBinding` type with key, modifiers, action
- [x] 1.1.2 Implement `KeyBindingRegistry` class
- [x] 1.1.3 Add context-aware binding resolution (screen/widget scope)
- [x] 1.1.4 Implement binding conflict detection
- [x] 1.1.5 Add vim mode preset bindings
- [x] 1.1.6 Add emacs mode preset bindings
- [x] 1.1.7 Create `useKeyBindings` hook for components
- [x] 1.1.8 Write tests for key binding system

> Implementation: `src/core/keybindings.ts`, Tests: `tests/core/keybindings.test.ts`

### 1.2 Command Palette
- [x] 1.2.1 Create `Command` interface (id, label, action, category, keybinding)
- [x] 1.2.2 Implement `CommandRegistry` for registering commands
- [x] 1.2.3 Implement fuzzy search algorithm (score-based matching)
- [x] 1.2.4 Create `CommandPalette` component
- [x] 1.2.5 Add keyboard navigation (up/down/enter/escape)
- [x] 1.2.6 Add category grouping display
- [x] 1.2.7 Add recent commands section
- [x] 1.2.8 Add keybinding display next to commands
- [x] 1.2.9 Implement async command execution with loading state
- [x] 1.2.10 Write tests for command palette

> Implementation: `src/components/command-palette.ts`, Tests: `tests/components/command-palette.test.ts`

## Phase 2: Styling System

### 2.1 TCSS Tokenizer
- [x] 2.1.1 Define token types (selector, property, value, etc.)
- [x] 2.1.2 Implement lexer for CSS-like syntax
- [x] 2.1.3 Handle comments (/* */ and //)
- [x] 2.1.4 Handle string literals and escapes
- [x] 2.1.5 Handle numbers with units (%, px, fr)
- [x] 2.1.6 Write tokenizer tests

> Implementation: `src/styling/tokenizer.ts`, Tests: `tests/styling/tokenizer.test.ts`

### 2.2 TCSS Parser
- [x] 2.2.1 Implement recursive descent parser
- [x] 2.2.2 Parse type selectors (`Box`, `Text`)
- [x] 2.2.3 Parse class selectors (`.primary`)
- [x] 2.2.4 Parse ID selectors (`#header`)
- [x] 2.2.5 Parse pseudo-classes (`:focus`, `:hover`, `:disabled`)
- [x] 2.2.6 Parse combinator selectors (descendant, child)
- [x] 2.2.7 Parse property declarations
- [x] 2.2.8 Parse variable definitions (`$color: red`)
- [x] 2.2.9 Parse variable references (`color: $color`)
- [x] 2.2.10 Parse `@import` rules
- [x] 2.2.11 Parse `@media` queries
- [x] 2.2.12 Generate AST from tokens
- [x] 2.2.13 Write parser tests

> Implementation: `src/styling/parser.ts`, Tests: `tests/styling/parser.test.ts`

### 2.3 Style Resolution
- [x] 2.3.1 Implement selector specificity calculation
- [x] 2.3.2 Implement cascade ordering
- [x] 2.3.3 Implement property inheritance
- [x] 2.3.4 Implement variable resolution
- [x] 2.3.5 Create `StyleSheet` class for managing rules
- [x] 2.3.6 Create `applyStyles` function for VNode
- [x] 2.3.7 Write style resolution tests

> Implementation: `src/styling/resolver.ts`, Tests: `tests/styling/resolver.test.ts`

### 2.4 Style Hot Reload
- [x] 2.4.1 Implement file watching for .tcss files
- [x] 2.4.2 Add style refresh on file change
- [x] 2.4.3 Add error recovery with last valid state
- [x] 2.4.4 Add style change events
- [x] 2.4.5 Write hot reload tests

> Implementation: `src/styling/hot-reload.ts`, Tests: `tests/styling/hot-reload.test.ts`

## Phase 3: Navigation System

### 3.1 Screen Manager
- [x] 3.1.1 Create `Screen` interface (id, component, title)
- [x] 3.1.2 Implement `ScreenStack` with push/pop
- [x] 3.1.3 Add screen caching option (keep-alive)
- [x] 3.1.4 Add screen lifecycle events (enter/exit)
- [x] 3.1.5 Implement back navigation (Escape key)
- [x] 3.1.6 Add screen title bar component
- [x] 3.1.7 Write screen manager tests

> Implementation: `src/core/screen.ts`, Tests: `tests/core/screen.test.ts`

### 3.2 Screen Transitions
- [x] 3.2.1 Implement slide-left transition
- [x] 3.2.2 Implement slide-right transition
- [x] 3.2.3 Implement slide-up transition
- [x] 3.2.4 Implement slide-down transition
- [x] 3.2.5 Implement fade transition
- [x] 3.2.6 Add transition duration/easing config
- [x] 3.2.7 Integrate with spring animations from Phase 004
- [x] 3.2.8 Write transition tests

> Implementation: `src/core/transitions.ts`, Tests: `tests/core/transitions.test.ts`

### 3.3 Router
- [x] 3.3.1 Create route definition syntax
- [x] 3.3.2 Implement route parameter extraction (`:id`)
- [x] 3.3.3 Implement nested routes
- [x] 3.3.4 Add navigation guards (beforeEnter)
- [x] 3.3.5 Add history stack with forward/back
- [x] 3.3.6 Create `useRoute` hook
- [x] 3.3.7 Create `useNavigate` hook
- [x] 3.3.8 Write router tests

> Implementation: `src/core/router.ts`, Tests: `tests/core/router.test.ts`

## Phase 4: Advanced Components

### 4.1 Canvas Widget
- [x] 4.1.1 Create `Canvas` component with width/height
- [x] 4.1.2 Implement line drawing (x1,y1 to x2,y2)
- [x] 4.1.3 Implement rectangle drawing (filled/stroke)
- [x] 4.1.4 Implement circle drawing (filled/stroke)
- [x] 4.1.5 Implement ellipse drawing
- [x] 4.1.6 Implement arc drawing
- [x] 4.1.7 Implement polygon drawing
- [x] 4.1.8 Implement bezier curve drawing
- [x] 4.1.9 Implement text at position
- [x] 4.1.10 Add braille mode for higher resolution
- [x] 4.1.11 Add block character mode
- [x] 4.1.12 Write canvas tests

> Implementation: `src/components/canvas.ts`, Tests: `tests/components/canvas.test.ts`

### 4.2 Grid Layout
- [x] 4.2.1 Parse `grid-template-columns` (fr, px, %)
- [x] 4.2.2 Parse `grid-template-rows`
- [x] 4.2.3 Implement `fr` (fraction) unit calculation
- [x] 4.2.4 Implement `gap` and `row-gap`/`column-gap`
- [x] 4.2.5 Implement `grid-column`/`grid-row` for items
- [x] 4.2.6 Implement named grid areas
- [x] 4.2.7 Implement auto-placement algorithm
- [x] 4.2.8 Implement `justify-items`/`align-items`
- [x] 4.2.9 Implement `justify-content`/`align-content`
- [x] 4.2.10 Create `Grid` component
- [x] 4.2.11 Write grid layout tests

> Implementation: `src/core/grid-layout.ts`, `src/components/grid.ts`, Tests: `tests/core/grid-layout.test.ts`

### 4.3 Syntax Highlighter
- [x] 4.3.1 Create token types for syntax elements
- [x] 4.3.2 Implement JavaScript/TypeScript tokenizer
- [x] 4.3.3 Implement Python tokenizer
- [x] 4.3.4 Implement JSON tokenizer
- [x] 4.3.5 Implement YAML tokenizer
- [x] 4.3.6 Implement Go tokenizer
- [x] 4.3.7 Implement Rust tokenizer
- [x] 4.3.8 Create syntax highlighting themes
- [x] 4.3.9 Create `SyntaxHighlight` component
- [x] 4.3.10 Add line numbers option
- [x] 4.3.11 Add line highlighting (mark ranges)
- [x] 4.3.12 Add language auto-detection
- [x] 4.3.13 Write syntax highlighter tests

> Implementation: `src/components/syntax-highlight.ts`, Tests: `tests/components/syntax-highlight.test.ts`

## Phase 5: Visual Enhancements

### 5.1 Extended Box Styles
- [x] 5.1.1 Add `heavy` border style
- [x] 5.1.2 Add `heavyHead` border style
- [x] 5.1.3 Add `heavyEdge` border style
- [x] 5.1.4 Add `double` border style
- [x] 5.1.5 Add `doubleHead` border style
- [x] 5.1.6 Add `minimal` border style
- [x] 5.1.7 Add `minimalHeavy` border style
- [x] 5.1.8 Add `minimalDouble` border style
- [x] 5.1.9 Add `simple` border style
- [x] 5.1.10 Add `simpleHead` border style
- [x] 5.1.11 Add `horizontals` border style
- [x] 5.1.12 Add `markdown` border style
- [x] 5.1.13 Add `ascii` border style
- [x] 5.1.14 Add `asciiDouble` border style
- [x] 5.1.15 Update border rendering to support new styles
- [x] 5.1.16 Write border style tests

> Implementation: `src/utils/borders.ts`, Tests: `tests/utils/borders.test.ts`

### 5.2 Extended Spinners
- [x] 5.2.1 Add classic spinners (dots, line, arc, pulse)
- [x] 5.2.2 Add braille spinners (8 variants)
- [x] 5.2.3 Add block spinners (squares, aesthetic)
- [x] 5.2.4 Add arrow spinners (arrows, bouncingBar)
- [x] 5.2.5 Add character spinners (clock, moon, earth, hearts)
- [x] 5.2.6 Add progress spinners (bouncingBall, layer, betaWave)
- [x] 5.2.7 Add weather spinners (weather, christmas)
- [x] 5.2.8 Add emoji spinners (monkey, fist, pong)
- [x] 5.2.9 Create spinner registry with 50+ options
- [x] 5.2.10 Write spinner tests

> Implementation: `src/components/spinners.ts`, Tests: `tests/components/spinners.test.ts`

### 5.3 BigText/FIGlet
- [x] 5.3.1 Create `BigText` component
- [x] 5.3.2 Implement block font (simple 3x5)
- [x] 5.3.3 Implement banner font
- [x] 5.3.4 Implement slant font
- [x] 5.3.5 Implement mini font (2x4)
- [x] 5.3.6 Add auto-width fitting
- [x] 5.3.7 Add color gradient support
- [x] 5.3.8 Add character-by-character reveal animation
- [x] 5.3.9 Write BigText tests

> Implementation: `src/components/bigtext.ts`, Tests: `tests/components/bigtext.test.ts`

## Phase 6: Developer Utilities

### 6.1 Query API
- [x] 6.1.1 Parse CSS selector syntax
- [x] 6.1.2 Implement type selector matching
- [x] 6.1.3 Implement class selector matching
- [x] 6.1.4 Implement ID selector matching
- [x] 6.1.5 Implement pseudo-class matching (`:focus`, `:first-child`)
- [x] 6.1.6 Implement combinator matching (descendant, child)
- [x] 6.1.7 Create `query(selector)` function returning first match
- [x] 6.1.8 Create `queryAll(selector)` function returning all matches
- [x] 6.1.9 Add reactive query option (live results)
- [x] 6.1.10 Add debug mode (highlight matches)
- [x] 6.1.11 Write query API tests

> Implementation: `src/core/query.ts`, Tests: `tests/core/query.test.ts`

### 6.2 File Manager Widget
- [x] 6.2.1 Create `FileManager` component
- [x] 6.2.2 Implement directory listing
- [x] 6.2.3 Implement directory navigation (enter/backspace)
- [x] 6.2.4 Add file/directory icons
- [x] 6.2.5 Add file size display
- [x] 6.2.6 Add modified date display
- [x] 6.2.7 Implement single file selection
- [x] 6.2.8 Implement multi-file selection (shift/ctrl+click)
- [x] 6.2.9 Add preview pane for text files
- [x] 6.2.10 Add vim-like navigation (j/k/gg/G)
- [x] 6.2.11 Add filtering (glob patterns)
- [x] 6.2.12 Add sorting (name/size/date)
- [x] 6.2.13 Write file manager tests

> Implementation: `src/components/file-manager.ts`, Tests: `tests/components/file-manager.test.ts`

## Completion Criteria

- [x] All Phase 1 tasks completed (Command System)
- [x] All Phase 2 tasks completed (Styling System)
- [x] All Phase 3 tasks completed (Navigation System)
- [x] All Phase 4 tasks completed (Advanced Components)
- [x] All Phase 5 tasks completed (Visual Enhancements)
- [x] All Phase 6 tasks completed (Developer Utilities)
- [x] 80%+ test coverage maintained
- [x] All examples updated with new features
- [x] Zero external dependencies
- [x] Performance benchmarks pass (16ms render budget)
