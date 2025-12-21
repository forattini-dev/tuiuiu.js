# Theming

Tuiuiu includes a robust theming system powered by **Signals**, allowing for instant, reactive theme switching without reloading the application.

## Usage

### `useTheme`

Access current theme values in your components.

```typescript
import { useTheme } from 'tuiuiu.js';

function MyComponent() {
  const theme = useTheme();

  return Box({ borderStyle: 'single', borderColor: theme.colors.primary },
    Text({ color: theme.colors.text }, 'Hello World')
  );
}
```

### `setTheme`

Switch themes dynamically.

```typescript
import { setTheme, themes } from 'tuiuiu.js';

// Switch to light theme
setTheme(themes.light);

// Switch to dark theme
setTheme(themes.dark);
```

## Built-in Themes

Tuiuiu comes with several preset themes:

- `themes.dark`: Default dark mode (slate/blue).
- `themes.light`: Light mode (white/blue).
- `themes.highContrastDark`: High contrast for accessibility.
- `themes.monochrome`: Grayscale only.

## Creating Custom Themes

You can extend an existing theme or create a new one from scratch.

```typescript
import { createTheme, themes, setTheme } from 'tuiuiu.js';

const draculaTheme = createTheme(themes.dark, {
  name: 'dracula',
  colors: {
    background: '#282a36',
    surface: '#44475a',
    text: '#f8f8f2',
    primary: '#bd93f9', // Purple
    secondary: '#ff79c6', // Pink
    success: '#50fa7b',
    error: '#ff5555',
    warning: '#f1fa8c',
  }
});

setTheme(draculaTheme);
```

## Theme Properties

Each theme defines:

- **Colors**: `primary`, `secondary`, `background`, `surface`, `text`, `border`, etc.
- **Spacing**: `xs` (1), `sm` (2), `md` (4), `lg` (8), `xl` (16).
- **Border Radius**: `none`, `sm`, `md`, `lg` (affects which border characters are used).

## System Preference

You can automatically detect and use the system's preferred color scheme (where supported by the terminal).

```typescript
import { useSystemTheme } from 'tuiuiu.js';

useSystemTheme();
```
