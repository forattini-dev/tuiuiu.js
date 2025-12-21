# Change: Enhanced UX Features from Extended Library Analysis

## Change ID
`005-enhanced-ux-features`

## Summary

Implement enhanced UX features discovered from deep analysis of mature TUI libraries (Textual, Rich, Ratatui, Blessed, Kyma). This proposal focuses on patterns that significantly improve developer and end-user experience: Command Palette, TCSS styling, Screen navigation, Canvas drawing, Grid layout, and enhanced visual components.

## Motivation

### Problem Statement

After completing OpenSpec 004 (core infrastructure, animation, graphics, layout), tuiuiu now has solid technical foundations. However, it lacks high-level UX patterns that make applications feel polished and professional:

1. **No Command Palette**: Users can't quickly discover and execute actions (Textual pattern)
2. **No External Styling**: Styles are inline only; no CSS-like separation of concerns
3. **No Screen Navigation**: No built-in screen stack for multi-view applications
4. **No Canvas Drawing**: Can't draw arbitrary shapes, lines, or custom graphics
5. **No Grid Layout**: Only Flexbox; missing CSS Grid-like capabilities
6. **Limited Visual Variety**: Only a few box styles and spinners
7. **No Syntax Highlighting**: Code blocks lack language-aware coloring

### Research Conducted

Deep analysis of 5 TUI libraries identified these high-impact features:

| Feature | Source Library | Impact |
|---------|---------------|--------|
| **Command Palette** | Textual | High - Universal action discovery |
| **TCSS Parser** | Textual | High - External styling, theming |
| **Screen Stack** | Textual | High - Multi-view navigation |
| **Canvas Widget** | Ratatui | Medium - Custom graphics |
| **Grid Layout** | CSS Grid spec | Medium - 2D layout capabilities |
| **Box Styles (19+)** | Rich | Medium - Visual variety |
| **Spinner Animations (50+)** | Rich | Low - Polish factor |
| **BigText/FIGlet** | Rich | Low - ASCII art banners |
| **Query API** | Textual | Medium - CSS selector queries |
| **File Manager** | Blessed | Medium - Common use case |

## Proposed Solution

### Phase 1: Command System (High Priority)

#### 1.1 Command Palette
- **Fuzzy Search**: Fast incremental search across all commands
- **Keybinding Display**: Show shortcuts alongside commands
- **Command Categories**: Group by feature/context
- **Recent Commands**: Quick access to frequently used
- **Async Actions**: Support for long-running commands

#### 1.2 Key Binding System
- **Binding Registry**: Centralized key→action mapping
- **Context-Aware**: Different bindings per screen/widget
- **Conflict Detection**: Warn about duplicate bindings
- **Custom Bindings**: User-overridable defaults
- **Vim/Emacs Modes**: Preset binding profiles

### Phase 2: Styling System (High Priority)

#### 2.1 TCSS Parser
- **CSS-Like Syntax**: Familiar property names and values
- **Selectors**: Type, class, ID, pseudo-classes (`:focus`, `:hover`)
- **Inheritance**: Properties cascade from parent
- **Variables**: `$primary-color` or `--primary-color` syntax
- **Media Queries**: `@media (min-width: 80)`

#### 2.2 Style Hot Reload
- **File Watching**: Auto-reload on `.tcss` file changes
- **Live Preview**: Instant style updates without restart
- **Error Recovery**: Graceful handling of invalid CSS
- **DevTools Integration**: Style inspector overlay

### Phase 3: Navigation System (High Priority)

#### 3.1 Screen Stack
- **Push/Pop Navigation**: Standard navigation pattern
- **Screen Transitions**: Slide, fade, none
- **Back Navigation**: Escape key handling
- **Deep Linking**: Navigate to screen by path
- **Screen Caching**: Keep screens alive in background

#### 3.2 Router Integration
- **Route Definitions**: Path-to-screen mapping
- **Route Parameters**: `/users/:id` extraction
- **Nested Routes**: Child screen composition
- **Guards**: Pre-navigation checks
- **History**: Forward/back navigation

### Phase 4: Advanced Components (Medium Priority)

