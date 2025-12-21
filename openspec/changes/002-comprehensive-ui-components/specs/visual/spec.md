# Spec: Visual Components

## ADDED Requirements

### REQ-VISUAL-001: BigText Component
The system MUST provide a BigText component for large ASCII art text.

#### Scenario: Render big text
- GIVEN text: 'HELLO'
- WHEN BigText is rendered with font: 'block'
- THEN large block-style letters are displayed

#### Scenario: Block font
- GIVEN font: 'block'
- WHEN BigText is rendered
- THEN letters use box-drawing characters (█▀▄)

#### Scenario: Slant font
- GIVEN font: 'slant'
- WHEN BigText is rendered
- THEN letters appear slanted/italic style

#### Scenario: Small font
- GIVEN font: 'small'
- WHEN BigText is rendered
- THEN letters are compact (3 lines tall)

#### Scenario: Color support
- GIVEN color: 'cyan'
- WHEN BigText is rendered
- THEN text is displayed in cyan color

#### Scenario: Gradient colors
- GIVEN gradient: ['red', 'yellow', 'green']
- WHEN BigText is rendered
- THEN letters transition through the gradient colors

#### Scenario: Alignment
- GIVEN align: 'center' with fixed width
- WHEN BigText is rendered
- THEN text is centered within the width

---

### REQ-VISUAL-002: Digits Component
The system MUST provide a Digits component for LCD-style numeric display.

#### Scenario: Render digits
- GIVEN value: 1234
- WHEN Digits is rendered
- THEN large LCD-style numbers are displayed

#### Scenario: Block style
- GIVEN style: 'block'
- WHEN Digits is rendered
- THEN digits use solid block characters

#### Scenario: LCD style
- GIVEN style: 'lcd'
- WHEN Digits is rendered
- THEN digits use 7-segment display style

#### Scenario: Time format
- GIVEN value: '12:30'
- WHEN Digits is rendered
- THEN colon separator is displayed between numbers

#### Scenario: Color support
- GIVEN color: 'green'
- WHEN Digits is rendered
- THEN digits are displayed in green

---

### REQ-VISUAL-003: Tooltip Component
The system MUST provide a Tooltip component for contextual help.

#### Scenario: Show tooltip
- GIVEN visible: true
- WHEN Tooltip is rendered
- THEN tooltip text is displayed at target position

#### Scenario: Position top
- GIVEN position: 'top' and target coordinates
- WHEN Tooltip is rendered
- THEN tooltip appears above the target with arrow pointing down

#### Scenario: Position bottom
- GIVEN position: 'bottom'
- WHEN Tooltip is rendered
- THEN tooltip appears below the target with arrow pointing up

#### Scenario: Position left/right
- GIVEN position: 'left' or 'right'
- WHEN Tooltip is rendered
- THEN tooltip appears to the side with appropriate arrow

#### Scenario: Border style
- GIVEN borderStyle: 'round'
- WHEN Tooltip is rendered
- THEN tooltip has rounded borders

#### Scenario: Background color
- GIVEN backgroundColor: '#333'
- WHEN Tooltip is rendered
- THEN tooltip has dark background

---

## API Specifications

### BigTextOptions
```typescript
interface BigTextOptions {
  text: string
  font?: 'block' | 'slant' | 'small' | 'standard'  // default: 'block'
  color?: string
  gradient?: string[]           // array of colors for gradient effect
  align?: 'left' | 'center' | 'right'  // default: 'left'
}
```

### DigitsOptions
```typescript
interface DigitsOptions {
  value: string | number
  style?: 'block' | 'lcd' | 'dots'  // default: 'lcd'
  color?: string
  showColon?: boolean           // for time display
}
```

### TooltipOptions
```typescript
interface TooltipOptions {
  text: string
  visible: boolean
  position?: 'top' | 'bottom' | 'left' | 'right'  // default: 'top'
  target?: { x: number; y: number }
  borderStyle?: 'none' | 'single' | 'round'  // default: 'single'
  backgroundColor?: string
  textColor?: string
}
```

---

## Built-in Fonts

### Block Font (5 lines tall)
```
██████╗
██╔══██╗
██████╔╝
██╔══██╗
██████╔╝
```

### Small Font (3 lines tall)
```
 ▄▄▄
█   █
█▄▄▄█
```

### LCD Style Digits (5 lines tall)
```
 ███
█   █
 ███
█   █
 ███
```

---

## Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/visual/big-text.ts` | CREATE | BigText component |
| `src/components/visual/digits.ts` | CREATE | Digits component |
| `src/components/visual/tooltip.ts` | CREATE | Tooltip component |
| `src/components/visual/fonts/` | CREATE | Font definitions |
| `src/components/visual/index.ts` | CREATE | Re-exports |
| `tests/components/visual/*.test.ts` | CREATE | Tests for each |
