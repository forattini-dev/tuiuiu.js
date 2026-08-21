# ADR 0007: One interaction runtime

- Status: accepted
- Date: 2026-08-21

## Context

Independent input handlers, hotkey scopes, keybinding contexts, focus
navigation, and command palettes resolved the same terminal events. Stack-shaped
push/pop cleanup also made nested or out-of-order teardown unsafe.

## Decision

`InteractionRuntime` is the only application event-to-command authority.
Commands name semantic intent; bindings map normalized key sequences to those
commands. Token-owned modes and targets define precedence, and exact disposable
registrations own cleanup.

`useCommand`, `useCommandBinding`, and `useShortcut` are the component-facing
APIs. `useInteraction` is the normalized low-level escape hatch for editors and
terminal protocols. Built-in controls may adapt terminal byte input at the app
boundary, but no second public input registry exists.

The runtime also owns programmatic execution, command discovery, conflict
inspection, and subscriptions. Command-palette presentation reads this registry
and executes through it.

## Consequences

The application has one deterministic dispatch order. Modal, prompt,
autocomplete, focus, and collection navigation express precedence with modes
and targets. Disabled commands do not reserve key-sequence prefixes. Cleanup is
identity-based and safe out of order.
