/**
 * Tests for useFps hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useFps } from '../../src/hooks/use-fps.js';
import { resetFps, trackFrame } from '../../src/core/fps.js';

describe('useFps hook', () => {
  beforeEach(() => {
    resetFps();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('useFps', () => {
    it('should return fps, metrics, and color', () => {
      const result = useFps();

      expect(result).toHaveProperty('fps');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('color');
    });

    it('should call trackFrame on each invocation', () => {
      const initialFrames = useFps().metrics.totalFrames;

      useFps();
      useFps();
      useFps();

      const finalFrames = useFps().metrics.totalFrames;
      expect(finalFrames).toBe(initialFrames + 4); // +1 for each useFps call including last one
    });

    it('should return green color for high fps', () => {
      // Simulate 60 FPS (59 + 1 from useFps call after advance)
      for (let i = 0; i < 59; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);

      const result = useFps();
      expect(result.fps).toBe(60);
      expect(result.color).toBe('green');
    });

    it('should return yellow color for medium fps', () => {
      // Simulate 25 FPS
      for (let i = 0; i < 24; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);

      const result = useFps();
      expect(result.fps).toBe(25);
      expect(result.color).toBe('yellow');
    });

    it('should return red color for low fps', () => {
      // Simulate 10 FPS
      for (let i = 0; i < 9; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);

      const result = useFps();
      expect(result.fps).toBe(10);
      expect(result.color).toBe('red');
    });

    it('should return current metrics', () => {
      // Simulate some activity
      for (let i = 0; i < 44; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);

      const result = useFps();

      expect(result.metrics.fps).toBe(45);
      expect(result.metrics.totalFrames).toBeGreaterThanOrEqual(45);
      expect(result.metrics.avgFps).toBeGreaterThan(0);
    });

    it('should return green for fps exactly 30', () => {
      for (let i = 0; i < 29; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);

      const result = useFps();
      expect(result.fps).toBe(30);
      expect(result.color).toBe('green');
    });

    it('should return yellow for fps exactly 15', () => {
      for (let i = 0; i < 14; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);

      const result = useFps();
      expect(result.fps).toBe(15);
      expect(result.color).toBe('yellow');
    });

    it('should return red for fps exactly 14', () => {
      for (let i = 0; i < 13; i++) {
        trackFrame();
      }
      vi.advanceTimersByTime(1000);

      const result = useFps();
      expect(result.fps).toBe(14);
      expect(result.color).toBe('red');
    });
  });
});
