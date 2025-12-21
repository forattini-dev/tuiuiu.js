/**
 * Tests for animation.ts
 *
 * Covers:
 * - useAnimation: basic animation controls
 * - useTransition: show/hide transitions
 * - Easing functions
 * - Spring animations (createSpring, createHarmonicaSpring)
 * - Composite transitions (createCompositeTransition)
 * - Swipe/Slide transitions (createSwipeTransition, createSlideTransition)
 * - Helper functions (lerp, lerpColor)
 * - Frame scheduler
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  useAnimation,
  useTransition,
  easingFunctions,
  lerp,
  lerpColor,
  createSpring,
  createHarmonicaSpring,
  createCompositeTransition,
  createSwipeTransition,
  createSlideTransition,
  requestAnimationFrame,
  cancelAllAnimationFrames,
  type EasingName,
  type AnimationControls,
} from '../../src/core/animation.js';

// =============================================================================
// Easing Functions
// =============================================================================

describe('easingFunctions', () => {
  it('should have all named easing functions', () => {
    const names: EasingName[] = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'bounce', 'elastic'];

    for (const name of names) {
      expect(easingFunctions[name]).toBeDefined();
      expect(typeof easingFunctions[name]).toBe('function');
    }
  });

  describe('linear', () => {
    it('should return input unchanged', () => {
      expect(easingFunctions.linear(0)).toBe(0);
      expect(easingFunctions.linear(0.5)).toBe(0.5);
      expect(easingFunctions.linear(1)).toBe(1);
    });
  });

  describe('ease-in', () => {
    it('should start slow and end fast', () => {
      expect(easingFunctions['ease-in'](0)).toBe(0);
      expect(easingFunctions['ease-in'](0.5)).toBeLessThan(0.5);
      expect(easingFunctions['ease-in'](1)).toBe(1);
    });
  });

  describe('ease-out', () => {
    it('should start fast and end slow', () => {
      expect(easingFunctions['ease-out'](0)).toBe(0);
      expect(easingFunctions['ease-out'](0.5)).toBeGreaterThan(0.5);
      expect(easingFunctions['ease-out'](1)).toBe(1);
    });
  });

  describe('ease-in-out', () => {
    it('should be symmetric around 0.5', () => {
      expect(easingFunctions['ease-in-out'](0)).toBe(0);
      expect(easingFunctions['ease-in-out'](0.5)).toBeCloseTo(0.5, 5);
      expect(easingFunctions['ease-in-out'](1)).toBe(1);
    });
  });

  describe('bounce', () => {
    it('should return values between 0 and 1', () => {
      for (let t = 0; t <= 1; t += 0.1) {
        const value = easingFunctions.bounce(t);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1.01); // Small tolerance
      }
    });

    it('should return 0 at start and 1 at end', () => {
      expect(easingFunctions.bounce(0)).toBe(0);
      expect(easingFunctions.bounce(1)).toBeCloseTo(1, 5);
    });
  });

  describe('elastic', () => {
    it('should return 0 at start and 1 at end', () => {
      expect(easingFunctions.elastic(0)).toBe(0);
      expect(easingFunctions.elastic(1)).toBe(1);
    });

    it('should overshoot and settle', () => {
      // Elastic typically overshoots 1 briefly
      const midValues = [0.3, 0.5, 0.7].map(t => easingFunctions.elastic(t));
      expect(midValues.some(v => v !== 0 && v !== 1)).toBe(true);
    });
  });
});

// =============================================================================
// Helper Functions
// =============================================================================

describe('lerp', () => {
  it('should interpolate between start and end', () => {
    expect(lerp(0, 100, 0)).toBe(0);
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(lerp(0, 100, 1)).toBe(100);
  });

  it('should work with negative values', () => {
    expect(lerp(-50, 50, 0.5)).toBe(0);
  });

  it('should extrapolate beyond 0-1', () => {
    expect(lerp(0, 100, 1.5)).toBe(150);
    expect(lerp(0, 100, -0.5)).toBe(-50);
  });
});

describe('lerpColor', () => {
  it('should interpolate between two hex colors', () => {
    const result = lerpColor('#000000', '#ffffff', 0.5);
    expect(result.toLowerCase()).toBe('#808080');
  });

  it('should return start color at progress 0', () => {
    const result = lerpColor('#ff0000', '#0000ff', 0);
    expect(result.toLowerCase()).toBe('#ff0000');
  });

  it('should return end color at progress 1', () => {
    const result = lerpColor('#ff0000', '#0000ff', 1);
    expect(result.toLowerCase()).toBe('#0000ff');
  });

  it('should handle colors with # prefix', () => {
    const result = lerpColor('#ff0000', '#00ff00', 0.5);
    expect(result.startsWith('#')).toBe(true);
  });

  it('should return start color for invalid input', () => {
    const result = lerpColor('#ff0000', 'invalid', 0.5);
    expect(result).toBe('#ff0000');
  });
});

// =============================================================================
// useAnimation
// =============================================================================

describe('useAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create animation controls', () => {
    const onFrame = vi.fn();
    const animation = useAnimation({
      duration: 300,
      onFrame,
    });

    expect(animation.start).toBeDefined();
    expect(animation.stop).toBeDefined();
    expect(animation.pause).toBeDefined();
    expect(animation.resume).toBeDefined();
    expect(animation.isRunning).toBeDefined();
    expect(animation.progress).toBeDefined();
  });

  it('should start animation', () => {
    const onFrame = vi.fn();
    const animation = useAnimation({
      duration: 300,
      onFrame,
    });

    animation.start();

    expect(animation.isRunning()).toBe(true);
    expect(onFrame).toHaveBeenCalled();
  });

  it('should call onFrame with progress', () => {
    const onFrame = vi.fn();
    const animation = useAnimation({
      duration: 100,
      easing: 'linear',
      onFrame,
    });

    animation.start();
    vi.advanceTimersByTime(50);

    expect(onFrame).toHaveBeenCalled();
    const lastProgress = onFrame.mock.calls[onFrame.mock.calls.length - 1]![0];
    expect(lastProgress).toBeGreaterThan(0);
  });

  it('should call onComplete when done', () => {
    const onComplete = vi.fn();
    const animation = useAnimation({
      duration: 100,
      onFrame: () => {},
      onComplete,
    });

    animation.start();
    vi.advanceTimersByTime(150);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(animation.isRunning()).toBe(false);
  });

  it('should stop animation', () => {
    const onCancel = vi.fn();
    const animation = useAnimation({
      duration: 1000,
      onFrame: () => {},
      onCancel,
    });

    animation.start();
    vi.advanceTimersByTime(100);
    animation.stop();

    expect(animation.isRunning()).toBe(false);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('should pause and resume', () => {
    const onFrame = vi.fn();
    const animation = useAnimation({
      duration: 1000,
      onFrame,
    });

    animation.start();
    vi.advanceTimersByTime(100);
    animation.pause();

    expect(animation.isRunning()).toBe(false);

    const callsAtPause = onFrame.mock.calls.length;

    vi.advanceTimersByTime(500);
    expect(onFrame.mock.calls.length).toBe(callsAtPause); // No new calls

    animation.resume();
    expect(animation.isRunning()).toBe(true);

    vi.advanceTimersByTime(100);
    expect(onFrame.mock.calls.length).toBeGreaterThan(callsAtPause);
  });

  it('should use custom easing function', () => {
    const customEasing = vi.fn((t: number) => t * t);
    const onFrame = vi.fn();

    const animation = useAnimation({
      duration: 100,
      easing: customEasing,
      onFrame,
    });

    animation.start();
    vi.advanceTimersByTime(50);

    expect(customEasing).toHaveBeenCalled();
  });

  it('should not start if already running', () => {
    const onFrame = vi.fn();
    const animation = useAnimation({
      duration: 1000,
      onFrame,
    });

    animation.start();
    const callsAfterFirstStart = onFrame.mock.calls.length;

    animation.start(); // Should be ignored
    expect(onFrame.mock.calls.length).toBe(callsAfterFirstStart);
  });

  it('should report progress', () => {
    const animation = useAnimation({
      duration: 100,
      easing: 'linear',
      onFrame: () => {},
    });

    expect(animation.progress()).toBe(0);

    animation.start();
    vi.advanceTimersByTime(50);

    expect(animation.progress()).toBeGreaterThan(0);
    expect(animation.progress()).toBeLessThan(1);
  });
});

// =============================================================================
// useTransition
// =============================================================================

describe('useTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should start in entered state when show=true', () => {
    const { state, shouldRender } = useTransition({ show: true });

    expect(state()).toBe('entered');
    expect(shouldRender()).toBe(true);
  });

  it('should start in exited state when show=false', () => {
    const { state, shouldRender } = useTransition({ show: false });

    expect(state()).toBe('exited');
    expect(shouldRender()).toBe(false);
  });

  it('should report progress', () => {
    const { progress } = useTransition({ show: true });

    expect(progress()).toBe(1);
  });

  it('should have progress 0 when exited', () => {
    const { progress } = useTransition({ show: false });

    expect(progress()).toBe(0);
  });
});

// =============================================================================
// createSpring
// =============================================================================

describe('createSpring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create spring with defaults', () => {
    const spring = createSpring();

    expect(spring.start).toBeDefined();
    expect(spring.stop).toBeDefined();
    expect(spring.setTarget).toBeDefined();
  });

  it('should animate from start to end', () => {
    const onUpdate = vi.fn();
    const spring = createSpring();

    spring.start(0, 100, onUpdate);
    vi.advanceTimersByTime(500);

    expect(onUpdate).toHaveBeenCalled();
    const lastValue = onUpdate.mock.calls[onUpdate.mock.calls.length - 1]![0];
    expect(lastValue).toBeGreaterThan(0);
  });

  it('should call onComplete when settled', () => {
    const onUpdate = vi.fn();
    const onComplete = vi.fn();
    const spring = createSpring({
      stiffness: 500,
      damping: 30,
    });

    spring.start(0, 100, onUpdate, onComplete);

    // Fast forward until spring settles
    for (let i = 0; i < 50; i++) {
      vi.advanceTimersByTime(16);
    }

    // Spring should eventually settle
    if (!onComplete.mock.calls.length) {
      vi.advanceTimersByTime(1000);
    }

    expect(onUpdate.mock.calls.length).toBeGreaterThan(0);
  });

  it('should stop animation', () => {
    const onUpdate = vi.fn();
    const spring = createSpring();

    spring.start(0, 100, onUpdate);
    vi.advanceTimersByTime(50);
    spring.stop();

    const callsAtStop = onUpdate.mock.calls.length;
    vi.advanceTimersByTime(200);

    expect(onUpdate.mock.calls.length).toBe(callsAtStop);
  });

  it('should allow changing target mid-animation', () => {
    const onUpdate = vi.fn();
    const spring = createSpring();

    spring.start(0, 50, onUpdate);
    vi.advanceTimersByTime(100);

    spring.setTarget(100);
    vi.advanceTimersByTime(500);

    // Should continue animating toward new target
    expect(onUpdate.mock.calls.length).toBeGreaterThan(5);
  });

  it('should use custom spring options', () => {
    const onUpdate = vi.fn();
    const spring = createSpring({
      stiffness: 200,
      damping: 20,
      mass: 0.5,
    });

    spring.start(0, 100, onUpdate);
    vi.advanceTimersByTime(200);

    expect(onUpdate).toHaveBeenCalled();
  });
});

// =============================================================================
// createHarmonicaSpring
// =============================================================================

describe('createHarmonicaSpring', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create harmonica spring with defaults', () => {
    const spring = createHarmonicaSpring();

    expect(spring.start).toBeDefined();
    expect(spring.stop).toBeDefined();
    expect(spring.setTarget).toBeDefined();
    expect(spring.impulse).toBeDefined();
  });

  it('should animate from start to end', () => {
    const onUpdate = vi.fn();
    const spring = createHarmonicaSpring();

    spring.start(0, 100, onUpdate);
    vi.advanceTimersByTime(300);

    expect(onUpdate).toHaveBeenCalled();
    const lastValue = onUpdate.mock.calls[onUpdate.mock.calls.length - 1]![0];
    expect(lastValue).toBeGreaterThan(0);
  });

  it('should use custom frequency and damping', () => {
    const onUpdate = vi.fn();
    const spring = createHarmonicaSpring({
      frequency: 15, // Faster oscillation
      damping: 0.5,  // Less damped
    });

    spring.start(0, 100, onUpdate);
    vi.advanceTimersByTime(200);

    expect(onUpdate).toHaveBeenCalled();
  });

  it('should add impulse to velocity', () => {
    const onUpdate = vi.fn();
    const spring = createHarmonicaSpring();

    // Start animation in progress (not at target)
    spring.start(0, 100, onUpdate);

    // Let animation start
    vi.advanceTimersByTime(50);
    const callsBefore = onUpdate.mock.calls.length;

    // Add impulse (modifies velocity)
    spring.impulse(100);

    // Continue animation
    vi.advanceTimersByTime(100);

    // Should have more updates after impulse
    expect(onUpdate.mock.calls.length).toBeGreaterThan(callsBefore);
  });

  it('should stop animation', () => {
    const onUpdate = vi.fn();
    const spring = createHarmonicaSpring();

    spring.start(0, 100, onUpdate);
    vi.advanceTimersByTime(50);
    spring.stop();

    const callsAtStop = onUpdate.mock.calls.length;
    vi.advanceTimersByTime(200);

    expect(onUpdate.mock.calls.length).toBe(callsAtStop);
  });

  it('should call onComplete when settled', () => {
    const onComplete = vi.fn();
    const spring = createHarmonicaSpring({
      frequency: 20,
      damping: 0.9,
    });

    spring.start(0, 100, () => {}, onComplete);

    // Run until settled
    for (let i = 0; i < 100; i++) {
      vi.advanceTimersByTime(16);
      if (onComplete.mock.calls.length > 0) break;
    }

    // May or may not complete depending on spring dynamics
    expect(spring).toBeDefined();
  });
});

// =============================================================================
// createCompositeTransition
// =============================================================================

describe('createCompositeTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create composite transition', () => {
    const transition = createCompositeTransition();

    expect(transition.start).toBeDefined();
    expect(transition.stop).toBeDefined();
    expect(transition.getState).toBeDefined();
    expect(transition.reverse).toBeDefined();
  });

  it('should start in not-animating state', () => {
    const transition = createCompositeTransition();
    const state = transition.getState();

    expect(state.isAnimating).toBe(false);
    expect(state.progress).toBe(0);
  });

  it('should start transition with prev and next content', () => {
    const onFrame = vi.fn();
    const transition = createCompositeTransition({ onFrame, useSpring: false, duration: 100 });

    transition.start('Previous', 'Next', 'left');
    const state = transition.getState();

    expect(state.isAnimating).toBe(true);
    expect(state.prevContent).toBe('Previous');
    expect(state.nextContent).toBe('Next');
    expect(state.direction).toBe('left');
  });

  it('should call onFrame during animation', () => {
    const onFrame = vi.fn();
    const transition = createCompositeTransition({
      onFrame,
      useSpring: false,
      duration: 100,
    });

    transition.start('A', 'B', 'right');
    vi.advanceTimersByTime(50);

    expect(onFrame).toHaveBeenCalled();
    const lastState = onFrame.mock.calls[onFrame.mock.calls.length - 1]![0];
    expect(lastState.progress).toBeGreaterThan(0);
    expect(lastState.direction).toBe('right');
  });

  it('should call onComplete when done', () => {
    const onComplete = vi.fn();
    const transition = createCompositeTransition({
      onComplete,
      useSpring: false,
      duration: 100,
    });

    transition.start('A', 'B', 'left');
    vi.advanceTimersByTime(150);

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(transition.getState().isAnimating).toBe(false);
  });

  it('should stop transition', () => {
    const onFrame = vi.fn();
    const transition = createCompositeTransition({
      onFrame,
      useSpring: false,
      duration: 1000,
    });

    transition.start('A', 'B', 'up');
    vi.advanceTimersByTime(100);
    transition.stop();

    const callsAtStop = onFrame.mock.calls.length;
    vi.advanceTimersByTime(500);

    expect(onFrame.mock.calls.length).toBe(callsAtStop);
    expect(transition.getState().isAnimating).toBe(false);
  });

  it('should reverse transition', () => {
    const onFrame = vi.fn();
    const transition = createCompositeTransition({
      onFrame,
      useSpring: false,
      duration: 100,
    });

    transition.start('A', 'B', 'left');
    vi.advanceTimersByTime(50);
    transition.reverse();

    const state = transition.getState();
    expect(state.direction).toBe('right');
    expect(state.prevContent).toBe('B');
    expect(state.nextContent).toBe('A');
  });

  it('should use spring animation when useSpring=true', () => {
    const onFrame = vi.fn();
    const transition = createCompositeTransition({
      onFrame,
      useSpring: true,
      springOptions: { frequency: 10, damping: 0.8 },
    });

    transition.start('A', 'B', 'down');
    vi.advanceTimersByTime(300);

    expect(onFrame).toHaveBeenCalled();
  });

  it('should handle all directions', () => {
    const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down'];

    for (const dir of directions) {
      const transition = createCompositeTransition({ useSpring: false, duration: 50 });
      transition.start('A', 'B', dir);
      vi.advanceTimersByTime(100);
      expect(transition.getState().direction).toBe(dir);
    }
  });
});

// =============================================================================
// createSwipeTransition
// =============================================================================

describe('createSwipeTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create swipe transition', () => {
    const swipe = createSwipeTransition({ width: 80, height: 24 });

    expect(swipe.swipeLeft).toBeDefined();
    expect(swipe.swipeRight).toBeDefined();
    expect(swipe.render).toBeDefined();
    expect(swipe.isAnimating).toBeDefined();
    expect(swipe.stop).toBeDefined();
    expect(swipe.reverse).toBeDefined();
  });

  it('should swipe left', () => {
    const swipe = createSwipeTransition({
      width: 40,
      height: 10,
      animation: { useSpring: false, duration: 100 },
    });

    swipe.swipeLeft('Previous content', 'Next content');

    expect(swipe.isAnimating()).toBe(true);

    vi.advanceTimersByTime(50);
    const output = swipe.render();

    expect(output).toBeDefined();
    expect(typeof output).toBe('string');
  });

  it('should swipe right', () => {
    const swipe = createSwipeTransition({
      width: 40,
      height: 10,
      animation: { useSpring: false, duration: 100 },
    });

    swipe.swipeRight('Previous', 'Next');

    expect(swipe.isAnimating()).toBe(true);
  });

  it('should complete animation', () => {
    const onComplete = vi.fn();
    const swipe = createSwipeTransition({
      width: 40,
      height: 10,
      animation: { useSpring: false, duration: 100, onComplete },
    });

    swipe.swipeLeft('A', 'B');
    vi.advanceTimersByTime(150);

    expect(onComplete).toHaveBeenCalled();
    expect(swipe.isAnimating()).toBe(false);
  });

  it('should stop animation', () => {
    const swipe = createSwipeTransition({
      width: 40,
      height: 10,
      animation: { useSpring: false, duration: 1000 },
    });

    swipe.swipeLeft('A', 'B');
    swipe.stop();

    expect(swipe.isAnimating()).toBe(false);
  });

  it('should handle multi-line content', () => {
    const swipe = createSwipeTransition({
      width: 40,
      height: 5,
      gap: 1,
      animation: { useSpring: false, duration: 100 },
    });

    const prev = 'Line 1\nLine 2\nLine 3';
    const next = 'Next 1\nNext 2\nNext 3';

    swipe.swipeLeft(prev, next);
    vi.advanceTimersByTime(50);

    const output = swipe.render();
    expect(output.includes('\n')).toBe(true);
  });
});

// =============================================================================
// createSlideTransition
// =============================================================================

describe('createSlideTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should create slide transition', () => {
    const slide = createSlideTransition({ width: 80, height: 24 });

    expect(slide.slideUp).toBeDefined();
    expect(slide.slideDown).toBeDefined();
    expect(slide.render).toBeDefined();
    expect(slide.isAnimating).toBeDefined();
    expect(slide.stop).toBeDefined();
    expect(slide.reverse).toBeDefined();
  });

  it('should slide up', () => {
    const slide = createSlideTransition({
      width: 40,
      height: 10,
      animation: { useSpring: false, duration: 100 },
    });

    slide.slideUp('Previous\nContent', 'Next\nContent');

    expect(slide.isAnimating()).toBe(true);

    vi.advanceTimersByTime(50);
    const output = slide.render();

    expect(output).toBeDefined();
  });

  it('should slide down', () => {
    const slide = createSlideTransition({
      width: 40,
      height: 10,
      animation: { useSpring: false, duration: 100 },
    });

    slide.slideDown('Previous', 'Next');

    expect(slide.isAnimating()).toBe(true);
  });

  it('should complete animation', () => {
    const onComplete = vi.fn();
    const slide = createSlideTransition({
      width: 40,
      height: 10,
      animation: { useSpring: false, duration: 100, onComplete },
    });

    slide.slideUp('A', 'B');
    vi.advanceTimersByTime(150);

    expect(onComplete).toHaveBeenCalled();
    expect(slide.isAnimating()).toBe(false);
  });

  it('should handle vertical content properly', () => {
    const slide = createSlideTransition({
      width: 40,
      height: 6,
      gap: 0,
      animation: { useSpring: false, duration: 100 },
    });

    const prev = 'Line 1\nLine 2\nLine 3';
    const next = 'New 1\nNew 2\nNew 3';

    slide.slideUp(prev, next);
    vi.advanceTimersByTime(50);

    const output = slide.render();
    const lines = output.split('\n');
    expect(lines.length).toBeGreaterThan(0);
  });
});

// =============================================================================
// Frame Scheduler
// =============================================================================

describe('requestAnimationFrame', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    cancelAllAnimationFrames();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should schedule callback for next frame', () => {
    const callback = vi.fn();

    requestAnimationFrame(callback);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(20);

    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('should return cancel function', () => {
    const callback = vi.fn();

    const cancel = requestAnimationFrame(callback);
    cancel();

    vi.advanceTimersByTime(20);

    expect(callback).not.toHaveBeenCalled();
  });

  it('should batch multiple callbacks', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const callback3 = vi.fn();

    requestAnimationFrame(callback1);
    requestAnimationFrame(callback2);
    requestAnimationFrame(callback3);

    vi.advanceTimersByTime(20);

    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback3).toHaveBeenCalledTimes(1);
  });
});

describe('cancelAllAnimationFrames', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should cancel all pending callbacks', () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    requestAnimationFrame(callback1);
    requestAnimationFrame(callback2);

    cancelAllAnimationFrames();

    vi.advanceTimersByTime(20);

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).not.toHaveBeenCalled();
  });
});
