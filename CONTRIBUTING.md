# Contributing

Thanks for improving Tuiuiu.

## Development setup

Use Node.js 22.12 or newer and pnpm 11.9.0:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm build
pnpm test:run
pnpm verify:contracts
```

`pnpm test:run` is the deterministic functional suite. Performance tests are
kept separate because they are sensitive to machine load:

```bash
pnpm test:performance
```

## Pull requests

Keep changes focused and include regression tests for bug fixes. Document
public API changes and update examples that use the affected API. New unstable
components should be exported from `tuiuiu.js/experimental` until their
behavior, accessibility, and lifecycle contracts are tested.

The framework owns terminal raw mode, paste mode, cursor visibility, signal
handlers, and process listeners only while an app is mounted. Changes in those
areas must test setup, cleanup, repeated cleanup, errors, and fragmented input.
Text editing and layout changes must cover combining marks, emoji ZWJ
sequences, and full-width characters.

Use Conventional Commit-style prefixes where practical (`feat:`, `fix:`,
`docs:`, `test:`, `refactor:`, `chore:`). Do not include generated `dist/`
output in pull requests.

## Security

Report suspected vulnerabilities privately as described in
[SECURITY.md](SECURITY.md). Do not put exploit details in a public issue.
