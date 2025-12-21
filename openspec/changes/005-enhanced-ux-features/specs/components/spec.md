# Components Spec Delta

## ADDED Requirements

### Requirement: Command Palette Component
The system SHALL provide a Command Palette component for discovering and executing commands with fuzzy search.

#### Scenario: Open palette
- **WHEN** the user presses the configured keybinding (default: Ctrl+K)
- **THEN** the Command Palette overlay is displayed
- **AND** focus is moved to the search input

#### Scenario: Fuzzy search
- **WHEN** the user types in the search input
- **THEN** commands are filtered using fuzzy matching
- **AND** results are sorted by match score

#### Scenario: Navigate results
- **WHEN** the user presses Up/Down arrow keys
- **THEN** the selection moves through the filtered results

#### Scenario: Execute command
- **WHEN** the user presses Enter on a selected command
- **THEN** the command's action is executed
- **AND** the palette is closed

#### Scenario: Recent commands
- **WHEN** the palette is opened with empty input
- **THEN** recently executed commands are shown first

#### Scenario: Category grouping
- **WHEN** commands have categories assigned
- **THEN** results are visually grouped by category

### Requirement: Canvas Widget
The system SHALL provide a Canvas widget for drawing arbitrary shapes using terminal characters.

#### Scenario: Draw line
- **WHEN** `canvas.line(0, 0, 10, 5, 'red')` is called
- **THEN** a line is drawn from (0,0) to (10,5) using the Bresenham algorithm

#### Scenario: Draw rectangle
- **WHEN** `canvas.rect(5, 2, 20, 10, { fill: 'blue', stroke: 'white' })` is called
- **THEN** a filled rectangle with border is drawn at the specified position

#### Scenario: Draw circle
- **WHEN** `canvas.circle(15, 8, 5, { fill: 'green' })` is called
- **THEN** a filled circle with radius 5 is drawn centered at (15, 8)

#### Scenario: Braille mode
- **WHEN** the Canvas is set to `mode: 'braille'`
- **THEN** drawing uses braille characters for 2x4 resolution per cell

#### Scenario: Draw text
- **WHEN** `canvas.text(5, 10, 'Hello', 'cyan')` is called
- **THEN** the text is positioned at coordinates (5, 10)

#### Scenario: Bezier curve
- **WHEN** `canvas.bezier(startPoint, controlPoint1, controlPoint2, endPoint)` is called
- **THEN** a smooth bezier curve is drawn through the control points

### Requirement: Syntax Highlighter Component
The system SHALL provide a component for displaying syntax-highlighted code.

#### Scenario: Highlight JavaScript
- **WHEN** a SyntaxHighlight component renders JavaScript code
- **THEN** keywords, strings, numbers, and comments are colored appropriately

#### Scenario: Theme support
- **WHEN** a theme is specified with `theme: 'monokai'`
- **THEN** the color scheme matches the Monokai theme

#### Scenario: Line numbers
- **WHEN** `lineNumbers: true` is set
- **THEN** line numbers are displayed on the left margin

#### Scenario: Highlight lines
- **WHEN** `highlightLines: [3, 5, 7]` is set
- **THEN** lines 3, 5, and 7 have a highlighted background

#### Scenario: Auto-detect language
- **WHEN** no language is specified
- **THEN** the language is detected from file extension or content heuristics

### Requirement: BigText Component
The system SHALL provide a component for rendering large ASCII art text banners.

#### Scenario: Render banner
- **WHEN** `BigText({ children: 'HELLO' })` is rendered
- **THEN** the text is displayed using large ASCII art characters

#### Scenario: Font selection
- **WHEN** `font: 'slant'` is specified
- **THEN** the slant ASCII font style is used

#### Scenario: Color gradient
- **WHEN** `gradient: ['red', 'yellow', 'green']` is specified
- **THEN** characters transition through the gradient colors left to right

#### Scenario: Auto-fit width
- **WHEN** the container is smaller than the BigText width
- **THEN** the font size or width is reduced to fit

#### Scenario: Character reveal animation
- **WHEN** `animate: true` is set
- **THEN** characters are revealed one at a time with animation

### Requirement: File Manager Widget
The system SHALL provide a file browser component for navigating the filesystem.

#### Scenario: List directory
- **WHEN** a FileManager is initialized with a path
- **THEN** files and directories in that path are displayed

#### Scenario: Navigate into directory
- **WHEN** the user presses Enter on a directory
- **THEN** the view navigates into that directory

#### Scenario: Navigate up
- **WHEN** the user presses Backspace or navigates to '..'
- **THEN** the view navigates to the parent directory

#### Scenario: File selection
- **WHEN** the user presses Space on a file
- **THEN** the file is toggled as selected

#### Scenario: Multi-select
- **WHEN** `multiSelect: true` and Shift+Up/Down is pressed
- **THEN** multiple files can be selected

#### Scenario: Preview pane
- **WHEN** `preview: true` and a text file is highlighted
- **THEN** the file contents are shown in a preview pane

#### Scenario: Filter files
- **WHEN** a filter is set with `filter: '*.ts'`
- **THEN** only matching files are displayed

#### Scenario: vim navigation
- **WHEN** the user presses j/k
- **THEN** the selection moves down/up
- **AND** gg moves to first item, G moves to last item

### Requirement: Extended Border Styles
The system SHALL provide 15+ border styles for Box components.

#### Scenario: Heavy borders
- **WHEN** `borderStyle: 'heavy'` is set
- **THEN** thick Unicode box drawing characters are used (┏┓┗┛━┃)

#### Scenario: Double borders
- **WHEN** `borderStyle: 'double'` is set
- **THEN** double-line box characters are used (╔╗╚╝═║)

#### Scenario: Minimal borders
- **WHEN** `borderStyle: 'minimal'` is set
- **THEN** only horizontal lines are shown

#### Scenario: Markdown borders
- **WHEN** `borderStyle: 'markdown'` is set
- **THEN** pipe and dash characters are used (|+-)

#### Scenario: ASCII borders
- **WHEN** `borderStyle: 'ascii'` is set
- **THEN** only ASCII characters are used (+|-)

### Requirement: Extended Spinners
The system SHALL provide 50+ spinner animation presets.

#### Scenario: Select spinner by name
- **WHEN** `Spinner({ name: 'dots' })` is rendered
- **THEN** the dots spinner animation is displayed

#### Scenario: Custom spinner
- **WHEN** `Spinner({ frames: ['🌑','🌒','🌓','🌔','🌕'], interval: 100 })` is rendered
- **THEN** the custom animation is displayed at the specified interval

#### Scenario: Braille spinners
- **WHEN** `Spinner({ name: 'braille' })` is rendered
- **THEN** a braille-based spinner animation is displayed

#### Scenario: Character spinners
- **WHEN** `Spinner({ name: 'clock' })` is rendered
- **THEN** clock emoji animation (🕐🕑🕒...) is displayed
