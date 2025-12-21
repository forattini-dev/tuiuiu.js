# Animation & Transitions

Tuiuiu includes a robust animation system for creating smooth transitions, scene changes, and effects in the terminal.

## Overview

The animation system provides:

| Feature | Description |
|---------|-------------|
| `useAnimation` | Frame-based animation with controls (start, stop, pause, resume) |
| `useTransition` | Show/hide animations with enter/exit states |
| `createSpring` | Physics-based spring animations |
| `createHarmonicaSpring` | Intuitive frequency/damping spring model |
| `createCompositeTransition` | Scene transitions with both contents visible |
| `createSwipeTransition` | Horizontal swipe (left/right) |
| `createSlideTransition` | Vertical slide (up/down) |

---

## useAnimation

The core animation primitive. Runs a frame-based animation at ~60fps.

```typescript
import { useAnimation } from 'tuiuiu';

const anim = useAnimation({
  duration: 500,        // milliseconds
  easing: 'ease-out',   // easing function
  onFrame: (progress) => {
    // progress: 0 → 1
    setX(Math.floor(progress * 100));
  },
  onComplete: () => {
    console.log('Animation done!');
  },
  onCancel: () => {
    console.log('Animation cancelled');
  }
});

// Controls
anim.start();           // Start animation
anim.stop();            // Stop/cancel
anim.pause();           // Pause at current progress
anim.resume();          // Resume from paused state

// State queries
anim.isRunning();       // boolean
anim.progress();        // current progress (0-1)
```

### Easing Functions

| Name | Description |
|------|-------------|
| `linear` | Constant speed |
| `ease-in` | Start slow, end fast |
| `ease-out` | Start fast, end slow |
| `ease-in-out` | Slow at both ends |
| `bounce` | Bouncy ending |
| `elastic` | Springy overshoot |

You can also pass a custom function:

```typescript
useAnimation({
  duration: 300,
  easing: (t) => t * t * t,  // cubic ease-in
  onFrame: (p) => setValue(p)
});
```

---

## useTransition

Manages enter/exit animations for showing and hiding components.

```typescript
import { useTransition, Box, Text, When } from 'tuiuiu';

function Modal({ visible }) {
  const { state, progress, shouldRender } = useTransition({
    show: visible,
    enter: 'fade',      // effect when showing
    exit: 'fade',       // effect when hiding
    duration: 300,
    easing: 'ease-out',
    onEnterComplete: () => console.log('Modal visible'),
    onExitComplete: () => console.log('Modal hidden')
  });

  // Don't render if fully exited
  if (!shouldRender()) return null;

  return Box(
    { opacity: progress() },
    Text({}, `State: ${state()}`)
  );
}
```

### Transition State

The `state()` signal returns one of:

| State | Description |
|-------|-------------|
| `entering` | Enter animation in progress |
| `entered` | Fully visible, animation complete |
| `exiting` | Exit animation in progress |
| `exited` | Fully hidden, not rendered |

### Transition Effects

| Effect | Description |
|--------|-------------|
| `fade` | Opacity transition |
| `slide-up` | Slide from bottom |
| `slide-down` | Slide from top |
| `slide-left` | Slide from right |
| `slide-right` | Slide from left |
| `scale` | Scale from center |
| `none` | Instant (no animation) |

---

## Spring Physics

For natural, physics-based motion instead of duration-based easing.

### createSpring

Traditional stiffness/damping/mass model:

```typescript
import { createSpring } from 'tuiuiu';

const spring = createSpring({
  stiffness: 180,   // Higher = faster oscillation
  damping: 12,      // Higher = less bouncy
  mass: 1,          // Higher = more inertia
  threshold: 0.01   // Velocity threshold to stop
});

spring.start(
  0,                        // from value
  100,                      // to value
  (value) => setX(value),   // on each frame
  () => console.log('done') // on complete
);

spring.stop();              // Cancel animation
spring.setTarget(150);      // Change target mid-animation
```

### createHarmonicaSpring

