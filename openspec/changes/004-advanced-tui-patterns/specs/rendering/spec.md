# Rendering System

## ADDED Requirements

### Requirement: Cell Buffer
The system SHALL provide a cell buffer abstraction for efficient terminal rendering.

#### Scenario: Create buffer
- **WHEN** `createBuffer(width, height)` is called
- **THEN** a 2D grid of empty cells is returned
- **AND** each cell contains char, foreground, background, and attributes

#### Scenario: Write to buffer
- **WHEN** `buffer.set(x, y, cell)` is called
- **THEN** the cell at position (x, y) is updated
- **AND** the position is marked as dirty

#### Scenario: Buffer diff
- **WHEN** `buffer.diff(otherBuffer)` is called
- **THEN** a list of changed cells with their positions is returned
- **AND** unchanged cells are not included

---

### Requirement: Delta Rendering
The system SHALL support delta rendering to minimize terminal output.

#### Scenario: Only changed cells rendered
- **WHEN** the UI is re-rendered
- **THEN** only cells that differ from the previous frame are output
- **AND** unchanged regions are skipped

#### Scenario: Damage tracking
- **WHEN** a component updates
- **THEN** the affected region is marked as damaged
- **AND** only damaged regions are re-calculated

#### Scenario: Full redraw trigger
- **WHEN** `forceRedraw()` is called
- **THEN** the entire screen is re-rendered
- **AND** all damage regions are cleared

---

### Requirement: Double Buffering
The system SHALL support double buffering for flicker-free rendering.

#### Scenario: Buffer swap
- **WHEN** rendering completes
- **THEN** the back buffer is swapped to front
- **AND** the old front buffer becomes the new back buffer

#### Scenario: No partial frames
- **WHEN** the screen is being updated
- **THEN** users never see incomplete render states
- **AND** the transition is atomic

---

### Requirement: Render Mode Detection
The system SHALL detect terminal capabilities and adjust rendering mode.

#### Scenario: Unicode mode
- **WHEN** terminal supports Unicode
- **THEN** full Unicode characters are used for borders and graphics

#### Scenario: ASCII fallback mode
- **WHEN** terminal only supports ASCII
- **THEN** ASCII equivalents are used for all characters

#### Scenario: True color mode
- **WHEN** terminal supports 24-bit color
- **THEN** RGB colors are used directly

#### Scenario: 256 color mode
- **WHEN** terminal only supports 256 colors
- **THEN** RGB colors are converted to closest 256-color match

#### Scenario: 16 color mode
- **WHEN** terminal only supports 16 colors
- **THEN** colors are converted to closest ANSI 16 color
