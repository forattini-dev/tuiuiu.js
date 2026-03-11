/**
 * Tests for Image Animation API
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createAnimatedImageSource,
  createAnimatedImage,
  framesFromSpriteSheet,
} from '../../src/core/image-animation.js';
import { createSolidImage } from '../../src/core/graphics.js';
import { advanceTick, setTickRate, resetTick, stopTick } from '../../src/core/tick.js';
import { setTerminalFocusState, resetTerminalFocusState } from '../../src/core/terminal-focus.js';
import type { ImageData } from '../../src/core/graphics.js';

// Helper: create distinct colored frames for testing
function createTestFrames(count: number, width = 4, height = 4): ImageData[] {
  const frames: ImageData[] = [];
  for (let i = 0; i < count; i++) {
    // Use distinct colors: r channel = i * 50
    frames.push(createSolidImage(width, height, i * 50, 100, 200));
  }
  return frames;
}

describe('Image Animation', () => {
  beforeEach(() => {
    resetTick();
    stopTick();
    setTickRate(100);
    resetTerminalFocusState();
  });

  // ===========================================================================
  // createAnimatedImageSource
  // ===========================================================================

  describe('createAnimatedImageSource', () => {
    it('creates correct source from frames', () => {
      const frames = createTestFrames(3, 8, 6);
      const source = createAnimatedImageSource(frames);

      expect(source.frames).toHaveLength(3);
      expect(source.width).toBe(8);
      expect(source.height).toBe(6);
      expect(source.defaultDuration).toBe(100);
      expect(source.loopCount).toBe(0);
    });

    it('uses custom defaultDuration', () => {
      const frames = createTestFrames(2);
      const source = createAnimatedImageSource(frames, { defaultDuration: 250 });

      expect(source.defaultDuration).toBe(250);
    });

    it('uses custom loopCount', () => {
      const frames = createTestFrames(2);
      const source = createAnimatedImageSource(frames, { loopCount: 3 });

      expect(source.loopCount).toBe(3);
    });

    it('wraps each ImageData as an AnimatedImageFrame', () => {
      const frames = createTestFrames(2);
      const source = createAnimatedImageSource(frames);

      expect(source.frames[0].imageData).toBe(frames[0]);
      expect(source.frames[1].imageData).toBe(frames[1]);
      expect(source.frames[0].duration).toBeUndefined();
    });

    it('throws when no frames provided', () => {
      expect(() => createAnimatedImageSource([])).toThrow('At least one frame is required');
    });
  });

  // ===========================================================================
  // createAnimatedImage
  // ===========================================================================

  describe('createAnimatedImage', () => {
    it('starts at frame 0', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames);
      const anim = createAnimatedImage(source);

      expect(anim.currentFrame()).toBe(0);
      expect(anim.currentImageData()).toBe(frames[0]);

      anim.dispose();
    });

    it('starts in paused state', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames);
      const anim = createAnimatedImage(source);

      expect(anim.isPlaying()).toBe(false);

      anim.dispose();
    });

    it('reports correct frameCount', () => {
      const frames = createTestFrames(5);
      const source = createAnimatedImageSource(frames);
      const anim = createAnimatedImage(source);

      expect(anim.frameCount).toBe(5);

      anim.dispose();
    });

    it('play sets isPlaying to true', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames);
      const anim = createAnimatedImage(source);

      anim.play();
      expect(anim.isPlaying()).toBe(true);

      anim.dispose();
    });

    it('pause sets isPlaying to false', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames);
      const anim = createAnimatedImage(source);

      anim.play();
      anim.pause();
      expect(anim.isPlaying()).toBe(false);

      anim.dispose();
    });

    it('stop resets to frame 0 and pauses', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames);
      const anim = createAnimatedImage(source);

      anim.play();
      anim.goToFrame(2);
      anim.stop();

      expect(anim.isPlaying()).toBe(false);
      expect(anim.currentFrame()).toBe(0);

      anim.dispose();
    });

    it('goToFrame changes current frame', () => {
      const frames = createTestFrames(4);
      const source = createAnimatedImageSource(frames);
      const anim = createAnimatedImage(source);

      anim.goToFrame(2);
      expect(anim.currentFrame()).toBe(2);
      expect(anim.currentImageData()).toBe(frames[2]);

      anim.dispose();
    });

    it('goToFrame ignores out-of-bounds index', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames);
      const anim = createAnimatedImage(source);

      anim.goToFrame(10);
      expect(anim.currentFrame()).toBe(0);

      anim.goToFrame(-1);
      expect(anim.currentFrame()).toBe(0);

      anim.dispose();
    });

    it('advances frame on tick when playing', () => {
      // tickRate=100ms, defaultDuration=100ms => advance every tick
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100 });
      const anim = createAnimatedImage(source);

      anim.play();

      advanceTick(1); // 100ms elapsed
      expect(anim.currentFrame()).toBe(1);

      advanceTick(1); // 200ms elapsed
      expect(anim.currentFrame()).toBe(2);

      anim.dispose();
    });

    it('does not advance when paused', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100 });
      const anim = createAnimatedImage(source);

      // Not playing, so ticks should not advance frame
      advanceTick(5);
      expect(anim.currentFrame()).toBe(0);

      anim.dispose();
    });

    it('loops infinitely when loopCount is 0', () => {
      const frames = createTestFrames(2);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100, loopCount: 0 });
      const anim = createAnimatedImage(source);

      anim.play();

      // Frame 0 -> 1 -> wrap to 0 -> 1 -> wrap to 0
      advanceTick(1); // frame 1
      expect(anim.currentFrame()).toBe(1);

      advanceTick(1); // wraps to frame 0
      expect(anim.currentFrame()).toBe(0);

      advanceTick(1); // frame 1 again
      expect(anim.currentFrame()).toBe(1);

      advanceTick(1); // wraps to frame 0 again
      expect(anim.currentFrame()).toBe(0);

      expect(anim.isPlaying()).toBe(true);

      anim.dispose();
    });

    it('stops after loopCount cycles', () => {
      const frames = createTestFrames(2);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100, loopCount: 1 });
      const anim = createAnimatedImage(source);

      anim.play();

      advanceTick(1); // frame 1
      expect(anim.currentFrame()).toBe(1);

      advanceTick(1); // end of first (and only) loop - should stop
      expect(anim.isPlaying()).toBe(false);
      expect(anim.currentFrame()).toBe(0);

      anim.dispose();
    });

    it('pauses on terminal focus loss', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100 });
      const anim = createAnimatedImage(source);

      anim.play();
      expect(anim.isPlaying()).toBe(true);

      // Lose focus
      setTerminalFocusState(false);
      expect(anim.isPlaying()).toBe(false);

      anim.dispose();
      resetTerminalFocusState();
    });

    it('resumes on terminal focus gain after loss', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100 });
      const anim = createAnimatedImage(source);

      anim.play();

      // Lose then regain focus
      setTerminalFocusState(false);
      setTerminalFocusState(true);
      expect(anim.isPlaying()).toBe(true);

      anim.dispose();
    });

    it('does not resume if was not playing before focus loss', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100 });
      const anim = createAnimatedImage(source);

      // Not playing, lose/gain focus
      setTerminalFocusState(false);
      setTerminalFocusState(true);
      expect(anim.isPlaying()).toBe(false);

      anim.dispose();
    });

    it('dispose cleans up tick subscription', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100 });
      const anim = createAnimatedImage(source);

      anim.play();
      anim.dispose();

      // After dispose, advancing tick should not change frame
      advanceTick(5);
      expect(anim.currentFrame()).toBe(0);
      expect(anim.isPlaying()).toBe(false);
    });

    it('handles per-frame duration', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100 });
      // Override frame 0 duration to 200ms
      source.frames[0].duration = 200;

      const anim = createAnimatedImage(source);
      anim.play();

      // After 1 tick (100ms), frame 0 has duration 200, so still frame 0
      advanceTick(1);
      expect(anim.currentFrame()).toBe(0);

      // After 2nd tick (200ms total), frame should advance
      advanceTick(1);
      expect(anim.currentFrame()).toBe(1);

      // Frame 1 uses default 100ms, should advance after 1 more tick
      advanceTick(1);
      expect(anim.currentFrame()).toBe(2);

      anim.dispose();
    });

    it('currentImageData reflects current frame', () => {
      const frames = createTestFrames(3);
      const source = createAnimatedImageSource(frames, { defaultDuration: 100 });
      const anim = createAnimatedImage(source);

      expect(anim.currentImageData()).toBe(frames[0]);

      anim.goToFrame(1);
      expect(anim.currentImageData()).toBe(frames[1]);

      anim.goToFrame(2);
      expect(anim.currentImageData()).toBe(frames[2]);

      anim.dispose();
    });
  });

  // ===========================================================================
  // framesFromSpriteSheet
  // ===========================================================================

  describe('framesFromSpriteSheet', () => {
    it('extracts correct number of frames', () => {
      // 12px wide sprite sheet, each frame 4px wide = 3 frames
      const spriteSheet = createSolidImage(12, 4, 255, 0, 0);
      const frames = framesFromSpriteSheet(spriteSheet, 4);

      expect(frames).toHaveLength(3);
    });

    it('each frame has correct dimensions', () => {
      const spriteSheet = createSolidImage(12, 6, 255, 0, 0);
      const frames = framesFromSpriteSheet(spriteSheet, 4);

      for (const frame of frames) {
        expect(frame.width).toBe(4);
        expect(frame.height).toBe(6);
      }
    });

    it('extracts correct pixel data from uniform sprite', () => {
      // Solid red sprite sheet
      const spriteSheet = createSolidImage(8, 2, 255, 0, 0);
      const frames = framesFromSpriteSheet(spriteSheet, 4);

      expect(frames).toHaveLength(2);

      // Each frame should be solid red
      for (const frame of frames) {
        for (let i = 0; i < frame.width * frame.height; i++) {
          expect(frame.pixels[i * 4]).toBe(255);     // R
          expect(frame.pixels[i * 4 + 1]).toBe(0);   // G
          expect(frame.pixels[i * 4 + 2]).toBe(0);   // B
          expect(frame.pixels[i * 4 + 3]).toBe(255);  // A
        }
      }
    });

    it('extracts correct pixel data from multi-color sprite sheet', () => {
      // Create a 8x2 sprite sheet with 2 distinct frames:
      // Frame 0: red, Frame 1: green
      const width = 8;
      const height = 2;
      const pixels = new Uint8Array(width * height * 4);

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4;
          if (x < 4) {
            // Left half: red
            pixels[idx] = 255;
            pixels[idx + 1] = 0;
            pixels[idx + 2] = 0;
            pixels[idx + 3] = 255;
          } else {
            // Right half: green
            pixels[idx] = 0;
            pixels[idx + 1] = 255;
            pixels[idx + 2] = 0;
            pixels[idx + 3] = 255;
          }
        }
      }

      const spriteSheet: ImageData = { pixels, width, height };
      const frames = framesFromSpriteSheet(spriteSheet, 4);

      expect(frames).toHaveLength(2);

      // Frame 0 should be red
      const f0 = frames[0];
      expect(f0.pixels[0]).toBe(255);
      expect(f0.pixels[1]).toBe(0);
      expect(f0.pixels[2]).toBe(0);

      // Frame 1 should be green
      const f1 = frames[1];
      expect(f1.pixels[0]).toBe(0);
      expect(f1.pixels[1]).toBe(255);
      expect(f1.pixels[2]).toBe(0);
    });

    it('uses custom frameHeight', () => {
      // 8x8 sprite sheet, extract 4x4 frames from the top half
      const spriteSheet = createSolidImage(8, 8, 128, 128, 128);
      const frames = framesFromSpriteSheet(spriteSheet, 4, 4);

      expect(frames).toHaveLength(2);
      for (const frame of frames) {
        expect(frame.width).toBe(4);
        expect(frame.height).toBe(4);
        expect(frame.pixels.length).toBe(4 * 4 * 4);
      }
    });

    it('returns empty array when frameWidth exceeds sprite width', () => {
      const spriteSheet = createSolidImage(4, 4, 255, 0, 0);
      const frames = framesFromSpriteSheet(spriteSheet, 8);

      expect(frames).toHaveLength(0);
    });

    it('truncates partial frames', () => {
      // 10px wide, 4px frame width = 2 full frames (last 2px ignored)
      const spriteSheet = createSolidImage(10, 4, 255, 0, 0);
      const frames = framesFromSpriteSheet(spriteSheet, 4);

      expect(frames).toHaveLength(2);
    });
  });
});
