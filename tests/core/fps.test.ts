/**
 * Tests for FPS tracking
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  trackFrame,
  getFps,
  getFpsMetrics,
  resetFps,
  getFpsColor,
} from '../../src/core/fps.js';

describe('FPS Tracker', () => {
  beforeEach(() => {
    resetFps();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('trackFrame', () => {
    it('should increment total frames on each call', () => {
      const initial = getFpsMetrics().totalFrames;
      trackFrame();
      trackFrame();
      trackFrame();
      expect(getFpsMetrics().totalFrames).toBe(initial + 3);
    });

    it('should calculate FPS after 1 second', () => {
      // Track some frames
      for (let i = 0; i < 60; i++) {
        trackFrame();
      }

      // Initially FPS is 0 (hasn't been 1 second yet)
      expect(getFps()).toBe(0);

      // Advance 1 second
      vi.advanceTimersByTime(1000);
      trackFrame(); // Trigger FPS calculation

      // FPS is calculated based on frames in the last second
      expect(getFps()).toBeGreaterThan(0);
    });

    it('should update min and max FPS', () => {
      // First second: track frames
      for (let i = 0; i < 30; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);
      trackFrame();

      const firstFps = getFps();
      expect(getFpsMetrics().minFps).toBe(firstFps);
      expect(getFpsMetrics().maxFps).toBe(firstFps);

      // Second second: more frames
      for (let i = 0; i < 59; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);
      trackFrame();

      const secondFps = getFps();
      expect(getFpsMetrics().maxFps).toBe(secondFps);
      expect(getFpsMetrics().minFps).toBe(firstFps);
    });

    it('should maintain rolling average', () => {
      // Generate different FPS values across multiple seconds
      for (let second = 0; second < 5; second++) {
        const frames = 30 + second * 10;
        for (let i = 0; i < frames - 1; i++) {
          trackFrame();
        }
        vi.advanceTimersByTime(1000);
        trackFrame();
      }

      const metrics = getFpsMetrics();
      // avgFps should be average of recorded values
      expect(metrics.avgFps).toBeGreaterThan(0);
    });
  });

  describe('getFps', () => {
    it('should return 0 initially', () => {
      expect(getFps()).toBe(0);
    });

    it('should return current FPS after calculation', () => {
      for (let i = 0; i < 44; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);
      trackFrame();

      expect(getFps()).toBe(45);
    });
  });

  describe('getFpsMetrics', () => {
    it('should return all metrics', () => {
      const metrics = getFpsMetrics();

      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('avgFps');
      expect(metrics).toHaveProperty('minFps');
      expect(metrics).toHaveProperty('maxFps');
      expect(metrics).toHaveProperty('totalFrames');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('frameTime');
    });

    it('should calculate frameTime correctly', () => {
      for (let i = 0; i < 49; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);
      trackFrame();

      const metrics = getFpsMetrics();
      expect(metrics.fps).toBe(50);
      expect(metrics.frameTime).toBe(20); // 1000/50 = 20ms
    });

    it('should return 0 for frameTime when fps is 0', () => {
      const metrics = getFpsMetrics();
      expect(metrics.frameTime).toBe(0);
    });

    it('should return 0 for minFps when no frames tracked', () => {
      const metrics = getFpsMetrics();
      expect(metrics.minFps).toBe(0);
    });

    it('should calculate uptime', () => {
      vi.advanceTimersByTime(5000);
      const metrics = getFpsMetrics();
      expect(metrics.uptime).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('resetFps', () => {
    it('should reset all state', () => {
      // Generate some activity
      for (let i = 0; i < 59; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);
      trackFrame();

      expect(getFps()).toBe(60);

      resetFps();

      expect(getFps()).toBe(0);
      expect(getFpsMetrics().totalFrames).toBe(0);
      expect(getFpsMetrics().avgFps).toBe(0);
      expect(getFpsMetrics().minFps).toBe(0);
      expect(getFpsMetrics().maxFps).toBe(0);
    });
  });

  describe('getFpsColor', () => {
    it('should return green for fps >= 30', () => {
      expect(getFpsColor(30)).toBe('green');
      expect(getFpsColor(60)).toBe('green');
      expect(getFpsColor(120)).toBe('green');
    });

    it('should return yellow for 15 <= fps < 30', () => {
      expect(getFpsColor(15)).toBe('yellow');
      expect(getFpsColor(20)).toBe('yellow');
      expect(getFpsColor(29)).toBe('yellow');
    });

    it('should return red for fps < 15', () => {
      expect(getFpsColor(0)).toBe('red');
      expect(getFpsColor(10)).toBe('red');
      expect(getFpsColor(14)).toBe('red');
    });
  });
});
