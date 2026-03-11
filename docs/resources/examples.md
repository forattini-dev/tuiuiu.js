# Examples

Examples are now organized by intent and difficulty so the first contact with the library does not start on the most advanced patterns.

## Running Examples

Use the curated runner:

```bash
pnpm example:list
pnpm example app-counter
pnpm example app-layout
pnpm example app-forms
pnpm example app-dashboard
```

## Recommended Path

| Example | Difficulty | Why start here |
|---------|------------|----------------|
| `app-counter` | Easy | Smallest loop with `useState()` and keyboard input |
| `app-layout` | Easy | Layout primitives like `Screen`, `Header`, `Main`, `Footer` |
| `cli-wizard` | Easy | Prompt-oriented flow with low UI complexity |
| `app-chat` | Medium | Real app composition and scrolling |
| `app-forms` | Advanced | Canonical interactive inputs with `useTextInputState()` / `useSelectState()` |
| `app-dashboard` | Advanced | Heavy composition, metrics, and animation-like updates |

## Showcase Examples

These are good for inspiration, not as a first implementation reference.

| Example | Difficulty | Focus |
|---------|------------|-------|
| `app-htop` | Advanced | System monitor layout |
| `app-ping` | Advanced | Network visualization |
| `app-mtr` | Advanced | Traceroute-style diagnostics |
| `whatsapp-clone` | Advanced | Large messaging UI |
| `tuiuiu-brush` | Advanced | Interactive drawing |
| `tuiuiu-player` | Advanced | Media-player style interface |
| `tuiuiu-invaders` | Advanced | Literal Space Invaders clone |
| [`tuiuiu-meteor`](/resources/examples/tuiuiu-meteor.md) | Advanced | Asteroids-style meteor splitter |
| [`tuiuiu-sideblaster`](/resources/examples/tuiuiu-sideblaster.md) | Advanced | Horizontal shoot'em up showcase |

## Arcade Showcase Notes

These examples are intentionally heavier than the onboarding apps. They exist to show how far the library can be pushed with `Canvas`, animation loops, overlays, telemetry panels, and testable game-state helpers.

### `tuiuiu-meteor`

Run it with:

```bash
pnpm example tuiuiu-meteor
```

- Genre: Asteroids-style arena shooter
- Controls: `Left` / `Right` rotate, `Up` thrust, `Down` brake, `Space` fire, `P` pause, `F1` help
- What it demonstrates: wrap-around movement, fragmenting meteors, responsive HUD, modal overlays, FPS in the header, and exported pure simulation helpers for tests
- Full docs: [/resources/examples/tuiuiu-meteor.md](/resources/examples/tuiuiu-meteor.md)

### `tuiuiu-sideblaster`

Run it with:

```bash
pnpm example tuiuiu-sideblaster
```

- Genre: Horizontal shoot'em up
- Controls: `Arrows` / `WASD` move, `Space` fire, `P` pause, `F1` help
- What it demonstrates: side-scrolling combat lanes, larger ship sprites, long forward lasers, enemy wave spawning, pressure tracking, FPS in the header, and exported gameplay helpers for tests
- Full docs: [/resources/examples/tuiuiu-sideblaster.md](/resources/examples/tuiuiu-sideblaster.md)

## Programmatic Examples

These show lower-level control flows and are better after you understand the canonical component path.

| Example | Difficulty | Focus |
|---------|------------|-------|
| `programmatic-state-management` | Medium | External state changes |
| `programmatic-scroll-control` | Medium | Scroll control APIs |
| `programmatic-external-triggers` | Medium | Out-of-band updates |
| `programmatic-runtime-contracts` | Medium | Committed-frame queries, scroll-by-ID, and inspector usage |

## Canonical Input Pattern

For interactive inputs, prefer the rerender-safe hook path:

```typescript
import {
  Box,
  Text,
  TextInput,
  Select,
  useState,
  useTextInputState,
  useSelectState,
} from 'tuiuiu.js';

function ExampleForm() {
  const [step, setStep] = useState(0);
  const roleOptions = [
    { value: 'dev', label: 'Developer' },
    { value: 'design', label: 'Designer' },
  ];
  const name = useTextInputState({
    placeholder: 'Name',
    isActive: () => step() === 0,
    onSubmit: () => setStep(1),
  });
  const role = useSelectState({
    items: roleOptions,
    isActive: () => step() === 1,
  });

  return Box(
    { flexDirection: 'column', gap: 1 },
    Text({}, 'Profile'),
    TextInput({ state: name, borderStyle: 'round', fullWidth: true }),
    Select({ state: role, items: roleOptions, borderStyle: 'round', showCount: false })
  );
}
```

Use `createTextInput()` / `renderTextInput()` and `createSelect()` / `renderSelect()` when you explicitly want programmatic control outside the normal component lifecycle.
