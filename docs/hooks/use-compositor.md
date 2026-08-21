# useCompositor

Hook for post-layout motion.

It binds compositor metadata to a component and exposes helpers for visual transforms that should not trigger relayout.

## Import

```typescript
import { useCompositor } from 'tuiuiu.js';
```

## Basic Usage

```typescript
function AnimatedPanel() {
  const compositor = useCompositor();

  useShortcut('right', () => compositor.slide({ toX: 4, duration: 160 }));
  useShortcut('left', () => compositor.slide({ toX: 0, duration: 160 }));

  return Box(
    compositor.bind({ width: 20, borderStyle: 'single', padding: 1 }),
    Text({}, 'Slides without relayout'),
  );
}
```

## API

```typescript
interface UseCompositorResult {
  bind<P>(props: P): P & { __compositor: CompositorBindingMetadata };
  slide(options?): () => void;
  fade(options?): () => void;
  shimmer(options?): () => void;
  spring(options?): () => void;
  reveal(options): () => void;
  clear(): void;
}
```

## Methods

### `bind(props)`

Attach the compositor to a renderable node.

Use it on the component whose emitted draw commands should be transformed.

### `slide(options)`

Animate presentation offsets in terminal cells.

```typescript
compositor.slide({ toX: 4, toY: 1, duration: 180 });
```

### `fade(options)`

Animate text opacity approximation.

```typescript
compositor.fade({ from: 0, to: 1, duration: 120 });
```

### `shimmer(options)`

Animate a moving highlight band. Good for loading placeholders and subtle emphasis.

```typescript
const stop = compositor.shimmer({ span: 0.3, duration: 500 });
```

Call the returned cancel function to stop the shimmer.

### `spring(options)`

Animate offsets with spring physics.

```typescript
compositor.spring({ fromX: 0, toX: 6, stiffness: 180, damping: 18 });
```

### `reveal(options)`

Animate clipping from a direction.

```typescript
compositor.reveal({ direction: 'left', from: 0, to: 1, duration: 200 });
```

### `clear()`

Remove all active transforms from this component.

## Cleanup

Each transform helper returns a cancel function.

```typescript
const stop = compositor.fade({ from: 1, to: 0, duration: 120 });
stop();
```

Transforms are also cleaned up automatically when the component unmounts.

## Notes

- The compositor is presentation-only; it does not change layout bounds.
- Motion quality can degrade automatically when frame budgets are exceeded.
- Expensive presentation-only transforms are reduced first when the runtime needs to protect frame pacing.
