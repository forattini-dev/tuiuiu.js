# Collapsible Components

> **Expandable sections with full keyboard support.** Tuiuiu provides multiple APIs for collapsible content - from simple toggles to complex accordions with programmatic control.

## Overview

| Component | Use Case | Key Feature |
|:----------|:---------|:------------|
| `Collapsible` | Single section | Simple toggle with state |
| `Accordion` | Multiple sections | Single/multi open, focus navigation |
| `Details` | HTML-like | Minimal API like `<details>` |
| `ExpandableText` | Long text | Show more/less with line limit |
| `createCollapsible` | Control | Programmatic state management |
| `createAccordion` | Control | Programmatic accordion control |

## Collapsible

Simple expandable section with keyboard support.

```typescript
import { Collapsible } from 'tuiuiu.js'

Collapsible({
  title: 'Advanced Options',
  children: Box({},
    Text({}, 'Option 1: ...'),
    Text({}, 'Option 2: ...'),
  ),
})
```

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `title` | `string` | required | Section title |
| `children` | `VNode \| VNode[]` | required | Content when expanded |
| `initialExpanded` | `boolean` | `false` | Start expanded |
| `collapsedIcon` | `string` | `▶` | Icon when collapsed |
| `expandedIcon` | `string` | `▼` | Icon when expanded |
| `titleColor` | `ColorValue` | `'white'` | Title text color |
| `indent` | `number` | `2` | Content indentation |
| `disabled` | `boolean` | `false` | Disable interaction |
| `onToggle` | `(expanded: boolean) => void` | - | Toggle callback |
| `isActive` | `boolean` | `true` | Enable keyboard handling |
| `state` | `CollapsibleState` | - | External state for control |

### Keyboard

| Key | Action |
|:----|:-------|
| `Space` / `Enter` | Toggle |
| `←` / `h` | Collapse |
| `→` / `l` | Expand |

### With Custom Icons

```typescript
Collapsible({
  title: 'Files',
  collapsedIcon: '📁',
  expandedIcon: '📂',
  children: FileList(),
})
```

### With Programmatic Control

```typescript
import { Collapsible, createCollapsible } from 'tuiuiu.js'

function SettingsPanel() {
  const state = createCollapsible({ initialExpanded: true })

  // Programmatic control
  const toggleFromButton = () => state.toggle()
  const openSection = () => state.expand()
  const closeSection = () => state.collapse()

  return Box({ flexDirection: 'column' },
    Button({ label: 'Toggle', onPress: toggleFromButton }),
    Collapsible({
      state,
      title: 'Settings',
      children: SettingsContent(),
    }),
  )
}
```

## Accordion

Multiple collapsible sections with focus navigation.

```typescript
import { Accordion } from 'tuiuiu.js'

Accordion({
  sections: [
    { key: 'general', title: 'General', content: GeneralSettings() },
    { key: 'appearance', title: 'Appearance', content: AppearanceSettings() },
    { key: 'advanced', title: 'Advanced', content: AdvancedSettings() },
  ],
})
```

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `sections` | `AccordionSection[]` | required | Sections to display |
| `initialExpanded` | `string` | - | Initially expanded key |
| `multiple` | `boolean` | `false` | Allow multiple sections open |
| `gap` | `number` | `0` | Gap between sections |
| `titleColor` | `ColorValue` | `'white'` | Title color |
| `activeColor` | `ColorValue` | `'cyan'` | Focused section color |
| `onChange` | `(expanded: string[]) => void` | - | Change callback |
| `isActive` | `boolean` | `true` | Enable keyboard handling |
| `state` | `AccordionState` | - | External state for control |

### AccordionSection

```typescript
interface AccordionSection {
  key: string           // Unique identifier
  title: string         // Section title
  content: VNode | (() => VNode)  // Content (lazy or eager)
  icon?: string         // Custom icon
  disabled?: boolean    // Disable this section
}
```

### Keyboard

| Key | Action |
|:----|:-------|
| `↑` / `k` | Move to previous section |
| `↓` / `j` | Move to next section |
| `Space` / `Enter` | Toggle focused section |
| `e` | Expand all (when `multiple: true`) |
| `c` | Collapse all |

### Multiple Open Sections

```typescript
Accordion({
  sections: [...],
  multiple: true,  // Allow multiple open
  initialExpanded: 'general',
})
```

### With Custom Hotkeys

Use `createAccordion` for programmatic control and custom hotkeys:

