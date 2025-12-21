# Components Overview

Tuiuiu provides a rich set of pre-built components to help you build terminal applications quickly. These components are designed to be composable and easy to style.

## Core Components

These are the building blocks of any Tuiuiu application.

- **[Layout](components/layout.md)**: `Box`, `Spacer`, `SplitPanel`, `ThreePanel`, `Slot`
- **[Typography](components/typography.md)**: `Text`, `Markdown`, `CodeBlock`, `InlineCode`
- **[Forms](components/forms.md)**: `TextInput`, `Select`, `Checkbox`, `ConfirmDialog`
- **[Data Display](components/data-display.md)**: `Table`, `SimpleTable`, `KeyValueTable`
- **[Feedback](components/feedback.md)**: `ProgressBar`, `Spinner`, `Badge`, `Modal`, `Toast`, `AlertBox`

## Usage

All components are exported as functions that return Virtual Nodes (VNodes).

```typescript
import { Box, Text, Button } from 'tuiuiu';

function App() {
  return Box({ flexDirection: 'column' },
    Text({ color: 'green' }, 'Welcome'),
    Button({ label: 'Click Me', onClick: () => {} })
  );
}
```

## Styling

Most components accept a `style` prop or direct style properties (like `color`, `backgroundColor`, `padding`, etc.) which map directly to the underlying renderer options.

See [Theming](../core/theming.md) for more details on how to apply consistent styles across your app.
