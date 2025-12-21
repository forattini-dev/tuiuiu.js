# Design System

Tuiuiu's **Design System** is a unified collection of UI components, utilities, and patterns designed to build consistent and beautiful terminal interfaces.

## Structure

The design system is organized into several categories:

- **Core**: Underlying rendering engine and text measurement.
- **Primitives**: Basic building blocks like `Box`, `Text`, and `Spacer`.
- **Forms**: Input components like `TextInput`, `Select`, `Checkbox`.
- **Data Display**: Tables, lists, and code blocks.
- **Feedback**: Loading indicators, progress bars, toasts, and modals.
- **Visual**: Decorative elements like `BigText` and `Clock`.
- **Media**: Image and pixel rendering utilities.
- **Layout**: High-level layout patterns like `SplitPanel` and `Tabs`.

## Key Features

### Consistency
All components share a common styling API based on the layout engine and theme system.

### Composable
Components are designed to be composed together. For example, a `Modal` can contain a `Form` which contains `TextInput` fields.

### Accessible
The design system prioritizes accessibility where possible in a terminal environment (e.g., keyboard navigation, high contrast modes).

## Importing

You can import components directly from the main package or from specific categories if supported by your bundler/setup.

```typescript
// Recommended
import { Box, Text, Button } from 'tuiuiu';

// Alternative (if deep imports are needed)
import { Box } from 'tuiuiu/design-system/primitives';
```