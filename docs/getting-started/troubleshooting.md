# Troubleshooting

## State resets or moves between siblings

Wrap hook-owning functions with `component()` and give reorderable siblings
stable keys. Do not create state in an unowned helper.

## A shortcut does not fire

Use canonical names (`up`, `enter`, `escape`, `ctrl+s`) and inspect the current
InteractionRuntime for active modes, targets, conflicts, and disabled commands.
An exclusive modal or prompt mode intentionally outranks global actions.

## A modal loses focus or input

Open it through `openModal()` or `getOverlayHost().open()`. Do not mount another
overlay host or terminal input listener.

## Updates are delayed

The renderer coalesces invalidations and caps presentation with `maxFps`. Input
promotes pending work to an urgent flush. Check terminal backpressure and the
performance inspector before increasing the cap.

## Terminal state is damaged

Use `AppHandle.writeLine()` for imperative output above an inline live region.
Always unmount or exit the AppHandle so raw mode, mouse tracking, cursor state,
and the alternate screen are restored.
