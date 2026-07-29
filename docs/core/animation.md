# Animation & Transitions

Tuiuiu includes a runtime animation system for transitions, spring motion, and tick-driven effects.

The current runtime is also **terminal-focus aware**:

- `useAnimation()` pauses by default when the terminal loses focus
- each app runtime tick pauses while its terminal is unfocused
- `requestAnimationFrame()` backs off when the terminal is blurred
- spring animations stop burning CPU in background terminals

## Overview

| Feature | Description |
|---------|-------------|
| `useAnimation` | Frame-based animation with controls |
| `useTransition` | Show/hide transitions with enter/exit states |
| `createSpring` | Physics-style spring animation |
| `createHarmonicaSpring` | Frequency/damping spring model |
| `createCompositeTransition` | Scene transitions with both contents visible |
| `createSwipeTransition` | Horizontal swipe transition |
| `createSlideTransition` | Vertical slide transition |
| `startTick` / `onTick` | Shared global animation clock |

## useAnimation

```typescript
import { useAnimation } from 'tuiuiu.js';

const anim = useAnimation({
  duration: 500,
  easing: 'ease-out',
  pauseWhenUnfocused: true,
  onFrame: (progress) => {
    setX(Math.floor(progress * 100));
  },
  onComplete: () => {
    console.log('done');
  },
});

anim.start();
anim.pause();
anim.resume();
anim.stop();
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | `number` | required | Duration in milliseconds |
| `easing` | `EasingName \| EasingFunction` | `'linear'` | Easing curve |
| `pauseWhenUnfocused` | `boolean` | `true` | Pause while terminal focus is lost |
| `onFrame` | `(progress: number) => void` | required | Called on every frame |
| `onComplete` | `() => void` | - | Called when animation finishes |
| `onCancel` | `() => void` | - | Called when animation is stopped |

### Focus-aware behavior

By default, losing terminal focus pauses progress and regaining focus resumes from the paused position.

If you want an animation to keep running even in the background:

```typescript
useAnimation({
  duration: 1000,
  pauseWhenUnfocused: false,
  onFrame: setOpacity,
});
```

## useTransition

```typescript
const { state, progress, shouldRender } = useTransition({
  show: visible,
  enter: 'fade',
  exit: 'fade',
  duration: 300,
  easing: 'ease-out',
});
```

States:

- `entering`
- `entered`
- `exiting`
- `exited`

Effects:

- `fade`
- `slide-up`
- `slide-down`
- `slide-left`
- `slide-right`
- `scale`
- `none`

`useTransition()` is built on top of `useAnimation()`, so it inherits the same focus-aware pause behavior.

## Springs

### createSpring

```typescript
import { createSpring } from 'tuiuiu.js';

const spring = createSpring({
  stiffness: 180,
  damping: 12,
  mass: 1,
  threshold: 0.01,
});

spring.start(0, 100, setX);
```

### createHarmonicaSpring

```typescript
import { createHarmonicaSpring } from 'tuiuiu.js';

const spring = createHarmonicaSpring({
  fps: 60,
  frequency: 7,
  damping: 0.75,
});

spring.start(0, 100, setOffset);
```

Both spring implementations now pause while the terminal is unfocused and resume cleanly on focus return.

## Frame Scheduler

`requestAnimationFrame()` is a lightweight shared scheduler for one-shot visual work.

```typescript
import { requestAnimationFrame } from 'tuiuiu.js';

requestAnimationFrame(() => {
  redrawSomething();
});
```

Runtime behavior:

- focused terminal: schedules around `16ms`
- unfocused terminal: backs off more aggressively instead of trying to hit full visual cadence

## Global Tick

Use the shared tick for low-cost repeated animations such as spinners, shimmer states, or dashboards.

```typescript
import { startTick, getTick, onTick } from 'tuiuiu.js';

startTick(100);

const stop = onTick((tick) => {
  console.log('tick', tick);
});
```

Relevant APIs:

- `startTick(rate?)`
- `stopTick()`
- `pauseTick()`
- `resumeTick()`
- `getTick()`
- `onTick()`

The tick now pauses when terminal focus is lost and resumes on focus regain. It does not try to replay background time on restore.

## When to Use What

- `useAnimation()` for component-local time-based motion
- `useTransition()` for enter/exit visibility
- `createSpring()` / `createHarmonicaSpring()` for natural motion
- `startTick()` / `onTick()` for shared repeated animation phases
- `requestAnimationFrame()` for one-off deferred visual work

## Related APIs

- `useAnimation()`
- `useTransition()`
- `createSpring()`
- `createHarmonicaSpring()`
- `requestAnimationFrame()`
- `startTick()`
- `useTerminalFocus()`
