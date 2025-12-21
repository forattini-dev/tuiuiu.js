# Context API

Share state between components without prop drilling.

## Overview

The Context API provides a way to pass data through the component tree without having to pass props manually at every level. This is inspired by React's Context API but adapted for Tuiuiu's signal-based system.

## Basic Usage

```typescript
import { createContext, useContext } from 'tuiuiu.js';

// 1. Create a context with a default value
const ThemeContext = createContext<'dark' | 'light'>('dark');

// 2. Provide a value to descendants
function App() {
  return ThemeContext.Provider({ value: 'light' },
    Header(),
    Content(),
    Footer()
  );
}

// 3. Consume the value anywhere in the tree
function Header() {
  const theme = useContext(ThemeContext);
  return Text({ color: theme === 'dark' ? 'white' : 'black' }, 'Header');
}
```

## API Reference

### `createContext<T>(defaultValue: T): Context<T>`

Creates a new Context object.

**Parameters:**
- `defaultValue` - The value used when no Provider exists above in the tree

**Returns:** A Context object with a `Provider` component

```typescript
const UserContext = createContext<User | null>(null);
const CountContext = createContext(0);
const ConfigContext = createContext({ debug: false, maxRetries: 3 });
```

### `useContext<T>(context: Context<T>): T`

Gets the current value from a Context.

**Parameters:**
- `context` - The Context object created by `createContext`

**Returns:** The current context value (from nearest Provider or default)

```typescript
function MyComponent() {
  const user = useContext(UserContext);
  const count = useContext(CountContext);

  if (!user) {
    return Text({}, 'Not logged in');
  }

  return Text({}, `Hello, ${user.name}! Count: ${count}`);
}
```

### `hasContext<T>(context: Context<T>): boolean`

Checks if currently inside a Provider for a context.

```typescript
function MyComponent() {
  if (!hasContext(ThemeContext)) {
    // Use fallback behavior
    return Text({}, 'No theme provided');
  }

  const theme = useContext(ThemeContext);
  // ...
}
```

### `Context.Provider`

The Provider component that sets the context value for its children.

```typescript
ThemeContext.Provider({ value: 'dark' },
  // All children can access 'dark' via useContext(ThemeContext)
  App()
)
```

## Nested Providers

Providers can be nested, with inner values overriding outer ones:

```typescript
const LevelContext = createContext(0);

function App() {
  return LevelContext.Provider({ value: 1 },
    Box({},
      Text({}, `Level: ${useContext(LevelContext)}`), // 1

      LevelContext.Provider({ value: 2 },
        Text({}, `Level: ${useContext(LevelContext)}`), // 2

        LevelContext.Provider({ value: 3 },
          Text({}, `Level: ${useContext(LevelContext)}`) // 3
        )
      )
    )
  );
}
```

## Using with Signals

Context works seamlessly with Tuiuiu's signal system:

```typescript
import { createSignal, createContext, useContext } from 'tuiuiu.js';

// Create a signal for reactive state
const [count, setCount] = createSignal(0);

// Create context to share the signal
const CounterContext = createContext({ count, setCount });

function App() {
  return CounterContext.Provider({ value: { count, setCount } },
    Counter(),
    Display()
  );
}

function Counter() {
  const { setCount } = useContext(CounterContext);

  useInput((input, key) => {
    if (key.upArrow) setCount(c => c + 1);
    if (key.downArrow) setCount(c => c - 1);
  });

  return Text({}, 'Use arrows to change count');
}

function Display() {
  const { count } = useContext(CounterContext);
  return Text({ bold: true }, `Count: ${count()}`);
}
```

## Built-in Contexts

### FocusContext

Tuiuiu provides a built-in `FocusContext` for focus management:

```typescript
import { FocusContext, useFocusContext, useFocusContextRequired } from 'tuiuiu.js';

// Get focus manager (returns null if not in provider)
const fm = useFocusContext();

// Get focus manager (throws if not in provider)
const fm = useFocusContextRequired();

// Check if focus context is available
if (hasFocusContext()) {
  // ...
}
```

## Best Practices

1. **Create contexts at module level** - Don't create contexts inside components
2. **Use meaningful default values** - The default should be a sensible fallback
3. **Consider splitting contexts** - Separate frequently-changing values from stable ones
4. **Type your contexts** - Use TypeScript generics for type safety

```typescript
// Good: Module-level context with typed default
interface AppConfig {
  apiUrl: string;
  debug: boolean;
}

const ConfigContext = createContext<AppConfig>({
  apiUrl: 'https://api.example.com',
  debug: false,
});

// Bad: Creating context inside component
function App() {
  const ctx = createContext(0); // Don't do this!
}
```

## See Also

- [Signals](/core/signals.md) - Reactive state primitives
- [Focus Management](/hooks/use-focus.md) - Focus hooks and FocusContext
