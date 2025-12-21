# Design: Enhanced UX Features

## Context

This design document covers technical decisions for implementing enhanced UX features in tuiuiu. These features build upon the foundation established in OpenSpec 004 (buffer system, event system, animation, graphics, focus, input, overlays).

### Stakeholders
- **Library Users**: Want simple, intuitive APIs for complex features
- **Application Developers**: Need extensibility and customization
- **Maintainers**: Require clean, testable code without external deps

## Goals / Non-Goals

### Goals
- Provide polished UX patterns (command palette, navigation, styling)
- Enable visual customization through external styling
- Support complex multi-screen applications
- Maintain zero-dependency constraint
- Preserve 60fps performance target

### Non-Goals
- Full CSS spec compliance (only TUI-relevant subset)
- Browser DOM compatibility
- Plugin/extension architecture (future work)
- Hot module replacement (just hot style reload)

## Decisions

### Decision 1: TCSS Parser Architecture

**What**: Implement a hand-written recursive descent parser for TCSS.

**Why**:
- Zero-dependency constraint rules out parser generators
- Recursive descent is simple to implement and debug
- CSS grammar is well-understood and relatively simple
- Error recovery is easier with hand-written parsers

**Alternatives considered**:
- PEG parser generator → Rejected (adds dependency)
- Pratt parser → Overkill for CSS, better for expressions
- Regex-based → Too fragile for nested structures

**Implementation notes**:
```typescript
// TCSS grammar (simplified)
stylesheet  ::= rule*
rule        ::= selector '{' declaration* '}'
selector    ::= simple_selector (combinator simple_selector)*
declaration ::= property ':' value ';'

// Parser structure
class TCSSParser {
  private tokenizer: Tokenizer;

  parseStylesheet(): Stylesheet { ... }
  parseRule(): Rule { ... }
  parseSelector(): Selector { ... }
  parseDeclaration(): Declaration { ... }
}
```

### Decision 2: Command Palette Fuzzy Search

**What**: Use a score-based fuzzy matching algorithm inspired by fzf.

**Why**:
- Users expect fuzzy matching in command palettes
- fzf-style matching is intuitive and fast
- Scoring enables relevant result ordering

**Algorithm**:
```typescript
function fuzzyMatch(pattern: string, text: string): number | null {
  // 1. Check if pattern matches (all chars in order)
  // 2. Calculate score based on:
  //    - Consecutive matches (bonus)
  //    - Match at word boundary (bonus)
  //    - Match after separator (bonus)
  //    - Distance penalty
  // 3. Return null if no match, score if match
}
```

**Performance target**: <1ms for 1000 commands

### Decision 3: Screen Stack vs Router

**What**: Implement both Screen Stack (simple) and Router (advanced) as separate modules.

**Why**:
- Simple apps need just push/pop (modal-like)
- Complex apps need URL-style navigation with params
- Different mental models for different use cases

**Screen Stack API**:
```typescript
const stack = createScreenStack();
stack.push(SettingsScreen);
stack.pop();
stack.replace(HomeScreen);
```

**Router API**:
```typescript
const router = createRouter({
  routes: [
    { path: '/', component: Home },
    { path: '/users/:id', component: UserDetail },
    { path: '/settings/*', component: Settings },
  ]
});
router.navigate('/users/123');
const { id } = useParams();
```

### Decision 4: Canvas Rendering Strategy

**What**: Canvas uses a character buffer with optional braille mode.

**Why**:
- Terminal is character-based, not pixel-based
- Braille provides 2x4 resolution per cell (8 dots)
- Block characters provide 2x2 resolution (quadrants)

**Resolution modes**:
| Mode | Resolution per Cell | Characters |
|------|---------------------|------------|
| Normal | 1x1 | Full blocks, half blocks |
| Blocks | 2x2 | Quadrant characters ▖▗▘▝▀▄▌▐█ |
| Braille | 2x4 | Braille patterns ⠀-⣿ (256 chars) |

**Drawing approach**:
```typescript
class Canvas {
  private buffer: CanvasBuffer; // 2D array of points

  // Draw to virtual high-res buffer
  line(x1, y1, x2, y2, color) { ... }
  circle(cx, cy, r, color) { ... }

  // Render buffer to terminal characters
  render(): string {
    // Quantize buffer to character grid
    // Choose characters based on sub-cell patterns
  }
}
```

### Decision 5: Grid Layout Algorithm

**What**: Implement CSS Grid layout algorithm with fractional units.

**Why**:
- Flexbox only handles 1D layout
- Grid enables 2D positioning without nesting
- `fr` units allow proportional sizing

