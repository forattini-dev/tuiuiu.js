# Hooks Capability Delta

## ADDED Requirements

### Requirement: Automatic Tab Navigation

The system SHALL automatically handle Tab and Shift+Tab for focus navigation.

#### Scenario: Tab moves to next focusable
- **GIVEN** component A is focused and component B is next in order
- **WHEN** user presses Tab
- **THEN** focus moves from A to B automatically

#### Scenario: Shift+Tab moves to previous focusable
- **GIVEN** component B is focused and component A is previous in order
- **WHEN** user presses Shift+Tab
- **THEN** focus moves from B to A automatically

#### Scenario: Tab wraps at end
- **GIVEN** the last focusable component is focused
- **WHEN** user presses Tab
- **THEN** focus wraps to the first focusable component

#### Scenario: Escape clears focus
- **GIVEN** a component is focused
- **WHEN** user presses Escape
- **THEN** no component is focused (activeId becomes undefined)

#### Scenario: Tab navigation can be disabled
- **GIVEN** render options `{ disableAutoTabNavigation: true }`
- **WHEN** user presses Tab
- **THEN** focus does not change automatically

### Requirement: EventEmitter-based Input Handling

The system SHALL use EventEmitter pattern for input handler registration.

#### Scenario: Handler registered via EventEmitter
- **GIVEN** a component with useInput hook
- **WHEN** the component mounts
- **THEN** handler is registered via `eventEmitter.on('input', handler)`

#### Scenario: Handler removed on cleanup
- **GIVEN** a mounted component with useInput
- **WHEN** the component unmounts
- **THEN** handler is removed via `eventEmitter.off('input', handler)`

#### Scenario: Multiple handlers fire in order
- **GIVEN** handlers A, B, C registered in order
- **WHEN** input event fires
- **THEN** handlers are called in order: A, B, C

#### Scenario: Handlers wrapped in batch
- **GIVEN** a handler that updates multiple signals
- **WHEN** input is received
- **THEN** handler runs inside `batch()` for single re-render

### Requirement: FocusContext Provider

The system SHALL provide focus management through Context API.

#### Scenario: FocusContext available in components
- **GIVEN** an app rendered with render()
- **WHEN** a component calls `useContext(FocusContext)`
- **THEN** it receives the FocusManager instance

#### Scenario: useFocus uses FocusContext
- **GIVEN** a component using useFocus hook
- **WHEN** the hook initializes
- **THEN** it obtains FocusManager from FocusContext (not global)

#### Scenario: Nested focus scopes
- **GIVEN** a modal with its own FocusContext.Provider
- **WHEN** Tab is pressed inside the modal
- **THEN** focus cycles only within the modal's focusables

## MODIFIED Requirements

### Requirement: useFocus Hook

The useFocus hook SHALL register with FocusContext and support automatic focus cycling.

#### Scenario: Component registers with FocusContext
- **GIVEN** a component with `useFocus({ autoFocus: true })`
- **WHEN** the component mounts
- **THEN** it registers with the FocusContext provider

#### Scenario: Focus state reflects active ID
- **GIVEN** multiple components with useFocus
- **WHEN** FocusManager.focusNext() is called
- **THEN** the newly focused component's `isFocused` becomes true

#### Scenario: Cleanup removes from focus order
- **GIVEN** a focused component
- **WHEN** the component unmounts
- **THEN** it is removed from the focus order and focus moves to next

### Requirement: useInput Hook

The useInput hook SHALL use EventEmitter pattern with automatic batch wrapping.

#### Scenario: Handler receives parsed key info
- **GIVEN** a component with useInput handler
- **WHEN** arrow key is pressed
- **THEN** handler receives `{ input: '', key: { upArrow: true, ... } }`

#### Scenario: isActive controls handler execution
- **GIVEN** `useInput(handler, { isActive: false })`
- **WHEN** input is received
- **THEN** handler is not called

#### Scenario: Reactive isActive getter
- **GIVEN** `useInput(handler, { isActive: () => signal() })`
- **WHEN** signal changes from false to true
- **THEN** handler starts receiving input
