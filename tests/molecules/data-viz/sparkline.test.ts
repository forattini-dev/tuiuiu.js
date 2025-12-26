/**
 * Tests for Sparkline component and utilities
 */

import { describe, it, expect } from 'vitest';
import {
  renderSparklineString,
  Sparkline,
  SparklineBuffer,
  createSparklineBuffer,
  renderBrailleSparkline,
  BLOCK_CHARS,
  ASCII_CHARS,
} from '../../../src/molecules/data-viz/sparkline.js';
import { renderOnce } from '../../../src/app/render-loop.js';

describe('Sparkline', () => {
  describe('renderSparklineString', () => {
    it('should render basic sparkline string', () => {
      const result = renderSparklineString([1, 5, 3, 8, 2, 7]);
      expect(result).toBeDefined();
      expect(result.length).toBe(6);
    });

    it('should handle empty data', () => {
      const result = renderSparklineString([], { width: 5 });
      expect(result).toBe('     ');
    });

    it('should use custom empty char', () => {
      const result = renderSparklineString([], { width: 3, emptyChar: '-' });
      expect(result).toBe('---');
    });

    it('should resample data to fit width', () => {
      const result = renderSparklineString([1, 2, 3, 4, 5, 6, 7, 8], { width: 4 });
      expect(result.length).toBe(4);
    });

    it('should pad data shorter than width', () => {
      const result = renderSparklineString([1, 2, 3], { width: 5, emptyChar: '-' });
      expect(result.length).toBe(5);
      expect(result.startsWith('--')).toBe(true);
    });

    it('should handle min/max values', () => {
      const result = renderSparklineString([50, 75, 100], { min: 0, max: 100 });
      expect(result).toBeDefined();
    });

    it('should use ascii style', () => {
      const result = renderSparklineString([1, 5, 3, 8], { style: 'ascii' });
      expect(result).toBeDefined();
      expect(result.length).toBe(4);
    });
  });

  describe('Sparkline component', () => {
    it('should render sparkline VNode', () => {
      const output = renderOnce(
        Sparkline({ data: [1, 2, 3, 4, 5] }),
        80
      );
      expect(output).toBeDefined();
    });

    it('should render with color', () => {
      const output = renderOnce(
        Sparkline({ data: [1, 2, 3], color: 'cyan' }),
        80
      );
      expect(output).toBeDefined();
    });

    it('should render with label', () => {
      const output = renderOnce(
        Sparkline({ data: [1, 2, 3], label: 'CPU:' }),
        80
      );
      expect(output).toContain('CPU:');
    });

    it('should render with showLabels', () => {
      const output = renderOnce(
        Sparkline({ data: [10, 20, 30], showLabels: true }),
        80
      );
      expect(output).toBeDefined();
    });

    it('should handle empty data', () => {
      const output = renderOnce(
        Sparkline({ data: [], width: 5 }),
        80
      );
      expect(output).toBeDefined();
    });
  });

  describe('SparklineBuffer', () => {
    it('should create buffer with default options', () => {
      const buffer = new SparklineBuffer();
      expect(buffer.length).toBe(0);
      expect(buffer.isFull).toBe(false);
    });

    it('should push values', () => {
      const buffer = new SparklineBuffer({ maxPoints: 5 });
      buffer.push(10);
      buffer.push(20);
      expect(buffer.length).toBe(2);
      expect(buffer.data()).toEqual([10, 20]);
    });

    it('should limit to maxPoints', () => {
      const buffer = new SparklineBuffer({ maxPoints: 3 });
      buffer.push(1);
      buffer.push(2);
      buffer.push(3);
      buffer.push(4);
      expect(buffer.length).toBe(3);
      expect(buffer.data()).toEqual([2, 3, 4]);
    });

    it('should push all values', () => {
      const buffer = new SparklineBuffer({ maxPoints: 10 });
      buffer.pushAll([1, 2, 3, 4, 5]);
      expect(buffer.length).toBe(5);
    });

    it('should get latest value', () => {
      const buffer = new SparklineBuffer();
      expect(buffer.latest()).toBeUndefined();
      buffer.push(5);
      buffer.push(10);
      expect(buffer.latest()).toBe(10);
    });

    it('should calculate average', () => {
      const buffer = new SparklineBuffer();
      expect(buffer.average()).toBe(0);
      buffer.pushAll([10, 20, 30]);
      expect(buffer.average()).toBe(20);
    });

    it('should get min value', () => {
      const buffer = new SparklineBuffer();
      expect(buffer.min()).toBe(0);
      buffer.pushAll([5, 10, 3, 8]);
      expect(buffer.min()).toBe(3);
    });

    it('should get max value', () => {
      const buffer = new SparklineBuffer();
      expect(buffer.max()).toBe(0);
      buffer.pushAll([5, 10, 3, 8]);
      expect(buffer.max()).toBe(10);
    });

    it('should clear data', () => {
      const buffer = new SparklineBuffer();
      buffer.pushAll([1, 2, 3]);
      buffer.clear();
      expect(buffer.length).toBe(0);
      expect(buffer.data()).toEqual([]);
    });

    it('should detect when full', () => {
      const buffer = new SparklineBuffer({ maxPoints: 3 });
      expect(buffer.isFull).toBe(false);
      buffer.pushAll([1, 2, 3]);
      expect(buffer.isFull).toBe(true);
    });

    it('should render sparkline string', () => {
      const buffer = new SparklineBuffer({ width: 10 });
      buffer.pushAll([1, 2, 3, 4, 5]);
      const result = buffer.render();
      expect(result).toBeDefined();
    });

    it('should render VNode', () => {
      const buffer = new SparklineBuffer({ width: 10 });
      buffer.pushAll([1, 2, 3, 4, 5]);
      const vnode = buffer.toVNode({ color: 'cyan' });
      const output = renderOnce(vnode, 80);
      expect(output).toBeDefined();
    });
  });

  describe('createSparklineBuffer', () => {
    it('should create buffer with factory function', () => {
      const buffer = createSparklineBuffer({ maxPoints: 50 });
      expect(buffer).toBeInstanceOf(SparklineBuffer);
    });

    it('should create buffer with default options', () => {
      const buffer = createSparklineBuffer();
      expect(buffer).toBeInstanceOf(SparklineBuffer);
    });
  });

  describe('renderBrailleSparkline', () => {
    it('should render braille sparkline', () => {
      const result = renderBrailleSparkline([1, 2, 3, 4, 5, 6, 7, 8]);
      expect(result).toBeDefined();
      expect(result.length).toBe(4); // 8 points / 2 = 4 chars
    });

    it('should handle empty data', () => {
      const result = renderBrailleSparkline([]);
      expect(result).toBe('');
    });

    it('should use custom width', () => {
      const result = renderBrailleSparkline([1, 2], { width: 5 });
      expect(result.length).toBe(5);
    });

    it('should respect min/max', () => {
      const result = renderBrailleSparkline([50, 75, 100], { min: 0, max: 100 });
      expect(result).toBeDefined();
    });
  });

  describe('character sets', () => {
    it('should export BLOCK_CHARS', () => {
      expect(BLOCK_CHARS).toBe('▁▂▃▄▅▆▇█');
      expect(BLOCK_CHARS.length).toBe(8);
    });

    it('should export ASCII_CHARS', () => {
      expect(ASCII_CHARS).toBe('_.-:=*#@');
      expect(ASCII_CHARS.length).toBe(8);
    });
  });
});