**Algorithm (simplified)**:
```
1. Resolve fixed-size tracks (px, %)
2. Calculate remaining space
3. Distribute remaining space by fr ratios
4. Place items by grid-column/grid-row or auto-placement
5. Apply alignment within cells
```

**Supported features**:
- `grid-template-columns: 1fr 2fr auto 100px`
- `grid-template-rows: repeat(3, 1fr)`
- `gap: 1` / `row-gap: 1` / `column-gap: 2`
- `grid-column: 1 / 3` / `grid-row: 2`
- `grid-area: header`
- `justify-items: start | center | end | stretch`
- `align-items: start | center | end | stretch`

### Decision 6: Syntax Highlighter Architecture

**What**: Language-specific tokenizers with theme-based coloring.

**Why**:
- Each language has unique grammar
- Themes should be swappable
- Tokenizers can be lazy-loaded

**Structure**:
```typescript
// Token types (shared)
type TokenType =
  | 'keyword' | 'string' | 'number' | 'comment'
  | 'function' | 'variable' | 'type' | 'operator'
  | 'punctuation' | 'property' | 'constant';

// Language tokenizer interface
interface LanguageTokenizer {
  tokenize(code: string): Token[];
}

// Theme interface
interface SyntaxTheme {
  keyword: string;    // color
  string: string;
  number: string;
  // ...
}

// Built-in themes
const themes = {
  'monokai': { ... },
  'github-dark': { ... },
  'one-dark': { ... },
};
```

### Decision 7: Extended Spinners Registry

**What**: Centralized registry of spinner animations with lazy evaluation.

**Why**:
- 50+ spinners shouldn't all be in memory
- Easy to add custom spinners
- Common interface for all spinners

**Registry design**:
```typescript
type SpinnerFrame = string[];
type SpinnerDef = {
  frames: SpinnerFrame;
  interval: number; // ms per frame
};

const spinners: Record<string, SpinnerDef> = {
  dots: {
    frames: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    interval: 80,
  },
  line: {
    frames: ['-', '\\', '|', '/'],
    interval: 130,
  },
  // ...50+ more
};

// Usage
<Spinner name="dots" />
<Spinner frames={['🌑','🌒','🌓','🌔','🌕']} interval={100} />
```

## Risks / Trade-offs

### Risk 1: TCSS Parser Complexity
**Risk**: Parser bugs could cause subtle styling issues.
**Mitigation**:
- Extensive test suite with edge cases
- Error recovery that doesn't crash
- Validation mode for CI

### Risk 2: Performance with Complex Selectors
**Risk**: CSS selector matching is O(n) per element.
**Mitigation**:
- Cache compiled selectors
- Limit selector depth (no `*` wildcard)
- Lazy evaluation of pseudo-classes

### Risk 3: Grid Layout Edge Cases
**Risk**: CSS Grid spec has many edge cases.
**Mitigation**:
- Start with common patterns only
- Document unsupported features
- Add features based on user feedback

### Risk 4: Syntax Highlighting Accuracy
**Risk**: Tokenizers may miss language nuances.
**Mitigation**:
- Focus on common patterns, not edge cases
- Allow custom tokenizers
- Accept "good enough" highlighting

## Migration Plan

No breaking changes. All features are additive.

### Adoption path:
1. **Command Palette**: Add to existing apps for discoverability
2. **TCSS**: Migrate inline styles to external files gradually
3. **Screen Stack**: Replace manual state management
4. **Canvas**: Add where custom graphics needed
5. **Grid**: Use alongside Flexbox for 2D layouts

## Open Questions

1. **TCSS file extension**: `.tcss` or `.tuicss` or `.tui.css`?
   - Leaning toward `.tcss` for brevity

2. **Router path syntax**: `/users/:id` or `/users/{id}` or `/users/[id]`?
   - Leaning toward `:id` (Express/Vue style, most familiar)

3. **Canvas coordinate system**: (0,0) at top-left or bottom-left?
   - Leaning toward top-left (matches terminal)

4. **Syntax highlighter languages**: Which languages to include by default?
   - Proposed: JS, TS, Python, JSON, YAML, Go, Rust, Bash

## References

- [Textual TCSS Documentation](https://textual.textualize.io/guide/CSS/)
- [CSS Grid Specification](https://www.w3.org/TR/css-grid-1/)
- [fzf Algorithm](https://github.com/junegunn/fzf/blob/master/src/algo/algo.go)
- [Ratatui Canvas Widget](https://docs.rs/ratatui/latest/ratatui/widgets/canvas/)
- [Rich Box Styles](https://rich.readthedocs.io/en/latest/appendix/box.html)
