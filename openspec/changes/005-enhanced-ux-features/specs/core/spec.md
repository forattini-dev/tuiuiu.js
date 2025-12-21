# Core Enhancements Spec Delta

## ADDED Requirements

### Requirement: Key Binding Registry
The system SHALL provide a centralized registry for keyboard shortcuts that maps key combinations to actions with context-aware resolution.

#### Scenario: Register key binding
- **WHEN** a component registers a key binding with `registerKeybinding({ key: 'ctrl+k', action: openPalette })`
- **THEN** the binding is stored in the global registry
- **AND** the binding is associated with the component's context

#### Scenario: Context-aware resolution
- **WHEN** multiple components register the same key binding
- **THEN** the system resolves to the most specific context (focused component > screen > global)

#### Scenario: Conflict detection
- **WHEN** a binding is registered that conflicts with an existing binding at the same context level
- **THEN** the system warns in development mode
- **AND** the newer binding takes precedence

#### Scenario: Vim mode preset
- **WHEN** vim mode is enabled with `setKeyMode('vim')`
- **THEN** navigation bindings (j/k/h/l, gg, G) are registered for compatible components

### Requirement: Command Registry
The system SHALL provide a registry for discoverable commands that can be executed via the Command Palette or programmatically.

#### Scenario: Register command
- **WHEN** a command is registered with `registerCommand({ id: 'file.save', label: 'Save File', action: save })`
- **THEN** the command is available in the Command Palette
- **AND** the command can be executed with `executeCommand('file.save')`

#### Scenario: Command categories
- **WHEN** commands are registered with categories (`category: 'File'`)
- **THEN** the Command Palette groups commands by category

#### Scenario: Command keybinding
- **WHEN** a command has an associated keybinding (`keybinding: 'ctrl+s'`)
- **THEN** the keybinding is displayed next to the command in the palette
- **AND** the keybinding triggers the command when pressed

### Requirement: Screen Stack
The system SHALL provide a navigation stack for managing multiple screens with push/pop semantics.

#### Scenario: Push screen
- **WHEN** `pushScreen(SettingsScreen)` is called
- **THEN** the new screen is displayed
- **AND** the previous screen is preserved in the stack

#### Scenario: Pop screen
- **WHEN** `popScreen()` is called
- **THEN** the current screen is removed from the stack
- **AND** the previous screen is restored and displayed

#### Scenario: Back navigation
- **WHEN** the Escape key is pressed on a non-root screen
- **THEN** `popScreen()` is called automatically

#### Scenario: Screen caching
- **WHEN** a screen is pushed with `{ keepAlive: true }`
- **THEN** the screen's state is preserved when covered by another screen

### Requirement: Router
The system SHALL provide a URL-style router for declarative navigation with route parameters.

#### Scenario: Route definition
- **WHEN** routes are defined with `createRouter({ routes: [{ path: '/users/:id', component: UserDetail }] })`
- **THEN** navigating to `/users/123` renders the UserDetail component

#### Scenario: Route parameters
- **WHEN** a route contains parameters like `:id`
- **THEN** the `useParams()` hook returns `{ id: '123' }` when at `/users/123`

#### Scenario: Navigation
- **WHEN** `navigate('/settings')` is called
- **THEN** the current route changes
- **AND** the matching component is rendered

#### Scenario: Navigation guards
- **WHEN** a route has a `beforeEnter` guard that returns `false`
- **THEN** the navigation is cancelled
- **AND** the current route remains unchanged

### Requirement: Query API
The system SHALL provide a CSS selector-based query API for finding elements in the component tree.

#### Scenario: Query by type
- **WHEN** `query('Button')` is called
- **THEN** the first Button component in the tree is returned

#### Scenario: Query by class
- **WHEN** `queryAll('.primary')` is called
- **THEN** all components with className 'primary' are returned

#### Scenario: Query by ID
- **WHEN** `query('#submit-btn')` is called
- **THEN** the component with id 'submit-btn' is returned

#### Scenario: Pseudo-class query
- **WHEN** `query(':focus')` is called
- **THEN** the currently focused component is returned

#### Scenario: Descendant selector
- **WHEN** `queryAll('Form Input')` is called
- **THEN** all Input components that are descendants of Form are returned

### Requirement: Grid Layout
The system SHALL support CSS Grid-style 2D layout with fractional units and named areas.

#### Scenario: Grid template
- **WHEN** a Grid component is rendered with `gridTemplateColumns: '1fr 2fr 1fr'`
- **THEN** children are arranged in three columns with widths in 1:2:1 ratio

#### Scenario: Grid gap
- **WHEN** a Grid has `gap: 1` or `rowGap: 1, columnGap: 2`
- **THEN** spacing is added between grid cells

#### Scenario: Grid placement
- **WHEN** a child has `gridColumn: '1 / 3'`
- **THEN** the child spans from column 1 to column 3

#### Scenario: Named grid areas
- **WHEN** a Grid defines areas with `gridTemplateAreas: '"header header" "sidebar main"'`
- **THEN** children with `gridArea: 'header'` are placed in the header area