More intuitive frequency/damping model (inspired by Charm's Harmonica):

```typescript
import { createHarmonicaSpring } from 'tuiuiu';

const spring = createHarmonicaSpring({
  fps: 60,          // Target frame rate
  frequency: 7.0,   // Higher = snappier (7-15 for UI)
  damping: 0.75     // 0=bouncy, 1=critical, >1=overdamped
});

spring.start(0, 100, (value) => setOffset(value));

// Extra control
spring.impulse(50);  // Add velocity impulse
spring.setTarget(200);
```

**Frequency/Damping Guidelines:**

| Use Case | Frequency | Damping |
|----------|-----------|---------|
| Subtle UI | 7 | 0.75 |
| Snappy buttons | 10 | 0.85 |
| Bouncy elements | 8 | 0.5 |
| Smooth scroll | 5 | 0.9 |

---

## Scene Transitions (Composite)

For wizard-style navigation where **both previous and next content are visible** during the transition.

### createCompositeTransition

The base primitive for composite transitions:

```typescript
import { createCompositeTransition } from 'tuiuiu';

const transition = createCompositeTransition({
  duration: 300,
  useSpring: true,  // Use spring physics (default)
  springOptions: { frequency: 7, damping: 0.75 },
  easing: 'ease-out',  // Only used if useSpring=false
  onFrame: (state) => {
    const { progress, direction, prevContent, nextContent } = state;
    // Render composite frame
  },
  onComplete: () => console.log('Transition done')
});

// Start transition
transition.start(
  'Previous content',  // What's currently visible
  'Next content',      // What we're transitioning to
  'left'               // Direction: 'left' | 'right' | 'up' | 'down'
);

transition.stop();     // Cancel
transition.reverse();  // Go back
transition.getState(); // Get current state
```

### createSwipeTransition

Pre-built horizontal swipe (like mobile apps):

```typescript
import { createSwipeTransition } from 'tuiuiu';

const swipe = createSwipeTransition({
  width: 80,   // Terminal width
  height: 24,  // Terminal height
  gap: 1,      // Gap between contents
  animation: {
    useSpring: true,
    springOptions: { frequency: 7, damping: 0.75 }
  }
});

// Swipe left (next content enters from right)
swipe.swipeLeft('Current Page', 'Next Page');

// Swipe right (previous content enters from left)
swipe.swipeRight('Current Page', 'Previous Page');

// In render loop
const output = swipe.render();

// State
swipe.isAnimating();  // boolean
swipe.stop();         // Cancel
swipe.reverse();      // Reverse direction
```

### createSlideTransition

Pre-built vertical slide:

```typescript
import { createSlideTransition } from 'tuiuiu';

const slide = createSlideTransition({
  width: 80,
  height: 24,
  gap: 0,
  animation: { useSpring: true }
});

// Slide up (next enters from bottom)
slide.slideUp('Current View', 'Next View');

// Slide down (previous enters from top)
slide.slideDown('Current View', 'Previous View');

const output = slide.render();
```

---

## Helpers

### lerp (Linear Interpolation)

```typescript
import { lerp } from 'tuiuiu';

// Interpolate between two numbers
const value = lerp(0, 100, 0.5);  // 50
```

### lerpColor

```typescript
import { lerpColor } from 'tuiuiu';

// Interpolate between two hex colors
const color = lerpColor('#ff0000', '#0000ff', 0.5);  // '#800080'
```

### requestAnimationFrame

Terminal-compatible requestAnimationFrame (~60fps):

```typescript
import { requestAnimationFrame, cancelAllAnimationFrames } from 'tuiuiu';

const cancel = requestAnimationFrame(() => {
  console.log('Next frame');
});

cancel();  // Cancel this callback
cancelAllAnimationFrames();  // Cancel all pending
```

---

## Practical Examples

### Animated Counter

```typescript
function AnimatedCounter({ target }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const anim = useAnimation({
      duration: 800,
      easing: 'ease-out',
      onFrame: (p) => setValue(Math.round(p * target))
    });
    anim.start();
    return () => anim.stop();
  }, [target]);

  return Text({ bold: true }, `Count: ${value()}`);
}
```

### Fade-In Toast

```typescript
function Toast({ message, visible }) {
  const { progress, shouldRender } = useTransition({
    show: visible,
    enter: 'fade',
    exit: 'fade',
    duration: 200
  });

  if (!shouldRender()) return null;

  return Box(
    {
      backgroundColor: 'green',
      padding: 1,
      opacity: progress()
    },
    Text({ color: 'white' }, message)
  );
}
```

### Page Wizard with Swipe

```typescript
function Wizard() {
  const [step, setStep] = useState(0);
  const swipe = createSwipeTransition({
    width: 60,
    height: 20,
    animation: { useSpring: true }
  });

  const pages = ['Welcome', 'Setup', 'Done'];

  const goNext = () => {
    if (step() < pages.length - 1) {
      swipe.swipeLeft(
        renderPage(step()),
        renderPage(step() + 1)
      );
      // Update step after animation
      setTimeout(() => setStep(s => s + 1), 300);
    }
  };

  const goPrev = () => {
    if (step() > 0) {
      swipe.swipeRight(
        renderPage(step()),
        renderPage(step() - 1)
      );
      setTimeout(() => setStep(s => s - 1), 300);
    }
  };

  useInput((_, key) => {
    if (key.rightArrow) goNext();
    if (key.leftArrow) goPrev();
  });

  const renderPage = (i) => {
    return Box(
      { width: 60, height: 20, borderStyle: 'round' },
      Text({ bold: true }, `Step ${i + 1}: ${pages[i]}`)
    );
  };

  // Show animated or static content
  return swipe.isAnimating()
    ? Text({}, swipe.render())
    : renderPage(step());
}
```

### Bouncy Button

```typescript
function BouncyButton({ label, onPress }) {
  const [scale, setScale] = useState(1);

  const spring = createHarmonicaSpring({
    frequency: 12,
    damping: 0.5
  });

  const bounce = () => {
    spring.start(0.8, 1, setScale, onPress);
  };

  useInput((_, key) => {
    if (key.return) bounce();
  });

  return Box(
    {
      borderStyle: 'round',
      width: Math.round(label.length * scale()),
      padding: 1
    },
    Text({ bold: true }, label)
  );
}
```

---

## Performance Tips

1. **Use springs for interactions** - They feel more natural than easing
2. **Keep durations short** - 150-400ms for most UI animations
3. **Avoid animating many elements** - Terminals have limited refresh rates
4. **Use `none` effect for instant** - When animation isn't needed
5. **Stop animations on cleanup** - Prevent memory leaks

```typescript
useEffect(() => {
  const anim = useAnimation({ ... });
  anim.start();
  return () => anim.stop();  // Cleanup!
}, []);
```
