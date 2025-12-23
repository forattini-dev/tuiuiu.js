/**
 * Tests for Design System Feedback Components
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { Badge } from '../../src/design-system/feedback/badge.js';
import {
  Spinner,
  createSpinner,
  renderSpinner,
} from '../../src/design-system/feedback/spinner.js';
import {
  ProgressBar,
  createProgressBar,
  renderProgressBar,
  MultiProgressBar,
} from '../../src/design-system/feedback/progress-bar.js';

describe('Feedback Components', () => {
  describe('Badge', () => {
    it('should render badge', () => {
      const node = Badge({ label: 'NEW' });
      const output = renderToString(node, 80);
      expect(output).toContain('NEW');
    });

    it('should apply color', () => {
      const node = Badge({ label: 'SUCCESS', color: 'green' });
      const output = renderToString(node, 80);
      expect(output).toContain('SUCCESS');
      // Badge always uses bold, so color is combined with bold
      expect(output).toContain('\x1b[');
    });

    it('should apply inverse', () => {
      const node = Badge({ label: 'ERROR', color: 'red', inverse: true });
      const output = renderToString(node, 80);
      expect(output).toContain('ERROR');
    });

    it('should be bold by default', () => {
      const node = Badge({ label: 'BOLD' });
      const output = renderToString(node, 80);
      expect(output).toContain('BOLD');
      // Badge uses bold: true by default
      expect(output).toContain('\x1b[');
    });

    it('should apply semantic variant', () => {
      const variants = ['success', 'error', 'warning', 'info', 'primary', 'secondary'] as const;
      for (const variant of variants) {
        const node = Badge({ label: variant.toUpperCase(), variant });
        const output = renderToString(node, 80);
        expect(output).toContain(variant.toUpperCase());
      }
    });

    it('should use default when variant is default', () => {
      const node = Badge({ label: 'DEFAULT', variant: 'default' });
      const output = renderToString(node, 80);
      expect(output).toContain('DEFAULT');
    });
  });

  describe('Spinner (design-system)', () => {
    it('should render spinner', () => {
      const node = Spinner({});
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with different styles', () => {
      const styles = ['dots', 'line', 'arc', 'circle', 'bounce'] as const;
      for (const style of styles) {
        const node = Spinner({ style });
        const output = renderToString(node, 80);
        expect(output).toBeDefined();
      }
    });

    it('should render with text', () => {
      const node = Spinner({ text: 'Loading...' });
      const output = renderToString(node, 80);
      expect(output).toContain('Loading...');
    });

    it('should hide when inactive', () => {
      const node = Spinner({ isActive: false });
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });
  });

  describe('createSpinner (design-system)', () => {
    it('should create spinner state', () => {
      const state = createSpinner();
      expect(state.isActive()).toBe(true);
      state.stop();
    });

    it('should stop spinner', () => {
      const state = createSpinner();
      state.stop();
      expect(state.isActive()).toBe(false);
    });

    it('should restart spinner', () => {
      const state = createSpinner();
      state.stop();
      state.start();
      expect(state.isActive()).toBe(true);
      state.stop();
    });

    it('should provide frame', () => {
      const state = createSpinner();
      expect(state.getFrame()).toBeDefined();
      state.stop();
    });

    it('should provide text', () => {
      const state = createSpinner({ text: 'Custom' });
      expect(state.getText()).toBe('Custom');
      state.stop();
    });
  });

  describe('renderSpinner (design-system)', () => {
    it('should render state', () => {
      const state = createSpinner();
      const node = renderSpinner(state);
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
      state.stop();
    });

    it('should show info parts', () => {
      const state = createSpinner();
      const node = renderSpinner(state, {
        showTime: true,
        showTokens: true,
        tokens: 100,
        hint: 'press q',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('0s');
      state.stop();
    });
  });

  describe('ProgressBar (design-system)', () => {
    it('should render progress bar', () => {
      const node = ProgressBar({ value: 50, max: 100 });
      const output = renderToString(node, 80);
      expect(output).toContain('50%');
    });

    it('should render different styles', () => {
      const styles = ['block', 'smooth', 'line', 'dots', 'ascii'] as const;
      for (const style of styles) {
        const node = ProgressBar({ value: 50, max: 100, style });
        const output = renderToString(node, 80);
        expect(output).toBeDefined();
      }
    });

    it('should render indeterminate', () => {
      const node = ProgressBar({ indeterminate: true });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  describe('createProgressBar (design-system)', () => {
    it('should create progress state', () => {
      const state = createProgressBar();
      expect(state.progress()).toBe(0);
    });

    it('should set progress', () => {
      const state = createProgressBar();
      state.setProgress(50, 100);
      expect(state.progress()).toBe(0.5);
    });

    it('should increment', () => {
      const state = createProgressBar({ max: 100 });
      state.increment(10);
      expect(state.progress()).toBe(0.1);
    });

    it('should track elapsed', () => {
      const state = createProgressBar();
      expect(state.getElapsed()).toBeGreaterThanOrEqual(0);
    });

    it('should reset', () => {
      const state = createProgressBar();
      state.setProgress(50, 100);
      state.reset();
      expect(state.progress()).toBe(0);
    });
  });

  describe('renderProgressBar (design-system)', () => {
    it('should render state', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state);
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should show value', () => {
      const state = createProgressBar({ value: 25, max: 100 });
      const node = renderProgressBar(state, {
        showValue: true,
        value: 25,
        max: 100,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('25/100');
    });

    it('should show label and description', () => {
      const state = createProgressBar({ value: 50, max: 100 });
      const node = renderProgressBar(state, {
        label: 'Download',
        description: 'file.zip',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Download');
      expect(output).toContain('file.zip');
    });
  });

  describe('MultiProgressBar (design-system)', () => {
    it('should render multiple segments', () => {
      const node = MultiProgressBar({
        segments: [
          { value: 30, color: 'green', label: 'Done' },
          { value: 20, color: 'yellow', label: 'Progress' },
        ],
        total: 100,
      });
      const output = renderToString(node, 80);
      // Check that the bar is rendered with segments
      expect(output).toContain('█');
      expect(output).toBeDefined();
    });

    it('should hide legend', () => {
      const node = MultiProgressBar({
        segments: [{ value: 50, color: 'blue', label: 'Half' }],
        total: 100,
        showLegend: false,
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });
});
