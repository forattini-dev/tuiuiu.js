# Storybook

Tuiuiu includes a built-in **Storybook** system for developing, testing, and documenting components in isolation. It runs directly in your terminal.

## Features

- **Interactive Explorer**: Navigate through components and stories using the keyboard.
- **Playground**: Live-edit component props and see updates in real-time.
- **Split Views**: Compare different variations side-by-side.
- **Documentation**: View component props, types, and usage examples.

## Getting Started

To run the storybook:

```bash
pnpm storybook
```

Or from your script:

```typescript
import { runStorybook } from 'tuiuiu/storybook';

runStorybook();
```

## Creating Stories

Stories are defined using a fluent API. You can register them in a central registry.

```typescript
import { story, createRegistry } from 'tuiuiu/storybook';
import { Button } from './my-components';

const registry = createRegistry();

registry.register(
  story('Button')
    .category('Forms')
    .description('A clickable button component')
    .add('Default', {
      label: 'Click Me',
      color: 'blue'
    })
    .add('Danger', {
      label: 'Delete',
      color: 'red',
      borderStyle: 'double'
    })
    .render((props) => Button(props))
);
```

## Controls & Playground

The Storybook automatically generates controls for your component props based on the initial story values.

- **Strings**: Text input
- **Numbers**: Number input
- **Booleans**: Toggle (y/n)
- **Select**: Dropdown (if options provided)

You can customize controls:

```typescript
story('Button')
  .controls({
    color: { type: 'select', options: ['blue', 'red', 'green'] },
    onClick: { type: 'action' }
  })
```

## Keyboard Shortcuts

### Navigation
| Key | Action |
|:----|:-------|
| `↑` / `↓` | Navigate stories in current category |
| `←` / `→` | Switch between categories |
| `Enter` | Select/execute story |
| `Tab` | Switch focus between panels |
| `Esc` | Go back / Quit |

### Features
| Key | Action |
|:----|:-------|
| `F1` | Toggle search mode |
| `F2` | Cycle through themes |
| `F12` | Toggle console/debug panel |

### Modes
| Key | Action |
|:----|:-------|
| `p` | Toggle Playground mode |
| `d` | Toggle Documentation mode |
| `/` | Quick search |
| `q` | Quit storybook |
