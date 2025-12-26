# Switch

Boolean toggle component with visual track and thumb.

## Import

```typescript
import { Switch, createSwitch, ToggleGroup } from 'tuiuiu.js'
```

## Basic Usage

```typescript
// Simple switch
Switch({ initialValue: false, onChange: (v) => console.log(v) })

// With labels
Switch({
  initialValue: true,
  showLabels: true,
  onLabel: 'ON',
  offLabel: 'OFF',
})
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialValue` | `boolean` | `false` | Initial state |
| `onLabel` | `string` | `'ON'` | Label when on |
| `offLabel` | `string` | `'OFF'` | Label when off |
| `showLabels` | `boolean` | `false` | Show labels |
| `colorOn` | `ColorValue` | `'success'` | Color when on |
| `colorOff` | `ColorValue` | `'neutral'` | Color when off |
| `background` | `ColorValue` | - | Track background |
| `size` | `'compact' \| 'normal'` | `'normal'` | Size variant |
| `disabled` | `boolean` | `false` | Disable interaction |
| `isActive` | `boolean` | `true` | Handle keyboard input |
| `onChange` | `(value: boolean) => void` | - | Change handler |

## Visual Appearance

```
Normal size:   ◯━━━━ OFF    ━━━━◉ ON
Compact size:  ◯━━ OFF      ━━◉ ON
```

## Programmatic Control

```typescript
const sw = createSwitch({
  initialValue: false,
  onChange: (v) => console.log('Changed to:', v),
})

// Control methods
sw.toggle()          // Toggle state
sw.setOn()           // Set to true
sw.setOff()          // Set to false
sw.setValue(true)    // Set specific value

// Read state
sw.value()           // Get current value

// Use in component
Switch({ state: sw })
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Toggle value |

## ToggleGroup

Group of switches for multi-option selection:

```typescript
ToggleGroup({
  options: [
    { key: 'dark', label: 'Dark Mode' },
    { key: 'notify', label: 'Notifications' },
    { key: 'sound', label: 'Sound' },
  ],
  selected: ['dark', 'notify'],
  onChange: (selected) => console.log(selected),
})
```

### ToggleGroup Props

| Prop | Type | Description |
|------|------|-------------|
| `options` | `ToggleOption[]` | Array of toggle options |
| `selected` | `string[]` | Selected option keys |
| `onChange` | `(selected: string[]) => void` | Selection change handler |
| `direction` | `'vertical' \| 'horizontal'` | Layout direction |
| `gap` | `number` | Gap between toggles |

### ToggleOption

| Field | Type | Description |
|-------|------|-------------|
| `key` | `string` | Unique identifier |
| `label` | `string` | Display label |
| `disabled` | `boolean` | Disable this option |

## Examples

### Settings Panel

```typescript
function SettingsPanel() {
  const darkMode = createSwitch({ initialValue: true })
  const notifications = createSwitch({ initialValue: false })

  return Box({ flexDirection: 'column', gap: 1 },
    Box({ flexDirection: 'row', gap: 2 },
      Text({}, 'Dark Mode'),
      Switch({ state: darkMode })
    ),
    Box({ flexDirection: 'row', gap: 2 },
      Text({}, 'Notifications'),
      Switch({ state: notifications })
    )
  )
}
```

### Feature Flags

```typescript
ToggleGroup({
  options: [
    { key: 'experimental', label: 'Experimental Features' },
    { key: 'beta', label: 'Beta Updates' },
    { key: 'analytics', label: 'Send Analytics' },
  ],
  selected: settings.enabledFlags,
  onChange: (flags) => updateSettings({ enabledFlags: flags }),
  direction: 'vertical',
})
```

### Compact Mode

```typescript
Box({ flexDirection: 'row', gap: 2 },
  Text({ dim: true }, 'Auto-save'),
  Switch({ size: 'compact', initialValue: true })
)
```

## Related

- [Checkbox](/components/forms.md#checkbox) - Checkbox for forms
- [RadioGroup](/components/forms.md#radiogroup) - Single selection
- [Select](/components/forms.md#select) - Dropdown selection
