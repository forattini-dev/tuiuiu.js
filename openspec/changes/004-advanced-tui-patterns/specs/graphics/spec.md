# Graphics System

## ADDED Requirements

### Requirement: Graphics Protocol Detection
The system SHALL auto-detect the best available graphics protocol.

#### Scenario: Kitty terminal
- **WHEN** running in Kitty terminal
- **THEN** Kitty graphics protocol is selected
- **AND** direct PNG data transfer is used

#### Scenario: iTerm2 terminal
- **WHEN** running in iTerm2
- **THEN** iTerm2 inline images protocol is selected
- **AND** base64 encoding is used

#### Scenario: Sixel support
- **WHEN** terminal supports Sixel (xterm, mlterm)
- **THEN** Sixel protocol is selected
- **AND** palette-based rendering is used

#### Scenario: Fallback to braille
- **WHEN** no image protocol is supported
- **THEN** braille character rendering is used
- **AND** images are converted to 2x4 dot patterns

#### Scenario: Manual override
- **WHEN** `TUIUIU_GRAPHICS=sixel` env var is set
- **THEN** the specified protocol is used regardless of detection
- **AND** errors are reported if protocol is unsupported

---

### Requirement: Kitty Graphics Protocol
The system SHALL support the Kitty graphics protocol for image display.

#### Scenario: Direct image display
- **WHEN** `Image({ src, width, height })` is rendered with Kitty protocol
- **THEN** image data is sent using APC escape sequence
- **AND** image is displayed at specified size

#### Scenario: Chunked transfer
- **WHEN** image data exceeds 4KB
- **THEN** data is sent in multiple chunks
- **AND** terminal reassembles the full image

#### Scenario: Image caching
- **WHEN** the same image is displayed multiple times
- **THEN** the image ID is reused
- **AND** only placement commands are sent

#### Scenario: Image deletion
- **WHEN** an image is removed from display
- **THEN** a delete command is sent to free terminal memory

---

### Requirement: Sixel Graphics Protocol
The system SHALL support Sixel for legacy terminal image display.

#### Scenario: Sixel encoding
- **WHEN** an image is displayed with Sixel protocol
- **THEN** the image is converted to Sixel format
- **AND** output uses DCS escape sequences

#### Scenario: Color palette
- **WHEN** encoding for Sixel
- **THEN** a color palette of up to 256 colors is used
- **AND** colors are quantized from source image

#### Scenario: Transparency handling
- **WHEN** source image has transparency
- **THEN** transparent pixels use terminal background
- **AND** semi-transparent pixels are dithered

---

### Requirement: Braille Graphics
The system SHALL support braille character rendering for universal graphics.

#### Scenario: Braille conversion
- **WHEN** rendering with braille fallback
- **THEN** each 2x4 pixel block is converted to a braille character
- **AND** 8 dots per character are used (U+2800-U+28FF)

#### Scenario: Threshold control
- **WHEN** `threshold` option is set
- **THEN** pixels above threshold are considered "on"
- **AND** allows control over image appearance

#### Scenario: Dithering
- **WHEN** `dither: true` is set
- **THEN** Floyd-Steinberg dithering is applied
- **AND** gradients appear smoother

---

### Requirement: Image Component
The system SHALL provide an Image component for displaying images.

#### Scenario: Auto protocol
- **WHEN** `Image({ src })` is rendered
- **THEN** the best available protocol is auto-selected
- **AND** image is displayed accordingly

#### Scenario: Scaling
- **WHEN** `Image({ src, width: 40, height: 20 })` is rendered
- **THEN** the image is scaled to fit dimensions
- **AND** aspect ratio is preserved by default

#### Scenario: Fit modes
- **WHEN** `fit: 'cover'` is specified
- **THEN** image fills the area, cropping if necessary
- **WHEN** `fit: 'contain'` is specified
- **THEN** image fits within area, with letterboxing if necessary

#### Scenario: Error handling
- **WHEN** image fails to load or display
- **THEN** an error placeholder is shown
- **AND** an error callback is invoked
