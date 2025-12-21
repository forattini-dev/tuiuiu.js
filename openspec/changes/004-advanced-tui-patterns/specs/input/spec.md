# Input Handling System

## ADDED Requirements

### Requirement: Kitty Keyboard Protocol
The system SHALL support the Kitty keyboard protocol for enhanced key detection.

#### Scenario: Protocol detection
- **WHEN** the application starts
- **THEN** the system queries terminal for Kitty protocol support
- **AND** enables enhanced mode if supported

#### Scenario: Modifier key detection
- **WHEN** a key with modifiers is pressed (e.g., Ctrl+Shift+A)
- **THEN** all modifier keys are accurately reported
- **AND** the base key is correctly identified

#### Scenario: Key release events
- **WHEN** Kitty protocol is active
- **THEN** key release events are captured
- **AND** key repeat events are distinguished from initial press

#### Scenario: Fallback mode
- **WHEN** Kitty protocol is not supported
- **THEN** the system falls back to standard ANSI sequences
- **AND** functionality degrades gracefully

---

### Requirement: Mouse Drag Events
The system SHALL support mouse drag events for interactive components.

#### Scenario: Drag start
- **WHEN** mouse button is pressed and movement occurs
- **THEN** a `dragstart` event is emitted
- **AND** the starting position is recorded

#### Scenario: Drag move
- **WHEN** mouse moves while button is held
- **THEN** `dragmove` events are emitted with delta positions
- **AND** events are throttled to prevent flooding

#### Scenario: Drag end
- **WHEN** mouse button is released after dragging
- **THEN** a `dragend` event is emitted
- **AND** the total displacement is calculated

#### Scenario: Drag threshold
- **WHEN** mouse moves less than 3 pixels before release
- **THEN** it is treated as a click, not a drag
- **AND** no drag events are emitted

---

### Requirement: Bracketed Paste
The system SHALL support bracketed paste mode for safe paste handling.

#### Scenario: Paste mode activation
- **WHEN** terminal supports bracketed paste
- **THEN** the mode is enabled on startup

#### Scenario: Paste detection
- **WHEN** text is pasted from clipboard
- **THEN** a single `paste` event is emitted
- **AND** the full pasted content is provided

#### Scenario: Large paste handling
- **WHEN** a large amount of text is pasted (>10KB)
- **THEN** the paste is chunked into manageable pieces
- **AND** no terminal buffer overflow occurs

#### Scenario: Paste cancellation
- **WHEN** user presses Ctrl+C during large paste
- **THEN** the paste is cancelled
- **AND** remaining content is discarded

---

### Requirement: Input State Machine
The system SHALL use a state machine for predictable text editing.

#### Scenario: Normal state
- **WHEN** in normal editing mode
- **THEN** character input is inserted at cursor
- **AND** navigation keys move cursor

#### Scenario: Selection state
- **WHEN** Shift+Arrow keys are pressed
- **THEN** text is selected from cursor position
- **AND** selection is visually highlighted

#### Scenario: Composition state
- **WHEN** IME composition is active
- **THEN** composition text is shown with underline
- **AND** normal input is suspended until composition completes
