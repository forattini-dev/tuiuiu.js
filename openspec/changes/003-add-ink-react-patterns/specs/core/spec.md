# Core Capability Delta

## ADDED Requirements

### Requirement: Context API

The system SHALL provide a Context API for sharing state between components without prop drilling.

#### Scenario: Create context with default value
- **GIVEN** a developer wants to share state
- **WHEN** `createContext(defaultValue)` is called
- **THEN** a Context object is returned with the default value

#### Scenario: Provider overrides context value
- **GIVEN** a Context with default value "dark"
- **WHEN** a Provider wraps children with value "light"
- **THEN** `useContext` within children returns "light"

#### Scenario: Nested providers use closest value
- **GIVEN** outer Provider with value "A" and inner Provider with value "B"
- **WHEN** a component inside inner Provider calls `useContext`
- **THEN** it receives value "B"

#### Scenario: Components outside Provider use default
- **GIVEN** a Context with default value "default"
- **WHEN** a component outside any Provider calls `useContext`
- **THEN** it receives "default"

### Requirement: Static Output Component

The system SHALL provide a Static component for content that persists across re-renders.

#### Scenario: Static content renders once
- **GIVEN** a Static component with log messages
- **WHEN** the app re-renders multiple times
- **THEN** the static content is rendered only once above interactive content

#### Scenario: Static content preserved on update
- **GIVEN** static output "Log 1" and "Log 2"
- **WHEN** the interactive portion updates
- **THEN** static output remains visible above the interactive portion

#### Scenario: Multiple Static blocks stack
- **GIVEN** Static block A followed by Static block B
- **WHEN** rendered
- **THEN** block A appears first, then block B, then interactive content

### Requirement: Raw Mode Reference Counting

The system SHALL track raw mode usage with reference counting to support multiple components.

#### Scenario: Single component enables raw mode
- **GIVEN** no components using raw mode
- **WHEN** one useInput hook mounts
- **THEN** raw mode is enabled (count = 1)

#### Scenario: Multiple components share raw mode
- **GIVEN** one component using raw mode (count = 1)
- **WHEN** a second component mounts with useInput
- **THEN** raw mode stays enabled (count = 2)

#### Scenario: Raw mode disabled when all unmount
- **GIVEN** two components using raw mode (count = 2)
- **WHEN** both components unmount
- **THEN** raw mode is disabled (count = 0)

#### Scenario: Partial unmount keeps raw mode
- **GIVEN** two components using raw mode (count = 2)
- **WHEN** one component unmounts
- **THEN** raw mode stays enabled (count = 1)
