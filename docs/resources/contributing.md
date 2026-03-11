# Contributing

We welcome contributions to Tuiuiu!

## Setup

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/forattini-dev/tuiuiu.js.git
    cd tuiuiu
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Run tests**:
    ```bash
    pnpm test
    ```

## Development

- **Build**: `pnpm build`
- **Docs**: `pnpm docs` (runs local server)
- **Format**: `pnpm format`

## Guidelines

- **Zero Dependencies**: We aim to keep the core library dependency-free.
- **Signals**: Use signals for all reactive state.
- **Tests**: Add tests for new components or logic.
- **Types**: Everything must be strictly typed with TypeScript.

### Stateful Interactive Components

If a component creates user-interaction state with `createSignal()` and can be rendered directly, do not recreate that controller on every render.

Use this pattern:

1. Keep `createX()` as the advanced/programmatic factory.
2. Add `state?` to the component props when direct component usage should support external control.
3. Add `updateOptions()` on the controller when callbacks or mutable behavior options need to change across rerenders.
4. Use the shared factory-state helper for the direct component path so parent rerenders preserve controller state.
5. Expose `useXState()` publicly only when the component has substantial editing, search, selection, tree, or pagination state.

Minimal shape:

```typescript
export function createThing(options: ThingOptions): ThingState {
  let runtimeOptions = options;

  return {
    updateOptions(nextOptions) {
      runtimeOptions = nextOptions;
    },
  };
}

export function Thing(props: ThingProps): VNode {
  const state = useFactoryState(props.state, props, createThing);
  return renderThing(state, props);
}
```

### Interactive Regression Checklist

For migrated interactive components, add tests that cover:

1. Direct component usage preserving user state across parent rerenders.
2. Stable controller reuse for `useXState()` when the component exposes one.
3. Updated callbacks or mutable options being applied without recreating controller state.

If the change touches public interactive behavior, run:

```bash
pnpm validate:devx-contracts
```

Reference matrix:

- [DEVX Contract Coverage](/resources/devx-contracts.md)

### Engine Runtime Contract Changes

If the change touches frame assembly, render-loop lifecycle, explicit-ID queries, or inspector data, run:

```bash
pnpm validate:runtime-contracts
```

Reference matrix:

- [Engine Runtime Contract Coverage](/resources/engine-runtime-contracts.md)

### Testing Input Components

When writing unit tests for input components (like `TextInput` or `Select`), keep in mind:

1.  **Component Rendering**: If you render the component using `render(...)`, input handling is set up automatically.
2.  **State Factories**: If you act on the state factory directly (e.g., `createTextInput()`) without rendering, you must **manually register the input handler** to simulate key presses.

    ```typescript
    import { addInputHandler } from 'tuiuiu/hooks/context'; // or internal path
    
    // Helper for tests
    function createTestInput(options) {
      const input = createTextInput(options);
      addInputHandler(input.handleInput); // Bind handler!
      return input;
    }
    ```
