# Feedback Components

Components that provide status updates and feedback to the user.

## ProgressBar

Visual indicator of progress.

### Features
- Multiple styles (block, line, braille)
- Percentage and ETA display
- Indeterminate mode (for unknown duration)

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `value` | `number` | Current value |
| `max` | `number` | Max value (default 100) |
| `style` | `'block' \| 'braille' ...` | Visual style |
| `width` | `number` | Width in chars |
| `color` | `string` | Bar color |

### Example

```typescript
ProgressBar({
  value: 45,
  max: 100,
  style: 'block',
  color: 'green'
})
```

## Spinner

Animated loading indicator.

### Features
- Many animation types (dots, line, bounce, etc.)
- Status text
- Timer and token counters

### Example

```typescript
Spinner({
  style: 'dots',
  text: 'Loading resources...',
  color: 'yellow'
})
```

## Badge

Small status label with background color.

### Example

```typescript
Badge({
  label: 'ONLINE',
  color: 'green',
  inverse: true // Filled background
})
```

## Modal

A centered dialog window that overlays content.

### Props

| Prop | Type | Description |
| :--- | :--- | :--- |
| `title` | `string` | Window title |
| `content` | `VNode` | Body content |
| `size` | `'small' \| 'medium' \| 'large'` | Dialog size |

### Example

```typescript
Modal({
  title: 'Error',
  content: Text({ color: 'red' }, 'Connection failed!'),
  size: 'small'
})
```

## Toast

Transient notification message, usually appearing at the bottom of the screen.

### Example

```typescript
Toast({
  message: 'Saved successfully',
  type: 'success',
  position: 'bottom'
})
```

## AlertBox

A boxed message for highlighting important information.

### Example

```typescript
AlertBox({
  title: 'Tip',
  message: 'You can press Ctrl+C to exit.',
  type: 'info'
})
```
