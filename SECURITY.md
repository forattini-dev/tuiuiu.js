# Security policy

## Supported versions

Security fixes are made on the latest published major version. Tuiuiu requires
Node.js 22.12 or newer; use a currently supported Node.js release in
production.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

Use GitHub's **Security > Report a vulnerability** flow to create a private
security advisory for this repository. Include:

- the affected version and operating system;
- a minimal reproduction;
- the expected and observed behavior;
- the security impact;
- any suggested mitigation.

Please avoid accessing data that is not yours, disrupting public services, or
publishing details before a fix is available. Maintainers should acknowledge a
report within seven days and coordinate disclosure with the reporter.

## Security boundaries

Terminal output is treated as untrusted text. Tuiuiu removes terminal control
protocols from text and only preserves validated SGR styling. APIs that
intentionally emit OSC sequences sanitize their individual fields.

The MCP HTTP and SSE transports bind to `127.0.0.1` by default. Binding to a
non-loopback address requires a bearer token. Browser origins are denied unless
explicitly allowed. Do not expose the server directly to the public internet;
use TLS, an authenticated reverse proxy, and network-level access controls.

Filesystem storage rejects traversal and symlinks and writes through an atomic
temporary file. Applications must still choose a private storage directory and
set appropriate operating-system permissions.

## Release security

The npm release job is designed for npm trusted publishing with GitHub Actions
OIDC. Before enabling releases, configure `forattini-dev/tuiuiu.js` on npm with:

- repository: `forattini-dev/tuiuiu.js`;
- workflow file: `ci.yml`;
- allowed action: `npm publish`.

After a successful OIDC release, revoke the old long-lived `NPM_TOKEN` and
disable token-based publishing in the npm package settings. Protect `v*` tags
and require approval for the release workflow if the repository's risk profile
requires it.
