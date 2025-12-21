/**
 * Tests for Spinner Component
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { Spinner, createSpinner, renderSpinner } from '../../src/atoms/index.js';

describe('Spinner', () => {
  describe('Spinner component', () => {
    it('should render spinner with default style', () => {
      const node = Spinner({});
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
      expect(output.length).toBeGreaterThan(0);
    });

    it('should render with dots style', () => {
      const node = Spinner({ style: 'dots' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with line style', () => {
      const node = Spinner({ style: 'line' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with arc style', () => {
      const node = Spinner({ style: 'arc' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with circle style', () => {
      const node = Spinner({ style: 'circle' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with square style', () => {
      const node = Spinner({ style: 'square' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with bounce style', () => {
      const node = Spinner({ style: 'bounce' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with arrow style', () => {
      const node = Spinner({ style: 'arrow' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with clock style', () => {
      const node = Spinner({ style: 'clock' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with custom text', () => {
      const node = Spinner({ text: 'Loading data...' });
      const output = renderToString(node, 80);
      expect(output).toContain('Loading data...');
    });

    it('should render with custom color', () => {
      const node = Spinner({ color: 'magenta' });
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[35m'); // Magenta
    });

    it('should return empty box when not active', () => {
      const node = Spinner({ isActive: false });
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });

    it('should show time when enabled', () => {
      const node = Spinner({ showTime: true });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should show tokens when enabled', () => {
      const node = Spinner({ showTokens: true, tokens: 1500 });
      const output = renderToString(node, 80);
      expect(output).toContain('1.5K tokens');
    });

    it('should show progress when enabled', () => {
      const node = Spinner({ showProgress: true, progress: 50 });
      const output = renderToString(node, 80);
      expect(output).toContain('50%');
    });

    it('should show hint when provided', () => {
      const node = Spinner({ hint: 'press q to cancel' });
      const output = renderToString(node, 80);
      expect(output).toContain('press q to cancel');
    });

    it('should render with earth style', () => {
      const node = Spinner({ style: 'earth' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with moon style', () => {
      const node = Spinner({ style: 'moon' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with hearts style', () => {
      const node = Spinner({ style: 'hearts' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should render with binary style', () => {
      const node = Spinner({ style: 'binary' });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });

  describe('createSpinner', () => {
    it('should create spinner state', () => {
      const state = createSpinner();
      expect(state).toBeDefined();
      expect(state.frame).toBeDefined();
      expect(state.isActive).toBeDefined();
      expect(state.start).toBeDefined();
      expect(state.stop).toBeDefined();
      state.stop();
    });

    it('should track frame changes', () => {
      const state = createSpinner({ style: 'dots' });
      const frame = state.getFrame();
      expect(frame).toBeDefined();
      state.stop();
    });

    it('should provide text', () => {
      const state = createSpinner({ text: 'Custom text' });
      expect(state.getText()).toBe('Custom text');
      state.stop();
    });

    it('should track elapsed time', () => {
      const state = createSpinner();
      const elapsed = state.getElapsed();
      expect(typeof elapsed).toBe('number');
      state.stop();
    });

    it('should stop and start', () => {
      const state = createSpinner();
      expect(state.isActive()).toBe(true);
      state.stop();
      expect(state.isActive()).toBe(false);
      state.start();
      expect(state.isActive()).toBe(true);
      state.stop();
    });
  });

  describe('renderSpinner', () => {
    it('should render spinner state', () => {
      const state = createSpinner();
      const node = renderSpinner(state);
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
      state.stop();
    });

    it('should show time', () => {
      const state = createSpinner();
      const node = renderSpinner(state, { showTime: true });
      const output = renderToString(node, 80);
      expect(output).toContain('0s');
      state.stop();
    });

    it('should show tokens', () => {
      const state = createSpinner();
      const node = renderSpinner(state, { showTokens: true, tokens: 500 });
      const output = renderToString(node, 80);
      expect(output).toContain('500 tokens');
      state.stop();
    });

    it('should return empty when not active', () => {
      const state = createSpinner();
      state.stop();
      const node = renderSpinner(state);
      const output = renderToString(node, 80);
      expect(output).toBe('');
    });

    it('should apply custom colors', () => {
      const state = createSpinner();
      const node = renderSpinner(state, { color: 'green', textColor: 'yellow' });
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[32m'); // Green
      state.stop();
    });
  });
});