```typescript
import { Accordion, createAccordion } from 'tuiuiu.js'
import { useHotkeys } from 'tuiuiu.js'

function SettingsApp() {
  const sections = [
    { key: 'general', title: '1. General', content: GeneralSettings() },
    { key: 'network', title: '2. Network', content: NetworkSettings() },
    { key: 'security', title: '3. Security', content: SecuritySettings() },
  ]

  const accordion = createAccordion({ sections, multiple: true })

  // Custom hotkeys for quick access
  useHotkeys('1', () => accordion.toggle('general'), { description: 'Toggle General' })
  useHotkeys('2', () => accordion.toggle('network'), { description: 'Toggle Network' })
  useHotkeys('3', () => accordion.toggle('security'), { description: 'Toggle Security' })
  useHotkeys('ctrl+e', () => accordion.expandAll(), { description: 'Expand all' })
  useHotkeys('ctrl+w', () => accordion.collapseAll(), { description: 'Collapse all' })

  return Accordion({ state: accordion, sections })
}
```

### AccordionState Methods

| Method | Description |
|:-------|:------------|
| `expanded()` | Get Set of expanded keys |
| `focusIndex()` | Get focused section index |
| `toggle(key)` | Toggle specific section |
| `expand(key)` | Expand specific section |
| `collapse(key)` | Collapse specific section |
| `expandAll()` | Expand all (when multiple) |
| `collapseAll()` | Collapse all sections |
| `movePrev()` | Focus previous section |
| `moveNext()` | Focus next section |
| `toggleFocused()` | Toggle currently focused |

## Details

Simple expandable section like HTML `<details>` element.

```typescript
import { Details } from 'tuiuiu.js'

Details({
  summary: 'Click for more info',
  children: Text({}, 'Additional information here...'),
})

// With initial open state
Details({
  summary: 'Error Details',
  open: true,
  children: Text({ color: 'red' }, errorStack),
})
```

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `summary` | `string` | required | Always visible text |
| `children` | `VNode \| VNode[]` | required | Hidden content |
| `open` | `boolean` | `false` | Initial open state |
| `icon` | `string` | - | Custom icon |

## ExpandableText

Long text with show more/less toggle.

```typescript
import { ExpandableText } from 'tuiuiu.js'

ExpandableText({
  text: veryLongDescription,
  maxLines: 3,
})

// With custom labels
ExpandableText({
  text: articleContent,
  maxLines: 5,
  showMoreLabel: 'Read full article...',
  showLessLabel: 'Show less',
  color: 'gray',
})
```

### Props

| Prop | Type | Default | Description |
|:-----|:-----|:--------|:------------|
| `text` | `string` | required | Full text content |
| `maxLines` | `number` | `3` | Lines shown when collapsed |
| `showMoreLabel` | `string` | `'Show more'` | Expand button text |
| `showLessLabel` | `string` | `'Show less'` | Collapse button text |
| `color` | `ColorValue` | `'white'` | Text color |

## Examples

### FAQ Section

```typescript
function FAQ() {
  const faqs = [
    { key: 'q1', title: 'How do I install?', content: Text({}, 'Run: pnpm add tuiuiu.js') },
    { key: 'q2', title: 'Is it zero-dependency?', content: Text({}, 'Yes! No external deps.') },
    { key: 'q3', title: 'Does it support themes?', content: Text({}, '8+ built-in themes.') },
  ]

  return Box({ flexDirection: 'column' },
    Text({ bold: true, marginBottom: 1 }, 'Frequently Asked Questions'),
    Accordion({ sections: faqs, gap: 1 }),
  )
}
```

### Settings Panel

```typescript
function Settings() {
  const accordion = createAccordion({
    sections: settingsSections,
    multiple: true,
    initialExpanded: 'general',
  })

  // Save expanded state
  useEffect(() => {
    const expanded = accordion.expanded()
    savePreference('expandedSettings', [...expanded])
  })

  return Accordion({ state: accordion, sections: settingsSections })
}
```

### Nested Collapsibles

```typescript
Collapsible({
  title: 'Category A',
  children: Box({ flexDirection: 'column' },
    Collapsible({
      title: 'Subcategory A.1',
      indent: 4,
      children: Text({}, 'Content A.1'),
    }),
    Collapsible({
      title: 'Subcategory A.2',
      indent: 4,
      children: Text({}, 'Content A.2'),
    }),
  ),
})
```

## Related

- [Tabs](/components/layout.md#tabs) — For switching between views (not collapsing)
- [Modal](/components/overlays.md) — For overlay content
- [Scroll](/components/scroll.md) — For scrollable collapsed content
