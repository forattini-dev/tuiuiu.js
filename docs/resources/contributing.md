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
