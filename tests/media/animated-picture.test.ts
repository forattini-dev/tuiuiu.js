/**
 * Tests for AnimatedPicture component and related utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createPixelGrid,
  createPixelGridFromColors,
  adjustBrightness,
  interpolateColor,
  applyBrightnessToGrid,
  applyShimmerToGrid,
  applyRainbowToGrid,
  applyGlitchToGrid,
  createAnimatedPicture,
  type PixelGrid,
  type Pixel,
} from '../../src/design-system/media/picture.js';

// =============================================================================
// Color Utility Tests
// =============================================================================

describe('adjustBrightness', () => {
  it('should dim a hex color', () => {
    const result = adjustBrightness('#ffffff', 0.5);
    expect(result).toBe('#808080'); // 255 * 0.5 = 127.5 → 128 in hex = 80
  });

  it('should fully dim a color to black', () => {
    const result = adjustBrightness('#ff0000', 0);
    expect(result).toBe('#000000');
  });

  it('should not change a color at full brightness', () => {
    const result = adjustBrightness('#ff0000', 1);
    expect(result).toBe('#ff0000');
  });

  it('should handle short hex colors', () => {
    const result = adjustBrightness('#fff', 0.5);
    expect(result).toBe('#808080');
  });

  it('should handle named colors', () => {
    const result = adjustBrightness('red', 0.5);
    expect(result).toBe('#800000'); // 255 * 0.5 = 128 → 80 in hex
  });

  it('should handle rgb() format', () => {
    const result = adjustBrightness('rgb(200, 100, 50)', 0.5);
    expect(result).toBe('#643219'); // 200*0.5=100→64, 100*0.5=50→32, 50*0.5=25→19
  });

  it('should return original color for unknown format', () => {
    const result = adjustBrightness('unknown', 0.5);
    expect(result).toBe('unknown');
  });

  it('should clamp values above 255', () => {
    // brightness > 1 should be clamped
    const result = adjustBrightness('#808080', 3);
    expect(result).toBe('#ffffff'); // 128 * 3 = 384 → clamped to 255
  });
});

describe('interpolateColor', () => {
  it('should interpolate between two colors', () => {
    const result = interpolateColor('#000000', '#ffffff', 0.5);
    expect(result).toBe('#808080');
  });

  it('should return start color at t=0', () => {
    const result = interpolateColor('#ff0000', '#0000ff', 0);
    expect(result).toBe('#ff0000');
  });

  it('should return end color at t=1', () => {
    const result = interpolateColor('#ff0000', '#0000ff', 1);
    expect(result).toBe('#0000ff');
  });

  it('should handle named colors', () => {
    const result = interpolateColor('red', 'blue', 0.5);
    expect(result).toBe('#800080'); // purple-ish
  });

  it('should return first color if second is invalid', () => {
    const result = interpolateColor('#ff0000', 'invalid', 0.5);
    expect(result).toBe('#ff0000');
  });
});

// =============================================================================
// Pixel Grid Utilities
// =============================================================================

describe('createPixelGrid', () => {
  it('should create a pixel grid from source and palette', () => {
    const source = 'RG\nBW';
    const palette = {
      R: { fg: 'red' },
      G: { fg: 'green' },
      B: { fg: 'blue' },
      W: { fg: 'white' },
    };

    const grid = createPixelGrid(source, palette);

    expect(grid).toHaveLength(2);
    expect(grid[0]).toHaveLength(2);
    expect(grid[0][0]).toEqual({ char: 'R', fg: 'red', bg: undefined });
    expect(grid[0][1]).toEqual({ char: 'G', fg: 'green', bg: undefined });
    expect(grid[1][0]).toEqual({ char: 'B', fg: 'blue', bg: undefined });
    expect(grid[1][1]).toEqual({ char: 'W', fg: 'white', bg: undefined });
  });

  it('should handle missing palette entries', () => {
    const source = 'AB';
    const palette = { A: { fg: 'red' } };

    const grid = createPixelGrid(source, palette);

    expect(grid[0][0]).toEqual({ char: 'A', fg: 'red', bg: undefined });
    expect(grid[0][1]).toEqual({ char: 'B', fg: undefined, bg: undefined });
  });
});

describe('createPixelGridFromColors', () => {
  it('should create grid from color matrix', () => {
    const colors = [
      ['red', 'green'],
      ['blue', null],
    ];

    const grid = createPixelGridFromColors(colors);

    expect(grid[0][0]).toEqual({ char: '█', fg: 'red' });
    expect(grid[0][1]).toEqual({ char: '█', fg: 'green' });
    expect(grid[1][0]).toEqual({ char: '█', fg: 'blue' });
    expect(grid[1][1]).toEqual({ char: ' ', fg: undefined });
  });

  it('should use custom character', () => {
    const colors = [['red']];
    const grid = createPixelGridFromColors(colors, '▓');

    expect(grid[0][0].char).toBe('▓');
  });
});

// =============================================================================
// Grid Effect Functions
// =============================================================================

describe('applyBrightnessToGrid', () => {
  const createTestGrid = (): PixelGrid => [
    [{ char: '█', fg: '#ffffff' }, { char: '█', fg: '#ff0000' }],
    [{ char: '█', fg: '#00ff00', bg: '#0000ff' }],
  ];

  it('should apply brightness to all pixels', () => {
    const grid = createTestGrid();
    const result = applyBrightnessToGrid(grid, 0.5);

    expect(result[0][0].fg).toBe('#808080');
    expect(result[0][1].fg).toBe('#800000');
    expect(result[1][0].fg).toBe('#008000');
    expect(result[1][0].bg).toBe('#000080');
  });

  it('should not modify pixels without colors', () => {
    const grid: PixelGrid = [[{ char: 'X' }]];
    const result = applyBrightnessToGrid(grid, 0.5);

    expect(result[0][0].fg).toBeUndefined();
    expect(result[0][0].char).toBe('X');
  });
});

describe('applyShimmerToGrid', () => {
  it('should create a wave effect across the grid', () => {
    const grid: PixelGrid = [
      [
        { char: '█', fg: '#ffffff' },
        { char: '█', fg: '#ffffff' },
        { char: '█', fg: '#ffffff' },
      ],
    ];

    // At progress 0, the wave should be at the left
    const result1 = applyShimmerToGrid(grid, 0, 0.3);
    // At progress 0.5, the wave should be in the middle
    const result2 = applyShimmerToGrid(grid, 0.5, 0.3);

    // First pixel should be brighter at progress 0
    // We can't easily compare exact values, but we can check they're different
    expect(result1[0][0].fg).not.toBe(result2[0][0].fg);
  });
});

describe('applyRainbowToGrid', () => {
  it('should apply rainbow colors to pixels', () => {
    const grid: PixelGrid = [
      [{ char: '█', fg: '#ffffff' }, { char: '█', fg: '#ffffff' }],
    ];

    const result = applyRainbowToGrid(grid, 0.5);

    // Colors should be changed to rainbow spectrum
    expect(result[0][0].fg).not.toBe('#ffffff');
    expect(result[0][1].fg).not.toBe('#ffffff');
  });

  it('should skip pixels without foreground color', () => {
    const grid: PixelGrid = [[{ char: ' ' }]];
    const result = applyRainbowToGrid(grid, 0.5);

    expect(result[0][0].fg).toBeUndefined();
  });
});

describe('applyGlitchToGrid', () => {
  it('should not modify grid with zero intensity', () => {
    const grid: PixelGrid = [[{ char: 'A', fg: 'red' }]];
    const result = applyGlitchToGrid(grid, 0);

    expect(result).toEqual(grid);
  });

  it('should potentially modify grid with high intensity', () => {
    // Seed random for deterministic test
    const originalRandom = Math.random;
    let callCount = 0;
    Math.random = () => {
      callCount++;
      return 0.01; // Very low, should trigger glitch
    };

    const grid: PixelGrid = [
      [{ char: 'A', fg: 'red' }, { char: 'B', fg: 'blue' }],
    ];

    const result = applyGlitchToGrid(grid, 1);

    // Restore Math.random
    Math.random = originalRandom;

    // With our mocked random, glitch should have occurred
    expect(result).toBeDefined();
  });
});

// =============================================================================
// createAnimatedPicture Tests
// =============================================================================

describe('createAnimatedPicture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const testGrid: PixelGrid = [
    [{ char: '█', fg: '#ff0000' }, { char: '█', fg: '#00ff00' }],
  ];

  it('should create animation controller with default settings', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      autoPlay: false,
    });

    expect(anim.isPlaying()).toBe(false);
    expect(anim.progress()).toBe(0);
    expect(anim.brightness()).toBe(1.0); // maxBrightness default
  });

  it('should auto-play when autoPlay is true', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      autoPlay: true,
    });

    // Need to advance timers for the setTimeout(play, 0)
    vi.advanceTimersByTime(0);

    expect(anim.isPlaying()).toBe(true);

    anim.stop();
  });

  it('should play and pause animation', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      autoPlay: false,
    });

    anim.play();
    expect(anim.isPlaying()).toBe(true);

    anim.pause();
    expect(anim.isPlaying()).toBe(false);

    anim.stop();
  });

  it('should update progress over time', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      duration: 1000,
      autoPlay: false,
    });

    anim.play();
    vi.advanceTimersByTime(500); // 50% through

    expect(anim.progress()).toBeCloseTo(0.5, 1);

    anim.stop();
  });

  it('should calculate pulse brightness correctly', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'pulse',
      duration: 1000,
      minBrightness: 0,
      maxBrightness: 1,
      autoPlay: false,
    });

    anim.play();

    // At start (progress 0), pulse uses sine wave: sin(0) = 0 → brightness = 0.5
    expect(anim.brightness()).toBeGreaterThan(0);

    vi.advanceTimersByTime(250); // 25% - should be at max (sine peak)
    const brightness25 = anim.brightness();

    vi.advanceTimersByTime(250); // 50% - should be back to middle
    const brightness50 = anim.brightness();

    expect(brightness25).not.toBe(brightness50);

    anim.stop();
  });

  it('should change animation type', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'pulse',
      autoPlay: false,
    });

    anim.setAnimation('breathe');

    anim.play();
    vi.advanceTimersByTime(100);

    // Should not throw and should return valid pixels
    const pixels = anim.pixels();
    expect(pixels).toBeDefined();
    expect(pixels.length).toBe(1);

    anim.stop();
  });

  it('should apply shimmer effect', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'shimmer',
      autoPlay: false,
    });

    anim.play();
    vi.advanceTimersByTime(100);

    const pixels = anim.pixels();
    // Shimmer should modify pixel colors
    expect(pixels[0][0].fg).toBeDefined();

    anim.stop();
  });

  it('should apply rainbow effect', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'rainbow',
      autoPlay: false,
    });

    anim.play();
    vi.advanceTimersByTime(100);

    const pixels = anim.pixels();
    // Rainbow should change colors
    expect(pixels[0][0].fg).not.toBe('#ff0000');

    anim.stop();
  });

  it('should loop by default', () => {
    const onCycleComplete = vi.fn();

    const anim = createAnimatedPicture({
      pixels: testGrid,
      duration: 100,
      loop: true,
      autoPlay: false,
      onCycleComplete,
    });

    anim.play();
    // Advance past full cycle (need extra time for interval to fire)
    vi.advanceTimersByTime(120);

    expect(onCycleComplete).toHaveBeenCalled();
    expect(anim.isPlaying()).toBe(true); // Still playing after cycle

    anim.stop();
  });

  it('should stop after one cycle when loop is false', () => {
    const onCycleComplete = vi.fn();

    const anim = createAnimatedPicture({
      pixels: testGrid,
      duration: 100,
      loop: false,
      autoPlay: false,
      onCycleComplete,
    });

    anim.play();
    vi.advanceTimersByTime(150);

    expect(onCycleComplete).toHaveBeenCalled();
    expect(anim.isPlaying()).toBe(false); // Stopped after cycle
  });

  it('should set brightness manually', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      autoPlay: false,
    });

    anim.setBrightness(0.5);
    expect(anim.brightness()).toBe(0.5);

    anim.stop();
  });

  it('should return none animation without modifications', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'none',
      autoPlay: false,
    });

    const pixels = anim.pixels();
    expect(pixels).toEqual(testGrid);

    anim.stop();
  });
});

// =============================================================================
// Animation Types
// =============================================================================

describe('Animation types', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const testGrid: PixelGrid = [
    [{ char: '█', fg: '#ffffff' }],
  ];

  const testAnimations = [
    'pulse',
    'breathe',
    'blink',
    'fadeIn',
    'fadeOut',
    'glow',
    'shimmer',
    'rainbow',
    'glitch',
  ] as const;

  testAnimations.forEach(animationType => {
    it(`should handle ${animationType} animation`, () => {
      const anim = createAnimatedPicture({
        pixels: testGrid,
        animation: animationType,
        duration: 1000,
        autoPlay: false,
      });

      anim.play();
      vi.advanceTimersByTime(100);

      expect(() => anim.pixels()).not.toThrow();
      expect(anim.pixels()).toBeDefined();

      anim.stop();
    });
  });
});

// =============================================================================
// FadeIn / FadeOut Specific Tests
// =============================================================================

describe('fadeIn animation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const testGrid: PixelGrid = [
    [{ char: '█', fg: '#ffffff' }],
  ];

  it('should start at minBrightness', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'fadeIn',
      duration: 1000,
      minBrightness: 0.3,
      maxBrightness: 1.0,
      autoPlay: false,
    });

    // Before playing, brightness should be minBrightness for fadeIn
    expect(anim.brightness()).toBe(0.3);

    anim.stop();
  });

  it('should progress from minBrightness to maxBrightness', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'fadeIn',
      duration: 1000,
      minBrightness: 0.2,
      maxBrightness: 1.0,
      autoPlay: false,
    });

    anim.play();

    // At start
    const startBrightness = anim.brightness();
    expect(startBrightness).toBeCloseTo(0.2, 1);

    // At 50%
    vi.advanceTimersByTime(500);
    const midBrightness = anim.brightness();
    expect(midBrightness).toBeGreaterThan(startBrightness);
    expect(midBrightness).toBeLessThan(1.0);

    // At 100%
    vi.advanceTimersByTime(500);
    const endBrightness = anim.brightness();
    expect(endBrightness).toBeCloseTo(1.0, 1);

    anim.stop();
  });

  it('should stop at maxBrightness when loop is false', () => {
    const onComplete = vi.fn();
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'fadeIn',
      duration: 500,
      minBrightness: 0.3,
      maxBrightness: 1.0,
      loop: false,
      autoPlay: false,
      onCycleComplete: onComplete,
    });

    anim.play();
    vi.advanceTimersByTime(600);

    expect(onComplete).toHaveBeenCalled();
    expect(anim.isPlaying()).toBe(false);
    // After stop(), brightness resets to maxBrightness
    expect(anim.brightness()).toBe(1.0);
  });

  it('should apply correct brightness to pixels', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'fadeIn',
      duration: 1000,
      minBrightness: 0.5,
      maxBrightness: 1.0,
      autoPlay: false,
    });

    // At start (minBrightness = 0.5), white (#ffffff) should become #808080
    const pixels = anim.pixels();
    expect(pixels[0][0].fg).toBe('#808080');

    anim.play();
    vi.advanceTimersByTime(1000);

    // At end (maxBrightness = 1.0), should be #ffffff
    const endPixels = anim.pixels();
    expect(endPixels[0][0].fg).toBe('#ffffff');

    anim.stop();
  });
});

describe('fadeOut animation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const testGrid: PixelGrid = [
    [{ char: '█', fg: '#ffffff' }],
  ];

  it('should start at maxBrightness', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'fadeOut',
      duration: 1000,
      minBrightness: 0.2,
      maxBrightness: 1.0,
      autoPlay: false,
    });

    // Before playing, brightness should be maxBrightness for fadeOut
    expect(anim.brightness()).toBe(1.0);

    anim.stop();
  });

  it('should progress from maxBrightness to minBrightness', () => {
    const anim = createAnimatedPicture({
      pixels: testGrid,
      animation: 'fadeOut',
      duration: 1000,
      minBrightness: 0.2,
      maxBrightness: 1.0,
      autoPlay: false,
    });

    anim.play();

    // At start
    const startBrightness = anim.brightness();
    expect(startBrightness).toBeCloseTo(1.0, 1);

    // At 50%
    vi.advanceTimersByTime(500);
    const midBrightness = anim.brightness();
    expect(midBrightness).toBeLessThan(startBrightness);
    expect(midBrightness).toBeGreaterThan(0.2);

    // At 100%
    vi.advanceTimersByTime(500);
    const endBrightness = anim.brightness();
    expect(endBrightness).toBeCloseTo(0.2, 1);

    anim.stop();
  });
});
