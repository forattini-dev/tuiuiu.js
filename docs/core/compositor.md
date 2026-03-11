# Compositor

The compositor is the motion layer that runs after layout and before terminal paint.

Use it when you want motion that changes presentation without changing layout:

- slide a panel a few cells
- fade text in or out
- reveal content from one edge
- add shimmer to a stable region
- drive offsets with spring motion

## What it does

The runtime now separates:

- layout geometry
- draw-command assembly
- post-layout visual transforms

That means a component can keep the same layout box while its emitted draw commands are shifted, clipped, dimmed, or highlighted.

## Quality tiers

Motion is tied to the runtime frame budget:

- `full`: all transforms run
- `reduced`: expensive presentation-only work is simplified first
- `skip`: motion snaps to its final state

The tier is driven by recent committed frame cost, and it already respects terminal focus:

- focused terminals keep the normal presentation budget
- unfocused terminals pause or degrade motion work

## Supported transforms

- `slide`: offsets draw commands in `x/y`
- `fade`: approximates opacity for text output
- `shimmer`: applies a moving highlight band
- `spring`: animates offsets with spring physics
- `reveal`: clips visible output from `left`, `right`, `up`, or `down`

## Important constraint

The compositor is presentation-only.

It should not be used to express real layout changes such as:

- changing flex direction
- changing width/height
- moving siblings in normal flow

If the geometry itself changed, let layout do that work.

## Hook entry point

The public API for component authors is [`useCompositor`](/hooks/use-compositor.md).
