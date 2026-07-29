/**
 * Image Animation API
 *
 * Provides frame-based animation for terminal images.
 * Uses the current runtime tick system for timing and signals for reactivity.
 *
 * @example
 * const frames = [redImage, greenImage, blueImage];
 * const source = createAnimatedImageSource(frames, { defaultDuration: 200 });
 * const anim = createAnimatedImage(source);
 *
 * anim.play();
 * // anim.currentImageData() reactively provides the current frame
 * // Pass to TerminalImage component for rendering
 *
 * anim.dispose(); // cleanup when done
 */

import type { ImageData } from './graphics.js';
import { createSignal, createEffect, batch, untrack } from '../primitives/signal.js';
import { tick, getTickRate } from './tick.js';
import { onTerminalFocusChange } from './terminal-focus.js';

// =============================================================================
// Types
// =============================================================================

export interface AnimatedImageFrame {
  /** Frame image data (RGBA) */
  imageData: ImageData;
  /** Duration of this frame in ms (0 = use default) */
  duration?: number;
}

export interface AnimatedImageSource {
  /** Array of frames */
  frames: AnimatedImageFrame[];
  /** Default frame duration in ms (default 100) */
  defaultDuration: number;
  /** Loop count (0 = infinite, default 0) */
  loopCount: number;
  /** Total width (all frames same size) */
  width: number;
  /** Total height */
  height: number;
}

export interface AnimatedImageState {
  /** Current frame index (reactive via signal) */
  currentFrame: () => number;
  /** Current image data for rendering */
  currentImageData: () => ImageData;
  /** Is the animation playing? */
  isPlaying: () => boolean;
  /** Start/resume animation */
  play: () => void;
  /** Pause animation */
  pause: () => void;
  /** Stop and reset to frame 0 */
  stop: () => void;
  /** Go to specific frame */
  goToFrame: (index: number) => void;
  /** Total frame count */
  frameCount: number;
  /** Cleanup function */
  dispose: () => void;
}

// =============================================================================
// createAnimatedImageSource
// =============================================================================

/**
 * Create an animated image source from an array of ImageData frames.
 *
 * All frames must have the same dimensions. The width and height are
 * taken from the first frame.
 */
export function createAnimatedImageSource(
  frames: ImageData[],
  options?: { defaultDuration?: number; loopCount?: number },
): AnimatedImageSource {
  if (frames.length === 0) {
    throw new Error('At least one frame is required');
  }

  const { width, height } = frames[0];

  return {
    frames: frames.map(imageData => ({ imageData })),
    defaultDuration: options?.defaultDuration ?? 100,
    loopCount: options?.loopCount ?? 0,
    width,
    height,
  };
}

// =============================================================================
// createAnimatedImage
// =============================================================================

/**
 * Create animated image state that drives frame changes.
 *
 * Uses the current runtime tick system for timing. Each tick, elapsed time is
 * accumulated and when it exceeds the current frame's duration the
 * animation advances to the next frame.
 *
 * The animation pauses automatically when the terminal loses focus and
 * resumes when focus returns.
 */
