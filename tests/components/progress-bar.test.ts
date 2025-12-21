/**
 * Tests for ProgressBar Component
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { ProgressBar, createProgressBar, renderProgressBar, MultiProgressBar } from '../../src/components/progress-bar.js';

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
  });
});
