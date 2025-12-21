/**
 * Tests for Screen Transitions
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ScreenTransitionManager,
  createScreenTransitionManager,
  getTransitionManager,
  resetTransitionManager,
  createTransition,
  createSpringTransition,
  calculateTransitionOffsets,
  applyHorizontalOffset,
  applyVerticalOffset,
  applyOpacity,
  compositeScreens,
  useScreenTransition,
  transitionPresets,
  DEFAULT_FORWARD_TRANSITION,
  DEFAULT_BACKWARD_TRANSITION,
  SPRING_FORWARD_TRANSITION,
  FADE_TRANSITION,
  NO_TRANSITION,
  type ScreenTransitionConfig,
  type ScreenTransitionState,
  type TransitionOffsets,
} from '../../src/core/transitions.js';
import { createScreen, type Screen } from '../../src/core/screen.js';

// Mock timers for animation testing
vi.useFakeTimers();

// Simple components for testing
const HomeComponent = () => null;
const SettingsComponent = () => null;

describe('Screen Transitions', () => {
  beforeEach(() => {
    resetTransitionManager();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Transition Configurations', () => {
    it('should have correct default forward transition', () => {
      expect(DEFAULT_FORWARD_TRANSITION.type).toBe('slide-left');
      expect(DEFAULT_FORWARD_TRANSITION.duration).toBe(300);
      expect(DEFAULT_FORWARD_TRANSITION.easing).toBe('ease-out');
      expect(DEFAULT_FORWARD_TRANSITION.useSpring).toBe(false);
    });

    it('should have correct default backward transition', () => {
      expect(DEFAULT_BACKWARD_TRANSITION.type).toBe('slide-right');
      expect(DEFAULT_BACKWARD_TRANSITION.duration).toBe(300);
    });

    it('should have correct spring transition config', () => {
      expect(SPRING_FORWARD_TRANSITION.type).toBe('slide-left');
      expect(SPRING_FORWARD_TRANSITION.useSpring).toBe(true);
      expect(SPRING_FORWARD_TRANSITION.springOptions?.frequency).toBe(8);
      expect(SPRING_FORWARD_TRANSITION.springOptions?.damping).toBe(0.85);
    });

    it('should have correct fade transition config', () => {
      expect(FADE_TRANSITION.type).toBe('fade');
      expect(FADE_TRANSITION.duration).toBe(200);
      expect(FADE_TRANSITION.easing).toBe('ease-in-out');
    });

    it('should have correct no-transition config', () => {
      expect(NO_TRANSITION.type).toBe('none');
      expect(NO_TRANSITION.duration).toBe(0);
    });
  });

  describe('Transition Presets', () => {
    it('should have iOS preset', () => {
      expect(transitionPresets.ios.forward.type).toBe('slide-left');
      expect(transitionPresets.ios.forward.useSpring).toBe(true);
      expect(transitionPresets.ios.backward.type).toBe('slide-right');
    });

    it('should have Android preset', () => {
      expect(transitionPresets.android.forward.type).toBe('fade');
      expect(transitionPresets.android.backward.type).toBe('fade');
    });

    it('should have Material preset', () => {
      expect(transitionPresets.material.forward.type).toBe('slide-up');
      expect(transitionPresets.material.backward.type).toBe('slide-down');
    });

    it('should have Quick preset', () => {
      expect(transitionPresets.quick.forward.duration).toBe(150);
      expect(transitionPresets.quick.backward.duration).toBe(150);
    });

    it('should have Smooth preset', () => {
      expect(transitionPresets.smooth.forward.useSpring).toBe(true);
      expect(transitionPresets.smooth.forward.springOptions?.frequency).toBe(6);
    });

    it('should have Instant preset', () => {
      expect(transitionPresets.instant.forward.type).toBe('none');
      expect(transitionPresets.instant.backward.type).toBe('none');
    });
  });

  describe('createTransition', () => {
    it('should create a transition with defaults', () => {
      const transition = createTransition('fade');

      expect(transition.type).toBe('fade');
      expect(transition.duration).toBe(300);
      expect(transition.easing).toBe('ease-out');
      expect(transition.useSpring).toBe(false);
    });

    it('should create a transition with custom options', () => {
      const transition = createTransition('slide-up', {
        duration: 500,
        easing: 'ease-in',
      });

      expect(transition.type).toBe('slide-up');
      expect(transition.duration).toBe(500);
      expect(transition.easing).toBe('ease-in');
    });
  });

  describe('createSpringTransition', () => {
    it('should create a spring transition with defaults', () => {
      const transition = createSpringTransition('slide-left');

      expect(transition.type).toBe('slide-left');
      expect(transition.useSpring).toBe(true);
      expect(transition.springOptions?.frequency).toBe(8);
      expect(transition.springOptions?.damping).toBe(0.85);
    });

    it('should create a spring transition with custom options', () => {
      const transition = createSpringTransition('slide-right', {
        frequency: 10,
        damping: 0.9,
      });

      expect(transition.springOptions?.frequency).toBe(10);
      expect(transition.springOptions?.damping).toBe(0.9);
    });
  });

  describe('calculateTransitionOffsets', () => {
    const width = 80;
    const height = 24;

    it('should calculate slide-left offsets at 0% progress', () => {
      const state: ScreenTransitionState = {
        isTransitioning: true,
        progress: 0,
        type: 'slide-left',
        direction: 'forward',
        fromScreen: null,
        toScreen: null,
      };

      const offsets = calculateTransitionOffsets(state, width, height);

      // Use toEqual to handle -0 vs +0 distinction
      expect(offsets.from.x).toEqual(0);
      expect(offsets.to.x).toBe(width);
    });

    it('should calculate slide-left offsets at 50% progress', () => {
      const state: ScreenTransitionState = {
        isTransitioning: true,
        progress: 0.5,
        type: 'slide-left',
        direction: 'forward',
        fromScreen: null,
        toScreen: null,
      };

      const offsets = calculateTransitionOffsets(state, width, height);

      expect(offsets.from.x).toBe(-40);
      expect(offsets.to.x).toBe(40);
    });

    it('should calculate slide-left offsets at 100% progress', () => {
      const state: ScreenTransitionState = {
        isTransitioning: true,
        progress: 1,
        type: 'slide-left',
        direction: 'forward',
        fromScreen: null,
        toScreen: null,
      };

      const offsets = calculateTransitionOffsets(state, width, height);

      expect(offsets.from.x).toBe(-width);
      expect(offsets.to.x).toBe(0);
    });

    it('should calculate slide-right offsets', () => {
      const state: ScreenTransitionState = {
        isTransitioning: true,
        progress: 0.5,
        type: 'slide-right',
        direction: 'backward',
        fromScreen: null,
        toScreen: null,
      };

      const offsets = calculateTransitionOffsets(state, width, height);

      expect(offsets.from.x).toBe(40);
      expect(offsets.to.x).toBe(-40);
    });

    it('should calculate slide-up offsets', () => {
      const state: ScreenTransitionState = {
        isTransitioning: true,
        progress: 0.5,
        type: 'slide-up',
        direction: 'forward',
        fromScreen: null,
        toScreen: null,
      };

      const offsets = calculateTransitionOffsets(state, width, height);

      expect(offsets.from.y).toBe(-12);
      expect(offsets.to.y).toBe(12);
    });

    it('should calculate slide-down offsets', () => {
      const state: ScreenTransitionState = {
        isTransitioning: true,
        progress: 0.5,
        type: 'slide-down',
        direction: 'backward',
        fromScreen: null,
        toScreen: null,
      };

      const offsets = calculateTransitionOffsets(state, width, height);

      expect(offsets.from.y).toBe(12);
      expect(offsets.to.y).toBe(-12);
    });

    it('should calculate fade offsets', () => {
      const state: ScreenTransitionState = {
        isTransitioning: true,
        progress: 0.5,
        type: 'fade',
        direction: 'forward',
        fromScreen: null,
        toScreen: null,
      };

      const offsets = calculateTransitionOffsets(state, width, height);

      expect(offsets.from.opacity).toBe(0.5);
      expect(offsets.to.opacity).toBe(0.5);
    });

    it('should calculate scale offsets', () => {
      const state: ScreenTransitionState = {
        isTransitioning: true,
        progress: 0.5,
        type: 'scale',
        direction: 'forward',
        fromScreen: null,
        toScreen: null,
      };

      const offsets = calculateTransitionOffsets(state, width, height);

      expect(offsets.from.scale).toBeCloseTo(0.95);
      expect(offsets.to.scale).toBeCloseTo(0.95);
      expect(offsets.from.opacity).toBe(0.5);
      expect(offsets.to.opacity).toBe(0.5);
    });

    it('should calculate none offsets (instant)', () => {
      const state: ScreenTransitionState = {
        isTransitioning: true,
        progress: 0.6,
        type: 'none',
        direction: 'forward',
        fromScreen: null,
        toScreen: null,
      };

      const offsets = calculateTransitionOffsets(state, width, height);

      // At 60% progress (past threshold), from is hidden, to is visible
      expect(offsets.from.opacity).toBe(0);
      expect(offsets.to.opacity).toBe(1);
    });
  });

  describe('applyHorizontalOffset', () => {
    const width = 10;

    it('should not modify content with zero offset', () => {
      const content = 'HelloWorld';
      const result = applyHorizontalOffset(content, 0, width);
      expect(result).toBe(content);
    });

    it('should shift content right with positive offset', () => {
      const content = 'Hello';
      const result = applyHorizontalOffset(content, 3, width);
      expect(result).toBe('   Hello');
    });

    it('should shift content left with negative offset', () => {
      const content = 'HelloWorld';
      const result = applyHorizontalOffset(content, -3, width);
      expect(result).toBe('loWorld   ');
    });

    it('should handle multiline content', () => {
      const content = 'Line1\nLine2';
      const result = applyHorizontalOffset(content, 2, width);
      expect(result).toBe('  Line1\n  Line2');
    });
  });

  describe('applyVerticalOffset', () => {
    const height = 5;

    it('should not modify content with zero offset', () => {
      const content = 'Line1\nLine2\nLine3';
      const result = applyVerticalOffset(content, 0, height);
      expect(result).toBe(content);
    });

    it('should shift content down with positive offset', () => {
      const content = 'Line1\nLine2';
      const result = applyVerticalOffset(content, 2, height);
      const lines = result.split('\n');
      expect(lines[0]).toBe('');
      expect(lines[1]).toBe('');
      expect(lines[2]).toBe('Line1');
      expect(lines[3]).toBe('Line2');
    });

    it('should shift content up with negative offset', () => {
      const content = 'Line1\nLine2\nLine3\nLine4';
      const result = applyVerticalOffset(content, -2, height);
      const lines = result.split('\n');
      expect(lines[0]).toBe('Line3');
      expect(lines[1]).toBe('Line4');
    });
  });

  describe('applyOpacity', () => {
    it('should return content unchanged at full opacity', () => {
      const content = 'Hello';
      const result = applyOpacity(content, 1);
      expect(result).toBe(content);
    });

    it('should return spaces at zero opacity', () => {
      const content = 'Hello';
      const result = applyOpacity(content, 0);
      expect(result).toBe('     ');
    });

    it('should handle multiline at zero opacity', () => {
      const content = 'Hi\nBye';
      const result = applyOpacity(content, 0);
      expect(result).toBe('  \n   ');
    });

    it('should return content at partial opacity (simplified)', () => {
      // Current implementation returns content as-is for partial opacity
      const content = 'Hello';
      const result = applyOpacity(content, 0.5);
      expect(result).toBe(content);
    });
  });

  describe('compositeScreens', () => {
    const width = 10;
    const height = 3;

    it('should composite screens during fade transition', () => {
      const from = 'From\nFrom\nFrom';
      const to = 'To\nTo\nTo';
      const offsets: TransitionOffsets = {
        from: { x: 0, y: 0, opacity: 0.3, scale: 1 },
        to: { x: 0, y: 0, opacity: 0.7, scale: 1 },
      };

      const result = compositeScreens(from, to, offsets, width, height);

      // With to.opacity > 0.5, should show 'to' content
      expect(result.split('\n')[0]).toBe('To');
    });

    it('should composite screens during horizontal slide', () => {
      const from = 'AAAAAAAAAA';
      const to = 'BBBBBBBBBB';
      const offsets: TransitionOffsets = {
        from: { x: -5, y: 0, opacity: 1, scale: 1 },
        to: { x: 5, y: 0, opacity: 1, scale: 1 },
      };

      const result = compositeScreens(from, to, offsets, width, height);
      const lines = result.split('\n');

      // Should have mix of content due to horizontal offset
      expect(lines[0]?.length).toBe(width);
    });
  });

  describe('ScreenTransitionManager', () => {
    it('should create with default options', () => {
      const manager = createScreenTransitionManager();

      expect(manager.isTransitioning).toBe(false);
      expect(manager.progress).toBe(0);
    });

    it('should create with custom options', () => {
      const manager = createScreenTransitionManager({
        width: 100,
        height: 30,
        defaultForward: FADE_TRANSITION,
      });

      expect(manager).toBeDefined();
    });

    it('should update dimensions', () => {
      const manager = createScreenTransitionManager();
      manager.setDimensions(120, 40);

      // Test by running a transition and checking offsets
      expect(manager).toBeDefined();
    });

    it('should set default transitions', () => {
      const manager = createScreenTransitionManager();
      manager.setDefaults(FADE_TRANSITION, transitionPresets.android.backward);

      expect(manager).toBeDefined();
    });

    it('should handle instant transition (type: none)', async () => {
      const manager = createScreenTransitionManager();
      const from = createScreen(HomeComponent);
      const to = createScreen(SettingsComponent);

      const promise = manager.start(from, to, 'forward', undefined, NO_TRANSITION);
      await promise;

      expect(manager.isTransitioning).toBe(false);
      expect(manager.progress).toBe(1);
    });

    it('should handle instant transition (duration: 0)', async () => {
      const manager = createScreenTransitionManager();
      const from = createScreen(HomeComponent);
      const to = createScreen(SettingsComponent);

      const config: ScreenTransitionConfig = {
        type: 'slide-left',
        duration: 0,
      };

      const promise = manager.start(from, to, 'forward', undefined, config);
      await promise;

      expect(manager.isTransitioning).toBe(false);
    });

    it('should start easing-based transition', async () => {
      const manager = createScreenTransitionManager();
      const from = createScreen(HomeComponent);
      const to = createScreen(SettingsComponent);

      const onFrame = vi.fn();
      const promise = manager.start(from, to, 'forward', onFrame, {
        type: 'slide-left',
        duration: 100,
        easing: 'linear',
      });

      expect(manager.isTransitioning).toBe(true);

      // Advance timers to complete animation
      vi.advanceTimersByTime(50);
      expect(onFrame).toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      await promise;

      expect(manager.isTransitioning).toBe(false);
    });

    it('should start spring-based transition', async () => {
      const manager = createScreenTransitionManager();
      const from = createScreen(HomeComponent);
      const to = createScreen(SettingsComponent);

      const onFrame = vi.fn();
      const promise = manager.start(from, to, 'forward', onFrame, {
        type: 'slide-left',
        useSpring: true,
        springOptions: { frequency: 15, damping: 1 },
      });

      expect(manager.isTransitioning).toBe(true);

      // Advance timers - spring takes longer to settle
      vi.advanceTimersByTime(500);

      expect(onFrame).toHaveBeenCalled();
    });

    it('should stop transition', async () => {
      const manager = createScreenTransitionManager();
      const from = createScreen(HomeComponent);
      const to = createScreen(SettingsComponent);

      manager.start(from, to, 'forward', undefined, {
        type: 'fade',
        duration: 1000,
      });

      expect(manager.isTransitioning).toBe(true);

      manager.stop();

      expect(manager.isTransitioning).toBe(false);
    });

    it('should get current offsets', () => {
      const manager = createScreenTransitionManager({ width: 80, height: 24 });
      const offsets = manager.getOffsets();

      expect(offsets.from).toBeDefined();
      expect(offsets.to).toBeDefined();
      expect(offsets.from.x).toBe(0);
      expect(offsets.from.y).toBe(0);
    });

    it('should use default forward transition', async () => {
      const manager = createScreenTransitionManager();
      const to = createScreen(SettingsComponent);

      const promise = manager.start(null, to, 'forward');

      expect(manager.state().type).toBe('slide-left');

      vi.advanceTimersByTime(500);
      manager.stop();
    });

    it('should use default backward transition', async () => {
      const manager = createScreenTransitionManager();
      const to = createScreen(HomeComponent);

      const promise = manager.start(null, to, 'backward');

      expect(manager.state().type).toBe('slide-right');

      manager.stop();
    });

    it('should stop previous transition when starting new one', async () => {
      const manager = createScreenTransitionManager();
      const screen1 = createScreen(HomeComponent);
      const screen2 = createScreen(SettingsComponent);
      const screen3 = createScreen(HomeComponent);

      // Start first transition
      manager.start(screen1, screen2, 'forward', undefined, {
        type: 'fade',
        duration: 500,
      });

      vi.advanceTimersByTime(100);
      expect(manager.isTransitioning).toBe(true);

      // Start second transition (should stop first)
      manager.start(screen2, screen3, 'forward', undefined, NO_TRANSITION);

      expect(manager.isTransitioning).toBe(false);
    });
  });

  describe('Global Transition Manager', () => {
    it('should provide global instance', () => {
      const manager1 = getTransitionManager();
      const manager2 = getTransitionManager();

      expect(manager1).toBe(manager2);
    });

    it('should reset global instance', () => {
      const manager1 = getTransitionManager();
      resetTransitionManager();
      const manager2 = getTransitionManager();

      expect(manager1).not.toBe(manager2);
    });
  });

  describe('useScreenTransition hook', () => {
    it('should create transition hook', () => {
      const transition = useScreenTransition({
        width: 80,
        height: 24,
      });

      expect(transition.run).toBeDefined();
      expect(transition.stop).toBeDefined();
      expect(transition.isTransitioning).toBeDefined();
      expect(transition.progress).toBeDefined();
      expect(transition.render).toBeDefined();
    });

    it('should run transition', async () => {
      const transition = useScreenTransition();
      const from = createScreen(HomeComponent);
      const to = createScreen(SettingsComponent);

      expect(transition.isTransitioning()).toBe(false);

      const promise = transition.run(from, to, 'forward', NO_TRANSITION);
      await promise;

      expect(transition.isTransitioning()).toBe(false);
    });

    it('should render composited screens', () => {
      const transition = useScreenTransition({
        width: 10,
        height: 3,
      });

      const fromContent = 'From';
      const toContent = 'To';

      const result = transition.render(fromContent, toContent);

      expect(typeof result).toBe('string');
    });

    it('should stop transition', () => {
      const transition = useScreenTransition();
      const from = createScreen(HomeComponent);
      const to = createScreen(SettingsComponent);

      transition.run(from, to, 'forward', {
        type: 'fade',
        duration: 1000,
      });

      expect(transition.isTransitioning()).toBe(true);

      transition.stop();

      expect(transition.isTransitioning()).toBe(false);
    });

    it('should get offsets', () => {
      const transition = useScreenTransition();
      const offsets = transition.getOffsets();

      expect(offsets.from).toBeDefined();
      expect(offsets.to).toBeDefined();
    });

    it('should provide state accessor', () => {
      const transition = useScreenTransition();
      const state = transition.state();

      expect(state.isTransitioning).toBe(false);
      expect(state.progress).toBe(0);
    });

    it('should provide manager reference', () => {
      const transition = useScreenTransition();

      expect(transition.manager).toBeInstanceOf(ScreenTransitionManager);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null from screen', async () => {
      const manager = createScreenTransitionManager();
      const to = createScreen(HomeComponent);

      const promise = manager.start(null, to, 'forward', undefined, NO_TRANSITION);
      await promise;

      expect(manager.state().fromScreen).toBeNull();
      expect(manager.state().toScreen).toBe(to);
    });

    it('should handle empty content in composite', () => {
      const offsets: TransitionOffsets = {
        from: { x: 0, y: 0, opacity: 1, scale: 1 },
        to: { x: 0, y: 0, opacity: 1, scale: 1 },
      };

      const result = compositeScreens('', '', offsets, 10, 3);
      expect(typeof result).toBe('string');
    });

    it('should handle content shorter than width', () => {
      const content = 'Hi';
      const result = applyHorizontalOffset(content, 3, 10);
      expect(result).toBe('   Hi');
    });

    it('should handle content shorter than height', () => {
      const content = 'Line1';
      const result = applyVerticalOffset(content, 1, 5);
      const lines = result.split('\n');
      expect(lines[0]).toBe('');
      expect(lines[1]).toBe('Line1');
    });
  });
});
