/**
 * Tests for ProgressBar Component
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { ProgressBar, createProgressBar, renderProgressBar, MultiProgressBar } from '../../src/atoms/index.js';

describe('ProgressBar', () => {
  describe('ProgressBar component', () => {
    it('should render at 0%', () => {
      const node = ProgressBar({ value: 0, max: 100 });
      const output = renderToString(node, 80);
      expect(output).toContain('0%');
    });

    it('should render at 50%', () => {
      const node = ProgressBar({ value: 50, max: 100 });
      const output = renderToString(node, 80);
      expect(output).toContain('50%');
    });

    it('should render at 100%', () => {
      const node = ProgressBar({ value: 100, max: 100 });
      const output = renderToString(node, 80);
      expect(output).toContain('100%');
    });

    it('should render with block style', () => {
      const node = ProgressBar({ value: 50, max: 100, style: 'block' });
      const output = renderToString(node, 80);
      expect(output).toContain('█');
    });

    it('should render with smooth style', () => {
      const node = ProgressBar({ value: 50, max: 100, style: 'smooth' });
      const output = renderToString(node, 80);
      expect(output).toContain('━');
    });

    it('should render with line style', () => {
      const node = ProgressBar({ value: 50, max: 100, style: 'line' });
      const output = renderToString(node, 80);
      expect(output).toContain('═');
    });

    it('should render with dots style', () => {
      const node = ProgressBar({ value: 50, max: 100, style: 'dots' });
      const output = renderToString(node, 80);
      expect(output).toContain('●');
    });

    it('should render with braille style', () => {
      const node = ProgressBar({ value: 50, max: 100, style: 'braille' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with ascii style', () => {
      const node = ProgressBar({ value: 50, max: 100, style: 'ascii' });
      const output = renderToString(node, 80);
      expect(output).toContain('#');
    });

    it('should render with brackets border', () => {
      const node = ProgressBar({ value: 50, max: 100, borderStyle: 'brackets' });
      const output = renderToString(node, 80);
      expect(output).toContain('[');
      expect(output).toContain(']');
    });

    it('should render with pipes border', () => {
      const node = ProgressBar({ value: 50, max: 100, borderStyle: 'pipes' });
      const output = renderToString(node, 80);
      expect(output).toContain('|');
    });

    it('should render with arrows border', () => {
      const node = ProgressBar({ value: 50, max: 100, borderStyle: 'arrows' });
      const output = renderToString(node, 80);
      expect(output).toContain('▐');
      expect(output).toContain('▌');
    });

    it('should render without border', () => {
      const node = ProgressBar({ value: 50, max: 100, borderStyle: 'none' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should hide percentage', () => {
      const node = ProgressBar({ value: 50, max: 100, showPercentage: false });
      const output = renderToString(node, 80);
      expect(output).not.toContain('%');
    });

    it('should render with label', () => {
      const node = ProgressBar({ value: 50, max: 100, label: 'Progress:' });
      const output = renderToString(node, 80);
      expect(output).toContain('Progress:');
    });

    it('should render with custom color', () => {
      const node = ProgressBar({ value: 50, max: 100, color: 'green' });
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[32m'); // Green
    });

    it('should render with custom width', () => {
      const node = ProgressBar({ value: 50, max: 100, width: 20 });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should clamp values below 0', () => {
      const node = ProgressBar({ value: -10, max: 100 });
      const output = renderToString(node, 80);
      expect(output).toContain('0%');
    });

    it('should clamp values above max', () => {
      const node = ProgressBar({ value: 150, max: 100 });
      const output = renderToString(node, 80);
      expect(output).toContain('100%');
    });

    it('should render indeterminate mode', () => {
      const node = ProgressBar({ indeterminate: true });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render indeterminate with marquee style', () => {
      const node = ProgressBar({ indeterminate: true, indeterminateStyle: 'marquee' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render indeterminate with fill-and-clear style', () => {
      const node = ProgressBar({ indeterminate: true, indeterminateStyle: 'fill-and-clear' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should handle partial characters for block style', () => {
      // Progress that creates partial width (e.g., 25% of 40 = 10 chars exactly)
      const node = ProgressBar({ value: 25, max: 100, style: 'block', width: 40 });
      const output = renderToString(node, 80);
      expect(output).toContain('█');
    });

    it('should handle partial characters for braille style', () => {
      const node = ProgressBar({ value: 33, max: 100, style: 'braille', width: 40 });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should use default max when value is 0', () => {
      const node = ProgressBar({ value: 0 });
      const output = renderToString(node, 80);
      expect(output).toContain('0%');
    });

    it('should infer max=1 when value <= 1', () => {
      const node = ProgressBar({ value: 0.5 });
      const output = renderToString(node, 80);
      expect(output).toContain('50%');
    });

    it('should infer max=100 when value > 1', () => {
      const node = ProgressBar({ value: 75 });
      const output = renderToString(node, 80);
      expect(output).toContain('75%');
    });
  });

  describe('createProgressBar', () => {
    it('should create progress state', () => {
      const state = createProgressBar();
      expect(state.progress()).toBe(0);
    });

    it('should set progress', () => {
      const state = createProgressBar();
      state.setProgress(50, 100);
      expect(state.progress()).toBe(0.5);
    });

    it('should increment progress', () => {
      const state = createProgressBar({ max: 100 });
      state.increment(25);
      expect(state.progress()).toBe(0.25);
    });

    it('should track elapsed time', () => {
      const state = createProgressBar();
      const elapsed = state.getElapsed();
      expect(typeof elapsed).toBe('number');
    });

    it('should calculate ETA', () => {
      const state = createProgressBar();
      state.setProgress(50, 100);
      const eta = state.getEta();
      expect(typeof eta).toBe('number');
    });

    it('should calculate speed', () => {
      const state = createProgressBar();
      state.increment(10);
      const speed = state.getSpeed();
      expect(typeof speed).toBe('number');
    });

    it('should reset progress', () => {
      const state = createProgressBar();
      state.setProgress(50, 100);
      state.reset();
      expect(state.progress()).toBe(0);
    });

    it('should clamp progress', () => {
      const state = createProgressBar();
      state.setProgress(150, 100);
      expect(state.progress()).toBe(1);
    });

    it('should clamp progress below 0', () => {
      const state = createProgressBar();
      state.setProgress(-50, 100);
      expect(state.progress()).toBe(0);
    });

    it('should create with initial value', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      expect(state.progress()).toBe(0.5);
    });

    it('should return Infinity for ETA at 0 progress', () => {
      const state = createProgressBar();
      expect(state.getEta()).toBe(Infinity);
    });

    it('should return 0 speed with no elapsed time', () => {
      const state = createProgressBar();
      // Speed is items/elapsed, if elapsed ~0 it should return 0 or near 0
      const speed = state.getSpeed();
      expect(typeof speed).toBe('number');
    });

    it('should track processed items', () => {
      const state = createProgressBar({ max: 100 });
      state.increment(10);
      state.increment(20);
      expect(state.processedItems()).toBe(30);
    });

    it('should reset processed items', () => {
      const state = createProgressBar({ max: 100 });
      state.increment(25);
      state.reset();
      expect(state.processedItems()).toBe(0);
    });

    it('should use default max from options', () => {
      const state = createProgressBar({ max: 200 });
      state.increment(100);
      expect(state.progress()).toBe(0.5);
    });
  });

  describe('renderProgressBar', () => {
    it('should render state', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state);
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should show percentage', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { showPercentage: true });
      const output = renderToString(node, 80);
      expect(output).toContain('50%');
    });

    it('should show value', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { showValue: true, value: 50, max: 100 });
      const output = renderToString(node, 80);
      expect(output).toContain('50/100');
    });

    it('should show ETA', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { showEta: true });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should show speed', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { showSpeed: true, speed: 10 });
      const output = renderToString(node, 80);
      expect(output).toContain('10.0/s');
    });

    it('should apply gradient', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { gradient: ['red', 'yellow', 'green'] });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should show label', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { label: 'Downloading:' });
      const output = renderToString(node, 80);
      expect(output).toContain('Downloading:');
    });

    it('should show description', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { description: 'file.txt' });
      const output = renderToString(node, 80);
      expect(output).toContain('file.txt');
    });

    it('should render indeterminate classic', () => {
      const state = createProgressBar();
      const node = renderProgressBar(state, { indeterminate: true, indeterminateStyle: 'classic' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render indeterminate marquee', () => {
      const state = createProgressBar();
      const node = renderProgressBar(state, { indeterminate: true, indeterminateStyle: 'marquee' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render indeterminate fill-and-clear', () => {
      const state = createProgressBar();
      const node = renderProgressBar(state, { indeterminate: true, indeterminateStyle: 'fill-and-clear' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with fill-and-clear and custom fillStep', () => {
      const state = createProgressBar();
      const node = renderProgressBar(state, { indeterminate: true, indeterminateStyle: 'fill-and-clear', fillStep: 2 });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with brackets border style', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { borderStyle: 'brackets' });
      const output = renderToString(node, 80);
      expect(output).toContain('[');
      expect(output).toContain(']');
    });

    it('should render with pipes border style', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { borderStyle: 'pipes' });
      const output = renderToString(node, 80);
      expect(output).toContain('|');
    });

    it('should render with arrows border style', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { borderStyle: 'arrows' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with none border style', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { borderStyle: 'none' });
      const output = renderToString(node, 80);
      // With none border, the bar should render without border characters
      expect(output).toBeDefined();
      expect(output).toContain('█');
    });

    it('should render all bar styles', () => {
      const styles = ['block', 'smooth', 'line', 'dots', 'braille', 'ascii'] as const;
      for (const style of styles) {
        const state = createProgressBar({ value: 50, max: 100 });
        const node = renderProgressBar(state, { style });
        const output = renderToString(node, 80);
        expect(output).toBeDefined();
      }
    });

    it('should hide percentage when indeterminate', () => {
      const state = createProgressBar();
      const node = renderProgressBar(state, { indeterminate: true, showPercentage: true });
      const output = renderToString(node, 80);
      expect(output).not.toContain('%');
    });

    it('should show speed from state when not provided', () => {
      const state = createProgressBar({ max: 100 });
      state.increment(50);
      const node = renderProgressBar(state, { showSpeed: true });
      const output = renderToString(node, 80);
      // Speed might be shown with /s suffix
      expect(output).toBeDefined();
    });

    it('should render with custom speedUnit', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { showSpeed: true, speed: 5, speedUnit: 'MB/s' });
      const output = renderToString(node, 80);
      expect(output).toContain('MB/s');
    });

    it('should not show ETA when indeterminate', () => {
      const state = createProgressBar();
      const node = renderProgressBar(state, { indeterminate: true, showEta: true });
      const output = renderToString(node, 80);
      expect(output).not.toContain('ETA');
    });
  });

  describe('MultiProgressBar', () => {
    it('should render multiple segments', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 30, color: 'green', label: 'Done' },
          { value: 20, color: 'yellow', label: 'Progress' },
        ],
        total: 100,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('[');
      expect(output).toContain(']');
    });

    it('should show legend', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 30, color: 'green', label: 'Done' },
        ],
        total: 100,
        showLegend: true,
      });
      const output = renderToString(node, 80);
      // Legend shows labels and values - check bar is rendered with segments
      expect(output).toContain('[');
      expect(output).toContain('█');
    });

    it('should hide legend', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 30, color: 'green', label: 'Done' },
        ],
        total: 100,
        showLegend: false,
      });
      const output = renderToString(node, 80);
      expect(output).not.toContain('Done:');
    });

    it('should fill remaining with empty', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 30, color: 'green' },
        ],
        total: 100,
        width: 40,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('░');
    });

    it('should render with custom width', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 50, color: 'blue' },
        ],
        total: 100,
        width: 20,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should handle segments that fill entire bar', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 50, color: 'green' },
          { value: 50, color: 'blue' },
        ],
        total: 100,
        width: 40,
      });
      const output = renderToString(node, 80);
      expect(output).not.toContain('░');
    });

    it('should handle segments exceeding total', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 80, color: 'green' },
          { value: 80, color: 'blue' },
        ],
        total: 100,
        width: 40,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should handle segment with 0 value', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 0, color: 'green', label: 'Empty' },
          { value: 50, color: 'blue', label: 'Half' },
        ],
        total: 100,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render segments without labels', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 30, color: 'green' },
          { value: 30, color: 'yellow' },
        ],
        total: 100,
        showLegend: true,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should use default width', () => {
      const node = MultiProgressBar({
        segments: [{ value: 50, color: 'cyan' }],
        total: 100,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle 0 width', () => {
      const node = ProgressBar({ value: 50, max: 100, width: 0 });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should handle very large values', () => {
      const node = ProgressBar({ value: 1000000, max: 10000000 });
      const output = renderToString(node, 80);
      expect(output).toContain('10%');
    });

    it('should handle decimal values', () => {
      const node = ProgressBar({ value: 33.33, max: 100 });
      const output = renderToString(node, 80);
      expect(output).toContain('33%');
    });

    it('should handle empty options for ProgressBar', () => {
      const node = ProgressBar({});
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should handle empty options for createProgressBar', () => {
      const state = createProgressBar({});
      expect(state.progress()).toBe(0);
    });

    it('should handle max of 0', () => {
      // Max of 0 would cause division by zero - test that it handles gracefully
      const node = ProgressBar({ value: 50, max: 0 });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with background', () => {
      const node = ProgressBar({ value: 25, max: 100, background: 'gray' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render state with gradient', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { gradient: ['red', 'green'] });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render state with single gradient color', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, { gradient: ['blue'] });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should handle ETA display with no progress', () => {
      const state = createProgressBar({ value: 0, max: 100 });
      const node = renderProgressBar(state, { showEta: true });
      const output = renderToString(node, 80);
      // ETA should not show if progress is 0 (would be Infinity)
      expect(output).toBeDefined();
    });
  });
});