#### 4.1 Canvas Widget
- **Primitives**: Line, rect, circle, ellipse, arc
- **Fill/Stroke**: Solid colors, patterns
- **Path Drawing**: Bezier curves, polygons
- **Text Rendering**: Positioned text on canvas
- **Braille Mode**: 2x4 dot high-resolution

#### 4.2 Grid Layout
- **Template Syntax**: `grid-template-columns: 1fr 2fr 1fr`
- **Gap Control**: Row and column gaps
- **Named Areas**: `grid-area: header`
- **Auto-Placement**: Flow algorithm
- **Alignment**: `justify-items`, `align-items`

#### 4.3 Syntax Highlighter
- **Language Detection**: Auto-detect from content/extension
- **Theme Support**: Multiple color schemes
- **Line Numbers**: Optional line numbering
- **Highlight Ranges**: Mark specific lines
- **Languages**: JS, TS, Python, Rust, Go, JSON, YAML, etc.

### Phase 5: Visual Enhancements (Medium Priority)

#### 5.1 Extended Box Styles
Add 15+ new border styles:
- `heavy`, `heavyHead`, `heavyEdge`
- `double`, `doubleHead`, `doubleEdge`
- `minimal`, `minimalHeavy`, `minimalDouble`
- `simple`, `simpleHead`, `simpleHeavy`
- `horizontals`, `markdown`, `ascii`, `asciiDouble`

#### 5.2 Extended Spinners
Add 40+ spinner animations:
- **Classic**: dots, line, arc, pulse
- **Braille**: braille patterns (8 variants)
- **Blocks**: squares, aesthetic
- **Arrows**: arrows, bouncingBar
- **Characters**: clock, moon, earth, hearts
- **Progress**: bouncingBall, layer, betaWave

#### 5.3 BigText/FIGlet
- **ASCII Fonts**: 5+ built-in fonts
- **Auto-Sizing**: Fit to container width
- **Color Gradient**: Multi-color characters
- **Animation**: Character-by-character reveal

### Phase 6: Developer Utilities (Medium Priority)

#### 6.1 Query API
- **CSS Selectors**: `query('Button.primary')`
- **Find All**: `queryAll(':focus')` returns array
- **Live Queries**: Reactive query results
- **Debugging**: Highlight matched elements

#### 6.2 File Manager Widget
- **Directory Browsing**: Navigate filesystem
- **File Selection**: Single/multi-select modes
- **Preview Pane**: File content preview
- **Keyboard Navigation**: vim-like bindings
- **Filtering**: Glob/regex file filters

## Impact Analysis

### Benefits
1. **Discoverability**: Command Palette helps users find features
2. **Maintainability**: External TCSS separates styling from logic
3. **Navigation**: Screen stack enables complex multi-view apps
4. **Flexibility**: Canvas widget enables custom visualizations
5. **Polish**: More box styles and spinners improve visual appeal
6. **Developer Experience**: Query API speeds debugging

### Risks
1. **TCSS Complexity**: Parser implementation is non-trivial
2. **Performance**: CSS selector matching could be slow
3. **API Surface**: More components = more to maintain
4. **Scope Creep**: Features might expand beyond initial plan

### Mitigation
- Start with subset of CSS features, expand later
- Use efficient selector matching (specificity-based)
- Prioritize phases based on user demand
- Strict scope boundaries in each phase

## Success Metrics

- [ ] Command Palette fuzzy search responds in <16ms
- [ ] TCSS parser handles 95% of common CSS patterns
- [ ] Screen transitions run at 60fps
- [ ] Canvas renders at 100+ shapes without lag
- [ ] Grid layout matches CSS Grid spec for common cases
- [ ] All 19+ box styles render correctly
- [ ] All 50+ spinners animate smoothly
- [ ] Query API matches in <1ms for typical component trees
- [ ] Zero external dependencies maintained

## Dependencies

- OpenSpec 004 (animation, graphics, input) MUST be complete
- Event system with bubbling/capturing from 004
- Focus management from 004
- Overlay system from 004

## Non-Goals

- Full CSS spec compliance (only TUI-relevant subset)
- RTL/BiDi text support (future proposal)
- Accessibility ARIA labels (future proposal)
- Plugin system for custom components (future proposal)
