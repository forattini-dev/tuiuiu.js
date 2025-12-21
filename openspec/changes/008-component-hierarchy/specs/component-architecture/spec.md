# Component Architecture Specification

## ADDED Requirements

### Requirement: Atomic Design Hierarchy
The library SHALL organize components into five distinct levels following Atomic Design principles adapted for terminal UIs.

#### Scenario: Component levels are clearly defined
- **WHEN** a developer looks for a component
- **THEN** they can identify its level by its directory location (primitives, atoms, molecules, organisms, templates)

#### Scenario: Each level builds on the previous
- **WHEN** a molecule component is created
- **THEN** it SHALL compose one or more atoms
- **AND** it SHALL NOT directly use core/engine internals

### Requirement: Primitives Layer
The `src/primitives/` directory SHALL contain VNode factories and reactive utilities that are the foundation of all UI components.

#### Scenario: VNode factories available
- **WHEN** importing from primitives
- **THEN** Box, Text, Spacer, Newline, and Fragment functions SHALL be available
- **AND** each function SHALL return a VNode object

#### Scenario: Reactive utilities available
- **WHEN** importing from primitives
- **THEN** createSignal, createEffect, createMemo, batch, and untrack SHALL be available
- **AND** createStore, applyMiddleware SHALL be available for state management

#### Scenario: Control flow utilities available
- **WHEN** importing from primitives
- **THEN** When, Each, Transform, Static, and Slot SHALL be available
- **AND** each SHALL return VNode or null

### Requirement: Atoms Layer
The `src/atoms/` directory SHALL contain the smallest UI components that have internal state or behavior.

#### Scenario: Atom components are self-contained
- **WHEN** using an atom component (e.g., TextInput, Spinner)
- **THEN** it SHALL manage its own internal state
- **AND** it SHALL NOT depend on other atoms (only primitives)

#### Scenario: Atoms include feedback components
- **WHEN** importing from atoms
- **THEN** Badge, Spinner, ProgressBar, and Timer SHALL be available

#### Scenario: Atoms include form inputs
- **WHEN** importing from atoms
- **THEN** TextInput, Checkbox, Switch, Slider, and Button SHALL be available

### Requirement: Molecules Layer
The `src/molecules/` directory SHALL contain components that compose multiple atoms into functional units.

#### Scenario: Molecules compose atoms
- **WHEN** a Select component renders
- **THEN** it SHALL use TextInput atom for the input field
- **AND** it SHALL use list rendering with Text primitives

#### Scenario: Molecules include form groups
- **WHEN** importing from molecules
- **THEN** Select, MultiSelect, RadioGroup, and Autocomplete SHALL be available

#### Scenario: Molecules include data display
- **WHEN** importing from molecules
- **THEN** Table, CodeBlock, Markdown, Tree, and Calendar SHALL be available

#### Scenario: Molecules include data visualization
- **WHEN** importing from molecules
- **THEN** Sparkline, BarChart, LineChart, Gauge, and Heatmap SHALL be available

### Requirement: Organisms Layer
The `src/organisms/` directory SHALL contain complex, self-contained components that may compose molecules, atoms, and primitives.

#### Scenario: Organisms are complete features
- **WHEN** using a Modal organism
- **THEN** it SHALL handle its own overlay rendering
- **AND** it SHALL manage focus trapping
- **AND** it SHALL handle keyboard navigation (Escape to close)

#### Scenario: Organisms include overlays
- **WHEN** importing from organisms
- **THEN** Modal, ConfirmDialog, Toast, CommandPalette, and AlertBox SHALL be available

#### Scenario: Organisms include complex layouts
- **WHEN** importing from organisms
- **THEN** SplitPanel, ScrollArea, VirtualList, Grid, and DataTable SHALL be available

### Requirement: Templates Layer
The `src/templates/` directory SHALL contain page-level layout components.

#### Scenario: Templates provide page structure
- **WHEN** using a Page template
- **THEN** it SHALL provide consistent header, content, and footer areas
- **AND** it SHALL fill available terminal space

#### Scenario: Templates include stack layouts
- **WHEN** importing from templates
- **THEN** VStack, HStack, and Center SHALL be available
- **AND** each SHALL provide flexbox-like layout behavior

#### Scenario: Templates include app shells
- **WHEN** importing from templates
- **THEN** Page, AppShell, FullScreen, Header, StatusBar, and Container SHALL be available

### Requirement: Backward Compatible Imports
The library SHALL maintain backward compatibility by re-exporting components from deprecated locations.

#### Scenario: Old import paths still work
- **WHEN** importing from `components/` or `design-system/`
- **THEN** the import SHALL resolve to the new location
- **AND** a deprecation warning MAY be logged in development mode

#### Scenario: Main index exports all levels
- **WHEN** importing from the main `tuiuiu` package
- **THEN** all primitives, atoms, molecules, organisms, and templates SHALL be available
- **AND** they SHALL be organized by category in the export list

### Requirement: Subpath Exports
The library SHALL support subpath imports for tree-shaking and clarity.

#### Scenario: Subpath imports available
- **WHEN** importing from `tuiuiu/primitives`
- **THEN** only primitive exports SHALL be included
- **AND** bundle size SHALL be smaller than importing from main

#### Scenario: All levels have subpaths
- **WHEN** configuring package.json exports
- **THEN** `tuiuiu/primitives`, `tuiuiu/atoms`, `tuiuiu/molecules`, `tuiuiu/organisms`, and `tuiuiu/templates` SHALL be valid import paths

### Requirement: Reactive Store
The primitives layer SHALL include a Redux-inspired reactive store powered by signals.

#### Scenario: Store creation
- **WHEN** calling `createStore(reducer, initialState)`
- **THEN** a Store object SHALL be returned with getState, state (signal), dispatch, and subscribe methods

#### Scenario: Reactive state access
- **WHEN** calling `store.state()` inside a component or effect
- **THEN** the component SHALL automatically re-render when state changes

#### Scenario: Middleware support
- **WHEN** calling `createStore(reducer, state, applyMiddleware(logger, persist))`
- **THEN** each middleware SHALL be called in order on dispatch

#### Scenario: Persistence middleware
- **WHEN** using `createPersistMiddleware({ storage, key })`
- **THEN** state changes SHALL be debounced and saved to storage
- **AND** state SHALL be loadable on app restart

### Requirement: Component Naming Convention
All components SHALL follow consistent naming conventions.

#### Scenario: Factory functions use PascalCase
- **WHEN** defining a component factory
- **THEN** the function name SHALL be PascalCase (e.g., TextInput, ProgressBar)

#### Scenario: State creators use camelCase with prefix
- **WHEN** defining a state creator
- **THEN** the function name SHALL be camelCase with `create` prefix (e.g., createTextInput, createSelect)

#### Scenario: Render functions use camelCase with prefix
- **WHEN** defining a pure render function
- **THEN** the function name SHALL be camelCase with `render` prefix (e.g., renderSpinner, renderProgressBar)
