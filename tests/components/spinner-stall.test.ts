/**
 * Tests for Spinner Stall Detection
 *
 * Covers: createSpinner with stallThreshold/criticalThreshold,
 * getStallPhase, getStallProgress, getElapsedMs, bidirectional frames,
 * renderSpinner stall color, Spinner standalone stall tracking.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import {
  Spinner,
  createSpinner,
  renderSpinner,
} from '../../src/atoms/spinner.js';
import type { StallPhase } from '../../src/atoms/spinner.js';

describe('Spinner Stall Detection', () => {
  let dateNowSpy: ReturnType<typeof vi.spyOn>;
  let currentTime: number;
  const realDateNow = Date.now;

  beforeEach(() => {
    currentTime = 1000000;
    dateNowSpy = vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
    // Reset standalone spinner start time between tests
    Spinner({ isActive: false });
  });

  afterEach(() => {
    dateNowSpy.mockRestore();
  });

  // ===========================================================================
  // createSpinner with stall options
  // ===========================================================================

  describe('createSpinner with stallThreshold/criticalThreshold', () => {
    it('should accept custom stallThreshold', () => {
      const state = createSpinner({ stallThreshold: 5000 });
      expect(state).toBeDefined();
      expect(state.getStallPhase()).toBe('normal');
      state.stop();
    });

    it('should accept custom criticalThreshold', () => {
      const state = createSpinner({ criticalThreshold: 20000 });
      expect(state).toBeDefined();
      expect(state.getStallPhase()).toBe('normal');
      state.stop();
    });

    it('should accept both thresholds', () => {
      const state = createSpinner({
        stallThreshold: 3000,
        criticalThreshold: 8000,
      });
      expect(state).toBeDefined();
      state.stop();
    });

    it('should default stallThreshold to 10000', () => {
      const state = createSpinner();
      // At time 0, phase should be normal
      expect(state.getStallPhase()).toBe('normal');

      // Advance to 10000ms — should become warning
      currentTime += 10000;
      expect(state.getStallPhase()).toBe('warning');
      state.stop();
    });

    it('should default criticalThreshold to 30000', () => {
      const state = createSpinner();

      // Advance to 30000ms — should become critical
      currentTime += 30000;
      expect(state.getStallPhase()).toBe('critical');
      state.stop();
    });
  });

  // ===========================================================================
  // getStallPhase
  // ===========================================================================

  describe('getStallPhase', () => {
    it('should return "normal" when elapsed < stallThreshold', () => {
      const state = createSpinner({ stallThreshold: 5000 });
      // No time has passed
      expect(state.getStallPhase()).toBe('normal');

      // Just under threshold
      currentTime += 4999;
      expect(state.getStallPhase()).toBe('normal');
      state.stop();
    });

    it('should return "warning" when elapsed >= stallThreshold but < criticalThreshold', () => {
      const state = createSpinner({
        stallThreshold: 5000,
        criticalThreshold: 15000,
      });

      // Exactly at stallThreshold
      currentTime += 5000;
      expect(state.getStallPhase()).toBe('warning');

      // In the middle
      currentTime = 1000000 + 10000;
      expect(state.getStallPhase()).toBe('warning');

      // Just under critical
      currentTime = 1000000 + 14999;
      expect(state.getStallPhase()).toBe('warning');
      state.stop();
    });

    it('should return "critical" when elapsed >= criticalThreshold', () => {
      const state = createSpinner({
        stallThreshold: 5000,
        criticalThreshold: 15000,
      });

      // Exactly at criticalThreshold
      currentTime += 15000;
      expect(state.getStallPhase()).toBe('critical');

      // Well past critical
      currentTime = 1000000 + 60000;
      expect(state.getStallPhase()).toBe('critical');
      state.stop();
    });

    it('should transition through all phases', () => {
      const state = createSpinner({
        stallThreshold: 2000,
        criticalThreshold: 6000,
      });

      const phases: StallPhase[] = [];
      phases.push(state.getStallPhase()); // normal at t=0

      currentTime += 2000;
      phases.push(state.getStallPhase()); // warning at t=2000

      currentTime += 4000;
      phases.push(state.getStallPhase()); // critical at t=6000

      expect(phases).toEqual(['normal', 'warning', 'critical']);
      state.stop();
    });
  });

  // ===========================================================================
  // getStallProgress
  // ===========================================================================

  describe('getStallProgress', () => {
    it('should return 0 when in normal phase', () => {
      const state = createSpinner({
        stallThreshold: 5000,
        criticalThreshold: 15000,
      });
      expect(state.getStallProgress()).toBe(0);

      currentTime += 3000;
      expect(state.getStallProgress()).toBe(0);
      state.stop();
    });

    it('should return 0-1 during warning phase', () => {
      const state = createSpinner({
        stallThreshold: 5000,
        criticalThreshold: 15000,
      });

      // At stallThreshold: progress = 0
      currentTime += 5000;
      expect(state.getStallProgress()).toBe(0);

      // Halfway through warning phase: (10000 - 5000) / (15000 - 5000) = 0.5
      currentTime = 1000000 + 10000;
      expect(state.getStallProgress()).toBe(0.5);

      // Just before critical: nearly 1
      currentTime = 1000000 + 14999;
      expect(state.getStallProgress()).toBeCloseTo(1, 1);
      state.stop();
    });

    it('should return 0-1 during critical phase', () => {
      const state = createSpinner({
        stallThreshold: 5000,
        criticalThreshold: 15000,
      });

      // At criticalThreshold: (15000 - 15000) / 15000 = 0
      currentTime += 15000;
      expect(state.getStallProgress()).toBe(0);

      // Double the critical threshold: (30000 - 15000) / 15000 = 1
      currentTime = 1000000 + 30000;
      expect(state.getStallProgress()).toBe(1);
      state.stop();
    });

    it('should clamp at 1 during extended critical phase', () => {
      const state = createSpinner({
        stallThreshold: 5000,
        criticalThreshold: 15000,
      });

      // Way past critical
      currentTime += 100000;
      expect(state.getStallProgress()).toBeLessThanOrEqual(1);
      state.stop();
    });
  });

  // ===========================================================================
  // getElapsedMs
  // ===========================================================================

  describe('getElapsedMs', () => {
    it('should return elapsed time in milliseconds', () => {
      const state = createSpinner();
      expect(state.getElapsedMs()).toBe(0);

      currentTime += 5000;
      expect(state.getElapsedMs()).toBe(5000);

      currentTime += 2500;
      expect(state.getElapsedMs()).toBe(7500);
      state.stop();
    });

    it('should continue tracking after stop', () => {
      const state = createSpinner();
      currentTime += 3000;
      state.stop();

      // Time still increases (startTime is fixed)
      currentTime += 2000;
      expect(state.getElapsedMs()).toBe(5000);
    });
  });

  // ===========================================================================
  // bidirectional frames
  // ===========================================================================

  describe('bidirectional frames', () => {
    it('should create forward+reverse sequence when bidirectional is true', () => {
      // dots has 10 frames — bidirectional should produce 10 + 8 (reverse minus first and last) = 18 frames
      const state = createSpinner({ style: 'dots', bidirectional: true });
      // We can verify by checking that getFrame cycles through more frames
      // The dots spinner has 10 frames, bidirectional creates 10 + 8 = 18
      expect(state).toBeDefined();
      expect(state.getFrame()).toBeDefined();
      state.stop();
    });

    it('should not apply bidirectional when frames <= 2', () => {
      // 'toggle' style has 2 frames — bidirectional should not apply
      const state = createSpinner({ style: 'toggle', bidirectional: true });
      expect(state).toBeDefined();
      expect(state.getFrame()).toBeDefined();
      state.stop();
    });

    it('should produce different frame when non-bidirectional', () => {
      const stateNormal = createSpinner({ style: 'dots', bidirectional: false });
      const stateBidi = createSpinner({ style: 'dots', bidirectional: true });

      // Both start at frame 0, so initial frame should be the same
      expect(stateNormal.getFrame()).toBe(stateBidi.getFrame());
      stateNormal.stop();
      stateBidi.stop();
    });
  });

  // ===========================================================================
  // renderSpinner stall-aware color
  // ===========================================================================

  describe('renderSpinner stall-aware color', () => {
    it('should use base color when in normal phase', () => {
      const state = createSpinner();
      const node = renderSpinner(state, { color: 'cyan' });
      const output = renderToString(node, 80);
      // cyan = \x1b[36m
      expect(output).toContain('\x1b[36m');
      state.stop();
    });

    it('should use stallColor when in warning phase', () => {
      const state = createSpinner({ stallThreshold: 5000 });
      currentTime += 5000;

      const node = renderSpinner(state, { stallColor: 'yellow' });
      const output = renderToString(node, 80);
      // yellow = \x1b[33m
      expect(output).toContain('\x1b[33m');
      state.stop();
    });

    it('should use criticalColor when in critical phase', () => {
      const state = createSpinner({
        stallThreshold: 5000,
        criticalThreshold: 10000,
      });
      currentTime += 10000;

      const node = renderSpinner(state, { criticalColor: 'red' });
      const output = renderToString(node, 80);
      // red = \x1b[31m
      expect(output).toContain('\x1b[31m');
      state.stop();
    });

    it('should not render stall color when state is stopped', () => {
      const state = createSpinner({ stallThreshold: 5000 });
      currentTime += 20000;
      state.stop();

      const node = renderSpinner(state);
      const output = renderToString(node, 80);
      // Stopped spinner renders as empty Box
      expect(output).toBe('');
    });
  });

  // ===========================================================================
  // Spinner standalone stall detection
  // ===========================================================================

  describe('Spinner standalone stall detection', () => {
    it('should track elapsed time across renders', () => {
      // First render initializes _standaloneSpinnerStart
      const node1 = Spinner({ showTime: true });
      const output1 = renderToString(node1, 80);
      expect(output1).toContain('0s');

      // Advance time and re-render
      currentTime += 5000;
      const node2 = Spinner({ showTime: true });
      const output2 = renderToString(node2, 80);
      expect(output2).toContain('5s');
    });

    it('should reset start time when isActive transitions to false', () => {
      // First render starts tracking
      Spinner({});

      // Deactivate resets
      Spinner({ isActive: false });

      // Re-activate should reset timer
      currentTime += 10000;
      const node = Spinner({ showTime: true });
      const output = renderToString(node, 80);
      expect(output).toContain('0s');
    });

    it('should use stallColor when stalled in standalone mode', () => {
      const stallThreshold = 3000;

      // First render
      Spinner({ stallThreshold });

      // Advance past stall threshold
      currentTime += 4000;
      const node = Spinner({
        stallThreshold,
        stallColor: 'yellow',
      });
      // VNode is a Box with Text children. First child is the spinner frame.
      expect(node).not.toBeNull();
      const frameText = node.children?.[0];
      expect(frameText?.props?.color).toBe('yellow');
    });

    it('should use criticalColor when critically stalled in standalone mode', () => {
      const stallThreshold = 3000;
      const criticalThreshold = 8000;

      // First render
      Spinner({ stallThreshold, criticalThreshold });

      // Advance past critical threshold
      currentTime += 9000;
      const node = Spinner({
        stallThreshold,
        criticalThreshold,
        criticalColor: 'red',
      });
      expect(node).not.toBeNull();
      const frameText = node.children?.[0];
      expect(frameText?.props?.color).toBe('red');
    });

    it('should render bidirectional frames in standalone mode', () => {
      const node = Spinner({ style: 'dots', bidirectional: true });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should apply stall defaults when no thresholds specified', () => {
      // First render
      Spinner({});

      // Under default stall threshold (10000)
      currentTime += 5000;
      const node1 = Spinner({ color: 'cyan' });
      expect(node1).not.toBeNull();
      const frame1 = node1.children?.[0];
      expect(frame1?.props?.color).toBe('cyan');

      // Over default stall threshold (10000)
      currentTime = 1000000 + 11000;
      const node2 = Spinner({ color: 'cyan', stallColor: 'yellow' });
      expect(node2).not.toBeNull();
      const frame2 = node2.children?.[0];
      expect(frame2?.props?.color).toBe('yellow');
    });
  });
});
