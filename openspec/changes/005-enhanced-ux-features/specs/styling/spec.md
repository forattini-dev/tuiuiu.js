# Styling System Spec Delta

## ADDED Requirements

### Requirement: TCSS Tokenizer
The system SHALL provide a tokenizer for CSS-like terminal styling syntax.

#### Scenario: Tokenize selectors
- **WHEN** input `Box.primary #header` is tokenized
- **THEN** tokens are: [TYPE:Box, DOT, IDENT:primary, HASH, IDENT:header]

#### Scenario: Tokenize properties
- **WHEN** input `color: red; padding: 1;` is tokenized
- **THEN** tokens are: [IDENT:color, COLON, IDENT:red, SEMI, IDENT:padding, COLON, NUMBER:1, SEMI]

#### Scenario: Tokenize comments
- **WHEN** input contains `/* comment */` or `// comment`
- **THEN** comments are recognized and can be optionally preserved or skipped

#### Scenario: Tokenize strings
- **WHEN** input contains `"hello world"` or `'single quotes'`
- **THEN** string literals are tokenized including escaped characters

#### Scenario: Tokenize units
- **WHEN** input contains `10%`, `5fr`, `auto`
- **THEN** numbers with units are correctly tokenized

### Requirement: TCSS Parser
The system SHALL parse TCSS into an Abstract Syntax Tree (AST).

#### Scenario: Parse type selector
- **WHEN** `Box { color: red }` is parsed
- **THEN** AST contains a rule with type selector 'Box' and declaration { color: 'red' }

#### Scenario: Parse class selector
- **WHEN** `.primary { backgroundColor: blue }` is parsed
- **THEN** AST contains a rule with class selector 'primary'

#### Scenario: Parse ID selector
- **WHEN** `#header { padding: 1 }` is parsed
- **THEN** AST contains a rule with ID selector 'header'

#### Scenario: Parse pseudo-class
- **WHEN** `Button:focus { borderColor: cyan }` is parsed
- **THEN** AST contains pseudo-class 'focus' on type selector 'Button'

#### Scenario: Parse descendant combinator
- **WHEN** `Form Input { color: gray }` is parsed
- **THEN** AST contains descendant combinator matching Input inside Form

#### Scenario: Parse child combinator
- **WHEN** `Box > Text { bold: true }` is parsed
- **THEN** AST contains child combinator matching direct Text children of Box

#### Scenario: Parse variables
- **WHEN** `$primary: blue; Box { color: $primary }` is parsed
- **THEN** AST contains variable definition and reference

#### Scenario: Parse @import
- **WHEN** `@import "theme.tcss";` is parsed
- **THEN** AST contains import statement with path

#### Scenario: Parse @media
- **WHEN** `@media (min-width: 80) { Box { padding: 2 } }` is parsed
- **THEN** AST contains media query with nested rules

#### Scenario: Handle parse errors
- **WHEN** invalid TCSS is parsed
- **THEN** an error is thrown with line/column information
- **AND** parsing continues after the error to report multiple issues

### Requirement: Style Resolution
The system SHALL resolve which styles apply to each component based on selectors and specificity.

#### Scenario: Specificity ordering
- **WHEN** multiple rules match the same element
- **THEN** the rule with higher specificity wins
- **AND** specificity is calculated as (IDs, Classes+PseudoClasses, Types)

#### Scenario: Cascade ordering
- **WHEN** multiple rules have the same specificity
- **THEN** the later rule in source order wins

#### Scenario: Property inheritance
- **WHEN** a property is inheritable (e.g., color)
- **THEN** child components inherit the value from their parent if not explicitly set

#### Scenario: Variable resolution
- **WHEN** a property value references a variable (`$primary`)
- **THEN** the variable value is substituted

#### Scenario: Apply styles to VNode
- **WHEN** `applyStyles(vnode, stylesheet)` is called
- **THEN** the VNode's style properties are updated based on matching rules

### Requirement: Style Hot Reload
The system SHALL support automatic reloading of TCSS files during development.

#### Scenario: Watch file
- **WHEN** `enableHotReload('styles.tcss')` is called
- **THEN** the file is watched for changes

#### Scenario: Reload on change
- **WHEN** a watched TCSS file is modified
- **THEN** the stylesheet is reparsed
- **AND** the UI is re-rendered with new styles

#### Scenario: Error recovery
- **WHEN** a modified TCSS file has syntax errors
- **THEN** the previous valid stylesheet is preserved
- **AND** an error is logged to the console

#### Scenario: Style change event
- **WHEN** styles are reloaded
- **THEN** a `stylechange` event is emitted for debugging

### Requirement: Screen Transitions
The system SHALL support animated transitions when navigating between screens.

#### Scenario: Slide left transition
- **WHEN** a screen is pushed with `transition: 'slide-left'`
- **THEN** the new screen slides in from the right
- **AND** the old screen slides out to the left

#### Scenario: Slide right transition
- **WHEN** a screen is popped with `transition: 'slide-right'`
- **THEN** the old screen slides in from the left
- **AND** the current screen slides out to the right

#### Scenario: Fade transition
- **WHEN** a screen is pushed with `transition: 'fade'`
- **THEN** the new screen fades in while the old screen fades out

#### Scenario: Custom duration
- **WHEN** `transition: { type: 'slide-left', duration: 300 }` is specified
- **THEN** the transition takes 300ms

#### Scenario: Spring physics
- **WHEN** `transition: { type: 'slide-left', spring: true }` is specified
- **THEN** the transition uses spring physics from the animation system

#### Scenario: No transition
- **WHEN** `transition: 'none'` is specified
- **THEN** the screen change is instant without animation

### Requirement: Syntax Theme Support
The system SHALL support multiple color themes for syntax highlighting.

#### Scenario: Built-in themes
- **WHEN** a syntax highlighter specifies `theme: 'monokai'`
- **THEN** the Monokai color scheme is applied

#### Scenario: Custom theme
- **WHEN** a custom theme object is provided
- **THEN** the custom colors are used for token types

#### Scenario: Theme properties
- **WHEN** a theme is applied
- **THEN** it defines colors for: keyword, string, number, comment, function, variable, type, operator, punctuation

#### Scenario: Available built-in themes
- **WHEN** the syntax highlighter is used
- **THEN** themes 'monokai', 'github-dark', 'one-dark', 'dracula', 'nord' are available
