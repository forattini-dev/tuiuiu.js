# useTerminalFocus

Reactive hook for the terminal's focus state.

When the terminal supports focus reporting, Tuiuiu enables it automatically and exposes the latest state through this hook.

## Import

```typescript
import { useTerminalFocus } from 'tuiuiu.js';
```

## Basic Usage

```typescript
function FocusIndicator() {
  const { focused } = useTerminalFocus();

  return Text(
    { color: focused ? 'green' : 'yellow' },
    focused ? 'Terminal focused' : 'Terminal unfocused'
  );
}
```

## Return Value

```typescript
interface TerminalFocusState {
  focused: boolean;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `focused` | `boolean` | Current terminal focus state |

## What uses it internally

The runtime already uses terminal focus for:

- pausing `useAnimation()` by default
- pausing the global tick
- pausing `fixedStep` loops unless opted out

This hook is for app-level behavior such as:

- slowing polling
- muting decorative animation
- changing status indicators
- avoiding expensive background work

## Example: reduce background churn

```typescript
function DashboardStatus() {
  const { focused } = useTerminalFocus();

  return Text(
    { dim: !focused },
    focused ? 'Live updates active' : 'Paused while unfocused'
  );
}
```

## Example: combine with useApp

```typescript
function DebugFooter() {
  const app = useApp();
  const { focused } = useTerminalFocus();

  return Text(
    {},
    `focused=${focused} raw=${app.isRawModeEnabled()}`
  );
}
```
