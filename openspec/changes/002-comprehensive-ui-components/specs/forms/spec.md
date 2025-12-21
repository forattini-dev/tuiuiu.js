# Spec: Form Components

## ADDED Requirements

### REQ-FORM-001: MultiSelect Component
The system MUST provide a MultiSelect component for selecting multiple items.

#### Scenario: Select multiple items
- GIVEN a MultiSelect with items: ['A', 'B', 'C']
- WHEN user presses Space on 'A' and 'B'
- THEN both items are selected

#### Scenario: Fuzzy search
- GIVEN fuzzySearch: true
- WHEN user types 'app'
- THEN items containing 'app' are filtered (e.g., 'Apple', 'Application')

#### Scenario: Max selections
- GIVEN maxSelections: 3 with 3 items already selected
- WHEN user tries to select a 4th item
- THEN selection is prevented

#### Scenario: Show chips
- GIVEN showChips: true
- WHEN items are selected
- THEN selected items are displayed as removable chips

#### Scenario: Deselect item
- GIVEN a selected item
- WHEN user presses Space on it again
- THEN the item is deselected

---

### REQ-FORM-002: Autocomplete Component
The system MUST provide an Autocomplete component for text input with suggestions.

#### Scenario: Static suggestions
- GIVEN items: ['Apple', 'Banana', 'Cherry']
- WHEN user types 'a'
- THEN suggestions 'Apple' and 'Banana' are shown

#### Scenario: Async suggestions
- GIVEN items as async function
- WHEN user types and waits for debounce
- THEN async suggestions are fetched and displayed

#### Scenario: Select suggestion
- GIVEN visible suggestions
- WHEN user navigates with arrows and presses Enter
- THEN the suggestion is selected and input is updated

#### Scenario: Mouse click suggestion
- GIVEN visible suggestions
- WHEN user clicks on a suggestion
- THEN the suggestion is selected

#### Scenario: Close on blur
- GIVEN open suggestions dropdown
- WHEN component loses focus
- THEN suggestions dropdown closes

---

### REQ-FORM-003: RadioGroup Component
The system MUST provide a RadioGroup component for single selection.

#### Scenario: Single selection
- GIVEN items: [{value: 'a', label: 'A'}, {value: 'b', label: 'B'}]
- WHEN user selects 'B'
- THEN 'B' is selected and 'A' is deselected

#### Scenario: Horizontal layout
- GIVEN direction: 'horizontal'
- WHEN RadioGroup is rendered
- THEN options are displayed side by side

#### Scenario: Disabled item
- GIVEN an item with disabled: true
- WHEN user tries to select it
- THEN selection is prevented

#### Scenario: Custom indicators
- GIVEN indicators: { selected: '◉', unselected: '○' }
- WHEN RadioGroup is rendered
- THEN custom indicators are displayed

---

### REQ-FORM-004: Switch Component
The system MUST provide a Switch component for boolean toggles.

#### Scenario: Toggle on/off
- GIVEN a Switch with value: false
- WHEN user presses Space
- THEN value becomes true and onChange is called

#### Scenario: Pill style
- GIVEN style: 'pill'
- WHEN Switch is rendered
- THEN it displays as a pill-shaped toggle

#### Scenario: Custom labels
- GIVEN labels: { on: 'Yes', off: 'No' }
- WHEN Switch is rendered
- THEN labels are displayed next to the switch

#### Scenario: Disabled state
- GIVEN disabled: true
- WHEN user tries to toggle
- THEN value remains unchanged

---

### REQ-FORM-005: Slider Component
The system MUST provide a Slider component for numeric value selection.

#### Scenario: Basic slider
- GIVEN min: 0, max: 100, value: 50
- WHEN Slider is rendered
- THEN it displays a track with thumb at 50%

#### Scenario: Keyboard adjustment
- GIVEN a focused Slider
- WHEN user presses right arrow
- THEN value increases by step (default: 1)

#### Scenario: Step increments
- GIVEN step: 10
- WHEN user presses arrow key
- THEN value changes by 10

#### Scenario: Mouse drag
- GIVEN mouse support enabled
- WHEN user clicks and drags on track
- THEN thumb follows mouse position

#### Scenario: Show value
- GIVEN showValue: true
- WHEN Slider is rendered
- THEN current value is displayed

---

## API Specifications

### MultiSelectOptions
```typescript
interface MultiSelectOptions<T = any> {
  items: Array<{
    value: T
    label: string
    disabled?: boolean
  }>
  initialValue?: T[]
  fuzzySearch?: boolean         // default: false
  fuzzyThreshold?: number       // default: 0.3
  maxSelections?: number        // 0 = unlimited
  showSelectedCount?: boolean   // default: true
  showChips?: boolean           // default: false
  placeholder?: string
  onChange?: (values: T[]) => void
  isActive?: boolean
}
```

### AutocompleteOptions
```typescript
interface AutocompleteOptions {
  items: string[] | ((query: string) => string[] | Promise<string[]>)
  initialValue?: string
  placeholder?: string
  maxVisible?: number           // default: 5
  debounce?: number             // default: 300ms for async
  onChange?: (value: string) => void
  onSelect?: (value: string) => void
  isActive?: boolean
}
```

### RadioGroupOptions
```typescript
interface RadioGroupOptions<T = any> {
  items: Array<{
    value: T
    label: string
    disabled?: boolean
  }>
  initialValue?: T
  direction?: 'horizontal' | 'vertical'  // default: 'vertical'
  onChange?: (value: T) => void
  indicators?: {
    selected: string            // default: '●'
    unselected: string          // default: '○'
  }
  isActive?: boolean
}
```

### SwitchOptions
```typescript
interface SwitchOptions {
  value: boolean
  onChange?: (value: boolean) => void
  labels?: {
    on?: string
    off?: string
  }
  style?: 'pill' | 'square' | 'text'  // default: 'pill'
  onColor?: string              // default: theme.colors.success
  offColor?: string             // default: theme.colors.textMuted
  disabled?: boolean
}
```

### SliderOptions
```typescript
interface SliderOptions {
  value: number
  min?: number                  // default: 0
  max?: number                  // default: 100
  step?: number                 // default: 1
  width?: number                // default: 20
  showValue?: boolean           // default: true
  showRange?: boolean           // default: false
  onChange?: (value: number) => void
  isActive?: boolean
}
```

---

## Files to Create

| File | Action | Description |
|------|--------|-------------|
| `src/components/forms/multi-select.ts` | CREATE | MultiSelect component |
| `src/components/forms/autocomplete.ts` | CREATE | Autocomplete component |
| `src/components/forms/radio-group.ts` | CREATE | RadioGroup component |
| `src/components/forms/switch.ts` | CREATE | Switch component |
| `src/components/forms/slider.ts` | CREATE | Slider component |
| `src/components/forms/index.ts` | CREATE | Re-exports |
| `tests/components/forms/*.test.ts` | CREATE | Tests for each |
