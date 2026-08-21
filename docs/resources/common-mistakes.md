# Common mistakes

## Unowned stateful functions

Hooks belong inside a `component()` definition. Pure visual helpers can remain
ordinary functions.

## Index identity for dynamic items

Use stable domain keys for tabs, menu items, selections, completion results,
and reorderable component siblings.

## Parsing keys inside actions

Use `useShortcut()` or command bindings. Reserve `useInteraction()` for editors
and terminal protocols that actually need normalized key text and phases.

## Independent overlay or prompt loops

Use the current app's OverlayHost and PromptHost. A mounted app must have one
terminal input and focus authority.

## Writing directly to stdout

Use `app.writeLine()` while an inline live region is mounted. Direct writes can
split control sequences and invalidate cursor assumptions.
