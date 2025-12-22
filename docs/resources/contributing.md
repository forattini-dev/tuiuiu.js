# Contributing

We welcome contributions to Tuiuiu!

## Setup

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/tetis-io/tuiuiu.git
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
