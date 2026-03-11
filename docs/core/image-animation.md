# Image Animation

Frame-based animation system for terminal images. Drives frame changes through the global tick system and exposes reactive signals for integration with the rendering pipeline.

## Types

### `ImageData`

The base pixel format used by the graphics system:

```typescript
interface ImageData {
  pixels: Uint8Array;  // Raw RGBA pixel data
  width: number;
  height: number;
}
```

### `AnimatedImageFrame`

A single frame in an animation sequence:

```typescript
interface AnimatedImageFrame {
  imageData: ImageData;
  duration?: number;  // ms, 0 or undefined = use source default
}
```

### `AnimatedImageSource`

Describes a complete animation (frames, timing, dimensions):

```typescript
interface AnimatedImageSource {
  frames: AnimatedImageFrame[];
  defaultDuration: number;  // ms, default 100
  loopCount: number;        // 0 = infinite
  width: number;
  height: number;
}
```

### `AnimatedImageState`

Reactive animation controller returned by `createAnimatedImage`:

```typescript
interface AnimatedImageState {
  currentFrame: () => number;       // Reactive frame index
  currentImageData: () => ImageData; // Reactive image data for rendering
  isPlaying: () => boolean;
  play: () => void;
  pause: () => void;
  stop: () => void;                 // Resets to frame 0
  goToFrame: (index: number) => void;
  frameCount: number;
  dispose: () => void;
}
```

## `createAnimatedImageSource(frames, options?)`

Creates an `AnimatedImageSource` from an array of `ImageData` frames. All frames must share the same dimensions (width and height are taken from the first frame).

```typescript
import { createAnimatedImageSource } from 'tuiuiu.js';

const source = createAnimatedImageSource(frames, {
  defaultDuration: 200,  // ms per frame (default: 100)
  loopCount: 0,          // 0 = infinite (default: 0)
});
```

Throws if `frames` is empty.

## `createAnimatedImage(source)`

Creates a reactive animation controller from a source. The animation starts paused at frame 0.

Uses the global tick system for timing. Each tick, elapsed time accumulates. When it exceeds the current frame's duration, the animation advances.

```typescript
import { createAnimatedImageSource, createAnimatedImage } from 'tuiuiu.js';

const source = createAnimatedImageSource(frames, { defaultDuration: 150 });
const anim = createAnimatedImage(source);

anim.play();
// anim.currentImageData() is reactive - use it in components
// anim.currentFrame() returns the current frame index

anim.dispose(); // cleanup when done
```

### Controls

| Method | Description |
|--------|-------------|
| `play()` | Start or resume playback. No-op if already playing. |
| `pause()` | Pause playback. Frame position is preserved. |
| `stop()` | Pause and reset to frame 0. Also resets the loop counter. |
| `goToFrame(index)` | Jump to a specific frame. Resets elapsed time. Silently ignores out-of-bounds indices. |
| `currentFrame()` | Reactive signal returning the current frame index. |
| `currentImageData()` | Reactive signal returning the `ImageData` for the current frame. |
| `isPlaying()` | Reactive signal returning whether the animation is playing. |
| `dispose()` | Cleans up the tick subscription and focus listener. Stops playback. |

## `framesFromSpriteSheet(spriteSheet, frameWidth, frameHeight?)`

Extracts frames from a horizontal sprite strip. Frames are read left to right. If `frameHeight` is omitted, the full image height is used. Partial frames at the right edge are discarded.

```typescript
import { framesFromSpriteSheet, createAnimatedImageSource } from 'tuiuiu.js';

// A 48x16 sprite sheet with 16x16 frames = 3 frames
const frames = framesFromSpriteSheet(spriteSheet, 16);
const source = createAnimatedImageSource(frames);
```

Returns an empty array if `frameWidth` exceeds the sprite sheet width.

## Loop Behavior

The `loopCount` option controls how many times the animation cycles through all frames:

| Value | Behavior |
|-------|----------|
| `0` | Infinite looping (default) |
| `1` | Play once, then stop and reset to frame 0 |
| `N` | Play N times, then stop and reset to frame 0 |

When the animation finishes its final loop, `isPlaying()` becomes `false` and the frame resets to 0.

## Per-Frame Duration

Individual frames can override the source's `defaultDuration`. Set `duration` on an `AnimatedImageFrame` directly after creating the source:

```typescript
const source = createAnimatedImageSource(frames, { defaultDuration: 100 });
source.frames[0].duration = 500; // first frame holds for 500ms
source.frames[2].duration = 50;  // third frame is fast
```

A frame with `duration` of `0` or `undefined` falls back to `defaultDuration`.

## Focus-Aware Pause

Animations automatically pause when the terminal loses focus and resume when focus returns. This prevents unnecessary computation when the user is not looking at the terminal.

- If the animation was playing before focus loss, it resumes on focus gain.
- If the animation was already paused before focus loss, it stays paused on focus gain.

## Integration with TerminalImage

Pass `currentImageData()` to a `TerminalImage` component for rendering. Because the accessor is a reactive signal, the component re-renders automatically when the frame changes.

```typescript
import {
  render, Box, TerminalImage, useState, useHotkeys, useApp,
  createAnimatedImageSource, createAnimatedImage, setTheme, darkTheme,
} from 'tuiuiu.js';

setTheme(darkTheme);

function App() {
  const { exit } = useApp();
  const anim = useState(() => {
    const source = createAnimatedImageSource(myFrames, { defaultDuration: 150 });
    return createAnimatedImage(source);
  });

  useHotkeys('space', () => anim().isPlaying() ? anim().pause() : anim().play());
  useHotkeys('q', () => { anim().dispose(); exit(); });

  return Box({ flexDirection: 'column' },
    TerminalImage({ imageData: anim().currentImageData(), width: 40 }),
  );
}

const { waitUntilExit } = render(App);
await waitUntilExit();
```

## Examples

### Basic animation

```typescript
import { createSolidImage } from 'tuiuiu.js';
import { createAnimatedImageSource, createAnimatedImage } from 'tuiuiu.js';

// Create colored frames
const frames = [
  createSolidImage(16, 16, 255, 0, 0),    // red
  createSolidImage(16, 16, 0, 255, 0),    // green
  createSolidImage(16, 16, 0, 0, 255),    // blue
];

const source = createAnimatedImageSource(frames, { defaultDuration: 200 });
const anim = createAnimatedImage(source);

anim.play();
// anim.currentImageData() cycles: red -> green -> blue -> red -> ...

anim.dispose();
```

### Sprite sheet

```typescript
import { framesFromSpriteSheet, createAnimatedImageSource, createAnimatedImage } from 'tuiuiu.js';

// loadImage returns an ImageData (your own loader)
const spriteSheet = loadImage('walk-cycle.png');
const frames = framesFromSpriteSheet(spriteSheet, 32, 32);
const source = createAnimatedImageSource(frames, {
  defaultDuration: 120,
  loopCount: 0, // infinite
});

const anim = createAnimatedImage(source);
anim.play();
```

### Custom frame durations

```typescript
const source = createAnimatedImageSource(frames, { defaultDuration: 100 });

// Hold the first frame longer, speed through the middle
source.frames[0].duration = 500;
source.frames[1].duration = 50;
source.frames[2].duration = 50;
// Remaining frames use the 100ms default

const anim = createAnimatedImage(source);
anim.play();
```