export function createAnimatedImage(source: AnimatedImageSource): AnimatedImageState {
  const totalFrames = source.frames.length;

  const [currentFrame, setCurrentFrame] = createSignal(0);
  const [playing, setPlaying] = createSignal(false);

  // Elapsed time accumulator (ms since last frame change)
  let elapsed = 0;
  // Remaining loops (only used when loopCount > 0)
  let remainingLoops = source.loopCount === 0 ? -1 : source.loopCount;
  // Whether we were playing before focus loss
  let wasPlayingBeforeFocusLoss = false;

  function getFrameDuration(index: number): number {
    const frame = source.frames[index];
    return (frame.duration && frame.duration > 0) ? frame.duration : source.defaultDuration;
  }

  // Subscribe to the tick system via a reactive effect on the tick signal.
  // This works with both the real interval-driven tick and advanceTick() in tests.
  const tickRate = getTickRate();
  let lastTick = tick();
  const disposeEffect = createEffect(() => {
    const currentTick = tick();
    // Read playing inside untrack so we don't re-run the effect when playing changes
    const isPlaying = untrack(playing);
    if (!isPlaying) {
      lastTick = currentTick;
      return;
    }

    const tickDelta = currentTick - lastTick;
    lastTick = currentTick;
    if (tickDelta <= 0) return;

    elapsed += tickDelta * tickRate;

    const duration = getFrameDuration(untrack(currentFrame));
    if (elapsed >= duration) {
      elapsed -= duration;

      const nextFrame = untrack(currentFrame) + 1;

      if (nextFrame >= totalFrames) {
        // End of cycle
        if (remainingLoops === -1) {
          // Infinite loop
          setCurrentFrame(0);
        } else {
          remainingLoops--;
          if (remainingLoops <= 0) {
            // Animation complete
            batch(() => {
              setPlaying(false);
              setCurrentFrame(0);
            });
            elapsed = 0;
          } else {
            setCurrentFrame(0);
          }
        }
      } else {
        setCurrentFrame(nextFrame);
      }
    }
  });

  // Pause when terminal loses focus
  const unsubFocus = onTerminalFocusChange((focused) => {
    if (!focused) {
      wasPlayingBeforeFocusLoss = playing();
      if (wasPlayingBeforeFocusLoss) {
        setPlaying(false);
      }
    } else {
      if (wasPlayingBeforeFocusLoss) {
        setPlaying(true);
        wasPlayingBeforeFocusLoss = false;
      }
    }
  });

  function currentImageData(): ImageData {
    return source.frames[currentFrame()].imageData;
  }

  function play(): void {
    if (playing()) return;
    setPlaying(true);
  }

  function pause(): void {
    if (!playing()) return;
    setPlaying(false);
  }

  function stop(): void {
    batch(() => {
      setPlaying(false);
      setCurrentFrame(0);
    });
    elapsed = 0;
    remainingLoops = source.loopCount === 0 ? -1 : source.loopCount;
  }

  function goToFrame(index: number): void {
    if (index < 0 || index >= totalFrames) return;
    setCurrentFrame(index);
    elapsed = 0;
  }

  function dispose(): void {
    disposeEffect();
    unsubFocus();
    setPlaying(false);
  }

  return {
    currentFrame,
    currentImageData,
    isPlaying: playing,
    play,
    pause,
    stop,
    goToFrame,
    frameCount: totalFrames,
    dispose,
  };
}

// =============================================================================
// framesFromSpriteSheet
// =============================================================================

/**
 * Extract frames from a sprite sheet (horizontal strip).
 *
 * The sprite sheet is assumed to be a horizontal strip where each frame
 * has width `frameWidth` and height `frameHeight` (defaults to the full
 * image height). Frames are extracted left to right.
 */
export function framesFromSpriteSheet(
  spriteSheet: ImageData,
  frameWidth: number,
  frameHeight?: number,
): ImageData[] {
  const fh = frameHeight ?? spriteSheet.height;
  const frameCount = Math.floor(spriteSheet.width / frameWidth);

  if (frameCount === 0) {
    return [];
  }

  const frames: ImageData[] = [];

  for (let f = 0; f < frameCount; f++) {
    const pixels = new Uint8Array(frameWidth * fh * 4);

    for (let y = 0; y < fh; y++) {
      const srcOffset = (y * spriteSheet.width + f * frameWidth) * 4;
      const dstOffset = y * frameWidth * 4;
      pixels.set(
        spriteSheet.pixels.subarray(srcOffset, srcOffset + frameWidth * 4),
        dstOffset,
      );
    }

    frames.push({
      pixels,
      width: frameWidth,
      height: fh,
    });
  }

  return frames;
}
